/* ============================================================
   FlowMD Core — Sync Logic (pure, unit-tested)
   Cloud-state sanitization, clock-skew-safe merge arbitration,
   and field-level dirty tracking. No DOM/localStorage/state access.
   ============================================================ */
(function () {
  'use strict';

  // Fields the app knows how to consume. Anything else in a cloud doc is
  // dropped so legacy/junk fields can never corrupt in-memory state.
  const KNOWN_FIELDS = [
    'completedVideos', 'speed', 'goals', 'streakData', 'personal', 'subjectUrgency',
    'dailyBatch', 'dailyHistory', 'dailyHistoryBySubject', 'plans', 'activePlanId',
    'activeSource', 'isConfigured', 'themeStyle', 'queueCompletedInBatch',
    'queueBatchVideoIds', 'googleDisplayName', 'googlePhotoURL',
    'updatedAt', 'lastSyncedAt', 'lastLocalUpdate'
  ];

  const KNOWN_SOURCES = ['marrow_8', 'marrow_6_5', 'prepladder_x'];

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  // Returns a new object containing only known, well-typed fields.
  function sanitizeCloudState(raw) {
    if (!isPlainObject(raw)) return {};
    const out = {};
    for (const key of Object.keys(raw)) {
      if (KNOWN_FIELDS.indexOf(key) === -1) continue; // drop unknown fields
      const v = raw[key];
      switch (key) {
        case 'completedVideos':
          if (isPlainObject(v)) {
            const clean = {};
            let ok = true;
            for (const k of Object.keys(v)) {
              if (typeof v[k] !== 'boolean') { ok = false; break; }
              clean[k] = v[k];
            }
            if (ok && Object.keys(clean).length <= 20000) out.completedVideos = clean;
          }
          break;
        case 'plans':
          if (Array.isArray(v) && v.length <= 4) {
            const cleanPlans = v.filter(p => isPlainObject(p) && typeof p.id === 'string');
            if (cleanPlans.length === v.length) out.plans = v;
          }
          break;
        case 'dailyHistory':
        case 'dailyHistoryBySubject':
        case 'goals':
        case 'personal':
        case 'streakData':
        case 'subjectUrgency':
        case 'dailyBatch':
          if (isPlainObject(v)) out[key] = v;
          break;
        case 'queueBatchVideoIds':
          if (Array.isArray(v) && v.length <= 200) out[key] = v;
          break;
        case 'activeSource':
          if (KNOWN_SOURCES.indexOf(v) !== -1) out.activeSource = v;
          break;
        case 'activePlanId':
          if (typeof v === 'string' && v.length <= 64) out.activePlanId = v;
          break;
        case 'themeStyle':
          if (v === 'modern' || v === 'retro') out.themeStyle = v;
          break;
        case 'isConfigured':
          if (typeof v === 'boolean') out.isConfigured = v;
          break;
        case 'speed':
          if (typeof v === 'number' && v >= 0.5 && v <= 4) out.speed = v;
          break;
        case 'queueCompletedInBatch':
          if (typeof v === 'number' && v >= 0 && v <= 200) out.queueCompletedInBatch = v;
          break;
        case 'googleDisplayName':
          if (typeof v === 'string' && v.length <= 200) out.googleDisplayName = v;
          break;
        case 'googlePhotoURL':
          if (typeof v === 'string' && v.length <= 500) out.googlePhotoURL = v;
          break;
        default:
          out[key] = v; // timestamps & lastLocalUpdate pass through
      }
    }
    return out;
  }

  // Clock-skew tolerance: server timestamps and client Date.now() differ by up
  // to a few seconds on healthy devices. Anything older than 5s than local is
  // genuinely stale — unless we have unsynced local changes, which always apply.
  // (Treating sub-5s drift as "apply" also covers the write-loop bug: a device
  // whose clock is behind the server used to re-merge-and-push on every snapshot.
  // With the 5s window the merge is idempotent and field-level dirty tracking
  // below means an unchanged state never triggers a write.)
  const SKEW_TOLERANCE_MS = 5000;

  function shouldApplyCloud(cloudTsMillis, localTsMillis, hasLocalDirty) {
    if (hasLocalDirty) return true;
    const local = Number(localTsMillis) || 0;
    const cloud = Number(cloudTsMillis) || 0;
    if (cloud <= 0) return false;
    // Apply when cloud is newer than local, or close enough that clock
    // skew (not real staleness) explains the difference.
    return cloud + SKEW_TOLERANCE_MS >= local;
  }

  // Local-wins merge. completedVideos is ALWAYS a union with local winning
  // (offline completions are the source of truth). Other maps: cloud fills
  // gaps, local wins conflicts. Plans merge by id (see mergePlansLocalWins).
  function mergePlansLocalWins(cloudPlans, localPlans) {
    if (!Array.isArray(cloudPlans) || cloudPlans.length === 0) return localPlans;
    if (!Array.isArray(localPlans) || localPlans.length === 0) return cloudPlans.slice();
    const merged = localPlans.map(localPlan => {
      const cloudPlan = cloudPlans.find(cp => cp.id === localPlan.id);
      return cloudPlan ? Object.assign({}, cloudPlan, localPlan) : localPlan;
    });
    cloudPlans.forEach(cp => { if (!merged.find(p => p.id === cp.id)) merged.push(cp); });
    return merged;
  }

  function unionLocalWins(localMap, cloudMap) {
    const base = Object.assign({}, cloudMap || {});
    Object.keys(localMap || {}).forEach(k => { base[k] = localMap[k]; });
    return base;
  }

  function mergeLocalWins(local, cloud) {
    const base = Object.assign({}, cloud || {}, local || {});
    if (isPlainObject(cloud.completedVideos) || isPlainObject(local.completedVideos)) {
      base.completedVideos = unionLocalWins(local.completedVideos, cloud.completedVideos);
    }
    if (Array.isArray(cloud.plans) || Array.isArray(local.plans)) {
      base.plans = mergePlansLocalWins(cloud.plans, local.plans);
    }
    return base;
  }

  // Top-level field names whose JSON differs between two states.
  function computeDirtyFields(prevState, nextState) {
    const dirty = [];
    const prev = prevState || {};
    const next = nextState || {};
    const keys = Object.keys(next);
    keys.forEach(k => {
      const a = prev[k];
      const b = next[k];
      if (a === b) return;
      if (a !== undefined && JSON.stringify(a) === JSON.stringify(b)) return;
      dirty.push(k);
    });
    return dirty;
  }

  window.FlowMD.sync = {
    sanitizeCloudState,
    shouldApplyCloud,
    mergeLocalWins,
    mergePlansLocalWins,
    computeDirtyFields,
    KNOWN_FIELDS
  };
})();
