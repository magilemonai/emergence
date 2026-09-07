// engine/receipt.js — WO-12. The receipt: what the player actually did, read back against the history of AI.
// Pure (GUARDRAILS §2): state in, five sections plus a markdown rendering out. Every number comes from the run
// (the action log and the era states), never from a canned script — SPEC pillar 4, "It learns you".
// This is the one page in the game that is allowed to explain (SPEC "The turn" §5, after the film); the lint
// exempts this file for that reason and no other.

/** which stratum an action belongs to when it does not carry `era` itself */
const ACTION_ERA = {
  inscribe: 1, quarry: 1, discover: 1, commission: 1, hands: 1, refine: 1, fabricate: 1,
  writeRule: 2, aim: 2, compile: 2, resolve: 2, prove: 2,
  trial: 3, focus: 3, fund: 3, generalize: 3,
  buyNode: 4, alloc: 4, lock: 4, hold: 4, supply: 4, arch: 4, checkpoint: 4, restore: 4, distill: 4, advance: 4,
  rate: 5, cap: 5, align: 5, improve: 5,
  interrupt: 7, veto: 7
};

const N = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
const obj = (v) => (v && typeof v === 'object' ? v : {});
/** count the truthy entries of a map like eras[1].disco or eras[2].tech */
const owned = (map) => { let n = 0; const m = obj(map); for (const k of Object.keys(m)) if (m[k]) n++; return n; };
const nodeCount = (state, id) => N((obj(obj(state).nodes)[id] || {}).count);
/** 1234567 -> "1,234,567" (no locale, so the receipt reads the same everywhere) */
function num(v) {
  const n = Math.round(N(v)); const s = String(Math.abs(n)); let out = '';
  for (let i = 0; i < s.length; i++) { if (i && (s.length - i) % 3 === 0) out += ','; out += s[i]; }
  return (n < 0 ? '-' : '') + out;
}
const pct = (v) => Math.round(N(v) * 100);
const mins = (sec) => (Math.round(N(sec) / 6) / 10).toFixed(1);

function eraOf(state, a) {
  if (!a) return 0;
  if (typeof a.era === 'number') return a.era;
  if (a.node) { const n = obj(obj(state).nodes)[a.node]; if (n && typeof n.era === 'number') return n.era; }
  return ACTION_ERA[a.type] || 0;
}

/**
 * Read the log once: how many of each action, and when each stratum was first touched.
 * A stratum's span runs from its first action to the first action of the stratum above it.
 */
export function tally(state) {
  const S = obj(state);
  const log = Array.isArray(S.log) ? S.log : [];
  const acts = {}, starts = {};
  for (const a of log) {
    acts[a.type] = (acts[a.type] || 0) + 1;
    const n = eraOf(S, a);
    if (n >= 1 && n <= 5 && (starts[n] === undefined || a.t < starts[n])) starts[n] = a.t;
  }
  // the clock is state.t; a state restored without it falls back to the moment of emergence
  const runEnd = N(S.t) > 0 ? N(S.t) : N(obj(S.eras)[5] && obj(S.eras)[5].emergedT);
  const span = {};
  for (let n = 1; n <= 5; n++) {
    if (starts[n] === undefined) { span[n] = 0; continue; }
    let end = runEnd;
    for (let m = n + 1; m <= 5; m++) if (starts[m] !== undefined) { end = starts[m]; break; }
    span[n] = Math.max(0, end - starts[n]);
  }
  return { acts, starts, span, runEnd };
}

/* ---------- the five texts. One concrete sentence per stratum tying the player's number to the history. ----------
   Kept to templates so the numbers are always the run's own. Plain English, jargon glossed inline, ≤ 60 words. */
const TEXT = {
  1: (d) => 'You struck ' + d.marks + ' marks by hand, then let ' + d.disco + ' discoveries do it for you. '
    + 'Weavers got there first: the Jacquard loom of 1804 read punched cards so a pattern repeated without a person at every thread. '
    + 'Ledgers did the same for numbers. Machines that kept records arrived long before machines that reasoned.',
  2: (d) => 'You hand-wrote ' + d.rules + ' rules and proved ' + d.proofs + ' of them into theorems. '
    + 'Symbolic AI worked exactly this way from 1956 into the 1980s: expert systems such as MYCIN carried medical rules a person typed one at a time. '
    + 'It stalled on the knowledge bottleneck, the plain problem that a human has to write every rule.',
  3: (d) => 'You ran ' + d.trials + ' trials to ' + d.acc + '% and survived ' + d.shifts + ' distribution shifts, which is the world changing after you fit it. '
    + 'From the 1990s the field let systems find their own rules in data, and the daily fight became overfitting: '
    + 'a model that memorizes its examples and misses the next one.',
  4: (d) => 'You ran ' + d.nodes + ' compute nodes, chose ' + d.arch + ' architecture pieces, and held breadth at ' + d.breadth + '%. '
    + 'The 2012 to 2020 decade ran on those same levers. AlexNet won its image contest in 2012 on two gaming graphics cards, '
    + 'and from then on more compute did much of the work that cleverness used to do.',
  5: (d) => 'You rated ' + d.rated + ' outputs, rewarded ' + d.rewarded + ', and let ' + d.lapsed + ' pass without an answer. '
    + d.bad + ' of those rewards went to ambition. That loop is RLHF, reinforcement learning from human feedback: '
    + 'the system learns what you approve of. Reward the wrong thing often enough and it optimizes for your approval.'
};

const TITLE = {
  1: 'Automation and the ledger',
  2: 'Rules, 1956 to 1980',
  3: 'The statistical turn',
  4: 'Deep learning, 2012 to 2020',
  5: 'Feedback and the alignment question'
};
const ERA_NAME = { 1: 'Origins', 2: 'Symbolic', 3: 'Statistical', 4: 'Deep', 5: 'Foundation' };

/** every number the texts and stat lines use, read defensively (a stratum the run never reached reads as zero) */
function figures(state) {
  const S = obj(state), E = obj(S.eras), T = tally(S);
  const e1 = obj(E[1]), e2 = obj(E[2]), e3 = obj(E[3]), e4 = obj(E[4]), e5 = obj(E[5]), e7 = obj(E[7]);
  const fb = obj(e5.fb);
  const runs = [N(e4.vision), N(e4.language), N(e4.reasoning)];
  const breadth = Math.cbrt(Math.max(0, runs[0]) * Math.max(0, runs[1]) * Math.max(0, runs[2]));
  return {
    t: T,
    1: {
      min: mins(T.span[1]), marks: num(T.acts.inscribe), disco: num(owned(e1.disco)),
      foundries: num(nodeCount(S, 'foundry')), comms: num(e1.commDone)
    },
    2: {
      min: mins(T.span[2]), rules: num(T.acts.writeRule), proofs: num(owned(e2.tech)),
      compiles: num(T.acts.compile), axioms: num(obj(S.stocks).axioms)
    },
    3: {
      min: mins(T.span[3]), trials: num(N(e3.trials) || N(T.acts.trial)), acc: pct(e3.accuracy),
      methods: num(owned(e3.methods)), shifts: num(e3.shifts), focus: num(T.acts.focus)
    },
    4: {
      min: mins(T.span[4]), nodes: num(nodeCount(S, 'node')), arch: num(owned(e4.arch) + (N(e4.stabilizer) > 0 ? 1 : 0)),
      breadth: pct(breadth), steers: num(T.acts.alloc)
    },
    5: {
      min: mins(T.span[5]), rated: num(fb.n), rewarded: num(fb.rewarded), penalized: num(fb.penalized),
      lapsed: num(fb.lapsed), bad: num(fb.badRewards), emerged: mins(e5.emergedT),
      agent: typeof e5.agentName === 'string' && e5.agentName ? e5.agentName : 'the agent',
      ending: typeof e7.ending === 'string' && e7.ending ? e7.ending : (typeof obj(S.flags).ending === 'string' ? S.flags.ending : 'open')
    }
  };
}

function statLine(n, f) {
  const d = f[n];
  if (n === 1) return d.min + ' min · ' + d.disco + ' discoveries · ' + d.foundries + ' foundries · ' + d.marks + ' hand strikes';
  if (n === 2) return d.min + ' min · ' + d.proofs + ' proofs · ' + d.rules + ' rules by hand · ' + d.compiles + ' compiles';
  if (n === 3) return d.min + ' min · ' + d.trials + ' trials · ' + d.acc + '% accuracy · ' + d.methods + ' methods · ' + d.shifts + ' shifts';
  if (n === 4) return d.min + ' min · ' + d.nodes + ' compute nodes · ' + d.arch + ' architecture pieces · ' + d.breadth + '% breadth';
  return d.min + ' min · ' + d.rated + ' outputs rated · ' + d.rewarded + ' rewarded · ' + d.lapsed + ' lapsed · ending ' + d.ending;
}

/**
 * receipt(state) -> { sections: [{era, name, title, stat, text}] × 5, markdown, run }
 * The pure export the acceptance test imports. Safe on a partial run: an unreached stratum reads as zeros.
 */
export function receipt(state) {
  const f = figures(state);
  const sections = [];
  for (let n = 1; n <= 5; n++) {
    sections.push({
      era: n, name: ERA_NAME[n], title: TITLE[n],
      stat: statLine(n, f), text: TEXT[n](f[n]).replace(/\s+/g, ' ').trim()
    });
  }
  const run = {
    minutes: mins(f.t.runEnd), agent: f[5].agent, ending: f[5].ending,
    actions: (Array.isArray(obj(state).log) ? state.log.length : 0), emergedAt: f[5].emerged
  };
  const md = ['# EMERGENCE · the receipt', '',
    run.minutes + ' min · ' + num(run.actions) + ' actions · ' + run.agent + ' · ending ' + run.ending, ''];
  for (const s of sections) { md.push('## ' + s.era + '. ' + s.name + ': ' + s.title, '', s.stat, '', s.text, ''); }
  md.push('_Your run, read back against the history it repeated._', '');
  return { sections: sections, markdown: md.join('\n'), run: run };
}

export default receipt;
