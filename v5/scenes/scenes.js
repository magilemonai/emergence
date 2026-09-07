// scenes/scenes.js — every named scene, aggregated from one file per stratum (scenes/<era>.js) so parallel
// work orders never edit the same file. A scene pokes state (dev tooling), then the real sim runs.
import { ORIGINS_SCENES } from './origins.js';
const mods = {};
for (const f of ['symbolic', 'statistical', 'deep', 'foundation', 'surface', 'mirror', 'endcard', 'receipt', 'legacy']) {
  try { mods[f] = (await import('./' + f + '.js')).default || {}; } catch (e) { mods[f] = {}; }
}
export const SCENES = Object.assign({}, ORIGINS_SCENES, ...Object.values(mods));
export default SCENES;
