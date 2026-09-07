// Edge.starved (pinned after Phase A): set for the tick an input port could not meet its demand; reset each tick.
import { createSim } from '../engine/sim.js';
import { STRATUM_H } from '../engine/types.js';
export async function run(t) {
  const era = { id: 1, name: 's', height: STRATUM_H, install(sim) {
    sim.addResource({ id: 'a', name: 'A', hue: '#fff', glyph: 'a', flavor: 'x', era: 1 }); sim.addResource({ id: 'b', name: 'B', hue: '#fff', glyph: 'b', flavor: 'x', era: 1 }); sim.addResource({ id: 'c', name: 'C', hue: '#fff', glyph: 'c', flavor: 'x', era: 1 });
    ['a', 'b', 'c'].forEach(r => sim.addNode({ id: r + '.store', era: 1, kind: 'store', name: r, res: r, inputs: [], outputs: [], count: 1, paused: false, pos: { x: 0, y: 0 }, mult: {}, tags: [] }));
    sim.addNode({ id: 'cv', era: 1, kind: 'converter', name: 'c', inputs: [{ res: 'a', rate: 1 }, { res: 'b', rate: 1 }], outputs: [{ res: 'c', rate: 1 }], count: 1, paused: false, pos: { x: 0, y: 0 }, mult: {}, tags: [] });
  }, tick() {}, actions: {}, goal() { return { progress: 0, ready: false, label: '' }; }, layout: { anchors: {}, verbs: [], goal: '' }, done: () => false };
  const sim = createSim({ cfg: {}, eras: [era], seed: 1, legacy: null }); const S = sim.state;
  const ea = () => S.edges.find(e => e.to === 'cv' && e.res === 'a'), eb = () => S.edges.find(e => e.to === 'cv' && e.res === 'b');
  S.stocks.a = 10; S.stocks.b = 10; sim.tick(0.5);
  t.ok(ea().starved === false && eb().starved === false, 'both inputs met: no starvation');
  S.stocks.a = 0.1; S.stocks.b = 10; sim.tick(0.5);
  t.ok(ea().starved === true && eb().starved === false, 'only the short input is flagged starved');
  S.stocks.a = 10; sim.tick(0.5);
  t.ok(ea().starved === false, 'starved resets the next tick when the input is met');
}
