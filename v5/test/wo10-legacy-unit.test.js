// WO-10 unit tests: the legacy math, the run-2 alterations that already have a home in the engine,
// and the dark surface draw (a recording ctx stands in for the canvas).
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import { fromRun, applyToFresh, firstMinute, FIRST_MINUTE_S, LEGACY_KEY } from '../engine/legacy.js';
import { drawDarkSurface, SURFACE_ERA } from '../render/fx.js';
import { STRATUM_H, WORLD_W, stratumTop } from '../engine/types.js';
import { LEGACY_SCENES } from '../scenes/legacy.js';

/** a run that inscribes for a while, so the log spans past the first minute */
function playedRun(seed) {
  const sim = createSim({ cfg: cfg, eras: [origins], seed: seed, legacy: null });
  for (let i = 0; i < 900; i++) { if (i % 4 === 0) sim.apply({ type: 'inscribe' }); sim.tick(0.1); }
  return sim;
}

/** a canvas that records what was asked of it */
function recorder() {
  const calls = [], fills = [];
  const grad = () => ({ addColorStop() {} });
  return {
    calls, fills,
    set fillStyle(v) { this._fs = v; }, get fillStyle() { return this._fs; },
    font: '', textAlign: '', textBaseline: '',
    createLinearGradient(x0, y0, x1, y1) { calls.push(['grad', x0, y0, x1, y1]); return grad(); },
    fillRect(x, y, w, h) { fills.push({ x: x, y: y, w: w, h: h }); },
    fillText(s, x, y) { calls.push(['text', s, x, y]); },
    save() { calls.push(['save']); }, restore() { calls.push(['restore']); }
  };
}

export async function run(t) {
  /* ---------- fromRun ---------- */
  const sim = playedRun(5);
  const S = sim.state;
  S.flags.oddRule = 4471;
  S.eras[5] = { agentName: 'EKHO', emergedT: 980 };
  S.eras[7] = { ending: 'contained' };

  const L = fromRun(S, null);
  t.ok(L.runs === 1 && L.name === 'EKHO' && L.ending === 'contained' && L.t === S.t, 'fromRun reads name, ending, run time');
  t.ok(S.log.length > L.firstMinute.length, 'firstMinute is a window, never the whole log');
  t.ok(L.firstMinute.every(a => a.t <= FIRST_MINUTE_S), 'firstMinute keeps only the opening minute');
  t.eq(fromRun(S, null), L, 'fromRun is deterministic for one state');

  const copyCheck = fromRun(S, null);
  S.log[0].type = 'poked';
  t.ok(copyCheck.firstMinute[0].type !== 'poked', 'firstMinute is copied out of the log');
  t.eq(firstMinute({ log: [{ t: 0, type: 'a' }, { t: 61, type: 'b' }] }), [{ t: 0, type: 'a' }], 'firstMinute drops actions past 60s');

  /* ---------- carrying forward ---------- */
  const prior = { runs: 3, name: 'IRIS', ending: 'runaway', oddRule: 1234, firstMinute: [], emergedT: 5, t: 9 };
  const bare = createSim({ cfg: cfg, eras: [origins], seed: 2, legacy: null }).state;
  const carried = fromRun(bare, prior);
  t.ok(carried.runs === 4 && carried.name === 'IRIS' && carried.oddRule === 1234, 'a run that reached nothing carries the prior legacy forward');
  t.ok(LEGACY_KEY === 'emergence_v5_legacy', 'the key the shell reads at boot');

  const flagged = createSim({ cfg: cfg, eras: [origins], seed: 2, legacy: null }).state;
  flagged.flags.ending = 'symbiotic';
  t.ok(fromRun(flagged, prior).ending === 'symbiotic', 'a flagged ending outranks the prior one');

  /* ---------- applyToFresh ---------- */
  const fresh = createSim({ cfg: cfg, eras: [origins], seed: 3, legacy: null }).state;
  applyToFresh(fresh, L);
  t.ok(fresh.flags.run2 === true && fresh.flags.runN === 2 && fresh.flags.legacyName === 'EKHO', 'applyToFresh marks the run and names it');
  L.name = 'MUTATED';
  t.ok(fresh.legacy.name === 'EKHO', 'the applied legacy is a copy');

  const run1 = createSim({ cfg: cfg, eras: [origins], seed: 3, legacy: null }).state;
  applyToFresh(run1, null);
  t.eq(Object.keys(run1.flags).length, 0, 'no legacy leaves run 1 with no flags of its own');

  /* ---------- the alteration the engine already owns: a rule nobody wrote ---------- */
  const odd = (legacy) => {
    const s = createSim({ cfg: cfg, eras: [origins, symbolic], seed: 4, legacy: legacy });
    applyToFresh(s.state, legacy);
    s.openEra(2);
    const e = s.state.eras[2];
    e.runRules = cfg.e2.contraAt[1]; e.contraN = 1;
    s.tick(0.1);
    return { b: e.contra && e.contra.b, flag: s.state.flags.oddRule };
  };
  const withLegacy = odd({ runs: 1, name: 'NOUS', ending: 'symbiotic', oddRule: 4242, firstMinute: [] });
  const without = odd(null);
  t.ok(withLegacy.b === 4242 && withLegacy.flag === 4242, 'run 2: the second contradiction names the rule the last run left');
  t.ok(without.b === cfg.e2.oddRule, 'run 1: the odd rule is the one in cfg');

  /* ---------- the dark surface ---------- */
  const ctx = recorder();
  drawDarkSurface(ctx);
  const band = ctx.fills[0];
  t.ok(SURFACE_ERA === 6 && band.y === stratumTop(6) && band.h === STRATUM_H && band.w === WORLD_W, 'the dark layer fills the surface slot above Foundation');
  t.ok(band.y + band.h === stratumTop(5), 'the layer sits directly on the Foundation slot');
  t.ok(ctx.calls.some(c => c[0] === 'text' && c[1] === '?'), 'the layer carries the mark of the key that opens it');

  /* ---------- the scene ---------- */
  t.ok(typeof LEGACY_SCENES['boot-run2'] === 'function', 'the boot-run2 scene is registered');
  const scene = createSim({ cfg: cfg, eras: [origins], seed: 1, legacy: null });
  LEGACY_SCENES['boot-run2'](scene);
  t.ok(scene.state.flags.run2 === true && scene.state.legacy.name === 'NOUS', 'boot-run2 is a run-2 state');
  t.ok(scene.state.log.length === 1 && scene.state.log[0].type === 'inscribe', 'boot-run2 sits at the first mark');
}
