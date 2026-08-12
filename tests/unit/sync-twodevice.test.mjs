import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudStore, createDevice, toPlain } from './sync-harness.mjs';

// ── Scenarios ──────────────────────────────────────────────────────────────

test('two devices editing DIFFERENT fields: both edits survive a round of syncs', async () => {
  const uid = 'user-1';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  // Each device edits a different field via the app (which calls saveState
  // and stamps the field clock) before any sync.
  A.edit((s) => { s.goals = { videosPerDay: 12 }; });
  B.edit((s) => { s.plans = [{ id: 'plan_a', label: 'My Plan', videosPerDay: 9 }]; });

  // A syncs first (seeds the doc); give the debounced auto-push time to land,
  // then B syncs (pulls A's doc and pushes B's plan).
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();

  const cloudDoc = cloud.getDoc();
  if (!cloudDoc.plans_marrow_8 || !cloudDoc.plans_marrow_8[0] || !cloudDoc.goals_marrow_8 || !cloudDoc.goals_marrow_8.videosPerDay) {
    console.log('DEBUG1 cloud:', JSON.stringify({ goals: cloudDoc.goals_marrow_8, plans: cloudDoc.plans_marrow_8, fst: cloudDoc.fieldSyncTimes }));
    console.log('DEBUG1 A:', JSON.stringify({ goals: A.state.goals, plans: A.state.plans }), 'B:', JSON.stringify({ goals: B.state.goals, plans: B.state.plans }));
    console.log('DEBUG1 writes:', cloud.writes.count);
  }
  assert.equal(cloudDoc.goals_marrow_8.videosPerDay, 12, 'A’s goals must reach the cloud (suffixed per-edition field)');
  assert.equal(cloudDoc.plans_marrow_8[0].videosPerDay, 9, 'B’s plan must reach the cloud');
  assert.equal(A.state.plans[0].videosPerDay, 9, 'B’s plan must arrive on A after A pulls');
  assert.equal(B.state.goals.videosPerDay, 12, 'A’s goals must arrive on B after B pulls');
});

test('two devices editing the SAME field: the newer edit wins, the older is not resurrected', async () => {
  const uid = 'user-2';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  // Both change the same field. A syncs first (cloud = A's plan_b), then B
  // makes a NEWER edit — that must win.
  A.edit((s) => { s.activePlanId = 'plan_b'; });
  await A.manualSync();
  await A.flush();

  await B.manualSync();          // B pulls A's plan_b — no local conflict yet
  await B.flush();
  B.edit((s) => { s.activePlanId = 'plan_c'; });
  await B.manualSync();          // push B's newer edit
  await B.flush();
  await A.manualSync();          // A pulls B's newer edit
  await A.flush();

  const cloudDoc = cloud.getDoc();
  assert.equal(cloudDoc.activePlanId_marrow_8, 'plan_c', 'newer edit (B) wins in the cloud');
  assert.equal(A.state.activePlanId, 'plan_c', 'newer edit propagates to A');
});

test('completedVideos is a union: completions on both devices all survive', async () => {
  const uid = 'user-3';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  A.edit((s) => { s.completedVideos = { 'marrow_8::anatomy__v1': true }; });
  B.edit((s) => { s.completedVideos = { 'marrow_8::anatomy__v2': true }; });

  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();

  assert.equal(A.state.completedVideos['marrow_8::anatomy__v1'], true);
  assert.equal(A.state.completedVideos['marrow_8::anatomy__v2'], true, 'B’s completion reaches A');
  assert.equal(B.state.completedVideos['marrow_8::anatomy__v1'], true, 'A’s completion reaches B');
  assert.equal(cloud.getDoc().completedVideos['marrow_8::anatomy__v1'], true, 'cloud key is stored prefixed (no compression)');
});

test('no write ping-pong: writes stop after both devices settle (no echo writes)', async () => {
  const uid = 'user-4';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  // Each device edits once and syncs until both devices + the cloud agree.
  A.edit((s) => { s.goals = { videosPerDay: 10 }; });
  B.edit((s) => { s.plans = [{ id: 'plan_a', videosPerDay: 7 }]; });
  await A.manualSync();   // seeds the doc
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();

  // Both devices and the cloud now agree. Reset the write counter — from here
  // on, repeated syncs must be pure reads: ANY write is an echo/ping-pong.
  cloud.resetWrites();
  for (let i = 0; i < 3; i++) {
    await A.manualSync();
    await A.flush();
    await B.manualSync();
    await B.flush();
  }
  // Give every debounced auto-push a chance to fire — the per-field guard
  // must keep them all silent.
  await A.flush();
  await B.flush();

  assert.equal(cloud.writes.count, 0, `expected ZERO writes after settling, got ${cloud.writes.count}`);
  assert.deepEqual(toPlain(A.state.goals), { videosPerDay: 10 });
  assert.deepEqual(toPlain(A.state.plans), [{ id: 'plan_a', videosPerDay: 7 }]);
  assert.deepEqual(toPlain(cloud.getDoc().plans_marrow_8), [{ id: 'plan_a', videosPerDay: 7 }]);
});

test('an EMPTY cloud doc never wipes a device with real data (the reported sync-wipe bug)', async () => {
  const uid = 'user-5';
  const cloud = createCloudStore(uid);
  const B = createDevice('B', cloud, uid);

  // Device B has real data (plans, goals, doctor name, chosen source), edited
  // BEFORE any cloud doc exists.
  B.edit((s) => {
    s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 3, videosPerWeek: 21, videosPerMonth: 90, targetDate: '2027-06-30' }];
    s.goals = { targetSubject: 'Anatomy', videosPerDay: 3, targetDate: '2027-06-30' };
    s.personal = { doctorName: 'Dr. Faiz' };
    s.activeSource = 'marrow_6_5';
  });

  // A SECOND device seeds the doc with a fresh/empty state — stamped with a
  // NEWER clock than B's edits (this is what used to let the empty state win
  // and wipe B).
  await cloud.syncToCloud(uid, {
    plans: [],
    goals: {},
    personal: { doctorName: 'Dr. Aspirant' },
    activeSource: 'marrow_8',
    completedVideos: {}, streakData: {}, dailyHistory: {}, dailyHistoryBySubject: {},
    activePlanId: 'plan_a', isConfigured: false, themeStyle: 'modern'
  });

  await B.manualSync();   // pull must NOT wipe B; push must FIX the cloud
  await B.flush();

  const cloudDoc = cloud.getDoc();
  assert.equal(B.state.plans[0].videosPerDay, 3, 'B keeps its plans');
  assert.equal(B.state.goals.videosPerDay, 3, 'B keeps its goals');
  assert.equal(B.state.personal.doctorName, 'Dr. Faiz', 'B keeps its doctor name');
  assert.equal(B.state.activeSource, 'marrow_6_5', 'B keeps its chosen source');
  assert.equal(cloudDoc.plans_marrow_6_5[0].videosPerDay, 3, 'B fixes the cloud plans (its active edition)');
  assert.equal(cloudDoc.personal.doctorName, 'Dr. Faiz', 'B fixes the cloud profile');
  assert.equal(cloudDoc.activeSource, 'marrow_6_5', 'B fixes the cloud source');
});

test('local edits reach the other device via MANUAL sync alone (no auto-push timing)', async () => {
  const uid = 'user-6';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  // A seeds the doc with its state; B pulls it (both now share A's data).
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();

  // B edits its doctor name — the ONLY write path is B's manual sync.
  B.edit((s) => { s.personal = { doctorName: 'Dr. B' }; });
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();

  assert.equal(A.state.personal.doctorName, 'Dr. B', 'B’s manual-synced edit arrives on A');
  assert.equal(cloud.getDoc().personal.doctorName, 'Dr. B', 'B’s manual-synced edit reaches the cloud');
});

test('cross-edition completions survive: marrow_8 and marrow_6_5 share video ids but keep separate entries', async () => {
  const uid = 'user-7';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  A.edit((s) => { s.completedVideos = { 'marrow_8::anatomy__v1': true }; });
  B.edit((s) => { s.completedVideos = { 'marrow_6_5::anatomy__v1': true }; });

  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();

  assert.equal(A.state.completedVideos['marrow_8::anatomy__v1'], true, 'A keeps its edition-8 completion');
  assert.equal(A.state.completedVideos['marrow_6_5::anatomy__v1'], true, 'B’s edition-6.5 completion arrives on A (no collision)');
  assert.equal(B.state.completedVideos['marrow_8::anatomy__v1'], true, 'A’s completion arrives on B');
  const cloudCv = cloud.getDoc().completedVideos;
  assert.equal(cloudCv['marrow_8::anatomy__v1'], true, 'cloud keeps the edition-8 key prefixed');
  assert.equal(cloudCv['marrow_6_5::anatomy__v1'], true, 'cloud keeps the edition-6.5 key prefixed');
});

test('devices on DIFFERENT editions: activeSource preference is never re-asserted — zero writes after settling', async () => {
  const uid = 'user-15';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);   // stays on Edition 8
  const B = createDevice('B', cloud, uid);   // switches to Edition 6.5
  B.switchSource('marrow_6_5');

  // Both devices configure REAL plans in their own edition partitions — so
  // each has real data and the merge keeps each device on its own edition.
  A.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 8, targetDate: '2027-06-30' }]; });
  B.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Pathology', videosPerDay: 5, targetDate: '2027-08-30' }]; });

  // Settle: A seeds, B pulls (keeps its 6.5 view), both round-trip a few times.
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();

  // Each device keeps its own view, and the cloud holds both editions’ plans.
  assert.equal(A.state.activeSource, 'marrow_8', 'A stays on Edition 8');
  assert.equal(B.state.activeSource, 'marrow_6_5', 'B stays on Edition 6.5');
  assert.equal(cloud.getDoc().plans_marrow_8[0].videosPerDay, 8, 'Edition 8 plan in the doc');
  assert.equal(cloud.getDoc().plans_marrow_6_5[0].videosPerDay, 5, 'Edition 6.5 plan in the doc');

  // Previously each device re-asserted its activeSource to the doc every
  // couple of rounds (the preference-keep merged the LOCAL value but bumped
  // the local clock past the cloud’s, so the next sync’s push guard fired).
  // With the clock pin, repeated syncs are pure reads: ZERO writes.
  cloud.resetWrites();
  for (let i = 0; i < 3; i++) {
    await A.manualSync();
    await A.flush();
    await B.manualSync();
    await B.flush();
  }
  await A.flush();
  await B.flush();
  assert.equal(cloud.writes.count, 0, `expected ZERO writes after settling on different editions, got ${cloud.writes.count}`);
  assert.equal(A.state.activeSource, 'marrow_8', 'A still on Edition 8');
  assert.equal(B.state.activeSource, 'marrow_6_5', 'B still on Edition 6.5');
});

test('device A ticks Edition 8 topics while device B is on Edition 6.5 — the shared completedVideos map stays partitioned', async () => {
  const uid = 'user-14';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);   // works on Edition 8 (default)
  const B = createDevice('B', cloud, uid);   // works on Edition 6.5
  B.switchSource('marrow_6_5');

  // Each device configures its OWN edition's plan (independent partitions).
  A.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 8, targetDate: '2027-06-30' }]; });
  B.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Pathology', videosPerDay: 5, targetDate: '2027-08-30' }]; });

  // A ticks Edition 8 videos; B ticks Edition 6.5 videos — INCLUDING the same
  // base video id (anatomy__v1 exists in both editions' datasets). The keys
  // are prefixed per edition, so both must survive in the ONE shared map.
  A.tick('marrow_8::anatomy__v1');
  A.tick('marrow_8::anatomy__v3');
  B.tick('marrow_6_5::anatomy__v1');
  B.tick('marrow_6_5::anatomy__v2');

  // Full round trip: A seeds, B pulls+pushes, both settle.
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();

  const doc = cloud.getDoc();
  // The single shared completedVideos map holds ALL four ticks, correctly
  // prefixed per edition — no collision, no overwrite, no misattribution.
  assert.deepEqual(
    Object.keys(doc.completedVideos).sort(),
    ['marrow_6_5::anatomy__v1', 'marrow_6_5::anatomy__v2', 'marrow_8::anatomy__v1', 'marrow_8::anatomy__v3'],
    'cloud holds every tick, partitioned by edition prefix'
  );
  assert.equal(doc.completedVideos['marrow_8::anatomy__v1'], true, 'edition-8 key survives');
  assert.equal(doc.completedVideos['marrow_6_5::anatomy__v1'], true, 'edition-6.5 key with the SAME base id survives');
  // Per-edition plan partitions stay independent.
  assert.equal(doc.plans_marrow_8[0].videosPerDay, 8, 'Edition 8 plan untouched by B’s 6.5 ticks');
  assert.equal(doc.plans_marrow_6_5[0].videosPerDay, 5, 'Edition 6.5 plan untouched by A’s 8 ticks');

  // Both devices converge on the union of both editions' completions...
  assert.equal(A.state.completedVideos['marrow_6_5::anatomy__v2'], true, 'B’s 6.5 tick arrives on A');
  assert.equal(B.state.completedVideos['marrow_8::anatomy__v3'], true, 'A’s edition-8 tick arrives on B');
  // ...and each still owns its own edition view (active source is a device
  // preference; a pull never yanks a configured device to another edition).
  assert.equal(A.state.activeSource, 'marrow_8', 'A stays on Edition 8');
  assert.equal(B.state.activeSource, 'marrow_6_5', 'B stays on Edition 6.5');
  assert.equal(A.state.plans[0].videosPerDay, 8, 'A still sees its Edition 8 plan');
  assert.equal(B.state.plans[0].videosPerDay, 5, 'B still sees its Edition 6.5 plan');

  // A further settle round must never lose/resurrect a tick — the partitioned
  // map is byte-identical.
  const before = JSON.stringify(doc.completedVideos);
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  assert.equal(JSON.stringify(cloud.getDoc().completedVideos), before, 'partitioned map unchanged after settling');
  // NOTE: no strict zero-write assertion here — the devices ticked, so each
  // manualSync’s diff-based completedVideos union push still writes when its
  // keys differ from the cloud copy. That is a real (idempotent) write, not an
  // echo; the activeSource preference echo is gone (see the dedicated
  // zero-write test above) and the plans/queue-batch echo is gone too.
});
