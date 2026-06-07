# Testing EMERGENCE

Run before every commit. No dependencies, no build step:

```bash
node test.js      # or: npm test
```

Green means the build functions **and** is still completable. The suite exits non-zero on any failure, so it can gate commits/CI.

## What it checks

The game ships as one self-contained HTML file with all logic in a single IIFE. The harness extracts that script, runs it against a tiny headless DOM/canvas/localStorage shim, and reads internals through a test seam (`window.__EMERGENCE_TEST__`, exposed only when that flag is set, so production is untouched).

**1. Correctness**
- Number formatting (`fmt`) across magnitudes
- Cost + bulk-buy math: monotonic costs, exact `x10` totals, `MAX` spends down to < next unit cost
- Purchase path: `x1` deducts the exact cost, unaffordable buys are no-ops, `MAX` buys the right batch
- Save / load roundtrip (resources, building counts, era, obsolescence map, buy mode)
- Offline progress: passive income while away, 8h cap, sub-second gaps ignored
- No NaN / no negative resources after sustained production

**2. Progression (the important one)**
A milestone-driven autoplayer plays a fresh game at speed: click hard early, build income/converters to sane caps, then bank the gating resource toward each era's threshold. It must reach **every era and Emergence** within a tick budget, in order, with the legacy transitions firing. If a balance change makes the game stall or skip a milestone, this fails.

It also prints a **milestone timing report** (simulated minutes per era) plus final building counts and resources. This is the regression net for tuning: change a number in `CFG`, re-run, and read off both "still completable?" and "how long does each era take?".

### Reading the report
```
Era 2 (Statistical)   reached at   0.0m
Era 3 (Deep)          reached at   1.6m
Era 4 (Foundation)    reached at   5.0m
EMERGENCE             reached at   6.5m
final buildings: ... training=2 ...
```
Soft pacing warnings (not failures) flag runs that look too fast or too slow. Hard failures only fire on broken math or a genuinely unreachable milestone.

## Known signal to watch
The autoplayer currently wins with **training ≈ 2** — capability is carried mostly by Compute, so Training (the Era-3 verb) is under-powered. That's the next balance target (HANDOFF gap #4: Era-3 supply-chain depth). The final-buildings line in the report is where you'll see whether a fix actually makes Training matter.

## Adding tests
The autoplayer's strategy lives in `autoplayStep()`; correctness tests use a small `ok()/near()` framework. Each test group calls `freshGame()` for an isolated state. When you add a mechanic, add (a) a correctness test for its math and (b) any new milestone to the `want` list in `testProgression()`.
