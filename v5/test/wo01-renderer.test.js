// WO-01 acceptance: the PURE parts of the renderer (routing, camera math, LOD, particle density) run in node.
// render/*.js must not touch document/window at import time (only inside createWorld / factories).
import { route, particleCount } from '../render/pipes.js';
import { fitStratum, lodFor, worldToScreen, screenToWorld } from '../render/world.js';
import { STRATUM_H, WORLD_W } from '../engine/types.js';
export async function run(t) {
  // orthogonal routing: a polyline of axis-aligned segments from a to b, leaving a horizontally, entering b horizontally
  const p = route({ x: 100, y: 300 }, { x: 500, y: 380 });
  t.ok(Array.isArray(p) && p.length >= 3, 'route: returns a polyline');
  let ortho = true; for (let i = 1; i < p.length; i++) if (p[i].x !== p[i - 1].x && p[i].y !== p[i - 1].y) ortho = false;
  t.ok(ortho, 'route: every segment is axis-aligned (Manhattan)');
  t.ok(p[0].x === 100 && p[0].y === 300 && p[p.length - 1].x === 500 && p[p.length - 1].y === 380, 'route: starts at a, ends at b');
  // risers: a cross-stratum route goes through the riser channel x∈[960,1000] (right) when the target is above
  const r = route({ x: 700, y: 4 * STRATUM_H + 100 }, { x: 500, y: 3 * STRATUM_H + 100 }, { riser: true });
  t.ok(r.some(pt => pt.x >= 960 && pt.x <= 1000), 'route: riser edges pass through the right riser channel (x 960–1000)');
  // particle density: 1 per 0.5 units/s, cap 40, 0 when idle
  t.ok(particleCount(0) === 0 && particleCount(0.5) === 1 && particleCount(10) === 20 && particleCount(1000) === 40, 'particleCount: 1 per 0.5/s, capped at 40, 0 idle');
  // camera: fitStratum(n, viewport) frames the stratum at zoom ≈ 1 with 50px margins
  const cam = fitStratum(1, { w: 1280, h: 713 });
  t.ok(cam.zoom > 0.85 && cam.zoom <= 1.0, 'fitStratum: zoom ~1 for a 1280×713 viewport');
  const tl = worldToScreen({ x: 0, y: 4 * STRATUM_H }, cam, { w: 1280, h: 713 }), br = worldToScreen({ x: WORLD_W, y: 5 * STRATUM_H }, cam, { w: 1280, h: 713 });
  t.ok(tl.x >= 0 && tl.y >= 0 && br.x <= 1280 && br.y <= 713, 'fitStratum: the whole stratum is inside the viewport');
  const back = screenToWorld(tl, cam, { w: 1280, h: 713 }); t.near(back.x, 0, 0.01, 'screenToWorld inverts worldToScreen (x)'); t.near(back.y, 4 * STRATUM_H, 0.01, 'screenToWorld inverts worldToScreen (y)');
  // LOD thresholds from SPEC
  t.ok(lodFor(1) === 'full' && lodFor(0.59) === 'glyph' && lodFor(0.25) === 'silhouette' && lodFor(0.6) === 'full', 'lodFor: full ≥0.6, glyph <0.6, silhouette ≤0.25');
}
