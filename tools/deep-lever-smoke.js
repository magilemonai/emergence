#!/usr/bin/env node
// Live smoke for the Deep Hold lever + staffed supply: states, glow trigger, overflow.
// Usage: node tools/deep-lever-smoke.js [shot-run.png] [shot-held.png]
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT1 = process.argv[2] || '/tmp/deep-lever-run.png';
const OUT2 = process.argv[3] || '/tmp/deep-lever-held.png';
const FILE = 'file://' + path.resolve(__dirname, '..', 'emergence-v3-unified.html') + '#seeddeep';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9245;

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
  const evalJS = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
  const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url: FILE }); await loaded; await sleep(600);
  await evalJS(`for(let i=0;i<5;i++) __EMG.tick()`);

  // lever exists, RUN state, burn shown
  ok(await evalJS(`!!document.getElementById('sinkHold')`), 'Hold lever renders on the Deep board');
  ok(await evalJS(`document.getElementById('sinkState').textContent`) === 'RUN', 'lever shows RUN while crafts are live');
  ok(/Knowledge\/s/.test(await evalJS(`document.getElementById('sinkBurn').textContent`)), 'lever shows the live Knowledge burn');
  const over1 = await evalJS(`Math.max(0,document.documentElement.scrollHeight-innerHeight)`);
  console.log('  Deep overflowPx with lever: +' + over1);
  const shot1 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(OUT1, Buffer.from(shot1.data, 'base64'));

  // glow when Language starving while crafts burn
  await evalJS(`__EMG.S.knowledge = 0.5; __EMG.tick()`);
  ok(await evalJS(`document.getElementById('sinkHold').classList.contains('hold-warn')`), 'lever GLOWS when Language starves while the crafts burn');

  // click → HELD state, crafts paused, glow off
  await evalJS(`document.getElementById('sinkHold').click(); __EMG.tick()`);
  ok(await evalJS(`document.getElementById('sinkState').textContent`) === 'HELD', 'click → HELD');
  ok(await evalJS(`__EMG.S.e1.paused.smelter === true && __EMG.S.e1.paused.foundry === true`), 'HELD pauses the real Origins smelter+foundry flags');
  ok(await evalJS(`!document.getElementById('sinkHold').classList.contains('hold-warn')`), 'glow clears once held');
  const shot2 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(OUT2, Buffer.from(shot2.data, 'base64'));

  // click again → released
  await evalJS(`document.getElementById('sinkHold').click(); __EMG.tick()`);
  ok(await evalJS(`__EMG.S.e1.paused.smelter === false && __EMG.S.e1.paused.foundry === false`), 'click again → released');

  console.log('ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  console.log(pass + ' passed, ' + fail + ' failed — shots ' + OUT1 + ' , ' + OUT2);
  ws.close(); chrome.kill(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
