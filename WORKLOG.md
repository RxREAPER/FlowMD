# FlowMD Worklog

> **Durable session memory.** This file is the shared history between the
> maintainer (@RxREAPER) and the AI coding agent (Buffy / Freebuff).
>
> **Agent instructions:** Read this file at the START of every session for
> context. When substantive work is completed (merged PRs, closed issues,
> significant decisions), APPEND a new entry under **Session Log** and commit
> it together with (or right after) the work. Keep entries terse — PR links,
> what/why, gotchas. Newest entries go on TOP of the log.
>
> **Automation:** merged PRs are logged automatically by CI
> (`.github/workflows/worklog.yml`) — title → classification, PR body
> `## Summary` bullets → quoted verbatim. Hand-log only decisions and
> context automation can't see, and write PR bodies with a clean
> `## Summary` section so the auto-entries are useful.

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
### 2026-09-18 · Session 3 — issues #29 + #32 (manual-goal semantics + UI wave 3)
- **Decision (issue #29):** manual-mode Goal Pulse targets are now ADDITIVE — the manual topic count adds 1:1 to today's goal and adds the SAME count (never ×7/×30) to the weekly/monthly goals; auto-plan paces keep their ×7/×30 rolling ideals. Sub-heading spells out the source mix ("2 from manual topics + 4 from plans").
- Issue #32 wave: compact 2-col curriculum cards (no square aspect lock) with hours + module count in the meta line; curriculum-page search box (client-side, persisted in state); per-unit hours in subject detail; 30-day strip 56→132px; Daily Tasks header strip (large hours figure + done-count) and single toolbar row; per-plan stat chips replace the FOCUS/TARGET rows; hero "Current Subject Progress" now measures WHOLE subjects (plan scope ignored — matches curriculum cards); streak moved to a topbar pill left of the avatar; bottom-nav "Plan" label lowered + stronger neon glow.
- Gotcha: `getPlanScopeVideos(plan)` without `targetUnits` already returns the whole subject — hero whole-subject % is computed by dropping the plan's scope, not by new math.

### 2026-09-17 — Auto-log (merged PRs)

- Merged **#34 — auto-log merged PRs to WORKLOG.md** (CI, by RxREAPER) → 2973de2
  - Files: 5
  - New `worklog.yml` workflow: after every merge to `main`, a script fetches the merged PR via the REST API, classifies it from the title (feat/fix/uiux/chore…), quotes the PR body…
  - Idempotent (grep guard), concurrency-grouped, push-retry against deploy-bump races, and self-filtering so its own commits never re-trigger it.
  - The logger's commit always carries `[skip-deploy]`; `deploy.yml` now honors that suffix so the worklog push never double-deploys.
  - Agent rule + worklog header updated: hand-log only what automation can't see; PR bodies should carry a clean `## Summary` section.

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
