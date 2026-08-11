import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const toPlain = (v) => JSON.parse(JSON.stringify(v));

// ── Shared in-memory Firestore: ONE doc per user, written exactly like the
//    production FirebaseSync (fieldSyncTimes clock per push, compressed
//    completedVideos). Every write is counted so the ping-pong test can prove
//    writes stop after both devices settle. ────────────────────────────────
function createCloudStore(uid) {
  const store = { [uid]: null };
  const writes = { count: 0 };
  // Real firebase.js stamps fieldSyncTimes with Date.now() — the SAME clock
  // the devices use. (An independent counter would be incomparable and break
  // the per-field newest-wins arbitration in the tests.)

  const cloudApi = {
    writes,
    // Signed-in user the real FirebaseSync exposes after auth.
    currentUser: { uid },
    getDoc: () => store[uid] ? JSON.parse(JSON.stringify(store[uid])) : null,
    resetWrites: () => { writes.count = 0; },

    async loadFromCloud(_uid) {
      return store[_uid] ? JSON.parse(JSON.stringify(store[_uid])) : null;
    },

    // Mirrors firebase.js syncToCloud: full doc + per-field clock, compressed keys.
    async syncToCloud(_uid, stateData) {
      const compress = (window) => {
        const out = {};
        for (const k of Object.keys(window?.completedVideos || {})) {
          out[k.replace(/^[A-Za-z0-9_]+::/, '')] = window.completedVideos[k];
        }
        return out;
      };
      const now = Date.now();
      const fieldSyncTimes = {};
      const payload = {
        completedVideos: compress(stateData),
        goals: stateData.goals || {},
        streakData: stateData.streakData || {},
        personal: stateData.personal || {},
        dailyHistory: stateData.dailyHistory || {},
        dailyHistoryBySubject: stateData.dailyHistoryBySubject || {},
        plans: stateData.plans || [],
        activePlanId: stateData.activePlanId || 'plan_a',
        activeSource: stateData.activeSource || 'marrow_8',
        isConfigured: !!stateData.isConfigured,
        themeStyle: stateData.themeStyle || 'modern'
      };
      Object.keys(payload).forEach((f) => { fieldSyncTimes[f] = now; });
      payload.fieldSyncTimes = fieldSyncTimes;
      payload.updatedAt = now;
      store[_uid] = payload;
      writes.count++;
    },

    // Mirrors firebase.js updateCloudFields: field-level update + clock stamp.
    async updateCloudFields(_uid, fields) {
      if (!store[_uid]) { writes.count++; return; }
      const now = Date.now();
      const fieldTimes = {};
      Object.keys(fields).forEach((f) => { fieldTimes[f] = now; });
      if (!store[_uid].fieldSyncTimes) store[_uid].fieldSyncTimes = {};
      Object.assign(store[_uid].fieldSyncTimes, fieldTimes);
      Object.keys(fields).forEach((f) => {
        // completedVideos keys are source-prefix-compressed in the doc (the
        // real updateVideo path does the same regex strip).
        if (f === 'completedVideos') {
          const out = {};
          Object.keys(fields[f] || {}).forEach((k) => { out[k.replace(/^[A-Za-z0-9_]+::/, '')] = fields[f][k]; });
          store[_uid][f] = out;
        } else {
          store[_uid][f] = JSON.parse(JSON.stringify(fields[f]));
        }
      });
      store[_uid].updatedAt = now;
      writes.count++;
    }
  };

  return cloudApi;
}

// ── Device: runs the REAL js/core/sync.js + js/features/sync.js in a sandbox
//    with a stub store (real saveState dirty-tracking semantics, fast debounce)
//    and a stub toast/shell. Manual sync runs the REAL pull-then-push code. ──
function createDevice(name, cloudApi, uid, opts = {}) {
  const window = { FlowMD: {} };
  const state = {
    completedVideos: {}, goals: {}, plans: [], personal: { doctorName: 'Dr. ' + name },
    dailyHistory: {}, dailyHistoryBySubject: {}, streakData: {},
    activeSource: 'marrow_8', activePlanId: 'plan_a', isConfigured: true,
    themeStyle: 'modern', fieldSyncTimes: {}, _dirtyFields: []
  };
  // Like the real app, the device starts with its own state already considered
  // synced — a no-op save never pushes (prevents the first save from marking
  // every field dirty and rewriting the whole doc).
  const initialBaseline = () => {
    const b = {};
    ['completedVideos', 'goals', 'streakData', 'personal', 'dailyHistory',
      'dailyHistoryBySubject', 'plans', 'activePlanId', 'activeSource',
      'isConfigured', 'themeStyle'].forEach((f) => { b[f] = state[f]; });
    return b;
  };
  state._prevSyncedState = initialBaseline();
  let localSnapshot = null;
  let cloudSyncTimeout = null;

  // Mirrors state-store.js CLOUD_STATE_FIELDS: only these are ever considered
  // for a cloud push — bookkeeping (_prevSyncedState, _dirtyFields,
  // _cloudSyncTimes, fieldSyncTimes, lastLocalUpdate) never leaves the device.
  const CLOUD_FIELDS = ['completedVideos', 'goals', 'streakData', 'personal',
    'dailyHistory', 'dailyHistoryBySubject', 'plans', 'activePlanId',
    'activeSource', 'isConfigured', 'themeStyle'];
  const snapshotCloud = (st) => {
    const snap = {};
    CLOUD_FIELDS.forEach((f) => { if (st[f] !== undefined) snap[f] = st[f]; });
    return snap;
  };

  // Minimal store: saveState does the REAL dirty-field computation (via
  // window.FlowMD.sync.computeDirtyFields), stamps fieldSyncTimes, and pushes
  // changed fields through the mock cloud — same contract as state-store.js.
  const storeStub = {
    getState: () => state,
    saveState: () => {
      state.lastLocalUpdate = Date.now();
      state._dirtyFields = window.FlowMD.sync.computeDirtyFields(state._prevSyncedState, snapshotCloud(state));
      if (state._dirtyFields && state._dirtyFields.length > 0) {
        const now = state.lastLocalUpdate;
        state._dirtyFields.forEach((f) => { state.fieldSyncTimes[f] = now; });
      }
      if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
      const delay = opts.debounceMs ?? 30;
      cloudSyncTimeout = setTimeout(() => {
        if (!state._dirtyFields || state._dirtyFields.length === 0) return;
        const prePush = snapshotCloud(state);
        const fields = {};
        state._dirtyFields.forEach((f) => {
          // The REAL per-field guard (mirrors state-store.js saveState): only
          // fields local changed since its last cloud write go up — never a
          // field the cloud already has newer (e.g. just pulled from cloud).
          const localT = Number((state.fieldSyncTimes || {})[f]) || 0;
          const cloudT = Number((state._cloudSyncTimes || {})[f]) || 0;
          if (localT >= cloudT) fields[f] = state[f];
        });
        if (Object.keys(fields).length === 0) {
          state._prevSyncedState = prePush;
          state._dirtyFields = [];
          return;
        }
        cloudApi.updateCloudFields(uid, fields).then(() => {
          state._prevSyncedState = prePush;
          state._dirtyFields = [];
          const t = Date.now();
          Object.keys(fields).forEach((f) => { state.fieldSyncTimes[f] = t; });
        });
      }, delay);
    }
  };
  window.FlowMD.store = storeStub;
  window.FlowMD.toast = { showToast: () => {} };
  window.FlowMD.theme = { updateOfflineIndicator: () => {} };
  window.FirebaseSync = cloudApi;
  window.FlowMD.shell = { render: () => {} };


  const sandbox = {
    window, console, Date, JSON, Math, String, parseInt, Promise,
    setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage: {
      getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(read('js/core/namespace.js'), sandbox, { filename: 'namespace.js' });
  vm.runInContext(read('js/core/constants.js'), sandbox, { filename: 'constants.js' });
  vm.runInContext(read('js/core/sync.js'), sandbox, { filename: 'core/sync.js' });
  vm.runInContext(read('js/features/sync.js'), sandbox, { filename: 'features/sync.js' });

  const flush = () => new Promise((r) => setTimeout(r, opts.debounceMs ?? 30));

  cloudApi.deviceTag = name;
  // Edits in the app always go through saveState (stamps the field clock +
  // schedules the auto-push). Mirror that so a test edit is "owned" locally.
  const edit = (fn) => { fn(state); storeStub.saveState(); };

  return {
    name,
    state,
    window,
    manualSync: () => window.FlowMD.sync.manualSync(),
    edit,
    flush
  };
}

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
  if (!cloudDoc.plans || !cloudDoc.plans[0] || !cloudDoc.goals || !cloudDoc.goals.videosPerDay) {
    console.log('DEBUG1 cloud:', JSON.stringify({ goals: cloudDoc.goals, plans: cloudDoc.plans, fst: cloudDoc.fieldSyncTimes }));
    console.log('DEBUG1 A:', JSON.stringify({ goals: A.state.goals, plans: A.state.plans }), 'B:', JSON.stringify({ goals: B.state.goals, plans: B.state.plans }));
    console.log('DEBUG1 writes:', cloud.writes.count);
  }
  assert.equal(cloudDoc.goals.videosPerDay, 12, 'A’s goals must reach the cloud');
  assert.equal(cloudDoc.plans[0].videosPerDay, 9, 'B’s plan must reach the cloud');
  assert.equal(A.state.plans[0].videosPerDay, 9, 'B’s plan must arrive on A after A pulls');
  assert.equal(B.state.goals.videosPerDay, 12, 'A’s goals must arrive on B after B pulls');
});

test('two devices editing the SAME field: the newer edit wins, the older is not resurrected', async () => {
  const uid = 'user-2';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  // Both change the same field. A syncs first (cloud = A's retro); B syncs
  // (absorbs A's value), then B makes a NEWER edit — that must win.
  A.edit((s) => { s.themeStyle = 'retro'; });
  await A.manualSync();
  await A.flush();

  await B.manualSync();          // B pulls A's retro — no local conflict yet
  await B.flush();
  B.edit((s) => { s.themeStyle = 'modern'; });
  await B.manualSync();          // push B's newer edit
  await B.flush();
  await A.manualSync();          // A pulls B's newer edit
  await A.flush();

  const cloudDoc = cloud.getDoc();
  assert.equal(cloudDoc.themeStyle, 'modern', 'newer edit (B) wins in the cloud');
  assert.equal(A.state.themeStyle, 'modern', 'newer edit propagates to A');
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
  assert.equal(cloud.getDoc().completedVideos['anatomy__v1'], true, 'cloud key is stored compressed');
});

test('no write ping-pong: writes stop after both devices settle (no echo writes)', async () => {
  const uid = 'user-4';
  const cloud = createCloudStore(uid);
  const A = createDevice('A', cloud, uid);
  const B = createDevice('B', cloud, uid);

  // Each device edits once. Let the debounced auto-push land BEFORE any manual
  // sync so each device's change is written exactly once (countable), then
  // every subsequent sync must be a pure pull with ZERO writes.
  A.edit((s) => { s.goals = { videosPerDay: 10 }; });
  await A.flush();                    // auto-push A: goals → 1 write
  await A.manualSync();               // seeds the doc → 2 writes
  await A.flush();

  B.edit((s) => { s.plans = [{ id: 'plan_a', videosPerDay: 7 }]; });
  await B.flush();                    // auto-push B: plans → 3 writes
  await B.manualSync();               // pull only (B's plans already up) → 0 writes
  await B.flush();

  // From here on, repeated syncs must be pure reads — any write would be an
  // echo/ping-pong.
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
  await B.manualSync();
  await B.flush();

  // Give every debounced auto-push a chance to fire — if the per-field guard
  // works, none of them write anything new.
  await A.flush();
  await B.flush();

  assert.equal(cloud.writes.count, 3, `expected exactly 3 writes (A edit, A seed, B edit), got ${cloud.writes.count}`);
  assert.deepEqual(toPlain(A.state.goals), { videosPerDay: 10 });
  assert.deepEqual(toPlain(A.state.plans), [{ id: 'plan_a', videosPerDay: 7 }]);
});
