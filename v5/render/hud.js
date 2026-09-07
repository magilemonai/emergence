// render/hud.js: the fixed HUD frame over the world canvas (WO-01).
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
export function fmtRate(v) { const n0 = +v || 0; const n = Math.abs(n0) < 0.005 ? 0 : n0; return (n > 0 ? '+' : n < 0 ? '' : '') + fmt(n) + '/s'; }   // a drained bank reads 0/s, never -0.00/s

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
 * createHud(root, opts): builds the fixed frame ONCE and returns updaters.
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
  /** setRail(list): list of {id, value, rate}. Order is stable; chips are never rebuilt. */
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

  /** goalExtra(el): extra goal content from the era view (an age image), inserted once at the top of the goal box */
  function goalExtra(node) { if (node && node.parentNode !== goalBox) goalBox.insertBefore(node, goalBox.firstChild); return node; }
  /** goalAside(el): the era view card beside the goal (below it in the goal column): the timed decision lives here */
  function goalAside(node) { if (node && node.parentNode !== goalCol) goalCol.appendChild(node); return node; }
  /** renderGoal({progress, ready, label, name, value, tease}): the meter wakes in the NEXT stratum's hue */
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

  /* ================== WO-11: the shell layer ==================
     Added, never rewired: era switching needs a way to empty the era's HUD content, the run needs a
     settings panel + a pause pill, and the rail needs the music and settings buttons. Everything here
     is built once and updated in place, like the rest of the frame. */

  const SHELL_CSS = `
.rail-btn.on { color: #0d0a06; background: var(--accent, #d6a85f); border-color: var(--accent, #d6a85f); }
.bulk-tag { display: none; padding: 4px 7px; border-radius: 7px; font-family: var(--mono, monospace); font-size: 10.5px; letter-spacing: 0.1em; color: #0d0a06; background: var(--accent, #d6a85f); }
.bulk-tag.on { display: inline-block; }
.pause-pill {
  position: fixed; left: 50%; top: 64px; transform: translateX(-50%); z-index: 78;
  display: none; align-items: center; gap: 9px; padding: 6px 15px; border-radius: 999px;
  font-family: var(--mono, monospace); font-size: 12px; letter-spacing: 0.2em;
  color: var(--danger, #d98a6a); background: var(--tip-bg, rgba(14,10,6,0.97));
  border: 1px solid var(--danger, #d98a6a);
}
.pause-pill.on { display: flex; }
.v5set { position: fixed; inset: 0; z-index: 80; display: none; align-items: center; justify-content: center; background: rgba(2,2,6,0.6); }
.v5set.on { display: flex; }
.v5set-box {
  width: 344px; padding: 15px 18px 18px; border-radius: 16px;
  background: var(--tip-bg, rgba(14,10,6,0.97)); border: 1px solid var(--edge, #4a3720);
  box-shadow: 0 24px 62px rgba(0,0,0,0.62); color: var(--text, #eadfce);
}
.v5set-h { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.v5set-t { flex: 1; font-family: var(--era-font, serif); font-size: 12px; letter-spacing: 0.18em; color: var(--accent, #d6a85f); }
.v5set-x { border: none; background: none; color: var(--dimmer, #7d6f56); font-size: 14px; cursor: pointer; }
.v5set-x:hover { color: var(--text, #eadfce); }
.v5set-row { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
.v5set-lab { width: 72px; font-family: var(--era-font, serif); font-size: 9.5px; letter-spacing: 0.14em; color: var(--dimmer, #7d6f56); }
.v5set-val { width: 36px; text-align: right; font-family: var(--mono, monospace); font-size: 11.5px; color: var(--dim, #b6a583); font-variant-numeric: tabular-nums; }
.v5set-s { flex: 1; height: 14px; accent-color: var(--accent, #d6a85f); cursor: pointer; }
.v5set-acts { display: flex; gap: 8px; margin-top: 14px; }
.v5set-acts .buy { flex: 1; }
.v5set-k { margin-top: 12px; font-family: var(--mono, monospace); font-size: 10.5px; letter-spacing: 0.05em; color: var(--dimmer, #7d6f56); }
`;
  (function shellCss() {
    const head = doc.head || doc.documentElement;
    if (!head || doc.getElementById('v5-shell-css')) return;
    const s = doc.createElement('style'); s.id = 'v5-shell-css'; s.textContent = SHELL_CSS;
    head.appendChild(s);
  })();

  // the rail's own buttons: the bulk tag, music, settings. Era views append their controls beside these.
  const bulkTag = el('bulk-tag'); setTxt(bulkTag, 'MAX');
  const musicBtn = el('rail-btn', 'button'); setTxt(musicBtn, '♪');
  setAttr(musicBtn, 'data-tip', '<b>♪ music</b>');
  const setBtn = el('rail-btn', 'button'); setTxt(setBtn, '⚙');
  setAttr(setBtn, 'data-tip', '<b>⚙ settings</b> · Esc');
  railRight.appendChild(bulkTag); railRight.appendChild(musicBtn); railRight.appendChild(setBtn);

  // the pause pill and the settings panel sit on the body, so the overview fade never hides them
  const host = doc.body || root;
  const pill = el('pause-pill'); setTxt(pill, 'PAUSED');
  host.appendChild(pill);

  const setWrap = el('v5set'); const setBox = el('v5set-box');
  const sHead = el('v5set-h'); const sT = el('v5set-t'); setTxt(sT, 'SETTINGS');
  const sX = el('v5set-x', 'button'); setTxt(sX, '✕');
  sHead.appendChild(sT); sHead.appendChild(sX); setBox.appendChild(sHead);

  const knobs = {};
  function knob(key, label) {
    const row = el('v5set-row'); const lab = el('v5set-lab'); setTxt(lab, label);
    const s = doc.createElement('input');
    s.type = 'range'; s.min = '0'; s.max = '100'; s.step = '1'; s.className = 'v5set-s';
    const val = el('v5set-val');
    row.appendChild(lab); row.appendChild(s); row.appendChild(val); setBox.appendChild(row);
    knobs[key] = { s: s, val: val };
    s.addEventListener('input', () => {
      setTxt(val, s.value + '%');
      if (o.onVol) o.onVol(key, (+s.value || 0) / 100);
    });
  }
  knob('bed', 'MUSIC'); knob('voices', 'VOICES'); knob('sfx', 'SOUND');

  const acts = el('v5set-acts');
  const pauseBtn = el('buy', 'button'); setTxt(pauseBtn, 'PAUSE');
  const resetBtn = el('buy', 'button'); setTxt(resetBtn, 'RESTART');
  acts.appendChild(pauseBtn); acts.appendChild(resetBtn); setBox.appendChild(acts);
  const keysLine = el('v5set-k'); setTxt(keysLine, '1-6 strata · SPACE verb · R drawer');
  setBox.appendChild(keysLine);
  setWrap.appendChild(setBox); host.appendChild(setWrap);

  let paused = false, settingsOpen = false, armReset = false;
  function setPaused(b) {
    paused = !!b;
    setCls(pill, 'pause-pill' + (paused ? ' on' : ''));
    setTxt(pauseBtn, paused ? 'RESUME' : 'PAUSE');
    return paused;
  }
  function openSettings(b) {
    settingsOpen = b === undefined ? true : !!b;
    setCls(setWrap, 'v5set' + (settingsOpen ? ' on' : ''));
    if (!settingsOpen) { armReset = false; setTxt(resetBtn, 'RESTART'); }
    return settingsOpen;
  }
  pauseBtn.addEventListener('click', () => { if (o.onPause) o.onPause(!paused); else setPaused(!paused); });
  resetBtn.addEventListener('click', () => {
    if (!armReset) { armReset = true; setTxt(resetBtn, 'SURE?'); return; }
    armReset = false; setTxt(resetBtn, 'RESTART');
    if (o.onRestart) o.onRestart();
  });
  sX.addEventListener('click', () => openSettings(false));
  setWrap.addEventListener('click', (e) => { if (e.target === setWrap) openSettings(false); });
  setBtn.addEventListener('click', () => openSettings(!settingsOpen));
  musicBtn.addEventListener('click', () => { if (o.onMusic) o.onMusic(); });

  /** setVols({bed, voices, sfx}): put the persisted audio levels on the three sliders */
  function setVols(v) {
    const x = v || {};
    for (const k in knobs) {
      if (x[k] === undefined) continue;
      const pct = Math.round(Math.max(0, Math.min(1, +x[k] || 0)) * 100);
      knobs[k].s.value = String(pct);
      setTxt(knobs[k].val, pct + '%');
    }
  }
  function setMusicOn(b) { setCls(musicBtn, 'rail-btn' + (b ? ' on' : '')); }
  /** setBulkTag(on): the rail says MAX while bulk buys price themselves per node */
  function setBulkTag(on) { setCls(bulkTag, 'bulk-tag' + (on ? ' on' : '')); }

  // ---- clearEra(): the era view's DOM comes off the frame, the frame itself stays
  const ownKids = new Map();
  const hosts = [root, cols, goalBox, goalCol, verbCol, verbList, railRight, railRes];
  for (const h of hosts) ownKids.set(h, Array.prototype.slice.call(h.children));
  function stripForeign(node) {
    const keep = ownKids.get(node) || [];
    for (const kid of Array.prototype.slice.call(node.children)) if (keep.indexOf(kid) < 0) node.removeChild(kid);
  }
  /**
   * clearEra(): empty the verb list, drop the goal extras and asides, hide the rail chips and remove
   * every element an era view appended to the frame. Plates belong to the world, so plateLayer stays.
   */
  function clearEra() {
    for (const h of hosts) if (h !== railRes) stripForeign(h);
    for (const k in verbs) { const b = verbs[k].btn; if (b.parentNode) b.parentNode.removeChild(b); delete verbs[k]; }
    for (const id in chips) setStyle(chips[id].root, 'display', 'none');
    setTxt(gName, ''); setTxt(gVal, ''); setTxt(gLab, ''); setTxt(gBtn, '');
    setStyle(meterFill, 'width', '0%');
    setCls(goalBox, 'goal'); setStyle(goalCol, 'display', '');
    if (tipOn) { tipOn = null; tip.classList.remove('show'); }
    return true;
  }
  /** finishRail(): keep the shell buttons at the end of the rail after a view adds its own */
  function finishRail() { railRight.appendChild(bulkTag); railRight.appendChild(musicBtn); railRight.appendChild(setBtn); }

  return {
    root, rail, railRight, verbList, goalBox, goalCol, goalExtra, goalAside, plateLayer, toasts, tip,
    setRail, renderVerbs, renderGoal, toast, setOverview,
    applyPalette: (n) => applyPalette(root, n),
    get overview() { return over; },
    // WO-11 shell seams
    clearEra, finishRail, setVols, setMusicOn, setBulkTag, setPaused, openSettings,
    musicBtn, settingsBtn: setBtn, pausePill: pill, settingsPanel: setWrap,
    get paused() { return paused; },
    get settingsOpen() { return settingsOpen; }
  };
}
