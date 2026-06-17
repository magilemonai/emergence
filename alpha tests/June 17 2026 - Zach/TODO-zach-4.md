# Zach Alpha Round 4 — TODO (2026-06-17)

Source: `zach_feedback_transcript.md` (full voiced playthrough to a Contained / S ending) +
the Run Recorder export (full arc, speed 1). Round 4 ran on the shipped v2 `main`.

**Headline:** the run gives a clean pacing read, but Zach's feedback is dominated by
**legibility and wording**, not pacing. He says "the text is too small" 6+ times and never
once says an era felt too long or too short. Decision (Cody, 2026-06-17): **UX/legibility
first**, fold in the confirmed bugs, then a pacing pass on a readable build, then round 5.

His verdict, verbatim: *"The game is most fun in Origins and Deep. It is most confusing in
Statistical. It is not very fun but I understand what I'm supposed to do in Symbolic, and
Foundation doesn't make sense to me."*

---

## Pacing read (from the run, vs the 7-9 min bar) — informs Tier 5, not this sprint

| Era | Time | Verdict |
|---|---|---|
| Origins | 11:39 | Long, but he loved it. ~2 min was him reading the Codex (idle, zero clicks gt20-150). Real play ~9:30. |
| Symbolic | 9:41 | In band. Back half lulls (~3.5 min metalogic→expert capstone, "taking a long time to make the thing"). |
| Statistical | 5:14 | Short **and** his most confusing era. Lengthen + clarify together. |
| Deep | 13:42 | Way long. He loved it but flagged the tail: "the last bit is hard to get, not much I can do to speed it up." |
| Foundation (pre) | 6:10 | Fine. Scale 1550 / recursion 6 at emergence, as designed. |
| Foundation (aftermath) | 0:57 | Broken-short. The negotiation layer never engaged. **Most important pacing finding.** |
| **Total** | **47:22** | Shape is the problem more than the total: Deep + Origins eat the budget; Statistical + aftermath starve. |

---

## Tier 1 — Legibility (his #1 complaint, by a mile)

- [x] **R4.1 — Raise the text-size floor across all eras.** DONE via the global `--ui-scale`
  (R4.2): default 1.1 lifts the whole UI 10%, so the 11px tier reads ~12px and 12px reads ~13px.
  NOTE: a handful of tiny positioned labels (9-10.5px: `.tri-bal-lab`, `.viz-cap`, `.nt-cap em`,
  `.sup-glab`) still read small even after scale — deferred to a per-label compression pass once
  Cody can eyeball, to avoid overflow in tight UI spots I can't see.
- [x] **R4.2 — Global UI text-scale, adjustable.** DONE. `--ui-scale` on `:root`, applied as
  `body { zoom }`, persisted to `emergence-uiscale`, applied on boot. Slider (90-150%) added to
  the sound panel for now; it graduates into the full Settings panel in R4.9.
  **EYEBALL NEEDED:** confirm the 1.1 default feels right (and that zoom doesn't break any
  era's one-screen layout). Dial it in the ♪ panel → "Text size".
- [x] **R4.3 — Codex search field text bigger** (12.5px → 14px).

## Tier 2 — Wording: lore line + plain-English mechanic, everywhere

- [x] **R4.4 — Kill the verb "lean" in player-facing text.** DONE. Commissions now say "The
  Record/Forge side gains +X% production"; contradictions say "Rulesets gain / manual writes
  gain +X% forever"; the Hands sublabel is "split between the crafts"; the Deep shift says "pour
  compute in." All player-facing "lean" gone (only code comments keep it). Also fixed an em-dash
  in the Deep shift banner while there.
- [x] **R4.5 — Rewrite Foundation/Era-5 mechanic text in plain English.** DONE. Coherence Codex
  entry rewritten literally ("how closely the agent's goal will match what you meant… becomes its
  starting Alignment when it wakes"); Capability entry now says where it comes from in Foundation
  ("the Deep fabric keeps producing it"); the intro toast names the Capability source; the
  Coherence meter relabeled "how aligned it will wake" (was the misleading "how well you
  understand it"). Anomaly left intentionally mysterious — that's the emergence twist. Fixed two
  em-dashes in the touched strings.
- [ ] **R4.6 — Audit every resource/building/upgrade for the two-line standard** (flavor +
  literal mechanic + effect). His general note: "the wording of everything needs the lore side,
  the flavor side, and then also the plain English 'this is the mechanic, this is the effect.'"
- [x] **R4.7 — Statistical intro text is too wordy.** DONE. Tightened the Era-3 teaching beat:
  step 3 went from a two-clause cram to one clean sentence, dropped the redundant "data it has
  never seen" tail (the VALIDATION needle shows that), removed three em-dashes. Lead/steps now
  scan in a glance.
- [ ] **R4.8 — Declining a commission should have flavor, not feel bad.** "Declining feels
  weird… say 'okay, they go on their way,' some lore flavor."

## Tier 3 — UI structure

- [ ] **R4.9 — Settings panel, opens on Escape.** Music, SFX, text size (R4.2), pause,
  reset/hard-reset, restart. Consolidates the existing sound panel + dev-ish controls into one
  player-facing place.
- [ ] **R4.10 — Split Goals / Codex / Log into clear tabs.** Today GOALS merges objective + log
  and feels "overwhelming, everything's the same color." Separate them; he wants a real
  "Message Log / Milestones" surface.
- [ ] **R4.11 — Filter Goals + Log to the current era.** "Make it so you can only see the goals
  of that era and the logs from that era."
- [ ] **R4.12 — Bring color back to the Log.** It went monochrome and unreadable in the later
  eras; restore per-event-type color cues.
- [ ] **R4.13 — Codex: newest era on top.** As you reach each era, flip the order so the newest
  is first (currently fixed Origins→Foundation).
- [ ] **R4.14 — Per-building production shown inside the building box.** "Nowhere in the Scribe
  box does it show me the total the scribe is making" — he wants the /s flow on the tile, not
  only in the top bar.
- [ ] **R4.15 — Put the flows readout back at the top.** Moving it down left "empty space"; he
  wants it up top where it was.
- [ ] **R4.16 — Reposition the log pop-up** so it doesn't cover the top UI when it appears.
- [ ] **R4.17 — Post-era simplification.** Once an era is done, collapse it to one compact box
  (current phase / key resources / flows) "with just what we want to mess with."
- [ ] **R4.18 — A different sound for event/commission pop-ups** (vs the discovery ding).

## Tier 4 — Bugs (confirmed in the run; fold into the UX pass)

- [ ] **R4.19 — Discovery ordering: Glassmaking gates the Foundry.** `glassmaking` (mech:
  "Foundries run 50% faster") is a `req` of `theFoundry`, so a Foundry upgrade always appears
  before the Foundry exists. Confirmed in the event log (glassmaking 598s, foundry built 676s).
  Fix the gate or reframe so upgrades follow the thing they upgrade.
- [ ] **R4.20 — Stale objective.** "Fabricate the Logic Machine" stays pinned at the top of
  Origins after you've already fabricated it. Clear it on completion.
- [ ] **R4.21 — NG+ "Begin again" doesn't restart.** "I began again but it didn't begin again."
  Continuity restart path (`location.reload()` at the picker) likely resumes the finished save
  instead of booting fresh. Needs a code triage. **[verify in code]**

## Tier 5 — Pacing (AFTER the UX pass, on a readable build)

- [ ] **R4.22 — Lengthen + clarify Statistical** (5:14 and most confusing). Clarity is the
  priority; added time mostly follows from making the loop legible.
- [ ] **R4.23 — Trim Deep's tail** (13:42). Late drift was a slog; he locked Reasoning 5+ times
  at the end and wanted "a mechanic to help me here." Look at the Era-5 capability gate + late
  drift erosion at high node counts.
- [ ] **R4.24 — Fix the 57-second aftermath.** Heavy prep (9 align actions) → walked into
  emergence with high coherence → instant Contained. The negotiation gameplay never ran. Either
  a minimum aftermath duration or rebalance so prep earns a better ending without skipping the
  loop. **[design + knob]**
- [ ] **R4.25 — Smooth Origins' converter sawtooth.** Marks oscillate violently (gt410: 19 →
  gt420: 159 → gt430: 87) because scriptorium/smelter/foundry drain faster than scribes/miners
  produce, forcing constant pausing. He wants more Scribe/Miner upgrades so he's not babysitting
  the off-switch.

## Tier 6 — Per-era depth & what he loved (protect / extend)

- [ ] **R4.26 — Origins is the model.** Hands slider "fantastic," commissions "I'm such a fan."
  "There's so much about it that I want to put into the other eras." Use it as the feel target.
- [ ] **R4.27 — More interesting commission rewards** (he wants variety beyond +% / free hand).
- [ ] **R4.28 — Commission portraits.** "I want a little person's face / a man's outline to
  appear here." [art — ChatGPT prompt]
- [ ] **R4.29 — Symbolic clarity:** rule-set vs inference distinction unclear; banked inference
  "0 / 1000k" at top unexplained; green-on-green hard to read; accidental axiom compile.
- [ ] **R4.30 — Deep: lock icon on a frozen run** (on the run's up/down arrow row), and make
  clear that freezing also blocks gains, not just drift.
- [ ] **R4.31 — More unique click sounds** when clicking fast (he liked the per-action sounds,
  wants them pushed further).

## Tier 7 — Design decisions needed (Cody's call before I build)

- [ ] **R4.32 — Backbone resource per era (his best structural idea).** Origins has Silicon as
  the through-line; he wants Symbolic and Statistical to each have ONE resource required across
  the run, shown as a live flow in that era's top tab ("look up top and see your bottlenecks").
  Touches the economy's identity — **needs Cody's decision on what those resources are** before
  implementing the tab-flow display.
- [ ] **R4.33 — Codex → visual tech-tree tab.** "Take the Codex and add a visual component… its
  own tab… a tech tree where you can see how things relate." Bigger build; scope separately.
- [ ] **R4.34 — Protect the emergence surprise (discuss with Zach).** Cody's question: are we
  giving the twist away? Audit: the per-era OBJECTIVE is already safe (Foundation reads "Improve
  the system" with a "don't spoil the hidden threshold" comment). The exposure is the
  Deep→Foundation handoff toast ("the model is general enough to turn on itself") + the Anomaly
  dose. The real tension to test with a fresh Zach run: with the ending hidden, is the rising
  Anomaly breadcrumb enough, or does Foundation feel rudderless? Cure his "doesn't make sense" by
  legibility of the MEANS (R4.5), not by naming the ENDING. Surprise only lives on run 1 by design.

## Tier 8 — Nice-to-haves / notes

- [ ] Audio: he had a sync issue he resolved on his end (not ours).
- [ ] He loved the cross-era reach-back and going back to Origins for Silicon ("I like having to
  go between the ages"). Protect it; R4.25 makes it less punishing.
- [ ] Continuity concept landed hard ("that's so cool"), pending the R4.21 restart fix.
