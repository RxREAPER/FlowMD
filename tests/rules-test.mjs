/* ============================================================
   FlowMD Firestore Rules Test — runs against the Firestore
   emulator. Requires Java (the emulator is a JVM process); a JRE
   ships in the workspace at ../.tools/jdk-21.0.12+8-jre — point
   JAVA_HOME / PATH at its bin/ before running.

   Usage (from project root, with the emulator provisioned):
     npx firebase emulators:exec --only firestore --project flowmd-04 "node tests/rules-test.mjs"
   ============================================================ */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rules = await readFile(join(root, 'firestore.rules'), 'utf8');

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
async function checkFails(name, promise) {
  try { await assertFails(promise); check(name, true); }
  catch (e) { check(name, false, e.message); }
}
async function checkSucceeds(name, promise) {
  try { await assertSucceeds(promise); check(name, true); }
  catch (e) { check(name, false, e.message); }
}

// A fully-valid v215 document mirroring the syncToCloud payload: per-edition
// fields are SUFFIXED (plans_marrow_8, dailyHistory_marrow_6_5, ...), and the
// legacy FLAT fields (plans, goals, dailyHistory, queueBatchVideoIds, ...)
// are NO LONGER written. validWrite() evaluates the WHOLE resulting document
// on create AND after every update, so every required field must be present.
function validDoc() {
  return {
    completedVideos: { 'marrow_8::v1': true },
    streakData: { lastStudyDate: '2026-08-09', currentStreak: 3 },
    personal: { doctorName: 'Test User', isSynced: true },
    activeSource: 'marrow_8',
    isConfigured: true,
    themeStyle: 'modern',
    googleDisplayName: 'Test User',
    googlePhotoURL: null,
    updatedAt: new Date(),
    fieldSyncTimes: { completedVideos: Date.now() },
    plans_marrow_8: [{ id: 'plan_a', label: 'Plan A', videosPerDay: 8 }],
    plans_marrow_6_5: [],
    goals_marrow_8: { videosPerDay: 8 },
    goals_marrow_6_5: {},
    dailyHistory_marrow_8: { '2026-08-09': 5 },
    dailyHistory_marrow_6_5: {},
    dailyHistoryBySubject_marrow_8: { anatomy: { '2026-08-09': 2 } },
    dailyHistoryBySubject_marrow_6_5: {},
    activePlanId_marrow_8: 'plan_a',
    activePlanId_marrow_6_5: 'plan_a',
    bulkCompletedChapters_marrow_8: {},
    bulkCompletedChapters_marrow_6_5: {}
  };
}

const testEnv = await initializeTestEnvironment({ projectId: 'flowmd-04', firestore: { rules } });

try {
  // 1. Unauthenticated read denied
  const anon = testEnv.unauthenticatedContext();
  await checkFails('unauthenticated read denied', anon.firestore().doc('users/uidA').get());

  // 2. User A reading user B denied
  const a = testEnv.authenticatedContext('uidA');
  const b = testEnv.authenticatedContext('uidB');
  await checkFails('user A reading user B denied', a.firestore().doc('users/uidB').get());

  // 3. Valid v215 self-write allowed (create), and cross-user write denied
  await checkSucceeds('v215 self-write allowed (suffixed per-edition fields)', a.firestore().doc('users/uidA').set(validDoc()));
  await checkFails('user A writing user B denied', a.firestore().doc('users/uidB').set(validDoc()));

  // 4. Oversized completedVideos (25,000 keys > 20,000 cap) denied — both
  //    create on a fresh doc and update on the existing one
  const big = validDoc();
  big.completedVideos = {};
  for (let i = 0; i < 25000; i += 1) big.completedVideos['video_' + i] = true;
  await checkFails('oversized completedVideos create denied', b.firestore().doc('users/uidB').set(big));
  await checkFails('oversized completedVideos update denied', a.firestore().doc('users/uidA').set(big));

  // 5. Unknown source value denied
  const bad = validDoc();
  bad.activeSource = 'not_a_source';
  await checkFails('unknown source value denied', a.firestore().doc('users/uidA').set(bad));

  // 6. Oversized per-edition plans denied (a suffixed field must not smuggle
  //    more than 4 plans through an edition partition)
  const tooManyPlans = validDoc();
  tooManyPlans.plans_marrow_6_5 = [
    { id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }
  ];
  await checkFails('oversized plans_marrow_6_5 denied', a.firestore().doc('users/uidA').set(tooManyPlans));

  // 7. Field-level update of a valid doc (updateCloudFields path) allowed —
  //    including a per-edition suffixed field and its dot-path clock
  await checkSucceeds('field-level update allowed (suffixed + clock)', a.firestore().doc('users/uidA').update({
    completedVideos: { 'marrow_8::v1': true, 'marrow_8::v2': true },
    plans_marrow_8: [{ id: 'plan_a', label: 'Plan A', videosPerDay: 10 }],
    'fieldSyncTimes.plans_marrow_8': Date.now(),
    updatedAt: new Date()
  }));

  // 8. Legacy flat-field docs (pre-v215) still update: a doc that only has
  //    FLAT fields (no suffixed partition) must not be bricked by the rules
  const legacy = {
    completedVideos: { 'marrow_8::v1': true },
    goals: { videosPerDay: 8 },
    dailyHistory: { '2026-08-09': 5 },
    dailyHistoryBySubject: { anatomy: { '2026-08-09': 2 } },
    plans: [{ id: 'plan_a', label: 'Plan A', videosPerDay: 8 }],
    activePlanId: 'plan_a',
    activeSource: 'marrow_8',
    isConfigured: true,
    themeStyle: 'modern',
    updatedAt: new Date()
  };
  await checkSucceeds('legacy flat-field doc create allowed', b.firestore().doc('users/uidB').set(legacy));
  await checkSucceeds('legacy flat-field doc update allowed', b.firestore().doc('users/uidB').update({
    plans: [{ id: 'plan_a', label: 'Plan A', videosPerDay: 10 }],
    updatedAt: new Date()
  }));

  // 9. delete: cross-user denied, self allowed (account deletion flow)
  await checkFails('cross-user delete denied', b.firestore().doc('users/uidA').delete());
  await checkSucceeds('self delete allowed', a.firestore().doc('users/uidA').delete());
} finally {
  await testEnv.cleanup();
}

console.log(failures === 0 ? '\nAll rules checks passed.' : `\n${failures} rules check(s) failed.`);
process.exit(failures ? 1 : 0);
