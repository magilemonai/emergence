// engine/legacy.js: what a finished run leaves for the next one (WO-10; SPEC pillar 4 and "The turn" 6).
// Pure. It reads a finished State and returns a small plain object; the storage IO belongs to the shell (WO-11),
// which reads LEGACY_KEY at boot and writes fromRun() at the ending.

/** the localStorage key the shell reads at boot and writes at the ending */
export const LEGACY_KEY = 'emergence_v5_legacy';

/** the window of the log the next run replays as ghost cursors, in game seconds */
export const FIRST_MINUTE_S = 60;
/** a ceiling so a frantic opening minute cannot bloat what is stored */
export const FIRST_MINUTE_MAX = 600;

// where the ending and the name settle: the mirror resolves the ending, Foundation names itself,
// and the surface layer carries both once it exists. First hit wins.
const ENDING_ERAS = [7, 6, 5];
const NAME_ERAS = [5, 6, 7];

const copy = (v) => JSON.parse(JSON.stringify(v));

function pick(state, eras, key) {
  const bag = (state && state.eras) || {};
  for (const n of eras) { const e = bag[n]; if (e && e[key]) return e[key]; }
  return null;
}

/** firstMinute(state): the logged actions with t <= 60, copied so the legacy outlives its state */
export function firstMinute(state) {
  const log = (state && state.log) || [];
  const out = [];
  for (const a of log) {
    if (!a || typeof a.t !== 'number' || a.t > FIRST_MINUTE_S) continue;
    out.push(copy(a));
    if (out.length >= FIRST_MINUTE_MAX) break;
  }
  return out;
}

/**
 * fromRun(state, prior): the legacy a finished run writes.
 * `prior` is the legacy this run was played with (null on a first run); it carries the run count forward
 * and keeps the name and the odd rule alive through a run that never reached them.
 */
export function fromRun(state, prior) {
  const p = prior || {};
  return {
    runs: (typeof p.runs === 'number' ? p.runs : 0) + 1,
    name: pick(state, NAME_ERAS, 'agentName') || p.name || null,
    ending: (state && state.flags && state.flags.ending) || pick(state, ENDING_ERAS, 'ending') || p.ending || null,
    oddRule: (state && state.flags && state.flags.oddRule) || p.oddRule || null,
    firstMinute: firstMinute(state),
    emergedT: pick(state, NAME_ERAS, 'emergedT') || p.emergedT || null,
    t: state && typeof state.t === 'number' ? state.t : 0
  };
}

/**
 * applyToFresh(state, legacy): mark a fresh state as a second (or later) run.
 * A null legacy is a no-op, so run 1 is untouched. Everything the run-2 alterations read hangs off these
 * two fields: `state.legacy` (name, ending, oddRule, firstMinute) and `state.flags.run2`.
 */
export function applyToFresh(state, legacy) {
  if (!state || !legacy) return state;
  state.legacy = copy(legacy);
  state.flags.run2 = true;
  state.flags.runN = (typeof legacy.runs === 'number' ? legacy.runs : 1) + 1;
  if (legacy.name) state.flags.legacyName = legacy.name;
  return state;
}

export default { LEGACY_KEY, FIRST_MINUTE_S, FIRST_MINUTE_MAX, firstMinute, fromRun, applyToFresh };
