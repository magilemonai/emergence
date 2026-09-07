// WO-12 unit tests: the receipt reads the log honestly, survives a partial run, and the scene that shows it
// seeds a real one. (The DOM view is verified by node v5/tools/shoot.js receipt.)
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import { receipt, tally } from '../engine/receipt.js';
import RECEIPT_SCENES from '../scenes/receipt.js';

export async function run(t) {
  /* a state the run never touched: five sections, zeros, no throw */
  const empty = receipt({});
  t.ok(empty.sections.length === 5 && empty.sections.every(s => /\d/.test(s.stat)), 'an empty state still reads five sections with numbers');
  t.ok(empty.markdown.split('\n## ').length === 6, 'the markdown carries one heading per stratum');

  /* era attribution: an action carries its own era, a buy borrows its node's, the rest come from the type table */
  const fake = {
    t: 1200, nodes: { foundry: { era: 1, count: 4 } }, stocks: {}, eras: {},
    log: [{ type: 'inscribe', t: 5 }, { type: 'buy', node: 'foundry', t: 200 }, { type: 'writeRule', t: 400 },
      { type: 'trial', t: 700 }, { type: 'alloc', t: 900 }, { type: 'rate', era: 5, t: 1100 }]
  };
  const T = tally(fake);
  t.eq([T.starts[1], T.starts[2], T.starts[3], T.starts[4], T.starts[5]], [5, 400, 700, 900, 1100], 'each stratum starts at its first action');
  t.near(T.span[1], 395, 1e-9, 'Origins runs from its first action to the first Symbolic one');
  t.near(T.span[5], 100, 1e-9, 'the last stratum runs to the end of the clock');
  const R = receipt(fake);
  t.ok(/^6\.6 min/.test(R.sections[0].stat) && /^5\.0 min/.test(R.sections[1].stat), 'minutes come from the log timestamps');
  t.ok(/4 foundries/.test(R.sections[0].stat), 'a stat reads a node count from the state');

  /* the run's own numbers reach the text, not just the stat line */
  const full = receipt({
    t: 2200, stocks: { axioms: 40 }, nodes: { node: { era: 4, count: 16 } },
    eras: {
      1: { disco: { tally: true, kiln: true } }, 2: { tech: { formalLogic: true, resolution: true } },
      3: { accuracy: 0.89, methods: { regression: true }, shifts: 2, trials: 240 },
      4: { vision: 0.8, language: 0.8, reasoning: 0.8, arch: { attention: true }, stabilizer: 2 },
      5: { fb: { n: 34, rewarded: 21, penalized: 10, lapsed: 3, badRewards: 4 }, agentName: 'EKHO', emergedT: 1955 },
      7: { ending: 'symbiotic' }
    },
    log: [{ type: 'inscribe', t: 4 }, { type: 'writeRule', t: 380 }, { type: 'trial', t: 760 }, { type: 'alloc', t: 1150 }, { type: 'rate', era: 5, t: 1660 }]
  });
  t.ok(/89%/.test(full.sections[2].stat) && /survived 2 distribution shifts/.test(full.sections[2].text), 'Statistical reports the run accuracy and its shifts');
  t.ok(/16 compute nodes/.test(full.sections[3].text) && /80% breadth/.test(full.sections[3].stat), 'Deep reports nodes and breadth');
  t.ok(/rated 34 outputs/.test(full.sections[4].text) && /4 of those rewards/.test(full.sections[4].text), 'Foundation reports the feedback record');
  t.ok(/ending symbiotic/.test(full.sections[4].stat) && full.run.agent === 'EKHO', 'the ending and the agent name reach the page');
  t.ok(full.sections.every(s => s.text.trim().split(/\s+/).length <= 60 && !/—/.test(s.text + s.stat)), 'every text stays inside 60 words with no em-dash');
  t.ok(full.sections.every(s => !/\bnot\s+[^,.]{1,40},\s*(but|it'?s)\b/i.test(s.text)), 'no contrastive constructions');
  t.ok(/EKHO/.test(full.markdown) && /36\.7 min/.test(full.markdown), 'the markdown header carries the run');

  /* the scene seeds a run the page can read (no DOM here: showPage is a no-op without window) */
  const sim = createSim({ cfg: cfg, eras: [origins], seed: 7, legacy: null });
  RECEIPT_SCENES.receipt(sim);
  const S = receipt(sim.state);
  t.ok(sim.state.t > 2000 && S.sections[0].stat.indexOf('12 discoveries') > 0, 'the scene plays a finished Origins');
  t.ok(+S.run.minutes > 30 && S.run.ending === 'symbiotic', 'the scene resolves to a finished run of a plausible length');
  t.ok(S.sections.every(s => /\d/.test(s.stat) && s.text.trim().split(/\s+/).length <= 60), 'the scene run still fits the budget');
}
