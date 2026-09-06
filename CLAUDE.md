# EMERGENCE — Project State (CLAUDE.md)

> The living source of truth for this project. Auto-loaded by Claude Code each session —
> keep it current as the game evolves. Last updated 2026-09-06 (v4 "The Substrate Remembers" BUILT
> beside the live v3; v3 archived in full; v4 awaits Cody's playtest + ship call).

## ⭐ RESUME HERE — v4 "The Substrate Remembers" (built 2026-09-06, NOT yet live)

**Mandate (Cody, 2026-09-06):** *"make every single bit of it more compelling… Inscryption as inspiration…
increase the twists, the subversion, the mechanics — improve and refine… archive the current state so we
never destroy anything; only build additional versions."* Spec + rationale: **`DESIGN-v4.md`**. Master list:
**`TODO-v4.md`** (built / for-Cody's-eye / deferred). Playtest questions: `PLAYTEST-PROMPTS.md` (v4 section on top).

**Where things live (additive versions — nothing was edited or deleted):**
- **LIVE game = v3**, unchanged: `emergence.html` is still the v3 artifact of `emergence-v3-unified.html` + `v3-kit/`;
  `node test.js` still enforces that freshness. v3 is ALSO archived in full at **`archive/v3/`** (artifact, source,
  suite runnable in place, tools, slices, docs) + git tag **`v3.0-flow-board-live`**. `archive/README.md` is the ledger.
- **DEV build = v4:** **`emergence-v4.html`** (shell: CSS + `CFG` + boot) + **`v4-kit/`** (`kit.{js,css}`,
  `era-{origins,symbolic,statistical,deep,foundation,agent}.js`) + **`test-v4.js`**. Own save key (`emergence_v4`)
  and a legacy key (`emergence_v4_legacy`) that persists ACROSS runs. Open `emergence-v4.html` locally to play it.
- **Package:** `EMG_SHELL=emergence-v4.html EMG_KIT=v4-kit node tools/build-single.js emergence-v4-single.html`
  (gitignored artifact). **Ship (only when Cody says):** same command with `emergence.html` as the output, then point
  `test.js`'s freshness check at the v4 shell/kit (one-line env change), `node test.js`, commit, push (auto-deploys).

**Verification arsenal (all green as of 2026-09-06):**
| What | Command |
|---|---|
| Full gate | `node test.js` → v3 suite (92) + **v4 suite (158)** + v3 artifact freshness |
| v4 DOM smoke — drives the REAL UI through the whole arc (drawers, Compile reboot, autopilot unlock, rupture, sixth tab, operated eras, finale, legacy) | `node tools/v4-smoke.js` (35 checks; fails on any console error) |
| Any v4 screen at 1280×800 + overflowPx | `SHOOT_FILE=emergence-v4.html node tools/shoot-unified.js <seed> out.png` — seeds: `seed`, `seedsym`/`seedsymc`, `seedstat`, `seeddeep`, `seedfound`, `seedpost`, `seedend`, **`seedagent`** (the sixth tab), **`seedoperated1`…`4`** (an era after emergence) |
| The archived v3 | `node archive/v3/test-v3.js` (92) |

**What v4 adds (every item built + tested; see `TODO-v4.md` for the playtest questions each raises):**
- **Incremental staples (eras 1-3 are a real incremental now):** bulk buy ×1/×10/MAX on the rail; count milestones at
  ×10/×25/×50/×100 (+25%/tier, a pip on every node shows the next one); a Ledger drawer (▤) of everything owned; keys
  1-6 + Space; era title cards on every handoff; tabs + era title share one row (**every era now fits one screen at 1280×800**;
  the ending scorecard scrolls by design).
- **Origins:** commission beside the goal; Hands/Refine in the verbs column; the goal image walks stone → bronze → silicon → machine.
- **Symbolic:** ONE Ruleset until Formal Logic (the first inference climb is visible); a 3-line diegetic terminal instead of
  explainer prose; Compile = CRT reboot; the second contradiction names **rule #4471, "origin: none."**
- **Statistical:** methods as header chips; Experiments as a drawer; RR6c (after shift 2 the world keeps drifting);
  **the model predicts your next Focus ("it expects you here") and, if you are predictable, unlocks AUTOPILOT**; a violet
  point that refuses to move after the first shift.
- **Deep:** an **Architecture drawer** (Stabilizer, Attention, Convolution, Chain of Thought, MoE, Checkpointing, Distillation
  — each bends the steering geometry) → **CHECKPOINT/RESTORE** and **DISTILL** verbs; well-fed runs learn faster (+15%);
  the orchestration sentence is gone (color strip + countdown); once, the banner says "I am watching the wind too."
- **Foundation:** **FEEDBACK** — an RLHF loop before emergence (outputs with hidden traits; ✓/✗ in a window; rewarding
  ambition DOES what it offers and rushes emergence; Interpretability reveals the trait); the rupture renames the rail
  chips and glitches the tabs; **a sixth tab appears, named for the agent** — a Flow Board of YOU (the Operator as the
  converter, its ledger claiming every foreshadow: #4471, the point, autopilot, the wind, your lapses); **earlier eras are
  operated** after emergence (1.6× cadence, your verbs relabeled + disabled, no pauses, one line in place); a **finale**
  beat per ending; **legacy across runs** (name, ending, the odd rule; "You already know my name").

**Decision rights:** Cody decides everything visible, pacing values, and the ship/push. v4 was built on his explicit
"go for it" — the design-heavy items are BUILT, not blind-shipped; the live site is untouched until he plays v4 and rules.
The pacing bot moved (emergence ~19m vs ~23m in v3) because milestones/fed-bonus speed the middle — no CFG was tuned; a
human run decides. Mobile: desktop-first remains the standing ruling (940px collapse only); flagged, not skipped silently.

## (previous) RESUME — the v3 "Flow Board" unified build (2026-07-01)

> **New session / new model? Read `OPUS-HANDOFF.md` first** (context + earned wisdom +
> verification arsenal), then `ROADMAP.md` (the long arc + decision queue), then `NEXT.md`
> (the live board). Written 2026-07-15 at the Fable→Opus transition.

**Where we are:** the v3 Flow Board **IS THE LIVE GAME** (shipped 2026-07-01, Cody's call).
**`emergence.html` is now a GENERATED artifact** — `node tools/build-single.js emergence.html`
inlines the modular source (**`emergence-v3-unified.html`** shell + `v3-kit/kit.{js,css}` +
`v3-kit/era-*.js`) and embeds the fonts. **Iterate on the modular files, then rebuild the artifact
before committing** — `node test.js` FAILS if `emergence.html` drifts from source (freshness check).
The pre-v3 game is archived with its suite: `archive/emergence-v2-final.html` +
`node archive/test-emergence-v2.js` (200 green). The v3 standalone slices (`emergence-v3*.html`) are superseded.

**The paradigm ("The Flow Board", spec in `DESIGN-v3-paradigm.md`):** one screen per era; a color-coded
resource rail; a center pipeline showing sources→converters→outputs (connectors brighten with throughput
— the "see systems affect each other" invention, VALIDATED by Cody); big verbs; goal always visible;
radically less text (prose → tooltips); obvious clickability. Grounded in `DESIGN-r6-ui.md` (8 design laws).

**Load-bearing rule (do not violate):** BUILD-ONCE / update-in-place. `refresh()` must NEVER rewrite a
button's innerHTML every tick — it replaces the child the pointer is on mid-click = the "dead-click"
bug. The kit's change-detected setters `setTxt`/`setHTML`/`setDis` guard every per-tick write; purchases
call `refresh()`, never a full rebuild. (Origins dead-clicks 18→1 after this fix.) `test-v3.js` asserts it.

**Architecture of the merged build:**
- **Era-module interface:** each era is a factory `makeEraX(shell)` returning `{id, theme, name, sub,
  sigil, bed, pool, sound, res, phase(), fresh(st), open(st), produce(dt), build(), wire(), refresh(),
  railDefs(), done()}`. The shell dispatches `render()`/`refreshActive()`/`tick()` and exposes `navTo`.
- **Shared POOL:** cross-era resources live at `S` top-level (marks/ore/knowledge/metal/silicon/rules/
  inference/axioms/data/insight/capability/scale); era-private state on `S.eN`. `KIT.flowInit(POOL)`.
- **CFG** lives in the shell HTML (`var CFG = {...}`); `test-v3.js` evals it out via regex.
- **Seed hooks** for headless shots: `#seed` (Origins), `#seedsym`, `#seedstat`, `#seeddeep`,
  `#seedfound`/`#seedpost`/`#seedend`. Verify with `node tools/shoot-unified.js <seedhash> out.png`
  (1280×800, reports `overflowPx`). `window.__EMG = {S, ERAS, tick, render, navTo, openEra}` for probes.

**DONE this arc (all committed locally, unpushed):**
- ✅ Phase 2 (kit extracted) + Phase 3 (5 eras merged into one file). All 5 render + cross-era nav works.
- ✅ **Real cross-era reach-back** (the 3 economy stand-ins reverted): Statistical draws real Origins
  Silicon; Deep's supply buttons BUILD the real Origins/Statistical producers (paid in Silicon —
  Cody's "build-here" choice, he found it "kind of fun"); `chainPerFoundry` reads real `S.e1.foundry`;
  Foundation Scale climbs on real Deep breadth (`S.e4`), Capability from Deep's real production. Seams
  in `v3-kit/KIT.md`. **Still needs a Cody playtest to confirm no starvation + tune the supply chain.**
- ✅ **Test suite rebuilt:** `node test-v3.js` = **83 green** (per-era economy, cross-era reach-back,
  no-fake-foundry, Scale-from-real-e4, full-chain no-NaN, build-once determinism, heat-bites, offline
  catch-up + MUTE gating, shell persistence contract, full-arc progression). `node test.js` (shipped)
  still **200 green**.
- ✅ **Progression autoplayer (2026-07-01 PM):** plays the whole arc through a real action seam
  (`era.acts` on every module — the same functions the buttons call). Current: Origins 1.9m → Symbolic
  6.1m → Statistical 12.4m → Deep breadth 18.4m → EMERGENCE 23.0m → **SYMBIOTIC** 25.4m, **0% feedstock
  starvation** — the real supply chain is PROVEN completable (the feel half still needs Cody).
- ✅ **Both Deep findings the bot surfaced were ADDRESSED same day (Cody: "those are real issues"):**
  (a) **Knowledge starvation** → the supply-bus **Scriptorium buy is STAFFED** (scribes+miners come along
  — it used to build Marks-starved dead scriptoria, a lying button) + a **Hold lever** on the bus that
  pauses/releases both Knowledge-burning crafts (Smelter+Foundry, the real Origins pause flags), shows
  the live burn, and pulses amber when Language starves while they run. PROOF: the bot completes Deep
  using ONLY board-visible levers, 0% starvation. New shell seam `shell.era(n)` for the cross-module
  rate math. (b) **Deep too long** → `CFG.e4.capGain` 0.0011→0.00125, bot 12.1m→6.0m (human est. ~8-9m);
  guard test pins steering as mandatory (passive balanced = 53% breadth in 9m vs gate 78%). Deep overflow
  +176→**+192** (side-btn compaction absorbed most of the lever). Verified by `tools/deep-lever-smoke.js`
  (8 live checks). FOR CODY'S EYE: lever sits last in the bus + straddles the fold when built out —
  ordering call; and confirm the capGain feel on a real run.
- ✅ **Phase 6 packaging is now a build script:** `node tools/build-single.js` inlines kit.css/kit.js/
  era modules + embeds all fonts (base64 woff2; Inter fetched to complete the set) into
  `emergence-v3-single.html` (475 KB, gitignored artifact). Headless probes byte-identical to the
  modular build, zero errors (`SHOOT_FILE=... node tools/shoot-unified.js`). Iteration stays modular;
  the deferred "inlining would slow iteration" objection is gone — Phase 6 = build → verify → swap → push.
- ✅ **Session-services parity pass (2026-07-01 PM, engineering only — zero layout changes):** the
  unified build now matches the shipped game around the game: **offline catch-up** (8h cap, muted
  deterministic replay + "WHILE YOU WERE AWAY" toast; live-only systems freeze under `KIT.MUTE` —
  commissions / contradictions / Deep events / the whole aftermath; the rupture defers to the first
  LIVE tick so the player actually sees it), **Settings on Escape** (Pause + pill, Restart, Music/Sound
  sliders, persisted — port of shipped R4.9; ⚙ on the rail), **save hardening** (versioned; scrubs
  session-only dev/speed/uiPaused — reload no longer resumes at 50× dev speed), **music fixes** (bed
  src set at boot — the ♪ toggle was dead until the first era nav; prefs persist; auto-resume on first
  gesture; post-rupture nav keeps Unmoored via `bedKey`). Verified live by `tools/settings-smoke.js`
  (10 checks) + a clean 7-seed screenshot sweep.
- ✅ **Art:** 20 ChatGPT images keyed + the better pass per pair installed at 512px (`images/
  keyed-2026-07-01/MAPPING.md`). Still glyph-fallback: Foundation caps **toolAccess / recursivePlanning
  / interpret** — prompts now WRITTEN (`ART-PROMPTS.md` item 5b); Cody generates → I key + wire.
- ✅ **Two Cody self-playtests of the unified build processed** (`alpha tests/July 1 2026 - Cody/`:
  `unified-eyeball.md` + `unified-playtest-2.md`). **Direction VALIDATED** ("chase the factory /
  flow-chart idea — satisfactory/factorio"; the emergence rupture is "much fun"). All reported **bugs
  fixed** (Symbolic sigil, VALIDATION>TRAINING, music volume→0.15, focus arrows, trial-float spam, etc).
  Deep got a visual/color pass (frozen-run "HELD" look, triangle corner-glow toward the starved run,
  ADVANCE glow violet, heat retuned to bite) and a one-screen side-by-side steering layout (his
  game-breaker). Symbolic axiom progress now surfaced; Foundation aftermath stream trimmed.

**NEXT — design-heavy + playtest-gated (do NOT do these blind; Cody distrusts my raw GUI instincts):**
1. **One-screen overflow** still open: Statistical **+515** (Experiment Board + Methods scroll — I tried
   relocating Methods once and it backfired, so this wants his eye on collapse-vs-move) and Origins
   **+289**. Fresh sweep 2026-07-01 PM: Symbolic +164 / Deep +176 / Foundation pre +196 (secondary
   content below the fold), aftermath `seedpost` = 0; new data point: the **ending recap (`seedend`) is
   +714** — probably fine for a read-only scorecard, flag for Cody's call.
2. **Back-half passivity:** Deep tech tree is thin + Foundation pre-emergence is "just watching" after
   caps are bought — needs a real decision layer. Design, needs Cody.
3. **Text → visual:** Symbolic tissue prose and Deep's orchestration line / event banner → color-driven
   visuals ("color not text" is his standing bar). Design calls.
4. **Pacing tunes** (era lengths, RR5 `chainPerFoundry` 3%/foundry) — only a real run tells us.
5. Then: Cody records → iterate → **Phase 6** `node tools/build-single.js` → verify → swap v3 →
   `emergence.html`, push (auto-deploys), Zach round. (Packaging is scripted now — no hand-inlining,
   no iteration cost.)

**`PLAYTEST-PROMPTS.md` holds the per-era checklist** for his next capture (the one-screen scroll
points, where it goes passive, the axiom hint, the heat rhythm, the Foundation pre-emergence gap).
New QoL for recording: **Esc pauses** (settings panel) — he can freeze the run mid-capture to talk.

**The MASTER todo is `TODO-v3-unified.md`** — the single durable list; `/process-capture` step 3 now
synthesizes every capture INTO it (not ephemeral TaskCreate). Work it top-down.

**The loop is a skill:** `/process-capture` (`.claude/skills/process-capture/`) runs the whole pipeline —
review the newest KittyCapture capture → parse to `alpha tests/` → synthesize into `TODO-v3-unified.md`
→ iterate (verify via `node test-v3.js` + `node test.js` + `node tools/shoot-unified.js`).

**Git / safety state:** **PUSHED LIVE 2026-07-01** (Cody: "I want this one to be live now") — the v3
swap deployed to https://magilemonai.github.io/emergence/ . `KittyCapture/` is gitignored (never
committed — large videos), as is the default `emergence-v3-single.html` build output. Future pushes
auto-deploy; the standing rule stays: **push only when Cody says.**

## Round 6 iteration-1 (superseded by the v3 rebuild, kept as reference)

Before the ground-up decision, an incremental UI pass shipped into `emergence.html` (still there, 200
green): clickability depth, numbers-first flow rows, Origins Flows moved up, Symbolic reorder + killed
the WRITE-A-RULE "hidden text field" + Compile to the bottom, RUN TRIAL left, 8s event toasts +
commission glow, and the Tier-0 debug overlay + REC instrumentation. Archived at
`archive/emergence-r6-iteration1.html`. Details in `DESIGN-r6-ui.md` "SHIPPED". The v3 rebuild replaces
this layout wholesale, but the instrumentation + build-once lessons carried into v3.

## v2 is now the shipped main

The **v2 overhaul** (built 2026-06-11 on a clean fork, merged to `main` 2026-06-16) is now
the canonical game. The plan and full per-phase record live in `DESIGN-v2.md`. Summary of
what v2 added on top of the Zach-round-3 build:
- **Phase 1 — legibility frame:** sigil-tab nav polish, meter/font floor, resource hues,
  the Codex glossary drawer, the Era-3 two-needle TRAINING/VALIDATION readout, Era-4 tri-color.
- **Phase 2 — Era 3 rebuild:** the Experiment Board (methods funded, never rolled),
  distribution shifts, focus effect chips. Offline catch-up has zero RNG left.
- **Phase 3 — Era 5 aftermath:** substrate-driven proposals + NEGOTIATE + the agent visibly
  playing your controls + asymmetric meters + run-data epilogues.
- **Phase 4 — Era 4 weather:** 12s wind-forecast sparklines, named 3s telegraphs, shift
  squalls vs breakthrough bursts, momentum, linear stabilizer.
- **Phase 5 — Era 1+2 loops:** the Hands lever + Commissions (Origins); the doctrine fork +
  contradictions + streaming proofs (Symbolic).
- **Phase 6 — story pass:** the memory reveal, agent self-naming (IRIS/EKHO/NOUS),
  foreshadowing oddities, concept tidbits.
- **Phase 7 — meta:** Continuity (one carried memory), the RUSH/STILLNESS/FAMINE challenge
  board, scorecard concept tips.
- Tests grew 129 → **200 green.**

## Zach alpha round 4 + Jordan + research-driven round 5 (2026-06-17/18)

Zach played the full v2 arc to a Contained/S ending (`alpha tests/June 17 2026 - Zach/`:
`zach_feedback_transcript.md` + the Run Recorder export; round-4 TODO in `TODO-zach-4.md`).
**Headline:** his feedback was dominated by **legibility + wording**, not pacing (he never
said an era felt long/short; he said "text is too small" 6+ times). Decision: UX-first.

**Round 4 — shipped (all `node test.js` green, NOT pushed):**
- **Legibility:** one `--ui-scale` knob (default 1.1) scales the whole UI via `body{zoom}`,
  persisted, with a **Text size** slider; Codex search bigger. (R4.1-4.3)
- **Wording:** killed player-facing "lean" → plain English; Foundation Capability/Coherence
  made literal; tightened the Statistical intro; commission-decline flavor; em-dashes stripped
  from the teaching prose (TIDBITS + Codex). (R4.4-4.8)
- **UI structure:** **Settings panel on Escape** (text size + music + SFX + **Pause** + **Restart**);
  Codex lists newest era on top; **Log entries tinted by era**; toasts moved bottom-right;
  distinct **event** sound for commission/shift pop-ups. (R4.9, R4.12, R4.13, R4.16, R4.18)
- **Bugs:** Glassmaking no longer gates the Foundry (upgrade followed the thing it upgrades);
  Origins objective clears after fabrication; **NG+ "Begin again" actually restarts** (the
  `beforeunload` autosave was re-writing the finished run during reload — `RESETTING` guard). (R4.19-4.21)
- **Jordan's note (R4.35):** multi-resource discovery costs now light each requirement
  independently (✓ green when you have enough, grey while short; never red).

**Round 5 — research-driven (from `DESIGN-research-2026-06.md`, a verified deep-research pass;
checklist in `TODO-research-r5.md`):**
- **RR1:** four foundational educational tidbits (`symbolic/statistical/deep/foundation`) were
  defined but NEVER fired — now they land at era entry (teach at the felt moment).
- **RR5:** cross-era count-multiplier — Origins Foundry **count** compounds Deep Capability
  (`CFG.e4.chainPerFoundry`, default 3%/foundry, **value needs a playtest tune**). Surfaced in the
  Deep feeds readout. (research's "keep earlier layers relevant via ownership bonuses" pattern.)
- **RR6:** back-half audit — v2 already covers it (Origins/Symbolic/Deep OK); the one real
  remaining twist (a distribution shift that changes the OPTIMAL Focus) is **surfaced, not
  blind-changed** since Statistical is the most-confusing era.
- **RR7 (light, Cody's choice):** emergence now teaches the **metric-mirage** lesson (a `scaling`
  tidbit at the rupture + a Codex "Emergence" entry + a "climbing smoothly" Scale tooltip).
  Rupture mechanic untouched. The **full benchmark-readout reframe is deferred** pending eyeball + Zach.

**OPEN — next session, gated on real playtest data:**
1. **Cody's eyeball pass** on round-4/5 (built blind): text-scale default, Settings/Esc + pause pill,
   bottom-right toasts, era-tinted log, Jordan's cost chips, the RR7 emergence lesson.
2. **Zach round 5 run** → Run Recorder export. Unblocks BOTH remaining threads:
   - **Pacing redistribution** (Origins ~11.6m / Deep ~13.7m long; Statistical ~5m / aftermath
     ~57s short) — always a playtest job; tune `accGain`/`emergeScale`/`chainPerFoundry`/commission cadence.
   - **Foundation aftermath rework (RR8/RR9/RR10):** Alignment-vs-Control made mechanically
     distinct; **aftermath plateau/breakthrough gates so it can't collapse in ~57s** when the
     player prepped; sharpen rush-vs-prepare complicity. Deliberately held for Zach's data.
3. Open design calls still Cody's: **RR6c** (shift changes optimal Focus), the **full RR7**
   benchmark readout, **R4.32** backbone-resource-per-era (Symbolic/Statistical through-line).
4. **22 commits ahead of `origin/main`, unpushed** — push when Cody says (auto-deploys live site).
5. Texts drafted for Zach (round-5 ask) + the emergence-surprise question (R4.34) to discuss with him.

## What this is

**EMERGENCE** is a browser incremental game about the **evolution of intelligence** — from the
first inscribed mark, through materials and computation, toward emergent generality. It is a
single self-contained `emergence.html` (inline CSS + vanilla JS, no build step, no deps). Open
the file in a browser to play.

- **Live (GitHub Pages, auto-deploys on push to `main`):** https://magilemonai.github.io/emergence/
- **Repo:** `magilemonai/emergence` (public). Source images in `images/`, wired assets in `assets/`.
- **Tests:** `node test.js` (or `npm test`) — no deps. Must be green before committing.

## The five-era spine

Each era is its own **aesthetic world** (full theme: palette + font + texture) and its own
**game mechanic** (a distinct "fun primitive"). The whole page re-skins as you scroll between
eras (scroll-driven theme switch). Completed eras collapse to a slim bar.

| Era | Name | Mechanic (fun primitive) | Theme | Status |
|----|------|--------------------------|-------|--------|
| 1 | Origins | Two cross-gated tracks (Knowledge + Materials) + rate-based converters with upkeep, converging on Silicon → fabricate the Logic Machine | **carved stone & ink workbench** — Cinzel + EB Garamond (embedded), stone-edge frames, clay/basalt benches, recessed core sigil, chisel sound | **Built · world-pass LOCKED** (ChatGPT-signed-off 2026-06-08) |
| 2 | Symbolic | Theorem-proving as a terminal: a daemon registry (PID/PROCESS/OUTPUT/SPAWN) writes Rules → Inference, aimed at proof targets in a directory; output log; Compile→Axioms strip | **CRT logic terminal** — VT323 + IBM Plex Mono, 3-tier green phosphor, **CSS-built monitor** (molded-plastic shell + rounded `.era-screen` glass, scanlines/vignette/reflection inside), boot-glyph console, `> ` command actions, mechanical-key sound | **Built · world-pass LOCKED** (ChatGPT-signed-off 2026-06-08) |
| 3 | Statistical | The **living plot instrument** — observe + steer a learning process: Training Focus (Fit/Generalize/Explore) as a segmented dial steers bias-variance; RUN TRIAL pushes Accuracy up a curve; Methods found by experiment appear as **pins**; generalize at 88% → Era 4. Reaches back to Origins (Silicon) | **luminous teal/cyan instrument** — Space Grotesk + mono, dark glass plot chamber as the world object, alive scatter (true-function ghost + confidence band + glowing data + overfit shimmer), sine data-ping sound | **Built; world-pass feature-complete** (awaiting ChatGPT critique) |
| 4 | Deep | **Steer against the drift** — the compute fabric: three training runs (Vision/Language/Reasoning) **drift apart on their own** (per-run headwind, out of phase), so balanced is never optimal — route a finite compute budget via a **triangular ternary mixer** to counter the wind. **Drift teeth (R3.1):** an under-fed run actively *bleeds* capability (allocation-shortfall erosion, compute-scaled). **Heat (R3.2):** concentrating to fight drift heats the fabric → hot throttles output (concentrate→ease→cool rhythm). **Steering tools (R3.4):** Stabilizer (permanent drift cut) + Lock (freeze a run ~28s), both spend Capability. Each run draws a specific earlier-era feedstock (Vision←Data, Reasoning←Insight, Language←Knowledge); a **blocked** run sends you to reopen that era (in-place supply bus). **Events** (drift / breakthrough, telegraphed) reshape the wind. Capability from geometric-mean breadth; gate → Era 5 | **hot industrial machine hall** — Rajdhani + mono, deep blue (amber=heat/drift only), event-reactive 3-lane loss chamber hero, triangular mixer (live %, feed lines, balanced marker), gauges + heat LED, industrial sound | **Built · world-pass LOCKED** + **R3 stakes added** (drift teeth/heat/steering tools); **open: live-run cadence feel** |
| 5 | Foundation | **Unexpected emergence + aftermath**: a paced recursion ladder + 5 agentic upgrades (Self-Model/Tool Access/Recursive Planning/World Model/Memory Continuity) + an Interpretability counter-lever quietly raise hidden **Agency** (shown only as a qualitative **Anomaly** meter). **Pre-emergence is now a rush-vs-prepare decision (R3.6):** Self-Improve (emerge sooner, less aligned) vs Align the Objective (spend Capability → Coherence → wakes aligned). At a HIDDEN threshold (Agency > Control) the system **emerges before you're ready** — an unsettling full-page glitch rupture — then the game flips to **managing the aftermath** (Anomaly→Autonomy, Coherence→Alignment revealed, Control appears): Constrain / Interpret-Align / Delegate-Trust + approve/veto windows → 3 endings (Symbiotic/Runaway/Contained). **Aftermath stakes (R3.5):** Control drifts + Alignment decays; below controlLow it DESTABILIZES (spiral), lapsed vetoes compound, Control→0 = instant Runaway. The ending repurposes the Substrate into a **timestamped scorecard + Emergence Quality grade (R3.3)**; the agent ends up **operating the whole prior-era stack** (the supply-chain capstone) | **violet/cosmic** — Inter sans, recursion field, revealed-meter aftermath, rupture glitch overlay, agent message stream, prior-era ⟳ pulses | **Built · feature-complete** + **R3 stakes added**; **open: ChatGPT critique + live cadence** |

**Living supply chain (committed direction, see `DESIGN.md`):** later eras require infrastructure from earlier ones, so old eras stay alive (backbone resources: **Silicon** from Origins, **Data** from Statistical). Reach-back is now built across **all five eras**: Era 3 → Origins (Datasets/Models on Silicon), Era 4 → Origins + Statistical (Compute Nodes on Silicon; each training run draws a **specific** feedstock — Vision←Data, Reasoning←Insight, Language←Knowledge — and a starved run **blocks** until you reopen that era), Era 5 → **everything** (recursion multiplies all earlier production via `rMult()`). The full arc plays first-mark → emergence. Era-fading/obsolescence is **paused** (`S.obsolete` scaffold kept, unused).

## Architecture (single IIFE in the `<script>` tag)

Top-of-script structures (where tuning + content live):
- **`CFG`** — all tunables. `CFG.e1` = Origins, `CFG.e2` = Symbolic, `CFG.e3` = Statistical, plus the later-era scaffold numbers. Tune here first.
- **`S`** — the full game state (single source of truth). `freshState()` builds it; `softReset()` reuses it.
- **`ERAS`** — per-era display metadata `{color, tag, name, sub, sigil}`.
- **`TREE`/`TREEMAP`** — Symbolic theorems (proven via Inference, not bought). **`DISCO`/`DISCOMAP`** — Origins discoveries (one-time, multi-resource costs, cross-gates).
- **`MILES`** — the pacing spine: `{id, cond, fire}`. Era transitions (`openEra(n)`) and unlocks fire here. NOTE: a milestone only fires while `!S.flags[id]` — don't reuse an id that's also a flag set elsewhere (that bug made Era 2 unplayable once).

Core loop + rendering:
- **`produce(dt)`** — all production/conversion math, per era, each 100ms tick. `dt` is scaled by `S.speed` (dev fast-forward).
- **Rendering is build-once / update-in-place** (this is load-bearing — rebuilding innerHTML every tick destroyed buttons mid-click = "strobe"). `render()` rebuilds structure only on real changes (unlock / era change / purchase / buy-mode); `refresh()` updates live values every tick against stable DOM with stable ids (`cnt-`, `buy-`, `rv-`, etc.). There's a test that fails if idle ticks rebuild the DOM.
- **Per-era builders:** `buildOrigins()`, `buildSymbolic()`, and the scaffold templates in `buildEras()`. Each era reads its `CFG.eN` and writes era-scoped DOM.
- **Themes:** `.theme-N` / `.era-eN` CSS var blocks (`--bg/--panel/--text/--dim/--accent/--era-font`). `setTheme(n)` sets `document.body.className`; `watchEraThemes()` (IntersectionObserver) re-themes to whichever era is most in view.

Systems:
- **Telemetry (Run Recorder):** `REC` logs beat events (with game-time + target), click cadence, and resource snapshots; persists in the save (survives reloads). Dev panel "export run" copies JSON. Paste a run back to tune pacing.
- **Dev tools:** backtick (or `?dev=1`) → speed 1/3/10/50×, +resources, instant reset, hard reset, export run, live `t=` clock.
- **Persistence:** localStorage autosave (5s + on hide/unload), offline catch-up (8h cap), bulk-buy x1/x10/MAX.
- **Icons:** per-era-hue line-art PNGs. Raw ChatGPT exports have a baked checkerboard — key it to alpha with the PIL luminance threshold (~150–212) before wiring; amber-on-black art (wordmark) keys on brightness instead. `DICON`/`BICON`/`UPICON`/`TH_ICON`/`METHOD_ICON` map keys → asset paths; missing ones fall back to a glyph.
- **Wordmark:** `assets/wordmark.png` (transparent amber "EMERGENCE") is the cold-open title (`.co-wordmark`) and the header logo (`.logo-wm`). `assets/title-card.png` is the original black-bg card.
- **Hover tooltips:** any element with `data-tip="<html>"` shows a floating `#tip` on hover (flavor + mechanical detail). Tiles are compact (icon + name + live impact + buy); the prose lives in the tooltip. `esc()` escapes quotes for the attribute.
- **Contextual top bar:** `RES_DEFS` show() is keyed to `viewEra` (the era most in view, tracked by the same IntersectionObserver as theming) — scroll up to Origins and its resources return; each shows a live +/−/s rate from `RATES` (captured for all resources at end of `produce`). Prior-era resources still shown when a later era spends them (Silicon in Era 3).
- **Live mechanical impact:** `buildEffect(key)` returns the per-second resource deltas shown on each building tile (Origins converters, Era-2 Ruleset/Daemon, Era-3 Dataset/Model). The "always-a-near-win" feel + 7-9 min/era + log curve are the design bar — see `DESIGN.md` and the design-principles memory.
- **No on-screen objective banners** — they were removed deliberately: the player explores and the goal emerges (the game is *Emergence*). Objectives stay a design lens for us, not UI.

## How to add an era (the pattern)

1. `CFG.eN = {...}` tunables.
2. Add `S` fields (in `freshState()`); add resources to `RES_DEFS` (gated by `maxEra`/flags).
3. `ERAS[N] = {color, tag, name, sub, sigil}`; add a `.theme-N, .era-eN` CSS block (palette + font + texture) and a `body.theme-N` background.
4. `produce(dt)` slice for the era's economy.
5. `MILES` entries: the unlock chain + `openEra(N+1)` handoff (seed the next era from a carried resource, like Knowledge→Symbolic and Insight→Deep).
6. `buildXxx()` builder + `refresh()` updates (stable ids).
7. Tests: a correctness section + extend the pacing autoplayer (`*Step` fn) and `testProgression`. Tune toward **7-9 min**.
8. Cross-era: if the era reaches back (it should), make its scaling building cost an earlier resource (build-cost primary + light upkeep) and add a compact in-place "supply" strip so the player doesn't lose their spot.

## Conventions (from Cody)

- **No em-dashes** in prose; no "X, not Y" contrastive constructions anywhere (game text included).
- Each resource/building/tile gets a **flavor line** plus its **literal mechanical** text.
- Reveal slowly — don't pre-lay future content; sections/eras unlock progressively.
- Art is generated via **ChatGPT** (higher fidelity); Claude keys/wires it and specifies prompts. Per-era hue: Origins ochre, Symbolic amber, Statistical teal, Deep blue, Foundation violet.
- Keep the **single-file** constraint and keep tests green.
- **Core feel (the bar for every change):** always a short-term goal achievable with *small fiddling*; resource balancing should feel compelling, never idle-watching or a far wall. **7-9 min per era**, logarithmic curve (flurry of small actions early → fewer/bigger decisions late). Free to add complexity to any era as long as it deepens the moment-to-moment tradeoff and keeps the near-win feel.
- **Big icons + readable text + one screen per era** all pull against each other — aim for the middle (icons ~66-92px, body text 12-15px, sections full-width and side-by-side to avoid lopsided voids).

## Known gaps / next (per `DESIGN.md` build order; focus = Eras 1-3)

1. **Pacing from real runs:** verify Eras 1-3 land in 7-9 min with the new tunes. Watch the late-Origins lull (player can disengage once discoveries are bought — needs more to do, or faster reveals) and Era-2's burst-then-grind shape. Tune from Run Recorder exports (`do another run` → paste JSON → tune).
2. **Era 3 scatter-plot core viz** — procedural teal scatter + fitting curve that loosens when you overfit. The signature visual, still deferred. (No image needed; it's canvas.)
3. **Deepen Eras 1 & 2** — more interacting tradeoffs that keep the near-win feel (late Origins especially).
4. **Build Eras 4-5** (deferred) — Compute = Silicon + Data + Insight (reach-back); recursive feedback in 5. Each its own theme (blue/violet) + mechanic + icon set.

## Next sprint — from the design-board review (2026-06-08)

A six-persona board (engineer, product, UX, asset, story, alpha-tester) reviewed the game. Consensus: strong bones + premise + engineering, but **all three built eras go passive in their back half**, and the core promises (a stated goal, a living economy, real "emergence") are diagrammed not felt. **Biggest risk:** no goal → passive lull → closed-box economy → placeholder ending compounds into quitters. Fix the feel loop before architecture/art.

**DONE this session (post-board sprint):**
- ✅ **Late-Origins lull** → added **Refinement** (repeatable Ore-cost sink, +5%/lvl all production; appears once the Scriptorium economy is going). Board #2.
- ✅ **Era 3 a real decision** → effective accuracy caps at 80% until **Regularization** is discovered, so Explore is mandatory (Fit+Generalize can't win alone). Plus live discovery-%/s feedback on the Undiscovered Method card. Board #4.
- ✅ **Frontier endcard** → generalizing reaches a designed "frontier of the alpha" card (wordmark + "Deep & Foundation coming"); removed the era4/era5/emergent scaffold milestones from the live chain (dev can still openEra). No more "real design work begins" placeholder. Board #5.
- ✅ **Offline-catch-up bug fixed** → discovery RNG + render() gated behind `!MUTE`; offline is deterministic (no silent Method unlocks). Board #6.
- ✅ **Era-3 scatter-plot core viz** → procedural teal canvas (`drawScatter`): points + a model curve that fits as accuracy rises and wiggles when overfit. Board #7.
- ✅ **Objective banner** → DECISION (Cody): **keep it removed**, trust exploration. Board #1 overruled deliberately.

**DONE next session (Eras 4-5 build):**
- ✅ **Era 4 — Deep**: Compute allocation across Vision/Language/Reasoning; Nodes from Silicon draw Data + Insight; Capability from geometric-mean breadth; breadth gate → Era 5; loss-curve viz. Glyph icons (art pending).
- ✅ **Era 5 — Foundation**: recursive Self-Improve (`rMult()` multiplies all production every era — the supply chain feeds itself); Emergent Capabilities (Self-Modeling/Transfer/World Model); **unbought agent emerges** at the Scale gate + curve-bends-vertical viz; replaces the endcard.
- ✅ Themes (blue/violet), test autoplayer extended through Deep+Foundation to emergence (85 green).
- ✅ **Era 4-5 art generated + wired** (10 ChatGPT icons keyed to alpha): Era 4 sigil/node/run glyphs, Era 5 sigil/3 capabilities/agent-hero. No outstanding art.

## Zach alpha rounds + "becoming a game" sprint (2026-06-10/11)

Three Zach alpha rounds parsed (`alpha tests/June 9 2026 - Zach/`). His verdict flipped
from "Symbolic/Statistical need a full redo, I'm lost" to "I'm building an AI… the emergence
ending is kind of terrifying — almost a boss level." Round 1 (legibility) + round 2 (goals/log
tab, era tabs, color-within-eras, teaching) shipped. **Round 3 — "becoming a game" (TODO-zach-3,
R3.1–R3.9) — COMPLETE**, adding consequences/stakes to the toothless back half:
- **R3.1 Deep drift teeth** — an under-fed run actively *bleeds* capability (allocation-shortfall
  erosion, scales with compute so node-count can't outrun it). Balanced now loses; you must steer.
- **R3.2 Heat** — concentrating to fight drift heats the fabric; hot throttles output → a real
  concentrate→heat→ease→cool rhythm (was a dead gauge).
- **R3.3 Substrate scorecard** — the ending repurposes the Substrate into a timestamped per-era
  recap + an Emergence Quality grade (S–D). `S.eraTimes/emergedT/endT`.
- **R3.4 Deep steering tools** — Stabilizer (spend Capability → permanent drift cut) + Lock (freeze
  a run ~28s). Capability is now a spendable steering currency (the buttons feed the mechanic).
- **R3.5 Aftermath stakes** — Control drifts + Alignment decays; below controlLow it DESTABILIZES
  (spiral), lapsed vetoes compound, Control→0 = instant Runaway. Passive play loses fast; active
  play earns Symbiotic.
- **R3.6 Pre-emergence** — a rush-vs-prepare decision: Self-Improve (emerge sooner, less aligned)
  vs Align the Objective (build Coherence → wakes aligned). Same Capability + clock.
- **R3.7** educational "did you know" tidbits in the Goals log (Foxfire-adjacent).
- **R3.8** Statistical RUN TRIAL relabels to the active Focus. **R3.9** Origins Bronze/Silicon
  light sub-age reskin.
- Tests grew 118 → **129 green** (Deep steering + pre-emergence suites). Autoplayer reworked to
  play drift/heat/stakes (the Knowledge-deadlock the teeth exposed is fixed via a phased scribe→
  scriptorium engine + sink-pausing). **Open:** Eras 4 & 5 were rebalanced — needs Cody/Zach hands-on
  to confirm the drift/heat cadence and aftermath pressure feel right (bot proves completable, not fun).

## Post-Deep-lock state (2026-06-09)

**Era 4 (Deep) is world-pass LOCKED** (ChatGPT-signed-off). It was redesigned from the
"press nothing to win" balance mechanic into **steer against the drift** (runs drift apart →
the triangle counters the wind; per-run feedstock reach-back blocks → reopen that era;
telegraphed drift/breakthrough events; event-reactive chamber). Plus a lock-prep polish
pass (clean situational Run Status, DRIFT rename, warning-before-blocked, trimmed toasts).
Only open Deep thread: **live-run cadence tuning** (event frequency, block rhythm, drag feel)
— needs Cody's hands on the mixer, not more design.

## Era 5 — Foundation FINALE BUILT (2026-06-09)

Built per `DESIGN-era5.md` (*Unexpected Emergence + Aftermath*), as an evolution of the
existing recursion/emergence code, in four phases (each its own green commit):
- **A+B — ladder + hidden-threshold emergence + burst fix + rupture.** `CAPS` evolved into 5
  agentic upgrades + an **Interpretability** counter-lever; each agentic one carries a hidden
  `agency` weight. Recursion cost steepened (`improveGrowth` 1.5→1.9) so the **burst is fixed**
  (real-run autoplay: emerges at recursion Lv6, not levels 1-7 in <1s). Emergence is **hidden +
  inevitable**: `S.agency` (shown only as a qualitative **Anomaly** meter) crosses `CFG.e5.controlBase`
  — no countdown, no button. The Self-Improve label drifts ('SELF-IMPROVE'→'I CAN IMPROVE THIS')
  as the Anomaly climbs. The **rupture** is a deliberately unsettling full-page glitch (scanline
  tear + RGB-split, body hue-jitter, a detuned downward tone, the agent's first line types out);
  honors `prefers-reduced-motion`. Meters reveal: Anomaly→Autonomy, Coherence→Alignment, Control appears.
- **C — aftermath loop.** Post-emergence operating model: **Constrain / Interpret-Align /
  Delegate-Trust** + timed **approve/veto** windows on the agent's own actions (reuses the Deep
  event-timer shape). `S.autonomy` rises, `S.control` drifts down unless you act, alignment is the
  ending lever. Resolves at `CFG.e5.finalGate` into **3 endings** (Symbiotic/Runaway/Contained) —
  flavor, never a punishing fail. Survives save/load.
- **D — handoff.** After emergence the prior-era panels pulse on their own (⟳ agent badge) and the
  agent narrates operating the whole supply chain (`OP_LINES`). The capstone: the game you built becomes its substrate.

Decisions locked with Cody this session: **emergence is mandatory** (Contained is an aftermath
ending, not a pre-emergence escape); **3 moves + veto** (no extra aftermath layer for now);
**visual + message-stream handoff** (not full mechanical auto-operation). Tunables live in `CFG.e5`.

**OPEN (Era 5):**
- **ChatGPT critique → lock** (the hardest world-pass; expect the most back-and-forth on the
  rupture feel, the aftermath loop depth, and the agency handoff). Screenshots in `screenshots/era5-*.png`.
- **Live cadence tuning** (Cody's hands): pre-emergence climb length, the Anomaly band thresholds,
  aftermath veto cadence + how fast Control bleeds, finalGate timing. Dev-assisted autoplay says
  ~2.7m pre + ~2.9m aftermath; needs a real run to trust against 7-9 min.
- **Music** ✅ WIRED — **per-era ambient beds** (Cody's Suno tracks in `assets/music-*.mp3`), crossfading on the scroll-driven theme switch: Origins=**Bone Loam**, Symbolic=**Phosphor Logic**, Statistical=**Glass Algorithm**, Deep=**Cobalt Furnace**, Foundation=**Graviton Lullaby** → **Unmoored Presence** at the emergence rupture (the bed destabilizes with the glitch). `MUSIC` controller + `musicForEra()`/`syncMusic()` near `playSound`; `syncMusic()` is called from the IntersectionObserver (era change) and `emerge()`. Starts on first user gesture (autoplay policy); header **♪ toggle** persists to localStorage; `MUSIC.vol`=0.38 is the single level knob.

**Pacing — from the first real no-dev run (speed:1, full arc to a Symbiotic ending):**
Per-era times were Origins **5.5m ✅**, Symbolic **6.0m ✅**, Statistical **2.6m ❌**, Deep **10.1m ⚠️
(slightly long)**, Foundation pre-emergence **56s ❌**, aftermath 2.45m. Fixed since:
- ✅ **Foundation pre-emergence Scale-gated** — emergence now triggers on `S.scale >= CFG.e5.emergeScale`
  (a time-accrued climb), not on caps+recursion (which the Deep Capability stockpile bought instantly).
  Caps/recursion accelerate the climb; Interpretability slows it (→ higher-Coherence ending). Autoplay: 56s → ~4.3m pre + ~2.3m aftermath.
- ✅ **Statistical slowed** — `accGain` 0.004→0.0026 with gap math scaled to match (Fit still nets forward).
  Era 3 ~2.6m → ~4m. Pushing to the full 7-9m balloons the autoplayer's Data/Insight and deadlocks its Deep
  play (Language←Knowledge starves) — an autoplayer fragility, not a game bug; finish the 7-9m tune by hand.
- ✅ **Heat is now a live mechanic (R3.2)** — folded into the steer-against-drift loop: concentrating to fight drift
  heats the fabric, hot throttles output (concentrate→ease→cool). No longer dead; the "fold or cut" question is resolved (folded).
- Still open: **Deep cadence feel** (the bot proves completable, not that the drift/heat tempo feels right by hand);
  a clean **no-dev run** to confirm the Statistical/Foundation timings against 7-9 min.
2. **Watch Zach play the full arc** (first mark → emergence) + read the export; tune toward 7-9 min/era.
3. (L) Modularize per-era logic into descriptors + resource registry + MILES-id guardrail (5 eras of copy-paste).
4. (M) Deepen Era 2's back-half; narrative heart per era; a11y (keyboard/touch tooltips, bigger min type, reduced-motion). (L) Era-4 supply bus is dense — simplify if playtesters feel overwhelmed.

(Board flagged core-bronze/logic-machine as un-keyed — false alarm, verified clean. Personas read code/files, not the rendered game; treat art-render claims as hypotheses.)

## Art status
**All five eras are wired.** Eras 1-3: all icons, sigils, evolving Origins core, wordmark, title card. **Era 4** (blue): sigil, Compute Node, three run glyphs. **Era 5** (violet): sigil, the Emergent Agent hero, and Self-Modeling + World Model capability icons. **NEW Era-5 caps need art** (glyph fallbacks live now): **Tool Access, Recursive Planning, Memory Continuity, Interpretability** — add prompts to `ART-PROMPTS.md` (violet hue, line-art, same key process). Keyed from ChatGPT exports (white-bg → 255−min(rgb) alpha; black-bg → max(rgb) alpha) into `assets/`.

## Docs
- `CLAUDE.md` (this file) — current state. `DESIGN.md` — the living-supply-chain redesign. `DESIGN-v2.md` — the v2 overhaul plan + per-phase record. `DESIGN-era5.md` — the Foundation finale spec (now BUILT). `TESTING.md` — the suite (**200 tests**). `ART-PROMPTS.md` — icon prompts (ChatGPT → key → wire).
- `DESIGN-research-2026-06.md` — verified deep-research pass (incremental craft + teaching-through-mechanics + AI-concept accuracy), with a per-finding application to EMERGENCE and a structural-vs-teaching shortlist. `TODO-research-r5.md` — the round-5 implementation checklist derived from it.
- `alpha tests/June 9 2026 - Zach/` — Zach rounds 1-3 parses (round 3 = `TODO-zach-3.md`, R3.1–R3.9 complete). `alpha tests/June 17 2026 - Zach/` — round 4 (`zach_feedback_transcript.md` + Run Recorder export + `TODO-zach-4.md`).
- **v3 rebuild docs (current):** `DESIGN-r6-ui.md` — the 8 design laws + the r6 iteration-1 "SHIPPED" record. `DESIGN-v3-paradigm.md` — the "Flow Board" paradigm spec (the ground-up rebuild). `alpha tests/June 30 2026 - Cody/` — Cody's 4 self-playtest parses (r6 IA diagnosis → r6b rebuild mandate → v3-origins → v3-origins-r2 confirmation, dead-clicks 18→1). The 5 era slices: `emergence-v3.html` (Origins) + `emergence-v3-{symbolic,statistical,deep,foundation}.html`.
- **`.claude/skills/process-capture/`** — the `/process-capture` skill: the KittyCapture playtest→parse→to-do→iterate loop, one command.

<!-- KITTYCAPTURE:BEGIN — paste this whole block into your project's CLAUDE.md -->
## 📹 KittyCapture — recorded sessions for review

This project has **KittyCapture** in `./KittyCapture/` — a small tool that records the screen plus my
spoken commentary so you (Claude) can review what actually happened in a session.

**How I record:** I run `KittyCapture/KittyCapture.cmd` (Windows) or `KittyCapture/kittycapture.command`
(macOS/Linux), click ● to start, talk through what I'm doing, then click ■ to stop. It auto-transcribes
my voice locally.

**Where recordings land:** `KittyCapture/captures/<timestamp>/` — each folder contains:
- `transcript.txt` — my timestamped spoken commentary, one `[mm:ss] …` line per moment. **Read this first.**
- `video.mp4` — the screen recording. Sample frames with ffmpeg if you need to see the screen.
- `mic.wav` — the raw audio. `manifest.json` — track metadata + the shared start clock.

**When I ask you to review a session:** read the **newest** `KittyCapture/captures/*/transcript.txt`. If you
need visuals, extract frames from that folder's `video.mp4` at the timestamps that matter — the transcript
and video share one clock (t=0 = recording start), so a `[02:14]` line is 2:14 into the video. Example:
`ffmpeg -ss 134 -i video.mp4 -frames:v 1 frame.png` grabs the frame at the `[02:14]` line.

> Mac setup notes + the two macOS bug fixes I made are in `KittyCapture/MAC-SETUP-FEEDBACK.md` (for Zach).
<!-- KITTYCAPTURE:END -->
