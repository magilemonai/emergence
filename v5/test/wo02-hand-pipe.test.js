// Fable (Cody's first v5 note): the hand pipe must match the button. Pressing shows flow; a second after you stop, nothing.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
export async function run(t) {
  const sim = createSim({ cfg, eras: [origins], seed: 1, legacy: null }); const S = sim.state;
  const flow = () => { const e = S.edges.find(x => x.from === 'hand' && x.res === 'marks'); return e ? e.flow : 0; };
  for (let i = 0; i < 6; i++) { sim.apply({ type: 'inscribe' }); sim.tick(0.1); }
  t.ok(flow() > 0 && S.eras[1].handFlow > 0, 'pressing INSCRIBE puts flow in the hand pipe');
  sim.tick(0.1); const mid = S.eras[1].handFlow; t.ok(mid > 0 && mid < 6, 'the pipe fades once you stop');
  for (let i = 0; i < 10; i++) sim.tick(0.1);
  t.ok(S.eras[1].handFlow === 0 && flow() === 0, 'one second after the last press the pipe is empty (no particles, no tail)');
  sim.apply({ type: 'quarry' }); sim.tick(0.05); t.ok(S.eras[1].pickFlow > 0, 'the pick pipe answers a press the same way');
}
