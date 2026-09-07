// WO-01 extra acceptance: routing detail, palette integrity, particle math, canvas draw counts,
// and the BUILD-ONCE proof (60 frames with unchanged state must write nothing to the DOM).
// A tiny DOM shim lets the plate/HUD builders run in plain node; render/*.js still touches no global.
import { route, particleCount, pipeLength, pointAt, particlePositions, drawPipe, RISER_LEFT, RISER_RIGHT } from '../render/pipes.js';
import { fitStratum, fitColumn, lodFor, stratumAt, worldPosOf, pipeEnds, NODE_INSET, createWorld } from '../render/world.js';
import { STRATA, RES, blend, mix, alpha, stratumHue, resGlyph, BORDER_BLEND } from '../render/palette.js';
import { createPlates } from '../render/nodes.js';
import { createHud, setTxt, setHTML, setDis, domWrites, resetWrites, fmt, fmtRate } from '../render/hud.js';
import { STRATUM_H, stratumTop } from '../engine/types.js';

/* ---------- a minimal DOM shim: only what hud.js and nodes.js actually use ---------- */
function makeDoc() {
  const doc = {
    createElement(tag) { return makeEl(tag, doc); },
    defaultView: { devicePixelRatio: 1, performance: { now: () => 0 } }
  };
  return doc;
}
function makeEl(tag, doc) {
  const el = {
    tagName: tag, ownerDocument: doc, className: '', id: '', disabled: false,
    textContent: '', innerHTML: '', children: [], attrs: {}, listeners: {},
    style: { setProperty(k, v) { this[k] = v; } },
    clientWidth: 1280, clientHeight: 713,
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(k, fn) { (this.listeners[k] = this.listeners[k] || []).push(fn); },
    closest() { return null; },
    classList: { add() {}, remove() {}, contains() { return false; } },
    get firstChild() { return this.children[0]; }
  };
  return el;
}
function fakeCtx() {
  const c = { calls: { fill: 0, stroke: 0, rect: 0 }, lineWidth: 1, fillStyle: '', strokeStyle: '', lineJoin: '', lineCap: '', font: '', textAlign: '', textBaseline: '' };
  ['beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'save', 'restore', 'translate', 'scale', 'setTransform', 'fillRect', 'fillText', 'strokeRect'].forEach(k => { c[k] = () => {}; });
  c.rect = () => { c.calls.rect++; };
  c.fills = [];
  c.fill = () => { c.calls.fill++; c.fills.push(c.fillStyle); };
  c.stroke = () => { c.calls.stroke++; };
  c.createLinearGradient = () => ({ addColorStop() {} });
  return c;
}

/* ---------- a sim-shaped stub, the same surface dev.html builds ---------- */
function stubSim() {
  const state = {
    v: 1, seed: 1, rng: { s: 1 }, t: 0, era: 1, maxEra: 1, mute: false,
    stocks: { marks: 100, ore: 50, knowledge: 10 }, rates: { marks: 2, ore: 1, knowledge: 0.5 },
    nodes: {}, nodeOrder: [], edges: [], resources: {}, flags: {}, eras: {}, log: [], legacy: null
  };
  const add = (d) => { const n = Object.assign({ inputs: [], outputs: [], count: 1, paused: false, mult: {}, tags: [] }, d); state.nodes[n.id] = n; state.nodeOrder.push(n.id); return n; };
  add({ id: 'a.marks', era: 1, kind: 'store', name: 'marks', res: 'marks', pos: { x: 570, y: 130 } });
  add({ id: 'a.scribe', era: 1, kind: 'source', name: 'Scribe', outputs: [{ res: 'marks', rate: 0.9 }], pos: { x: 330, y: 130 }, count: 4 });
  add({ id: 'a.script', era: 1, kind: 'converter', name: 'Scriptorium', inputs: [{ res: 'marks', rate: 2 }], outputs: [{ res: 'knowledge', rate: 0.5 }], pos: { x: 810, y: 130 }, count: 2, cost: { res: 'marks', base: 40, growth: 1.15 } });
  add({ id: 'b.rules', era: 2, kind: 'store', name: 'rules', res: 'rules', pos: { x: 570, y: 130 } });
  state.edges.push({ from: 'a.scribe', to: 'a.marks', res: 'marks', flow: 3.6, riser: false });
  state.edges.push({ from: 'a.marks', to: 'a.script', res: 'marks', flow: 4, riser: false });
  return {
    state, node: (id) => state.nodes[id], stock: (r) => state.stocks[r] || 0, rate: (r) => state.rates[r] || 0,
    muted: () => false, can: () => true, apply: () => ({ ok: true }),
    goal: () => ({ progress: 0.5, ready: false, label: '50%' })
  };
}

export async function run(t) {
  /* ---------- import purity: the renderer must load with no globals present ---------- */
  t.ok(typeof globalThis.document === 'undefined' && typeof globalThis.window === 'undefined',
    'render modules import cleanly with no document/window in scope');

  /* ---------- palette ---------- */
  const KEYS = ['bg', 'panel', 'line', 'edge', 'text', 'dim', 'dimmer', 'accent', 'good', 'danger', 'tease', 'font', 'body', 'mono'];
  let full = true;
  for (let n = 1; n <= 6; n++) for (const k of KEYS) if (!STRATA[n] || !STRATA[n][k]) full = false;
  t.ok(full, 'palette: STRATA 1..6 each carry the full v4 key set');
  const wantRes = ['marks', 'ore', 'knowledge', 'metal', 'silicon', 'rules', 'inference', 'axioms', 'data', 'insight', 'capability', 'scale'];
  t.ok(wantRes.every(r => RES[r] && /^#[0-9a-f]{6}$/i.test(RES[r].hue) && RES[r].glyph), 'palette: all 12 resources have a hue and a glyph');
  t.eq(mix('#000000', '#ffffff', 0.5), '#808080', 'palette: mix blends midway');
  t.eq(alpha('#ff0000', 0.5), 'rgba(255,0,0,0.5)', 'palette: alpha emits rgba');
  t.eq(stratumHue(2), STRATA[2].accent, 'palette: stratumHue is the stratum accent');
  // seams: inside the band the bg is exact; within BORDER_BLEND of a seam it has moved toward the neighbour
  const mid1 = blend(1, stratumTop(1) + STRATUM_H / 2);
  t.eq(mid1, STRATA[1].bg, 'blend: the middle of a stratum is its own background');
  t.ok(blend(1, stratumTop(1) + 2) !== STRATA[1].bg, 'blend: the top seam of stratum 1 leans toward stratum 2');
  t.ok(blend(2, stratumTop(2) + STRATUM_H - 2) !== STRATA[2].bg, 'blend: the bottom seam of stratum 2 leans toward stratum 1');
  t.eq(blend(1, stratumTop(1) + STRATUM_H - 2), STRATA[1].bg, 'blend: bedrock has no stratum below to blend into');
  t.ok(BORDER_BLEND === 60, 'blend: the seam is the SPEC 60 world px');

  /* ---------- routing ---------- */
  const left = route({ x: 800, y: 2900 }, { x: 300, y: 2200 }, { riser: true });
  t.ok(left.some(p => p.x >= RISER_LEFT.lo && p.x <= RISER_LEFT.hi), 'route: a target left of x 400 takes the left riser channel');
  const right = route({ x: 300, y: 2900 }, { x: 800, y: 2200 }, { riser: true });
  t.ok(right.some(p => p.x >= RISER_RIGHT.lo && p.x <= RISER_RIGHT.hi), 'route: any other cross-stratum edge takes the right channel');
  const jogged = route({ x: 100, y: 100 }, { x: 500, y: 200 }, { jog: 40 });
  t.eq(jogged[1].x, 340, 'route: jog offsets the vertical leg so parallel pipes separate');
  const flat = route({ x: 100, y: 100 }, { x: 500, y: 100 });
  t.ok(flat.length >= 3 && flat.every(p => p.y === 100), 'route: a straight run still returns a polyline');
  const fanned = route({ x: 300, y: 2900 }, { x: 800, y: 2200 }, { riser: true, jog: 999 });
  t.ok(fanned.every(p => p.x <= RISER_RIGHT.hi), 'route: a fanned riser stays inside its channel');

  /* ---------- particles ---------- */
  const poly = route({ x: 0, y: 0 }, { x: 400, y: 0 });
  t.near(pipeLength(poly), 400, 0.001, 'pipeLength: sums the axis-aligned segments');
  t.near(pointAt(poly, 100).x, 100, 0.001, 'pointAt: walks the polyline by arc length');
  t.near(pointAt(poly, 9999).x, 400, 0.001, 'pointAt: clamps past the end');
  t.eq(particlePositions(poly, 4, 0).length, 8, 'particlePositions: one dot per 0.5 units/s');
  t.eq(particlePositions(poly, 0, 0).length, 0, 'particlePositions: an idle pipe carries nothing');
  const p0 = particlePositions(poly, 4, 0)[0], p1 = particlePositions(poly, 4, 0.1)[0];
  t.ok(p1.x > p0.x, 'particlePositions: the phase advances with time');
  t.ok(particleCount(19.9) === 40 && particleCount(21) === 40, 'particleCount: the cap holds at 40');

  const ctx = fakeCtx();
  const drawn = drawPipe(ctx, poly, '#e6d2a4', 4, 0, 'full', {});
  t.eq(drawn, 8, 'drawPipe: reports the particles it drew');
  t.ok(ctx.calls.stroke === 1, 'drawPipe: the track is one stroked path');
  const c2 = fakeCtx(); drawPipe(c2, poly, '#e6d2a4', 4, 0, 'silhouette', {});
  t.eq(c2.calls.stroke, 0, 'drawPipe: silhouette LOD draws particles only, no track');
  const c3 = fakeCtx(); const nStarved = drawPipe(c3, poly, '#e6d2a4', 4, 0, 'full', { starved: true });
  t.eq(nStarved, 8, 'drawPipe: a starved pipe still reports its full particle count');
  t.ok(c3.fills.some(f => /255,\s*59|ff3b53/i.test(String(f))), 'drawPipe: a starved pipe paints its mouth red');
  t.ok(!ctx.fills.some(f => /255,\s*59|ff3b53/i.test(String(f))), 'drawPipe: a healthy pipe paints nothing red');

  /* ---------- camera ---------- */
  t.eq(stratumAt(stratumTop(3) + 10), 3, 'stratumAt: maps a world y back to its stratum');
  t.eq(stratumAt(stratumTop(6) + 10), 6, 'stratumAt: the surface layer sits above Foundation');
  t.eq(worldPosOf({ era: 2, pos: { x: 570, y: 130 } }), { x: 570, y: stratumTop(2) + 130 }, 'worldPosOf: lifts a stratum-local anchor into world space');
  const col = fitColumn(1, 3, { w: 1280, h: 713 });
  t.ok(col.zoom <= 0.55 && col.zoom >= 0.18, 'fitColumn: zoom within [0.18, 0.55]; the overview forces the silhouette read itself');
  t.near(col.y, (stratumTop(3) + stratumTop(1) + STRATUM_H) / 2, 0.01, 'fitColumn: centres on the built column');
  t.ok(fitStratum(5, { w: 400, h: 300 }).zoom >= 0.18, 'fitStratum: never zooms below the camera floor');
  const ends = pipeEnds({ era: 1, pos: { x: 330, y: 130 } }, { era: 1, pos: { x: 810, y: 130 } });
  t.eq(ends[0].x, 330 + NODE_INSET, 'pipeEnds: pulls the start back to the node body');
  t.eq(ends[1].x, 810 - NODE_INSET, 'pipeEnds: pulls the end back to the node body');
  const close = pipeEnds({ era: 1, pos: { x: 500, y: 0 } }, { era: 1, pos: { x: 560, y: 300 } });
  t.eq(close[0].x, 500, 'pipeEnds: neighbours closer than two insets keep their centres');

  /* ---------- hud setters ---------- */
  const doc = makeDoc(); const el = makeEl('div', doc);
  resetWrites();
  setTxt(el, 'a'); setTxt(el, 'a'); setTxt(el, 'b');
  t.eq(domWrites.txt, 2, 'setTxt: writes only when the value changed');
  setHTML(el, '<b>x</b>'); setHTML(el, '<b>x</b>');
  t.eq(domWrites.html, 1, 'setHTML: writes only when the markup changed');
  setDis(el, true); setDis(el, true); setDis(el, false);
  t.eq(domWrites.dis, 2, 'setDis: writes only when the disabled state changed');
  t.eq(fmt(1234), '1234', 'fmt: hundreds and up read as whole numbers');
  t.eq(fmt(12345), '12k', 'fmt: ten thousand and up compacts');
  t.eq(fmtRate(2.5), '+2.50/s', 'fmtRate: a positive rate carries its sign');
  t.eq(fmtRate(-2.5), '-2.50/s', 'fmtRate: a negative rate keeps the minus');

  /* ---------- BUILD-ONCE: 60 frames, unchanged state, zero DOM writes ---------- */
  const sim = stubSim();
  const layer = makeEl('div', doc);
  const cam = { x: 590, y: stratumTop(1) + 350, zoom: 0.88 };
  const vpt = { w: 1280, h: 713 };
  const toScreen = (w) => ({ x: (w.x - cam.x) * cam.zoom + vpt.w / 2, y: (w.y - cam.y) * cam.zoom + vpt.h / 2 });
  const plates = createPlates(layer, sim, { worldPos: worldPosOf, toScreen, buyN: () => 1, milestone: () => null });
  plates.update(cam, vpt, 'full', 1);
  t.eq(layer.children.length, 3, 'plates: one plate per node of the locked stratum, created once');
  resetWrites();
  for (let i = 0; i < 60; i++) plates.update(cam, vpt, 'full', 1);
  const total = domWrites.txt + domWrites.html + domWrites.dis + domWrites.attr + domWrites.style;
  t.eq(total, 0, 'BUILD-ONCE: 60 idle frames write nothing to the DOM');
  t.eq(layer.children.length, 3, 'BUILD-ONCE: 60 idle frames create no new elements');
  // a real change still lands, and only once
  sim.state.nodes['a.script'].count = 3;
  resetWrites(); plates.update(cam, vpt, 'full', 1);
  const afterChange = domWrites.txt + domWrites.html + domWrites.dis + domWrites.attr + domWrites.style;
  t.ok(afterChange > 0, 'BUILD-ONCE: a real change does write');
  resetWrites(); plates.update(cam, vpt, 'full', 1);
  t.eq(domWrites.txt + domWrites.html + domWrites.dis + domWrites.attr + domWrites.style, 0, 'BUILD-ONCE: the frame after a change is idle again');
  // below plate LOD the plates go away rather than being rebuilt
  plates.update(cam, vpt, 'glyph', 1);
  t.eq(plates.count, 0, 'plates: nothing counts as shown below plate LOD');
  t.eq(layer.children.length, 3, 'plates: hiding does not destroy the elements');

  /* ---------- the HUD frame builds once too ---------- */
  const root = makeEl('div', doc);
  const hud = createHud(root, {});
  const rail = [{ id: 'marks', value: 100, rate: 2 }, { id: 'ore', value: 50, rate: -1 }];
  hud.setRail(rail); hud.renderVerbs([{ name: 'inscribe', label: 'Inscribe', yield: '+1 marks' }]);
  hud.renderGoal({ progress: 0.5, ready: false, label: '50%', name: 'Logic Machine' });
  const before = root.children.length;
  resetWrites();
  for (let i = 0; i < 30; i++) { hud.setRail(rail); hud.renderVerbs([{ name: 'inscribe', label: 'Inscribe', yield: '+1 marks' }]); hud.renderGoal({ progress: 0.5, ready: false, label: '50%', name: 'Logic Machine' }); }
  t.eq(domWrites.txt + domWrites.html + domWrites.dis + domWrites.attr + domWrites.style, 0, 'BUILD-ONCE: 30 idle HUD refreshes write nothing');
  t.eq(root.children.length, before, 'BUILD-ONCE: idle HUD refreshes create no elements');
  t.ok(resGlyph('marks').length > 0, 'palette: every rail chip has a glyph to draw');

  /* ---------- createWorld boots against the shim without a real canvas ---------- */
  const canvas = makeEl('canvas', doc); canvas.getContext = () => fakeCtx(); canvas.width = 1280; canvas.height = 713;
  const docKeys = [];
  doc.addEventListener = (k, fn) => { if (k === 'keydown') docKeys.push(fn); };
  const w2 = createWorld({ canvas, hud: makeEl('div', doc), sim, reduced: true });
  w2.lockTo(1, false);
  const st = w2.frame(0.016);
  t.ok(st.particles > 0, 'createWorld: a frame draws the particles the edges are carrying');
  t.eq(w2.locked, 1, 'createWorld: lockTo sets the locked stratum');
  w2.overview(false);
  t.ok(w2.isOverview && w2.lod === 'silhouette', 'createWorld: overview drops to the silhouette read (forced while in overview)');
  w2.lockTo(2, false);
  t.ok(!w2.isOverview && w2.locked === 2, 'createWorld: locking to a stratum leaves the overview');
  t.ok(w2.camera.zoom > 0.6, 'createWorld: a locked stratum sits at plate LOD');
  // reduced motion: a lock with animate=true must land at once, no easing frames
  w2.lockTo(1, true);
  t.ok(w2.camera.zoom > 0.6 && Math.abs(w2.camera.y - (stratumTop(1) + STRATUM_H / 2)) < 0.01, 'reduced motion: lockTo lands immediately, no easing');
  const before2 = w2.frame(0.016).particles;
  t.ok(before2 > 0, 'reduced motion: particles still draw');
  // Escape from the overview returns to the locked stratum
  t.ok(docKeys.length === 1, 'createWorld: one keydown handler is registered on the document');
  w2.overview(false);
  t.ok(w2.isOverview, 'overview: entered');
  docKeys[0]({ key: 'Escape' });
  t.ok(!w2.isOverview && w2.locked === 1, 'Escape from the overview returns to the locked stratum');
  const z0 = w2.camera.zoom;
  docKeys[0]({ key: '-' });
  t.ok(w2.camera.zoom < z0, 'the minus key zooms out');
  docKeys[0]({ key: '=' });
  t.ok(w2.camera.zoom > 0.18, 'the equals key zooms back in');
}
