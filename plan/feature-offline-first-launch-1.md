---
goal: Ship the landing officially and transition the app to offline-only (device-local data) while preserving the sync/auth stack dormant in the repo, adding a stable forward-compatible Export/Import backup, install-focused landing CTAs, and explicit device-local data warnings.
version: 1.0
date_created: 2026-08-15
owner: FlowMD (owner + Codebuff)
status: 'In progress'
tags: [feature, architecture, offline, pwa, backup, landing]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

FlowMD is free, offline-first, and has no sign-up barrier — so the embedded live
demo and the cloud-sync-first marketing added friction instead of converting.
This plan makes the product and marketing coherent around **offline-only**:

1. The landing goes official with install-focused CTAs, "Export & backup"
   positioning, and honest device-local data warnings.
2. The app stops loading Firebase entirely (no accounts, no network calls), but
   the sign-in/auth/sync stack is **preserved dormant in the repo** (code +
   tests + a documented re-enable checklist) for a future sync release.
3. A stable, forward-compatible **Export/Import** backup guarantees users'
   downloaded files stay importable across all future app versions.
4. Users are clearly warned (in-app and on the landing) that clearing browser
   data or uninstalling erases progress.

## 1. Requirements & Constraints

- **REQ-001**: The landing hero gets two CTAs — primary "Install the app"
  (href `https://flowmd-04.web.app/?ref=install`) and secondary "Open in
  browser" (href `https://flowmd-04.web.app`); the nav keeps its single "Open
  the app" CTA.
- **REQ-002**: The shipped app must be fully functional with **no accounts and
  no Firebase network calls**; all progress persists in localStorage and works
  100% offline (hosting + PWA + service worker stay).
- **REQ-003**: Export files must remain importable across future app versions:
  a versioned envelope (`formatVersion`) plus import always routed through the
  existing schema-migration path.
- **REQ-004**: The complete sign-in/auth/sync stack (firebase.js, sync modules,
  sync unit tests, SDK tags, CSP entries) is preserved in the repo, dormant but
  verified, for future re-enabling — nothing deleted.
- **REQ-005**: Users are warned, on the landing and in the app, that clearing
  browser data or uninstalling the app erases progress.
- **REQ-006**: The landing promotes PWA install (install CTA + offline note).
- **SEC-001**: The shipped app makes zero Firebase/Google network requests;
  both the `index.html` meta CSP and the `firebase.json` header CSP are
  tightened to `'self'` (+ `data:` for fonts/images, `'unsafe-inline'` for
  styles only).
- **SEC-002**: Import validates the envelope (app name, `formatVersion`) and
  only accepts known `flowmd_*` keys; unknown/foreign/oversized payloads are
  rejected with a clear message; the current state is auto-backed-up before an
  overwrite.
- **SEC-003**: No analytics/tracking anywhere: the landing keeps
  `connect-src 'none'`, and the app no longer loads Firebase Analytics.
- **CON-001**: All changes stay uncommitted on branch `landing-page` until the
  owner approves the ship sequence (commit → push → PR → merge → deploy).
- **CON-002**: Dormant sync files must not be referenced by `index.html`, must
  not load, and must never fire network requests.
- **CON-003**: Hosting stays on Firebase — `flowmd-04.web.app` (app) and
  `flowmd-landing.web.app` (landing) remain the canonical URLs; "offline-only"
  changes the data layer, not hosting.
- **CON-004**: Copy must not overclaim: "Cloud sync — on the roadmap" is the
  honest framing; no promises about multi-device sync.
- **GUD-001**: Make the fewest changes that satisfy the requirements; reuse
  existing modules (toast, `state-store` migrations, `pwa-install.js`).
- **GUD-002**: Follow the repo's test conventions (plain node scripts with the
  `check()` helper; unit tests under `tests/unit/`).
- **GUD-003**: `verify-static` remains the build gate and is extended with the
  new checks (landing versioned refs, app CSP clean of Google/Firebase domains).
- **PAT-001**: Import reuses the existing migration path —
  `migrateStateSchema()` + `loadState()` — so old exports upgrade into future
  schemas automatically (same pattern as v2→v3→v4 storage migrations).
- **PAT-002**: Install messaging reuses the app's existing `pwa-install.js`
  (banner + iOS instructions); the landing only hands off via the CTA URL.

## 2. Implementation Steps

### Implementation Phase 1 — Landing: install CTAs, backup positioning, data warnings

- GOAL-001: Make the landing sell the offline product: install-first CTAs,
  "Export & backup" instead of "sync", honest device-local data warnings, and
  pre-launch asset-versioning hygiene.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | `landing/index.html` — hero gains two CTAs: primary `Install the app` → `https://flowmd-04.web.app/?ref=install`, secondary `Open in browser` → `https://flowmd-04.web.app` (reuse `.cta-open-app`/`.btn` styles; add `.hero-cta-secondary`). Keep nav CTA as-is. Update `tests/landing-smoke.mjs` to assert both hrefs. | ✅ | 2026-08-15 |
| TASK-002 | `landing/index.html` — replace the features block "Sync that doesn't fight" with "Export & backup" (copy: save your progress to a file, restore it on a new device — your data never leaves your device) and replace hero text panel 06 ("Sync that doesn't fight") with the same backup explanation. | ✅ | 2026-08-15 |
| TASK-003 | `landing/index.html` — add device-local data warnings: (a) a notice line in the beta section — "Your progress is stored on this device. Clearing browser data or uninstalling the app erases it — export a backup."; (b) a PWA note under the hero CTAs — "Install the app for full-screen, offline use."; (c) a roadmap line in the footer — "Cloud sync — on the roadmap." | ✅ | 2026-08-15 |
| TASK-004 | `landing/index.html` — FAQ updates: "Is my data safe?" → device-local storage + export/import; "Phone or laptop?" → no cloud sync yet, transfer via export/import; add "Will I lose my progress?" → yes if browser data is cleared or the app is uninstalled, so export a backup. | ✅ | 2026-08-15 |
| TASK-005 | `landing/index.html` + `scripts/bump-version.js` — add `?v=1` to the landing's `./style.css`, `./app.js`, and `./assets/favicon.svg` refs, and extend `bump-version.js` to also bump `?v=` in `landing/index.html` on every deploy (fixes the immutable-1-year stale-asset risk for returning visitors). | ✅ | 2026-08-15 |
| TASK-006 | `firebase.json` — add `landing/**` to the **app** site's `ignore` list so `flowmd-04.web.app/landing/...` stops double-serving the landing (canonical stays `flowmd-landing.web.app`). | ✅ | 2026-08-15 |
| TASK-007 | `scripts/verify-static.cjs` — extend `checkLanding()` to assert the landing's css/js refs carry a `?v=` and that the app site's ignore list contains `landing/**`. Also added `checkAppOfflineIsolation()` (app CSP + index.html carry zero Firebase/Google refs). | ✅ | 2026-08-15 |

### Implementation Phase 2 — App: mask sync, keep dormant

- GOAL-002: Stop the app from loading/using Firebase while preserving every
  sync/auth artifact (code, tests, CSP entries documented) in the repo for a
  future re-enable.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | `index.html` (app) — remove the 4 gstatic Firebase SDK `<script>` tags and the `<script>` tags for `firebase.js`, `js/core/sync.js`, and `js/features/sync.js`. The files themselves stay on disk, untouched (CON-002, REQ-004). Also removed the `manual-sync-btn` element and added `js/features/backup.js`. | ✅ | 2026-08-15 |
| TASK-009 | `app.js` — remove the `window.FlowMD.sync` destructure (`initFirebaseSync`, `manualSync`), the `initFirebaseSync()` call in `init()`, the `window.FirebaseSync.stateProvider` guard, and the `manual-sync-btn` click binding; keep the button element (never shown without auth) but stop wiring it. Verify no runtime reference to `window.FirebaseSync` or `window.FlowMD.sync` remains unguarded. | ✅ | 2026-08-15 |
| TASK-010 | `js/features/onboarding.js` — drop the sign-in step: 3-step wizard becomes 2 steps (study source → name/theme → summary); remove the `onboarding-signin` / `onboarding-skip-signin` buttons, the redirect round-trip persistence (`ONBOARDING_PENDING_KEY`), and renumber step indices. | ✅ | 2026-08-15 |
| TASK-011 | `js/features/views/profile.js` — remove the sign-in card (`#btn-signin-google`), sync status (`#sync-basic-status`), manual sync (`#btn-sync-now`), and the sync diagnostics panel; replace with a muted "Cloud sync — coming soon" line. | ✅ | 2026-08-15 |
| TASK-012 | `index.html` meta CSP + `firebase.json` header CSP — tighten: `script-src 'self'`; `connect-src 'self'`; drop `frame-src` entirely (removes `accounts.google.com`, `apis.google.com`, `flowmd-04.firebaseapp.com`); keep `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:`, `font-src 'self' data:`, `object-src 'none'`, `base-uri 'self'`, `worker-src 'self'` (SEC-001). Audit nothing external is still referenced (fonts already removed). | ✅ | 2026-08-15 |
| TASK-013 | `sw.js` — remove the `FIREBASE_SDKS` array, its install-time precache jobs, and the SDK network-first fetch branch; keep the rest of the precache list and cache behavior. Cache name bump happens automatically via `version:bump` on deploy. | ✅ | 2026-08-15 |
| TASK-014 | Preservation + re-enable docs — keep `firebase.js`, `js/core/sync.js`, `js/features/sync.js`, `tests/unit/sync-harness.mjs` and the sync unit tests untouched; add a "Re-enabling cloud sync" checklist (restore SDK tags, sync script tags, CSP entries, profile/onboarding UI, app.js wiring) to the plan addendum and a short note in `README.md` (REQ-004). | ✅ | 2026-08-15 |
| TASK-015 | Test audit — update `tests/modules.mjs` and `tests/smoke.mjs` (drop/guard FirebaseSync stubs) and `tests/onboarding.mjs` (2-step wizard) so the suite passes with sync masked; confirm the preserved sync unit tests still pass unchanged (they test pure helpers, not the app shell). Also updated `tests/offline.mjs` (CSP header + no-Firebase-precache assertions) and `tests/inline-styles` baseline. | ✅ | 2026-08-15 |

### Implementation Phase 3 — Export/Import (stable, forward-compatible)

- GOAL-003: Give users a durable backup that stays importable across all
  future app versions.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | `js/features/backup.js` (new) — `exportBackup()` collects every `flowmd_*` localStorage key and wraps them in a versioned envelope `{ app: "FlowMD", formatVersion: 1, exportedAt: <ISO>, appVersion: <APP_VERSION>, data: { <flowmd_* keys> } }`, then downloads `flowmd-backup-YYYY-MM-DD.json`. `importBackup(file)` parses + validates (app name must match, `formatVersion` must be an integer ≤ `MAX_SUPPORTED_FORMAT_VERSION`, keys must match known `flowmd_*` patterns, size cap), auto-exports the current state as a safety backup before overwriting, writes the keys, then calls `loadState()` so `migrateStateSchema()` upgrades old exports into the current schema (REQ-003, SEC-002, PAT-001). Header comment documents the stable format contract. | ✅ | 2026-08-15 |
| TASK-017 | `js/features/views/profile.js` — add a "Backup" card: Export button (triggers `exportBackup()`), Import button (hidden `<input type="file" accept="application/json">` → `importBackup()`), toast feedback via the existing toast module, last-export timestamp. | ✅ | 2026-08-15 |
| TASK-018 | `tests/backup.mjs` (new, in the npm test chain) — round-trip (export → import → identical localStorage), rejection of unknown/foreign keys, rejection of `formatVersion` > max with a clear message, and migration-on-import (an old-format envelope imports into the current schema through `loadState`). | ✅ | 2026-08-15 |

### Implementation Phase 4 — In-app data warnings

- GOAL-004: Warn users inside the app that progress is device-local.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-019 | `js/features/views/profile.js` — add a persistent (non-dismissible) data-safety card above Backup: "Your progress lives on this device. Clearing browser data or uninstalling the app erases it — export a backup." (REQ-005; the landing side is TASK-003.) | ✅ | 2026-08-15 |

### Implementation Phase 5 — Verification & launch

- GOAL-005: Prove the offline-only product and landing are correct, then ship.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-020 | Full verification — `npm test` (updated chain incl. `tests/backup.mjs`), `verify-static` (incl. TASK-007 checks), a manual offline pass (load app with network disabled, full flow from localStorage), backup round-trip in the browser, and a preview pass over the landing (dual CTAs, notices, FAQ, versioned assets). | ✅ | 2026-08-15 |
| TASK-021 | Ship — commit branch `landing-page`, push, open PR → `main`, merge; create the `flowmd-landing` hosting site in the `flowmd-04` project (CLI `firebase hosting:sites:create flowmd-landing` or console) BEFORE the deploy; run the deploy workflow; verify `flowmd-landing.web.app` (200, fresh copy with `?v=` refs) and `flowmd-04.web.app` (unchanged offline behavior). | |  |

## 3. Alternatives

- **ALT-001**: Delete the sync/auth stack entirely (firebase.js, sync modules,
  SDK tags, sync tests). Rejected — the owner wants the verified functionality
  preserved for a future sync release; deleting forfeits tested code.
- **ALT-002**: Hide sync behind a feature flag but keep it loaded. Rejected —
  that keeps Firebase network calls, API keys in the shipped app, and the wide
  CSP open; masking means unload, not flag.
- **ALT-003**: Move the dormant stack to `_archive/`. Rejected — it breaks the
  sync unit tests' imports and the re-enable checklist; keeping files in place
  (unloaded) is simpler and equally safe.
- **ALT-004**: Ship without Export/Import. Rejected — device loss or browser
  data clear would be unrecoverable with no cloud; the backup is the core
  mitigation (REQ-003).
- **ALT-005**: Make the landing itself installable (own manifest + SW). Rejected
  — it would install the brochure instead of the app and break the landing's
  SW-isolation guarantee (verify-static check).

## 4. Dependencies

- **DEP-001**: `firebase-tools` (existing devDependency) — create the
  `flowmd-landing` site and run deploys.
- **DEP-002**: Playwright + repo `.pw-browsers` (existing) — landing smoke and
  backup tests.
- **DEP-003**: `FIREBASE_TOKEN` GitHub Actions secret — deploy workflow (already
  configured).
- **DEP-004**: GitHub credentials (GCM) — push/PR/merge.
- **DEP-005**: The `flowmd-landing` hosting site must exist in the `flowmd-04`
  project before the first deploy of the landing target (RISK-001).

## 5. Files

- **FILE-001**: `landing/index.html` (modified) — dual hero CTAs, backup copy,
  notices, FAQ, `?v=` refs (TASK-001..TASK-005).
- **FILE-002**: `landing/style.css` (modified) — secondary hero CTA + notice
  styles (TASK-001, TASK-003).
- **FILE-003**: `index.html` (app, modified) — remove SDK + sync script tags,
  tighten meta CSP (TASK-008, TASK-012).
- **FILE-004**: `app.js` (modified) — remove sync wiring (TASK-009).
- **FILE-005**: `js/features/onboarding.js` (modified) — 2-step wizard (TASK-010).
- **FILE-006**: `js/features/views/profile.js` (modified) — remove sync UI, add
  Backup card + data-safety card (TASK-011, TASK-017, TASK-019).
- **FILE-007**: `js/features/backup.js` (new) — export/import module (TASK-016).
- **FILE-008**: `firebase.js`, `js/core/sync.js`, `js/features/sync.js`
  (unchanged, preserved dormant) — re-enable checklist target (TASK-014).
- **FILE-009**: `sw.js` (modified) — remove SDK precache + branch (TASK-013).
- **FILE-010**: `firebase.json` (modified) — header CSP tightening, `landing/**`
  app ignore (TASK-006, TASK-012).
- **FILE-011**: `scripts/bump-version.js` (modified) — bump landing `?v=` refs
  (TASK-005).
- **FILE-012**: `scripts/verify-static.cjs` (modified) — landing version + app
  CSP checks (TASK-007).
- **FILE-013**: `tests/backup.mjs` (new) + `tests/modules.mjs`, `tests/smoke.mjs`,
  `tests/onboarding.mjs` (modified) (TASK-015, TASK-018).
- **FILE-014**: `README.md`, `privacy.html` (modified) — copy sweep: sync →
  backup + roadmap, device-local data warning (TASK-003, TASK-014).

## 6. Testing

- **TEST-001**: `tests/landing-smoke.mjs` — dual CTA hrefs (`?ref=install` and
  bare app URL), 6 feature blocks (incl. "Export & backup"), notices present,
  FAQ content, versioned css/js refs (TASK-001..TASK-005).
- **TEST-002**: `tests/backup.mjs` — export/import round-trip, foreign-key
  rejection, formatVersion > max rejection, migration-on-import (TASK-018).
- **TEST-003**: Full `npm test` suite green with sync masked — updated
  modules/smoke/onboarding, preserved sync-harness unit tests still passing
  (TASK-015).
- **TEST-004**: `verify-static` — landing refs versioned, app CSP has no
  Google/Firebase domains, SW isolation intact (TASK-007, TASK-012).
- **TEST-005**: Manual offline pass — app boots and the full daily flow works
  with the network disabled (TASK-020).
- **TEST-006**: Production checks — `flowmd-landing.web.app` 200 with fresh
  `?v=` assets and new copy; `flowmd-04.web.app` unchanged offline behavior
  (TASK-021).

## 7. Risks & Assumptions

- **RISK-001**: The `flowmd-landing` site may not exist in the project, failing
  the deploy — create it before running the workflow (DEP-005, TASK-021).
- **RISK-002**: Any existing signed-in user's cloud data becomes unreachable
  once sync is unloaded — assume none exist yet (beta, sandbox-verified only);
  if the owner confirms real users, offer them a one-time export before launch.
- **RISK-003**: CSP tightening could break an external resource (fonts/images)
  — audit already shows Google Fonts removed and no external images; the
  verification pass re-checks (TASK-020).
- **RISK-004**: A malformed import could corrupt state — mitigated by envelope
  validation, known-key filtering, and auto-backup of current state before
  overwrite (SEC-002).
- **ASSUMPTION-001**: No real signed-in users with cloud data today.
- **ASSUMPTION-002**: The owner approves shipping the landing and the app
  changes together on the single `landing-page` branch.
- **ASSUMPTION-003**: Keeping the dormant `firebase.js` deployed as an inert
  file is acceptable — Firebase client API keys are public by design; security
  comes from Firestore rules and auth, which are unused.
- **ASSUMPTION-004**: No custom domain in v1 — canonical URLs stay
  `flowmd-04.web.app` and `flowmd-landing.web.app`.
- **ASSUMPTION-005**: Export/Import is in v1 scope (owner confirmed the backup
  must be stable and preserved across future updates).

## 8. Related Specifications / Further Reading

- [create-implementation-plan skill](../plan/feature-landing-page-1.md) — the
  existing landing build plan this plan supersedes/extends.
- [Firebase Hosting multi-site docs](https://firebase.google.com/docs/hosting/multisite) —
  second-site deployment (DEP-001).
- [FlowMD README.md](../README.md) — feature source of truth for copy.
- [FlowMD CHANGELOG.md](../CHANGELOG.md) — sync/sign-in history and the
  re-enable reference.

## 9. Implementation Addendum (2026-08-15)

Phase 1–4 and Phase 5 verification (TASK-020) are complete and green; only
TASK-021 (ship) remains. Decisions made during implementation, beyond the
original task text:

- **state-store decoupled from the dormant sync module.** `switchSource()`
  gated on `window.FlowMD.sync.EDITION_IDS`, which no longer exists once sync
  is unloaded — it now validates against `STUDY_SOURCES` (`available` only).
  `saveState()`'s history pruning (`pruneHistoryMaps`) fell back to an inline
  prune so retention keeps working without sync loaded. Both changes keep the
  dormant sync code 100% untouched while the app no longer depends on it.
- **Backup scene renamed.** The landing feature screenshot is now
  `mobile-backup.webp` (captured from the real Backup card), replacing the old
  `mobile-sync-status.webp`. `scripts/capture-scenes.cjs` scene `backup` stages
  a last-export timestamp and waits for `#btn-export-backup`.
- **`tests/offline.mjs` updated for the offline-first reality** — mirrors the
  tightened CSP and asserts the precache contains no Firebase SDKs (plus the
  shell itself is precached).
- **`tests/inline-styles` baseline** regenerated (171 entries) for the three
  new inline styles in the Profile data-safety/backup cards.
- **README + privacy.html rewritten** around device-local storage; README
  gained the "Re-enabling cloud sync" checklist (also noted in REQ-004).
- **`verify-static.cjs` gained `checkAppOfflineIsolation()`** — asserts both
  CSPs (meta + header) contain no Google/Firebase domains and `index.html`
  references no SDK/sync scripts (SEC-001 enforcement as a build gate).
