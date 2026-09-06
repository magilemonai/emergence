# DESIGN r6 — the intuitive-UI redesign (research-grounded)

> Round 6. Source: Cody's 2026-06-30 self-playtest (`alpha tests/June 30 2026 - Cody/cody-playtest-r6.md`)
> + a verified deep-research pass on intuitive incremental-game UI (2026-06-30, 22 sources, 22 claims
> confirmed / 3 refuted; primary NN/g eyetracking). The core diagnosis both agree on: **this is a
> legibility + signifier problem, not an aesthetic one.** The vibe won; the layout lost. For an
> incremental game the UI *is* the game, so legibility is first-order — sequence it ahead of theming.

## What the research actually said (and what it did NOT)

Confirmed (high confidence, primary NN/g):
- **Players scan, they don't read.** 79% scan, 16% read word-by-word. Walls of prose lose the mechanic.
- **Front-load the information-carrying word.** "If users see only the first 2 words, they should still
  get the gist" — NN/g calls first-2-word choice "probably the highest-ROI design decision." For us:
  numbers-first labels.
- **Left/top is read more than right/bottom; low-salience info is under-weighted (salience bias).**
  This is the real reason the top-right counters and below-fold flows get missed.
- **Salience toolkit = size, contrast, color, luminance, placement — but make ONE element the star.**
  ~3 sizes; if everything is big/bright, nothing is. Same levers get a notification noticed.
- **"Can't tell what's clickable" = a signifier problem.** A control can be fully clickable yet fail
  with no signifier. Fully-flat aesthetic-first styling removes the strongest cue; restore subtle depth
  ("Flat 2.0"). One NN/g case: flat→3D raised clicks 416%. Players "spend clicks like currency" — they
  won't hover-hunt to find what's live (and hover doesn't exist on touch).

Explicitly REFUTED (don't lean on these):
- The tidy "F-pattern proves the top-right / below-fold gets skipped" story was killed (votes 0-3, 1-2).
  Ground the blind-spot fixes in **left/top-read-more + salience bias**, not F-pattern geometry.
- Don't over-correct into heavy skeuomorphism; the target is subtle depth, not 3D buttons everywhere.

Not covered by verified evidence (so these are judgment + playtest-tune, not research-backed):
- **Notification/event dwell time** (how long a telegraph must stay to be readable). Open question →
  tune from the next KittyCapture run. His complaint "went by too fast" is real; I'll err long + logged.
- Named-game exemplar patterns (Cookie Clicker etc.) didn't survive verification — treat "do it like
  game X" as unproven; the confirmed guidance is HCI-principle-level.

## The 8 design laws (the bar for every screen)

1. **Lead with the number.** Every tile/button/label starts with its mechanical value ("+2.1 Marks ·
   Inscribe"), not flavor or a proper noun. Flavor demotes to the tooltip.
2. **One star per screen.** The single most important action/number is the largest, highest-contrast
   thing on screen. Three sizes max. Era 3's big glowing RUN TRIAL is the model.
3. **Key numbers live in the reading path, next to the action they describe.** In-panel flow readout
   (top-left bias). The top-right counter stays as a reference, but it is not where the player learns
   the rate.
4. **Interactive wears a signifier; decorative doesn't.** Buttons/tiles get persistent depth/border.
   Status/flavor panels must look un-clickable. No "hover to discover it's live."
5. **Scan, don't read.** Short chunked labels + styled number/keyword anchors. No walls of teaching
   prose in the main flow (move to tooltip / Codex / a dismissible one-liner).
6. **Nothing reflows under the player.** Reserve space; dynamic elements fade in place and never shove
   the primary action out of position.
7. **Events must be seen AND readable.** Salience levers to get them noticed; timed events dwell long
   enough to read and get logged so they're recoverable. Err long; tune from playtest.
8. **UI is the game.** Legibility work is sequenced ahead of new theming/mechanics.

## Per-era application

**Global / top bar.** Numbers-first everywhere. Add an in-panel **FLOW** readout (the star rate) near
the primary action in each era; keep the top bar as the reference ledger. Color-code by resource
(already have hues) and bold the numbers so scanning catches them.

**Origins (middling).** Tile labels numbers-first. Pull FLOWS-per-second from the page bottom into a
compact strip at the top of the panel. Commission arrival = a salient in-panel badge + the record/
journal reacts (not only a corner toast that gets missed). Depth signifiers on Inscribe/Quarry/
Research/Discover; the Hands slider + Refinement read clearly as controls.

**Symbolic (WORST — the big job, iteration 2).** One-screen rebuild: the primary action (WRITE A RULE
→ pick a Theorem) goes to the TOP, in the reading path, as the star. Add connective tissue from Origins
("your Knowledge feeds these Rules"). KILL the hidden text field spawned on rule-write. Make clickable
vs decorative unmistakable (the phosphor console currently reads as decoration). Contradiction/theorem
events dwell + log instead of flashing by. Cut the boot/intro text walls to chunked anchors.

**Statistical (BEST — light touch).** Move RUN TRIAL to the **left** (reading start), per his ask. Keep
the hero scatter viz pinned/in-view while the controls below are used (he "loses the cool visual").
Shift events dwell + log. Otherwise this era is the template the others should imitate.

**Deep / Foundation.** Apply the laws (numbers-first, event dwell, signifiers) opportunistically;
defer structural rework until he reaches them again with the new instrumentation.

## Iterations (staged to keep the KittyCapture loop tight)

**Iteration 1 — safe cross-cutting wins + instrumentation (low regression risk, fast to a playtest):**
- Numbers-first labels across all eras (law 1).
- Clickability depth/signifier CSS on action tiles/buttons; decorative panels de-emphasized (law 4).
- Relocate/duplicate the star FLOW readout into each era's panel (law 3); demote wall-text to tooltips
  (law 5).
- Commission salience (law 7); event dwell + log for fast events (law 7).
- Kill the hidden rule text field; fix reflow-shove (laws 6).
- Era-3: RUN TRIAL to the left; pin the hero viz.
- **Tier 0 debug overlay** (`?dev=1`/hotkey: era, star rates, last action, scroll/viewEra) so the next
  recording is self-documenting; + REC hooks: wall-clock `wt`, dead-clicks, scroll/viewEra timeline.

**Iteration 2 — structural (needs Cody's eyes on this spec first):**
- Symbolic one-screen rebuild + connective tissue.
- Per-era one-screen audit (primary action + its feedback visible without scrolling; kill lopsided voids).

Not pushed to live until Cody says (push auto-deploys). Tests must stay green (200 → grow).

## SHIPPED — iteration 1 (2026-06-30, all 200 tests green, NOT pushed)

Cody chose "everything in one batch." Landed:
- **Clickability (law 4):** resting depth/highlight on `.act-btn` + `.up-buy` so buttons read as raised
  controls, not labels (the buy buttons Cody found ambiguous now have a clear pressed/hover state).
- **Numbers-first (law 1):** building flow rows (`buildEffect`) now lead with the bold signed number,
  resource name secondary; Symbolic `manualSub` leads with +/click and shows the auto Rules/s.
- **In-panel flow (law 3):** Origins **Flows** panel moved up directly under the core verbs; Symbolic
  auto Rules/s shown at the action.
- **Kill hidden field + reflow (law 6):** removed the per-click terminal line on WRITE A RULE (the
  "text field that hides"); Symbolic **Compile moved to the bottom** so its mid-run appearance no longer
  shoves the primary action/theorems down.
- **Symbolic one-screen (task 7):** hero reordered so **WRITE A RULE leads** (stable, above the log);
  **Theorems (the goal) moved directly under the hero**; connective tissue added ("Your Knowledge from
  Origins is now Rules → power Inference → aim at a Theorem").
- **Statistical (Cody's ask):** **RUN TRIAL moved to the left** (reading start).
- **Events (law 7):** commission + distribution-shift toasts (the `'event'` cue) now dwell **8s** (were
  4.2s) and stay logged in Goals; the **commission panel breathes a glow** (reduced-motion fallback).
- **Tier 0 instrumentation:** `?dev=1`/backtick now also shows a bottom-left **debug overlay**
  (era, t, scroll %, star rate, last action, dead-click count) visible in the recording; **REC** gains
  wall-clock `wt` (aligns to KittyCapture `t0_epoch`), **dead-click** logging (`@deadclick`), **scroll +
  viewEra timeline** (`@scroll`/`@view`), and a **download-run** button.

**Deferred (flagged):** sticky/pinned Era-3 hero viz; full pixel one-screen audit of Deep/Foundation —
both best judged against the next instrumented KittyCapture run.
