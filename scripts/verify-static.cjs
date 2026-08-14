// Static integrity check used as the "build" step for this no-bundler PWA.
// Verifies every locally-referenced asset in index.html and the sw.js
// precache list actually exists, so a broken deploy is caught before it ships.
// Exits 0 on success, 1 listing any missing files.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function collectRefs(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const refs = new Set();
  // src="..." and href="..." (covers <script>, <link>, <use>, <img>, ...)
  const attrRe = /\b(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = attrRe.exec(text)) !== null) refs.add(m[1]);
  // String literals in sw.js ASSETS list (e.g. './index.html')
  const strRe = /'(\.[^']+)'/g;
  while ((m = strRe.exec(text)) !== null) refs.add(m[1]);
  return refs;
}

const refs = new Set();
collectRefs(path.join(root, 'index.html')).forEach((r) => refs.add(r));
collectRefs(path.join(root, 'sw.js')).forEach((r) => refs.add(r));

const missing = [];
for (const raw of refs) {
  const ref = raw.split('?')[0].split('#')[0]; // strip ?v= cache-busting + fragments
  if (!ref || ref === '/') continue;
  if (/^(?:https?:|data:|mailto:|tel:|javascript:|blob:|\/\/)/.test(ref)) continue;
  if (ref.startsWith('#')) continue; // in-page/SVG-use fragment
  const rel = ref.replace(/^\.\//, '');
  if (!fs.existsSync(path.join(root, rel))) missing.push(rel);
}

if (missing.length) {
  console.error('Static asset check FAILED — missing files:');
  missing.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}
console.log(`Static asset check OK (${refs.size} references verified).`);
