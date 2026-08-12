# Contributing to FlowMD

Thanks for wanting to help! This project is a solo-built PWA, so the conventions below keep it coherent and shippable.

## Quick start

```bash
npm ci
npm run dev            # local preview at http://localhost:8140
npm test               # full suite before any PR
```

## Conventions (please follow)

- **Vanilla JS, ES5-style IIFEs.** Every module is an IIFE that registers on `window.FlowMD.*` — no imports, no bundler, no classes, no arrow-only code. The CSP forbids `eval`/bundler output, so plain scripts in load order are the architecture.
- **No inline event handlers in `index.html`.** Bind via `addEventListener` (or the module's own wiring). Inline handlers violate the CSP `script-src`.
- **Escape all user input.** Use `escapeHtml()` / `escapeAttr()` from `js/core/constants.js` (on `window.FlowMD.constants`) before interpolating anything user-derived into a template string. No exceptions.
- **Do not relax the CSP** (in `firebase.json` headers or the `index.html` meta) without a documented reason in the PR.
- **Firestore sync is local-wins-on-conflict and write-quiescent.** Never change `mergeCloudPerField`'s clock arbitration to last-write-wins (it destroys offline completions), and never make a sync round write fields it didn't change — the zero-write settle assertions in `tests/unit/` are load-bearing.
- **Keep `firebase.json`'s hosting `ignore` list complete.** Any new non-runtime file (docs, scripts, backups) must be added there too, or it gets deployed to the live site.
- **Cache-bust new UI**: bump the version with `npm run version:bump` when you change runtime files (the deploy workflow does this automatically).
- **Per-edition state**: user data lives in `state.editions[<sourceId>]`; top-level fields are only the live working copy of the active edition. Keep it that way.

## Testing expectations

- `npm test` must pass locally before you open a PR. The suite covers module registration, metrics/queue behavior, onboarding, navigation, rendering, inline styles, scope leaks, migration, and the sync engines (unit + Playwright).
- Sync changes need a test in `tests/unit/` — the two-device harness (`sync-harness.mjs`) runs the REAL sync modules against an in-memory Firestore mock, so new behavior should come with a scenario there (including a zero-write settle assertion where applicable).
- UI changes: the Playwright suites (`tests/smoke.mjs`, `tests/navigation.mjs`, `tests/onboarding.mjs`) must stay green with **zero console errors**.

## PR checklist

- [ ] `npm test` green (full suite)
- [ ] No console errors in the browser suites
- [ ] No new CSP violations (no inline handlers, no `unsafe-eval`)
- [ ] All user input escaped
- [ ] New non-runtime files added to the `firebase.json` ignore list
- [ ] CHANGELOG.md updated (one line per change is enough)
- [ ] `?v=` cache-busting bumped if runtime files changed (or leave to the deploy workflow)

## Commit style

Conventional commits: `feat(scope): …`, `fix(scope): …`, `docs(scope): …`, `test(scope): …`. Use the scope to name the area (`quest`, `sync`, `state`, `analytics`, …). Explain the *why* in the body.

## Deploying

Deploys are manual and gated: push to `main`, then run the **"FlowMD CI / Deploy"** workflow from the Actions tab (it tests, bumps the version, and deploys hosting + Firestore rules). Never deploy hosting alone — rules and hosting ship together.
