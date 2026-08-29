// Shared harness for the two-device sync tests (sync-twodevice.test.mjs,
// sync-matrix.test.mjs and sync-quest.test.mjs). Runs the REAL js/core/sync.js
// + js/features/sync.js modules in a sandboxed window with a stub store that
// mirrors state-store.js dirty-field semantics, against an in-memory Firestore
// mock that mirrors firebase.js write semantics (per-field clocks merged into
// fieldSyncTimes, per-key completedVideos merges, offline/error behavior).
// Optionally also loads the REAL source-data/subjects/metrics modules (queue
// engine) with stub datasets so daily-quest batch behavior can be tested.
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

  // Mirrors production firebase.js: plans reach the cloud STRIPPED to the
  // synced keys. queueBatchVideoIds (the daily-quest batch) IS synced so
  // every device shows the same quest; only per-day transient bookkeeping
  // (queueCompletedInBatch, extraBatchesCompletedToday, lastBatchDate) is
  // device-local — recomputed by the queue engine per day.
  const PLAN_KEYS = ['id', 'label', 'accentColor', 'targetSubject', 'targetDate',
    'videosPerDay', 'videosPerWeek', 'videosPerMonth', 'dailyTargetHours', 'targetUnits',
    'queueBatchVideoIds', 'lastBatchDate'];
  const stripPlan = (p) => {
    const cp = {};
    PLAN_KEYS.forEach((k) => { if (p && p[k] !== undefined) cp[k] = p[k]; });
    return cp;
  };

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

    // Mirrors firebase.js syncToCloud: full doc + per-field clock. Per-edition
    // fields are stored SUFFIXED (plans_marrow_8, plans_marrow_6_5, ...) so
    // each edition has its own clock.
    async syncToCloud(_uid, stateData) {
      if (this.offline) throw new Error('offline');
      const now = Date.now();
      const fieldSyncTimes = {};
      const edIds = ['marrow_8', 'marrow_6_5'];
      const edBases = ['plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject', 'activePlanId', 'bulkCompletedChapters'];
      const editions = stateData.editions || {};
      const payload = {
        completedVideos: stateData.completedVideos || {},
        streakData: stateData.streakData || {},
        personal: stateData.personal || {},
        activeSource: stateData.activeSource || 'marrow_8',
        isConfigured: !!stateData.isConfigured,
        themeStyle: stateData.themeStyle || 'modern'
      };
      edIds.forEach((src) => {
        const e = editions[src] || {};
        edBases.forEach((base) => {
          if (e[base] === undefined) return;
          payload[base + '_' + src] = base === 'plans'
            ? JSON.parse(JSON.stringify((e.plans || []).map(stripPlan)))
            : JSON.parse(JSON.stringify(e[base]));
        });
      });
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
      // Mirror firebase.js updateCloudFields: strip device-local queue
      // bookkeeping from any plan field before it reaches the doc.
      const plansKeys = Object.keys(fields).filter((k) =>
        k === 'plans' || k.indexOf('plans_') === 0 || k.slice(-'_plans'.length) === '_plans'
      );
      const cleanFields = plansKeys.length > 0 ? Object.assign({}, fields) : fields;
      plansKeys.forEach((k) => {
        if (Array.isArray(fields[k])) cleanFields[k] = fields[k].map(stripPlan);
      });
      const now = Date.now();
      if (!store[_uid].fieldSyncTimes) store[_uid].fieldSyncTimes = {};
      Object.keys(cleanFields).forEach((f) => { store[_uid].fieldSyncTimes[f] = now; });
      Object.keys(cleanFields).forEach((f) => {
        if (f === 'completedVideos') {
          // Per-key merge (mirrors the real FieldPath writes): a partial map
          // must never erase keys already in the doc (cross-edition safety).
          store[_uid].completedVideos = Object.assign(
            {}, store[_uid].completedVideos || {}, cleanFields[f]
          );
        } else {
          store[_uid][f] = JSON.parse(JSON.stringify(cleanFields[f]));
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
  const defaultSlice = () => ({
    plans: [], goals: {}, dailyHistory: {}, dailyHistoryBySubject: {},
    activePlanId: 'plan_a', bulkCompletedChapters: {}
  });
  // Mirrors state-store.js: point the live working fields at an edition's
  // durable slice (pulls land in editions, then views read the live fields).
  const loadEditionIntoLive = (src) => {
    if (!state.editions || !state.editions[src]) {
      if (!state.editions) state.editions = {};
      state.editions[src] = defaultSlice();
    }
    const e = state.editions[src];
    state.plans = e.plans;
    state.goals = e.goals;
    state.dailyHistory = e.dailyHistory;
    state.dailyHistoryBySubject = e.dailyHistoryBySubject;
    state.activePlanId = e.activePlanId;
    state.bulkCompletedChapters = e.bulkCompletedChapters;
  };
  const state = {
    // Production-faithful default profile: the app ships 'Dr. Aspirant' and
    // the merge treats exactly that as EMPTY (isEmptyPersonal) — a fresh
    // device adopts the synced real name instead of racing device defaults
    // against each other like the old 'Dr. A'/'Dr. B' harness defaults did.
    completedVideos: {}, personal: { doctorName: 'Dr. Aspirant' },
    streakData: {},
    activeSource: 'marrow_8', isConfigured: true,
    themeStyle: 'modern', fieldSyncTimes: {}, _dirtyFields: [],
    // LIVE WORKING COPY (mirrors state-store): views read these top-level
    // fields; saveState flushes them into editions[activeSource].
    goals: {}, plans: [], dailyHistory: {}, dailyHistoryBySubject: {},
    activePlanId: 'plan_a', bulkCompletedChapters: {},
    editions: { marrow_8: defaultSlice(), marrow_6_5: defaultSlice() }
  };
  // Same flush rule as state-store: live working fields → active edition slice.
  const flushLiveToEdition = () => {
    const src = state.activeSource || 'marrow_8';
    if (!state.editions[src]) state.editions[src] = defaultSlice();
    const e = state.editions[src];
    e.plans = state.plans; e.goals = state.goals;
    e.dailyHistory = state.dailyHistory; e.dailyHistoryBySubject = state.dailyHistoryBySubject;
    e.activePlanId = state.activePlanId; e.bulkCompletedChapters = state.bulkCompletedChapters;
  };
  // Like the real app, the device starts with its own state already considered
  // synced — a no-op save never pushes (prevents the first save from marking
  // every field dirty and rewriting the whole doc).
  const initialBaseline = () => {
    flushLiveToEdition();
    const b = {};
    ['completedVideos', 'streakData', 'personal', 'activeSource',
      'isConfigured', 'themeStyle'].forEach((f) => {
      if (state[f] !== undefined) b[f] = JSON.parse(JSON.stringify(state[f]));
    });
    ['marrow_8', 'marrow_6_5'].forEach((src) => {
      ['plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject', 'activePlanId', 'bulkCompletedChapters'].forEach((base) => {
        const e = state.editions[src];
        if (e && e[base] !== undefined) b[base + '_' + src] = JSON.parse(JSON.stringify(e[base]));
      });
    });
    return b;
  };
  state._prevSyncedState = initialBaseline();
  let localSnapshot = null;
  let cloudSyncTimeout = null;

  // Mirrors state-store.js CLOUD_STATE_FIELDS: global fields + suffixed
  // per-edition fields. Only these are ever considered for a cloud push.
  const CLOUD_FIELDS = ['completedVideos', 'streakData', 'personal', 'activeSource',
    'isConfigured', 'themeStyle'];
  ['marrow_8', 'marrow_6_5'].forEach((src) => {
    ['plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject', 'activePlanId', 'bulkCompletedChapters'].forEach((base) => {
      CLOUD_FIELDS.push(base + '_' + src);
    });
  });
  const readCloud = (st, f) => {
    for (const src of ['marrow_8', 'marrow_6_5']) {
      const suffix = '_' + src;
      if (f.length > suffix.length && f.slice(-suffix.length) === suffix) {
        const base = f.slice(0, -suffix.length);
        if (['plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject', 'activePlanId', 'bulkCompletedChapters'].includes(base)) {
          const e = (st.editions && st.editions[src]) || {};
          return e[base];
        }
      }
    }
    return st[f];
  };
  const snapshotCloud = (st) => {
    flushLiveToEdition();
    const snap = {};
    CLOUD_FIELDS.forEach((f) => {
      const v = readCloud(st, f);
      if (v === undefined) return;
      snap[f] = JSON.parse(JSON.stringify(v));
    });
    return snap;
  };

  // Minimal store: saveState does the REAL dirty-field computation (via
  // window.FlowMD.sync.computeDirtyFields), stamps fieldSyncTimes, and pushes
  // changed fields through the mock cloud — same contract as state-store.js.
  const storeStub = {
    getState: () => state,
    // Mirror state-store.js exports used by applyMergedState: after a pull,
    // the merged suffixed fields land in editions and the live view is
    // re-pointed at the active slice.
    loadEditionIntoLive,
    defaultEditionSlice: defaultSlice,
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
          if (localT >= cloudT) fields[f] = readCloud(state, f);
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

  // Optional stub datasets (plain, pre-prefix video ids). source-data.js
  // qualifies them with the edition prefix exactly like the real data files,
  // so the queue engine sees real marrow_8::/marrow_6_5:: keys.
  const dataset = opts.dataset || { marrow_8: [], marrow_6_5: [] };

  const sandbox = {
    window, console, Date, JSON, Math, String, parseInt, Promise,
    setTimeout, clearTimeout, setInterval, clearInterval,
    syllabusData: dataset.marrow_8,
    syllabusData65: dataset.marrow_6_5,
    localStorage: {
      getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(read('js/core/namespace.js'), sandbox, { filename: 'namespace.js' });
  vm.runInContext(read('js/core/constants.js'), sandbox, { filename: 'constants.js' });
  // Real queue engine: source-data (dataset registry), subjects (metadata),
  // metrics (daily-quest queue engine). The queue tests exercise the ACTUAL
  // getTodayQueueForPlan batch logic against the sync layer.
  vm.runInContext(read('js/core/source-data.js'), sandbox, { filename: 'core/source-data.js' });
  window.FlowMD.sourceData.initSourceData();
  vm.runInContext(read('js/core/subjects.js'), sandbox, { filename: 'core/subjects.js' });
  vm.runInContext(read('js/core/metrics.js'), sandbox, { filename: 'core/metrics.js' });
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
    // Ticks a video exactly like the app's checkbox handler: write
    // completedVideos, then saveState (stamps the field clock + schedules the
    // debounced auto-push). The sync layer only ever sees completedVideos.
    tick: (vidId) => { state.completedVideos[vidId] = true; storeStub.saveState(); },
    untick: (vidId) => { delete state.completedVideos[vidId]; storeStub.saveState(); },
    // Renders the daily quest with the REAL queue engine (getAllPlanQueues →
    // getTodayQueueForPlan): returns the batch video ids and per-video ticked
    // status exactly as the dashboard would draw them.
    renderQuest: () => {
      const queues = window.FlowMD.metrics.getAllPlanQueues();
      const q = queues[0] || {};
      return {
        planId: q.planId,
        batch: (q.videos || []).map(v => v.id),
        checked: (q.videos || []).map(v => !!state.completedVideos[v.id]),
        queueCompletedInBatch: q.queueCompletedInBatch
      };
    },
    // Mirrors state-store.js switchSource: flush the current live fields
    // into the old edition, point activeSource at the new one, and load its
    // slice as the live view (per-day queue bookkeeping is out of scope here).
    switchSource: (src) => {
      flushLiveToEdition();
      state.activeSource = src;
      loadEditionIntoLive(src);
      storeStub.saveState();
    },
    flush
  };
}
