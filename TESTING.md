# Testing EMERGENCE

Run before every commit. No dependencies, no build step:

```bash
node test.js      # or: npm test
```

Green means the build functions **and** is still completable. The suite exits non-zero on any failure, so it can gate commits/CI.

## How it works

The game ships as one self-contained HTML file with all logic in a single IIFE. The harness extracts that script, runs it against a tiny headless DOM/canvas/localStorage shim, and reads internals through a test seam (`window.__EMERGENCE_TEST__`, exposed only when that flag is set, so production is untouched). `freshGame()` re-evals the script for an isolated state per test group.

## What it checks (current sections)

**Correctness**
- `fmt` formatting across magnitudes
- Cost + bulk-buy math (monotonic, exact `x10`, `MAX` spends down to < next unit cost)
- Purchase path (x1 deducts exact, unaffordable = no-op)
- **Origins:** converter chain + starvation; upkeep drains (Scriptorium burns Ore, Smelter burns Knowledge — "additions contain subtractions"); the Wheel tradeoff; the discovery web (prereqs, cross-gates, multi-resource costs, effects); fabrication completes the era
- **Symbolic:** Era-2 carryover seed (the Logic Machine seeds Rules/Rulesets from Knowledge so it isn't a cold-start stall — regression for the old `firstAuto` id collision); theorem-proving process (aim Inference at a proof, completes over time, lemmas repeat); Inference cap + Capacity lemma; tech effects; compile→Axioms
- **Statistical:** Training Focus (Fit raises accuracy + grows the gap; Generalize shrinks it; Explore discovers Methods); Regularization strengthens the cure; effective accuracy = accuracy − gap (+ Ensembles); experiments yield Insight
- Save/load roundtrip; offline catch-up (8h cap); no-NaN production
- **Anti-strobe guard:** idle ticks must NOT rebuild the era DOM (build-once/update-in-place)

**Progression (full chain):** `testProgression` autoplays the whole arc — Origins → Symbolic → Statistical → Deep → Foundation → **Emergence** (steering Training Focus, reaching back to Origins for Silicon, allocating Compute for breadth, then recursing to the emergent agent) and asserts every era handoff fires; prints per-era timings. ~85 tests total.

**Pacing models** (diagnostic tables, not pass/fail beyond "completes")
- `reportPacing()` — Origins via a human-model autoplayer at 1/2/4 clicks-per-second, beats vs the 30/60/120/300s targets
- `reportPacingEra2()` — Symbolic the same way (tree/compile/knowledge/metalogic/done + compiles/axioms used)

These are the regression net for tuning: change a number in `CFG`, re-run, read off "still completable?" and "minutes per beat at human click rates." (The autoplayers click; real idle play is slower — that's the gap the in-game Run Recorder closes.)

## Adding tests

When you add a mechanic: (a) add a correctness section using the `ok()/near()` helpers, exposing any new functions via the test seam in `emergence.html`; (b) extend the relevant pacing autoplayer (`runOrigins` / `runSymbolic`, or a new `runStatistical`) and its report so the new era is covered.
