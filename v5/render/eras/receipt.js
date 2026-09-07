// render/eras/receipt.js — WO-12. The receipt as a page: the run's own numbers, read back against the history
// of AI, with a save-as-text button that writes the markdown the engine already built.
// It sits above the overview (the HUD fades to zero there, so this layer mounts beside the HUD rather than
// inside it) and never scrolls the page: the column scrolls inside itself.
// BUILD-ONCE: everything is created in mount(); sync() only rewrites when the run's markdown changes.

import { setTxt, setVar } from '../hud.js';
import { STRATA } from '../palette.js';
import { receipt } from '../../engine/receipt.js';

const CSS = `
.rcp { position: fixed; inset: 0; z-index: 200; display: flex; justify-content: center; overflow-y: auto; overscroll-behavior: contain;
  background: radial-gradient(120% 90% at 50% 0%, rgba(24,16,40,0.93) 0%, rgba(5,3,10,0.965) 62%, rgba(3,2,6,0.985) 100%);
  color: #f4efff; font-family: 'Inter', system-ui, sans-serif; opacity: 0; transition: opacity 0.45s ease; }
.rcp.show { opacity: 1; }
.rcp-col { width: 100%; max-width: 1000px; padding: 22px 26px 26px; display: flex; flex-direction: column; gap: 14px; }
.rcp-head { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; padding-bottom: 11px; border-bottom: 1px solid #3d2d58; }
.rcp-eyebrow { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 10.5px; letter-spacing: 0.34em; color: #a494c4; }
.rcp-title { font-size: 25px; font-weight: 600; letter-spacing: 0.02em; line-height: 1.1; }
.rcp-run { margin-left: auto; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 13.5px;
  font-variant-numeric: tabular-nums; color: #c9adf5; white-space: nowrap; }
.rcp-rows { display: flex; flex-direction: column; gap: 9px; }
.rcp-row { display: grid; grid-template-columns: 268px 1fr; gap: 18px; align-items: start;
  padding: 11px 14px; border-radius: 13px; border: 1px solid #2a1f3d; background: rgba(12,8,22,0.62);
  border-left: 3px solid var(--hue, #b78bff); }
.rcp-name { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 10.5px; letter-spacing: 0.22em; color: var(--hue, #b78bff); }
.rcp-sub { font-size: 15px; font-weight: 600; margin: 2px 0 5px; line-height: 1.2; }
.rcp-stat { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11.5px; font-variant-numeric: tabular-nums;
  color: #d7ccec; line-height: 1.5; }
.rcp-text { font-size: 13.5px; line-height: 1.52; color: #d3c8e8; }
.rcp-foot { display: flex; align-items: center; gap: 14px; padding-top: 4px; }
.rcp-save { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11.5px; letter-spacing: 0.16em; color: #f4efff;
  padding: 10px 17px; border-radius: 11px; cursor: pointer; background: linear-gradient(#241a3a, #120c1e);
  border: 1px solid #4a3a6e; box-shadow: inset 0 1px 0 rgba(255,255,255,0.07); }
.rcp-save:hover { border-color: #b78bff; box-shadow: 0 0 18px rgba(183,139,255,0.22); }
.rcp-note { font-size: 12px; color: #8b7cad; }
@media (max-width: 900px) {
  .rcp-col { padding: 16px 14px 20px; gap: 11px; }
  .rcp-row { grid-template-columns: 1fr; gap: 7px; padding: 10px 12px; }
  .rcp-title { font-size: 20px; } .rcp-run { margin-left: 0; font-size: 12px; white-space: normal; }
  .rcp-text { font-size: 13px; }
}
@media (prefers-reduced-motion: reduce) { .rcp { transition: none; } }
`;

/**
 * createView({hud, world, sim, reduced}) -> { sync(), onVerb(), onGoal(), activate(), deactivate(), openDrawer() }
 * The page builds itself on creation and reads the live state on every sync.
 */
export function createView(opts) {
  const o = opts || {};
  const hud = o.hud, sim = o.sim;
  const doc = (hud && hud.root && hud.root.ownerDocument) || document;
  const host = (hud && hud.root && hud.root.parentNode) || doc.body;
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };

  if (!doc.getElementById('rcp-css')) { const s = doc.createElement('style'); s.id = 'rcp-css'; s.textContent = CSS; doc.head.appendChild(s); }

  const page = el('rcp'); page.setAttribute('role', 'region');
  const col = el('rcp-col'); page.appendChild(col);
  const head = el('rcp-head');
  const brow = el('rcp-eyebrow'); setTxt(brow, 'THE RECEIPT');
  const title = el('rcp-title'); setTxt(title, 'What you did, and when we did it');
  const runLine = el('rcp-run');
  const headL = el(); headL.appendChild(brow); headL.appendChild(title);
  head.appendChild(headL); head.appendChild(runLine);
  col.appendChild(head);

  const rows = el('rcp-rows'); col.appendChild(rows);
  const parts = [];
  for (let n = 1; n <= 5; n++) {
    const row = el('rcp-row');
    setVar(row, '--hue', (STRATA[n] || STRATA[5]).accent);
    const left = el();
    const name = el('rcp-name'), sub = el('rcp-sub'), stat = el('rcp-stat');
    left.appendChild(name); left.appendChild(sub); left.appendChild(stat);
    const text = el('rcp-text');
    row.appendChild(left); row.appendChild(text);
    rows.appendChild(row);
    parts.push({ name: name, sub: sub, stat: stat, text: text });
  }

  const foot = el('rcp-foot');
  const save = el('rcp-save', 'button'); setTxt(save, 'SAVE AS TEXT');
  const note = el('rcp-note'); setTxt(note, 'Every number above came out of your run.');
  foot.appendChild(save); foot.appendChild(note);
  col.appendChild(foot);
  host.appendChild(page);

  let last = '';
  let data = receipt(sim ? sim.state : {});

  save.addEventListener('click', () => {
    const blob = new Blob([data.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a'); a.href = url; a.download = 'emergence-receipt.md';
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  /** the run is over by the time this page shows, so a rewrite only happens when the markdown actually changed */
  function sync() {
    if (!sim) return;
    const next = receipt(sim.state);
    if (next.markdown === last) return;
    data = next; last = next.markdown;
    setTxt(runLine, data.run.minutes + ' min · ' + data.run.actions + ' actions · ' + data.run.agent + ' · ' + data.run.ending);
    data.sections.forEach((s, i) => {
      const p = parts[i]; if (!p) return;
      setTxt(p.name, (s.era + '. ' + s.name).toUpperCase());
      setTxt(p.sub, s.title);
      setTxt(p.stat, s.stat);
      setTxt(p.text, s.text);
    });
  }

  function activate() { sync(); if (o.reduced) page.classList.add('show'); else requestAnimationFrame(() => page.classList.add('show')); }
  function deactivate() { page.classList.remove('show'); }

  sync();
  activate();

  return {
    root: page, sync: sync, activate: activate, deactivate: deactivate,
    onVerb() {}, onGoal() {}, openDrawer() {},
    get data() { return data; }
  };
}

export default createView;
