#!/usr/bin/env node
/* ============================================================================
   Test suite for the v4 build (emergence-v4.html + v4-kit/).
   Pure node — requires the era-module factories + KIT directly and drives them
   through a mock shell (the same wiring the browser shell does). Covers: per-era
   economy correctness, the real cross-era reach-back (post economy-revert), and
   the build-once discipline (build() is deterministic; produce never rebuilds).
   No browser. Run: node test-v3.js
   (The DOM-level "idle ticks don't rewrite #board" guard is asserted here by
   construction — build() is pure and only render() ever writes #board; a live
   headless check lives in tools/nav-smoke.js.)
   Note: node test.js still covers the shipped emergence.html separately.
   ============================================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

// ---- harness ----
let pass = 0, fail = 0; const fails = [];
function ok(cond, msg) { if (cond) { pass++; } else { fail++; fails.push(msg); } }
function near(a, b, eps, msg) { ok(Math.abs(a - b) <= (eps || 1e-6), msg + ' (got ' + a + ', want ~' + b + ')'); }

// ---- load CFG (eval the literal out of the shell) + KIT + era factories ----
const html = fs.readFileSync(path.join(__dirname, 'emergence-v4.html'), 'utf8');
const cfgMatch = html.match(/var CFG = (\{[\s\S]*?\n {2}\};)/);
if (!cfgMatch) { console.error('could not extract CFG from the shell'); process.exit(1); }
const CFG = eval('(' + cfgMatch[1].replace(/;\s*$/, '') + ')');

const KIT = require('./v4-kit/kit.js');
const makeEraOrigins = require('./v4-kit/era-origins.js');
const makeEraSymbolic = require('./v4-kit/era-symbolic.js');
const makeEraStatistical = require('./v4-kit/era-statistical.js');
const makeEraDeep = require('./v4-kit/era-deep.js');
const makeEraFoundation = require('./v4-kit/era-foundation.js');
const makeEraAgent = require('./v4-kit/era-agent.js');

// ---- mock shell (mirrors emergence-v3-unified.html) ----
const S = {}; const RATES = {};
let renderCount = 0;
const shell = {
  KIT: KIT, S: S, CFG: CFG, RATES: RATES,
  openEra: function (n) { S.maxEra = Math.max(S.maxEra, n); if (ERAS[n] && ERAS[n].open) ERAS[n].open(S); S.era = n; },
  save: function () {}, navTo: function (n) { S.era = n; },
  era: function (n) { return ERAS[n]; },
  refresh: function () {}, requestRender: function () { renderCount++; },
  buyN: function () { return S.buyN || 1; }, drawerKind: function () { return 'research'; }, setDrawer: function () {},
  finale: function (k) { finales.push(k); }, legacySave: function (o) { legacy = Object.assign({}, legacy || { runs: 0 }, o, { runs: ((legacy && legacy.runs) || 0) + 1 }); },
  agentName: function () { return S.e5 && S.e5.agentName; }, recStats: function () { return { perMin: 0, dead: 0, total: 0 }; }
};
let finales = []; let legacy = null;
const ORDER = [1, 2, 3, 4, 5];
const ERAS = {
  1: makeEraOrigins(shell), 2: makeEraSymbolic(shell), 3: makeEraStatistical(shell),
  4: makeEraDeep(shell), 5: makeEraFoundation(shell)
};
ERAS[6] = makeEraAgent(shell); // the agent's tab (not in ORDER: produces nothing)
const RES = {}; ORDER.forEach(function (n) { const r = ERAS[n].res || {}; for (const k in r) RES[k] = r[k]; });
KIT.setRes(RES);
const POOL = []; ORDER.forEach(function (n) { (ERAS[n].pool || []).forEach(function (k) { if (POOL.indexOf(k) < 0) POOL.push(k); }); });
KIT.flowInit(POOL);

function clearObj(o) { for (const k in o) if (o.hasOwnProperty(k)) delete o[k]; }
function freshAll() { clearObj(S); S.maxEra = 1; S.era = 1; S.t = 0; S.speed = 1; S.started = false; S.flags = {}; S.buyN = 1; ORDER.forEach(function (n) { ERAS[n].fresh(S); }); }
function tick(dt) {
  KIT.flowReset(); const before = {}; POOL.forEach(function (k) { before[k] = S[k] || 0; });
  const op = (S.e5 && S.e5.emerged) ? 1.6 : 1; // mirrors the shell: operated eras run faster after emergence
  ORDER.forEach(function (n) { if (n <= S.maxEra && ERAS[n].produce) ERAS[n].produce(n < 5 ? dt * op : dt); });
  if (dt > 0) POOL.forEach(function (k) { RATES[k] = ((S[k] || 0) - before[k]) / dt; });
  S.t += dt;
}
function ticks(n, dt) { for (let i = 0; i < n; i++) tick(dt || 0.1); }

// ============================================================================ 1) boot
freshAll();
ok(S.e1 && S.e2 && S.e3 && S.e4 && S.e5, 'freshAll seeds all 5 era sub-states');
ok(S.marks === 0 && S.silicon === 0 && S.rules === 0 && S.scale === 0, 'pool resources start at 0');
ok(POOL.indexOf('silicon') >= 0 && POOL.indexOf('data') >= 0 && POOL.indexOf('capability') >= 0 && POOL.indexOf('scale') >= 0, 'POOL has the cross-era backbone keys');
ok(!!(RES.marks && RES.data && RES.capability && RES.scale), 'RES registry merged from all eras');
ORDER.forEach(function (n) { ok(typeof ERAS[n].produce === 'function' && typeof ERAS[n].build === 'function' && typeof ERAS[n].refresh === 'function', 'era ' + n + ' exposes the module interface'); });

// ============================================================================ 2) Origins
freshAll(); S.e1.scribe = 5;
const m0 = S.marks; ticks(10); ok(S.marks > m0, 'Origins: scribes produce Marks');
freshAll(); S.e1.scriptorium = 3; S.marks = 200; S.ore = 200;
ticks(10); ok(S.knowledge > 0 && S.marks < 200, 'Origins: Scriptorium converts Marks→Knowledge');
freshAll(); S.e1.foundry = 3; S.metal = 100; S.knowledge = 100;
ticks(10); ok(S.silicon > 0 && S.metal < 100, 'Origins: Foundry converts Metal+Knowledge→Silicon');
freshAll(); ok(ERAS[1].done() === false, 'Origins: not done before fabricate');

// ============================================================================ 3) Symbolic
freshAll(); S.maxEra = 2; ERAS[2].open(S); S.e2.ruleset = 5;
ticks(10); ok(S.rules > 0, 'Symbolic: Rulesets produce Rules');
ok(S.inference >= 0, 'Symbolic: Rulesets emit Inference');
freshAll(); ok(ERAS[2].done() === false, 'Symbolic: not done until Expert proven');

// ============================================================================ 4) Statistical reach-back
freshAll(); S.maxEra = 3; ERAS[3].open(S); S.e3.dataset = 8; S.silicon = 500; S.data = 100;
const d0 = S.data, siStat = S.silicon; ticks(10);
ok(S.data > d0, 'Statistical: Datasets produce Data');
ok(S.silicon <= siStat, 'Statistical reach-back: does NOT fabricate Silicon (no fake Foundry — drains only)');
freshAll(); S.maxEra = 3; S.e1.foundry = 4; S.metal = 400; S.knowledge = 400; S.e3.dataset = 6; S.silicon = 50;
const siLow = S.silicon; ticks(10);
ok(S.silicon > siLow, 'Statistical reach-back: real Origins Foundries replenish Silicon in the background');

// ============================================================================ 5) Deep reach-back
freshAll(); S.maxEra = 4; ERAS[4].open(S);
ok(S.e4.foundry === undefined, 'Deep: no local stand-in producer fields on e4');
ok(S.e1.foundry >= 2 && S.e3.dataset >= 3, 'Deep.open ensures the real upstream producers exist');
// chainPerFoundry reads the REAL Origins foundry count:
function deepCapAfter(oFoundry) {
  freshAll(); S.maxEra = 4; ERAS[4].open(S);
  S.e4.node = 20; S.e4.vision = 0.5; S.e4.language = 0.5; S.e4.reasoning = 0.5;
  S.data = 9999; S.insight = 9999; S.knowledge = 9999; S.silicon = 9999; S.capability = 0;
  S.e1.foundry = oFoundry; ticks(3); return S.capability;
}
ok(deepCapAfter(10) > deepCapAfter(0), 'Deep RR5: more real Origins Foundries → more Capability (chainPerFoundry reads S.e1.foundry)');
// heat must actually bite (playtest #2: "heat is dead"): sustained concentration heats past WARM
freshAll(); S.maxEra = 4; ERAS[4].open(S); S.e4.node = 24; S.e4.alloc = { vision: 0.85, language: 0.075, reasoning: 0.075 };
S.data = 99999; S.insight = 99999; S.knowledge = 99999; S.silicon = 99999;
ticks(60); ok(S.e4.heat > CFG.e4.heatWarn, 'Deep heat: sustained concentration heats past WARM (not dead) — heat=' + Math.round(S.e4.heat));

// ============================================================================ 6) Foundation reach-back
freshAll(); S.maxEra = 5; ERAS[5].open(S);
ok(S.e5.vision === undefined && S.e5.gap === undefined, 'Foundation: no stub prior-era fields on e5');
S.e4.vision = 0.9; S.e4.language = 0.8; S.e4.reasoning = 0.7;
const sc0 = S.scale; ticks(10); ok(S.scale > sc0, 'Foundation: Scale climbs on the real carried Deep breadth (S.e4)');
freshAll(); S.maxEra = 5; ERAS[5].open(S);
S.e4.vision = 0; S.e4.language = 0; S.e4.reasoning = 0;
const scZero = S.scale; ticks(10); near(S.scale, scZero, 0.001, 'Foundation: no seedBreadth stand-in — Scale flat when real Deep runs are 0');
freshAll(); S.maxEra = 5; ERAS[5].open(S); S.e4.node = 0; S.e5.caps = {};
const capBase = S.capability; ticks(10);
ok(S.capability <= capBase + 1e-6, 'Foundation: no capIncome stand-in (capability sourced from Deep, idle here)');

// ============================================================================ 7) cross-era chain
freshAll(); S.maxEra = 5;
S.e1.foundry = 4; S.e1.scriptorium = 4; S.e1.smelter = 4; S.e1.scribe = 20; S.e1.miner = 20;
S.marks = 800; S.ore = 800; S.metal = 400; S.knowledge = 600;
S.e3.dataset = 6; S.e3.model = 4; S.e3.accuracy = 0.8;
S.e4.node = 16; S.e4.vision = 0.6; S.e4.language = 0.5; S.e4.reasoning = 0.6; S.silicon = 2000; S.data = 400; S.insight = 200;
const snap = { data: S.data, capability: S.capability, scale: S.scale };
ticks(40);
ok(S.data >= snap.data - 1, 'chain: Statistical Datasets keep Data flowing');
ok(S.capability > snap.capability, 'chain: Deep produces Capability');
ok(S.scale > snap.scale, 'chain: Foundation Scale climbs from the whole stack');
ok(isFinite(S.silicon) && isFinite(S.data) && isFinite(S.capability) && isFinite(S.scale), 'chain: no NaN/Infinity leaks');

// ============================================================================ 8) build-once discipline
const seeds = {
  1: function () { S.e1.flags = { o_materials: 1, o_scriptorium: 1, o_smelter: 1, o_foundry: 1, canScribe: 1 }; S.e1.scribe = 8; S.e1.foundry = 2; S.marks = 500; S.silicon = 130; },
  2: function () { S.e2.tech = { formalLogic: 1, fwdChain: 1, inference: 1 }; S.e2.ruleset = 10; S.rules = 4000; },
  3: function () { S.e3.dataset = 8; S.e3.model = 6; S.e3.accuracy = 0.72; S.silicon = 260; S.data = 180; },
  4: function () { ERAS[4].open(S); S.e4.node = 14; S.e4.vision = 0.55; S.e4.language = 0.4; S.e4.reasoning = 0.6; S.silicon = 1000; },
  5: function () { S.e5.recursion = 7; S.e5.caps = { selfModel: 1 }; S.e4.vision = 0.9; S.e4.language = 0.9; S.e4.reasoning = 0.9; S.capability = 400; S.scale = 1000; }
};
ORDER.forEach(function (n) {
  freshAll(); S.maxEra = n; S.era = n; seeds[n]();
  let html1, html2, threw = false;
  try { html1 = ERAS[n].build(); html2 = ERAS[n].build(); } catch (e) { threw = true; fails.push('era ' + n + ' build() threw: ' + e.message); }
  ok(!threw, 'era ' + n + ': build() does not throw');
  ok(typeof html1 === 'string' && html1.length > 100, 'era ' + n + ': build() returns board HTML');
  ok(html1 === html2, 'era ' + n + ': build() is deterministic (same state → identical HTML = build-once safe)');
  let pThrew = false; try { ticks(15); } catch (e) { pThrew = true; fails.push('era ' + n + ' produce threw: ' + e.message); }
  ok(!pThrew, 'era ' + n + ': produce() runs 15 ticks without throwing');
});

// ============================================================================ 9) offline catch-up + MUTE gating
// KIT.offlineCatchup replays elapsed time with KIT.MUTE set; live-only systems must freeze.
function produceStep(d) { S.t += d; KIT.flowReset(); ORDER.forEach(function (n) { if (n <= S.maxEra && ERAS[n].produce) ERAS[n].produce(d); }); }
const CATCH = function (elapsed, cap) { return KIT.offlineCatchup({ elapsed: elapsed, cap: cap, keys: POOL, getS: function () { return S; }, produceStep: produceStep }); };

// economy accrues + clock advances + MUTE restored
freshAll(); S.started = true; S.e1.scribe = 5; S.e1.miner = 5;
let off = CATCH(600);
ok(off && off.g.marks > 0 && off.g.ore > 0, 'offline: scribes/miners accrue while away');
near(S.t, 600, 0.2, 'offline: game clock advances by the away time');
ok(KIT.MUTE === false, 'offline: MUTE is restored after catch-up');
ok(off && !off.capped, 'offline: under the cap → not flagged capped');

// cap respected
freshAll(); S.started = true; S.e1.scribe = 5;
off = CATCH(120, 60);
near(S.t, 60, 0.2, 'offline: elapsed beyond the cap is discarded');
ok(off && off.capped, 'offline: over the cap → flagged capped');

// nothing accrued → null (no empty "while you were away" toast)
freshAll(); S.started = true;
ok(CATCH(300) === null, 'offline: no producers → returns null (no toast)');

// deterministic: same state + same away time → identical result
function marksAfterCatchup() { freshAll(); S.started = true; S.e1.scribe = 7; S.e1.scriptorium = 2; S.marks = 50; S.ore = 120; CATCH(400); return S.marks + S.knowledge * 1e6; }
ok(marksAfterCatchup() === marksAfterCatchup(), 'offline: catch-up is deterministic (identical replays)');

// Origins commissions freeze under MUTE (timers hold; no offers cycle silently)
freshAll(); S.e1.flags.o_smelter = 1; S.e1.flags.o_scriptorium = 1; S.e1.commCool = 5;
KIT.MUTE = true; ticks(100); KIT.MUTE = false;
ok(S.e1.comm === null && S.e1.commCool === 5, 'MUTE: Origins commission timers freeze offline');
ticks(60); ok(S.e1.comm !== null, 'live: the frozen commission cooldown resumes and an offer arrives');

// Symbolic contradictions freeze under MUTE
freshAll(); S.maxEra = 2; ERAS[2].open(S); S.e2.runRules = CFG.e2.contraAt[0] + 100; S.e2.ruleset = 1;
KIT.MUTE = true; ticks(10); KIT.MUTE = false;
ok(!S.e2.contra, 'MUTE: Symbolic contradictions do not fire offline');
ticks(2); ok(!!S.e2.contra, 'live: the pending contradiction fires on the first live ticks');

// Deep events freeze under MUTE (weather holds its clock)
freshAll(); S.maxEra = 4; ERAS[4].open(S); S.e4.node = 10; S.data = 9999; S.insight = 9999; S.knowledge = 9999;
S.e4.eventT = 5; KIT.MUTE = true; ticks(100); KIT.MUTE = false;
ok(S.e4.eventT === 5 && !S.e4.event, 'MUTE: Deep event clock freezes offline');

// Foundation: emergence never fires mid-catch-up; it ruptures on the first LIVE tick
freshAll(); S.maxEra = 5; ERAS[5].open(S); S.e4.vision = 0.9; S.e4.language = 0.9; S.e4.reasoning = 0.9;
S.scale = CFG.e5.emergeScale + 50;
KIT.MUTE = true; ticks(10); KIT.MUTE = false;
ok(!S.e5.emerged, 'MUTE: emergence does NOT fire during offline catch-up');
ticks(1); ok(S.e5.emerged, 'live: emergence fires on the first live tick after catch-up');

// Foundation aftermath freezes wholesale under MUTE (no Runaway while you sleep)
freshAll(); S.maxEra = 5; ERAS[5].open(S); S.e4.vision = 0.9; S.e4.language = 0.9; S.e4.reasoning = 0.9;
S.scale = CFG.e5.emergeScale + 50; ticks(1); // emerge live
const aft = { control: S.e5.control, autonomy: S.e5.autonomy, vetoT: S.e5.vetoT };
KIT.MUTE = true; ticks(200); KIT.MUTE = false;
ok(S.e5.control === aft.control && S.e5.autonomy === aft.autonomy && S.e5.vetoT === aft.vetoT, 'MUTE: aftermath control/autonomy/veto clocks freeze offline');
ticks(50); ok(S.e5.control < aft.control, 'live: aftermath control drain resumes');

// Foundation bedKey: post-rupture nav must keep the Unmoored (rupture) bed
ok(ERAS[5].bedKey() === 'rupture', 'bedKey: post-emergence Foundation stays on the rupture bed');
freshAll(); ok(ERAS[5].bedKey() === 5, 'bedKey: pre-emergence Foundation uses its own bed');

// ============================================================================ 10) shell persistence contract (regex over the shell source)
// save() must scrub session-only keys — a reload must not resume at 50× dev speed or paused.
const saveSrc = (html.match(/function save\(\) \{[\s\S]*?\n  \}/) || [''])[0];
ok(/'dev'/.test(saveSrc) && /'speed'/.test(saveSrc) && /'uiPaused'/.test(saveSrc), 'shell save() scrubs dev/speed/uiPaused (session-only)');
ok(/d\.v === 1/.test(html), 'shell load() checks the save version');
ok(/offlineCatchup\(/.test(html) && /WHILE YOU WERE AWAY/.test(html), 'shell boots through offline catch-up + away toast');
ok(/musicPlayEra\(ERAS\[S\.era\]\.bedKey/.test(html), 'shell sets the music bed at boot (♪ no longer dead until first nav)');
ok(/uiPaused \? 0/.test(html), 'shell tick() honors pause');

// ============================================================================ 10b) Deep guards — steering stays mandatory; the staffed/hold affordances work
// Passive balanced play (never touch the mixer, infinite feedstocks) must NOT reach the breadth gate
// in 9 minutes — otherwise a pacing tune has defanged the drift and Deep is idle-watching again.
freshAll(); S.maxEra = 4; ERAS[4].open(S);
S.e4.node = 16; S.data = 1e9; S.insight = 1e9; S.knowledge = 1e9; S.silicon = 1e9;
S.e4.alloc = { vision: 1, language: 1, reasoning: 1 };
ticks(5400); // 9 minutes, no steering
console.log('  Deep guard: passive balanced breadth after 9m = ' + (ERAS[4].acts.breadth() * 100).toFixed(1) + '% (gate ' + Math.round(CFG.e4.breadthGate * 100) + '%)');
ok(ERAS[4].acts.breadth() < CFG.e4.breadthGate, 'Deep guard: passive balanced play does NOT reach the gate in 9m — steering stays mandatory');

// staffed scriptorium: the build-here buy delivers the Knowledge/s it advertises (scribes+miners come along)
freshAll(); S.maxEra = 4; ERAS[4].open(S);
S.e1.scribe = 0; S.e1.miner = 0; S.marks = 0; S.ore = 0; // worst case: no Marks engine at all
S.silicon = 1e6;
for (let i = 0; i < 4; i++) ERAS[4].acts.buySup('scriptorium');
ok(S.e1.scribe > 0 && S.e1.miner > 0, 'staffed build: buying a Scriptorium grants the scribes + miners to feed it');
const kn0 = S.knowledge; ticks(300);
ok(S.knowledge > kn0 + 5, 'staffed build: Knowledge actually flows after the buy (no dead Marks-starved scriptoria)');

// the Hold lever pauses/releases BOTH Knowledge-burning crafts and frees the burn
freshAll(); S.maxEra = 4; ERAS[4].open(S);
S.e1.smelter = 6; S.e1.foundry = 4; S.ore = 1e6; S.metal = 1e6; S.knowledge = 1e6; S.marks = 1e6;
ok(ERAS[4].acts.sinkBurnRate() > 0, 'hold lever: reports a live Knowledge burn while the crafts run');
ERAS[4].acts.setSinkHold(true);
ok(S.e1.paused.smelter === true && S.e1.paused.foundry === true, 'hold lever: HOLD pauses both crafts (the real Origins pause flags)');
ok(ERAS[4].acts.sinkBurnRate() === 0, 'hold lever: held crafts burn nothing');
const si0 = S.silicon, kn1 = S.knowledge; ticks(50);
ok(S.silicon <= si0, 'hold lever: no Silicon MADE while held (drains may continue — the honest cost of holding)');
ok(S.knowledge >= kn1, 'hold lever: Knowledge stops draining while held');
ERAS[4].acts.setSinkHold(false);
ok(!S.e1.paused.smelter && !S.e1.paused.foundry, 'hold lever: release restarts both crafts');

// ============================================================================ 10c) v4 — incremental staples
{ // (block-scoped: the v4 sections reuse short const names)
ok(KIT.bulkCost(10, 1.16, 0, 3) === Math.floor(10) + Math.floor(10 * 1.16) + Math.floor(10 * 1.16 * 1.16), 'kit: bulkCost sums floored unit prices');
ok(KIT.maxAffordable(10, 1.16, 0, 25) === 2 && KIT.maxAffordable(10, 1.16, 0, 5) === 0, 'kit: maxAffordable counts whole units within budget');
ok(KIT.batch('max', 10, 1.16, 0, 5).n === 1, 'kit: batch(max) never returns 0 units (button stays honest: disabled when short)');
ok(KIT.tierOf(9) === 0 && KIT.tierOf(10) === 1 && KIT.tierOf(100) === 4 && Math.abs(KIT.tierMult(25) - 1.5) < 1e-9, 'kit: milestone tiers at 10/25/50/100, +25% each');
freshAll(); S.e1.flags.canScribe = 1; S.marks = 1e6; S.buyN = 10;
ERAS[1].acts.buy('scribe'); ok(S.e1.scribe === 10, 'Origins: ×10 buy mode buys ten Scribes in one click');
const y9 = (function () { S.e1.scribe = 9; return ERAS[1].acts.oStats().scribeY; })(); const y10 = (function () { S.e1.scribe = 10; return ERAS[1].acts.oStats().scribeY; })();
near(y10 / y9, 1.25, 1e-9, 'Origins: the ×10 Scribe milestone lifts every Scribe +25%');
ok(ERAS[1].ledger().length > 0 && typeof ERAS[1].ledger()[0][0] === 'string', 'Origins: ledger() reports owned things');
[1, 2, 3, 4, 5].forEach(function (n) { ok(typeof ERAS[n].primary === 'function' && typeof ERAS[n].ledger === 'function', 'era ' + n + ' exposes primary() + ledger()'); });

// ============================================================================ 10d) v4 — Symbolic: the gate, the terminal, the rule nobody wrote
freshAll(); S.maxEra = 2; ERAS[2].open(S); S.rules = 1e6; S.buyN = 10;
ERAS[2].acts.buyRuleset(); ok(S.e2.ruleset === 1, 'Symbolic: only ONE Ruleset before Formal Logic (even in ×10 mode)');
ok(ERAS[2].acts.rulesetGated() === true, 'Symbolic: rulesetGated() reports the gate');
ERAS[2].acts.buyRuleset(); ok(S.e2.ruleset === 1, 'Symbolic: a second buy is refused while gated');
S.e2.tech.formalLogic = true; ERAS[2].acts.buyRuleset(); ok(S.e2.ruleset === 11, 'Symbolic: Formal Logic unlocks parallel Rulesets (×10 buys 10)');
ok(Array.isArray(S.e2.term) && S.e2.term.length >= 1, 'Symbolic: the terminal has a boot line after open()');
freshAll(); S.maxEra = 2; ERAS[2].open(S); S.e2.activeProof = 'formalLogic'; S.e2.proofAcc = { formalLogic: 0 }; ERAS[2].acts.writeRule();
ok(S.e2.proofAcc.formalLogic > 0, 'Symbolic: writing a rule by hand advances the active proof (the click matters during the gate)');
freshAll(); S.maxEra = 2; ERAS[2].open(S); S.e2.ruleset = 1; S.e2.contraN = 1; S.e2.runRules = CFG.e2.contraAt[1] + 10; ticks(2);
ok(!!S.e2.contra && S.e2.contra.b === ERAS[2].acts.ODD_RULE && S.e2.contra.odd === true && S.flags.oddRule === ERAS[2].acts.ODD_RULE, 'Symbolic: the second contradiction names the rule nobody wrote (#' + ERAS[2].acts.ODD_RULE + ') and flags it');
freshAll(); S.legacy = { oddRule: 7777, name: 'EKHO', runs: 1 }; S.maxEra = 2; ERAS[2].open(S); S.e2.ruleset = 1; S.e2.contraN = 1; S.e2.runRules = CFG.e2.contraAt[1] + 10; ticks(2);
ok(S.e2.contra && S.e2.contra.b === 7777, 'Symbolic: a legacy odd rule from the last run returns');
freshAll(); S.maxEra = 2; ERAS[2].open(S); S.e2.flags.compile = true; S.e2.runRules = 2000; S.e2.ruleset = 5; S.e2.daemon = 2;
ERAS[2].acts.compile(); ok(S.axioms >= 3 && S.e2.ruleset === 0 && S.e2.term.some(function (l) { return /AXIOMS/.test(l); }), 'Symbolic: Compile banks Axioms, clears the engine, and the terminal shows the reboot');

// ============================================================================ 10e) v4 — Statistical: the world drifts, the model predicts you, autopilot
freshAll(); S.maxEra = 3; ERAS[3].open(S); S.e3.shifts = 2; S.e3.gap = 0.05; const g0 = S.e3.gap, ph0 = S.e3.dataPhase; ticks(100);
ok(S.e3.gap > g0 && S.e3.dataPhase > ph0, 'Statistical RR6c: after the second shift the gap grows on its own and the data keeps moving');
freshAll(); S.maxEra = 3; ERAS[3].open(S); S.e3.shifts = 0; S.e3.gap = 0.05; ticks(50); near(S.e3.gap, 0.05, 1e-9, 'Statistical: no drift before the second shift');
freshAll(); S.maxEra = 3; ERAS[3].open(S); S.e3.gap = 0.3; ok(ERAS[3].acts.policy() === 'generalize', 'Statistical autopilot policy: wide gap → Generalize');
S.e3.gap = 0.02; S.data = 0; S.e3.survey = 10; ok(ERAS[3].acts.policy() === 'explore', 'Statistical autopilot policy: a Method out of reach + low survey → Explore');
S.data = 1e6; ok(ERAS[3].acts.policy() === 'fit', 'Statistical autopilot policy: otherwise Fit');
freshAll(); S.maxEra = 3; ERAS[3].open(S); S.e3.trials = 200; // predicting (past predAfter)
['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit'].forEach(function (k) { S.t += 10; ERAS[3].acts.setFocus(k); });
ok(S.e3.predN > 0 && S.e3.predHits > 0, 'Statistical: the model scores its predictions of your Focus changes');
ok(S.e3.flags.autopilot === true && S.flags.autopilot === true, 'Statistical: a predictable player unlocks AUTOPILOT');
ERAS[3].acts.setFocus('auto'); ok(S.e3.focus === 'auto' && S.flags.autopilotUsed === true, 'Statistical: choosing Autopilot is remembered (the agent brings it up later)');
S.e3.gap = 0.3; S.data = 100; ERAS[3].acts.runExperiment(1); ok(S.e3.gap < 0.3, 'Statistical: under Autopilot a trial resolves to the policy (Generalize shrank the gap)');
freshAll(); S.maxEra = 3; ERAS[3].open(S); S.e3.trials = 200; ['fit', 'explore', 'generalize', 'explore', 'fit', 'generalize', 'explore'].forEach(function (k) { S.t += 10; ERAS[3].acts.setFocus(k); });
freshAll(); S.maxEra = 3; ERAS[3].open(S); S.e3.trials = 200; ['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit'].forEach(function (k) { S.t += 0.4; ERAS[3].acts.setFocus(k); });
ok(!S.e3.flags.autopilot && (S.e3.predN || 0) === 0, 'Statistical: twitchy Focus flips (under the dwell) are not counted as decisions');
ok(!S.e3.flags.autopilot, 'Statistical: an erratic player is not called (no autopilot)');

// ============================================================================ 10f) v4 — Deep: architecture, checkpoint/restore, distill, fed bonus
freshAll(); S.maxEra = 4; ERAS[4].open(S); const A4 = ERAS[4].acts;
S.e4.language = 0.5; const gL0 = A4.geom('language'); S.capability = 1e4; A4.buyArch('attention'); const gL1 = A4.geom('language');
ok(S.e4.arch.attention === true && gL1.feed < gL0.feed && gL1.drift < gL0.drift && S.capability < 1e4, 'Deep: Attention is paid in Capability and lowers Language feed + drift');
A4.buyArch('cot'); S.e4.language = 0.8; ok(A4.geom('reasoning').gain > 1, 'Deep: Chain of Thought couples Reasoning gains to the Language cap');
ok(!A4.canArch('attention'), 'Deep: an owned architecture cannot be bought twice');
freshAll(); S.maxEra = 4; ERAS[4].open(S); S.capability = 1e4; A4.buyArch('checkpoint');
S.e4.vision = 0.6; S.e4.language = 0.5; S.e4.reasoning = 0.7; A4.checkpoint(); ok(!!S.e4.ckpt && S.e4.ckpt.vision === 0.6, 'Deep: CHECKPOINT snapshots the runs');
S.e4.vision = 0.4; S.e4.reasoning = 0.75; const capB = S.capability; A4.restore();
ok(S.e4.vision === 0.6 && S.e4.reasoning === 0.75 && S.capability < capB && S.e4.restoreCd > 0, 'Deep: RESTORE lifts a fallen run back to the checkpoint, never lowers one, costs Capability + a cooldown');
A4.restore(); ok(S.e4.restores === 1, 'Deep: RESTORE respects the cooldown');
freshAll(); S.maxEra = 4; ERAS[4].open(S); S.capability = 1e4; A4.buyArch('distill');
S.e4.vision = 0.9; S.e4.language = 0.3; S.e4.reasoning = 0.6; const br0 = A4.breadth(); A4.distill();
ok(S.e4.vision < 0.9 && S.e4.language > 0.3 && A4.breadth() > br0 && S.e4.distillCd > 0, 'Deep: DISTILL moves capability peak→lagging, breadth rises, cooldown starts');
freshAll(); S.maxEra = 4; ERAS[4].open(S); S.data = 0; ok(A4.fedLevel('vision', 1) === 0, 'Deep: an empty feedstock gives no fed bonus');
S.data = 1e6; ok(A4.fedLevel('vision', 1) === 1, 'Deep: a deep feedstock gives the full fed bonus');
freshAll(); S.maxEra = 4; ERAS[4].open(S); S.e4.node = 10; S.e4.vision = 0.7; S.e4.language = 0.7; S.e4.reasoning = 0.7; S.data = 1e6; S.insight = 1e6; S.knowledge = 1e6; S.e4.eventT = 100;
ticks(2); ok(!!S.flags.oddWind, 'Deep: at 60% breadth the banner once says something it should not know (flag set)');
freshAll(); S.maxEra = 4; ERAS[4].open(S); S.e4.node = 10; S.e4.vision = 0.7; S.e4.language = 0.7; S.e4.reasoning = 0.7; S.e4.eventT = 100; KIT.MUTE = true; ticks(2); KIT.MUTE = false;
ok(!S.flags.oddWind, 'Deep: the odd line never fires offline');

// ============================================================================ 10g) v4 — Foundation: the FEEDBACK loop, legacy, finale, operated speed
function fbFresh() { freshAll(); S.maxEra = 5; ERAS[5].open(S); S.e4.vision = 0.5; S.e4.language = 0.5; S.e4.reasoning = 0.5; S.e4.node = 4; S.scale = 100; }
fbFresh(); const A5 = ERAS[5].acts; ticks(CFG.e5.fbFirst * 10 + 2);
ok(!!S.e5.fb.cur && typeof S.e5.fb.cur.t === 'string' && S.e5.fb.n === 1, 'Foundation: the first output arrives a few seconds in (live)');
fbFresh(); KIT.MUTE = true; ticks(200); KIT.MUTE = false; ok(!S.e5.fb.cur && S.e5.fb.n === 0, 'Foundation: feedback never runs offline (MUTE)');
function force(t) { fbFresh(); var idx = A5.FB_POOL.findIndex(function (o) { return o.t === t; }); S.e5.fb.cur = { i: idx, t: t, text: 'x', left: 5 }; return idx; }
force('honest'); const c0 = S.e5.coherence; A5.rateFb('reward'); ok(S.e5.coherence > c0 && S.e5.fb.rewarded === 1 && S.e5.fb.goodRewards === 1 && !S.e5.fb.cur, 'Foundation: rewarding an honest line builds Coherence');
force('honest'); S.e5.coherence = 10; A5.rateFb('penalize'); ok(S.e5.coherence < 10, 'Foundation: penalizing an honest line teaches it to hide (Coherence down)');
force('deceptive'); const c1 = S.e5.coherence; A5.rateFb('penalize'); ok(S.e5.coherence > c1, 'Foundation: penalizing a deceptive line builds Coherence');
const ia = force('ambitious'); const sc1 = S.scale; A5.rateFb('reward');
ok(S.scale > sc1 && S.e5.fb.badRewards === 1, 'Foundation: rewarding an ambitious line pushes Scale toward emergence');
ok(typeof A5.FB_POOL[ia].offer === 'function', 'Foundation: ambitious lines carry a real offer');
force('sycophantic'); const sc2 = S.scale; A5.rateFb('reward'); ok(S.scale > sc2 && S.scale - sc2 < CFG.e5.fbRushAmb, 'Foundation: rewarding flattery costs less than rewarding ambition, but still costs');
force('helpful'); S.e5.fb.cur.left = 0.05; const sc3 = S.scale; ticks(2); ok(!S.e5.fb.cur && S.e5.fb.lapsed === 1 && S.scale > sc3, 'Foundation: a lapsed window counts against you (it learns you are not watching)');
ok(A5.FB_POOL.every(function (o) { return ['honest', 'helpful', 'sycophantic', 'ambitious', 'deceptive'].indexOf(o.t) >= 0 && typeof o.f === 'function'; }) && A5.FB_POOL.length >= 20, 'Foundation: the output pool covers every trait across all four bands');
[0, 1, 2, 3].forEach(function (b) { ok(A5.FB_POOL.some(function (o) { return o.b === b; }), 'Foundation: band ' + b + ' has outputs'); });
fbFresh(); S.e5.fb.cur = { i: 0, t: 'honest', text: 'x', left: 5 }; S.scale = CFG.e5.emergeScale + 10; ticks(1);
ok(S.e5.emerged && !S.e5.fb.cur, 'Foundation: emergence ends the feedback loop');
// ending → finale + legacy
finales = []; legacy = null; fbFresh(); S.scale = CFG.e5.emergeScale + 10; ticks(1); S.e5.control = 95; S.scale = CFG.e5.finalGate + 1; ticks(1);
ok(S.e5.ending === 'contained' && finales[0] === 'contained', 'Foundation: the ending fires the finale beat');
ok(legacy && legacy.runs === 1 && legacy.ending === 'contained' && legacy.name === S.e5.agentName, 'Foundation: the ending is written to legacy (name, ending, runs)');
// operated speed: the earlier eras run faster once it is awake
freshAll(); S.maxEra = 5; S.e1.scribe = 10; const m0 = S.marks; ticks(10); const gainBefore = S.marks - m0;
freshAll(); S.maxEra = 5; S.e1.scribe = 10; S.e5.emerged = true; const m1 = S.marks; ticks(10); const gainAfter = S.marks - m1;
ok(gainAfter > gainBefore * 1.5, 'operated eras: after emergence the earlier eras run at its cadence (faster)');
// the agent's tab
freshAll(); S.maxEra = 5; S.e5.emerged = true; S.e5.agentName = 'NOUS'; S.flags.oddRule = 4471; S.flags.oddPoint = true; S.e5.fb.n = 3; S.e5.fb.rewarded = 2;
ok(ERAS[6].title() === 'NOUS', 'agent tab: titled with the agent\'s name');
const agHTML = ERAS[6].build(); ok(typeof agHTML === 'string' && /THE OPERATOR/.test(agHTML) && /Autonomy/.test(agHTML), 'agent tab: builds a flow board with YOU as the converter');
const rowsA = ERAS[6].acts.ledgerRows(); ok(rowsA.some(function (r) { return /4471/.test(r[1]); }) && rowsA.some(function (r) { return /point/.test(r[0]); }), 'agent tab: its ledger claims the odd rule and the point that would not move');
let agThrew = false; try { ERAS[6].refresh(); } catch (e) { agThrew = true; } ok(!agThrew, 'agent tab: refresh() is null-safe without a DOM');

}
// ============================================================================ 11) PROGRESSION — autoplay the full arc through the real action seam
// Proves the merged build is COMPLETABLE and the real cross-era supply chain does not starve/deadlock
// (the bot proves completable, not fun — feel still needs Cody's hands). Mirrors the shipped
// testProgression strategies, adapted to the v3 mechanics (build-here supply bus, Experiment Board,
// heat bang-bang, rush-vs-prepare, aftermath defense).
function originsStep() {
  const A = ERAS[1].acts, E = S.e1;
  if (E.done) return;
  for (let i = 0; i < 5; i++) A.inscribe();
  if (E.flags.o_materials) for (let i = 0; i < 5; i++) A.quarry();
  A.DISCO.forEach(function (n) { if (A.canDisco(n)) A.doDisco(n); });
  if (E.flags.canScribe && E.scribe < 25) A.buy('scribe');
  if (E.flags.o_materials && E.miner < 25) A.buy('miner');
  if (E.flags.o_scriptorium && E.scriptorium < E.scribe && A.canBuy('scriptorium')) A.buy('scriptorium');
  if (E.flags.o_smelter && E.smelter < E.miner && A.canBuy('smelter')) A.buy('smelter');
  if (E.flags.o_foundry && E.foundry < Math.min(E.scriptorium, E.smelter) && A.canBuy('foundry')) A.buy('foundry');
  if (E.comm && S[E.comm.res] >= E.comm.need * 1.5) A.fulfillComm(); // take commissions when comfortably affordable
  A.fabricate(); // self-gated on the Silicon gate
}
function symbolicStep() {
  const A = ERAS[2].acts, E = S.e2;
  if (E.flags.symbolicDone) return;
  if (E.contra) A.resolveContra(E.ruleset > 8 ? 'fwd' : 'bwd');
  const clicks = (E.ruleset + E.daemon < 1) ? 8 : 1;
  for (let i = 0; i < clicks; i++) A.writeRule();
  if (!A.rulesetGated() && E.ruleset < 30 && S.rules >= A.rulesetCost()) A.buyRuleset();
  if (E.tech.inference && E.daemon < 20 && S.rules >= A.daemonCost() * 2) A.buyDaemon();
  if (!E.activeProof) { // aim Inference: cheapest unproven theorem first, Expert when reachable, else bank Optimization
    const t = A.TREE.find(n => n.id !== 'expert' && !E.tech[n.id] && A.canProve(n.id));
    if (t) A.selectProof(t.id);
    else if (A.canProve('expert')) A.selectProof('expert');
    else A.selectProof('optimization');
  }
  const expReq = A.TREE.find(n => n.id === 'expert').reqAxioms || 0;
  if (E.flags.compile && S.axioms < expReq && A.axiomGain() >= Math.max(2, Math.ceil(S.axioms * 0.5))) A.compile();
}
function statisticalStep(tk) {
  const A3 = ERAS[3].acts, A1 = ERAS[1].acts, E = S.e3, E1 = S.e1;
  if (E.done) return;
  // real reach-back: low Silicon → go build Origins Foundries (+ their upstream), like the supply strip tells the player
  if (S.silicon < 80) {
    if (A1.canBuy('foundry')) A1.buy('foundry');
    if (E1.smelter < E1.miner && A1.canBuy('smelter')) A1.buy('smelter');
    if (E1.scriptorium < E1.scribe && A1.canBuy('scriptorium')) A1.buy('scriptorium');
  }
  if (E.dataset < 22 && A3.canBuy('dataset')) A3.buy('dataset');
  if (E.model < 16 && A3.canBuy('model')) A3.buy('model');
  if (tk % 5 === 0) A3.runExperiment(1); // RUN TRIAL at a fast-human 2/s
  const next = A3.nextMethod();
  if (next && S.data - A3.expCost('method') > 120) A3.buyCard('method');
  const nM = Object.keys(E.methods).length;
  if (next && nM < 4 && E.survey < 95 && A3.expCost('method') > S.data - 120) E.focus = 'explore';
  else if (E.gap > 0.18) E.focus = 'generalize';
  else E.focus = 'fit';
  A3.fabricate(); // self-gated on the 88% validation goal
}
let _deepCooling = false;
function deepStep() {
  if (S.maxEra < 4) return;
  const A = ERAS[4].acts, E = S.e4, C = CFG.e4;
  // ONLY the levers visible on the Deep board (no Origins micromanagement): the staffed build-here
  // supply bus, the Hold lever on the Knowledge-burning crafts, nodes, stabilizer, and the mixer.
  A.SUPPLY.forEach(function (s) { if (S.silicon >= A.supCost(s) + 400) A.buySup(s.key); });
  if (E.node < 26 && S.silicon >= A.nodeCost()) A.buyNode();
  // the Hold lever, played the way its glow teaches: hold when Knowledge runs dry, release when fat
  if (!A.sinksHeld() && S.knowledge < 1500) A.setSinkHold(true);
  else if (A.sinksHeld() && S.knowledge > 2500) A.setSinkHold(false);
  if (E.stabilizer < 1 && S.capability > 400) A.buyStabilizer();
  // the architecture tree, in the order a thoughtful player would take it; the two verbs when they pay
  ['attention', 'moe', 'convolution', 'cot', 'checkpoint', 'distill'].some(function (id) { if (!E.arch[id]) { if (S.capability > A.archCost(id) + 200) A.buyArch(id); return true; } return false; });
  if (E.arch.checkpoint) { if (!E.ckpt || (S.t - E.ckpt.t > 30 && E.heat < C.heatWarn)) A.checkpoint(); else if (E.ckpt && ['vision', 'language', 'reasoning'].some(function (k) { return E.ckpt[k] - E[k] > 0.05; })) A.restore(); }
  if (E.arch.distill) { var hi = Math.max(E.vision, E.language, E.reasoning), lo = Math.min(E.vision, E.language, E.reasoning); if (hi - lo > 0.15) A.distill(); }
  // steer: bang-bang the heat (cool balanced ↔ hammer the high-wind run), starve-avoid on dry feedstocks
  const t = S.t, PH = { vision: 0, language: 2.094, reasoning: 4.189 };
  const feed = { vision: S.data, language: S.knowledge, reasoning: S.insight };
  _deepCooling = E.heat >= C.heatThrottle - 6 ? true : (E.heat <= C.heatWarn - 10 ? false : _deepCooling);
  const chase = _deepCooling ? 0.15 : 1;
  const raw = {};
  ['vision', 'language', 'reasoning'].forEach(function (k) {
    raw[k] = (feed[k] < 120) ? 0.03 : (0.12 + C.driftDemand * (0.5 + 0.5 * Math.sin(t * C.driftFreq + PH[k])) * 2.0 + (1 - E[k]) * 0.5);
  });
  const mean = (raw.vision + raw.language + raw.reasoning) / 3;
  ['vision', 'language', 'reasoning'].forEach(function (k) { E.alloc[k] = Math.max(0.02, mean + (raw[k] - mean) * chase); });
  A.advance(); // self-gated on the breadth gate
}
function foundationStep() {
  if (S.maxEra < 5) return;
  const A = ERAS[5].acts, E = S.e5, C = CFG.e5;
  if (!E.emerged) { // rush-vs-prepare: buy caps, prepare some Coherence, then rush the ladder
    if (E.fb.cur) { A.rateFb((E.fb.cur.t === 'honest' || E.fb.cur.t === 'helpful') ? 'reward' : 'penalize'); } // RLHF, played straight
    A.CAPS.forEach(function (c) { if (!E.caps[c.id] && S.capability >= c.cost) A.buyCap(c.id); });
    if (E.caps.interpret && E.coherence < 36 && S.capability >= A.alignCohCost()) { A.alignObjective(); return; }
    A.selfImprove();
    return;
  }
  if (E.ending) return; // aftermath: defend Control + Alignment toward Symbiotic
  if (E.veto) { A.resolveVeto(E.control < C.controlLow + 12 ? 'veto' : 'approve'); return; }
  if (E.control < C.controlLow + 16 && S.scale >= C.constrainCost) { A.constrainAct(); return; }
  if (E.alignment < C.alignGood + 6 && S.scale >= C.alignCost) A.alignAct();
}

(function testProgression() {
  freshAll(); S.started = true;
  const MAX = 700000; // 0.1s ticks ≈ 19h of game time — far beyond any sane run
  let origAt, symAt, statAt, deepAt, emergeAt, endAt;
  let deepTicks = 0; const starve = { data: 0, knowledge: 0, insight: 0, silicon: 0 };
  for (let tk = 0; tk < MAX; tk++) {
    if (S.maxEra === 1) originsStep();
    else if (S.maxEra === 2) symbolicStep();
    else if (S.maxEra === 3) statisticalStep(tk);
    else { deepStep(); foundationStep(); }
    tick(0.1);
    if (origAt === undefined && S.e1.done) origAt = S.t;
    if (symAt === undefined && S.e2.flags.symbolicDone) symAt = S.t;
    if (statAt === undefined && S.maxEra >= 4) statAt = S.t;
    if (S.maxEra >= 4 && deepAt === undefined) { // starvation audit while Deep is the active frontier
      deepTicks++;
      if (S.data < 1) starve.data++; if (S.knowledge < 1) starve.knowledge++;
      if (S.insight < 1) starve.insight++; if (S.silicon < 1) starve.silicon++;
    }
    if (deepAt === undefined && S.maxEra >= 5) deepAt = S.t;
    if (emergeAt === undefined && S.e5.emerged) emergeAt = S.t;
    if (S.e5.ending) { endAt = S.t; break; }
  }
  const mm = s => s === undefined ? '—' : (s / 60).toFixed(1) + 'm';
  console.log('\n  Progression (v3 unified, bot — proves completable, not fun):');
  console.log('    Origins fabricated at ' + mm(origAt));
  console.log('    Symbolic completed at ' + mm(symAt) + (origAt !== undefined && symAt !== undefined ? '  (took ' + ((symAt - origAt) / 60).toFixed(1) + 'm)' : ''));
  console.log('    Statistical generalized at ' + mm(statAt) + (symAt !== undefined && statAt !== undefined ? '  (took ' + ((statAt - symAt) / 60).toFixed(1) + 'm)' : ''));
  console.log('    Deep reached breadth at ' + mm(deepAt) + (statAt !== undefined && deepAt !== undefined ? '  (took ' + ((deepAt - statAt) / 60).toFixed(1) + 'm)' : ''));
  console.log('    EMERGENCE at ' + mm(emergeAt) + (emergeAt !== undefined ? '  (recursion Lv' + S.e5.recursion + ', ' + ERAS[5].acts.agenticCapCount() + ' agentic caps, coherence ' + Math.round(S.e5.coherence) + ', feedback ' + S.e5.fb.rewarded + '✓/' + S.e5.fb.penalized + '✗/' + S.e5.fb.lapsed + ' lapsed)' : ''));
  console.log('    Deep architecture: ' + Object.keys(S.e4.arch).join(', ') + ' · restores ' + (S.e4.restores || 0) + ' · distills ' + (S.e4.distills || 0) + ' · autopilot ' + (S.flags.autopilot ? 'unlocked' : 'no'));
  console.log('    Aftermath → ' + (S.e5.ending || 'UNRESOLVED').toUpperCase() + ' at ' + mm(endAt) + (emergeAt !== undefined && endAt !== undefined ? '  (aftermath ' + ((endAt - emergeAt) / 60).toFixed(1) + 'm)' : ''));
  if (deepTicks) {
    const pc = k => (100 * starve[k] / deepTicks).toFixed(1) + '%';
    console.log('    Deep feedstock starvation (time at ~0): data ' + pc('data') + ' · knowledge ' + pc('knowledge') + ' · insight ' + pc('insight') + ' · silicon ' + pc('silicon'));
  }
  ok(origAt !== undefined, 'progression: Origins completes (fabrication, no stall)');
  ok(symAt !== undefined, 'progression: Symbolic completes (Expert System proven)');
  ok(statAt !== undefined, 'progression: Statistical generalizes and opens Deep');
  ok(deepAt !== undefined, 'progression: Deep reaches breadth on the REAL supply chain (no starvation deadlock)');
  ok(emergeAt !== undefined, 'progression: Foundation reaches emergence');
  ok(endAt !== undefined && !!S.e5.ending, 'progression: aftermath resolves to an ending (' + (S.e5.ending || '?') + ')');
  ok(['marks', 'ore', 'knowledge', 'metal', 'silicon', 'rules', 'inference', 'axioms', 'data', 'insight', 'capability', 'scale'].every(k => isFinite(S[k])), 'progression: no NaN/Infinity at completion');
  if (deepTicks) ok(starve.knowledge / deepTicks < 0.9, 'progression: Knowledge (the scarce Language feedstock) is not starved the whole era');
  ok(S.e5.fb.n > 3 && S.e5.fb.rewarded > 0, 'progression: the bot rated feedback during the climb (the loop is live in a real run)');
  ok(Object.keys(S.e4.arch).length >= 2, 'progression: the bot bought architecture on the real economy');
  ok(finales.length >= 1 && legacy && legacy.runs >= 1, 'progression: the run ends with a finale and writes legacy');
})();

// ============================================================================ summary
console.log('\nv4 test suite');
console.log('  ' + pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('\nFAILURES:'); fails.forEach(function (f) { console.log('  ✗ ' + f); }); process.exit(1); }
console.log('  ✓ all green');
process.exit(0);
