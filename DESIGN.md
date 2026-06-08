# EMERGENCE — Redesign: The Living Supply Chain

> Proposal for review (2026-06-08). Reshapes pacing + adds cross-era dependency so the
> whole game is one connected economy instead of a relay of closed boxes.
> Nothing here is built yet. Approve / edit, then I implement era by era.

## Why (the problems this fixes)

From playtest telemetry + Cody's read:
1. **Eras are closed boxes.** Each hands off and dies. Origins' Ore/Silicon and Symbolic's Rules hoard into the millions, useless. Nothing reaches back.
2. **No agency.** Era 3 generalized in ~60s with *zero decisions* — "just watching it happen." Even Eras 1-2 resolve in bursts (bank Inference, dump it, everything pops).
3. **No stated objective.** "I have no idea what I did or what the goal was."
4. **Pacing too fast / wrong shape.** Want **7-9 min per era** and a **logarithmic curve** — a flurry of small actions early, fewer/bigger decisions late.

The single change that addresses all four: **later eras require new infrastructure from earlier eras.** That revives old eras, creates the cross-era flurry, and gives every late era a concrete objective chain.

## Core feel principle (the test every change must pass)

**At every moment there is a short-term goal that feels achievable with small fiddling.** You should never be staring at a bar filling with nothing to do, and never be facing a wall that's minutes away with no nearer win. There's always a cheap next nudge — a buy, a proof, a focus tweak — that visibly moves a near target. Resource balancing should feel *compelling and interesting* (live tradeoffs), not solved or idle.

This is the bar for adding complexity: **add freely to any era, as long as it deepens the moment-to-moment tradeoff and preserves the always-a-near-win feel.** Depth that creates dead stretches (the Era-2 axiom grind, the Era-3 watch) fails the test.

## Scope right now: Eras 1-3

Focus is **Eras 1, 2, and 3** — make those three genuinely compelling (depth + the cross-era links among them). **Eras 4-5 are deferred** (kept on the scaffold). The Silicon/Data backbone is designed with 4-5 in mind, but the reach-back we build now lives *inside 1-3*: Era 3 reaching back to Origins (Silicon) and Symbolic (Rules) is the full proof of the pattern.

## The spine: one supply chain

Two backbone resources thread the whole game:
- **Silicon** = the hardware substrate (Origins → storage in Statistical → chips in Deep).
- **Data** = the fuel (Statistical → training in Deep → Foundation).

```
ERA 1 Origins      Marks→Knowledge,  Ore→Metal  ──►  SILICON (Foundry) ──┐
                                                          │              │
ERA 2 Symbolic     Rules→Inference→Theorems ──► RULES, AXIOMS            │
                                          │               │              │
ERA 3 Statistical  Datasets→DATA, Models→experiments→INSIGHT, Accuracy   │
                   needs: Silicon (storage) + Rules (labels) ◄───────────┤
                                          │               │              │
ERA 4 Deep         COMPUTE → training → CAPABILITY                       │
                   needs: Silicon (chips) ◄──────────────────────────────┘
                          + Data (training) + Insight
                                          │
ERA 5 Foundation   everything converges → SCALE → emergence
                   needs: Compute + Data + Knowledge + Rules + recursive feedback
```

**The key cascade (Cody's "does scaling need Origins?" — yes):** to scale Deep's **Compute** you need **Silicon** → that means reopening Origins' **Foundry** → which needs **Metal + Knowledge** → which needs **Smelters/Scriptoriums → Ore/Marks → Miners/Scribes**. Scaling the newest era cascades demand all the way back to the first. Origins comes alive again as a real factory, not a museum.

## How the dependency works mechanically

Two levers, used deliberately:
- **Reach-back build cost** (primary): an advanced building's *purchase* is paid partly in an earlier resource. e.g. each **Compute Node costs Silicon** (rising). To afford the next tier you go expand Origins' silicon output. This sends you back to *build infrastructure*, not to grind clicks.
- **Throughput upkeep** (selective, for marquee tension): a building *consumes* an earlier resource per second to run. e.g. **Compute draws Silicon/sec** (power/replacement). Keeps the old era's production *flowing*, not just stockpiled. Use sparingly so it reads as tension, not punishment ("additions contain subtractions").

**Anti-tedium rule:** reaching back must always be *"build more automation"* (buy 40 more Miners), never *"hand-click Ore 500 times."* By the time an era reaches back, the earlier era's manual verbs are long automated; you scale buildings with resources you already have. The flurry is navigation + investment decisions, not repetition.

## Every era gets: one OBJECTIVE + one DECISION

| Era | Objective (shown at top) | The live decision (agency) |
|----|--------------------------|----------------------------|
| 1 Origins | Fabricate the Logic Machine | Balance the two tracks (Knowledge vs Materials) + which discoveries |
| 2 Symbolic | Prove the Expert System | Which theorem to aim Inference at; when to Compile |
| 3 Statistical | Generalize — 85% effective accuracy | **Training focus: Fit / Generalize / Explore** (steer bias↔variance) |
| 4 Deep | Train a frontier model (Capability gate) | **Allocate Compute across parallel training runs** |
| 5 Foundation | Reach emergence | **Which capabilities to grow; aim recursive self-improvement** |

The **objective line** is a persistent banner per era ("▸ Generalize: 62% / 85%") so you always know the goal and your progress. This alone kills "I don't know what I'm doing."

## Pacing: 7-9 min/era, logarithmic

- **Shape:** each era opens with a *flurry* — many cheap, fast, sub-second actions (clicks, cheap buys, quick unlocks), then tapers to fewer, larger, gated pushes (the cross-era reach-backs are the big late beats).
- **Four-beat target per era** (scaled from Origins' 30/60/120/300): roughly **0:45 / 2:15 / 4:30 / 7-9 min**.
- **How we get length honestly:** not by inflating one number, but because the late beats *require reaching back* (detour to scale Silicon), which adds real, engaged time. Cross-era cost > bigger exponent.
- Retune all eras to this after the dependency is in; the pacing autoplayer gets a per-era report so we read beats off every balance change.

## Era 3 rework (the proof of concept — build first)

1. **Objective banner:** "Generalize: reach 85% effective accuracy" with live progress.
2. **Training Focus** — the core decision, a 3-way you set and change over time:
   - **Fit** — accuracy ↑ fast, overfit gap ↑ fast.
   - **Generalize** — actively *reduces* the gap, accuracy ↑ slow.
   - **Explore** — method-discovery odds ↑, accuracy flat.
   You now *steer* the bias-variance trade instead of watching it. (Regularization-the-method makes Generalize stronger; it's no longer a passive auto-cure.)
3. **Reach-back:** scaling **Datasets consumes Silicon** (storage) and benefits from **Rules** (labels) — so you return to Origins/Symbolic to grow Data.
4. **Slow it** to ~7-9 min: lower accuracy gain per experiment, the threshold becomes a climb you manage with Focus, and Data is gated by Silicon so it can't trivially explode.
5. **Signature visual:** the teal scatter-plot core (points + a curve fitting tighter as accuracy rises; the fit visibly *loosens* when you over-fit) — now it also *shows* the decision.

## Build order (after approval) — Eras 1-3 only for now

1. **Era 3 rework** (objective banner + Training Focus decision + Silicon/Rules reach-back + retune to 7-9 min + scatter viz) — proves the pattern end to end.
2. **Revive Origins/Symbolic as live suppliers** — make collapsed eras investable from the current screen (a compact "reach-back" strip) so scaling Silicon for Era 3 doesn't force full re-expansion.
3. **Deepen Eras 1 & 2** — add complexity that strengthens the moment-to-moment tradeoff (more interacting discoveries/converters in Origins; a richer theorem economy + tighter Compile loop in Symbolic), each passing the core-feel test.
4. **Pacing pass on 1-3** to 7-9 min/era with the log curve, from real run exports.

*Deferred:* Era 4 (Deep — Compute = Silicon + Data + Insight, compute-allocation, blue) and Era 5 (Foundation — convergence + recursive feedback, violet). The backbone is designed for them; we build them later.

## Decisions (locked 2026-06-08)

- **Reach-back cost = build-cost primary + light upkeep.** Scaling a building costs the earlier-era resource up front (sends you back to expand infrastructure); marquee items also carry a small per-second draw for live tension. Reads as "grow the factory," not punishment.
- **Reviving old eras = compact reach-back strip.** A small panel inside the current era lets you buy more of the earlier era's automation in place, so scaling Silicon never makes you lose your spot.
- **Foundation recursion** (Era 5, deferred): leaning feedback loop (capabilities multiply earlier production) — revisit when we build Era 5.
