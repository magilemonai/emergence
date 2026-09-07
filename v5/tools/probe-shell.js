#!/usr/bin/env node
// WO-11 shell probe: drives the REAL page through the services the shell owns.
//   node v5/tools/probe-shell.js [--file v5/index.html]
// Checks: a run saves and a reload resumes it; a 10-minute absence replays deterministically; Escape opens
// settings and pausing freezes sim.t; an openEra swaps the HUD, locks the camera and shows the title card.
// Exit 1 on a failed check, 2 on a console error.
import { spawn } from 'node:child_process'; import path from 'node:path';

const args = process.argv.slice(2);
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : 'v5/index.html';
const URL_BASE = 'file://' + path.resolve(fileArg);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9341 + Math.floor(Math.random() * 40);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--allow-file-access-from-files', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const checks = [];
const ok = (name, pass, detail) => { checks.push({ name, pass: !!pass, detail: detail === undefined ? '' : String(detail) }); };

(async () => {
  let target;
  for (let i = 0; i < 80; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); target = l.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch (e) { }
    await sleep(250);
  }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); let id = 0; const pending = new Map(); const onEvent = {};
  const send = (m, p = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    else if (m.method && onEvent[m.method]) onEvent[m.method](m.params);
  });
  await new Promise(r => ws.addEventListener('open', r));
  const errors = [];
  onEvent['Runtime.consoleAPICalled'] = p => { if (p.type === 'error') errors.push((p.args || []).map(a => a.value ?? a.description ?? a.type).join(' ')); };
  onEvent['Runtime.exceptionThrown'] = p => errors.push('EXCEPTION ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
  await send('Page.enable'); await send('Runtime.enable');

  const ev = async (x) => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) errors.push('EVAL ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result?.value;
  };
  // via about:blank, so that dropping a #scene from the URL is a real reload and not a same-document jump
  const load = async (hash) => {
    const blank = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
    await send('Page.navigate', { url: 'about:blank' });
    await blank;
    const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
    await send('Page.navigate', { url: URL_BASE + (hash || '') });
    await loaded; await sleep(1100);
  };

  // the two screens this order owns get captured while the probe is standing on them
  const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : '/tmp';
  const shot = async (name) => {
    const s = await send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(shotDir, 'wo11-' + name + '.png');
    (await import('node:fs')).writeFileSync(file, Buffer.from(s.data, 'base64'));
    console.log('  · wrote ' + file);
  };

  /* ---------- 1. a fresh run saves ---------- */
  await load('');
  ok('boot exposes __V5', await ev('!!window.__V5'));
  ok('localStorage usable', await ev('(function(){try{localStorage.setItem("__p","1");localStorage.removeItem("__p");return true;}catch(e){return false;}})()'));
  await ev('localStorage.removeItem("emergence_v5"); localStorage.removeItem("emergence_v5_legacy"); location.reload()');
  await sleep(1400);
  await ev('window.__V5.sim.apply({type:"inscribe",era:1})');
  await sleep(700);
  const saved = await ev('(function(){var V=window.__V5;V.save();var raw=JSON.parse(localStorage.getItem("emergence_v5")||"null");return raw&&{v:raw.v,t:raw.state.t,wall:raw.wall,log:raw.state.log.length,marks:raw.state.stocks.marks};})()');
  ok('save writes emergence_v5', saved && saved.v === 1, JSON.stringify(saved));
  ok('save carries the run clock', saved && saved.t > 0, saved && saved.t);
  ok('save carries the action log', saved && saved.log >= 1, saved && saved.log);

  /* ---------- 2. a reload resumes the run ---------- */
  await load('');
  const resumed = await ev('(function(){var s=window.__V5.sim.state;return {t:s.t,marks:s.stocks.marks,era:s.era,mute:s.mute};})()');
  ok('reload resumes the saved run', resumed && resumed.t >= saved.t - 0.5, 'saved t=' + (saved && saved.t) + ' resumed t=' + (resumed && resumed.t));
  ok('reload resumes the stocks', resumed && Math.abs(resumed.marks - saved.marks) < 5, 'saved ' + (saved && saved.marks) + ' vs ' + (resumed && resumed.marks));
  ok('reload never resumes muted', resumed && resumed.mute === false, resumed && resumed.mute);

  /* ---------- 3. a ten-minute absence ---------- */
  // a run with real producers in it: the bronze scene, written as a save that is ten minutes old.
  // Persistence is held first, because the unload save would stamp a fresh wall clock over the doctored one.
  await load('#scene=origins-bronze');
  const before = await ev('(function(){var V=window.__V5;V.holdSave(true);var st=V.sim.snapshot();localStorage.setItem("emergence_v5",JSON.stringify({v:1,state:st,wall:Date.now()-600000}));return {t:st.t,marks:st.stocks.marks};})()');
  await load('');
  const after = await ev('(function(){var V=window.__V5;return {t:V.sim.state.t,marks:V.sim.state.stocks.marks,away:V.away&&V.away.steps,sec:V.away&&V.away.sec,toast:(document.querySelector(".toast-h")||{}).textContent||""};})()');
  const gained = after && before ? after.t - before.t : 0;
  ok('ten minutes away replays 6000 steps', after && after.away >= 5990 && after.away <= 6010, after && after.away);
  ok('the run clock advanced by the absence', gained > 598 && gained < 604, 'gained ' + gained.toFixed(2) + 's');
  ok('the away toast is shown', /WHILE YOU WERE AWAY/.test(after && after.toast), after && after.toast);
  ok('production accrued while away', after && after.marks > before.marks, before.marks + ' to ' + (after && after.marks));

  /* ---------- 4. the replay is deterministic ---------- */
  const det = await ev(`(function(){
    var V=window.__V5, sim=V.sim, snap=sim.snapshot();
    function away(){ sim.restore(JSON.parse(JSON.stringify(snap))); sim.setMuted(true); for(var i=0;i<6000;i++) sim.tick(0.1); sim.setMuted(false);
      var s=sim.state, out=[Math.round(s.t*1000)]; for(var k in s.stocks) out.push(k+':'+s.stocks[k].toFixed(6)); return out.join('|'); }
    var a=away(), b=away(); sim.restore(snap); return {same:a===b, len:a.length};
  })()`);
  ok('the offline replay is deterministic', det && det.same, det && ('signature ' + (det.len || 0) + ' chars'));

  /* ---------- 5. Escape opens settings, pause freezes the clock ---------- */
  await ev('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  await sleep(200);
  ok('Escape opens the settings panel', await ev('!!window.__V5.hud.settingsOpen && document.querySelector(".v5set").className.indexOf("on")>=0'));
  await ev('document.querySelector(".v5set-acts .buy").click()');
  await sleep(120);
  const t0 = await ev('window.__V5.sim.state.t');
  const isPaused = await ev('window.__V5.paused');
  await sleep(900);
  const t1 = await ev('window.__V5.sim.state.t');
  ok('the PAUSE button pauses the run', isPaused === true);
  ok('pause freezes sim.t', t0 === t1, t0 + ' then ' + t1);
  ok('the pause pill is up', await ev('document.querySelector(".pause-pill").className.indexOf("on")>=0'));
  await shot('settings');
  await ev('document.querySelector(".v5set-acts .buy").click(); document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  await sleep(700);
  const t2 = await ev('window.__V5.sim.state.t');
  ok('resume starts the clock again', t2 > t1, t1 + ' then ' + t2);
  ok('the settings panel closes', await ev('!window.__V5.hud.settingsOpen'));

  /* ---------- 6. the bulk toggle cycles into MAX and MAX prices per node ---------- */
  const bulk = '[].slice.call(document.querySelectorAll(".rail-btn")).filter(function(b){return /^\\u00d7/.test(b.textContent);})[0]';
  const cycle = await ev(`(function(){var out=[],b=${bulk},V=window.__V5;for(var i=0;i<4;i++){b.click();out.push(V.buy.max?"MAX":String(V.buy.n));}return out.join(">");})()`);
  ok('the rail toggle cycles into MAX', /MAX/.test(cycle), cycle);
  await ev(`(function(){var V=window.__V5,b=${bulk};for(var i=0;i<8&&!V.buy.max;i++)b.click();})()`);
  await sleep(120);
  ok('the rail shows the MAX tag', await ev('document.querySelector(".bulk-tag").className.indexOf("on")>=0'));
  // the first plate that actually prices a batch (store plates carry an empty button)
  const plateLabel = '(function(){var out="";[].forEach.call(document.querySelectorAll(".plate .buy"),function(b){if(!out&&b.textContent.trim())out=b.textContent.trim();});return out;})()';
  const priceMax = await ev(plateLabel);
  await ev(`(function(){var V=window.__V5,b=${bulk};for(var i=0;i<8&&V.buy.max;i++)b.click();for(var j=0;j<8&&V.buy.n!==25;j++)b.click();})()`);
  await sleep(220);
  const price25 = await ev(plateLabel);
  ok('MAX prices a plate for the whole bank', !!priceMax && !!price25 && priceMax !== price25, priceMax + ' vs ' + price25);
  await ev(`(function(){var V=window.__V5,b=${bulk};for(var i=0;i<8&&V.buy.max;i++)b.click();})()`);
  ok('the toggle leaves MAX again', await ev('window.__V5.buy.max === false'));

  /* ---------- 7. an era switch swaps the HUD and shows the title card ---------- */
  const pre = await ev('(function(){return {verbs:[].map.call(document.querySelectorAll(".verb .vname"),function(e){return e.textContent;}).join(","),rail:document.querySelectorAll(".rail-btn").length,era:window.__V5.sim.state.era};})()');
  await ev('window.__V5.sim.openEra(3)');
  await sleep(260);
  const post = await ev(`(function(){var V=window.__V5;return {
    verbs:[].map.call(document.querySelectorAll(".verb .vname"),function(e){return e.textContent;}).join(","),
    rail:document.querySelectorAll(".rail-btn").length,
    locked:V.world.locked, era:V.sim.state.era,
    card:!!document.querySelector(".v5-title"), cardEra:(document.querySelector(".v5-title")||{getAttribute:function(){return "";}}).getAttribute("data-era"),
    music:!!document.querySelector(".rail-btn[data-tip]"), plates:document.querySelectorAll(".plate").length };})()`);
  ok('openEra moves the sim to the stratum', post && post.era === 3, post && post.era);
  ok('the HUD verbs swapped with the view', pre && post && pre.verbs !== post.verbs, (pre && pre.verbs) + ' to ' + (post && post.verbs));
  ok('the camera locked to the new stratum', post && post.locked === 3, post && post.locked);
  ok('the title card is shown for the stratum', post && post.card && post.cardEra === '3', post && post.cardEra);
  ok('the rail keeps one set of buttons', post && post.rail === pre.rail, pre.rail + ' then ' + post.rail);
  await shot('title');
  ok('the old view left no controls behind', await ev('document.querySelectorAll(".o-side").length===0'));
  await sleep(2400);
  ok('the title card clears itself', await ev('!document.querySelector(".v5-title")'));

  /* ---------- 8. restart wipes the save and begins again (the v4 unload-save bug, guarded) ---------- */
  await ev('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  await sleep(150);
  await ev('(function(){var b=document.querySelectorAll(".v5set-acts .buy")[1];b.click();b.click();})()');
  await sleep(1600);
  const fresh = await ev('(function(){var V=window.__V5;return {t:V&&V.sim.state.t, save:localStorage.getItem("emergence_v5")?1:0};})()');
  ok('restart begins a new run', fresh && fresh.t < 30, fresh && fresh.t);
  ok('restart does not rewrite the save on the way out', fresh && fresh.save === 0, fresh && fresh.save);

  /* ---------- report ---------- */
  const failed = checks.filter(c => !c.pass);
  checks.forEach(c => console.log((c.pass ? '  ✓ ' : '  ✗ ') + c.name + (c.detail ? '  [' + c.detail + ']' : '')));
  console.log('\nprobe-shell: ' + (checks.length - failed.length) + ' passed, ' + failed.length + ' failed');
  console.log('ERRORS: ' + (errors.length ? JSON.stringify(errors, null, 2) : 'none'));
  ws.close(); chrome.kill();
  process.exit(failed.length ? 1 : (errors.length ? 2 : 0));
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
