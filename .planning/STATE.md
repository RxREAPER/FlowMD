# FlowMD — Project State

## Current Phase
- **Phase**: 1 (Multi-Source Syllabus Support)
- **Status**: Code complete + automated QA green (21/21), awaiting commit/deploy

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
- [x] Phase 1 — Playwright QA: 21/21 checks green (wizard, Prepladder X gate, source switch, dual-plan, persistence, no console errors)

## In Progress
- Commit + deploy (blocked: git not on PATH)

## Next
- Run `node scripts/bump-version.js` (now at v146)
- Commit (blocked: git not on PATH) and deploy

## Notes
- Cache-busting version: v121
- Live: https://flowmd-04.web.app
- Repo: https://github.com/mohammedsafi0414/FlowMD
