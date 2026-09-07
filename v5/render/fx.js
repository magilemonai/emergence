// render/fx.js: world-level effects that belong to no single stratum (the legacy surface, the rupture,
// the title card, the film). One clearly marked section per work order so parallel branches merge trivially.

// WO-10: legacy
// Run 2 opens with the surface layer already in place above the Foundation slot, unlit, and a `?` key on the
// board from the first mark. Nothing here reads the sim beyond `state.flags.run2` and `state.legacy`.
import { STRATUM_H, WORLD_W, stratumTop } from '../engine/types.js';
import { STRATA, alpha } from './palette.js';
import { fitStratum } from './world.js';

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
// WO-08: reveal + film
