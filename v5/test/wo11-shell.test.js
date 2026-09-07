// WO-11: the shell's pure parts. app.js only boots where there is a document, so node can import it
// and test the save scrub, the log cap, the offline plan, the era-switch state machine and MAX pricing.
import { capLog, scrubSave, offlinePlan, eraSwitchPlan, maxAffordable, hms, SAVE_V, LOG_CAP, LOG_HEAD, OFFLINE } from '../app.js';

const act = (i) => ({ type: 'inscribe', era: 1, t: i * 0.1, i: i });

export async function run(t) {
  /* ---------- log cap: the opening survives whole, the rest is sampled, the cap holds ---------- */
  const small = [act(0), act(1), act(2)];
  t.eq(capLog(small, 12000, 600).length, 3, 'capLog: a short log is kept whole');
  t.ok(capLog(small, 12000, 600) !== small, 'capLog: returns a copy, never the live log');

  const big = []; for (let i = 0; i < 40000; i++) big.push(act(i));
  const cut = capLog(big, LOG_CAP, LOG_HEAD);
  t.ok(cut.length <= LOG_CAP, 'capLog: never persists more than the cap (' + cut.length + ')');
  t.eq(cut.length, LOG_CAP, 'capLog: fills the cap it is given');
  for (let i = 0; i < LOG_HEAD; i++) if (cut[i].i !== i) { t.ok(false, 'capLog: the first ' + LOG_HEAD + ' actions are contiguous'); break; }
  t.ok(cut[LOG_HEAD - 1].i === LOG_HEAD - 1, 'capLog: the head is the first actions, in order');
  t.eq(cut[cut.length - 1].i, 39999, 'capLog: the last action is always kept');
  let rising = true; for (let i = 1; i < cut.length; i++) if (cut[i].i < cut[i - 1].i) rising = false;
  t.ok(rising, 'capLog: the sample stays in run order');
  const again = capLog(big, LOG_CAP, LOG_HEAD);
  t.eq(again.map(a => a.i).join(',') === cut.map(a => a.i).join(','), true, 'capLog: the same log samples the same way');

  /* ---------- the exact boundary ---------- */
  const edge = []; for (let i = 0; i < LOG_CAP; i++) edge.push(act(i));
  t.eq(capLog(edge, LOG_CAP, LOG_HEAD).length, LOG_CAP, 'capLog: a log exactly at the cap is untouched');

  /* ---------- save scrub ---------- */
  t.eq(scrubSave(null).ok, false, 'scrub: nothing saved is not a save');
  t.eq(scrubSave({ v: 99, state: {} }).reason, 'version', 'scrub: a foreign save version is refused');
  t.eq(scrubSave({ v: SAVE_V, state: { t: 3 } }).reason, 'shape', 'scrub: a save without a graph is refused');
  const dirty = {
    v: SAVE_V, wall: 1234,
    state: { t: 42, era: 3, maxEra: 2, nodes: { a: {} }, log: null, mute: true, speed: 50, dev: true, uiPaused: true, paused: true }
  };
  const clean = scrubSave(dirty);
  t.ok(clean.ok, 'scrub: a well-formed save loads');
  t.eq(clean.state.mute, false, 'scrub: a reload never resumes muted');
  t.eq(clean.state.speed, undefined, 'scrub: the dev speed never survives a reload');
  t.eq(clean.state.dev, undefined, 'scrub: the dev flag never survives a reload');
  t.eq(clean.state.uiPaused, undefined, 'scrub: a paused session never resumes paused');
  t.eq(Array.isArray(clean.state.log), true, 'scrub: the log is always an array');
  t.eq(clean.state.maxEra, 3, 'scrub: maxEra never sits below the active era');
  t.eq(clean.wall, 1234, 'scrub: the wall clock comes back for the offline math');

  /* ---------- offline catch-up: 0.1s steps, 8h cap, deterministic ---------- */
  const ten = offlinePlan(600);
  t.eq(ten.steps, 6000, 'offline: ten minutes away is 6000 steps of 0.1s');
  t.eq(ten.step, OFFLINE.step, 'offline: the step is always 0.1s');
  t.eq(ten.sec, 600, 'offline: the replayed time equals the time away');
  t.eq(offlinePlan(0).steps, 0, 'offline: no absence, no replay');
  t.eq(offlinePlan(0.05).steps, 0, 'offline: less than one step is not replayed');
  t.eq(offlinePlan(-100).steps, 0, 'offline: a clock that went backwards replays nothing');
  const long = offlinePlan(20 * 3600);
  t.eq(long.sec, OFFLINE.cap, 'offline: an absence past the cap replays the cap');
  t.eq(long.capped, true, 'offline: a capped absence says so');
  t.eq(offlinePlan(123.456).steps, offlinePlan(123.456).steps, 'offline: the same absence plans the same steps');
  t.eq(offlinePlan(123.456).steps, 1234, 'offline: the absence floors to the step');

  /* ---------- the era-switch state machine ---------- */
  const boot = eraSwitchPlan(0, 1, { hasDeactivate: false });
  t.eq(boot.steps[0], 'loadEraCss', 'switch: the first mount never tears down a view');
  t.eq(boot.lockAnimate, false, 'switch: the first lock does not animate');
  t.eq(boot.steps.indexOf('hud.clearEra'), -1, 'switch: nothing to clear on the first mount');

  const on = eraSwitchPlan(1, 2, { hasDeactivate: true });
  t.eq(on.steps, ['view.deactivate', 'hud.clearEra', 'loadEraCss', 'mountView', 'world.lockTo', 'titleCard', 'view.sync'], 'switch: a view with deactivate is deactivated first');
  const off = eraSwitchPlan(1, 2, { hasDeactivate: false });
  t.eq(off.steps[0], 'view.dropDom', 'switch: a view without deactivate has its DOM dropped');
  t.eq(off.steps.indexOf('hud.clearEra') < off.steps.indexOf('mountView'), true, 'switch: the HUD is cleared before the next view mounts');
  t.eq(off.steps.indexOf('mountView') < off.steps.indexOf('world.lockTo'), true, 'switch: the view mounts before the camera moves');
  t.eq(off.steps.indexOf('world.lockTo') < off.steps.indexOf('titleCard'), true, 'switch: the title card comes after the lock');
  t.eq(on.lockAnimate, true, 'switch: a handoff animates the camera');
  t.eq(eraSwitchPlan(3, 3, {}).steps.length, 0, 'switch: the same stratum is not a switch');
  t.eq(eraSwitchPlan(2, 0, {}).steps.length, 0, 'switch: era 0 is never mounted');
  t.eq(eraSwitchPlan(5, 6, {}).era, 6, 'switch: the surface layer switches like any stratum');
  t.eq(eraSwitchPlan(4, 2, { hasDeactivate: true }).steps.length, 7, 'switch: going back down runs the same steps');

  /* ---------- MAX pricing, against a stub that prices like the engine ---------- */
  const stubSim = {
    banks: { ore: 100 },
    stock(res) { return this.banks[res] || 0; },
    costOf(id, n) { let s = 0; for (let i = 0; i < n; i++) s += 10 + i; return s; }   // 10, 21, 33, 46, 60, 75, 91, 108
  };
  const node = { id: 'x', cost: { res: 'ore', base: 10, growth: 1 } };
  t.eq(maxAffordable(stubSim, node), 7, 'MAX: buys every unit the bank can pay for');
  stubSim.banks.ore = 9;
  t.eq(maxAffordable(stubSim, node), 1, 'MAX: with nothing affordable it prices a single unit');
  stubSim.banks.ore = 1e9;
  t.eq(maxAffordable(stubSim, node, 16), 16, 'MAX: the search stays inside its limit');
  t.eq(maxAffordable(null, node), 1, 'MAX: no sim, no batch');
  t.eq(maxAffordable(stubSim, { id: 'y' }), 1, 'MAX: a node with no cost is a single unit');

  /* ---------- the away line ---------- */
  t.eq(hms(45), '45s', 'hms: seconds');
  t.eq(hms(600), '10m 0s', 'hms: minutes');
  t.eq(hms(3 * 3600 + 900), '3h 15m', 'hms: hours');
}
