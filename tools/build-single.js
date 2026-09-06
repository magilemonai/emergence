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

let html = read(SHELL);

// 1) fonts: replace the Google Fonts links with embedded @font-face (base64 woff2 from fonts/)
const fontFiles = fs.readdirSync(path.join(root, 'fonts')).filter(f => f.endsWith('.woff2')).sort();
if (!fontFiles.length) fail('no fonts/*.woff2 to embed (run tools/fetch-fonts.sh)');
const faces = fontFiles.map(f => {
  const name = f.slice(0, -6);                       // Family-weight
  const [fam, wt] = [name.slice(0, name.lastIndexOf('-')).replace(/_/g, ' '), name.slice(name.lastIndexOf('-') + 1)];
  const b64 = fs.readFileSync(path.join(root, 'fonts', f)).toString('base64');
  return "  @font-face{font-family:'" + fam + "';font-style:normal;font-weight:" + wt +
    ";font-display:swap;src:url(data:font/woff2;base64," + b64 + ") format('woff2');}";
});
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
