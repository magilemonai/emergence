// Fable: the operated-cadence seam (CONTRACT sim.setCadence). An era at cadence m produces m× per wall second,
// its pipes carry m× flow, its module tick sees m× dt, and the field survives snapshot/restore and replay.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';

export async function run(t) {
  const seen = [];
  const probe = { id: 9, name: 'Probe', height: 700, install() {}, open() {}, tick(sim, dt) { seen.push(dt); }, actions: {}, goal() { return { progress: 0, ready: false, label: '' }; }, voice() { return null; }, layout: { anchors: {}, verbs: [], goal: '' }, done() { return false; } };
  const mk = () => { const s = createSim({ cfg, eras: [origins, probe], seed: 3, legacy: null }); const sc = s.state.nodes.scribe; sc.locked = false; sc.count = 10; sc.outputs = [{ res: 'marks', rate: 1 }]; return s; };   // the scribe is a discovery in play; here it is just a live source
  const live = mk(); const m0 = live.state.stocks.marks; for (let i = 0; i < 10; i++) live.tick(0.1); const base = live.state.stocks.marks - m0;
  const fast = mk(); fast.setCadence(1, 1.6); const m1 = fast.state.stocks.marks; for (let i = 0; i < 10; i++) fast.tick(0.1); const quick = fast.state.stocks.marks - m1;
  t.ok(base > 0 && Math.abs(quick / base - 1.6) < 1e-6, 'an era at cadence 1.6 produces 1.6x per wall second');
  const eScribe = fast.state.edges.find(e => e.from === 'scribe' && e.res === 'marks');
  const eLive = live.state.edges.find(e => e.from === 'scribe' && e.res === 'marks');
  t.ok(eScribe && eLive && Math.abs(eScribe.flow / eLive.flow - 1.6) < 1e-6, 'its pipes carry 1.6x flow per wall second (particles speed up)');
  t.ok(Math.abs(fast.state.rates.marks / live.state.rates.marks - 1.6) < 1e-6, 'rail rates are per wall second');
  seen.length = 0; fast.openEra(9); fast.setCadence(9, 2); fast.tick(0.1);
  t.ok(seen.length === 1 && Math.abs(seen[0] - 0.2) < 1e-9, 'a module tick receives dt x cadence');
  fast.setCadence(9, 1); t.ok(!(9 in fast.state.cadence), 'cadence 1 clears the entry');
  const snap = fast.snapshot(); const back = mk(); back.restore(snap);
  t.ok(back.state.cadence[1] === 1.6, 'cadence survives snapshot/restore');
  t.ok(mk().state.cadence && Object.keys(mk().state.cadence).length === 0, 'a fresh state has an empty cadence map (everything live)');
}
