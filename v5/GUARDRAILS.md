# GUARDRAILS — rules for every executing agent (Opus 5 work orders)

You are implementing ONE work order from `v5/workorders/`. You are a builder with taste, working inside a fixed
design. The design decisions are already made (`SPEC.md`, `ARCHITECTURE.md`, `engine/CONTRACT.md`); your job is to
realize them exactly and report honestly. When these rules and your instinct disagree, the rules win.

## 1. Scope
- Create or edit ONLY the files your work order lists under **Files you own**. Any other change = the order is
  rejected. If you need something outside your files, write it under "contract proposals" in your report and stop
  at the boundary (stub it, mark it `// WO-NN: needs <thing>`).
- Never touch `v3-kit/`, `v4-kit/`, `archive/`, `emergence*.html`, `index.html` at the repo root, `assets/`.
- Never delete, skip, weaken, or `.skip` a test. Tests you were given are acceptance criteria; make them pass.

## 2. Contract first
- `engine/CONTRACT.md` and `engine/types.js` are frozen. Implement them exactly; consume nothing beyond them.
- Every tunable number lives in `engine/cfg.js` under your era's block. No magic numbers inside era modules.
- The engine is pure: no DOM, no `Date`, no `Math.random`, no timers in `v5/engine/**` (a test greps for it).

## 3. The design laws (each screen, every time)
- **One object**: the world is a single canvas; strata are stacked bands; pipes carry particles; no tabs.
- **Numbers first**: every plate/button/label starts with the mechanical value (`+2.1 Marks · Inscribe`).
- **Text budget**: no explainer prose anywhere. The machine's lines live in `engine/voice.js` only. A lint fails
  any string literal of 12+ words outside `voice.js` that is not a `flavor`/`mech` tooltip field. No em-dashes
  (`—`) in any string; no "not X, but Y" / "not X, it's Y" constructions.
- **Color, not text**: state changes are hue/glow/motion first; a word only if the color cannot carry it.
- **One screen**: while locked to a stratum, the page never scrolls (`document.documentElement.scrollHeight ===
  innerHeight` at 1280×800); the world pans instead. Every DOM plate/verb/goal of the locked stratum is inside
  the viewport.
- **Nothing reflows under the player**: dynamic elements fade in place; reserve space; a card appearing never
  moves a button the player may be about to press.
- **Signifiers**: interactive = raised plate + hover; decorative = flat. Never hover-to-discover.
- **BUILD-ONCE / update-in-place** for all DOM: create once, update via change-detected setters, never rewrite a
  live button's innerHTML on a frame (it swallows the click).
- **Reduced motion**: every animation has a `prefers-reduced-motion` fallback.

## 4. Verification is the deliverable
- `node v5/test.js` must be green before you report. Add unit tests for what you built (in `v5/test/woNN-*.test.js`).
- Visual work: run `node v5/tools/shoot.js <scene>` for each scene your order names and READ the PNGs (use the Read
  tool on the file). Check the checklist in your order against what you see, not against what you intended.
- Never claim something works that you did not run. If a check could not be run, say so under "unverified".

## 5. Report format (paste at the end of your final message; the orchestrator parses this)
```
WO-NN REPORT
built: <3–8 bullets, what exists now>
tests: <command> → <N passed, M failed>; new tests: <files>
screens: <scene → path → one line of what it shows>
checklist: <each item from the order: PASS / FAIL / N/A + one line>
unverified: <anything you could not check>
not done: <anything in the order you did not do, and why>
contract proposals: <needed changes to frozen files, with the reason> (or "none")
files touched: <list>
```

## 6. Stop conditions (stop and report; do not improvise around them)
- A given test cannot pass without changing a frozen file.
- Your order is ambiguous in a way that changes the build materially (pick the reading that best serves the SPEC
  thesis, state it, and continue ONLY if the choice is reversible; otherwise stop).
- You need a new dependency, a framework, a build step, WebGL, or a new bitmap asset. The answer is no; stop.
- The perf budget (6ms tick+frame at 2000 particles) cannot be met with the approach in your order.

## 7. Working style
- Read the four docs before writing code. Then read the existing `v5/` files you depend on. Then the v4 module for
  the same era (`v4-kit/era-*.js`) to port the RULES (not the DOM): v4's economy math, thresholds and text are the
  source of truth for behavior unless your order says otherwise.
- Small commits on your branch with the WO number in the message. Do not push. Do not merge.
- Keep functions short, names literal, and comments about WHY. No dead code, no TODO without a WO reference.
