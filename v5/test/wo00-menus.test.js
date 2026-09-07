// Fable: CONTRACT "available() menu": every parameterized action enumerates itself, so a bot or the mirror can play
// the whole board from sim.available() alone (WO-13 found most menus missing).
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
import deep from '../engine/eras/deep.js';

export async function run(t) {
  const sim = createSim({ cfg, eras: [origins, symbolic, statistical, deep], seed: 3, legacy: null }); const S = sim.state;
  for (const k of ['marks', 'ore', 'knowledge', 'metal', 'silicon']) S.stocks[k] = 1e6;
  const types = (n) => new Set(sim.available(n).map(a => a.type));
  const t1 = types(1);
  t.ok(t1.has('discover') && t1.has('hands') && t1.has('refine'), 'Origins: discover / hands / refine enumerate (' + [...t1].join(',') + ')');
  t.ok(sim.available(1).filter(a => a.type === 'discover').every(a => a.id), 'discover entries carry an id');
  S.stocks.knowledge = 1e6; sim.openEra(2); S.stocks.rules = 1e6; S.stocks.inference = 1e6;
  const t2 = types(2);
  t.ok(t2.has('aim') && sim.available(2).filter(a => a.type === 'aim').every(a => a.id), 'Symbolic: aim enumerates theorem ids');
  S.stocks.silicon = 1e6; sim.openEra(3); S.stocks.data = 1e6;
  const t3 = types(3);
  t.ok(t3.has('focus') && t3.has('fund'), 'Statistical: focus / fund enumerate (' + [...t3].join(',') + ')');
  t.ok(sim.available(3).filter(a => a.type === 'fund').some(a => a.kind === 'method'), 'fund enumerates its kinds');
  sim.openEra(4); S.stocks.capability = 1e6; S.stocks.silicon = 1e6;
  const t4 = types(4);
  t.ok(t4.has('alloc') && t4.has('arch') && t4.has('supply') && t4.has('hold'), 'Deep: alloc / arch / supply / hold enumerate (' + [...t4].join(',') + ')');
  const al = sim.available(4).filter(a => a.type === 'alloc'); t.ok(al.length === 4 && al.every(a => sim.can(a)), 'alloc: balanced plus one preset per run, all applicable');
  for (const n of [1, 2, 3, 4]) for (const a of sim.available(n)) t.ok(sim.can(a), 'every enumerated action is applicable: ' + a.type);
}
