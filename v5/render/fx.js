// render/fx.js — world events. One section per work order, each self-contained (no shared helpers), so two
// orders can land in this file without a merge fight.

// WO-06: rupture
import { STRATUM_H, WORLD_W, stratumTop } from '../engine/types.js';
import { STRATA, alpha } from './palette.js';
import { route } from './pipes.js';
import { pipeEnds, worldPosOf } from './world.js';

/** the beats of the turn, in seconds from the first shudder (SPEC "The turn" 1-3) */
const T = { jitter: 1.2, tearAt: 0.3, tearDur: 1.4, tearMax: 96, mineAt: 0.5, mineOff: 2.1, slideAt: 1.5, slideDur: 0.8, riseAt: 2.4, end: 3.4 };
const REDUCED_MS = 600;

/** a stable wobble from the clock alone, so a held frame always draws the same shudder */
function wobble(t, seed) { const x = Math.sin(t * 61.7 + seed * 12.9) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }

/** the same jog the world uses, so a counter-particle rides the pipe the player is looking at */
function jogOf(key) { let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0; return ((h % 7) - 3) * 11; }

/**
 * rupture({world, hud, sim, audio, reduced}): the column shudders, its pipes invert and turn violet, the
 * ceiling of Foundation tears, the surface layer slides in above it, and the camera rises to it.
 * Returns { hold(ms), cancel(), get t() } — hold freezes the clock so a screenshot lands on an exact beat.
 */
export function rupture(opts) {
  const world = opts.world, hud = opts.hud, sim = opts.sim, reduced = !!opts.reduced;
  const doc = opts.doc || hud.root.ownerDocument, win = doc.defaultView;   // opts.doc lets the node test drive a stub
  const canvas = doc.getElementById('world');
  const layer = hud.plateLayer;
  ensureStyle(doc);
  const t0 = win.performance.now();
  let frozen = null, raf = 0, done = false;
  const clock = () => (frozen !== null ? frozen : (win.performance.now() - t0) / 1000);

  if (audioOf(opts)) { try { audioOf(opts).rupture(); } catch (e) { /* audio is never load-bearing */ } }
  for (let n = 1; n <= 4; n++) world.operated.add(n);        // its violet reaches down through every floor

  // its stratum exists in the graph the moment it wakes; nothing of it is drawn until the layer arrives
  const upper = [];
  for (const id of sim.state.nodeOrder) { const n = sim.state.nodes[id]; if (n && n.era === 6) { n.hidden = true; upper.push(n); } }
  const revealUpper = () => { for (const n of upper) n.hidden = false; };

  // the violet wash: a DOM plane so the counter-particles read over the world instead of inside it
  const wash = doc.createElement('div');
  wash.className = 'rx-wash';
  hud.root.appendChild(wash);
  const key = doc.createElement('div');
  key.className = 'rx-key';
  key.textContent = '?';
  hud.railRight.appendChild(key);

  // the rail chips claim themselves for a beat (found late: the rail builds itself on the view's first sync)
  let labs = null, was = null, mine = false;
  function setMine(on) {
    if (!labs || !labs.length) {
      labs = []; was = [];
      const found = hud.rail.querySelectorAll ? hud.rail.querySelectorAll('.clab') : [];
      for (let i = 0; i < found.length; i++) { labs.push(found[i]); was.push(found[i].textContent); }
      if (!labs.length) return;
      mine = false;
    }
    if (mine === on) return;
    mine = on;
    for (let i = 0; i < labs.length; i++) labs[i].textContent = on ? 'MINE' : was[i];
  }

  // the camera pulls back so the ceiling it is about to open is in the frame
  const cam0 = { y: world.camera.y, zoom: world.camera.zoom };
  const camTo = { y: stratumTop(5) + STRATUM_H * 0.32, zoom: Math.min(cam0.zoom, 0.7) };
  function pullBack(t) {
    const k = Math.max(0, Math.min(1, t / 0.5));
    world.camera.y = cam0.y + (camTo.y - cam0.y) * k;
    world.camera.zoom = cam0.zoom + (camTo.zoom - cam0.zoom) * k;
  }

  /* ---------- the canvas half: the tear, the counter-flow, the arriving layer ---------- */
  function draw(ctx) {
    const t = clock();
    const top = stratumTop(5);                       // the ceiling of Foundation: the seam it opens

    // every pipe runs backwards, in its violet
    if (t < T.end) {
      const hue = STRATA[6].good;
      ctx.fillStyle = hue;
      ctx.beginPath();
      let drawn = 0;
      for (const e of sim.state.edges) {
        if (drawn > 40) break;
        const A = sim.state.nodes[e.from], B = sim.state.nodes[e.to];
        if (!A || !B) continue;
        drawn++;
        const ends = pipeEnds(A, B);
        const poly = route(ends[0], ends[1], { riser: !!e.riser || A.era !== B.era, jog: jogOf(e.from + '>' + e.to) });
        let len = 0;
        for (let i = 1; i < poly.length; i++) len += Math.abs(poly[i].x - poly[i - 1].x) + Math.abs(poly[i].y - poly[i - 1].y);
        if (!(len > 0)) continue;
        for (let p = 0; p < 6; p++) {
          let d = len - ((t * 220 + (p * len) / 6) % len);   // backwards along the pipe, fast
          for (let i = 1; i < poly.length; i++) {
            const seg = Math.abs(poly[i].x - poly[i - 1].x) + Math.abs(poly[i].y - poly[i - 1].y);
            if (d > seg) { d -= seg; continue; }
            const k = seg > 0 ? d / seg : 0;
            const x = poly[i - 1].x + (poly[i].x - poly[i - 1].x) * k;
            const y = poly[i - 1].y + (poly[i].y - poly[i - 1].y) * k;
            ctx.rect(x - 4, y - 4, 8, 8);
            break;
          }
        }
      }
      ctx.fill();
    }

    // the tear: a jagged cut across the ceiling, widening
    const tk = Math.max(0, Math.min(1, (t - T.tearAt) / T.tearDur));
    if (tk > 0) {
      const w = T.tearMax * tk;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(0, top - w * 0.5);
      for (let x = 0; x <= WORLD_W; x += 40) ctx.lineTo(x, top - w * 0.5 + wobble(x * 0.017, 3) * w * 0.35);
      for (let x = WORLD_W; x >= 0; x -= 40) ctx.lineTo(x, top + w * 0.5 + wobble(x * 0.021, 7) * w * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = alpha(STRATA[6].tease, 0.85);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // the surface layer slides down into place above Foundation
    const sk = Math.max(0, Math.min(1, (t - T.slideAt) / T.slideDur));
    if (sk > 0 && sk < 1) {
      const y = stratumTop(6) - STRATUM_H * (1 - sk);
      const g = ctx.createLinearGradient(0, y, 0, y + STRATUM_H);
      g.addColorStop(0, STRATA[6].bg);
      g.addColorStop(1, alpha(STRATA[6].panel, 0.94));
      ctx.fillStyle = g;
      ctx.fillRect(0, y, WORLD_W, STRATUM_H);
      ctx.strokeStyle = alpha(STRATA[6].accent, 0.5);
      ctx.lineWidth = 2;
      ctx.strokeRect(0, y, WORLD_W, STRATUM_H);
    }
  }
  world.onDraw('rupture', draw);

  /* ---------- the DOM half: the shudder, the chips, the camera ---------- */
  let risen = false;
  function step() {
    const t = clock();
    if (reduced) {
      wash.style.opacity = String(Math.max(0, 1 - Math.abs(t * 1000 - REDUCED_MS / 2) / (REDUCED_MS / 2)));
      if (t * 1000 >= REDUCED_MS / 2 && !risen) { risen = true; revealUpper(); world.lockTo(6, false); }
      if (t * 1000 >= REDUCED_MS) { finish(); return; }
    } else {
      const jk = t < T.jitter ? 1 - t / T.jitter : 0;
      const dx = wobble(t * 9, 1) * 2 * jk, dy = wobble(t * 9, 2) * 2 * jk;
      const tf = jk > 0 ? 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)' : '';
      if (canvas) canvas.style.transform = tf;
      if (layer) layer.style.transform = tf;
      wash.style.opacity = String(t < T.end ? Math.max(0, Math.min(0.55, 0.55 - Math.max(0, t - 2.4) * 0.55)) : 0);
      setMine(t >= T.mineAt && t < T.mineOff);
      if (t >= T.slideAt + T.slideDur) revealUpper();
      if (t < T.riseAt) pullBack(t);
      if (t >= T.riseAt && !risen) { risen = true; world.lockTo(6, true); }
      if (t >= T.end) { finish(); return; }
    }
    raf = win.requestAnimationFrame(step);
  }

  function finish() {
    if (done) return;
    done = true;
    if (raf) win.cancelAnimationFrame(raf);
    world.onDraw('rupture', null);
    revealUpper();
    setMine(false);
    if (canvas) canvas.style.transform = '';
    if (layer) layer.style.transform = '';
    if (wash.parentNode) wash.parentNode.removeChild(wash);
  }

  raf = win.requestAnimationFrame(step);

  return {
    /** freeze the fx at a beat (screenshots); pass null to let it run again */
    hold(ms) {
      frozen = ms === null || ms === undefined ? null : ms / 1000;
      if (frozen === null) { raf = win.requestAnimationFrame(step); return; }
      if (raf) win.cancelAnimationFrame(raf);
      // the rail builds itself on the view's first sync, so a held frame re-applies for a few frames
      let n = 0;
      const settleHeld = () => { step0(); if (++n < 8) raf = win.requestAnimationFrame(settleHeld); else raf = 0; };
      settleHeld();
    },
    cancel() { finish(); if (key.parentNode) key.parentNode.removeChild(key); },
    get t() { return clock(); }
  };

  /** one frozen pass: apply the DOM half at the held clock without scheduling the next frame */
  function step0() {
    const t = clock();
    const jk = t < T.jitter ? 1 - t / T.jitter : 0;
    const tf = jk > 0 ? 'translate(' + (wobble(t * 9, 1) * 2 * jk).toFixed(2) + 'px,' + (wobble(t * 9, 2) * 2 * jk).toFixed(2) + 'px)' : '';
    if (canvas) canvas.style.transform = tf;
    if (layer) layer.style.transform = tf;
    wash.style.opacity = String(Math.max(0, Math.min(0.55, 0.55 - Math.max(0, t - 2.4) * 0.55)));
    setMine(t >= T.mineAt && t < T.mineOff);
    if (t >= T.slideAt + T.slideDur) revealUpper();
    if (t < T.riseAt) pullBack(t); else if (!risen) { risen = true; world.lockTo(6, false); }
  }
}

/** the audio module is optional: WO-09 wires it, and the turn must land without it */
function audioOf(opts) { return opts.audio || null; }

/**
 * operated(root, on): after emergence your verbs are still drawn and no longer yours.
 * The shell decides when this applies; the styling lives in render/eras/foundation.css.
 */
export function operated(on, doc) {
  const d = doc || (typeof document === 'undefined' ? null : document);
  if (!d || !d.body) return;
  ensureStyle(d);
  if (on) d.body.classList.add('operated'); else d.body.classList.remove('operated');
}

/** the fx owns its own rules, so the turn looks the same whichever stratum's stylesheet is loaded */
const RULES = [
  '.rx-wash{position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;mix-blend-mode:screen;',
  'background:radial-gradient(120% 80% at 50% 0%,rgba(199,122,255,0.5),rgba(6,2,12,0.86) 72%)}',
  '.rx-key{min-width:26px;padding:3px 8px;border-radius:8px;text-align:center;font-family:var(--mono,monospace);',
  'font-size:13px;color:#f4efff;border:1px solid #b78bff;background:rgba(183,139,255,0.16)}',
  'body.operated .verbs .verb{pointer-events:none;opacity:0.55;border-style:dashed}',
  'body.operated .verbs .verb .vkey{font-size:0;letter-spacing:0}',
  'body.operated .verbs .verb .vkey::after{content:"not yours";font-size:8.5px;letter-spacing:0.12em;color:var(--tease,#b78bff)}',
  'body.operated .plate .pause{display:none}'
].join('');
function ensureStyle(d) {
  if (d.getElementById('rx-style')) return;
  const s = d.createElement('style');
  s.id = 'rx-style';
  s.textContent = RULES;
  d.head.appendChild(s);
}

// WO-08: reveal + film
