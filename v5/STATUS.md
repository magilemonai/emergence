# v5 STATUS — the orchestration ledger (Fable maintains; updated every session)

| Order | Phase | State | Branch / merge | Notes |
|---|---|---|---|---|
| WO-00 engine core | A | **MERGED** 2026-09-06 | worktree-agent-ac54ca55335c8ef87 → main | 82 own tests; caught a bad assertion in the orchestrator's test (fixed) + a contract gap (`addResource`, now in CONTRACT). 0.006ms/tick. |
| WO-01 renderer core | A | **MERGED** 2026-09-06 | worktree-agent-ac94fe3aa133e5bca → main | 67 own tests; 5 bench scenes re-shot + read by Fable (accepted); 1.49ms tick+frame at 2549 particles. Two contract questions → pinned in CONTRACT (pos is stratum-local; Edge.starved from the graph pass). Design note: the overview column is a tall spire (~260px wide at fit) — frame it deliberately in WO-08. |
| WO-02 Origins | B | **MERGED** 2026-09-06 | worktree-agent-adfdd407741fe33b8 → main | ACCEPTED by Fable's eye: nothing pre-laid, the hand is a pipe, upkeep visible, numbers-first plates, commission beside the goal. 67 own tests. Integration pass after: buyN(node), locked nodes hidden by the renderer, hud.goalExtra/goalAside, overview fit for short columns (forced silhouette), cfg/voice/scenes split per era, app.js discovers eras by convention. Open: MAX bulk mode (WO-11), title cards (WO-11). |
| WO-09 audio | C | **MERGED** 2026-09-06 | worktree-agent-a29578d155d9effc5 → main | 140 tests; probe re-run by Fable: ctx running, crossfade envelope, rupture glide, surface reversed. Nobody has LISTENED yet (Cody's ears; the rail button + Esc knobs wire in WO-11). Audio tunables live in synth.js AUDIO block (not cfg): accepted. |
| WO-05 Deep | C | **MERGED** 2026-09-06 | worktree-agent-a430a67280a0c263c → main | 42 solo tests; 6 scenes re-shot by Fable (0 errors, 0 scroll). Pacing flag CLOSED by Fable: under the v4 test-bot's steering policy, v5 Deep tracks v4 Deep to the decimal (78.3% breadth at minute 4, 87.1% at 9) — the agent's steerers were weaker; no port drift. Proposals: drop the scene-name digit heuristic (app/shoot), a generic view.openDrawer(name) seam, a per-era restate seam. |
| WO-04 Statistical | C | **MERGED** 2026-09-06 | worktree-agent-a9162acc8ee1bbbc1 → main | 61 tests; 5 scenes re-shot + read by Fable: instrument on the world canvas, riser into Datasets, ghost tag on the border, METHOD badge. Proposals → integration pass 2 (scene digit heuristic dropped, onDraw hook, per-era css, reduced in opts, available() menu, trials palette). |
| WO-03 Symbolic | C | **MERGED** 2026-09-06 (+ layout pass) | worktree-agent-a5089aa2eb4f5c53e → main | 54+ tests. First shots: plates butted edge to edge (the order's anchors, Fable's fault) so no pipe showed; Fable ruled a four-row board (rules→ruleset on an empty top row so the Knowledge riser leg is visible; daemon/inference/proof; axioms + wide terminal; theorem row) — re-shot + READ: all five pipes carry particles, stratum full. Rulings pinned: rail rates are NET; replay = seed + logged actions (agent caught the orchestrator's contradictory assertion; fixed, no @era log). knowledgePerRuleset 0.05 stands until pipes get a length-aware particle floor. |
| WO-12 receipt | E | **MERGED** 2026-09-06 | worktree-agent-a1f4735de0b44933a → main | pure `receipt(state)` + page + scene + 13 tests; shot READ by Fable: five rows, numbers first, ≤60 words each. Fable: plurals ('1 proof'). Lint exempts engine/receipt.js (the one page allowed to explain). Needs WO-11/08: mount after the film. Flag: v5/index.html viewport is width=1280 (desktop-first ruling; state it to Cody). |
| WO-11 shell | C | **MERGED** 2026-09-07 | worktree-agent-abc447d02432118ff → main | 61 tests + `v5/tools/probe-shell.js` (32 checks, modular AND packaged artifact). Fable READ the settings + title-card shots: accepted. fx.js merged by concatenation (legacy + title-card sections). Fable fixed the blind legacy hooks (API takes State; installLegacyFx wired; ending detector also watches eras[7].ending). Packager: `EMG_V5=1 node tools/build-single.js emergence-v5-single.html` (gitignored). `?v=5` routes only when V5_ENABLED = true in index.html (OFF). |
| WO-10 legacy | E | **MERGED** 2026-09-06 | worktree-agent-a09c42b7013bb4506 → main | 25 tests; boot-run2 READ by Fable: dark surface above the Foundation slot, faint `?`, key cap lit, run 1 untouched. RUN3.md written (3 open decisions for Cody). Its onDraw collision flag was real → world.onDraw now stacks hooks per era and returns an unsubscribe. Proposals 1–4 (app.js boot hook, run-2 era cards, signed commission, legacyRules) → integration ledger. |
| WO-06 Foundation + the turn | D | **MERGED** 2026-09-07 (+ view pass + addendum MERGED) | worktree-agent-a050ca8fbc9f53eaf → main | 67+ tests; six scenes READ by Fable. Surface + operated strata ACCEPTED. Rulings sent back: the feedback window moves into the world (the stratum was two plates and a riser), the recursion field grows with Scale/Anomaly, no "NO BUTTON", operated goal/drawer buttons, the rupture belongs to the shell (Fable wired app.js: 5→6 starts fx.rupture, `__V5.rupture(holdMs)`), one `?` key, surface board waits for the layer. emergeScale 900 (v4 1550; converter earns every point) → pacing via WO-13's bot. |
| WO-13 QA | E | RUNNING (Opus worktree) | — | smoke, playtest, overflow, bot (through emergence + 60s; era 7 read defensively) |
| WO-07 mirror · WO-08 reveal/film | D | RUNNING (2 Opus worktrees) | — | seams first: `world.setSource` (draw a shadow/frame State), cfg/e7 + voice/e7 for the film, goal-kind plates never drawn |
| Fable's pass + `?v=5` (Cody's call) | F | — | — | |

## Fable's integration ledger (do in the final pass unless noted)
- Deep: Capability output now carries the compute-node milestone tier (v4 parity; the only pacing gap found). DONE.
- Engine: `sim.setCadence` + `state.cadence` (operated strata); renderer: `world.operated`, `OPERATED_HUE`; `fmtRate` snaps |x|<0.005 to 0. DONE.
- Plates wrap a second input onto its own line (never truncate a number). DONE.
- Pipes: density is per length above 500 units (risers scale by len/300, cap grows); re-shot Symbolic/Origins/Statistical: risers read as columns. knowledgePerRuleset stays 0.05 (0.02 would still read thin). DONE.
- Receipt mounts after the film (WO-08/11 seam); WO-12's scene mount is a stand-in.
- Run-2 alterations (WO-10 proposals, exact): (1) app.js boot: read localStorage[LEGACY_KEY] in try/catch → createSim({legacy}) AND applyToFresh(sim.state, legacy) before first render; after world.setHud(hud) call installLegacyFx({world, sim, doc}) and its sync() on era change; at the ending write fromRun(sim.state, sim.state.legacy). (2) Title cards: when flags.run2 the subtitle reads from legacy (v4: name + ' remembers', 'run N'); words in engine/voice. (3) DONE: Origins commission signed '· NAME' on run 2 (engine + view, test wo10-run2). (4) DONE: cfg.e2.legacyRules = 40 rules in the bank when Symbolic opens on run 2. Wire `fx.operated`/`world.operated` + body class into the shell's era switch after WO-11.
- Mobile: v5/index.html viewport width=1280 = desktop-first (standing ruling); tell Cody, do not skip silently.

## Running right now (2026-09-07)
WO-07 mirror · WO-08 reveal/film · WO-13 QA — three Opus worktrees. Then Fable's pass (dead-click counter, run-2 title cards, MAX label, full-arc play, package).

Fable's pass so far: plate BUILD label keeps its count under a multiplier (glyph) DONE; dead-click counter → `flags.dead` (pinned as UI telemetry) DONE; run-2 title-card subtitle from voice/legacy.js DONE; installLegacyFx synced on era change DONE. Left: full-arc play on the real UI (after WO-13), package, mobile statement.

## (earlier) Running (launched 2026-09-06, session 2)
WO-03 Symbolic · WO-04 Statistical · WO-05 Deep · WO-09 audio — four Opus worktrees. When they return: acceptance per
ORCHESTRATION (scope diff, merge, `node v5/test.js`, shoot + READ scenes), then launch WO-06 (needs 03/04/05 merged) and
WO-11 (needs the views). Tests for 06/07/08/10/12 already exist under v5/test/.

## How to resume (any session)
1. `git status`, `git worktree list`, `git branch -a | grep -i wo` — find returned branches.
2. For each returned order: `git diff --stat main..<branch>` (owned files only) → checkout the worktree, run
   `node v5/test.js`, shoot its scenes, READ the PNGs, judge the checklist → merge `--no-ff` to main or re-run with notes.
3. Launch the next phase per `v5/ORCHESTRATION.md` with the prompt template (model opus, worktree isolation).
4. Update this file.
