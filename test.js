#!/usr/bin/env node
/*
 * EMERGENCE test harness — run with: node test.js   (no dependencies)
 *
 *   1. CORRECTNESS  — math, Origins converter chain + starvation, fabrication,
 *      Symbolic tech tree + compile, save/load, offline catch-up, no NaN.
 *   2. PROGRESSION  — an autoplayer plays a fresh game at speed: it must
 *      complete Era 1 (Origins → fabricate the Logic Machine), then Era 2
 *      (Symbolic → Expert System). Prints minutes per era for balancing.
 *
 * The game is one self-contained HTML file with logic in a single IIFE. We
 * extract it, run it against a tiny DOM/canvas/localStorage shim, and read
 * internals via the window.__EMERGENCE_TEST__ seam.
 */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'emergence.html'), 'utf8');
const SCRIPT = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- Minimal headless shims ----
const CTX = { setTransform(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){},
  arc(){}, fill(){}, fillText(){}, createRadialGradient(){ return { addColorStop(){} }; } };
function makeEl(){
  return { style:{}, dataset:{}, className:'', innerHTML:'', textContent:'', width:0, height:0, onclick:null, disabled:false,
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(c){ return c; }, remove(){}, addEventListener(){}, setAttribute(){},
    getBoundingClientRect(){ return { width:1000, height:300, left:0, top:0, right:1000, bottom:300 }; },
    getContext(){ return CTX; }, querySelector(){ return makeEl(); }, querySelectorAll(){ return []; } };
}
function installShims(){
  const store = new Map(), els = new Map();
  global.window = global; global.__EMERGENCE_TEST__ = true; global.devicePixelRatio = 1;
  global.location = { search:'', reload(){} };
  global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {};
  global.setTimeout = (fn) => { try{ fn(); }catch(e){} return 0; }; global.clearTimeout = () => {};
  global.setInterval = () => 0; global.clearInterval = () => {};
  global.addEventListener = () => {}; global.removeEventListener = () => {};
  global.localStorage = { getItem:(k)=> store.has(k)?store.get(k):null, setItem:(k,v)=> store.set(k,String(v)), removeItem:(k)=> store.delete(k) };
  global.document = { hidden:false, addEventListener(){}, createElement(){ return makeEl(); },
    querySelectorAll(){ return []; }, getElementById(id){ if(!els.has(id)) els.set(id, makeEl()); return els.get(id); } };
}
function freshGame(){ installShims(); (0, eval)(SCRIPT); return global.window.EMERGENCE; }

// ---- tiny assert framework ----
let passed = 0, failed = 0; const fails = [];
function ok(cond, msg){ if(cond){ passed++; } else { failed++; fails.push(msg); console.log('  ✗ '+msg); } }
function near(a, b, eps, msg){ ok(Math.abs(a-b) <= eps, msg+` (got ${a}, want ~${b})`); }
function section(name){ console.log('\n'+name); }
const FAKE_EV = { currentTarget:{ getBoundingClientRect(){ return { left:0, width:0, top:0 }; } } };
const finite = (S, keys) => keys.every(k => Number.isFinite(S[k]));

// ====================================================================
// 1. CORRECTNESS
// ====================================================================
function testFormatting(){
  section('Number formatting');
  const { fmt } = freshGame();
  ok(fmt(0) === '0', 'fmt(0) = "0"');
  ok(fmt(1500) === '1.50K', 'fmt(1500) = "1.50K"');
  ok(fmt(1e6) === '1.00M', 'fmt(1e6) = "1.00M"');
}

function testCostMath(){
  section('Cost + bulk-buy math');
  const EM = freshGame(); const b = EM.BUYS.ruleset;
  let prev = -1, mono = true;
  for(let c=0;c<20;c++){ const u = EM.unitCost(b, c); if(u <= prev) mono = false; prev = u; }
  ok(mono, 'unit cost is monotonically increasing');
  let sum10 = 0; for(let i=0;i<10;i++) sum10 += EM.unitCost(b,i);
  ok(EM.totalCost(b,10) === sum10, 'x10 total equals the sum of 10 escalating unit costs');
  EM.S.rules = 100; EM.S.ruleset = 0; EM.S.buyMode = 'max';
  const n = EM.buyQty('ruleset');
  ok(EM.S.rules - EM.totalCost(b, n) < EM.unitCost(b, n), 'after MAX, leftover < next unit cost');
}

function testOriginsChain(){
  section('Origins — converter chain + starvation');
  let EM = freshGame(); let S = EM.S;
  // scribe/miner are sources
  S.scribe = 4; EM.produce(1); ok(S.marks > 0, 'scribes produce marks');
  S.miner = 4; EM.produce(1); ok(S.ore > 0, 'miners produce ore');
  // scriptorium starves without marks, converts when fed (now also needs Ore for upkeep)
  EM = freshGame(); S = EM.S;
  S.scriptorium = 2; S.marks = 0; S.ore = 100;
  EM.produce(1); ok(S.knowledge === 0, 'scriptorium idles when starved of marks');
  S.marks = 10; EM.produce(1); ok(S.knowledge > 0 && S.marks < 10, 'scriptorium converts marks → knowledge when fed');
  // foundry needs BOTH metal and knowledge
  EM = freshGame(); S = EM.S;
  S.foundry = 2; S.metal = 10; S.knowledge = 0;
  EM.produce(1); ok(S.silicon === 0, 'foundry idles without knowledge');
  S.knowledge = 10; EM.produce(1);
  ok(S.silicon > 0 && S.metal < 10 && S.knowledge < 10, 'foundry consumes metal AND knowledge to make silicon');
}

function testUpkeep(){
  section('Origins — upkeep drains (additions contain subtractions)');
  let EM = freshGame(); let S = EM.S;
  // a scriptorium with plenty of marks but NO ore cannot run (ore upkeep)
  S.scriptorium = 2; S.marks = 100; S.ore = 0;
  EM.produce(1); ok(S.knowledge === 0, 'scriptorium cannot make Knowledge without Ore for upkeep');
  S.ore = 100; const oreBefore = S.ore; EM.produce(1);
  ok(S.knowledge > 0 && S.ore < oreBefore, 'making Knowledge drains the Ore stockpile (Knowledge taxes Materials)');
  // a smelter burns Knowledge as it makes Metal
  EM = freshGame(); S = EM.S;
  S.smelter = 2; S.ore = 100; S.knowledge = 100; const kBefore = S.knowledge;
  EM.produce(1); ok(S.metal > 0 && S.knowledge < kBefore, 'making Metal drains the Knowledge stockpile (Materials taxes Knowledge)');
  // The Wheel is a real tradeoff: more ore, fewer marks
  EM = freshGame(); S = EM.S;
  const base = EM.oStats();
  S.disco.wheel = true; const w = EM.oStats();
  ok(w.minerY > base.minerY && w.scribeY < base.scribeY, 'The Wheel adds Ore yield AND subtracts Marks yield');
}

function testDiscovery(){
  section('Origins — discovery web (prereqs, cross-gates, effects)');
  const EM = freshGame(); const S = EM.S;
  ok(EM.discoVisible('tally') && !EM.discoVisible('scribe'), 'only root discoveries are visible at start');
  S.marks = 100000; S.t = 1000; // past all time gates; timing is covered by testTimeGate
  EM.buyDisco('tally');
  ok(EM.discoVisible('scribe') && EM.discoVisible('stoneworking'), 'buying Tally reveals its children');
  near(EM.oStats().inscribe, EM.CFG.e1.inscribeBase * 2, 1e-9, 'Tally Marks doubles inscribe');
  EM.buyDisco('scribe'); ok(S.flags.canScribe, 'The Scribe unlocks the scribe building');
  EM.buyDisco('stoneworking'); ok(S.flags.o_materials, 'Stoneworking unlocks the materials track');
  // clayTablets is cross-gated by ore (materials gates knowledge)
  S.ore = 0; ok(!EM.canBuyDisco('clayTablets'), 'Clay Tablets blocked without ore');
  S.ore = 20; ok(EM.canBuyDisco('clayTablets'), 'Clay Tablets buyable once ore is present');
  EM.buyDisco('clayTablets'); ok(S.flags.o_scriptorium, 'Clay Tablets unlocks the scriptorium');
}

function testFabrication(){
  section('Fabrication completes Era 1');
  const EM = freshGame(); const S = EM.S;
  S.flags.o_foundry = true; S.silicon = EM.CFG.e1.siliconGate;
  EM.checkMiles();
  ok(S.flags.canFabricate, 'fabrication unlocks at the silicon gate once the Foundry exists');
  EM.fabricate();
  ok(S.flags.origindone, 'fabricate() completes Origins');
  EM.checkMiles();
  ok(S.maxEra >= 2, 'completing Origins opens the Symbolic era');
}

function testTechTree(){
  section('Symbolic tech tree — prerequisites + effects');
  const EM = freshGame(); const S = EM.S; S.rules = 1e9;
  ok(!EM.canBuyTech('fwdChain'), 'cannot buy a node before its prerequisite');
  EM.buyTech('formalLogic');
  near(EM.stats().global, 1.5, 1e-9, 'Formal Logic gives +50% global production');
  EM.buyTech('bwdChain');
  ok(EM.stats().click >= 3, 'Backward Chaining at least triples click value');
  ['fwdChain','rete','inference','heuristics','knowledge','metalogic'].forEach(id => EM.buyTech(id));
  ok(!EM.canBuyTech('expert'), 'Expert System blocked without enough Axioms');
  S.axioms = 20;
  ok(EM.canBuyTech('expert'), 'Expert System buyable once Axioms requirement met');
  EM.buyTech('expert');
  ok(S.flags.symbolicDone === true, 'buying Expert System completes the Symbolic era');
}

function testCompile(){
  section('Symbolic compile → Axioms loop');
  const EM = freshGame(); const S = EM.S;
  S.flags.compile = true; S.runRules = EM.CFG.e2.axiomDivisor * 9;
  ok(EM.axiomGain() === 3, 'axiom gain = floor(sqrt(runRules / divisor))');
  S.rules = 500; S.ruleset = 5; S.daemon = 3; S.tech.formalLogic = true;
  EM.compile();
  ok(S.axioms === 3, 'compile banks the axioms');
  ok(S.rules === 0 && S.ruleset === 0 && S.daemon === 0, 'compile resets the run');
  ok(S.tech.formalLogic === true, 'compile preserves owned technique');
}

function testSaveLoad(){
  section('Save / load roundtrip');
  const EM = freshGame(); const S = EM.S;
  S.flags.firstAuto = true; S.marks = 321; S.knowledge = 45; S.silicon = 12; S.scribe = 8;
  S.maxEra = 2; S.rules = 1234.5; S.axioms = 7; S.tech.formalLogic = true; S.buyMode = 'max';
  EM.save();
  S.marks = 0; S.knowledge = 0; S.silicon = 0; S.scribe = 0; S.maxEra = 1; S.rules = 0; S.axioms = 0; S.tech = {}; S.buyMode = '1';
  EM.load();
  ok(S.marks === 321 && S.knowledge === 45 && S.silicon === 12, 'Origins resources restored');
  ok(S.scribe === 8, 'Origins building counts restored');
  near(S.rules, 1234.5, 1e-6, 'rules restored');
  ok(S.axioms === 7 && S.tech.formalLogic, 'axioms + tech restored');
  ok(S.maxEra === 2 && S.buyMode === 'max', 'era + buy mode restored');
}

function testOffline(){
  section('Offline progress');
  const EM = freshGame(); const S = EM.S;
  S.started = true; S.flags.firstAuto = true; S.scribe = 5; // passive marks
  const before = S.marks;
  const r1 = EM.offlineCatchup(600);
  ok(r1 && r1.g.marks > 0, 'offline grants passive Origins income');
  ok(S.marks > before, 'resources increased after catch-up');
  ok(EM.offlineCatchup(99999).eff === 8*3600, 'offline capped at 8 hours');
  ok(EM.offlineCatchup(0.2) === null, 'sub-second gaps return nothing');
}

function testNoNaN(){
  section('Production never yields NaN');
  const EM = freshGame(); const S = EM.S;
  S.scribe=6; S.miner=6; S.scriptorium=3; S.smelter=3; S.foundry=2; S.marks=100; S.ore=100; S.knowledge=50; S.metal=50;
  S.ruleset=6; S.daemon=4; S.axioms=10; S.tech={formalLogic:true,fwdChain:true,bwdChain:true,rete:true,heuristics:true};
  S.dataset=3; S.model=2; S.data=100; S.insight=80; S.compute=4; S.training=3; S.capability=50; S.cluster=2;
  for(let i=0;i<200;i++) EM.produce(0.1);
  ok(finite(S, ['marks','knowledge','ore','metal','silicon','rules','data','insight','capability','scale']), 'all resources stay finite');
}

function testNoIdleRebuild(){
  section('No DOM rebuild on idle ticks (anti-strobe guard)');
  const EM = freshGame(); const { S, MILES } = EM;
  S.started = true; S.marks = 5;
  EM.revealGame();
  S.scribe = 4;
  MILES.forEach(m => S.flags[m.id] = true);
  EM.tick();
  const eras = global.document.getElementById('eras');
  let writes = 0, store = eras.innerHTML;
  Object.defineProperty(eras, 'innerHTML', { configurable:true, get(){ return store; }, set(v){ writes++; store = v; } });
  const before = S.marks;
  for(let i=0;i<20;i++) EM.tick();
  ok(writes === 0, 'era DOM is not rebuilt on idle ticks (saw '+writes+' rebuilds)');
  ok(S.marks > before, 'values still advance while the DOM stays put');
}

// ====================================================================
// 2. PROGRESSION — autoplay Origins → Symbolic
// ====================================================================
function originsStep(EM){
  const { S, DISCO } = EM;
  if(S.flags.origindone) return;
  for(let i=0;i<5;i++) EM.inscribe(FAKE_EV);
  if(S.flags.o_materials) for(let i=0;i<5;i++) EM.quarry(FAKE_EV);
  // unlock the next tier: buy any affordable discovery
  for(const n of DISCO) if(EM.canBuyDisco(n.id)) EM.buyDisco(n.id);
  // grow sources, keep converters below their feeding source so upstream stays ahead
  if(S.flags.canScribe && S.scribe < 25) EM.buy('scribe');
  if(S.flags.o_materials && S.miner < 25) EM.buy('miner');
  if(S.flags.o_scriptorium && S.scriptorium < S.scribe) EM.buy('scriptorium');
  if(S.flags.o_smelter && S.smelter < S.miner) EM.buy('smelter');
  if(S.flags.o_foundry && S.foundry < Math.min(S.scriptorium, S.smelter)) EM.buy('foundry');
  if(S.flags.canFabricate) EM.fabricate();
}
function symbolicStep(EM){
  const { S, TREE, BUYS } = EM;
  if(S.flags.symbolicDone) return;
  const clicks = (S.ruleset + S.daemon < 1) ? 8 : 1;
  for(let i=0;i<clicks;i++) EM.writeRule(FAKE_EV);
  const next = TREE.find(n => n.id!=='expert' && !S.tech[n.id] && n.req.every(r=>S.tech[r]) && (!n.reqAxioms || S.axioms>=n.reqAxioms));
  const goalCost = next ? next.cost : Infinity;
  if(S.ruleset < 30){ const c = EM.totalCost(BUYS.ruleset,1); if(S.rules - c > Math.min(goalCost*0.5, 250)) EM.buy('ruleset'); }
  if(S.tech.inference && S.daemon < 20){ const c = EM.totalCost(BUYS.daemon,1); if(S.rules - c > goalCost*0.6) EM.buy('daemon'); }
  if(next && S.rules >= next.cost) EM.buyTech(next.id);
  if(EM.canBuyTech('expert')) EM.buyTech('expert');
  if(S.flags.compile && !S.flags.symbolicDone){
    const stuck = !TREE.some(n => n.id!=='expert' && EM.canBuyTech(n.id));
    const needForExpert = S.tech.metalogic && S.tech.heuristics && S.axioms < 12;
    if((stuck || needForExpert) && EM.axiomGain() >= Math.max(2, Math.ceil(S.axioms*0.5))) EM.compile();
  }
}
function testProgression(){
  section('Progression — autoplay Origins → Symbolic');
  const EM = freshGame(); const { S } = EM;
  const MAX = 200000;
  let tick = 0, origAt, symAt;
  for(; tick < MAX; tick++){
    if(S.maxEra === 1) originsStep(EM); else symbolicStep(EM);
    EM.tick();
    if(origAt === undefined && S.flags.origindone) origAt = S.t;
    if(S.flags.symbolicDone){ symAt = S.t; break; }
  }
  const mm = s => s===undefined ? '—' : (s/60).toFixed(1)+'m';
  console.log('  Era 1 (Origins) fabricated at ' + mm(origAt));
  console.log('  Era 2 (Symbolic) completed at ' + mm(symAt) + (origAt&&symAt?('  (Era 2 took '+((symAt-origAt)/60).toFixed(1)+'m)'):''));
  console.log('  origins: scribe='+S.scribe+' miner='+S.miner+' scriptorium='+S.scriptorium+' smelter='+S.smelter+' foundry='+S.foundry);
  ok(S.flags.origindone, 'Era 1 (Origins) completes — fabrication reached, no stall');
  ok(S.maxEra >= 2, 'Symbolic era opens after fabrication');
  ok(S.flags.symbolicDone, 'Era 2 (Symbolic) still completes after the renumber');
  ok(finite(S, ['marks','silicon','rules','axioms']), 'no NaN at completion');
  if(origAt){ const m = origAt/60;
    if(m < 3) console.log('  ⚠ Origins faster than 5-6m target ('+m.toFixed(1)+'m)');
    else if(m > 9) console.log('  ⚠ Origins slower than 5-6m target ('+m.toFixed(1)+'m)');
    else console.log('  ✓ Origins pacing in band ('+m.toFixed(1)+'m)');
  }
}

// ====================================================================
// 3. PACING MODEL — human-ish autoplayer at different click rates
// ====================================================================
// Plays Origins clicking at a fixed rate (alternating Inscribe/Quarry once
// Materials open), buying discoveries/buildings greedily. Records when each
// beat is reached so I can compare against the 30/60/120/300s targets and
// tune the cost math without waiting on live sessions.
function runOrigins(EM, clicksPerSec){
  const { S, DISCO } = EM;
  const beats = {}; const mark = (k)=>{ if(beats[k]===undefined) beats[k]=S.t; };
  let acc=0, alt=0;
  for(let tk=0; tk<300000 && !S.flags.origindone; tk++){
    acc += clicksPerSec*0.1;
    while(acc>=1){ acc--; if(S.flags.o_materials && (alt++ %2)) EM.quarry(FAKE_EV); else EM.inscribe(FAKE_EV); }
    for(const n of DISCO) if(EM.canBuyDisco(n.id)){ EM.buyDisco(n.id); mark(n.id); }
    if(S.flags.canScribe && S.scribe<25) EM.buy('scribe');
    if(S.flags.o_materials && S.miner<25) EM.buy('miner');
    if(S.flags.o_scriptorium && S.scriptorium<S.scribe) EM.buy('scriptorium');
    if(S.flags.o_smelter && S.smelter<S.miner) EM.buy('smelter');
    if(S.flags.o_foundry && S.foundry<Math.min(S.scriptorium,S.smelter)) EM.buy('foundry');
    if(S.flags.canFabricate) EM.fabricate();
    EM.tick();
  }
  beats.done = S.flags.origindone ? S.t : undefined;
  return beats;
}
function reportPacing(){
  section('Pacing model — beats vs targets across click rates');
  const cols=[['stoneworking',30],['clayTablets',60],['kiln',120],['theFoundry',300]];
  const T=s=> s===undefined?'—':(Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0'));
  console.log('  rate(c/s) │ '+cols.map(([k])=>k.slice(0,10).padStart(11)).join('')+' │  fabricate');
  console.log('  TARGET    │ '+cols.map(([,t])=>T(t).padStart(11)).join('')+' │');
  console.log('  ──────────┼'+'─'.repeat(cols.length*11+1)+'┼───────────');
  for(const cps of [1,2,4]){
    const b=runOrigins(freshGame(), cps);
    console.log('  '+String(cps).padStart(7)+'   │ '+cols.map(([k])=>T(b[k]).padStart(11)).join('')+' │ '+T(b.done).padStart(10));
  }
}

// ---- run all ----
console.log('EMERGENCE test suite');
console.log('====================');
testFormatting();
testCostMath();
testOriginsChain();
testUpkeep();
testDiscovery();
testFabrication();
testTechTree();
testCompile();
testSaveLoad();
testOffline();
testNoNaN();
testNoIdleRebuild();
testProgression();
reportPacing();

console.log('\n====================');
console.log(`${passed} passed, ${failed} failed`);
if(failed){ console.log('\nFAILURES:'); fails.forEach(f=>console.log('  - '+f)); process.exit(1); }
console.log('All green. ✓');
