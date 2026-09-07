# WO-03 · Symbolic stratum

## Goal
Port v4 Symbolic's rules onto the engine one stratum above Origins, with the Knowledge riser from below feeding
Rules, and give the machine its first voice: the terminal. Compile is a stratum-wide CRT reboot.

## Read first
SPEC (pillar 3: Symbolic word budget), `v4-kit/era-symbolic.js` (TREE, stats, proofs, compile, contradictions incl.
the odd rule #4471, the one-Ruleset gate until Formal Logic, hand-written rules advancing the active proof
`clickProof`), CFG `e2`, `v5/engine/eras/origins.js` + `v5/render/eras/origins.js` (the pattern to follow),
`v5/test/wo03-symbolic.test.js`.

## Files you own (after the Phase-A split: one file per stratum, no shared edits)
`v5/engine/eras/symbolic.js`, `v5/render/eras/symbolic.js` (must `export function createView(opts)` per
ARCHITECTURE "Era views"), `v5/engine/voice/e2.js` (the era's voice table, default export array), `v5/engine/cfg/e2.js`
(the era's tunables, default export object), `v5/scenes/symbolic.js` (default export `{sceneName: fn(sim)}`; each
scene must `sim.openEra(...)` up to this stratum first: the app mounts the view of `sim.state.era`), `v5/test/wo03-*.test.js`.
Do NOT edit app.js, index.html, cfg.js, voice.js, scenes.js, the engine, the renderer core, or any existing test.

## Build
- Engine: resources rules/inference/axioms; store `rules` fed by a riser from Origins `knowledge.store` (the
  handoff: `open()` converts carried Knowledge to Rules at `seedFromKnowledge`; ALSO a live trickle: `ruleset`
  converter has an input port `knowledge 0.02/unit/s` so the riser carries particles while the engine runs — this is
  the "see systems feed each other" pillar); converter `ruleset` (rules → inference), source `daemon`; proofs as a
  `goal`-kind node per theorem? No: proofs are era state (`proofAcc`), the active proof is a `sink` node `proof`
  that draws inference (so the pipe Inference → Proof is visible). Actions: `writeRule`, `buy`, `pause`, `aim {id}`,
  `compile`, `resolve {side}`, `prove` (the Expert goal). Contradictions live-only; the second names
  `legacy.oddRule || 4471` and sets `flags.oddRule`.
- Voice (era 2 table in voice.js): terminal line templates ≤ 9 words: derivation, Q.E.D., contradiction, compile,
  reboot, boot.
- View: the terminal (3 lines, mono, typing reveal) sits under the proof sink; theorem cards as compact plates in
  the field (aim button, cost in inference); the contradiction card in the goal column; Compile = the whole stratum
  scales-Y to a line and back (`crtOff/crtOn`), particles freeze for 0.7s, the terminal prints the reboot.
- Layout anchors: rules.store 300,120 · ruleset 500,120 · inference.store 700,120 · proof 900,120 · daemon 300,230;
  theorem plates in a 3×3 grid from (300,330). Goal `expert` right column with the path checklist (5 steps).

## Pure exports the acceptance test imports (in addition to the EraModule default export)
`symbolic.done(sim)`, `symbolic.layout`, `symbolic.height`. Named node ids: `rules.store`, `inference.store`,
`axioms.store`, `ruleset` (converter, input knowledge riser 0.02 + rules → inference), `daemon` (source of rules),
`proof` (sink of inference; draws only while `activeProof`). Action names: `writeRule`, `buy`, `pause`, `aim {id}`,
`compile`, `resolve {side:'fwd'|'bwd'}`, `prove`. Era state at `state.eras[2]`: `tech`, `activeProof`, `proofAcc`,
`runRules`, `contra {a,b,odd}`, `contraN`, `paraFwd/paraBwd`, `flags.compile`, `flags.symbolicDone`.

## Acceptance
`node v5/test.js` green (wo03: gate = one ruleset until formalLogic; hand-click advances proof; 2nd contradiction
= odd rule; compile clears + banks; parity with v4 stats within 2%). Scenes shot + READ, pageScroll 0, perf ≤ 6ms.

## Checklist
- [ ] The Knowledge riser from Origins is visible and carries particles while rulesets run.
- [ ] The first Inference bar climb is visible (one ruleset, ~60s) and hand-clicks push it.
- [ ] Terminal lines are machine output, ≤ 9 words, no explaining.
- [ ] Compile reads as a reboot of the stratum, not a toast.
- [ ] Contradiction card beside the goal; #4471 shows "origin: none".

## Out of scope
Statistical and later; audio; saving.
