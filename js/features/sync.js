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

  // --- Sync diagnostics (local-only bookkeeping: never cloud-pushed) ---
  // Persists the outcome of the last manual sync and the last auto-push so
  // the Profile diagnostics panel can show arbitration on real devices.
  const SYNC_DIAG_KEY = 'flowmd_sync_diagnostics';
  function loadSyncDiagnostics() {
    try {
      const raw = localStorage.getItem(SYNC_DIAG_KEY);
      if (raw) state.syncDiagnostics = JSON.parse(raw);
    } catch (e) { /* corrupt diagnostics are discarded */ }
    if (!state.syncDiagnostics || typeof state.syncDiagnostics !== 'object') state.syncDiagnostics = {};
  }
  loadSyncDiagnostics();

  function persistSyncDiagnostics() {
    try {
      localStorage.setItem(SYNC_DIAG_KEY, JSON.stringify(state.syncDiagnostics || {}));
    } catch (e) { /* persistence must never break a sync */ }
  }

  // Record the outcome of a user-facing sync (Sync Now / sign-in pull / reconnect).
  function recordSyncResult(info) {
    state.syncDiagnostics = state.syncDiagnostics || {};
    state.syncDiagnostics.lastSync = {
      at: Date.now(),
      status: info.status || 'unknown',
      message: info.message || '',
      pushed: info.pushed || [],
      pulled: info.pulled || [],
      error: info.error || null
    };
    persistSyncDiagnostics();
  }

  // Record the outcome of the debounced auto-push (state-store saveState).
  function recordAutoPushResult(info) {
    state.syncDiagnostics = state.syncDiagnostics || {};
    state.syncDiagnostics.autoPush = {
      at: Date.now(),
      ok: !!info.ok,
      pushed: info.pushed || [],
      error: info.error || null
    };
    persistSyncDiagnostics();
  }

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
          recordSyncResult({
            status: 'success',
            message: 'Signed in — pulled cloud data',
            pulled: Object.keys(merged).filter((f) =>
              f !== 'fieldSyncTimes' && f !== 'updatedAt' && f !== 'lastLocalUpdate'
            )
          });
        } else {
          // No cloud doc yet: seed it with the current local state.
          window.FirebaseSync.syncToCloud(user.uid, state, user);
          recordSyncResult({
            status: 'success',
            message: 'Signed in — created cloud backup from this device'
          });
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

  // Read the cloud doc, drop unknown/malformed fields, and re-prefix legacy
  // unprefixed video keys. Returns the sanitized cloud field set (raw — NOT
  // merged) or null when there is no doc. Never writes.
  async function fetchCloudState(uid) {
    try {
      const cloudState = await window.FirebaseSync.loadFromCloud(uid);
      if (!cloudState) return null;
      const clean = window.FlowMD.sync.sanitizeCloudState(cloudState);
      clean.completedVideos = window.FlowMD.sync.rehydrateCompletedVideos(
        clean.completedVideos, state.activeSource || 'marrow_8'
      );
      return clean;
    } catch (e) {
      console.warn('pullFromCloud error:', e);
      return null;
    }
  }

  // Pull cloud → merge with local using per-field newest-wins. completedVideos
  // is a union (cloud fills gaps, local wins conflicts) so completions from
  // either device always survive. Returns the merged field set, or null when
  // there is no cloud doc. Never writes — a pull alone can't clash.
  async function pullFromCloud(uid) {
    const clean = await fetchCloudState(uid);
    if (!clean) return null;
    return window.FlowMD.sync.mergeCloudPerField(
      clean, state, clean.fieldSyncTimes, state.fieldSyncTimes || {}
    );
  }

  // Copy the merged cloud result onto live state (only keys the app knows).
  function applyMergedState(merged) {
    const cloudTimes = Object.assign({}, merged.fieldSyncTimes || {});
    const localTimes = Object.assign({}, state.fieldSyncTimes || {});
    state._cloudSyncTimes = cloudTimes;
    const UNION = window.FlowMD.sync.UNION_FIELDS || ['completedVideos'];
    const now = Date.now();
    Object.keys(merged).forEach((field) => {
      if (field === 'fieldSyncTimes' || field === 'updatedAt' || field === 'lastLocalUpdate') return;
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
      // DEEP copy: the baseline must never share references with live state,
      // or in-place edits (state.plans[0].x = y) compare identical and are
      // never flagged dirty — silently lost for the cloud.
      const base = {};
      CLOUD_FIELDS.forEach((f) => {
        if (state[f] === undefined) return;
        try {
          base[f] = JSON.parse(JSON.stringify(state[f]));
        } catch (_) {
          base[f] = state[f];
        }
      });
      state._prevSyncedState = base;
    } catch (_) { /* baseline advance must never break a sync */ }
  }

  // Manual sync: pull-then-push. The pull merges (never writes); the push
  // writes ONLY the fields THIS device genuinely owns and whose value differs
  // from what the cloud currently stores. A field the cloud won (or already
  // has identical) is never re-written, so a sync can't fight itself — and a
  // field this device won (newer clock, or the cloud copy is empty/missing)
  // IS pushed, so real edits actually reach the other devices.
  async function manualSync() {
    if (!window.FirebaseSync || !window.FirebaseSync.currentUser) {
      showToast('Sign in to sync', 'error');
      return false;
    }
    const uid = window.FirebaseSync.currentUser.uid;
    showToast('Syncing...', 'sync');
    try {
      // Snapshot the per-field clocks BEFORE the pull: they are the truth of
      // what THIS device last wrote locally. After the merge they'd include
      // pulled fields (stamped by applyMergedState), which would look like
      // local edits and echo back to the cloud.
      const beforeTimes = Object.assign({}, state.fieldSyncTimes || {});
      // Pre-pull local field references, used to report which fields the
      // merge actually changed (the "pulled" list in the diagnostics panel).
      const beforeLocal = Object.assign({}, state);
      const clean = await fetchCloudState(uid);
      if (clean) {
        const merged = window.FlowMD.sync.mergeCloudPerField(
          clean, state, clean.fieldSyncTimes, state.fieldSyncTimes || {}
        );
        applyMergedState(merged);
        const BOOKKEEPING = ['fieldSyncTimes', 'lastPullAt', 'lastLocalUpdate',
          '_prevSyncedState', '_dirtyFields', '_cloudSyncTimes', 'syncDiagnostics'];
        const cloudTimes = Object.assign({}, state._cloudSyncTimes || {});
        const UNION = window.FlowMD.sync.UNION_FIELDS || ['completedVideos'];
        const isEmptyFor = window.FlowMD.sync.isEmptyForField || (() => false);
        const pushed = {};
        Object.keys(state).forEach((f) => {
          if (BOOKKEEPING.indexOf(f) !== -1) return;
          const hasCloud = Object.prototype.hasOwnProperty.call(clean, f);
          const cloudVal = hasCloud ? clean[f] : undefined;
          // Already identical to the cloud copy → nothing to write (this is
          // what stops cloud-won fields from echoing back).
          if (hasCloud && JSON.stringify(state[f]) === JSON.stringify(cloudVal)) return;
          if (UNION.indexOf(f) !== -1) {
            pushed[f] = state[f]; // union of both sides — always safe to write
            return;
          }
          const localT = Number(beforeTimes[f]) || 0;
          const cloudT = Number(cloudTimes[f]) || 0;
          const localOwns = !hasCloud || isEmptyFor(f, cloudVal) || localT > cloudT;
          if (localOwns) pushed[f] = state[f];
        });
        if (Object.keys(pushed).length > 0) {
          await window.FirebaseSync.updateCloudFields(uid, pushed);
        }
        recordSyncResult({
          status: 'success',
          message: Object.keys(pushed).length > 0
            ? Object.keys(pushed).length + ' field(s) pushed'
            : 'In sync — nothing to push',
          pushed: Object.keys(pushed),
          pulled: Object.keys(merged).filter((f) =>
            BOOKKEEPING.indexOf(f) === -1 && merged[f] !== beforeLocal[f]
          )
        });
      } else {
        await window.FirebaseSync.syncToCloud(uid, state, window.FirebaseSync.currentUser);
        recordSyncResult({
          status: 'success',
          message: 'No cloud doc — seeded it with this device\'s state'
        });
      }
      showToast('Synced successfully', 'check_circle');
      if (window.FlowMD.shell) window.FlowMD.shell.render();
      return true;
    } catch (e) {
      recordSyncResult({ status: 'failed', error: (e && e.message) || String(e) });
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
    fetchCloudState,
    pullFromCloud,
    manualSync,
    recordSyncResult,
    recordAutoPushResult
  });
})();
