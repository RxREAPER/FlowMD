# FlowMD Question Bank (Q-Bank) & MCQ System Documentation

---

## 1. Overview & Hierarchy

The FlowMD Question Bank provides an authentic, structured, offline-first study system for NEET-PG preparation. It strictly maintains a 4-tier medical curriculum hierarchy:

```
SUBJECT
  └── CHAPTER
        └── TOPIC
              ├── mcqCount (Metadata)
              └── questions[] (Clinical vignette test items)
```

---

## 2. Core Modules & Architecture

| Module File | Responsibility |
| :--- | :--- |
| [`js/core/qbank-data.js`](file:///c:/Users/HP/FlowMD/js/core/qbank-data.js) | Stores curated canonical subject hierarchies, chapter breakdowns, topic MCQ quotas, clinical vignettes, and dynamic syllabus generators. |
| [`js/core/qbank-store.js`](file:///c:/Users/HP/FlowMD/js/core/qbank-store.js) | Manages offline user state (`flowmd_qbank_progress_v1`), answer tracking, bookmarking, score calculation, chapter & subject real-time aggregate stats. |
| [`js/features/views/curriculum.js`](file:///c:/Users/HP/FlowMD/js/features/views/curriculum.js) | Dual-mode curriculum overview switching between **Videos** and **MCQ's / Q-Bank.** with per-subject topic and question counters. |
| [`js/features/views/subject-detail.js`](file:///c:/Users/HP/FlowMD/js/features/views/subject-detail.js) | Subject detail screen displaying 3-stat HUD meters (`COMPLETED TOPICS`, `SOLVED MCQS`, `Q-BANK MASTERY`), chapter accordions, topic completion checkboxes, and `MCQ` test launcher buttons. |
| [`js/features/views/qbank.js`](file:///c:/Users/HP/FlowMD/js/features/views/qbank.js) | Standalone vertical timeline view with dynamic filters (`ALL`, `PAUSED`, `COMPLETED`, `UNATTEMPTED`), sorting (`Topics`, `MCQs`, `Progress`, `Alpha`), and chapter index modal. |
| [`js/features/views/mcq-practice.js`](file:///c:/Users/HP/FlowMD/js/features/views/mcq-practice.js) | Interactive MCQ testing engine featuring question palette navigation, instant answer feedback, bookmarking, detailed explanations, and review scorecards. |

---

## 3. Curated Subject Catalog (12,593 Total MCQs)

| # | Subject Name | Subject ID | Faculty | Chapters | Topics | Total MCQs |
| :-: | :--- | :--- | :--- | :-: | :-: | :-: |
| 1 | **Anatomy** | `anatomy` | Dr. Raviraj | 10 | 63 | **1,115** |
| 2 | **Physiology** | `physiology` | Dr. Krishna Kumar | 10 | 43 | **1,012** |
| 3 | **Biochemistry** | `biochemistry` | Dr. Rebecca James | 6 | 28 | **581** |
| 4 | **Pharmacology** | `pharmacology` | Dr. Ranjan Kumar Patel | 11 | 67 | **1,283** |
| 5 | **Microbiology** | `microbiology` | Dr. Shivika | 7 | 35 | **620** |
| 6 | **Pathology** | `pathology` | Dr. Ila Jain Khandelwal | 9 | 71 | **1,368** |
| 7 | **Community Medicine (PSM)** | `community_medicine` | Dr. Mukhmohit Singh | 20 | 64 | **1,313** |
| 8 | **Forensic Medicine (FMT)** | `forensic_medicine` | Dr. Magendran J | 9 | 21 | **436** |
| 9 | **Ophthalmology** | `ophthalmology` | Dr. Utsav Bansal | 16 | 28 | **633** |
| 10 | **ENT (Otorhinolaryngology)** | `otorhinolaryngology__ent_` | Dr. Manisha Sinha Budhiraja | 5 | 38 | **583** |
| 11 | **Anaesthesia** | `anaesthesia` | Dr. Rama Krishna | 7 | 25 | **549** |
| 12 | **Dermatology** | `dermatology` | Dr. Malcolm Pinto | 14 | 23 | **510** |
| 13 | **Radiology** | `radiology` | Dr. Zainab Vora | 4 | 16 | **281** |
| 14 | **Surgery** | `surgery` | Dr. Rohan Khandelwal | 13 | 54 | **1,256** |
| 15 | **Obstetrics & Gynaecology** | `obstetrics___gynaecology` | Dr. Sakshi Arora | 9 | 49 | **1,053** |
| — | **Dynamic Subjects** *(Medicine, Paediatrics, Orthopaedics, Psychiatry, Revision)* | `medicine`, `paediatrics`, `orthopaedics`, `psychiatry`, `revision_videos` | Marrow Faculty | Full Syllabus | Dynamic | Full Syllabus |

---

## 4. Data Models & JSON Schemas

### Subject & Chapter Schema
```json
{
  "id": "anatomy",
  "name": "Anatomy",
  "faculty": "Dr. Raviraj",
  "accentColor": "#6366f1",
  "chapters": [
    {
      "id": "anat_chap_embryology",
      "name": "EMBRYOLOGY",
      "topics": [
        {
          "id": "anat_t1_gametogenesis",
          "name": "Gametogenesis",
          "mcqCount": 19,
          "questions": [
            {
              "id": "anat_q1_1",
              "questionNumber": 1,
              "text": "During human gametogenesis, at which specific stage does primary oocyte arrest occur during fetal development?",
              "options": [
                { "id": "A", "text": "Prophase I (Diplotene stage / Dictyotene)" },
                { "id": "B", "text": "Metaphase II" },
                { "id": "C", "text": "Anaphase I" },
                { "id": "D", "text": "Telophase II" }
              ],
              "correctOption": "A",
              "explanation": "Primary oocytes begin Meiosis I during fetal life and arrest in Diplotene of Prophase I (Dictyotene stage) until puberty. Ovulation triggers resumption of meiosis up to Metaphase II, which is only completed upon fertilization.",
              "keyConcept": "Arrest 1: Prophase I (Diplotene) until puberty. Arrest 2: Metaphase II until fertilization."
            }
          ]
        }
      ]
    }
  ]
}
```

### User State Storage Schema (`localStorage['flowmd_qbank_progress_v1']`)
```json
{
  "topics": {
    "anat_t1_gametogenesis": {
      "status": "completed",
      "currentIndex": 18,
      "answers": {
        "0": "A",
        "1": "B"
      },
      "markedForReview": {
        "0": true
      },
      "score": 18,
      "completedAt": "2026-09-30T14:32:00.000Z"
    }
  }
}
```

---

## 5. UI Design & Component Specifications

### 1. Subject Detail Screen (MCQ Mode)
- **Top Header**: Subject Title, Verified Faculty Tag, and `Videos` vs `MCQ's / Q-Bank.` mode tabs.
- **3-Stat Header Bar**:
  - `COMPLETED TOPICS`: `X/Total topics` (Green highlight)
  - `SOLVED MCQS`: `X/Total MCQs` (Cyan highlight)
  - `Q-BANK MASTERY`: `X%` (`Not Started`, `In Progress`, `Mastered`)
- **Section Bar**: `X CHAPTERS • Y TOPICS` with `Collapse All` / `Expand All` toggle.
- **Chapter Accordion**:
  - Chapter index circle (e.g., `1`), Chapter name (`EMBRYOLOGY`).
  - Meta: `1/10 done • 19/183 MCQs • 10% MASTERY`.
  - Right action: `MARK DONE` button (bulk toggle).
- **Topic Row**:
  - Left: Interactive checkbox to toggle topic completion.
  - Title: `#1 Gametogenesis`.
  - Subtitle: `⏱ 19 MCQs` (and `✓ Solved <Date>` when completed).
  - Clean layout: **No star ratings, No PRO badges**.
  - Right: Cyan/Blue **`MCQ`** arcade pill button to launch test practice.

### 2. MCQ Practice Screen
- **Header**: Topic title, chapter breadcrumb, Bookmark toggle button, Question palette drawer.
- **Question Card**: Question index (`Question 3 / 19`), vignette question text, 4 options (A/B/C/D).
- **Feedback & Review**: Instant color-coded validation (Green for correct, Red for incorrect), detailed clinical explanation, key concept takeaway box.
- **Empty State Guard**: Topics with catalogued metadata but pending raw questions display a clear *"Question Content Coming Soon"* screen with a *"Back to Q-Bank"* action.

---

## 6. Offline-First PWA & Persistence

1. **Service Worker (`sw.js`)**:
   - Cache manifest includes all Q-Bank scripts (`js/core/qbank-data.js`, `js/core/qbank-store.js`, `js/features/views/qbank.js`, `js/features/views/mcq-practice.js`).
   - 100% functional offline without internet access.
2. **Backup & Export (`js/features/backup.js`)**:
   - `exportBackup()` captures `flowmd_qbank_progress_v1` into the downloadable JSON backup envelope.
   - `importBackup()` restores all solved questions, scores, and bookmarks seamlessly.
