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

test('compressCompletedVideos strips the redundant source prefix from every key', () => {
  const out = sync.compressCompletedVideos({
    'marrow_8::anatomy__v1': true,
    'marrow_6_5::anatomy__v2': true,
    'anatomy__v3': true // already unprefixed — untouched
  });
  assert.deepEqual(toPlain(out), { 'anatomy__v1': true, 'anatomy__v2': true, 'anatomy__v3': true });
});

test('rehydrateCompletedVideos re-prefixes with the current source, legacy keys pass through', () => {
  const out = sync.rehydrateCompletedVideos({ 'anatomy__v1': true, 'marrow_6_5::anatomy__v2': true }, 'marrow_8');
  assert.deepEqual(toPlain(out), { 'marrow_8::anatomy__v1': true, 'marrow_6_5::anatomy__v2': true });
});

test('compress → rehydrate round-trip is lossless for same-source videos', () => {
  const local = { 'marrow_8::anatomy__v1': true, 'marrow_8::anatomy__v2': false };
  const cloud = sync.compressCompletedVideos(local);
  assert.deepEqual(toPlain(sync.rehydrateCompletedVideos(cloud, 'marrow_8')), local);
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

test('sanitizeCloudState drops dead fields and strips transient keys from plans', () => {
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
      queueBatchVideoIds: ['a'], queueCompletedInBatch: 2,
      extraBatchesCompletedToday: 1, lastBatchDate: '2026-05-11'
    }]
  });
  assert.equal(out.speed, undefined);
  assert.equal(out.subjectUrgency, undefined);
  assert.equal(out.dailyBatch, undefined);
  assert.equal(out.queueCompletedInBatch, undefined);
  assert.equal(out.queueBatchVideoIds, undefined);
  assert.equal(out.lastSyncedAt, undefined);
  assert.deepEqual(toPlain(out.plans), [{
    id: 'plan_a', targetSubject: 'Anatomy', videosPerDay: 8
  }]);
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
