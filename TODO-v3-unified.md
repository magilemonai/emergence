# TODO — MASTER / OVERALL list (the single durable source of truth)

> **This is THE master todo for the project.** Every playtest capture is synthesized *into* this file
> (see `/process-capture` step 3): new items added, finished items marked `[x]` with a date, dedup'd
> against what's here. The in-session TaskCreate list is only an ephemeral working view of the current
> sprint and must never be the sole record. Legacy `TODO-*.md` + `CLAUDE.md` OPEN sections are being
> folded in as their items resurface.
> Scope right now = the v3 unified build (`emergence-v3-unified.html` + `v3-kit/`). Asset needs →
> `ART-PROMPTS.md`. Feedback parses live in `alpha tests/<date> - <person>/`.
> Last updated 2026-07-01 (playtest #2 processed; session-services parity pass done same day).

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
- [~] Symbolic: [x] Axiom progress now surfaced (live "Banks +N Axioms · next +1 at Y rules" hint under Compile) ([06:24]). (2026-07-01)  ·  [ ] TOO MUCH TEXT (strongest complaint) — tissue prose still needs a visual pass — task #13.
- [ ] Back-half passivity: Deep tech tree thin + Foundation pre-emergence "just watching" — task #14 (design, needs Cody).
- [ ] Origins commission below fold ([01:42]); Statistical secondary panels still scroll.

## P0 — ONE SCREEN PER ERA (measured @1280×800, ~713px viewport)
- [x] **Deep** (was game-breaking): triangle + 3 runs + gauges side-by-side (approved mock); overflow +569→**+176**. ([20:42],[23:14])
- [x] **Statistical Focus dial** on-screen: compacted the pinned stage; primary loop (scatter+RUN TRIAL+dial+goal) fits. ([14:54])
- [x] Global density pass (kit padding/margins) — shaved every era. Fresh sweep 2026-07-01 PM: Origins **+289**, Symbolic **+164**, Statistical **+515**, Deep **+176**, Foundation pre **+196**, aftermath (seedpost) **0**, ending recap (seedend) **+714**.
- [ ] **Statistical true zero-scroll**: the Experiment Board + Methods (secondary) still push +515 — relocate/collapse them. (Tried a Methods relocation once, it backfired — wants Cody's eye on collapse-vs-move.)
- [ ] **Origins** (+289): trim the second lane / standing row to fit.
- [ ] **Ending recap (seedend) is +714** — probably fine to scroll a read-only scorecard, but flag it for Cody's call.
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
- [x] Foundation: [x] deduped the repeated "wake/wakes aligned" copy (rush hint + coherence label) ([36:20]); [x] trimmed aftermath agent-stream density (agentSay log cap 6→4) ([38:00]). (2026-07-01)

## P3 — back-half agency (Deep + Foundation go passive)
- [ ] Deep: more to do + make the steering loop reactable (partly solved by P0 one-screen) ([26:18],[26:39]).
- [ ] Foundation: pre-emergence has nothing to do after caps are bought → add a decision/interaction ([36:33]).

## P4 — delight / story (Cody's ideas)
- [x] Origins goal glow ramps with progress (exponential --wake; .ready pulses at the gate) ([06:14]). (2026-07-01)
- [x] Fabricate button font-morphs to the NEXT era's font (Origins→Symbolic VT323) ([06:59], was CLAUDE.md task #25). (2026-07-01)
- [ ] Small end-of-era cinematics (reward + look-ahead) ([13:17]). → may need ASSETS (see ART-PROMPTS.md).
- [ ] Symbolic: gate early rulesets so the first inference climb is VISIBLE (not a blink) ([08:09]) — pacing tune, wants playtest; inference animation ([09:30]).
- [x] Deep: Build Compute Node promoted to hero (.verb-hero, brighter/bigger than supply buttons) ([24:08]). (2026-07-01)  ·  [ ] supply visibly eases steering ([22:39]) — design.
- [ ] Foundation: substrate tiles DO something when the agent operates prior eras (storytelling) ([38:21],[39:16]); ending needs a finale moment ([40:20]). — design, needs Cody.

## Session services — parity with the shipped game (done 2026-07-01 PM, no playtest needed)
All engineering, ported from Cody-approved shipped features; `node test-v3.js` now **75 green** +
`tools/settings-smoke.js` (10 live checks). Feel items flagged below still want a playtest look.
- [x] **Offline catch-up** (8h cap): away time replays muted + deterministic; "WHILE YOU WERE AWAY" toast.
      Live-only systems freeze under `KIT.MUTE`: Origins commissions, Symbolic contradictions, Deep events,
      the emergence rupture (fires on the first LIVE tick after you return — you see it), the whole aftermath.
- [x] **Settings on Escape** (port of shipped R4.9): Pause/Resume (+ pause pill), Restart run (confirm),
      Music + Sound volume sliders (persisted). ⚙ button on the rail next to ♪.
- [x] **Save hardening**: versioned save; scrubs session-only `dev/speed/uiPaused` (reload no longer resumes at 50× dev speed).
- [x] **Music fixes**: bed src now set at boot (♪ was dead until the first era switch); ♪ state + volumes persist;
      persisted-on music auto-resumes on first click (autoplay policy); post-rupture nav keeps the Unmoored bed (`bedKey`).
- [ ] PLAYTEST NOTE: Deep drift erosion still runs offline (matches shipped "the system kept running") —
      8h away can bleed the runs low. If that feels punishing on a real return, gate erosion under MUTE too.

## Phase-3 remainder (from the merge plan)
- [~] Revert 3 economy stand-ins → real cross-era reach-back (supply was doubled):
  - [x] **Statistical** — removed fake Foundry (Data→Silicon valve); Silicon now from the real Origins pool; supply bus = "Silicon from Origins →" reach-back nav. (2026-07-01)
  - [x] **Deep** — removed 4 stand-in producers; supply-bus buttons now BUILD the real Origins/Statistical producers (paid in Silicon, Cody's "build-here" choice); chainPerFoundry reads real S.e1.foundry. Verified feedstocks flow. (2026-07-01)
  - [x] **Foundation** — removed capIncome/seedBreadth + stubs; Scale climbs on real Deep breadth (S.e4), Capability from Deep's real production (Tool Access = +60% Deep-coupled bonus), proposals read real S.e3/e1/e2/S.knowledge/S.rules. Verified Scale climbs + Capability flows. (2026-07-01)
  - ✅ ALL 3 reverts done. Seams in `v3-kit/KIT.md`. Starvation half PRE-VERIFIED by the new progression
    bot (below); the **tune/feel half still needs Cody's playtest**.
- [x] Rebuilt the test suite for merged v3 → `node test-v3.js` (**83 green**): per-era economy, cross-era reach-back (no fake foundry / chainPerFoundry reads real e1 / Scale from real e4 / no capIncome), full-chain no-NaN, build-once determinism, offline catch-up + MUTE gating, shell persistence contract, full-arc progression. `node test.js` (shipped emergence.html) still **200 green**. (2026-07-01)
- [x] **Progression autoplayer** (2026-07-01 PM): plays the whole arc through a real action seam (`era.acts`)
      — Origins 1.9m → Symbolic 6.1m → Statistical 12.4m → Deep breadth 24.4m → EMERGENCE 29.1m →
      SYMBIOTIC 31.6m, 0% feedstock starvation. **Two findings for the playtest:**
      - [ ] Deep's Knowledge pipeline REQUIRES sink-pausing play (pause Smelters/Foundries when Knowledge is
            tight, bank Marks for scribes) — without it the Language run starves ~100% and Deep deadlocks.
            A real player must DISCOVER the pause buttons → if Cody starves there, the affordance needs
            surfacing (design, his eye).
      - [ ] Deep is the longest era even at bot speed (12.1m vs Origins 1.9m) — pacing signal consistent
            with the old "Deep long" finding; confirm on his real run before tuning.
- [x] Inline packaging is now a **repeatable build script** — `node tools/build-single.js` inlines kit.css/
      kit.js/era modules + embeds all fonts (base64 woff2, incl. newly fetched Inter) into
      `emergence-v3-single.html` (475 KB, gitignored). Verified headlessly: probes byte-identical to the
      modular build, zero console errors. Iteration stays modular; Phase 6 = build → verify → swap → push.
      (fold `test-v3.js` into `test.js` when v3 swaps into emergence.html)
- [ ] Then: Cody records → iterate → build-single → swap v3 → `emergence.html`, push (auto-deploys). DO NOT push until Cody says.

## Deferred from PRIOR sessions — relevance AUDITED against v3 (2026-07-01 PM)
- [ ] Pacing redistribution — still relevant but the old numbers are from the v2 build; v3 pacing is
      entirely unmeasured. Needs a full v3 run (REC download-run) before touching any CFG.
- [ ] Foundation aftermath rework RR8/RR9/RR10 — still unaddressed in v3 (the aftermath carries the R3.5
      stakes but Alignment-vs-Control are not mechanically distinct, and there are no plateau gates).
      FOLD INTO the P3 Foundation design session with Cody — same conversation as pre-emergence agency.
- [ ] RR6c (shift changes optimal Focus) + full RR7 benchmark readout — design calls, Cody's; both still
      apply to v3 (v3 Statistical has shifts; the RR7-light tidbits partially carried via Foundation TIDBITS).
- [x] R4.32 backbone-resource-per-era through-line — v3's shared POOL largely IS this (marks→…→scale all
      top-level, color-coded on the rail, real reach-back). Consider it absorbed by the paradigm.
- [ ] RR5 `chainPerFoundry` (3%/foundry) — carried into v3 (test asserts it reads the real `S.e1.foundry`);
      tune from a real run.

## Art — DONE 2026-07-01
- [x] 20 ChatGPT images (10 assets × 2 passes) keyed to transparent + filed in `images/keyed-2026-07-01/`.
- [x] Picked the better pass per pair (see `images/keyed-2026-07-01/MAPPING.md`) + installed (512px) over the
      10 assets: era4-sigil, icon-node, e4-vision/language/reasoning, era5-sigil, cap-selfModel, cap-transfer,
      cap-worldModel, agent-emergent. Wired cap-transfer art → Memory Continuity cap. Verified Deep + Foundation.
- Still glyph-fallback (art pending): Foundation caps toolAccess, recursivePlanning, interpret — **prompts now written** in ART-PROMPTS.md item 5b (violet line-art, key to `assets/cap-<id>.png`). (2026-07-01)

## Assets needed from ChatGPT → track in ART-PROMPTS.md
- Foundation caps still on glyphs: **Tool Access, Recursive Planning, Interpretability** — prompts READY (ART-PROMPTS.md 5b); just needs Cody to generate + drop the 3 images in `images/`, I key + wire to `CAP_ICON`.
- End-of-era cinematic art/motion (if we go beyond CSS) — P4 item above.
