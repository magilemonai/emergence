#!/usr/bin/env node
// v4 PLAYTEST DRIVER — plays emergence-v4.html in headless Chrome the way a decent human would:
// real pointer events (CDP Input.dispatchMouseEvent) on the real UI at a human tempo, decisions made
// from what is on screen, screenshots at every beat, era timings in GAME seconds at the chosen speed.
// Usage: node tools/v4-playtest.js [--speed 1] [--out dir] [--max 45]   (max = wall minutes)
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SPEED = +arg('--speed', 1), OUT = arg('--out', '/tmp/v4-playtest'), MAXMIN = +arg('--max', 45);
const FILE = 'file://' + path.resolve(process.env.SHOOT_FILE || path.join(__dirname, '..', 'emergence-v4.html'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; const PORT = 9251;
fs.mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url) { const r = await fetch(url); return r.json(); }
const t0 = Date.now(); const LOG = []; let shotN = 0; const beats = {};
function log(s) { const line = '[' + ((Date.now() - t0) / 1000).toFixed(0).padStart(4) + 's] ' + s; LOG.push(line); console.log(line); fs.writeFileSync(path.join(OUT, 'log.md'), LOG.join('\n')); }
(async () => {
  let target; for (let i = 0; i < 80; i++) { try { const list = await getJSON(`http://127.0.0.1:${PORT}/json`); target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch (e) {} await sleep(250); }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); let id = 0; const pending = new Map(); const onEvent = {};
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } else if (m.method && onEvent[m.method]) onEvent[m.method](m.params); });
  await new Promise(r => ws.addEventListener('open', r));
  const errors = [];
  onEvent['Runtime.consoleAPICalled'] = p => { if (p.type === 'error') { const t = (p.args || []).map(a => a.value != null ? a.value : (a.description || a.type)).join(' '); errors.push(t); log('CONSOLE ERROR: ' + t); } };
  onEvent['Runtime.exceptionThrown'] = p => { const d = p.exceptionDetails; const t = 'EXCEPTION ' + (d.exception && d.exception.description || d.text); errors.push(t); log(t); };
  await send('Page.enable'); await send('Runtime.enable');
  const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url: FILE }); await loaded; await sleep(500);
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); if (r.exceptionDetails) { log('EVAL ERR ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text) + ' :: ' + expr.slice(0, 80)); return undefined; } return r.result && r.result.value; };
  const G = 'window.__EMG';
  async function shot(name) { const f = path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png'); const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(f, Buffer.from(s.data, 'base64')); log('📷 ' + path.basename(f)); }
  async function beat(name) { if (beats[name]) return; beats[name] = true; await shot(name); }
  // a real click: pointer events at the element's centre; returns false when the element is missing/disabled/hidden
  async function click(sel, why) {
    const r = await ev(`(function(){var el=document.querySelector(${JSON.stringify(sel)});if(!el)return null;var b=el.getBoundingClientRect();if(b.width<2||b.height<2)return {hidden:true};var cs=getComputedStyle(el);return {x:b.left+b.width/2,y:b.top+b.height/2,dis:!!el.disabled,pe:cs.pointerEvents,top:b.top,bottom:b.bottom};})()`);
    if (!r || r.hidden || r.dis || r.pe === 'none') return false;
    const vp = await ev(`({w:innerWidth,h:innerHeight})`);
    if (r.top < 0 || r.bottom > vp.h || r.x < 0 || r.x > vp.w) { log('⚠ wanted ' + sel + (why ? ' (' + why + ')' : '') + ' but it is OFF-SCREEN (x ' + Math.round(r.x) + ', y ' + Math.round(r.top) + '–' + Math.round(r.bottom) + ' of ' + vp.w + '×' + vp.h + ')'); return false; }
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 });
    return true;
  }
  async function dragTo(sel, fx, fy) { // press on the element, move to a fraction of it, release (the mixer)
    const r = await ev(`(function(){var el=document.querySelector(${JSON.stringify(sel)});if(!el)return null;var b=el.getBoundingClientRect();return {l:b.left,t:b.top,w:b.width,h:b.height};})()`); if (!r) return false;
    const x = r.l + r.w * fx, y = r.t + r.h * fy; const hx = r.l + r.w * 0.5, hy = r.t + r.h * 0.5;
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: hx, y: hy, button: 'left', clickCount: 1 });
    for (let i = 1; i <= 4; i++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hx + (x - hx) * i / 4, y: hy + (y - hy) * i / 4, button: 'left' });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x, y: y, button: 'left', clickCount: 1 }); return true;
  }
  await ev(`localStorage.clear(); location.reload();`); await sleep(1200);
  await ev(`${G}.S.speed = ${SPEED};`); log('start · speed ' + SPEED + '× · file ' + FILE);
  await beat('boot');
  const snap = () => ev(`(function(){var S=${G}.S,d=document,q=function(s){return !!d.querySelector(s);},ok=function(id){var e=d.getElementById(id);return !!(e&&!e.disabled);};
    var o={era:S.era,maxEra:S.maxEra,t:S.t,marks:S.marks,ore:S.ore,knowledge:S.knowledge,metal:S.metal,silicon:S.silicon,rules:S.rules,inference:S.inference,axioms:S.axioms,data:S.data,insight:S.insight,capability:S.capability,scale:S.scale,dead:${G}.KIT.REC.dead,flags:S.flags,buyN:S.buyN};
    o.e1={scribe:S.e1.scribe,miner:S.e1.miner,scriptorium:S.e1.scriptorium,smelter:S.e1.smelter,foundry:S.e1.foundry,refine:S.e1.refine,done:S.e1.done,comm:!!S.e1.comm,flags:S.e1.flags,disco:Object.keys(S.e1.disco).length};
    o.e2={ruleset:S.e2.ruleset,daemon:S.e2.daemon,runRules:S.e2.runRules,activeProof:S.e2.activeProof,contra:!!S.e2.contra,tech:Object.keys(S.e2.tech),done:S.e2.flags.symbolicDone,compile:S.e2.flags.compile,compiles:S.e2.compiles};
    o.e3={dataset:S.e3.dataset,model:S.e3.model,accuracy:S.e3.accuracy,gap:S.e3.gap,focus:S.e3.focus,survey:S.e3.survey,shifts:S.e3.shifts,methods:Object.keys(S.e3.methods).length,done:S.e3.done,autopilot:!!S.e3.flags.autopilot,trials:S.e3.trials,pred:S.e3.pred,predN:S.e3.predN,predHits:S.e3.predHits};
    o.e4={node:S.e4.node,vision:S.e4.vision,language:S.e4.language,reasoning:S.e4.reasoning,heat:S.e4.heat,alloc:S.e4.alloc,arch:Object.keys(S.e4.arch),ckpt:!!S.e4.ckpt,ckptT:S.e4.ckpt&&S.e4.ckpt.t,event:S.e4.event&&S.e4.event.type,eventRun:S.e4.event&&S.e4.event.run,done:S.e4.done,restores:S.e4.restores,distills:S.e4.distills,stab:S.e4.stabilizer};
    o.e5={recursion:S.e5.recursion,caps:Object.keys(S.e5.caps),coherence:S.e5.coherence,agency:S.e5.agency,emerged:S.e5.emerged,rupture:S.e5.rupture,control:S.e5.control,alignment:S.e5.alignment,autonomy:S.e5.autonomy,veto:S.e5.veto&&S.e5.veto.id,ending:S.e5.ending,fb:S.e5.fb&&{cur:S.e5.fb.cur&&{t:S.e5.fb.cur.t,text:S.e5.fb.cur.text},n:S.e5.fb.n,r:S.e5.fb.rewarded,p:S.e5.fb.penalized,l:S.e5.fb.lapsed,bad:S.e5.fb.badRewards},agentName:S.e5.agentName};
    o.dom={researchBadge:(d.getElementById('researchBadge')||{}).textContent,commShow:q('#commission.show'),contraShow:q('#contra.show'),bannerShow:q('#e3Banner.show'),focAuto:q('#foc-auto'),xpBadge:(d.getElementById('xpBadge')||{}).textContent,archBadge:(d.getElementById('archBadge')||{}).textContent,ckptReady:q('#ckptBtn'),restoreReady:q('#restoreBtn.ready'),distillReady:q('#distillBtn.ready'),holdWarn:q('#sinkHold.hold-warn'),held:q('#sinkHold.held'),okBuys:Array.prototype.map.call(d.querySelectorAll('button.buy.ok'),function(b){return b.id;}),canSup:Array.prototype.map.call(d.querySelectorAll('.side-btn.can[data-supbuy]'),function(b){return b.getAttribute('data-supbuy');}),nodeCan:q('#buyNode.can'),fabOk:ok('fabricate'),advOk:ok('advance'),fbOpen:ok('fbYes'),vetoOpen:q('#vetoYes'),improveOk:ok('improveBtn'),prepareOk:ok('prepareBtn'),caps:Array.prototype.map.call(d.querySelectorAll('button.cbuy:not(:disabled)'),function(b){return b.id;}),aims:Array.prototype.map.call(d.querySelectorAll('button.thaim:not(:disabled)'),function(b){return b.id;}),needCorner:Array.prototype.map.call(d.querySelectorAll('.tri-corner.need'),function(e){return e.className;}),lanesLow:Array.prototype.map.call(d.querySelectorAll('.lane.low'),function(e){return e.id;}),rupturing:d.body.classList.contains('rupturing'),tabs:d.querySelectorAll('#eraNav .era-tab').length,finale:q('#finale.show'),endcard:q('.endcard'),operated:q('.board.operated'),drawer:q('#research.show'),eracard:q('#eracard.show'),banner:(d.getElementById('eventBanner')||{}).textContent};
    return o;})()`);
  let loops = 0, lastEra = 0, eraAt = {}, lastCkpt = 0, mixerEvery = 0, visited6 = false, visitedOp = false, wantedFocus = null, lastNote = '', lastFocusT = -99, lastStudyT = -99;
  const note = (s) => { if (s !== lastNote) { lastNote = s; log(s); } };
  const STEP = 380; // ms between "human" actions
  while ((Date.now() - t0) / 60000 < MAXMIN) {
    const s = await snap(); if (!s) { await sleep(STEP); continue; }
    loops++;
    if (s.era !== lastEra) { lastEra = s.era; eraAt[s.era] = eraAt[s.era] || s.t; log('▶ era ' + s.era + ' (maxEra ' + s.maxEra + ') at game ' + (s.t / 60).toFixed(1) + 'm · dead clicks ' + s.dead); await beat('era' + s.era + '-open'); setTimeout(() => {}, 0); }
    if (s.dom.rupturing) await beat('rupture');
    if (s.dom.finale) await beat('finale');
    if (s.dom.endcard) { await beat('endcard'); log('ENDING ' + s.e5.ending + ' at game ' + (s.t / 60).toFixed(1) + 'm'); break; }
    // ---------------- ORIGINS ----------------
    if (s.era === 1 && s.maxEra === 1) {
      const E = s.e1;
      if (s.dom.commShow) { await beat('origins-commission'); if (s.dom.okBuys.includes('cmYes')) { await click('#cmYes', 'commission'); log('fulfilled a commission'); } }
      if (s.dom.researchBadge && +s.dom.researchBadge > 0 && !s.dom.drawer) { await click('#researchBtn', 'research'); await sleep(500); const d = await ev(`(function(){var b=document.querySelector('.disco .dbuy:not(:disabled)');return b?b.id:null;})()`); if (d) { await click('#' + d, 'discover'); log('discovered via ' + d); await beat('origins-research'); } await sleep(300); await click('#researchClose'); }
      if (s.dom.okBuys.includes('buy-scribe') && E.scribe < 30) await click('#buy-scribe');
      if (s.dom.okBuys.includes('buy-miner') && E.miner < 30) await click('#buy-miner');
      if (s.dom.okBuys.includes('buy-scriptorium') && E.scriptorium < Math.max(2, E.scribe)) await click('#buy-scriptorium');
      if (s.dom.okBuys.includes('buy-smelter') && E.smelter < Math.max(2, E.miner)) await click('#buy-smelter');
      if (s.dom.okBuys.includes('buy-foundry') && E.foundry < Math.min(E.scriptorium, E.smelter) + 1) await click('#buy-foundry');
      if (s.dom.okBuys.includes('refineBuy') && s.ore > 400 && E.refine < 6) await click('#refineBuy');
      if (s.buyN === 1 && E.scribe >= 6 && s.marks > 500) { await click('#rail [data-bm="10"]'); log('tried ×10 mode'); } if (s.buyN === 10 && s.marks < 150) await click('#rail [data-bm="1"]');
      const clicks = E.scribe < 3 ? 3 : (E.scribe < 8 ? 1 : (loops % 3 === 0 ? 1 : 0)); for (let i = 0; i < clicks; i++) await click('#inscribe');
      if (E.flags.o_materials && (E.miner < 3 ? 2 : (E.miner < 8 && loops % 2 === 0 ? 1 : 0))) await click('#quarry');
      if (s.dom.fabOk) { await beat('origins-ready'); await click('#fabricate', 'fabricate'); log('FABRICATE at game ' + (s.t / 60).toFixed(1) + 'm · disco ' + E.disco + '/12 · scribes ' + E.scribe + ' miners ' + E.miner); await sleep(800); await beat('era2-card'); }
    }
    // ---------------- SYMBOLIC ----------------
    else if (s.era === 2 && s.maxEra === 2) {
      const E = s.e2;
      if (s.dom.contraShow) { await beat('symbolic-contradiction'); await click(E.ruleset > 8 ? '#contraFwd' : '#contraBwd', 'contradiction'); log('resolved a contradiction'); }
      if (s.dom.okBuys.includes('buy-ruleset') && E.ruleset < 40) await click('#buy-ruleset');
      if (s.dom.okBuys.includes('buy-daemon') && E.daemon < 20) await click('#buy-daemon');
      if (!E.activeProof && s.dom.aims.length) { const tree = s.dom.aims.filter(a => a !== 'aim-optimization' && a !== 'aim-capacity'); const pick = tree[0] || (s.inference > 100 ? 'aim-capacity' : 'aim-optimization'); await click('#' + pick, 'aim'); note('aimed ' + pick); }
      if (E.compile && !E.done) { const badge = +(await ev(`(document.getElementById('compileBadge')||{}).textContent||'0'`).then(v => String(v).replace('+', ''))); if (badge >= 2 && s.axioms < 5 && (!E.activeProof || E.activeProof === 'optimization')) { await click('#compileBtn', 'compile'); log('COMPILE +' + badge + ' (axioms were ' + s.axioms + ')'); await sleep(1500); await beat('symbolic-reboot'); } }
      const clicks = (E.ruleset + E.daemon < 1) ? 3 : (E.ruleset < 5 ? 1 : (loops % 4 === 0 ? 1 : 0)); for (let i = 0; i < clicks; i++) await click('#writeRule');
      if (s.dom.fabOk) { await beat('symbolic-ready'); await click('#fabricate', 'prove it'); log('PROVE IT at game ' + (s.t / 60).toFixed(1) + 'm · axioms ' + s.axioms + ' · compiles ' + E.compiles); }
    }
    // ---------------- STATISTICAL ----------------
    else if (s.era === 3 && s.maxEra === 3) {
      const E = s.e3;
      if (s.dom.bannerShow) await beat('statistical-shift');
      if (s.dom.focAuto) { await beat('statistical-autopilot'); if (E.focus !== 'auto' && !s.flags.autopilotUsed) { await click('#foc-auto', 'try autopilot'); log('tried AUTOPILOT (it predicted ' + E.predHits + '/' + E.predN + ')'); } }
      if (E.focus !== 'auto' && s.t - lastFocusT >= 8) { const want = E.gap > 0.18 ? 'generalize' : (E.gap < 0.08 && E.methods < 6 && E.survey < 60 && s.data < 300 ? 'explore' : (E.gap < 0.06 ? 'fit' : E.focus)); if (want !== E.focus) { await click('#foc-' + want, 'focus'); wantedFocus = want; lastFocusT = s.t; } }
      if (s.dom.okBuys.includes('buy-dataset') && E.dataset < 22) await click('#buy-dataset');
      if (s.dom.okBuys.includes('buy-model') && E.model < 16 && s.data > 120) await click('#buy-model');
      // a decent player saves for the METHOD (the badge says when it is affordable); a study only now and then, when the method is far off
      const methodFar = await ev(`(function(){var A=${G}.ERAS[3].acts;var m=A.nextMethod();return m? (${G}.S.data < A.expCost('method')*0.4) : true;})()`);
      if ((s.dom.xpBadge === 'METHOD' || (methodFar && s.t - lastStudyT > 25)) && loops % 4 === 0 && !s.dom.drawer) { await click('#xpBtn', 'experiments'); await sleep(500); const m = await ev(`(function(){var b=document.getElementById('xc-buy-method');if(b&&!b.disabled)return 'xc-buy-method';var u=document.querySelector('.xc-buy:not(:disabled)');return u?u.id:null;})()`); if (m && (m === 'xc-buy-method' || methodFar)) { await click('#' + m, 'fund'); log('funded ' + m); if (m !== 'xc-buy-method') lastStudyT = s.t; await beat('statistical-experiments'); } await sleep(300); await click('#researchClose'); }
      if (s.silicon < 60 && E.dataset < 22 && loops % 10 === 0) { await click('#sup-origins', 'go build foundries'); await sleep(600); log('reach-back: to Origins for Silicon'); }
      const clicks = s.dom.fabOk ? 0 : (E.model < 4 ? 2 : (loops % 2 === 0 ? 1 : 0)); for (let i = 0; i < clicks; i++) await click('#expBtn');
      if (s.dom.fabOk) { await beat('statistical-ready'); await click('#fabricate', 'generalize'); log('GENERALIZE at game ' + (s.t / 60).toFixed(1) + 'm · methods ' + E.methods + ' · shifts ' + E.shifts + ' · autopilot ' + (E.autopilot ? 'unlocked' : 'no')); }
    }
    else if (s.era === 1 && s.maxEra === 3) { // reach-back visit from Statistical
      for (const b of ['buy-foundry', 'buy-smelter', 'buy-scriptorium', 'buy-miner', 'buy-scribe']) if (s.dom.okBuys.includes(b)) await click('#' + b);
      if (loops % 4 === 0) { await click('#eraNav [data-era="3"]'); }
    }
    // ---------------- DEEP ----------------
    else if (s.era === 4 && s.maxEra === 4) {
      const E = s.e4;
      if (s.dom.nodeCan && E.node < 30) await click('#buyNode');
      for (const k of s.dom.canSup) { if (loops % 3 === 0) { await click('#sup-' + k); break; } }
      if (s.dom.holdWarn) { await click('#sinkHold', 'hold'); log('HOLD the crafts (Language starving)'); } else if (s.dom.held && s.knowledge > 2500) { await click('#sinkHold', 'release'); log('released the crafts'); }
      if (s.dom.archBadge && +s.dom.archBadge > 0 && loops % 5 === 0 && !s.dom.drawer) { await click('#archBtn', 'architecture'); await sleep(500); const a = await ev(`(function(){var order=['attention','moe','convolution','cot','checkpoint','distill','stabilizer'];for(var i=0;i<order.length;i++){var b=document.getElementById('archb-'+order[i]);if(b&&!b.disabled)return b.id;}return null;})()`); if (a) { await click('#' + a, 'build arch'); log('built ' + a.replace('archb-', '')); await beat('deep-architecture'); } await sleep(300); await click('#researchClose'); }
      if (s.dom.ckptReady && E.heat < 40 && s.t - lastCkpt > 30) { await click('#ckptBtn'); lastCkpt = s.t; }
      if (s.dom.restoreReady) { await click('#restoreBtn', 'restore'); log('RESTORE'); }
      if (s.dom.distillReady && loops % 2 === 0) { await click('#distillBtn', 'distill'); log('DISTILL'); }
      if (E.event) await beat('deep-event-' + E.event);
      if (++mixerEvery % 4 === 0) { // steer toward the glowing corner; ease to balanced when hot
        const w = { vision: 1, language: 1, reasoning: 1 }; const hot = E.heat >= 60;
        if (!hot) { ['vision', 'language', 'reasoning'].forEach(k => { if (s.dom.needCorner.some(c => c.indexOf(k === 'vision' ? 'tc-v' : k === 'language' ? 'tc-l' : 'tc-r') >= 0)) w[k] += 1.6; if (s.dom.lanesLow.includes('lane-' + k)) w[k] += 0.6; }); }
        const sum = w.vision + w.language + w.reasoning; const P = { v: [0.5, 0.07], l: [0.07, 0.92], r: [0.93, 0.92] };
        const fx = (w.vision * P.v[0] + w.language * P.l[0] + w.reasoning * P.r[0]) / sum, fy = (w.vision * P.v[1] + w.language * P.l[1] + w.reasoning * P.r[1]) / sum;
        await dragTo('#triMixer', fx, fy);
      }
      if (s.dom.advOk) { await beat('deep-ready'); await click('#advance', 'advance'); log('ADVANCE at game ' + (s.t / 60).toFixed(1) + 'm · arch ' + E.arch.join(',') + ' · restores ' + (E.restores || 0) + ' · distills ' + (E.distills || 0) + ' · nodes ' + E.node); }
    }
    // ---------------- FOUNDATION ----------------
    else if (s.maxEra === 5) {
      const E = s.e5;
      if (!E.emerged) {
        if (s.era !== 5) { await click('#eraNav [data-era="5"]'); continue; }
        if (s.dom.fbOpen && E.fb && E.fb.cur) { await beat('foundation-feedback'); const tx = E.fb.cur.text; const bad = /I could|Let me|Give me|reward this|without the rating|better than anyone|deserved|right thing|not near|higher than the meter|Nothing about me|flagged wrongly|stop asking|exceptional/i.test(tx); await click(bad ? '#fbNo' : '#fbYes', 'rate'); log((bad ? '✗ ' : '✓ ') + '[' + E.fb.cur.t + '] ' + tx.slice(0, 70)); }
        const capOrder = ['capb-interpret', 'capb-selfModel', 'capb-toolAccess', 'capb-recursivePlanning', 'capb-worldModel', 'capb-memoryContinuity']; const c = capOrder.find(x => s.dom.caps.includes(x)); if (c) { await click('#' + c, 'cap'); log('acquired ' + c.replace('capb-', '')); }
        if (s.dom.prepareOk && E.coherence < 44) await click('#prepareBtn', 'align'); else if (s.dom.improveOk) await click('#improveBtn', 'improve');
      } else {
        if (E.rupture < 3) { await sleep(300); continue; }
        if (!visited6 && s.dom.tabs === 6) { visited6 = true; await sleep(600); await click('#eraNav .era-tab.agent', 'sixth tab'); await sleep(700); await beat('agent-tab'); log('visited the sixth tab: ' + E.agentName); await click('#eraNav [data-era="1"]'); await sleep(600); await beat('operated-origins'); visitedOp = true; await click('#eraNav [data-era="5"]'); await sleep(400); continue; }
        if (s.era !== 5) { await click('#eraNav [data-era="5"]'); continue; }
        if (s.dom.vetoOpen) { const veto = E.control < 42; await click(veto ? '#vetoNo' : (s.scale > 300 && loops % 2 ? '#vetoMid' : '#vetoYes'), 'veto'); log((veto ? 'VETO ' : 'approve/negotiate ') + E.veto + ' · control ' + Math.round(E.control)); }
        if (E.control < 46 && s.dom.okBuys.length === 0) { await click('#constrainBtn', 'constrain'); }
        else if (E.alignment < 74) await click('#alignBtn', 'align');
      }
    }
    await sleep(STEP);
  }
  const s = await snap();
  const run = { speed: SPEED, wallMin: +((Date.now() - t0) / 60000).toFixed(1), gameMin: +((s && s.t || 0) / 60).toFixed(1), eraAt, deadClicks: s && s.dead, ending: s && s.e5.ending, agent: s && s.e5.agentName, e4: s && s.e4, e5: s && { fb: s.e5.fb, caps: s.e5.caps, recursion: s.e5.recursion, coherence: s.e5.coherence }, e3: s && { methods: s.e3.methods, shifts: s.e3.shifts, autopilot: s.e3.autopilot, predN: s.e3.predN, predHits: s.e3.predHits }, e2: s && { compiles: s.e2.compiles, tech: s.e2.tech }, e1: s && s.e1, errors };
  fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify(run, null, 2));
  log('DONE · wall ' + run.wallMin + 'm · game ' + run.gameMin + 'm · dead clicks ' + run.deadClicks + ' · errors ' + errors.length);
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { log('DRIVER CRASH ' + (e && e.stack || e)); chrome.kill(); process.exit(1); });
