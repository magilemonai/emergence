# LOOPS

<!-- recursive self-improvement loops — scouted by magi lemon command, 2026-07-02 -->

- Capture→steering loop: /process-capture already parses KittyCapture runs into TODO-v3-unified.md; extend step 3 to also regenerate NEXT.md from the TODO's top open items. first step: add that rewrite to .claude/skills/process-capture/SKILL.md
- Autoplayer pacing baseline: test-v3.js's era.acts bot already reports per-era times + starvation %; snapshot them to pacing-baseline.json and fail on drift so every CFG tune self-checks. first step: dump the bot's timings to JSON in test-v3.js
- Overflow ledger: tools/shoot-unified.js reports overflowPx per seed, but the +515/+289 numbers are hand-copied into TODO/NEXT. Sweep all 7 seeds to overflow.json and assert no growth. first step: tools/overflow-sweep.js wrapping shoot-unified
- Telemetry→guard tests: REC run JSONs (dead-clicks, scroll timeline) ride along with captures; parse each into metrics and mint a smoke test per fix, like tools/deep-lever-smoke.js. first step: tools/parse-run.js reading emergence-v3-run.json
