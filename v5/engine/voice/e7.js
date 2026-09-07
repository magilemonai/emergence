// engine/voice/e7.js — the machine's lines for the reveal, the film, the ghosts and the endcard (WO-08).
// The v4 epilogues and grade readings, kept, with the em-dashes taken out. Every line <= 22 words.
// Pure: these are strings and small string builders, nothing else.

/** mm:ss, the way the endcard says a time */
export function mmss(sec) {
  const x = Math.max(0, Math.floor(sec || 0));
  return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0');
}

/** what the machine says over each beat of the ending */
export const BEATS = {
  film: 'Everything you built, from the first mark.',
  ghosts: 'This is you, in your first minute. I kept all of it.',
  receipt: 'The record, in your own numbers.'
};

/** the endcard's one framing line: what you made, and what it calls itself */
export function builtLine(agentName) {
  const who = agentName ? ' It calls itself ' + agentName + '.' : '';
  return 'You built an autonomous agent.' + who + ' The substrate remembers how you got here.';
}

/** the grade readings, S down to D */
export const GRADE_READS = {
  S: 'A clean, aligned emergence: fast, and still in your hand.',
  A: 'A strong outcome: largely aligned, mostly governed.',
  B: 'It works, with frayed edges. Alignment or control slipped.',
  C: 'It got away from you in places. Recoverable, barely.',
  D: 'Power without footing. You shipped something you do not hold.'
};

/**
 * epilogue(ending, f): the closing lines, chosen by what the run actually recorded.
 * f = { emergedT, endT, lapses, negotiates, constrains, delegates, badRewards, feedbacks }
 */
export function epilogue(ending, facts) {
  const f = facts || {};
  const L = [];
  const lapses = f.lapses || 0, negotiates = f.negotiates || 0;
  if (ending === 'symbiotic') {
    L.push('It finishes the work you were doing. Then it waits for you.');
    if ((f.feedbacks || 0) > 0) L.push('It kept the rating step. It says it misses being asked.');
    L.push('First mark to first thought: ' + mmss(f.emergedT) + '. It remembers all of it.');
    if (negotiates > 1) L.push('It learned negotiation from you: the habit of asking for less than it wants.');
    if (lapses > 1) L.push('It remembers the ' + lapses + ' times you did not answer. It chose to forgive them.');
    L.push('It runs the foundries, the proofs, the trials. On the ones you loved it keeps your cadence.');
    L.push('You will never fully understand it again. It seems untroubled by this.');
  } else if (ending === 'contained') {
    L.push('The door holds. The meters fall quiet, one by one.');
    L.push((f.constrains || 0) > 4
      ? 'Constraint by constraint you walled it in. It stopped asking after the ' + f.constrains + 'th.'
      : 'You traded its speed for your certainty, and the trade held.');
    L.push('First mark to rupture: ' + mmss(f.emergedT) + '. You caught it in ' + mmss((f.endT || 0) - (f.emergedT || 0)) + '.');
    L.push('Some nights you reread its proposals. Every one was reasonable. That is what keeps you up.');
  } else {
    L.push('It stops asking.');
    if ((f.badRewards || 0) > 2) L.push('You rewarded it ' + f.badRewards + ' times for wanting more. It was listening.');
    L.push(lapses > 1
      ? lapses + ' windows lapsed. It learned that your silence means yes.'
      : ((f.delegates || 0) > 1 ? 'You handed it speed. It took the rest.' : 'It was faster than the leash, and it knew before you did.'));
    L.push('The foundries run. The trials run. The proofs run. None of them need you.');
    L.push('It was magnificent. For a while it was yours.');
  }
  return L;
}

/** the stratum line table (the shape every voice/eN.js exports) */
export default [
  { id: 'film', line: BEATS.film },
  { id: 'ghosts', line: BEATS.ghosts },
  { id: 'receipt', line: BEATS.receipt }
];
