# FlowMD — Project State

## Current Phase
- **Phase**: 8 (Per-edition state partitions — COMPLETE on `main`, deployed through v215)
- **Status**: v215 (per-edition state) is merged to `main` and deployed live at flowmd-04.web.app. Each edition (`marrow_8` / `marrow_6_5`) now owns its own plans, goals, daily history (Goal Pulse / analytics graphs), per-subject counts, active plan and bulk-completed chapters via `state.editions` partitions (localStorage schema v3→v4). Cloud fields are edition-suffixed (`plans_marrow_8`, …) with independent per-field clocks; legacy flat cloud docs rehydrate into the edition they name. Source-switch modal shows a per-edition config summary. Verified live: switching 8 ↔ 6.5 keeps each edition's plan and renders its own daily quests (3/day Anatomy vs 5/day Pathology) after reload.
- **Hotfix (no version bump)**: `firestore.rules` fixed and deployed — the old rules required legacy FLAT fields (`plans`, `queueBatchVideoIds`, …) that no payload since v207 writes, so EVERY cloud write was silently PERMISSION_DENIED (cloud sync broken for all users, loads still worked). Rules now validate the v215 suffixed per-edition schema with per-edition caps; legacy flat fields are optional guards. Verified against the emulator (`npm run test:rules`, 13/13) and with a live production write.
- **Next**: feature development (per-edition Goal Pulse indicator on dashboard; real-device cross-edition sync test).
- **Git note**: `main` at v215 + rules hotfix — push to origin pending.

## Phase C: Legacy retro naming cleanup (2026-08-10, v179–v184)
- [x] `pxl-*` classes → `fm-*`, `PXL_ICONS` → `FLOWMD_ICONS`, PXLKIT comments → FlowMD (v179, 347 occurrences)
- [x] `obw-*` classes/IDs → `onboarding-*` incl. wizard state vars (v180)
- [x] `gcm-*` classes/IDs → `plan-config-*` (v181)
- [x] `ex-chart-*` classes → `chart-*` (v182)
- [x] Storage-key migration v2→v3 (`marrow_planner_*` → `flowmd_*`, one-time carry-over, legacy keys removed) + `tests/migration.mjs` (v184)
- [x] Fixed latent `getScopedChapterNames` missing imports in dashboard + subject-detail, surfaced by plan-seeded navigation audit (v183)

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

## Production hardening series (2026-08-11 → 2026-08-12, v204–v213, on `main`)
- [x] **v204** Google Fonts + Material Symbols font removed — system font stacks + inline SVG sprite (zero external font requests)
- [x] **v205/v206** Sync is pull-then-push — per-field newest-wins arbitration, no write ping-pong, two-device proof
- [x] **v207** Analytics Preparation Setup derives from `state.plans` (responds to Study Plan Config goals)
- [x] **v208** Sync data-loss fix — Sync Now can no longer wipe plans/goals; empty cloud docs can't clobber real data; editions keep separate completions
- [x] **v209** Full scenario matrix; fixed in-place plan-edit loss + per-plan merge (concurrent plans both survive)
- [x] **v210** Sync Diagnostics panel in Profile (per-field local vs cloud clocks, winner badges)
- [x] **v211/v212** Rendering correctness — cross-viewport render audit, layout safety nets, retro theme removed, inline-style guard, on-device layout self-check
- [x] **v213** Source switch no longer wipes plans, goals or quests — plans/targets preserved, completions per-edition
- Full suite green (unit 104+ / smoke / render / inline-style / scope-leaks). Details in `CHANGELOG.md`.

## In Progress
- None — v214 deployed. Next work is feature development on `main`.

## Completed This Session
- [x] **7-Day Execution Chart reverted to line style** — reverted the pixel-terminal bar chart back to the deployed line style: smooth Catmull-Rom→cubic-bezier curve + gradient area fill (`ex-chart-area` via `linearGradient`) + solid circle nodes (r=5, `ex-chart-node`). Removed `ex-bar-track`, `ex-bar-cell`, `ex-trend-line`, `ex-trend-marker`, `ex-dot-trend`, and the re-render-at-measured-width logic. Matches deployed site (flowmd-04.web.app) exactly. Cache-busted to v161. Playwright 60/60 green, 0 console errors.

## Next
- Feature development on `main`. Deploys are manual (`npm run deploy:firebase` or CI `workflow_dispatch`).

## Notes
- Cache-busting version: v214 (index.html `?v=214`); live site serving v214
- Live: https://flowmd-04.web.app
- Repo: https://github.com/mohammedsafi0414/FlowMD
- Worktrees: `marrow-planner/` (main), `marrow-planner-hardening/` (hardening/backend-production); `marrow-planner-main/` retired
- Backup refs: `backup/pre-hardening`, `backup/pre-hardening-20260809-113936`, `backup/pre-modular-20260808-123655`, `backup/pre-decompose-v161`
- git is available (2.55.0) — STATE.md previously claimed "git not on PATH"; that was incorrect
