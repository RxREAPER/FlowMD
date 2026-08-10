/* ============================================================
   FlowMD Core — State Store
   Owns the single global `state` object plus all persistence,
   migration, streak/activity tracking, and local-wins merging.

   Extracted verbatim from app.js (2026-08-10). app.js gets the
   shared object via getState() and the helper functions by
   destructuring — behavior is unchanged.
   ============================================================ */
(function () {
  'use strict';

  const {
    STORAGE_KEYS,
    SCHEMA_VERSION,
    DEFAULT_GOALS,
    DEFAULT_PERSONAL,
    DEFAULT_PLAN,
    PLAN_A_ACCENT,
    STUDY_SOURCES,
    todayKey,
    toLocalDateKey
  } = window.FlowMD.constants;

  // --- Safe JSON parsing: corrupt localStorage must never crash the app ---
  function safeParse(raw, fallback) {
    if (raw == null || raw === '') return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Corrupt localStorage value discarded:', e);
      return fallback;
    }
  }

  // --- localStorage schema versioning + migrations ---
  function migrateStateSchema() {
    try {
      const rawVersion = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
      const currentVersion = parseInt(rawVersion, 10) || 0;
      if (currentVersion >= SCHEMA_VERSION) return;

      // v2 → v3: unify storage keys under the flowmd_ prefix (retro-era
      // marrow_planner_* keys renamed; old values carried over once, then
      // removed). Runs BEFORE the v1 → v2 block so a v1-era profile's keys
      // are renamed first and the video-ID prefixing still finds its data.
      if (currentVersion < 3) {
        const KEY_RENAMES = {
          'marrow_planner_completed_videos': 'flowmd_completed_videos',
          'marrow_planner_goals': 'flowmd_goals',
          'marrow_planner_theme': 'flowmd_theme',
          'marrow_planner_streak': 'flowmd_streak',
          'marrow_planner_daily_batch': 'flowmd_daily_batch',
          'marrow_planner_personal': 'flowmd_personal',
          'marrow_planner_urgency': 'flowmd_urgency',
          'marrow_planner_daily_history': 'flowmd_daily_history',
          'marrow_planner_queue_completed_in_batch': 'flowmd_queue_completed_in_batch',
          'marrow_planner_queue_batch_videos': 'flowmd_queue_batch_videos',
          'marrow_planner_theme_style': 'flowmd_theme_style'
        };
        for (const [oldKey, newKey] of Object.entries(KEY_RENAMES)) {
          const raw = localStorage.getItem(oldKey);
          if (raw !== null && localStorage.getItem(newKey) === null) {
            localStorage.setItem(newKey, raw);
          }
          localStorage.removeItem(oldKey);
        }
      }

      // v1 → v2: legacy pre-namespaced video IDs get the marrow_8:: prefix.
      // (Applied against the stored payload before state is assembled.)
      if (currentVersion < 2) {
        const savedVideos = localStorage.getItem(STORAGE_KEYS.COMPLETED_VIDEOS);
        if (savedVideos) {
          const parsed = safeParse(savedVideos, {});
          const migrated = {};
          let changed = false;
          for (const key in parsed) {
            if (key.indexOf('::') === -1) {
              migrated['marrow_8::' + key] = parsed[key];
              changed = true;
            } else {
              migrated[key] = parsed[key];
            }
          }
          if (changed) localStorage.setItem(STORAGE_KEYS.COMPLETED_VIDEOS, JSON.stringify(migrated));
        }
      }

      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, String(SCHEMA_VERSION));
    } catch (e) {
      console.warn('Schema migration failed:', e);
    }
  }

  // --- App State (single global mutable object) ---
  let state = {
    currentView: 'dashboard',
    activeSubjectId: 'anatomy',
    completedVideos: {},
    expandedChapters: {},
    goals: { ...DEFAULT_GOALS },
    personal: { ...DEFAULT_PERSONAL },
    theme: 'dark',
    themeStyle: 'modern',
    searchQuery: '',
    streakData: { lastStudyDate: null, currentStreak: 0 },
    dailyHistory: {},
    queueCompletedInBatch: 0,
    queueBatchVideoIds: [],
    isConfigured: false,
    activeSource: 'marrow_8',
    isOffline: false,
    // Dual-Subject Tracking v2
    plans: [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)],
    activePlanId: 'plan_a',
    dailyHistoryBySubject: {},
    // Bulk Chapter Completion (excluded from analytics)
    bulkCompletedChapters: {}
  };

  function getState() {
    return state;
  }

  // --- Migrate legacy single-plan state → plans[] ---
  function migrateStateToPlans() {
    const legacySub = (state.goals && state.goals.targetSubject) || '';
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
      queueCompletedInBatch: legacyDone,
      targetUnits: []
    }];
  }

  // --- State Persistence & Cloud Sync ---
  function loadState() {
    try {
      migrateStateSchema();

      const savedVideos = localStorage.getItem(STORAGE_KEYS.COMPLETED_VIDEOS);
      if (savedVideos) state.completedVideos = safeParse(savedVideos, {});

      // Migrate legacy (pre-namespaced) video IDs → marrow_8:: prefix
      let needsMigrate = false;
      const migrated = {};
      for (const key in state.completedVideos) {
        if (key.indexOf('::') === -1) {
          migrated['marrow_8::' + key] = state.completedVideos[key];
          needsMigrate = true;
        } else {
          migrated[key] = state.completedVideos[key];
        }
      }
      if (needsMigrate) state.completedVideos = migrated;

      const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (savedGoals) state.goals = { ...DEFAULT_GOALS, ...safeParse(savedGoals, {}) };

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        state.theme = savedTheme;
      } else {
        state.theme = 'dark';
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
      }

      const savedThemeStyle = localStorage.getItem(STORAGE_KEYS.THEME_STYLE);
      if (savedThemeStyle === 'modern' || savedThemeStyle === 'retro') {
        state.themeStyle = savedThemeStyle;
      } else {
        state.themeStyle = 'modern';
      }

      const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (savedStreak) state.streakData = safeParse(savedStreak, { lastStudyDate: null, currentStreak: 0 });

      const savedPersonal = localStorage.getItem(STORAGE_KEYS.PERSONAL);
      if (savedPersonal) state.personal = { ...DEFAULT_PERSONAL, ...safeParse(savedPersonal, {}) };

      const savedHistory = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY);
      if (savedHistory) state.dailyHistory = safeParse(savedHistory, {});

      const savedQueueBatch = localStorage.getItem(STORAGE_KEYS.QUEUE_BATCH);
      if (savedQueueBatch !== null) state.queueCompletedInBatch = parseInt(savedQueueBatch) || 0;

      const savedBatchVids = localStorage.getItem(STORAGE_KEYS.QUEUE_BATCH_VIDEOS);
      if (savedBatchVids) state.queueBatchVideoIds = safeParse(savedBatchVids, []);

      const savedTutorial = localStorage.getItem(STORAGE_KEYS.TUTORIAL_SEEN);
      if (savedTutorial === 'true') state.isConfigured = true;

      const savedSource = localStorage.getItem('flowmd_active_source');
      if (savedSource && STUDY_SOURCES.some(s => s.id === savedSource)) {
        state.activeSource = savedSource;
      }

      const savedConfigured = localStorage.getItem('flowmd_is_configured');
      if (savedConfigured === 'true') state.isConfigured = true;

      // --- Dual-Subject Tracking v2: load plans ---
      const savedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (savedPlans) {
        const parsed = safeParse(savedPlans, []);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.plans = parsed;
        }
      } else {
        // Migrate legacy single-subject state to Plan A
        migrateStateToPlans();
      }

      const savedHistBySubject = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT);
      if (savedHistBySubject) state.dailyHistoryBySubject = safeParse(savedHistBySubject, {});

      // --- Bulk Chapter Completion ---
      const savedBulkChapters = localStorage.getItem(STORAGE_KEYS.BULK_COMPLETED_CHAPTERS);
      if (savedBulkChapters) state.bulkCompletedChapters = safeParse(savedBulkChapters, {});

    } catch (e) {
      console.warn('Error loading state:', e);
    }
  }

  let cloudSyncTimeout = null;
  function saveState() {
    try {
      state.lastLocalUpdate = Date.now();
      localStorage.setItem(STORAGE_KEYS.COMPLETED_VIDEOS, JSON.stringify(state.completedVideos));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
      localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
      localStorage.setItem(STORAGE_KEYS.THEME_STYLE, state.themeStyle || 'modern');
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(state.streakData));
      localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(state.personal));
      localStorage.setItem(STORAGE_KEYS.DAILY_HISTORY, JSON.stringify(state.dailyHistory || {}));
      localStorage.setItem(STORAGE_KEYS.QUEUE_BATCH, (state.queueCompletedInBatch || 0).toString());
      localStorage.setItem(STORAGE_KEYS.QUEUE_BATCH_VIDEOS, JSON.stringify(state.queueBatchVideoIds || []));
      localStorage.setItem('flowmd_active_source', state.activeSource || 'marrow_8');
      localStorage.setItem('flowmd_is_configured', state.isConfigured ? 'true' : 'false');
      // Dual-Subject Tracking v2
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(state.plans || []));
      localStorage.setItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT, JSON.stringify(state.dailyHistoryBySubject || {}));
      localStorage.setItem(STORAGE_KEYS.BULK_COMPLETED_CHAPTERS, JSON.stringify(state.bulkCompletedChapters || {}));
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, String(SCHEMA_VERSION));

      if (window.FirebaseSync && window.FirebaseSync.currentUser) {
        if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
        cloudSyncTimeout = setTimeout(() => {
          window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state, window.FirebaseSync.currentUser);
        }, 800);
      }
    } catch (e) {
      console.warn('Error saving state:', e);
    }
  }

  function markStudyActivity(isAdding = true, subjectId = null) {
    const todayStr = todayKey();
    if (!state.streakData) state.streakData = { lastStudyDate: null, currentStreak: 0 };
    if (!state.dailyHistory) state.dailyHistory = {};
    if (!state.dailyHistoryBySubject) state.dailyHistoryBySubject = {};

    const curCount = state.dailyHistory[todayStr] || 0;
    if (isAdding) {
      state.dailyHistory[todayStr] = curCount + 1;
    } else {
      state.dailyHistory[todayStr] = Math.max(0, curCount - 1);
    }

    // Track per-subject daily history
    if (subjectId) {
      if (!state.dailyHistoryBySubject[subjectId]) {
        state.dailyHistoryBySubject[subjectId] = {};
      }
      const subjCount = state.dailyHistoryBySubject[subjectId][todayStr] || 0;
      if (isAdding) {
        state.dailyHistoryBySubject[subjectId][todayStr] = subjCount + 1;
      } else {
        state.dailyHistoryBySubject[subjectId][todayStr] = Math.max(0, subjCount - 1);
      }
    }

    if (isAdding) {
      if (state.streakData.lastStudyDate !== todayStr) {
        const yesterday = toLocalDateKey(new Date(Date.now() - 86400000));
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

  // Merge plans arrays with local-wins: for each plan ID present locally, local
  // data takes precedence. Cloud-only plans (new device added a plan) are appended.
  function mergePlansLocalWins(cloudPlans, localPlans) {
    if (!cloudPlans || !Array.isArray(cloudPlans) || cloudPlans.length === 0) return localPlans;
    if (!localPlans || localPlans.length === 0) return [...cloudPlans];
    const merged = localPlans.map(localPlan => {
      const cloudPlan = cloudPlans.find(cp => cp.id === localPlan.id);
      if (!cloudPlan) return localPlan;
      return { ...cloudPlan, ...localPlan };
    });
    cloudPlans.forEach(cloudPlan => {
      if (!merged.find(p => p.id === cloudPlan.id)) {
        merged.push(cloudPlan);
      }
    });
    return merged;
  }

  window.FlowMD.store = {
    getState,
    safeParse,
    migrateStateSchema,
    loadState,
    saveState,
    markStudyActivity,
    getStudyStreak,
    mergePlansLocalWins
  };
})();
