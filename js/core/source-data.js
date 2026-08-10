/* ============================================================
   FlowMD Core — Source Data Layer
   Owns SOURCE_DATA registry, dataset qualification, and
   chapter/video access helpers.

   Extracted verbatim from app.js (2026-08-10). app.js gets
   helpers by destructuring — behavior is unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { STUDY_SOURCES } = window.FlowMD.constants;
  const { getState } = window.FlowMD.store;

  // --- Source Data Registry ---
  const SOURCE_DATA = {};

  function qualifySourceData(sourceId, data) {
    return data.map(subject => ({
      ...subject,
      chapters: (subject.chapters || []).map(chap => ({
        ...chap,
        videos: (chap.videos || []).map(v => ({
          ...v,
          id: sourceId + '::' + v.id
        }))
      }))
    }));
  }

  function initSourceData() {
    const srcData = {
      marrow_8: (typeof syllabusData !== 'undefined' && Array.isArray(syllabusData)) ? syllabusData : null,
      marrow_6_5: (typeof syllabusData65 !== 'undefined' && Array.isArray(syllabusData65)) ? syllabusData65 : null,
      prepladder_x: null
    };
    Object.entries(srcData).forEach(([src, data]) => {
      SOURCE_DATA[src] = (data && Array.isArray(data)) ? qualifySourceData(src, data) : [];
    });
  }

  function getDataset(sourceId) {
    const state = getState();
    const sid = sourceId || state.activeSource || 'marrow_8';
    return SOURCE_DATA[sid] || [];
  }

  // --- Subject/Chapter Access Helpers ---
  function getSubjectChapters(subjectNameOrId) {
    const dataset = getDataset();
    if (!dataset || dataset.length === 0) return [];
    const sub = dataset.find(s => s && (s.subject === subjectNameOrId || s.id === subjectNameOrId));
    return (sub && sub.chapters) ? sub.chapters : [];
  }

  function getScopedChapterNames(plan) {
    if (!plan || !plan.targetSubject || !Array.isArray(plan.targetUnits) || plan.targetUnits.length === 0) return [];
    const names = plan.targetUnits.map(u => String(u));
    return getSubjectChapters(plan.targetSubject)
      .filter(c => c && names.indexOf(String(c.name)) !== -1)
      .map(c => c.name);
  }

  // Flatten videos of only the plan's focused chapters (all chapters when unscoped)
  function getPlanScopeVideos(plan) {
    const dataset = getDataset();
    const targetSub = (plan && plan.targetSubject) || '';
    if (!targetSub || dataset.length === 0) return [];
    const subjectObj = dataset.find(s => s && (s.subject === targetSub || s.id === targetSub));
    if (!subjectObj || !subjectObj.chapters) return [];

    let chapters = subjectObj.chapters;
    if (Array.isArray(plan.targetUnits) && plan.targetUnits.length > 0) {
      const names = plan.targetUnits.map(u => String(u));
      const matching = subjectObj.chapters.filter(c => c && names.indexOf(String(c.name)) !== -1);
      if (matching.length > 0) chapters = matching;
    }

    const videos = [];
    chapters.forEach(chap => {
      if (chap && chap.videos) {
        chap.videos.forEach(v => {
          videos.push({ ...v, subjectName: subjectObj.subject, chapterName: chap.name, subjectId: subjectObj.id });
        });
      }
    });
    return videos;
  }

  // --- Bulk Chapter Completion Helpers (excluded from analytics) ---
  function getBulkChapterKey(subjectId, chapterName) {
    return `${subjectId}::${chapterName}`;
  }

  function isChapterBulkCompleted(subjectId, chapterName) {
    const state = getState();
    return !!state.bulkCompletedChapters[getBulkChapterKey(subjectId, chapterName)];
  }

  function getChapterVideoIds(subjectId, chapterName) {
    const dataset = getDataset();
    const subjectObj = dataset.find(s => s && (s.id === subjectId || s.subject === subjectId));
    if (!subjectObj) return [];
    const chapter = (subjectObj.chapters || []).find(c => c && c.name === chapterName);
    if (!chapter || !chapter.videos) return [];
    return chapter.videos.map(v => v.id);
  }

  function getDailyCountsExcludingBulk() {
    // dailyHistory is already bulk-exclusion-safe: bulk chapter completion
    // marks videos completed but never calls markStudyActivity(), so bulk
    // videos never enter dailyHistory. Stored per-day counts are accurate
    // as-is for every date (including today, which is updated in real-time
    // by markStudyActivity on each checkbox toggle).
    const state = getState();
    return { ...(state.dailyHistory || {}) };
  }

  // --- Source Label / Edition Helpers (extracted from app.js 2026-08-10) ---
  function getSourceLabel(sourceId) {
    const s = STUDY_SOURCES.find(x => x.id === sourceId);
    return s ? s.label : 'Marrow Edition 8';
  }

  function getEditionShort() {
    const state = getState();
    const s = STUDY_SOURCES.find(x => x.id === (state.activeSource || 'marrow_8'));
    return s ? s.short : 'Marrow 8';
  }

  // Expose
  window.FlowMD.sourceData = {
    SOURCE_DATA,
    qualifySourceData,
    initSourceData,
    getDataset,
    getSubjectChapters,
    getScopedChapterNames,
    getPlanScopeVideos,
    getBulkChapterKey,
    isChapterBulkCompleted,
    getChapterVideoIds,
    getDailyCountsExcludingBulk,
    getSourceLabel,
    getEditionShort
  };
})();