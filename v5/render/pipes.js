// render/pipes.js — orthogonal pipe routing + flow-driven particles (WO-01).
// Pure geometry + one canvas draw call. No DOM at import time.
// SPEC: track drawn in the resource hue at 30%, particles at 100%, 120 world-px/s,
// density = 1 particle per 0.5 units/s capped at 40, zero when idle; a starved mouth blinks red.

import { alpha } from './palette.js';

export const RISER_RIGHT = { lo: 960, hi: 1000 };  // the right riser channel (SPEC "The world")
export const RISER_LEFT = { lo: 200, hi: 240 };    // the left channel, used when the target sits left of x 400
export const PARTICLE_SPEED = 120;                 // world px per second, constant
export const PARTICLES_PER_UNIT = 0.5;             // one particle per 0.5 units/s of flow
export const PARTICLE_CAP = 40;
export const CORNER_R = 10;

const mid = (ch) => (ch.lo + ch.hi) / 2;

/**
 * route(a, b, opts) — a Manhattan polyline from a to b.
 * Default: leave a horizontally, one vertical jog at the x midpoint, enter b horizontally.
 * opts.riser: cross-stratum. Run out to a riser channel, up or down it, then in to b.
 * The channel is the right one (x 960-1000) unless b sits left of x 400, which takes the left one.
 * @returns {{x:number,y:number}[]}
 */
export function route(a, b, opts) {
  const o = opts || {};
  if (o.riser) {
    const ch = b.x < 400 ? RISER_LEFT : RISER_RIGHT;
    const rx = mid(ch);
    return dedupe([{ x: a.x, y: a.y }, { x: rx, y: a.y }, { x: rx, y: b.y }, { x: b.x, y: b.y }]);
  }
  // opts.jog nudges the vertical leg so parallel pipes read as separate roads rather than one thick line
  const mx = (a.x + b.x) / 2 + (o.jog || 0);
  return dedupe([{ x: a.x, y: a.y }, { x: mx, y: a.y }, { x: mx, y: b.y }, { x: b.x, y: b.y }]);
}

/** drop repeats but keep at least 3 points so a straight run still reads as a routed pipe */
function dedupe(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i], q = out[out.length - 1];
    if (p.x !== q.x || p.y !== q.y) out.push(p);
  }
  if (out.length < 3) {
    const a = out[0], b = out[out.length - 1];
    out.splice(1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }
  return out;
}

/** particleCount(flowPerSec) — density follows flow; idle pipes carry nothing */
export function particleCount(flow) {
  if (!(flow > 0)) return 0;
  return Math.min(PARTICLE_CAP, Math.max(1, Math.round(flow / PARTICLES_PER_UNIT)));
}

/** total length of a polyline in world units */
export function pipeLength(poly) {
  let d = 0;
  for (let i = 1; i < poly.length; i++) d += Math.abs(poly[i].x - poly[i - 1].x) + Math.abs(poly[i].y - poly[i - 1].y);
  return d;
}

/** the point at arc-length `dist` along the polyline (clamped to the ends) */
export function pointAt(poly, dist) {
  let left = dist;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1], b = poly[i];
    const seg = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (seg <= 0) continue;
    if (left <= seg) { const k = left / seg; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }
    left -= seg;
  }
  const last = poly[poly.length - 1];
  return { x: last.x, y: last.y };
}

/** trace a rounded-corner polyline into the current path (call between beginPath and stroke) */
export function tracePipe(ctx, poly, radius) {
  const r = radius === undefined ? CORNER_R : radius;
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length - 1; i++) ctx.arcTo(poly[i].x, poly[i].y, poly[i + 1].x, poly[i + 1].y, r);
  const end = poly[poly.length - 1];
  ctx.lineTo(end.x, end.y);
}

/**
 * particlePositions — where the dots sit this instant. Evenly spaced along the polyline,
 * phase advancing at PARTICLE_SPEED so the motion reads as one direction of travel.
 */
export function particlePositions(poly, flow, tSec) {
  const n = particleCount(flow);
  if (!n) return [];
  const len = pipeLength(poly);
  if (len <= 0) return [];
  const gap = len / n;
  const phase = ((tSec * PARTICLE_SPEED) % gap + gap) % gap;
  const out = [];
  for (let i = 0; i < n; i++) out.push(pointAt(poly, phase + i * gap));
  return out;
}

/**
 * drawPipe — track at 30%, particles at 100%.
 * lod 'full' draws rounded track + round dots; 'glyph' thins the track; 'silhouette' draws particles only.
 * opts.starved blinks the last particle (the one at the mouth) red.
 * @returns {number} particles drawn, for world.stats
 */
export function drawPipe(ctx, poly, hue, flow, tSec, lod, opts) {
  const o = opts || {};
  const silhouette = lod === 'silhouette';
  // px keeps stroke and dot sizes constant in SCREEN pixels while the ctx is scaled by the camera
  const px = o.pxScale || 1;
  if (!silhouette) {
    ctx.strokeStyle = alpha(hue, 0.3);
    ctx.lineWidth = (lod === 'glyph' ? 1.5 : 3) * px;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); tracePipe(ctx, poly, lod === 'glyph' ? 6 : CORNER_R); ctx.stroke();
  }
  const pts = particlePositions(poly, flow, tSec);
  if (!pts.length) return 0;
  const size = (silhouette ? 3.2 : (lod === 'glyph' ? 3.4 : 4.4)) * px;
  const upto = o.starved ? pts.length - 1 : pts.length;
  // a soft halo pass under the cores so a moving particle reads at any zoom (batched: two fills total)
  ctx.fillStyle = alpha(hue, 0.22);
  ctx.beginPath();
  for (let i = 0; i < upto; i++) ctx.rect(pts[i].x - size, pts[i].y - size, size * 2, size * 2);
  ctx.fill();
  ctx.fillStyle = hue;
  ctx.beginPath();
  for (let i = 0; i < upto; i++) ctx.rect(pts[i].x - size / 2, pts[i].y - size / 2, size, size);
  ctx.fill();
  if (o.starved) {
    const last = pts[pts.length - 1];
    const on = Math.floor(tSec * 3) % 2 === 0;  // a 3Hz blink at the starved mouth
    ctx.fillStyle = on ? '#ff3b53' : alpha('#ff3b53', 0.25);
    ctx.beginPath();
    ctx.rect(last.x - size, last.y - size, size * 2, size * 2);
    ctx.fill();
  }
  return pts.length;
}
