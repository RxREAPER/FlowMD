# FlowMD — Change Log

## [2026-08-11] Preparation Setup now responds to Study Plan Config goals (v207)

- **Bug — Preparation Setup ignored the config**: the analytics "Preparation Setup" card read the legacy `state.goals` object, but the Study Plan Config only mirrored Plan A's subject/date/daily pace into it — weekly/monthly were never mirrored, and Plan B not at all. The card showed stale or empty values ("—") after saving goals.
- **Fix**: the card now derives its values from `state.plans` (the real source of truth, same as Goal Pulse) — Priority Focus joins configured subjects, Daily Pace / Daily / Weekly / Monthly sum across all plans, and Target Date uses the earliest plan deadline (formatted en-GB). Goal Pulse, hero chips, and Days Left use the same plan-based clocks.
- **Legacy hygiene**: the `state.goals` mirror now also carries weekly/monthly so the cloud field is never half-stale.
- **New smoke regression**: configures Plan A (subject, 3 vids/day, 2027-06-30 deadline) and asserts the Preparation Setup card shows 3/21/90 vids and the target date (33/33 checks pass).

## [2026-08-11] Two-device sync proof — pull-then-push verified end-to-end, echo writes eliminated (v206)

- **New two-device test suite** (`tests/unit/sync-twodevice.test.mjs`): two simulated devices run the REAL production sync modules against a shared in-memory cloud store (same contract as firebase.js — per-field clocks, compressed video keys). Four scenarios prove the sync design end-to-end:
  1. Different fields edited on each device → both edits survive after a round of syncs;
  2. Same field edited on both → the newer edit wins, the older is never resurrected;
  3. completedVideos is a union → completions from both devices all survive (cloud key stored compressed);
  4. **No write ping-pong** → after both devices settle, repeated syncs produce ZERO writes (a write counter asserts it).
- **Two real bugs found by the proof and fixed**:
  - `manualSync`'s push could re-push fields it had just pulled (echo): the pull stamped their clocks via `applyMergedState`, so they looked locally edited. The push phase now snapshots the per-field clocks BEFORE the pull and writes only fields whose pre-pull local clock is genuinely newer than the cloud's (unions always safe).
  - After a pull, the push baseline (`_prevSyncedState`) was stale, so a later debounced auto-push could rewrite just-pulled fields. `applyMergedState` now advances the baseline to the merged state — pulled fields are "already synced" and never echo back.
- Bookkeeping fields (`_cloudSyncTimes`, `_dirtyFields`, `_prevSyncedState`, ...) are explicitly excluded from the manual push — they were previously at risk of being written into the cloud doc.
- **Test infrastructure fixes**: the offline test was flaky (1 in 3 runs) because Google Analytics beacons (`googletagmanager.com` / `google-analytics.com`) intermittently fail in the sandbox — the error collector now ignores network resource failures (they're not app errors; offline capability is asserted separately). Full suite: 101/19/32/40/22/7/scope-clean/26 unit.

## [2026-08-11] Cross-device sync is now pull-then-push — no more write clashes (v205)

- **The real-time `onSnapshot` listener is gone.** Previously every write from any device (including your own) instantly re-merged and could re-push, so two signed-in devices ping-ponged writes at each other and edits "reverted" (the reported clashes). Sync now only happens when a device pulls or pushes deliberately — nothing can write back into your device without you asking.
- **Sync Now = pull-then-push** (Profile → Google Cloud Sync, plus auto-run when the device comes back online): first the cloud doc is read and merged into local state, then only the fields this device actually changed since the pull are written back. A sync can never fight itself.
- **Per-field newest-wins arbitration** (`mergeCloudPerField`): each field carries its own last-write clock (`fieldSyncTimes`, written with every push, compared on every pull). The side that last changed a field wins it — no more whole-doc clock-skew guessing. `completedVideos` stays a union (cloud fills gaps, local wins conflicts) so completions from either device always survive.
- **Local changes still auto-push** (unchanged): every local save writes changed fields to the cloud 800ms later, but the push guard skips fields the cloud already has newer — your data always leaves the device, nothing ever clobbers it back.
- **Simpler code**: removed the old `shouldApplyCloud` clock-skew arbitration, the unused `subscribeToCloud`/`onSnapshot` listener, and the sign-in merge special-case. UI copy updated (no more "syncs in real-time (~1s)"), Sync Now button added with the `sync` icon.
- **Tests**: +4 unit tests for `mergeCloudPerField` (cloud-newer wins, local-newer wins, completedVideos union, no-timestamp first sync), registry +1 (101 total, `pullFromCloud`/`mergeCloudPerField` contract-checked), 22/22 unit green; full suite green (101/19/32/40/22/7/scope-clean).

## [2026-08-11] Google Fonts removed — system font stacks + zero external font requests (v204)

- **No more Google Fonts, at all.** The Inter/Outfit/Poppins/Pixelify Sans/VT323 CSS link, preconnects, and every woff2 precache are gone from `index.html` and `sw.js`. All text now renders from system stacks (`system-ui`/`-apple-system`/`Segoe UI` for modern, `Courier New`/`ui-monospace` for the retro pixel/HUD look), declared once in the `--font-*` variables in `style.css`.
- **~180 direct `font-family` references updated** in `style.css` plus inline refs in `index.html` and 5 JS modules (logo, search, study-plan-config, toast, profile) — all now use the variables or the system stack. Redundant fallbacks after `var(--font-*)` were removed.
- **CSP tightened**: `style-src` no longer needs `fonts.googleapis.com`, `font-src` drops `fonts.gstatic.com`, `connect-src` drops `fonts.gstatic.com`.
- **Service worker simplified**: the Google Fonts precache job and the `isFont` network-first fetch branch are deleted — one fewer failure mode (a font fetch can never hang, CSP-block, or corrupt rendering again; the text fonts were the last external font dependency).
- **Tests**: offline test CSP mirror updated; full suite green (100/19/32/40/nav/22/7/scope/20). Verified visually on the live preview — dashboard renders identically with system fonts and inline-SVG icons.

## [2026-08-11] Material Symbols font replaced with inline SVG sprite — icons can never degrade to ligature text again (v204)

- **The icon-failure bug class is structurally dead.** All 55 Material Symbols the app uses (52 static + `error`/`check_box`/`check_box_outline_blank` dynamic) are now official SVG paths in a hidden `<symbol>` sprite (`js/core/icons.js`, 22 KB), referenced as `<svg class="material-symbols-outlined"><use href="#fmd-i-{name}"/></svg>`. No icon font, no font fetch, no cache, no CSP/CORS — offline, first-ever visit, slow network: the ligature-text symptom (`local_fire_department`) is impossible because there is no font to fail.
- **Zero design change**: same official artwork, `1em` sizing (all existing `font-size` rules keep working), `currentColor` fill (all existing `color` rules keep working). Verified visually on dashboard + analytics; sprite symbols 55/55 resolve; dynamic `expand_more`↔`expand_less` accordion toggle re-wired via `icons.setIcon()`.
- **Payload removed**: the Material Symbols Google Fonts CSS link + its woff2 precache are gone from `index.html` and `sw.js` (~1 MB of cached font assets); the SW still precaches the text fonts (Inter/Outfit/Poppins) and now precaches `icons.js`.
- **Migration mechanics**: 111 static spans converted by script (class/style/aria kept); 3 dynamic templates (toast, analytics goal tiles, subject-detail bulk checkbox) now call `icons.renderIcon(name, class, style)`.
- **Tests updated**: offline test now asserts inline-SVG + sprite resolution + zero ligature text (online AND offline), modules registry +5 checks (100 total). Full suite green: 100/19/32/40/nav/22/7/scope/20.

## [2026-08-11] Firestore doc slimmed — dead, transient, and redundant data no longer synced (v202)

- **Dead fields removed from the cloud doc**: `speed` (always `1.5`), `subjectUrgency` (always `{}`), `dailyBatch` (always `null`), and `lastSyncedAt` (never read — `updatedAt` is the merge clock). None existed in app state or were ever consumed; they were written as constants on every sync.
- **Transient queue state no longer synced**: `queueBatchVideoIds` / `queueCompletedInBatch` (top-level and per-plan) plus per-plan `extraBatchesCompletedToday` / `lastBatchDate` — per-day, recomputed by the queue engine, and wrong to share across devices. Plans are now stored with only their durable fields (`id`, `label`, `accentColor`, target, paces, `targetUnits`).
- **`completedVideos` keys compressed**: the runtime `marrow_8::` source prefix is redundant in the doc (it sits next to `activeSource`), so keys are stripped on write (`compressCompletedVideos`) and re-prefixed on read (`rehydrateCompletedVideos`) — saves ~10 bytes per video (≈16KB on the full syllabus) and keeps the doc far from Firestore's 1 MiB limit. `updateVideo` writes compressed keys too. Legacy prefixed keys pass through untouched.
- **History pruned to 90 days**: `dailyHistory` is only read for the 7/30-day charts and `dailyHistoryBySubject` only for today's count, so entries older than 90 days were unbounded dead weight in the doc; `saveState` now prunes both maps (local + cloud stay identical).
- **Tests**: +5 unit tests (compress/rehydrate round-trip, prune cutoff, sanitize drops dead fields + strips plan transients), +4 registry contract checks (95 total). Existing docs stay valid: old fields are dropped on read, prefixed video keys rehydrate correctly, and the whole suite is green (95/19/32/40/nav/22/7/scope/20).

## [2026-08-11] Scope-leak audit — one more leftover from the module split caught (v201)

- **Audited every module** (`js/features/views/*`, `js/features/*`, `js/core/*`, `app.js`, `firebase.js`, `sw.js`) for bare function calls not covered by an import, a declaration, a parameter, or a known global — the ReferenceError class that already broke the quest checkboxes.
- **Found + fixed 1 more**: `pwa-install.js` still called `notifyChanged()` (renamed to `refreshInstallUI` in v199) after the user answers the native install prompt — every install threw a `ReferenceError`, so the banner/card never refreshed and no toast appeared after install.
- **New permanent test** `tests/scope-leaks.mjs` wired into `npm test` (9 suites now): a char-scanner strips comments/strings/templates/regex and flags any bare call not accounted for — so this whole bug class is caught on every run, forever.

## [2026-08-11] Daily Quest checkboxes dead — scope leaks from the module split (v201)

- **Bug**: clicking a Daily Quest checkbox visually toggled it but nothing registered — no completion, no toast, no progress. The change handler called `getPlanById()` and bare `render()`, which were in scope inside the old monolithic `app.js` but not in the extracted `dashboard.js` module → `ReferenceError` on every click (same class as the earlier `getScopedChapterNames` extraction miss; render-only audits never click, so it slipped through). The same leaks silently broke **Load Next Video**, **Save & Apply Plan A/B Target**, **Disable Plan B**, and **saving the profile name**.
- **Fix**: `dashboard.js` now imports `getPlanById` from `window.FlowMD.metrics`; all bare `render()` calls in `dashboard.js`, `profile.js`, and `study-plan-config.js` route through `window.FlowMD.shell.render()`.
- **Test**: the navigation audit now real-clicks a quest checkbox and asserts the completion registers in state, the progress counter advances, and a toast appears (catches scope leaks on every run).

## [2026-08-11] Study Plan Config: subject dropdown closes itself; picking a subject invented pace/deadline (v199)

- **Bug 1 — dropdown closes before picking**: Chrome fires `beforeinstallprompt` on first user engagement, which is often exactly when the user opens the subject dropdown. The install helper's `notifyChanged()` responded by re-rendering the entire view, destroying the open `<select>` (native picker shuts instantly). `pwa-install.js` now patches only the install banner / Profile card **in place** (never a full re-render), and the Install / Dismiss buttons moved to document-level delegation so in-place swaps can't lose their handlers.
- **Bug 2 — assumed pace/deadline returned**: after v195, picking a subject still auto-filled `8 vids/day`, `56/week`, `240/month` and a deadline via the `|| 8` fallback in `synchronizeModalPace`. The card now waits for real user input — a subject pick fills nothing; the deadline auto-syncs only once a user-entered pace (or a picked date) exists.
- **Tests**: smoke +3 checks — the subject select survives a simulated `beforeinstallprompt` (no full re-render), the banner still upgrades in place, and picking a subject leaves pace/deadline empty with the badge at "Not set" (32 checks).

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
