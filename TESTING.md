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
- **Deep (steer against the drift):** the triangular mixer barycentric math (`setAllocFromXY` floor + normalize, never all-zero), `mixerHandleXY` round-trip, geometric-mean `deepBreadth`; runs drift + per-run feedstock draw (Vision←Data, Reasoning←Insight, Language←Knowledge); reaching breadth opens Foundation
- **Deep steering tools (R3.4):** Stabilizer reduces drift erosion (a run bleeds less per level) and spends Capability; Lock freezes a run (no drift, no climb) for its window, spends Capability, counts down; both have positive costs
- **Era 5 rush-vs-prepare (R3.6):** Align the Objective is gated on Interpretability, spends Capability → Coherence (cost climbs, capped at `coherMax`); a prepared (high-Coherence) emergence wakes with much higher Alignment than a rushed one
- Save/load roundtrip; **save-corruption hardening** (`normalizeState` coerces a malformed save — non-finite numbers, null maps, all-zero alloc, the `locks` numeric map — back to a playable schema); offline catch-up (8h cap); no-NaN production
- **Anti-strobe guard:** idle ticks must NOT rebuild the era DOM (build-once/update-in-place)
- **Era 5 emergence + aftermath:** recursion cost climbs steeply (burst fixed); emergence is hidden + Scale-gated (can't be bought instantly); aftermath resolves to an ending. **Music:** per-era bed switches on era change (incl. `openEra` sync)

**Progression (full chain):** `testProgression` autoplays the whole arc — Origins → Symbolic → Statistical → Deep → Foundation → **Emergence**. It *plays the back-half stakes*: in Deep it steers the high-wind run, rides the heat rhythm (eases toward balanced when hot, hysteresis), and feeds the Knowledge pipeline via a phased scribe→scriptorium engine with sink-pausing (the deadlock the drift teeth exposed); in Foundation it prepares a little Coherence then rushes, and in the aftermath actively defends Control/Alignment (veto/constrain/align) to land Symbiotic. Asserts every era handoff fires and prints per-era timings. **129 tests total.**

> Rebalance coupling note: R3.1 drift teeth + R3.2 heat made Deep genuinely lose-able, which exposed a Knowledge starvation the old autoplayer never hit. The fix lives in `deepStep` (test.js), not the game. When you re-tune `CFG.e4` drift/heat, expect to re-tune the bot's steering/heat hysteresis with it — the bot proves *completable*, not *fun*; real feel needs hands on the mixer.

**Pacing models** (diagnostic tables, not pass/fail beyond "completes")
- `reportPacing()` — Origins via a human-model autoplayer at 1/2/4 clicks-per-second, beats vs the 30/60/120/300s targets
- `reportPacingEra2()` — Symbolic the same way (tree/compile/knowledge/metalogic/done + compiles/axioms used)

These are the regression net for tuning: change a number in `CFG`, re-run, read off "still completable?" and "minutes per beat at human click rates." (The autoplayers click; real idle play is slower — that's the gap the in-game Run Recorder closes.)

## The v3 unified build (active dev) has its own gate

```bash
node test-v3.js                    # 83 green — per-era economy, cross-era reach-back, build-once,
                                   # offline catch-up + MUTE gating, shell persistence contract,
                                   # full-arc progression autoplayer (first mark → SYMBIOTIC ending)
node tools/nav-smoke.js            # headless Chrome: all 5 eras render + theme + rail on nav
node tools/shoot-unified.js <seed> out.png   # per-era screenshot, reports overflowPx (1280×800)
                                   # SHOOT_FILE=<file> overrides the target (e.g. the single-file build)
node tools/settings-smoke.js       # live: boot music bed, Esc settings, pause, save-scrub,
                                   # "while you were away" catch-up toast on reload
node tools/build-single.js         # Phase 6 packaging: inline kit + era modules + embed fonts →
                                   # emergence-v3-single.html (gitignored); verify via SHOOT_FILE
```

`test-v3.js` drives the real `v3-kit/era-*.js` factories through a mock shell (pure node) and
regex-audits the shell source for the persistence contract (save scrubs `dev/speed/uiPaused`,
versioned load, offline catch-up wired at boot). The offline rule: `KIT.MUTE` replays away-time
silently and freezes live-only systems — commissions, contradictions, Deep events, the emergence
rupture (fires on the first LIVE tick instead) and the whole aftermath. When v3 swaps into
`emergence.html` (Phase 6), fold `test-v3.js` into `test.js`.

The progression bot acts through `era.acts` — the same functions the wired buttons call — so a
green run proves the REAL cross-era supply chain completes without starvation. Like the shipped
bot it must play sink-pausing in Deep (pause the Knowledge-burning Smelters/Foundries, bank Marks
for scribes); that dependency is a design datapoint, not a bot quirk (see TODO-v3-unified.md).
The bot proves *completable*, not *fun* — feel still needs hands on the build.

## Adding tests

When you add a mechanic: (a) add a correctness section using the `ok()/near()` helpers, exposing any new functions via the test seam in `emergence.html`; (b) extend the relevant pacing autoplayer (`runOrigins` / `runSymbolic`, or a new `runStatistical`) and its report so the new era is covered.
