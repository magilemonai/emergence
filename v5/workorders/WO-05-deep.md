# WO-05 · Deep stratum

## Goal
Port v4 Deep: three runs as furnaces fed by risers (Data from Statistical, Knowledge from Origins, Insight from
Statistical), the ternary mixer, drift/heat, the supply bus as real build-here actions on lower strata, the Hold
lever, the Architecture drawer (7 upgrades), CHECKPOINT/RESTORE + DISTILL, the fed bonus, the color-strip event
banner, the Foundry Silicon-low pulse, and the one line it should not know.

## Read first
`v4-kit/era-deep.js` (all), CFG `e4`, WO-02..04 modules, `v5/test/wo05-deep.test.js`.

## Files you own (after the Phase-A split: one file per stratum, no shared edits)
`v5/engine/eras/deep.js`, `v5/render/eras/deep.js` (must `export function createView(opts)` per
ARCHITECTURE "Era views"), `v5/engine/voice/e4.js` (the era's voice table, default export array), `v5/engine/cfg/e4.js`
(the era's tunables, default export object), `v5/scenes/deep.js` (default export `{sceneName: fn(sim)}`; each
scene must `sim.openEra(...)` up to this stratum first: the app mounts the view of `sim.state.era`), `v5/test/wo05-*.test.js`.
Do NOT edit app.js, index.html, cfg.js, voice.js, scenes.js, the engine, the renderer core, or any existing test.

## Build
- Engine: resource capability; source `node` (compute); three `sink` nodes `run.vision/language/reasoning` drawing
  their feedstock (so each riser is a pipe with particles proportional to share × compute); run cap/erosion/heat/
  events/geometry exactly as v4 (`geom`, `fedLevel`); actions `buyNode`, `alloc {vision,language,reasoning}`,
  `lock {run}`, `hold {on}`, `supply {key}` (applies a `buy` on the lower era's node and, for scriptorium, staffs
  it), `arch {id}`, `checkpoint`, `restore`, `distill`, `advance`. Capability accrues from breadth × compute.
- View: the mixer (SVG inside a DOM plate, drag = pointer events, `user-select:none`), the three run plates side by
  side with wind sparklines and LOCK, the gauges strip, the event banner as a colored strip with a countdown, the
  supply bus as five buttons (Foundry pulses amber when Silicon can't cover the next node), ARCHITECTURE drawer
  (7 tiles fit 713px), tool row(s), goal ADVANCE in Foundation violet.
- Voice era 4: `hold course. I am watching the wind too.` once at breadth ≥ 60%, live only.

## Pure exports the acceptance test imports
`deep.geom(sim, runKey)` → `{feed, drift, gain}`; `deep.breadth(sim)`; `deep.done(sim)`; `layout`; `height`.
Node ids: `node` (source of compute; compute is NOT a stocked resource — it is `count × nodeCompute × mult` per
second and is routed by `alloc`), `run.vision`, `run.language`, `run.reasoning` (sinks of data/knowledge/insight;
their input rate per unit = share × compute × feedPerShare × geom.feed, updated each tick). Actions: `buyNode`,
`alloc {vision,language,reasoning}`, `lock {run}`, `hold {on}` (pauses Origins `smelter`+`foundry` nodes), `supply
{key}` ('foundry'|'dataset'|'model'|'scriptorium' → a real buy on the lower stratum; scriptorium comes staffed),
`arch {id}` (ids: stabilizer, attention, convolution, cot, moe, checkpoint, distill), `checkpoint`, `restore`,
`distill`, `advance`. Era state at `state.eras[4]`: `vision/language/reasoning` (0..1), `alloc`, `heat`, `event`,
`eventNext`, `eventT`, `stabilizer`, `locks`, `arch`, `ckpt`, `restoreCd`, `distillCd`, `restores`, `distills`;
`state.flags.oddWind`.

## Acceptance
`node v5/test.js` green (wo05: passive balanced play does NOT reach the gate in 9m; geometry effects; restore never
lowers a run; distill raises breadth; fed bonus; the odd line fires once, live only). Scenes shot + READ; the tools
scene has both tool rows in view; pageScroll 0; perf ≤ 6ms with three risers alive.

## Checklist
- [ ] Three risers from below visibly feed the three furnaces; a starved one blinks red at the mouth.
- [ ] Balanced is never optimal (the guard test) and the corner glow steers without text.
- [ ] The banner is color + two words + a countdown; no sentence alerts.
- [ ] Architecture purchases land every 1–2 minutes at human cadence in the bot.
