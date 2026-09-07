# WO-13 · QA tooling: smoke, playtest driver, overflow ledger, bot

## Goal
Port `tools/v4-smoke.js` and `tools/v4-playtest.js` to v5 (real pointer events on the real UI, scene-driven), an
overflow ledger across every scene (pageScroll must be 0), and the progression bot inside `v5/test/bot.test.js`
that plays the arc through `sim.available()` and reports era timings + starvation + the feedback record.

## Files you own
`v5/tools/smoke.js`, `v5/tools/playtest.js`, `v5/tools/overflow.js`, `v5/test/bot.test.js`, `v5/STATUS.md` (create:
the ledger of merged orders + open items; the orchestrator maintains it after).

## Acceptance
`node v5/test.js` green with the bot completing the arc; `node v5/tools/smoke.js` 0 failures, 0 console errors;
`node v5/tools/overflow.js` all scenes 0; `node v5/tools/playtest.js --speed 3` completes with a run.json.
