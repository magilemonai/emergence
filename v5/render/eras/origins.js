// render/eras/origins.js — the Origins stratum's view (WO-02).
// The world canvas and the plates belong to render/world.js; this module owns everything the HUD frame
// does not: the research drawer, the commission card beside the goal, the hands lever, refine, the goal's
// age image, the floating yield on a verb press, and which plates a locked node is allowed to show.
// BUILD-ONCE: every element here is created in mount() and only ever updated by the change-detected setters.

import { setTxt, setHTML, setDis, setCls, setStyle, setAttr, setVar, fmt } from '../hud.js';
import { STRATA, resHue, resGlyph } from '../palette.js';
import { handYield, pickYield, canDisco, discoVisible, refineCost, HIDDEN_PLATES } from '../../engine/eras/origins.js';

const AGE_IMG = ['', 'core-stone.png', 'core-bronze.png', 'core-silicon.png'];
const RAIL_GATE = [
  ['marks', () => true],
  ['ore', (e) => e.flags.o_materials],
  ['knowledge', (e) => e.flags.o_scriptorium],
  ['metal', (e) => e.flags.o_smelter],
  ['silicon', (e) => e.flags.o_foundry]
];

/**
 * createOriginsView({hud, world, sim, buy, assets}) -> { sync(), onVerb(name), onGoal(), toggleResearch() }
 * `buy` is the shared bulk-buy box { n } that world.js prices plates from.
 */
export function createOriginsView(opts) {
  const hud = opts.hud, world = opts.world, sim = opts.sim, buy = opts.buy;
  const assets = opts.assets || '../assets/';
  const doc = hud.root.ownerDocument;
  const c = sim.cfg.e1;
  const E = () => sim.state.eras[1];
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };

  /* ---------- the goal column: the age image, then the commission card under the goal ---------- */
  const age = doc.createElement('img');
  age.className = 'o-age'; age.alt = '';
  hud.goalBox.insertBefore(age, hud.goalBox.firstChild);
  const fab = hud.goalBox.querySelector('.fab');
  setVar(hud.goalBox, '--tease', STRATA[2].good);      // the goal wakes in Symbolic's phosphor

  const comm = el('comm');
  const cmNeed = el('cm-need'), cmName = el('cm-name'), cmRew = el('cm-rew');
  const cmBar = el('cm-bar'), cmFill = doc.createElement('i'); cmBar.appendChild(cmFill);
  const cmActs = el('cm-acts');
  const cmYes = el('buy cm-yes', 'button'), cmNo = el('buy cm-no', 'button');
  setTxt(cmNo, 'DECLINE');
  cmActs.appendChild(cmYes); cmActs.appendChild(cmNo);
  comm.appendChild(cmNeed); comm.appendChild(cmName); comm.appendChild(cmRew); comm.appendChild(cmBar); comm.appendChild(cmActs);
  hud.goalBox.parentNode.appendChild(comm);
  cmYes.addEventListener('click', () => sim.apply({ type: 'commission', era: 1, accept: true }));
  cmNo.addEventListener('click', () => sim.apply({ type: 'commission', era: 1, accept: false }));

  /* ---------- the left column, under the verbs: research, the hands lever, refine ---------- */
  const side = el('o-side');
  const rBtn = el('side-btn', 'button');
  const rBadge = el('sb-n'); const rLab = el('sb-l'); setTxt(rLab, 'RESEARCH');
  rBtn.appendChild(rBadge); rBtn.appendChild(rLab);
  const hands = el('ctl');
  const hLab = el('ctl-lab'); setTxt(hLab, 'THE HANDS');
  const hRow = el('lev');
  const hA = el('lv-a'), hB = el('lv-b');
  const slider = doc.createElement('input');
  slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = '50'; slider.className = 'lv-s';
  hRow.appendChild(hA); hRow.appendChild(slider); hRow.appendChild(hB);
  const hTags = el('lev-tags');
  const tA = el('lt'), tB = el('lt'); setTxt(tA, 'RECORD'); setTxt(tB, 'FORGE');
  setStyle(tA, 'color', resHue('marks')); setStyle(tB, 'color', resHue('metal'));
  hTags.appendChild(tA); hTags.appendChild(tB);
  hands.appendChild(hLab); hands.appendChild(hRow); hands.appendChild(hTags);
  const ref = el('ctl');
  const fLab = el('ctl-lab'); const fRow = el('ref-row');
  const fEff = el('ref-eff'); const fBuy = el('buy ref-buy', 'button');
  fRow.appendChild(fEff); fRow.appendChild(fBuy);
  ref.appendChild(fLab); ref.appendChild(fRow);
  side.appendChild(rBtn); side.appendChild(hands); side.appendChild(ref);
  hud.verbList.parentNode.appendChild(side);
  slider.addEventListener('input', () => sim.apply({ type: 'hands', era: 1, lever: 1 - (+slider.value / 100) }));
  fBuy.addEventListener('click', () => sim.apply({ type: 'refine', era: 1, n: 1 }));

  /* ---------- the rail's own controls: bulk buy and the zoom-out ---------- */
  const bulk = el('rail-btn', 'button');
  const mapBtn = el('rail-btn', 'button'); setTxt(mapBtn, '⤢ MAP');
  hud.railRight.appendChild(bulk); hud.railRight.appendChild(mapBtn);
  bulk.addEventListener('click', () => {
    const i = c.buyModes.indexOf(buy.n);
    buy.n = c.buyModes[(i + 1) % c.buyModes.length];
  });
  mapBtn.addEventListener('click', () => { if (world.isOverview) world.lockTo(1, true); else world.overview(true); });

  /* ---------- the research drawer: every tile built once, revealed as its chain opens ---------- */
  const drawer = el('drawer');
  const dHead = el('dr-head'); const dTitle = el('dr-t'); setTxt(dTitle, 'RESEARCH');
  const dCount = el('dr-n'); const dX = el('dr-x', 'button'); setTxt(dX, '✕');
  dHead.appendChild(dTitle); dHead.appendChild(dCount); dHead.appendChild(dX);
  const dBody = el('dr-body');
  drawer.appendChild(dHead); drawer.appendChild(dBody);
  hud.root.appendChild(drawer);
  const tiles = {};
  for (const d of c.disco) {
    const t = el('d-tile');
    t.setAttribute('data-tip', '<b>' + d.name + '</b><br><i>' + d.flavor + '</i><br>' + d.mech);
    const cost = el('d-cost');
    const chips = [];
    const wants = d.costs ? Object.keys(d.costs).map((k) => [k, d.costs[k], false]) : [[d.res, d.cost, false]];
    if (d.reqRes) for (const k of Object.keys(d.reqRes)) wants.push([k, d.reqRes[k], true]);
    for (const w of wants) {
      const ch = el('chip-c');
      setTxt(ch, w[1] + ' ' + resGlyph(w[0]));    // a discovery price is a whole number; show it whole
      setStyle(ch, 'color', resHue(w[0]));
      cost.appendChild(ch);
      chips.push({ el: ch, res: w[0], amount: w[1], hold: w[2] });
    }
    const name = el('d-name'); setTxt(name, d.name);
    const mech = el('d-mech'); setTxt(mech, d.mech);
    const b = el('buy d-buy', 'button'); setTxt(b, 'DISCOVER');
    t.appendChild(cost); t.appendChild(name); t.appendChild(mech); t.appendChild(b);
    dBody.appendChild(t);
    b.addEventListener('click', () => sim.apply({ type: 'discover', era: 1, id: d.id }));
    tiles[d.id] = { el: t, buy: b, chips: chips, def: d };
  }
  let open = false;
  const setOpen = (v) => { open = v; setCls(drawer, 'drawer' + (open ? ' show' : '')); };
  rBtn.addEventListener('click', () => setOpen(!open));
  dX.addEventListener('click', () => setOpen(false));

  /* ---------- the floating yield: the number leaves the button and lands on the world ---------- */
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

  /* ---------- verbs ---------- */
  function onVerb(name) {
    const before = name === 'inscribe' ? handYield(sim) : pickYield(sim);
    const r = sim.apply({ type: name, era: 1 });
    if (!r.ok) return;
    const b = verbEl(name);
    if (b) floatNum('+' + fmt(before), resHue(name === 'inscribe' ? 'marks' : 'ore'), b);
  }
  function onGoal() { sim.apply({ type: 'fabricate', era: 1 }); }

  /* ---------- per-frame update ---------- */
  let ready0 = false;
  function sync() {
    const e = E(), st = sim.state;

    // rail: only the banks this run has opened
    const list = [];
    for (const g of RAIL_GATE) if (g[1](e)) list.push({ id: g[0], value: st.stocks[g[0]] || 0, rate: st.rates[g[0]] || 0 });
    hud.setRail(list);
    setTxt(bulk, '×' + buy.n);
    setTxt(mapBtn, world.isOverview ? '⤢ BOARD' : '⤢ MAP');

    // verbs: the yield leads, the name follows
    const verbs = [{ name: 'inscribe', label: 'INSCRIBE', yield: '+' + fmt(handYield(sim)) + ' marks', key: 'SPACE', tip: '<b>Inscribe</b><br><i>The mark comes before the machine.</i>' }];
    if (e.flags.o_materials) verbs.push({ name: 'quarry', label: 'QUARRY', yield: '+' + fmt(pickYield(sim)) + ' ore', key: 'Q', tip: '<b>Quarry</b><br><i>Stone gives way, slowly.</i>' });
    hud.renderVerbs(verbs);
    const btns = hud.verbList.children;
    for (let i = 0; i < verbs.length && i < btns.length; i++) setAttr(btns[i], 'data-v', verbs[i].name);

    // the goal: silicon walking toward the machine, the image walking the ages
    const g = sim.goal(1);
    hud.renderGoal({
      progress: g.progress, ready: g.ready, name: 'The Logic Machine',
      value: fmt(st.stocks.silicon || 0), label: '/ ' + c.siliconGate + ' silicon',
      action: e.done ? 'FABRICATED' : 'FABRICATE'
    });
    setAttr(age, 'src', assets + (e.done || g.ready ? 'logic-machine.png' : AGE_IMG[e.age]));
    if (fab && g.ready !== ready0) {                        // the button takes on Symbolic's face when it wakes
      ready0 = g.ready;
      setStyle(fab, 'fontFamily', g.ready ? STRATA[2].font : '');
      setStyle(fab, 'fontSize', g.ready ? '21px' : '');
    }

    // the hands lever + refine
    setStyle(hands, 'display', e.flags.o_materials ? '' : 'none');
    setStyle(ref, 'display', e.flags.o_scriptorium ? '' : 'none');
    const rec = (c.leverFloor + c.leverSwing * e.lever) * (1 + c.commBonus * e.commRec);
    const frg = (c.leverFloor + c.leverSwing * (1 - e.lever)) * (1 + c.commBonus * e.commForge);
    setTxt(hA, rec.toFixed(2) + '×'); setTxt(hB, frg.toFixed(2) + '×');
    setStyle(hA, 'color', resHue('marks')); setStyle(hB, 'color', resHue('metal'));
    const sv = String(Math.round((1 - e.lever) * 100));
    if (slider.value !== sv && doc.activeElement !== slider) slider.value = sv;
    setTxt(fLab, 'REFINE · Lv ' + e.refine);
    setTxt(fEff, '+' + Math.round(e.refine * c.refineBonus * 100) + '% all output');
    const rc = refineCost(c, e.refine, 1);
    setTxt(fBuy, fmt(rc) + ' ore');
    const rOk = (st.stocks.ore || 0) >= rc;
    setDis(fBuy, !rOk); setCls(fBuy, 'buy ref-buy' + (rOk ? ' ok' : ''));

    // research: tiles reveal along their chain, cost chips light one requirement at a time
    let ready = 0, have = 0;
    for (const d of c.disco) {
      const T = tiles[d.id];
      const done = !!e.disco[d.id];
      if (done) have++;
      const show = !done && discoVisible(sim, d);
      setStyle(T.el, 'display', show ? '' : 'none');
      if (!show) continue;
      const ok = canDisco(sim, d);
      if (ok) ready++;
      for (const ch of T.chips) setCls(ch.el, 'chip-c' + ((st.stocks[ch.res] || 0) >= ch.amount ? ' met' : '') + (ch.hold ? ' hold' : ''));
      setDis(T.buy, !ok); setCls(T.buy, 'buy d-buy' + (ok ? ' ok' : ''));
    }
    setTxt(rBadge, String(ready));
    setCls(rBadge, 'sb-n' + (ready ? ' hot' : ''));
    setTxt(dCount, have + ' / ' + c.disco.length);

    // the commission: it sits beside the goal, and it never moves anything the player is aiming at
    if (e.comm) {
      const def = c.comms[e.comm.i];
      const hue = resHue(e.comm.res);
      setCls(comm, 'comm show');
      setHTML(cmNeed, '<b>' + fmt(e.comm.need) + '</b> ' + e.comm.res);
      setStyle(cmNeed, 'color', hue);
      setTxt(cmName, def.name);
      setTxt(cmRew, rewardOf(def.reward));
      setStyle(cmFill, 'width', Math.max(0, (e.comm.t / c.commDur) * 100).toFixed(1) + '%');
      const afford = (st.stocks[e.comm.res] || 0) >= e.comm.need;
      setTxt(cmYes, 'FULFILL');
      setDis(cmYes, !afford);
      setCls(cmYes, 'buy cm-yes' + (afford ? ' ok' : ''));
    } else setCls(comm, 'comm');

    // plates: a node that has not been unlocked owns no pipes, so it shows no plate either
    const made = world.plates && world.plates.made;
    if (made) {
      for (const id of st.nodeOrder) {
        const P = made[id];
        if (!P) continue;
        const n = st.nodes[id];
        const hide = n.locked || HIDDEN_PLATES.indexOf(id) >= 0;
        setStyle(P.el, 'visibility', hide ? 'hidden' : 'visible');
      }
    }
  }

  function rewardOf(kind) {
    const p = Math.round(c.commBonus * 100);
    if (kind === 'rec') return '+' + p + '% Record';
    if (kind === 'forge') return '+' + p + '% Forge';
    return '+2 Scribes · +2 Miners';
  }

  return { sync, onVerb, onGoal, toggleResearch: () => setOpen(!open) };
}

export default createOriginsView;
