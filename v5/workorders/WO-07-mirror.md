# WO-07 · The Mirror (aftermath, SPEC "The turn" §4)

## Goal
Replace v4's meter-drain aftermath with the mirror: the agent replays YOUR action log on YOUR column at 10×,
improving on your choices; you get exactly three interrupts; endings derive from your three choices + your
feedback record.

## Read first
SPEC §4 of The turn, `engine/CONTRACT.md` (`replay`), `v5/engine/eras/surface.js` (proposals/veto),
`v4-kit/era-foundation.js` (PROPOSALS, resolveVeto, ENDINGS, epilogue, buildRecap), `v5/test/wo07-*.test.js`.

## Files you own
`v5/engine/eras/mirror.js` (installed by the surface at emergence+1s), `v5/render/eras/mirror.js`, cfg `mirror`
block, voice table 6 additions, scenes (`mirror-replay`, `mirror-interrupt`, `mirror-resolved`), `v5/test/wo07-*.test.js`.

## Build
- Engine: `mirror.tick` advances a SECOND sim (`sim.replay` driven incrementally: a `replayer` that re-applies the
  log at 10× game time onto a shadow state) and "improves" it with a deterministic policy: fabricate/prove/generalize
  as soon as `can`, compile when axiomGain ≥ 2, steer toward the lowest run, buy Attention first. The shadow's
  strata glow violet where its choice differs from yours (a `diff` map: era → count of improvements). Three
  interrupts: `interrupt()` pauses the replay and opens the next proposal (v4 PROPOSALS); `resolveVeto(how)` as v4;
  after three, no more. Resolution when the shadow replay reaches your emergence time or the interrupts are spent:
  ending = f(alignment from feedback record + coherence, control from vetoes/negotiations) with v4 thresholds.
- View: the column plays the shadow (particles at 10×, violet tint on improved strata); the surface HUD shows the
  interrupt button (big, three pips), the proposal card when open, and the agent's narration line; Control/Alignment
  as two bars that only move on your choices.

## Acceptance
`node v5/test.js` green (wo07: the replayer reproduces your state when run without the policy; with the policy it
finishes earlier; exactly three interrupts; endings map per thresholds; determinism). Scenes shot + READ.

## Checklist
- [ ] You can SEE it replaying your run (the same pipes, faster) and where it did better (violet).
- [ ] Three interrupts, no per-second drain; the choice cards read in ≤ 22 words.
- [ ] Endings: Symbiotic / Runaway / Contained reachable by choices alone (test-proven).
