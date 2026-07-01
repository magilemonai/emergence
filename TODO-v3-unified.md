# TODO — MASTER / OVERALL list (the single durable source of truth)

> **This is THE master todo for the project.** Every playtest capture is synthesized *into* this file
> (see `/process-capture` step 3): new items added, finished items marked `[x]` with a date, dedup'd
> against what's here. The in-session TaskCreate list is only an ephemeral working view of the current
> sprint and must never be the sole record. Legacy `TODO-*.md` + `CLAUDE.md` OPEN sections are being
> folded in as their items resurface.
> Scope right now = the v3 unified build (`emergence-v3-unified.html` + `v3-kit/`). Asset needs →
> `ART-PROMPTS.md`. Feedback parses live in `alpha tests/<date> - <person>/`.
> Last updated 2026-07-01 (playtest #2 processed).

## Status
- Phase 2 (kit) ✅ · Phase 3 core (5 eras merged into one file) ✅ committed `2b129df` (local, unpushed).
- Cody played the full arc [capture `20260701_005934`]. Direction VALIDATED ("chase the factory/flow-chart
  idea — satisfactory/factorio"); emergence rupture is "much fun". Three problems undercut it → below.

## Playtest #2 (2026-07-01 PM · `20260701_130925` · `alpha tests/July 1 2026 - Cody/unified-playtest-2.md`)
Wins he called out: Fabricate font-morph, Statistical "fits on one page — great", the real build-here
reach-back ("kind of fun"), triangle steering ("fun"), cross-era nav.
- [x] Bug: Symbolic header sigil was broken (`sigil:''`) → wired `assets/sigil-symbolic.png`.
- [x] Bug: VALIDATION blew past TRAINING (ensembles) → capped eff ≤ acc.
- [x] Bug: music still loud → 0.22 → 0.15.
- [x] Deep ADVANCE glow → violet (teases Foundation), was green.
- [x] Deep frozen/locked run → whole-block "held" visual (desaturate + blue frost + ❄ HELD), not just text.
- [x] Deep corner-glow: the run needing compute pulses its triangle corner in its colour (steer toward it).
- [x] Deep heat retuned to actually bite (heatRise 8→22, throttle 88→70; test asserts it hits WARM). NEEDS playtest feel-check.
- [ ] Deep: replace remaining text alerts (orch line / event banner) with more color-driven visuals ([13:29]).
- [ ] Symbolic: TOO MUCH TEXT (strongest complaint) + Axiom progress unclear — task #13.
- [ ] Back-half passivity: Deep tech tree thin + Foundation pre-emergence "just watching" — task #14 (design, needs Cody).
- [ ] Origins commission below fold ([01:42]); Statistical secondary panels still scroll.

## P0 — ONE SCREEN PER ERA (measured @1280×800, ~713px viewport)
- [x] **Deep** (was game-breaking): triangle + 3 runs + gauges side-by-side (approved mock); overflow +569→**+176**. ([20:42],[23:14])
- [x] **Statistical Focus dial** on-screen: compacted the pinned stage; primary loop (scatter+RUN TRIAL+dial+goal) fits. ([14:54])
- [x] Global density pass (kit padding/margins) — shaved every era. Current overflow: Symbolic **+183**, Deep **+176**, Foundation **+196**, Origins **+289**, Statistical **+589**.
- [ ] **Statistical true zero-scroll**: the Experiment Board + Methods (secondary) still push +589 — relocate/collapse them.
- [ ] **Origins** (+289): trim the second lane / standing row to fit.
- [x] Verify at real 1280×800 (shoot-unified now uses it + reports overflowPx).

## P1 — must-fix UI bugs (quick, unambiguous)  ✅ DONE 2026-07-01
- [x] Origins: pause button overlaps the Build button → now inline in the node name row ([04:09]).
- [x] Origins: button text overflows (Kiln etc) → discovery buttons wrap now ([02:47]).
- [x] Statistical: Focus arrows fixed — Fit & Explore VAL ▼, only Generalize VAL ▲ ([19:20]).
- [x] Statistical: killed the "trial" float spam on RUN TRIAL ([16:15]).
- [x] Music: default volume 0.4 → 0.22 ([07:23]).
- [→] Deep: triangle deformed ([24:46]) — folded into P0 Deep one-screen redesign (owns that layout).

## P2 — reduce text / teach visually (recurring: "too much text, small text")
- [~] Symbolic: [x] rewrote the clumsy contradiction copy ([11:14]); [ ] tissue prose → show Knowledge→Rules visually ([07:45]).
- [~] Foundation: [x] deduped the repeated "wake/wakes aligned" copy (rush hint + coherence label) ([36:20]); [ ] trim aftermath agent-stream density ([38:00]).

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
- [x] Rebuilt the test suite for merged v3 → `node test-v3.js` (**50 green**): per-era economy, cross-era reach-back (no fake foundry / chainPerFoundry reads real e1 / Scale from real e4 / no capIncome), full-chain no-NaN, build-once determinism. `node test.js` (shipped emergence.html) still **200 green**. (2026-07-01)
- [ ] Inline kit.css/kit.js + era modules into the single file (single-file constraint) — final packaging. (fold `test-v3.js` into `test.js` when v3 swaps into emergence.html)
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
