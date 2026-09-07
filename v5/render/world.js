// render/world.js: the single zoomable canvas world (WO-01).
// Strata stack upward as bands with blended seams; pipes carry particles; nodes draw by LOD;
// DOM plates ride the world in screen space. The page never scrolls: the world pans instead.
// Pure camera math is exported for the node tests; nothing here touches document at import time.

import { STRATUM_H, WORLD_W, stratumTop } from '../engine/types.js';
import { STRATA, BORDER_BLEND, blend, stratumHue, resHue, alpha, OPERATED_HUE } from './palette.js';
import { route, drawPipe } from './pipes.js';
import { drawNodeGlyph, createPlates } from './nodes.js';

export const ZOOM_MIN = 0.15, ZOOM_MAX = 1.4;   // 0.15 lets a six-stratum column fit 1280x800 in the reveal (needs 0.163)
export const LOD_PLATE = 0.6, LOD_SILHOUETTE = 0.25;
export const FIT_MARGIN = 50;     // world px of breathing room around a locked stratum
export const LOCK_MS = 400;

/** lodFor(zoom): full plates at 0.6 and up, canvas glyphs below, a silhouette column at 0.25 and under */
export function lodFor(zoom) {
  if (zoom <= LOD_SILHOUETTE) return 'silhouette';
  if (zoom < LOD_PLATE) return 'glyph';
  return 'full';
}

/** camera {x,y,zoom} names the WORLD point under the centre of the viewport */
export function worldToScreen(p, cam, vp) {
  return { x: (p.x - cam.x) * cam.zoom + vp.w / 2, y: (p.y - cam.y) * cam.zoom + vp.h / 2 };
}
export function screenToWorld(p, cam, vp) {
  return { x: (p.x - vp.w / 2) / cam.zoom + cam.x, y: (p.y - vp.h / 2) / cam.zoom + cam.y };
}

/** fitStratum(n, viewport): frame one stratum whole, with FIT_MARGIN of margin on the tight axis */
export function fitStratum(n, vp) {
  const zx = (vp.w - FIT_MARGIN * 2) / WORLD_W;
  const zy = (vp.h - FIT_MARGIN * 2) / STRATUM_H;
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min(zx, zy)));
  return { x: WORLD_W / 2, y: stratumTop(n) + STRATUM_H / 2, zoom };
}

/** fitColumn(lo..hi, viewport): the overview: the whole built column in one frame */
const OVERVIEW_ZOOM_MAX = 0.55;
export function fitColumn(lo, hi, vp) {
  const top = stratumTop(hi), bot = stratumTop(lo) + STRATUM_H, h = bot - top;
  // a short column (one or two strata) may fit larger than the silhouette threshold; the overview forces the
  // silhouette read regardless of zoom (see frame()), so the column never turns into a postage stamp
  const zoom = Math.max(ZOOM_MIN, Math.min(OVERVIEW_ZOOM_MAX, Math.min((vp.w - 80) / WORLD_W, (vp.h * 0.78) / h)));
  return { x: WORLD_W / 2, y: (top + bot) / 2, zoom };
}

/** a node's WORLD position: its stratum-local anchor lifted by that stratum's top */
export function worldPosOf(node) { return { x: node.pos.x, y: stratumTop(node.era) + node.pos.y }; }

/** roughly half a plate, in world units at lock zoom: pipes stop at the plate edge instead of vanishing under it */
export const NODE_INSET = 96;
/** the two points a pipe should actually join, pulled back to the node bodies */
export function pipeEnds(A, B) {
  const a = worldPosOf(A), b = worldPosOf(B);
  const dx = b.x - a.x;
  if (Math.abs(dx) <= NODE_INSET * 2) return [a, b];
  const s = dx > 0 ? 1 : -1;
  return [{ x: a.x + s * NODE_INSET, y: a.y }, { x: b.x - s * NODE_INSET, y: b.y }];
}

/** which stratum contains a world y (null above the surface layer or below bedrock) */
export function stratumAt(y) {
  for (let n = 6; n >= 1; n--) { const t = stratumTop(n); if (y >= t && y < t + STRATUM_H) return n; }
  return null;
}

const easeOut = (k) => 1 - Math.pow(1 - k, 3);

/**
 * createWorld({canvas, hud, sim, reduced}): the frame loop's engine room.
 * Returns { camera, frame(dtReal), lockTo(n, animate), overview(), plates, stats, scene(name) }.
 */
export function createWorld(opts) {
  const canvas = opts.canvas, hud = opts.hud, sim = opts.sim;
  const reduced = !!opts.reduced;
  const doc = canvas.ownerDocument, win = doc.defaultView;
  const ctx = canvas.getContext('2d');

  const camera = { x: WORLD_W / 2, y: stratumTop(1) + STRATUM_H / 2, zoom: 0.9 };
  const state = { locked: 1, over: false, tSec: 0, anim: null, drag: null };
  const stats = { particles: 0, frameMs: 0, plates: 0, lod: 'full' };
  const routeCache = new Map();
  // render source: what the canvas draws. Live play draws sim.state; the mirror and the film hand in another State
  // (a shadow replay, a film frame) through setSource(fn). Camera locks and goals still read the live sim.
  let srcFn = null;
  const S = () => (srcFn ? (srcFn() || sim.state) : sim.state);
  function setSource(fn) { srcFn = typeof fn === 'function' ? fn : null; routeCache.clear(); }
  const operated = new Set();   // era numbers whose pipes draw violet: the agent runs them now (fx.rupture fills it)

  function vp() { return { w: canvas.clientWidth || 1280, h: canvas.clientHeight || 800 }; }
  function strataRange() {
    let hi = 1, surface = false;
    for (const id of S().nodeOrder) {
      const e = S().nodes[id].era;
      if (e === 6) surface = true; else if (e > hi) hi = e;
    }
    return { lo: 1, hi: surface ? 6 : hi };
  }

  // ---------- camera moves ----------
  function goTo(target, animate) {
    if (reduced || animate === false) { camera.x = target.x; camera.y = target.y; camera.zoom = target.zoom; state.anim = null; return; }
    state.anim = { from: { x: camera.x, y: camera.y, zoom: camera.zoom }, to: target, k: 0 };
  }
  function lockTo(n, animate) {
    state.locked = n; state.over = false;
    if (hudApi) hudApi.setOverview(false);
    if (hudApi) hudApi.applyPalette(n);
    goTo(fitStratum(n, vp()), animate);
  }
  function overview(animate) {
    state.over = true;
    if (hudApi) hudApi.setOverview(true);
    const r = strataRange();
    goTo(fitColumn(r.lo, r.hi, vp()), animate);
  }
  function zoomAt(factor, sx, sy) {
    const v = vp(), before = screenToWorld({ x: sx, y: sy }, camera, v);
    camera.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.zoom * factor));
    const after = screenToWorld({ x: sx, y: sy }, camera, v);
    camera.x += before.x - after.x; camera.y += before.y - after.y;
    state.anim = null;
    if (hudApi) { const o = camera.zoom <= LOD_SILHOUETTE; if (o !== state.over) { state.over = o; hudApi.setOverview(o); } }
  }

  // ---------- input ----------
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(Math.pow(0.999, e.deltaY), e.clientX, e.clientY);
  }, { passive: false });

  canvas.addEventListener('pointerdown', (e) => {
    if (camera.zoom < 1 || state.over) { state.drag = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!state.drag) return;
    const dx = e.clientX - state.drag.x, dy = e.clientY - state.drag.y;
    state.drag.moved += Math.abs(dx) + Math.abs(dy);
    camera.x -= dx / camera.zoom; camera.y -= dy / camera.zoom;
    state.drag.x = e.clientX; state.drag.y = e.clientY; state.anim = null;
  });
  canvas.addEventListener('pointerup', (e) => {
    const d = state.drag; state.drag = null;
    if (state.over && (!d || d.moved < 6)) {          // a click in the overview locks to that stratum
      const w = screenToWorld({ x: e.clientX, y: e.clientY }, camera, vp());
      const n = stratumAt(w.y);
      if (n) lockTo(n, true);
    }
  });
  doc.addEventListener('keydown', (e) => {
    const v = vp();
    if (e.key === '-') zoomAt(0.82, v.w / 2, v.h / 2);
    else if (e.key === '=' || e.key === '+') zoomAt(1.22, v.w / 2, v.h / 2);
    else if (e.key === 'Escape' && state.over) lockTo(state.locked, true);
  });

  // ---------- drawing ----------
  function drawStrata(v) {
    const r = strataRange();
    for (let n = 1; n <= 6; n++) {
      if (n > r.hi && n !== 6) continue;   // never draw a stratum the run has not reached
      if (n === 6 && r.hi < 6) continue;
      const top = stratumTop(n), bot = top + STRATUM_H;
      const a = worldToScreen({ x: 0, y: top }, camera, v), b = worldToScreen({ x: WORLD_W, y: bot }, camera, v);
      if (b.y < -40 || a.y > v.h + 40) continue;
      const p = STRATA[n];
      const g = ctx.createLinearGradient(0, a.y, 0, b.y);
      const k = BORDER_BLEND / STRATUM_H;
      g.addColorStop(0, blend(n, top));
      g.addColorStop(k, p.bg);
      g.addColorStop(1 - k, p.bg);
      g.addColorStop(1, blend(n, bot - 1));
      ctx.fillStyle = g;
      ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      // a soft crown of the stratum's own hue so the column reads as five distinct strata at any zoom
      const glow = ctx.createLinearGradient(0, a.y, 0, a.y + (b.y - a.y) * 0.5);
      glow.addColorStop(0, alpha(p.accent, 0.09)); glow.addColorStop(1, alpha(p.accent, 0));
      ctx.fillStyle = glow; ctx.fillRect(a.x, a.y, b.x - a.x, (b.y - a.y) * 0.5);
      // the riser channels, faintly, so the reach-back has a visible road
      ctx.fillStyle = alpha(p.line, 0.5);
      const chW = 40 * camera.zoom;
      ctx.fillRect(worldToScreen({ x: 960, y: top }, camera, v).x, a.y, chW, b.y - a.y);
      ctx.fillRect(worldToScreen({ x: 200, y: top }, camera, v).x, a.y, chW, b.y - a.y);
    }
    // one outline around the whole column: the world is ONE object
    const r0 = worldToScreen({ x: 0, y: stratumTop(r.hi) }, camera, v);
    const r1 = worldToScreen({ x: WORLD_W, y: stratumTop(r.lo) + STRATUM_H }, camera, v);
    ctx.strokeStyle = alpha(stratumHue(state.locked), state.over ? 0.5 : 0.16);
    ctx.lineWidth = state.over ? 2 : 1;
    ctx.strokeRect(r0.x, r0.y, r1.x - r0.x, r1.y - r0.y);
  }

  function polyFor(edge) {
    const key = edge.from + '>' + edge.to;
    let poly = routeCache.get(key);
    if (!poly) {
      const A = S().nodes[edge.from], B = S().nodes[edge.to];
      if (!A || !B) return null;
      let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
      const jog = ((h % 7) - 3) * 11;   // a stable per-edge offset, so bundles fan out
      const ends = pipeEnds(A, B);
      poly = route(ends[0], ends[1], { riser: !!edge.riser || A.era !== B.era, jog });
      routeCache.set(key, poly);
    }
    return poly;
  }

  function drawPipes(v, lod) {
    let n = 0;
    ctx.save();
    ctx.translate(v.w / 2 - camera.x * camera.zoom, v.h / 2 - camera.y * camera.zoom);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.lineWidth = 1;
    for (const edge of S().edges) {
      const poly = polyFor(edge); if (!poly) continue;
      const s0 = worldToScreen(poly[0], camera, v), s1 = worldToScreen(poly[poly.length - 1], camera, v);
      const lo = Math.min(s0.y, s1.y), hi = Math.max(s0.y, s1.y);
      if (hi < -60 || lo > v.h + 60) continue;                 // cull whole pipes off screen
      const src = S().nodes[edge.from];
      const hue = operated.size && src && operated.has(src.era) ? OPERATED_HUE : resHue(edge.res);
      n += drawPipe(ctx, poly, hue, edge.flow, state.tSec, lod, { starved: !!edge.starved, pxScale: 1 / camera.zoom });
    }
    ctx.restore();
    return n;
  }

  function drawNodes(v, lod) {
    ctx.save();
    ctx.translate(v.w / 2 - camera.x * camera.zoom, v.h / 2 - camera.y * camera.zoom);
    ctx.scale(camera.zoom, camera.zoom);
    for (const id of S().nodeOrder) {
      const node = S().nodes[id]; if (!node || node.locked || node.hidden) continue;   // locked: nothing pre-laid
      if (lod === 'full' && node.era === state.locked) continue;   // the DOM plate owns the locked stratum
      const p = worldPosOf(node);
      const s = worldToScreen(p, camera, v);
      if (s.x < -140 || s.x > v.w + 140 || s.y < -120 || s.y > v.h + 120) continue;
      const info = node.kind === 'store' ? { stock: S().stocks[node.res] } : (node.kind === 'goal' ? (sim.goal ? sim.goal(node.era) : null) : null);
      drawNodeGlyph(ctx, node, p, lod, info);
    }
    ctx.restore();
  }

  // ---------- the HUD + plates ----------
  let hudApi = opts.hudApi || null;
  const plates = createPlates(hud, sim, {
    worldPos: worldPosOf,
    toScreen: (w) => worldToScreen(w, camera, vp()),
    buyN: opts.buyN || (() => 1),
    starved: opts.starved || null,
    milestone: opts.milestone || null
  });

  /** frame(dtReal): one pass: camera, bands, pipes, nodes, plates */
  function frame(dtReal) {
    const t0 = (win && win.performance) ? win.performance.now() : 0;
    const dt = Math.max(0, Math.min(0.25, dtReal || 0));
    state.tSec += dt;

    const v = vp();
    const dpr = (win && win.devicePixelRatio) || 1;
    if (canvas.width !== Math.round(v.w * dpr) || canvas.height !== Math.round(v.h * dpr)) {
      canvas.width = Math.round(v.w * dpr); canvas.height = Math.round(v.h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (state.anim) {                                  // 400ms ease-out lock
      state.anim.k = Math.min(1, state.anim.k + dt * 1000 / LOCK_MS);
      const k = easeOut(state.anim.k), f = state.anim.from, to = state.anim.to;
      camera.x = f.x + (to.x - f.x) * k; camera.y = f.y + (to.y - f.y) * k; camera.zoom = f.zoom + (to.zoom - f.zoom) * k;
      if (state.anim.k >= 1) state.anim = null;
    }

    const lod = state.over ? 'silhouette' : lodFor(camera.zoom);   // the overview is always the silhouette read
    stats.lod = lod;
    ctx.fillStyle = '#04030a';
    ctx.fillRect(0, 0, v.w, v.h);
    drawStrata(v);
    stats.particles = drawPipes(v, lod);
    drawNodes(v, lod);
    runDrawHooks(v, lod);
    plates.update(camera, v, lod, state.locked);
    stats.plates = plates.count;
    stats.frameMs = ((win && win.performance) ? win.performance.now() : 0) - t0;
    return stats;
  }

  /** scene(name): camera presets the screenshot tool and dev bench address by name */
  function scene(name) {
    if (/overview/.test(name)) { overview(false); state.anim = null; return; }
    // the dev bench names its strata by digit (bench-1); real scenes lock to the sim's era (app.js does that)
    const m = /^bench/.test(name) ? /(\d)/.exec(name) : null;
    if (m) lockTo(+m[1], false);
    else if (sim && sim.state && typeof sim.state.era === 'number') lockTo(Math.min(sim.state.era, 6), false);
    if (/lod/.test(name)) { camera.zoom = 0.5; state.anim = null; }
  }
  // per-stratum draw hooks: era views draw inside the world canvas transform (after pipes and glyphs)
  // Several hooks may share an era (a view's instrument and the legacy layer both draw on stratum 6); each call
  // appends and returns its own unsubscribe, so a view removes only its hook on deactivate. onDraw(era, null) clears all.
  const drawHooks = {};
  function onDraw(era, fn) {
    if (!fn) { delete drawHooks[era]; return () => {}; }
    (drawHooks[era] = drawHooks[era] || []).push(fn);
    return () => { const a = drawHooks[era]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); if (!a.length) delete drawHooks[era]; };
  }
  function runDrawHooks(v, lod) {
    for (const k in drawHooks) {
      const list = drawHooks[k]; if (!list || !list.length) continue;
      ctx.save();
      ctx.translate(v.w / 2 - camera.x * camera.zoom, v.h / 2 - camera.y * camera.zoom);
      ctx.scale(camera.zoom, camera.zoom);
      for (const fn of list) { try { fn(ctx, camera, v, lod); } catch (e) { /* a view's draw error must never kill the frame */ } }
      ctx.restore();
    }
  }

  return {
    camera, frame, lockTo, overview, plates, stats, scene, onDraw,
    operated,                 // Set<era>: pipes of these strata draw OPERATED_HUE (the agent runs them)
    setSource,                // fn() => State | null: draw another State (mirror shadow, film frame); null = live
    get lod() { return state.over ? 'silhouette' : lodFor(camera.zoom); },
    zoomAt, worldPosOf,
    toScreen: (w) => worldToScreen(w, camera, vp()),
    get locked() { return state.locked; },
    get isOverview() { return state.over; },
    setHud(api) { hudApi = api; if (api) { api.applyPalette(state.locked); api.setOverview(state.over); } },
    invalidateRoutes() { routeCache.clear(); }
  };
}
