const fs = require('fs');
const path = require('path');
const OCR_DIR = 'sources/ocr_raw';
const OUT_JSON = 'sources/ocr_clean.json';

const knownSubjects = [
  'Anatomy','Biochemistry','Physiology','Pharmacology','Microbiology',
  'Pathology','Community Medicine','Forensic Medicine','Ophthalmology',
  'Otorhinolaryngology (ENT)','Anaesthesia','Dermatology','Psychiatry',
  'Radiology','Medicine','Surgery','Orthopaedics','Paediatrics',
  'Obstetrics & Gynaecology'
];

function fuzzySubjectMatch(rawName) {
  rawName = rawName.trim();
  // Direct match first
  if (knownSubjects.includes(rawName)) return rawName;
  // Try to find a known subject that is a substring of the raw name
  for (const ks of knownSubjects) {
    if (rawName.indexOf(ks) === 0) return ks;
    if (rawName.indexOf(ks) !== -1) return ks;
  }
  // Try fuzzy: remove extra characters at end
  for (const ks of knownSubjects) {
    if (rawName.length >= ks.length - 1 && rawName.length <= ks.length + 3) {
      let match = true;
      for (let i = 0; i < Math.min(ks.length, rawName.length); i++) {
        if (rawName[i] !== ks[i]) { match = false; break; }
      }
      if (match) return ks;
    }
  }
  return rawName;
}

const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();
let allText = '';
files.forEach(f => {
  allText += fs.readFileSync(path.join(OCR_DIR, f), 'utf8') + '\n---PAGE---\n';
});
const pages = allText.split('\n---PAGE---\n');

const subjectPages = {};
let curSubject = null;

for (const page of pages) {
  const lines = page.split('\n');
  for (const line of lines) {
    const subMatch = line.match(/^<\s*(.+?)\s*=\s*Index/);
    if (subMatch) {
      const raw = subMatch[1].trim().replace(/\s*=\s*Index.*$/, '').trim();
      curSubject = fuzzySubjectMatch(raw);
      if (!subjectPages[curSubject]) subjectPages[curSubject] = [];
      subjectPages[curSubject].push(page);
      break; // Only look at first line for subject
    }
  }
}

// Now extract chapters/videos from each subject's pages
const result = {};

for (const subject of knownSubjects) {
  if (!subjectPages[subject]) {
    console.log('No OCR pages for: ' + subject);
    continue;
  }
  
  // Collect all chapter header lines from all pages for this subject
  const allLines = [];
  for (const page of subjectPages[subject]) {
    const lines = page.split('\n');
    for (const line of lines) {
      allLines.push(line.trim());
    }
  }
  
  // Extract chapters
  const chapters = [];
  let currentChap = null;
  let currentVids = [];
  
  for (const line of allLines) {
    // Check if this is a subject header
    if (line.match(/^<\s*.+?\s*=\s*Index/)) continue;
    
    // Check if this is a chapter header (long ALL CAPS line)
    const isAllCaps = line === line.toUpperCase() && line.length >= 4 && line.indexOf(' ') !== -1;
    // Filter out likely noise entries
    const noiseWords = ['PRO', 'FRO', 'ERO', 'SRC', 'ED', 'ES', 'LC', 'KA', 'RED', 'NERO', 'BN', 'XX'];
    const isNoise = noiseWords.some(function(n) { return line === n; });
    const hasNoisePattern = /^\d{2}:\d{2}\s/.test(line) || /^\(.*\)\s/.test(line) || /Min\s*vid/.test(line);
    
    if (isAllCaps && line.length >= 4 && !isNoise && !hasNoisePattern) {
      // Save previous chapter
      if (currentChap) {
        // Deduplicate videos
        const uniqueVids = [];
        const seen = {};
        for (const v of currentVids) {
          if (!seen[v]) { seen[v] = true; uniqueVids.push(v); }
        }
        chapters.push({name: currentChap, videos: uniqueVids});
      }
      currentChap = line.trim();
      currentVids = [];
      continue;
    }
    
    // Video title (between chapters, not noise)
    if (currentChap && line.length > 3 && line.length < 150) {
      const isVideoNoise = /^\d{2}:\d{2}\s/.test(line) ||
        line.match(/^[A-Z]+\s*=\s*[A-Z]/) ||
        line.match(/^[A-Z]+\s+\d+\s*$/) ||
        line === 'PRO' || line === 'FRO' || line === 'ERO' ||
        line === 'no' || line === 'Nero' || line === 'nemo';
      if (!isVideoNoise && !line.match(/ Min[s]? video/)) {
        // Clean up title
        let title = line.replace(/\[.*?\]\s*$/, '').trim();
        title = title.replace(/\*+\s*$/, '').trim();
        if (title.length > 2) currentVids.push(title);
      }
    }
  }
  // Save last chapter
  if (currentChap) {
    const uniqueVids = [];
    const seen = {};
    for (const v of currentVids) {
      if (!seen[v]) { seen[v] = true; uniqueVids.push(v); }
    }
    chapters.push({name: currentChap, videos: uniqueVids});
  }
  
  result[subject] = chapters;
  console.log(subject + ': ' + chapters.length + ' chapters (from ' + subjectPages[subject].length + ' pages)');
}

fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
