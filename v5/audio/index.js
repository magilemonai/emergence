// audio/index.js — createAudio({sim, world}) (WO-09).
// The bed layer (beds.js) plus the generative layer (synth.js) behind one object the page drives:
//   start()  setBed(n)  rupture()  surface()  setVol({bed,voices,sfx})  sfx(kind)  tick(dt)
//
// Nothing sounds until start(), which a real user gesture calls (browser autoplay policy). The three
// knobs persist under the keys v3/v4 already use, so Cody keeps the prefs he set in the live game.

import { createBeds } from './beds.js';
import {
  AUDIO, clamp, createVoices, pitchFor, clusterHz, tempoFromLog, smooth, advancePhase,
  pulseEnv, voiceGain, detuneCents, limiterGain, limiterCeiling
} from './synth.js';

/* persisted keys: the first three are v3/v4 keys, kept so the prefs carry across builds */
export const KEY_ON = 'emergence_v3_music';
export const KEY_BED = 'emergence_v3_musvol';
export const KEY_SFX = 'emergence_v3_sfxvol';
export const KEY_VOICES = 'emergence_v5_voicevol';   // the layer v5 adds gets its own knob

/** v4 playSound profiles, per stratum. g stays under the 0.2 ceiling. */
export const SFX_PROFILE = {
  1: { buy: { osc: 'triangle', f0: 880, f1: 300, g: 0.09, dur: 0.1 } },
  2: { buy: { osc: 'square', f0: 620, f1: 240, g: 0.06, dur: 0.08 } },
  3: { buy: { osc: 'sine', f0: 760, f1: 980, g: 0.07, dur: 0.12 } },
  4: { buy: { osc: 'sine', f0: 520, f1: 240, g: 0.07, dur: 0.11 },
       ev: { osc: 'sine', f0: 320, f1: 180, g: 0.07, dur: 0.16 },
       brk: { osc: 'sine', f0: 480, f1: 720, g: 0.07, dur: 0.16 } },
  5: { buy: { osc: 'sine', f0: 420, f1: 560, g: 0.07, dur: 0.14 } },
  6: { buy: { osc: 'sawtooth', f0: 300, f1: 140, g: 0.06, dur: 0.18 } }
};
const DEFAULT_SFX = { osc: 'triangle', f0: 880, f1: 300, g: 0.09, dur: 0.1 };

function readNum(store, key, dflt) {
  try { const v = store.getItem(key); return v === null ? dflt : clamp(+v || 0, 0, 1); } catch (e) { return dflt; }
}
function write(store, key, v) { try { store.setItem(key, String(v)); } catch (e) {} }

/** the spread between the three Deep runs, if Deep is installed: the wind the voices feel */
function deepDrift(st) {
  const e = st.eras && st.eras[4];
  if (!e) return 0;
  const runs = [e.vision, e.language, e.reasoning].filter((x) => typeof x === 'number');
  if (runs.length < 2) return 0;
  return Math.max.apply(null, runs) - Math.min.apply(null, runs);
}

export function createAudio(opts) {
  const o = opts || {};
  const sim = o.sim, world = o.world;
  const win = o.win || (typeof window !== 'undefined' ? window : null);
  const doc = o.doc || (typeof document !== 'undefined' ? document : null);
  const store = o.store || (win && win.localStorage) || { getItem() { return null; }, setItem() {} };

  const vol = {
    bed: readNum(store, KEY_BED, 0.15),
    voices: readNum(store, KEY_VOICES, readNum(store, KEY_BED, 0.15)),
    sfx: readNum(store, KEY_SFX, 1)
  };
  let on = false;
  try { on = store.getItem(KEY_ON) === 'on' && vol.bed > 0; } catch (e) {}

  const beds = createBeds({ doc: doc, base: o.base || '../assets/' });
  beds.setVol(vol.bed);

  const st = {
    started: false, ctx: null, master: null, comp: null, voiceBus: null, sfxBus: null,
    bank: null, bpm: AUDIO.bpmMin, phase: 0, era: (sim && sim.state.era) || 1,
    sig: '', peak: 0, limit: 1, rup: -1, lastLock: 0, surf: null, surfSrc: null, surfFail: '',
    lastErr: '', frames: 0
  };

  /* ---------- the graph ---------- */
  function build() {
    const AC = win && (win.AudioContext || win.webkitAudioContext);
    if (!AC) { st.lastErr = 'no AudioContext'; return false; }
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();     // the backstop under the pure limiter math
    comp.threshold.value = 20 * Math.log10(AUDIO.limitThreshold);
    comp.knee.value = 6; comp.ratio.value = 20; comp.attack.value = 0.003; comp.release.value = 0.25;
    const voiceBus = ctx.createGain(); voiceBus.gain.value = vol.voices;
    const sfxBus = ctx.createGain(); sfxBus.gain.value = vol.sfx;
    voiceBus.connect(comp); sfxBus.connect(comp); comp.connect(master); master.connect(ctx.destination);
    st.ctx = ctx; st.master = master; st.comp = comp; st.voiceBus = voiceBus; st.sfxBus = sfxBus;
    st.bank = createVoices(ctx, voiceBus);
    return true;
  }

  /* ---------- voices follow the graph the player built ---------- */
  function converters() {
    const s = sim && sim.state; if (!s) return [];
    const out = [];
    for (const id of s.nodeOrder || []) {
      const n = s.nodes[id];
      if (!n || n.kind !== 'converter' || n.count <= 0) continue;
      if (!n.outputs || !n.outputs.length) continue;
      out.push(n);
      if (out.length >= AUDIO.maxVoices) break;
    }
    return out;
  }

  function syncVoices() {
    if (!st.bank) return;
    const list = converters();
    const sig = list.map((n) => n.id).join(',');
    if (sig === st.sig) return list;
    st.sig = sig;
    const want = new Set(list.map((n) => n.id));
    for (const k of Array.from(st.bank.voices.keys())) if (!want.has(k)) st.bank.drop(k);
    for (const n of list) {
      const v = st.bank.add(n.id, pitchFor(n.outputs[0].res, n.era), n.era === 2 ? 'square' : 'sine');
      if (v) { v.era = n.era; v.cap = 0.5; }
    }
    return list;
  }

  /** total output flow of one converter, from the edges the graph pass filled */
  function flowOf(id) {
    const s = sim && sim.state; if (!s) return 0;
    let f = 0;
    for (const e of s.edges) if (e.from === id && e.flow > 0) f += e.flow;
    return f;
  }

  /* ---------- the per-frame pass ---------- */
  function tick(dt) {
    if (!st.started || !st.ctx) return;
    const d = Math.max(0, Math.min(0.25, dt || 0));
    beds.tick(d);
    st.frames++;
    // the bed follows the camera, but only when the lock CHANGES: an explicit setBed must stick
    const lock = world && world.locked;
    if (lock && lock !== st.lastLock) { st.lastLock = lock; if (st.rup < 0) setBed(lock); }
    const s = sim && sim.state;
    if (!s) return;

    const list = syncVoices();
    const target = tempoFromLog(s.log, s.t);
    st.bpm = smooth(st.bpm, target, d, AUDIO.tempoTau);
    st.phase = advancePhase(st.phase, st.bpm, d);

    const cents = detuneCents((s.eras && s.eras[4] && s.eras[4].heat) || 0, deepDrift(s));
    const now = st.ctx.currentTime;

    // rupture: glide to the cluster, then let it decay
    let rupAmp = 1;
    if (st.rup >= 0) {
      st.rup += d;
      rupAmp = st.rup <= AUDIO.ruptureGlide ? 1 : Math.max(0, 1 - (st.rup - AUDIO.ruptureGlide) / AUDIO.ruptureDecay);
    }

    // pre-limiter peak from the pure math, so the ceiling holds without leaning on the compressor
    let sum = 0, i = 0;
    const amps = [];
    for (const n of (list || [])) {
      const v = st.bank.voices.get(n.id); if (!v) { i++; continue; }
      const f = flowOf(n.id);
      v.flow = smooth(v.flow, f, d, AUDIO.flowTau);
      v.cap = Math.max(v.cap || 0.5, v.flow);
      const env = st.rup >= 0 ? 1 : pulseEnv(st.phase + i / Math.max(1, list.length));
      const a = voiceGain(v.flow, v.cap) * env * rupAmp;
      amps.push(a); sum += a; i++;
    }
    st.peak = sum;
    st.limit = limiterGain(sum);
    i = 0;
    for (const n of (list || [])) {
      const v = st.bank.voices.get(n.id); if (!v) { i++; continue; }
      v.amp = (amps[i] || 0) * st.limit;
      v.gain.gain.setTargetAtTime(v.amp, now, 0.03);
      if (st.rup >= 0) {
        const k = Math.min(1, st.rup / AUDIO.ruptureGlide);
        const tgt = clusterHz(pitchFor('scale', 5), i);
        v.osc.frequency.setTargetAtTime(v.hz + (tgt - v.hz) * k, now, 0.12);
        v.osc.detune.setTargetAtTime(cents + k * 35, now, 0.12);
      } else {
        v.osc.detune.setTargetAtTime(cents, now, 0.15);
      }
      i++;
    }
  }

  /* ---------- api ---------- */
  function applyVol() {
    beds.setVol(vol.bed);
    if (st.voiceBus) st.voiceBus.gain.value = clamp(vol.voices, 0, 1);
    if (st.sfxBus) st.sfxBus.gain.value = clamp(vol.sfx, 0, 1);
  }

  function start() {
    if (st.started) { if (st.ctx && st.ctx.resume) st.ctx.resume(); return true; }
    if (!build()) return false;
    st.started = true;
    if (st.ctx.resume) { const p = st.ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    beds.setOn(on);
    if (on) beds.set(st.era, true);
    syncVoices();
    return true;
  }

  function setBed(n) {
    st.era = n;
    if (!st.started || !on) return;
    beds.set(n, false);
  }

  function rupture() {
    st.rup = 0;
    if (on) beds.set('rupture', false);
    if (st.ctx && st.bank) {
      const now = st.ctx.currentTime;
      for (const v of st.bank.voices.values()) v.osc.frequency.cancelScheduledValues(now);
    }
  }

  async function surface() {
    st.era = 6;
    if (!st.started || !st.ctx) return false;
    beds.stop();
    if (st.surf) return playSurface();
    try {
      const mod = await import('./beds.js');
      st.surf = await mod.loadReversed(st.ctx, (o.base || '../assets/') + mod.BED_FILE[1]);
      return playSurface();
    } catch (e) {
      st.surfFail = String((e && e.message) || e);
      if (on) beds.set(6, false);                    // the bed the turn already crossed to
      return false;
    }
  }

  function playSurface() {
    if (!st.surf || !st.ctx) return false;
    if (st.surfSrc) { try { st.surfSrc.stop(); } catch (e) {} }
    const src = st.ctx.createBufferSource();
    const g = st.ctx.createGain();
    src.buffer = st.surf; src.loop = true; src.playbackRate.value = 0.5;
    g.gain.value = clamp(vol.bed, 0, AUDIO.bedMax);
    src.connect(g); g.connect(st.master);
    src.start();
    st.surfSrc = src;
    return true;
  }

  function sfx(kind) {
    if (!st.started || !st.ctx || vol.sfx <= 0) return;
    const table = SFX_PROFILE[st.era] || SFX_PROFILE[1];
    const p = table[kind] || table.buy || DEFAULT_SFX;
    try {
      const ctx = st.ctx, t = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = p.osc; osc.connect(g); g.connect(st.sfxBus);
      osc.frequency.setValueAtTime(p.f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, p.f1 || p.f0), t + (p.dur || 0.06) * 0.6);
      g.gain.setValueAtTime(Math.min(AUDIO.masterMax, p.g), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (p.dur || 0.1));
      osc.start(t); osc.stop(t + (p.dur || 0.1) + 0.02);
    } catch (e) { st.lastErr = String((e && e.message) || e); }
  }

  function setVol(v) {
    const x = v || {};
    if (x.bed !== undefined) { vol.bed = clamp(+x.bed || 0, 0, 1); write(store, KEY_BED, vol.bed); }
    if (x.voices !== undefined) { vol.voices = clamp(+x.voices || 0, 0, 1); write(store, KEY_VOICES, vol.voices); }
    if (x.sfx !== undefined) { vol.sfx = clamp(+x.sfx || 0, 0, 1); write(store, KEY_SFX, vol.sfx); }
    applyVol();
    return { bed: vol.bed, voices: vol.voices, sfx: vol.sfx };
  }

  /** the rail button: persists under the v3 key so the live game and v5 agree */
  function setMusic(b) {
    on = !!b;
    write(store, KEY_ON, on ? 'on' : 'off');
    if (st.started) { beds.setOn(on); if (on) beds.set(st.era, true); }
    return on;
  }

  /** arm(target): start on the first gesture, once. The page may call start() itself instead. */
  function arm(target) {
    const el = target || doc;
    if (!el || !el.addEventListener) return;
    const once = () => {
      el.removeEventListener('pointerdown', once, true);
      el.removeEventListener('keydown', once, true);
      start();
    };
    el.addEventListener('pointerdown', once, true);
    el.addEventListener('keydown', once, true);
  }

  return {
    start, setBed, rupture, surface, setVol, sfx, tick, arm, setMusic,
    beds,
    get ctx() { return st.ctx; },
    get started() { return st.started; },
    get music() { return on; },
    get vol() { return { bed: vol.bed, voices: vol.voices, sfx: vol.sfx }; },
    info() {
      const vs = [];
      if (st.bank) for (const v of st.bank.voices.values()) vs.push({ id: v.key, hz: +v.hz.toFixed(1), flow: +v.flow.toFixed(3), amp: +v.amp.toFixed(4) });
      return {
        started: st.started, ctx: st.ctx ? st.ctx.state : 'none', era: st.era, music: on,
        bpm: +st.bpm.toFixed(1), peak: +st.peak.toFixed(4), limit: +st.limit.toFixed(3),
        ceiling: +limiterCeiling().toFixed(3), rup: +st.rup.toFixed(2), frames: st.frames,
        surface: !!st.surfSrc, surfaceFail: st.surfFail, err: st.lastErr,
        vol: { bed: vol.bed, voices: vol.voices, sfx: vol.sfx },
        bed: beds.info(), voices: vs
      };
    }
  };
}

export default createAudio;
