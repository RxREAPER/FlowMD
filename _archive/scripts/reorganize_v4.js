const fs = require('fs');
const path = require('path');

const OCR_DIR = 'sources/ocr_raw';
const OUT_CURRICULUM = 'sources/cleaned_curriculum.json';
const OUT_DIFF = 'sources/curriculum_diff.json';

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

const knownSubjectsLower = {};
for (const subj of knownSubjects) {
  knownSubjectsLower[subj.toLowerCase()] = subj;
}

const statPatterns = [
  /Min\s*video/i,
  /Min\s*vid/i,
];

const noiseWords = new Set([
  'PRO', 'FRO', 'ERO', 'NERO', 'RO', 'FO', 'MO', 'NO', 'LO', 'TO', 'SO', 'DO',
  'BO', 'GO', 'KO', 'HO', 'KO', 'KO', 'MO', 'NO', 'RO', 'FO',
  'Pro', 'Fro', 'Ero', 'Nero', 'Mo', 'Ro', 'Fo', 'So', 'Do', 'Bo', 'Go', 'Ko', 'Ho',
  'Al', 'All', 'An', 'At', 'By', 'Do', 'Go', 'He', 'In', 'Is', 'It', 'No', 'Of', 'On', 'Or', 'To', 'Up',
  'MR', 'MS', 'DR', 'PRO', 'FRO', 'ERO', 'NERO'
]);

const uiSkipPatterns = [
  /^\d{2}:\d{2}/,
  /^\d{4}-\d{2}-\d{2}/,
  /^\d+%/,
  /^\(.*\)$/,
  /^\-{1,5}$/,
  /^={3,}$/,
];

function isStatLine(line) {
  for (const pat of statPatterns) {
    if (pat.test(line)) return true;
  }
  if (/\*\s*\d+\s+\d+\s+\d+/.test(line)) return true;
  return false;
}

function isChapterHeader(line, subject) {
  const t = line.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (t !== t.toUpperCase()) return false;
  if (t.indexOf(' ') === -1 && t.length > 5) return false;
  if (findKnownChapterExact(t, subject)) return true;
  return false;
}

function findKnownChapterExact(line, subject) {
  const t = line.trim();
  for (const known of knownChapters[subject] || []) {
    if (t === known) return known;
    const cleaned = t.replace(/,\s*&\s*/, ' AND ').replace(/,\s*&\s*$/, ' AND');
    if (cleaned === known) return known;
  }
  return null;
}

function isCourseDescription(line) {
  const t = line.trim();
  if (/^How to Approach/i.test(t)) return true;
  if (/^Introduction to/i.test(t)) return true;
  if (/Edition\s*\d/.test(t)) return true;
  return false;
}

function isInstructorInfo(line) {
  const t = line.trim();
  if (/^Dr\./i.test(t)) return true;
  if (/Contributing Editor/i.test(t)) return true;
  if (/faculty in/i.test(t)) return true;
  if (/eminent.*surgeon.*author/i.test(t)) return true;
  return false;
}

function isProgressBar(line) {
  const t = line.trim();
  if (t.length < 2) return true;
  if (/^\[[^\]]*\]$/.test(t)) return true;
  if (/^[●✓✔✗✘⬜⬛◆◇■□▲△▼△▶◀⏸►⏺⏹⏏⏩⏪⏭⏮◀▶]+$/i.test(t)) return true;
  if (/^[\-\–\—\_\_\_]+$/.test(t)) return true;
  return false;
}

function cleanVideoTitle(title) {
  let t = title.trim();
  t = t.replace(/\[\d+\]\s*$/, '').trim();
  t = t.replace(/\[\]$/, '').trim();
  t = t.replace(/©\s*$/, '').trim();
  t = t.replace(/[\u00A9\u00AE\u2122]\s*$/, '').trim();
  t = t.replace(/\)+$/, '').trim();
  t = t.replace(/\(*$/, '').trim();
  t = t.replace(/^["'"]/, '').trim();
  t = t.replace(/["'"]$/, '').trim();
  t = t.replace(/\s*\|\s*$/, '').trim();
  t = t.replace(/[■□◆◇▪▫●○◎◆◇]/g, '').trim();
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function isValidVideoTitle(title) {
  const t = title.trim();
  if (t.length < 3 || t.length > 200) return false;
  if (t.toUpperCase() === t && t.indexOf(' ') === -1 && t.length <= 6) return false;
  if (noiseWords.has(t.toUpperCase())) return false;
  if (/\d{2}:\d{2}/.test(t)) return false;
  if (t.startsWith('[') && t.endsWith(']')) return false;
  if (/^Pro$|^Fro$|^Ero$|^Nero$|^Mo$|^Ro$|^Fo$|^So$|^Do$|^Bo$|^Go$/i.test(t)) return false;
  if (t.indexOf('Min video') !== -1 || t.indexOf('Minvideo') !== -1) return false;
  return true;
}

function assignPages() {
  const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();
  const assignments = {};
  for (const subj of knownSubjects) assignments[subj] = [];

  for (const file of files) {
    const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
    let bestSubj = null;
    let bestScore = 0;
    for (const subj of knownSubjects) {
      let score = 0;
      const lower = text.toLowerCase();
      if (lower.indexOf(subj.toLowerCase()) !== -1) score += 3;
      for (const chap of knownChapters[subj]) {
        if (text.indexOf(chap) !== -1) score += 5;
        const cleaned = chap.replace(/,\s*&\s*/, ' AND ');
        if (text.toLowerCase().indexOf(cleaned.toLowerCase()) !== -1) score += 3;
        const parts = chap.split(/\s+/);
        if (parts.length >= 2) {
          const firstWord = parts[0];
          if (text.indexOf(firstWord) !== -1) score += 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestSubj = subj;
      }
    }
    if (bestSubj && bestScore > 0) {
      assignments[bestSubj].push(file);
    }
  }
  return assignments;
}

function extractFromPages(pageFiles, subject) {
  const chapters = {};
  const chapterOrder = [];
  let currentChapter = null;

  for (const file of pageFiles) {
    const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (!trimmed) continue;
      if (trimmed.length > 300) continue;

      if (isChapterHeader(trimmed, subject)) {
        currentChapter = findKnownChapterExact(trimmed, subject);
        if (currentChapter && !chapters[currentChapter]) {
          chapters[currentChapter] = [];
          chapterOrder.push(currentChapter);
        }
        continue;
      }

      if (!currentChapter) continue;

      if (isCourseDescription(trimmed)) continue;
      if (isInstructorInfo(trimmed)) continue;
      if (isProgressBar(trimmed)) continue;

      if (isStatLine(trimmed) || noiseWords.has(trimmed.toUpperCase())) continue;

      for (const pat of uiSkipPatterns) {
        if (pat.test(trimmed)) continue;
      }

      if (!isValidVideoTitle(trimmed)) continue;

      const title = cleanVideoTitle(trimmed);
      if (!title || title.length < 3) continue;

      const existing = chapters[currentChapter];
      if (!existing) continue;

      if (existing.indexOf(title) === -1) {
        existing.push(title);
      }
    }
  }

  const result = {};
  for (const chapName of chapterOrder) {
    result[chapName] = chapters[chapName] || [];
  }
  return result;
}

const assignments = assignPages();
console.log('Page assignments:');
for (const subj of knownSubjects) {
  const count = assignments[subj].length;
  console.log('  ' + subj + ': ' + count + ' pages');
}

const curriculum = {};
for (const subj of knownSubjects) {
  if (assignments[subj].length > 0) {
    curriculum[subj] = extractFromPages(assignments[subj], subj);
    const chapCount = Object.keys(curriculum[subj]).length;
    const vidCount = Object.values(curriculum[subj]).reduce((a, b) => a + b.length, 0);
    console.log('  ' + subj + ': ' + chapCount + ' chapters, ' + vidCount + ' videos extracted');
  }
}

fs.writeFileSync(OUT_CURRICULUM, JSON.stringify(curriculum, null, 2));
console.log('\nCurriculum saved to ' + OUT_CURRICULUM);

const diff = { subjects: {} };
let totalChanges = 0;
let totalChapterChanges = 0;

for (const subj of syllabusData) {
  const ocrChapters = curriculum[subj.subject];
  if (!ocrChapters) continue;

  const subjectDiff = { chapters: [] };

  for (const dsChap of subj.chapters) {
    const ocrVideos = ocrChapters[dsChap.name];
    const chapterDiff = {
      name: dsChap.name,
      videoChanges: []
    };

    if (ocrVideos) {
      for (let i = 0; i < Math.min(dsChap.videos.length, ocrVideos.length); i++) {
        const dsTitle = dsChap.videos[i].title;
        const ocrTitle = ocrVideos[i];
        if (dsTitle !== ocrTitle) {
          chapterDiff.videoChanges.push({
            videoNumber: dsChap.videos[i].videoNumber,
            original: dsTitle,
            ocrExtracted: ocrTitle
          });
          totalChanges++;
        }
      }
      if (ocrVideos.length > dsChap.videos.length) {
        chapterDiff.extraOcrVideos = ocrVideos.slice(dsChap.videos.length);
      }
      if (ocrVideos.length < dsChap.videos.length) {
        chapterDiff.missingOcrVideos = dsChap.videos.length - ocrVideos.length;
      }
    }

    if (chapterDiff.videoChanges.length > 0 || chapterDiff.extraOcrVideos || chapterDiff.missingOcrVideos) {
      subjectDiff.chapters.push(chapterDiff);
      totalChapterChanges++;
    }
  }

  if (subjectDiff.chapters.length > 0) {
    diff.subjects[subj.subject] = subjectDiff;
  }
}

fs.writeFileSync(OUT_DIFF, JSON.stringify(diff, null, 2));
console.log('\nDiff saved to ' + OUT_DIFF);
console.log('Total chapter-level changes: ' + totalChapterChanges);
console.log('Total individual video changes: ' + totalChanges);

console.log('\n=== SUBJECTS WITH CHANGES ===');
for (const subjName of Object.keys(diff.subjects)) {
  const sd = diff.subjects[subjName];
  console.log('\n' + subjName + ': ' + sd.chapters.length + ' chapters with video changes');
  for (const ch of sd.chapters) {
    console.log('  Chapter: ' + ch.name + ' (' + ch.videoChanges.length + ' title changes)');
    for (const vc of ch.videoChanges.slice(0, 5)) {
      console.log('    ' + vc.videoNumber + ': "' + vc.original + '" -> "' + vc.ocrExtracted + '"');
    }
    if (ch.videoChanges.length > 5) {
      console.log('    ... and ' + (ch.videoChanges.length - 5) + ' more changes');
    }
  }
}