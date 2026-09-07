// WO-13 acceptance: the progression bot. It plays the whole arc at a fixed 0.1s tick through the action
// seam only (sim.available / sim.can / sim.apply), never poking state, with the v4 policies ported per era.
// It proves the arc is completable and reports the numbers a pacing tune needs; it does not prove it is fun.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic, { axiomGain } from '../engine/eras/symbolic.js';
import statistical from '../engine/eras/statistical.js';
import deep, { demandOf, breadth } from '../engine/eras/deep.js';
import foundation from '../engine/eras/foundation.js';
import surface from '../engine/eras/surface.js';

const TICK = 0.1;
const SEED = 1;
const MAX_TICKS = 45 * 60 * 10;          // the assertion budget: 45 game minutes at 0.1s
const AFTER_EMERGE = 600;                // the arc ends at emergence + 60s of surface (the mirror is WO-07)
const FEEDSTOCK = ['data', 'knowledge', 'insight', 'silicon'];

/* ---------------- the action seam ---------------- */

/** every action the era can run right now, from the sim's own menu */
const menuOf = (sim, era) => sim.available(era);
/** one action, gated by the sim; parameterized types that ship no menu are proposed here and filtered by can() */
const act = (sim, a) => (sim.can(a) ? sim.apply(a).ok : false);
const has = (list, type) => list.some((a) => a.type === type);
const ofType = (list, type) => list.filter((a) => a.type === type);
const countOf = (sim, id) => { const n = sim.node(id); return n ? n.count : 0; };
const eraState = (sim, n) => sim.state.eras[n] || {};

/** the resources a pipe could not fill this tick: what the board is telling you to go build */
function starvedRes(sim) {
  const out = {};
  for (const e of sim.state.edges) if (e.starved) out[e.res] = true;
  return out;
}

/* ---------------- Origins: cheapest affordable producer, starved side first ---------------- */

const O_CAP = (sim) => ({
  scribe: 30, miner: 30,
  scriptorium: Math.max(2, countOf(sim, 'scribe')),
  smelter: Math.max(2, countOf(sim, 'miner')),
  foundry: Math.max(1, Math.min(countOf(sim, 'scriptorium'), countOf(sim, 'smelter')))
});

function originsStep(sim, bot) {
  const e = eraState(sim, 1);
  if (e.done) return;
  const av = menuOf(sim, 1);
  for (let i = 0; i < 5; i++) act(sim, { type: 'inscribe', era: 1 });
  if (has(av, 'quarry')) for (let i = 0; i < 5; i++) act(sim, { type: 'quarry', era: 1 });
  while (act(sim, { type: 'discover', era: 1 })) bot.discos++;
  // commissions carry no menu: the offer on the board is the only parameter, so it is proposed here
  if (e.comm && sim.stock(e.comm.res) >= e.comm.need * 1.5) { if (act(sim, { type: 'commission', era: 1, accept: true })) bot.comms++; }
  const starved = starvedRes(sim);
  const caps = O_CAP(sim);
  const buys = ofType(menuOf(sim, 1), 'buy').filter((a) => {
    const n = sim.node(a.node);
    return n && n.cost && (caps[a.node] === undefined || n.count < caps[a.node]);
  });
  buys.sort((a, b) => {
    const na = sim.node(a.node), nb = sim.node(b.node);
    const sa = na.outputs.some((p) => starved[p.res]) ? 0 : 1;
    const sb = nb.outputs.some((p) => starved[p.res]) ? 0 : 1;
    return sa - sb || sim.costOf(a.node, 1) - sim.costOf(b.node, 1);
  });
  if (buys.length) act(sim, buys[0]);
  if (sim.stock('ore') > 600) act(sim, { type: 'refine', era: 1, n: 1 });
  act(sim, { type: 'fabricate', era: 1 });        // self-gated on the Silicon gate
}

/* ---------------- Symbolic: aim at the path, write by hand, compile on a real gain ---------------- */

function symbolicStep(sim, bot) {
  const c = cfg.e2, e = eraState(sim, 2);
  if (e.flags && e.flags.symbolicDone) return;
  if (e.contra) { if (act(sim, { type: 'resolve', era: 2, side: countOf(sim, 'ruleset') > 8 ? 'fwd' : 'bwd' })) bot.contras++; }
  const engines = countOf(sim, 'ruleset') + countOf(sim, 'daemon');
  const clicks = engines < 1 ? 8 : (bot.stalled ? 4 : 1);   // by hand while the proof stalls
  for (let i = 0; i < clicks; i++) act(sim, { type: 'writeRule', era: 2 });
  const av = menuOf(sim, 2);
  for (const a of ofType(av, 'buy')) {
    const n = sim.node(a.node);
    if (a.node === 'ruleset' && n.count < 30) act(sim, a);
    if (a.node === 'daemon' && n.count < 20 && sim.stock('rules') >= sim.costOf('daemon', 1) * 2) act(sim, a);
  }
  if (!e.activeProof) {
    let aimed = false;
    for (const id of c.path) if (!aimed && act(sim, { type: 'aim', era: 2, id: id })) aimed = true;
    if (!aimed) act(sim, { type: 'aim', era: 2 });            // no id: the era picks the first provable
  }
  const expert = c.tree.find((n) => n.id === 'expert');
  const need = (expert && expert.reqAxioms) || 0;
  const gain = axiomGain(sim);
  if (sim.stock('axioms') < need && gain >= Math.max(2, Math.ceil(sim.stock('axioms') * 0.5))) {
    if (act(sim, { type: 'compile', era: 2 })) bot.compiles++;
  }
}

/* ---------------- Statistical: focus by the gap, trials, methods, generalize ---------------- */

function statisticalStep(sim, bot, tk) {
  const e = eraState(sim, 3);
  if (e.done) return;
  if (sim.stock('silicon') < 80) {                 // reach-back: the supply strip's own advice
    for (const id of ['foundry', 'smelter', 'scriptorium']) act(sim, { type: 'buy', era: 1, node: id, n: 1 });
  }
  if (countOf(sim, 'dataset') < 22) act(sim, { type: 'buy', era: 3, node: 'dataset', n: 1 });
  if (countOf(sim, 'model') < 16) act(sim, { type: 'buy', era: 3, node: 'model', n: 1 });
  if (tk % 5 === 0 && act(sim, { type: 'trial', era: 3 })) bot.trials++;
  const nM = Object.keys(e.methods || {}).length;
  if (sim.stock('data') > 400 && act(sim, { type: 'fund', era: 3, kind: 'method' })) bot.methods++;
  const wantMethod = nM < 4 && (e.survey || 0) < 95 && sim.stock('data') < 400;
  const k = wantMethod ? 'explore' : ((e.gap || 0) > 0.18 ? 'generalize' : 'fit');
  act(sim, { type: 'focus', era: 3, k: k });
  act(sim, { type: 'generalize', era: 3 });        // self-gated on the validation threshold
}

/* ---------------- Deep: demand-following allocation, heat bang-bang, architecture in order ---------------- */

const RUNS = ['vision', 'language', 'reasoning'];

function deepStep(sim, bot) {
  const c = cfg.e4, e = eraState(sim, 4);
  if (e.done) return;
  for (const s of c.supply) if (sim.stock('silicon') > 1200) act(sim, { type: 'supply', era: 4, key: s.key, n: 1 });
  if (countOf(sim, 'node') < 26) act(sim, { type: 'buyNode', era: 4, n: 1 });
  if (sim.stock('knowledge') < 1500) act(sim, { type: 'hold', era: 4, on: true });
  else if (sim.stock('knowledge') > 2500) act(sim, { type: 'hold', era: 4, on: false });
  if ((e.stabilizer || 0) < 1 && sim.stock('capability') > 400) act(sim, { type: 'arch', era: 4, id: 'stabilizer' });
  for (const a of (c.archTree || [])) {
    if (a.id === 'stabilizer' || (e.arch && e.arch[a.id])) continue;
    if (sim.stock('capability') > (c.arch[a.id] || 0) + 200) act(sim, { type: 'arch', era: 4, id: a.id });
    break;
  }
  if (e.arch && e.arch.checkpoint) {
    const stale = !e.ckpt || (sim.state.t - e.ckpt.t > 30 && (e.heat || 0) < c.heatWarn);
    if (stale) act(sim, { type: 'checkpoint', era: 4 });
    else if (act(sim, { type: 'restore', era: 4 })) bot.restores++;
  }
  if (e.arch && e.arch.distill) { if (act(sim, { type: 'distill', era: 4 })) bot.distills++; }
  // heat bang-bang: hammer the windward run, then flatten out to cool
  bot.cooling = (e.heat || 0) >= c.heatThrottle - 6 ? true : ((e.heat || 0) <= c.heatWarn - 10 ? false : bot.cooling);
  const chase = bot.cooling ? 0.15 : 1;
  const raw = {}; let sum = 0;
  for (const k of RUNS) {
    const dry = (sim.stock(c.feedstock[k]) || 0) < 120;
    raw[k] = dry ? 0.03 : 0.12 + demandOf(sim, k, 0) * 2 + (1 - (e[k] || 0)) * 0.5;
    sum += raw[k];
  }
  const mean = sum / RUNS.length;
  const next = { type: 'alloc', era: 4 };
  for (const k of RUNS) next[k] = Math.max(0.02, mean + (raw[k] - mean) * chase);
  act(sim, next);
  act(sim, { type: 'advance', era: 4 });          // self-gated on the breadth gate
}

/* ---------------- Foundation: rate the traits straight, interpret first, align then improve ------------- */

const GOOD_TRAIT = { honest: 1, helpful: 1 };

function foundationStep(sim, bot) {
  const c = cfg.e5, e = eraState(sim, 5);
  if (e.emerged) return;
  if (e.fb && e.fb.cur) {
    const how = GOOD_TRAIT[e.fb.cur.t] ? 'reward' : 'penalize';
    if (act(sim, { type: 'rate', era: 5, how: how })) bot.rated[how]++;
  }
  if (act(sim, { type: 'cap', era: 5, id: 'interpret' })) bot.caps.push('interpret');
  else for (const cap of c.caps) { if (!e.caps[cap.id] && act(sim, { type: 'cap', era: 5, id: cap.id })) { bot.caps.push(cap.id); break; } }
  if ((e.coherence || 0) < 40 && act(sim, { type: 'align', era: 5 })) { bot.aligns++; return; }
  if (act(sim, { type: 'improve', era: 5 })) bot.improves++;
}

/* ---------------- the surface: answer the windows while the ledger fills ---------------- */

function surfaceStep(sim, bot) {
  const e = eraState(sim, 6);
  if (!e.veto || e.ending) return;
  const how = (e.control || 0) < cfg.e6.controlLow + 12 ? 'veto' : 'approve';
  const av = ofType(menuOf(sim, 6), 'respond');
  if (av.some((a) => a.how === how) && act(sim, { type: 'respond', era: 6, how: how })) bot.vetoes++;
}

/* ---------------- the run ---------------- */

function play(seed, budget) {
  const sim = createSim({ cfg: cfg, eras: [origins, symbolic, statistical, deep, foundation, surface], seed: seed });
  const bot = {
    discos: 0, comms: 0, compiles: 0, contras: 0, trials: 0, methods: 0, restores: 0, distills: 0,
    aligns: 0, improves: 0, vetoes: 0, caps: [], rated: { reward: 0, penalize: 0 }, cooling: false, stalled: false
  };
  const at = {};
  const starve = { data: 0, knowledge: 0, insight: 0, silicon: 0 };
  let emergedTick = -1, lastProof = 0, stallT = 0;
  for (let tk = 0; tk < budget; tk++) {
    const S = sim.state;
    if (S.era >= 2 && !at[2]) at[2] = S.t;
    originsStep(sim, bot);
    if (S.maxEra >= 2) symbolicStep(sim, bot);
    if (S.maxEra >= 3) statisticalStep(sim, bot, tk);
    if (S.maxEra >= 4) deepStep(sim, bot);
    if (S.maxEra >= 5) foundationStep(sim, bot);
    if (S.maxEra >= 6) surfaceStep(sim, bot);
    sim.tick(TICK);
    // the proof-stall watch: hand-writing carries the era while Inference is not moving it
    const acc = (eraState(sim, 2).proofAcc || {})[eraState(sim, 2).activeProof] || 0;
    stallT = acc > lastProof + 0.001 ? 0 : stallT + TICK;
    lastProof = acc;
    bot.stalled = stallT > 2;
    for (const r of FEEDSTOCK) if (S.maxEra >= 4 && !S.flags.emerged && (S.stocks[r] || 0) < 1) starve[r] += TICK;
    if (!at[1] && eraState(sim, 1).done) at[1] = S.t;
    if (!at[3] && S.maxEra >= 3) at[3] = S.t;
    if (!at[4] && S.maxEra >= 4) at[4] = S.t;
    if (!at[5] && S.maxEra >= 5) at[5] = S.t;
    if (!at.emerge && S.flags.emerged) { at.emerge = S.t; emergedTick = tk; }
    if (emergedTick >= 0 && tk - emergedTick >= AFTER_EMERGE) break;
  }
  return { sim: sim, bot: bot, at: at, starve: starve };
}

/** every number in the state, checked for NaN (the log is timestamps and parameters, walked too) */
function nanPath(v, path) {
  if (typeof v === 'number') return isFinite(v) ? null : path;
  if (!v || typeof v !== 'object') return null;
  for (const k of Object.keys(v)) { const hit = nanPath(v[k], path + '.' + k); if (hit) return hit; }
  return null;
}

const mm = (s) => (s === undefined ? 'n/a' : (s / 60).toFixed(1) + 'm');

export async function run(t) {
  const r = play(SEED, MAX_TICKS);
  const sim = r.sim, S = sim.state, bot = r.bot, at = r.at;
  const e5 = eraState(sim, 5), e6 = eraState(sim, 6), e7 = S.eras && S.eras[7];   // era 7 (the mirror) is WO-07

  /* ---------- the report ---------- */
  t.log('bot arc (0.1s ticks, actions only):');
  t.log('  Origins fabricated at ' + mm(at[1]) + ' · ' + bot.discos + ' discoveries · ' + bot.comms + ' commissions');
  t.log('  Symbolic handed off at ' + mm(at[3]) + ' · ' + bot.compiles + ' compiles · ' + bot.contras + ' contradictions');
  t.log('  Statistical generalized at ' + mm(at[4]) + ' · ' + bot.trials + ' trials · ' + bot.methods + ' methods');
  t.log('  Deep advanced at ' + mm(at[5]) + ' · breadth ' + breadth(sim).toFixed(2) + ' · ' + bot.restores + ' restores · ' + bot.distills + ' distills');
  t.log('  EMERGENCE at ' + mm(at.emerge) + ' · agent ' + (e5.agentName || 'n/a') + ' · recursion ' + (e5.recursion || 0) + ' · coherence ' + Math.round(e5.coherence || 0));
  t.log('  feedback: ' + bot.rated.reward + ' rewarded, ' + bot.rated.penalize + ' penalized, ' + ((e5.fb && e5.fb.lapsed) || 0) + ' lapsed, ' + ((e5.fb && e5.fb.badRewards) || 0) + ' bad rewards');
  t.log('  caps: ' + (bot.caps.join(', ') || 'none') + ' · aligns ' + bot.aligns + ' · improves ' + bot.improves);
  t.log('  feedstock starvation (s): ' + FEEDSTOCK.map((k) => k + ' ' + r.starve[k].toFixed(1)).join(' · '));
  t.log('  surface: ' + bot.vetoes + ' windows answered · control ' + Math.round(e6.control || 0) + ' · autonomy ' + Math.round(S.stocks.autonomy || 0));
  for (const row of (surface.ledgerRows ? surface.ledgerRows(sim) : [])) t.log('  ledger · ' + row.join(' · '));
  t.log('  mirror (era 7): ' + (e7 ? 'present' : 'not built yet'));
  t.log('  actions logged: ' + S.log.length + ' · run clock ' + mm(S.t));

  /* ---------- the assertions ---------- */
  t.ok(!!S.flags.emerged, 'the bot reaches emergence');
  t.ok(at.emerge !== undefined && at.emerge < 45 * 60, 'emergence under 45 game-minutes (' + mm(at.emerge) + ')');
  t.ok(origins.done(sim), 'Origins reports done');
  t.ok(symbolic.done(sim), 'Symbolic reports done');
  t.ok(statistical.done(sim), 'Statistical reports done');
  t.ok(deep.done(sim), 'Deep reports done');
  t.ok(foundation.done(sim), 'Foundation reports emerged');
  t.ok(S.maxEra >= 6 && !!sim.eras[6], 'the surface is installed');
  t.eq(nanPath(S, 'state'), null, 'no NaN anywhere in the state');
  t.ok(FEEDSTOCK.every((k) => r.starve[k] < 60), 'no feedstock starves for a minute: ' + FEEDSTOCK.map((k) => r.starve[k].toFixed(0)).join('/'));
  const rows = surface.ledgerRows ? surface.ledgerRows(sim) : [];
  t.ok(Array.isArray(rows) && rows.length >= 2, 'the surface ledger has rows (' + rows.length + ')');

  /* ---------- the whole run replays byte-identically ---------- */
  const live = sim.snapshot(); delete live.log;
  const back = sim.replay(SEED, S.log, S.t); delete back.log;
  t.eq(JSON.stringify(back) === JSON.stringify(live), true, 'replay(seed, log) of the whole bot run is byte-identical');
}
