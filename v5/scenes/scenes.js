// scenes/scenes.js — named, seeded states for the screenshot tool and the dev bench.
// A scene pokes the state directly (it is dev tooling, never gameplay) and then lets the real sim run,
// so what a shot shows is the real economy at that moment. Each era work order adds its own scenes.

const grant = (sim, bag) => { for (const k of Object.keys(bag)) sim.state.stocks[k] = bag[k]; };
const disco = (sim, ids) => { for (const id of ids) sim.apply({ type: 'discover', era: 1, id: id }); };
const build = (sim, bag) => { for (const k of Object.keys(bag)) sim.apply({ type: 'buy', era: 1, node: k, n: bag[k] }); };
const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };
const press = (sim, type, times) => { for (let i = 0; i < times; i++) { sim.apply({ type: type, era: 1 }); sim.tick(0.1); } };

/** the whole Origins research chain, in the order its prerequisites open */
const ALL_DISCO = ['tally', 'scribe', 'stoneworking', 'apprenticeship', 'clayTablets', 'kiln',
  'alphabet', 'bronzeCasting', 'wheel', 'numerals', 'theFoundry', 'glassmaking'];

/** the Bronze-Age board: both lanes running, the Forge just opened */
function bronze(sim) {
  grant(sim, { marks: 4000, ore: 4000, knowledge: 900, metal: 0, silicon: 0 });
  disco(sim, ['tally', 'scribe', 'stoneworking', 'apprenticeship', 'clayTablets', 'kiln']);
  build(sim, { scribe: 12, miner: 11, scriptorium: 5, smelter: 4 });
  grant(sim, { marks: 260, ore: 420, knowledge: 140, metal: 38 });
  run(sim, 25);
}

export const SCENES = {
  // the cold open: one bank, one verb, and the first marks growing the first pipe
  'origins-boot': (sim) => { press(sim, 'inscribe', 4); },

  'origins-bronze': bronze,

  // the research drawer open on the Bronze-Age board (a bench scene: the drawer is a view, not a state)
  'origins-research': (sim) => { bronze(sim); },

  // zoomed out: bedrock alone, silhouetted, its particles still moving
  'origins-overview': bronze,

  // the caravan is at the door: the timed card sits beside the goal, still affordable
  'origins-commission': (sim) => {
    bronze(sim);
    sim.state.eras[1].commCool = 0;
    for (let i = 0; i < 200 && !sim.state.eras[1].comm; i++) sim.tick(0.1);
    grant(sim, { marks: 420 });
    run(sim, 6);
  },

  // the Silicon Age, one press from the Logic Machine
  'origins-ready': (sim) => {
    grant(sim, { marks: 60000, ore: 60000, knowledge: 9000, metal: 9000, silicon: 0 });
    disco(sim, ALL_DISCO);
    build(sim, { scribe: 26, miner: 24, scriptorium: 14, smelter: 11, foundry: 6 });
    sim.apply({ type: 'refine', era: 1, n: 4 });
    grant(sim, { marks: 1900, ore: 3100, knowledge: 620, metal: 480, silicon: 118 });
    run(sim, 12);
  }
};

export default SCENES;
