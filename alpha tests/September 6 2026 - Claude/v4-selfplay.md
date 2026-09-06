# Claude self-playtest of v4 — 2026-09-06 (three runs, human cadence, real pointer events)

**Method.** `tools/v4-playtest.js` drives `emergence-v4.html` in headless Chrome at **1× game speed** the way
a decent player would: real mouse events on the real buttons (so dead clicks and covered buttons register),
one action every ~0.4s, decisions read off the screen (gap on the track, badges, glowing corners), screenshots
at every beat, era timings in game minutes. Three runs: run 1 and run 2 were aborted when they exposed
bugs that would have stalled a human too; run 3 is the clean arc. Cody's bar for comparison: 7–9 min per era,
always a near-win, no dead clicks, one screen.

## Era timings (game minutes, 1×, run 3)
| Era | Took | Notes |
|---|---|---|
| Origins | 4.9 | 9/12 discoveries, 19 scribes / 13 miners, 0 dead clicks. Fabricated with 1.5K Knowledge banked (over-built scriptoria). |
| Symbolic | 4.9 | Formal Logic ~60s (the one-Ruleset gate), then the theorem burst; 2 Compiles (8 Axioms), 4 contradictions. 0 dead clicks after the toast fix. |
| Statistical | 5.9 | all 6 Methods, 2 shifts, Autopilot unlocked ~1.7 min in and used. |
| Deep | 10.1 | breadth gate at 25.8m; 6 Architecture upgrades + Stabilizer Lv4; 11 nodes only — **Silicon was the bottleneck** (Data/Insight/Knowledge piled to 9–25K while nodes stalled at 46 Si). Heat peaked WARM. No Restore/Distill used (runs stayed balanced; the tool row was below the fold until fixed). |
| Foundation | 11.0 | pre-emergence **8.4** (Scale climb, 54 outputs rated: 27 ✓ / 27 ✗, 0 lapsed, 0 wrongly rewarded; 5 caps; recursion Lv4) + aftermath **2.6** → **SYMBIOTIC**, agent **NOUS** (Reasoning-dominant). The sixth tab listed #4471, the point, the trials it chose, the wind at 22:07. Origins read "NOUS does this now". |
| **Whole arc** | **36.8** | 1× wall clock = game clock (no timer throttling). 0 console errors across the arc. |

## Verdict
The arc plays end to end at human cadence in ~37 minutes with every mechanic exercised through the real UI; the
turn (rupture → NOUS's tab → operated Origins → finale → Symbiotic) fires in the right order with no errors.
Two eras run long against Cody's 7–9 band (Deep 10.1, Foundation 11.0); the first three sit at 5–6. The
bugs below were all in the first screen or the first minute of a mechanic — exactly what a human would hit.

## Bugs found and FIXED this session (all verified: `node test.js` green, `node tools/v4-smoke.js` 35/35, screenshots)
1. **Toasts covered buttons.** The timed cards I moved beside the goal (Origins commission, Symbolic contradiction) and Statistical's supply bus sit bottom-right, exactly under the toast stack. Run 1 logged **29 dead clicks** on toasts covering Fulfill/Discard/the supply bus. Fix: toasts dock top-right under the rail (positioned from the rail's measured height), step left when the side drawer is open, stack capped at 2; the redundant "commission arrives" / "contradiction detected" toasts are gone (the glowing card is the announcement).
2. **Autopilot pushed EXPERIMENTS below the fold.** A fourth Focus segment grew the left column past 713px; the Experiments button (the only way to fund Regularization, which lifts the 80% ceiling) became unreachable — a human would stall at the ceiling. Fix: Autopilot is a compact toggle under the dial. Seed `seedstatauto` measures 0 overflow.
3. **"RUN GENERALIZE TRIAL" wrapped to two lines** and pushed the same button off-screen whenever the Focus was Generalize. Fix: the verb is always "RUN TRIAL"; the active Focus rides its second line in the Focus colour.
4. **Autopilot came far too early** (20s / 38s into the era): the prediction counted every Focus twitch. Fix: predictions start at 120 trials, need a 5-streak, and only count Focus changes that stand ≥5s (deliberate decisions). Run 3: unlocked at ~1.7 min with 6/7 called.
5. **The Experiments badge pulled spend toward cheap Studies.** It counted any affordable card, so a greedy player funded 10 Studies and 1 Method in 1.7 min and never saved for Regularization. Fix: the badge says METHOD only when the Method is affordable; otherwise the button shows numbers-first progress toward it ("179/438 Clustering").
6. **The rail wrapped to two rows in Deep** (6 chips + the right-side controls), which then sat under the toasts. Fix: chips slightly narrower, music button is an icon; measured one row in Deep.
7. **Dragging the ternary mixer selected the corner labels** in Chrome (blue highlight boxes) — present since v3. Fix: `user-select:none` on the fabric.
8. **Dead-click telemetry counted every mixer drag as dead** (the SVG polygon wasn't in the actionable list) — present since v3, so Cody's Deep dead-click counts were inflated. Fixed.
9. **PROVE IT stayed enabled while the Expert proof ran** (harmless no-op clicks). Now disabled while proving.
10. **Nothing to do during the one-Ruleset gate** with 1.5K carried Rules. Fix: writing a rule by hand now advances the active proof (+0.6 per click), so hand-clicking is the early proving method, then Rulesets take over.
11. **Deep's tool row (CHECKPOINT/RESTORE + DISTILL) fell below the fold** once both were unlocked. Fix: tighter left column (hero, supply rows, tool rows, one redundant header); seed `seeddeeptools` measures 0 overflow. The Architecture drawer's 7th tile also sat 24px under the fold — tightened to fit.
12. **The feedback pool repeated itself** within a minute in the stable band (6 lines). Now 43 lines (10–11 per band, several dynamic) with a 9-deep no-repeat window.
13. **Post-emergence noise**: Deep's DRIFT SQUALL toasts, Origins commissions and Symbolic contradictions kept firing in eras the agent now runs. All three stop at emergence.
14. **Commissions were never fulfillable** in any run (ask = 45s of gross output while converters eat the stream). Tuned to 28s (`CFG.e1.commMult`) — still needs a pause-the-craft decision, which the driver never makes. FLAG for Cody: is "pause the Scriptorium to bank Marks for the temple" a decision the card should hint at, or is it fine as a discovered trick?

## What read well (from the frames)
- Era title cards (ERA 2 · THE SYMBOLIC ERA BEGINS, sigil, the era font) are a real reward beat.
- Milestone pips (17/25 · ×1.25) are always in view and pull the next buy.
- The Symbolic terminal narrates the engine; Compile's CRT reboot lands as prestige (engine cleared, axioms banked, board reassembles).
- The Statistical stage + Experiments drawer + method chips fit one screen with room; the "it expects you here" tag on the Focus and the Autopilot toggle read without text.
- Deep's Architecture drawer is discoverable (badge counts what's affordable); purchases land every 1–2 minutes at human cadence — a decision rhythm the era lacked.

## Pacing notes for Cody (no CFG touched beyond the two flagged above)
- Symbolic bursts after Formal Logic because ~1.5K Rules arrive from Origins Knowledge; the gate makes the FIRST climb visible but the rest is fast. If you want 7–9 min here, `seedFromKnowledge` (1.0) or theorem `infScale` are the levers.
- Statistical at 5.9 min is inside the band. Deep 10.1 and Foundation pre-emergence 8.4 are the long ones: Deep is Silicon-bound (the new Foundry pulse teaches it); Foundation's climb is `CFG.e5.scaleRate` (1.0) — with a decision every 9s it is active, but 8+ minutes of it is a lot. Suggest 1.3–1.5 after your run. The bot's ~19-min emergence is a skill ceiling; this human-cadence run is the better number.
- Silicon is the Deep bottleneck when a player over-buys the other feedstocks — the supply bus makes Foundries one of five equal buttons. A "Silicon low" pulse on the Foundry button (like the Hold lever's amber) would teach it without text.

## Not changed, for your eye
- Ending recap still scrolls (read-only scorecard).
- The greedy-Studies trap is softened by the badge; the deeper fix (Studies get expensive faster) is a tune.
