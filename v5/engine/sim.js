// engine/sim.js — the sim: one state object, a deterministic tick, and actions as the only way in.
// Implements engine/CONTRACT.md. Pure by rule (no clock, no Math.random, no timers, no view): the only
// randomness is sim.rng(), seeded from state.seed, so a seed plus a log rebuilds a run exactly.
import { deriveEdges, tickGraph, insertNode } from './graph.js';

const DEFAULT_TICK_MAX = 0.5;
const DEFAULT_REPLAY_STEP = 0.1;

/** mulberry32: 32 bits of state, one multiply-xor round. The whole game's randomness. */
function nextRandom(rng) {
  rng.s = (rng.s + 0x6D2B79F5) >>> 0;
  let x = rng.s;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

function freshState(seed, legacy) {
  return {
    v: 1,
    seed: seed >>> 0,
    rng: { s: seed >>> 0 },
    t: 0,
    era: 1,
    maxEra: 1,
    mute: false,
    stocks: {},
    rates: {},
    nodes: {},
    nodeOrder: [],
    edges: [],
    resources: {},
    flags: {},
    eras: {},
    log: [],
    legacy: legacy || null
  };
}

const clone = (v) => JSON.parse(JSON.stringify(v));

export function createSim(opts) {
  const o = opts || {};
  const cfg = o.cfg || {};
  const modules = o.eras || [];
  const state = freshState(typeof o.seed === 'number' ? o.seed : 1, o.legacy || null);
  const byId = {};
  for (const m of modules) if (m && typeof m.id === 'number') byId[m.id] = m;
  const installed = {};
  let index = deriveEdges(state);
  const tickMax = typeof cfg.tickMax === 'number' ? cfg.tickMax : DEFAULT_TICK_MAX;
  const step = typeof cfg.replayStep === 'number' ? cfg.replayStep : DEFAULT_REPLAY_STEP;

  const eraOf = (a) => (a && typeof a.era === 'number' ? a.era : state.era);
  const actionDef = (a) => {
    const mod = installed[eraOf(a)];
    return mod && mod.actions ? mod.actions[a.type] : null;
  };

  const sim = {
    state: state,
    cfg: cfg,
    eras: installed,

    /* ---------- graph ---------- */
    addResource(def) {
      state.resources[def.id] = def;
      if (!(def.id in state.stocks)) { state.stocks[def.id] = 0; state.rates[def.id] = 0; }
      return def;
    },
    addNode(def) {
      insertNode(state, def);
      index = deriveEdges(state);
      return def;
    },
    removeNode(id) {
      if (!state.nodes[id]) return false;
      delete state.nodes[id];
      const i = state.nodeOrder.indexOf(id);
      if (i >= 0) state.nodeOrder.splice(i, 1);
      index = deriveEdges(state);
      return true;
    },
    node(id) { return state.nodes[id]; },
    stock(res) { return state.stocks[res] || 0; },
    rate(res) { return state.rates[res] || 0; },
    setMult(nodeId, key, value) {
      const n = state.nodes[nodeId];
      if (!n) return false;
      n.mult[key] = value;
      return true;
    },
    /** unit cost is geometric and floored per unit, so a batch is the sum of the units it buys */
    costOf(nodeId, n) {
      const node = state.nodes[nodeId];
      if (!node || !node.cost) return Infinity;
      const k = Math.max(1, Math.floor(n || 1));
      let sum = 0;
      for (let i = 0; i < k; i++) sum += Math.floor(node.cost.base * Math.pow(node.cost.growth, node.count + i));
      return sum;
    },

    /* ---------- time ---------- */
    tick(dt) {
      let d = typeof dt === 'number' && dt > 0 ? dt : 0;
      if (d > tickMax) d = tickMax;
      state.t += d;
      const r = tickGraph(state, d, index);
      for (const n of Object.keys(installed).map(Number).sort((a, b) => a - b)) {
        const mod = installed[n];
        if (mod && mod.tick) mod.tick(sim, d);
      }
      return r;
    },

    /* ---------- actions ---------- */
    can(a) {
      if (!a || typeof a.type !== 'string') return false;
      const def = actionDef(a);
      return !!def && !!def.can(sim, a);
    },
    apply(a) {
      if (!a || typeof a.type !== 'string') return { ok: false, reason: 'no type' };
      const def = actionDef(a);
      if (!def) return { ok: false, reason: 'unknown' };
      if (!def.can(sim, a)) return { ok: false, reason: 'blocked' };
      def.apply(sim, a);
      const rec = Object.assign({}, a);
      rec.t = state.t;
      state.log.push(rec);
      return { ok: true };
    },
    /** the bot's menu: every action of the era that can run right now, buy/pause expanded per node */
    available(era) {
      const n = typeof era === 'number' ? era : state.era;
      const mod = installed[n];
      const out = [];
      if (!mod || !mod.actions) return out;
      for (const type of Object.keys(mod.actions)) {
        const def = mod.actions[type];
        if (def && typeof def.menu === 'function') {      // parameterized actions enumerate themselves (focus {k}, fund {kind}, arch {id})
          for (const a of (def.menu(sim) || [])) { const full = Object.assign({ type: type, era: n }, a); if (sim.can(full)) out.push(full); }
          continue;
        }
        if (type === 'buy' || type === 'pause') {
          for (const id of state.nodeOrder) {
            const node = state.nodes[id];
            if (!node || node.era !== n) continue;
            const a = type === 'buy'
              ? { type: type, era: n, node: id, n: 1 }
              : { type: type, era: n, node: id, on: !node.paused };
            if (sim.can(a)) out.push(a);
          }
        } else {
          const a = { type: type, era: n };
          if (sim.can(a)) out.push(a);
        }
      }
      return out;
    },

    /* ---------- eras ---------- */
    openEra(n) {
      const mod = byId[n];
      if (!mod) return false;
      if (!installed[n]) {
        installed[n] = mod;
        if (!state.eras[n]) state.eras[n] = {};
        mod.install(sim);
        index = deriveEdges(state);
        // open() is the handoff seam (it seeds carried resources), so it runs once, on install
        if (mod.open) mod.open(sim);
      }
      state.era = n;
      if (n > state.maxEra) state.maxEra = n;
      return true;
    },
    goal(era) {
      const mod = installed[typeof era === 'number' ? era : state.era];
      if (!mod || !mod.goal) return { progress: 0, ready: false, label: '' };
      return mod.goal(sim);
    },
    voice(era) {
      const mod = installed[typeof era === 'number' ? era : state.era];
      if (!mod || !mod.voice) return null;
      const line = mod.voice(sim);
      return line || null;
    },

    /* ---------- flags ---------- */
    rng() { return nextRandom(state.rng); },
    muted() { return !!state.mute; },
    setMuted(b) { state.mute = !!b; return state.mute; },

    /* ---------- persistence ---------- */
    snapshot() { return clone(state); },
    restore(s) {
      const c = clone(s);
      for (const k of Object.keys(state)) delete state[k];
      for (const k of Object.keys(c)) state[k] = c[k];
      index = deriveEdges(state);
      return state;
    },

    /**
     * Rebuild a run from a seed and its action log: fresh sim, fixed steps, each action applied at the tick
     * its timestamp falls in (log order within a step). The result must equal the live state.
     */
    replay(seed, log, until) {
      const fresh = createSim({ cfg: cfg, eras: modules, seed: seed, legacy: o.legacy || null });
      const acts = log || [];
      const end = typeof until === 'number' ? until : (acts.length ? acts[acts.length - 1].t : 0);
      let i = 0;
      for (;;) {
        while (i < acts.length && acts[i].t <= fresh.state.t) { fresh.apply(acts[i]); i++; }
        if (fresh.state.t >= end) break;
        fresh.tick(step);
      }
      return fresh.state;
    }
  };

  sim.openEra(1);
  return sim;
}

export default createSim;
