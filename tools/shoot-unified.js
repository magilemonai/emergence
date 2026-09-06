#!/usr/bin/env node
// Headless driver for emergence-v3-unified.html: loads it (optionally with a #hash),
// captures console output + uncaught exceptions, then screenshots. Verifies "runs clean".
// Usage: node tools/shoot-unified.js [hash] [out.png]
//   e.g. node tools/shoot-unified.js seed /tmp/uni-origins.png
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const HASH = process.argv[2] ? ('#' + process.argv[2].replace(/^#/, '')) : '';
const OUT = process.argv[3] || `/tmp/uni${HASH ? '-' + HASH.slice(1) : ''}.png`;
const FILE = (process.env.SHOOT_URL ? process.env.SHOOT_URL : 'file://' + (process.env.SHOOT_FILE ? path.resolve(process.env.SHOOT_FILE) : path.resolve(__dirname, '..', 'emergence-v3-unified.html'))) + HASH; // SHOOT_FILE overrides the target file; SHOOT_URL probes a live URL
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9243;

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,800', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--no-first-run', '--no-default-browser-check', 'about:blank']);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url) { const r = await fetch(url); return r.json(); }

(async () => {
  let target;
  for (let i = 0; i < 80; i++) { try { const list = await getJSON(`http://127.0.0.1:${PORT}/json`); target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch (e) {} await sleep(250); }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const onEvent = {};
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } else if (m.method && onEvent[m.method]) onEvent[m.method](m.params); });
  await new Promise(r => ws.addEventListener('open', r));

  const logs = [], errors = [];
  onEvent['Runtime.consoleAPICalled'] = p => { const t = (p.args || []).map(a => a.value != null ? a.value : (a.description || a.type)).join(' '); logs.push('[' + p.type + '] ' + t); if (p.type === 'error') errors.push(t); };
  onEvent['Runtime.exceptionThrown'] = p => { const d = p.exceptionDetails; errors.push('EXCEPTION ' + (d.exception && d.exception.description || d.text)); };

  await send('Page.enable'); await send('Runtime.enable');
  const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url: FILE });
  await loaded; await sleep(500);
  // let a few ticks run
  await send('Runtime.evaluate', { expression: 'for(let i=0;i<8;i++){ try{ window.__EMG && window.__EMG.tick(); }catch(e){ console.error("tick "+e.message); } }' });
  await sleep(600);

  // structural sanity probe
  const probe = await send('Runtime.evaluate', {
    expression: `(function(){var S=window.__EMG&&window.__EMG.S; if(!S) return 'NO __EMG';
      return JSON.stringify({era:S.era,maxEra:S.maxEra,marks:Math.round(S.marks),silicon:Math.round(S.silicon),
        railChips:document.querySelectorAll('#rail .chip').length,
        navTabs:document.querySelectorAll('#eraNav .era-tab').length,
        nodes:document.querySelectorAll('#board .node').length,
        stocks:document.querySelectorAll('#board .stock').length,
        flows:document.querySelectorAll('#board .flow').length,
        scrollH:document.documentElement.scrollHeight, viewH:window.innerHeight,
        overflowPx:Math.max(0,document.documentElement.scrollHeight-window.innerHeight),
        goalReady:document.querySelector('.goal') && document.querySelector('.goal').classList.contains('ready')});})()`,
    returnByValue: true
  });
  console.log('PROBE:', probe.result && probe.result.value);
  console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
  if (logs.length) console.log('CONSOLE:', logs.slice(0, 20).join(' | '));

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('wrote', OUT, fs.statSync(OUT).size, 'B');
  ws.close(); chrome.kill(); process.exit(errors.length ? 2 : 0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
