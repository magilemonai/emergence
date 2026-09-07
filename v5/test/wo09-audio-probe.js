#!/usr/bin/env node
// WO-09 audio probe: launches Chrome like v5/tools/shoot.js does, but with the autoplay policy
// relaxed, so the AudioContext can actually reach 'running' without a human gesture.
// Usage: node v5/test/wo09-audio-probe.js
// It reports numbers only (ctx state, gain envelopes, voice amplitudes) and every console error.
// Not named *.test.js on purpose: v5/test.js must not spawn a browser.
import { spawn } from 'node:child_process';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9401 + Math.floor(Math.random() * 40);
const file = path.resolve('v5/audio/bench.html');
const url = 'file://' + file + '#scene=audio-bench';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800',
  '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--allow-file-access-from-files', 'about:blank']);

(async () => {
  let target;
  for (let i = 0; i < 80; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      target = l.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
    } catch (e) {}
    await sleep(250);
  }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const onEvent = {};
  const send = (m, p = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    else if (m.method && onEvent[m.method]) onEvent[m.method](m.params);
  });
  await new Promise((r) => ws.addEventListener('open', r));

  const errors = [];
  onEvent['Runtime.consoleAPICalled'] = (p) => { if (p.type === 'error') errors.push((p.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ')); };
  onEvent['Runtime.exceptionThrown'] = (p) => errors.push('EXCEPTION ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));

  await send('Page.enable'); await send('Runtime.enable');
  const loaded = new Promise((r) => { onEvent['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url }); await loaded; await sleep(900);

  const ev = async (x) => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) errors.push('EVAL ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result?.value;
  };
  const show = (label, v) => console.log(label, typeof v === 'string' ? v : JSON.stringify(v));

  // 1. start() on the synthetic gesture the bench already fired
  await ev('window.__V5.audio.start()');
  await sleep(400);
  show('1 ctx after start:', await ev('window.__V5.audio.info().ctx'));

  // 2. voices follow flow: amplitudes with the pipes running, then with the flow cut
  await sleep(700);
  show('2a voices with flow:', await ev('JSON.stringify(window.__V5.audio.info().voices)'));
  show('2a peak/limit/bpm:', await ev('(function(){var i=window.__V5.audio.info();return JSON.stringify({peak:i.peak,limit:i.limit,bpm:i.bpm,ceiling:i.ceiling});})()'));
  show('2b voices after 3s of zero flow:', await ev(`(function(){
    var V = window.__V5, es = V.sim.state.edges;
    for (var i=0;i<60;i++) { for (var j=0;j<es.length;j++) es[j].flow = 0; V.audio.tick(0.05); }
    return JSON.stringify(V.audio.info().voices);
  })()`));

  // 3. beds crossfade on setBed: sample the two element volumes across the 1.2s fade
  show('3 crossfade envelope:', await ev(`(function(){
    var V = window.__V5, b = V.audio.beds;
    V.audio.setBed(1);
    var out = [];
    return new Promise(function(res){
      V.audio.setBed(2);
      var k = 0;
      var iv = setInterval(function(){
        out.push({ ms: k * 200, bed: b.key, fade: +b.fade.toFixed(2),
          v1: +((b.els[1] && b.els[1].volume) || 0).toFixed(4), v2: +((b.els[2] && b.els[2].volume) || 0).toFixed(4) });
        if (++k > 8) { clearInterval(iv); res(JSON.stringify(out)); }
      }, 200);
    });
  })()`));

  // 4. rupture: the bed crosses and the voices glide to the cluster
  show('4a rupture bed + voices at +0.8s:', await ev(`(function(){
    var V = window.__V5;
    V.audio.rupture();
    for (var i=0;i<16;i++) V.audio.tick(0.05);
    var i2 = V.audio.info();
    return JSON.stringify({ bed: i2.bed.key, fade: i2.bed.fade, rup: i2.rup, peak: i2.peak, voices: i2.voices });
  })()`));
  await sleep(1200);
  show('4b after the glide and decay:', await ev(`(function(){
    var V = window.__V5;
    for (var i=0;i<80;i++) V.audio.tick(0.05);
    var i2 = V.audio.info();
    return JSON.stringify({ rup: i2.rup, peak: i2.peak, bed: i2.bed, amps: i2.voices.map(function(v){return v.amp;}) });
  })()`));

  // 5. surface: the Origins bed reversed at half speed
  show('5 surface:', await ev('window.__V5.audio.surface().then(function(ok){ var i=window.__V5.audio.info(); return JSON.stringify({ok:ok, surface:i.surface, fail:i.surfaceFail}); })'));

  // 6. sfx bursts on the same graph
  show('6 sfx:', await ev('(function(){ var V=window.__V5; V.audio.sfx("buy"); V.audio.sfx("ev"); V.audio.sfx("nope"); return JSON.stringify({err: V.audio.info().err}); })()'));
  await sleep(300);
  show('7 final info:', await ev('JSON.stringify(window.__V5.audio.info())'));

  console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
  ws.close(); chrome.kill();
  process.exit(errors.length ? 2 : 0);
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
