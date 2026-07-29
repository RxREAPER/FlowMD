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

  // Global Auth & Sync API
  window.FirebaseSync = {
    currentUser: null,
    
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
    async syncToCloud(uid, stateData) {
      if (!db || !uid) return;
      try {
        const payload = {
          completedVideos: stateData.completedVideos || [],
          speed: stateData.speed || 1.5,
          goals: stateData.goals || {},
          streakData: stateData.streakData || {},
          personal: stateData.personal || {},
          subjectUrgency: stateData.subjectUrgency || {},
          dailyBatch: stateData.dailyBatch || null,
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
    }
  };
})();
