# WO-11 · Shell: save/load, offline, settings, keys, title cards, routing, packaging

## Read first
`emergence-v4.html` boot IIFE (save scrub, offline catch-up via mute, Esc settings, pause pill, keys, era cards),
`tools/build-single.js`, `index.html` (root switcher), `v5/app.js`.

## What app.js already does (do not undo): discovers era modules + views by convention, mounts ONE view for
`sim.state.era` at boot, keys Space/Q/R/1-6, a rAF loop, `window.__V5`, scenes via `#scene=`.
## What you add
1. **Live era switching**: on `openEra(n)` (a `sim` event or a per-frame check of `state.era`), call
   `view.deactivate?.()`, clear era HUD content (`hud.clearEra()` — add to hud.js: empties verbList, removes goal
   extras/asides, resets the rail), mount the new view (`activate?.()`), `world.lockTo(n, true)`, and show the
   **title card** (`world.titleCard(n)`: sigil + name + subtitle in the stratum's font over 2.2s; fx.js title section).
   Views that lack activate/deactivate are constructed fresh on each activation and their DOM removed on switch.
2. **Save/load/offline**, **Esc settings** (pause, restart, three audio knobs via `audio/index.js` if present),
   the `MAX` bulk mode (`buyN(node)` prices per node: rail toggle ×1/×10/×25/MAX), the legacy hooks (WO-10's
   `fromRun` at ending, `applyToFresh` at boot), the packager v5 mode, the root `index.html` `?v=5` route behind
   `V5_ENABLED = false`.

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
