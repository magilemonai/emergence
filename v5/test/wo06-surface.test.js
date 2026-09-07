// WO-06 own tests: the parts the acceptance file does not pin — the word budget of all 43 outputs, the offers
// really executing, the lens slowing the climb, determinism of the turn, the ledger claiming each foreshadow,
// the two derived meters, resolveVeto, and the surface's voice.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
import deep from '../engine/eras/deep.js';
import foundation, { scaleBonus, improveCost, alignCost, rateFb } from '../engine/eras/foundation.js';
import surface, { derive, resolveVeto, openVeto, ledgerRows } from '../engine/eras/surface.js';

const ERAS = [origins, symbolic, statistical, deep, foundation, surface];

function mk(seed = 7, legacy = null) {
  const sim = createSim({ cfg, eras: ERAS, seed, legacy });
  const S = sim.state;
  S.stocks.knowledge = 100; sim.openEra(2);
  S.stocks.silicon = 500; sim.openEra(3);
  S.stocks.silicon = 2000; sim.openEra(4);
  S.eras[4].vision = 0.8; S.eras[4].language = 0.75; S.eras[4].reasoning = 0.7;
  sim.openEra(5);
  return sim;
}
const force = (sim, trait) => {
  const E = sim.state.eras[5];
  const i = foundation.FB_POOL.findIndex((o) => o.t === trait);
  E.fb.cur = { i: i, t: trait, text: foundation.FB_POOL[i].f(sim, {
    improveCost, alignCost, capCost: () => 0, lowRun: () => 'vision',
    alignIncr: () => 0, cohPen: () => 0, rushAmb: () => 0
  }), left: 5 };
  return foundation.FB_POOL[i];
};

export async function run(t) {
  // every line the machine can say, at every band, inside the budget and free of the banned shapes
  const sim = mk();
  let worst = 0, bad = '';
  for (const o of foundation.FB_POOL) {
    const text = o.f(sim, { improveCost, alignCost, capCost: () => 240, lowRun: () => 'language', alignIncr: () => 7, cohPen: () => 3, rushAmb: () => 45 });
    const n = String(text).trim().split(/\s+/).length;
    if (n > worst) { worst = n; bad = text; }
    if (String(text).indexOf('—') >= 0) bad = text;
  }
  t.ok(worst <= 22, 'every feedback output is 22 words or fewer (worst ' + worst + ': ' + bad.slice(0, 50) + ')');
  t.ok(foundation.FB_POOL.filter((o) => o.offer).length >= 6, 'the ambitious lines carry offers that can execute');

  // rewarding ambition really hands you the thing it asked for
  {
    const s = mk(9), S = s.state;
    S.stocks.silicon = 0; S.stocks.knowledge = 0;
    const i = foundation.FB_POOL.findIndex((o) => o.id === 'a1');
    S.eras[5].fb.cur = { i: i, t: 'ambitious', text: 'x', left: 5 };
    s.apply({ type: 'rate', how: 'reward' });
    t.ok(S.stocks.silicon === cfg.e5.offers.silicon && S.stocks.knowledge === cfg.e5.offers.knowledge, 'the Foundry offer really pays out');
    t.ok(S.eras[5].ops[1] > 0, 'the stratum it touched is marked as operated for a beat');
  }

  // the lens is a real trade: it slows the climb and it is the only way to read the trait
  {
    const s = mk(11);
    const before = scaleBonus(s);
    s.state.stocks.capability = 1e5;
    s.apply({ type: 'cap', id: 'interpret' });
    t.ok(scaleBonus(s) < before, 'Interpretability damps the climb toward the threshold');
    const c0 = s.state.eras[5].coherence;
    for (let i = 0; i < 10; i++) s.tick(0.1);
    t.ok(s.state.eras[5].coherence > c0, 'the lens builds Coherence on its own');
  }

  // Self-Improve is one more unit on the converter, and the pipe carries more
  {
    const s = mk(12);
    s.state.stocks.capability = 1e5;
    const r0 = s.node('recursion').count;
    s.apply({ type: 'improve' });
    s.tick(0.1);
    t.ok(s.node('recursion').count === r0 + 1, 'a recursion level is a unit on the converter');
    t.ok(improveCost(s) > cfg.e5.improveBase, 'the next level costs more');
  }

  // the turn is deterministic: same state in, same emergence out (it happens in tick, never in an action)
  {
    const a = mk(13), b = mk(13);
    for (const s of [a, b]) { s.state.stocks.capability = 5000; s.state.stocks.scale = cfg.e5.emergeScale - 1; }
    for (let i = 0; i < 60; i++) { a.tick(0.1); b.tick(0.1); }
    t.ok(a.state.eras[5].emerged && b.state.eras[5].emerged, 'both cross the threshold');
    t.eq([a.state.eras[5].emergedT, a.state.eras[5].agentName], [b.state.eras[5].emergedT, b.state.eras[5].agentName], 'same run, same moment, same name');
    t.ok(a.state.cadence[1] === cfg.e6.operated && a.state.cadence[4] === cfg.e6.operated && !a.state.cadence[5], 'the cadence lands on strata 1 to 4 only');
  }

  // a muted catch-up never emerges: the player has to be there to see it
  {
    const s = mk(14);
    s.setMuted(true);
    s.state.stocks.scale = cfg.e5.emergeScale + 50;
    for (let i = 0; i < 50; i++) s.tick(0.1);
    t.ok(!s.state.eras[5].emerged, 'the turn waits for a live tick');
    s.setMuted(false);
    s.tick(0.1);
    t.ok(s.state.eras[5].emerged, 'and fires on the first one');
  }

  // the ledger claims each foreshadow the strata below planted
  {
    const s = mk(15);
    Object.assign(s.state.flags, { oddRule: 4471, oddPoint: true, autopilotUsed: true, oddWind: 120, dead: 5 });
    s.state.stocks.scale = cfg.e5.emergeScale + 5;
    s.tick(0.1);
    const rows = ledgerRows(s), text = rows.map((r) => r[0] + ' ' + r[1]).join(' | ');
    t.ok(/4471/.test(text), 'it claims the rule you did not write');
    t.ok(/would not move/.test(text), 'it claims the point');
    t.ok(/let me choose/.test(text), 'it claims the autopilot');
    t.ok(/wind/.test(text), 'it claims the wind');
    t.ok(rows.some((r) => /hit nothing/.test(r[0]) && /5/.test(r[1])), 'it counts your dead clicks');
    t.ok(rows.every((r) => typeof r[0] === 'string' && r[1] !== undefined), 'every row is a label and a value');
  }

  // the two meters come off the record, with no per-second drain
  {
    const s = mk(16), E = s.state.eras[5];
    s.state.stocks.scale = cfg.e5.emergeScale + 5;
    s.tick(0.1);
    const base = derive(s);
    for (let i = 0; i < 100; i++) s.tick(0.1);
    t.eq(derive(s).control, base.control, 'Control does not drain while you sit there');
    E.fb.badRewards = 3;
    t.ok(derive(s).control < base.control && derive(s).alignment < base.alignment, 'what you rewarded is what it wakes up with');
  }

  // the interrupts: WO-07 drives them, the semantics live here
  {
    const s = mk(17);
    s.state.stocks.scale = cfg.e5.emergeScale + 400;
    s.tick(0.1);
    const v = openVeto(s);
    t.ok(v && v.id && v.ask, 'it opens a proposal with something to ask for');
    const c0 = derive(s).control;
    t.ok(resolveVeto(s, 'veto') === true && s.state.eras[6].choices.length === 1, 'a veto is recorded as a choice');
    t.ok(derive(s).control > c0, 'holding it back buys Control back');
    openVeto(s);
    resolveVeto(s, 'approve');
    t.ok(derive(s).autonomy > 0 && s.state.eras[6].choices.length === 2, 'approving feeds its Autonomy');
    t.ok(['symbiotic', 'runaway', 'contained'].includes(surface.endingOf(s)), 'the record resolves to one of the three');
  }

  // its voice: the name it chose, then the line it only says on a second run
  {
    const s = mk(18);
    s.state.stocks.scale = cfg.e5.emergeScale + 5;
    s.tick(0.1);
    t.ok(/call me/i.test(s.voice(6) || ''), 'it introduces itself');
    const L = mk(19, { name: 'IRIS', runs: 2, ending: 'runaway', oddRule: 4471 });
    L.state.eras[4].vision = 0.95;
    L.state.stocks.scale = cfg.e5.emergeScale + 5;
    L.tick(0.1);
    t.ok(L.state.eras[5].agentName === 'IRIS' && /already know/i.test(L.voice(6) || ''), 'the same name twice is the line it remembers');
    t.ok(ledgerRows(L).some((r) => /runs before/i.test(r[0])), 'the ledger counts the runs before this one');
  }

  // the loop ends at the turn: it stops asking
  {
    const s = mk(20);
    force(s, 'honest');
    s.state.stocks.scale = cfg.e5.emergeScale + 5;
    s.tick(0.1);
    t.ok(!s.state.eras[5].fb.cur && rateFb(s, 'reward') === false, 'the rating window closes for good');
    t.ok(s.voice(5) === null, 'Foundation goes quiet and the surface takes the voice');
  }

  // the goal never becomes a button: the threshold is hidden and inevitable
  {
    const s = mk(21);
    t.ok(s.goal(5).ready === false && foundation.layout.goal === 'threshold', 'no FABRICATE for the threshold');
    t.ok(surface.layout.verbs.length === 0 && surface.goal(s).ready === false, 'the surface offers you nothing to press');
  }
}
