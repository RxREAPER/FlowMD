# FlowMD — An ADvanced NEET-PG Study Planner

**Live app:** [flowmd-04.web.app](https://flowmd-04.web.app) · **Report an issue:** [GitHub Issues](https://github.com/mohammedsafi0414/FlowMD/issues)

[![CI / Deploy](https://github.com/mohammedsafi0414/FlowMD/actions/workflows/deploy.yml/badge.svg)](https://github.com/mohammedsafi0414/FlowMD/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-offline--first-purple)](https://flowmd-04.web.app)
[![Privacy](https://img.shields.io/badge/privacy-no--tracking-green)](https://flowmd-landing.web.app)

---

## What is FlowMD?

FlowMD is a study planner for medical students preparing for **NEET-PG**. Instead of a spreadsheet and a prayer, you get:

- **Dual-track study plans** — run two subjects in parallel (Plan A + Plan B), each with its own daily pace, deadline, and chapter scope.
- **Daily quests** — every morning the app picks today's batch of videos from your plan. Tick them off like a to-do list, complete your target, and unlock **extra videos** when you overachieve.
- **Per-edition partitions** — Marrow Edition 8 and Edition 6.5 are fully separate workspaces: separate plans, goals, quests, analytics, and completions. Switch anytime; nothing bleeds across.
- **Offline-first PWA** — installs to the home screen, precaches the whole syllabus, and works with no signal. All data lives on the device; nothing is uploaded.
- **Export & import backup** — save your progress to a JSON file and restore it on a new device. Backups are versioned and stay importable across future app versions.
- **Dormant cloud-sync stack** — the sign-in / Firebase sync code is preserved in the repo (unloaded) for a future sync release. See "Re-enabling cloud sync" below.
- **Analytics** — 7/30-day charts, per-subject daily counts, syllabus mastery, deadline countdown, and ETA math that re-derives your pace from real progress.
- **Bulk chapter completion** — mark already-finished chapters as done without skewing your analytics.

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Vanilla JavaScript (ES5 IIFEs on `window.FlowMD.*` — no build step, no bundler) |
| Styling | CSS custom properties (HSL design tokens) + pixel-art retro theme |
| Data layer | localStorage on the device (offline-first; nothing uploaded) |
| Backup | Export / Import JSON envelope (`js/features/backup.js`) |
| Hosting | Firebase Hosting (strict CSP headers; no Google/Firebase network calls) |
| Dormant | Firebase Auth + Firestore sync stack (preserved, unloaded) |
| Offline | Service worker (`sw.js`) precaches all runtime assets + syllabus data |
| Tests | Playwright (browser suites) + `node:test` (unit/sync suites) |

## Architecture

The app is a single-page app with a thin shell (`app.js`) and ~20 plain modules under `js/core/` and `js/features/`. Every module is an IIFE that registers itself on `window.FlowMD.*`; `index.html` loads them in dependency order (CSP forbids `eval`, so no bundler magic).

```
app.js                      thin shell: boot, view routing, error boundaries
js/core/
  constants.js              design tokens, storage keys, defaults
  state-store.js            the single mutable state object + localStorage persistence
  sync.js                   DORMANT: pure sync logic (preserved for a future re-enable)
  source-data.js            dataset registry + edition switching (marrow_8 / marrow_6_5)
  metrics.js                queue engine (daily quests) + syllabus math
  subjects.js               subject metadata (icons, accents, faculty)
js/features/
  sync.js                   DORMANT: live sync wiring (preserved, not loaded)
  views/*.js                dashboard, curriculum, analytics, subject detail, profile
  onboarding.js, plan-config.js, source-settings.js, charts.js, theme.js, ...
firebase.js                 DORMANT: Firebase init + the thin cloud API (not loaded)
data.js / data_marrow_6_5.js  syllabus datasets (fully-qualified video ids)
```

The interesting bits:

- **Per-edition state.** `state.editions = { marrow_8: {...}, marrow_6_5: {...} }` — each edition owns its plans, goals, daily history, and bulk-completions.
- **Deterministic daily quests.** `plan.queueBatchVideoIds` is the shared batch — the queue engine treats it as authoritative, so the same videos show every day until the batch completes.

## Getting Started

### Prerequisites

- Node.js 20+ (Node 24 recommended)
- `npm ci`

### Run locally

```bash
npm ci          # install dependencies (Playwright + Firebase tooling)
npm run dev     # serves the app at http://localhost:8140
```

Open `http://localhost:8140` in a browser. The app is fully offline-first — no accounts, no network calls; all progress is stored on the device.

> Tip: the data files are large (300 KB+ each); the dev server (`serve.cjs`) is a tiny no-dependency static server, so the first load is fast.

### Run the tests

```bash
npm test        # everything: modules, metrics, smoke, onboarding, navigation,
                # migration, offline, render, inline-styles, scope-leaks + unit suites
npm run test:rules   # Firestore emulator rules suite (needs a JVM)
node --test tests/unit/*.test.mjs   # just the unit/sync suites
```

The suite is extensive by design — the preserved sync unit tests still run against a two-device harness with a real in-memory Firestore mock, including zero-write settle assertions.

### Re-enabling cloud sync

The sign-in/auth/sync stack is preserved **dormant in the repo** (files untouched, not loaded by `index.html`). To re-enable it for a future sync release:

1. Restore the four gstatic Firebase SDK `<script>` tags in `index.html` (firebase-app/auth/firestore/analytics-compat 10.8.0).
2. Restore the `<script>` tags for `firebase.js`, `js/core/sync.js`, and `js/features/sync.js` in `index.html`.
3. Restore the Google/Firebase domains in both CSPs (`index.html` meta CSP + the app-site header CSP in `firebase.json`).
4. Restore the sync wiring in `app.js` (`initFirebaseSync`, `manualSync`, `stateProvider`) and the sign-in UI in `js/features/onboarding.js` + `js/features/views/profile.js` (see git history — each is a self-contained diff).
5. Re-add the Firebase SDK precache list + network-first branch in `sw.js`.
6. `npm test` — the preserved sync unit suites (`tests/unit/sync-*.test.mjs`) confirm the stack still works.

### Project structure

```
app.js, index.html, style.css, sw.js   app shell, PWA, offline
js/                                    all application code (core + features)
data.js, data_marrow_6_5.js            syllabus datasets
firebase.js, firestore.rules           cloud wiring + security rules
tests/                                 Playwright + node:test suites
scripts/                               version bump, rules test
assets/, icons/                        subject icons, manifest art
```

## Deployment

Deploys are **manual** and gated:

1. Push your changes to `main` (CI runs the tests automatically).
2. Go to **Actions → "FlowMD CI / Deploy" → Run workflow**.
3. The workflow bumps the cache-busting version (`?v=NNN`), commits it, and deploys `hosting` + `firestore:rules` to [flowmd-04.web.app](https://flowmd-04.web.app).

Local alternative: `npm run deploy:firebase` (requires `firebase login`).

## Data & Attribution

The syllabus dataset (subjects, chapters, video titles) is derived from **Marrow** course content. FlowMD is an independent study tool built for personal use; it is not affiliated with or endorsed by Marrow. Please respect Marrow's terms of service when using the data.

## Security

- The app ships a strict CSP (`script-src 'self'`, `connect-src 'self'`, `object-src 'none'`, no `unsafe-eval`) and escapes all user input before rendering.
- The shipped app makes **zero Google/Firebase network requests** — no telemetry, no tracking, no accounts. The dormant `firebase.js` (with its public-by-design API key) is not loaded in production.
- Import validates the backup envelope and only ever writes known `flowmd_*` keys; the current state is auto-backed-up before an import overwrites it.
- See [SECURITY.md](SECURITY.md) for the full policy and how to report a vulnerability.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — conventions, test expectations, and the PR checklist.

## License

[MIT](LICENSE) © Mohammed Safi-Ur-Rehman
