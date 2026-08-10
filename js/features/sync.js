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
          // Merge cloud → local with LOCAL winning on conflicts: the device's
          // offline completions must never be clobbered by a stale cloud snapshot.
          // Cloud still fills gaps (keys absent locally). See .planning/codebase/CONCERNS.md #3.
          state.completedVideos = { ...(cloudState.completedVideos || {}), ...state.completedVideos };
          state.goals = { ...(cloudState.goals || {}), ...state.goals };
          state.personal = { ...(cloudState.personal || {}), ...state.personal };
          state.dailyHistory = { ...(cloudState.dailyHistory || {}), ...state.dailyHistory };
          state.dailyHistoryBySubject = { ...(cloudState.dailyHistoryBySubject || {}), ...state.dailyHistoryBySubject };
          state.plans = mergePlansLocalWins(cloudState.plans, state.plans);
          state.activePlanId = cloudState.activePlanId || state.activePlanId;
          state.activeSource = cloudState.activeSource || state.activeSource;
          state.isConfigured = cloudState.isConfigured || state.isConfigured;
          state.themeStyle = cloudState.themeStyle || state.themeStyle;
          state.queueCompletedInBatch = cloudState.queueCompletedInBatch || state.queueCompletedInBatch;
          state.queueBatchVideoIds = cloudState.queueBatchVideoIds ? [...cloudState.queueBatchVideoIds] : state.queueBatchVideoIds;
          if (cloudState.streakData) state.streakData = { ...cloudState.streakData, ...(state.streakData || {}) };
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

  // Merge cloud state with local (timestamp-based conflict resolution)
  function mergeCloudState(cloudData) {
    try {
      // If cloud has newer updatedAt, use cloud for non-completion fields
      // For completedVideos, always merge with local winning
      const cloudUpdated = cloudData.updatedAt?.toMillis?.() || 0;
      const localUpdated = state.lastLocalUpdate || 0;

      // Local completions always win (they're the source of truth for offline work)
      state.completedVideos = { ...(cloudData.completedVideos || {}), ...state.completedVideos };

      // For other fields, use timestamp to decide
      if (cloudUpdated > localUpdated) {
        state.goals = { ...(cloudData.goals || {}), ...state.goals };
        state.personal = { ...(cloudData.personal || {}), ...state.personal };
        state.dailyHistory = { ...(cloudData.dailyHistory || {}), ...state.dailyHistory };
        state.dailyHistoryBySubject = { ...(cloudData.dailyHistoryBySubject || {}), ...state.dailyHistoryBySubject };
        state.plans = mergePlansLocalWins(cloudData.plans, state.plans);
        state.activePlanId = cloudData.activePlanId || state.activePlanId;
        state.activeSource = cloudData.activeSource || state.activeSource;
        state.isConfigured = cloudData.isConfigured || state.isConfigured;
        state.themeStyle = cloudData.themeStyle || state.themeStyle;
        state.queueCompletedInBatch = cloudData.queueCompletedInBatch || state.queueCompletedInBatch;
        state.queueBatchVideoIds = cloudData.queueBatchVideoIds ? [...cloudData.queueBatchVideoIds] : state.queueBatchVideoIds;
        if (cloudData.streakData) state.streakData = { ...cloudData.streakData, ...(state.streakData || {}) };
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

  // Expose
  window.FlowMD.sync = {
    initFirebaseSync,
    mergeCloudState,
    manualSync
  };
})();
