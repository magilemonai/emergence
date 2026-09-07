// scenes/legacy.js: run 2 at the first mark (WO-10).
// Dev tooling. It applies a legacy to the live sim, presses the first mark, installs the legacy fx, and frames
// the column slot so the dark surface above the Foundation slot and the bedrock are in one shot. In play the
// player meets the same layer by zooming out or pressing `?`; the strata between are empty until they build them.
import { applyToFresh } from '../engine/legacy.js';
import { installLegacyFx } from '../render/fx.js';
import { STRATUM_H, WORLD_W, stratumTop } from '../engine/types.js';

/** a finished run 1: named, symbiotic, and it kept the rule nobody wrote */
const PRIOR = {
  runs: 1,
  name: 'NOUS',
  ending: 'symbiotic',
  oddRule: 4471,
  firstMinute: [{ t: 0.4, type: 'inscribe', era: 1 }, { t: 1.1, type: 'inscribe', era: 1 }, { t: 6.2, type: 'discover', era: 1, id: 'tally' }],
  emergedT: 1180,
  t: 2240
};

const RAIL_PX = 54, PAD_PX = 30;

/** frame the whole column slot under the rail: the dark layer at the top, the bedrock at the bottom */
function frameColumn(world, vp) {
  const top = stratumTop(6), bot = stratumTop(1) + STRATUM_H;
  const band = vp.h - RAIL_PX - PAD_PX * 2;
  const cam = world.camera;
  cam.zoom = band / (bot - top);
  cam.x = WORLD_W / 2;
  cam.y = (top + bot) / 2 - ((RAIL_PX + band / 2) - vp.h / 2) / cam.zoom;
}

/** scenes run before app.js publishes window.__V5; pick it up on the next turn of the loop */
function afterBoot(fn) {
  if (typeof window === 'undefined') return;
  const w = window;
  w.setTimeout(() => { if (w.__V5) fn(w.__V5); }, 0);
}

export const LEGACY_SCENES = {
  // the cold open of a second run: one mark on the stone, and a ceiling that was not there the first time
  'boot-run2': (sim) => {
    applyToFresh(sim.state, PRIOR);
    sim.apply({ type: 'inscribe', era: 1 });
    sim.tick(0.1);
    afterBoot((V) => {
      installLegacyFx({ world: V.world, sim: V.sim, doc: document });
      frameColumn(V.world, { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight });
    });
  }
};

export default LEGACY_SCENES;
