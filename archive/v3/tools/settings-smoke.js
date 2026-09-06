#!/usr/bin/env node
// Live smoke for the session-services layer of emergence-v3-unified.html:
// boot music bed, Escape settings panel, pause, save-scrub, offline catch-up toast.
// Usage: node tools/settings-smoke.js [screenshot.png]
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || '/tmp/uni-settings.png';
const FILE = 'file://' + (process.env.SHOOT_FILE ? path.resolve(process.env.SHOOT_FILE) : path.resolve(__dirname, '..', 'emergence-v3-unified.html')); // SHOOT_FILE overrides (e.g. the built emergence.html)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9244;

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,800', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--no-first-run', '--no-default-browser-check', 'about:blank']);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url) { const r = await fetch(url); return r.json(); }

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }

(async () => {
  let target;
  for (let i = 0; i < 80; i++) { try { const list = await getJSON(`http://127.0.0.1:${PORT}/json`); target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch (e) {} await sleep(250); }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const onEvent = {};
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } else if (m.method && onEvent[m.method]) onEvent[m.method](m.params); });
  await new Promise(r => ws.addEventListener('open', r));

  const errors = [];
  onEvent['Runtime.exceptionThrown'] = p => { const d = p.exceptionDetails; errors.push('EXCEPTION ' + (d.exception && d.exception.description || d.text)); };
  await send('Page.enable'); await send('Runtime.enable');

  const evalJS = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.value;
  };
  const navigate = async (url) => {
    const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
    await send('Page.navigate', { url }); await loaded; await sleep(500);
  };

  await navigate(FILE);
  await evalJS(`localStorage.clear()`); await navigate(FILE); // clean slate

  // 1) boot music bed is set (the ♪ toggle used to be dead until the first era nav)
  ok(await evalJS(`!!(__EMG.KIT.MUSIC.cur)`) === true, 'boot sets the music bed src (♪ toggle live from tick 0)');

  // 2) Escape opens the settings panel
  await evalJS(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
  await sleep(150);
  const setOpen = await evalJS(`document.getElementById('settings').classList.contains('show')`);
  ok(setOpen === true, 'Escape opens the settings panel');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));

  // 3) pause freezes the game clock; pill shows
  await evalJS(`__EMG.setPaused(true)`);
  const t0 = await evalJS(`(__EMG.tick(),__EMG.S.t)`);
  await sleep(400);
  const t1 = await evalJS(`(__EMG.tick(),__EMG.S.t)`);
  ok(t0 === t1, 'pause freezes the game clock (S.t stable across ticks)');
  ok(await evalJS(`document.getElementById('pausePill').classList.contains('show')`) === true, 'pause pill visible while paused');
  await evalJS(`__EMG.setPaused(false); __EMG.toggleSettings(false)`);

  // 4) save() scrubs session-only keys
  await evalJS(`__EMG.S.speed=50; __EMG.S.dev=true; __EMG.S.uiPaused=true; __EMG.save(); __EMG.S.speed=1; __EMG.S.dev=false; __EMG.S.uiPaused=false;`);
  const saved = JSON.parse(await evalJS(`localStorage.getItem('emergence_v3_unified')`));
  ok(saved && saved.S && !('speed' in saved.S) && !('dev' in saved.S) && !('uiPaused' in saved.S), 'save scrubs dev/speed/uiPaused');
  ok(saved.v === 1 && typeof saved.t === 'number', 'save carries version + wall-clock timestamp');

  // 5) offline catch-up: craft a 2h-old save with producers, reload, expect the away toast + gains
  await evalJS(`(function(){ var S=__EMG.S; S.started=true; S.e1.scribe=6; S.e1.miner=6; S.marks=10; S.ore=10; __EMG.save();
    var d=JSON.parse(localStorage.getItem('emergence_v3_unified')); d.t=Date.now()-2*3600*1000; localStorage.setItem('emergence_v3_unified', JSON.stringify(d));
    Storage.prototype.setItem=function(){}; })()`); // kill the dying page's beforeunload autosave so it can't re-stamp t
  await navigate(FILE); await sleep(900);
  const after = await evalJS(`JSON.stringify({marks:Math.round(__EMG.S.marks), t:Math.round(__EMG.S.t), toast:(document.getElementById('toasts').textContent||'')})`);
  const a = JSON.parse(after);
  ok(a.marks > 1000, 'offline catch-up accrued Marks while away (got ' + a.marks + ')');
  ok(a.t >= 7100, 'offline catch-up advanced the game clock ~2h (got ' + a.t + 's)');
  ok(/WHILE YOU WERE AWAY/.test(a.toast), '"WHILE YOU WERE AWAY" toast shown after reload');

  // 6) reload does not resume paused/dev/fast
  ok(await evalJS(`__EMG.S.speed===1 && !__EMG.S.uiPaused`) === true, 'reload resumes at speed 1, unpaused');

  await evalJS(`localStorage.clear()`);
  console.log('ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  console.log(pass + ' passed, ' + fail + ' failed — screenshot ' + OUT);
  ws.close(); chrome.kill(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
