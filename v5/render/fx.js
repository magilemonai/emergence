// render/fx.js — effects drawn over the world: the rupture, the reveal, the film, and the stratum title card.
// Sections are owned per work order. Each section injects its own CSS so render/hud.css stays WO-01's file.

// WO-06: rupture
// WO-08: reveal + film

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
