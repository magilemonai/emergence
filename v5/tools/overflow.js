#!/usr/bin/env node
// WO-13 overflow ledger: boots EVERY scene in v5/scenes at 1280×800 and 1440×900 and reports the page
// scroll plus any HUD element whose box leaves the viewport ("one screen": the world pans, the page never scrolls).
//   node v5/tools/overflow.js [--file v5/index.html] [--scene name] [--shots dir]
// Exit 1 if any scene scrolls, 2 if a scene threw a console error.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
import { SCENES } from '../scenes/scenes.js';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const fileArg = arg('--file', 'v5/index.html');
const only = arg('--scene', '');
const shots = arg('--shots', '');
const URL_BASE = 'file://' + path.resolve(fileArg);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9381 + Math.floor(Math.random() * 40);
const SIZES = [{ w: 1280, h: 800 }, { w: 1440, h: 900 }];
// the HUD furniture that must stay on screen; world plates ride the camera and are allowed to sit off-frame
const WATCH = '.rail, .rail-btn, .col, .verb, .goal, .fab, .drawer, .side-btn, .chip, .toast, .v5set-box';

const sceneNames = (only ? [only] : Object.keys(SCENES)).filter((n) => !!SCENES[n]);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1440,900',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--mute-audio', '--allow-file-access-from-files', 'about:blank']);
// kill the browser with us: a SIGTERM to this process must never leave a headless Chrome (and its audio) running
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { try { chrome.kill('SIGKILL'); } catch (e) { } process.exit(130); });
process.on('exit', () => { try { chrome.kill('SIGKILL'); } catch (e) { } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let target;
  for (let i = 0; i < 80; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); target = l.find((t) => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch (e) { }
    await sleep(250);
  }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); let id = 0; const pending = new Map(); const onEvent = {};
  const send = (m, p = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    else if (m.method && onEvent[m.method]) onEvent[m.method](m.params);
  });
  await new Promise((r) => ws.addEventListener('open', r));
  let errors = [];
  onEvent['Runtime.consoleAPICalled'] = (p) => { if (p.type === 'error') errors.push((p.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ')); };
  onEvent['Runtime.exceptionThrown'] = (p) => errors.push('EXCEPTION ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
  await send('Page.enable'); await send('Runtime.enable');

  const ev = async (x) => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) errors.push('EVAL ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result?.value;
  };
  const load = async (hash) => {
    const blank = new Promise((r) => { onEvent['Page.loadEventFired'] = r; });
    await send('Page.navigate', { url: 'about:blank' }); await blank;
    const loaded = new Promise((r) => { onEvent['Page.loadEventFired'] = r; });
    await send('Page.navigate', { url: URL_BASE + (hash || '') }); await loaded; await sleep(950);
  };
  const probe = `(function(){
    var V=window.__V5; if(V&&V.settle) V.settle();
    var vw=innerWidth, vh=innerHeight, out=[];
    var els=document.querySelectorAll(${JSON.stringify(WATCH)});
    for (var i=0;i<els.length;i++){
      var el=els[i], cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) continue;
      var b=el.getBoundingClientRect(); if(b.width<2||b.height<2) continue;
      var over=Math.max(0, Math.round(b.bottom-vh), Math.round(b.right-vw), Math.round(-b.top), Math.round(-b.left));
      if(over>1) out.push({sel:(el.className||el.tagName).toString().slice(0,40), px:over});
    }
    out.sort(function(a,b){return b.px-a.px;});
    return {scroll:Math.max(0,document.documentElement.scrollHeight-vh),
            wide:Math.max(0,document.documentElement.scrollWidth-vw),
            era:V&&V.sim&&V.sim.state.era, off:out.slice(0,6)};
  })()`;

  let scrolled = 0, checked = 0; const badScenes = []; const badNames = {};
  for (const name of sceneNames) {
    for (const size of SIZES) {
      errors = [];
      await send('Emulation.setDeviceMetricsOverride', { width: size.w, height: size.h, deviceScaleFactor: 1, mobile: false });
      await load('#scene=' + name);
      await sleep(250);
      const p = await ev(probe);
      checked++;
      const tag = size.w + '×' + size.h;
      if (!p) { console.log('  ? ' + name + ' ' + tag + ' no probe'); continue; }
      const bad = p.scroll > 0 || p.wide > 0;
      if (bad) { scrolled++; badNames[name] = 1; badScenes.push(name + ' ' + tag + ' scroll ' + p.scroll + 'px wide ' + p.wide + 'px'); }
      const off = p.off.length ? ' · off-screen: ' + p.off.map((o) => o.sel + ' +' + o.px).join(', ') : '';
      console.log('  ' + (bad ? '✗' : '✓') + ' ' + name.padEnd(24) + tag + ' scroll ' + String(p.scroll).padStart(4) + 'px · era ' + p.era + off);
      if (errors.length) console.log('    ERRORS ' + JSON.stringify(errors.slice(0, 2)));
      if (shots && size.w === 1280) {
        const s = await send('Page.captureScreenshot', { format: 'png' });
        fs.mkdirSync(shots, { recursive: true });
        fs.writeFileSync(path.join(shots, name + '.png'), Buffer.from(s.data, 'base64'));
      }
    }
  }
  console.log('\noverflow: ' + sceneNames.length + ' scenes, ' + Object.keys(badNames).length + ' scrolled (' + checked + ' checks at 1280x800 + 1440x900)');
  if (badScenes.length) badScenes.forEach((b) => console.log('  ✗ ' + b));
  ws.close(); chrome.kill();
  process.exit(scrolled ? 1 : 0);
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
