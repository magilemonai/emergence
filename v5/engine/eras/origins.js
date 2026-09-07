// engine/eras/origins.js — Origins, the bedrock stratum (WO-02).
// The v4 economy (v4-kit/era-origins.js) ported onto the graph engine: two cross-gated tracks, rate-based
// converters whose upkeep is a SECOND INPUT PORT (so every draw is a pipe), one-time discoveries, timed
// commissions, the hands lever, refine, milestones, and the Logic Machine gate.
// Pure: no DOM, no clock, no randomness (commissions cycle in a fixed order, exactly as v4 did).
import { STRATUM_H } from '../types.js';

/* Resource hues/glyphs mirror render/palette.js RES; the renderer is the authority, these keep State whole. */
const RESOURCES = [
  { id: 'marks', name: 'Marks', hue: '#e6d2a4', glyph: '‖', flavor: 'The first attempt to hold a thought in place.' },
  { id: 'ore', name: 'Ore', hue: '#c08552', glyph: '◢', flavor: 'The world before we reshaped it.' },
  { id: 'knowledge', name: 'Knowledge', hue: '#e0a93f', glyph: '≡', flavor: 'Marks made meaningful.' },
  { id: 'metal', name: 'Metal', hue: '#ef9f56', glyph: '▬', flavor: 'Stone, disciplined by fire.' },
  { id: 'silicon', name: 'Silicon', hue: '#a9d8ce', glyph: '◇', flavor: 'Sand, taught to carry thought.' }
];

/* Stratum-local anchors (CONTRACT: pos is local; the renderer lifts by stratumTop). Two lanes read
   left to right: The Record along the top, The Forge below it, both draining into Silicon. */
const ANCHORS = {
  'marks.store': { x: 430, y: 120 },
  'knowledge.store': { x: 880, y: 120 },
  'ore.store': { x: 430, y: 350 },
  'metal.store': { x: 880, y: 350 },
  'silicon.store': { x: 880, y: 600 },
  hand: { x: 250, y: 120 },
  pick: { x: 250, y: 350 },
  scribe: { x: 430, y: 260 },
  miner: { x: 430, y: 490 },
  scriptorium: { x: 650, y: 190 },
  smelter: { x: 650, y: 420 },
  foundry: { x: 650, y: 600 },
  logicMachine: { x: 1150, y: 610 }
};

/* Nodes whose plate never shows: your two hands and the goal (the goal lives in the HUD column). */
export const HIDDEN_PLATES = ['hand', 'pick', 'logicMachine'];

const E = (sim) => sim.state.eras[1];
const C = (sim) => sim.cfg.e1;

/* ---------- milestones (v4 kit: ×10/×25/×50/×100 → +25% per tier, on that building only) ---------- */
function tierOf(c, count) { let t = 0; for (const m of c.milestones) if (count >= m) t++; return t; }
function tierMult(c, count) { return 1 + c.milestoneBonus * tierOf(c, count); }
/** the next count tier for a node, for the renderer's pip */
export function milestoneOf(sim, node) {
  const c = C(sim);
  if (!node || !node.cost) return null;
  for (const m of c.milestones) if (node.count < m) return { at: m, near: m - node.count <= 3, tiered: tierOf(c, node.count) > 0 };
  return null;
}

/* ---------- ports: the shape of every pipe this stratum can grow ---------- */
function portsOf(c) {
  return {
    hand: { outputs: [{ res: 'marks', rate: 0 }] },
    pick: { outputs: [{ res: 'ore', rate: 0 }] },
    scribe: { outputs: [{ res: 'marks', rate: c.scribeYield }] },
    miner: { outputs: [{ res: 'ore', rate: c.minerYield }] },
    scriptorium: {
      inputs: [{ res: 'marks', rate: c.scriptoriumRate }, { res: 'ore', rate: c.scriptoriumRate * c.scriptoriumUpkeep }],
      outputs: [{ res: 'knowledge', rate: c.scriptoriumRate }]
    },
    smelter: {
      inputs: [{ res: 'ore', rate: c.smelterRate }, { res: 'knowledge', rate: c.smelterRate * c.smelterUpkeep }],
      outputs: [{ res: 'metal', rate: c.smelterRate }]
    },
    foundry: {
      inputs: [{ res: 'metal', rate: c.foundryRate }, { res: 'knowledge', rate: c.foundryRate }],
      outputs: [{ res: 'silicon', rate: c.foundryRate }]
    },
    logicMachine: { inputs: [{ res: 'silicon', rate: 0 }] }
  };
}

/**
 * A locked node exists but owns no ports, so it derives no edges: nothing is pre-laid on the board.
 * Unlocking hands it its ports and re-registers it, which is what makes deriveEdges grow the new pipe.
 */
function unlock(sim, id) {
  const n = sim.node(id);
  if (!n || !n.locked) return;
  const p = portsOf(C(sim))[id] || {};
  n.locked = false;
  n.inputs = p.inputs || [];
  n.outputs = p.outputs || [];
  sim.removeNode(id);
  sim.addNode(n);
}

/** a store has no ports, so revealing its bank is a flag plus the count that lifts it out of the rock */
function reveal(sim, id) { const n = sim.node(id); if (n) { n.locked = false; n.count = 1; } }

/* ---------- derived rates (v4 oStats, re-homed onto node multipliers) ---------- */
function levers(sim) {
  const c = C(sim), e = E(sim);
  return {
    record: (c.leverFloor + c.leverSwing * e.lever) * (1 + c.commBonus * e.commRec),
    forge: (c.leverFloor + c.leverSwing * (1 - e.lever)) * (1 + c.commBonus * e.commForge),
    refine: 1 + e.refine * c.refineBonus
  };
}

/** recompute every node multiplier from discoveries, the lever, refine and counts */
function restate(sim) {
  const c = C(sim), e = E(sim), d = e.disco, m = c.mult, L = levers(sim);
  const set = (id, disco, lever) => {
    const n = sim.node(id);
    if (!n) return;
    sim.setMult(id, 'disco', disco);
    sim.setMult(id, 'refine', L.refine);
    sim.setMult(id, 'milestone', tierMult(c, n.count));
    if (lever) sim.setMult(id, 'lever', lever);
  };
  set('scribe', (d.apprenticeship ? m.apprentice : 1) * (d.wheel ? m.wheelScribe : 1), L.record);
  set('miner', (d.apprenticeship ? m.apprentice : 1) * (d.wheel ? m.wheelMiner : 1), L.forge);
  set('scriptorium', (d.alphabet ? m.alphabet : 1) * (d.numerals ? m.numerals : 1), 0);
  set('smelter', (d.bronzeCasting ? m.bronze : 1) * (d.numerals ? m.numerals : 1), 0);
  set('foundry', (d.numerals ? m.numerals : 1) * (d.glassmaking ? m.glass : 1), 0);
}

/** what one press of a verb yields right now (the number on the button) */
export function handYield(sim) {
  const c = C(sim), d = E(sim).disco, L = levers(sim);
  let v = c.inscribeBase;
  if (d.tally) v *= c.mult.tally;
  if (d.wheel) v *= c.mult.wheelScribe;
  return v * L.record * L.refine;
}
export function pickYield(sim) {
  const c = C(sim), d = E(sim).disco, L = levers(sim);
  let v = c.quarryBase;
  if (d.wheel) v *= c.mult.wheelMiner;
  return v * L.forge * L.refine;
}

/** a node's gross output per second at its current count (used by the commission ask and by the view) */
export function grossOf(sim, id) {
  const n = sim.node(id);
  if (!n || !n.outputs.length) return 0;
  let m = 1;
  for (const k of Object.keys(n.mult)) m *= n.mult[k];
  return n.count * n.outputs[0].rate * m;
}

function edgeOf(sim, from, to) {
  for (const e of sim.state.edges) if (e.from === from && e.to === to) return e;
  return null;
}
function setFlow(sim, from, to, v) { const e = edgeOf(sim, from, to); if (e) e.flow = v; }

/* ---------- discoveries ---------- */
const FX = {
  scribe: (sim, e) => { e.flags.canScribe = true; unlock(sim, 'scribe'); },
  stoneworking: (sim, e) => { e.flags.o_materials = true; reveal(sim, 'ore.store'); unlock(sim, 'miner'); },
  clayTablets: (sim, e) => { e.flags.o_scriptorium = true; reveal(sim, 'knowledge.store'); unlock(sim, 'scriptorium'); },
  kiln: (sim, e) => { e.flags.o_smelter = true; e.age = 2; reveal(sim, 'metal.store'); unlock(sim, 'smelter'); },
  theFoundry: (sim, e) => { e.flags.o_foundry = true; e.age = 3; reveal(sim, 'silicon.store'); unlock(sim, 'foundry'); unlock(sim, 'logicMachine'); }
};

export function discoDef(sim, id) { for (const n of C(sim).disco) if (n.id === id) return n; return null; }
/** visible = every prerequisite discovery is already made */
export function discoVisible(sim, n) { return n.req.every((r) => E(sim).disco[r]); }
export function canDisco(sim, n) {
  const e = E(sim);
  if (!n || e.disco[n.id] || !discoVisible(sim, n)) return false;
  if (n.reqRes) for (const k of Object.keys(n.reqRes)) if (sim.stock(k) < n.reqRes[k]) return false;
  if (n.costs) { for (const k of Object.keys(n.costs)) if (sim.stock(k) < n.costs[k]) return false; return true; }
  return sim.stock(n.res) >= n.cost;
}
function firstReady(sim) { for (const n of C(sim).disco) if (canDisco(sim, n)) return n; return null; }

/* ---------- commissions (live play only; a fixed cycle, no randomness) ---------- */
function commissionTick(sim, dt) {
  const c = C(sim), e = E(sim);
  if (e.comm) {
    e.comm.t -= dt;
    if (e.comm.t <= 0) { e.comm = null; e.commCool = c.commCool; e.commLapsed++; }
    return;
  }
  e.commCool -= dt;
  if (e.commCool > 0) return;
  const def = c.comms[e.commN % c.comms.length];
  e.commN++;
  const cap = {
    marks: grossOf(sim, 'scribe'), ore: grossOf(sim, 'miner'),
    metal: grossOf(sim, 'smelter') * c.commCapHalf, knowledge: grossOf(sim, 'scriptorium') * c.commCapHalf
  };
  const need = Math.ceil(Math.max(def.base, (cap[def.res] || 0) * c.commMult));
  // run 2: the commission arrives signed with the name the last run gave the agent (SPEC The turn §6)
  const L = sim.state.legacy;
  const signed = sim.state.flags.run2 && L && L.name ? String(L.name) : null;
  e.comm = { i: (e.commN - 1) % c.comms.length, res: def.res, need: need, t: c.commDur, signed: signed };
}

/* ---------- the module ---------- */
const origins = {
  id: 1,
  name: 'Origins',
  height: STRATUM_H,

  install(sim) {
    const c = C(sim);
    Object.assign(sim.state.eras[1], {
      disco: {}, flags: {}, lever: 0.5, age: 1, refine: 0,
      comm: null, commN: 0, commCool: c.commCool, commRec: 0, commForge: 0, commDone: 0, commLapsed: 0,
      handFlow: 0, pickFlow: 0, done: false
    });
    for (const r of RESOURCES) sim.addResource({ id: r.id, name: r.name, hue: r.hue, glyph: r.glyph, icon: null, flavor: r.flavor, era: 1 });

    const base = (id, kind, name) => ({
      id, era: 1, kind, name, inputs: [], outputs: [], count: 0, paused: false,
      pos: { x: ANCHORS[id].x, y: ANCHORS[id].y }, mult: {}, tags: [], locked: true
    });
    // stores first: every derived edge needs a bank to run to
    for (const r of RESOURCES) {
      const n = base(r.id + '.store', 'store', r.name);
      n.res = r.id; n.locked = r.id !== 'marks'; n.count = n.locked ? 0 : 1;
      n.flavor = r.flavor;
      sim.addNode(n);
    }
    const src = (id, name, flavor, mech) => { const n = base(id, 'source', name); n.flavor = flavor; n.mech = mech; return n; };
    sim.addNode(src('hand', 'Your hands', 'The mark comes before the machine.', 'Inscribe: marks by hand.'));
    sim.addNode(src('pick', 'Your pick', 'Stone gives way, slowly.', 'Quarry: ore by hand.'));
    const scribe = src('scribe', 'Scribe', 'A trained hand that never tires.', 'Automates Marks.');
    scribe.cost = { res: 'marks', base: c.scribeCost, growth: c.scribeGrowth };
    sim.addNode(scribe);
    const miner = src('miner', 'Miner', 'Picks against the rock, hour after hour.', 'Automates Ore.');
    miner.cost = { res: 'ore', base: c.minerCost, growth: c.minerGrowth };
    sim.addNode(miner);

    const conv = (id, name, cost, flavor, mech) => { const n = base(id, 'converter', name); n.cost = cost; n.flavor = flavor; n.mech = mech; return n; };
    sim.addNode(conv('scriptorium', 'Scriptorium', { res: 'marks', base: c.scriptoriumCost, growth: c.scriptoriumGrowth },
      'Where marks are ordered and made to mean something.', 'Marks and a little Ore become Knowledge.'));
    sim.addNode(conv('smelter', 'Smelter', { res: 'ore', base: c.smelterCost, growth: c.smelterGrowth },
      'Fire coaxes metal out of stone.', 'Ore and a little Knowledge become Metal.'));
    sim.addNode(conv('foundry', 'Foundry', { res: 'metal', base: c.foundryCost, growth: c.foundryGrowth },
      'A recipe and a furnace.', 'Metal plus Knowledge becomes Silicon.'));

    const goal = base('logicMachine', 'goal', 'The Logic Machine');
    goal.count = 1; goal.flavor = 'A machine that follows rules you set.';
    sim.addNode(goal);
    restate(sim);
  },

  open() { /* Origins is where the run starts; nothing to carry in */ },

  tick(sim, dt) {
    const c = C(sim), e = E(sim);
    // your hand as a real pipe: each press pushes flow, and it fades the moment you stop
    // the hand is a pipe only while you press: an exponential fade (tau) with a floor, so it matches the button, not a tail
    const fade = Math.exp(-dt / c.handTau);
    e.handFlow = e.handFlow * fade < c.handFloor ? 0 : e.handFlow * fade;
    e.pickFlow = e.pickFlow * fade < c.handFloor ? 0 : e.pickFlow * fade;
    setFlow(sim, 'hand', 'marks.store', e.handFlow);
    setFlow(sim, 'pick', 'ore.store', e.pickFlow);
    // silicon walking to the machine is the goal, drawn as the flow it actually is
    setFlow(sim, 'silicon.store', 'logicMachine', Math.max(0, sim.rate('silicon')));
    if (sim.muted()) return;                      // offline catch-up: timed offers freeze, they never cycle unseen
    if (e.done || !e.flags.o_smelter || !e.flags.o_scriptorium) return;
    commissionTick(sim, dt);
  },

  actions: {
    inscribe: {
      can() { return true; },
      apply(sim) {
        const c = C(sim), e = E(sim), g = handYield(sim);
        sim.state.stocks.marks += g;
        e.handFlow = Math.min(c.handCap, e.handFlow + g * c.handPulse);
        unlock(sim, 'hand');
      }
    },
    quarry: {
      can(sim) { return !!E(sim).flags.o_materials; },
      apply(sim) {
        const c = C(sim), e = E(sim), g = pickYield(sim);
        sim.state.stocks.ore += g;
        e.pickFlow = Math.min(c.handCap, e.pickFlow + g * c.handPulse);
        unlock(sim, 'pick');
      }
    },
    buy: {
      can(sim, a) {
        const n = sim.node(a.node);
        if (!n || n.locked || !n.cost || n.era !== 1) return false;
        const k = Math.max(1, Math.floor(a.n || 1));
        return sim.stock(n.cost.res) >= sim.costOf(a.node, k);
      },
      apply(sim, a) {
        const n = sim.node(a.node), k = Math.max(1, Math.floor(a.n || 1));
        sim.state.stocks[n.cost.res] -= sim.costOf(a.node, k);
        n.count += k;
        restate(sim);
      }
    },
    pause: {
      can(sim, a) {
        const n = sim.node(a.node);
        return !!n && n.kind === 'converter' && !n.locked && n.paused !== !!a.on;
      },
      apply(sim, a) { sim.node(a.node).paused = !!a.on; }
    },
    discover: {
      menu(sim) { return C(sim).disco.filter((n) => discoVisible(sim, n)).map((n) => ({ id: n.id })); },
      can(sim, a) { return a && a.id ? canDisco(sim, discoDef(sim, a.id)) : !!firstReady(sim); },
      apply(sim, a) {
        const e = E(sim), n = a && a.id ? discoDef(sim, a.id) : firstReady(sim);
        if (n.costs) for (const k of Object.keys(n.costs)) sim.state.stocks[k] -= n.costs[k];
        else sim.state.stocks[n.res] -= n.cost;
        e.disco[n.id] = true;
        if (FX[n.id]) FX[n.id](sim, e);
        restate(sim);
      }
    },
    commission: {
      menu() { return [{ accept: true }, { accept: false }]; },
      can(sim, a) {
        const e = E(sim);
        if (!e.comm || typeof a.accept !== 'boolean') return false;
        return a.accept ? sim.stock(e.comm.res) >= e.comm.need : true;
      },
      apply(sim, a) {
        const c = C(sim), e = E(sim), def = c.comms[e.comm.i];
        if (a.accept) {
          sim.state.stocks[e.comm.res] -= e.comm.need;
          e.commDone++;
          if (def.reward === 'rec') e.commRec++;
          else if (def.reward === 'forge') e.commForge++;
          else { sim.node('scribe').count += 2; sim.node('miner').count += 2; }
        }
        e.comm = null;
        e.commCool = c.commCool;
        restate(sim);
      }
    },
    hands: {
      menu() { return [{ lever: 0 }, { lever: 0.5 }, { lever: 1 }]; },
      can(sim, a) { return typeof a.lever === 'number' && a.lever >= 0 && a.lever <= 1; },
      apply(sim, a) { E(sim).lever = a.lever; restate(sim); }
    },
    refine: {
      menu() { return [{ n: 1 }]; },
      can(sim, a) {
        const c = C(sim), e = E(sim), k = Math.max(1, Math.floor((a && a.n) || 1));
        return sim.stock('ore') >= refineCost(c, e.refine, k);
      },
      apply(sim, a) {
        const c = C(sim), e = E(sim), k = Math.max(1, Math.floor((a && a.n) || 1));
        sim.state.stocks.ore -= refineCost(c, e.refine, k);
        e.refine += k;
        restate(sim);
      }
    },
    fabricate: {
      can(sim) { return !E(sim).done && sim.stock('silicon') >= C(sim).siliconGate; },
      apply(sim) {
        sim.state.stocks.silicon -= C(sim).siliconGate;
        E(sim).done = true;
        sim.openEra(2);           // a no-op until the Symbolic module is installed alongside this one
      }
    }
  },

  goal(sim) {
    const c = C(sim), e = E(sim);
    const p = e.done ? 1 : Math.max(0, Math.min(1, sim.stock('silicon') / c.siliconGate));
    return { progress: p, ready: !e.done && p >= 1, label: Math.floor(sim.stock('silicon')) + ' / ' + c.siliconGate };
  },

  voice() { return null; },     // Origins is silent: numbers only

  layout: { anchors: ANCHORS, verbs: ['inscribe', 'quarry'], goal: 'logicMachine' },

  done(sim) { return !!E(sim).done; }
};

/** repeatable ore sink: geometric, floored per level, exactly like a building's unit cost */
export function refineCost(c, level, n) {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.floor(c.refineBase * Math.pow(c.refineGrowth, level + i));
  return sum;
}

origins.milestoneOf = milestoneOf;
export default origins;
