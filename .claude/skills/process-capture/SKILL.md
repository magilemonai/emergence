---
name: process-capture
description: Process the newest KittyCapture recording of EMERGENCE into an iterative dev loop. Use when Cody says he "just recorded", "did another recording", "process the capture/recording", or asks to review a KittyCapture session and act on it. Runs the full pipeline — review the capture, parse feedback into the alpha-tests folder, build a to-do list, and start completing it.
---

# Process a KittyCapture recording → iterate

The recurring loop for EMERGENCE playtests. Cody records himself playing (screen + spoken
commentary) with KittyCapture, then hands it off. Run these four steps in order.

## 1) Review the capture
- Newest capture: `ls -dt KittyCapture/captures/*/ | head -1`. Read `transcript.txt` FIRST — his
  spoken commentary is the signal (tone doesn't transcribe, so **repetition = emphasis**).
- Read `manifest.json` for `duration_s`, `t0_epoch`, and the video `offset_s`.
- Sample `video.mp4` frames only where the transcript is ambiguous or you need to see the UI:
  `ffmpeg -ss <sec> -i video.mp4 -frames:v 1 out.png` (shared clock; a `[mm:ss]` line ≈ that second
  of video, minus the ~1.7s video `offset_s` for frame-accuracy). Read the PNG.
- If a run JSON was dropped (`emergence-run.json` / `emergence-v3-run.json` in `KittyCapture/` or the
  capture folder), parse it: dead-click count/positions, `@scroll`/`@view` timeline, buys, ending.
  Align to the video with `transcript_time = wt/1000 − manifest.t0_epoch`. Confirm which build he
  played (frame shows the Chrome URL bar; run JSON `v` field ≈ REC version).

## 2) Parse feedback into the alpha-tests folder
Write `alpha tests/<Month DD YYYY> - <person>/<short-slug>.md` (mirror the existing parses). Include:
the **headline verdict** (his words), **what landed / keep**, **bugs & aversive interactions** (with
`[mm:ss]` timestamps), **per-era/per-area notes**, and any **decisions made** with him. Quote him
directly for the load-bearing points. If it's a strategic pivot, also update `CLAUDE.md` and the
memory files (`emergence-ui-intuitiveness`, `emergence-playtest-loop`).

## 3) Build the to-do list
Create tasks (TaskCreate) from the feedback, **most-critical first** — core-loop bugs before polish.
Separate must-fix bugs from delight/feature asks from deferred items. Keep it honest about scope.

## 4) Begin the iterative loop
Work the list top-down. For each change:
- Edit the relevant file (the shipped game is `emergence.html`; the v3 rebuild is `emergence-v3.html`).
- Keep tests green: `node test.js` must stay green for `emergence.html`. For `emergence-v3.html`,
  syntax-check the script (`node --check` on the extracted `<script>`) since it's outside the suite.
- **Verify visually** with headless Chrome, because Cody's feedback is almost always visual:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu
  --window-size=1280,1000 --screenshot=out.png "file://<abs-path>#seed"` then Read the PNG.
  (`emergence-v3.html#seed` seeds a mid-game state for a populated screenshot.)
- Mark tasks done as you finish; report progress. Don't push to live until Cody says (push
  auto-deploys the GitHub Pages site).

## Standing context (don't relearn each time)
- Cody's feedback is dominated by **UI intuitiveness / information architecture**, not pacing. He
  distrusts my raw GUI instincts — ground design in research/proven patterns. See the memory files.
- The design bar: **lead with the number**, **one screen where systems visibly affect each other**,
  **radically less text** (teach via layout/icons, prose → tooltips), **color-code resources**,
  **obvious clickability**, **show-don't-tell**, **no passive bar-watching back half**.
- The **build-once / update-in-place** rule is load-bearing: `refresh()` must NOT rewrite button
  innerHTML every tick (it replaces child nodes mid-click and eats clicks — the "dead click" bug).
  Guard every per-tick DOM write with change-detection.
- Fix the telemetry so **New Game+/reset snapshots the run before wiping** it.
