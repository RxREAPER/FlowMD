# FlowMD — Roadmap

## Phase 0: Initialization (Complete)
- [x] Firebase deployment setup
- [x] GitHub repo + CI workflow
- [x] Cache-busting automation
- [x] GSD project management structure

## Phase 1: Multi-Source Syllabus Support (Complete)
- [x] Marrow Edition 6.5 dataset + source registry
- [x] Video ID namespacing + legacy migration
- [x] Remove "Entire Syllabus"; source-aware queues
- [x] Goal-modal source switcher + live refresh
- [x] Onboarding wizard replacing Driver.js tutorial
- [x] Automated QA (Playwright): 58/58 green

## Phase 2: PWA Offline + Service Worker (Complete)
- [x] Service worker registration in `init()`
- [x] Cache all runtime assets (`data.js`, `data_marrow_6_5.js`, `firebase.js`, module files)
- [x] Query-string-safe cache keys (strip `?v=XXX` for offline matching)
- [x] Cache version bumped to v6

## Phase 3: localStorage Schema Versioning + Day Boundary Fix (Complete)
- [x] Schema version key (`flowmd_schema_version`) with migration runner in `loadState()`
- [x] Safe JSON parse wrapper (`safeParse`) — corrupt storage never crashes the app
- [x] Migration v1→v2: legacy video ID namespacing applied to stored payload
- [x] UTC→local day boundary: `todayKey()` / `toLocalDateKey()` helpers in constants.js; dailyHistory, streak, analytics all use local date (IST-safe)
- [x] Schema version written on every `saveState()`

## Phase 4: Error Boundaries + Graceful Degradation (Complete)
- [x] `safeRender(viewFn, viewName, stats)` wrapper around all 5 view render functions
- [x] Catches any view crash, shows friendly error card with "Reload App" button
- [x] Exclamation icon added to PXL_ICONS
- [x] App never goes blank on render error

## Phase 5: Docs + Final QA (Complete)
- [x] ROADMAP.md updated with all phases
- [x] STATE.md updated with final status
- [x] Full Playwright suite: 58/58 checks green
- [x] Ready for production deploy (manual CI gate)
