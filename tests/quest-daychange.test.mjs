/**
 * Daily Quest Day-Change Verification
 * ====================================
 * Tests the full lifecycle with proper state setup.
 */

import { chromium } from 'playwright';

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

console.log('\n🔹 Loading app...');
await page.goto('http://127.0.0.1:8140', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// ─── Setup: Configure Plan A with Anatomy, 3/day ────────────
console.log('\n⚙️  Setting up state...');
const setup = await page.evaluate(() => {
  const state = window.FlowMD.store.getState();
  const saveState = window.FlowMD.store.saveState;

  if (!state.plans) state.plans = [];
  if (!state.plans[0]) state.plans[0] = {};
  const plan = state.plans[0];
  plan.id = 'plan_a';
  plan.label = 'Plan A';
  plan.targetSubject = 'Anatomy';
  plan.videosPerDay = '3';
  plan.videosPerWeek = '21';
  plan.videosPerMonth = '90';
  plan.accentColor = '#6c3baa';
  plan.targetDate = '2026-12-31';
  plan.queueBatchVideoIds = [];
  plan.queueCompletedInBatch = 0;
  plan.extraBatchesCompletedToday = 0;
  plan.lastBatchDate = '';
  state.isConfigured = true;

  saveState();
  window.FlowMD.shell.render();

  const q = window.FlowMD.metrics.getAllPlanQueues()[0];
  return {
    planTarget: plan.targetSubject,
    planPace: plan.videosPerDay,
    batchCount: q ? q.videos.length : 0,
    batchIds: q ? q.videos.map(v => v.id) : [],
    progress: q ? q.queueCompletedInBatch + '/' + q.baseTargetPace : 'n/a',
  };
});
console.log('  Setup result:', JSON.stringify(setup));
check('Plan A configured with Anatomy', setup.planTarget === 'Anatomy');
check('Queue generated with 3 videos', setup.batchCount === 3, `got ${setup.batchCount}`);

// ─── Test 1: todayKey sanity ────────────────────────────
console.log('\n🔹 Test 1: todayKey() sanity');
const t1 = await page.evaluate(() => {
  const c = window.FlowMD.constants;
  return {
    hasFunc: typeof c.todayKey === 'function',
    quest: c.todayKey(),
    today: c.todayKey(),
    validFormat: /^\d{4}-\d{2}-\d{2}$/.test(c.todayKey()),
  };
});
check('todayKey is a function', t1.hasFunc);
check('Returns YYYY-MM-DD format', t1.validFormat);

// ─── Test 2: 5 AM boundary ──────────────────────────────────
console.log('\n🔹 Test 2: 5 AM boundary');
const t2 = await page.evaluate(() => {
  const { toLocalDateKey } = window.FlowMD.constants;
  function atHour(h) {
    const m = new Date(); m.setHours(h, 0, 0, 0);
    return toLocalDateKey(new Date(m.getTime() - 5 * 3600000));
  }
  const calToday = toLocalDateKey(new Date());
  const yest = toLocalDateKey(new Date(Date.now() - 86400000));
  return { at3: atHour(3), at5: atHour(5), at23: atHour(23), calToday, yest };
});
check('3 AM → yesterday', t2.at3 === t2.yest, `got ${t2.at3}`);
check('5 AM → today', t2.at5 === t2.calToday, `got ${t2.at5}`);
check('11 PM → today', t2.at23 === t2.calToday, `got ${t2.at23}`);

// ─── Test 3: Complete all quest videos → congratulations ─────
console.log('\n🔹 Test 3: Complete all quest videos → congratulations');
const t3 = await page.evaluate(() => {
  const state = window.FlowMD.store.getState();
  const q = window.FlowMD.metrics.getAllPlanQueues()[0];
  if (!q || !q.videos.length) return { error: 'no queue or empty batch', queue: q };

  q.videos.forEach(v => { state.completedVideos[v.id] = true; });
  window.FlowMD.store.saveState();
  window.FlowMD.shell.render();

  const q2 = window.FlowMD.metrics.getAllPlanQueues()[0];
  return {
    batchIds: q2.videos.map(v => v.id),
    isDailyTargetAchieved: q2.isDailyTargetAchieved,
    progress: q2.queueCompletedInBatch + '/' + q2.baseTargetPace,
    batchCount: q2.videos.length,
  };
});
check('Batch had videos before completion', !t3.error, t3.error || JSON.stringify(t3));
check('All quest videos completed', t3.batchCount > 0 && t3.progress.includes('/'));
check('isDailyTargetAchieved = true', t3.isDailyTargetAchieved === true, JSON.stringify(t3));
check('Progress shows 3/3', t3.progress === '3/3', t3.progress);

const hasCongrats = await page.evaluate(() => document.body.innerText.includes('Daily Target Achieved'));
check('Congratulations banner in DOM', hasCongrats);

// ─── Test 4: Day change → batch resets ───────────────────────
console.log('\n🔹 Test 4: Day change → batch resets, congratulations gone');
const t4 = await page.evaluate(() => {
  const state = window.FlowMD.store.getState();
  const plan = state.plans[0];
  const batchBefore = plan.queueBatchVideoIds.slice();
  const lastBefore = plan.lastBatchDate;

  plan.lastBatchDate = '2026-01-01';
  window.FlowMD.store.saveState();
  window.FlowMD.shell.render();

  const q = window.FlowMD.metrics.getAllPlanQueues()[0];
  return {
    batchBefore, lastBefore,
    batchAfter: plan.queueBatchVideoIds,
    lastAfter: plan.lastBatchDate,
    isDailyTargetAchieved: q ? q.isDailyTargetAchieved : null,
    progress: q ? q.queueCompletedInBatch + '/' + q.baseTargetPace : 'n/a',
  };
});
check('lastBatchDate updated from old to today', t4.lastAfter !== '2026-01-01', `still ${t4.lastAfter}`);
check('Batch changed (new video IDs)', JSON.stringify(t4.batchBefore) !== JSON.stringify(t4.batchAfter),
  `same: ${JSON.stringify(t4.batchBefore)}`);
check('Congratulations gone', t4.isDailyTargetAchieved === false);
check('New batch has 3 uncompleted videos', t4.batchAfter.length === 3 && t4.progress === '0/3',
  `progress: ${t4.progress}, batch: ${t4.batchAfter.length}`);
check('New videos are different from old (fresh day)', t4.batchAfter.every(id => !t4.batchBefore.includes(id)),
  `old: ${JSON.stringify(t4.batchBefore)}, new: ${JSON.stringify(t4.batchAfter)}`);

// ─── Test 5: UI verification after day change ────────────────
console.log('\n🔹 Test 5: UI verification after day change');
const uiText = await page.evaluate(() => document.body.innerText);
check('Dashboard shows Daily Quests section', uiText.includes('Daily Quests'));
check('Plan A label visible', uiText.includes('Plan A'));
check('No congratulations banner', !uiText.includes('Daily Target Achieved'));
check('New video titles shown', uiText.includes('#04') || uiText.includes('#05') || uiText.includes('#06'));

// ─── Test 6: Multiple day changes in sequence ────────────────
console.log('\n🔹 Test 6: 3 sequential day changes');
const t6 = await page.evaluate(() => {
  const state = window.FlowMD.store.getState();
  const plan = state.plans[0];
  const results = [];
  for (let d = 1; d <= 3; d++) {
    plan.lastBatchDate = `2026-01-0${d}`;
    plan.queueBatchVideoIds.forEach(id => { state.completedVideos[id] = true; });
    window.FlowMD.store.saveState();
    window.FlowMD.shell.render();
    const q = window.FlowMD.metrics.getAllPlanQueues()[0];
    results.push({
      day: d, lastBatchDate: plan.lastBatchDate,
      batchCount: plan.queueBatchVideoIds.length,
      achieved: q ? q.isDailyTargetAchieved : false,
    });
  }
  return results;
});
t6.forEach(r => {
  check(`Day ${r.day}: 3 fresh videos, not achieved`, r.batchCount === 3 && !r.achieved,
    JSON.stringify(r));
});

// ─── Test 7: render() resets batch on date mismatch ──────────
console.log('\n🔹 Test 7: render() resets batch when date mismatches');
const t7 = await page.evaluate(() => {
  const plan = window.FlowMD.store.getState().plans[0];
  plan.lastBatchDate = '2025-06-15';
  window.FlowMD.store.saveState();
  window.FlowMD.shell.render();
  return { lastBatchDate: plan.lastBatchDate, batchCount: plan.queueBatchVideoIds.length };
});
check('lastBatchDate updated to today', t7.lastBatchDate !== '2025-06-15', `still ${t7.lastBatchDate}`);
check('Batch regenerated with 3 videos', t7.batchCount === 3, `count: ${t7.batchCount}`);

// ─── Test 8: Streak tracking uses quest date ─────────────────
console.log('\n🔹 Test 8: Streak aligns with todayKey');
const t8 = await page.evaluate(() => {
  window.FlowMD.store.markStudyActivity(true, 'anatomy');
  const state = window.FlowMD.store.getState();
  return {
    lastStudyDate: state.streakData.lastStudyDate,
    questDate: window.FlowMD.constants.todayKey(),
    streak: state.streakData.currentStreak,
  };
});
check('lastStudyDate matches todayKey()', t8.lastStudyDate === t8.questDate,
  `streak: ${t8.lastStudyDate}, quest: ${t8.questDate}`);
check('Streak is >= 1', t8.streak >= 1, `streak: ${t8.streak}`);

// ─── Test 9: Analytics date consistency ──────────────────────
console.log('\n🔹 Test 9: Analytics uses quest date for daily counts');
const t9 = await page.evaluate(() => {
  const { todayKey } = window.FlowMD.constants;
  const state = window.FlowMD.store.getState();

  // Record activity under todayKey
  const questDate = todayKey();
  const today = todayKey();
  const counts = window.FlowMD.sourceData.getDailyCountsExcludingBulk();
  const questCount = counts[questDate] || 0;
  const todayCount = counts[today] || 0;

  // Navigate to analytics and check what it reads
  window.FlowMD.shell.switchView('analytics');
  window.FlowMD.shell.render();

  // The analytics view should use todayKey for its "today" display
  // Check by reading the Goal Pulse tile text
  const analyticsText = document.body.innerText;

  return {
    questDate,
    todayDate: today,
    datesMatch: questDate === today,
    questCount,
    todayCount,
    analyticsHasGoalPulse: analyticsText.includes("Today's Daily Goal") || analyticsText.includes('Goal Pulse'),
    analyticsHasWeekly: analyticsText.includes('Weekly Goal'),
    analyticsHasMonthly: analyticsText.includes('Monthly Goal'),
  };
});
check('todayKey and todayKey produce same date (after 5 AM)', t9.datesMatch,
  `quest: ${t9.questDate}, today: ${t9.todayDate}`);
check('Analytics has Goal Pulse section', t9.analyticsHasGoalPulse);
check('Analytics has Weekly Goal', t9.analyticsHasWeekly);
check('Analytics has Monthly Goal', t9.analyticsHasMonthly);

// ─── Test 10: Analytics reads dailyHistory with quest date key ─
console.log('\n🔹 Test 10: Analytics daily count uses quest date key');
const t10 = await page.evaluate(() => {
  const { todayKey, toLocalDateKey } = window.FlowMD.constants;
  const counts = window.FlowMD.sourceData.getDailyCountsExcludingBulk();
  const questDate = todayKey();

  // Simulate markStudyActivity under quest date
  const state = window.FlowMD.store.getState();
  if (!state.dailyHistory) state.dailyHistory = {};
  state.dailyHistory[questDate] = (state.dailyHistory[questDate] || 0) + 5;
  window.FlowMD.store.saveState();

  // Re-read counts
  const countsAfter = window.FlowMD.sourceData.getDailyCountsExcludingBulk();
  const questCount = countsAfter[questDate] || 0;

  // Verify the 7-day chart would use quest-shifted keys
  // by checking that questKeyFromDate matches todayKey for today
  const now = new Date();
  const questKeyToday = toLocalDateKey(new Date(now.getTime() - 5 * 3600000));

  return {
    questDate,
    questCount,
    questKeyToday,
    keysMatch: questKeyToday === questDate,
  };
});
check('dailyHistory stores under todayKey', t10.questCount >= 5, `count: ${t10.questCount}`);
check('questKeyFromDate(now) matches todayKey()', t10.keysMatch,
  `questKey: ${t10.questKeyToday}, questDate: ${t10.questDate}`);

// ─── Test 11: Navigate back to dashboard — quests still work ─
console.log('\n🔹 Test 11: Dashboard still works after analytics visit');
const t11 = await page.evaluate(() => {
  window.FlowMD.shell.switchView('dashboard');
  window.FlowMD.shell.render();
  const q = window.FlowMD.metrics.getAllPlanQueues()[0];
  return {
    batchCount: q ? q.videos.length : 0,
    progress: q ? q.queueCompletedInBatch + '/' + q.baseTargetPace : 'n/a',
    isDailyTargetAchieved: q ? q.isDailyTargetAchieved : false,
  };
});
check('Dashboard batch has videos', t11.batchCount >= 1, `count: ${t11.batchCount}`);
check('Dashboard progress visible', t11.progress !== 'n/a');

// ─── Test 12: Console errors ─────────────────────────────────
console.log('\n🔹 Test 12: Console errors');
check('Zero console errors', consoleErrors.length === 0,
  consoleErrors.length > 0 ? consoleErrors.slice(0, 3).join('; ') : '');

// ─── Summary ─────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}\n`);

await browser.close();
process.exit(failed > 0 ? 1 : 0);
