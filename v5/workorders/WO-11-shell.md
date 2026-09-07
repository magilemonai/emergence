# WO-11 · Shell: save/load, offline, settings, keys, title cards, routing, packaging

## Read first
`emergence-v4.html` boot IIFE (save scrub, offline catch-up via mute, Esc settings, pause pill, keys, era cards),
`tools/build-single.js`, `index.html` (root switcher), `v5/app.js`.

## Files you own
`v5/app.js` (harden: versioned save `emergence_v5`, log cap 12,000, offline catch-up in 0.1s muted steps with the
"WHILE YOU WERE AWAY" toast, Esc settings with pause + restart + three audio knobs, keys 1–6/Space/−/=/Esc, the
stratum title card on every `openEra`), `v5/render/fx.js` **title card section**, `tools/build-single.js` (a v5
mode: inline `v5/**/*.js` modules in dependency order into one file — convert ES module imports to a single scope
with a tiny wrapper, embed fonts, verify with `tools/shoot.js --file <artifact>`), root `index.html` (`?v=5` route
ONLY after the orchestrator says; ship the change behind a `V5_ENABLED = false` flag in index.html).

## Acceptance
`node v5/test.js` green; `node v5/tools/smoke.js` (WO-13) or a temporary probe: reload resumes the run; a 10-minute
"away" replays deterministically; Esc pause freezes `sim.t`; the packaged single file boots with 0 errors and every
scene matches the modular build byte-for-byte in the probe.
