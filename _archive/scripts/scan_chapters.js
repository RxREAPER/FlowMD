const fs = require('fs');
const path = require('path');

const OCR_DIR = 'sources/ocr_raw';
const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();

const knownSubjects = [
  'Anatomy', 'Biochemistry', 'Physiology', 'Pharmacology', 'Microbiology',
  'Pathology', 'Community Medicine', 'Forensic Medicine', 'Ophthalmology',
  'Otorhinolaryngology (ENT)', 'Anaesthesia', 'Dermatology', 'Psychiatry',
  'Radiology', 'Medicine', 'Surgery', 'Orthopaedics', 'Paediatrics',
  'Obstetrics & Gynaecology'
];

const dataJsContent = fs.readFileSync('data.js', 'utf8');
const dataMatch = dataJsContent.match(/const syllabusData\s*=\s*(\[.*?\]);/s);
const syllabusData = JSON.parse(dataMatch[1]);

const knownChapters = {};
for (const subj of syllabusData) {
  knownChapters[subj.subject] = subj.chapters.map(c => c.name);
}

const chapterSet = new Set();
for (const subj of knownSubjects) {
  for (const chap of knownChapters[subj] || []) {
    chapterSet.add(chap);
    chapterSet.add(chap.toUpperCase());
    chapterSet.add(chap.replace(/,\s*&\s*/, ' AND '));
    chapterSet.add(chap.replace(/,\s*&\s*/, ' AND ').toUpperCase());
  }
}

const found = new Set();
let total = 0;

for (const file of files) {
  const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
  const lines = text.split('\n');
  for (const line of lines) {
    const t = line.trim();
    total++;
    if (t === t.toUpperCase() && t.length >= 3 && t.length <= 60 && /^[A-Z\s&']+$/.test(t)) {
      if (chapterSet.has(t)) {
        found.add(t);
        console.log(file + ' | MATCH: "' + t + '"');
      }
    }
  }
}

console.log('\nTotal chapter matches found: ' + found.size);
console.log('\nMatched chapters:');
for (const c of found) {
  console.log('  "' + c + '"');
}