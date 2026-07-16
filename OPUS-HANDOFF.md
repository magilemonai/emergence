# Handoff to Opus - EMERGENCE

> Written 2026-07-15 by the outgoing Fable session, at Cody's request. This is the
> contextual half of the handoff; the forward plan lives in `ROADMAP.md`. Read this,
> then `CLAUDE.md` (the full project contract), then `NEXT.md` (the live board).
> Point-don't-copy rule applies throughout: this file holds pointers and judgments,
> the repo files hold the truth.

## What you are stepping into

EMERGENCE is Cody's browser incremental game about the evolution of intelligence -
five eras from the first inscribed mark to an AI emergence and its aftermath. The
**v3 "Flow Board" rebuild is LIVE** at https://magilemonai.github.io/emergence/
(shipped 2026-07-01 on Cody's explicit call). One screen per era, color-coded
resource rail, a visible sources→converters→outputs pipeline, radically less text.
The paradigm spec is `DESIGN-v3-paradigm.md`; the 8 design laws are `DESIGN-r6-ui.md`.

## Exact state (verified 2026-07-15 - commands at the bottom)

- `node test.js` green: runs the v3 suite (92 tests) + an artifact-freshness check.
- Live site returns 200 and serves the v3 build. Assets confirmed 200 on 2026-07-01.
- HEAD is `774fdca` (a deck steering-sync commit); the ship commit is `2efd620`.
  Everything is pushed except one working-tree edit: `PLAYTEST-PROMPTS.md` gained an
  ending-recap question on 2026-07-05, uncommitted.
- **Waiting on Cody, by his own checklist** (`NEXT-STEPS-CODY.md`, untracked): generate
  3 Foundation cap images (prompts ready in `ART-PROMPTS.md` item 5b), record his
  playtest of the live build, hand over Zach's capture when it arrives. As of today
  none have landed (newest capture folder is still `20260701_130925`). Per house
  no-nag doctrine: the delay is his to spend. Do not chase it.

## The architecture in one breath

`emergence.html` (the live file) is a **GENERATED artifact**. The source of truth is
`emergence-v3-unified.html` (shell: theme CSS + `CFG` tunables + boot IIFE) plus
`v3-kit/kit.{js,css}` (shared kit) and `v3-kit/era-*.js` (five era factories,
interface documented in `v3-kit/KIT.md`). Workflow: **edit modular → `node
tools/build-single.js emergence.html` → `node test.js` → commit**. The freshness check
fails the suite if you forget the rebuild. The pre-v3 game is fully preserved:
`archive/emergence-v2-final.html` + `node archive/test-emergence-v2.js` (200 green).

## Load-bearing rules - violating any of these has already caused a real incident

1. **BUILD-ONCE / update-in-place.** Never rewrite a button's innerHTML on a tick -
   it swallows the click mid-press (the "dead-click" bug, 18 dead clicks in one
   playtest). Change-detected setters (`KIT.setTxt/setHTML/setDis`) guard every
   per-tick write; purchases call `refresh()`, structural changes call `render()`.
2. **Push deploys the live site. Push ONLY when Cody says.** Commit freely.
3. **`KIT.MUTE` gates every live-only system** (commissions, contradictions, Deep
   weather, the rupture, the whole aftermath) so offline catch-up replays silently
   and deterministically. Any new timed/toasting mechanic must check it.
4. **Tests before commit, always both gates**: `node test.js` (suite + freshness).
   The progression bot inside `test-v3.js` plays the full arc through `era.acts`
   using only board-visible levers - keep it that way; it is the proof that the
   affordances players can SEE are sufficient.
5. **`CFG` lives in the shell HTML** and `test-v3.js` extracts it by regex - keep the
   `var CFG = {...};` literal shape intact.
6. **KittyCapture/ and the built `emergence-v3-single.html` are gitignored.** Large
   videos never enter git.

## How to work with Cody on this game - the earned wisdom

- **He distrusts raw model GUI instincts, with receipts** ("as an AI with all the
  love, you are not coming up with intuitive graphical user interfaces"). Layout and
  visual-design changes are playtest-gated: ground them in his validated patterns
  (the Flow Board laws, the "build-here" supply bus he called "kind of fun", the
  big-verb/one-screen/color-rail vocabulary) or prepare options for his eye. Never
  blind-ship a redesign. Engineering (persistence, tests, tooling, honest-button
  fixes) is yours to do without asking.
- **Color, not text.** His strongest recurring note. When a mechanic needs teaching,
  reach for hue/glow/placement before prose; prose goes in tooltips.
- **The feel bar**: always a near-win within reach, 7-9 minutes per era, flurry of
  small actions early / fewer bigger decisions late. Every resource gets a flavor
  line AND a literal mechanical line.
- **His loop**: he plays, talks aloud into KittyCapture, and repetition = emphasis
  (tone doesn't transcribe). `/process-capture` runs the whole pipeline and
  synthesizes into `TODO-v3-unified.md` - the durable master list. `PLAYTEST-PROMPTS.md`
  holds the exact questions the next capture should answer; keep it current.
- **The bot proves completable, never fun.** Use it to close starvation/deadlock/
  pacing-bound questions before his time is spent; hand feel questions to his hands.
- **Fix the lying button.** Twice now the real bug was a control that advertised an
  effect it couldn't deliver (Marks-starved scriptoria; the pre-staffing supply bus).
  When a playtest complaint seems like confusion, first check whether the UI is
  telling the truth.
- **Voice**: no "It's not X, it's Y" constructions anywhere (game text included), no
  em-dashes in game prose, no duration estimates at Cody, deliver-and-stop (no
  "how does that read?"). House-wide rules live in the `house-doctrine` and
  `steering-conventions` skills - load both at session start.

## Decision rights here

Cody decides: anything visible in the game, pushes, pacing values (after his hands
confirm), kills. You execute: engineering, verification, tooling, honest-state fixes,
and preparing decisions so he can choose fast. Ratification culture applies - dated,
attributed rulings in CLAUDE.md, never drift.

## The verification arsenal

| What | Command |
|---|---|
| Full gate (suite + artifact freshness) | `node test.js` |
| v2 archive still green | `node archive/test-emergence-v2.js` |
| Live-render any era seed + overflowPx | `node tools/shoot-unified.js <seed> out.png` (seeds: seed, seedsym, seedstat, seeddeep, seedfound, seedpost, seedend; `SHOOT_FILE=emergence.html` targets the artifact) |
| All 5 eras render on nav | `node tools/nav-smoke.js` |
| Settings/pause/save/offline-toast | `node tools/settings-smoke.js` |
| Deep Hold lever states + glow | `node tools/deep-lever-smoke.js` |
| Rebuild the live artifact | `node tools/build-single.js emergence.html` |
| Live deploy check | `curl -s https://magilemonai.github.io/emergence/emergence.html \| grep -c "FLOW-BOARD KIT"` (≥1 = v3 served) |

Headless probes report `overflowPx` - note the artifact measures tighter than the
modular source (embedded fonts): e.g. Origins +247 artifact vs +289 source. `NEXT.md`
quotes source numbers; measure against the artifact when deciding.

## Memory

Two persistent memory files exist at
`~/.claude/projects/-Users-cody-Desktop-Games-Emergence/memory/`:
`emergence-ui-intuitiveness.md` (the GUI-distrust lesson + the Flow-Board mandate and
its confirmation) and `emergence-playtest-loop.md` (how the capture→fix loop runs +
current state). Keep both current as the game evolves - they are how a fresh session
recovers judgment, and they saved this project once already.

## Provenance - re-verify before relying

- State claims: `git log --oneline -5`, `git status --short`, `ls -t KittyCapture/captures | head -3`
- Suite counts: `node test.js 2>&1 | tail -3`
- Live: the curl above
- Everything else: `CLAUDE.md` (RESUME section), `TODO-v3-unified.md`, `v3-kit/KIT.md`
