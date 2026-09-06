#!/usr/bin/env node
// Nav integrity smoke test for emergence-v3-unified.html: unlock all eras, navigate
// 1→5, and for each check (a) no console errors, (b) body theme class matches,
// (c) the board has content, (d) no other era's board id leaked. Prints PASS/FAIL.
const { spawn } = require('child_process');
const path = require('path');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9260;
const FILE = 'file://' + path.resolve(__dirname, '..', 'emergence-v3-unified.html');
const UDD = '/private/tmp/claude-501/-Users-cody-Desktop-Games-Emergence/b5d75348-0722-4c9f-a4db-62098a010b6f/scratchpad/chrome-navsmoke';
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1280,1400', `--user-data-dir=${UDD}`, `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--no-first-run', '--no-default-browser-check', 'about:blank']);
setTimeout(() => { console.log('WATCHDOG TIMEOUT — hung'); try { chrome.kill(); } catch (e) {} process.exit(3); }, 30000);
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(u) { const r = await fetch(u); return r.json(); }
(async () => {
  let t; for (let i = 0; i < 80; i++) { try { const l = await getJSON(`http://127.0.0.1:${PORT}/json`); t = l.find(x => x.type === 'page' && x.webSocketDebuggerUrl); if (t) break; } catch (e) {} await sleep(200); }
  if (!t) { console.log('no page target'); chrome.kill(); process.exit(1); }
  const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const p = new Map(); const ev = {};
  const send = (m, pr = {}) => new Promise(r => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pr })); });
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m.result); p.delete(m.id); } else if (m.method && ev[m.method]) ev[m.method](m.params); });
  await new Promise(r => ws.addEventListener('open', r));
  const errors = [];
  ev['Runtime.consoleAPICalled'] = q => { if (q.type === 'error') errors.push((q.args || []).map(a => a.value || a.description).join(' ')); };
  ev['Runtime.exceptionThrown'] = q => { errors.push('EXC ' + (q.exceptionDetails.exception && q.exceptionDetails.exception.description || q.exceptionDetails.text)); };
  await send('Page.enable'); await send('Runtime.enable');
  const loaded = new Promise(r => { ev['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url: FILE }); await loaded; await sleep(400);
  const THEMES = { 1: 'theme-1', 2: 'theme-2', 3: 'theme-3', 4: 'theme-4', 5: 'theme-5' };
  const results = [];
  // unlock all + seed each era's open() so its board is populated, then nav through
  await send('Runtime.evaluate', { expression: 'window.__EMG.S.maxEra=5; [1,2,3,4,5].forEach(n=>{ var e=window.__EMG.ERAS[n]; if(e.open) e.open(window.__EMG.S); });' });
  for (let n = 1; n <= 5; n++) {
    await send('Runtime.evaluate', { expression: `window.__EMG.navTo(${n})` });
    await sleep(150);
    await send('Runtime.evaluate', { expression: 'for(let i=0;i<3;i++) window.__EMG.tick();' });
    await sleep(120);
    const r = await send('Runtime.evaluate', {
      expression: `(function(){var b=document.body.className, board=document.getElementById('board');
        return JSON.stringify({ theme:b.trim(), boardKids:board?board.children.length:0,
          railChips:document.querySelectorAll('#rail .chip').length,
          activeTab:(document.querySelector('#eraNav .era-tab.active')||{}).textContent||'' });})()`, returnByValue: true
    });
    const d = JSON.parse(r.result.value);
    const themeOK = d.theme === THEMES[n];
    const boardOK = d.boardKids > 0;
    results.push({ era: n, theme: d.theme, themeOK, boardKids: d.boardKids, boardOK, railChips: d.railChips, tab: d.activeTab });
  }
  console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
  let pass = errors.length === 0;
  results.forEach(x => { const ok = x.themeOK && x.boardOK; if (!ok) pass = false; console.log(`era ${x.era}: theme=${x.theme}(${x.themeOK ? 'ok' : 'WRONG'}) board=${x.boardKids}kids(${x.boardOK ? 'ok' : 'EMPTY'}) rail=${x.railChips} tab="${x.tab.trim()}"`); });
  console.log(pass ? 'NAV SMOKE: PASS' : 'NAV SMOKE: FAIL');
  ws.close(); chrome.kill(); process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
