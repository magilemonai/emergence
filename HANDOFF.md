# EMERGENCE — Project Handoff

> Context document for continuing development of an incremental/idle game in Claude Code.
> Hand this to Claude Code at the start of a session so it understands the design, the
> current state of the code, and the principles to build against.

---

## What this is

**EMERGENCE** is a browser-based incremental (idle) game about an AI system
bootstrapping itself from hand-written rules toward emergent generality. It is a
single self-contained HTML file (inline CSS + vanilla JS, no build step, no
dependencies). It runs by opening the file in a browser.

The game is in **early prototype**. The full four-era arc is scaffolded and playable
end to end, but the pacing has **not** been tuned through real playtesting. The
numbers were set by feel. Balancing the curve is the main near-term work.

---

## The design, in one paragraph

The player begins with a single button: *Write a Rule*. Clicking produces Rules, one
at a time. There is nothing else on screen — no resource bar, no panels. Once the
player has enough Rules to afford the first piece of automation (a Ruleset that writes
rules on its own), the cold-open dissolves and the full interface fades in. From there,
new "eras" of AI unlock one at a time, each gated behind progress in the previous one.
Each era introduces one new system, and only after the prior era is comfortably
automated. Older eras stack on screen as a visible history; when a later system fully
supersedes an earlier resource, that era desaturates and collapses into a "legacy"
state — still present, no longer demanding attention.

---

## Core design principles (do not violate without discussing)

1. **One thing at a time.** The first screen has exactly one verb. Every new mechanic,
   resource, panel, or button appears only when earned. The player should never be
   shown more than one or two live decisions at once. Complexity arrives in layers,
   each resting on a foundation that now runs itself.

2. **Clicking is the historical opening, not a placeholder.** Era 1 (hand-writing
   rules) is the symbolic-AI era. The manual click is thematically honest. Automation
   isn't just a mechanic — it's the story of the field advancing. Theme and difficulty
   curve are the same curve.

3. **A new era never opens until the previous one is automated.** Gating is the pacing
   spine. The reveal of a new system and the narrative beat of a "paradigm shift"
   happen together.

4. **Stack, then fade.** Eras stack vertically so the player watches their own history
   grow. Obsolescence is earned and explicit: when superseded, an era goes grayscale,
   collapses its body, shows a LEGACY tag, and stays on screen as a record. NOT every
   era becomes obsolete — some keep feeding the chain (Eras 3 and 4 currently do not
   go legacy).

5. **The AI-history parallel stays abstract but true.** Follow the real arc (Symbolic →
   Statistical → Deep Learning → Foundation models) loosely. Never let historical
   accuracy get in the way of good gameplay or good storytelling. No dates, no lectures.

6. **Recontextualize, don't discard.** Systems expansion works best when an older
   resource gains a NEW use when a new system appears (e.g. legacy Rules are spent to
   buy Datasets in Era 2). Nothing the player built should feel abandoned.

---

## The four eras (current scaffold)

| Era | Paradigm     | Verb / system                          | Makes        | Consumes      | Goes legacy? |
|-----|--------------|----------------------------------------|--------------|---------------|--------------|
| 1   | Symbolic     | Click to write rules; Rulesets automate| Rules        | —             | Yes (when Models mature) |
| 2   | Statistical  | Datasets generate Data; Models convert | Data, Insight| Rules (to buy)| Yes (when Training matures) |
| 3   | Deep         | Compute nodes + Training runs          | Capability   | Insight       | No (so far)  |
| 4   | Foundation   | Clusters turn Capability into Scale    | Scale        | Capability    | No (endpoint)|

The prototype's authored content ends at the "Emergence" milestone (Scale >= 50).
Everything past that is open road.

---

## Code architecture

Single file: `emergence.html`. All logic in one IIFE in a `<script>` tag. Key structures,
all near the top of the script so they're easy to find and tune:

- **`CFG`** — the config object. Every tunable number lives here: costs, growth rates,
  yields, and the era gates (`era2Gate`, `era3Gate`, `era4Gate`). **This is where
  balancing happens.** Touch this before touching logic.

- **`S`** — the full game state object (all resources, all building counts, flags,
  obsolescence map). Single source of truth.

- **`ERAS`** — display metadata per era (color, tag, name, subtitle).

- **`MILES`** — the milestone array. **This is the pacing spine.** Each entry is
  `{ id, cond, fire }`: a condition function and a one-time effect that unlocks content
  and fires a toast. To re-sequence the game's reveals, edit this array. To retune when
  things unlock, edit the `cond` functions (which mostly reference `CFG` gates).

- **`BUYS`** — purchase definitions (which resource each building costs, cost formula,
  what buying does). Uses getters so costs are always live.

- **Core functions:** `tick()` (the 100ms logic loop — all production/conversion math),
  `renderEras()` (rebuilds the era stack DOM), `renderHeader()` (resource bar),
  `renderCold()` (the cold-open view), `writeRule()` (the click action),
  `buy()`, `revealGame()` (cold-open → full UI transition), `openEra()`.

### Math conventions
- `cost(base, growth, count) = floor(base * growth^count)` — geometric cost scaling, the
  standard incremental wall. Raise `growth` to steepen.
- Capability/XP-style curves use `base * rate^level`.
- Production is per-second, applied each tick as `rate * dt` where `dt = tickMs/1000`.

### Hard constraints
- **No external dependencies, no build step.** Single HTML file, opens in a browser.
- **No localStorage/sessionStorage** in the artifact-rendered version. (If you add
  save/load for local dev, gate it so it degrades gracefully — see "Known gaps".)
- Keep it 60fps-smooth; the render rebuilds innerHTML each tick, which is fine at this
  scale but watch it if the DOM grows large.

---

## Known gaps / good first tasks

These are real and worth doing, roughly in priority order:

1. **Tune the pacing.** Play from a cold start and note where it drags or dumps too
   fast. The Era 1→2 transition is probably close; later eras likely rush or stall.
   Adjust `CFG` gates and growth rates against actual play. This is the #1 task.

2. **Save/load.** There's currently no persistence. Add localStorage save/load + offline
   progress (idle games live or die on offline gains). Note the artifact constraint
   above — for a locally-hosted file, localStorage works fine.

3. **Bulk-buy / buy-max.** Standard incremental QoL: buy x1 / x10 / max toggle.

4. **Era 3 supply-chain depth.** The compute/data/insight interplay is the most
   interesting system and is currently thin. Flesh out the tradeoffs (e.g. Compute
   should feel genuinely scarce and force allocation decisions).

5. **A central visualization.** Right now it's clean terminal-minimal. A growing
   system diagram (nodes lighting up as capabilities come online) would carry the
   atmosphere. Aim for an A24 / tightly-authored sensibility, not flashy.

6. **Number formatting at scale.** `fmt()` handles up to Qa; extend for deep runs.

7. **Balance pass on obsolescence timing.** Eras currently go legacy on hardcoded
   conditions; make sure they fade at a satisfying moment, not too early/late.

---

## Working style preferences (for Claude Code)

- Concise, scannable responses. Lead with the change, not preamble.
- No em-dashes in prose. Avoid "it's not just X, it's Y" constructions.
- Direct feedback over validation. If an idea is weak, say so and why.
- When changing balance, state the BEFORE and AFTER numbers and the intended felt effect.
- Make one coherent change at a time so it's easy to playtest and revert.
- Keep the single-file constraint unless we explicitly decide to split.

---

## Provenance

Design developed in a Claude chat session. The era-progression structure and the
single-button cold open are the core design decisions. The game is an original work
inspired by the incremental genre (genre conventions are shared vocabulary, not owned).

---

## Platform decision: web-first (revisit Unity only on specific triggers)

**Decision:** Build and prove this game as a single HTML file (vanilla JS + inline CSS).
Do NOT port to Unity or any engine during design and balancing.

**Why web is the correct tool, not the toy version:**
- Incrementals are almost entirely UI, text, numbers, and reactive state. They have no
  physics, no spatial sprite movement, no real-time rendering demands. The web stack does
  dynamic text/panel/state UI natively; game engines are worst at exactly this.
- Most successful incrementals shipped as HTML/JS (Universal Paperclips, Cookie Clicker,
  Trimps, Antimatter Dimensions). This is the genre's standard medium, not a lesser path.
- The fast iteration loop — edit a number, reload the tab, feel the difference — is the
  single most valuable asset for pacing work. An engine replaces "reload the tab" with a
  compile + editor step, slowing the exact loop that matters most.
- Engine fluency is a human cost that Claude Code cannot remove. Good AI-written C#
  doesn't make a first-time Unity user fluent in the editor, scenes, prefabs, or build
  pipeline. Learning an engine while designing a game routes every experiment through
  friction.

**Triggers that WOULD justify a Unity (or other engine) port — only after the design is
proven fun:**
1. The game wants a rich animated central visualization (particle systems, shaders,
   real-time effects) that the web genuinely can't do well.
2. A native Steam release is the goal, needing Steam achievements, cloud saves,
   controller support, etc.
3. Performance ceilings the web can't meet (not currently in sight for this design).

**Rule of thumb:** Porting a *proven* design to an engine is a well-scoped project.
Building an *unproven* design in an *unfamiliar* engine is how prototypes die. Prove it
in the fast medium first. Treat "port to Unity" as a question allowed only once the first
~15 minutes of play feel genuinely good.
