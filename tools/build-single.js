#!/usr/bin/env node
// Phase 6 packaging: inline v3-kit CSS/JS + era modules + fonts into ONE self-contained
// html (the single-file constraint emergence.html ships under). Iteration stays on the
// modular files — run this any time to produce the artifact; nothing is hand-inlined.
// Usage: node tools/build-single.js [out.html]     (default: emergence-v3-single.html)
// Verify the artifact:  SHOOT_FILE=emergence-v3-single.html node tools/shoot-unified.js seeddeep out.png
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
// v4+: EMG_SHELL=emergence-v4.html EMG_KIT=v4-kit node tools/build-single.js emergence-v4-single.html
const SHELL = process.env.EMG_SHELL || 'emergence-v3-unified.html';
const KITDIR = process.env.EMG_KIT || 'v3-kit';
const OUT = process.argv[2] || path.join(root, SHELL.replace(/\.html$/, '') .replace('-unified', '') + '-single.html');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const fail = m => { console.error('BUILD FAIL: ' + m); process.exit(1); };

/* ---- fonts, shared by both modes: fonts/*.woff2 as base64 @font-face rules.
       The dir is gitignored, so EMG_FONTS can point at a checkout that has it; soft:true returns
       an empty list instead of failing (v5 then keeps the web font links). ---- */
function fontFaces(soft) {
  const dir = process.env.EMG_FONTS || path.join(root, 'fonts');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.woff2')).sort() : [];
  if (!files.length) { if (soft) return []; fail('no fonts/*.woff2 to embed (run tools/fetch-fonts.sh)'); }
  return files.map(f => {
    const name = f.slice(0, -6);                       // Family-weight
    const fam = name.slice(0, name.lastIndexOf('-')).replace(/_/g, ' '), wt = name.slice(name.lastIndexOf('-') + 1);
    const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
    return "  @font-face{font-family:'" + fam + "';font-style:normal;font-weight:" + wt +
      ";font-display:swap;src:url(data:font/woff2;base64," + b64 + ") format('woff2');}";
  });
}

/* =====================================================================================
   v5 mode:  EMG_V5=1 node tools/build-single.js out.html
   v5 is ES modules with dynamic era discovery, so the artifact carries a tiny async module
   registry: every module under v5/ (minus test/ and tools/) becomes a factory, imports become
   awaited registry lookups, and app.js is required last. Behavior is identical to the modular
   build; verify with:  node v5/tools/shoot.js <scene> out.png --file <artifact>
   ===================================================================================== */
function buildV5() {
  const V5 = path.join(root, 'v5');
  const OUT5 = path.resolve(process.argv[2] || path.join(root, 'emergence-v5-single.html'));
  // the game's module roots. test/, tools/ and v5/test.js are dev-only and never ship in the artifact.
  const ROOTS = ['engine', 'render', 'audio', 'scenes'];
  const mods = ['app.js'];
  function walk(dir) {
    for (const f of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, f), rel = path.relative(V5, p).split(path.sep).join('/');
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.js')) mods.push(rel);
    }
  }
  for (const r of ROOTS) { const d = path.join(V5, r); if (fs.existsSync(d)) walk(d); }
  if (!fs.existsSync(path.join(V5, 'app.js'))) fail('v5/app.js not found');

  const resolve = (fromRel, spec) => {
    const dir = path.posix.dirname(fromRel);
    let p = spec.startsWith('.') ? path.posix.normalize(path.posix.join(dir, spec)) : spec;
    return p.replace(/^\.\//, '');
  };

  /** one ES module becomes one async factory body: imports awaited, exports assigned onto __x */
  function transform(rel, src) {
    if (src.includes('</script>')) fail(rel + ' contains a script end tag, cannot inline safely');
    const names = new Set();
    let s = src;
    // static imports
    // a statement position: the line start or after a semicolon (several imports can share one line).
    // The pass repeats until it is stable, because one match eats the semicolon the next one needs.
    const flat = (list) => list.replace(/\/\/[^\n]*/g, ' ').replace(/\s+as\s+/g, ': ').replace(/\s+/g, ' ').trim();
    let uid = 0;
    for (let pass = 0; pass < 8; pass++) {
      const before = s;
      s = s.replace(/(^|;)[ \t]*import\s+([\w$]+)\s*,\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"];?/gm, (m, pre, def, list, spec) => {
        const tmp = '__i' + (++uid);
        return pre + ' const ' + tmp + ' = await __imp(' + JSON.stringify(spec) + '); const ' + def + ' = ' + tmp + '.default; const {' + flat(list) + '} = ' + tmp + ';';
      });
      s = s.replace(/(^|;)[ \t]*import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"];?/gm,
        (m, pre, list, spec) => pre + ' const {' + flat(list) + '} = await __imp(' + JSON.stringify(spec) + ');');
      s = s.replace(/(^|;)[ \t]*import\s+\*\s+as\s+([\w$]+)\s+from\s*['"]([^'"]+)['"];?/gm,
        (m, pre, n, spec) => pre + ' const ' + n + ' = await __imp(' + JSON.stringify(spec) + ');');
      s = s.replace(/(^|;)[ \t]*import\s+([\w$]+)\s+from\s*['"]([^'"]+)['"];?/gm,
        (m, pre, n, spec) => pre + ' const ' + n + ' = (await __imp(' + JSON.stringify(spec) + ')).default;');
      s = s.replace(/(^|;)[ \t]*import\s*['"]([^'"]+)['"];?/gm, (m, pre, spec) => pre + ' await __imp(' + JSON.stringify(spec) + ');');
      if (s === before) break;
    }
    // dynamic import(...) anywhere
    s = s.replace(/(^|[^.\w$])import\s*\(/g, (m, pre) => pre + '__imp(');
    // export { a, b as c };
    s = s.replace(/^[ \t]*export\s*\{([^}]*)\}\s*;?[ \t]*$/gm, (m, list) => list.split(',').map(x => x.trim()).filter(Boolean).map(x => {
      const parts = x.split(/\s+as\s+/); const local = parts[0].trim(), exp = (parts[1] || parts[0]).trim();
      return '__x[' + JSON.stringify(exp) + '] = ' + local + ';';
    }).join(' '));
    // export default
    s = s.replace(/^[ \t]*export\s+default\s+/gm, '__x.default = ');
    // export function / class / const / let / var
    s = s.replace(/^[ \t]*export\s+(async\s+function|function|class)\s+([\w$]+)/gm, (m, kind, n) => { names.add(n); return kind + ' ' + n; });
    s = s.replace(/^[ \t]*export\s+(const|let|var)\s+/gm, (m, kind) => kind + ' ');
    // names for the stripped declarations: read them back off the declaration heads
    for (const m of src.matchAll(/^[ \t]*export\s+(?:const|let|var)\s+([\w$]+)/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^[ \t]*export\s+(?:async\s+function|function|class)\s+([\w$]+)/gm)) names.add(m[1]);
    const tail = [...names].map(n => '__x[' + JSON.stringify(n) + '] = ' + n + ';').join(' ');
    return '__def(' + JSON.stringify(rel) + ', async function (__x, __imp) {\n' + s + '\n' + tail + '\n});';
  }

  const bodies = mods.map(rel => transform(rel, fs.readFileSync(path.join(V5, rel), 'utf8')));
  const assetBase = (path.relative(path.dirname(OUT5), path.join(root, 'assets')).split(path.sep).join('/') || '.') + '/';

  const runtime = [
    '(function () {',
    '  "use strict";',
    '  var __M = {}, __C = {};',
    '  function __def(id, fn) { __M[id] = fn; }',
    '  function __norm(base, spec) {',
    '    if (spec.charAt(0) !== ".") return spec;',
    '    var parts = (base.split("/").slice(0, -1)).concat(spec.split("/")), out = [];',
    '    for (var i = 0; i < parts.length; i++) { var p = parts[i]; if (p === "." || p === "") continue; if (p === "..") out.pop(); else out.push(p); }',
    '    return out.join("/");',
    '  }',
    '  function __req(id) {',
    '    if (__C[id]) return __C[id];',
    '    var fn = __M[id];',
    '    if (!fn) return Promise.reject(new Error("module not bundled: " + id));',
    '    var x = {};',
    '    __C[id] = Promise.resolve().then(function () { return fn(x, function (s) { return __req(__norm(id, s)); }); }).then(function () { return x; });',
    '    return __C[id];',
    '  }',
    '  window.__V5_ASSETS = ' + JSON.stringify(assetBase) + ';',
    bodies.join('\n'),
    '  __req("app.js");',
    '})();'
  ].join('\n');

  let out = fs.readFileSync(path.join(V5, 'index.html'), 'utf8');
  const links = /<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts\.googleapis[^>]*>/;
  if (!links.test(out)) fail('v5/index.html: Google Fonts link block not found');
  const faces5 = fontFaces(true);
  if (faces5.length) out = out.replace(links, '<style>\n/* ==== embedded fonts ==== */\n' + faces5.join('\n') + '\n</style>');
  else console.warn('WARN: no fonts/*.woff2 found, the artifact keeps the web font links (set EMG_FONTS)');
  const hudTag = '<link rel="stylesheet" href="render/hud.css">';
  if (!out.includes(hudTag)) fail('v5/index.html: hud.css link tag not found');
  let css = '/* ==== inlined render/hud.css ==== */\n' + fs.readFileSync(path.join(V5, 'render/hud.css'), 'utf8');
  const eraCssDir = path.join(V5, 'render/eras');
  for (const f of fs.readdirSync(eraCssDir).filter(f => f.endsWith('.css')).sort()) {
    css += '\n/* ==== inlined render/eras/' + f + ' ==== */\n' + fs.readFileSync(path.join(eraCssDir, f), 'utf8');
  }
  out = out.replace(hudTag, '<style>\n' + css + '\n</style>');
  const scriptTag = '<script type="module" src="app.js"></script>';
  if (!out.includes(scriptTag)) fail('v5/index.html: the app.js module tag was not found');
  out = out.replace(scriptTag, '<script>\n' + runtime + '\n</script>');
  if (/(?:src|href)="(?:render|engine|audio|scenes|app)/.test(out)) fail('a v5 module src/href survived inlining');
  if (faces5.length && /(?:src|href)="https:\/\/fonts\./.test(out)) fail('a Google Fonts link survived');

  fs.writeFileSync(OUT5, out);
  console.log('wrote ' + OUT5 + '  (' + (fs.statSync(OUT5).size / 1024).toFixed(0) + ' KB, ' + mods.length +
    ' modules inlined, ' + faces5.length + ' fonts embedded, assets base ' + assetBase + ')');
  console.log('verify: node v5/tools/shoot.js origins-bronze /tmp/v5-single.png --file ' + path.relative(root, OUT5));
}

if (process.env.EMG_V5) { buildV5(); process.exit(0); }

let html = read(SHELL);

// 1) fonts: replace the Google Fonts links with embedded @font-face (base64 woff2 from fonts/)
const faces = fontFaces();
const linkBlock = /<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts\.googleapis[^>]*>/;
if (!linkBlock.test(html)) fail('Google Fonts link block not found');
html = html.replace(linkBlock, '<style>\n/* ==== embedded fonts (fonts/*.woff2, latin subsets) ==== */\n' + faces.join('\n') + '\n</style>');

// 2) kit.css → inline <style>
const cssTag = '<link rel="stylesheet" href="' + KITDIR + '/kit.css">';
if (!html.includes(cssTag)) fail('kit.css link tag not found');
html = html.replace(cssTag, '<style>\n/* ==== inlined ' + KITDIR + '/kit.css ==== */\n' + read(KITDIR + '/kit.css') + '\n</style>');

// 3) kit.js + era modules → inline <script> (order preserved)
['kit.js', 'era-origins.js', 'era-symbolic.js', 'era-statistical.js', 'era-deep.js', 'era-foundation.js', 'era-agent.js'].forEach(f => {
  const tag = '<script src="' + KITDIR + '/' + f + '"></script>';
  if (!html.includes(tag)) { if (f === 'era-agent.js' && KITDIR === 'v3-kit') return; fail('script tag not found: ' + f); } // v3 has no agent era
  const src = read(KITDIR + '/' + f);
  if (src.includes('</script>')) fail(f + " contains '</script>' — cannot inline safely");
  html = html.replace(tag, '<script>\n/* ==== inlined ' + KITDIR + '/' + f + ' ==== */\n' + src + '\n</script>');
});

// 4) sanity: no FUNCTIONAL external references left (comments may still mention paths)
if (new RegExp('(?:src|href)="' + KITDIR + '/').test(html)) fail('a ' + KITDIR + '/ src/href survived inlining');
if (/(?:src|href)="https:\/\/fonts\./.test(html)) fail('a Google Fonts link survived');

fs.writeFileSync(OUT, html);
console.log('wrote ' + OUT + '  (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB, ' + faces.length + ' fonts embedded, assets/ still relative — ships with the assets dir like emergence.html)');
