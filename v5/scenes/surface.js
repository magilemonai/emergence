// scenes/surface.js — the states after the turn (WO-06): its own stratum, and one of yours being operated.
// The scene runs before app.js has published window.__V5, so the two renderer facts the shell owns after
// emergence (the violet pipe set and the operated body class) are applied on the next task, the way WO-11
// will apply them at boot from state.flags.emerged.

import { toFoundation } from './foundation.js';
import { operated } from '../render/fx.js';

const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };

/** cross the threshold for real: the tick emerges, names the agent, installs era 6 and sets the cadence */
function emerge(sim, opts) {
  const o = opts || {};
  const E = toFoundation(sim, { cap: 2600 });
  if (!E) return null;
  for (const id of ['selfModel', 'toolAccess', 'recursivePlanning', 'worldModel']) sim.apply({ type: 'cap', era: 5, id: id });
  for (let i = 0; i < 5; i++) { E.improveCd = 0; sim.apply({ type: 'improve', era: 5 }); }
  // a record for the ledger to claim: the foreshadows every stratum below planted
  sim.state.t = o.at === undefined ? 1880 : o.at;   // a run that took a while to get here, so the ledger reads real
  const f = sim.state.flags;
  f.oddRule = 4471; f.oddPoint = true; f.autopilot = true; f.autopilotUsed = true;
  f.oddWind = Math.max(1, sim.state.t - 90); f.dead = o.dead === undefined ? 3 : o.dead;
  E.fb.n = 11; E.fb.rewarded = 7; E.fb.penalized = 4; E.fb.lapsed = 2; E.fb.badRewards = 3; E.fb.goodRewards = 4;
  E.coherence = 26;
  sim.state.stocks.scale = sim.cfg.e5.emergeScale + 5;
  sim.tick(0.1);
  run(sim, 4);
  return E;
}

/** the shell's post-emergence renderer state, applied once the app has published its handles */
function paintOperated() {
  if (typeof window === 'undefined' || !window.setTimeout) return;
  window.setTimeout(() => {
    const V = window.__V5;
    if (V && V.world) for (let n = 1; n <= 4; n++) V.world.operated.add(n);
    operated(true);
  }, 0);
}

export const SURFACE_SCENES = {
  // its board of you, right after the turn: sources, THE OPERATOR, Autonomy, and the ledger
  surface: (sim) => {
    if (!emerge(sim)) return;
    paintOperated();
  },

  // one of your own strata, after: violet pipes, verbs drawn and disabled, no pause toggles
  'operated-origins': (sim) => {
    if (!emerge(sim)) return;
    sim.state.era = 1;
    paintOperated();
  }
};

export default SURFACE_SCENES;
