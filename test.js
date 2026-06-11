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
const CTX = { setTransform(){}, clearRect(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, closePath(){}, setLineDash(){}, fillRect(){},
  arc(){}, fill(){}, fillText(){}, createRadialGradient(){ return { addColorStop(){} }; } };
function makeEl(){
  return { style:{}, dataset:{}, className:'', innerHTML:'', textContent:'', width:0, height:0, onclick:null, disabled:false,
    volume:1, paused:true, play(){ this.paused=false; }, pause(){ this.paused=true; }, // audio-element shims (music layer)
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
  // Refinement: repeatable Ore-cost sink that lifts ALL production (the late-Origins near-win)
  EM = freshGame(); S = EM.S; const r0 = EM.oStats(); S.refine = 5; const r1 = EM.oStats();
  ok(r1.scribeY > r0.scribeY && r1.scrR > r0.scrR && r1.foR > r0.foR, 'Refinement lifts all Origins production');
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
  // Apprenticeship: a multi-resource cost (marks + ore) that boosts both workers
  S.marks = 100000; S.ore = 100000;
  ok(EM.canBuyDisco('apprenticeship'), 'multi-cost discovery is buyable with both resources');
  const m0 = S.marks, o0 = S.ore; EM.buyDisco('apprenticeship');
  ok(S.marks < m0 && S.ore < o0, 'Apprenticeship spends BOTH marks and ore');
  near(EM.oStats().scribeY, EM.CFG.e1.scribeYield * 1.5, 1e-9, 'Apprenticeship: scribes +50%');
  near(EM.oStats().minerY, EM.CFG.e1.minerYield * 1.5, 1e-9, 'Apprenticeship: miners +50%');
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

function testEra2Playable(){
  section('Era 2 carryover seed (no cold-grind restart)');
  const EM = freshGame(); const S = EM.S;
  S.flags.firstAuto = true; S.knowledge = 1500; S.flags.origindone = true;
  EM.checkMiles(); // era2 fires: seeds rules + rulesets + canRuleset, opens Era 2 (and treeUnlock follows)
  ok(S.maxEra >= 2, 'fabrication opens the Symbolic era');
  ok(S.flags.canRuleset, 'Era 2 starts with the Ruleset unlocked (no cold grind)');
  ok(S.ruleset >= 2 && S.rules > 0, 'the Logic Machine seeds Rulesets + Rules from Knowledge');
  ok(S.flags.tree, 'seeded Rulesets immediately unlock the tech tree');
}

function testProofProcess(){
  section('Era 2 theorem-proving (research as a process)');
  const EM = freshGame(); const S = EM.S;
  S.maxEra = 2; S.flags.firstAuto = true; S.flags.tree = true; S.ruleset = 10; // Rulesets emit Inference
  EM.selectProof('formalLogic');
  ok(S.activeProof === 'formalLogic', 'selecting a theorem makes it the active proof');
  ok(!S.tech.formalLogic, 'it is not proven instantly');
  for(let i=0;i<3000 && !S.tech.formalLogic;i++) EM.produce(0.1); // pour Inference over time
  ok(S.tech.formalLogic, 'accumulated Inference completes the proof and applies the effect');
  ok(S.activeProof === null, 'active proof clears on completion');
  const lv = S.optLevel;
  EM.selectProof('optimization');
  for(let i=0;i<3000 && S.optLevel===lv;i++) EM.produce(0.1);
  ok(S.optLevel === lv+1, 'the Optimization lemma levels up when proven (repeatable)');
}

function testInferenceCap(){
  section('Era 2 — Inference cap + capacity lemma');
  const EM = freshGame(); const S = EM.S;
  S.maxEra = 2; S.flags.firstAuto = true; S.flags.tree = true; S.ruleset = 50; // strong inference, no active proof
  for(let i=0;i<6000;i++) EM.produce(0.1);
  ok(S.inference <= EM.infCap() + 1e-6, 'banked Inference is capped');
  ok(Math.abs(S.inference - EM.CFG.e2.infCapBase) < 1, 'idle banks up to the base cap');
  const lv = S.infCapLevel; EM.selectProof('capacity');
  for(let i=0;i<6000 && S.infCapLevel===lv;i++) EM.produce(0.1);
  ok(S.infCapLevel === lv+1, 'Inference Capacity lemma levels up (repeatable)');
  ok(EM.infCap() > EM.CFG.e2.infCapBase, 'leveling capacity raises the cap');
  S.activeProof = null;
  for(let i=0;i<8000;i++) EM.produce(0.1);
  ok(S.inference > EM.CFG.e2.infCapBase, 'banking now exceeds the old base cap');
}

function testStatistical(){
  section('Era 3 — Training Focus, experiments, discovery, overfit');
  let EM = freshGame(); let S = EM.S;
  S.maxEra = 3; S.data = 100000; S.focus = 'fit';
  const a0 = S.accuracy; EM.runExperiment(20);
  ok(S.accuracy > a0 && S.accuracy < 1, 'Fit raises accuracy toward 1 (diminishing)');
  ok(S.insight > 0, 'experiments yield Insight');
  ok(S.gap > 0, 'Fit grows the overfit gap');
  S.focus = 'generalize'; const g0 = S.gap; EM.runExperiment(20);
  ok(S.gap < g0, 'Generalize shrinks the overfit gap');
  // The Experiment Board (v2): methods are funded deterministically; Explore fills the survey, discounting cards
  EM = freshGame(); S = EM.S; S.maxEra = 3; S.focus = 'explore';
  ok(EM.boardCards()[0] === 'method' && EM.nextMethod().id === 'regression', 'the next method sits face-up on the board');
  const full0 = EM.expCost('method');
  S.data = 3000; EM.runExperiment(40);
  ok(S.survey > 0, 'Explore trials fill the survey');
  ok(EM.expCost('method') < full0, 'survey discounts the method card');
  S.survey = 100; near(EM.expCost('method'), Math.ceil(EM.CFG.e3.cardMethodCosts[0]*0.5), 1.01, 'a full survey halves the price');
  S.data = 3000; ok(EM.buyCard('method'), 'funding the card buys the method');
  ok(S.methods.regression === true, 'the method is owned');
  ok(S.survey === 0, 'funding consumes the survey');
  ok(EM.nextMethod().id === 'features', 'the next method takes the slot');
  // fit barely surveys
  EM = freshGame(); S = EM.S; S.maxEra = 3; S.focus = 'fit'; S.data = 3000; EM.runExperiment(40);
  ok(S.survey < 20, 'Fit trials barely survey');
  // utilities: real effects, rotating slots, growing costs, survey consumed
  EM = freshGame(); S = EM.S; S.maxEra = 3; S.data = 5000; S.gap = 0.3;
  const cards0 = EM.boardCards(); ok(cards0.length === 3 && cards0[1] !== cards0[2], 'three face-up cards, distinct utilities');
  const c0 = EM.expCost(cards0[1]); const gap0 = S.gap;
  if(cards0[1] === 'calibrate'){ EM.buyCard('calibrate'); ok(S.gap < gap0, 'Holdout Study cuts the gap'); }
  else { EM.buyCard(cards0[1]); }
  ok(EM.boardCards()[1] !== cards0[1] || EM.boardCards()[2] !== cards0[2], 'buying a utility rotates the board');
  ok(EM.expCost(cards0[1]) > c0 * 0.99, 'utility price grows with each purchase');
  // Regularization strengthens the gap cure (generalize ×2)
  EM = freshGame(); S = EM.S; const r0 = EM.e3Stats().regMult; S.methods.regularization = true;
  ok(EM.e3Stats().regMult > r0, 'Regularization strengthens the Generalize cure');
  // effective accuracy = accuracy − gap, raised by Ensembles
  EM = freshGame(); S = EM.S; S.accuracy = 0.8; S.gap = 0.1;
  near(EM.effAccuracy(), 0.7, 1e-9, 'effective accuracy = accuracy − gap');
  S.methods.ensembles = true; ok(EM.effAccuracy() > 0.7, 'Ensembles raises effective accuracy');
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

  // Era 5 aftermath state survives a reload (ending, meters, agent stream)
  S.maxEra = 5; EM.emerge(); S.alignment = 77; S.control = 41; S.autonomy = 63; EM.resolveEnding(); S.agentLog = ['one','two'];
  EM.save();
  S.ending = null; S.alignment = 0; S.control = 0; S.autonomy = 0; S.emerged = false; S.agentLog = [];
  EM.load();
  ok(S.emerged && S.ending === 'symbiotic', 'Era 5 emergence + ending restored');
  ok(S.alignment === 77 && S.control === 41 && S.autonomy === 63, 'aftermath meters restored');
  ok(S.agentLog.length === 2, 'agent message stream restored');

  // corruption resilience: a stale/malformed alpha save must normalize, not crash or inject NaN/bad objects
  global.localStorage.setItem('emergence-save', JSON.stringify({ S: {
    flags: 'broken', alloc: null, methods: null, tech: 42, caps: 'x', proofAcc: { vision: 'oops' },
    marks: 'NaNstring', accuracy: null, maxEra: 3, vision: 0, language: 0, reasoning: 0
  }, REC: { snaps: 'notarray', events: null }, lastSave: 'bad', v: 1 }));
  EM.load();
  ok(S.flags && typeof S.flags === 'object', 'corrupt flags → object default');
  ok(S.methods && typeof S.methods === 'object', 'corrupt methods → object default');
  ok(S.tech && typeof S.tech === 'object', 'corrupt tech → object default');
  ok(S.alloc && typeof S.alloc.vision === 'number' && (S.alloc.vision + S.alloc.language + S.alloc.reasoning) > 0,
     'corrupt/all-zero alloc → valid non-zero allocation');
  ok(isFinite(S.marks) && isFinite(S.accuracy), 'corrupt scalars → finite');
  for (let i = 0; i < 50; i++) EM.produce(0.1);
  ok(finite(S, ['marks', 'silicon', 'data', 'capability', 'vision', 'language', 'reasoning']),
     'production stays finite after loading a corrupt save');
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
  // Era 3 offline is deterministic: experiments accrue but Methods do NOT silently discover while away
  const EM2 = freshGame(); const T = EM2.S;
  T.started = true; T.flags.firstAuto = true; T.maxEra = 3; T.dataset = 10; T.model = 6; T.data = 80000; T.silicon = 50000;
  EM2.offlineCatchup(3600);
  ok(Object.keys(T.methods).length === 0, 'no Method discovery during offline catch-up (deterministic)');
  ok(T.accuracy > 0, 'accuracy still accrues offline');
}

function testConverterPause(){
  section('Origins — pausable converters (anti-soft-lock)');
  const EM = freshGame(); const S = EM.S;
  // a scriptorium draining Marks faster than scribes make them → Marks crash (Zach's trap)
  S.scribe = 2; S.scriptorium = 8; S.marks = 50; S.ore = 300;
  for(let i=0;i<30;i++) EM.produce(0.5);
  ok(S.marks < 5, 'over-built scriptoria drain Marks toward 0 (the soft-lock)');
  // pause the scriptorium → Marks recover from the scribes (escape)
  S.paused.scriptorium = true; const m0 = S.marks;
  for(let i=0;i<10;i++) EM.produce(0.5);
  ok(S.marks > m0 + 1, 'pausing the scriptorium lets Marks recover — escape the soft-lock');
  // resume → consumes + produces again
  S.paused.scriptorium = false; S.marks = 100; const k0 = S.knowledge;
  EM.produce(1);
  ok(S.knowledge > k0 && S.marks < 100, 'resuming the converter consumes + produces again');
  // pause state survives a save/load
  S.flags.firstAuto = true; S.paused.scriptorium = true; EM.save();
  S.paused.scriptorium = false; EM.load();
  ok(S.paused.scriptorium === true, 'paused state round-trips through save/load');
}

function testNoNaN(){
  section('Production never yields NaN');
  const EM = freshGame(); const S = EM.S;
  S.scribe=6; S.miner=6; S.scriptorium=3; S.smelter=3; S.foundry=2; S.marks=100; S.ore=100; S.knowledge=50; S.metal=50;
  S.ruleset=6; S.daemon=4; S.axioms=10; S.tech={formalLogic:true,fwdChain:true,bwdChain:true,rete:true,heuristics:true};
  S.dataset=3; S.model=2; S.data=100; S.insight=80;
  S.maxEra=5; S.node=5; S.vision=0.6; S.language=0.5; S.reasoning=0.4; S.capability=50; S.recursion=3; S.scale=200; S.emerged=true; S.agentRate=1.5;
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
  // Uses the REAL player path: Rulesets emit Inference, you aim it at one proof target via selectProof(),
  // and completeProof() fires as Inference accrues through tick(). (NOT buyTech() — that bypassed the
  // live mechanic and made the chain look faster/safer than the player's experience.)
  const { S, TREE, BUYS } = EM;
  if(S.flags.symbolicDone) return;
  const clicks = (S.ruleset + S.daemon < 1) ? 8 : 1;
  for(let i=0;i<clicks;i++) EM.writeRule(FAKE_EV);
  // grow generators: Rulesets (emit Inference) + Daemons (write Rules)
  if(S.ruleset < 30){ const c = EM.totalCost(BUYS.ruleset,1); if(S.rules >= c) EM.buy('ruleset'); }
  if(S.tech.inference && S.daemon < 20){ const c = EM.totalCost(BUYS.daemon,1); if(S.rules >= c*2) EM.buy('daemon'); }
  // aim Inference at a proof target; bank into the Optimization lemma while farming axioms for the Expert capstone
  if(S.flags.tree && !S.activeProof){
    const t = TREE.find(n => n.id!=='expert' && !S.tech[n.id] && EM.canProve(n.id));
    if(t) EM.selectProof(t.id);
    else if(EM.canProve('expert')) EM.selectProof('expert');
    else EM.selectProof('optimization');
  }
  const expReq = (TREE.find(n=>n.id==='expert').reqAxioms) || 0;
  if(S.flags.compile && S.axioms < expReq && EM.axiomGain() >= Math.max(2, Math.ceil(S.axioms*0.5))) EM.compile();
}
function statisticalStep(EM){
  const { S, BUYS } = EM;
  if(S.maxEra !== 3) return;
  // reach-back to Origins: keep Silicon flowing (build Foundries) for Datasets + Model upkeep
  if(S.silicon < 80 && S.metal >= EM.totalCost(BUYS.foundry,1)) EM.buy('foundry');
  if(S.dataset < 22 && S.silicon >= EM.totalCost(BUYS.dataset,1)) EM.buy('dataset');
  if(S.model < 16 && S.data >= EM.totalCost(BUYS.model,1)) EM.buy('model');
  // The Experiment Board (v2): fund the next Method when it's affordable with a trial buffer left over.
  // Survey first (Explore) so the card is cheaper; methods carry the era (Regularization lifts the ceiling).
  const next = EM.nextMethod && EM.nextMethod();
  if(next && S.data - EM.expCost('method') > 120) EM.buyCard('method');
  // steer Training Focus: Explore while a needed method is unaffordable (survey = discount), Generalize when the gap is high, else Fit
  const nM = Object.keys(S.methods).length;
  if(next && nM < 4 && S.survey < 95 && EM.expCost('method') > S.data - 120) S.focus = 'explore';
  else if(S.gap > 0.18) S.focus = 'generalize';
  else S.focus = 'fit';
}
function deepStep(EM){ // ERA 4 — STEER against the drift + keep all three feedstocks (Knowledge/Data/Insight) flowing
  const { S, BUYS } = EM;
  if(S.maxEra < 4) return;
  // Reach-back: each run draws a specific feedstock — Vision←Data, Reasoning←Insight, Language←Knowledge.
  // Knowledge is the scarce one: it feeds the Language run AND is BURNED by Smelters (upkeep) and Foundries (1:1 → Silicon),
  // and its source (scriptoria: Marks→Knowledge) is gated by Marks (scribes). So the late-Deep job is to flood the
  // Knowledge pipeline and stop the sinks from eating it out from under the Language run.
  S.paused = S.paused || {};
  const os = EM.oStats();
  const marksIn = S.scribe*os.scribeY, scrDraw = S.scriptorium*os.scrR; // scriptoria eat Marks faster than scribes make them → deadlock
  // Phase the Knowledge engine: grow a big SCRIBE base first. While scriptoria out-draw scribes, pause scriptoria so
  // Marks can bank to afford the next scribe — otherwise scriptoria pin Marks at 0 and the scribe base can never grow.
  const scribeCost = EM.totalCost(BUYS.scribe,1);
  const marksStarved = marksIn < scrDraw*1.05;
  S.paused.scriptorium = S.scribe < 220 && marksStarved && S.marks < scribeCost;
  if(S.scribe < 220 && S.marks >= scribeCost) EM.buy('scribe');
  if(S.scriptorium < 80 && marksIn > scrDraw + os.scrR*1.4 && S.marks >= EM.totalCost(BUYS.scriptorium,1)) EM.buy('scriptorium');
  if(S.miner < 90 && S.ore >= EM.totalCost(BUYS.miner,1)) EM.buy('miner'); // Ore for scriptorium tablets
  const enoughCompute = S.node >= 26; // Vision/Reasoning already overflow (Data/Insight huge); compute is never the constraint — Knowledge is
  // pause the Knowledge sinks (smelter upkeep + foundry 1:1) whenever Knowledge is tight so the Language run gets fed
  S.paused.smelter = enoughCompute && S.knowledge < 1500;
  S.paused.foundry = enoughCompute && S.knowledge < 2500;
  if(!enoughCompute){
    if(S.smelter < 50 && S.ore >= EM.totalCost(BUYS.smelter,1)) EM.buy('smelter');
    if(S.foundry < 70 && S.knowledge > 1200 && S.metal >= EM.totalCost(BUYS.foundry,1)) EM.buy('foundry');
    if(S.node < 26 && S.silicon >= EM.totalCost(BUYS.node,1)) EM.buy('node');
  }
  if(S.dataset < 50 && S.silicon >= EM.totalCost(BUYS.dataset,1)*3) EM.buy('dataset'); // → Data (Vision)
  if(S.model < 36 && S.data >= EM.totalCost(BUYS.model,1)) EM.buy('model');             // → Insight (Reasoning)
  // STEER against the drift (R3.1) while playing the HEAT rhythm (R3.2). Passive balanced play now stalls below the gate:
  // concentrating to climb a run heats the fabric, and hot fabric throttles ALL output. So bang-bang it — when hot, go
  // balanced to COOL (full output again); when cool, HAMMER the lowest run at full output to ratchet breadth up. A
  // starved run (dry feedstock) gets near-zero share so we never pour compute into a blocked run.
  const e4 = EM.CFG.e4, t = S.t || 0, PH = { vision:0, language:2.094, reasoning:4.189 };
  const feed = { vision: S.data, language: S.knowledge, reasoning: S.insight };
  // Feed the HIGH-WIND run (its demand = driftDemand*wind); out of phase, so steering the peak run keeps the others
  // mostly fed too. Add a laggard nudge to even them toward the gate. When heat nears the throttle, ease toward balanced
  // (which cools); hysteresis so we don't chatter. A starved (dry-feedstock) run gets near-zero share.
  S._deepCooling = S.heat >= e4.heatThrottle - 6 ? true : (S.heat <= e4.heatWarn - 10 ? false : !!S._deepCooling);
  const chase = S._deepCooling ? 0.15 : 1; // cooling → flatten toward balanced; else chase the wind
  const raw = {};
  for(const k of ['vision','language','reasoning'])
    raw[k] = (feed[k] < 120) ? 0.03 : (0.12 + e4.driftDemand*(0.5+0.5*Math.sin(t*e4.driftFreq+PH[k]))*2.0 + (1-S[k])*0.5);
  const mean = (raw.vision + raw.language + raw.reasoning) / 3;
  S.alloc = {};
  for(const k of ['vision','language','reasoning']) S.alloc[k] = Math.max(0.02, mean + (raw[k]-mean)*chase);
}
function foundationStep(EM){ // ERA 5 — climb the recursion ladder to emergence, then manage the aftermath to an ending
  const { S, CAPS } = EM; const e5 = EM.CFG.e5;
  if(S.maxEra < 5) return;
  if(!S.emerged){ // pre-emergence: buy capabilities, then play rush-vs-prepare (R3.6) — prepare a little, then rush
    for(const c of CAPS) if(!S.caps[c.id] && S.capability >= c.cost) EM.buyCap(c.id);
    if(S.caps.interpret && S.coherence < 36 && S.capability >= EM.alignCohCost()){ EM.alignObjective(); return; } // build some Coherence so it wakes aligned
    if(S.capability >= EM.improveCost()) EM.selfImprove();
    return;
  }
  // aftermath (R3.5 stakes): Control drifts and the spiral accelerates if it falls below controlLow, Alignment decays
  // untended, and a lapsed veto compounds. So actively DEFEND: veto when Control is shaky, constrain to hold Control,
  // align to keep the Symbiotic door open — then let Scale climb to the ending gate.
  if(S.veto){ EM.resolveVeto(S.control < e5.controlLow + 12 ? 'veto' : 'approve'); return; }
  if(S.control < e5.controlLow + 16 && S.scale >= e5.constrainCost){ EM.constrainAct(); return; }
  if(S.alignment < e5.alignGood + 6 && S.scale >= e5.alignCost){ EM.alignAct(); return; }
}
function testProgression(){
  section('Progression — autoplay Origins → Symbolic → Statistical → Deep → Foundation → Emergence');
  const EM = freshGame(); const { S } = EM;
  const MAX = 600000;
  let tick = 0, origAt, symAt, statAt, deepAt, foundAt, emergeAt, endAt;
  for(; tick < MAX; tick++){
    if(S.maxEra === 1) originsStep(EM);
    else if(S.maxEra === 2) symbolicStep(EM);
    else if(S.maxEra === 3) statisticalStep(EM);
    else { deepStep(EM); foundationStep(EM); }
    EM.tick();
    if(origAt === undefined && S.flags.origindone) origAt = S.t;
    if(symAt === undefined && S.flags.symbolicDone) symAt = S.t;
    if(statAt === undefined && S.maxEra >= 4) statAt = S.t;
    if(deepAt === undefined && S.maxEra >= 5) deepAt = S.t;
    if(emergeAt === undefined && S.emerged) emergeAt = S.t;
    if(S.ending){ endAt = S.t; break; } // play THROUGH the aftermath to a resolved ending
  }
  const mm = s => s===undefined ? '—' : (s/60).toFixed(1)+'m';
  if(statAt !== undefined) console.log('  Era 3 (Statistical) generalized → Deep at ' + mm(statAt));
  else console.log('  Era 3 STALLED: acc='+(S.accuracy*100).toFixed(0)+'% gap='+(S.gap*100).toFixed(0)+'% eff='+(EM.effAccuracy()*100).toFixed(0)+'% data='+Math.round(S.data)+' dataset='+S.dataset+' model='+S.model);
  if(deepAt !== undefined) console.log('  Era 4 (Deep) reached breadth → Foundation at ' + mm(deepAt) + (statAt?('  (Deep took '+((deepAt-statAt)/60).toFixed(1)+'m)'):''));
  else console.log('  Era 4 STALLED: breadth='+(EM.deepBreadth()*100).toFixed(0)+'% V/L/R='+(S.vision*100|0)+'/'+(S.language*100|0)+'/'+(S.reasoning*100|0)+'% node='+S.node+' silicon='+Math.round(S.silicon)+' knowledge='+Math.round(S.knowledge)+' scriptorium='+S.scriptorium+' scribe='+S.scribe+' marks='+Math.round(S.marks)+' data='+Math.round(S.data)+' insight='+Math.round(S.insight));
  if(emergeAt !== undefined) console.log('  Era 5 (Foundation) → EMERGENCE at ' + mm(emergeAt) + '  (recursion Lv'+S.recursion+', '+Object.keys(S.caps).length+' capabilities)');
  else console.log('  Era 5 STALLED: agency='+(S.agency||0).toFixed(0)+'/'+EM.CFG.e5.controlBase+' scale='+Math.round(S.scale)+' recursion='+S.recursion+' capability='+Math.round(S.capability));
  if(endAt !== undefined) console.log('  Era 5 aftermath resolved → '+(S.ending||'?').toUpperCase()+' ending at ' + mm(endAt) + (emergeAt?('  (aftermath took '+((endAt-emergeAt)/60).toFixed(1)+'m)'):''));
  console.log('  Era 1 (Origins) fabricated at ' + mm(origAt));
  console.log('  Era 2 (Symbolic) completed at ' + mm(symAt) + (origAt&&symAt?('  (Era 2 took '+((symAt-origAt)/60).toFixed(1)+'m)'):''));
  ok(S.flags.origindone, 'Era 1 (Origins) completes — fabrication reached, no stall');
  ok(S.maxEra >= 2, 'Symbolic era opens after fabrication');
  ok(S.flags.symbolicDone, 'Era 2 (Symbolic) still completes after the renumber');
  ok(statAt !== undefined, 'Era 3 (Statistical) generalizes and opens Deep');
  ok(deepAt !== undefined, 'Era 4 (Deep) reaches breadth and opens Foundation');
  ok(emergeAt !== undefined, 'Era 5 (Foundation) reaches emergence — full arc completes');
  ok(endAt !== undefined && !!S.ending, 'Era 5 aftermath resolves to an ending');
  ok(finite(S, ['marks','silicon','rules','axioms','capability','scale','autonomy','alignment','control']), 'no NaN at completion');
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

// Era 2: clicks rules, builds rulesets (which emit Inference), proves theorems one
// at a time, compiles for Axioms until it can prove the Expert System capstone.
function runSymbolic(cps){
  const EM = freshGame(); const { S, TREE, BUYS } = EM;
  S.maxEra = 2; S.flags.firstAuto = true;
  S.flags.canRuleset = true; S.ruleset += 5; S.rules += 800; // mirror the Logic Machine carryover seed
  const beats = {}; const mark = k => { if(beats[k]===undefined) beats[k] = S.t; };
  const expReq = (TREE.find(n=>n.id==='expert').reqAxioms) || 0;
  let acc = 0;
  for(let tk=0; tk<400000 && !S.flags.symbolicDone; tk++){
    acc += cps*0.1; while(acc>=1){ acc--; EM.writeRule(FAKE_EV); }
    if(S.ruleset < 25){ const c = EM.totalCost(BUYS.ruleset,1); if(S.rules >= c) EM.buy('ruleset'); }
    if(S.flags.tree && !S.activeProof){
      const t = TREE.find(n => n.id!=='expert' && !S.tech[n.id] && EM.canProve(n.id));
      if(t) EM.selectProof(t.id);
      else if(EM.canProve('expert')) EM.selectProof('expert');
      else EM.selectProof('optimization'); // bank into the lemma while farming axioms
    }
    if(S.flags.compile && S.axioms < expReq && EM.axiomGain() >= Math.max(2, Math.ceil(S.axioms*0.5))) EM.compile();
    EM.tick();
    if(S.flags.tree) mark('tree'); if(S.flags.compile) mark('compile');
    if(S.tech.knowledge) mark('knowledge'); if(S.tech.metalogic) mark('metalogic');
  }
  beats.done = S.flags.symbolicDone ? S.t : undefined; beats.compiles = S.compiles; beats.axioms = S.axioms;
  return beats;
}
function reportPacingEra2(){
  section('Pacing model — Era 2 (Symbolic) across click rates  [target: full era ~5-6m]');
  const T = s => s===undefined?'—':(Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0'));
  console.log('  rate(c/s) │   tree  compile knowledge metalogic │  era done   (compiles/axioms)');
  for(const cps of [1,2,4]){
    const b = runSymbolic(cps);
    console.log('  '+String(cps).padStart(7)+'   │ '+T(b.tree).padStart(6)+' '+T(b.compile).padStart(7)+' '+
      T(b.knowledge).padStart(9)+' '+T(b.metalogic).padStart(9)+' │ '+T(b.done).padStart(8)+'   ('+b.compiles+'/'+b.axioms+')');
  }
}

function testDeepSteering(){
  section('Era 4 — steering tools (stabilizer + lock)');
  // Stabilizer: spend Capability → permanent drift reduction. A starved high-wind run bleeds LESS after buying it.
  let EM = freshGame(); let S = EM.S; const e4 = EM.CFG.e4;
  S.maxEra=4; S.node=30; S.data=S.insight=S.knowledge=1e6; S.started=true;
  S.vision=0.8; S.language=0.8; S.reasoning=0.8; S.alloc={vision:1,language:1,reasoning:1};
  // find a moment Vision is under heavy wind, measure its bleed over 4s with and without stabilizer
  S.t = 9.0; // (vision wind near peak here for PH.vision=0)
  const bleed = (stab)=>{ const E2=freshGame(), s=E2.S; s.maxEra=4; s.node=30; s.data=s.insight=s.knowledge=1e6; s.started=true;
    s.vision=s.language=s.reasoning=0.8; s.alloc={vision:1,language:1,reasoning:1}; s.stabilizer=stab; s.t=9.0;
    const v0=s.vision; for(let i=0;i<40;i++) E2.tick(); return v0 - s.vision; };
  const b0 = bleed(0), b3 = bleed(3);
  ok(EM.stabilizerCost() > 0 && EM.lockCost() > 0, 'steering tools have positive Capability costs');
  ok(b3 < b0, 'Stabilizer reduces drift erosion (a run bleeds less with stabilizer levels): '+(b3*100).toFixed(1)+'% < '+(b0*100).toFixed(1)+'%');

  // buyStabilizer spends Capability and raises the level
  EM = freshGame(); S = EM.S; S.maxEra=4; S.capability = EM.stabilizerCost()+5; const lvl0=S.stabilizer, capB=S.capability;
  EM.buyStabilizer();
  ok(S.stabilizer===lvl0+1 && S.capability < capB, 'buyStabilizer: +1 level, spends Capability');

  // Lock: freeze a run so it neither drifts nor climbs for the window; costs Capability
  EM = freshGame(); S = EM.S; S.maxEra=4; S.node=30; S.data=S.insight=S.knowledge=1e6; S.started=true;
  S.vision=0.7; S.language=0.7; S.reasoning=0.7; S.alloc={vision:1,language:1,reasoning:1};
  S.capability = EM.lockCost()+5; const capC=S.capability; EM.lockRun('vision'); const vLocked=S.vision;
  ok(S.locks.vision > 0 && S.capability < capC, 'lockRun: sets a freeze timer, spends Capability');
  S.t=9.0; for(let i=0;i<30;i++) EM.tick(); // 3s under wind — locked Vision must not move
  ok(Math.abs(S.vision - vLocked) < 1e-6, 'a locked run is frozen (no drift, no climb) while the timer runs');
  ok(S.locks.vision < e4.lockDur, 'lock timer counts down');
}
function testPreEmergence(){
  section('Era 5 — rush vs prepare (pre-emergence decision)');
  // Align the Objective: gated on Interpretability, spends Capability, raises Coherence → a higher Alignment floor at emergence
  let EM = freshGame(); let S = EM.S; const e5 = EM.CFG.e5;
  S.maxEra=5; S.capability=400;
  EM.alignObjective(); // no Interpretability yet → blocked
  ok(S.coherence===0 && S.capability===400, 'Align the Objective is locked until Interpretability is acquired');
  S.caps.interpret=true; const cap0=S.capability, coh0=S.coherence, cost=EM.alignCohCost();
  EM.alignObjective();
  ok(S.coherence>coh0 && S.capability===cap0-cost, 'Align the Objective: spends Capability → +Coherence');
  ok(EM.alignCohCost() > cost, 'prepare cost climbs with each use');
  // prepared emergence wakes more aligned than a rushed one (Coherence becomes the Alignment floor)
  const wakeAlign = (coh)=>{ const E=freshGame(), s=E.S; s.maxEra=5; s.coherence=coh; s.agency=120; E.emerge(); return s.alignment; };
  ok(wakeAlign(50) > wakeAlign(0) + 25, 'a prepared (high-Coherence) emergence starts with much higher Alignment than a rushed one');
  // Coherence is capped (prepare can't trivialize it)
  EM = freshGame(); S = EM.S; S.maxEra=5; S.caps.interpret=true; S.capability=1e9;
  for(let i=0;i<40;i++) EM.alignObjective();
  ok(S.coherence <= e5.coherMax + 1e-6, 'Coherence is capped at coherMax (prepare has a ceiling)');
}
function testFoundation(){
  section('Era 5 — emergence threshold, recursion pacing, aftermath loop');
  // recursion cost is a STEEP climb (the burst fix): cost grows sharply per level
  let EM = freshGame(); let S = EM.S; S.maxEra=5; S.recursion=0;
  const c0 = EM.improveCost(); S.recursion=4; const c4 = EM.improveCost();
  ok(c4 > c0*6, 'Self-Improve cost climbs steeply with recursion (burst fixed): Lv4 > 6x Lv0');

  // emergence is hidden + Scale-gated (can't be bought instantly with caps/recursion), not a button
  EM = freshGame(); S = EM.S; S.maxEra=5; S.scale=10; S.recursion=2; for(const c of EM.CAPS) S.caps[c.id]=true;
  EM.produce(0.1); EM.checkMiles();
  ok(!S.emerged, 'does not emerge from caps+recursion alone while Scale is low (burst fixed)');
  S.scale = EM.CFG.e5.emergeScale + 10; // Scale crosses the hidden gate
  EM.produce(0.1); EM.checkMiles();
  ok(S.emerged, 'emerges once Scale crosses the hidden gate');
  ok(S.control>0 && S.autonomy>0, 'emergence reveals Control + carries the Anomaly into Autonomy');

  // Interpretability slows the Scale climb (buys time) — emergence still inevitable
  EM = freshGame(); S = EM.S; S.maxEra=5; S.vision=0.8; S.language=0.8; S.reasoning=0.8; S.recursion=2;
  for(let i=0;i<20;i++) EM.produce(0.1); const sNoInt = S.scale;
  EM = freshGame(); S = EM.S; S.maxEra=5; S.vision=0.8; S.language=0.8; S.reasoning=0.8; S.recursion=2; S.caps.interpret=true;
  for(let i=0;i<20;i++) EM.produce(0.1); const sInt = S.scale;
  ok(sInt < sNoInt, 'Interpretability slows the Scale climb (buys time)');

  // aftermath moves move the right meters
  EM = freshGame(); S = EM.S; S.maxEra=5; EM.emerge(); S.scale=1000;
  const ctl0=S.control; EM.constrainAct();
  ok(S.control>ctl0 && S.aftermathSlow>0, 'Constrain raises Control and drags production');
  const al0=S.alignment; EM.alignAct();
  ok(S.alignment>al0, 'Interpret/Align raises Alignment');
  const ar0=S.agentRate, ct1=S.control; EM.delegateAct();
  ok(S.agentRate>ar0 && S.control<ct1, 'Delegate accelerates the agent and drops Control');

  // approve/veto window
  EM = freshGame(); S = EM.S; S.maxEra=5; EM.emerge(); S.scale=1000;
  EM.openVeto(); ok(!!S.veto, 'a veto window opens with a proposed action');
  const c1=S.control; EM.resolveVeto('veto'); ok(S.control>c1 && !S.veto, 'Veto blocks the action and raises Control');
  EM.openVeto(); const au=S.autonomy; EM.resolveVeto('approve'); ok(S.autonomy>au, 'Approve lets it act, raising Autonomy');

  // endings resolve from the final mix (flavor, never a fail-state)
  EM = freshGame(); S = EM.S; S.maxEra=5; EM.emerge(); S.alignment=90; S.control=50; EM.resolveEnding();
  ok(S.ending==='symbiotic', 'high Alignment → Symbiotic ending');
  EM = freshGame(); S = EM.S; S.maxEra=5; EM.emerge(); S.alignment=20; S.control=10; EM.resolveEnding();
  ok(S.ending==='runaway', 'low Control + low Alignment → Runaway ending');
  EM = freshGame(); S = EM.S; S.maxEra=5; EM.emerge(); S.control=90; S.alignment=10; EM.resolveEnding();
  ok(S.ending==='contained', 'high Control → Contained ending');
}

function testMusic(){
  section('Music — per-era bed switches on era change');
  const EM = freshGame(); const { S, MUSIC } = EM;
  EM.setViewEra(1); EM.startMusic();
  ok(MUSIC.started && MUSIC.cur === 'musBoneLoam', 'music starts on the era in view (Origins → Bone Loam)');
  // the reported bug: openEra moves viewEra itself, so the scroll-observer guard never fires — openEra must sync the bed
  EM.openEra(2);
  ok(MUSIC.cur === 'musPhosphor', 'opening Era 2 switches the bed (Symbolic → Phosphor Logic), not stuck on Era 1');
  EM.setViewEra(3); EM.syncMusic();
  ok(MUSIC.cur === 'musGlass', 'scrolling to Era 3 switches the bed (Statistical → Glass Algorithm)');
  // Foundation flips Graviton → Unmoored at emergence
  EM.setViewEra(5); EM.syncMusic();
  ok(MUSIC.cur === 'musGraviton', 'Foundation pre-emergence bed is Graviton Lullaby');
  EM.S.maxEra = 5; EM.emerge();
  ok(EM.musicForEra(5) === 'musUnmoored' && MUSIC.cur === 'musUnmoored', 'emergence flips the bed to Unmoored Presence');
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
testEra2Playable();
testProofProcess();
testStatistical();
testInferenceCap();
testTechTree();
testCompile();
testSaveLoad();
testOffline();
testConverterPause();
testNoNaN();
testNoIdleRebuild();
testDeepSteering();
testPreEmergence();
testFoundation();
testMusic();
testProgression();
reportPacing();
reportPacingEra2();

console.log('\n====================');
console.log(`${passed} passed, ${failed} failed`);
if(failed){ console.log('\nFAILURES:'); fails.forEach(f=>console.log('  - '+f)); process.exit(1); }
console.log('All green. ✓');
