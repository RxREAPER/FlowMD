# File Structure

```
/
├── index.html              # Main app shell — modals, onboarding, script order (v178)
├── app.js                  # Thin shell (356 lines) — router, init, events, dispatcher
├── style.css               # Unified mobile-first CSS — dark/light themes
├── firebase.js             # Firebase compat SDK — Auth + Firestore init & sync API
├── data.js                 # Syllabus data — 19 MBBS subjects, chapters, videos
├── data_marrow_6_5.js      # Marrow Edition 6.5 dataset
├── sw.js                   # Service worker — cache-first PWA + ASSETS list
├── manifest.json           # PWA manifest
├── js/
│   ├── core/               # Registry foundation (no UI)
│   │   ├── namespace.js    #   window.FlowMD = {}
│   │   ├── constants.js    #   icons, escape, dates, sources, plan presets
│   │   ├── state-store.js  #   state object + load/save/migrate/streak
│   │   ├── source-data.js  #   syllabus data access + source switching
│   │   ├── subjects.js     #   subject icons/colors/faculty
│   │   ├── metrics.js      #   stats, ETA, pace, queue math
│   │   └── logo.js         #   FlowMD logo SVG
│   └── features/           # UI features + views
│       ├── toast.js        #   toasts
│       ├── theme.js        #   theme + topbar chrome
│       ├── search.js       #   spotlight search
│       ├── sync.js         #   Firebase sync
│       ├── onboarding.js   #   onboarding wizard
│       ├── study-plan-config.js  # config wizard + goal modal
│       ├── source-settings.js    # source modal
│       ├── charts.js       #   execution chart + heatmap
│       └── views/          # one file per view
│           ├── dashboard.js
│           ├── curriculum.js
│           ├── subject-detail.js
│           ├── analytics.js
│           └── profile.js
├── scripts/
│   └── bump-version.js # Cache-busting version incrementer
├── assets/             # SVG logos and icons
├── components/         # TSX components (unused/experimental)
├── src/components/     # Additional TSX experiments
├── frames/             # Animation frame assets
├── tests/              # Node + Playwright suites (modules, metrics, smoke, onboarding, navigation)
├── .github/            # CI workflows (auto-deploy)
└── .planning/          # Project planning docs
```
