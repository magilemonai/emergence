#!/usr/bin/env node
// WO-13 DOM smoke: drives the REAL v5 UI in headless Chrome with real pointer events, jumping between
// beats with the named scenes, from the first mark to the surface. Fails on ANY console error or a
// failed check.   node v5/tools/smoke.js [--file v5/index.html] [--shots dir]
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const URL_BASE = 'file://' + path.resolve(arg('--file', 'v5/index.html'));
const SHOTS = arg('--shots', '');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9421 + Math.floor(Math.random() * 40);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--allow-file-access-from-files',
  '--no-first-run', '--no-default-browser-check', 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0; const fails = [];
const ok = (c, m, detail) => { if (c) { pass++; } else { fail++; fails.push(m + (detail === undefined ? '' : '  [' + detail + ']')); } };

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
  const errors = [];
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
    await send('Page.navigate', { url: URL_BASE + (hash || '') }); await loaded; await sleep(1100);
  };
  /** a real click: pointer events at the element's centre. false when it is missing, hidden, or disabled */
  const click = async (sel, nth) => {
    const box = await ev(`(function(){var l=document.querySelectorAll(${JSON.stringify(sel)}),el=l[${nth || 0}];if(!el)return null;
      var b=el.getBoundingClientRect(),cs=getComputedStyle(el);
      if(b.width<2||b.height<2||el.disabled||cs.pointerEvents==='none'||cs.visibility==='hidden')return {no:true};
      return {x:b.left+b.width/2,y:b.top+b.height/2};})()`);
    if (!box || box.no) return false;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await sleep(90);
    return true;
  };
  const key = async (k, code) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: code || k, windowsVirtualKeyCode: k === 'Escape' ? 27 : 0 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: code || k });
    await sleep(160);
  };
  const count = (sel) => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
  const shot = async (name) => {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    const s = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(s.data, 'base64'));
  };

  /* ================= 1. boot: Origins, the rail, the verbs ================= */
  await load('');
  await ev('localStorage.removeItem("emergence_v5"); localStorage.removeItem("emergence_v5_legacy");');
  await load('');
  ok(await ev('!!window.__V5 && !!window.__V5.sim'), 'boot exposes __V5 with a sim');
  ok((await count('.rail .chip')) >= 1, 'the rail carries resource chips');
  ok((await count('.verb')) >= 1, 'Origins renders its verbs');
  ok((await ev('document.querySelectorAll(".verb .vname")[0].textContent.length > 0')), 'the first verb is named');
  const m0 = await ev('window.__V5.sim.state.stocks.marks');
  for (let i = 0; i < 5; i++) await click('.verb', 0);
  const m1 = await ev('window.__V5.sim.state.stocks.marks');
  ok(m1 > m0, 'clicking the first verb inscribes marks', m0 + ' to ' + m1);
  ok((await ev('Math.max(0,document.documentElement.scrollHeight-innerHeight)')) === 0, 'the locked stratum never scrolls');
  ok((await count('.plate')) >= 3, 'the world anchors DOM plates');

  /* ================= 2. Origins: the drawer, a plate BUILD, the bulk toggle ================= */
  await load('#scene=origins-bronze');
  ok(await click('.side-btn', 0), 'the research side button takes a real click');
  await sleep(300);
  ok((await ev('document.querySelectorAll(".drawer").length>0 && document.querySelector(".drawer").className.indexOf("show")>=0')), 'the drawer opens');
  ok((await count('.drawer .d-tile')) >= 1, 'the drawer lists discoveries');
  await shot('origins-drawer');
  ok(await click('.dr-x', 0), 'the drawer close button takes a click');
  await sleep(280);
  ok(!(await ev('document.querySelector(".drawer").className.indexOf("show")>=0')), 'the drawer closes');
  const owned = 'Object.keys(window.__V5.sim.state.nodes).reduce(function(a,k){return a+window.__V5.sim.state.nodes[k].count;},0)';
  const buyIdx = await ev(`(function(){var b=document.querySelectorAll(".plate .buy");for(var i=0;i<b.length;i++)if(!b[i].disabled&&b[i].textContent.trim())return i;return -1;})()`);
  const before = await ev(owned);
  ok(buyIdx >= 0 && (await click('.plate .buy', buyIdx)), 'a plate BUILD button takes a real click', 'index ' + buyIdx);
  await sleep(150);
  const after = await ev(owned);
  ok(after > before, 'the BUILD click bought a unit', before + ' to ' + after);
  const bulk = '[].slice.call(document.querySelectorAll(".rail-btn")).filter(function(b){return /^\\u00d7/.test(b.textContent);})[0]';
  const n0 = await ev('window.__V5.buy.n');
  await ev(`${bulk}.click()`); await sleep(120);
  ok((await ev('window.__V5.buy.n')) !== n0 || (await ev('window.__V5.buy.max')), 'the rail bulk toggle changes the buy size');

  /* ================= 3. settings, pause, and the keys ================= */
  await key('Escape');
  ok(await ev('!!window.__V5.hud.settingsOpen'), 'Escape opens settings');
  ok(await click('.v5set-acts .buy', 0), 'the PAUSE button takes a click');
  await sleep(250);
  const t0 = await ev('window.__V5.sim.state.t');
  await sleep(700);
  const t1 = await ev('window.__V5.sim.state.t');
  ok(t0 === t1, 'pause freezes the run clock', t0 + ' then ' + t1);
  ok(await ev('document.querySelector(".pause-pill").className.indexOf("on")>=0'), 'the pause pill is up');
  await click('.v5set-acts .buy', 0);
  await key('Escape');
  ok(!(await ev('!!window.__V5.hud.settingsOpen')), 'Escape closes settings');
  await sleep(500);
  ok((await ev('window.__V5.sim.state.t')) > t1, 'the clock runs again after the resume');

  /* ================= 4. a live openEra shows the title card and swaps the HUD ================= */
  const verbs1 = await ev('[].map.call(document.querySelectorAll(".verb .vname"),function(e){return e.textContent;}).join(",")');
  await ev('window.__V5.sim.openEra(2)');
  await sleep(320);
  ok(await ev('!!document.querySelector(".v5-title")'), 'a live openEra shows the title card');
  ok(await ev('document.querySelector(".v5-title").getAttribute("data-era")==="2"'), 'the card names the new stratum');
  const verbs2 = await ev('[].map.call(document.querySelectorAll(".verb .vname"),function(e){return e.textContent;}).join(",")');
  ok(verbs1 !== verbs2 && verbs2.length > 0, 'the verbs swapped with the view', verbs1 + ' to ' + verbs2);
  ok(await ev('window.__V5.world.locked===2'), 'the camera locked to the new stratum');
  await sleep(2400);
  ok(!(await ev('!!document.querySelector(".v5-title")')), 'the title card clears itself');

  /* ================= 5. Symbolic: the terminal, a proof, the compile verb ================= */
  await load('#scene=symbolic-proving');
  ok((await count('.e2-term')) === 1, 'Symbolic draws its terminal');
  ok((await count('.e2-path')) >= 1 && (await count('.e2-th')) >= 3, 'the proof path lists its theorems');
  const r0 = await ev('window.__V5.sim.state.stocks.rules');
  await click('.verb', 0);
  ok((await ev('window.__V5.sim.state.stocks.rules')) > r0, 'the write verb adds Rules');
  await shot('symbolic');
  await load('#scene=symbolic-contradiction');
  ok((await count('.e2-contra')) >= 1, 'a contradiction opens its card');
  await load('#scene=symbolic-reboot');
  const ax0 = await ev('window.__V5.sim.state.stocks.axioms');
  const compiled = await ev(`(function(){var v=[].slice.call(document.querySelectorAll(".verb"));for(var i=0;i<v.length;i++){var n=v[i].querySelector(".vname");if(n&&/compile/i.test(n.textContent))return i;}return -1;})()`);
  ok(compiled >= 0, 'COMPILE is one of the Symbolic verbs');
  for (let i = 0; i < 160 && !(await ev('window.__V5.sim.can({type:"compile",era:2})')); i++) await key(' ', 'Space');   // write by hand until it can run
  ok(await ev('window.__V5.sim.can({type:"compile",era:2})'), 'hand-written rules re-arm COMPILE');
  if (compiled >= 0) ok(await click('.verb', compiled), 'the COMPILE verb takes a real click');
  await sleep(400);
  ok((await ev('window.__V5.sim.state.stocks.axioms')) > ax0, 'COMPILE banks Axioms', ax0 + ' to ' + (await ev('window.__V5.sim.state.stocks.axioms')));

  /* ================= 6. Statistical: focus, trials, the experiment drawer ================= */
  await load('#scene=stat-early');
  ok((await count('.e3-seg')) >= 3, 'Statistical shows the Focus segments');
  const f0 = await ev('window.__V5.sim.state.eras[3].focus');
  const other = await ev(`(function(){var s=[].slice.call(document.querySelectorAll(".e3-seg"));for(var i=0;i<s.length;i++)if(s[i].className.indexOf("on")<0)return i;return -1;})()`);
  ok(other >= 0 && (await click('.e3-seg', other)), 'a Focus segment takes a real click');
  await sleep(150);
  ok((await ev('window.__V5.sim.state.eras[3].focus')) !== f0, 'the click changed the Focus', f0 + ' to ' + (await ev('window.__V5.sim.state.eras[3].focus')));
  const tr0 = await ev('window.__V5.sim.state.eras[3].trials');
  await click('.verb', 0);
  ok((await ev('window.__V5.sim.state.eras[3].trials')) > tr0, 'RUN TRIAL runs a trial');
  await load('#scene=stat-research');
  ok((await count('.e3-card')) >= 3, 'the experiment cards are on the board');
  await shot('statistical');

  /* ================= 7. Deep: lanes, the mixer, the architecture drawer, the tools ================= */
  await load('#scene=deep-early');
  ok((await count('.lane')) === 3, 'Deep draws three run lanes');
  ok((await count('.mixer')) >= 1, 'the mixer is on the board');
  await shot('deep');
  await load('#scene=deep-architecture');
  ok((await count('.a-tile')) >= 6, 'the architecture drawer lists its upgrades', await count('.a-tile'));
  const arch0 = await ev('Object.keys(window.__V5.sim.state.eras[4].arch).length + window.__V5.sim.state.eras[4].stabilizer');
  const buyable = await ev(`(function(){var t=[].slice.call(document.querySelectorAll(".a-tile .buy"));for(var i=0;i<t.length;i++)if(!t[i].disabled)return i;return -1;})()`);
  ok(buyable >= 0 && (await click('.a-tile .buy', buyable)), 'an architecture tile takes a real click');
  await sleep(200);
  ok((await ev('Object.keys(window.__V5.sim.state.eras[4].arch).length + window.__V5.sim.state.eras[4].stabilizer')) > arch0, 'the click bought the upgrade');
  await load('#scene=deep-tools');
  ok((await count('.d-tool')) >= 1, 'the steering tools are on the board');
  await load('#scene=deep-starved');
  ok(await ev('window.__V5.sim.state.edges.some(function(e){return e.starved;}) || document.querySelectorAll(".lane.low, .lane-feed").length>0'), 'a starved run is visible on the board');

  /* ================= 8. Foundation: the feedback card and its ✓ ================= */
  await load('#scene=foundation-feedback');
  ok((await count('.fb-card')) >= 1, 'the feedback card is on the board');
  ok(await ev('!!window.__V5.sim.state.eras[5].fb.cur'), 'an output is waiting to be rated');
  const rw0 = await ev('window.__V5.sim.state.eras[5].fb.rewarded');
  ok(await click('.fb-b.yes', 0), 'the feedback ✓ takes a real click');
  await sleep(150);
  ok((await ev('window.__V5.sim.state.eras[5].fb.rewarded')) > rw0, 'the ✓ rated the output', rw0 + ' to ' + (await ev('window.__V5.sim.state.eras[5].fb.rewarded')));
  ok((await count('.c-tile')) >= 3, 'the capability ladder is on the board');
  await shot('foundation');

  /* ================= 9. the rupture, the surface, the operated strata ================= */
  await load('#scene=surface');
  ok(await ev('window.__V5.sim.state.flags.emerged === true'), 'the surface scene is past emergence');
  ok((await count('.s-ledger .s-row-l')) >= 2, 'the surface ledger has rows', await count('.s-ledger .s-row-l'));
  ok((await count('.s-op')) >= 1, 'THE OPERATOR is on the surface board');
  ok(await ev('document.body.className.indexOf("operated")>=0'), 'the body carries the operated class');
  ok(await ev('!!window.__V5.world.operated && window.__V5.world.operated.has(1) && window.__V5.world.operated.has(4)'), 'the lower strata are operated');
  await shot('surface');
  await ev('window.__V5.world.lockTo(1,false)'); await sleep(400);
  ok(await ev('document.body.className.indexOf("operated")>=0'), 'the operated look follows the camera down a stratum');
  await load('#scene=operated-origins');
  ok(await ev('window.__V5.sim.state.era===1 && document.body.className.indexOf("operated")>=0'), 'Origins after emergence is operated');
  ok((await ev('window.__V5.sim.state.cadence && window.__V5.sim.state.cadence[1] > 1')), 'the operated stratum runs at its cadence');

  /* ================= 10. save and reload resume the run ================= */
  await load('');
  await ev('window.__V5.sim.apply({type:"inscribe",era:1}); window.__V5.save();');
  const saved = await ev('(function(){var r=JSON.parse(localStorage.getItem("emergence_v5")||"null");return r&&{t:r.state.t,marks:r.state.stocks.marks};})()');
  ok(!!saved, 'the run saves to localStorage');
  await load('');
  const back = await ev('(function(){var s=window.__V5.sim.state;return {t:s.t,marks:s.stocks.marks,mute:s.mute};})()');
  ok(back && back.t >= (saved ? saved.t : 0) - 0.5, 'the reload resumes the saved clock', (saved && saved.t) + ' then ' + (back && back.t));
  ok(back && back.mute === false, 'the reload never resumes muted');

  /* ================= report ================= */
  console.log('smoke: ' + pass + ' passed, ' + fail + ' failed');
  if (fails.length) fails.forEach((f) => console.log('  ✗ ' + f));
  console.log('ERRORS: ' + (errors.length ? JSON.stringify(errors, null, 2) : 'none'));
  ws.close(); chrome.kill();
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
