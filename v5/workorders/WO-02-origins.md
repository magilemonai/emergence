# WO-02 · Origins stratum (the paradigm proof)

## Goal
The first playable stratum on the real engine + renderer, and the first `v5/index.html`. Port the Origins ECONOMY
from `v4-kit/era-origins.js` (verbs, scribes/miners, scriptorium/smelter/foundry with upkeep ports, discoveries,
commissions, hands lever, refine, milestones, bulk buy, the Logic Machine goal) onto the graph engine, laid out on
the bedrock stratum with pipes carrying particles. This is Cody's "Origins slice first" rule: if this stratum does not
feel better than v4's Origins board, the paradigm is wrong and later orders wait.

## Read first
`v5/SPEC.md` (all), `v5/ARCHITECTURE.md`, `v5/engine/CONTRACT.md`, `v5/render/world.js` + `nodes.js` + `hud.js` +
`v5/dev.html` (how WO-01 expects to be driven), `v4-kit/era-origins.js` (the rules to port, faithfully: DISCO,
BUYS, oStats, commissions, fabricate), the Origins block of `CFG` in `emergence-v4.html` (copy into
`engine/cfg.js` `e1`), `v5/test/wo02-origins.test.js` (acceptance).

## Files you own
`v5/engine/eras/origins.js`, `v5/render/eras/origins.js`, `v5/index.html`, `v5/app.js` (minimal boot: createSim
with cfg + [origins], createWorld, the frame loop, `window.__V5`, `#scene=` → `v5/scenes/scenes.js`),
`v5/scenes/scenes.js` (create; scenes `origins-boot`, `origins-bronze`, `origins-ready`, `origins-commission`),
`engine/cfg.js` `e1` block ONLY (append; do not touch other keys), `v5/test/wo02-*.test.js`.

## Build
- Engine module (`EraModule`): resources marks/ore/knowledge/metal/silicon (hues from palette); stores for each;
  sources `scribe`, `miner`; converters `scriptorium` (inputs marks 1.1 + ore 0.385 → knowledge 1.1 per unit per
  second, i.e. v4 rates with upkeep as a second port), `smelter`, `foundry`; goal `logicMachine`. Actions:
  `inscribe`, `quarry`, `buy`, `pause`, `discover {id}`, `commission {accept:boolean}`, `hands {lever}`, `refine`,
  `fabricate`. Discoveries as in v4 (12, with `fn` effects expressed as `setMult`/flags/node unlocks). Milestones
  via `setMult(node,'milestone', tierMult(count))`. Commissions live-only (`sim.muted()`), ask = `commMult` (28)
  seconds of gross output. `goal()`: silicon / siliconGate. `done()`: fabricated. `voice()`: null (Origins is silent).
- Layout anchors (stratum-local, y from the stratum top): stores in a top row (marks 300,120 · knowledge 700,120),
  the Record converter between them (500,120); the Forge row (ore 300,330 · smelter 500,330 · metal 700,330 ·
  foundry 500,480 · silicon 900,480); sources under their stores (scribe 300,220 · miner 300,430). Verbs
  `['inscribe','quarry']` + the RESEARCH drawer button; goal `logicMachine` in the right column with the age
  image walking stone → bronze → silicon → the machine (assets/core-*.png, logic-machine.png).
- View module: registers the research drawer (discovery tiles: numbers-first "+Knowledge · Scriptorium", cost
  chips ✓/grey), the commission card (in the goal column, glowing, timer bar, Fulfill/Decline), the hands lever +
  refine control (left column under the verbs), the goal wake (glow builds with progress, VT323 morph when ready),
  floating `+N` on verb clicks, era-entry title card hook (WO-11 wires cards; leave a `world.titleCard(1)` call).
- `index.html`/`app.js`: minimal but real: canvas + HUD root, boot with seed = 1, `requestAnimationFrame` loop
  calling `sim.tick(dtReal)` (clamped) + `world.frame`, keys Space (primary verb), `-`/`=` zoom, scenes via hash.

## Acceptance
- `node v5/test.js` green (incl. `wo02-origins.test.js`: economy parity with v4 within 2% for a scripted 3-minute
  bot; discoveries gate correctly; commissions freeze under mute; fabricate opens era 2 stub or sets done).
- `node v5/tools/shoot.js origins-boot|origins-bronze|origins-ready|origins-commission out.png` → ERRORS none,
  pageScroll 0, plates match the unlocked nodes; READ them.
- `node v5/tools/shoot.js origins-ready --perf` ≤ 6ms.

## Checklist
- [ ] At boot: one stone, one verb, one store; the first mark spawns the first pipe (visibly).
- [ ] Marks → Scriptorium → Knowledge reads left-to-right with particles; the ore upkeep shows as a second thin pipe.
- [ ] Numbers-first plates; the milestone pip; bulk buy honors the rail toggle (×1/×10/MAX).
- [ ] The goal image walks the ages; FABRICATE wakes in Symbolic's phosphor hue.
- [ ] Commission card beside the goal, never under a toast; unfulfillable asks are visibly out of reach (grey chip).
- [ ] Zoom out at any time: the bedrock stratum alone, silhouetted, particles alive. `Esc` returns.
- [ ] Zero prose. Tooltips carry flavor + mechanical line only.

## Out of scope
Symbolic and later, saving, audio, the title card system (stub the call).
