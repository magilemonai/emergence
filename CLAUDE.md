# EMERGENCE — Project State (CLAUDE.md)

> The living source of truth for this project. Auto-loaded by Claude Code each session —
> keep it current as the game evolves. Last updated 2026-06-08.

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
| 4 | Deep | **The compute fabric** — orchestrate at scale: split a finite compute budget across three runs via a **triangular ternary mixer** (min 5%, never all-zero); live levers = saturation/freshness (orbit balance), breadth-bottleneck lag bonus, forgiving heat/throttle, rotating frontier windows. Capability from geometric-mean breadth; gate → Era 5. Eats Silicon + Data + Insight (visible supply bus) | **hot industrial machine hall** — Rajdhani + mono, deep blue (amber=heat only), 3-lane loss chamber hero, gauges + heat LED, industrial sound | **Built; world-pass feature-complete** (awaiting ChatGPT critique) |
| 5 | Foundation | **Recursive self-improvement**: Self-Improve spends Capability for recursion levels that multiply **all** production every era (the supply chain feeds itself); Emergent Capabilities; at the Scale gate an **unbought agent emerges** and compounds on its own | violet | **Built + art wired**; emergence finale + curve viz, sigil + capability icons + agent hero |

**Living supply chain (committed direction, see `DESIGN.md`):** later eras require infrastructure from earlier ones, so old eras stay alive (backbone resources: **Silicon** from Origins, **Data** from Statistical). Reach-back is now built across **all five eras**: Era 3 → Origins (Datasets/Models on Silicon), Era 4 → Origins + Statistical (Compute Nodes on Silicon, drawing Data + Insight), Era 5 → **everything** (recursion multiplies all earlier production via `rMult()`). The full arc plays first-mark → emergence. Era-fading/obsolescence is **paused** (`S.obsolete` scaffold kept, unused).

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

**Still open:**
1. **Watch Zach play the full arc** (first mark → emergence) + read the export; tune all five eras toward 7-9 min. First autoplay read: Origins 1.9m, Symbolic 5.9m, Statistical ~4.4m, Deep 5.7m, Foundation ~8.4m. Origins/Statistical run fast.
2. **Sanity-check the rendered look in a real browser** — Eras 4-5 were built/wired headless; verify themes, the allocation grid, the three canvases (loss/scatter/emergence), and the agent-hero pulse actually render.
3. (M) Era 4 balance: balanced 1/1/1 allocation may dominate — make specialization-then-rebalance a real pull. (L) Modularize per-era logic into descriptors + resource registry + MILES-id guardrail (5 eras of copy-paste now).
4. (M) Deepen Era 2's back-half; narrative heart per era; a11y (keyboard/touch tooltips, bigger min type, reduced-motion).

(Board flagged core-bronze/logic-machine as un-keyed — false alarm, verified clean. Personas read code/files, not the rendered game; treat art-render claims as hypotheses.)

## Art status
**All five eras are now fully wired.** Eras 1-3: all icons, sigils, evolving Origins core, wordmark, title card. **Era 4** (blue): sigil, Compute Node, three run glyphs (Vision/Language/Reasoning). **Era 5** (violet): sigil, three Capability icons (Self-Modeling/Transfer/World Model), and the Emergent Agent hero glyph in the finale. Keyed from ChatGPT exports (white-bg → 255−min(rgb) alpha; black-bg → max(rgb) alpha) into `assets/`. No outstanding art.

## Docs
- `CLAUDE.md` (this file) — current state. `DESIGN.md` — the living-supply-chain redesign + decisions + build order. `TESTING.md` — the suite (85 tests). `ART-PROMPTS.md` — Era 4-5 icon prompts (ChatGPT → key → wire).
