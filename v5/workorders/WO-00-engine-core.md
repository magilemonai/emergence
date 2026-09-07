# WO-00 · Engine core (`v5/engine/sim.js`, `graph.js`, `cfg.js`, `voice.js` shape)

## Goal
Implement `engine/CONTRACT.md` exactly, as a pure, deterministic, replayable graph economy. No DOM, no time, no
randomness outside `sim.rng()`. This is the foundation every stratum runs on; correctness and determinism matter
more than cleverness.

## Read first
`v5/SPEC.md` (pillars 2 and 4), `v5/ARCHITECTURE.md` ("The engine model"), `v5/engine/CONTRACT.md`,
`v5/engine/types.js`, `v5/test/wo00-engine.test.js` (your acceptance test — read every assertion; it also documents
the expected conversion math), `v5/test/perf.test.js`, `v5/test/lint.test.js`.
For the conversion semantics being ported, read `v4-kit/era-origins.js` `produce()` (min-of-inputs draw, upkeep as a
second input port, pause flags) — port the SEMANTICS into the generic graph pass; do not port Origins itself.

## Files you own
`v5/engine/sim.js`, `v5/engine/graph.js`, `v5/engine/cfg.js`, `v5/engine/voice.js` (shape only: export an object
of per-era line tables, all empty except a comment), `v5/test/wo00-*.test.js` (your extra unit tests).

## Build
1. `graph.js`: `deriveEdges(state)` (store→converter/sink inputs; converter/source outputs→store; `riser:true` when
   the store's era differs from the node's era; the store for a resource = the store node whose `res` matches in
   the resource's own era), `tickGraph(state, dt)` (order: era ascending then `state.nodeOrder`; sources add
   `count × rate × dt × Πmult`; converters: desired per output = `count × rate × dt × Πmult`, limiting factor =
   min over inputs of `available / (count × inRate × dt × Πmult)` clamped to [0,1], consume `factor × demand` per
   input, produce `factor × desired` per output; sinks consume; goals untouched), `edge.flow` = moved/dt for the
   tick; `state.rates[res]` = net change / dt over the whole tick.
2. `sim.js`: `createSim({cfg, eras, seed, legacy})` installing era 1 immediately; every member of the contract;
   `costOf(nodeId, n)` = Σ floor(base × growth^(count+i)); `apply` validates + logs `{...a, t: state.t}`; `replay`
   creates a fresh sim (same cfg/eras/seed), steps 0.1s, applies each logged action when `state.t >= a.t`
   (actions logged at the same t apply in log order BEFORE the next tick), stops at `until`; `rng` = mulberry32;
   `snapshot/restore` via JSON round-trip; `openEra(n)` installs + `open` + sets `era/maxEra`; `voice(era)`;
   `muted/setMuted`; `available()` enumerates `actions` of the era and returns `{type, era}` for each whose `can`
   returns true with no args plus, for `buy`/`pause`, one entry per node that `can` (`{type:'buy', node, n:1}`).
3. `cfg.js`: `export default { tickMax: 0.5, e1: {}, e2: {}, e3: {}, e4: {}, e5: {}, e6: {} }` with a header
   comment that every tunable in the game lives here (eras fill their blocks in later orders).
4. `voice.js`: `export default { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }` + a comment quoting SPEC "the machine's voice".
5. Your own tests in `v5/test/wo00-<topic>.test.js`: at least (a) the limiting-factor math with two inputs at
   different scarcities, (b) rng determinism across two sims with the same seed, (c) `available()` shape,
   (d) `costOf` batch sums, (e) `nodeOrder` stability after add/remove.

## Acceptance
- `node v5/test.js` → all green (wo00-engine, perf, lint, and yours).
- `node v5/test.js lint` → engine purity holds.

## Checklist (put PASS/FAIL per line in your report)
- [ ] `replay` reproduces state byte-identically (the test's deep-equal) — including `rng.s`.
- [ ] A converter with two inputs where one is scarce draws BOTH inputs proportionally (no free lunch).
- [ ] `edge.flow` is per-second, zero when idle, and risers are flagged.
- [ ] `tick(5)` clamps to 0.5; `tick(0)` is a no-op that still keeps state valid.
- [ ] No `Date`/`Math.random`/timers/DOM anywhere under `engine/`.

## Out of scope
Any real era rules, rendering, saving, audio. Do not create `index.html`.
