# TODO — v3 unified build (single durable source of truth)

> The live checklist for `emergence-v3-unified.html` + `v3-kit/`. This is the DURABLE to-do
> (the in-session Task list is just the working view of the current sprint and does not persist).
> Asset needs go to `ART-PROMPTS.md`. Feedback sources: `alpha tests/July 1 2026 - Cody/unified-eyeball.md`.
> Last updated 2026-07-01 (Cody's full-arc eyeball of the unified merge).

## Status
- Phase 2 (kit) ✅ · Phase 3 core (5 eras merged into one file) ✅ committed `2b129df` (local, unpushed).
- Cody played the full arc [capture `20260701_005934`]. Direction VALIDATED ("chase the factory/flow-chart
  idea — satisfactory/factorio"); emergence rupture is "much fun". Three problems undercut it → below.

## P0 — ONE SCREEN PER ERA (load-bearing; the Flow-Board law is broken)
- [ ] **Deep** (game-breaking): triangle mixer + 3 run lanes + gauges must be visible TOGETHER — the
      steering loop is un-reactable when you must scroll ([20:42],[23:14]). ← **resurfaced deferred item**
      (CLAUDE.md flagged "Deep's 3rd run-lane below the fold at 1280").
- [ ] **Statistical**: Focus dial on-screen without scrolling ([14:54]).
- [ ] **Origins / Symbolic**: tighten to remove the mild scroll ([01:51],[12:23]).
- [ ] Verify all eras at a REAL viewport (~1280×800), not the tall 1400 window that hid this.

## P1 — must-fix UI bugs (quick, unambiguous)  ✅ DONE 2026-07-01
- [x] Origins: pause button overlaps the Build button → now inline in the node name row ([04:09]).
- [x] Origins: button text overflows (Kiln etc) → discovery buttons wrap now ([02:47]).
- [x] Statistical: Focus arrows fixed — Fit & Explore VAL ▼, only Generalize VAL ▲ ([19:20]).
- [x] Statistical: killed the "trial" float spam on RUN TRIAL ([16:15]).
- [x] Music: default volume 0.4 → 0.22 ([07:23]).
- [→] Deep: triangle deformed ([24:46]) — folded into P0 Deep one-screen redesign (owns that layout).

## P2 — reduce text / teach visually (recurring: "too much text, small text")
- [ ] Symbolic: tissue prose → show Knowledge→Rules handoff visually ([07:45]); rewrite clumsy contradiction copy ([11:14]).
- [ ] Foundation: dedupe repeated "wake/wakes aligned" copy ([36:20]); trim aftermath agent-stream density ([38:00]).

## P3 — back-half agency (Deep + Foundation go passive)
- [ ] Deep: more to do + make the steering loop reactable (partly solved by P0 one-screen) ([26:18],[26:39]).
- [ ] Foundation: pre-emergence has nothing to do after caps are bought → add a decision/interaction ([36:33]).

## P4 — delight / story (Cody's ideas)
- [ ] Origins goal glow ramps with progress (exponential; turns on at the end) ([06:14]).
- [ ] Fabricate button font-morphs to the NEXT era's font (Origins→Symbolic) ([06:59]). ← **resurfaced deferred item** (CLAUDE.md task #25).
- [ ] Small end-of-era cinematics (reward + look-ahead) ([13:17]). → may need ASSETS (see ART-PROMPTS.md).
- [ ] Symbolic: gate early rulesets so the first inference climb is VISIBLE (not a blink) ([08:09]); inference animation ([09:30]).
- [ ] Deep: make Build Compute Node the hero (more prominent than supply buttons) ([24:08]); supply visibly eases steering ([22:39]).
- [ ] Foundation: substrate tiles DO something when the agent operates prior eras (storytelling) ([38:21],[39:16]); ending needs a finale moment ([40:20]).

## Phase-3 remainder (from the merge plan)
- [~] Revert 3 economy stand-ins → real cross-era reach-back (supply was doubled):
  - [x] **Statistical** — removed fake Foundry (Data→Silicon valve); Silicon now from the real Origins pool; supply bus = "Silicon from Origins →" reach-back nav. (2026-07-01)
  - [x] **Deep** — removed 4 stand-in producers; supply-bus buttons now BUILD the real Origins/Statistical producers (paid in Silicon, Cody's "build-here" choice); chainPerFoundry reads real S.e1.foundry. Verified feedstocks flow. (2026-07-01)
  - [x] **Foundation** — removed capIncome/seedBreadth + stubs; Scale climbs on real Deep breadth (S.e4), Capability from Deep's real production (Tool Access = +60% Deep-coupled bonus), proposals read real S.e3/e1/e2/S.knowledge/S.rules. Verified Scale climbs + Capability flows. (2026-07-01)
  - ✅ ALL 3 reverts done. Seams in `v3-kit/KIT.md`. **NEEDS a Cody playtest to confirm no starvation + tune** the real supply chain (earlier eras must sustain later ones).
- [ ] Rebuild the test suite for the merged v3 (`node test.js`; keep the no-idle-rebuild guard + cross-era reach-back).
- [ ] Inline kit.css/kit.js + era modules into the single file (single-file constraint) — final packaging.
- [ ] Then: Cody records → iterate → swap v3 → `emergence.html`, push (auto-deploys). DO NOT push until Cody says.

## Deferred from PRIOR sessions — still open (verify relevance before doing)
- [ ] Pacing redistribution (Origins/Deep long; Statistical/aftermath short) — tune from a real run.
- [ ] Foundation aftermath rework RR8/RR9/RR10 (Alignment-vs-Control distinct; plateau/breakthrough gates so it can't collapse in ~57s).
- [ ] Open design calls: RR6c (shift changes optimal Focus), full RR7 benchmark readout, R4.32 backbone-resource-per-era through-line.
- [ ] RR5 `chainPerFoundry` value (3%/foundry) needs a playtest tune.
- NOTE: the round-4/5 items shipped into the OLD `emergence.html`; re-confirm each still applies to the v3 unified build before actioning.

## Art — DONE 2026-07-01
- [x] 20 ChatGPT images (10 assets × 2 passes) keyed to transparent + filed in `images/keyed-2026-07-01/`.
- [x] Picked the better pass per pair (see `images/keyed-2026-07-01/MAPPING.md`) + installed (512px) over the
      10 assets: era4-sigil, icon-node, e4-vision/language/reasoning, era5-sigil, cap-selfModel, cap-transfer,
      cap-worldModel, agent-emergent. Wired cap-transfer art → Memory Continuity cap. Verified Deep + Foundation.
- Still glyph-fallback (no art generated): Foundation caps toolAccess, recursivePlanning, interpret.

## Assets needed from ChatGPT → track in ART-PROMPTS.md
- Foundation caps still on glyphs: **Tool Access, Recursive Planning, Interpretability** (no prompt/art yet).
- End-of-era cinematic art/motion (if we go beyond CSS) — P4 item above.
