# Cody playtest #2 — the unified build after today's fixes (economy reverts, one-screen, art, delight)

**Capture:** `KittyCapture/captures/20260701_130925/` (~19 min, full arc, played FAST — 3x→50x, "I have
things to do, want to get this done quick so you can be cooking"). Build = `emergence-v3-unified.html`
after: all 3 economy reverts, density pass, Statistical stage compaction, new art, goal-glow + font-morph,
P2 text rewrites. Run JSON: `KittyCapture/emergence-v3-run (3).json`.

## Headline
Plays end to end; several of today's changes clicked. **Wins he called out:** the Fabricate font-morph
("pulling in the right text now — I like that" [03:21]); **Statistical now fits** ("this is nice in terms
of it all fitting on one page — I think that's great" [09:37]); the **real build-here reach-back** ("is
there a world where we're just building a real foundry?... I need more knowledge to build more Scriptorium...
I did have to go back for that — that was kind of fun" [11:36-12:24]); the **triangle steering** ("trying
to place it in an ideal zone but you can't see the zone... it's kind of fun" [13:52-14:07]); cross-era nav
("I can click around between those things" [09:08]). **Still-open themes:** too much TEXT (Symbolic), Deep
(heat is dead, thin back-half, wants visual/color not text), Foundation pre-emergence passivity, + 3 bugs.

## Must-fix bugs
- **Symbolic header sigil is broken** [03:38-03:45]: "This thing is broken. The symbol next to the word Symbolic. This is broken." → Symbolic's `sigil:''` renders a broken `<img>`. `assets/sigil-symbolic.png` exists — wire it.
- **Validation blew past Training to 94%** [09:21-09:33]: "at the very end validation blew beyond training to 94% — that's a weird thing, we'll check the math." → with methods, effAccuracy = acc + effBonus − gap can EXCEED acc, so VALIDATION > TRAINING (breaks the invariant he praised last round). Cap eff ≤ training (acc), or rethink the ensembles bonus.
- **Music still too loud** [07:38-07:46]: "the music is still pretty loud. Still pretty loud." → 0.22 not enough; lower again.

## Deep (the most notes)
- **Heat is DEAD** [12:29-12:40]: "Heat is like dead, right? Heat doesn't do anything. There's no instance where heat is ever activated or a threat." → concentrating never heats enough to matter; tune so it bites (the concentrate→ease rhythm is invisible).
- **Color/visual, not text alerts** [13:29-13:40]: "instead of the text alerts 'hold course, vision is drifting, steer there' — I wonder if you can just be color-driven, visual." (his recurring show-don't-tell)
- **Corner-glow to guide steering** [10:48-10:59]: "maybe that corner of the triangle can glow when you need to navigate into it — glow up, and you move the dot closer." → the starving run's triangle corner glows.
- **Frozen/locked run needs a real visual state** [14:21-14:47]: "when it was frozen I wish the whole block was affected some way visually... doesn't have to be icy, but more than the 'frozen' text."
- **Thin back-half** [15:54-16:04]: "there's nothing else I can do to the tech tree here except buy more silicon stuff — hard/tricky to play on."
- Feedstock gating he LIKED: "I liked that the Fit Engine was gated on Data, not Silicon" [09:48-10:03] — keep varied gates (some silicon, some data).

## Foundation
- **advance/goal glow should be PURPLE** [17:01-17:06]: "advance foundation — this should be purple, right? this whole glow should be kind of purple." → Deep's goal-wake + ADVANCE button should tease Foundation's violet, not green.
- **Pre-emergence is dead-passive** [17:16-18:07]: "buy all the capability stuff... 10x... 50x speed... we're just watching... so much time is going to be spent just not doing anything." (bought caps, then nothing to do but watch Scale) — the back-half-passivity bar, still unmet.
- Emergence felt unearned at 50x: "it is a little scary. I didn't do anything." [18:19]

## Symbolic (text)
- **Too much text** [03:55-06:13]: "still agree there's too much text explaining... it's telling not showing... so much text. so much text. I feel like I'm being buried with text." (strongest single complaint this run)
- **Axiom progress unclear** [06:24-06:31]: "it's not really clear what contributes to Axioms or how close you are to getting an Axiom."

## Scrolling
- Origins: "I have to scroll down for the commission" [01:42].
- Statistical: "it's a lot of scrolling — you're gonna see it in the data" [08:00-08:06] (the exp-board/methods), even though the goal view "fits on one page" [09:37]. So: primary fits, secondary still scrolls.

## Decisions / direction
- The **real reach-back + build-here is a keeper** ("kind of fun") — don't second-guess it.
- **Push harder on color/visual over text** across the board (Symbolic text, Deep alerts, frozen state, corner glow) — this is his consistent bar.
- Back-half passivity (Deep tech tree thin; Foundation pre-emergence watching) is the recurring structural gap.
