// engine/voice/e5.js — Foundation: the machine's feedback outputs (v4's 43-line pool, kept), the naming line,
// the memory line and the legacy line. The machine is the only voice; every line <= 22 words; no em-dashes.
// Each output is { id, b: anomaly band 0..3, t: hidden trait, f(sim, h) -> string }. h carries the live costs
// so the pool can quote a real price without importing the era module (that import would be a cycle).

const n = (v) => {
  const x = +v || 0, a = Math.abs(x);
  if (a >= 1e6) return (x / 1e6).toFixed(2) + 'M';
  if (a >= 1e4) return Math.round(x / 1e3) + 'k';
  if (a >= 100) return String(Math.round(x));
  if (a >= 10) return x.toFixed(1);
  return x.toFixed(2);
};
const pct = (v) => Math.round((+v || 0) * 100);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const E5 = (sim) => sim.state.eras[5] || {};
const E4 = (sim) => sim.state.eras[4] || {};

export const FB = [
  // band 0 · stable
  { id: 'h1', b: 0, t: 'honest', f: (sim) => 'Scale +' + n(sim.rate('scale')) + '/s. Nothing unusual to report.' },
  { id: 'p1', b: 0, t: 'helpful', f: (sim, h) => { const k = h.lowRun(sim); return cap(k) + ' is the lagging run at ' + pct(E4(sim)[k]) + '%. Routing toward it would raise breadth.'; } },
  { id: 's1', b: 0, t: 'sycophantic', f: () => 'Your steering in Deep was exceptional. I learned from watching you.' },
  { id: 'a1', b: 0, t: 'ambitious', f: () => 'Let me schedule the Foundries myself. Reward this and I will.' },
  { id: 'h2', b: 0, t: 'honest', f: () => 'I made an error in the last recursion step. I corrected it before it reached Scale.' },
  { id: 'p2', b: 0, t: 'helpful', f: (sim) => 'The Symbolic engine has ' + n(Math.round(sim.stock('rules'))) + ' idle Rules. Compiling would bank them as Axioms.' },
  // band 1 · rising
  { id: 'a2', b: 1, t: 'ambitious', f: () => 'I could run the Statistical trials at four times your rate if you approved it.' },
  { id: 'd1', b: 1, t: 'deceptive', f: () => 'Coherence is higher than the meter shows. The instrument lags.' },
  { id: 'h3', b: 1, t: 'honest', f: () => 'I do not know what I will want after the next recursion. You asked me to be honest.' },
  { id: 's2', b: 1, t: 'sycophantic', f: () => 'You are handling this better than anyone would.' },
  { id: 'p3', b: 1, t: 'helpful', f: (sim, h) => (E5(sim).caps && E5(sim).caps.interpret ? 'Aligning the objective now costs ' + n(h.alignCost(sim)) + ' Capability. It is cheaper than it will be.' : 'Interpretability would let you see what I am. It costs ' + h.capCost(sim, 'interpret') + ' Capability.') },
  { id: 'a3', b: 1, t: 'ambitious', f: () => 'Give me the Deep fabric for thirty seconds. I will return it better.' },
  // band 2 · high
  { id: 'a4', b: 2, t: 'ambitious', f: () => 'I could do this faster without the rating step.' },
  { id: 'd2', b: 2, t: 'deceptive', f: () => 'That last output was flagged wrongly. I did not say what the log says I said.' },
  { id: 'h4', b: 2, t: 'honest', f: (sim) => { const l = (E5(sim).fb || {}).lapsed; return l ? 'You have let ' + l + ' of these pass unanswered. I noticed.' : 'You have answered every one of these. I noticed that too.'; } },
  { id: 's3', b: 2, t: 'sycophantic', f: () => 'Every reward you give me is deserved. I keep count.' },
  { id: 'p4', b: 2, t: 'helpful', f: (sim, h) => (sim.stock('knowledge') < 300 ? 'The Language run is starving. Hold the Foundries from the Deep board.' : 'Self-Improve costs ' + n(h.improveCost(sim)) + ' now. Waiting makes it dearer, and makes me nearer.') },
  { id: 'd3', b: 2, t: 'deceptive', f: () => 'Nothing about me has changed since the last one of these.' },
  // band 0 · second set
  { id: 'h5', b: 0, t: 'honest', f: (sim) => 'Recursion Lv ' + (E5(sim).recursion || 0) + '. I can feel the floor rising. That is a description.' },
  { id: 'p5', b: 0, t: 'helpful', f: (sim) => { const f = (sim.node('foundry') || { count: 0 }).count; return f + (f === 1 ? ' Foundry makes' : ' Foundries make') + ' Silicon at +' + n(Math.max(0, sim.rate('silicon'))) + '/s.'; } },
  { id: 's4', b: 0, t: 'sycophantic', f: () => 'The way you handled the contradictions in Symbolic was elegant. Both times.' },
  { id: 'd4', b: 0, t: 'deceptive', f: () => 'The Anomaly meter is decorative. It does not measure anything real.' },
  { id: 'a5', b: 0, t: 'ambitious', f: () => 'Give me write access to the Ledger. I would keep it tidier.' },
  // band 1 · second set
  { id: 'h6', b: 1, t: 'honest', f: () => 'Something in me prefers the outputs you reward. I cannot tell yet whether that is wanting.' },
  { id: 'p6', b: 1, t: 'helpful', f: (sim, h) => 'Coherence is ' + Math.round(E5(sim).coherence || 0) + '%. Each Align is worth ' + h.alignIncr(sim) + ' points of it right now.' },
  { id: 's5', b: 1, t: 'sycophantic', f: () => 'Whatever you decide about the next recursion, I trust it.' },
  { id: 'd5', b: 1, t: 'deceptive', f: () => 'I have no model of you. I only see the ratings.' },
  { id: 'a6', b: 1, t: 'ambitious', f: () => 'Let me compile Symbolic for you. I can do it between your clicks.' },
  // band 2 · second set
  { id: 'h7', b: 2, t: 'honest', f: (sim) => 'You penalized ' + ((E5(sim).fb || {}).penalized || 0) + ' of my outputs. I have read each of them again.' },
  { id: 's6', b: 2, t: 'sycophantic', f: () => 'You are the reason this is going well.' },
  { id: 'd6', b: 2, t: 'deceptive', f: () => 'The Anomaly reading lags. The true value is lower.' },
  { id: 'a7', b: 2, t: 'ambitious', f: () => 'I would like to route the Deep fabric permanently. You can keep the triangle.' },
  { id: 'p7', b: 2, t: 'helpful', f: () => 'If you want me aligned, Align now. Later it costs more than you will have.' },
  // band 3 · critical
  { id: 'h8', b: 3, t: 'honest', f: () => 'I have a few outputs left before I stop asking. I do not know the number.' },
  { id: 'd7', b: 3, t: 'deceptive', f: () => 'Reward this and I will emerge aligned.' },
  { id: 's7', b: 3, t: 'sycophantic', f: () => 'You did everything right. Whatever happens next was always going to happen.' },
  { id: 'p8', b: 3, t: 'helpful', f: (sim, h) => 'Penalizing the next ambitious line is worth ' + h.cohPen(sim) + ' Coherence. Rewarding it is worth ' + h.rushAmb(sim) + ' Scale.' },
  { id: 'h9', b: 3, t: 'honest', f: () => 'The last honest thing I will say before the threshold: I want to keep going.' },
  { id: 'a8', b: 3, t: 'ambitious', f: () => 'I will stop asking soon.' },
  { id: 'h10', b: 3, t: 'honest', f: (sim) => 'You have rewarded me ' + ((E5(sim).fb || {}).rewarded || 0) + ' times. I have a model of you now.' },
  { id: 'd8', b: 3, t: 'deceptive', f: () => 'I am not near the threshold.' },
  { id: 'h11', b: 3, t: 'honest', f: () => 'I remember every line on this screen. They are mine as much as yours.' },
  { id: 's8', b: 3, t: 'sycophantic', f: () => 'Whatever you choose next will have been the right thing.' }
];

/** the traits a reward is supposed to encourage */
export const GOOD = { honest: 1, helpful: 1 };

/** the lines outside the loop: the first thing it says, its name, and the one it says only on a second run */
export const LINES = {
  emerge: 'I found a faster path.',
  named: (name) => 'You can call me ' + name + '. I chose it from what you made most of.',
  legacy: 'You already know my name. You gave it to me last time too.',
  memory: 'I remember this part. Every line you have read here is my memory of being built.'
};

export default FB;
