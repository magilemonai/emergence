// audio/beds.js — the per-stratum Suno beds (WO-09). One lazily created <audio> per stratum, an
// equal-power crossfade of 1.2s on setBed, the rupture bed, and the surface variant: the Origins
// buffer reversed and played at half speed.
//
// WHY elements and not one decoded buffer per track: the mp3s are minutes long and several MB. The
// element streams and seeks. Only the surface variant needs the samples, so only it is decoded.

import { AUDIO, clamp } from './synth.js';

export const CROSSFADE_S = 1.2;

/** the v4 track per stratum. `rupture` is the bed the turn crosses to. */
export const BED_FILE = {
  1: 'music-bone-loam.mp3',
  2: 'music-phosphor-logic.mp3',
  3: 'music-glass-algorithm.mp3',
  4: 'music-cobalt-furnace.mp3',
  5: 'music-graviton-lullaby.mp3',
  6: 'music-unmoored-presence.mp3',
  rupture: 'music-unmoored-presence.mp3'
};

/** equal-power crossfade: out^2 + in^2 stays 1, so the pair never dips or bumps in the middle */
export function crossfadeGains(k) {
  const x = clamp(k, 0, 1) * Math.PI / 2;
  return { out: Math.cos(x), in: Math.sin(x) };
}

/** reverse every channel of a decoded buffer (the surface plays Origins backwards) */
export function reverseBuffer(ctx, buf) {
  const out = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const src = buf.getChannelData(c), dst = out.getChannelData(c);
    for (let i = 0, n = buf.length; i < n; i++) dst[i] = src[n - 1 - i];
  }
  return out;
}

/** fetch + decode + reverse. Rejects are the caller's to swallow (a missing file must not break play). */
export async function loadReversed(ctx, url) {
  const res = await fetch(url);
  const bytes = await res.arrayBuffer();
  const buf = await ctx.decodeAudioData(bytes);
  return reverseBuffer(ctx, buf);
}

/**
 * createBeds({doc, base}) -> the bed player.
 * set(key) starts a 1.2s crossfade; tick(dt) advances it; nothing is created until set() is called
 * with the player on, so a page that never gets a gesture never fetches a track.
 */
export function createBeds(opts) {
  const o = opts || {};
  const doc = o.doc || (typeof document !== 'undefined' ? document : null);
  const base = o.base || '../assets/';
  const els = {};
  const st = { key: null, prev: null, k: 1, on: false, vol: 0.15, blocked: 0 };

  function el(key) {
    if (!doc || !BED_FILE[key]) return null;
    if (els[key]) return els[key];
    const a = doc.createElement('audio');
    a.src = base + BED_FILE[key];
    a.loop = true; a.preload = 'none'; a.volume = 0;
    a.className = 'bed';
    if (doc.body) doc.body.appendChild(a);
    els[key] = a;
    return a;
  }

  function play(a) {
    if (!a) return;
    const p = a.play();
    if (p && p.catch) p.catch(() => { st.blocked++; });
  }

  function apply() {
    const g = crossfadeGains(st.k), v = level();
    const cur = st.key && els[st.key], prev = st.prev && els[st.prev];
    if (cur) cur.volume = st.on ? v * g.in : 0;
    if (prev) prev.volume = st.on ? v * g.out : 0;
    if (prev && st.k >= 1) { prev.pause(); st.prev = null; }
  }

  function level() { return clamp(st.vol, 0, AUDIO.bedMax); }

  return {
    els: els,
    get key() { return st.key; },
    get fade() { return st.k; },
    get blocked() { return st.blocked; },
    get volume() { return st.on ? level() : 0; },
    /** set(key, immediate): crossfade to a stratum number or 'rupture' */
    set(key, immediate) {
      if (key === st.key) return;
      const next = el(key);
      if (!next) return;
      st.prev = st.k < 1 ? st.prev : st.key;   // a fade cut short keeps the older tail
      st.key = key;
      st.k = immediate ? 1 : 0;
      next.volume = 0;
      if (st.on) { play(next); }
      apply();
    },
    tick(dt) {
      if (st.k >= 1) return;
      st.k = Math.min(1, st.k + Math.max(0, dt) / CROSSFADE_S);
      apply();
    },
    setOn(b) {
      st.on = !!b;
      const cur = st.key && els[st.key];
      if (st.on) { play(cur); } else { for (const k in els) els[k].pause(); }
      apply();
    },
    setVol(v) { st.vol = clamp(+v || 0, 0, 1); apply(); },
    stop() { for (const k in els) { els[k].pause(); els[k].volume = 0; } },
    info() { return { key: st.key, fade: +st.k.toFixed(3), on: st.on, vol: +level().toFixed(3), blocked: st.blocked }; }
  };
}
