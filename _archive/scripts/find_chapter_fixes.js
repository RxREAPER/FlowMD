const fs = require('fs');
const path = require('path');

const OCR_DIR = 'sources/ocr_raw';
const OUT_FIXES = 'sources/chapter_name_fixes.json';

const dataJsContent = fs.readFileSync('data.js', 'utf8');
const dataMatch = dataJsContent.match(/const syllabusData\s*=\s*(\[.*?\]);/s);
const syllabusData = JSON.parse(dataMatch[1]);

const knownSubjects = [
  'Anatomy', 'Biochemistry', 'Physiology', 'Pharmacology', 'Microbiology',
  'Pathology', 'Community Medicine', 'Forensic Medicine', 'Ophthalmology',
  'Otorhinolaryngology (ENT)', 'Anaesthesia', 'Dermatology', 'Psychiatry',
  'Radiology', 'Medicine', 'Surgery', 'Orthopaedics', 'Paediatrics',
  'Obstetrics & Gynaecology'
];

const knownChapters = {};
const allChapterSet = new Set();
for (const subj of syllabusData) {
  const chaps = subj.chapters.map(c => c.name);
  knownChapters[subj.subject] = chaps;
  for (const c of chaps) {
    allChapterSet.add(c);
    allChapterSet.add(c.toUpperCase());
    allChapterSet.add(c.replace(/,\s*&\s*/, ' AND '));
    allChapterSet.add(c.replace(/,\s*&\s*/, ' AND ').toUpperCase());
  }
}

const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();

const ocrChaptersFound = {};
const chapterSource = {};

for (const subj of knownSubjects) {
  ocrChaptersFound[subj] = new Set();
  chapterSource[subj] = {};
}

for (const file of files) {
  const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
  const lines = text.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (t.length < 3 || t.length > 80) continue;
    if (t !== t.toUpperCase()) continue;
    if (t.indexOf(' ') === -1 && t.length > 5) continue;
    if (!/^[A-Z\s&']+$/.test(t)) continue;

    for (const subj of knownSubjects) {
      for (const knownChap of knownChapters[subj]) {
        if (t === knownChap) {
          ocrChaptersFound[subj].add(knownChap);
          chapterSource[subj][knownChap] = file;
          continue;
        }
        const normalized = t.replace(/,\s*&\s*/, ' AND ');
        if (normalized === knownChap) {
          ocrChaptersFound[subj].add(knownChap);
          chapterSource[subj][knownChap] = file;
        }
      }
    }
  }
}

console.log('=== CHAPTER NAME CROSS-CHECK ===');
console.log('Chapter | data.js name | OCR found? | OCR canonical form\n');

const fixes = { chapterCorrections: [], chapterAdditions: [], chapterMissingFromOCR: [] };

for (const subj of knownSubjects) {
  for (const knownChap of knownChapters[subj]) {
    const ocrUpper = knownChap.toUpperCase();
    const ocrNormalized = knownChap.replace(/,\s*&\s*/, ' AND ');

    let found = false;
    let foundAs = null;

    if (ocrChaptersFound[subj].has(knownChap)) {
      found = true;
      foundAs = knownChap;
    }

    const ocrLines = [];
    for (const file of files) {
      const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
      const lines = text.split('\n');
      for (const line of lines) {
        const t = line.trim();
        if (t !== t.toUpperCase()) continue;
        if (t.indexOf(' ') === -1 && t.length > 5) continue;
        if (!/^[A-Z\s&']+$/.test(t)) continue;

        for (const known of knownChapters[subj]) {
          const knownNorm = known.replace(/,\s*&\s*/, ' AND ');
          if (t === knownNorm && t !== known && !found) {
            found = true;
            foundAs = known;
          }
          if (t === known && foundAs === null) {
            foundAs = known;
          }
        }
      }
    }

    if (!found && foundAs) {
      fixes.chapterCorrections.push({
        subject: subj,
        dataJsChapter: knownChap,
        ocrChapter: foundAs,
        note: 'OCR uses "' + foundAs + '" but data.js uses "' + knownChap + '"'
      });
      console.log('CORRECT: ' + subj + ' | data.js: "' + knownChap + '" | OCR found as: "' + foundAs + '"');
    } else if (found && foundAs === knownChap) {
      // No correction needed
    }
  }
}

console.log('\n=== MISSING CHAPTERS (in data.js but not found in OCR) ===');
for (const subj of knownSubjects) {
  for (const knownChap of knownChapters[subj]) {
    let found = false;
    for (const file of files) {
      const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
      const upper = text.toUpperCase();
      const normChap = knownChap.replace(/,\s*&\s*/, ' AND ');
      if (upper.indexOf(normChap) !== -1 || upper.indexOf(knownChap.toUpperCase()) !== -1) {
        found = true;
        break;
      }
    }
    if (!found) {
      fixes.chapterMissingFromOCR.push({ subject: subj, chapter: knownChap });
      console.log('MISSING: ' + subj + ' > ' + knownChap);
    }
  }
}

fs.writeFileSync(OUT_FIXES, JSON.stringify(fixes, null, 2));
console.log('\nFixes saved to ' + OUT_FIXES);