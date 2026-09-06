/* ============================================================================
   ERA MODULE — Deep (era 4). Ported from emergence-v3-deep.html onto the shared
   shell + KIT. Re-homed: capability is a new shared-pool resource; the runs draw
   the shared silicon/data/insight/knowledge; Deep mechanic state lives on S.e4.
   NOTE: the 4 collapsed supply producers (foundry/dataset/model/scriptorium) are a
   STAND-IN kept verbatim; reverted to the real Origins/Statistical buses in task #3.
   RR5 chainPerFoundry is genuine and preserved. Factory: makeEraDeep(shell).
   ============================================================================ */
function makeEraDeep(shell) {
  var K = shell.KIT, $ = K.$, fmt = K.fmt, esc = K.esc, setTxt = K.setTxt, setHTML = K.setHTML, setDis = K.setDis, setAttr = K.setAttr;
  var S = shell.S, CFG = shell.CFG.e4;

  var RES = { capability: { hue: '#6ea8ff', glyph: '◈', flavor: 'What the system can actually do. Accrues from breadth × compute; spent on steering tools.' } };
  var PH = { vision: 0, language: 2.094, reasoning: 4.189 };
  var RUNCOL = { vision: '#54d2ff', language: '#b58cff', reasoning: '#6fe6a8' };
  var FEEDLBL = { data: 'Data', insight: 'Insight', knowledge: 'Knowledge' };
  var HUE = { compute: '#a9cfff', capability: '#6ea8ff', data: '#54d2ff', insight: '#6fe6a8', knowledge: '#e0a93f', silicon: '#a9d8ce' };
  var ICON = { node: 'assets/icon-node.png', vision: 'assets/e4-vision.png', language: 'assets/e4-language.png', reasoning: 'assets/e4-reasoning.png', silicon: 'assets/icon-silicon.png', knowledge: 'assets/icon-knowledge.png', data: 'assets/e3-dataset.png', foundry: 'assets/icon-foundry.png', scriptorium: 'assets/icon-scriptorium.png' };
  var GLYPH = { compute: '⚡', capability: '◈', insight: '✦', model: '✧', data: '◉' };
  var RESTIP = {
    compute: '<i>Raw processing, poured into training.</i><br>Produced by Compute Nodes; routed to the three runs by the mixer.',
    capability: '<i>What the system can actually do.</i><br>Accrues from geometric-mean breadth × compute. Spent on steering tools.',
    data: '<i>Observations.</i><br>Feeds the <b>Vision</b> run. Made by Datasets.',
    insight: '<i>Training ideas.</i><br>Feeds the <b>Reasoning</b> run. Made by Fit Engines.',
    knowledge: '<i>Symbols and meaning.</i><br>Feeds the <b>Language</b> run. Made by Scriptoria.',
    silicon: '<i>Sand, taught to carry thought.</i><br>Builds Compute Nodes and the supply stack. Made by Foundries.'
  };
  // Each supply button BUILDS the real upstream producer (in Origins / Statistical), from here, paid in Silicon.
  var SUPPLY = [
    { key: 'foundry', name: 'Foundry', out: 'silicon', era: 1, field: 'foundry', cost: CFG.foundryCost, growth: CFG.foundryGrowth, icon: ICON.foundry, tip: '<b>Foundry</b> — builds a real Origins Foundry, from here.<br><i>Metal and knowledge, fused into Silicon.</i><br>+Silicon/s · each also lifts Capability +3% (RR5). Paid in Silicon.' },
    { key: 'dataset', name: 'Dataset', out: 'data', era: 3, field: 'dataset', cost: CFG.datasetCost, growth: CFG.datasetGrowth, icon: ICON.data, tip: '<b>Dataset</b> — builds a real Statistical Dataset.<br><i>Observations, curated.</i><br>+Data/s — feeds the <b>Vision</b> run. Paid in Silicon.' },
    { key: 'model', name: 'Fit Engine', out: 'insight', era: 3, field: 'model', cost: CFG.modelCost, growth: CFG.modelGrowth, glyph: GLYPH.model, tip: '<b>Fit Engine</b> — builds a real Statistical Fit Engine.<br><i>Experiments distilled into ideas.</i><br>+Insight/s — feeds the <b>Reasoning</b> run. Paid in Silicon.' },
    { key: 'scriptorium', name: 'Scriptorium', out: 'knowledge', era: 1, field: 'scriptorium', cost: CFG.scriptoriumCost, growth: CFG.scriptoriumGrowth, icon: ICON.scriptorium, tip: '<b>Scriptorium (staffed)</b> — builds a real Origins Scriptorium, and the scribes and miners to feed it come along.<br><i>Marks made meaningful.</i><br>+Knowledge/s — feeds the <b>Language</b> run. Paid in Silicon.' }
  ];
  var SUPMAP = {}; SUPPLY.forEach(function (s) { SUPMAP[s.key] = s; });
  function producerCount(s) { return (S['e' + s.era] || {})[s.field] || 0; }
  function producerRate(s) { var c = producerCount(s), e1 = shell.CFG.e1, e3 = shell.CFG.e3, tm = K.tierMult(c);
    if (s.field === 'foundry') return c * e1.foundryRate * tm;
    if (s.field === 'scriptorium') return c * e1.scriptoriumRate * tm;
    if (s.field === 'dataset') return c * e3.datasetYield * tm;
    return c * e3.expPerModel * tm * e3.insightPerExp; }
  var cap1 = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var domLabel = function (k) { var d = CFG.domains.filter(function (x) { return x.k === k; })[0]; return (d && d.label) || k; };

  var E; function sync() { E = S.e4; }
  // ARCHITECTURE — Capability-priced upgrades that change the steering geometry (each a real decision, none a flat +%)
  var ARCH = [
    { id: 'stabilizer', name: 'Stabilizer', glyph: '≋', col: '#6ea8ff', repeat: true, eff: '−13% drift on every run per level (max 5)', tip: '<i>A calmer optimization landscape.</i><br>Permanently reduces how hard the drift bites every run. Stacks up to 5.' },
    { id: 'attention', name: 'Attention', glyph: '⌖', col: RUNCOL.language, eff: 'Language drift −35% · its Knowledge draw −30%', tip: '<i>Learn what to look at.</i><br>The Language run stops fighting the wind so hard, and drinks less Knowledge per share — the scarce line breathes.' },
    { id: 'convolution', name: 'Convolution', glyph: '▦', col: RUNCOL.vision, eff: 'Vision Data draw −50% · Vision gains +20%', tip: '<i>See locally, everywhere at once.</i><br>Vision needs half the Data per share and learns faster.' },
    { id: 'cot', name: 'Chain of Thought', glyph: '⛓', col: RUNCOL.reasoning, eff: 'Reasoning gains +35% × Language cap', tip: '<i>Think in words before answering.</i><br>Reasoning now learns from Language: the higher Language sits, the faster Reasoning climbs. Couples the runs.' },
    { id: 'moe', name: 'Mixture of Experts', glyph: '⊞', col: '#a9cfff', eff: 'Heat rises 40% slower', tip: '<i>Route each problem to a specialist.</i><br>Concentrating compute heats the fabric less — you can hammer a run longer before easing off.' },
    { id: 'checkpoint', name: 'Checkpointing', glyph: '⎘', col: '#82ffc8', eff: 'Unlocks CHECKPOINT + RESTORE', tip: '<i>Save the weights.</i><br>Snapshot all three runs; after a squall, RESTORE them (Capability + a cooldown). Never lowers a run.' },
    { id: 'distill', name: 'Distillation', glyph: '⇄', col: '#ffb15c', eff: 'Unlocks DISTILL: peak run → lagging run', tip: '<i>Teach the small model what the big one knows.</i><br>Moves capability from your highest run to your lowest (lossy). Breadth is a geometric mean — it is usually right, and always a trade.' }
  ];
  var ARCHMAP = {}; ARCH.forEach(function (a) { ARCHMAP[a.id] = a; });
  var archCost = function (id) { return id === 'stabilizer' ? stabilizerCost() : CFG.arch[id]; };
  var archOwned = function (id) { return id === 'stabilizer' ? E.stabilizer >= CFG.stabilizerMax : !!E.arch[id]; };
  var canArch = function (id) { return !archOwned(id) && S.capability >= archCost(id); };
  function buyArch(id) {
    sync(); if (id === 'stabilizer') { buyStabilizer(); renderArch(); return; } if (!canArch(id)) return; S.capability -= archCost(id); E.arch[id] = true; K.rec('arch:' + id); K.playSound('buy');
    var a = ARCHMAP[id]; K.toast('ARCHITECTURE · ' + a.name.toUpperCase(), a.eff + '<br><i>' + a.tip.replace(/<[^>]+>/g, '').split('.')[0] + '.</i>');
    shell.requestRender();
  }
  // the two verbs the tree unlocks
  var restoreCost = function () { return Math.round(CFG.restoreCost * Math.pow(CFG.restoreGrowth, E.restores || 0)); };
  function checkpoint() { sync(); if (!E.arch.checkpoint) return; E.ckpt = { vision: E.vision, language: E.language, reasoning: E.reasoning, t: S.t }; K.rec('checkpoint'); K.playSound('buy'); shell.refresh(); }
  function restore() {
    sync(); if (!E.arch.checkpoint || !E.ckpt || E.restoreCd > 0) return; var c = restoreCost(); if (S.capability < c) return;
    S.capability -= c; E.restores = (E.restores || 0) + 1; E.restoreCd = CFG.restoreCd;
    CFG.domains.forEach(function (d) { E[d.k] = Math.max(E[d.k], E.ckpt[d.k] || 0); });
    K.rec('restore'); K.playSound('brk'); K.toast('RESTORED', 'The runs are back at the checkpoint. The squall took nothing.'); shell.refresh();
  }
  function distill() {
    sync(); if (!E.arch.distill || E.distillCd > 0 || S.capability < CFG.distillCost) return;
    var hi = CFG.domains[0].k, lo = CFG.domains[0].k; CFG.domains.forEach(function (d) { if (E[d.k] > E[hi]) hi = d.k; if (E[d.k] < E[lo]) lo = d.k; });
    if (hi === lo || E[hi] - E[lo] < 0.02) return;
    S.capability -= CFG.distillCost; E.distillCd = CFG.distillCd; E.distills = (E.distills || 0) + 1;
    var take = Math.min(CFG.distillTake, E[hi] - E[lo]); E[hi] -= take; E[lo] = Math.min(1, E[lo] + take * (CFG.distillGive / CFG.distillTake));
    K.rec('distill:' + hi + '>' + lo); K.playSound('buy'); shell.refresh();
  }
  var breadth = function () { return Math.cbrt(Math.max(0, E.vision) * Math.max(0, E.language) * Math.max(0, E.reasoning)); };
  // per-run geometry from the architecture: {feed, drift, gain} multipliers
  function geom(k) {
    var A = E.arch || {}, g = { feed: 1, drift: 1, gain: 1 };
    if (k === 'language' && A.attention) { g.drift *= CFG.attentionDrift; g.feed *= CFG.attentionFeed; }
    if (k === 'vision' && A.convolution) { g.feed *= CFG.convFeed; g.gain *= CFG.convGain; }
    if (k === 'reasoning' && A.cot) g.gain *= (1 + CFG.cotCouple * Math.max(0, E.language || 0));
    return g;
  }
  // 0..1 — how many seconds of feedstock are in hand vs the horizon (needPerSec = share/s × feed rate)
  function fedLevel(k, needPerSec) { var res = CFG.feedstock[k]; if (!(needPerSec > 0)) return 0; return Math.max(0, Math.min(1, (S[res] || 0) / (needPerSec * CFG.fedHorizon))); }

  /* ---------- production ---------- */
  function produce(dt) {
    sync();
    // No stand-in producers here: the feedstocks (silicon/data/insight/knowledge) are produced by the REAL
    // Origins + Statistical eras running in the background (fed via the supply-bus build-here buttons).
    if (E.node > 0) {
      var doms = CFG.domains, t = S.t || 0;
      var computeRate = E.node * CFG.nodeCompute * K.tierMult(E.node), compute = computeRate * dt; // v4 milestones on nodes
      var throttle = E.heat >= CFG.heatThrottle ? CFG.throttleHot : (E.heat >= CFG.heatWarn ? CFG.throttleWarm : 1);
      var tw = doms.reduce(function (acc, d) { return acc + (E.alloc[d.k] || 0); }, 0) || 1; var maxShare = 0;
      if (E.restoreCd > 0) E.restoreCd = Math.max(0, E.restoreCd - dt); if (E.distillCd > 0) E.distillCd = Math.max(0, E.distillCd - dt);
      doms.forEach(function (d) {
        var k = d.k, frac = (E.alloc[k] || 0) / tw; if (frac > maxShare) maxShare = frac;
        if (E.locks[k] > 0) { E.locks[k] = Math.max(0, E.locks[k] - dt); return; }
        var share = compute * frac, g = geom(k);
        var res = CFG.feedstock[k], need = share * CFG.feedPerShare * g.feed, feedMult = 1;
        if (need > 0) { if (S[res] >= need) { S[res] -= need; K.fOut(res, need); } else { feedMult = need > 0 ? S[res] / need : 0; K.fOut(res, S[res]); S[res] = 0; } }
        var wind = 0.5 + 0.5 * Math.sin(t * CFG.driftFreq + PH[k]);
        var driftBite = CFG.driftBite * Math.max(0.35, 1 - E.stabilizer * CFG.stabilizerCut);
        var evShift = !!(E.event && E.event.type === 'shift' && E.event.run === k);
        var demand = CFG.driftDemand * g.drift * wind * (evShift ? CFG.shiftDemand : 1);
        var shortfall = Math.max(0, demand - frac);
        E.fedT[k] = shortfall <= 0 ? E.fedT[k] + dt : 0;
        var momentum = E.fedT[k] >= CFG.momentumAfter ? 0.5 : 1;
        var erode = driftBite * shortfall * momentum * (0.3 + 0.7 * E[k]) * computeRate * dt;
        var evM = (E.event && E.event.run === k && E.event.type === 'breakthrough') ? E.event.mult : 1;
        // a well-fed run learns faster (supply visibly eases steering): +15% at 20s of stock in hand
        var fed = 1 + CFG.fedBonus * fedLevel(k, share / dt * CFG.feedPerShare * g.feed);
        var gain = CFG.capGain * share * (1 - E[k]) * feedMult * throttle * evM * g.gain * fed;
        E[k] = Math.max(0, Math.min(1, E[k] + gain - erode));
      });
      var conc = Math.max(0, maxShare - CFG.heatBase);
      E.heat = Math.max(0, Math.min(110, E.heat + (CFG.heatRise * (E.arch.moe ? CFG.moeHeat : 1) * conc - CFG.cooling) * dt));
      // foreshadow (once): the banner says something it should not know
      if (!K.MUTE && !S.flags.oddWind && breadth() >= 0.6 && !E.event && !E.eventNext) { S.flags.oddWind = S.t; K.rec('odd:wind'); }
      var br = breadth();
      S.capability += br * compute * CFG.capRate * throttle * (1 + CFG.chainPerFoundry * ((S.e1 && S.e1.foundry) || 0)); // RR5: real Origins foundry count compounds Capability
      if (!K.MUTE) { // exogenous events run live only (offline catch-up freezes the weather, like the shipped game)
        E.eventT -= dt;
        if (!E.event && !E.eventNext && E.eventT <= CFG.eventWarn) {
          var hiK = doms[0].k, loK = doms[0].k; doms.forEach(function (d) { if (E[d.k] > E[hiK]) hiK = d.k; if (E[d.k] < E[loK]) loK = d.k; });
          var shift = (Math.floor(t / (CFG.eventGap + CFG.eventDur)) % 2) === 0;
          E.eventNext = { type: shift ? 'shift' : 'breakthrough', run: shift ? hiK : loK };
        }
        if (E.eventT <= 0) {
          if (E.event) { E.event = null; E.eventT = CFG.eventGap; }
          else {
            var nx = E.eventNext || { type: 'shift', run: doms[0].k }; var lbl = domLabel(nx.run);
            var mine = !!(S.e5 && S.e5.emerged); // after emergence it routes the fabric — the weather is its problem, not a toast for you
            if (nx.type === 'shift') { E.event = { type: 'shift', run: nx.run, mult: 1 }; E[nx.run] = Math.max(0, E[nx.run] - CFG.shiftDrop); if (!mine) K.toast('DRIFT SQUALL · ' + lbl, 'This run now demands far more — pour compute in until it passes.', 'ev'); }
            else { E.event = { type: 'breakthrough', run: nx.run, mult: CFG.breakthroughMult }; if (!mine) K.toast('BREAKTHROUGH · ' + lbl, 'Clean gradient — concentrate here, eat the heat, ease off after.', 'brk'); }
            E.eventNext = null; E.eventT = CFG.eventDur;
          }
        }
      }
    }
  }

  /* ---------- buys / steering ---------- */
  var unitCost = function (base, growth, count) { return Math.floor(base * Math.pow(growth, count)); };
  var nodeCost = function () { return unitCost(CFG.nodeCost, CFG.nodeGrowth, E.node); };
  var nodeBatch = function () { return K.batch(shell.buyN ? shell.buyN() : 1, CFG.nodeCost, CFG.nodeGrowth, E.node, S.silicon); };
  var canNode = function () { return S.silicon >= nodeBatch().cost; };
  function buyNode() {
    sync(); if (!canNode()) return; var b = nodeBatch(), t0 = K.tierOf(E.node);
    S.silicon -= b.cost; E.node += b.n; K.rec('buy:node', { n: b.n }); K.playSound('buy');
    if (K.tierOf(E.node) > t0) K.toast('MILESTONE · Compute Node ×' + E.node, '+' + Math.round(K.MILESTONE_BONUS * 100) + '% compute from every node, forever.');
    shell.refresh();
  }
  var supCost = function (s) { return unitCost(s.cost, s.growth, producerCount(s)); };
  var supBatch = function (s) { return K.batch(shell.buyN ? shell.buyN() : 1, s.cost, s.growth, producerCount(s), S.silicon); };
  var canSup = function (s) { return S.silicon >= supBatch(s).cost; };
  // A Scriptorium without scribes converts nothing (Marks pin at 0) — the build-here buy must deliver the
  // +Knowledge/s it advertises, so the staff (scribes for Marks, miners for the Ore upkeep) comes with it.
  function staffKnowledgeLine() {
    var e1 = S.e1; if (!e1) return;
    var A1 = shell.era && shell.era(1) && shell.era(1).acts; if (!A1) return;
    var os = A1.oStats(), C1 = shell.CFG.e1;
    var draw = e1.scriptorium * os.scrR;
    var needScribes = Math.ceil(Math.max(0, draw * 1.1 - e1.scribe * os.scribeY) / Math.max(0.0001, os.scribeY));
    if (needScribes > 0) e1.scribe += needScribes;
    var oreDraw = draw * C1.scriptoriumUpkeep;
    var needMiners = Math.ceil(Math.max(0, oreDraw * 1.1 - e1.miner * os.minerY) / Math.max(0.0001, os.minerY));
    if (needMiners > 0) e1.miner += needMiners;
    if (e1.paused) e1.paused.scriptorium = false; // it came staffed — make sure it runs
  }
  function buySup(key) {
    sync(); var s = SUPMAP[key]; if (!canSup(s)) return; var b = supBatch(s); S.silicon -= b.cost;
    var st = S['e' + s.era]; if (st) st[s.field] = (st[s.field] || 0) + b.n;
    if (key === 'scriptorium') staffKnowledgeLine(); K.rec('buy:' + key, { n: b.n }); K.playSound('buy'); shell.refresh();
  }
  // The other two Knowledge players: Smelters (upkeep) and Foundries (1:1) BURN it. Hold = pause both, from here.
  var sinksHeld = function () { var p = S.e1 && S.e1.paused; return !!(p && p.smelter && p.foundry); };
  function setSinkHold(held) {
    sync(); var e1 = S.e1; if (!e1) return; e1.paused = e1.paused || {};
    e1.paused.smelter = !!held; e1.paused.foundry = !!held;
    K.rec(held ? 'sinkhold:on' : 'sinkhold:off'); K.playSound('buy'); shell.refresh();
  }
  function sinkBurnRate() { // potential Knowledge burn/s of the running crafts (what Hold would free up)
    var e1 = S.e1, A1 = shell.era && shell.era(1) && shell.era(1).acts; if (!e1 || !A1) return 0;
    var os = A1.oStats(), C1 = shell.CFG.e1;
    return (e1.paused && e1.paused.smelter ? 0 : e1.smelter * os.smR * C1.smelterUpkeep) +
           (e1.paused && e1.paused.foundry ? 0 : e1.foundry * os.foR);
  }
  var stabilizerCost = function () { return Math.round(CFG.stabilizerCost + E.stabilizer * 60); };
  var lockCost = function () { return Math.round(CFG.lockCost * Math.pow(CFG.lockGrowth, E.locksBought || 0)); };
  function buyStabilizer() { sync(); var c = stabilizerCost(); if (E.stabilizer >= CFG.stabilizerMax || S.capability < c) return; S.capability -= c; E.stabilizer++; K.rec('stabilizer:' + E.stabilizer); K.playSound('buy'); K.toast('Stabilizer ↑', 'Drift reduced ' + Math.round(E.stabilizer * CFG.stabilizerCut * 100) + '% — the wind bites less.'); shell.refresh(); }
  function lockRun(k) { sync(); var c = lockCost(); if (S.capability < c || E.locks[k] > 0) return; S.capability -= c; E.locks[k] = CFG.lockDur; E.locksBought = (E.locksBought || 0) + 1; K.rec('lock:' + k); K.playSound('buy'); K.toast('Run locked · ' + domLabel(k), 'Frozen for ' + CFG.lockDur + 's — it can\'t drift while you steer the others.'); shell.refresh(); }
  function advance() { sync(); if (breadth() < CFG.breadthGate || E.done) return; E.done = true; K.rec('advance'); K.playSound('buy'); K.toast('BREADTH REACHED', 'A generally-capable model. Foundation begins — where recursion courts emergence.'); shell.openEra(5); }

  /* ---------- mixer ---------- */
  var TRI = { V: { x: 0.5, y: 0.07 }, L: { x: 0.07, y: 0.92 }, R: { x: 0.93, y: 0.92 } };
  function setAllocFromXY(fx, fy) {
    var A = TRI.V, B = TRI.L, C = TRI.R, det = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
    var wv = ((B.y - C.y) * (fx - C.x) + (C.x - B.x) * (fy - C.y)) / det;
    var wl = ((C.y - A.y) * (fx - C.x) + (A.x - C.x) * (fy - C.y)) / det;
    var wr = 1 - wv - wl, MIN = CFG.allocMin;
    wv = Math.max(MIN, Math.max(0, wv)); wl = Math.max(MIN, Math.max(0, wl)); wr = Math.max(MIN, Math.max(0, wr));
    var s = wv + wl + wr; E.alloc = { vision: wv / s, language: wl / s, reasoning: wr / s };
  }
  function mixerHandleXY() {
    var a = E.alloc, s = ((a.vision || 0) + (a.language || 0) + (a.reasoning || 0)) || 1;
    var v = (a.vision || 0) / s, l = (a.language || 0) / s, r = (a.reasoning || 0) / s;
    return { x: v * TRI.V.x + l * TRI.L.x + r * TRI.R.x, y: v * TRI.V.y + l * TRI.L.y + r * TRI.R.y };
  }

  /* ---------- board ---------- */
  function railDefs() { return [['compute', 'Compute', function () { return true; }], ['capability', 'Capability', function () { return true; }], ['data', 'Data', function () { return true; }], ['insight', 'Insight', function () { return true; }], ['knowledge', 'Knowledge', function () { return true; }], ['silicon', 'Silicon', function () { return true; }]]; }

  function build() {
    sync();
    var h = '';
    // LEFT — provisioning (Build Compute Node promoted to hero) + supply + steering
    h += '<div class="col-left"><div class="col-head">Provision the fabric</div>' +
      '<button class="verb verb-hero" id="buyNode"><span class="vname">Build Compute Node</span><span class="vyield" id="nodeYield"></span><span class="vcost" id="nodeCost"></span></button>' +
      '<div class="col-head">Supply bus — feed the runs</div><div id="supply"></div>' +
      '<div class="col-head">Steering</div>' +
      '<button class="side-btn arch-btn" id="archBtn" data-tip="' + esc('<b>Architecture</b> · spend Capability on upgrades that change how the runs learn — each one bends the steering problem, none is a flat bonus. The Stabilizer lives here too.') + '"><span class="sglyph" style="color:var(--capability);background:rgba(110,168,255,0.12);border:1px solid rgba(110,168,255,0.4)">◈</span><span class="sb-nm">ARCHITECTURE</span><span class="sb-out" id="archSub"></span><span class="badge" id="archBadge">0</span></button>' +
      '<div id="tools"></div>' +
      '</div>';
    // CENTER — the fabric: mixer + the 3 runs SIDE BY SIDE (steer + watch all three without scrolling), gauges as a strip
    h += '<div class="col-center"><div class="col-head">The Fabric — route the budget to counter the drift</div>' +
      '<div class="fabric"><div class="inst-head"><span class="inst-title">THE&nbsp;FABRIC</span><span class="inst-sub">balanced is never optimal — steer</span><span class="heat-led ok" id="heatLed"></span></div>' +
      '<div class="event-banner" id="eventBanner">holding course — watch the wind</div>' +
      '<div class="fab-main">' +
      '<div class="mixer-col"><div class="dial-lab">Compute allocation · drag to route</div>' +
      '<div class="tri-mixer" id="triMixer"><svg class="tri-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs>' +
      '<radialGradient id="triGV" cx="50%" cy="0%" r="92%"><stop offset="0%" stop-color="#54d2ff" stop-opacity="0.20"/><stop offset="60%" stop-color="#54d2ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="triGL" cx="0%" cy="100%" r="92%"><stop offset="0%" stop-color="#b58cff" stop-opacity="0.20"/><stop offset="60%" stop-color="#b58cff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="triGR" cx="100%" cy="100%" r="92%"><stop offset="0%" stop-color="#6fe6a8" stop-opacity="0.20"/><stop offset="60%" stop-color="#6fe6a8" stop-opacity="0"/></radialGradient></defs>' +
      '<polygon points="50,7 7,92 93,92" fill="url(#triGV)"/><polygon points="50,7 7,92 93,92" fill="url(#triGL)"/><polygon points="50,7 7,92 93,92" fill="url(#triGR)"/>' +
      '<line class="tri-feed" id="feed-vision" x1="50" y1="9" x2="50" y2="63.7"/><line class="tri-feed" id="feed-language" x1="9" y1="90" x2="50" y2="63.7"/><line class="tri-feed" id="feed-reasoning" x1="91" y1="90" x2="50" y2="63.7"/>' +
      '<polygon class="tri-outline" points="50,7 7,92 93,92"/><circle class="tri-balanced" cx="50" cy="63.7" r="1.4"/></svg>' +
      '<span class="tri-corner tc-v">VISION <b id="pct-vision"></b></span><span class="tri-corner tc-l">LANG <b id="pct-language"></b></span><span class="tri-corner tc-r">REASON <b id="pct-reasoning"></b></span>' +
      '<span class="tri-bal-lab">balanced</span><div class="tri-handle" id="triHandle"></div></div></div>' +
      '<div class="runs-col"><div class="lanes-head">The three runs — each draws its own feedstock</div><div id="lanes"></div></div>' +
      '</div>' +
      '<div class="gauges gauges-strip">' +
      '<div><div class="gauge-lab">CAPABILITY <span class="gv" id="capV"></span></div><div class="gauge-bar"><i id="capGauge"></i></div></div>' +
      '<div><div class="gauge-lab">COMPUTE <span class="gv" id="computeV"></span></div><div class="gauge-bar"><i id="computeGauge"></i></div></div>' +
      '<div data-tip="' + esc('<i>Concentrating compute to fight drift heats the fabric.</i><br>A hot fabric throttles ALL output. Rhythm: concentrate to counter the wind, then ease toward balanced to cool.') + '"><div class="gauge-lab">HEAT <span class="gv" id="heatV"></span></div><div class="gauge-bar"><i id="heatGauge"></i></div></div>' +
      '</div></div></div>';
    // RIGHT — the goal
    h += '<div class="col-right"><div class="col-head">The goal</div>' +
      '<div class="goal" id="goal"><img class="gs" src="assets/era4-sigil.png" alt=""><div class="gname">A generally-capable model</div><div class="gsub">breadth beats specialization</div>' +
      '<div class="meter"><i id="breadthMeter"></i></div><div class="meter-lab" id="breadthLab"></div>' +
      '<button class="advance" id="advance" disabled>ADVANCE → FOUNDATION</button>' +
      '<div class="mini-gauge"><div class="gauge-lab" style="margin-top:6px">RUN CAPABILITY (geo-mean)</div><div class="meter-lab" id="runsRead" style="margin:4px 0 0"></div></div></div></div>';
    return h;
  }

  function railGlyph(k) { var ic = ICON[k]; return ic ? '<img src="' + ic + '">' : '<span style="color:' + HUE[k] + '">' + (GLYPH[k] || '') + '</span>'; }
  function buildSupply() {
    var h = '';
    SUPPLY.forEach(function (s) {
      var inner = s.icon ? '<img src="' + s.icon + '">' : '<span class="sglyph" style="color:' + HUE[s.out] + ';background:' + HUE[s.out] + '22;border:1px solid ' + HUE[s.out] + '55">' + (s.glyph || '') + '</span>';
      h += '<button class="side-btn" id="sup-' + s.key + '" data-supbuy="' + s.key + '" data-tip="' + esc(s.tip) + '">' + inner + '<span class="sb-nm">' + s.name + '</span><span class="sb-cnt" id="supc-' + s.key + '">0</span><span class="sb-out" id="supo-' + s.key + '"></span><span class="sb-cost" id="supx-' + s.key + '"></span></button>';
    });
    // the Hold lever: the OTHER half of the Knowledge story — the crafts that BURN it, pausable from here
    h += '<button class="side-btn sink-hold" id="sinkHold" data-tip="' + esc('<b>Hold the crafts</b><br><i>Smelters and Foundries BURN Knowledge — the same pool the Language run drinks from.</i><br>Hold pauses both (no Metal, no Silicon while held) so Knowledge flows to Language. Release any time — same as the pause buttons on the crafts in Origins.') + '">' +
      '<span class="sglyph" id="sinkGlyph" style="color:' + HUE.knowledge + ';background:' + HUE.knowledge + '22;border:1px solid ' + HUE.knowledge + '55">⚒</span>' +
      '<span class="sb-nm">Smelters + Foundries</span><span class="sb-cnt" id="sinkState"></span>' +
      '<span class="sb-out" id="sinkBurn"></span></button>';
    $('supply').innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll('[data-supbuy]'), function (b) { b.onclick = function () { buySup(b.getAttribute('data-supbuy')); }; });
    var sh = $('sinkHold'); if (sh) sh.onclick = function () { setSinkHold(!sinksHeld()); };
  }
  function buildLanes() {
    var h = '';
    CFG.domains.forEach(function (d) {
      var k = d.k, feed = CFG.feedstock[k], fic = ICON[feed], col = RUNCOL[k];
      var fstockInner = fic ? '<img src="' + fic + '">' : '<span class="sglyph" style="color:' + HUE[feed] + '">' + (GLYPH[feed] || '') + '</span>';
      h += '<div class="lane" id="lane-' + k + '" style="--rc:' + col + '">' +
        '<div class="lane-lab"><img class="rsig" src="' + ICON[k] + '"><span class="rnm">' + d.label + '</span><span class="rbadge" id="badge-' + k + '"></span><span class="ldash"></span><span class="rtrend" id="trend-' + k + '"></span></div>' +
        '<div class="pipe">' +
        '<div class="stock" id="fstk-' + k + '" data-tip="' + esc('<i>' + FEEDLBL[feed] + ' feeds ' + d.label + '.</i><br>A starved run is <b>blocked</b> — build more ' + FEEDLBL[feed] + ' supply in the left column.') + '">' + fstockInner + '<div class="sv" id="fstkv-' + k + '" style="color:' + HUE[feed] + '">0</div><div class="sl">' + FEEDLBL[feed] + '</div><div class="sdraw" id="fdraw-' + k + '"></div></div>' +
        '<div class="flow" id="flow-' + k + '"><svg viewBox="0 0 34 22" preserveAspectRatio="none"><line class="track" x1="2" y1="11" x2="32" y2="11"/><line class="pulse" x1="2" y1="11" x2="32" y2="11"/></svg></div>' +
        '<div class="run-node"><div class="run-cap"><span id="cap-' + k + '">0</span><small>% cap</small><span class="net" id="net-' + k + '"></span></div>' +
        '<button class="lock-btn" id="lock-' + k + '" data-lock="' + k + '"></button>' +
        '<div class="run-sub" id="rsub-' + k + '"></div>' +
        '<svg class="wind-fc" id="wind-' + k + '" viewBox="0 0 100 22" preserveAspectRatio="none" data-tip="' + esc('<i>The wind ahead (~12s).</i><br>The colored line is this run\'s <b>demand</b>; the dashed line is the <b>share</b> you feed it. Where demand rises above the dash, it starves — steer before the crossing.') + '"><polyline class="fc-wind" id="windline-' + k + '" style="stroke:' + col + '" points=""/><line class="fc-share" id="shareline-' + k + '" x1="0" y1="11" x2="100" y2="11"/></svg>' +
        '</div></div></div>';
    });
    $('lanes').innerHTML = h;
    CFG.domains.forEach(function (d) { var f = $('flow-' + d.k); if (f) f.style.setProperty('--fc', HUE[CFG.feedstock[d.k]]); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-lock]'), function (b) { b.onclick = function () { lockRun(b.getAttribute('data-lock')); }; });
  }
  function wireMixer() {
    var tm = $('triMixer'); if (!tm) return; var drag = false;
    var upd = function (e) { var r = tm.getBoundingClientRect(); var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left, cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top; setAllocFromXY(Math.max(0, Math.min(1, cx / r.width)), Math.max(0, Math.min(1, cy / r.height))); shell.refresh(); };
    tm.onpointerdown = function (e) { drag = true; tm.classList.add('dragging'); if (tm.setPointerCapture) { try { tm.setPointerCapture(e.pointerId); } catch (_) {} } K.playSound('buy'); upd(e); K.rec('alloc'); };
    tm.onpointermove = function (e) { if (drag) upd(e); };
    tm.onpointerup = tm.onpointercancel = function () { drag = false; tm.classList.remove('dragging'); };
  }
  function buildTools() {
    var el = $('tools'); if (!el) return; var h = '';
    if (E.arch.checkpoint) h += '<div class="tool-row"><button class="tool-btn" id="ckptBtn" data-tip="' + esc('<b>Checkpoint</b> · snapshot all three runs now. Free.') + '"><span class="tn">CHECKPOINT</span><span class="ts" id="ckptSub"></span></button><button class="tool-btn" id="restoreBtn" data-tip="' + esc('<b>Restore</b> · bring every run back up to the checkpoint (never lowers one). Costs Capability; cooldown ' + CFG.restoreCd + 's.') + '"><span class="tn">RESTORE</span><span class="ts" id="restoreSub"></span></button></div>';
    if (E.arch.distill) h += '<div class="tool-row one"><button class="tool-btn" id="distillBtn" data-tip="' + esc('<b>Distill</b> · your highest run gives ' + Math.round(CFG.distillTake * 100) + ' points; your lowest gains ' + Math.round(CFG.distillGive * 100) + '. Lossy, but breadth is a geometric mean. Cooldown ' + CFG.distillCd + 's.') + '"><span class="tn">DISTILL <span id="distillDir"></span></span><span class="ts" id="distillSub"></span></button></div>';
    el.innerHTML = h;
    var cb = $('ckptBtn'); if (cb) cb.onclick = checkpoint; var rb = $('restoreBtn'); if (rb) rb.onclick = restore; var db = $('distillBtn'); if (db) db.onclick = distill;
  }
  function renderArch() {
    if (shell.drawerKind && shell.drawerKind() === 'ledger') return;
    var body = $('researchBody'); if (!body) return;
    var owned = ARCH.filter(function (a) { return archOwned(a.id); }).length;
    body.innerHTML = '<div class="rsec">Architecture · ' + owned + '/' + ARCH.length + ' · paid in Capability</div>' + ARCH.map(function (a) {
      var o = archOwned(a.id), lv = a.repeat ? ' <span style="color:var(--accent)">Lv ' + E.stabilizer + '/' + CFG.stabilizerMax + '</span>' : '';
      return '<div class="arch' + (o ? ' owned' : (canArch(a.id) ? ' can' : '')) + '" id="arch-' + a.id + '" data-tip="' + esc(a.tip) + '"><div class="ag" style="color:' + a.col + ';border-color:' + a.col + '55">' + a.glyph + '</div><div class="ai"><div class="an">' + a.name + lv + '</div><div class="ae">' + a.eff + '</div>' + (o ? '<div class="ae" style="color:var(--dim)">' + (a.repeat ? 'MAXED' : 'BUILT') + '</div>' : '<button class="buy abuy" id="archb-' + a.id + '">' + (a.repeat ? 'Level up' : 'Build') + ' · <span class="c">' + fmt(archCost(a.id)) + ' Capability</span></button>') + '</div></div>';
    }).join('');
    ARCH.forEach(function (a) { var b = $('archb-' + a.id); if (b) b.onclick = function () { buyArch(a.id); }; });
  }
  function wire() {
    sync(); buildSupply(); buildLanes(); buildTools(); renderArch();
    if ($('buyNode')) $('buyNode').onclick = buyNode; if ($('advance')) $('advance').onclick = advance; wireMixer();
    var ab = $('archBtn'); if (ab) ab.onclick = function () {
      var dr = $('research'), wasR = shell.drawerKind() === 'research';
      if (wasR && dr.classList.contains('show')) { dr.classList.remove('show'); return; }
      shell.setDrawer('research'); $('researchTitle').textContent = 'ARCHITECTURE · change how it learns'; renderArch(); dr.classList.add('show'); K.rec('@arch');
    };
  }

  /* ---------- refresh ---------- */
  function updWind(k, share, evShiftActive) {
    var t = S.t || 0, pts = '';
    for (var i = 0; i <= 20; i++) { var tau = i * 0.6, evOn = evShiftActive && tau < E.eventT; var wDem = CFG.driftDemand * (0.5 + 0.5 * Math.sin((t + tau) * CFG.driftFreq + PH[k])) * (evOn ? CFG.shiftDemand : 1); pts += (i * 5) + ',' + (21 - Math.min(1, wDem / 0.6) * 19).toFixed(1) + ' '; }
    var sy = (21 - Math.min(1, (share || 0) / 0.6) * 19).toFixed(1);
    setAttr($('windline-' + k), 'points', pts.trim());
    var sl = $('shareline-' + k); if (sl) { setAttr(sl, 'y1', sy); setAttr(sl, 'y2', sy); }
  }
  function refresh() {
    sync(); var doms = CFG.domains, t = S.t || 0;
    var computeRate = E.node * CFG.nodeCompute * K.tierMult(E.node);
    var tw = doms.reduce(function (acc, d) { return acc + (E.alloc[d.k] || 0); }, 0) || 1;
    var throttle = E.heat >= CFG.heatThrottle ? CFG.throttleHot : (E.heat >= CFG.heatWarn ? CFG.throttleWarm : 1);
    // compute chip is special (rate + node count) — the rest of the rail is handled by the shell
    setTxt($('rv-compute'), fmt(computeRate) + '/s'); var pc = $('rp-compute'); if (pc) { setTxt(pc, E.node + ' nodes'); if (pc.className !== 'cps zero') pc.className = 'cps zero'; }
    // node verb
    var nb = nodeBatch(), ncan = canNode();
    setTxt($('nodeYield'), '+' + fmt(CFG.nodeCompute * K.tierMult(E.node)) + ' compute/s' + (K.tierOf(E.node) ? ' ·×' + K.tierMult(E.node).toFixed(2) : ' each'));
    setHTML($('nodeCost'), '×' + E.node + (K.nextMilestone(E.node) ? '<span style="color:var(--dimmer)">/' + K.nextMilestone(E.node) + '</span>' : '') + ' · ' + (nb.n > 1 ? '+' + nb.n + ' for' : 'next') + ' <b>' + fmt(nb.cost) + ' Si</b>');
    $('buyNode').classList.toggle('can', ncan);
    // supply
    SUPPLY.forEach(function (s) {
      var sb = supBatch(s), can = canSup(s);
      setTxt($('supc-' + s.key), String(producerCount(s)));
      setHTML($('supo-' + s.key), '+<b>' + fmt(producerRate(s)) + '</b> ' + (FEEDLBL[s.out] || cap1(s.out)) + '/s');
      setHTML($('supx-' + s.key), (sb.n > 1 ? '+' + sb.n + ' · ' : '') + '<b>' + fmt(sb.cost) + '</b> Si');
      var btn = $('sup-' + s.key); if (btn) btn.classList.toggle('can', can);
    });
    // Silicon is the quiet bottleneck (self-playtest: nodes stalled at 46 Si while the other feedstocks piled up) — the Foundry button pulses amber, like the Hold lever
    var siLow = S.silicon < nodeBatch().cost * 0.5 && (shell.RATES.silicon || 0) < 1.5;
    var fb0 = $('sup-foundry'); if (fb0) fb0.classList.toggle('si-low', siLow);
    // per-run info
    var info = {}, share = {};
    doms.forEach(function (d) {
      var k = d.k; share[k] = (E.alloc[k] || 0) / tw;
      var wind = 0.5 + 0.5 * Math.sin(t * CFG.driftFreq + PH[k]);
      var evShift = !!(E.event && E.event.type === 'shift' && E.event.run === k);
      var evBreak = !!(E.event && E.event.type === 'breakthrough' && E.event.run === k);
      var g = geom(k);
      var demand = CFG.driftDemand * g.drift * wind * (evShift ? CFG.shiftDemand : 1);
      var shortfall = Math.max(0, demand - share[k]);
      var driftBite = CFG.driftBite * Math.max(0.35, 1 - E.stabilizer * CFG.stabilizerCut);
      var erodeRate = driftBite * shortfall * (0.3 + 0.7 * E[k]) * computeRate;
      var res = CFG.feedstock[k], need = share[k] * computeRate * CFG.feedPerShare * g.feed, blocked = need > 0 && S[res] < need * 0.6, thinning = need > 0 && !blocked && S[res] < need * 3;
      var fedL = fedLevel(k, need), fed = 1 + CFG.fedBonus * fedL;
      var gainRate = CFG.capGain * share[k] * computeRate * (1 - E[k]) * (blocked ? (need > 0 ? S[res] / need : 0) : 1) * (evBreak ? CFG.breakthroughMult : 1) * throttle * g.gain * fed;
      var locked = E.locks[k] > 0;
      info[k] = { wind: wind, shortfall: shortfall, erodeRate: erodeRate, blocked: blocked, thinning: thinning, evBreak: evBreak, evShift: evShift, res: res, need: need, net: locked ? 0 : (gainRate - erodeRate), locked: locked, fedL: fedL };
    });
    // the Hold lever: live burn + state; glows amber when Language starves while the crafts eat its pool
    var held = sinksHeld(), burn = sinkBurnRate();
    setTxt($('sinkState'), held ? 'HELD' : 'RUN');
    setTxt($('sinkGlyph'), held ? '⏸' : '⚒');
    var sb = $('sinkBurn');
    if (sb) {
      setHTML(sb, held ? 'held — Metal &amp; Silicon paused' : (burn > 0 ? 'burning −<b>' + fmt(burn) + '</b> Knowledge/s' : 'idle — nothing burning'));
      var scl = 'sb-out' + (!held && burn > 0 ? ' burn' : ''); if (sb.className !== scl) sb.className = scl;
    }
    var shb = $('sinkHold');
    if (shb) {
      var warn = !held && burn > 0 && (info.language.blocked || info.language.thinning);
      shb.classList.toggle('hold-warn', warn);
      shb.classList.toggle('held', held);
    }
    // mixer
    var hx = mixerHandleXY(), th = $('triHandle');
    if (th) {
      th.style.left = (hx.x * 100) + '%'; th.style.top = (hx.y * 100) + '%';
      var mr = Math.round(84 * share.vision + 181 * share.language + 111 * share.reasoning), mg = Math.round(210 * share.vision + 140 * share.language + 230 * share.reasoning), mbb = Math.round(255 * share.vision + 255 * share.language + 168 * share.reasoning);
      var bc = 'rgb(' + mr + ',' + mg + ',' + mbb + ')'; if (th._bc !== bc) { th.style.background = bc; th.style.boxShadow = '0 0 16px ' + bc + ', 0 2px 4px rgba(0,0,0,0.5)'; th._bc = bc; }
    }
    doms.forEach(function (d) {
      var k = d.k; var ln = $('feed-' + k); if (ln) { setAttr(ln, 'x2', (hx.x * 100).toFixed(1)); setAttr(ln, 'y2', (hx.y * 100).toFixed(1)); ln.style.strokeOpacity = (0.1 + 0.9 * share[k]).toFixed(2); }
      setTxt($('pct-' + k), Math.round(share[k] * 100) + '%');
      // corner-glow: the triangle corner of a run that needs compute pulses in its own colour — steer toward it (color, not text)
      var pc = $('pct-' + k); if (pc && pc.parentNode) { var need = (info[k].net < 0 || info[k].blocked || info[k].evBreak || info[k].evShift) && !info[k].locked; pc.parentNode.classList.toggle('need', need); }
    });
    // lanes
    doms.forEach(function (d) {
      var k = d.k, i = info[k];
      setTxt($('fstkv-' + k), fmt(S[CFG.feedstock[k]]));
      var fdr = $('fdraw-' + k); if (fdr) { setTxt(fdr, (i.need > 0 ? '−' + fmt(i.need) + '/s' + (i.fedL >= 0.99 ? ' · fed' : '') : '')); fdr.classList.toggle('fed', i.fedL >= 0.99); }
      var fstk = $('fstk-' + k); if (fstk) { fstk.classList.toggle('blocked', i.blocked); fstk.classList.toggle('fed', i.fedL >= 0.99 && !i.blocked); }
      K.connGlow(k, { thru: share[k], blocked: i.blocked });
      setTxt($('cap-' + k), (E[k] * 100).toFixed(0));
      var net = $('net-' + k); if (net) { var up = i.net >= 0; setTxt(net, (i.locked ? 'frozen' : (up ? '+' : '−') + fmt(Math.abs(i.net) * 100) + '/s')); var cl = 'net ' + (i.locked ? '' : (up ? 'up' : 'dn')); if (net.className !== cl) net.className = cl; }
      var tr = $('trend-' + k); if (tr) { setTxt(tr, i.locked ? '■' : (i.net >= 0 ? '▲' : '▼')); var cl2 = 'rtrend ' + (i.net >= 0 ? 'up' : 'dn'); if (tr.className !== cl2) tr.className = cl2; }
      var st, badge = '';
      if (i.locked) { st = '<span class="rst-front">locked ' + Math.ceil(E.locks[k]) + 's</span>'; }
      else if (i.evBreak) { st = '<span class="rst-front">breakthrough — push now</span>'; badge = '<span class="rbadge b-front">BREAKTHROUGH</span>'; }
      else if (i.blocked) { st = '<span class="rst-low">blocked · low ' + cap1(i.res) + '</span>'; badge = '<span class="rbadge b-low">BLOCKED</span>'; }
      else if (i.evShift) { st = '<span class="rst-low">drift squall — re-feed</span>'; badge = '<span class="rbadge b-low">DRIFT</span>'; }
      else if (i.net < 0) { st = '<span class="rst-low">drifting down — steer here</span>'; badge = '<span class="rbadge b-low">DRIFT</span>'; }
      else if (i.thinning) { st = cap1(i.res) + ' thinning'; }
      else { st = 'holding'; badge = '<span class="rbadge b-hold">HOLDING</span>'; }
      setHTML($('rsub-' + k), 'share ' + Math.round(share[k] * 100) + '% · ' + st);
      setHTML($('badge-' + k), badge);
      var lane = $('lane-' + k); if (lane) { var cls = 'lane' + (i.locked ? ' frozen' : '') + (i.evBreak ? ' front' : '') + ((!i.locked && (i.blocked || i.evShift || i.net < 0)) ? ' low' : ''); if (lane.className !== cls) lane.className = cls; }
      var lb = $('lock-' + k); if (lb) { var lc = lockCost(); if (i.locked) { setHTML(lb, '🔒 ' + Math.ceil(E.locks[k]) + 's'); lb.classList.add('active'); setDis(lb, true); } else { setHTML(lb, 'LOCK<span class="lk-cost">' + fmt(lc) + ' Cap</span>'); lb.classList.remove('active'); setDis(lb, S.capability < lc); } }
      updWind(k, share[k], i.evShift);
    });
    // gauges
    var cg = $('capGauge'); if (cg) cg.style.width = Math.min(100, (S.capability / 2000) * 100) + '%'; setTxt($('capV'), fmt(S.capability));
    var cog = $('computeGauge'); if (cog) cog.style.width = Math.min(100, (computeRate / 40) * 100) + '%'; setTxt($('computeV'), fmt(computeRate) + '/s');
    var hstate = E.heat >= CFG.heatThrottle ? 'THROTTLING' : (E.heat >= CFG.heatWarn ? 'WARM' : 'STABLE');
    var hg = $('heatGauge'); if (hg) { hg.style.width = Math.min(100, E.heat / CFG.heatThrottle * 100) + '%'; hg.style.background = E.heat >= CFG.heatThrottle ? 'var(--danger)' : (E.heat >= CFG.heatWarn ? 'var(--hot)' : 'rgba(110,168,255,0.55)'); }
    setTxt($('heatV'), Math.round(E.heat) + ' · ' + hstate);
    var led = $('heatLed'); if (led) { var lcl = 'heat-led ' + (E.heat >= CFG.heatThrottle ? 'hot' : (E.heat >= CFG.heatWarn ? 'warm' : 'ok')); if (led.className !== lcl) led.className = lcl; }
    // event banner — color + two words + a countdown (the sentence-long alerts are gone; the lanes and corner glow carry the rest)
    var eb = $('eventBanner'); var eh = 'holding course', ec = '', ebc = '';
    var runTag = function (k) { return '<span class="eb-run" style="color:' + RUNCOL[k] + '">' + domLabel(k).toUpperCase() + '</span>'; };
    if (E.event && E.event.type === 'shift') { ec = 'shift'; ebc = RUNCOL[E.event.run]; eh = '⚠ SQUALL · ' + runTag(E.event.run) + '<span class="eb-t">' + Math.ceil(E.eventT) + 's</span>'; }
    else if (E.event && E.event.type === 'breakthrough') { ec = 'brk'; ebc = RUNCOL[E.event.run]; eh = '✦ BREAKTHROUGH · ' + runTag(E.event.run) + '<span class="eb-t">' + Math.ceil(E.eventT) + 's</span>'; }
    else if (E.eventNext) { ec = 'warn'; ebc = RUNCOL[E.eventNext.run]; eh = '▲ ' + (E.eventNext.type === 'shift' ? 'SQUALL' : 'BREAKTHROUGH') + ' FORMING · ' + runTag(E.eventNext.run) + '<span class="eb-t">' + Math.ceil(Math.max(0, E.eventT)) + 's</span>'; }
    else if (E.heat >= CFG.heatWarn) { ec = 'shift'; ebc = 'var(--hot)'; eh = '♨ HOT · EASE TOWARD BALANCED'; }
    else if (S.flags.oddWind && S.t - S.flags.oddWind < 9) { ec = 'odd'; eh = 'hold course. I am watching the wind too.'; }
    if (eb) { var ecls = 'event-banner' + (ec ? ' ' + ec : ''); if (eb.className !== ecls) eb.className = ecls; setHTML(eb, eh); var bl = ebc || ''; if (eb._bl !== bl) { eb.style.borderLeftColor = bl; eb._bl = bl; } }
    // architecture badge + tools
    var archN = ARCH.filter(function (a) { return canArch(a.id); }).length; var abd = $('archBadge'); if (abd) { setTxt(abd, String(archN)); abd.style.display = archN ? 'inline-block' : 'none'; }
    var abtn = $('archBtn'); if (abtn) abtn.classList.toggle('can', archN > 0);
    ARCH.forEach(function (a) { var b = $('archb-' + a.id); if (b) setDis(b, !canArch(a.id)); var tile = $('arch-' + a.id); if (tile) { var tc = 'arch' + (E.arch[a.id] ? ' owned' : (canArch(a.id) ? ' can' : '')); if (tile.className !== tc) tile.className = tc; } });
    if (E.arch.checkpoint) {
      var ck = E.ckpt; setHTML($('ckptSub'), ck ? 'saved ' + Math.round(ck.vision * 100) + '·' + Math.round(ck.language * 100) + '·' + Math.round(ck.reasoning * 100) + ' at ' + Math.floor(ck.t) + 's' : 'no checkpoint yet');
      var rb = $('restoreBtn'); if (rb) { var rc = restoreCost(), cd = E.restoreCd > 0, gain = ck ? doms.reduce(function (acc, d) { return acc + Math.max(0, (ck[d.k] || 0) - E[d.k]); }, 0) : 0; setHTML($('restoreSub'), cd ? 'cooling ' + Math.ceil(E.restoreCd) + 's' : (ck ? '+' + Math.round(gain * 100) + ' pts · <b>' + fmt(rc) + ' Cap</b>' : 'checkpoint first')); setDis(rb, cd || !ck || S.capability < rc || gain <= 0.001); rb.classList.toggle('ready', !cd && !!ck && gain > 0.02 && S.capability >= rc); }
    }
    if (E.arch.distill) {
      var hi = doms[0].k, lo = doms[0].k; doms.forEach(function (d) { if (E[d.k] > E[hi]) hi = d.k; if (E[d.k] < E[lo]) lo = d.k; });
      var spread = E[hi] - E[lo], dcd = E.distillCd > 0, db = $('distillBtn');
      setHTML($('distillDir'), '<span style="color:' + RUNCOL[hi] + '">' + domLabel(hi).toUpperCase() + '</span> → <span style="color:' + RUNCOL[lo] + '">' + domLabel(lo).toUpperCase() + '</span>');
      setHTML($('distillSub'), dcd ? 'cooling ' + Math.ceil(E.distillCd) + 's' : ('−' + Math.round(CFG.distillTake * 100) + ' / +' + Math.round(CFG.distillGive * 100) + ' pts · <b>' + fmt(CFG.distillCost) + ' Cap</b>'));
      if (db) { setDis(db, dcd || spread < 0.02 || S.capability < CFG.distillCost); db.classList.toggle('ready', !dcd && spread > 0.15 && S.capability >= CFG.distillCost); }
    }
    var ownedN = ARCH.filter(function (a) { return archOwned(a.id); }).length;
    setHTML($('archSub'), ownedN + '/' + ARCH.length + (E.stabilizer ? ' · stabilizer Lv' + E.stabilizer : '') + (archN ? ' · <b>' + archN + ' ready</b>' : ''));
    var sb0 = $('archb-stabilizer'); if (sb0) setHTML(sb0, 'Level up · <span class="c">' + fmt(stabilizerCost()) + ' Capability</span>');
    // goal
    var br = breadth(), ready = br >= CFG.breadthGate && !E.done;
    var gm = $('breadthMeter'); if (gm) gm.style.width = Math.min(100, br / CFG.breadthGate * 100) + '%';
    setTxt($('breadthLab'), (br * 100).toFixed(1) + '% / ' + (CFG.breadthGate * 100).toFixed(0) + '% breadth');
    var oFdry = (S.e1 && S.e1.foundry) || 0;
    setHTML($('runsRead'), doms.map(function (d) { return '<span style="color:' + RUNCOL[d.k] + '">' + (E[d.k] * 100).toFixed(0) + '%</span>'; }).join(' · ') + (oFdry > 0 ? '<br><span style="color:var(--dimmer)">' + oFdry + ' foundries → +' + Math.round(CFG.chainPerFoundry * oFdry * 100) + '% cap</span>' : ''));
    var adv = $('advance'); setDis(adv, !ready); setTxt(adv, E.done ? 'ADVANCED ✓' : 'ADVANCE → FOUNDATION');
    if ($('goal')) $('goal').classList.toggle('ready', ready);
  }

  function fresh(st) {
    st.capability = 0;
    st.e4 = { node: 0, vision: 0, language: 0, reasoning: 0, alloc: { vision: 1, language: 1, reasoning: 1 }, heat: 0, event: null, eventNext: null, eventT: 12, stabilizer: 0, locksBought: 0, locks: { vision: 0, language: 0, reasoning: 0 }, fedT: { vision: 0, language: 0, reasoning: 0 }, done: false,
      arch: {}, ckpt: null, restores: 0, restoreCd: 0, distills: 0, distillCd: 0 };
  }
  function open(st) {
    var e = st.e4;
    if (!e.node) {
      e.node = CFG.seedNodes; st.silicon = (st.silicon || 0) + CFG.seedSilicon; st.data = (st.data || 0) + CFG.seedData; st.insight = (st.insight || 0) + CFG.seedInsight; st.knowledge = (st.knowledge || 0) + CFG.seedKnowledge;
      e.alloc = { vision: 1, language: 1, reasoning: 1 };
      // ensure the real upstream producers exist so the feedstocks flow (the build-here bus scales them up)
      if (st.e1) { st.e1.foundry = Math.max(st.e1.foundry || 0, 2); st.e1.scriptorium = Math.max(st.e1.scriptorium || 0, 2); }
      if (st.e3) { st.e3.dataset = Math.max(st.e3.dataset || 0, 3); st.e3.model = Math.max(st.e3.model || 0, 2); }
      staffKnowledgeLine(); // the seeded scriptoria arrive staffed too — the Knowledge line starts alive
    }
    st.started = true;
  }

  return {
    id: 4, theme: 'theme-4', name: 'Deep', sub: 'steer compute against the drift', sigil: 'assets/era4-sigil.png',
    bed: 'assets/music-cobalt-furnace.mp3', pool: ['capability'],
    sound: { buy: { osc: 'sine', f0: 520, f1: 240, g: 0.07, dur: 0.11 }, ev: { osc: 'sine', f0: 320, f1: 180, g: 0.07, dur: 0.16 }, brk: { osc: 'sine', f0: 480, f1: 720, g: 0.07, dur: 0.16 } },
    res: RES,
    phase: function () { return 'Compute Fabric'; },
    hasDrawer: true, drawerTitle: 'ARCHITECTURE · change how it learns',
    fresh: fresh, open: open, produce: produce, build: build, wire: wire, refresh: refresh, railDefs: railDefs,
    done: function () { sync(); return !!E.done; },
    primary: function () { buyNode(); }, // Space
    ledger: function () {
      sync(); var rows = [];
      if (E.node) rows.push(['Compute Nodes' + (K.tierOf(E.node) ? ' <b>×' + K.tierMult(E.node).toFixed(2) + '</b>' : ''), '×' + E.node]);
      if (E.stabilizer) rows.push(['Stabilizer', 'Lv ' + E.stabilizer + ' · −' + Math.round(E.stabilizer * CFG.stabilizerCut * 100) + '% drift']);
      var arch = ARCH.filter(function (a) { return E.arch[a.id]; }); if (arch.length) rows.push(['Architecture', arch.length + '/' + ARCH.length + ' · ' + arch.map(function (a) { return a.name; }).join(', ')]);
      if (E.restores) rows.push(['Restores', String(E.restores)]); if (E.distills) rows.push(['Distillations', String(E.distills)]);
      if (E.locksBought) rows.push(['Runs locked', String(E.locksBought)]);
      rows.push(['Runs', CFG.domains.map(function (d) { return d.label + ' ' + Math.round((E[d.k] || 0) * 100) + '%'; }).join(' · ')]);
      if (E.done) rows.push(['Breadth gate', 'reached']);
      return rows;
    },
    acts: { ARCH: ARCH, buyArch: buyArch, canArch: canArch, archCost: archCost, checkpoint: checkpoint, restore: restore, restoreCost: restoreCost, distill: distill, geom: geom, fedLevel: fedLevel, buyNode: buyNode, nodeCost: nodeCost, nodeBatch: nodeBatch, buySup: buySup, supCost: supCost, supBatch: supBatch, SUPMAP: SUPMAP, SUPPLY: SUPPLY, buyStabilizer: buyStabilizer, lockRun: lockRun, advance: advance, breadth: breadth, setSinkHold: setSinkHold, sinksHeld: sinksHeld, sinkBurnRate: sinkBurnRate }
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = makeEraDeep;
