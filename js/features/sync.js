/* ============================================================
   FlowMD Features — Firebase Sync
   Auth-change wiring, cloud merge (local-wins on completions),
   real-time subscription, connectivity handling, manual sync.

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState, mergePlansLocalWins } = window.FlowMD.store;
  const { showToast } = window.FlowMD.toast;
  const { updateOfflineIndicator } = window.FlowMD.theme;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  function initFirebaseSync() {
    if (!window.FirebaseSync) return;
    let cloudUnsub = null;

    window.FirebaseSync.onAuthChange(async (user) => {
      // Clean up previous listener
      if (cloudUnsub) {
        cloudUnsub();
        cloudUnsub = null;
      }

      if (user) {
        showToast(`Signed in as ${user.email}`, 'account_circle');
        state.isOffline = false;

        const cloudState = await window.FirebaseSync.loadFromCloud(user.uid);
        if (cloudState) {
          // Drop unknown/malformed fields from the cloud doc before merging
          // (hardening: sanitizeCloudState whitelists known, well-typed fields).
          const clean = window.FlowMD.sync.sanitizeCloudState(cloudState);
          // Merge cloud → local with LOCAL winning on conflicts: the device's
          // offline completions must never be clobbered by a stale cloud snapshot.
          // Cloud still fills gaps (keys absent locally). See .planning/codebase/CONCERNS.md #3.
          state.completedVideos = { ...(clean.completedVideos || {}), ...state.completedVideos };
          state.goals = { ...(clean.goals || {}), ...state.goals };
          state.personal = { ...(clean.personal || {}), ...state.personal };
          state.dailyHistory = { ...(clean.dailyHistory || {}), ...state.dailyHistory };
          state.dailyHistoryBySubject = { ...(clean.dailyHistoryBySubject || {}), ...state.dailyHistoryBySubject };
          state.plans = mergePlansLocalWins(clean.plans, state.plans);
          state.activePlanId = clean.activePlanId || state.activePlanId;
          state.activeSource = clean.activeSource || state.activeSource;
          state.isConfigured = clean.isConfigured || state.isConfigured;
          state.themeStyle = clean.themeStyle || state.themeStyle;
          state.queueCompletedInBatch = clean.queueCompletedInBatch || state.queueCompletedInBatch;
          state.queueBatchVideoIds = clean.queueBatchVideoIds ? [...clean.queueBatchVideoIds] : state.queueBatchVideoIds;
          if (clean.streakData) state.streakData = { ...clean.streakData, ...(state.streakData || {}) };
          saveState();
        } else {
          window.FirebaseSync.syncToCloud(user.uid, state, user);
        }
        state.personal.isSynced = true;
        state.personal.syncEmail = user.email;

        // Subscribe to real-time updates
        cloudUnsub = window.FirebaseSync.subscribeToCloud(user.uid, (cloudData) => {
          mergeCloudState(cloudData);
        });
      } else {
        state.personal.isSynced = false;
        state.personal.syncEmail = '';
        state.isOffline = false;
      }
      if (window.FlowMD.shell) window.FlowMD.shell.render();
    });

    // Periodic connectivity check
    window.addEventListener('online', () => {
      state.isOffline = false;
      if (window.FirebaseSync.currentUser) {
        window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state, window.FirebaseSync.currentUser);
      }
      updateOfflineIndicator();
    });
    window.addEventListener('offline', () => {
      state.isOffline = true;
      updateOfflineIndicator();
    });
  }

  // Merge cloud state with local (sanitized, clock-skew-aware resolution)
  function mergeCloudState(cloudData) {
    try {
      // Drop unknown/malformed fields before anything else touches the doc.
      const clean = window.FlowMD.sync.sanitizeCloudState(cloudData);
      const cloudUpdated = clean.updatedAt?.toMillis?.() || 0;
      const localUpdated = state.lastLocalUpdate || 0;
      const hasLocalDirty = state._dirtyFields && state._dirtyFields.length > 0;

      // Local completions always win (they're the source of truth for offline work)
      state.completedVideos = { ...(clean.completedVideos || {}), ...state.completedVideos };

      // For other fields, apply cloud when it is newer than local (within a
      // 5s clock-skew window) or when we have unsynced local changes; only
      // when cloud is genuinely stale do we push local back up.
      if (window.FlowMD.sync.shouldApplyCloud(cloudUpdated, localUpdated, hasLocalDirty)) {
        state.goals = { ...(clean.goals || {}), ...state.goals };
        state.personal = { ...(clean.personal || {}), ...state.personal };
        state.dailyHistory = { ...(clean.dailyHistory || {}), ...state.dailyHistory };
        state.dailyHistoryBySubject = { ...(clean.dailyHistoryBySubject || {}), ...state.dailyHistoryBySubject };
        state.plans = mergePlansLocalWins(clean.plans, state.plans);
        state.activePlanId = clean.activePlanId || state.activePlanId;
        state.activeSource = clean.activeSource || state.activeSource;
        state.isConfigured = clean.isConfigured || state.isConfigured;
        state.themeStyle = clean.themeStyle || state.themeStyle;
        state.queueCompletedInBatch = clean.queueCompletedInBatch || state.queueCompletedInBatch;
        state.queueBatchVideoIds = clean.queueBatchVideoIds ? [...clean.queueBatchVideoIds] : state.queueBatchVideoIds;
        if (clean.streakData) state.streakData = { ...clean.streakData, ...(state.streakData || {}) };
      } else {
        // Local is newer - push to cloud
        if (window.FirebaseSync.currentUser) {
          window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state);
        }
      }
      saveState();
      if (window.FlowMD.shell) window.FlowMD.shell.render();
    } catch (e) {
      console.warn('mergeCloudState error:', e);
    }
  }

  // Manual sync function
  function manualSync() {
    if (!window.FirebaseSync || !window.FirebaseSync.currentUser) {
      showToast('Sign in to sync', 'error');
      return Promise.resolve(false);
    }
    state.lastLocalUpdate = Date.now();
    try {
      showToast('Syncing...', 'sync');
      window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state, window.FirebaseSync.currentUser);
      showToast('Synced successfully', 'check_circle');
      return Promise.resolve(true);
    } catch (e) {
      showToast('Sync failed: ' + e.message, 'error');
      return Promise.resolve(false);
    }
  }

  // Expose. js/core/sync.js (loaded before this module) already registers the
  // pure helpers (sanitizeCloudState, shouldApplyCloud, mergeLocalWins,
  // computeDirtyFields, ...) on window.FlowMD.sync — merge the live wiring in
  // rather than overwriting, so state-store's dirty-field push keeps working.
  window.FlowMD.sync = Object.assign({}, window.FlowMD.sync || {}, {
    initFirebaseSync,
    mergeCloudState,
    manualSync
  });
})();
