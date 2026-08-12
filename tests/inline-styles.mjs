/* Inline-style guard — flags any `style="..."` attribute in view templates or
   index.html that is not in the committed baseline. Inline styles are the
   recurring cause of rendering bugs (unoverridable, invisible to CSS fixes —
   the spotlight search input hard-clip was one). New inline styles must be
   reviewed and either moved to a class or added to the baseline explicitly.

   Usage: node tests/inline-styles.mjs          # check (exit 1 on new styles)
          node tests/inline-styles.mjs --update # regenerate the baseline
   Run from the marrow-planner project root. */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SCAN_FILES = [
  'index.html',
  'js/features/views/dashboard.js',
  'js/features/views/curriculum.js',
  'js/features/views/analytics.js',
  'js/features/views/profile.js',
  'js/features/views/subject-detail.js'
];
const BASELINE = join(process.cwd(), 'tests', 'inline-styles-baseline.txt');

function scan() {
  const found = [];
  for (const rel of SCAN_FILES) {
    const full = join(process.cwd(), rel);
    if (!statSync(full).isFile()) continue;
    const src = readFileSync(full, 'utf8');
    for (const m of src.matchAll(/style\s*=\s*"([^"]*)"/g)) {
      found.push(`${rel}: ${m[1].slice(0, 90)}`);
    }
  }
  return found.sort();
}

const current = scan();
if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, current.join('\n') + (current.length ? '\n' : ''));
  console.log(`inline-styles: baseline updated (${current.length} occurrences)`);
  process.exit(0);
}

// CRLF-tolerant: on Windows checkouts (core.autocrlf) the baseline arrives
// with \r\n, but scanned styles are captured inside quotes and never carry \r.
const baseline = readFileSync(BASELINE, 'utf8').split('\n').map((l) => l.replace(/\r$/, '')).filter(Boolean);
const newOnes = current.filter((x) => !baseline.includes(x));
if (newOnes.length) {
  console.log(`NEW INLINE STYLES (${newOnes.length}):\n` + newOnes.join('\n'));
  console.log('\nMove them to a CSS class, or run `node tests/inline-styles.mjs --update` to accept them.');
  process.exit(1);
}
console.log(`inline-styles: CLEAN (${current.length} inline styles, all in baseline)`);
process.exit(0);
