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

## Open questions to resolve before building

1. **Which depth levers** (scarcity / diminishing-refill / heat / synergy / frontier) — how many,
   to keep it deep but not fiddly.
2. **Form factor** — confirm the compute-fabric-control-surface direction vs mission-control vs
   loss-landscape.
3. **Mission control vs machine hall** as the dominant material read (cool ops room vs hot industry).
