# FlowMD — Change Log

## [2026-08-11] Fix icons degrading to ligature text on every reload after the first load (v197)

- **Bug**: Material Symbols icons rendered fine on the first load, then showed as raw ligature text (`local_fire_department`, `auto_stories`, …) on every subsequent reload. The service worker script is served with the site's CSP header, so its own cross-origin `fetch()` calls are subject to `connect-src` — which allowed `*.googleapis.com` but **not** `fonts.gstatic.com` / `www.gstatic.com`. Once the SW controlled the page, its font/SDK fetches were blocked (`net::ERR_FAILED`), the cache misses returned nothing, and the fonts never loaded.
- **Fix**: added `https://fonts.gstatic.com` and `https://www.gstatic.com` to `connect-src` in both the `index.html` meta CSP and the deployed `firebase.json` header CSP.
- **Test hardening**: `tests/offline.mjs`'s static server now sends the same production CSP headers, so the SW's CSP-restricted fetches are exercised in tests (this is why the bug slipped through — the test env had no CSP).

## [2026-08-11] No assumed goals for new users; source switch resets to unset (v195)

- **Bug**: fresh profiles (and users after switching study source) were silently given assumed targets — subject auto-selected, `8 vids/day`, `56/week`, `240/month`, and a hardcoded `2026-08-15` deadline — so the Goal Pulse / 7-day chart never visibly changed after a source switch.
- **Fix**: `DEFAULT_PLAN` / `DEFAULT_GOALS` and the legacy `migrateStateToPlans()` carry no numeric or date defaults anymore (empty subject, empty deadline, `null` paces). The Study Plan Config form now starts with a “— Select a subject —” placeholder, empty pace/deadline fields, and refuses to save until subject + daily pace + deadline are filled in. Analytics shows an honest “No study target set yet” state (Goal Pulse + Preparation Setup show `—`/`Not set`, never fake numbers) instead of assumed values.
- **Source switch** (`source-settings.js`) now resets to a truly unset plan, so the Goal Pulse and 7-day chart visibly change and wait for fresh input.
- Smoke test +2 checks: fresh profile starts with an empty plan config; Analytics Goal Pulse shows the empty state. (29 checks)

## [2026-08-11] Fix Google sign-in — CSP blocked the Firebase authDomain iframe (v193)

- **Bug**: `signInWithPopup` failed with either "Sign in failed" or the Google tab closing right after account selection. Firebase Auth relays the popup result through an invisible iframe on the authDomain (`https://flowmd-04.firebaseapp.com/__/auth/iframe`), but the app's CSP `frame-src` only allowed `accounts.google.com`/`apis.google.com` — the console logged `Framing 'https://flowmd-04.firebaseapp.com/' violates CSP frame-src`, so the OAuth completed, the tab closed, and the result never reached the app.
- **Fix**: added `https://flowmd-04.firebaseapp.com` to `frame-src` in both the `index.html` meta CSP and the deployed `firebase.json` header CSP.

## [2026-08-11] PWA install helper — first-visit install UI + Profile guide (v191)

- **New module** `js/features/pwa-install.js` (`window.FlowMD.pwaInstall`): single source of truth for the install lifecycle — captures `beforeinstallprompt`, tracks installed/installable state (`display-mode: standalone` + `appinstalled` + persisted `flowmd_pwa_installed`), and exposes `requestInstall()`.
- **First-visit install banner** on the dashboard: adaptive — browsers with a native prompt (Android Chrome / desktop) get an **Install** CTA; browsers without one (iOS Safari) get brief **Add to Home Screen** steps (Android ⋮ menu / iPhone Share). Dismissal persists (`flowmd_install_helper_dismissed`) so it never nags again.
- **Install App card in Profile**: short intro + the same brief steps, or an Install button when the native prompt is available, or an “installed ✓” state once installed.
- **Fixed latent bug**: the old dashboard banner referenced `deferredInstallPrompt` (scoped inside `app.js`'s IIFE → `ReferenceError` on click) and was hidden by a stale duplicate `.pwa-install-banner` CSS block (`position: fixed; display: none`) — both removed, wiring moved into the new module.
- `tests/modules.mjs` registry contract +10 checks (91 total); smoke test now asserts the first-visit banner and the Profile install card (27 checks).

## [2026-08-10] Phase C — legacy retro-era naming cleanup + storage-key migration (v184)

- **Design tokens renamed** (v179): `pxl-*` classes → `fm-*`, `PXL_ICONS` → `FLOWMD_ICONS` across all views, toast, theme, search, charts, constants, the app shell, `index.html`, and `style.css` (347 occurrences); stale `PXLKIT`/`PxlKit`/`16-BIT RETRO RPG` comments → FlowMD.
- **Onboarding wizard renamed** (v180): `obw-*` classes/IDs → `onboarding-*`; wizard state vars `obwStep/obwSource/obwTheme/obwName/obwSeeded` → `onboarding*`. Test selectors updated in sync.
- **Plan-config modal renamed** (v181): `gcm-*` classes/IDs → `plan-config-*` in `study-plan-config.js`, `index.html`, and `style.css`.
- **Execution chart renamed** (v182): `ex-chart-*` classes → `chart-*` (legend `ex-dot-*` markers untouched).
- **Storage-key migration, schema v2 → v3** (v184): all `marrow_planner_*` keys → `flowmd_*` (incl. the raw `marrow_planner_theme_style` strings). `migrateStateSchema()` carries old values over once, removes legacy keys, and runs **before** the v1→v2 migration so v1-era profiles still get the video-ID prefixing.
- **New test**: `tests/migration.mjs` (12 checks) — seeds a full v2 profile, asserts every `marrow_planner_*` key removed, values carried over, `flowmd_schema_version = 3`, and the dashboard renders identically to a fresh v3 profile.
- **Latent bugs fixed** (v183): `dashboard.js` and `subject-detail.js` called `getScopedChapterNames(plan)` without importing it (missing since the extraction — only fired when a plan exists). The navigation audit now seeds a Plan A profile so those paths render on every run.
- `npm test` now runs 6 suites: modules → metrics → smoke → onboarding → navigation → migration (230+ assertions).

## [2026-08-10] Monolith decomposition — `app.js` split into 20 modules (v178)

- **`app.js` slimmed from 3,816 → 356 lines.** All logic moved into plain-IIFE modules registered on `window.FlowMD.*`, loaded as ordered `<script>` tags (no bundler — CSP forbids `unsafe-eval`).
- **Module map**: `js/core/` — namespace, constants, state-store, source-data, subjects, metrics, logo; `js/features/` — toast, theme, search, sync, onboarding, study-plan-config, source-settings, charts, views/{dashboard, curriculum, subject-detail, analytics, profile}.
- **Fixed dormant duplication**: `js/core/state-store.js` and `js/core/source-data.js` (extracted in v160 but never wired) are now loaded; their duplicate copies inside `app.js` were deleted. Two copies of the same state/data logic could previously drift silently.
- **Dead code removed** (found during the sweep): `renderGoalsView` (unreachable since the initial commit), `renderFacultyPill`, `renderHoursMeter`.
- **New tests**: `tests/modules.mjs` (81 registry-contract checks), `tests/metrics.mjs` (19 unit tests), `tests/navigation.mjs` (full view tour incl. bottom-sheet open/navigate/dismiss, zero console errors). `npm test` runs modules → metrics → smoke → onboarding → navigation (160+ assertions).
- **Revert safety**: each extraction tagged `stage-0`…`stage-17`; backup branch `backup/pre-decompose-v161`.
- Behavior unchanged — same DOM output, same localStorage schema. Verified: 20/20 smoke, 40/40 onboarding, 81/81 registry, 19/19 metrics, navigation tour clean.

## [2026-08-10] 7-Day Execution Chart — reverted to line style (matching deployed site)

- Reverted the pixel-terminal bar chart back to the **line-style chart** matching flowmd-04.web.app exactly:
  - **Area fill**: gradient `linearGradient` (0.30→0.02 opacity) under the curve (`ex-chart-area` with `fill: url(#exChartGrad)`).
  - **Trend line**: smooth **Catmull-Rom→cubic-bezier** curved path (`ex-chart-line`, stroke-width 2, round caps/joins).
  - **Nodes**: solid circle markers at each data point (`ex-chart-node`, r=5) with `ex-node-met`/`ex-node-part`/`ex-node-zero` color states; value label + star badge above each node.
  - Removed all bar/pixel-terminal classes: `ex-bar-track`, `ex-bar-cell`, `ex-chart-bar`, `ex-trend-line`, `ex-trend-marker`, `ex-dot-trend`, `ex-day-tile--pixel`.
  - Removed the re-render-at-measured-width logic (not needed for smooth vector chart).
  - Legend simplified back to: Target Met, Partial, No Study, Daily Target (removed "Track" item).
  - Grid lines: `stroke-dasharray: 1 4` (dotted); Target line: `stroke-dasharray: 2 3` (dashed violet) — matching deployed.
- Cache-busted to v161 (`?v=161` in index.html; sw.js cache `marrow-planner-pwa-v8`).
- Verified: `node --check app.js` passes; Playwright smoke 20/20 + onboarding 40/40 (60/60 total), 0 console errors. DOM verified: 1 gradient area + 1 smooth line + 7 point groups + 7 nodes + 3 dotted grid lines + 1 dotted target line. Zero leftover bar/pixel elements.

## [2026-08-09] Anatomy icon upgraded → skeleton

- Replaced the anatomy subject icon in `js/core/constants.js` (`SUBJECT_SVG_ICONS.anatomy`) from the generic `body/body.svg` outline to the detailed Health Icons `body/skeleton.svg` (full skeleton, 6150 chars vs 2064).
- Verified: `node --check` passes; smoke test 20/20; anatomy heatmap tile renders the skeleton SVG with no console errors.

## [2026-08-09] Subject icons → Health Icons (SVG)

Replaced the subject icons across the app with official Health Icons (healthicons.org, outline style, CC0/public domain).

### Source
- Downloaded `healthicons.zip` and extracted to `C:\MOHAMMED SAFI\LM\healthicons_extracted\icons\svg\outline\`
- SVGs embedded inline (single-line, `viewBox="0 0 48 48"`, `fill="currentColor"`) — no separate asset files added.

### Icon mapping
| Subject | Health Icon file |
| --- | --- |
| anatomy | `body/skeleton.svg` (upgraded from `body/body.svg`) |
| physiology | `body/heart-organ.svg` |
| biochemistry | `specialties/biochemistry-laboratory.svg` |
| pathology | `devices/microscope.svg` |
| pharmacology | `specialties/pharmacy.svg` |
| microbiology | `body/bacteria.svg` |
| community_medicine | `people/community-healthworker.svg` |
| forensic_medicine | `symbols/magnifying-glass.svg` |
| ophthalmology | `specialties/opthalmology.svg` |
| otorhinolaryngology__ent_ | `specialties/ears-nose_and_throat.svg` |
| anaesthesia | `devices/syringe.svg` |
| dermatology | `body/tissue.svg` |
| psychiatry | `symbols/mental-health.svg` |
| radiology | `specialties/radiology.svg` |
| medicine | `devices/stethoscope.svg` |
| surgery | `specialties/general-surgery.svg` |
| orthopaedics | `specialties/orthopaedics.svg` |
| paediatrics | `specialties/pediatrics.svg` |
| obstetrics___gynaecology | `specialties/gynecology.svg` |
| revision_videos | `symbols/video.svg` |

### Files changed
- `js/core/constants.js` — replaced all 20 entries of `SUBJECT_SVG_ICONS` with Health Icons
- `app.js`:
  - Heatmap tiles now render inline SVG (`sub.svgIcon`) colored by `sub.accentColor` instead of `<img src=...png>`
  - Subject spotlight search results use `s.svgIcon`
  - Curriculum subject rows use `sub.svgIcon` with `accentColor`
  - PWA subject detail header uses `subObj.svgIcon` with `accentColor`
- `style.css`:
  - `.pxl-tile-icon-area svg` rules replace `.pxl-tile-icon-img` (kept 52px, hover scale, drop-shadow; removed dark `#1a2332` chip background)
  - Added `.subject-icon-medium svg`, `.subject-icon-wrapper` (new base rule + svg), `.pwa-subject-detail-icon svg` sizing rules

### Notes
- PNG icons (`icons/*.png` + `SUBJECT_ICONS` + `getSubjectIconSrc`) still exist as fallback; heatmap PNG no longer used.
- Goals analysis icons (material symbols, `o.icon`) untouched.
- Verified: `node --check` passes on `constants.js` and `app.js`; 20/20 subjects present.
