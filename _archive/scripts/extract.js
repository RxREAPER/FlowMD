const fs = require('fs');
const path = require('path');
const OCR_DIR = 'sources/ocr_raw';
const OUT_JSON = 'sources/ocr_hierarchy.json';
const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();
let allText = '';
files.forEach(f => {
  allText += fs.readFileSync(path.join(OCR_DIR, f), 'utf8') + '\n---PAGE---\n';
});
const pages = allText.split('\n---PAGE---\n');
const subjects = {};
let curSubj = null;
let curChap = null;
let curVids = [];
function saveCurrent() {
  if (curSubj && curChap) {
    if (!subjects[curSubj]) subjects[curSubj] = [];
    subjects[curSubj].push({name: curChap, videos: curVids.slice()});
    curVids = [];
  }
}
for (const page of pages) {
  const lines = page.split('\n');
  for (const line of lines) {
    const subMatch = line.match(/^<\s*(.+?)\s*=\s*Index/);
    if (subMatch) {
      saveCurrent();
      curSubj = line.replace(/^<\s*/, '').replace(/\s*=\s*Index.*$/, '').trim();
      curChap = null;
      continue;
    }
    if (line.length >= 4 && line === line.toUpperCase() && line.indexOf(' ') !== -1) {
      saveCurrent();
      curChap = line.trim();
      continue;
    }
    if (curChap && line.trim().length > 3 && line.trim().length < 200) {
      curVids.push(line.trim());
    }
  }
}
saveCurrent();
fs.writeFileSync(OUT_JSON, JSON.stringify(subjects, null, 2));
console.log('Subjects:', Object.keys(subjects).length);
Object.keys(subjects).forEach(s => {
  console.log('  ' + s + ': ' + subjects[s].length + ' chapters');
});
