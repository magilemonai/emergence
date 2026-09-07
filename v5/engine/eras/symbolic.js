// engine/eras/symbolic.js — Symbolic, the phosphor stratum one floor above Origins (WO-03).
// The v4 economy (v4-kit/era-symbolic.js) ported onto the graph engine. What changed on purpose: every
// flow here is a pipe, so a Ruleset is a CONVERTER that burns Rules and a trickle of Origins Knowledge
// (the riser you can follow with your eye) and emits Inference, a Daemon is the SOURCE that writes rules
// for you, and the active proof is a SINK that draws the Inference bank down. The rules themselves are v4's:
// the one-Ruleset gate until Formal Logic, clickProof, the doctrine fork, contradictions and the odd rule,
// compile as a prestige reboot, and the Expert System path.
// Pure: no DOM, no clock, no randomness (a contradiction is seeded from the run's own rule count, as in v4).
import { STRATUM_H } from '../types.js';
import VOICE from '../voice/e2.js';

const RESOURCES = [
  { id: 'rules', name: 'Rules', hue: '#8dffb7', glyph: '§', flavor: 'Reasoning, written as explicit rules.' },
  { id: 'inference', name: 'Inference', hue: '#6fe6d8', glyph: '∴', flavor: 'Conclusions the rules can reach.' },
  { id: 'axioms', name: 'Axioms', hue: '#ffcd6b', glyph: '⊢', flavor: 'Truths banked forever, kept across runs.' }
];

/* Stratum-local anchors (CONTRACT: pos is local). One lane reads left to right along the top:
   the Rules bank feeds the Ruleset, the Ruleset emits Inference, the Inference bank feeds the proof. */
const ANCHORS = {
  'rules.store': { x: 300, y: 130 },
  ruleset: { x: 580, y: 130 },
  daemon: { x: 300, y: 300 },
  'inference.store': { x: 580, y: 300 },
  proof: { x: 860, y: 300 },
  'axioms.store': { x: 300, y: 470 }
};

/** the view anchors its own surfaces in the same stratum-local space */
export const THEOREM_GRID = { x: 300, y: 600, dx: 240, dy: 118, cols: 3 };
export const TERMINAL_AT = { x: 715, y: 470 };
/** the terminal's width in SCREEN px (the plates are screen-sized too, so the world grid leaves room for it) */
export const TERMINAL_W = 430;
/** the proof sink wears the view's own progress card, so its default plate stays hidden */
export const HIDDEN_PLATES = ['proof'];

const E = (sim) => sim.state.eras[2];
const C = (sim) => sim.cfg.e2;
const multOf = (n) => { let m = 1; for (const k of Object.keys(n.mult)) m *= n.mult[k]; return m; };

/* ---------- milestones (v4 kit: ×10/×25/×50/×100 → +25% per tier, on that engine only) ---------- */
function tierOf(c, count) { let t = 0; for (const m of c.milestones) if (count >= m) t++; return t; }
function tierMult(c, count) { return 1 + c.milestoneBonus * tierOf(c, count); }
export function milestoneOf(sim, node) {
  const c = C(sim);
  if (!node || !node.cost) return null;
  for (const m of c.milestones) if (node.count < m) return { at: m, near: m - node.count <= 3, tiered: tierOf(c, node.count) > 0 };
  return null;
}

/* ---------- the tree ---------- */
export function treeDef(sim, id) { for (const n of C(sim).tree) if (n.id === id) return n; return null; }
export const LEMMAS = ['optimization', 'capacity'];
export function isLemma(id) { return LEMMAS.indexOf(id) >= 0; }

export function proofName(sim, id) {
  const e = E(sim);
  if (id === 'optimization') return 'Optimization Lv ' + (e.optLevel + 1);
  if (id === 'capacity') return 'Capacity Lv ' + (e.infCapLevel + 1);
  const n = treeDef(sim, id);
  return n ? n.name : id;
}

export function proofCost(sim, id) {
  const c = C(sim), e = E(sim);
  if (id === 'optimization') return Math.floor(c.lemmaBase * Math.pow(c.lemmaGrowth, e.optLevel));
  if (id === 'capacity') return Math.floor(c.capLemmaBase * Math.pow(c.capLemmaGrowth, e.infCapLevel));
  const n = treeDef(sim, id);
  return n ? Math.ceil(n.cost * c.infScale) : Infinity;
}

export function canProve(sim, id) {
  if (isLemma(id)) return true;
  const e = E(sim), n = treeDef(sim, id);
  if (!n || e.tech[id]) return false;
  if (!n.req.every((r) => e.tech[r])) return false;
  if (n.reqAny && !n.reqAny.some((r) => e.tech[r])) return false;
  if (n.excl && e.tech[n.excl]) return false;
  if (n.reqAxioms && sim.stock('axioms') < n.reqAxioms) return false;
  return true;
}
/** a tree node is on the board while its prerequisites are met and its doctrine rival has not closed it */
export function treeVisible(sim, n) {
  const e = E(sim);
  return !e.tech[n.id] && n.req.every((r) => e.tech[r]) && (!n.reqAny || n.reqAny.some((r) => e.tech[r])) && !(n.excl && e.tech[n.excl]);
}
/**
 * What the theorem grid shows right now. One row of three tiles fits above the stratum floor, so the open tree
 * leads (a doctrine fork must never be hidden) and the repeatable lemmas fill what is left.
 */
export function theoremItems(sim) {
  const open = C(sim).tree.filter((n) => treeVisible(sim, n)).map((n) => n.id);
  return open.concat(LEMMAS).slice(0, C(sim).theoremSlots);
}
/** aim with no id picks the path before the lemmas, so a bot climbs the tree */
function firstProvable(sim) {
  const e = E(sim);
  for (const n of C(sim).tree) if (treeVisible(sim, n) && canProve(sim, n.id) && e.activeProof !== n.id) return n.id;
  for (const id of LEMMAS) if (e.activeProof !== id) return id;
  return null;
}

/* ---------- derived rates (v4 stats(), re-homed onto node multipliers) ---------- */
export function stats(sim) {
  const c = C(sim), e = E(sim), T = e.tech, m = c.techMult;
  const rulesets = countOf(sim, 'ruleset'), daemons = countOf(sim, 'daemon');
  let click = c.clickBase, rm = 1, g = 1;
  if (T.formalLogic) g *= m.formalLogic;
  if (T.fwdChain) rm *= m.fwdChain;
  if (T.bwdChain) click *= m.bwdChain;
  if (T.rete) rm *= 1 + m.rete * rulesets;
  if (T.heuristics) click *= 1 + m.heuristics * rulesets;
  click *= 1 + c.contraBonus * (e.paraBwd || 0);
  rm *= 1 + c.contraBonus * (e.paraFwd || 0);
  if (e.contra) g *= c.contraSlow;
  const axBonus = c.axiomBonus * (T.metalogic ? m.metalogic : 1);
  g *= 1 + sim.stock('axioms') * axBonus;
  g *= 1 + c.lemmaBonus * e.optLevel;
  return { click: click * g, engine: rm * g * tierMult(c, rulesets), daemon: tierMult(c, daemons), axBonus: axBonus };
}
function countOf(sim, id) { const n = sim.node(id); return n ? n.count : 0; }

export function infCap(sim) { const c = C(sim); return c.infCapBase + E(sim).infCapLevel * c.infCapStep; }
export function axiomGain(sim) { return Math.floor(Math.sqrt(E(sim).runRules / C(sim).axiomDivisor)); }
/** the run-rules total that banks one more Axiom (the compile hint) */
export function axiomNextAt(sim) { const g = axiomGain(sim) + 1; return C(sim).axiomDivisor * g * g; }
export function inferenceRate(sim) {
  const n = sim.node('ruleset');
  if (!n || n.paused) return 0;
  const p = n.outputs[0];
  return p ? n.count * p.rate * multOf(n) : 0;
}
export function rulesetGated(sim) { return !E(sim).tech.formalLogic && countOf(sim, 'ruleset') >= 1; }
/** how many units a batch actually buys: the gate clamps the first Ruleset to one */
export function batchN(sim, id, n) {
  let k = Math.max(1, Math.floor(n || 1));
  if (id === 'ruleset' && !E(sim).tech.formalLogic) k = Math.max(0, Math.min(k, 1 - countOf(sim, 'ruleset')));
  return k;
}

/* ---------- the terminal (state holds ids + values; the words live in engine/voice/e2.js) ---------- */
function term(sim, id, v) {
  const e = E(sim), c = C(sim);
  e.term.push({ id: id, v: v || {} });
  while (e.term.length > c.termLines) e.term.shift();
  e.termN = (e.termN || 0) + 1;
}
function lineOf(rec) {
  for (const l of VOICE) if (l.id === rec.id) return l.line(rec.v || {});
  return '';
}
/** the last `termLines` machine lines, oldest first (the view prints them; voice(sim) returns the newest) */
export function termLines(sim) {
  const e = E(sim);
  if (!e || !e.term || !e.term.length) return [lineOf({ id: 'idle' })];
  return e.term.map(lineOf);
}

/* ---------- multipliers ---------- */
function restate(sim) {
  const st = stats(sim);
  sim.setMult('ruleset', 'stats', st.engine);
  sim.setMult('daemon', 'click', st.click);
  sim.setMult('daemon', 'milestone', st.daemon);
}
/** the proof sink's demand for the NEXT tick: this tick's inference income plus a slice of the bank */
function retarget(sim) {
  const c = C(sim), e = E(sim);
  const p = sim.node('proof');
  if (!p) return;
  p.count = e.activeProof ? 1 : 0;
  sim.setMult('proof', 'draw', e.activeProof ? inferenceRate(sim) + sim.stock('inference') / c.proofTau : 0);
}

/* ---------- the graph ---------- */
function unlock(sim, id, ports) {
  const n = sim.node(id);
  if (!n || !n.locked) return;
  n.locked = false;
  n.inputs = ports.inputs || [];
  n.outputs = ports.outputs || [];
  sim.removeNode(id);
  sim.addNode(n);
}
function reveal(sim, id) { const n = sim.node(id); if (n) { n.locked = false; n.count = 1; } }

function completeProof(sim, id) {
  const e = E(sim);
  if (id === 'optimization') e.optLevel++;
  else if (id === 'capacity') e.infCapLevel++;
  else {
    e.tech[id] = true;
    if (id === 'inference') unlock(sim, 'daemon', { outputs: [{ res: 'rules', rate: C(sim).daemonRate }] });
    if (id === 'knowledge') { e.flags.compile = true; reveal(sim, 'axioms.store'); }
    if (id === 'expert') e.flags.symbolicDone = true;
  }
  e.proofAcc[id] = 0;
  e.activeProof = null;
  term(sim, 'qed', { name: proofName(sim, id) });
  if (id === 'formalLogic') term(sim, 'parallel', {});
  restate(sim);
  retarget(sim);
  if (id === 'expert') sim.openEra(3);      // a no-op until the Statistical module is installed alongside this one
}

/* ---------- contradictions (live play only; seeded from the run, no randomness) ---------- */
function contraTick(sim) {
  const c = C(sim), e = E(sim);
  if (e.contra || e.contraN >= c.contraAt.length || e.flags.symbolicDone) return;
  if (e.runRules < c.contraAt[e.contraN]) return;
  const seed = Math.floor(e.runRules);
  const a = 1000 + seed % 3989;
  let b = 4000 + (seed * 7) % 5989, odd = false;
  if (e.contraN === 1) {                                  // the second one names a rule nobody wrote
    b = (sim.state.legacy && sim.state.legacy.oddRule) || c.oddRule;
    odd = true;
    sim.state.flags.oddRule = b;
  }
  e.contra = { a: a, b: b, odd: odd };
  term(sim, odd ? 'odd' : 'contra', { a: a, b: b });
  restate(sim);
}

/* ---------- the module ---------- */
const symbolic = {
  id: 2,
  name: 'Symbolic',
  height: STRATUM_H,

  install(sim) {
    const c = C(sim);
    Object.assign(sim.state.eras[2], {
      tech: {}, activeProof: null, proofAcc: {}, runRules: 0,
      optLevel: 0, infCapLevel: 0, compiles: 0, totalAxioms: 0,
      contra: null, contraN: 0, paraFwd: 0, paraBwd: 0,
      term: [], termN: 0, termT: 0,
      flags: { compile: false, symbolicDone: false }
    });
    for (const r of RESOURCES) sim.addResource({ id: r.id, name: r.name, hue: r.hue, glyph: r.glyph, icon: null, flavor: r.flavor, era: 2 });

    const base = (id, kind, name) => ({
      id, era: 2, kind, name, inputs: [], outputs: [], count: 0, paused: false,
      pos: { x: ANCHORS[id].x, y: ANCHORS[id].y }, mult: {}, tags: [], locked: false
    });
    for (const r of RESOURCES) {
      const n = base(r.id + '.store', 'store', r.name);
      n.res = r.id; n.flavor = r.flavor;
      n.locked = r.id === 'axioms'; n.count = n.locked ? 0 : 1;
      sim.addNode(n);
    }
    // the ruleset is on the board from the first second: its ports are what grow the riser from Origins
    const rs = base('ruleset', 'converter', 'Ruleset');
    rs.cost = { res: 'rules', base: c.rulesetCost, growth: c.rulesetGrowth };
    rs.inputs = [{ res: 'rules', rate: c.rulesPerRuleset }, { res: 'knowledge', rate: c.knowledgePerRuleset }];
    rs.outputs = [{ res: 'inference', rate: c.infPerRuleset }];
    rs.flavor = 'Logic that begets more logic.';
    rs.mech = 'Burns Rules and Knowledge into Inference.';
    sim.addNode(rs);

    const pf = base('proof', 'sink', 'Proof');
    pf.inputs = [{ res: 'inference', rate: 1 }];
    pf.flavor = 'Inference, aimed at one theorem.';
    sim.addNode(pf);

    const dm = base('daemon', 'source', 'Daemon');
    dm.cost = { res: 'rules', base: c.daemonCost, growth: c.daemonGrowth };
    dm.locked = true;
    dm.flavor = 'A process that keeps writing while you look away.';
    dm.mech = 'Writes rules for you.';
    sim.addNode(dm);
    restate(sim);
  },

  /** the handoff: carried Knowledge becomes the starting Rules, and the riser keeps drawing it live */
  open(sim) {
    let n = Math.round(sim.stock('knowledge') * (C(sim).seedFromKnowledge || 1));
    // run 2: rules you did not write are already in the bank when the stratum opens (SPEC The turn §6)
    if (sim.state.flags.run2) n += C(sim).legacyRules || 0;
    sim.state.stocks.rules += n;
    E(sim).term = [];
    term(sim, 'boot', { n: n });
  },

  tick(sim, dt) {
    const c = C(sim), e = E(sim);
    { const rs = sim.node('ruleset'); if (rs) rs.gated = rulesetGated(sim); }   // render flag: BUILD disabled under the one-Ruleset gate
    if (dt > 0) {
      // a daemon's rules are a pipe, so the run's rule total reads the pipe rather than a private counter
      for (const edge of sim.state.edges) if (edge.from === 'daemon' && edge.res === 'rules') e.runRules += edge.flow * dt;
      if (e.activeProof) {
        let drawn = 0;
        for (const edge of sim.state.edges) if (edge.to === 'proof' && edge.res === 'inference') drawn += edge.flow * dt;
        if (drawn > 0) e.proofAcc[e.activeProof] = (e.proofAcc[e.activeProof] || 0) + drawn;
        if ((e.proofAcc[e.activeProof] || 0) >= proofCost(sim, e.activeProof)) completeProof(sim, e.activeProof);
      }
      const cap = infCap(sim);
      if (sim.state.stocks.inference > cap) sim.state.stocks.inference = cap;
    }
    if (!sim.muted()) {
      contraTick(sim);
      // the engine narrates itself while a proof runs: one derivation every few seconds
      if (e.activeProof && countOf(sim, 'ruleset') > 0) {
        e.termT -= dt;
        if (e.termT <= 0) {
          e.termT = c.termGap + (Math.floor(e.runRules) % c.termCycle) * c.termJitter;
          const cost = proofCost(sim, e.activeProof);
          term(sim, 'derive', {
            a: 1000 + Math.floor(e.runRules * 3) % 8999,
            b: 1000 + Math.floor(e.runRules * 11) % 8999,
            name: proofName(sim, e.activeProof),
            pct: Math.min(99, Math.floor(100 * (e.proofAcc[e.activeProof] || 0) / cost))
          });
        }
      }
    }
    restate(sim);
    retarget(sim);
  },

  actions: {
    writeRule: {
      can(sim) { return !E(sim).flags.symbolicDone; },
      apply(sim) {
        const c = C(sim), e = E(sim), g = stats(sim).click;
        sim.state.stocks.rules += g;
        e.runRules += g;
        if (e.activeProof) {                        // writing by hand pushes the proof you are aiming at
          e.proofAcc[e.activeProof] = (e.proofAcc[e.activeProof] || 0) + g * c.clickProof;
          if ((e.proofAcc[e.activeProof] || 0) >= proofCost(sim, e.activeProof)) completeProof(sim, e.activeProof);
        }
      }
    },
    buy: {
      can(sim, a) {
        const n = sim.node(a.node);
        if (!n || n.locked || !n.cost || n.era !== 2) return false;
        const k = batchN(sim, a.node, a.n);
        if (k < 1) return false;
        return sim.stock(n.cost.res) >= sim.costOf(a.node, k);
      },
      apply(sim, a) {
        const n = sim.node(a.node), k = batchN(sim, a.node, a.n);
        sim.state.stocks[n.cost.res] -= sim.costOf(a.node, k);
        n.count += k;
        restate(sim);
        retarget(sim);
      }
    },
    pause: {
      can(sim, a) {
        const n = sim.node(a.node);
        return !!n && n.era === 2 && n.kind === 'converter' && !n.locked && n.paused !== !!a.on;
      },
      apply(sim, a) { sim.node(a.node).paused = !!a.on; retarget(sim); }
    },
    aim: {
      menu(sim) { return theoremItems(sim).map((id) => ({ id: id })); },
      can(sim, a) {
        const e = E(sim);
        if (e.flags.symbolicDone) return false;
        const id = (a && a.id) || firstProvable(sim);
        return !!id && e.activeProof !== id && canProve(sim, id);
      },
      apply(sim, a) {
        const e = E(sim), id = (a && a.id) || firstProvable(sim);
        e.activeProof = id;
        e.proofAcc[id] = (e.proofAcc[id] || 0) + sim.stock('inference');   // the bank pours into the proof
        sim.state.stocks.inference = 0;
        e.termT = 0;
        retarget(sim);
      }
    },
    prove: {
      can(sim) { return E(sim).activeProof !== 'expert' && canProve(sim, 'expert'); },
      apply(sim) { symbolic.actions.aim.apply(sim, { id: 'expert' }); }
    },
    compile: {
      can(sim) { const e = E(sim); return !!e.flags.compile && !e.flags.symbolicDone && axiomGain(sim) >= 1; },
      apply(sim) {
        const e = E(sim), g = axiomGain(sim);
        sim.state.stocks.axioms += g;
        e.totalAxioms += g;
        e.compiles++;
        sim.state.stocks.rules = 0;
        e.runRules = 0;
        e.contra = null;
        e.contraN = 0;
        sim.node('ruleset').count = 0;
        sim.node('daemon').count = 0;
        e.term = [];
        term(sim, 'compile', { gain: g, held: Math.floor(sim.stock('axioms')) });
        term(sim, 'reboot', {});
        restate(sim);
        retarget(sim);
      }
    },
    resolve: {
      menu() { return [{ side: 'fwd' }, { side: 'bwd' }]; },
      can(sim) { return !!E(sim).contra; },
      apply(sim, a) {
        const c = C(sim), e = E(sim), fwd = !a || a.side !== 'bwd';
        if (fwd) e.paraFwd = (e.paraFwd || 0) + 1; else e.paraBwd = (e.paraBwd || 0) + 1;
        e.contraN = (e.contraN || 0) + 1;
        e.contra = null;
        term(sim, 'cleared', { side: fwd ? 'rulesets' : 'writes', pct: Math.round(c.contraBonus * 100) });
        restate(sim);
      }
    }
  },

  goal(sim) {
    const c = C(sim), e = E(sim);
    let done = 0;
    for (const id of c.path) if (e.tech[id]) done++;
    const ready = !e.flags.symbolicDone && e.activeProof !== 'expert' && canProve(sim, 'expert');   // mirrors prove.can: never lit while inert
    return { progress: done / c.path.length, ready: ready, label: 'Expert System ' + done + ' / ' + c.path.length };
  },

  voice(sim) {
    const e = E(sim);
    if (!e || !e.term || !e.term.length) return null;
    return lineOf(e.term[e.term.length - 1]);
  },

  layout: { anchors: ANCHORS, verbs: ['writeRule', 'compile'], goal: 'expert' },

  done(sim) { return !!E(sim).flags.symbolicDone; }
};

symbolic.milestoneOf = milestoneOf;
export default symbolic;
