# FlowMD — Project State

## Current Phase
- **Phase**: 1 (Multi-Source Syllabus Support)
- **Status**: Code complete + automated QA green (58/58), awaiting commit/deploy

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

## In Progress
- Commit + deploy (requires explicit user confirmation — 3 unpushed commits + pre-existing WIP on `main`)

## Next
- On approval: commit staged changes, push, run `npm run deploy`
- Future rounds (deferred): service-worker registration (PWA offline), localStorage schema versioning + migration, UTC→local day boundary, sync of `plans`/`dailyHistoryBySubject` keys, workspace junk cleanup

## Notes
- Cache-busting version: v158 (index.html `?v=158`)
- Live: https://flowmd-04.web.app
- Repo: https://github.com/mohammedsafi0414/FlowMD
- git is available (2.55.0) — STATE.md previously claimed "git not on PATH"; that was incorrect
