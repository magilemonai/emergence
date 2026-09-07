// Sim perf budget (ARCHITECTURE): 2000 ticks of a 60-node graph in well under the frame budget.
import { createSim } from '../engine/sim.js';
import { STRATUM_H } from '../engine/types.js';
export async function run(t) {
  const era = { id: 1, name: 'perf', height: STRATUM_H, install(sim) {
    sim.addResource({ id: 'a', name: 'A', hue: '#fff', glyph: 'a', flavor: 'x', era: 1 }); sim.addResource({ id: 'b', name: 'B', hue: '#fff', glyph: 'b', flavor: 'x', era: 1 });
    sim.addNode({ id: 'a.store', era: 1, kind: 'store', name: 'A', res: 'a', inputs: [], outputs: [], count: 1, paused: false, pos: { x: 0, y: 0 }, mult: {}, tags: [] });
    sim.addNode({ id: 'b.store', era: 1, kind: 'store', name: 'B', res: 'b', inputs: [], outputs: [], count: 1, paused: false, pos: { x: 0, y: 0 }, mult: {}, tags: [] });
    for (let i = 0; i < 30; i++) { sim.addNode({ id: 'src' + i, era: 1, kind: 'source', name: 's', inputs: [], outputs: [{ res: 'a', rate: 1 }], count: 5, paused: false, pos: { x: 0, y: 0 }, mult: {}, tags: [] }); sim.addNode({ id: 'cv' + i, era: 1, kind: 'converter', name: 'c', inputs: [{ res: 'a', rate: 1 }], outputs: [{ res: 'b', rate: 1 }], count: 3, paused: false, pos: { x: 0, y: 0 }, mult: {}, tags: [] }); }
  }, tick() {}, actions: {}, goal() { return { progress: 0, ready: false, label: '' }; }, layout: { anchors: {}, verbs: [], goal: '' }, done: () => false };
  const sim = createSim({ cfg: {}, eras: [era], seed: 1, legacy: null });
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 2000; i++) sim.tick(0.1); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  t.log('2000 ticks × 62 nodes: ' + ms.toFixed(1) + 'ms (' + (ms / 2000).toFixed(3) + 'ms/tick)');
  t.ok(ms / 2000 < 0.5, 'perf: a sim tick of a 60-node graph stays under 0.5ms');
}
