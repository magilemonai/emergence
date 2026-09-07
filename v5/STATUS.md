# v5 STATUS — the orchestration ledger (Fable maintains; updated every session)

| Order | Phase | State | Branch / merge | Notes |
|---|---|---|---|---|
| WO-00 engine core | A | **MERGED** 2026-09-06 | worktree-agent-ac54ca55335c8ef87 → main | 82 own tests; caught a bad assertion in the orchestrator's test (fixed) + a contract gap (`addResource`, now in CONTRACT). 0.006ms/tick. |
| WO-01 renderer core | A | RUNNING (Opus, worktree) | — | acceptance: test/wo01-renderer + 5 bench scenes |
| WO-02 Origins | B | ready (test written) | — | launches after A merges |
| WO-03 Symbolic · WO-04 Statistical · WO-05 Deep · WO-09 audio · WO-11 shell | C | spec'd | — | parallel after B accepted |
| WO-06 Foundation+turn → WO-07 mirror → WO-08 reveal+film | D | spec'd | — | serial |
| WO-10 legacy · WO-12 receipt · WO-13 QA | E | spec'd | — | parallel |
| Fable's pass + `?v=5` (Cody's call) | F | — | — | |

## How to resume (any session)
1. `git status`, `git worktree list`, `git branch -a | grep -i wo` — find returned branches.
2. For each returned order: `git diff --stat main..<branch>` (owned files only) → checkout the worktree, run
   `node v5/test.js`, shoot its scenes, READ the PNGs, judge the checklist → merge `--no-ff` to main or re-run with notes.
3. Launch the next phase per `v5/ORCHESTRATION.md` with the prompt template (model opus, worktree isolation).
4. Update this file.
