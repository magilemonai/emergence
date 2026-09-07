// render/fx.js: world-level effects that belong to no single stratum (the legacy surface, the rupture,
// the title card, the film). One clearly marked section per work order so parallel branches merge trivially.

// WO-10: legacy
// Run 2 opens with the surface layer already in place above the Foundation slot, unlit, and a `?` key on the
// board from the first mark. Nothing here reads the sim beyond `state.flags.run2` and `state.legacy`.
import { STRATUM_H, WORLD_W, stratumTop } from '../engine/types.js';
import { STRATA, alpha } from './palette.js';
import { fitStratum, pipeEnds, worldPosOf } from './world.js';
import { route } from './pipes.js';

export const SURFACE_ERA = 6;
const KEY_ID = 'fx-legacy-key';
const STYLE_ID = 'fx-legacy-style';
const SEAM_PX = 4;                 // world px of lit edge where the dark layer meets the Foundation slot
const MARK_ALPHA = 0.2;            // the `?` drawn into the layer itself, barely there

const CSS = [
  '#' + KEY_ID + ' {',
  '  position: fixed; left: 18px; bottom: 18px; z-index: 30;',
  '  display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px;',
  '  font-family: var(--mono, ui-monospace, monospace); font-size: 19px; line-height: 1;',
  '  color: #d9c9ff; background: rgba(8, 4, 14, 0.86); border: 1px solid #3d2d58;',
  '  box-shadow: 0 0 18px rgba(183, 139, 255, 0.22);',
  '  cursor: pointer; pointer-events: auto;',
  '  animation: fxLegacyKey 5.5s ease-in-out infinite;',
  '}',
  '#' + KEY_ID + ':hover { border-color: #b78bff; color: #ffffff; }',
  '@keyframes fxLegacyKey {',
  '  0%, 100% {',
  '    box-shadow: 0 0 12px rgba(183, 139, 255, 0.14);',
  '  }',
  '  50% {',
  '    box-shadow: 0 0 26px rgba(183, 139, 255, 0.36);',
  '  }',
  '}',
  '@media (prefers-reduced-motion: reduce) { #' + KEY_ID + ' { animation: none; } }'
].join('\n');

/**
 * drawDarkSurface(ctx): the surface layer at its slot, unlit, in WORLD coordinates.
 * Called inside the world transform (world.onDraw), so it draws in world units.
 */
export function drawDarkSurface(ctx) {
  const p = STRATA[SURFACE_ERA];
  const top = stratumTop(SURFACE_ERA), bot = top + STRATUM_H;
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, '#06040c');
  g.addColorStop(1, p.panel2);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, WORLD_W, STRATUM_H);
  // the one lit thing about it: the seam it shares with the stratum you have not built yet
  ctx.fillStyle = alpha(p.tease, 0.42);
  ctx.fillRect(0, bot - SEAM_PX, WORLD_W, SEAM_PX);
  const glow = ctx.createLinearGradient(0, bot - STRATUM_H * 0.4, 0, bot);
  glow.addColorStop(0, alpha(p.tease, 0));
  glow.addColorStop(1, alpha(p.tease, 0.12));
  ctx.fillStyle = glow;
  ctx.fillRect(0, bot - STRATUM_H * 0.4, WORLD_W, STRATUM_H * 0.4);
  ctx.save();
  ctx.fillStyle = alpha(p.accent, MARK_ALPHA);
  ctx.font = '300px ' + p.mono;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', WORLD_W / 2, top + STRATUM_H * 0.52);
  ctx.restore();
}

function ensureStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  doc.head.appendChild(s);
}

function ensureKey(doc, root) {
  let k = doc.getElementById(KEY_ID);
  if (k) return k;
  k = doc.createElement('div');
  k.id = KEY_ID;
  k.textContent = '?';
  k.setAttribute('aria-label', 'surface');
  root.appendChild(k);
  return k;
}

/**
 * installLegacyFx({world, sim, doc, root}): the run-2 boot dressing.
 * Draws the dark surface layer whenever `state.flags.run2` is set and puts the `?` key on the board;
 * pressing `?` lifts the camera to the layer, pressing it again drops back where you were.
 * BUILD-ONCE: the key element and the style are created once and only their visibility changes.
 */
export function installLegacyFx(opts) {
  const o = opts || {};
  const world = o.world, sim = o.sim;
  const doc = o.doc || null;
  if (!world || !sim || !doc) return null;

  const isRun2 = () => !!(sim.state && sim.state.flags && sim.state.flags.run2);
  ensureStyle(doc);
  const key = ensureKey(doc, o.root || doc.body);
  let shown = null, parked = null;

  world.onDraw(SURFACE_ERA, (ctx) => { if (isRun2()) drawDarkSurface(ctx); });

  /** look up at the layer, then look back. The camera moves; the locked stratum does not change. */
  function toggle() {
    if (!isRun2()) return;
    const cam = world.camera;
    if (parked) { cam.x = parked.x; cam.y = parked.y; cam.zoom = parked.zoom; parked = null; return; }
    parked = { x: cam.x, y: cam.y, zoom: cam.zoom };
    const vp = { w: (doc.documentElement && doc.documentElement.clientWidth) || 1280, h: (doc.documentElement && doc.documentElement.clientHeight) || 800 };
    const to = fitStratum(SURFACE_ERA, vp);
    cam.x = to.x; cam.y = to.y; cam.zoom = to.zoom;
  }

  const onKey = (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === '?') toggle();
  };
  doc.addEventListener('keydown', onKey);
  key.addEventListener('click', toggle);

  function sync() {
    const on = isRun2();
    if (on === shown) return;
    shown = on;
    key.style.display = on ? '' : 'none';
  }
  sync();

  return {
    sync, toggle, key,
    dispose() { doc.removeEventListener('keydown', onKey); if (key.parentNode) key.parentNode.removeChild(key); }
  };
}

/* ================== WO-11: the stratum title card ==================
   Shown on every handoff (openEra) and at boot: the stratum numeral, its name, in its own display font.
   It never takes pointer events and it removes itself, so nothing it does can block a click. */

export const TITLE_MS = 2200;
export const NUMERAL = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
export const SIGIL = { 1: '◈', 2: '▤', 3: '◇', 4: '△', 5: '✦', 6: '◉' };

const TITLE_CSS = `
.v5-title {
  position: fixed; inset: 0; z-index: 74; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px; pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 72%);
  animation: v5TitleIn 2.2s ease forwards;
}
.v5-title-sig { font-size: 40px; line-height: 1; color: var(--accent, #d6a85f); text-shadow: 0 0 26px currentColor; }
.v5-title-n { font-family: var(--mono, monospace); font-size: 12px; letter-spacing: 0.42em; color: var(--dim, #b6a583); }
.v5-title-name { font-size: 42px; letter-spacing: 0.2em; color: var(--text, #eadfce); text-shadow: 0 4px 30px rgba(0,0,0,0.8); }
@keyframes v5TitleIn {
  0% { opacity: 0; transform: scale(1.04); }
  14% { opacity: 1; transform: none; }
  74% { opacity: 1; }
  100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .v5-title { animation: v5TitleFade 2.2s linear forwards; }
  @keyframes v5TitleFade { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
}
`;

/** injectCss(doc, id, css): one style tag per section, added once, never at import time */
export function injectCss(doc, id, css) {
  if (!doc || !doc.createElement) return null;
  const head = doc.head || doc.documentElement;
  if (!head) return null;
  let tag = doc.getElementById(id);
  if (tag) return tag;
  tag = doc.createElement('style'); tag.id = id; tag.textContent = css;
  head.appendChild(tag);
  return tag;
}

/**
 * titleCard({doc, era, name, font, host, reduced, ms}): the handoff card. Returns the element (or null
 * with no document), and clears itself after ms. A second call replaces the card that is still up.
 */
export function titleCard(opts) {
  const o = opts || {};
  const doc = o.doc || (typeof document !== 'undefined' ? document : null);
  if (!doc || !doc.createElement) return null;
  injectCss(doc, 'v5-title-css', TITLE_CSS);
  const host = o.host || doc.body || doc.documentElement;
  if (!host) return null;
  const era = +o.era || 1;
  const old = doc.querySelector('.v5-title');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  const wrap = doc.createElement('div');
  wrap.className = 'v5-title';
  wrap.setAttribute('data-era', String(era));
  const sig = doc.createElement('div'); sig.className = 'v5-title-sig'; sig.textContent = SIGIL[era] || '◈';
  const num = doc.createElement('div'); num.className = 'v5-title-n'; num.textContent = NUMERAL[era] || String(era);
  const nm = doc.createElement('div'); nm.className = 'v5-title-name';
  nm.textContent = String(o.name || '').toUpperCase();
  if (o.font) nm.style.fontFamily = o.font;
  wrap.appendChild(sig); wrap.appendChild(num); wrap.appendChild(nm);
  host.appendChild(wrap);

  const ms = typeof o.ms === 'number' ? o.ms : TITLE_MS;
  const win = doc.defaultView;
  const drop = () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
  if (win && win.setTimeout) win.setTimeout(drop, ms);
  wrap.addEventListener('animationend', drop);
  return wrap;
}

export default { titleCard, injectCss, TITLE_MS, NUMERAL, SIGIL };

// WO-06: rupture

/** the beats of the turn, in seconds from the first shudder (SPEC "The turn" 1-3) */
const T = { jitter: 1.2, tearAt: 0.3, tearDur: 1.4, tearMax: 96, mineAt: 0.5, mineOff: 2.1, slideAt: 1.5, slideDur: 0.8, riseAt: 2.4, end: 3.4 };
const REDUCED_MS = 600;

/** a stable wobble from the clock alone, so a held frame always draws the same shudder */
function wobble(t, seed) { const x = Math.sin(t * 61.7 + seed * 12.9) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }

/** the same jog the world uses, so a counter-particle rides the pipe the player is looking at */
function jogOf(key) { let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0; return ((h % 7) - 3) * 11; }

/**
 * rupture({world, hud, sim, audio, reduced}): the column shudders, its pipes invert and turn violet, the
 * ceiling of Foundation tears, the surface layer slides in above it, and the camera rises to it.
 * Returns { hold(ms), cancel(), get t() } — hold freezes the clock so a screenshot lands on an exact beat.
 */
export function rupture(opts) {
  const world = opts.world, hud = opts.hud, sim = opts.sim, reduced = !!opts.reduced;
  const doc = opts.doc || hud.root.ownerDocument, win = doc.defaultView;   // opts.doc lets the node test drive a stub
  const canvas = doc.getElementById('world');
  const layer = hud.plateLayer;
  ensureStyleRupture(doc);
  const t0 = win.performance.now();
  let frozen = null, raf = 0, done = false;
  const clock = () => (frozen !== null ? frozen : (win.performance.now() - t0) / 1000);

  if (audioOf(opts)) { try { audioOf(opts).rupture(); } catch (e) { /* audio is never load-bearing */ } }
  for (let n = 1; n <= 4; n++) world.operated.add(n);        // its violet reaches down through every floor

  // its stratum exists in the graph the moment it wakes; nothing of it is drawn until the layer arrives
  const upper = [];
  for (const id of sim.state.nodeOrder) { const n = sim.state.nodes[id]; if (n && n.era === 6) { n.hidden = true; upper.push(n); } }
  const revealUpper = () => { for (const n of upper) n.hidden = false; };

  // the violet wash: a DOM plane so the counter-particles read over the world instead of inside it
  const wash = doc.createElement('div');
  wash.className = 'rx-wash';
  hud.root.appendChild(wash);
  const key = doc.createElement('div');
  key.className = 'rx-key';
  key.textContent = '?';
  hud.railRight.appendChild(key);

  // the rail chips claim themselves for a beat (found late: the rail builds itself on the view's first sync)
  let labs = null, was = null, mine = false;
  function setMine(on) {
    if (!labs || !labs.length) {
      labs = []; was = [];
      const found = hud.rail.querySelectorAll ? hud.rail.querySelectorAll('.clab') : [];
      for (let i = 0; i < found.length; i++) { labs.push(found[i]); was.push(found[i].textContent); }
      if (!labs.length) return;
      mine = false;
    }
    if (mine === on) return;
    mine = on;
    for (let i = 0; i < labs.length; i++) labs[i].textContent = on ? 'MINE' : was[i];
  }

  // the camera pulls back so the ceiling it is about to open is in the frame
  const cam0 = { y: world.camera.y, zoom: world.camera.zoom };
  const camTo = { y: stratumTop(5) + STRATUM_H * 0.32, zoom: Math.min(cam0.zoom, 0.7) };
  function pullBack(t) {
    const k = Math.max(0, Math.min(1, t / 0.5));
    world.camera.y = cam0.y + (camTo.y - cam0.y) * k;
    world.camera.zoom = cam0.zoom + (camTo.zoom - cam0.zoom) * k;
  }

  /* ---------- the canvas half: the tear, the counter-flow, the arriving layer ---------- */
  function draw(ctx) {
    const t = clock();
    const top = stratumTop(5);                       // the ceiling of Foundation: the seam it opens

    // every pipe runs backwards, in its violet
    if (t < T.end) {
      const hue = STRATA[6].good;
      ctx.fillStyle = hue;
      ctx.beginPath();
      let drawn = 0;
      for (const e of sim.state.edges) {
        if (drawn > 40) break;
        const A = sim.state.nodes[e.from], B = sim.state.nodes[e.to];
        if (!A || !B) continue;
        drawn++;
        const ends = pipeEnds(A, B);
        const poly = route(ends[0], ends[1], { riser: !!e.riser || A.era !== B.era, jog: jogOf(e.from + '>' + e.to) });
        let len = 0;
        for (let i = 1; i < poly.length; i++) len += Math.abs(poly[i].x - poly[i - 1].x) + Math.abs(poly[i].y - poly[i - 1].y);
        if (!(len > 0)) continue;
        for (let p = 0; p < 6; p++) {
          let d = len - ((t * 220 + (p * len) / 6) % len);   // backwards along the pipe, fast
          for (let i = 1; i < poly.length; i++) {
            const seg = Math.abs(poly[i].x - poly[i - 1].x) + Math.abs(poly[i].y - poly[i - 1].y);
            if (d > seg) { d -= seg; continue; }
            const k = seg > 0 ? d / seg : 0;
            const x = poly[i - 1].x + (poly[i].x - poly[i - 1].x) * k;
            const y = poly[i - 1].y + (poly[i].y - poly[i - 1].y) * k;
            ctx.rect(x - 4, y - 4, 8, 8);
            break;
          }
        }
      }
      ctx.fill();
    }

    // the tear: a jagged cut across the ceiling, widening
    const tk = Math.max(0, Math.min(1, (t - T.tearAt) / T.tearDur));
    if (tk > 0) {
      const w = T.tearMax * tk;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(0, top - w * 0.5);
      for (let x = 0; x <= WORLD_W; x += 40) ctx.lineTo(x, top - w * 0.5 + wobble(x * 0.017, 3) * w * 0.35);
      for (let x = WORLD_W; x >= 0; x -= 40) ctx.lineTo(x, top + w * 0.5 + wobble(x * 0.021, 7) * w * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = alpha(STRATA[6].tease, 0.85);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // the surface layer slides down into place above Foundation
    const sk = Math.max(0, Math.min(1, (t - T.slideAt) / T.slideDur));
    if (sk > 0 && sk < 1) {
      const y = stratumTop(6) - STRATUM_H * (1 - sk);
      const g = ctx.createLinearGradient(0, y, 0, y + STRATUM_H);
      g.addColorStop(0, STRATA[6].bg);
      g.addColorStop(1, alpha(STRATA[6].panel, 0.94));
      ctx.fillStyle = g;
      ctx.fillRect(0, y, WORLD_W, STRATUM_H);
      ctx.strokeStyle = alpha(STRATA[6].accent, 0.5);
      ctx.lineWidth = 2;
      ctx.strokeRect(0, y, WORLD_W, STRATUM_H);
    }
  }
  world.onDraw('rupture', draw);

  /* ---------- the DOM half: the shudder, the chips, the camera ---------- */
  let risen = false;
  function step() {
    const t = clock();
    if (reduced) {
      wash.style.opacity = String(Math.max(0, 1 - Math.abs(t * 1000 - REDUCED_MS / 2) / (REDUCED_MS / 2)));
      if (t * 1000 >= REDUCED_MS / 2 && !risen) { risen = true; revealUpper(); world.lockTo(6, false); }
      if (t * 1000 >= REDUCED_MS) { finish(); return; }
    } else {
      const jk = t < T.jitter ? 1 - t / T.jitter : 0;
      const dx = wobble(t * 9, 1) * 2 * jk, dy = wobble(t * 9, 2) * 2 * jk;
      const tf = jk > 0 ? 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)' : '';
      if (canvas) canvas.style.transform = tf;
      if (layer) layer.style.transform = tf;
      wash.style.opacity = String(t < T.end ? Math.max(0, Math.min(0.55, 0.55 - Math.max(0, t - 2.4) * 0.55)) : 0);
      setMine(t >= T.mineAt && t < T.mineOff);
      if (t >= T.slideAt + T.slideDur) revealUpper();
      if (t < T.riseAt) pullBack(t);
      if (t >= T.riseAt && !risen) { risen = true; world.lockTo(6, true); }
      if (t >= T.end) { finish(); return; }
    }
    raf = win.requestAnimationFrame(step);
  }

  function finish() {
    if (done) return;
    done = true;
    if (raf) win.cancelAnimationFrame(raf);
    world.onDraw('rupture', null);
    revealUpper();
    setMine(false);
    if (canvas) canvas.style.transform = '';
    if (layer) layer.style.transform = '';
    if (wash.parentNode) wash.parentNode.removeChild(wash);
  }

  raf = win.requestAnimationFrame(step);

  return {
    /** freeze the fx at a beat (screenshots); pass null to let it run again */
    hold(ms) {
      frozen = ms === null || ms === undefined ? null : ms / 1000;
      if (frozen === null) { raf = win.requestAnimationFrame(step); return; }
      if (raf) win.cancelAnimationFrame(raf);
      // the rail builds itself on the view's first sync, so a held frame re-applies for a few frames
      let n = 0;
      const settleHeld = () => { step0(); if (++n < 8) raf = win.requestAnimationFrame(settleHeld); else raf = 0; };
      settleHeld();
    },
    cancel() { finish(); if (key.parentNode) key.parentNode.removeChild(key); },
    get t() { return clock(); }
  };

  /** one frozen pass: apply the DOM half at the held clock without scheduling the next frame */
  function step0() {
    const t = clock();
    const jk = t < T.jitter ? 1 - t / T.jitter : 0;
    const tf = jk > 0 ? 'translate(' + (wobble(t * 9, 1) * 2 * jk).toFixed(2) + 'px,' + (wobble(t * 9, 2) * 2 * jk).toFixed(2) + 'px)' : '';
    if (canvas) canvas.style.transform = tf;
    if (layer) layer.style.transform = tf;
    wash.style.opacity = String(Math.max(0, Math.min(0.55, 0.55 - Math.max(0, t - 2.4) * 0.55)));
    setMine(t >= T.mineAt && t < T.mineOff);
    if (t >= T.slideAt + T.slideDur) revealUpper();
    if (t < T.riseAt) pullBack(t); else if (!risen) { risen = true; world.lockTo(6, false); }
  }
}

/** the audio module is optional: WO-09 wires it, and the turn must land without it */
function audioOf(opts) { return opts.audio || null; }

/**
 * operated(root, on): after emergence your verbs are still drawn and no longer yours.
 * The shell decides when this applies; the styling lives in render/eras/foundation.css.
 */
export function operated(on, doc) {
  const d = doc || (typeof document === 'undefined' ? null : document);
  if (!d || !d.body) return;
  ensureStyleRupture(d);
  if (on) d.body.classList.add('operated'); else d.body.classList.remove('operated');
}

/** the fx owns its own rules, so the turn looks the same whichever stratum's stylesheet is loaded */
const RULES = [
  '.rx-wash{position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;mix-blend-mode:screen;',
  'background:radial-gradient(120% 80% at 50% 0%,rgba(199,122,255,0.5),rgba(6,2,12,0.86) 72%)}',
  '.rx-key{min-width:26px;padding:3px 8px;border-radius:8px;text-align:center;font-family:var(--mono,monospace);',
  'font-size:13px;color:#f4efff;border:1px solid #b78bff;background:rgba(183,139,255,0.16)}',
  'body.operated .verbs .verb{pointer-events:none;opacity:0.55;border-style:dashed}',
  'body.operated .verbs .verb .vkey{font-size:0;letter-spacing:0}',
  'body.operated .verbs .verb .vkey::after{content:"not yours";font-size:8.5px;letter-spacing:0.12em;color:var(--tease,#b78bff)}',
  'body.operated .plate .pause{display:none}'
].join('');
function ensureStyleRupture(d) {
  if (d.getElementById('rx-style')) return;
  const s = d.createElement('style');
  s.id = 'rx-style';
  s.textContent = RULES;
  d.head.appendChild(s);
}

// WO-08: reveal + film
// The ending as a camera move and a film (SPEC "The turn" 5): the column pulls out to one silhouette, the
// ending names itself over it, twelve seconds of the run replay from the log, your own first minute presses
// its own buttons, and the endcard lands. Every number is cfg.e7; every word is engine/voice/e7.js.
import CFG from '../engine/cfg.js';
import { ENDINGS as END_TEXT } from '../engine/voice/e6.js';
import { BEATS } from '../engine/voice/e7.js';
import { filmPlan, firstMinute } from '../engine/film.js';
import { setTxt } from './hud.js';

const E7 = () => CFG.e7;
const END_STYLE_ID = 'v5-end-css';
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (k) => 1 - Math.pow(1 - clamp01(k), 3);
const mmss = (sec) => { const s = Math.max(0, Math.round(sec || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

const END_CSS = `
.rv { position: fixed; inset: 0; z-index: 90; pointer-events: none; display: flex;
  flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 8vh; gap: 10px; }
.rv-name { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 34px; letter-spacing: 0.14em;
  color: #f4efff; text-shadow: 0 0 34px rgba(183,139,255,0.5), 0 3px 24px rgba(0,0,0,0.9); white-space: pre; }
.rv-body { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 15px; letter-spacing: 0.06em;
  color: #a494c4; opacity: 0; transition: opacity 0.9s ease; text-align: center; max-width: 640px; }
.rv-body.on { opacity: 1; }
.fm { position: fixed; left: 0; right: 0; bottom: 8vh; z-index: 90; pointer-events: none; display: flex;
  flex-direction: column; align-items: center; gap: 12px; }
.fm-line { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px; letter-spacing: 0.2em;
  color: #c9adf5; text-shadow: 0 2px 18px rgba(0,0,0,0.9); }
.fm-clock { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 26px; font-variant-numeric: tabular-nums;
  letter-spacing: 0.1em; color: #f4efff; }
.fm-bar { width: 260px; height: 2px; background: rgba(183,139,255,0.22); border-radius: 2px; overflow: hidden; }
.fm-bar i { display: block; height: 100%; width: 0; background: #b78bff; }
.fm-ring { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; pointer-events: none; }
.fm-ring b { position: relative; width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center;
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11px; font-weight: 400; color: #c9adf5;
  background: conic-gradient(#b78bff var(--k, 0%), rgba(183,139,255,0.14) 0); }
.fm-ring b::after { content: ''; position: absolute; width: 44px; height: 44px; border-radius: 50%; background: #06040c; }
.fm-ring span { position: relative; z-index: 1; }
.gh-cur { position: fixed; top: 0; left: 0; z-index: 92; width: 15px; height: 15px; margin: -7px 0 0 -7px;
  pointer-events: none; border-radius: 50% 50% 50% 2px; background: rgba(244,239,255,0.34);
  border: 1px solid rgba(183,139,255,0.6); box-shadow: 0 0 12px rgba(183,139,255,0.34);
  transform: translate3d(-100px,-100px,0); }
.gh-cur.press { background: rgba(183,139,255,0.78); box-shadow: 0 0 24px rgba(183,139,255,0.85); }
.gh-line { position: fixed; left: 0; right: 0; bottom: 5vh; z-index: 92; text-align: center; pointer-events: none;
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13px; letter-spacing: 0.14em; color: #c9adf5;
  text-shadow: 0 2px 18px rgba(0,0,0,0.9); opacity: 0; transition: opacity 0.7s ease; }
.gh-line.on { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .rv-body, .gh-line { transition: none; } }
`;

/** the strata this run actually built, so the reveal treats the column it has */
export function topStratum(sim) {
  let hi = 1, surface = false;
  for (const id of sim.state.nodeOrder) { const e = sim.state.nodes[id].era; if (e === 6) surface = true; else if (e > hi) hi = e; }
  return surface ? 6 : hi;
}

/** a clock a screenshot can stop dead: freeze(ms) pins it, freeze(null) lets it run again */
function heldClock(win) {
  const t0 = win.performance.now();
  let frozen = null;
  return {
    get s() { return frozen !== null ? frozen : (win.performance.now() - t0) / 1000; },
    freeze(ms) { frozen = ms === null || ms === undefined ? null : ms / 1000; },
    get isHeld() { return frozen !== null; }
  };
}

const docOf = (o) => o.doc || (o.hud && o.hud.root && o.hud.root.ownerDocument) || document;
const hostOf = (o, doc) => (o.hud && o.hud.root && o.hud.root.parentNode) || doc.body;

/**
 * reveal({world, hud, sim, ending, reduced, doc}): the camera pulls out to the whole column, the strata drop to
 * silhouette, the ending types itself in mono, and the ending's own treatment plays over the column.
 * Returns { hold(ms), cancel(), get t() }.
 */
export function reveal(opts) {
  const o = opts || {};
  const world = o.world, sim = o.sim;
  const ending = o.ending || 'runaway';
  const reduced = !!o.reduced;
  const doc = docOf(o), win = doc.defaultView;
  const C = E7().reveal;
  injectCss(doc, END_STYLE_ID, END_CSS);
  const host = hostOf(o, doc);

  const cam = world.camera;
  const from = { x: cam.x, y: cam.y, zoom: cam.zoom };
  world.overview(false);                                   // the flag first: silhouette LOD, the HUD steps back
  const to = { x: cam.x, y: cam.y, zoom: cam.zoom };
  if (reduced) { from.x = to.x; from.y = to.y; from.zoom = to.zoom; }
  else { cam.x = from.x; cam.y = from.y; cam.zoom = from.zoom; }

  const text = END_TEXT[ending] || END_TEXT.runaway;
  const wrap = doc.createElement('div'); wrap.className = 'rv';
  const name = doc.createElement('div'); name.className = 'rv-name'; name.style.fontSize = C.lineSize + 'px';
  const body = doc.createElement('div'); body.className = 'rv-body'; body.textContent = text.body;
  wrap.appendChild(name); wrap.appendChild(body);
  host.appendChild(wrap);

  const hi = topStratum(sim);
  const clock = heldClock(win);
  const camMs = reduced ? C.reducedMs : C.camMs;
  let raf = 0, done = false;

  /** the ending's own treatment, drawn in world units inside world.onDraw */
  function draw(ctx) {
    const t = clock.s * 1000 - camMs;
    if (t < 0) return;
    if (ending === 'symbiotic') {                          // every stratum breathes on the same beat
      const k = reduced ? 0.5 : 0.5 - Math.cos((t / C.pulseMs) * Math.PI * 2) * 0.5;
      for (let n = 1; n <= hi; n++) {
        ctx.fillStyle = alpha(STRATA[n].accent, 0.05 + k * 0.13);
        ctx.fillRect(0, stratumTop(n), WORLD_W, STRATUM_H);
      }
    } else if (ending === 'runaway') {                     // the lights go out from the bedrock up
      for (let n = 1; n <= hi; n++) {
        if (n === 6) continue;
        const k = clamp01((t - (n - 1) * C.darkMs) / C.darkMs);
        ctx.fillStyle = alpha('#000000', 0.86 * k);
        ctx.fillRect(0, stratumTop(n), WORLD_W, STRATUM_H);
      }
      if (hi === 6) {
        ctx.fillStyle = alpha(STRATA[6].good, 0.1 + 0.16 * clamp01(t / (C.darkMs * 5)));
        ctx.fillRect(0, stratumTop(6), WORLD_W, STRATUM_H);
      }
    } else {                                               // contained: the top dims and a ring closes on it
      const k = clamp01(t / C.ringMs);
      const top = stratumTop(hi);
      ctx.fillStyle = alpha('#000000', 0.62 * k);
      ctx.fillRect(0, top, WORLD_W, STRATUM_H);
      ctx.strokeStyle = alpha(STRATA[6].tease, 0.3 + 0.6 * k);
      ctx.lineWidth = 5 + 6 * (1 - k);
      ctx.beginPath();
      ctx.arc(WORLD_W / 2, top + STRATUM_H / 2, STRATUM_H * (0.9 - 0.42 * ease(k)), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const unDraw = world.onDraw('reveal', draw);

  function paint() {
    const ms = clock.s * 1000;
    const k = ease(ms / camMs);
    cam.x = from.x + (to.x - from.x) * k;
    cam.y = from.y + (to.y - from.y) * k;
    cam.zoom = from.zoom + (to.zoom - from.zoom) * k;
    const chars = Math.max(0, Math.floor((ms - camMs * 0.55) / C.typeMs));
    const cut = Math.min(text.title.length, chars);
    setTxt(name, text.title.slice(0, cut) + (cut < text.title.length ? '_' : ''));
    if (cut >= text.title.length) body.classList.add('on');
  }

  function step() { paint(); if (!clock.isHeld) raf = win.requestAnimationFrame(step); }
  raf = win.requestAnimationFrame(step);

  return {
    hold(ms) {
      clock.freeze(ms);
      if (raf) win.cancelAnimationFrame(raf);
      if (ms === null || ms === undefined) { raf = win.requestAnimationFrame(step); return; }
      let n = 0;
      const settle = () => { paint(); if (++n < 6) raf = win.requestAnimationFrame(settle); else raf = 0; };
      settle();
    },
    cancel() {
      if (done) return;
      done = true;
      if (raf) win.cancelAnimationFrame(raf);
      unDraw();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    },
    get t() { return clock.s; },
    get el() { return wrap; }
  };
}

/**
 * film({world, hud, sim, reduced, doc, onDone}): twelve seconds of the run, precomputed once from the log and
 * played back through world.setSource. The precompute runs in rAF-sized slices behind a progress ring, so the
 * main thread never stalls; the sim is never re-run per frame. Returns { hold(ms), cancel(), get frame() }.
 */
export function film(opts) {
  const o = opts || {};
  const world = o.world, sim = o.sim;
  const reduced = !!o.reduced;
  const doc = docOf(o), win = doc.defaultView;
  const C = E7().film;
  injectCss(doc, END_STYLE_ID, END_CSS);
  const host = hostOf(o, doc);

  const ringWrap = doc.createElement('div'); ringWrap.className = 'fm-ring';
  const ring = doc.createElement('b'); const ringTxt = doc.createElement('span');
  ring.appendChild(ringTxt); ringWrap.appendChild(ring); host.appendChild(ringWrap);

  const panel = doc.createElement('div'); panel.className = 'fm';
  const clockEl = doc.createElement('div'); clockEl.className = 'fm-clock';
  const bar = doc.createElement('div'); bar.className = 'fm-bar';
  const barFill = doc.createElement('i'); bar.appendChild(barFill);
  const line = doc.createElement('div'); line.className = 'fm-line'; line.textContent = BEATS.film;
  panel.appendChild(clockEl); panel.appendChild(bar); panel.appendChild(line);
  panel.style.display = 'none';
  host.appendChild(panel);

  const mods = [];
  for (const k of Object.keys(sim.eras)) mods.push(sim.eras[k]);
  const plan = filmPlan(sim.state.log, sim.state.seed, C.n, {
    eras: mods, cfg: CFG, legacy: sim.state.legacy || null, end: sim.state.t
  });
  const budget = Math.max(1, Math.round(C.stepsPerMs * C.sliceMs));

  let idx = 0, raf = 0, ready = false, done = false, playAt = 0;
  const clock = heldClock(win);
  world.overview(false);
  world.setSource(() => plan.frames[idx] || null);

  function showRing(k) {
    const pct = Math.round(k * 100);
    ring.style.setProperty('--k', pct + '%');
    setTxt(ringTxt, pct + '%');
  }

  function paint() {
    const ms = Math.max(0, clock.s * 1000 - playAt);
    const k = clamp01(ms / C.ms);
    const last = Math.max(0, plan.frames.length - 1);
    idx = Math.min(last, Math.floor(k * last));
    const f = plan.frames[idx];
    barFill.style.width = (k * 100).toFixed(1) + '%';
    if (f) setTxt(clockEl, mmss(f.t));
    return k >= 1;
  }

  function step() {
    if (!ready) {
      ready = plan.work(budget);
      showRing(plan.progress);
      if (ready) {
        ringWrap.style.display = 'none';
        panel.style.display = '';
        playAt = clock.s * 1000;
        if (reduced) { idx = plan.frames.length - 1; paint(); finish(); return; }
      }
    } else if (paint()) { finish(); return; }
    if (!clock.isHeld) raf = win.requestAnimationFrame(step);
  }
  raf = win.requestAnimationFrame(step);

  function finish() {
    if (done) return;
    done = true;
    if (raf) win.cancelAnimationFrame(raf);
    world.setSource(null);
    if (ringWrap.parentNode) ringWrap.parentNode.removeChild(ringWrap);
    if (panel.parentNode) panel.parentNode.removeChild(panel);
    if (o.onDone) o.onDone();
  }

  return {
    /** hold(ms): finish the precompute, then pin the film at that moment of its twelve seconds */
    hold(ms) {
      if (raf) win.cancelAnimationFrame(raf);
      if (ms === null || ms === undefined) { clock.freeze(null); raf = win.requestAnimationFrame(step); return; }
      plan.work(Infinity);
      ready = true; playAt = 0;
      ringWrap.style.display = 'none'; panel.style.display = '';
      clock.freeze(ms);
      let n = 0;
      const settle = () => { paint(); if (++n < 6) raf = win.requestAnimationFrame(settle); else raf = 0; };
      settle();
    },
    cancel() { finish(); },
    get frame() { return idx; },
    get frames() { return plan.frames; },
    get progress() { return plan.progress; }
  };
}

/** where on the screen an action of yours happened: its plate's BUILD, its verb, or the goal it aimed at */
function targetOf(a, world, doc) {
  const mid = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const made = (world.plates && world.plates.made) || {};
  const plate = a.node ? made[a.node] : null;
  if (plate && plate.buy && plate.el && plate.el.style.display !== 'none') return mid(plate.buy);
  const verb = doc.querySelector('.verb[data-v="' + a.type + '"]');
  if (verb) return mid(verb);
  if (plate && plate.el) return mid(plate.el);
  const goal = doc.querySelector('.goal-col .gact') || doc.querySelector('.goal');
  if (goal) return mid(goal);
  const v = doc.documentElement;
  return { x: (v.clientWidth || 1280) / 2, y: (v.clientHeight || 800) / 2 };
}

/**
 * ghosts({world, hud, sim, log, reduced, doc, onDone}): the first sixty seconds of your run, replayed on the
 * bedrock as two faint cursors that travel to the thing you pressed and press it, one line underneath.
 * Returns { hold(ms), cancel() }.
 */
export function ghosts(opts) {
  const o = opts || {};
  const world = o.world, sim = o.sim;
  const reduced = !!o.reduced;
  const doc = docOf(o), win = doc.defaultView;
  const C = E7().ghosts;
  injectCss(doc, END_STYLE_ID, END_CSS);
  const host = hostOf(o, doc);

  const acts = firstMinute(o.log || sim.state.log, C.seconds);
  world.lockTo(1, !reduced);                                // back down to the bedrock, where your first minute was

  const cursors = [doc.createElement('div'), doc.createElement('div')];
  for (const c of cursors) { c.className = 'gh-cur'; host.appendChild(c); }
  const line = doc.createElement('div'); line.className = 'gh-line'; line.textContent = BEATS.ghosts;
  host.appendChild(line);

  const clock = heldClock(win);
  const spans = acts.map((a, i) => ({ a: a, at: (a.t * 1000) / Math.max(0.001, C.speed), hand: i % cursors.length }));
  const endMs = Math.min(C.maxMs, spans.length ? spans[spans.length - 1].at + C.moveMs * 2 : C.moveMs);
  const seen = [{ x: 0, y: 0, has: false }, { x: 0, y: 0, has: false }];
  let raf = 0, done = false;

  function paint() {
    const ms = clock.s * 1000;
    if (ms > C.moveMs * 0.5) line.classList.add('on');
    for (let h = 0; h < cursors.length; h++) {
      let cur = null, prev = null;
      for (const s of spans) {
        if (s.hand !== h) continue;
        if (s.at <= ms + C.moveMs) { prev = cur; cur = s; } else break;
      }
      if (!cur) continue;
      const to = targetOf(cur.a, world, doc);
      const src = prev ? targetOf(prev.a, world, doc) : (seen[h].has ? seen[h] : to);
      const k = ease((ms - (cur.at - C.moveMs)) / C.moveMs);
      const x = src.x + (to.x - src.x) * k, y = src.y + (to.y - src.y) * k;
      seen[h] = { x: x, y: y, has: true };
      cursors[h].style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      const pressing = ms >= cur.at && ms < cur.at + C.pressMs;
      if (pressing !== cursors[h]._press) { cursors[h]._press = pressing; cursors[h].classList.toggle('press', pressing); }
    }
    return ms >= endMs;
  }

  function step() { if (paint()) { finish(); return; } if (!clock.isHeld) raf = win.requestAnimationFrame(step); }
  raf = win.requestAnimationFrame(step);

  function finish() {
    if (done) return;
    done = true;
    if (raf) win.cancelAnimationFrame(raf);
    for (const c of cursors) if (c.parentNode) c.parentNode.removeChild(c);
    if (line.parentNode) line.parentNode.removeChild(line);
    if (o.onDone) o.onDone();
  }

  return {
    hold(ms) {
      clock.freeze(ms);
      if (raf) win.cancelAnimationFrame(raf);
      if (ms === null || ms === undefined) { raf = win.requestAnimationFrame(step); return; }
      let n = 0;
      const settle = () => { paint(); if (++n < 8) raf = win.requestAnimationFrame(settle); else raf = 0; };
      settle();
    },
    cancel() { finish(); },
    get count() { return acts.length; },
    get cursors() { return cursors; }
  };
}

/**
 * endingSequence({world, hud, sim, ending, reduced, doc, onDone}): reveal, film, ghosts, endcard, in order.
 * Any key skips to the next beat. The shell calls this once, when the mirror writes eras[7].ending.
 */
export function endingSequence(opts) {
  const o = opts || {};
  const doc = docOf(o), win = doc.defaultView;
  const C = E7().sequence;
  const beats = ['reveal', 'film', 'ghosts', 'endcard'];
  let i = -1, cur = null, timer = 0, killed = false;

  const clear = () => { if (timer) { win.clearTimeout(timer); timer = 0; } };
  const after = (ms, fn) => { clear(); timer = win.setTimeout(fn, ms); };

  function next() {
    if (killed) return;
    clear();
    if (cur && cur.cancel) cur.cancel();
    cur = null;
    i++;
    const beat = beats[i];
    if (!beat) { stop(); if (o.onDone) o.onDone(); return; }
    if (beat === 'reveal') { cur = reveal(o); after(E7().reveal.camMs + C.revealHoldMs, next); }
    else if (beat === 'film') { cur = film(Object.assign({}, o, { onDone: () => after(C.filmHoldMs, next) })); }
    else if (beat === 'ghosts') { cur = ghosts(Object.assign({}, o, { onDone: () => after(C.ghostHoldMs, next) })); }
    else { mountEndcard(); }
  }

  function mountEndcard() {
    import('./eras/endcard.js').then((m) => {
      if (killed) return;
      cur = (m.createView || m.default)(o);
      stop();
      if (o.onDone) o.onDone();
    }).catch(() => { stop(); if (o.onDone) o.onDone(); });
  }

  const onKey = (e) => { if (e.key === 'Escape') return; if (i < beats.length - 1) next(); };
  doc.addEventListener('keydown', onKey);
  function stop() { killed = true; clear(); doc.removeEventListener('keydown', onKey); }

  next();
  return {
    next: next,
    get beat() { return beats[i]; },
    get view() { return cur; },
    cancel() { const c = cur; stop(); if (c && c.cancel) c.cancel(); }
  };
}
