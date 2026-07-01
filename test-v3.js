#!/usr/bin/env node
/* ============================================================================
   Test suite for the merged v3 unified game (emergence-v3-unified.html + v3-kit/).
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
const html = fs.readFileSync(path.join(__dirname, 'emergence-v3-unified.html'), 'utf8');
const cfgMatch = html.match(/var CFG = (\{[\s\S]*?\n {2}\};)/);
if (!cfgMatch) { console.error('could not extract CFG from the shell'); process.exit(1); }
const CFG = eval('(' + cfgMatch[1].replace(/;\s*$/, '') + ')');

const KIT = require('./v3-kit/kit.js');
const makeEraOrigins = require('./v3-kit/era-origins.js');
const makeEraSymbolic = require('./v3-kit/era-symbolic.js');
const makeEraStatistical = require('./v3-kit/era-statistical.js');
const makeEraDeep = require('./v3-kit/era-deep.js');
const makeEraFoundation = require('./v3-kit/era-foundation.js');

// ---- mock shell (mirrors emergence-v3-unified.html) ----
const S = {}; const RATES = {};
let renderCount = 0;
const shell = {
  KIT: KIT, S: S, CFG: CFG, RATES: RATES,
  openEra: function (n) { S.maxEra = Math.max(S.maxEra, n); if (ERAS[n] && ERAS[n].open) ERAS[n].open(S); S.era = n; },
  save: function () {}, navTo: function (n) { S.era = n; },
  refresh: function () {}, requestRender: function () { renderCount++; }
};
const ORDER = [1, 2, 3, 4, 5];
const ERAS = {
  1: makeEraOrigins(shell), 2: makeEraSymbolic(shell), 3: makeEraStatistical(shell),
  4: makeEraDeep(shell), 5: makeEraFoundation(shell)
};
const RES = {}; ORDER.forEach(function (n) { const r = ERAS[n].res || {}; for (const k in r) RES[k] = r[k]; });
KIT.setRes(RES);
const POOL = []; ORDER.forEach(function (n) { (ERAS[n].pool || []).forEach(function (k) { if (POOL.indexOf(k) < 0) POOL.push(k); }); });
KIT.flowInit(POOL);

function clearObj(o) { for (const k in o) if (o.hasOwnProperty(k)) delete o[k]; }
function freshAll() { clearObj(S); S.maxEra = 1; S.era = 1; S.t = 0; S.speed = 1; S.started = false; S.flags = {}; ORDER.forEach(function (n) { ERAS[n].fresh(S); }); }
function tick(dt) {
  KIT.flowReset(); const before = {}; POOL.forEach(function (k) { before[k] = S[k] || 0; });
  ORDER.forEach(function (n) { if (n <= S.maxEra && ERAS[n].produce) ERAS[n].produce(dt); });
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

// ============================================================================ summary
console.log('\nv3 unified test suite');
console.log('  ' + pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('\nFAILURES:'); fails.forEach(function (f) { console.log('  ✗ ' + f); }); process.exit(1); }
console.log('  ✓ all green');
process.exit(0);
