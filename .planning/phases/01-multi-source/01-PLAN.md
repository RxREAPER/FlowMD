# Phase 01 — Multi-Source Syllabus Support

## Objective
Enable FlowMD to carry multiple study sources: add **Marrow Edition 6.5** as a second real dataset, add **Prepladder X** as an upcoming placeholder, namespace all video IDs per source, remove the "Entire Syllabus" fallback (subjects must always come from the active source), and replace the Driver.js dashboard tutorial with a 3-step onboarding wizard.

## Scope (In)
- `data_marrow_6_5.js` — new dataset (`syllabusData65`, 20 subjects, pre-qualified at load).
- Source registry + `getDataset()` switching via `state.activeSource` (`marrow_8` default).
- Video ID namespacing: `sourceId + '::' + v.id` (e.g. `marrow_8::anatomy__v1`).
- Removal of "Entire Syllabus" everywhere; empty subject → no quest queue + "Set Your First Target" CTA.
- Goal modal: source dropdown + live subject refresh + upcoming-source alert.
- Onboarding wizard (3 steps) replacing the Driver.js guided tutorial; `flowmd_is_configured` gate.
- Legacy migration: `flowmd_tutorial_seen` → `isConfigured`; old `completedVideos` keys → `marrow_8::` prefix.

## Scope (Out)
- Actual Prepladder X data ingestion (future phase).
- Per-source per-subject completion migration beyond the auto-prefix of `marrow_8`.

## Deliverables
- `data_marrow_6_5.js` (created).
- `app.js`, `index.html`, `style.css` updates.
- `.obw-*` onboarding styles + `.obw-empty-cta`.
- Version bump of all `?v=` cache tags.

## Verification
- `node -e "new Function(require('fs').readFileSync(...,'utf8'))"` passes for `app.js` + `data_marrow_6_5.js`.
- Cross-check: every `getElementById` in `app.js` either exists in `index.html` or is injected dynamically (wizard, analytics, profile, contact).
- No remaining refs to `Entire Syllabus`, `TUTORIAL_STEPS`, `openGuidedTutorial`, `hasSeenTutorial`, `driver.js`, `tut-btn`.
- Manual QA via `serve.mjs` (see TESTING.md): wizard flow, Prepladder X "coming soon" gate (Next disabled), source switch refresh, plan A/B save, empty-target CTA, dual-plan dashboard.

## Notes / Blocker
- `git` is not on PATH in this environment → GSD atomic commits cannot be executed locally. Doc-only completion; commit should happen once git is available or via GitHub web tooling.
- Cache-busting version at completion: run `node scripts/bump-version.js` (was `v=144`).
