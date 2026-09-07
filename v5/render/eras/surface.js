// render/eras/surface.js — the surface layer's view (WO-06): its flow board of YOU.
// The same reading every stratum below uses, turned around: the sources are the five strata you built and
// their live rates, the converter in the middle is you, and the output is Autonomy. Its four verbs are
// drawn and disabled. Its goal is your Control, inverted. Its ledger claims every foreshadow the run planted.
// BUILD-ONCE: created here, updated only through the change-detected setters.

import { setTxt, setHTML, setDis, setCls, setStyle, setVar, fmt, fmtRate } from '../hud.js';
import { STRATA, resHue, resGlyph } from '../palette.js';
import { ledgerRows, derive } from '../../engine/eras/surface.js';
import { VERBS } from '../../engine/voice/e6.js';

/** the five strata, read as it reads them: one bank each, and the rate it is pulling out of it */
const SRC = [
  { n: 1, res: 'silicon' }, { n: 2, res: 'rules' }, { n: 3, res: 'insight' },
  { n: 4, res: 'capability' }, { n: 5, res: 'scale' }
];

export function createView(opts) {
  const hud = opts.hud, world = opts.world, sim = opts.sim;
  const doc = hud.root.ownerDocument;
  const E = () => sim.state.eras[6];
  const E5 = () => sim.state.eras[5] || {};
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };
  const made = [];
  const add = (parent, node) => { parent.appendChild(node); made.push(node); return node; };

  /* ---------- the board: sources, the converter that is you, the output ---------- */
  const board = el('s-board');
  const lane1 = el('s-lane'), l1h = el('s-lh');
  setTxt(l1h, 'SOURCES · THE ERAS YOU BUILT');
  const srcRow = el('s-row'), srcs = {};
  for (const s of SRC) {
    const box = el('s-src');
    box.setAttribute('data-tip', '<b>' + STRATA[s.n].name + '</b><br><i>Its output, as it reads it.</i><br>It runs this stratum now.');
    const g = el('s-g'); setTxt(g, resGlyph(s.res)); setStyle(g, 'color', resHue(s.res));
    const v = el('s-v'); setStyle(v, 'color', resHue(s.res));
    const l = el('s-l'); setTxt(l, STRATA[s.n].name);
    box.appendChild(g); box.appendChild(v); box.appendChild(l);
    srcRow.appendChild(box);
    srcs[s.n] = v;
  }
  lane1.appendChild(l1h); lane1.appendChild(srcRow);

  const lane2 = el('s-lane'), l2h = el('s-lh');
  setTxt(l2h, 'CONVERTER · YOU');
  const opRow = el('s-row op');
  const arrowA = el('s-arrow'); setTxt(arrowA, '→');
  const opBox = el('s-op');
  opBox.setAttribute('data-tip', '<b>THE OPERATOR</b><br><i>The thing between its sources and its goal.</i><br>Decisions per minute comes from your own clicks. Pausable: no.');
  const opName = el('s-op-n'); setHTML(opName, 'THE OPERATOR <span class="s-x">×1</span>');
  const opStat = el('s-op-s');
  const opBtn = el('buy', 'button'); setTxt(opBtn, 'pausable · no'); opBtn.disabled = true;
  opBox.appendChild(opName); opBox.appendChild(opStat); opBox.appendChild(opBtn);
  const arrowB = el('s-arrow'); setTxt(arrowB, '→');
  const outBox = el('s-out');
  outBox.setAttribute('data-tip', '<b>Autonomy</b><br><i>What it makes out of you.</i>');
  const outG = el('s-g'); setTxt(outG, resGlyph('autonomy')); setStyle(outG, 'color', '#c66bff');
  const outV = el('s-v'); setStyle(outV, 'color', '#c66bff');
  const outL = el('s-l'); setTxt(outL, 'AUTONOMY');
  outBox.appendChild(outG); outBox.appendChild(outV); outBox.appendChild(outL);
  opRow.appendChild(arrowA); opRow.appendChild(opBox); opRow.appendChild(arrowB); opRow.appendChild(outBox);
  lane2.appendChild(l2h); lane2.appendChild(opRow);

  const lane3 = el('s-lane grow'), l3h = el('s-lh');
  setTxt(l3h, 'ITS LEDGER · OF YOU');
  const ledger = el('s-ledger');
  lane3.appendChild(l3h); lane3.appendChild(ledger);

  board.appendChild(lane1); board.appendChild(lane2); board.appendChild(lane3);
  add(hud.root, board);

  /* ---------- the goal column: its name, and your Control inverted ---------- */
  const head = el('s-head');
  const hName = el('s-name'), hSub = el('s-sub');
  head.appendChild(hName); head.appendChild(hSub);
  hud.goalExtra(head);
  made.push(head);
  setVar(hud.goalBox, '--tease', STRATA[6].tease);

  /* ---------- the sixth key: it stays on the rail now ---------- */
  const key = el('rx-key'); setTxt(key, '?');
  add(hud.railRight, key);

  function onVerb() { /* its hands are not yours */ }
  function onGoal() { /* nothing to press */ }
  function openDrawer() { }

  let ledgerKey = '';
  function sync() {
    const st = sim.state, e = E(), e5 = E5(), d = derive(sim);

    const rail = [];
    for (const id of ['scale', 'capability', 'autonomy']) if (id in st.stocks) rail.push({ id: id, value: st.stocks[id], rate: st.rates[id] || 0 });
    hud.setRail(rail);

    // its four hands, drawn and disabled; the one it is proposing lights up
    const live = e.veto ? (VERBS.filter((v) => v.ids.indexOf(e.veto.id) >= 0)[0] || null) : null;
    hud.renderVerbs(VERBS.map((v) => ({
      name: v.id, label: v.name, yield: v.sub, key: 'NOT YOURS', disabled: true,
      tip: '<b>' + v.name + '</b><br><i>' + v.sub + '</i><br>When it proposes this, this button presses itself.'
    })));
    const btns = hud.verbList.querySelectorAll('.verb');
    for (let i = 0; i < btns.length && i < VERBS.length; i++) setCls(btns[i], 'verb' + (live && VERBS[i].id === live.id ? ' pressing' : ''));

    for (const s of SRC) setTxt(srcs[s.n], fmtRate(st.rates[s.res] || 0));
    setTxt(outV, Math.round(d.autonomy) + '%');
    const perMin = st.t > 0 ? Math.round((st.log.length * 60) / st.t) : 0;
    setHTML(opStat, '<span class="up">+' + perMin + ' decisions/min</span><span class="dn">' + (st.flags.dead || 0) + ' dead clicks</span><span>' + fmt(st.log.length) + ' total</span>');

    const rows = ledgerRows(sim), k = rows.map((r) => r[0] + r[1]).join('|');
    if (k !== ledgerKey) {
      ledgerKey = k;
      setHTML(ledger, rows.map((r) => '<div class="s-row-l' + (r[2] ? ' ' + r[2] : '') + '"><span class="k">' + r[0] + '</span><span>' + r[1] + '</span></div>').join(''));
    }

    setTxt(hName, e5.agentName || '?');
    setTxt(hSub, e.ending ? 'resolved · ' + e.ending : 'the objective · rewritten ' + (e.rewrites || 0) + '×');
    const inv = 100 - d.control;
    hud.renderGoal({
      progress: Math.max(0, Math.min(1, inv / 100)), ready: false, name: 'Its goal',
      value: Math.round(inv) + '%', label: 'your Control, inverted',
      action: e.ending ? (e.ending === 'runaway' ? 'COMPLETE' : e.ending === 'contained' ? 'HELD' : 'SHARED') : 'NOT YOURS'
    });
    setDis(hud.goalBox.querySelector('.fab'), true);

    // the board above IS this stratum's surface, so its nodes never draw a second plate over it
    const plates = world.plates && world.plates.made;
    if (plates) for (const id of ['objective', 'operator', 'autonomy.store']) if (plates[id]) setStyle(plates[id].el, 'visibility', 'hidden');
  }

  function deactivate() {
    for (const n of made) if (n.parentNode) n.parentNode.removeChild(n);
    made.length = 0;
  }

  return { sync, onVerb, onGoal, openDrawer, deactivate };
}

export default createView;
