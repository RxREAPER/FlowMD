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

function cleanOCRName(n) {
  let s = n.trim();
  s = s.replace(/\s*[-–—]\s*E\d+\s*$/, '');
  s = s.replace(/\s*[-–—]\s*EB\s*$/, '');
  s = s.replace(/\s*[-–]\s*VIDEOS\s*$/, '');
  s = s.replace(/\s*[-–—]\s*E?\s*$/, '');
  s = s.trim();
  return s;
}

function fuzzyEq(a, b) {
  a = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  b = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

function findKnownChapter(ocrLine, subject) {
  const cleaned = cleanOCRName(ocrLine);
  for (const known of knownChapters[subject] || []) {
    if (fuzzyEq(cleaned, known)) return known;
  }
  return null;
}

function isChapterLine(line) {
  const t = line.trim();
  if (t.length < 4 || t.length > 60) return false;
  const upper = t.toUpperCase();
  if (upper !== t) return false;
  const noise = ['PRO', 'FRO', 'ERO', 'NERO', 'RO', 'FO', 'EO', 'MO', 'NO', 'LO', 'TO', 'SO', 'DO', 'BO', 'GO', 'KO', 'HO'];
  if (noise.includes(t)) return false;
  if (/^\d{2}:\d{2}/.test(t)) return false;
  if (/^[A-Z]+\s*=\s*[A-Z]/.test(t)) return false;
  if (t.startsWith('[')) return false;
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
        const cleaned = cleanOCRName(chap);
        if (text.toLowerCase().indexOf(cleaned.toLowerCase()) !== -1) score += 3;
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

  for (const file of pageFiles) {
    const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
    const lines = text.split('\n');
    let currentChapter = null;

    for (const line of lines) {
      const trimmed = line.trim();

      const matchedChapter = findKnownChapter(trimmed, subject);
      if (matchedChapter) {
        currentChapter = matchedChapter;
        if (!chapters[currentChapter]) {
          chapters[currentChapter] = [];
          chapterOrder.push(currentChapter);
        }
        continue;
      }

      if (currentChapter && trimmed.length > 0 && trimmed.length < 200) {
        if (isChapterLine(trimmed) && findKnownChapter(trimmed, subject)) {
          const mc = findKnownChapter(trimmed, subject);
          if (mc) {
            currentChapter = mc;
            if (!chapters[currentChapter]) {
              chapters[currentChapter] = [];
              chapterOrder.push(currentChapter);
            }
            continue;
          }
        }

        let title = trimmed;
        title = title.replace(/\[.*?\]\s*$/, '').trim();
        title = title.replace(/\*+\s*$/, '').trim();
        title = title.replace(/\s*\*\s*[A-Z]+\s*$/, '').trim();
        title = title.trim();

        const skipPatterns = [
          /^\d{2}:\d{2}/,
          /Min\s*vid/i,
          /^PRO$/, /^FRO$/, /^ERO$/, /^NERO$/, /^RO$/, /^FO$/, /^MO$/,
          /^[A-Z]+\s*=\s*[A-Z]/,
          /^\(.*\)$/
        ];
        let skip = false;
        for (const pat of skipPatterns) {
          if (pat.test(title)) { skip = true; break; }
        }
        if (skip) continue;
        if (title.length < 3 || title.length > 200) continue;
        if (title.toUpperCase() === title && title.indexOf(' ') === -1 && title.length <= 4) continue;

        if (chapters[currentChapter].indexOf(title) === -1) {
          chapters[currentChapter].push(title);
        }
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
    console.log('  ' + subj + ': ' + chapCount + ' chapters, ' + vidCount + ' videos');
  }
}

fs.writeFileSync(OUT_CURRICULUM, JSON.stringify(curriculum, null, 2));
console.log('\nCurriculum saved to ' + OUT_CURRICULUM);

const diff = { subjects: {} };
let totalChanges = 0;

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
    }
  }

  if (subjectDiff.chapters.length > 0) {
    diff.subjects[subj.subject] = subjectDiff;
  }
}

fs.writeFileSync(OUT_DIFF, JSON.stringify(diff, null, 2));
console.log('\nDiff saved to ' + OUT_DIFF);
console.log('Total video title changes found: ' + totalChanges);

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