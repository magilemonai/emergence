# WO-01 · Renderer core (`v5/render/world.js`, `pipes.js`, `nodes.js`, `hud.js`, `palette.js`, `v5/dev.html`)

## Goal
The single zoomable canvas world from SPEC "The world" + "The visual language": strata as stacked bands with
blended borders, orthogonal pipes carrying particles whose density follows edge flow, node glyphs with LOD, DOM
plates anchored to world coordinates (BUILD-ONCE), a camera with `lockTo(n)` / overview / wheel zoom, and a dev
bench page (`dev.html`) that renders a SYNTHETIC graph (no real game rules) so the renderer can be judged alone.
This order runs in parallel with WO-00: you build against `engine/CONTRACT.md` + `types.js`, NOT against sim.js.
Your bench constructs a fake `sim`-shaped object (state with nodes/edges/stocks/rates + a `tick` that animates
flows) inside `dev.html`.

## Read first
`v5/SPEC.md` (The world, The visual language, The turn §1 for what fx.js will need later), `v5/ARCHITECTURE.md`
("The renderer model"), `v5/engine/CONTRACT.md`, `v5/engine/types.js`, `v5/test/wo01-renderer.test.js` (pure-function
acceptance), `v4-kit/kit.css` (the DOM plate/verb/goal look to carry: `.node`, `.verb`, `.goal`, `.chip`, `.buy`,
milestone pip; copy the CSS you need into `render/hud.css`), `emergence-v4.html` `body.theme-1..5` palette blocks
(copy the values into `render/palette.js`; theme-6 too).
Tooling: `v5/tools/shoot.js` (`node v5/tools/shoot.js <scene> out.png --file v5/dev.html [--perf]`).

## Files you own
`v5/render/world.js`, `v5/render/pipes.js`, `v5/render/nodes.js`, `v5/render/hud.js`, `v5/render/hud.css`,
`v5/render/palette.js`, `v5/dev.html`, `v5/test/wo01-*.test.js` (extra unit tests).

## Build
1. `palette.js`: `STRATA[1..6]` = `{bg, panel, line, edge, text, dim, dimmer, accent, good, danger, tease, font,
   body, mono}` copied from v4 themes; `RES` hues/glyphs/icons copied from v4 modules (marks, ore, knowledge,
   metal, silicon, rules, inference, axioms, data, insight, capability, scale). Export `stratumHue(n)` and
   `blend(n, y)` for the 60-px border gradients.
2. `pipes.js`: `route(a, b, opts)` (Manhattan polyline; leave horizontally, one vertical jog at the midpoint;
   with `opts.riser` route via the right riser channel x 960–1000 when going up/down strata, left channel 200–240
   if the target is left of x 400); `particleCount(flowPerSec)`; `drawPipe(ctx, poly, hue, flow, tSec, lod)` (track
   at 30% hue, particles at 100%, 120 world-px/s, evenly spaced along the polyline length, phase from `tSec`;
   starved: last particle blinks red — an `opts.starved` flag); `pipeLength(poly)`.
3. `world.js`: pure exports `fitStratum(n, viewport)`, `worldToScreen`, `screenToWorld`, `lodFor(zoom)`, and
   `createWorld({canvas, hud, sim, reduced})` → `{camera, frame(dtReal), lockTo(n, animate=true), overview(), plates,
   stats:{particles, frameMs}, scene(name)}`. Camera animates over 400ms (ease-out) on `lockTo`; wheel zooms
   around the pointer within [0.18, 1.4]; drag pans when zoom < 1 or in overview; keys `-`/`=` zoom; clicking a
   stratum in the overview locks to it; `Esc` from overview returns to the locked stratum. Frame: clear; draw
   strata bands (bottom = stratum 1) with blended borders; pipes (from `sim.state.edges` + node positions in WORLD
   coords = stratumTop(era) + anchor); node glyphs per LOD; then `plates.update()`.
4. `nodes.js`: canvas glyph per node kind (store = a rounded well with the resource glyph + amount; converter = a
   plate silhouette + icon glyph + ×count; source = a small stacker; goal = a ring meter) for `glyph`/`silhouette`
   LOD; `createPlates(hud, sim)` → DOM plates (one `.plate` per node of the LOCKED stratum, created once, updated
   in place: `name · ×count · +out/s · cost · BUILD · pause · milestone pip`, numbers first) positioned by
   `translate3d` from world coords each frame; hidden below zoom 0.6; buttons dispatch `sim.apply({type:'buy',
   node, n})` / `pause`. Change-detected setters live in `hud.js` (`setTxt/setHTML/setDis` — copy v4's).
5. `hud.js` + `hud.css`: the fixed HUD frame: rail (chips from `sim.state.resources` present in the locked
   stratum + neighbors, value + rate), left verbs column (`renderVerbs(list)` creates big `.verb` buttons that call
   an `onVerb(name)` callback), right goal column (`renderGoal(sim.goal())` meter + wake hue), toasts (top-right,
   under the rail, max 2), a tooltip system (`data-tip`), and `setTxt/setHTML/setDis`. The HUD fades to 0 opacity
   in the overview (pointer-events none).
6. `dev.html`: loads the modules, builds a synthetic 3-stratum graph (stores, sources, converters with risers
   between strata, one goal), a fake tick that varies flows sinusoidally so particles visibly change density, wires
   `window.__V5 = {sim, world, settle(){…}}` and `#scene=` handling for: `bench-1` (locked stratum 1, 8 nodes, all
   pipes active), `bench-risers` (locked stratum 2 with two risers from stratum 1), `bench-overview` (zoom 0.22, all
   three strata, 2000 particles), `bench-starved` (one converter starved: red blink), `bench-lod` (zoom 0.5, plates
   hidden, glyphs on).

## Acceptance
- `node v5/test.js` → green (wo01-renderer + yours; do not break wo00's — sim.js may not exist yet in your worktree:
  the runner still loads `wo00-engine.test.js`; if `engine/sim.js` is absent that file throws → that failure is
  EXPECTED in your branch and is not yours to fix; state this in the report).
- `node v5/tools/shoot.js bench-1 /tmp/b1.png --file v5/dev.html` → ERRORS none, `pageScroll 0`, `plates 8`.
- `node v5/tools/shoot.js bench-overview /tmp/b2.png --file v5/dev.html --perf` → PERF ≤ 6ms per tick+frame.
- All five bench scenes shot and READ.

## Checklist
- [ ] Strata are stacked bottom-up with 60px blended borders; the overview shows the column as one object.
- [ ] Pipes are orthogonal; particle density visibly tracks flow; idle pipes show no particles; starved input blinks red.
- [ ] Risers run in the channels and are legible in the overview.
- [ ] Plates are numbers-first, created once, updated in place (no innerHTML rewrites per frame — assert in a test by
      instrumenting setHTML calls over 60 frames with unchanged state → 0 writes).
- [ ] The page never scrolls; the HUD fades in the overview; `Esc` returns.
- [ ] Reduced motion: particles still draw, but no easing animations run.

## Out of scope
Real era rules, saving, audio, fx (rupture/reveal), the real `index.html`.
