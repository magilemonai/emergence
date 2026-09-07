// engine/cfg.js — EVERY tunable number in EMERGENCE v5 lives under engine/cfg/eN.js, one file per stratum
// (so parallel work orders never touch the same file). Era modules read cfg.eN; they never inline a number.
import e1 from './cfg/e1.js'; import e2 from './cfg/e2.js'; import e3 from './cfg/e3.js';
import e4 from './cfg/e4.js'; import e5 from './cfg/e5.js'; import e6 from './cfg/e6.js';
export default {
  // the largest step the sim will simulate in one call; a long tab-out is caught up in 0.1s steps instead
  tickMax: 0.5,
  // the step sim.replay() re-runs a log at (also the live loop's nominal step)
  replayStep: 0.1,
  e1, e2, e3, e4, e5, e6
};
