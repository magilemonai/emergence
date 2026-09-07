// render/eras/statistical.js — the Statistical stratum's view (WO-04).
// The instrument is part of the WORLD: the living scatter and the two-needle track are drawn on a canvas
// pinned to a world rect inside the stratum, so they pan, zoom and silhouette with everything else. The HUD
// owns only what a hand touches: RUN TRIAL, the Focus dial with its Autopilot toggle, the EXPERIMENTS drawer
// and the goal column's supply bus back to Origins.
// BUILD-ONCE: every element is created in the factory and only ever updated through the change-detected setters.

import { setTxt, setHTML, setDis, setCls, setStyle, setAttr, setVar, fmt } from '../hud.js';
import { STRATA, alpha } from '../palette.js';
import { stratumTop } from '../../engine/types.js';
import {
  stats, effAccuracy, expCost, nextMethod, boardCards, surveyDisc, predicting,
  focusKey, HIDDEN_PLATES, PLOT_RECT, TRACK_RECT
  foundrySupplyCost,
} from '../../engine/eras/statistical.js';

/** the world rect the instrument occupies: the plot band plus the track under it */
const BAND = { x: PLOT_RECT.x, y: PLOT_RECT.y, w: PLOT_RECT.w, h: (TRACK_RECT.y + TRACK_RECT.h) - PLOT_RECT.y };
const PLOT = { x: 0, y: 0, w: PLOT_RECT.w, h: PLOT_RECT.h };
const TRACK = { x: 0, y: TRACK_RECT.y - PLOT_RECT.y, w: TRACK_RECT.w, h: TRACK_RECT.h };
const PAD = 22;
const LOD_PLATE = 0.6;
const POINTS = 30, ODD = 17;          // one point was there before the world moved; it stays where it was
const RAIL = ['silicon', 'data', 'insight'];
const CSS_ID = 'e3-css';

const CSS = `
.e3-plot { position: fixed; z-index: 2; pointer-events: none; }
.e3-side { margin-top: 12px; display: flex; flex-direction: column; gap: 9px; }
.verb[data-v="trial"] .vname { order: 0; white-space: nowrap; }
.verb[data-v="trial"] .vyield { order: 2; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.e3-dial { position: relative; padding: 8px 10px 9px; border-radius: 11px; border: 1px solid var(--line); background: rgba(0, 0, 0, 0.24); }
.e3-dhead { display: flex; align-items: center; gap: 6px; margin-bottom: 7px; }
.e3-dlab { flex: 1; font-family: var(--era-font); font-size: 9.5px; letter-spacing: 0.13em; color: var(--dimmer); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.e3-auto { padding: 3px 8px; border-radius: 999px; cursor: pointer; font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em;
  color: #c9adf5; background: rgba(183, 139, 255, 0.09); border: 1px solid rgba(183, 139, 255, 0.45); }
.e3-auto.on { color: #14101c; background: #c9adf5; border-color: #c9adf5; }
.e3-auto[hidden] { display: none; }
.e3-segs { display: flex; flex-direction: column; gap: 7px; padding-top: 3px; }
.e3-seg { position: relative; display: flex; align-items: baseline; gap: 7px; width: 100%; padding: 8px 10px; border-radius: 9px; cursor: pointer; text-align: left;
  color: var(--text); background: var(--panel-2); border: 1px solid var(--edge); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05); }
.e3-seg:hover { border-color: var(--accent); }
.e3-seg.on { border-color: currentColor; box-shadow: 0 0 14px -3px currentColor, inset 0 1px 0 rgba(255, 255, 255, 0.07); }
.e3-sk { font-family: var(--mono); font-size: 12px; letter-spacing: 0.06em; }
.e3-sn { flex: 1; font-family: var(--era-font); font-size: 12.5px; color: var(--text); }
.e3-sd { font-family: var(--mono); font-size: 10.5px; color: var(--dimmer); font-variant-numeric: tabular-nums; }
.e3-ghost { position: absolute; left: 9px; top: 0; transform: translateY(-52%); padding: 1px 6px; border-radius: 999px; z-index: 2;
  font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.05em; white-space: nowrap; color: #c9adf5;
  background: #06141a; border: 1px solid rgba(183, 139, 255, 0.55); opacity: 0; transition: opacity 0.25s ease; }
.e3-ghost.show { opacity: 1; }
.e3-xp { position: relative; }
.e3-xps { flex: 1; font-family: var(--mono); font-size: 10.5px; color: var(--dim); font-variant-numeric: tabular-nums; text-align: right; letter-spacing: 0; }
.e3-badge { padding: 2px 7px; border-radius: 6px; font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.1em; color: #04121a; background: var(--good); }
.e3-badge[hidden] { display: none; }
.e3-sup { margin-top: 10px; padding: 10px 11px; border-radius: 13px; border: 1px solid var(--line); background: var(--panel); }
.e3-slab { font-family: var(--era-font); font-size: 9.5px; letter-spacing: 0.12em; color: var(--dimmer); margin-bottom: 6px; }
.e3-fdy { display: flex; gap: 8px; align-items: baseline; width: 100%; margin-top: 6px; padding: 7px 10px; border-radius: 10px; cursor: pointer; text-align: left; font-family: var(--mono, monospace); font-size: 11px; color: var(--text, #e6f2ef); background: var(--panel-2, #0b1a1c); border: 1px solid var(--edge, #1f4a4a); }
.e3-fdy:disabled { opacity: 0.5; cursor: default; }
.e3-fnm { font-weight: 600; }
.e3-fcnt { color: var(--dim, #8fb5b0); }
.e3-fcost { margin-left: auto; color: var(--dimmer, #5f8a86); font-size: 10px; white-space: nowrap; }
.e3-sbtn { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 8px 10px; border-radius: 10px; cursor: pointer; text-align: left;
  color: var(--text); background: var(--panel-2); border: 1px solid var(--edge); }
.e3-sbtn:hover { border-color: var(--accent); }
.e3-sbtn.can { border-color: var(--danger); box-shadow: 0 0 16px -5px var(--danger); }
.e3-snm { font-family: var(--era-font); font-size: 12px; }
.e3-scost { font-family: var(--mono); font-size: 11px; color: var(--dim); font-variant-numeric: tabular-nums; }
.e3-survey { display: flex; align-items: center; gap: 9px; padding: 8px 11px; border-bottom: 1px solid var(--line); }
.e3-slb { font-family: var(--era-font); font-size: 9.5px; letter-spacing: 0.12em; color: var(--dimmer); }
.e3-smeter { flex: 1; height: 5px; border-radius: 3px; background: rgba(0, 0, 0, 0.5); overflow: hidden; }
.e3-smeter i { display: block; height: 100%; width: 0; background: #6ea8ff; }
.e3-sdisc { font-family: var(--mono); font-size: 10.5px; color: var(--good); font-variant-numeric: tabular-nums; }
.e3-cards { padding: 11px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 9px; align-content: start; }
.e3-card { display: flex; flex-direction: column; gap: 5px; padding: 9px 10px 10px; border-radius: 11px; border: 1px solid var(--line); background: var(--panel); }
.e3-card.method { border-color: color-mix(in srgb, var(--good) 55%, transparent); }
.e3-cn { display: flex; align-items: baseline; gap: 6px; font-family: var(--era-font); font-size: 12.5px; }
.e3-ct { padding: 1px 5px; border-radius: 5px; font-family: var(--mono); font-size: 8.5px; letter-spacing: 0.1em; color: #04121a; background: var(--good); }
.e3-clv { margin-left: auto; font-family: var(--mono); font-size: 10px; color: var(--dimmer); }
.e3-cd { flex: 1 0 auto; min-height: 44px; font-size: 11.5px; line-height: 1.3; color: var(--dim); }
@media (prefers-reduced-motion: reduce) { .e3-ghost { transition: none; } }
`;

/** createView({hud, world, sim, buy}) -> { sync, onVerb, onGoal, toggleResearch } */
export function createStatisticalView(opts) {
  const hud = opts.hud, world = opts.world, sim = opts.sim, buy = opts.buy;
  const doc = hud.root.ownerDocument, win = doc.defaultView;
  const c = sim.cfg.e3;
  const E = () => sim.state.eras[3];
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };
  const reduced = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pal = STRATA[3];

  if (!doc.getElementById(CSS_ID)) { const s = doc.createElement('style'); s.id = CSS_ID; s.textContent = CSS; doc.head.appendChild(s); }

  /* ---------- the instrument: a canvas pinned to a world rect, under the HUD and over the world ---------- */
  const plot = doc.createElement('canvas');
  plot.className = 'e3-plot';
  hud.root.parentNode.insertBefore(plot, hud.root);
  const pctx = plot.getContext('2d');
  let phase = 0, pulse = 0, plotW = 0, plotH = 0;

  /* ---------- the rail's own controls ---------- */
  const bulk = el('rail-btn', 'button');
  const mapBtn = el('rail-btn', 'button');
  hud.railRight.appendChild(bulk); hud.railRight.appendChild(mapBtn);
  bulk.addEventListener('click', () => { const i = c.buyModes.indexOf(buy.n); buy.n = c.buyModes[(i + 1) % c.buyModes.length]; });
  mapBtn.addEventListener('click', () => { if (world.isOverview) world.lockTo(3, true); else world.overview(true); });

  /* ---------- the left column under RUN TRIAL: the Focus dial, then EXPERIMENTS ---------- */
  const side = el('e3-side');
  const dial = el('e3-dial');
  const dHead = el('e3-dhead'), dLab = el('e3-dlab'); setTxt(dLab, 'TRAINING FOCUS');
  const autoBtn = el('e3-auto', 'button'); setTxt(autoBtn, '↻ AUTOPILOT');
  autoBtn.setAttribute('data-tip', '<b>Autopilot</b><br><i>' + c.focus.auto.flavor + '</i>');
  autoBtn.hidden = true;
  dHead.appendChild(dLab); dHead.appendChild(autoBtn);
  const segRow = el('e3-segs');
  const segs = {};
  for (const k of ['fit', 'generalize', 'explore']) {
    const d = c.focus[k];
    const b = el('e3-seg', 'button');
    b.setAttribute('data-tip', '<b>' + d.label + '</b><br><i>' + d.flavor + '</i>');
    setStyle(b, 'color', d.hue);
    const kk = el('e3-sk'), nm = el('e3-sn'), sd = el('e3-sd'), gh = el('e3-ghost');
    setTxt(kk, '◈'); setTxt(nm, d.label);
    b.appendChild(kk); b.appendChild(nm); b.appendChild(sd); b.appendChild(gh);
    segRow.appendChild(b);
    b.addEventListener('click', () => sim.apply({ type: 'focus', era: 3, k: k }));
    segs[k] = { btn: b, sd: sd, ghost: gh, def: d };
  }
  dial.appendChild(dHead); dial.appendChild(segRow);
  autoBtn.addEventListener('click', () => sim.apply({ type: 'focus', era: 3, k: E().focus === 'auto' ? focusKey(sim) : 'auto' }));

  const xpBtn = el('side-btn e3-xp', 'button');
  const xpLab = el('sb-l'); setTxt(xpLab, 'EXPERIMENTS');
  const xpSurvey = el('e3-xps'), xpBadge = el('e3-badge'); setTxt(xpBadge, 'METHOD'); xpBadge.hidden = true;
  xpBtn.appendChild(xpLab); xpBtn.appendChild(xpSurvey); xpBtn.appendChild(xpBadge);
  side.appendChild(dial); side.appendChild(xpBtn);
  hud.verbList.parentNode.appendChild(side);

  /* ---------- the goal column: the supply bus back to Origins ---------- */
  const sup = el('e3-sup');
  const supLab = el('e3-slab'); setTxt(supLab, 'SUPPLY BUS');
  const supBtn = el('e3-sbtn', 'button');
  supBtn.setAttribute('data-tip', '<b>Silicon</b><br><i>The instrument runs on Silicon from the Origins stack.</i>');
  const supNm = el('e3-snm'); setTxt(supNm, 'Silicon from Origins →');
  const supCost = el('e3-scost');
  supBtn.appendChild(supCost); supBtn.appendChild(supNm);
  sup.appendChild(supLab); sup.appendChild(supBtn);
  // build-here: the Foundry that makes the Silicon this stratum runs on, bought where it stands in Origins (Deep's bus
  // offers the same reach-back); its Silicon climbs the riser into your Datasets. The arrow still jumps you down.
  const fdy = el('side-btn e3-fdy', 'button');
  const fNm = el('e3-fnm'); setTxt(fNm, 'Foundry');
  const fCnt = el('e3-fcnt'); const fCost = el('e3-fcost');
  fdy.appendChild(fNm); fdy.appendChild(fCnt); fdy.appendChild(fCost);
  fdy.setAttribute('data-tip', '<b>Foundry</b><br><i>Built where it stands, in Origins. Its Silicon climbs the riser to your Datasets.</i><br>Paid in Silicon. Pause a Dataset to bank it.');
  sup.appendChild(fdy);
  hud.goalAside(sup);
  supBtn.addEventListener('click', () => { if (opts.jump && opts.jump(1)) return; world.lockTo(1, true); });   // go and build it: the view follows
  fdy.addEventListener('click', () => sim.apply({ type: 'supply', era: 3, n: buy.n }));
  setVar(hud.goalBox, '--tease', STRATA[4].accent);          // the goal wakes in Deep's cobalt

  /* ---------- the EXPERIMENTS drawer: three cards, built once, retargeted in place ---------- */
  const drawer = el('drawer');
  const dh = el('dr-head'), dt = el('dr-t'); setTxt(dt, 'EXPERIMENTS');
  const dn = el('dr-n'), dx = el('dr-x', 'button'); setTxt(dx, '✕');
  dh.appendChild(dt); dh.appendChild(dn); dh.appendChild(dx);
  const survey = el('e3-survey');
  const svLab = el('e3-slb'); setTxt(svLab, 'SURVEYED');
  const svMeter = el('e3-smeter'), svFill = doc.createElement('i'); svMeter.appendChild(svFill);
  const svDisc = el('e3-sdisc');
  survey.appendChild(svLab); survey.appendChild(svMeter); survey.appendChild(svDisc);
  const cardRow = el('e3-cards');
  const cards = [];
  for (let i = 0; i < 3; i++) {
    const card = el('e3-card');
    const cn = el('e3-cn'), tag = el('e3-ct'), nm = el('e3-sn'), lv = el('e3-clv');
    setTxt(tag, 'METHOD');
    cn.appendChild(tag); cn.appendChild(nm); cn.appendChild(lv);
    const cd = el('e3-cd'), b = el('buy', 'button');
    card.appendChild(cn); card.appendChild(cd); card.appendChild(b);
    cardRow.appendChild(card);
    const slot = { el: card, tag, nm, lv, cd, buy: b, kind: null };
    b.addEventListener('click', () => { if (slot.kind) sim.apply({ type: 'fund', era: 3, kind: slot.kind }); });
    cards.push(slot);
  }
  drawer.appendChild(dh); drawer.appendChild(survey); drawer.appendChild(cardRow);
  hud.root.appendChild(drawer);
  let open = false;
  const setOpen = (v) => { open = v; setCls(drawer, 'drawer' + (open ? ' show' : '')); };
  xpBtn.addEventListener('click', () => setOpen(!open));
  dx.addEventListener('click', () => setOpen(false));

  /* ---------- verbs + goal ---------- */
  let vYield = null;
  function onVerb(name) { if (name === 'trial') { sim.apply({ type: 'trial', era: 3 }); pulse = 1; } }
  function onGoal() { sim.apply({ type: 'generalize', era: 3 }); }

  /* ---------- the living scatter, drawn in world units inside the band ---------- */
  const fnAt = (x, ph) => 0.5 + 0.32 * Math.sin(x * Math.PI * 1.15 + 0.5 + ph);
  function drawInstrument(lod) {
    const e = E(), st = stats(sim), acc = e.accuracy, gap = e.gap, t = reduced ? 0 : sim.state.t;
    const X = (x) => PAD + x * (PLOT.w - PAD * 2);
    const Y = (y) => PLOT.h - PAD - Math.max(0.02, Math.min(0.98, y)) * (PLOT.h - PAD * 2);
    const fit = (x) => 0.5 + (fnAt(x, phase) - 0.5) * acc + Math.sin(x * 42 + t * 2) * gap * 0.16 * acc;
    const ref = (x) => 0.5 + (fnAt(x, phase) - 0.5) * Math.min(1, acc + 0.04);
    const hot = Math.min(1, gap / 0.35);
    const modelHue = hot > 0.5 ? '#ffb86b' : '#d7fff6';
    pctx.clearRect(0, 0, BAND.w, BAND.h);

    if (lod !== 'full') {                                    // zoomed out: the instrument reads as one glowing band
      const g = pctx.createLinearGradient(0, 0, 0, PLOT.h);
      g.addColorStop(0, alpha(pal.accent, 0.05));
      g.addColorStop(0.55, alpha(pal.accent, 0.22 + acc * 0.2));
      g.addColorStop(1, alpha(pal.accent, 0.05));
      pctx.fillStyle = g;
      pctx.fillRect(0, 0, PLOT.w, PLOT.h);
      pctx.strokeStyle = alpha(modelHue, 0.85); pctx.lineWidth = 4;
      pctx.beginPath();
      for (let px = 0; px <= PLOT.w - PAD * 2; px += 8) { const x = px / (PLOT.w - PAD * 2); px === 0 ? pctx.moveTo(X(x), Y(fit(x))) : pctx.lineTo(X(x), Y(fit(x))); }
      pctx.stroke();
      return;
    }

    // the chamber: one pane of glass over the plot and the track under it
    pctx.fillStyle = alpha('#04121a', 0.55);
    pctx.fillRect(0, 0, BAND.w, BAND.h);
    pctx.strokeStyle = alpha(pal.accent, 0.16); pctx.lineWidth = 1;
    pctx.strokeRect(0.5, 0.5, BAND.w - 1, BAND.h - 1);
    pctx.strokeStyle = alpha(pal.accent, 0.07); pctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) { const gx = PAD + (PLOT.w - PAD * 2) * i / 8; pctx.beginPath(); pctx.moveTo(gx, PAD); pctx.lineTo(gx, PLOT.h - PAD); pctx.stroke(); }
    for (let j = 1; j < 5; j++) { const gy = PAD + (PLOT.h - PAD * 2) * j / 5; pctx.beginPath(); pctx.moveTo(PAD, gy); pctx.lineTo(PLOT.w - PAD, gy); pctx.stroke(); }
    pctx.strokeStyle = alpha(pal.accent, 0.3);
    pctx.beginPath(); pctx.moveTo(PAD, PAD - 6); pctx.lineTo(PAD, PLOT.h - PAD); pctx.lineTo(PLOT.w - PAD, PLOT.h - PAD); pctx.stroke();

    pctx.setLineDash([5, 5]);
    pctx.beginPath();
    for (let px = 0; px <= PLOT.w - PAD * 2; px += 3) { const x = px / (PLOT.w - PAD * 2); px === 0 ? pctx.moveTo(X(x), Y(ref(x))) : pctx.lineTo(X(x), Y(ref(x))); }
    pctx.strokeStyle = alpha(pal.accent, 0.22); pctx.lineWidth = 1.4; pctx.stroke();
    pctx.setLineDash([]);

    // the confidence band breathes with every trial
    const band = (1 - acc) * 0.16 + 0.012 + pulse * 0.03;
    pctx.beginPath();
    for (let px = 0; px <= PLOT.w - PAD * 2; px += 3) { const x = px / (PLOT.w - PAD * 2); px === 0 ? pctx.moveTo(X(x), Y(fit(x) + band)) : pctx.lineTo(X(x), Y(fit(x) + band)); }
    for (let px = PLOT.w - PAD * 2; px >= 0; px -= 3) { const x = px / (PLOT.w - PAD * 2); pctx.lineTo(X(x), Y(fit(x) - band)); }
    pctx.closePath(); pctx.fillStyle = alpha(pal.accent, 0.09); pctx.fill();

    // the data itself, and the one point that refuses to move after the world changed
    const odd = e.shifts >= 1 ? ODD : -1, pr = 1 + pulse * 1.1;
    pctx.fillStyle = 'rgba(110,231,255,' + (0.8 + pulse * 0.2) + ')';
    pctx.shadowColor = 'rgba(110,231,255,0.6)'; pctx.shadowBlur = 4 + pulse * 8;
    for (let k = 0; k < POINTS; k++) {
      if (k === odd) continue;
      const x = (k + 0.5) / POINTS, hsh = Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1;
      pctx.beginPath(); pctx.arc(X(x), Y(fnAt(x, phase) + (hsh - 0.5) * 0.32), 2.4 * pr, 0, 6.3); pctx.fill();
    }
    if (odd >= 0) {
      const x = (odd + 0.5) / POINTS, hsh = Math.abs(Math.sin(odd * 12.9898) * 43758.5453) % 1;
      const wob = reduced ? 1 : 1 + 0.25 * Math.sin(sim.state.t * 2.2);
      pctx.fillStyle = 'rgba(183,139,255,0.94)'; pctx.shadowColor = 'rgba(183,139,255,0.85)'; pctx.shadowBlur = 9 * wob;
      pctx.beginPath(); pctx.arc(X(x), Y(fnAt(x, 0) + (hsh - 0.5) * 0.32), 2.9 * wob, 0, 6.3); pctx.fill();
    }
    pctx.shadowBlur = 0;

    // the model's own curve: it goes amber when it is memorizing
    pctx.beginPath();
    for (let px = 0; px <= PLOT.w - PAD * 2; px += 2) { const x = px / (PLOT.w - PAD * 2); px === 0 ? pctx.moveTo(X(x), Y(fit(x))) : pctx.lineTo(X(x), Y(fit(x))); }
    pctx.lineWidth = 2.4; pctx.strokeStyle = modelHue;
    pctx.shadowColor = alpha(modelHue, 0.6); pctx.shadowBlur = 7; pctx.stroke(); pctx.shadowBlur = 0;

    // the drift dot: after the second shift the world never settles again
    if (e.shifts >= c.shiftTriggers.length && !e.done) {
      const puls = reduced ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(sim.state.t * 2.4));
      pctx.fillStyle = 'rgba(183,139,255,' + puls.toFixed(2) + ')';
      pctx.beginPath(); pctx.arc(PLOT.w - PAD - 6, PAD - 4, 4, 0, 6.3); pctx.fill();
      pctx.font = '10px ' + pal.mono; pctx.textAlign = 'right'; pctx.fillStyle = 'rgba(183,139,255,0.9)';
      pctx.fillText('DRIFTING', PLOT.w - PAD - 16, PAD - 1);
    }

    // the two-needle track: TRAINING, VALIDATION, and the amber overfit between them
    const eff = effAccuracy(sim), thr = c.genThreshold;
    const tx = TRACK.x + PAD, tw = TRACK.w - PAD * 2, ty = TRACK.y + 12, th = 9;
    pctx.fillStyle = alpha('#000000', 0.5); pctx.fillRect(tx, ty, tw, th);
    pctx.fillStyle = alpha(pal.good, 0.85); pctx.fillRect(tx, ty, tw * eff, th);
    pctx.fillStyle = alpha('#ffb86b', 0.7); pctx.fillRect(tx + tw * eff, ty, Math.max(0, tw * (Math.max(acc, eff) - eff)), th);
    pctx.strokeStyle = alpha(pal.tease, 0.9); pctx.lineWidth = 1.5;
    pctx.beginPath(); pctx.moveTo(tx + tw * thr, ty - 4); pctx.lineTo(tx + tw * thr, ty + th + 4); pctx.stroke();
    if (st.cap < 0.999) {
      pctx.strokeStyle = alpha('#ff8a5c', 0.8);
      pctx.beginPath(); pctx.moveTo(tx + tw * st.cap, ty - 3); pctx.lineTo(tx + tw * st.cap, ty + th + 3); pctx.stroke();
    }
    pctx.font = '10px ' + pal.mono; pctx.textAlign = 'left'; pctx.textBaseline = 'top';
    pctx.fillStyle = alpha(pal.good, 0.95);
    pctx.fillText('VALIDATION ' + (eff * 100).toFixed(0) + '%', tx, ty + th + 4);
    pctx.textAlign = 'right'; pctx.fillStyle = 'rgba(255,184,107,0.95)';
    pctx.fillText('TRAINING ' + (acc * 100).toFixed(0) + '%', tx + tw, ty + th + 4);
    pctx.textAlign = 'left'; pctx.textBaseline = 'alphabetic';
  }

  /** pin the canvas to the world band and hand the context world-local units */
  function placeInstrument(lod) {
    const top = stratumTop(3);
    const a = world.toScreen({ x: BAND.x, y: top + BAND.y });
    const b = world.toScreen({ x: BAND.x + BAND.w, y: top + BAND.y + BAND.h });
    const w = Math.round(b.x - a.x), h = Math.round(b.y - a.y);
    const vis = w > 24 && h > 12 && b.x > 0 && a.x < (win.innerWidth || 1280) && b.y > 0 && a.y < (win.innerHeight || 800);
    setStyle(plot, 'display', vis ? '' : 'none');
    if (!vis) return;
    setStyle(plot, 'left', Math.round(a.x) + 'px');
    setStyle(plot, 'top', Math.round(a.y) + 'px');
    setStyle(plot, 'width', w + 'px');
    setStyle(plot, 'height', h + 'px');
    const dpr = win.devicePixelRatio || 1;
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (plotW !== cw || plotH !== ch) { plot.width = cw; plot.height = ch; plotW = cw; plotH = ch; }
    pctx.setTransform(cw / BAND.w, 0, 0, ch / BAND.h, 0, 0);
    drawInstrument(lod);
  }

  /* ---------- per-frame update ---------- */
  let snapped = false;
  function syncFoundry() {
    const f = sim.node('foundry'), n = buy.n;
    const a = { type: 'supply', era: 3, n: n };
    const amount = foundrySupplyCost(sim, n);
    setTxt(fCnt, '×' + (f ? f.count : 0));
    setTxt(fCost, isFinite(amount) ? fmt(amount) + ' silicon' + (n > 1 ? ' ×' + n : '') : '');   // the whole row is the build button
    setDis(fdy, !sim.can(a));
  }
  function sync() {
    syncFoundry();
    const e = E(), S = sim.state;
    if (!snapped) { snapped = true; if (!world.isOverview && world.locked !== 3) world.lockTo(3, false); }

    // the plot eases toward the world's current phase, so a shift visibly slides the data
    phase += ((e.dataPhase || 0) - phase) * (reduced ? 1 : 0.06);
    pulse *= 0.82; if (pulse < 0.01) pulse = 0;

    hud.setRail(RAIL.map((id) => ({ id, value: S.stocks[id] || 0, rate: S.rates[id] || 0 })));
    setTxt(bulk, '×' + buy.n);
    setTxt(mapBtn, world.isOverview ? '⤢ BOARD' : '⤢ MAP');

    // RUN TRIAL never wraps; the live Focus rides the second line in its own colour
    const f = c.focus[focusKey(sim)] || c.focus.fit;
    const short = sim.stock('data') < c.expDataCost;
    hud.renderVerbs([{
      name: 'trial', label: 'RUN TRIAL', key: 'SPACE',
      yield: (e.focus === 'auto' ? '↻ ' : '') + f.label + (short ? ' · need ' + c.expDataCost + ' data' : ' · −' + c.expDataCost + ' data'),
      disabled: short || e.done,
      tip: '<b>Run a trial</b><br><i>' + f.flavor + '</i>'
    }]);
    const vb = hud.verbList.children[0];
    if (vb) { setAttr(vb, 'data-v', 'trial'); if (!vYield) vYield = vb.querySelector('.vyield'); }
    if (vYield) setStyle(vYield, 'color', e.focus === 'auto' ? c.focus.auto.hue : f.hue);

    // the goal: validation walking to the line, in Deep's hue as it wakes
    const g = sim.goal(3);
    hud.renderGoal({
      progress: g.progress, ready: g.ready, name: 'Generalize',
      value: (effAccuracy(sim) * 100).toFixed(0) + '%', label: g.label,
      action: e.done ? 'GENERALIZED' : 'GENERALIZE'
    });
    const si = S.stocks.silicon || 0, siRate = S.rates.silicon || 0;
    setTxt(supCost, fmt(si) + ' silicon · ' + (siRate >= 0 ? '+' : '') + fmt(siRate) + '/s');
    const lowSi = si < sim.costOf('dataset', 1) * 0.5 && siRate <= 0;
    setCls(supBtn, 'e3-sbtn' + (lowSi ? ' can' : ''));

    // the dial: what each Focus is doing right now, and where it expects you to go
    const voice = sim.voice(3);
    const ghostOn = predicting(sim) && !!e.pred && e.focus !== 'auto' && !!voice;
    for (const k of Object.keys(segs)) {
      const s = segs[k], d = s.def;
      setCls(s.btn, 'e3-seg' + (e.focus === k ? ' on' : ''));
      setTxt(s.sd, (d.acc >= 1 ? '▲▲' : '▲') + ' train  ' + (d.red > 0 ? '▼▼ gap' : '▲ gap'));
      const show = ghostOn && e.pred === k && e.focus !== k;
      setTxt(s.ghost, show ? voice : '');
      setCls(s.ghost, 'e3-ghost' + (show ? ' show' : ''));
    }
    const auto = !!e.flags.autopilot;
    if (autoBtn.hidden === auto) autoBtn.hidden = !auto;
    setCls(autoBtn, 'e3-auto' + (e.focus === 'auto' ? ' on' : ''));
    setTxt(dLab, e.predN ? 'CALLED ' + e.predHits + '/' + e.predN : 'TRAINING FOCUS');

    // EXPERIMENTS: the badge names METHOD only when the Method is actually affordable
    const mtd = nextMethod(sim), mCost = expCost(sim, 'method'), methodOk = !!mtd && sim.stock('data') >= mCost;
    if (xpBadge.hidden === methodOk) xpBadge.hidden = !methodOk;
    setCls(xpBtn, 'side-btn e3-xp' + (methodOk ? ' can' : ''));
    setTxt(xpSurvey, mtd && !methodOk ? fmt(sim.stock('data')) + '/' + fmt(mCost) + ' · ' + mtd.name : Math.round(e.survey || 0) + '% surveyed');
    setTxt(dn, Object.keys(e.methods).length + ' / ' + c.methods.length);
    setStyle(svFill, 'width', (e.survey || 0).toFixed(1) + '%');
    setTxt(svDisc, '−' + Math.round((1 - surveyDisc(sim)) * 100) + '%');

    const kinds = boardCards(sim);
    for (let i = 0; i < cards.length; i++) {
      const slot = cards[i], kind = kinds[i];
      slot.kind = kind || null;
      if (!kind) { setStyle(slot.el, 'display', 'none'); continue; }
      setStyle(slot.el, 'display', '');
      const isM = kind === 'method';
      const u = isM ? null : c.utils.find((x) => x.id === kind);
      const name = isM ? (mtd ? mtd.name : '') : u.name;
      const mech = isM ? (mtd ? mtd.mech : '') : u.mech;
      const flav = isM ? (mtd ? mtd.flavor : '') : u.flavor;
      setCls(slot.el, 'e3-card' + (isM ? ' method' : ''));
      setAttr(slot.el, 'data-tip', '<b>' + name + '</b><br><i>' + flav + '</i><br>' + mech);
      if (slot.tag.hidden === isM) slot.tag.hidden = !isM;
      setTxt(slot.nm, name);
      setTxt(slot.lv, isM ? '' : (e.utilLvl[kind] ? 'Lv ' + e.utilLvl[kind] : ''));
      setTxt(slot.cd, mech);
      const cost = expCost(sim, kind), ok = sim.can({ type: 'fund', era: 3, kind: kind });
      setHTML(slot.buy, fmt(cost) + ' data · FUND');
      setDis(slot.buy, !ok);
      setCls(slot.buy, 'buy' + (ok ? ' ok' : ''));
    }

    // plates: the goal lives in the HUD column, so its node never wears one
    const made = world.plates && world.plates.made;
    if (made) for (const id of HIDDEN_PLATES) { const P = made[id]; if (P) setStyle(P.el, 'visibility', 'hidden'); }

    placeInstrument(world.isOverview ? 'silhouette' : (world.camera.zoom >= LOD_PLATE ? 'full' : 'glyph'));
  }

  function activate() { setVar(hud.goalBox, '--tease', STRATA[4].accent); }
  function deactivate() { setStyle(plot, 'display', 'none'); }

  return { sync, onVerb, onGoal, activate, deactivate, toggleResearch: () => setOpen(!open) };
}

export const createView = createStatisticalView;   // the app's convention: every era view exports createView
export default createStatisticalView;
