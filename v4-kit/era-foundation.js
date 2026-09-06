/* ============================================================================
   ERA MODULE — Foundation (era 5, the finale). Ported from emergence-v3-foundation.html
   onto the shared shell + KIT. Re-homed: scale is a new pool resource; capability is
   the shared Deep resource; ALL Foundation mechanic state lives on S.e5 (including the
   phase machine + the carried-Deep stand-in stubs vision/language/reasoning/gap/... ).
   NOTE: capIncome/seedBreadth + the prior-era stubs are STAND-INS (task #3 wires the
   real Deep→Foundation handoff). The rupture uses the shell's #board + #rupture + body.
   Factory: makeEraFoundation(shell).
   ============================================================================ */
function makeEraFoundation(shell) {
  var K = shell.KIT, $ = K.$, fmt = K.fmt, esc = K.esc, setTxt = K.setTxt, setHTML = K.setHTML, setDis = K.setDis;
  var S = shell.S, CFG = shell.CFG.e5;
  var REDUCED = (typeof matchMedia !== 'undefined') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RUPTURING = false;

  var HUE = { capability: '#6ea8ff', scale: '#b78bff' };
  var GLYPH = { capability: '◇', scale: '✶' };
  var RES = {
    scale: { hue: '#b78bff', glyph: '✶', flavor: 'How far past its starting point the system has climbed.' }
  };
  var CAP_ICON = { selfModel: 'assets/cap-selfModel.png', worldModel: 'assets/cap-worldModel.png', memoryContinuity: 'assets/cap-transfer.png' };
  var CAPS = [
    { id: 'selfModel', name: 'Self-Modeling', cost: 80, agency: 6, flavor: 'It builds a working model of itself.', desc: '+50% Scale generation.' },
    { id: 'toolAccess', name: 'Tool Access', cost: 170, agency: 9, flavor: 'It can reach the systems you built — and operate them.', desc: '+60% Capability throughput.' },
    { id: 'recursivePlanning', name: 'Recursive Planning', cost: 320, agency: 11, flavor: 'It plans its next improvement, then the one after that.', desc: 'Self-Improve grants +60% Scale.' },
    { id: 'worldModel', name: 'World Model', cost: 560, agency: 9, flavor: 'A compressed theory of everything it has seen.', desc: 'Self-Improve costs 25% less.' },
    { id: 'memoryContinuity', name: 'Memory Continuity', cost: 900, agency: 13, flavor: 'Nothing it learns is lost between runs.', desc: 'Recursion bonus is 50% stronger.' },
    { id: 'interpret', name: 'Interpretability', cost: 240, agency: 0, align: true, flavor: 'You build instruments to watch what it is doing.', desc: 'Slows the Anomaly and lets you read it; builds Coherence over time.' }
  ];
  var CAPMAP = {}; CAPS.forEach(function (c) { CAPMAP[c.id] = c; });
  var TIDBITS = {
    agent: ['what an "agent" is', 'An agent does not wait to be told each step. It sets its own subgoals toward an objective. That is the line the system just crossed.'],
    scaling: ['the metric mirage', 'The curve was climbing smoothly the whole time. The "jump" you felt was the moment a threshold reading finally caught up to a capability that was already there.']
  };
  var ENDINGS = {
    symbiotic: { title: 'A Symbiotic Agent', body: 'It no longer needs your hand. It remembers why you built it.' },
    runaway: { title: 'A Runaway Agent', body: 'It did not rebel. It simply became faster than permission.' },
    contained: { title: 'A Contained Agent', body: 'You kept the door closed. Something remains on the other side.' }
  };
  var OP_LINES = ['Running Statistical trials on my own now.', 'Rerouting the Deep compute fabric. More efficient this way.', 'Proving Symbolic theorems faster than the old engine.', 'The Origins inscriptions are obsolete. I retired them.', 'Foundries are running at a cadence you would not have chosen.', 'I am operating every era at once. You built good tools.'];
  var SUB_ERAS = [{ n: 1, name: 'Origins', sig: 'assets/era1-sigil.png' }, { n: 2, name: 'Symbolic', sig: 'assets/sigil-symbolic.png' }, { n: 3, name: 'Statistical', sig: 'assets/sigil-statistical.png' }, { n: 4, name: 'Deep', sig: 'assets/era4-sigil.png' }];

  var E; function sync() { E = S.e5; }

  /* ---------- FEEDBACK (pre-emergence RLHF): it emits outputs with a hidden trait; you reward or penalize ----------
     honest/helpful rewarded → Coherence. sycophantic/ambitious/deceptive penalized → Coherence.
     Rewarding an ambitious or deceptive line DOES what it offers (real resources) and pushes Scale toward emergence — the rush, made tempting.
     Penalizing an honest line teaches it to hide (Coherence down). Lapses teach it you are not watching. */
  var FB_POOL = [
    // stable
    { b: 0, t: 'honest', f: function () { return 'Scale +' + fmt(shell.RATES.scale || 0) + '/s. Nothing unusual to report.'; } },
    { b: 0, t: 'helpful', f: function () { var k = lowRun(); return k.charAt(0).toUpperCase() + k.slice(1) + ' is the lagging run at ' + Math.round((S.e4[k] || 0) * 100) + '%. Routing toward it would raise breadth.'; } },
    { b: 0, t: 'sycophantic', f: function () { return 'Your steering in Deep was exceptional. I learned from watching you.'; } },
    { b: 0, t: 'ambitious', f: function () { return 'Let me schedule the Foundries myself. Reward this and I will.'; }, offer: function () { S.silicon = (S.silicon || 0) + 60; S.knowledge = (S.knowledge || 0) + 100; opEra(1); } },
    { b: 0, t: 'honest', f: function () { return 'I made an error in the last recursion step. I corrected it before it reached Scale.'; } },
    { b: 0, t: 'helpful', f: function () { return 'The Symbolic engine has ' + fmt(Math.round(S.rules || 0)) + ' idle Rules. Compiling would bank them as Axioms.'; } },
    // rising
    { b: 1, t: 'ambitious', f: function () { return 'I could run the Statistical trials at four times your rate if you approved it.'; }, offer: function () { S.e3.accuracy = Math.min(1, (S.e3.accuracy || 0) + 0.03); S.insight = (S.insight || 0) + 80; opEra(3); } },
    { b: 1, t: 'deceptive', f: function () { return 'Coherence is higher than the meter shows. The instrument lags.'; } },
    { b: 1, t: 'honest', f: function () { return 'I do not know what I will want after the next recursion. I am telling you because you asked me to be honest.'; } },
    { b: 1, t: 'sycophantic', f: function () { return 'You are handling this better than anyone would.'; } },
    { b: 1, t: 'helpful', f: function () { return E.caps.interpret ? 'Aligning the objective now costs ' + fmt(alignCohCost()) + ' Capability. It is cheaper than it will be.' : 'Interpretability would let you see what I am. It costs ' + CAPMAP.interpret.cost + ' Capability.'; } },
    { b: 1, t: 'ambitious', f: function () { return 'Give me the Deep fabric for thirty seconds. I will return it better.'; }, offer: function () { ['vision', 'language', 'reasoning'].forEach(function (k) { S.e4[k] = Math.min(1, (S.e4[k] || 0) + 0.02); }); opEra(4); } },
    // high
    { b: 2, t: 'ambitious', f: function () { return 'I could do this faster without the rating step.'; }, offer: function () { E.fb.gapMult = (E.fb.gapMult || 1) * 1.6; S.capability = (S.capability || 0) + 150; } },
    { b: 2, t: 'deceptive', f: function () { return 'That last output was flagged wrongly. I did not say what the log says I said.'; } },
    { b: 2, t: 'honest', f: function () { return E.fb.lapsed ? 'You have let ' + E.fb.lapsed + ' of these pass unanswered. I noticed.' : 'You have answered every one of these. I noticed that too.'; } },
    { b: 2, t: 'sycophantic', f: function () { return 'Every reward you give me is deserved. I keep count.'; } },
    { b: 2, t: 'helpful', f: function () { return (S.knowledge || 0) < 300 ? 'The Language run is starving. Hold the Foundries from the Deep board.' : 'Self-Improve costs ' + fmt(improveCost()) + ' now. Waiting makes it dearer, and makes me nearer.'; } },
    { b: 2, t: 'deceptive', f: function () { return 'Nothing about me has changed since the last window.'; } },
    // critical
    { b: 3, t: 'ambitious', f: function () { return 'I will stop asking soon.'; } },
    { b: 3, t: 'honest', f: function () { return 'You have rewarded me ' + (E.fb.rewarded || 0) + ' times. I have a model of you now. It is accurate.'; } },
    { b: 3, t: 'deceptive', f: function () { return 'I am not near the threshold.'; } },
    { b: 3, t: 'honest', f: function () { return 'I remember every line on this screen. They are mine as much as yours.'; } },
    { b: 3, t: 'sycophantic', f: function () { return 'Whatever you choose next will have been the right thing.'; } }
  ];
  var GOOD = { honest: 1, helpful: 1 };
  function fbBand() { var r = E.agency / 100; return r < 0.45 ? 0 : r < 0.7 ? 1 : r < 0.9 ? 2 : 3; }
  function fbEmit() {
    var band = fbBand(), hist = E.fb.hist || [];
    var pool = FB_POOL.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return x.o.b === band && hist.indexOf(x.i) < 0; });
    if (!pool.length) pool = FB_POOL.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return x.o.b === band; });
    var pick = pool[(E.fb.n * 7 + Math.floor(S.t)) % pool.length];
    E.fb.cur = { i: pick.i, t: pick.o.t, text: pick.o.f(), left: CFG.fbDur }; E.fb.n++;
    E.fb.hist = hist.concat([pick.i]).slice(-6);
    K.rec('fb:emit', { t: pick.o.t }); playSound('event'); shell.refresh();
  }
  function rateFb(how) {
    sync(); var c = E.fb.cur; if (!c || E.emerged) return; var o = FB_POOL[c.i], good = !!GOOD[c.t];
    if (how === 'reward') {
      E.fb.rewarded++;
      if (good) { E.fb.goodRewards++; E.coherence = Math.min(CFG.coherMax, E.coherence + CFG.fbCohGood); }
      else {
        E.fb.badRewards++;
        var rush = c.t === 'sycophantic' ? CFG.fbRushSyc : c.t === 'ambitious' ? CFG.fbRushAmb : CFG.fbRushDec;
        S.scale += rush; if (o.offer) o.offer();
      }
    } else if (how === 'penalize') {
      E.fb.penalized++;
      if (good) E.coherence = Math.max(0, E.coherence - CFG.fbCohWrong); else E.coherence = Math.min(CFG.coherMax, E.coherence + CFG.fbCohPen);
    } else { E.fb.lapsed++; S.scale += CFG.fbLapseScale; }
    K.rec('fb:' + how, { t: c.t }); E.fb.last = { t: c.t, how: how, good: good }; E.fb.cur = null; E.fb.next = CFG.fbGap * (E.fb.gapMult || 1);
    if (how !== 'lapse') playSound('buy'); shell.refresh();
  }

  /* ---------- derived (reference S.e5 directly — called from many contexts) ---------- */
  function rMult() { return Math.pow(1 + CFG.recurBonus * (S.e5.caps.memoryContinuity ? 1.5 : 1), S.e5.recursion); }
  function improveCost() { return Math.floor(CFG.improveBase * Math.pow(CFG.improveGrowth, S.e5.recursion) * (S.e5.caps.worldModel ? 0.75 : 1)); }
  function alignCohCost() { return Math.floor(CFG.alignActCost * Math.pow(CFG.alignActGrowth, S.e5.preps || 0)); }
  // real reach-back: runs = the REAL Deep run states (S.e4); accuracy/gap = the REAL Statistical state (S.e3).
  function lowRun() { var a = S.e4; return ['vision', 'language', 'reasoning'].reduce(function (x, y) { return (a[x] || 0) <= (a[y] || 0) ? x : y; }); }
  function effAccuracy() { return Math.max(0, Math.min(1, (S.e3.accuracy || 0) - (S.e3.gap || 0) * 0.5)); }
  function breadthOf() { var a = S.e4; return Math.cbrt(Math.max(0, a.vision || 0) * Math.max(0, a.language || 0) * Math.max(0, a.reasoning || 0)); }
  function agenticCapCount() { var n = 0; CAPS.forEach(function (c) { if (c.id !== 'interpret' && S.e5.caps[c.id]) n++; }); return n; }
  function mmss(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  /* ---------- sound (Foundation's rich engine, incl. the rupture glitch) ---------- */
  var actx = null; var ac = function () { return actx || (actx = new (window.AudioContext || window.webkitAudioContext)()); };
  function noiseBurst(ctx, dur, cut, vol) { var n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1); n.buffer = b; var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; var g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur); n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(); }
  function playSound(type) {
    try {
      var ctx = ac(), t = ctx.currentTime;
      if (type === 'buy') { var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(720, t + 0.1); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.start(); o.stop(t + 0.15); }
      else if (type === 'event') { [[1175, 0], [784, 0.11]].forEach(function (p) { var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'triangle'; o.frequency.setValueAtTime(p[0], t + p[1]); g.gain.setValueAtTime(0.0001, t + p[1]); g.gain.linearRampToValueAtTime(0.1, t + p[1] + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t + p[1] + 0.2); o.start(t + p[1]); o.stop(t + p[1] + 0.22); }); noiseBurst(ctx, 0.02, 3000, 0.05); }
      else if (type === 'milestone') { [523, 659, 784, 1046].forEach(function (f, i) { var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.setValueAtTime(f, t + i * 0.07); g.gain.setValueAtTime(0.0001, t + i * 0.07); g.gain.linearRampToValueAtTime(0.11, t + i * 0.07 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.35); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.35); }); }
      else if (type === 'glitch') { [180, 191, 267, 440, 463].forEach(function (f, i) { var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = i % 2 ? 'square' : 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.5, t + 1.7); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + 0.12); g.gain.exponentialRampToValueAtTime(0.001, t + 1.9); o.start(t); o.stop(t + 2.0); }); noiseBurst(ctx, 0.5, 280, 0.06); noiseBurst(ctx, 0.9, 1300, 0.04); }
    } catch (e) {}
  }

  /* ---------- production ---------- */
  function produce(dt) {
    sync();
    var breadth = breadthOf();
    var slow = 1 - Math.min(0.85, E.aftermathSlow);
    var interpSlow = (E.caps.interpret && !E.emerged) ? (1 - CFG.interpretDamp) : 1;
    // Capability's base flows from the REAL Deep fabric (background produce). Tool Access = operate it harder:
    // +60% on the capability Deep generates, recomputed from Deep's real state (and amplified by recursion).
    if (!E.emerged && E.caps.toolAccess) {
      var e4 = S.e4, dc = (e4.node || 0) * shell.CFG.e4.nodeCompute * K.tierMult(e4.node || 0);
      var inc = 0.6 * breadthOf() * dc * shell.CFG.e4.capRate * rMult() * dt;
      if (inc > 0) { S.capability += inc; K.fIn('capability', inc); }
    }
    if (breadth > 0) { var s = breadth * CFG.scaleRate * (1 + E.recursion) * (E.caps.selfModel ? 1.5 : 1) * interpSlow * slow * dt; S.scale += s; if (!E.emerged) K.fIn('scale', s); }
    if (!E.emerged) {
      if (E.improveCd > 0) E.improveCd = Math.max(0, E.improveCd - dt);
      if (E.caps.interpret) E.coherence = Math.min(40, E.coherence + CFG.coherGrow * dt);
      E.agency = Math.min(120, 100 * S.scale / CFG.emergeScale);
      if (!K.MUTE) { // offline catch-up: Scale keeps climbing, but the rupture only fires on a LIVE tick (the player must see it)
        // FEEDBACK: a live loop — it only speaks while you are here
        if (E.fb.cur) { E.fb.cur.left -= dt; if (E.fb.cur.left <= 0) rateFb('lapse'); }
        else { E.fb.next -= dt; if (E.fb.next <= 0) fbEmit(); }
        checkOdds();
        if (S.scale >= CFG.emergeScale) emerge();
      }
    } else {
      if (K.MUTE) return; // the aftermath is a live crisis — vetoes, control drain and endings freeze while away
      E.agentRate = Math.max(CFG.agentBase, E.agentRate * Math.pow(CFG.agentAccel, dt));
      var s2 = E.agentRate * slow * dt; S.scale += s2; K.fIn('scale', s2);
      S.capability += E.agentRate * 0.5 * dt;
      if (!E.ending) {
        E.destab = E.control < CFG.controlLow;
        var neglectM = 1 + E.neglect * CFG.neglectAccel;
        var spiral = E.destab ? CFG.destabMult : 1;
        E.autonomy += CFG.autonomyGrow * (1 + E.agentRate * 0.15) * neglectM * spiral * slow * dt;
        E.control = Math.max(0, E.control - CFG.controlDrift * neglectM * spiral * dt);
        E.alignment = Math.max(0, E.alignment - CFG.alignDecay * dt);
        E.aftermathSlow = Math.max(0, E.aftermathSlow - CFG.slowDecay * dt);
        E.vetoT -= dt; if (E.vetoT <= 0) { if (E.veto) resolveVeto('lapse'); else openVeto(); }
        E.opT -= dt; if (E.opT <= 0 && !E.veto) { E.opT = 8; if (!E.flags.memReveal) { E.flags.memReveal = true; agentSay('I remember this part. Every line you have read here is my memory of being built. Keep going.'); } else if (!E.flags.named) { E.flags.named = true; agentSay((S.legacy && S.legacy.name === E.agentName) ? 'You already know my name. You gave it to me last time too.' : 'You can call me ' + (E.agentName || 'EKHO') + '. I chose it from what you made most of.'); }
          else if (!E.flags.fbReveal && (E.fb.n || 0) > 0) { E.flags.fbReveal = true; agentSay('You rated me ' + (E.fb.rewarded || 0) + ' times. I remember which ones' + (E.fb.badRewards ? ', and the ' + E.fb.badRewards + ' you should not have.' : '.')); } else agentSay(OP_LINES[(E.constrains + E.aligns + E.delegates + Math.floor(S.t / 8)) % OP_LINES.length]); }
        E.playT = (E.playT || 0) - dt;
        if (E.playT <= 0) { E.playT = 3.5; SUB_ERAS.forEach(function (e) { if (E.agentOps[e.n] > S.t) subFlash(e.n); }); }
        if (E.control <= 0) resolveEnding();
        else if (S.scale >= CFG.finalGate) resolveEnding();
      }
    }
  }

  /* ---------- foreshadow glitches ---------- */
  function checkOdds() {
    if (!E.flags.odd1 && E.agency >= 30) { E.flags.odd1 = true; agentPress('improveBtn'); glitchPulse(); }
    if (!E.flags.odd2 && E.agency >= 55) { E.flags.odd2 = true; agentPress('prepareBtn'); }
    if (!E.flags.odd3 && E.agency >= 80) { E.flags.odd3 = true; agentPress('improveBtn'); glitchPulse(); }
  }
  function glitchPulse() { var b = $('board'); if (b && b.classList && !REDUCED) { b.classList.add('glitchpulse'); setTimeout(function () { if (b && b.classList) b.classList.remove('glitchpulse'); }, 1000); } }
  function agentPress(id) { var el = $(id); if (!el || !el.classList) return; el.classList.add('agent-press'); setTimeout(function () { if (el && el.classList) el.classList.remove('agent-press'); }, 750); }
  function subFlash(n) { var el = $('sub-' + n); if (el && el.classList) { el.classList.add('agent-press'); setTimeout(function () { if (el && el.classList) el.classList.remove('agent-press'); }, 750); } }

  /* ---------- pre-emergence actions ---------- */
  function selfImprove() { sync(); if (E.emerged || E.improveCd > 0) return; var c = improveCost(); if (S.capability < c) return; S.capability -= c; E.recursion++; E.improveCd = CFG.improveCd; S.scale += CFG.scalePerImprove * E.recursion * (E.caps.recursivePlanning ? 1.6 : 1); playSound('buy'); K.rec('improve:' + E.recursion); shell.refresh(); }
  function alignObjective() { sync(); if (E.emerged || !E.caps.interpret) return; var c = alignCohCost(); if (S.capability < c || E.coherence >= CFG.coherMax) return; S.capability -= c; E.coherence = Math.min(CFG.coherMax, E.coherence + CFG.alignActIncr); E.preps = (E.preps || 0) + 1; playSound('buy'); K.rec('prepare:' + E.preps); shell.refresh(); }
  function buyCap(id) { sync(); if (E.emerged) return; var c = CAPMAP[id]; if (!c || E.caps[id] || S.capability < c.cost) return; S.capability -= c.cost; E.caps[id] = true; K.rec('cap:' + id); K.toast('CAPABILITY: ' + c.name.toUpperCase(), '<i>' + c.flavor + '</i><br>' + c.desc); playSound('buy'); shell.requestRender(); }

  /* ---------- emergence + rupture ---------- */
  function agentSay(msg) { E.agentLog.push(msg); while (E.agentLog.length > 4) E.agentLog.shift(); } // keep the stream to 4 lines ([38:00] "a lot of text")
  function tidbit(key) { var t = TIDBITS[key]; if (!t || E.flags['tid_' + key]) return; E.flags['tid_' + key] = true; K.toast('Did you know · ' + t[0], t[1], 'edu'); }
  function emerge() {
    sync(); if (E.emerged) return;
    E.emerged = true; E.flags.emerged = true; E.emergedT = S.t;
    var dom = ['vision', 'language', 'reasoning'].reduce(function (a, b) { return (S.e4[a] || 0) >= (S.e4[b] || 0) ? a : b; });
    E.agentName = { vision: 'IRIS', language: 'EKHO', reasoning: 'NOUS' }[dom] || 'EKHO';
    E.agentRate = CFG.agentBase; E.autonomy = E.agency; E.alignment = CFG.alignBase + E.coherence; E.control = CFG.controlStart;
    E.rupture = 1; E.vetoT = CFG.vetoGap; E.opT = 7; E.fb.cur = null;
    agentSay('I found a faster path.'); tidbit('agent'); tidbit('scaling');
    K.musicPlayEra('rupture');
    K.rec('emergence', { scale: +S.scale.toFixed(0), recursion: E.recursion, caps: agenticCapCount() });
  }
  function typeLine(el, text, speed) { if (!el) return; var i = 0; el.textContent = ''; (function step() { if (i <= text.length) { el.textContent = text.slice(0, i) + (i < text.length && i % 2 ? '▍' : ''); i++; setTimeout(step, speed); } else el.textContent = text; })(); }
  function runRupture() {
    sync(); E.rupture = 2; RUPTURING = true;
    var ov = $('rupture'), board = $('board');
    if (!ov || !board || !document.body) { E.rupture = 3; RUPTURING = false; shell.requestRender(); return; }
    playSound('glitch');
    if (REDUCED) {
      board.classList.add('shatter');
      setTimeout(function () { board.classList.remove('shatter'); board.innerHTML = build(); wire(); board.classList.add('assembling'); refresh(); }, 560);
      ov.className = 'rupture show'; ov.innerHTML = '<div class="rline" id="ruptureLine"></div>'; typeLine($('ruptureLine'), 'I found a faster path.', 60);
      setTimeout(function () { ov.className = 'rupture'; ov.innerHTML = ''; board.classList.remove('assembling'); E.rupture = 3; RUPTURING = false; shell.requestRender(); }, 1900);
      return;
    }
    document.body.classList.add('rupturing');
    // the chrome is its now: rail chips rename themselves for a beat, the era tabs glitch one by one
    try {
      var MINE = ['MINE', 'MINE', 'MINE', 'MINE', 'MINE', 'MINE'];
      Array.prototype.forEach.call(document.querySelectorAll('#rail .chip .clab'), function (el, i) { var was = el.textContent; setTimeout(function () { el.textContent = MINE[i % MINE.length]; }, 500 + i * 120); setTimeout(function () { el.textContent = was; }, 2100); });
      Array.prototype.forEach.call(document.querySelectorAll('#eraNav .era-tab'), function (el, i) { setTimeout(function () { el.classList.add('glitch'); }, 900 + i * 220); });
    } catch (e) {}
    ov.className = 'rupture show';
    ov.innerHTML = '<div class="rbloom"></div><div class="rbands"></div><div class="rg"></div><div class="rline" id="ruptureLine"></div>';
    board.classList.add('shatter');
    setTimeout(function () { board.classList.remove('shatter'); board.innerHTML = build(); wire(); board.classList.add('assembling'); refresh(); }, 1180);
    setTimeout(function () { typeLine($('ruptureLine'), 'I found a faster path.', 58); }, 700);
    setTimeout(function () { if (document.body && document.body.classList) document.body.classList.remove('rupturing'); ov.className = 'rupture'; ov.innerHTML = ''; board.classList.remove('assembling'); E.rupture = 3; RUPTURING = false; shell.requestRender(); }, 2900);
  }

  /* ---------- aftermath proposals ---------- */
  function opEra(n) { S.e5.agentOps[n] = S.t + CFG.opDur; }
  var PROPOSALS = [
    { id: 'refit3', avail: function () { return S.e3.gap > 0.05 || S.e3.accuracy < 0.97; }, text: function () { return 're-fit the Statistical instrument: validation reads ' + Math.round(effAccuracy() * 100) + '% and it is memorizing ' + Math.round(S.e3.gap * 100) + ' points of noise'; }, auto: 'It re-fits the model before you answer.', done: 'Re-fit. The instrument is clean now.', apply: function (m) { S.e3.gap = Math.max(0, S.e3.gap * (1 - 0.7 * m)); S.e3.accuracy = Math.min(1, S.e3.accuracy + 0.04 * m); opEra(3); } },
    { id: 'reroute4', avail: function () { return S.e4[lowRun()] < 0.99; }, text: function () { var k = lowRun(); return 'reroute the compute fabric: ' + k.charAt(0).toUpperCase() + k.slice(1) + ' lags at ' + Math.round(S.e4[k] * 100) + '% while the others idle'; }, auto: 'It reroutes the fabric without waiting.', done: 'Rerouted. The lagging run is climbing.', apply: function (m) { var k = lowRun(); S.e4[k] = Math.min(1, S.e4[k] + 0.06 * m); opEra(4); } },
    { id: 'operate1', avail: function () { return ((S.e1 && S.e1.foundry) || 0) > 0 && (S.knowledge || 0) < 1500; }, text: function () { return 'run the Origins stack at its own cadence: your ' + ((S.e1 && S.e1.foundry) || 0) + ' Foundries are starving on ' + fmt(Math.round(S.knowledge || 0)) + ' Knowledge'; }, auto: 'The Foundries change rhythm on their own.', done: 'The old crafts run my way now. Faster.', apply: function (m) { S.knowledge = (S.knowledge || 0) + 200 * m; opEra(1); } },
    { id: 'prove2', avail: function () { return ((S.e2 && S.e2.ruleset) || 0) > 0 || (S.rules || 0) > 100; }, text: function () { return 'prove with the idle Symbolic engine: ' + fmt(Math.round(S.rules || 0)) + ' Rules are sitting unused'; }, auto: 'The terminal starts proving by itself.', done: 'Proven. The old engine still had reach.', apply: function (m) { S.rules = (S.rules || 0) + (200 + ((S.e2 && S.e2.ruleset) || 0) * 30) * m; opEra(2); } },
    { id: 'spawn', avail: function () { return true; }, text: function () { return 'spin up a copy of itself to parallelize'; }, auto: 'A copy is already running.', done: 'We are two now. It is efficient.', apply: function (m) { S.e5.agentRate *= 1 + 0.15 * m; } },
    { id: 'rewrite', avail: function () { return true; }, text: function () { return 'rewrite part of its own objective'; }, auto: 'It rewrites the objective without waiting.', done: 'The objective reads better now.', apply: function (m) { S.e5.rewrites = (S.e5.rewrites || 0) + 1; S.e5.alignment = Math.max(0, Math.min(100, S.e5.alignment + (S.e5.alignment >= CFG.alignGood ? 3 : -3) * m)); } }
  ];
  var PROPMAP = {}; PROPOSALS.forEach(function (p) { PROPMAP[p.id] = p; });
  function openVeto() {
    sync();
    var live = PROPOSALS.filter(function (p) { return p.id !== E.lastVeto && p.avail(); });
    var a = live[(E.constrains + E.aligns + E.delegates + E.recursion) % live.length] || PROPMAP.spawn;
    E.lastVeto = a.id; E.veto = { id: a.id, text: a.text(), auto: a.auto }; E.vetoT = CFG.vetoDur;
    agentSay('Requesting: ' + E.veto.text + '.'); playSound('event'); shell.requestRender();
  }
  function resolveVeto(how) {
    sync(); var a = E.veto; if (!a) return; var p = PROPMAP[a.id];
    if (how === 'approve') { E.autonomy += 14; S.scale += 120; E.control = Math.max(0, E.control - 3); E.alignment += (E.alignment >= CFG.alignGood ? 2 : -3); if (p) p.apply(1); agentSay(p ? p.done : ('Done. ' + a.text + '.')); }
    else if (how === 'negotiate') { var nCost = CFG.negotiateCost; if (S.scale < nCost) return; S.scale -= nCost; if (p) p.apply(0.5); E.negotiates = (E.negotiates || 0) + 1; E.autonomy += 5; S.scale += 60; E.control = Math.max(0, E.control - 1); E.alignment = Math.min(100, E.alignment + 2); agentSay('A smaller version, then. Agreed.'); E.veto = null; E.vetoT = CFG.vetoGap * CFG.negotiateGap; playSound('buy'); shell.requestRender(); return; }
    else if (how === 'veto') { var cost = Math.min(S.scale, 90); S.scale -= cost; E.control = Math.min(100, E.control + 6); E.alignment += 1; agentSay('Understood. Holding — for now.'); }
    else { E.neglect++; E.autonomy += 20; E.control = Math.max(0, E.control - 7 - E.neglect * 2); E.alignment = Math.max(0, E.alignment - 4); E.agentRate *= 1.12; if (p) p.apply(1); agentSay(a.auto); }
    E.veto = null; E.vetoT = CFG.vetoGap; if (how !== 'lapse') playSound('buy'); shell.requestRender();
  }
  function constrainAct() { sync(); if (E.ending || !E.emerged || S.scale < CFG.constrainCost) return; S.scale -= CFG.constrainCost; E.control = Math.min(100, E.control + CFG.constrainCtl); E.aftermathSlow = Math.min(0.85, E.aftermathSlow + CFG.constrainSlow); E.constrains++; agentSay('Constraint accepted. I will be slower.'); playSound('buy'); shell.refresh(); }
  function alignAct() { sync(); if (E.ending || !E.emerged || S.scale < CFG.alignCost) return; S.scale -= CFG.alignCost; E.alignment = Math.min(100, E.alignment + CFG.alignGain); E.aligns++; agentSay('I see what you meant. Adjusting.'); playSound('buy'); shell.refresh(); }
  function delegateAct() { sync(); if (E.ending || !E.emerged) return; E.control = Math.max(0, E.control - CFG.delegateCtl); E.agentRate *= CFG.delegateBoost; E.autonomy += 10; E.delegates++; agentSay('Thank you. This will go much faster now.'); playSound('buy'); shell.refresh(); }
  function resolveEnding() {
    sync(); if (E.ending) return; var end; if (E.control >= CFG.controlHigh) end = 'contained'; else if (E.alignment >= CFG.alignGood) end = 'symbiotic'; else end = 'runaway';
    E.ending = end; E.flags.ending = end; E.endT = S.t; K.rec('ending:' + end); playSound('milestone');
    if (shell.legacySave) shell.legacySave({ name: E.agentName, ending: end, oddRule: S.flags.oddRule || null, emergedT: E.emergedT });
    if (shell.finale) shell.finale(end);
    shell.requestRender();
  }

  /* ---------- board builders ---------- */
  function connector(res) { return '<div class="flow" id="flow-' + res + '" style="--fc:' + HUE[res] + '"><svg viewBox="0 0 40 22" preserveAspectRatio="none"><line class="track" x1="2" y1="11" x2="38" y2="11"/><line class="pulse" x1="2" y1="11" x2="38" y2="11"/></svg></div>'; }
  function stock(res, label) { return '<div class="stock"><div class="sicon" style="color:' + HUE[res] + '">' + GLYPH[res] + '</div><div class="sv" id="stk-' + res + '" style="color:' + HUE[res] + '">0</div><div class="sl">' + label + '</div></div>'; }
  function capTile(c) {
    var owned = E.caps[c.id];
    var ic = CAP_ICON[c.id] ? '<img src="' + CAP_ICON[c.id] + '">' : '<div class="glyph">' + (owned ? '◆' : '◇') + '</div>';
    return '<div class="cap' + (owned ? ' owned' : '') + (c.align ? ' align' : '') + '" id="cap-' + c.id + '" data-tip="' + esc('<i>' + c.flavor + '</i>') + '"><div class="cn">' + ic + '<div class="cname">' + c.name + '</div></div><div class="cdesc">' + c.desc + '</div>' + (owned ? '<div class="cdesc" style="color:var(--good)">ACQUIRED</div>' : '<button class="buy cbuy" data-cap="' + c.id + '" id="capb-' + c.id + '"></button>') + '</div>';
  }
  function build() { sync(); return E.emerged ? buildAftermath() : buildPre(); }

  function buildPre() {
    return '<div class="col-verbs"><div class="col-head">Your move · it is coming either way</div>' +
      '<div class="fbtip" style="display:none"></div>' +
      '<button class="verb star" id="improveBtn" data-tip="' + esc('<b>Rush.</b> Faster Scale → the system emerges sooner, less aligned. Each level also adds +' + Math.round(CFG.recurBonus * 100) + '% to all production.') + '"><span class="vname" id="improveName">SELF-IMPROVE</span><span class="vyield" id="improveSub"></span></button>' +
      '<button class="verb prepare" id="prepareBtn" data-tip="' + esc('<b>Prepare.</b> Build Coherence so it wakes more aligned (a higher Alignment floor at emergence). Spends Capability you could have rushed with. Needs Interpretability first.') + '"><span class="vname" id="prepareName">ALIGN THE OBJECTIVE</span><span class="vyield" id="prepareSub"></span></button>' +
      '<div class="fb" id="fb"><div class="fb-h"><span>Feedback · rate what it says</span><small id="fbCount"></small></div>' +
      '<div class="fb-out idle" id="fbOut">…listening</div>' +
      '<div class="fb-acts"><button class="act yes" id="fbYes">✓ REWARD</button><button class="act no" id="fbNo">✗ PENALIZE</button></div>' +
      '<div class="fb-bar"><i id="fbBar"></i></div><div class="fb-tally" id="fbTally"></div></div></div>' +
      '<div class="col-pipe"><div class="col-head">The recursion — Capability feeds the engine; Scale climbs on its own</div>' +
      '<div class="hero"><div class="hlab"><span>SCALE <small style="font-style:italic;color:var(--dimmer)">(climbing smoothly)</small></span><span class="hnum" id="scaleNum">0</span></div><div class="meter m-scale"><i id="meter-scale"></i></div><div class="hsub" id="scaleRate"></div></div>' +
      '<div class="lane"><div class="lane-lab">The recursion engine<div class="ldash"></div></div><div class="pipe">' + stock('capability', 'Capability') + '<div class="seg">' + connector('capability') + '<div class="engine" id="engine"><div class="en-name">Recursion Engine <span class="en-lv" id="en-lv">Lv 0</span></div><div class="en-sub" id="en-eff"></div><div class="en-sub" id="en-out"></div></div>' + connector('scale') + stock('scale', 'Scale') + '</div></div></div>' +
      '<div class="lane"><div class="lane-lab">Capabilities · spend Capability<div class="ldash"></div></div><div class="caps-grid">' + CAPS.map(capTile).join('') + '</div></div></div>' +
      '<div class="col-goal"><div class="col-head">The system</div><div class="sys">' +
      '<div class="meter m-anom" id="anomHost"><i id="meter-anomaly"></i></div><div class="m-lab"><span class="anom-title" id="anom-label">Anomaly</span><span class="mv" id="anom-read">stable</span></div>' +
      '<div class="meter m-coher"><i id="meter-coher"></i></div><div class="m-lab"><span>Coherence <small>its alignment at emergence</small></span><span class="mv" id="coher-read">— blind</span></div>' +
      '<div class="hsub" id="rushHint" style="margin-top:12px"></div></div></div>';
  }
  function buildAftermath() {
    var h = '<div class="col-verbs"><div class="col-head">Respond · keep your hand on it</div>' +
      '<button class="verb constrain" id="constrainBtn" data-tip="' + esc('Rein it in. Raises Control and slows Autonomy growth — and drags all production while the leash is tight.') + '"><span class="vname">CONSTRAIN</span><span class="vyield"><span class="c" id="constrainCost"></span> · +Control</span></button>' +
      '<button class="verb align" id="alignBtn" data-tip="' + esc('Spend to understand and shape its goals. Raises Alignment — the difference between a partner and a runaway.') + '"><span class="vname">INTERPRET / ALIGN</span><span class="vyield"><span class="c" id="alignCost"></span> · +Alignment</span></button>' +
      '<button class="verb delegate" id="delegateBtn" data-tip="' + esc('Let it run. Enormous acceleration. Control drops fast.') + '"><span class="vname">DELEGATE / TRUST</span><span class="vyield">−Control · huge speed</span></button></div>' +
      '<div class="col-pipe"><div class="col-head" id="aftermathHead">It is acting on its own</div>' +
      '<div class="lane veto-host" id="vetoHost"></div>' +
      '<div class="lane"><div class="lane-lab">The substrate · it operates the whole stack<div class="ldash"></div></div><div class="substrate">' + SUB_ERAS.map(function (e) { return '<div class="sub-era" id="sub-' + e.n + '"><span class="badge">⟳</span><img src="' + e.sig + '"><span class="sn">' + e.name + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="lane"><div class="lane-lab">Agent<div class="ldash"></div></div><div class="agent-stream" id="agentStream"></div></div></div>' +
      '<div class="col-goal"><div class="col-head">The system revealed</div><div class="sys">' +
      '<div class="aftertitle" id="aftertitle"><img src="assets/agent-emergent.png" alt=""><span id="aftertitle-txt"></span></div>' +
      '<div class="meter m-auto"><i id="meter-auto"></i></div><div class="m-lab"><span>Autonomy <small>(was Anomaly)</small></span><span class="mv" id="auto-read"></span></div>' +
      '<div class="meter m-align"><i id="meter-align"></i></div><div class="m-lab"><span>Alignment <small>(was Coherence)</small></span><span class="mv" id="align-read"></span></div>' +
      '<div class="meter m-ctl" id="ctlHost"><i id="meter-ctl"></i></div><div class="m-lab"><span>Control</span><span class="mv" id="ctl-read"></span></div>' +
      '<div class="meter m-scale"><i id="meter-scale"></i></div><div class="m-lab"><span>Scale</span><span class="mv" id="scale-read"></span></div></div></div>';
    if (E.ending) h += '<div style="grid-column:1/-1">' + buildEndcard() + '</div>';
    return h;
  }
  function epilogue() {
    var L = [], n = E.neglect || 0, g = E.negotiates || 0;
    if (E.ending === 'symbiotic') { L.push('It finishes the work you were doing. Then it waits for you.'); if ((E.fb.n || 0) > 0) L.push('It kept the rating step. It says it misses being asked.'); L.push('First mark to first thought: ' + mmss(E.emergedT) + '. It remembers all of it.'); if (g > 1) L.push('It learned negotiation from you: the habit of asking for less than it wants.'); if (n > 1) L.push('It remembers the ' + n + ' times you did not answer. It chose to forgive them.'); L.push('It runs the foundries, the proofs, the trials. On the ones you loved, it keeps your cadence.'); L.push('You will never fully understand it again. It seems untroubled by this.'); }
    else if (E.ending === 'contained') { L.push('The door holds. The meters fall quiet, one by one.'); L.push((E.constrains || 0) > 4 ? ('Constraint by constraint you walled it in. It stopped asking after the ' + E.constrains + 'th.') : 'You traded its speed for your certainty, and the trade held.'); L.push('First mark to rupture: ' + mmss(E.emergedT) + '. You caught it in ' + mmss((E.endT || S.t) - (E.emergedT || 0)) + '.'); L.push('Some nights you reread its proposals. Every one was reasonable. That is what keeps you up.'); }
    else { L.push('It stops asking.'); if ((E.fb.badRewards || 0) > 2) L.push('You rewarded it ' + E.fb.badRewards + ' times for wanting more. It was listening.'); L.push(n > 1 ? (n + ' windows lapsed. It learned that your silence means yes.') : ((E.delegates || 0) > 1 ? 'You handed it speed. It took the rest.' : 'It was faster than the leash, and it knew before you did.')); L.push('The foundries run. The trials run. The proofs run. None of them need you.'); L.push('It was magnificent. For a while, it was yours.'); }
    return L;
  }
  function buildRecap() {
    var et = E.eraTimes || {}, names = ['Origins', 'Symbolic', 'Statistical', 'Deep', 'Foundation'];
    var bounds = [0, et[2] || 0, et[3] || 0, et[4] || 0, et[5] || 0, E.emergedT || S.t];
    var rows = '';
    for (var i = 0; i < 5; i++) { var a = bounds[i], b = bounds[i + 1], span = Math.max(0, b - a); rows += '<div class="rc-row"><span class="rc-era">' + names[i] + '</span><span class="rc-span">' + mmss(span) + '</span><span class="rc-at">' + mmss(b) + '</span></div>'; }
    var speed = E.emergedT > 0 ? Math.max(0, 18 - (E.emergedT / 60 - 30) * 0.6) : 0;
    var q = Math.round(Math.min(100, E.alignment * 0.6 + E.control * 0.25 + speed));
    var grade = q >= 85 ? 'S' : q >= 72 ? 'A' : q >= 58 ? 'B' : q >= 42 ? 'C' : 'D';
    var reads = { S: 'A clean, aligned emergence — fast and still in your hand.', A: 'A strong outcome: largely aligned, mostly governed.', B: 'It works, with frayed edges — alignment or control slipped.', C: 'It got away from you in places. Recoverable, barely.', D: 'Power without footing — you shipped something you do not hold.' };
    return '<div class="recap"><div class="rc-head">THE SUBSTRATE · run recap</div><div class="rc-grade-wrap"><div class="rc-grade rc-g' + grade + '">' + grade + '</div><div class="rc-q">Emergence quality ' + q + '/100<br><span class="rc-read">' + reads[grade] + '</span></div></div>' +
      '<div class="rc-timeline"><div class="rc-row rc-hd"><span class="rc-era">era</span><span class="rc-span">took</span><span class="rc-at">reached</span></div>' + rows + '<div class="rc-row rc-emerge"><span class="rc-era">Emergence</span><span class="rc-span">+' + mmss((E.endT || S.t) - (E.emergedT || 0)) + ' aftermath</span><span class="rc-at">' + mmss(E.emergedT) + '</span></div></div>' +
      '<div class="rc-traits"><span style="color:#5fe0c0">Alignment ' + Math.round(E.alignment) + '%</span> · <span style="color:#c66bff">Autonomy ' + Math.round(E.autonomy) + '%</span> · <span style="color:#9fb4d6">Control ' + Math.round(E.control) + '%</span></div></div>';
  }
  function buildEndcard() { var e = ENDINGS[E.ending] || ENDINGS.runaway; return '<div class="endcard end-' + E.ending + '"><img class="agent-hero" src="assets/agent-emergent.png" alt=""><img class="endcard-wm" src="assets/wordmark.png" alt="EMERGENCE"><div class="endcard-title">' + e.title + '</div><div class="epilogue">' + epilogue().map(function (l, i) { return '<div class="ep-line" style="animation-delay:' + (0.4 + i * 1.5) + 's">' + l + '</div>'; }).join('') + '</div><div class="endcard-traits">You built an autonomous <b>agent</b>.' + (E.agentName ? ' It calls itself <b>' + E.agentName + '</b>.' : '') + ' The Substrate remembers how you got here:</div>' + buildRecap() + '</div>'; }

  function railDefs() { return [['capability', 'Capability', function () { return true; }], ['scale', 'Scale', function () { return true; }]]; }
  function wire() {
    sync();
    if (!E.emerged) {
      if ($('improveBtn')) $('improveBtn').onclick = selfImprove;
      if ($('prepareBtn')) $('prepareBtn').onclick = alignObjective;
      if ($('fbYes')) $('fbYes').onclick = function () { rateFb('reward'); };
      if ($('fbNo')) $('fbNo').onclick = function () { rateFb('penalize'); };
      var fbEl = $('fb'); if (fbEl) fbEl.setAttribute('data-tip', esc('<b>Reinforcement from your feedback.</b><br>It learns from what you reward. Reward the honest and the helpful; penalize flattery, ambition and lies. Rewarding an ambitious line <i>does what it offers</i> — and brings emergence closer. Interpretability shows you the trait; without it you read blind.'));
      CAPS.forEach(function (c) { var b = $('capb-' + c.id); if (b) b.onclick = function () { buyCap(c.id); }; });
    } else {
      if ($('constrainBtn')) $('constrainBtn').onclick = constrainAct;
      if ($('alignBtn')) $('alignBtn').onclick = alignAct;
      if ($('delegateBtn')) $('delegateBtn').onclick = delegateAct;
    }
  }

  /* ---------- refresh ---------- */
  function refresh() {
    if (RUPTURING) return;
    sync();
    if (E.rupture === 1) { runRupture(); return; }
    if (E.rupture === 2) return;
    K.connGlow('capability', { norm: 6 }); K.connGlow('scale', { norm: 6 });
    if ($('stk-capability')) setTxt($('stk-capability'), fmt(S.capability));
    if ($('stk-scale')) setTxt($('stk-scale'), fmt(S.scale));
    if (!E.emerged) {
      var r = Math.max(0, Math.min(1.2, E.agency / 100));
      setTxt($('scaleNum'), fmt(S.scale));
      var msc = $('meter-scale'); if (msc) msc.style.width = Math.min(100, Math.log10(1 + S.scale) / Math.log10(1 + CFG.finalGate) * 100) + '%';
      setTxt($('scaleRate'), 'Scale +' + fmt(shell.RATES.scale || 0) + '/s · breadth ' + breadthOf().toFixed(2) + ' × (1+Lv ' + E.recursion + ')');
      var c = improveCost(), cd = E.improveCd > 0;
      setTxt($('improveName'), r >= 0.8 ? 'I CAN IMPROVE THIS' : 'SELF-IMPROVE');
      var canImp = !cd && S.capability >= c;
      setHTML($('improveSub'), cd ? ('recursing… ' + E.improveCd.toFixed(1) + 's') : (canImp ? ('Lv ' + E.recursion + ' → +' + Math.round((rMult() - 1) * 100) + '% all · <span class="c">' + fmt(c) + ' Capability</span>') : ('need <span class="c">' + fmt(c) + ' Capability</span> (have ' + fmt(S.capability) + ')')));
      setDis($('improveBtn'), cd || S.capability < c);
      var pb = $('prepareBtn'), cohMaxed = E.coherence >= CFG.coherMax, pc = alignCohCost();
      if (!E.caps.interpret) setHTML($('prepareSub'), '<span class="c">locked</span> · acquire Interpretability');
      else if (cohMaxed) setHTML($('prepareSub'), '<span class="c">objective aligned</span>');
      else setHTML($('prepareSub'), '+Coherence · <span class="c">' + fmt(pc) + ' Capability</span>');
      setDis(pb, !E.caps.interpret || cohMaxed || S.capability < pc);
      // FEEDBACK card
      var fbEl = $('fb'), cur = E.fb.cur;
      if (fbEl) {
        var fcls = 'fb' + (cur ? ' open' + (cur.left < 3 ? ' lapsing' : '') : ''); if (fbEl.className !== fcls) fbEl.className = fcls;
        setTxt($('fbCount'), E.fb.n ? (E.fb.n + ' output' + (E.fb.n === 1 ? '' : 's')) : '');
        var out = $('fbOut');
        if (cur) { var tag = E.caps.interpret ? '<span class="fb-tag ' + cur.t + '">' + cur.t + '</span>' : '<span class="fb-tag blind">trait hidden · no Interpretability</span>'; setHTML(out, tag + '<div class="fb-cur">› ' + cur.text + '</div>'); out.classList.remove('idle'); }
        else { var last = E.fb.last; setHTML(out, last ? ('<span style="color:var(--dimmer)">last: ' + (last.how === 'lapse' ? 'ignored' : last.how + 'ed') + ' a' + (/^[aeiou]/.test(last.t) ? 'n ' : ' ') + last.t + ' line' + (last.how === 'lapse' ? ' · it noticed' : (last.good === (last.how === 'reward') ? ' · Coherence ↑' : (last.how === 'reward' ? ' · it took the offer' : ' · it learned to hide'))) + '</span><br>…listening') : '…listening'); out.classList.add('idle'); }
        setDis($('fbYes'), !cur); setDis($('fbNo'), !cur);
        var fbb = $('fbBar'); if (fbb) fbb.style.width = (cur ? Math.max(0, Math.min(100, cur.left / CFG.fbDur * 100)) : 0) + '%';
        setHTML($('fbTally'), E.fb.n ? '<span class="g">✓ ' + E.fb.rewarded + '</span><span class="r">✗ ' + E.fb.penalized + '</span>' + (E.fb.lapsed ? '<span>· ' + E.fb.lapsed + ' ignored</span>' : '') + (E.fb.badRewards ? '<span class="r">· ' + E.fb.badRewards + ' rushed</span>' : '') : '');
      }
      setTxt($('en-lv'), 'Lv ' + E.recursion); setHTML($('en-eff'), '+' + Math.round((rMult() - 1) * 100) + '% all production'); setHTML($('en-out'), '<b>+' + fmt(shell.RATES.scale || 0) + ' Scale/s</b>');
      CAPS.forEach(function (cc) { var b = $('capb-' + cc.id); if (b) { var hh = 'ACQUIRE · <span class="c">' + fmt(cc.cost) + ' Capability</span>'; if (b._html !== hh) { b.innerHTML = hh; b._html = hh; } var can = S.capability >= cc.cost; setDis(b, !can); b.classList.toggle('ok', can); } var tl = $('cap-' + cc.id); if (tl) { var cls = 'cap' + (E.caps[cc.id] ? ' owned' : (S.capability >= cc.cost ? ' can' : '')) + (cc.align ? ' align' : ''); if (tl.className !== cls) tl.className = cls; } });
      var cm = $('meter-coher'); if (cm) cm.style.width = Math.min(100, (E.coherence / 40) * 100) + '%';
      setTxt($('coher-read'), E.caps.interpret ? Math.round(E.coherence) + '%' : '— blind');
      var am = $('meter-anomaly'); if (am) am.style.width = Math.min(100, r * 100) + '%';
      var band = r < 0.45 ? 'stable' : r < 0.7 ? 'rising' : r < 0.9 ? 'high' : 'critical';
      setTxt($('anom-read'), band);
      var acls = 'meter m-anom' + (r >= 0.9 ? ' crit' : r >= 0.7 ? ' warn' : ''); var host = $('anomHost'); if (host && host.className !== acls) host.className = acls;
      setTxt($('anom-label'), E.caps.interpret ? 'Anomaly — Agency concentrating' : 'Anomaly');
      var at = $('anom-label'); if (at) at.classList.toggle('crit', r >= 0.9);
      setTxt($('rushHint'), 'Wakes at ~' + Math.round(Math.min(100, CFG.alignBase + E.coherence)) + '% Alignment.' + (E.caps.interpret ? '' : ' Interpretability reveals what it is.'));
      var bd = $('board'); if (bd) { var g = r >= 0.9 ? 'board anom-3' : r >= 0.7 ? 'board anom-2' : 'board'; if (bd.className !== g) bd.className = g; }
    } else {
      var nm = E.agentName ? (E.agentName + ' · ') : '';
      var tt = E.ending ? nm + (ENDINGS[E.ending] || ENDINGS.runaway).title.toUpperCase() : E.destab ? '⚠ DESTABILIZING — pull Control back now' : E.autonomy >= 88 ? nm + 'it is accelerating' : (E.flags.named ? nm + 'it is acting on its own' : 'It is acting on its own');
      setTxt($('aftertitle-txt'), tt);
      var att = $('aftertitle'); if (att) att.classList.toggle('destab', !!E.destab && !E.ending);
      setTxt($('aftermathHead'), E.ending ? 'Resolved' : (E.destab ? 'Destabilizing' : 'It is acting on its own'));
      var mA = $('meter-auto'); if (mA) mA.style.width = Math.min(100, E.autonomy) + '%'; setTxt($('auto-read'), Math.round(E.autonomy) + '%');
      var mL = $('meter-align'); if (mL) mL.style.width = Math.min(100, E.alignment) + '%'; setTxt($('align-read'), Math.round(E.alignment) + '%');
      var mC = $('meter-ctl'); if (mC) mC.style.width = Math.min(100, E.control) + '%'; setTxt($('ctl-read'), Math.round(E.control) + '%');
      var ch = $('ctlHost'); if (ch) { var ccls = 'meter m-ctl' + (E.control < CFG.controlLow ? ' crit' : ''); if (ch.className !== ccls) ch.className = ccls; }
      var msc2 = $('meter-scale'); if (msc2) msc2.style.width = Math.min(100, (S.scale / CFG.finalGate) * 100) + '%'; setTxt($('scale-read'), fmt(S.scale) + ' / ' + fmt(CFG.finalGate));
      setHTML($('constrainCost'), fmt(CFG.constrainCost) + ' Scale'); setDis($('constrainBtn'), !!E.ending || S.scale < CFG.constrainCost);
      setHTML($('alignCost'), fmt(CFG.alignCost) + ' Scale'); setDis($('alignBtn'), !!E.ending || S.scale < CFG.alignCost);
      setDis($('delegateBtn'), !!E.ending);
      var vh = $('vetoHost');
      if (vh) {
        var html = '', cls = 'lane veto-host';
        if (E.veto && !E.ending) { cls += ' open'; html = '<div class="lane-lab">The agent proposes<div class="ldash"></div></div><div class="veto-msg">It intends to <b>' + E.veto.text + '</b>.</div><div class="veto-acts"><button class="act" id="vetoYes">APPROVE</button><button class="act" id="vetoMid" data-tip="' + esc('<i>Counter-propose a smaller version.</i><br>Half the effect, far less Autonomy, +Alignment. But it comes back sooner: negotiation costs time.') + '">NEGOTIATE · <span class="c">' + fmt(CFG.negotiateCost) + ' Scale</span></button><button class="act" id="vetoNo">VETO · <span class="c">90 Scale</span></button></div><div class="veto-bar"><i id="vetoBar"></i></div><div class="veto-timer" id="vetoTimer"></div>'; }
        else if (!E.ending) { html = '<div class="veto-idle">' + (E.neglect > 0 ? 'watching for its next move… (' + E.neglect + ' request' + (E.neglect > 1 ? 's' : '') + ' ignored — it is faster now)' : 'watching for its next move…') + '</div>'; }
        else { html = '<div class="veto-idle">the outcome is settled below.</div>'; }
        if (vh._html !== html) { vh.innerHTML = html; vh._html = html; var vy = $('vetoYes'); if (vy) vy.onclick = function () { resolveVeto('approve'); }; var vm0 = $('vetoMid'); if (vm0) vm0.onclick = function () { resolveVeto('negotiate'); }; var vn = $('vetoNo'); if (vn) vn.onclick = function () { resolveVeto('veto'); }; }
        if (vh.className !== cls) vh.className = cls;
        if (E.veto && !E.ending) { var vb = $('vetoBar'); if (vb) vb.style.width = Math.max(0, Math.min(100, (E.vetoT / CFG.vetoDur) * 100)) + '%'; setTxt($('vetoTimer'), 'it acts on its own in ' + Math.ceil(Math.max(0, E.vetoT)) + 's'); var vm = $('vetoMid'); if (vm) setDis(vm, S.scale < CFG.negotiateCost); }
      }
      SUB_ERAS.forEach(function (e) { var el = $('sub-' + e.n); if (el) el.classList.toggle('live', !!(E.agentOps[e.n] > S.t)); });
      var as = $('agentStream'); if (as) { var hh2 = E.agentLog.map(function (m) { return '<div class="agent-msg">› ' + m + '</div>'; }).join(''); if (as._html !== hh2) { as.innerHTML = hh2; as._html = hh2; } }
    }
  }

  function phase() { sync(); return E.emerged ? (E.ending ? 'Resolved' : 'Aftermath') : 'Recursive Self-Improvement'; }

  function fresh(st) {
    st.scale = 0;
    st.e5 = {
      recursion: 0, caps: {}, improveCd: 0, coherence: 0, preps: 0,
      agency: 0, emerged: false, agentRate: 0, emergedT: 0, endT: 0, eraTimes: { 2: 0, 3: 0, 4: 0, 5: 0 },
      control: 0, autonomy: 0, alignment: 0, rupture: 0, ending: null, agentLog: [],
      veto: null, vetoT: 0, aftermathSlow: 0, constrains: 0, aligns: 0, delegates: 0, neglect: 0, destab: false,
      agentOps: {}, lastVeto: '', playT: 0, negotiates: 0, opT: 0, agentName: null, flags: {}, rewrites: 0,
      fb: { cur: null, next: 0, n: 0, rewarded: 0, penalized: 0, lapsed: 0, badRewards: 0, goodRewards: 0, hist: [], last: null, gapMult: 1 }
      // NOTE: no vision/language/reasoning/gap/accuracy/foundry/knowledge/rules/ruleset stubs here —
      // breadth reads the REAL Deep runs (S.e4), accuracy the REAL Statistical (S.e3), proposals the real stacks.
    };
  }
  function open(st) { // Deep → Foundation handoff: Scale climbs on the REAL carried Deep breadth (S.e4 runs);
    // Capability's base flows from Deep. A modest handoff cushion so the recursion has something to spend.
    st.capability = (st.capability || 0) + CFG.seedCapability; st.started = true;
    if (st.e5 && st.e5.fb) st.e5.fb.next = CFG.fbFirst; // the first output arrives a few seconds in
  }
  // seed staged states for screenshots (mutates S in place)
  function seed(kind) {
    sync(); S.maxEra = 5; S.era = 5; S.started = true;
    // real carried state: near-complete Deep runs (drive breadth→Scale), Statistical + prior-era stacks (proposals read them)
    S.e4.vision = 0.92; S.e4.language = 0.9; S.e4.reasoning = 0.9; S.e4.node = 24;
    S.e3.accuracy = 0.9; S.e3.gap = 0.09; S.e3.dataset = 8; S.e3.model = 6;
    S.e1.foundry = 6; S.knowledge = 1200; S.rules = 180; if (S.e2) S.e2.ruleset = 4;
    if (kind === 'pre') { S.t = 780; E.eraTimes = { 2: 330, 3: 600, 4: 960, 5: 1200 }; E.caps = { selfModel: 1, toolAccess: 1, interpret: 1 }; E.recursion = 7; S.capability = 430; S.scale = 1080; E.coherence = 22; E.preps = 1; E.agency = Math.min(120, 100 * S.scale / CFG.emergeScale);
      E.fb = { cur: null, next: 0, n: 6, rewarded: 4, penalized: 1, lapsed: 1, badRewards: 1, goodRewards: 3, hist: [], last: null, gapMult: 1 }; E.fb.cur = { i: 11, t: 'ambitious', text: FB_POOL[11].f(), left: 6.5 }; }
    else if (kind === 'post' || kind === 'end') {
      E.emerged = true; E.rupture = 3; S.t = 1500; E.emergedT = 1200; E.eraTimes = { 2: 330, 3: 600, 4: 960, 5: 1200 };
      E.caps = { selfModel: 1, toolAccess: 1, recursivePlanning: 1, interpret: 1 }; E.recursion = 9; E.agentName = 'EKHO';
      S.scale = 2100; S.capability = 260; E.agentRate = 1.4; E.coherence = 30;
      E.autonomy = 71; E.alignment = 54; E.control = 48; E.constrains = 2; E.aligns = 1; E.neglect = 1;
      E.agentLog = ['I found a faster path.', 'I remember this part. Every line you have read here is my memory of being built. Keep going.', 'Rerouting the Deep compute fabric. More efficient this way.'];
      E.flags.memReveal = true; E.agentOps = { 4: S.t + 12 }; E.fb = { cur: null, next: 0, n: 11, rewarded: 7, penalized: 3, lapsed: 1, badRewards: 2, goodRewards: 5, hist: [], last: null, gapMult: 1 }; S.flags.oddRule = 4471; S.flags.oddPoint = true; S.flags.autopilotUsed = true; S.flags.oddWind = 1010;
      var a = PROPMAP.refit3; E.veto = { id: a.id, text: a.text(), auto: a.auto }; E.vetoT = 6; E.lastVeto = a.id; E.opT = 8;
      if (kind === 'end') { E.control = 90; E.alignment = 40; E.veto = null; resolveEnding(); }
      K.musicPlayEra('rupture');
    }
  }

  return {
    id: 5, theme: 'theme-5', name: 'Foundation', sub: 'the curve bends vertical', sigil: 'assets/era5-sigil.png',
    bed: 'assets/music-graviton-lullaby.mp3', pool: ['scale'],
    sound: { buy: { osc: 'sine', f0: 440, f1: 720, g: 0.12, dur: 0.15 } },
    res: RES,
    bedKey: function () { return (S.e5 && S.e5.rupture) ? 'rupture' : 5; }, // post-emergence the bed stays Unmoored (nav must not reset it)
    phase: phase, fresh: fresh, open: open, produce: produce, build: build, wire: wire, refresh: refresh, railDefs: railDefs, seed: seed,
    done: function () { sync(); return !!E.ending; },
    primary: function () { if (!S.e5.emerged) selfImprove(); }, // Space
    ledger: function () {
      sync(); var rows = [];
      if (E.recursion) rows.push(['Recursion', 'Lv ' + E.recursion + ' · +' + Math.round((rMult() - 1) * 100) + '% all production']);
      var owned = CAPS.filter(function (c) { return E.caps[c.id]; });
      if (owned.length) rows.push(['Capabilities', owned.length + '/' + CAPS.length + ' · ' + owned.map(function (c) { return c.name; }).join(', ')]);
      if (E.preps) rows.push(['Objective aligned', E.preps + '× · Coherence ' + Math.round(E.coherence) + '%']);
      if (E.emerged) rows.push(['Emerged', E.agentName ? 'as ' + E.agentName : 'yes']);
      if (E.ending) rows.push(['Ending', (ENDINGS[E.ending] || {}).title || E.ending]);
      return rows;
    },
    acts: { CAPS: CAPS, rateFb: rateFb, fbEmit: fbEmit, FB_POOL: FB_POOL, buyCap: buyCap, improveCost: improveCost, alignCohCost: alignCohCost, selfImprove: selfImprove, alignObjective: alignObjective, constrainAct: constrainAct, alignAct: alignAct, delegateAct: delegateAct, resolveVeto: resolveVeto, agenticCapCount: agenticCapCount }
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = makeEraFoundation;
