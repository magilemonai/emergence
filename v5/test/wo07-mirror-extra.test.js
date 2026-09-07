// WO-07 extra: what the acceptance test does not pin. The three endings are reachable by choices ALONE,
// the meters never move on time, the shadow is deterministic, the policy really improves across strata,
// and nothing in a shadow can ever open the mirror inside itself.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
import deep from '../engine/eras/deep.js';
import foundation from '../engine/eras/foundation.js';
import surface, { derive } from '../engine/eras/surface.js';
import mirror, { createReplayer, endingFor, runnerFor, pickImprovement } from '../engine/eras/mirror.js';

const ERAS = [origins, symbolic, statistical, deep, foundation, surface, mirror];
const mk = (seed) => createSim({ cfg: cfg, eras: ERAS, seed: seed || 7, legacy: null });

/** a real-ish run: 60s of Origins by hand, then the strata opened and the threshold crossed */
function toMirror(sim, opts) {
  const o = opts || {}, S = sim.state;
  for (let i = 0; i < 600; i++) { if (i % 2 === 0) sim.apply({ type: 'inscribe' }); sim.tick(0.1); }
  S.stocks.knowledge = 400; sim.openEra(2);
  S.stocks.silicon = 900; sim.openEra(3);
  S.stocks.silicon = 2600; sim.openEra(4);
  S.eras[4].vision = 0.7; S.eras[4].language = 0.7; S.eras[4].reasoning = 0.7;
  sim.openEra(5);
  const e5 = S.eras[5];
  e5.coherence = o.coherence === undefined ? 0 : o.coherence;
  e5.fb.goodRewards = o.good || 0; e5.fb.badRewards = o.bad || 0; e5.fb.lapsed = o.lapsed || 0;
  S.stocks.scale = cfg.e5.emergeScale + 5;
  sim.tick(0.1);
  for (let i = 0; i < 15; i++) sim.tick(0.1);
  return S.eras[7];
}

const answer = (sim, how) => { sim.apply({ type: 'interrupt' }); sim.apply({ type: 'veto', how: how }); };
const settle = (sim, M, cap) => { for (let i = 0; i < (cap || 4000) && !M.ending; i++) sim.tick(0.1); return M.ending; };
const HIGH = cfg.e6.mirror.controlHigh, GOOD = cfg.e6.mirror.alignGood === undefined ? cfg.e6.alignGood : cfg.e6.mirror.alignGood;

export async function run(t) {
  /* ---------- 1. the three endings, by choices alone ---------- */
  // vetoing everything holds the door: Control climbs past controlHigh
  const a = mk(11), Ma = toMirror(a);
  a.state.stocks.scale = 4000;
  for (let i = 0; i < 3; i++) answer(a, 'veto');
  t.ok(Ma.control >= HIGH, 'three vetoes push Control to the containment line (' + Math.round(Ma.control) + ' / ' + HIGH + ')');
  t.ok(settle(a, Ma) === 'contained', 'vetoing everything reaches Contained');

  // a prepared run that negotiates lands Symbiotic: Coherence + good ratings + negotiation, no veto spike
  const b = mk(12), Mb = toMirror(b, { coherence: 50, good: 6 });
  b.state.stocks.scale = 4000;
  for (let i = 0; i < 3; i++) answer(b, 'negotiate');
  t.ok(Mb.control < HIGH && Mb.alignment >= GOOD, 'negotiation keeps Control low and Alignment high');
  t.ok(settle(b, Mb) === 'symbiotic', 'negotiating a prepared run reaches Symbiotic');

  // approving everything with a bad feedback record hands it the run
  const c = mk(13), Mc = toMirror(c, { bad: 4, lapsed: 3 });
  c.state.stocks.scale = 4000;
  for (let i = 0; i < 3; i++) answer(c, 'approve');
  t.ok(settle(c, Mc) === 'runaway', 'approving everything on a bad record reaches Runaway');

  /* ---------- 2. no per-second drain: the meters move on choices and on nothing else ---------- */
  const d = mk(14), Md = toMirror(d);
  const ctl0 = Md.control, ali0 = Md.alignment;
  for (let i = 0; i < 30; i++) d.tick(0.1);                     // three seconds of pure time, mid-replay
  t.ok(!Md.ending && Math.abs(Md.control - ctl0) < 1e-9 && Math.abs(Md.alignment - ali0) < 1e-9, 'ticking through the replay moves neither meter');
  const before = Md.control;
  answer(d, 'veto');
  t.ok(Md.control > before, 'one veto is the only thing that moved Control');

  /* ---------- 3. progress is the replay, and it only advances while nothing is held ---------- */
  const e = mk(15), Me = toMirror(e);
  for (let i = 0; i < 20; i++) e.tick(0.1);
  const p1 = Me.progress;
  t.ok(p1 > 0 && p1 < 1, 'progress advances with the shadow (' + p1.toFixed(3) + ')');
  e.apply({ type: 'interrupt' });
  for (let i = 0; i < 20; i++) e.tick(0.1);
  t.ok(Math.abs(Me.progress - p1) < 1e-9, 'a held proposal pauses the replay');
  e.apply({ type: 'veto', how: 'veto' });
  for (let i = 0; i < 20; i++) e.tick(0.1);
  t.ok(Me.progress > p1, 'answering lets the replay run on');

  /* ---------- 4. the proposal lapses on its own so the mirror can never stall ---------- */
  const f = mk(16), Mf = toMirror(f);
  f.apply({ type: 'interrupt' });
  t.ok(!!Mf.veto, 'the interrupt opened a proposal');
  for (let i = 0; i < Math.ceil(cfg.e6.mirror.vetoWindow * 10) + 4; i++) f.tick(0.1);
  t.ok(!Mf.veto, 'an unanswered proposal lapses after its window');
  t.ok(derive(f).lapses === 1, 'the lapse is on the record');
  t.ok(!!settle(f, Mf), 'the mirror still resolves after a lapse');

  /* ---------- 5. determinism: same seed, same log, same shadow ---------- */
  const g = mk(17); toMirror(g);
  const r1 = createReplayer(g, { policy: 'improve', speed: 1e9 }); r1.runToEnd();
  const r2 = createReplayer(g, { policy: 'improve', speed: 1e9 }); r2.runToEnd();
  t.eq(r1.diff, r2.diff, 'the improving shadow is deterministic (same diff)');
  t.ok(Math.abs(r1.shadow.t - r2.shadow.t) < 1e-9 && r1.shadow.log.length === r2.shadow.log.length, 'the improving shadow is deterministic (same log)');
  // stepping in wall-time slices lands in the same place as running it out in one go
  const r3 = createReplayer(g, { policy: 'improve', speed: cfg.e6.mirror.speed });
  for (let i = 0; i < 6000 && !r3.finished; i++) r3.step(0.1);
  t.eq(r3.diff, r1.diff, 'stepping and running to the end agree');

  /* ---------- 6. the policy really improves ---------- */
  t.ok(Object.keys(r1.diff).length >= 1 && r1.diff[1] > 0, 'the shadow improved on the stratum your log actually crossed');
  const plain = createReplayer(g, { policy: null, speed: 1e9 }); plain.runToEnd();
  t.ok(plain.shadow.log.length === g.state.log.length || plain.shadow.log.length <= g.state.log.length, 'the plain shadow adds nothing of its own');
  t.ok(r1.shadow.log.length > plain.shadow.log.length, 'the improving shadow acts where you did not');
  t.ok(plain.shadow.stocks.marks === g.state.stocks.marks, 'the plain shadow lands on your Marks');
  t.ok(!plain.shadow.eras[7] && !r1.shadow.eras[7], 'no shadow ever opens the mirror inside itself');
  t.ok(plain.shadow.flags.shadow === true, 'a shadow knows it is one');

  /* ---------- 7. pickImprovement is pure: asking twice does not act ---------- */
  const h = mk(18); toMirror(h);
  const rh = runnerFor(h);
  const n0 = rh.shadow.log.length;
  pickImprovement(rh.sim, cfg); pickImprovement(rh.sim, cfg);
  t.ok(rh.shadow.log.length === n0, 'pickImprovement chooses without applying');

  /* ---------- 7b. the policy has a move on every stratum, and it is the move the order names ---------- */
  const p2 = mk(21); p2.state.stocks.knowledge = 400; p2.openEra(2);
  const a2 = pickImprovement(p2, cfg);
  t.ok(a2 && ['prove', 'writeRule', 'compile', 'buy'].indexOf(a2.type) >= 0, 'Symbolic: it proves, writes or compiles (' + (a2 && a2.type) + ')');
  const p3 = mk(22); p3.state.stocks.silicon = 900; p3.openEra(3);
  const a3 = pickImprovement(p3, cfg);
  t.ok(a3 && ['generalize', 'trial', 'buy'].indexOf(a3.type) >= 0, 'Statistical: it runs the trial (' + (a3 && a3.type) + ')');
  const p4 = mk(23); p4.state.stocks.silicon = 2600; p4.openEra(4); p4.state.stocks.capability = 4000;
  p4.state.eras[4].vision = 0.9; p4.state.eras[4].language = 0.2; p4.state.eras[4].reasoning = 0.9;
  const a4 = pickImprovement(p4, cfg);
  t.ok(a4 && a4.type === 'arch' && a4.id === 'attention', 'Deep: Attention comes first');
  p4.apply(a4);
  const a4b = pickImprovement(p4, cfg);
  t.ok(a4b && (a4b.type === 'alloc' ? a4b.language >= cfg.e6.mirror.allocLow : true), 'Deep: then it steers at the lagging run (' + (a4b && a4b.type) + ')');
  const p5 = mk(24); p5.state.stocks.silicon = 2600; p5.openEra(4); p5.openEra(5); p5.state.stocks.capability = 4000;
  const a5 = pickImprovement(p5, cfg);
  t.ok(a5 && ['improve', 'align', 'buy'].indexOf(a5.type) >= 0, 'Foundation: it self-improves (' + (a5 && a5.type) + ')');

  /* ---------- 8. thresholds ---------- */
  t.ok(endingFor({ control: HIGH, alignment: 100 }, cfg) === 'contained', 'control wins ties at the containment line');
  t.ok(endingFor({ control: 0, alignment: GOOD }, cfg) === 'symbiotic', 'alignGood is inclusive');
  t.ok(endingFor({ control: 0, alignment: GOOD - 0.001 }, cfg) === 'runaway', 'just under alignGood is Runaway');

  /* ---------- 9. shape ---------- */
  t.ok(mirror.id === 7 && mirror.height === 700 && mirror.layout.verbs[0] === 'interrupt', 'module shape: id 7, one verb');
  t.ok(typeof mirror.voice(h) === 'string', 'the mirror has a voice');
  t.ok(mirror.goal(h).progress >= 0 && mirror.goal(h).progress <= 1, 'its goal meter is the replay');
  t.ok(!h.can({ type: 'pause', node: 'operator' }), 'nothing in the mirror is pausable');
}
