// render/nodes.js: canvas node glyphs (LOD) + the world-anchored DOM plates (WO-01).
// BUILD-ONCE: one .plate per node of the locked stratum, created once and updated through the
// change-detected setters in hud.js. Nothing here rewrites a live button on a frame.

import { resHue, resGlyph, alpha, STRATA } from './palette.js';
import { setTxt, setDis, setCls, setStyle, fmt, fmtRate } from './hud.js';

export const PLATE_W = 176;   // screen px; the plate is centred on the node's projected position
export const PLATE_H = 72;

/** the size of a node's canvas footprint, by kind */
export function glyphSize(kind) {
  if (kind === 'store') return { w: 84, h: 62 };
  if (kind === 'goal') return { w: 90, h: 90 };
  if (kind === 'source') return { w: 70, h: 56 };
  return { w: 104, h: 62 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * drawNodeGlyph: the node as the world draws it below plate LOD.
 * store   = a rounded well holding the resource glyph and its amount
 * converter = a plate silhouette with the icon glyph and a count
 * source  = a small stacker
 * goal    = a ring meter
 * At 'silhouette' LOD everything collapses to a dim block so the column reads as one shape.
 */
export function drawNodeGlyph(ctx, node, p, lod, info) {
  const pal = STRATA[node.era] || STRATA[1];
  const s = glyphSize(node.kind);
  const x = p.x - s.w / 2, y = p.y - s.h / 2;
  const hue = node.res ? resHue(node.res) : (node.outputs[0] ? resHue(node.outputs[0].res) : pal.accent);

  if (lod === 'silhouette') {
    ctx.fillStyle = alpha(hue, node.count > 0 ? 0.34 : 0.14);
    roundRect(ctx, x, y, s.w, s.h, 8); ctx.fill();
    return;
  }

  if (node.kind === 'goal') {
    const r = s.w / 2 - 6, prog = Math.max(0, Math.min(1, (info && info.progress) || 0));
    ctx.strokeStyle = alpha(pal.dimmer, 0.8); ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = pal.tease; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(p.x, p.y, r, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = pal.text; ctx.font = '600 18px ' + pal.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(prog * 100) + '%', p.x, p.y);
    return;
  }

  // body
  ctx.fillStyle = alpha(pal.panel, 0.94);
  roundRect(ctx, x, y, s.w, s.h, node.kind === 'store' ? 14 : 10); ctx.fill();
  ctx.strokeStyle = node.paused ? pal.danger : (node.count > 0 ? alpha(hue, 0.7) : alpha(pal.line, 0.9));
  ctx.lineWidth = 1.6; ctx.stroke();

  if (node.kind === 'source') { // a small stacker: three bars rising
    ctx.fillStyle = alpha(hue, 0.85);
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 12 + i * 15, y + s.h - 12 - (i + 1) * 8, 10, (i + 1) * 8);
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (node.kind === 'store') {
    ctx.fillStyle = hue; ctx.font = '18px ' + pal.mono;
    ctx.fillText(resGlyph(node.res), p.x, y + 20);
    ctx.fillStyle = pal.text; ctx.font = '600 16px ' + pal.mono;
    ctx.fillText(fmt((info && info.stock) || 0), p.x, y + 43);
  } else {
    ctx.fillStyle = alpha(hue, 0.95); ctx.font = '17px ' + pal.mono;
    ctx.fillText(node.kind === 'converter' ? '⇥' : (node.outputs[0] ? resGlyph(node.outputs[0].res) : '●'), p.x, y + 20);
    ctx.fillStyle = pal.dim; ctx.font = '600 14px ' + pal.mono;
    ctx.fillText('×' + (node.count || 0), p.x, y + 44);
  }
}

/**
 * createPlates(hud, sim, opts): the DOM half of a node.
 * One plate per node of the LOCKED stratum, created once, positioned by translate3d each frame,
 * hidden below zoom 0.6. Buttons dispatch buy / pause actions through sim.apply.
 * opts.worldPos(node) -> {x,y}   opts.toScreen(worldPt) -> {x,y}
 */
export function createPlates(layer, sim, opts) {
  const o = opts || {};
  const doc = layer.ownerDocument;
  const made = {};        // id -> plate parts
  let shownEra = null, count = 0;

  function make(node) {
    const el = doc.createElement('div');
    el.className = 'plate k-' + node.kind;
    const head = doc.createElement('div'); head.className = 'p-head';
    const rate = doc.createElement('b'); rate.className = 'p-rate';          // numbers first
    const name = doc.createElement('span'); name.className = 'p-name';
    const pip = doc.createElement('span'); pip.className = 'mpip';
    head.appendChild(rate); head.appendChild(name); head.appendChild(pip);
    const sub = doc.createElement('div'); sub.className = 'p-sub';
    const res = doc.createElement('span'); res.className = 'p-res';
    const cnt = doc.createElement('span'); cnt.className = 'p-count';
    const io = doc.createElement('span'); io.className = 'p-io';
    sub.appendChild(res); sub.appendChild(cnt); sub.appendChild(io);
    const row = doc.createElement('div'); row.className = 'p-row';
    const buy = doc.createElement('button'); buy.className = 'buy';
    const pause = doc.createElement('button'); pause.className = 'pause'; pause.textContent = '❚❚';
    row.appendChild(buy); row.appendChild(pause);
    el.appendChild(head); el.appendChild(sub); el.appendChild(row);
    if (node.flavor) el.setAttribute('data-tip', '<b>' + node.name + '</b><br><i>' + node.flavor + '</i>' + (node.mech ? '<br>' + node.mech : ''));

    buy.addEventListener('click', () => { sim.apply({ type: 'buy', era: node.era, node: node.id, n: (o.buyN && o.buyN(sim.node(node.id) || node)) || 1 }); });
    pause.addEventListener('click', () => { sim.apply({ type: 'pause', era: node.era, node: node.id, on: !sim.node(node.id).paused }); });

    layer.appendChild(el);
    return made[node.id] = { el, rate, name, pip, res, cnt, io, buy, pause };
  }

  /** a compact draw figure: the io line must never wrap or the plate reflows under the pointer */
  function tight(v) { const n = Math.abs(+v || 0); return n >= 10 ? String(Math.round(n)) : n.toFixed(1); }

  function costOf(node) {
    if (!node.cost) return null;
    const n = (o.buyN && o.buyN(node)) || 1;   // buyN(node): a MAX mode can price per node
    let total = 0;
    for (let i = 0; i < n; i++) total += node.cost.base * Math.pow(node.cost.growth, node.count + i);
    return { res: node.cost.res, amount: total, n };
  }

  /** outputs per second at the current count, for the numbers-first label */
  function outRate(node) {
    if (!node.outputs || !node.outputs.length) return null;
    let m = 1; for (const k in node.mult) m *= node.mult[k];
    const p = node.outputs[0];
    return { res: p.res, per: node.paused ? 0 : p.rate * node.count * m };
  }

  /**
   * update(cam, viewport, lod, era): structure only changes when the locked stratum changes.
   * Everything else is a change-detected write, so an idle frame writes nothing.
   */
  function update(cam, viewport, lod, era) {
    const st = sim.state;
    const list = st.nodeOrder.map(id => st.nodes[id]).filter(n => n && n.era === era);
    if (shownEra !== era) {                     // structural: create the plates this stratum needs
      for (const id in made) setStyle(made[id].el, 'display', 'none');
      list.forEach(n => { if (!made[n.id]) make(n); });
      shownEra = era;
    }
    const hide = lod !== 'full';
    count = 0;
    list.forEach(node => {
      const P = made[node.id] || make(node);
      if (hide || node.locked || node.hidden) { setStyle(P.el, 'display', 'none'); return; }   // a locked node owns no plate (nothing is pre-laid)
      const w = o.worldPos(node), s = o.toScreen(w);
      const on = s.x > -260 && s.x < viewport.w + 260 && s.y > -160 && s.y < viewport.h + 160;
      setStyle(P.el, 'display', on ? '' : 'none');
      if (!on) return;
      count++;
      setStyle(P.el, 'transform', 'translate3d(' + Math.round(s.x - PLATE_W / 2) + 'px,' + Math.round(s.y - PLATE_H / 2) + 'px,0)');

      // numbers first: the mechanical value leads, the name follows, the detail sits on line two
      const out = outRate(node);
      setTxt(P.rate, out ? fmtRate(out.per) : (node.kind === 'store' ? fmt(st.stocks[node.res] || 0) : ''));
      setStyle(P.rate, 'color', out ? resHue(out.res) : (node.res ? resHue(node.res) : ''));
      setTxt(P.name, node.name);
      setTxt(P.res, out ? out.res : '');   // a store already names itself; do not say it twice
      setStyle(P.res, 'color', out ? resHue(out.res) : (node.res ? resHue(node.res) : ''));
      setTxt(P.cnt, node.kind === 'store' ? fmtRate(st.rates[node.res] || 0) : '×' + (node.count || 0));
      // inputs as glyphs so a long draw list still fits one line (color, not text)
      const ins = (node.inputs || []).map(p => '−' + tight(p.rate * node.count) + resGlyph(p.res)).join(' ');
      setTxt(P.io, ins);

      const c = costOf(node);
      const afford = c ? (st.stocks[c.res] || 0) >= c.amount : false;
      setTxt(P.buy, c ? fmt(c.amount) + ' ' + c.res + ' · BUILD' + (c.n > 1 ? ' ×' + c.n : '') : '');
      setStyle(P.buy, 'display', c ? '' : 'none');
      setDis(P.buy, !afford);
      setCls(P.buy, 'buy' + (afford ? ' ok' : ''));

      const starved = !!(o.starved && o.starved(node));
      setCls(P.el, 'plate k-' + node.kind + (afford ? ' can' : '') + (starved ? ' starved' : '') + (node.paused ? ' held' : ''));
      setStyle(P.pause, 'display', node.kind === 'converter' ? '' : 'none');
      setCls(P.pause, 'pause' + (node.paused ? ' on' : ''));

      const next = o.milestone ? o.milestone(node) : null;   // the next count tier, a pip on every plate
      setStyle(P.pip, 'display', next ? '' : 'none');
      if (next) { setTxt(P.pip, '×' + next.at); setCls(P.pip, 'mpip' + (next.near ? ' near' : '') + (next.tiered ? ' tiered' : '')); }
    });
  }

  return { update, made, get count() { return count; } };
}
