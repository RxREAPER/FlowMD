# Integrations

**Firebase Auth** (`firebase.js:44`): Google Sign-In via `signInWithPopup`. `onAuthStateChanged` listener triggers state load from cloud and enables sync. Firestore rules restrict access to `request.auth.uid == userId`.

**Firestore Sync** (`firebase.js:60`): On every state save, if user is authenticated, `syncToCloud()` writes 7 fields to `users/{uid}` with `merge:true`. Cloud data loaded on auth via `loadFromCloud()`. Offline persistence enabled with `synchronizeTabs:true`.

**Cache-Busting** (`scripts/bump-version.js`): Scans `index.html` for `?v=N` patterns, increments the highest version found, rewrites the file. Run before deploy.

**Deploy** (`package.json`): `npm run deploy` → bump version → git commit+push → firebase deploy. Auto-deploy via GitHub Actions on push to main.
