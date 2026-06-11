# EMERGENCE v2 — The Overhaul Plan

> Full-game improvement plan (2026-06-11), written with decision authority. Covers story, UI,
> and the core gameplay loop of every era. Sources: four deep code/design audits of
> `emergence.html`, all three Zach alpha rounds, the live screenshots, and the existing
> design docs. Decisions in this doc are made, with overrules of prior locks flagged
> explicitly in section 9.

## 1. The verdict

What is genuinely strong (protect all of it):
- The five-era concept and the AI historiography. Each era teaches a real concept through a
  real mechanic. The educational layer is the game's clearest identity.
- The emergence rupture. Zach: "kind of terrifying... almost a boss level." The hidden
  threshold, the label drift, the reveal that Anomaly was Agency. This is the best moment.
- The art direction per era, the music beds, the cold open, the restraint of the writing.
- The engineering: build-once rendering, Run Recorder telemetry, deterministic offline,
  129 green tests, single-file discipline.

The four weaknesses, and they compound:
1. **Every era's back half decays into a treadmill.** Origins ends in Refinement spam.
   Symbolic ends in Optimization-lemma spam. Statistical is a dial you set once. Deep is
   reactive whack-a-mole with a hidden balanced-is-fine answer once you find it. Foundation's
   aftermath is three buttons and two thresholds.
2. **Causality is invisible.** The overfit gap, the heat throttle, the drift wind, the hidden
   Scale: the player feels effects without seeing causes. Zach's confusion in Era 3 and Era 4
   is this one problem wearing different costumes.
3. **There is no story, only flavor.** The player has no identity, the agent has no
   character, the endings are one sentence each, and finishing returns you to a blank
   cold open. Nothing persists, so nothing matters twice.
4. **The UI fights the game.** 5px meters, 9.5px labels, hover-only tooltips, a crowded top
   bar, no fast era navigation, new unlocks appearing at the bottom of the screen.

## 2. The thesis: one game, one verb

The game already has a unifying mechanic hiding in it and v2 makes it explicit:
**every era is an allocation problem under pressure, and the pressure escalates.**

| Era | What you allocate | The pressure |
|----|--------------------|--------------|
| 1 Origins | Hands between the Record and the Forge (a two-sided lever) | Each craft starves the other's upkeep |
| 2 Symbolic | Inference between competing proof targets | Contradictions corrupt rules until resolved |
| 3 Statistical | Training attention between Fit / Generalize / Explore | The data itself shifts under you |
| 4 Deep | Compute across three runs (the triangle) | Drift, erosion, heat |
| 5 Foundation | Trust between yourself and the agent | The allocator starts allocating without you |

Emergence is the moment the thing you trained to allocate begins doing the allocating.
That is the design sentence for every decision below. The motif escalates mechanically:
two-way lever, aimed stream, three-way dial, continuous triangle, negotiation. By Era 5 the
player recognizes the shape of every allocation surface in the game, which is exactly why
watching the agent operate them lands.

## 3. The story spine

### 3.1 The narrator reveal (the big swing, mostly writing cost)
The game's prose already speaks in a calm, retrospective voice, like an artifact being
read. v2 commits to it: **the entire game is the agent's reconstruction of its own
origin.** The cold open ("a record, beginning") is literal. Every flavor line you have
read is its memory of how it came to be. At emergence, one line lands the twist:

> "I remember this part. You are reading my memory of being built. Keep going."

This costs almost nothing (a handful of lines, a tense audit of existing text) and
retroactively charges every word in the game. It also makes the title pay off twice:
emergence of the system, and emergence of the narrator.

Pre-emergence foreshadowing (specified in DESIGN-era5 but only partially shipped) gets
fully built: an action occasionally completes a beat before the click, a converter
self-adjusts once with a log line ("operator action anticipated"), the Self-Improve label
drift stays. Three or four oddities total, spaced, each logged so they can be reread.

### 3.2 The player and the agent
- **The player is the Hand.** Never named on screen until the end, when the agent names you:
  "You are the hand that inscribed the first mark." The continuity of operators across five
  ages. No backstory needed; the cold open already establishes it.
- **The agent names itself at emergence,** derived from the run (seeded from era times and
  the dominant capability, e.g. an agent built prepare-heavy with Vision dominant gets a
  different name than a rushed Reasoning build). A name makes the aftermath a relationship.
  It remembers your build: its first proposals reference what you actually did ("You spent
  longest in the Symbolic age. I started there.").

### 3.3 Endings become epilogues
Each ending grows from one sentence into a short typed epilogue (5-7 beats) assembled from
run data the Run Recorder already holds: which era you lingered in, whether you prepared or
rushed, how many vetoes lapsed. All three endings become morally ambivalent rather than
good/bad/neutral:
- **Symbiotic:** it no longer needs you, and you will never fully understand it again.
- **Contained:** the door held. You keep wondering what was on the other side.
- **Runaway:** it never rebelled. It became faster than permission. It was magnificent.
The scorecard (R3.3) stays as the final screen after the epilogue.

## 4. Era-by-era core loop redesign

### Era 1 — Origins: from two purchase lines to one people
**Today:** Scribes and Miners are parallel buy-buttons; the real decision (Knowledge vs
Materials) is buried in purchase order; the back half is Refinement spam and waiting on the
Foundry.

**Redesign:**
1. **The Hands lever.** Scribes and Miners merge into one population, **Hands** (bought with
   a mixed Marks+Ore cost), assigned by a two-sided lever: Record ◀────▶ Forge. This is the
   game's first allocation surface and it makes the era's central tension a thing you
   physically hold, the same way Era 4's triangle does. The lever is live the whole era:
   Scriptorium hungry for Marks but burning Ore means the right split keeps moving.
   Discoveries that touched Scribes/Miners now touch sides of the lever (Apprenticeship
   speeds the Record side, the Wheel boosts the Forge side at a Record cost: the existing
   tradeoffs port cleanly).
2. **Commissions replace Refinement as the back-half engine.** Rotating one-time orders
   ("The temple asks for 200 tablets", "The forge-lord wants 40 Metal before the kiln
   cools") with a visible timer and a permanent reward (+% to a specific side, a free Hand,
   a discount). One active at a time, declinable. They generate the late-era near-wins that
   Refinement faked, and they pull the lever back and forth, which is the point. Refinement
   stays as a small sink but stops being the only thing to do.
3. **Keep:** the discovery tree, converter pause, sub-age reskins (R3.9), the seeding of
   Era 2 from Knowledge.

### Era 2 — Symbolic: from a hallway to a branching machine
**Today:** the tree is a hallway (every node is a prerequisite of the next), Daemons are an
early trap, and the late game is lemma spam toward a 30,000-cost capstone.

**Redesign:**
1. **Exclusive branches per compile run.** Forward Chaining and Backward Chaining become a
   real fork: you take ONE per run. Compile resets the fork, so the existing reset loop
   becomes the way to experience the other build (automation-heavy vs click-heavy). Rete /
   Heuristics hang off their respective branches. This converts the Compile loop from "do
   it when growth stalls" into "do it to change strategy", and gives the era internal
   replay value.
2. **Contradiction events (the era's live pressure).** Periodically the terminal halts:
   `CONTRADICTION DETECTED: rule 4471 conflicts with rule 902`. Rule production drops 40%
   until you resolve it by discarding one of two named axiom-flavored choices, each a small
   permanent modifier (one favors Rulesets, one favors manual writes, etc.). Telegraphed,
   logged, resolvable in one click but worth two seconds of thought. The CRT world finally
   gets the malfunction it visually promises.
3. **Daemons move behind Inference Engine's branch** and get costed as the luxury they are,
   killing the early trap.
4. **Proof flow made visible:** the active theorem shows inference streaming into it
   (animated fill with /s rate and time-to-proof). Aiming the stream is the era's
   allocation verb; it should look like one.

### Era 3 — Statistical: the full rebuild (the weakest era)
**Today:** Zach, three rounds running: "very confusing." The gap is invisible, the goal of
the scatter is unreadable, method discovery is an RNG grind that can softlock the mood, and
Focus is a dial you set once.

**Redesign (this is the deepest single-era change):**
1. **Two needles, named.** The plot header shows **TRAINING 91% / VALIDATION 74%** as two
   labeled needles on one track, with the spread shaded amber and labeled OVERFIT. The
   scatter draws both curves with on-canvas labels ("what it memorized" / "what it
   learned"). Effective accuracy is just the validation needle. This single change answers
   every "what am I even doing" question Zach asked.
2. **The Experiment Board replaces RNG discovery.** Three face-up experiment cards at a
   time, each with a Data cost and a stated payoff ("Run a holdout study: unlock
   Regularization", "Sweep features: Data yield ×1.5", "Ablation: +4% accuracy, +overfit").
   You choose which to fund. Explore focus refreshes the board faster and cheapens cards.
   Methods become things you went and got, never things the dice withheld. (Kills the
   Regularization softlock-by-RNG outright.)
3. **Distribution shift (the era's live pressure).** Once or twice in the era the data
   visibly migrates on the plot (points slide to a new shape), validation decays toward a
   floor, and you re-fit. Telegraphed ("the world the data came from has changed"),
   teaches the realest lesson in applied ML, and foreshadows Deep's drift in miniature.
4. **Focus stays three buttons** (R3.8's relabeled RUN TRIAL stays), but each button shows
   its live needle effect before you press it ("Fit: TRAIN ▲▲ VAL ▲ OVERFIT ▲▲").
5. **Keep:** the 88% gate, Silicon reach-back, the teal instrument aesthetic, tidbits.

### Era 4 — Deep: from whack-a-mole to weather
**Today:** the best era. The steering verb works ("a ship through a storm"). What is
missing is foresight, differentiated responses, and honest tool costs.

**Redesign (surgical, the era stays locked in structure):**
1. **The wind forecast.** Each run card gets a small sparkline arc showing its drift
   pressure over the next ~10 seconds (the wind is already deterministic sine math; show
   it). Steering becomes anticipation instead of reaction. This is the single highest-value
   Deep change.
2. **Telegraph events 3s out** ("SHIFT FORMING on Vision...") so skilled players
   pre-position, and make the two events demand different shapes: shifts want a sustained
   reallocation (lean in for the duration), breakthroughs want a concentration burst that
   deliberately collides with heat (push hard, eat the heat, ease off). Now heat is the
   cost of greed, felt every breakthrough.
3. **Momentum:** a run held above its demand for 6s erodes at half rate, rewarding
   committed steering over jitter.
4. **Stabilizer cost linearized** (140/190/250/320/400). At ×1.7 it is a trap; the audit
   math says so.
5. **Tri-color identity (Zach's flagship ask):** Vision cyan, Language violet, Reasoning
   green everywhere those runs appear: loss lines, triangle corners, and the triangle's
   center becomes a live gradient blend of the three at the handle position. The supply
   bus rows inherit the run colors.

### Era 5 — Foundation: the aftermath becomes a negotiation
**Today:** the rupture is great; the aftermath after it is meter management. The agent
proposes, you click one of three buttons, two thresholds decide the text you get.

**Redesign:**
1. **Proposals come from the real substrate.** The agent's actions target your actual
   weakest systems with real numbers ("Your Foundries idle 31% of the time. I want to run
   them." / "Statistical validation is stale. I will re-fit it."). Approving visibly
   changes that era's panel (the ⟳ badge plus the actual rates moving). The supply chain
   capstone stops being narration and becomes observable cause and effect.
2. **A third response: NEGOTIATE.** Alongside approve/veto: counter-propose. It costs time
   (the window shortens next round) and a little Alignment or Scale, and converts the
   proposal into a constrained version (smaller effect, less Autonomy gain). Negotiate is
   the skill verb of the aftermath; approve and veto are the blunt ones. Three responses ×
   four proposal types × your substrate state = an actual decision space.
3. **The agent visibly plays the game (Zach J6, cheap and huge).** When it operates a prior
   era, that era's controls move on their own: the Era 3 focus dial flips, the Era 4
   triangle handle glides, a buy button flashes and fires. The player scrolls up and
   watches their own interface being played better than they played it. This is the
   capstone image of the whole game.
4. **Pre-emergence keeps R3.6's rush-vs-prepare** and adds the full foreshadowing set
   (3.1). The recursion ladder's burst-proofing (Scale gate, cooldown, 1.9 growth) stays.
5. **Asymmetric aftermath dynamics** (so the three moves stop being interchangeable):
   Control is hard to raise and decays slowly (structural), Alignment is easy to raise and
   decays quickly (relational), Autonomy only ever rises. Constrain angers nothing but
   costs throughput; lapsed vetoes keep compounding (R3.5 stays).
6. **Endings resolve into the epilogues + scorecard** of section 3.3.

## 5. The UI system overhaul

1. **Era navigation: tabs, polished.** ✅ BUILT (P1.1). (Amended after reading the live
   build: era tabs already shipped in Zach round 2 with `TABS = true`; the pre-plan audits
   described an older layout.) v2 keeps tabs and finishes them: the strip is sticky so
   switching is always in reach mid-era, the active sigil tab glows in its era color, and
   keyboard focus rings exist.
2. **New unlocks pin to the top of their era** (Zach D, asked in every round). ✅ BUILT
   (P1.7; top placement for Origins/Symbolic pre-existed, v2 added the 9s era-colored
   announce glow).
3. **Legibility floor:** body text minimum 12px, control labels minimum 11px, meters 5px →
   12px with a soft fill animation. Numbers stay tabular. The top bar caps at five
   resources with a "+N" overflow popover instead of crowding.
4. **Color-within-era as a system** (Zach C): every resource gets one hue used consistently
   in its top-bar chip, its tile icons, its tooltip header, and any meter it fills. Era
   accent colors stay for the world; resource hues do the differentiating inside it.
5. **Glossary panel:** a "?" in the header opens a right-side index of every mechanic,
   resource, and tidbit encountered so far (built from the same data-tip/TIDBITS content),
   searchable, era-grouped. Tooltips stop being the only memory.
6. **Touch + keyboard:** tooltips become tap-to-pin on touch; era sigils, focus buttons,
   and veto windows get keyboard access and visible focus states; the existing
   reduced-motion support extends to transitions.
7. **One consistent era anatomy:** world-object hero on top (plot chamber, fabric, CRT,
   workbench, recursion field), allocation surface directly under it, builders below,
   reach-back strip at the bottom. Deep already has this shape; the others adopt it.
8. **Responsive tiers:** desktop (drawers push), tablet (drawers overlay), phone (single
   column, sigil bar becomes the nav). The game currently has one 880px breakpoint and an
   untested phone story; the jump-bar makes the phone layout viable.

## 6. The educational layer (the Foxfire thread)

R3.7's tidbits stay and grow into the game's stated identity: **the game where you learn
what an AI is by building one.** Additions:
- A tidbit for every Method, event type, and aftermath move (distribution shift, contradiction,
  negotiation as RLHF-flavored steering), written short and earned, logged forever.
- The glossary panel (5.5) doubles as the course notes.
- The epilogue scorecard links each grade component to the concept it measures
  ("Alignment 71: it wants what you meant").

## 7. Meta-progression and replayability

1. **Continuity (NG+).** At the end of every run the agent offers to carry **one memory**
   forward; pick one of three boons derived from the run (e.g. "I remember the Forge":
   Origins converters 20% cheaper / "I remember the proof": start Symbolic with the other
   branch's first node / "I remember you": one free Negotiate per aftermath). Next run, the
   narrator occasionally pre-echoes ("I remember this part going differently"). One memory,
   never stacking into a prestige wall: the point is texture, the chase is the grade.
2. **The chase:** S-grade, all three endings, both Symbolic branches, and a post-first-win
   **challenge board** on the title screen (Rush: emergeScale at 1000 / Stillness: win the
   aftermath without a single veto / Famine: feedstocks at 60%). Each is one CFG override,
   nearly free to build, and each makes a different era the hard one.
3. **The scorecard stays the spine of replay** (R3.3): per-era splits read like a speedrun
   timer, the grade like a rank.

## 8. Pacing bar (unchanged, restated)

7-9 minutes per era, logarithmic, always a near-win within small fiddling. Every redesign
above was chosen to generate late-era near-wins natively (Commissions, contradictions,
experiment cards, shifts, events, negotiations) instead of via repeatable-buy treadmills.
Each phase ends with a Run Recorder export read against the four-beat targets
(0:45 / 2:15 / 4:30 / 7-9).

## 9. Decisions made (including overrules)

| Decision | Status |
|---|---|
| Era tabs (already shipped in round 2) kept and polished: sticky strip, glowing active sigil | Amended: the tabs decision was already made before this plan; v2 finishes it |
| Era 1-2-4 world-pass locks reopened for surgical loop changes only (Hands lever, fork+contradictions, forecast/telegraph/colors) | Overrules the locks; the bar they passed was legibility, the new bar is "becoming a game" |
| Objective philosophy unchanged: objective line + Goals tab, no banner | Reaffirms the standing decision |
| RNG method discovery removed (Experiment Board) | Overrules the existing Explore-odds design |
| Refinement demoted, Commissions added | Overrules the board-sprint Refinement fix |
| Narrator = the agent, player = the Hand, agent self-names | New |
| Single file, no deps, tests green per commit | Reaffirmed, non-negotiable |
| Art remains ChatGPT-generated per ART-PROMPTS flow | Reaffirmed (new asks: commission seals, experiment cards, agent name-glyph) |

## 10. Build order (each phase = green tests + a commit + a screenshot)

1. **Legibility frame** ✅ COMPLETE (2026-06-11, 7 commits, 129 tests green): sticky
   sigil-tab nav + focus rings, new-unlock announce glow, meters/fonts floor, resource
   hue system (RES_HUE + header dots; Knowledge now visible in Era 4), Codex glossary
   drawer ("?" in header, searchable, progression-gated), Era 3 two-needle
   TRAINING/VALIDATION readout with overfit spread + ceiling/goal ticks + on-canvas
   curve labels, Era 4 tri-color completion (colored feed lines, corner fields,
   run-colored intakes/orchestration).
2. **Era 3 rebuild** ✅ COMPLETE (2026-06-11, 3 commits, 147 tests green): Experiment
   Board (next Method face-up with a Data price; Explore fills a SURVEY that discounts
   cards; funding consumes it; rotating Holdout/Sweep/Ablation utilities; RNG discovery
   deleted), distribution shifts (deterministic triggers at 0.55/0.78 raw accuracy, 5s
   telegraph, points migrate, hit scales with overfit, tidbit logged), focus-button
   effect chips (TRAIN/VAL/OVERFIT/SURVEY signatures in track colors). Autoplayer Deep
   knowledge-deadlock fixed (sink-pausing decoupled from node count; Deep 41.6m→11.1m).
   Era 3 autoplay ~4.9m — the by-hand 7-9 tune waits for the Phase 8 pacing pass.
3. **Era 5 aftermath** ✅ COMPLETE (2026-06-11, 2 commits, 167 tests green): proposals
   generated from the live substrate with real numbers (re-fit / reroute / run the
   Foundries / prove with idle Rules; spawn+rewrite fallbacks), effects land in the named
   era (opBoost ×1.6 for ~22s, agent-live glow), lapses fire without you; NEGOTIATE
   (half effect, +Alignment, 40 Scale, next window sooner; S.negotiates counted);
   agent-play beat presses your actual controls (focus dial, triangle, buys, terminal);
   asymmetric meters (Control structural 0.4/s drift, Alignment relational 0.45/s decay
   +12/act, Autonomy only rises); endings open with run-data epilogues, all three
   ambivalent. Foreshadowing oddities + agent naming stay in Phase 6 (story pass).
4. **Era 4 weather** ✅ COMPLETE (2026-06-11, 1 commit, 173 tests green): per-run 12s
   wind-forecast sparkline (demand curve vs dashed feed line), 3s named telegraphs,
   shift = sustained 1.8× squall / breakthrough = 2.2× concentration burst that collides
   with heat, 6s momentum halves erosion, stabilizer linearized.
5. **Era 1 + 2 loops:** Hands lever + Commissions; Symbolic fork + contradictions + Daemon
   move + visible proof stream.
6. **Story pass:** narrator audit + reveal lines, foreshadowing oddities, agent naming,
   epilogue writing, tidbit expansion.
7. **Meta:** Continuity, challenge board, scorecard links.
8. **The tune:** full no-dev run, Run Recorder export per era against 7-9, then Zach
   round 4 with the export.

Autoplayer notes per phase: 2 removes Era-3 RNG (tests get more deterministic, not less);
5 reworks the Origins step (lever instead of two buy lines) and Symbolic step (pick the
Forward branch); 3 needs an aftermath bot that Negotiates. The Knowledge-deadlock guard from
R3 carries over unchanged.
