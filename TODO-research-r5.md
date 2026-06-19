# Round 5 — research-driven implementation (from DESIGN-research-2026-06.md)

Derived checklist from the deep-research findings. Tags:
`[safe]` implement + verify now · `[balance]` implement the mechanic, values need a playtest tune ·
`[design]` conservative swing, reversible, Cody reviews · `[decision]` needs Cody's explicit go first.

Loop order: RR1 → RR5 → RR6 → RR2/RR3/RR4 → PAUSE for RR7 → RR8/RR9/RR10.
`node test.js` green + a commit per item. Nothing pushed.

## Teaching — bake the lesson into the mechanic, cut decoupled prose (Findings 7, 8)
- [x] **RR1 [safe] Statistical just-in-time.** DONE. Found four foundational tidbits defined but
  NEVER fired (`symbolic`/`statistical`/`deep`/`foundation` — dead educational content). Wired each to
  fire on entry to its paradigm, so the "what this really is" note lands at the felt moment (the
  overfit/shift tidbits already fire just-in-time). Also covers part of RR4 for the other three eras.
- [ ] **RR2 [safe] Foundation just-in-time.** Scale / Anomaly / Coherence explained as you feel them,
  not front-loaded (builds on R4.5); trim.
- [ ] **RR3 [safe] Teach-beat audit (all eras).** Cut each upfront beat to the one-line "what you're
  doing"; move the rest to just-in-time micro-cues. Keep orientation, drop the walls.
- [ ] **RR4 [analysis→safe] Concept = win/lose?** Per era, note where the AI lesson is narrated vs
  enacted (Serious Game Mechanic), and apply the quick framing fixes that fall out.

## Structural — cross-era economy (Finding 5)
- [x] **RR5 [balance] Count-multipliers.** DONE (mechanic). Deep's Capability now scales with the
  COUNT of Origins Foundries owned (`+3%/foundry`, `CFG.e4.chainPerFoundry`), so revisiting Origins to
  build more silicon capacity compounds late instead of going obsolete. Surfaced in the Deep feeds
  readout ("N Origins foundries → +X% capability"). **VALUE (3%/foundry) NEEDS A PLAYTEST TUNE** — and
  worth extending to a Data→Deep / Silicon→Statistical coupling once the feel is confirmed.

## Structural — back-half engagement (Finding 1)
- [ ] **RR6 [design] Back-half audit per era.** v2 already added Commissions / contradictions /
  Experiment Board / events, so this is gap-filling where an era still decays into spam. Per era:
  - RR6a Origins — Refinement spam vs the Commissions/Hands engine: is there still a dead stretch?
  - RR6b Symbolic — lemma spam vs contradictions: do contradictions stay live late?
  - RR6c Statistical — the set-once Focus dial: make distribution-shifts change the OPTIMAL focus so you must re-engage.
  - RR6d Deep — already reactive: ensure shift vs breakthrough demand genuinely different shapes.

## Foundation cluster — gated on the emergence decision
- [ ] **RR7 [decision] Emergence reframe.** Capability climb becomes visible + smooth; "emergence" =
  a discontinuous READOUT crossing a threshold. Protects the surprise (Finding 6), cures "Foundation
  doesn't make sense," teaches the truer lesson that the jump is partly in how we measure (Finding 10).
  **NEEDS CODY'S GO — everything below depends on it.**
- [ ] **RR8 [design] Alignment vs Control distinct** (Finding 11). Alignment = how often its proposals
  are good; Control = whether your veto still binds. A high-Alignment agent can still go uncontrollable.
- [ ] **RR9 [design] Aftermath plateau/breakthrough gates** (Finding 2) so it can't collapse in ~57s
  when the player prepped — its own escalating decisions, not a resolution of prep already done.
- [ ] **RR10 [design] Sharpen rush-vs-prepare complicity** (Finding 9): rushing should feel like the
  player's own doing, enacting the loss of control.

## Needs playtest, not implementation
- Pacing redistribution (Origins ~11.6m / Deep ~13.7m long; Statistical ~5m / aftermath ~57s short) →
  Run-Recorder data from Zach's next run. RR5/RR6/RR9 reshape *where* the time goes; the *values* wait.
