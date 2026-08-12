/* ============================================================
   FlowMD Core — Metrics & Queue Engine
   Pure computation over state + datasets: per-plan metrics,
   the daily queue engine, deadline/ETA math, and syllabus stats.

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState } = window.FlowMD.store;
  const { getDataset, getPlanScopeVideos } = window.FlowMD.sourceData;
  const { todayKey, DEFAULT_PLAN, PLAN_A_ACCENT } = window.FlowMD.constants;
  const {
    getSubjectIconSrc,
    getSubjectSvgIcon,
    getSubjectAccentColor,
    getSubjectFaculty
  } = window.FlowMD.subjects;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  function getSyllabusStatsForSource(sourceId) {
    const sid = sourceId || state.activeSource || 'marrow_8';
    const prevActive = state.activeSource;
    if (sid === prevActive) return getSyllabusStats();
    state.activeSource = sid;
    try {
      return getSyllabusStats();
    } finally {
      state.activeSource = prevActive;
    }
  }

  function getDeadlineCountdown(targetDateStr) {
    const now = new Date();
    const target = new Date(targetDateStr || '2026-08-15');
    const diff = target - now;
    if (diff <= 0) return { text: 'Deadline Passed', days: 0, hours: 0, mins: 0, secs: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `${days}d ${hours}h ${mins}m ${secs}s`,
      days, hours, mins, secs
    };
  }

  function calculateFinishETA(metrics, dailyPace) {
    const pace = Math.max(1, parseInt(dailyPace) || 1);
    const remVids = metrics.remainingVideos;
    const daysNeeded = Math.ceil(remVids / pace);
    const finishDate = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
    const formattedDate = finishDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return {
      date: formattedDate,
      daysNeeded,
      remVids,
      pace
    };
  }

  function computeMetricsFromVideos(videos) {
    let totalVideos = 0;
    let completedVideosCount = 0;
    let totalDurationMins = 0;
    let completedDurationMins = 0;
    (videos || []).forEach(video => {
      totalVideos++;
      const mins = (video.durationMins || 0) + (video.durationSecs || 0) / 60;
      totalDurationMins += mins;
      if (state.completedVideos[video.id]) {
        completedVideosCount++;
        completedDurationMins += mins;
      }
    });
    return {
      name: (videos && videos[0]) ? videos[0].subjectName : '',
      totalVideos,
      completedVideos: completedVideosCount,
      remainingVideos: Math.max(1, totalVideos - completedVideosCount),
      totalHours: (totalDurationMins / 60).toFixed(1),
      completedHours: (completedDurationMins / 60).toFixed(1),
      remainingHours: Math.max(0.1, (totalDurationMins - completedDurationMins) / 60)
    };
  }

  function getSubjectOrSyllabusMetricsForPlan(plan) {
    if (!plan || !plan.targetSubject) return getSubjectOrSyllabusMetrics('');
    return computeMetricsFromVideos(getPlanScopeVideos(plan));
  }

  // Metrics for a live (pre-save) scope selection in the goal modal
  function getMetricsForModalScope(subjectVal, selectedUnits, sourceId) {
    const prevActive = state.activeSource;
    if (sourceId) state.activeSource = sourceId;
    try {
      const dataset = getDataset();
      const sub = dataset.find(s => s && (s.subject === subjectVal || s.id === subjectVal));
      if (!sub) return getSubjectOrSyllabusMetrics(subjectVal);

      let units = sub.chapters || [];
      const totalChapters = units.length;
      let scopedChapters = totalChapters;
      if (selectedUnits && selectedUnits.length > 0) {
        const names = selectedUnits.map(u => String(u));
        const matching = units.filter(c => c && names.indexOf(String(c.name)) !== -1);
        if (matching.length > 0) {
          units = matching;
          scopedChapters = matching.length;
        }
      }
      const videos = [];
      units.forEach(chap => {
        if (chap && chap.videos) {
          chap.videos.forEach(v => videos.push({ ...v, subjectName: sub.subject, chapterName: chap.name, subjectId: sub.id }));
        }
      });
      const m = computeMetricsFromVideos(videos);
      m.totalChapters = totalChapters;
      m.scopedChapters = scopedChapters;
      return m;
    } finally {
      state.activeSource = prevActive;
    }
  }

  // --- Per-Plan Queue Engine ---
  function getTodayQueueForPlan(plan) {
    const targetSub = plan.targetSubject || '';
    const baseTargetPace = Math.max(1, parseInt(plan.videosPerDay) || 1);
    const dataset = getDataset();

    const allSubjectVideos = getPlanScopeVideos(plan);
    let subjectName = targetSub;
    let subjectObj = null;

    if (targetSub && dataset.length > 0) {
      subjectObj = dataset.find(s => s && (s.subject === targetSub || s.id === targetSub));
      if (subjectObj) subjectName = subjectObj.subject;
    }

    const todayStr = todayKey();
    if (plan.lastBatchDate !== todayStr) {
      plan.lastBatchDate = todayStr;
      plan.extraBatchesCompletedToday = 0;
    }

    if (!Array.isArray(plan.queueBatchVideoIds)) plan.queueBatchVideoIds = [];

    // If user has completed daily target and is doing extra videos, load 1 at a time
    const isExtraMode = (plan.extraBatchesCompletedToday || 0) > 0;
    const targetBatchSize = isExtraMode ? 1 : Math.min(baseTargetPace, allSubjectVideos.length || baseTargetPace);

    const existingBatchVideos = allSubjectVideos.filter(v => plan.queueBatchVideoIds.includes(v.id));

    // The queue batch is a SYNCED plan key: every device of a user shares the
    // same batch, so it is the source of truth for what today's quest shows.
    // Regenerate only when the batch is empty (never materialized / explicitly
    // reset) or LARGER than the target (stale — e.g. the daily pace dropped, or
    // another device is in extra mode and its 1-at-a-time batch won the merge).
    // A batch SMALLER than this device's target is never regrown: it may be a
    // valid extra-mode batch from another device, and regrowing it would flip
    // the batch back and forth between devices on every render+sync (a write
    // ping-pong — the exact behavior the shared-batch change must not cause).
    if (existingBatchVideos.length === 0 || existingBatchVideos.length > targetBatchSize) {
      const uncompletedCandidates = allSubjectVideos.filter(v => !state.completedVideos[v.id]);
      const newBatch = uncompletedCandidates.slice(0, targetBatchSize);
      plan.queueBatchVideoIds = newBatch.map(v => v.id);
      saveState();
    }

    const todaysQueueVideos = allSubjectVideos.filter(v => plan.queueBatchVideoIds.includes(v.id));
    const queueCompletedInBatch = todaysQueueVideos.filter(v => !!state.completedVideos[v.id]).length;
    plan.queueCompletedInBatch = queueCompletedInBatch;

    // Track total videos completed today for this plan's subject
    const subjectId = subjectObj ? subjectObj.id : (allSubjectVideos[0] ? allSubjectVideos[0].subjectId : 'anatomy');
    const totalCompletedToday = (state.dailyHistoryBySubject && state.dailyHistoryBySubject[subjectId] && state.dailyHistoryBySubject[subjectId][todayStr]) || 0;

    const isDailyTargetAchieved = todaysQueueVideos.length > 0 && todaysQueueVideos.every(v => !!state.completedVideos[v.id]);
    // Daily target is considered met when total completed >= baseTargetPace
    const isDailyTargetMet = totalCompletedToday >= baseTargetPace;
    const allDone = todaysQueueVideos.length === 0;

    return {
      planId: plan.id,
      planLabel: plan.label,
      planAccentColor: plan.accentColor,
      subjectName,
      subjectId: subjectObj ? subjectObj.id : (allSubjectVideos[0] ? allSubjectVideos[0].subjectId : 'anatomy'),
      baseTargetPace,
      queueCompletedInBatch,
      totalCompletedToday,
      isDailyTargetAchieved,
      isDailyTargetMet,
      allSubjectDone: allDone,
      videos: todaysQueueVideos
    };
  }

  // Get all active plans' queues
  function getAllPlanQueues() {
    if (!state.plans || state.plans.length === 0) {
      state.plans = [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    }
    return state.plans.map(plan => getTodayQueueForPlan(plan));
  }

  // Legacy compat wrapper — used by older code paths
  function getTodaysActionQueue() {
    const queues = getAllPlanQueues();
    return queues[0] || { subjectName: '', subjectId: 'anatomy', baseTargetPace: 8, queueCompletedInBatch: 0, isDailyTargetAchieved: false, allSubjectDone: false, videos: [] };
  }

  // Get plan by ID
  function getPlanById(planId) {
    return state.plans && state.plans.find(p => p.id === planId);
  }

  // --- Syllabus Math Engine ---
  function getSyllabusStats() {
    const dataset = getDataset();
    if (!dataset || dataset.length === 0) return { totalVideos: 0, completedVideos: 0, percentage: 0, subjectsStats: [] };

    let totalVideos = 0;
    let completedVideosCount = 0;
    let totalDurationMins = 0;
    let completedDurationMins = 0;

    const subjectsStats = dataset.map(subject => {
      let subVideos = 0;
      let subCompleted = 0;
      let subDuration = 0;
      let subCompletedDuration = 0;

      if (subject.chapters) {
        subject.chapters.forEach(chapter => {
          if (chapter.videos) {
            chapter.videos.forEach(video => {
              subVideos++;
              totalVideos++;
              const mins = (video.durationMins || 0) + (video.durationSecs || 0) / 60;
              subDuration += mins;
              totalDurationMins += mins;

              if (state.completedVideos[video.id]) {
                subCompleted++;
                completedVideosCount++;
                subCompletedDuration += mins;
                completedDurationMins += mins;
              }
            });
          }
        });
      }

      const subPercentage = subVideos > 0 ? Math.round((subCompleted / subVideos) * 100) : 0;
      return {
        id: subject.id,
        name: subject.subject,
        totalVideos: subVideos,
        completedVideos: subCompleted,
        totalHours: (subDuration / 60).toFixed(1),
        completedHours: (subCompletedDuration / 60).toFixed(1),
        percentage: subPercentage,
        icon: getSubjectIconSrc(subject.id || subject.subject),
        svgIcon: getSubjectSvgIcon(subject.id || subject.subject),
        accentColor: getSubjectAccentColor(subject.id || subject.subject),
        faculty: getSubjectFaculty(subject.id || subject.subject),
        raw: subject
      };
    });

    const percentage = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;

    return {
      totalVideos,
      completedVideos: completedVideosCount,
      totalHours: (totalDurationMins / 60).toFixed(1),
      completedHours: (completedDurationMins / 60).toFixed(1),
      percentage,
      subjectsStats
    };
  }

  // --- Subject Metrics Helper ---
  function getSubjectOrSyllabusMetrics(selectedSubjectVal) {
    const stats = getSyllabusStats();
    if (!selectedSubjectVal || selectedSubjectVal === 'all') {
      const firstSub = stats.subjectsStats && stats.subjectsStats[0];
      if (firstSub) {
        selectedSubjectVal = firstSub.name;
      } else {
        return {
          name: 'No subject set',
          totalVideos: 0,
          completedVideos: 0,
          remainingVideos: 1,
          totalHours: 1,
          completedHours: 0,
          remainingHours: 1
        };
      }
    }

    const sub = stats.subjectsStats.find(s => s.name === selectedSubjectVal || s.id === selectedSubjectVal);
    if (!sub) {
      return {
        name: selectedSubjectVal,
        totalVideos: 100,
        completedVideos: 0,
        remainingVideos: 100,
        totalHours: 50,
        completedHours: 0,
        remainingHours: 50
      };
    }

    const totVids = sub.totalVideos || 1;
    const compVids = sub.completedVideos || 0;
    const remVids = Math.max(1, totVids - compVids);

    const totHrs = parseFloat(sub.totalHours) || 1;
    const compHrs = parseFloat(sub.completedHours) || 0;
    const remHrs = Math.max(0.1, totHrs - compHrs);

    return {
      name: sub.name,
      totalVideos: totVids,
      completedVideos: compVids,
      remainingVideos: remVids,
      totalHours: totHrs,
      completedHours: compHrs,
      remainingHours: remHrs
    };
  }

  // Expose
  window.FlowMD.metrics = {
    getSyllabusStatsForSource,
    getDeadlineCountdown,
    calculateFinishETA,
    computeMetricsFromVideos,
    getSubjectOrSyllabusMetricsForPlan,
    getMetricsForModalScope,
    getTodayQueueForPlan,
    getAllPlanQueues,
    getTodaysActionQueue,
    getPlanById,
    getSyllabusStats,
    getSubjectOrSyllabusMetrics
  };
})();
