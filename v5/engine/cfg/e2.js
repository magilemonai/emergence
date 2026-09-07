// engine/cfg/e2.js — Symbolic tunables. Copied from emergence-v4.html CFG.e2, plus the numbers v5 needs to
// make every flow a pipe (the ruleset eats Rules, the riser draws Origins Knowledge, the proof sink drains
// the Inference bank). Nothing else in this stratum may inline a number.
export default {
  clickBase: 1,
  rulesetCost: 10, rulesetGrowth: 1.16, rulesetYield: 0.42,
  daemonCost: 320, daemonGrowth: 1.19, daemonRate: 2.0,
  axiomDivisor: 200, axiomBonus: 0.05, infPerRuleset: 1.3, infScale: 0.12, clickProof: 0.6,
  lemmaBase: 55, lemmaGrowth: 1.72, lemmaBonus: 0.075,
  infCapBase: 120, infCapStep: 220, capLemmaBase: 80, capLemmaGrowth: 1.6,
  contraAt: [3000, 12000, 30000], contraSlow: 0.6, contraBonus: 0.06,
  seedFromKnowledge: 1,
  oddRule: 4471,

  // v5: a ruleset is a converter, so its fuel and its reach-back are real ports
  rulesPerRuleset: 0.6,        // Rules burned per Ruleset per second
  knowledgePerRuleset: 0.05,   // the live trickle up the riser from Origins (dense enough to read as particles)
  // the proof sink pulls the Inference bank down with this time constant; it is longer than tickMax,
  // so the sink can never demand more than the bank holds (no false starve on the pipe mouth)
  proofTau: 0.6,

  theoremSlots: 3,             // one row of tiles clears the terminal above and the stratum floor below
  milestones: [10, 25, 50, 100], milestoneBonus: 0.25,
  buyModes: [1, 10, 25],

  // the terminal: how many lines it holds and how often the engine narrates a derivation
  termLines: 3, termGap: 2.4, termJitter: 0.3, termCycle: 7,

  // stats() multipliers, v4 parity
  techMult: { formalLogic: 1.5, fwdChain: 1.8, bwdChain: 3, rete: 0.03, heuristics: 0.08, metalogic: 1.5 },

  // the path the goal column checks off
  path: ['formalLogic', 'inference', 'knowledge', 'metalogic', 'expert'],

  tree: [
    { id: 'formalLogic', name: 'Formal Logic', cost: 650, req: [], desc: '+50% rule production. Parallel Rulesets.' },
    { id: 'fwdChain', name: 'Forward Chaining', cost: 1400, req: ['formalLogic'], excl: 'bwdChain', desc: 'DOCTRINE · Rulesets +80%. Closes Backward.' },
    { id: 'bwdChain', name: 'Backward Chaining', cost: 1400, req: ['formalLogic'], excl: 'fwdChain', desc: 'DOCTRINE · Written rules ×3. Closes Forward.' },
    { id: 'rete', name: 'Rete Network', cost: 3200, req: ['fwdChain'], desc: 'Each Ruleset boosts every other, +3%.' },
    { id: 'inference', name: 'Inference Engine', cost: 4600, req: [], reqAny: ['fwdChain', 'bwdChain'], desc: 'Unlocks Daemons. They write rules for you.' },
    { id: 'heuristics', name: 'Heuristic Search', cost: 3200, req: ['bwdChain'], desc: 'Writing scales +8% per Ruleset owned.' },
    { id: 'knowledge', name: 'Knowledge Base', cost: 8500, req: ['inference'], reqAny: ['rete', 'heuristics'], desc: 'Unlocks Compile. Bank a run into Axioms.' },
    { id: 'metalogic', name: 'Meta-Logic', cost: 16000, req: ['knowledge'], desc: 'Every Axiom becomes 50% stronger.' },
    { id: 'expert', name: 'Expert System', cost: 30000, req: ['metalogic'], reqAxioms: 5, desc: 'Ends the stratum. It reasons on its own.' }
  ]
};
