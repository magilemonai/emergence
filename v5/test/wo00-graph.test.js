// WO-00 unit tests: the graph pass and the sim seams the acceptance test only samples.
// Every fixture here is synthetic (no game rules): this file guards the ENGINE, not any stratum.
import { createSim } from '../engine/sim.js';
import { storeFor, passOrder, multOf } from '../engine/graph.js';
import cfg from '../engine/cfg.js';
import voice from '../engine/voice.js';

const port = (res, rate) => ({ res: res, rate: rate });
const node = (id, kind, extra) => Object.assign({
  id: id, era: 1, kind: kind, name: id, inputs: [], outputs: [], count: 0, paused: false,
  pos: { x: 0, y: 0 }, mult: {}, tags: []
}, extra || {});

/** a stratum with two banks feeding one converter that needs BOTH (the upkeep shape from v4 Origins) */
function twoInputEra() {
  return {
    id: 1, name: 'Two', height: 700,
    install(sim) {
      sim.addResource({ id: 'ore', name: 'Ore', hue: '#b98', glyph: 'o', flavor: 'x', era: 1 });
      sim.addResource({ id: 'know', name: 'Know', hue: '#ea3', glyph: 'k', flavor: 'x', era: 1 });
      sim.addResource({ id: 'metal', name: 'Metal', hue: '#ccd', glyph: 'm', flavor: 'x', era: 1 });
      sim.addNode(node('ore.store', 'store', { res: 'ore', count: 1 }));
      sim.addNode(node('know.store', 'store', { res: 'know', count: 1 }));
      sim.addNode(node('metal.store', 'store', { res: 'metal', count: 1 }));
      // 4 ore + 1 know per second, per unit, into 2 metal: upkeep is just a second input port
      sim.addNode(node('smelter', 'converter', {
        inputs: [port('ore', 4), port('know', 1)], outputs: [port('metal', 2)], count: 1,
        cost: { res: 'ore', base: 20, growth: 1.5 }
      }));
      sim.addNode(node('scrap', 'sink', { inputs: [port('metal', 1)], count: 0 }));
    },
    tick() {},
    actions: {
      buy: {
        can(sim, a) { const n = sim.node(a.node); return !!n && !!n.cost && sim.stock(n.cost.res) >= sim.costOf(a.node, a.n || 1); },
        apply(sim, a) { const n = sim.node(a.node); sim.state.stocks[n.cost.res] -= sim.costOf(a.node, a.n || 1); n.count += (a.n || 1); }
      },
      pause: { can(sim, a) { return !!sim.node(a.node); }, apply(sim, a) { sim.node(a.node).paused = !!a.on; } },
      dig: { can() { return true; }, apply(sim) { sim.state.stocks.ore += 1; } },
      rite: { can(sim) { return sim.stock('know') >= 5; }, apply(sim) { sim.state.stocks.know -= 5; } }
    },
    goal(sim) { const p = Math.min(1, sim.stock('metal') / 10); return { progress: p, ready: p >= 1, label: 'ten metal' }; },
    voice(sim) { return sim.stock('metal') > 0 ? 'it holds' : null; },
    layout: { anchors: {}, verbs: ['dig'], goal: 'metal.store' },
    done: () => false
  };
}

export async function run(t) {
  /* ---------- (a) two inputs at different scarcities ---------- */
  let sim = createSim({ cfg: cfg, eras: [twoInputEra()], seed: 5, legacy: null });
  let S = sim.state;
  S.stocks.ore = 1; S.stocks.know = 10;            // ore is the scarce one: 1 of the 2 demanded
  const report = sim.tick(0.5);
  t.ok(report && report.flows === 3, 'tick reports how many pipes carried something');
  t.near(S.stocks.ore, 0, 1e-9, 'scarce input is drawn to empty');
  t.near(S.stocks.know, 10 - 0.25, 1e-9, 'the plentiful input is drawn by the SAME factor (no free lunch)');
  t.near(S.stocks.metal, 0.5, 1e-9, 'output scales by the limiting factor (0.5 of 1 metal)');
  const inOre = S.edges.find(e => e.to === 'smelter' && e.res === 'ore');
  const inKnow = S.edges.find(e => e.to === 'smelter' && e.res === 'know');
  const outMetal = S.edges.find(e => e.from === 'smelter' && e.res === 'metal');
  t.near(inOre.flow, 2, 1e-9, 'edge.flow is per second (1 ore over a 0.5s tick reads 2/s)');
  t.near(inKnow.flow, 0.5, 1e-9, 'the upkeep edge carries its own throttled flow');
  t.near(outMetal.flow, 1, 1e-9, 'the output edge carries the produced flow');
  t.near(sim.rate('metal'), 1, 1e-9, 'sim.rate is the net per second over the last tick');
  t.ok(inOre.riser === false && outMetal.riser === false, 'same-stratum edges are not risers');

  // idle: nothing in the banks, so every pipe reads zero
  S.stocks.ore = 0; S.stocks.know = 0; sim.tick(0.5);
  t.ok(S.edges.every(e => e.flow === 0), 'edge.flow is zero when nothing moves');
  t.near(sim.rate('metal'), 0, 1e-9, 'rates fall back to zero when idle');

  // a sink drains without producing
  S.stocks.metal = 3; sim.node('scrap').count = 1; sim.tick(0.5);
  t.near(S.stocks.metal, 2.5, 1e-9, 'a sink consumes its input and outputs nothing');
  sim.node('scrap').count = 0;

  // tick(0) is a no-op that leaves the state valid
  const before = JSON.stringify(S.stocks); const t0 = S.t;
  sim.tick(0);
  t.ok(JSON.stringify(S.stocks) === before && S.t === t0, 'tick(0) moves nothing and does not advance time');
  // a negative or junk dt is treated as zero
  sim.tick(-3); sim.tick(NaN);
  t.ok(S.t === t0 && isFinite(S.stocks.metal), 'a negative or NaN dt is treated as no time at all');

  /* ---------- multipliers ---------- */
  sim.node('smelter').mult.milestone = 1.25; sim.node('smelter').mult.upgrade = 2;
  t.near(multOf(sim.node('smelter')), 2.5, 1e-9, 'multOf is the product of every named multiplier');
  S.stocks.ore = 100; S.stocks.know = 100; S.stocks.metal = 0;
  sim.tick(0.5);
  t.near(S.stocks.metal, 2 * 2.5 * 0.5, 1e-9, 'effective rate = base × Π mult');
  sim.setMult('smelter', 'milestone', 1); sim.setMult('smelter', 'upgrade', 1);

  /* ---------- pause ---------- */
  sim.apply({ type: 'pause', node: 'smelter', on: true });
  S.stocks.metal = 0; sim.tick(0.5);
  t.near(S.stocks.metal, 0, 1e-9, 'a paused converter moves nothing');
  t.ok(S.edges.every(e => e.flow === 0), 'a paused node draws no flow on its pipes');
  sim.apply({ type: 'pause', node: 'smelter', on: false });

  /* ---------- (d) costOf batches ---------- */
  const expect2 = Math.floor(20 * Math.pow(1.5, 1)) + Math.floor(20 * Math.pow(1.5, 2));
  sim.node('smelter').count = 1;
  t.ok(sim.costOf('smelter', 1) === Math.floor(20 * 1.5), 'costOf: one unit at the current count');
  t.ok(sim.costOf('smelter', 2) === expect2, 'costOf: a batch is the sum of the units it buys');
  t.ok(sim.costOf('smelter', 0) === sim.costOf('smelter', 1), 'costOf: a batch of zero still prices one unit');
  t.ok(sim.costOf('ore.store', 1) === Infinity, 'costOf: a node with no cost can never be afforded');

  /* ---------- (c) available() shape ---------- */
  S.stocks.ore = 10000; S.stocks.know = 0;
  const menu = sim.available();
  t.ok(menu.every(a => typeof a.type === 'string' && a.era === 1), 'available: every entry names a type and an era');
  t.ok(menu.some(a => a.type === 'dig'), 'available: a verb with no target appears once');
  t.ok(!menu.some(a => a.type === 'rite'), 'available: an action that cannot run is left out');
  t.ok(menu.some(a => a.type === 'buy' && a.node === 'smelter' && a.n === 1), 'available: buy is expanded per affordable node');
  t.ok(!menu.some(a => a.type === 'buy' && a.node === 'ore.store'), 'available: a costless node is not buyable');
  t.ok(menu.some(a => a.type === 'pause' && a.node === 'smelter' && a.on === true), 'available: pause offers the toggle for the node');
  t.ok(sim.available(9).length === 0, 'available: an era that is not installed has an empty menu');

  /* ---------- (e) nodeOrder stability ---------- */
  const order0 = S.nodeOrder.slice();
  sim.addNode(node('kiln', 'converter', { inputs: [port('ore', 1)], outputs: [port('know', 1)], count: 0 }));
  t.eq(S.nodeOrder, order0.concat(['kiln']), 'nodeOrder: a new node lands at the end, existing order untouched');
  t.ok(passOrder(S).join() === S.nodeOrder.join(), 'passOrder: one stratum keeps insertion order');
  sim.removeNode('kiln');
  t.eq(S.nodeOrder, order0, 'nodeOrder: removing a node leaves the rest in order');
  t.ok(!S.nodes.kiln && !S.edges.some(e => e.to === 'kiln' || e.from === 'kiln'), 'removeNode drops the node and its edges');
  let threw = false;
  try { sim.addNode(node('smelter', 'converter', {})); } catch (e) { threw = true; }
  t.ok(threw, 'addNode refuses a duplicate id');
  threw = false;
  try { sim.addNode({ id: 'bad', era: 1, kind: 'converter' }); } catch (e) { threw = true; }
  t.ok(threw, 'addNode shape-checks the NodeDef');
  t.ok(storeFor(S, 'metal') === 'metal.store' && storeFor(S, 'nothing') === null, 'storeFor finds the bank of a resource');

  /* ---------- (b) rng determinism ---------- */
  const a1 = createSim({ cfg: cfg, eras: [twoInputEra()], seed: 1234, legacy: null });
  const a2 = createSim({ cfg: cfg, eras: [twoInputEra()], seed: 1234, legacy: null });
  const b1 = createSim({ cfg: cfg, eras: [twoInputEra()], seed: 4321, legacy: null });
  const rolls = (s, n) => { const out = []; for (let i = 0; i < n; i++) out.push(s.rng()); return out; };
  const r1 = rolls(a1, 12), r2 = rolls(a2, 12), r3 = rolls(b1, 12);
  t.eq(r1, r2, 'rng: the same seed gives the same stream');
  t.ok(r1.join() !== r3.join(), 'rng: a different seed gives a different stream');
  t.ok(r1.every(x => x >= 0 && x < 1) && new Set(r1).size === 12, 'rng: values sit in [0,1) and do not repeat over 12 rolls');
  t.ok(a1.state.rng.s !== a1.state.seed && a2.state.rng.s === a1.state.rng.s, 'rng: the stream position lives in state, so a save resumes it');

  /* ---------- replay against a hand-driven run ---------- */
  const live = createSim({ cfg: cfg, eras: [twoInputEra()], seed: 99, legacy: null });
  for (let i = 0; i < 250; i++) {
    if (i % 3 === 0) live.apply({ type: 'dig' });
    if (i === 60) live.apply({ type: 'buy', node: 'smelter', n: 1 });
    if (i === 120) live.apply({ type: 'pause', node: 'smelter', on: true });
    if (i === 180) live.apply({ type: 'pause', node: 'smelter', on: false });
    live.tick(0.1);
  }
  const rebuilt = live.replay(99, live.state.log, live.state.t);
  const strip = (s) => { const c = JSON.parse(JSON.stringify(s)); delete c.log; return c; };
  t.eq(strip(rebuilt), strip(live.state), 'replay: a fresh sim on the same seed and log lands on the same state');
  t.ok(rebuilt.log.length === live.state.log.length, 'replay: the rebuilt run logs the same number of actions');
  const partial = live.replay(99, live.state.log, 5);
  t.ok(partial.t >= 5 && partial.t < live.state.t, 'replay: until stops the rebuild early');
  t.ok(partial.log.every(a => a.t <= partial.t), 'replay: no action from the future is applied');

  /* ---------- snapshot / restore keeps identity ---------- */
  const snap = live.snapshot();
  const held = live.state;
  live.state.stocks.ore += 500; live.tick(0.1);
  live.restore(snap);
  t.ok(live.state === held, 'restore mutates the same state object, so held references stay live');
  t.eq(strip(live.state), strip(snap), 'restore round-trips every field');
  live.state.stocks.ore = 7;
  t.ok(snap.stocks.ore !== 7, 'snapshot is a deep copy, not a view');

  /* ---------- rejected actions ---------- */
  const r = live.apply({ type: 'rite' });
  t.ok(r.ok === false && typeof r.reason === 'string', 'apply: a blocked action reports why');
  const lenBefore = live.state.log.length;
  live.apply({ type: 'nosuch' }); live.apply(null); live.apply({});
  t.ok(live.state.log.length === lenBefore, 'apply: nothing that failed is written to the log');
  t.ok(live.can({ type: 'dig' }) === true && live.can({ type: 'nosuch' }) === false, 'can: pure lookup, no mutation');

  /* ---------- goal + voice + mute ---------- */
  live.state.stocks.metal = 5;
  t.near(live.goal(1).progress, 0.5, 1e-9, 'goal reads the era module');
  t.ok(live.goal(1).ready === false && live.goal(9).label === '', 'goal of an uninstalled era is an empty meter');
  t.ok(live.voice(1) === 'it holds', 'voice returns the era line');
  live.state.stocks.metal = 0;
  t.ok(live.voice(1) === null, 'voice returns null when the machine has nothing to say');
  t.ok(live.muted() === false && live.setMuted(true) === true && live.muted() === true, 'mute flag round-trips');
  live.setMuted(false);

  /* ---------- cfg + voice shape ---------- */
  t.ok(cfg.tickMax === 0.5 && [1, 2, 3, 4, 5, 6].every(n => cfg['e' + n] && typeof cfg['e' + n] === 'object'), 'cfg: tickMax plus a block per stratum');
  t.ok([1, 2, 3, 4, 5, 6].every(n => Array.isArray(voice[n])), 'voice: a line table per stratum');
}
