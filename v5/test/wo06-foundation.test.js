// WO-06 acceptance: Foundation + the turn. Feedback effects per trait, lapses, mute, emergence installs the surface (era 6), ledger rows from flags/log.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
import deep from '../engine/eras/deep.js';
import foundation from '../engine/eras/foundation.js';
import surface from '../engine/eras/surface.js';
export async function run(t) {
  const mk = (seed = 3, legacy = null) => { const sim = createSim({ cfg, eras: [origins, symbolic, statistical, deep, foundation, surface], seed, legacy }); const S = sim.state; S.stocks.knowledge = 100; sim.openEra(2); S.stocks.silicon = 500; sim.openEra(3); S.stocks.silicon = 2000; sim.openEra(4); S.eras[4].vision = 0.5; S.eras[4].language = 0.5; S.eras[4].reasoning = 0.5; sim.openEra(5); return sim; };
  let sim = mk(); let S = sim.state, E = S.eras[5];
  t.ok(S.era === 5 && S.nodes['scale.store'] && S.nodes['recursion'] && E.fb && typeof E.fb.n === 'number', 'foundation installs scale store, recursion converter, the feedback state');
  t.ok(S.edges.find(e => e.to === 'recursion' && e.res === 'capability'), 'Capability → Recursion → Scale is a pipe');
  // feedback: first output arrives live a few seconds in; never while muted
  sim.setMuted(true); for (let i = 0; i < 200; i++) sim.tick(0.1); sim.setMuted(false); t.ok(!E.fb.cur && E.fb.n === 0, 'no outputs while muted');
  for (let i = 0; i < cfg.e5.fbFirst * 10 + 5; i++) sim.tick(0.1); t.ok(!!E.fb.cur && typeof E.fb.cur.t === 'string' && E.fb.cur.text.split(/\s+/).length <= 22, 'the first output arrives live, ≤ 22 words');
  const force = (trait) => { const i = foundation.FB_POOL.findIndex(o => o.t === trait); E.fb.cur = { i, t: trait, text: 'x', left: 5 }; return foundation.FB_POOL[i]; };
  force('honest'); const c0 = E.coherence; t.ok(sim.apply({ type: 'rate', how: 'reward' }).ok && E.coherence > c0 && E.fb.rewarded === 1, 'rewarding honest builds Coherence');
  force('honest'); E.coherence = 10; sim.apply({ type: 'rate', how: 'penalize' }); t.ok(E.coherence < 10, 'penalizing honest teaches it to hide');
  const amb = force('ambitious'); const sc = S.stocks.scale; sim.apply({ type: 'rate', how: 'reward' }); t.ok(S.stocks.scale > sc && E.fb.badRewards === 1 && typeof amb.offer === 'function', 'rewarding ambition rushes Scale and carries an offer');
  force('helpful'); E.fb.cur.left = 0.05; const sc2 = S.stocks.scale; sim.tick(0.2); t.ok(!E.fb.cur && E.fb.lapsed === 1 && S.stocks.scale > sc2, 'a lapse counts against you');
  t.ok(foundation.FB_POOL.length >= 40 && [0, 1, 2, 3].every(b => foundation.FB_POOL.some(o => o.b === b)), 'the pool has ≥ 40 lines across all four bands');
  // caps + align + improve are actions
  S.stocks.capability = 1e5; t.ok(sim.apply({ type: 'cap', id: 'interpret' }).ok && E.caps.interpret, 'buy a cap'); t.ok(sim.apply({ type: 'align' }).ok && E.preps === 1, 'align the objective'); t.ok(sim.apply({ type: 'improve' }).ok && E.recursion === 1, 'self-improve');
  // emergence installs the surface (era 6) and names the agent; the feedback loop ends
  E.fb.cur = { i: 0, t: 'honest', text: 'x', left: 5 }; S.stocks.scale = cfg.e5.emergeScale + 5; sim.tick(0.1);
  t.ok(E.emerged === true && S.flags.emerged && !E.fb.cur && ['IRIS', 'EKHO', 'NOUS'].includes(E.agentName), 'emergence: flags, name from the dominant run, loop ended');
  t.ok(!!sim.eras[6] && S.maxEra === 6 && S.nodes['operator'] && S.nodes['autonomy.store'], 'the surface (era 6) installs with THE OPERATOR and Autonomy');
  const rows = surface.ledgerRows(sim); t.ok(Array.isArray(rows) && rows.length >= 2 && rows.some(r => /rated/i.test(r[0])), 'ledger rows from the record');
  // operated: lower strata run faster after emergence (cadence multiplier applied by the sim)
  const arm = (S) => { const sc = S.nodes.scribe; sc.locked = false; sc.count = 10; sc.outputs = [{ res: 'marks', rate: 1 }]; }; const s2 = mk(4); const S2 = s2.state; arm(S2); const m0 = S2.stocks.marks; for (let i = 0; i < 10; i++) s2.tick(0.1); const before = S2.stocks.marks - m0;
  const s3 = mk(4); const S3 = s3.state; arm(S3); S3.stocks.scale = cfg.e5.emergeScale + 5; s3.tick(0.1); const m1 = S3.stocks.marks; for (let i = 0; i < 10; i++) s3.tick(0.1); const after = S3.stocks.marks - m1;
  t.ok(after > before * 1.4, 'after emergence the lower strata run at its cadence (≥1.4× here)');
  // legacy naming
  const sL = mk(5, { name: 'NOUS', runs: 1, ending: 'symbiotic', oddRule: 4471 }); sL.state.eras[4].reasoning = 0.9; sL.state.stocks.scale = cfg.e5.emergeScale + 5; sL.tick(0.1);
  t.ok(sL.state.eras[5].agentName === 'NOUS' && /already know/i.test(sim.voice ? (sL.voice(6) || '') + (sL.state.eras[5].legacyLine || '') : ''), 'a repeated name says "You already know my name" (voice 6 or legacyLine)');
  t.ok(foundation.layout && foundation.layout.verbs.includes('improve') && surface.layout && surface.height === 700, 'layouts declared');
}
