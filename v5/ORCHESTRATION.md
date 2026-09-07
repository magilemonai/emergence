# ORCHESTRATION — how Fable runs the Opus 5 work orders

> The orchestrator (Fable 5.1) owns taste and judgment; workers (Opus 5, `general-purpose` agents with
> `model: "opus"`, `isolation: "worktree"`) own execution inside one work order each. Cody owns every ship.

## Principles (Fable orchestrating Opus)
1. **Contracts and tests before agents.** Interfaces (`engine/CONTRACT.md`, `types.js`) and acceptance tests
   (`test/woNN-*.test.js`, scene checklists) are written by the orchestrator FIRST. An agent's task is "make these
   pass and match this checklist", never "build the vision".
2. **One order = one agent = one worktree = one branch.** Files are owned; two agents never own the same file.
   Parallel orders touch disjoint files; serial orders wait for an accepted merge.
3. **Self-contained prompts.** A fresh agent has no context. The prompt names the four docs to read, the order
   file, the exact commands to verify, the report format, and the stop conditions. No prompt relies on chat history.
4. **Small units, hard acceptance.** ~1 day of human work per order. If a returned order fails acceptance twice,
   the orchestrator fixes it directly instead of a third retry.
5. **Verify everything returned.** The orchestrator re-runs the gate, re-shoots the scenes, reads the PNGs, diffs the
   branch against the ownership list, greps for banned constructions, then accepts (merge) or rejects (notes appended
   to the order, re-run). Reports are inputs, never proof.
6. **Never ship.** Merges land on the `v5` branch (then main); `?v=5` routing is only enabled by Cody's call.

## The prompt template (fill the <>; keep the shape)
```
You are executing work order <WO-NN> for EMERGENCE v5 in this repository (an isolated worktree on your own branch).
Read, in order: v5/SPEC.md, v5/ARCHITECTURE.md, v5/GUARDRAILS.md, v5/engine/CONTRACT.md, then your order:
v5/workorders/<WO-NN-name>.md. Then read the files the order lists under "Read first".
Build exactly what the order specifies. Own only the files listed under "Files you own".
Acceptance = the commands under "Acceptance" are green AND every checklist item passes on the screenshots you take
and READ. Do not weaken tests. Do not touch anything outside your files. Do not push or merge.
When done (or blocked), end with the REPORT block from GUARDRAILS §5, verbatim shape.
Budget: stop and report at <N> tool calls even if incomplete; say what remains.
```

## Order of execution
| Phase | Orders | Parallel? | Gate to next phase |
|---|---|---|---|
| A | WO-00 engine core · WO-01 renderer core | yes (disjoint files; renderer builds against the contract with a synthetic graph) | both accepted; `node v5/test.js` green; `dev.html` scenes match |
| B | WO-02 Origins stratum | no (the paradigm proof; Cody's Origins-slice-first rule) | Fable plays it; screenshots vs SPEC; Cody may look |
| C | WO-03 Symbolic · WO-04 Statistical · WO-05 Deep · WO-09 audio · WO-11 shell | yes (disjoint era files) | each accepted; the arc runs 1→4 in the bot |
| D | WO-06 Foundation + emergence → WO-07 mirror → WO-08 reveal + film | serial (shared finale) | the arc completes in the bot + smoke |
| E | WO-10 legacy/run 2 · WO-12 receipt · WO-13 QA tools | yes | playtest driver completes 1× in 34–44 min |
| F | Fable's own pass: feel, pacing, text lint sweep, overflow ledger, package, `?v=5` (Cody's call) | — | Cody plays |

## Acceptance checklist (orchestrator, per returned order)
1. `git diff --stat main..<branch>` — only owned files. 2. `node v5/test.js` green (run it yourself).
3. Every scene in the order shot and read; checklist judged by eye against SPEC. 4. `node v5/test.js lint` clean.
5. Perf test within budget. 6. Report present, honest (spot-check one "PASS" claim). 7. Merge with `--no-ff` to `v5`.

## Budgets
Per order: ≤ 120 tool calls, ≤ 1 retry before the orchestrator intervenes. Phase A+B in one session if possible; the
rest across sessions. Every session ends with the `v5/STATUS.md` ledger updated (what's merged, what's open).
