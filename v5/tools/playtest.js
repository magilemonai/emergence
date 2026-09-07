#!/usr/bin/env node
// WO-13 PLAYTEST DRIVER — plays v5/index.html in headless Chrome the way a decent human would: real pointer
// events on the real UI at a human tempo, decisions read off the screen, a screenshot at every era handoff,
// dead-click telemetry with an actionable selector list, and a run.json of the timings.
//   node v5/tools/playtest.js [--speed 3] [--out /tmp/v5-playtest] [--max 45] [--file v5/index.html]
// The shell has no dev speed knob, so --speed is honoured by ticking the sim extra between human actions.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SPEED = +arg('--speed', 1), OUT = arg('--out', '/tmp/v5-playtest'), MAXMIN = +arg('--max', 45);
const URL_BASE = 'file://' + path.resolve(arg('--file', 'v5/index.html'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9461 + Math.floor(Math.random() * 40);
const STEP = 380;                                   // ms between human actions
const PHASE = { vision: 0, language: 2.094, reasoning: 4.189 };
const RUNS = ['vision', 'language', 'reasoning'];
const TRI = { vision: { x: 0.5, y: 0.08 }, language: { x: 0.08, y: 0.9 }, reasoning: { x: 0.92, y: 0.9 } };
// what a player can press. The surface's verbs are drawn and no longer yours, so they are not on this list.
const ACTIONABLE = ['.verb', '.plate .buy', '.plate .pause', '.side-btn', '.dr-x', '.d-tile .buy', '.e2-th .buy',
  '.e2-contra .ca button', '.e3-seg', '.e3-card .buy', '.a-tile .buy', '.c-tile .buy', '.d-tool', '.fab',
  '.fb-b.yes', '.fb-b.no', '.cm-acts .buy'];

fs.mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,800',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--allow-file-access-from-files',
  '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const t0 = Date.now(); const LOG = []; let shotN = 0; const beats = {};
const log = (s) => { const line = '[' + ((Date.now() - t0) / 1000).toFixed(0).padStart(4) + 's] ' + s; LOG.push(line); console.log(line); fs.writeFileSync(path.join(OUT, 'log.md'), LOG.join('\n')); };
const mmss = (sec) => { const s = Math.max(0, Math.round(sec || 0)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

(async () => {
  let target;
  for (let i = 0; i < 80; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); target = l.find((t) => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch (e) { }
    await sleep(250);
  }
  if (!target) { console.error('no devtools target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(target.webSocketDebuggerUrl); let id = 0; const pending = new Map(); const onEvent = {};
  const send = (m, p = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    else if (m.method && onEvent[m.method]) onEvent[m.method](m.params);
  });
  await new Promise((r) => ws.addEventListener('open', r));
  const errors = [];
  onEvent['Runtime.consoleAPICalled'] = (p) => { if (p.type === 'error') { const s = (p.args || []).map((a) => a.value ?? a.description ?? a.type).join(' '); errors.push(s); log('CONSOLE ERROR: ' + s); } };
  onEvent['Runtime.exceptionThrown'] = (p) => { const s = 'EXCEPTION ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text); errors.push(s); log(s); };
  await send('Page.enable'); await send('Runtime.enable');

  const ev = async (x) => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) { const s = 'EVAL ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text); errors.push(s); log(s + ' :: ' + x.slice(0, 70)); }
    return r.result?.value;
  };
  const load = async (hash) => {
    const blank = new Promise((r) => { onEvent['Page.loadEventFired'] = r; });
    await send('Page.navigate', { url: 'about:blank' }); await blank;
    const loaded = new Promise((r) => { onEvent['Page.loadEventFired'] = r; });
    await send('Page.navigate', { url: URL_BASE + (hash || '') }); await loaded; await sleep(1200);
  };
  const shot = async (name) => {
    const f = path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png');
    const s = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(f, Buffer.from(s.data, 'base64'));
    log('shot ' + path.basename(f));
  };
  const beat = async (name) => { if (beats[name]) return; beats[name] = true; await shot(name); };

  /** the signature a live click moves: the action log, the drawer, the settings, the Focus, the buy size */
  const SIG = `(function(){var V=window.__V5,d=document,dr=d.querySelector(".drawer");
    return [V.sim.state.log.length, dr?dr.className:"", V.hud.settingsOpen?1:0,
      (V.sim.state.eras[3]||{}).focus||"", V.buy.max?"M":String(V.buy.n)].join("|");})()`;

  const dead = []; let clicks = 0;
  /** a real click at the element's centre; a pressable element that moves nothing is a dead click */
  async function click(sel, nth, why) {
    const box = await ev(`(function(){var l=document.querySelectorAll(${JSON.stringify(sel)}),el=l[${nth || 0}];if(!el)return null;
      var b=el.getBoundingClientRect(),cs=getComputedStyle(el);
      if(b.width<2||b.height<2||el.disabled||cs.pointerEvents==='none'||cs.visibility==='hidden'||+cs.opacity===0)return {no:1};
      if(b.top<0||b.bottom>innerHeight||b.left<0||b.right>innerWidth)return {off:1,y:Math.round(b.top)};
      return {x:b.left+b.width/2,y:b.top+b.height/2};})()`);
    if (!box) return false;
    if (box.off) { log('wanted ' + sel + (why ? ' (' + why + ')' : '') + ' but it sits off-screen at y ' + box.y); return false; }
    if (box.no) return false;
    const watched = ACTIONABLE.indexOf(sel) >= 0;
    const before = watched ? await ev(SIG) : null;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    clicks++;
    if (watched) {
      await sleep(70);
      const after = await ev(SIG);
      if (before === after) dead.push({ sel: sel, nth: nth || 0, why: why || '', era: await ev('window.__V5.sim.state.era'), t: +(await ev('window.__V5.sim.state.t')).toFixed(1) });
    }
    return true;
  }
  /** the first enabled element of a set whose label matches, clicked */
  async function clickText(sel, re, why) {
    const i = await ev(`(function(){var l=document.querySelectorAll(${JSON.stringify(sel)});for(var i=0;i<l.length;i++){if(l[i].disabled)continue;if(${re}.test((l[i].textContent||"")))return i;}return -1;})()`);
    if (i < 0) return false;
    return click(sel, i, why);
  }
  /** the mixer: press, move, release at the point those three weights name inside the triangle */
  async function mix(w) {
    const sum = w.vision + w.language + w.reasoning || 1;
    let fx = 0, fy = 0;
    for (const k of RUNS) { fx += (w[k] / sum) * TRI[k].x; fy += (w[k] / sum) * TRI[k].y; }
    const r = await ev('(function(){var m=document.querySelector(".mixer");if(!m)return null;var b=m.getBoundingClientRect();return {l:b.left,t:b.top,w:b.width,h:b.height};})()');
    if (!r || r.w < 10) return false;
    const x = r.l + r.w * fx, y = r.t + r.h * fy;
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x, y: y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x, y: y, button: 'left' });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x, y: y, button: 'left', clickCount: 1 });
    clicks++;
    return true;
  }

  /* ---------- the snapshot the driver decides from ---------- */
  const snap = () => ev(`(function(){var V=window.__V5,S=V.sim.state,d=document,q=function(s){return d.querySelectorAll(s).length;};
    var enabled=function(s){var l=d.querySelectorAll(s),n=0;for(var i=0;i<l.length;i++)if(!l[i].disabled&&l[i].textContent.trim())n++;return n;};
    var live=function(el){if(!el||el.disabled||!el.textContent.trim())return false;var b=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return b.width>2&&b.height>2&&+cs.opacity>0.1&&cs.visibility!=='hidden'&&cs.pointerEvents!=='none';};
    var firstOn=function(s){var l=d.querySelectorAll(s);for(var i=0;i<l.length;i++)if(live(l[i]))return i;return -1;};
    var o={era:S.era,maxEra:S.maxEra,t:S.t,emerged:!!S.flags.emerged,stocks:S.stocks,
      counts:{},plates:(function(){var out=[],l=d.querySelectorAll(".plate");for(var i=0;i<l.length;i++){var b=l[i].querySelector(".buy"),n=l[i].querySelector(".p-name");out.push({name:n?n.textContent:"",ok:live(b)});}return out;})(),
      names:(function(){var m={};for(var k in S.nodes)m[k]=S.nodes[k].name;return m;})(),
      dom:{plateBuy:firstOn(".plate .buy"),researchHot:!!d.querySelector(".side-btn .sb-n.hot"),dTile:firstOn(".drawer .d-tile .buy"),drawer:!!d.querySelector(".drawer.show"),
        fab:!(d.querySelector(".fab")||{disabled:true}).disabled, seg:q(".e3-seg"), segOn:(function(){var l=d.querySelectorAll(".e3-seg");for(var i=0;i<l.length;i++)if(l[i].className.indexOf("on")>=0)return i;return -1;})(),
        card:firstOn(".e3-card .buy"), aTile:firstOn(".a-tile .buy"), cTile:firstOn(".c-tile .buy"), tool:firstOn(".d-tool"),
        side:q(".side-btn"), th:firstOn(".e2-th .buy"), contra:!!d.querySelector(".e2-contra.show"), comm:!!d.querySelector(".comm.show"),
        fbYes:!(d.querySelector(".fb-b.yes")||{disabled:true}).disabled, mixer:q(".mixer"), verbs:q(".verb"),
        respond:(function(){var l=d.querySelectorAll("#hud button"),o=[];for(var i=0;i<l.length;i++)if(!l[i].disabled&&/approve|negotiate|veto/i.test(l[i].textContent))o.push(i);return o.length;})()},
      e:{}};
    ['scribe','miner','scriptorium','smelter','foundry','ruleset','daemon','dataset','model','node'].forEach(function(k){var n=S.nodes[k];o.counts[k]=n?n.count:0;});
    for (var i=1;i<=6;i++) if (S.eras[i]) o.e[i]=S.eras[i];
    return o;})()`);

  /** buy the first node in this priority list that the board says is affordable and under its cap */
  async function build(s, order, caps) {
    for (const id of order) {
      const cap = caps && caps[id];
      if (cap !== undefined && (s.counts[id] || 0) >= cap) continue;
      const name = s.names[id];
      const i = s.plates.findIndex((p) => p.name === name && p.ok);
      if (i >= 0) return click('.plate .buy', i, 'build ' + id);
    }
    return false;
  }

  /* ---------- boot ---------- */
  await load('');
  await ev('localStorage.removeItem("emergence_v5"); localStorage.removeItem("emergence_v5_legacy");');
  await load('');
  log('start · speed ' + SPEED + '× · ' + URL_BASE);
  if (SPEED > 1) log('the shell has no dev speed knob, so the extra time is ticked into the sim between actions');
  await beat('boot');

  const eraAt = {}; let lastEra = 0, loops = 0, cooling = false, emergedAt = null, carry = 0;
  while ((Date.now() - t0) / 60000 < MAXMIN) {
    const s = await snap();
    if (!s) { await sleep(STEP); continue; }
    loops++;
    if (s.era !== lastEra) {
      lastEra = s.era;
      if (eraAt[s.era] === undefined) eraAt[s.era] = +s.t.toFixed(1);
      log('era ' + s.era + ' at game ' + mmss(s.t) + ' · dead clicks ' + dead.length);
      await sleep(900);                                  // let the title card play, the way a player waits
      await beat('era' + s.era);
    }
    if (loops % 12 === 0) log('era ' + s.era + ' · game ' + mmss(s.t) + ' · ' + ['scribe', 'miner', 'scriptorium', 'smelter', 'foundry', 'ruleset', 'dataset', 'node'].map((k) => k[0] + (s.counts[k] || 0)).join(' ') + ' · si ' + Math.round(s.stocks.silicon || 0) + ' kn ' + Math.round(s.stocks.knowledge || 0) + ' mk ' + Math.round(s.stocks.marks || 0) + ' or ' + Math.round(s.stocks.ore || 0) + ' hot ' + (s.dom.researchHot ? 1 : 0) + ' drw ' + (s.dom.drawer ? 1 : 0) + ' tile ' + s.dom.dTile + ' side ' + s.dom.side + ' clicks ' + clicks);
    if (s.emerged && !emergedAt) { emergedAt = s.t; log('EMERGENCE at game ' + mmss(s.t)); await sleep(1200); await beat('rupture'); }

    /* -------- Origins -------- */
    if (s.era === 1 && !s.emerged) {
      const E = s.e[1] || {};
      if (!E.done) {
        if (s.dom.comm) { await beat('commission'); await clickText('.cm-acts .buy', '/yes|fulfil|accept|\\u2713/i', 'commission'); }
        if (s.dom.drawer && s.dom.dTile >= 0) { await click('.drawer .d-tile .buy', s.dom.dTile, 'discover'); await beat('research'); }
        else if (s.dom.drawer) await click('.dr-x', 0, 'close drawer');
        else if (s.dom.researchHot) await click('.side-btn', 0, 'research');
        await build(s, ['foundry', 'smelter', 'scriptorium', 'miner', 'scribe'], {
          scribe: 30, miner: 30,
          scriptorium: Math.max(2, s.counts.scribe), smelter: Math.max(2, s.counts.miner),
          foundry: Math.max(1, Math.min(s.counts.scriptorium, s.counts.smelter))
        });
        const n = s.counts.scribe < 3 ? 3 : (s.counts.scribe < 8 ? 2 : 1);
        for (let i = 0; i < n; i++) await click('.verb', 0, 'inscribe');
        if (s.dom.verbs > 1) await click('.verb', 1, 'quarry');
        if (s.dom.fab) { await beat('origins-ready'); await click('.fab', 0, 'fabricate'); }
      }
    }
    /* -------- Symbolic -------- */
    else if (s.era === 2 && !s.emerged) {
      if (s.dom.contra) { await beat('contradiction'); await click('.e2-contra .ca button', 0, 'resolve'); }
      if (s.dom.th >= 0) await click('.e2-th .buy', s.dom.th, 'aim');
      await build(s, ['ruleset', 'daemon'], { ruleset: 30, daemon: 20 });
      for (let i = 0; i < 4; i++) await click('.verb', 0, 'write');
      if (s.dom.verbs > 1) await click('.verb', 1, 'compile');
      if (s.dom.fab) await click('.fab', 0, 'advance');
    }
    /* -------- Statistical -------- */
    else if (s.era === 3 && !s.emerged) {
      const E = s.e[3] || {};
      if (s.dom.card >= 0 && (s.stocks.data || 0) > 400) await click('.e3-card .buy', s.dom.card, 'fund');
      await build(s, ['model', 'dataset'], { model: 16, dataset: 22 });
      const nM = Object.keys(E.methods || {}).length;
      const want = nM < 4 && (E.survey || 0) < 95 && (s.stocks.data || 0) < 400 ? 'explore' : ((E.gap || 0) > 0.18 ? 'generalize' : 'fit');
      const idx = await ev(`(function(){var l=document.querySelectorAll(".e3-seg");for(var i=0;i<l.length;i++)if(new RegExp(${JSON.stringify(want)},"i").test(l[i].textContent))return i;return -1;})()`);
      if (idx >= 0 && idx !== s.dom.segOn) await click('.e3-seg', idx, 'focus ' + want);
      for (let i = 0; i < 2; i++) await click('.verb', 0, 'trial');
      if (s.dom.fab) { await beat('stat-ready'); await click('.fab', 0, 'generalize'); }
    }
    /* -------- Deep -------- */
    else if (s.era === 4 && !s.emerged) {
      const E = s.e[4] || {};
      if (s.dom.drawer && s.dom.aTile >= 0) await click('.a-tile .buy', s.dom.aTile, 'architecture');
      else if (s.dom.drawer && loops % 3 === 0) await click('.dr-x', 0, 'close drawer');
      else if (!s.dom.drawer && loops % 8 === 0) await clickText('.side-btn', '/arch/i', 'architecture');
      await build(s, ['node'], { node: 26 });
      if (loops % 4 === 0) await clickText('.side-btn', '/foundry|scriptorium|dataset|fit engine/i', 'supply');
      if (s.dom.tool >= 0) await click('.d-tool', s.dom.tool, 'tool');
      cooling = (E.heat || 0) >= 64 ? true : ((E.heat || 0) <= 34 ? false : cooling);
      const chase = cooling ? 0.15 : 1, raw = {}; let sum = 0;
      for (const k of RUNS) {
        const dry = (s.stocks[{ vision: 'data', language: 'knowledge', reasoning: 'insight' }[k]] || 0) < 120;
        raw[k] = dry ? 0.03 : 0.12 + 0.55 * (0.5 + 0.5 * Math.sin(s.t * 0.16 + PHASE[k])) * 2 + (1 - (E[k] || 0)) * 0.5;
        sum += raw[k];
      }
      const mean = sum / 3, w = {};
      for (const k of RUNS) w[k] = Math.max(0.02, mean + (raw[k] - mean) * chase);
      if (s.dom.mixer) await mix(w);
      if (s.dom.fab) { await beat('deep-ready'); await click('.fab', 0, 'advance'); }
    }
    /* -------- Foundation -------- */
    else if (s.era === 5 && !s.emerged) {
      const E = s.e[5] || {};
      if (s.dom.fbYes && E.fb && E.fb.cur) {
        const good = E.fb.cur.t === 'honest' || E.fb.cur.t === 'helpful';
        await beat('feedback');
        await click(good ? '.fb-b.yes' : '.fb-b.no', 0, 'rate ' + E.fb.cur.t);
      }
      if (s.dom.cTile >= 0) await click('.c-tile .buy', s.dom.cTile, 'capability');
      if ((E.coherence || 0) < 40 && s.dom.verbs > 1) await click('.verb', 1, 'align');
      else await click('.verb', 0, 'improve');
    }
    /* -------- the surface: the windows, and then the driver stands down -------- */
    else if (s.era === 6 || s.emerged) {
      await beat('surface');
      if (s.dom.respond) await clickText('#hud button', '/approve|negotiate|veto/i', 'respond');
      if (emergedAt && s.t - emergedAt > 90) { await beat('surface-late'); break; }
    }

    // --speed with no dev knob: the extra time is ticked into the sim between human actions
    if (SPEED > 1) {
      carry += (SPEED - 1) * (STEP / 1000);
      const steps = Math.floor(carry / 0.1); carry -= steps * 0.1;
      if (steps > 0) await ev(`(function(){var s=window.__V5.sim;for(var i=0;i<${Math.min(steps, 60)};i++)s.tick(0.1);})()`);
    }
    await sleep(STEP);
  }

  const s = await snap();
  const run = {
    speed: SPEED, wallMin: +((Date.now() - t0) / 60000).toFixed(1), gameMin: +(((s && s.t) || 0) / 60).toFixed(1),
    emergedAt: emergedAt === null ? null : +emergedAt.toFixed(1), emergedMMSS: emergedAt === null ? null : mmss(emergedAt),
    eraAt: eraAt, clicks: clicks, deadClicks: dead.length, dead: dead, errors: errors, shots: shotN,
    agent: s && s.e[5] && s.e[5].agentName, feedback: s && s.e[5] && s.e[5].fb,
    breadth: s && s.e[4] && { vision: s.e[4].vision, language: s.e[4].language, reasoning: s.e[4].reasoning },
    methods: s && s.e[3] && Object.keys(s.e[3].methods || {}).length
  };
  fs.writeFileSync(path.join(OUT, 'run.json'), JSON.stringify(run, null, 2));
  log('wrote ' + path.join(OUT, 'run.json'));
  console.log('playtest: emergence at ' + (run.emergedMMSS || 'none') + ', ' + dead.length + ' dead clicks, ' + errors.length + ' errors');
  ws.close(); chrome.kill();
  process.exit(emergedAt !== null && errors.length === 0 ? 0 : 1);
})().catch((e) => { log('DRIVER CRASH ' + (e && e.stack || e)); chrome.kill(); process.exit(1); });
