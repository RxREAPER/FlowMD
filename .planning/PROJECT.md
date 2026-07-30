# FlowMD — Project Context

## Vision
A retro RPG-styled study planner for NEET-PG medical exam preparation. Gamifies syllabus tracking with pixel-art aesthetics, dual-plan tracking, and Firebase cloud sync.

## Status
- **Phase**: Active development (v2)
- **Deployment**: https://flowmd-04.web.app (Firebase Hosting)
- **GitHub**: https://github.com/mohammedsafi0414/FlowMD
- **Last Deploy**: v121 (cache-bust)

## Tech Stack
- **Language**: Vanilla JavaScript (ES5 IIFE)
- **Styling**: CSS with HSL design tokens, retro pixel-art theme
- **Auth/DB**: Firebase Auth + Firestore (compat SDK v10.8.0)
- **Deploy**: Firebase Hosting + GitHub Actions CI
- **PWA**: Service worker (sw.js), manifest.json

## Key Architecture
- Single-page app: index.html → app.js (all logic), data.js (syllabus), firebase.js (cloud)
- Dual-subject tracking (Plan A / Plan B) with per-plan queue engine
- LocalStorage persistence with Firestore cloud sync fallback
- Cache-busting via `?v=XXX` query params (scripts/bump-version.js)

## Domain
- 19 MBBS subjects, ~2000+ video lectures
- Target exam: NEET PG (default date: 2026-08-15)
- Target user: Solo medical aspirant studying for post-grad entrance
