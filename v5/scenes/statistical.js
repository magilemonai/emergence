// scenes/statistical.js — named, seeded states for the Statistical stratum (WO-04).
// A scene pokes state directly (dev tooling, never gameplay), then lets the real sim run, so a shot shows the
// real economy at that moment. Every scene opens the eras up to 3 first: the app mounts the view of state.era.

const grant = (sim, bag) => { for (const k of Object.keys(bag)) sim.state.stocks[k] = bag[k]; };
const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };

const ORIGINS_CHAIN = ['tally', 'scribe', 'stoneworking', 'apprenticeship', 'clayTablets', 'kiln',
  'alphabet', 'bronzeCasting', 'wheel', 'numerals', 'theFoundry', 'glassmaking'];

/** the Origins stack the instrument stands on: real Foundries, so the Silicon riser carries real flow */
function bedrock(sim) {
  grant(sim, { marks: 90000, ore: 90000, knowledge: 20000, metal: 20000, silicon: 0 });
  for (const id of ORIGINS_CHAIN) sim.apply({ type: 'discover', era: 1, id: id });
  const build = { scribe: 26, miner: 24, scriptorium: 14, smelter: 11, foundry: 7 };
  for (const k of Object.keys(build)) sim.apply({ type: 'buy', era: 1, node: k, n: build[k] });
  grant(sim, { marks: 2400, ore: 3600, knowledge: 900, metal: 600, silicon: 40 });
  sim.state.eras[1].done = true;
  run(sim, 10);
}

/** open the column up to the instrument; a stratum whose module is not installed yet is skipped cleanly */
function reach(sim) {
  bedrock(sim);
  sim.openEra(2);
  sim.openEra(3);
  return !!sim.node('dataset');
}

/** a working instrument: engines built, trials running, methods coming in. Null when era 3 is not installed. */
function running(sim, opts) {
  const o = opts || {};
  if (!reach(sim)) return null;
  const E = sim.state.eras[3];
  grant(sim, { data: o.data || 900, insight: 260 });
  sim.node('dataset').count = o.datasets || 14;
  sim.node('model').count = o.models || 9;
  E.accuracy = o.acc || 0.42;
  E.gap = o.gap === undefined ? 0.09 : o.gap;
  E.survey = o.survey === undefined ? 34 : o.survey;
  E.trials = o.trials || 60;
  E.focus = o.focus || 'fit';
  for (const m of (o.methods || ['regression'])) E.methods[m] = true;
  run(sim, o.settle === undefined ? 6 : o.settle);
  return E;
}

export const STATISTICAL_SCENES = {
  // early: the instrument just opened, the fit is loose, the first Method is still out of reach
  'stat-early': (sim) => { running(sim, { data: 180, datasets: 6, models: 3, acc: 0.21, gap: 0.05, survey: 12, trials: 18, settle: 4 }); },

  // the world is about to move: accuracy crossed the first trigger, the shift is telegraphed and lands
  'stat-shift': (sim) => {
    const E = running(sim, { data: 1400, datasets: 18, models: 12, acc: 0.54, gap: 0.22, survey: 46, trials: 140, settle: 0, methods: ['regression', 'features'] });
    if (!E) return;
    E.accuracy = sim.cfg.e3.shiftTriggers[0] + 0.01;
    run(sim, sim.cfg.e3.shiftWarn + 2);
  },

  // it called your Focus enough times to earn the fourth one, and you handed it over
  'stat-autopilot': (sim) => {
    const S = sim.state;
    const E = running(sim, { data: 2600, datasets: 22, models: 15, acc: 0.66, gap: 0.18, survey: 58, trials: 200, settle: 0, methods: ['regression', 'features', 'clustering'] });
    if (!E) return;
    E.shifts = 1;
    ['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize'].forEach((k) => { S.t += 9; sim.apply({ type: 'focus', era: 3, k: k }); });
    sim.apply({ type: 'focus', era: 3, k: 'auto' });
    run(sim, 3);
  },

  // after the second shift the data never settles: the points crawl and the drift dot pulses
  'stat-drifting': (sim) => {
    const E = running(sim, { data: 3200, datasets: 26, models: 18, acc: 0.79, gap: 0.14, survey: 70, trials: 320, settle: 0, focus: 'generalize', methods: ['regression', 'features', 'clustering', 'regularization'] });
    if (!E) return;
    E.shifts = 2;
    E.pred = 'fit';
    E.flags.autopilot = true;
    sim.state.flags.oddPoint = true;
    run(sim, 12);
  },

  // zoomed out: the instrument reads as a glowing band in the column
  'stat-overview': (sim) => { running(sim, { data: 2200, datasets: 20, models: 14, acc: 0.7, gap: 0.12, survey: 52, trials: 240 }); }
};

export default STATISTICAL_SCENES;
