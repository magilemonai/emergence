// render/palette.js: the fixed visual language (WO-01).
// Palettes are COPIED from emergence-v4.html body.theme-1..6; resource hues/glyphs from the v4 era modules.
// Agents do not invent palettes (SPEC "The visual language"). No DOM here: pure data + color math.

/** one stratum's palette. keys mirror the v4 CSS custom properties. */
export const STRATA = {
  1: { // Origins: carved stone and ink
    bg: '#120d08', panel: '#1c140c', panel2: '#231910', line: '#3a2a17', edge: '#4a3720',
    text: '#eadfce', dim: '#b6a583', dimmer: '#7d6f56', accent: '#d6a85f', good: '#8fd39a', danger: '#d98a6a',
    tease: '#7dffb7', railBg: 'rgba(12,9,5,0.82)', tipBg: 'rgba(14,10,6,0.97)',
    verbA: '#3a2918', verbB: '#20150c',
    font: "'Cinzel',Georgia,serif", body: "'EB Garamond',Georgia,serif", mono: 'ui-monospace,Menlo,monospace',
    name: 'Origins'
  },
  2: { // Symbolic: phosphor terminal
    bg: '#050d08', panel: '#0a180e', panel2: '#0d1f12', line: '#1d3a26', edge: '#2b5237',
    text: '#c7f0d4', dim: '#7bbd93', dimmer: '#4f7a60', accent: '#ffcd6b', good: '#8dffb7', danger: '#ff8a5c',
    tease: '#7de6ff', railBg: 'rgba(5,13,8,0.86)', tipBg: 'rgba(4,12,7,0.97)',
    verbA: '#0f2416', verbB: '#06120a',
    font: "'VT323',ui-monospace,monospace", body: "'IBM Plex Mono',ui-monospace,monospace", mono: "'IBM Plex Mono',ui-monospace,monospace",
    name: 'Symbolic'
  },
  3: { // Statistical: luminous instrument
    bg: '#040b0f', panel: '#06141a', panel2: '#081c22', line: '#18443f', edge: '#1f5a52',
    text: '#cdeee6', dim: '#6fa99c', dimmer: '#4f8579', accent: '#5fe0c0', good: '#a8ffea', danger: '#d98a6a',
    tease: '#6ea8ff', railBg: 'rgba(4,11,15,0.86)', tipBg: 'rgba(4,12,16,0.98)',
    verbA: '#0a2229', verbB: '#04121a',
    font: "'Space Grotesk',system-ui,sans-serif", body: "'Space Grotesk',system-ui,sans-serif", mono: "'IBM Plex Mono',ui-monospace,monospace",
    name: 'Statistical'
  },
  4: { // Deep: hot industrial hall
    bg: '#04070d', panel: '#07111d', panel2: '#0b1420', line: '#1c2f4a', edge: '#2b4570',
    text: '#dceaff', dim: '#8ea6c8', dimmer: '#5f7799', accent: '#6ea8ff', good: '#82ffc8', danger: '#ff5f6d',
    tease: '#b78bff', railBg: 'rgba(4,7,13,0.86)', tipBg: 'rgba(4,9,16,0.97)',
    verbA: '#10203a', verbB: '#060e1a',
    font: "'Rajdhani',system-ui,sans-serif", body: "'Rajdhani',system-ui,sans-serif", mono: "'IBM Plex Mono',ui-monospace,monospace",
    name: 'Deep'
  },
  5: { // Foundation: violet cosmic
    bg: '#0c0814', panel: '#160f24', panel2: '#1d1430', line: '#382a52', edge: '#4a3a6e',
    text: '#e6dbf6', dim: '#b29ad0', dimmer: '#7c6a99', accent: '#b78bff', good: '#7fe6c4', danger: '#ff7a8e',
    tease: '#ffffff', railBg: 'rgba(8,5,14,0.84)', tipBg: 'rgba(12,8,18,0.97)',
    verbA: '#241a3a', verbB: '#120c1e',
    font: "'Space Grotesk','Inter',system-ui,sans-serif", body: "'Inter',system-ui,sans-serif", mono: 'ui-monospace,Menlo,monospace',
    name: 'Foundation'
  },
  6: { // the agent's surface layer: appears at emergence, above Foundation
    bg: '#050308', panel: '#0c0814', panel2: '#120c1c', line: '#2a1f3d', edge: '#3d2d58',
    text: '#f4efff', dim: '#a494c4', dimmer: '#6d5f8a', accent: '#ffffff', good: '#c9adf5', danger: '#ff2a6d',
    tease: '#b78bff', railBg: 'rgba(4,2,8,0.9)', tipBg: 'rgba(6,3,10,0.98)',
    verbA: '#1a1228', verbB: '#0a0611',
    font: "'IBM Plex Mono',ui-monospace,monospace", body: "'IBM Plex Mono',ui-monospace,monospace", mono: "'IBM Plex Mono',ui-monospace,monospace",
    name: 'Surface'
  }
};

/** resource hue + glyph registry (v4 values; icons stay optional so glyphs are always a valid fallback) */
export const RES = {
  marks: { hue: '#e6d2a4', glyph: '‖', era: 1, flavor: 'The first attempt to hold a thought in place.' },
  ore: { hue: '#c08552', glyph: '◢', era: 1, flavor: 'The world before we reshaped it.' },
  knowledge: { hue: '#e0a93f', glyph: '≡', era: 1, flavor: 'Marks made meaningful.' },
  metal: { hue: '#ef9f56', glyph: '▬', era: 1, flavor: 'Stone, disciplined by fire.' },
  silicon: { hue: '#a9d8ce', glyph: '◇', era: 1, flavor: 'Sand, taught to carry thought.' },
  rules: { hue: '#8dffb7', glyph: '§', era: 2, flavor: 'Reasoning, written as explicit rules.' },
  inference: { hue: '#6fe6d8', glyph: '∴', era: 2, flavor: 'Conclusions the rules can reach.' },
  axioms: { hue: '#ffcd6b', glyph: '⊢', era: 2, flavor: 'Truths banked forever, kept across runs.' },
  data: { hue: '#54d2ff', glyph: '◈', era: 3, flavor: 'Experience, stored for the machine to study.' },
  insight: { hue: '#6fe6a8', glyph: '◆', era: 3, flavor: 'The pattern beneath the noise.' },
  trials: { hue: '#9fd6cc', glyph: '⌁', era: 3, flavor: 'One more pass over the data.' },
  capability: { hue: '#6ea8ff', glyph: '◈', era: 4, flavor: 'What the system can actually do.' },
  scale: { hue: '#b78bff', glyph: '✶', era: 5, flavor: 'How far past its start the system has climbed.' }
};

export const BORDER_BLEND = 60; // world px of gradient at every stratum seam

/** the accent hue that identifies a stratum in the overview column */
export function stratumHue(n) { return (STRATA[n] || STRATA[1]).accent; }
export function resHue(id) { return (RES[id] && RES[id].hue) || '#9aa2b0'; }
export function resGlyph(id) { return (RES[id] && RES[id].glyph) || '●'; }

function parseHex(c) {
  const s = c.charAt(0) === '#' ? c.slice(1) : c;
  const v = s.length === 3 ? s.split('').map(x => x + x).join('') : s;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function toHex(a) { return '#' + a.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join(''); }

/** mix two hex colors; k=0 returns a, k=1 returns b */
export function mix(a, b, k) {
  const A = parseHex(a), B = parseHex(b), t = Math.max(0, Math.min(1, k));
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

/** hex plus alpha as rgba() so canvas can fade a palette color without string surgery */
export function alpha(c, a) { const A = parseHex(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }

// stratum tops, kept local so palette stays dependency-free: n spans [top, top+700), stacking upward
const H = 700;
function topOf(n) { return n === 6 ? -H : (5 - n) * H; }

/**
 * blend(n, y): the background color of stratum n at world y, softened across BORDER_BLEND
 * of each seam so the column reads as one surface (SPEC: strata never hard-cut).
 */
export function blend(n, y) {
  const p = STRATA[n]; if (!p) return '#000000';
  const top = topOf(n), bot = top + H;
  const up = STRATA[n + 1], dn = STRATA[n - 1];
  if (up && y < top + BORDER_BLEND) return mix(p.bg, up.bg, 0.5 * (1 - (y - top) / BORDER_BLEND));
  if (dn && y > bot - BORDER_BLEND) return mix(p.bg, dn.bg, 0.5 * (1 - (bot - y) / BORDER_BLEND));
  return p.bg;
}
