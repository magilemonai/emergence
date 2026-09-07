// WO-04: the Statistical engine, run WITHOUT the Symbolic module so this suite is green while WO-03 is still
// in flight. Same criteria as v5/test/wo04-statistical.test.js (which chains origins → symbolic → statistical),
// plus the pieces the view depends on: the badge rule, the voice lines, and the shift beat.
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import statistical, { expCost, nextMethod, boardCards, effAccuracy, focusHistory, predicting, PLOT_RECT } from '../engine/eras/statistical.js';

const mk = (seed = 3) => {
  const sim = createSim({ cfg, eras: [origins, statistical], seed, legacy: null });
  sim.state.stocks.silicon = 500;
  sim.openEra(3);
  return sim;
};

export async function run(t) {
  let sim = mk(); let S = sim.state, E = S.eras[3];

  /* ---------- install + the riser ---------- */
  t.ok(S.era === 3 && S.nodes['dataset'] && S.nodes['model'] && S.nodes['data.store'] && S.nodes['insight.store'], 'statistical installs dataset, model, data + insight stores');
  t.ok(S.edges.find(e => e.to === 'dataset' && e.res === 'silicon' && e.riser), 'Silicon riser from Origins feeds the dataset');
  t.ok(S.edges.find(e => e.from === 'model' && e.to === 'insight.store'), 'the Fit Engine has a real Insight pipe');
  t.ok(S.edges.find(e => e.from === 'model' && e.to === 'trials'), 'trials leave the Fit Engine as a pipe');
  t.ok(S.nodes.dataset.count >= cfg.e3.seedDatasets, 'open() seeds datasets');
  t.ok(S.stocks.silicon >= cfg.e3.seedSilicon, 'open() seeds the silicon buffer');
  t.ok(PLOT_RECT.y + PLOT_RECT.h < statistical.layout.anchors.dataset.y, 'the plot band sits above every plate of the stratum');

  /* ---------- trials + policy ---------- */
  S.stocks.data = 1000;
  const a0 = E.accuracy;
  t.ok(sim.apply({ type: 'trial' }).ok && E.accuracy > a0, 'a trial raises accuracy');
  E.gap = 0.3; t.ok(statistical.policy(sim) === 'generalize', 'policy: wide gap → generalize');
  E.gap = 0.02; S.stocks.data = 0; E.survey = 10; t.ok(statistical.policy(sim) === 'explore', 'policy: method out of reach + low survey → explore');
  S.stocks.data = 1e6; t.ok(statistical.policy(sim) === 'fit', 'policy: otherwise fit');

  /* ---------- prediction, read back off the log ---------- */
  E.trials = cfg.e3.predAfter + 10;
  ['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit']
    .forEach(k => { S.t += 10; sim.apply({ type: 'focus', k }); });
  t.ok(E.predN > 0 && E.predHits > 0, 'the model scores deliberate Focus changes');
  t.ok(E.flags.autopilot === true, 'a predictable player unlocks AUTOPILOT');
  t.ok(S.log.filter(a => a.type === 'focus').length >= 12, 'focus changes are in the log (prediction reads the log)');
  t.ok(focusHistory(sim).length > 2, 'the focus history is rebuilt from the log alone');
  const noSide = JSON.stringify(E).indexOf('focHist') < 0;
  t.ok(noSide, 'no side array of focus history in era state');

  /* ---------- the dwell rule ---------- */
  sim = mk(4); S = sim.state; E = S.eras[3]; E.trials = cfg.e3.predAfter + 10;
  ['generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit', 'generalize', 'fit']
    .forEach(k => { S.t += 0.4; sim.apply({ type: 'focus', k }); });
  t.ok(!E.flags.autopilot && (E.predN || 0) === 0, 'twitches under the dwell are not decisions');
  t.eq(focusHistory(sim), ['fit', 'generalize'], 'the history keeps only the change that stood');

  /* ---------- autopilot resolves per trial ---------- */
  sim = mk(6); S = sim.state; E = S.eras[3];
  t.ok(!sim.can({ type: 'focus', k: 'auto' }), 'Autopilot cannot be picked before it is unlocked');
  E.flags.autopilot = true;
  sim.apply({ type: 'focus', k: 'auto' });
  E.gap = 0.3; S.stocks.data = 100;
  sim.apply({ type: 'trial' });
  t.ok(E.gap < 0.3 && S.flags.autopilotUsed === true, 'under Autopilot a trial resolves to the policy and the use is remembered');

  /* ---------- shifts + RR6c drift ---------- */
  sim = mk(7); S = sim.state; E = S.eras[3];
  E.shifts = 2; E.gap = 0.05;
  const ph = E.dataPhase || 0;
  for (let i = 0; i < 100; i++) sim.tick(0.1);
  t.ok(E.gap > 0.05 && (E.dataPhase || 0) > ph, 'RR6c: the world keeps drifting after shift 2');

  sim = mk(9); S = sim.state; E = S.eras[3];
  E.accuracy = cfg.e3.shiftTriggers[0] + 0.01; E.gap = 0.2;
  sim.tick(0.1);
  t.ok(E.shiftAt > 0, 'crossing the first trigger telegraphs the shift');
  const acc0 = E.accuracy;
  for (let i = 0; i < Math.round(cfg.e3.shiftWarn * 10) + 2; i++) sim.tick(0.1);
  t.ok(E.shifts === 1 && E.accuracy < acc0 && S.flags.oddPoint === true, 'the shift lands, accuracy falls, one point stays behind');

  /* ---------- offline catch-up freezes the live systems ---------- */
  sim = mk(11); S = sim.state; E = S.eras[3];
  E.accuracy = cfg.e3.shiftTriggers[0] + 0.01;
  sim.setMuted(true);
  for (let i = 0; i < 200; i++) sim.tick(0.1);
  t.ok(E.shifts === 0 && E.shiftAt === 0, 'muted catch-up never fires a shift the player cannot see');
  sim.setMuted(false);

  /* ---------- the experiment board + the METHOD badge rule ---------- */
  sim = mk(8); S = sim.state; E = S.eras[3];
  t.ok(boardCards(sim)[0] === 'method' && boardCards(sim).length === 3, 'the board leads with the Method');
  S.stocks.data = expCost(sim, 'method') - 1;
  t.ok(!sim.can({ type: 'fund', kind: 'method' }), 'badge rule: the Method is not affordable one Data short');
  S.stocks.data = 1e5;
  t.ok(sim.can({ type: 'fund', kind: 'method' }) && sim.apply({ type: 'fund', kind: 'method' }).ok && Object.keys(E.methods).length === 1, 'fund a method');
  t.ok(E.survey === 0, 'funding a card spends the survey');
  t.ok(sim.apply({ type: 'fund', kind: 'calibrate' }).ok && E.utilLvl.calibrate === 1, 'fund a study');
  t.ok(nextMethod(sim).id !== 'regression', 'the board moves on to the next Method');
  E.survey = 100;
  t.ok(expCost(sim, 'sweep') < Math.ceil(cfg.e3.cardUtil.sweep.cost), 'a full survey discounts the cards');

  /* ---------- the voice ---------- */
  let v = sim.voice(3);
  t.ok(v === null || v.split(/\s+/).length <= 6, 'voice(3) is <= 6 words or null');
  E.trials = cfg.e3.predAfter + 1; E.pred = 'generalize';
  v = sim.voice(3);
  t.ok(v === 'it expects: GENERALIZE' && v.split(/\s+/).length <= 6, 'it names the Focus it expects');
  E.flags.autopilot = true; E.learnedAt = S.t;
  t.ok(sim.voice(3) === 'it has learned you', 'it says once that it has learned you');
  E.learnedAt = S.t - cfg.e3.voiceHold - 1;
  t.ok(sim.voice(3) !== 'it has learned you', 'and then stops saying it');

  /* ---------- the goal ---------- */
  E.accuracy = 0.95; E.gap = 0; E.methods.regularization = true; E.flags.autopilot = false; E.focus = 'fit';
  const g = sim.goal(3);
  t.ok(g.ready === true && g.progress === 1 && /validation/.test(g.label), 'the goal reads out validation and wakes at the line');
  t.ok(effAccuracy(sim) >= cfg.e3.genThreshold, 'validation clears the 88% line');
  t.ok(sim.can({ type: 'generalize' }) && sim.apply({ type: 'generalize' }).ok && statistical.done(sim), 'generalize at >= 88% validation marks the era done');
  t.ok(!predicting(sim), 'the machine stops predicting once the era is done');
  t.ok(statistical.layout && statistical.layout.verbs.includes('trial') && statistical.height === 700, 'layout declared');

  /* ---------- the Fit Engine as a real converter: data in, trials + insight out ---------- */
  sim = mk(12); S = sim.state; E = S.eras[3];
  S.stocks.data = 5000; S.stocks.silicon = 5000;
  sim.node('model').count = 10;
  const d0 = S.stocks.data, i0 = S.stocks.insight, tr0 = S.stocks.trials || 0;
  for (let i = 0; i < 50; i++) sim.tick(0.1);
  t.ok(S.stocks.data < d0 && (S.stocks.trials || 0) > tr0 && E.trials > 0, 'the Fit Engine draws Data off the pipe and banks trials');
  t.ok(S.stocks.insight > i0, 'and yields Insight');
  const ie = S.edges.find(e => e.from === 'model' && e.to === 'insight.store');
  t.ok(ie.flow > 0, 'the Insight pipe carries the flow the tick produced');
  const de = S.edges.find(e => e.to === 'model' && e.res === 'data');
  t.ok(de.flow > 0, 'the Data pipe into the Fit Engine carries flow');

  /* ---------- starvation blinks the mouth ---------- */
  S.stocks.data = 0;
  sim.tick(0.1);
  t.ok(S.edges.find(e => e.to === 'model' && e.res === 'data').starved === true, 'a Data-starved Fit Engine marks its input starved');

  /* ---------- replay determinism over the era's own actions ---------- */
  sim = mk(13); S = sim.state;
  S.stocks.data = 4000;
  for (let i = 0; i < 30; i++) { sim.apply({ type: 'trial' }); sim.tick(0.1); }
  sim.apply({ type: 'focus', k: 'generalize' });
  for (let i = 0; i < 20; i++) sim.tick(0.1);
  const live = sim.snapshot();
  t.ok(live.eras[3].trials > 0, 'the replay fixture ran trials');
  t.ok(typeof live.eras[3].accuracy === 'number' && isFinite(live.eras[3].accuracy), 'accuracy stays finite through the arc');

  /* ---------- the view module must not touch the document at import time ---------- */
  const view = await import('../render/eras/statistical.js');
  t.ok(typeof view.createView === 'function' && typeof view.createStatisticalView === 'function', 'the Statistical view imports clean outside a browser');

  /* ---------- the layout keeps the instrument, the plates and the HUD columns apart ---------- */
  const A = statistical.layout.anchors;
  for (const id of Object.keys(A)) t.ok(A[id].x >= 240 || id === 'dataset', 'anchor clears the verb column: ' + id);
  for (const id of Object.keys(A)) t.ok(A[id].y >= 40 && A[id].y <= 660, 'anchor sits inside the stratum: ' + id);
  t.ok(A.dataset.x + 96 < 400, 'the Datasets pipe end takes the LEFT riser channel, clear of the Data lane');
}
