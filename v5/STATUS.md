# v5 STATUS — the orchestration ledger (Fable maintains; updated every session)

| Order | Phase | State | Branch / merge | Notes |
|---|---|---|---|---|
| WO-00 engine core | A | **MERGED** 2026-09-06 | worktree-agent-ac54ca55335c8ef87 → main | 82 own tests; caught a bad assertion in the orchestrator's test (fixed) + a contract gap (`addResource`, now in CONTRACT). 0.006ms/tick. |
| WO-01 renderer core | A | **MERGED** 2026-09-06 | worktree-agent-ac94fe3aa133e5bca → main | 67 own tests; 5 bench scenes re-shot + read by Fable (accepted); 1.49ms tick+frame at 2549 particles. Two contract questions → pinned in CONTRACT (pos is stratum-local; Edge.starved from the graph pass). Design note: the overview column is a tall spire (~260px wide at fit) — frame it deliberately in WO-08. |
| WO-02 Origins | B | **MERGED** 2026-09-06 | worktree-agent-adfdd407741fe33b8 → main | ACCEPTED by Fable's eye: nothing pre-laid, the hand is a pipe, upkeep visible, numbers-first plates, commission beside the goal. 67 own tests. Integration pass after: buyN(node), locked nodes hidden by the renderer, hud.goalExtra/goalAside, overview fit for short columns (forced silhouette), cfg/voice/scenes split per era, app.js discovers eras by convention. Open: MAX bulk mode (WO-11), title cards (WO-11). |
| WO-03 Symbolic · WO-04 Statistical · WO-05 Deep · WO-09 audio | C | LAUNCHING (4 Opus worktrees) | — | tests written; orders pinned to per-era files. WO-11 shell waits (owns app.js) |
| WO-06 Foundation+turn → WO-07 mirror → WO-08 reveal+film | D | spec'd | — | serial |
| WO-10 legacy · WO-12 receipt · WO-13 QA | E | spec'd | — | parallel |
| Fable's pass + `?v=5` (Cody's call) | F | — | — | |

## Running right now (launched 2026-09-06, session 2)
WO-03 Symbolic · WO-04 Statistical · WO-05 Deep · WO-09 audio — four Opus worktrees. When they return: acceptance per
ORCHESTRATION (scope diff, merge, `node v5/test.js`, shoot + READ scenes), then launch WO-06 (needs 03/04/05 merged) and
WO-11 (needs the views). Tests for 06/07/08/10/12 already exist under v5/test/.

## How to resume (any session)
1. `git status`, `git worktree list`, `git branch -a | grep -i wo` — find returned branches.
2. For each returned order: `git diff --stat main..<branch>` (owned files only) → checkout the worktree, run
   `node v5/test.js`, shoot its scenes, READ the PNGs, judge the checklist → merge `--no-ff` to main or re-run with notes.
3. Launch the next phase per `v5/ORCHESTRATION.md` with the prompt template (model opus, worktree isolation).
4. Update this file.
