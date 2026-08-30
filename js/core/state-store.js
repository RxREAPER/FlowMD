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
        // Retro theme removed (2026-08-12) — any migrated retro style snaps to modern.
        if (localStorage.getItem('flowmd_theme_style') === 'retro') {
          localStorage.setItem('flowmd_theme_style', 'modern');
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

      // v3 → v4: the flat per-edition fields (flowmd_plans_v2, flowmd_goals,
      // flowmd_daily_history, ...) become one partition per edition. The
      // existing values belong to the ACTIVE edition; the other edition starts
      // with an unset slice (no assumed goals — the site waits for input).
      // loadState() reads flowmd_editions_v4 going forward.
      if (currentVersion < 4) {
        const savedActive = localStorage.getItem('flowmd_active_source');
        const active = STUDY_SOURCES.some(s => s.id === savedActive) ? savedActive : 'marrow_8';
        const editions = {};
        const build = (src) => {
          const slice = defaultEditionSlice();
          if (src === active) {
            const savedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
            if (savedPlans) {
              const parsed = safeParse(savedPlans, []);
              if (Array.isArray(parsed) && parsed.length > 0) slice.plans = parsed;
            }
            const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
            if (savedGoals) slice.goals = { ...DEFAULT_GOALS, ...safeParse(savedGoals, {}) };
            const savedHistory = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY);
            if (savedHistory) slice.dailyHistory = safeParse(savedHistory, {});
            const savedHistBySubject = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT);
            if (savedHistBySubject) slice.dailyHistoryBySubject = safeParse(savedHistBySubject, {});
            const savedBulk = localStorage.getItem(STORAGE_KEYS.BULK_COMPLETED_CHAPTERS);
            if (savedBulk) slice.bulkCompletedChapters = safeParse(savedBulk, {});
            // activePlanId was never persisted locally — default it.
          }
          return slice;
        };
        STUDY_SOURCES.forEach((s) => { if (s.id !== 'prepladder_x') editions[s.id] = build(s.id); });
        localStorage.setItem(STORAGE_KEYS.EDITIONS, JSON.stringify(editions));
      }

      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, String(SCHEMA_VERSION));
    } catch (e) {
      console.warn('Schema migration failed:', e);
    }
  }

  // One durable slice per study edition. Each owns its own plans, goals
  // (legacy mirror), daily history (charts / goal pulse), per-subject daily
  // counts, active plan and bulk-completed chapters — so switching editions
  // switches the ENTIRE planning/analytics context, and the two partitions
  // sync independently (suffixed cloud fields with their own clocks).
  function defaultEditionSlice() {
    return {
      plans: [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)],
      goals: { ...DEFAULT_GOALS },
      dailyHistory: {},
      dailyHistoryBySubject: {},
      activePlanId: 'plan_a',
      bulkCompletedChapters: {}
    };
  }

  // --- App State (single global mutable object) ---
  let state = {
    currentView: 'dashboard',
    activeSubjectId: 'anatomy',
    completedVideos: {},
    expandedChapters: {},
    // LIVE WORKING COPY of editions[activeSource]: views, the queue engine
    // and analytics read/write these top-level fields exactly as before;
    // saveState() flushes them into the active edition's slice. On a source
    // switch the live fields are re-pointed at the other edition's slice, so
    // no view code needs to know about editions.
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
    bulkCompletedChapters: {},
    // Per-edition durable partitions (source of truth for everything above).
    editions: {
      marrow_8: defaultEditionSlice(),
      marrow_6_5: defaultEditionSlice()
    }
  };

  // Copy the live working fields into the active edition's durable slice.
  // Runs at the START of every saveState so in-place mutations (plans[0].x = y,
  // dailyHistory[day]++, bulkCompletedChapters[k] = true) always land in the
  // right partition before persistence and cloud dirty-tracking.
  function flushLiveToEdition() {
    const src = state.activeSource || 'marrow_8';
    if (!state.editions || !state.editions[src]) {
      if (!state.editions) state.editions = {};
      state.editions[src] = defaultEditionSlice();
    }
    const e = state.editions[src];
    e.plans = state.plans;
    e.goals = state.goals;
    e.dailyHistory = state.dailyHistory;
    e.dailyHistoryBySubject = state.dailyHistoryBySubject;
    e.activePlanId = state.activePlanId;
    e.bulkCompletedChapters = state.bulkCompletedChapters;
  }

  // Point the live working fields at an edition's durable slice (source
  // switch + load). After this, every view reads that edition's data.
  function loadEditionIntoLive(src) {
    if (!state.editions || !state.editions[src]) {
      if (!state.editions) state.editions = {};
      state.editions[src] = defaultEditionSlice();
    }
    const e = state.editions[src];
    state.plans = e.plans;
    state.goals = e.goals;
    state.dailyHistory = e.dailyHistory;
    state.dailyHistoryBySubject = e.dailyHistoryBySubject;
    state.activePlanId = e.activePlanId;
    state.bulkCompletedChapters = e.bulkCompletedChapters;
  }

  // Switch the active edition: flush the current live fields into the old
  // slice, point activeSource at the new edition, and load its slice as the
  // live view. Per-day queue bookkeeping resets so the daily quests
  // regenerate from the new edition's dataset.
  function switchSource(src) {
    // Validate against the declared study sources (works with or without the
    // dormant sync module loaded). Only available sources are switchable.
    const valid = STUDY_SOURCES.some(s => s.id === src && s.available);
    if (!valid) return false;
    flushLiveToEdition();
    state.activeSource = src;
    loadEditionIntoLive(src);
    saveState();
    return true;
  }

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

      // Retro theme was removed (2026-08-12) — any legacy value snaps to modern.
      state.themeStyle = 'modern';

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

      // --- Per-edition partitions (v4): load the durable slices, then point
      // the live working fields at the active edition. Legacy v3 flat data
      // was folded into editions[activeSource] by migrateStateSchema. ---
      const savedEditions = localStorage.getItem(STORAGE_KEYS.EDITIONS);
      if (savedEditions) {
        const parsed = safeParse(savedEditions, null);
        if (parsed && typeof parsed === 'object') {
          state.editions = parsed;
          // Fill any missing edition slices (e.g. a doc written before the
          // second edition existed) with unset defaults.
          STUDY_SOURCES.forEach((s) => {
            if (s.id === 'prepladder_x') return;
            if (!state.editions[s.id] || typeof state.editions[s.id] !== 'object') {
              state.editions[s.id] = defaultEditionSlice();
            }
          });
        }
      } else {
        // Legacy v3 (or older): load the flat fields into the ACTIVE edition's
        // slice (migrateStateSchema wrote flowmd_editions_v4, but a profile
        // that never saved after migrating still has flat keys only).
        const src = state.activeSource;
        if (!state.editions) state.editions = {};
        if (!state.editions[src]) state.editions[src] = defaultEditionSlice();
        const e = state.editions[src];
        const savedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
        if (savedPlans) {
          const parsed = safeParse(savedPlans, []);
          if (Array.isArray(parsed) && parsed.length > 0) e.plans = parsed;
        } else {
          migrateStateToPlans();
          e.plans = state.plans;
        }
        const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        if (savedGoals) e.goals = { ...DEFAULT_GOALS, ...safeParse(savedGoals, {}) };
        const savedHistory = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY);
        if (savedHistory) e.dailyHistory = safeParse(savedHistory, {});
        const savedHistBySubject = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT);
        if (savedHistBySubject) e.dailyHistoryBySubject = safeParse(savedHistBySubject, {});
        const savedBulkChapters = localStorage.getItem(STORAGE_KEYS.BULK_COMPLETED_CHAPTERS);
        if (savedBulkChapters) e.bulkCompletedChapters = safeParse(savedBulkChapters, {});
        // Ensure the second edition exists.
        STUDY_SOURCES.forEach((s) => {
          if (s.id === 'prepladder_x' || s.id === src) return;
          if (!state.editions[s.id]) state.editions[s.id] = defaultEditionSlice();
        });
      }

      // Point the live working fields at the active edition's slice.
      loadEditionIntoLive(state.activeSource);

    } catch (e) {
      console.warn('Error loading state:', e);
    }
  }

  // Top-level state fields that are written to Firestore (mirrors the
  // syncToCloud payload). Per-edition fields appear SUFFIXED (plans_marrow_8,
  // dailyHistory_marrow_6_5, ...) so each edition has its own clock and
  // arbitrates independently. Local-only bookkeeping (theme, isOffline,
  // search, expandedChapters, lastLocalUpdate, _dirtyFields, _prevSyncedState)
  // and dead/transient fields (speed, subjectUrgency, dailyBatch, queue
  // counters) are never cloud-written — excluding them here prevents junk
  // fields from ever being pushed by field-level updates.
  const CLOUD_STATE_FIELDS = (function () {
    const names = ['completedVideos', 'streakData', 'personal', 'activeSource', 'isConfigured', 'themeStyle'];
    const syncApi = (window.FlowMD && window.FlowMD.sync) || {};
    const ed = syncApi.EDITION_IDS || ['marrow_8', 'marrow_6_5'];
    const bases = syncApi.EDITION_BASE_FIELDS || ['plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject', 'activePlanId', 'bulkCompletedChapters'];
    ed.forEach((src) => { bases.forEach((b) => { names.push(b + '_' + src); }); });
    return names;
  })();

  // How many days of daily-history maps to keep. The charts only ever look
  // back 7/30 days and the per-subject map only needs today, so anything
  // older is dead weight in localStorage and the Firestore doc.
  const HISTORY_RETENTION_DAYS = 90;

  // Read one cloud-writable field from state — global fields come from the
  // top level, suffixed per-edition fields from the edition's durable slice.
  function readCloudField(st, fieldName) {
    const syncApi = (window.FlowMD && window.FlowMD.sync) || {};
    const edPart = syncApi.editionFieldParts ? syncApi.editionFieldParts(fieldName) : null;
    if (edPart) {
      const e = (st.editions && st.editions[edPart.src]) || {};
      return e[edPart.base];
    }
    return st[fieldName];
  }

  // Snapshot of just the cloud-writable fields — used as the baseline for
  // dirty-field comparison so a no-op save never schedules a cloud write.
  // DEEP copy: the baseline must never share object references with live
  // state, or an in-place edit (e.g. `state.plans[0].videosPerDay = x`, which
  // the Study Plan Config does) would compare identical (a === b) and never
  // be seen as dirty — silently losing the edit for the cloud.
  function snapshotCloudState(st) {
    const snap = {};
    CLOUD_STATE_FIELDS.forEach(f => {
      const v = readCloudField(st, f);
      if (v === undefined) return;
      try {
        snap[f] = JSON.parse(JSON.stringify(v));
      } catch (e) {
        snap[f] = v;
      }
    });
    return snap;
  }

  // localStorage keys written by saveState, with value getters. Used both for
  // selective writes (unchanged keys are skipped) and to detect completedVideos
  // changes, which drive the memoized syllabus-stats revision counter.
  // Legacy FLAT keys (plans, goals, daily_history, ...) stay as mirrors of the
  // ACTIVE edition so older readers keep working; the editions key is the
  // durable per-edition store.
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
    [STORAGE_KEYS.EDITIONS, () => JSON.stringify(state.editions || {})],
    [STORAGE_KEYS.SCHEMA_VERSION, () => String(SCHEMA_VERSION)]
  ];

  // Last-written localStorage values; null until the first save (writes all).
  let localSnapshot = null;

  let cloudSyncTimeout = null;
  function saveState() {
    try {
      // Flush the live working fields into the ACTIVE edition's durable slice
      // BEFORE anything else — persistence and cloud dirty-tracking then see
      // the per-edition truth, and a source switch never loses an in-place
      // mutation made since the last save.
      flushLiveToEdition();
      state.lastLocalUpdate = Date.now();
      // Drop history older than the retention window (keeps local storage and
      // the cloud doc minimal without touching anything the UI reads).
      try {
        const cutoff = toLocalDateKey(new Date(Date.now() - HISTORY_RETENTION_DAYS * 86400000));
        // pruneHistoryMaps lives in the dormant sync module; fall back to an
        // inline prune so retention works even with sync unloaded.
        const pruneMap = (map) => {
          const out = {};
          for (const k of Object.keys(map || {})) if (k >= cutoff) out[k] = map[k];
          return out;
        };
        let dh, dhbs;
        if (window.FlowMD.sync && window.FlowMD.sync.pruneHistoryMaps) {
          [dh, dhbs] = window.FlowMD.sync.pruneHistoryMaps(state.dailyHistory, state.dailyHistoryBySubject, cutoff);
        } else {
          dh = pruneMap(state.dailyHistory);
          dhbs = {};
          for (const subj of Object.keys(state.dailyHistoryBySubject || {})) dhbs[subj] = pruneMap(state.dailyHistoryBySubject[subj]);
        }
        state.dailyHistory = dh;
        state.dailyHistoryBySubject = dhbs;
      } catch (_) { /* pruning must never block a save */ }
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
        // Local per-field clock: stamp every field that changed since the last
        // push. pullFromCloud compares these against the cloud's fieldSyncTimes
        // to decide which side wins each field.
        if (state._dirtyFields && state._dirtyFields.length > 0) {
          if (!state.fieldSyncTimes) state.fieldSyncTimes = {};
          const now = state.lastLocalUpdate || Date.now();
          state._dirtyFields.forEach((f) => { state.fieldSyncTimes[f] = now; });
        }
        if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
        cloudSyncTimeout = setTimeout(() => {
          if (!state._dirtyFields || state._dirtyFields.length === 0) return;
          // Pre-push baseline: advancing to it after the write succeeds keeps
          // any change made DURING the push flagged dirty for the next cycle.
          const snapshot = snapshotCloudState(state);
          const fields = {};
          state._dirtyFields.forEach(f => {
            // Per-field clock guard: never rewrite a field the cloud already
            // has newer than local (e.g. values just applied by a pull). Only
            // fields local actually changed since its last write go up.
            const localT = Number((state.fieldSyncTimes || {})[f]) || 0;
            const cloudT = Number((state._cloudSyncTimes || {})[f]) || 0;
            if (localT >= cloudT) fields[f] = readCloudField(state, f);
          });
          if (Object.keys(fields).length === 0) {
            state._prevSyncedState = snapshot;
            state._dirtyFields = [];
            return;
          }
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
              // Advance the local clock for the pushed fields to the write
              // moment so the next comparison sees them as "local owns these".
              const t = Date.now();
              Object.keys(fields).forEach((f) => {
                if (!state.fieldSyncTimes) state.fieldSyncTimes = {};
                state.fieldSyncTimes[f] = t;
              });
              // Report the auto-push outcome to the sync diagnostics panel.
              if (window.FlowMD.sync && window.FlowMD.sync.recordAutoPushResult) {
                window.FlowMD.sync.recordAutoPushResult({ ok: true, pushed: Object.keys(fields) });
              }
            })
            .catch((err) => {
              console.warn('Cloud sync deferred, will retry on next change:', err);
              if (window.FlowMD.sync && window.FlowMD.sync.recordAutoPushResult) {
                window.FlowMD.sync.recordAutoPushResult({
                  ok: false,
                  error: String((err && err.message) || err)
                });
              }
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
        // Yesterday relative to the 5 AM quest boundary
        const yesterday = toLocalDateKey(new Date(Date.now() - 5 * 3600000 - 86400000));
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
    snapshotCloudState,
    flushLiveToEdition,
    loadEditionIntoLive,
    switchSource,
    defaultEditionSlice
  };
})();
