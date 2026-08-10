# FlowMD — Project State

## Current Phase
- **Phase**: 6 (Monolith Decomposition — COMPLETE on `refactor/decompose-monolith` branch, v178)
- **Status**: All 5 phases complete. 58/58 Playwright checks green + module registry + metrics unit tests (160+ assertions). Decomposition branch ready for review/merge.

## Phase 6: Monolith Decomposition (2026-08-10 session)
- [x] `app.js` (3,816 lines single IIFE) → thin shell (356 lines) + 20 module files under `js/core/` and `js/features/`
- [x] Reactivated two dead modules extracted in v160 but never wired: `js/core/state-store.js`, `js/core/source-data.js` (duplicate copies deleted from `app.js`)
- [x] New test suites: `tests/modules.mjs` (81 registry-contract checks), `tests/metrics.mjs` (19 unit tests), `tests/navigation.mjs` (full view tour + bottom-sheet interactions, no console errors)
- [x] Deleted dead code found during extraction: `renderGoalsView` (unreachable since initial commit), `renderFacultyPill`/`renderHoursMeter` (already dead)
- [x] `npm test` now runs: modules → metrics → smoke → onboarding → navigation (160+ assertions)
- [x] Every extraction tagged `stage-0`…`stage-17` for instant revert; backup branch `backup/pre-decompose-v161`

## Completed
- [x] Firebase Hosting deployment live at flowmd-04.web.app
- [x] GitHub repo connected (mohammedsafi0414/FlowMD)
- [x] Deployment workflow (npm scripts + GitHub Actions + cache-busting)
- [x] GSD .planning/ structure initialized (PROJECT.md, STATE.md, ROADMAP.md, config.json)
- [x] Codebase mapping complete (7 docs: STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS)
- [x] Phase 1 — Marrow Edition 6.5 dataset added (`data_marrow_6_5.js`)
- [x] Phase 1 — Source registry + `getDataset()` switching (`marrow_8` default, Prepladder X placeholder)
- [x] Phase 1 — Video ID namespacing (`sourceId::vid`), legacy `completedVideos` migration
- [x] Phase 1 — "Entire Syllabus" removed; empty-target quest CTA
- [x] Phase 1 — Goal-modal source switcher with live subject refresh
- [x] Phase 1 — 3-step onboarding wizard replaces Driver.js tutorial
- [x] Phase 1 — Playwright QA: 58/58 checks green (wizard, Prepladder X gate, source switch, dual-plan, persistence, no console errors)
- [x] Subject icons — replaced PNG subject icons with Health Icons SVGs (`SUBJECT_SVG_ICONS` in constants.js) across heatmap, curriculum, subject detail, and spotlight search; PNG fallback kept
- [x] SVG icon QA — Playwright smoke 20/20, onboarding 38/38; verified heatmap 20/20 SVGs, curriculum 20/20, subject detail 1/1, spotlight 1/1, zero PNG fallbacks, no console errors
- [x] Changelog — `CHANGELOG.md` created documenting the SVG icon migration

## Security & Deploy Hardening (audit round 1 — Nov 2025 session)
- [x] **Hosting exposure fixed**: `firebase.json` ignore list now excludes `_archive/`, `tests/`, `scripts/`, `package*.json`, `firestore.rules`, `CHANGELOG.md` (was: whole repo served incl. 337MB `_archive` + a `.exe`)
- [x] **`_archive/` removed from git tracking** (`git rm --cached`) + `.gitignore`; still recoverable via git history
- [x] **`.opencode/` git-ignored** (project-local skills duplicates)
- [x] **Firestore rules now deployed**: `deploy:firebase` → `--only hosting,firestore:rules`; CI workflow updated to match + commits version bump back to main + runs tests before deploy
- [x] **XSS hardening**: `escapeHtml`/`escapeAttr` helpers in `js/core/constants.js`; applied to search `q`, `doctorName`/`obwName`, `syncEmail`, toast title/message. Verified 6/6 injection checks (no execution)
- [x] **CSP enforced**: strict CSP meta + Firebase hosting header (no `unsafe-eval`, `object-src 'none'`); inline `onclick` removed from `index.html`
- [x] **Cloud-merge data-loss fix**: login merge now local-wins-on-conflict (offline completions no longer clobbered by stale cloud snapshot), streakData merged
- [x] **Playwright declared**: `playwright` added to devDependencies + `npm test` script (was extraneous/unwired); CI installs chromium

## Phases 2–4 (Current Session)
- [x] **Phase 2 — PWA Offline**: Service worker registered in `init()`; caches all runtime assets including data files; query-string-safe cache keys strip `?v=XXX` for offline matching
- [x] **Phase 3 — localStorage Schema + Day Boundary**: Schema version key with migration runner; `safeParse` guard; v1→v2 migration for video ID namespacing; UTC→local day boundary via `todayKey()`/`toLocalDateKey()` (IST-safe)
- [x] **Phase 4 — Error Boundaries**: `safeRender` wrapper on all 5 view functions; graceful error card with "Reload App" button; exclamation icon added

## In Progress
- None — all phases complete

## Completed This Session
- [x] **7-Day Execution Chart reverted to line style** — reverted the pixel-terminal bar chart back to the deployed line style: smooth Catmull-Rom→cubic-bezier curve + gradient area fill (`ex-chart-area` via `linearGradient`) + solid circle nodes (r=5, `ex-chart-node`). Removed `ex-bar-track`, `ex-bar-cell`, `ex-trend-line`, `ex-trend-marker`, `ex-dot-trend`, and the re-render-at-measured-width logic. Matches deployed site (flowmd-04.web.app) exactly. Cache-busted to v161. Playwright 60/60 green, 0 console errors.

## Next
- Deploy to production when explicitly approved (CI has manual gate: `workflow_dispatch`)

## Notes
- Cache-busting version: v161 (index.html `?v=161`)
- Live: https://flowmd-04.web.app
- Repo: https://github.com/mohammedsafi0414/FlowMD
- Backup refs: `backup/pre-hardening`, `backup/pre-hardening-20260809-113936`, `backup/pre-modular-20260808-123655`
- git is available (2.55.0) — STATE.md previously claimed "git not on PATH"; that was incorrect
