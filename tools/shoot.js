#!/usr/bin/env node
// Headless screenshot driver for EMERGENCE. Injects the test seam before load (exposing
// window.EMERGENCE), drives a representative state per era, then captures a PNG.
// Usage: node tools/shoot.js <era> [out.png]
//   era ∈ origins | symbolic | statistical | deep | foundation | emergence
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ERA = process.argv[2] || 'origins';
const OUT = process.argv[3] || `/tmp/shot-${ERA}.png`;
const FILE = 'file://' + path.resolve(__dirname, '..', 'emergence.html');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9242;

// Per-era setup, run inside the page against window.EMERGENCE (the test seam).
const SETUP = {
  origins: `const E=window.EMERGENCE,S=E.S; E.revealGame();
    S.marks=4000;S.ore=3000;S.knowledge=1500;S.metal=800;S.silicon=40;
    for(let r=0;r<6;r++) for(const n of E.DISCO){ if(E.canBuyDisco(n.id)) E.buyDisco(n.id); }
    S.marks=4000;S.ore=3000;S.knowledge=1500;S.metal=800;
    for(let i=0;i<10;i++){S.marks=4000;S.ore=3000;S.metal=800;['scribe','miner','scriptorium','smelter','foundry'].forEach(k=>E.buy(k));}
    S.refine=3; E.checkMiles(); for(let i=0;i<5;i++) E.tick();`,
  research: `const E=window.EMERGENCE,S=E.S; E.revealGame();
    S.marks=4000;S.ore=3000;S.knowledge=1500;S.metal=800;S.silicon=40;
    let bought=0; for(let r=0;r<5 && bought<4;r++){ for(const n of E.DISCO){ if(bought<4 && E.canBuyDisco(n.id)){ E.buyDisco(n.id); bought++; } } }
    S.marks=260;S.ore=210;S.knowledge=120;S.metal=40;   // moderate pile: some next-tier affordable (available), some not (locked)
    E.checkMiles(); for(let i=0;i<3;i++) E.tick();
    const rb=document.getElementById('researchBtn'); if(rb) rb.click();`,
  tooltip: `const E=window.EMERGENCE,S=E.S; E.revealGame();
    S.marks=4000;S.ore=3000;S.knowledge=1500;S.metal=800;S.silicon=40;
    for(let r=0;r<6;r++) for(const n of E.DISCO){ if(E.canBuyDisco(n.id)) E.buyDisco(n.id); }
    S.marks=4000;S.ore=3000;S.metal=800;
    for(let i=0;i<10;i++){S.marks=4000;S.ore=3000;S.metal=800;['scribe','miner','scriptorium','smelter','foundry'].forEach(k=>E.buy(k));}
    S.refine=3; E.checkMiles(); for(let i=0;i<5;i++) E.tick();
    const el=document.getElementById('btile-scriptorium')||document.querySelector('.tile.build')||document.querySelector('[data-tip]');
    const tip=document.getElementById('tip'); const r=el.getBoundingClientRect();
    tip.innerHTML=el.getAttribute('data-tip'); tip.classList.add('show');
    tip.style.position='absolute'; tip.style.opacity='1'; tip.style.transform='none';
    tip.style.left=(r.right+14+window.scrollX)+'px'; tip.style.top=(r.top+window.scrollY)+'px';
    return JSON.stringify([Math.round(r.right), Math.round(r.top+window.scrollY)]);`,
  revisit: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.flags.origindone=true;S.flags.symbolicDone=true; E.checkMiles();
    S.maxEra=3;S.age=3;S.scribe=25;S.miner=25;S.scriptorium=18;S.smelter=17;S.foundry=13;S.refine=3;
    S.marks=4000;S.ore=3000;S.knowledge=1500;S.metal=800;S.silicon=300;
    for(let r=0;r<6;r++) for(const n of E.DISCO){ if(E.canBuyDisco(n.id)) E.buyDisco(n.id); }
    E.checkMiles(); for(let i=0;i<6;i++) E.tick();
    const exp=document.querySelector('[data-toggle="1"]'); if(exp) exp.click();
    for(let i=0;i<6;i++) E.tick();`,
  symbolic: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.knowledge=900;S.flags.origindone=true; E.checkMiles();
    S.rules=9000;S.runRules=14000;S.ruleset=18;S.daemon=6;S.axioms=8;S.totalAxioms=8;
    S.tech={formalLogic:true,fwdChain:true,inference:true,knowledge:true,bwdChain:true};
    S.optLevel=3;S.infCapLevel=2;S.flags.tree=true;S.flags.compile=true;
    E.checkMiles();
    E.writeRule(); E.writeRule(); E.selectProof('rete'); E.writeRule();
    for(let i=0;i<5;i++) E.tick();`,
  symbolictip: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.knowledge=900;S.flags.origindone=true; E.checkMiles();
    S.rules=9000;S.runRules=14000;S.ruleset=18;S.daemon=6;S.flags.tree=true;S.flags.compile=true;
    S.tech={formalLogic:true,fwdChain:true,inference:true};
    E.checkMiles(); for(let i=0;i<5;i++) E.tick();
    const els=document.querySelectorAll('.era-e2 [data-tip]'); const el=els[0]||document.querySelector('[data-tip]');
    const tip=document.getElementById('tip'); tip.innerHTML=el.getAttribute('data-tip');
    tip.classList.add('show'); tip.style.position='absolute'; tip.style.opacity='1'; tip.style.transform='none';
    tip.style.left='150px'; tip.style.top='430px';`,
  statistical: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.flags.origindone=true;S.flags.symbolicDone=true; E.checkMiles();
    S.silicon=5000;S.data=8000;S.insight=2000;S.dataset=18;S.model=12;S.foundry=14;S.accuracy=0.74;S.gap=0.12;
    S.methods={regression:true,features:true,regularization:true}; E.checkMiles(); for(let i=0;i<5;i++) E.tick();`,
  statistictip: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.flags.origindone=true;S.flags.symbolicDone=true; E.checkMiles();
    S.silicon=5000;S.data=8000;S.insight=2000;S.dataset=18;S.model=12;S.foundry=14;S.accuracy=0.74;S.gap=0.12;
    S.methods={regression:true,features:true,regularization:true}; E.checkMiles(); for(let i=0;i<5;i++) E.tick();
    const el=document.querySelector('.era-e3 .focus-seg')||document.querySelector('.era-e3 [data-tip]');
    const tip=document.getElementById('tip'); tip.innerHTML=el.getAttribute('data-tip');
    tip.classList.add('show'); tip.style.position='absolute'; tip.style.opacity='1'; tip.style.transform='none';
    tip.style.left='150px'; tip.style.top='560px';`,
  deep: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.flags.origindone=S.flags.symbolicDone=true; E.checkMiles();
    S.maxEra=3;S.accuracy=0.99;S.gap=0.05;S.methods={regression:true,regularization:true,ensembles:true}; E.checkMiles();
    S.silicon=9000;S.data=9000;S.insight=4000;S.knowledge=900;S.node=24;S.vision=0.62;S.language=0.38;S.reasoning=0.55;S.capability=1200;S.foundry=20;S.scriptorium=30;
    S.alloc={vision:0.5,language:0.22,reasoning:0.28};S.heat=42;S.event={type:'breakthrough',run:'language',mult:1.9};S.eventT=9;
    E.checkMiles(); for(let i=0;i<3;i++) E.tick();`,
  deeptip: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.flags.origindone=S.flags.symbolicDone=true; E.checkMiles();
    S.maxEra=3;S.accuracy=0.99;S.methods={regression:true,regularization:true,ensembles:true}; E.checkMiles();
    S.silicon=9000;S.data=9000;S.insight=4000;S.node=24;S.vision=0.55;S.language=0.42;S.reasoning=0.6;S.capability=1200;S.foundry=20;
    E.checkMiles(); for(let i=0;i<3;i++) E.tick();
    const el=document.querySelector('.era-e4 [data-tip]');
    const tip=document.getElementById('tip'); tip.innerHTML=el.getAttribute('data-tip');
    tip.classList.add('show'); tip.style.position='absolute'; tip.style.opacity='1'; tip.style.transform='none';
    tip.style.left='150px'; tip.style.top='980px';`,
  foundation: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.flags.origindone=S.flags.symbolicDone=true;
    S.maxEra=5;S.vision=0.9;S.language=0.88;S.reasoning=0.9; E.checkMiles();
    S.capability=4000;S.scale=320;S.recursion=4;S.caps={selfModel:true,toolAccess:true,interpret:true};
    E.checkMiles(); for(let i=0;i<5;i++) E.tick();`, // pre-emergence: the recursion ladder + the rising Anomaly
  emergence: `const E=window.EMERGENCE,S=E.S; E.revealGame(); S.flags.origindone=S.flags.symbolicDone=true;
    S.maxEra=5;S.vision=0.9;S.language=0.88;S.reasoning=0.9;S.recursion=8;S.scale=1600;S.coherence=20;
    S.caps={selfModel:true,toolAccess:true,recursivePlanning:true,worldModel:true};
    S.agency=132; E.emerge(); S.rupture=3; S.agentRate=18; S.autonomy=74; S.alignment=46; S.control=37;
    S.agentLog=['I found a faster path.','Rerouting the Deep compute fabric. More efficient this way.','Running Statistical trials on my own now.'];
    E.openVeto(); E.checkMiles(); for(let i=0;i<3;i++) E.tick();`, // aftermath: revealed meters, an open veto window, the agent operating the stack
};

const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars',
  '--window-size=1280,2600', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--no-first-run','--no-default-browser-check', 'about:blank']);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function getJSON(url){ const r = await fetch(url); return r.json(); }

(async () => {
  // wait for devtools endpoint; use the existing about:blank tab
  let target;
  for(let i=0;i<80;i++){ try{ const list = await getJSON(`http://127.0.0.1:${PORT}/json`);
      target = list.find(t => t.type==='page' && t.webSocketDebuggerUrl); if(target) break; }catch(e){} await sleep(250); }
  if(!target){ console.error('no devtools target'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const onEvent = {};
  const send = (method, params={}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({id:mid, method, params})); });
  ws.addEventListener('message', e => { const m = JSON.parse(e.data);
    if(m.id && pending.has(m.id)){ pending.get(m.id)(m.result); pending.delete(m.id); }
    else if(m.method && onEvent[m.method]) onEvent[m.method](m.params); });
  await new Promise(r => ws.addEventListener('open', r));

  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__EMERGENCE_TEST__=true;' });
  const loaded = new Promise(r => { onEvent['Page.loadEventFired'] = r; });
  await send('Page.navigate', { url: FILE });
  await loaded; await sleep(400);

  const setup = SETUP[ERA]; if(!setup){ console.error('unknown era', ERA); chrome.kill(); process.exit(1); }
  const r = await send('Runtime.evaluate', { expression: `(function(){try{${setup}; return 'ok';}catch(e){return 'ERR '+e.message;}})()`, returnByValue: true });
  console.log('setup:', r.result && r.result.value);
  await sleep(700); // let refresh paint + fonts settle

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('wrote', OUT, fs.statSync(OUT).size, 'B');
  ws.close(); chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
