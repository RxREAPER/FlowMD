import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFlowMD } from './harness.mjs';

const { sync } = loadFlowMD();

// Values returned from the vm sandbox live in a different realm, so deepStrictEqual
// rejects their prototypes. JSON round-trip (toPlain) both normalizes realms and
// matches the real contract: this data is JSON-serialized to Firestore/localStorage.
const toPlain = (v) => JSON.parse(JSON.stringify(v));

test('sanitizeCloudState keeps known well-typed fields', () => {
  const out = sync.sanitizeCloudState({
    completedVideos: { 'marrow_8::v1': true },
    activeSource: 'marrow_8',
    goals: { videosPerDay: 8 },
    junkField: 'should be dropped',
    plans: 'not an array'
  });
  assert.deepEqual(toPlain(out), { completedVideos: { 'marrow_8::v1': true }, activeSource: 'marrow_8', goals: { videosPerDay: 8 } });
});

test('sanitizeCloudState drops wrong-typed completedVideos and plans', () => {
  assert.deepEqual(sync.sanitizeCloudState({ completedVideos: 'oops' }).completedVideos, undefined);
  assert.deepEqual(sync.sanitizeCloudState({ plans: 'oops' }).plans, undefined);
});

test('sanitizeCloudState coerces legacy retro themeStyle to modern', () => {
  const out = sync.sanitizeCloudState({ themeStyle: 'retro', activeSource: 'marrow_8' });
  assert.equal(toPlain(out).themeStyle, 'modern');
});

test('mergeLocalWins: completedVideos unions with local winning', () => {
  const merged = sync.mergeLocalWins(
    { completedVideos: { a: true, b: true } },        // local
    { completedVideos: { b: false, c: true } }        // cloud
  );
  assert.deepEqual(toPlain(merged.completedVideos), { a: true, b: true, c: true });
});

test('mergeLocalWins: plans merge by id, local fields win, cloud-only appended', () => {
  const merged = sync.mergeLocalWins(
    { plans: [{ id: 'plan_a', label: 'Local A', videosPerDay: 9 }] },
    { plans: [{ id: 'plan_a', label: 'Cloud A', videosPerDay: 8 }, { id: 'plan_b', label: 'Cloud B' }] }
  );
  const plans = toPlain(merged.plans);
  assert.equal(plans.length, 2);
  assert.equal(plans[0].label, 'Local A');
  assert.equal(plans[0].videosPerDay, 9);
  assert.equal(plans[1].id, 'plan_b');
});

test('computeDirtyFields only reports changed top-level fields', () => {
  const prev = { completedVideos: { a: true }, goals: { videosPerDay: 8 } };
  const next = { completedVideos: { a: true, b: true }, goals: { videosPerDay: 8 } };
  assert.deepEqual(toPlain(sync.computeDirtyFields(prev, next)), ['completedVideos']);
});

test('write-loop guard: equal timestamps resolve deterministically and cloud-won fields are not re-claimed', () => {
  // Equal timestamps: local wins (the local device keeps its value and its
  // clock; the merged result is the local value for non-union fields).
  const merged = sync.mergeCloudPerField(
    { themeStyle: 'retro' },
    { themeStyle: 'modern' },
    { themeStyle: 5000 },
    { themeStyle: 5000 }
  );
  assert.equal(merged.themeStyle, 'modern');
  // A field the cloud owns (newer cloud clock) must not be re-claimed by a
  // later push: merge keeps the cloud value, and the cloud clock stays
  // >= local, which is exactly what the auto-push guard checks.
  const merged2 = sync.mergeCloudPerField(
    { activePlanId: 'plan_b' },
    { activePlanId: 'plan_a' },
    { activePlanId: 9000 },
    { activePlanId: 1000 }
  );
  assert.equal(merged2.activePlanId, 'plan_b');
});

test('rehydrateCompletedVideos passes prefixed keys through, legacy unprefixed keys get the current source prefix', () => {
  const out = sync.rehydrateCompletedVideos({ 'anatomy__v1': true, 'marrow_6_5::anatomy__v2': true }, 'marrow_8');
  assert.deepEqual(toPlain(out), { 'marrow_8::anatomy__v1': true, 'marrow_6_5::anatomy__v2': true });
});

test('cloud stores FULL prefixed keys — both editions keep their own completions (no prefix collision)', () => {
  // Both editions share the same video id; the cloud doc must keep both.
  const out = sync.rehydrateCompletedVideos(
    { 'marrow_8::anatomy__v1': true, 'marrow_6_5::anatomy__v1': true },
    'marrow_6_5' // activeSource must not re-map the marrow_8 key
  );
  assert.deepEqual(toPlain(out), { 'marrow_8::anatomy__v1': true, 'marrow_6_5::anatomy__v1': true });
});

test('pruneHistoryMaps keeps only entries on/after the cutoff (lexicographic date keys)', () => {
  const [dh, dhbs] = sync.pruneHistoryMaps(
    { '2026-01-01': 3, '2026-05-10': 2, '2026-05-11': 1 },
    { anatomy: { '2026-01-01': 3, '2026-05-11': 1 }, pathology: { '2026-04-01': 5 } },
    '2026-05-10'
  );
  assert.deepEqual(toPlain(dh), { '2026-05-10': 2, '2026-05-11': 1 });
  assert.deepEqual(toPlain(dhbs), { anatomy: { '2026-05-11': 1 }, pathology: {} });
});

test('sanitizeCloudState drops dead fields and keeps only durable plan keys (incl. the quest batch)', () => {
  const out = sync.sanitizeCloudState({
    speed: 1.5,
    subjectUrgency: { anatomy: 1 },
    dailyBatch: null,
    queueCompletedInBatch: 3,
    queueBatchVideoIds: ['a', 'b'],
    lastSyncedAt: 'x',
    completedVideos: { 'anatomy__v1': true },
    plans: [{
      id: 'plan_a', targetSubject: 'Anatomy', videosPerDay: 8,
      queueBatchVideoIds: ['marrow_8::anatomy__v1', 'marrow_8::anatomy__v2'],
      queueCompletedInBatch: 2,
      extraBatchesCompletedToday: 1, lastBatchDate: '2026-05-11'
    }]
  });
  assert.equal(out.speed, undefined);
  assert.equal(out.subjectUrgency, undefined);
  assert.equal(out.dailyBatch, undefined);
  assert.equal(out.queueCompletedInBatch, undefined);
  // Top-level queueBatchVideoIds is a legacy FLAT field — dropped. The batch
  // lives INSIDE each plan and IS a synced key, so it survives sanitation.
  assert.equal(out.queueBatchVideoIds, undefined);
  assert.equal(out.lastSyncedAt, undefined);
  assert.deepEqual(toPlain(out.plans), [{
    id: 'plan_a', targetSubject: 'Anatomy', videosPerDay: 8,
    queueBatchVideoIds: ['marrow_8::anatomy__v1', 'marrow_8::anatomy__v2']
  }], 'quest batch is a synced plan key; per-day counters stay device-local');
});

// --- mergeCloudPerField: per-field newest-wins arbitration (manual sync) ---

test('mergeCloudPerField: cloud wins fields whose sync time is newer than local', () => {
  const merged = sync.mergeCloudPerField(
    { goals: { videosPerDay: 10 }, themeStyle: 'retro' },   // cloud
    { goals: { videosPerDay: 8 }, themeStyle: 'modern' },   // local
    { goals: 2000, themeStyle: 2000 },                      // cloud times
    { goals: 1000, themeStyle: 1000 }                       // local times
  );
  assert.equal(merged.goals.videosPerDay, 10);
  assert.equal(merged.themeStyle, 'retro');
});

test('mergeCloudPerField: local wins fields whose sync time is newer than cloud', () => {
  const merged = sync.mergeCloudPerField(
    { goals: { videosPerDay: 10 }, themeStyle: 'retro' },
    { goals: { videosPerDay: 8 }, themeStyle: 'modern' },
    { goals: 1000, themeStyle: 1000 },
    { goals: 2000, themeStyle: 2000 }
  );
  assert.equal(merged.goals.videosPerDay, 8);
  assert.equal(merged.themeStyle, 'modern');
});

test('mergeCloudPerField: completedVideos is a union — cloud additions join, local wins conflicts', () => {
  const merged = sync.mergeCloudPerField(
    { completedVideos: { v1: true, v2: false } },   // cloud
    { completedVideos: { v2: true, v3: true } },    // local
    { completedVideos: 9999 },
    { completedVideos: 1000 }
  );
  assert.deepEqual(toPlain(merged.completedVideos), { v1: true, v2: true, v3: true });
});

test('mergeCloudPerField: local-only fields stay, cloud-only fields arrive, no timestamps = cloud wins', () => {
  const merged = sync.mergeCloudPerField(
    { activeSource: 'marrow_6_5' },     // cloud-only, no times at all
    { personal: { doctorName: 'Dr. A' } }, // local-only
    {},
    {}
  );
  assert.equal(merged.activeSource, 'marrow_6_5');
  assert.deepEqual(toPlain(merged.personal), { doctorName: 'Dr. A' });
});

// --- Data-preserving guards (the reported sync-wipe bugs) ---

test('mergeCloudPerField: an empty cloud copy NEVER wipes richer local data, even with a newer clock', () => {
  const cloudTimes = { plans: 9999, goals: 9999, personal: 9999, activeSource: 9999, streakData: 9999 };
  const local = {
    plans: [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 3, videosPerWeek: 21, videosPerMonth: 90, targetDate: '2027-06-30' }],
    goals: { targetSubject: 'Anatomy', videosPerDay: 3, targetDate: '2027-06-30' },
    personal: { doctorName: 'Dr. Faiz' },
    activeSource: 'marrow_6_5',
    streakData: { lastStudyDate: '2026-08-10', currentStreak: 14 }
  };
  const merged = sync.mergeCloudPerField(
    { plans: [], goals: {}, personal: { doctorName: 'Dr. Aspirant' }, activeSource: 'marrow_8', streakData: {} },
    local,
    cloudTimes,
    {}
  );
  assert.deepEqual(toPlain(merged.plans), toPlain(local.plans), 'unset plans must not wipe real plans');
  assert.deepEqual(toPlain(merged.goals), toPlain(local.goals), 'unconfigured goals must not wipe real goals');
  assert.equal(merged.personal.doctorName, 'Dr. Faiz', 'default profile must not wipe a real name');
  assert.equal(merged.activeSource, 'marrow_6_5', 'default source must not wipe a chosen source');
  assert.deepEqual(toPlain(merged.streakData), toPlain(local.streakData), 'empty streak must not wipe a real streak');
});

test('mergeCloudPerField: a real cloud copy fills an empty local device (first sync brings data in)', () => {
  const merged = sync.mergeCloudPerField(
    { plans: [{ id: 'plan_a', targetSubject: 'Anatomy', videosPerDay: 3 }], personal: { doctorName: 'Dr. Cloud' }, activeSource: 'marrow_6_5' },
    { plans: [{
      id: 'plan_a', label: 'Plan A', targetSubject: '', videosPerDay: null,
      videosPerWeek: null, videosPerMonth: null, targetDate: ''
    }], personal: { doctorName: 'Dr. Aspirant' }, activeSource: 'marrow_8' },
    { plans: 2000, personal: 2000, activeSource: 2000 },
    {}
  );
  assert.equal(merged.plans[0].videosPerDay, 3, 'real cloud plans arrive on the fresh device');
  assert.equal(merged.personal.doctorName, 'Dr. Cloud', 'real cloud profile arrives');
  assert.equal(merged.activeSource, 'marrow_6_5', 'real cloud source arrives');
});

test('mergeCloudPerField: a fresh device adopts the EDITION WITH DATA, not the cloud’s empty activeSource choice', () => {
  // Cloud activeSource points at 6.5 (a data-less device switched there and
  // was the last writer), but the user’s real data lives in Edition 8.
  const merged = sync.mergeCloudPerField(
    {
      activeSource: 'marrow_6_5',
      plans_marrow_8: [{ id: 'plan_a', targetSubject: 'Anatomy', videosPerDay: 3 }]
    },
    {
      activeSource: 'marrow_8',
      plans_marrow_8: [{ id: 'plan_a', label: 'Plan A', targetSubject: '', videosPerDay: null, videosPerWeek: null, videosPerMonth: null, targetDate: '' }],
      plans_marrow_6_5: [{ id: 'plan_a', label: 'Plan A', targetSubject: '', videosPerDay: null, videosPerWeek: null, videosPerMonth: null, targetDate: '' }]
    },
    { activeSource: 2000, plans_marrow_8: 2000 },
    {}
  );
  assert.equal(merged.activeSource, 'marrow_8', 'fresh device opens the edition that has the data, not the empty one the cloud points at');
});

test('mergeCloudPerField: fresh device redirects even when cloud and local share the default value but data sits elsewhere', () => {
  // Cloud activeSource is the DEFAULT marrow_8 (no data there), while the
  // user’s only data is in 6.5 — a device switched there, back, and never
  // configured Edition 8.
  const merged = sync.mergeCloudPerField(
    {
      activeSource: 'marrow_8',
      plans_marrow_6_5: [{ id: 'plan_a', targetSubject: 'Pathology', videosPerDay: 5 }]
    },
    {
      activeSource: 'marrow_8',
      plans_marrow_8: [{ id: 'plan_a', label: 'Plan A', targetSubject: '', videosPerDay: null, videosPerWeek: null, videosPerMonth: null, targetDate: '' }],
      plans_marrow_6_5: [{ id: 'plan_a', label: 'Plan A', targetSubject: '', videosPerDay: null, videosPerWeek: null, videosPerMonth: null, targetDate: '' }]
    },
    { activeSource: 2000, plans_marrow_6_5: 2000 },
    {}
  );
  assert.equal(merged.activeSource, 'marrow_6_5', 'data edition wins over an empty default-valued cloud choice');
});

test('mergeCloudPerField: fresh device still adopts the cloud choice when THAT edition has data', () => {
  const merged = sync.mergeCloudPerField(
    {
      activeSource: 'marrow_6_5',
      plans_marrow_6_5: [{ id: 'plan_a', targetSubject: 'Pathology', videosPerDay: 5 }],
      plans_marrow_8: [{ id: 'plan_a', targetSubject: 'Anatomy', videosPerDay: 3 }]
    },
    {
      activeSource: 'marrow_8',
      plans_marrow_8: [{ id: 'plan_a', label: 'Plan A', targetSubject: '', videosPerDay: null, videosPerWeek: null, videosPerMonth: null, targetDate: '' }],
      plans_marrow_6_5: [{ id: 'plan_a', label: 'Plan A', targetSubject: '', videosPerDay: null, videosPerWeek: null, videosPerMonth: null, targetDate: '' }]
    },
    { activeSource: 2000 },
    {}
  );
  assert.equal(merged.activeSource, 'marrow_6_5', 'a data-backed deliberate cloud choice is still adopted');
});

test('mergeCloudPerField: a cloud default profile never replaces a real local doctor name', () => {
  // The fresh device's own default ('Dr. Aspirant') is EMPTY — but so is the
  // cloud's. A REAL local name must win over an empty cloud profile even with
  // a newer cloud clock.
  const merged = sync.mergeCloudPerField(
    { personal: { doctorName: 'Dr. Aspirant' } },
    { personal: { doctorName: 'Dr. Faiz' } },
    { personal: 9999 },
    {}
  );
  assert.equal(merged.personal.doctorName, 'Dr. Faiz', 'empty cloud profile must not wipe a real local name');
});

test('mergeCloudPerField: a future-stamped cloud clock (clock skew) cannot win over local data', () => {
  const future = Date.now() + 3600 * 1000; // 1 hour ahead — implausible
  const merged = sync.mergeCloudPerField(
    { goals: { videosPerDay: 99 } },
    { goals: { videosPerDay: 8, targetSubject: 'Anatomy' } },
    { goals: future },
    { goals: Date.now() }
  );
  assert.equal(merged.goals.videosPerDay, 8, 'skewed clock must not wipe local data');
});

test('mergeCloudPerField: newer REAL cloud edit still wins over older local edit (clock arbitration intact)', () => {
  const merged = sync.mergeCloudPerField(
    { plans: [{ id: 'plan_a', targetSubject: 'Medicine', videosPerDay: 10 }] },
    { plans: [{ id: 'plan_a', targetSubject: 'Anatomy', videosPerDay: 8 }] },
    { plans: 2000 },
    { plans: 1000 }
  );
  assert.equal(merged.plans[0].videosPerDay, 10, 'genuinely newer cloud edit wins');
});

// --- Per-plan merge: concurrent Plan A edit + Plan B addition must converge ---

test('mergePlansByClock: newer side wins shared ids, BOTH plans survive (no plan lost)', () => {
  // Cloud (newer): Plan A = 8 and Plan B = 5. Local (older): Plan A = 10 only.
  const merged = sync.mergePlansByClock(
    [{ id: 'plan_a', videosPerDay: 8 }, { id: 'plan_b', videosPerDay: 5 }],
    [{ id: 'plan_a', videosPerDay: 10 }],
    true
  );
  const byId = {};
  merged.forEach(p => { byId[p.id] = p; });
  assert.equal(merged.length, 2, 'both plans survive');
  assert.equal(byId.plan_a.videosPerDay, 8, 'newer (cloud) wins the shared plan id');
  assert.equal(byId.plan_b.videosPerDay, 5, 'cloud-only plan is appended');
});

test('mergePlansByClock: older side wins shared ids when ITS clock is newer', () => {
  const merged = sync.mergePlansByClock(
    [{ id: 'plan_a', videosPerDay: 8 }, { id: 'plan_b', videosPerDay: 5 }],
    [{ id: 'plan_a', videosPerDay: 10 }, { id: 'plan_c', videosPerDay: 3 }],
    false // local field clock is newer
  );
  const byId = {};
  merged.forEach(p => { byId[p.id] = p; });
  assert.equal(merged.length, 3, 'all three plans survive');
  assert.equal(byId.plan_a.videosPerDay, 10, 'local (newer) wins the shared id');
  assert.equal(byId.plan_b.videosPerDay, 5, 'cloud-only plan is appended');
  assert.equal(byId.plan_c.videosPerDay, 3, 'local-only plan stays');
});

test('mergeCloudPerField: concurrent plans — local Plan A edit + cloud Plan B addition both survive', () => {
  const merged = sync.mergeCloudPerField(
    { plans: [{ id: 'plan_a', videosPerDay: 8 }, { id: 'plan_b', videosPerDay: 5 }] },
    { plans: [{ id: 'plan_a', videosPerDay: 10 }] },
    { plans: 1000 },  // cloud is OLDER — local wins the shared id
    { plans: 2000 }
  );
  const byId = {};
  merged.plans.forEach(p => { byId[p.id] = p; });
  assert.equal(merged.plans.length, 2);
  assert.equal(byId.plan_a.videosPerDay, 10, 'local (newer) edit survives');
  assert.equal(byId.plan_b.videosPerDay, 5, 'cloud-only plan is not lost');
});

// --- Sync diagnostics: per-field arbitration report (Profile panel) ---

test('computeFieldArbitration: newer side wins, no-clocks reported as none', () => {
  const arb = sync.computeFieldArbitration(
    { plans: 2000, goals: 1000, streakData: 0 },
    { plans: 1000, goals: 2000, activeSource: 3000 }
  );
  assert.equal(arb.plans.verdict, 'LOCAL');
  assert.equal(arb.goals.verdict, 'CLOUD');
  assert.equal(arb.activeSource.verdict, 'CLOUD');
  assert.equal(arb.streakData.verdict, 'none');
});

test('computeFieldArbitration: completedVideos is always UNION, equal clocks are a TIE', () => {
  assert.equal(sync.computeFieldArbitration({ completedVideos: 5000 }, { completedVideos: 1000 }).completedVideos.verdict, 'UNION');
  assert.equal(sync.computeFieldArbitration({ themeStyle: 1234 }, { themeStyle: 1234 }).themeStyle.verdict, 'TIE');
});

test('buildSyncDiagnostics: rows carry clocks, verdicts and readable value summaries', () => {
  const report = sync.buildSyncDiagnostics(
    {
      fieldSyncTimes: { plans: 2000, goals: 1000 },
      plans: [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy' }],
      goals: { targetSubject: 'Anatomy', videosPerDay: 8 },
      personal: { doctorName: 'Dr. Faiz' },
      completedVideos: { 'marrow_8::v1': true, 'marrow_8::v2': true }
    },
    {
      fieldSyncTimes: { plans: 1000, goals: 2000, activeSource: 5000 },
      plans: [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy' }],
      goals: { targetSubject: 'Anatomy', videosPerDay: 3 },
      activeSource: 'marrow_6_5',
      completedVideos: { 'marrow_8::v1': true }
    },
    { lastSync: { at: 123, status: 'success', message: '1 field pushed', pushed: ['plans'], pulled: [] } }
  );
  const rows = {};
  report.rows.forEach(r => { rows[r.field] = r; });
  assert.equal(rows.plans.verdict, 'LOCAL', 'newer local clock → LOCAL');
  assert.equal(rows.goals.verdict, 'CLOUD', 'newer cloud clock → CLOUD');
  assert.equal(rows.activeSource.verdict, 'CLOUD');
  assert.equal(rows.completedVideos.verdict, 'UNION');
  assert.equal(rows.plans.localValue, 'Plan A');
  assert.equal(rows.goals.localValue, 'Anatomy · 8/day');
  assert.equal(rows.personal.localValue, 'Dr. Faiz');
  assert.equal(rows.completedVideos.localValue, '2 completed');
  assert.equal(rows.plans.localClock, 2000);
  assert.equal(rows.plans.cloudClock, 1000);
  assert.equal(report.cloudPresent, true);
  assert.equal(report.lastSync.pushed[0], 'plans');
});

test('buildSyncDiagnostics: no clocks anywhere → empty row set (nothing arbitrated yet)', () => {
  const report = sync.buildSyncDiagnostics(
    { plans: [{ id: 'plan_a' }], fieldSyncTimes: {} },
    null,
    null
  );
  assert.equal(report.rows.length, 0);
  assert.equal(report.cloudPresent, false);
  assert.equal(report.lastSync, null);
});

test('buildSyncDiagnostics: cloud-only fields appear even without local clocks (first sync)', () => {
  const report = sync.buildSyncDiagnostics(
    { fieldSyncTimes: {} },
    { fieldSyncTimes: { activeSource: 5000 }, activeSource: 'marrow_6_5' },
    null
  );
  const rows = {};
  report.rows.forEach(r => { rows[r.field] = r; });
  assert.equal(rows.activeSource.verdict, 'CLOUD');
  assert.equal(rows.activeSource.cloudValue, 'marrow_6_5');
});
