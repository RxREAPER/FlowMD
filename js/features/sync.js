/* ============================================================
   FlowMD Features — Firebase Sync
   Auth-change wiring, cloud merge (local-wins on completions),
   real-time subscription, connectivity handling, manual sync.

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState } = window.FlowMD.store;
  const { showToast } = window.FlowMD.toast;
  const { updateOfflineIndicator } = window.FlowMD.theme;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  function initFirebaseSync() {
    if (!window.FirebaseSync) return;
    let cloudUnsub = null;

    window.FirebaseSync.onAuthChange(async (user) => {
      if (user) {
        showToast(`Signed in as ${user.email}`, 'account_circle');
        state.isOffline = false;

        // One pull at sign-in (no real-time listener: sync is pull-then-push,
        // driven by the Sync button / auto-push of local changes only). This
        // kills the cross-device write ping-pong — no snapshot ever fires a
        // write on this device, so two devices can never fight over the doc.
        const merged = await pullFromCloud(user.uid);
        if (merged) {
          applyMergedState(merged);
          saveState();
        } else {
          // No cloud doc yet: seed it with the current local state.
          window.FirebaseSync.syncToCloud(user.uid, state, user);
        }
        state.personal.isSynced = true;
        state.personal.syncEmail = user.email;
      } else {
        state.personal.isSynced = false;
        state.personal.syncEmail = '';
        state.isOffline = false;
      }
      if (window.FlowMD.shell) window.FlowMD.shell.render();
    });

    // Coming back online: run a proper pull-then-push sync so field clocks
    // arbitrate (a raw push would stamp every field as freshly local-owned
    // and clobber changes another device made while we were offline).
    window.addEventListener('online', () => {
      state.isOffline = false;
      if (window.FirebaseSync && window.FirebaseSync.currentUser) {
        manualSync();
      }
      updateOfflineIndicator();
    });
    window.addEventListener('offline', () => {
      state.isOffline = true;
      updateOfflineIndicator();
    });
  }

  // Pull cloud → merge with local using per-field newest-wins. completedVideos
  // is a union (cloud fills gaps, local wins conflicts) so completions from
  // either device always survive. Returns the merged field set, or null when
  // there is no cloud doc. Never writes — a pull alone can't clash.
  async function pullFromCloud(uid) {
    try {
      const cloudState = await window.FirebaseSync.loadFromCloud(uid);
      if (!cloudState) return null;
      // Drop unknown/malformed fields, re-prefix compressed video keys, and
      // resolve each field by its per-field clock (see js/core/sync.js).
      const clean = window.FlowMD.sync.sanitizeCloudState(cloudState);
      clean.completedVideos = window.FlowMD.sync.rehydrateCompletedVideos(
        clean.completedVideos, state.activeSource || 'marrow_8'
      );
      return window.FlowMD.sync.mergeCloudPerField(
        clean, state, clean.fieldSyncTimes, state.fieldSyncTimes || {}
      );
    } catch (e) {
      console.warn('pullFromCloud error:', e);
      return null;
    }
  }

  // Copy the merged cloud result onto live state (only keys the app knows).
  function applyMergedState(merged) {
    const cloudTimes = Object.assign({}, merged.fieldSyncTimes || {});
    const localTimes = Object.assign({}, state.fieldSyncTimes || {});
    state._cloudSyncTimes = cloudTimes;
    const UNION = window.FlowMD.sync.UNION_FIELDS || ['completedVideos'];
    const now = Date.now();
    Object.keys(merged).forEach((field) => {
      if (field === 'fieldSyncTimes') return;
      if (state[field] !== undefined) state[field] = merged[field];
      // Reconcile the local clock per field: cloud-won fields adopt the cloud
      // timestamp (so a later auto-push won't rewrite them); local-won fields
      // keep a timestamp newer than cloud (so a later push still sends them).
      const cloudT = Number(cloudTimes[field]) || 0;
      const localT = Number(localTimes[field]) || 0;
      const cloudWon = cloudT > localT && UNION.indexOf(field) === -1;
      if (!state.fieldSyncTimes) state.fieldSyncTimes = {};
      state.fieldSyncTimes[field] = cloudWon ? cloudT : Math.max(localT, now);
    });
    state.lastPullAt = now;
    // Advance the push baseline to the merged state: fields pulled from the
    // cloud are now "already synced", so a later saveState only flags NEW local
    // changes as dirty. Without this, the debounced auto-push could re-write
    // just-pulled fields (echo) — the exact ping-pong we removed the listener
    // to kill. Local-won fields are re-stamped below so they still push.
    try {
      const CLOUD_FIELDS = ['completedVideos', 'goals', 'streakData', 'personal',
        'dailyHistory', 'dailyHistoryBySubject', 'plans', 'activePlanId',
        'activeSource', 'isConfigured', 'themeStyle'];
      const base = {};
      CLOUD_FIELDS.forEach((f) => { if (state[f] !== undefined) base[f] = state[f]; });
      state._prevSyncedState = base;
    } catch (_) { /* baseline advance must never break a sync */ }
  }

  // Manual sync: pull-then-push. The pull merges (never writes); the push
  // writes ONLY the fields the local device actually changed since the pull —
  // fields the cloud won stay untouched, so a sync can never fight itself.
  async function manualSync() {
    if (!window.FirebaseSync || !window.FirebaseSync.currentUser) {
      showToast('Sign in to sync', 'error');
      return false;
    }
    const uid = window.FirebaseSync.currentUser.uid;
    showToast('Syncing...', 'sync');
    try {
      const before = Object.assign({}, state);
      // Snapshot the per-field clocks BEFORE the pull: they are the truth of
      // what THIS device last wrote locally. After the merge they'd include
      // pulled fields (stamped by applyMergedState), which would look like
      // local edits and echo back to the cloud.
      const beforeTimes = Object.assign({}, state.fieldSyncTimes || {});
      const merged = await pullFromCloud(uid);
      if (merged) {
        applyMergedState(merged);
        // Push only fields THIS device genuinely changed since its last cloud
        // write: pre-pull local clock newer than the cloud's clock for that
        // field. Union fields (completedVideos) always push when they changed
        // locally, so completions from either device are never lost.
        const BOOKKEEPING = ['fieldSyncTimes', 'lastPullAt', 'lastLocalUpdate',
          '_prevSyncedState', '_dirtyFields', '_cloudSyncTimes'];
        const cloudTimes = Object.assign({}, state._cloudSyncTimes || {});
        const UNION = window.FlowMD.sync.UNION_FIELDS || ['completedVideos'];
        const pushed = {};
        Object.keys(state).forEach((f) => {
          if (BOOKKEEPING.indexOf(f) !== -1) return;
          const a = before[f];
          const b = state[f];
          if (a === b) return;
          if (a !== undefined && JSON.stringify(a) === JSON.stringify(b)) return;
          const localT = Number(beforeTimes[f]) || 0;
          const cloudT = Number(cloudTimes[f]) || 0;
          if (UNION.indexOf(f) !== -1) {
            pushed[f] = b; // union of both sides — always safe to write
          } else if (localT > cloudT) {
            pushed[f] = b; // genuinely locally edited after the last cloud write
          }
        });
        if (Object.keys(pushed).length > 0) {
          await window.FirebaseSync.updateCloudFields(uid, pushed);
        }
      } else {
        await window.FirebaseSync.syncToCloud(uid, state, window.FirebaseSync.currentUser);
      }
      showToast('Synced successfully', 'check_circle');
      if (window.FlowMD.shell) window.FlowMD.shell.render();
      return true;
    } catch (e) {
      showToast('Sync failed: ' + e.message, 'error');
      return false;
    }
  }

  // Expose. js/core/sync.js (loaded before this module) already registers the
  // pure helpers (sanitizeCloudState, mergeLocalWins, mergeCloudPerField,
  // computeDirtyFields, ...) on window.FlowMD.sync — merge the live wiring in
  // rather than overwriting, so state-store's dirty-field push keeps working.
  window.FlowMD.sync = Object.assign({}, window.FlowMD.sync || {}, {
    initFirebaseSync,
    pullFromCloud,
    manualSync
  });
})();
