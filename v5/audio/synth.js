// audio/synth.js — the generative layer (WO-09). Pure math first (tested in v5/test/wo09-*.test.js),
// then a thin WebAudio voice bank built on top of it. Nothing here touches the DOM at import time,
// so node can import the math without a browser.
//
// WHY the split: pitch tables, tempo smoothing, the detune curve and the limiter decide how the layer
// sounds. They are testable numbers. The oscillators are only plumbing.

/* ---------- tunables (audio is not an era, so its block lives here, named) ---------- */
export const AUDIO = {
  voiceMax: 0.06,        // peak gain of ONE voice (guardrail: every gain <= 0.2)
  masterMax: 0.2,        // ceiling of the whole generative layer
  bedMax: 0.2,           // ceiling of a bed element volume (v4 shipped 0.15)
  limitThreshold: 0.17,  // where the soft knee starts
  limitKnee: 0.06,
  flowTau: 0.55,         // seconds: how fast a voice follows its pipe
  tempoTau: 4.0,         // seconds: how fast the pulse follows actions per minute
  tempoWindow: 30,       // seconds of log the tempo reads
  bpmMin: 40, bpmMax: 140,
  heatCents: 40,         // Deep: full heat detunes this far
  heatRef: 110,          // SPEC: heat / 110 * 40 cents
  driftCents: 25,        // per unit of per-run drift, on top of heat
  detuneMax: 60,
  ruptureGlide: 1.7,     // seconds to lose the tonal centre
  ruptureDecay: 1.6,     // seconds of decay after the cluster lands
  attack: 0.08,          // fraction of the pulse period spent rising
  decayK: 4.5,
  maxVoices: 12
};

/* ---------- pitch ---------- */
export const A4 = 440;
export function midiToHz(m) { return A4 * Math.pow(2, (m - 69) / 12); }

/** one pentatonic set per stratum: root midi plus degrees in semitones. Low and open at the bottom of
 *  the column, brighter as the strata climb. The surface layer sits on its own cluster set. */
export const STRATUM_SCALE = {
  1: { root: 45, deg: [0, 3, 5, 7, 10] },   // A2 minor pentatonic: stone
  2: { root: 52, deg: [0, 2, 4, 7, 9] },    // E3 major pentatonic: phosphor
  3: { root: 57, deg: [0, 2, 5, 7, 9] },    // A3 suspended: glass
  4: { root: 40, deg: [0, 3, 5, 6, 10] },   // E2 blues: the furnace
  5: { root: 60, deg: [0, 2, 3, 7, 10] },   // C4 minor: violet
  6: { root: 61, deg: [0, 1, 6, 7, 11] }    // C#4 cluster: the surface
};

/** resource id to [degree, octave] inside its stratum set. Unlisted ids fall back to a stable hash. */
export const RES_DEGREE = {
  marks: [0, 0], ore: [1, -1], knowledge: [2, 0], metal: [3, -1], silicon: [4, 0],
  rules: [0, 0], inference: [2, 0], axioms: [4, 1],
  data: [0, 0], insight: [3, 0],
  compute: [0, -1], capability: [2, 0],
  scale: [0, 1], coherence: [3, 0], autonomy: [4, 1]
};

export function hashDegree(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return [h % 5, ((h >>> 5) % 3) - 1];
}

/** pitchFor(res, era) to Hz. Deterministic: one resource on one stratum is always the same note. */
export function pitchFor(res, era) {
  const sc = STRATUM_SCALE[era] || STRATUM_SCALE[1];
  const d = RES_DEGREE[res] || hashDegree(String(res || 'x'));
  const midi = sc.root + sc.deg[Math.abs(d[0]) % sc.deg.length] + 12 * d[1];
  return midiToHz(midi);
}

/** the rupture target: voices pack into minor seconds around the centre, so the key stops existing */
export function clusterHz(centerHz, i) { return centerHz * Math.pow(2, ((i % 6) - 2) / 12); }

/* ---------- tempo ---------- */
export function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

/** actions per minute over the last `win` seconds of state.log, clamped to the musical range */
export function tempoFromLog(log, tNow, win, lo, hi) {
  const w = win || AUDIO.tempoWindow, from = tNow - w;
  let n = 0;
  for (let i = (log || []).length - 1; i >= 0; i--) {
    const t = log[i].t;
    if (t === undefined || t >= from) n++; else break;
  }
  const bpm = n * 60 / w;
  return clamp(bpm, lo === undefined ? AUDIO.bpmMin : lo, hi === undefined ? AUDIO.bpmMax : hi);
}

/** one-pole smoothing, frame-rate independent */
export function smooth(prev, target, dt, tau) {
  if (!(tau > 0)) return target;
  const k = 1 - Math.exp(-Math.max(0, dt) / tau);
  return prev + (target - prev) * k;
}

export function advancePhase(phase, bpm, dt) {
  const p = phase + Math.max(0, dt) * (bpm / 60);
  return p - Math.floor(p);
}

/** the soft pulse: a quick rise then an exponential fall, 0..1 */
export function pulseEnv(phase) {
  const p = phase - Math.floor(phase), a = AUDIO.attack;
  if (p < a) return p / a;
  return Math.exp(-(p - a) * AUDIO.decayK);
}

/* ---------- amplitude + detune ---------- */
/** flow to voice amplitude. sqrt so a trickle is audible and a torrent does not swamp the mix. */
export function voiceGain(flow, cap, max) {
  const m = max === undefined ? AUDIO.voiceMax : max;
  const f = clamp((flow || 0) / (cap || 1), 0, 1);
  return m * Math.sqrt(f);
}

/** Deep: heat / 110 * 40 cents, plus per-run drift, signed, clamped */
export function detuneCents(heat, drift) {
  const h = clamp((heat || 0) / AUDIO.heatRef, 0, 1) * AUDIO.heatCents;
  const d = (drift || 0) * AUDIO.driftCents;
  return clamp(h + d, -AUDIO.detuneMax, AUDIO.detuneMax);
}

/** soft-knee limiter gain (0..1). peak * limiterGain(peak) never passes threshold + knee/2. */
export function limiterGain(peak, threshold, knee) {
  const th = threshold === undefined ? AUDIO.limitThreshold : threshold;
  const kn = knee === undefined ? AUDIO.limitKnee : knee;
  const p = Math.abs(peak || 0);
  if (p <= th) return 1;
  const over = p - th;
  const out = over < kn ? th + (over * over) / (2 * kn) : th + kn / 2;
  return out / p;
}

export function limiterCeiling(threshold, knee) {
  const th = threshold === undefined ? AUDIO.limitThreshold : threshold;
  const kn = knee === undefined ? AUDIO.limitKnee : knee;
  return th + kn / 2;
}

/* ---------- the voice bank (WebAudio; only built after start()) ---------- */
/** one converter = one oscillator plus gain, pitched by the resource it makes */
export function createVoices(ctx, dest) {
  const voices = new Map();
  function add(key, hz, type) {
    if (voices.has(key)) return voices.get(key);
    if (voices.size >= AUDIO.maxVoices) return null;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(hz, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime);
    o.connect(g); g.connect(dest); o.start();
    const v = { key: key, osc: o, gain: g, hz: hz, flow: 0, amp: 0 };
    voices.set(key, v);
    return v;
  }
  function drop(key) {
    const v = voices.get(key);
    if (!v) return;
    try {
      v.gain.gain.cancelScheduledValues(ctx.currentTime);
      v.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      v.osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
    voices.delete(key);
  }
  function stopAll() { for (const k of Array.from(voices.keys())) drop(k); }
  return { voices: voices, add: add, drop: drop, stopAll: stopAll, get size() { return voices.size; } };
}
