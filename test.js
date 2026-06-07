#!/usr/bin/env node
/*
 * EMERGENCE test harness — run with: node test.js   (no dependencies)
 *
 * Two kinds of checks, per the project's goals:
 *   1. CORRECTNESS  — math, save/load, offline catch-up, no NaN/crashes.
 *   2. PROGRESSION  — a milestone-driven autoplayer plays a fresh game at
 *      speed and must reach every era and Emergence within a tick budget.
 *      This is the regression net for balance changes: tune a number in CFG,
 *      re-run, and see both "still completable?" and "minutes per era".
 *
 * The game ships as a single self-contained HTML file with the logic in one
 * IIFE. We extract that script, run it against a tiny DOM/canvas/localStorage
 * shim, and read internals through the window.__EMERGENCE_TEST__ seam.
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'emergence.html'), 'utf8');
const SCRIPT = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// ---- Minimal headless shims (the game must run with no real browser) ----
const CTX = {
  setTransform(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){},
  arc(){}, fill(){}, fillText(){}, createRadialGradient(){ return { addColorStop(){} }; },
};
function makeEl(){
  return {
    style:{}, dataset:{}, className:'', innerHTML:'', textContent:'', width:0, height:0, onclick:null,
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(c){ return c; }, remove(){}, addEventListener(){}, setAttribute(){},
    getBoundingClientRect(){ return { width:1000, height:210, left:0, top:0, right:1000, bottom:210 }; },
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
  global.setTimeout = (fn) => { try{ fn(); }catch(e){} return 0; }; // run callbacks synchronously
  global.clearTimeout = () => {};
  global.setInterval = () => 0;   // never auto-run the loop; the harness drives ticks
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

// Re-evaluate the game IIFE in a fresh shimmed environment; return its exports.
function freshGame(){
  installShims();
  (0, eval)(SCRIPT);            // indirect eval -> runs in global scope, sees the shims
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
  ok(fmt(7) === '7', 'fmt(7) = "7"');
  ok(fmt(999) === '999', 'fmt(999) = "999"');
  ok(fmt(1500) === '1.50K', 'fmt(1500) = "1.50K"');
  ok(fmt(1e6) === '1.00M', 'fmt(1e6) = "1.00M"');
  ok(fmt(2.5e9) === '2.50B', 'fmt(2.5e9) = "2.50B"');
}

function testCostMath(){
  section('Cost + bulk-buy math');
  const EM = freshGame();
  const b = EM.BUYS.ruleset;
  // unit costs grow monotonically
  let prev = -1, mono = true;
  for(let c=0;c<20;c++){ const u = EM.unitCost(b, c); if(u <= prev) mono = false; prev = u; }
  ok(mono, 'unit cost is monotonically increasing');
  ok(EM.unitCost(b,0) === 10, 'first ruleset costs 10');
  ok(EM.totalCost(b,10) === 200, 'x10 total from 0 owned = 200');
  // buyQty MAX must spend down to < next unit cost
  EM.S.rules = 100; EM.S.ruleset = 0;
  EM.S.buyMode = 'max';
  const n = EM.buyQty('ruleset');
  ok(n === 6, 'MAX with 100 rules buys 6 rulesets');
  const tc = EM.totalCost(b, n);
  ok(EM.S.rules - tc < EM.unitCost(b, n), 'after MAX, leftover < next unit cost');
}

function testBuy(){
  section('Purchase path');
  const EM = freshGame(); const { S } = EM;
  S.flags.canRuleset = true; S.rules = 50; S.ruleset = 0; S.buyMode = '1';
  const before = S.rules;
  EM.buy('ruleset');
  ok(S.ruleset === 1, 'x1 buy increments count');
  ok(before - S.rules === 10, 'x1 buy deducts exact unit cost');
  // unaffordable buy is a no-op
  S.rules = 0; const cnt = S.ruleset;
  EM.buy('ruleset');
  ok(S.ruleset === cnt && S.rules === 0, 'unaffordable buy is a no-op');
  // MAX buy
  S.rules = 1000; S.ruleset = 0; S.buyMode = 'max';
  const want = EM.buyQty('ruleset'); EM.buy('ruleset');
  ok(S.ruleset === want, 'MAX buy adds buyQty() units at once');
}

function testSaveLoad(){
  section('Save / load roundtrip');
  const EM = freshGame(); const { S } = EM;
  S.flags.firstAuto = true; S.maxEra = 3; S.rules = 1234.5; S.insight = 67.8;
  S.compute = 4; S.obsolete[1] = true; S.buyMode = 'max';
  EM.save();
  // clobber state, then load
  S.rules = 0; S.insight = 0; S.compute = 0; S.maxEra = 1; S.obsolete = {}; S.buyMode = '1';
  EM.load();
  near(S.rules, 1234.5, 1e-6, 'rules restored');
  near(S.insight, 67.8, 1e-6, 'insight restored');
  ok(S.compute === 4, 'building counts restored');
  ok(S.maxEra === 3, 'maxEra restored');
  ok(S.obsolete[1] === true, 'obsolescence map restored');
  ok(S.buyMode === 'max', 'buy mode restored');
}

function testOffline(){
  section('Offline progress');
  const EM = freshGame(); const { S } = EM;
  S.started = true; S.flags.firstAuto = true; S.ruleset = 5; // passive rule income
  const before = S.rules;
  const r1 = EM.offlineCatchup(600); // 10 minutes away
  ok(r1 && r1.g.rules > 0, 'offline grants passive income while away');
  ok(S.rules > before, 'resources increased after catch-up');
  // capping at 8h
  const r2 = EM.offlineCatchup(99999);
  ok(r2.eff === 8*3600, 'offline is capped at 8 hours');
  ok(r2.capped === true, 'capped flag set when over the cap');
  // tiny gaps do nothing
  const r3 = EM.offlineCatchup(0.2);
  ok(r3 === null, 'sub-second gaps return no offline summary');
}

function testNoNaN(){
  section('Production never yields NaN');
  const EM = freshGame(); const { S } = EM;
  S.ruleset=3; S.logic=2; S.dataset=4; S.model=3; S.compute=5; S.training=4; S.cluster=2;
  S.data=100; S.insight=100; S.capability=100;
  for(let i=0;i<200;i++) EM.produce(0.1);
  ok(finite(S, ['rules','data','insight','capability','scale']), 'all resources stay finite after produce()');
  ok(S.data >= 0 && S.insight >= 0 && S.capability >= 0, 'no resource goes negative from conversion');
}

function testNoIdleRebuild(){
  // Regression guard: rebuilding #eras' innerHTML every tick destroyed buttons
  // mid-click (visible strobe + lost clicks). Idle ticks must NOT rebuild structure.
  section('No DOM rebuild on idle ticks (anti-strobe guard)');
  const EM = freshGame(); const { S, MILES } = EM;
  S.started = true; S.rules = 5;
  EM.revealGame();                          // builds Era 1 (reveal setTimeout runs synchronously)
  S.ruleset = 4;                            // passive rule income so values keep changing
  MILES.forEach(m => S.flags[m.id] = true); // freeze milestones: nothing structural should fire
  EM.tick();                                // settle
  const eras = global.document.getElementById('eras');
  let writes = 0, store = eras.innerHTML;
  Object.defineProperty(eras, 'innerHTML', { configurable:true, get(){ return store; }, set(v){ writes++; store = v; } });
  const before = S.rules;
  for(let i=0;i<20;i++) EM.tick();          // 20 idle ticks: no buys, no new milestones
  ok(writes === 0, 'era DOM is not rebuilt on idle ticks (saw '+writes+' rebuilds — buttons would strobe)');
  ok(S.rules > before, 'resource values still advance while the DOM stays put');
}

// ====================================================================
// 2. PROGRESSION — milestone-driven autoplayer
// ====================================================================
// A reasonable human player: click hard early, build income/converters up to
// sane caps, then let the gating resource bank toward the next era's threshold.
function autoplayStep(EM){
  const { S, BUYS } = EM;
  const clicks = S.maxEra === 1 ? 8 : 1;
  for(let i=0;i<clicks;i++) EM.writeRule(FAKE_EV);
  const tryBuy = (k, cap) => { if(S[k] < cap) EM.buy(k); };
  if(S.maxEra === 1){
    if(S.flags.canRuleset) tryBuy('ruleset', 6);
    if(S.flags.canLogic)   tryBuy('logic', 3);
  } else if(S.maxEra === 2){
    tryBuy('ruleset', 8);
    tryBuy('dataset', 8);
    if(S.flags.canModel) tryBuy('model', 8);
  } else if(S.maxEra === 3){
    tryBuy('dataset', 10); tryBuy('model', 10);
    tryBuy('compute', 6);
    if(S.flags.canTrain) tryBuy('training', 6);
  } else { // era 4+
    tryBuy('model', 12); tryBuy('compute', 8); tryBuy('training', 8);
    tryBuy('cluster', 8);
  }
}

function testProgression(){
  section('Progression — autoplay to Emergence');
  const EM = freshGame(); const { S } = EM;
  const MAX_TICKS = 120000;             // 200 simulated minutes — generous stall ceiling
  const want = ['era2','era3','era4','era1obsolete','era2obsolete','emergent'];
  const at = {};                        // milestone id -> simulated seconds reached
  let tick = 0;
  for(; tick < MAX_TICKS; tick++){
    autoplayStep(EM);
    EM.tick();
    for(const id of want){ if(at[id] === undefined && S.flags[id]) at[id] = S.t; }
    if(at.emergent !== undefined) break;
  }
  const mm = s => (s === undefined ? '   —   ' : (s/60).toFixed(1).padStart(5) + 'm');
  console.log('  ── milestone timing (simulated) ──');
  console.log('     Era 2 (Statistical)   reached at ' + mm(at.era2));
  console.log('     Era 1 -> legacy       at ' + mm(at.era1obsolete));
  console.log('     Era 3 (Deep)          reached at ' + mm(at.era3));
  console.log('     Era 2 -> legacy       at ' + mm(at.era2obsolete));
  console.log('     Era 4 (Foundation)    reached at ' + mm(at.era4));
  console.log('     EMERGENCE             reached at ' + mm(at.emergent));
  console.log('  ──────────────────────────────────');
  console.log('  final buildings: ruleset='+S.ruleset+' logic='+S.logic+' dataset='+S.dataset+
    ' model='+S.model+' compute='+S.compute+' training='+S.training+' cluster='+S.cluster);
  console.log('  final resources: rules='+EM.fmt(S.rules)+' data='+EM.fmt(S.data)+' insight='+EM.fmt(S.insight)+
    ' capability='+EM.fmt(S.capability)+' scale='+EM.fmt(S.scale));

  ok(at.era2 !== undefined, 'Era 2 unlocks');
  ok(at.era3 !== undefined, 'Era 3 unlocks');
  ok(at.era4 !== undefined, 'Era 4 unlocks');
  ok(at.emergent !== undefined, 'Emergence is reachable (game does not stall)');
  // ordering sanity — eras unlock in sequence
  if(at.era2 !== undefined && at.era3 !== undefined) ok(at.era2 < at.era3, 'Era 2 unlocks before Era 3');
  if(at.era3 !== undefined && at.era4 !== undefined) ok(at.era3 < at.era4, 'Era 3 unlocks before Era 4');
  if(at.era4 !== undefined && at.emergent !== undefined) ok(at.era4 < at.emergent, 'Era 4 unlocks before Emergence');
  // legacy transitions actually fire
  ok(at.era1obsolete !== undefined, 'Symbolic era goes legacy');
  ok(at.era2obsolete !== undefined, 'Statistical era goes legacy');
  // no NaN at the finish line
  ok(finite(S, ['rules','data','insight','capability','scale']), 'final state has no NaN');

  // Soft pacing guidance (warnings, not failures) so balance regressions are visible.
  const warn = [];
  if(at.era2 !== undefined && at.era2/60 > 8) warn.push('Era 1->2 is slow (>8m)');
  if(at.emergent !== undefined && at.emergent/60 > 60) warn.push('Full run is long (>60m)');
  if(at.emergent !== undefined && at.emergent/60 < 8) warn.push('Full run is very short (<8m) — may feel rushed');
  if(warn.length) console.log('  ⚠ pacing notes: ' + warn.join('; '));
}

// ---- run all ----
console.log('EMERGENCE test suite');
console.log('====================');
testFormatting();
testCostMath();
testBuy();
testSaveLoad();
testOffline();
testNoNaN();
testNoIdleRebuild();
testProgression();

console.log('\n====================');
console.log(`${passed} passed, ${failed} failed`);
if(failed){ console.log('\nFAILURES:'); fails.forEach(f=>console.log('  - '+f)); process.exit(1); }
console.log('All green. ✓');
