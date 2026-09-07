# WO-12 · The Receipt (the Foxfire page)

## Goal
From the log, a generated page that maps what the player actually did to the history of AI: minutes spent
automating (Origins) → the loom and the ledger; proving (Symbolic) → 1956–1980 symbolic AI; fitting/overfitting/
shifts (Statistical) → the statistical turn; drift/heat/architecture (Deep) → 2012–2020 deep learning; feedback →
RLHF; the turn → the alignment question. Numbers from the run, one paragraph per era ≤ 60 words, plain English, no
jargon without a gloss, no em-dashes, Cody's voice rules (see `~/.claude/CLAUDE.md` if readable; otherwise: warm,
direct, no contrastive constructions).

## Files you own
`v5/engine/receipt.js` (pure: `receipt(state)` → `{sections:[{era, title, stat, text}]}`), `v5/render/eras/receipt.js`
(a DOM page shown after the endcard, with a "download as text" that builds a `.md` blob), `v5/test/wo12-*.test.js`.

## Acceptance
`node v5/test.js` green (receipt from a bot run has 5 sections, each ≤ 60 words, numbers present, lint clean).
