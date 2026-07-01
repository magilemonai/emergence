# Cody playtest — v3 Origins slice, confirmation run — 2026-06-30, ~8.4 min

Source: `KittyCapture/captures/20260630_225418/` (transcript 88 segs). Fresh instrumented JSON:
`KittyCapture/emergence-v3-run (1).json` — **DEAD-CLICKS: 1** (down from 18 last run), completed
Origins (age 3, done) at t=506s. Buys scribe×26, miner×21, scriptorium×5, smelter×4, foundry×2,
refine×7; all discoveries; 2 commissions. This was a re-test of the round-1 v3 fixes.

## HEADLINE — the fixes worked; the loop is confirmed
- **Dead-clicks fixed** (the dominant complaint last run): 18 → 1. No click-failure complaints in the
  commentary; he bought/built fluidly ("cruising along… we're getting stuff"). Build-once rule held.
- **Research legible** [01:00] "Oh good, you can see, I can discover that." [02:06] "Research back, it
  lets us know. Clay tablets. Plus knowledge, it unlocks the scriptoria." → lead-with-effect landed.
- [02:15] "It's testing quite well." [02:03] "This is still dormant. That's nice." (goal reads).
- **Fabricate wake landed + wants more** [07:24–07:56] "Now it's glowing and pulsing… that animation
  was pretty cool. As a baseline, I want it to be better." + the enhancement ask (below).

## BUG — Forge lane "running off the side"
> [03:30] "Oh, we've got a — this is running off the side here. So [kind of a] problem with the kiln."
When the Forge lane populates (kiln → smelter, then foundry), content overflows horizontally. Root
cause: the board's center grid column is `1fr` with no `min-width:0`, so an over-wide pipe expands the
column past the viewport instead of wrapping; plus a dangling connector trails after the Metal stock on
wrap. **Fix:** `min-width:0` on the center column + shrinkable pipe items; group each converter with its
connectors so a connector never ends a row. #1 (only real bug this run).

## ENHANCEMENT ASK — the wake should morph into the next era
> [07:29–07:53] "It would be cool if the font also fuzzed into the new font that we're about to get…
> that animation was pretty cool, as a baseline, I want it to be better."
The fabricate/wake beat should preview Symbolic more fully: the title font glitch-morphs into Era 2's
font, stronger animation. Elevates the era-hand-off cutscene (task #22 follow-up).

## SMALLER
- New-game vs continue confusion [00:31–00:49] "I don't want a new game… can I just do a new game?…
  Also I just want to refresh this, make sure it's totally new." Save auto-loaded his prior state; he
  had to fight to get a fresh start. Clarify continue-vs-new-game (or a clear reset).
- Earliest discoveries: wants immediate "what does this do" [00:57–01:16] "I wish I knew what this did
  to me… plus one marks, plus one scribes." Mostly addressed by the effect text now; watch the first tile.

## State
Phase 1 fully validated (paradigm + round-1 fixes confirmed). Remaining Origins work: the overflow bug
(now), then the wake-morph enhancement, then Phase 2 (lock Origins + extract components) → Phase 3
(port engine). Dead-click count is the loop's health metric: 18 → 1.
