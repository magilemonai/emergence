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
| 1 | Origins | Two cross-gated tracks (Knowledge + Materials) + rate-based converters with upkeep, converging on Silicon → fabricate the Logic Machine | warm stone, **serif**, ochre | **Built**, tuned ~6 min |
| 2 | Symbolic | Theorem-proving as a process: Rulesets emit Inference, aimed at one proof at a time; repeatable Optimization + Inference-Capacity lemmas; Compile→Axioms prestige | cold terminal, **mono**, amber + schematic bg | **Built**, ~5-7 min |
| 3 | Statistical | Experiments + accuracy curve: spend Data on probabilistic experiments to push Accuracy up a diminishing curve; **discover** Methods by chance; manage bias↔variance (overfit gap, cured by Regularization) | cool teal, **sans**, graph-paper | **Theme built; mechanic = next build** |
| 4 | Deep | (planned) compute allocation across parallel training projects | blue | scaffold (old pipeline) |
| 5 | Foundation | (planned) recursive self-improvement / emergent capabilities | violet | scaffold + endpoint |

Era-fading/obsolescence is **paused** (the scaffold — `S.obsolete`, `.obsolete` CSS — is kept but unused).

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
- **Icons:** bronze line-art PNGs. Raw ChatGPT exports have a baked checkerboard — key it to alpha with the PIL one-liner (luminance threshold ~150–212) before wiring. `DICON`/`BICON`/`UPICON`/`TH_ICON` map keys → asset paths; missing ones fall back to a glyph.
- **Title card / wordmark:** `assets/title-card.png` (amber circuit-node "EMERGENCE") is the cold-open title screen (`.co-wordmark`).

## How to add an era (the pattern)

1. `CFG.eN = {...}` tunables.
2. Add `S` fields (in `freshState()`); add resources to `RES_DEFS` (gated by `maxEra`/flags).
3. `ERAS[N] = {color, tag, name, sub, sigil}`; add a `.theme-N, .era-eN` CSS block (palette + font + texture) and a `body.theme-N` background.
4. `produce(dt)` slice for the era's economy.
5. `MILES` entries: the unlock chain + `openEra(N+1)` handoff (seed the next era from a carried resource, like Knowledge→Symbolic and Insight→Deep).
6. `buildXxx()` builder + `refresh()` updates (stable ids).
7. Tests: a correctness section + extend the pacing autoplayer/report. Tune toward ~5-6 min.

## Conventions (from Cody)

- **No em-dashes** in prose; no "X, not Y" contrastive constructions anywhere (game text included).
- Each resource/building/tile gets a **flavor line** plus its **literal mechanical** text.
- Reveal slowly — don't pre-lay future content; sections/eras unlock progressively.
- Art is generated via **ChatGPT** (higher fidelity); Claude keys/wires it and specifies prompts. Per-era hue: Origins ochre, Symbolic amber, Statistical teal, Deep blue, Foundation violet.
- Keep the **single-file** constraint and keep tests green.

## Known gaps / next

1. **Build Era 3 (Statistical) mechanic** — theme is in; economy/experiments/discovery/overfit/handoff + scatter-plot viz to come.
2. Pacing fine-tuning from real run exports (Origins early beats slipped slightly with quarry=+1; Era 2 runs ~7 min).
3. Remaining art: Era-3 icon set (teal), the Origins evolving-core (3 age stages), Era 4/5 sigils.
4. Eras 4-5 are still the original scaffold pipeline — rebuild with their own mechanics/themes.
