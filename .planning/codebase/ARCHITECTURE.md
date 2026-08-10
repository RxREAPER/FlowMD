# Architecture

**Pattern**: Module registry + thin shell. All logic lives in plain IIFE modules that register under `window.FlowMD.<name>` (no bundler — the deployed CSP forbids `unsafe-eval`, so the app ships as ordered plain `<script>` tags). `app.js` is a thin shell (~356 lines) that wires the registry together: state init, DOM cache, router, events, dispatcher.

**Module registry**: Each module is an IIFE that exports an object, e.g. `window.FlowMD.store = { loadState, saveState, ... }`. Feature modules pull their own dependencies from the registry at load; the shell pulls only what it consumes. Script order in `index.html` is dependency order (core → features → views → shell).

**State**: Global `state` object (single live reference owned by `js/core/state-store.js`, exposed via `getState()`). Loaded from localStorage on init, persisted on every mutation via `saveState()`. Optionally synced to Firestore when user is authenticated (`js/features/sync.js`).

**Views**: 5 views — dashboard, curriculum, subject_detail, analytics, profile. Each is its own file in `js/features/views/`, registered on `window.FlowMD.views` via `Object.assign` (load order matters: `dashboard.js` runs first and seeds the object). Routing via `shell.switchView(viewName)`; the shell's `render()` dispatcher calls `safeRender(() => renderXView(DOM, stats), ...)` — views receive the shell DOM cache on every render.

**Templates**: Each view rendered via innerHTML assignment. DOM references cached in a `DOM` object on init (shell) and mirrored module-locally by each view.

**Dual-Plan System**: Plan A / Plan B, each with its own queue engine, target subject, pace, and progress tracking. Queue updates daily (`getQueueVideoIds()`).

## Module map (v178)

| Module | File | Lines | Responsibility |
|---|---|---|---|
| `namespace` | `js/core/namespace.js` | 5 | Seeds `window.FlowMD = {}` |
| `constants` | `js/core/constants.js` | 228 | Icons, escape helpers, date keys, source registry, plan presets, PXL icon set |
| `store` | `js/core/state-store.js` | 318 | State object, load/save/migrate, streak, merge, queue persistence |
| `sourceData` | `js/core/source-data.js` | 146 | Syllabus dataset access, source switching, scope/chapter helpers |
| `subjects` | `js/core/subjects.js` | 133 | Subject icons, colors, faculty, names |
| `metrics` | `js/core/metrics.js` | 349 | Syllabus stats, ETA, pace math, per-plan queue/metrics |
| `logo` | `js/core/logo.js` | 45 | FlowMD logo SVG |
| `toast` | `js/features/toast.js` | 120 | Toast notifications |
| `theme` | `js/features/theme.js` | 80 | Theme apply, topbar initials/source, offline indicator, edition chip |
| `search` | `js/features/search.js` | 234 | Spotlight deep search modal + results |
| `sync` | `js/features/sync.js` | 146 | Firebase init, cloud merge, manual sync |
| `onboarding` | `js/features/onboarding.js` | 228 | 3-step onboarding wizard |
| `planConfig` | `js/features/study-plan-config.js` | 715 | Study-plan config wizard, pace sync, goal modal |
| `sourceSettings` | `js/features/source-settings.js` | 135 | Study-source settings modal |
| `charts` | `js/features/charts.js` | 276 | Execution chart + subject heatmap SVG |
| `views` | `js/features/views/*.js` | ~1,173 | 5 view renderers + profile bottom sheet |
| `shell` | `app.js` | 356 | Router, init, events, dispatcher, info modal, haptics |

**Script load order** (`index.html`): namespace → constants → state-store → source-data → subjects → metrics → logo → toast → theme → search → sync → onboarding → study-plan-config → source-settings → charts → views (dashboard → curriculum → subject-detail → analytics → profile) → app.js (shell, loads last).

**Data files** (out of the registry, loaded first): `data.js` + `data_marrow_6_5.js` — immutable syllabus data (~24.5k lines), never edited.
