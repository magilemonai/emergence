/* ============================================================================
   FLOW-BOARD KIT — shared JS (v3 · Phase 2)
   Extracted from the 5 verified era-slices; canonical forms per KIT.md.
   Load-bearing: BUILD-ONCE / update-in-place. Never rewrite a live button's
   innerHTML every tick — use the change-detected setters below.

   Shape: a single `KIT` object. Pure helpers are usable under node (no DOM at
   load). DOM/chrome methods are defined lazily and only touch the document when
   called in a browser. Phase 3 inlines this into the single-file game.
   ============================================================================ */
(function (root) {
  'use strict';
  var hasDOM = typeof document !== 'undefined';
  var $ = hasDOM ? function (id) { return document.getElementById(id); } : function () { return null; };

  /* ---------- pure helpers (canonical) ---------- */
  // fmt: superset form — includes the 1e9→B branch (Symbolic/Deep/Foundation) on top of Origins' K/M.
  function fmt(n) {
    n = +n || 0; var a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    if (a >= 100) return n.toFixed(0);
    if (a >= 10) return n.toFixed(1);
    if (a === 0) return '0';
    return n.toFixed(a < 1 ? 2 : 1);
  }
  function esc(s) { return String(s).replace(/"/g, '&quot;'); }

  /* ---------- v4 incremental staples: bulk buy + count milestones ----------
     bulkCost(base,growth,count,n)  = price of the next n units (geometric, floored per unit like unitCost)
     maxAffordable(base,growth,count,have,cap) = largest n whose bulkCost <= have (0 if none)
     batch(mode,base,growth,count,have) -> {n,cost}: mode 1 | 10 | 'max' (S.buyN). n>=1 always (cost may exceed have)
     tierOf(count) / tierMult(count) / nextMilestone(count): ×10/×25/×50/×100 → +25% per tier reached */
  function unitCostAt(base, growth, count) { return Math.floor(base * Math.pow(growth, count)); }
  function bulkCost(base, growth, count, n) { var c = 0; for (var i = 0; i < n; i++) c += unitCostAt(base, growth, count + i); return c; }
  function maxAffordable(base, growth, count, have, cap) { cap = cap || 250; var n = 0, c = 0; while (n < cap) { var u = unitCostAt(base, growth, count + n); if (c + u > have) break; c += u; n++; } return n; }
  function batch(mode, base, growth, count, have) {
    var n = mode === 'max' ? Math.max(1, maxAffordable(base, growth, count, have)) : Math.max(1, +mode || 1);
    return { n: n, cost: bulkCost(base, growth, count, n) };
  }
  var MILESTONES = [10, 25, 50, 100];
  var MILESTONE_BONUS = 0.25;
  function tierOf(count) { var t = 0; for (var i = 0; i < MILESTONES.length; i++) if (count >= MILESTONES[i]) t++; return t; }
  function tierMult(count) { return 1 + MILESTONE_BONUS * tierOf(count); }
  function nextMilestone(count) { for (var i = 0; i < MILESTONES.length; i++) if (count < MILESTONES[i]) return MILESTONES[i]; return null; }
  // pip HTML for a node name row: "7/10" toward the next tier, or "×1.25" when tiered and maxed
  function pipHTML(count) { var nm = nextMilestone(count), t = tierOf(count); return nm ? (count + '/' + nm) + (t ? ' · ×' + (1 + MILESTONE_BONUS * t).toFixed(2) : '') : '×' + (1 + MILESTONE_BONUS * t).toFixed(2) + ' max'; }

  // change-detected setters — the dead-click fix. Byte-identical across all 5 slices.
  function setTxt(el, t) { if (el && el._t !== t) { el.textContent = t; el._t = t; } }
  function setHTML(el, h) { if (el && el._h !== h) { el.innerHTML = h; el._h = h; } }
  function setDis(el, d) { if (el && el.disabled !== d) el.disabled = d; }
  function setAttr(el, k, v) { if (el && el['_a' + k] !== v) { el.setAttribute(k, v); el['_a' + k] = v; } } // Deep (SVG)
  function setText(id, t) { setTxt($(id), t); } // Statistical id-wrapper

  /* ---------- resource registry (one source of truth; replaces per-slice HUE/ICON) ----------
     RES[key] = { hue:'#rrggbb', icon:'assets/..png'|null, glyph:'◈'|null, flavor:'...' }
     Builders read this; stocks/chips accept BOTH image and glyph resources. */
  var RES = {};
  function setRes(reg) { RES = reg || {}; }
  function resVisual(key) { // returns inner HTML for a resource's icon slot (img or hue-colored glyph)
    var r = RES[key] || {};
    if (r.icon) return '<img src="' + r.icon + '" alt="">';
    return '<span class="cglyph" style="color:' + hue(key) + '">' + (r.glyph || '•') + '</span>';
  }
  function hue(key) { return (RES[key] && RES[key].hue) || 'var(--accent)'; }

  /* ---------- gross-flow accumulator (drives connector brightness) ---------- */
  var FLOW = {};
  function flowInit(keys) { FLOW = {}; keys.forEach(function (k) { FLOW[k] = { in: 0, out: 0 }; }); }
  function flowReset() { for (var k in FLOW) { FLOW[k].in = 0; FLOW[k].out = 0; } }
  function fIn(k, a) { if (FLOW[k]) FLOW[k].in += a; }
  function fOut(k, a) { if (FLOW[k]) FLOW[k].out += a; }
  // canonical connGlow: explicit optional opts (Deep's general form). Default derives thru from FLOW.
  // opts = { thru?:0..1, blocked?:bool, norm?:number(=full-brightness gross/tick, default 0.4) }
  function connGlow(res, opts) {
    var f = $('flow-' + res); if (!f) return; opts = opts || {};
    var norm = opts.norm || 0.4;
    var gross = FLOW[res] ? FLOW[res].in + FLOW[res].out : 0;
    var thru = opts.thru != null ? opts.thru : Math.max(0, Math.min(1, gross / norm));
    f.style.setProperty('--thru', (+thru).toFixed(2));
    var idle = opts.thru != null ? (thru < 0.02) : (gross < 0.0005); // explicit-thru (Deep runs) idles on share; derived idles on flow
    f.classList.toggle('idle', idle && !opts.blocked);
    f.classList.toggle('blocked', !!opts.blocked);
  }

  /* ---------- builders (Tier-2 primitives) ---------- */
  function connector(res) {
    return '<div class="flow" id="flow-' + res + '" style="--fc:' + hue(res) + '">' +
      '<svg viewBox="0 0 38 22" preserveAspectRatio="none">' +
      '<line class="track" x1="2" y1="11" x2="36" y2="11"/>' +
      '<line class="pulse" x1="2" y1="11" x2="36" y2="11"/></svg></div>';
  }
  function stock(res, label) {
    var r = RES[res] || {};
    return '<div class="stock" data-tip="' + esc('<i>' + (r.flavor || '') + '</i>') + '">' +
      resVisual(res) + '<div class="sv" id="stk-' + res + '" style="color:' + hue(res) + '">0</div>' +
      '<div class="sl">' + label + '</div></div>';
  }
  function node(key, name, tip, opts) {
    opts = opts || {};
    var iconHTML = opts.icon ? '<img class="nic" src="' + opts.icon + '">' : '';
    // pause lives INLINE in the name row (not absolute) so it can't overlap the Build button — the "bad UX" misclick.
    var pauseHTML = opts.pausable !== false ? ' <button class="pause" id="pause-' + key + '" title="pause / resume">II</button>' : '';
    return '<div class="node" id="node-' + key + '" data-tip="' + esc(tip) + '">' + iconHTML +
      '<div class="nname">' + name + ' <span class="ncount" id="cnt-' + key + '"></span><span class="mpip" id="mp-' + key + '" data-tip="' + esc('<b>Milestones</b> at ×10 · ×25 · ×50 · ×100: each tier +25% to this building, forever.') + '"></span>' + pauseHTML + '</div>' +
      '<div class="nrate" id="rate-' + key + '"></div>' +
      '<button class="buy nbuy" id="buy-' + key + '"></button>' +
      '</div>';
  }
  function chip(key, label) { // rail chip
    var r = RES[key] || {};
    return '<div class="chip" data-tip="' + esc('<i>' + (r.flavor || '') + '</i>') + '">' +
      '<span class="cdot" style="background:' + hue(key) + '22;border:1px solid ' + hue(key) + '55">' + resVisual(key) + '</span>' +
      '<span class="cbody"><span class="clab">' + label + '</span>' +
      '<span class="cval" id="rv-' + key + '" style="color:' + hue(key) + '">0</span></span>' +
      '<span class="cps" id="rp-' + key + '"></span></div>';
  }
  // numbers-first per-requirement cost chips: green+✓ when affordable, grey while short (never red)
  function costHTML(reqs, have) { // reqs = [[key,amount],...]; have(key)=current stock
    return reqs.map(function (pair) {
      var k = pair[0], v = pair[1], ok = have(k) >= v;
      return '<span class="cost-res' + (ok ? ' ok' : '') + '">' + (ok ? '✓ ' : '') + fmt(v) + ' ' + k + '</span>';
    }).join(' + ');
  }

  /* ---------- overlays: float, tooltip, toasts ---------- */
  function floatNum(txt, color, x, y) {
    if (!hasDOM || KIT.MUTE) return;
    var el = document.createElement('div'); el.className = 'float'; el.textContent = txt;
    el.style.color = color; el.style.left = (x - 10) + 'px'; el.style.top = y + 'px';
    $('fx').appendChild(el); setTimeout(function () { el.remove(); }, 900);
  }
  var _tipEl = null;
  function initTip() {
    if (!hasDOM) return; var tip = $('tip'); if (!tip) return;
    function place(e) {
      var m = 15, x = e.clientX + m, y = e.clientY + m, w = tip.offsetWidth, h = tip.offsetHeight;
      if (x + w > innerWidth - 8) x = e.clientX - w - m; if (y + h > innerHeight - 8) y = innerHeight - h - 8;
      if (x < 8) x = 8; if (y < 8) y = 8; tip.style.left = x + 'px'; tip.style.top = y + 'px';
    }
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-tip]') : null;
      if (t && t !== _tipEl) { _tipEl = t; tip.innerHTML = t.getAttribute('data-tip'); tip.classList.add('show'); place(e); }
    });
    document.addEventListener('mousemove', function (e) { if (_tipEl) place(e); });
    document.addEventListener('mouseout', function (e) {
      if (_tipEl) { var to = e.relatedTarget; if (!to || !(to.closest && to.closest('[data-tip]'))) { tip.classList.remove('show'); _tipEl = null; } }
    });
  }
  // toast(head, body, kind) — kind ∈ '' | 'event' | 'edu'; header is .toast-h (no .th clash). Event dwell 8s.
  function toast(head, body, kind) {
    if (!hasDOM || KIT.MUTE) return;
    var el = document.createElement('div'); el.className = 'toast' + (kind ? ' ' + kind : '');
    el.innerHTML = '<div class="toast-h">' + head + '</div><div class="tb">' + body + '</div>';
    var box = $('toasts'); box.appendChild(el);
    while (box.children.length > 2) box.removeChild(box.firstChild);
    if (KIT.rec) KIT.rec('@toast', { head: head });
    var TOAST_DWELL = { event: 8000, ev: 8000, brk: 8000, edu: 9000 }; // event-class toasts dwell longer
    setTimeout(function () { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 400); }, TOAST_DWELL[kind] || 4800);
  }

  /* ---------- sound: playSound(type) with a per-era oscillator profile ----------
     Foundation's generalization. profiles[type] = {osc,f0,f1,g,dur} or a noise burst.
     Set KIT.soundProfile per active era. Falls back to a soft chisel tick. */
  var _actx = null;
  function _ac() { return _actx || (_actx = new (window.AudioContext || window.webkitAudioContext)()); }
  var DEFAULT_SOUND = { osc: 'triangle', f0: 880, f1: 300, g: 0.09, dur: 0.1 };
  var SFX = { vol: 1 }; // master SFX level (0 = silent); persisted via audioLoad/sfxSetVol
  function playSound(type) {
    if (!hasDOM || KIT.MUTE || SFX.vol <= 0) return;
    try {
      var p = (KIT.soundProfile && KIT.soundProfile[type]) || KIT.soundProfile.buy || DEFAULT_SOUND;
      var ctx = _ac(), t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = p.osc || 'triangle';
      o.frequency.setValueAtTime(p.f0, t); o.frequency.exponentialRampToValueAtTime(p.f1 || p.f0, t + (p.dur || 0.06) * 0.6);
      g.gain.setValueAtTime((p.g || 0.09) * SFX.vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (p.dur || 0.1));
      o.start(t); o.stop(t + (p.dur || 0.1) + 0.01);
    } catch (e) {}
  }
  function playClick() { playSound('buy'); } // back-compat alias

  /* ---------- telemetry (REC): snapshot-before-reset so New Game+ can't wipe it ---------- */
  var REC = { v: 1, events: [], dead: 0, t0: 0 };
  var lastAction = '';
  function rec(ev, extra) {
    if (REC.events.length > 6000) REC.events.shift();
    if (ev[0] !== '@') lastAction = ev;
    var e = { ev: ev }; if (extra) for (var k in extra) e[k] = extra[k];
    e.wt = hasDOM ? Date.now() : 0; // caller adds gt (game-time) via KIT.recGT
    REC.events.push(e);
  }
  function initTelemetry(getStarted) {
    if (!hasDOM) return;
    var ACTIONABLE = 'button,input,a,.node,.disco,.chip,.stock,.auto,.verb,.side-btn,.rail-btn,.cap,.exp-card,.method-pin,.tri-handle,.lock-btn,.steer-btn,.focus-seg,.th';
    document.addEventListener('pointerdown', function (e) {
      if (getStarted && !getStarted()) return; var t = e.target;
      if (t && t.closest && t.closest(ACTIONABLE)) return;
      REC.dead++; rec('@deadclick', { x: Math.round(e.clientX), y: Math.round(e.clientY), tag: (t && t.tagName || '').toLowerCase() });
    }, true);
    var _sl = 0;
    addEventListener('scroll', function () {
      var now = Date.now(); if (now - _sl < 1200) return; _sl = now;
      var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      rec('@scroll', { pct: Math.round(Math.min(1, scrollY / max) * 100) });
    }, { passive: true });
  }

  /* ---------- music: one controller, all era beds, crossfade on era switch ----------
     beds = { 1:'assets/music-bone-loam.mp3', ... , rupture:'assets/music-unmoored-presence.mp3' } */
  var MUSIC = { on: false, vol: 0.15, el: null, cur: null, beds: {} };
  function musicSetup(beds) { MUSIC.beds = beds || {}; if (hasDOM) MUSIC.el = $('music'); }
  function musicPlayEra(n) {
    if (!hasDOM || !MUSIC.el) return; var src = MUSIC.beds[n]; if (!src || MUSIC.cur === src) return;
    MUSIC.cur = src; MUSIC.el.src = src; if (MUSIC.on) { MUSIC.el.volume = MUSIC.vol; MUSIC.el.play().catch(function () {}); }
  }
  function musicToggle() {
    if (!hasDOM || !MUSIC.el) return; MUSIC.on = !MUSIC.on;
    try { localStorage.setItem('emergence_v3_music', MUSIC.on ? 'on' : 'off'); } catch (e) {}
    var btn = $('musicBtn');
    if (MUSIC.on) { MUSIC.el.volume = MUSIC.vol; MUSIC.el.play().catch(function () {}); if (btn) btn.style.color = 'var(--accent)'; }
    else { MUSIC.el.pause(); if (btn) btn.style.color = ''; }
  }
  // resume a persisted-on bed after the first user gesture (browser autoplay policy blocks it at boot)
  function musicEnsure() { if (!hasDOM || !MUSIC.el || !MUSIC.on || !MUSIC.cur) return; MUSIC.el.volume = MUSIC.vol; if (MUSIC.el.paused) MUSIC.el.play().catch(function () {}); }
  function musicSetVol(v) { MUSIC.vol = Math.max(0, Math.min(1, +v || 0)); if (MUSIC.el) MUSIC.el.volume = MUSIC.vol; try { localStorage.setItem('emergence_v3_musvol', String(MUSIC.vol)); } catch (e) {} }
  function sfxSetVol(v) { SFX.vol = Math.max(0, Math.min(1, +v || 0)); try { localStorage.setItem('emergence_v3_sfxvol', String(SFX.vol)); } catch (e) {} }
  function audioLoad() { // restore persisted audio prefs at boot (music still starts only on gesture/toggle)
    if (!hasDOM) return;
    try {
      var mv = localStorage.getItem('emergence_v3_musvol'); if (mv !== null) MUSIC.vol = Math.max(0, Math.min(1, +mv));
      var sv = localStorage.getItem('emergence_v3_sfxvol'); if (sv !== null) SFX.vol = Math.max(0, Math.min(1, +sv));
      MUSIC.on = localStorage.getItem('emergence_v3_music') === 'on' && MUSIC.vol > 0;
    } catch (e) {}
  }

  /* ---------- offline catch-up (shipped pattern): MUTE the world, replay the elapsed time in
     tick-sized steps so conversion order / caps / gates behave exactly like live play. Live-only
     systems (commissions, Deep events, contradictions, emergence + aftermath) check KIT.MUTE and
     freeze — offline is deterministic and silent. Node-testable (no DOM). ---------- */
  function offlineCatchup(opts) {
    // opts = { elapsed(s), cap(s, default 8h), step(s, default 0.1), keys:[...], getS(), produceStep(dt) — advances S.t + runs every era's produce }
    var cap = opts.cap || 8 * 3600, eff = Math.min(opts.elapsed || 0, cap);
    if (!(eff >= 1)) return null;
    var S = opts.getS(), before = {};
    opts.keys.forEach(function (k) { before[k] = S[k] || 0; });
    KIT.MUTE = true;
    var step = opts.step || 0.1, rem = eff, iter = 0;
    while (rem > 0 && iter < 300000) { var d = Math.min(step, rem); opts.produceStep(d); rem -= d; iter++; }
    KIT.MUTE = false;
    var g = {}, any = false;
    opts.keys.forEach(function (k) { g[k] = (S[k] || 0) - before[k]; if (g[k] > 0.05) any = true; });
    if (!any) return null;
    return { eff: eff, g: g, capped: (opts.elapsed || 0) > cap };
  }

  /* ---------- persistence (canonical): {S,t} + generic deep-merge into fresh() ---------- */
  function deepMerge(base, over) { // merge saved 'over' into fresh 'base' shape (handles nested sub-objects)
    if (over == null) return base;
    if (typeof base !== 'object' || Array.isArray(base) || typeof over !== 'object') return over;
    var out = {}; for (var k in base) out[k] = base[k];
    for (var j in over) out[j] = (j in base && base[j] && typeof base[j] === 'object' && !Array.isArray(base[j]))
      ? deepMerge(base[j], over[j]) : over[j];
    return out;
  }

  /* ---------- KIT surface ---------- */
  var KIT = {
    $: $, fmt: fmt, esc: esc, setTxt: setTxt, setHTML: setHTML, setDis: setDis, setAttr: setAttr, setText: setText,
    RES: function () { return RES; }, setRes: setRes, resVisual: resVisual, hue: hue,
    FLOW: function () { return FLOW; }, flowInit: flowInit, flowReset: flowReset, fIn: fIn, fOut: fOut, connGlow: connGlow,
    connector: connector, stock: stock, node: node, chip: chip, costHTML: costHTML,
    unitCostAt: unitCostAt, bulkCost: bulkCost, maxAffordable: maxAffordable, batch: batch,
    MILESTONES: MILESTONES, MILESTONE_BONUS: MILESTONE_BONUS, tierOf: tierOf, tierMult: tierMult, nextMilestone: nextMilestone, pipHTML: pipHTML,
    floatNum: floatNum, initTip: initTip, toast: toast,
    playSound: playSound, playClick: playClick, soundProfile: {}, SFX: SFX, sfxSetVol: sfxSetVol,
    REC: REC, rec: rec, initTelemetry: initTelemetry, lastAction: function () { return lastAction; },
    MUSIC: MUSIC, musicSetup: musicSetup, musicPlayEra: musicPlayEra, musicToggle: musicToggle,
    musicEnsure: musicEnsure, musicSetVol: musicSetVol, audioLoad: audioLoad,
    MUTE: false, offlineCatchup: offlineCatchup,
    deepMerge: deepMerge, DEFAULT_SOUND: DEFAULT_SOUND
  };
  KIT.soundProfile = {}; // per-active-era oscillator profiles; set by the shell on era switch

  /* ============================================================================
     ERA-MODULE INTERFACE (Phase 3 contract — documented, not yet wired)
     Each era registers a module; the shell owns S/CFG and ONE render/refresh/tick
     that DISPATCH to the active era. Only the active era builds into #board, so
     per-board element ids never coexist.

       ERA = {
         id:      1..5,
         theme:   'theme-1'..'theme-5',     // body class -> palette (kit.css reads vars)
         beds:    music src for this era,
         sound:   { buy:{osc,f0,f1,g,dur}, event:{...}, ... },   // KIT.soundProfile
         res:     partial RES registry this era introduces (merged into shared RES),
         fresh(S):  seed this era's sub-state on S (S.eN = {...}) + backbone resources,
         open(S):   handoff seam — carry a resource from the prior era (Knowledge→Rules, Insight→Deep, ...),
         produce(S, dt):  economy tick (uses KIT.fIn/fOut for connector brightness),
         build(S):  returns board HTML (uses KIT.connector/stock/node/chip) + wires buttons,
         refresh(S):  per-tick values via KIT.setTxt/setHTML/setDis ONLY (build-once),
         reachback: cross-era draws to restore the real supply chain (see KIT.md stand-ins).
       }

     Shell dispatch skeleton (Phase 3):
       function tick(){ var now=Date.now(), real=Math.min(0.5,(now-_last)/1000); _last=now;
         var dt=real*S.speed; S.t+=dt;
         var before=snapshot(BACKBONE);
         ERAS.forEach(function(e){ if(e.id<=S.maxEra) e.produce(S,dt); }); // earlier eras keep producing (living supply)
         if(dt>0) captureRATES(before,dt);
         active().refresh(S);
       }
     ============================================================================ */
  KIT.tickScaffold = function (opts) {
    // opts = { getS, backbone:[keys], produceAll(dt), refreshActive(), rates, tickMs }
    var _last = hasDOM ? Date.now() : 0;
    return function tick() {
      var now = Date.now(), real = (now - _last) / 1000; _last = now; if (real > 0.5) real = 0.5;
      var S = opts.getS(), dt = real * (S.speed || 1); S.t = (S.t || 0) + dt;
      var before = {}; opts.backbone.forEach(function (k) { before[k] = S[k] || 0; });
      opts.produceAll(dt);
      if (dt > 0 && opts.rates) opts.backbone.forEach(function (k) { opts.rates[k] = ((S[k] || 0) - before[k]) / dt; });
      opts.refreshActive();
    };
  };

  root.KIT = KIT;
  if (typeof module !== 'undefined' && module.exports) module.exports = KIT;
})(typeof window !== 'undefined' ? window : globalThis);
