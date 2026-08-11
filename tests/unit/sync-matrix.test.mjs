// Sync scenario matrix — the full feature surface, verified against the REAL
// production sync modules (js/core/sync.js + js/features/sync.js) running in
// sandboxed devices against an in-memory Firestore mock (firebase.js write
// semantics). Groups:
//   A. Auth & first sync   B. Plans (per-plan merge)   C. completedVideos
//   D. Offline → online    E. Three-device convergence
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudStore, createDevice, toPlain } from './sync-harness.mjs';

const uid = (n) => 'user-' + n;

// ── A. Auth & first sync ──────────────────────────────────────────────────

test('A1 sign-in with no cloud doc seeds it with the local state', async () => {
  const cloud = createCloudStore(uid(1));
  const A = createDevice('A', cloud, uid(1));
  A.edit((s) => {
    s.goals = { videosPerDay: 12, targetSubject: 'Anatomy' };
    s.personal = { doctorName: 'Dr. A' };
  });

  await A.signIn({ uid: uid(1), email: 'a@x.com' });
  await A.flush();

  const doc = cloud.getDoc();
  assert.ok(doc, 'doc was created');
  assert.equal(doc.goals.videosPerDay, 12, 'local goals seeded');
  assert.equal(doc.personal.doctorName, 'Dr. A', 'local profile seeded');
  assert.equal(A.state.personal.isSynced, true, 'profile marked synced');
  assert.equal(A.state.personal.syncEmail, 'a@x.com', 'sync email recorded');
});

test('A2 sign-in with an existing cloud doc pulls it into a fresh device', async () => {
  const cloud = createCloudStore(uid(2));
  const A = createDevice('A', cloud, uid(2));
  A.edit((s) => {
    s.goals = { videosPerDay: 12, targetSubject: 'Anatomy' };
    s.personal = { doctorName: 'Dr. A' };
    s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 12, targetDate: '2027-06-30' }];
  });
  await A.signIn({ uid: uid(2), email: 'a@x.com' });   // seeds
  await A.flush();

  const B = createDevice('B', cloud, uid(2));           // fresh device, defaults
  await B.signIn({ uid: uid(2), email: 'b@x.com' });    // pulls
  await B.flush();

  assert.equal(B.state.goals.videosPerDay, 12, 'goals arrive on the fresh device');
  assert.equal(B.state.personal.doctorName, 'Dr. A', 'profile arrives on the fresh device');
  assert.equal(B.state.plans[0].videosPerDay, 12, 'plans arrive on the fresh device');
  assert.equal(B.state.personal.isSynced, true, 'fresh device marked synced');
});

test('A3 legacy cloud doc (no fieldSyncTimes, unprefixed video keys) migrates on sign-in', async () => {
  const cloud = createCloudStore(uid(3));
  cloud.seedDoc({
    completedVideos: { 'anatomy__v1': true },              // legacy: no source prefix
    goals: { videosPerDay: 10, targetSubject: 'Anatomy', targetDate: '2027-01-01' },
    personal: { doctorName: 'Dr. Legacy' },
    plans: [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 10, targetDate: '2027-01-01' }],
    activeSource: 'marrow_6_5',
    isConfigured: true,
    themeStyle: 'modern',
    updatedAt: Date.now() - 86400000
    // NOTE: no fieldSyncTimes — pre-v205 doc
  });

  const B = createDevice('B', cloud, uid(3));
  // A truly fresh device carries the app default profile — not a custom name.
  B.state.personal = { doctorName: 'Dr. Aspirant' };
  await B.signIn({ uid: uid(3), email: 'b@x.com' });
  await B.flush();

  assert.equal(B.state.plans[0].videosPerDay, 10, 'legacy plans arrive (empty-guard: real cloud data wins over unset local)');
  assert.equal(B.state.goals.videosPerDay, 10, 'legacy goals arrive');
  assert.equal(B.state.personal.doctorName, 'Dr. Legacy', 'legacy profile arrives (default profile is empty)');
  assert.equal(B.state.activeSource, 'marrow_6_5', 'legacy source arrives (default never beats a choice)');
  assert.equal(B.state.completedVideos['marrow_8::anatomy__v1'], true, 'legacy unprefixed key re-prefixed with the device source');
});

// ── B. Plans — per-plan merge ─────────────────────────────────────────────

test('B1 concurrent plans: A adds Plan B while B edits Plan A — both survive, edit propagates', async () => {
  const cloud = createCloudStore(uid(4));
  const A = createDevice('A', cloud, uid(4));
  const B = createDevice('B', cloud, uid(4));

  A.edit((s) => {
    s.plans = [
      { id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 8, targetDate: '2027-06-30' },
      { id: 'plan_b', label: 'Plan B', targetSubject: 'Pathology', videosPerDay: 5, targetDate: '2027-08-30' }
    ];
  });
  await A.manualSync();   // seed: cloud = [A{8}, B{5}]
  await A.flush();

  // B edits Plan A's pace AFTER the seed — genuinely newer.
  B.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 10, targetDate: '2027-06-30' }]; });
  await B.manualSync();   // per-plan merge: B's newer plan_a wins; cloud's plan_b joins B
  await B.flush();
  await A.manualSync();   // A pulls B's edit; plan_b stays
  await A.flush();

  const planOf = (plans, id) => plans.find(p => p.id === id);
  assert.equal(planOf(B.state.plans, 'plan_a').videosPerDay, 10, 'B keeps its newer edit');
  assert.equal(planOf(B.state.plans, 'plan_b').videosPerDay, 5, 'cloud plan_b arrives on B — never lost');
  assert.equal(planOf(A.state.plans, 'plan_a').videosPerDay, 10, 'B’s edit propagates to A');
  assert.equal(planOf(A.state.plans, 'plan_b').videosPerDay, 5, 'A keeps its own plan_b');
  const cloudPlans = cloud.getDoc().plans;
  assert.equal(planOf(cloudPlans, 'plan_a').videosPerDay, 10, 'cloud converges to B’s edit');
  assert.equal(planOf(cloudPlans, 'plan_b').videosPerDay, 5, 'cloud keeps plan_b');
});

test('B2 same-plan edit propagates to the other device', async () => {
  const cloud = createCloudStore(uid(5));
  const A = createDevice('A', cloud, uid(5));
  const B = createDevice('B', cloud, uid(5));

  A.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 8, targetDate: '2027-06-30' }]; });
  await A.manualSync();
  await A.flush();
  await B.manualSync();    // B absorbs A's plan
  await B.flush();

  B.edit((s) => { s.plans[0].videosPerDay = 10; });   // newer edit
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();

  assert.equal(A.state.plans[0].videosPerDay, 10, 'same-plan edit reaches A');
  assert.equal(cloud.getDoc().plans[0].videosPerDay, 10, 'cloud reflects the newer edit');
});

// ── C. completedVideos ────────────────────────────────────────────────────

test('C1 unchecking a video does not resurrect on the unchecking device; union keeps it on the other (documented)', async () => {
  const cloud = createCloudStore(uid(6));
  const A = createDevice('A', cloud, uid(6));
  const B = createDevice('B', cloud, uid(6));

  A.edit((s) => { s.completedVideos = { 'marrow_8::anatomy__v1': true, 'marrow_8::anatomy__v2': true }; });
  await A.manualSync();
  await A.flush();
  await B.manualSync();    // B absorbs both completions
  await B.flush();

  // B unchecks v1.
  B.edit((s) => { s.completedVideos = { 'marrow_8::anatomy__v1': false, 'marrow_8::anatomy__v2': true }; });
  await B.manualSync();    // union: B keeps its uncheck locally, pushes it
  await B.flush();
  await A.manualSync();    // A's union: local wins → A keeps v1 checked
  await A.flush();

  assert.equal(B.state.completedVideos['marrow_8::anatomy__v1'], false, 'uncheck stays on the unchecking device');
  assert.equal(A.state.completedVideos['marrow_8::anatomy__v1'], true, 'other device keeps its completion');
  // Documented union trade-off: the cloud converges to the union of checked
  // states, so an uncheck is device-local (it never resurrects on the device
  // that unchecked, but also never propagates to other devices).
  assert.equal(cloud.getDoc().completedVideos['marrow_8::anatomy__v1'], true, 'cloud keeps the union (documented trade-off)');
  assert.equal(B.state.completedVideos['marrow_8::anatomy__v2'], true, 'other completions untouched');
});

test('C2 stress: 500 completions per edition (1000 keys) all survive the round trip', async () => {
  const cloud = createCloudStore(uid(7));
  const A = createDevice('A', cloud, uid(7));
  const B = createDevice('B', cloud, uid(7));
  const cvA = {};
  const cvB = {};
  for (let i = 0; i < 500; i++) cvA['marrow_8::anatomy__v' + i] = true;
  for (let i = 0; i < 500; i++) cvB['marrow_6_5::anatomy__v' + i] = true;

  A.edit((s) => { s.completedVideos = cvA; });
  B.edit((s) => { s.completedVideos = cvB; });
  await A.manualSync();
  await A.flush();
  await B.manualSync();
  await B.flush();
  await A.manualSync();
  await A.flush();

  assert.equal(Object.keys(A.state.completedVideos).length, 1000, 'A holds all 1000 completions');
  assert.equal(Object.keys(B.state.completedVideos).length, 1000, 'B holds all 1000 completions');
  assert.equal(Object.keys(cloud.getDoc().completedVideos).length, 1000, 'cloud holds all 1000 completions');
  assert.equal(A.state.completedVideos['marrow_8::anatomy__v499'], true);
  assert.equal(A.state.completedVideos['marrow_6_5::anatomy__v499'], true);
});

// ── D. Offline → online ───────────────────────────────────────────────────

test('D1 edits made offline converge when the device comes back online', async () => {
  const cloud = createCloudStore(uid(8));
  const A = createDevice('A', cloud, uid(8));
  A.edit((s) => { s.goals = { videosPerDay: 6, targetSubject: 'Anatomy' }; });
  await A.manualSync();    // seed A's state
  await A.flush();

  const B = createDevice('B', cloud, uid(8));
  B.setOffline(true);
  B.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy', videosPerDay: 4 }]; });
  await B.flush();         // the debounced auto-push fails silently (offline), dirty stays
  await B.goOnline();      // real 'online' listener runs a pull-then-push
  await B.flush();
  await B.flush();

  assert.equal(B.state.goals.videosPerDay, 6, 'B pulled A’s goals after coming online');
  assert.equal(cloud.getDoc().plans[0].videosPerDay, 4, 'B’s offline edit reached the cloud');

  await A.manualSync();
  await A.flush();
  assert.equal(A.state.plans[0].videosPerDay, 4, 'A receives B’s offline edit');
});

// ── E. Three-device convergence ───────────────────────────────────────────

test('E1 three devices converge on one doc without losing anyone’s data', async () => {
  const cloud = createCloudStore(uid(9));
  const A = createDevice('A', cloud, uid(9));
  const B = createDevice('B', cloud, uid(9));
  const C = createDevice('C', cloud, uid(9));

  // Realistic staggered flow: each device syncs AFTER its own edit, so every
  // edit lands with a newer clock than what it replaces.
  A.edit((s) => { s.goals = { videosPerDay: 12, targetSubject: 'Anatomy' }; });
  await A.manualSync(); await A.flush();            // A seeds the doc

  B.edit((s) => { s.plans = [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Pathology', videosPerDay: 7 }]; });
  await B.manualSync(); await B.flush();            // B pulls A's goals, pushes its plan

  C.edit((s) => { s.personal = { doctorName: 'Dr. Cee' }; });
  await C.manualSync(); await C.flush();            // C pulls A+B, pushes its profile

  // Remaining devices pull everything.
  await A.manualSync(); await A.flush();
  await B.manualSync(); await B.flush();
  await C.manualSync(); await C.flush();

  for (const [name, dev] of [['A', A], ['B', B], ['C', C]]) {
    assert.equal(dev.state.goals.videosPerDay, 12, `${name} has A’s goals`);
    assert.equal(dev.state.plans[0].videosPerDay, 7, `${name} has B’s plan`);
    assert.equal(dev.state.personal.doctorName, 'Dr. Cee', `${name} has C’s profile`);
  }
  const doc = cloud.getDoc();
  assert.equal(doc.goals.videosPerDay, 12, 'cloud has A’s goals');
  assert.equal(doc.plans[0].videosPerDay, 7, 'cloud has B’s plan');
  assert.equal(doc.personal.doctorName, 'Dr. Cee', 'cloud has C’s profile');

  // And once converged, more syncs produce zero writes (no echo).
  cloud.resetWrites();
  await A.manualSync(); await A.flush();
  await B.manualSync(); await B.flush();
  await C.manualSync(); await C.flush();
  await A.flush(); await B.flush(); await C.flush();
  assert.equal(cloud.writes.count, 0, `no writes after three devices converge, got ${cloud.writes.count}`);
});
