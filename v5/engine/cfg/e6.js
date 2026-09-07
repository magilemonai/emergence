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
  alignGood: 68, controlHigh: 84, controlLow: 30
};
