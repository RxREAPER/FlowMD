const fs = require('fs');
const vm = require('vm');
const raw = fs.readFileSync('data.js', 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(raw, ctx);
const d = ctx.syllabusData;
console.log('Edition 8 Subject Order:');
d.forEach((s, idx) => console.log(`  ${idx + 1}. ${s.subject} [id=${s.id}]  chapters=${s.chapters.length}`));
console.log('\n65 clean.json subject order:');
const d65 = JSON.parse(fs.readFileSync('marrow_edition_6.5_clean.json', 'utf8'));
d65.forEach((s, idx) => {
  const vids = s.chapters.reduce((a, c) => a + c.videos.length, 0);
  console.log(`  ${idx + 1}. ${s.subject} [id=${s.id || '??'}]  units=${s.chapters.length}  videos=${vids}`);
});
