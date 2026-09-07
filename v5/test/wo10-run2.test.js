// Fable: the run-2 alterations that live in Origins and Symbolic (WO-10 proposals 3 and 4).
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import symbolic from '../engine/eras/symbolic.js';
import { applyToFresh } from '../engine/legacy.js';

export async function run(t) {
  const L = { runs: 1, name: 'NOUS', ending: 'symbiotic', oddRule: 4471, firstMinute: [], emergedT: 1200, t: 2000 };
  const mk = (legacy) => { const s = createSim({ cfg, eras: [origins, symbolic], seed: 4, legacy }); applyToFresh(s.state, legacy); return s; };
  const untilComm = (s) => { const e = s.state.eras[1]; e.flags.o_smelter = true; e.flags.o_scriptorium = true; for (let i = 0; i < 400 && !e.comm; i++) s.tick(0.1); return e.comm; };   // commissions cycle once both crafts are discovered
  const c1 = untilComm(mk(null)); t.ok(c1 && c1.signed === null, 'run 1: the commission carries no signature');
  const c2 = untilComm(mk(L)); t.ok(c2 && c2.signed === 'NOUS', 'run 2: the commission is signed with the agent\'s last name');
  const s1 = mk(null); s1.state.stocks.knowledge = 100; s1.openEra(2); const r1 = s1.state.stocks.rules;
  const s2 = mk(L); s2.state.stocks.knowledge = 100; s2.openEra(2); const r2 = s2.state.stocks.rules;
  t.ok(r2 - r1 === cfg.e2.legacyRules && cfg.e2.legacyRules > 0, 'run 2: rules nobody wrote are in the bank when Symbolic opens');
}
