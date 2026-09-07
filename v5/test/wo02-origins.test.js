// WO-02 acceptance: the Origins stratum on the engine. Node ids and action names are fixed by the work order.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
export async function run(t) {
  const mk = (seed = 3) => createSim({ cfg, eras: [origins], seed, legacy: null });
  let sim = mk(); const S = sim.state;
  t.ok(S.era === 1 && S.nodes['marks.store'] && S.nodes['scribe'] && S.nodes['scriptorium'] && S.nodes['foundry'] && S.nodes['logicMachine'], 'origins installs stores, sources, converters and the goal node');
  t.ok(sim.voice(1) === null, 'Origins is silent (voice null)');
  // verbs
  t.ok(sim.apply({ type: 'inscribe' }).ok && S.stocks.marks === cfg.e1.inscribeBase, 'inscribe adds inscribeBase marks');
  t.ok(!sim.can({ type: 'quarry' }), 'quarry is gated until Stoneworking');
  // discoveries gate + effects (tally doubles the hand)
  S.stocks.marks = 100; t.ok(sim.can({ type: 'discover', id: 'tally' }) && sim.apply({ type: 'discover', id: 'tally' }).ok, 'discover tally');
  const m = S.stocks.marks; sim.apply({ type: 'inscribe' }); t.near(S.stocks.marks - m, cfg.e1.inscribeBase * 2, 1e-9, 'tally: inscribing by hand is twice as productive');
  t.ok(!sim.can({ type: 'discover', id: 'kiln' }), 'kiln requires clayTablets (req chain honored)');
  S.stocks.marks = 1000; S.stocks.ore = 1000; S.stocks.knowledge = 1000;
  for (const id of ['scribe', 'stoneworking', 'clayTablets', 'kiln']) sim.apply({ type: 'discover', id });
  t.ok(S.eras[1].disco.kiln && sim.can({ type: 'quarry' }) && S.nodes.smelter && !S.nodes.smelter.locked, 'kiln unlocks the smelter; stoneworking unlocks quarry');
  // economy parity: scriptorium converts marks (+ ore upkeep) → knowledge at v4 rates
  S.stocks.marks = 500; S.stocks.ore = 500; S.stocks.knowledge = 0; sim.apply({ type: 'buy', node: 'scriptorium', n: 2 });
  const k0 = S.stocks.knowledge, o0 = S.stocks.ore; sim.tick(0.5);
  const alpha = S.eras[1].disco.alphabet ? 1.6 : 1;
  t.near(S.stocks.knowledge - k0, 2 * cfg.e1.scriptoriumRate * alpha * 0.5, 0.02, 'scriptorium: 2 units × rate × 0.5s knowledge (v4 parity)');
  t.near(o0 - S.stocks.ore, 2 * cfg.e1.scriptoriumRate * alpha * cfg.e1.scriptoriumUpkeep * 0.5, 0.02, 'scriptorium: ore upkeep drawn as a second input port');
  // starvation: no marks → no knowledge, upkeep not drawn
  S.stocks.marks = 0; const o1 = S.stocks.ore, k1 = S.stocks.knowledge; sim.tick(0.5); t.near(S.stocks.knowledge - k1, 0, 1e-9, 'starved scriptorium makes nothing'); t.near(o1 - S.stocks.ore, 0, 1e-9, 'starved scriptorium draws no upkeep');
  // milestones
  S.stocks.marks = 1e6; sim.apply({ type: 'buy', node: 'scribe', n: 10 }); t.near(S.nodes.scribe.mult.milestone || 1, 1.25, 1e-9, 'ten scribes → milestone ×1.25 multiplier on the node');
  // pause
  sim.apply({ type: 'pause', node: 'scriptorium', on: true }); S.stocks.marks = 100; const k2 = S.stocks.knowledge; sim.tick(0.5); t.near(S.stocks.knowledge, k2, 1e-9, 'pause stops a converter'); sim.apply({ type: 'pause', node: 'scriptorium', on: false });
  // commissions: live only, cooldown, ask uses commMult
  sim = mk(5); const S2 = sim.state; S2.stocks.marks = 1e5; S2.stocks.ore = 1e5; S2.stocks.knowledge = 1e5; ['tally', 'scribe', 'stoneworking', 'clayTablets', 'kiln'].forEach(id => sim.apply({ type: 'discover', id }));
  sim.apply({ type: 'buy', node: 'scribe', n: 5 });
  sim.setMuted(true); for (let i = 0; i < 400; i++) sim.tick(0.1); sim.setMuted(false);
  t.ok(!S2.eras[1].comm, 'commissions never arrive while muted');
  for (let i = 0; i < 400; i++) { sim.tick(0.1); if (S2.eras[1].comm) break; }
  t.ok(!!S2.eras[1].comm && S2.eras[1].comm.need > 0, 'a commission arrives live, with an ask');
  t.ok(sim.can({ type: 'commission', accept: false }) && sim.apply({ type: 'commission', accept: false }).ok && !S2.eras[1].comm, 'declining clears the commission');
  // hands lever + refine are actions
  t.ok(sim.apply({ type: 'hands', lever: 0.2 }).ok && Math.abs(S2.eras[1].lever - 0.2) < 1e-9, 'hands lever is an action');
  S2.stocks.ore = 1e5; t.ok(sim.apply({ type: 'refine' }).ok && S2.eras[1].refine === 1, 'refine is an action that levels');
  // goal + fabricate
  const g = sim.goal(1); t.ok(g.progress >= 0 && g.progress <= 1 && typeof g.label === 'string', 'goal shape');
  t.ok(!sim.can({ type: 'fabricate' }), 'cannot fabricate without silicon');
  ['alphabet', 'numerals', 'theFoundry'].forEach(id => { S2.stocks.knowledge = 1e5; S2.stocks.metal = 1e5; sim.apply({ type: 'discover', id }); });
  S2.stocks.silicon = cfg.e1.siliconGate; t.ok(sim.can({ type: 'fabricate' }) && sim.apply({ type: 'fabricate' }).ok && origins.done(sim), 'fabricate at the silicon gate marks the era done (era 2 opens when its module is installed)');
  // replay determinism with the real era
  const sim3 = mk(11); for (let i = 0; i < 600; i++) { if (i % 3 === 0) sim3.apply({ type: 'inscribe' }); if (i === 30) { sim3.state.stocks.marks += 0; } const av = sim3.available(); const d = av.find(a => a.type === 'discover'); if (d && i % 50 === 0) sim3.apply(d); const b = av.find(a => a.type === 'buy' && a.node === 'scribe'); if (b && i % 20 === 0) sim3.apply(b); sim3.tick(0.1); }
  const rebuilt = sim3.replay(11, sim3.state.log, sim3.state.t); const strip = s => { const c = JSON.parse(JSON.stringify(s)); delete c.log; return c; };
  t.eq(strip(rebuilt), strip(sim3.state), 'Origins replay is byte-identical from seed + log');
  // layout contract for the renderer
  t.ok(origins.layout && origins.layout.anchors.scriptorium && origins.layout.verbs.includes('inscribe') && origins.layout.goal === 'logicMachine', 'layout: anchors, verbs, goal declared');
  t.ok(origins.height === 700, 'stratum height 700');
}
