# FlowMD Question Bank (Q-Bank) — Setup, Extraction & Developer Guide

This document contains everything needed to extract, run, and develop the **FlowMD Question Bank & MCQ System** locally on any laptop (Windows, macOS, Linux).

---

## 1. Quick Start (How to Run on Any Laptop)

FlowMD is a lightweight, zero-dependency offline-first PWA (HTML5, Vanilla CSS, Vanilla JS). You do not need `npm install` or external database setups.

### Option A: Using Python (Recommended)
Open your terminal in the project folder and run:
```bash
# Python 3.x
python -m http.server 8140
```
Then open your browser and navigate to:
👉 **`http://localhost:8140/#/curriculum`**

### Option B: Using VS Code Live Server
1. Open the project folder in **VS Code**.
2. Install the **Live Server** extension.
3. Right-click on `index.html` $\rightarrow$ select **"Open with Live Server"**.

### Option C: Using Node.js `npx serve` or `http-server`
```bash
npx serve -l 8140 .
# or
npx http-server -p 8140 .
```

---

## 2. Directory Structure & Key Files

Ensure the following files are present in your project directory:

```text
FlowMD/
├── index.html                   # Main application entry point & script loaders
├── style.css                    # Design system, theme tokens, and arcade controls
├── app.js                       # Shell dispatcher, router, and initialization
├── data.js                      # NEET-PG Edition 8 Syllabus dataset
├── sw.js                        # Service Worker (PWA offline cache v297)
│
├── js/
│   ├── core/
│   │   ├── namespace.js         # Window.FlowMD global namespace
│   │   ├── constants.js         # Colors, icons, and localStorage keys
│   │   ├── state-store.js       # Reactive state manager
│   │   ├── source-data.js       # Syllabus & study source qualification
│   │   ├── subjects.js          # Subject metadata & faculty lookups
│   │   ├── metrics.js           # Syllabus calculation & daily queue math
│   │   ├── qbank-data.js        # 15 Curated Q-Bank subjects (12,593 MCQs)
│   │   └── qbank-store.js       # User MCQ progress, answers, and scores
│   │
│   └── features/
│       └── views/
│           ├── dashboard.js      # Daily Quests & HUD heatmap view
│           ├── curriculum.js     # Dual-mode (Videos vs MCQ's / Q-Bank) view
│           ├── subject-detail.js # Subject Detail page (3-stat bar, chapters, MCQ test button)
│           ├── qbank.js          # Standalone Q-Bank timeline & index drawer
│           └── mcq-practice.js   # Interactive MCQ testing player & explanation scorecard
```

---

## 3. Curated Subject Catalog (12,593 MCQs)

| # | Subject | Faculty | Chapters | Topics | Total MCQs |
| :-: | :--- | :--- | :-: | :-: | :-: |
| 1 | **Anatomy** | Dr. Raviraj | 10 | 63 | **1,115** |
| 2 | **Physiology** | Dr. Krishna Kumar | 10 | 43 | **1,012** |
| 3 | **Biochemistry** | Dr. Rebecca James | 6 | 28 | **581** |
| 4 | **Pharmacology** | Dr. Ranjan Kumar Patel | 11 | 67 | **1,283** |
| 5 | **Microbiology** | Dr. Shivika | 7 | 35 | **620** |
| 6 | **Pathology** | Dr. Ila Jain Khandelwal | 9 | 71 | **1,368** |
| 7 | **Community Medicine (PSM)** | Dr. Mukhmohit Singh | 20 | 64 | **1,313** |
| 8 | **Forensic Medicine (FMT)** | Dr. Magendran J | 9 | 21 | **436** |
| 9 | **Ophthalmology** | Dr. Utsav Bansal | 16 | 28 | **633** |
| 10 | **ENT (Otorhinolaryngology)** | Dr. Manisha Sinha Budhiraja | 5 | 38 | **583** |
| 11 | **Anaesthesia** | Dr. Rama Krishna | 7 | 25 | **549** |
| 12 | **Dermatology** | Dr. Malcolm Pinto | 14 | 23 | **510** |
| 13 | **Radiology** | Dr. Zainab Vora | 4 | 16 | **281** |
| 14 | **Surgery** | Dr. Rohan Khandelwal | 13 | 54 | **1,256** |
| 15 | **Obstetrics & Gynaecology** | Dr. Sakshi Arora | 9 | 49 | **1,053** |
| — | **Dynamic Subjects** *(Medicine, Paediatrics, Orthopaedics, Psychiatry, Revision)* | Marrow Faculty | Full Syllabus | Dynamic | Full Syllabus |

---

## 4. User Interaction & Workflow

1. **Curriculum Selection**:
   - Go to the **Curriculum** view (`#/curriculum`).
   - Click the **"MCQ's / Q-Bank."** toggle tab.
   - Each subject card shows real-time progress: `X/Total topics · Y/Total MCQs` and mastery percentage.
2. **Subject Detail (MCQ Mode)**:
   - Click any subject card (e.g. **Anatomy**).
   - View the 3-Stat Header: `COMPLETED TOPICS`, `SOLVED MCQS`, `Q-BANK MASTERY`.
   - Toggle chapter accordions (e.g. `EMBRYOLOGY`, `HISTOLOGY`).
   - Click **`MARK DONE`** to mark entire chapters completed/uncompleted.
   - Click topic checkboxes to tick individual topics.
   - Click the cyan/blue **`MCQ`** button on any topic to launch the practice test.
3. **Interactive MCQ Practice Player**:
   - Questions display clinical vignettes, 4 options (A/B/C/D), bookmark flags, and question palette.
   - Instant color-coded feedback (Green for Correct, Red for Incorrect).
   - High-yield clinical explanations and Key Concept takeaway boxes.
   - Comprehensive results scorecard at the end of the test.

---

## 5. Offline Data Storage & Progress Keys

All user activity is saved locally in the browser's `localStorage` and does not require an active internet connection:

- **Q-Bank Progress Key**: `flowmd_qbank_progress_v1`
  - Stores answers, bookmarks, scores, timestamps, and completion statuses per topic ID.
- **Syllabus Video Progress**: `completedVideos` in `flowmd_state_v2`
- **Study Plans**: `plans` in `flowmd_state_v2`
- **Backup Export / Import**: Handled via `js/features/backup.js` through `Profile → Export Backup` (downloads `flowmd-backup-YYYY-MM-DD.json`).

---

## 6. Verification Checklist

- [x] Python HTTP server serves `http://localhost:8140/` with zero console errors.
- [x] Curriculum dual-mode tabs switch between **Videos** and **MCQ's / Q-Bank.**.
- [x] All 15 MBBS subjects display exact topic numbers and MCQ counts.
- [x] No star ratings or PRO badges appear on topic items.
- [x] Clicking `MCQ` starts the question interface smoothly.
- [x] Solved topics and scores persist upon page refresh.
