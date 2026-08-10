# FlowMD — Change Log

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
