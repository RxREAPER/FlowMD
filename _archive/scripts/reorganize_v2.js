const fs = require('fs');
const path = require('path');

const OCR_DIR = 'sources/ocr_raw';
const OUT_JSON = 'sources/organized_v2.json';

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
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    for (const subj of knownSubjects) {
      const subjSimple = subj.replace(/[&()]/g, ' ').trim();
      if (lines[i].toLowerCase().indexOf(subj.toLowerCase()) !== -1) return subj;
      for (const word of subjSimple.split(/\s+/)) {
        if (word.length >= 3 && lines[i].toLowerCase().indexOf(word.toLowerCase()) !== -1 && subj.length > 5) {
          return subj;
        }
      }
    }
  }
  return null;
}

function stripOCRArtifacts(name) {
  let n = name.trim();
  n = n.replace(/\s*[-–—]\s*E\d+\s*$/, '');
  n = n.replace(/\s*[-–—]\s*EB\s*$/, '');
  n = n.replace(/\s*[-–—]\s*E?\s*$/, '');
  n = n.replace(/\s*[-–]\s*VIDEOS\s*$/, '');
  n = n.replace(/\s*[-–]\s*VIDEOS\s*$/, '');
  n = n.trim();
  return n;
}

function isChapterHeader(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  const hasUpper = /[A-Z]/.test(trimmed);
  if (!hasUpper) return false;
  const noiseWords = ['PRO', 'FRO', 'ERO', 'SRC', 'RED', 'NERO', 'BN', 'XX', 'ED', 'ES', 'LC', 'RO', 'FO', 'EO', 'S IY', 'S EO', 'BN XX', 'ED)', 'KA)', 'ES)', 'LC)', 'S I', 'S EO', 'BN XX'];
  if (noiseWords.some(n => trimmed === n || trimmed.startsWith(n))) return false;
  if (/^\d{2}:\d{2}\s/.test(trimmed)) return false;
  if (trimmed.endsWith('Min video') || trimmed.endsWith('Minvideo')) return false;
  if (/^[A-Z]+\s+[A-Z]+\s*=\s*[A-Z]/.test(trimmed)) return false;
  if (trimmed.match(/^\[/)) return false;
  if (trimmed.match(/^[A-Z]+\s*$/) && trimmed.length <= 3) return false;
  return true;
}

function cleanChapterName(name) {
  let n = stripOCRArtifacts(name.trim());
  return n;
}

function isVideoTitle(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 200) return false;
  if (/^\d{2}:\d{2}\s/.test(trimmed)) return false;
  if (trimmed.match(/^[A-Z]+\s*=\s*[A-Z]/)) return false;
  if (trimmed.match(/^[A-Z]+\s+\d+\s*$/)) return false;
  if (['PRO', 'FRO', 'ERO', 'Nero', 'no', 'nemo', 'nro', '1ero', '2ero', '3ero'].includes(trimmed)) return false;
  if (trimmed.match(/Min\s*vid/i)) return false;
  if (trimmed.match(/^[A-Z]+\s*$/) && trimmed.length <= 4 && ['RO', 'FO', 'EO', 'MO', 'NO', 'SO', 'LO', 'TO'].includes(trimmed)) return false;
  return true;
}

function cleanVideoTitle(title) {
  let t = title.trim();
  t = t.replace(/\[.*?\]\s*$/, '').trim();
  t = t.replace(/\*+\s*$/, '').trim();
  t = t.replace(/\s*\*\s*[A-Z]+\s*$/, '').trim();
  t = t.replace(/\s*[A-Z]+\s*=\s*$/, '').trim();
  t = t.trim();
  return t;
}

const results = {};
const seenChapters = {};
const seenVideos = {};

for (const page of pages) {
  const lines = page.split('\n');
  let pageSubject = null;
  let currentChapter = null;
  let currentVideos = [];

  for (const line of lines) {
    const subMatch = line.match(/<\s*(.+?)\s*=\s*Index/);
    if (subMatch) {
      if (pageSubject && currentChapter && currentVideos.length > 0) {
        if (!results[pageSubject]) results[pageSubject] = {};
        if (!results[pageSubject][currentChapter]) results[pageSubject][currentChapter] = [];
        const videoKey = pageSubject + '|' + currentChapter;
        if (!seenVideos[videoKey]) seenVideos[videoKey] = new Set();
        for (const vid of currentVideos) {
          const cleanVid = cleanVideoTitle(vid);
          if (cleanVid.length < 3 || cleanVid.length > 200) continue;
          if (!seenVideos[videoKey].has(cleanVid)) {
            seenVideos[videoKey].add(cleanVid);
            results[pageSubject][currentChapter].push(cleanVid);
          }
        }
      }
      pageSubject = detectSubject(page.lines ? page.lines.join('\n') : line);
      currentChapter = null;
      currentVideos = [];
      continue;
    }

    if (isChapterHeader(line)) {
      if (pageSubject && currentChapter && currentVideos.length > 0) {
        if (!results[pageSubject]) results[pageSubject] = {};
        if (!results[pageSubject][currentChapter]) results[pageSubject][currentChapter] = [];
        const videoKey = pageSubject + '|' + currentChapter;
        if (!seenVideos[videoKey]) seenVideos[videoKey] = new Set();
        for (const vid of currentVideos) {
          const cleanVid = cleanVideoTitle(vid);
          if (cleanVid.length < 3 || cleanVid.length > 200) continue;
          if (!seenVideos[videoKey].has(cleanVid)) {
            seenVideos[videoKey].add(cleanVid);
            results[pageSubject][currentChapter].push(cleanVid);
          }
        }
        currentVideos = [];
      }
      const cleanedChap = cleanChapterName(line);
      if (cleanedChap.length >= 3) {
        currentChapter = cleanedChap;
      }
      continue;
    }

    if (currentChapter) {
      const clean = cleanVideoTitle(line.trim());
      if (isVideoTitle(clean)) {
        currentVideos.push(clean);
      }
    }
  }

  if (pageSubject && currentChapter && currentVideos.length > 0) {
    if (!results[pageSubject]) results[pageSubject] = {};
    if (!results[pageSubject][currentChapter]) results[pageSubject][currentChapter] = [];
    const videoKey = pageSubject + '|' + currentChapter;
    if (!seenVideos[videoKey]) seenVideos[videoKey] = new Set();
    for (const vid of currentVideos) {
      const cleanVid = cleanVideoTitle(vid);
      if (cleanVid.length < 3 || cleanVid.length > 200) continue;
      if (!seenVideos[videoKey].has(cleanVid)) {
        seenVideos[videoKey].add(cleanVid);
        results[pageSubject][currentChapter].push(cleanVid);
      }
    }
  }
}

const finalResult = {};
for (const subj of knownSubjects) {
  if (results[subj]) {
    const chapters = {};
    for (const [chapName, videos] of Object.entries(results[subj])) {
      const cleanChap = cleanChapterName(chapName);
      if (cleanChap.length >= 3) {
        if (!chapters[cleanChap]) chapters[cleanChap] = [];
        for (const v of videos) {
          const cleanVid = cleanVideoTitle(v);
          if (cleanVid.length >= 3 && chapters[cleanChap].indexOf(cleanVid) === -1) {
            chapters[cleanChap].push(cleanVid);
          }
        }
      }
    }
    if (Object.keys(chapters).length > 0) {
      finalResult[subj] = chapters;
    }
  }
}

fs.writeFileSync(OUT_JSON, JSON.stringify(finalResult, null, 2));
console.log('Organized subjects:', Object.keys(finalResult).length);
for (const [subj, chapters] of Object.entries(finalResult)) {
  const chapCount = Object.keys(chapters).length;
  const vidCount = Object.values(chapters).reduce((a, b) => a + b.length, 0);
  console.log('  ' + subj + ': ' + chapCount + ' chapters, ' + vidCount + ' videos');
}