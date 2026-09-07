#!/usr/bin/env node
// Headless screenshot of a v5 scene: node v5/tools/shoot.js <scene> [out.png] [--file v5/dev.html] [--perf]
// Loads the page with #scene=<name>, waits, probes window.__V5 (era, camera, overflow, plate count, console errors),
// optionally measures frame time, then screenshots at 1280×800. Exit 2 on console errors.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
const args = process.argv.slice(2); const scene = args[0] || 'boot'; const out = args[1] && !args[1].startsWith('--') ? args[1] : `/tmp/v5-${scene}.png`;
const fileArg = args.includes('--file') ? args[args.indexOf('--file') + 1] : 'v5/index.html'; const perf = args.includes('--perf');
const url = 'file://' + path.resolve(fileArg) + '#scene=' + scene;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; const PORT = 9281 + Math.floor(Math.random() * 40);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--allow-file-access-from-files', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let target; for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); target = l.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch (e) {} await sleep(250); }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); let id = 0; const pending = new Map(); const onEvent = {};
  const send = (m, p = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } else if (m.method && onEvent[m.method]) onEvent[m.method](m.params); });
  await new Promise(r => ws.addEventListener('open', r));
  const errors = []; onEvent['Runtime.consoleAPICalled'] = p => { if (p.type === 'error') errors.push((p.args || []).map(a => a.value ?? a.description ?? a.type).join(' ')); }; onEvent['Runtime.exceptionThrown'] = p => errors.push('EXCEPTION ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
  await send('Page.enable'); await send('Runtime.enable'); const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url }); await loaded; await sleep(900);
  const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) errors.push('EVAL ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result?.value; };
  await ev(`window.__V5 && window.__V5.settle && window.__V5.settle()`); await sleep(500);
  const probe = await ev(`(function(){var V=window.__V5;if(!V)return 'NO __V5';return JSON.stringify({scene:${JSON.stringify(scene)},era:V.sim&&V.sim.state.era,t:V.sim&&Math.round(V.sim.state.t),cam:V.world&&V.world.camera&&{x:Math.round(V.world.camera.x),y:Math.round(V.world.camera.y),zoom:+V.world.camera.zoom.toFixed(2)},plates:document.querySelectorAll('.plate').length,verbs:document.querySelectorAll('.verb').length,pageScroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),particles:V.world&&V.world.stats&&V.world.stats.particles});})()`);
  console.log('PROBE:', probe);
  if (perf) { const pf = await ev(`(async function(){var V=window.__V5;if(!V||!V.world)return 'no world';var n=120,t0=performance.now();for(var i=0;i<n;i++){V.sim.tick(1/60);V.world.frame(1/60);}return ((performance.now()-t0)/n).toFixed(2)+'ms per tick+frame';})()`); console.log('PERF:', pf); }
  console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
  const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(out, Buffer.from(shot.data, 'base64')); console.log('wrote', out);
  ws.close(); chrome.kill(); process.exit(errors.length ? 2 : 0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
