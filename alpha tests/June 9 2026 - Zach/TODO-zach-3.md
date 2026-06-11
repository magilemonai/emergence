# Zach Round 3 — "Becoming a game" (D3-D9, approved June 10)

The throughline: Origins/Symbolic became good via legibility; the back half is legible now too but **toothless** — ignored drift does nothing, aftermath buttons have no stakes. This round adds **consequences**. Sequenced by leverage (Cody approved order + approaches). Keep `node test.js` green; commit per green item; push; screenshot the big mechanics for Cody.

> Note: D4/D6 rebalance locked eras (4 & 5) — approved as *completing* the existing design (steer-against-drift / unexpected-emergence), not changing it. Watch for test-autoplayer coupling (like the Statistical slowdown) and fix robustly. Pause only on a genuinely new design fork.

## D4 — Deep: give the drift teeth + make heat matter (the highest-value item)
- [x] R3.1 **Drift teeth:** a drifting run that you don't steer toward actively **loses** capability (its % drops, visibly), not just slows. Tune so ignoring drift clearly hurts and steering is an *immediate need* (Zach: "I want it to be much easier to lose things if it's drifting"). Update `deepStep` autoplayer to steer in response.
- [ ] R3.2 **Heat as the cost of the fix:** concentrating compute to fight drift builds Heat; high Heat throttles output. Creates the rhythm (concentrate → heat up → ease off → cool). Make the heat gauge/LED legible + meaningful (Zach: "heat is stable, I don't know what it is"). Resolves the dead-heat question.

## D8 — Substrate → end-run scorecard (gives the game a point)
- [ ] R3.3 At the ending, repurpose the Substrate into a **timestamped recap + emergence quality grade**: time-to-emergence, the agent's Alignment/Autonomy/Control, which ending. Something to optimize/replay. (Uses REC timestamps we already log.)

## D5 — Deep: steering upgrades + a lock tool (pairs with D4)
- [ ] R3.4 Connect the build-buttons to the steering: a **stabilizer** upgrade (reduces drift), and a spendable **"lock a run"** tool (freeze a run ~30s so it can't drift). Make Compute Nodes feel like they feed the mechanic (Zach: "the buttons need to affect the main mechanic").

## D6 — Foundation: depth + aftermath stakes (the finale; heaviest, do after Deep)
- [ ] R3.5 **Aftermath stakes:** neglecting Control/Alignment visibly **drags you toward Runaway** under pressure; lapsing a veto window costs something real. The three moves + veto should have teeth (Zach: "time-critical, but nothing bad happened").
- [ ] R3.6 **Pre-emergence depth:** a real turn-to-turn decision — e.g. push fast toward emergence vs build Coherence first, trading ending quality for speed (Zach: "just a bar that fills + buttons").

## D9 — Educational tidbits in the log (cheap, fold in along the way)
- [ ] R3.7 Short "did you know"-style notes in the Goals log explaining the real AI concepts (why 88% / generalization, what breadth/capability mean, what an agent is). Keep them short + earned, not preachy. (Foxfire-adjacent.)

## D3 — Statistical: relabel RUN TRIAL (not three buttons)
- [ ] R3.8 The single RUN TRIAL button names itself after the active focus — "RUN FIT TRIAL" / "RUN GENERALIZE TRIAL" / "RUN EXPLORE TRIAL" — so set-focus-then-run reads as one action. (Keeps the focus dial + auto-running Models; doesn't split the mechanic.)

## D7 — Origins: light sub-age reskin (lowest priority, polish)
- [ ] R3.9 Shift a few accent colors / frame textures when you reach Bronze / Silicon so the sub-age is felt — NOT a full per-sub-age theme, NOT a cut. (The objective line already frames them as goals.)
