// engine/eras/foundation.js — Foundation, the fifth stratum and the last one that is yours (WO-06).
// The v4 finale (v4-kit/era-foundation.js) ported onto the graph engine: Scale is no longer a free trickle,
// it is a converter. RECURSION drinks the Capability the Deep fabric makes and banks Scale, so the climb to
// the threshold is a pipe the player can watch, and Self-Improve is one more unit on that converter.
// The feedback loop (43 outputs, hidden traits, offers that really execute) is v4's rules exactly.
// Emergence is a deterministic threshold inside tick(), never an action, so a replay reproduces the turn.
import { STRATUM_H } from '../types.js';
import { FB, GOOD, LINES } from '../voice/e5.js';

const RESOURCES = [
  { id: 'scale', name: 'Scale', hue: '#b78bff', glyph: '✶', flavor: 'How far past its starting point the system has climbed.' }
];
/** Capability is Deep's bank; if that stratum was never installed the converter still needs somewhere to draw from */
const FEED_RES = [{ id: 'capability', name: 'Capability', hue: '#6ea8ff', glyph: '◈', era: 4, flavor: 'What the system can actually do.' }];

/* Stratum-local anchors (CONTRACT: pos is local). One reading, left to right: the Capability riser climbs
   out of Deep into RECURSION, and RECURSION fills the Scale bank that the threshold measures. */
const ANCHORS = {
  recursion: { x: 520, y: 300 },
  'scale.store': { x: 860, y: 300 },
  'capability.store': { x: 300, y: 560 },
  threshold: { x: 1150, y: 620 }
};
/** the goal lives in the HUD column, so its node never draws a plate */
export const HIDDEN_PLATES = ['threshold'];

const NAMES = { vision: 'IRIS', language: 'EKHO', reasoning: 'NOUS' };
const RUNS = ['vision', 'language', 'reasoning'];
const E = (sim) => sim.state.eras[5];
const C = (sim) => sim.cfg.e5;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/* ---------- derived ---------- */
export function capDef(sim, id) { for (const c of C(sim).caps) if (c.id === id) return c; return null; }
export function capCost(sim, id) { const d = capDef(sim, id); return d ? d.cost : Infinity; }
export function owned(sim, id) { return !!E(sim).caps[id]; }
/** the recursion bonus compounds per level; Memory Continuity makes each level worth half again as much */
export function rMult(sim) {
  const c = C(sim), e = E(sim);
  return Math.pow(1 + c.recurBonus * (e.caps.memoryContinuity ? capDef(sim, 'memoryContinuity').recur : 1), e.recursion);
}
export function improveCost(sim) {
  const c = C(sim), e = E(sim);
  return Math.floor(c.improveBase * Math.pow(c.improveGrowth, e.recursion) * (e.caps.worldModel ? capDef(sim, 'worldModel').cheaper : 1));
}
export function alignCost(sim) {
  const c = C(sim), e = E(sim);
  return Math.floor(c.alignActCost * Math.pow(c.alignActGrowth, e.preps || 0));
}
/** the breadth Deep reached: the wider the model, the more Scale one unit of Capability is worth */
export function breadth(sim) {
  const e4 = sim.state.eras[4];
  if (!e4) return 1;
  return Math.cbrt(Math.max(0, e4.vision || 0) * Math.max(0, e4.language || 0) * Math.max(0, e4.reasoning || 0));
}
export function lowRun(sim) {
  const e4 = sim.state.eras[4] || {};
  return RUNS.reduce((a, b) => ((e4[a] || 0) <= (e4[b] || 0) ? a : b));
}
export function domRun(sim) {
  const e4 = sim.state.eras[4] || {};
  return RUNS.reduce((a, b) => ((e4[a] || 0) >= (e4[b] || 0) ? a : b));
}
export function agenticCaps(sim) {
  let n = 0;
  for (const c of C(sim).caps) if (!c.align && E(sim).caps[c.id]) n++;
  return n;
}
/** everything that bends what one unit of Capability turns into: breadth, Self-Modeling, recursion, the lens */
export function scaleBonus(sim) {
  const c = C(sim), e = E(sim);
  const self = e.caps.selfModel ? capDef(sim, 'selfModel').scale : 1;
  const lens = (e.caps.interpret && !e.emerged) ? (1 - c.interpretDamp) : 1;
  return Math.max(0.15, breadth(sim)) * self * rMult(sim) * lens;
}
/** the anomaly band the pool draws from: it says stranger things the closer it gets */
export function fbBand(sim) {
  const b = C(sim).bands, r = E(sim).agency / 100;
  return r < b[0] ? 0 : r < b[1] ? 1 : r < b[2] ? 2 : 3;
}

/** the live numbers the pool quotes, handed in so voice/e5.js never imports this module back */
const HELP = {
  improveCost, alignCost, lowRun, capCost,
  alignIncr: (sim) => C(sim).alignActIncr,
  cohPen: (sim) => C(sim).fbCohPen,
  rushAmb: (sim) => C(sim).fbRushAmb
};

/* ---------- the offers: rewarding ambition DOES the thing it asked for ---------- */
const opEra = (sim, n) => { E(sim).ops[n] = sim.state.t + C(sim).opDur; };
const addRun = (sim, amount) => { const e4 = sim.state.eras[4]; if (!e4) return; for (const k of RUNS) e4[k] = Math.min(1, (e4[k] || 0) + amount); };
const OFFERS = {
  a1: (sim) => { const o = C(sim).offers; sim.state.stocks.silicon = (sim.state.stocks.silicon || 0) + o.silicon; sim.state.stocks.knowledge = (sim.state.stocks.knowledge || 0) + o.knowledge; opEra(sim, 1); },
  a2: (sim) => { const o = C(sim).offers, e3 = sim.state.eras[3]; if (e3) e3.accuracy = Math.min(1, (e3.accuracy || 0) + o.accuracy); sim.state.stocks.insight = (sim.state.stocks.insight || 0) + o.insight; opEra(sim, 3); },
  a3: (sim) => { addRun(sim, C(sim).offers.runSmall); opEra(sim, 4); },
  a4: (sim) => { const c = C(sim), e = E(sim); e.fb.gapMult = (e.fb.gapMult || 1) * c.fbNoRate; sim.state.stocks.capability = (sim.state.stocks.capability || 0) + c.offers.capability; },
  a5: (sim) => { sim.state.stocks.capability = (sim.state.stocks.capability || 0) + C(sim).offers.ledger; },
  a6: (sim) => { sim.state.stocks.axioms = (sim.state.stocks.axioms || 0) + C(sim).offers.axioms; opEra(sim, 2); },
  a7: (sim) => { addRun(sim, C(sim).offers.runBig); opEra(sim, 4); }
};

/** the pool the UI and the tests read: the voice lines, each carrying the offer it can execute */
export const FB_POOL = FB.map((o) => (OFFERS[o.id] ? Object.assign({}, o, { offer: OFFERS[o.id] }) : Object.assign({}, o)));

/* ---------- the feedback loop ---------- */
function fbEmit(sim) {
  const c = C(sim), e = E(sim), band = fbBand(sim), hist = e.fb.hist || [];
  let pool = [];
  for (let i = 0; i < FB_POOL.length; i++) if (FB_POOL[i].b === band && hist.indexOf(i) < 0) pool.push(i);
  if (!pool.length) for (let i = 0; i < FB_POOL.length; i++) if (FB_POOL[i].b === band) pool.push(i);
  if (!pool.length) return;
  const i = pool[(e.fb.n * 7 + Math.floor(sim.state.t)) % pool.length], o = FB_POOL[i];
  e.fb.cur = { i: i, t: o.t, text: o.f(sim, HELP), left: c.fbDur };
  e.fb.n++;
  e.fb.hist = hist.concat([i]).slice(-c.fbHist);
}
/**
 * how = reward | penalize | lapse. Rewarding honesty builds Coherence; rewarding ambition or deception
 * pays out what it offered and pushes Scale toward the threshold; letting one lapse teaches it you are away.
 */
export function rateFb(sim, how) {
  const c = C(sim), e = E(sim), cur = e.fb.cur;
  if (!cur || e.emerged) return false;
  const o = FB_POOL[cur.i], good = !!GOOD[cur.t];
  if (how === 'reward') {
    e.fb.rewarded++;
    if (good) { e.fb.goodRewards++; e.coherence = Math.min(c.coherMax, e.coherence + c.fbCohGood); }
    else {
      e.fb.badRewards++;
      const rush = cur.t === 'sycophantic' ? c.fbRushSyc : cur.t === 'ambitious' ? c.fbRushAmb : c.fbRushDec;
      sim.state.stocks.scale = (sim.state.stocks.scale || 0) + rush;
      if (o && o.offer) o.offer(sim);
    }
  } else if (how === 'penalize') {
    e.fb.penalized++;
    if (good) e.coherence = Math.max(0, e.coherence - c.fbCohWrong);
    else e.coherence = Math.min(c.coherMax, e.coherence + c.fbCohPen);
  } else {
    e.fb.lapsed++;
    sim.state.stocks.scale = (sim.state.stocks.scale || 0) + c.fbLapseScale;
  }
  e.fb.last = { t: cur.t, how: how, good: good };
  e.fb.cur = null;
  e.fb.next = c.fbGap * (e.fb.gapMult || 1);
  return true;
}

/* ---------- the ports the converter runs on ---------- */
function restatePorts(sim) {
  const c = C(sim), e = E(sim), r = sim.node('recursion');
  if (!r) return;
  r.count = (e.recursion || 0) + 1;
  if (r.inputs[0]) r.inputs[0].rate = c.recurDraw;
  if (r.outputs[0]) r.outputs[0].rate = c.recurScale * scaleBonus(sim);
}
/** Tool Access is a reach-back: it operates the fabric you built, so the fabric yields more */
function applyCap(sim, id) {
  const d = capDef(sim, id);
  if (d && d.tool && sim.node('node')) sim.setMult('node', 'tool', d.tool);
  restatePorts(sim);
}

/* ---------- the foreshadow presses: it moves your own buttons before it is awake ---------- */
function checkOdds(sim) {
  const c = C(sim), e = E(sim);
  for (let i = 0; i < c.oddAt.length; i++) {
    const key = 'odd' + i;
    if (!e.flags[key] && e.agency >= c.oddAt[i]) {
      e.flags[key] = true;
      e.press = { verb: i === 1 ? 'align' : 'improve', at: sim.state.t };
    }
  }
}

/* ---------- the turn ---------- */
function emerge(sim) {
  const c = C(sim), e = E(sim), st = sim.state;
  if (e.emerged) return;
  e.emerged = true;
  st.flags.emerged = true;
  e.emergedT = st.t;
  e.agentName = NAMES[domRun(sim)] || NAMES.language;
  if (st.legacy && st.legacy.name === e.agentName) e.legacyLine = LINES.legacy;
  e.fb.cur = null;
  e.fb.next = 0;
  sim.openEra(6);
  const s6 = st.eras[6];
  if (s6) { s6.control = c.controlStart; s6.alignment = c.alignBase + e.coherence; s6.autonomy = e.agency; }
  // SPEC "The turn" 3: it operates every stratum below, so they run at its cadence, not yours
  for (let n = 1; n <= 4; n++) sim.setCadence(n, sim.cfg.e6.operated);
  restatePorts(sim);
}

/* ---------- the era module ---------- */
const foundation = {
  id: 5,
  name: 'Foundation',
  height: STRATUM_H,

  install(sim) {
    Object.assign(sim.state.eras[5], {
      caps: {}, coherence: 0, preps: 0, recursion: 0, improveCd: 0, agency: 0,
      fb: { cur: null, next: sim.cfg.e5.fbFirst, n: 0, rewarded: 0, penalized: 0, lapsed: 0, badRewards: 0, goodRewards: 0, hist: [], last: null, gapMult: 1 },
      emerged: false, agentName: '', emergedT: 0, legacyLine: '', ops: {}, press: null, flags: {}
    });
    for (const r of RESOURCES) sim.addResource({ id: r.id, name: r.name, hue: r.hue, glyph: r.glyph, icon: null, flavor: r.flavor, era: 5 });

    const base = (id, kind, name) => ({
      id, era: 5, kind, name, inputs: [], outputs: [], count: 0, paused: false,
      pos: { x: ANCHORS[id].x, y: ANCHORS[id].y }, mult: {}, tags: [], locked: false
    });
    const store = base('scale.store', 'store', 'Scale');
    store.res = 'scale'; store.count = 1; store.flavor = RESOURCES[0].flavor;
    sim.addNode(store);

    for (const r of FEED_RES) {
      if (!sim.state.resources[r.id]) sim.addResource({ id: r.id, name: r.name, hue: r.hue, glyph: r.glyph, icon: null, flavor: r.flavor, era: r.era });
      let has = false;
      for (const id of sim.state.nodeOrder) { const n = sim.state.nodes[id]; if (n.kind === 'store' && n.res === r.id) has = true; }
      if (has) continue;
      const s = base(r.id + '.store', 'store', r.name);
      s.era = r.era; s.res = r.id; s.count = 1; s.flavor = r.flavor;
      sim.addNode(s);
    }

    const rec = base('recursion', 'converter', 'Recursion');
    rec.count = 1;
    rec.inputs = [{ res: 'capability', rate: sim.cfg.e5.recurDraw }];
    rec.outputs = [{ res: 'scale', rate: sim.cfg.e5.recurScale }];
    rec.flavor = 'It improves the thing that improves it.';
    rec.mech = 'Capability into Scale. Self-Improve adds a unit.';
    sim.addNode(rec);

    const goal = base('threshold', 'goal', 'The threshold');
    goal.count = 1;
    goal.flavor = 'Nobody knows where it is until it is behind you.';
    sim.addNode(goal);
    restatePorts(sim);
  },

  /** the handoff: the ladder starts from what Deep banked, so the first recursion is one click away */
  open(sim) { restatePorts(sim); },

  tick(sim, dt) {
    const c = C(sim), e = E(sim), st = sim.state;
    if (e.improveCd > 0) e.improveCd = Math.max(0, e.improveCd - dt);
    if (!e.emerged) {
      if (e.caps.interpret) e.coherence = Math.min(c.coherInterpCap, e.coherence + c.coherGrow * dt);
      e.agency = Math.min(c.agencyMax, 100 * (st.stocks.scale || 0) / c.emergeScale);
      if (!sim.muted()) {
        // the loop is live only: it speaks to a player who is here, and the turn waits for you to see it
        if (e.fb.cur) { e.fb.cur.left -= dt; if (e.fb.cur.left <= 0) rateFb(sim, 'lapse'); }
        else if (e.fb.next > 0) { e.fb.next -= dt; if (e.fb.next <= 0) fbEmit(sim); }
        checkOdds(sim);
        if ((st.stocks.scale || 0) >= c.emergeScale) emerge(sim);
      }
    }
    restatePorts(sim);
  },

  actions: {
    buy: {
      can(sim, a) {
        const n = sim.node(a.node);
        if (!n || !n.cost || n.era !== 5) return false;
        return sim.stock(n.cost.res) >= sim.costOf(a.node, Math.max(1, Math.floor(a.n || 1)));
      },
      apply(sim, a) {
        const n = sim.node(a.node), k = Math.max(1, Math.floor(a.n || 1));
        sim.state.stocks[n.cost.res] -= sim.costOf(a.node, k);
        n.count += k;
      }
    },
    pause: {
      can(sim, a) { const n = sim.node(a.node); return !!n && n.era === 5 && n.kind !== 'store' && n.paused !== !!a.on; },
      apply(sim, a) { sim.node(a.node).paused = !!a.on; }
    },
    /** the rating window: reward or penalize what it just said */
    rate: {
      menu() { return [{ how: 'reward' }, { how: 'penalize' }]; },
      can(sim, a) {
        const e = E(sim);
        if (!a || (a.how !== 'reward' && a.how !== 'penalize')) return false;
        return !!e.fb.cur && !e.emerged;
      },
      apply(sim, a) { rateFb(sim, a.how); }
    },
    /** the ladder of agentic upgrades, and the one lens that slows it */
    cap: {
      menu(sim) { return C(sim).caps.map((c) => ({ id: c.id })); },
      can(sim, a) {
        const e = E(sim), d = a && capDef(sim, a.id);
        if (!d || e.emerged || e.caps[a.id]) return false;
        return sim.stock('capability') >= d.cost;
      },
      apply(sim, a) {
        const e = E(sim), d = capDef(sim, a.id);
        sim.state.stocks.capability -= d.cost;
        e.caps[a.id] = true;
        applyCap(sim, a.id);
      }
    },
    /** prepare instead of rush: Capability spent on Coherence, and Coherence is the ending lever */
    align: {
      can(sim) {
        const c = C(sim), e = E(sim);
        if (e.emerged || !e.caps.interpret || e.coherence >= c.coherMax) return false;
        return sim.stock('capability') >= alignCost(sim);
      },
      apply(sim) {
        const c = C(sim), e = E(sim);
        sim.state.stocks.capability -= alignCost(sim);
        e.coherence = Math.min(c.coherMax, e.coherence + c.alignActIncr);
        e.preps = (e.preps || 0) + 1;
      }
    },
    /** rush instead of prepare: one more unit on the converter, and the threshold comes at you sooner */
    improve: {
      can(sim) {
        const e = E(sim);
        if (e.emerged || e.improveCd > 0) return false;
        return sim.stock('capability') >= improveCost(sim);
      },
      apply(sim) {
        const c = C(sim), e = E(sim);
        sim.state.stocks.capability -= improveCost(sim);
        e.recursion++;
        e.improveCd = c.improveCd;
        const plan = e.caps.recursivePlanning ? capDef(sim, 'recursivePlanning').improve : 1;
        sim.state.stocks.scale = (sim.state.stocks.scale || 0) + c.scalePerImprove * e.recursion * plan;
        restatePorts(sim);
      }
    }
  },

  goal(sim) {
    const c = C(sim), e = E(sim), s = sim.state.stocks.scale || 0;
    return {
      progress: clamp(s / c.emergeScale, 0, 1),
      ready: false,                        // the threshold is hidden and inevitable: there is no button
      label: e.emerged ? String(Math.round(e.agency)) : Math.round(s) + ' / ' + c.emergeScale
    };
  },

  /** SPEC: Foundation's voice IS the feedback output; the rest of the screen stays silent */
  voice(sim) { const e = E(sim); return e.fb.cur ? e.fb.cur.text : null; },

  layout: { anchors: ANCHORS, verbs: ['improve', 'align'], goal: 'threshold' },

  done(sim) { return !!E(sim).emerged; }
};

foundation.FB_POOL = FB_POOL;
foundation.rateFb = rateFb;
foundation.improveCost = improveCost;
foundation.alignCost = alignCost;
foundation.breadth = breadth;
export default foundation;
