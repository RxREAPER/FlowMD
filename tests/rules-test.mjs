/* ============================================================
   FlowMD Firestore Rules Test — runs against the Firestore
   emulator. Requires Java (the emulator is a JVM process).

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

// A fully-valid document mirroring the syncToCloud payload. validWrite()
// evaluates the WHOLE resulting document on create AND after every update,
// so every required field must be present.
function validDoc() {
  return {
    completedVideos: { 'marrow_8::v1': true },
    speed: 1.5,
    goals: { videosPerDay: 8 },
    streakData: { lastStudyDate: '2026-08-09', currentStreak: 3 },
    personal: { doctorName: 'Test User', isSynced: true },
    subjectUrgency: {},
    dailyBatch: null,
    dailyHistory: { '2026-08-09': 5 },
    dailyHistoryBySubject: { anatomy: { '2026-08-09': 2 } },
    plans: [{ id: 'plan_a', label: 'Plan A', videosPerDay: 8 }],
    activePlanId: 'plan_a',
    activeSource: 'marrow_8',
    isConfigured: true,
    themeStyle: 'modern',
    queueCompletedInBatch: 0,
    queueBatchVideoIds: [],
    googleDisplayName: 'Test User',
    googlePhotoURL: null,
    updatedAt: new Date(),
    lastSyncedAt: new Date()
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

  // 3. Valid self-write allowed (create), and cross-user write denied
  await checkSucceeds('valid self-write allowed', a.firestore().doc('users/uidA').set(validDoc()));
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

  // 6. Field-level update of a valid doc (Task A2's updateCloudFields path) allowed
  await checkSucceeds('field-level update allowed', a.firestore().doc('users/uidA').update({
    completedVideos: { 'marrow_8::v1': true, 'marrow_8::v2': true },
    updatedAt: new Date()
  }));

  // 7. delete: cross-user denied, self allowed (Task B3 account deletion)
  await checkFails('cross-user delete denied', b.firestore().doc('users/uidA').delete());
  await checkSucceeds('self delete allowed', a.firestore().doc('users/uidA').delete());
} finally {
  await testEnv.cleanup();
}

console.log(failures === 0 ? '\nAll rules checks passed.' : `\n${failures} rules check(s) failed.`);
process.exit(failures ? 1 : 0);
