# Tech Stack

**Language**: Vanilla JavaScript (ES5 IIFE) — no transpilers, no bundlers.

**UI**: InnerHTML-based rendering, no framework (React/Vue/Svelte).

**Styling**: Pure CSS (3,070 lines), CSS custom properties for theming, mobile-first responsive, retro pixel-art design (`Pixelify Sans`, `VT323`, `Inter` fonts).

**Storage**: localStorage for state persistence; Firebase Firestore for cloud sync when authenticated.

**Auth**: Firebase Auth — Google Sign-In via popup (`GoogleAuthProvider`).

**Backend**: Firebase (Firestore, Auth, Hosting). Project: `flowmd-04`.

**PWA**: Service Worker (`sw.js`) with cache-first strategy + manifest.json for installability.

**Deploy**: firebase-tools CLI, GitHub Actions (auto on push to main). Cache-busting via `?v=XXX` incremented by `scripts/bump-version.js`.
