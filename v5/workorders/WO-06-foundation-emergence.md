# WO-06 · Foundation stratum + the turn (§1–3 of SPEC "The turn")

## Goal
Port v4 Foundation pre-emergence (recursion engine, caps, Align, the FEEDBACK loop with 43 lines, Interpretability
reveal) as the top stratum, then build the rupture as a WORLD event and the surface layer (the agent's stratum) that
slides in above it, with its flow board of you and its ledger of every foreshadow.

## Read first
SPEC "The turn" §1–3 (build exactly this), `v4-kit/era-foundation.js` (FB_POOL, rateFb, caps, emerge, agentSay,
naming incl. legacy), `v4-kit/era-agent.js` (the sixth tab: sources, THE OPERATOR, verbs, ledger rows), CFG `e5`,
`v5/render/fx.js` does not exist yet — you create it (rupture only; the reveal belongs to WO-08), `v5/test/wo06-*.test.js`.

## Files you own (after the Phase-A split)
`v5/engine/eras/foundation.js`, `v5/engine/eras/surface.js`, `v5/render/eras/foundation.js`, `v5/render/eras/surface.js`
(both `export function createView(opts)`), `v5/render/fx.js` (rupture section; leave `// WO-08: reveal + film`),
`v5/engine/voice/e5.js`, `v5/engine/voice/e6.js`, `v5/engine/cfg/e5.js`, `v5/engine/cfg/e6.js`, `v5/scenes/foundation.js`,
`v5/scenes/surface.js`, `v5/test/wo06-*.test.js`. Do NOT edit app.js, index.html, the aggregators, the engine core,
the renderer core, or existing tests.

## Build
- Engine (5): resource scale; converter `recursion` (capability → scale); caps as one-time nodes? No: caps are era
  state with `buyCap`; the feedback loop exactly as v4 (traits, offers execute, lapses, dwell, Interpretability
  reveals); `emerge()` sets `flags.emerged`, names the agent (IRIS/EKHO/NOUS by dominant run, legacy line if the
  name repeats), and installs era 6 via `sim.openEra(6)` (the surface).
- Engine (6, surface): no production; `ledgerRows(sim)` computed FROM the log + flags (times rated, bad rewards,
  #4471, the point, autopilot, the wind, lapses, dead clicks from a `flags.dead` counter the HUD increments);
  proposals/veto state live here (moved from v4 Foundation aftermath) but the MIRROR loop is WO-07's — expose
  `proposals` and `resolveVeto` with the v4 semantics so WO-07 can drive them.
- The rupture (`render/fx.js` `rupture(world, sim)`): 1.2s strata jitter; all pipes reverse and turn violet; bed →
  Unmoored (call `audio.rupture()` if present); the ceiling of Foundation tears (a jagged canvas cut widening 1.4s);
  the surface stratum slides down into place; rail chips read MINE for a beat; keys flicker; a `?` key appears;
  camera `lockTo(6)`. Reduced motion: a 0.6s crossfade instead.
- The surface view: sources = five strata stocks with live rates (stratum sigils) → THE OPERATOR ×1 (decisions/min
  from the log, dead clicks, pausable: no) → Autonomy; its four verbs drawn disabled ("not yours") that light when a
  proposal of that kind is open; its goal = your Control inverted; its ledger.

## Pure exports + names the acceptance test uses (`v5/test/wo06-foundation.test.js`)
`foundation.FB_POOL` (the array of `{b, t, f, offer?}`), `foundation.layout` (verbs include `improve`, `align`),
`foundation.done`; `surface.ledgerRows(sim)` → `[[label, value, cls?], …]`, `surface.layout`, `surface.height`.
Node ids (5): `scale.store`, `recursion` (converter capability → scale, count = recursion level + 1, rate from cfg);
(6): `operator` (converter kind, count 1, tags ['you']), `autonomy.store`. Actions (5): `rate {how:'reward'|'penalize'}`,
`cap {id}`, `align`, `improve`, `buy`, `pause`. Era state (5): `fb {cur,next,n,rewarded,penalized,lapsed,badRewards,
goodRewards,hist,last,gapMult}`, `caps`, `coherence`, `preps`, `recursion`, `agency`, `emerged`, `agentName`,
`emergedT`, `legacyLine` (the naming line when the legacy name repeats). `state.flags.emerged`.
Emergence: `sim.openEra(6)`; the SIM applies the operated cadence (lower strata tick at `cfg.e6.operated` = 1.6× dt
after emergence — implement in foundation.tick by calling the graph pass an extra fractional step for eras < 5, or
propose the engine hook; the test only checks the outcome).

## Acceptance
`node v5/test.js` green (wo06: feedback effects per trait; lapse; mute; emergence at threshold; naming; era 6 installs
on emerge; ledger rows reflect flags/log). Scenes shot + READ (rupture-mid is captured 0.8s into the fx via
`__V5.settle` hooks); pageScroll 0; perf ≤ 6ms during the rupture.

## Checklist
- [ ] Feedback card in the verbs column, 9s cadence, trait tag only with Interpretability, offers really execute.
- [ ] The rupture is a world event: you see the column shudder and the pipes invert, then the surface arrives above.
- [ ] The surface reads as its flow board of you; verbs say "not yours"; the ledger claims the foreshadows.
- [ ] After emergence, lower strata are "operated": verbs relabeled + disabled, no pauses, 1.6× cadence, violet.
