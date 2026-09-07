// scenes/foundation.js — named, seeded states for the Foundation stratum (WO-06).
// A scene pokes state (dev tooling, never gameplay) and then lets the real sim run, so a shot shows the
// real ladder at that moment. Each scene climbs the strata below first: app.js mounts state.era's view.

const grant = (sim, bag) => { for (const k of Object.keys(bag)) sim.state.stocks[k] = bag[k]; };
const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };

const ORIGINS_CHAIN = ['tally', 'scribe', 'stoneworking', 'apprenticeship', 'clayTablets', 'kiln',
  'alphabet', 'bronzeCasting', 'wheel', 'numerals', 'theFoundry', 'glassmaking'];

/** climb to Foundation through whichever strata this build has; false when Foundation is not installed */
export function toFoundation(sim, opts) {
  const o = opts || {};
  grant(sim, { marks: 60000, ore: 60000, knowledge: 9000, metal: 9000, silicon: 3000 });
  for (const id of ORIGINS_CHAIN) sim.apply({ type: 'discover', era: 1, id: id });
  sim.apply({ type: 'buy', era: 1, node: 'scribe', n: 22 });
  sim.apply({ type: 'buy', era: 1, node: 'miner', n: 20 });
  sim.apply({ type: 'buy', era: 1, node: 'scriptorium', n: 8 });
  sim.apply({ type: 'buy', era: 1, node: 'smelter', n: 6 });
  sim.apply({ type: 'buy', era: 1, node: 'foundry', n: 5 });
  grant(sim, { marks: 1200, ore: 1600, knowledge: 1400, metal: 500, silicon: 1800 });
  sim.openEra(2);
  sim.openEra(3);
  if (sim.openEra(4)) {
    const e4 = sim.state.eras[4];
    const node = sim.node('node');
    if (node) node.count = o.nodes || 16;
    grant(sim, { data: 1400, insight: 1100, knowledge: 1400, silicon: 1200 });
    e4.vision = o.v === undefined ? 0.82 : o.v;
    e4.language = o.l === undefined ? 0.79 : o.l;
    e4.reasoning = o.r === undefined ? 0.84 : o.r;
    e4.eventT = 40;
    sim.apply({ type: 'alloc', era: 4, vision: 0.34, language: 0.34, reasoning: 0.32 });
  }
  if (!sim.openEra(5)) return null;
  grant(sim, { capability: o.cap === undefined ? 420 : o.cap });
  return sim.state.eras[5];
}

/** a scene that needs the machine mid-sentence: run live until the loop speaks */
function untilOutput(sim, cap) {
  const E = sim.state.eras[5];
  for (let i = 0; i < (cap || 200) && !E.fb.cur; i++) sim.tick(0.1);
  return E.fb.cur;
}

/**
 * The turn is the shell's: app.js exposes window.__V5.rupture(holdMs), which starts the fx and freezes it on
 * that beat. A scene runs before __V5 is published, so poll a few frames for the seam rather than guessing.
 */
function holdRupture(ms) {
  if (typeof window === 'undefined' || !window.requestAnimationFrame) return;
  let tries = 0;
  const wait = () => {
    const V = window.__V5;
    if (V && typeof V.rupture === 'function') { V.rupture(ms); return; }
    if (++tries < 20) window.requestAnimationFrame(wait);
  };
  window.requestAnimationFrame(wait);
}

export const FOUNDATION_SCENES = {
  // the ladder as it opens: RECURSION drinking Capability, the threshold meter barely lit
  'foundation-first': (sim) => {
    if (!toFoundation(sim)) return;
    run(sim, 5);
  },

  // it speaks and you grade it, with the lens built so the trait is readable
  'foundation-feedback': (sim) => {
    const E = toFoundation(sim, { cap: 900 });
    if (!E) return;
    sim.apply({ type: 'cap', era: 5, id: 'interpret' });
    sim.apply({ type: 'improve', era: 5 });
    sim.state.stocks.scale = 300;
    untilOutput(sim);
    run(sim, 1.5);
  },

  // late: the Anomaly is high, the ladder is deep, the threshold is a step away
  'foundation-late': (sim) => {
    const E = toFoundation(sim, { cap: 2600 });
    if (!E) return;
    for (const id of ['selfModel', 'toolAccess', 'interpret', 'recursivePlanning']) sim.apply({ type: 'cap', era: 5, id: id });
    for (let i = 0; i < 5; i++) { E.improveCd = 0; sim.apply({ type: 'improve', era: 5 }); }
    E.coherence = 24;
    sim.state.stocks.scale = sim.cfg.e5.emergeScale - 40;
    sim.state.stocks.capability = 1400;
    untilOutput(sim, 40);
    run(sim, 1);
  },

  // the turn itself: the shell runs the fx (window.__V5.rupture), and we freeze it 0.8s in for the shot
  'rupture-mid': (sim) => {
    const E = toFoundation(sim, { cap: 2600 });
    if (!E) return;
    for (const id of ['selfModel', 'toolAccess', 'recursivePlanning']) sim.apply({ type: 'cap', era: 5, id: id });
    for (let i = 0; i < 4; i++) { E.improveCd = 0; sim.apply({ type: 'improve', era: 5 }); }
    sim.state.flags.oddRule = 4471;
    sim.state.stocks.scale = sim.cfg.e5.emergeScale + 5;
    sim.tick(0.1);                       // the tick crosses the threshold, exactly as it does in play
    holdRupture(800);
  }
};

export default FOUNDATION_SCENES;
