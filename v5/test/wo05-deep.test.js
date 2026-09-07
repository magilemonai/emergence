// WO-05 acceptance: the Deep stratum. Three runs as sinks fed by risers; geometry; tools; the passive guard.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
import deep from '../engine/eras/deep.js';
export async function run(t) {
  const mk = (seed = 3) => { const sim = createSim({ cfg, eras: [origins, symbolic, statistical, deep], seed, legacy: null }); const S = sim.state; S.stocks.knowledge = 100; sim.openEra(2); S.stocks.silicon = 500; sim.openEra(3); S.stocks.silicon = 2000; sim.openEra(4); return sim; };
  let sim = mk(); let S = sim.state, E = S.eras[4];
  t.ok(S.nodes['node'] && S.nodes['run.vision'] && S.nodes['run.language'] && S.nodes['run.reasoning'], 'deep installs compute nodes + three run sinks');
  t.ok(S.edges.find(e => e.to === 'run.vision' && e.res === 'data' && e.riser) && S.edges.find(e => e.to === 'run.language' && e.res === 'knowledge' && e.riser) && S.edges.find(e => e.to === 'run.reasoning' && e.res === 'insight' && e.riser), 'each run draws its feedstock through a riser');
  t.ok(S.nodes.node.count >= cfg.e4.seedNodes, 'open() seeds nodes');
  // steering: alloc action; runs climb with compute; capability accrues
  S.stocks.data = 1e6; S.stocks.insight = 1e6; S.stocks.knowledge = 1e6; const v0 = E.vision; sim.apply({ type: 'alloc', vision: 0.6, language: 0.2, reasoning: 0.2 }); for (let i = 0; i < 50; i++) sim.tick(0.1);
  t.ok(E.vision > v0 && S.stocks.capability > 0, 'compute + feed raise a run and accrue Capability');
  t.ok(S.edges.find(e => e.to === 'run.vision').flow > S.edges.find(e => e.to === 'run.language').flow, 'the riser flow follows the allocation share');
  // geometry
  S.stocks.capability = 1e4; t.ok(sim.apply({ type: 'arch', id: 'attention' }).ok && E.arch.attention, 'buy Attention'); const g = deep.geom(sim, 'language'); t.ok(g.feed < 1 && g.drift < 1, 'Attention lowers Language feed + drift');
  t.ok(!sim.can({ type: 'arch', id: 'attention' }), 'no double buy');
  // checkpoint / restore / distill
  sim.apply({ type: 'arch', id: 'checkpoint' }); E.vision = 0.6; E.language = 0.5; E.reasoning = 0.7; sim.apply({ type: 'checkpoint' }); E.vision = 0.4; const c0 = S.stocks.capability; t.ok(sim.apply({ type: 'restore' }).ok && E.vision >= 0.6 && S.stocks.capability < c0 && E.restoreCd > 0, 'restore lifts a fallen run, costs, cools');
  sim.apply({ type: 'arch', id: 'distill' }); E.vision = 0.9; E.language = 0.3; E.reasoning = 0.6; const br0 = deep.breadth(sim); t.ok(sim.apply({ type: 'distill' }).ok && deep.breadth(sim) > br0, 'distill raises breadth');
  // hold lever reaches into Origins
  t.ok(sim.apply({ type: 'hold', on: true }).ok && S.nodes.smelter.paused && S.nodes.foundry.paused, 'hold pauses the Origins crafts (real nodes)'); sim.apply({ type: 'hold', on: false });
  // supply builds real upstream nodes
  const f0 = S.nodes.foundry.count; S.stocks.silicon = 1e6; t.ok(sim.apply({ type: 'supply', key: 'foundry' }).ok && S.nodes.foundry.count === f0 + 1, 'supply builds a real Origins foundry from Deep');
  const sc0 = S.nodes.scriptorium.count; sim.apply({ type: 'supply', key: 'scriptorium' }); t.ok(S.nodes.scriptorium.count === sc0 + 1 && S.nodes.scribe.count > 0, 'supply scriptorium arrives staffed');
  // the odd line: once, live, at ≥ 60% breadth
  sim = mk(5); S = sim.state; E = S.eras[4]; E.vision = 0.7; E.language = 0.7; E.reasoning = 0.7; S.stocks.data = 1e6; S.stocks.insight = 1e6; S.stocks.knowledge = 1e6; E.eventT = 100;
  sim.setMuted(true); for (let i = 0; i < 20; i++) sim.tick(0.1); sim.setMuted(false); t.ok(!S.flags.oddWind, 'the odd line never fires muted'); for (let i = 0; i < 20; i++) sim.tick(0.1); t.ok(!!S.flags.oddWind && typeof sim.voice(4) === 'string', 'the odd line fires once, live, and voice(4) returns it');
  // passive guard: balanced play with infinite feed does NOT reach the gate in 9 minutes
  sim = mk(9); S = sim.state; E = S.eras[4]; S.nodes.node.count = 16; S.stocks.data = 1e9; S.stocks.insight = 1e9; S.stocks.knowledge = 1e9; S.stocks.silicon = 1e9; sim.apply({ type: 'alloc', vision: 1 / 3, language: 1 / 3, reasoning: 1 / 3 });
  for (let i = 0; i < 5400; i++) sim.tick(0.1); t.ok(deep.breadth(sim) < cfg.e4.breadthGate, 'passive balanced play does not reach the gate in 9m (steering stays mandatory)');
  // advance
  E.vision = 0.9; E.language = 0.9; E.reasoning = 0.9; t.ok(sim.can({ type: 'advance' }) && sim.apply({ type: 'advance' }).ok && deep.done(sim), 'advance at the breadth gate');
  t.ok(deep.layout && deep.layout.verbs.includes('buyNode') && deep.height === 700, 'layout declared');
}
