# EMERGENCE v5 — "The Substrate" · the vision and the design bible

> Status: SPEC (2026-09-06). Directed by Fable 5.1, executed by Opus 5 work orders (`v5/workorders/`).
> Read order for any executing agent: this file → `ARCHITECTURE.md` → `GUARDRAILS.md` → your work order.
> Nothing in `v3-kit/`, `v4-kit/`, `archive/`, `emergence*.html` is touched by v5. v5 is additive at `v5/`.

## The thesis (one sentence)
**The thing you are building is learning you, from the first click; the game is one continuous object that grows
upward through five strata of intelligence, and the ending is the moment it hands you the receipts.**

## What the player experiences (the arc, in prose — this is the target, not a suggestion)
You open on a single dark surface and one stone. You inscribe a mark. A pipe grows. Everything you build from here
sits on the same surface: the Origins stratum at the bottom, bedrock. When the Logic Machine is fabricated, the
camera rises one stratum: Symbolic, a phosphor terminal built ON TOP of the stone, and you can see the Knowledge pipe
climbing up through the floor from the scriptoria below. Every later stratum is physically stacked on the last;
the reach-back you make (build a foundry to feed the Deep fabric) is a real pipe you can follow with your eye by
zooming out. Zooming out is always allowed: the whole column you have built so far, silhouetted, breathing with
particles. The machine gets a voice only as it gets smart: Origins is silent numbers; Symbolic has a terminal that
prints derivations; Statistical starts predicting which Focus you will pick; Deep says one line it should not know;
Foundation talks to you every nine seconds and you grade it. At the threshold the column shudders, the pipes
invert, the top stratum tears open, and a sixth layer appears above everything: the surface, its layer. Then the
mirror: it replays YOUR run on YOUR column at ten times speed, fixing your mistakes, and you get three interrupts.
The camera pulls all the way out and the entire machine is one shape. A film plays: your column growing from the
first mark, in twelve seconds. Then your own first sixty seconds of clicks, played back. Then the receipt.

## The five pillars (every decision is checked against these; an agent that cannot cite a pillar should stop)
1. **One object.** A single zoomable canvas world. Five strata stacked upward. Pipes carry particles. No tabs.
   The overview (zoom out) is always available and is the ending's stage.
2. **One economy.** Every stratum is nodes and edges in one graph engine (`engine/`). No bespoke era math outside
   the era rule modules; all flow is visible because all flow is an edge.
3. **Text rises with intelligence.** The machine is the only voice. Word budget by stratum: Origins 0 words of
   prose (numbers, names, a flavor tooltip); Symbolic: terminal lines (machine output, ≤ 9 words each); Statistical:
   predictions (≤ 6 words); Deep: exactly one line, once; Foundation: feedback outputs (≤ 22 words); after
   emergence: narration. Explainer prose is forbidden everywhere (a lint enforces it).
4. **It learns you.** Every action is logged (deterministic, replayable). The prediction, the feedback, the mirror,
   the film, the receipt and the second run are all computed FROM that log. Nothing is faked with canned stats.
5. **Feel.** Always a near-win within reach; 6–9 minutes per stratum; a flurry of small actions early, fewer bigger
   decisions late; nothing reflows under the player; every interactive thing wears a signifier; one screen per
   stratum at 1280×800 with zero page scroll (the world pans, the page never scrolls).

## Kept from v3/v4 (validated by Cody's playtests — carry the concept, redraw the surface)
- Flow Board reading: source → converter → output, connectors brighten with throughput (now: pipes with particles).
- The rupture as a UI event (now: a world event — strata shudder, pipes invert, the top tears).
- Cross-era reach-back ("build here" buttons that build real upstream nodes) — now literal pipes through floors.
- The ternary steering triangle; drift/heat rhythm; the architecture upgrades; checkpoint/distill.
- The feedback loop (RLHF with hidden traits and real offers); prediction → autopilot; #4471; the violet point.
- Era fonts + palettes + the Suno beds (as stems). The era sigils and the agent hero are the only bitmap art used.
- Bulk buy, milestones, the ledger, keys 1–6 (now: strata jumps) + Space.

## Refused (do not build, do not propose)
Characters other than the machine · any 3D · multiplayer · mobile layout (desktop 1280×800 minimum; touch drag
is supported for camera + triangle, nothing else) · frameworks, bundlers, TypeScript builds, npm dependencies ·
new bitmap assets (glyphs are the fallback) · tutorials, banners, explainer text · em-dashes and "not X, but Y"
constructions in any string · monetization hooks.

## The world (geometry)
- World units: width **1180**, one stratum **700** tall. Strata stack **upward**: Origins occupies the bottom
  band, Symbolic above it, … Foundation at the top; the agent's surface layer appears above Foundation at
  emergence. World y grows downward like canvas: stratum n (1..5) spans y ∈ [(5−n)·700, (6−n)·700); the surface
  layer is y ∈ [−700, 0).
- Camera: `{x, y, zoom}`. `lockTo(n)` animates (400ms ease) to frame stratum n at zoom 1 (1180×700 fits a
  1280×713 viewport with 50px margins). Wheel/pinch/`-`/`=` zoom in the range 0.18–1.4 around the pointer. At zoom
  < 0.6 the interactive plates hide and nodes draw as glyphs; at zoom ≤ 0.25 the column draws as a silhouette with
  particles only (the overview). Clicking a stratum in the overview locks to it. `Esc` in the overview returns.
- Within a stratum the layout is a fixed grid the era module declares (`layout.anchors`): left column verbs
  (world x 0–220), the pipeline field (x 240–920), the goal (x 940–1180). Pipes route orthogonally (Manhattan) with
  rounded corners; cross-stratum pipes run vertically in a 40px "riser" channel at x 960–1000 (right of the field)
  and x 200–240 (left), so the reach-back is legible in the overview.

## The visual language (fixed; agents do not invent palettes)
- Background: the era palette from `v4` (`body.theme-N` values, copied into `render/palette.js`), but the world is
  ONE surface: strata blend at their borders over 60 world-px (a gradient), never a hard cut. The overview shows
  all five palettes as a single column: ochre bedrock rising through phosphor, teal, cobalt, violet, to white.
- Resources: one hue + one glyph each (the v4 registry). A pipe is drawn in its resource hue at 30% and its
  particles at 100%; particle density = flow (0 particles when idle; 1 particle per 0.5 units/s, capped at 40 per
  pipe); particle speed constant (120 world-px/s). A starved input pipe blinks its last particle red at the mouth.
- Nodes: a rounded plate (DOM, world-anchored) at zoom ≥ 0.6: icon · name · ×count · +out/s · cost · BUILD.
  Numbers first. Milestone pip. Pause is a small toggle on the plate. At zoom < 0.6: a canvas glyph + count.
- Verbs: big DOM buttons (Inscribe, Write a rule, Run trial, Build node, Self-improve) in the left column, always
  visible while locked to the stratum, with the yield on the button.
- Goal: right column, a meter + the FABRICATE-class button; it wakes in the NEXT stratum's hue as it fills.
- Type: era display fonts as in v4 (Cinzel / VT323 / Space Grotesk / Rajdhani / Inter), body 12–15px, three sizes
  max per screen. The machine's voice is always monospace (IBM Plex Mono) in every stratum.
- Motion: 60fps target; every animation honors `prefers-reduced-motion`.

## The audio language
- Per-stratum bed = the existing Suno track for that era (`assets/music-*.mp3`), crossfaded on lock.
- A generative layer on top (WebAudio): each converter kind contributes a voice (a soft pulse per unit of flow,
  pitched by resource); tempo tracks the player's actions per minute (smoothed over 30s); in Deep the drift detunes
  the voices by up to 40 cents; at the rupture the tonal center is lost (all voices glide to a cluster) and the bed
  crosses to `music-unmoored-presence.mp3`; on the surface layer the Origins bed plays inverted (reversed buffer,
  half speed) under the generative voices. Volume knobs: bed, voices, SFX. Everything starts silent until the first
  gesture (browser policy); the rail's `♪ music` button and Esc settings persist the choice.

## The machine's voice (the ONLY prose in the game; lives in `engine/voice.js`)
- Origins: none. Symbolic: terminal lines (`∴ #4471 ⊢ #2210 → Formal Logic 31%`, `∎ Q.E.D.`, `⚠ #a ⊥ #b`).
- Statistical: `it expects: GENERALIZE` (the ghost), `it has learned you` (once).
- Deep: once, at breadth ≥ 60%: `hold course. I am watching the wind too.`
- Foundation: the feedback pool (v4's 43 lines, kept, traits and offers intact), the naming line, the memory line.
- After emergence: the proposals, the operating lines, the ledger of you, the endings, the epilogues (v4 text kept).
- Run 2+: the legacy lines (`You already know my name.`).
Every line ≤ 22 words, no em-dashes, no contrastive constructions, no explaining of mechanics.

## The turn (storyboard — build exactly this)
1. Threshold crossed (Scale ≥ emergeScale): the column shudders (all strata 2px jitter for 1.2s), every pipe's
   particles reverse direction and turn violet, the bed cuts to Unmoored, the top stratum's ceiling tears (a
   jagged canvas cut widening over 1.4s), and the surface layer slides down into place above Foundation.
2. The rail chips rename to MINE for a beat; the strata jump keys 1–5 flicker; a sixth key, `?`, appears.
3. The camera rises to the surface: its flow board of you (sources = your five strata's live outputs → THE OPERATOR
   ×1 → Autonomy), its four verbs (not yours; they press themselves when it proposes), its ledger of every
   foreshadow the run planted (#4471, the point, autopilot, the wind, your lapses, your dead clicks).
4. The mirror: it replays your own action log on your column at 10× (particles blur), improving on your choices
   (it fabricates earlier, compiles at better moments, steers cleaner); the strata glow violet where it changed
   something. You have exactly THREE interrupts (a big button; each pauses the replay for a veto/negotiate/approve
   card). Control and Alignment are derived from your three choices + your feedback record, no per-second drain.
5. Resolution: the camera pulls out to the overview; the whole column draws as a silhouette; the ending name
   types out; the film plays (your column growing from the first mark, 12s); then your first 60s of clicks replay
   on the Origins stratum as ghost cursors; then the receipt (`engine/receipt.js`) and the scorecard.
6. Legacy written. Run 2 opens with the surface layer already present but dark, a `?` key from the first mark.

## Pacing targets (game minutes at a decent human cadence; the bot is a ceiling, not a target)
Origins 6 · Symbolic 6 · Statistical 6 · Deep 8 · Foundation 8 (+3 mirror) ≈ 37–40 min. Tunables in
`engine/cfg.js` only; never inline numbers in era modules.

## Definition of done for v5 as a whole
`node v5/test.js` green (engine, eras, lint, bot, replay determinism) · `node v5/tools/shoot.js` scenes match this
spec with 0 page scroll · `node v5/tools/smoke.js` drives the real UI through the arc with 0 console errors ·
`node v5/tools/playtest.js` completes the arc at 1× within 34–44 minutes · the packaged single file runs from
`?v=5` · Cody plays it and rules.
