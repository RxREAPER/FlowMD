// Firebase Configuration & Helper Module for MedTracker PG
(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyC6tCvOPXQ_tcywhu4f-lkdHmm9ycW0Yuo",
    authDomain: "flowmd-04.firebaseapp.com",
    projectId: "flowmd-04",
    storageBucket: "flowmd-04.firebasestorage.app",
    messagingSenderId: "386076412890",
    appId: "1:386076412890:web:3ddbaf1091a16a584b4ee3"
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
  if (typeof firebase !== 'undefined' && firebase.analytics && navigator.onLine) {
    try { analytics = firebase.analytics(); } catch (e) { /* non-browser env */ }
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

    // Sign in with Google Popup
    async signInWithGoogle() {
      if (!auth) throw new Error("Firebase not initialized");
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await auth.signInWithPopup(provider);
      return result.user;
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
        // ids — compressing would collide them), plans drop their per-day
        // transient queue state, and dead fields (speed, subjectUrgency,
        // dailyBatch, lastSyncedAt, queue counters) are never written.
        const syncApi = (window.FlowMD && window.FlowMD.sync) || {};
        const planKeys = syncApi.PLAN_CLOUD_KEYS || ['id', 'label', 'accentColor', 'targetSubject', 'targetDate', 'videosPerDay', 'videosPerWeek', 'videosPerMonth', 'dailyTargetHours', 'targetUnits'];
        const stripPlan = (p) => {
          const cp = {};
          planKeys.forEach((k) => { if (p && p[k] !== undefined) cp[k] = p[k]; });
          return cp;
        };
        const payload = {
          completedVideos: stateData.completedVideos || {},
          goals: stateData.goals || {},
          streakData: stateData.streakData || {},
          personal: stateData.personal || {},
          dailyHistory: stateData.dailyHistory || {},
          dailyHistoryBySubject: stateData.dailyHistoryBySubject || {},
          plans: (stateData.plans || []).map(stripPlan),
          activePlanId: stateData.activePlanId || 'plan_a',
          activeSource: stateData.activeSource || 'marrow_8',
          isConfigured: stateData.isConfigured || false,
          themeStyle: stateData.themeStyle || 'modern',
          // Google account info (for profile display)
          googleDisplayName: user?.displayName || null,
          googlePhotoURL: user?.photoURL || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
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
        const planKeys = syncApi.PLAN_CLOUD_KEYS || ['id', 'label', 'accentColor', 'targetSubject', 'targetDate', 'videosPerDay', 'videosPerWeek', 'videosPerMonth', 'dailyTargetHours', 'targetUnits'];
        // plans in state carry per-day queue bookkeeping (queueBatchVideoIds,
        // per-batch counters) — strip to the same cloud keys syncToCloud uses
        // so field-level writes never accumulate junk in the doc.
        let cleanFields = fields;
        if (Array.isArray(fields.plans)) {
          cleanFields = Object.assign({}, fields);
          cleanFields.plans = fields.plans.map((p) => {
            const cp = {};
            planKeys.forEach((k) => { if (p && p[k] !== undefined) cp[k] = p[k]; });
            return cp;
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
