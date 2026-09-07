// WO-06: the rupture fx against a stub document. Proves both paths run (full and reduced motion), that the
// turn paints the strata below violet, and that cancel() leaves no node behind.
import { rupture, operated } from '../render/fx.js';
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import foundation from '../engine/eras/foundation.js';
import surface from '../engine/eras/surface.js';

/** the smallest document the fx can be honest against: nodes, a head, a body and one frame clock */
function stubDoc() {
  const mk = (tag) => {
    const n = {
      tag, className: '', id: '', textContent: '', style: {}, children: [], parentNode: null,
      classList: { list: {}, add(c) { this.list[c] = 1; }, remove(c) { delete this.list[c]; }, has(c) { return !!this.list[c]; } },
      appendChild(c) { c.parentNode = n; n.children.push(c); return c; },
      removeChild(c) { const i = n.children.indexOf(c); if (i >= 0) n.children.splice(i, 1); c.parentNode = null; return c; },
      setAttribute() {},
      querySelectorAll(sel) { const out = []; (function walk(x) { for (const k of x.children) { if (('.' + k.className).indexOf(sel) === 0) out.push(k); walk(k); } })(n); return out; }
    };
    return n;
  };
  const doc = mk('#document');
  doc.head = mk('head'); doc.body = mk('body');
  doc.appendChild(doc.head); doc.appendChild(doc.body);
  doc.createElement = mk;
  doc.getElementById = (id) => (id === 'world' ? canvas : null);
  const canvas = mk('canvas');
  let now = 0;
  const frames = [];
  doc.defaultView = {
    performance: { now: () => now },
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {}
  };
  doc.__step = (ms) => { now += ms; const q = frames.splice(0, frames.length); for (const f of q) f(); };
  return doc;
}
function stubWorld() {
  const hooks = {};
  return {
    operated: new Set(), camera: { x: 590, y: 350, zoom: 0.88 },
    onDraw: (k, fn) => { hooks[k] = fn; }, lockTo: function (n) { this.locked = n; }, locked: 5, hooks
  };
}
function stubHud(doc) {
  const root = doc.createElement('div'); doc.body.appendChild(root);
  const rail = doc.createElement('div'); root.appendChild(rail);
  for (const name of ['SCALE', 'CAPABILITY']) { const c = doc.createElement('div'); c.className = 'clab'; c.textContent = name; rail.appendChild(c); }
  const railRight = doc.createElement('div'); rail.appendChild(railRight);
  const plateLayer = doc.createElement('div'); root.appendChild(plateLayer);
  return { root, rail, railRight, plateLayer };
}
function mkSim() {
  const sim = createSim({ cfg, eras: [origins, foundation, surface], seed: 5 });
  sim.state.stocks.capability = 500;
  sim.openEra(5);
  sim.state.stocks.scale = cfg.e5.emergeScale + 5;
  sim.tick(0.1);
  return sim;
}

export async function run(t) {
  const doc = stubDoc(), world = stubWorld(), hud = stubHud(doc), sim = mkSim();
  t.ok(sim.state.flags.emerged && !!sim.eras[6], 'the fixture is past the turn');

  const before = doc.body.children[0].children.length;
  const fx = rupture({ world, hud, sim, audio: null, reduced: false, doc });
  t.eq([...world.operated].sort(), [1, 2, 3, 4], 'the four strata below draw in its violet');
  t.ok(!!world.hooks.rupture, 'the tear draws inside the world, not over it');
  const upperHidden = sim.state.nodeOrder.filter((id) => sim.state.nodes[id].era === 6).every((id) => sim.state.nodes[id].hidden);
  t.ok(upperHidden, 'nothing of its stratum is drawn before the layer arrives');

  doc.__step(600);            // 0.6s in: the chips have claimed themselves
  t.ok(hud.rail.querySelectorAll('.clab').some((c) => c.textContent === 'MINE'), 'the rail chips read MINE for a beat');
  t.ok(world.camera.zoom <= 0.88, 'the camera pulls back to frame the ceiling it opens');

  // the draw hook must survive a frame with a real 2d-ish context
  let rects = 0;
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
    rect() { rects++; }, fillRect() {}, strokeRect() {},
    createLinearGradient() { return { addColorStop() {} }; }
  };
  world.hooks.rupture(ctx, world.camera, { w: 1280, h: 800 }, 'full');
  t.ok(rects > 0, 'the pipes carry counter-particles while it turns');

  doc.__step(3000);           // past the end: it cleans up after itself
  t.ok(sim.state.nodeOrder.filter((id) => sim.state.nodes[id].era === 6).every((id) => !sim.state.nodes[id].hidden), 'the layer is visible once it has arrived');
  t.ok(world.locked === 6, 'the camera ends on its stratum');
  t.ok(hud.rail.querySelectorAll('.clab').every((c) => c.textContent !== 'MINE'), 'the chips go back to being yours');
  fx.cancel();
  t.eq(doc.body.children[0].children.length, before, 'the wash it added is gone');
  t.eq(hud.railRight.children.length, 0, 'cancel takes the sixth key with it: no node left behind');

  // reduced motion: a crossfade instead of the jitter and the tear
  {
    const d2 = stubDoc(), w2 = stubWorld(), h2 = stubHud(d2), s2 = mkSim();
    const n0 = d2.body.children[0].children.length;
    const fx2 = rupture({ world: w2, hud: h2, sim: s2, audio: null, reduced: true, doc: d2 });
    d2.__step(400);
    t.ok(w2.locked === 6 && [...w2.operated].length === 4, 'the reduced path still arrives at its stratum, in violet');
    d2.__step(400);
    fx2.cancel();
    t.eq([d2.body.children[0].children.length, h2.railRight.children.length], [n0, 0], 'the reduced path leaves nothing behind either');
  }

  // the operated class the shell toggles for the strata below
  operated(true, doc);
  t.ok(doc.body.classList.has('operated'), 'the operated class goes on the body');
  operated(false, doc);
  t.ok(!doc.body.classList.has('operated'), 'and comes off again');
}
