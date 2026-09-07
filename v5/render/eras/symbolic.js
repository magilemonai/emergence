// render/eras/symbolic.js — the Symbolic stratum's view (WO-03).
// The world canvas, the pipes and the node plates belong to render/; this module owns what the HUD frame does
// not: the terminal under the proof sink (the machine's first voice), the proof card the Inference pipe runs
// into, the theorem grid in the field, the Expert System path in the goal column, the contradiction card beside
// it, and Compile as a CRT reboot of the whole stratum.
// BUILD-ONCE: every element is created in createView and only ever updated through the change-detected setters.

import { setTxt, setDis, setCls, setStyle, setAttr, fmt } from '../hud.js';
import { STRATA, resHue } from '../palette.js';
import { stratumTop } from '../../engine/types.js';
import symbolic, {
  stats, proofCost, proofName, canProve, theoremItems, isLemma, treeDef,
  termLines, axiomGain, inferenceRate, rulesetGated, batchN,
  THEOREM_GRID, TERMINAL_AT, HIDDEN_PLATES
} from '../../engine/eras/symbolic.js';

const TOP = stratumTop(2);
const CARD = { proof: 176, term: 330, th: 200 };
const STYLE_ID = 'e2-css';

const CSS = `
.e2-layer { position: absolute; inset: 0; z-index: 6; pointer-events: none; }
.e2-layer > * { position: absolute; transform: translate(-50%, -50%); pointer-events: auto; }

/* the proof sink wears a card: the pipe from the Inference bank runs straight into it */
.e2-proof { width: 176px; padding: 9px 10px 10px; border-radius: 12px; border: 1px solid var(--edge, #2b5237); background: var(--panel, #0a180e); box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5); }
.e2-proof.idle { border-style: dashed; opacity: 0.72; }
.e2-proof .pv { font-family: var(--mono, monospace); font-size: 15px; font-variant-numeric: tabular-nums; font-weight: 600; color: var(--good, #8dffb7); }
.e2-proof .pn { font-family: var(--era-font, monospace); font-size: 13px; color: var(--text, #c7f0d4); margin: 1px 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.e2-proof .pm { height: 7px; border-radius: 4px; background: rgba(0, 0, 0, 0.5); overflow: hidden; }
.e2-proof .pm i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--accent, #ffcd6b), var(--good, #8dffb7)); transition: width 0.25s; }
.e2-proof .pe { font-family: var(--mono, monospace); font-size: 10.5px; color: var(--dimmer, #4f7a60); margin-top: 4px; font-variant-numeric: tabular-nums; }

/* the terminal: three lines of machine output, newest last, typed in */
.e2-term { width: 330px; padding: 8px 11px 9px; border-radius: 10px; border: 1px solid var(--line, #1d3a26); background: rgba(0, 0, 0, 0.55); box-shadow: inset 0 0 24px rgba(141, 255, 183, 0.06); }
.e2-term .tl { font-family: var(--mono, monospace); font-size: 12px; line-height: 1.5; color: var(--dim, #7bbd93); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.e2-term .tl.last { color: var(--good, #8dffb7); }
.e2-term .tl.warn { color: var(--danger, #ff8a5c); }
.e2-term .tl.type { animation: e2type 0.5s steps(24, end); }
@keyframes e2type { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }

/* theorems: compact plates in the field, aimed at with banked Inference */
.e2-th { width: 200px; padding: 8px 10px 9px; border-radius: 11px; border: 1px solid var(--line, #1d3a26); background: var(--panel, #0a180e); }
.e2-th.lemma { border-style: dashed; }
.e2-th.active { border-color: var(--good, #8dffb7); box-shadow: 0 0 18px rgba(141, 255, 183, 0.22); }
.e2-th .thn { font-family: var(--era-font, monospace); font-size: 14px; color: var(--text, #c7f0d4); }
.e2-th .thd { font-size: 11px; line-height: 1.25; color: var(--dim, #7bbd93); min-height: 27px; margin: 2px 0 5px; }

/* the Expert System path, at the top of the goal box */
.e2-path { text-align: left; margin: 0 0 8px; }
.e2-path .pstep { font-family: var(--mono, monospace); font-size: 11.5px; color: var(--dimmer, #4f7a60); line-height: 1.5; white-space: nowrap; }
.e2-path .pstep.done { color: var(--good, #8dffb7); }
.e2-path .pstep.now { color: var(--accent, #ffcd6b); }
.e2-path .pmark { display: inline-block; width: 14px; }

/* the contradiction: beside the goal, never over a button */
.e2-contra { margin-top: 10px; padding: 10px 11px; border-radius: 13px; border: 1px solid var(--edge, #2b5237); background: var(--panel, #0a180e); opacity: 0; transform: translateY(-5px); pointer-events: none; transition: opacity 0.3s ease, transform 0.3s ease; }
.e2-contra.show { opacity: 1; transform: none; pointer-events: auto; border-color: var(--danger, #ff8a5c); box-shadow: 0 0 22px rgba(255, 138, 92, 0.22); }
.e2-contra .cn { font-family: var(--mono, monospace); font-size: 13px; color: var(--danger, #ff8a5c); font-variant-numeric: tabular-nums; }
.e2-contra .cd { font-family: var(--mono, monospace); font-size: 11px; color: var(--dim, #7bbd93); margin: 3px 0 7px; }
.e2-contra .cd.odd { color: var(--accent, #ffcd6b); }
.e2-contra .ca { display: flex; flex-direction: column; gap: 5px; }

/* Compile: the stratum powers down to a line and comes back from a higher floor */
body.crt-off #world, body.crt-off .plate-layer, body.crt-off .e2-layer { animation: crtOff 0.72s ease-in forwards; transform-origin: 50% 45%; }
body.crt-on #world, body.crt-on .plate-layer, body.crt-on .e2-layer { animation: crtOn 0.68s ease-out; transform-origin: 50% 45%; }
body.crt-hold #world, body.crt-hold .plate-layer, body.crt-hold .e2-layer { transform: scaleY(0.34) scaleX(1.02); filter: brightness(1.9) contrast(1.15); transform-origin: 50% 45%; }
@keyframes crtOff { 0% { transform: none; filter: none; } 55% { transform: scaleY(0.16) scaleX(1.02); filter: brightness(2.1); } 100% { transform: scaleY(0.004) scaleX(0.55); filter: brightness(3.2); } }
@keyframes crtOn { 0% { transform: scaleY(0.004) scaleX(0.55); filter: brightness(3.2); } 40% { transform: scaleY(0.2); filter: brightness(2); } 100% { transform: none; filter: none; } }
@media (prefers-reduced-motion: reduce) {
  .e2-term .tl.type { animation: none; }
  .e2-contra { transition: none; }
  body.crt-off #world, body.crt-off .plate-layer, body.crt-off .e2-layer,
  body.crt-on #world, body.crt-on .plate-layer, body.crt-on .e2-layer { animation: none; opacity: 0.25; }
}
`;

/**
 * createView({hud, world, sim, buy, assets}) -> { sync(), onVerb(name), onGoal(), activate() }
 */
export function createView(opts) {
  const hud = opts.hud, world = opts.world, sim = opts.sim, buy = opts.buy;
  const doc = hud.root.ownerDocument;
  const win = doc.defaultView;
  const c = sim.cfg.e2;
  const E = () => sim.state.eras[2];
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };

  if (!doc.getElementById(STYLE_ID)) {
    const st = doc.createElement('style'); st.id = STYLE_ID; st.textContent = CSS; doc.head.appendChild(st);
  }
  const sceneName = ((win.location.hash || '').match(/scene=([\w-]+)/) || [])[1] || '';

  /* ---------- the goal column: the path, then the contradiction card beside the goal ---------- */
  const path = el('e2-path');
  const steps = c.path.map((id) => { const s = el('pstep'); const m = el('pmark', 'span'); const n = el('', 'span'); s.appendChild(m); s.appendChild(n); path.appendChild(s); return { el: s, mark: m, name: n, id: id }; });
  hud.goalExtra(path);
  const fab = hud.goalBox.querySelector('.fab');

  const contra = el('e2-contra');
  const cName = el('cn'), cDesc = el('cd'), cActs = el('ca');
  const cFwd = el('buy', 'button'), cBwd = el('buy', 'button');
  cActs.appendChild(cFwd); cActs.appendChild(cBwd);
  contra.appendChild(cName); contra.appendChild(cDesc); contra.appendChild(cActs);
  hud.goalAside(contra);
  cFwd.addEventListener('click', () => sim.apply({ type: 'resolve', era: 2, side: 'fwd' }));
  cBwd.addEventListener('click', () => sim.apply({ type: 'resolve', era: 2, side: 'bwd' }));

  /* ---------- the rail's own controls ---------- */
  const bulk = el('rail-btn', 'button');
  const mapBtn = el('rail-btn', 'button');
  hud.railRight.appendChild(bulk); hud.railRight.appendChild(mapBtn);
  bulk.addEventListener('click', () => { const i = c.buyModes.indexOf(buy.n); buy.n = c.buyModes[(i + 1) % c.buyModes.length]; });
  mapBtn.addEventListener('click', () => { if (world.isOverview) world.lockTo(2, true); else world.overview(true); });

  /* ---------- the world-anchored layer: proof card, terminal, theorem grid ---------- */
  const layer = el('e2-layer');
  hud.root.appendChild(layer);
  const anchors = [];
  const anchor = (node, x, y) => { layer.appendChild(node); const a = { el: node, x: x, y: y, on: true }; anchors.push(a); return a; };

  const proof = el('e2-proof');
  const pVal = el('pv'), pName = el('pn'), pMeter = el('pm'), pFill = doc.createElement('i'), pEta = el('pe');
  pMeter.appendChild(pFill);
  proof.appendChild(pVal); proof.appendChild(pName); proof.appendChild(pMeter); proof.appendChild(pEta);
  const proofAt = anchor(proof, symbolic.layout.anchors.proof.x, symbolic.layout.anchors.proof.y);

  const term = el('e2-term');
  const tls = [];
  for (let i = 0; i < c.termLines; i++) { const l = el('tl'); term.appendChild(l); tls.push(l); }
  anchor(term, TERMINAL_AT.x, TERMINAL_AT.y);

  const ths = {};
  const allIds = ['optimization', 'capacity'].concat(c.tree.map((n) => n.id));
  for (const id of allIds) {
    const t = el('e2-th');
    const n = el('thn'), d = el('thd'), b = el('buy', 'button');
    t.appendChild(n); t.appendChild(d); t.appendChild(b);
    const def = treeDef(sim, id);
    if (def) setAttr(t, 'data-tip', '<b>' + def.name + '</b><br>' + def.desc);
    b.addEventListener('click', () => sim.apply({ type: 'aim', era: 2, id: id }));
    ths[id] = { el: t, name: n, desc: d, buy: b, at: anchor(t, 0, 0) };
  }

  /* ---------- the yield leaves the button when you press it ---------- */
  const floats = el('floats');
  hud.root.appendChild(floats);
  function floatNum(txt, hue, node) {
    const r = node.getBoundingClientRect();
    const f = el('flt');
    setTxt(f, txt); f.style.color = hue;
    f.style.left = Math.round(r.right - 18) + 'px';
    f.style.top = Math.round(r.top + 8) + 'px';
    floats.appendChild(f);
    f.addEventListener('animationend', () => { if (f.parentNode) f.parentNode.removeChild(f); });
    if (floats.children.length > 8) floats.removeChild(floats.firstChild);
  }
  const verbEl = (name) => hud.verbList.querySelector('[data-v="' + name + '"]');

  /* ---------- Compile: the stratum reboots ---------- */
  let compiles = -1, timers = [];
  function reboot() {
    if (sceneName === 'symbolic-reboot') { doc.body.classList.add('crt-hold'); return; }   // a shot holds the frame
    const b = doc.body;
    b.classList.remove('crt-on'); b.classList.add('crt-off');
    timers.push(win.setTimeout(() => {
      b.classList.remove('crt-off'); b.classList.add('crt-on');
      timers.push(win.setTimeout(() => b.classList.remove('crt-on'), 700));
    }, 720));
  }

  /* ---------- verbs ---------- */
  function onVerb(name) {
    if (name === 'writeRule') {
      const g = stats(sim).click;
      if (!sim.apply({ type: 'writeRule', era: 2 }).ok) return;
      const b = verbEl('writeRule');
      if (b) floatNum('+' + fmt(g), resHue('rules'), b);
      return;
    }
    if (name === 'compile') {
      const g = axiomGain(sim);
      if (!sim.apply({ type: 'compile', era: 2 }).ok) return;
      const b = verbEl('compile');
      if (b) floatNum('+' + g, resHue('axioms'), b);
    }
  }
  function onGoal() { sim.apply({ type: 'prove', era: 2 }); }

  win.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (sim.state.era === 2 && (e.key === 'c' || e.key === 'C')) onVerb('compile');
  });

  /* ---------- per-frame update ---------- */
  let locked0 = false, termN = -1;
  function sync() {
    const e = E(), st = sim.state, S = stats(sim);
    // app.js hands world.scene() the scene name, which frames stratum 1 for a name with no digit in it
    if (!locked0) { locked0 = true; if (world.locked !== 2) world.lockTo(2, false); }

    // rail: Knowledge stays on the rail because this stratum draws it up the riser
    hud.setRail([
      { id: 'knowledge', value: st.stocks.knowledge || 0, rate: st.rates.knowledge || 0 },
      { id: 'rules', value: st.stocks.rules || 0, rate: st.rates.rules || 0 },
      { id: 'inference', value: st.stocks.inference || 0, rate: st.rates.inference || 0 }
    ].concat(e.flags.compile || st.stocks.axioms > 0 ? [{ id: 'axioms', value: st.stocks.axioms || 0, rate: 0 }] : []));
    setTxt(bulk, '×' + buy.n);
    setTxt(mapBtn, world.isOverview ? '⤢ BOARD' : '⤢ MAP');

    // verbs: the yield leads. Writing by hand also pushes the proof you are aiming at.
    const verbs = [{
      name: 'writeRule', label: 'WRITE A RULE', key: 'SPACE',
      yield: '+' + fmt(S.click) + ' rules' + (e.activeProof ? ' · +' + fmt(S.click * c.clickProof) + ' proof' : ''),
      tip: '<b>Write a rule</b><br><i>Reasoning, written as explicit rules.</i>'
    }];
    if (e.flags.compile) verbs.push({
      name: 'compile', label: 'COMPILE', key: 'C',
      yield: '+' + axiomGain(sim) + ' axioms', disabled: !sim.can({ type: 'compile', era: 2 }),
      tip: '<b>Compile</b><br><i>Truths banked forever, kept across runs.</i><br>Banks the run. Clears the engine.'
    });
    hud.renderVerbs(verbs);
    const btns = hud.verbList.children;
    for (let i = 0; i < verbs.length && i < btns.length; i++) setAttr(btns[i], 'data-v', verbs[i].name);

    // the goal: the Expert System path, checked off
    const g = sim.goal(2);
    let done = 0, next = null;
    for (const s of steps) {
      const ok = !!e.tech[s.id];
      if (ok) done++;
      const now = !ok && canProve(sim, s.id);
      if (!ok && !next) next = s.id;
      setCls(s.el, 'pstep' + (ok ? ' done' : now ? ' now' : ''));
      setTxt(s.mark, ok ? '✓' : now ? '▸' : '·');
      setTxt(s.name, proofName(sim, s.id));
    }
    hud.renderGoal({
      progress: g.progress, ready: g.ready && !e.flags.symbolicDone, name: 'Expert System',
      value: done + ' / ' + c.path.length,
      label: e.flags.symbolicDone ? 'proven' : fmt(proofCost(sim, 'expert')) + ' inference · 5 axioms',
      action: e.flags.symbolicDone ? 'PROVEN ✓' : (e.activeProof === 'expert' ? 'PROVING…' : 'PROVE IT')
    });
    if (fab) setStyle(fab, 'fontFamily', STRATA[3].font);      // the goal wakes in the next stratum's face

    // the terminal: the machine's own output, newest last, typed in as it arrives
    const lines = termLines(sim);
    if (termN !== e.termN) {
      termN = e.termN;
      for (let i = 0; i < tls.length; i++) {
        const li = lines.length - tls.length + i;
        const txt = li >= 0 ? lines[li] : '';
        setTxt(tls[i], txt);
        const last = i === tls.length - 1 || li === lines.length - 1;
        setCls(tls[i], 'tl' + (last ? ' last' : '') + (/⚠/.test(txt) ? ' warn' : ''));
        if (last && txt) { tls[i].classList.remove('type'); void tls[i].offsetWidth; tls[i].classList.add('type'); }
      }
    }

    // the proof card: what the Inference pipe is running into
    if (e.activeProof) {
      const id = e.activeProof, cost = proofCost(sim, id), acc = e.proofAcc[id] || 0;
      const rate = inferenceRate(sim);
      setCls(proof, 'e2-proof');
      setTxt(pVal, fmt(acc) + ' / ' + fmt(cost));
      setTxt(pName, proofName(sim, id));
      setStyle(pFill, 'width', Math.min(100, acc / cost * 100).toFixed(1) + '%');
      setTxt(pEta, rate > 0 ? '~' + Math.max(0, Math.ceil((cost - acc) / rate)) + 's' : 'no inference');
    } else {
      setCls(proof, 'e2-proof idle');
      setTxt(pVal, '0 ∴');
      setTxt(pName, 'no proof aimed');
      setStyle(pFill, 'width', '0%');
      setTxt(pEta, '▸ aim at a theorem');
    }

    // the theorem grid: the two lemmas, then the open tree, laid out 3 across
    const items = theoremItems(sim);
    for (const id of allIds) {
      const T = ths[id], i = items.indexOf(id);
      T.at.on = i >= 0 && !e.flags.symbolicDone;
      if (i < 0) continue;
      T.at.x = THEOREM_GRID.x + (i % THEOREM_GRID.cols) * THEOREM_GRID.dx;
      T.at.y = THEOREM_GRID.y + Math.floor(i / THEOREM_GRID.cols) * THEOREM_GRID.dy;
      const active = e.activeProof === id;
      setCls(T.el, 'e2-th' + (isLemma(id) ? ' lemma' : '') + (active ? ' active' : ''));
      setTxt(T.name, proofName(sim, id));
      setTxt(T.desc, descOf(id));
      setTxt(T.buy, active ? 'PROVING…' : 'AIM · ' + fmt(proofCost(sim, id)) + ' ∴');
      setDis(T.buy, active);
      setCls(T.buy, 'buy' + (active ? '' : ' ok'));
    }

    // the contradiction: it slows the engine until you discard one of the two rules
    if (e.contra) {
      setCls(contra, 'e2-contra show');
      setTxt(cName, '⚠ #' + e.contra.a + ' ⊥ #' + e.contra.b);
      setTxt(cDesc, e.contra.odd ? 'origin: none · engine at ' + Math.round(c.contraSlow * 100) + '%' : 'engine at ' + Math.round(c.contraSlow * 100) + '%');
      setCls(cDesc, 'cd' + (e.contra.odd ? ' odd' : ''));
      setTxt(cFwd, 'DISCARD #' + e.contra.a + ' · rulesets +' + Math.round(c.contraBonus * 100) + '%');
      setTxt(cBwd, 'DISCARD #' + e.contra.b + ' · writes +' + Math.round(c.contraBonus * 100) + '%');
      setCls(cFwd, 'buy ok'); setCls(cBwd, 'buy ok');
    } else setCls(contra, 'e2-contra');

    // plates: the proof sink shows the card above instead, and the gate reads on the Ruleset plate
    const made = world.plates && world.plates.made;
    if (made) {
      for (const id of st.nodeOrder) {
        const P = made[id]; if (!P) continue;
        const n = st.nodes[id];
        setStyle(P.el, 'visibility', n.locked || HIDDEN_PLATES.indexOf(id) >= 0 ? 'hidden' : 'visible');
      }
      const R = made.ruleset;
      if (R) {
        const gated = rulesetGated(sim);
        setStyle(R.buy, 'opacity', gated ? '0.45' : '');
        if (gated) { setTxt(R.buy, 'PROVE FORMAL LOGIC'); setDis(R.buy, true); }
        else {
          const k = batchN(sim, 'ruleset', buy.n);
          setTxt(R.buy, fmt(sim.costOf('ruleset', k)) + ' rules · BUILD' + (k > 1 ? ' ×' + k : ''));
        }
      }
    }

    // the anchored layer rides the world: hide it whenever the plates are hidden
    const show = world.locked === 2 && world.lod === 'full' && !world.isOverview;
    for (const a of anchors) {
      const on = show && a.on !== false;
      setStyle(a.el, 'display', on ? '' : 'none');
      if (!on) continue;
      const s = world.toScreen({ x: a.x, y: TOP + a.y });
      setStyle(a.el, 'left', Math.round(s.x) + 'px');
      setStyle(a.el, 'top', Math.round(s.y) + 'px');
    }
    proofAt.on = true;

    if (compiles !== e.compiles) { compiles = e.compiles; if (e.compiles > 0) reboot(); }
  }

  function descOf(id) {
    if (id === 'optimization') return '+' + Math.round(c.lemmaBonus * 100) + '% rule production · repeatable';
    if (id === 'capacity') return '+' + c.infCapStep + ' banked Inference · repeatable';
    const d = treeDef(sim, id);
    return d ? d.desc : '';
  }

  return {
    sync, onVerb, onGoal,
    activate() { hud.applyPalette(2); },
    deactivate() { for (const t of timers) win.clearTimeout(t); timers = []; }
  };
}

export default createView;
