// scenes/surface.js — the states after the turn (WO-06): its own stratum, and one of yours being operated.
// The two renderer facts that follow emergence (the violet pipe set and the operated body class) are the
// shell's: app.js applies them from state.flags.emerged at boot and on every era switch.

import { toFoundation } from './foundation.js';

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
  run(sim, 0.6);   // the mirror installs at emergedT + mirror.openAt; hold the surface before it
  return E;
}

export const SURFACE_SCENES = {
  // its board of you, right after the turn: sources, THE OPERATOR, Autonomy, and the ledger
  surface: (sim) => { emerge(sim); },

  // one of your own strata, after: violet pipes, verbs drawn and disabled, no pause toggles
  // app.js paints world.operated and body.operated from state.flags.emerged at boot and on every era switch
  'operated-origins': (sim) => {
    if (!emerge(sim)) return;
    sim.state.era = 1;
  }
};

export default SURFACE_SCENES;
