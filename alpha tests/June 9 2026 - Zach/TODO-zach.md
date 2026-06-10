# Zach Alpha Feedback — Action TODO (sequenced)

Source: `Zach-feedback-parsed.md`. Decisions locked with Cody (2026-06-09):
1. **Objective: put it back in** (per-era goal; designed, not naggy).
2. **Scroll stays** — make it snappier + more discrete (snap-to-era, collapse completed eras harder).
3. **Era 2 copy: drop "by hand"** — frame as the *early analog era of digital* (CRT), clearly happening on a computer.
4. **Building name = the title; flavor demoted** (keep flavor, just not as the headline).
5. **Research side:** Cody indifferent → place on the LEFT (Zach: right reads as secondary).

Working rule: keep `node test.js` green; commit per green item; check the box; push so the live build stays current.
Heavy REDESIGN items (Batches 6-8) — do the concrete, clear wins and PAUSE to ask Cody on any real fork.

---

## Batch 1 — Origins polish (FIX NOW, low risk, all in the era Zach loved)
- [x] 1.1 Grey out unaffordable buys; remove red cost text entirely (Zach 23-24)
- [x] 1.2 Flows show **+gross − drain = net /s** (resource tooltip: ▲ produced / ▼ consumed / = net) (25)
- [x] 1.3 Remove completed discoveries from the research list on completion (12)
- [x] 1.4 Building/discovery name becomes the **title**; flavor line demoted to sub/tooltip (decision 4; 17)
- [x] 1.5 Resource counts always legible + a discovered upgrade is *felt* (live per-click yield on Inscribe/Quarry + a discovery toast) (21-22)
- [x] 1.6 Sound: volume slider; separate SFX control; **Quarry ≠ Inscribe sound** (33-35)
- [x] 1.7 Clarify or drop the bare "running" status indicator (36)

## Batch 2 — Research → persistent sidebar (REDESIGN-lite)
- [x] 2.1 Research no longer greys out / blocks the rest of the game; keep playing while it's open (8)
- [x] 2.2 Research = **PUSH-CONTENT sidebar on the LEFT** (Cody decided 2026-06-10): opening it shifts the Origins panels right so nothing is covered; toggle stays (open/close), but it's non-blocking + persistent while open (9, decision 5)
- [x] 2.3 Split into two sections **inside that sidebar**: **Discoveries** (the 5 building-unlocks: scribe, stoneworking, clayTablets, kiln, theFoundry) + **Refinements** (% upgrades: tally, apprenticeship, alphabet, bronzeCasting, wheel, numerals, glassmaking + the repeatable Refinement) (14-15)

## Batch 3 — Objective + age framing (decision 1)
- [ ] 3.1 Reintroduce a per-era **objective line** ("▸ next: …" with progress) — designed, subtle, not naggy (55)
- [ ] 3.2 Frame the **next age as the goal**; "Stone Age" in the corner shouldn't read as the title (32)
- [ ] 3.3 Give each age-up a small felt beat (it currently does "nothing") (30-31, light pass)

## Batch 4 — Economy fix (REDESIGN, highest mechanical priority)
- [ ] 4.1 **Toggleable / throttle-able converters** so a subtraction can't soft-lock you (the Marks=0 trap) (26-28)
- [ ] 4.2 Make starvation feedback legible (a converter idling for lack of input should read clearly) (29)

## Batch 5 — Scroll snappier + discrete (decision 2)
- [ ] 5.1 Snap-to-era scrolling so you land cleanly in one world (38-39)
- [ ] 5.2 Collapse completed eras harder so the active era is unambiguous (40)

## Batch 6 — Symbolic legibility (REDESIGN; decision 3)
- [ ] 6.1 Copy away from "hand-written / by hand" → **early-analog-digital / CRT** framing, clearly on a computer (45)
- [ ] 6.2 "Write Rule" must not look like a text-input field (it's a click) (42)
- [ ] 6.3 Make Compile legible + non-scary (what it resets, why it's good) (44)
- [ ] 6.4 Relabel so the era doesn't read as "the game ended" (era name repeats pre/post) (46)
- [ ] 6.5 De-jargon (theorems/lemmas/daemon/PID/axioms) + a clear moment-to-moment goal (41,43,47,48) — PAUSE for design fork

## Batch 7 — Statistical legibility (REDESIGN)
- [ ] 7.1 Discovered Methods persist + are readable (stop pop-and-vanish) (50)
- [ ] 7.2 Make accuracy-vs-overfit-gap readable (the "accuracy up but bar down" confusion) (51)
- [ ] 7.3 Clarify the verbs (Run Trial / Expand / Calibrate / Focus) + a clear goal (49,52-54) — PAUSE for design fork

## Batch 8 — Teaching layer (REDESIGN, the throughline)
- [ ] 8.1 Onboarding/teaching beats for Symbolic & Statistical (Origins taught by accident; later eras don't teach) (57) — PAUSE for design fork

## Deferred (NOT this loop — revisit later)
- Pointer hints (11) · Civ-style timeline/log (13) · sub-age reskins within Origins (30-31 full) · Tally Marks ordering (20) ·
  Scribe→"place" rename (19) · % upgrade visible art (16) · pacing retune for reader-speed, ~4× autoplayer (56)
