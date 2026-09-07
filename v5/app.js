// v5/app.js — boot: one sim over every era module that exists, one world, one HUD, and the view of the active
// stratum. Era engine modules and views are discovered by convention (engine/eras/<name>.js, render/eras/<name>.js)
// so parallel work orders never edit this file. WO-11 hardens it (save, settings, live era switching, routing).
import { createSim } from './engine/sim.js';
import cfg from './engine/cfg.js';
import { createWorld } from './render/world.js';
import { createHud } from './render/hud.js';
import { SCENES } from './scenes/scenes.js';

export const ERA_FILES = ['origins', 'symbolic', 'statistical', 'deep', 'foundation', 'surface', 'mirror'];
const eras = [], viewMods = {};
for (const f of ERA_FILES) {
  try { const m = await import('./engine/eras/' + f + '.js'); if (m && m.default) eras.push(m.default); } catch (e) { /* not built yet */ }
  try { const v = await import('./render/eras/' + f + '.js'); if (v && (v.createView || v.default)) viewMods[f] = v; } catch (e) { /* no view yet */ }
}
eras.sort((a, b) => a.id - b.id);
const byId = {}; for (const e of eras) byId[e.id] = e;
const nameOf = (id) => ERA_FILES[id - 1];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sim = createSim({ cfg: cfg, eras: eras, seed: 1, legacy: null });
const buy = { n: (cfg.e1.buyModes && cfg.e1.buyModes[0]) || 1 };

let view = null;
const hud = createHud(document.getElementById('hud'), {
  onVerb: (n) => view && view.onVerb && view.onVerb(n),
  onGoal: () => view && view.onGoal && view.onGoal()
});
const world = createWorld({
  canvas: document.getElementById('world'), hud: hud.plateLayer, sim: sim, reduced: reduced, hudApi: hud,
  buyN: (node) => (typeof buy.n === 'number' ? buy.n : 1),
  milestone: (n) => { const m = byId[n.era]; return m && m.milestoneOf ? m.milestoneOf(sim, n) : null; },
  starved: (n) => sim.state.edges.some((e) => e.to === n.id && e.starved)
});
world.setHud(hud);

/** the view interface every render/eras/<name>.js exports as createView(opts):
 *  { sync(), onVerb(name), onGoal(), activate?(), deactivate?() } — opts = { hud, world, sim, buy, assets } */
function mountView(eraId) {
  const mod = viewMods[nameOf(eraId)]; if (!mod) return null;
  const make = mod.createView || mod.default;
  const v = make({ hud: hud, world: world, sim: sim, buy: buy, assets: '../assets/', reduced: reduced });
  if (v && v.activate) v.activate();
  return v;
}
/** per-era stylesheet by convention (render/eras/<name>.css); a missing file is fine */
function loadEraCss(eraId) {
  const href = './render/eras/' + nameOf(eraId) + '.css';
  if (document.querySelector('link[data-era-css="' + href + '"]')) return;
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; link.setAttribute('data-era-css', href);
  link.onerror = () => link.remove();
  document.head.appendChild(link);
}

const scene = (location.hash.match(/scene=([\w-]+)/) || [])[1] || '';
function applyScene(name) {
  const f = SCENES[name];
  if (f) f(sim);
  loadEraCss(sim.state.era);
  view = mountView(sim.state.era);                       // the active stratum's view (one per page load for now)
  world.scene(name || '');                               // overview / bench handling
  if (!/overview/.test(name)) world.lockTo(sim.state.era, false);
  if (view && view.openDrawer) view.openDrawer(name);    // a scene may ask the view to open its drawer (research, experiments, architecture)
  else if (/research/.test(name) && view && view.toggleResearch) view.toggleResearch();
  if (view && view.sync) view.sync();
}
applyScene(scene);
if (world.titleCard) world.titleCard(sim.state.era);   // WO-11 owns the title-card system; this is its seam

document.addEventListener('keydown', (e) => {
  if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  const m = byId[sim.state.era];
  if (e.code === 'Space') { e.preventDefault(); if (m && m.layout && m.layout.verbs[0] && view && view.onVerb) view.onVerb(m.layout.verbs[0]); }
  else if (e.key === 'q' || e.key === 'Q') { if (m && m.layout && m.layout.verbs[1] && view && view.onVerb) view.onVerb(m.layout.verbs[1]); }
  else if (e.key === 'r' || e.key === 'R') { if (view && view.toggleResearch) view.toggleResearch(); }
  else if (/^[1-6]$/.test(e.key)) { const n = +e.key; if (n <= sim.state.maxEra) world.lockTo(n, true); }
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  sim.tick(dt);
  world.frame(dt);
  if (view && view.sync) view.sync();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/** settle(): let the camera and the plates reach their resting frame before a screenshot */
function settle() {
  for (let i = 0; i < 3; i++) world.frame(0.016);
  if (view && view.sync) view.sync();
  world.frame(0);
}
window.__V5 = { sim, world, hud, get view() { return view; }, scene, settle, applyScene, eras };
