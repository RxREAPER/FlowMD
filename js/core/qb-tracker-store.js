/* ============================================================
   FlowMD Core — Q-Bank Tracker Store
   Progress state for the Q-Bank tracking add-on (tracking only,
   no MCQ practice). Keyed per edition (marrow_8 / marrow_6_5) so
   switching syllabus editions never mixes progress. Shape:
     { [editionId]: { [subjectId]: { [serial]: { done:0|1, qDone:<n> } } } }
   Persisted independently under 'flowmd_qb_tracker_v1' so it
   survives edition switches and never touches the video-plan
   state pipeline. Activity still feeds the existing streak
   system via FlowMD.store.markStudyActivity.
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'flowmd_qb_tracker_v1';
  let db = null;

  function load() {
    if (db) return db;
    try {
      db = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (e) { db = {}; }
    return db;
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* private mode */ }
  }

  function editionKey() {
    const st = window.FlowMD.store.getState();
    return st.activeSource || 'marrow_8';
  }

  function subjectBucket(subjectId) {
    const d = load();
    const k = editionKey();
    if (!d[k] || typeof d[k] !== 'object') d[k] = {};
    if (!d[k][subjectId] || typeof d[k][subjectId] !== 'object') d[k][subjectId] = {};
    return d[k][subjectId];
  }

  // Toggle (or explicitly set) a topic's solved state.
  function setTopicProgress(subjectId, serial, mcqs, done) {
    const sb = subjectBucket(subjectId);
    const cur = sb[serial] || { done: 0, qDone: 0 };
    const next = done ? 1 : 0;
    if (cur.done !== next) {
      sb[serial] = done ? { done: 1, qDone: mcqs } : { done: 0, qDone: 0 };
      if (window.FlowMD.store && window.FlowMD.store.markStudyActivity) {
        window.FlowMD.store.markStudyActivity(done);
      }
      persist();
    }
    return sb[serial];
  }

  function getTopicProgress(subjectId, serial) {
    return subjectBucket(subjectId)[serial] || { done: 0, qDone: 0 };
  }

  // Aggregates for one subject: topics solved / total, MCQs solved / total, %.
  function getSubjectStats(subjectId) {
    const data = window.FlowMD.qbTrackerData;
    const subj = data && data.subjects.find(s => s.id === subjectId);
    const sb = subjectBucket(subjectId);
    let totalTopics = 0, totalMcqs = 0, doneTopics = 0, doneMcqs = 0;
    if (subj) {
      for (const u of subj.units) {
        for (const t of u.topics) {
          totalTopics++; totalMcqs += t.m;
          const p = sb[t.s];
          if (p && p.done) { doneTopics++; doneMcqs += p.qDone || t.m; }
        }
      }
    }
    return {
      totalTopics, totalMcqs, doneTopics, doneMcqs,
      percentage: totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0
    };
  }

  // Per-unit rollup for the detail screen.
  function getUnitStats(subjectId, unit) {
    const sb = subjectBucket(subjectId);
    let totalMcqs = 0, doneTopics = 0, doneMcqs = 0;
    for (const t of unit.topics) {
      totalMcqs += t.m;
      const p = sb[t.s];
      if (p && p.done) { doneTopics++; doneMcqs += p.qDone || t.m; }
    }
    return { topics: unit.topics.length, totalMcqs, doneTopics, doneMcqs };
  }

  // Whole-bank rollup for the tracker hub + analytics tile.
  function getOverallStats() {
    const data = window.FlowMD.qbTrackerData;
    const out = { subjects: 0, totalTopics: 0, totalMcqs: 0, doneTopics: 0, doneMcqs: 0, perSubject: [], percentage: 0 };
    if (!data) return out;
    for (const s of data.subjects) {
      const st = getSubjectStats(s.id);
      out.subjects++;
      out.totalTopics += st.totalTopics;
      out.totalMcqs += st.totalMcqs;
      out.doneTopics += st.doneTopics;
      out.doneMcqs += st.doneMcqs;
      out.perSubject.push(Object.assign({ id: s.id, name: s.name }, st));
    }
    out.percentage = out.totalTopics ? Math.round((out.doneTopics / out.totalTopics) * 100) : 0;
    return out;
  }

  // Mark every topic of a unit done/undone.
  function setUnitProgress(subjectId, unit, done) {
    for (const t of unit.topics) setTopicProgress(subjectId, t.s, t.m, done);
  }

  window.FlowMD.qbTracker = {
    setTopicProgress, getTopicProgress, getSubjectStats,
    getUnitStats, getOverallStats, setUnitProgress
  };
})();
