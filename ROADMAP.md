# EMERGENCE roadmap - the longer arc

> Written 2026-07-15 (the Fable handoff, forward-looking half; context in
> `OPUS-HANDOFF.md`). Opus steers this document; **Cody decides** - every horizon-2+
> item below is a proposal until he rules on it. `NEXT.md` stays the live 1-6 bullet
> board; `TODO-v3-unified.md` stays the deep item-level record; this file holds the
> shape of the whole journey so those two don't have to.

## Horizon 1 - close the current loop (playtest-gated, mostly waiting on Cody)

The four `NEXT.md` bullets, in dependency order:

1. Cody's steps: 3 cap images → his live-build capture → Zach's capture
   (`NEXT-STEPS-CODY.md` walks it; `PLAYTEST-PROMPTS.md` holds the questions).
2. Process both captures (`/process-capture`) → the answers unblock: Statistical
   +515 / Origins +289 one-screen calls (collapse vs move - his eye), Deep capGain
   feel (bot says ~6m at perfect play), Hold-lever bus ordering, ending-recap length.
3. Back-half agency design session WITH Cody: Foundation pre-emergence needs a real
   decision layer once caps are bought, and the deferred aftermath rework (RR8/RR9/
   RR10 in `TODO-v3-unified.md`) belongs in the same conversation.
4. Then a Jordan round / second fresh-eyes pass, same pipeline.

Exit criteria for this horizon: every era one-screen at 1280×800, no era Cody calls
passive, pacing inside the 7-9m band on a real run, all art wired.

## Horizon 2 - the v2 features that did not survive the rebuild (port-or-drop, Cody rules each)

The v3 rebuild deliberately rebuilt the game, not the meta. These exist fully working
in `archive/emergence-v2-final.html` - port the concept, never the layout:

- **Codex glossary** (searchable, era-gated concept entries) - the teaching layer.
- **Educational tidbits** at felt moments - v3 carries only 2 Foundation ones; v2 had
  a full set incl. the era-entry foundational four (RR1) and the metric-mirage lesson (RR7-light).
- **Continuity** (one carried memory across runs) + **NG+** - v3 has telemetry-safe
  restart but no meta-progression.
- **Challenge board** (RUSH / STILLNESS / FAMINE) + scorecard concept tips.
- **RR6c** (a distribution shift that changes the OPTIMAL Focus) and the **full RR7**
  benchmark-readout reframe - both were open design calls before the rebuild.
- Era-fading / obsolescence (`S.obsolete` scaffold, paused since v2) - revisit only
  if the living-supply-chain feel ever goes stale.

## Horizon 3 - toward a public release

Rough sequence once the alpha loop stops surfacing structural work:

- **Rupture escalation** - Cody's standing ask: creepier, show-don't-tell, a
  UI-glitch-rebuild moment. The one place he has invited maximal ambition.
- **End-of-era cinematics** (reward + look-ahead; may need assets → `ART-PROMPTS.md`).
- **Sound pass** - per-era SFX profiles exist; the beds crossfade; what's missing is
  event stingers tuned by feel.
- **Accessibility** - reduced-motion is partial; keyboard/touch tooltips, focus order,
  and the tri-mixer on touch are open. Mobile is currently desktop-first by design.
- **Aggregate telemetry** - REC exports per run exist; a small pacing dashboard over
  many runs (Cody + Zach + Jordan) turns tuning from anecdotes into curves.
- **Release checklist** when Cody calls it: og/meta tags + favicon, an itch.io mirror
  or keep GitHub Pages, a feedback link in the ending screen, save-format version
  bump policy, and a public README that isn't the dev contract.
- **The Foxfire angle** - the game teaches real AI concepts (bias-variance, drift,
  emergence, alignment-vs-control). A companion "what this game gets right" page
  would make it usable in his AI-literacy work. Cheap, high-leverage, his voice.

## Skills, routines, and subagents worth building

`LOOPS.md` (deck-scouted 2026-07-02) already names four loops - all four are sound.
Recommended build order, then the additions:

1. **Pacing baseline** (LOOPS #2): dump the bot's per-era timings + starvation % to
   `pacing-baseline.json`; fail on drift. Every CFG tune self-checks. Build first -
   it hardens the thing most likely to regress silently.
2. **Overflow ledger** (LOOPS #3): `tools/overflow-sweep.js` sweeping all 7 seeds to
   `overflow.json`, assert no growth. Kills the hand-copied-numbers drift (already
   visible: NEXT.md quotes source numbers, the artifact measures tighter).
3. **Capture→steering regen** (LOOPS #1): extend `/process-capture` step 3 to rewrite
   `NEXT.md` top bullets from the TODO - one source of truth, deck stays honest.
4. **Telemetry→guard tests** (LOOPS #4): `tools/parse-run.js` over REC JSONs; mint a
   smoke per fix (the `deep-lever-smoke.js` pattern).

New skills to author (each is a repeated manual sequence I performed by hand):

- **/ship** - build-single → full gate → seed sweep → commit; prints "ready to push,
  awaiting Cody". Post-push mode: poll Pages, curl the v3 marker + a few assets.
  Folding deploy-verification in here (not a cron) respects the mortality rule.
- **/key-art** - the ChatGPT-export pipeline: luminance-key to alpha (white-bg
  255−min(rgb), black-bg max(rgb)), resize 512px, install to `assets/`, wire the
  icon map, screenshot-verify. Done by hand ~30 times; it is pure mechanics.
- **/balance-sweep** - a Workflow (needs Cody's explicit opt-in per house rules):
  fan out the progression bot across candidate CFG values in parallel, table the
  per-era times vs the 7-9m band + guard margins, recommend one. Turns tuning
  sessions from serial guesswork into one decision.

Subagents: keep it lean. `/process-capture` could dispatch a frame-reader subagent
(video frames at transcript timestamps, parallel with transcript parsing) - worth it
only if capture processing starts feeling slow. The house `code-review` skill already
covers pre-ship review; point at it, don't duplicate. No crons: the no-nag doctrine
means nothing here should fire on a schedule - every routine hangs off an event
(a capture arriving, a ship command).

## The standing decision queue for Cody

Kept here so no session re-litigates them; each needs one ruling, most after his run:

1. Statistical secondary panels: collapse vs move (burned once guessing - options, his eye).
2. Origins +289: what leaves the first screen.
3. Hold lever: keep last in the supply bus, or move the Knowledge pair up.
4. Deep capGain 0.00125: right, or re-tune after his hands.
5. Ending recap: scrolling scorecard OK, or trim.
6. Horizon-2 ports: which of Codex / tidbits / Continuity / challenges come to v3.
7. When (whether) to fold `emergence-v3-single.html` naming + the v3 slices cleanup -
   the superseded `emergence-v3*.html` slice files still sit in the repo root.

## Provenance

- LOOPS items: `LOOPS.md` (deck-scouted 2026-07-02). NEXT board: `NEXT.md`.
- v2 feature inventory: `CLAUDE.md` ("v2 is now the shipped main" section) +
  `DESIGN-v2.md`; all verifiable in `archive/emergence-v2-final.html`.
- Open design items with capture timestamps: `TODO-v3-unified.md`.
- Rupture ambition, color-not-text, back-half passivity: the memory file
  `emergence-ui-intuitiveness.md` (quotes dated 2026-06-30/07-01).
- House rules referenced: the `house-doctrine` + `steering-conventions` skills.
