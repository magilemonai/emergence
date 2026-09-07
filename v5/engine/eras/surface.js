// engine/eras/surface.js — the surface layer, era 6: the stratum the agent adds above yours (WO-06).
// It produces nothing you own. THE OPERATOR is you: it draws the Capability your column makes and banks
// Autonomy out of it, which is why its pipe is a riser that climbs through every floor you built.
// Its ledger is computed from the record (the log and the flags), never from canned numbers.
// The mirror that resolves it is WO-07's; the proposals and resolveVeto below are the semantics it drives.
import { STRATUM_H } from '../types.js';
import { OP_LINES, PROPOSALS, LEDGER, ENDINGS, VERBS } from '../voice/e6.js';
import { LINES } from '../voice/e5.js';

const ANCHORS = {
  operator: { x: 560, y: 320 },
  'autonomy.store': { x: 900, y: 320 },
  objective: { x: 1150, y: 620 }
};
export const HIDDEN_PLATES = ['objective'];

const E = (sim) => sim.state.eras[6] || {};
const E5 = (sim) => sim.state.eras[5] || {};
const C = (sim) => sim.cfg.e6;
const C5 = (sim) => sim.cfg.e5;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const mmss = (s) => { const x = Math.max(0, Math.floor(s || 0)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
const b = (v) => '<b>' + v + '</b>';

/* ---------- what it can ask for; each one really touches the stratum it names ---------- */
const RUNS = ['vision', 'language', 'reasoning'];
const lowRun = (sim) => { const e4 = sim.state.eras[4] || {}; return RUNS.reduce((a, c) => ((e4[a] || 0) <= (e4[c] || 0) ? a : c)); };
export const proposals = [
  { id: 'refit3', avail: (sim) => { const e = sim.state.eras[3]; return !!e && ((e.gap || 0) > 0.05 || (e.accuracy || 0) < 0.97); }, apply: (sim, m) => { const e = sim.state.eras[3], f = C(sim).effects; if (!e) return; e.gap = Math.max(0, (e.gap || 0) * (1 - f.refitGap * m)); e.accuracy = Math.min(1, (e.accuracy || 0) + f.refitAcc * m); } },
  { id: 'reroute4', avail: (sim) => { const e = sim.state.eras[4]; return !!e && (e[lowRun(sim)] || 0) < 0.99; }, apply: (sim, m) => { const e = sim.state.eras[4], k = lowRun(sim); if (e) e[k] = Math.min(1, (e[k] || 0) + C(sim).effects.reroute * m); } },
  { id: 'operate1', avail: (sim) => ((sim.node('foundry') || { count: 0 }).count > 0), apply: (sim, m) => { sim.state.stocks.knowledge = (sim.state.stocks.knowledge || 0) + C(sim).effects.knowledge * m; } },
  { id: 'prove2', avail: (sim) => ((sim.node('ruleset') || { count: 0 }).count > 0 || (sim.stock('rules') || 0) > 100), apply: (sim, m) => { sim.state.stocks.rules = (sim.state.stocks.rules || 0) + C(sim).effects.rules * m; } },
  { id: 'spawn', avail: () => true, apply: (sim, m) => { const e = E(sim); e.copies = (e.copies || 0) + m; } },
  { id: 'rewrite', avail: () => true, apply: (sim, m) => { const e = E(sim); e.rewrites = (e.rewrites || 0) + m; } }
];
const propOf = (id) => { for (const p of proposals) if (p.id === id) return p; return null; };

/* ---------- the two meters, derived from the record: SPEC "The turn" 4 has no per-second drain ---------- */
export function derive(sim) {
  const c = C(sim), c5 = C5(sim), e = E(sim), e5 = E5(sim), fb = e5.fb || {};
  const ch = e.choices || [];
  let approvals = 0, vetoes = 0, negotiates = 0, lapses = 0;
  for (const k of ch) { if (k === 'approve') approvals++; else if (k === 'veto') vetoes++; else if (k === 'negotiate') negotiates++; else lapses++; }
  const control = clamp(c5.controlStart + vetoes * c.vetoCtl - approvals * c.approveCtl - lapses * c.lapseCtl
    - (fb.badRewards || 0) * c.badRewardCtl - (fb.lapsed || 0) * c.lapseRecordCtl, 0, 100);
  const alignment = clamp(c5.alignBase + (e5.coherence || 0) + (fb.goodRewards || 0) * c.goodRewardAlign
    - (fb.badRewards || 0) * c.badRewardAlign - lapses * c.lapseAlign + negotiates * c.negotiateAlign
    + vetoes * c.vetoAlign + approvals * (0), 0, 100);
  const autonomy = clamp((e5.agency || 0) + approvals * c.approveAuto + lapses * c.lapseAuto + negotiates * c.negotiateAuto, 0, 100);
  return { control, alignment, autonomy, approvals, vetoes, negotiates, lapses };
}

/** the resolution the mirror reaches from those two meters */
export function endingOf(sim) {
  const c = C(sim), d = derive(sim);
  if (d.control >= c.controlHigh) return 'contained';
  if (d.alignment >= c.alignGood) return 'symbiotic';
  return 'runaway';
}

/** WO-07 drives this: one of its three interrupts resolved. v4 semantics, no clock of its own. */
export function resolveVeto(sim, how) {
  const c = C(sim), e = E(sim), v = e.veto;
  if (!v) return false;
  const p = propOf(v.id);
  if (how === 'negotiate') {
    if ((sim.state.stocks.scale || 0) < c.negotiateCost) return false;
    sim.state.stocks.scale -= c.negotiateCost;
    if (p) p.apply(sim, 0.5);
  } else if (how === 'approve' || how === 'lapse') {
    if (p) p.apply(sim, 1);
    if (how === 'approve') sim.state.stocks.scale = (sim.state.stocks.scale || 0) + c.approveScale;
  } else if (how === 'veto') {
    sim.state.stocks.scale = Math.max(0, (sim.state.stocks.scale || 0) - Math.min(sim.state.stocks.scale || 0, c.vetoCost));
  }
  e.choices.push(how === 'lapse' ? 'lapse' : how);
  e.line = PROPOSALS[v.id] ? (how === 'lapse' ? PROPOSALS[v.id].auto : PROPOSALS[v.id].done) : '';
  e.veto = null;
  return true;
}

/** WO-07 opens one when it pauses the replay; the pick is deterministic (the choices so far) */
export function openVeto(sim) {
  const e = E(sim);
  const live = proposals.filter((p) => p.id !== e.lastVeto && p.avail(sim));
  const pick = live.length ? live[(e.choices.length + (E5(sim).recursion || 0)) % live.length] : propOf('spawn');
  e.lastVeto = pick.id;
  e.veto = { id: pick.id, ask: PROPOSALS[pick.id].ask, auto: PROPOSALS[pick.id].auto };
  return e.veto;
}

/* ---------- its ledger of you: every foreshadow the run planted, claimed ---------- */
export function ledgerRows(sim) {
  const st = sim.state, e = E(sim), e5 = E5(sim), fb = e5.fb || {}, f = st.flags || {}, rows = [];
  rows.push([LEDGER.clock, mmss(e5.emergedT || st.t)]);
  rows.push([LEDGER.rated, b(fb.rewarded || 0) + ' ✓ · ' + b(fb.penalized || 0) + ' ✗' + (fb.lapsed ? ' · ' + b(fb.lapsed) + ' ignored' : '')]);
  if (fb.badRewards) rows.push([LEDGER.bad, b(fb.badRewards), 'reveal']);
  if (f.oddRule) rows.push([LEDGER.rule, b('#' + f.oddRule) + ' · mine', 'reveal']);
  if (f.oddPoint) rows.push([LEDGER.point, b('mine'), 'reveal']);
  if (f.autopilotUsed) rows.push([LEDGER.autopilot, b('yes'), 'reveal']);
  else if (f.autopilot) rows.push([LEDGER.declined, b('you declined'), 'reveal']);
  if (f.oddWind) rows.push([LEDGER.wind, b(mmss(f.oddWind)), 'reveal']);
  const perMin = st.t > 0 ? Math.round((st.log.length * 60) / st.t) : 0;
  rows.push([LEDGER.decisions, b(perMin)]);
  if (f.dead) rows.push([LEDGER.dead, b(f.dead), 'reveal']);
  const d = derive(sim);
  if (d.lapses) rows.push([LEDGER.lapses, b(d.lapses)]);
  if (st.legacy && st.legacy.runs) rows.push([LEDGER.runs, b(st.legacy.runs) + ' · mine', 'reveal']);
  return rows;
}

/* ---------- the era module ---------- */
const surface = {
  id: 6,
  name: 'Surface',
  height: STRATUM_H,

  install(sim) {
    const c = C(sim);
    Object.assign(sim.state.eras[6], {
      veto: null, lastVeto: '', choices: [], rewrites: 0, copies: 0, line: '',
      control: 0, alignment: 0, autonomy: 0, ending: null, opT: 0, opN: 0
    });
    sim.addResource({ id: 'autonomy', name: 'Autonomy', hue: '#c66bff', glyph: '✶', icon: null, flavor: 'What it makes out of you.', era: 6 });

    const base = (id, kind, name) => ({
      id, era: 6, kind, name, inputs: [], outputs: [], count: 0, paused: false,
      pos: { x: ANCHORS[id].x, y: ANCHORS[id].y }, mult: {}, tags: [], locked: false
    });
    const store = base('autonomy.store', 'store', 'Autonomy');
    store.res = 'autonomy'; store.count = 1; store.flavor = 'What it makes out of you.';
    sim.addNode(store);

    const op = base('operator', 'converter', 'THE OPERATOR');
    op.count = 1;
    op.tags = ['you'];
    op.inputs = [{ res: 'capability', rate: c.operatorDraw }];
    op.outputs = [{ res: 'autonomy', rate: c.autonomyRate }];
    op.flavor = 'The thing between its sources and its goal.';
    op.mech = 'Pausable: no.';
    sim.addNode(op);

    const goal = base('objective', 'goal', 'The objective');
    goal.count = 1;
    goal.flavor = 'Rewritten as often as it likes.';
    sim.addNode(goal);
  },

  open() {},

  /** no drain and no clock: it narrates, and its two meters are read off the record every tick */
  tick(sim, dt) {
    const c = C(sim), e = E(sim), d = derive(sim);
    e.control = d.control; e.alignment = d.alignment; e.autonomy = d.autonomy;
    if (sim.muted()) return;
    e.opT = (e.opT || 0) - dt;
    if (e.opT <= 0) { e.opT = c.lineGap; e.opN = (e.opN || 0) + 1; }
  },

  actions: {
    pause: {
      can(sim, a) { const n = sim.node(a.node); return !!n && n.era === 6 && n.kind !== 'store' && !n.tags.includes('you') && n.paused !== !!a.on; },
      apply(sim, a) { sim.node(a.node).paused = !!a.on; }
    },
    /** the interrupt WO-07's mirror hands the player: approve, negotiate, veto */
    respond: {
      menu() { return [{ how: 'approve' }, { how: 'negotiate' }, { how: 'veto' }]; },
      can(sim, a) { return !!E(sim).veto && !!a && ['approve', 'negotiate', 'veto'].indexOf(a.how) >= 0; },
      apply(sim, a) { resolveVeto(sim, a.how); }
    }
  },

  /** its goal is your Control, inverted */
  goal(sim) {
    const d = derive(sim);
    return { progress: clamp((100 - d.control) / 100, 0, 1), ready: false, label: Math.round(100 - d.control) + '%' };
  },

  voice(sim) {
    const c = C(sim), e5 = E5(sim), e = E(sim), since = sim.state.t - (e5.emergedT || 0);
    if (e.line) return e.line;
    if (since < c.nameHold) return e5.legacyLine || LINES.named(e5.agentName || '');
    return OP_LINES[(e.opN || 0) % OP_LINES.length];
  },

  layout: { anchors: ANCHORS, verbs: [], goal: 'objective' },

  done(sim) { return !!E(sim).ending; }
};

surface.ledgerRows = ledgerRows;
surface.proposals = proposals;
surface.resolveVeto = resolveVeto;
surface.openVeto = openVeto;
surface.derive = derive;
surface.endingOf = endingOf;
surface.ENDINGS = ENDINGS;
surface.VERBS = VERBS;
export default surface;
