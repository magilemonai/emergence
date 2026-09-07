// engine/cfg/e4.js — Deep tunables (WO-05). Every number the Deep stratum uses lives here.
// Values copied verbatim from emergence-v4.html CFG.e4 unless a line says otherwise.
export default {
  // the fabric: compute nodes bought in Silicon, compute routed by the mixer, Capability banked from breadth
  nodeCost: 45, nodeGrowth: 1.21, nodeCompute: 0.7,
  capGain: 0.00125, capRate: 0.9, chainPerFoundry: 0.03, breadthGate: 0.78,
  allocMin: 0.05, driftFreq: 0.16, driftDemand: 0.55, driftBite: 0.0045,
  feedstock: { vision: 'data', reasoning: 'insight', language: 'knowledge' }, feedPerShare: 0.35,
  heatRise: 22, heatBase: 0.4, cooling: 2.2, heatWarn: 44, heatThrottle: 70, throttleWarm: 0.9, throttleHot: 0.72,
  eventGap: 26, eventDur: 13, eventWarn: 3, shiftDrop: 0.03, shiftDemand: 1.8, breakthroughMult: 2.2, momentumAfter: 6,
  stabilizerCost: 140, stabilizerStep: 60, stabilizerCut: 0.13, stabilizerMax: 5, lockCost: 90, lockGrowth: 1.35, lockDur: 28,
  arch: { attention: 260, convolution: 220, cot: 340, moe: 300, checkpoint: 380, distill: 300 },
  attentionDrift: 0.65, attentionFeed: 0.7, convFeed: 0.5, convGain: 1.2, cotCouple: 0.35, moeHeat: 0.6,
  restoreCost: 120, restoreGrowth: 1.3, restoreCd: 40, distillCost: 40, distillCd: 10, distillTake: 0.08, distillGive: 0.06,
  fedBonus: 0.15, fedHorizon: 20,
  domains: [{ k: 'vision', label: 'Vision' }, { k: 'language', label: 'Language' }, { k: 'reasoning', label: 'Reasoning' }],
  // the supply bus: a build-here buy of a real node on a lower stratum, priced in Silicon
  supply: [
    { key: 'foundry', era: 1, node: 'foundry', name: 'Foundry', out: 'silicon', cost: 60, growth: 1.20, glyph: '⚗', tip: '<b>Foundry</b><br><i>Metal and knowledge, fused into Silicon.</i><br>Builds a real Origins Foundry from here. Each one also lifts Capability +3%. Paid in Silicon.' },
    { key: 'dataset', era: 3, node: 'dataset', name: 'Dataset', out: 'data', cost: 30, growth: 1.16, glyph: '◉', tip: '<b>Dataset</b><br><i>Observations, curated.</i><br>Builds a real Statistical Dataset. Feeds the Vision run. Paid in Silicon.' },
    { key: 'model', era: 3, node: 'model', name: 'Fit Engine', out: 'insight', cost: 90, growth: 1.20, glyph: '✧', tip: '<b>Fit Engine</b><br><i>Experiments distilled into ideas.</i><br>Builds a real Statistical Fit Engine. Feeds the Reasoning run. Paid in Silicon.' },
    { key: 'scriptorium', era: 1, node: 'scriptorium', name: 'Scriptorium', out: 'knowledge', cost: 45, growth: 1.19, glyph: '≡', tip: '<b>Scriptorium</b><br><i>Marks made meaningful.</i><br>Builds a real Origins Scriptorium and the scribes and miners that keep it fed. Feeds the Language run. Paid in Silicon.' }
  ],
  // a staffed scriptorium: enough hands to cover its own draw, and never fewer than this many
  staffScribes: 3, staffMiners: 2, staffHeadroom: 1.1,
  // the crafts the Hold lever pauses: they burn the same Knowledge the Language run drinks
  holdNodes: [{ era: 1, node: 'smelter' }, { era: 1, node: 'foundry' }],
  // the architecture tree: seven upgrades, each one bends the steering geometry
  archTree: [
    { id: 'stabilizer', name: 'Stabilizer', glyph: '≋', col: '#6ea8ff', repeat: true, eff: '−13% drift · all runs', tip: '<i>A calmer optimization landscape.</i><br>Permanently reduces how hard the drift bites every run. Stacks up to 5.' },
    { id: 'attention', name: 'Attention', glyph: '⌖', col: '#b58cff', eff: 'Language drift −35% · draw −30%', tip: '<i>Learn what to look at.</i><br>The Language run stops fighting the wind so hard and drinks less Knowledge per share.' },
    { id: 'convolution', name: 'Convolution', glyph: '▦', col: '#54d2ff', eff: 'Vision draw −50% · gain +20%', tip: '<i>See locally, everywhere at once.</i><br>Vision needs half the Data per share and learns faster.' },
    { id: 'cot', name: 'Chain of Thought', glyph: '⛓', col: '#6fe6a8', eff: 'Reasoning +35% × Language', tip: '<i>Think in words before answering.</i><br>The higher Language sits, the faster Reasoning climbs. Couples the runs.' },
    { id: 'moe', name: 'Mixture of Experts', glyph: '⊞', col: '#a9cfff', eff: 'Heat rises 40% slower', tip: '<i>Route each problem to a specialist.</i><br>Concentrating compute heats the fabric less, so you can hammer a run longer.' },
    { id: 'checkpoint', name: 'Checkpointing', glyph: '⎘', col: '#82ffc8', eff: 'CHECKPOINT + RESTORE', tip: '<i>Save the weights.</i><br>Snapshot all three runs; after a squall, RESTORE them. It never lowers a run.' },
    { id: 'distill', name: 'Distillation', glyph: '⇄', col: '#ffb15c', eff: 'DISTILL: peak run → lagging run', tip: '<i>Teach the small model what the big one knows.</i><br>Moves capability from your highest run to your lowest. Lossy, and usually right.' }
  ],
  // v4 parity: count milestones on the compute node (the shared incremental staple)
  milestones: [10, 25, 50, 100], milestoneBonus: 0.25,
  // the one line it should not know
  oddBreadth: 0.6, oddDur: 9,
  seedNodes: 4, seedSilicon: 600, seedData: 200, seedInsight: 150, seedKnowledge: 150,
  seedFoundry: 2, seedScriptorium: 2, seedDataset: 3, seedModel: 2
};
