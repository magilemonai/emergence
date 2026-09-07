// WO-08: the rest of the ending. The film's chunked precompute against its unchunked self, the endcard's pure
// numbers (grade, timeline, which ending), the voice's shape, and the three fx against a stub document
// (they build, they hold a beat for a screenshot, and cancel() leaves nothing behind).
import { createSim } from '../engine/sim.js';
import cfg from '../engine/cfg.js';
import origins from '../engine/eras/origins.js';
import { frames, firstMinute, filmPlan, snapshot, endOf } from '../engine/film.js';
import { epilogue, builtLine, GRADE_READS, BEATS, mmss } from '../engine/voice/e7.js';
import { grade, timeline, endingOf } from '../render/eras/endcard.js';
import { reveal, film, ghosts, topStratum } from '../render/fx.js';

/* ---------- the smallest document these fx can be honest against ---------- */
function stubDoc() {
  const mk = (tag) => {
    const style = { setProperty(k, v) { style[k] = v; } };
    const n = {
      tag, className: '', id: '', textContent: '', rel: '', href: '', style: style, children: [], parentNode: null,
      classList: {
        list: {}, add(c) { this.list[c] = 1; }, remove(c) { delete this.list[c]; },
        toggle(c, on) { if (on) this.list[c] = 1; else delete this.list[c]; }, has(c) { return !!this.list[c]; }
      },
      appendChild(c) { c.parentNode = n; n.children.push(c); return c; },
      removeChild(c) { const i = n.children.indexOf(c); if (i >= 0) n.children.splice(i, 1); c.parentNode = null; return c; },
      remove() { if (n.parentNode) n.parentNode.removeChild(n); },
      setAttribute() {}, addEventListener() {}, removeEventListener() {},
      getBoundingClientRect() { return { left: 100, top: 100, width: 40, height: 20 }; },
      querySelectorAll() { return []; }
    };
    return n;
  };
  const doc = mk('#document');
  doc.head = mk('head'); doc.body = mk('body');
  doc.appendChild(doc.head); doc.appendChild(doc.body);
  doc.documentElement = { clientWidth: 1280, clientHeight: 800 };
  doc.createElement = mk;
  doc.getElementById = () => null;
  doc.querySelector = () => null;
  doc.addEventListener = () => {}; doc.removeEventListener = () => {};
  let now = 0; const queue = [];
  doc.defaultView = {
    performance: { now: () => now },
    requestAnimationFrame: (fn) => { queue.push(fn); return queue.length; },
    cancelAnimationFrame: () => {},
    setTimeout: () => 0, clearTimeout: () => {}
  };
  doc.__step = (ms) => { now += ms; const q = queue.splice(0, queue.length); for (const f of q) f(); };
  return doc;
}
function stubWorld() {
  const hooks = {};
  let src = null, over = false;
  return {
    camera: { x: 590, y: 350, zoom: 0.9 }, operated: new Set(), plates: { made: {} },
    onDraw(k, fn) { hooks[k] = fn; return () => { delete hooks[k]; }; },
    lockTo(n) { this.locked = n; over = false; },
    overview() { over = true; this.camera.zoom = 0.24; },
    setSource(fn) { src = fn; },
    locked: 5, hooks: hooks,
    get source() { return src; }, get isOverview() { return over; }
  };
}
function stubHud(doc) {
  const outer = doc.createElement('div'); doc.body.appendChild(outer);
  const root = doc.createElement('div'); outer.appendChild(root);
  return { root: root, plateLayer: doc.createElement('div'), rail: doc.createElement('div') };
}
/** a short Origins run with a real log */
function mkSim(steps) {
  const sim = createSim({ cfg, eras: [origins], seed: 9 });
  for (let i = 0; i < (steps || 900); i++) {
    if (i % 4 === 0) sim.apply({ type: 'inscribe' });
    const av = sim.available();
    if (i % 60 === 0) { const d = av.find((a) => a.type === 'discover'); if (d) sim.apply(d); }
    if (i % 30 === 0) { const b = av.find((a) => a.type === 'buy' && a.node === 'scribe'); if (b) sim.apply(b); }
    sim.tick(0.1);
  }
  return sim;
}
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

export async function run(t) {
  const sim = mkSim();
  const S = sim.state;

  /* ---------- the film, precomputed ---------- */
  const opt = { eras: [origins], cfg: cfg, end: S.t };
  const whole = frames(S.log, 9, 48, opt);
  const chunked = frames(S.log, 9, 48, Object.assign({ chunk: 4 }, opt));
  t.eq(chunked.map((f) => f.t), whole.map((f) => f.t), 'film: a chunked precompute lands on the same frames as one long pass');
  t.near(chunked[47].stocks.marks, whole[47].stocks.marks, 1e-9, 'film: chunking changes nothing about the run it rebuilds');
  t.near(whole[47].stocks.marks, S.stocks.marks, 1e-6, 'film: the last frame is the state you are looking at');

  const counts = whole.map((f) => f.nodes.scribe.count);
  t.ok(counts.every((c, i) => i === 0 || c >= counts[i - 1]), 'film: the column only grows across the film');
  t.ok(counts[47] > counts[0], 'film: the last frame has more than the first (the film shows growth)');
  t.ok(whole[0].nodeOrder.length > 0 && Array.isArray(whole[0].edges), 'film: a frame is a State the world can draw');

  const one = snapshot(S);
  S.stocks.marks += 1000;
  t.ok(Math.abs(one.stocks.marks - S.stocks.marks) > 999, 'film: a snapshot is a deep copy, not a live view');
  S.stocks.marks -= 1000;

  t.eq(endOf([{ t: 10 }, { t: 42 }], 0.3), 42.3, 'film: the run ends at the last action plus the tail');
  t.eq(frames([], 1, 5, opt).length, 5, 'film: an empty log still yields the frames the film asks for');

  const fm = firstMinute(S.log, 12);
  t.ok(fm.length > 0 && fm.every((a) => a.t <= 12), 'ghosts: firstMinute honours the cut it is given');
  t.ok(firstMinute(S.log).length >= fm.length, 'ghosts: the default cut is the wider one (sixty seconds)');

  const plan = filmPlan(S.log, 9, 24, opt);
  t.ok(plan.progress < 1 && !plan.done, 'film: a fresh plan has work left to do');
  plan.work(50);
  t.ok(plan.progress > 0, 'film: one slice moves the plan forward');
  plan.work(Infinity);
  t.ok(plan.done && plan.frames.length === 24, 'film: the plan finishes with exactly its frames');

  /* ---------- the machine's words ---------- */
  for (const kind of ['symbiotic', 'runaway', 'contained']) {
    const lines = epilogue(kind, { emergedT: 1700, endT: 1900, lapses: 3, negotiates: 2, constrains: 6, delegates: 2, badRewards: 4, feedbacks: 11 });
    t.ok(lines.length >= 3, 'voice: ' + kind + ' has an epilogue');
    t.ok(lines.every((l) => words(l) <= 22), 'voice: every ' + kind + ' line stays inside the word budget');
    t.ok(lines.every((l) => l.indexOf('—') < 0), 'voice: no em-dash in the ' + kind + ' epilogue');
  }
  t.ok(epilogue('symbiotic', { lapses: 0, negotiates: 0 }).length < epilogue('symbiotic', { lapses: 3, negotiates: 3, feedbacks: 9 }).length,
    'voice: the epilogue is longer when the run gave it more to remember');
  t.ok(builtLine('IRIS').indexOf('IRIS') > 0 && builtLine('').indexOf('agent') > 0, 'voice: the built line names the agent when it has one');
  t.ok(Object.keys(GRADE_READS).length === 5 && BEATS.film && BEATS.ghosts, 'voice: five grade readings and a line per beat');
  t.eq(mmss(125), '2:05', 'voice: mm:ss');

  /* ---------- the endcard's numbers ---------- */
  const st = { t: 1900, eras: { 5: { emergedT: 1750 }, 6: { ending: 'runaway' } }, flags: {}, log: S.log };
  t.eq(grade(st, { alignment: 100, control: 100 }).letter, 'S', 'endcard: an aligned, governed, quick run grades S');
  t.eq(grade(st, { alignment: 0, control: 0 }).letter, 'D', 'endcard: nothing held grades D');
  t.ok(grade(st, { alignment: 100, control: 100 }).q <= 100, 'endcard: quality is capped at 100');
  t.ok(GRADE_READS[grade(st, { alignment: 60, control: 40 }).letter], 'endcard: every grade carries its reading');

  t.eq(endingOf(st), 'runaway', 'endcard: the surface names the ending when the mirror has not');
  st.eras[7] = { ending: 'symbiotic' };
  t.eq(endingOf(st), 'symbiotic', 'endcard: the mirror has the last word on the ending');
  t.eq(endingOf({}), 'runaway', 'endcard: a state with no ending still names one');

  const rows = timeline({ t: S.t, eras: {}, flags: {}, log: S.log });
  t.ok(rows.length >= 1 && rows[0].name === 'Origins', 'endcard: the timeline starts at the bedrock');
  t.ok(rows.every((r) => r.took >= 0 && r.at >= r.took - 1e-9), 'endcard: every stratum took a real span of the run');

  /* ---------- the fx, against a stub document ---------- */
  const doc = stubDoc(), world = stubWorld(), hud = stubHud(doc);
  t.eq(topStratum(sim), 1, 'reveal: an Origins-only run is a one-stratum column');

  const rv = reveal({ world: world, hud: hud, sim: sim, ending: 'symbiotic', doc: doc });
  t.ok(world.isOverview, 'reveal: the camera is put into the overview at once');
  t.ok(!!world.hooks.reveal, 'reveal: the ending draws its own treatment over the column');
  rv.hold(3000);
  doc.__step(16);
  const nameEl = hud.root.parentNode.children.find((c) => c.className === 'rv').children[0];
  t.ok(nameEl.textContent.length > 0, 'reveal: holding a beat types the ending name');
  t.ok(Math.abs(world.camera.zoom - 0.24) < 1e-6, 'reveal: by then the camera has reached the whole column');
  const ctx = { fillStyle: '', strokeStyle: '', lineWidth: 0, fillRect() {}, beginPath() {}, arc() {}, stroke() {} };
  for (const kind of ['symbiotic', 'runaway', 'contained']) {
    const r2 = reveal({ world: world, hud: hud, sim: sim, ending: kind, doc: doc });
    r2.hold(3000); doc.__step(16);
    world.hooks.reveal(ctx);
    t.ok(true, 'reveal: the ' + kind + ' treatment draws without throwing');
    r2.cancel();
  }
  rv.cancel();
  t.ok(!world.hooks.reveal, 'reveal: cancel takes its draw hook back off the world');
  t.ok(!hud.root.parentNode.children.some((c) => c.className === 'rv'), 'reveal: cancel leaves no card behind');

  const fl = film({ world: world, hud: hud, sim: sim, doc: doc });
  t.ok(typeof world.source === 'function', 'film: the world is drawing the film, not the live run');
  fl.hold(6000);
  doc.__step(16);
  t.ok(fl.frame > 0 && fl.frame < fl.frames.length - 1, 'film: holding six seconds lands in the middle of the twelve');
  t.ok(!!world.source(), 'film: the held frame is a State the world can draw');
  fl.cancel();
  t.ok(world.source === null, 'film: the live run comes back when the film ends');

  const gh = ghosts({ world: world, hud: hud, sim: sim, doc: doc });
  t.eq(world.locked, 1, 'ghosts: the camera drops to the bedrock for the replay');
  t.ok(gh.count > 0 && gh.cursors.length === 2, 'ghosts: two hands replay your first minute');
  gh.hold(4000);
  doc.__step(16);
  t.ok(gh.cursors.every((c) => /translate3d/.test(c.style.transform || '')), 'ghosts: both cursors are placed on the board');
  gh.cancel();
  t.ok(!hud.root.parentNode.children.some((c) => (c.className || '').indexOf('gh-') === 0), 'ghosts: cancel removes the cursors and the line');
}
