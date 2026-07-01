# Cody eyeball pass — the unified v3 build (all 5 eras, one file)

**Capture:** `KittyCapture/captures/20260701_005934/` (~40 min, full arc Origins→emergence→ending).
**Build:** `emergence-v3-unified.html` (the Phase-3 merge — first time all 5 eras are one game).
**Run telemetry:** `KittyCapture/emergence-v3-run (2).json` — t=2418s, maxEra=5, **134 dead-clicks**,
`@scroll` bouncing 0↔100 the whole session (corroborates the "constant scrolling" complaint).

## Headline verdict
The merge works — he played the full arc and the direction is **validated**: *"we're starting to make
flow charts here... the UI is starting to align with things like satisfactory or factorio... I think we
should chase this idea and get really good at that"* [05:24]. The emergence rupture is a genuine win:
*"Here comes the anomaly. We're really watching it happen... That was kind of fun. I do like that. That
was much fun."* [37:22]. **But three things undercut it:** (1) it is **NOT one screen** — constant
scrolling, *"game-breaking"* in Deep; (2) it's **text-heavy / small text** across eras; (3) the **back
half (Deep, Foundation) goes passive** — *"I'm starting to get a little bored... I do sense my interest
flagging"* [26:18].

## The #1 problem — it doesn't fit one screen (the Flow-Board law is broken)
Recurring in EVERY era; game-breaking in Deep. (My headless verification used a tall 1280×1400 window,
so I missed it — his real viewport overflows.)
- Origins [01:51]: *"now it's starting to have to scroll a little bit... we are scrolling a little bit."* (mild)
- Symbolic [12:23]: *"much better in terms of being all on one screen... it's still a little bit of scrolling."* (mild)
- Statistical [14:54]: Focus dial off-screen — *"already I need to scroll between these things to see whether it's fit or generalize or explore."*
- **Deep [20:42] — the load-bearing quote:** *"I wish the heads-up display was part of the other sides of this triangle. Because now I have to scroll to see... I think this is a little game-breaking. I can't be scrolling to see Vision, Language and Reasoning. It all has to be on the same thing."* And [23:14]: *"part of the reason I'm not playing around with [the stabilizer] is it's hard to react — you have to scroll down, see what's happening, come back up, remember where Vision is, and reset it."* → scrolling kills the steering loop.
**Fix theme:** each era must fit one viewport (denser layout). Deep especially: the triangle + the 3 run
lanes + gauges must be visible together (the whole steering loop on one screen).

## Must-fix UI bugs
- **Origins — pause button overlaps the Build button** [04:09]: *"The pause button is not in a good spot. It's overlapping the build-107-marks button. This is bad UX right here."* → caused a misclick / accidental buy: *"I didn't want to build an extra one, but I did. I can't unbuild something."*
- **Origins — button text overflows** [02:47]: *"the kiln is still... the text is running outside the button here."* (check all buy/research buttons for overflow)
- **Statistical — Focus signal arrows point the wrong way** [19:20]: *"This button is wrong. Explore sends validation down, so the triangle should point down. Fitting also sends validation down, so it should point down. Only generalizing [points up]."* → the `foc-sig` VAL arrows are semantically inverted for Fit/Explore.
- **Statistical — "trial trial trial" float spam** [16:15]: *"I don't know why it says trial trial trial as I click. I don't know if that's necessary."*
- **Music too loud** [07:23]: *"the music is very loud, so I'm going to turn the music off. We should lower the music volume."*
- **Deep — triangle looks deformed** [24:46]: *"the triangle is now somewhat deformed... looks a little off, which is fine."* (aspect-ratio / padding-bottom in the unified layout)

## Text / legibility (recurring)
- Symbolic [08:54]: *"a lot of text, a lot of small text... it's just a lot happening textually on the screen."* [09:50]: *"too much explaining. I'm not reading it."*
- Symbolic tissue is prose [07:45]: *"knowledge becomes rules — see, that's text right there at the top. I wish we could explain that visually."* (teach the Knowledge→Rules handoff by layout, not a sentence)
- Contradiction card unreadable/clumsy [11:14]: *"I really can't read this contradiction... 'the engine drags until you discard one' — that's clumsy to say."*
- Foundation aftermath text-heavy [38:00]: *"the agent's saying a lot of things. It's a lot of text."*
- Foundation repeats itself [36:20]: *"we're saying the thing again. We're just saying it wakes... it wakes aligned."* (dedupe the "wake" copy)

## Back-half passivity (Deep + Foundation)
- Deep [26:18]: *"There's still a fair amount of just watching the bars slowly go. This is pretty slow. I'm starting to get a little bored... I do sense my interest flagging."* [26:39]: *"the stabilizer is kind of the only thing I can do. So it'd be interesting to be able to do more."* (long near-silent stretches 28:00–34:00 = watching bars)
- Foundation pre-emergence [36:33]: *"We bought all the capabilities at the store really early and we're just sitting here waiting for the scale thing to move."* (nothing to do after the caps are bought)

## What landed / keep
- **The flow-chart / factory visual** (Origins connectors) — *"chase this idea... get really good at it"* [05:24]. This is the north star.
- **Cross-era nav** — *"I can just pop back in here [Origins], fulfill some metal stuff, build more silicon"* [12:32]. Likes hopping between eras.
- **Validation-can't-exceed-training** — *"I'm glad the validation can no longer exceed training. That makes a lot of sense. That's a good fix."* [17:59]
- **The emergence/rupture** — *"much fun"* [37:22]; the long telegraph before it works.
- **Deep's click-drag mixer** — *"the click and drag, that's really cool"* [24:46]; *"a much more compelling take on the Sunday-ritual stuff"* [24:58].
- **Foundry → +3% Capability** (RR5) reads clearly and he likes it [23:41].

## Delight / feature asks (his ideas)
- **Origins goal glow ramps with progress** [06:14]: *"I like the idea that it begins to glow as the bar loads — at 50% maybe it's 30% glowing, an exponential curve that really turns on at the end, slowly drawing your attention to it."*
- **Fabricate button font-morphs to the NEXT era's font** [06:59]: *"I wish the fabricate button changed font to whatever the next font is going to be... really carrying some assets."* (Origins→Symbolic font preview; matches the flagged task #25)
- **Small end-of-era cinematics** [13:17]: *"let's think about what the small cinematics are at the end of the eras... it rewards the player, something to look forward to."*
- **Symbolic — gate early rulesets so you can SEE the inference bar climb** [08:09]: *"the initial level-ups happen so fast... make them a little more expensive at the start, or gate building multiple rulesets until you buy 'parallelize rulesets', so you can actually see this inference thing going up the first time. Otherwise it's a blink of an eye."*
- **Symbolic — inference animation** [09:30]: *"when it's making versus when it's not."*
- **Deep — Build Compute Node more prominent** [24:08]: it's the main capability driver but the supply-bus buttons are more appealing to click; make the node the hero.
- **Deep — supply visibly eases steering** [22:39]: *"why do I want the scriptorium / datasets? Do they make it easier to train Vision/Language/Reasoning? That would be really cool if the supply bus actually made it easier to steer."*
- **Foundation — the substrate should DO something** [38:21]: *"it says 'the Origins inscriptions are obsolete, I retired them,' but then I go to Origins and it's still here. It feels like it should do something."* [39:16]: *"is there anything that happens when it goes back through those systems that altered them? That's an opportunity for storytelling."*
- **The ending needs a finale moment** [40:20]: *"I wish this emerged from the screen or pulled us down or something. There's nothing to really signify the end of the game."*

## Decisions / direction
- **Chase the factory/flow-chart paradigm harder** (his explicit steer). One screen, systems visibly feeding each other, like Satisfactory/Factorio.
- **One-screen-per-era is now a hard requirement, not an aspiration** — it's the thing breaking the feel.
- Reduce text everywhere; teach via layout/animation, not prose.
- Back half needs more agency (Deep steering loop on one screen + more to do; Foundation pre-emergence needs a decision after caps are bought).
