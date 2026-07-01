# Cody playtest — v3 Origins slice (Flow Board) — 2026-06-30, ~9.4 min

Source: `KittyCapture/captures/20260630_223039/` (transcript 137 segs; `t0_epoch` 1782873039.715).
Instrumented run JSON survived this time: `KittyCapture/emergence-v3-run.json` — **18 dead-clicks**,
completed Origins (age 3, done) at t=561s; buys scribe×26, miner×24, scriptorium×8, smelter×8,
foundry×2, refine×4; all 12 discoveries; 3 commissions. He played `emergence-v3.html` (the slice).

## HEADLINE — the paradigm is validated (Phase 1 GATE = PASSED)
> [01:10] "this is much more like what I was thinking… definitely."
> [05:16] "if this is a proof of concept for the layout, I'm aligned. This is exactly what I meant when
> I said dramatic reinterpretation. I'm pleased with the level of disruption… it does feel totally
> different… I'm enjoying this."

**The invented flow viz WORKS** (the one thing no research could source):
> [02:29] "I kind of like that design in the center. The scriptorium is taking the marks and turning it
> into knowledge visually that way. That makes a lot of sense."
> [04:00] "if I build more of this then I get more knowledge… the ore also goes to the scriptorium."
One screen works:
> [03:15] "I'm starting to see that there's more stuff here that all fits on one screen."

Keep: the center flow board, the pipeline connectors, one-screen composition, color-coded rail.

## CRITICAL BUG — clicks not registering ("dead clicks")
The dominant complaint, repeated ~8× and confirmed by 18 logged dead-clicks:
> [02:20] "Some of these are hard to click on." [04:13] "the buttons are sometimes when I click, they're
> just not registering… happened twice on build ore… I clicked it again and again." [06:37] "These
> clicks are failing a lot of the time… very buggy, we don't want that." [07:51] "the biggest thing is
> the pain of not being able to click on stuff in a game where the primary mode of gameplay is clicking."
**Cause:** `refresh()` rewrites buy-button `innerHTML` every 100ms tick, replacing the child nodes
(incl. the `<span class="c">` the pointer is on) mid-click → the click never synthesizes. This is the
"build-once / update-in-place" rule the main game already follows and the slice violated. **Fix:**
change-detect every per-tick DOM write (only update when the string changed). #1 priority.

## BUG — research drawer buttons are blank
> [00:34] "there's nothing here, I'm not seeing anything in these buttons." [00:46] "I can't tell what
> I can buy." [03:42] "I can't see what anything costs… no idea when something is eligible to be bought."
**Cause:** `buildResearch` renders discovery buy buttons with NO text, and `refresh()` never updates
them. **Fix:** show cost + per-requirement affordability on each discovery button (lead with the
effect, numbers-first; green ✓ when affordable, grey while short, never red).

## FEATURE ASK — Fabricate = a mini "wake up" cutscene (era hand-off)
> [08:11–09:20] "it went from dormant to active… I want it to prelude the vibe of the next era — the
> CRT neon cyberpunk vibe of Era 2. A pulse animation of this waking up that hints that color scheme…
> it should be dormant and shadowed most of the time, then when you can fabricate, a tiny mini cutscene
> to reward getting to the end of Origins."
Show-don't-tell hand-off: the Logic Machine wakes with a pulse teasing Symbolic's palette. Good delight
beat + a template for every era transition.

## SMALLER
- Commission meaning not immediately legible [06:57] "I still want to know what the caravan does… I want
  to immediately know the stuff." → clearer on-card label / effect.
- "Looks very basic / proof of concept — we'd want to polish and refine" [05:09]. Expected for a slice;
  a visual polish pass after the bugs (connectors more alive, spacing, texture).
- Music: he wasn't sure it was hooked up [07:06] (it is, via the ♪ button — he didn't toggle it). Minor:
  make it more discoverable or auto-offer.

## Decisions / state
Phase 1 gate PASSED → proceed to Phase 2 (lock Origins + extract reusable components) AFTER this
bug-fix iteration. Order: fix dead-clicks + blank research buttons (core loop) → fabricate cutscene →
polish. Then extract components and port the engine.
