// engine/cfg.js — EVERY tunable number in EMERGENCE v5 lives here, in its era's block.
// Era modules read cfg; they never inline a number (GUARDRAILS §2). Later orders fill their own block:
// e1 Origins · e2 Symbolic · e3 Statistical · e4 Deep · e5 Foundation · e6 the surface layer.
export default {
  // the largest step the sim will simulate in one call; a long tab-out is caught up in 0.1s steps instead
  tickMax: 0.5,
  // the step sim.replay() re-runs a log at (also the live loop's nominal step)
  replayStep: 0.1,
  e1: {},
  e2: {},
  e3: {},
  e4: {},
  e5: {},
  e6: {}
};
