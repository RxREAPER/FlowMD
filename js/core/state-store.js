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
  // Carries over ONLY values the legacy goals actually stored. A fresh user
  // (no flowmd_plans, no legacy goals) must end up with an unset plan — the
  // site waits for the user to fill subject / pace / deadline.
  function migrateStateToPlans() {
    const legacyGoals = (state.goals && typeof state.goals === 'object') ? state.goals : {};
    const legacyVids = (legacyGoals.videosPerDay && legacyGoals.videosPerDay > 0) ? legacyGoals.videosPerDay : null;
    const legacyWeek = (legacyGoals.videosPerWeek && legacyGoals.videosPerWeek > 0) ? legacyGoals.videosPerWeek : null;
    const legacyMonth = (legacyGoals.videosPerMonth && legacyGoals.videosPerMonth > 0) ? legacyGoals.videosPerMonth : null;
    const legacyBatch = Array.isArray(state.queueBatchVideoIds) ? state.queueBatchVideoIds : [];
    const legacyDone = state.queueCompletedInBatch || 0;

    state.plans = [{
      id: 'plan_a',
      label: 'Plan A',
      accentColor: PLAN_A_ACCENT,
      targetSubject: legacyGoals.targetSubject || '',
      targetDate: legacyGoals.targetDate || '',
      videosPerDay: legacyVids,
      videosPerWeek: legacyVids ? (legacyWeek || legacyVids * 7) : null,
      videosPerMonth: legacyVids ? (legacyMonth || legacyVids * 30) : null,
      dailyTargetHours: legacyGoals.dailyTargetHours || null,
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

  // Top-level state fields that are written to Firestore (mirrors the
  // syncToCloud payload). Local-only bookkeeping (theme, isOffline, search,
  // expandedChapters, lastLocalUpdate, _dirtyFields, _prevSyncedState) is
  // never cloud-written — excluding it here prevents junk fields from ever
  // being pushed by field-level updates.
  const CLOUD_STATE_FIELDS = [
    'completedVideos', 'speed', 'goals', 'streakData', 'personal', 'subjectUrgency',
    'dailyBatch', 'dailyHistory', 'dailyHistoryBySubject', 'plans', 'activePlanId',
    'activeSource', 'isConfigured', 'themeStyle', 'queueCompletedInBatch',
    'queueBatchVideoIds'
  ];

  // Shallow copy of just the cloud-writable fields — used as the baseline for
  // dirty-field comparison so a no-op save never schedules a cloud write.
  function snapshotCloudState(st) {
    const snap = {};
    CLOUD_STATE_FIELDS.forEach(f => { if (st[f] !== undefined) snap[f] = st[f]; });
    return snap;
  }

  // localStorage keys written by saveState, with value getters. Used both for
  // selective writes (unchanged keys are skipped) and to detect completedVideos
  // changes, which drive the memoized syllabus-stats revision counter.
  const LOCAL_KEYS = [
    [STORAGE_KEYS.COMPLETED_VIDEOS, () => JSON.stringify(state.completedVideos)],
    [STORAGE_KEYS.GOALS, () => JSON.stringify(state.goals)],
    [STORAGE_KEYS.THEME, () => state.theme],
    [STORAGE_KEYS.THEME_STYLE, () => state.themeStyle || 'modern'],
    [STORAGE_KEYS.STREAK, () => JSON.stringify(state.streakData)],
    [STORAGE_KEYS.PERSONAL, () => JSON.stringify(state.personal)],
    [STORAGE_KEYS.DAILY_HISTORY, () => JSON.stringify(state.dailyHistory || {})],
    [STORAGE_KEYS.QUEUE_BATCH, () => (state.queueCompletedInBatch || 0).toString()],
    [STORAGE_KEYS.QUEUE_BATCH_VIDEOS, () => JSON.stringify(state.queueBatchVideoIds || [])],
    ['flowmd_active_source', () => state.activeSource || 'marrow_8'],
    ['flowmd_is_configured', () => state.isConfigured ? 'true' : 'false'],
    [STORAGE_KEYS.PLANS, () => JSON.stringify(state.plans || [])],
    [STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT, () => JSON.stringify(state.dailyHistoryBySubject || {})],
    [STORAGE_KEYS.BULK_COMPLETED_CHAPTERS, () => JSON.stringify(state.bulkCompletedChapters || {})],
    [STORAGE_KEYS.SCHEMA_VERSION, () => String(SCHEMA_VERSION)]
  ];

  // Last-written localStorage values; null until the first save (writes all).
  let localSnapshot = null;

  let cloudSyncTimeout = null;
  function saveState() {
    try {
      state.lastLocalUpdate = Date.now();
      // Selective writes: unchanged keys are skipped so no-op saves never
      // churn localStorage or trigger storage events in other tabs.
      LOCAL_KEYS.forEach((pair) => {
        const key = pair[0];
        const value = pair[1]();
        if (localSnapshot === null || localSnapshot[key] !== value) {
          localStorage.setItem(key, value);
          if (localSnapshot !== null && key === STORAGE_KEYS.COMPLETED_VIDEOS) {
            // completedVideos changed → the memoized syllabus stats are stale.
            state.completedVideosRevision = (state.completedVideosRevision || 0) + 1;
          }
          if (localSnapshot !== null) localSnapshot[key] = value;
        }
      });
      if (localSnapshot === null) {
        localSnapshot = {};
        LOCAL_KEYS.forEach(pair => { localSnapshot[pair[0]] = pair[1](); });
      }

      if (window.FirebaseSync && window.FirebaseSync.currentUser) {
        // Track what has changed since the last successful cloud push. The
        // baseline snapshot only advances after a push succeeds, so rapid
        // consecutive saveState() calls accumulate — no change is dropped.
        state._dirtyFields = window.FlowMD.sync.computeDirtyFields(state._prevSyncedState, snapshotCloudState(state));
        if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
        cloudSyncTimeout = setTimeout(() => {
          if (!state._dirtyFields || state._dirtyFields.length === 0) return;
          // Pre-push baseline: advancing to it after the write succeeds keeps
          // any change made DURING the push flagged dirty for the next cycle.
          const snapshot = snapshotCloudState(state);
          const fields = {};
          state._dirtyFields.forEach(f => { fields[f] = state[f]; });
          // Keep Google profile info fresh on every push (matches old behavior).
          const u = window.FirebaseSync.currentUser;
          if (u) {
            fields.googleDisplayName = u.displayName || null;
            fields.googlePhotoURL = u.photoURL || null;
          }
          window.FirebaseSync.updateCloudFields(window.FirebaseSync.currentUser.uid, fields)
            .then(() => {
              state._prevSyncedState = snapshot;
              state._dirtyFields = [];
            })
            .catch((err) => {
              console.warn('Cloud sync deferred, will retry on next change:', err);
            });
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
    mergePlansLocalWins,
    snapshotCloudState
  };
})();
