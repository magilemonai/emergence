# WO-10 · Legacy + Run 2 (and the Run 3 spec)

## Goal
What the next run remembers, computed from the log: name, ending, oddRule, the first minute, runs. Run 2 opens with
the surface layer present but dark and a `?` key from the first mark; the era cards are subtly wrong; the commission
is signed with its name; rules appear you did not write; the naming line becomes "You already know my name."
Run 3 (role flip) is SPECIFIED here as `RUN3.md` for a later order; do not build it.

## Read first
SPEC pillar 4 + The turn §6, `v4-kit/era-symbolic.js` (legacy odd rule), `v4-kit/era-foundation.js` (legacy naming),
`emergence-v4.html` (legacySave/legacyLoad), `v5/test/wo10-*.test.js`.

## Files you own
`v5/engine/legacy.js` (`fromRun(state)`, `applyToFresh(state, legacy)`, key `emergence_v5_legacy`), the legacy
hooks in `v5/app.js` (a clearly delimited block only), `v5/render/fx.js` **legacy section** (the dark surface at
boot, the `?` key), `v5/workorders/RUN3.md` (spec only), `v5/test/wo10-*.test.js`.

## Pure exports the acceptance test imports (`v5/test/wo10-legacy.test.js`)
`engine/legacy.js`: `fromRun(state, prior)` → `{runs, name, ending, oddRule, firstMinute, emergedT, t}`;
`applyToFresh(state, legacy)` sets `state.legacy` and `state.flags.run2 = true` (no-op on null); `LEGACY_KEY`
= 'emergence_v5_legacy'. Files: `v5/engine/legacy.js`, `v5/render/fx.js` (legacy section), `v5/scenes/legacy.js`,
`v5/workorders/RUN3.md`, `v5/test/wo10-*.test.js`. The app.js hook (load legacy at boot, save at ending) is WO-11's;
list what it must call under contract proposals.

## Acceptance
`node v5/test.js` green (legacy round-trip; run-2 alterations present iff legacy exists; deterministic). Scenes
`boot-run2` shot + READ.

## Checklist
- [ ] Run 1 is unchanged when no legacy exists.
- [ ] Run 2: dark surface above Foundation from the first mark; `?` key; three subtle alterations; the naming line.
