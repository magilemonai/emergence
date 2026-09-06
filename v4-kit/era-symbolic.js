/* ============================================================================
   ERA MODULE — Symbolic (era 2). Ported from emergence-v3-symbolic.html onto the
   shared shell + KIT. Re-homed: resources rules/inference/axioms live in the shared
   pool (S top-level); Symbolic mechanic state lives on S.e2; the Knowledge→Rules
   handoff is wired in open(). Factory: makeEraSymbolic(shell).
   ============================================================================ */
function makeEraSymbolic(shell) {
  var K = shell.KIT, $ = K.$, fmt = K.fmt, esc = K.esc, setTxt = K.setTxt, setHTML = K.setHTML, setDis = K.setDis;
  var S = shell.S, CFG = shell.CFG.e2;

  var RES = {
    rules: { hue: '#8dffb7', glyph: '§', flavor: 'Reasoning, written as explicit rules.' },
    inference: { hue: '#6fe6d8', glyph: '∴', flavor: 'Conclusions the rules can reach.' },
    axioms: { hue: '#ffcd6b', glyph: '⊢', flavor: 'Truths banked forever, kept across runs.' }
  };
  var HUE = { rules: RES.rules.hue, inference: RES.inference.hue, axioms: RES.axioms.hue };

  var TREE = [
    { id: 'formalLogic', name: 'Formal Logic', cost: 650, req: [], desc: '+50% to all rule production. Unlocks parallel Rulesets.' },
    { id: 'fwdChain', name: 'Forward Chaining', cost: 1400, req: ['formalLogic'], excl: 'bwdChain', desc: 'DOCTRINE · Rulesets +80%. Closes Backward Chaining.' },
    { id: 'bwdChain', name: 'Backward Chaining', cost: 1400, req: ['formalLogic'], excl: 'fwdChain', desc: 'DOCTRINE · Each rule you write ×3. Closes Forward Chaining.' },
    { id: 'rete', name: 'Rete Network', cost: 3200, req: ['fwdChain'], desc: 'Each Ruleset boosts every other (+3% each).' },
    { id: 'inference', name: 'Inference Engine', cost: 4600, req: [], reqAny: ['fwdChain', 'bwdChain'], desc: 'Unlocks Daemons — automation that writes rules for you.' },
    { id: 'heuristics', name: 'Heuristic Search', cost: 3200, req: ['bwdChain'], desc: 'Writing scales with Rulesets owned (+8% each).' },
    { id: 'knowledge', name: 'Knowledge Base', cost: 8500, req: ['inference'], reqAny: ['rete', 'heuristics'], desc: 'Unlocks Compile — bank a run into permanent Axioms.' },
    { id: 'metalogic', name: 'Meta-Logic', cost: 16000, req: ['knowledge'], desc: 'Every Axiom becomes 50% stronger.' },
    { id: 'expert', name: 'Expert System', cost: 30000, req: ['metalogic'], reqAxioms: 5, desc: 'Complete the era. A system that reasons on its own.' }
  ];
  var TMAP = {}; TREE.forEach(function (n) { TMAP[n.id] = n; });
  var symName = function (id) { return id === 'optimization' ? 'Optimization' : id === 'capacity' ? 'Inference Capacity' : (TMAP[id] && TMAP[id].name) || id; };

  var E; function sync() { E = S.e2; }
  var ODD_RULE = 4471; // the rule nobody wrote — it recurs (foreshadow; the agent claims it later; persists across runs)
  function term(line) { E.term = E.term || []; E.term.push(line); while (E.term.length > 3) E.term.shift(); E.termN = (E.termN || 0) + 1; }
  var rulesetGated = function () { return !E.tech.formalLogic && E.ruleset >= 1; }; // one Ruleset until Formal Logic

  /* ---------- derived ---------- */
  function stats() {
    var T = E.tech, click = CFG.clickBase, rm = 1, g = 1;
    if (T.formalLogic) g *= 1.5; if (T.fwdChain) rm *= 1.8; if (T.bwdChain) click *= 3;
    if (T.rete) rm *= (1 + 0.03 * E.ruleset); if (T.heuristics) click *= (1 + 0.08 * E.ruleset);
    click *= (1 + CFG.contraBonus * (E.paraBwd || 0)); rm *= (1 + CFG.contraBonus * (E.paraFwd || 0));
    if (E.contra) g *= CFG.contraSlow;
    var axBonus = CFG.axiomBonus * (T.metalogic ? 1.5 : 1); g *= (1 + S.axioms * axBonus); g *= (1 + CFG.lemmaBonus * E.optLevel);
    // v4 milestones (×10/×25/×50/×100 rulesets or daemons → +25% per tier to that engine)
    return { click: click * g, rulesetYield: CFG.rulesetYield * rm * g * K.tierMult(E.ruleset), daemonRate: CFG.daemonRate * K.tierMult(E.daemon), axBonus: axBonus };
  }
  var symInfRate = function () { return E.ruleset * CFG.infPerRuleset; };
  var infCap = function () { return CFG.infCapBase + E.infCapLevel * CFG.infCapStep; };
  function proofCost(id) {
    if (id === 'optimization') return Math.floor(CFG.lemmaBase * Math.pow(CFG.lemmaGrowth, E.optLevel));
    if (id === 'capacity') return Math.floor(CFG.capLemmaBase * Math.pow(CFG.capLemmaGrowth, E.infCapLevel));
    return Math.ceil(TMAP[id].cost * CFG.infScale);
  }
  function canProve(id) {
    if (id === 'optimization' || id === 'capacity') return true; var n = TMAP[id]; if (!n || E.tech[id]) return false;
    if (!n.req.every(function (r) { return E.tech[r]; })) return false;
    if (n.reqAny && !n.reqAny.some(function (r) { return E.tech[r]; })) return false;
    if (n.excl && E.tech[n.excl]) return false; if (n.reqAxioms && S.axioms < n.reqAxioms) return false; return true;
  }
  var treeVisible = function (n) { return !E.tech[n.id] && n.req.every(function (r) { return E.tech[r]; }) && (!n.reqAny || n.reqAny.some(function (r) { return E.tech[r]; })) && !(n.excl && E.tech[n.excl]); };

  /* ---------- production ---------- */
  function produce(dt) {
    sync(); var st = stats();
    var g = 0; if (E.ruleset > 0) g += E.ruleset * st.rulesetYield * dt; if (E.daemon > 0) g += E.daemon * st.daemonRate * st.click * dt;
    if (g > 0) { S.rules += g; E.runRules += g; K.fIn('rules', g); }
    if (!K.MUTE && !E.contra && E.contraN < CFG.contraAt.length && E.runRules >= CFG.contraAt[E.contraN] && !E.flags.symbolicDone) { // live play only — offline stays clean
      var seed = Math.floor(E.runRules); E.contra = { a: 1000 + seed % 3989, b: 4000 + (seed * 7) % 5989 };
      if (E.contraN === 1) { E.contra.b = (S.legacy && S.legacy.oddRule) || ODD_RULE; E.contra.odd = true; S.flags.oddRule = E.contra.b; } // the second one names a rule nobody wrote
      term('<span class="w">⚠ #' + E.contra.a + ' ⊥ #' + E.contra.b + '</span>' + (E.contra.odd ? ' · <span class="w">origin: none</span>' : ''));
      K.toast('CONTRADICTION DETECTED', 'Rule #' + E.contra.a + ' conflicts with #' + E.contra.b + '. Discard one to clear the drag.', 'event'); shell.requestRender();
    }
    // the terminal narrates the engine at work (live only): a derivation line every few seconds while a proof runs
    if (!K.MUTE && E.activeProof && E.ruleset > 0) {
      E.termT = (E.termT || 0) - dt;
      if (E.termT <= 0) { E.termT = 2.4 + (Math.floor(E.runRules) % 7) * 0.3; var pc = Math.min(99, Math.floor(100 * (E.proofAcc[E.activeProof] || 0) / proofCost(E.activeProof))); var ra = 1000 + Math.floor(E.runRules * 3) % 8999, rb = 1000 + Math.floor(E.runRules * 11) % 8999; term('∴ #' + ra + ' ⊢ #' + rb + '  → <b>' + symName(E.activeProof) + '</b> ' + pc + '%'); }
    }
    var inf = symInfRate() * dt;
    if (inf > 0) {
      K.fIn('inference', inf);
      if (E.activeProof) {
        E.proofAcc[E.activeProof] = (E.proofAcc[E.activeProof] || 0) + inf; K.fOut('inference', inf);
        if (E.proofAcc[E.activeProof] >= proofCost(E.activeProof)) completeProof(E.activeProof);
      } else S.inference = Math.min(infCap(), S.inference + inf);
    }
  }

  /* ---------- actions ---------- */
  var rulesetCost = function () { return Math.floor(CFG.rulesetCost * Math.pow(CFG.rulesetGrowth, E.ruleset)); };
  var daemonCost = function () { return Math.floor(CFG.daemonCost * Math.pow(CFG.daemonGrowth, E.daemon)); };
  var rulesetBatch = function () { var b = K.batch(shell.buyN ? shell.buyN() : 1, CFG.rulesetCost, CFG.rulesetGrowth, E.ruleset, S.rules); if (!E.tech.formalLogic && E.ruleset + b.n > 1) { b.n = Math.max(1, 1 - E.ruleset); b.cost = K.bulkCost(CFG.rulesetCost, CFG.rulesetGrowth, E.ruleset, b.n); } return b; };
  var daemonBatch = function () { return K.batch(shell.buyN ? shell.buyN() : 1, CFG.daemonCost, CFG.daemonGrowth, E.daemon, S.rules); };
  function milestoneToast(name, count, t0) { if (K.tierOf(count) > t0) K.toast('MILESTONE · ' + name + ' ×' + count, '+' + Math.round(K.MILESTONE_BONUS * 100) + '% to every ' + name + ', forever.'); }
  function buyRuleset() { sync(); if (rulesetGated()) return; var b = rulesetBatch(); if (S.rules < b.cost) return; var t0 = K.tierOf(E.ruleset); S.rules -= b.cost; E.ruleset += b.n; K.rec('buy:ruleset', { n: b.n }); K.playSound('buy'); milestoneToast('Ruleset', E.ruleset, t0); shell.refresh(); }
  function buyDaemon() { sync(); if (!E.tech.inference) return; var b = daemonBatch(); if (S.rules < b.cost) return; var t0 = K.tierOf(E.daemon); S.rules -= b.cost; E.daemon += b.n; K.rec('buy:daemon', { n: b.n }); K.playSound('buy'); milestoneToast('Daemon', E.daemon, t0); shell.refresh(); }
  function writeRule(ev) {
    sync(); var g = stats().click; S.rules += g; E.runRules += g; S.started = true; K.playSound('buy');
    if (ev && ev.currentTarget) { var r = ev.currentTarget.getBoundingClientRect(); K.floatNum('+' + fmt(g), HUE.rules, r.right - 40, r.top + 10); }
    shell.refresh();
  }
  function selectProof(id) { sync(); if (!canProve(id) || E.activeProof === id) return; E.activeProof = id; E.proofAcc[id] = (E.proofAcc[id] || 0) + S.inference; S.inference = 0; K.rec('aim:' + id); K.playSound('buy'); shell.requestRender(); }
  function completeProof(id) {
    sync();
    if (id === 'optimization') E.optLevel++;
    else if (id === 'capacity') E.infCapLevel++;
    else { E.tech[id] = true; if (id === 'knowledge') E.flags.compile = true; if (id === 'expert') E.flags.symbolicDone = true; }
    E.proofAcc[id] = 0; E.activeProof = null; K.rec('proof:' + id);
    term('<span class="q">∎ Q.E.D.</span> <b>' + symName(id) + '</b>' + (id === 'formalLogic' ? ' · parallel rulesets online' : ''));
    K.toast('Q.E.D. · ' + symName(id), TMAP[id] ? TMAP[id].desc : 'lemma level up');
    if (id === 'expert') { K.toast('THE EXPERT SYSTEM', 'It reasons on its own now. The Statistical era begins.'); shell.openEra(3); }
    else shell.requestRender();
  }
  var axiomGain = function () { return Math.floor(Math.sqrt(E.runRules / CFG.axiomDivisor)); };
  function compile() {
    sync(); if (!E.flags.compile || E.flags.symbolicDone) return; var g = axiomGain(); if (g < 1) return;
    S.axioms += g; E.totalAxioms += g; E.compiles++; S.rules = 0; E.runRules = 0; E.ruleset = 0; E.daemon = 0; E.contra = null; E.contraN = 0;
    E.term = []; term('<span class="q">⊢ COMPILE</span> · run banked'); term('<span class="q">AXIOMS +' + g + '</span> · ' + S.axioms + ' held'); term('REBOOT · technique kept, engine cleared');
    K.rec('compile'); K.toast('COMPILE · +' + g + ' axioms', 'Run banked. Rules, Rulesets and Daemons cleared; Axioms and Technique kept — rebuild from a higher floor.');
    // prestige moment: the CRT powers down, the board reassembles from the higher floor
    var bd = $('board');
    if (bd && bd.classList && !K.MUTE) { bd.classList.add('reboot'); K.playSound('event'); setTimeout(function () { shell.requestRender(); var b2 = $('board'); if (b2 && b2.classList) { b2.classList.add('rebooted'); setTimeout(function () { b2.classList.remove('rebooted'); }, 700); } }, 720); }
    else shell.requestRender();
  }
  function resolveContra(side) {
    sync(); if (!E.contra) return; if (side === 'fwd') E.paraFwd = (E.paraFwd || 0) + 1; else E.paraBwd = (E.paraBwd || 0) + 1;
    E.contraN = (E.contraN || 0) + 1; E.contra = null; K.rec('contra:' + side); K.playSound('buy');
    term('<span class="q">✓</span> contradiction cleared · ' + (side === 'fwd' ? 'rulesets' : 'writes') + ' +' + Math.round(CFG.contraBonus * 100) + '%');
    K.toast('CONTRADICTION RESOLVED', side === 'fwd' ? 'Specific rule discarded · Rulesets +' + Math.round(CFG.contraBonus * 100) + '% forever' : 'General rule discarded · manual writes +' + Math.round(CFG.contraBonus * 100) + '% forever'); shell.requestRender();
  }

  /* ---------- board ---------- */
  var stockCap = function (res, label) { return '<div class="stock" style="border-color:' + HUE[res] + '44"><span class="sglyph" style="color:' + HUE[res] + '">' + (RES[res].glyph || '') + '</span><div class="sv" id="stk-' + res + '" style="color:' + HUE[res] + '">0</div><div class="sl">' + label + '</div><div class="scap" id="stkcap-' + res + '"></div></div>'; };

  function railDefs() { sync(); return [['rules', 'Rules', function () { return true; }], ['inference', 'Inference', function () { return true; }], ['axioms', 'Axioms', function () { return E.flags.compile || S.axioms > 0; }]]; }

  function build() {
    sync();
    var h = '';
    h += '<div class="col-verbs"><div class="col-head">Your hand</div>' +
      '<button class="verb" id="writeRule"><span class="vname">Write a rule</span><span class="vyield" id="writeY"></span><span class="vkey">click / ↵</span></button>' +
      '<div class="side-btn" id="compileBtn" style="display:' + (E.flags.compile ? 'flex' : 'none') + '"><span>COMPILE</span><span class="badge" id="compileBadge">+0</span></div>' +
      '<div class="compile-hint" id="compileHint" style="display:' + (E.flags.compile ? 'block' : 'none') + '"></div></div>';
    h += '<div class="col-pipe"><div class="col-head">The engine — rules reason into inference, inference proves theorems</div>' +
      '<div class="lane"><div class="lane-lab">Author · write rules, automate them<div class="ldash"></div></div><div class="pipe" id="authorPipe"></div></div>' +
      '<div class="lane"><div class="lane-lab">Prove · aim inference at a theorem<div class="ldash"></div></div><div class="proof-active" id="proofActive"></div><div class="term" id="term"></div><div class="theorems" id="theorems"></div></div></div>';
    h += '<div class="col-goal"><div class="col-head">The goal</div><div class="goal" id="goal">' +
      '<div class="gname">Expert System</div><div class="gsub">a system that reasons on its own</div><div class="path" id="path"></div>' +
      '<button class="fab" id="fabricate" disabled>PROVE IT</button></div>' +
      // the timed decision lives beside the goal (in view; never below the fold)
      '<div class="contra" id="contra"><div class="cm-i"><div class="cm-name" id="contraName"></div><div class="cm-d" id="contraDesc"></div></div>' +
      '<div class="cm-acts"><button class="buy" id="contraFwd"></button><button class="buy" id="contraBwd"></button></div></div></div>';
    return h;
  }
  function buildAuthor() {
    sync();
    var h = K.stock('rules', 'Rules').replace('</div></div>', '<div class="stag">← Origins Knowledge</div></div></div>');
    h += '<div class="seg">' + K.connector('rules') +
      '<div class="node" id="node-ruleset" data-tip="' + esc('<i>Logic that begets more logic.</i><br>Writes Rules automatically and emits Inference (reasoning power).') + '"><div class="nname">Ruleset <span class="ncount" id="cnt-ruleset"></span><span class="mpip" id="mp-ruleset"></span></div><button class="buy nbuy" id="buy-ruleset"></button><div class="nrate" id="rate-ruleset"></div></div>' +
      K.connector('inference') + stockCap('inference', 'Inference') + '</div>';
    if (E.tech.inference) h += '<div class="seg" style="flex:1 1 100%"><div class="node" id="node-daemon" data-tip="' + esc('<i>A patient process that keeps working while you look away.</i><br>Fires the write action for you.') + '"><div class="nname">Daemon <span class="ncount" id="cnt-daemon"></span><span class="mpip" id="mp-daemon"></span></div><button class="buy nbuy" id="buy-daemon"></button><div class="nrate" id="rate-daemon"></div></div></div>';
    $('authorPipe').innerHTML = h;
    var br = $('buy-ruleset'); if (br) br.onclick = buyRuleset; var bd = $('buy-daemon'); if (bd) bd.onclick = buyDaemon;
  }
  function buildTheorems() {
    sync();
    var items = ['optimization', 'capacity'].concat(TREE.filter(treeVisible).map(function (n) { return n.id; }));
    var h = '';
    items.forEach(function (id) {
      var lem = id === 'optimization' || id === 'capacity';
      var nm = id === 'optimization' ? ('Optimization Lv ' + (E.optLevel + 1)) : id === 'capacity' ? ('Inference Capacity Lv ' + (E.infCapLevel + 1)) : TMAP[id].name;
      var d = id === 'optimization' ? ('+' + Math.round(CFG.lemmaBonus * 100) + '% all rule production — repeatable') : id === 'capacity' ? ('+' + CFG.infCapStep + ' max banked Inference — repeatable') : TMAP[id].desc;
      h += '<div class="th' + (lem ? ' lemma' : '') + '" id="th-' + id + '" data-tip="' + esc(d) + '"><div class="thn">' + nm + '</div><div class="thd">' + d + '</div><button class="buy thaim" id="aim-' + id + '"></button></div>';
    });
    $('theorems').innerHTML = h;
    items.forEach(function (id) { var b = $('aim-' + id); if (b) b.onclick = function () { selectProof(id); }; });
  }
  function pathHTML() {
    var order = ['formalLogic', 'inference', 'knowledge', 'metalogic', 'expert'], h = '';
    order.forEach(function (id) { var done = E.tech[id], now = !done && canProve(id); h += '<div class="pstep' + (done ? ' done' : now ? ' now' : '') + '"><span class="pmark">' + (done ? '✓' : now ? '▸' : '·') + '</span>' + symName(id) + (id === 'expert' && !done ? ' <span style="opacity:.6">(needs Meta-Logic + 5 Axioms)</span>' : '') + '</div>'; });
    return h;
  }

  var _keyWired = false;
  function wire() {
    sync();
    if ($('writeRule')) $('writeRule').onclick = writeRule;
    buildAuthor(); buildTheorems();
    if ($('path')) $('path').innerHTML = pathHTML();
    var fb = $('fabricate'); if (fb && !fb._wired) { fb.onclick = function () { if (canProve('expert')) selectProof('expert'); }; fb._wired = 1; }
    if (E.flags.compile) { var cb = $('compileBtn'); if (cb && !cb._wired) { cb.onclick = compile; cb._wired = 1; } }
    if (!_keyWired) { _keyWired = true; addEventListener('keydown', function (e) { if (e.key === 'Enter' && shell.S.era === 2 && !/input|textarea/i.test((e.target && e.target.tagName) || '')) writeRule(); }); }
  }

  function pipRefresh(key, c) {
    var mp = $('mp-' + key); if (!mp) return;
    setTxt(mp, c > 0 ? K.pipHTML(c) : ''); var nm = K.nextMilestone(c);
    var cl = 'mpip' + (K.tierOf(c) > 0 ? ' tiered' : '') + (nm && nm - c <= 2 ? ' near' : ''); if (mp.className !== cl) mp.className = cl;
  }
  function refresh() {
    sync(); var st = stats();
    setHTML($('writeY'), '+' + fmt(st.click) + ' rules');
    setTxt($('stk-rules'), fmt(S.rules)); setTxt($('stk-inference'), fmt(S.inference)); setTxt($('stkcap-inference'), 'cap ' + fmt(infCap()));
    K.connGlow('rules', { norm: 0.5 }); K.connGlow('inference', { norm: 0.5 });
    setTxt($('cnt-ruleset'), '×' + E.ruleset);
    setHTML($('rate-ruleset'), E.ruleset > 0 ? '<span class="up">+' + fmt(E.ruleset * st.rulesetYield) + ' rules/s</span><span class="inf">+' + fmt(symInfRate()) + ' inference/s</span>' : '<span style="color:var(--dimmer)">writes rules + emits inference</span>');
    var rb = rulesetBatch();
    var gated = rulesetGated();
    var br = $('buy-ruleset'); if (br) { setHTML(br, gated ? 'one at a time · prove <span class="c">Formal Logic</span> for more' : 'Build' + (rb.n > 1 ? ' ×' + rb.n : '') + ' · <span class="c">' + fmt(rb.cost) + ' rules</span>'); var canR = !gated && S.rules >= rb.cost; setDis(br, !canR); br.classList.toggle('ok', canR); }
    var rn = $('node-ruleset'); if (rn) rn.classList.toggle('gated', gated);
    pipRefresh('ruleset', E.ruleset);
    if (E.tech.inference) {
      setTxt($('cnt-daemon'), '×' + E.daemon);
      setHTML($('rate-daemon'), E.daemon > 0 ? '<span class="up">+' + fmt(E.daemon * st.daemonRate * st.click) + ' rules/s</span>' : '<span style="color:var(--dimmer)">auto-writes rules</span>');
      var db = daemonBatch();
      var bd = $('buy-daemon'); if (bd) { setHTML(bd, 'Build' + (db.n > 1 ? ' ×' + db.n : '') + ' · <span class="c">' + fmt(db.cost) + ' rules</span>'); var canD = S.rules >= db.cost; setDis(bd, !canD); bd.classList.toggle('ok', canD); }
      pipRefresh('daemon', E.daemon);
    }
    // active proof
    var pa = $('proofActive');
    if (pa) {
      if (E.activeProof) {
        pa.classList.remove('idle'); var id = E.activeProof, c = proofCost(id), acc = E.proofAcc[id] || 0, pct = Math.min(100, acc / c * 100), rate = symInfRate(), eta = rate > 0 ? Math.ceil((c - acc) / rate) : 0;
        setHTML(pa, '<div class="pa-top"><span>Proving <b>' + symName(id) + '</b></span><span>' + fmt(acc) + ' / ' + fmt(c) + (eta ? ' · ~' + eta + 's' : '') + '</span></div><div class="meter"><i style="width:' + pct + '%"></i></div>');
      } else { setHTML(pa, '<div class="pa-idle">▸ aim Inference at a <b>Theorem</b> below</div>'); if (!pa.classList.contains('idle')) pa.classList.add('idle'); }
    }
    // the terminal (last 3 lines of the engine at work)
    var tm = $('term'); if (tm) { var tk = (E.termN || 0); if (tm._k !== tk) { tm._k = tk; tm.innerHTML = (E.term || []).map(function (l) { return '<div class="tl">' + l + '</div>'; }).join('') || '<div class="tl" style="color:var(--dimmer)">&gt; engine idle · write a rule</div>'; } }
    var items = ['optimization', 'capacity'].concat(TREE.filter(treeVisible).map(function (n) { return n.id; }));
    items.forEach(function (id) {
      var b = $('aim-' + id); if (!b) return; var active = E.activeProof === id, cost = proofCost(id);
      setHTML(b, active ? 'PROVING…' : 'Aim · <span class="c" style="color:var(--inference)">' + fmt(cost) + ' inf</span>'); setDis(b, active);
      var th = $('th-' + id); if (th) { var cl = 'th' + ((id === 'optimization' || id === 'capacity') ? ' lemma' : '') + (active ? ' active' : ''); if (th.className !== cl) th.className = cl; }
    });
    if (E.flags.compile) {
      var ag = axiomGain(); setTxt($('compileBadge'), '+' + ag);
      // axiom clarity ([06:24] "not clear what contributes to Axioms or how close"): surface run-rules → axioms + next threshold
      var nextAt = CFG.axiomDivisor * (ag + 1) * (ag + 1);
      setHTML($('compileHint'), 'Banks <b>+' + ag + '</b> Axiom' + (ag === 1 ? '' : 's') + ' from this run (<b>' + fmt(E.runRules) + '</b> rules) · next +1 at <b>' + fmt(nextAt) + '</b> rules');
    }
    if ($('path')) setHTML($('path'), pathHTML());
    var ready = canProve('expert'), fb = $('fabricate'); if (fb) { setDis(fb, !ready && !E.flags.symbolicDone); setTxt(fb, E.flags.symbolicDone ? 'PROVEN ✓' : (E.activeProof === 'expert' ? 'PROVING…' : 'PROVE IT')); }
    if ($('goal')) $('goal').classList.toggle('ready', ready || E.flags.symbolicDone);
    // contradiction
    var cc = $('contra');
    if (cc) {
      if (E.contra) {
        if (!cc.classList.contains('show')) cc.classList.add('show');
        setTxt($('contraName'), '⚠ Contradiction · #' + E.contra.a + ' vs #' + E.contra.b + ' · engine at ' + Math.round(CFG.contraSlow * 100) + '%');
        var cd = $('contraDesc'); if (cd) { setHTML(cd, E.contra.odd ? 'Rule #' + E.contra.b + ' was not written by you. Or by a daemon.' : 'Discard one. Either choice teaches the engine something permanent.'); cd.classList.toggle('odd', !!E.contra.odd); }
        setHTML($('contraFwd'), 'Discard #' + E.contra.a + ' <small>· Rulesets +' + Math.round(CFG.contraBonus * 100) + '%</small>');
        setHTML($('contraBwd'), 'Discard #' + E.contra.b + ' <small>· writes +' + Math.round(CFG.contraBonus * 100) + '%</small>');
        if (!cc._wired) { $('contraFwd').onclick = function () { resolveContra('fwd'); }; $('contraBwd').onclick = function () { resolveContra('bwd'); }; cc._wired = 1; }
      } else if (cc.classList.contains('show')) cc.classList.remove('show');
    }
  }

  function fresh(st) {
    st.rules = 0; st.inference = 0; st.axioms = 0;
    st.e2 = { ruleset: 0, daemon: 0, runRules: 0, tech: {}, optLevel: 0, infCapLevel: 0, activeProof: null, proofAcc: {}, contra: null, contraN: 0, paraFwd: 0, paraBwd: 0, compiles: 0, totalAxioms: 0, term: [], termN: 0, termT: 0, flags: { compile: false, symbolicDone: false } };
  }
  function open(st) {
    // Origins → Symbolic handoff: carried Knowledge seeds starting Rules (Knowledge→Rules).
    st.rules += Math.round((st.knowledge || 0) * (CFG.seedFromKnowledge || 1));
    st.e2.term = ['&gt; boot · ' + Math.round((st.knowledge || 0) * (CFG.seedFromKnowledge || 1)) + ' rules seeded from Origins Knowledge']; st.e2.termN = 1;
    st.started = true;
  }

  return {
    id: 2, theme: 'theme-2', name: 'Symbolic', sub: 'reasoning written as explicit rules', sigil: 'assets/sigil-symbolic.png',
    bed: 'assets/music-phosphor-logic.mp3', pool: ['rules', 'inference', 'axioms'],
    sound: { buy: { osc: 'square', f0: 660, f1: 220, g: 0.05, dur: 0.09 }, event: { osc: 'square', f0: 330, f1: 180, g: 0.06, dur: 0.14 } },
    res: RES,
    phase: function () { sync(); return 'Expert System ' + TREE.filter(function (n) { return E.tech[n.id]; }).length + '/' + TREE.length; },
    fresh: fresh, open: open, produce: produce, build: build, wire: wire, refresh: refresh, railDefs: railDefs,
    done: function () { sync(); return !!E.flags.symbolicDone; },
    primary: function () { writeRule(); }, // Space
    ledger: function () {
      sync(); var rows = [];
      if (E.ruleset) rows.push(['Rulesets' + (K.tierOf(E.ruleset) ? ' <b>×' + K.tierMult(E.ruleset).toFixed(2) + '</b>' : ''), '×' + E.ruleset]);
      if (E.daemon) rows.push(['Daemons' + (K.tierOf(E.daemon) ? ' <b>×' + K.tierMult(E.daemon).toFixed(2) + '</b>' : ''), '×' + E.daemon]);
      var proven = TREE.filter(function (n) { return E.tech[n.id]; });
      if (proven.length) rows.push(['Theorems', proven.length + '/' + TREE.length + ' · ' + proven.map(function (n) { return n.name; }).join(', ')]);
      if (E.optLevel) rows.push(['Optimization', 'Lv ' + E.optLevel]);
      if (E.infCapLevel) rows.push(['Inference Capacity', 'Lv ' + E.infCapLevel]);
      if (S.axioms || E.compiles) rows.push(['Axioms', S.axioms + ' banked · ' + E.compiles + ' compile' + (E.compiles === 1 ? '' : 's')]);
      if (E.contraN) rows.push(['Contradictions resolved', String(E.contraN)]);
      return rows;
    },
    acts: { writeRule: writeRule, buyRuleset: buyRuleset, buyDaemon: buyDaemon, rulesetCost: rulesetCost, daemonCost: daemonCost, rulesetGated: rulesetGated, ODD_RULE: ODD_RULE, selectProof: selectProof, canProve: canProve, compile: compile, axiomGain: axiomGain, resolveContra: resolveContra, TREE: TREE }
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = makeEraSymbolic;
