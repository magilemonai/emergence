// scenes/endcard.js — the beats of the ending, seeded (WO-08). Each scene plays a plausible finished run into
// the sim (a real first minute on the bedrock, then each stratum in turn), crosses the threshold the way
// scenes/surface.js does, and then hands the world to the fx this order owns.
// The fx need the shell's published handles, so they start a few frames after boot, exactly as surface.js does.

import { toFoundation } from './foundation.js';
import { reveal, film, ghosts } from '../render/fx.js';
import { createView as endcardView } from '../render/eras/endcard.js';

const run = (sim, seconds) => { for (let i = 0; i < Math.round(seconds * 10); i++) sim.tick(0.1); };

/** your first minute on the bedrock, click by click, so the ghosts have real timestamps to replay */
function firstMinute(sim) {
  for (let i = 0; i < 600; i++) {
    if (i % 7 === 0) sim.apply({ type: 'inscribe', era: 1 });
    if (i % 23 === 0) sim.apply({ type: 'quarry', era: 1 });
    if (i % 90 === 0) { const b = sim.available(1).find((a) => a.type === 'buy' && a.node === 'scribe'); if (b) sim.apply(b); }
    if (i % 130 === 0) { const d = sim.available(1).find((a) => a.type === 'discover'); if (d) sim.apply(d); }
    sim.tick(0.1);
  }
}

/** a stretch of the clock spent on one stratum, pressing whatever that stratum offers */
function stretch(sim, era, seconds, every) {
  const gap = every || 25;
  for (let i = 0; i < Math.round(seconds * 10); i++) {
    if (i % gap === 0) { const av = sim.available(era); if (av.length) sim.apply(av[(i / gap) % av.length]); }
    sim.tick(0.1);
  }
}

/** cross the threshold for real: the tick emerges, names the agent and installs the surface layer */
function emerge(sim) {
  const E = sim.state.eras[5];
  if (!E) return null;
  for (const id of ['selfModel', 'toolAccess', 'recursivePlanning', 'worldModel']) sim.apply({ type: 'cap', era: 5, id: id });
  for (let i = 0; i < 5; i++) { E.improveCd = 0; sim.apply({ type: 'improve', era: 5 }); }
  const f = sim.state.flags;
  f.oddRule = 4471; f.oddPoint = true; f.autopilot = true; f.autopilotUsed = true;
  f.oddWind = Math.max(1, sim.state.t - 90); f.dead = 3;
  E.fb.n = 11; E.fb.rewarded = 7; E.fb.penalized = 4; E.fb.lapsed = 2; E.fb.badRewards = 3; E.fb.goodRewards = 4;
  E.coherence = 26;
  sim.state.stocks.scale = sim.cfg.e5.emergeScale + 5;
  sim.tick(0.1);
  run(sim, 4);
  return E;
}

/** the three interrupt records that separate the three endings (SPEC "The turn" 4: no drain, only your choices) */
const CHOICES = {
  symbiotic: ['negotiate', 'negotiate', 'veto'],
  runaway: ['approve', 'lapse', 'lapse'],
  contained: ['veto', 'veto', 'veto']
};

/** a finished run, ending and all. Returns false when this build has no Foundation to finish. */
export function seedRun(sim, ending) {
  firstMinute(sim);
  if (!toFoundation(sim, { cap: 2600 })) return false;
  stretch(sim, 2, 70);
  stretch(sim, 3, 70);
  stretch(sim, 4, 90);
  stretch(sim, 5, 60);
  if (!emerge(sim)) return false;
  const e6 = sim.state.eras[6];
  if (e6) {
    e6.choices = CHOICES[ending] || CHOICES.runaway;
    if (ending === 'symbiotic') { const e5 = sim.state.eras[5]; e5.coherence = 62; e5.fb.badRewards = 0; e5.fb.goodRewards = 8; }
    if (ending === 'contained') sim.state.eras[5].coherence = 12;
  }
  sim.tick(0.1);
  if (!sim.state.eras[7]) sim.state.eras[7] = { ending: ending };   // WO-07 writes this; a build without it still ends
  sim.state.flags.ending = ending;
  return true;
}

/** the fx need world/hud from the shell, which publishes them right after the scene runs */
function afterBoot(fn) {
  if (typeof window === 'undefined' || !window.requestAnimationFrame) return;
  let n = 0;
  const spin = () => {
    const V = window.__V5;
    if (V && V.world && V.hud && n >= 4) { fn(V); return; }
    if (n++ < 90) window.requestAnimationFrame(spin);
  };
  window.setTimeout(spin, 0);
}

const opts = (V, ending) => ({ world: V.world, hud: V.hud, sim: V.sim, ending: ending, doc: document, reduced: false });

/** an endcard scene: the column silhouetted behind the card that names what you made of it */
function card(ending) {
  return (sim) => {
    if (!seedRun(sim, ending)) return;
    afterBoot((V) => { V.world.overview(false); endcardView(opts(V, ending)); });
  };
}

export const ENDCARD_SCENES = {
  // the camera has pulled out, the strata are one silhouette, the ending is halfway through typing itself
  reveal: (sim) => {
    if (!seedRun(sim, 'symbiotic')) return;
    afterBoot((V) => { reveal(opts(V, 'symbiotic')).hold(1700); });
  },

  // the middle of the twelve seconds: frame 144 of 288, the column half grown
  'film-mid': (sim) => {
    if (!seedRun(sim, 'symbiotic')) return;
    afterBoot((V) => { film(opts(V, 'symbiotic')).hold(6000); });
  },

  // your own first minute, replayed on the bedrock by two cursors, with the machine's line under them
  ghosts: (sim) => {
    if (!seedRun(sim, 'symbiotic')) return;
    sim.state.era = 1;                                   // the bedrock's own verbs, for the hands to press
    afterBoot((V) => { ghosts(opts(V, 'symbiotic')).hold(9000); });
  },

  'endcard-symbiotic': card('symbiotic'),
  'endcard-runaway': card('runaway'),
  'endcard-contained': card('contained')
};

export default ENDCARD_SCENES;
