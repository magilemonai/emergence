// WO-11: the v5 packager. EMG_V5=1 node tools/build-single.js <out> must inline every game module into one
// file with no module syntax left in it, so the artifact runs as a plain script. This guards the transform
// as later work orders add modules (a new era, the film, the receipt).
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

export async function run(t) {
  const out = path.join(tmpdir(), 'v5-package-test-' + process.pid + '.html');
  let built = '';
  try {
    execFileSync(process.execPath, [path.join(root, 'tools/build-single.js'), out],
      { env: Object.assign({}, process.env, { EMG_V5: '1' }), cwd: root, stdio: 'pipe' });
    built = readFileSync(out, 'utf8');
  } catch (e) {
    t.ok(false, 'the packager runs: ' + String((e && e.message) || e).slice(0, 200));
    return;
  }
  t.ok(built.length > 50000, 'package: the artifact has the whole game in it (' + Math.round(built.length / 1024) + ' KB)');

  const code = (built.match(/<script>([\s\S]*?)<\/script>/g) || []).join('\n');
  const stripped = code.replace(/\/\/[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  t.ok(!/(^|[^_a-zA-Z.$])import[ \t]+[{*'"\w]/.test(stripped), 'package: no import statement survives the inlining');
  t.ok(!/(^|[^.\w$])export[ \t]+(default|const|let|var|function|class|\{)/.test(stripped), 'package: no export statement survives the inlining');
  t.ok(!/import\.meta/.test(stripped), 'package: no import.meta survives (dev-only files stay out)');
  t.ok(!/type="module"/.test(built), 'package: the artifact is a plain script, not a module');
  t.ok(!/(?:src|href)="(?:render|engine|audio|scenes|app)/.test(built), 'package: no module file is still linked');

  // every game module is present in the bundle, and the dev-only files are not
  const mods = [];
  const walk = (dir) => { for (const f of readdirSync(dir).sort()) { const p = path.join(dir, f); const rel = path.relative(path.join(root, 'v5'), p).split(path.sep).join('/'); try { if (readdirSync(p).length >= 0) { walk(p); continue; } } catch (e) { } if (f.endsWith('.js')) mods.push(rel); } };
  for (const r of ['engine', 'render', 'audio', 'scenes']) walk(path.join(root, 'v5', r));
  mods.push('app.js');
  let missing = '';
  for (const m of mods) if (!built.includes('__def("' + m + '"')) missing += m + ' ';
  t.eq(missing, '', 'package: every game module is registered in the artifact');
  t.ok(!built.includes('__def("test.js"'), 'package: the test runner is never bundled');
  t.ok(built.includes('window.__V5_ASSETS'), 'package: the artifact points the views at the assets dir');
  t.ok(built.includes('__req("app.js")'), 'package: the artifact boots app.js');

  if (existsSync(out)) unlinkSync(out);
}
