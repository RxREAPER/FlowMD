const fs = require('fs');
const path = require('path');

const OCR_DIR = 'sources/ocr_raw';
const OUT_JSON = 'sources/organized.json';

const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();
let allText = '';
files.forEach(f => {
  allText += fs.readFileSync(path.join(OCR_DIR, f), 'utf8') + '\n---PAGE---\n';
});

const pages = allText.split('\n---PAGE---\n');

const knownSubjects = [
  'Anatomy', 'Biochemistry', 'Physiology', 'Pharmacology', 'Microbiology',
  'Pathology', 'Community Medicine', 'Forensic Medicine', 'Ophthalmology',
  'Otorhinolaryngology (ENT)', 'Anaesthesia', 'Dermatology', 'Psychiatry',
  'Radiology', 'Medicine', 'Surgery', 'Orthopaedics', 'Paediatrics',
  'Obstetrics & Gynaecology'
];

function detectSubject(text) {
  const lines = text.split('\n');
  for (const line of lines.slice(0, 10)) {
    for (const subj of knownSubjects) {
      if (line.toLowerCase().indexOf(subj.toLowerCase()) !== -1) {
        return subj;
      }
    }
  }
  return null;
}

function isChapterHeader(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 60) return false;
  if (trimmed !== trimmed.toUpperCase()) return false;
  if (!trimmed.includes(' ')) return false;
  const noisePatterns = ['PRO', 'FRO', 'ERO', 'SRC', 'RED', 'NERO', 'BN', 'XX', 'ED', 'ES', 'LC'];
  if (noisePatterns.includes(trimmed)) return false;
  if (trimmed.match(/^\d{2}:\d{2}\s/)) return false;
  if (trimmed.endsWith('- VIDEOS') || trimmed.endsWith('- VIDEOS')) return false;
  if (trimmed.match(/^-?\s*E\d+$/)) return false;
  return true;
}

function isVideoTitle(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 200) return false;
  if (trimmed.match(/^\d{2}:\d{2}\s/)) return false;
  if (trimmed.match(/^[A-Z]+\s*=\s*[A-Z]/)) return false;
  if (trimmed.match(/^[A-Z]+\s+\d+\s*$/)) return false;
  if (trimmed === 'PRO' || trimmed === 'FRO' || trimmed === 'ERO') return false;
  if (trimmed === 'Nero' || trimmed === 'no' || trimmed === 'nemo') return false;
  if (trimmed.match(/Min\s*vid/i)) return false;
  if (trimmed.match(/\[.*?\]\s*$/)) return false;
  return true;
}

function cleanTitle(title) {
  let t = title.trim();
  t = t.replace(/^[A-Z]+\s*\*\s*\d+\s+Min\s*vid.*$/, '');
  t = t.replace(/^\d+\s*\*\s*\d+\s*Min\s*vid.*$/, '');
  t = t.replace(/\s*\*\s*[A-Z]+\s*$/, '');
  t = t.replace(/\s*[A-Z]+\s*=\s*$/, '');
  t = t.replace(/\[.*?\]/, '');
  t = t.replace(/^[A-Z]+\s*$/, '');
  t = t.trim();
  return t;
}

const results = {};
let lastSubject = null;
let lastChapter = null;
let lastVideos = [];
let lastPageSubject = null;
let lastPageChap = null;

const chapterVideoTracker = {};

function saveCurrentSubject() {
  if (lastSubject && lastChapter && lastVideos.length > 0) {
    if (!results[lastSubject]) results[lastSubject] = {};
    if (!results[lastSubject][lastChapter]) results[lastSubject][lastChapter] = [];

    const key = lastSubject + '|' + lastChapter;
    const existing = chapterVideoTracker[key] || [];

    for (const vid of lastVideos) {
      const cleanVid = cleanTitle(vid);
      if (cleanVid.length < 3 || cleanVid.length > 200) continue;
      if (cleanVid.match(/^\d{2}:\d{2}/)) continue;
      if (cleanVid.match(/Min\s*vid/i)) continue;
      if (existing.indexOf(cleanVid) === -1) {
        existing.push(cleanVid);
        results[lastSubject][lastChapter].push(cleanVid);
      }
    }
    chapterVideoTracker[key] = existing;
  }
  lastVideos = [];
}

for (const page of pages) {
  const lines = page.split('\n');
  let pageSubject = null;
  let pageChap = null;
  let pageVideos = [];

  for (const line of lines) {
    const subMatch = line.match(/<\s*(.+?)\s*=\s*Index/);
    if (subMatch) {
      const raw = subMatch[1].trim();
      pageSubject = detectSubject(raw);
      continue;
    }
    const chapMatch = line.match(/^([A-Z][A-Z\s&(),.-]{3,})$/m);
    if (chapMatch) {
      const cn = chapMatch[1].trim();
      if (isChapterHeader(cn)) {
        pageChap = cn;
      }
      continue;
    }
    if (pageChap && line.trim().length > 0) {
      const clean = cleanTitle(line.trim());
      if (clean.length > 3 && isVideoTitle(clean)) {
        pageVideos.push(clean);
      }
    }
  }

  saveCurrentSubject();

  lastSubject = pageSubject;
  lastChapter = pageChap;
  lastVideos = pageVideos;
}

saveCurrentSubject();

const finalResult = { subjects: {} };
for (const subj of knownSubjects) {
  if (results[subj]) {
    const chapters = {};
    for (const [chapName, videos] of Object.entries(results[subj])) {
      if (chapName.length >= 3) {
        chapters[chapName] = videos;
      }
    }
    finalResult.subjects[subj] = chapters;
  }
}

fs.writeFileSync(OUT_JSON, JSON.stringify(finalResult, null, 2));

console.log('Organized subjects:', Object.keys(finalResult.subjects).length);
for (const [subj, chapters] of Object.entries(finalResult.subjects)) {
  const chapCount = Object.keys(chapters).length;
  const vidCount = Object.values(chapters).reduce((a, b) => a + b.length, 0);
  console.log('  ' + subj + ': ' + chapCount + ' chapters, ' + vidCount + ' videos');
}