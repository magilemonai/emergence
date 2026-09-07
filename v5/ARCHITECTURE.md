# v5 ARCHITECTURE — code systems

> Frozen decisions. Executing agents implement against these; proposals for change go in the work-order report,
> never into the files. Read after `SPEC.md`, before your work order.

## Stack (no exceptions)
- Vanilla JavaScript, ES2020, **ES modules** (`import`/`export`), no bundler, no npm dependencies, no TypeScript
  build. JSDoc typedefs in `engine/types.js` are the type contract (editors check them; runtime does not).
- Rendering: one `<canvas>` (2D context) for the world + a DOM HUD layer over it (rail, verbs, plates, drawers,
  cards). No WebGL, no SVG world (small inline SVG inside DOM plates is fine).
- Audio: WebAudio + the existing `assets/music-*.mp3` stems.
- Tests: `node v5/test.js` (pure node, no deps; the engine never touches the DOM). Headless Chrome tools under
  `v5/tools/` mirror `tools/shoot-unified.js` / `tools/v4-smoke.js` / `tools/v4-playtest.js`.
- Packaging: `tools/build-single.js` gains a v5 mode later (WO-11); during development `v5/index.html` loads modules.
- Determinism: nothing in `v5/engine/` may call `Date`, `Math.random`, `performance`, `setTimeout` or touch
  `window`/`document`. The sim's only randomness is `sim.rng()` (mulberry32 seeded from `state.seed`).

## Directory layout (file ownership is per work order — see each WO)
```
v5/
  SPEC.md ARCHITECTURE.md GUARDRAILS.md ORCHESTRATION.md
  index.html            the game (WO-02 creates, WO-11 hardens)
  dev.html              renderer bench with a synthetic graph (WO-01)
  app.js                boot, save/load, settings, keys, routing (WO-11; WO-02 creates a minimal one)
  engine/
    CONTRACT.md         the sim API (frozen)          types.js  JSDoc typedefs (frozen)
    sim.js              createSim, tick, actions, replay, rng   (WO-00)
    graph.js            nodes/edges/flows                        (WO-00)
    cfg.js              ALL tunables, per era                    (WO-00 seeds; eras add their block)
    voice.js            the machine's lines (the only prose)     (WO-03..07 add; WO-00 creates the shape)
    legacy.js receipt.js film.js                                 (WO-10, WO-12, WO-08)
    eras/origins.js symbolic.js statistical.js deep.js foundation.js mirror.js surface.js   (WO-02..07)
  render/
    world.js            canvas, camera, strata, LOD, frame loop  (WO-01)
    pipes.js            orthogonal routing + particles           (WO-01)
    nodes.js            canvas glyphs + DOM plate anchoring      (WO-01)
    hud.js              rail, verbs, drawers, cards, toasts      (WO-01 shell of it; eras fill)
    palette.js          per-stratum palettes + resource hues     (WO-01, copied from v4)
    fx.js               rupture, reveal, film playback           (WO-06/08)
    eras/*.js           per-stratum view modules                 (WO-02..07)
  audio/synth.js beds.js                                          (WO-09)
  scenes/scenes.js      seeded states for screenshots/tests      (each era WO adds its scenes)
  test.js               runner; test/*.test.js                   (WO-00 creates runner; each WO adds tests)
  tools/shoot.js smoke.js playtest.js overflow.js                 (WO-01 shoot; WO-13 the rest)
  workorders/WO-NN-*.md
```

## The engine model
- **State** is one plain object (`engine/types.js` → `State`): `{ v, seed, rng, t, era, maxEra, stocks, nodes,
  edges, mult, flags, eras:{1:{},2:{},…}, log, legacy }`. Everything the game needs to be rebuilt is in State.
  Rendering keeps its own ephemeral caches; nothing in State is DOM.
- **Nodes** (`NodeDef`) are typed: `source` (outputs only), `converter` (inputs → outputs, per unit per second),
  `store` (a visible stock: a Resource's bank), `sink` (inputs only), `goal` (progress meter). A node has `count`,
  `paused`, a `pos` in STRATUM-LOCAL units (the renderer lifts it by `stratumTop(era)`), `era`, and `mult`
  (named multipliers, product applied to its rates).
- **Edges** are derived: every converter/sink input port connects from the resource's `store` node of the nearest
  stratum that has one; every output port connects to the store of its resource (the store's stratum = where the
  resource was introduced). Cross-stratum edges are `riser` edges (rendered in the riser channels). `edge.flow` is
  the amount moved in the last tick per second (the renderer's particle density).
- **Tick** (deterministic, order = stratum ascending, node insertion order): sources add; converters compute
  desired = count × rate × dt × Π mult, limit by the scarcest input (proportional draw), consume, produce; sinks
  draw; goals recompute. `sim.tick(dt)` also calls each installed era's `tick(sim, dt)` after the graph pass (era
  rules: drift, shifts, feedback, emergence). `dt` is clamped to 0.5.
- **Actions** are the only mutation path from outside: `sim.apply({type, ...})` validates via the era module's
  `actions[type].can`, mutates via `.apply`, appends `{t, type, ...}` to `state.log`. Bots, the UI, the mirror and
  the film all use actions. `sim.replay(seed, log, until)` rebuilds a state from scratch by re-ticking with the
  logged action timestamps — it MUST reproduce the state byte-identically (a test enforces).
- **Era modules** (`EraModule`): `{ id, name, install(sim), tick(sim, dt), actions, goal(sim), layout, voice }`.
  `install` adds nodes/stores and cfg; `layout.anchors` positions nodes in stratum-local coordinates; `voice(sim)`
  returns the current machine line or null.
- **Offline catch-up** = `sim.tick` in 0.1s steps under `state.mute = true`; era modules skip live-only systems
  when `sim.muted()` (commissions, contradictions, weather, feedback, emergence, the mirror).

## The renderer model
- `createWorld({canvas, hud, sim, assets, reduced})` returns `{ camera, frame(dtReal), lockTo(n), overview(),
  plates, scene(name) }`. `frame` draws strata backgrounds (palette blend), pipes with particles (flow-driven),
  node glyphs (LOD), fx; then updates DOM plates (translate3d from world coords; hidden when zoom < 0.6). The HUD
  rail/verbs/goal for the locked stratum are DOM and fixed to the viewport (they belong to the stratum you are
  locked to; they fade out in the overview).
- **BUILD-ONCE / update-in-place** applies to every DOM element: plates are created once per node and updated with
  change-detected setters (`setTxt/setHTML/setDis` from `render/hud.js`). Never rewrite a button's innerHTML on a
  frame. Purchases update; structural changes (a node unlocked) create.
- Performance budget: sim tick + frame ≤ 6ms average with 2000 live particles at zoom 1 (measured by
  `test/perf.test.js` in node for the sim, and by `tools/shoot.js --perf` in headless for the frame).

## Save / legacy / routing
- Save: `localStorage['emergence_v5'] = {v:1, state, wall}`. The engine never truncates `state.log` (replay
  exactness); the SAVE layer (WO-11) caps what it persists at 12,000 actions by keeping the first 600 (the film's
  opening + the first minute) and a stride-sampled remainder, and the film/mirror sample from that. Legacy: `localStorage['emergence_v5_legacy']` (name, ending, oddRule, runs, firstMinute
  = the first 60s of the log).
- Route: `index.html` at the repo root gains `?v=5 → v5/index.html` (WO-11). v3 default, v4 at `?v=4` stay.
