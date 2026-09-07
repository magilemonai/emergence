// scenes/deep.js — named, seeded states for the Deep stratum (WO-05).
// A scene pokes state (dev tooling, never gameplay) and then lets the real sim run, so a shot shows the
// real fabric at that moment. Each scene opens the strata up to Deep first: the app mounts state.era's view.

const grant = (sim, bag) => { for (const k of Object.keys(bag)) sim.state.stocks[k] = bag[k]; };
const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };

/** climb to Deep through whichever strata are installed; the eras between may not be built yet */
const ORIGINS_CHAIN = ['tally', 'scribe', 'stoneworking', 'apprenticeship', 'clayTablets', 'kiln',
  'alphabet', 'bronzeCasting', 'wheel', 'numerals', 'theFoundry', 'glassmaking'];

function toDeep(sim) {
  grant(sim, { marks: 60000, ore: 60000, knowledge: 9000, metal: 9000, silicon: 3000 });
  for (const id of ORIGINS_CHAIN) sim.apply({ type: 'discover', era: 1, id: id });
  sim.apply({ type: 'buy', era: 1, node: 'scribe', n: 22 });
  sim.apply({ type: 'buy', era: 1, node: 'miner', n: 20 });
  sim.apply({ type: 'buy', era: 1, node: 'scriptorium', n: 8 });
  sim.apply({ type: 'buy', era: 1, node: 'smelter', n: 6 });
  sim.apply({ type: 'buy', era: 1, node: 'foundry', n: 4 });
  grant(sim, { marks: 900, ore: 1400, knowledge: 600, metal: 400, silicon: 1600 });
  sim.openEra(2);
  sim.openEra(3);
  return sim.openEra(4);          // false when this build has no Deep module (a lower-era test harness)
}

/** a fabric with nodes bought, the runs climbing, and every riser wet */
function fabric(sim, opts) {
  const o = opts || {};
  if (!toDeep(sim)) return null;
  const E = sim.state.eras[4];
  sim.node('node').count = o.nodes || 9;
  grant(sim, { data: o.feed || 900, insight: o.feed || 700, knowledge: o.feed || 800, silicon: o.silicon || 900, capability: o.cap || 260 });
  sim.apply({ type: 'supply', era: 4, key: 'foundry', n: 3 });
  sim.apply({ type: 'supply', era: 4, key: 'scriptorium', n: 2 });
  E.vision = o.v === undefined ? 0.44 : o.v;
  E.language = o.l === undefined ? 0.31 : o.l;
  E.reasoning = o.r === undefined ? 0.38 : o.r;
  sim.apply({ type: 'alloc', era: 4, vision: o.av === undefined ? 0.42 : o.av, language: o.al === undefined ? 0.33 : o.al, reasoning: o.ar === undefined ? 0.25 : o.ar });
  E.eventT = o.eventT === undefined ? 40 : o.eventT;
  run(sim, o.run === undefined ? 6 : o.run);
  return E;
}

export const DEEP_SCENES = {
  // the fabric just opened: seeded nodes, three risers wet, nothing bought yet
  'deep-early': (sim) => {
    if (!toDeep(sim)) return;
    grant(sim, { silicon: 420, data: 260, insight: 210, knowledge: 240 });
    sim.state.eras[4].eventT = 40;
    sim.apply({ type: 'alloc', era: 4, vision: 0.4, language: 0.34, reasoning: 0.26 });
    run(sim, 14);
  },

  // a drift squall on the Language run: the strip is red, the corner pulls, the lane reads low
  'deep-squall': (sim) => {
    const E = fabric(sim, { nodes: 12, v: 0.52, l: 0.36, r: 0.47, av: 0.5, al: 0.2, ar: 0.3, eventT: 40 });
    if (!E) return;
    E.event = { type: 'shift', run: 'language' };
    E.eventT = 9;
    E.heat = 38;
    run(sim, 1);
  },

  // both tool rows in view: checkpointing and distillation built, a checkpoint saved, a spread to distill
  'deep-tools': (sim) => {
    const E = fabric(sim, { nodes: 14, cap: 1400, v: 0.61, l: 0.34, r: 0.5 });
    if (!E) return;
    sim.apply({ type: 'arch', era: 4, id: 'checkpoint' });
    sim.apply({ type: 'arch', era: 4, id: 'distill' });
    sim.apply({ type: 'arch', era: 4, id: 'stabilizer' });
    sim.apply({ type: 'checkpoint', era: 4 });
    E.vision = 0.66; E.language = 0.33; E.reasoning = 0.52;
    sim.state.stocks.capability = 780;
    run(sim, 2);
  },

  // the architecture drawer, open over a mid-run fabric (the view opens it from the scene name)
  'deep-architecture': (sim) => {
    if (!fabric(sim, { nodes: 13, cap: 900, v: 0.55, l: 0.4, r: 0.49 })) return;
    sim.apply({ type: 'arch', era: 4, id: 'convolution' });
    run(sim, 2);
  },

  // zoomed out: the column so far, with the Deep risers running through the floors
  'deep-overview': (sim) => { fabric(sim, { nodes: 12 }); }
};

export default DEEP_SCENES;
