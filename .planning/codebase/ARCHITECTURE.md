# Architecture

**Pattern**: Single IIFE (Immediately Invoked Function Expression) wrapping all logic in `app.js` (4,028 lines). No modules, imports, or classes — pure functions and closures.

**State**: Global `state` object holding all app data. Loaded from localStorage on init, persisted on every mutation via `saveState()`. Optionally synced to Firestore when user is authenticated.

**Views**: 5 views — dashboard, curriculum, subject_detail, analytics, profile. Routing via `switchView(viewName)` which hides/shows sections and calls the appropriate render function.

**Templates**: Each view rendered via innerHTML assignment. DOM references cached in a `DOM` object on init.

**Dual-Plan System**: Plan A / Plan B, each with its own queue engine, target subject, pace, and progress tracking. Queue updates daily via `getQueueVideoIds()`.
