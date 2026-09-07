// engine/eras/statistical.js — Statistical, the third stratum (WO-04).
// The v4 instrument (v4-kit/era-statistical.js) ported onto the graph engine: Silicon rises from Origins to
// feed a Dataset converter, Data trains the Fit Engine, and the trials it runs move accuracy, the overfit gap
// and the survey. Distribution shifts knock the fit down; after the second one the world never settles again.
// The machine watches which Focus you pick and, once it can call it, offers to pick for you.
// Pure: no DOM, no clock, no randomness (every shift is triggered by accuracy, never by a roll).
import { STRATUM_H } from '../types.js';
import VOICE from '../voice/e3.js';

const RESOURCES = [
  { id: 'data', name: 'Data', hue: '#54d2ff', glyph: '◈', flavor: 'Experience, stored for the machine to study.' },
  { id: 'insight', name: 'Insight', hue: '#6fe6a8', glyph: '◆', flavor: 'The pattern beneath the noise.' },
  { id: 'trials', name: 'Trials', hue: '#9fd6cc', glyph: '⌁', flavor: 'Every guess the model has made and been graded on.' }
];

/* Stratum-local anchors (CONTRACT: pos is local). The scatter owns the top of the field (world y 40..270),
   so the machinery reads left to right beneath it: Silicon in from Origins, Data across, Insight out. */
const ANCHORS = {
  dataset: { x: 330, y: 340 },
  'data.store': { x: 560, y: 340 },
  model: { x: 790, y: 340 },
  trials: { x: 560, y: 560 },
  'insight.store': { x: 820, y: 560 },
  generalize: { x: 1120, y: 620 }
};

/** the goal lives in the HUD column, so its node never wears a plate */
export const HIDDEN_PLATES = ['generalize'];
/** the world rect the living scatter is drawn into, stratum-local (the view lifts it by stratumTop) */
export const PLOT_RECT = { x: 240, y: 40, w: 680, h: 180 };
/** the two-needle track sits directly under the plot, in the same world band */
export const TRACK_RECT = { x: 240, y: 232, w: 680, h: 38 };

const E = (sim) => sim.state.eras[3];
const C = (sim) => sim.cfg.e3;
const line = (id) => { for (const v of VOICE) if (v.id === id) return v.text; return null; };

/* ---------- count milestones (v4 kit: x10/x25/x50/x100 -> +25% per tier, on that node only) ---------- */
function tierOf(c, count) { let t = 0; for (const m of c.milestones) if (count >= m) t++; return t; }
function tierMult(c, count) { return 1 + c.milestoneBonus * tierOf(c, count); }
/** the next count tier for a node, for the renderer's pip */
export function milestoneOf(sim, node) {
  const c = C(sim);
  if (!node || !node.cost) return null;
  for (const m of c.milestones) if (node.count < m) return { at: m, near: m - node.count <= 3, tiered: tierOf(c, node.count) > 0 };
  return null;
}

/* ---------- derived rates (v4 e3Stats, re-homed onto node multipliers) ---------- */
/** every method's effect in one place; the view reads it to show what a Method actually bought */
export function stats(sim) {
  const c = C(sim), m = E(sim).methods, k = c.mult;
  return {
    accGain: c.accGain * (m.regression ? k.regression : 1),
    dataMult: (m.features ? k.features : 1) * tierMult(c, sim.node('dataset') ? sim.node('dataset').count : 0),
    insMult: m.bayesian ? k.bayesian : 1,
    discMult: m.clustering ? k.clustering : 1,
    regMult: m.regularization ? k.regularization : 1,
    effBonus: m.ensembles ? k.ensembles : 0,
    cap: m.regularization ? 1 : k.capNoReg,
    expPerModel: c.expPerModel * tierMult(c, sim.node('model') ? sim.node('model').count : 0)
  };
}

/** recompute node multipliers from methods and counts (the ports hold the base rates) */
function restate(sim) {
  const c = C(sim), st = stats(sim), ds = sim.node('dataset'), md = sim.node('model');
  if (ds) { sim.setMult('dataset', 'method', E(sim).methods.features ? c.mult.features : 1); sim.setMult('dataset', 'milestone', tierMult(c, ds.count)); }
  if (md) sim.setMult('model', 'milestone', tierMult(c, md.count));
  return st;
}

/** VALIDATION can never exceed TRAINING: methods shrink the gap toward it, never past it */
export function effAccuracy(sim) {
  const e = E(sim), st = stats(sim);
  return Math.max(0, Math.min(st.cap, e.accuracy, e.accuracy + st.effBonus - e.gap));
}

/* ---------- the experiment board ---------- */
export function nextMethod(sim) {
  const e = E(sim);
  for (const m of C(sim).methods) if (!e.methods[m.id]) return m;
  return null;
}
export function utilDef(sim, id) { for (const u of C(sim).utils) if (u.id === id) return u; return null; }
/** Explore trials survey the space; the survey discounts every card, and funding one spends it */
export function surveyDisc(sim) { return 1 - C(sim).surveyDiscount * (E(sim).survey || 0) / 100; }
export function expCost(sim, kind) {
  const c = C(sim), e = E(sim);
  if (kind === 'method') {
    let i = -1;
    for (let j = 0; j < c.methods.length; j++) if (!e.methods[c.methods[j].id]) { i = j; break; }
    return i < 0 ? Infinity : Math.ceil(c.cardMethodCosts[i] * surveyDisc(sim));
  }
  const u = c.cardUtil[kind];
  if (!u) return Infinity;
  return Math.ceil(u.cost * Math.pow(u.growth, (e.utilLvl && e.utilLvl[kind]) || 0) * surveyDisc(sim));
}
/** the three cards on offer: the next Method first, then two studies on a rotating wheel */
export function boardCards(sim) {
  const ids = C(sim).utils.map((u) => u.id), n = E(sim).utilN || 0;
  const a = ids[n % ids.length], b = ids[(n + 1) % ids.length];
  return nextMethod(sim) ? ['method', a, b] : [a, b, ids[(n + 2) % ids.length]];
}

/* ---------- the policy the machine learned, and the prediction it makes from your log ---------- */
/** what a good player does now: close a wide gap, survey when the Method is out of reach, otherwise fit */
export function policy(sim) {
  const c = C(sim), e = E(sim);
  if (e.gap > c.policyGap) return 'generalize';
  const m = nextMethod(sim);
  if (m && (e.survey || 0) < c.policySurvey && sim.stock('data') < expCost(sim, 'method')) return 'explore';
  return 'fit';
}
export function focusKey(sim) { const f = E(sim).focus; return f === 'auto' ? policy(sim) : f; }
export function curFocus(sim) { const c = C(sim); return c.focus[focusKey(sim)] || c.focus.fit; }
export function predicting(sim) { const e = E(sim); return (e.trials || 0) >= C(sim).predAfter && !e.done; }

/**
 * Your Focus history, read back off state.log (SPEC pillar 4: the prediction is computed from the log,
 * never from a side array). A change that stood for less than predDwell seconds was a twitch, not a decision,
 * so it is dropped here exactly as it is dropped from the scoring.
 */
export function focusHistory(sim) {
  const c = C(sim), log = sim.state.log, want = c.predWindow + 1, picked = [];
  for (let i = log.length - 1; i >= 0 && picked.length < want; i--) {
    const a = log[i];
    if (a.type === 'focus' && typeof a.k === 'string' && (a.era === undefined || a.era === 3)) picked.push(a);
  }
  picked.reverse();
  const whole = picked.length < want;                       // the window reached the start of the run
  const out = whole ? [c.focusStart] : [];
  for (let i = 0; i < picked.length; i++) {
    if (i === 0 && !whole) continue;                        // its predecessor sits outside the window: unknowable
    const prev = i === 0 ? c.focAtInit : picked[i - 1].t;
    if (picked[i].t - prev >= c.predDwell) out.push(picked[i].k);
  }
  return out.slice(-c.predWindow);
}

/** the Focus it thinks you will pick next: the one that most often followed the one you are on */
export function predictNext(sim) {
  const h = focusHistory(sim), cur = E(sim).focus, counts = {};
  for (let i = 0; i < h.length - 1; i++) if (h[i] === cur && h[i + 1] !== 'auto') counts[h[i + 1]] = (counts[h[i + 1]] || 0) + 1;
  let best = null;
  for (const k of Object.keys(counts)) if (!best || counts[k] > counts[best]) best = k;
  return best || policy(sim);
}

/* ---------- flows the graph cannot derive (v4 parity: the yield depends on focus and accuracy) ---------- */
function edgeOf(sim, from, to) { for (const e of sim.state.edges) if (e.from === from && e.to === to) return e; return null; }
function setFlow(sim, from, to, v) { const e = edgeOf(sim, from, to); if (e) e.flow = v; }

/**
 * Resolve trials into the model. `spend` is true for a hand-run trial (the graph has not paid for it yet)
 * and false for the Fit Engine's throughput, which the graph pass already drew off the Data pipe.
 * Returns the Insight produced, so the tick can put it on the pipe as real flow.
 */
function runExperiment(sim, amount, spend) {
  const c = C(sim), e = E(sim), S = sim.state, st = stats(sim), f = curFocus(sim);
  if (spend) {
    amount = Math.min(amount, sim.stock('data') / c.expDataCost);
    if (!(amount > 0)) return 0;
    S.stocks.data -= amount * c.expDataCost;
    S.stocks.trials = (S.stocks.trials || 0) + amount;
  }
  if (!(amount > 0)) return 0;
  e.trials = (e.trials || 0) + amount;
  e.accuracy = Math.min(1, e.accuracy + st.accGain * f.acc * (1 - e.accuracy) * amount);
  e.gap = Math.max(0, Math.min(c.gapMax, e.gap + (c.gapGrow * f.gap - c.gapReduce * f.red * st.regMult) * amount));
  const ins = c.insightPerExp * f.ins * effAccuracy(sim) * st.insMult * amount;
  S.stocks.insight += ins;
  e.survey = Math.min(100, (e.survey || 0) + c.surveyPerExp * f.disc * st.discMult * amount);
  return ins;
}

/* ---------- distribution shifts + RR6c drift ---------- */
function shiftTick(sim, dt) {
  const c = C(sim), e = E(sim), S = sim.state;
  if (e.shifts >= c.shiftTriggers.length) {          // RR6c: the world never settles again
    e.dataPhase = (e.dataPhase || 0) + c.driftPhase * dt;
    e.gap = Math.min(c.gapMax, e.gap + c.driftGap * dt);
  }
  if (!e.shiftAt && e.shifts < c.shiftTriggers.length && e.accuracy >= c.shiftTriggers[e.shifts]) e.shiftAt = S.t + c.shiftWarn;
  if (!e.shiftAt || S.t < e.shiftAt) return;
  e.shiftAt = 0;
  e.shifts++;
  e.lastShift = S.t;
  e.accuracy = Math.max(c.shiftFloor, e.accuracy * (1 - (c.shiftBase + e.gap * c.shiftGapBite)));
  e.gap = Math.max(0, e.gap * c.shiftGapKeep);
  e.dataPhase = (e.dataPhase || 0) + c.shiftPhase;
  S.flags.oddPoint = true;                            // one point was there before the world moved; it stays
}

/* ---------- the module ---------- */
const statistical = {
  id: 3,
  name: 'Statistical',
  height: STRATUM_H,

  install(sim) {
    const c = C(sim);
    Object.assign(sim.state.eras[3], {
      accuracy: 0, gap: 0, methods: {}, focus: c.focusStart, focAt: c.focAtInit,
      survey: 0, utilN: 0, utilLvl: { calibrate: 0, sweep: 0, distill: 0 },
      shifts: 0, shiftAt: 0, lastShift: c.focAtInit, dataPhase: 0,
      trials: 0, pred: null, predN: 0, predHits: 0, predStreak: 0, learnedAt: c.focAtInit,
      flags: {}, done: false
    });
    for (const r of RESOURCES) sim.addResource({ id: r.id, name: r.name, hue: r.hue, glyph: r.glyph, icon: null, flavor: r.flavor, era: 3 });

    const base = (id, kind, name) => ({
      id, era: 3, kind, name, inputs: [], outputs: [], count: 0, paused: false,
      pos: { x: ANCHORS[id].x, y: ANCHORS[id].y }, mult: {}, tags: []
    });
    // stores first: every derived edge needs a bank to run to
    for (const r of RESOURCES) {
      const id = r.id === 'trials' ? 'trials' : r.id + '.store';
      const n = base(id, 'store', r.name);
      n.res = r.id; n.count = 1; n.flavor = r.flavor;
      sim.addNode(n);
    }

    const ds = base('dataset', 'converter', 'Dataset Feed');
    ds.inputs = [{ res: 'silicon', rate: c.datasetSilicon }];
    ds.outputs = [{ res: 'data', rate: c.datasetYield }];
    ds.cost = { res: 'silicon', base: c.datasetCost, growth: c.datasetGrowth };
    ds.flavor = 'The world, written down in numbers.';
    ds.mech = 'Silicon from Origins becomes Data every second.';
    sim.addNode(ds);

    const md = base('model', 'converter', 'Fit Engine');
    md.inputs = [{ res: 'data', rate: c.expPerModel * c.expDataCost }, { res: 'silicon', rate: c.modelSilicon }];
    // the Insight port carries no base rate: its yield rides on Focus and validation, so the tick sets that flow
    md.outputs = [{ res: 'trials', rate: c.expPerModel }, { res: 'insight', rate: 0 }];
    md.cost = { res: 'data', base: c.modelCost, growth: c.modelGrowth };
    md.flavor = 'It stops being told the answer and starts guessing it.';
    md.mech = 'Runs trials on Data, and yields Insight.';
    sim.addNode(md);

    const goal = base('generalize', 'goal', 'Generalize');
    goal.count = 1;
    goal.inputs = [{ res: 'insight', rate: 0 }];
    goal.flavor = 'A model that performs on data it never saw.';
    sim.addNode(goal);
    restate(sim);
  },

  /** the handoff: Origins has been making Silicon, so the instrument arrives with a buffer and a feed */
  open(sim) {
    const c = C(sim), ds = sim.node('dataset');
    if (ds && !ds.count) { sim.state.stocks.silicon = (sim.state.stocks.silicon || 0) + c.seedSilicon; ds.count = c.seedDatasets; }
    restate(sim);
  },

  tick(sim, dt) {
    const e = E(sim);
    restate(sim);
    // the trials the Fit Engine ran are exactly what the graph moved onto the Trials pipe this tick
    const te = edgeOf(sim, 'model', 'trials');
    const ran = te ? te.flow * dt : 0;
    const ins = ran > 0 ? runExperiment(sim, ran, false) : 0;
    setFlow(sim, 'model', 'insight.store', dt > 0 ? ins / dt : 0);
    setFlow(sim, 'insight.store', 'generalize', Math.max(0, sim.rate('insight')));
    if (e.pred === null && predicting(sim)) e.pred = predictNext(sim);
    if (sim.muted() || e.done) return;                 // offline catch-up: the world does not move unseen
    shiftTick(sim, dt);
  },

  actions: {
    trial: {
      can(sim) { return !E(sim).done && sim.stock('data') >= C(sim).expDataCost; },
      apply(sim) { runExperiment(sim, 1, true); }
    },
    focus: {
      can(sim, a) {
        const c = C(sim), e = E(sim);
        if (!a || typeof a.k !== 'string' || !c.focus[a.k] || e.focus === a.k) return false;
        return a.k !== 'auto' || !!e.flags.autopilot;
      },
      apply(sim, a) {
        const c = C(sim), e = E(sim), S = sim.state;
        // a Focus that stood for a few seconds was a decision; a twitch is not one, and is not scored
        const deliberate = (S.t - e.focAt) >= c.predDwell;
        if (predicting(sim) && e.pred && a.k !== 'auto' && deliberate) {
          e.predN++;
          if (e.pred === a.k) { e.predHits++; e.predStreak++; } else e.predStreak = 0;
        }
        e.focus = a.k;
        e.focAt = S.t;
        if (a.k === 'auto') S.flags.autopilotUsed = true;
        e.pred = predictNext(sim);
        const called = e.predStreak >= c.predStreak || (e.predN >= c.predMinN && e.predHits / e.predN >= c.predRatio);
        if (!e.flags.autopilot && predicting(sim) && called) {
          e.flags.autopilot = true;
          S.flags.autopilot = true;
          e.learnedAt = S.t;
        }
      }
    },
    fund: {
      can(sim, a) {
        if (!a || typeof a.kind !== 'string' || E(sim).done) return false;
        const c = expCost(sim, a.kind);
        return isFinite(c) && sim.stock('data') >= c;
      },
      apply(sim, a) {
        const c = C(sim), e = E(sim), S = sim.state, st = stats(sim);
        S.stocks.data -= expCost(sim, a.kind);
        e.survey = 0;                                   // funding a card spends the survey it discounted
        if (a.kind === 'method') { e.methods[nextMethod(sim).id] = true; restate(sim); return; }
        e.utilLvl[a.kind] = (e.utilLvl[a.kind] || 0) + 1;
        e.utilN = (e.utilN || 0) + 1;
        if (a.kind === 'calibrate') e.gap = Math.max(0, e.gap * c.calibrateCut);
        if (a.kind === 'sweep') e.accuracy = Math.min(1, e.accuracy + c.sweepPush * (1 - e.accuracy));
        if (a.kind === 'distill') S.stocks.insight += c.distillGrant * st.insMult;
      }
    },
    buy: {
      can(sim, a) {
        const n = sim.node(a.node);
        if (!n || !n.cost || n.era !== 3) return false;
        return sim.stock(n.cost.res) >= sim.costOf(a.node, Math.max(1, Math.floor(a.n || 1)));
      },
      apply(sim, a) {
        const n = sim.node(a.node), k = Math.max(1, Math.floor(a.n || 1));
        sim.state.stocks[n.cost.res] -= sim.costOf(a.node, k);
        n.count += k;
        restate(sim);
      }
    },
    pause: {
      can(sim, a) { const n = sim.node(a.node); return !!n && n.kind === 'converter' && n.era === 3 && n.paused !== !!a.on; },
      apply(sim, a) { sim.node(a.node).paused = !!a.on; }
    },
    generalize: {
      can(sim) { return !E(sim).done && effAccuracy(sim) >= C(sim).genThreshold; },
      apply(sim) {
        E(sim).done = true;
        sim.openEra(4);                                 // a no-op until the Deep module is installed alongside
      }
    }
  },

  goal(sim) {
    const c = C(sim), e = E(sim), eff = effAccuracy(sim);
    return {
      progress: e.done ? 1 : Math.max(0, Math.min(1, eff / c.genThreshold)),
      ready: !e.done && eff >= c.genThreshold,
      label: (eff * 100).toFixed(0) + ' / ' + (c.genThreshold * 100).toFixed(0) + '% validation'
    };
  },

  /** the voice: it names what it thinks you will do, and once, that it can do it */
  voice(sim) {
    const c = C(sim), e = E(sim);
    if (e.flags.autopilot && sim.state.t - e.learnedAt < c.voiceHold) return line('learned');
    if (!predicting(sim) || !e.pred || e.focus === 'auto') return null;
    return line('expects') + ' ' + String(e.pred).toUpperCase();
  },

  layout: { anchors: ANCHORS, verbs: ['trial'], goal: 'generalize' },

  done(sim) { return !!E(sim).done; }
};

statistical.policy = policy;
statistical.milestoneOf = milestoneOf;
export default statistical;
