# WO-08 · The Reveal + the Film (SPEC "The turn" §5)

## Goal
The ending as a camera move and a film: pull out to the overview, silhouette the whole column, type the ending
name, play the 12-second time-lapse of your column growing from the first mark (from the log), then your first
60 seconds of clicks as ghost cursors on the Origins stratum, then the endcard + scorecard.

## Read first
SPEC §5, `render/fx.js` (rupture, WO-06), `engine/CONTRACT.md` (`replay`), `render/world.js` camera API,
`v4-kit/era-foundation.js` (endcard, epilogue, buildRecap for the scorecard text), `v5/test/wo08-*.test.js`.

## Files you own
`v5/engine/film.js` (pure: `frames(log, seed, n)` → n snapshots by re-ticking the replay; `firstMinute(log)` →
the click list with screen-anchor hints), `v5/render/fx.js` **reveal + film sections** (append below the marker),
`v5/render/eras/endcard.js`, scenes (`reveal`, `film-mid`, `ghosts`, `endcard-symbiotic|runaway|contained`),
`v5/test/wo08-*.test.js`.

## Build
- Reveal: `lockTo` → `overview()` over 2.2s; strata fade to silhouette (`lodFor(0.22)`); the ending line types
  (mono, 34px); per ending: Symbiotic = all strata pulse together; Runaway = strata go dark bottom-up until only
  the surface glows; Contained = the surface dims and locks (a ring).
- Film: 12s, 24 frames/s from `film.frames(log, seed, 288)` rendered as node counts + pipe flows growing on the
  silhouette (do NOT re-run the full sim per frame at runtime: precompute the 288 snapshots once, in a worker-free
  chunked loop with a progress ring so the main thread never stalls > 16ms).
- Ghosts: the first 60s of `log` actions replayed on the Origins stratum at 1× as faint cursors that press the
  same verbs (world-anchored from the layout), while the machine says one line from voice 6.
- Endcard: v4 content (title, epilogue lines, the recap table + grade) as a DOM card over the overview; a
  "begin again" button (writes legacy via WO-10's hook if present).

## Pure exports the acceptance test imports (`v5/test/wo08-film.test.js`)
`engine/film.js`: `frames(log, seed, n, {eras, cfg, chunk?})` → n snapshots `{t, nodes, stocks, edges}` spanning
0..end (the last equals the live state); `firstMinute(log)` → the actions with `t ≤ 60`. Files: `v5/engine/film.js`,
`v5/render/fx.js` (reveal + film sections), `v5/render/eras/endcard.js`, `v5/scenes/endcard.js`, `v5/test/wo08-*.test.js`.

## Acceptance
`node v5/test.js` green (wo08: `frames` count and monotonic time; `firstMinute` returns ≤ 60s of actions; film
precompute chunking never exceeds 16ms per chunk in node timing). Scenes shot + READ; perf ≤ 6ms while the film plays.

## Checklist
- [ ] The whole column is one shape in the overview; the ending name types over it.
- [ ] The film visibly grows the column from nothing; 12s; no stall.
- [ ] Ghost cursors press your first verbs on the bedrock; the line under them is one of voice 6.
