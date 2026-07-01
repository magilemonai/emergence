# Cody self-playtest #2 — 2026-06-30 (KittyCapture, full ~67-min arc, r6 iteration-1 build)

Source: `KittyCapture/captures/20260630_210119/` (transcript.txt = 671 segments; video.mp4 + mic.wav;
manifest `t0_epoch` 1782867679.701). Cody played the **r6 iteration-1 build** (`REC.v:3` in the run
JSON confirms it) start → emergence ending.

**Run JSON is empty / unusable:** he hit New Game+ near the end, which runs `softReset` and clears
`REC`, then "download run" grabbed the fresh post-reset state (one `@deadclick` at gt=0.6s, endEra 1).
Lesson: telemetry must **snapshot the completed run before a reset can wipe it** (or auto-save at the
ending). Fold into the rebuild. The transcript carried the signal; the JSON did not.

## THE HEADLINE — he wants a bold, ground-up UI rebuild
Said repeatedly and emphatically. Iteration-1 incremental polish was the **wrong altitude.**
> [09:34] "I think we almost have to be supremely destructive. We got to really revert."
> [09:41] "I want the next one to be boldly stripped down… go back to bare bones… don't feel the need
> to stay bundled to all this work we've done."
> [54:47–57:26] "save this as an archive… I want you to rip this thing apart and rebuild it from the
> ground up… Should it feel like the same game? Yeah. Should it look like the same game? No. Can it get
> a whole new layout? Sure… I want you to be as ambitious as possible… the biggest red flag is the UI
> ability to process what's going on with enough time… totally redesigning the UI so that more of these
> fun elements fit on the screen so you can just visually see how they're impacting one another… we can
> redesign the whole game from start to finish… we can build new assets."

**Mandate: same systems + soul, brand-new layout/look (new assets OK).**

## The non-negotiable design principles (from this run)
1. **One screen per era where you SEE the systems affecting each other** [57:15]. His stated design
   goal — legible interaction at a glance, not merely "no scroll."
2. **Radically less text** — repeated ~6× ([03:43], [09:24], [11:53], [13:06], [13:14]). Even after the
   r6 trim, still "so much text." Teach through **layout, symbols, placement**, not prose. Strip to near-zero.
3. **Color-code resources across all eras** [05:14] — named exemplar **Orb of Creation**: "if everything
   had its own color, color coded, even across the engines, that could be visually recognizable."
4. **Show, don't tell** at emergence [50:10–50:35] — "it's saying it will wake… do we need to say it in
   text? Probably better to show not tell." Wants a **creepier rupture** [64:26] + a UI that **glitches
   and rebuilds itself** [1:04:56–1:05:19], not a text line.
5. **Kill the passive back half** — Deep/Foundation became "just watching bars climb… not really that
   fun" [52:53–54:28], "first time in the game just watching the screen" [54:06]. Keep the active
   click-click Origins energy deeper [1:04:19].

## Landed well (keep in the rebuild)
- **Flows under the action** [02:02]: "I do like flows per second… glad it's back."
- **Clickability depth** [15:15]: "oh, these are shiny buttons. Shiny, shiny buttons."
- **Origins active pacing** [03:51–04:08]: "click, click, click… the speed is not stand-and-watch." Good.

## Per-era notes
- **Origins** — active + good pace, but: discovery tiles still don't say what they GIVE ("I wish it
  said +knowledge" [02:24]); "when I click, marks/sec isn't going up" [04:52] (manual clicks don't show
  in the rate — expectation mismatch); no purchase/owned list ("I don't know what I just bought" [07:42]);
  the r6 debug overlay + a pop-up **overlap in the bottom-left** and hide each other [01:37, 06:00].
- **Symbolic** — still confusing. Automation (what builds rules) is below the theorems / "all the way
  down… so small to read" [10:13]; **still doesn't get where Rules come from** [14:27] ("I know you
  think you address it, but you don't"). Connective line didn't land. Contradictions = "something to
  click that doesn't mean anything to me" [15:32].
- **Deep** — "it wasn't obvious I should be buying that stuff, didn't look viable" [33:15] (stabilizers);
  ternary **drag felt off** ("the circle doesn't know where I need to be, it follows my mouse" [36:02]);
  readouts "meaningless… a lot of clutter" [35:14]; wants **cap timers shown AT the runs** so he can be
  strategic [42:57]; "**jittery**, stuff appearing and disappearing" [43:33] (reflow); **too little to
  buy / no tech-tree variety** — "it's stabilizer, that's all we get" [51:29]; late Deep "pulling teeth."
- **Foundation** — too passive (watching bars). Show-don't-tell the wake; wants creepier glitch rupture +
  a UI-rebuild animation. Aftermath (constrain/interpret/runaway) beats read as OK but mostly watched.

## Decisions made this session (with Cody)
- **Approach:** ground-up rebuild. **Origins slice first** (build the new paradigm on Origins → Cody
  records/reacts → roll across eras 2–5). **Exemplar teardown research first** (Orb of Creation + 3-5
  one-screen incrementals) to ground the paradigm in proven layouts, not my UI instincts.
- Current build **archived** at `archive/emergence-r6-iteration1.html`. Teardown research launched
  (background). Next: new-UI paradigm doc → Origins slice.

## Recording-workflow note
Run JSON reset-wipe (above). Also: overlay vs pop-up overlap bottom-left. Both fixed in the rebuild's
new instrumentation.
