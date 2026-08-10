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
