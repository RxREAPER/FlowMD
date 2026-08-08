const fs = require('fs');

const MD_PATH = 'C:/MOHAMMED SAFI/marrow-planner/marrow_edition8_readable_curriculum.md';
const OUT_PATH = 'C:/MOHAMMED SAFI/marrow-planner/data.js';

const lines = fs.readFileSync(MD_PATH, 'utf8').split('\n');

const subjects = [];
let curSubject = null;
let curChapter = null;
let subjVidCounter = 0;
let vids = 0;
let units = 0;
const warnings = [];
let lastGlobalVid = 0;

const vidRe = /^\* \*\*#(\d+)\*\* (?:`\[([^\]]+)\]` )?\| (.*) \*\((\d+)m(?: (\d+)s)?\)\*$/;
const unitRe = /^### Unit (\d+): (.+?) \((\d+) Videos • ([\d.]+)h\)$/;
const subjIdRe = /^\* \*\*Subject ID\*\*: `(.+?)`$/;
const subjHeaderRe = /^## \d+\. (.+)$/;
const subjTotalRe = /^\* \*\*Total Content\*\*: (\d+) Units \| (\d+) Videos \| ([\d.]+) Hours$/;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();

  const sh = l.match(subjHeaderRe);
  if (sh && sh[1] !== '📊 Master 19-Subject Overview Table') {
    curChapter = null;
    subjVidCounter = 0;
    curSubject = { id: null, subject: sh[1], chapters: [] };
    subjects.push(curSubject);
    continue;
  }

  if (!curSubject) continue;

  const sid = l.match(subjIdRe);
  if (sid) { curSubject.id = sid[1]; continue; }

  const st = l.match(subjTotalRe);
  if (st) continue;

  const um = l.match(unitRe);
  if (um) {
    const hours = parseFloat(um[4]);
    const vidsInUnit = parseInt(um[3], 10);
    curChapter = { name: um[2].trim(), modules: vidsInUnit, hours, videos: [] };
    curSubject.chapters.push(curChapter);
    units++;
    continue;
  }

  const vm = l.match(vidRe);
  if (vm) {
    const vidNum = parseInt(vm[1], 10);
    const embeddedId = vm[2] ? vm[2].trim() : null;
    const title = vm[3].trim();
    const mins = parseInt(vm[4], 10);
    const secs = vm[5] ? parseInt(vm[5], 10) : 0;
    if (!curChapter) { warnings.push(`video w/o chapter @${i + 1}: ${l.slice(0, 80)}`); continue; }
    subjVidCounter++;
    curChapter.videos.push({
      id: embeddedId || `${curSubject.id}__v${subjVidCounter}`,
      videoNumber: `#${String(vidNum).padStart(2, '0')}`,
      title,
      durationMins: mins,
      durationSecs: secs
    });
    vids++;
    lastGlobalVid = vidNum;
    continue;
  }
}

// Validation
let mdSubj = subjects.filter(s => s.id);
let problems = 0;
mdSubj.forEach(s => {
  let chVids = 0;
  s.chapters.forEach(c => {
    chVids += c.videos.length;
    if (c.videos.length !== c.modules) { problems++; console.log(`MISMATCH ${s.id} > ${c.name}: modules=${c.modules} actual=${c.videos.length}`); }
  });
  if (s.chapters.length === 0) { problems++; console.log(`NO CHAPTERS: ${s.id} ${s.name}`); }
});

console.log(`\nParsed subjects: ${mdSubj.length}`);
console.log(`Parsed units: ${units}`);
console.log(`Parsed videos: ${vids}`);
console.log(`Warnings: ${warnings.length}`);
warnings.slice(0, 10).forEach(w => console.log('  WARN:', w));
console.log(`Module/video mismatches: ${problems}`);
console.log(`Last global vid num: ${lastGlobalVid}`);

mdSubj.forEach(s => {
  const c = s.chapters.length;
  const v = s.chapters.reduce((a, x) => a + x.videos.length, 0);
  console.log(`  ${s.id} | ${s.subject} | ${c} chapters | ${v} vids`);
});

const grandVids = mdSubj.reduce((a, s) => a + s.chapters.reduce((b, c) => b + c.videos.length, 0), 0);
const grandMins = mdSubj.reduce((a, s) => a + s.chapters.reduce((b, c) => b + c.videos.reduce((d, v) => d + v.durationMins + v.durationSecs / 60, 0), 0), 0);
console.log(`GRAND: ${mdSubj.length} subjects | ${grandVids} videos | ${(grandMins / 60).toFixed(1)} hrs`);

// Write output
const header = `/* ============================================================
   FLOWMD V2 — MARROW EDITION 8 OFFICIAL SYLLABUS DATASET
   Rebuilt from marrow_edition8_readable_curriculum.md (20 subjects incl. Revision Videos)
   ============================================================ */

`;
const out = header + 'const syllabusData = ' + JSON.stringify(mdSubj, null, 2) + ';\n';
fs.writeFileSync(OUT_PATH, out, 'utf8');
console.log(`\nWrote ${OUT_PATH} (${fs.statSync(OUT_PATH).size} bytes)`);
