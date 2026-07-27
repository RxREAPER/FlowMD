// Firebase Configuration & Helper Module for MedTracker PG
(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyAlHINhNUzrzWWrPAltf8W-RejaiWqudz4",
    authDomain: "marrowflow.firebaseapp.com",
    projectId: "marrowflow",
    storageBucket: "marrowflow.firebasestorage.app",
    messagingSenderId: "533812169710",
    appId: "1:533812169710:web:2a2f0ad60ea50829b09cff",
    measurementId: "G-WV84KDFPVQ"
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
