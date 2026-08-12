import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlowMDSandbox } from './harness.mjs';

const toPlain = (v) => JSON.parse(JSON.stringify(v));

// state-store reads window.FlowMD.sync (edition field names) at init, so the
// sync core must load first — same order as the production index.html.
const STORE = ['namespace', 'constants', 'sync', 'state-store'];

test('safeParse returns fallback for corrupt JSON, parses valid JSON', () => {
  const { FlowMD } = createFlowMDSandbox({ modules: STORE });
  assert.equal(FlowMD.store.safeParse('{bad json', { a: 1 }).a, 1);
  assert.equal(FlowMD.store.safeParse(null, 'fallback'), 'fallback');
  assert.deepEqual(toPlain(FlowMD.store.safeParse('{"ok":true}', null)), { ok: true });
});

test('schema migration v1→v2 prefixes legacy video IDs on load', () => {
  const { FlowMD, localStorage } = createFlowMDSandbox({ modules: STORE });
  localStorage.setItem('marrow_planner_schema_version', '1');
  localStorage.setItem('marrow_planner_completed_videos', JSON.stringify({ legacy1: true }));
  FlowMD.store.loadState();
  const st = FlowMD.store.getState();
  assert.equal(st.completedVideos['marrow_8::legacy1'], true);
  assert.equal(st.completedVideos.legacy1, undefined);
});

test('markStudyActivity starts a streak on a new day and tracks daily history', () => {
  const { FlowMD } = createFlowMDSandbox({ modules: STORE });
  const st = FlowMD.store.getState();
  st.streakData = { lastStudyDate: '2020-01-01', currentStreak: 0 };
  FlowMD.store.markStudyActivity(true, 'anatomy');
  const today = FlowMD.constants.todayKey();
  assert.equal(st.streakData.currentStreak, 1);
  assert.equal(st.streakData.lastStudyDate, today);
  assert.equal(st.dailyHistory[today], 1);
  assert.equal(st.dailyHistoryBySubject.anatomy[today], 1);
});

test('markStudyActivity does not double-count the streak within the same day', () => {
  const { FlowMD } = createFlowMDSandbox({ modules: STORE });
  const st = FlowMD.store.getState();
  st.streakData = { lastStudyDate: FlowMD.constants.todayKey(), currentStreak: 3 };
  FlowMD.store.markStudyActivity(true);
  assert.equal(st.streakData.currentStreak, 3);
  assert.equal(st.dailyHistory[FlowMD.constants.todayKey()], 1);
});

test('markStudyActivity extends a streak from yesterday', () => {
  const { FlowMD } = createFlowMDSandbox({ modules: STORE });
  const st = FlowMD.store.getState();
  const yesterday = FlowMD.constants.toLocalDateKey(new Date(Date.now() - 86400000));
  st.streakData = { lastStudyDate: yesterday, currentStreak: 4 };
  FlowMD.store.markStudyActivity(true);
  assert.equal(st.streakData.currentStreak, 5);
});

test('saveState selective writes: unchanged state writes nothing after the first save', () => {
  const { FlowMD, setItemCalls } = createFlowMDSandbox({ modules: STORE });
  const st = FlowMD.store.getState();
  FlowMD.store.saveState();
  assert.equal(setItemCalls.length, 16, 'first save writes every key (incl. editions partition)');
  setItemCalls.length = 0;
  FlowMD.store.saveState();
  assert.equal(setItemCalls.length, 0, 'no-op save writes nothing');
  st.completedVideos['v1'] = true;
  FlowMD.store.saveState();
  assert.deepEqual(setItemCalls, ['flowmd_completed_videos']);
  assert.equal(st.completedVideosRevision, 1, 'completion change bumps stats revision');
});

test('mergePlansLocalWins: local fields win, cloud-only plans appended', () => {
  const { FlowMD } = createFlowMDSandbox({ modules: STORE });
  const merged = FlowMD.store.mergePlansLocalWins(
    [{ id: 'plan_a', label: 'Cloud A', videosPerDay: 8 }, { id: 'plan_b', label: 'Cloud B' }],
    [{ id: 'plan_a', label: 'Local A', videosPerDay: 9 }]
  );
  const plans = toPlain(merged);
  assert.equal(plans.length, 2);
  assert.equal(plans[0].label, 'Local A');
  assert.equal(plans[0].videosPerDay, 9);
  assert.equal(plans[1].id, 'plan_b');
});
