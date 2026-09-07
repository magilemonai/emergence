#!/usr/bin/env node
// v5 test runner — pure node, no deps. Runs every v5/test/*.test.js (each exports async function run(t)).
// Usage: node v5/test.js            (all)      node v5/test.js lint     (only files whose name contains 'lint')
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const filter = process.argv[2] || '';
const files = readdirSync(path.join(here, 'test')).filter(f => f.endsWith('.test.js') && f.includes(filter)).sort();
let pass = 0, fail = 0; const fails = [];
const t = {
  ok(c, m) { if (c) pass++; else { fail++; fails.push(m); } },
  eq(a, b, m) { const same = JSON.stringify(a) === JSON.stringify(b); if (same) pass++; else { fail++; fails.push(m + ' (got ' + JSON.stringify(a).slice(0, 120) + ', want ' + JSON.stringify(b).slice(0, 120) + ')'); } },
  near(a, b, eps, m) { if (Math.abs(a - b) <= eps) pass++; else { fail++; fails.push(m + ' (got ' + a + ', want ~' + b + ')'); } },
  log(s) { console.log('  ' + s); }
};
for (const f of files) {
  process.stdout.write('· ' + f + '\n');
  try { const mod = await import(pathToFileURL(path.join(here, 'test', f)).href); await mod.run(t); }
  catch (e) { fail++; fails.push(f + ' threw: ' + (e && e.stack || e)); }
}
console.log('\nv5 suite: ' + pass + ' passed, ' + fail + ' failed');
if (fail) { console.log('FAILURES:'); fails.forEach(x => console.log('  ✗ ' + x)); process.exit(1); }
console.log('  ✓ all green'); process.exit(0);
