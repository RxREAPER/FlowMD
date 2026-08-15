---
goal: Build and deploy a TimyLabs-formatted landing page for FlowMD (developer info, software overview, feature showcases, seamless handoff into the app) as a second Firebase Hosting site.
version: 2.0
date_created: 2026-08-14
last_updated: 2026-08-14
owner: Mohammed Safi
status: 'Planned'
tags: feature, design, infrastructure, landing-page, hosting
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

FlowMD is a vanilla-JS, offline-first PWA study planner for NEET-PG (dual-track Plan A/B, daily quest batches, per-edition Marrow 8 / 6.5 workspaces, Firebase sync, modern dark UI). It currently has zero discoverability: the deployed site *is* the app shell. This plan builds a standalone marketing landing page at a second Firebase Hosting site (`flowmd-landing.web.app`), formatted and detailed like the TimyLabs landing page (scene-carousel hero, one-line headings + scene images per feature, calm short copy, FAQ, lean footer), presenting the developer, the software, and its features with real captured screenshots of the app, and handing off seamlessly into the app via an "Open the app" CTA. The landing is static vanilla HTML/CSS/JS (no build step), uses the app's current modern dark visual identity, is deployed only through the existing GitHub Actions CI pipeline, and must not touch the app shell, its service worker, or its hosting rewrite rules.

## 1. Requirements & Constraints

- **REQ-001**: Landing site reachable at `https://flowmd-landing.web.app` (second Firebase Hosting site in project `flowmd-04`); the app site `flowmd-04.web.app` must remain unchanged.
- **REQ-002**: Hero section with a rotating carousel of real app scene images: 12 desktop scenes (1672×941 WebP) plus 9 mobile scenes (390×844 WebP), auto-advance (6s), manual prev/next + dot controls, keyboard accessible, touch-swipe on mobile.
- **REQ-003**: Six feature sections, each consisting of a heading (≤60 chars), one supporting line (≤140 chars), and a scene image showing that feature inside the real app.
- **REQ-004**: "About the developer" section containing a short bio, the build journey, and a link to `https://github.com/mohammedsafi0414`.
- **REQ-005**: Beta-framing section with a "Report a bug" CTA linking to `https://github.com/mohammedsafi0414/FlowMD/issues/new` and a "What's New" link to the repo `CHANGELOG.md`.
- **REQ-006**: FAQ section ("What is this?") with 6 questions/answers implemented as `<details>`/`<summary>` elements.
- **REQ-007**: Primary CTA "Open the app" linking to `https://flowmd-04.web.app`, with visual tokens identical to the app shell (same background and accent) for a seamless landing-to-app handoff.
- **REQ-008**: OG + Twitter card meta tags referencing a 1200×630 image at `landing/assets/og-image.png`, generated from a real app scene capture.
- **REQ-009**: Responsive layout verified at 1440, 900, 768, and 390 px widths; mobile nav toggle; carousel swipe support.
- **REQ-010**: Semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `footer`); WCAG AA: visible focus indicators, `alt` text on every scene image, text contrast ≥ 4.5:1.
- **SEC-001**: No Firebase credentials or API keys in landing source; the landing never initializes Firebase, it only links out to the app.
- **SEC-002**: CSP meta tag on the landing: `default-src 'self'; img-src 'self' https: data:; style-src 'self'; script-src 'self'; connect-src 'none'; base-uri 'self'; form-action 'self'`; no inline `<script>` or `<style>` in `landing/index.html`. Framing protection comes from the `X-Frame-Options: DENY` header in the hosting config (TASK-011), because `frame-ancestors` is ignored when delivered via a `<meta>` element (verified: Chromium console warning).
- **SEC-003**: All external links use `rel="noopener noreferrer"`; no third-party analytics or tracking scripts in v1.
- **CON-001**: No build step, no framework, no bundler — plain HTML/CSS/JS, consistent with the repo's tech stack (README Tech Stack).
- **CON-002**: No Google Fonts or external font downloads (the repo removed all Google Fonts on 2026-08-12, CHANGELOG v212); landing uses system font stacks only.
- **CON-003**: The landing must not be precached by the app's `sw.js` and must not register its own service worker; the app's `index.html`, hosting rewrite rules, and cache-version mechanism are untouched.
- **CON-004**: Copy may only claim features that exist in the shipped app; source of truth is `README.md` ("What is FlowMD?" bullets) and `CHANGELOG.md`. Scenes must be real captures of the real app — no doctored or invented screenshots.
- **CON-005**: Deployment only through the existing `.github/workflows/deploy.yml` (uses the `FIREBASE_TOKEN` secret); no manual deploys.
- **CON-006**: Visual identity is the current modern dark theme only: background `#0b0f19`, surface `#111827`, accent gradient `#6c3baa` → `#8b5cf6`, success `#10b981`, text `#f8fafc` / `#94a3b8` / `#64748b`. No retro/pixel theme references anywhere (the retro theme was removed from the app on 2026-08-12, CHANGELOG v212).
- **GUD-001**: Copy voice: calm, short sentences, zero hype and zero exclamation marks; each section is one heading + one line + a scene image (TimyLabs formatting pattern).
- **GUD-002**: Section order: nav → hero → features (6) → beta/feedback → about developer → FAQ → footer.
- **GUD-003**: Landing initial payload (HTML + CSS + JS, excluding scene images) ≤ 250 KB.
- **GUD-004**: Scene images use `loading="lazy"` (except the hero's first slide) and explicit `width`/`height` attributes to prevent layout shift; WebP `quality: 82`.
- **GUD-005**: Landing cache policy: `index.html` `Cache-Control: no-cache`; `/assets/*` `Cache-Control: public, max-age=31536000, immutable`.
- **PAT-001**: TimyLabs scene-carousel pattern — the hero is a rotating gallery of real staged product screenshots (one scene per slide with a short caption), not a mockup or illustration.
- **PAT-002**: Firebase Hosting multi-site targets pattern — `.firebaserc` maps targets `app → flowmd-04` and `landing → flowmd-landing`; `firebase.json` `hosting` becomes a two-element array whose elements carry `target: "app"` (existing app config, plus the target key) and `target: "landing"` (serves `landing/`). Per the official Firebase multi-site docs, deploy targets on every element is the recommended pattern; `--only hosting` deploys all sites.
- **PAT-003**: Existing static-check pattern — `scripts/verify-static.cjs` is extended to also verify landing assets and scene references, mirroring how it already checks the app.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Produce real, staged app screenshots (12 desktop + 9 mobile scenes) and the OG image by capturing the running app with seeded demo state.

Completion criteria: `scripts/scene-state.js` and `scripts/capture-scenes.cjs` exist; running the capture against the dev server on port 8140 writes 21 scene WebP files and `landing/assets/og-image.png`; every capture asserts its anchor selector exists or the script exits non-zero.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create `scripts/scene-state.js` exporting `buildDemoState()`, returning a deterministic demo-state object satisfying the STORAGE_KEYS in `js/core/constants.js` (lines 55–78): `flowmd_editions_v4` with `marrow_8` and `marrow_6_5` partitions each containing `plans_v2` (Plan A `targetSubject: 'medicine'`, `targetDate` = execution date + 120 days, `videosPerDay: 12`; Plan B `targetSubject: 'surgery'`, `targetDate` = execution date + 150 days, `videosPerDay: 8`), `flowmd_personal` (`doctorName: 'Dr. Priya'`), `flowmd_streak` = 21, `flowmd_daily_history_by_subject` covering the last 30 days, `flowmd_completed_videos` with ≥ 12 video IDs in medicine and surgery, `flowmd_theme` = `dark`. All dates computed relative to the execution date via the repo's `todayKey`/`toLocalDateKey` helpers — no hardcoded dates. | |  |
| TASK-002 | Create `scripts/capture-scenes.cjs` (Node script using the repo's Playwright devDependency, following `tests/smoke.mjs` conventions). Behavior: (a) spawn `node serve.cjs 8140` (or reuse a listener already on 8140); (b) open Chromium at `http://127.0.0.1:8140/`, `page.addInitScript` writes `buildDemoState()` into localStorage before app scripts run; (c) execute the SHOT_LIST below (navigate via `.android-nav-item[data-view="..."]` bottom nav, verify each anchor with `page.locator(anchor).waitFor()`, scroll into view, `page.waitForTimeout(600)` for transitions, screenshot full viewport 1672×941 desktop and 390×844 with `deviceScaleFactor: 2` mobile, WebP `quality: 82`); (d) write every shot into `landing/assets/scenes/`; (e) if any anchor times out, print the failing scene + selector and `process.exit(1)`. SHOT_LIST (12 desktop): `dashboard-overview` — nav `[data-view="dashboard"]`, anchor `.fm-feature-card-title` (feature cards) visible; `daily-quests` — same view, anchor `.queue-chk` count ≥ 3, then click the first 3 `.queue-chk` and wait 400 ms (checked-quest state); `plan-a-pacing` — scroll `#study-plan-config` into view, anchor `.plan-config-pace-input` visible, assert `#input-videos-per-week` value === `'84'` (12/day × 7); `plan-b-pacing` — click the "Plan B" tab inside `#study-plan-config`, anchor `#input-videos-per-week` value === `'56'` (8/day × 7); `analytics` — nav `[data-view="analytics"]`, anchor `.chart-card` count ≥ 2; `curriculum-marrow8` — nav `[data-view="curriculum"]`, anchors `.curriculum-legend` and `.curriculum-sub-row[data-subject-id]` count ≥ 1; `subject-detail` — click `.curriculum-sub-row[data-subject-id="medicine"]`, anchor `.bulk-chapter-checkbox` count ≥ 1; `profile` — nav `[data-view="profile"]`, anchor `#prof-doc-name`; `edition-marrow65` — on profile click `#btn-change-source`, wait `#source-settings-modal` visible, click `.onboarding-option[data-source="marrow_6_5"]`, click `#scs-save`, wait `#topbar-source-badge` text contains `6.5`, nav `[data-view="curriculum"]`, anchor `.curriculum-legend`; `onboarding` — new browser context with cleared localStorage (no seed), reload, anchor `.onboarding-option[data-source="marrow_8"]` (wizard step 0); `sync-status` — nav `[data-view="profile"]`, anchor `#sync-basic-status` and `#btn-sync-now` visible; `bulk-completion` — subject-detail of medicine, click 2 `.bulk-chapter-checkbox` items, anchor `.bulk-chapter-checkbox:checked` count ≥ 2. Mobile SHOT_LIST (9): `dashboard-overview`, `daily-quests`, `plan-a-pacing`, `analytics`, `curriculum-marrow8`, `subject-detail`, `profile`, `onboarding`, `sync-status`. | |  |
| TASK-003 | Run the capture: `cd <repo root> && node scripts/capture-scenes.cjs` (set `PLAYWRIGHT_BROWSERS_PATH` to the repo's `.pw-browsers` as the earlier local test runs did). Verify 21 WebP files under `landing/assets/scenes/` (12 `desktop-*.webp`, 9 `mobile-*.webp`) plus `landing/assets/og-image.png`; spot-check the `dashboard-overview`, `analytics`, and `onboarding` scenes in the Freebuff preview (register the dev server, screenshot at 1440×900) to confirm the staged state looks full and realistic; re-run any failed scenes until all 22 files exist with non-trivial size (> 50 KB each). | |  |
| TASK-004 | Add an `og-image` shot to `scripts/capture-scenes.cjs`: capture the `dashboard-overview` scene at a 1200×630 viewport and write `landing/assets/og-image.png` (PNG, no transparency). Run it once to produce the file; this satisfies REQ-008. | |  |

### Implementation Phase 2

- GOAL-002: Implement the static landing page in `landing/` per REQ-001–REQ-010, SEC-001–SEC-003, CON-001–CON-006, and GUD-001–GUD-004, driven by a smoke test written first (TDD).

Completion criteria: `tests/landing-smoke.mjs`, `landing/index.html`, `landing/style.css`, and `landing/app.js` exist; `landing/index.html` contains the SEC-002 CSP meta and no inline script/style; `node tests/landing-smoke.mjs` passes; every referenced scene file exists (TEST-002).

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Create `tests/landing-smoke.mjs` (red) — plain node script mirroring `tests/smoke.mjs` conventions (own static server via `node:http` serving the repo root, `chromium.launch()` from Playwright, `check(name, ok, detail)` helper, exit non-zero on any failure). It serves the repo root and visits `http://127.0.0.1:<port>/landing/index.html`. Assertions: page `title` === `FlowMD — NEET-PG Study Planner`; meta description present; CSP meta present (`meta[http-equiv="Content-Security-Policy"]`); every `img` with `src` containing `/assets/scenes/` resolves to HTTP 200 (listen on `page.on('response')`); `#hero-carousel .hero-slide` count ≥ 9 and clicking `#hero-next` changes the active slide class; `#features` contains exactly 6 blocks (`.feature-block`); `#faq details` count === 6 and the first `details` opens on `summary` click; primary CTA `a.cta-open-app` href === `https://flowmd-04.web.app`; zero `console.error` events; no `navigator.serviceWorker.register` call observed. Run `node tests/landing-smoke.mjs` — expected FAIL (404 on `/landing/index.html`). Do not proceed to TASK-006 until it fails for the right reason. | |  |
| TASK-006 | Create `landing/index.html` — complete semantic structure in GUD-002 order. `<head>`: `<!doctype html>`, `<html lang="en">`, charset, viewport, `<title>FlowMD — NEET-PG Study Planner</title>`, meta description (≤160 chars derived from README "What is FlowMD?"), canonical `https://flowmd-landing.web.app/`, OG/Twitter meta per REQ-008, CSP meta per SEC-002, favicon link `./assets/favicon.svg`. Body: `<nav>` (logo "FlowMD", links Features / About / FAQ, CTA `a.cta-open-app` "Open the app"); `<main>` with hero `<section id="hero">` (h1, sub, CTA `a.cta-open-app` → `https://flowmd-04.web.app`, `<div id="hero-carousel">` with `<figure class="hero-slide">` elements, prev `#hero-prev` / next `#hero-next` buttons, dot list, `aria-live="polite"` region); `<section id="features">` with 6 `.feature-block` elements (each: `h2`, `p`, `<figure><img loading="lazy" width="1672" height="941">`); `<section id="beta">` (banner + "Report a bug" link + "What's New" → `CHANGELOG.md`); `<section id="about">` (bio per TASK-009); `<section id="faq">` (6 `<details>`/`<summary>` per TASK-009); `<footer>` (GitHub, license MIT, privacy note). All asset URLs relative (`./assets/...`). Class names used by the test (`hero-slide`, `feature-block`, `cta-open-app`, `#hero-prev`, `#hero-next`) must match TASK-005 exactly. | |  |
| TASK-007 | Create `landing/style.css` — `:root` custom properties mirroring CON-006: `--bg: #0b0f19; --surface: #111827; --surface-hover: #1f2937; --border: #1f293d; --accent: #6c3baa; --accent-hover: #5a2f8e; --accent-grad: linear-gradient(135deg, #6c3baa, #8b5cf6); --success: #10b981; --text: #f8fafc; --text-2: #94a3b8; --text-3: #64748b; --radius: 12px;`; font stack `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` (CON-002); `.hero-slide` crossfade via opacity + `transition: opacity 700ms` (inactive slides `opacity: 0; position: absolute; pointer-events: none`); `.hero-slide.active` `opacity: 1`; feature `.feature-block` alternating two-column grid at ≥ 900 px (`grid-template-columns: 1fr 1fr`), stacked below; responsive breakpoints 1024 / 900 / 768 / 390 px; `@media (prefers-reduced-motion: reduce)` disables transitions; `:focus-visible` outline ≥ 2px `#8b5cf6`; zero external requests (no `@import`, no remote `url()`). | |  |
| TASK-008 | Create `landing/app.js` — single IIFE, ~150 lines, no dependencies, loaded via `<script src="./app.js">` (SEC-002). Carousel: `let current = 0`; `show(i)` toggles `.active` on `.hero-slide` at index `i` (wrap modulo slide count) and updates dot `aria-current`; auto-advance `setInterval` 6000 ms; clear on `mouseenter`/`focusin` of `#hero-carousel`, restart on `mouseleave`/`focusout`; `#hero-prev`/`#hero-next` click handlers; dot click handlers; `keydown` ArrowLeft/ArrowRight when `#hero-carousel` contains the active element; touch swipe via `touchstart`/`touchend` deltaX > 40 px. Mobile nav toggle (toggles `aria-expanded` on the nav button, toggles `.open` on the nav menu). FAQ is native `<details>` — no JS. Guard every feature with feature detection; no `console.error` output paths. | |  |
| TASK-009 | Finalize copy and write it verbatim into `landing/index.html`. Hero: h1 `A NEET-PG planner that keeps you on track.` sub `Run two subjects at once, finish daily quests, and know exactly where you stand — online or off.` Six feature blocks (heading / one-liner, sourced from README "What is FlowMD?"): (1) `Dual-track plans` / `Run Plan A and Plan B in parallel, each with its own pace, deadline, and scope.`; (2) `Daily quests` / `Every morning the app picks today's batch from your plan. Tick them off, hit your target, unlock extra videos.`; (3) `Per-edition workspaces` / `Marrow 8 and 6.5 are fully separate — plans, quests, analytics, completions.`; (4) `Offline-first PWA` / `Installs to your home screen, precaches the syllabus, works with no signal.`; (5) `Sync that doesn't fight` / `Two devices editing at once converge without clobbering each other.`; (6) `Analytics that re-derive your pace` / `7/30-day charts, syllabus mastery, deadline countdown, ETA math from real progress.` About-developer default bio (owner edits in PR review if desired): `Built by a doctor-in-training who got tired of spreadsheet planning. FlowMD started as a personal tracker and grew into the app you see today.` FAQ (6, each Q ≤ 80 chars, A ≤ 200 chars): (1) `Is FlowMD free?` / `Yes. Free forever, no ads, no premium tier.`; (2) `Does it need a Marrow subscription?` / `No. It plans your Marrow 8 or 6.5 syllabus; a Marrow subscription is not required to use it.`; (3) `Does it work offline?` / `Yes — install it as a PWA and the whole syllabus works without a signal. Completions sync later.`; (4) `Phone or laptop?` / `Both. The same daily quest batch appears on every device, even brand-new ones.`; (5) `Is my data safe?` / `It lives on your device first. Optional Google sign-in backs it up and syncs it across devices.`; (6) `How do I report a bug?` / `Open the app, tap Report a bug, or file an issue on GitHub — fixes ship weekly during beta.` | |  |

### Implementation Phase 3

- GOAL-003: Wire the landing into Firebase Hosting as a second site and deploy it through the existing CI pipeline.

Completion criteria: `.firebaserc` declares a `hosting.landing` target; `firebase.json` `hosting` is an array whose first element is byte-identical to today's app config and whose second element serves `landing/`; the CI test step runs `tests/landing-smoke.mjs`; `scripts/verify-static.cjs` covers landing assets and `sw.js` isolation; the existing `npm test` suite still passes.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-010 | Modify `.firebaserc` (currently `{ "projects": { "default": "flowmd-04" } }`) — add `"targets": { "flowmd-04": { "hosting": { "app": ["flowmd-04"], "landing": ["flowmd-landing"] } } }`; preserve the existing `projects.default` value exactly (PAT-002). | |  |
| TASK-011 | Modify `firebase.json` — convert the top-level `hosting` object into a two-element array. Element 0: the existing app config unchanged, plus `"target": "app"` added as the first key (targets are the officially recommended multi-site pattern; `--only hosting` then deploys both sites). Element 1 (new): `{ "target": "landing", "public": "landing", "cleanUrls": true, "headers": [ { "source": "**/*.@(png|webp|svg|css|js)", "headers": [ { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" } ] }, { "source": "**", "headers": [ { "key": "Cache-Control", "value": "no-cache" }, { "key": "X-Content-Type-Options", "value": "nosniff" }, { "key": "X-Frame-Options", "value": "DENY" }, { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" } ] } ] }`. Do not change any other key in the file. | |  |
| TASK-012 | Modify `.github/workflows/deploy.yml` and `package.json`. (a) In `deploy.yml` test job step `Run tests` (currently `node tests/smoke.mjs && node tests/onboarding.mjs && node --test tests/unit/*.test.mjs`), append `&& node tests/landing-smoke.mjs`. (b) Leave the deploy job's `Deploy to Firebase` step unchanged: `npx firebase-tools deploy --only hosting,firestore:rules --token "${{ secrets.FIREBASE_TOKEN }}"` — once `hosting` is an array (TASK-011), `--only hosting` deploys **all** sites in the config, so the app site and the landing deploy together with no command change. (c) In `package.json`, append `&& node tests/landing-smoke.mjs` to the `test` script chain (after `tests/scope-leaks.mjs`, before the `node --test` unit glob). | |  |
| TASK-013 | Extend `scripts/verify-static.cjs` (PAT-003) with a `checkLanding()` function called before the final summary: (a) read `landing/index.html`, collect `src`/`href` refs, resolve each `./assets/...` ref against the `landing/` directory (NOT the repo root — the existing `collectRefs` resolves against root, so this needs its own resolution), exit 1 listing any missing file; (b) assert the SEC-002 CSP meta tag (`<meta http-equiv="Content-Security-Policy"`) exists; (c) assert no inline script/style via `/<\s*script(?![^>]*\bsrc=)/i` and `/<\s*style(?![^>]*\bsrc=)/i` — exit 1 if either matches; (d) read `sw.js` and fail if any precache entry contains `landing` (enforces CON-003); (e) fail if any string `serviceWorker.register` appears in `landing/index.html` or `landing/app.js`. | |  |

### Implementation Phase 4

- GOAL-004: Validate the landing locally, preview it in the desktop app, then ship via PR + existing CI and verify production.

Completion criteria: full `npm test` green (including the new landing smoke); preview pass completed at 1440 and 390 px; PR merged after CI green; deploy workflow green; `https://flowmd-landing.web.app` returns 200 with the GUD-005 headers; `https://flowmd-04.web.app` returns 200 unchanged.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-014 | Run local verification: (a) `cd <repo root> && PLAYWRIGHT_BROWSERS_PATH=<repo>/.pw-browsers npm test` — the full existing chain (modules, metrics, smoke, onboarding, navigation, migration, offline, render, inline-styles, scope-leaks, unit) must stay green plus the new `tests/landing-smoke.mjs`; (b) if the smoke suite fails, fix the failing assertion in the landing files (TASK-006/TASK-007/TASK-008) and re-run until green. Record both results in the PR description. | |  |
| TASK-015 | Preview pass in the Freebuff desktop app: register `node serve.cjs` (port 8140) in the preview pane, navigate to `http://127.0.0.1:8140/landing/index.html` at 1440×900 and 390×844 (mobile emulation); visually verify hero carousel rotation, feature blocks, FAQ toggles, footer, keyboard focus; verify the primary CTA loads `https://flowmd-04.web.app` and the app's onboarding renders in the new tab; fix any layout, contrast, or interaction issues found (TEST-006). | |  |
| TASK-016 | Ship: open PR `landing-page` → `main` using the same GitHub credential path as the earlier `preview-config` deploy (GCM account `mohammedsafi0414`), merge after CI is green, trigger the `FlowMD CI / Deploy` workflow on `main`, then verify production: `curl -sI https://flowmd-landing.web.app/` → HTTP 200 with `Cache-Control: no-cache` on HTML and `immutable` on `/assets/*` (TEST-005); `curl -sI https://flowmd-04.web.app/` → HTTP 200 unchanged; open the landing in a browser and click through to the app. | |  |

## 3. Alternatives

- **ALT-001**: Host the landing on the app site (`landing.html` plus a rewrite in the existing hosting config). Rejected: the app's `** → /index.html` rewrite, strict CSP, `?v=` cache-busting, and service-worker precache would fight the marketing page; a separate site also leaves room for a custom domain later (CON-003).
- **ALT-002**: Third-party landing builder (Framer / Webflow). Rejected: a separate paid stack with no repo provenance, cannot run the in-repo scene-capture pipeline, and violates CON-001.
- **ALT-003**: Illustrated or doctored mockups instead of real captures. Rejected: real captures are the TimyLabs pattern (PAT-001) and the requirement (CON-004, REQ-002); real scenes also double as the OG image and future demo assets.
- **ALT-004**: Ship the live `?demo=1` in-app demo iframe in v1. Deferred: it requires app changes (boot flag + seed state) and delays the landing; the scene carousel already delivers try-before-install for v1. Tracked as a follow-up feature plan.
- **ALT-005**: Retro/pixel visual language on the landing. Rejected by product decision: the retro theme was removed from the app on 2026-08-12 (CHANGELOG v212); the landing matches the current modern dark identity per CON-006.

## 4. Dependencies

- **DEP-001**: Node.js + npm + Playwright with Chromium — already present in the repo (`package.json` devDependency, local `.pw-browsers` install); CI already installs them in the existing workflow.
- **DEP-002**: Firebase CLI and the `FIREBASE_TOKEN` secret — already used by the existing deploy workflow; the `flowmd-landing` site must exist in project `flowmd-04` before deploy (create once via `firebase hosting:sites:create flowmd-landing` or the Firebase console) — see RISK-001.
- **DEP-003**: GitHub credentials for opening/merging the PR — available locally from the earlier `preview-config` deploy (GCM account `mohammedsafi0414`).
- **DEP-004**: The app boots standalone without Firebase — verified in planning; `firebase.js` guards all Firebase use behind `typeof firebase !== 'undefined'`.
- **DEP-005**: The existing CI flow (`.github/workflows/deploy.yml`, "FlowMD CI / Deploy") as the only deploy path per CON-005.

## 5. Files

- **FILE-001**: `landing/index.html` (new) — landing markup, meta, CSP, copy (TASK-006, TASK-009)
- **FILE-002**: `landing/style.css` (new) — design tokens + layout (TASK-007)
- **FILE-003**: `landing/app.js` (new) — carousel + mobile nav (TASK-008)
- **FILE-004**: `landing/assets/scenes/*.webp` (new, generated) — 12 `desktop-*.webp` + 9 `mobile-*.webp` captures (TASK-002, TASK-003)
- **FILE-005**: `landing/assets/og-image.png` (new, generated) — 1200×630 OG image (TASK-004)
- **FILE-006**: `landing/assets/favicon.svg` (new) — copy of the repo's `icon.svg` (TASK-006)
- **FILE-007**: `scripts/scene-state.js` (new) — deterministic demo-state builder (TASK-001)
- **FILE-008**: `scripts/capture-scenes.cjs` (new) — Playwright capture pipeline (TASK-002, TASK-003, TASK-004)
- **FILE-009**: `.firebaserc` (modified) — hosting target `landing` → `flowmd-landing` (TASK-010)
- **FILE-010**: `firebase.json` (modified) — `hosting` object converted to a two-element array (TASK-011)
- **FILE-011**: `.github/workflows/deploy.yml` (modified) — CI test step runs `tests/landing-smoke.mjs` (TASK-012)
- **FILE-012**: `scripts/verify-static.cjs` (modified) — `checkLanding()` + `sw.js` isolation checks (TASK-013)
- **FILE-013**: `tests/landing-smoke.mjs` (new) — landing smoke suite, written first (TASK-005, TASK-014)
- **FILE-014**: `package.json` (modified) — `test` script chain includes `tests/landing-smoke.mjs` (TASK-012)

## 6. Testing

- **TEST-001**: `tests/landing-smoke.mjs` — title, description, CSP meta, scene HTTP 200s, carousel slide count + next/prev, 6 feature blocks, 6 FAQs + toggle, CTA href, zero console errors, no SW registration (TASK-005, TASK-014).
- **TEST-002**: `checkLanding()` in `scripts/verify-static.cjs` — every scene referenced in `landing/index.html` exists; CSP meta present; no inline script/style (TASK-013).
- **TEST-003**: `sw.js` isolation check — no `landing` path in the precache list; no `serviceWorker.register` in landing files (TASK-013).
- **TEST-004**: App regression — full existing `npm test` suite passes unchanged, run with the new landing smoke in the chain (TASK-014).
- **TEST-005**: Production header check — `curl -sI` on `https://flowmd-landing.web.app/` (200, `no-cache` HTML, `immutable` assets) and `https://flowmd-04.web.app/` (200 unchanged) (TASK-016).
- **TEST-006**: Accessibility pass — keyboard carousel navigation, `:focus-visible` styles, `alt` text present, contrast ≥ 4.5:1, verified in the preview pass (TASK-015).

## 7. Risks & Assumptions

- **RISK-001**: The `flowmd-landing` site may not exist in the Firebase project, which would fail the deploy step (and, once `hosting` is an array, would fail the app deploy too) — mitigate by creating it up front (`firebase hosting:sites:create flowmd-landing` or console, DEP-002) BEFORE merging the PR; if no permission, the PR stays unmerged until resolved.
- **RISK-002**: Scene capture depends on app view selectors; a view refactor would break anchors — mitigated because the capture script exits non-zero instead of emitting broken scenes (TASK-002), and anchors are pinned to selectors verified against `js/features/views/*.js` in this plan.
- **RISK-003**: Landing payload growth from scene images — mitigated by GUD-004 lazy loading and WebP quality 82; estimated ~150 KB per desktop scene, 12 scenes acceptable.
- **ASSUMPTION-001**: Node ≥ 20 is available locally and in CI — already proven by the existing workflow.
- **ASSUMPTION-002**: The owner approves the PR → merge → deploy flow, matching the earlier `preview-config` deploy pattern.
- **ASSUMPTION-003**: The about-developer default bio (TASK-009) is acceptable for v1; the owner may edit it during PR review.
- **ASSUMPTION-004**: No custom domain in scope for v1; the landing lives at `flowmd-landing.web.app`.
- **ASSUMPTION-005**: The landing is static marketing content; no analytics and no personal-data collection in v1 (SEC-003).

## 8. Related Specifications / Further Reading

- [FlowMD README.md](../README.md) — feature source of truth for copy (CON-004)
- [FlowMD CHANGELOG.md](../CHANGELOG.md) — what's-new content; v212 retro removal; Google-Fonts removal (CON-002, CON-006)
- [.planning/PROJECT.md](../.planning/PROJECT.md) and [.planning/ROADMAP.md](../.planning/ROADMAP.md) — product context
- [TimyLabs landing page](https://timylabs.com/) — formatting/content reference (PAT-001, GUD-001)
- [Firebase Hosting multi-site documentation](https://firebase.google.com/docs/hosting/multisite) — PAT-002, DEP-002

## 9. Addendum — Post-build changes (implementation review)

**Live demo removed:** the embedded live-demo section (originally suggested as
the "try before install" shake-up) was built and then removed at the owner's
request — the app is free with no sign-up barrier, so a live preview adds
friction without converting anyone. All demo machinery was reverted: `js/demo.js`
deleted, the `?demo=1` gates in `firebase.js`/`app.js` and their `index.html`
script tags removed, the landing demo section + CSP `frame-src` removed, and
`tests/landing-smoke.mjs` returned to its pre-demo checks. The seeded capture
pipeline (`scripts/scene-state.js` + `scripts/capture-scenes.cjs`) is
unaffected and still powers the screenshots.

**Mobile-layout scenes (post-build, review feedback):** all landing scenes were
switched to the app's Android/mobile layout (390×844 @2x captures — the
product's primary design) per owner feedback that desktop-width screenshots hid
the real UI. `scripts/capture-scenes.cjs` now captures only the 6 mobile scenes
the features section references; the desktop set and the unused scenes were
removed. Every scene image in the features section renders inside a CSS phone
frame (`.phone-frame`), and the OG image was recomposed as a branded 1200×630
share card (left: logo + tagline; right: the mobile dashboard in a phone
mockup).

**Text-first hero (post-build, review feedback):** the hero's auto-scrolling
screenshot carousel was replaced with a text-oriented feature spotlight — 10
rotating units (numbered title + explanation) using the same prev/next/dots
controls and slower 8s autoplay. The screenshots with captions below in the
features section carry the visual proof; the hero now explains what FlowMD
does.
