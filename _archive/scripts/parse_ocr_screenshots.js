const fs = require('fs');
const path = require('path');

const OCR_DIR = path.join(__dirname, '../sources/ocr_raw');
const files = fs.readdirSync(OCR_DIR).filter(f => f.endsWith('.txt')).sort();

const SUBJECT_ORDER = [
  'Anatomy',
  'Biochemistry',
  'Physiology',
  'Pharmacology',
  'Microbiology',
  'Pathology',
  'Community Medicine',
  'Forensic Medicine',
  'Ophthalmology',
  'ENT',
  'Anaesthesia',
  'Dermatology',
  'Psychiatry',
  'Radiology',
  'Medicine',
  'Surgery',
  'Orthopaedics',
  'Paediatrics',
  'Obstetrics & Gynaecology',
  'Revision',
];

const DISPLAY_NAME = {
  'ENT': 'Otorhinolaryngology (ENT)',
  'Revision': 'Revision Videos',
};

const SUBJECT_ID = {
  'Anatomy': 'anatomy',
  'Biochemistry': 'biochemistry',
  'Physiology': 'physiology',
  'Pharmacology': 'pharmacology',
  'Microbiology': 'microbiology',
  'Pathology': 'pathology',
  'Community Medicine': 'community_medicine',
  'Forensic Medicine': 'forensic_medicine',
  'Ophthalmology': 'ophthalmology',
  'ENT': 'ent',
  'Anaesthesia': 'anaesthesia',
  'Dermatology': 'dermatology',
  'Psychiatry': 'psychiatry',
  'Radiology': 'radiology',
  'Medicine': 'medicine',
  'Surgery': 'surgery',
  'Orthopaedics': 'orthopaedics',
  'Paediatrics': 'paediatrics',
  'Obstetrics & Gynaecology': 'obstetrics_gynaecology',
  'Revision': 'revision_videos',
};

// Known noise strings from OCR buttons/badges
function isNoiseLine(line) {
  if (!line) return true;
  const t = line.trim();
  if (t.length < 2) return true;
  if (/^\d{2}:\d{2}/.test(t)) return true; // status bar timestamp
  if (/^(All|Paused|Completed|Unattempted|\d+\/\d+\s+videos|Dr\.|Contributing Editor|faculty in|Afaculty|Al Paused|Al\s+Paused)/i.test(t)) return true;
  if (/^[\-—_–\+\*\=\.]*$/.test(t)) return true;
  if (/^(PRO|FRO|ERO|Nero|Mo|Ro|Fo|So|Do|Bo|NY PRO\.|\d+\s*\*\s*\d+|\d+\s*Min\s*video|\d+\s*Minvideo)$/i.test(t)) return true;
  if (/^#?r[o0]$/i.test(t)) return true;
  if (/^[\\\/]?\s*(pro|fro|ero|nero)\b/i.test(t)) return true;
  if (/^(Src|Lc|Ey|Es|S\s*Ty|S\s*Iy|S\s*Eo|S\s*I|\$\s*Ty)\)?$/i.test(t)) return true;
  if (/^\(?\s*-\s*Ll\s*\]$/i.test(t)) return true;
  if (t.includes('Min video') || t.includes('Minvideo') || /^\d+\s*Min/i.test(t)) return true;
  if (/^\d+\s*\*\s*\d+/.test(t)) return true;
  if (/^<\s*.*Index$/i.test(t)) return true;
  if (t.includes('favourite figure in the field') || t.includes('Hospital and Research Institute')) return true;
  return false;
}

function normSubject(raw) {
  if (!raw) return null;
  let r = raw.trim();
  if (r.includes('ENT')) return 'ENT';
  if (r.includes('Revision')) return 'Revision';
  for (const s of SUBJECT_ORDER) {
    if (r.toLowerCase().includes(s.toLowerCase())) return s;
  }
  return null;
}

// Clean unit header text
function cleanUnitHeader(line) {
  let chap = line
    .replace(/\s*-\s*E8.*$/i, '')
    .replace(/\s*-\s*VIDEOS$/i, '')
    .replace(/\s*1\}\s*$/, '')
    .replace(/\s*1\]\s*$/, '')
    .trim();

  // Handle joins
  chap = chap.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim();

  // Title Case
  chap = chap.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  chap = chap.replace(/\bOf\b/g, 'of').replace(/\bAnd\b/g, 'and').replace(/\bThe\b/g, 'the').replace(/\bIn\b/g, 'in');

  return chap;
}

// Title repair for video titles
function repairTitle(raw) {
  if (!raw) return '';
  let t = raw.trim();

  // Clean trailing OCR symbols
  t = t.replace(/\s*\[.*?\]\s*$/, '').replace(/\s*©.*$/, '').trim();

  // CamelCase split
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  t = t.replace(/([A-Z]{2,})([A-Z][a-z])/g, '$1 $2');

  // Fix colons and parts
  t = t.replace(/([a-zA-Z]):([A-Z])/g, '$1: $2');
  t = t.replace(/([a-zA-Z]):(\d)/g, '$1: Part $2');
  t = t.replace(/\bPart(\d+)\b/gi, 'Part $1');

  // Space before numbers
  t = t.replace(/(\d)([A-Z])/g, '$1 $2');

  // Collapse spaces
  t = t.replace(/\s{2,}/g, ' ').trim();

  // First char upper
  if (t.length > 0) t = t.charAt(0).toUpperCase() + t.slice(1);

  return t;
}

// Parse screenshot OCR files into subject -> chapter -> video list
const rawSyllabus = {};

let curSubj = null;
let curChap = 'General';

files.forEach(file => {
  const text = fs.readFileSync(path.join(OCR_DIR, file), 'utf8');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  lines.forEach(line => {
    // Subject header line check
    const subjMatch = line.match(/^[<€&]?\s*([A-Za-z\s&()\.-]+?)\s*(?:i=|=|i\s*=|\. i=|\. i\s*=)\s*Index/i);
    if (subjMatch) {
      const s = normSubject(subjMatch[1]);
      if (s) {
        curSubj = s;
        curChap = 'General';
        if (!rawSyllabus[curSubj]) rawSyllabus[curSubj] = {};
        if (!rawSyllabus[curSubj][curChap]) rawSyllabus[curSubj][curChap] = [];
      }
      return;
    }

    if (!curSubj) return;
    if (isNoiseLine(line)) return;

    // Chapter header detection (ALL CAPS line)
    const cleanLine = line.replace(/\s*-\s*E8.*$/i, '').replace(/\s*-\s*VIDEOS$/i, '').trim();
    const isAllCaps = cleanLine === cleanLine.toUpperCase() && cleanLine.length >= 3 && /[A-Z]/.test(cleanLine) && !/^\d/.test(cleanLine);

    if (isAllCaps && !cleanLine.includes('INDEX') && !cleanLine.includes('COMPLETED') && !isNoiseLine(cleanLine)) {
      const chapName = cleanUnitHeader(cleanLine);
      if (chapName.length >= 3) {
        curChap = chapName;
        if (!rawSyllabus[curSubj][curChap]) rawSyllabus[curSubj][curChap] = [];
        return;
      }
    }

    // Video title line
    const cleanedTitle = repairTitle(line);
    if (cleanedTitle.length >= 3 && !isNoiseLine(cleanedTitle)) {
      if (!rawSyllabus[curSubj][curChap]) rawSyllabus[curSubj][curChap] = [];
      if (!rawSyllabus[curSubj][curChap].includes(cleanedTitle)) {
        rawSyllabus[curSubj][curChap].push(cleanedTitle);
      }
    }
  });
});

// Format into final structure
function makeUnitAbbr(name, used) {
  let abbr = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 6) || 'gen';
  if (!used.has(abbr)) { used.add(abbr); return abbr; }
  let n = 2;
  while (used.has(abbr + n)) n++;
  used.add(abbr + n);
  return abbr + n;
}

const result = [];
let grandVideos = 0;

SUBJECT_ORDER.forEach(subjKey => {
  const subjData = rawSyllabus[subjKey];
  if (!subjData) return;

  const subjId = SUBJECT_ID[subjKey];
  const displayName = DISPLAY_NAME[subjKey] || subjKey;
  const usedAbbrs = new Set();
  let vidCounter = 1;
  let subjVids = 0;

  const chapters = [];

  Object.keys(subjData).forEach(chapName => {
    const vList = subjData[chapName];
    if (vList.length === 0) return;

    const abbr = makeUnitAbbr(chapName, usedAbbrs);
    const videos = vList.map((t, vi) => {
      const id = `${subjId}__${abbr}__v${vi + 1}`;
      const videoNumber = '#' + String(vidCounter).padStart(2, '0');
      vidCounter++;
      subjVids++;
      grandVideos++;
      return {
        id,
        videoNumber,
        title: t,
        durationMins: 45, // default estimated baseline
        durationSecs: 0
      };
    });

    chapters.push({
      name: chapName,
      videos
    });
  });

  result.push({
    id: subjId,
    subject: displayName,
    chapters
  });

  console.log(`✅ ${displayName}: ${chapters.length} units, ${subjVids} videos`);
});

console.log('\n============================================================');
console.log(`TOTAL SUBJECTS : ${result.length}`);
console.log(`TOTAL UNITS    : ${result.reduce((a, s) => a + s.chapters.length, 0)}`);
console.log(`TOTAL VIDEOS   : ${grandVideos}`);
console.log('============================================================\n');

// Write data_marrow_6_5.js
const header = `/* ============================================================
   FLOWMD V2 — MARROW OFFICIAL APP SCREENSHOT TAXONOMY DATASET
   Rebuilt directly from official Marrow screenshot OCR sources
   Total: ${result.length} subjects | ${result.reduce((a, s) => a + s.chapters.length, 0)} units | ${grandVideos} videos
   ============================================================ */\n\n`;

fs.writeFileSync(
  path.join(__dirname, '../data_marrow_6_5.js'),
  header + 'const syllabusData65 = ' + JSON.stringify(result, null, 2) + ';\n',
  'utf8'
);

// Regenerate markdown curriculum
let md = `# Marrow Official Curriculum — Complete 20-Subject Pristine Hierarchy

This document provides the **official, screenshot-verified unit hierarchy**, **Chapters**, and **Sequential Video Topics & IDs** directly from the official Marrow App screenshots.

---

## 📊 Master 20-Subject Overview Table

| # | Subject Name | Subject ID | Units | Total Videos |
|---|---|---|---|---|
`;

result.forEach((sub, sIdx) => {
  const vCount = sub.chapters.reduce((a, c) => a + c.videos.length, 0);
  md += `| ${sIdx + 1} | **${sub.subject}** | \`${sub.id}\` | ${sub.chapters.length} | ${vCount} Videos |\n`;
});

md += `| | **GRAND TOTAL** | **20 Subjects** | **${result.reduce((a, b) => a + b.chapters.length, 0)} Units** | **${grandVideos} Videos** |\n\n---\n\n`;

result.forEach((sub, sIdx) => {
  const vCount = sub.chapters.reduce((a, c) => a + c.videos.length, 0);
  md += `## ${sIdx + 1}. ${sub.subject}\n`;
  md += `* **Subject ID**: \`${sub.id}\`\n`;
  md += `* **Total Content**: ${sub.chapters.length} Units | ${vCount} Videos\n\n`;

  let videoCounter = 1;

  sub.chapters.forEach((ch, cIdx) => {
    md += `### Unit ${cIdx + 1}: ${ch.name} (${ch.videos.length} Videos)\n`;

    ch.videos.forEach(v => {
      const vNumStr = v.videoNumber || ('#' + String(videoCounter).padStart(2, '0'));
      const idStr = ` \`[${v.id}]\``;
      md += `* **${vNumStr}**${idStr} | ${v.title}\n`;
      videoCounter++;
    });
    md += `\n`;
  });

  md += `---\n\n`;
});

const outPathRoot = path.join(__dirname, '../marrow_edition_6.5_readable_curriculum.md');
const artifactPath = 'C:/Users/Mohammed Faiz/.gemini/antigravity/brain/d5c6b49c-cb3c-45e8-9c2e-9dbeb0242fdc/marrow_edition_6.5_readable_curriculum.md';

fs.writeFileSync(outPathRoot, md, 'utf8');
fs.writeFileSync(artifactPath, md, 'utf8');

console.log('Successfully updated marrow_edition_6.5_readable_curriculum.md and data_marrow_6_5.js!');
