// Fable: Statistical's build-here Foundry (the reach-back Deep's bus offers), priced in Silicon.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import statistical, { foundrySupplyCost } from '../engine/eras/statistical.js';
export async function run(t) {
  const sim = createSim({ cfg, eras: [origins, statistical], seed: 4, legacy: null }); const S = sim.state;
  S.stocks.silicon = 1000; sim.openEra(2); sim.openEra(3);
  const f = sim.node('foundry'); f.locked = false; f.count = 2;
  const c0 = foundrySupplyCost(sim, 1);
  t.ok(c0 === Math.floor(cfg.e3.supply.foundry.cost * Math.pow(cfg.e3.supply.foundry.growth, 2)), 'the price is geometric in the Foundry count');
  t.ok(sim.available(3).some(a => a.type === 'supply'), 'supply enumerates on the Statistical board');
  const si = S.stocks.silicon; t.ok(sim.apply({ type: 'supply', era: 3, n: 1 }).ok && f.count === 3 && S.stocks.silicon === si - c0, 'buying one grows the real Origins Foundry and spends Silicon');
  t.ok(foundrySupplyCost(sim, 1) > c0, 'the next one costs more');
  S.stocks.silicon = 0; t.ok(!sim.can({ type: 'supply', era: 3, n: 1 }), 'no Silicon, no Foundry');
  f.locked = true; S.stocks.silicon = 1e6; t.ok(!sim.can({ type: 'supply', era: 3, n: 1 }), 'a Foundry that is not yet discovered cannot be bought from above');
}
