// engine/film.js — the twelve seconds of your column growing, computed from your own log (WO-08, SPEC "The turn" 5).
// Pure (GUARDRAILS §2): a seed and an action log in, N drawable snapshots out. No clock, no DOM, no randomness
// beyond the sim's own. The renderer never re-runs the sim per frame: it precomputes once, through filmPlan(),
// in chunks small enough that the main thread keeps its 60fps while the progress ring turns.
import { createSim } from './sim.js';

/** the fields the world draws: nodes with their counts, the banks, and every pipe's live flow */
function copyPorts(list) {
  if (!list || !list.length) return list || [];
  const out = [];
  for (const p of list) out.push({ res: p.res, rate: p.rate });
  return out;
}
function copyNode(n) {
  return {
    id: n.id, era: n.era, kind: n.kind, res: n.res, name: n.name, glyph: n.glyph,
    count: n.count, locked: n.locked, hidden: n.hidden, paused: n.paused,
    pos: { x: n.pos.x, y: n.pos.y }, inputs: copyPorts(n.inputs), outputs: copyPorts(n.outputs),
    cost: n.cost, mult: n.mult
  };
}

/** one frame of the film: a State-shaped object render/world.js can draw through setSource */
export function snapshot(state) {
  const nodes = {}, order = [];
  for (const id of state.nodeOrder) { const n = state.nodes[id]; if (!n) continue; nodes[id] = copyNode(n); order.push(id); }
  const stocks = {};
  for (const k of Object.keys(state.stocks)) stocks[k] = state.stocks[k];
  const edges = [];
  for (const e of state.edges) edges.push({ from: e.from, to: e.to, res: e.res, flow: e.flow, riser: !!e.riser, starved: !!e.starved });
  return { t: state.t, era: state.era, maxEra: state.maxEra, nodes: nodes, nodeOrder: order, stocks: stocks, edges: edges };
}

/** firstMinute(log, seconds): the clicks the ghosts replay on the bedrock (SPEC: your first sixty seconds) */
export function firstMinute(log, seconds) {
  const cut = typeof seconds === 'number' ? seconds : 60;
  const out = [];
  for (const a of (log || [])) { if (typeof a.t === 'number' && a.t <= cut) out.push(a); }
  return out;
}

/** where the run ends when the caller does not say: the last action, plus the tail the film keeps rolling */
export function endOf(log, tail) {
  const acts = log || [];
  const last = acts.length ? acts[acts.length - 1].t : 0;
  return Math.max(0, last + (tail || 0));
}

/**
 * filmPlan(log, seed, n, opts) -> { work(budget), frames, progress, done }
 * A resumable precompute. `work(budget)` runs at most `budget` sim steps and returns whether it finished, so
 * the page can drive it from rAF and never stall a frame. opts: { eras, cfg, end?, legacy? }.
 */
export function filmPlan(log, seed, n, opts) {
  const o = opts || {};
  const cfg = o.cfg || {};
  const c7 = (cfg.e7 && cfg.e7.film) || {};
  const step = typeof cfg.replayStep === 'number' ? cfg.replayStep : 0.1;
  const count = Math.max(1, Math.floor(n || 1));
  const acts = log || [];
  const end = typeof o.end === 'number' ? o.end : endOf(acts, typeof c7.tail === 'number' ? c7.tail : 0);
  const total = Math.max(0, Math.round(end / step));            // ticks of the rebuilt run, the live loop's own step
  const sim = createSim({ cfg: cfg, eras: o.eras || [], seed: seed, legacy: o.legacy || null });

  // when each stratum first shows up in the record. A real run opens every stratum through a logged action or a
  // tick threshold, so these calls are no-ops there; a state that was poked open (a scene, a doctored save) still
  // grows its column in the film, at the moment the record first touched it.
  const opens = [];
  for (const a of acts) {
    const n = typeof a.era === 'number' ? a.era : 0;
    if (n < 2) continue;
    if (opens[n] === undefined || a.t < opens[n]) opens[n] = a.t;
  }
  let opened = 1;
  /** strata stack: reaching stratum n means every stratum under it is already there (app.js restores the same way) */
  function openUpTo(n) {
    while (opened < n) {
      opened++;
      try { sim.openEra(opened); } catch (e) { /* a stratum the film cannot rebuild is one it does not draw */ }
    }
  }

  const out = [];
  let ticks = 0, ai = 0, next = 0;
  const markAt = (i) => Math.round((i * total) / Math.max(1, count - 1));

  /** open whatever strata the record has reached, apply this boundary's actions, capture the frames on it */
  function settle() {
    for (let n = opens.length - 1; n >= 2; n--) {
      if (opens[n] === undefined || opens[n] > sim.state.t) continue;
      openUpTo(n);
      break;
    }
    while (ai < acts.length && acts[ai].t <= sim.state.t) { sim.apply(acts[ai]); ai++; }
    while (next < count && markAt(next) <= ticks) { out.push(snapshot(sim.state)); next++; }
  }

  settle();
  return {
    /** budget = sim steps this slice may run; returns true when the film is complete */
    work(budget) {
      let left = Math.max(1, Math.floor(budget || total || 1));
      while (left-- > 0 && ticks < total) { sim.tick(step); ticks++; settle(); }
      if (ticks >= total) { while (next < count) { out.push(snapshot(sim.state)); next++; } }
      return this.done;
    },
    get frames() { return out; },
    get progress() { return total ? Math.min(1, ticks / total) : 1; },
    get done() { return next >= count; }
  };
}

/**
 * frames(log, seed, n, opts): the whole film at once (tests, and any caller that can afford one long slice).
 * `opts.chunk` is a per-slice budget in milliseconds; it bounds the work each pass does, exactly as the page's
 * rAF loop bounds it, so the chunked and unchunked results are identical.
 */
export function frames(log, seed, n, opts) {
  const o = opts || {};
  const c7 = (o.cfg && o.cfg.e7 && o.cfg.e7.film) || {};
  const perMs = typeof c7.stepsPerMs === 'number' ? c7.stepsPerMs : 240;
  const plan = filmPlan(log, seed, n, o);
  const budget = typeof o.chunk === 'number' ? Math.max(1, Math.round(o.chunk * perMs)) : 0;
  if (!budget) { plan.work(Infinity); return plan.frames; }
  let guard = 0;
  while (!plan.work(budget) && guard++ < 1e6) { /* one scheduler slice per pass */ }
  return plan.frames;
}

export default { frames, firstMinute, filmPlan, snapshot, endOf };
