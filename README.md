# FlowMD — Gamified NEET-PG Study Planner

> A retro-arcade, offline-first PWA that turns a 2000+ video NEET-PG syllabus into daily quests, streaks, and progress you can actually see.

**Live app:** [flowmd-04.web.app](https://flowmd-04.web.app) · **Report an issue:** [GitHub Issues](https://github.com/mohammedsafi0414/FlowMD/issues)

[![CI / Deploy](https://github.com/mohammedsafi0414/FlowMD/actions/workflows/deploy.yml/badge.svg)](https://github.com/mohammedsafi0414/FlowMD/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-offline--first-purple)](https://flowmd-04.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%2B_Firestore-orange)](https://firebase.google.com)

---

## What is FlowMD?

FlowMD is a study planner for medical students preparing for **NEET-PG**. Instead of a spreadsheet and a prayer, you get:

- **Dual-track study plans** — run two subjects in parallel (Plan A + Plan B), each with its own daily pace, deadline, and chapter scope.
- **Daily quests** — every morning the app picks today's batch of videos from your plan. Tick them off like a to-do list, complete your target, and unlock **extra videos** when you overachieve.
- **Per-edition partitions** — Marrow Edition 8 and Edition 6.5 are fully separate workspaces: separate plans, goals, quests, analytics, and completions. Switch anytime; nothing bleeds across.
- **Identical across all your devices** — the daily quest batch is part of the synced plan, so your phone and tablet show the *exact same videos*, even a brand-new device that has never opened the app.
- **Gamification** — pixel-art arcade theme, study streaks, "Level Up" progress bars, HP-bar mastery meters, and congrats cards.
- **Offline-first PWA** — installs to the home screen, precaches the whole syllabus, and works with no signal. Completions made offline sync when you're back.
- **Firebase sync that doesn't fight itself** — pull-then-push with per-field clocks, per-edition suffixed fields, and a write-quiescent merge: two devices editing at once converge without clobbering each other or echoing writes forever.
- **Analytics** — 7/30-day charts, per-subject daily counts, syllabus mastery, deadline countdown, and ETA math that re-derives your pace from real progress.
- **Bulk chapter completion** — mark already-finished chapters as done without skewing your analytics.

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Vanilla JavaScript (ES5 IIFEs on `window.FlowMD.*` — no build step, no bundler) |
| Styling | CSS custom properties (HSL design tokens) + pixel-art retro theme |
| Auth / DB | Firebase Auth + Firestore (compat SDK v10) |
| Hosting | Firebase Hosting (+ strict CSP headers, `firestore.rules` at the DB) |
| Offline | Service worker (`sw.js`) precaches all runtime assets + syllabus data |
| Tests | Playwright (browser suites) + `node:test` (unit/sync suites) |

## Architecture

The app is a single-page app with a thin shell (`app.js`) and ~20 plain modules under `js/core/` and `js/features/`. Every module is an IIFE that registers itself on `window.FlowMD.*`; `index.html` loads them in dependency order (CSP forbids `eval`, so no bundler magic).

```
app.js                      thin shell: boot, view routing, error boundaries
js/core/
  constants.js              design tokens, storage keys, defaults
  state-store.js            the single mutable state object + localStorage persistence
  sync.js                   PURE sync logic: sanitize, per-field clock merge, dirty tracking
  source-data.js            dataset registry + edition switching (marrow_8 / marrow_6_5)
  metrics.js                queue engine (daily quests) + syllabus math
  subjects.js               subject metadata (icons, accents, faculty)
js/features/
  sync.js                   live sync wiring: sign-in pull, manual sync, connectivity
  views/*.js                dashboard, curriculum, analytics, subject detail, profile
  onboarding.js, plan-config.js, source-settings.js, charts.js, theme.js, ...
firebase.js                 Firebase init + the thin cloud API
data.js / data_marrow_6_5.js  syllabus datasets (fully-qualified video ids)
```

The interesting bits:

- **Per-edition state.** `state.editions = { marrow_8: {...}, marrow_6_5: {...} }` — each edition owns its plans, goals, daily history, and bulk-completions. Cloud fields are suffixed (`plans_marrow_8`, …) with independent clocks, so devices working on different editions never clobber each other.
- **Deterministic daily quests.** `plan.queueBatchVideoIds` is a synced plan key. Every device (including fresh ones) renders the same batch, and the queue engine treats the shared batch as authoritative — no regen ping-pong between devices.
- **Write-quiescent sync.** A pull merges by per-field clock; a push sends only fields the local device actually changed (plans compared in their cloud shape, `completedVideos` diffed per key). After devices settle, syncs are pure reads.

## Getting Started

### Prerequisites

- Node.js 20+ (Node 24 recommended)
- `npm ci`

### Run locally

```bash
npm ci          # install dependencies (Playwright + Firebase tooling)
npm run dev     # serves the app at http://localhost:8140
```

Open `http://localhost:8140` in a browser. The app works fully offline-ish without Firebase (renders local state; sign-in enables cloud sync).

> Tip: the data files are large (300 KB+ each); the dev server (`serve.cjs`) is a tiny no-dependency static server, so the first load is fast.

### Run the tests

```bash
npm test        # everything: modules, metrics, smoke, onboarding, navigation,
                # migration, offline, render, inline-styles, scope-leaks + unit suites
npm run test:rules   # Firestore emulator rules suite (needs a JVM)
node --test tests/unit/*.test.mjs   # just the unit/sync suites
```

The suite is extensive by design — sync behavior is proven against a two-device harness with a real in-memory Firestore mock, including zero-write settle assertions.

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

- The Firebase **API key in `firebase.js` is public by design** — Firebase client SDKs ship the key in every client. **Real security comes from `firestore.rules`**, which restricts reads/writes to the signed-in owner and caps field sizes/types.
- The app ships a strict CSP (`object-src 'none'`, no `unsafe-eval`) and escapes all user input before rendering.
- See [SECURITY.md](SECURITY.md) for the full policy and how to report a vulnerability.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — conventions, test expectations, and the PR checklist.

## License

[MIT](LICENSE) © Mohammed Faiz
