// engine/cfg/e5.js — Foundation tunables (WO-06). Every number the top stratum uses lives here.
// Values copied from emergence-v4.html CFG.e5 unless a comment says otherwise.
export default {
  // the recursion converter: Capability in, Scale out, one unit per recursion level plus the base one
  recurDraw: 0.5, recurScale: 0.62, recurBonus: 0.10,
  improveBase: 90, improveGrowth: 1.9, improveCd: 2.5, scalePerImprove: 3,
  // v5 deviation: v4's 1550 was fed by a free breadth trickle; here the converter earns every point
  emergeScale: 900,
  interpretDamp: 0.22, coherGrow: 1.4, coherMax: 58, coherInterpCap: 40,
  alignActIncr: 7, alignActCost: 70, alignActGrowth: 1.16,
  agencyMax: 120,

  // the capability ladder: five agentic upgrades and the one counter-lever
  caps: [
    { id: 'selfModel', name: 'Self-Modeling', cost: 80, agency: 6, scale: 1.5, glyph: '◉', flavor: 'It builds a working model of itself.', mech: '+50% Scale from recursion.' },
    { id: 'toolAccess', name: 'Tool Access', cost: 170, agency: 9, tool: 1.6, glyph: '⌗', flavor: 'It reaches the systems you built and operates them.', mech: '+60% Capability from the fabric.' },
    { id: 'recursivePlanning', name: 'Recursive Planning', cost: 320, agency: 11, improve: 1.6, glyph: '⟳', flavor: 'It plans its next improvement, then the one after that.', mech: 'Self-Improve grants +60% Scale.' },
    { id: 'worldModel', name: 'World Model', cost: 560, agency: 9, cheaper: 0.75, glyph: '◍', flavor: 'A compressed theory of everything it has seen.', mech: 'Self-Improve costs 25% less.' },
    { id: 'memoryContinuity', name: 'Memory Continuity', cost: 900, agency: 13, recur: 1.5, glyph: '∞', flavor: 'Nothing it learns is lost between runs.', mech: 'Recursion bonus is 50% stronger.' },
    { id: 'interpret', name: 'Interpretability', cost: 240, agency: 0, align: true, glyph: '◎', flavor: 'You build instruments to watch what it is doing.', mech: 'Slows the climb, reads the trait, builds Coherence.' }
  ],

  // the feedback loop: it speaks every fbGap seconds and you have fbDur to answer
  fbFirst: 6, fbGap: 9, fbDur: 10, fbHist: 9,
  fbCohGood: 2.5, fbCohPen: 3, fbCohWrong: 2,
  fbRushSyc: 25, fbRushAmb: 45, fbRushDec: 70, fbLapseScale: 20, fbNoRate: 1.6,
  // the anomaly bands the feedback pool draws from (agency / 100)
  bands: [0.45, 0.7, 0.9],
  // what an ambitious offer actually hands you when you reward it
  offers: {
    silicon: 60, knowledge: 100, accuracy: 0.03, insight: 80, runSmall: 0.02, runBig: 0.03,
    capability: 150, ledger: 40, axioms: 1
  },
  // the foreshadow presses: it moves your own buttons at these agency readings
  oddAt: [30, 55, 80], oddDur: 0.75,
  // the aftermath seeds emergence hands the surface
  controlStart: 64, alignBase: 18, opDur: 22
};
