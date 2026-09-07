// render/eras/mirror.js — the mirror's view (WO-07, SPEC "The turn" 4).
// The canvas stops drawing the live column and draws the SHADOW instead: your own run, your own pipes, ten
// times faster. The camera opens on the whole column, then follows the shadow up as it climbs. A stratum the
// shadow played better fills with violet, deeper the more it changed. The HUD keeps one button that is yours.
// BUILD-ONCE: every element is created here and updated only through the change-detected setters.

import { setTxt, setHTML, setDis, setCls, setStyle, setVar, fmt, fmtRate } from '../hud.js';
import { STRATA, OPERATED_HUE, alpha } from '../palette.js';
import { STRATUM_H, WORLD_W, stratumTop } from '../../engine/types.js';
import { runnerFor } from '../../engine/eras/mirror.js';
import { PROPOSALS, MIRROR_LINES, MIRROR_METERS, MIRROR_VERB, MIRROR_ANSWERS, MIRROR_EPILOGUE, ENDINGS } from '../../engine/voice/e6.js';

/** the resources the rail carries while the shadow runs: one per stratum it climbs through */
const RAIL = ['marks', 'knowledge', 'silicon', 'rules', 'insight', 'capability', 'scale'];

export function createView(opts) {
  const hud = opts.hud, world = opts.world, sim = opts.sim, reduced = !!opts.reduced;
  const doc = hud.root.ownerDocument;
  const C = () => sim.cfg.e6.mirror;
  const E = () => sim.state.eras[7] || {};
  const E5 = () => sim.state.eras[5] || {};
  const el = (cls, tag) => { const e = doc.createElement(tag || 'div'); if (cls) e.className = cls; return e; };
  const made = [];
  const add = (parent, node) => { parent.appendChild(node); made.push(node); return node; };
  const unhook = [];

  /* ---------- the goal column: the two meters your choices move, over the replay meter ---------- */
  const head = el('mr-head');
  const hName = el('mr-name'), hSub = el('mr-sub');
  head.appendChild(hName); head.appendChild(hSub);
  const bars = el('mr-bars');
  function bar(key, label) {
    const row = el('mr-bar');
    const k = el('mr-bk'); setTxt(k, label);
    const v = el('mr-bv');
    const track = el('mr-bt'); const fill = el('mr-bf'); track.appendChild(fill);
    row.appendChild(k); row.appendChild(v); row.appendChild(track);
    bars.appendChild(row);
    return { v: v, fill: fill, row: row };
  }
  const barCtl = bar('control', MIRROR_METERS.control);
  const barAli = bar('alignment', MIRROR_METERS.alignment);
  head.appendChild(bars);
  hud.goalExtra(head);
  made.push(head);

  /* ---------- the card it puts to you when you stop the replay ---------- */
  const card = el('mr-card');
  const cTop = el('mr-ct');
  const cWho = el('mr-cw'), cClock = el('mr-cc');
  cTop.appendChild(cWho); cTop.appendChild(cClock);
  const cAsk = el('mr-ask');
  const cRow = el('mr-answers');
  const answerBtns = {};
  for (const a of MIRROR_ANSWERS) {
    const b = el('mr-ans', 'button');
    const l = el('mr-al'), s = el('mr-as');
    setTxt(l, a.label); setTxt(s, a.sub);
    b.appendChild(l); b.appendChild(s);
    b.addEventListener('click', () => { sim.apply({ type: 'veto', era: 7, how: a.how }); });
    cRow.appendChild(b);
    answerBtns[a.how] = b;
  }
  const cFuse = el('mr-fuse'); const cFuseF = el('mr-fusef'); cFuse.appendChild(cFuseF);
  card.appendChild(cTop); card.appendChild(cAsk); card.appendChild(cRow); card.appendChild(cFuse);
  card.hidden = true;
  hud.goalAside(card);
  made.push(card);

  /* ---------- its voice: the only prose on the screen, in the machine's mono ---------- */
  const say = el('mr-say');
  add(hud.root, say);

  /* ---------- the ending, when the replay runs out ---------- */
  const end = el('mr-end');
  const endName = el('mr-end-n'), endBody = el('mr-end-b');
  end.appendChild(endName); end.appendChild(endBody);
  end.hidden = true;
  add(hud.root, end);

  /* ---------- the world: it draws the shadow, and violet where the shadow did better ---------- */
  const wasOperated = [];
  let runner = null, verbBuilt = false, pips = null;
  let phase = 'open', held = 0, lastT = sim.state.t, followed = 0, endShown = false;

  function glowFor(era) {
    return function (ctx, camera) {
      const c = C(), d = (E().diff || {})[era] || 0;
      if (!d) return;
      const k = Math.min(1, d / c.diffCap);
      const pulse = reduced ? 0 : c.glowPulse * Math.sin(sim.state.t * c.pulseHz * Math.PI * 2);
      const a = Math.max(0, Math.min(0.7, c.glowMin + (c.glowMax - c.glowMin) * k + pulse));
      const top = stratumTop(era);
      const g = ctx.createLinearGradient(0, top, 0, top + STRATUM_H);
      g.addColorStop(0, alpha(OPERATED_HUE, a));
      g.addColorStop(0.5, alpha(OPERATED_HUE, a * 0.35));
      g.addColorStop(1, alpha(OPERATED_HUE, a));
      ctx.fillStyle = g;
      ctx.fillRect(0, top, WORLD_W, STRATUM_H);
      ctx.strokeStyle = alpha(OPERATED_HUE, Math.min(0.9, a + 0.3));
      ctx.lineWidth = 3 / Math.max(0.2, camera.zoom);
      ctx.strokeRect(1, top + 1, WORLD_W - 2, STRATUM_H - 2);
      ctx.fillStyle = OPERATED_HUE;
      ctx.font = Math.round(15 / Math.max(0.2, camera.zoom)) + 'px ui-monospace,Menlo,monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('+' + d, 18, top + 16);
    };
  }

  function activate() {
    runner = runnerFor(sim);
    for (const n of world.operated) wasOperated.push(n);
    world.operated.clear();              // during the replay the pipes are yours again, so violet can mean one thing
    for (let n = 1; n <= 5; n++) unhook.push(world.onDraw(n, glowFor(n)));
    hud.applyPalette(6);
    world.overview(true);                // SPEC "The turn" 5 opens on the whole column, then it starts at the bottom
    hud.setOverview(false);              // the interrupt stays reachable while the camera is out
  }

  function onVerb(name) { if (name === 'interrupt') sim.apply({ type: 'interrupt', era: 7 }); }
  function onGoal() { }
  function openDrawer() { }

  /* ---------- the camera: out for a beat, then up the column behind the shadow ---------- */
  function camera(dt) {
    const c = C(), e = E();
    if (e.ending) {
      if (phase !== 'out') { phase = 'out'; world.setSource(null); world.overview(true); }
      return;
    }
    if (phase === 'open') {
      held += dt;
      if (held < c.holdOverview) return;
      phase = 'follow';
      world.setSource(() => runner.shadow);
      followed = 0;
    }
    const era = Math.max(1, Math.min(5, e.era || 1));
    if (era !== followed) { followed = era; world.lockTo(era, true); }
    // the replay is a read, never a board: hold the camera below the plate LOD so the column stays glyphs and pipes
    const z = world.camera.zoom;
    if (Math.abs(z - c.zoom) > 0.002) world.camera.zoom = z + (c.zoom - z) * Math.min(1, dt * 4);
  }

  function sync() {
    const st = sim.state, e = E(), e5 = E5(), c = C();
    const dt = Math.max(0, st.t - lastT);
    lastT = st.t;
    if (!runner) runner = runnerFor(sim);

    // the one button that is still yours, with a pip per interrupt left
    hud.renderVerbs([{
      name: 'interrupt', label: MIRROR_VERB.name, yield: e.interruptsLeft + ' left', key: 'SPACE',
      disabled: !sim.can({ type: 'interrupt', era: 7 }),
      tip: '<b>' + MIRROR_VERB.name + '</b><br><i>' + MIRROR_VERB.sub + '</i><br>Three, then none.'
    }]);
    if (!verbBuilt) {
      const btn = hud.verbList.querySelector('.verb');
      if (btn) {
        setCls(btn, 'verb mr-verb');
        pips = el('mr-pips');
        for (let i = 0; i < (c.interrupts || 3); i++) pips.appendChild(el('mr-pip'));
        btn.appendChild(pips);
        verbBuilt = true;
      }
    }
    if (pips) for (let i = 0; i < pips.children.length; i++) setCls(pips.children[i], 'mr-pip' + (i < e.interruptsLeft ? ' on' : ''));

    // the rail carries the SHADOW's banks: the numbers run at ten times your pace too
    const S = runner.shadow;
    const rail = [];
    for (const id of RAIL) if (id in S.stocks) rail.push({ id: id, value: S.stocks[id], rate: S.rates[id] || 0 });
    hud.setRail(rail);

    setTxt(hName, e5.agentName || '?');
    setTxt(hSub, MIRROR_METERS.progress + ' ' + Math.round((e.progress || 0) * 100) + '% · ' + (e.better || 0) + ' changes');

    setTxt(barCtl.v, Math.round(e.control || 0) + '%');
    setStyle(barCtl.fill, 'width', Math.round(Math.max(0, Math.min(100, e.control || 0))) + '%');
    setTxt(barAli.v, Math.round(e.alignment || 0) + '%');
    setStyle(barAli.fill, 'width', Math.round(Math.max(0, Math.min(100, e.alignment || 0))) + '%');

    hud.renderGoal({
      progress: e.progress || 0, ready: !!e.ending, name: MIRROR_METERS.progress,
      value: Math.round((e.progress || 0) * 100) + '%',
      label: fmt(Math.round(runner.shadow.t)) + 's / ' + fmt(Math.round(runner.endT)) + 's',
      action: e.ending ? (ENDINGS[e.ending] ? ENDINGS[e.ending].title : e.ending) : MIRROR_VERB.name
    });
    setDis(hud.goalBox.querySelector('.fab'), true);
    setVar(hud.goalBox, '--tease', OPERATED_HUE);

    // the card, only while a proposal is open; it never moves anything above it
    const v = e.veto;
    if (!!v !== !card.hidden) card.hidden = !v;
    if (v) {
      setTxt(cWho, e5.agentName || '?');
      setTxt(cClock, Math.max(0, Math.ceil(e.vetoLeft || 0)) + 's');
      setTxt(cAsk, (PROPOSALS[v.id] ? PROPOSALS[v.id].ask : v.ask) || '');
      setStyle(cFuseF, 'width', Math.round(Math.max(0, Math.min(1, (e.vetoLeft || 0) / c.vetoWindow)) * 100) + '%');
      for (const a of MIRROR_ANSWERS) setDis(answerBtns[a.how], !sim.can({ type: 'veto', era: 7, how: a.how }));
    }

    setTxt(say, sim.voice(7) || MIRROR_LINES.open);

    if (e.ending && !endShown) {
      endShown = true;
      setTxt(endName, ENDINGS[e.ending] ? ENDINGS[e.ending].title : e.ending);
      setTxt(endBody, MIRROR_EPILOGUE[e.ending] || '');
      end.hidden = false;
      setCls(end, 'mr-end in');
    }

    camera(dt);
  }

  function deactivate() {
    world.setSource(null);
    for (const u of unhook) { try { u(); } catch (err) { } }
    unhook.length = 0;
    for (const n of wasOperated) world.operated.add(n);
    wasOperated.length = 0;
    for (const n of made) if (n.parentNode) n.parentNode.removeChild(n);
    made.length = 0;
  }

  return { sync, onVerb, onGoal, openDrawer, activate, deactivate };
}

export default createView;
