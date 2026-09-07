// render/hud.js — the fixed HUD frame over the world canvas (WO-01).
// Rail (resource chips), left verbs column, right goal column, toasts, tooltips,
// and the change-detected setters every DOM writer in v5 must go through.
// No DOM at import time: everything runs inside createHud / the setters.

import { STRATA, RES, resHue, resGlyph, alpha } from './palette.js';

/**
 * domWrites counts REAL writes (a set that changed something). Tests instrument this to prove
 * BUILD-ONCE: 60 frames with unchanged state must add zero writes.
 */
export const domWrites = { txt: 0, html: 0, dis: 0, attr: 0, style: 0 };
export function resetWrites() { domWrites.txt = 0; domWrites.html = 0; domWrites.dis = 0; domWrites.attr = 0; domWrites.style = 0; }

export function setTxt(el, t) { if (el && el._t !== t) { el.textContent = t; el._t = t; domWrites.txt++; } }
export function setHTML(el, h) { if (el && el._h !== h) { el.innerHTML = h; el._h = h; domWrites.html++; } }
export function setDis(el, d) { if (el && el.disabled !== d) { el.disabled = d; domWrites.dis++; } }
export function setAttr(el, k, v) { if (el && el['_a' + k] !== v) { el.setAttribute(k, v); el['_a' + k] = v; domWrites.attr++; } }
export function setStyle(el, k, v) { if (el && el['_s' + k] !== v) { el.style[k] = v; el['_s' + k] = v; domWrites.style++; } }
/** CSS custom properties need setProperty; same change-detection contract */
export function setVar(el, k, v) { if (el && el['_v' + k] !== v) { if (el.style.setProperty) el.style.setProperty(k, v); el['_v' + k] = v; domWrites.style++; } }
export function setCls(el, cls) { if (el && el._c !== cls) { el.className = cls; el._c = cls; domWrites.attr++; } }

/** compact numbers: numbers-first labels need a fixed width so nothing reflows */
export function fmt(v) {
  const n = +v || 0, a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return Math.round(n / 1e3) + 'k';
  if (a >= 100) return String(Math.round(n));
  if (a >= 10) return n.toFixed(1);
  if (a >= 1) return n.toFixed(2);
  return n === 0 ? '0' : n.toFixed(2);
}
export function fmtRate(v) { const n = +v || 0; return (n > 0 ? '+' : n < 0 ? '' : '') + fmt(n) + '/s'; }

/** paint a stratum's palette onto a root element as CSS custom properties */
export function applyPalette(root, n) {
  const p = STRATA[n] || STRATA[1];
  const map = {
    '--bg': p.bg, '--panel': p.panel, '--panel-2': p.panel2, '--line': p.line, '--edge': p.edge,
    '--text': p.text, '--dim': p.dim, '--dimmer': p.dimmer, '--accent': p.accent, '--good': p.good,
    '--danger': p.danger, '--tease': p.tease, '--rail-bg': p.railBg, '--tip-bg': p.tipBg,
    '--verb-a': p.verbA, '--verb-b': p.verbB, '--era-font': p.font, '--body-font': p.body, '--mono': p.mono
  };
  for (const k in map) if (root._p !== n) root.style.setProperty(k, map[k]);
  root._p = n;
}

/**
 * createHud(root, opts) — builds the fixed frame ONCE and returns updaters.
 * root is an element already in the page; opts.onVerb(name) fires on a verb press.
 */
export function createHud(root, opts) {
  const o = opts || {};
  const doc = root.ownerDocument;
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };

  const rail = el('rail'); const railRes = el('rail-res'); const railRight = el('rail-right');
  rail.appendChild(railRes); rail.appendChild(railRight);
  const cols = el('cols');
  const verbCol = el('col verbs'); const verbHead = el('col-head'); setTxt(verbHead, 'ACTIONS');
  const verbList = el('verb-list'); verbCol.appendChild(verbHead); verbCol.appendChild(verbList);
  const goalCol = el('col goal-col'); const goalBox = el('goal');
  const gName = el('gname'); const gVal = el('gval'); const meter = el('meter');
  const meterFill = doc.createElement('i'); meter.appendChild(meterFill);
  const gLab = el('meter-lab'); const gBtn = el('fab', 'button');
  goalBox.appendChild(gName); goalBox.appendChild(gVal); goalBox.appendChild(meter); goalBox.appendChild(gLab); goalBox.appendChild(gBtn);
  goalCol.appendChild(goalBox);
  const plateLayer = el('plate-layer');
  const toasts = el('toasts');
  const tip = el('tip'); tip.id = 'tip';

  cols.appendChild(verbCol); cols.appendChild(goalCol);
  root.appendChild(plateLayer); root.appendChild(rail); root.appendChild(cols); root.appendChild(toasts); root.appendChild(tip);

  gBtn.addEventListener('click', () => { if (o.onGoal) o.onGoal(); });

  // ---- tooltips: one floating node, driven by data-tip. Never hover-to-discover; tips add detail only.
  let tipOn = null;
  root.addEventListener('mouseover', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (!t || t === tipOn) return;
    tipOn = t; setHTML(tip, t.getAttribute('data-tip')); tip.classList.add('show');
  });
  root.addEventListener('mousemove', (e) => {
    if (!tipOn) return;
    tip.style.left = Math.min(e.clientX + 14, (root.clientWidth || 1280) - 320) + 'px';
    tip.style.top = (e.clientY + 16) + 'px';
  });
  root.addEventListener('mouseout', (e) => {
    if (!tipOn) return;
    const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t === tipOn) { tipOn = null; tip.classList.remove('show'); }
  });

  // ---- rail: one chip per resource, created once, values updated in place
  const chips = {};
  function chipFor(id) {
    if (chips[id]) return chips[id];
    const c = el('chip'); c.setAttribute('data-tip', '<b>' + id + '</b><br><i>' + ((RES[id] && RES[id].flavor) || '') + '</i>');
    const dot = el('cdot'); dot.style.background = alpha(resHue(id), 0.16); dot.style.color = resHue(id);
    const g = el('cglyph'); setTxt(g, resGlyph(id)); dot.appendChild(g);
    const body = el('cbody'); const lab = el('clab'); setTxt(lab, id.toUpperCase());
    const val = el('cval'); val.style.color = resHue(id);
    body.appendChild(lab); body.appendChild(val);
    const ps = el('cps');
    c.appendChild(dot); c.appendChild(body); c.appendChild(ps);
    railRes.appendChild(c);
    chips[id] = { root: c, val, ps };
    return chips[id];
  }
  /** setRail(list) — list of {id, value, rate}. Order is stable; chips are never rebuilt. */
  function setRail(list) {
    const seen = {};
    list.forEach(r => {
      const c = chipFor(r.id); seen[r.id] = 1;
      setStyle(c.root, 'display', '');
      setTxt(c.val, fmt(r.value));
      setTxt(c.ps, fmtRate(r.rate));
      setCls(c.ps, 'cps ' + (r.rate > 0.001 ? 'pos' : r.rate < -0.001 ? 'neg' : 'zero'));
    });
    for (const id in chips) if (!seen[id]) setStyle(chips[id].root, 'display', 'none');
  }

  // ---- verbs: big buttons, yield first (numbers first), created once per name
  const verbs = {};
  function renderVerbs(list) {
    list.forEach((v, i) => {
      let b = verbs[v.name];
      if (!b) {
        const btn = doc.createElement('button'); btn.className = 'verb';
        const y = el('vyield'); const n = el('vname'); const k = el('vkey');
        btn.appendChild(y); btn.appendChild(n); btn.appendChild(k);
        btn.addEventListener('click', () => { if (o.onVerb) o.onVerb(v.name); });
        verbList.appendChild(btn);
        b = verbs[v.name] = { btn, y, n, k };
      }
      setTxt(b.y, v.yield || '');
      setTxt(b.n, v.label || v.name);
      setTxt(b.k, v.key || String(i + 1));
      setDis(b.btn, !!v.disabled);
      setStyle(b.btn, 'display', '');
      if (v.tip) setAttr(b.btn, 'data-tip', v.tip);
    });
    const keep = {}; list.forEach(v => { keep[v.name] = 1; });
    for (const k in verbs) if (!keep[k]) setStyle(verbs[k].btn, 'display', 'none');
  }

  /** renderGoal({progress, ready, label, name, value, tease}) — the meter wakes in the NEXT stratum's hue */
  function renderGoal(g) {
    if (!g) { setStyle(goalCol, 'display', 'none'); return; }
    setStyle(goalCol, 'display', '');
    setTxt(gName, g.name || 'GOAL');
    setTxt(gVal, g.value !== undefined ? String(g.value) : Math.round((g.progress || 0) * 100) + '%');
    setStyle(meterFill, 'width', Math.round(Math.max(0, Math.min(1, g.progress || 0)) * 100) + '%');
    setTxt(gLab, g.label || '');
    setTxt(gBtn, g.action || 'ADVANCE');
    setDis(gBtn, !g.ready);
    setCls(goalBox, 'goal' + (g.ready ? ' ready' : ''));
    setVar(goalBox, '--wake', String(Math.max(0, Math.min(1, g.progress || 0))));
  }

  // ---- toasts: top-right under the rail, max 2, never over the verbs or the goal button
  function toast(head, body, kind) {
    while (toasts.children.length >= 2) toasts.removeChild(toasts.firstChild);
    const t = el('toast' + (kind ? ' ' + kind : ''));
    const h = el('toast-h'); setTxt(h, head);
    const b = el('tb'); setTxt(b, body || '');
    t.appendChild(h); t.appendChild(b); toasts.appendChild(t);
    return t;
  }

  /** the HUD fades out entirely in the overview; the world becomes the whole picture */
  let over = false;
  function setOverview(on) {
    if (over === on) return;
    over = on;
    setCls(root, 'hud' + (on ? ' over' : ''));
  }
  setCls(root, 'hud');

  return {
    root, rail, railRight, verbList, goalBox, plateLayer, toasts, tip,
    setRail, renderVerbs, renderGoal, toast, setOverview,
    applyPalette: (n) => applyPalette(root, n),
    get overview() { return over; }
  };
}
