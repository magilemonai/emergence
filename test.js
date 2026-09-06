#!/usr/bin/env node
// EMERGENCE test entry (v3 Flow Board era). Run: node test.js (or npm test).
//
// The LIVE emergence.html is a GENERATED artifact: tools/build-single.js inlines the modular
// source (emergence-v3-unified.html + v3-kit/) and embeds the fonts. This runner:
//   1) runs the full v3 suite against the modular source (test-v3.js),
//   2) rebuilds the artifact to a temp path and FAILS if emergence.html has drifted from source
//      (after any source change: node tools/build-single.js emergence.html).
// The pre-v3 shipped game + its 200-test suite live on in archive/:
//   node archive/test-emergence-v2.js
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let failed = false;

// 1) the v3 suite — economy, reach-back, persistence, Deep guards, full-arc progression
try { execFileSync(process.execPath, [path.join(__dirname, 'test-v3.js')], { stdio: 'inherit' }); }
catch (e) { failed = true; }

// 1b) the v4 suite — the next build, developed beside v3 (emergence-v4.html + v4-kit/)
try { execFileSync(process.execPath, [path.join(__dirname, 'test-v4.js')], { stdio: 'inherit' }); }
catch (e) { failed = true; }

// 2) artifact freshness — the live file must be exactly what the build script produces
try {
  const tmp = path.join(os.tmpdir(), 'emergence-freshness-check.html');
  execFileSync(process.execPath, [path.join(__dirname, 'tools', 'build-single.js'), tmp], { stdio: 'pipe' });
  const live = fs.readFileSync(path.join(__dirname, 'emergence.html'), 'utf8');
  const built = fs.readFileSync(tmp, 'utf8');
  fs.unlinkSync(tmp);
  if (live === built) console.log('\nartifact freshness: emergence.html matches the modular source ✓');
  else {
    console.error('\nartifact STALE: emergence.html differs from the build of emergence-v3-unified.html + v3-kit/.');
    console.error('rebuild it:  node tools/build-single.js emergence.html');
    failed = true;
  }
} catch (e) { console.error('\nfreshness check errored: ' + e.message); failed = true; }

process.exit(failed ? 1 : 0);
