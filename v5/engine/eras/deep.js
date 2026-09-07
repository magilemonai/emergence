// engine/eras/deep.js — Deep, the fourth stratum (WO-05).
// The v4 fabric (v4-kit/era-deep.js) ported onto the graph engine: three training runs are SINK nodes, so
// each one's feedstock arrives as a real riser from the stratum that makes it, and the pipe's particle
// density is the allocation you set. Compute is never banked: it is count x nodeCompute x mult, routed by
// the mixer. Drift, heat, the telegraphed weather, the architecture tree and the two tools are v4's rules.
// Pure: no clock, no randomness (the weather alternates on a fixed cycle, exactly as v4 did).
import { STRATUM_H } from '../types.js';
import VOICE from '../voice/e4.js';

const RESOURCES = [
  { id: 'capability', name: 'Capability', hue: '#6ea8ff', glyph: '◈', flavor: 'What the system can actually do.' }
];
/** resources this stratum drinks but does not introduce: a store is created only if the era below is absent */
const FEED_RES = [
  { id: 'data', name: 'Data', hue: '#54d2ff', glyph: '◈', era: 3, flavor: 'Experience, stored for the machine to study.' },
  { id: 'insight', name: 'Insight', hue: '#6fe6a8', glyph: '◆', era: 3, flavor: 'The pattern beneath the noise.' }
];

/* Stratum-local anchors (CONTRACT: pos is local). The fabric reads left to right along one band: the compute
   node and its Capability bank, then the three furnaces the risers climb into. The instrument that steers
   them is the DOM plate below (render/eras/deep.js), so the band stays clear of it. */
const ANCHORS = {
  node: { x: 260, y: 60 },
  'capability.store': { x: 900, y: 60 },
  'run.vision': { x: 330, y: 200 },
  'run.language': { x: 590, y: 200 },
  'run.reasoning': { x: 850, y: 200 },
  'data.store': { x: 430, y: 560 },
  'insight.store': { x: 850, y: 560 },
  generality: { x: 1150, y: 600 }
};

/** the goal lives in the HUD column; the runs and the compute node are drawn by the fabric instrument */
export const HIDDEN_PLATES = ['generality'];

/** the phase of each run's headwind: three sine waves 120 degrees apart, so balanced is never optimal */
const PHASE = { vision: 0, language: 2.094, reasoning: 4.189 };
export const RUN_HUE = { vision: '#54d2ff', language: '#b58cff', reasoning: '#6fe6a8' };

const E = (sim) => sim.state.eras[4];
const C = (sim) => sim.cfg.e4;
const KEYS = (sim) => C(sim).domains.map((d) => d.k);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ---------- milestones (v4 kit: x10/x25/x50/x100 -> +25% per tier, on that node only) ---------- */
function tierOf(c, count) { let t = 0; for (const m of c.milestones) if (count >= m) t++; return t; }
function tierMult(c, count) { return 1 + c.milestoneBonus * tierOf(c, count); }
export function milestoneOf(sim, node) {
  const c = C(sim);
  if (!node || !node.cost) return null;
  for (const m of c.milestones) if (node.count < m) return { at: m, near: m - node.count <= 3, tiered: tierOf(c, node.count) > 0 };
  return null;
}

/* ---------- rates the whole stratum is derived from ---------- */
/** compute is produced and spent inside one tick, so it is a rate and never a stock */
export function computeRate(sim) {
  const n = sim.node('node');
  if (!n) return 0;
  return n.count * C(sim).nodeCompute * tierMult(C(sim), n.count);
}
export function throttleOf(sim) {
  const c = C(sim), h = E(sim).heat;
  return h >= c.heatThrottle ? c.throttleHot : (h >= c.heatWarn ? c.throttleWarm : 1);
}
export function shareOf(sim, k) {
  const a = E(sim).alloc, keys = KEYS(sim);
  let sum = 0;
  for (const key of keys) sum += a[key] || 0;
  return sum > 0 ? (a[k] || 0) / sum : 0;
}
export function breadth(sim) {
  const e = E(sim);
  return Math.cbrt(Math.max(0, e.vision) * Math.max(0, e.language) * Math.max(0, e.reasoning));
}
/** per-run multipliers the architecture bends: {feed, drift, gain} */
export function geom(sim, k) {
  const c = C(sim), e = E(sim), A = e.arch || {}, g = { feed: 1, drift: 1, gain: 1 };
  if (k === 'language' && A.attention) { g.drift *= c.attentionDrift; g.feed *= c.attentionFeed; }
  if (k === 'vision' && A.convolution) { g.feed *= c.convFeed; g.gain *= c.convGain; }
  if (k === 'reasoning' && A.cot) g.gain *= (1 + c.cotCouple * Math.max(0, e.language || 0));
  return g;
}
/** how many units of feedstock one run wants per second right now (the sink's input port rate) */
export function needOf(sim, k) {
  const c = C(sim), e = E(sim);
  if (e.locks[k] > 0) return 0;
  return shareOf(sim, k) * computeRate(sim) * c.feedPerShare * geom(sim, k).feed;
}
/** 0..1 - seconds of feedstock in hand against the horizon; a well-fed run learns faster */
export function fedLevel(sim, k) {
  const c = C(sim), need = needOf(sim, k);
  if (!(need > 0)) return 0;
  return clamp01((sim.stock(c.feedstock[k]) || 0) / (need * c.fedHorizon));
}
/** the headwind ahead of a run: 0..1, its own phase, optionally at a future offset (the sparkline) */
export function windAt(sim, k, ahead) {
  const c = C(sim), t = sim.state.t + (ahead || 0);
  return 0.5 + 0.5 * Math.sin(t * c.driftFreq + PHASE[k]);
}
/** what a run demands of the allocation right now; above your share, it erodes */
export function demandOf(sim, k, ahead) {
  const c = C(sim), e = E(sim);
  const squall = !!(e.event && e.event.type === 'shift' && e.event.run === k && (ahead || 0) < e.eventT);
  return c.driftDemand * geom(sim, k).drift * windAt(sim, k, ahead) * (squall ? c.shiftDemand : 1);
}
export function driftBite(sim) {
  const c = C(sim);
  return c.driftBite * Math.max(0.35, 1 - E(sim).stabilizer * c.stabilizerCut);
}

/* ---------- the edges the runs drink through ---------- */
function inEdge(sim, id, res) {
  for (const e of sim.state.edges) if (e.to === id && e.res === res) return e;
  return null;
}
/** the ports are rewritten every tick, so the riser a player sees IS the allocation they set */
function restatePorts(sim) {
  for (const k of KEYS(sim)) {
    const n = sim.node('run.' + k);
    if (n && n.inputs[0]) n.inputs[0].rate = needOf(sim, k);
  }
  const src = sim.node('node');
  if (src && src.outputs[0]) {
    const c = C(sim), chain = 1 + c.chainPerFoundry * ((sim.node('foundry') || { count: 0 }).count || 0);
    // v4 parity: the count milestone on Compute Nodes multiplies Capability too (K.tierMult on computeRate)
    src.outputs[0].rate = breadth(sim) * c.nodeCompute * tierMult(c, src.count) * c.capRate * throttleOf(sim) * chain;
  }
}

/* ---------- costs ---------- */
export function stabilizerCost(sim) { const c = C(sim); return Math.round(c.stabilizerCost + E(sim).stabilizer * c.stabilizerStep); }
export function archCost(sim, id) { return id === 'stabilizer' ? stabilizerCost(sim) : C(sim).arch[id]; }
export function archOwned(sim, id) { const c = C(sim), e = E(sim); return id === 'stabilizer' ? e.stabilizer >= c.stabilizerMax : !!e.arch[id]; }
export function lockCost(sim) { const c = C(sim); return Math.round(c.lockCost * Math.pow(c.lockGrowth, E(sim).locksBought || 0)); }
export function restoreCost(sim) { const c = C(sim); return Math.round(c.restoreCost * Math.pow(c.restoreGrowth, E(sim).restores || 0)); }
export function supplyDef(sim, key) { for (const s of C(sim).supply) if (s.key === key) return s; return null; }
export function supplyCount(sim, s) { const n = s && sim.node(s.node); return n ? n.count : 0; }
/** the build-here price: geometric in the producer's own count, floored per unit, paid in Silicon */
export function supplyCost(sim, s, n) {
  const k = Math.max(1, Math.floor(n || 1)), c0 = supplyCount(sim, s);
  let sum = 0;
  for (let i = 0; i < k; i++) sum += Math.floor(s.cost * Math.pow(s.growth, c0 + i));
  return sum;
}
/** what that producer actually puts out per second, so the button never advertises a number it cannot pay */
export function supplyRate(sim, s) {
  const n = s && sim.node(s.node);
  if (!n || !n.outputs.length) return 0;
  let m = 1;
  for (const key of Object.keys(n.mult)) m *= n.mult[key];
  return n.count * n.outputs[0].rate * m;
}
export function holdOn(sim) {
  for (const h of C(sim).holdNodes) { const n = sim.node(h.node); if (!n || !n.paused) return false; }
  return true;
}
/** the Knowledge the crafts burn per second: the pool the Language run drinks from */
export function holdBurn(sim) {
  let burn = 0;
  for (const h of C(sim).holdNodes) {
    const n = sim.node(h.node);
    if (!n || n.paused || n.count <= 0) continue;
    let m = 1;
    for (const key of Object.keys(n.mult)) m *= n.mult[key];
    for (const p of n.inputs) if (p.res === 'knowledge') burn += n.count * p.rate * m;
  }
  return burn;
}
export function hiLo(sim) {
  const keys = KEYS(sim), e = E(sim);
  let hi = keys[0], lo = keys[0];
  for (const k of keys) { if (e[k] > e[hi]) hi = k; if (e[k] < e[lo]) lo = k; }
  return { hi: hi, lo: lo, spread: e[hi] - e[lo] };
}

/* ---------- the tick: feed, learn, erode, heat, weather ---------- */
function runsTick(sim, dt) {
  const c = C(sim), e = E(sim), keys = KEYS(sim);
  const cr = computeRate(sim), throttle = throttleOf(sim);
  if (e.restoreCd > 0) e.restoreCd = Math.max(0, e.restoreCd - dt);
  if (e.distillCd > 0) e.distillCd = Math.max(0, e.distillCd - dt);
  let maxShare = 0;
  for (const k of keys) {
    const share = shareOf(sim, k);
    if (share > maxShare) maxShare = share;
    if (e.locks[k] > 0) { e.locks[k] = Math.max(0, e.locks[k] - dt); continue; }
    const want = needOf(sim, k);
    const edge = inEdge(sim, 'run.' + k, c.feedstock[k]);
    const feedMult = want > 0 ? clamp01((edge ? edge.flow : 0) / want) : 1;
    const shortfall = Math.max(0, demandOf(sim, k, 0) - share);
    e.fedT[k] = shortfall <= 0 ? e.fedT[k] + dt : 0;
    const momentum = e.fedT[k] >= c.momentumAfter ? 0.5 : 1;
    const erode = driftBite(sim) * shortfall * momentum * (0.3 + 0.7 * e[k]) * cr * dt;
    const g = geom(sim, k);
    const evM = (e.event && e.event.run === k && e.event.type === 'breakthrough') ? c.breakthroughMult : 1;
    const fed = 1 + c.fedBonus * fedLevel(sim, k);
    const gain = c.capGain * share * cr * dt * (1 - e[k]) * feedMult * throttle * evM * g.gain * fed;
    e[k] = clamp01(e[k] + gain - erode);
  }
  const conc = Math.max(0, maxShare - c.heatBase);
  const rise = c.heatRise * (e.arch.moe ? c.moeHeat : 1) * conc;
  e.heat = Math.max(0, Math.min(110, e.heat + (rise - c.cooling) * dt));
}

/** the weather is telegraphed and alternates on a fixed cycle: live play only, never during catch-up */
function weatherTick(sim, dt) {
  const c = C(sim), e = E(sim), keys = KEYS(sim);
  e.eventT -= dt;
  if (!e.event && !e.eventNext && e.eventT <= c.eventWarn) {
    const p = hiLo(sim);
    const shift = (Math.floor(sim.state.t / (c.eventGap + c.eventDur)) % 2) === 0;
    e.eventNext = { type: shift ? 'shift' : 'breakthrough', run: shift ? p.hi : p.lo };
  }
  if (e.eventT > 0) return;
  if (e.event) { e.event = null; e.eventT = c.eventGap; return; }
  const nx = e.eventNext || { type: 'shift', run: keys[0] };
  if (nx.type === 'shift') { e.event = { type: 'shift', run: nx.run }; e[nx.run] = Math.max(0, e[nx.run] - c.shiftDrop); }
  else e.event = { type: 'breakthrough', run: nx.run };
  e.eventNext = null;
  e.eventT = c.eventDur;
}

/* ---------- the era module ---------- */
const deep = {
  id: 4,
  name: 'Deep',
  height: STRATUM_H,

  install(sim) {
    const c = C(sim);
    Object.assign(sim.state.eras[4], {
      vision: 0, language: 0, reasoning: 0,
      alloc: { vision: 1, language: 1, reasoning: 1 },
      heat: 0, event: null, eventNext: null, eventT: 12,
      stabilizer: 0, locksBought: 0, locks: { vision: 0, language: 0, reasoning: 0 },
      fedT: { vision: 0, language: 0, reasoning: 0 },
      arch: {}, ckpt: null, restores: 0, restoreCd: 0, distills: 0, distillCd: 0, done: false
    });
    for (const r of RESOURCES) sim.addResource({ id: r.id, name: r.name, hue: r.hue, glyph: r.glyph, icon: null, flavor: r.flavor, era: 4 });

    const base = (id, kind, name) => ({
      id, era: 4, kind, name, inputs: [], outputs: [], count: 0, paused: false,
      pos: { x: ANCHORS[id].x, y: ANCHORS[id].y }, mult: {}, tags: [], locked: false
    });
    const store = base('capability.store', 'store', 'Capability');
    store.res = 'capability'; store.count = 1; store.flavor = RESOURCES[0].flavor;
    sim.addNode(store);

    // a feedstock this run has no bank for yet (its stratum was never installed) still needs somewhere to pool
    for (const r of FEED_RES) {
      if (!sim.state.resources[r.id]) sim.addResource({ id: r.id, name: r.name, hue: r.hue, glyph: r.glyph, icon: null, flavor: r.flavor, era: r.era });
      let has = false;
      for (const id of sim.state.nodeOrder) { const n = sim.state.nodes[id]; if (n.kind === 'store' && n.res === r.id) has = true; }
      if (has) continue;
      const s = base(r.id + '.store', 'store', r.name);
      s.era = r.era; s.res = r.id; s.count = 1; s.flavor = r.flavor;
      sim.addNode(s);
    }

    const node = base('node', 'source', 'Compute Node');
    node.cost = { res: 'silicon', base: c.nodeCost, growth: c.nodeGrowth };
    node.outputs = [{ res: 'capability', rate: 0 }];
    node.flavor = 'Silicon, wired into one fabric.';
    node.mech = 'Compute for the runs. Capability from breadth.';
    sim.addNode(node);

    for (const d of c.domains) {
      const r = base('run.' + d.k, 'sink', d.label + ' run');
      r.count = 1;
      r.inputs = [{ res: c.feedstock[d.k], rate: 0 }];
      r.tags = ['run', d.k];
      r.flavor = 'A training run, drifting on its own wind.';
      r.mech = 'Draws ' + c.feedstock[d.k] + '. Climbs with its share.';
      sim.addNode(r);
    }
    const goal = base('generality', 'goal', 'A generally capable model');
    goal.count = 1; goal.flavor = 'Breadth beats specialization.';
    sim.addNode(goal);
    restatePorts(sim);
  },

  /** the handoff: a fabric with nothing in it steers nothing, so the first nodes and a first tankful arrive */
  open(sim) {
    const c = C(sim), st = sim.state, n = sim.node('node');
    if (n && n.count > 0) return;
    if (n) n.count = c.seedNodes;
    st.stocks.silicon = (st.stocks.silicon || 0) + c.seedSilicon;
    st.stocks.data = (st.stocks.data || 0) + c.seedData;
    st.stocks.insight = (st.stocks.insight || 0) + c.seedInsight;
    st.stocks.knowledge = (st.stocks.knowledge || 0) + c.seedKnowledge;
    const seed = { foundry: c.seedFoundry, scriptorium: c.seedScriptorium, dataset: c.seedDataset, model: c.seedModel };
    for (const s of c.supply) {
      const p = sim.node(s.node);
      if (p && p.count < seed[s.key]) p.count = seed[s.key];
    }
    staff(sim);
    restatePorts(sim);
  },

  tick(sim, dt) {
    const c = C(sim), e = E(sim);
    if (dt > 0 && sim.node('node').count > 0) {
      runsTick(sim, dt);
      if (!sim.muted()) {
        if (!sim.state.flags.oddWind && breadth(sim) >= c.oddBreadth && !e.event && !e.eventNext) sim.state.flags.oddWind = sim.state.t;
        weatherTick(sim, dt);
      }
    }
    restatePorts(sim);
  },

  actions: {
    /** the generic buy every era exposes, so a plate's BUILD button works without an era-special case */
    buy: {
      can(sim, a) {
        const n = sim.node(a.node);
        if (!n || !n.cost || n.era !== 4) return false;
        return sim.stock(n.cost.res) >= sim.costOf(a.node, Math.max(1, Math.floor(a.n || 1)));
      },
      apply(sim, a) {
        const n = sim.node(a.node), k = Math.max(1, Math.floor(a.n || 1));
        sim.state.stocks[n.cost.res] -= sim.costOf(a.node, k);
        n.count += k;
        sim.setMult(a.node, 'milestone', tierMult(C(sim), n.count));
        restatePorts(sim);
      }
    },
    pause: {
      can(sim, a) { const n = sim.node(a.node); return !!n && n.era === 4 && n.kind !== 'store' && n.paused !== !!a.on; },
      apply(sim, a) { sim.node(a.node).paused = !!a.on; }
    },
    buyNode: {
      menu() { return [{ n: 1 }]; },
      can(sim, a) { return deep.actions.buy.can(sim, { node: 'node', n: a && a.n }); },
      apply(sim, a) { deep.actions.buy.apply(sim, { node: 'node', n: a && a.n }); }
    },
    /** the mixer: three weights, floored so no run is ever starved of the budget entirely */
    alloc: {
      menu(sim) {   // balanced, then each run leading (70 / 15 / 15): enough for a bot or the mirror to steer
        const ks = KEYS(sim), out = [];
        const bal = {}; for (const k of ks) bal[k] = 1; out.push(bal);
        for (const lead of ks) { const a = {}; for (const k of ks) a[k] = k === lead ? 0.7 : 0.15; out.push(a); }
        return out;
      },
      can(sim, a) {
        if (!a) return false;
        for (const k of KEYS(sim)) if (typeof a[k] !== 'number' || !isFinite(a[k]) || a[k] < 0) return false;
        let sum = 0;
        for (const k of KEYS(sim)) sum += a[k];
        return sum > 0;
      },
      apply(sim, a) {
        const c = C(sim), e = E(sim), keys = KEYS(sim), next = {};
        let sum = 0;
        for (const k of keys) { next[k] = Math.max(c.allocMin, a[k]); sum += next[k]; }
        for (const k of keys) next[k] = next[k] / sum;
        e.alloc = next;
        restatePorts(sim);
      }
    },
    lock: {
      menu(sim) { return KEYS(sim).map((k) => ({ run: k })); },
      can(sim, a) {
        const e = E(sim);
        if (!a || !a.run || !(a.run in e.locks) || e.locks[a.run] > 0) return false;
        return sim.stock('capability') >= lockCost(sim);
      },
      apply(sim, a) {
        const c = C(sim), e = E(sim);
        sim.state.stocks.capability -= lockCost(sim);
        e.locks[a.run] = c.lockDur;
        e.locksBought = (e.locksBought || 0) + 1;
        restatePorts(sim);
      }
    },
    /** the other half of the Knowledge story: the crafts that burn it, pausable from up here */
    hold: {
      menu() { return [{ on: true }, { on: false }]; },
      can(sim, a) { return !!a && typeof a.on === 'boolean' && holdOn(sim) !== a.on; },
      apply(sim, a) { for (const h of C(sim).holdNodes) { const n = sim.node(h.node); if (n) n.paused = !!a.on; } }
    },
    /** build-here: a real node on a lower stratum, bought from up here and paid for in Silicon */
    supply: {
      menu(sim) { return C(sim).supply.map((s) => ({ key: s.key, n: 1 })); },
      can(sim, a) {
        const s = a && supplyDef(sim, a.key);
        if (!s || !sim.node(s.node)) return false;
        return sim.stock('silicon') >= supplyCost(sim, s, a.n);
      },
      apply(sim, a) {
        const s = supplyDef(sim, a.key), k = Math.max(1, Math.floor(a.n || 1));
        sim.state.stocks.silicon -= supplyCost(sim, s, k);
        const n = sim.node(s.node);
        n.count += k;
        sim.setMult(s.node, 'milestone', tierMult(C(sim), n.count));
        if (a.key === 'scriptorium') staff(sim);
        restatePorts(sim);
      }
    },
    arch: {
      menu(sim) { return ['stabilizer'].concat(Object.keys(C(sim).arch)).map((id) => ({ id: id })); },
      can(sim, a) {
        if (!a || !a.id || !C(sim).arch[a.id] && a.id !== 'stabilizer') return false;
        if (archOwned(sim, a.id)) return false;
        return sim.stock('capability') >= archCost(sim, a.id);
      },
      apply(sim, a) {
        const e = E(sim);
        sim.state.stocks.capability -= archCost(sim, a.id);
        if (a.id === 'stabilizer') e.stabilizer++; else e.arch[a.id] = true;
        restatePorts(sim);
      }
    },
    checkpoint: {
      can(sim) { return !!E(sim).arch.checkpoint; },
      apply(sim) {
        const e = E(sim);
        e.ckpt = { vision: e.vision, language: e.language, reasoning: e.reasoning, t: sim.state.t };
      }
    },
    restore: {
      can(sim) {
        const e = E(sim);
        if (!e.arch.checkpoint || !e.ckpt || e.restoreCd > 0) return false;
        if (sim.stock('capability') < restoreCost(sim)) return false;
        let gain = 0;
        for (const k of KEYS(sim)) gain += Math.max(0, (e.ckpt[k] || 0) - e[k]);
        return gain > 0.001;
      },
      apply(sim) {
        const c = C(sim), e = E(sim);
        sim.state.stocks.capability -= restoreCost(sim);
        e.restores = (e.restores || 0) + 1;
        e.restoreCd = c.restoreCd;
        for (const k of KEYS(sim)) e[k] = Math.max(e[k], e.ckpt[k] || 0);
      }
    },
    distill: {
      can(sim) {
        const c = C(sim), e = E(sim);
        if (!e.arch.distill || e.distillCd > 0 || sim.stock('capability') < c.distillCost) return false;
        return hiLo(sim).spread >= 0.02;
      },
      apply(sim) {
        const c = C(sim), e = E(sim), p = hiLo(sim);
        sim.state.stocks.capability -= c.distillCost;
        e.distillCd = c.distillCd;
        e.distills = (e.distills || 0) + 1;
        const take = Math.min(c.distillTake, p.spread);
        e[p.hi] -= take;
        e[p.lo] = clamp01(e[p.lo] + take * (c.distillGive / c.distillTake));
      }
    },
    advance: {
      can(sim) { return !E(sim).done && breadth(sim) >= C(sim).breadthGate; },
      apply(sim) { E(sim).done = true; sim.openEra(5); }
    }
  },

  goal(sim) {
    const c = C(sim), br = breadth(sim);
    return {
      progress: Math.max(0, Math.min(1, br / c.breadthGate)),
      ready: !E(sim).done && br >= c.breadthGate,
      label: (br * 100).toFixed(1) + '% / ' + Math.round(c.breadthGate * 100) + '%'
    };
  },

  voice(sim) {
    const c = C(sim), at = sim.state.flags.oddWind;
    if (!at || sim.state.t - at > c.oddDur) return null;
    return VOICE[0].line;
  },

  layout: { anchors: ANCHORS, verbs: ['buyNode'], goal: 'generality' },

  done(sim) { return !!E(sim).done; }
};

/**
 * A scriptorium with no scribes converts nothing, so the build-here buy delivers the Knowledge it advertises:
 * hands for the Marks it draws, and miners for the Ore upkeep, plus a floor so a locked line still gets staff.
 */
function staff(sim) {
  const c = C(sim), scr = sim.node('scriptorium');
  if (!scr) return;
  const per = (id, res) => {
    const n = sim.node(id);
    if (!n) return 0;
    let m = 1;
    for (const k of Object.keys(n.mult)) m *= n.mult[k];
    for (const p of n.outputs) if (p.res === res) return p.rate * m;
    return 0;
  };
  const draw = (res) => {
    let m = 1;
    for (const k of Object.keys(scr.mult)) m *= scr.mult[k];
    for (const p of scr.inputs) if (p.res === res) return scr.count * p.rate * m;
    return 0;
  };
  const top = (id, res, want, floor) => {
    const n = sim.node(id);
    if (!n) return;
    const y = per(id, res);
    let need = floor;
    if (y > 0) need = Math.max(need, Math.ceil((want * c.staffHeadroom - n.count * y) / y));
    if (need > 0) n.count += need;
  };
  top('scribe', 'marks', draw('marks'), c.staffScribes);
  top('miner', 'ore', draw('ore'), c.staffMiners);
  const sn = sim.node('scriptorium');
  if (sn) sn.paused = false;
}

deep.geom = geom;
deep.breadth = breadth;
deep.milestoneOf = milestoneOf;
export default deep;
