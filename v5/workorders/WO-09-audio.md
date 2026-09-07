# WO-09 · Generative audio (`v5/audio/`)

## Goal
SPEC "The audio language": per-stratum Suno beds crossfaded on lock; a generative WebAudio layer where each
converter kind contributes a voice pulsing with flow, tempo follows actions/min, Deep drift detunes, the rupture
loses the tonal center, the surface plays the Origins bed reversed at half speed. All silent until first gesture;
three knobs persisted.

## Read first
SPEC audio section, `v4-kit/kit.js` (MUSIC controller, playSound profiles, persistence keys — reuse the keys
`emergence_v3_music/musvol/sfxvol` so Cody's prefs carry), `v5/render/world.js` (a per-frame hook `world.onFrame`
or `sim.state.edges` for flows), `v5/test/wo09-*.test.js`.

## Files you own
`v5/audio/beds.js`, `v5/audio/synth.js`, `v5/audio/index.js` (`createAudio({sim, world})` → `{start(), setBed(n),
rupture(), surface(), setVol({bed, voices, sfx}), sfx(kind), tick(dt)}`), `v5/test/wo09-*.test.js` (pure parts:
voice→pitch mapping, tempo smoothing, detune curve).

## Build
- Beds: one `<audio>` per stratum lazily created; crossfade 1.2s on `setBed(n)`; the rupture bed; the surface
  variant via an `AudioBufferSourceNode` with the Origins buffer reversed, playbackRate 0.5.
- Voices: for each converter kind present, one oscillator+gain; amplitude = smoothed(flow); pitch table per
  resource (a pentatonic set per stratum from a base note per palette); tempo = actions per minute over 30s
  (from `sim.state.log`), clamped 40–140 bpm, drives a soft pulse envelope; Deep: detune by `heat/110 × 40` cents
  and per-run drift; rupture: all voices glide to a minor-second cluster over 1.7s then decay.
- Master limiter; every gain ≤ 0.2; never clip.

## Acceptance
`node v5/test.js` green (pure parts). A headless run with `--autoplay-policy=no-user-gesture-required` (see
`tools/shoot.js` flags) shows `audio.ctx.state === 'running'` after `start()` and no exceptions across scenes.

## Checklist
- [ ] Silence until the first gesture; the rail `♪ music` button and Esc knobs persist.
- [ ] Beds crossfade on stratum lock; particles and voices agree (idle = quiet).
- [ ] The rupture is audible as loss of tonal center, then Unmoored.
