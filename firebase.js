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
  let analytics = null;
  if (typeof firebase !== 'undefined' && firebase.analytics) {
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
        const payload = {
          completedVideos: stateData.completedVideos || {},
          speed: stateData.speed || 1.5,
          goals: stateData.goals || {},
          streakData: stateData.streakData || {},
          personal: stateData.personal || {},
          subjectUrgency: stateData.subjectUrgency || {},
          dailyBatch: stateData.dailyBatch || null,
          dailyHistory: stateData.dailyHistory || {},
          dailyHistoryBySubject: stateData.dailyHistoryBySubject || {},
          plans: stateData.plans || [],
          activePlanId: stateData.activePlanId || 'plan_a',
          activeSource: stateData.activeSource || 'marrow_8',
          isConfigured: stateData.isConfigured || false,
          themeStyle: stateData.themeStyle || 'modern',
          queueCompletedInBatch: stateData.queueCompletedInBatch || 0,
          queueBatchVideoIds: stateData.queueBatchVideoIds || [],
          // Google account info (for profile display)
          googleDisplayName: user?.displayName || null,
          googlePhotoURL: user?.photoURL || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
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
        const payload = Object.assign({}, fields, {
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
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
    async updateVideo(uid, videoId, done) {
      if (!db || !uid || !videoId) return;
      try {
        const path = new firebase.firestore.FieldPath('completedVideos', videoId);
        await db.collection('users').doc(uid).update({
          [path]: !!done,
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
    },

    // Real-time listener for cross-device sync
    subscribeToCloud(uid, onChange) {
      if (!db || !uid) return () => {};
      const unsub = db.collection('users').doc(uid)
        .onSnapshot((doc) => {
          if (doc.exists) {
            onChange(doc.data());
          }
        }, (err) => {
          console.error('onSnapshot error:', err);
        });
      return unsub;
    }
  };
})();
