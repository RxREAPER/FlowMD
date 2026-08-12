# FlowMD — Project Context

## Vision
A retro RPG-styled study planner for NEET-PG medical exam preparation. Gamifies syllabus tracking with pixel-art aesthetics, dual-plan tracking, and Firebase cloud sync.

## Status
- **Phase**: Production hardening (v214 in flight)
- **Deployment**: https://flowmd-04.web.app (Firebase Hosting) — serving v213
- **GitHub**: https://github.com/mohammedsafi0414/FlowMD — origin/main is 17 commits behind local main (push pending)
- **Last Deploy**: v213 (v214 pending: source-switch modal copy fix)

## Tech Stack
- **Language**: Vanilla JavaScript (ES5 IIFE)
- **Styling**: CSS with HSL design tokens, retro pixel-art theme
- **Auth/DB**: Firebase Auth + Firestore (compat SDK v10.8.0)
- **Deploy**: Firebase Hosting + GitHub Actions CI
- **PWA**: Service worker (sw.js), manifest.json

## Key Architecture
- Single-page app: index.html → thin app.js shell + 20 modules under `js/core/` and `js/features/` (plain IIFEs on `window.FlowMD.*`, no bundler — CSP forbids `unsafe-eval`); data.js / data_marrow_6_5.js (syllabus), firebase.js (cloud)
- Dual-plan tracking (Plan A / Plan B) with per-plan queue engine; source switch preserves plans, completions keyed per edition
- LocalStorage persistence with Firestore pull-then-push sync (per-field newest-wins, manual Sync Now)
- Cache-busting via `?v=XXX` query params (scripts/bump-version.js); PWA offline via sw.js

## Domain
- 19 MBBS subjects, ~2000+ video lectures
- Target exam: NEET PG (default date: 2026-08-15)
- Target user: Solo medical aspirant studying for post-grad entrance
