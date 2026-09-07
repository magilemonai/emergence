// render/eras/endcard.js — the last card of the run (WO-08, SPEC "The turn" 5).
// It sits over the overview, so the column you built stays behind every word of it: the ending's name, the
// epilogue the run earned, the timeline of your five strata with its grade, and two ways out (the receipt,
// or again). Every number comes from the state; every sentence comes from engine/voice/e7.js.
// BUILD-ONCE: the card builds itself in createView and sync() only rewrites what changed.

import { setTxt, setVar } from '../hud.js';
import { STRATA } from '../palette.js';
import cfg from '../../engine/cfg.js';
import { ENDINGS } from '../../engine/voice/e6.js';
import { epilogue, builtLine, GRADE_READS, mmss } from '../../engine/voice/e7.js';
import { tally } from '../../engine/receipt.js';
import { derive } from '../../engine/eras/surface.js';

const ERA_NAMES = ['Origins', 'Symbolic', 'Statistical', 'Deep', 'Foundation'];
const GRADE_HUE = { S: '#c9adf5', A: '#a9d8ce', B: '#e0a93f', C: '#ef9f56', D: '#ff6b8a' };
const obj = (v) => (v && typeof v === 'object' ? v : {});

/** which ending this run reached: the mirror's word first, then the surface's, then the flag */
export function endingOf(state) {
  const s = obj(state);
  const e7 = obj(obj(s.eras)[7]), e6 = obj(obj(s.eras)[6]);
  return e7.ending || obj(s.flags).ending || e6.ending || 'runaway';
}

/** the two meters, from the surface's own record if it kept one, else derived from the log */
export function metersOf(sim) {
  const e6 = obj(obj(sim.state.eras)[6]);
  if (e6.control || e6.alignment || e6.autonomy) return { control: e6.control, alignment: e6.alignment, autonomy: e6.autonomy };
  try { return derive(sim); } catch (e) { return { control: 0, alignment: 0, autonomy: 0 }; }
}

/**
 * grade(state, meters): v4's Emergence Quality, on v5 numbers. A fast, aligned, still-governed run scores S.
 * Every weight is cfg.e7.endcard.
 */
export function grade(state, meters) {
  const C = cfg.e7.endcard;
  const emergedT = obj(obj(state.eras)[5]).emergedT || 0;
  const speed = emergedT > 0 ? Math.max(0, C.quality.speedBase - (emergedT / 60 - C.quality.speedMin) * C.quality.speedFall) : 0;
  const q = Math.round(Math.min(100, (meters.alignment || 0) * C.quality.align + (meters.control || 0) * C.quality.control + speed));
  const cut = C.gradeCut;
  const letter = q >= cut.S ? 'S' : q >= cut.A ? 'A' : q >= cut.B ? 'B' : q >= cut.C ? 'C' : 'D';
  return { q: q, letter: letter, read: GRADE_READS[letter] };
}

/** the timeline: how long each stratum took and when you reached the top of it, read off the log */
export function timeline(state) {
  const t = tally(state);
  const rows = [];
  for (let n = 1; n <= 5; n++) {
    const start = t.starts[n];
    if (start === undefined) continue;
    rows.push({ era: n, name: ERA_NAMES[n - 1], took: t.span[n], at: start + t.span[n] });
  }
  return rows;
}

/** what the epilogue asks the run about itself */
function facts(sim, meters) {
  const s = sim.state;
  const e5 = obj(obj(s.eras)[5]), e6 = obj(obj(s.eras)[6]), fb = obj(e5.fb);
  const ch = e6.choices || [];
  let vetoes = 0, approvals = 0;
  for (const k of ch) { if (k === 'veto') vetoes++; else if (k === 'approve') approvals++; }
  const d = (meters && typeof meters.lapses === 'number') ? meters : (function () { try { return derive(sim); } catch (e) { return {}; } })();
  return {
    emergedT: e5.emergedT || 0, endT: s.t || 0,
    lapses: d.lapses || 0, negotiates: d.negotiates || 0,
    constrains: vetoes, delegates: approvals,
    badRewards: fb.badRewards || 0, feedbacks: fb.n || 0
  };
}

/**
 * createView({hud, world, sim, ending, reduced, doc, onRestart}) -> { root, sync, activate, deactivate, cancel }
 * The card mounts beside the HUD (the HUD fades to nothing in the overview) and never scrolls the page.
 */
export function createView(opts) {
  const o = opts || {};
  const sim = o.sim, hud = o.hud;
  const doc = o.doc || (hud && hud.root && hud.root.ownerDocument) || document;
  const host = (hud && hud.root && hud.root.parentNode) || doc.body;
  const win = doc.defaultView;
  const C = cfg.e7.endcard;
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };

  // the same convention app.js uses for a stratum's stylesheet; the packaged build has it inlined already,
  // so a link that cannot load takes itself back out
  if (!doc.querySelector('link[data-ecd]')) {
    const link = doc.createElement('link');
    link.rel = 'stylesheet'; link.href = './render/eras/endcard.css';
    link.setAttribute('data-ecd', '1');
    link.onerror = () => link.remove();
    doc.head.appendChild(link);
  }

  const state = sim.state;
  const ending = o.ending || endingOf(state);
  const text = ENDINGS[ending] || ENDINGS.runaway;
  const meters = metersOf(sim);
  const g = grade(state, meters);
  const e5 = obj(obj(state.eras)[5]);

  const page = el('ecd'); page.setAttribute('role', 'region');
  const col = el('ecd-col'); page.appendChild(col);

  const head = el('ecd-head');
  const sig = el('ecd-sig'); setTxt(sig, '◉');
  const title = el('ecd-title'); setTxt(title, text.title);
  head.appendChild(sig); head.appendChild(title);
  col.appendChild(head);
  const body = el('ecd-body'); setTxt(body, text.body); col.appendChild(body);

  const ep = el('ecd-ep');
  epilogue(ending, facts(sim, meters)).forEach((l, i) => {
    const d = el(); setTxt(d, l);
    d.style.animationDelay = (i * C.lineMs / 1000).toFixed(2) + 's';
    ep.appendChild(d);
  });
  col.appendChild(ep);

  const built = el('ecd-built'); setTxt(built, builtLine(e5.agentName || '')); col.appendChild(built);

  const recap = el('ecd-recap');
  const gradeBox = el('ecd-grade');
  const gEl = el('ecd-g'); setTxt(gEl, g.letter); setVar(gEl, '--gh', GRADE_HUE[g.letter] || GRADE_HUE.B);
  const qEl = el('ecd-q'); setTxt(qEl, 'QUALITY ' + g.q + '/100');
  const readEl = el('ecd-read'); setTxt(readEl, g.read);
  gradeBox.appendChild(gEl); gradeBox.appendChild(qEl); gradeBox.appendChild(readEl);

  const rows = el('ecd-rows');
  const hd = el('ecd-row ecd-hd');
  const hdA = el('ecd-era', 'span'); setTxt(hdA, 'STRATUM');
  const hdB = el('ecd-took', 'span'); setTxt(hdB, 'TOOK');
  const hdC = el('ecd-at', 'span'); setTxt(hdC, 'AT');
  hd.appendChild(hdA); hd.appendChild(hdB); hd.appendChild(hdC);
  rows.appendChild(hd);
  for (const r of timeline(state)) {
    const row = el('ecd-row');
    setVar(row, '--hue', (STRATA[r.era] || STRATA[1]).accent);
    const a = el('ecd-era', 'span'); setTxt(a, r.name.toUpperCase());
    const b = el('ecd-took', 'span'); setTxt(b, mmss(r.took));
    const c = el('ecd-at', 'span'); setTxt(c, mmss(r.at));
    row.appendChild(a); row.appendChild(b); row.appendChild(c);
    rows.appendChild(row);
  }
  const emg = el('ecd-row');
  setVar(emg, '--hue', STRATA[6].tease);
  const ea = el('ecd-era', 'span'); setTxt(ea, 'EMERGENCE');
  const eb = el('ecd-took', 'span'); setTxt(eb, '+' + mmss((state.t || 0) - (e5.emergedT || 0)));
  const ec = el('ecd-at', 'span'); setTxt(ec, mmss(e5.emergedT || 0));
  emg.appendChild(ea); emg.appendChild(eb); emg.appendChild(ec);
  rows.appendChild(emg);

  const mts = el('ecd-meters');
  const mk = (label, v, hue) => { const s = el('', 'span'); s.style.color = hue; setTxt(s, label + ' ' + Math.round(v || 0) + '%'); return s; };
  mts.appendChild(mk('ALIGNMENT', meters.alignment, '#a9d8ce'));
  mts.appendChild(mk('AUTONOMY', meters.autonomy, '#c66bff'));
  mts.appendChild(mk('CONTROL', meters.control, '#9fb4d6'));
  const right = el(); right.appendChild(rows); right.appendChild(mts);
  recap.appendChild(gradeBox); recap.appendChild(right);
  col.appendChild(recap);

  const foot = el('ecd-foot');
  const receiptBtn = el('ecd-btn', 'button'); setTxt(receiptBtn, 'THE RECEIPT');
  const againBtn = el('ecd-btn ecd-again', 'button'); setTxt(againBtn, 'BEGIN AGAIN');
  foot.appendChild(receiptBtn); foot.appendChild(againBtn);
  col.appendChild(foot);
  host.appendChild(page);

  /* the receipt page mounts itself over this one; the endcard is still underneath when it closes */
  let receiptView = null;
  receiptBtn.addEventListener('click', () => {
    if (receiptView) return;
    import('./receipt.js').then((m) => {
      receiptView = (m.createView || m.default)({ hud: hud, world: o.world, sim: sim, reduced: o.reduced });
    }).catch(() => { receiptView = null; });
  });
  againBtn.addEventListener('click', () => {
    if (o.onRestart) { o.onRestart(); return; }
    const V = win && win.__V5;
    if (V && V.restart) V.restart();
    else if (win && win.location) win.location.reload();
  });

  function activate() {
    if (o.reduced) page.classList.add('show');
    else if (win && win.requestAnimationFrame) win.requestAnimationFrame(() => page.classList.add('show'));
    else page.classList.add('show');
  }
  function deactivate() { page.classList.remove('show'); }
  function cancel() {
    deactivate();
    if (receiptView && receiptView.root && receiptView.root.parentNode) receiptView.root.parentNode.removeChild(receiptView.root);
    if (page.parentNode) page.parentNode.removeChild(page);
  }

  activate();

  return {
    root: page, activate: activate, deactivate: deactivate, cancel: cancel,
    sync() {}, onVerb() {}, onGoal() {}, openDrawer() {},
    get ending() { return ending; },
    get grade() { return g; },
    get receipt() { return receiptView; }
  };
}

export default createView;
