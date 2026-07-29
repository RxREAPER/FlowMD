const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

const versionMap = {};
let maxVersion = 0;

html = html.replace(/(\?v=)([\d.]+)/g, (match, prefix, version) => {
  const num = parseFloat(version) || 0;
  if (num > maxVersion) maxVersion = num;
  return match;
});

const newVersion = Math.floor((maxVersion + 1) * 10) / 10;

html = html.replace(/(\?v=)([\d.]+)/g, (match, prefix) => {
  return `${prefix}${newVersion}`;
});

fs.writeFileSync(indexPath, html, 'utf-8');
console.log(`Cache-busting version bumped to v${newVersion}`);
