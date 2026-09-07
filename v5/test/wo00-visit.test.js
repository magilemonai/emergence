// Fable: the strata jump is a logged action (CONTRACT `visit`), so a human run that goes back to build replays exactly.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';

export async function run(t) {
  const sim = createSim({ cfg, eras: [origins, symbolic, statistical], seed: 2, legacy: null }); const S = sim.state;
  t.ok(!sim.can({ type: 'visit', era: 2 }), 'a closed stratum cannot be visited');
  S.stocks.knowledge = 100; sim.openEra(2); S.stocks.silicon = 500; sim.openEra(3);
  t.ok(S.era === 3 && sim.can({ type: 'visit', era: 1 }) && !sim.can({ type: 'visit', era: 3 }), 'visit: open strata only, never the current one');
  const n0 = S.log.length;
  t.ok(sim.apply({ type: 'visit', era: 1 }).ok && S.era === 1 && S.log.length === n0 + 1 && S.log[n0].type === 'visit' && S.log[n0].era === 1, 'a visit moves the active era and is logged');
  for (let i = 0; i < 20; i++) { if (i % 5 === 0) sim.apply({ type: 'inscribe' }); sim.tick(0.1); }
  t.ok(sim.apply({ type: 'visit', era: 3 }).ok && S.era === 3, 'and back up');
  t.ok(!sim.can({ type: 'visit', era: 9 }) && !sim.apply({ type: 'visit' }).ok, 'no era, or one that is not installed, is refused');
  t.ok(S.maxEra === 3, 'visiting never changes maxEra');
}
