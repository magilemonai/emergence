#!/usr/bin/env node
// v4 DOM smoke: drives emergence-v4.html in headless Chrome through the whole arc using the
// real UI (clicks, drawers, the era card, Compile's reboot, autopilot unlock, the rupture, the
// sixth tab, operated eras, the finale, legacy). Fails on ANY console error/exception or a
// failed check. Usage: node tools/v4-smoke.js   (SHOOT_FILE overrides the target file)
const { spawn } = require('child_process');
const path = require('path');
const FILE = 'file://' + path.resolve(process.env.SHOOT_FILE || path.join(__dirname, '..', 'emergence-v4.html'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9247;
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url) { const r = await fetch(url); return r.json(); }
let pass = 0, fail = 0; const fails = [];
function ok(c, m) { if (c) pass++; else { fail++; fails.push(m); } }
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
  onEvent['Runtime.consoleAPICalled'] = p => { if (p.type === 'error') errors.push((p.args || []).map(a => a.value != null ? a.value : (a.description || a.type)).join(' ')); };
  onEvent['Runtime.exceptionThrown'] = p => { const d = p.exceptionDetails; errors.push('EXCEPTION ' + (d.exception && d.exception.description || d.text)); };
  await send('Page.enable'); await send('Runtime.enable');
  const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url: FILE }); await loaded; await sleep(400);
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) { errors.push('EVAL ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text)); return undefined; } return r.result && r.result.value; };
  const G = 'window.__EMG';
  // clean slate
  await ev(`localStorage.clear(); location.reload();`); await sleep(900);
  ok(await ev(`!!document.getElementById('eracard') && document.getElementById('eracard').classList.contains('show')`), 'boot: the first-run era card shows');
  ok(await ev(`document.querySelectorAll('#rail [data-bm]').length === 3 && !!document.getElementById('ledgerBtn')`), 'rail: buy-mode toggle + ledger button present');
  // Origins: click the verb, open research + ledger via the real buttons, buy mode click
  await ev(`for(let i=0;i<8;i++) document.getElementById('inscribe').click();`);
  ok((await ev(`${G}.S.marks`)) >= 8, 'Origins: clicking INSCRIBE adds marks');
  await ev(`document.getElementById('researchBtn').click();`); ok(await ev(`document.getElementById('research').classList.contains('show') && /RESEARCH/.test(document.getElementById('researchTitle').textContent)`), 'Origins: RESEARCH opens the drawer');
  await ev(`document.getElementById('ledgerBtn').click();`); ok(await ev(`/LEDGER/.test(document.getElementById('researchTitle').textContent) && document.querySelectorAll('#researchBody .ledger-row').length >= 0`), 'ledger: opens in the shared drawer');
  await ev(`document.getElementById('researchClose').click(); document.querySelector('#rail [data-bm="10"]').click();`);
  ok((await ev(`${G}.S.buyN`)) === 10, 'rail: ×10 mode sets S.buyN');
  await ev(`document.querySelector('#rail [data-bm="1"]').click();`);
  // seed Origins near the gate and FABRICATE through the button → Symbolic + era card
  await ev(`(function(){var S=${G}.S,E=S.e1;['tally','scribe','stoneworking','clayTablets','kiln','alphabet','numerals','theFoundry'].forEach(k=>E.disco[k]=1);E.flags={canScribe:1,o_materials:1,o_scriptorium:1,o_smelter:1,o_foundry:1};E.age=3;E.scribe=8;E.miner=8;E.scriptorium=4;E.smelter=3;E.foundry=2;S.marks=500;S.ore=800;S.knowledge=300;S.metal=200;S.silicon=130;S.started=true;${G}.render();})()`);
  ok(await ev(`document.getElementById('goalImg').getAttribute('src').indexOf('logic-machine')>=0`), 'Origins: at the gate the goal image is the Logic Machine');
  await ev(`${G}.tick(); document.getElementById('fabricate').click();`); await sleep(300);
  ok((await ev(`${G}.S.era`)) === 2 && (await ev(`document.getElementById('eracard').classList.contains('show')`)), 'Origins→Symbolic: FABRICATE opens era 2 with the title card');
  // Symbolic: gate visible in the DOM, terminal present, compile reboot
  ok(await ev(`!!document.getElementById('term') && !document.querySelector('.tissue')`), 'Symbolic: terminal present, explainer prose gone');
  await ev(`${G}.S.rules = 5000; ${G}.tick(); document.getElementById('buy-ruleset').click(); ${G}.tick();`);
  ok((await ev(`${G}.S.e2.ruleset`)) === 1 && (await ev(`document.getElementById('buy-ruleset').disabled === true && /Formal Logic/.test(document.getElementById('buy-ruleset').textContent)`)), 'Symbolic: the Ruleset button gates itself after one (says why)');
  await ev(`(function(){var S=${G}.S;S.e2.flags.compile=true;S.e2.runRules=3000;S.e2.ruleset=6;${G}.render();})()`);
  await ev(`document.getElementById('compileBtn').click();`); ok(await ev(`document.getElementById('board').classList.contains('reboot')`), 'Symbolic: COMPILE starts the CRT reboot'); await sleep(1100);
  ok((await ev(`${G}.S.axioms`)) >= 1 && (await ev(`document.querySelectorAll('#term .tl').length >= 1 && !document.getElementById('board').classList.contains('reboot')`)), 'Symbolic: after the reboot the board is back with Axioms banked and the terminal narrating');
  // Statistical: drawer, chips, autopilot unlock via real focus clicks
  await ev(`(function(){var S=${G}.S;S.maxEra=3;${G}.ERAS[3].open(S);S.e3.dataset=8;S.e3.model=6;S.e3.accuracy=0.6;S.data=500;S.silicon=300;S.e3.trials=100;${G}.navTo(3);})()`);
  ok(await ev(`document.querySelectorAll('#mchips .mchip').length === 6 && !!document.getElementById('xpBtn') && !document.querySelector('.exp-board')`), 'Statistical: method chips in the header, Experiments as a button, no board panel');
  await ev(`document.getElementById('xpBtn').click();`); ok(await ev(`document.getElementById('research').classList.contains('show') && document.querySelectorAll('#researchBody .exp-card').length === 3`), 'Statistical: EXPERIMENTS opens a 3-card drawer');
  await ev(`document.getElementById('researchClose').click();`);
  for (const k of ['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit']) await ev(`document.getElementById('foc-${k}').click();`);
  await sleep(200);
  ok(await ev(`!!document.getElementById('foc-auto') && ${G}.S.e3.flags.autopilot === true`), 'Statistical: a predictable player sees AUTOPILOT appear as a fourth Focus');
  await ev(`document.getElementById('foc-auto').click(); ${G}.tick();`); ok(await ev(`/AUTO/.test(document.getElementById('expLabel').textContent)`), 'Statistical: Autopilot labels the RUN TRIAL button');
  // Deep: architecture drawer + tools through the DOM
  await ev(`(function(){var S=${G}.S;S.maxEra=4;${G}.ERAS[4].open(S);S.e4.node=14;S.e4.vision=0.55;S.e4.language=0.4;S.e4.reasoning=0.6;S.silicon=2000;S.data=400;S.insight=200;S.knowledge=400;S.capability=2000;${G}.navTo(4);})()`);
  ok(await ev(`!document.getElementById('orch') && !!document.getElementById('archBtn') && !document.getElementById('stabBtn')`), 'Deep: orchestration prose gone; ARCHITECTURE button present; Stabilizer moved into it');
  await ev(`document.getElementById('archBtn').click();`); ok(await ev(`document.querySelectorAll('#researchBody .arch').length === 7`), 'Deep: the Architecture drawer lists 7 upgrades');
  await ev(`document.getElementById('archb-checkpoint').click(); document.getElementById('archb-distill').click(); ${G}.tick();`);
  ok(await ev(`${G}.S.e4.arch.checkpoint && ${G}.S.e4.arch.distill && !!document.getElementById('ckptBtn') && !!document.getElementById('distillBtn')`), 'Deep: buying Checkpointing + Distillation reveals the verbs in Steering');
  await ev(`document.getElementById('researchClose').click(); document.getElementById('ckptBtn').click(); ${G}.S.e4.vision = 0.3; ${G}.tick(); document.getElementById('restoreBtn').click(); ${G}.tick();`);
  ok((await ev(`${G}.S.e4.vision`)) >= 0.5 && (await ev(`${G}.S.e4.restores`)) === 1, 'Deep: CHECKPOINT then RESTORE brings Vision back');
  await ev(`document.getElementById('distillBtn').click(); ${G}.tick();`); ok((await ev(`${G}.S.e4.distills`)) === 1, 'Deep: DISTILL fires from its button');
  ok(await ev(`(function(){var b=document.getElementById('eventBanner');return b && b.textContent.length < 60;})()`), 'Deep: the event banner is a short colored strip');
  // Foundation: feedback card, rate it, then emerge → rupture → sixth tab → operated eras → finale → legacy
  await ev(`(function(){var S=${G}.S;S.maxEra=5;${G}.ERAS[5].open(S);S.e4.vision=0.9;S.e4.language=0.9;S.e4.reasoning=0.9;S.capability=600;S.scale=400;${G}.navTo(5);})()`);
  ok(await ev(`!!document.getElementById('fb') && document.getElementById('fbYes').disabled === true`), 'Foundation: the FEEDBACK card is present and idle at first');
  await ev(`${G}.ERAS[5].acts.fbEmit(); ${G}.tick();`); ok(await ev(`document.getElementById('fbYes').disabled === false && document.getElementById('fb').classList.contains('open')`), 'Foundation: an output opens the card');
  await ev(`document.getElementById('fbNo').click(); ${G}.tick();`); ok((await ev(`${G}.S.e5.fb.penalized`)) === 1, 'Foundation: PENALIZE rates through the button');
  await ev(`${G}.S.scale = ${G}.CFG ? 0 : 0; ${G}.S.scale = 1600; ${G}.tick();`); await sleep(150); // just past emergeScale (1550), well short of finalGate
  ok(await ev(`${G}.S.e5.emerged === true`), 'Foundation: crossing the threshold emerges');
  await sleep(3400); // the rupture cinematic
  ok(await ev(`document.querySelectorAll('#eraNav .era-tab').length === 6 && document.querySelector('#eraNav .era-tab.agent') !== null`), 'rupture: a sixth tab appears in the nav, named for the agent');
  ok(await ev(`!document.body.classList.contains('rupturing') && document.getElementById('rupture').className === 'rupture'`), 'rupture: the cinematic cleans up after itself');
  await ev(`document.querySelector('#eraNav .era-tab.agent').click();`); await sleep(150);
  ok((await ev(`${G}.S.era`)) === 6 && (await ev(`document.body.classList.contains('theme-6') && !!document.getElementById('node-operator') && document.querySelectorAll('#agl .row').length >= 2`)), 'agent tab: renders its flow board with THE OPERATOR and its ledger');
  ok(await ev(`document.getElementById('eraName').textContent === ${G}.S.e5.agentName`), 'agent tab: the header carries its name');
  await ev(`${G}.navTo(1);`); await sleep(100);
  ok(await ev(`document.getElementById('board').classList.contains('operated') && !!document.querySelector('.goal .op-line') && getComputedStyle(document.getElementById('inscribe')).pointerEvents === 'none'`), 'operated: Origins is visibly its now (line in the goal, verbs off)');
  await ev(`${G}.navTo(5); ${G}.S.e5.control = 95; ${G}.S.scale = 99999; ${G}.tick();`); await sleep(200);
  ok(await ev(`${G}.S.e5.ending === 'contained' && document.getElementById('finale').classList.contains('show')`), 'ending: the finale overlay plays');
  ok(await ev(`(function(){try{var l=JSON.parse(localStorage.getItem('emergence_v4_legacy'));return !!(l&&l.runs===1&&l.ending==='contained'&&l.name);}catch(e){return false;}})()`), 'ending: legacy is written to localStorage');
  await sleep(6500);
  ok(await ev(`!document.getElementById('finale').classList.contains('show') && !!document.querySelector('.endcard')`), 'ending: the finale yields to the scorecard');
  // new game: the legacy is loaded and the first-run card remembers
  await ev(`${G}.newGame();`); await sleep(400);
  ok(await ev(`!!${G}.S.legacy && ${G}.S.legacy.runs === 1 && ${G}.S.era === 1 && !document.getElementById('board').classList.contains('operated')`), 'new game: legacy loaded, board clean');
  console.log('v4 DOM smoke: ' + pass + ' passed, ' + fail + ' failed'); if (fails.length) fails.forEach(f => console.log('  ✗ ' + f));
  console.log('console errors: ' + (errors.length ? JSON.stringify(errors, null, 2) : 'none'));
  ws.close(); chrome.kill(); process.exit((fail || errors.length) ? 1 : 0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
