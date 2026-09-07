// WO-04 acceptance: the Statistical stratum. Prediction is computed from the LOG; dwell rule; autopilot; drift.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
export async function run(t) {
  const mk = (seed = 3) => { const sim = createSim({ cfg, eras: [origins, symbolic, statistical], seed, legacy: null }); const S = sim.state; S.stocks.knowledge = 100; sim.openEra(2); S.stocks.silicon = 500; sim.openEra(3); return sim; };
  let sim = mk(); let S = sim.state, E = S.eras[3];
  t.ok(S.era === 3 && S.nodes['dataset'] && S.nodes['model'] && S.nodes['data.store'] && S.nodes['insight.store'], 'statistical installs dataset, model, data + insight stores');
  t.ok(S.edges.find(e => e.to === 'dataset' && e.res === 'silicon' && e.riser), 'Silicon riser from Origins feeds the dataset');
  t.ok(S.nodes.dataset.count >= cfg.e3.seedDatasets, 'open() seeds datasets');
  // trials + focus + policy
  S.stocks.data = 1000; const a0 = E.accuracy; t.ok(sim.apply({ type: 'trial' }).ok && E.accuracy > a0, 'a trial raises accuracy');
  E.gap = 0.3; t.ok(statistical.policy(sim) === 'generalize', 'policy: wide gap → generalize');
  E.gap = 0.02; S.stocks.data = 0; E.survey = 10; t.ok(statistical.policy(sim) === 'explore', 'policy: method out of reach + low survey → explore');
  S.stocks.data = 1e6; t.ok(statistical.policy(sim) === 'fit', 'policy: otherwise fit');
  // prediction from the log with the dwell rule
  E.trials = cfg.e3.predAfter + 10;
  ['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit'].forEach(k => { S.t += 10; sim.apply({ type: 'focus', k }); });
  t.ok(E.predN > 0 && E.predHits > 0, 'the model scores deliberate Focus changes'); t.ok(E.flags.autopilot === true, 'a predictable player unlocks AUTOPILOT');
  t.ok(S.log.filter(a => a.type === 'focus').length >= 12, 'focus changes are in the log (prediction reads the log)');
  sim = mk(4); S = sim.state; E = S.eras[3]; E.trials = cfg.e3.predAfter + 10;
  ['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit'].forEach(k => { S.t += 0.4; sim.apply({ type: 'focus', k }); });
  t.ok(!E.flags.autopilot && (E.predN || 0) === 0, 'twitches under the dwell are not decisions');
  // autopilot resolves per trial
  sim = mk(6); S = sim.state; E = S.eras[3]; E.flags.autopilot = true; sim.apply({ type: 'focus', k: 'auto' }); E.gap = 0.3; S.stocks.data = 100; sim.apply({ type: 'trial' }); t.ok(E.gap < 0.3 && S.flags.autopilotUsed === true, 'under Autopilot a trial resolves to the policy and the use is remembered');
  // drift after shift 2; violet point flag after shift 1
  sim = mk(7); S = sim.state; E = S.eras[3]; E.shifts = 2; E.gap = 0.05; const ph = E.dataPhase || 0; for (let i = 0; i < 100; i++) sim.tick(0.1); t.ok(E.gap > 0.05 && (E.dataPhase || 0) > ph, 'RR6c: the world keeps drifting after shift 2');
  // experiments: fund a method; badge rule = method affordable
  sim = mk(8); S = sim.state; E = S.eras[3]; S.stocks.data = 1e5; t.ok(sim.can({ type: 'fund', kind: 'method' }) && sim.apply({ type: 'fund', kind: 'method' }).ok && Object.keys(E.methods).length === 1, 'fund a method');
  t.ok(sim.apply({ type: 'fund', kind: 'calibrate' }).ok && E.utilLvl.calibrate === 1, 'fund a study');
  // voice lines
  const v = sim.voice(3); t.ok(v === null || v.split(/\s+/).length <= 6, 'voice(3) is ≤ 6 words or null');
  // generalize gate
  E.accuracy = 0.95; E.gap = 0; E.methods.regularization = true; t.ok(sim.can({ type: 'generalize' }) && sim.apply({ type: 'generalize' }).ok && statistical.done(sim), 'generalize at ≥ 88% validation marks the era done');
  t.ok(statistical.layout && statistical.layout.verbs.includes('trial') && statistical.height === 700, 'layout declared');
}
