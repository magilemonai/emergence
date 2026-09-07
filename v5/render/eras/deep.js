// render/eras/deep.js — the Deep stratum's view (WO-05).
// The world canvas carries the fabric itself: the compute node, the Capability bank and the three furnaces
// with the risers climbing into them. This module owns the instrument that steers them: the ternary mixer,
// the three run lanes with their wind sparklines and LOCK, the gauges, the colored event strip, the supply
// bus (build-here buys on the strata below), the Hold lever, the Architecture drawer and the tool rows.
// Desktop only at 1280x800 (SPEC "Refused": no mobile layout); the world pans, the page never scrolls.
// BUILD-ONCE: every element is created in createView and only ever updated by change-detected setters.

import { setTxt, setHTML, setDis, setCls, setStyle, setAttr, setVar, fmt } from '../hud.js';
import { STRATA, resHue, resGlyph } from '../palette.js';
import {
  RUN_HUE, HIDDEN_PLATES, breadth, geom, needOf, fedLevel, computeRate, throttleOf, shareOf,
  demandOf, driftBite, hiLo, holdOn, holdBurn, archCost, archOwned, lockCost, restoreCost,
  supplyCount, supplyCost, supplyRate
} from '../../engine/eras/deep.js';

/* the mixer's corners in unit space; the handle is the barycentric point of the three shares */
const TRI = { vision: { x: 0.5, y: 0.08 }, language: { x: 0.08, y: 0.9 }, reasoning: { x: 0.92, y: 0.9 } };
const RAIL = ['capability', 'silicon', 'data', 'insight', 'knowledge'];
const FC_STEPS = 20, FC_SPAN = 0.6;          // the sparkline: 20 samples across the next twelve seconds

const CSS = `
.d-side { margin-top: 10px; display: flex; flex-direction: column; gap: 7px; }
.d-head { font-family: var(--era-font, sans-serif); font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--dimmer, #5f7799); margin: 3px 0 0; }
.d-sup { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; width: 100%; padding: 7px 9px; border-radius: 10px;
  border: 1px solid var(--line, #1c2f4a); background: var(--panel, #07111d); color: var(--text, #dceaff);
  font-family: var(--body-font, sans-serif); font-size: 12px; cursor: pointer; text-align: left;
  transition: border-color 0.16s ease, box-shadow 0.5s ease; }
.d-sup:hover { border-color: var(--accent, #6ea8ff); }
.d-sup.can { border-color: color-mix(in srgb, var(--good, #82ffc8) 52%, transparent); }
.d-sup .sg { flex: none; width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; font-size: 13px; }
.d-sup .sn { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.d-sup .sc { font-family: var(--mono, monospace); font-size: 11px; color: var(--accent, #6ea8ff); }
.d-sup .sx { font-family: var(--mono, monospace); font-size: 11px; color: var(--dim, #8ea6c8); white-space: nowrap; }
.d-sup .so { flex-basis: 100%; font-family: var(--mono, monospace); font-size: 10.5px; color: var(--dimmer, #5f7799); }
.d-sup.si-low { box-shadow: 0 0 0 1px #ffb15c88, 0 0 14px #ffb15c44; border-color: #ffb15c; }
.d-sup.held { border-style: dashed; opacity: 0.82; }
.d-sup.warn { box-shadow: 0 0 0 1px #ffb15c88, 0 0 14px #ffb15c44; }
.d-tools { display: flex; flex-wrap: wrap; gap: 6px; }
.d-tool { flex: 1 1 46%; min-width: 0; padding: 7px 8px; border-radius: 9px; border: 1px solid var(--line, #1c2f4a);
  background: var(--panel-2, #0b1420); color: var(--text, #dceaff); cursor: pointer; text-align: left;
  font-family: var(--body-font, sans-serif); display: flex; flex-direction: column; gap: 2px; }
.d-tool.wide { flex-basis: 100%; }
.d-tool .tn { font-size: 11px; letter-spacing: 0.08em; }
.d-tool .ts { font-family: var(--mono, monospace); font-size: 10.5px; color: var(--dim, #8ea6c8); }
.d-tool:disabled { opacity: 0.42; cursor: not-allowed; }
.d-tool.ready { border-color: var(--good, #82ffc8); }

/* the instrument: one plate in the pipeline field, under the furnaces it steers */
.drawer.show { z-index: 30; }   /* the architecture drawer opens OVER the fabric, never behind it */
.fabric { position: fixed; left: 248px; right: 330px; bottom: 12px; z-index: 20; display: flex; flex-direction: column; gap: 8px;
  padding: 10px 12px 11px; border-radius: 14px; border: 1px solid var(--edge, #2b4570);
  background: color-mix(in srgb, var(--panel, #07111d) 88%, transparent);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.55); pointer-events: auto; }
.eb { display: flex; align-items: center; gap: 9px; height: 26px; padding: 0 10px; border-radius: 7px;
  border-left: 3px solid transparent; background: var(--panel-2, #0b1420);
  font-family: var(--mono, monospace); font-size: 11.5px; letter-spacing: 0.12em; color: var(--dim, #8ea6c8);
  transition: background 0.3s ease, color 0.3s ease; }
.eb .ebw { color: var(--text, #dceaff); font-weight: 600; }
.eb .ebr { font-weight: 600; }
.eb .ebt { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--dim, #8ea6c8); }
.eb.shift { background: color-mix(in srgb, var(--danger, #ff5f6d) 16%, var(--panel-2, #0b1420)); }
.eb.brk { background: color-mix(in srgb, var(--good, #82ffc8) 15%, var(--panel-2, #0b1420)); }
.eb.warn { background: color-mix(in srgb, #ffb15c 14%, var(--panel-2, #0b1420)); }
.eb.hot { background: color-mix(in srgb, #ffb15c 22%, var(--panel-2, #0b1420)); border-left-color: #ffb15c; }
.eb.odd { background: color-mix(in srgb, var(--tease, #b78bff) 18%, var(--panel-2, #0b1420)); border-left-color: var(--tease, #b78bff);
  color: var(--text, #dceaff); letter-spacing: 0.04em; }
.fab-main { display: flex; gap: 10px; align-items: stretch; }

.mixer { position: relative; flex: none; width: 214px; height: 200px; touch-action: none;
  user-select: none; -webkit-user-select: none; cursor: crosshair; }
.mixer svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.tri-out { fill: none; stroke: var(--edge, #2b4570); stroke-width: 0.7; }
.tri-feed { stroke-width: 0.8; stroke-linecap: round; }
.tri-bal { fill: var(--dimmer, #5f7799); }
.tri-h { position: absolute; width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.85); pointer-events: none; }
.mixer.dragging .tri-h { transform: scale(1.18); }
.tc { position: absolute; font-family: var(--mono, monospace); font-size: 10px; letter-spacing: 0.1em; white-space: nowrap; }
.tc b { display: block; font-size: 14px; letter-spacing: 0; }
.tc.need { animation: dneed 1.1s ease-in-out infinite; }
.tc-v { top: -2px; left: 50%; transform: translateX(-50%); text-align: center; }
.tc-l { bottom: 0; left: 0; }
.tc-r { bottom: 0; right: 0; text-align: right; }
.mx-lab { position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
  font-family: var(--mono, monospace); font-size: 9px; letter-spacing: 0.14em; color: var(--dimmer, #5f7799); }
@keyframes dneed { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

.lanes { flex: 1; display: flex; gap: 8px; min-width: 0; }
.lane { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding: 8px 9px 7px;
  border-radius: 10px; border: 1px solid var(--line, #1c2f4a); background: var(--panel-2, #0b1420);
  border-left: 3px solid var(--rc, #6ea8ff); transition: box-shadow 0.3s ease, opacity 0.3s ease; }
.lane.low { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--danger, #ff5f6d) 55%, transparent); }
.lane.front { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--good, #82ffc8) 60%, transparent); }
.lane.frozen { opacity: 0.62; border-style: dashed; }
.lane-h { display: flex; align-items: baseline; gap: 6px; }
.lane-n { font-family: var(--era-font, sans-serif); font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--rc, #6ea8ff); }
.lane-t { margin-left: auto; font-size: 11px; }
.lane-t.up { color: var(--good, #82ffc8); } .lane-t.dn { color: var(--danger, #ff5f6d); }
.lane-cap { font-family: var(--mono, monospace); font-size: 22px; font-variant-numeric: tabular-nums; line-height: 1; }
.lane-cap small { font-size: 10px; color: var(--dimmer, #5f7799); margin-left: 2px; }
.lane-net { font-family: var(--mono, monospace); font-size: 10.5px; float: right; }
.lane-net.up { color: var(--good, #82ffc8); } .lane-net.dn { color: var(--danger, #ff5f6d); }
.lane-feed { font-family: var(--mono, monospace); font-size: 10.5px; color: var(--dim, #8ea6c8); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }
.lane-feed.starved { color: var(--danger, #ff5f6d); }
.lane-feed.fed { color: var(--good, #82ffc8); }
.wind { width: 100%; height: 26px; display: block; }
.fc-w { fill: none; stroke-width: 1.6; }
.fc-s { stroke: rgba(255, 255, 255, 0.45); stroke-width: 1; stroke-dasharray: 3 3; }
.lane-lock { padding: 4px 6px; border-radius: 7px; border: 1px solid var(--line, #1c2f4a);
  background: var(--panel, #07111d); color: var(--dim, #8ea6c8); font-family: var(--mono, monospace);
  font-size: 10px; letter-spacing: 0.1em; cursor: pointer; }
.lane-lock:hover:not(:disabled) { border-color: var(--accent, #6ea8ff); color: var(--text, #dceaff); }
.lane-lock:disabled { opacity: 0.42; cursor: not-allowed; }

.gauges { display: flex; gap: 12px; }
.gauge { flex: 1; }
.gauge-l { display: flex; gap: 6px; font-family: var(--mono, monospace); font-size: 10px; letter-spacing: 0.12em;
  color: var(--dimmer, #5f7799); }
.gauge-l b { margin-left: auto; letter-spacing: 0; color: var(--text, #dceaff); font-variant-numeric: tabular-nums; }
.gauge-b { height: 5px; margin-top: 3px; border-radius: 3px; background: rgba(255, 255, 255, 0.07); overflow: hidden; }
.gauge-b i { display: block; height: 100%; background: var(--accent, #6ea8ff); transition: width 0.25s linear; }

/* the architecture drawer reuses the shared .drawer frame; these are its tiles */
.a-tile { display: flex; gap: 9px; padding: 9px 10px; border-radius: 11px; border: 1px solid var(--line, #1c2f4a); background: var(--panel, #07111d); }
.a-tile.can { border-color: color-mix(in srgb, var(--good, #82ffc8) 55%, transparent); }
.a-tile.owned { opacity: 0.6; }
.a-g { flex: none; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 15px; border: 1px solid currentColor; }
.a-b { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.a-n { font-family: var(--era-font, sans-serif); font-size: 12.5px; }
.a-e { font-family: var(--mono, monospace); font-size: 10.5px; color: var(--dim, #8ea6c8); min-height: 26px; line-height: 1.24; }
.a-lv { color: var(--accent, #6ea8ff); }
.d-runs { display: flex; gap: 8px; justify-content: center; font-family: var(--mono, monospace); font-size: 13px; margin-bottom: 4px; }
.d-chain { font-family: var(--mono, monospace); font-size: 10px; color: var(--dimmer, #5f7799); text-align: center; margin-top: 4px; }
@media (prefers-reduced-motion: reduce) {
  .tc.need { animation: none; opacity: 0.9; }
  .gauge-b i, .lane, .eb, .d-sup { transition: none; }
}
`;

/** createView({hud, world, sim, buy, assets}) -> { sync, onVerb, onGoal, toggleResearch } */
export function createView(opts) {
  const hud = opts.hud, world = opts.world, sim = opts.sim, buy = opts.buy;
  const doc = hud.root.ownerDocument;
  const c = sim.cfg.e4;
  const E = () => sim.state.eras[4];
  const KEYS = c.domains.map((d) => d.k);
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };
  const svg = (tag) => doc.createElementNS('http://www.w3.org/2000/svg', tag);
  const act = (a) => sim.apply(Object.assign({ era: 4 }, a));

  const style = doc.createElement('style');
  style.textContent = CSS;
  doc.head.appendChild(style);

  /* ---------- the rail: the banks, the bulk-buy mode and the zoom out ---------- */
  const bulk = el('rail-btn', 'button'), mapBtn = el('rail-btn', 'button');
  hud.railRight.appendChild(bulk); hud.railRight.appendChild(mapBtn);
  bulk.addEventListener('click', () => { const i = c.buyModes.indexOf(buy.n); buy.n = c.buyModes[(i + 1) % c.buyModes.length]; });
  mapBtn.addEventListener('click', () => { if (world.isOverview) world.lockTo(4, true); else world.overview(true); });

  /* ---------- the left column: the supply bus, the Hold lever, Architecture, the tools ---------- */
  const side = el('d-side');
  const supHead = el('d-head'); setTxt(supHead, 'SUPPLY');
  side.appendChild(supHead);
  const sups = {};
  for (const s of c.supply) {
    const b = el('d-sup', 'button');
    b.setAttribute('data-tip', s.tip);
    const g = el('sg'); setTxt(g, s.glyph);
    setStyle(g, 'color', resHue(s.out));
    setStyle(g, 'background', resHue(s.out) + '22');
    setStyle(g, 'border', '1px solid ' + resHue(s.out) + '55');
    const nm = el('sn'); setTxt(nm, s.name);
    const cnt = el('sc'), cost = el('sx'), out = el('so');
    b.appendChild(g); b.appendChild(nm); b.appendChild(cnt); b.appendChild(cost); b.appendChild(out);
    side.appendChild(b);
    b.addEventListener('click', () => act({ type: 'supply', key: s.key, n: buy.n }));
    sups[s.key] = { el: b, cnt, cost, out, def: s };
  }
  const hold = el('d-sup', 'button');
  hold.setAttribute('data-tip', '<b>Hold the crafts</b><br><i>Smelters and Foundries burn Knowledge, the same pool the Language run drinks from.</i><br>Hold pauses both. No Metal and no Silicon while held. Release any time.');
  const holdG = el('sg'); setStyle(holdG, 'color', resHue('knowledge'));
  setStyle(holdG, 'background', resHue('knowledge') + '22');
  setStyle(holdG, 'border', '1px solid ' + resHue('knowledge') + '55');
  const holdN = el('sn'); setTxt(holdN, 'Smelters + Foundries');
  const holdS = el('sc'), holdB = el('so');
  hold.appendChild(holdG); hold.appendChild(holdN); hold.appendChild(holdS); hold.appendChild(holdB);
  side.appendChild(hold);
  hold.addEventListener('click', () => act({ type: 'hold', on: !holdOn(sim) }));

  const steerHead = el('d-head'); setTxt(steerHead, 'STEERING');
  side.appendChild(steerHead);
  const archBtn = el('side-btn', 'button');
  archBtn.setAttribute('data-tip', '<b>Architecture</b><br><i>Seven upgrades, paid in Capability.</i><br>Each one bends the steering geometry. None of them is a flat bonus.');
  const archBadge = el('sb-n'), archLab = el('sb-l');
  archBtn.appendChild(archBadge); archBtn.appendChild(archLab);
  side.appendChild(archBtn);

  const tools = el('d-tools');
  const ckBtn = el('d-tool', 'button'), rsBtn = el('d-tool', 'button'), dsBtn = el('d-tool wide', 'button');
  const mkTool = (b, name, tip) => {
    b.setAttribute('data-tip', tip);
    const n = el('tn'); setTxt(n, name);
    const s = el('ts');
    b.appendChild(n); b.appendChild(s);
    return s;
  };
  const ckSub = mkTool(ckBtn, 'CHECKPOINT', '<b>Checkpoint</b><br><i>Save the weights.</i><br>Snapshots all three runs. Free.');
  const rsSub = mkTool(rsBtn, 'RESTORE', '<b>Restore</b><br><i>Roll back to the checkpoint.</i><br>Brings every run up to the saved figure. It never lowers one. Costs Capability, then cools.');
  const dsName = el('tn'), dsSub = el('ts');
  dsBtn.setAttribute('data-tip', '<b>Distill</b><br><i>Teach the small model what the big one knows.</i><br>Your highest run gives points, your lowest gains fewer. Breadth is a geometric mean, so it is usually worth it.');
  dsBtn.appendChild(dsName); dsBtn.appendChild(dsSub);
  tools.appendChild(ckBtn); tools.appendChild(rsBtn); tools.appendChild(dsBtn);
  side.appendChild(tools);
  hud.verbList.parentNode.appendChild(side);
  ckBtn.addEventListener('click', () => act({ type: 'checkpoint' }));
  rsBtn.addEventListener('click', () => act({ type: 'restore' }));
  dsBtn.addEventListener('click', () => act({ type: 'distill' }));

  /* ---------- the goal column: the three runs, then the meter ---------- */
  const runsRead = el('d-runs'), runVals = {};
  for (const k of KEYS) { const s = el(); setStyle(s, 'color', RUN_HUE[k]); runsRead.appendChild(s); runVals[k] = s; }
  hud.goalExtra(runsRead);
  const chain = el('d-chain');
  hud.goalBox.appendChild(chain);
  setVar(hud.goalBox, '--tease', STRATA[5].accent);      // the gate wakes in Foundation violet

  /* ---------- the instrument ---------- */
  const fabric = el('fabric');
  const banner = el('eb');
  const bIcon = el('ebw'), bRun = el('ebr'), bT = el('ebt');
  banner.appendChild(bIcon); banner.appendChild(bRun); banner.appendChild(bT);
  fabric.appendChild(banner);

  const main = el('fab-main');
  const mixer = el('mixer');
  const msvg = svg('svg'); msvg.setAttribute('viewBox', '0 0 100 100'); msvg.setAttribute('preserveAspectRatio', 'none');
  const feeds = {};
  for (const k of KEYS) {
    const ln = svg('line'); ln.setAttribute('class', 'tri-feed'); ln.setAttribute('stroke', RUN_HUE[k]);
    ln.setAttribute('x1', String(TRI[k].x * 100)); ln.setAttribute('y1', String(TRI[k].y * 100));
    msvg.appendChild(ln); feeds[k] = ln;
  }
  const outline = svg('polygon'); outline.setAttribute('class', 'tri-out');
  outline.setAttribute('points', KEYS.map((k) => (TRI[k].x * 100) + ',' + (TRI[k].y * 100)).join(' '));
  msvg.appendChild(outline);
  const balPt = svg('circle'); balPt.setAttribute('class', 'tri-bal'); balPt.setAttribute('r', '1.3');
  balPt.setAttribute('cx', String(KEYS.reduce((a, k) => a + TRI[k].x * 100, 0) / 3));
  balPt.setAttribute('cy', String(KEYS.reduce((a, k) => a + TRI[k].y * 100, 0) / 3));
  msvg.appendChild(balPt);
  mixer.appendChild(msvg);
  const corners = {}, cls4 = { vision: 'tc tc-v', language: 'tc tc-l', reasoning: 'tc tc-r' };
  for (const k of KEYS) {
    const t = el(cls4[k]);
    setStyle(t, 'color', RUN_HUE[k]);
    const lab = doc.createTextNode(k === 'reasoning' ? 'REASON' : k === 'language' ? 'LANG' : 'VISION');
    const pct = doc.createElement('b');
    t.appendChild(lab); t.appendChild(pct);
    mixer.appendChild(t);
    corners[k] = { el: t, pct: pct };
  }
  const mxLab = el('mx-lab'); setTxt(mxLab, 'DRAG TO ROUTE');
  mixer.appendChild(mxLab);
  const handle = el('tri-h');
  mixer.appendChild(handle);
  main.appendChild(mixer);

  const lanes = el('lanes'), lane = {};
  for (const d of c.domains) {
    const k = d.k, L = el('lane');
    setVar(L, '--rc', RUN_HUE[k]);
    L.setAttribute('data-tip', '<b>' + d.label + ' run</b><br><i>A training run, drifting on its own wind.</i><br>Draws ' + c.feedstock[k] + '. The line is its demand; the dashes are the share you feed it.');
    const h = el('lane-h');
    const nm = el('lane-n'); setTxt(nm, d.label);
    const tr = el('lane-t');
    h.appendChild(nm); h.appendChild(tr);
    const capRow = el();
    const net = el('lane-net');
    const cap = el('lane-cap');
    const capV = doc.createElement('span'), capS = doc.createElement('small'); setTxt(capS, '%');
    cap.appendChild(capV); cap.appendChild(capS);
    capRow.appendChild(net); capRow.appendChild(cap);
    const feed = el('lane-feed');
    const w = svg('svg'); w.setAttribute('class', 'wind'); w.setAttribute('viewBox', '0 0 100 26'); w.setAttribute('preserveAspectRatio', 'none');
    const wl = svg('polyline'); wl.setAttribute('class', 'fc-w'); wl.setAttribute('stroke', RUN_HUE[k]);
    const sl = svg('line'); sl.setAttribute('class', 'fc-s'); sl.setAttribute('x1', '0'); sl.setAttribute('x2', '100');
    w.appendChild(wl); w.appendChild(sl);
    const lk = el('lane-lock', 'button');
    L.appendChild(h); L.appendChild(capRow); L.appendChild(feed); L.appendChild(w); L.appendChild(lk);
    lanes.appendChild(L);
    lk.addEventListener('click', () => act({ type: 'lock', run: k }));
    lane[k] = { el: L, cap: capV, net, trend: tr, feed, wind: wl, share: sl, lock: lk };
  }
  main.appendChild(lanes);
  fabric.appendChild(main);

  const gauges = el('gauges'), gauge = {};
  for (const g of [['CAPABILITY', 'cap'], ['COMPUTE', 'compute'], ['HEAT', 'heat']]) {
    const box = el('gauge');
    if (g[1] === 'heat') box.setAttribute('data-tip', '<b>Heat</b><br><i>Concentrating compute to fight drift heats the fabric.</i><br>A hot fabric throttles all output. Concentrate to counter the wind, then ease toward balanced to cool.');
    const l = el('gauge-l'); const nm = doc.createElement('span'); setTxt(nm, g[0]);
    const v = doc.createElement('b');
    l.appendChild(nm); l.appendChild(v);
    const bar = el('gauge-b'); const fill = doc.createElement('i');
    bar.appendChild(fill);
    box.appendChild(l); box.appendChild(bar);
    gauges.appendChild(box);
    gauge[g[1]] = { v, fill };
  }
  fabric.appendChild(gauges);
  hud.root.appendChild(fabric);

  /* ---------- the mixer drag: pointer events, captured, so the handle follows off the plate ---------- */
  let dragging = false;
  function allocFromXY(fx, fy) {
    const A = TRI.vision, B = TRI.language, D = TRI.reasoning;
    const det = (B.y - D.y) * (A.x - D.x) + (D.x - B.x) * (A.y - D.y);
    const wv = ((B.y - D.y) * (fx - D.x) + (D.x - B.x) * (fy - D.y)) / det;
    const wl = ((D.y - A.y) * (fx - D.x) + (A.x - D.x) * (fy - D.y)) / det;
    act({ type: 'alloc', vision: Math.max(0, wv), language: Math.max(0, wl), reasoning: Math.max(0, 1 - wv - wl) });
  }
  function fromEvent(e) {
    const r = mixer.getBoundingClientRect();
    allocFromXY(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)));
  }
  mixer.addEventListener('pointerdown', (e) => {
    dragging = true;
    setCls(mixer, 'mixer dragging');
    if (mixer.setPointerCapture) { try { mixer.setPointerCapture(e.pointerId); } catch (_) { dragging = true; } }
    fromEvent(e);
  });
  mixer.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  const endDrag = () => { dragging = false; setCls(mixer, 'mixer'); };
  mixer.addEventListener('pointerup', endDrag);
  mixer.addEventListener('pointercancel', endDrag);

  /* ---------- the architecture drawer ---------- */
  const drawer = el('drawer');
  const dHead = el('dr-head'), dTitle = el('dr-t'), dCount = el('dr-n'), dX = el('dr-x', 'button');
  setTxt(dTitle, 'ARCHITECTURE'); setTxt(dX, '✕');
  dHead.appendChild(dTitle); dHead.appendChild(dCount); dHead.appendChild(dX);
  const dBody = el('dr-body');
  drawer.appendChild(dHead); drawer.appendChild(dBody);
  hud.root.appendChild(drawer);
  const tiles = {};
  for (const a of c.archTree) {
    const t = el('a-tile');
    t.setAttribute('data-tip', '<b>' + a.name + '</b><br>' + a.tip);
    const g = el('a-g'); setTxt(g, a.glyph); setStyle(g, 'color', a.col);
    const body = el('a-b');
    const nm = el('a-n'), lv = doc.createElement('span'); lv.className = 'a-lv';
    nm.appendChild(doc.createTextNode(a.name)); nm.appendChild(lv);
    const ef = el('a-e'); setTxt(ef, a.eff);
    const b = el('buy', 'button');
    body.appendChild(nm); body.appendChild(ef); body.appendChild(b);
    t.appendChild(g); t.appendChild(body);
    dBody.appendChild(t);
    b.addEventListener('click', () => act({ type: 'arch', id: a.id }));
    tiles[a.id] = { el: t, buy: b, lv, def: a };
  }
  let open = false;
  const setOpen = (v) => { open = v; setCls(drawer, 'drawer' + (open ? ' show' : '')); };
  archBtn.addEventListener('click', () => setOpen(!open));
  dX.addEventListener('click', () => setOpen(false));
  // dev tooling: the shot tool addresses this drawer by scene name, the way app.js does for research
  const win = doc.defaultView;
  if (win && win.location && /deep-architecture/.test(win.location.hash)) setOpen(true);

  /* ---------- verbs + goal ---------- */
  function onVerb(name) { if (name === 'buyNode') act({ type: 'buyNode', n: buy.n }); }
  function onGoal() { act({ type: 'advance' }); }

  /** the sparkline: this run's demand across the next twelve seconds against the share you feed it */
  function windPoints(k) {
    let pts = '';
    for (let i = 0; i <= FC_STEPS; i++) {
      const d = demandOf(sim, k, i * FC_SPAN);
      pts += (i * (100 / FC_STEPS)).toFixed(1) + ',' + (25 - Math.min(1, d / 0.6) * 23).toFixed(1) + ' ';
    }
    return pts.trim();
  }

  /* ---------- per-frame update ---------- */
  let framed = false;
  function sync() {
    const st = sim.state, e = E();
    if (!framed) { framed = true; if (!world.isOverview && world.locked !== 4) world.lockTo(4, false); }

    const rail = [];
    for (const id of RAIL) if (id in st.stocks) rail.push({ id: id, value: st.stocks[id], rate: st.rates[id] || 0 });
    hud.setRail(rail);
    setTxt(bulk, '×' + buy.n);
    setTxt(mapBtn, world.isOverview ? '⤢ BOARD' : '⤢ MAP');

    const cr = computeRate(sim), thr = throttleOf(sim), nodeN = sim.node('node').count;
    const cost = sim.costOf('node', buy.n);
    hud.renderVerbs([{
      name: 'buyNode', label: 'BUILD NODE ×' + nodeN,
      yield: fmt(cost) + ' Si → +' + fmt(nodeN > 0 ? cr / nodeN : c.nodeCompute) + '/s',
      key: 'SPACE', disabled: st.stocks.silicon < cost,
      tip: '<b>Compute Node</b><br><i>Silicon, wired into one fabric.</i><br>Compute for the three runs. Capability follows breadth.'
    }]);

    // the supply bus: what it costs, what it actually returns, and the Silicon warning on the Foundry
    const nodeNext = sim.costOf('node', 1), siLow = st.stocks.silicon < nodeNext * 0.5 && (st.rates.silicon || 0) < 1.5;
    for (const key of Object.keys(sups)) {
      const S = sups[key], def = S.def, target = sim.node(def.node);
      setStyle(S.el, 'display', target ? '' : 'none');
      if (!target) continue;
      const price = supplyCost(sim, def, buy.n), can = st.stocks.silicon >= price;
      setTxt(S.cnt, '×' + supplyCount(sim, def));
      setTxt(S.cost, (buy.n > 1 ? '+' + buy.n + ' · ' : '') + fmt(price) + ' Si');
      setHTML(S.out, '+<b>' + fmt(supplyRate(sim, def)) + '</b> ' + def.out + '/s');
      setCls(S.el, 'd-sup' + (can ? ' can' : '') + (key === 'foundry' && siLow ? ' si-low' : ''));
    }
    const held = holdOn(sim), burn = holdBurn(sim);
    const langLow = st.edges.some((x) => x.to === 'run.language' && x.starved);
    setTxt(holdG, held ? '⏸' : '⚒');
    setTxt(holdS, held ? 'HELD' : 'RUN');
    setHTML(holdB, held ? 'held · no Metal, no Silicon' : (burn > 0 ? 'burning −<b>' + fmt(burn) + '</b> knowledge/s' : 'idle'));
    setCls(hold, 'd-sup' + (held ? ' held' : '') + (!held && burn > 0 && langLow ? ' warn' : ''));

    // per-run figures, computed once and read by the mixer, the lanes and the corner glow
    const info = {};
    for (const k of KEYS) {
      const share = shareOf(sim, k), g = geom(sim, k), need = needOf(sim, k);
      const edge = st.edges.find((x) => x.to === 'run.' + k);
      const starved = !!(edge && edge.starved);
      const short = Math.max(0, demandOf(sim, k, 0) - share);
      const erode = driftBite(sim) * short * (0.3 + 0.7 * e[k]) * cr;
      const evB = !!(e.event && e.event.type === 'breakthrough' && e.event.run === k);
      const evS = !!(e.event && e.event.type === 'shift' && e.event.run === k);
      const feedMult = need > 0 && edge ? Math.min(1, edge.flow / need) : 1;
      const gain = c.capGain * share * cr * (1 - e[k]) * feedMult * thr * (evB ? c.breakthroughMult : 1) * g.gain * (1 + c.fedBonus * fedLevel(sim, k));
      const locked = e.locks[k] > 0;
      info[k] = { share, need, starved, locked, evB, evS, net: locked ? 0 : gain - erode };
    }

    // the mixer: the handle is where the three shares meet, tinted by the mix it sits in
    let hx = 0, hy = 0;
    for (const k of KEYS) { hx += info[k].share * TRI[k].x; hy += info[k].share * TRI[k].y; }
    setStyle(handle, 'left', (hx * 100).toFixed(2) + '%');
    setStyle(handle, 'top', (hy * 100).toFixed(2) + '%');
    const mix = (i) => Math.round(KEYS.reduce((a, k) => a + info[k].share * parseInt(RUN_HUE[k].slice(1 + i * 2, 3 + i * 2), 16), 0));
    const hc = 'rgb(' + mix(0) + ',' + mix(1) + ',' + mix(2) + ')';
    setStyle(handle, 'background', hc);
    setStyle(handle, 'boxShadow', '0 0 14px ' + hc);
    for (const k of KEYS) {
      const f = feeds[k];
      setAttr(f, 'x2', (hx * 100).toFixed(1)); setAttr(f, 'y2', (hy * 100).toFixed(1));
      setStyle(f, 'strokeOpacity', (0.12 + 0.88 * info[k].share).toFixed(2));
      setTxt(corners[k].pct, Math.round(info[k].share * 100) + '%');
      const need = !info[k].locked && (info[k].net < 0 || info[k].starved || info[k].evB || info[k].evS);
      setCls(corners[k].el, cls4[k] + (need ? ' need' : ''));
    }

    // the lanes
    for (const d of c.domains) {
      const k = d.k, L = lane[k], i = info[k];
      setTxt(L.cap, (e[k] * 100).toFixed(0));
      setTxt(L.net, i.locked ? 'frozen' : (i.net >= 0 ? '+' : '−') + fmt(Math.abs(i.net) * 100) + '/s');
      setCls(L.net, 'lane-net' + (i.locked ? '' : i.net >= 0 ? ' up' : ' dn'));
      setTxt(L.trend, i.locked ? '■' : i.net >= 0 ? '▲' : '▼');
      setCls(L.trend, 'lane-t' + (i.locked ? '' : i.net >= 0 ? ' up' : ' dn'));
      const fl = fedLevel(sim, k);
      setTxt(L.feed, resGlyph(c.feedstock[k]) + ' ' + fmt(st.stocks[c.feedstock[k]] || 0) + (i.need > 0 ? ' · −' + fmt(i.need) + '/s' : ''));
      setCls(L.feed, 'lane-feed' + (i.starved ? ' starved' : fl >= 0.99 ? ' fed' : ''));
      setCls(L.el, 'lane' + (i.locked ? ' frozen' : i.evB ? ' front' : (i.starved || i.evS || i.net < 0) ? ' low' : ''));
      setAttr(L.wind, 'points', windPoints(k));
      const sy = (25 - Math.min(1, i.share / 0.6) * 23).toFixed(1);
      setAttr(L.share, 'y1', sy); setAttr(L.share, 'y2', sy);
      const lc = lockCost(sim);
      setTxt(L.lock, i.locked ? '🔒 ' + Math.ceil(e.locks[k]) + 's' : 'LOCK · ' + fmt(lc) + ' cap');
      setDis(L.lock, i.locked || st.stocks.capability < lc);
    }

    // the gauges
    setTxt(gauge.cap.v, fmt(st.stocks.capability || 0));
    setStyle(gauge.cap.fill, 'width', Math.min(100, (st.stocks.capability || 0) / 20) + '%');
    setStyle(gauge.cap.fill, 'background', resHue('capability'));
    setTxt(gauge.compute.v, fmt(cr) + '/s');
    setStyle(gauge.compute.fill, 'width', Math.min(100, cr / 0.4) + '%');
    setStyle(gauge.compute.fill, 'background', '#a9cfff');
    const hot = e.heat >= c.heatThrottle, warm = e.heat >= c.heatWarn;
    setTxt(gauge.heat.v, Math.round(e.heat) + (hot ? ' THROTTLING' : warm ? ' WARM' : ''));
    setStyle(gauge.heat.fill, 'width', Math.min(100, (e.heat / c.heatThrottle) * 100) + '%');
    setStyle(gauge.heat.fill, 'background', hot ? 'var(--danger)' : warm ? '#ffb15c' : 'rgba(110,168,255,0.55)');

    // the banner: a colored strip, two words and a countdown. It says one sentence, once, and it is not mine
    const odd = st.flags.oddWind && st.t - st.flags.oddWind < c.oddDur;
    let kind = '', icon = 'HOLDING', runTxt = '', edge2 = '', hue = '', tRead = '';
    if (odd) { kind = ' odd'; icon = sim.voice(4) || ''; }
    else if (e.event) {
      kind = e.event.type === 'shift' ? ' shift' : ' brk';
      icon = e.event.type === 'shift' ? '⚠ SQUALL' : '✦ BREAKTHROUGH';
      runTxt = labelOf(e.event.run); hue = RUN_HUE[e.event.run]; edge2 = hue;
      tRead = Math.ceil(Math.max(0, e.eventT)) + 's';
    } else if (e.eventNext) {
      kind = ' warn'; icon = '▲ ' + (e.eventNext.type === 'shift' ? 'SQUALL' : 'BREAKTHROUGH');
      runTxt = labelOf(e.eventNext.run); hue = RUN_HUE[e.eventNext.run]; edge2 = hue;
      tRead = Math.ceil(Math.max(0, e.eventT)) + 's';
    } else if (warm) { kind = ' hot'; icon = '♨ HOT'; runTxt = 'EASE'; }
    setCls(banner, 'eb' + kind);
    setStyle(banner, 'borderLeftColor', edge2 || 'transparent');
    setTxt(bIcon, icon);
    setTxt(bRun, runTxt);
    setStyle(bRun, 'color', hue || 'var(--dim)');
    setTxt(bT, tRead);

    // architecture: how many are affordable, what each costs, which are built
    let can = 0, owned = 0;
    for (const a of c.archTree) {
      const T = tiles[a.id], has = archOwned(sim, a.id), ok = !has && (st.stocks.capability || 0) >= archCost(sim, a.id);
      if (has) owned++;
      if (ok) can++;
      setTxt(T.lv, a.repeat ? ' Lv ' + e.stabilizer + '/' + c.stabilizerMax : '');
      setTxt(T.buy, has ? (a.repeat ? 'MAXED' : 'BUILT') : fmt(archCost(sim, a.id)) + ' capability');
      setDis(T.buy, !ok);
      setCls(T.buy, 'buy' + (ok ? ' ok' : ''));
      setCls(T.el, 'a-tile' + (has ? ' owned' : ok ? ' can' : ''));
    }
    setTxt(archBadge, String(can));
    setCls(archBadge, 'sb-n' + (can ? ' hot' : ''));
    setTxt(archLab, 'ARCHITECTURE ' + owned + '/' + c.archTree.length);
    setTxt(dCount, owned + ' / ' + c.archTree.length);

    // the tools appear with the upgrade that unlocks them, and never move a button under the pointer
    setStyle(ckBtn, 'display', e.arch.checkpoint ? '' : 'none');
    setStyle(rsBtn, 'display', e.arch.checkpoint ? '' : 'none');
    setStyle(dsBtn, 'display', e.arch.distill ? '' : 'none');
    if (e.arch.checkpoint) {
      const ck = e.ckpt;
      setTxt(ckSub, ck ? [ck.vision, ck.language, ck.reasoning].map((v) => Math.round(v * 100)).join('·') + ' @ ' + Math.floor(ck.t) + 's' : 'none saved');
      let gain = 0;
      if (ck) for (const k of KEYS) gain += Math.max(0, (ck[k] || 0) - e[k]);
      setTxt(rsSub, e.restoreCd > 0 ? 'cooling ' + Math.ceil(e.restoreCd) + 's' : ck ? '+' + Math.round(gain * 100) + ' · ' + fmt(restoreCost(sim)) + ' cap' : 'checkpoint first');
      const rOk = sim.can({ type: 'restore', era: 4 });
      setDis(rsBtn, !rOk);
      setCls(rsBtn, 'd-tool' + (rOk ? ' ready' : ''));
    }
    if (e.arch.distill) {
      const p = hiLo(sim), dOk = sim.can({ type: 'distill', era: 4 });
      setHTML(dsName, 'DISTILL <span style="color:' + RUN_HUE[p.hi] + '">' + labelOf(p.hi) + '</span> → <span style="color:' + RUN_HUE[p.lo] + '">' + labelOf(p.lo) + '</span>');
      setTxt(dsSub, e.distillCd > 0 ? 'cooling ' + Math.ceil(e.distillCd) + 's' : '−' + Math.round(c.distillTake * 100) + ' / +' + Math.round(c.distillGive * 100) + ' · ' + fmt(c.distillCost) + ' cap');
      setDis(dsBtn, !dOk);
      setCls(dsBtn, 'd-tool wide' + (dOk ? ' ready' : ''));
    }
    setDis(ckBtn, !sim.can({ type: 'checkpoint', era: 4 }));

    // the goal
    const g = sim.goal(4), br = breadth(sim);
    hud.renderGoal({
      progress: g.progress, ready: g.ready, name: 'A generally capable model',
      value: (br * 100).toFixed(1) + '%', label: 'breadth · gate ' + Math.round(c.breadthGate * 100) + '%',
      action: e.done ? 'ADVANCED' : 'ADVANCE'
    });
    for (const k of KEYS) setTxt(runVals[k], (e[k] * 100).toFixed(0));
    const fdry = (sim.node('foundry') || { count: 0 }).count;
    setTxt(chain, fdry > 0 ? fdry + ' foundries · +' + Math.round(c.chainPerFoundry * fdry * 100) + '% capability' : '');

    // plates: the goal lives in the HUD column, so its node never draws one
    const made = world.plates && world.plates.made;
    if (made) for (const id of HIDDEN_PLATES) if (made[id]) setStyle(made[id].el, 'visibility', 'hidden');
  }

  function labelOf(k) { for (const d of c.domains) if (d.k === k) return d.label.toUpperCase(); return k; }

  return { sync, onVerb, onGoal, toggleResearch: () => setOpen(!open) };
}

export default createView;
