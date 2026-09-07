// Text + purity lint (GUARDRAILS §2, §3). Runs against whatever exists under v5/ — every WO must keep it green.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
function walk(dir, out = []) { for (const f of readdirSync(dir)) { const p = path.join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (/\.(js|html|css)$/.test(f)) out.push(p); } return out; }
export async function run(t) {
  const files = walk(root).filter(p => !p.includes('/test/') && !p.includes('/workorders/') && !p.includes('/tools/'));
  const strings = (src) => { const out = []; const re = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g; let m; while ((m = re.exec(src))) out.push(m[2]); return out; };
  for (const p of files) {
    const src = readFileSync(p, 'utf8'); const rel = path.relative(root, p);
    // engine purity
    if (rel.startsWith('engine/')) {
      t.ok(!/\bDate\b|Math\.random|performance\.|setTimeout|setInterval|\bdocument\b|\bwindow\b/.test(src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')), 'engine purity: ' + rel + ' has no Date/Math.random/timers/DOM');
    }
    // banned constructions in any string
    for (const s of strings(src)) {
      t.ok(!s.includes('—'), 'no em-dash in strings: ' + rel + ' :: ' + s.slice(0, 60));
      t.ok(!/\bnot\s+[^,.]{1,40},\s*(but|it'?s)\b/i.test(s), 'no contrastive construction: ' + rel + ' :: ' + s.slice(0, 60));
    }
    // explainer prose: 12+ word string literals outside voice.js, unless on a flavor/mech/tip line
    if (!rel.endsWith('engine/voice.js') && !rel.startsWith('engine/voice/') && rel !== 'engine/receipt.js') {   // WO-12: the receipt is the one page allowed to explain (SPEC 'The turn' 5)
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        if (/\b(flavor|mech|tip|title)\s*[:=]/.test(line) || /data-tip/.test(line) || line.trim().startsWith('//') || line.trim().startsWith('*')) return;
        for (const s of strings(line)) { const words = s.trim().split(/\s+/).filter(Boolean); if (words.length >= 12 && !/[{}<>=;]/.test(s.slice(0, 2))) t.ok(false, 'explainer prose (' + words.length + ' words) in ' + rel + ':' + (i + 1) + ' :: ' + s.slice(0, 70)); }
      });
    }
  }
  t.ok(true, 'lint ran over ' + files.length + ' files');
}
