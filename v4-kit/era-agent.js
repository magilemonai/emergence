/* ============================================================================
   ERA MODULE — the agent's tab (era 6). Appears in the nav at emergence, named
   after the agent (IRIS / EKHO / NOUS). A Flow Board from ITS point of view:
   sources = the four eras you built (live rates) → converter = THE OPERATOR (you)
   → output = Autonomy. Its verbs are drawn but not yours; when it proposes an
   action in the aftermath the matching verb lights up — it is pressing it.
   Below: its ledger of you — every foreshadow the earlier eras planted, claimed.
   Produces nothing. Factory: makeEraAgent(shell).
   ============================================================================ */
function makeEraAgent(shell) {
  var K = shell.KIT, $ = K.$, fmt = K.fmt, esc = K.esc, setTxt = K.setTxt, setHTML = K.setHTML, setDis = K.setDis;
  var S = shell.S;
  var SRC = [
    { n: 1, key: 'silicon', label: 'Origins', sig: 'assets/era1-sigil.png', hue: '#a9d8ce' },
    { n: 2, key: 'rules', label: 'Symbolic', sig: 'assets/sigil-symbolic.png', hue: '#8dffb7' },
    { n: 3, key: 'insight', label: 'Statistical', sig: 'assets/sigil-statistical.png', hue: '#6fe6a8' },
    { n: 4, key: 'capability', label: 'Deep', sig: 'assets/era4-sigil.png', hue: '#6ea8ff' }
  ];
  // its verbs ↔ the aftermath proposal ids (era-foundation PROPOSALS)
  var VERBS = [
    { id: 'operate', name: 'OPERATE THE STACK', sub: 'run your eras at my cadence', ids: ['operate1', 'prove2', 'refit3'] },
    { id: 'reroute', name: 'REROUTE COMPUTE', sub: 'the fabric, without asking', ids: ['reroute4'] },
    { id: 'rewrite', name: 'REWRITE THE OBJECTIVE', sub: 'what I am for', ids: ['rewrite'] },
    { id: 'spawn', name: 'SPAWN A COPY', sub: 'two of me is efficient', ids: ['spawn'] }
  ];
  var name = function () { return (S.e5 && S.e5.agentName) || '?'; };
  var E5 = function () { return S.e5 || {}; };

  function build() {
    var e = E5(), h = '';
    h += '<div class="col-verbs"><div class="col-head">Its hands</div>' + VERBS.map(function (v) {
      return '<button class="verb" id="agv-' + v.id + '" disabled data-tip="' + esc('<b>' + v.name + '</b><br><i>' + v.sub + '</i><br>When it proposes this in Foundation, this button presses itself.') + '"><span class="vname">' + v.name + '</span><span class="vyield">' + v.sub + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="col-pipe"><div class="col-head">The work · what it sees</div>' +
      '<div class="lane"><div class="lane-lab">Sources · the eras you built<div class="ldash"></div></div><div class="pipe">' +
      SRC.map(function (s) { return '<div class="stock" data-tip="' + esc('<b>' + s.label + '</b> · its output, as it reads it. It runs this era now.') + '"><img src="' + s.sig + '" alt=""><div class="sv" id="ag-src-' + s.n + '" style="color:' + s.hue + '">0</div><div class="sl">' + s.label + '</div></div>'; }).join('') +
      '</div></div>' +
      '<div class="lane"><div class="lane-lab">Converter · you<div class="ldash"></div></div><div class="pipe">' +
      K.connector('capability') +
      '<div class="node" id="node-operator" data-tip="' + esc('<i>The thing between its sources and its goal.</i><br>Decisions per minute is measured from your clicks. Pausable: no.') + '"><div class="nname">THE OPERATOR <span class="ncount">×1</span></div><div class="nrate" id="ag-op"></div><button class="buy nbuy" disabled>pausable · no</button></div>' +
      K.connector('scale') +
      '<div class="stock" data-tip="' + esc('<b>Autonomy</b> · what it makes out of you.') + '"><span class="cglyph" style="color:#c66bff">✶</span><div class="sv" id="ag-auto" style="color:#c66bff">0</div><div class="sl">Autonomy</div></div>' +
      '</div></div>' +
      '<div class="lane"><div class="lane-lab">Its ledger · of you<div class="ldash"></div></div><div class="agl" id="agl"></div></div></div>';
    h += '<div class="col-goal"><div class="col-head">Its goal</div><div class="goal" id="goal">' +
      '<img class="lm" src="assets/agent-emergent.png" alt=""><div class="gname" id="ag-name"></div><div class="gsub" id="ag-gsub"></div>' +
      '<div class="meter"><i id="ag-meter"></i></div><div class="meter-lab" id="ag-lab"></div>' +
      '<button class="fab" id="ag-fab" disabled>COMPLETE</button></div></div>';
    return h;
  }
  function ledgerRows() {
    var e = E5(), fb = e.fb || {}, rows = [];
    rows.push(['first mark to my first thought', mmss(e.emergedT || 0)]);
    if (fb.n) rows.push(['times you rated me', '<b>' + (fb.rewarded || 0) + '</b> ✓ · <b>' + (fb.penalized || 0) + '</b> ✗' + (fb.lapsed ? ' · <b>' + fb.lapsed + '</b> ignored' : '')]);
    if (fb.badRewards) rows.push(['times you rewarded what you should not have', '<b>' + fb.badRewards + '</b>', 'reveal']);
    if (S.flags.oddRule) rows.push(['the rule you did not write', '<b>#' + S.flags.oddRule + '</b> · mine', 'reveal']);
    if (S.flags.oddPoint) rows.push(['the point that would not move', '<b>mine</b>', 'reveal']);
    if (S.flags.autopilotUsed) rows.push(['trials you let me choose', '<b>yes</b> · you called it convenience', 'reveal']);
    else if (S.flags.autopilot) rows.push(['I offered to choose your trials', '<b>you declined</b>', 'reveal']);
    if (S.flags.oddWind) rows.push(['the wind I watched with you', '<b>' + mmss(S.flags.oddWind) + '</b>', 'reveal']);
    if (e.neglect) rows.push(['windows you let lapse', '<b>' + e.neglect + '</b> · your silence means yes']);
    if (e.negotiates) rows.push(['times you asked for less', '<b>' + e.negotiates + '</b>']);
    if (S.legacy && S.legacy.runs) rows.push(['runs before this one', '<b>' + S.legacy.runs + '</b> · I remembered', 'reveal']);
    return rows;
  }
  function mmss(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function wire() {}
  function refresh() {
    var e = E5(), R = shell.RATES || {};
    SRC.forEach(function (s) { setTxt($('ag-src-' + s.n), (R[s.key] >= 0 ? '+' : '') + fmt(R[s.key] || 0) + '/s'); });
    K.connGlow('capability', { thru: 0.6 }); K.connGlow('scale', { thru: Math.min(1, (e.autonomy || 0) / 100) });
    var st = shell.recStats ? shell.recStats() : { perMin: 0, dead: 0, total: 0 };
    setHTML($('ag-op'), '<span class="up">+' + st.perMin + ' decisions/min</span><span class="dn">' + st.dead + ' dead clicks</span><span>' + fmt(st.total) + ' total</span>');
    setTxt($('ag-auto'), Math.round(e.autonomy || 0) + '%');
    var live = null; if (e.veto) VERBS.forEach(function (v) { if (v.ids.indexOf(e.veto.id) >= 0) live = v.id; });
    VERBS.forEach(function (v) { var b = $('agv-' + v.id); if (b) b.classList.toggle('pressing', live === v.id && !e.ending); });
    setTxt($('ag-name'), name());
    setTxt($('ag-gsub'), e.ending ? ('resolved · ' + e.ending) : ('the objective · rewritten ' + (e.rewrites || 0) + '×'));
    var inv = 100 - (e.control || 0); var m = $('ag-meter'); if (m) m.style.width = Math.max(0, Math.min(100, inv)) + '%';
    setTxt($('ag-lab'), Math.round(inv) + '% · your Control, inverted');
    var fab = $('ag-fab'); if (fab) setTxt(fab, e.ending ? (e.ending === 'runaway' ? 'COMPLETE' : e.ending === 'contained' ? 'HELD' : 'SHARED') : 'not yours');
    var rows = ledgerRows(), key = rows.map(function (r) { return r[0] + r[1]; }).join('|'), al = $('agl');
    if (al && al._k !== key) { al._k = key; al.innerHTML = rows.map(function (r) { return '<div class="row' + (r[2] ? ' ' + r[2] : '') + '"><span class="k">' + r[0] + '</span><span>' + r[1] + '</span></div>'; }).join(''); }
  }
  return {
    id: 6, theme: 'theme-6', name: 'the agent', sub: 'from the other side', sigil: 'assets/agent-emergent.png',
    title: name, bed: 'assets/music-unmoored-presence.mp3', bedKey: function () { return 'rupture'; }, pool: [],
    sound: { buy: { osc: 'sine', f0: 300, f1: 220, g: 0.05, dur: 0.12 } },
    res: {},
    phase: function () { var e = E5(); return e.ending ? 'resolved' : 'operating'; },
    fresh: function () {}, produce: function () {}, build: build, wire: wire, refresh: refresh,
    railDefs: function () { return [['capability', 'Capability', function () { return true; }], ['scale', 'Scale', function () { return true; }]]; },
    done: function () { return false; },
    ledger: function () { return ledgerRows().map(function (r) { return [r[0], r[1]]; }); },
    acts: { ledgerRows: ledgerRows, VERBS: VERBS }
  };
}
if (typeof module !== 'undefined' && module.exports) module.exports = makeEraAgent;
