// WO-09 — the pure half of the audio layer: pitch mapping, tempo smoothing, the detune curve,
// the pulse envelope and the limiter math. No browser, no AudioContext.
import {
  AUDIO, midiToHz, pitchFor, clusterHz, hashDegree, STRATUM_SCALE, RES_DEGREE,
  tempoFromLog, smooth, advancePhase, pulseEnv, voiceGain, detuneCents, limiterGain, limiterCeiling
} from '../audio/synth.js';

export async function run(t) {
  /* ---------- pitch ---------- */
  t.near(midiToHz(69), 440, 1e-9, 'A4 is 440');
  t.near(midiToHz(57), 220, 1e-9, 'an octave down halves the frequency');
  t.near(pitchFor('marks', 1), 110, 0.01, 'Origins marks sit on the stratum root A2');
  t.eq(pitchFor('marks', 1) === pitchFor('marks', 1), true, 'pitchFor is deterministic');
  t.ok(pitchFor('marks', 1) !== pitchFor('silicon', 1), 'two Origins resources are two notes');
  t.ok(pitchFor('marks', 1) < pitchFor('marks', 5), 'the column climbs: higher strata are higher notes');

  for (const era of Object.keys(STRATUM_SCALE)) {
    const hz = pitchFor('unknownResource', +era);
    t.ok(hz > 20 && hz < 4000, 'stratum ' + era + ' keeps an unmapped resource inside hearing');
  }
  for (const res of Object.keys(RES_DEGREE)) {
    const hz = pitchFor(res, 1);
    t.ok(hz > 20 && hz < 4000, 'mapped resource ' + res + ' lands in range');
  }
  const h = hashDegree('someResource');
  t.eq(h, hashDegree('someResource'), 'the fallback hash is stable');
  t.ok(h[0] >= 0 && h[0] < 5, 'the fallback degree is inside the pentatonic set');
  t.ok(h[1] >= -1 && h[1] <= 1, 'the fallback octave stays within one octave');

  // the rupture cluster: neighbours are one semitone apart, so the tonal centre is gone
  const c0 = clusterHz(440, 0), c1 = clusterHz(440, 1);
  t.near(c1 / c0, Math.pow(2, 1 / 12), 1e-9, 'cluster neighbours are a minor second apart');
  t.ok(clusterHz(440, 0) !== clusterHz(440, 3), 'the cluster spreads across voices');

  /* ---------- tempo ---------- */
  const log = [];
  for (let i = 0; i < 30; i++) log.push({ type: 'inscribe', t: 100 + i });   // 30 actions in the window
  t.near(tempoFromLog(log, 130, 30), 60, 1e-9, '30 actions over 30s reads as 60 bpm');
  t.eq(tempoFromLog([], 100), AUDIO.bpmMin, 'an idle log floors at the slow tempo');
  const fast = [];
  for (let i = 0; i < 200; i++) fast.push({ t: 100 + i * 0.1 });
  t.eq(tempoFromLog(fast, 120), AUDIO.bpmMax, 'a flurry clamps at the fast tempo');
  const old = [{ t: 1 }, { t: 2 }, { t: 3 }];
  t.eq(tempoFromLog(old, 500), AUDIO.bpmMin, 'actions outside the 30s window do not count');

  // smoothing: monotone approach, never overshoot, frame-rate independent
  let v = 40;
  for (let i = 0; i < 60 * 30; i++) v = smooth(v, 120, 1 / 60, AUDIO.tempoTau);   // 30s, about 7 tau
  t.near(v, 120, 0.5, 'the tempo reaches its target after a few time constants');
  let a = 0, b = 0;
  for (let i = 0; i < 240; i++) a = smooth(a, 1, 1 / 240, 0.5);
  for (let i = 0; i < 60; i++) b = smooth(b, 1, 1 / 60, 0.5);
  t.near(a, b, 0.002, 'smoothing over one second matches at 60fps and 240fps');
  t.near(smooth(0, 1, 0.5, 0.5), 1 - Math.exp(-1), 1e-9, 'one time constant covers 63 percent');
  t.eq(smooth(0.4, 1, 0.1, 0) , 1, 'a zero time constant snaps');
  let up = 0, prev = -1, mono = true;
  for (let i = 0; i < 50; i++) { up = smooth(up, 1, 0.05, 0.4); if (up < prev) mono = false; prev = up; }
  t.ok(mono && up <= 1, 'smoothing is monotone and never overshoots');

  /* ---------- the pulse ---------- */
  t.near(advancePhase(0, 60, 1), 0, 1e-9, 'at 60 bpm one second is one whole pulse');
  t.near(advancePhase(0, 120, 0.25), 0.5, 1e-9, 'at 120 bpm a quarter second is half a pulse');
  t.ok(advancePhase(0.9, 140, 1) >= 0 && advancePhase(0.9, 140, 1) < 1, 'phase stays inside 0..1');
  t.eq(pulseEnv(0), 0, 'the pulse starts silent');
  t.near(pulseEnv(AUDIO.attack), 1, 1e-9, 'the pulse peaks at the end of the attack');
  t.ok(pulseEnv(0.5) < pulseEnv(0.2), 'the pulse decays after the peak');
  t.eq(pulseEnv(1.25), pulseEnv(0.25), 'the pulse is periodic');
  let inRange = true;
  for (let p = 0; p < 1; p += 0.01) if (pulseEnv(p) < 0 || pulseEnv(p) > 1) inRange = false;
  t.ok(inRange, 'the pulse envelope stays inside 0..1');

  /* ---------- amplitude ---------- */
  t.eq(voiceGain(0, 5), 0, 'no flow is silence');
  t.eq(voiceGain(5, 5), AUDIO.voiceMax, 'a full pipe reaches the voice ceiling');
  t.ok(voiceGain(10, 5) === AUDIO.voiceMax, 'more than full does not exceed the ceiling');
  t.ok(voiceGain(1, 5) > voiceGain(0.2, 5), 'a fuller pipe is louder');
  t.ok(voiceGain(1, 5) > AUDIO.voiceMax * 1 / 5, 'the sqrt curve keeps a trickle audible');
  t.ok(AUDIO.voiceMax <= 0.2 && AUDIO.masterMax <= 0.2 && AUDIO.bedMax <= 0.2, 'every gain ceiling is at most 0.2');

  /* ---------- detune ---------- */
  t.eq(detuneCents(0, 0), 0, 'a cold fabric is in tune');
  t.near(detuneCents(110, 0), 40, 1e-9, 'heat 110 detunes 40 cents, per SPEC');
  t.near(detuneCents(55, 0), 20, 1e-9, 'the heat curve is linear to its cap');
  t.eq(detuneCents(400, 0), AUDIO.heatCents, 'heat past the reference stops at 40 cents');
  t.near(detuneCents(0, 0.5), AUDIO.driftCents * 0.5, 1e-9, 'per-run drift adds on top of heat');
  t.ok(Math.abs(detuneCents(9999, 9999)) <= AUDIO.detuneMax, 'total detune is clamped');
  t.ok(detuneCents(0, -1) < 0, 'drift detunes in both directions');

  /* ---------- limiter ---------- */
  const ceil = limiterCeiling();
  t.eq(limiterGain(0), 1, 'silence passes untouched');
  t.eq(limiterGain(AUDIO.limitThreshold * 0.5), 1, 'below the threshold there is no reduction');
  t.eq(limiterGain(AUDIO.limitThreshold), 1, 'the knee starts exactly at the threshold');
  let ok = true, mono2 = true, lastOut = 0;
  for (let p = 0; p <= 2; p += 0.005) {
    const g = limiterGain(p), out = p * g;
    if (g > 1 + 1e-12 || g <= 0) ok = false;
    if (out > ceil + 1e-9) ok = false;
    if (out < lastOut - 1e-12) mono2 = false;      // a louder mix never gets quieter (no fold-back)
    lastOut = out;
  }
  t.ok(ok, 'the limiter never boosts and never passes the ceiling');
  t.ok(mono2, 'the limited output rises with the peak and then holds');
  t.ok(limiterGain(1) < limiterGain(0.3), 'a hotter mix gets more reduction');
  t.near(limiterGain(AUDIO.limitThreshold + AUDIO.limitKnee) * (AUDIO.limitThreshold + AUDIO.limitKnee), ceil, 1e-9, 'past the knee the output sits at the ceiling');
  t.ok(ceil <= AUDIO.masterMax, 'the limiter ceiling is under the master ceiling of 0.2');
  // the worst case the mix can build: every voice at full flow, all pulses aligned
  const worst = AUDIO.maxVoices * AUDIO.voiceMax;
  t.ok(worst * limiterGain(worst) <= AUDIO.masterMax, 'twelve voices at full flow still land under 0.2');
  t.eq(limiterGain(-0.5), limiterGain(0.5), 'the limiter reads the absolute peak');
}
