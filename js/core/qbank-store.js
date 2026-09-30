/* ============================================================
   FlowMD Core — Question Bank (Q-Bank) State & Persistence
   Manages offline-first storage of question attempts, scores,
   bookmarks, topic completion states, and subject statistics.
   ============================================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'flowmd_qbank_progress_v2';
  const { getState, saveState, markStudyActivity } = window.FlowMD.store;

  // Cache in-memory working copy
  let progressCache = null;

  function safeParse(str, fallback) {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  function getQBankStore() {
    if (progressCache) return progressCache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      progressCache = safeParse(raw, {});
    } catch (e) {
      progressCache = {};
    }
    return progressCache;
  }

  function persistQBankStore() {
    try {
      if (progressCache) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progressCache));
      }
    } catch (e) {
      console.warn('Could not persist Q-Bank store:', e);
    }
  }

  // --- Topic Progress Helpers ---
  function getTopicProgress(topicId) {
    const store = getQBankStore();
    const data = store[topicId];
    if (!data) {
      return {
        status: 'unattempted', // 'unattempted' | 'paused' | 'completed'
        currentIndex: 0,
        answers: {}, // index -> { selectedOption, isCorrect, answeredAt }
        markedForReview: {}, // index -> true/false
        score: 0,
        totalQuestions: 0,
        completedAt: null
      };
    }
    return {
      status: data.status || 'unattempted',
      currentIndex: data.currentIndex || 0,
      answers: data.answers || {},
      markedForReview: data.markedForReview || {},
      score: data.score || 0,
      totalQuestions: data.totalQuestions || 0,
      completedAt: data.completedAt || null
    };
  }

  function saveTopicAnswer(topicId, questionIndex, selectedOption, isCorrect, totalQuestions) {
    const store = getQBankStore();
    if (!store[topicId]) {
      store[topicId] = {
        status: 'paused',
        currentIndex: questionIndex,
        answers: {},
        markedForReview: {},
        score: 0,
        totalQuestions: totalQuestions || 0,
        completedAt: null
      };
    }

    const t = store[topicId];
    t.currentIndex = questionIndex;
    if (totalQuestions && totalQuestions > t.totalQuestions) {
      t.totalQuestions = totalQuestions;
    }

    t.answers[questionIndex] = {
      selectedOption,
      isCorrect: !!isCorrect,
      answeredAt: new Date().toISOString()
    };

    // Calculate score
    let correctCount = 0;
    Object.values(t.answers).forEach(ans => {
      if (ans && ans.isCorrect) correctCount++;
    });
    t.score = correctCount;

    // Check status
    const answeredCount = Object.keys(t.answers).length;
    if (t.totalQuestions > 0 && answeredCount >= t.totalQuestions) {
      t.status = 'completed';
      if (!t.completedAt) t.completedAt = new Date().toISOString();
    } else if (answeredCount > 0) {
      t.status = 'paused';
    } else {
      t.status = 'unattempted';
    }

    persistQBankStore();
    if (typeof markStudyActivity === 'function') {
      markStudyActivity(true);
    }
    return t;
  }

  function toggleTopicBookmark(topicId, questionIndex) {
    const store = getQBankStore();
    if (!store[topicId]) {
      store[topicId] = {
        status: 'unattempted',
        currentIndex: questionIndex,
        answers: {},
        markedForReview: {},
        score: 0,
        totalQuestions: 0,
        completedAt: null
      };
    }
    const t = store[topicId];
    if (!t.markedForReview) t.markedForReview = {};
    const current = !!t.markedForReview[questionIndex];
    t.markedForReview[questionIndex] = !current;
    persistQBankStore();
    return !current;
  }

  function completeTopicTest(topicId, totalQuestions) {
    const store = getQBankStore();
    if (!store[topicId]) {
      store[topicId] = {
        status: 'completed',
        currentIndex: 0,
        answers: {},
        markedForReview: {},
        score: totalQuestions || 0,
        totalQuestions: totalQuestions || 0,
        completedAt: new Date().toISOString()
      };
    }
    const t = store[topicId];
    t.status = 'completed';
    t.completedAt = new Date().toISOString();
    if (totalQuestions) {
      t.totalQuestions = totalQuestions;
    }

    let correctCount = 0;
    const ansList = Object.values(t.answers || {});
    if (ansList.length > 0) {
      ansList.forEach(ans => {
        if (ans && ans.isCorrect) correctCount++;
      });
      t.score = correctCount;
    } else {
      t.score = t.totalQuestions || totalQuestions || 0;
    }

    persistQBankStore();
    if (typeof markStudyActivity === 'function') markStudyActivity(true);
    return t;
  }

  function resetTopicTest(topicId) {
    const store = getQBankStore();
    if (store[topicId]) {
      delete store[topicId];
      persistQBankStore();
    }
  }

  // --- Chapter Level Statistics ---
  function getChapterQBankStats(subjectIdOrObj, chapterName) {
    const subjectQBank = window.FlowMD.qbankData ? window.FlowMD.qbankData.getSubjectQBank(subjectIdOrObj) : null;
    if (!subjectQBank || !subjectQBank.chapters) {
      return { totalTopics: 0, completedTopics: 0, totalQuestions: 0, attemptedQuestions: 0, percentage: 0, allDone: false };
    }

    const chap = subjectQBank.chapters.find(c => c && (c.name === chapterName || (c.id && c.id === chapterName)));
    if (!chap || !chap.topics) {
      return { totalTopics: 0, completedTopics: 0, totalQuestions: 0, attemptedQuestions: 0, percentage: 0, allDone: false };
    }

    let totalTopics = 0;
    let completedTopics = 0;
    let totalQuestions = 0;
    let attemptedQuestions = 0;
    let correctQuestions = 0;

    chap.topics.forEach(top => {
      totalTopics++;
      const qCount = (top.questions && top.questions.length) || top.mcqCount || 15;
      totalQuestions += qCount;

      const prog = getTopicProgress(top.id);
      const isCompleted = prog.status === 'completed';
      const ansKeys = Object.keys(prog.answers || {});
      const topicSolved = isCompleted ? qCount : Math.min(qCount, ansKeys.length);
      attemptedQuestions += topicSolved;
      correctQuestions += isCompleted ? (prog.score || qCount) : (prog.score || 0);

      if (isCompleted || (ansKeys.length >= qCount && qCount > 0)) {
        completedTopics++;
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((attemptedQuestions / totalQuestions) * 100) : 0;
    const allDone = totalTopics > 0 && completedTopics === totalTopics;

    return {
      totalTopics,
      completedTopics,
      totalQuestions,
      attemptedQuestions,
      correctQuestions,
      percentage,
      allDone
    };
  }

  // --- Subject Aggregate Statistics ---
  function getSubjectQBankStats(subjectIdOrObj) {
    const subjectQBank = window.FlowMD.qbankData ? window.FlowMD.qbankData.getSubjectQBank(subjectIdOrObj) : null;
    if (!subjectQBank || !subjectQBank.chapters) {
      return { totalTopics: 0, completedTopics: 0, pausedTopics: 0, unattemptedTopics: 0, totalQuestions: 0, attemptedQuestions: 0, correctQuestions: 0, percentage: 0, accuracy: 0 };
    }

    let totalTopics = 0;
    let completedTopics = 0;
    let pausedTopics = 0;
    let unattemptedTopics = 0;
    let totalQuestions = 0;
    let attemptedQuestions = 0;
    let correctQuestions = 0;

    subjectQBank.chapters.forEach(chap => {
      (chap.topics || []).forEach(top => {
        totalTopics++;
        const qCount = (top.questions && top.questions.length) || top.mcqCount || 15;
        totalQuestions += qCount;

        const prog = getTopicProgress(top.id);
        const isCompleted = prog.status === 'completed';
        const answeredKeys = Object.keys(prog.answers || {});
        const ansCount = answeredKeys.length;
        const topicSolved = isCompleted ? qCount : Math.min(qCount, ansCount);

        attemptedQuestions += topicSolved;
        correctQuestions += isCompleted ? (prog.score || qCount) : (prog.score || 0);

        if (isCompleted || (ansCount >= qCount && qCount > 0)) {
          completedTopics++;
        } else if (prog.status === 'paused' || ansCount > 0) {
          pausedTopics++;
        } else {
          unattemptedTopics++;
        }
      });
    });

    const percentage = totalQuestions > 0 ? Math.round((attemptedQuestions / totalQuestions) * 100) : 0;
    const accuracy = attemptedQuestions > 0 ? Math.round((correctQuestions / attemptedQuestions) * 100) : 0;

    return {
      totalTopics,
      completedTopics,
      pausedTopics,
      unattemptedTopics,
      totalQuestions,
      attemptedQuestions,
      correctQuestions,
      percentage,
      accuracy
    };
  }

  // Expose
  window.FlowMD.qbankStore = {
    getTopicProgress,
    saveTopicAnswer,
    toggleTopicBookmark,
    completeTopicTest,
    resetTopicTest,
    getChapterQBankStats,
    getSubjectQBankStats,
    getQBankStore
  };
})();
