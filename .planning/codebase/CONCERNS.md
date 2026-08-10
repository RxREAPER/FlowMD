# Concerns & Risks

1. **Monolith fragility** — *Partially resolved (Task C4).* Pure logic now lives in
   unit-tested modules under `js/core/` (`state-store.js`, `source-data.js`, `sync.js`),
   and `app.js` consumes them via `window.FlowMD.*`. `app.js` is still a large UI/rendering
   file, but its testable logic is extracted.

2. **No testing** — *Resolved.* Unit tests cover the sync module (sanitize, merge,
   skew-safe arbitration, dirty tracking — `tests/unit/sync.test.mjs`), the store
   (`tests/unit/store.test.mjs`), and Firestore rules against the emulator
   (`tests/rules-test.mjs`). Playwright smoke + onboarding suites (60 checks) run in CI
   on every push and PR.

3. **State sync race conditions** — *Resolved (Task A2).* `saveState()` tracks dirty
   fields against a last-pushed baseline; the snapshot handler never pushes; writes are
   field-level `update()`s; merge arbitration is clock-skew-safe and sanitizes cloud
   data before touching state. The write-loop bug (devices with skewed clocks triggering
   unbounded full-document writes) is fixed.

4. **Expired data handling** — *Mitigated.* localStorage schema migrations exist
   (`migrateStateSchema`, v1→v2); corrupt JSON never crashes (`safeParse`); cloud
   documents are sanitized to known, well-typed fields (`sanitizeCloudState`) so legacy
   or junk fields can't corrupt state.

5. **Firebase compat SDK** — *Open (deliberate).* The `firebase` compat global is
   deprecated; migrating to modular v9+ is a large, low-urgency rewrite. Deferred.

6. **Cache invalidation** — *Resolved (Task C1).* `scripts/bump-version.js` auto-bumps
   `?v=` on every deploy AND the service-worker cache name (`CACHE_NAME`), so a deploy
   deterministically invalidates stale caches. Explicit `Cache-Control` headers:
   `no-cache` on `sw.js`/`index.html`, immutable on hashed assets.

7. **No error boundaries** — *Resolved (Phase 4 + Task C3).* `safeRender()` wraps every
   view; global `error`/`unhandledrejection` handlers report `app_error` events to
   Firebase Analytics.

8. **Long-lived deploy token** — *Deferred (Task B4 partially declined by user).* The
   workflow keeps the code-only improvements (CI on PRs, `npm ci`, unit tests, scoped
   cache-bump commit), but deploy auth still uses the `FIREBASE_TOKEN` secret because the
   Workload Identity Federation migration needs one-time Google Cloud console setup the
   user declined. Migrate later: create `firebase-deploy` service account + WIF
   pool/provider, replace `PROJECT_NUMBER`, delete the secret.

9. **No backups** — *Addressed (Task C2), deploy once.* Nightly managed Firestore export
   (`backup/functions`, Cloud Scheduler → Pub/Sub → export to `gs://flowmd-04-backups`).
   Restore runbook: `backup/RESTORE.md`.

10. **Firestore single-doc ceiling** — *Watch-item, not a blocker.* Every user's data is
    one `users/{uid}` document; worst case today (both sources' `completedVideos` union +
    long `dailyHistory`) is ~150 KB, well under the 1 MiB limit. Revisit a
    subcollection-sharding migration when Prepladder X (or another large source) ships.

11. **App Check / reCAPTCHA + API-key referrer restriction** — *Declined by user
    (2026-08-10).* Neither is implemented: the user didn't want reCAPTCHA on the app, and
    declined the console-only API-key referrer restriction. The B1 rules (auth + ownership
    on every operation) cover the abuse surface App Check would add; the web API key
    remains unrestricted in Google Cloud — revisit if key abuse ever appears.
