# Era 4 — Deep: world-pass ideation

> Working notes (2026-06-08). Era 4 is currently "built + art wired" but on the OLD card/panel
> UI, before the world-loop. It also tested as the mechanically weakest era. The world-pass is
> the chance to (a) give it a distinct operating metaphor and (b) deepen the core decision.

## The agency arc (the throughline that's been working)

- Origins — **author** (make marks, forge matter)
- Symbolic — **operate** (type rules into a logic terminal)
- Statistical — **observe & steer** (tune one learning instrument)
- **Deep — orchestrate at scale** (provision + allocate compute across many parallel runs; you stop touching the model)
- Foundation — **witness emergence** (recursive self-improvement; the agent appears)

## The soul of Deep

Intelligence now comes from **industrial-scale compute** thrown at large models; capability
**emerges from scale**. You are an infrastructure operator / compute allocator, not a scientist.
The act-shift from Statistical: **intimate precision instrument → massive humming industrial hall.**
Deep is the heaviest, most *physical* era (the irony: "deep learning" needs enormous physical
compute) — the industrial peak right before Foundation transcends it.

## De-materialization arc / material progression

1. Origins — carved stone (ancient, tactile, warm ochre)
2. Symbolic — CRT terminal glass (electronic, contained, green)
3. Statistical — luminous scientific instrument (precise, teal glass)
4. **Deep — industrial compute fabric (massive, powered, blue; heat + flow + racks)**
5. Foundation — emergent / cosmic (dissolving, weightless, violet)

## Recommended form factor: a compute-allocation control surface over a training cluster

The world object is the **three training runs (Vision / Language / Reasoning) as parallel
loss-curves descending**. You split a **finite compute budget** across them and watch capability
emerge. Around the runs: power/throughput, node provisioning, the industrial supply feed
(Silicon→nodes from Origins; Data + Insight as fuel from Statistical).

Interaction grammar (how it plays differently):
- **Allocate** a scarce compute budget across parallel jobs (not steer one process).
- **Provision** capacity (compute nodes) — industrial buildout, the reach-back to Origins' Silicon.
- **Monitor** utilization / power / heat; watch loss curves descend at different rates.
- Verbs: `Provision`, `Allocate`, `Schedule`, `Scale Up`, `Throttle` — ops/infra language.

## Candidate form factors (for the ChatGPT brainstorm)

- **A) Compute fabric / datacenter ops (recommended).** A humming server hall: racks, GPUs,
  power, heat, conduits. Allocate compute across training jobs. Most distinct from the Statistical
  instrument; leans into scale + parallelism + compute-as-bottleneck.
- **B) Mission-control orchestration deck.** A control room of dashboards over parallel runs.
  Cleaner/cooler; risks reading as "another dashboard."
- **C) Loss-landscape descent.** You steer gradient descent down a 3D loss surface. Leans the
  existing loss-curve viz; more abstract, possibly too cold.
- **D) Reactor / energy condensation.** Feed compute-energy into a chamber where capability
  condenses. Poetic; less literal; risks stepping on Foundation's transcendent register.

Lean: **A fused with B** — a control surface over a humming compute cluster. Racks + power + heat
as the material; the three loss curves + allocation as the live decision.

## The real opportunity: DEEPEN the decision (Deep is the weakest mechanic)

Current mechanic: split compute across 3 runs; Capability accrues from the **geometric-mean
breadth** (balance beats specialization); breadth gate → Era 5. Risk flagged earlier: **balanced
1/1/1 may dominate — set it and walk away.** The world-pass must add live tension so re-allocation
matters over time. Candidate levers (pick 1-2, keep the always-a-near-win feel):

- **Diminishing returns per run that refill over time** → you chase the lagging run; allocation is
  a moving target, not a static split.
- **Compute scarcity is the spine** — compute is genuinely finite per tick; over-allocating one run
  *starves* the others (visible), so the split is a real tradeoff every moment.
- **Power / heat constraint** — push a run too hard and it overheats/throttles (an "additions
  contain subtractions" tension, like Origins' upkeep). Cooling/power becomes a sub-decision.
- **Run synergies/conflicts** — e.g. Reasoning trains faster when Language is ahead (curriculum);
  creates sequencing decisions instead of a flat split.
- **Frontier milestones per run** that unlock capability spikes, so you sprint one run to a
  threshold then rebalance — gives the allocation a rhythm.

My instinct: **compute scarcity (spine) + diminishing-returns-that-refill (chase the laggard) +
a light power/heat tension.** That makes allocation a live, compelling dial instead of a one-time
setting — the Era-3 "always a near-win steering" feel, but at the orchestration level.

## Signature viz (already partly built: drawLoss)

Three loss curves descending, one per run, colored. Make it the centerpiece (like the scatter is
for Statistical): curves descend as runs train; the active allocation visibly pushes one down
faster; breadth = how balanced/low the three are together; a run that's starved flattens; overheat
adds jitter. Add: utilization bars, power draw, a "capability emerging" readout.

## Material / palette / type / sound

- Palette: deep blue, glowing compute, power-amber accents for heat/warnings, cool white for
  active. Distinct from Statistical teal. (Existing era color var --e3 = #6ea8ff blue.)
- Material: brushed-metal racks, glowing edge-lit cards, conduits/wiring, fans, heat shimmer.
- Type: a techy/industrial face (Orbitron / Rajdhani / Chakra Petch for display) + a mono for
  readouts. Must differ from Space Grotesk (Statistical) and VT323 (Symbolic).
- Sound: low hum / drone, power surge on Scale Up, fan whoosh — heavy/industrial vs Statistical's
  clean sine pings.

## Art (likely needs some new PNGs, unlike Era 3)

- Rack / node module art (or CSS-built, per the CRT-bezel lesson — build the hall geometry in CSS).
- The casing/frame: **CSS-built** (do NOT stretch a photographic datacenter PNG — same shredding
  problem as the CRT bezel).
- Existing: era4 sigil, compute-node icon, the 3 run glyphs (Vision/Language/Reasoning) — already
  generated. Loss-curve viz is canvas. So art need is moderate: maybe heat/power accent textures,
  a run-status glyph set, conduit/flow details. Confirm against the build as it proceeds.

## Thematic anchor: Deep is the PRESENT TENSE

Era 4 is the dominant *now* — the player is standing inside today's industrial AI buildout:
datacenters, GPUs, transformers, scaling laws, data/insight pipelines, inference demand, power +
heat constraints, massive capex. (Origins=ancient craft, Symbolic=1950s-80s GOFAI, Statistical=
classical ML 80s-2010s, **Deep=present**, Foundation=the arriving/contested threshold: agents,
recursion, world models, emergent autonomy.) This is *the* reason to make Era 4 heavy, hot,
physical, industrial — it should feel like the real machine being built around us right now. Then
the **Era 4 → 5 handoff should feel eerie**: the giant material machine suddenly gives way to
something less obviously mechanical. Design the transition for that drop.

## CONVERGED DESIGN (post-ChatGPT brainstorm + Cody alpha, 2026-06-08)

**World: a hot industrial compute fabric / machine hall** (NOT mission control — "supervise" is
the wrong verb; "orchestrate power at terrifying scale" is right). Heaviest, loudest, most physical
era; the machine that eats Silicon + Data + Insight + cooling and turns scale into capability.

**Hero object:** a **three-lane loss chamber** — Vision / Language / Reasoning as parallel loss
curves descending, each with capability value, efficiency tint, saturation/heat haze, a bottleneck
marker (lowest run), and a frontier shimmer when active.

**Signature control:** a **triangular ternary compute mixer** under the chamber — a draggable node
in a triangle (corners = the 3 runs), total always 100%, min 5% per run, never all-zero (this also
fixes the alpha P1 stall). Compute flow-lines run from the mixer into each lane. (Fallback if the
drag/ternary math is too fiddly: three linked power faders locked to 100% + a BALANCE snap.)

**Mechanical package (keep it to these four; sequence the build, tune each as it lands):**
1. **Geometric-mean breadth** = the long-term victory shape (keep — elegant, thematically right).
2. **Saturation / freshness** = THE live dial. Feeding a run drives diminishing returns within its
   current headroom; rebalancing away lets headroom recover → optimal play *orbits* balance instead
   of sitting at 1/1/1. `freshness ≈ 1.25 − saturation*0.8`. (Frame as headroom/diminishing-returns,
   not "resting heals it.")
3. **Heat / throttle** = physical cost ("additions contain subtractions"). Total + concentrated
   compute makes Heat; high Heat throttles all runs; cooling decays it. **Keep forgiving** — mostly
   Stable/Warm, rarely Throttling; a soft concentration cap (discourage 100/0/0), not a babysat
   fail-state. `concentrationPenalty = max(0, largestShare−0.5)*0.08`.
4. **Frontier windows** = rotating near-win OPPORTUNITY (never penalty). One run at a time gets a
   ~25-40s +40% window (prefer a lagging/non-saturated run); catch it or feed the bottleneck — both
   fine. Missing one is neutral.

**Per-tick (compact):**
`gain_i = computeRate * share_i * freshness_i * (isLowest?1.25:1) * (frontier?1.4:1) * heatThrottle`
`saturation_i += share_i*satRate − recovery*(1−share_i)`; `heat += activeHeat+concHeat − cooling`;
`breadth = cbrt(V*L*R)`; gate to Era 5 unchanged.

**Synergies/curricula = milestones only, not a constant system** (avoid "need a strategy guide"):
e.g. Language 10 → Reasoning +10%; Vision 10 → freshness recovers faster; Reasoning 10 → frontiers
last longer. Per-run frontier/capability plates.

**Cross-era reach-back is a VISIBLE spine** (the living-supply-chain payoff): the hall consumes
Silicon (Origins → Compute Nodes), Data + Insight (Statistical → run fuel) through feed rails /
conduits, not a card. The whole game's output pours into this one machine.

**Material/palette:** deep blue-black, electric blue #6ea8ff, pale blue live loss, **amber/orange =
heat ONLY** (not general accent), red = throttle, cool white active. Brushed metal, rack mesh, fan
grilles, conduits, LED strips, glass status panels, heat haze. Sound: low rack hum, relay clicks,
fan ramp on Scale Up, voltage whine, thermal alarms (vs Statistical's clean sine pings).
**Casing built in CSS** (the CRT-bezel lesson — no stretched photographic frame). Assets are
overlays/details only: rack-mesh, fan-grille, conduit junctions, heat-haze, glass reflection,
node/rack icon, optional tri-mixer plate, warning-LED strip. (Existing: era4 sigil, compute-node
icon, the 3 run glyphs — already generated.)

**Type:** industrial control labels — display **Rajdhani / Barlow (Semi)Condensed / Saira**
(Orbitron sparingly), numeric readouts **IBM Plex Mono**. Must differ from Symbolic VT323 and
Statistical Space Grotesk.

**Build sequence (Cody refinement — don't ship 4 raw systems at once):**
1. Foundation: palette + industrial font + the 3-lane loss chamber hero (extend drawLoss) + the
   compute mixer (spine), with **breadth-bottleneck** surfacing. Tune the reallocation loop.
2. Layer **saturation/freshness** (the live dial); tune the orbit-around-balance feel.
3. Layer **heat/throttle** (forgiving); tune.
4. Layer **frontier windows** (opportunity); tune.
5. Sound, art overlays, supply-conduit visualization, milestones, pacing pass → screenshot protocol.

**Also fixes the alpha P1:** the fixed-budget mixer (min 5%, normalized, never all-zero) resolves
the Deep all-zero self-stall by construction.

## REDIRECTION (2026-06-08, Cody): steer against the drift

The v1 levers all pushed toward balance, so balanced-1/1/1 was optimal → "press nothing to win."
Root cause: allocating between three SYMMETRIC runs toward a "keep balanced" goal is a non-decision.
Fix: make the three dimensions **drift apart on their own** so balanced input ≠ balanced output. The
triangle becomes the instrument to *steer the ship against the wind*.

**1. Inherent drift (the wind).** Each run k has a time-varying headwind `drift[k]` (oscillating,
out of phase) that erodes its level independent of allocation. Net level change = allocated gain −
headwind. Neglect a run → it drifts down; the strongest headwind moves between runs, so the
bottleneck is never static and balanced never matches the pattern. You counter-steer constantly.

**2. Exogenous events (telegraphed, real-AI):**
- **Distribution shift** — a run's level drops a chunk ("data moved, model went stale"); recover it.
- **Compute / data shock** — total throughput or a feedstock dips temporarily.
- **Breakthrough** — a run gets a temporary tailwind (REPLACES the frontier: push one cheaply now).

**3. Reach back to unblock (deep steering layer).** Each run draws a SPECIFIC earlier-era resource:
- Vision ← **Data** (Statistical) · Reasoning ← **Insight** (Statistical) · Language ← **Knowledge** (Origins).
When a run fights a headwind AND its feedstock is dry, compute alone can't push it — you reopen that
era's production (Origins scriptoriums → Knowledge, Statistical datasets → Data). The living supply
chain becomes load-bearing for steering the triangle.

**Net:** this REPLACES saturation + lag bonus (drift makes the bottleneck organic) and the frontier
(→ breakthrough event); heat retires or stays a soft cap. Three legible ideas: **steer against drift,
unblock via reach-back, respond to events.** All active, all real-AI. Win = climb/hold breadth to the
gate against the wind.

**Build order:** (1) drift core in produce() so balanced stops winning; (2) per-run feedstock +
reach-back unblock; (3) events (distribution shift / breakthrough); (4) UI — headwind arrows per run,
blocked/feedstock state, event telegraph banner; (5) retune, sound, screenshot protocol.
