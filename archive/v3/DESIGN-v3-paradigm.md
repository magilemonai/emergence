# EMERGENCE v3 — the ground-up UI paradigm ("The Flow Board")

> The rebuild Cody asked for (2026-06-30, self-playtest #2): same systems + soul, brand-new layout.
> Grounded in the 8 research laws (`DESIGN-r6-ui.md`) + the exemplar teardown (Orb of Creation,
> Antimatter Dimensions, Universal Paperclips). Sequencing: **Origins slice first** (this doc's
> paradigm, built standalone as `emergence-v3.html`), Cody records/reacts, then roll across all eras.

## The one-line bet
**Every era is a single-screen "Flow Board": a color-coded resource rail on top, a central pipeline
that visibly shows sources → converters → outputs (so you SEE systems feeding each other), big manual
verbs, and the era goal on the right — taught by icons/numbers/layout, almost no prose.**

## What the teardown verified (adopt directly)
- **On-tile color + icon coding, never hover-only** (OoC — players begged for "a colored bar"). Each
  resource has ONE fixed color + icon, used everywhere it appears (rail, node, flow link, cost).
- **Per-row dashboard, fixed info order** (Antimatter Dimensions): a producer is one line —
  `icon+name → live +out/s → owned → cost/progress-to-next → BUY`. State + next threshold in one line,
  no tooltip needed. This is the node template.
- **Milestone-gated progressive reveal** (Universal Paperclips): each system/era appears when its gate
  is crossed, in place; the current loop never gets pre-cluttered. (EMERGENCE already does this via MILES.)
- **Non-idle: a standing decision always on screen** (OoC): keep the click-energy; late game must have a
  live choice, not bar-watching.
- **Condense for density** (OoC "condense stats" ask): the resource rail needs a compact mode before five
  eras of resources pile up.

## The invention the teardown could NOT source (my design bet)
No source described a concrete "see one system's output flow into another's input" visualization — yet
that is Cody's *central* ask ("see how they're impacting one another"). So the **Flow Board's pipeline
links are the original bet:** converters sit between their inputs and outputs with **colored flow
connectors** that animate/thicken with throughput. You literally watch Marks stream into the Scriptorium
and Knowledge stream out. This is the thing to validate on the Origins slice.

## The resource color system (fixed, global, used everywhere)
Origins hues already exist (RES_HUE). Formalize: every resource = one accent color + one icon, applied
to its rail chip, its node border/glow, its flow links, and its cost text. Marks=ochre, Ore=stone/tan,
Knowledge=parchment-gold, Metal=copper, Silicon=pale-cyan. Later eras extend the same discipline.

## Origins as the Flow Board (the slice)
- **Top rail (persistent, color-coded):** each active resource = `[icon] value  (+net/s)` in its color,
  fixed order, condensable. This is the dashboard Cody wanted "flows in."
- **Left column — the two VERBS** as big, always-present, glowing action buttons: INSCRIBE (+Marks),
  QUARRY (+Ore). Keep the click-click energy. Yield on the button.
- **Center — the pipeline (the star):** two lanes.
  - Record lane: Marks → **Scriptorium** → Knowledge.
  - Forge lane: Ore → **Smelter** → Metal → **Foundry** → Silicon (+ Knowledge feeds in).
  Each converter is a per-row node (icon → +out/s → owned → cost → BUY) with **colored flow connectors**
  from its inputs and to its outputs; the connector brightens with throughput; a starved input dims + a
  pause toggle. Automators (Scribe/Miner) attach to their resource as small +N/s stackers.
- **Right — the goal:** Silicon → **Logic Machine** meter + FABRICATE (the discrete milestone hand-off,
  UP-style). Always visible so the goal is legible from minute one.
- **Standing decisions on screen (active late game):** the **Hands** allocator (Record↔Forge) and
  **Refine** (spend surplus Ore, +% all) sit as compact always-live controls; **Commissions** surface as
  a bright, timed card in the rail area (glowing, dwell-long, logged) — not a missable corner toast.
- **Research** = discoveries as a compact grid/drawer of icon+cost+effect tiles (lead with the effect,
  e.g. "+Knowledge · Scriptorium"), one-time, color-coded, prose in tooltip only.
- **Text budget:** node = icon + numbers + buy. One short era subtitle. Everything else → tooltip. No
  paragraphs on the board.

## Build plan
- Build standalone **`emergence-v3.html`** (single file, reuses the real `assets/` icons + fonts +
  Origins music) with a **faithful port of the Origins economy** (CFG.e1, oStats, the Origins produce
  slice, DISCO, commissions, hands, refine, fabricate) under the Flow-Board UI. The archived
  `archive/emergence-r6-iteration1.html` stays the reference; the shipped `emergence.html` is untouched
  until the paradigm is validated.
- Carry forward what landed: flows-under-the-action, clickability depth, active pacing. Carry the r6
  instrumentation (debug overlay + REC with wall-clock/dead-click/scroll), and **snapshot the completed
  run before any reset** so New Game+ can't wipe the telemetry (the bug from run #2).
- Cody records the slice → reacts to the paradigm → then port all five eras + the show-don't-tell
  emergence rupture (UI glitches and rebuilds itself) and an active (not bar-watching) back half.
