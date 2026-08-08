# FlowMD Archive Manifest

This folder holds files quarantined from the `marrow-planner` root on
2026-08-08 to keep the runtime surface clean. Everything here is recoverable
via git (`git checkout <path>` restores it) or by copying it back manually.

## What is NOT in here (keep in root)

These files are required at runtime or for the build/deploy pipeline and were
**not** moved:

- `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.json`
- `data.js`, `data_marrow_6_5.js` (loaded by index.html at runtime)
- `firebase.js`, `firebase.json`, `firestore.rules`, `.firebaserc`
- `package.json`, `package-lock.json`
- `icon.svg` (kept — referenced by `sw.js` ASSETS list)
- `opencode.json`, `.svgrrc`, `.gitignore`
- `assets/`, `tests/`, `.opencode/`, `.planning/`, `.github/`, `.firebase/`
- `scripts/bump-version.js` (referenced by `package.json` and `.github/workflows/deploy.yml`)

## Moved items and where they went

### One-off OCR / data-rebuild scripts (not referenced by package.json or CI)
- `scripts/clean_edition65_csv.js` → `_archive/scripts/`
- `scripts/extract.js` → `_archive/scripts/`
- `scripts/extract_and_patch.js` → `_archive/scripts/`
- `scripts/extract_clean.js` → `_archive/scripts/`
- `scripts/find_chapter_fixes.js` → `_archive/scripts/`
- `scripts/generate_readable_curriculum.js` → `_archive/scripts/`
- `scripts/gen_title_fixes.js` → `_archive/scripts/`
- `scripts/list_subjects.js` → `_archive/scripts/`
- `scripts/ocr_batch.js` → `_archive/scripts/`
- `scripts/parse_ocr_screenshots.js` → `_archive/scripts/`
- `scripts/parse_subjects.js` → `_archive/scripts/`
- `scripts/patch.js` → `_archive/scripts/`
- `scripts/process.js` → `_archive/scripts/`
- `scripts/rebuild_data_from_md.js` → `_archive/scripts/`
- `scripts/rebuild_edition65.js` → `_archive/scripts/`
- `scripts/reorganize.js` → `_archive/scripts/`
- `scripts/reorganize_v2.js` → `_archive/scripts/`
- `scripts/reorganize_v3.js` → `_archive/scripts/`
- `scripts/reorganize_v4.js` → `_archive/scripts/`
- `scripts/reorganize_v5.js` → `_archive/scripts/`
- `scripts/scan_chapters.js` → `_archive/scripts/`
- `scripts/test_ocr.js` → `_archive/scripts/`
- `scripts/test_ocr2.js` → `_archive/scripts/`

### OCR pipeline source data (input to data.js rebuilds; not served)
- `sources/` (whole folder) → `_archive/sources/`

### OCR screenshot frames (used to build the dataset; not served)
- `frames/` (whole folder) → `_archive/frames/`

### Explicitly marked deletable files
- `files_to_delete/` (whole folder) → `_archive/files_to_delete/`

### Unused TSX components / source stubs
- `components/` (whole folder) → `_archive/components/`
- `src/` (whole folder) → `_archive/src/`

### Playground / duplicate HTML & CSS
- `Untitled design/` → `_archive/untitled-design/`
- `Untitled design.zip` → `_archive/untitled-design/`
- `overworld_demo.html` → `_archive/legacy/`
- `profile_screen.html` → `_archive/legacy/`
- `profile.css` → `_archive/legacy/`
- `index_copy.html` → `_archive/legacy/`
- `index_legacy.html` → `_archive/legacy/`

### Legacy / unused stylesheets (dropped from sw.js ASSETS list)
- `device-mode.css` → `_archive/legacy-css/`
- `device-mode_legacy.css` → `_archive/legacy-css/`
- `style_legacy.css` → `_archive/legacy-css/`

### Source curriculum document (build input, not runtime)
- `marrow_edition8_readable_curriculum.md` → `_archive/docs/`

### Ad-hoc fix scripts (one-time patches)
- `fix-bullets.js` → `_archive/fix-scripts/`
- `fix.js` → `_archive/fix-scripts/`
- `fix_all_issues.js` → `_archive/fix-scripts/`
- `fix_share.js` → `_archive/fix-scripts/`
- `fix_share_attr.js` → `_archive/fix-scripts/`
- `revert_fix.js` → `_archive/fix-scripts/`

### Playwright MCP artifacts (local test output)
- `.playwright-mcp/` (whole folder) → `_archive/playwright-mcp/`

### Media / screenshots / logs
- `MarrowFlow ANDRIOD RECORD.mp4` → `_archive/media/`
- `Record_2026-07-19-19-55-34_3f2a1cf747247c888711f3204f827610.mp4` → `_archive/media/`
- `Record_2026-07-19-20-04-38_3f2a1cf747247c888711f3204f827610.mp4` → `_archive/media/`
- `Record_2026-07-19-20-10-16_3f2a1cf747247c888711f3204f827610.mp4` → `_archive/media/`
- `Record_2026-07-19-20-13-55_3f2a1cf747247c888711f3204f827610.mp4` → `_archive/media/`
- `ChatGPT Image Jul 31, 2026, 01_43_11 AM.png` → `_archive/media/`
- `dark-heatmap.png` → `_archive/media/`
- `light-heatmap.png` → `_archive/media/`
- `app_diff.txt` → `_archive/docs/`
- `page-snapshot.md` → `_archive/docs/`

### Unused / duplicate icons
- `icons/converted-smart.png` → `_archive/icons/`
- `icons/dark mode.svg` → `_archive/icons/`
- `icons/light mode.svg` → `_archive/icons/`
- `icons/obstetrics_gynaecology.png` (duplicate of `obstetrics___gynaecology.png`) → `_archive/icons/`
- `icons/otorhinolaryngology_ent.png` (duplicate of `otorhinolaryngology__ent_.png`) → `_archive/icons/`
- `icons/pdfgear_setup_v2.1.18.exe` (installer, not an app asset) → `_archive/icons/`

## Runtime icon files KEPT in `icons/`

Referenced by `data.js` subject definitions — do not move:
`anaesthesia.png`, `anatomy.png`, `biochemistry.png`, `community_medicine.png`,
`dermatology.png`, `forensic_medicine.png`, `medicine.png`, `microbiology.png`,
`obstetrics___gynaecology.png`, `ophthalmology.png`, `orthopaedics.png`,
`otorhinolaryngology__ent_.png`, `paediatrics.png`, `pathology.png`,
`pharmacology.png`, `physiology.png`, `psychiatry.png`, `radiology.png`,
`revision_videos.png`, `surgery.png`.

## How to restore

Each entry was moved, not deleted. To restore a single file:

```
git checkout -- <original-path>
```

or copy it back from `_archive/`. The original paths are recorded above.
