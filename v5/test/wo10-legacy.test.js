// WO-10 acceptance: legacy from a run, applied to a fresh run.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import { fromRun, applyToFresh, LEGACY_KEY } from '../engine/legacy.js';
export async function run(t) {
  const sim = createSim({ cfg, eras: [origins], seed: 9, legacy: null }); const S = sim.state;
  for (let i = 0; i < 700; i++) { if (i % 3 === 0) sim.apply({ type: 'inscribe' }); sim.tick(0.1); }
  S.flags.oddRule = 4471; S.eras[5] = { agentName: 'NOUS', emergedT: 1200 }; S.eras[7] = { ending: 'symbiotic' };
  const L = fromRun(S, null);
  t.ok(L.runs === 1 && L.name === 'NOUS' && L.ending === 'symbiotic' && L.oddRule === 4471 && Array.isArray(L.firstMinute) && L.firstMinute.every(a => a.t <= 60), 'fromRun: name, ending, oddRule, runs, firstMinute');
  const L2 = fromRun(S, L); t.ok(L2.runs === 2, 'fromRun increments runs on a prior legacy');
  t.ok(typeof LEGACY_KEY === 'string' && /emergence_v5/.test(LEGACY_KEY), 'legacy key namespaced to v5');
  const fresh = createSim({ cfg, eras: [origins], seed: 1, legacy: L }); applyToFresh(fresh.state, L);
  t.ok(fresh.state.legacy && fresh.state.legacy.name === 'NOUS' && fresh.state.flags.run2 === true, 'applyToFresh marks a run-2 state with the legacy');
  const first = createSim({ cfg, eras: [origins], seed: 1, legacy: null }); applyToFresh(first.state, null); t.ok(!first.state.flags.run2, 'no legacy → run 1 unchanged');
}
