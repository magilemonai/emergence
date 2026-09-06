---
name: process-capture
description: Process the newest KittyCapture recording of EMERGENCE into an iterative dev loop. Use when Cody says he "just recorded", "did another recording", "process the capture/recording", or asks to review a KittyCapture session and act on it. Runs the full pipeline — review the capture, parse feedback into the alpha-tests folder, build a to-do list, and start completing it.
---

# Process a KittyCapture recording → iterate

The recurring loop for EMERGENCE playtests. Cody records himself playing (screen + spoken
commentary) with KittyCapture, then hands it off. Run these four steps in order.

**The durable spine is `TODO-v3-unified.md` — the single MASTER / OVERALL todo list.** Every capture
gets *synthesized into* it (step 3). The in-session TaskCreate list is only an ephemeral working view
and must never be the sole record, so nothing is lost between sessions.

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

## 3) Synthesize the to-do list into the MASTER TODO (durable — never only ephemeral)
`TODO-v3-unified.md` is the single durable source of truth for open work. **Merge every capture's
feedback INTO it** — do not just create ephemeral tasks:
- **Add** new items; **mark finished ones `[x]`** with the date; **DEDUP** against what's already there
  (don't re-add solved/duplicate items; when a *deferred* item resurfaces, link it to its origin).
- Add a dated **`## Playtest #N (<date> · <capture-id>)`** block at the top summarizing the **wins he
  called out** + the **new items**, so the history is legible.
- Keep it grouped + honest about scope: **bugs** (most-critical first) · **one-screen** · **text /
  legibility** · **back-half agency** · **delight / story** · **deferred** (verify relevance) ·
  **assets-needed** (→ `ART-PROMPTS.md`) · **needs-Cody** (design calls + playtests).
- THEN mirror just the **active sprint** into TaskCreate as a working view. The MD is the source of
  truth; update it as you finish items.
(Old round-specific `TODO-*.md` + `CLAUDE.md` OPEN sections are legacy — fold their still-live items in.)

## 4) Begin the iterative loop
Work the master TODO top-down (bugs before polish). For each change:
- Edit the relevant file. **Since 2026-09-06 the dev build is v4: `emergence-v4.html`**, which loads
  `v4-kit/kit.{js,css}` + `v4-kit/era-{origins,symbolic,statistical,deep,foundation,agent}.js` (per-era
  modules; CFG lives in the shell). The live `emergence.html` is still the v3 artifact until Cody ships v4;
  v3's source (`emergence-v3-unified.html` + `v3-kit/`) is frozen and archived at `archive/v3/`. The master
  list for v4 captures is **`TODO-v4.md`** (synthesize there, not into the v3 TODO).
- Keep tests green: **`node test.js`** (runs the v3 suite, the v4 suite, and the live-artifact freshness
  check) AND **`node tools/v4-smoke.js`** (headless DOM run through the whole v4 arc; fails on any console
  error). Syntax-check edited modules with `node -c v4-kit/<file>.js`.
- **Verify visually** with headless Chrome at a REAL viewport (his feedback is almost always visual,
  and he cares about **one-screen**): `SHOOT_FILE=emergence-v4.html node tools/shoot-unified.js <seedhash> out.png`
  — it uses 1280×800 and reports `overflowPx` — then Read the PNG. Seeds: `seed` (Origins), `seedsym`/`seedsymc`,
  `seedstat`, `seeddeep`, `seedfound` / `seedpost` / `seedend`, `seedagent` (the sixth tab), `seedoperated1..4`.
- **Mark items `[x]` in `TODO-v3-unified.md` as you finish** (+ the TaskCreate mirror); report progress.
  Don't push to live until Cody says (push auto-deploys the GitHub Pages site).

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
