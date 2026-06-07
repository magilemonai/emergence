#!/usr/bin/env node
/*
 * EMERGENCE test harness — run with: node test.js   (no dependencies)
 *
 *   1. CORRECTNESS  — math, tech-tree prereqs, compile loop, save/load,
 *      offline catch-up, no NaN/crashes.
 *   2. PROGRESSION  — an autoplayer plays a fresh game at speed and must
 *      complete the Symbolic Era (the Expert System) within a tick budget,
 *      printing how long it took. This is the balance regression net:
 *      tune CFG.e1 / tree costs, re-run, read "minutes to finish Era 1".
 *
 * The game ships as one self-contained HTML file with logic in a single IIFE.
 * We extract that script, run it against a tiny DOM/canvas/localStorage shim,
 * and read internals through the window.__EMERGENCE_TEST__ seam.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'emergence.html'), 'utf8');
const SCRIPT = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- Minimal headless shims ----
const CTX = {
  setTransform(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){},
  arc(){}, fill(){}, fillText(){}, createRadialGradient(){ return { addColorStop(){} }; },
};
function makeEl(){
  return {
    style:{}, dataset:{}, className:'', innerHTML:'', textContent:'', width:0, height:0, onclick:null, disabled:false,
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(c){ return c; }, remove(){}, addEventListener(){}, setAttribute(){},
    getBoundingClientRect(){ return { width:1000, height:300, left:0, top:0, right:1000, bottom:300 }; },
    getContext(){ return CTX; }, querySelector(){ return makeEl(); }, querySelectorAll(){ return []; },
  };
}
function installShims(){
  const store = new Map();
  const els = new Map();
  global.window = global;
  global.__EMERGENCE_TEST__ = true;
  global.devicePixelRatio = 1;
  global.location = { search:'', reload(){} };
  global.requestAnimationFrame = () => 0;
  global.cancelAnimationFrame = () => {};
  global.setTimeout = (fn) => { try{ fn(); }catch(e){} return 0; };
  global.clearTimeout = () => {};
  global.setInterval = () => 0;
  global.clearInterval = () => {};
  global.addEventListener = () => {};
  global.removeEventListener = () => {};
  global.localStorage = {
    getItem:(k)=> store.has(k)?store.get(k):null,
    setItem:(k,v)=> store.set(k,String(v)),
    removeItem:(k)=> store.delete(k),
  };
  global.document = {
    hidden:false, addEventListener(){}, createElement(){ return makeEl(); },
    querySelectorAll(){ return []; },
    getElementById(id){ if(!els.has(id)) els.set(id, makeEl()); return els.get(id); },
  };
}
function freshGame(){
  installShims();
  (0, eval)(SCRIPT);
  return global.window.EMERGENCE;
}

// ---- tiny assert framework ----
let passed = 0, failed = 0;
const fails = [];
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
  ok(fmt(999) === '999', 'fmt(999) = "999"');
  ok(fmt(1500) === '1.50K', 'fmt(1500) = "1.50K"');
  ok(fmt(1e6) === '1.00M', 'fmt(1e6) = "1.00M"');
}

function testCostMath(){
  section('Cost + bulk-buy math');
  const EM = freshGame();
  const b = EM.BUYS.ruleset;
  let prev = -1, mono = true;
  for(let c=0;c<20;c++){ const u = EM.unitCost(b, c); if(u <= prev) mono = false; prev = u; }
  ok(mono, 'unit cost is monotonically increasing');
  ok(EM.unitCost(b,0) === 10, 'first ruleset costs 10');
  let sum10 = 0; for(let i=0;i<10;i++) sum10 += EM.unitCost(b,i);
  ok(EM.totalCost(b,10) === sum10, 'x10 total equals the sum of 10 escalating unit costs');
  ok(EM.totalCost(b,1) === EM.unitCost(b,0), 'x1 total equals the first unit cost');
  EM.S.rules = 100; EM.S.ruleset = 0; EM.S.buyMode = 'max';
  const n = EM.buyQty('ruleset');
  ok(n === 6, 'MAX with 100 rules buys 6 rulesets');
  ok(EM.S.rules - EM.totalCost(b, n) < EM.unitCost(b, n), 'after MAX, leftover < next unit cost');
}

function testBuy(){
  section('Purchase path');
  const EM = freshGame(); const { S } = EM;
  S.flags.canRuleset = true; S.rules = 50; S.ruleset = 0; S.buyMode = '1';
  const before = S.rules; EM.buy('ruleset');
  ok(S.ruleset === 1, 'x1 buy increments count');
  ok(before - S.rules === 10, 'x1 buy deducts exact unit cost');
  S.rules = 0; const cnt = S.ruleset; EM.buy('ruleset');
  ok(S.ruleset === cnt && S.rules === 0, 'unaffordable buy is a no-op');
}

function testTechTree(){
  section('Tech tree — prerequisites + effects');
  const EM = freshGame(); const { S } = EM;
  S.rules = 1e9;
  ok(!EM.canBuyTech('fwdChain'), 'cannot buy a node before its prerequisite');
  ok(EM.canBuyTech('formalLogic'), 'root node is buyable with enough rules');
  EM.buyTech('formalLogic');
  ok(S.tech.formalLogic === true, 'buying marks the node owned');
  near(EM.stats().global, 1.5, 1e-9, 'Formal Logic gives +50% global production');
  ok(EM.canBuyTech('fwdChain') && EM.canBuyTech('bwdChain'), 'children unlock once prereq owned');
  EM.buyTech('bwdChain');
  ok(EM.stats().click >= 3, 'Backward Chaining at least triples click value');
  ['fwdChain','rete','inference','heuristics','knowledge','metalogic'].forEach(id => EM.buyTech(id));
  ok(!EM.canBuyTech('expert'), 'Expert System blocked without enough Axioms');
  S.axioms = 20;
  ok(EM.canBuyTech('expert'), 'Expert System buyable once Axioms requirement met');
  EM.buyTech('expert');
  ok(S.flags.era1done === true, 'buying Expert System completes the era');
}

function testCompile(){
  section('Compile → Axioms loop');
  const EM = freshGame(); const { S } = EM;
  S.flags.compile = true; S.runRules = 0;
  EM.compile();
  ok(S.axioms === 0, 'compiling with too little run yields nothing');
  S.runRules = EM.CFG.e1.axiomDivisor * 9; // sqrt(9) = 3
  ok(EM.axiomGain() === 3, 'axiom gain = floor(sqrt(runRules / divisor))');
  S.rules = 500; S.ruleset = 5; S.daemon = 3; S.tech.formalLogic = true;
  EM.compile();
  ok(S.axioms === 3, 'compile banks the axioms');
  ok(S.rules === 0 && S.ruleset === 0 && S.daemon === 0 && S.runRules === 0, 'compile resets the run');
  ok(S.tech.formalLogic === true, 'compile preserves owned technique');
  // axioms multiply production
  S.axioms = 10;
  ok(EM.stats().global > 1, 'axioms raise the global production multiplier');
}

function testSaveLoad(){
  section('Save / load roundtrip');
  const EM = freshGame(); const { S } = EM;
  S.flags.firstAuto = true; S.rules = 1234.5; S.axioms = 7; S.ruleset = 9;
  S.tech.formalLogic = true; S.tech.fwdChain = true; S.buyMode = 'max';
  EM.save();
  S.rules = 0; S.axioms = 0; S.ruleset = 0; S.tech = {}; S.buyMode = '1';
  EM.load();
  near(S.rules, 1234.5, 1e-6, 'rules restored');
  ok(S.axioms === 7, 'axioms restored');
  ok(S.ruleset === 9, 'building counts restored');
  ok(S.tech.formalLogic && S.tech.fwdChain, 'owned tech restored');
  ok(S.buyMode === 'max', 'buy mode restored');
}

function testOffline(){
  section('Offline progress');
  const EM = freshGame(); const { S } = EM;
  S.started = true; S.flags.firstAuto = true; S.ruleset = 5; // passive income
  const before = S.rules;
  const r1 = EM.offlineCatchup(600);
  ok(r1 && r1.g.rules > 0, 'offline grants passive income');
  ok(S.rules > before, 'resources increased after catch-up');
  const r2 = EM.offlineCatchup(99999);
  ok(r2.eff === 8*3600, 'offline capped at 8 hours');
  ok(EM.offlineCatchup(0.2) === null, 'sub-second gaps return nothing');
}

function testNoNaN(){
  section('Production never yields NaN');
  const EM = freshGame(); const { S } = EM;
  S.ruleset=6; S.daemon=4; S.axioms=10;
  S.tech = { formalLogic:true, fwdChain:true, bwdChain:true, rete:true, heuristics:true };
  S.dataset=3; S.model=2; S.data=100; S.insight=80; S.compute=4; S.training=3; S.capability=50; S.cluster=2;
  for(let i=0;i<200;i++) EM.produce(0.1);
  ok(finite(S, ['rules','runRules','data','insight','capability','scale']), 'all resources stay finite');
  ok(S.rules > 0, 'production accrues rules');
}

function testNoIdleRebuild(){
  section('No DOM rebuild on idle ticks (anti-strobe guard)');
  const EM = freshGame(); const { S, MILES } = EM;
  S.started = true; S.rules = 5;
  EM.revealGame();
  S.ruleset = 4;
  MILES.forEach(m => S.flags[m.id] = true); // freeze milestones
  EM.tick();
  const eras = global.document.getElementById('eras');
  let writes = 0, store = eras.innerHTML;
  Object.defineProperty(eras, 'innerHTML', { configurable:true, get(){ return store; }, set(v){ writes++; store = v; } });
  const before = S.rules;
  for(let i=0;i<20;i++) EM.tick();
  ok(writes === 0, 'era DOM is not rebuilt on idle ticks (saw '+writes+' rebuilds)');
  ok(S.rules > before, 'resource values still advance while the DOM stays put');
}

// ====================================================================
// 2. PROGRESSION — autoplay through the Symbolic Era
// ====================================================================
function era1Step(EM){
  const { S, TREE, BUYS } = EM;
  if(S.flags.era1done) return;
  // bootstrap clicks early; a trickle once automation runs
  const clicks = (S.ruleset + S.daemon < 1 || S.t < 25) ? 6 : 1;
  for(let i=0;i<clicks;i++) EM.writeRule(FAKE_EV);
  // the next technique we can work toward (prereqs + axiom-gate satisfied)
  const next = TREE.find(n => n.id!=='expert' && !S.tech[n.id] && n.req.every(r=>S.tech[r]) && (!n.reqAxioms || S.axioms>=n.reqAxioms));
  const goalCost = next ? next.cost : Infinity;
  // grow income but keep a reserve for the next node
  if(S.ruleset < 30){ const c = EM.totalCost(BUYS.ruleset,1); if(S.rules - c > Math.min(goalCost*0.5, 250)) EM.buy('ruleset'); }
  if(S.tech.inference && S.daemon < 20){ const c = EM.totalCost(BUYS.daemon,1); if(S.rules - c > goalCost*0.6) EM.buy('daemon'); }
  // buy the next node when affordable
  if(next && S.rules >= next.cost) EM.buyTech(next.id);
  // finish the era when ready
  if(EM.canBuyTech('expert')) EM.buyTech('expert');
  // compile when stuck or when banking axioms toward the Expert System
  if(S.flags.compile && !S.flags.era1done){
    const stuck = !TREE.some(n => n.id!=='expert' && EM.canBuyTech(n.id));
    const needForExpert = S.tech.metalogic && S.tech.heuristics && S.axioms < 12;
    if((stuck || needForExpert) && EM.axiomGain() >= Math.max(2, Math.ceil(S.axioms*0.5))) EM.compile();
  }
}

function testProgression(){
  section('Progression — autoplay through the Symbolic Era');
  const EM = freshGame(); const { S } = EM;
  const MAX = 180000; // 300 simulated minutes — generous stall ceiling
  let tick = 0, doneAt;
  for(; tick < MAX; tick++){
    era1Step(EM); EM.tick();
    if(S.flags.era1done){ doneAt = S.t; break; }
  }
  const techCount = Object.keys(S.tech).filter(k=>S.tech[k]).length;
  console.log('  Symbolic Era completed at ' + (doneAt ? (doneAt/60).toFixed(1)+'m' : '— (did not finish)'));
  console.log('  compiles=' + S.compiles + '  axioms=' + S.axioms + '  tech=' + techCount + '/' + EM.TREE.length);
  ok(S.flags.era1done, 'Era 1 (Expert System) is reachable — the era does not stall');
  ok(techCount === EM.TREE.length, 'all tech nodes obtained by completion');
  ok(S.compiles >= 1, 'at least one Compile happened (the loop engages)');
  ok(finite(S, ['rules','axioms']), 'no NaN at completion');
  if(doneAt){ const m = doneAt/60;
    if(m < 3) console.log('  ⚠ pacing: faster than the 5-6m target (' + m.toFixed(1) + 'm)');
    else if(m > 9) console.log('  ⚠ pacing: slower than the 5-6m target (' + m.toFixed(1) + 'm)');
    else console.log('  ✓ pacing in band (' + m.toFixed(1) + 'm)');
  }
}

// ---- run all ----
console.log('EMERGENCE test suite');
console.log('====================');
testFormatting();
testCostMath();
testBuy();
testTechTree();
testCompile();
testSaveLoad();
testOffline();
testNoNaN();
testNoIdleRebuild();
testProgression();

console.log('\n====================');
console.log(`${passed} passed, ${failed} failed`);
if(failed){ console.log('\nFAILURES:'); fails.forEach(f=>console.log('  - '+f)); process.exit(1); }
console.log('All green. ✓');
