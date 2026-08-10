# FlowMD — Change Log

## [2026-08-10] Backend production hardening (branch: `hardening/backend-production`, pending review)

- **Sync integrity (P0):** new `js/core/sync.js` (cloud-state sanitization, clock-skew-safe merge arbitration, field-level dirty tracking) with unit tests; `saveState()` now writes only changed fields via `FirebaseSync.updateCloudFields()`; the snapshot handler never pushes — kills the unbounded write loop for clock-skewed devices.
- **Security:** hardened `firestore.rules` (auth ownership, size/type caps, no `list`, self-only delete) verified against the Firestore emulator; account deletion + data export (Profile → Danger Zone) + `privacy.html` + updated sync-consent copy; XSS: escaped cloud-derived email.
- **Ops:** CI runs on PRs (incl. unit tests); scoped `npm run deploy` (no `git add -A`); nightly Firestore export function + restore runbook; Analytics init + global `app_error`/`screen_view` events; auto-bumped SW cache name + explicit `Cache-Control` headers; lazy data loading, memoized syllabus stats, selective localStorage writes; planning docs refreshed. *(OIDC deploy auth and App Check/API-key restriction were declined by the user — deploy still uses `FIREBASE_TOKEN`.)*

## [2026-08-10] 7-Day Execution Chart — pixel-terminal redesign

- Redesigned the 7-day execution chart from a solid line chart (Catmull-Rom smooth curve + gradient area fill + solid circles) to a **pixel-terminal "scanline" bar chart**:
  - **Bars**: now drawn as **outlined grid tracks** (1px stroke) filled with discrete **4×4px pixel cells** (1px gap) — like retro terminal progress blocks, not solid fills.
  - **Trend line**: replaced the smooth curve + gradient area with a **stepped pixel-staircase** path (miter join, dotted stroke) plus circle markers at each data point.
  - **Target reference line**: changed from long dashes to a **tight dotted** pattern (violet accent-secondary).
  - **Grid lines**: changed from 4px dashes to **tight dots**.
  - Added pixel-accurate re-render at measured container width (removes `preserveAspectRatio="none"`; viewBox matches rendered pixel width exactly).
- Updated CSS: `.ex-chart-area`/`.ex-chart-line`/`.ex-chart-node` → `.ex-trend-line`/`.ex-trend-marker`/`.ex-bar-track`/`.ex-bar-cell`; `.ex-dot-trend` legend dot; dotted grid/target patterns.
- Cache-busted to v160 (`?v=160` in index.html; sw.js cache `marrow-planner-pwa-v8`).
- Verified: `node --check app.js` passes; Playwright smoke 20/20 + onboarding 40/40 (60/60 total), no console errors. DOM verified: 7 bar tracks + 577 pixel cells + 1 stepped trend line + 7 markers + 3 dotted grid lines + 1 dotted target line.

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
