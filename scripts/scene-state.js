/* ============================================================
   FlowMD Landing — Scene State Builder
   Deterministic demo localStorage seed used by capture-scenes.cjs
   to stage realistic app screenshots for the landing page.

   All dates are computed relative to the execution date (no
   hardcoded dates), matching the app's local-date helpers.
   ============================================================ */
'use strict';

function toLocalDateKey(date) {
  const d = date || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function buildDemoState() {
  const now = new Date();
  const today = toLocalDateKey(now);

  // --- Dual-track plans (Plan A: Medicine 12/day, Plan B: Surgery 8/day) ---
  const planA = {
    id: 'plan_a',
    label: 'Plan A',
    accentColor: '#6c3baa',
    targetSubject: 'Medicine',
    targetDate: toLocalDateKey(addDays(now, 120)),
    videosPerDay: 12,
    videosPerWeek: 84,
    videosPerMonth: 360,
    queueBatchVideoIds: [],
    queueCompletedInBatch: 0,
    dailyTargetHours: null,
    targetUnits: []
  };

  const planB = {
    id: 'plan_b',
    label: 'Plan B',
    accentColor: '#f43f5e',
    targetSubject: 'Surgery',
    targetDate: toLocalDateKey(addDays(now, 150)),
    videosPerDay: 8,
    videosPerWeek: 56,
    videosPerMonth: 240,
    queueBatchVideoIds: [],
    queueCompletedInBatch: 0,
    dailyTargetHours: null,
    targetUnits: []
  };

  // --- Daily history: last 30 days, weekend dips, continuous study ---
  const dailyHistory = {};
  const dailyBySubject = { medicine: {}, surgery: {} };
  for (let i = 29; i >= 0; i--) {
    const day = toLocalDateKey(addDays(now, -i));
    const weekend = (addDays(now, -i).getDay() === 0 || addDays(now, -i).getDay() === 6);
    const medCount = weekend ? 4 + (i % 3) : 10 + (i % 4);
    const surCount = weekend ? 3 + (i % 2) : 6 + (i % 3);
    dailyHistory[day] = medCount + surCount;
    dailyBySubject.medicine[day] = medCount;
    dailyBySubject.surgery[day] = surCount;
  }

  // --- Completed videos (qualified ids: marrow_8::medicine__vN) ---
  const completedVideos = {};
  for (let n = 1; n <= 12; n++) completedVideos['marrow_8::medicine__v' + n] = true;
  for (let n = 1; n <= 12; n++) completedVideos['marrow_8::surgery__v' + n] = true;
  for (let n = 1; n <= 6; n++) completedVideos['marrow_8::anatomy__v' + n] = true;

  const goals = {
    targetDate: planA.targetDate,
    videosPerDay: 12,
    videosPerWeek: 84,
    videosPerMonth: 360,
    targetSubject: 'Medicine',
    visibleCards: { daily: true, weekly: true, monthly: true }
  };

  const unsetPlan = {
    id: 'plan_a',
    label: 'Plan A',
    accentColor: '#6c3baa',
    targetSubject: '',
    targetDate: '',
    videosPerDay: null,
    videosPerWeek: null,
    videosPerMonth: null,
    queueBatchVideoIds: [],
    queueCompletedInBatch: 0,
    dailyTargetHours: null,
    targetUnits: []
  };

  const editionSlice = (plans, dh, dhbs, activePlanId) => ({
    plans,
    goals: { ...goals },
    dailyHistory: dh,
    dailyHistoryBySubject: dhbs,
    activePlanId,
    bulkCompletedChapters: {}
  });

  const editions = {
    marrow_8: editionSlice([planA, planB], dailyHistory, dailyBySubject, 'plan_a'),
    marrow_6_5: editionSlice([{ ...unsetPlan }], {}, {}, 'plan_a')
  };

  return {
    'flowmd_schema_version': '4',
    'flowmd_is_configured': 'true',
    'flowmd_tutorial_seen': 'true',
    'flowmd_theme': 'dark',
    'flowmd_theme_style': 'modern',
    'flowmd_active_source': 'marrow_8',
    'flowmd_personal': JSON.stringify({ doctorName: 'Dr. Priya', isSynced: true, syncEmail: 'priya.dr@example.com' }),
    'flowmd_streak': JSON.stringify({ lastStudyDate: today, currentStreak: 21 }),
    'flowmd_completed_videos': JSON.stringify(completedVideos),
    'flowmd_editions_v4': JSON.stringify(editions),
    // Flat mirrors of the active edition (older readers keep working).
    'flowmd_plans_v2': JSON.stringify([planA, planB]),
    'flowmd_goals': JSON.stringify(goals),
    'flowmd_daily_history': JSON.stringify(dailyHistory),
    'flowmd_daily_history_by_subject': JSON.stringify(dailyBySubject),
    'flowmd_bulk_completed_chapters': JSON.stringify({}),
    'flowmd_queue_completed_in_batch': '0',
    'flowmd_queue_batch_videos': JSON.stringify([]),
    // Hide the first-visit PWA install helper so hero shots stay clean.
    'flowmd_install_helper_dismissed': '1'
  };
}

module.exports = { buildDemoState };
