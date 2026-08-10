const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// ── 1. Read STUDY_SOURCES.dataFile values from constants.js ──────────────────
const constantsText = fs.readFileSync(path.join(root, 'js', 'core', 'constants.js'), 'utf-8');
const dataFileMatches = [...constantsText.matchAll(/dataFile:\s*'(\.\/[^']+)'/g)];
const allDataFiles = dataFileMatches.map(m => m[1]);

// Only include files that actually exist on disk (skips future placeholders)
const availableDataFiles = allDataFiles.filter(rel =>
  fs.existsSync(path.join(root, rel.replace(/^\.\//, '')))
);

// ── 2. Rewrite DATA_FILES block in sw.js ─────────────────────────────────────
const swPath = path.join(root, 'sw.js');
let swText = fs.readFileSync(swPath, 'utf-8');

const dataFilesBlock = availableDataFiles.map(f => `  '${f}'`).join(',\n');
swText = swText.replace(
  /(\/\/ DATA_FILES_START[\s\S]*?const DATA_FILES = \[)[\s\S]*?(\];[\s\S]*?\/\/ DATA_FILES_END)/,
  `$1\n${dataFilesBlock}\n$2`
);
fs.writeFileSync(swPath, swText, 'utf-8');
console.log(`sw.js DATA_FILES updated: ${availableDataFiles.join(', ')}`);

// ── 3. Bump ?v= in index.html ─────────────────────────────────────────────────
const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

let maxVersion = 0;
html.replace(/\?v=([\d.]+)/g, (_, v) => {
  const n = parseFloat(v) || 0;
  if (n > maxVersion) maxVersion = n;
});

const newVersion = Math.floor((maxVersion + 1) * 10) / 10;
html = html.replace(/(\?v=)([\d.]+)/g, (_, prefix) => `${prefix}${newVersion}`);
fs.writeFileSync(indexPath, html, 'utf-8');
console.log(`index.html: bumped to v${newVersion}`);

// ── 4. Bump ?v= in any data files that already have version tags ──────────────
availableDataFiles.forEach(rel => {
  const abs = path.join(root, rel.replace(/^\.\//, ''));
  let content = fs.readFileSync(abs, 'utf-8');
  if (!/\?v=[\d.]+/.test(content)) return;
  content = content.replace(/(\?v=)([\d.]+)/g, (_, prefix) => `${prefix}${newVersion}`);
  fs.writeFileSync(abs, content, 'utf-8');
  console.log(`${rel}: bumped to v${newVersion}`);
});

console.log(`Cache-busting version bumped to v${newVersion}`);
