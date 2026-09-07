// WO-00 unit tests: the seams between strata (risers, the handoff, offline catch-up) and the exact dt rule.
// Synthetic strata only; the real reach-back arrives with the era orders.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';

const port = (res, rate) => ({ res: res, rate: rate });
const node = (id, era, kind, extra) => Object.assign({
  id: id, era: era, kind: kind, name: id, inputs: [], outputs: [], count: 0, paused: false,
  pos: { x: 0, y: 0 }, mult: {}, tags: []
}, extra || {});

function strata() {
  const buy = {
    can(sim, a) { const n = sim.node(a.node); return !!n && !!n.cost && sim.stock(n.cost.res) >= sim.costOf(a.node, a.n || 1); },
    apply(sim, a) { const n = sim.node(a.node); sim.state.stocks[n.cost.res] -= sim.costOf(a.node, a.n || 1); n.count += (a.n || 1); }
  };
  const lower = {
    id: 1, name: 'Lower', height: 700,
    install(sim) {
      sim.addResource({ id: 'stone', name: 'Stone', hue: '#c9a', glyph: 's', flavor: 'x', era: 1 });
      sim.addNode(node('stone.store', 1, 'store', { res: 'stone', count: 1 }));
      sim.addNode(node('quarry', 1, 'source', { outputs: [port('stone', 2)], count: 1, cost: { res: 'stone', base: 5, growth: 2 } }));
    },
    tick() {},
    actions: { buy: buy },
    goal(sim) { return { progress: Math.min(1, sim.stock('stone') / 20), ready: sim.stock('stone') >= 20, label: 'stone' }; },
    layout: { anchors: {}, verbs: [], goal: 'stone.store' }, done: () => false
  };
  const upper = {
    id: 2, name: 'Upper', height: 700,
    install(sim) {
      sim.addResource({ id: 'glass', name: 'Glass', hue: '#7ef', glyph: 'g', flavor: 'x', era: 2 });
      sim.addNode(node('glass.store', 2, 'store', { res: 'glass', count: 1 }));
      // draws stone from the stratum below and sends a tithe of stone back down: two risers, both directions
      sim.addNode(node('kiln', 2, 'converter', { inputs: [port('stone', 2)], outputs: [port('glass', 1)], count: 0, cost: { res: 'glass', base: 4, growth: 2 } }));
      sim.addNode(node('tithe', 2, 'source', { outputs: [port('stone', 0.5)], count: 0 }));
    },
    open(sim) { sim.state.eras[2].opened = (sim.state.eras[2].opened || 0) + 1; sim.state.stocks.glass += 3; },
    tick(sim, dt) {
      if (sim.muted()) return;                       // live-only: the weather does not run while catching up
      sim.state.eras[2].weather = (sim.state.eras[2].weather || 0) + sim.rng() * dt;
    },
    actions: { buy: buy },
    goal(sim) { return { progress: Math.min(1, sim.stock('glass') / 10), ready: false, label: 'glass' }; },
    layout: { anchors: {}, verbs: [], goal: 'glass.store' }, done: () => false
  };
  return [lower, upper];
}

export async function run(t) {
  let sim = createSim({ cfg: cfg, eras: strata(), seed: 11, legacy: null });
  const S = sim.state;
  t.ok(S.era === 1 && S.maxEra === 1 && !S.nodes.kiln, 'only the bottom stratum is installed at the start');
  t.ok(S.eras[1] && !S.eras[2], 'era state exists for the installed stratum only');

  /* ---------- the handoff ---------- */
  sim.openEra(2);
  t.ok(S.era === 2 && S.maxEra === 2 && !!S.nodes.kiln, 'openEra installs the stratum above');
  t.ok(S.eras[2].opened === 1 && S.stocks.glass === 3, 'open() runs once and seeds the carried resource');
  sim.openEra(1); sim.openEra(2);
  t.ok(S.eras[2].opened === 1 && S.stocks.glass === 3, 'returning to a stratum does not seed it twice');
  t.ok(S.era === 2 && S.maxEra === 2, 'maxEra remembers the deepest stratum reached');
  t.ok(sim.openEra(4) === false && S.era === 2, 'openEra of a stratum with no module is refused');

  /* ---------- risers ---------- */
  const up = S.edges.find(e => e.to === 'kiln' && e.res === 'stone');
  const down = S.edges.find(e => e.from === 'tithe' && e.res === 'stone');
  const flat = S.edges.find(e => e.from === 'kiln' && e.res === 'glass');
  t.ok(up && up.from === 'stone.store' && up.riser === true, 'an input drawn from the stratum below is a riser');
  t.ok(down && down.to === 'stone.store' && down.riser === true, 'an output banked below is a riser too');
  t.ok(flat && flat.riser === false, 'a flow that stays inside its stratum is not a riser');
  t.ok(S.edges.filter(e => e.to === 'kiln' && e.res === 'stone').length === 1, 'each port derives exactly one edge');

  /* ---------- cross-stratum action (the reach-back) ---------- */
  S.stocks.stone = 100;
  t.ok(sim.apply({ type: 'buy', era: 1, node: 'quarry', n: 2 }).ok && sim.node('quarry').count === 3, 'an action can name a lower stratum: build there from up here');
  t.ok(S.era === 2, 'a reach-back does not move the player');
  S.stocks.glass = 100; sim.apply({ type: 'buy', node: 'kiln', n: 1 });
  S.stocks.stone = 100; S.stocks.glass = 0;
  sim.tick(0.5);
  t.near(S.stocks.glass, 0.5, 1e-9, 'the upper converter runs on the lower stratum bank');
  t.near(up.flow, 2, 1e-9, 'the riser carries the flow the renderer will draw as particles');

  /* ---------- the dt rule, exactly ---------- */
  const long = sim.snapshot();
  S.stocks.stone = 1000; S.stocks.glass = 0;
  sim.tick(5);
  const afterLong = S.stocks.glass;
  sim.restore(long);
  S.stocks.stone = 1000; S.stocks.glass = 0;
  sim.tick(cfg.tickMax);
  t.near(afterLong, S.stocks.glass, 1e-12, 'a huge dt is clamped to tickMax: tick(5) does exactly what tick(0.5) does');
  sim.restore(long);

  /* ---------- a starved converter keeps running at a reduced factor (no stutter) ---------- */
  const starve = createSim({ cfg: cfg, eras: strata(), seed: 3, legacy: null });
  starve.openEra(2);
  starve.state.stocks.glass = 100; starve.apply({ type: 'buy', node: 'kiln', n: 1 });
  starve.node('quarry').count = 1;                    // 2 stone/s in, the kiln wants 2/s: it is exactly fed
  starve.state.stocks.stone = 0; starve.state.stocks.glass = 0;
  const made = [];
  for (let i = 0; i < 4; i++) { starve.tick(0.1); made.push(starve.state.stocks.glass); }
  t.ok(made.every((g, i) => g > (i ? made[i - 1] : 0)), 'a converter fed exactly to its demand produces every tick');
  t.near(starve.state.stocks.glass, 0.4, 1e-9, 'throughput matches the feed: no crumbs lost, no free lunch');

  /* ---------- offline catch-up ---------- */
  const live = createSim({ cfg: cfg, eras: strata(), seed: 21, legacy: null });
  live.openEra(2);
  live.state.stocks.stone = 500; live.state.stocks.glass = 100;
  live.apply({ type: 'buy', node: 'kiln', n: 1 });
  const away = live.snapshot();
  live.setMuted(true);
  for (let i = 0; i < 100; i++) live.tick(0.1);
  t.ok(live.state.eras[2].weather === undefined, 'muted: the live-only system never ran');
  t.ok(live.state.stocks.glass > 100 && live.state.rng.s === away.rng.s, 'muted: the economy caught up and the rng did not move');
  live.setMuted(false);
  live.tick(0.1);
  t.ok(live.state.eras[2].weather > 0 && live.state.rng.s !== away.rng.s, 'the live system wakes on the first unmuted tick');

  /* ---------- replay across the handoff, with rng in play ---------- */
  const run1 = createSim({ cfg: cfg, eras: strata(), seed: 77, legacy: null });
  for (let i = 0; i < 200; i++) {
    if (i === 40) run1.state.stocks.stone += 0;       // no hidden grants: replay only knows the log
    if (i % 20 === 0 && run1.can({ type: 'buy', era: 1, node: 'quarry', n: 1 })) run1.apply({ type: 'buy', era: 1, node: 'quarry', n: 1 });
    if (i === 90) run1.openEra(2);
    run1.tick(0.1);
  }
  t.ok(run1.state.era === 2 && run1.state.eras[2].weather > 0, 'the run reached the upper stratum and its weather ran');
  const rebuilt = run1.replay(77, run1.state.log, run1.state.t);
  t.ok(rebuilt.era === 1, 'replay only replays actions: an openEra outside the log is not repeated');
  const back = createSim({ cfg: cfg, eras: strata(), seed: 77, legacy: null });
  t.ok(back.state.rng.s === 77, 'a fresh sim starts its stream at the seed');

  /* ---------- two sims, same seed and inputs, same run ---------- */
  const twin = (seed) => {
    const s = createSim({ cfg: cfg, eras: strata(), seed: seed, legacy: null });
    s.openEra(2);
    for (let i = 0; i < 120; i++) { if (i % 10 === 0) s.state.stocks.stone += 3; s.tick(0.1); }
    return JSON.stringify(s.state);
  };
  t.ok(twin(5) === twin(5), 'the same seed and the same inputs give a byte-identical run');
  t.ok(twin(5) !== twin(6), 'a different seed gives a different run');
}
