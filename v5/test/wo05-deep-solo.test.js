// WO-05: the acceptance criteria of wo05-deep.test.js, run over the eras that exist in this branch
// ([origins, deep]) so the Deep stratum is provable before WO-03/04 merge. Same assertions, plus the
// pieces the chained test cannot reach: the port rates, the fed bonus, heat throttling and the guards.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import deep, { needOf, fedLevel, computeRate, holdOn, holdBurn, supplyDef, supplyCost, lockCost } from '../engine/eras/deep.js';

const ERAS = [origins, deep];
function mk(seed = 3) {
  const sim = createSim({ cfg, eras: ERAS, seed, legacy: null });
  const S = sim.state;
  S.stocks.knowledge = 100; S.stocks.silicon = 2000;
  sim.openEra(4);
  return sim;
}

export async function run(t) {
  let sim = mk(); let S = sim.state, E = S.eras[4];
  t.ok(S.nodes['node'] && S.nodes['run.vision'] && S.nodes['run.language'] && S.nodes['run.reasoning'], 'deep installs compute nodes + three run sinks');
  t.ok(S.edges.find(e => e.to === 'run.vision' && e.res === 'data' && e.riser) && S.edges.find(e => e.to === 'run.language' && e.res === 'knowledge' && e.riser) && S.edges.find(e => e.to === 'run.reasoning' && e.res === 'insight' && e.riser), 'each run draws its feedstock through a riser');
  t.ok(S.nodes.node.count >= cfg.e4.seedNodes, 'open() seeds nodes');
  t.ok(S.nodes['capability.store'] && S.nodes['capability.store'].era === 4, 'capability banks in its own stratum');

  // steering
  S.stocks.data = 1e6; S.stocks.insight = 1e6; S.stocks.knowledge = 1e6;
  const v0 = E.vision;
  sim.apply({ type: 'alloc', vision: 0.6, language: 0.2, reasoning: 0.2 });
  for (let i = 0; i < 50; i++) sim.tick(0.1);
  t.ok(E.vision > v0 && S.stocks.capability > 0, 'compute + feed raise a run and accrue Capability');
  t.ok(S.edges.find(e => e.to === 'run.vision').flow > S.edges.find(e => e.to === 'run.language').flow, 'the riser flow follows the allocation share');
  t.near(needOf(sim, 'vision'), 0.6 * computeRate(sim) * cfg.e4.feedPerShare, 0.02, 'the port rate is share x compute x feedPerShare');
  t.ok(E.vision > E.language && E.language > 0, 'the run you feed most climbs fastest');

  // geometry
  S.stocks.capability = 1e4;
  t.ok(sim.apply({ type: 'arch', id: 'attention' }).ok && E.arch.attention, 'buy Attention');
  const g = deep.geom(sim, 'language');
  t.ok(g.feed < 1 && g.drift < 1, 'Attention lowers Language feed + drift');
  t.ok(!sim.can({ type: 'arch', id: 'attention' }), 'no double buy');
  const nv0 = needOf(sim, 'vision');
  sim.apply({ type: 'arch', id: 'convolution' });
  t.ok(needOf(sim, 'vision') < nv0 && deep.geom(sim, 'vision').gain > 1, 'Convolution halves the Vision draw and lifts its gain');
  t.ok(sim.apply({ type: 'arch', id: 'stabilizer' }).ok && E.stabilizer === 1, 'the Stabilizer is the repeatable tier');

  // checkpoint / restore / distill
  sim.apply({ type: 'arch', id: 'checkpoint' });
  E.vision = 0.6; E.language = 0.5; E.reasoning = 0.7;
  sim.apply({ type: 'checkpoint' });
  E.vision = 0.4;
  const c0 = S.stocks.capability;
  t.ok(sim.apply({ type: 'restore' }).ok && E.vision >= 0.6 && S.stocks.capability < c0 && E.restoreCd > 0, 'restore lifts a fallen run, costs, cools');
  t.ok(E.language === 0.5 && E.reasoning === 0.7, 'restore never lowers a run');
  t.ok(!sim.can({ type: 'restore' }), 'restore is on cooldown');
  sim.apply({ type: 'arch', id: 'distill' });
  E.vision = 0.9; E.language = 0.3; E.reasoning = 0.6;
  const br0 = deep.breadth(sim);
  t.ok(sim.apply({ type: 'distill' }).ok && deep.breadth(sim) > br0, 'distill raises breadth');
  t.ok(E.vision < 0.9 && E.language > 0.3, 'distill moves points from the peak run to the lagging one');

  // locks
  S.stocks.capability = 1e4;
  const lc = lockCost(sim);
  t.ok(sim.apply({ type: 'lock', run: 'vision' }).ok && E.locks.vision > 0 && S.stocks.capability === 1e4 - lc, 'a run can be frozen for Capability');
  t.ok(needOf(sim, 'vision') === 0, 'a locked run draws nothing');

  // hold reaches into Origins
  t.ok(sim.apply({ type: 'hold', on: true }).ok && S.nodes.smelter.paused && S.nodes.foundry.paused, 'hold pauses the Origins crafts (real nodes)');
  t.ok(holdOn(sim) && holdBurn(sim) === 0, 'held crafts burn no Knowledge');
  sim.apply({ type: 'hold', on: false });
  t.ok(!holdOn(sim), 'hold releases');

  // supply builds real upstream nodes
  const f0 = S.nodes.foundry.count;
  S.stocks.silicon = 1e6;
  const sup = supplyDef(sim, 'foundry'), price = supplyCost(sim, sup, 1);
  t.ok(sim.apply({ type: 'supply', key: 'foundry' }).ok && S.nodes.foundry.count === f0 + 1, 'supply builds a real Origins foundry from Deep');
  t.ok(S.stocks.silicon === 1e6 - price, 'the build-here buy is paid in Silicon');
  const sc0 = S.nodes.scriptorium.count;
  sim.apply({ type: 'supply', key: 'scriptorium' });
  t.ok(S.nodes.scriptorium.count === sc0 + 1 && S.nodes.scribe.count > 0, 'supply scriptorium arrives staffed');
  t.ok(!sim.can({ type: 'supply', key: 'dataset' }), 'a supply key with no node on the board is refused');

  // the fed bonus: a full tank learns faster than a dry one
  sim = mk(11); S = sim.state; E = S.eras[4];
  sim.apply({ type: 'alloc', vision: 1, language: 1, reasoning: 1 });
  S.stocks.data = 1e6;
  for (let i = 0; i < 20; i++) sim.tick(0.1);
  t.near(fedLevel(sim, 'vision'), 1, 0.001, 'a full tank reads fed');
  const fat = E.vision;
  sim = mk(11); S = sim.state; E = S.eras[4];
  sim.apply({ type: 'alloc', vision: 1, language: 1, reasoning: 1 });
  S.stocks.data = 0.4;
  for (let i = 0; i < 20; i++) sim.tick(0.1);
  t.ok(E.vision < fat && S.edges.find(e => e.to === 'run.vision').starved, 'a starving run learns slower and its riser is starved');

  // heat: concentrate and the fabric throttles
  sim = mk(13); S = sim.state; E = S.eras[4];
  S.stocks.data = 1e6; S.stocks.insight = 1e6; S.stocks.knowledge = 1e6;
  sim.apply({ type: 'alloc', vision: 1, language: 0.05, reasoning: 0.05 });
  for (let i = 0; i < 400; i++) sim.tick(0.1);
  t.ok(E.heat > cfg.e4.heatWarn, 'concentrating heats the fabric');
  sim.apply({ type: 'alloc', vision: 1, language: 1, reasoning: 1 });
  for (let i = 0; i < 800; i++) sim.tick(0.1);
  t.ok(E.heat === 0, 'easing toward balanced cools it');

  // the odd line: once, live, at >= 60% breadth
  sim = mk(5); S = sim.state; E = S.eras[4];
  E.vision = 0.7; E.language = 0.7; E.reasoning = 0.7;
  S.stocks.data = 1e6; S.stocks.insight = 1e6; S.stocks.knowledge = 1e6; E.eventT = 100;
  sim.setMuted(true);
  for (let i = 0; i < 20; i++) sim.tick(0.1);
  sim.setMuted(false);
  t.ok(!S.flags.oddWind, 'the odd line never fires muted');
  for (let i = 0; i < 20; i++) sim.tick(0.1);
  const at = S.flags.oddWind;
  t.ok(!!at && typeof sim.voice(4) === 'string', 'the odd line fires once, live, and voice(4) returns it');
  for (let i = 0; i < 200; i++) sim.tick(0.1);
  t.ok(S.flags.oddWind === at && sim.voice(4) === null, 'it fires once and then goes quiet');

  // the weather is telegraphed before it lands, and only while live
  sim = mk(7); S = sim.state; E = S.eras[4];
  S.stocks.data = 1e6; S.stocks.insight = 1e6; S.stocks.knowledge = 1e6;
  let warned = false;
  for (let i = 0; i < 200 && !E.event; i++) { sim.tick(0.1); if (E.eventNext) warned = true; }
  t.ok(warned && !!E.event, 'an event is telegraphed before it arrives');
  const ev = E.event.type;
  for (let i = 0; i < 400 && E.event; i++) sim.tick(0.1);
  t.ok(!E.event && (ev === 'shift' || ev === 'breakthrough'), 'it passes');

  // passive guard: balanced play with infinite feed does NOT reach the gate in 9 minutes
  sim = mk(9); S = sim.state; E = S.eras[4];
  S.nodes.node.count = 16;
  S.stocks.data = 1e9; S.stocks.insight = 1e9; S.stocks.knowledge = 1e9; S.stocks.silicon = 1e9;
  sim.apply({ type: 'alloc', vision: 1 / 3, language: 1 / 3, reasoning: 1 / 3 });
  for (let i = 0; i < 5400; i++) sim.tick(0.1);
  t.ok(deep.breadth(sim) < cfg.e4.breadthGate, 'passive balanced play does not reach the gate in 9m (steering stays mandatory)');
  t.ok(deep.breadth(sim) > 0.3, 'passive play still climbs, so the gate reads as reachable');

  // advance
  E.vision = 0.9; E.language = 0.9; E.reasoning = 0.9;
  t.ok(sim.can({ type: 'advance' }) && sim.apply({ type: 'advance' }).ok && deep.done(sim), 'advance at the breadth gate');
  t.ok(deep.layout && deep.layout.verbs.includes('buyNode') && deep.height === 700, 'layout declared');

  // determinism: the same seed and the same actions land on the same state
  const play = (seed) => {
    const s2 = mk(seed), st = s2.state;
    st.stocks.data = 1e5; st.stocks.insight = 1e5; st.stocks.knowledge = 1e5; st.stocks.capability = 4000;
    s2.apply({ type: 'alloc', vision: 0.5, language: 0.3, reasoning: 0.2 });
    for (let i = 0; i < 40; i++) s2.tick(0.1);
    s2.apply({ type: 'arch', id: 'moe' });
    for (let i = 0; i < 40; i++) s2.tick(0.1);
    return JSON.stringify(st.eras[4]);
  };
  t.eq(play(21), play(21), 'two runs of the same actions are byte identical');
  t.ok(JSON.parse(play(21)).arch.moe === true, 'era state is JSON safe');
}
