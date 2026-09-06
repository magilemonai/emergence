/* ============================================================================
   ERA MODULE — Statistical (era 3). Ported from emergence-v3-statistical.html onto
   the shared shell + KIT. Re-homed: silicon is the shared Origins resource; data/
   insight are introduced into the pool; Statistical mechanic state lives on S.e3.
   NOTE: the Foundry-costs-Data → emits-Silicon economy STAND-IN is kept verbatim
   here (faithful port); it is reverted to the real Origins bus in task #3 (KIT.md).
   Factory: makeEraStatistical(shell).
   ============================================================================ */
function makeEraStatistical(shell) {
  var K = shell.KIT, $ = K.$, fmt = K.fmt, esc = K.esc, setTxt = K.setTxt, setHTML = K.setHTML, setDis = K.setDis, setText = K.setText;
  var S = shell.S, CFG = shell.CFG.e3;

  var RES = { // silicon comes from Origins RES; Statistical introduces data + insight
    data: { hue: '#54d2ff', glyph: '◈', flavor: 'Experience, stored for the machine to study.' },
    insight: { hue: '#6fe6a8', glyph: '◆', flavor: 'The pattern beneath the noise.' }
  };
  var HUE = { silicon: '#a9d8ce', data: '#54d2ff', insight: '#6fe6a8' };
  var ICON = { dataset: 'assets/e3-dataset.png', model: 'assets/e3-model.png' };
  var METHOD_ICON = { regression: 'assets/e3-regression.png', features: 'assets/e3-features.png', regularization: 'assets/e3-regularization.png', clustering: 'assets/e3-clustering.png', bayesian: 'assets/e3-bayesian.png', ensembles: 'assets/e3-ensembles.png' };

  var METHODS = [
    { id: 'regression', name: 'Regression', flavor: 'A line drawn through the noise.', desc: 'Experiments raise accuracy 40% faster.' },
    { id: 'features', name: 'Feature Engineering', flavor: 'Asking the data better questions.', desc: 'Datasets yield 50% more Data.' },
    { id: 'regularization', name: 'Regularization', flavor: 'Prefer the simpler explanation.', desc: 'Cuts the overfitting gap 2× faster — and lifts the validation ceiling.' },
    { id: 'clustering', name: 'Clustering', flavor: 'Like finds like.', desc: 'The survey fills 60% faster.' },
    { id: 'bayesian', name: 'Bayesian Inference', flavor: 'Belief, updated by evidence.', desc: 'Each experiment yields 80% more Insight.' },
    { id: 'ensembles', name: 'Ensembles', flavor: 'A crowd of guesses, wiser than any one.', desc: '+12% effective accuracy (many weak models, one strong vote).' }
  ];
  var UTILS = {
    calibrate: { name: 'Holdout Study', flavor: 'Set some truth aside, and check against it.', desc: 'Cuts the current overfit gap by 30%.' },
    sweep: { name: 'Parameter Sweep', flavor: 'Try every dial, keep the best.', desc: 'A one-time push of raw accuracy.' },
    distill: { name: 'Ablation Study', flavor: 'Remove a piece; see what mattered.', desc: 'A grant of Insight, scaled by your Methods.' }
  };

  var E; function sync() { E = S.e3; }

  /* ---------- derived ---------- */
  function e3Stats() {
    var m = E.methods, accGain = CFG.accGain, dataMult = 1, insMult = 1, discMult = 1, regMult = 1, effBonus = 0;
    if (m.regression) accGain *= 1.4;
    if (m.features) dataMult *= 1.5;
    if (m.bayesian) insMult *= 1.8;
    if (m.clustering) discMult *= 1.6;
    if (m.regularization) regMult = 2;
    if (m.ensembles) effBonus += 0.12;
    var cap = m.regularization ? 1 : 0.80;
    dataMult *= K.tierMult(E.dataset); // v4 milestones: ×10/×25/×50/×100 Datasets → +25% Data per tier
    var expPerModel = CFG.expPerModel * K.tierMult(E.model); // … and Fit Engines → +25% trials per tier
    return { accGain: accGain, dataMult: dataMult, insMult: insMult, discMult: discMult, regMult: regMult, effBonus: effBonus, cap: cap, expPerModel: expPerModel };
  }
  // AUTOPILOT: a learned policy — what a good player does. It is the first decision the machine takes from you.
  function policy() { sync(); if (E.gap > 0.15) return 'generalize'; var m = nextMethod(); if (m && (E.survey || 0) < 70 && S.data < expCost('method')) return 'explore'; return 'fit'; }
  function focusKey() { return E.focus === 'auto' ? policy() : E.focus; }
  function curFocus() { return CFG.focus[focusKey()] || CFG.focus.fit; }
  // PREDICTION: after enough trials the model guesses your next Focus from your own habits (falls back to the policy).
  function predictNext() {
    var h = E.focHist || [], cur = E.focus, counts = {};
    for (var i = 0; i < h.length - 1; i++) if (h[i] === cur && h[i + 1] !== 'auto') counts[h[i + 1]] = (counts[h[i + 1]] || 0) + 1;
    var best = null; for (var k in counts) if (!best || counts[k] > counts[best]) best = k;
    return best || policy();
  }
  var predicting = function () { return (E.trials || 0) >= CFG.predAfter && !E.done; };
  function setFocus(k) {
    sync(); if (E.focus === k) return;
    var deliberate = (S.t - (E.focAt || -99)) >= (CFG.predDwell || 0); // a change that stands for a few seconds is a decision; a twitch is not
    if (predicting() && E.pred && k !== 'auto' && deliberate) { E.predN = (E.predN || 0) + 1; if (E.pred === k) { E.predHits = (E.predHits || 0) + 1; E.predStreak = (E.predStreak || 0) + 1; } else E.predStreak = 0; }
    if (deliberate) E.focHist = (E.focHist || []).concat([k]).slice(-16);
    E.focus = k; E.focAt = S.t;
    if (k === 'auto') { S.flags.autopilotUsed = true; K.rec('focus:auto'); }
    E.pred = predictNext();
    if (!E.flags.autopilot && predicting() && ((E.predStreak || 0) >= CFG.predStreak || ((E.predN || 0) >= CFG.predMinN && (E.predHits || 0) / E.predN >= CFG.predRatio))) {
      E.flags.autopilot = true; S.flags.autopilot = true; K.rec('autopilot:unlock');
      K.toast('IT HAS LEARNED YOU', 'It called ' + (E.predHits || 0) + ' of your last ' + (E.predN || 0) + ' Focus changes. A fourth Focus appears: <b>let it choose</b>.', 'event');
      K.playSound('event'); shell.requestRender(); return;
    }
    K.playSound('buy'); shell.refresh();
  }
  // VALIDATION (effective accuracy) can never exceed TRAINING (raw accuracy) — methods shrink the gap toward it, not past it.
  function effAccuracy() { var st = e3Stats(); return Math.max(0, Math.min(st.cap, E.accuracy, E.accuracy + st.effBonus - E.gap)); }

  function runExperiment(amount) {
    sync(); var st = e3Stats(), f = curFocus();
    amount = Math.min(amount, S.data / CFG.expDataCost); if (amount <= 0) return;
    E.trials = (E.trials || 0) + amount;
    var dataSpent = amount * CFG.expDataCost;
    S.data -= dataSpent; K.fOut('data', dataSpent);
    E.accuracy = Math.min(1, E.accuracy + st.accGain * f.acc * (1 - E.accuracy) * amount);
    E.gap = Math.max(0, Math.min(CFG.gapMax, E.gap + (CFG.gapGrow * f.gap - CFG.gapReduce * f.red * st.regMult) * amount));
    var ins = CFG.insightPerExp * f.ins * effAccuracy() * st.insMult * amount;
    S.insight += ins; K.fIn('insight', ins);
    E.survey = Math.min(100, (E.survey || 0) + CFG.surveyPerExp * f.disc * st.discMult * amount);
  }

  /* ---------- experiment board ---------- */
  function nextMethod() { return METHODS.filter(function (mm) { return !E.methods[mm.id]; })[0] || null; }
  function surveyDisc() { return 1 - CFG.surveyDiscount * (E.survey || 0) / 100; }
  function expCost(kind) {
    if (kind === 'method') { var i = -1; for (var j = 0; j < METHODS.length; j++) { if (!E.methods[METHODS[j].id]) { i = j; break; } } return i < 0 ? Infinity : Math.ceil(CFG.cardMethodCosts[i] * surveyDisc()); }
    var u = CFG.cardUtil[kind]; if (!u) return Infinity;
    return Math.ceil(u.cost * Math.pow(u.growth, (E.utilLvl && E.utilLvl[kind]) || 0) * surveyDisc());
  }
  function boardCards() {
    var keys = Object.keys(UTILS), n = E.utilN || 0, m = nextMethod();
    var utils = [keys[n % 3], keys[(n + 1) % 3]];
    return m ? ['method', utils[0], utils[1]] : [utils[0], utils[1], keys[(n + 2) % 3]];
  }
  function buyCard(kind) {
    sync(); var c = expCost(kind); if (!(S.data >= c)) return false; var st = e3Stats();
    if (kind === 'method') {
      var m = nextMethod(); if (!m) return false;
      S.data -= c; E.methods[m.id] = true; E.survey = 0; K.rec('method:' + m.id);
      K.toast('METHOD · ' + m.name, m.desc + '<br><i>Pinned in Methods, below.</i>');
      K.playSound('buy'); renderCards(); renderMethods(); renderChips(); shell.refresh(); return true;
    }
    if (!UTILS[kind]) return false;
    S.data -= c; E.utilLvl[kind] = (E.utilLvl[kind] || 0) + 1; E.utilN = (E.utilN || 0) + 1; E.survey = 0;
    if (kind === 'calibrate') E.gap = Math.max(0, E.gap * 0.7);
    if (kind === 'sweep') E.accuracy = Math.min(1, E.accuracy + 0.025 * (1 - E.accuracy));
    if (kind === 'distill') S.insight += 25 * st.insMult;
    K.playSound('buy'); renderCards(); shell.refresh(); return true;
  }
  function boardHTML() {
    return boardCards().map(function (kind) {
      var isM = kind === 'method', m = isM ? nextMethod() : null, u = isM ? null : UTILS[kind];
      if (isM && !m) return '';
      var name = isM ? m.name : u.name, flavor = isM ? m.flavor : u.flavor, desc = isM ? m.desc : u.desc;
      var lvl = (!isM && E.utilLvl[kind]) ? ' <span class="xc-lv">Lv ' + E.utilLvl[kind] + '</span>' : '';
      var ic = (isM && METHOD_ICON[m.id]) ? '<img class="xc-ic" src="' + METHOD_ICON[m.id] + '">' : '';
      return '<div class="exp-card' + (isM ? ' xc-method' : '') + '" data-tip="' + esc('<i>' + flavor + '</i><br>' + desc + (isM ? '' : '<br>Repeatable; the price grows each time.')) + '">' + ic +
        '<div class="xc-name">' + (isM ? '<span class="xc-tag">METHOD</span>' : '') + name + lvl + '</div><div class="xc-desc">' + desc + '</div>' +
        '<button class="xc-buy" data-card="' + kind + '" id="xc-buy-' + kind + '"' + (isM ? ' data-mid="' + m.id + '"' : '') + '>FUND &middot; <span class="c" id="xc-c-' + kind + '"></span></button></div>';
    }).join('');
  }

  /* ---------- buys (Datasets ← Silicon, Models ← Data, Foundry ← Data [stand-in]) ---------- */
  var BUYS = {
    dataset: { res: 'silicon', base: CFG.datasetCost, growth: CFG.datasetGrowth },
    model: { res: 'data', base: CFG.modelCost, growth: CFG.modelGrowth }
  };
  var NAME = { dataset: 'Dataset Feed', model: 'Fit Engine' };
  var unitCost = function (k) { return Math.floor(BUYS[k].base * Math.pow(BUYS[k].growth, E[k])); };
  var batchOf = function (k) { return K.batch(shell.buyN ? shell.buyN() : 1, BUYS[k].base, BUYS[k].growth, E[k], S[BUYS[k].res]); };
  var canBuy = function (k) { return S[BUYS[k].res] >= batchOf(k).cost; };
  function buy(k) {
    sync(); if (!canBuy(k)) return; var b = batchOf(k), t0 = K.tierOf(E[k]);
    S[BUYS[k].res] -= b.cost; E[k] += b.n; K.rec('buy:' + k, { n: b.n }); K.playSound('buy');
    if (K.tierOf(E[k]) > t0) K.toast('MILESTONE · ' + NAME[k] + ' ×' + E[k], '+' + Math.round(K.MILESTONE_BONUS * 100) + '% to every ' + NAME[k] + ', forever.');
    shell.refresh();
  }

  /* ---------- production ---------- */
  function produce(dt) {
    sync(); var st = e3Stats();
    // Silicon now comes from the REAL Origins Foundries (shared pool, produced in the background). No fake foundry here.
    if (E.dataset > 0) { var b = E.dataset * CFG.datasetYield * st.dataMult * dt; S.data += b; K.fIn('data', b); }
    if (E.model > 0) {
      var modelRun = E.model, need = E.model * CFG.modelSilicon * dt;
      if (need > 0) { if (S.silicon >= need) { S.silicon -= need; K.fOut('silicon', need); } else { modelRun = E.model * (need > 0 ? S.silicon / need : 0); K.fOut('silicon', S.silicon); S.silicon = 0; } }
      if (modelRun > 0) runExperiment(modelRun * st.expPerModel * dt);
    }
    if (!E.done) {
      if (E.shifts >= CFG.shiftTriggers.length) { // RR6c: the world drifts continuously now — the overfit gap grows on its own; the optimal Focus changes over time
        E.dataPhase = (E.dataPhase || 0) + CFG.driftPhase * dt; E.gap = Math.min(CFG.gapMax, E.gap + CFG.driftGap * dt);
      }
      if (!E.shiftAt && E.shifts < CFG.shiftTriggers.length && E.accuracy >= CFG.shiftTriggers[E.shifts]) { E.shiftAt = S.t + CFG.shiftWarn; K.rec('shiftWarn'); }
      if (E.shiftAt && S.t >= E.shiftAt) {
        E.shiftAt = 0; E.shifts++; E.lastShift = S.t;
        var hit = CFG.shiftBase + E.gap * CFG.shiftGapBite;
        E.accuracy = Math.max(0.05, E.accuracy * (1 - hit));
        E.gap = Math.max(0, E.gap * 0.5);
        E.dataPhase = (E.dataPhase || 0) + 0.9;
        K.rec('shift', { hit: +hit.toFixed(3) });
        K.toast('DISTRIBUTION SHIFT', 'The world the data came from has <b>changed</b> — the points moved, and the accuracy fitted to the old world went with them. Re-fit. <i>Overfit models fall hardest.</i>' + (E.shifts >= CFG.shiftTriggers.length ? '<br><b>It will keep moving now.</b>' : ''), 'event');
        shell.refresh(); // the drift tag + the point that refuses to move appear in place
      }
    }
  }

  function fabricate() {
    sync(); if (effAccuracy() < CFG.genThreshold || E.done) return; E.done = true; K.rec('generalize');
    K.toast('THE MODEL GENERALIZES', 'It performs on data it never saw. The Deep era begins — the compute fabric, where three skills train at once.');
    shell.openEra(4);
  }

  /* ---------- board builders ---------- */
  function railDefs() { return [['silicon', 'Silicon', function () { return true; }], ['data', 'Data', function () { return true; }], ['insight', 'Insight', function () { return true; }]]; }
  function node3(key, name, tip) { return K.node(key, name, tip, { icon: ICON[key], pausable: false }); }

  function build() {
    sync();
    var h = '';
    // THE STAGE (pinned scatter) — full width at the top of the board grid
    h += '<div class="stage">' +
      '<div class="inst-head"><span class="inst-title">THE&nbsp;FIT</span><span class="inst-sub">a model learning the shape of the data</span><div class="mchips" id="mchips"></div><div class="inst-readout" id="accRate"></div><span class="drift-dot" id="driftDot" data-tip="' + esc('<b>The world keeps changing.</b><br>After the second shift the data never settles: the overfit gap grows on its own. <b>Generalize</b> is no longer a one-time fix.') + '"><i></i>DRIFTING</span><span class="inst-dot"></span></div>' +
      '<div class="event-banner" id="e3Banner"></div>' +
      '<canvas id="scatter" class="scatter"></canvas>' +
      '<div class="ntrack" id="ntrack" data-tip="' + esc('<b>Training</b> is how well the model scores on examples it has already seen. <b>Validation</b> is how well it does on new ones — the score that counts. The amber spread between them is the <b>overfit</b>: memorization posing as learning.') + '">' +
      '<div class="nt-fill" id="ntFill"></div><div class="nt-gap" id="ntGap"></div>' +
      '<div class="nt-tick nt-cap" id="ntCap" data-tip="' + esc('The model <b>memorizes</b> past this ceiling — validation cannot rise above it. Fund <b>Regularization</b> to lift it.') + '"><em>CEILING</em></div>' +
      '<div class="nt-tick nt-goal" id="ntGoal"><em>GOAL 88%</em></div>' +
      '<div class="nt-pin nt-train" id="ntTrain"><em>TRAINING <b id="ntTrainV"></b></em></div>' +
      '<div class="nt-pin nt-val" id="ntVal"><em>VALIDATION <b id="ntValV"></b></em></div></div></div>';
    // verbs
    h += '<div class="col-verbs"><div class="col-head">Your hands</div>' +
      '<button class="verb-run" id="expBtn"><span id="expLabel">RUN TRIAL</span><span class="vy" id="expY"></span></button>' +
      '<div class="focus-ctrl"><div class="dial-lab">Training Focus</div><div class="focus-seg-row" id="focusRow"></div></div>' +
      '<button class="side-btn xp-btn" id="xpBtn" data-tip="' + esc('<b>Experiments</b> · fund Methods (permanent techniques) and Studies (one-shot pushes) with Data. Spending here competes with running trials.<br><i>Explore trials survey the space: cards get cheaper (up to half price); funding any card consumes the survey.</i>') + '">EXPERIMENTS<span class="xp-sv" id="xpSurvey"></span><span class="badge" id="xpBadge">0</span></button></div>';
    // pipeline + experiment board + methods
    h += '<div class="col-pipe"><div class="col-head">The instrument — Silicon feeds Data, Data trains the model</div>' +
      '<div class="lane"><div class="lane-lab">The factory · observations become a trained model<div class="ldash"></div></div><div class="pipe" id="pipe"></div></div></div>';
    // goal + supply bus
    h += '<div class="col-goal"><div class="col-head">The goal</div>' +
      '<div class="goal" id="goal"><div class="gname">Generalize</div><div class="gsub">push VALIDATION to the goal line</div>' +
      '<div class="gval"><span id="goalVal">0</span><small>%</small></div><div class="meter"><i id="genMeter"></i></div><div class="meter-lab" id="genLab"></div>' +
      '<button class="fab" id="fabricate" disabled>GENERALIZE</button></div>' +
      '<div class="panel supply-bus" style="margin-top:10px" data-tip="' + esc('<b>Supply bus.</b> Datasets build from Silicon; Fit Engines draw a little every second. Silicon is made by the Origins Foundries — when it runs low, go build more there.') + '"><div class="sup-lab">Supply bus · Silicon comes from Origins</div>' +
      '<div class="sup-row" id="supRow"></div></div></div>';
    return h;
  }

  function renderFocus() {
    var f = CFG.focus;
    // VAL arrow tracks what happens to VALIDATION: Fit & Explore push it DOWN (overfit grows), only Generalize UP.
    var SIG = { fit: [['TRAIN', '▲▲', '#ffb86b'], ['VAL', '▼', '#ff8a5c'], ['OVERFIT', '▲▲', '#ff8a5c']], generalize: [['OVERFIT', '▼▼', '#7de6a8'], ['VAL', '▲', '#8af0d8'], ['TRAIN', '·', '#8a9aa0']], explore: [['SURVEY', '▲▲', '#6ea8ff'], ['VAL', '▼', '#ff8a5c'], ['OVERFIT', '▲', '#ff8a5c']], auto: [['IT CHOOSES', '↻', '#b78bff']] };
    var keys = ['fit', 'generalize', 'explore'];
    var AUTO = { label: 'Autopilot', desc: 'It has learned what you do. Let it choose the Focus each trial: Generalize when the gap is wide, Explore when a Method is out of reach, Fit otherwise.' };
    $('focusRow').innerHTML = keys.map(function (k) { var d = f[k]; return '<button class="focus-seg" data-focus="' + k + '" id="foc-' + k + '" data-tip="' + esc(d.desc) + '"><b>' + d.label + '</b><span class="fdesc">' + d.desc + '</span><span class="foc-sig">' + SIG[k].map(function (c) { return '<i style="color:' + c[2] + '">' + c[0] + ' ' + c[1] + '</i>'; }).join('') + '</span></button>'; }).join('') +
      (E.flags.autopilot ? '<button class="auto-toggle" data-focus="auto" id="foc-auto" data-tip="' + esc(AUTO.desc) + '"><span>↻ AUTOPILOT</span><small>it chooses</small></button>' : '');
    Array.prototype.forEach.call($('focusRow').querySelectorAll('[data-focus]'), function (b) { b.onclick = function () { setFocus(b.getAttribute('data-focus')); }; });
    renderChips();
  }
  function renderPipe() {
    var h = K.stock('silicon', 'Silicon');
    h += '<div class="seg">' + K.connector('silicon') + node3('dataset', 'Dataset Feed', '<i>The world, written down in numbers.</i><br>Built from Silicon. Each Dataset makes Data every second.') + K.connector('data') + K.stock('data', 'Data') + '</div>';
    h += '<div class="seg">' + K.connector('data') + node3('model', 'Fit Engine', '<i>It stops being told the answer and starts guessing it.</i><br>Auto-runs trials — spends Data, draws a little Silicon, pushes the model + yields Insight.') + K.connector('insight') + K.stock('insight', 'Insight') + '</div>';
    $('pipe').innerHTML = h;
    ['dataset', 'model'].forEach(function (k) { var b = $('buy-' + k); if (b) b.onclick = function () { buy(k); }; });
  }
  function renderCards() { var el = $('expCards'); if (el) el.innerHTML = boardHTML(); }
  function renderDrawer() { // the Experiment Board lives in the shared side drawer (like Origins' Research)
    if (shell.drawerKind && shell.drawerKind() === 'ledger') return;
    var body = $('researchBody'); if (!body) return;
    body.innerHTML = '<div class="exp-drawer"><div class="rsec">Choose what to fund · Data spent here competes with trials</div>' +
      '<div class="survey-strip" data-tip="' + esc('<i>Explore trials map the search space.</i><br>Survey discounts every card (up to half price). <b>Funding any card consumes the survey.</b>') + '"><span class="survey-lab">SURVEYED <b id="surveyPct"></b></span><div class="survey-meter"><i id="surveyFill"></i></div><span class="survey-eff" id="surveyDiscLab"></span></div>' +
      '<div id="expCards"></div></div>';
    renderCards();
    var xc = $('expCards'); if (xc) xc.onclick = function (e) { var b = e.target.closest && e.target.closest('[data-card]'); if (b && !b.disabled) buyCard(b.dataset.card); };
  }
  function renderChips() {
    var el = $('mchips'); if (!el) return; var nxt = nextMethod();
    el.innerHTML = METHODS.map(function (m) {
      var found = !!E.methods[m.id], isNext = nxt && nxt.id === m.id;
      return '<span class="mchip' + (found ? ' found' : (isNext ? ' next' : '')) + '" data-tip="' + esc('<b>' + m.name + '</b>' + (found ? '<br>' + m.desc + '<br><i>' + m.flavor + '</i>' : (isNext ? '<br>next Method · fund it on the Experiment Board' : '<br>not yet'))) + '">' + ((found && METHOD_ICON[m.id]) ? '<img src="' + METHOD_ICON[m.id] + '">' : (isNext ? '?' : '·')) + '</span>';
    }).join('');
  }
  function renderMethods() {
    if (!$('methods')) return;
    var pins = '', shownUnknown = false;
    METHODS.forEach(function (m) {
      if (E.methods[m.id]) pins += '<div class="method-pin found" data-tip="' + esc('<i>' + m.flavor + '</i><br>' + m.desc) + '">' + (METHOD_ICON[m.id] ? '<img src="' + METHOD_ICON[m.id] + '">' : '<span class="mp-glyph">&#9670;</span>') + '<div class="mp-txt"><b>' + m.name + '</b><span>' + m.desc + '</span></div></div>';
      else if (!shownUnknown) { shownUnknown = true; pins += '<div class="method-pin scanning"><span class="mp-glyph">?</span><div class="mp-txt"><b>' + (Object.keys(E.methods).length ? 'next method' : 'no methods yet') + '</b><span>fund it on the Experiment Board above.</span></div></div>'; }
    });
    $('methods').innerHTML = '<div class="method-pins">' + pins + '</div>';
  }
  function renderSupply() {
    // real reach-back: Silicon is drawn from the Origins Foundries. Low? Go build more there.
    $('supRow').innerHTML = '<button class="sup-btn" id="sup-origins" data-tip="' + esc('<i>The instrument runs on Silicon from the Origins stack.</i><br>If Datasets stall, jump back to Origins and build more Foundries.') + '"><span class="sup-nm">Silicon from <b>Origins</b> →</span><span class="sup-cost" id="supx-origins"></span></button>';
    var b = $('sup-origins'); if (b) b.onclick = function () { shell.navTo(1); };
  }
  function wire() {
    sync();
    renderFocus(); renderPipe(); renderMethods(); renderSupply(); renderDrawer();
    var xb = $('xpBtn'); if (xb) xb.onclick = function () {
      var dr = $('research'), wasR = shell.drawerKind() === 'research';
      if (wasR && dr.classList.contains('show')) { dr.classList.remove('show'); return; }
      shell.setDrawer('research'); $('researchTitle').textContent = 'EXPERIMENTS · choose what to fund'; renderDrawer(); dr.classList.add('show'); K.rec('@experiments');
    };
    var eb = $('expBtn'); if (eb) eb.onclick = runTrial; // no 'trial' float — the plot pulse is the feedback
    var fb = $('fabricate'); if (fb) fb.onclick = fabricate;
  }

  function runTrial() { sync(); if (S.data < CFG.expDataCost || E.done) return; runExperiment(1); plotPulse = 1; S.started = true; K.playSound('buy'); K.rec('trial'); shell.refresh(); }

  /* ---------- refresh ---------- */
  var costHave = function (k) { return S[k]; };
  function nodeRefresh(key, flows) {
    var nd = $('node-' + key); if (!nd) return;
    setTxt($('cnt-' + key), '×' + E[key]);
    setHTML($('rate-' + key), E[key] > 0 ? flows.map(function (f) { return '<span class="' + (f[0] === '+' ? 'up' : 'dn') + '">' + f[0] + fmt(f[1] * E[key]) + ' ' + f[2] + '</span>'; }).join('') : '<span style="color:var(--dimmer)">not built yet</span>');
    var bt = batchOf(key);
    var b = $('buy-' + key); if (b) { setHTML(b, 'Build' + (bt.n > 1 ? ' ×' + bt.n : '') + ' · ' + K.costHTML([[BUYS[key].res, bt.cost]], costHave)); var can = canBuy(key); setDis(b, !can); b.classList.toggle('ok', can); }
    var mp = $('mp-' + key); if (mp) { var c = E[key] || 0; setTxt(mp, c > 0 ? K.pipHTML(c) : ''); var nm = K.nextMilestone(c); var mcl = 'mpip' + (K.tierOf(c) > 0 ? ' tiered' : '') + (nm && nm - c <= 2 ? ' near' : ''); if (mp.className !== mcl) mp.className = mcl; }
    var starved = key === 'model' && E.model > 0 && S.data < CFG.expDataCost;
    var cl = 'node' + (canBuy(key) ? ' can' : '') + (starved ? ' starved' : ''); if (nd.className !== cl) nd.className = cl;
  }
  function refresh() {
    sync(); var st = e3Stats(), f = curFocus();
    ['silicon', 'data', 'insight'].forEach(function (k) { setTxt($('stk-' + k), fmt(S[k])); });
    K.connGlow('silicon', { norm: 1.5 }); K.connGlow('data', { norm: 1.5 }); K.connGlow('insight', { norm: 3 });
    nodeRefresh('dataset', [['+', CFG.datasetYield * st.dataMult, 'data']]);
    nodeRefresh('model', [['+', st.expPerModel, 'trials'], ['−', st.expPerModel * CFG.expDataCost, 'data'], ['−', CFG.modelSilicon, 'silicon']]);
    // the verb never wraps (a two-line "RUN GENERALIZE TRIAL" pushed EXPERIMENTS below the fold); the active Focus rides the second line in its colour
    setTxt($('expLabel'), 'RUN TRIAL');
    var FOCCOL = { fit: '#ff9a6b', generalize: '#5fe0a0', explore: '#6ea8ff' }, fk = focusKey();
    var ey = $('expY'); if (ey) { setTxt(ey, (E.focus === 'auto' ? 'Autopilot → ' : '') + f.label + (S.data < CFG.expDataCost ? ' · need ' + CFG.expDataCost + ' Data' : ' · −' + CFG.expDataCost + ' Data')); var ec = E.focus === 'auto' ? '#c9adf5' : (FOCCOL[fk] || ''); if (ey._c !== ec) { ey.style.color = ec; ey._c = ec; } }
    setDis($('expBtn'), S.data < CFG.expDataCost || E.done);
    if (predicting() && !E.pred) E.pred = predictNext();
    ['fit', 'generalize', 'explore', 'auto'].forEach(function (k) { var fb = $('foc-' + k); if (fb) { fb.classList.toggle('active', E.focus === k); fb.classList.toggle('ghost', predicting() && E.pred === k && E.focus !== k && E.focus !== 'auto'); } });
    var dd = $('driftDot'); if (dd) dd.classList.toggle('show', E.shifts >= CFG.shiftTriggers.length && !E.done);
    // two-needle readout
    var eff = effAccuracy(), thr = CFG.genThreshold;
    var pv = Math.max(0.5, Math.min(99.5, eff * 100)), pt = Math.max(0.5, Math.min(99.5, Math.max(E.accuracy, eff) * 100));
    var feEl = $('ntFill'); if (feEl) feEl.style.width = pv + '%';
    var gz = $('ntGap'); if (gz) { gz.style.left = pv + '%'; gz.style.width = Math.max(0, pt - pv) + '%'; }
    var tp = $('ntTrain'); if (tp) { tp.style.left = pt + '%'; setText('ntTrainV', (E.accuracy * 100).toFixed(0) + '%'); }
    var vp = $('ntVal'); if (vp) { vp.style.left = pv + '%'; setText('ntValV', (eff * 100).toFixed(0) + '%'); }
    var gl = $('ntGoal'); if (gl) gl.style.left = (thr * 100) + '%';
    var cp = $('ntCap'); if (cp) { var cap = st.cap, capped = cap < 0.999; cp.style.display = capped ? 'block' : 'none'; if (capped) cp.style.left = (cap * 100) + '%'; }
    $('ntrack').classList.toggle('converged', E.accuracy - eff < 0.01);
    var exps = E.model * st.expPerModel;
    setText('accRate', fmt(exps) + ' trials/s  ·  Focus: ' + (E.focus === 'auto' ? 'Autopilot → ' : '') + f.label + (S.data < CFG.expDataCost ? '  ·  need Data' : '') + (predicting() && E.predN ? '  ·  it predicted you ' + E.predHits + '/' + E.predN : ''));
    // shift banner
    var bn = $('e3Banner'); if (bn) { var bh = ''; if (E.shiftAt) bh = '&#9888; THE WORLD IS CHANGING — the data is about to move. A <b>generalized</b> model survives the shift; an overfit one falls hardest.'; else if (S.t - (E.lastShift || -99) < 9) bh = '&#10022; DISTRIBUTION SHIFT — the points moved. <b>Re-fit</b> to the new shape.'; setHTML(bn, bh); var cl = 'event-banner' + (bh ? ' show' : ''); if (bn.className !== cl) bn.className = cl; }
    // experiment board
    var sv = E.survey || 0, sf = $('surveyFill'); if (sf) sf.style.width = sv.toFixed(1) + '%';
    setText('surveyPct', Math.round(sv) + '%');
    setText('surveyDiscLab', sv >= 1 ? ('cards −' + Math.round((1 - surveyDisc()) * 100) + '%') : (E.focus === 'explore' ? 'surveying…' : 'Explore fills this'));
    var mtd = nextMethod(), mbtn = $('xc-buy-method');
    var stale = mbtn && mbtn.dataset && typeof mbtn.dataset.mid === 'string' && (!mtd || mbtn.dataset.mid !== mtd.id);
    if (stale) renderCards();
    else boardCards().forEach(function (kind) { if (kind === 'method' && !mtd) return; var bb = $('xc-buy-' + kind); if (bb) { var c = expCost(kind); setText('xc-c-' + kind, fmt(c) + ' Data'); setDis(bb, S.data < c); } });
    // the badge + glow pull you toward the METHOD (the near-win that lifts the ceiling) — never toward cheap studies
    var methodOk = !!mtd && S.data >= expCost('method');
    var xbd = $('xpBadge'); if (xbd) { setTxt(xbd, methodOk ? 'METHOD' : ''); xbd.style.display = methodOk ? 'inline-block' : 'none'; }
    setHTML($('xpSurvey'), mtd && !methodOk ? ('<b>' + fmt(S.data) + '/' + fmt(expCost('method')) + '</b> ' + mtd.name) : (sv >= 1 ? '<b>' + Math.round(sv) + '%</b> · −' + Math.round((1 - surveyDisc()) * 100) + '%' : ''));
    var xbtn = $('xpBtn'); if (xbtn) xbtn.classList.toggle('can', methodOk);
    // supply — real Origins reach-back readout
    var siRate = shell.RATES.silicon || 0;
    setText('supx-origins', fmt(S.silicon) + ' Silicon · ' + (siRate >= 0 ? '+' : '') + fmt(siRate) + '/s');
    var lowSi = S.silicon < unitCost('dataset') * 0.5 && siRate <= 0;
    var so = $('sup-origins'); if (so) so.classList.toggle('can', lowSi);
    setText('supSi', lowSi ? 'Silicon low — build more Foundries in Origins.' : '');
    // goal
    var goalPct = Math.min(100, (eff / thr) * 100);
    if ($('genMeter')) $('genMeter').style.width = goalPct + '%';
    setText('goalVal', (eff * 100).toFixed(0)); setText('genLab', (eff * 100).toFixed(0) + '% / ' + (thr * 100).toFixed(0) + '% validation');
    var ready = eff >= thr && !E.done; setDis($('fabricate'), !ready); setTxt($('fabricate'), E.done ? 'GENERALIZED ✓' : 'GENERALIZE');
    if ($('goal')) $('goal').classList.toggle('ready', ready);
    drawScatter();
  }

  /* ---------- the living scatter ---------- */
  var plotPulse = 0, drawPhase = 0;
  function drawScatter() {
    var cv = $('scatter'); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'); if (!ctx || !ctx.arc) return;
    var w = cv.width = cv.clientWidth || 640, h = cv.height = cv.clientHeight || 250, pad = 22, gw = w - pad * 2, gh = h - pad * 2;
    var acc = E.accuracy, gap = E.gap, t = S.t || 0;
    var X = function (x) { return pad + x * gw; }, Y = function (y) { return h - pad - Math.max(0.02, Math.min(0.98, y)) * gh; };
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(95,224,192,0.07)'; ctx.lineWidth = 1;
    for (var i = 1; i < 8; i++) { var gx = pad + gw * i / 8; ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, h - pad); ctx.stroke(); }
    for (var j = 1; j < 5; j++) { var gy = pad + gh * j / 5; ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w - pad, gy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(95,224,192,0.28)'; ctx.beginPath(); ctx.moveTo(pad, pad - 6); ctx.lineTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
    drawPhase += ((E.dataPhase || 0) - drawPhase) * 0.06;
    var fn = function (x) { return 0.5 + 0.32 * Math.sin(x * Math.PI * 1.15 + 0.5 + drawPhase); };
    var fit = function (x) { return 0.5 + (fn(x) - 0.5) * acc + Math.sin(x * 42 + t * 2) * gap * 0.16 * acc; };
    var genRef = function (x) { return 0.5 + (fn(x) - 0.5) * Math.min(1, acc + 0.04); };
    if (ctx.setLineDash) ctx.setLineDash([5, 5]);
    ctx.beginPath(); for (var px = 0; px <= gw; px += 3) { var x0 = px / gw, cx0 = pad + px, cy0 = Y(genRef(x0)); px === 0 ? ctx.moveTo(cx0, cy0) : ctx.lineTo(cx0, cy0); }
    ctx.strokeStyle = 'rgba(95,224,192,0.20)'; ctx.lineWidth = 1.4; ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);
    var pulse = plotPulse; plotPulse *= 0.82; if (plotPulse < 0.01) plotPulse = 0;
    var band = (1 - acc) * 0.16 + 0.012 + pulse * 0.03;
    ctx.beginPath();
    for (var pa = 0; pa <= gw; pa += 3) { var xa = pa / gw, cxa = pad + pa; (pa === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, cxa, Y(fit(xa) + band)); }
    for (var pb = gw; pb >= 0; pb -= 3) { var xb = pb / gw, cxb = pad + pb; ctx.lineTo(cxb, Y(fit(xb) - band)); }
    ctx.closePath(); ctx.fillStyle = 'rgba(95,224,192,0.09)'; ctx.fill();
    var N = 30, pr = 1 + pulse * 1.1; ctx.fillStyle = 'rgba(110,231,255,' + (0.8 + pulse * 0.2) + ')';
    if (ctx.shadowBlur !== undefined) { ctx.shadowColor = 'rgba(110,231,255,0.6)'; ctx.shadowBlur = 4 + pulse * 8; }
    var odd = E.shifts >= 1 ? 17 : -1; // one point was there before the world moved. It stays.
    for (var k2 = 0; k2 < N; k2++) { if (k2 === odd) continue; var x2 = (k2 + 0.5) / N, hsh = Math.abs(Math.sin(k2 * 12.9898) * 43758.5453) % 1, ny = (hsh - 0.5) * 0.32; ctx.beginPath(); ctx.arc(X(x2), Y(fn(x2) + ny), 2.4 * pr, 0, 6.3); ctx.fill(); }
    if (odd >= 0) { var xo = (odd + 0.5) / N, ho = Math.abs(Math.sin(odd * 12.9898) * 43758.5453) % 1, nyo = (ho - 0.5) * 0.32, fn0 = 0.5 + 0.32 * Math.sin(xo * Math.PI * 1.15 + 0.5); ctx.fillStyle = 'rgba(183,139,255,0.92)'; if (ctx.shadowBlur !== undefined) { ctx.shadowColor = 'rgba(183,139,255,0.8)'; ctx.shadowBlur = 9; } ctx.beginPath(); ctx.arc(X(xo), Y(fn0 + nyo), 2.7, 0, 6.3); ctx.fill(); S.flags.oddPoint = true; }
    if (ctx.shadowBlur !== undefined) ctx.shadowBlur = 0;
    ctx.beginPath(); for (var pc = 0; pc <= gw; pc += 2) { var xc = pc / gw, cxc = pad + pc, cyc = Y(fit(xc)); pc === 0 ? ctx.moveTo(cxc, cyc) : ctx.lineTo(cxc, cyc); }
    var hot = Math.min(1, gap / 0.35); ctx.lineWidth = 2.4;
    ctx.strokeStyle = hot > 0.5 ? 'rgba(255,184,107,0.95)' : '#d7fff6';
    if (ctx.shadowBlur !== undefined) { ctx.shadowColor = hot > 0.5 ? 'rgba(255,184,107,0.6)' : 'rgba(155,255,234,0.55)'; ctx.shadowBlur = 7; }
    ctx.stroke(); if (ctx.shadowBlur !== undefined) ctx.shadowBlur = 0;
    if (ctx.fillText) { ctx.font = '11px "IBM Plex Mono", monospace'; ctx.textAlign = 'right';
      var yFit = Y(fit(0.985)), yGen = Y(genRef(0.985));
      ctx.fillStyle = hot > 0.5 ? 'rgba(255,184,107,0.95)' : 'rgba(215,255,246,0.85)';
      ctx.fillText(hot > 0.5 ? 'the model · memorizing' : 'the model', w - pad - 6, yFit + (yFit <= yGen ? -7 : 14));
      ctx.fillStyle = 'rgba(95,224,192,0.55)';
      ctx.fillText('validation', w - pad - 6, yGen + (yFit <= yGen ? 14 : -7));
      ctx.textAlign = 'left';
    }
  }

  function fresh(st) {
    st.data = 0; st.insight = 0;
    st.e3 = { accuracy: 0, gap: 0, methods: {}, focus: 'fit', survey: 0, utilN: 0, utilLvl: { calibrate: 0, sweep: 0, distill: 0 }, shifts: 0, shiftAt: 0, lastShift: -99, dataPhase: 0, dataset: 0, model: 0, foundry: 0, done: false,
      trials: 0, focHist: ['fit'], pred: null, predN: 0, predHits: 0, predStreak: 0, flags: {} };
  }
  function open(st) {
    // Statistical→Origins reach-back: Datasets consume Silicon that Origins produces. Seed a starting buffer + datasets.
    var e = st.e3;
    if (!e.dataset) { st.silicon = (st.silicon || 0) + CFG.seedSilicon; e.dataset = CFG.seedDatasets; }
    st.started = true;
  }

  return {
    id: 3, theme: 'theme-3', name: 'Statistical', sub: 'learning the shape of the data', sigil: 'assets/sigil-statistical.png',
    bed: 'assets/music-glass-algorithm.mp3', pool: ['data', 'insight'],
    sound: { buy: { osc: 'sine', f0: 560, f1: 880, g: 0.06, dur: 0.13 }, event: { osc: 'sine', f0: 440, f1: 300, g: 0.06, dur: 0.16 } },
    res: RES,
    phase: function () { return 'TRAINING'; },
    hasDrawer: true, drawerTitle: 'EXPERIMENTS · choose what to fund',
    fresh: fresh, open: open, produce: produce, build: build, wire: wire, refresh: refresh, railDefs: railDefs,
    done: function () { sync(); return !!E.done; },
    primary: function () { runTrial(); }, // Space
    ledger: function () {
      sync(); var rows = [];
      if (E.dataset) rows.push(['Dataset Feeds' + (K.tierOf(E.dataset) ? ' <b>×' + K.tierMult(E.dataset).toFixed(2) + '</b>' : ''), '×' + E.dataset]);
      if (E.model) rows.push(['Fit Engines' + (K.tierOf(E.model) ? ' <b>×' + K.tierMult(E.model).toFixed(2) + '</b>' : ''), '×' + E.model]);
      var found = METHODS.filter(function (m) { return E.methods[m.id]; });
      if (found.length) rows.push(['Methods', found.length + '/' + METHODS.length + ' · ' + found.map(function (m) { return m.name; }).join(', ')]);
      var u = E.utilLvl || {}; var ul = Object.keys(UTILS).filter(function (k) { return u[k]; }).map(function (k) { return UTILS[k].name + ' Lv ' + u[k]; });
      if (ul.length) rows.push(['Studies', ul.join(', ')]);
      if (E.trials) rows.push(['Trials run', fmt(E.trials)]);
      if (E.shifts) rows.push(['Distribution shifts survived', String(E.shifts)]);
      if (E.done) rows.push(['Generalized', (effAccuracy() * 100).toFixed(0) + '% validation']);
      return rows;
    },
    acts: { runExperiment: runExperiment, runTrial: runTrial, setFocus: setFocus, policy: policy, predictNext: predictNext, buy: buy, canBuy: canBuy, unitCost: unitCost, batchOf: batchOf, buyCard: buyCard, expCost: expCost, nextMethod: nextMethod, effAccuracy: effAccuracy, fabricate: fabricate }
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = makeEraStatistical;
