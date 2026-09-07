// WO-12 acceptance: the receipt is generated from the run, five sections, plain and short.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import { receipt } from '../engine/receipt.js';
export async function run(t) {
  const sim = createSim({ cfg, eras: [origins], seed: 4, legacy: null }); const S = sim.state;
  for (let i = 0; i < 900; i++) { if (i % 3 === 0) sim.apply({ type: 'inscribe' }); sim.tick(0.1); }
  S.eras[5] = { emergedT: 1500, fb: { n: 30, rewarded: 20, penalized: 10, lapsed: 0, badRewards: 2 }, agentName: 'EKHO' }; S.eras[7] = { ending: 'symbiotic' };
  const R = receipt(S);
  t.ok(R && Array.isArray(R.sections) && R.sections.length === 5, 'five sections, one per era');
  t.ok(R.sections.every(s => typeof s.title === 'string' && typeof s.text === 'string' && s.text.split(/\s+/).length <= 60), 'each section ≤ 60 words');
  t.ok(R.sections.every(s => /\d/.test(s.stat || s.text)), 'each section carries a number from the run');
  t.ok(R.sections.every(s => !s.text.includes('—') && !/\bnot\s+[^,.]{1,40},\s*(but|it'?s)\b/i.test(s.text)), 'no em-dashes or contrastive constructions');
  t.ok(typeof R.markdown === 'string' && R.markdown.length > 200, 'a markdown rendering for download');
}
