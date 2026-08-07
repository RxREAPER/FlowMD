/* ============================================================
   FLOWMD V2 — 16-BIT RETRO RPG PRESENTATION LAYER
   Cohesive Pixel-Art Design System, Arcade Controls, & HUD Meters
   Complete Redesign of Presentation Layer while preserving 100% logic parity
   ============================================================ */

// --- Shared SVG Icon Set (PxlKit) ---
const PXL_ICONS = {
  trophy: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M2 5h4v2H2zM18 5h4v2h-4zM5 3h14v3c0 4-3 6-7 6s-7-2-7-6V3zm7 7c2.5 0 4-1.6 4-4H8c0 2.4 1.5 4 4 4zm-1 4h2v3h2v2h-6v-2h2v-3z"/></svg>',
  rocket: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2c3.5 2 5 5.5 5 9l2 1v4l-3-1c-.5 1.5-1 3-2.5 4l-1.5-2h-2L8 19c-1.5-1-2-2.5-2.5-4l-3 1v-4l2-1c0-3.5 1.5-7 5-9zm0 3c-1.5 1.5-2.5 3.5-2.5 6v1h5v-1c0-2.5-1-4.5-2.5-6z"/></svg>'
};

(function () {
  'use strict';

  // --- Constants & LocalStorage Keys ---
  const STORAGE_KEYS = {
    COMPLETED_VIDEOS: 'marrow_planner_completed_videos',
    GOALS: 'marrow_planner_goals',
    THEME: 'marrow_planner_theme',
    STREAK: 'marrow_planner_streak',
    DAILY_BATCH: 'marrow_planner_daily_batch',
    PERSONAL: 'marrow_planner_personal',
    URGENCY: 'marrow_planner_urgency',
    DAILY_HISTORY: 'marrow_planner_daily_history',
    QUEUE_BATCH: 'marrow_planner_queue_completed_in_batch',
    QUEUE_BATCH_VIDEOS: 'marrow_planner_queue_batch_videos',
    TUTORIAL_SEEN: 'flowmd_tutorial_seen',
    // Dual-Subject Tracking v2
    PLANS: 'flowmd_plans_v2',
    DAILY_HISTORY_BY_SUBJECT: 'flowmd_daily_history_by_subject'
  };

  // --- Study Sources ---
  const STUDY_SOURCES = [
    { id: 'marrow_8', label: 'Marrow Edition 8', short: 'Marrow 8' },
    { id: 'marrow_6_5', label: 'Marrow Edition 6.5', short: 'Marrow 6.5' },
    { id: 'prepladder_x', label: 'Prepladder X', short: 'Prepladder X' }
  ];

  // --- Dual-Subject Plan Defaults ---
  const DEFAULT_PLAN = (id, label, accentColor) => ({
    id,
    label,
    accentColor,
    targetSubject: '',
    targetDate: '2026-08-15',
    videosPerDay: 8,
    videosPerWeek: 56,
    videosPerMonth: 240,
    dailyTargetHours: 3.5,
    queueBatchVideoIds: [],
    queueCompletedInBatch: 0,
    targetUnits: []
  });

  const PLAN_A_ACCENT = '#3b82f6';   // cobalt blue
  const PLAN_B_ACCENT = '#f43f5e';   // rose pink

  const DEFAULT_PERSONAL = {
    doctorName: 'Dr. Aspirant'
  };

  const DEFAULT_GOALS = {
    goalMode: 'video',
    targetDate: '2026-08-15',
    videosPerDay: 8,
    videosPerWeek: 56,
    videosPerMonth: 202,
    dailyTargetHours: 3.5,
    weeklyTargetHours: 24.5,
    monthlyTargetHours: 105,
    targetSubject: '',
    visibleCards: { daily: true, weekly: true, monthly: true }
  };

const SUBJECT_ICONS = {
    anatomy: 'icons/anatomy.png',
    physiology: 'icons/physiology.png',
    biochemistry: 'icons/biochemistry.png',
    pathology: 'icons/pathology.png',
    pharmacology: 'icons/pharmacology.png',
    microbiology: 'icons/microbiology.png',
    community_medicine: 'icons/community_medicine.png',
    forensic_medicine: 'icons/forensic_medicine.png',
    ophthalmology: 'icons/ophthalmology.png',
    otorhinolaryngology__ent_: 'icons/otorhinolaryngology__ent_.png',
    anaesthesia: 'icons/anaesthesia.png',
    dermatology: 'icons/dermatology.png',
    psychiatry: 'icons/psychiatry.png',
    radiology: 'icons/radiology.png',
    medicine: 'icons/medicine.png',
    surgery: 'icons/surgery.png',
    orthopaedics: 'icons/orthopaedics.png',
    paediatrics: 'icons/paediatrics.png',
    obstetrics___gynaecology: 'icons/obstetrics___gynaecology.png',
    revision_videos: 'icons/revision_videos.png'
  };

  const SUBJECT_SVG_ICONS = {
    anatomy: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6c-3.3 0-6 2.7-6 6v4c0 3.3 2.7 6 6 6s6-2.7 6-6v-4c0-3.3-2.7-6-6-6z"/><path d="M24 16v10"/><path d="M14 20h20"/><path d="M24 26v10"/><path d="M14 42l6-10 6 10"/><path d="M10 20l-4 6"/><path d="M38 20l4 6"/><path d="M14 36l-6 10"/><path d="M34 36l6 10"/></svg>`,
    physiology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 44c16 0 28-16 28-22 0-6-12-10-28-10S-4 16-4 22c0 6 12 10 28 10z"/><path d="M10 28c6-6 12-6 18 0 6 6 6 12 0 18"/></svg>`,
    biochemistry: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h12"/><path d="M20 10v16l-8 16c-1 2 0 4 2 4h20c2 0 3-2 2-4l-8-16V10"/><circle cx="22" cy="34" r="2"/><circle cx="28" cy="32" r="1.5"/><circle cx="25" cy="36" r="1"/><path d="M14 8l2-2"/><path d="M34 8l-2-2"/></svg>`,
    pathology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 42V18l-4-8h20l-4 8v24"/><path d="M14 10h20"/><circle cx="24" cy="28" r="4"/><circle cx="20" cy="34" r="2"/><circle cx="28" cy="32" r="1.5"/><path d="M22 18h4"/><path d="M24 18v-4"/><path d="M20 8l-2-4"/><path d="M28 8l2-4"/></svg>`,
    pharmacology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="16" height="24" rx="2"/><path d="M20 16V10c0-2 2-4 4-4s4 2 4 4v6"/><path d="M16 24h16"/><path d="M20 8h8"/><path d="M22 28h4"/><path d="M24 28v6"/><path d="M36 20l6-6"/><path d="M38 26l4-2"/></svg>`,
    microbiology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="26" rx="12" ry="10"/><path d="M12 26c0-6 5-10 12-10s12 4 12 10"/><circle cx="20" cy="24" r="2"/><circle cx="28" cy="22" r="1.5"/><circle cx="24" cy="28" r="2.5"/><circle cx="18" cy="30" r="1"/><path d="M24 16v-6"/><circle cx="24" cy="8" r="2"/></svg>`,
    community_medicine: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="18" r="6"/><circle cx="12" cy="22" r="4"/><circle cx="36" cy="22" r="4"/><path d="M18 36c0-4 3-6 6-6s6 2 6 6"/><path d="M8 38c0-3 2-5 4-5"/><path d="M36 38c0-3 2-5 4-5"/><path d="M24 10v-4"/><path d="M20 14h8"/></svg>`,
    forensic_medicine: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 12l6 6"/><path d="M20 18l16-6"/><path d="M36 12l-6 6"/><path d="M30 18l-4 14"/><path d="M26 32l-6 6"/><path d="M20 38l-4-2"/><path d="M16 36l-2-6"/><path d="M14 30l4-12"/><rect x="28" y="8" width="12" height="6" rx="1"/><path d="M30 14v4h8v-4"/></svg>`,
    ophthalmology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="24" rx="14" ry="8"/><circle cx="24" cy="24" r="4"/><circle cx="24" cy="24" r="1.5"/><path d="M24 4v6"/><path d="M24 38v6"/><path d="M4 24h6"/><path d="M38 24h6"/><path d="M10 10l4 4"/><path d="M34 34l4 4"/><path d="M38 10l-4 4"/><path d="M14 34l-4 4"/></svg>`,
    orthopaedics: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6c-4 0-6 4-6 8v8c0 4 2 6 4 8l2 4v8h12v-8l2-4c2-2 4-4 4-8v-8c0-4-2-8-6-8"/><path d="M18 20h12"/><path d="M16 28h16"/><circle cx="24" cy="14" r="3"/></svg>`,
    otorhinolaryngology__ent_: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 12c4 0 6 3 6 6s-2 6-6 6h-2v8c0 2-2 4-4 4"/><path d="M26 36h-6c-2 0-4-2-4-4v-4"/><ellipse cx="28" cy="20" rx="6" ry="8"/><path d="M22 18c-2-4-6-4-8-2s-2 6 0 8c2 2 4 6 4 10"/><path d="M18 16c-4-2-8 0-8 4"/></svg>`,
    paediatrics: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="16" r="8"/><circle cx="21" cy="14" r="1.5"/><circle cx="27" cy="14" r="1.5"/><path d="M21 19c1 1 3 1 4 0"/><path d="M24 24v6c0 4 2 6 4 8h4"/><path d="M24 24v6c0 4-2 6-4 8h-4"/><path d="M16 30l-4 4"/><path d="M32 30l4 4"/><path d="M22 38h4"/></svg>`,
    radiology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="6" width="28" height="36" rx="2"/><path d="M18 14h12"/><path d="M24 14v20"/><path d="M18 20h12"/><path d="M18 26h12"/><path d="M18 14l-4-4"/><path d="M30 14l4-4"/><path d="M18 34l-4 4"/><path d="M30 34l4 4"/></svg>`,
    surgery: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40l20-20"/><path d="M28 20l4-4"/><path d="M32 16l4-4"/><path d="M36 12l4-4"/><path d="M28 20c-2-4-2-8 0-12"/><path d="M26 22c-4-2-8-2-12 0"/><path d="M14 22l-4 4"/><path d="M10 26l-2 4"/></svg>`,
    anaesthesia: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 28c0-6 4-10 10-10s10 4 10 10"/><path d="M18 28v4c0 2 2 4 6 4s6-2 6-4v-4"/><path d="M12 24h-4v8h4"/><path d="M36 24h4v8h-4"/><circle cx="38" cy="18" r="3"/><path d="M36 18h-4"/><path d="M10 18l4-4"/><path d="M14 14v-4h6"/><path d="M34 32l4 4"/></svg>`,
    dermatology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="20" r="10"/><path d="M20 18c1-2 3-2 4 0s3 2 4 0"/><path d="M19 24c2 1 4 1 6 0s4-1 6 0"/><circle cx="18" cy="34" r="4"/><path d="M22 34h8"/><circle cx="34" cy="34" r="2"/><path d="M32 10l4-4"/><path d="M36 10l-2-6"/><path d="M38 8l2-4"/></svg>`,
    psychiatry: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 38c-4-2-6-6-6-12 0-8 6-14 14-14s14 6 14 14c0 6-2 10-6 12"/><path d="M16 26c0-4 4-8 8-8"/><path d="M32 26c0-4-4-8-8-8"/><path d="M20 32c2 2 6 2 8 0"/><path d="M18 20c-2-4-2-8 0-12"/><path d="M30 20c2-4 2-8 0-12"/><path d="M24 8v-4"/></svg>`,
    medicine: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="14" r="6"/><path d="M24 20v6"/><circle cx="24" cy="32" r="4"/><path d="M24 36v4"/><path d="M18 40h12"/><path d="M14 14h-4"/><path d="M34 14h4"/><path d="M16 8l-4-4"/><path d="M32 8l4-4"/></svg>`,
    obstetrics___gynaecology: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="12" r="5"/><path d="M24 17v8"/><path d="M16 25c0 6 3 10 8 10s8-4 8-10"/><path d="M16 25c-4 0-6 3-6 6s2 4 6 4"/><path d="M32 25c4 0 6 3 6 6s-2 4-6 4"/><path d="M20 35l4 6 4-6"/></svg>`,
    revision_videos: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8a16 16 0 1 0 4 31.4"/><path d="M24 8a16 16 0 1 1-4 31.4"/><path d="M24 6v8"/><path d="M24 14l-4-6 4-2 4 2-4 6z"/><path d="M20 30h8"/><path d="M20 26h6"/><path d="M20 34h4"/></svg>`
  };

  const SUBJECT_COLORS = {
    anaesthesia: '#10b981', anatomy: '#a855f7', biochemistry: '#d946ef',
    community_medicine: '#14b8a6', dermatology: '#f59e0b', forensic_medicine: '#eab308',
    medicine: '#3b82f6', microbiology: '#22c55e', obstetrics___gynaecology: '#ef4444',
    ophthalmology: '#06b6d4', orthopaedics: '#a855f7', otorhinolaryngology__ent_: '#14b8a6',
    paediatrics: '#ef4444', pathology: '#22c55e', pharmacology: '#f59e0b',
    physiology: '#ef4444', psychiatry: '#a855f7', radiology: '#3b82f6', surgery: '#ef4444', revision_videos: '#8b5cf6'
  };

  const SUBJECT_FACULTY = {
    anatomy: 'Dr. Raviraj',
    physiology: 'Dr. Krishna Kumar',
    biochemistry: 'Dr. Rebecca James',
    pathology: 'Dr. Ila Jain Khandelwal',
    pharmacology: 'Dr. Ranjan Kumar Patel',
    microbiology: 'Dr. Shivika',
    community_medicine: 'Dr. Mukhmohit Singh',
    forensic_medicine: 'Dr. Magendran J',
    ophthalmology: 'Dr. Utsav Bansal',
    otorhinolaryngology__ent_: 'Dr. Manisha Sinha Budhiraja',
    anaesthesia: 'Dr. Rama Krishna Chaitanya',
    dermatology: 'Dr. Malcolm Pinto',
    psychiatry: 'Dr. Mohan Sunil Kumar',
    radiology: 'Dr. Mayur Arun Kulkarni',
    medicine: 'Dr. Rakesh S Nair',
    surgery: 'Dr. Rohan Khandelwal',
    orthopaedics: 'Dr. Abbas Ali',
    paediatrics: 'Dr. Singaram',
    obstetrics___gynaecology: 'Dr. Sakshi Arora',
    revision_videos: 'Multiple Marrow Faculties (Subject-Wise Revision Series)'
  };

  function getSubjectIconSrc(subjectIdOrName) {
    if (!subjectIdOrName) return 'icons/medicine.png';
    const key = subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (SUBJECT_ICONS[key]) return SUBJECT_ICONS[key];
    for (const [id, src] of Object.entries(SUBJECT_ICONS)) {
      if (key.includes(id) || id.includes(key)) return src;
    }
    return 'icons/medicine.png';
  }

  function getSubjectSvgIcon(subjectIdOrName) {
    if (!subjectIdOrName) return SUBJECT_SVG_ICONS.medicine;
    const key = subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (SUBJECT_SVG_ICONS[key]) return SUBJECT_SVG_ICONS[key];
    for (const [id, svg] of Object.entries(SUBJECT_SVG_ICONS)) {
      if (key.includes(id) || id.includes(key)) return svg;
    }
    return SUBJECT_SVG_ICONS.medicine;
  }

function getSubjectAccentColor(subjectIdOrName) {
    if (!subjectIdOrName) return '#3b82f6';
    const key = subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (SUBJECT_COLORS[key]) return SUBJECT_COLORS[key];
    for (const [id, c] of Object.entries(SUBJECT_COLORS)) {
      if (key.includes(id) || id.includes(key)) return c;
    }
    return '#3b82f6';
  }

  function getSubjectFaculty(subjectIdOrName) {
    if (!subjectIdOrName) return 'Marrow Faculty';
    const key = subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (SUBJECT_FACULTY[key]) return SUBJECT_FACULTY[key];
    for (const [id, faculty] of Object.entries(SUBJECT_FACULTY)) {
      if (key.includes(id) || id.includes(key)) return faculty;
    }
    return 'Marrow Faculty';
  }

  function getSubjectColor(subjectIdOrName) {
    if (!subjectIdOrName) return '#3b82f6';
    const key = subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    if (SUBJECT_COLORS[key]) return SUBJECT_COLORS[key];
    for (const [id, c] of Object.entries(SUBJECT_COLORS)) {
      if (key.includes(id) || id.includes(key)) return c;
    }
    return '#3b82f6';
  }

  function getSubjectName(subjectIdOrName) {
    if (!subjectIdOrName) return '';
    const key = subjectIdOrName.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    const subjectNames = {
      anatomy: 'Anatomy',
      physiology: 'Physiology',
      biochemistry: 'Biochemistry',
      pathology: 'Pathology',
      pharmacology: 'Pharmacology',
      microbiology: 'Microbiology',
      community_medicine: 'Community Medicine',
      forensic_medicine: 'Forensic Medicine',
      ophthalmology: 'Ophthalmology',
      otorhinolaryngology__ent_: 'ENT',
      anaesthesia: 'Anaesthesia',
      dermatology: 'Dermatology',
      psychiatry: 'Psychiatry',
      radiology: 'Radiology',
      medicine: 'Medicine',
      surgery: 'Surgery',
      orthopaedics: 'Orthopaedics',
      paediatrics: 'Paediatrics',
      obstetrics___gynaecology: 'Obstetrics & Gynaecology',
      revision_videos: 'Revision Videos'
    };
    return subjectNames[key] || subjectIdOrName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // --- Multi-Source Data Layer ---
  const SOURCE_DATA = {};

  function qualifySourceData(sourceId, data) {
    return data.map(subject => ({
      ...subject,
      chapters: (subject.chapters || []).map(chap => ({
        ...chap,
        videos: (chap.videos || []).map(v => ({
          ...v,
          id: sourceId + '::' + v.id
        }))
      }))
    }));
  }

  function initSourceData() {
    const srcData = {
      marrow_8: (typeof syllabusData !== 'undefined' && Array.isArray(syllabusData)) ? syllabusData : null,
      marrow_6_5: (typeof syllabusData65 !== 'undefined' && Array.isArray(syllabusData65)) ? syllabusData65 : null,
      prepladder_x: null
    };
    Object.entries(srcData).forEach(([src, data]) => {
      SOURCE_DATA[src] = (data && Array.isArray(data)) ? qualifySourceData(src, data) : [];
    });
  }

  function getDataset(sourceId) {
    const sid = sourceId || state.activeSource || 'marrow_8';
    return SOURCE_DATA[sid] || [];
  }

  function getSyllabusStatsForSource(sourceId) {
    const sid = sourceId || state.activeSource || 'marrow_8';
    const prevActive = state.activeSource;
    if (sid === prevActive) return getSyllabusStats();
    state.activeSource = sid;
    try {
      return getSyllabusStats();
    } finally {
      state.activeSource = prevActive;
    }
  }

  // --- App State ---
  let state = {
    currentView: 'dashboard',
    activeSubjectId: 'anatomy',
    completedVideos: {},
    expandedChapters: {},
    goals: { ...DEFAULT_GOALS },
    personal: { ...DEFAULT_PERSONAL },
    theme: 'dark',
    themeStyle: 'modern',
    searchQuery: '',
    streakData: { lastStudyDate: null, currentStreak: 0 },
    dailyHistory: {},
    queueCompletedInBatch: 0,
    queueBatchVideoIds: [],
    isConfigured: false,
    activeSource: 'marrow_8',
    // Dual-Subject Tracking v2
    plans: [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)],
    activePlanId: 'plan_a',
    dailyHistoryBySubject: {}
  };

  const DOM = {};

  // --- Initialization ---
  function init() {
    initSourceData();
    loadState();
    cacheDOM();
    applyTheme(state.theme);
    bindEvents();
    initFirebaseSync();
    render();
    resetPageScrollTop();

    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      state.canInstallPWA = true;
      if (typeof render === 'function' && DOM.appMain) render();
    });
  }

  // --- State Persistence & Cloud Sync ---
  function loadState() {
    try {
      const savedVideos = localStorage.getItem(STORAGE_KEYS.COMPLETED_VIDEOS);
      if (savedVideos) state.completedVideos = JSON.parse(savedVideos);

      // Migrate legacy (pre-namespaced) video IDs → marrow_8:: prefix
      let needsMigrate = false;
      const migrated = {};
      for (const key in state.completedVideos) {
        if (key.indexOf('::') === -1) {
          migrated['marrow_8::' + key] = state.completedVideos[key];
          needsMigrate = true;
        } else {
          migrated[key] = state.completedVideos[key];
        }
      }
      if (needsMigrate) state.completedVideos = migrated;

      const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (savedGoals) state.goals = { ...DEFAULT_GOALS, ...JSON.parse(savedGoals) };

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        state.theme = savedTheme;
      } else {
        state.theme = 'dark';
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
      }

      const savedThemeStyle = localStorage.getItem('marrow_planner_theme_style');
      if (savedThemeStyle === 'modern' || savedThemeStyle === 'retro') {
        state.themeStyle = savedThemeStyle;
      } else {
        state.themeStyle = 'modern';
      }

      const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (savedStreak) state.streakData = JSON.parse(savedStreak);

      const savedPersonal = localStorage.getItem(STORAGE_KEYS.PERSONAL);
      if (savedPersonal) state.personal = { ...DEFAULT_PERSONAL, ...JSON.parse(savedPersonal) };

      const savedHistory = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY);
      if (savedHistory) state.dailyHistory = JSON.parse(savedHistory);

      const savedQueueBatch = localStorage.getItem(STORAGE_KEYS.QUEUE_BATCH);
      if (savedQueueBatch !== null) state.queueCompletedInBatch = parseInt(savedQueueBatch) || 0;

      const savedBatchVids = localStorage.getItem(STORAGE_KEYS.QUEUE_BATCH_VIDEOS);
      if (savedBatchVids) state.queueBatchVideoIds = JSON.parse(savedBatchVids);

      const savedTutorial = localStorage.getItem(STORAGE_KEYS.TUTORIAL_SEEN);
      if (savedTutorial === 'true') state.isConfigured = true;

      const savedSource = localStorage.getItem('flowmd_active_source');
      if (savedSource && STUDY_SOURCES.some(s => s.id === savedSource)) {
        state.activeSource = savedSource;
      }

      const savedConfigured = localStorage.getItem('flowmd_is_configured');
      if (savedConfigured === 'true') state.isConfigured = true;

      // --- Dual-Subject Tracking v2: load plans ---
      const savedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (savedPlans) {
        const parsed = JSON.parse(savedPlans);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.plans = parsed;
        }
      } else {
        // Migrate legacy single-subject state to Plan A
        migrateStateToPlans();
      }

      const savedHistBySubject = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT);
      if (savedHistBySubject) state.dailyHistoryBySubject = JSON.parse(savedHistBySubject);

    } catch (e) {
      console.warn('Error loading state:', e);
    }
  }

  // --- Migrate legacy single-plan state → plans[] ---
  function migrateStateToPlans() {
    const legacySub = (state.goals && state.goals.targetSubject) || '';
    const legacyDate = (state.goals && state.goals.targetDate) || '2026-08-15';
    const legacyVids = (state.goals && state.goals.videosPerDay) || 8;
    const legacyHours = (state.goals && state.goals.dailyTargetHours) || 3.5;
    const legacyBatch = Array.isArray(state.queueBatchVideoIds) ? state.queueBatchVideoIds : [];
    const legacyDone = state.queueCompletedInBatch || 0;

    state.plans = [{
      id: 'plan_a',
      label: 'Plan A',
      accentColor: PLAN_A_ACCENT,
      targetSubject: legacySub,
      targetDate: legacyDate,
      videosPerDay: legacyVids,
      videosPerWeek: legacyVids * 7,
      videosPerMonth: legacyVids * 30,
      dailyTargetHours: legacyHours,
      queueBatchVideoIds: legacyBatch,
      queueCompletedInBatch: legacyDone,
      targetUnits: []
    }];
  }

  let cloudSyncTimeout = null;
  let deferredInstallPrompt = null;
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETED_VIDEOS, JSON.stringify(state.completedVideos));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(state.goals));
      localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
      localStorage.setItem('marrow_planner_theme_style', state.themeStyle || 'modern');
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(state.streakData));
      localStorage.setItem(STORAGE_KEYS.PERSONAL, JSON.stringify(state.personal));
      localStorage.setItem(STORAGE_KEYS.DAILY_HISTORY, JSON.stringify(state.dailyHistory || {}));
      localStorage.setItem(STORAGE_KEYS.QUEUE_BATCH, (state.queueCompletedInBatch || 0).toString());
      localStorage.setItem(STORAGE_KEYS.QUEUE_BATCH_VIDEOS, JSON.stringify(state.queueBatchVideoIds || []));
      localStorage.setItem('flowmd_active_source', state.activeSource || 'marrow_8');
      localStorage.setItem('flowmd_is_configured', state.isConfigured ? 'true' : 'false');
      // Dual-Subject Tracking v2
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(state.plans || []));
      localStorage.setItem(STORAGE_KEYS.DAILY_HISTORY_BY_SUBJECT, JSON.stringify(state.dailyHistoryBySubject || {}));

      if (window.FirebaseSync && window.FirebaseSync.currentUser) {
        if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
        cloudSyncTimeout = setTimeout(() => {
          window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state);
        }, 800);
      }
    } catch (e) {
      console.warn('Error saving state:', e);
    }
  }

  function markStudyActivity(isAdding = true) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!state.streakData) state.streakData = { lastStudyDate: null, currentStreak: 0 };
    if (!state.dailyHistory) state.dailyHistory = {};

    const curCount = state.dailyHistory[todayStr] || 0;
    if (isAdding) {
      state.dailyHistory[todayStr] = curCount + 1;
    } else {
      state.dailyHistory[todayStr] = Math.max(0, curCount - 1);
    }

    if (isAdding) {
      if (state.streakData.lastStudyDate !== todayStr) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (state.streakData.lastStudyDate === yesterday) {
          state.streakData.currentStreak = (state.streakData.currentStreak || 0) + 1;
        } else {
          state.streakData.currentStreak = 1;
        }
        state.streakData.lastStudyDate = todayStr;
      }
    }
    saveState();
  }

  function getStudyStreak() {
    const streak = state.streakData || { lastStudyDate: null, currentStreak: 0 };
    return streak.currentStreak || 0;
  }

  function getDeadlineCountdown(targetDateStr) {
    const now = new Date();
    const target = new Date(targetDateStr || '2026-08-15');
    const diff = target - now;
    if (diff <= 0) return { text: 'Deadline Passed', days: 0, hours: 0, mins: 0, secs: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `${days}d ${hours}h ${mins}m ${secs}s`,
      days, hours, mins, secs
    };
  }

  function calculateFinishETA(metrics, dailyPace) {
    const pace = Math.max(1, parseInt(dailyPace) || 1);
    const remVids = metrics.remainingVideos;
    const daysNeeded = Math.ceil(remVids / pace);
    const finishDate = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
    const formattedDate = finishDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return {
      date: formattedDate,
      daysNeeded,
      remVids,
      pace
    };
  }

  // --- Chapter-Scope Helpers (Focus Chapters per Plan) ---
  function getSubjectChapters(subjectNameOrId) {
    const dataset = getDataset();
    if (!dataset || dataset.length === 0) return [];
    const sub = dataset.find(s => s && (s.subject === subjectNameOrId || s.id === subjectNameOrId));
    return (sub && sub.chapters) ? sub.chapters : [];
  }

  function getScopedChapterNames(plan) {
    if (!plan || !plan.targetSubject || !Array.isArray(plan.targetUnits) || plan.targetUnits.length === 0) return [];
    const names = plan.targetUnits.map(u => String(u));
    return getSubjectChapters(plan.targetSubject)
      .filter(c => c && names.indexOf(String(c.name)) !== -1)
      .map(c => c.name);
  }

  // Flatten videos of only the plan's focused chapters (all chapters when unscoped)
  function getPlanScopeVideos(plan) {
    const dataset = getDataset();
    const targetSub = (plan && plan.targetSubject) || '';
    if (!targetSub || dataset.length === 0) return [];
    const subjectObj = dataset.find(s => s && (s.subject === targetSub || s.id === targetSub));
    if (!subjectObj || !subjectObj.chapters) return [];

    let chapters = subjectObj.chapters;
    if (Array.isArray(plan.targetUnits) && plan.targetUnits.length > 0) {
      const names = plan.targetUnits.map(u => String(u));
      const matching = subjectObj.chapters.filter(c => c && names.indexOf(String(c.name)) !== -1);
      if (matching.length > 0) chapters = matching;
    }

    const videos = [];
    chapters.forEach(chap => {
      if (chap && chap.videos) {
        chap.videos.forEach(v => {
          videos.push({ ...v, subjectName: subjectObj.subject, chapterName: chap.name, subjectId: subjectObj.id });
        });
      }
    });
    return videos;
  }

  function computeMetricsFromVideos(videos) {
    let totalVideos = 0;
    let completedVideosCount = 0;
    let totalDurationMins = 0;
    let completedDurationMins = 0;
    (videos || []).forEach(video => {
      totalVideos++;
      const mins = (video.durationMins || 0) + (video.durationSecs || 0) / 60;
      totalDurationMins += mins;
      if (state.completedVideos[video.id]) {
        completedVideosCount++;
        completedDurationMins += mins;
      }
    });
    return {
      name: (videos && videos[0]) ? videos[0].subjectName : '',
      totalVideos,
      completedVideos: completedVideosCount,
      remainingVideos: Math.max(1, totalVideos - completedVideosCount),
      totalHours: (totalDurationMins / 60).toFixed(1),
      completedHours: (completedDurationMins / 60).toFixed(1),
      remainingHours: Math.max(0.1, (totalDurationMins - completedDurationMins) / 60)
    };
  }

  function getSubjectOrSyllabusMetricsForPlan(plan) {
    if (!plan || !plan.targetSubject) return getSubjectOrSyllabusMetrics('');
    return computeMetricsFromVideos(getPlanScopeVideos(plan));
  }

  // Metrics for a live (pre-save) scope selection in the goal modal
  function getMetricsForModalScope(subjectVal, selectedUnits, sourceId) {
    const prevActive = state.activeSource;
    if (sourceId) state.activeSource = sourceId;
    try {
      const dataset = getDataset();
      const sub = dataset.find(s => s && (s.subject === subjectVal || s.id === subjectVal));
      if (!sub) return getSubjectOrSyllabusMetrics(subjectVal);

      let units = sub.chapters || [];
      const totalChapters = units.length;
      let scopedChapters = totalChapters;
      if (selectedUnits && selectedUnits.length > 0) {
        const names = selectedUnits.map(u => String(u));
        const matching = units.filter(c => c && names.indexOf(String(c.name)) !== -1);
        if (matching.length > 0) {
          units = matching;
          scopedChapters = matching.length;
        }
      }
      const videos = [];
      units.forEach(chap => {
        if (chap && chap.videos) {
          chap.videos.forEach(v => videos.push({ ...v, subjectName: sub.subject, chapterName: chap.name, subjectId: sub.id }));
        }
      });
      const m = computeMetricsFromVideos(videos);
      m.totalChapters = totalChapters;
      m.scopedChapters = scopedChapters;
      return m;
    } finally {
      state.activeSource = prevActive;
    }
  }

  // --- Per-Plan Queue Engine ---
  function getTodayQueueForPlan(plan) {
    const targetSub = plan.targetSubject || '';
    const baseTargetPace = Math.max(1, parseInt(plan.videosPerDay) || 1);
    const dataset = getDataset();

    const allSubjectVideos = getPlanScopeVideos(plan);
    let subjectName = targetSub;
    let subjectObj = null;

    if (targetSub && dataset.length > 0) {
      subjectObj = dataset.find(s => s && (s.subject === targetSub || s.id === targetSub));
      if (subjectObj) subjectName = subjectObj.subject;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (plan.lastBatchDate !== todayStr) {
      plan.lastBatchDate = todayStr;
      plan.extraBatchesCompletedToday = 0;
    }

    if (!Array.isArray(plan.queueBatchVideoIds)) plan.queueBatchVideoIds = [];

    const existingBatchVideos = allSubjectVideos.filter(v => plan.queueBatchVideoIds.includes(v.id));
    const targetBatchSize = Math.min(baseTargetPace, allSubjectVideos.length || baseTargetPace);

    if (existingBatchVideos.length === 0 || existingBatchVideos.length !== targetBatchSize) {
      const uncompletedCandidates = allSubjectVideos.filter(v => !state.completedVideos[v.id]);
      const newBatch = uncompletedCandidates.slice(0, baseTargetPace);
      plan.queueBatchVideoIds = newBatch.map(v => v.id);
      saveState();
    }

    const todaysQueueVideos = allSubjectVideos.filter(v => plan.queueBatchVideoIds.includes(v.id));
    const queueCompletedInBatch = todaysQueueVideos.filter(v => !!state.completedVideos[v.id]).length;
    plan.queueCompletedInBatch = queueCompletedInBatch;

    const isDailyTargetAchieved = todaysQueueVideos.length > 0 && todaysQueueVideos.every(v => !!state.completedVideos[v.id]);
    const allDone = todaysQueueVideos.length === 0;

    return {
      planId: plan.id,
      planLabel: plan.label,
      planAccentColor: plan.accentColor,
      subjectName,
      subjectId: subjectObj ? subjectObj.id : (allSubjectVideos[0] ? allSubjectVideos[0].subjectId : 'anatomy'),
      baseTargetPace,
      queueCompletedInBatch,
      isDailyTargetAchieved,
      allSubjectDone: allDone,
      videos: todaysQueueVideos
    };
  }

  // Get all active plans' queues
  function getAllPlanQueues() {
    if (!state.plans || state.plans.length === 0) {
      state.plans = [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    }
    return state.plans.map(plan => getTodayQueueForPlan(plan));
  }

  // Legacy compat wrapper — used by older code paths
  function getTodaysActionQueue() {
    const queues = getAllPlanQueues();
    return queues[0] || { subjectName: '', subjectId: 'anatomy', baseTargetPace: 8, queueCompletedInBatch: 0, isDailyTargetAchieved: false, allSubjectDone: false, videos: [] };
  }

  // Get plan by ID
  function getPlanById(planId) {
    return state.plans && state.plans.find(p => p.id === planId);
  }



  function initFirebaseSync() {
    if (!window.FirebaseSync) return;
    window.FirebaseSync.onAuthChange(async (user) => {
      if (user) {
        showToast(`Signed in as ${user.email}`, 'account_circle');
        const cloudState = await window.FirebaseSync.loadFromCloud(user.uid);
        if (cloudState) {
          if (cloudState.completedVideos) state.completedVideos = { ...state.completedVideos, ...cloudState.completedVideos };
          if (cloudState.goals) state.goals = { ...state.goals, ...cloudState.goals };
          if (cloudState.personal) state.personal = { ...state.personal, ...cloudState.personal };
          if (cloudState.dailyHistory) state.dailyHistory = { ...state.dailyHistory, ...cloudState.dailyHistory };
          saveState();
        } else {
          window.FirebaseSync.syncToCloud(user.uid, state);
        }
        state.personal.isSynced = true;
        state.personal.syncEmail = user.email;
      } else {
        state.personal.isSynced = false;
        state.personal.syncEmail = '';
      }
      render();
    });
  }

  // --- Syllabus Math Engine ---
  function getSyllabusStats() {
    const dataset = getDataset();
    if (!dataset || dataset.length === 0) return { totalVideos: 0, completedVideos: 0, percentage: 0, subjectsStats: [] };

    let totalVideos = 0;
    let completedVideosCount = 0;
    let totalDurationMins = 0;
    let completedDurationMins = 0;

    const subjectsStats = dataset.map(subject => {
      let subVideos = 0;
      let subCompleted = 0;
      let subDuration = 0;
      let subCompletedDuration = 0;

      if (subject.chapters) {
        subject.chapters.forEach(chapter => {
          if (chapter.videos) {
            chapter.videos.forEach(video => {
              subVideos++;
              totalVideos++;
              const mins = (video.durationMins || 0) + (video.durationSecs || 0) / 60;
              subDuration += mins;
              totalDurationMins += mins;

              if (state.completedVideos[video.id]) {
                subCompleted++;
                completedVideosCount++;
                subCompletedDuration += mins;
                completedDurationMins += mins;
              }
            });
          }
        });
      }

      const subPercentage = subVideos > 0 ? Math.round((subCompleted / subVideos) * 100) : 0;
      return {
        id: subject.id,
        name: subject.subject,
        totalVideos: subVideos,
        completedVideos: subCompleted,
        totalHours: (subDuration / 60).toFixed(1),
        completedHours: (subCompletedDuration / 60).toFixed(1),
        percentage: subPercentage,
        icon: getSubjectIconSrc(subject.id || subject.subject),
        svgIcon: getSubjectSvgIcon(subject.id || subject.subject),
        accentColor: getSubjectAccentColor(subject.id || subject.subject),
        faculty: getSubjectFaculty(subject.id || subject.subject),
        raw: subject
      };
    });

    const percentage = totalVideos > 0 ? Math.round((completedVideosCount / totalVideos) * 100) : 0;

    return {
      totalVideos,
      completedVideos: completedVideosCount,
      totalHours: (totalDurationMins / 60).toFixed(1),
      completedHours: (completedDurationMins / 60).toFixed(1),
      percentage,
      subjectsStats
    };
  }

  // --- Deep Global Search Engine ---
  function performDeepSearch(query) {
    const dataset = getDataset();
    if (!query || !dataset || dataset.length === 0) {
      return { subjects: [], chapters: [], videos: [], totalMatches: 0 };
    }

    const q = query.toLowerCase().trim();
    const matchedSubjects = [];
    const matchedChapters = [];
    const matchedVideos = [];

    dataset.forEach(subject => {
      const subName = subject.subject || '';
      const subId = subject.id || subName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const subIcon = getSubjectIconSrc(subId);

      if (subName.toLowerCase().includes(q)) {
        matchedSubjects.push({
          id: subId,
          name: subName,
          icon: subIcon,
          chaptersCount: subject.chapters ? subject.chapters.length : 0,
          videosCount: subject.chapters ? subject.chapters.reduce((acc, c) => acc + (c.videos ? c.videos.length : 0), 0) : 0
        });
      }

      if (subject.chapters) {
        subject.chapters.forEach(chapter => {
          const chapName = chapter.name || '';
          if (chapName.toLowerCase().includes(q)) {
            matchedChapters.push({
              chapterName: chapName,
              subjectName: subName,
              subjectId: subId,
              videoCount: chapter.videos ? chapter.videos.length : 0,
              icon: subIcon
            });
          }

          if (chapter.videos) {
            chapter.videos.forEach(v => {
              const vTitle = v.title || '';
              const vNum = v.videoNumber || '';
              if (vTitle.toLowerCase().includes(q) || vNum.toLowerCase().includes(q)) {
                matchedVideos.push({
                  id: v.id,
                  title: vTitle,
                  videoNumber: vNum,
                  durationMins: v.durationMins || 0,
                  durationSecs: v.durationSecs || 0,
                  subjectName: subName,
                  subjectId: subId,
                  chapterName: chapName,
                  isCompleted: !!state.completedVideos[v.id]
                });
              }
            });
          }
        });
      }
    });

    const totalMatches = matchedSubjects.length + matchedChapters.length + matchedVideos.length;

    return {
      subjects: matchedSubjects.slice(0, 8),
      chapters: matchedChapters.slice(0, 12),
      videos: matchedVideos.slice(0, 30),
      totalMatches
    };
  }

  // --- Spotlight Search Modal Engine ---
  function openSpotlightModal(initialQuery = '') {
    const modal = document.getElementById('spotlight-search-modal');
    const input = document.getElementById('spotlight-search-input');
    if (!modal || !input) return;

    modal.style.display = 'flex';
    input.value = initialQuery || state.searchQuery || '';
    setTimeout(() => input.focus(), 50);
    renderSpotlightResults(input.value);
  }

  function closeSpotlightModal() {
    const modal = document.getElementById('spotlight-search-modal');
    if (modal) modal.style.display = 'none';
  }

  function renderSpotlightResults(query) {
    const container = document.getElementById('spotlight-results-container');
    if (!container) return;

    const q = (query || '').trim().toLowerCase();

    if (!q) {
      // Search Guide — helps users understand the search functionality
      container.innerHTML = `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">search</span> What Can You Search?</div>
        <div style="font-family: var(--font-hud); font-size: 0.88rem; color: var(--text-muted); padding: 8px 0 4px 4px; line-height: 1.8;">
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Subjects</strong> — e.g. "anatomy", "pharmacology", "medicine"</div>
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Chapters</strong> — e.g. "cardiovascular", "neurology", "head and neck"</div>
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Video Topics</strong> — e.g. "glaucoma", "MI", "fracture", "biochemistry"</div>
        </div>
      `;

      return;
    }

    // Deep search results only (no command palette shortcuts)
    const searchData = performDeepSearch(q);

    if (searchData.totalMatches === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 0; font-family: var(--font-hud); font-size: 1.1rem;">
          No matching subjects, chapters, or video topics found for "${q}". Try: <br><span style="color: var(--text-primary);">anatomy, pharmacology, cardiology, biochemistry...</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `

      ${searchData.subjects.length > 0 ? `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">menu_book</span> Subjects (${searchData.subjects.length})</div>
        ${searchData.subjects.map(s => `
          <div class="v2-pixel-card spotlight-item" data-type="subject" data-id="${s.id}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="subject-icon-wrapper"><img src="${getSubjectIconSrc(s.id)}" alt="${s.name}"></div>
                <span style="font-weight: 700; font-size: 0.95rem; font-family: var(--font-display);">${s.name}</span>
            </div>
            <span class="v2-hud-badge">${s.videosCount} vids</span>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.chapters.length > 0 ? `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">auto_stories</span> Chapters (${searchData.chapters.length})</div>
        ${searchData.chapters.map(c => `
          <div class="v2-pixel-card spotlight-item" data-type="chapter" data-id="${c.subjectId}" data-chap="${c.chapterName}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 0.92rem; font-family: var(--font-display);">${c.chapterName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${c.subjectName} • ${c.videoCount} videos</div>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.videos.length > 0 ? `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">play_circle</span> Video Topics (${searchData.videos.length})</div>
        <div class="v2-quest-card" style="padding-top: 14px; margin-top: 6px;">
          ${searchData.videos.map(v => {
            const isDone = v.isCompleted;
            let vNum = v.videoNumber || '#1';
            vNum = '#' + vNum.replace(/^#+/, '');
            return `
              <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                <label class="v2-pixel-checkbox-label">
                  <input type="checkbox" class="spotlight-vid-chk" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                  <span class="v2-pixel-checkbox-box"></span>
                  <div>
                    <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-hud); margin-top: 2px;">
                      <span>${v.subjectName}</span> • <span>${v.chapterName}</span>
                    </div>
                  </div>
                </label>
                <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">${v.durationMins || 0}m ${v.durationSecs || 0}s</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
     `;

    document.querySelectorAll('.spotlight-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        const id = item.getAttribute('data-id');
        state.activeSubjectId = id;
        if (type === 'chapter') {
          const chap = item.getAttribute('data-chap');
          state.expandedChapters[chap] = true;
        }
        closeSpotlightModal();
        switchView('subject_detail');
      });
    });

    document.querySelectorAll('.spotlight-vid-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          showToast('Completed Video!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        renderSpotlightResults(query);
      });
    });
  }



  // --- Cache DOM Elements ---
  function cacheDOM() {
    DOM.appMain = document.getElementById('app-main');
    DOM.navItems = document.querySelectorAll('.android-nav-item');
    DOM.btnToggleSearch = document.getElementById('btn-toggle-search');
    DOM.themeToggleBtn = document.getElementById('theme-toggle-btn');
    DOM.topbarUserProfile = document.getElementById('topbar-user-profile');
    DOM.topbarAvatarInitials = document.getElementById('topbar-avatar-initials');
    DOM.bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
    DOM.bottomSheetContent = document.getElementById('bottom-sheet-content');
    DOM.goalModal = document.getElementById('goal-modal');
    DOM.modalCloseBtn = document.getElementById('modal-close-btn');
    DOM.btnCancelGoals = document.getElementById('btn-cancel-goals');
    DOM.brandHomeLink = document.getElementById('brand-home-link');
    DOM.topbarSourceBadge = document.getElementById('topbar-source-badge');
    DOM.topbarSourceBadgeText = document.querySelector('.edition-badge-text');
  }

  // --- Interactive Info Popover Helper ---
  function openInfoModal(title, bodyHTML) {
    const modal = document.getElementById('info-popover-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `<span class="material-symbols-outlined">help</span> <span style="font-family: var(--font-display);">${title}</span>`;
    bodyEl.innerHTML = bodyHTML;
    modal.style.display = 'flex';
  }

  function closeInfoModal() {
    const modal = document.getElementById('info-popover-modal');
    if (modal) modal.style.display = 'none';
  }

  // --- Event Listeners ---
  function bindEvents() {
    DOM.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) switchView(view);
      });
    });

    if (DOM.brandHomeLink) {
      DOM.brandHomeLink.addEventListener('click', () => switchView('dashboard'));
    }

    if (DOM.btnToggleSearch) {
      DOM.btnToggleSearch.addEventListener('click', () => openSpotlightModal());
    }

    document.getElementById('spotlight-close-btn')?.addEventListener('click', closeSpotlightModal);
    document.getElementById('spotlight-search-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('spotlight-search-modal')) closeSpotlightModal();
    });

    document.getElementById('spotlight-search-input')?.addEventListener('input', (e) => {
      renderSpotlightResults(e.target.value);
    });



    // Global Keyboard Shortcut ('/' or Cmd/Ctrl+K to open Spotlight)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSpotlightModal();
        closeInfoModal();
        closeGoalModal();
        return;
      }

      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openSpotlightModal();
      }
    });

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(state.theme);
        saveState();
      });
    }

    if (DOM.topbarUserProfile) {
      DOM.topbarUserProfile.addEventListener('click', openProfileBottomSheet);
    }

    const topbarSrcBadge = document.getElementById('topbar-source-badge');
    if (topbarSrcBadge) {
      topbarSrcBadge.addEventListener('click', openSourceSettingsModal);
      topbarSrcBadge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSourceSettingsModal();
        }
      });
    }

    // Delegated click for any in-view edition chip → source settings dialog
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.btn-open-source-settings');
      if (chip) {
        e.preventDefault();
        e.stopPropagation();
        openSourceSettingsModal();
      }
    });

    if (DOM.bottomSheetOverlay) {
      DOM.bottomSheetOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.bottomSheetOverlay) closeBottomSheet();
      });
    }

    if (DOM.modalCloseBtn) DOM.modalCloseBtn.addEventListener('click', closeGoalModal);
    if (DOM.btnCancelGoals) DOM.btnCancelGoals.addEventListener('click', closeGoalModal);
    if (DOM.goalModal) {
      DOM.goalModal.addEventListener('click', (e) => {
        if (e.target === DOM.goalModal) closeGoalModal();
      });
    }

    // Info Modal Event Handlers
    document.getElementById('info-modal-close')?.addEventListener('click', closeInfoModal);
    document.getElementById('info-modal-ok-btn')?.addEventListener('click', closeInfoModal);
    document.getElementById('info-popover-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('info-popover-modal')) closeInfoModal();
    });

    // Global Help Icon (?) Popovers Delegate
    document.addEventListener('click', (e) => {
      const helpBtn = e.target.closest('.help-icon-btn');
      if (helpBtn) {
        e.preventDefault();
        e.stopPropagation();
        const type = helpBtn.getAttribute('data-help-type');

        if (type === 'projected-date') {
          openInfoModal(
            'Projected Completion Date',
            `<p style="margin-bottom: 8px;"><strong>Formula:</strong> <code>(Total Syllabus Videos − Completed Videos) ÷ Daily Video Pace</code></p>
             <div class="pxl-alert pxl-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">check_circle</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Dynamic Real-Time Shifting</div>
                 <div class="pxl-alert-message">This ETA dynamically adjusts as you complete videos or change daily pace target in Profile settings.</div>
               </div>
             </div>`
          );
        } else if (type === 'ideal-actual') {
          openInfoModal(
            'Ideal vs Actual Schedule Delta',
            `<p style="margin-bottom: 8px;"><strong>Schedule Delta:</strong> Compares actual 7-day completed lectures against your target quota (Daily Target × 7).</p>
             <div class="pxl-alert pxl-alert-warning" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">warning</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Automatic Schedule Recovery</div>
                 <div class="pxl-alert-message">When behind pace, FlowMD calculates exact extra daily videos needed to recover without burn-out.</div>
               </div>
             </div>`
          );
        } else if (type === 'action-queue') {
          openInfoModal(
            "Today's Action Queue",
            `<p style="margin-bottom: 8px;"><strong>Daily Target Batch:</strong> Locks your daily quota of video lectures (e.g. 3 videos).</p>
             <div class="pxl-alert pxl-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">rocket_launch</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Advance Batch Early</div>
                 <div class="pxl-alert-message">Completing your daily batch unlocks <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">rocket_launch</span> Advance to Next Target Batch early to stay ahead of schedule.</div>
               </div>
             </div>`
          );
        }
      }

      // Global Breadcrumb Delegate Handlers
      if (e.target.closest('.nav-bc-home')) {
        e.preventDefault();
        switchView('dashboard');
      } else if (e.target.closest('.nav-bc-curriculum')) {
        e.preventDefault();
        switchView('curriculum');
      }
    });
  }

  // --- FlowMD 16-Bit Pixel-Art Vector Logo Component ---
  function getFlowMDLogoSVG(theme = 'dark', mode = 'full', heightPx = 40) {
    const isDark = theme === 'dark';
    const mainColor = isDark ? '#ffffff' : '#1e293b';
    const pinkColor = isDark ? '#ff3b5c' : '#ff1f46';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';
    const scatterColor = isDark ? '#cbd5e1' : '#475569';

    if (mode === 'icon') {
      return `
        <svg viewBox="0 0 160 90" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 6px ${isDark ? 'rgba(255,59,92,0.5)' : 'rgba(255,31,70,0.3)'});" class="flowmd-pixel-icon-svg">
          <!-- Pixel Scatter (Top Left) -->
          <rect x="10" y="8" width="5" height="5" fill="${scatterColor}" />
          <rect x="18" y="4" width="5" height="5" fill="${pinkColor}" />
          <rect x="6" y="16" width="5" height="5" fill="${mainColor}" />

          <!-- Pixel Letter F -->
          <path d="M 22 18 h 45 v 10 h -32 v 16 h 26 v 10 h -26 v 30 h -13 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

          <!-- 16-Bit Pixel Heart -->
          <path d="M 68 28 h 10 v -6 h 12 v 6 h 10 v 10 h -6 v 10 h -6 v 8 h -6 v 6 h -8 v -6 h -6 v -8 h -6 v -10 h -6 Z" fill="none" stroke="${pinkColor}" stroke-width="3.2" stroke-linecap="square" />
          
          <!-- ECG Pulse Line -->
          <path d="M 18 45 h 44 l 5 -14 l 6 26 l 6 -18 l 5 6 h 50" fill="none" stroke="${pinkColor}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" />

          <!-- Pixel Letter M -->
          <path d="M 98 18 h 12 l 14 24 l 14 -24 h 12 v 56 h -12 v -34 l -14 24 h -0 l -14 -24 v 34 h -12 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

          <!-- Pixel Scatter (Bottom Right) -->
          <rect x="144" y="60" width="5" height="5" fill="${pinkColor}" />
          <rect x="152" y="68" width="5" height="5" fill="${scatterColor}" />
          <rect x="140" y="74" width="5" height="5" fill="${pinkColor}" />
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 350 100" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 12px ${pinkColor}) drop-shadow(0 0 3px ${mainColor}) drop-shadow(0 0 1px ${pinkColor});" class="flowmd-logo-svg">
        <!-- Pixel Scatter (Top Left) -->
        <rect x="8" y="6" width="5" height="5" fill="${scatterColor}" />
        <rect x="16" y="2" width="5" height="5" fill="${pinkColor}" />
        <rect x="4" y="14" width="5" height="5" fill="${mainColor}" />

        <!-- Pixel Letter F -->
        <path d="M 20 16 h 45 v 10 h -32 v 16 h 26 v 10 h -26 v 30 h -13 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

        <!-- 16-Bit Pixel Heart -->
        <path d="M 66 26 h 10 v -6 h 12 v 6 h 10 v 10 h -6 v 10 h -6 v 8 h -6 v 6 h -8 v -6 h -6 v -8 h -6 v -10 h -6 Z" fill="none" stroke="${pinkColor}" stroke-width="3.2" stroke-linecap="square" />
        
        <!-- ECG Pulse Line -->
        <path d="M 16 43 h 44 l 5 -14 l 6 26 l 6 -18 l 5 6 h 50" fill="none" stroke="${pinkColor}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" />

        <!-- Pixel Letter M -->
        <path d="M 96 16 h 12 l 14 24 l 14 -24 h 12 v 56 h -12 v -34 l -14 24 h -0 l -14 -24 v 34 h -12 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

        <!-- Pixel Scatter (Bottom Right) -->
        <rect x="142" y="58" width="5" height="5" fill="${pinkColor}" />
        <rect x="150" y="66" width="5" height="5" fill="${scatterColor}" />
        <rect x="138" y="72" width="5" height="5" fill="${pinkColor}" />

        <!-- FLowMD Typography -->
        <g transform="translate(175, 48)">
          <text x="0" y="0" fill="${mainColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">FL</text>
          
          <!-- Micro Heart for 'o' -->
          <g transform="translate(38, -18) scale(0.65)">
            <path d="M 8 6 h 5 v -3 h 6 v 3 h 5 v 5 h -3 v 5 h -3 v 4 h -3 v 3 h -4 v -3 h -3 v -4 h -3 v -5 h -3 Z" fill="${pinkColor}" />
            <path d="M 0 10 h 24" stroke="#ffffff" stroke-width="2" />
          </g>
          
          <text x="56" y="0" fill="${mainColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">w</text>
          <text x="82" y="0" fill="${pinkColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">MD</text>
        </g>

        <!-- Tagline: [ PLAN. STUDY. TRACK. SUCCEED. ] -->
        <g transform="translate(175, 68)">
          <text x="0" y="0" fill="${pinkColor}" font-family="'VT323', monospace" font-size="14" font-weight="bold">[</text>
          <text x="8" y="0" fill="${subTextColor}" font-family="'VT323', monospace" font-size="12.5" font-weight="bold" letter-spacing="1.2">PLAN. STUDY. TRACK. SUCCEED.</text>
          <text x="144" y="0" fill="${pinkColor}" font-family="'VT323', monospace" font-size="14" font-weight="bold">]</text>
        </g>
      </svg>
    `;
  }

  // --- Theme Helper ---
  function applyTheme(theme, themeStyle) {
    const curTheme = theme || state.theme || 'dark';
    const curStyle = themeStyle || state.themeStyle || 'modern';

    document.documentElement.setAttribute('data-theme', curTheme);
    document.documentElement.setAttribute('data-theme-accent', 'cobalt');
    document.documentElement.setAttribute('data-theme-style', curStyle);
  }

  function resetPageScrollTop() {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (DOM.appMain) DOM.appMain.scrollTop = 0;
      const mainEl = document.getElementById('app-main');
      if (mainEl) mainEl.scrollTop = 0;
    } catch(e){}
  }

  // --- View Switcher ---
  function switchView(viewName) {
    state.currentView = viewName;
    DOM.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });
    render();
    resetPageScrollTop();
  }

  // --- Main Render Dispatcher ---
  function render() {
    if (!DOM.appMain) DOM.appMain = document.getElementById('app-main');
    if (!DOM.appMain) return;

    updateTopbarInitials();
    updateTopbarSource();
    const stats = getSyllabusStats();

    if (state.currentView === 'dashboard') renderDashboardView(stats);
    else if (state.currentView === 'curriculum') renderCurriculumView(stats);
    else if (state.currentView === 'subject_detail') renderSubjectDetailView(stats);
    else if (state.currentView === 'analytics') renderAnalyticsView(stats);
    else renderProfileView(stats);
  }

  function updateTopbarInitials() {
    const docName = (state.personal && state.personal.doctorName) ? state.personal.doctorName : 'Dr. Aspirant';
    const cleanName = docName.replace(/^Dr\.?\s*/i, '').trim();
    const initials = cleanName.length >= 2 ? (cleanName.charAt(0) + cleanName.charAt(1)).toUpperCase() : (cleanName.charAt(0) || 'A').toUpperCase();
    
    const initialsElem = document.getElementById('topbar-avatar-initials');
    if (initialsElem) {
      initialsElem.textContent = initials;
    }

    const avatarBox = document.getElementById('topbar-user-profile');
    if (avatarBox) {
      avatarBox.className = `pxl-avatar pxl-avatar-sm pxl-avatar-cyan`;
    }
  }

  // --- 16-Bit RPG Subject Completion Heatmap Generator ---
  function renderPixelSubjectHeatmap(stats) {
    const subjects = (stats && stats.subjectsStats) || [];
    let countCritical = 0;
    let countPace = 0;
    let countAdvanced = 0;
    let countMastered = 0;

    subjects.forEach(sub => {
      if (sub.percentage >= 75) countMastered++;
      else if (sub.percentage >= 50) countAdvanced++;
      else if (sub.percentage >= 25) countPace++;
      else countCritical++;
    });

    const overallPct = stats ? stats.percentage : 0;

    return `
      <div class="pxl-feature-card pxl-subject-heatmap-card" style="margin-top: 24px; margin-bottom: 24px; padding: 20px;">
        
        <!-- Header Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg class="pxl-icon" viewBox="0 0 16 16" width="20" height="20" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#00f0ff" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="2" width="5" height="5" fill="#00ff88" stroke="#000000" stroke-width="1"/>
              <rect x="2" y="9" width="5" height="5" fill="#ffaa00" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="9" width="5" height="5" fill="#ff5555" stroke="#000000" stroke-width="1"/>
            </svg>
            <h3 class="heatmap-card-title">SUBJECT COMPLETION HEATMAP</h3>
            <span class="help-icon-btn" data-help-type="subject-heatmap" title="Subject Mastery Tier Rules">
              <svg class="pxl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none">
                <circle cx="8" cy="8" r="7" fill="rgba(0, 240, 255, 0.2)" stroke="currentColor" stroke-width="2" />
                <path d="M8 4.5V5.5M8 7.5V11.5" stroke="#ffffff" stroke-width="2" stroke-linecap="square" />
              </svg>
            </span>
          </div>
          
          <!-- Live Mastery Counter Badge -->
          <span class="v2-hud-badge">OVERALL MASTERY: ${overallPct}%</span>
        </div>

        <!-- Telemetry Overview Bar -->
        <div class="pxl-heatmap-telemetry-bar">
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #ff5555;"></span>
            <span class="pxl-stat-lbl">CRITICAL (&lt;25%):</span>
            <span class="pxl-stat-val" style="color: #ff5555;">${countCritical}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #ffaa00;"></span>
            <span class="pxl-stat-lbl">IN PROGRESS (25-50%):</span>
            <span class="pxl-stat-val" style="color: #ffaa00;">${countPace}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #00f0ff;"></span>
            <span class="pxl-stat-lbl">ADVANCED (50-75%):</span>
            <span class="pxl-stat-val" style="color: #00f0ff;">${countAdvanced}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #00ff88;"></span>
            <span class="pxl-stat-lbl">MASTERED (75%+):</span>
            <span class="pxl-stat-val" style="color: #00ff88;">${countMastered}</span>
          </div>
        </div>

        <!-- Interactive Tier Filter Bar -->
        <div class="pxl-heatmap-filter-bar">
          <span class="heatmap-filter-label">FILTER TIERS:</span>
          <div class="heatmap-filter-group">
            <button type="button" class="pxl-heatmap-filter-btn active" data-filter="all">ALL (${subjects.length})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-critical" data-filter="critical">&lt;25% (${countCritical})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-pace" data-filter="pace">25%–50% (${countPace})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-advanced" data-filter="advanced">50%–75% (${countAdvanced})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-mastered" data-filter="mastered">75%+ (${countMastered})</button>
          </div>
        </div>

        <!-- Heatmap Grid -->
        <div class="pxl-heatmap-grid">
          ${subjects.map(sub => {
            let tierClass = 'critical';
            let tierColor = '#ff5555';
            let tierBg = 'rgba(255, 85, 85, 0.12)';
            
            if (sub.percentage >= 75) {
              tierClass = 'mastered';
              tierColor = '#00ff88';
              tierBg = 'rgba(0, 255, 136, 0.14)';
            } else if (sub.percentage >= 50) {
              tierClass = 'advanced';
              tierColor = '#00f0ff';
              tierBg = 'rgba(0, 240, 255, 0.14)';
            } else if (sub.percentage >= 25) {
              tierClass = 'pace';
              tierColor = '#ffaa00';
              tierBg = 'rgba(255, 170, 0, 0.12)';
            }

            return `
              <div class="pxl-heatmap-tile subject-card" data-subject-id="${sub.id}" data-tier="${tierClass}" title="Click to open ${sub.name}: ${sub.percentage.toFixed(1)}% (${sub.completedVideos}/${sub.totalVideos} videos)" style="--subject-accent: ${sub.accentColor};">
                
                <!-- Subject Icon -->
                <div class="pxl-tile-icon-area">
                  <img src="${sub.icon}" alt="${sub.name}" class="pxl-tile-icon-img">
                </div>

                <!-- Subject Name -->
                <div class="pxl-tile-name" title="${sub.name}">${sub.name}</div>

                <!-- Faculty -->
                <div class="pxl-tile-faculty" style="margin: 4px 0 2px 0;">
                  ${renderFacultyPill(getSubjectFaculty(sub.id), sub.id)}
                </div>

                <!-- Hours -->
                <div class="pxl-tile-hours" style="font-family: var(--font-hud); font-size: 0.68rem; color: var(--text-muted); margin: 2px 0;">${sub.completedHours} / ${sub.totalHours}h</div>

                <!-- Tier Badge -->
                <div class="pxl-tile-bottom">
                  <span class="pxl-tile-tier-tag" style="color: ${tierColor};">${sub.percentage.toFixed(0)}%</span>
                  <span class="pxl-tile-telemetry">${sub.completedVideos}/${sub.totalVideos}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- Multi-Source Onboarding Wizard ---
  let obwStep = 0;
  let obwSource = 'marrow_8';
  let obwTheme = 'dark';
  let obwName = '';
  let obwSeeded = false;

  function getSourceLabel(sourceId) {
    const s = STUDY_SOURCES.find(x => x.id === sourceId);
    return s ? s.label : 'Marrow Edition 8';
  }

  function getEditionShort() {
    const s = STUDY_SOURCES.find(x => x.id === (state.activeSource || 'marrow_8'));
    return s ? s.short : 'Marrow 8';
  }

  // --- Active Edition visibility helpers ---
  function renderEditionChip() {
    return `
      <button type="button" class="edition-chip btn-open-source-settings" title="Current study edition — tap to change">
        <span class="material-symbols-outlined" style="font-size:15px;">auto_stories</span>
        <span>${getEditionShort()}</span>
      </button>`;
  }

  function updateTopbarSource() {
    const badge = document.getElementById('topbar-source-badge');
    if (!badge) return;
    const textEl = badge.querySelector('.edition-badge-text');
    if (textEl) textEl.textContent = getEditionShort();
    badge.title = 'Study Source: ' + getSourceLabel(state.activeSource || 'marrow_8') + ' — tap to change';
  }

  // --- Cool faculty + lecture-time presentation helpers ---
  function renderFacultyPill(faculty, subjectId) {
    const clean = (faculty || 'Marrow Faculty').replace(/^Dr\.?\s*/i, '').trim();
    const initials = clean.split(/\s+/).filter(Boolean).map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase() || 'MC';
    const subjectColor = getSubjectColor(subjectId) || '#3b82f6';
    const subjectColorLight = subjectColor + '22';
    const subjectColorBorder = subjectColor + '66';
    
    return `
      <span class="faculty-pill" style="--faculty-color: ${subjectColor};" data-faculty="${encodeURIComponent(faculty || 'Marrow Faculty')}" title="Taught by ${faculty || 'Marrow Faculty'}">
        <span class="faculty-pill-avatar" style="background: ${subjectColor};">${initials}</span>
        <span class="faculty-pill-name">${faculty || 'Marrow Faculty'}</span>
        <span class="material-symbols-outlined faculty-pill-verified" aria-label="Verified faculty">verified</span>
        <span class="faculty-pill-glow"></span>
      </span>`;
  }

  function renderFacultyCard(faculty, subjectId) {
    const clean = (faculty || 'Marrow Faculty').replace(/^Dr\.?\s*/i, '').trim();
    const initials = clean.split(/\s+/).filter(Boolean).map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase() || 'MC';
    const subjectColor = getSubjectColor(subjectId) || '#3b82f6';
    const subjectName = getSubjectName(subjectId);
    
    return `
      <div class="faculty-card" style="--faculty-color: ${subjectColor};" data-faculty="${encodeURIComponent(faculty || 'Marrow Faculty')}">
        <div class="faculty-card-avatar" style="background: ${subjectColor};">${initials}</div>
        <div class="faculty-card-info">
          <span class="faculty-card-name">${faculty || 'Marrow Faculty'}</span>
          <span class="faculty-card-subject">${subjectName}</span>
        </div>
        <span class="material-symbols-outlined faculty-card-verified" aria-label="Verified faculty">verified</span>
        <div class="faculty-card-border"></div>
      </div>`;
  }

  function renderHoursMeter(completedHours, totalHours) {
    const done = parseFloat(completedHours) || 0;
    const total = parseFloat(totalHours) || 0;
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const doneStr = (Math.round(done * 10) / 10).toString();
    const totalStr = (Math.round(total * 10) / 10).toString();
    return `
      <div class="hours-meter">
        <div class="hours-meter-head">
          <span class="hours-meter-label"><span class="material-symbols-outlined" style="font-size:13px;">schedule</span> LECTURE TIME</span>
          <span class="hours-meter-nums"><b>${doneStr}h</b><span class="hm-sep">/</span>${totalStr}h</span>
        </div>
        <div class="hm-track">
          <div class="hm-fill" style="width:${pct}%;"></div>
          <span class="hm-glow" style="left:${pct}%;"></span>
        </div>
      </div>`;
  }

  function renderOnboardingWizard(step) {
    obwStep = Math.max(0, Math.min(2, step || 0));
    if (!obwSeeded) {
      obwSeeded = true;
      if (state.personal && state.personal.doctorName) obwName = state.personal.doctorName;
    }
    const total = 3;
    const dots = [0, 1, 2].map(i =>
      `<span class="obw-dot ${i === obwStep ? 'active' : ''} ${i < obwStep ? 'done' : ''}"></span>`
    ).join('');
    const stepLabel = `FIRST SETUP · STEP ${obwStep + 1} OF ${total}`;

    let body = '';
    if (obwStep === 0) {
      body = `
        <div class="obw-title">📚 Choose your study source</div>
        <div class="obw-sub">Pick where your syllabus data comes from.</div>
        <div class="obw-options">
          ${STUDY_SOURCES.map(s => {
            const upcoming = s.id === 'prepladder_x';
            return `
              <button type="button" class="obw-option ${obwSource === s.id ? 'checked' : ''} ${upcoming ? 'upcoming' : ''}" data-source="${s.id}">
                <span class="obw-radio"></span>
                <span>
                  <span class="obw-option-title">${s.label}</span>
                  <span class="obw-option-sub">${upcoming ? 'Data lands in a future update.' : (s.id === 'marrow_8' ? 'Primary NEET-PG dataset — 20 subjects, full curriculum.' : 'Older edition — 20 subjects.')}</span>
                </span>
                ${upcoming ? '<span class="v2-hud-badge" style="margin-left:auto;">UPCOMING</span>' : ''}
              </button>`;
          }).join('')}
        </div>
        ${obwSource === 'prepladder_x' ? `
          <div class="obw-alert">
            <span class="material-symbols-outlined" style="font-size:16px;">info</span>
            Prepladder X is an upcoming feature. Its syllabus data will be available in a future update.
          </div>` : ''}
        <div class="obw-hint-path">
          <span class="material-symbols-outlined" style="font-size:16px;">settings</span>
          <span>You can change your study source anytime later from <b>Profile → Settings → Study Source</b>.</span>
        </div>
      `;
    } else if (obwStep === 1) {
      body = `
        <div class="obw-title">👤 About you</div>
        <div class="obw-sub">Help us personalize your dashboard.</div>
        <div style="text-align:left; margin-top:16px;">
          <label class="gcm-label" for="obw-name">What should we call you?</label>
          <input type="text" id="obw-name" class="obw-name-input" value="${obwName}" placeholder="Dr. Aspirant">
        </div>
        <div style="text-align:left; margin-top:16px;">
          <label class="gcm-label">Theme</label>
          <div class="obw-theme-grid">
            <button type="button" class="obw-theme-opt ${obwTheme === 'dark' ? 'checked' : ''}" data-theme-val="dark">🌙 Dark Mode</button>
            <button type="button" class="obw-theme-opt ${obwTheme === 'light' ? 'checked' : ''}" data-theme-val="light">☀️ Light Mode</button>
          </div>
        </div>
        <div class="obw-sub" style="margin-top:12px;">Change anytime from the Profile tab.</div>
      `;
    } else {
      body = `
        <div class="obw-title">✅ You're all set, ${obwName || 'Doctor'}!</div>
        <div class="obw-sub">${getSourceLabel(obwSource)} • ${obwTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
        <div class="obw-guide-list">
          <div class="obw-guide-item"><span class="obw-guide-num">1</span><span>📋 Set your study target — pick a subject and daily video pace.</span></div>
          <div class="obw-guide-item"><span class="obw-guide-num">2</span><span>✅ Check off videos daily. Your streak & progress update automatically.</span></div>
          <div class="obw-guide-item"><span class="obw-guide-num">3</span><span>📊 Analytics tracks pace & exam readiness; Curriculum browses all subjects.</span></div>
        </div>
      `;
    }

    DOM.appMain.innerHTML = `
      <div style="margin-bottom:16px;">
        <div class="v2-pixel-card obw-card" style="padding:26px 20px;">
          <div class="obw-step-line">
            <span>${stepLabel}</span>
            <span class="obw-dots">${dots}</span>
          </div>
          <div class="obw-head">${body}</div>
          <div class="obw-footer">
            <button type="button" class="v2-arcade-btn obw-btn-back" id="obw-back" style="height:46px; min-width:110px; padding:0 14px;">← Back</button>
            <button type="button" class="v2-arcade-btn obw-cta" id="obw-next">${obwStep === 2 ? 'Got it — Show the Dashboard →' : 'Next →'}</button>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.obw-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-source');
        obwSource = sid;
        if (sid === 'prepladder_x') {
          showToast('Prepladder X is coming soon — data in a future update.', 'info');
        }
        renderOnboardingWizard(obwStep);
      });
    });

    document.querySelectorAll('.obw-theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        obwTheme = btn.getAttribute('data-theme-val');
        state.theme = obwTheme;
        applyTheme(state.theme);
        document.querySelectorAll('.obw-theme-opt').forEach(b => b.classList.toggle('checked', b === btn));
      });
    });

    const backBtn = document.getElementById('obw-back');
    if (backBtn) {
      if (obwStep === 0) backBtn.style.visibility = 'hidden';
      backBtn.addEventListener('click', () => {
        triggerHaptic('prev');
        renderOnboardingWizard(obwStep - 1);
      });
    }

    const nameInputEl = document.getElementById('obw-name');
    if (nameInputEl) {
      nameInputEl.addEventListener('input', () => { obwName = nameInputEl.value.trim(); });
    }

    const nextBtn = document.getElementById('obw-next');
    if (nextBtn) {
      nextBtn.disabled = (obwStep === 0 && obwSource === 'prepladder_x');
      nextBtn.addEventListener('click', () => {
        if (obwStep === 1) {
          const nameInput = document.getElementById('obw-name');
          obwName = nameInput ? nameInput.value.trim() : obwName;
          state.theme = obwTheme;
          applyTheme(state.theme);
        }
        if (obwStep === 2) {
          finishOnboarding();
        } else {
          triggerHaptic('step');
          renderOnboardingWizard(obwStep + 1);
        }
      });
    }
  }

  function finishOnboarding() {
    state.isConfigured = true;
    state.activeSource = obwSource;
    state.personal.doctorName = obwName || state.personal.doctorName || 'Dr. Aspirant';
    state.theme = obwTheme;
    applyTheme(state.theme);
    saveState();
    triggerHaptic('finish');
    render();
  }

  // --- View 1: Dashboard View ---
  function renderDashboardView(stats) {
    if (!state.isConfigured) {
      renderOnboardingWizard(0);
      return;
    }
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const plans = state.plans && state.plans.length > 0 ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    const hasTargetSet = plans.some(p => p.targetSubject && p.targetSubject !== '');
    const allQueues = getAllPlanQueues();
    const streakCount = getStudyStreak();

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayCompletedCount = (state.dailyHistory && state.dailyHistory[todayStr]) || 0;

    let totalVidsDay = 0;
    plans.forEach(p => {
      totalVidsDay += Math.max(1, parseInt(p.videosPerDay) || 8);
    });

    // Helper: render one plan's daily quest block
    function renderPlanQuestBlock(plan, queue) {
      const planColor = plan.accentColor || PLAN_A_ACCENT;
      const todayDoneForPlan = queue.queueCompletedInBatch;
      const dailyPctPlan = Math.min(100, Math.round((todayDoneForPlan / queue.baseTargetPace) * 100));
      const scopedNames = getScopedChapterNames(plan);

      return `
        <div class="plan-quest-block" style="--plan-accent: ${planColor};">
          <div class="plan-quest-header">
            <div class="plan-quest-header-left">
              <span class="plan-quest-badge" style="background:${planColor};">${plan.label}</span>
              <span class="plan-quest-subject-name">${queue.subjectName}</span>
            </div>
            <span class="plan-quest-progress">${todayDoneForPlan}/${queue.baseTargetPace} • ${dailyPctPlan}%</span>
          </div>

          ${scopedNames.length > 0 ? `
            <div class="plan-quest-scope">
              <span class="material-symbols-outlined" style="font-size:13px;">filter_alt</span>
              FOCUS: ${scopedNames.length} chapter${scopedNames.length > 1 ? 's' : ''} · ${scopedNames.slice(0, 3).map(n => n.charAt(0) + n.slice(1).toLowerCase()).join(', ')}${scopedNames.length > 3 ? '…' : ''}
            </div>
          ` : ''}

          <div class="plan-quest-stats-row">
            <div class="plan-quest-target-text">
              TARGET: <strong>${queue.baseTargetPace} VIDS/DAY</strong>
            </div>
            <button class="v2-arcade-btn btn-open-queue-subject" data-subject-id="${queue.subjectId}" style="height: 30px; padding: 0 10px; font-size: 0.82rem;">
              <span>Open ${queue.subjectName}</span>
              <span class="material-symbols-outlined" style="font-size: 14px;">arrow_forward</span>
            </button>
          </div>

          ${queue.isDailyTargetAchieved ? `
            ${(plan.extraBatchesCompletedToday || 0) > 0 ? `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px; border-color: var(--accent-secondary, #a855f7);">
                <div class="v2-alert-icon-box" style="background: #a855f7; color: #ffffff; font-size: 20px; font-weight: bold;"><span class="material-symbols-outlined" style="font-size:18px;">bolt</span></div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: #a855f7;">${plan.label} EXTRA BATCH #${plan.extraBatchesCompletedToday + 1} ▶ OVERACHIEVED!</div>
                  <div class="v2-alert-title">🔥 Overachievement Bonus Unlocked!</div>
                  <div class="v2-alert-body">You've exceeded today's daily target! Completed extra batch #${plan.extraBatchesCompletedToday} (+${queue.baseTargetPace} bonus videos) for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:#a855f7;"></div>
              </div>
            ` : `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px;">
                <div class="v2-alert-icon-box" style="background: var(--accent-success, #10b981);">${PXL_ICONS.trophy}</div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: var(--accent-success, #10b981);">${plan.label} DAILY BATCH ▶ COMPLETED</div>
                  <div class="v2-alert-title">Daily Target Achieved!</div>
                  <div class="v2-alert-body">All ${queue.baseTargetPace} videos done for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:var(--accent-success,#10b981);"></div>
              </div>
            `}
            <button class="v2-arcade-btn btn-advance-queue" data-plan-id="${plan.id}" style="width:100%; height:40px; font-weight:700; font-size:0.9rem; justify-content:center; gap:8px;">
              ${PXL_ICONS.rocket}
              <span>🚀 Advance ${plan.label} — Next Target Batch</span>
            </button>
          ` : (queue.allSubjectDone ? `
            <div class="congrats-card-pop" style="text-align:center; padding:14px; color:var(--success); font-family:var(--font-display); font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
              ${PXL_ICONS.trophy}
              <span>All ${queue.subjectName} videos completed! <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">celebration</span></span>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap: 2px;">
              ${queue.videos.map(v => {
                const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
                let vNum = '#' + (v.videoNumber || '#1').replace(/^#+/, '');
                const isDone = !!state.completedVideos[v.id];
                return `
                  <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                    <label class="v2-pixel-checkbox-label">
                      <input type="checkbox" class="queue-chk" data-video-id="${v.id}" data-plan-id="${plan.id}" ${isDone ? 'checked' : ''}>
                      <span class="v2-pixel-checkbox-box"></span>
                      <div>
                        <div class="v2-quest-title"><span class="quest-video-num">${vNum}</span> ${v.title}</div>
                        <div class="quest-video-chapter">${v.chapterName}</div>
                      </div>
                    </label>
                    <div class="quest-video-dur">${durStr}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `)}
        </div>
      `;
    }

    const allQuestsDone = allQueues.every(q => q.isDailyTargetAchieved);
    const hasDualPlans = plans.length >= 2;

    DOM.appMain.innerHTML = `
      <!-- Hero Card -->
      <div style="margin-bottom: 16px;">
        <div class="pxl-feature-card hero-banner-card">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
              ${renderEditionChip()}
              ${hasDualPlans ? `
                <span class="hero-top-badge dual-track"><span class="material-symbols-outlined" style="font-size:16px;">bolt</span> DUAL-TRACK MODE</span>
              ` : ''}
              <span class="hero-streak-text"><span class="material-symbols-outlined" style="font-size:16px;">local_fire_department</span> ${streakCount} day streak</span>
            </div>
            <h1 class="hero-card-title">WELCOME BACK, ${docName.toUpperCase()}!</h1>
            <p class="hero-card-subtitle">
              ${hasDualPlans ? `Tracking ${plans.map(p => p.targetSubject || 'No subject set').join(' + ')}` : `${plans[0]?.targetSubject || 'No subject set'}`} — ${stats.percentage}% Mastered
            </p>
            <div class="hero-mastery-block">
              <div class="hero-mastery-top">
                <span class="hero-mastery-label"><span class="dot"></span> Syllabus Mastery</span>
                <span style="font-size:0.7rem; font-weight:600; color:var(--text-muted);">${stats.totalVideos > 0 ? stats.completedVideos + ' / ' + stats.totalVideos + ' videos' : 'No data yet'}</span>
              </div>
              <div class="hero-mastery-value">${stats.percentage}<span style="font-size:0.9rem; font-weight:600; opacity:0.7;">%</span></div>
              <div class="v2-hp-bar-bg hero-hp-bar">
                <div class="v2-hp-bar-fill" style="width:${stats.percentage}%;"></div>
              </div>
              <div class="hero-mastery-sub">
                <span>${stats.percentage < 25 ? 'Just getting started' : stats.percentage < 50 ? 'Building momentum' : stats.percentage < 75 ? 'Strong progress' : stats.percentage < 90 ? 'Almost there' : 'Mastery achieved!'}</span>
                <span>${stats.percentage < 100 ? (100 - stats.percentage) + '% to mastery' : 'Complete!'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Android PWA Install Banner -->
      ${state.canInstallPWA ? `
        <div id="pwa-install-banner-card" class="v2-pixel-card pwa-install-banner">
          <div class="pwa-install-banner-content">
            <div class="pwa-install-text">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span class="v2-hud-badge"><span class="material-symbols-outlined" style="font-size:16px;">smartphone</span> MOBILE PWA</span>
              </div>
              <h3 class="pwa-install-title">Install FlowMD Android App</h3>
              <p class="pwa-install-desc">Get offline access & hardware back-button integration!</p>
            </div>
            <div class="pwa-install-buttons">
              <button type="button" class="v2-arcade-btn" id="btn-pwa-install-now" style="height: 38px; font-size: 0.88rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">get_app</span>
                <span>Install</span>
              </button>
              <button type="button" class="v2-arcade-btn" id="btn-pwa-dismiss-banner" style="height: 38px; background: var(--bg-surface-raised); color: var(--text-secondary); font-size: 0.88rem;">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- All-Quests-Done Banner -->
      ${allQuestsDone ? `
        <div class="v2-achievement-alert congrats-card-pop all-quests-banner">
          <div class="v2-alert-icon-box" style="background: #ffd700;">${PXL_ICONS.trophy}</div>
          <div class="v2-alert-content">
            <div class="v2-alert-category all-quests-category"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">emoji_events</span> ALL DAILY QUESTS COMPLETE!</div>
            <div class="v2-alert-title">Outstanding Performance!</div>
            <div class="v2-alert-body">Every plan's daily target has been achieved today!</div>
          </div>
          <div class="v2-alert-bottom-bar" style="width:100%; background:#ffd700;"></div>
        </div>
      ` : ''}

      <!-- Daily Quest Section (per plan) -->
      <div class="v2-quest-card action-queue-card">
        <div class="v2-quest-header-badge">
          <span class="v2-quest-header-badge-text"><span class="material-symbols-outlined mat">emoji_events</span> Daily Quests</span>
          <span class="v2-quest-header-badge-extra">${hasDualPlans ? 'DUAL TRACK' : `${allQueues[0]?.subjectName || 'All Topics'}`}</span>
        </div>
        <div style="padding-top:4px;">
          ${hasTargetSet
            ? plans.map((plan, idx) => renderPlanQuestBlock(plan, allQueues[idx])).join('')
            : `
              <div class="obw-empty-cta">
                <div class="obw-title" style="margin-bottom:6px;">No study target set yet</div>
                <div class="obw-sub">Pick a subject and a daily pace to start your daily quests.</div>
                <button type="button" class="v2-arcade-btn" id="btn-set-first-target" style="height:46px; min-width:150px; padding:0 16px; margin-top:14px;">Set Your First Target 🎯</button>
              </div>`}
        </div>
      </div>
    `;

    document.getElementById('btn-pwa-install-now')?.addEventListener('click', () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('Installing FlowMD PWA...', 'rocket_launch');
            triggerHaptic('install');
          }
          deferredInstallPrompt = null;
          state.canInstallPWA = false;
          render();
        });
      } else {
        showToast('To install: tap Browser Menu (⋮) → "Add to Home screen"', 'info');
      }
    });

    document.getElementById('btn-pwa-dismiss-banner')?.addEventListener('click', () => {
      state.canInstallPWA = false;
      showToast('Install banner dismissed.', 'info');
      renderDashboardView(stats);
    });

    document.querySelectorAll('.btn-open-queue-subject').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeSubjectId = btn.getAttribute('data-subject-id');
        switchView('subject_detail');
      });
    });

    document.getElementById('btn-set-first-target')?.addEventListener('click', () => {
      openGoalModal();
    });

    // Per-plan advance batch
    document.querySelectorAll('.btn-advance-queue').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : (state.plans && state.plans[0]);
        if (plan) {
          plan.queueBatchVideoIds = [];
          plan.queueCompletedInBatch = 0;
          saveState();
          showToast(`${plan.label} — Next Batch Unlocked!`, 'arrow_forward', `${plan.label} Advanced`);
        } else {
          state.queueBatchVideoIds = [];
          state.queueCompletedInBatch = 0;
          saveState();
          showToast('Unlocked Next Target Batch!', 'arrow_forward');
        }
        render();
      });
    });

    document.querySelectorAll('.queue-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        const planId = e.target.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : null;

        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          const planLabel = plan ? plan.label : '';
          showToast(`${planLabel ? planLabel + ' — ' : ''}Completed Action Queue Video!`, 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        render();
      });
    });

    document.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const subId = card.getAttribute('data-subject-id');
        if (subId) { state.activeSubjectId = subId; switchView('subject_detail'); }
      });
    });

    document.querySelectorAll('.pxl-heatmap-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.pxl-heatmap-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.pxl-heatmap-tile').forEach(tile => {
          tile.style.display = (filter === 'all' || tile.getAttribute('data-tier') === filter) ? 'flex' : 'none';
        });
      });
    });
  }



// --- View 2: Curriculum View — Nested Mobile Tabs ---
  function renderCurriculumView(stats) {
    let filteredSubjects = stats.subjectsStats;

    DOM.appMain.innerHTML = `
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Curriculum</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Curriculum &amp; Subjects</h2>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${renderEditionChip()}
          <span class="v2-hud-badge">${filteredSubjects.length} SUBJECTS</span>
        </div>
      </div>

      ${filteredSubjects.map(sub => `
        <div class="v2-pixel-card" style="margin-bottom: 10px; padding: 12px 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" class="curriculum-sub-row" data-subject-id="${sub.id}">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <img src="${sub.icon}" class="subject-icon-medium" alt="${sub.name}">
              <div style="min-width: 0;">
                <div style="font-family: var(--font-display); font-weight: 700; font-size: 1rem;">${sub.name}</div>
                <div style="font-family: var(--font-hud); font-size: 0.92rem; color: var(--text-muted); margin-top: 2px;">${sub.raw.chapters ? sub.raw.chapters.length : 0} CHAPTERS • ${sub.totalVideos} VIDEOS</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="v2-hud-badge" style="${sub.percentage === 100 ? 'color: var(--success); border-color: var(--success);' : ''}">${sub.percentage}%</span>
              <span class="material-symbols-outlined" style="color: var(--text-muted);">chevron_right</span>
            </div>
          </div>
        </div>
      `).join('')}
    `;

    document.querySelectorAll('.curriculum-sub-row').forEach(row => {
      row.addEventListener('click', () => {
        state.activeSubjectId = row.getAttribute('data-subject-id');
        switchView('subject_detail');
      });
    });
  }

// --- View 3: Subject Detail View — Chapter Accordions ---
  function renderSubjectDetailView(stats) {
    const subObj = stats.subjectsStats.find(s => s.id === state.activeSubjectId) || stats.subjectsStats[0];
    if (!subObj) {
      DOM.appMain.innerHTML = `<p>Subject not found.</p>`;
      return;
    }

    const focusedChapterSet = new Set();
    (state.plans || []).forEach(p => {
      if (p && p.targetSubject === subObj.name) {
        getScopedChapterNames(p).forEach(n => focusedChapterSet.add(n));
      }
    });
    const hasFocusScope = focusedChapterSet.size > 0;

    DOM.appMain.innerHTML = `
      <div class="pwa-curriculum-scroll">
        <div class="pxl-breadcrumb">
          <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
          <span class="pxl-breadcrumb-separator">&gt;</span>
          <span class="pxl-breadcrumb-item nav-bc-curriculum" data-view="curriculum">Curriculum</span>
          <span class="pxl-breadcrumb-separator">&gt;</span>
          <span class="pxl-breadcrumb-item active">${subObj.name}</span>
        </div>

        <div class="pwa-subject-detail-header">
          <button class="pwa-back-btn" id="btn-back-to-curriculum" aria-label="Back to subjects">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Subjects</span>
          </button>
          <div class="pwa-subject-detail-icon"><img src="${subObj.icon}" alt="${subObj.name}"></div>
          <div class="pwa-subject-detail-info">
            <div class="pwa-subject-detail-name">${subObj.name}</div>
            <div class="pwa-subject-detail-faculty">${renderFacultyCard(subObj.faculty || getSubjectFaculty(subObj.id), subObj.id)}</div>
            <div class="pwa-subject-detail-meta">${subObj.raw.chapters ? subObj.raw.chapters.length : 0} Chapters • ${subObj.totalVideos} Videos • ${subObj.percentage}% done</div>
            ${renderHoursMeter(subObj.completedHours, subObj.totalHours)}
            <div class="pwa-subject-detail-progress"><div class="pwa-subject-detail-progress-fill" style="width:${subObj.percentage}%"></div></div>
          </div>
        </div>

        ${hasFocusScope ? `
          <div class="pwa-focus-banner">
            <span class="material-symbols-outlined">filter_alt</span>
            <span>${focusedChapterSet.size} focused chapter${focusedChapterSet.size > 1 ? 's' : ''} — chapters outside focus are dimmed</span>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 2px;">
          <span style="font-family: var(--font-hud); font-size: 1rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
            ${subObj.raw.chapters ? subObj.raw.chapters.length : 0} UNITS / CHAPTERS
          </span>
          <button class="v2-arcade-btn" id="btn-toggle-all-chapters" style="height: 30px; padding: 0 10px; font-size: 0.8rem; background: var(--bg-surface-raised); color: var(--text-primary);">
            <span class="material-symbols-outlined" style="font-size: 16px;">unfold_more</span>
            <span>${Object.values(state.expandedChapters).some(v => v === true) ? 'Collapse All' : 'Expand All'}</span>
          </button>
        </div>

        ${subObj.raw.chapters ? subObj.raw.chapters.map(chap => {
          const isFocused = !hasFocusScope || focusedChapterSet.has(chap.name);
          const dimStyle = hasFocusScope && !isFocused ? ' opacity: 0.5; filter: grayscale(0.5);' : '';
          return `
            <div class="accordion-header ${state.expandedChapters[chap.name] === true ? 'active' : ''}" data-chap-name="${chap.name}" style="border: 2px solid var(--v2-ink, #161310); margin-bottom: 6px; cursor: pointer; user-select: none;${dimStyle}">
              <div class="accordion-title" style="font-family: var(--font-display); font-size: 0.95rem;">${chap.name} (${chap.videos ? chap.videos.length : 0} Videos)</div>
              <span class="material-symbols-outlined accordion-icon">expand_more</span>
            </div>

            <div class="accordion-body ${state.expandedChapters[chap.name] === true ? 'active' : ''}">
              <div class="v2-quest-card" style="padding-top: 14px; margin-top: 4px; margin-bottom: 10px;">
                ${chap.videos ? chap.videos.map(v => {
                  const isDone = !!state.completedVideos[v.id];
                  const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
                  let vNum = v.videoNumber || '#1';
                  vNum = '#' + vNum.replace(/^#+/, '');

                  return `
                    <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                      <label class="v2-pixel-checkbox-label">
                        <input type="checkbox" class="react-task-checkbox" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                        <span class="v2-pixel-checkbox-box"></span>
                        <div>
                          <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                        </div>
                      </label>
                      <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">${durStr}</div>
                    </div>
                  `;
                }).join('') : ''}
              </div>
            </div>
          `;
        }).join('') : ''}
      </div>
    `;

    document.getElementById('btn-back-to-curriculum')?.addEventListener('click', () => switchView('curriculum'));

    document.querySelector('.nav-bc-curriculum')?.addEventListener('click', () => switchView('curriculum'));

    document.getElementById('btn-toggle-all-chapters')?.addEventListener('click', () => {
      const isAnyExpanded = Object.values(state.expandedChapters).some(v => v === true);
      const newExpandedState = !isAnyExpanded;
      if (subObj.raw.chapters) {
        subObj.raw.chapters.forEach(chap => {
          state.expandedChapters[chap.name] = newExpandedState;
        });
      }
      renderSubjectDetailView(stats);
    });

    document.querySelectorAll('.accordion-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const chapName = hdr.getAttribute('data-chap-name');
        state.expandedChapters[chapName] = !state.expandedChapters[chapName];
        renderSubjectDetailView(stats);
      });
    });

    document.querySelectorAll('.react-task-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          showToast('Marked as Completed!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        renderSubjectDetailView(getSyllabusStats());
      });
    });
  }

  // --- PxlKit PixelAreaChart SVG Generator ---
  // --- 7-Day Execution Chart (Analytics Redesign: theme-adaptive, matches anl-* suite) ---
  function renderExecutionChart(last7Days, vidsDay, maxChartVal) {
    const width = 600;
    const height = 200;
    const padL = 14;
    const padR = 14;
    const padT = 32;
    const padB = 26;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const baseY = padT + chartH;
    const scale = Math.max(1, maxChartVal);

    const points = last7Days.map((d, i) => {
      const count = (state.dailyHistory && state.dailyHistory[d.dateKey]) ? state.dailyHistory[d.dateKey] : 0;
      const x = padL + (chartW * i) / (last7Days.length - 1);
      const y = padT + chartH - Math.min(chartH, (count / scale) * chartH);
      return { x, y, count, label: d.label, isMet: count >= vidsDay };
    });

    const targetY = padT + chartH - Math.min(chartH, (vidsDay / scale) * chartH);
    const total7DayVids = points.reduce((sum, p) => sum + p.count, 0);
    const metDays = points.filter(p => p.isMet).length;

    // Catmull-Rom → cubic bezier smoothing
    const smoothPath = (pts) => {
      if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x} ${p2.y}`;
      }
      return d;
    };

    const linePath = smoothPath(points);
    const areaPath = linePath
      ? `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
      : '';
    const gridY = [0.25, 0.5, 0.75].map(f => padT + chartH - chartH * f);

    return `
      <section class="ex-chart-card">
        <div class="ex-chart-head">
          <div class="ex-chart-titlewrap">
            <span class="ex-chart-icon"><span class="material-symbols-outlined">bar_chart</span></span>
            <div>
              <div class="ex-chart-kicker">Execution &mdash; Last 7 Days</div>
              <h3 class="ex-chart-title">7-Day Execution Chart</h3>
            </div>
          </div>
          <span class="v2-hud-badge ex-chart-target-badge">TARGET ${vidsDay} VIDS/DAY</span>
        </div>

        <div class="ex-chart-legend">
          <span class="ex-chart-legend-item"><span class="ex-dot ex-dot-met"></span> Target Met</span>
          <span class="ex-chart-legend-item"><span class="ex-dot ex-dot-part"></span> Partial</span>
          <span class="ex-chart-legend-item"><span class="ex-dot ex-dot-zero"></span> No Study</span>
          <span class="ex-chart-legend-item ex-chart-legend-target"><span class="ex-dot ex-dot-target"></span> Daily Target</span>
        </div>

        <div class="ex-chart-plot">
          <svg viewBox="0 0 ${width} ${height}" class="ex-chart-svg" role="img" aria-label="7-day video execution chart">
            <defs>
              <linearGradient id="exChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style="stop-color:var(--accent-primary); stop-opacity:0.30" />
                <stop offset="100%" style="stop-color:var(--accent-primary); stop-opacity:0.02" />
              </linearGradient>
            </defs>

            ${gridY.map(y => `<line class="ex-chart-gridline" x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" />`).join('')}
            <line class="ex-chart-baseline" x1="${padL}" y1="${baseY}" x2="${width - padR}" y2="${baseY}" />
            <line class="ex-chart-targetline" x1="${padL}" y1="${targetY.toFixed(1)}" x2="${width - padR}" y2="${targetY.toFixed(1)}" />
            <text class="ex-chart-targetlabel" x="${width - padR}" y="${Math.max(12, targetY - 7)}">TARGET ${vidsDay}/DAY</text>

            ${areaPath ? `<path d="${areaPath}" class="ex-chart-area" />` : ''}
            ${linePath ? `<path d="${linePath}" class="ex-chart-line" />` : ''}

            ${points.map(p => `
              <g class="ex-chart-point ${p.count === 0 ? 'is-zero' : (p.isMet ? 'is-met' : 'is-part')}">
                <title>${p.label}: ${p.count} video${p.count !== 1 ? 's' : ''} ${p.isMet ? '✓ Target Met' : p.count > 0 ? 'Partial' : 'No study'}</title>
                <text class="ex-chart-val" x="${p.x}" y="${Math.max(12, p.y - 11)}">${p.count}${p.isMet && p.count > 0 ? ' ★' : ''}</text>
                <circle class="ex-chart-node ex-node-${p.count === 0 ? 'zero' : (p.isMet ? 'met' : 'part')}" cx="${p.x}" cy="${p.y}" r="5" />
              </g>
            `).join('')}

            ${points.map(p => `
              <text class="ex-chart-xlabel" x="${p.x}" y="${height - 5}">${p.label}</text>
            `).join('')}
          </svg>
        </div>

        <div class="ex-chart-days">
          ${points.map(p => `
            <div class="ex-day-tile ${p.count === 0 ? 'is-zero' : (p.isMet ? 'is-met' : 'is-part')}" title="${p.label}: ${p.count} video${p.count !== 1 ? 's' : ''} ${p.isMet ? '✓ Target Met' : p.count > 0 ? 'Partial' : 'No study'}">
              <div class="ex-day-name">${p.label}</div>
              <div class="ex-day-count">${p.count}</div>
              <div class="ex-day-status">${p.isMet ? 'MET' : (p.count > 0 ? 'PARTIAL' : '0 VIDS')}</div>
              <div class="ex-day-track"><div class="ex-day-fill" style="width:${Math.min(100, Math.round((p.count / Math.max(vidsDay, 1)) * 100))}%"></div></div>
            </div>
          `).join('')}
        </div>

        <div class="ex-chart-foot">
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--accent-primary)"></span> Total <b>${total7DayVids} vids</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--success)"></span> Target Met <b>${metDays}/7 days</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--warning)"></span> Pace <b>${Math.round((total7DayVids / Math.max(vidsDay * 7, 1)) * 100)}%</b></span>
        </div>
      </section>
    `;
  }

  // --- View 4: Target & Goal-Driven Analytics Suite (Dual-Plan) ---
  function renderAnalyticsView(stats) {
    const plans = (state.plans && state.plans.length > 0) ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    const allQueues = getAllPlanQueues();
    const hasDualPlans = plans.length >= 2;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayDone = (state.dailyHistory && state.dailyHistory[todayStr]) || 0;
    const daysLeft = Math.max(1, Math.ceil((new Date(state.goals.targetDate || '2026-08-15') - now) / 86400000));

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      last7Days.push({ dateKey, label });
    }

    let actual7DaysCount = last7Days.reduce((sum, d) => sum + ((state.dailyHistory && state.dailyHistory[d.dateKey]) || 0), 0);
    let actual30DaysCount = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      actual30DaysCount += (state.dailyHistory && state.dailyHistory[d.toISOString().slice(0, 10)]) || 0;
    }

    // Aggregate total daily target across all plans
    let totalVidsDay = 0;
    plans.forEach(p => { totalVidsDay += Math.max(1, parseInt(p.videosPerDay) || 8); });

    const ideal7DaysTarget = totalVidsDay * 7;
    const ideal30DaysTarget = totalVidsDay * 30;
    const paceDelta = actual7DaysCount - ideal7DaysTarget;
    const lectureDeficit = Math.abs(paceDelta);

    const weeklyPct = Math.min(100, Math.round((actual7DaysCount / Math.max(1, ideal7DaysTarget)) * 100));
    const monthlyPct = Math.min(100, Math.round((actual30DaysCount / Math.max(1, ideal30DaysTarget)) * 100));
    const maxChartVal = Math.max(totalVidsDay, ...last7Days.map(d => (state.dailyHistory && state.dailyHistory[d.dateKey]) || 0), 1);

    // Per-plan stats
    const planStats = plans.map((plan, idx) => {
      const q = allQueues[idx];
      const m = getSubjectOrSyllabusMetricsForPlan(plan);
      const scopedUnits = getScopedChapterNames(plan);
      const vids = Math.max(1, parseInt(plan.videosPerDay) || 8);
      const remVids = Math.max(0, m.remainingVideos);
      const daysNeeded = Math.ceil(remVids / vids);
      const finishDate = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
      const finishDateStr = finishDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const targetDate = new Date(plan.targetDate || '2026-08-15');
      const daysLeft = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));
      const ideal7 = vids * 7;
      const ideal30 = vids * 30;
      const planPaceDelta = actual7DaysCount - ideal7; // global actual vs this plan's ideal
      return { plan, q, m, vids, remVids, daysNeeded, finishDate, finishDateStr, targetDate, daysLeft, ideal7, ideal30, planPaceDelta, scopedUnits };
    });

    const goalTile = (o) => `
      <div class="anl-goal-tile" style="--tile:${o.color}">
        <div class="anl-goal-head">
          <div class="anl-goal-tag">
            <span class="anl-goal-ico"><span class="material-symbols-outlined">${o.icon}</span></span>
            <span class="anl-goal-title">${o.title}</span>
          </div>
          <span class="anl-goal-badge" style="${o.badgeStyle || ''}">${o.badge}</span>
        </div>
        <div class="anl-goal-value">${o.value}<span class="unit">${o.unit || ''}</span></div>
        <div class="anl-goal-desc">${o.desc}</div>
        <div class="anl-goal-track"><div class="anl-goal-fill" style="width:${o.pct}%; --fill:${o.color};"></div></div>
        <div class="anl-goal-meta">
          <span class="anl-goal-pct">${o.pct}%</span>
          ${o.delta ? `<span class="anl-goal-delta" style="color:${o.deltaColor || 'var(--text-muted)'};">${o.delta}</span>` : ''}
        </div>
      </div>
    `;

    const todayPct = Math.min(100, Math.round((todayDone / totalVidsDay) * 100));
    const todayMet = todayDone >= totalVidsDay;
    const todayTile = goalTile({
      color: '#0ea5e9',
      icon: 'today',
      title: "Today's Daily Goal",
      badge: todayMet ? 'Done' : 'In progress',
      badgeStyle: `color:${todayMet ? 'var(--success)' : 'var(--warning)'}; border-color:${todayMet ? 'var(--success)' : 'var(--warning)'};`,
      value: `${todayDone}`,
      unit: `/ ${totalVidsDay}`,
      desc: `combined videos today${hasDualPlans ? '<br>' + plans.map((p, i) => `${p.label}: ${allQueues[i].queueCompletedInBatch}/${p.videosPerDay}`).join('<br>') : ''}`,
      pct: todayPct,
      delta: todayPct >= 100 ? 'Goal met' : `${totalVidsDay - todayDone} to go`,
      deltaColor: todayMet ? 'var(--success)' : 'var(--warning)'
    });

    const weekTile = goalTile({
      color: '#f59e0b',
      icon: 'date_range',
      title: 'Weekly Goal',
      badge: `${weeklyPct}% complete`,
      value: `${actual7DaysCount}`,
      unit: `/ ${ideal7DaysTarget}`,
      desc: 'videos completed this week',
      pct: weeklyPct,
      delta: `${paceDelta >= 0 ? '+' : '- '}${Math.abs(paceDelta)} vs ${ideal7DaysTarget}`,
      deltaColor: paceDelta >= 0 ? 'var(--success)' : 'var(--danger)'
    });

    const monthTile = goalTile({
      color: '#a855f7',
      icon: 'calendar_month',
      title: 'Monthly Goal',
      badge: `${monthlyPct}% complete`,
      value: `${actual30DaysCount}`,
      unit: `/ ${ideal30DaysTarget}`,
      desc: 'videos completed in 30 days',
      pct: monthlyPct,
      delta: 'rolling 30-day pace'
    });

    const planTiles = planStats.map(ps => {
      const behind = ps.finishDate > ps.targetDate;
      const daysDiff = Math.abs(Math.ceil((ps.finishDate - ps.targetDate) / 86400000));
      const planPct = Math.min(100, Math.round((actual7DaysCount / Math.max(1, ps.ideal7)) * 100));
      const pColor = ps.plan.accentColor || PLAN_A_ACCENT;
      return goalTile({
        color: pColor,
        icon: 'flag',
        title: `${ps.plan.label} ETA`,
        badge: behind ? 'Late' : 'On track',
        badgeStyle: `color:${behind ? 'var(--danger)' : 'var(--success)'}; border-color:${behind ? 'var(--danger)' : 'var(--success)'};`,
        value: `${ps.finishDateStr}`,
        unit: '',
        desc: `${ps.plan.targetSubject}${ps.scopedUnits && ps.scopedUnits.length > 0 ? ' → ' + ps.scopedUnits.length + ' chapters' : ''} @ ${ps.vids}/day`,
        pct: planPct,
        delta: `${daysDiff}d ${behind ? 'behind' : 'ahead'} (${ps.plan.targetDate})`,
        deltaColor: behind ? 'var(--danger)' : 'var(--success)'
      });
    }).join('');

    DOM.appMain.innerHTML = `
      <!-- Breadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Analytics</span>
      </div>

      <!-- Study Intelligence Report Hero -->
      <section class="anl-report-hero">
        <div class="anl-hero-main">
          <div class="anl-hero-icon"><span class="material-symbols-outlined">monitoring</span></div>
          <div>
            <div class="anl-hero-kicker">Study Intelligence Report</div>
            <h2 class="anl-hero-title">Your Study Intelligence</h2>
            <p class="anl-hero-sub">${hasDualPlans ? `Dual-Track: ${plans.map(p => p.targetSubject).join(' + ')}` : 'Live pace, goals & syllabus readiness'}</p>
          </div>
        </div>
        <div class="anl-hero-actions">
          ${renderEditionChip()}
          <span class="v2-hud-badge" style="color:${weeklyPct >= 100 ? 'var(--success)' : 'var(--warning)'}; border-color:${weeklyPct >= 100 ? 'var(--success)' : 'var(--warning)'};"><span class="material-symbols-outlined" style="font-size:14px;">speed</span> ${weeklyPct}% Weekly Pace</span>
          <button class="v2-arcade-btn" id="btn-share-report" style="height:34px; padding:0 14px; font-size:0.82rem; background:var(--accent-gradient);">
            <span class="material-symbols-outlined" style="font-size:16px;">share</span>
            <span>Share Report</span>
          </button>
        </div>
        <div class="anl-hero-chips">
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#3b82f6"></span> Syllabus <b>${stats.percentage}%</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#10b981"></span> Daily Target <b>${totalVidsDay}</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#f59e0b"></span> 7-Day <b>${actual7DaysCount}/${ideal7DaysTarget}</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#a855f7"></span> Days Left <b>${daysLeft}</b></span>
        </div>
      </section>

      <!-- Preparation Setup & Target Goals -->
      <div class="anl-report-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><span class="material-symbols-outlined mat">tune</span> Preparation Setup</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">${daysLeft} Days Left</span>
        </div>
        <div class="anl-report-focus">
          <div>
            <div class="lbl">Priority Focus</div>
            <div class="val">${state.goals.targetSubject || 'No subject set'}</div>
          </div>
          <div style="text-align:right;">
            <div class="lbl">Daily Pace</div>
            <div class="val">${(state.goals.goalMode || 'video') === 'video' ? `<small>${state.goals.videosPerDay}</small> vids/day` : `<small>${state.goals.dailyTargetHours}</small> hrs/day`}</div>
          </div>
        </div>
        <div class="anl-report-facts">
          <div class="anl-report-fact"><div class="lbl">Daily</div><div class="val">${state.goals.videosPerDay || 8} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Weekly</div><div class="val">${state.goals.videosPerWeek || 56} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Monthly</div><div class="val">${state.goals.videosPerMonth || 240} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Target Date</div><div class="val">${state.goals.targetDate || '2026-08-15'}</div></div>
        </div>
        <button class="v2-arcade-btn" id="btn-analytics-open-goals" style="width:100%;"><span class="material-symbols-outlined">track_changes</span> Synchronize Pace &amp; Goals</button>
      </div>

      <!-- Goal Pulse -->
      <div class="anl-goal-section-label"><span class="material-symbols-outlined" style="font-size:18px; color:var(--accent-primary);">target</span> Goal Pulse — Today / Week / Month</div>
      <div class="anl-goal-grid">
        ${todayTile}
        ${weekTile}
        ${monthTile}
        ${planTiles}
      </div>

      <!-- 7-Day Execution Chart -->
      ${renderExecutionChart(last7Days, totalVidsDay, maxChartVal)}

      <!-- Subject Heatmap (moved from dashboard) -->
      <div style="margin-top:20px;">
        ${renderPixelSubjectHeatmap(stats)}
      </div>

    `;

    document.getElementById('btn-share-report')?.addEventListener('click', () => {
      const shareText = `<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">target</span> FlowMD Study Intelligence Report\nDoctor: ${state.personal.doctorName || 'Dr. Aspirant'}\n${hasDualPlans ? `Dual-Track: ${plans.map(p => p.targetSubject).join(' + ')}\n` : ''}Syllabus HP Mastery: ${stats.percentage}%\nCombined Daily Target: ${totalVidsDay} vids/day\n7-Day Actual: ${actual7DaysCount}/${ideal7DaysTarget}\n${planStats.map(ps => `${ps.plan.label} ETA: ${ps.finishDateStr}`).join('\n')}\nBuilt with FlowMD!`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => showToast('Report Copied to Clipboard!', 'auto_awesome'));
      } else {
        showToast('Study Intelligence Report Ready!', 'auto_awesome');
      }
    });

    document.getElementById('btn-analytics-open-goals')?.addEventListener('click', openGoalModal);
  }

  // --- View 5: Synchronized Targets & Goals View ---
  function renderGoalsView(stats) {
    const mode = state.goals.goalMode || 'video';
    const targetSub = state.goals.targetSubject || '';
    const targetDateStr = state.goals.targetDate || '2026-08-15';
    const daysLeft = Math.max(1, Math.ceil((new Date(targetDateStr) - new Date()) / 86400000));

    DOM.appMain.innerHTML = `
      <!-- PxlKit PixelBreadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Goals & Schedule</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Personal Preparation Goals</h2>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          <button class="v2-arcade-btn" id="btn-edit-goals-page" style="height: 34px; padding: 0 12px; font-size: 0.88rem;">
            <span class="material-symbols-outlined" style="font-size: 16px;">track_changes</span>
            <span>Synchronize Pace</span>
          </button>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 20px; margin-bottom: 16px; background: linear-gradient(135deg, rgba(46, 93, 214, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="v2-hud-badge" style="color: var(--accent-primary); border-color: var(--accent-primary);">MODE: ${mode === 'video' ? 'VIDEOS PACE' : 'HOURS PACE'}</span>
          <span class="v2-hud-badge">${daysLeft} DAYS LEFT</span>
        </div>

        <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 700; margin-bottom: 4px;">
          Priority Focus: ${targetSub}
        </h2>
        <p style="font-family: var(--font-hud); font-size: 1.1rem; color: var(--accent-primary); font-weight: 700;">
          TARGET PACE: ${mode === 'video' ? state.goals.videosPerDay + ' VIDS/DAY (' + state.goals.videosPerWeek + ' VIDS/WK)' : state.goals.dailyTargetHours + ' HRS/DAY (' + state.goals.weeklyTargetHours + ' HRS/WK)'}
        </p>

        <div class="v2-hp-bar-bg" style="height: 14px; margin-top: 14px;">
          <div class="v2-hp-bar-fill" style="width: ${stats.percentage}%;"></div>
        </div>
      </div>

      <!-- Synchronized Pace Cards -->
      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 12px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Daily Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
              ${mode === 'video' ? state.goals.videosPerDay + ' Videos' : state.goals.dailyTargetHours + ' Hours'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per day</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 12px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Weekly Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
              ${mode === 'video' ? state.goals.videosPerWeek + ' Videos' : state.goals.weeklyTargetHours + ' Hours'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per week</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Monthly Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
              ${mode === 'video' ? state.goals.videosPerMonth + ' Videos' : state.goals.monthlyTargetHours + ' Hours'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per month</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>
    `;

    document.getElementById('btn-edit-goals-page')?.addEventListener('click', openGoalModal);
  }

  // --- View 6: Profile View (simplified) ---
  function renderProfileView(stats) {
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';

    DOM.appMain.innerHTML = `
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Account & Profile</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Account & Profile</h2>
      </div>

      <div class="v2-pixel-card" style="padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div class="pxl-avatar pxl-avatar-lg pxl-avatar-cyan">
            ${(docName.replace(/^Dr\.?\s*/i, '').trim().slice(0, 2) || 'DA').toUpperCase()}
          </div>
          <div>
            <h2 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700;">${docName}</h2>
          </div>
        </div>

        <form id="profile-edit-form">
          <div class="form-group">
            <label for="prof-doc-name">Doctor Name</label>
            <input type="text" id="prof-doc-name" value="${docName}" class="form-input">
          </div>
          <button type="submit" class="v2-arcade-btn" style="height: 44px; width: 100%;">Save Profile Changes</button>
        </form>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;">settings</span>
          Settings
        </h3>
        <div class="profile-settings-row">
          <div>
            <div class="profile-settings-row-label">Study Source / Syllabus Edition</div>
            <div class="profile-settings-row-value">
              <span class="src-status-dot"></span>
              ${getSourceLabel(state.activeSource || 'marrow_8')}
            </div>
          </div>
          <button class="v2-arcade-btn" id="btn-change-source" style="height: 38px; padding: 0 16px; min-width: 96px;">
            <span class="material-symbols-outlined" style="font-size: 18px;">swap_horiz</span> Change
          </button>
        </div>
        <div class="profile-settings-hint">Switching source changes the syllabus, targets &amp; focus chapters shown in the app.</div>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Google Cloud Sync</h3>
        ${isSynced ? `
          <div style="display: flex; align-items: center; gap: 8px; color: var(--success); font-family: var(--font-hud); font-size: 1.05rem; margin-bottom: 12px;">
            <span class="material-symbols-outlined">cloud_done</span>
            Synced as ${syncEmail}
          </div>
          <button class="v2-arcade-btn" id="btn-signout-google" style="width: 100%; background: var(--danger);">Sign Out of Cloud Sync</button>
        ` : `
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Sign in with Google to backup your progress.</p>
          <button class="v2-arcade-btn" id="btn-signin-google" style="width: 100%;">
            <span class="material-symbols-outlined">cloud_sync</span> Sign In with Google
          </button>
        `}
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 24px; border-left: 4px solid var(--accent-primary, #2563eb);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0;">
              <span class="material-symbols-outlined" style="color: var(--accent-primary, #2563eb);">support_agent</span>
              <span>Developer Support & Contact</span>
            </h3>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 14px;">
          <button class="v2-arcade-btn" id="btn-open-contact-modal" style="height: 42px; background: var(--accent-primary, #2563eb); color: #ffffff;">
            <span class="material-symbols-outlined">send</span> Send Support Ticket
          </button>
          <button class="v2-arcade-btn" id="btn-copy-support-email" style="height: 42px; background: var(--bg-surface-raised); color: var(--text-primary);">
            <span class="material-symbols-outlined">content_copy</span> Copy Email (support@flowmd.app)
          </button>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Data Management</h3>
        <button class="v2-arcade-btn" id="btn-reset-data" style="width: 100%; background: var(--danger);">
          <span class="material-symbols-outlined">delete_forever</span> Reset All App Data
        </button>
      </div>
    `;

    document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.personal.doctorName = document.getElementById('prof-doc-name').value || 'Dr. Aspirant';
      saveState();
      showToast('Profile updated!', 'check_circle');
      render();
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all app progress and targets? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
      }
    });

    document.getElementById('btn-change-source')?.addEventListener('click', openSourceSettingsModal);

    document.getElementById('btn-signin-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        try {
          await window.FirebaseSync.signInWithGoogle();
        } catch (e) {
          showToast('Sign in failed.', 'error');
        }
      }
    });

    document.getElementById('btn-signout-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        await window.FirebaseSync.signOutUser();
        showToast('Signed out.', 'info');
        renderProfileView(stats);
      }
    });

    document.getElementById('btn-open-contact-modal')?.addEventListener('click', openContactModal);

    document.getElementById('btn-copy-support-email')?.addEventListener('click', () => {
      const email = 'support@flowmd.app';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => showToast('Support Email Copied: support@flowmd.app', 'content_copy'));
      } else {
        showToast('Support Email: support@flowmd.app', 'mail');
      }
    });
  }

  // --- Developer Support & Contact Us Modal Controller ---
  function openContactModal() {
    const modal = document.createElement('div');
    // Support modal is dynamically created — use inline styles for backdrop
    // (not class-based .active toggling used by static HTML modals)
    modal.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'background:rgba(0,0,0,0.82)', 'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'box-sizing:border-box'
    ].join(';');

    const userEmail = (state.personal && state.personal.syncEmail) || '';
    const docName = (state.personal && state.personal.doctorName) || 'Dr. Aspirant';
    const streak = typeof getStudyStreak === 'function' ? getStudyStreak() : 0;
    const overallMastery = (typeof getSyllabusStats === 'function' && getSyllabusStats().percentage) || 0;
    const sysInfo = `Doctor: ${docName} | Streak: ${streak}d | Mastery: ${overallMastery}% | App Version: v111.0`;

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px; width: 92%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid var(--retro-cyan, #00f0ff); padding-bottom: 12px;">
          <div>
            <div style="font-family: var(--font-hud), monospace; font-size: 0.75rem; font-weight: 700; color: var(--retro-gold, #ffcc00); letter-spacing: 0.08em; text-transform: uppercase;">
              <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">push_pin</span> FLOWMD DEVELOPER SUPPORT
            </div>
            <h3 style="font-family: var(--font-display), monospace; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 2px 0 0 0; display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined" style="color: var(--retro-cyan, #00f0ff);">support_agent</span>
              <span>Contact Developer & Support</span>
            </h3>
          </div>
          <button id="btn-close-contact-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0 4px; line-height: 1;"><span class="material-symbols-outlined" style="font-size:20px;">close</span></button>
        </div>

        <div id="contact-form-container">
          <form id="contact-support-form">
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="contact-category" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Topic / Category</label>
              <select id="contact-category" class="form-select" style="height: 42px; font-weight: 600; font-family: inherit;">
<option value="bug_report"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">bug_report</span> Bug Report / Technical Issue</option>
                  <option value="feature_request"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">lightbulb</span> Feature Suggestion / Idea</option>
                  <option value="dual_track_help"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">bolt</span> Dual-Track Setup Assistance</option>
                  <option value="general_feedback" selected><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">mail</span> General Feedback & Inquiry</option>
                  <option value="data_sync_help"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">cloud</span> Google Cloud Sync Question</option>
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div class="form-group" style="margin: 0;">
                <label for="contact-email" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Your Email / Contact</label>
                <input type="email" id="contact-email" class="form-input" value="${userEmail}" placeholder="doctor@example.com" style="height: 42px; font-family: inherit;">
              </div>
              <div class="form-group" style="margin: 0;">
                <label for="contact-priority" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Priority Level</label>
                <select id="contact-priority" class="form-select" style="height: 42px; font-family: inherit;">
                  <option value="normal" selected><span class="material-symbols-outlined" style="font-size:15px;color:#10b981;">circle</span> Normal (Routine)</option>
                  <option value="high"><span class="material-symbols-outlined" style="font-size:15px;color:#f59e0b;">circle</span> High (Important)</option>
                  <option value="urgent"><span class="material-symbols-outlined" style="font-size:15px;color:#ef4444;">circle</span> Urgent (App Blocking)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label for="contact-subject" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Subject</label>
              <input type="text" id="contact-subject" class="form-input" placeholder="e.g. Assistance with Dual-Track Plan B Schedule" style="height: 42px; font-family: inherit;">
            </div>

            <div class="form-group" style="margin-bottom: 12px;">
              <label for="contact-message" style="font-family: var(--font-hud); font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Detailed Description / Message</label>
              <textarea id="contact-message" class="form-input" style="height: 90px; padding: 10px; font-family: inherit; line-height: 1.4; resize: vertical;" placeholder="Describe what you experienced or what feature you would love to see..."></textarea>
            </div>

            <div class="form-group" style="margin-bottom: 16px; background: var(--bg-surface-raised, rgba(255,255,255,0.03)); padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 2px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin: 0; font-family: var(--font-hud); font-size: 0.88rem; color: var(--text-primary);">
                <input type="checkbox" id="contact-include-telemetry" checked style="width: 16px; height: 16px;">
                <span>Include System Telemetry (Exam, Streak, Progress & Version)</span>
              </label>
              <div style="font-family: var(--font-hud); font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                ⚡ ${sysInfo}
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <button type="submit" id="btn-submit-support-ticket" class="v2-arcade-btn" style="flex: 1; height: 46px; background: var(--accent-primary, #2563eb); color: #ffffff; font-size: 0.95rem;">
                <span class="material-symbols-outlined">send</span> Submit Support Ticket
              </button>
              <button type="button" id="btn-cancel-contact-modal" class="v2-arcade-btn" style="height: 46px; background: var(--bg-surface-raised); color: var(--text-primary);">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Bug Fix #5: lock body scroll while modal is open

    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = ''; // restore scroll on close
    };
    modal.querySelector('#btn-close-contact-modal').onclick = closeModal;
    modal.querySelector('#btn-cancel-contact-modal').onclick = closeModal;

    const handleFormSubmit = (e) => {
      if (e) e.preventDefault();
      const category = modal.querySelector('#contact-category')?.value || 'general_feedback';
      const email = modal.querySelector('#contact-email')?.value || state.personal.syncEmail || 'doctor@flowmd.app';
      const priority = modal.querySelector('#contact-priority')?.value || 'normal';
      const subject = modal.querySelector('#contact-subject')?.value || 'General Support Ticket';
      const message = modal.querySelector('#contact-message')?.value || 'Support request submitted from FlowMD App.';
      const includeTelemetry = modal.querySelector('#contact-include-telemetry')?.checked ?? true;

      // Bug Fix #4: validate required fields before submitting
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }
      if (!message || message.trim().length < 10) {
        showToast('Please describe your issue (min 10 characters).', 'error');
        return;
      }

      const ticketId = 'FLOWMD-TKT-' + Math.floor(1000 + Math.random() * 9000);
      const ticketData = {
        ticketId,
        category,
        email,
        priority,
        subject,
        message,
        telemetry: includeTelemetry ? sysInfo : 'None',
        createdAt: new Date().toISOString(),
        status: 'Open'
      };

      if (!state.supportTickets) state.supportTickets = [];
      state.supportTickets.unshift(ticketData);
      saveState();

      if (typeof db !== 'undefined' && db && db.collection) {
        db.collection('support_tickets').add(ticketData).catch(err => console.log('Offline ticket queued', err));
      }

      showToast(`Support Ticket ${ticketId} Created!`, 'mark_email_read');

      const containerEl = modal.querySelector('#contact-form-container');
      if (containerEl) {
        containerEl.innerHTML = `
          <div style="text-align: center; padding: 20px 10px;">
            <div style="width: 56px; height: 56px; background: var(--success-bg, rgba(16,185,129,0.15)); color: var(--success, #10b981); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto; font-size: 32px; font-weight: bold;">
              <span class="material-symbols-outlined" style="font-size:28px;">check_circle</span>
            </div>
            <h4 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">Ticket Submitted Successfully!</h4>
            <p style="font-family: var(--font-hud); font-size: 1rem; color: var(--text-secondary); margin-bottom: 16px;">
              Reference ID: <strong style="color: var(--accent-primary, #2563eb); font-size: 1.1rem;">${ticketId}</strong>
            </p>
            <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-color); padding: 12px; border-radius: 4px; text-align: left; font-size: 0.88rem; margin-bottom: 20px;">
              <div><strong>Subject:</strong> ${subject}</div>
              <div><strong>Category:</strong> ${category.replace('_', ' ').toUpperCase()} (${priority.toUpperCase()})</div>
              <div><strong>Contact Email:</strong> ${email}</div>
              <div style="margin-top: 6px; color: var(--text-muted); font-size: 0.8rem;">Our engineering team will review your ticket and reply to ${email} within 24 hours.</div>
            </div>
            <button class="v2-arcade-btn" id="btn-close-ticket-success" style="width: 100%; height: 44px; background: var(--v2-pine-green, #10b981); color: #fff;">Done</button>
          </div>
        `;

        const doneBtn = modal.querySelector('#btn-close-ticket-success');
        if (doneBtn) doneBtn.onclick = closeModal;
      }
    };

    const formEl = modal.querySelector('#contact-support-form');
    if (formEl) formEl.onsubmit = handleFormSubmit;
    // Bug Fix #1: removed submitBtn.onclick — button is type="submit" inside the form,
    // so form.onsubmit already handles it. Adding onclick too caused double-submission.
  }

  // --- Global Event Delegation for Contact & Support Feature Buttons ---
  document.addEventListener('click', (e) => {
    const contactBtn = e.target.closest('#btn-open-contact-modal, .btn-contact-support, #bs-btn-contact-developer, [data-action="open-contact"]');
    if (contactBtn) {
      e.preventDefault();
      if (typeof closeBottomSheet === 'function') closeBottomSheet();
      // Bug Fix #2: delay modal open to let bottom sheet slide-down transition finish (~300ms)
      // before appending modal to body — prevents iOS Safari clipping issue
      setTimeout(openContactModal, 320);
    }
  });

  // --- Profile Bottom Sheet Controller ---
  function openProfileBottomSheet() {
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';
    const initials = (docName.replace(/^Dr\.?\s*/i, '').trim().slice(0, 2) || 'DA').toUpperCase();

    DOM.bottomSheetContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div class="pxl-avatar pxl-avatar-lg pxl-avatar-cyan" style="margin: 0 auto 8px auto;">
          ${initials}
        </div>
        <div style="font-family: var(--font-display); font-weight: 700; font-size: 1.15rem;">${docName}</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="v2-arcade-btn" id="bs-btn-view-profile" style="width: 100%; justify-content: flex-start;">
          <span class="material-symbols-outlined">person</span> View Full Profile & Settings
        </button>
        <button class="v2-arcade-btn btn-contact-support" id="bs-btn-contact-developer" style="width: 100%; justify-content: flex-start; background: var(--accent-primary, #2563eb); color: #ffffff;">
          <span class="material-symbols-outlined">support_agent</span> Contact Developer & Support
        </button>
        <button class="v2-arcade-btn" id="bs-btn-view-goals" style="width: 100%; justify-content: flex-start;">
          <span class="material-symbols-outlined">tune</span> Synchronize Pace & Goals
        </button>
        ${isSynced ? `
          <button class="v2-arcade-btn" id="bs-btn-logout" style="width: 100%; justify-content: flex-start; background: var(--danger);">
            <span class="material-symbols-outlined">logout</span> Sign Out (${syncEmail})
          </button>
        ` : `
          <button class="v2-arcade-btn" id="bs-btn-login" style="width: 100%; justify-content: flex-start;">
            <span class="material-symbols-outlined">cloud_sync</span> Sign In with Google
          </button>
        `}
      </div>
    `;

    DOM.bottomSheetOverlay.classList.add('active');

    document.getElementById('bs-btn-view-profile')?.addEventListener('click', () => {
      closeBottomSheet();
      switchView('profile');
    });

    document.getElementById('bs-btn-view-goals')?.addEventListener('click', () => {
      closeBottomSheet();
      openGoalModal();
    });

    document.getElementById('bs-btn-login')?.addEventListener('click', async () => {
      closeBottomSheet();
      if (window.FirebaseSync) {
        try {
          await window.FirebaseSync.signInWithGoogle();
        } catch (e) {
          showToast('Sign in failed.', 'error');
        }
      }
    });

    document.getElementById('bs-btn-logout')?.addEventListener('click', async () => {
      closeBottomSheet();
      if (window.FirebaseSync) {
        await window.FirebaseSync.signOutUser();
        showToast('Signed out.', 'info');
        render();
      }
    });
  }

  function closeBottomSheet() {
    if (DOM.bottomSheetOverlay) DOM.bottomSheetOverlay.classList.remove('active');
  }

  // --- Subject Metrics Helper ---
  function getSubjectOrSyllabusMetrics(selectedSubjectVal) {
    const stats = getSyllabusStats();
    if (!selectedSubjectVal || selectedSubjectVal === 'all') {
      const firstSub = stats.subjectsStats && stats.subjectsStats[0];
      if (firstSub) {
        selectedSubjectVal = firstSub.name;
      } else {
        return {
          name: 'No subject set',
          totalVideos: 0,
          completedVideos: 0,
          remainingVideos: 1,
          totalHours: 1,
          completedHours: 0,
          remainingHours: 1
        };
      }
    }

    const sub = stats.subjectsStats.find(s => s.name === selectedSubjectVal || s.id === selectedSubjectVal);
    if (!sub) {
      return {
        name: selectedSubjectVal,
        totalVideos: 100,
        completedVideos: 0,
        remainingVideos: 100,
        totalHours: 50,
        completedHours: 0,
        remainingHours: 50
      };
    }

    const totVids = sub.totalVideos || 1;
    const compVids = sub.completedVideos || 0;
    const remVids = Math.max(1, totVids - compVids);

    const totHrs = parseFloat(sub.totalHours) || 1;
    const compHrs = parseFloat(sub.completedHours) || 0;
    const remHrs = Math.max(0.1, totHrs - compHrs);

    return {
      name: sub.name,
      totalVideos: totVids,
      completedVideos: compVids,
      remainingVideos: remVids,
      totalHours: totHrs,
      completedHours: compHrs,
      remainingHours: remHrs
    };
  }

  // --- Haptics Utility (Vibration Feedback API) ---
  function triggerHaptic(type = 'step') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'step') navigator.vibrate(12);
        else if (type === 'prev') navigator.vibrate(8);
        else if (type === 'finish' || type === 'install') navigator.vibrate([25, 40, 25]);
        else navigator.vibrate(10);
      } catch (e) {}
    }
  }




  // --- Unified Toast System ---
  const toastQueue = [];
  let toastActive = false;
  const MAX_TOASTS = 3;

  function showToast(message, type = 'success', title = '') {
    // Remove old toasts if queue full
    if (toastQueue.length >= MAX_TOASTS) {
      toastQueue.shift().remove();
    }

    if (!toastActive) {
      if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
          position: fixed; bottom: 20px; right: 20px; z-index: 9999;
          display: flex; flex-direction: column; gap: 8px;
          pointer-events: none; max-width: 360px;
        `;
        document.body.appendChild(container);
      }
    }

    const toast = document.createElement('div');
    const alertTone = type === 'warning' ? 'warning' : type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success';
    const alertIcon = type === 'warning' ? 'warning' : type === 'error' ? 'error' : type === 'info' ? 'info' : 'check_circle';
    
    toast.className = `pxl-alert pxl-alert-${alertTone} pxl-toast-alert`;
    toast.style.cssText = `
      pointer-events: auto; min-width: 280px; max-width: 360px;
      animation: toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 8px 24px -4px rgba(0,0,0,0.2);
    `;
    
    const titleHtml = title ? `<div class="pxl-alert-title">${title}</div>` : '';
    toast.innerHTML = `
      <span class="material-symbols-outlined pxl-alert-icon">${alertIcon}</span>
      <div class="pxl-alert-content">${titleHtml}<div class="pxl-alert-message">${message}</div></div>
      <button class="pxl-alert-close-btn" aria-label="Dismiss"><span class="material-symbols-outlined">close</span></button>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    toastQueue.push(toast);
    toastActive = true;

    toast.querySelector('.pxl-alert-close-btn').addEventListener('click', () => dismissToast(toast));

    // Auto-dismiss
    const duration = type === 'error' ? 6000 : 4000;
    setTimeout(() => dismissToast(toast), duration);

    return toast;
  }

  // Expose minimal toast API for external/testing use
  window.showToast = showToast;

  function dismissToast(toast) {
    if (toast.classList.contains('dismissing')) return;
    toast.classList.add('dismissing');
    toast.style.animation = 'toastSlideOut 0.2s ease-in forwards';
    setTimeout(() => {
      toast.remove();
      const idx = toastQueue.indexOf(toast);
      if (idx > -1) toastQueue.splice(idx, 1);
      toastActive = toastQueue.length > 0;
    }, 200);
  }

  // --- Toast Animations (injected once) ---
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes toastSlideIn {
        from { opacity: 0; transform: translateX(100%) translateY(20px); }
        to { opacity: 1; transform: translateX(0) translateY(0); }
      }
      @keyframes toastSlideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(120%) translateY(-10px); }
      }
      .pxl-toast-alert {
        display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px;
        border-radius: 10px; border: 1px solid var(--border-color);
        background: var(--bg-surface-raised); color: var(--text-primary);
        font-family: var(--font-hud), 'Inter', sans-serif; font-size: 0.85rem;
      }
      .pxl-toast-alert .pxl-alert-content { flex: 1; }
      .pxl-toast-alert .pxl-alert-title { font-weight: 700; margin-bottom: 4px; }
      .pxl-toast-alert .pxl-alert-message { color: var(--text-secondary); line-height: 1.4; }
      .pxl-toast-alert .pxl-alert-close-btn {
        background: none; border: none; color: var(--text-muted); cursor: pointer;
        padding: 2px; display: flex; align-items: center; justify-content: center;
        font-size: 18px; line-height: 1; opacity: 0.6; transition: opacity 0.15s;
        flex-shrink: 0; margin-top: -2px;
      }
      .pxl-toast-alert .pxl-alert-close-btn:hover { opacity: 1; color: var(--text-primary); }
      [data-theme-style="retro"] .pxl-toast-alert {
        border: 2px solid var(--v2-ink); border-radius: 0; box-shadow: 4px 4px 0 0 var(--v2-ink);
        background: var(--bg-surface-raised); font-family: var(--font-hud), "VT323", monospace;
      }
      [data-theme-style="retro"] .pxl-toast-alert .pxl-alert-close-btn { color: var(--v2-ink); }
    `;
    document.head.appendChild(style);
  }

  // Read the currently selected chapter for a plan tab in the goal modal.
  // Returns [] when "All Chapters" (full subject) is active, or [singleName] when one chapter is focused.
  function getSelectedUnitsForPlanKey(isPlanB) {
    const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
    if (!container) return [];
    const allChip = container.querySelector('.gcm-chip[data-chap="__all__"]');
    if (allChip && allChip.classList.contains('selected')) return [];
    const selChip = container.querySelector('.gcm-chip.selected[data-chap]');
    const name = selChip ? selChip.getAttribute('data-chap') : null;
    return (name && name !== '__all__') ? [name] : [];
  }

  // --- Goal Modal Helpers (Dual-Plan Fully Functional) ---
  function openGoalModal() {
    if (!DOM.goalModal) return;
    const subSelectA = document.getElementById('select-target-subject');
    const subSelectB = document.getElementById('select-target-subject-b');
    const srcLabelEl = document.getElementById('goal-source-label');
    const sid = state.activeSource || 'marrow_8';

    function renderSubjectOptionsFor(sourceId, selectEl, preferredValue) {
      if (!selectEl) return null;
      const stats = getSyllabusStatsForSource(sourceId);
      let html = stats.subjectsStats.map(s => `
        <option value="${s.name}">${s.name} (${s.totalVideos} Videos • ${s.totalHours}h)</option>
      `).join('');
      if (!html) html = '<option value="">No subjects available</option>';
      selectEl.innerHTML = html;
      if (preferredValue && selectEl.querySelector(`option[value="${preferredValue}"]`)) {
        selectEl.value = preferredValue;
      } else {
        selectEl.selectedIndex = 0;
      }
      return stats;
    }

    function populateSubjectUI() {
      if (srcLabelEl) {
        const src = STUDY_SOURCES.find(s => s.id === sid);
        srcLabelEl.textContent = src ? src.label : 'Marrow Edition 8';
      }
      renderSubjectOptionsFor(sid, subSelectA, state.plans && state.plans[0] ? state.plans[0].targetSubject : '');
      renderSubjectOptionsFor(sid, subSelectB, state.plans && state.plans[1] ? state.plans[1].targetSubject : '');
    }

    populateSubjectUI();

    const planA = state.plans[0] || DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT);
    const hasPlanB = state.plans.length >= 2;
    const planB = hasPlanB ? state.plans[1] : DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology');

    // Populate Plan A Form
    if (subSelectA) {
      if (planA.targetSubject && subSelectA.querySelector(`option[value="${planA.targetSubject}"]`)) {
        subSelectA.value = planA.targetSubject;
      } else if (subSelectA.options.length > 0) {
        subSelectA.selectedIndex = 0;
      }
    }
    const dateInputA = document.getElementById('input-target-date');
    if (dateInputA) dateInputA.value = planA.targetDate || '2026-08-15';
    const vidsInputA = document.getElementById('input-videos-per-day');
    if (vidsInputA) vidsInputA.value = planA.videosPerDay || 8;

    // Populate Plan B Form
    if (subSelectB) {
      const prefB = planB.targetSubject || 'Pathology';
      if (subSelectB.querySelector(`option[value="${prefB}"]`)) {
        subSelectB.value = prefB;
      } else if (subSelectB.options.length > 0) {
        subSelectB.selectedIndex = 0;
      }
    }
    const dateInputB = document.getElementById('input-target-date-b');
    if (dateInputB) dateInputB.value = planB.targetDate || '2026-08-15';
    const vidsInputB = document.getElementById('input-videos-per-day-b');
    if (vidsInputB) vidsInputB.value = planB.videosPerDay || 8;

    // --- Focus Chapter: render + wire single-select chips ---
    function updateChapterCount(isPlanB, total) {
      const countEl = document.getElementById(isPlanB ? 'chapters-count-b' : 'chapters-count-a');
      if (!countEl) return;
      const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
      const allChip = container ? container.querySelector('.gcm-chip[data-chap="__all__"]') : null;
      if (allChip && allChip.classList.contains('selected')) {
        countEl.textContent = 'All chapters';
      } else {
        const selChip = container ? container.querySelector('.gcm-chip.selected[data-chap]:not([data-chap="__all__"])') : null;
        countEl.textContent = selChip ? `1 of ${total || 0}` : 'All chapters';
      }
    }

    function renderUnitChips(planKey, subjectVal) {
      const isPlanB = (planKey === 'plan_b');
      const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
      if (!container) return;
      const idx = isPlanB ? 1 : 0;

      const sid = state.activeSource || 'marrow_8';
      let chapters = [];
      try {
        const dataset = getDataset();
        const sub = dataset.find(s => s && (s.subject === subjectVal || s.id === subjectVal));
        chapters = (sub && sub.chapters) ? sub.chapters : [];
      } catch (e) {
        chapters = [];
      }

      if (chapters.length === 0) {
        container.innerHTML = '<div class="gcm-chips-empty">No chapters found for this subject.</div>';
        updateChapterCount(isPlanB, 0);
        return;
      }

      const savedUnits = (state.plans && state.plans[idx] && Array.isArray(state.plans[idx].targetUnits) && state.plans[idx].targetUnits.length > 0)
        ? state.plans[idx].targetUnits.map(u => String(u)) : null;

      // Single focus per plan: exactly one saved chapter -> select it; anything else (none or legacy multi) -> All Chapters.
      let focusedName = null;
      if (savedUnits && savedUnits.length === 1) {
        const match = chapters.find(c => c && String(c.name) === savedUnits[0]);
        if (match) focusedName = String(match.name);
      }

      const searchId = `gcm-chapter-search-${isPlanB ? 'b' : 'a'}`;
      const allChip = `<button type="button" class="gcm-chip ${focusedName ? '' : 'selected'}" data-chap="__all__"><span class="material-symbols-outlined" style="font-size:15px;">select_all</span><span>All Chapters</span></button>`;

      container.innerHTML = `
        <div class="gcm-chips-search">
          <span class="material-symbols-outlined" style="font-size:16px; color:var(--text-muted);">search</span>
          <input type="text" id="${searchId}" placeholder="Search chapters..." style="flex:1; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:8px 12px; font-family:var(--font-hud); font-size:0.85rem; color:var(--text-primary);" autocomplete="off">
        </div>
        <div class="gcm-chips-list" style="max-height:280px; overflow-y:auto;">${allChip + chapters.map(c => {
        const name = String(c.name);
        const on = (focusedName === name);
        const vcount = (c.videos && c.videos.length) || 0;
        return `<button type="button" class="gcm-chip ${on ? 'selected' : ''}" data-chap="${name}"><span>${name}</span><span class="gcm-chip-vids">${vcount}</span></button>`;
      }).join('')}</div>
      `;

      // Search filter
      const searchInput = document.getElementById(searchId);
      const chipList = container.querySelector('.gcm-chips-list');
      if (searchInput && chipList) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase().trim();
          chipList.querySelectorAll('.gcm-chip').forEach(chip => {
            const name = chip.querySelector('span')?.textContent?.toLowerCase() || '';
            const match = q === '' || name.includes(q);
            chip.style.display = match ? 'inline-flex' : 'none';
          });
        });
      }

      chipList.querySelectorAll('.gcm-chip').forEach(chip => {
        chip.onclick = () => {
          if (chip.classList.contains('selected')) {
            if (chip.getAttribute('data-chap') !== '__all__') {
              // Deselect a focused chapter -> back to full subject
              container.querySelectorAll('.gcm-chip').forEach(c => c.classList.remove('selected'));
              container.querySelector('.gcm-chip[data-chap="__all__"]')?.classList.add('selected');
            }
          } else {
            container.querySelectorAll('.gcm-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
          }
          updateChapterCount(isPlanB, chapters.length);
          synchronizeModalPace('subjectChange', planKey);
        };
      });

      updateChapterCount(isPlanB, chapters.length);
    }

    renderUnitChips('plan_a', subSelectA ? subSelectA.value : '');
    renderUnitChips('plan_b', subSelectB ? subSelectB.value : '');

    const togglePlanB = document.getElementById('toggle-plan-b');
    if (togglePlanB) togglePlanB.checked = hasPlanB;

    const tabA = document.getElementById('goal-tab-plan-a');
    const tabB = document.getElementById('goal-tab-plan-b');
    const formA = document.getElementById('goal-plan-a-form');
    const formB = document.getElementById('goal-plan-b-form');

    function switchGoalTab(activeTab) {
      if (activeTab === 'plan_a') {
        if (tabA) { tabA.classList.add('active'); tabA.style.background = '#3b82f633'; tabA.style.opacity = '1'; }
        if (tabB) { tabB.classList.remove('active'); tabB.style.background = 'transparent'; tabB.style.opacity = '0.8'; }
        if (formA) formA.style.display = 'block';
        if (formB) formB.style.display = 'none';
        synchronizeModalPace('init', 'plan_a');
      } else {
        if (tabB) { tabB.classList.add('active'); tabB.style.background = '#f43f5e33'; tabB.style.opacity = '1'; }
        if (tabA) { tabA.classList.remove('active'); tabA.style.background = 'transparent'; tabA.style.opacity = '0.8'; }
        if (formB) formB.style.display = 'block';
        if (formA) formA.style.display = 'none';
        if (togglePlanB && !togglePlanB.checked) {
          togglePlanB.checked = true;
          if (state.plans.length < 2) {
            state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
          }
        }
        synchronizeModalPace('init', 'plan_b');
      }
    }

    if (tabA) tabA.onclick = () => switchGoalTab('plan_a');
    if (tabB) tabB.onclick = () => switchGoalTab('plan_b');

    if (togglePlanB) {
      togglePlanB.onchange = () => {
        if (togglePlanB.checked) {
          if (state.plans.length < 2) {
            state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
          }
          switchGoalTab('plan_b');
        } else {
          if (state.plans.length >= 2) {
            state.plans.splice(1, 1);
          }
          switchGoalTab('plan_a');
        }
        saveState();
      };
    }

    // --- Save Plan A Action ---
    const btnApplyA = document.getElementById('btn-apply-goals');
    if (btnApplyA) {
      btnApplyA.onclick = () => {
        state.isConfigured = true;
        if (!state.plans[0]) state.plans[0] = DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT);
        state.plans[0].targetSubject = subSelectA ? subSelectA.value : '';
        state.plans[0].targetDate = dateInputA ? dateInputA.value : '2026-08-15';
        state.plans[0].videosPerDay = Math.max(1, parseInt(vidsInputA ? vidsInputA.value : 8) || 8);
        state.plans[0].videosPerWeek = state.plans[0].videosPerDay * 7;
        state.plans[0].videosPerMonth = state.plans[0].videosPerDay * 30;
        state.plans[0].goalMode = state.goals.goalMode || 'video';
        state.plans[0].targetUnits = getSelectedUnitsForPlanKey(false);

        // Keep legacy state.goals updated
        state.goals.targetSubject = state.plans[0].targetSubject;
        state.goals.targetDate = state.plans[0].targetDate;
        state.goals.videosPerDay = state.plans[0].videosPerDay;

        saveState();
        showToast('Plan A Target Configured & Saved!', 'check_circle', 'Plan A Updated');
        closeGoalModal();
        render();
      };
    }

    // --- Save Plan B Action ---
    const btnApplyB = document.getElementById('btn-apply-goals-b');
    if (btnApplyB) {
      btnApplyB.onclick = () => {
        if (state.plans.length < 2) {
          state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
        }
        state.plans[1].targetSubject = subSelectB ? subSelectB.value : 'Pathology';
        state.plans[1].targetDate = dateInputB ? dateInputB.value : '2026-08-15';
        state.plans[1].videosPerDay = Math.max(1, parseInt(vidsInputB ? vidsInputB.value : 8) || 8);
        state.plans[1].videosPerWeek = state.plans[1].videosPerDay * 7;
        state.plans[1].videosPerMonth = state.plans[1].videosPerDay * 30;
        state.plans[1].goalMode = state.goals.goalModeB || 'video';
        state.plans[1].targetUnits = getSelectedUnitsForPlanKey(true);

        saveState();
        showToast('Plan B Target Configured & Saved!', 'check_circle', 'Plan B Updated');
        closeGoalModal();
        render();
      };
    }

    // --- Remove Plan B Action ---
    const btnRemoveB = document.getElementById('btn-remove-plan-b');
    if (btnRemoveB) {
      btnRemoveB.onclick = () => {
        if (state.plans.length >= 2) state.plans.splice(1, 1);
        if (togglePlanB) togglePlanB.checked = false;
        saveState();
        showToast('Plan B Target Disabled.', 'info', 'Single Plan Mode');
        switchGoalTab('plan_a');
        closeGoalModal();
        render();
      };
    }

    // Close & Cancel buttons
    const btnCancelA = document.getElementById('btn-cancel-goals');
    if (btnCancelA) btnCancelA.onclick = closeGoalModal;
    const btnCancelB = document.getElementById('btn-cancel-goals-b');
    if (btnCancelB) btnCancelB.onclick = closeGoalModal;
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) modalCloseBtn.onclick = closeGoalModal;

    // --- Mode Switchers for Plan A ---
    const btnVideoA = document.getElementById('tab-btn-video');
    const btnHoursA = document.getElementById('tab-btn-hours');
    const fieldsVideoA = document.getElementById('fields-video-mode');
    const fieldsHoursA = document.getElementById('fields-hours-mode');

    function setModalModeA(mode) {
      state.goals.goalMode = mode;
      if (mode === 'video') {
        if (btnVideoA) btnVideoA.classList.add('active');
        if (btnHoursA) btnHoursA.classList.remove('active');
        if (fieldsVideoA) fieldsVideoA.style.display = 'block';
        if (fieldsHoursA) fieldsHoursA.style.display = 'none';
      } else {
        if (btnHoursA) btnHoursA.classList.add('active');
        if (btnVideoA) btnVideoA.classList.remove('active');
        if (fieldsHoursA) fieldsHoursA.style.display = 'block';
        if (fieldsVideoA) fieldsVideoA.style.display = 'none';
      }
      synchronizeModalPace('init', 'plan_a');
    }

    if (btnVideoA) btnVideoA.onclick = () => setModalModeA('video');
    if (btnHoursA) btnHoursA.onclick = () => setModalModeA('hours');

    if (subSelectA) subSelectA.onchange = () => {
      renderUnitChips('plan_a', subSelectA.value);
      synchronizeModalPace('subjectChange', 'plan_a');
    };
    if (dateInputA) dateInputA.oninput = () => synchronizeModalPace('date', 'plan_a');
    if (vidsInputA) vidsInputA.oninput = () => synchronizeModalPace('dailyVids', 'plan_a');

    // --- Mode Switchers for Plan B ---
    const btnVideoB = document.getElementById('tab-btn-video-b');
    const btnHoursB = document.getElementById('tab-btn-hours-b');
    const fieldsVideoB = document.getElementById('fields-video-mode-b');
    const fieldsHoursB = document.getElementById('fields-hours-mode-b');

    function setModalModeB(mode) {
      state.goals.goalModeB = mode;
      if (mode === 'video') {
        if (btnVideoB) btnVideoB.classList.add('active');
        if (btnHoursB) btnHoursB.classList.remove('active');
        if (fieldsVideoB) fieldsVideoB.style.display = 'block';
        if (fieldsHoursB) fieldsHoursB.style.display = 'none';
      } else {
        if (btnHoursB) btnHoursB.classList.add('active');
        if (btnVideoB) btnVideoB.classList.remove('active');
        if (fieldsHoursB) fieldsHoursB.style.display = 'block';
        if (fieldsVideoB) fieldsVideoB.style.display = 'none';
      }
      synchronizeModalPace('init', 'plan_b');
    }

    if (btnVideoB) btnVideoB.onclick = () => setModalModeB('video');
    if (btnHoursB) btnHoursB.onclick = () => setModalModeB('hours');

    if (subSelectB) subSelectB.onchange = () => {
      renderUnitChips('plan_b', subSelectB.value);
      synchronizeModalPace('subjectChange', 'plan_b');
    };
    if (dateInputB) dateInputB.oninput = () => synchronizeModalPace('date', 'plan_b');
    if (vidsInputB) vidsInputB.oninput = () => synchronizeModalPace('dailyVids', 'plan_b');

    // Math Guide Accordion Toggles
    document.querySelectorAll('.math-guide-card').forEach(card => {
      const header = card.querySelector('.math-guide-header');
      const body = card.querySelector('.math-guide-body');
      const icon = card.querySelector('.math-guide-toggle-icon');
      if (header && body) {
        header.onclick = () => {
          const isHidden = (body.style.display === 'none' || !body.style.display);
          body.style.display = isHidden ? 'block' : 'none';
          if (icon) icon.textContent = isHidden ? 'expand_less' : 'expand_more';
        };
      }
    });

    // Stepper buttons (±) for the pace inputs
    document.querySelectorAll('#goal-modal .gcm-step').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const wrap = btn.closest('.gcm-pace-input-wrap');
        const input = wrap ? wrap.querySelector('.gcm-pace-input') : null;
        if (!input) return;
        const isPlus = btn.textContent.trim() === '+';
        const step = parseFloat(input.step) || 1;
        const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
        const max = input.max !== '' ? parseFloat(input.max) : Infinity;
        let val = (parseFloat(input.value) || 0) + (isPlus ? step : -step);
        val = Math.min(max, Math.max(min, val));
        input.value = val;
        const isPlanB = !!btn.closest('#goal-plan-b-form');
        const planKey = isPlanB ? 'plan_b' : 'plan_a';
        const isHours = !!input.closest('#fields-hours-mode' + (isPlanB ? '-b' : ''));
        const isDaily = /per-day|daily-target/.test(input.id);
        if (isDaily) {
          synchronizeModalPace(isHours ? 'dailyHours' : 'dailyVids', planKey);
        } else if (!isHours) {
          const vidsWeek = document.getElementById(isPlanB ? 'input-videos-per-week-b' : 'input-videos-per-week');
          const vidsMonth = document.getElementById(isPlanB ? 'input-videos-per-month-b' : 'input-videos-per-month');
          const day = document.getElementById(isPlanB ? 'input-videos-per-day-b' : 'input-videos-per-day');
          if (day) { const d = parseFloat(day.value) || 8; if (vidsWeek) vidsWeek.value = Math.max(1, Math.round(d * 7)); if (vidsMonth) vidsMonth.value = Math.max(1, Math.round(d * 30)); }
        }
      };
    });

    switchGoalTab('plan_a');
    setModalModeA(state.goals.goalMode || 'video');
    setModalModeB(state.goals.goalModeB || 'video');
    DOM.goalModal.style.display = 'flex';
  }

  function synchronizeModalPace(source, planKey = 'plan_a') {
    const isPlanB = (planKey === 'plan_b');
    const subSelect = document.getElementById(isPlanB ? 'select-target-subject-b' : 'select-target-subject');
    const selectedSubVal = subSelect ? subSelect.value : (isPlanB ? 'Pathology' : '');
    const modalSource = state.activeSource || 'marrow_8';
    const selectedUnits = getSelectedUnitsForPlanKey(isPlanB);
    const metrics = getMetricsForModalScope(selectedSubVal, selectedUnits, modalSource);

    const dateInput = document.getElementById(isPlanB ? 'input-target-date-b' : 'input-target-date');
    const badge = document.getElementById(isPlanB ? 'days-remaining-badge-b' : 'days-remaining-badge');
    const bannerText = document.getElementById(isPlanB ? 'smart-math-text-b' : 'smart-math-text');
    const vidsInput = document.getElementById(isPlanB ? 'input-videos-per-day-b' : 'input-videos-per-day');
    const hoursInput = document.getElementById(isPlanB ? 'input-daily-target-b' : 'input-daily-target');

    let now = new Date();
    const planObj = isPlanB ? (state.plans[1] || {}) : (state.plans[0] || {});

    if (source === 'init' || source === 'subjectChange') {
      const defaultPace = planObj.videosPerDay || 8;
      const daysNeeded = Math.ceil(metrics.remainingVideos / defaultPace);
      const targetDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = targetDate.toISOString().slice(0, 10);
    }

    let targetDate = new Date(dateInput ? dateInput.value : '2026-12-31');
    const isPast = (targetDate <= now);
    if (isNaN(targetDate.getTime()) || targetDate <= now) {
      targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    let days = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));

    if (source === 'dailyVids') {
      const userVids = Math.max(1, parseInt(vidsInput ? vidsInput.value : 1) || 1);
      days = Math.ceil(metrics.remainingVideos / userVids);
      targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = targetDate.toISOString().slice(0, 10);
    } else if (source === 'dailyHours') {
      const userHours = Math.max(0.5, parseFloat(hoursInput ? hoursInput.value : 0.5) || 0.5);
      days = Math.ceil(metrics.remainingHours / userHours);
      targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = targetDate.toISOString().slice(0, 10);
    }

    if (badge) badge.textContent = `${days} Days Left`;

    const dailyVids = Math.max(1, Math.ceil(metrics.remainingVideos / days));
    const weeklyVids = dailyVids * 7;
    const monthlyVids = dailyVids * 30;

    if (source !== 'dailyVids' && vidsInput) vidsInput.value = dailyVids;
    const vidsWeekEl = document.getElementById(isPlanB ? 'input-videos-per-week-b' : 'input-videos-per-week');
    if (vidsWeekEl) vidsWeekEl.value = weeklyVids;
    const vidsMonthEl = document.getElementById(isPlanB ? 'input-videos-per-month-b' : 'input-videos-per-month');
    if (vidsMonthEl) vidsMonthEl.value = monthlyVids;

    const dailyHours = Math.max(0.1, (metrics.remainingHours / days)).toFixed(1);
    const weeklyHours = (parseFloat(dailyHours) * 7).toFixed(1);
    const monthlyHours = Math.round(parseFloat(dailyHours) * 30);

    if (source !== 'dailyHours' && hoursInput) hoursInput.value = dailyHours;
    const hrsWeekEl = document.getElementById(isPlanB ? 'input-weekly-target-b' : 'input-weekly-target');
    if (hrsWeekEl) hrsWeekEl.value = weeklyHours;
    const hrsMonthEl = document.getElementById(isPlanB ? 'input-monthly-target-b' : 'input-monthly-target');
    if (hrsMonthEl) hrsMonthEl.value = monthlyHours;

    const dateFormatted = targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (bannerText) {
      if (isPast) {
        bannerText.textContent = `⚠️ Target deadline has passed. Update daily target to auto-generate completion date.`;
      } else {
        const daysToFinish = Math.ceil(metrics.remainingVideos / dailyVids);
        const scopedNote = (metrics.scopedChapters > 0 && metrics.totalChapters > 0 && metrics.scopedChapters < metrics.totalChapters)
          ? ` (${metrics.scopedChapters} chapters)` : '';
        if (daysToFinish < days) {
          bannerText.textContent = `🎉 Comfortably Ahead! Finish ${selectedSubVal}${scopedNote} in ${daysToFinish} days.`;
        } else {
          bannerText.textContent = `🎯 Right on Track! ${dailyVids} vids/day finishes ${selectedSubVal}${scopedNote} on ${dateFormatted}.`;
        }
      }
    }
  }

  function closeGoalModal() {
    if (DOM.goalModal) DOM.goalModal.style.display = 'none';
  }

  // --- Study Source Settings Modal (separate dialog from Profile → Settings) ---
  function openSourceSettingsModal() {
    const modal = document.createElement('div');
    modal.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'background:rgba(0,0,0,0.82)', 'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'box-sizing:border-box'
    ].join(';');

    const current = state.activeSource || 'marrow_8';
    const options = STUDY_SOURCES.map(s => {
      const checked = s.id === current ? 'checked' : '';
      const upcoming = s.id === 'prepladder_x' ? 'upcoming' : '';
      const sub = s.id === 'prepladder_x' ? 'Coming soon — syllabus data arrives in a future update.' : `Switch to the ${s.short} syllabus for all subjects, chapters & targets.`;
      return `
        <button type="button" class="obw-option ${checked} ${upcoming}" data-src="${s.id}" role="radio" aria-checked="${checked ? 'true' : 'false'}">
          <span class="obw-radio"></span>
          <span>
            <span class="obw-option-title">${s.label}</span>
            <span class="obw-option-sub" style="display:block;">${sub}</span>
          </span>
        </button>`;
    }).join('');

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 480px; width: 92%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 2px solid var(--retro-cyan, var(--accent-primary, #2563eb)); padding-bottom: 12px;">
          <div>
            <div style="font-family: var(--font-hud), monospace; font-size: 0.75rem; font-weight: 700; color: var(--retro-gold, var(--accent-primary, #f59e0b)); letter-spacing: 0.08em; text-transform: uppercase;">
              <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">settings</span> SETTINGS
            </div>
            <h3 style="font-family: var(--font-display), monospace; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 2px 0 0 0; display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined" style="color: var(--accent-primary, #2563eb);">auto_stories</span>
              <span>Study Source</span>
            </h3>
          </div>
          <button id="scs-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0 4px; line-height: 1;"><span class="material-symbols-outlined" style="font-size:20px;">close</span></button>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 6px 0; line-height: 1.5;">
          Choose which syllabus edition to plan against. The selected source drives every subject, chapter &amp; topic shown in the app.
        </p>

        <div class="obw-options" style="margin: 14px 0 8px 0;">
          ${options}
        </div>

        <div id="scs-upcoming-alert" class="obw-alert" style="display:${current === 'prepladder_x' ? 'flex' : 'none'};">
          <span class="material-symbols-outlined" style="font-size:16px;">info</span>
          Prepladder X is an upcoming feature. Its syllabus data will be available in a future update.
        </div>

        <div class="obw-alert" style="border-color: var(--warning); background: var(--warning-bg); color: var(--warning);">
          <span class="material-symbols-outlined" style="font-size:16px;">warning</span>
          Switching source resets your study plans &amp; targets for a fresh start on the new syllabus.
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
          <button id="scs-cancel" class="v2-arcade-btn" style="height: 40px; background: var(--bg-surface-raised); color: var(--text-primary);">Cancel</button>
          <button id="scs-save" class="v2-arcade-btn" style="height: 40px; background: var(--accent-primary, #2563eb); color: #ffffff;">Save Source</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    modal.querySelector('#scs-close').addEventListener('click', close);
    modal.querySelector('#scs-cancel').addEventListener('click', close);

    let selected = current;
    const upcomingAlert = modal.querySelector('#scs-upcoming-alert');
    modal.querySelectorAll('.obw-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selected = opt.getAttribute('data-src');
        modal.querySelectorAll('.obw-option').forEach(o => {
          o.classList.toggle('checked', o === opt);
          o.setAttribute('aria-checked', o === opt ? 'true' : 'false');
        });
        if (upcomingAlert) upcomingAlert.style.display = selected === 'prepladder_x' ? 'flex' : 'none';
      });
    });

    modal.querySelector('#scs-save').addEventListener('click', () => {
      if (selected === current) { close(); return; }
      const prevSource = current;
      state.activeSource = selected;
      if (state.activeSource === 'prepladder_x') {
        // Only allow if dataset exists; otherwise reject with toast.
        const hasData = SOURCE_DATA && SOURCE_DATA[selected] && SOURCE_DATA[selected].length > 0;
        if (!hasData) {
          state.activeSource = prevSource;
          showToast('Prepladder X syllabus is not available yet.', 'error', 'Source Unavailable');
          return;
        }
      }
      // Fresh setup for the new dataset
      state.plans = [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
      state.goals = { ...DEFAULT_GOALS };
      saveState();
      close();
      showToast(`Switched to ${getSourceLabel(selected)}.`, 'check_circle', 'Study Source Updated');
      updateTopbarSource();
      render();
    });
  }

  // Expose minimal toast API for external/testing use
  window.showToast = showToast;

  // --- Run Initialization ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
