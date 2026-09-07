// WO-00 acceptance: the engine core against engine/CONTRACT.md. Written by the orchestrator BEFORE the work order.
import { createSim } from '../engine/sim.js';
import { STRATUM_H, stratumTop } from '../engine/types.js';

// a synthetic two-stratum era pair used only by this test (no real game rules)
function fixtureEras() {
  const e1 = {
    id: 1, name: 'Bedrock', height: STRATUM_H,
    install(sim) {
      sim.addResource({ id: 'marks', name: 'Marks', hue: '#e6d2a4', glyph: '✎', flavor: 'x', era: 1 });
      sim.addResource({ id: 'know', name: 'Knowledge', hue: '#e0a93f', glyph: '✦', flavor: 'x', era: 1 });
      sim.addNode({ id: 'marks.store', era: 1, kind: 'store', name: 'Marks', res: 'marks', inputs: [], outputs: [], count: 1, paused: false, pos: { x: 300, y: 100 }, mult: {}, tags: [] });
      sim.addNode({ id: 'know.store', era: 1, kind: 'store', name: 'Knowledge', res: 'know', inputs: [], outputs: [], count: 1, paused: false, pos: { x: 700, y: 100 }, mult: {}, tags: [] });
      sim.addNode({ id: 'scribe', era: 1, kind: 'source', name: 'Scribe', inputs: [], outputs: [{ res: 'marks', rate: 1 }], count: 0, paused: false, pos: { x: 300, y: 200 }, cost: { res: 'marks', base: 10, growth: 1.2 }, mult: {}, tags: [] });
      sim.addNode({ id: 'scriptorium', era: 1, kind: 'converter', name: 'Scriptorium', inputs: [{ res: 'marks', rate: 2 }], outputs: [{ res: 'know', rate: 1 }], count: 0, paused: false, pos: { x: 500, y: 100 }, cost: { res: 'marks', base: 40, growth: 1.2 }, mult: {}, tags: [] });
    },
    tick() {},
    actions: {
      inscribe: { can: () => true, apply(sim) { sim.state.stocks.marks += 1; } },
      buy: { can(sim, a) { const n = sim.node(a.node); return !!n && n.cost && sim.stock(n.cost.res) >= sim.costOf(a.node, a.n || 1); }, apply(sim, a) { const n = sim.node(a.node); sim.state.stocks[n.cost.res] -= sim.costOf(a.node, a.n || 1); n.count += (a.n || 1); } },
      pause: { can(sim, a) { return !!sim.node(a.node); }, apply(sim, a) { sim.node(a.node).paused = !!a.on; } }
    },
    goal(sim) { const p = Math.min(1, sim.stock('know') / 50); return { progress: p, ready: p >= 1, label: 'reach 50 knowledge' }; },
    layout: { anchors: {}, verbs: ['inscribe'], goal: 'know.store' }, done: () => false
  };
  const e2 = {
    id: 2, name: 'Above', height: STRATUM_H,
    install(sim) {
      sim.addResource({ id: 'rules', name: 'Rules', hue: '#8dffb7', glyph: '§', flavor: 'x', era: 2 });
      sim.addNode({ id: 'rules.store', era: 2, kind: 'store', name: 'Rules', res: 'rules', inputs: [], outputs: [], count: 1, paused: false, pos: { x: 300, y: 100 }, mult: {}, tags: [] });
      sim.addNode({ id: 'ruleset', era: 2, kind: 'converter', name: 'Ruleset', inputs: [{ res: 'know', rate: 1 }], outputs: [{ res: 'rules', rate: 3 }], count: 0, paused: false, pos: { x: 500, y: 100 }, cost: { res: 'rules', base: 10, growth: 1.1 }, mult: {}, tags: [] });
    },
    open(sim) { sim.state.stocks.rules = (sim.state.stocks.rules || 0) + Math.round(sim.stock('know')); },
    tick(sim, dt) { if (!sim.muted() && sim.rng() < 0.01 * dt) sim.state.eras[2].events = (sim.state.eras[2].events || 0) + 1; },
    actions: { buy: e1.actions.buy, pause: e1.actions.pause },
    goal() { return { progress: 0, ready: false, label: 'x' }; },
    layout: { anchors: {}, verbs: [], goal: 'rules.store' }, done: () => false
  };
  return [e1, e2];
}
const CFG = { tickMax: 0.5 };

export async function run(t) {
  const sim = createSim({ cfg: CFG, eras: fixtureEras(), seed: 42, legacy: null });
  const S = sim.state;
  t.ok(S && S.seed === 42 && S.era === 1 && S.maxEra === 1 && typeof S.t === 'number', 'createSim: state shape + era 1 installed');
  t.ok(S.nodes['marks.store'] && S.nodes['scriptorium'] && !S.nodes['ruleset'], 'only era 1 installed at start');
  t.ok(stratumTop(1) === 4 * STRATUM_H && stratumTop(5) === 0 && stratumTop(6) === -STRATUM_H, 'types: strata stack upward (Origins at the bottom)');
  // edges derived from ports
  const e = S.edges.find(x => x.from === 'marks.store' && x.to === 'scriptorium' && x.res === 'marks');
  t.ok(!!e && S.edges.find(x => x.from === 'scriptorium' && x.to === 'know.store'), 'edges derived: store→converter→store');
  // actions + log
  t.ok(sim.apply({ type: 'inscribe' }).ok && S.stocks.marks === 1 && S.log.length === 1 && typeof S.log[0].t === 'number', 'apply: validates, mutates, logs with t');
  t.ok(!sim.can({ type: 'buy', node: 'scribe' }), 'can: cannot afford a scribe with 1 mark');
  for (let i = 0; i < 20; i++) sim.apply({ type: 'inscribe' });
  t.ok(sim.apply({ type: 'buy', node: 'scribe', n: 1 }).ok && S.nodes.scribe.count === 1 && S.stocks.marks === 11, 'buy: pays unit cost and increments count');
  t.ok(sim.costOf('scribe', 1) === Math.floor(10 * 1.2) && sim.costOf('scribe', 2) === Math.floor(12) + Math.floor(10 * 1.44), 'costOf: geometric, floored per unit, batch sums');
  t.ok(sim.available().some(a => a.type === 'inscribe'), 'available(): lists the era actions that can run');
  // graph tick: source produces; converter limited by input
  for (let i = 0; i < 10; i++) sim.tick(0.1);
  t.near(S.stocks.marks, 12, 1e-9, 'tick: 1 scribe × 1/s × 1s = +1 mark');
  S.stocks.marks = 100; sim.apply({ type: 'buy', node: 'scriptorium', n: 1 }); const m0 = S.stocks.marks;
  sim.tick(0.5);
  t.near(S.stocks.know, 0.5, 1e-9, 'converter: 1 unit × 1 know/s × 0.5s');
  t.near(S.stocks.marks, m0 - 1 + 0.5, 1e-9, 'converter consumed 2 marks/s × 0.5s, scribe added 0.5');
  const edge = S.edges.find(x => x.to === 'scriptorium'); t.near(edge.flow, 2, 1e-9, 'edge.flow reports amount per second moved in the last tick');
  S.stocks.marks = 0.2; sim.tick(0.5);
  t.near(S.stocks.know, 0.5 + 0.35, 1e-6, 'starved converter draws proportionally (0.2 marks + 0.5 from the scribe over the tick → limited)');
  // multipliers
  sim.setMult('scribe', 'milestone', 1.25); S.stocks.marks = 0; sim.tick(1); t.near(S.stocks.marks, 1.25 - 0, 0.02, 'setMult: effective rate = base × Π mult (scriptorium eats what it can)');
  // pause
  sim.apply({ type: 'pause', node: 'scriptorium', on: true }); S.stocks.marks = 0; S.stocks.know = 0; sim.tick(1); t.near(S.stocks.know, 0, 1e-9, 'paused converter produces nothing');
  sim.apply({ type: 'pause', node: 'scriptorium', on: false });
  // dt clamp
  S.stocks.marks = 0; sim.tick(5); t.ok(S.stocks.marks <= 1.25 * 0.5 + 1e-9, 'tick: dt clamped to 0.5');
  // openEra + handoff + risers
  S.stocks.know = 30; sim.openEra(2);
  t.ok(S.era === 2 && S.maxEra === 2 && S.nodes.ruleset && S.stocks.rules === 30, 'openEra installs era 2, calls open() (handoff seeded rules from knowledge)');
  const riser = S.edges.find(x => x.to === 'ruleset' && x.res === 'know'); t.ok(riser && riser.riser === true && riser.from === 'know.store', 'cross-stratum input edge is a riser from the lower store');
  // rng determinism + mute
  const a = sim.rng(), b = sim.rng(); t.ok(a !== b && a >= 0 && a < 1, 'rng: deterministic stream in [0,1)');
  sim.setMuted(true); const ev0 = S.eras[2].events || 0; for (let i = 0; i < 200; i++) sim.tick(0.1); t.ok((S.eras[2].events || 0) === ev0, 'muted(): live-only era systems skip'); sim.setMuted(false);
  // goal + voice
  const g = sim.goal(1); t.ok(g && typeof g.progress === 'number' && typeof g.ready === 'boolean' && typeof g.label === 'string', 'goal(): shape');
  t.ok(sim.voice(1) === null, 'voice(): null when the era has no line');
  // snapshot / restore
  const snap = sim.snapshot(); S.stocks.marks += 999; sim.restore(snap); t.ok(S.stocks.marks !== undefined && sim.state.stocks.marks === snap.stocks.marks, 'snapshot/restore round-trips (and restore keeps sim.state identity or rebinds cleanly)');
  // replay determinism: rebuild from seed + log and compare
  const sim2 = createSim({ cfg: CFG, eras: fixtureEras(), seed: 42, legacy: null });
  for (let i = 0; i < 300; i++) { if (i % 7 === 0) sim2.apply({ type: 'inscribe' }); if (i === 50) { sim2.state.stocks.marks += 100; sim2.apply({ type: 'buy', node: 'scriptorium', n: 1 }); } sim2.tick(0.1); }
  // (the +100 is not an action: replay must reproduce ONLY logged + ticked history) → use a logged grant instead
  const sim3 = createSim({ cfg: CFG, eras: fixtureEras(), seed: 7, legacy: null });
  for (let i = 0; i < 400; i++) { if (i % 5 === 0) sim3.apply({ type: 'inscribe' }); if (i === 100) sim3.apply({ type: 'buy', node: 'scribe', n: 1 }); if (i === 300) sim3.apply({ type: 'buy', node: 'scriptorium', n: 1 }); sim3.tick(0.1); }
  const rebuilt = sim3.replay(7, sim3.state.log, sim3.state.t);
  const strip = (s) => { const c = JSON.parse(JSON.stringify(s)); delete c.log; return c; };
  t.eq(strip(rebuilt), strip(sim3.state), 'replay: seed + log reproduces the state exactly');
  // purity of state (JSON-safe)
  t.ok(JSON.stringify(sim.state).length > 0 && !Object.values(sim.state.nodes).some(n => typeof n === 'function'), 'state is JSON-safe');
}
