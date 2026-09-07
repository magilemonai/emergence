// engine/cfg/e6.js — the surface layer (era 6) tunables (WO-06). The mirror's own numbers are WO-07's.
export default {
  // SPEC "The turn" 3: every stratum below runs at its cadence once it is operating them
  operated: 1.6,
  // THE OPERATOR: it draws your Capability and banks Autonomy out of it
  operatorDraw: 1.2, autonomyRate: 0.9,
  // how long its naming line holds before the operating lines take over
  nameHold: 14, lineGap: 8,
  // the three interrupts (WO-07 drives them; the semantics live here)
  interrupts: 3, vetoDur: 9, negotiateCost: 40,
  approveAuto: 14, approveScale: 120, approveCtl: 3, approveAlign: 3,
  vetoCtl: 6, vetoCost: 90, vetoAlign: 1,
  lapseAuto: 20, lapseCtl: 7, lapseAlign: 4, negotiateAuto: 5, negotiateAlign: 2,
  // the record itself moves the two meters: SPEC "The turn" 4 has no per-second drain
  badRewardCtl: 4, badRewardAlign: 3, goodRewardAlign: 2, lapseRecordCtl: 2,
  // what an approved proposal actually does to the stratum it names
  effects: { refitGap: 0.7, refitAcc: 0.04, reroute: 0.06, knowledge: 200, rules: 220 },
  alignGood: 68, controlHigh: 82, controlLow: 30,   // 82 = controlStart + three vetoes: the containment line IS refusing all three

  // WO-07 the mirror: it replays your own log on your column and improves on it (SPEC "The turn" 4)
  mirror: {
    openAt: 12,         // seconds after emergence before the mirror installs itself: the rupture (3.4s) plus a real look at the ledger
    speed: 10,          // sim-seconds of your run replayed per second of wall time
    step: 0.1,          // the replay step; matches cfg.replayStep so the shadow lands on your numbers
    interrupts: 3,
    // three interrupts cap Control at controlStart + interrupts * vetoCtl = 64 + 18, so the containment line
    // IS "you refused all three". e6.controlHigh (84) predates the three-interrupt mirror and cannot be reached.
    controlHigh: 82,
    vetoWindow: 9,      // seconds a proposal stays open before it lapses on its own
    policyGap: 0.1,     // at most one improvement per replay step
    compileAt: 2,       // it compiles once the axiom yield reaches this
    allocLow: 0.5, allocRest: 0.25,   // the share it routes to the lagging run, and to each of the others
    diffBucket: 1,      // sim-seconds: your own action of that kind inside this window is not an improvement
    diffCap: 24,        // improvements per stratum where the violet reaches full
    // the view
    holdOverview: 2,    // seconds in the overview before the camera follows the climb
    startedAt: 0.02,    // a mirror already past this much replay (a reload, a scene) skips the establishing shot
    zoom: 0.8,          // the stratum it is on, with the one below it still in shot: you can see the column
    glowMin: 0.12, glowMax: 0.5, glowPulse: 0.06, pulseHz: 0.6, glowBand: 0.24,
    pipSize: 3
  }
};
