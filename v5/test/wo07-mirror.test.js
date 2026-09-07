// WO-07 acceptance: the mirror. A replayer re-applies your log on a shadow state at 10×, a policy improves on it,
// exactly three interrupts, endings from your choices + feedback record. Pinned API in WO-07 "Pure exports".
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
import deep from '../engine/eras/deep.js';
import foundation from '../engine/eras/foundation.js';
import surface from '../engine/eras/surface.js';
import mirror, { createReplayer, endingFor } from '../engine/eras/mirror.js';
export async function run(t) {
  const ERAS = [origins, symbolic, statistical, deep, foundation, surface, mirror];
  const mk = (seed = 3) => createSim({ cfg, eras: ERAS, seed, legacy: null });
  // a short "run": origins actions then a forced emergence
  const sim = mk(5); const S = sim.state;
  for (let i = 0; i < 300; i++) { if (i % 3 === 0) sim.apply({ type: 'inscribe' }); sim.tick(0.1); }
  S.stocks.knowledge = 100; sim.openEra(2); S.stocks.silicon = 500; sim.openEra(3); S.stocks.silicon = 2000; sim.openEra(4); S.eras[4].vision = 0.6; S.eras[4].language = 0.6; S.eras[4].reasoning = 0.6; sim.openEra(5);
  S.stocks.scale = cfg.e5.emergeScale + 5; sim.tick(0.1); t.ok(S.eras[5].emerged && sim.eras[6], 'setup: emerged, surface installed');
  for (let i = 0; i < 15; i++) sim.tick(0.1); t.ok(!!sim.eras[7] && S.eras[7], 'the mirror installs itself about a second after emergence');
  const M = S.eras[7];
  t.ok(typeof M.progress === 'number' && M.interruptsLeft === 3, 'mirror state: progress + three interrupts');
  // the replayer without a policy reproduces the logged state at the same t
  const rp = createReplayer(sim, { policy: null, speed: 10 }); for (let i = 0; i < 40; i++) rp.step(0.1);
  t.ok(rp.shadow && rp.shadow.t > 0 && rp.shadow.t <= S.t, 'replayer: the shadow advances at 10× within the log span');
  const plain = createReplayer(sim, { policy: null, speed: 1e9 }); plain.runToEnd();
  const strip = s => { const c = JSON.parse(JSON.stringify(s)); delete c.log; delete c.eras; return c; };
  t.ok(Math.abs(plain.shadow.stocks.marks - S.stocks.marks) < 1e-6, 'replayer without a policy lands on your marks exactly');
  const smart = createReplayer(sim, { policy: 'improve', speed: 1e9 }); smart.runToEnd();
  t.ok(smart.diff && Object.keys(smart.diff).length >= 1, 'replayer with the policy records where it did better (diff per era)');
  // interrupts
  t.ok(sim.apply({ type: 'interrupt' }).ok && M.interruptsLeft === 2 && !!M.veto, 'interrupt: pauses the replay and opens a proposal');
  t.ok(sim.apply({ type: 'veto', how: 'veto' }).ok && !M.veto, 'veto resolves the proposal');
  sim.apply({ type: 'interrupt' }); sim.apply({ type: 'veto', how: 'approve' }); sim.apply({ type: 'interrupt' }); sim.apply({ type: 'veto', how: 'negotiate' });
  t.ok(M.interruptsLeft === 0 && !sim.can({ type: 'interrupt' }), 'exactly three interrupts');
  // endings from choices + feedback record
  t.ok(endingFor({ control: 90, alignment: 40 }, cfg) === 'contained' && endingFor({ control: 50, alignment: 80 }, cfg) === 'symbiotic' && endingFor({ control: 30, alignment: 30 }, cfg) === 'runaway', 'endingFor maps thresholds');
  for (let i = 0; i < 3000 && !M.ending; i++) sim.tick(0.1);
  t.ok(!!M.ending && ['symbiotic', 'runaway', 'contained'].includes(M.ending), 'the mirror resolves to an ending');
  t.ok(sim.voice(6) === null || typeof sim.voice(6) === 'string', 'voice(6) shape');
  t.ok(mirror.layout && mirror.height === 700, 'mirror layout declared');
}
