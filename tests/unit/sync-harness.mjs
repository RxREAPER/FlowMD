// Shared harness for the two-device sync tests (sync-twodevice.test.mjs and
// sync-matrix.test.mjs). Runs the REAL js/core/sync.js + js/features/sync.js
// modules in a sandboxed window with a stub store that mirrors state-store.js
// dirty-field semantics, against an in-memory Firestore mock that mirrors
// firebase.js write semantics (per-field clocks merged into fieldSyncTimes,
// per-key completedVideos merges, offline/error behavior).
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

export const toPlain = (v) => JSON.parse(JSON.stringify(v));

// ── Shared in-memory Firestore: ONE doc per user, written exactly like the
//    production FirebaseSync (merged fieldSyncTimes clocks, per-key
//    completedVideos merges, prefixed keys). Every write is counted so the
//    ping-pong tests can prove writes stop after devices settle. ────────────
export function createCloudStore(uid) {
  const store = { [uid]: null };
  const writes = { count: 0 };
  const cloudApi = {
    writes,
    currentUser: { uid },        // signed-in user after auth
    offline: false,              // simulate network loss
    _authCb: null,

    getDoc: () => store[uid] ? JSON.parse(JSON.stringify(store[uid])) : null,
    resetWrites: () => { writes.count = 0; },
    seedDoc: (payload) => { store[uid] = JSON.parse(JSON.stringify(payload)); },

    // Mirrors firebase.js auth wiring: sign-in invokes the registered handler.
    onAuthChange(cb) { this._authCb = cb; },
    async __signIn(user) {
      this.currentUser = user || { uid };
      if (this._authCb) return this._authCb(this.currentUser);
      return null;
    },

    async loadFromCloud(_uid) {
      if (this.offline) throw new Error('offline');
      return store[_uid] ? JSON.parse(JSON.stringify(store[_uid])) : null;
    },

    // Mirrors firebase.js syncToCloud: full doc + per-field clock.
    async syncToCloud(_uid, stateData) {
      if (this.offline) throw new Error('offline');
      const now = Date.now();
      const fieldSyncTimes = {};
      const payload = {
        completedVideos: stateData.completedVideos || {},
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

    // Mirrors firebase.js updateCloudFields: field-level update + clock stamp
    // MERGED into the existing fieldSyncTimes map (dot-path semantics — never
    // replace the map, which would destroy every other field's clock).
    async updateCloudFields(_uid, fields) {
      if (this.offline) throw new Error('offline');
      if (!store[_uid]) { writes.count++; return; }
      const now = Date.now();
      if (!store[_uid].fieldSyncTimes) store[_uid].fieldSyncTimes = {};
      Object.keys(fields).forEach((f) => { store[_uid].fieldSyncTimes[f] = now; });
      Object.keys(fields).forEach((f) => {
        if (f === 'completedVideos') {
          // Per-key merge (mirrors the real FieldPath writes): a partial map
          // must never erase keys already in the doc (cross-edition safety).
          store[_uid].completedVideos = Object.assign(
            {}, store[_uid].completedVideos || {}, fields[f]
          );
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
export function createDevice(name, cloudApi, uid, opts = {}) {
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
      'isConfigured', 'themeStyle'].forEach((f) => {
      // DEEP copy — mirrors the fixed state-store/applyMergedState baselines
      // (shared references made in-place edits invisible to dirty detection).
      if (state[f] !== undefined) b[f] = JSON.parse(JSON.stringify(state[f]));
    });
    return b;
  };
  state._prevSyncedState = initialBaseline();
  let localSnapshot = null;
  let cloudSyncTimeout = null;

  // Mirrors state-store.js CLOUD_STATE_FIELDS: only these are ever considered
  // for a cloud push — bookkeeping never leaves the device.
  const CLOUD_FIELDS = ['completedVideos', 'goals', 'streakData', 'personal',
    'dailyHistory', 'dailyHistoryBySubject', 'plans', 'activePlanId',
    'activeSource', 'isConfigured', 'themeStyle'];
  const snapshotCloud = (st) => {
    const snap = {};
    CLOUD_FIELDS.forEach((f) => {
      if (st[f] === undefined) return;
      snap[f] = JSON.parse(JSON.stringify(st[f]));
    });
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
        cloudApi.updateCloudFields(uid, fields)
          .then(() => {
            state._prevSyncedState = prePush;
            state._dirtyFields = [];
            const t = Date.now();
            Object.keys(fields).forEach((f) => { state.fieldSyncTimes[f] = t; });
          })
          .catch((err) => { /* offline: deferred, dirty stays */ });
      }, delay);
    }
  };
  window.FlowMD.store = storeStub;
  window.FlowMD.toast = { showToast: () => {} };
  window.FlowMD.theme = { updateOfflineIndicator: () => {} };
  window.FirebaseSync = cloudApi;
  window.FlowMD.shell = { render: () => {} };

  // Minimal DOM-less event support so initFirebaseSync's online/offline
  // listeners can be wired and dispatched in tests.
  const listeners = {};
  window.addEventListener = (ev, cb) => { (listeners[ev] = listeners[ev] || []).push(cb); };
  window.removeEventListener = (ev, cb) => {
    listeners[ev] = (listeners[ev] || []).filter((f) => f !== cb);
  };
  window.dispatchEvent = (ev) => {
    (listeners[ev.type] || []).forEach((cb) => { try { cb(ev); } catch (e) { /* test listener error */ } });
    return true;
  };

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

  // Wire the real auth/connectivity handlers (like app.js does).
  window.FlowMD.sync.initFirebaseSync();

  const flush = () => new Promise((r) => setTimeout(r, opts.debounceMs ?? 30));

  cloudApi.deviceTag = name;
  // Edits in the app always go through saveState (stamps the field clock +
  // schedules the auto-push). Mirror that so a test edit is "owned" locally.
  const edit = (fn) => { fn(state); storeStub.saveState(); };

  return {
    name,
    state,
    window,
    cloudApi,
    manualSync: () => window.FlowMD.sync.manualSync(),
    signIn: (user) => window.FirebaseSync.__signIn(user),
    setOffline: (off) => {
      cloudApi.offline = off;
      state.isOffline = off;
    },
    // Simulates the browser 'online' event: flips connectivity and lets the
    // real listener run a pull-then-push sync.
    goOnline: () => {
      cloudApi.offline = false;
      state.isOffline = false;
      window.dispatchEvent({ type: 'online' });
      return flush();
    },
    edit,
    flush
  };
}
