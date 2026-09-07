// v5/app.js — boot: one sim over every era module that exists, one world, one HUD, and the view of the active
// stratum. Era engine modules and views are discovered by convention (engine/eras/<name>.js, render/eras/<name>.js)
// so parallel work orders never edit this file. WO-11 hardens it (save, settings, live era switching, routing).
//
// The shell logic that has no DOM in it (the save scrub, the log cap, the offline plan, the era-switch plan)
// is exported and tested in node; boot() runs only where there is a document to build into.
import { createSim } from './engine/sim.js';
import cfg from './engine/cfg.js';
import { createWorld } from './render/world.js';
import { createHud } from './render/hud.js';
import { SCENES } from './scenes/scenes.js';
import { STRATA } from './render/palette.js';
import { titleCard, rupture as fxRupture, operated as fxOperated, endingSequence as fxEnding } from './render/fx.js';
import VOICE from './engine/voice.js';

export const ERA_FILES = ['origins', 'symbolic', 'statistical', 'deep', 'foundation', 'surface', 'mirror'];

export const SAVE_KEY = 'emergence_v5';
export const LEGACY_KEY = 'emergence_v5_legacy';
export const SAVE_V = 1;
/** the engine never truncates state.log (replay exactness); the SAVE layer does, keeping the opening intact */
export const LOG_CAP = 12000;
export const LOG_HEAD = 600;
/** offline catch-up: 8h of wall time, replayed in 0.1s muted steps */
export const OFFLINE = { cap: 8 * 3600, step: 0.1, maxSteps: 288000 };
export const AUTOSAVE_S = 5;
export const BUY_MODES_MAX = 'MAX';

/* ============================ pure shell logic (test/wo11-*.test.js) ============================ */

/**
 * capLog(log, cap, head): what the save keeps. The first `head` actions survive whole (the film's opening
 * and the first minute the mirror replays); the rest is stride-sampled down to the cap, last action kept.
 */
export function capLog(log, cap, head) {
  const src = log || [];
  const max = Math.max(1, cap || LOG_CAP);
  const keepHead = Math.min(head === undefined ? LOG_HEAD : head, max);
  if (src.length <= max) return src.slice();
  const out = src.slice(0, keepHead);
  const rest = src.slice(keepHead);
  const room = Math.max(1, max - keepHead);
  for (let i = 0; i < room; i++) out.push(rest[Math.floor(i * rest.length / room)]);
  const last = rest[rest.length - 1];
  if (out[out.length - 1] !== last) {
    if (out.length >= max) out[out.length - 1] = last; else out.push(last);
  }
  return out;
}

/**
 * scrubSave(raw): validate a parsed save and strip everything that belongs to a session and not to a run.
 * A reload must never resume muted, paused, or at a dev speed.
 */
export function scrubSave(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'empty' };
  if (raw.v !== SAVE_V) return { ok: false, reason: 'version' };
  const st = raw.state;
  if (!st || typeof st !== 'object' || typeof st.t !== 'number' || !st.nodes) return { ok: false, reason: 'shape' };
  st.mute = false;
  delete st.speed; delete st.dev; delete st.uiPaused; delete st.paused;
  if (!Array.isArray(st.log)) st.log = [];
  if (typeof st.era !== 'number' || st.era < 1) st.era = 1;
  if (typeof st.maxEra !== 'number' || st.maxEra < st.era) st.maxEra = st.era;
  const wall = typeof raw.wall === 'number' && isFinite(raw.wall) ? raw.wall : 0;
  return { ok: true, state: st, wall: wall };
}

/**
 * offlinePlan(awaySec, opts): how the absence is replayed. Fixed 0.1s steps, capped at 8h, and floored to
 * the step so the same absence always produces the same number of ticks.
 */
export function offlinePlan(awaySec, opts) {
  const o = opts || {};
  const cap = o.cap || OFFLINE.cap, step = o.step || OFFLINE.step, maxSteps = o.maxSteps || OFFLINE.maxSteps;
  const raw = Math.max(0, +awaySec || 0);
  const away = Math.min(cap, Math.floor(raw / step) * step);
  let steps = Math.round(away / step);
  if (steps > maxSteps) steps = maxSteps;
  return { sec: Math.round(steps * step * 10) / 10, step: step, steps: steps, capped: raw > cap };
}

/**
 * eraSwitchPlan(prev, next, opts): the order the shell tears down one stratum view and stands up the next.
 * A view without deactivate() has its DOM dropped instead (hud.clearEra does the removing).
 */
export function eraSwitchPlan(prev, next, opts) {
  const o = opts || {};
  const to = +next || 0;
  const from = +prev || 0;
  if (to < 1 || to === from) return { steps: [], lockAnimate: false, era: to };
  const steps = [];
  if (from) steps.push(o.hasDeactivate ? 'view.deactivate' : 'view.dropDom', 'hud.clearEra');
  steps.push('loadEraCss', 'mountView', 'world.lockTo', 'titleCard', 'view.sync');
  return { steps: steps, lockAnimate: from > 0, era: to };
}

/**
 * maxAffordable(sim, node, limit): how many units of this node the bank can pay for right now.
 * Doubling then binary search, so a MAX price costs a handful of costOf calls per plate.
 */
export function maxAffordable(sim, node, limit) {
  if (!sim || !node || !node.cost) return 1;
  const bank = sim.stock(node.cost.res) || 0;
  const cap = limit || 256;
  if (sim.costOf(node.id, 1) > bank) return 1;
  let lo = 1, hi = 2;
  while (hi <= cap && sim.costOf(node.id, hi) <= bank) { lo = hi; hi *= 2; }
  hi = Math.min(hi, cap);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (sim.costOf(node.id, mid) <= bank) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** hms(sec): the away time, said the way a toast says it */
export function hms(sec) {
  const s = Math.max(0, Math.round(+sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  if (h) return h + 'h ' + m + 'm';
  if (m) return m + 'm ' + r + 's';
  return r + 's';
}

/* ============================ boot ============================ */

const hasDom = typeof document !== 'undefined' && !!document.getElementById;
if (hasDom && document.getElementById('hud')) boot();

async function boot() {
  const win = window, doc = document;
  const ASSETS = win.__V5_ASSETS || '../assets/';
  // a module that exists but fails to parse must be LOUD: a swallowed import once hid a syntax error from every probe
  const tryImport = async (p) => { try { return await import(p); } catch (e) { if (!/Failed to fetch|404|Cannot find module|Failed to resolve/i.test(String(e && e.message))) console.error('v5 module failed to load: ' + p, e); return null; } };

  const eras = [], viewMods = {};
  for (const f of ERA_FILES) {
    const m = await tryImport('./engine/eras/' + f + '.js');
    if (m && m.default) eras.push(m.default);
    const v = await tryImport('./render/eras/' + f + '.js');
    if (v && (v.createView || v.default)) viewMods[f] = v;
  }
  eras.sort((a, b) => a.id - b.id);
  const byId = {}; for (const e of eras) byId[e.id] = e;
  const nameOf = (id) => ERA_FILES[id - 1];

  const reduced = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const scene = (location.hash.match(/scene=([\w-]+)/) || [])[1] || '';

  /* ---------- storage: a save, a legacy record, and a memory fallback when the browser says no ---------- */
  const store = (function () {
    try { const s = win.localStorage; s.setItem('__v5', '1'); s.removeItem('__v5'); return s; }
    catch (e) { const mem = {}; return { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } }; }
  })();
  const readJSON = (key) => { try { return JSON.parse(store.getItem(key) || 'null'); } catch (e) { return null; } };

  /* ---------- the run ---------- */
  const legacyMod = await tryImport('./engine/legacy.js');           // WO-10 builds it; the shell only calls it
  const legacyRec = readJSON(LEGACY_KEY);
  const sim = createSim({ cfg: cfg, eras: eras, seed: 1, legacy: legacyRec });
  if (legacyMod && legacyMod.applyToFresh) { try { legacyMod.applyToFresh(sim.state, legacyRec); } catch (e) { } }   // the legacy API takes the State

  let away = null;
  if (!scene) {
    const loaded = scrubSave(readJSON(SAVE_KEY));
    if (loaded.ok) {
      for (let n = 1; n <= loaded.state.maxEra; n++) sim.openEra(n);   // install the modules the run had open
      sim.restore(loaded.state);                                      // then the saved graph wins
      const plan = offlinePlan(loaded.wall ? (Date.now() - loaded.wall) / 1000 : 0);
      if (plan.steps > 0) {
        sim.setMuted(true);
        for (let i = 0; i < plan.steps; i++) sim.tick(plan.step);
        sim.setMuted(false);
        away = plan;
      }
    }
  }

  /* ---------- bulk buy: the views cycle 1/10/25, the shell adds MAX on the wrap ---------- */
  const buy = {
    _n: (cfg.e1 && cfg.e1.buyModes && cfg.e1.buyModes[0]) || 1,
    max: false,
    get n() { return this._n; },
    set n(v) {
      if (v === 1 && typeof this._n === 'number' && this._n > 1 && !this.max) { this.max = true; return; }
      this.max = false; this._n = v;
    }
  };

  /* ---------- frame ---------- */
  let view = null, curEra = 0, paused = false, resetting = false;
  const hud = createHud(doc.getElementById('hud'), {
    onVerb: (n) => view && view.onVerb && view.onVerb(n),
    onGoal: () => view && view.onGoal && view.onGoal(),
    onPause: (b) => setPaused(b),
    onRestart: () => restart(),
    onMusic: () => toggleMusic(),
    onVol: (k, v) => { if (audio) { const p = {}; p[k] = v; audio.setVol(p); } }
  });
  const world = createWorld({
    canvas: doc.getElementById('world'), hud: hud.plateLayer, sim: sim, reduced: reduced, hudApi: hud, assets: ASSETS,
    buyN: (node) => (buy.max ? maxAffordable(sim, node) : (typeof buy.n === 'number' ? buy.n : 1)),
    milestone: (n) => { const m = byId[n.era]; return m && m.milestoneOf ? m.milestoneOf(sim, n) : null; },
    starved: (n) => sim.state.edges.some((e) => e.to === n.id && e.starved)
  });
  world.setHud(hud);
  // WO-10: run 2 shows the surface layer dark above Foundation from the first mark, and a `?` key lifts the camera to it
  let legacyFx = null;
  try { const fxMod = await import('./render/fx.js'); if (fxMod.installLegacyFx) legacyFx = fxMod.installLegacyFx({ world: world, sim: sim, doc: doc }); } catch (e) { legacyFx = null; }

  /* ---------- audio: silent until a gesture, three knobs, the bed follows the stratum ---------- */
  let audio = null;
  const audioMod = await tryImport('./audio/index.js');
  if (audioMod && audioMod.createAudio) {
    try {
      audio = audioMod.createAudio({ sim: sim, world: world, base: ASSETS, doc: doc, win: win, store: store });
      audio.arm(doc);
      hud.setMusicOn(audio.music);
      hud.setVols(audio.vol);
    } catch (e) { audio = null; }
  }
  function toggleMusic() {
    if (!audio) return;
    audio.start();
    hud.setMusicOn(audio.setMusic(!audio.music));
  }

  /** the view interface every render/eras/<name>.js exports as createView(opts):
   *  { sync(), onVerb(name), onGoal(), activate?(), deactivate?() }, where opts = { hud, world, sim, buy, assets } */
  function mountView(eraId) {
    const mod = viewMods[nameOf(eraId)]; if (!mod) return null;
    const make = mod.createView || mod.default;
    const v = make({ hud: hud, world: world, sim: sim, buy: buy, assets: ASSETS, reduced: reduced, jump: jump });
    if (v && v.activate) v.activate();
    return v;
  }
  /** per-era stylesheet by convention (render/eras/<name>.css); a missing file is fine */
  function loadEraCss(eraId) {
    const href = './render/eras/' + nameOf(eraId) + '.css';
    if (doc.querySelector('link[data-era-css="' + href + '"]')) return;
    const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = href; link.setAttribute('data-era-css', href);
    link.onerror = () => link.remove();
    doc.head.appendChild(link);
  }
  function showTitle(n) {
    if (world.titleCard) return world.titleCard(n);                    // the world may own the card later
    const p = STRATA[n] || STRATA[1];
    const f = sim.state.flags || {}, L = sim.state.legacy;
    const sub = f.run2 && VOICE.legacy ? VOICE.legacy.remembers(L && L.name) + ' · ' + VOICE.legacy.run(f.runN) : null;
    return titleCard({ doc: doc, era: n, name: (byId[n] && byId[n].name) || p.name, font: p.font, reduced: reduced, sub: sub });
  }

  /** switchEra(n): the whole handoff, in the order eraSwitchPlan names */
  function switchEra(n) {
    const plan = eraSwitchPlan(curEra, n, { hasDeactivate: !!(view && view.deactivate) });
    if (!plan.steps.length) return null;
    if (view && view.deactivate) view.deactivate();
    view = null;
    if (curEra) hud.clearEra();
    const from = curEra;
    curEra = n;
    loadEraCss(n);
    view = mountView(n);
    hud.finishRail();
    syncOperated(n);
    if (n === 6 && from === 5 && !ruptureFx) {
      // the turn: a world event owns the camera for its length and IS the title (SPEC The turn 2); no card, no lock here
      startRupture(null);
    } else {
      world.lockTo(n, plan.lockAnimate);
      if ((plan.lockAnimate || !scene) && !endingRun && jumping !== n) showTitle(n);   // no card on a jump, on a scene boot, or during the ending
      if (jumping === n) jumping = 0;
    }
    if (audio) audio.setBed(n);
    if (view && view.sync) view.sync();
    return plan;
  }

  /* ---------- strata jumps: a logged visit moves the active era; the loop then switches the view (no card) ---------- */
  let jumping = 0, speed = 1;
  function jump(n) {
    if (endingRun || sim.state.era === 7 || n === sim.state.era) return false;
    if (!sim.can({ type: 'visit', era: n })) return false;
    jumping = n;
    return sim.apply({ type: 'visit', era: n }).ok;
  }
  function setSpeed(n) { speed = typeof n === 'number' && n > 0 ? Math.min(20, n) : 1; return speed; }

  /* ---------- the ending: reveal → film → ghosts → endcard, once, when the mirror resolves (SPEC The turn 5) ---------- */
  let endingRun = null, ghostsBeat = false;
  function startEnding(ending) {
    if (endingRun) return endingRun;
    const which = ending || (sim.state.eras[7] && sim.state.eras[7].ending) || sim.state.flags.ending || 'contained';
    try {
      endingRun = fxEnding({
        world: world, hud: hud, sim: sim, ending: which, reduced: reduced, doc: doc,
        onBeat: (beat) => {
          if (beat === 'ghosts') { ghostsBeat = true; curEra = 0; switchEra(1); }     // your first minute plays on your bedrock
          else if (ghostsBeat) { ghostsBeat = false; syncOperated(curEra); }
        },
        onDone: () => { checkEnding(); }
      }) || { cancel() {} };
    } catch (e) { endingRun = { cancel() {} }; }
    return endingRun;
  }

  /* ---------- the turn: the shell starts the rupture and keeps the operated look in step with the state ---------- */
  let ruptureFx = null;
  function startRupture(holdMs) {
    try {
      ruptureFx = fxRupture({ world: world, hud: hud, sim: sim, audio: audio, reduced: reduced, doc: doc });
      if (typeof holdMs === 'number' && ruptureFx && ruptureFx.hold) ruptureFx.hold(holdMs);
    } catch (e) { ruptureFx = null; world.lockTo(6, true); }
    return ruptureFx;
  }
  function syncOperated(n) {
    const emerged = !!(sim.state.flags && sim.state.flags.emerged) && !ghostsBeat;   // the ghosts replay YOUR hands: no operated look
    if (emerged) for (let k = 1; k <= 4; k++) world.operated.add(k);
    try { fxOperated(emerged && n >= 1 && n <= 5, doc); } catch (e) { }   // everything below the surface is its now (Foundation's verbs included)
  }

  function applyScene(name) {
    const f = SCENES[name];
    if (f) f(sim);
    if (view) { if (view.deactivate) view.deactivate(); view = null; hud.clearEra(); }
    curEra = 0;
    switchEra(sim.state.era);                              // mounts the view, locks the camera, shows the card
    world.scene(name || '');                               // overview / bench handling
    if (!/overview/.test(name)) world.lockTo(sim.state.era, false);
    if (view && view.openDrawer) view.openDrawer(name);    // a scene may ask the view to open its drawer
    else if (/research/.test(name) && view && view.toggleResearch) view.toggleResearch();
    if (view && view.sync) view.sync();
  }
  applyScene(scene);
  if (away) hud.toast('WHILE YOU WERE AWAY', hms(away.sec) + ' of production', 'event');

  /* ---------- pause, restart, save ---------- */
  function setPaused(b) { paused = hud.setPaused(b); return paused; }
  function save() {
    if (scene || resetting) return false;
    const st = sim.snapshot();
    st.log = capLog(st.log, LOG_CAP, LOG_HEAD);
    st.mute = false;
    try { store.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_V, state: st, wall: Date.now() })); return true; }
    catch (e) { return false; }
  }
  function restart() {
    resetting = true;
    try { store.removeItem(SAVE_KEY); } catch (e) { }
    location.reload();
  }
  win.addEventListener('beforeunload', () => { if (!resetting) save(); });
  doc.addEventListener('visibilitychange', () => { if (doc.hidden && !resetting) save(); });

  /* ---------- the ending writes the legacy the next run reads ---------- */
  let legacyWritten = false;
  function checkEnding() {
    if (legacyWritten || !legacyMod || !legacyMod.fromRun) return;
    const f = sim.state.flags || {};
    const e7 = sim.state.eras && sim.state.eras[7];
    if (!f.ending && !f.ended && !(e7 && e7.ending)) return;   // the mirror (era 7) writes eras[7].ending
    try {
      const rec = legacyMod.fromRun(sim.state, legacyRec);
      if (rec) { store.setItem(LEGACY_KEY, JSON.stringify(rec)); legacyWritten = true; }
    } catch (e) { legacyWritten = true; }
  }

  /* ---------- dead clicks: a press on the HUD that hits nothing actionable. UI telemetry only (CONTRACT): the surface's
     ledger reads flags.dead; replay never reproduces it and comparisons strip it. The world canvas is not counted (panning). */
  const ACTIONABLE = 'button, input, select, textarea, a, label, [role="button"], .v5set';
  const hudRoot = doc.getElementById('hud');
  if (hudRoot) hudRoot.addEventListener('pointerdown', (e) => {
    if (!e.target || !e.target.closest || e.target.closest(ACTIONABLE)) return;
    if (!e.target.closest('.col, .rail, .plate-layer')) return;         // toasts and tips are not surfaces you press
    const f = sim.state.flags; f.dead = (f.dead || 0) + 1;
  });

  /* ---------- keys: the strata jumps, the verbs, the drawer, the settings ---------- */
  doc.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'Escape') {
      if (world.isOverview) return;                        // the world takes Escape out of the overview
      hud.openSettings(!hud.settingsOpen);
      return;
    }
    if (hud.settingsOpen) return;
    const m = byId[sim.state.era];
    if (e.code === 'Space') { e.preventDefault(); if (m && m.layout && m.layout.verbs[0] && view && view.onVerb) view.onVerb(m.layout.verbs[0]); }
    else if (e.key === 'q' || e.key === 'Q') { if (m && m.layout && m.layout.verbs[1] && view && view.onVerb) view.onVerb(m.layout.verbs[1]); }
    else if (e.key === 'r' || e.key === 'R') { if (view && view.toggleResearch) view.toggleResearch(); }
    else if (/^[1-6]$/.test(e.key)) jump(+e.key);
  });

  let last = performance.now(), sinceSave = 0;
  function loop(now) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!paused) {
      if (speed === 1) sim.tick(dt); else { let d = dt * speed; while (d > 1e-9) { const st = Math.min(0.1, d); sim.tick(st); d -= st; } }   // dev speed: exact 0.1s substeps
      const e7 = sim.state.eras && sim.state.eras[7];
      if (!scene && !endingRun && ((e7 && e7.ending) || sim.state.flags.ending)) startEnding((e7 && e7.ending) || sim.state.flags.ending);   // screenshot scenes drive the fx themselves
      if (!endingRun && sim.state.era !== curEra) { switchEra(sim.state.era); if (legacyFx && legacyFx.sync) { try { legacyFx.sync(); } catch (e) { } } }
      sinceSave += dt;
      if (sinceSave >= AUTOSAVE_S) { sinceSave = 0; save(); }
      checkEnding();
    }
    world.frame(paused ? 0 : dt);
    hud.setBulkTag(buy.max);
    if (audio) audio.tick(paused ? 0 : dt);
    if (view && view.sync) view.sync();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /** settle(): let the camera and the plates reach their resting frame before a screenshot */
  function settle() {
    for (let i = 0; i < 3; i++) world.frame(0.016);
    if (view && view.sync) view.sync();
    world.frame(0);
  }
  win.__V5 = {
    rupture: startRupture,        // (holdMs?) starts the world event and freezes it at holdMs for a screenshot
    ending: startEnding,          // (ending?) runs reveal → film → ghosts → endcard once
    jump: jump,                   // (n) the strata jump the keys use
    setSpeed: setSpeed,           // dev: run the sim n× real time in exact substeps (never saved)
    sim, world, hud, get view() { return view; }, scene, settle, applyScene, eras, buy,
    save, restart, switchEra, setPaused, get paused() { return paused; }, get audio() { return audio; },
    holdSave: (b) => { resetting = !!b; return resetting; },   // tools freeze persistence while they doctor a save
    away, store, SAVE_KEY, LEGACY_KEY
  };
}
