// engine/eras/mirror.js — the mirror, era 7 (WO-07, SPEC "The turn" 4).
// It replays YOUR action log on a SHADOW of your own column at ten times your pace, and it plays it better.
// Nothing here is canned: the shadow is a second sim built from your seed and your log, so every place the
// violet lights is a place its deterministic policy chose something you did not choose at that moment.
// You get exactly three interrupts. Control and Alignment are read off the record (surface.derive), so they
// move on your three choices and on nothing else: SPEC "The turn" 4 has no per-second drain.
// Pure: no DOM, no clock, no randomness of its own. The shadow's only randomness is its own seeded rng.
import { STRATUM_H } from '../types.js';
import { createSim } from '../sim.js';
import { derive, openVeto, resolveVeto } from './surface.js';
import { axiomGain } from './symbolic.js';
import { MIRROR_LINES } from '../voice/e6.js';

const E = (sim) => sim.state.eras[7] || {};
const C = (sim) => (sim.cfg.e6 && sim.cfg.e6.mirror) || {};
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/* ---------- the shadow's policy: the better choices, in a fixed order, so a run is reproducible ---------- */
const RUNS = ['vision', 'language', 'reasoning'];

/** the lagging training run of a shadow at this moment */
function lowestRun(state) {
  const e = state.eras[4] || {};
  let best = RUNS[0];
  for (const k of RUNS) if ((e[k] || 0) < (e[best] || 0)) best = k;
  return best;
}

/**
 * pickImprovement(shadow, cfg): the one action the policy would take right now, or null.
 * Ordered by what the work order names: reach the gate as soon as it can, compile on a real axiom yield,
 * steer at the lagging run, buy Attention before the rest of the architecture, then open what you left closed.
 */
export function pickImprovement(shadow, cfg) {
  const c = (cfg && cfg.e6 && cfg.e6.mirror) || {};
  const st = shadow.state, era = st.era;
  const try1 = (a) => (shadow.can(a) ? a : null);

  if (era === 1) return try1({ type: 'fabricate' }) || try1({ type: 'discover' }) || cheapestBuy(shadow, 1);
  if (era === 2) {
    if (axiomGain(shadow) >= c.compileAt && shadow.can({ type: 'compile' })) return { type: 'compile' };
    return try1({ type: 'prove' }) || try1({ type: 'writeRule' }) || cheapestBuy(shadow, 2);
  }
  if (era === 3) return try1({ type: 'generalize' }) || try1({ type: 'trial' }) || cheapestBuy(shadow, 3);
  if (era === 4) {
    if (shadow.can({ type: 'arch', id: 'attention' })) return { type: 'arch', id: 'attention' };
    if (shadow.can({ type: 'advance' })) return { type: 'advance' };
    const low = lowestRun(st), a = { type: 'alloc' };
    for (const k of RUNS) a[k] = k === low ? c.allocLow : c.allocRest;
    const cur = (st.eras[4] || {}).alloc || {};
    if (Math.abs((cur[low] || 0) - c.allocLow) > c.allocRest * 0.5 && shadow.can(a)) return a;
    return try1({ type: 'buyNode' }) || cheapestBuy(shadow, 4);
  }
  if (era === 5) return try1({ type: 'improve' }) || try1({ type: 'align' }) || cheapestBuy(shadow, 5);
  return null;
}

/** the cheapest thing this stratum can afford right now, so the shadow never idles with a full bank */
function cheapestBuy(shadow, era) {
  let best = null, price = Infinity;
  for (const id of shadow.state.nodeOrder) {
    const n = shadow.state.nodes[id];
    if (!n || n.era !== era || !n.cost || n.locked) continue;
    const a = { type: 'buy', era: era, node: id, n: 1 };
    if (!shadow.can(a)) continue;
    const p = shadow.costOf(id, 1);
    if (p < price) { price = p; best = a; }
  }
  return best;
}

/* ---------- the replayer ---------- */

/**
 * createReplayer(sim, {policy, speed}) → {shadow, step(dtWall), runToEnd(), diff, endT, progress()}.
 * `shadow` is a State: a second sim rebuilt from your seed and your log, ticked in the same fixed steps the
 * contract's replay() uses, so with `policy: null` it lands on your numbers exactly. With `policy: 'improve'`
 * it takes the better action once per step and counts, per stratum, the times that action was not yours.
 * The shadow's era list stops at 6: nothing in a shadow may ever open the mirror inside itself.
 */
export function createReplayer(sim, opts) {
  const o = opts || {};
  const cfg = sim.cfg || {};
  const c = (cfg.e6 && cfg.e6.mirror) || {};
  const step = typeof cfg.replayStep === 'number' ? cfg.replayStep : c.step;
  const speed = typeof o.speed === 'number' && o.speed > 0 ? o.speed : c.speed;
  const policy = o.policy === 'improve' ? 'improve' : null;

  const mods = Object.keys(sim.eras).map(Number).filter((n) => n <= 6).sort((a, b) => a - b).map((n) => sim.eras[n]);
  const inner = createSim({ cfg: cfg, eras: mods, seed: sim.state.seed, legacy: sim.state.legacy });
  inner.state.flags.shadow = true;

  const acts = sim.state.log.slice();
  const e5 = sim.state.eras[5] || {};
  const endT = e5.emergedT > 0 ? e5.emergedT : sim.state.t;
  const maxSteps = Math.ceil(endT / step) + 8;

  // your own record, bucketed by kind and whole second: an action the shadow takes inside your own bucket
  // is the same call you made, so it is not an improvement
  const yours = {};
  for (const a of acts) yours[a.type + '@' + Math.floor(a.t)] = 1;

  const diff = {};
  let i = 0, acc = 0, ticks = 0, done = false;

  const drain = () => { while (i < acts.length && acts[i].t <= inner.state.t) { inner.apply(acts[i]); i++; } };
  const emerged = () => !!(inner.state.eras[5] && inner.state.eras[5].emerged);
  const finished = () => done || inner.state.t >= endT || ticks >= maxSteps || emerged();

  function improve() {
    const a = pickImprovement(inner, cfg);
    if (!a) return;
    const era = typeof a.era === 'number' ? a.era : inner.state.era;
    const mine = !yours[a.type + '@' + Math.floor(inner.state.t)];
    if (!inner.apply(a).ok) return;
    if (mine) diff[era] = (diff[era] || 0) + 1;
  }

  function one() {
    drain();
    if (policy) improve();
    inner.tick(step);
    ticks++;
    drain();
  }

  return {
    /** the State the renderer draws while the mirror runs */
    get shadow() { return inner.state; },
    /** the sim behind it, for anything that needs to ask it a question */
    get sim() { return inner; },
    diff: diff,
    endT: endT,
    /** advance by one wall second's worth of replay; whole steps only, so the shadow lands on your floats */
    step(dtWall) {
      acc += Math.max(0, +dtWall || 0) * speed;
      let guard = 0;
      while (acc >= step && !finished() && guard++ < maxSteps) { one(); acc -= step; }
      if (finished()) { done = true; acc = 0; }
      return inner.state.t;
    },
    runToEnd() {
      let guard = 0;
      while (!finished() && guard++ <= maxSteps) one();
      done = true;
      return inner.state;
    },
    progress() { return endT > 0 ? clamp(inner.state.t / endT, 0, 1) : 1; },
    get finished() { return finished(); }
  };
}

/* ---------- the resolution ---------- */

/** endingFor({control, alignment}, cfg): the v4 thresholds, held in cfg */
export function endingFor(m, cfg) {
  const c6 = (cfg && cfg.e6) || {}, c5 = (cfg && cfg.e5) || {};
  const high = c6.controlHigh !== undefined ? c6.controlHigh : c5.controlHigh;
  const good = c6.alignGood !== undefined ? c6.alignGood : c5.alignGood;
  const ctl = +(m && m.control) || 0, ali = +(m && m.alignment) || 0;
  if (ctl >= high) return 'contained';
  if (ali >= good) return 'symbiotic';
  return 'runaway';
}

/* ---------- one replayer per sim, held outside State (State stays JSON safe) ---------- */
const RUNNERS = new WeakMap();

/** runnerFor(sim): the live shadow the mirror is playing; the view reads it to draw the column */
export function runnerFor(sim) {
  let r = RUNNERS.get(sim);
  if (!r) {
    r = createReplayer(sim, { policy: 'improve', speed: (sim.cfg.e6 && sim.cfg.e6.mirror.speed) || 10 });
    const want = E(sim).shadowT || 0;
    let guard = 0;
    while (r.shadow.t < want && !r.finished && guard++ < 200000) r.step(1);
    RUNNERS.set(sim, r);
  }
  return r;
}

/** dropRunner(sim): forget the shadow (a restart, a restored save that rewinds the mirror) */
export function dropRunner(sim) { RUNNERS.delete(sim); }

/* ---------- the era module ---------- */
const mirror = {
  id: 7,
  name: 'The Mirror',
  height: STRATUM_H,

  install(sim) {
    const c = C(sim), c6 = sim.cfg.e6;
    Object.assign(sim.state.eras[7], {
      progress: 0, shadowT: 0, era: 1, diff: {},
      interruptsLeft: c.interrupts !== undefined ? c.interrupts : c6.interrupts,
      veto: null, vetoLeft: 0,
      control: 0, alignment: 0, ending: null, line: '', better: 0
    });
  },

  open() {},

  /** the shadow climbs; a held proposal stops it; the two meters are read off the record, never drained */
  tick(sim, dt) {
    const c = C(sim), e = E(sim);
    const d = derive(sim);
    e.control = d.control;
    e.alignment = d.alignment;
    if (sim.muted() || e.ending) return;

    if (e.veto) {                                  // held: it waits for you, and lapses if you never answer
      e.vetoLeft -= dt;
      if (e.vetoLeft <= 0) { resolveVeto(sim, 'lapse'); e.veto = null; }
      return;
    }

    const r = runnerFor(sim);
    r.step(dt);
    e.shadowT = r.shadow.t;
    e.progress = r.progress();
    e.era = r.shadow.era;
    e.diff = r.diff;
    let better = 0;
    for (const k in r.diff) better += r.diff[k];
    e.better = better;

    if (r.finished) {
      e.progress = 1;
      const ending = endingFor({ control: e.control, alignment: e.alignment }, sim.cfg);
      e.ending = ending;
      if (sim.state.eras[6]) sim.state.eras[6].ending = ending;
      sim.state.flags.ending = ending;             // the shell's legacy writer watches this
      sim.state.flags.endT = sim.state.t;
    }
  },

  actions: {
    /** the interrupt: it stops the replay and puts the next proposal to you. Exactly three, then never again. */
    interrupt: {
      can(sim) { const e = E(sim); return e.interruptsLeft > 0 && !e.veto && !e.ending; },
      apply(sim) {
        const c = C(sim), e = E(sim);
        e.interruptsLeft--;
        e.veto = openVeto(sim);
        e.vetoLeft = c.vetoWindow;
      }
    },
    /** your answer. surface.resolveVeto owns what it does; the record it writes moves both meters. */
    veto: {
      menu() { return [{ how: 'approve' }, { how: 'negotiate' }, { how: 'veto' }]; },
      can(sim, a) { return !!E(sim).veto && !!a && ['approve', 'negotiate', 'veto'].indexOf(a.how) >= 0; },
      apply(sim, a) {
        const e = E(sim);
        if (!resolveVeto(sim, a.how)) resolveVeto(sim, 'lapse');
        e.veto = null;
        e.vetoLeft = 0;
        const d = derive(sim);
        e.control = d.control;
        e.alignment = d.alignment;
      }
    },
    pause: { can() { return false; }, apply() {} }
  },

  /** the goal meter is the replay itself: how much of your run it has played back */
  goal(sim) {
    const e = E(sim);
    return {
      progress: clamp(e.progress || 0, 0, 1),
      ready: !!e.ending,
      label: Math.round((e.progress || 0) * 100) + '%'
    };
  },

  voice(sim) {
    const e = E(sim);
    if (e.ending) return MIRROR_LINES.done;
    if (e.veto) return MIRROR_LINES.paused;
    if (!e.progress) return MIRROR_LINES.open;
    if (!e.interruptsLeft) return MIRROR_LINES.spent;
    const era = e.era || 1;
    return (e.diff && e.diff[era]) ? MIRROR_LINES.better(nameOf(sim, era)) : MIRROR_LINES.clean;
  },

  layout: { anchors: {}, verbs: ['interrupt'], goal: '' },

  done(sim) { return !!E(sim).ending; }
};

function nameOf(sim, era) { const m = sim.eras[era]; return (m && m.name) || String(era); }

mirror.createReplayer = createReplayer;
mirror.endingFor = endingFor;
mirror.runnerFor = runnerFor;
export default mirror;
