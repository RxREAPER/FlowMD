/* ============================================================
   FLOWMD V2 — 16-BIT RETRO RPG PRESENTATION LAYER
   Cohesive Pixel-Art Design System, Arcade Controls, & HUD Meters
   Complete Redesign of Presentation Layer while preserving 100% logic parity
   ============================================================ */

(function () {
  'use strict';

  // --- Constants & LocalStorage Keys ---
  const STORAGE_KEYS = {
    COMPLETED_VIDEOS: 'marrow_planner_completed_videos',
    GOALS: 'marrow_planner_goals',
    THEME: 'marrow_planner_theme',
    STREAK: 'marrow_planner_streak',
    DAILY_BATCH: 'marrow_planner_daily_batch',
    PERSONAL: 'marrow_planner_personal',
    URGENCY: 'marrow_planner_urgency',
    DAILY_HISTORY: 'marrow_planner_daily_history',
    QUEUE_BATCH: 'marrow_planner_queue_completed_in_batch',
    QUEUE_BATCH_VIDEOS: 'marrow_planner_queue_batch_videos',
    TUTORIAL_SEEN: 'flowmd_tutorial_seen',
    // Dual-Subject Tracking v2
    PLANS: 'flowmd_plans_v2',
    DAILY_HISTORY_BY_SUBJECT: 'flowmd_daily_history_by_subject'
  };

  // --- Dual-Subject Plan Defaults ---
  const DEFAULT_PLAN = (id, label, accentColor, subjectName) => ({
    id,
    label,
    accentColor,
    targetSubject: subjectName || 'Entire Syllabus',
    targetDate: '2026-08-15',
    videosPerDay: 8,
    videosPerWeek: 56,
    videosPerMonth: 240,
    dailyTargetHours: 3.5,
    queueBatchVideoIds: [],
    queueCompletedInBatch: 0
  });

  const PLAN_A_ACCENT = '#3b82f6';   // cobalt blue
  const PLAN_B_ACCENT = '#f43f5e';   // rose pink

  const DEFAULT_PERSONAL = {
    doctorName: 'Dr. Aspirant'
  };

  const DEFAULT_GOALS = {
    goalMode: 'video',
    targetDate: '2026-08-15',
    videosPerDay: 8,
    videosPerWeek: 56,
    videosPerMonth: 202,
    dailyTargetHours: 3.5,
    weeklyTargetHours: 24.5,
    monthlyTargetHours: 105,
    targetSubject: 'Entire Syllabus',
    visibleCards: { daily: true, weekly: true, monthly: true }
  };

  const SUBJECT_ICONS = {
    anatomy: 'icons/anatomy.png',
    physiology: 'icons/physiology.png',
    biochemistry: 'icons/biochemistry.png',
    pathology: 'icons/pathology.png',
    pharmacology: 'icons/pharmacology.png',
    microbiology: 'icons/microbiology.png',
    community_medicine: 'icons/community_medicine.png',
    forensic_medicine: 'icons/forensic_medicine.png',
    ophthalmology: 'icons/ophthalmology.png',
    otorhinolaryngology__ent_: 'icons/otorhinolaryngology__ent_.png',
    anaesthesia: 'icons/anaesthesia.png',
    dermatology: 'icons/dermatology.png',
    psychiatry: 'icons/psychiatry.png',
    radiology: 'icons/radiology.png',
    medicine: 'icons/medicine.png',
    surgery: 'icons/surgery.png',
    orthopaedics: 'icons/orthopaedics.png',
    paediatrics: 'icons/paediatrics.png',
    obstetrics___gynaecology: 'icons/obstetrics___gynaecology.png'
  };

  // --- Pxlkit Crisp Pixel SVG Helpers ---
  const PXL_ICONS = {
    fire: `<svg viewBox="0 0 16 16" width="18" height="18" class="pxl-icon-svg" fill="none"><path fill="#f59e0b" d="M7 1h2v3H7zM5 4h6v2H5z"/><path fill="#ef4444" d="M4 6h8v4H4z"/><path fill="#ffd700" d="M6 8h4v4H6z"/><path fill="#ef4444" d="M3 10h10v4H3zM5 14h6v2H5z"/></svg>`,
    trophy: `<svg viewBox="0 0 16 16" width="18" height="18" class="pxl-icon-svg" fill="none"><path fill="#ffd700" d="M3 2h10v2H3zM2 4h12v4H2zM4 8h8v2H4zM6 10h4v2H6zM5 12h6v2H5zM3 14h10v2H3z"/><path fill="#f59e0b" d="M5 5h6v3H5z"/></svg>`,
    rocket: `<svg viewBox="0 0 16 16" width="18" height="18" class="pxl-icon-svg" fill="none"><path fill="#3b82f6" d="M7 1h2v2H7zM6 3h4v3H6z"/><path fill="#93c5fd" d="M5 6h6v4H5z"/><path fill="#ef4444" d="M3 10h2v3H3zM11 10h2v3h-2z"/><path fill="#ffd700" d="M7 10h2v5H7z"/></svg>`,
    flag: `<svg viewBox="0 0 16 16" width="18" height="18" class="pxl-icon-svg" fill="none"><path fill="#3b82f6" d="M3 2h8v2H3zM3 4h10v4H3zM3 8h7v2H3z"/><path fill="#64748b" d="M2 1h2v14H2z"/></svg>`,
    check: `<svg viewBox="0 0 16 16" width="18" height="18" class="pxl-icon-svg" fill="none"><path fill="#10b981" d="M12 4h2v2h-2zM10 6h2v2h-2zM8 8h2v2H8zM6 10h2v2H6zM4 8h2v2H4zM2 6h2v2H2z"/></svg>`
  };

  function getSubjectIconSrc(subjectIdOrName) {
    if (!subjectIdOrName) return 'icons/medicine.png';
    const key = subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (SUBJECT_ICONS[key]) return SUBJECT_ICONS[key];
    for (const [id, src] of Object.entries(SUBJECT_ICONS)) {
      if (key.includes(id) || id.includes(key)) return src;
    }
    return 'icons/medicine.png';
  }

  function getDataset() {
    if (typeof syllabusData !== 'undefined' && Array.isArray(syllabusData)) return syllabusData;
    if (typeof window !== 'undefined' && window.syllabusData && Array.isArray(window.syllabusData)) return window.syllabusData;
    return [];
  }

  // --- App State ---
  let state = {
    currentView: 'dashboard',
    activeSubjectId: 'anatomy',
    completedVideos: {},
    expandedChapters: {},
    goals: { ...DEFAULT_GOALS },
    personal: { ...DEFAULT_PERSONAL },
    theme: 'dark',
    searchQuery: '',
    streakData: { lastStudyDate: null, currentStreak: 0 },
    dailyHistory: {},
    queueCompletedInBatch: 0,
    queueBatchVideoIds: [],
    hasSeenTutorial: false,
    // Dual-Subject Tracking v2
    plans: [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT, 'Entire Syllabus')],
    activePlanId: 'plan_a',
    dailyHistoryBySubject: {}
  };

  const DOM = {};

  // --- Initialization ---
  function init() {
    loadState();
    cacheDOM();
    applyTheme(state.theme);
    bindEvents();
    initFirebaseSync();
    render();
    resetPageScrollTop();

    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      state.canInstallPWA = true;
      if (typeof render === 'function' && DOM.appMain) render();
    });

    // Guided tutorial walk-through only runs once per device
    if (!state.hasSeenTutorial) {
      setTimeout(() => openGuidedTutorial(0), 600);
    }
  }

  // --- State Persistence & Cloud Sync ---
  function loadState() {
    try {
      const savedVideos = localStorage.getItem(STORAGE_KEYS.COMPLETED_VIDEOS);
      if (savedVideos) state.completedVideos = JSON.parse(savedVideos);

      const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (savedGoals) state.goals = { ...DEFAULT_GOALS, ...JSON.parse(savedGoals) };

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        state.theme = savedTheme;
      } else {
        state.theme = 'dark';
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
      }

      const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (savedStreak) state.streakData = JSON.parse(savedStreak);

      const savedPersonal = localStorage.getItem(STORAGE_KEYS.PERSONAL);
      if (savedPersonal) state.personal = { ...DEFAULT_PERSONAL, ...JSON.parse(savedPersonal) };

      const savedHistory = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY);
      if (savedHistory) state.dailyHistory = JSON.parse(savedHistory);

      const savedQueueBatch = localStorage.getItem(STORAGE_KEYS.QUEUE_BATCH);
      if (savedQueueBatch !== null) state.queueCompletedInBatch = parseInt(savedQueueBatch) || 0;

      const savedBatchVids = localStorage.getItem(STORAGE_KEYS.QUEUE_BATCH_VIDEOS);
      if (savedBatchVids) state.queueBatchVideoIds = JSON.parse(savedBatchVids);

      const savedTutorial = localStorage.getItem(STORAGE_KEYS.TUTORIAL_SEEN);
      state.hasSeenTutorial = (savedTutorial === 'true');

      // --- Dual-Subject Tracking v2: load plans ---
      const savedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (savedPlans) {
        const parsed = JSON.parse(savedPlans);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.plans = parsed;
        }
      } else {
        // Migrate legacy single-subject state to Plan A
        migrateStateToPlans();
      }

      const savedHistBySubject = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT);
      if (savedHistBySubject) state.dailyHistoryBySubject = JSON.parse(savedHistBySubject);

    } catch (e) {
      console.warn('Error loading state:', e);
    }
  }

  // --- Migrate legacy single-plan state → plans[] ---
  function migrateStateToPlans() {
    const legacySub = (state.goals && state.goals.targetSubject) || 'Entire Syllabus';
    const legacyDate = (state.goals && state.goals.targetDate) || '2026-08-15';
    const legacyVids = (state.goals && state.goals.videosPerDay) || 8;
    const legacyHours = (state.goals && state.goals.dailyTargetHours) || 3.5;
    const legacyBatch = Array.isArray(state.queueBatchVideoIds) ? state.queueBatchVideoIds : [];
    const legacyDone = state.queueCompletedInBatch || 0;

    state.plans = [{
      id: 'plan_a',
      label: 'Plan A',
      accentColor: PLAN_A_ACCENT,
      targetSubject: legacySub,
      targetDate: legacyDate,
      videosPerDay: legacyVids,
      videosPerWeek: legacyVids * 7,
      videosPerMonth: legacyVids * 30,
      dailyTargetHours: legacyHours,
      queueBatchVideoIds: legacyBatch,
      queueCompletedInBatch: legacyDone
    }];
  }

  let cloudSyncTimeout = null;
  let deferredInstallPrompt = null;
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETED_VIDEOS, JSON.stringify(state.completedVideos));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
      localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(state.streakData));
      localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(state.personal));
      localStorage.setItem(STORAGE_KEYS.DAILY_HISTORY, JSON.stringify(state.dailyHistory || {}));
      localStorage.setItem(STORAGE_KEYS.QUEUE_BATCH, (state.queueCompletedInBatch || 0).toString());
      localStorage.setItem(STORAGE_KEYS.QUEUE_BATCH_VIDEOS, JSON.stringify(state.queueBatchVideoIds || []));
      localStorage.setItem(STORAGE_KEYS.TUTORIAL_SEEN, state.hasSeenTutorial ? 'true' : 'false');
      // Dual-Subject Tracking v2
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(state.plans || []));
      localStorage.setItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT, JSON.stringify(state.dailyHistoryBySubject || {}));

      if (window.FirebaseSync && window.FirebaseSync.currentUser) {
        if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
        cloudSyncTimeout = setTimeout(() => {
          window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state);
        }, 800);
      }
    } catch (e) {
      console.warn('Error saving state:', e);
    }
  }

  function markStudyActivity(isAdding = true) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!state.streakData) state.streakData = { lastStudyDate: null, currentStreak: 0 };
    if (!state.dailyHistory) state.dailyHistory = {};

    const curCount = state.dailyHistory[todayStr] || 0;
    if (isAdding) {
      state.dailyHistory[todayStr] = curCount + 1;
    } else {
      state.dailyHistory[todayStr] = Math.max(0, curCount - 1);
    }

    if (isAdding) {
      if (state.streakData.lastStudyDate !== todayStr) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (state.streakData.lastStudyDate === yesterday) {
          state.streakData.currentStreak = (state.streakData.currentStreak || 0) + 1;
        } else {
          state.streakData.currentStreak = 1;
        }
        state.streakData.lastStudyDate = todayStr;
      }
    }
    saveState();
  }

  function getStudyStreak() {
    const streak = state.streakData || { lastStudyDate: null, currentStreak: 0 };
    return streak.currentStreak || 0;
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

  // --- Per-Plan Queue Engine ---
  function getTodayQueueForPlan(plan) {
    const targetSub = plan.targetSubject || 'Entire Syllabus';
    const baseTargetPace = Math.max(1, parseInt(plan.videosPerDay) || 1);
    const dataset = getDataset();

    let allSubjectVideos = [];
    let subjectName = targetSub;
    let subjectObj = null;

    if (dataset.length > 0) {
      if (targetSub === 'Entire Syllabus') {
        dataset.forEach(sub => {
          if (sub && sub.chapters) {
            sub.chapters.forEach(chap => {
              if (chap && chap.videos) {
                chap.videos.forEach(v => {
                  allSubjectVideos.push({ ...v, subjectName: sub.subject, chapterName: chap.name, subjectId: sub.id });
                });
              }
            });
          }
        });
      } else {
        subjectObj = dataset.find(s => s && (s.subject === targetSub || s.id === targetSub));
        if (subjectObj && subjectObj.chapters) {
          subjectName = subjectObj.subject;
          subjectObj.chapters.forEach(chap => {
            if (chap && chap.videos) {
              chap.videos.forEach(v => {
                allSubjectVideos.push({ ...v, subjectName: subjectObj.subject, chapterName: chap.name, subjectId: subjectObj.id });
              });
            }
          });
        }
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (plan.lastBatchDate !== todayStr) {
      plan.lastBatchDate = todayStr;
      plan.extraBatchesCompletedToday = 0;
    }

    if (!Array.isArray(plan.queueBatchVideoIds)) plan.queueBatchVideoIds = [];

    const existingBatchVideos = allSubjectVideos.filter(v => plan.queueBatchVideoIds.includes(v.id));
    const targetBatchSize = Math.min(baseTargetPace, allSubjectVideos.length || baseTargetPace);

    if (existingBatchVideos.length === 0 || existingBatchVideos.length !== targetBatchSize) {
      const uncompletedCandidates = allSubjectVideos.filter(v => !state.completedVideos[v.id]);
      const newBatch = uncompletedCandidates.slice(0, baseTargetPace);
      plan.queueBatchVideoIds = newBatch.map(v => v.id);
      saveState();
    }

    const todaysQueueVideos = allSubjectVideos.filter(v => plan.queueBatchVideoIds.includes(v.id));
    const queueCompletedInBatch = todaysQueueVideos.filter(v => !!state.completedVideos[v.id]).length;
    plan.queueCompletedInBatch = queueCompletedInBatch;

    const isDailyTargetAchieved = todaysQueueVideos.length > 0 && todaysQueueVideos.every(v => !!state.completedVideos[v.id]);
    const allDone = todaysQueueVideos.length === 0;

    return {
      planId: plan.id,
      planLabel: plan.label,
      planAccentColor: plan.accentColor,
      subjectName,
      subjectId: subjectObj ? subjectObj.id : (allSubjectVideos[0] ? allSubjectVideos[0].subjectId : 'anatomy'),
      baseTargetPace,
      queueCompletedInBatch,
      isDailyTargetAchieved,
      allSubjectDone: allDone,
      videos: todaysQueueVideos
    };
  }

  // Get all active plans' queues
  function getAllPlanQueues() {
    if (!state.plans || state.plans.length === 0) {
      state.plans = [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT, 'Entire Syllabus')];
    }
    return state.plans.map(plan => getTodayQueueForPlan(plan));
  }

  // Legacy compat wrapper — used by older code paths
  function getTodaysActionQueue() {
    const queues = getAllPlanQueues();
    return queues[0] || { subjectName: 'Entire Syllabus', subjectId: 'anatomy', baseTargetPace: 8, queueCompletedInBatch: 0, isDailyTargetAchieved: false, allSubjectDone: false, videos: [] };
  }

  // Get plan by ID
  function getPlanById(planId) {
    return state.plans && state.plans.find(p => p.id === planId);
  }



  function initFirebaseSync() {
    if (!window.FirebaseSync) return;
    window.FirebaseSync.onAuthChange(async (user) => {
      if (user) {
        showToast(`Signed in as ${user.email}`, 'account_circle');
        const cloudState = await window.FirebaseSync.loadFromCloud(user.uid);
        if (cloudState) {
          if (cloudState.completedVideos) state.completedVideos = { ...state.completedVideos, ...cloudState.completedVideos };
          if (cloudState.goals) state.goals = { ...state.goals, ...cloudState.goals };
          if (cloudState.personal) state.personal = { ...state.personal, ...cloudState.personal };
          if (cloudState.dailyHistory) state.dailyHistory = { ...state.dailyHistory, ...cloudState.dailyHistory };
          if (cloudState.hasSeenTutorial !== undefined) state.hasSeenTutorial = cloudState.hasSeenTutorial;
          saveState();
        } else {
          window.FirebaseSync.syncToCloud(user.uid, state);
        }
        state.personal.isSynced = true;
        state.personal.syncEmail = user.email;
      } else {
        state.personal.isSynced = false;
        state.personal.syncEmail = '';
      }
      render();
    });
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

  // --- Deep Global Search Engine ---
  function performDeepSearch(query) {
    const dataset = getDataset();
    if (!query || !dataset || dataset.length === 0) {
      return { subjects: [], chapters: [], videos: [], totalMatches: 0 };
    }

    const q = query.toLowerCase().trim();
    const matchedSubjects = [];
    const matchedChapters = [];
    const matchedVideos = [];

    dataset.forEach(subject => {
      const subName = subject.subject || '';
      const subId = subject.id || subName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const subIcon = getSubjectIconSrc(subId);

      if (subName.toLowerCase().includes(q)) {
        matchedSubjects.push({
          id: subId,
          name: subName,
          icon: subIcon,
          chaptersCount: subject.chapters ? subject.chapters.length : 0,
          videosCount: subject.chapters ? subject.chapters.reduce((acc, c) => acc + (c.videos ? c.videos.length : 0), 0) : 0
        });
      }

      if (subject.chapters) {
        subject.chapters.forEach(chapter => {
          const chapName = chapter.name || '';
          if (chapName.toLowerCase().includes(q)) {
            matchedChapters.push({
              chapterName: chapName,
              subjectName: subName,
              subjectId: subId,
              videoCount: chapter.videos ? chapter.videos.length : 0,
              icon: subIcon
            });
          }

          if (chapter.videos) {
            chapter.videos.forEach(v => {
              const vTitle = v.title || '';
              const vNum = v.videoNumber || '';
              if (vTitle.toLowerCase().includes(q) || vNum.toLowerCase().includes(q)) {
                matchedVideos.push({
                  id: v.id,
                  title: vTitle,
                  videoNumber: vNum,
                  durationMins: v.durationMins || 0,
                  durationSecs: v.durationSecs || 0,
                  subjectName: subName,
                  subjectId: subId,
                  chapterName: chapName,
                  isCompleted: !!state.completedVideos[v.id]
                });
              }
            });
          }
        });
      }
    });

    const totalMatches = matchedSubjects.length + matchedChapters.length + matchedVideos.length;

    return {
      subjects: matchedSubjects.slice(0, 8),
      chapters: matchedChapters.slice(0, 12),
      videos: matchedVideos.slice(0, 30),
      totalMatches
    };
  }

  // --- Spotlight Search Modal Engine ---
  function openSpotlightModal(initialQuery = '') {
    const modal = document.getElementById('spotlight-search-modal');
    const input = document.getElementById('spotlight-search-input');
    if (!modal || !input) return;

    modal.style.display = 'flex';
    input.value = initialQuery || state.searchQuery || '';
    setTimeout(() => input.focus(), 50);
    renderSpotlightResults(input.value);
  }

  function closeSpotlightModal() {
    const modal = document.getElementById('spotlight-search-modal');
    if (modal) modal.style.display = 'none';
  }

  function renderSpotlightResults(query) {
    const container = document.getElementById('spotlight-results-container');
    if (!container) return;

    const q = (query || '').trim().toLowerCase();

    // Defined PxlKit PixelCommand Groups (Actions & Navigation)
    const commandGroups = [
      {
        heading: '⚡ Quick Actions',
        items: [
          { id: 'act-sync-goals', label: 'Synchronize Daily Targets & Pace', shortcut: 'Ctrl+G', icon: 'track_changes', action: () => { closeSpotlightModal(); openGoalModal(); } },
          { id: 'act-toggle-theme', label: 'Toggle Light / Dark Mode', shortcut: 'Ctrl+T', icon: 'contrast', action: () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(state.theme); saveState(); } },
          { id: 'act-profile', label: 'Open Doctor Profile & Exam Settings', shortcut: 'Ctrl+P', icon: 'account_circle', action: () => { closeSpotlightModal(); openProfileBottomSheet(); } }
        ]
      },
      {
        heading: '🧭 Navigation',
        items: [
          { id: 'nav-home', label: 'Go to Dashboard', keywords: ['home', 'dashboard', 'start'], icon: 'dashboard', action: () => { closeSpotlightModal(); switchView('dashboard'); } },
          { id: 'nav-curriculum', label: 'Go to Curriculum & Subjects', keywords: ['subjects', 'syllabus', 'lectures', 'curriculum'], icon: 'menu_book', action: () => { closeSpotlightModal(); switchView('curriculum'); } },
          { id: 'nav-analytics', label: 'Go to Analytics & Velocity', keywords: ['stats', 'progress', 'charts', 'analytics'], icon: 'show_chart', action: () => { closeSpotlightModal(); switchView('analytics'); } },
          { id: 'nav-goals', label: 'Go to Preparation Goals', keywords: ['targets', 'schedule', 'pace', 'goals'], icon: 'flag', action: () => { closeSpotlightModal(); switchView('goals'); } },
          { id: 'nav-profile', label: 'Go to Doctor Profile', keywords: ['account', 'doctor', 'preferences', 'profile'], icon: 'person', action: () => { closeSpotlightModal(); switchView('profile'); } }
        ]
      }
    ];

    if (!q) {
      // Default PxlKit PixelCommand Palette Overview
      container.innerHTML = `
        ${commandGroups.map(grp => `
          <div class="pxl-command-group-header">${grp.heading}</div>
          ${grp.items.map(item => `
            <div class="pxl-command-item cmd-action-btn" data-cmd-id="${item.id}">
              <div class="pxl-command-label">
                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--accent-primary);">${item.icon}</span>
                <span>${item.label}</span>
              </div>
              <span class="pxl-command-shortcut">${item.shortcut || 'GO'}</span>
            </div>
          `).join('')}
        `).join('')}

        <div class="pxl-command-group-header">📚 Top Medical Subjects</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; margin-top: 6px;">
          ${(typeof MARROW_CURRICULUM !== 'undefined' ? MARROW_CURRICULUM : []).slice(0, 8).map(s => `
            <div class="v2-pixel-card spotlight-item" data-type="subject" data-id="${s.id}" style="cursor: pointer; padding: 8px 10px; display: flex; align-items: center; gap: 8px;">
              <img src="${s.icon}" style="width: 22px; height: 22px; object-fit: contain;" alt="${s.name}">
              <span style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 700; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${s.name}</span>
            </div>
          `).join('')}
        </div>
      `;

      commandGroups.forEach(grp => {
        grp.items.forEach(item => {
          container.querySelector(`[data-cmd-id="${item.id}"]`)?.addEventListener('click', item.action);
        });
      });

      document.querySelectorAll('.spotlight-item').forEach(item => {
        item.addEventListener('click', () => {
          state.activeSubjectId = item.getAttribute('data-id');
          closeSpotlightModal();
          switchView('subject_detail');
        });
      });

      return;
    }

    // Filtered Search Results + Matching Commands
    const matchingCmds = [];
    commandGroups.forEach(grp => {
      grp.items.forEach(item => {
        const matchesLabel = item.label.toLowerCase().includes(q);
        const matchesKw = item.keywords && item.keywords.some(k => k.toLowerCase().includes(q));
        if (matchesLabel || matchesKw) {
          matchingCmds.push(item);
        }
      });
    });

    const searchData = performDeepSearch(q);

    if (matchingCmds.length === 0 && searchData.totalMatches === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 0; font-family: var(--font-hud); font-size: 1.1rem;">
          No matching commands, topics, or subjects found for "${q}".
        </div>
      `;
      return;
    }

    container.innerHTML = `
      ${matchingCmds.length > 0 ? `
        <div class="pxl-command-group-header">⚡ Matching Commands (${matchingCmds.length})</div>
        ${matchingCmds.map(item => `
          <div class="pxl-command-item cmd-action-btn" data-cmd-id="${item.id}">
            <div class="pxl-command-label">
              <span class="material-symbols-outlined" style="font-size: 18px; color: var(--accent-primary);">${item.icon}</span>
              <span>${item.label}</span>
            </div>
            <span class="pxl-command-shortcut">${item.shortcut || 'GO'}</span>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.subjects.length > 0 ? `
        <div class="pxl-command-group-header">📚 Subjects (${searchData.subjects.length})</div>
        ${searchData.subjects.map(s => `
          <div class="v2-pixel-card spotlight-item" data-type="subject" data-id="${s.id}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${s.icon}" style="width: 28px; height: 28px; object-fit: contain;" alt="${s.name}">
              <span style="font-weight: 700; font-size: 0.95rem; font-family: var(--font-display);">${s.name}</span>
            </div>
            <span class="v2-hud-badge">${s.videosCount} vids</span>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.chapters.length > 0 ? `
        <div class="pxl-command-group-header">📖 Chapters (${searchData.chapters.length})</div>
        ${searchData.chapters.map(c => `
          <div class="v2-pixel-card spotlight-item" data-type="chapter" data-id="${c.subjectId}" data-chap="${c.chapterName}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 0.92rem; font-family: var(--font-display);">${c.chapterName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${c.subjectName} • ${c.videoCount} videos</div>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.videos.length > 0 ? `
        <div class="pxl-command-group-header">🎬 Video Topics (${searchData.videos.length})</div>
        <div class="v2-quest-card" style="padding-top: 14px; margin-top: 6px;">
          ${searchData.videos.map(v => {
            const isDone = v.isCompleted;
            let vNum = v.videoNumber || '#1';
            vNum = '#' + vNum.replace(/^#+/, '');
            return `
              <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                <label class="v2-pixel-checkbox-label">
                  <input type="checkbox" class="spotlight-vid-chk" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                  <span class="v2-pixel-checkbox-box"></span>
                  <div>
                    <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-hud); margin-top: 2px;">
                      <span>${v.subjectName}</span> • <span>${v.chapterName}</span>
                    </div>
                  </div>
                </label>
                <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">${v.durationMins || 0}m ${v.durationSecs || 0}s</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    `;

    matchingCmds.forEach(item => {
      container.querySelector(`[data-cmd-id="${item.id}"]`)?.addEventListener('click', item.action);
    });

    document.querySelectorAll('.spotlight-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        const id = item.getAttribute('data-id');
        state.activeSubjectId = id;
        if (type === 'chapter') {
          const chap = item.getAttribute('data-chap');
          state.expandedChapters[chap] = true;
        }
        closeSpotlightModal();
        switchView('subject_detail');
      });
    });

    document.querySelectorAll('.spotlight-vid-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          showToast('Completed Video!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        renderSpotlightResults(query);
      });
    });
  }



  // --- Cache DOM Elements ---
  function cacheDOM() {
    DOM.appMain = document.getElementById('app-main');
    DOM.navItems = document.querySelectorAll('.android-nav-item');
    DOM.btnToggleSearch = document.getElementById('btn-toggle-search');
    DOM.themeToggleBtn = document.getElementById('theme-toggle-btn');
    DOM.topbarUserProfile = document.getElementById('topbar-user-profile');
    DOM.topbarAvatarInitials = document.getElementById('topbar-avatar-initials');
    DOM.bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
    DOM.bottomSheetContent = document.getElementById('bottom-sheet-content');
    DOM.goalModal = document.getElementById('goal-modal');
    DOM.modalCloseBtn = document.getElementById('modal-close-btn');
    DOM.btnCancelGoals = document.getElementById('btn-cancel-goals');
    DOM.btnApplyGoals = document.getElementById('btn-apply-goals');
    DOM.brandHomeLink = document.getElementById('brand-home-link');
  }

  // --- Apply Goals Action Helper ---
  function applyGoalsAction(e) {
    if (e) e.preventDefault();
    const elDate = document.getElementById('input-target-date');
    state.goals.targetDate = elDate ? elDate.value : '2026-08-15';
    const elSub = document.getElementById('select-target-subject');
    state.goals.targetSubject = elSub ? elSub.value : 'Entire Syllabus';

    if (state.goals.goalMode === 'video') {
      const elD = document.getElementById('input-videos-per-day');
      state.goals.videosPerDay = parseInt(elD ? elD.value : 8) || 1;
      const elW = document.getElementById('input-videos-per-week');
      state.goals.videosPerWeek = parseInt(elW ? elW.value : 56) || 7;
      const elM = document.getElementById('input-videos-per-month');
      state.goals.videosPerMonth = parseInt(elM ? elM.value : 202) || 30;
    } else {
      const elDH = document.getElementById('input-daily-target');
      state.goals.dailyTargetHours = parseFloat(elDH ? elDH.value : 3.5) || 0.5;
      const elWH = document.getElementById('input-weekly-target');
      state.goals.weeklyTargetHours = parseFloat(elWH ? elWH.value : 24.5) || 3.5;
      const elMH = document.getElementById('input-monthly-target');
      state.goals.monthlyTargetHours = parseFloat(elMH ? elMH.value : 105) || 15;
    }

    state.queueBatchVideoIds = [];
    state.queueCompletedInBatch = 0;
    saveState();
    closeGoalModal();
    showToast('Study pace & targets synchronized!', 'check_circle');
    render();
  }

  // --- Interactive Info Popover Helper ---
  function openInfoModal(title, bodyHTML) {
    const modal = document.getElementById('info-popover-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `<span class="material-symbols-outlined">help</span> <span style="font-family: var(--font-display);">${title}</span>`;
    bodyEl.innerHTML = bodyHTML;
    modal.style.display = 'flex';
  }

  function closeInfoModal() {
    const modal = document.getElementById('info-popover-modal');
    if (modal) modal.style.display = 'none';
  }

  // --- Event Listeners ---
  function bindEvents() {
    DOM.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) switchView(view);
      });
    });

    if (DOM.brandHomeLink) {
      DOM.brandHomeLink.addEventListener('click', () => switchView('dashboard'));
    }

    if (DOM.btnToggleSearch) {
      DOM.btnToggleSearch.addEventListener('click', () => openSpotlightModal());
    }

    document.getElementById('spotlight-close-btn')?.addEventListener('click', closeSpotlightModal);
    document.getElementById('spotlight-search-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('spotlight-search-modal')) closeSpotlightModal();
    });

    document.getElementById('spotlight-search-input')?.addEventListener('input', (e) => {
      renderSpotlightResults(e.target.value);
    });



    // Global Keyboard Shortcut ('/' or Cmd/Ctrl+K to open Spotlight)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSpotlightModal();
        closeInfoModal();
        closeGoalModal();
        return;
      }

      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openSpotlightModal();
      }
    });

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(state.theme);
        saveState();
      });
    }

    // --- Guided Tutorial Modal Controllers ---
    document.getElementById('tut-btn-next')?.addEventListener('click', () => {
      if (currentTutorialStep >= TUTORIAL_STEPS.length - 1) {
        closeGuidedTutorial();
        showToast('Guided Tour Complete! Welcome to FlowMD.', 'rocket_launch');
      } else {
        openGuidedTutorial(currentTutorialStep + 1);
      }
    });
    document.getElementById('tut-btn-skip')?.addEventListener('click', closeGuidedTutorial);
    document.getElementById('tut-btn-close-x')?.addEventListener('click', closeGuidedTutorial);



    if (DOM.topbarUserProfile) {
      DOM.topbarUserProfile.addEventListener('click', openProfileBottomSheet);
    }

    if (DOM.bottomSheetOverlay) {
      DOM.bottomSheetOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.bottomSheetOverlay) closeBottomSheet();
      });
    }

    if (DOM.modalCloseBtn) DOM.modalCloseBtn.addEventListener('click', closeGoalModal);
    if (DOM.btnCancelGoals) DOM.btnCancelGoals.addEventListener('click', closeGoalModal);
    if (DOM.goalModal) {
      DOM.goalModal.addEventListener('click', (e) => {
        if (e.target === DOM.goalModal) closeGoalModal();
      });
    }
    
    if (DOM.btnApplyGoals) DOM.btnApplyGoals.addEventListener('click', applyGoalsAction);

    // Info Modal Event Handlers
    document.getElementById('info-modal-close')?.addEventListener('click', closeInfoModal);
    document.getElementById('info-modal-ok-btn')?.addEventListener('click', closeInfoModal);
    document.getElementById('info-popover-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('info-popover-modal')) closeInfoModal();
    });

    // Global Help Icon (?) Popovers Delegate
    document.addEventListener('click', (e) => {
      const helpBtn = e.target.closest('.help-icon-btn');
      if (helpBtn) {
        e.preventDefault();
        e.stopPropagation();
        const type = helpBtn.getAttribute('data-help-type');

        if (type === 'projected-date') {
          openInfoModal(
            'Projected Completion Date',
            `<p style="margin-bottom: 8px;"><strong>Formula:</strong> <code>(Total Syllabus Videos − Completed Videos) ÷ Daily Video Pace</code></p>
             <div class="pxl-alert pxl-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">check_circle</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Dynamic Real-Time Shifting</div>
                 <div class="pxl-alert-message">This ETA dynamically adjusts as you complete videos or change daily pace target in Profile settings.</div>
               </div>
             </div>`
          );
        } else if (type === 'ideal-actual') {
          openInfoModal(
            'Ideal vs Actual Schedule Delta',
            `<p style="margin-bottom: 8px;"><strong>Schedule Delta:</strong> Compares actual 7-day completed lectures against your target quota (Daily Target × 7).</p>
             <div class="pxl-alert pxl-alert-warning" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">warning</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Automatic Schedule Recovery</div>
                 <div class="pxl-alert-message">When behind pace, FlowMD calculates exact extra daily videos needed to recover without burn-out.</div>
               </div>
             </div>`
          );
        } else if (type === 'action-queue') {
          openInfoModal(
            "Today's Action Queue",
            `<p style="margin-bottom: 8px;"><strong>Daily Target Batch:</strong> Locks your daily quota of video lectures (e.g. 3 videos).</p>
             <div class="pxl-alert pxl-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">rocket_launch</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Advance Batch Early</div>
                 <div class="pxl-alert-message">Completing your daily batch unlocks 🚀 Advance to Next Target Batch early to stay ahead of schedule.</div>
               </div>
             </div>`
          );
        }
      }

      // Global Breadcrumb Delegate Handlers
      if (e.target.closest('.nav-bc-home')) {
        e.preventDefault();
        switchView('dashboard');
      } else if (e.target.closest('.nav-bc-curriculum')) {
        e.preventDefault();
        switchView('curriculum');
      }
    });
  }

  // --- FlowMD 16-Bit Pixel-Art Vector Logo Component ---
  function getFlowMDLogoSVG(theme = 'dark', mode = 'full', heightPx = 40) {
    const isDark = theme === 'dark';
    const mainColor = isDark ? '#ffffff' : '#1e293b';
    const pinkColor = isDark ? '#ff3b5c' : '#ff1f46';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';
    const scatterColor = isDark ? '#cbd5e1' : '#475569';

    if (mode === 'icon') {
      return `
        <svg viewBox="0 0 160 90" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 6px ${isDark ? 'rgba(255,59,92,0.5)' : 'rgba(255,31,70,0.3)'});" class="flowmd-pixel-icon-svg">
          <!-- Pixel Scatter (Top Left) -->
          <rect x="10" y="8" width="5" height="5" fill="${scatterColor}" />
          <rect x="18" y="4" width="5" height="5" fill="${pinkColor}" />
          <rect x="6" y="16" width="5" height="5" fill="${mainColor}" />

          <!-- Pixel Letter F -->
          <path d="M 22 18 h 45 v 10 h -32 v 16 h 26 v 10 h -26 v 30 h -13 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

          <!-- 16-Bit Pixel Heart -->
          <path d="M 68 28 h 10 v -6 h 12 v 6 h 10 v 10 h -6 v 10 h -6 v 8 h -6 v 6 h -8 v -6 h -6 v -8 h -6 v -10 h -6 Z" fill="none" stroke="${pinkColor}" stroke-width="3.2" stroke-linecap="square" />
          
          <!-- ECG Pulse Line -->
          <path d="M 18 45 h 44 l 5 -14 l 6 26 l 6 -18 l 5 6 h 50" fill="none" stroke="${pinkColor}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" />

          <!-- Pixel Letter M -->
          <path d="M 98 18 h 12 l 14 24 l 14 -24 h 12 v 56 h -12 v -34 l -14 24 h -0 l -14 -24 v 34 h -12 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

          <!-- Pixel Scatter (Bottom Right) -->
          <rect x="144" y="60" width="5" height="5" fill="${pinkColor}" />
          <rect x="152" y="68" width="5" height="5" fill="${scatterColor}" />
          <rect x="140" y="74" width="5" height="5" fill="${pinkColor}" />
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 350 100" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 12px ${pinkColor}) drop-shadow(0 0 3px ${mainColor}) drop-shadow(0 0 1px ${pinkColor});" class="flowmd-logo-svg">
        <!-- Pixel Scatter (Top Left) -->
        <rect x="8" y="6" width="5" height="5" fill="${scatterColor}" />
        <rect x="16" y="2" width="5" height="5" fill="${pinkColor}" />
        <rect x="4" y="14" width="5" height="5" fill="${mainColor}" />

        <!-- Pixel Letter F -->
        <path d="M 20 16 h 45 v 10 h -32 v 16 h 26 v 10 h -26 v 30 h -13 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

        <!-- 16-Bit Pixel Heart -->
        <path d="M 66 26 h 10 v -6 h 12 v 6 h 10 v 10 h -6 v 10 h -6 v 8 h -6 v 6 h -8 v -6 h -6 v -8 h -6 v -10 h -6 Z" fill="none" stroke="${pinkColor}" stroke-width="3.2" stroke-linecap="square" />
        
        <!-- ECG Pulse Line -->
        <path d="M 16 43 h 44 l 5 -14 l 6 26 l 6 -18 l 5 6 h 50" fill="none" stroke="${pinkColor}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" />

        <!-- Pixel Letter M -->
        <path d="M 96 16 h 12 l 14 24 l 14 -24 h 12 v 56 h -12 v -34 l -14 24 h -0 l -14 -24 v 34 h -12 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

        <!-- Pixel Scatter (Bottom Right) -->
        <rect x="142" y="58" width="5" height="5" fill="${pinkColor}" />
        <rect x="150" y="66" width="5" height="5" fill="${scatterColor}" />
        <rect x="138" y="72" width="5" height="5" fill="${pinkColor}" />

        <!-- FLowMD Typography -->
        <g transform="translate(175, 48)">
          <text x="0" y="0" fill="${mainColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">FL</text>
          
          <!-- Micro Heart for 'o' -->
          <g transform="translate(38, -18) scale(0.65)">
            <path d="M 8 6 h 5 v -3 h 6 v 3 h 5 v 5 h -3 v 5 h -3 v 4 h -3 v 3 h -4 v -3 h -3 v -4 h -3 v -5 h -3 Z" fill="${pinkColor}" />
            <path d="M 0 10 h 24" stroke="#ffffff" stroke-width="2" />
          </g>
          
          <text x="56" y="0" fill="${mainColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">w</text>
          <text x="82" y="0" fill="${pinkColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">MD</text>
        </g>

        <!-- Tagline: [ PLAN. STUDY. TRACK. SUCCEED. ] -->
        <g transform="translate(175, 68)">
          <text x="0" y="0" fill="${pinkColor}" font-family="'VT323', monospace" font-size="14" font-weight="bold">[</text>
          <text x="8" y="0" fill="${subTextColor}" font-family="'VT323', monospace" font-size="12.5" font-weight="bold" letter-spacing="1.2">PLAN. STUDY. TRACK. SUCCEED.</text>
          <text x="144" y="0" fill="${pinkColor}" font-family="'VT323', monospace" font-size="14" font-weight="bold">]</text>
        </g>
      </svg>
    `;
  }

  // --- Theme Helper ---
  function applyTheme(theme) {
    const curTheme = theme || state.theme || 'dark';

    document.documentElement.setAttribute('data-theme', curTheme);
    document.documentElement.setAttribute('data-theme-accent', 'cobalt');
    document.documentElement.setAttribute('data-shadow-style', 'offset');

    // FlowMD Logo preserved in topbar (inline SVG with theme-aware currentColor)

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = 'flowmd_mark.png';
    }
  }

  function resetPageScrollTop() {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (DOM.appMain) DOM.appMain.scrollTop = 0;
      const mainEl = document.getElementById('app-main');
      if (mainEl) mainEl.scrollTop = 0;
    } catch(e){}
  }

  // --- View Switcher ---
  function switchView(viewName) {
    if (viewName === 'goals') {
      viewName = 'profile';
    }
    state.currentView = viewName;
    DOM.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });
    render();
    resetPageScrollTop();
  }

  // --- Main Render Dispatcher ---
  function render() {
    if (!DOM.appMain) DOM.appMain = document.getElementById('app-main');
    if (!DOM.appMain) return;

    updateTopbarInitials();
    const stats = getSyllabusStats();

    if (state.currentView === 'dashboard') renderDashboardView(stats);
    else if (state.currentView === 'curriculum') renderCurriculumView(stats);
    else if (state.currentView === 'subject_detail') renderSubjectDetailView(stats);
    else if (state.currentView === 'analytics') renderAnalyticsView(stats);
    else renderProfileView(stats);
  }

  function updateTopbarInitials() {
    const docName = (state.personal && state.personal.doctorName) ? state.personal.doctorName : 'Dr. Aspirant';
    const cleanName = docName.replace(/^Dr\.?\s*/i, '').trim();
    const initials = cleanName.length >= 2 ? (cleanName.charAt(0) + cleanName.charAt(1)).toUpperCase() : (cleanName.charAt(0) || 'A').toUpperCase();
    
    const initialsElem = document.getElementById('topbar-avatar-initials');
    if (initialsElem) {
      initialsElem.textContent = initials;
    }

    const avatarBox = document.getElementById('topbar-user-profile');
    if (avatarBox) {
      avatarBox.className = `pxl-avatar pxl-avatar-sm pxl-avatar-cyan`;
    }
  }

  // --- 16-Bit RPG Subject Completion Heatmap Generator ---
  function renderPixelSubjectHeatmap(stats) {
    const subjects = (stats && stats.subjectsStats) || [];
    let countCritical = 0;
    let countPace = 0;
    let countAdvanced = 0;
    let countMastered = 0;

    subjects.forEach(sub => {
      if (sub.percentage >= 75) countMastered++;
      else if (sub.percentage >= 50) countAdvanced++;
      else if (sub.percentage >= 25) countPace++;
      else countCritical++;
    });

    const overallPct = stats ? stats.percentage : 0;

    return `
      <!-- PxlKit 16-Bit RPG Subject Completion Heatmap Command HUD -->
      <div class="pxl-feature-card pxl-subject-heatmap-card" style="margin-top: 24px; margin-bottom: 24px; padding: 20px; background-color: var(--retro-surface, #0d1017); border: 2px solid var(--retro-cyan, #00f0ff); box-shadow: 4px 4px 0 0 #000000;">
        
        <!-- Header Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid var(--retro-border, #282f42); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg class="pxl-icon" viewBox="0 0 16 16" width="20" height="20" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#00f0ff" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="2" width="5" height="5" fill="#00ff88" stroke="#000000" stroke-width="1"/>
              <rect x="2" y="9" width="5" height="5" fill="#ffaa00" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="9" width="5" height="5" fill="#ff5555" stroke="#000000" stroke-width="1"/>
            </svg>
            <h3 style="font-family: var(--font-display), 'Pixelify Sans', monospace; font-size: 1.15rem; font-weight: 700; color: var(--retro-cyan, #00f0ff); margin: 0; display: flex; align-items: center; gap: 6px;">
              SUBJECT COMPLETION HEATMAP
            </h3>
            <span class="help-icon-btn" data-help-type="subject-heatmap" title="Subject Mastery Tier Rules">
              <svg class="pxl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none">
                <circle cx="8" cy="8" r="7" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" stroke-width="2" />
                <path d="M8 4.5V5.5M8 7.5V11.5" stroke="#ffffff" stroke-width="2" stroke-linecap="square" />
              </svg>
            </span>
          </div>
          
          <!-- Live Mastery Counter Badge -->
          <span class="v2-hud-badge" style="color: var(--retro-gold, #ffcc00); border-color: var(--retro-gold, #ffcc00); font-family: var(--font-hud); font-size: 0.85rem;">
            OVERALL MASTERY: ${overallPct}%
          </span>
        </div>

        <!-- Telemetry Overview Bar -->
        <div class="pxl-heatmap-telemetry-bar">
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #ff5555;"></span>
            <span class="pxl-stat-lbl">CRITICAL (&lt;25%):</span>
            <span class="pxl-stat-val" style="color: #ff5555;">${countCritical}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #ffaa00;"></span>
            <span class="pxl-stat-lbl">IN PROGRESS (25-50%):</span>
            <span class="pxl-stat-val" style="color: #ffaa00;">${countPace}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #00f0ff;"></span>
            <span class="pxl-stat-lbl">ADVANCED (50-75%):</span>
            <span class="pxl-stat-val" style="color: #00f0ff;">${countAdvanced}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #00ff88;"></span>
            <span class="pxl-stat-lbl">MASTERED (75%+):</span>
            <span class="pxl-stat-val" style="color: #00ff88;">${countMastered}</span>
          </div>
        </div>

        <!-- Interactive 16-Bit Legend Filter Bar -->
        <div class="pxl-heatmap-filter-bar">
          <span style="font-family: var(--font-hud); font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">FILTER TIERS:</span>
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="pxl-heatmap-filter-btn active" data-filter="all">ALL (${subjects.length})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-critical" data-filter="critical">&lt;25% (${countCritical})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-pace" data-filter="pace">25%–50% (${countPace})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-advanced" data-filter="advanced">50%–75% (${countAdvanced})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-mastered" data-filter="mastered">75%+ (${countMastered})</button>
          </div>
        </div>

        <!-- 16-Bit Pixel Heatmap Grid -->
        <div class="pxl-heatmap-grid">
          ${subjects.map(sub => {
            let tierClass = 'critical';
            let tierColor = '#ff5555';
            let tierBg = 'rgba(255, 85, 85, 0.12)';
            
            if (sub.percentage >= 75) {
              tierClass = 'mastered';
              tierColor = '#00ff88';
              tierBg = 'rgba(0, 255, 136, 0.14)';
            } else if (sub.percentage >= 50) {
              tierClass = 'advanced';
              tierColor = '#00f0ff';
              tierBg = 'rgba(0, 240, 255, 0.14)';
            } else if (sub.percentage >= 25) {
              tierClass = 'pace';
              tierColor = '#ffaa00';
              tierBg = 'rgba(255, 170, 0, 0.12)';
            }

            return `
              <div class="pxl-heatmap-tile subject-card" data-subject-id="${sub.id}" data-tier="${tierClass}" title="Click to open ${sub.name}: ${sub.percentage.toFixed(1)}% (${sub.completedVideos}/${sub.totalVideos} videos)" style="border-color: ${tierColor}; background-color: ${tierBg};">
                
                <!-- Top Icon & Tier Badge -->
                <div class="pxl-tile-top">
                  <div class="pxl-tile-icon-box" style="border-color: ${tierColor};">
                    <img src="${sub.icon}" alt="${sub.name}" class="pxl-tile-icon">
                  </div>
                  <span class="pxl-tile-tier-tag" style="color: ${tierColor};">${sub.percentage.toFixed(0)}%</span>
                </div>

                <!-- Subject Title -->
                <div class="pxl-tile-name" title="${sub.name}">${sub.name}</div>

                <!-- Telemetry Sub-text -->
                <div class="pxl-tile-telemetry">
                  <span>${sub.completedVideos}/${sub.totalVideos} vids</span>
                </div>

                <!-- Micro 16-Bit HP Progress Bar -->
                <div class="pxl-tile-hp-bar">
                  <div class="pxl-tile-hp-fill" style="width: ${Math.max(4, sub.percentage)}%; background-color: ${tierColor};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- View 1: Dashboard View ---
  function renderDashboardView(stats) {
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const plans = state.plans && state.plans.length > 0 ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT, 'Entire Syllabus')];
    const allQueues = getAllPlanQueues();
    const streakCount = getStudyStreak();

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayCompletedCount = (state.dailyHistory && state.dailyHistory[todayStr]) || 0;

    let totalVidsDay = 0;
    plans.forEach(p => {
      totalVidsDay += Math.max(1, parseInt(p.videosPerDay) || 8);
    });

    // Helper: render one plan's daily quest block
    function renderPlanQuestBlock(plan, queue) {
      const planColor = plan.accentColor || PLAN_A_ACCENT;
      const todayDoneForPlan = queue.queueCompletedInBatch;
      const dailyPctPlan = Math.min(100, Math.round((todayDoneForPlan / queue.baseTargetPace) * 100));

      return `
        <div class="plan-quest-block" style="border-left: 4px solid ${planColor}; background: ${planColor}0a; border-radius: 6px; padding: 14px 14px 12px 16px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="plan-badge" style="background: ${planColor}; color: #ffffff; font-size: 0.76rem; padding: 3px 10px; border-radius: 4px; font-family: var(--font-hud); font-weight: 900; box-shadow: 2px 2px 0 0 #000000;">${plan.label}</span>
              <span style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-primary);">${queue.subjectName}</span>
            </div>
            <span style="font-family: var(--font-hud); font-size: 0.88rem; color: var(--text-muted);">${todayDoneForPlan}/${queue.baseTargetPace} • ${dailyPctPlan}%</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
            <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted);">
              TARGET: <strong>${queue.baseTargetPace} VIDS/DAY</strong>
            </div>
            <button class="v2-arcade-btn btn-open-queue-subject" data-subject-id="${queue.subjectId}" style="height: 30px; padding: 0 10px; font-size: 0.82rem;">
              <span>Open ${queue.subjectName}</span>
              <span class="material-symbols-outlined" style="font-size: 14px;">arrow_forward</span>
            </button>
          </div>

          ${queue.isDailyTargetAchieved ? `
            ${(plan.extraBatchesCompletedToday || 0) > 0 ? `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px; border-color: var(--retro-purple, #a855f7);">
                <div class="v2-alert-icon-box" style="background: #a855f7; color: #ffffff; font-size: 20px; font-weight: bold;">⚡</div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: #a855f7;">${plan.label} EXTRA BATCH #${plan.extraBatchesCompletedToday + 1} ▶ OVERACHIEVED!</div>
                  <div class="v2-alert-title">🔥 Overachievement Bonus Unlocked!</div>
                  <div class="v2-alert-body">You've exceeded today's daily target! Completed extra batch #${plan.extraBatchesCompletedToday} (+${queue.baseTargetPace} bonus videos) for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:#a855f7;"></div>
              </div>
            ` : `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px;">
                <div class="v2-alert-icon-box" style="background: var(--v2-pine-green, #10b981);">${PXL_ICONS.trophy}</div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: var(--v2-pine-green, #10b981);">${plan.label} DAILY BATCH ▶ COMPLETED</div>
                  <div class="v2-alert-title">Daily Target Achieved!</div>
                  <div class="v2-alert-body">All ${queue.baseTargetPace} videos done for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:var(--v2-pine-green,#10b981);"></div>
              </div>
            `}
            <button class="v2-arcade-btn btn-advance-queue" data-plan-id="${plan.id}" style="width:100%; height:40px; font-weight:700; font-size:0.9rem; justify-content:center; gap:8px;">
              ${PXL_ICONS.rocket}
              <span>🚀 Advance ${plan.label} — Next Target Batch</span>
            </button>
          ` : (queue.allSubjectDone ? `
            <div class="congrats-card-pop" style="text-align:center; padding:14px; color:var(--success); font-family:var(--font-display); font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
              ${PXL_ICONS.trophy}
              <span>All ${queue.subjectName} videos completed! 🎉</span>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap: 2px;">
              ${queue.videos.map(v => {
                const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
                let vNum = '#' + (v.videoNumber || '#1').replace(/^#+/, '');
                const isDone = !!state.completedVideos[v.id];
                return `
                  <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                    <label class="v2-pixel-checkbox-label">
                      <input type="checkbox" class="queue-chk" data-video-id="${v.id}" data-plan-id="${plan.id}" ${isDone ? 'checked' : ''}>
                      <span class="v2-pixel-checkbox-box"></span>
                      <div>
                        <div class="v2-quest-title"><span style="color:${planColor}; font-family:var(--font-hud); margin-right:4px;">${vNum}</span> ${v.title}</div>
                        <div style="font-size:0.78rem; color:var(--text-muted); font-family:var(--font-hud); margin-top:2px;">${v.chapterName}</div>
                      </div>
                    </label>
                    <div style="font-family:var(--font-hud); font-size:0.95rem; color:var(--text-muted); font-weight:700;">${durStr}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `)}
        </div>
      `;
    }

    const allQuestsDone = allQueues.every(q => q.isDailyTargetAchieved);
    const hasDualPlans = plans.length >= 2;

    DOM.appMain.innerHTML = `
      <!-- Hero Card -->
      <div class="pxl-feature-card-wrapper" style="margin-bottom: 16px;">
        <div class="pxl-feature-card hero-banner-card">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
              ${hasDualPlans ? `
                <span class="hero-top-badge" style="background:#e11d48; color:#ffffff; font-family:var(--font-hud); font-size:0.82rem; font-weight:900; padding:4px 10px; border-radius:4px; box-shadow:2px 2px 0 0 #000000; text-transform:uppercase; letter-spacing:0.05em;">
                  ⚡ DUAL-TRACK MODE
                </span>
              ` : ''}
              <span style="margin-left:auto; font-family:var(--font-hud); font-size:0.85rem; color:var(--retro-gold,#ffcc00);">
                🔥 ${streakCount} day streak
              </span>
            </div>
            <h1 class="hero-card-title" style="font-family:var(--font-display); font-size:1.45rem; font-weight:800; color:#ffffff; margin-bottom:6px; letter-spacing:0.02em; text-shadow:2px 2px 0 #000000;">
              WELCOME BACK, ${docName.toUpperCase()}!
            </h1>
            <p class="hero-card-subtitle" style="font-family:var(--font-hud); font-size:1.05rem; color:#a0aec0; margin-bottom:14px; font-weight:600;">
              ${hasDualPlans ? `Tracking ${plans.map(p => p.targetSubject).join(' + ')}` : `${plans[0]?.targetSubject || 'Entire Syllabus'}`} — ${stats.percentage}% Mastered
            </p>
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-family:var(--font-hud); font-size:1.1rem; color:#ffffff; margin-bottom:6px; font-weight:700;">
                <span style="display:flex; align-items:center; gap:6px;">
                  <span style="color:var(--accent-primary, #00f0ff); font-weight:800;">▶</span>
                  <span>OVERALL SYLLABUS HP MASTERY</span>
                </span>
                <span style="font-weight:800; color:var(--retro-gold,#ffcc00); font-size:1.2rem;">${stats.percentage}%</span>
              </div>
              <div class="v2-hp-bar-bg" style="height:22px;">
                <div class="v2-hp-bar-fill" style="width:${stats.percentage}%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Android PWA Install Banner -->
      ${state.canInstallPWA ? `
        <div id="pwa-install-banner-card" class="v2-pixel-card" style="padding: 16px; margin-bottom: 20px; border-left: 4px solid var(--retro-cyan, #00f0ff); background: rgba(0, 240, 255, 0.05); border: 2px solid var(--v2-ink); box-shadow: 4px 4px 0 0 #000000;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="flex: 1; min-width: 240px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span class="v2-hud-badge" style="color: var(--retro-cyan, #00f0ff); border-color: var(--retro-cyan, #00f0ff); font-size: 0.76rem;">📱 MOBILE PWA</span>
              </div>
              <h3 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 2px 0;">
                Install FlowMD Android App
              </h3>
              <p style="font-family: var(--font-hud); font-size: 0.92rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                Get offline access & hardware back-button integration!
              </p>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="v2-arcade-btn" id="btn-pwa-install-now" style="height: 38px; background: var(--retro-cyan, #00f0ff); color: #0f172a; font-weight: 800; font-size: 0.88rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">get_app</span>
                <span>Install</span>
              </button>
              <button type="button" class="v2-arcade-btn" id="btn-pwa-dismiss-banner" style="height: 38px; background: var(--bg-surface-raised); color: var(--text-secondary); font-size: 0.88rem;">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- All-Quests-Done Banner -->
      ${allQuestsDone ? `
        <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 16px;">
          <div class="v2-alert-icon-box" style="background: #ffd700;">${PXL_ICONS.trophy}</div>
          <div class="v2-alert-content">
            <div class="v2-alert-category" style="color:#ffd700;">🏆 ALL DAILY QUESTS COMPLETE!</div>
            <div class="v2-alert-title">Outstanding Performance!</div>
            <div class="v2-alert-body">Every plan's daily target has been achieved today!</div>
          </div>
          <div class="v2-alert-bottom-bar" style="width:100%; background:#ffd700;"></div>
        </div>
      ` : ''}

      <!-- Daily Quest Section (per plan) -->
      <div class="v2-quest-card action-queue-card">
        <div class="v2-quest-header-badge">
          DAILY QUESTS${hasDualPlans ? ' — DUAL TRACK' : ` — ${allQueues[0]?.subjectName || ''}`}
        </div>
        <div style="padding-top:4px;">
          ${plans.map((plan, idx) => renderPlanQuestBlock(plan, allQueues[idx])).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-pwa-install-now')?.addEventListener('click', () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('Installing FlowMD PWA...', 'rocket_launch');
            triggerHaptic('install');
          }
          deferredInstallPrompt = null;
          state.canInstallPWA = false;
          render();
        });
      } else {
        showToast('To install: tap Browser Menu (⋮) → "Add to Home screen"', 'info');
      }
    });

    document.getElementById('btn-pwa-dismiss-banner')?.addEventListener('click', () => {
      state.canInstallPWA = false;
      showToast('Install banner dismissed.', 'info');
      renderDashboardView(stats);
    });

    document.querySelectorAll('.btn-open-queue-subject').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeSubjectId = btn.getAttribute('data-subject-id');
        switchView('subject_detail');
      });
    });

    // Per-plan advance batch
    document.querySelectorAll('.btn-advance-queue').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : (state.plans && state.plans[0]);
        if (plan) {
          plan.queueBatchVideoIds = [];
          plan.queueCompletedInBatch = 0;
          saveState();
          showToast(`${plan.label} — Next Batch Unlocked!`, 'arrow_forward', `${plan.label} Advanced`);
        } else {
          state.queueBatchVideoIds = [];
          state.queueCompletedInBatch = 0;
          saveState();
          showToast('Unlocked Next Target Batch!', 'arrow_forward');
        }
        render();
      });
    });

    document.querySelectorAll('.queue-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        const planId = e.target.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : null;

        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          const planLabel = plan ? plan.label : '';
          showToast(`${planLabel ? planLabel + ' — ' : ''}Completed Action Queue Video!`, 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        render();
      });
    });

    document.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const subId = card.getAttribute('data-subject-id');
        if (subId) { state.activeSubjectId = subId; switchView('subject_detail'); }
      });
    });

    document.querySelectorAll('.pxl-heatmap-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.pxl-heatmap-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.pxl-heatmap-tile').forEach(tile => {
          tile.style.display = (filter === 'all' || tile.getAttribute('data-tier') === filter) ? 'flex' : 'none';
        });
      });
    });
  }



  // --- View 2: Curriculum View & Spotlight Launcher ---
  function renderCurriculumView(stats) {
    let filteredSubjects = stats.subjectsStats;

    DOM.appMain.innerHTML = `
      <!-- PxlKit PixelBreadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Curriculum</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Curriculum & Subjects</h2>
        <span class="v2-hud-badge">${filteredSubjects.length} SUBJECTS</span>
      </div>

      ${filteredSubjects.map(sub => `
        <div class="v2-pixel-card" style="margin-bottom: 10px; padding: 12px 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" class="curriculum-sub-row" data-subject-id="${sub.id}">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${sub.icon}" style="width: 34px; height: 34px; object-fit: contain;" alt="${sub.name}">
              <div>
                <div style="font-family: var(--font-display); font-weight: 700; font-size: 1rem;">${sub.name}</div>
                <div style="font-family: var(--font-hud); font-size: 0.92rem; color: var(--text-muted); margin-top: 2px;">${sub.raw.chapters ? sub.raw.chapters.length : 0} CHAPTERS • ${sub.totalVideos} VIDEOS</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="v2-hud-badge" style="${sub.percentage === 100 ? 'color: var(--success); border-color: var(--success);' : ''}">${sub.percentage}%</span>
              <span class="material-symbols-outlined" style="color: var(--text-muted);">chevron_right</span>
            </div>
          </div>
        </div>
      `).join('')}
    `;

    document.querySelectorAll('.curriculum-sub-row').forEach(row => {
      row.addEventListener('click', () => {
        state.activeSubjectId = row.getAttribute('data-subject-id');
        switchView('subject_detail');
      });
    });
  }

  // --- View 3: Subject Detail View ---
  function renderSubjectDetailView(stats) {
    const subObj = stats.subjectsStats.find(s => s.id === state.activeSubjectId) || stats.subjectsStats[0];
    if (!subObj) {
      DOM.appMain.innerHTML = `<p>Subject not found.</p>`;
      return;
    }

    DOM.appMain.innerHTML = `
      <!-- PxlKit PixelBreadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item nav-bc-curriculum">Curriculum</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">${subObj.name}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
        <button class="v2-arcade-btn" id="btn-back-to-curriculum" style="width: 38px; height: 38px; padding: 0;">
          <span class="material-symbols-outlined" style="font-size: 20px;">arrow_back</span>
        </button>
        <h2 class="section-title" style="font-family: var(--font-display); margin: 0;">${subObj.name}</h2>
      </div>

      <div class="v2-pixel-card" style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding: 16px;">
        <img src="${subObj.icon}" style="width: 46px; height: 46px; object-fit: contain;" alt="${subObj.name}">
        <div style="flex: 1;">
          <div style="font-family: var(--font-display); font-weight: 700; font-size: 1.1rem;">${subObj.name}</div>
          <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); margin: 2px 0 6px 0;">${subObj.completedVideos} OF ${subObj.totalVideos} COMPLETED (${subObj.percentage}%)</div>
          <div class="v2-hp-bar-bg">
            <div class="v2-hp-bar-fill" style="width: ${subObj.percentage}%;"></div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 2px;">
        <span style="font-family: var(--font-hud); font-size: 1rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
          ${subObj.raw.chapters ? subObj.raw.chapters.length : 0} UNITS / CHAPTERS
        </span>
        <button class="v2-arcade-btn" id="btn-toggle-all-chapters" style="height: 30px; padding: 0 10px; font-size: 0.8rem; background: var(--bg-surface-raised); color: var(--text-primary);">
          <span class="material-symbols-outlined" style="font-size: 16px;">unfold_more</span>
          <span>${Object.values(state.expandedChapters).some(v => v === true) ? 'Collapse All' : 'Expand All'}</span>
        </button>
      </div>

      ${subObj.raw.chapters ? subObj.raw.chapters.map((chap, cIdx) => `
        <div class="accordion-header ${state.expandedChapters[chap.name] === true ? 'active' : ''}" data-chap-name="${chap.name}" style="border: 2px solid var(--v2-ink, #161310); margin-bottom: 6px; cursor: pointer; user-select: none;">
          <div class="accordion-title" style="font-family: var(--font-display); font-size: 0.95rem;">${chap.name} (${chap.videos ? chap.videos.length : 0} Videos)</div>
          <span class="material-symbols-outlined accordion-icon">expand_more</span>
        </div>

        <div class="accordion-body ${state.expandedChapters[chap.name] === true ? 'active' : ''}">
          <div class="v2-quest-card" style="padding-top: 14px; margin-top: 4px; margin-bottom: 10px;">
            ${chap.videos ? chap.videos.map(v => {
              const isDone = !!state.completedVideos[v.id];
              const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
              let vNum = v.videoNumber || '#1';
              vNum = '#' + vNum.replace(/^#+/, '');

              return `
                <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                  <label class="v2-pixel-checkbox-label">
                    <input type="checkbox" class="react-task-checkbox" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                    <span class="v2-pixel-checkbox-box"></span>
                    <div>
                      <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                    </div>
                  </label>
                  <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">${durStr}</div>
                </div>
              `;
            }).join('') : ''}
          </div>
        </div>
      `).join('') : ''}
    `;

    document.getElementById('btn-back-to-curriculum')?.addEventListener('click', () => switchView('curriculum'));

    document.getElementById('btn-toggle-all-chapters')?.addEventListener('click', () => {
      const isAnyExpanded = Object.values(state.expandedChapters).some(v => v === true);
      const newExpandedState = !isAnyExpanded;
      if (subObj.raw.chapters) {
        subObj.raw.chapters.forEach(chap => {
          state.expandedChapters[chap.name] = newExpandedState;
        });
      }
      renderSubjectDetailView(stats);
    });

    document.querySelectorAll('.accordion-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const chapName = hdr.getAttribute('data-chap-name');
        state.expandedChapters[chapName] = !state.expandedChapters[chapName];
        renderSubjectDetailView(stats);
      });
    });

    document.querySelectorAll('.react-task-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          showToast('Marked as Completed!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        renderSubjectDetailView(getSyllabusStats());
      });
    });
  }

  // --- PxlKit PixelAreaChart SVG Generator ---
  function renderPixelAreaChart(last7Days, vidsDay, maxChartVal) {
    const width = 500;
    const height = 150;
    const paddingX = 45;
    const paddingY = 28;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const points = last7Days.map((d, i) => {
      const count = (state.dailyHistory && state.dailyHistory[d.dateKey]) ? state.dailyHistory[d.dateKey] : 0;
      const x = paddingX + i * (chartW / (last7Days.length - 1));
      const y = (height - paddingY) - Math.min(chartH, Math.round((count / maxChartVal) * chartH));
      return { x, y, count, label: d.label, isMet: count >= vidsDay };
    });

    // Build Stepped Pixel Area Path
    let polylinePts = '';
    let areaPolygonPts = `${paddingX},${height - paddingY} `;

    points.forEach((p, idx) => {
      if (idx === 0) {
        polylinePts += `${p.x},${p.y} `;
        areaPolygonPts += `${p.x},${p.y} `;
      } else {
        const prev = points[idx - 1];
        const midX = (prev.x + p.x) / 2;
        polylinePts += `${midX},${prev.y} ${midX},${p.y} ${p.x},${p.y} `;
        areaPolygonPts += `${midX},${prev.y} ${midX},${p.y} ${p.x},${p.y} `;
      }
    });

    const lastPt = points[points.length - 1];
    areaPolygonPts += `${lastPt.x},${height - paddingY} `;

    const targetY = (height - paddingY) - Math.min(chartH, Math.round((vidsDay / maxChartVal) * chartH));
    const total7DayVids = points.reduce((sum, p) => sum + p.count, 0);

    return `
      <div class="pxl-feature-card-wrapper" style="margin-bottom: 20px;">
        <div class="pxl-feature-card-header-badges" style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="pxl-badge-green">7-DAY EXECUTION CHART</span>
            <span class="pxl-badge-code">${total7DayVids} VIDS COMPLETED</span>
          </div>
          <span class="v2-hud-badge" style="color: var(--retro-gold, #ffcc00); border-color: var(--retro-gold, #ffcc00);">TARGET: ${vidsDay} VIDS/DAY</span>
        </div>

        <div class="pxl-feature-card" style="padding: 18px 16px 14px 16px;">
          <div style="position: relative; width: 100%;">
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 180px; overflow: visible; display: block;">
              <defs>
                <linearGradient id="pxlAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#00ff88" stop-opacity="0.05" />
                </linearGradient>
              </defs>

              <!-- Grid Lines -->
              <line x1="${paddingX}" y1="${paddingY}" x2="${width - paddingX}" y2="${paddingY}" stroke="#282f42" stroke-dasharray="4 4" stroke-width="1" />
              <line x1="${paddingX}" y1="${height / 2}" x2="${width - paddingX}" y2="${height / 2}" stroke="#282f42" stroke-dasharray="4 4" stroke-width="1" />
              <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="#282f42" stroke-width="2" />

              <!-- Target Pace Dashed Line -->
              <line x1="${paddingX}" y1="${targetY}" x2="${width - paddingX}" y2="${targetY}" stroke="#ffcc00" stroke-linecap="square" stroke-dasharray="6 4" stroke-width="2" />
              <text x="${width - paddingX}" y="${Math.max(14, targetY - 5)}" fill="#ffcc00" font-family="'VT323', monospace" font-size="14" font-weight="bold" text-anchor="end">TARGET (${vidsDay} VIDS/DAY)</text>

              <!-- Filled Stepped Area Polygon -->
              <polygon points="${areaPolygonPts}" fill="url(#pxlAreaGrad)" />

              <!-- Stepped Pixel Polyline -->
              <polyline points="${polylinePts}" fill="none" stroke="#00f0ff" stroke-width="3" stroke-linejoin="miter" />

              <!-- Data Nodes & High-Contrast Value Badges -->
              ${points.map(p => `
                <g>
                  <!-- Background Badge Pill for 100% Readability -->
                  <rect x="${p.x - 14}" y="${p.y - 20}" width="28" height="15" rx="3" fill="#0d1017" stroke="${p.isMet ? '#00ff88' : (p.count > 0 ? '#00f0ff' : '#282f42')}" stroke-width="1" />
                  <text x="${p.x}" y="${p.y - 8}" fill="${p.count > 0 ? (p.isMet ? '#00ff88' : '#00f0ff') : '#64748b'}" font-family="'VT323', monospace" font-size="14" font-weight="bold" text-anchor="middle">
                    ${p.count}${p.isMet && p.count > 0 ? '★' : ''}
                  </text>
                  <rect x="${p.x - 4}" y="${p.y - 4}" width="8" height="8" fill="${p.isMet ? '#00ff88' : (p.count > 0 ? '#00f0ff' : '#282f42')}" stroke="#090a0f" stroke-width="2" />
                </g>
              `).join('')}

              <!-- X-Axis Date Labels -->
              ${points.map(p => `
                <text x="${p.x}" y="${height - 6}" fill="#94a3b8" font-family="'VT323', monospace" font-size="13" font-weight="bold" text-anchor="middle">
                  ${p.label}
                </text>
              `).join('')}
            </svg>
          </div>

          <!-- 16-Bit Daily Breakdown Summary Grid -->
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 14px; border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 12px;">
            ${points.map(p => `
              <div style="background: rgba(0,0,0,0.35); border: 1px solid ${p.isMet ? '#00ff88' : (p.count > 0 ? '#00f0ff' : '#282f42')}; padding: 6px 2px; text-align: center; border-radius: 2px;">
                <div style="font-family: var(--font-hud), monospace; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">${p.label}</div>
                <div style="font-family: var(--font-hud), monospace; font-size: 1.15rem; font-weight: 700; color: ${p.isMet ? '#00ff88' : (p.count > 0 ? '#00f0ff' : '#64748b')}; margin: 2px 0;">
                  ${p.count}
                </div>
                <div style="font-family: var(--font-hud), monospace; font-size: 0.68rem; font-weight: 700; color: ${p.isMet ? '#00ff88' : '#64748b'};">
                  ${p.isMet ? '★ MET' : (p.count > 0 ? 'PARTIAL' : '0 VIDS')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // --- View 4: Target & Goal-Driven Analytics Suite (Dual-Plan) ---
  function renderAnalyticsView(stats) {
    const plans = (state.plans && state.plans.length > 0) ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT, 'Entire Syllabus')];
    const allQueues = getAllPlanQueues();
    const hasDualPlans = plans.length >= 2;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayDone = (state.dailyHistory && state.dailyHistory[todayStr]) || 0;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      last7Days.push({ dateKey, label });
    }

    let actual7DaysCount = last7Days.reduce((sum, d) => sum + ((state.dailyHistory && state.dailyHistory[d.dateKey]) || 0), 0);
    let actual30DaysCount = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      actual30DaysCount += (state.dailyHistory && state.dailyHistory[d.toISOString().slice(0, 10)]) || 0;
    }

    // Aggregate total daily target across all plans
    let totalVidsDay = 0;
    plans.forEach(p => { totalVidsDay += Math.max(1, parseInt(p.videosPerDay) || 8); });

    const ideal7DaysTarget = totalVidsDay * 7;
    const ideal30DaysTarget = totalVidsDay * 30;
    const paceDelta = actual7DaysCount - ideal7DaysTarget;
    const lectureDeficit = Math.abs(paceDelta);

    const weeklyPct = Math.min(100, Math.round((actual7DaysCount / Math.max(1, ideal7DaysTarget)) * 100));
    const monthlyPct = Math.min(100, Math.round((actual30DaysCount / Math.max(1, ideal30DaysTarget)) * 100));
    const maxChartVal = Math.max(totalVidsDay, ...last7Days.map(d => (state.dailyHistory && state.dailyHistory[d.dateKey]) || 0), 1);

    // Per-plan stats
    const planStats = plans.map((plan, idx) => {
      const q = allQueues[idx];
      const m = getSubjectOrSyllabusMetrics(plan.targetSubject);
      const vids = Math.max(1, parseInt(plan.videosPerDay) || 8);
      const remVids = Math.max(0, m.remainingVideos);
      const daysNeeded = Math.ceil(remVids / vids);
      const finishDate = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
      const finishDateStr = finishDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const targetDate = new Date(plan.targetDate || '2026-08-15');
      const daysLeft = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));
      const ideal7 = vids * 7;
      const ideal30 = vids * 30;
      const planPaceDelta = actual7DaysCount - ideal7; // global actual vs this plan's ideal
      return { plan, q, m, vids, remVids, daysNeeded, finishDate, finishDateStr, targetDate, daysLeft, ideal7, ideal30, planPaceDelta };
    });

    DOM.appMain.innerHTML = `
      <!-- Breadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Analytics</span>
      </div>

      <!-- Header -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:6px;">
        <div>
          <h2 class="section-title" style="font-family:var(--font-display); font-size:1.35rem; margin:0; display:flex; align-items:center; gap:8px;">
            <svg class="pxl-icon" viewBox="0 0 16 16" width="22" height="22" fill="none">
              <path d="M2 14L6 9L9 11L14 3" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="square" />
            </svg>
            <span>Study Intelligence Report</span>
            ${hasDualPlans ? `<span class="v2-hud-badge" style="color:#f43f5e; border-color:#f43f5e; font-size:0.72rem;">⚡ DUAL-TRACK</span>` : ''}
          </h2>
          <p style="font-family:var(--font-hud); font-size:0.95rem; color:var(--text-muted); margin:2px 0 0 0;">
            ${hasDualPlans ? `Tracking ${plans.map(p => p.targetSubject).join(' + ')}` : 'Track your goals, pace, and subject progress.'}
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <button class="v2-arcade-btn" id="btn-share-report" style="height:34px; padding:0 12px; font-size:0.82rem; background:var(--accent-gradient);">
            <span class="material-symbols-outlined" style="font-size:16px;">share</span>
            <span>Share Report</span>
          </button>
        </div>
      </div>

      <!-- Preparation Setup & Target Goals (moved from profile) -->
      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; margin: 0;">Preparation Setup & Target Goals</h3>
          <span class="v2-hud-badge" style="color: var(--accent-primary); border-color: var(--accent-primary);">${Math.max(1, Math.ceil((new Date(state.goals.targetDate || '2026-08-15') - new Date()) / 86400000))} DAYS LEFT</span>
        </div>

        <div style="background: var(--bg-surface-raised); border: 2px solid var(--v2-ink); padding: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; font-family: var(--font-hud); font-size: 1.05rem; margin-bottom: 4px;">
            <span>PRIORITY FOCUS: <strong style="color: var(--retro-gold);">${state.goals.targetSubject || 'Entire Syllabus'}</strong></span>
            <span style="color: var(--accent-primary); font-weight: 700;">${(state.goals.goalMode || 'video') === 'video' ? state.goals.videosPerDay + ' VIDS/DAY' : state.goals.dailyTargetHours + ' HRS/DAY'}</span>
          </div>
          <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted);">
            Target Completion: <strong>${state.goals.targetDate || '2026-08-15'}</strong> (${state.goals.videosPerWeek || 56} vids/wk • ${state.goals.videosPerMonth || 240} vids/mo)
          </div>
        </div>

        <button class="v2-arcade-btn" id="btn-analytics-open-goals" style="width: 100%;">
          <span class="material-symbols-outlined">track_changes</span> Synchronize Pace & Goals
        </button>
      </div>

      <!-- Global Goal Pulse Grid -->
      <div style="margin:14px 0 20px 0;">
        <div style="font-family:var(--font-display); font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
          <span style="color:var(--retro-cyan,#00f0ff);">🎯</span>
          <span>Goal Pulse — Today / Week / Month</span>
        </div>
        <div class="pxl-goal-pulse-grid">
          <div class="pxl-pulse-card" style="border-left-color:var(--retro-cyan,#00f0ff);">
            <div class="pxl-pulse-header">
              <span class="pxl-pulse-title">Today's Daily Goal</span>
              <span class="v2-hud-badge" style="${todayDone >= totalVidsDay ? 'color:var(--retro-green,#00ff88); border-color:var(--retro-green,#00ff88);' : 'color:var(--retro-gold,#ffcc00); border-color:var(--retro-gold,#ffcc00);'} font-size:0.72rem;">
                ${todayDone >= totalVidsDay ? 'DONE 🎉' : 'IN PROGRESS'}
              </span>
            </div>
            <div class="pxl-pulse-value" style="color:var(--retro-cyan,#00f0ff);">
              ${todayDone}<span style="font-size:1.1rem; color:#94a3b8;">/${totalVidsDay}</span>
            </div>
            <div style="font-family:var(--font-hud); font-size:0.85rem; color:#94a3b8;">
              combined videos today
              ${hasDualPlans ? `<span style="display:block; margin-top:2px;">${plans.map((p,i) => `${p.label}: ${allQueues[i].queueCompletedInBatch}/${p.videosPerDay}`).join(' + ')}</span>` : ''}
            </div>
            <div class="v2-hp-bar-bg" style="height:6px; margin-top:8px;">
              <div class="v2-hp-bar-fill" style="width:${Math.min(100, Math.round((todayDone / totalVidsDay) * 100))}%; background:var(--retro-cyan,#00f0ff);"></div>
            </div>
          </div>
          <div class="pxl-pulse-card" style="border-left-color:var(--retro-gold,#ffcc00);">
            <div class="pxl-pulse-header">
              <span class="pxl-pulse-title">Weekly Goal</span>
              <span class="v2-hud-badge" style="color:var(--retro-gold,#ffcc00); border-color:var(--retro-gold,#ffcc00); font-size:0.72rem;">${weeklyPct}% COMPLETE</span>
            </div>
            <div class="pxl-pulse-value" style="color:var(--retro-gold,#ffcc00);">
              ${actual7DaysCount}<span style="font-size:1.1rem; color:#94a3b8;">/${ideal7DaysTarget}</span>
            </div>
            <div style="font-family:var(--font-hud); font-size:0.85rem; color:#94a3b8;">videos this week</div>
            <div class="v2-hp-bar-bg" style="height:6px; margin-top:8px;">
              <div class="v2-hp-bar-fill" style="width:${weeklyPct}%; background:var(--retro-gold,#ffcc00);"></div>
            </div>
          </div>
          <div class="pxl-pulse-card" style="border-left-color:var(--retro-purple,#a855f7);">
            <div class="pxl-pulse-header">
              <span class="pxl-pulse-title">Monthly Goal</span>
              <span class="v2-hud-badge" style="color:var(--retro-purple,#a855f7); border-color:var(--retro-purple,#a855f7); font-size:0.72rem;">${monthlyPct}% COMPLETE</span>
            </div>
            <div class="pxl-pulse-value" style="color:var(--retro-purple,#a855f7);">
              ${actual30DaysCount}<span style="font-size:1.1rem; color:#94a3b8;">/${ideal30DaysTarget}</span>
            </div>
            <div style="font-family:var(--font-hud); font-size:0.85rem; color:#94a3b8;">videos in 30 days</div>
            <div class="v2-hp-bar-bg" style="height:6px; margin-top:8px;">
              <div class="v2-hp-bar-fill" style="width:${monthlyPct}%; background:var(--retro-purple,#a855f7);"></div>
            </div>
          </div>
          ${planStats.map(ps => {
            const planColor = ps.plan.accentColor || PLAN_A_ACCENT;
            const behind = ps.finishDate > ps.targetDate;
            const daysDiff = Math.abs(Math.ceil((ps.finishDate - ps.targetDate) / 86400000));
            return `
              <div class="pxl-pulse-card" style="border-left-color:${planColor};">
                <div class="pxl-pulse-header">
                  <span class="pxl-pulse-title">${ps.plan.label} ETA</span>
                  <span class="v2-hud-badge" style="${behind ? 'color:var(--retro-red,#ff5555); border-color:var(--retro-red,#ff5555);' : 'color:var(--retro-green,#00ff88); border-color:var(--retro-green,#00ff88);'} font-size:0.72rem;">
                    ${behind ? '⚠️ LATE' : '⚡ ON TRACK'}
                  </span>
                </div>
                <div class="pxl-pulse-value" style="color:${planColor}; font-size:1.3rem;">${ps.finishDateStr}</div>
                <div style="font-family:var(--font-hud); font-size:0.85rem; color:#94a3b8;">${ps.plan.targetSubject} @ ${ps.vids}/day</div>
                <div class="pxl-pulse-sub" style="color:${behind ? 'var(--retro-red,#ff5555)' : 'var(--retro-green,#00ff88)'}; font-weight:700;">
                  ${daysDiff}d ${behind ? 'behind' : 'ahead of'} deadline (${ps.plan.targetDate})
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 7-Day Execution Chart -->
      ${renderPixelAreaChart(last7Days, totalVidsDay, maxChartVal)}

      <!-- Subject Heatmap (moved from dashboard) -->
      <div style="margin-top:20px;">
        ${renderPixelSubjectHeatmap(stats)}
      </div>

    `;

    document.getElementById('btn-share-report')?.addEventListener('click', () => {
      const shareText = `🎯 FlowMD Study Intelligence Report\nDoctor: ${state.personal.doctorName || 'Dr. Aspirant'}\n${hasDualPlans ? `Dual-Track: ${plans.map(p => p.targetSubject).join(' + ')}\n` : ''}Syllabus HP Mastery: ${stats.percentage}%\nCombined Daily Target: ${totalVidsDay} vids/day\n7-Day Actual: ${actual7DaysCount}/${ideal7DaysTarget}\n${planStats.map(ps => `${ps.plan.label} ETA: ${ps.finishDateStr}`).join('\n')}\nBuilt with FlowMD!`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => showToast('Report Copied to Clipboard!', 'auto_awesome'));
      } else {
        showToast('Study Intelligence Report Ready!', 'auto_awesome');
      }
    });

    document.getElementById('btn-analytics-open-goals')?.addEventListener('click', openGoalModal);
  }

  // --- View 5: Synchronized Targets & Goals View ---
  function renderGoalsView(stats) {
    const mode = state.goals.goalMode || 'video';
    const targetSub = state.goals.targetSubject || 'Entire Syllabus';
    const targetDateStr = state.goals.targetDate || '2026-08-15';
    const daysLeft = Math.max(1, Math.ceil((new Date(targetDateStr) - new Date()) / 86400000));

    DOM.appMain.innerHTML = `
      <!-- PxlKit PixelBreadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Goals & Schedule</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Personal Preparation Goals</h2>
        <button class="v2-arcade-btn" id="btn-edit-goals-page" style="height: 34px; padding: 0 12px; font-size: 0.88rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">track_changes</span>
          <span>Synchronize Pace</span>
        </button>
      </div>

      <div class="v2-pixel-card" style="padding: 20px; margin-bottom: 16px; background: linear-gradient(135deg, rgba(46, 93, 214, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="v2-hud-badge" style="color: var(--accent-primary); border-color: var(--accent-primary);">MODE: ${mode === 'video' ? 'VIDEOS PACE' : 'HOURS PACE'}</span>
          <span class="v2-hud-badge">${daysLeft} DAYS LEFT</span>
        </div>

        <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 700; margin-bottom: 4px;">
          Priority Focus: ${targetSub}
        </h2>
        <p style="font-family: var(--font-hud); font-size: 1.1rem; color: var(--accent-primary); font-weight: 700;">
          TARGET PACE: ${mode === 'video' ? state.goals.videosPerDay + ' VIDS/DAY (' + state.goals.videosPerWeek + ' VIDS/WK)' : state.goals.dailyTargetHours + ' HRS/DAY (' + state.goals.weeklyTargetHours + ' HRS/WK)'}
        </p>

        <div class="v2-hp-bar-bg" style="height: 14px; margin-top: 14px;">
          <div class="v2-hp-bar-fill" style="width: ${stats.percentage}%;"></div>
        </div>
      </div>

      <!-- Synchronized Pace Cards -->
      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 12px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Daily Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
              ${mode === 'video' ? state.goals.videosPerDay + ' Videos' : state.goals.dailyTargetHours + ' Hours'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per day</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 12px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Weekly Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
              ${mode === 'video' ? state.goals.videosPerWeek + ' Videos' : state.goals.weeklyTargetHours + ' Hours'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per week</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Monthly Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
              ${mode === 'video' ? state.goals.videosPerMonth + ' Videos' : state.goals.monthlyTargetHours + ' Hours'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per month</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>
    `;

    document.getElementById('btn-edit-goals-page')?.addEventListener('click', openGoalModal);
  }

  // --- View 6: Profile View (simplified) ---
  function renderProfileView(stats) {
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';

    DOM.appMain.innerHTML = `
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Account & Profile</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Account & Profile</h2>
      </div>

      <div class="v2-pixel-card" style="padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div class="pxl-avatar pxl-avatar-lg pxl-avatar-cyan">
            ${(docName.replace(/^Dr\.?\s*/i, '').trim().slice(0, 2) || 'DA').toUpperCase()}
          </div>
          <div>
            <h2 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700;">${docName}</h2>
          </div>
        </div>

        <form id="profile-edit-form">
          <div class="form-group">
            <label for="prof-doc-name">Doctor Name</label>
            <input type="text" id="prof-doc-name" value="${docName}" class="form-input">
          </div>
          <button type="submit" class="v2-arcade-btn" style="height: 44px; width: 100%;">Save Profile Changes</button>
        </form>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Google Cloud Sync</h3>
        ${isSynced ? `
          <div style="display: flex; align-items: center; gap: 8px; color: var(--success); font-family: var(--font-hud); font-size: 1.05rem; margin-bottom: 12px;">
            <span class="material-symbols-outlined">cloud_done</span>
            Synced as ${syncEmail}
          </div>
          <button class="v2-arcade-btn" id="btn-signout-google" style="width: 100%; background: var(--danger);">Sign Out of Cloud Sync</button>
        ` : `
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Sign in with Google to backup your progress.</p>
          <button class="v2-arcade-btn" id="btn-signin-google" style="width: 100%;">
            <span class="material-symbols-outlined">cloud_sync</span> Sign In with Google
          </button>
        `}
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 24px; border-left: 4px solid var(--accent-primary, #2563eb);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0;">
              <span class="material-symbols-outlined" style="color: var(--accent-primary, #2563eb);">support_agent</span>
              <span>Developer Support & Contact</span>
            </h3>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 14px;">
          <button class="v2-arcade-btn" id="btn-open-contact-modal" style="height: 42px; background: var(--accent-primary, #2563eb); color: #ffffff;">
            <span class="material-symbols-outlined">send</span> Send Support Ticket
          </button>
          <button class="v2-arcade-btn" id="btn-copy-support-email" style="height: 42px; background: var(--bg-surface-raised); color: var(--text-primary);">
            <span class="material-symbols-outlined">content_copy</span> Copy Email (support@flowmd.app)
          </button>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Data Management</h3>
        <button class="v2-arcade-btn" id="btn-reset-data" style="width: 100%; background: var(--danger);">
          <span class="material-symbols-outlined">delete_forever</span> Reset All App Data
        </button>
      </div>
    `;

    document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.personal.doctorName = document.getElementById('prof-doc-name').value || 'Dr. Aspirant';
      saveState();
      showToast('Profile updated!', 'check_circle');
      render();
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all app progress and targets? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
      }
    });

    document.getElementById('btn-signin-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        try {
          await window.FirebaseSync.signInWithGoogle();
        } catch (e) {
          showToast('Sign in failed.', 'error');
        }
      }
    });

    document.getElementById('btn-signout-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        await window.FirebaseSync.signOutUser();
        showToast('Signed out.', 'info');
        renderProfileView(stats);
      }
    });

    document.getElementById('btn-open-contact-modal')?.addEventListener('click', openContactModal);

    document.getElementById('btn-copy-support-email')?.addEventListener('click', () => {
      const email = 'support@flowmd.app';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => showToast('Support Email Copied: support@flowmd.app', 'content_copy'));
      } else {
        showToast('Support Email: support@flowmd.app', 'mail');
      }
    });
  }

  // --- Developer Support & Contact Us Modal Controller ---
  function openContactModal() {
    const modal = document.createElement('div');
    // Support modal is dynamically created — use inline styles for backdrop
    // (not class-based .active toggling used by static HTML modals)
    modal.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'background:rgba(0,0,0,0.82)', 'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'box-sizing:border-box'
    ].join(';');

    const userEmail = (state.personal && state.personal.syncEmail) || '';
    const docName = (state.personal && state.personal.doctorName) || 'Dr. Aspirant';
    const streak = typeof getStudyStreak === 'function' ? getStudyStreak() : 0;
    const overallMastery = (typeof getSyllabusStats === 'function' && getSyllabusStats().percentage) || 0;
    const sysInfo = `Doctor: ${docName} | Streak: ${streak}d | Mastery: ${overallMastery}% | App Version: v111.0`;

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px; width: 92%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid var(--retro-cyan, #00f0ff); padding-bottom: 12px;">
          <div>
            <div style="font-family: var(--font-hud), monospace; font-size: 0.75rem; font-weight: 700; color: var(--retro-gold, #ffcc00); letter-spacing: 0.08em; text-transform: uppercase;">
              📌 FLOWMD DEVELOPER SUPPORT
            </div>
            <h3 style="font-family: var(--font-display), monospace; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 2px 0 0 0; display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined" style="color: var(--retro-cyan, #00f0ff);">support_agent</span>
              <span>Contact Developer & Support</span>
            </h3>
          </div>
          <button id="btn-close-contact-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0 4px; line-height: 1;">&times;</button>
        </div>

        <div id="contact-form-container">
          <form id="contact-support-form">
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="contact-category" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Topic / Category</label>
              <select id="contact-category" class="form-select" style="height: 42px; font-weight: 600; font-family: inherit;">
                <option value="bug_report">🐛 Bug Report / Technical Issue</option>
                <option value="feature_request">💡 Feature Suggestion / Idea</option>
                <option value="dual_track_help">⚡ Dual-Track Setup Assistance</option>
                <option value="general_feedback" selected>📬 General Feedback & Inquiry</option>
                <option value="data_sync_help">☁️ Google Cloud Sync Question</option>
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div class="form-group" style="margin: 0;">
                <label for="contact-email" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Your Email / Contact</label>
                <input type="email" id="contact-email" class="form-input" value="${userEmail}" placeholder="doctor@example.com" style="height: 42px; font-family: inherit;">
              </div>
              <div class="form-group" style="margin: 0;">
                <label for="contact-priority" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Priority Level</label>
                <select id="contact-priority" class="form-select" style="height: 42px; font-family: inherit;">
                  <option value="normal" selected>🟢 Normal (Routine)</option>
                  <option value="high">🟡 High (Important)</option>
                  <option value="urgent">🔴 Urgent (App Blocking)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label for="contact-subject" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Subject</label>
              <input type="text" id="contact-subject" class="form-input" placeholder="e.g. Assistance with Dual-Track Plan B Schedule" style="height: 42px; font-family: inherit;">
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label for="contact-message" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Detailed Description / Message</label>
              <textarea id="contact-message" class="form-input" style="height: 90px; padding: 10px; font-family: inherit; line-height: 1.4; resize: vertical;" placeholder="Describe what you experienced or what feature you would love to see..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 16px; background: var(--bg-surface-raised, rgba(255,255,255,0.03)); padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 2px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin: 0; font-family: var(--font-hud); font-size: 0.88rem; color: var(--text-primary);">
                <input type="checkbox" id="contact-include-telemetry" checked style="width: 16px; height: 16px;">
                <span>Include System Telemetry (Exam, Streak, Progress & Version)</span>
              </label>
              <div style="font-family: var(--font-hud); font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                ⚡ ${sysInfo}
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="submit" id="btn-submit-support-ticket" class="v2-arcade-btn" style="flex: 1; height: 46px; background: var(--accent-primary, #2563eb); color: #ffffff; font-size: 0.95rem;">
                <span class="material-symbols-outlined">send</span> Submit Support Ticket
              </button>
              <button type="button" id="btn-cancel-contact-modal" class="v2-arcade-btn" style="height: 46px; background: var(--bg-surface-raised); color: var(--text-primary);">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Bug Fix #5: lock body scroll while modal is open

    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = ''; // restore scroll on close
    };
    modal.querySelector('#btn-close-contact-modal').onclick = closeModal;
    modal.querySelector('#btn-cancel-contact-modal').onclick = closeModal;

    const handleFormSubmit = (e) => {
      if (e) e.preventDefault();
      const category = modal.querySelector('#contact-category')?.value || 'general_feedback';
      const email = modal.querySelector('#contact-email')?.value || state.personal.syncEmail || 'doctor@flowmd.app';
      const priority = modal.querySelector('#contact-priority')?.value || 'normal';
      const subject = modal.querySelector('#contact-subject')?.value || 'General Support Ticket';
      const message = modal.querySelector('#contact-message')?.value || 'Support request submitted from FlowMD App.';
      const includeTelemetry = modal.querySelector('#contact-include-telemetry')?.checked ?? true;

      // Bug Fix #4: validate required fields before submitting
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }
      if (!message || message.trim().length < 10) {
        showToast('Please describe your issue (min 10 characters).', 'error');
        return;
      }

      const ticketId = 'FLOWMD-TKT-' + Math.floor(1000 + Math.random() * 9000);
      const ticketData = {
        ticketId,
        category,
        email,
        priority,
        subject,
        message,
        telemetry: includeTelemetry ? sysInfo : 'None',
        createdAt: new Date().toISOString(),
        status: 'Open'
      };

      if (!state.supportTickets) state.supportTickets = [];
      state.supportTickets.unshift(ticketData);
      saveState();

      if (typeof db !== 'undefined' && db && db.collection) {
        db.collection('support_tickets').add(ticketData).catch(err => console.log('Offline ticket queued', err));
      }

      showToast(`Support Ticket ${ticketId} Created!`, 'mark_email_read');

      const containerEl = modal.querySelector('#contact-form-container');
      if (containerEl) {
        containerEl.innerHTML = `
          <div style="text-align: center; padding: 20px 10px;">
            <div style="width: 56px; height: 56px; background: var(--success-bg, rgba(16,185,129,0.15)); color: var(--success, #10b981); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 32px; font-weight: bold;">
              ✓
            </div>
            <h4 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">Ticket Submitted Successfully!</h4>
            <p style="font-family: var(--font-hud); font-size: 1rem; color: var(--text-secondary); margin-bottom: 16px;">
              Reference ID: <strong style="color: var(--accent-primary, #2563eb); font-size: 1.1rem;">${ticketId}</strong>
            </p>
            <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-color); padding: 12px; border-radius: 4px; text-align: left; font-size: 0.88rem; margin-bottom: 20px;">
              <div><strong>Subject:</strong> ${subject}</div>
              <div><strong>Category:</strong> ${category.replace('_', ' ').toUpperCase()} (${priority.toUpperCase()})</div>
              <div><strong>Contact Email:</strong> ${email}</div>
              <div style="margin-top: 6px; color: var(--text-muted); font-size: 0.8rem;">Our engineering team will review your ticket and reply to ${email} within 24 hours.</div>
            </div>
            <button class="v2-arcade-btn" id="btn-close-ticket-success" style="width: 100%; height: 44px; background: var(--v2-pine-green, #10b981); color: #fff;">Done</button>
          </div>
        `;

        const doneBtn = modal.querySelector('#btn-close-ticket-success');
        if (doneBtn) doneBtn.onclick = closeModal;
      }
    };

    const formEl = modal.querySelector('#contact-support-form');
    if (formEl) formEl.onsubmit = handleFormSubmit;
    // Bug Fix #1: removed submitBtn.onclick — button is type="submit" inside the form,
    // so form.onsubmit already handles it. Adding onclick too caused double-submission.
  }

  // --- Global Event Delegation for Contact & Support Feature Buttons ---
  document.addEventListener('click', (e) => {
    const contactBtn = e.target.closest('#btn-open-contact-modal, .btn-contact-support, #bs-btn-contact-developer, [data-action="open-contact"]');
    if (contactBtn) {
      e.preventDefault();
      if (typeof closeBottomSheet === 'function') closeBottomSheet();
      // Bug Fix #2: delay modal open to let bottom sheet slide-down transition finish (~300ms)
      // before appending modal to body — prevents iOS Safari clipping issue
      setTimeout(openContactModal, 320);
    }
  });

  // --- Profile Bottom Sheet Controller ---
  function openProfileBottomSheet() {
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';
    const initials = (docName.replace(/^Dr\.?\s*/i, '').trim().slice(0, 2) || 'DA').toUpperCase();

    DOM.bottomSheetContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div class="pxl-avatar pxl-avatar-lg pxl-avatar-cyan" style="margin: 0 auto 8px auto;">
          ${initials}
        </div>
        <div style="font-family: var(--font-display); font-weight: 700; font-size: 1.15rem;">${docName}</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="v2-arcade-btn" id="bs-btn-view-profile" style="width: 100%; justify-content: flex-start;">
          <span class="material-symbols-outlined">person</span> View Full Profile & Settings
        </button>
        <button class="v2-arcade-btn btn-contact-support" id="bs-btn-contact-developer" style="width: 100%; justify-content: flex-start; background: var(--accent-primary, #2563eb); color: #ffffff;">
          <span class="material-symbols-outlined">support_agent</span> Contact Developer & Support
        </button>
        <button class="v2-arcade-btn" id="bs-btn-view-goals" style="width: 100%; justify-content: flex-start;">
          <span class="material-symbols-outlined">tune</span> Synchronize Pace & Goals
        </button>
        ${isSynced ? `
          <button class="v2-arcade-btn" id="bs-btn-logout" style="width: 100%; justify-content: flex-start; background: var(--danger);">
            <span class="material-symbols-outlined">logout</span> Sign Out (${syncEmail})
          </button>
        ` : `
          <button class="v2-arcade-btn" id="bs-btn-login" style="width: 100%; justify-content: flex-start;">
            <span class="material-symbols-outlined">cloud_sync</span> Sign In with Google
          </button>
        `}
      </div>
    `;

    DOM.bottomSheetOverlay.classList.add('active');

    document.getElementById('bs-btn-view-profile')?.addEventListener('click', () => {
      closeBottomSheet();
      switchView('profile');
    });

    document.getElementById('bs-btn-view-goals')?.addEventListener('click', () => {
      closeBottomSheet();
      openGoalModal();
    });

    document.getElementById('bs-btn-login')?.addEventListener('click', async () => {
      closeBottomSheet();
      if (window.FirebaseSync) {
        try {
          await window.FirebaseSync.signInWithGoogle();
        } catch (e) {
          showToast('Sign in failed.', 'error');
        }
      }
    });

    document.getElementById('bs-btn-logout')?.addEventListener('click', async () => {
      closeBottomSheet();
      if (window.FirebaseSync) {
        await window.FirebaseSync.signOutUser();
        showToast('Signed out.', 'info');
        render();
      }
    });
  }

  function closeBottomSheet() {
    if (DOM.bottomSheetOverlay) DOM.bottomSheetOverlay.classList.remove('active');
  }

  // --- Subject Metrics Helper ---
  function getSubjectOrSyllabusMetrics(selectedSubjectVal) {
    const stats = getSyllabusStats();
    if (!selectedSubjectVal || selectedSubjectVal === 'all' || selectedSubjectVal === 'Entire Syllabus') {
      return {
        name: 'Entire Syllabus (19 Subjects)',
        totalVideos: stats.totalVideos,
        completedVideos: stats.completedVideos,
        remainingVideos: Math.max(1, stats.totalVideos - stats.completedVideos),
        totalHours: parseFloat(stats.totalHours) || 1,
        completedHours: parseFloat(stats.completedHours) || 0,
        remainingHours: Math.max(0.1, (parseFloat(stats.totalHours) || 1) - (parseFloat(stats.completedHours) || 0))
      };
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

  // --- Haptics Utility (Vibration Feedback API) ---
  function triggerHaptic(type = 'step') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'step') navigator.vibrate(12);
        else if (type === 'prev') navigator.vibrate(8);
        else if (type === 'finish' || type === 'install') navigator.vibrate([25, 40, 25]);
        else navigator.vibrate(10);
      } catch (e) {}
    }
  }

  // --- Driver.js Interactive Spotlight & Guided Tutorial Engine ---
  const TUTORIAL_STEPS = [
    {
      badge: "1 / 6",
      targetSelector: '#brand-home-link',
      view: 'dashboard',
      body: `<p>Welcome to <strong>FlowMD</strong> 🚀 — your 16-bit NEET-PG preparation engine. Tap <strong>FlowMD</strong> from anywhere to jump back to your Dashboard.</p>`
    },
    {
      badge: "2 / 6",
      targetSelector: '.v2-quest-header-badge',
      view: 'dashboard',
      body: `<p>⚡ <strong>Daily Quests</strong> — your core study engine. Each day you get a fresh batch of videos to complete. Finish them to keep your streak alive!</p>`
    },
    {
      badge: "3 / 6",
      targetSelector: '.section-title-row',
      view: 'dashboard',
      body: `<p>🎯 <strong>Preparation Goals</strong> — set your daily video pace, exam deadline, and priority subject. The app auto-calculates your catch-up velocity in real time.</p>`
    },
    {
      badge: "4 / 6",
      targetSelector: '[data-view="analytics"]',
      view: 'dashboard',
      body: `<p>📈 <strong>Analytics</strong> — tap here to see your 7-day & 30-day pace charts, subject velocity matrix, and automatic exam-date projections.</p>`
    },
    {
      badge: "5 / 6",
      targetSelector: '[data-view="curriculum"]',
      view: 'dashboard',
      body: `<p>📚 <strong>Curriculum</strong> — browse all 19 MBBS subjects, filter chapters, and mark completed topics across 2,000+ high-yield lectures.</p>`
    },
    {
      badge: "6 / 6",
      targetSelector: '[data-view="profile"]',
      view: 'dashboard',
      body: `<p>👤 <strong>Profile & Settings</strong> — customize your doctor profile, toggle light/dark theme, and submit support tickets here. You're all set — let's crush NEET-PG! 🏆</p>`
    }
  ];

  let currentTutorialStep = 0;

  function openGuidedTutorial(stepIndex = 0) {
    currentTutorialStep = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, stepIndex));
    const modal = document.getElementById('guided-tutorial-modal');
    const popCard = document.getElementById('driver-popover-card');
    const spotBox = document.getElementById('driver-spotlight-box');
    const arrowEl = document.getElementById('driver-popover-arrow');
    if (!modal || !popCard) return;

    triggerHaptic(currentTutorialStep > 0 ? 'step' : 'prev');

    if (!window.history.state || !window.history.state.driverTourActive) {
      window.history.pushState({ driverTourActive: true }, '');
    }

    const step = TUTORIAL_STEPS[currentTutorialStep];
    const totalSteps = TUTORIAL_STEPS.length;

    // Switch view if target element is on another tab — wait for DOM to settle before positioning
    const needsViewSwitch = step.view && state.currentView !== step.view;
    if (needsViewSwitch) {
      switchView(step.view);
    }

    // Always ensure modal and popover card are visible
    modal.style.display = 'block';
    popCard.style.display = 'block';

    const badgeEl = document.getElementById('tut-step-badge');
    const bodyEl = document.getElementById('tut-step-body');
    const nextBtn = document.getElementById('tut-btn-next');
    const dotsEl = document.getElementById('tut-step-dots');

    if (badgeEl) badgeEl.textContent = step.badge;
    if (bodyEl) bodyEl.innerHTML = step.body;

    if (dotsEl) {
      dotsEl.innerHTML = TUTORIAL_STEPS.map((_, i) => `
        <span class="driver-step-dot ${i === currentTutorialStep ? 'active' : ''}"></span>
      `).join('');
    }

    if (nextBtn) {
      if (currentTutorialStep === totalSteps - 1) {
        nextBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">check</span>`;
        nextBtn.title = "Finish Tour 🎉";
      } else {
        nextBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>`;
        nextBtn.title = "Next Step";
      }
    }

    // Bug Fix #1 & #5: Give view switch time to paint before measuring DOM positions.
    // If a view switch happened we wait 300ms (enough for re-render on low-end devices).
    // Otherwise 60ms is sufficient for same-view steps.
    const initialDelay = needsViewSwitch ? 300 : 60;

    // Bug Fix #2: Measure element rect AFTER scroll settles using requestAnimationFrame chain.
    function positionSpotlightAndPopover(retryCount = 0) {
      const targetEl = step.targetSelector ? document.querySelector(step.targetSelector) : null;

      if (targetEl) {
        // Scroll instantly so the browser paints the final position before we measure rect
        try {
          targetEl.scrollIntoView({ behavior: 'instant', block: 'center' });
        } catch (e) {}

        // Use requestAnimationFrame to measure after the browser has painted the scroll
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const rect = targetEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              if (spotBox) {
                spotBox.style.left   = `${Math.max(4, rect.left - 6)}px`;
                spotBox.style.top    = `${Math.max(4, rect.top - 6)}px`;
                spotBox.style.width  = `${Math.min(window.innerWidth - 8, rect.width + 12)}px`;
                spotBox.style.height = `${rect.height + 12}px`;
                spotBox.style.display = 'block';
              }

              const popWidth = Math.min(340, window.innerWidth - 24);
              const popHeight = popCard.offsetHeight || 130;
              const targetCenterX = rect.left + rect.width / 2;
              const cardLeft = Math.max(12, Math.min(window.innerWidth - popWidth - 12, targetCenterX - popWidth / 2));

              popCard.style.left = `${cardLeft}px`;
              popCard.style.transform = 'none';

              if (arrowEl) {
                arrowEl.style.display = 'block';
                const arrowX = Math.max(20, Math.min(popWidth - 20, targetCenterX - cardLeft));
                arrowEl.style.left = `${arrowX}px`;
              }

              const spaceAbove = rect.top;
              if (spaceAbove > popHeight + 24) {
                popCard.style.top = `${Math.max(12, rect.top - popHeight - 14)}px`;
                if (arrowEl) arrowEl.className = 'driver-popover-arrow arrow-down';
              } else {
                popCard.style.top = `${Math.min(window.innerHeight - popHeight - 12, rect.bottom + 14)}px`;
                if (arrowEl) arrowEl.className = 'driver-popover-arrow arrow-up';
              }
              return;
            }

            // Rect was empty inside rAF — retry with longer delay
            if (retryCount < 6) {
              setTimeout(() => positionSpotlightAndPopover(retryCount + 1), 150);
            } else {
              // Final fallback: center card on screen, hide spotlight
              if (spotBox) spotBox.style.display = 'none';
              if (arrowEl) arrowEl.style.display = 'none';
              popCard.style.left = '50%';
              popCard.style.top = '50vh';
              popCard.style.transform = 'translate(-50%, -50%)';
            }
          });
        });
        return;
      }

      // Element not in DOM yet — retry
      if (retryCount < 6) {
        setTimeout(() => positionSpotlightAndPopover(retryCount + 1), 150);
      } else {
        // Final fallback
        if (spotBox) spotBox.style.display = 'none';
        if (arrowEl) arrowEl.style.display = 'none';
        popCard.style.left = '50%';
        popCard.style.top = '50vh';
        popCard.style.transform = 'translate(-50%, -50%)';
      }
    }

    setTimeout(() => positionSpotlightAndPopover(0), initialDelay);
  }

  function closeGuidedTutorial(isUserAction = true) {
    const modal = document.getElementById('guided-tutorial-modal');
    const spotBox = document.getElementById('driver-spotlight-box');
    const popCard = document.getElementById('driver-popover-card');
    // Bug Fix #4: Also hide the popover card so its pointer-events:auto area
    // doesn't block taps on the UI underneath after tour is closed.
    if (modal) modal.style.display = 'none';
    if (spotBox) spotBox.style.display = 'none';
    if (popCard) popCard.style.display = 'none';

    state.hasSeenTutorial = true;
    saveState();

    if (isUserAction) {
      triggerHaptic('finish');
      if (state.currentView !== 'dashboard') switchView('dashboard');
    }
  }

  // Listen for Android Hardware Back Button popstate event
  window.addEventListener('popstate', (e) => {
    const modal = document.getElementById('guided-tutorial-modal');
    if (modal && modal.style.display !== 'none') {
      closeGuidedTutorial(false);
    }
  });



  // --- Goal Modal Helpers (Dual-Plan Fully Functional) ---
  function openGoalModal() {
    if (!DOM.goalModal) return;
    const stats = getSyllabusStats();
    const subSelectA = document.getElementById('select-target-subject');
    const subSelectB = document.getElementById('select-target-subject-b');

    let optionsHTML = `<option value="Entire Syllabus">Entire Syllabus (${stats.totalVideos} Videos • ${stats.totalHours}h)</option>`;
    optionsHTML += stats.subjectsStats.map(s => `
      <option value="${s.name}">${s.name} (${s.totalVideos} Videos • ${s.totalHours}h)</option>
    `).join('');

    if (subSelectA) subSelectA.innerHTML = optionsHTML;
    if (subSelectB) subSelectB.innerHTML = optionsHTML;

    const planA = state.plans[0] || DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT, 'Entire Syllabus');
    const hasPlanB = state.plans.length >= 2;
    const planB = hasPlanB ? state.plans[1] : DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology');

    // Populate Plan A Form
    if (subSelectA) subSelectA.value = planA.targetSubject || 'Entire Syllabus';
    const dateInputA = document.getElementById('input-target-date');
    if (dateInputA) dateInputA.value = planA.targetDate || '2026-08-15';
    const vidsInputA = document.getElementById('input-videos-per-day');
    if (vidsInputA) vidsInputA.value = planA.videosPerDay || 8;

    // Populate Plan B Form
    if (subSelectB) subSelectB.value = planB.targetSubject || 'Pathology';
    const dateInputB = document.getElementById('input-target-date-b');
    if (dateInputB) dateInputB.value = planB.targetDate || '2026-08-15';
    const vidsInputB = document.getElementById('input-videos-per-day-b');
    if (vidsInputB) vidsInputB.value = planB.videosPerDay || 8;

    const togglePlanB = document.getElementById('toggle-plan-b');
    if (togglePlanB) togglePlanB.checked = hasPlanB;

    const tabA = document.getElementById('goal-tab-plan-a');
    const tabB = document.getElementById('goal-tab-plan-b');
    const formA = document.getElementById('goal-plan-a-form');
    const formB = document.getElementById('goal-plan-b-form');

    function switchGoalTab(activeTab) {
      if (activeTab === 'plan_a') {
        if (tabA) { tabA.classList.add('active'); tabA.style.background = '#3b82f633'; tabA.style.opacity = '1'; }
        if (tabB) { tabB.classList.remove('active'); tabB.style.background = 'transparent'; tabB.style.opacity = '0.8'; }
        if (formA) formA.style.display = 'block';
        if (formB) formB.style.display = 'none';
        synchronizeModalPace('init', 'plan_a');
      } else {
        if (tabB) { tabB.classList.add('active'); tabB.style.background = '#f43f5e33'; tabB.style.opacity = '1'; }
        if (tabA) { tabA.classList.remove('active'); tabA.style.background = 'transparent'; tabA.style.opacity = '0.8'; }
        if (formB) formB.style.display = 'block';
        if (formA) formA.style.display = 'none';
        if (togglePlanB && !togglePlanB.checked) {
          togglePlanB.checked = true;
          if (state.plans.length < 2) {
            state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
          }
        }
        synchronizeModalPace('init', 'plan_b');
      }
    }

    if (tabA) tabA.onclick = () => switchGoalTab('plan_a');
    if (tabB) tabB.onclick = () => switchGoalTab('plan_b');

    if (togglePlanB) {
      togglePlanB.onchange = () => {
        if (togglePlanB.checked) {
          if (state.plans.length < 2) {
            state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
          }
          switchGoalTab('plan_b');
        } else {
          if (state.plans.length >= 2) {
            state.plans.splice(1, 1);
          }
          switchGoalTab('plan_a');
        }
        saveState();
      };
    }

    // --- Save Plan A Action ---
    const btnApplyA = document.getElementById('btn-apply-goals');
    if (btnApplyA) {
      btnApplyA.onclick = () => {
        if (!state.plans[0]) state.plans[0] = DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT, 'Entire Syllabus');
        state.plans[0].targetSubject = subSelectA ? subSelectA.value : 'Entire Syllabus';
        state.plans[0].targetDate = dateInputA ? dateInputA.value : '2026-08-15';
        state.plans[0].videosPerDay = Math.max(1, parseInt(vidsInputA ? vidsInputA.value : 8) || 8);
        state.plans[0].videosPerWeek = state.plans[0].videosPerDay * 7;
        state.plans[0].videosPerMonth = state.plans[0].videosPerDay * 30;
        state.plans[0].goalMode = state.goals.goalMode || 'video';

        // Keep legacy state.goals updated
        state.goals.targetSubject = state.plans[0].targetSubject;
        state.goals.targetDate = state.plans[0].targetDate;
        state.goals.videosPerDay = state.plans[0].videosPerDay;

        saveState();
        showToast('Plan A Target Configured & Saved!', 'check_circle', 'Plan A Updated');
        closeGoalModal();
        render();
      };
    }

    // --- Save Plan B Action ---
    const btnApplyB = document.getElementById('btn-apply-goals-b');
    if (btnApplyB) {
      btnApplyB.onclick = () => {
        if (state.plans.length < 2) {
          state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
        }
        state.plans[1].targetSubject = subSelectB ? subSelectB.value : 'Pathology';
        state.plans[1].targetDate = dateInputB ? dateInputB.value : '2026-08-15';
        state.plans[1].videosPerDay = Math.max(1, parseInt(vidsInputB ? vidsInputB.value : 8) || 8);
        state.plans[1].videosPerWeek = state.plans[1].videosPerDay * 7;
        state.plans[1].videosPerMonth = state.plans[1].videosPerDay * 30;
        state.plans[1].goalMode = state.goals.goalModeB || 'video';

        saveState();
        showToast('Plan B Target Configured & Saved!', 'check_circle', 'Plan B Updated');
        closeGoalModal();
        render();
      };
    }

    // --- Remove Plan B Action ---
    const btnRemoveB = document.getElementById('btn-remove-plan-b');
    if (btnRemoveB) {
      btnRemoveB.onclick = () => {
        if (state.plans.length >= 2) state.plans.splice(1, 1);
        if (togglePlanB) togglePlanB.checked = false;
        saveState();
        showToast('Plan B Target Disabled.', 'info', 'Single Plan Mode');
        switchGoalTab('plan_a');
        closeGoalModal();
        render();
      };
    }

    // Close & Cancel buttons
    const btnCancelA = document.getElementById('btn-cancel-goals');
    if (btnCancelA) btnCancelA.onclick = closeGoalModal;
    const btnCancelB = document.getElementById('btn-cancel-goals-b');
    if (btnCancelB) btnCancelB.onclick = closeGoalModal;
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) modalCloseBtn.onclick = closeGoalModal;

    // --- Mode Switchers for Plan A ---
    const btnVideoA = document.getElementById('tab-btn-video');
    const btnHoursA = document.getElementById('tab-btn-hours');
    const fieldsVideoA = document.getElementById('fields-video-mode');
    const fieldsHoursA = document.getElementById('fields-hours-mode');

    function setModalModeA(mode) {
      state.goals.goalMode = mode;
      if (mode === 'video') {
        if (btnVideoA) btnVideoA.classList.add('active');
        if (btnHoursA) btnHoursA.classList.remove('active');
        if (fieldsVideoA) fieldsVideoA.style.display = 'block';
        if (fieldsHoursA) fieldsHoursA.style.display = 'none';
      } else {
        if (btnHoursA) btnHoursA.classList.add('active');
        if (btnVideoA) btnVideoA.classList.remove('active');
        if (fieldsHoursA) fieldsHoursA.style.display = 'block';
        if (fieldsVideoA) fieldsVideoA.style.display = 'none';
      }
      synchronizeModalPace('init', 'plan_a');
    }

    if (btnVideoA) btnVideoA.onclick = () => setModalModeA('video');
    if (btnHoursA) btnHoursA.onclick = () => setModalModeA('hours');

    if (subSelectA) subSelectA.onchange = () => synchronizeModalPace('subjectChange', 'plan_a');
    if (dateInputA) dateInputA.oninput = () => synchronizeModalPace('date', 'plan_a');
    if (vidsInputA) vidsInputA.oninput = () => synchronizeModalPace('dailyVids', 'plan_a');

    // --- Mode Switchers for Plan B ---
    const btnVideoB = document.getElementById('tab-btn-video-b');
    const btnHoursB = document.getElementById('tab-btn-hours-b');
    const fieldsVideoB = document.getElementById('fields-video-mode-b');
    const fieldsHoursB = document.getElementById('fields-hours-mode-b');

    function setModalModeB(mode) {
      state.goals.goalModeB = mode;
      if (mode === 'video') {
        if (btnVideoB) btnVideoB.classList.add('active');
        if (btnHoursB) btnHoursB.classList.remove('active');
        if (fieldsVideoB) fieldsVideoB.style.display = 'block';
        if (fieldsHoursB) fieldsHoursB.style.display = 'none';
      } else {
        if (btnHoursB) btnHoursB.classList.add('active');
        if (btnVideoB) btnVideoB.classList.remove('active');
        if (fieldsHoursB) fieldsHoursB.style.display = 'block';
        if (fieldsVideoB) fieldsVideoB.style.display = 'none';
      }
      synchronizeModalPace('init', 'plan_b');
    }

    if (btnVideoB) btnVideoB.onclick = () => setModalModeB('video');
    if (btnHoursB) btnHoursB.onclick = () => setModalModeB('hours');

    if (subSelectB) subSelectB.onchange = () => synchronizeModalPace('subjectChange', 'plan_b');
    if (dateInputB) dateInputB.oninput = () => synchronizeModalPace('date', 'plan_b');
    if (vidsInputB) vidsInputB.oninput = () => synchronizeModalPace('dailyVids', 'plan_b');

    // Math Guide Accordion Toggles
    document.querySelectorAll('.math-guide-card').forEach(card => {
      const header = card.querySelector('.math-guide-header');
      const body = card.querySelector('.math-guide-body');
      const icon = card.querySelector('.math-guide-toggle-icon');
      if (header && body) {
        header.onclick = () => {
          const isHidden = (body.style.display === 'none' || !body.style.display);
          body.style.display = isHidden ? 'block' : 'none';
          if (icon) icon.textContent = isHidden ? 'expand_less' : 'expand_more';
        };
      }
    });

    switchGoalTab('plan_a');
    setModalModeA(state.goals.goalMode || 'video');
    setModalModeB(state.goals.goalModeB || 'video');
    DOM.goalModal.style.display = 'flex';
  }

  function synchronizeModalPace(source, planKey = 'plan_a') {
    const isPlanB = (planKey === 'plan_b');
    const subSelect = document.getElementById(isPlanB ? 'select-target-subject-b' : 'select-target-subject');
    const selectedSubVal = subSelect ? subSelect.value : (isPlanB ? 'Pathology' : 'Entire Syllabus');
    const metrics = getSubjectOrSyllabusMetrics(selectedSubVal);

    const dateInput = document.getElementById(isPlanB ? 'input-target-date-b' : 'input-target-date');
    const badge = document.getElementById(isPlanB ? 'days-remaining-badge-b' : 'days-remaining-badge');
    const bannerText = document.getElementById(isPlanB ? 'smart-math-text-b' : 'smart-math-text');
    const vidsInput = document.getElementById(isPlanB ? 'input-videos-per-day-b' : 'input-videos-per-day');
    const hoursInput = document.getElementById(isPlanB ? 'input-daily-target-b' : 'input-daily-target');

    let now = new Date();
    const planObj = isPlanB ? (state.plans[1] || {}) : (state.plans[0] || {});

    if (source === 'init' || source === 'subjectChange') {
      const defaultPace = planObj.videosPerDay || 8;
      const daysNeeded = Math.ceil(metrics.remainingVideos / defaultPace);
      const targetDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = targetDate.toISOString().slice(0, 10);
    }

    let targetDate = new Date(dateInput ? dateInput.value : '2026-12-31');
    const isPast = (targetDate <= now);
    if (isNaN(targetDate.getTime()) || targetDate <= now) {
      targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    let days = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));

    if (source === 'dailyVids') {
      const userVids = Math.max(1, parseInt(vidsInput ? vidsInput.value : 1) || 1);
      days = Math.ceil(metrics.remainingVideos / userVids);
      targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = targetDate.toISOString().slice(0, 10);
    } else if (source === 'dailyHours') {
      const userHours = Math.max(0.5, parseFloat(hoursInput ? hoursInput.value : 0.5) || 0.5);
      days = Math.ceil(metrics.remainingHours / userHours);
      targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = targetDate.toISOString().slice(0, 10);
    }

    if (badge) badge.textContent = `${days} Days Left`;

    const dailyVids = Math.max(1, Math.ceil(metrics.remainingVideos / days));
    const weeklyVids = dailyVids * 7;
    const monthlyVids = dailyVids * 30;

    if (source !== 'dailyVids' && vidsInput) vidsInput.value = dailyVids;
    const vidsWeekEl = document.getElementById(isPlanB ? 'input-videos-per-week-b' : 'input-videos-per-week');
    if (vidsWeekEl) vidsWeekEl.value = weeklyVids;
    const vidsMonthEl = document.getElementById(isPlanB ? 'input-videos-per-month-b' : 'input-videos-per-month');
    if (vidsMonthEl) vidsMonthEl.value = monthlyVids;

    const dailyHours = Math.max(0.1, (metrics.remainingHours / days)).toFixed(1);
    const weeklyHours = (parseFloat(dailyHours) * 7).toFixed(1);
    const monthlyHours = Math.round(parseFloat(dailyHours) * 30);

    if (source !== 'dailyHours' && hoursInput) hoursInput.value = dailyHours;
    const hrsWeekEl = document.getElementById(isPlanB ? 'input-weekly-target-b' : 'input-weekly-target');
    if (hrsWeekEl) hrsWeekEl.value = weeklyHours;
    const hrsMonthEl = document.getElementById(isPlanB ? 'input-monthly-target-b' : 'input-monthly-target');
    if (hrsMonthEl) hrsMonthEl.value = monthlyHours;

    const dateFormatted = targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (bannerText) {
      if (isPast) {
        bannerText.textContent = `⚠️ Target deadline has passed. Update daily target to auto-generate completion date.`;
      } else {
        const daysToFinish = Math.ceil(metrics.remainingVideos / dailyVids);
        if (daysToFinish < days) {
          bannerText.textContent = `🎉 Comfortably Ahead! Finish ${selectedSubVal} in ${daysToFinish} days.`;
        } else {
          bannerText.textContent = `🎯 Right on Track! ${dailyVids} vids/day finishes ${selectedSubVal} on ${dateFormatted}.`;
        }
      }
    }
  }

  function closeGoalModal() {
    if (DOM.goalModal) DOM.goalModal.style.display = 'none';
  }

  // --- Toast Notification Helper (PxlKit PixelAlert UI) ---
  function showToast(message, icon = 'check_circle', title = 'Quest Updated!') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    let alertTone = 'success';
    let alertIcon = icon || 'check_circle';

    if (icon === 'warning' || icon === 'error') {
      alertTone = 'warning';
      alertIcon = 'warning';
    } else if (icon === 'info' || icon === 'palette' || icon === 'auto_awesome') {
      alertTone = 'info';
      alertIcon = 'info';
    } else if (icon === 'bolt' || icon === 'check_circle' || icon === 'check' || icon === 'rocket_launch') {
      alertTone = 'success';
      alertIcon = 'check_circle';
    }

    const toast = document.createElement('div');
    toast.className = `pxl-alert pxl-alert-${alertTone} pxl-toast-alert`;
    toast.style.pointerEvents = 'auto';
    toast.style.margin = '0';
    toast.style.width = '100%';

    toast.innerHTML = `
      <span class="material-symbols-outlined pxl-alert-icon">${alertIcon}</span>
      <div class="pxl-alert-content">
        <div class="pxl-alert-title">${title}</div>
        <div class="pxl-alert-message">${message}</div>
      </div>
      <button type="button" class="pxl-toast-close" onclick="this.parentElement.remove()" style="background: transparent; border: none; color: #94a3b8; font-family: monospace; font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1;">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- Run Initialization ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
