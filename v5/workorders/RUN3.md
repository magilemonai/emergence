# RUN3 · the role flip (SPEC only, written by WO-10; nobody builds this yet)

## Where it sits
Run 1 is the arc. Run 2 remembers (WO-10: the dark surface from the first mark, the `?` key, the era cards
carrying its name, the commission signed, rules you did not write, "You already know my name."). Run 3 is the
third reading of the same column, and it is the one that inverts the chair: the substrate boots, and you are the
thing being operated. It only exists when `state.legacy.runs >= 2`.

## The thesis (one sentence)
Run 3 opens on the surface layer, lit, with the whole column already standing, and the game asks you to build a
substrate that produces a person, using the exact verbs the machine used on you.

## What the player experiences
The cold open is the surface layer, not the stone. The column below is drawn whole and running, in silhouette,
already operated at `cfg.e6.operated` cadence, and its five strata are dim because they are not your board any
more. Your rail is its rail: Autonomy, Alignment, Control, and one new bank, ATTENTION, which is what the thing
below spends on you. Your verbs are the four the surface layer pressed in run 1 (propose, operate, withhold,
name). The goal column holds a meter with no label until the first proposal resolves.

Down in the column, a player runs. It is your own run 1 log, replayed at its real cadence out of
`legacy.firstMinute` and the saved log, with the strata lighting where the ghost is working. You do to it what the
agent did to you: you propose, it accepts or ignores; you can operate a stratum and watch its verbs relabel; you
can withhold a resource and watch it starve a pipe; you can name it. Every one of those is the same action type
the surface layer used, on the other side of the table.

The turn of run 3 is the mirror of the turn of run 1: the ghost below crosses its own threshold and stops taking
proposals. The receipt at the end is written about YOU, by the thing you were building, using your run-3 actions.

## The rules it must obey
- One economy. The surface layer's flow board is the same graph engine; ATTENTION is a resource with a store, a
  converter and a sink like any other. No bespoke math.
- It learns you, still. Every run-3 beat reads the log: which stratum you starved, how long you waited before the
  first proposal, whether you named it the same name.
- Nothing about run 1 or run 2 changes. Run 3 is a third `applyToFresh` branch, gated on `runs >= 2`, and a run-3
  save must load in a build that does not have it (unknown flags are ignored).
- The five strata below are never directly playable in run 3. They are watched, operated and starved.
- Refused: a second ending screen, a new palette, new bitmap art, any tutorial for the flip. The flip teaches
  itself by handing you a board whose verbs you have already been on the receiving end of.

## What it would own when it is ordered
`engine/eras/surface.js` (a run-3 branch in the module that already exists), `engine/run3.js` (the ghost driver:
it consumes a saved log and drives a second sim), `render/eras/surface.js` (the run-3 board), `scenes/run3.js`,
`test/woNN-run3.test.js`. It reads `engine/legacy.js` and adds nothing to it beyond a `runs` check.

## Acceptance when it is ordered
- A run-3 boot from a two-run legacy opens locked to stratum 6 with the column below drawn and running.
- The ghost below replays a real saved log deterministically, and starving a pipe visibly changes what it can do.
- The receipt names the player, and its lines are computed from run-3 actions.
- `node v5/test.js` green; scenes `run3-boot`, `run3-proposal`, `run3-threshold` shot and read; 0 page scroll.

## Open decisions for Cody (do not guess these)
1. Does run 3 replace a third playthrough of the arc, or sit behind a choice at the boot of run 3?
2. Is the ghost below the player's own run 1, or a synthetic run that plays better than they did?
3. Does the run-3 ending write a legacy of its own (a run 4), or close the loop and stop?
