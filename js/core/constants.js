/* ============================================================
   FlowMD Core — Constants & Static Data
   Pure values + lookup maps. No runtime state.
   ============================================================ */
(function () {
  'use strict';

  // --- Shared SVG Icon Set (PxlKit) ---
  const PXL_ICONS = {
    trophy: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M2 5h4v2H2zM18 5h4v2h-4zM5 3h14v3c0 4-3 6-7 6s-7-2-7-6V3zm7 7c2.5 0 4-1.6 4-4H8c0 2.4 1.5 4 4 4zm-1 4h2v3h2v2h-6v-2h2v-3z"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2c3.5 2 5 5.5 5 9l2 1v4l-3-1c-.5 1.5-1 3-2.5 4l-1.5-2h-2L8 19c-1.5-1-2-2.5-2.5-4l-3 1v-4l2-1c0-3.5 1.5-7 5-9zm0 3c-1.5 1.5-2.5 3.5-2.5 6v1h5v-1c0-2.5-1-4.5-2.5-6z"/></svg>'
  };

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

  window.FlowMD.constants = {
    PXL_ICONS,
    STORAGE_KEYS,
    STUDY_SOURCES,
    DEFAULT_PLAN,
    PLAN_A_ACCENT,
    PLAN_B_ACCENT,
    DEFAULT_PERSONAL,
    DEFAULT_GOALS,
    SUBJECT_ICONS,
    SUBJECT_SVG_ICONS,
    SUBJECT_COLORS,
    SUBJECT_FACULTY
  };
})();
