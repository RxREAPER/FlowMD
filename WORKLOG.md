# FlowMD Worklog

> **Durable session memory.** This file is the shared history between the
> maintainer (@RxREAPER) and the AI coding agent (Buffy / Freebuff).
>
> **Agent instructions:** Read this file at the START of every session for
> context. When substantive work is completed (merged PRs, closed issues,
> significant decisions), APPEND a new entry under **Session Log** and commit
> it together with (or right after) the work. Keep entries terse — PR links,
> what/why, gotchas. Newest entries go on TOP of the log.

## Project snapshot

- **What:** FlowMD — offline-first PWA study planner/tracker (Marrow-style UI), vanilla JS ES-modules, no framework, no build bundler.
- **Live:** https://flowmd-04.web.app (Firebase Hosting; deploy runs automatically on every merge to `main`; service worker caches the shell — users may need a pull-to-refresh after deploys).
- **Repo conventions:**
  - 100% offline-first: CSP is `'self'` only, **zero external origins** (no CDNs, no Google Fonts, no analytics) — do not introduce any.
  - Icons: inline SVG sprite in `js/core/icons.js` (`fmd-i-*` ids), referenced via `<use>`. Never font/ligature icons.
  - No inline `style=""` attributes in JS-generated markup — guarded by `tests/inline-styles.mjs` (baseline file `tests/inline-styles-baseline.txt`; update with `--update` only for equivalent data-driven styles).
  - Test suite: `npm test` (smoke 112 checks via Playwright + unit + render + offline + navigation + modules + migration). **Must be green before merge.**
  - Flow: feature branch → PR via `gh` → CI → merge to `main` (user may say "just merge"); deploys are serialized by the concurrency guard (PR #21).
  - Cache version in `sw.js` is bumped with each user-facing change so PWAs pick up updates.

## Key decisions & gotchas (cumulative)

- `completedVideos` values: `true` (bulk/legacy) or ISO date string (individually ticked). Cloud sync merges per-key — both forms are safe.
- Topbar offline-indicator is `display:none` while online — never write a check that measures the *first* icon in DOM order (see PR #31).
- `formatCompletionDate` (js/core/constants.js) renders ISO dates as "Completed Today / N days ago / Dth Mon".
- Subject sub-page is flat Marrow-style: serial unit numbers, colored number tiles, one "Mark done" control per unit.
- Known-good flake status: none remaining as of PR #31 (offline icons check fixed).

## Session Log

### 2026-09-17 · Session 2 — UI/UX wave 2, #28 redesign, test hygiene
- **PR #22** — real concave notch cut into the bottom bar (SVG-style radial mask, concentric with the Plan disc) + Plan label clearance. From the user's video feedback (issue #15 thread).
- **PR #23** — issue #17: manual-mode tasks now drive Goal Pulse; daily goal = manual list size, weekly/monthly derived from it.
- **PR #24** — issue #18: taller 7-day chart, smaller day labels, 30-day progress card, per-subject progress bar in welcome card, topbar 76→64px. Required conflict resolution after #22/#23/#26 merged (resolved as union).
- **PR #26** — issue #16: 2-column curriculum cards, chapters collapsed on numbered vertical timeline rail, completion dates on lecture cards ("Completed Today / 3 days ago"), Daily Tasks progress track. Was briefly committed on the wrong branch — cherry-picked to clean `feat/uiux-3` and #24 force-rewound; verified one scoped commit per PR.
- **PR #27** — issue #25: "How your daily topics work" Auto-vs-Manual explainer (plan-config sheet + dashboard captions with link). Smoke assertion for #11's removed UI was over-strict (banned the *word* "topics") — tightened to the actual removed section.
- **PR #30** — issue #28 (7 items): modes explainer → closable popup off Daily Tasks; hero card → realtime "Current Subject Progress" for Plans A+B; square Marrow-style curriculum cards with subtle meta; subject sub-page rewrite (serial numbers, colored number tiles per user's Marrow screenshots, one tick per unit, completion dates on topics/units/subjects); tap-to-inspect 30-day bars with avg/best chips. Reference images (Marrow app) OCR'd/analyzed locally, deleted before commit — never commit user personal files. Fixed a latent `state`-vs-`getState()` bug in new source-data helpers caught by smoke.
- **PR #31** — offline-test icons "flake" was deterministic: check measured the first DOM icon = topbar offline indicator which is `display:none` online → 0×0. Now measures first *visible* icon. `npm test` exits 0 end-to-end; 5 clean consecutive offline runs.
- Suite grew **88 → 112 smoke checks**; all issues (#11, #15, #16, #17, #18, #25, #28) closed; 0 open issues.

### 2026-09-16 · Session 1 — first contact, early fixes
- Established repo context, ran/extended test suite, early UI fixes and PR #21 (deploy concurrency guard — deploys queue instead of racing). Details condensed; see git history for the range.
