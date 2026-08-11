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

test('shouldApplyCloud: cloud newer than local applies, clock skew within 5s window tolerated', () => {
  assert.equal(sync.shouldApplyCloud(1000, 500, false), true);
  // cloud looks 4.5s older than local — inside the 5s skew window → apply
  assert.equal(sync.shouldApplyCloud(1000, 5500, false), true);
  // cloud strictly older beyond the skew window → genuinely stale → skip
  assert.equal(sync.shouldApplyCloud(1000, 15000, false), false);
});

test('shouldApplyCloud: local dirty changes always apply + trigger write-back', () => {
  assert.equal(sync.shouldApplyCloud(1000, 15000, true), true);
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

test('write-loop guard: identical cloud snapshot never re-triggers a write-back', () => {
  // Equal timestamps apply (harmless merge)…
  assert.equal(sync.shouldApplyCloud(5000, 5000, false), true);
  // …but without local dirty changes and cloud strictly older, we do NOT push
  assert.equal(sync.shouldApplyCloud(1000, 20000, false), false);
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
