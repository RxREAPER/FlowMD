const fs = require('fs');
const path = require('path');

const dataJsPath = 'c:/MOHAMMED SAFI/marrow-planner/data.js';
const dataJsContent = fs.readFileSync(dataJsPath, 'utf8');
let syllabusData;
eval(dataJsContent.replace('const syllabusData =', 'syllabusData ='));

let md = `# Marrow Edition 8 — Complete 20-Subject Pristine Curriculum

This document provides a clean, human-readable hierarchy of **All 20 Medical Subjects**, **Units/Chapters**, and **Sequential Video Numbers, Topics, IDs & Durations**.

---

## 📊 Master 20-Subject Overview Table

| # | Subject Name | Subject ID | Units | Total Videos | Total Hours |
|---|---|---|---|---|---|
`;

let grandTotalVideos = 0;
let grandTotalMinutes = 0;

syllabusData.forEach((sub, sIdx) => {
  let vCount = 0;
  let sMins = 0;
  sub.chapters.forEach(c => {
    vCount += (c.videos ? c.videos.length : 0);
    (c.videos || []).forEach(v => sMins += (v.durationMins || 0) + (v.durationSecs || 0) / 60);
  });
  grandTotalVideos += vCount;
  grandTotalMinutes += sMins;
  md += `| ${sIdx + 1} | **${sub.subject || sub.name}** | \`${sub.id}\` | ${sub.chapters.length} | ${vCount} Videos | ${(sMins / 60).toFixed(1)} hrs |\n`;
});

md += `| | **GRAND TOTAL** | **20 Subjects** | **${syllabusData.reduce((a, b) => a + b.chapters.length, 0)} Units** | **${grandTotalVideos} Videos** | **${(grandTotalMinutes / 60).toFixed(1)} Hours** |\n\n---\n\n`;

syllabusData.forEach((sub, sIdx) => {
  let subjVideos = 0;
  let subjMins = 0;
  sub.chapters.forEach(c => {
    subjVideos += (c.videos ? c.videos.length : 0);
    (c.videos || []).forEach(v => subjMins += (v.durationMins || 0) + (v.durationSecs || 0) / 60);
  });

  const hours = (subjMins / 60).toFixed(1);

  md += `## ${sIdx + 1}. ${sub.subject || sub.name}\n`;
  md += `* **Subject ID**: \`${sub.id}\`\n`;
  md += `* **Total Content**: ${sub.chapters.length} Units | ${subjVideos} Videos | ${hours} Hours\n\n`;

  let videoCounter = 1;

  sub.chapters.forEach((ch, cIdx) => {
    const chHours = ch.hours || (ch.videos ? (ch.videos.reduce((s, v) => s + (v.durationMins || 0), 0) / 60).toFixed(1) : 0);
    md += `### Unit ${cIdx + 1}: ${ch.name} (${ch.videos ? ch.videos.length : 0} Videos • ${chHours}h)\n`;

    if (!ch.videos || ch.videos.length === 0) {
      md += `* *No video modules listed under this unit.*\n\n`;
      return;
    }

    ch.videos.forEach(v => {
      const vNumStr = v.videoNumber || ('#' + String(videoCounter).padStart(2, '0'));
      const secs = (v.durationSecs || 0) > 0 ? ` ${v.durationSecs}s` : '';
      const durStr = `${v.durationMins || 0}m${secs}`;
      const idStr = v.id ? ` \`[${v.id}]\`` : '';
      md += `* **${vNumStr}**${idStr} | ${v.title} *(${durStr})*\n`;
      videoCounter++;
    });
    md += `\n`;
  });

  md += `---\n\n`;
});

// Write to project root
fs.writeFileSync('c:/MOHAMMED SAFI/marrow-planner/marrow_edition8_readable_curriculum.md', md, 'utf8');

// Write to conversation artifact folder
const artifactPath = 'C:/Users/Mohammed Faiz/.gemini/antigravity/brain/b91f8de0-7219-4ff3-8089-397bedba9909/marrow_edition8_readable_curriculum.md';
fs.writeFileSync(artifactPath, md, 'utf8');

console.log('Successfully generated clean readable curriculum markdown files!');
