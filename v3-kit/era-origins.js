/* ============================================================================
   ERA MODULE — Origins (era 1). Ported from emergence-v3.html (the Cody-validated
   slice) onto the shared shell + KIT. Economy is faithful; only re-homed:
     backbone resources (marks/ore/knowledge/metal/silicon) live at S top-level;
     Origins-private state lives on S.e1; HUE/ICON/flavor come from the shared RES.
   Factory: makeEraOrigins(shell) -> era module object (see KIT.md interface).
   ============================================================================ */
function makeEraOrigins(shell) {
  var K = shell.KIT, $ = K.$, fmt = K.fmt, esc = K.esc, setTxt = K.setTxt, setHTML = K.setHTML, setDis = K.setDis;
  var S = shell.S, CFG = shell.CFG.e1;

  /* ---- resources this era introduces (merged into the shared RES registry) ---- */
  var RES = {
    marks: { hue: '#e6d2a4', icon: 'assets/icon-marks.png', flavor: 'The first attempt to hold a thought in place.' },
    ore: { hue: '#c08552', icon: 'assets/icon-ore.png', flavor: 'The world before we reshaped it.' },
    knowledge: { hue: '#e0a93f', icon: 'assets/icon-knowledge.png', flavor: 'Marks made meaningful.' },
    metal: { hue: '#ef9f56', icon: 'assets/icon-ingot.png', flavor: 'Stone, disciplined by fire.' },
    silicon: { hue: '#a9d8ce', icon: 'assets/icon-silicon.png', flavor: 'Sand, taught to carry thought.' }
  };
  var ICON = {
    scribe: 'assets/icon-scribe.png', miner: 'assets/icon-miner.png', scriptorium: 'assets/icon-scriptorium.png',
    smelter: 'assets/icon-crucible.png', foundry: 'assets/icon-foundry.png'
  };
  var HUE = { marks: RES.marks.hue, ore: RES.ore.hue, knowledge: RES.knowledge.hue, metal: RES.metal.hue, silicon: RES.silicon.hue };

  var DISCO = [
    { id: 'tally', name: 'Tally Marks', res: 'marks', cost: 6, req: [], flavor: 'A notch for each thing worth counting.', eff: 'Inscribing by hand is twice as productive.' },
    { id: 'scribe', name: 'The Scribe', res: 'marks', cost: 20, req: ['tally'], flavor: 'Hands trained to the work.', eff: '+Marks · unlocks the Scribe (automates Marks).', fn: function () { E.flags.canScribe = true; } },
    { id: 'stoneworking', name: 'Stoneworking', res: 'marks', cost: 38, req: ['tally'], flavor: 'The first deliberate reshaping of the world.', eff: '+Ore · unlocks Quarrying and Miners.', fn: function () { E.flags.o_materials = true; } },
    { id: 'apprenticeship', name: 'Apprenticeship', costs: { marks: 277, ore: 315 }, req: ['scribe', 'stoneworking'], flavor: 'A craft taught, not stumbled into.', eff: 'Scribes and Miners work 50% faster.' },
    { id: 'clayTablets', name: 'Clay Tablets', res: 'marks', cost: 110, req: ['scribe', 'stoneworking'], reqRes: { ore: 15 }, flavor: 'Something firmer than memory.', eff: '+Knowledge · unlocks the Scriptorium (Marks→Knowledge).', fn: function () { E.flags.o_scriptorium = true; } },
    { id: 'kiln', name: 'The Kiln', res: 'ore', cost: 110, req: ['clayTablets'], reqRes: { knowledge: 30 }, flavor: 'Captured fire.', eff: '+Metal · unlocks the Smelter (Ore→Metal). Bronze Age.', fn: function () { E.flags.o_smelter = true; E.age = 2; } },
    { id: 'alphabet', name: 'The Alphabet', res: 'knowledge', cost: 120, req: ['clayTablets'], flavor: 'Signs that can spell anything.', eff: 'Scriptoria work 60% faster.' },
    { id: 'bronzeCasting', name: 'Bronze Casting', res: 'metal', cost: 90, req: ['kiln'], flavor: 'Let the mold decide its shape.', eff: 'Smelters work 60% faster.' },
    { id: 'wheel', name: 'The Wheel', res: 'ore', cost: 130, req: ['kiln'], flavor: 'The load that once broke backs now rolls.', eff: 'Miners +80% Ore — Scribes 20% slower.' },
    { id: 'numerals', name: 'Numerals', res: 'knowledge', cost: 520, req: ['alphabet'], flavor: 'Number slips free of what it counts.', eff: 'Every converter works 30% faster.' },
    { id: 'theFoundry', name: 'The Foundry', res: 'knowledge', cost: 780, req: ['numerals'], reqRes: { metal: 230 }, flavor: 'Knowledge and matter, fused.', eff: '+Silicon · unlocks the Foundry (Metal+Knowledge→Silicon). Silicon Age.', fn: function () { E.flags.o_foundry = true; E.age = 3; } },
    { id: 'glassmaking', name: 'Glassmaking', res: 'metal', cost: 430, req: ['theFoundry'], flavor: 'Sand taught to hold the light.', eff: 'Foundries run 50% faster.' }
  ];
  var DMAP = {}; DISCO.forEach(function (n) { DMAP[n.id] = n; });

  var BUYS = {
    scribe: { res: 'marks', base: CFG.scribeCost, growth: CFG.scribeGrowth }, miner: { res: 'ore', base: CFG.minerCost, growth: CFG.minerGrowth },
    scriptorium: { res: 'marks', base: CFG.scriptoriumCost, growth: CFG.scriptoriumGrowth }, smelter: { res: 'ore', base: CFG.smelterCost, growth: CFG.smelterGrowth },
    foundry: { res: 'metal', base: CFG.foundryCost, growth: CFG.foundryGrowth }, refine: { res: 'ore', base: CFG.refineBase, growth: CFG.refineGrowth }
  };
  var REWARD = { rec: '+5% the Record, forever', forge: '+5% the Forge, forever', free: 'hands: +2 Scribes & Miners' };

  var E; // shorthand for S.e1, refreshed each entry point (S identity is stable but be safe)
  function sync() { E = S.e1; }

  /* ---------- derived rates (ported oStats) ---------- */
  function oStats() {
    var d = E.disco;
    var inscribe = CFG.inscribeBase, quarry = CFG.quarryBase, scrR = CFG.scriptoriumRate, smR = CFG.smelterRate, foR = CFG.foundryRate;
    var scribeY = CFG.scribeYield, minerY = CFG.minerYield;
    if (d.tally) inscribe *= 2;
    if (d.apprenticeship) { scribeY *= 1.5; minerY *= 1.5; }
    if (d.alphabet) scrR *= 1.6;
    if (d.bronzeCasting) smR *= 1.6;
    if (d.wheel) { minerY *= 1.8; quarry *= 1.8; scribeY *= 0.8; inscribe *= 0.8; }
    if (d.numerals) { scrR *= 1.3; smR *= 1.3; foR *= 1.3; }
    if (d.glassmaking) foR *= 1.5;
    var lv = E.lever;
    var recM = (CFG.leverFloor + CFG.leverSwing * lv) * (1 + CFG.commBonus * E.commRec);
    var fge = (CFG.leverFloor + CFG.leverSwing * (1 - lv)) * (1 + CFG.commBonus * E.commForge);
    inscribe *= recM; scribeY *= recM; quarry *= fge; minerY *= fge;
    var g = (1 + E.refine * CFG.refineBonus);
    return { inscribe: inscribe * g, quarry: quarry * g, scribeY: scribeY * g, minerY: minerY * g, scrR: scrR * g, smR: smR * g, foR: foR * g };
  }

  /* ---------- production ---------- */
  function produce(dt) {
    sync(); var os = oStats();
    if (E.scribe > 0) { var a = E.scribe * os.scribeY * dt; S.marks += a; K.fIn('marks', a); }
    if (E.miner > 0) { var b = E.miner * os.minerY * dt; S.ore += b; K.fIn('ore', b); }
    if (E.scriptorium > 0 && !E.paused.scriptorium) {
      var out = Math.min(S.marks, E.scriptorium * os.scrR * dt);
      var up = out * CFG.scriptoriumUpkeep; if (up > S.ore) out *= (up > 0 ? S.ore / up : 0);
      S.marks -= out; S.ore -= out * CFG.scriptoriumUpkeep; S.knowledge += out;
      K.fOut('marks', out); K.fOut('ore', out * CFG.scriptoriumUpkeep); K.fIn('knowledge', out);
    }
    if (E.smelter > 0 && !E.paused.smelter) {
      var out2 = Math.min(S.ore, E.smelter * os.smR * dt);
      var up2 = out2 * CFG.smelterUpkeep; if (up2 > S.knowledge) out2 *= (up2 > 0 ? S.knowledge / up2 : 0);
      S.ore -= out2; S.knowledge -= out2 * CFG.smelterUpkeep; S.metal += out2;
      K.fOut('ore', out2); K.fOut('knowledge', out2 * CFG.smelterUpkeep); K.fIn('metal', out2);
    }
    if (E.foundry > 0 && !E.paused.foundry) {
      var c = Math.min(S.metal, S.knowledge, E.foundry * os.foR * dt); S.metal -= c; S.knowledge -= c; S.silicon += c;
      K.fOut('metal', c); K.fOut('knowledge', c); K.fIn('silicon', c);
    }
    // commissions — live play only (K.MUTE = offline catch-up; timed offers freeze, they don't cycle silently)
    if (!K.MUTE && E.flags.o_smelter && E.flags.o_scriptorium && !E.done) {
      if (E.comm) { E.comm.t -= dt; if (E.comm.t <= 0) { E.comm = null; E.commCool = CFG.commCool; K.toast('THE CARAVAN MOVES ON', 'The commission lapsed. Another will come.', 'event'); shell.requestRender(); } }
      else {
        E.commCool -= dt; if (E.commCool <= 0) {
          var cdef = CFG.comms[E.commN % CFG.comms.length]; E.commN++;
          var cap = { marks: E.scribe * os.scribeY, ore: E.miner * os.minerY, metal: E.smelter * os.smR * 0.5, knowledge: E.scriptorium * os.scrR * 0.5 };
          var need = Math.ceil(Math.max(cdef.base, (cap[cdef.res] || 0) * 45));
          E.comm = { i: CFG.comms.indexOf(cdef), res: cdef.res, need: need, t: CFG.commDur };
          K.toast('A COMMISSION ARRIVES', cdef.name + ': <b>' + fmt(need) + ' ' + cdef.res + '</b>. Fulfilling it boosts a craft permanently.', 'event'); shell.requestRender();
        }
      }
    }
  }

  /* ---------- buy / disco / commission / fabricate ---------- */
  var unitCost = function (k) { return Math.floor(BUYS[k].base * Math.pow(BUYS[k].growth, E[k])); };
  var canBuy = function (k) { return S[BUYS[k].res] >= unitCost(k); };
  function buy(k) { sync(); if (!canBuy(k)) return; S[BUYS[k].res] -= unitCost(k); E[k]++; K.rec('buy:' + k); K.playSound('buy'); shell.refresh(); }

  var discoVisible = function (n) { return n.req.every(function (r) { return E.disco[r]; }); };
  function canDisco(n) {
    if (E.disco[n.id] || !discoVisible(n)) return false;
    if (n.reqRes) { for (var k in n.reqRes) if (S[k] < n.reqRes[k]) return false; }
    if (n.costs) { for (var j in n.costs) if (S[j] < n.costs[j]) return false; return true; }
    return S[n.res] >= n.cost;
  }
  function doDisco(n) {
    sync(); if (!canDisco(n)) return;
    if (n.costs) { for (var k in n.costs) S[k] -= n.costs[k]; } else S[n.res] -= n.cost;
    E.disco[n.id] = true; if (n.fn) n.fn(); K.rec('disco:' + n.id);
    K.toast('DISCOVERED · ' + n.name, '<i>' + n.flavor + '</i><br>' + n.eff);
    shell.requestRender();
  }

  function fulfillComm() {
    sync(); var c = E.comm; if (!c || S[c.res] < c.need) return; var def = CFG.comms[c.i];
    S[c.res] -= c.need; E.comm = null; E.commCool = CFG.commCool; E.commDone++;
    if (def.reward === 'rec') { E.commRec++; K.toast('COMMISSION FULFILLED', def.flavor + '<br>The Record gains <b>+' + Math.round(CFG.commBonus * 100) + '%</b>, permanently.'); }
    else if (def.reward === 'forge') { E.commForge++; K.toast('COMMISSION FULFILLED', def.flavor + '<br>The Forge gains <b>+' + Math.round(CFG.commBonus * 100) + '%</b>, permanently.'); }
    else { E.scribe += 2; E.miner += 2; K.toast('COMMISSION FULFILLED', def.flavor + '<br>They send <b>hands</b>: +2 Scribes, +2 Miners.'); }
    K.rec('comm:' + def.id); K.playSound('buy'); shell.requestRender();
  }
  function declineComm() { sync(); if (!E.comm) return; E.comm = null; E.commCool = CFG.commCool; K.toast('YOU WAVE THEM ON', 'Another will come.'); shell.requestRender(); }

  function fabricate() {
    sync(); if (S.silicon < CFG.siliconGate || E.done) return; S.silicon -= CFG.siliconGate; E.done = true; K.rec('fabricate');
    K.toast('THE LOGIC MACHINE', 'You built a machine that follows rules you set. The Symbolic era begins.');
    shell.openEra(2); // real handoff (seeds Symbolic with carried Knowledge)
  }

  /* ---------- verbs ---------- */
  function inscribe(ev) {
    sync(); var g = oStats().inscribe; S.marks += g; S.started = true; K.playSound('buy');
    if (ev && ev.currentTarget) { var r = ev.currentTarget.getBoundingClientRect(); K.floatNum('+' + fmt(g), HUE.marks, r.right - 40, r.top + 10); }
    shell.refresh();
  }
  function quarry(ev) {
    sync(); var g = oStats().quarry; S.ore += g; S.started = true; K.playSound('buy');
    if (ev && ev.currentTarget) { var r = ev.currentTarget.getBoundingClientRect(); K.floatNum('+' + fmt(g), HUE.ore, r.right - 40, r.top + 10); }
    shell.refresh();
  }

  /* ---------- board builders ---------- */
  var RAIL = [
    ['marks', 'Marks', function () { return true; }], ['ore', 'Ore', function () { return E.flags.o_materials; }], ['knowledge', 'Knowledge', function () { return E.flags.o_scriptorium; }],
    ['metal', 'Metal', function () { return E.flags.o_smelter; }], ['silicon', 'Silicon', function () { return E.flags.o_foundry; }]
  ];
  function railDefs() { sync(); return RAIL; }

  function node1(key, name, tip) { return K.node(key, name, tip, { icon: ICON[key], pausable: true }); }

  function buildLanes() {
    var h = '';
    h += '<div class="lane"><div class="lane-lab">The Record · Marks become Knowledge<div class="ldash"></div></div><div class="pipe">';
    h += K.stock('marks', 'Marks');
    if (E.flags.o_scriptorium) { h += '<div class="seg">' + K.connector('marks') + node1('scriptorium', 'Scriptorium', '<i>Where marks are ordered and made to mean something.</i><br>Marks (+ a little Ore) → Knowledge. Pausable.') + K.connector('knowledge') + K.stock('knowledge', 'Knowledge') + '</div>'; }
    h += '</div>';
    if (E.flags.canScribe) h += '<div class="auto" id="auto-scribe" data-tip="' + esc('<i>A trained hand that never tires.</i><br>Automates Marks.') + '"><img src="' + ICON.scribe + '"><span class="an">Scribe <span class="ncount" id="cnt-scribe"></span></span><span class="ar" id="ar-scribe"></span><button class="buy abuy" id="buy-scribe"></button></div>';
    h += '</div>';
    if (E.flags.o_materials) {
      h += '<div class="lane"><div class="lane-lab">The Forge · Ore becomes Metal, then Silicon<div class="ldash"></div></div><div class="pipe">';
      h += K.stock('ore', 'Ore');
      if (E.flags.o_smelter) { h += '<div class="seg">' + K.connector('ore') + node1('smelter', 'Smelter', '<i>Fire coaxes metal out of stone.</i><br>Ore (+ a little Knowledge) → Metal. Pausable.') + K.connector('metal') + K.stock('metal', 'Metal') + '</div>'; }
      if (E.flags.o_foundry) { h += '<div class="seg">' + K.connector('metal') + node1('foundry', 'Foundry', '<i>A recipe and a furnace.</i><br>Metal + Knowledge → Silicon. Pausable.') + K.connector('silicon') + K.stock('silicon', 'Silicon') + '</div>'; }
      h += '</div>';
      h += '<div class="auto" id="auto-miner" data-tip="' + esc('<i>Picks against the rock, hour after hour.</i><br>Automates Ore.') + '"><img src="' + ICON.miner + '"><span class="an">Miner <span class="ncount" id="cnt-miner"></span></span><span class="ar" id="ar-miner"></span><button class="buy abuy" id="buy-miner"></button></div>';
      h += '</div>';
    }
    return h;
  }

  function buildResearchBody() {
    var vis = DISCO.filter(function (n) { return discoVisible(n) && !E.disco[n.id]; });
    var have = DISCO.filter(function (n) { return E.disco[n.id]; }).length;
    var h = '<div class="rsec">Tablets of knowing — kept forever (' + have + '/' + DISCO.length + ')</div>';
    if (!vis.length) h += '<div class="locked" style="text-align:center">All current research made. Keep building to reveal more.</div>';
    vis.forEach(function (n) { h += '<div class="disco" id="disco-' + n.id + '" data-tip="' + esc('<i>' + n.flavor + '</i>') + '"><img src="' + (ICON[n.id] || 'assets/era1-sigil.png') + '"><div class="di"><div class="dn">' + n.name + '</div><div class="de">' + n.eff + '</div><button class="buy dbuy" id="dbuy-' + n.id + '"></button></div></div>'; });
    return { html: h, vis: vis };
  }

  // build() returns the full board HTML (verbs | pipeline | goal + standing + event card)
  function build() {
    sync();
    var h = '';
    h += '<div class="col-verbs"><div class="col-head">Your hands</div>' +
      '<button class="verb marks" id="inscribe"><span class="vname">Inscribe a mark</span><span class="vyield" id="inscribeY"></span></button>' +
      '<button class="verb ore" id="quarry" style="display:' + (E.flags.o_materials ? 'flex' : 'none') + '"><span class="vname">Quarry ore</span><span class="vyield" id="quarryY"></span></button>' +
      '<button class="side-btn" id="researchBtn"><img src="assets/era1-sigil.png" alt="">RESEARCH<span class="badge" id="researchBadge">1</span></button></div>';
    h += '<div class="col-pipe"><div class="col-head">The work — sources flow into converters, converters into the next thing</div><div id="lanes">' + buildLanes() + '</div></div>';
    h += '<div class="col-goal"><div class="col-head">The goal</div><div class="goal" id="goal">' +
      '<img class="lm" src="assets/logic-machine.png" alt=""><div class="gname">The Logic Machine</div>' +
      '<div class="gsub" id="goalSub">first, learn to make Silicon</div>' +
      '<div class="meter"><i id="siMeter"></i></div><div class="meter-lab" id="siLab"></div>' +
      '<button class="fab" id="fabricate" disabled>FABRICATE</button></div></div>';
    // standing decisions
    h += '<div class="standing" id="standing" style="display:' + ((E.flags.o_scriptorium || E.flags.o_materials) ? 'grid' : 'none') + '">' +
      '<div class="ctrl" id="handsCtrl" style="display:' + (E.flags.o_materials ? 'block' : 'none') + '">' +
      '<div class="ctrl-lab" data-tip="' + esc('<i>One workforce, split between the crafts.</i><br>Lean toward the craft that is starving; the other slows. Centered is even.') + '">The Hands · one workforce, split</div>' +
      '<div class="lever"><span style="color:var(--marks,#e6d2a4)">THE RECORD</span><input type="range" id="hands" min="0" max="100" value="' + Math.round((1 - E.lever) * 100) + '"><span style="color:var(--metal,#ef9f56)">THE FORGE</span></div></div>' +
      '<div class="ctrl" id="refineCtrl" style="display:' + (E.flags.o_scriptorium ? 'block' : 'none') + '">' +
      '<div class="ctrl-lab">Refine the craft · spend surplus Ore</div>' +
      '<div class="refine-row" data-tip="' + esc('<i>Practice compounds. Sink your surplus back into the work.</i><br>+5% to ALL Origins production per level. Repeatable.') + '">' +
      '<div class="rinfo"><div class="rname">Refine <span class="ncount" id="refineN"></span></div><div class="reff" id="refineEff"></div></div>' +
      '<button class="buy" id="refineBuy"></button></div></div></div>';
    // event card
    h += '<div class="card-event" id="commission"><img src="assets/era1-sigil.png" alt="" style="width:34px;height:34px;object-fit:contain">' +
      '<div class="cm-i"><div class="cm-name" id="cmName"></div><div class="cm-need" id="cmNeed"></div><div class="cm-timer"><i id="cmTimer"></i></div></div>' +
      '<div class="cm-acts"><button class="buy" id="cmYes"></button><button class="buy" id="cmNo">Decline</button></div></div>';
    return h;
  }

  function wire() {
    sync();
    if ($('inscribe')) $('inscribe').onclick = inscribe;
    if ($('quarry')) $('quarry').onclick = quarry;
    if ($('fabricate')) $('fabricate').onclick = fabricate;
    if ($('researchBtn')) $('researchBtn').onclick = function () { $('research').classList.toggle('show'); };
    if ($('hands')) $('hands').oninput = function (e) { E.lever = 1 - (+e.target.value / 100); };
    if ($('refineBuy')) $('refineBuy').onclick = function () { buy('refine'); };
    ['scriptorium', 'smelter', 'foundry', 'scribe', 'miner'].forEach(function (k) {
      var b = $('buy-' + k); if (b) b.onclick = function () { buy(k); };
      var p = $('pause-' + k); if (p) p.onclick = function () { E.paused[k] = !E.paused[k]; K.playSound('buy'); shell.requestRender(); };
    });
    // research drawer body
    var rb = buildResearchBody(); setHTML($('researchBody'), rb.html);
    rb.vis.forEach(function (n) { var b = $('dbuy-' + n.id); if (b) b.onclick = function () { doDisco(n); }; });
  }

  /* ---------- refresh (per-tick values only) ---------- */
  var costHave = function (k) { return S[k]; };
  function nodeRefresh(key, flows) {
    var nd = $('node-' + key); if (!nd) return;
    setTxt($('cnt-' + key), '×' + E[key]);
    setHTML($('rate-' + key), E[key] > 0 ? flows.map(function (f) { return '<span class="' + (f[0] === '+' ? 'up' : 'dn') + '">' + f[0] + fmt(f[1] * E[key]) + ' ' + f[2] + '</span>'; }).join('') : '<span style="color:var(--dimmer)">not built yet</span>');
    var b = $('buy-' + key); if (b) { setHTML(b, 'Build · ' + K.costHTML([[BUYS[key].res, unitCost(key)]], costHave)); var can = canBuy(key); setDis(b, !can); b.classList.toggle('ok', can); }
    var p = $('pause-' + key); if (p) p.classList.toggle('on', !!E.paused[key]);
    var starved = E[key] > 0 && !E.paused[key] && ((key === 'scriptorium' && S.marks < 0.5) || (key === 'smelter' && S.ore < 0.5) || (key === 'foundry' && (S.metal < 0.5 || S.knowledge < 0.5)));
    var cl = 'node' + (canBuy(key) ? ' can' : '') + (starved ? ' starved' : ''); if (nd.className !== cl) nd.className = cl;
  }
  function autoRefresh(key, yld, res) {
    setTxt($('cnt-' + key), '×' + E[key]); setTxt($('ar-' + key), '+' + fmt(E[key] * yld) + ' ' + res + '/s');
    var b = $('buy-' + key); if (b) { setHTML(b, '+1 · ' + K.costHTML([[BUYS[key].res, unitCost(key)]], costHave)); var can = canBuy(key); setDis(b, !can); b.classList.toggle('ok', can); }
  }
  function refreshResearch() {
    DISCO.forEach(function (n) {
      var b = $('dbuy-' + n.id); if (!b) return;
      var reqs = n.costs ? Object.keys(n.costs).map(function (k) { return [k, n.costs[k]]; }) : [[n.res, n.cost]];
      if (n.reqRes) for (var k in n.reqRes) reqs.push([k, n.reqRes[k]]);
      setHTML(b, 'Discover · ' + K.costHTML(reqs, costHave)); var can = canDisco(n); setDis(b, !can); b.classList.toggle('ok', can);
    });
  }

  function refresh() {
    sync(); var os = oStats();
    setTxt($('inscribeY'), '+' + fmt(os.inscribe) + ' marks'); setTxt($('quarryY'), '+' + fmt(os.quarry) + ' ore');
    ['marks', 'ore', 'knowledge', 'metal', 'silicon'].forEach(function (k) { setTxt($('stk-' + k), fmt(S[k])); K.connGlow(k, {}); });
    nodeRefresh('scriptorium', [['+', os.scrR, 'knowledge'], ['−', os.scrR, 'marks'], ['−', os.scrR * CFG.scriptoriumUpkeep, 'ore']]);
    nodeRefresh('smelter', [['+', os.smR, 'metal'], ['−', os.smR, 'ore'], ['−', os.smR * CFG.smelterUpkeep, 'knowledge']]);
    nodeRefresh('foundry', [['+', os.foR, 'silicon'], ['−', os.foR, 'metal'], ['−', os.foR, 'knowledge']]);
    autoRefresh('scribe', os.scribeY, 'marks'); autoRefresh('miner', os.minerY, 'ore');
    if (E.flags.o_scriptorium) {
      var rb = $('refineBuy'); if (rb) { setHTML(rb, 'Build · ' + K.costHTML([['ore', unitCost('refine')]], costHave)); var can = canBuy('refine'); setDis(rb, !can); rb.classList.toggle('ok', can); }
      setTxt($('refineN'), '×' + E.refine); setTxt($('refineEff'), '+' + Math.round(E.refine * CFG.refineBonus * 100) + '% to all production');
    }
    // event card
    var cm = $('commission');
    if (cm) {
      if (E.comm) {
        if (!cm.classList.contains('show')) cm.classList.add('show'); var def = CFG.comms[E.comm.i];
        setTxt($('cmName'), def.name);
        setHTML($('cmNeed'), 'give <b style="color:' + HUE[E.comm.res] + '">' + fmt(E.comm.need) + ' ' + E.comm.res + '</b> → <b>' + REWARD[def.reward] + '</b>');
        $('cmTimer').style.width = Math.max(0, (E.comm.t / CFG.commDur) * 100) + '%';
        var y = $('cmYes'); setHTML(y, 'Fulfill · ' + K.costHTML([[E.comm.res, E.comm.need]], costHave)); var okc = S[E.comm.res] >= E.comm.need; setDis(y, !okc); y.classList.toggle('ok', okc);
        if (!y._wired) { y.onclick = fulfillComm; $('cmNo').onclick = declineComm; y._wired = 1; }
      } else if (cm.classList.contains('show')) cm.classList.remove('show');
    }
    // goal
    if ($('siMeter')) $('siMeter').style.width = Math.min(100, (S.silicon / CFG.siliconGate) * 100) + '%';
    setTxt($('siLab'), E.flags.o_foundry ? fmt(S.silicon) + ' / ' + CFG.siliconGate + ' silicon' : 'unlock the Foundry to make Silicon');
    var fb = $('fabricate'), ready = S.silicon >= CFG.siliconGate && !E.done; setDis(fb, !ready); setTxt(fb, E.done ? 'FABRICATED ✓' : 'FABRICATE');
    var goalEl = $('goal');
    if (goalEl) {
      goalEl.classList.toggle('ready', ready);
      // the goal glow BUILDS as Silicon fills (exponential — turns on toward the end), then .ready pulses
      var prog = E.flags.o_foundry ? Math.min(1, S.silicon / CFG.siliconGate) : 0;
      var wake = Math.pow(prog, 1.7);
      if (goalEl._wake !== wake) { goalEl.style.setProperty('--wake', wake.toFixed(3)); goalEl._wake = wake; }
    }
    // when ready, the FABRICATE button morphs to the NEXT era's font (Symbolic VT323) — a taste of what's coming
    if (fb) { var ff = ready ? "'VT323', monospace" : ''; if (fb._ff !== ff) { fb.style.fontFamily = ff; fb.style.fontSize = ready ? '20px' : ''; fb.style.letterSpacing = ready ? '0.08em' : ''; fb._ff = ff; } }
    if ($('goalSub')) $('goalSub').textContent = E.flags.o_foundry ? 'reach ' + CFG.siliconGate + ' Silicon' : (E.flags.o_smelter ? 'first, learn to make Silicon (build the Foundry)' : 'first, learn to work materials');
    var canN = DISCO.filter(canDisco).length; var bdg = $('researchBadge'); if (bdg) { setTxt(bdg, String(canN)); bdg.style.display = canN ? 'inline-block' : 'none'; }
    refreshResearch();
  }

  /* ---------- fresh seed ---------- */
  function fresh(st) {
    st.marks = 0; st.ore = 0; st.knowledge = 0; st.metal = 0; st.silicon = 0;
    st.e1 = {
      scribe: 0, miner: 0, scriptorium: 0, smelter: 0, foundry: 0, refine: 0,
      disco: {}, flags: {}, paused: {}, lever: 0.5, age: 1,
      comm: null, commN: 0, commCool: CFG.commCool, commRec: 0, commForge: 0, commDone: 0, done: false
    };
  }

  return {
    id: 1, theme: 'theme-1', name: 'Origins', sub: 'from marks to matter', sigil: 'assets/era1-sigil.png',
    bed: 'assets/music-bone-loam.mp3', pool: ['marks', 'ore', 'knowledge', 'metal', 'silicon'],
    sound: { buy: { osc: 'triangle', f0: 880, f1: 300, g: 0.09, dur: 0.1 } },
    res: RES,
    phase: function () { sync(); return ['', 'Stone Age', 'Bronze Age', 'Silicon Age'][E.age] || 'Stone Age'; },
    fresh: fresh, produce: produce, build: build, wire: wire, refresh: refresh, railDefs: railDefs,
    hasDrawer: true, drawerTitle: 'RESEARCH · one-time discoveries',
    done: function () { sync(); return !!E.done; }
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = makeEraOrigins;
