# File Structure

```
/
├── index.html          # Main app shell (623 lines) — all modals, onboarding, tutorial
├── app.js              # All application logic (4,028 lines) — single IIFE
├── style.css           # Unified mobile-first CSS (3,070 lines) — dark/light themes
├── firebase.js         # Firebase compat SDK — Auth + Firestore init & sync API (95 lines)
├── data.js             # Syllabus data — 19 MBBS subjects, chapters, videos (10,241 lines)
├── sw.js               # Service worker (26 lines) — cache-first PWA
├── manifest.json       # PWA manifest
├── scripts/
│   └── bump-version.js # Cache-busting version incrementer
├── assets/             # SVG logos and icons
├── components/         # TSX components (unused/experimental)
├── src/components/     # Additional TSX experiments
├── frames/             # Animation frame assets
├── .github/            # CI workflows (auto-deploy)
└── .planning/          # Project planning docs
```
