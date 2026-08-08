const fs = require('fs');
const DATA_JS = 'data.js';
const OUT_JS = 'data_corrected.js';
const OCR_JSON = 'sources/ocr_clean.json';

const dataJsContent = fs.readFileSync(DATA_JS, 'utf8');
const dataMatch = dataJsContent.match(/const syllabusData\s*=\s*(\[.*?\]);/s);
let syllabusData;
try { syllabusData = JSON.parse(dataMatch[1]); } catch(e) { console.log('Parse error:', e.message); process.exit(1); }

const ocrData = JSON.parse(fs.readFileSync(OCR_JSON, 'utf8'));

let totalCh = 0;
let totalV = 0;

for (const subj of syllabusData) {
  const subjName = subj.subject;
  if (!ocrData[subjName]) continue;
  const ocrChapters = ocrData[subjName];
  
  for (let i = 0; i < subj.chapters.length && i < ocrChapters.length; i++) {
    const dsChap = subj.chapters[i];
    const ocrChap = ocrChapters[i];
    
    if (ocrChap.name !== dsChap.name) {
      totalCh++;
      dsChap.name = ocrChap.name;
    }
    
    for (let j = 0; j < dsChap.videos.length && j < ocrChap.videos.length; j++) {
      if (ocrChap.videos[j] !== dsChap.videos[j].title) {
        totalV++;
        dsChap.videos[j].title = ocrChap.videos[j];
      }
    }
  }
}

const newContent = 'const syllabusData = ' + JSON.stringify(syllabusData, null, 2) + ';\n' + dataJsContent.substring(dataMatch.index + dataMatch[0].length);
fs.writeFileSync(OUT_JS, newContent);
console.log('Corrections applied: ' + totalCh + ' chapter names, ' + totalV + ' video titles');
console.log('Written to: ' + OUT_JS);
