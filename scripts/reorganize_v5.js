const fs = require('fs');
const path = require('path');

const OCR_DIR = 'sources/ocr_raw';
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
const allKnownChapters = new Set();
for (const subj of syllabusData) {
  const chaps = subj.chapters.map(c => c.name);
  knownChapters[subj.subject] = chaps;
  for (const c of chaps) {
    allKnownChapters.add(c);
    allKnownChapters.add(c.toUpperCase());
    allKnownChapters.add(c.replace(/,\s*&\s*/, ' AND '));
    allKnownChapters.add(c.replace(/,\s*&\s*/, ' AND ').toUpperCase());
  }
}

const statKey = 'MIN VIDEO';

function isStatLine(line) {
  const l = line.toUpperCase();
  if (l.indexOf('MIN VIDEO') !== -1) return true;
  if (l.indexOf('MINVIDEO') !== -1) return true;
  return false;
}

function isProgressBar(line) {
  const t = line.trim();
  if (/^\[[^\]]*\]$/.test(t)) return true;
  if (/^[\-\–\—\_\_\_]+$/.test(t)) return true;
  if (/^(Pro|Fro|Ero|Nero|Mo|Ro|Fo|So|Do|Bo)$/i.test(t)) return true;
  return false;
}

function isCourseDescription(line) {
  const t = line.trim();
  if (/^How to Approach/i.test(t)) return true;
  if (/^Introduction to/i.test(t)) return true;
  if (/Edition\s*\d/.test(t)) return true;
  if (/^VIDEOS$/i.test(t)) return true;
  return false;
}

function isInstructorInfo(line) {
  const t = line.trim();
  if (/^Dr\./i.test(t)) return true;
  if (/Contributing Editor/.test(t)) return true;
  if (/faculty in/.test(t)) return true;
  if (/eminent.*surgeon.*author/.test(t)) return true;
  return false;
}

function isProgressIndicator(line) {
  const t = line.trim();
  if (/^(Pro|Fro|Ero|Nero|Mo|Ro|Fo|So|Do|Bo|Go|Ko|Ho|No|Lo|To|So|Do)(,\s*\d+)?$/i.test(t)) return true;
  return false;
}

function isUiChrome(line) {
  const t = line.trim();
  if (t.length < 2) return true;
  if (/^\d{2}:\d{2}.*[A-Z]{2,4}\s\d{1,2}%$/.test(t)) return true;
  if (/^All\s+(Paused|Completed|Unattempted)/i.test(t)) return true;
  if (/^\d+\/\d+\s+videos\s+watched$/i.test(t)) return true;
  if (/^\[[^\]]+\]$/.test(t)) return true;
  return false;
}

function isChapterHeader(line) {
  const t = line.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (t !== t.toUpperCase()) return false;
  if (t.indexOf(' ') === -1 && t.length > 5) return false;
  if (allKnownChapters.has(t)) return true;
  return false;
}

function cleanVideoTitle(title) {
  let t = title.trim();
  t = t.replace(/\s*\[\d+\]\s*$/, '').trim();
  t = t.replace(/\s*\[\]\s*$/, '').trim();
  t = t.replace(/\s*©\s*$/, '').trim();
  t = t.replace(/[\u00A9\u00AE\u2122]\s*$/, '').trim();
  t = t.replace(/\s*[\)\)]\s*$/, '').trim();
  t = t.replace(/\s*\(\s*$/, '').trim();
  t = t.replace(/^["'\u201C\u201D]/, '').trim();
  t = t.replace(/["'\u201C\u201D]\s*$/, '').trim();
  t = t.replace(/\s*[\|\|]\s*$/, '').trim();
  t = t.replace(/[■□◆◇▪▫●○◎▸▹]/g, '').trim();
  t = t.replace(/\s+\(.*\)\s*$/, '').trim();
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
}

function extractVideosForChapter(lines, startIdx, subject) {
  const videos = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.length > 200) continue;
    if (isChapterHeader(line)) break;
    if (isCourseDescription(line)) continue;
    if (isInstructorInfo(line)) continue;
    if (isProgressBar(line)) continue;
    if (isStatLine(line)) continue;
    if (isProgressIndicator(line)) continue;
    if (isUiChrome(line)) continue;
    if (noisePattern(line)) continue;
    if (!isValidTitle(line, subject)) continue;
    const title = cleanVideoTitle(line);
    if (title.length < 3 || title.length > 200) continue;
    if (videos.indexOf(title) === -1) {
      videos.push(title);
    }
  }
  return videos;
}

const noisePatterns = [
  /^(Pro|Fro|Ero|Nero|Ro|Fo|Mo|No|Lo|To|So|Do|Bo|Go|Ko|Ho),?\s*\d*$/i,
  /^[\*\+\=\~\^\&\$\#\~\@\%\!\?\<\>\|\{\}\[\]]+$/,
];

function noisePattern(line) {
  const t = line.trim();
  if (/^\d+\s*\*\s*\d+\s+\d+\s+\d+/.test(t)) return true;
  for (const p of noisePatterns) {
    if (p.test(t)) return true;
  }
  if (/^[a-zA-Z]{1,2}$/.test(t) && t === t.toUpperCase()) return true;
  if (/^[^\sa-zA-Z]+$/.test(t) && t.length <= 3) return true;
  return false;
}

function isValidTitle(title, subject) {
  const t = title.trim();
  if (t.length < 3 || t.length > 200) return false;
  if (/^\d{2}:\d{2}/.test(t)) return false;
  if (t.toUpperCase() === t && t.indexOf(' ') === -1 && t.length <= 6) return false;
  if (t.indexOf('Min video') !== -1 || t.indexOf('Minvideo') !== -1) return false;
  if (t.indexOf('Min vid') !== -1) return false;
  return true;
}

const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();

const extracted = {};
for (const subj of knownSubjects) {
  extracted[subj] = {};
  for (const chap of knownChapters[subj]) {
    extracted[subj][chap] = [];
  }
}

for (const file of files) {
  const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!isChapterHeader(line)) continue;

    const chapterName = line;
    let subject = null;
    let knownChapter = null;

    for (const subj of knownSubjects) {
      if (knownChapters[subj].indexOf(chapterName) !== -1) {
        subject = subj;
        knownChapter = chapterName;
        break;
      }
      const normalized = chapterName.replace(/,\s*&\s*/, ' AND ');
      if (knownChapters[subj].indexOf(normalized) !== -1) {
        subject = subj;
        knownChapter = normalized;
        break;
      }
    }

    if (!subject || !knownChapter) continue;

    const videos = extractVideosForChapter(lines, i + 1, subject);
    if (videos.length > 0) {
      for (const v of videos) {
        if (extracted[subject][knownChapter].indexOf(v) === -1) {
          extracted[subject][knownChapter].push(v);
        }
      }
    }
  }
}

console.log('=== EXTRACTED CURRICULUM ===');
let totalExtracted = 0;
for (const subj of knownSubjects) {
  const chapters = extracted[subj];
  const chapNames = Object.keys(chapters).filter(c => chapters[c].length > 0);
  if (chapNames.length === 0) continue;
  const vidCount = chapNames.reduce((a, c) => a + chapters[c].length, 0);
  console.log(subj + ': ' + chapNames.length + ' chapters, ' + vidCount + ' videos');
  totalExtracted += vidCount;
  for (const cn of chapNames) {
    console.log('  ' + cn + ': ' + chapters[cn].length + ' vids');
  }
}
console.log('Total extracted: ' + totalExtracted);

const diff = { subjects: {} };
let totalChanges = 0;
let totalChapterChanges = 0;

for (const subj of syllabusData) {
  const subjectDiff = { chapters: [] };
  let hasChanges = false;

  for (const dsChap of subj.chapters) {
    const ocrVideos = extracted[subj.subject][dsChap.name];
    if (!ocrVideos || ocrVideos.length === 0) continue;

    const chapterDiff = {
      name: dsChap.name,
      videoChanges: []
    };

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

    if (chapterDiff.videoChanges.length > 0 || chapterDiff.extraOcrVideos || chapterDiff.missingOcrVideos) {
      subjectDiff.chapters.push(chapterDiff);
      totalChapterChanges++;
      hasChanges = true;
    }
  }

  if (hasChanges) {
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
    const match = ocrVideosMatchCount = ch.videoChanges.filter(vc => {
      const orig = vc.original.toLowerCase();
      const ocr = vc.ocrExtracted.toLowerCase();
      return orig.indexOf(ocr) !== -1 || ocr.indexOf(orig) !== -1;
    }).length;
    console.log('  Chapter: ' + ch.name + ' (' + ch.videoChanges.length + ' changes, ~' + match + ' likely OCR artifacts)');
    for (const vc of ch.videoChanges.slice(0, 5)) {
      console.log('    ' + vc.videoNumber + ': "' + vc.original + '" -> "' + vc.ocrExtracted + '"');
    }
    if (ch.videoChanges.length > 5) {
      console.log('    ... and ' + (ch.videoChanges.length - 5) + ' more changes');
    }
  }
}