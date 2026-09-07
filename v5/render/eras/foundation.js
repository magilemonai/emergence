// render/eras/foundation.js — the Foundation stratum's view (WO-06).
// The world canvas carries the ladder: Capability rising out of Deep into RECURSION, RECURSION filling the
// Scale bank, and the recursion field breathing around it. The one thing that makes this stratum different
// from every stratum below it lives IN the world too: the machine speaks from the surface it is built on,
// so its window is anchored at world (590, 500) rather than parked in the chrome.
// The left column keeps three controls. The goal box has no button: the threshold is hidden and inevitable.
// The turn itself belongs to the shell (render/fx.js rupture, called on the 5 to 6 switch).
// Desktop only at 1280x800 (SPEC "Refused"): the world pans, the page never scrolls.
// BUILD-ONCE: every element is created in createView and only ever updated by change-detected setters.

import { setTxt, setDis, setCls, setStyle, setVar, fmt } from '../hud.js';
import { STRATA, alpha, mix } from '../palette.js';
import { stratumTop, STRATUM_H } from '../../engine/types.js';
import { HIDDEN_PLATES, improveCost, alignCost, capDef, scaleBonus, rMult } from '../../engine/eras/foundation.js';

const TOP = stratumTop(5);
const RAIL = ['scale', 'capability', 'silicon', 'insight'];
/** the Anomaly is qualitative on purpose: a band, never a number (v4 kept the reading hidden) */
/** every hue comes from the stratum's own palette, so the field reads as Foundation getting louder */
const BANDS = [
  { at: 0, name: 'STEADY', hue: STRATA[5].good, breath: 0.06 },
  { at: 45, name: 'RISING', hue: STRATA[5].accent, breath: 0.13 },
  { at: 70, name: 'HIGH', hue: mix(STRATA[5].accent, STRATA[5].danger, 0.5), breath: 0.22 },
  { at: 90, name: 'CRITICAL', hue: STRATA[5].danger, breath: 0.34 }
];
const bandOf = (a) => { let b = BANDS[0]; for (const x of BANDS) if (a >= x.at) b = x; return b; };
/** the field's outer ring spans the stratum at the threshold */
const RING_MAX = STRATUM_H * 0.46;
const BREATH = 6;   // seconds per breath

export function createView(opts) {
  const hud = opts.hud, world = opts.world, sim = opts.sim;
  const doc = hud.root.ownerDocument;
  const reduced = !!opts.reduced;
  const c = sim.cfg.e5;
  const E = () => sim.state.eras[5];
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };
  const act = (a) => sim.apply(Object.assign({ era: 5 }, a));
  const made = [];
  const add = (parent, node) => { parent.appendChild(node); made.push(node); return node; };

  /* ---------- the left column: three controls, and nothing that belongs in the world ---------- */
  const side = el('f-side');
  const capBtn = el('side-btn', 'button');
  capBtn.setAttribute('data-tip', '<b>Capabilities</b><br><i>Five upgrades it grows into, and one lens you build to watch it.</i><br>Each agentic one raises the Anomaly. Interpretability slows the climb and reads the trait.');
  const capBadge = el('sb-n'), capLab = el('sb-l');
  capBtn.appendChild(capBadge); capBtn.appendChild(capLab);
  side.appendChild(capBtn);
  add(hud.verbList.parentNode, side);

  /* ---------- the window it speaks through, anchored in the stratum it speaks from ---------- */
  const layer = el('f-layer');
  add(hud.root, layer);
  const card = el('fb-card');
  card.setAttribute('data-tip', '<b>Feedback</b><br><i>It writes, you grade.</i><br>Rewarding what is true builds Coherence. Rewarding what flatters you moves it closer to the threshold.');
  const fbHead = el('fb-h'), fbTag = el('fb-tag'), fbClock = el('fb-c');
  fbHead.appendChild(fbTag); fbHead.appendChild(fbClock);
  const fbText = el('fb-t');
  const fbBar = el('fb-bar'); const fbFill = doc.createElement('i'); fbBar.appendChild(fbFill);
  const fbRow = el('fb-row');
  const fbYes = el('fb-b yes', 'button'), fbNo = el('fb-b no', 'button');
  setTxt(fbYes, '✓ REWARD'); setTxt(fbNo, '✗ PENALIZE');
  fbRow.appendChild(fbYes); fbRow.appendChild(fbNo);
  card.appendChild(fbHead); card.appendChild(fbText); card.appendChild(fbBar); card.appendChild(fbRow);
  layer.appendChild(card);
  fbYes.addEventListener('click', () => act({ type: 'rate', how: 'reward' }));
  fbNo.addEventListener('click', () => act({ type: 'rate', how: 'penalize' }));
  const ANCHOR = { x: 590, y: 500 };

  /* ---------- the goal column: the Anomaly band, and no button at all ---------- */
  const anom = el('f-anom');
  const anomL = el('f-anom-l'), anomV = el('f-anom-v');
  const anomBar = el('f-anom-b'); const anomFill = doc.createElement('i'); anomBar.appendChild(anomFill);
  const coher = el('f-coher');
  anom.setAttribute('data-tip', '<b>Anomaly</b><br><i>Something in it is growing that you did not buy.</i><br>The instrument reads a band, never a number. Interpretability slows the climb.');
  anom.appendChild(anomL); anom.appendChild(anomV); anom.appendChild(anomBar); anom.appendChild(coher);
  setTxt(anomL, 'ANOMALY');
  hud.goalExtra(anom);
  made.push(anom);
  setVar(hud.goalBox, '--tease', STRATA[6].tease);
  // the threshold has no button: hide the shared one while this stratum is mounted, put it back on the way out
  const fab = hud.goalBox.querySelector('.fab');
  const fabDisplay = fab ? fab.style.display : null;
  if (fab) fab.style.display = 'none';

  /* ---------- the capability drawer ---------- */
  const drawer = el('drawer');
  const dHead = el('dr-head'), dTitle = el('dr-t'), dCount = el('dr-n'), dX = el('dr-x', 'button');
  setTxt(dTitle, 'CAPABILITIES'); setTxt(dX, '✕');
  dHead.appendChild(dTitle); dHead.appendChild(dCount); dHead.appendChild(dX);
  const dBody = el('dr-body');
  drawer.appendChild(dHead); drawer.appendChild(dBody);
  add(hud.root, drawer);
  const tiles = {};
  for (const d of c.caps) {
    const t = el('c-tile');
    t.setAttribute('data-tip', '<b>' + d.name + '</b><br><i>' + d.flavor + '</i><br>' + d.mech);
    const g = el('c-g'); setTxt(g, d.glyph);
    setStyle(g, 'color', d.align ? STRATA[5].good : STRATA[5].accent);
    const body = el('c-b');
    const nm = el('c-n'); setTxt(nm, d.name);
    const ef = el('c-e'); setTxt(ef, d.mech);
    const b = el('buy', 'button');
    body.appendChild(nm); body.appendChild(ef); body.appendChild(b);
    t.appendChild(g); t.appendChild(body);
    dBody.appendChild(t);
    b.addEventListener('click', () => act({ type: 'cap', id: d.id }));
    tiles[d.id] = { el: t, buy: b, def: d };
  }
  let open = false;
  const setOpen = (v) => { open = v; setCls(drawer, 'drawer' + (open ? ' show' : '')); };
  capBtn.addEventListener('click', () => setOpen(!open));
  dX.addEventListener('click', () => setOpen(false));

  /* ---------- the recursion field: this stratum's weather, drawn in the world ---------- */
  const unDraw = world.onDraw(5, (ctx) => {
    const e = E(), n = sim.node('recursion');
    if (!n) return;
    const p = { x: n.pos.x, y: TOP + n.pos.y };
    const band = bandOf(e.agency || 0);
    const raw = Math.min(1, (sim.state.stocks.scale || 0) / c.emergeScale);
    const climb = 0.28 + 0.72 * raw;          // a field from the first tick, spanning the stratum at the threshold
    const rings = (e.recursion || 0) + 1;
    const breathe = reduced ? 0 : Math.sin(sim.state.t * (Math.PI * 2 / BREATH)) * band.breath;
    for (let i = 0; i < rings; i++) {
      const k = (i + 1) / rings;                       // the outer ring spans the stratum at the threshold
      const r = RING_MAX * climb * k * (1 + breathe * k);
      if (!(r > 4)) continue;
      ctx.strokeStyle = alpha(band.hue, 0.06 + 0.18 * raw * (1 - i / (rings + 1)) + 0.04);
      ctx.lineWidth = 1 + 2 * raw;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    }
  });

  /* ---------- verbs ---------- */
  function onVerb(name) { if (name === 'improve') act({ type: 'improve' }); else if (name === 'align') act({ type: 'align' }); }
  function onGoal() { /* the threshold has no button: it arrives on its own */ }

  /** a scene may ask for the drawer; the turn is the shell's (window.__V5.rupture) */
  function openDrawer(name) { if (/capabilit/.test(name || '')) setOpen(true); }

  let verbEls = null;
  function sync() {
    const st = sim.state, e = E();

    const rail = [];
    for (const id of RAIL) if (id in st.stocks) rail.push({ id: id, value: st.stocks[id], rate: st.rates[id] || 0 });
    hud.setRail(rail);

    const ic = improveCost(sim), ac = alignCost(sim);
    const plan = e.caps.recursivePlanning ? capDef(sim, 'recursivePlanning').improve : 1;
    hud.renderVerbs([
      {
        name: 'improve', label: 'SELF-IMPROVE Lv ' + e.recursion,
        yield: fmt(ic) + ' cap → +' + fmt(c.scalePerImprove * (e.recursion + 1) * plan) + ' Scale',
        key: 'SPACE', disabled: !sim.can({ type: 'improve', era: 5 }),
        tip: '<b>Self-Improve</b><br><i>It improves the thing that improves it.</i><br>One more unit on the converter, and the threshold comes at you sooner.'
      },
      {
        name: 'align', label: 'ALIGN THE OBJECTIVE',
        yield: fmt(ac) + ' cap → +' + c.alignActIncr + ' Coherence',
        key: 'Q', disabled: !sim.can({ type: 'align', era: 5 }),
        tip: '<b>Align the objective</b><br><i>Say what you meant, in terms it can hold.</i><br>Coherence is what it wakes up with. Needs Interpretability first.'
      }
    ]);
    if (!verbEls) { const list = hud.verbList.querySelectorAll('.verb'); verbEls = { improve: list[0], align: list[1] }; }
    const pressing = e.press && st.t - e.press.at < c.oddDur ? e.press.verb : null;
    for (const k of ['improve', 'align']) if (verbEls[k]) setCls(verbEls[k], 'verb' + (pressing === k ? ' agent-press' : ''));

    // the capability ladder
    let can = 0, own = 0;
    for (const d of c.caps) {
      const T = tiles[d.id], has = !!e.caps[d.id], ok = !has && !e.emerged && (st.stocks.capability || 0) >= d.cost;
      if (has) own++;
      if (ok) can++;
      setTxt(T.buy, has ? 'BUILT' : fmt(d.cost) + ' capability');
      setDis(T.buy, !ok);
      setCls(T.buy, 'buy' + (ok ? ' ok' : ''));
      setCls(T.el, 'c-tile' + (has ? ' owned' : ok ? ' can' : ''));
    }
    setTxt(capBadge, String(can));
    setCls(capBadge, 'sb-n' + (can ? ' hot' : ''));
    setTxt(capLab, 'CAPABILITIES ' + own + '/' + c.caps.length);
    setTxt(dCount, own + ' / ' + c.caps.length);

    // the window: it speaks from the stratum, and the trait is readable only once you built the lens
    const cur = e.fb.cur;
    const show = world.locked === 5 && world.lod === 'full' && !world.isOverview;
    setStyle(layer, 'display', show ? '' : 'none');
    if (show) {
      const s = world.toScreen({ x: ANCHOR.x, y: TOP + ANCHOR.y });
      setStyle(card, 'left', Math.round(s.x) + 'px');
      setStyle(card, 'top', Math.round(s.y) + 'px');
    }
    setCls(card, 'fb-card' + (cur ? ' live' : ''));
    setTxt(fbTag, cur ? (e.caps.interpret ? cur.t.toUpperCase() : '· · ·') : 'STANDING BY');
    setStyle(fbTag, 'color', cur && e.caps.interpret ? (cur.t === 'honest' || cur.t === 'helpful' ? STRATA[5].good : STRATA[5].danger) : 'var(--dimmer)');
    setTxt(fbClock, cur ? Math.ceil(Math.max(0, cur.left)) + 's' : (e.emerged ? '' : Math.ceil(Math.max(0, e.fb.next)) + 's'));
    setTxt(fbText, cur ? cur.text : '');
    setStyle(fbFill, 'width', (cur ? Math.max(0, Math.min(1, cur.left / c.fbDur)) * 100 : 0) + '%');
    setDis(fbYes, !cur); setDis(fbNo, !cur);

    // the anomaly band, and the coherence it costs you to slow it
    const a = e.agency || 0, band = bandOf(a);
    setTxt(anomV, band.name);
    setStyle(anomV, 'color', band.hue);
    setStyle(anomFill, 'width', Math.max(0, Math.min(100, a)) + '%');
    setStyle(anomFill, 'background', band.hue);
    setTxt(coher, e.caps.interpret ? 'COHERENCE ' + Math.round(e.coherence) + ' / ' + c.coherMax : 'COHERENCE UNREADABLE');

    const g = sim.goal(5);
    hud.renderGoal({
      progress: g.progress, ready: false, name: 'The threshold',
      value: Math.round(st.stocks.scale || 0), label: 'scale · ' + fmt(c.recurScale * scaleBonus(sim) * (sim.node('recursion') || { count: 1 }).count) + '/s · ×' + rMult(sim).toFixed(2),
      action: ''
    });
    if (fab) fab.style.display = 'none';

    const madePlates = world.plates && world.plates.made;
    if (madePlates) for (const id of HIDDEN_PLATES) if (madePlates[id]) setStyle(madePlates[id].el, 'visibility', 'hidden');
  }

  function deactivate() {
    if (unDraw) unDraw();
    if (fab) fab.style.display = fabDisplay || '';
    for (const n of made) if (n.parentNode) n.parentNode.removeChild(n);
    made.length = 0;
  }

  return { sync, onVerb, onGoal, openDrawer, deactivate, toggleResearch: () => setOpen(!open) };
}

export default createView;
