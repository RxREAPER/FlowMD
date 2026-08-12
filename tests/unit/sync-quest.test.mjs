// Daily-quest behavior across devices — runs the REAL queue engine
// (js/core/metrics.js + js/core/source-data.js) inside the two-device sync
// harness. Answers: when device A ticks 2 of its 4 daily-quest videos, what
// does device B show after syncing — the same 4 with 2 ticked, or the next 4
// uncompleted (3-6)?
//
// The queue batch (plan.queueBatchVideoIds) is a SYNCED plan key: it is part
// of PLAN_CLOUD_KEYS, survives sanitize/strip/merge, and travels with the
// plan in the cloud doc. So every device of a user shows the EXACT same quest
// videos — a device that already materialized today's batch keeps it, and a
// FRESH device that never opened the quest pulls the same batch instead of
// computing the next N uncompleted videos. Only the per-day transient
// counters (queueCompletedInBatch, extraBatchesCompletedToday, lastBatchDate)
// stay device-local.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudStore, createDevice, toPlain } from './sync-harness.mjs';

// Tiny deterministic dataset: one subject, one chapter, N videos. Video ids
// are plain here — source-data.js qualifies them with the edition prefix
// (marrow_8::anatomy__v1) exactly like the real data files.
const anatomyDataset = (count) => [{
  id: 'anatomy',
  subject: 'Anatomy',
  chapters: [{
    name: 'Chapter 1',
    videos: Array.from({ length: count }, (_, i) => ({
      id: 'anatomy__v' + (i + 1),
      title: 'Anatomy Video ' + (i + 1),
      durationMins: 10,
      durationSecs: 0,
      videoNumber: i + 1
    }))
  }]
}];

// Qualified video id for Edition 8.
const v = (n) => 'marrow_8::anatomy__v' + n;

// A configured plan: Anatomy, 4 videos/day (fresh plan has no queue batch —
// the engine materializes it on first render).
const makePlan = () => ({
  id: 'plan_a', label: 'Plan A', accentColor: '#6c3baa',
  targetSubject: 'Anatomy', targetDate: '2999-01-01',
  videosPerDay: 4, targetUnits: []
});

// Shared setup: two devices on Edition 8 with the same 4/day Anatomy plan,
// both of which have opened the daily quest before any studying.
function setupQuest(uid) {
  const cloud = createCloudStore(uid);
  const dataset = { marrow_8: anatomyDataset(8), marrow_6_5: anatomyDataset(6) };
  const A = createDevice('A', cloud, uid, { dataset });
  const B = createDevice('B', cloud, uid, { dataset });
  A.edit((s) => { s.plans = [makePlan()]; });
  B.edit((s) => { s.plans = [makePlan()]; });
  return { cloud, A, B, dataset };
}

test('same-edition quest: A ticks 2 of 4 — device B shows the same 4 with 2 ticked, 2 unticked', async () => {
  const { cloud, A, B } = setupQuest('quest-1');

  // Both devices open the app → each generates its OWN batch of the next 4
  // uncompleted videos. With an empty completion map both pick videos 1-4.
  // (toPlain: renderQuest arrays are built inside the vm sandbox — JSON-
  // round-trip them so deepStrictEqual compares same-realm values.)
  assert.deepEqual(toPlain(A.renderQuest()).batch, [v(1), v(2), v(3), v(4)], 'A seeds its quest with videos 1-4');
  assert.deepEqual(toPlain(B.renderQuest()).batch, [v(1), v(2), v(3), v(4)], 'B seeds its quest with videos 1-4 (same deterministic batch)');

  // A ticks the first 2 videos of its quest (the app writes completedVideos +
  // saveState — the sync layer sees plans + completedVideos).
  A.tick(v(1));
  A.tick(v(2));
  const qA = toPlain(A.renderQuest());
  assert.deepEqual(qA.batch, [v(1), v(2), v(3), v(4)], 'A’s quest batch is unchanged after ticking');
  assert.deepEqual(qA.checked, [true, true, false, false], 'A shows 2 ticked, 2 unticked');

  // A syncs, B syncs (B pulls A’s completions AND A’s plan carrying the batch).
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();

  // The ticks DO reflect on B — completedVideos is a shared union.
  assert.equal(B.state.completedVideos[v(1)], true, 'A’s tick #1 reflects on B');
  assert.equal(B.state.completedVideos[v(2)], true, 'A’s tick #2 reflects on B');

  // The queue batch CROSSED the wire with the plan: the cloud doc carries it.
  const doc = cloud.getDoc();
  assert.deepEqual(toPlain(doc.plans_marrow_8[0].queueBatchVideoIds),
    [v(1), v(2), v(3), v(4)], 'cloud plan carries the quest batch (synced key)');
  assert.equal(doc.completedVideos[v(1)], true, 'cloud has A’s tick #1');
  assert.equal(doc.completedVideos[v(2)], true, 'cloud has A’s tick #2');

  // B’s daily quest: SAME 4 videos, 2 ticked, 2 unticked — identical to A.
  const qB = toPlain(B.renderQuest());
  assert.deepEqual(qB.batch, [v(1), v(2), v(3), v(4)], 'B shows the same 4-video quest as A, not the next 4');
  assert.deepEqual(qB.checked, [true, true, false, false], 'B shows 2 ticked, 2 unticked — identical to A');

  // Once settled, repeated syncs are pure reads: the synced batch makes the
  // local plan identical to the cloud copy (no more re-pushing stripped
  // plans) and the completedVideos union push is diff-based (no key local
  // owns differs from the cloud copy), so nothing is ever re-written.
  cloud.resetWrites();
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.flush();
  await B.flush();
  assert.equal(cloud.writes.count, 0, `expected ZERO writes after settling, got ${cloud.writes.count}`);
  const qA2 = toPlain(A.renderQuest());
  assert.deepEqual(qA2.checked, [true, true, false, false], 'A’s quest stable after the settle round');
});

test('a FRESH device that never opened the quest shows the EXACT same batch (1-4) with A’s 2 ticks', async () => {
  const { cloud, A, dataset } = setupQuest('quest-2');

  // A opens the quest, ticks 2 videos and syncs (cloud now has the plan WITH
  // its batch [1-4] plus the completions).
  A.renderQuest();
  A.tick(v(1));
  A.tick(v(2));
  await A.manualSync();
  await A.flush();

  // C joins later: pulls everything, THEN renders its quest for the FIRST
  // time today. It has no local batch, but the synced plan already carries
  // A’s batch — so C shows the same 4 videos with 2 ticked, NOT the next 4
  // uncompleted (3-6).
  const C = createDevice('C', cloud, 'quest-2', { dataset });
  await C.manualSync();
  await C.flush();

  assert.equal(C.state.completedVideos[v(1)], true, 'C pulls A’s tick #1');
  assert.equal(C.state.completedVideos[v(2)], true, 'C pulls A’s tick #2');

  const qC = toPlain(C.renderQuest());
  assert.deepEqual(qC.batch, [v(1), v(2), v(3), v(4)], 'fresh device shows A’s batch, not the next 4 uncompleted');
  assert.deepEqual(qC.checked, [true, true, false, false], 'fresh device shows the same 2 ticked / 2 unticked');

  // And a tick on the FRESH device reflects back identically: C ticks #3,
  // A syncs → A shows the same 4 with 3 ticked.
  C.tick(v(3));
  await C.manualSync();
  await C.flush();
  await A.manualSync();
  await A.flush();

  assert.equal(A.state.completedVideos[v(3)], true, 'C’s tick #3 reflects on A');
  const qA = toPlain(A.renderQuest());
  assert.deepEqual(qA.batch, [v(1), v(2), v(3), v(4)], 'A still shows the same 4-video quest');
  assert.deepEqual(qA.checked, [true, true, true, false], 'A shows 3 ticked — identical to C’s quest');
  const qC2 = toPlain(C.renderQuest());
  assert.deepEqual(qC2.checked, [true, true, true, false], 'C and A agree on the quest state');
});

test('same-edition quest, second round of syncs: both devices converge on the same quest without losing ticks', async () => {
  const { cloud, A, B } = setupQuest('quest-3');

  // A ticks and syncs; B pulls (B keeps the [1-4] batch, 2 ticked 2 unticked).
  A.renderQuest();
  B.renderQuest();
  A.tick(v(1));
  A.tick(v(2));
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();

  // B now completes the rest of its batch and syncs back — A must see the new
  // ticks while keeping the shared batch.
  B.tick(v(3));
  B.tick(v(4));
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();

  // A reflects B’s ticks...
  assert.equal(A.state.completedVideos[v(3)], true, 'B’s tick #3 reflects on A');
  assert.equal(A.state.completedVideos[v(4)], true, 'B’s tick #4 reflects on A');
  // ...and its quest shows the full batch completed (all 4 ticked).
  const qA = toPlain(A.renderQuest());
  assert.deepEqual(qA.batch, [v(1), v(2), v(3), v(4)], 'A still shows the same 4-video quest');
  assert.deepEqual(qA.checked, [true, true, true, true], 'A shows all 4 ticked after B finished the batch');

  // The cloud doc converges on the shared batch too.
  const doc = cloud.getDoc();
  assert.deepEqual(toPlain(doc.plans_marrow_8[0].queueBatchVideoIds),
    [v(1), v(2), v(3), v(4)], 'cloud plan carries the converged quest batch');
});

test('extra-video advance is shared: both devices show the same 1-at-a-time batch and settle to ZERO writes', async () => {
  const { cloud, A, B } = setupQuest('quest-4');

  // Both devices open the app and their initial batch pushes settle (cloud
  // holds the shared [1-4] batch). Then both complete the 4-video batch and A
  // taps "Load Next Video" — the dashboard handler advances the plan into
  // extra mode (1 video at a time).
  A.renderQuest();
  B.renderQuest();
  await A.flush();        // initial batch auto-push lands
  await B.flush();
  [v(1), v(2), v(3), v(4)].forEach((vid) => { A.tick(vid); });
  A.edit((s) => {
    const p = s.plans[0];
    p.extraBatchesCompletedToday = 1;
    p.queueBatchVideoIds = [];
    p.queueCompletedInBatch = 0;
  });
  // A re-renders: extra mode materializes exactly 1 uncompleted video (v5).
  const qA = toPlain(A.renderQuest());
  assert.deepEqual(qA.batch, [v(5)], 'A’s extra-mode quest is the next single video');

  await A.manualSync();
  await A.flush();
  await B.manualSync();   // B pulls the plan WITH the 1-video batch
  await B.flush();

  // B renders its quest for the first time after the pull. The synced batch
  // [v5] is authoritative: B must NOT regrow it to 4 videos (its local
  // extra-mode counter is 0, so a naive size-mismatch regen would flip the
  // batch back and forth with A — a write ping-pong). Both devices show the
  // EXACT same quest.
  const qB = toPlain(B.renderQuest());
  assert.deepEqual(qB.batch, [v(5)], 'B keeps A’s 1-video extra batch, not a fresh 4-video batch');
  assert.deepEqual(toPlain(A.renderQuest()).batch, [v(5)], 'A unchanged');
  assert.deepEqual(qB.checked, [false], 'B shows the extra video unticked — identical to A (nobody has ticked v5 yet)');

  // Ticking the extra video on either device reflects identically: B ticks v5,
  // A syncs → both show the same quest, now ticked.
  B.tick(v(5));
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();
  assert.deepEqual(toPlain(A.renderQuest()).batch, [v(5)], 'A still shows the same extra batch');
  assert.deepEqual(toPlain(A.renderQuest()).checked, [true], 'B’s extra-video tick reflects on A');
  assert.deepEqual(toPlain(B.renderQuest()).checked, [true], 'B agrees');

  // Alternate render+sync rounds on both devices — a batch-size ping-pong
  // would show up as writes. With the batch shared, settled devices write
  // nothing.
  cloud.resetWrites();
  for (let i = 0; i < 3; i++) {
    A.renderQuest();
    B.renderQuest();
    await A.manualSync();
    await A.flush();
    await B.manualSync();
    await B.flush();
  }
  assert.equal(cloud.writes.count, 0, `expected ZERO writes after the extra-batch settle, got ${cloud.writes.count}`);
  assert.deepEqual(toPlain(A.renderQuest()).batch, [v(5)], 'A still shows the same extra batch');
  assert.deepEqual(toPlain(B.renderQuest()).batch, [v(5)], 'B still shows the same extra batch');
  assert.deepEqual(toPlain(cloud.getDoc().plans_marrow_8[0].queueBatchVideoIds),
    [v(5)], 'cloud plan still carries the 1-video batch');
});
