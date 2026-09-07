// WO-02 own tests: the pieces the acceptance file does not pin — the reveal (nothing is pre-laid),
// the pipes the upkeep ports grow, the lever/refine/wheel tradeoffs, bulk cost, the layout contract,
// mute behaviour, and every screenshot scene running against a real sim.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins, { milestoneOf, handYield, pickYield, grossOf, refineCost, HIDDEN_PLATES } from '../engine/eras/origins.js';
import { SCENES } from '../scenes/scenes.js';

const mk = (seed = 7) => createSim({ cfg, eras: [origins], seed, legacy: null });
const chain = (sim) => {
  sim.state.stocks.marks = 5000; sim.state.stocks.ore = 5000; sim.state.stocks.knowledge = 5000; sim.state.stocks.metal = 5000;
  for (const id of ['tally', 'scribe', 'stoneworking', 'clayTablets', 'kiln', 'alphabet', 'numerals', 'theFoundry']) sim.apply({ type: 'discover', id });
};

export async function run(t) {
  /* ---------- the reveal: a locked node owns no ports, so it grows no pipe ---------- */
  let sim = mk(); let S = sim.state;
  t.eq(S.edges.length, 0, 'boot: no pipes are pre-laid on the board');
  const unlockedAtBoot = S.nodeOrder.filter((id) => !S.nodes[id].locked);
  t.eq(unlockedAtBoot, ['marks.store'], 'boot: one bank is open and nothing else');
  sim.apply({ type: 'inscribe' });
  t.eq(S.edges.length, 1, 'the first mark grows the first pipe');
  t.ok(S.edges[0].from === 'hand' && S.edges[0].to === 'marks.store', 'that pipe runs from your hand to the Marks bank');
  sim.tick(0.1);
  t.ok(S.edges[0].flow > 0, 'the hand pipe carries flow right after a press');
  for (let i = 0; i < 40; i++) sim.tick(0.1);
  t.near(S.edges[0].flow, 0, 1e-9, 'the hand pipe fades when you stop pressing');

  /* ---------- upkeep is a second input port, so every draw is a visible pipe ---------- */
  sim = mk(); S = sim.state; chain(sim);
  const ins = (id) => S.edges.filter((e) => e.to === id);
  t.eq(ins('scriptorium').map((e) => e.res).sort(), ['marks', 'ore'], 'the Scriptorium draws two pipes: marks and the ore upkeep');
  t.eq(ins('smelter').map((e) => e.res).sort(), ['knowledge', 'ore'], 'the Smelter draws ore and the knowledge upkeep');
  t.eq(ins('foundry').map((e) => e.res).sort(), ['knowledge', 'metal'], 'the Foundry draws metal and knowledge');
  t.ok(S.edges.some((e) => e.from === 'silicon.store' && e.to === 'logicMachine'), 'silicon runs on to the Logic Machine');
  t.ok(!S.edges.some((e) => e.riser), 'Origins is the bedrock: it has no riser pipes of its own');

  /* ---------- starvation lights the mouth of the pipe that is short ---------- */
  sim.apply({ type: 'buy', node: 'scriptorium', n: 3 });
  S.stocks.marks = 0; S.stocks.ore = 500;
  sim.tick(0.2);
  const marksIn = ins('scriptorium').find((e) => e.res === 'marks');
  const oreIn = ins('scriptorium').find((e) => e.res === 'ore');
  t.ok(marksIn.starved && !oreIn.starved, 'the starved input is the one that ran out');

  /* ---------- the hands lever splits one workforce; refine lifts everything ---------- */
  sim = mk(); S = sim.state; chain(sim);
  sim.apply({ type: 'hands', lever: 1 });
  const recHigh = handYield(sim), forgeLow = pickYield(sim);
  sim.apply({ type: 'hands', lever: 0 });
  t.ok(handYield(sim) < recHigh && pickYield(sim) > forgeLow, 'leaning to the Forge costs the Record exactly what it gains');
  sim.apply({ type: 'hands', lever: 0.5 });
  const flat = handYield(sim);
  S.stocks.ore = 1e6;
  sim.apply({ type: 'refine' });
  t.near(handYield(sim), flat * (1 + cfg.e1.refineBonus), 1e-9, 'refine lifts the hand yield by its bonus');
  t.near(sim.node('scriptorium').mult.refine, 1 + cfg.e1.refineBonus, 1e-9, 'refine lifts converters through the node multiplier');
  t.eq(refineCost(cfg.e1, 0, 2), Math.floor(cfg.e1.refineBase) + Math.floor(cfg.e1.refineBase * cfg.e1.refineGrowth), 'refine levels are priced geometrically');

  /* ---------- the wheel is a real tradeoff, not a free upgrade ---------- */
  sim = mk(); S = sim.state; chain(sim);
  const beforeH = handYield(sim), beforeP = pickYield(sim);
  S.stocks.ore = 1e5;
  sim.apply({ type: 'discover', id: 'wheel' });
  t.ok(pickYield(sim) > beforeP && handYield(sim) < beforeH, 'the Wheel buys Ore with Marks');

  /* ---------- bulk buy: a batch costs exactly the units it buys ---------- */
  sim = mk(); S = sim.state; chain(sim);
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += Math.floor(cfg.e1.scribeCost * Math.pow(cfg.e1.scribeGrowth, i));
  t.eq(sim.costOf('scribe', 10), sum, 'a batch of ten is the sum of the ten unit prices');
  const marks0 = S.stocks.marks;
  sim.apply({ type: 'buy', node: 'scribe', n: 10 });
  t.eq(marks0 - S.stocks.marks, sum, 'buying the batch spends exactly that');
  t.eq(sim.node('scribe').count, 10, 'and delivers ten');

  /* ---------- milestone pips ---------- */
  t.eq(milestoneOf(sim, sim.node('scribe')), { at: 25, near: false, tiered: true }, 'at ten the pip points at twenty five and the tier is live');
  t.eq(milestoneOf(sim, sim.node('marks.store')), null, 'a bank has no milestone pip');
  sim.node('scribe').count = 100;
  t.eq(milestoneOf(sim, sim.node('scribe')), null, 'the last tier ends the pips');

  /* ---------- mute: production runs, timed offers do not ---------- */
  sim = mk(); S = sim.state; chain(sim);
  sim.apply({ type: 'buy', node: 'scribe', n: 6 });
  sim.apply({ type: 'buy', node: 'scriptorium', n: 3 });
  sim.setMuted(true);
  const k0 = S.stocks.knowledge;
  for (let i = 0; i < 600; i++) sim.tick(0.1);
  t.ok(S.stocks.knowledge > k0, 'muted catch-up still runs the converters');
  t.ok(!S.eras[1].comm && S.eras[1].commN === 0, 'muted catch-up never cycles a commission');

  /* ---------- the commission ask tracks what you can actually make ---------- */
  sim.setMuted(false);
  for (let i = 0; i < 400 && !S.eras[1].comm; i++) sim.tick(0.1);
  const c = S.eras[1].comm;
  t.ok(!!c, 'a commission arrives once play is live again');
  const def = cfg.e1.comms[c.i];
  const gross = { marks: grossOf(sim, 'scribe'), ore: grossOf(sim, 'miner'), metal: grossOf(sim, 'smelter') * cfg.e1.commCapHalf, knowledge: grossOf(sim, 'scriptorium') * cfg.e1.commCapHalf }[c.res] || 0;
  t.eq(c.need, Math.ceil(Math.max(def.base, gross * cfg.e1.commMult)), 'the ask is commMult seconds of what that craft makes');
  const before = { rec: S.eras[1].commRec, forge: S.eras[1].commForge, scribes: sim.node('scribe').count };
  S.stocks[c.res] = c.need * 2;
  sim.apply({ type: 'commission', accept: true });
  const paid = S.eras[1].commRec > before.rec || S.eras[1].commForge > before.forge || sim.node('scribe').count > before.scribes;
  t.ok(paid && S.eras[1].commDone === 1, 'fulfilling pays the reward it advertised');
  t.ok(!S.eras[1].comm && S.eras[1].commCool === cfg.e1.commCool, 'and the caravan leaves on cooldown');

  /* ---------- layout contract for the renderer ---------- */
  const A = origins.layout.anchors;
  sim = mk(); chain(sim);
  for (const id of sim.state.nodeOrder) t.ok(!!A[id], 'every node has an anchor: ' + id);
  for (const id of Object.keys(A)) {
    const p = A[id];
    t.ok(p.x >= 240 && p.x <= 1180 && p.y >= 40 && p.y <= 660, 'anchor sits clear of the verb column and inside the stratum: ' + id);
  }
  t.eq(HIDDEN_PLATES, ['hand', 'pick', 'logicMachine'], 'the two hands and the goal have no plate of their own');

  /* ---------- scenes: every screenshot state builds on a real sim ---------- */
  for (const name of Object.keys(SCENES)) {
    const s = mk(3);
    SCENES[name](s);
    t.ok(s.state.t >= 0 && isFinite(s.state.stocks.marks), 'scene runs clean: ' + name);
  }
  const boot = mk(3); SCENES['origins-boot'](boot);
  t.ok(boot.state.stocks.marks > 0 && boot.state.edges.length === 1, 'origins-boot: marks made, one pipe');
  const bronze = mk(3); SCENES['origins-bronze'](bronze);
  t.ok(bronze.state.stocks.metal > 0 && bronze.state.rates.knowledge > 0, 'origins-bronze: both lanes are running');
  const comm = mk(3); SCENES['origins-commission'](comm);
  t.ok(!!comm.state.eras[1].comm, 'origins-commission: the card is up');
  const ready = mk(3); SCENES['origins-ready'](ready);
  t.ok(ready.goal(1).ready && ready.state.eras[1].age === 3, 'origins-ready: the Silicon Age, one press from the machine');

  /* ---------- the view module must not touch the document at import time ---------- */
  const view = await import('../render/eras/origins.js');
  t.ok(typeof view.createOriginsView === 'function', 'the Origins view imports clean outside a browser');
}
