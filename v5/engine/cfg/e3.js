// engine/cfg/e3.js — Statistical tunables (WO-04). Values copied from emergence-v4.html `var CFG.e3`;
// the v5-only additions are the silicon draw of a Dataset (v4 had no riser), the milestone table the
// shared kit used to own, and the two clocks the machine's voice runs on.
export default {
  datasetCost: 30, datasetGrowth: 1.16, datasetYield: 1.2,
  // v5: a Dataset is a converter now, so the Silicon it eats is a real pipe from Origins (v4 spent it only at build)
  datasetSilicon: 0.03,
  modelCost: 90, modelGrowth: 1.2, expPerModel: 0.3,
  modelSilicon: 0.05, expDataCost: 4, accGain: 0.0026, insightPerExp: 2,
  gapGrow: 0.0023, gapReduce: 0.0046, gapMax: 0.6,
  surveyPerExp: 1.1, surveyDiscount: 0.5,
  cardMethodCosts: [60, 150, 320, 560, 900, 1400],
  cardUtil: { calibrate: { cost: 40, growth: 1.22 }, sweep: { cost: 55, growth: 1.22 }, distill: { cost: 35, growth: 1.22 } },
  calibrateCut: 0.7, sweepPush: 0.025, distillGrant: 25,
  genThreshold: 0.88, shiftTriggers: [0.55, 0.78], shiftWarn: 5, shiftBase: 0.10, shiftGapBite: 0.5,
  shiftFloor: 0.05, shiftGapKeep: 0.5, shiftPhase: 0.9, shiftEcho: 9,
  // prediction begins mid-era; only Focus changes that stand >= predDwell seconds count as decisions
  predAfter: 120, predStreak: 5, predRatio: 0.65, predMinN: 12, predDwell: 5, predWindow: 16,
  driftPhase: 0.012, driftGap: 0.0006,
  seedDatasets: 3, seedSilicon: 220,
  // the machine speaks for voiceHold seconds after it learns you; focAtInit keeps the first Focus deliberate
  voiceHold: 14, focAtInit: -999, focusStart: 'fit',
  policyGap: 0.15, policySurvey: 70,
  milestones: [10, 25, 50, 100], milestoneBonus: 0.25, buyModes: [1, 10, 25],
  // method multipliers, kept out of the module so a tune never touches code
  mult: { regression: 1.4, features: 1.5, bayesian: 1.8, clustering: 1.6, regularization: 2, ensembles: 0.12, capNoReg: 0.80 },
  focus: {
    fit: { acc: 1.7, gap: 1.5, red: 0, disc: 0.3, ins: 1.0, label: 'Fit', hue: '#ff9a6b', flavor: 'Accuracy climbs fast. The overfit gap grows with it.' },
    generalize: { acc: 0.3, gap: 0, red: 1.0, disc: 0.3, ins: 1.2, label: 'Generalize', hue: '#5fe0a0', flavor: 'Shrinks the overfit gap. Accuracy only creeps.' },
    explore: { acc: 0.4, gap: 0.5, red: 0, disc: 2.6, ins: 0.8, label: 'Explore', hue: '#6ea8ff', flavor: 'Surveys the board. Experiments get cheaper.' },
    auto: { acc: 1, gap: 1, red: 0, disc: 0.3, ins: 1.0, label: 'Autopilot', hue: '#c9adf5', flavor: 'It chooses the Focus for each trial.' }
  },
  methods: [
    { id: 'regression', name: 'Regression', flavor: 'A line drawn through the noise.', mech: 'Trials raise accuracy 40% faster.' },
    { id: 'features', name: 'Feature Engineering', flavor: 'Asking the data better questions.', mech: 'Datasets yield 50% more Data.' },
    { id: 'regularization', name: 'Regularization', flavor: 'Prefer the simpler explanation.', mech: 'Halves the overfit gap twice as fast and lifts the ceiling.' },
    { id: 'clustering', name: 'Clustering', flavor: 'Like finds like.', mech: 'The survey fills 60% faster.' },
    { id: 'bayesian', name: 'Bayesian Inference', flavor: 'Belief, updated by evidence.', mech: 'Each trial yields 80% more Insight.' },
    { id: 'ensembles', name: 'Ensembles', flavor: 'A crowd of guesses, wiser than any one.', mech: '+12% effective accuracy.' }
  ],
  utils: [
    { id: 'calibrate', name: 'Holdout Study', flavor: 'Set some truth aside, and check against it.', mech: 'Cuts the overfit gap by 30%.' },
    { id: 'sweep', name: 'Parameter Sweep', flavor: 'Try every dial, keep the best.', mech: 'A one-time push of raw accuracy.' },
    { id: 'distill', name: 'Ablation Study', flavor: 'Remove a piece; see what mattered.', mech: 'A grant of Insight, scaled by your Methods.' }
  ]
};
