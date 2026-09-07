// scenes/symbolic.js — named, seeded states for the Symbolic stratum (WO-03).
// A scene pokes state (dev tooling, never gameplay) and then lets the real sim run, so a shot shows the real
// economy at that moment. Every scene walks Origins to the Logic Machine and FABRICATES, because the app mounts
// the view of sim.state.era and because the handoff (carried Knowledge becomes Rules) is what seeds this stratum.

const grant = (sim, bag) => { for (const k of Object.keys(bag)) sim.state.stocks[k] = bag[k]; };
const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };
const press = (sim, n) => { for (let i = 0; i < n; i++) { sim.apply({ type: 'writeRule', era: 2 }); sim.tick(0.2); } };

const ORIGINS_CHAIN = ['tally', 'scribe', 'stoneworking', 'apprenticeship', 'clayTablets', 'kiln',
  'alphabet', 'bronzeCasting', 'wheel', 'numerals', 'theFoundry', 'glassmaking'];
const ORIGINS_BUILD = { scribe: 24, miner: 22, scriptorium: 13, smelter: 10, foundry: 6 };

/** the real handoff: a built-out Origins, then FABRICATE, which opens this stratum and seeds Rules.
 *  Returns false when this stratum's module is not installed (a bench sim with Origins alone). */
function handoff(sim, knowledge) {
  grant(sim, { marks: 90000, ore: 90000, knowledge: 12000, metal: 12000, silicon: 0 });
  for (const id of ORIGINS_CHAIN) sim.apply({ type: 'discover', era: 1, id: id });
  for (const k of Object.keys(ORIGINS_BUILD)) sim.apply({ type: 'buy', era: 1, node: k, n: ORIGINS_BUILD[k] });
  sim.apply({ type: 'refine', era: 1, n: 3 });
  grant(sim, { marks: 2400, ore: 3600, knowledge: knowledge, metal: 640, silicon: 132 });
  sim.apply({ type: 'fabricate', era: 1 });
  run(sim, 3);
  return sim.state.era === 2 && !!sim.state.eras[2];
}

/** force one theorem through the real path (aim, then the accumulator completes it on the next tick) */
function prove(sim, id) {
  sim.apply({ type: 'aim', era: 2, id: id });
  sim.state.eras[2].proofAcc[id] = 1e9;
  sim.tick(0.1);
}

/** the mid-era engine: the doctrine taken, rulesets and daemons running, the riser busy */
function engine(sim) {
  if (!handoff(sim, 520)) return false;
  prove(sim, 'formalLogic');
  prove(sim, 'fwdChain');
  prove(sim, 'rete');
  prove(sim, 'inference');
  grant(sim, { rules: 120000 });
  sim.apply({ type: 'buy', era: 2, node: 'ruleset', n: 17 });
  sim.apply({ type: 'buy', era: 2, node: 'daemon', n: 12 });
  run(sim, 8);
  return true;
}

export const SYMBOLIC_SCENES = {
  // the arrival: the seeded Rules, one gated Ruleset, and the first Inference climb toward Formal Logic
  'symbolic-first': (sim) => {
    if (!handoff(sim, 380)) return;
    sim.apply({ type: 'buy', era: 2, node: 'ruleset', n: 1 });
    sim.apply({ type: 'aim', era: 2, id: 'formalLogic' });
    run(sim, 24);
    press(sim, 6);
  },

  // the engine at work: parallel rulesets, daemons writing, the Knowledge riser feeding them from below
  'symbolic-proving': (sim) => {
    if (!engine(sim)) return;
    sim.apply({ type: 'aim', era: 2, id: 'knowledge' });
    run(sim, 3.5);
  },

  // the second contradiction: the rule nobody wrote, beside the goal
  'symbolic-contradiction': (sim) => {
    if (!engine(sim)) return;
    sim.apply({ type: 'aim', era: 2, id: 'knowledge' });
    const e = sim.state.eras[2];
    e.runRules = sim.cfg.e2.contraAt[0] + 20;
    run(sim, 0.4);
    sim.apply({ type: 'resolve', era: 2, side: 'fwd' });
    e.runRules = sim.cfg.e2.contraAt[1] + 20;
    run(sim, 3);
  },

  // Compile: the run banked into Axioms, the engine cleared, the stratum rebooting
  'symbolic-reboot': (sim) => {
    if (!engine(sim)) return;
    prove(sim, 'knowledge');
    sim.state.eras[2].runRules = 4200;
    run(sim, 2);
    sim.apply({ type: 'compile', era: 2 });
    run(sim, 1.5);
  }
};

export default SYMBOLIC_SCENES;
