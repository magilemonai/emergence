// WO-08 acceptance (pure half): engine/film.js — frames(log, seed, n, eras, cfg) and firstMinute(log).
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import { frames, firstMinute } from '../engine/film.js';
export async function run(t) {
  const sim = createSim({ cfg, eras: [origins], seed: 21, legacy: null }); const S = sim.state;
  for (let i = 0; i < 1500; i++) { if (i % 3 === 0) sim.apply({ type: 'inscribe' }); const av = sim.available(); const d = av.find(a => a.type === 'discover'); if (d && i % 40 === 0) sim.apply(d); const b = av.find(a => a.type === 'buy' && a.node === 'scribe'); if (b && i % 25 === 0) sim.apply(b); sim.tick(0.1); }
  const fr = frames(S.log, 21, 24, { eras: [origins], cfg, end: S.t });   // the log alone cannot know where the run ended
  t.ok(Array.isArray(fr) && fr.length === 24, 'frames: returns exactly n snapshots');
  t.ok(fr.every((f, i) => i === 0 || f.t >= fr[i - 1].t), 'frames: time is monotonic');
  t.ok(fr[fr.length - 1].t <= S.t + 1e-6 && fr[0].t >= 0, 'frames: spans the run from 0 to its end');
  t.ok(fr.every(f => f.nodes && f.stocks && f.edges), 'frames: each snapshot carries nodes, stocks and edges (what the film draws)');
  const last = fr[fr.length - 1]; t.ok(Math.abs((last.stocks.marks || 0) - S.stocks.marks) < 1e-6, 'frames: the last snapshot equals the live state (replay exactness)');
  const fm = firstMinute(S.log); t.ok(Array.isArray(fm) && fm.length > 0 && fm.every(a => a.t <= 60), 'firstMinute: only actions from the first 60 seconds');
  t.ok(fm.every(a => typeof a.type === 'string' && typeof a.t === 'number'), 'firstMinute: each entry keeps type + t (the ghost cursor needs both)');
  // chunked precompute: a scheduler callback never runs a chunk over 16ms of work at 288 frames (timing proxy in node)
  const t0 = process.hrtime.bigint(); frames(S.log, 21, 288, { eras: [origins], cfg, chunk: 16, end: S.t }); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  t.log('288 frames precompute: ' + ms.toFixed(0) + 'ms total'); t.ok(ms < 4000, 'frames: 288 snapshots precompute under 4s in node (chunkable on the main thread)');
}
