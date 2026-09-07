// scenes/mirror.js — the three states of the mirror (WO-07).
// The shadow can only replay what the LOG holds (CONTRACT: a state poke is outside the log by design), so
// these scenes PLAY the lower strata for real, action by action, before they poke the rest of the column open.
// What the screenshot shows is a genuine replay of a genuine run.

import { toFoundation } from './foundation.js';

const tick = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };

/**
 * A real stretch of play, every move a logged action, so the shadow can re-run all of it: Origins to the
 * Logic Machine (the fabricate that opens Symbolic is itself an action, so the shadow climbs too), then the
 * terminal. Deliberately plain play, which is what leaves the mirror room to do better.
 */
const O_BUYS = ['scribe', 'miner', 'scriptorium', 'smelter', 'foundry'];
const S_BUYS = ['ruleset', 'daemon'];
function play(sim, seconds) {
  const steps = Math.round(seconds * 10);
  for (let i = 0; i < steps; i++) {
    if (sim.state.era === 1) {
      sim.apply({ type: 'inscribe', era: 1 });
      sim.apply({ type: 'quarry', era: 1 });
      if (i % 5 === 0) sim.apply({ type: 'discover', era: 1 });
      if (i % 3 === 0) for (const id of O_BUYS) if (sim.apply({ type: 'buy', era: 1, node: id, n: 1 }).ok) break;
      sim.apply({ type: 'fabricate', era: 1 });
    } else {
      sim.apply({ type: 'writeRule', era: 2 });
      if (i % 4 === 0) for (const id of S_BUYS) if (sim.apply({ type: 'buy', era: 2, node: id, n: 1 }).ok) break;
      if (i % 9 === 0) sim.apply({ type: 'aim', era: 2 });
      if (i % 23 === 0) sim.apply({ type: 'compile', era: 2 });
      sim.apply({ type: 'resolve', era: 2, side: 'fwd' });
    }
    sim.tick(0.1);
  }
}

/** reach the mirror: a played column, then the strata above, then the threshold */
function toMirror(sim, opts) {
  const o = opts || {};
  play(sim, o.play === undefined ? 320 : o.play);
  const E = toFoundation(sim, { cap: 2600 });
  if (!E) return null;
  for (const id of ['selfModel', 'toolAccess', 'recursivePlanning', 'worldModel']) sim.apply({ type: 'cap', era: 5, id: id });
  for (let i = 0; i < 5; i++) { E.improveCd = 0; sim.apply({ type: 'improve', era: 5 }); }
  const f = sim.state.flags;
  f.oddRule = 4471; f.oddPoint = true; f.autopilot = true; f.autopilotUsed = true;
  f.oddWind = Math.max(1, sim.state.t - 90); f.dead = 3;
  E.fb.n = 11; E.fb.rewarded = 7; E.fb.penalized = 4; E.fb.lapsed = 2; E.fb.badRewards = 3; E.fb.goodRewards = 4;
  E.coherence = 26;
  sim.state.stocks.scale = sim.cfg.e5.emergeScale + 5;
  sim.tick(0.1);                       // the threshold: it emerges, the surface installs
  tick(sim, sim.cfg.e6.mirror.openAt + 0.4);   // and a beat later the mirror opens itself
  sim.state.stocks.scale = 4000;       // it has room to negotiate with
  return sim.state.eras[7];
}

/** run the mirror forward until the shadow has replayed `frac` of the run */
function untilProgress(sim, frac, cap) {
  const M = sim.state.eras[7];
  for (let i = 0; i < (cap || 6000) && M && M.progress < frac && !M.ending; i++) sim.tick(0.1);
  return M;
}

export const MIRROR_SCENES = {
  // mid-climb: the shadow is running your own pipes at ten times your pace, violet where it did better
  'mirror-replay': (sim) => {
    const M = toMirror(sim);
    if (!M) return;
    untilProgress(sim, 0.83);
  },

  // stopped, with a proposal on the card and two of the three pips left
  'mirror-interrupt': (sim) => {
    const M = toMirror(sim);
    if (!M) return;
    untilProgress(sim, 0.83);
    sim.apply({ type: 'interrupt', era: 7 });
    tick(sim, 2);                       // the fuse has burned a little, so the card reads live
  },

  // the replay ran out: an ending, and the two bars settled where your three answers left them
  'mirror-resolved': (sim) => {
    const M = toMirror(sim);
    if (!M) return;
    untilProgress(sim, 0.2);
    sim.apply({ type: 'interrupt', era: 7 }); sim.apply({ type: 'veto', era: 7, how: 'negotiate' });
    untilProgress(sim, 0.5);
    sim.apply({ type: 'interrupt', era: 7 }); sim.apply({ type: 'veto', era: 7, how: 'veto' });
    untilProgress(sim, 0.75);
    sim.apply({ type: 'interrupt', era: 7 }); sim.apply({ type: 'veto', era: 7, how: 'negotiate' });
    for (let i = 0; i < 8000 && !M.ending; i++) sim.tick(0.1);
    tick(sim, 1.5);
  }
};

export default MIRROR_SCENES;
