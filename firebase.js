// Firebase Configuration & Helper Module for MedTracker PG
(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyC6tCvOPXQ_tcywhu4f-lkdHmm9ycW0Yuo",
    authDomain: "flowmd-04.firebaseapp.com",
    projectId: "flowmd-04",
    storageBucket: "flowmd-04.firebasestorage.app",
    messagingSenderId: "386076412890",
    appId: "1:386076412890:web:3ddbaf1091a16a584b4ee3",
    // TODO: Replace with your GA4 Measurement ID from Firebase Console →
    // Project Settings → Analytics → Data Streams → Web stream
    measurementId: "G-Y676DGJH2M"
  };

  // Initialize Firebase Compat
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  let auth = null;
  let db = null;

  if (typeof firebase !== 'undefined') {
    auth = firebase.auth();
    db = firebase.firestore();

    // Enable offline persistence so data syncs smoothly when connection drops
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
      console.warn("Firestore persistence notice:", err.code);
    });
  }

  // Google Analytics (measurementId lives in firebaseConfig once initialized).
  // Skipped while offline: the beacon fetch would fail and log a console error
  // on every offline visit (the SDKs are precached now, so they load offline).
  let analytics = null;
  if (typeof firebase !== 'undefined' && firebase.analytics) {
    try {
      analytics = firebase.analytics();
    } catch (e) { /* non-browser env or missing measurementId */ }
  }

  // Global error reporting (no third-party dependency — events land in Analytics).
  window.addEventListener('error', (e) => {
    try {
      if (analytics) analytics.logEvent('app_error', {
        message: String(e.message || ''),
        stack: String((e.error && e.error.stack) || '').slice(0, 2000)
      });
    } catch (_) { /* never let reporting break the app */ }
  });
  window.addEventListener('unhandledrejection', (e) => {
    try {
      if (analytics) analytics.logEvent('app_error', { message: String((e.reason && e.reason.message) || e.reason || '') });
    } catch (_) {}
  });

  // Global Auth & Sync API
  window.FirebaseSync = {
    currentUser: null,
    // Optional full-state getter supplied by app.js — used only when a
    // field-level update() hits a missing doc and we must recreate it.
    stateProvider: null,

    // Listen for authentication changes
    onAuthChange(callback) {
      if (!auth) return;
      auth.onAuthStateChanged(user => {
        window.FirebaseSync.currentUser = user;
        callback(user);
      });
    },

    // Sign in with Google. Uses the REDIRECT flow (signInWithRedirect): popup
    // sign-in is unreliable inside installed PWAs — browsers close/block the
    // popup mid-handshake (auth/popup-closed-by-user), which made "Sign-in
    // failed" the norm on installed devices. Redirect navigates the current
    // window through the auth handler and back; the pending result is picked
    // up on the next boot via resolveRedirectResult().
    async signInWithGoogle() {
      if (!auth) throw new Error("Firebase not initialized");
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await auth.signInWithRedirect(provider);
    },

    // Completes a pending sign-in after the redirect round-trip. Returns the
    // signed-in user, or null when no redirect sign-in is pending. Rejects
    // with the REAL Firebase error so callers can surface it (the old popup
    // errors were swallowed in the UI).
    async resolveRedirectResult() {
      if (!auth) return null;
      try {
        const result = await auth.getRedirectResult();
        return result && result.user ? result.user : null;
      } catch (e) {
        // A rejected redirect result usually means a STALE pending redirect
        // left behind by an earlier interrupted attempt (e.g. the old popup
        // era, or a redirect whose return navigation was cancelled). That
        // stale state makes every later attempt fail on boot. Signing out
        // clears it so the next attempt starts clean.
        try { await auth.signOut(); } catch (_) { /* best effort */ }
        throw e;
      }
    },

    // Map a Firebase Auth error to a human-readable, actionable message.
    // Returns { code, message }; falls back to the raw error for unknown
    // codes. The code (e.g. "auth/operation-not-allowed") is kept visible so
    // the exact failure can be reported back for diagnosis.
    authErrorInfo(e) {
      const raw = (e && (e.code || e.message)) || String(e);
      const m = String(raw).match(/auth\/([a-z-]+)/);
      const code = m ? 'auth/' + m[1] : raw;
      const messages = {
        'auth/operation-not-allowed': "Google sign-in isn't enabled for this project — enable it in Firebase console → Authentication → Sign-in method → Google.",
        'auth/unauthorized-domain': "This domain isn't authorized for sign-in — add it in Firebase console → Authentication → Settings → Authorized domains.",
        'auth/redirect-cancelled-by-user': 'The sign-in window was closed before it finished — tap Sign in with Google again and don\'t interrupt it.',
        'auth/popup-closed-by-user': 'The sign-in popup was closed before it finished — try again.',
        'auth/account-exists-with-different-credential': 'An account with this email already exists using a different sign-in method.',
        'auth/network-request-failed': 'Network error during sign-in — check your connection and try again.',
        'auth/internal-error': 'Sign-in hit an internal error — fully close the app and try again.',
        'auth/redirect-operation-pending': 'A previous sign-in is still finishing — wait a moment and try again.',
        'auth/web-storage-unsupported': 'This browser blocks the storage sign-in needs — use a normal browser tab or update the app.'
      };
      return { code, message: messages[code] || String(raw) };
    },

    // Sign out
    async signOutUser() {
      if (!auth) return;
      await auth.signOut();
      window.FirebaseSync.currentUser = null;
    },

    // Save app state to Firestore under /users/{uid}/data/userState
    async syncToCloud(uid, stateData, user) {
      if (!db || !uid) return;
      try {
        // Only fields the app actually consumes, at the minimum size:
        // completedVideos stores FULL prefixed keys (both editions share video
        // ids — compressing would collide them), and plans carry their synced
        // durable keys INCLUDING the daily-quest batch (queueBatchVideoIds) so
        // every device shows the same quest; only per-day transient counters
        // (queueCompletedInBatch, extraBatchesCompletedToday, lastBatchDate)
        // and dead fields (speed, subjectUrgency, dailyBatch, lastSyncedAt)
        // are never written.
        const syncApi = (window.FlowMD && window.FlowMD.sync) || {};
        const planKeys = syncApi.PLAN_CLOUD_KEYS || ['id', 'label', 'accentColor', 'targetSubject', 'targetDate', 'videosPerDay', 'videosPerWeek', 'videosPerMonth', 'dailyTargetHours', 'targetUnits', 'queueBatchVideoIds'];
        const stripPlan = (p) => {
          const cp = {};
          planKeys.forEach((k) => { if (p && p[k] !== undefined) cp[k] = p[k]; });
          return cp;
        };
        // Per-edition fields are stored SUFFIXED (plans_marrow_8, plans_marrow_6_5,
        // ...) so each edition has its own clock and syncs independently.
        const edIds = (syncApi.EDITION_IDS) || ['marrow_8', 'marrow_6_5'];
        const edBases = (syncApi.EDITION_BASE_FIELDS) || ['plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject', 'activePlanId', 'bulkCompletedChapters'];
        const editions = stateData.editions || {};
        const payload = {
          completedVideos: stateData.completedVideos || {},
          streakData: stateData.streakData || {},
          personal: stateData.personal || {},
          activeSource: stateData.activeSource || 'marrow_8',
          isConfigured: stateData.isConfigured || false,
          themeStyle: stateData.themeStyle || 'modern',
          // Google account info (for profile display)
          googleDisplayName: user?.displayName || null,
          googlePhotoURL: user?.photoURL || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        edIds.forEach((src) => {
          const e = editions[src] || {};
          edBases.forEach((base) => {
            if (base === 'plans') {
              payload[base + '_' + src] = (e.plans || []).map(stripPlan);
            } else if (e[base] !== undefined) {
              payload[base + '_' + src] = e[base];
            }
          });
        });
        // Per-field sync clock for pull arbitration: each written field maps
        // to the client time of its last write. mergeCloudPerField compares
        // these (not the whole-doc updatedAt) so stale fields from one device
        // can never overwrite newer fields from another.
        payload.fieldSyncTimes = {};
        Object.keys(payload).forEach((f) => {
          if (f !== 'fieldSyncTimes' && f !== 'updatedAt') payload.fieldSyncTimes[f] = Date.now();
        });
        await db.collection('users').doc(uid).set(payload, { merge: true });
        console.log('Successfully synced state to Firebase Cloud.');
      } catch (err) {
        console.error('Error syncing state to Firebase:', err);
      }
    },

    // Load app state from Firestore
    async loadFromCloud(uid) {
      if (!db || !uid) return null;
      try {
        const docRef = await db.collection('users').doc(uid).get();
        if (docRef.exists) {
          return docRef.data();
        }
        return null;
      } catch (err) {
        console.error('Error loading state from Firebase:', err);
        return null;
      }
    },

    // Write only changed top-level fields (doc must already exist).
    async updateCloudFields(uid, fields) {
      if (!db || !uid || !fields) return;
      try {
        const syncApi = (window.FlowMD && window.FlowMD.sync) || {};
        const planKeys = syncApi.PLAN_CLOUD_KEYS || ['id', 'label', 'accentColor', 'targetSubject', 'targetDate', 'videosPerDay', 'videosPerWeek', 'videosPerMonth', 'dailyTargetHours', 'targetUnits', 'queueBatchVideoIds'];
        // plans in state carry per-day queue bookkeeping (per-batch counters,
        // extraBatchesCompletedToday, lastBatchDate) — strip to the same cloud
        // keys syncToCloud uses so field-level writes never accumulate junk in
        // the doc. queueBatchVideoIds (the daily-quest batch) IS a synced key
        // and travels with the plan. Applies to every per-edition plans_X key
        // (and the legacy flat plans).
        let cleanFields = fields;
        const plansKeys = Object.keys(fields).filter((k) => k === 'plans' || k.indexOf('_plans') === k.length - '_plans'.length || /^plans_/.test(k));
        if (plansKeys.length > 0) {
          cleanFields = Object.assign({}, fields);
          plansKeys.forEach((k) => {
            if (Array.isArray(fields[k])) {
              cleanFields[k] = fields[k].map((p) => {
                const cp = {};
                planKeys.forEach((kk) => { if (p && p[kk] !== undefined) cp[kk] = p[kk]; });
                return cp;
              });
            }
          });
        }
        const payload = Object.assign({}, cleanFields, {
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // Stamp each field's clock with a DOT-PATH merge into the existing
        // fieldSyncTimes map. Never write `fieldSyncTimes` wholesale: that
        // REPLACES the map and destroys every OTHER field's clock, which makes
        // cross-device arbitration asymmetric and lets a stale device wipe a
        // richer one on the next pull (the reported sync data-loss bug).
        const now = Date.now();
        Object.keys(cleanFields).forEach((f) => {
          if (f === 'updatedAt') return;
          payload['fieldSyncTimes.' + f] = now;
        });
        // completedVideos is written PER KEY via FieldPath so the write MERGES
        // into the doc's existing map instead of replacing it. A device that
        // hasn't pulled yet must never erase the other edition's completions
        // from the doc (both editions share video ids, keys are prefixed).
        delete payload.completedVideos;
        if (cleanFields.completedVideos && typeof cleanFields.completedVideos === 'object') {
          Object.keys(cleanFields.completedVideos).forEach((k) => {
            payload[new firebase.firestore.FieldPath('completedVideos', k)] = !!cleanFields.completedVideos[k];
          });
        }
        delete payload.fieldSyncTimes;
        await db.collection('users').doc(uid).update(payload);
      } catch (err) {
        if (err && err.code === 'not-found') {
          // Doc missing (e.g., first write raced) -> fall back to full create.
          const full = this.stateProvider ? this.stateProvider() : fields;
          await this.syncToCloud(uid, full, this.currentUser);
        } else {
          console.error('Error updating cloud fields:', err);
        }
      }
    },

    // Mark one video completed/uncompleted via a dotted-path-free FieldPath
    // (video IDs may contain dots, so never build dot-notation strings).
    // The key is stored WITH its source prefix (both editions share video
    // ids — stripping would collide marrow_8 and marrow_6_5 completions).
    async updateVideo(uid, videoId, done) {
      if (!db || !uid || !videoId) return;
      try {
        const key = String(videoId);
        const path = new firebase.firestore.FieldPath('completedVideos', key);
        await db.collection('users').doc(uid).update({
          [path]: !!done,
          'fieldSyncTimes.completedVideos': Date.now(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error('Error updating video state:', err);
      }
    },

    // Deletes the Firestore doc, then the Auth account. Requires recent
    // sign-in; on auth/requires-recent-login the caller re-signs-in and
    // retries. (firestore.rules allows delete only on one's own doc.)
    async deleteAccount(uid) {
      if (!db || !auth || !uid) return;
      await db.collection('users').doc(uid).delete();
      await auth.currentUser.delete();
    },

    // Returns the user's full stored state as a plain object (data export).
    async exportState(uid) {
      if (!db || !uid) return null;
      const snap = await db.collection('users').doc(uid).get();
      return snap.exists ? snap.data() : null;
    },

    // Analytics event (no-op when Analytics is unavailable or blocked).
    trackEvent(name, params) {
      try {
        if (analytics && name) analytics.logEvent(name, params || {});
      } catch (e) { /* never throw from analytics */ }
    }
  };
})();
