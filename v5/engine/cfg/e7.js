// engine/cfg/e7.js — the reveal, the film, the ghosts, the endcard (WO-08). Nothing else may inline a number.
export default {
  reveal: {
    camMs: 2200,          // the pull-out to the overview (SPEC "The turn" 5)
    typeMs: 46,           // per character of the ending name
    lineSize: 34,         // px, mono, the ending name over the silhouette
    pulseMs: 2400,        // symbiotic: one breath of the whole column
    darkMs: 480,          // runaway: per stratum, bottom-up
    ringMs: 1100,         // contained: the ring that locks the surface
    reducedMs: 900        // the whole move, with motion off
  },

  film: {
    n: 288,               // snapshots (12s at 24fps)
    fps: 24,
    ms: 12000,
    tail: 0.3,            // seconds the film keeps rolling past your last action, so it ends where you are
    stepsPerMs: 240,      // sim steps a chunk of 1ms of budget is allowed: the engine has no clock of its own
    sliceMs: 8            // the precompute's own slice: half a frame, so the ring turns and nothing stalls
  },

  ghosts: {
    seconds: 60,          // SPEC: your first sixty seconds of clicks
    speed: 1,             // played back at the speed you made them
    moveMs: 260,          // travel to the next target
    pressMs: 150,         // the press itself
    maxMs: 62000          // the replay never outstays the minute it is replaying
  },

  endcard: {
    lineMs: 520,           // between epilogue lines
    gradeCut: { S: 85, A: 72, B: 58, C: 42 },
    quality: { align: 0.6, control: 0.25, speedBase: 18, speedMin: 30, speedFall: 0.6 }
  },

  sequence: { revealHoldMs: 2600, filmHoldMs: 900, ghostHoldMs: 700 }
};
