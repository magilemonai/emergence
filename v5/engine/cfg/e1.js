// engine/cfg/e1.js — Origins tunables (WO-02). Every number Origins uses lives here.
export default {
    inscribeBase: 1, quarryBase: 1,
    scribeCost: 12, scribeGrowth: 1.16, scribeYield: 0.9,
    minerCost: 16, minerGrowth: 1.16, minerYield: 0.9,
    scriptoriumCost: 45, scriptoriumGrowth: 1.19, scriptoriumRate: 1.1,
    smelterCost: 55, smelterGrowth: 1.19, smelterRate: 1.3,
    foundryCost: 350, foundryGrowth: 1.2, foundryRate: 0.8,
    scriptoriumUpkeep: 0.35, smelterUpkeep: 0.25,
    siliconGate: 120,
    refineBase: 120, refineGrowth: 1.28, refineBonus: 0.05,
    leverSwing: 0.8, leverFloor: 0.6,
    // ask = max(base, gross rate × commMult seconds); a converter's gross counts at commCapHalf (v4 parity)
    commDur: 75, commCool: 18, commBonus: 0.05, commMult: 28, commCapHalf: 0.5,
    milestones: [10, 25, 50, 100], milestoneBonus: 0.25,
    buyModes: [1, 10, 25],
    // your hand is a real pipe: a click pushes flow into the store, and it fades when you stop
    handPulse: 1, handTau: 0.2, handFloor: 0.15, handCap: 4,   // the hand pipe matches the button: a press fades out within ~0.4s, a burst within ~0.7s
    mult: { tally: 2, apprentice: 1.5, alphabet: 1.6, bronze: 1.6, wheelMiner: 1.8, wheelScribe: 0.8, numerals: 1.3, glass: 1.5 },
    comms: [
      { id: 'tablets', name: 'The temple asks for tablets', res: 'marks', base: 150, reward: 'rec', flavor: 'A season of prayers, recorded.' },
      { id: 'roads', name: 'The road needs stone', res: 'ore', base: 150, reward: 'forge', flavor: 'Cart after cart, to somewhere new.' },
      { id: 'bronze', name: 'The forge-lord wants metal', res: 'metal', base: 60, reward: 'rec', flavor: 'Weapons or plowshares; he pays either way.' },
      { id: 'archive', name: 'The archive buys what you know', res: 'knowledge', base: 90, reward: 'free', flavor: 'They copy your marks into their own.' }
    ],
    disco: [
      { id: 'tally', name: 'Tally Marks', res: 'marks', cost: 6, req: [], flavor: 'A notch for each thing worth counting.', mech: 'Inscribing by hand is twice as productive.' },
      { id: 'scribe', name: 'The Scribe', res: 'marks', cost: 20, req: ['tally'], flavor: 'Hands trained to the work.', mech: '+Marks · unlocks the Scribe.' },
      { id: 'stoneworking', name: 'Stoneworking', res: 'marks', cost: 38, req: ['tally'], flavor: 'The first deliberate reshaping of the world.', mech: '+Ore · unlocks Quarry and Miners.' },
      { id: 'apprenticeship', name: 'Apprenticeship', costs: { marks: 277, ore: 315 }, req: ['scribe', 'stoneworking'], flavor: 'A craft taught, not stumbled into.', mech: 'Scribes and Miners +50%.' },
      { id: 'clayTablets', name: 'Clay Tablets', res: 'marks', cost: 110, req: ['scribe', 'stoneworking'], reqRes: { ore: 15 }, flavor: 'Something firmer than memory.', mech: '+Knowledge · unlocks the Scriptorium.' },
      { id: 'kiln', name: 'The Kiln', res: 'ore', cost: 110, req: ['clayTablets'], reqRes: { knowledge: 30 }, flavor: 'Captured fire.', mech: '+Metal · unlocks the Smelter. Bronze Age.' },
      { id: 'alphabet', name: 'The Alphabet', res: 'knowledge', cost: 120, req: ['clayTablets'], flavor: 'Signs that can spell anything.', mech: 'Scriptoria +60%.' },
      { id: 'bronzeCasting', name: 'Bronze Casting', res: 'metal', cost: 90, req: ['kiln'], flavor: 'Let the mold decide its shape.', mech: 'Smelters +60%.' },
      { id: 'wheel', name: 'The Wheel', res: 'ore', cost: 130, req: ['kiln'], flavor: 'The load that once broke backs now rolls.', mech: 'Miners +80% Ore · Scribes 20% slower.' },
      { id: 'numerals', name: 'Numerals', res: 'knowledge', cost: 520, req: ['alphabet'], flavor: 'Number slips free of what it counts.', mech: 'Every converter +30%.' },
      { id: 'theFoundry', name: 'The Foundry', res: 'knowledge', cost: 780, req: ['numerals'], reqRes: { metal: 230 }, flavor: 'Knowledge and matter, fused.', mech: '+Silicon · unlocks the Foundry. Silicon Age.' },
      { id: 'glassmaking', name: 'Glassmaking', res: 'metal', cost: 430, req: ['theFoundry'], flavor: 'Sand taught to hold the light.', mech: 'Foundries +50%.' }
    ]
};
