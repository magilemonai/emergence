# TODO — v4 "The Substrate Remembers" (the master list for the v4 build)

> Started 2026-09-06. v4 = `emergence-v4.html` + `v4-kit/` + `test-v4.js`, built beside the live v3
> (`emergence.html`, source untouched, archived in full at `archive/v3/`). Spec: `DESIGN-v4.md`.
> Everything below the BUILT line is playtest-gated: Cody plays, records, `/process-capture` folds it in.

## BUILT (2026-09-06, all verified: `node test.js` green = v3 92 + v4 158 + freshness; `node tools/v4-smoke.js` 35 DOM checks, 0 console errors — also against the packaged `emergence-v4-single.html`; every seed 0 overflow at 1280×800 except the ending scorecard)
- [x] Archive: tag `v3.0-flow-board-live` + `archive/v3/` (artifact, modular source, suite, tools, slices, docs) + `archive/README.md`.
- [x] Cross-cutting: bulk buy ×1/×10/MAX (rail), milestones ×10/×25/×50/×100 (+25%/tier, node pips), Ledger drawer (▤), keys 1-6 + Space, era title cards, tabs+title on one row.
- [x] Origins: commission beside the goal, standing controls in the verbs column, age-walking goal image. One screen (0 overflow).
- [x] Symbolic: one Ruleset until Formal Logic; diegetic terminal log; CRT reboot on Compile; the rule nobody wrote (#4471, 2nd contradiction); explainer prose removed; contradiction beside the goal. 0 overflow.
- [x] Statistical: method chips in the header; Experiments drawer (Cody's collapse option); shift banner overlays the plot; RR6c world drift after shift 2; prediction ghost + AUTOPILOT; the violet point. 0 overflow.
- [x] Deep: Architecture drawer (Stabilizer, Attention, Convolution, Chain of Thought, MoE, Checkpointing, Distillation); CHECKPOINT/RESTORE + DISTILL; well-fed bonus; color-strip banner; the odd wind line. 0 overflow after the fabric shave.
- [x] Foundation: FEEDBACK loop (RLHF with hidden traits, offers, lapses, Interpretability reveals); rupture renames the rail + glitches tabs; the sixth tab; operated earlier eras (+1.6× cadence, verbs relabeled/disabled, one line each); finale beat per ending; legacy across runs. 0 overflow pre + aftermath.
- [x] Proof: bot plays every new lever (feedback rated, architecture bought, restores/distills used); DOM smoke drives the real UI end to end.

## FOR CODY'S EYE (playtest-gated — do not blind-change)
- [ ] **Feel of the FEEDBACK loop**: cadence (9s gap / 10s window), whether the traits read blind, whether rewarding an ambitious offer feels tempting or dumb. Tunables: `CFG.e5.fb*`.
- [ ] **Autopilot**: does "it expects you here" register? Does unlocking it feel like a gift or a threat? Threshold: `predStreak 4` / `predRatio 0.6`.
- [ ] **Deep decision layer**: is the Architecture drawer discoverable (badge counts affordable)? Do CHECKPOINT/RESTORE and DISTILL earn their clicks? Are 7 upgrades too many for one drawer?
- [ ] **The sixth tab**: does it read as the turn, or as a menu? The "not yours" verbs, the ledger of foreshadows. Is the operated-era treatment (verbs off, violet, one line) enough storytelling or too much?
- [ ] **Pacing**: bot now emerges at ~19m (was 23m) — milestones and the fed bonus sped the middle. Cody's 7-9m/era bar needs a human run before any CFG moves.
- [ ] **Ending recap** still scrolls (+597): scorecard, read-only — keep or trim?
- [ ] Experiments-as-drawer vs a visible board: the collapse choice he floated, now built — confirm.

## DEFERRED / IDEAS (not built)
- [ ] Codex glossary + educational tidbits (horizon-2 ports from v2).
- [ ] Sound stingers for: milestone, feedback emit, the sixth tab arriving, restore/distill.
- [ ] Art: agent-tab sigil is the emergent-agent hero; Foundation caps toolAccess/recursivePlanning/interpret still glyphs (prompts in ART-PROMPTS.md 5b).
- [ ] Mobile: desktop-first stays the standing ruling (940px collapse only). Cody decides.
- [ ] Ship path when he says: `EMG_SHELL=emergence-v4.html EMG_KIT=v4-kit node tools/build-single.js emergence.html` → `node test.js` will then need the freshness check pointed at v4 (one-line change in test.js) → push.
