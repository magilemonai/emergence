// Fable: the Compute Node's Capability output carries the count milestone, as v4's computeRate did (K.tierMult).
// Found by running the v4 bot policy on both: identical breadth curves, Capability 3574 vs 4504 (= x1.25 at tier 1).
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import statistical from '../engine/eras/statistical.js';
import deep, { breadth } from '../engine/eras/deep.js';

export async function run(t) {
  const mk = () => { const s = createSim({ cfg, eras: [origins, statistical, deep], seed: 5, legacy: null }); s.openEra(2); s.openEra(3); s.openEra(4); return s; };
  const rateWith = (count) => {
    const s = mk(); const S = s.state;
    for (const k of ['data', 'knowledge', 'insight']) S.stocks[k] = 1e9;
    S.nodes.node.count = count;
    const e = S.eras[4]; e.vision = e.language = e.reasoning = 0.5;
    s.tick(0.1);
    return S.nodes.node.outputs[0].rate / breadth(s);   // the runs learn a hair during the tick; normalize
  };
  const r9 = rateWith(9), r10 = rateWith(10), r25 = rateWith(25);
  t.ok(r9 > 0, 'compute nodes emit Capability');
  t.ok(Math.abs(r10 / r9 - 1.25) < 1e-6, 'the x10 milestone multiplies the per-node Capability output by 1.25 (v4 parity)');
  t.ok(Math.abs(r25 / r9 - 1.5) < 1e-6, 'the x25 milestone multiplies it by 1.5');
}
