// scenes/receipt.js — the receipt page at the end of a finished run (WO-12).
// A scene pokes state (dev tooling, never gameplay) and then lets the real sim run. Here it plays a plausible
// arc: the clock is moved to each stratum's start so the log carries real timestamps, real actions are applied
// wherever the module for that stratum exists, and the strata still being built in parallel (Foundation, the
// mirror) get their finished-run fields written directly so the page has something honest to read.
// The mount below is temporary: the receipt is shown by the endcard flow (WO-11) in the real game.

import { createView } from '../render/eras/receipt.js';

/** minute marks the SPEC's pacing targets imply, in seconds: 6 · 6 · 6 · 8 · 8 plus the mirror */
const AT = { symbolic: 372, statistical: 745, deep: 1140, foundation: 1655, end: 2215 };

const grant = (sim, bag) => { for (const k of Object.keys(bag)) sim.state.stocks[k] = bag[k]; };
const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };
const at = (sim, t) => { if (sim.state.t < t) sim.state.t = t; };
/** apply an action up to n times, stopping the moment the era refuses it (or has no such action) */
function times(sim, a, n) {
  let done = 0;
  for (let i = 0; i < n; i++) { if (!sim.can(a)) break; if (!sim.apply(Object.assign({}, a)).ok) break; done++; }
  return done;
}

const ORIGINS_CHAIN = ['tally', 'scribe', 'stoneworking', 'apprenticeship', 'clayTablets', 'kiln',
  'alphabet', 'bronzeCasting', 'wheel', 'numerals', 'theFoundry', 'glassmaking'];

function origins(sim) {
  times(sim, { type: 'inscribe', era: 1 }, 40);
  grant(sim, { marks: 60000, ore: 60000, knowledge: 9000, metal: 9000, silicon: 3000 });
  for (const id of ORIGINS_CHAIN) sim.apply({ type: 'discover', era: 1, id: id });
  sim.apply({ type: 'buy', era: 1, node: 'scribe', n: 24 });
  sim.apply({ type: 'buy', era: 1, node: 'miner', n: 20 });
  sim.apply({ type: 'buy', era: 1, node: 'scriptorium', n: 9 });
  sim.apply({ type: 'buy', era: 1, node: 'smelter', n: 7 });
  sim.apply({ type: 'buy', era: 1, node: 'foundry', n: 5 });
  times(sim, { type: 'inscribe', era: 1 }, 180);
  grant(sim, { marks: 1200, ore: 1600, knowledge: 900, metal: 500, silicon: 1800 });
  run(sim, 1);
}

function symbolic(sim) {
  at(sim, AT.symbolic);
  if (!sim.openEra(2)) return;
  const E = sim.state.eras[2] || {};
  sim.state.stocks.rules = 1e6;
  times(sim, { type: 'aim', era: 2, id: 'formalLogic' }, 1);
  times(sim, { type: 'writeRule', era: 2 }, 96);
  if (E.proofAcc) { for (const k of Object.keys(E.proofAcc)) E.proofAcc[k] = 1e9; }
  run(sim, 1);
  if (E.flags) E.flags.compile = true;
  E.runRules = 4200;
  times(sim, { type: 'compile', era: 2 }, 2);
}

function statistical(sim) {
  at(sim, AT.statistical);
  if (!sim.openEra(3)) return;
  const E = sim.state.eras[3] || {};
  grant(sim, { silicon: 4000, data: 3000, insight: 900 });
  sim.apply({ type: 'buy', era: 3, node: 'dataset', n: 18 });
  sim.apply({ type: 'buy', era: 3, node: 'model', n: 13 });
  for (const k of ['fit', 'generalize', 'explore', 'fit', 'generalize']) times(sim, { type: 'focus', era: 3, k: k }, 1);
  times(sim, { type: 'trial', era: 3 }, 140);
  E.accuracy = Math.max(E.accuracy || 0, 0.89); E.gap = 0.07; E.shifts = Math.max(E.shifts || 0, 2);
  E.trials = Math.max(E.trials || 0, 240);
  if (E.methods) for (const id of ['regression', 'features', 'regularization']) E.methods[id] = true;
  run(sim, 1);
}

function deep(sim) {
  at(sim, AT.deep);
  if (!sim.openEra(4)) return;
  const E = sim.state.eras[4] || {};
  grant(sim, { silicon: 90000, capability: 4000, data: 4000, insight: 2200, knowledge: 4000 });
  sim.apply({ type: 'buy', era: 4, node: 'node', n: 16 });
  for (const id of ['stabilizer', 'attention', 'convolution', 'checkpoint']) times(sim, { type: 'arch', era: 4, id: id }, 1);
  for (const a of [{ vision: 3, language: 1, reasoning: 1 }, { vision: 1, language: 3, reasoning: 1 }, { vision: 1, language: 1, reasoning: 3 }]) {
    times(sim, { type: 'alloc', era: 4, alloc: a }, 1);
  }
  E.vision = 0.82; E.language = 0.74; E.reasoning = 0.79;
  sim.state.stocks.capability = 2600;
  run(sim, 1);
}

/** Foundation and the mirror are being built in parallel: apply what exists, then write the finished-run fields */
function foundation(sim) {
  at(sim, AT.foundation);
  sim.openEra(5);
  const S = sim.state;
  if (!S.eras[5]) S.eras[5] = {};
  const E = S.eras[5];
  if (!E.fb) E.fb = {};
  const fb = E.fb;
  if (!fb.n) { fb.n = 34; fb.rewarded = 21; fb.penalized = 10; fb.lapsed = 3; fb.badRewards = 4; }
  if (typeof E.emergedT !== 'number') E.emergedT = AT.end - 260;
  if (!E.agentName) E.agentName = 'EKHO';
  at(sim, AT.end);
  if (!S.eras[7]) S.eras[7] = {};
  if (!S.eras[7].ending) S.eras[7].ending = 'symbiotic';
  run(sim, 0.5);
}

/** the page mounts itself once app.js has published window.__V5, over the overview the ending pulls out to */
function showPage(sim) {
  const w = typeof window === 'undefined' ? null : window;
  if (!w || !w.requestAnimationFrame) return;
  w.requestAnimationFrame(() => {
    const V = w.__V5; if (!V) return;
    if (V.world && V.world.scene) V.world.scene('overview');
    V.receipt = createView({ hud: V.hud, world: V.world, sim: sim, reduced: false });
  });
}

const RECEIPT_SCENES = {
  // the whole arc, finished: five strata of real numbers under the receipt
  receipt: (sim) => {
    origins(sim); symbolic(sim); statistical(sim); deep(sim); foundation(sim);
    showPage(sim);
  }
};

export default RECEIPT_SCENES;
