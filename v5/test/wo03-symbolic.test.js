// WO-03 acceptance: the Symbolic stratum on the engine, above Origins. Ids/actions fixed by the order.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
export async function run(t) {
  const mk = (seed = 3, legacy = null) => createSim({ cfg, eras: [origins, symbolic], seed, legacy });
  let sim = mk(); let S = sim.state;
  S.stocks.knowledge = 400; sim.openEra(2);
  t.ok(S.era === 2 && S.nodes['rules.store'] && S.nodes['ruleset'] && S.nodes['proof'] && S.nodes['daemon'], 'symbolic installs rules store, ruleset, proof sink, daemon');
  t.near(S.stocks.rules, Math.round(400 * (cfg.e2.seedFromKnowledge || 1)), 1e-9, 'open(): carried Knowledge seeds Rules');
  const riser = S.edges.find(e => e.to === 'ruleset' && e.res === 'knowledge'); t.ok(riser && riser.riser, 'the Knowledge riser from Origins feeds the ruleset');
  // the gate: one ruleset until formalLogic
  S.stocks.rules = 1e6; t.ok(sim.apply({ type: 'buy', node: 'ruleset', n: 10 }).ok && S.nodes.ruleset.count === 1, 'one Ruleset until Formal Logic (batch clamps to 1)');
  t.ok(!sim.can({ type: 'buy', node: 'ruleset', n: 1 }), 'a second buy is refused while gated');
  // hand-written rules push the active proof
  t.ok(sim.apply({ type: 'aim', id: 'formalLogic' }).ok && S.eras[2].activeProof === 'formalLogic', 'aim sets the active proof');
  const p0 = S.eras[2].proofAcc.formalLogic || 0; sim.apply({ type: 'writeRule' }); t.ok((S.eras[2].proofAcc.formalLogic || 0) > p0, 'writeRule advances the active proof by clickProof');
  // inference flows: ruleset produces inference → the proof sink draws it (visible pipe)
  S.stocks.rules = 1e6; sim.tick(0.5); t.ok(S.edges.find(e => e.to === 'proof' && e.res === 'inference').flow > 0, 'Inference → Proof edge carries flow while proving');
  // finish formalLogic by force, then the gate lifts
  S.eras[2].proofAcc.formalLogic = 1e9; sim.tick(0.1); t.ok(S.eras[2].tech.formalLogic === true && S.eras[2].activeProof === null, 'a proof completes when acc ≥ cost');
  t.ok(sim.apply({ type: 'buy', node: 'ruleset', n: 10 }).ok && S.nodes.ruleset.count === 11, 'Formal Logic unlocks parallel Rulesets');
  // voice: terminal lines exist and are short
  const v = sim.voice(2); t.ok(typeof v === 'string' && v.trim().split(/\s+/).length <= 9, 'voice(2): a terminal line of ≤ 9 words');
  // contradictions: live only; the second names the odd rule
  sim = mk(5); S = sim.state; S.stocks.knowledge = 100; sim.openEra(2); S.eras[2].tech.formalLogic = true; S.nodes.ruleset.count = 5; S.stocks.rules = 1e6;
  S.eras[2].runRules = cfg.e2.contraAt[0] + 10; sim.setMuted(true); ticksN(sim, 20); sim.setMuted(false); t.ok(!S.eras[2].contra, 'contradictions do not fire while muted');
  ticksN(sim, 3); t.ok(!!S.eras[2].contra, 'a contradiction fires live'); t.ok(sim.apply({ type: 'resolve', side: 'fwd' }).ok && !S.eras[2].contra && S.eras[2].paraFwd === 1, 'resolve clears it and banks the bonus');
  S.eras[2].runRules = cfg.e2.contraAt[1] + 10; ticksN(sim, 3); t.ok(S.eras[2].contra && S.eras[2].contra.b === 4471 && S.flags.oddRule === 4471, 'the second contradiction names #4471 and flags it');
  const simL = mk(5, { oddRule: 7777, name: 'EKHO', runs: 1 }); simL.state.stocks.knowledge = 100; simL.openEra(2); simL.state.eras[2].tech.formalLogic = true; simL.state.nodes.ruleset.count = 5; simL.state.stocks.rules = 1e6; simL.state.eras[2].contraN = 1; simL.state.eras[2].runRules = cfg.e2.contraAt[1] + 10; ticksN(simL, 3);
  t.ok(simL.state.eras[2].contra && simL.state.eras[2].contra.b === 7777, 'a legacy odd rule returns');
  // compile: clears the engine, banks axioms (needs the compile flag), replayable
  sim = mk(8); S = sim.state; S.stocks.knowledge = 100; sim.openEra(2); S.eras[2].flags.compile = true; S.eras[2].runRules = 3000; S.eras[2].tech.formalLogic = true; S.nodes.ruleset.count = 6; S.nodes.daemon.count = 2;
  t.ok(sim.can({ type: 'compile' }) && sim.apply({ type: 'compile' }).ok && S.stocks.axioms >= 3 && S.nodes.ruleset.count === 0 && S.nodes.daemon.count === 0 && S.eras[2].runRules === 0, 'compile banks axioms and clears rulesets/daemons/runRules');
  // done + goal
  const g = sim.goal(2); t.ok(g && typeof g.progress === 'number' && /expert/i.test(g.label + ''), 'goal(2) reads the Expert System path');
  // replay determinism with both eras
  const s3 = mk(11); const S3 = s3.state; S3.stocks.knowledge = 300; s3.openEra(2);
  for (let i = 0; i < 500; i++) { if (i % 4 === 0) s3.apply({ type: 'writeRule' }); const av = s3.available(); const b = av.find(a => a.type === 'buy' && a.node === 'ruleset'); if (b && i % 30 === 0) s3.apply(b); const aim = av.find(a => a.type === 'aim'); if (aim && !S3.eras[2].activeProof) s3.apply(aim); s3.tick(0.1); }
  const rebuilt = s3.replay(11, S3.log, S3.t); const strip = s => { const c = JSON.parse(JSON.stringify(s)); delete c.log; return c; };
  t.ok(rebuilt.era === 1 && Math.abs(rebuilt.t - S3.t) < 1e-6, 'a direct openEra is outside the log, so replay stays in Origins (wo00-cross pins this; the real handoff replays byte-identically in wo03-symbolic-extra)');
  t.ok(symbolic.layout && symbolic.layout.anchors.ruleset && symbolic.layout.verbs.includes('writeRule') && symbolic.height === 700, 'layout declared');
}
function ticksN(sim, n) { for (let i = 0; i < n; i++) sim.tick(0.1); }
