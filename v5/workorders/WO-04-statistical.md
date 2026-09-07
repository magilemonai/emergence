# WO-04 · Statistical stratum

## Goal
Port v4 Statistical: the living scatter as a WORLD object (canvas-drawn inside the stratum, not a DOM panel), the
Focus dial, trials, the Experiment drawer (Method-first badge), shifts, RR6c world drift, prediction ("it expects:")
and Autopilot as a compact toggle, the violet point. Silicon arrives by riser from Origins' silicon store.

## Read first
SPEC (pillar 4: prediction is computed from the log), `v4-kit/era-statistical.js` (all rules incl. predDwell,
policy(), the badge = METHOD only), CFG `e3`, WO-02/03 modules as patterns, `v5/test/wo04-statistical.test.js`.

## Files you own
`v5/engine/eras/statistical.js`, `v5/render/eras/statistical.js`, voice.js era 3 table, cfg `e3`,
scenes (`stat-early`, `stat-shift`, `stat-autopilot`, `stat-drifting`), `v5/test/wo04-*.test.js`.

## Build
- Engine: resources data/insight; converter `dataset` (silicon riser → data), converter `model` (data + a little
  silicon → trials → accuracy/gap/insight; expose `trials` as a store-like node `trials` so the pipe Data → Fit
  Engine → Insight is drawn); actions `trial`, `focus {k}` (with the 5s dwell rule for prediction), `buy`, `pause`,
  `fund {kind}`, `generalize`. Prediction: `predictNext()` from the LOG (the last 16 `focus` actions), not from a
  side array. Autopilot unlock as v4 (120 trials, 5-streak or 65%/12).
- View: the scatter drawn on the canvas at the top of the stratum field (world rect 240,40 → 920,220): points,
  fit curve, band, the violet point after shift 1, the drift dot after shift 2; the two-needle track under it;
  RUN TRIAL verb (never wraps; Focus on line 2 in its colour); the Focus dial (3 segments + the Autopilot toggle);
  EXPERIMENTS drawer button with the METHOD badge / numbers-first progress; goal Generalize (88%) right column with
  the supply-bus button "Silicon from Origins →" that `lockTo(1)`s the camera.
- Voice era 3: `it expects: <FOCUS>` (ghost tag on the segment), `it has learned you` (once).

## Acceptance
`node v5/test.js` green (wo04: policy, prediction from the log, dwell, autopilot unlock, drift after shift 2, badge
rule). Scenes shot + READ; pageScroll 0; the Autopilot scene keeps the drawer button in view; perf ≤ 6ms.

## Checklist
- [ ] Silicon riser from Origins visibly feeds the Dataset plate.
- [ ] The scatter is part of the world (it scrolls/zooms with the stratum; in the overview it is a glowing band).
- [ ] "it expects you here" tag sits on the segment border, never over the name.
- [ ] After shift 2 the points crawl and the drift dot pulses; Generalize becomes periodic in the bot.
- [ ] Zero prose beyond the two voice lines.
