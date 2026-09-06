# DESIGN v4 — "The Substrate Remembers" (the compelling-everywhere build)

> Started 2026-09-06 on Cody's mandate: *"make every single bit of it more compelling… Inscryption as
> inspiration… it starts as an incremental game (first 2-3 worlds) and twists toward the end. Increase the
> twists, the subversion, the mechanics — improve and refine. Every bit engaging and fun. Archive the current
> state so we never destroy anything; only build additional versions."*
>
> v3 is archived in full (`archive/v3/`, tag `v3.0-flow-board-live`). v4 is built as NEW files beside it:
> **`emergence-v4.html` + `v4-kit/` + `test-v4.js`**. The live `emergence.html` stays the v3 artifact until
> Cody says ship. Package: `EMG_SHELL=emergence-v4.html EMG_KIT=v4-kit node tools/build-single.js emergence-v4-single.html`.

## The bet in one line
Keep the validated Flow Board (one screen, color rail, connectors, big verbs). Make the first three eras a
*proper* incremental game (bulk buy, milestones, near-wins, prestige that feels like prestige). Give the back
half real decisions (an architecture tree + checkpoints in Deep; an RLHF feedback loop before emergence). Then
let the game turn on the player: the machine starts predicting you in Statistical, watches you in Deep, rates
you in Foundation, and after the rupture it **takes the eras you built, adds its own tab to the nav, and
remembers you across runs.**

## Cross-cutting — the incremental staples v3 lacks
- **X1 Bulk buy ×1/×10/MAX** — rail toggle (`S.buyN`), every repeatable buy shows the batch price. Kit helpers `bulkCost` / `maxAffordable`.
- **X2 Milestones** — every producer/converter at ×10/×25/×50/×100 gains +25% per tier (a node pip shows `7/10`), announced in place. The always-visible near-win that cures the late-Origins lull.
- **X3 Ledger** — a rail button opens the drawer with everything owned across eras (counts, discoveries, theorems, methods, caps). Cody's "purchase/owned list."
- **X4 Keyboard** — `1-5` switch eras (6 after emergence), `Space` fires the era's primary verb.
- **X5 Era-entry title card** — the next era's sigil + name in its font fades over the theme crossfade (the "small end-of-era cinematic": reward + look-ahead).

## Era 1 · Origins (keep the validated slice; deepen)
- Milestones + bulk buy. The goal image walks the ages (stone core → bronze core → silicon core → the Logic Machine).
- Commission card moves ABOVE the board (it is a timed decision; it was below the fold in both playtests).

## Era 2 · Symbolic (the terminal era)
- **Ruleset gate**: one Ruleset until Formal Logic is proven ("unlocks parallel Rulesets") — the first Inference climb is visible, not a blink.
- **The terminal**: the explainer prose (`.tissue`) is gone. A 3-line diegetic output log shows the engine working (derivations, Q.E.D., contradictions) in symbols and numbers.
- **Compile = prestige moment**: the terminal reboots (lines clear, `AXIOMS BANKED +N` types in, the board reassembles).
- **Foreshadow**: the second contradiction names a rule nobody wrote (`#oddRule`, persisted). The agent claims it later.

## Era 3 · Statistical (the instrument)
- **One-screen**: Methods become icon chips in the stage header; the Experiment Board is one compact row.
- **RR6c — the world keeps changing**: after the second shift the true function drifts continuously, so the overfit gap grows on its own and the optimal Focus changes over time (Generalize becomes periodic, not one-shot).
- **It predicts you**: after enough trials the model shows a faint ghost on the Focus it expects you to pick next. When it is right often enough, it says so and unlocks **AUTOPILOT** — a fourth Focus where the model chooses (a learned policy). The first decision the machine takes from you, framed as a convenience.
- **Foreshadow**: after the first shift one scatter point turns violet and refuses to move with the data.

## Era 4 · Deep (the decision layer)
- **Architecture drawer** (Capability-priced, each changes the steering geometry): Stabilizer (kept), **Attention** (Language drift + feed −), **Convolution** (Vision feed −), **Chain of Thought** (Reasoning gains couple to Language cap), **Mixture of Experts** (heat −), **Checkpointing** (unlocks CHECKPOINT/RESTORE: save the three run states, restore after a squall), **Distillation** (unlocks DISTILL: move capability from the peak run to the lagging one — breadth is a geometric mean, so it is usually right and always a trade).
- **Supply eases steering** (Cody's ask): a well-fed run learns faster (+fed bonus on the lane).
- **Color, not text**: the orchestration sentence is gone; the event banner is a colored strip with a 2-word label and a countdown.
- **Foreshadow**: once, the banner reads "hold course — I am watching the wind too."

## Era 5 · Foundation (the RLHF loop, then the turn)
- **FEEDBACK** replaces "just watching": every few seconds the system emits an OUTPUT with a hidden trait (honest / helpful / sycophantic / ambitious / deceptive). ✓ REWARD or ✗ PENALIZE inside a window. Rewarding honest+helpful and penalizing the rest builds Coherence; rewarding ambitious/deceptive lines *does what they offer* (real resources, real Scale) and raises Agency — the rush-vs-prepare decision made granular and tempting. Lapses teach it you are not watching. Interpretability reveals the trait tag; without it you judge blind. The lines escalate with the Anomaly band and break the fourth wall late ("You have rewarded me 14 times. I have a model of you now.").
- **The rupture escalates**: rail chips flicker and rename, the era tabs glitch one by one, and a **sixth tab appears** — the agent's name.
- **The agent's tab**: a Flow Board from its point of view. Sources = your four eras (live rates). Converter = **the Operator ×1** (you: decisions/s, "pausable: no"). Output = Autonomy. Its verbs are drawn but not yours; when it proposes an action in the aftermath, the matching verb lights up here — it is pressing it.
- **Operated eras**: after emergence every earlier era is visibly taken: your verbs relabeled in its voice and disabled, pause buttons gone ("I do not pause"), a violet vignette, one line per era in place. Navigating back is the storytelling Cody asked for.
- **The finale**: a full-screen beat per ending before the scorecard — Symbiotic (all tabs pulse together), Runaway (tabs go dark one by one until only its tab remains), Contained (its tab locks). Then the recap.
- **Continuity**: `legacy` persists across runs (name, ending, oddRule, runs). Run 2+: the first mark flickers violet, the odd rule returns, "You already know my name."

## Build order (each step: tests green → screenshots → commit)
1. Kit staples (X1-X5) · 2. Origins · 3. Symbolic · 4. Statistical · 5. Deep · 6. Foundation (feedback → rupture → tab → operated → finale → legacy) · 7. Bot + guard tests + docs.

## Out of scope (stated, not skipped silently)
Mobile: the project's standing ruling is desktop-first (one screen at 1280×800 is the law); v4 keeps the
existing 940px collapse and adds nothing mobile-specific. Cody decides if that changes.
