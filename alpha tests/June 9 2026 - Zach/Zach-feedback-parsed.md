# Zach Alpha Test — Comprehensive Feedback (parsed)

**Date:** June 9 2026 · **Tester:** Zach (treat as creative consultant / gameplay master, not just QA)
**Method:** stream-of-consciousness audio while playing, cross-referenced against the synced Run Recorder telemetry (`Game Code.md`).

**Headline verdict (his words):** *"I loved Origins. The Symbolic and Statistical ages need to be fully redone. I cannot parse what to do. It doesn't feel like a game at that point — it feels like I opened someone's project that I shouldn't have, because I don't understand what's happening."* He stressed: **changing the UI / vibe / feel per era is absolutely correct — the GAMEPLAY and language are the problem, not the art.**

**Telemetry anchors:** Origins fabricate at gt **1328s (~22 min)**. Marks pinned at **0 from gt ~1120→1320** (~3-4 real min soft-lock) right after building **Refinement (gt 1107)** with 18-19 Scriptoriums vs ~20 Scribes. Era 2 (Symbolic) ~10 min, ended at gt 1942. Era 3 (Statistical) he quit ~gt 2370, lost.

---

## A. Vibe & art — what's WORKING (protect these)
1. Cold open (wordmark + runic letters + music) landed hard: "so much character and lore." Hooked from the title. [00:00]
2. Loves the per-era reskin — palette, tone, "creative ideology." Calls the vibe "immaculate" even when lost. [02:30, 22:30]
3. The **paradigm-shift moment** (fabricate → Symbolic, "the age of matter ends, the age of logic begins") = "Oh hell yeah… it feels SO good when it happens." The single biggest emotional payoff. [15:30, 16:00]
4. **max / ×10 / ×1 buy buttons:** "absolute correct… so good. Do not change that." [05:00]
5. **Tooltips** ("a trained hand that never tires of the work") = exactly the clarity he wants everywhere. [10:00]
6. Likes flows-per-second display, the look of the converters, "dink dink" SFX in principle. [04:00]
7. Likes that completing a run/Compile turns your work into a permanent bonus — conceptually cool, just unexplained. [20:00]

## B. Research drawer — UX (strong, repeated complaints)
8. **Opening Research greys out the whole game and blocks all other clicks.** He hated this: wants to keep inscribing / building while planning in Research. [02:30, 03:00]
9. **Make Research a persistent sidebar that stays open** while he plays, not a modal he must close to act. [03:00]
10. **Put it on the LEFT, not the right.** Right-side reads as "secondary"; left reads as "this is the menu / the spine." [03:30]
11. Wants gentle guidance in it — "a little pointer thing: hey, click this." [03:30]

## C. Completed discoveries clutter (repeated, emphatic)
12. **Researched items stay greyed at the TOP of the list** and he keeps trying to click them / wondering why he can't. **Remove them on completion** (or at minimum send them to the bottom). "I don't need them once I've done them — I can see them on the main screen." [01:00, 05:30, 12:30]
13. If you want a record of what's been done, make it a **separate timeline/log** — riffed on a Civilization-style timeline you can scroll side-to-side through the ages (order you researched things, "columns through the ages"). [06:00, 06:30]

## D. "Research" vs "Upgrades" should be two different worlds (key structural note)
14. **Percentage/bonus upgrades should NOT live in Research with the unlock-a-building discoveries.** Clicking "Apprenticeship: +50% faster" after you've been unlocking real buildings "is not satisfying." [06:30, 07:00]
15. Split them: **Research/Build = the unlocks that advance the age (the point of the game)** in one place; **Upgrades/Honing = the % bonuses** in their own spot. [07:00, 07:30]
16. A % upgrade should produce a **visible change** on the thing it buffs — "change the color of the scribe, give them a hat in their symbol" — so it feels like it did something. [07:00]

## E. Naming — "name the thing the thing you'll be looking at"
17. **"Clay Tablets — unlocks the Scriptorium"** confused him; he wants the discovery just called **"The Scriptorium."** Don't make the player translate flavor-name → building-name. [11:00, 11:30]
18. Alternatively: the research is "Clay Tablets," and it explicitly **unlocks the BUILD of the Scriptorium** (research-thing vs build-thing kept distinct, per D). [11:30]
19. **"Build a Scribe" reads as "build a man."** Suggests naming the producer a *place* (e.g. "Classroom" / a place you train scribes) rather than a person. He's fine building producers; the noun is the issue. [01:30, 02:00]
20. **Tally Marks ordering:** the first discovery being an upgrade ("inscribing by hand 2× productive") before the Scribe felt backwards. Consider scribe first, or clearly separate upgrades from buildings from the very first reveal. [10:30]

## F. Numbers & game-feel legibility
21. **Couldn't tell how many Marks he had / that the ×2 actually did anything.** Wants explicit gamer-feedback: "x2 marks inscribed," a visible counter — "I need the numbers, some sort of gamer-system thing." [00:30, 01:00]
22. Discovering "Inscribing by hand is twice as productive" gave no felt confirmation — needs a clear before/after or a pop. [00:30]

## G. Red text & negative numbers (strong aesthetic/emotional note)
23. **Hates red text on unaffordable buys** (e.g. "Build — 233 Marks" in red). "Just grey the whole thing out." Red-in-anticipation-of-a-click "feels bad," reads as a warning. [09:00, 09:30, 10:00]
24. The introduction of **red minus numbers in the flows** (once Scriptorium starts consuming) "makes me feel bad" — first time he's seen anything but positive. Wants it handled gently. [08:30, 09:00]

## H. The flows need plus / minus / net breakdown
25. Wants each resource rate to show, on hover or inline, **+gross bonuses − total consumption = net/s**, so he can answer "do I need to build more, or stop draining this?" He explicitly couldn't tell. [08:30, 09:00]

## I. Converters must be throttle-able / toggleable (THE economy break)
26. **Cannot stop or throttle Scriptoriums/Smelters once built** — they kept draining Marks to 0 with no recovery. "The thing that makes Marks costs Marks." He could not out-click the −8.4/s drain. **Telemetry: Marks = 0 from gt ~1120→1320.** [13:00–14:30]
27. **Refinement made it worse** — boosted converter throughput, accelerating the Marks crash. He'd just bought it and immediately regretted it with no undo/toggle. [13:00]
28. Wants every consumer **toggleable** (pause a converter), so a subtraction can't soft-lock you. This is his #1 *mechanical* fix for Origins.
29. Also confusing: running out of Marks didn't visibly throttle the Scriptorium's output the way he expected (it dropped 40→31/s but kept going) — the starvation feedback is unclear. [13:30, 14:00]

## J. Age transitions need a real moment (repeated)
30. **Entering the Bronze Age "nothing really happened. The music didn't change, the UI didn't change."** He WANTED a shift — animation, color change, music change, maybe a whole UI update. "We're in the Bronze Age now — make the whole thing feel it." [11:30, 12:00, 12:30]
31. Same request for every age change (Silicon, etc.): even subtle is fine, but there must be a felt shift. The strong opening vibe sets the expectation. [15:30]
32. **"Current Phase: Stone Age" (top-left) reads as the GOAL/title.** He stared at "Stone Age" wanting OUT of it. Make the *next age* the headline you're chasing — e.g. title "BRONZE AGE" with subtitle "unlock the Kiln & Smelter, Ore→Metal." Frame ages as the objective. [07:30, 08:00]

## K. Sound
33. **Mute exists — "Thank God"** — but he wants a **volume slider**, not just on/off. [02:00]
34. **Muting music left SFX running with no separate control.** Wants a full sound menu (music vs SFX separate). [04:30]
35. **Inscribe and Quarry share the same sound.** Wants Quarry to sound like quarrying (distinct), or make both a more generic click — but not identical for two different actions. [04:30, 05:00]

## L. "Running" indicator confusion
36. Top status just says **"running"** — non-interactive, unexplained. "I don't know why it says running, but I'm glad it's running." Minor, but it's noise. [05:00]
37. Top bar swapping (Symbolic vs Emergence indicators) — he noticed and approved separating them, but it added to the "what am I looking at" load. [18:30]

## M. Scroll-between-eras (loves the effect, questions the interaction)
38. **Loves** discovering that scrolling reskins the world + changes music. [17:00]
39. But thinks **it shouldn't be a free scroll** — wants discrete **tabs** ("I'm in here, now I'm in here"), not top-to-bottom scroll where a previous era is still partially present. "Top-down doesn't work for going thing-to-thing." [17:00, 17:30]
40. Related: completed Origins still being reachable/visible while in Symbolic confused him about what's active ("Origins says complete… this one says running now"). [18:00]

## N. Era 2 — Symbolic (verdict: confusing, "needs to be fully redone")
41. **Immediately lost.** "As much as I love the vibe, I'm lost. There's no goal here that I have in my brain." [17:30, 19:00]
42. **"Write Rule" looks like a text-input field** (blinking cursor / "text goes here" affordance) but is actually just a click button — misleading. [16:30, 17:00]
43. **Jargon is opaque:** "Theorems and lemmas? The fuck?" / "daemon registry with a PID and a process and an output and a spawn" / "axioms" — "the words mean nothing to me… it's really making me less curious." [19:00, 20:00]
44. **Compile is scary and unexplained:** "Resets rules, rulesets and daemons… What? What the fuck does it mean?" He avoided it, afraid it would end his ability to play. [19:30, 21:00]
45. **Theme/copy contradiction:** the era is called "Hand-Written Logic / rules authored by hand," but visually "this is 100% a computer. Nothing about this is logical by-hand." The CRT terminal fights the "hand-written" framing. [17:00]
46. **Thought it was the END of the game** — the era is labeled "Symbolic" both before and after the transition, and he was just "waiting for a bar to fill," so he assumed the game was over. [20:30]
47. **No moment-to-moment goal / unclear what the verbs do:** "I'm just clicking things because they're clickable, waiting for a bar to fill." Rules counter "stuck at 11," didn't understand what Rules are or where they show up. [18:00, 18:30]
48. Pace felt like dead waiting near the Expert System capstone ("sitting here for another 25 seconds… I guess I'll keep pumping ruleset.d's"). [20:30, 21:00]

## O. Era 3 — Statistical (verdict: MORE lost than Symbolic)
49. **"I'm very lost. I do not know what is happening at all."** More confusing than Symbolic. [22:00, 22:30]
50. **Methods pop up on the right and disappear** before he can read them — "I don't know where they are, I don't know what they mean, to what end I do not know." [22:30, 23:00]
51. **The accuracy bar behavior is unexplained:** "accuracy is going way up but the bar is going down and I don't know why." (overfit gap vs accuracy not legible) [21:30]
52. **Doesn't know what the verbs do** — Run Trial / Expand / Calibrate / Generalize / Explore — "what does this do… clicking things doesn't really do much." [21:30, 23:00]
53. Liked seeing the supply-bus reach-back conceptually ("the instrument draws Silicon from Origins — exactly what I want with the different things") but couldn't act on it. [21:30, 22:00]
54. Quit here (~gt 2370): "this is where I'm gonna stop." [23:00]

## P. Cross-cutting / structural
55. **No stated goal anywhere in his head**, especially Eras 2-3. He never knew the objective. (Note: objective banners were deliberately removed — Zach is direct evidence that "let the goal emerge" failed for a fresh player.)
56. **Pacing for an engaged reader is ~4× the autoplayer:** Origins took him ~22 min (with a multi-minute Marks soft-lock). A real, careful first-timer is far slower than our 5-9 min targets — worth weighing.
57. **Onboarding/teaching is the throughline:** Origins taught him by accident and he loved it; Symbolic & Statistical drop him into systems with no teaching, jargon-first, and he disengages. The fix is as much *introduction/teaching* as it is mechanics.
58. He's emphatic the *premise and feel are right* — the ask is legibility + a felt goal + teaching, not a redesign of the vibe.
