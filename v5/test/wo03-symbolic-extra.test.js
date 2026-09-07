// WO-03 extra: what the acceptance test does not cover — v4 stats parity, the riser as a real pipe, the proof
// sink's draw (it must never read as starved while the engine is fed), the voice budget, layout bounds, and
// replay across the REAL handoff (Origins fabricates, which is a logged action, so a fresh sim rebuilds both eras).
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic, { stats, proofCost, axiomGain, termLines, theoremItems, HIDDEN_PLATES } from '../engine/eras/symbolic.js';
import VOICE from '../engine/voice/e2.js';

const mk = (seed = 3, legacy = null) => createSim({ cfg, eras: [origins, symbolic], seed, legacy });
const ticks = (sim, n, dt = 0.1) => { for (let i = 0; i < n; i++) sim.tick(dt); };

/** v4-kit/era-symbolic.js stats(), transcribed, as the parity oracle */
function v4stats(c, E, axioms, rulesets, daemons) {
  const T = E.tech;
  let click = c.clickBase, rm = 1, g = 1;
  if (T.formalLogic) g *= 1.5;
  if (T.fwdChain) rm *= 1.8;
  if (T.bwdChain) click *= 3;
  if (T.rete) rm *= (1 + 0.03 * rulesets);
  if (T.heuristics) click *= (1 + 0.08 * rulesets);
  click *= (1 + c.contraBonus * (E.paraBwd || 0));
  rm *= (1 + c.contraBonus * (E.paraFwd || 0));
  if (E.contra) g *= c.contraSlow;
  const axBonus = c.axiomBonus * (T.metalogic ? 1.5 : 1);
  g *= (1 + axioms * axBonus);
  g *= (1 + c.lemmaBonus * E.optLevel);
  const tier = (n) => 1 + 0.25 * c.milestones.filter((m) => n >= m).length;
  return { click: click * g, engine: rm * g * tier(rulesets), daemon: tier(daemons) };
}
const within = (a, b, pct) => Math.abs(a - b) <= Math.abs(b) * pct + 1e-9;

export async function run(t) {
  const c = cfg.e2;

  /* ---------- v4 parity on the whole multiplier chain ---------- */
  const sim = mk(); const S = sim.state;
  S.stocks.knowledge = 300; sim.openEra(2);
  const E = S.eras[2];
  E.tech = { formalLogic: true, fwdChain: true, rete: true, metalogic: true };
  E.paraFwd = 2; E.paraBwd = 1; E.optLevel = 3;
  S.stocks.axioms = 7; S.nodes.ruleset.count = 14; S.nodes.daemon.count = 30;
  const mine = stats(sim), v4 = v4stats(c, E, 7, 14, 30);
  t.ok(within(mine.click, v4.click, 0.02), 'stats.click matches v4 within 2% (' + mine.click.toFixed(4) + ' vs ' + v4.click.toFixed(4) + ')');
  t.ok(within(mine.engine, v4.engine, 0.02), 'stats.engine matches the v4 ruleset chain within 2%');
  t.ok(within(mine.daemon, v4.daemon, 0.02), 'stats.daemon matches the v4 milestone tier within 2%');
  E.contra = { a: 1, b: 2, odd: false };
  t.ok(within(stats(sim).engine, v4stats(c, E, 7, 14, 30).engine, 0.02) && stats(sim).engine < mine.engine, 'a live contradiction slows the engine, v4 parity');
  E.contra = null;

  /* ---------- the riser is a real pipe, and the ruleset burns Origins Knowledge ---------- */
  const s2 = mk(4); const S2 = s2.state;
  S2.stocks.knowledge = 500; s2.openEra(2);
  S2.stocks.rules = 5000; s2.apply({ type: 'buy', node: 'ruleset', n: 1 });
  const k0 = S2.stocks.knowledge;
  ticks(s2, 20);
  const riser = S2.edges.find((e) => e.to === 'ruleset' && e.res === 'knowledge');
  t.ok(riser.riser && riser.flow > 0, 'the Knowledge riser carries flow while a ruleset runs');
  t.ok(S2.stocks.knowledge < k0, 'the riser actually draws Origins Knowledge down');
  t.near(riser.flow, 1 * c.knowledgePerRuleset, 1e-6, 'riser flow = rulesets x knowledgePerRuleset at mult 1');
  const out = S2.edges.find((e) => e.from === 'ruleset' && e.res === 'inference');
  t.ok(out && !out.riser && out.flow > 0, 'the ruleset emits Inference into its own stratum');

  /* ---------- the proof sink draws without reading as starved ---------- */
  s2.apply({ type: 'aim', era: 2, id: 'formalLogic' });
  let starved = 0, drew = 0;
  for (let i = 0; i < 60; i++) {
    s2.tick(0.1);
    const e = S2.edges.find((x) => x.to === 'proof' && x.res === 'inference');
    if (e.starved) starved++;
    if (e.flow > 0) drew++;
  }
  t.ok(drew >= 55, 'the proof sink draws Inference on essentially every tick (' + drew + '/60)');
  t.ok(starved === 0, 'a fed engine never blinks the proof pipe red (' + starved + ' starved ticks)');
  const big = mk(6); big.state.stocks.knowledge = 100; big.openEra(2);
  big.state.stocks.rules = 1e6; big.apply({ type: 'buy', node: 'ruleset', n: 1 });
  big.apply({ type: 'aim', era: 2, id: 'formalLogic' });
  big.tick(0.5);
  t.ok(!big.state.edges.find((x) => x.to === 'proof').starved, 'the sink stays fed at the largest tick the sim allows');

  /* ---------- the bank pours into a proof when you aim, and caps when you do not ---------- */
  const s3 = mk(9); const S3 = s3.state;
  S3.stocks.knowledge = 200; s3.openEra(2); S3.stocks.rules = 1e6;
  s3.apply({ type: 'buy', node: 'ruleset', n: 1 });
  ticks(s3, 4000);
  t.near(S3.stocks.inference, c.infCapBase, 1e-6, 'unaimed Inference banks up to the cap');
  s3.apply({ type: 'aim', era: 2, id: 'formalLogic' });
  t.ok(S3.stocks.inference === 0 && S3.eras[2].proofAcc.formalLogic >= c.infCapBase, 'aiming pours the whole bank into the proof');

  /* ---------- compile: v4 axiom math, and the engine really is cleared ---------- */
  const s4 = mk(12); const S4 = s4.state;
  S4.stocks.knowledge = 100; s4.openEra(2);
  S4.eras[2].flags.compile = true; S4.eras[2].runRules = 5000;
  t.ok(axiomGain(s4) === Math.floor(Math.sqrt(5000 / c.axiomDivisor)), 'axiomGain matches v4 floor(sqrt(runRules / divisor))');
  s4.apply({ type: 'compile' });
  t.ok(S4.stocks.rules === 0 && S4.eras[2].contraN === 0 && S4.eras[2].compiles === 1, 'compile clears the run and counts itself');
  t.ok(S4.nodes['axioms.store'].locked === true || S4.stocks.axioms > 0, 'axioms bank exists after a compile');

  /* ---------- the voice budget: the machine says nine words at most ---------- */
  const probe = { n: 400, a: 1234, b: 5678, name: 'Backward Chaining', pct: 41, side: 'rulesets', gain: 4, held: 12 };
  for (const l of VOICE) {
    const line = l.line(probe);
    t.ok(line.trim().split(/\s+/).length <= 9, 'voice e2 line "' + l.id + '" is at most nine words');
    t.ok(!line.includes('—'), 'voice e2 line "' + l.id + '" has no em-dash');
  }
  t.ok(termLines(s4).length === Math.min(c.termLines, S4.eras[2].term.length), 'the terminal holds at most three lines');
  t.ok(typeof sim.voice(2) === 'string', 'the stratum always has a line to print');

  /* ---------- layout: every anchor inside the stratum and clear of the verb column ---------- */
  const A = symbolic.layout.anchors;
  for (const id of Object.keys(A)) {
    t.ok(A[id].x >= 240 && A[id].x <= 1180 && A[id].y >= 40 && A[id].y <= 660, 'anchor inside the stratum and clear of the verbs: ' + id);
  }
  t.eq(HIDDEN_PLATES, ['proof'], 'the proof sink wears the view card instead of a plate');
  t.ok(symbolic.layout.verbs.length === 2 && symbolic.layout.goal === 'expert', 'two verbs and the Expert System goal');
  t.ok(theoremItems(s4).indexOf('optimization') === 0, 'the repeatable lemmas lead the theorem grid');

  /* ---------- replay across the REAL handoff (fabricate is a logged action) ---------- */
  const live = mk(21); const L = live.state;
  let opened = false;
  for (let i = 0; i < 24000 && !opened; i++) {
    live.apply({ type: 'inscribe', era: 1 });
    if (i % 2 === 0) live.apply({ type: 'quarry', era: 1 });
    if (i % 5 === 0) { live.apply({ type: 'discover', era: 1 }); for (const a of live.available(1)) if (a.type === 'buy') live.apply(a); }
    if (live.can({ type: 'fabricate', era: 1 })) { live.apply({ type: 'fabricate', era: 1 }); opened = true; }
    live.tick(0.1);
  }
  t.ok(opened && L.era === 2, 'a played Origins run fabricates and opens Symbolic');
  if (opened) {
    t.ok(L.stocks.rules > 0, 'the handoff seeded Rules from carried Knowledge');
    for (let i = 0; i < 900; i++) {
      if (i % 3 === 0) live.apply({ type: 'writeRule', era: 2 });
      const av = live.available(2);
      const b = av.find((a) => a.type === 'buy' && a.node === 'ruleset');
      if (b && i % 25 === 0) live.apply(b);
      if (!L.eras[2].activeProof) { const aim = av.find((a) => a.type === 'aim'); if (aim) live.apply(aim); }
      if (L.eras[2].contra && i % 40 === 0) live.apply({ type: 'resolve', era: 2, side: 'fwd' });
      live.tick(0.1);
    }
    const rebuilt = live.replay(21, L.log, L.t);
    const strip = (s) => { const x = JSON.parse(JSON.stringify(s)); delete x.log; return x; };
    t.eq(strip(rebuilt), strip(L), 'a real two-stratum run replays byte-identically from seed plus log');
    t.ok(rebuilt.era === 2 && Object.keys(rebuilt.eras).length === 2, 'the replay reopens Symbolic through the logged fabricate');
    t.ok(L.eras[2].tech.formalLogic === true, 'the played run proves Formal Logic and lifts the one-Ruleset gate');
    t.ok(L.nodes.ruleset.count > 1, 'parallel rulesets after the gate lifts');
    t.ok(proofCost(live, 'expert') === Math.ceil(30000 * c.infScale), 'the Expert System proof costs the v4 amount');
  }
}
