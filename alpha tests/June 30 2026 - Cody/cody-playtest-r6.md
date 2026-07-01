# Cody self-playtest — 2026-06-30 (KittyCapture, 22.8 min, round-4/5 local build)

Source: `KittyCapture/captures/20260630_194539/` (transcript.txt + video.mp4 + mic.wav).
Cody played the **local `emergence.html`** (URL bar confirms) = the round-4/5 build, so all the
round-4 legibility work (UI-scale 1.1, +/s rate readouts, bottom-right commission toast, era tabs,
discoveries drawer, era-tinted log) WAS present. It still failed him. **This is an information-
architecture / intuitiveness problem, not a font-size problem.**

## The verdict (his words)
> "The vibe is awesome. The vibe is very cool. But I made this and I walked away for a week and I
> came back and I still got lost in what we're doing here." … "The layout is confusing. Super
> confusing." … "as an AI with all the love, you are not coming up with intuitive graphical user
> interfaces."

Vibe/aesthetic/transitions/music = won. Layout/IA/intuitiveness = lost. Pacing was NOT a complaint
(Era 3 pacing got praise: "in general a better run time than I've experienced in the past").

## The single most important insight
The information he wants **already exists** — it's just placed in his blind spots:
- Per-resource **+/s rates** exist (top bar) but top-right, tiny → "hard to see where my marks are
  ticking up… I don't naturally want to look there" [01:13].
- The **FLOWS · PER SECOND** dashboard exists but sits at the bottom, below the fold → "this is what
  I want… it's just nowhere near anything useful to look at, doesn't flow well" [02:53]. He wants the
  flow **in the dashboard / in view** [09:15].
- The **commission toast** fired bottom-right but he missed it → "I didn't know this commission was
  happening… nice if there was some kind of marker" [04:49].

Fix = visual hierarchy + salience + one-screen, not "add the info" (it's there).

## His explicit directives (said repeatedly, emphatically)
1. **Deep-research intuitive UI.** "maybe we need to do a deep research project on what intuitive UI
   means" [12:43] / "more research projects on what makes sense means… you need to be trained in human
   intuitive UI" [15:28]. Said 3x + a direct challenge to my GUI competence. → RUNNING (r6 iteration 1).
2. **Lead with the value.** "for text, we need to lead with the value. What's it giving me as the
   player? How is it affecting the economy? Is it plus something… color coordinate everything" [08:17].
3. **Strip back text.** "so much text… I'm not reading it" [05:57][10:20]. "really strip back the text…
   very simple text" [15:11].
4. **One screen.** "I can't see everything in one kind of spot" [02:29] / "I can't even see in one
   space what I'm supposed to be doing" [11:25]. Core loop shouldn't need scrolling.
5. **Clear clickability.** "not clear what's clickable versus what's part of the UI" [11:10].
6. **Redesign Era 2 (Symbolic) especially** — the worst offender.

## Per-era ranking from this run
- **Era 3 Statistical = best / the gold standard.** Big glowing "RUN EXPLORE TRIAL" button = intuitive
  ("this takes more intuitive sense… hit this big glowing button" [18:28]). Segmented Focus dial reads.
  Wants the big button on the **left** (reading start) [18:33]. Pacing praised.
- **Era 1 Origins = middling.** Info in blind spots (top-right rates, bottom flows). Too much tile text.
  Missed the commission. Wants rate/flow in view.
- **Era 2 Symbolic = worst. "Super confusing."** Primary action (WRITE A RULE / theorem targets) below
  the fold [10:31]. No connective tissue from Era 1 → "what is rules? how do I get to rules?" [10:41].
  Clickability unclear. Dynamic elements shove content ("this thing appears now… pushing the rule out
  of the way… not intuitive" [11:45]). Events fly by unreadable ("contradiction detected… went by too
  fast" [13:22]; "manufactured urgency… don't have enough time to read" [14:14]).

## Discrete bugs / aversive interactions (fix regardless of research)
- **Rule-write spawns a hidden text field** → "creates a new text field that just typically hides. I
  really don't like that. Makes me not want to ever click that button again" [13:53]. KILL THIS.
- **Dynamic elements reflow/shove** the layout when they appear [11:45]. Reserve space / no jump.
- **Events too fast to read** (Era-2 contradictions, Era-3 shifts) [13:22][22:03]. Slow / hold / log.
- **Commission arrival not salient** [04:49]. Stronger marker (journal animation, in-panel badge).
- **Click gives no consequence feedback** — "if I click on them, I can't see what happens" [04:08];
  "doesn't show you live… what your marks per second means" [03:34].
- **Restart friction** — "we've got to write rules again at the start, which I hate" [15:45].
- **Scrolling loses the hero viz** in Era 3 [19:20] (viz scrolls out when you use the controls below).
- **Minor layout break** at Era-3 end / transition [22:33] (low priority, recheck).

## The loop (KittyCapture-driven)
Iteration = batch of changes → Cody records a fresh KittyCapture run → I review transcript+frames →
repeat. **Iteration 1:** (a) deep-research intuitive incremental-game UI [running], (b) turn it into a
concrete IA/redesign spec, (c) implement the discrete-bug batch + the highest-confidence IA wins,
tests green. Big Era-2 redesign follows the research. Not pushed to live until Cody says.
