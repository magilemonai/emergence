// v5/app.js — boot for the Origins stratum (WO-02 minimal; WO-11 hardens it with save, settings, routing).
// One sim, one world, one HUD, one view module. The frame loop ticks the sim in real time and draws.

import { createSim } from './engine/sim.js';
import cfg from './engine/cfg.js';
import origins, { milestoneOf } from './engine/eras/origins.js';
import { createWorld } from './render/world.js';
import { createHud } from './render/hud.js';
import { createOriginsView } from './render/eras/origins.js';
import { SCENES } from './scenes/scenes.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sim = createSim({ cfg: cfg, eras: [origins], seed: 1, legacy: null });
const buy = { n: cfg.e1.buyModes[0] };

const hud = createHud(document.getElementById('hud'), {
  onVerb: (n) => view.onVerb(n),
  onGoal: () => view.onGoal()
});
const world = createWorld({
  canvas: document.getElementById('world'), hud: hud.plateLayer, sim: sim, reduced: reduced, hudApi: hud,
  buyN: () => buy.n,
  milestone: (n) => milestoneOf(sim, n),
  starved: (n) => sim.state.edges.some((e) => e.to === n.id && e.starved)
});
world.setHud(hud);
const view = createOriginsView({ hud: hud, world: world, sim: sim, buy: buy, assets: '../assets/' });
if (world.titleCard) world.titleCard(1);     // WO-11 owns the title-card system; this is its seam

const scene = (location.hash.match(/scene=([\w-]+)/) || [])[1] || '';
function applyScene(name) {
  const f = SCENES[name];
  if (f) f(sim);
  world.scene(name || 'origins-1');
  if (/research/.test(name)) view.toggleResearch();
  view.sync();
}
applyScene(scene);

document.addEventListener('keydown', (e) => {
  if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === 'Space') { e.preventDefault(); view.onVerb('inscribe'); }
  else if (e.key === 'q' || e.key === 'Q') view.onVerb('quarry');
  else if (e.key === 'r' || e.key === 'R') view.toggleResearch();
  else if (e.key === '1') world.lockTo(1, true);
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  sim.tick(dt);
  world.frame(dt);
  view.sync();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/** settle(): let the camera and the plates reach their resting frame before a screenshot */
function settle() {
  for (let i = 0; i < 3; i++) world.frame(0.016);
  view.sync();
  world.frame(0);
}
window.__V5 = { sim, world, hud, view, scene, settle, applyScene };
