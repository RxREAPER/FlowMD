/* ============================================================
   FlowMD Core — Sync Logic (pure, unit-tested)
   Cloud-state sanitization, clock-skew-safe merge arbitration,
   and field-level dirty tracking. No DOM/localStorage/state access.
   ============================================================ */
(function () {
  'use strict';

  // Fields the app knows how to consume. Anything else in a cloud doc is
  // dropped so legacy/junk fields can never corrupt in-memory state.
  // Deliberately excluded (space): speed/subjectUrgency/dailyBatch (dead,
  // never read), queueCompletedInBatch/queueBatchVideoIds (per-day transient,
  // recomputed by the queue engine), lastSyncedAt (never read — updatedAt
  // is the merge clock).
  const KNOWN_FIELDS = [
    'completedVideos', 'goals', 'streakData', 'personal',
    'dailyHistory', 'dailyHistoryBySubject', 'plans', 'activePlanId',
    'activeSource', 'isConfigured', 'themeStyle', 'googleDisplayName',
    'googlePhotoURL', 'updatedAt', 'lastLocalUpdate'
  ];

  // Fields a plan keeps in the cloud doc. Transient daily state (the queue
  // batch, per-day counters) is recomputed by the queue engine and never
  // synced — it changes every session and tells another device nothing.
  const PLAN_CLOUD_KEYS = [
    'id', 'label', 'accentColor', 'targetSubject', 'targetDate',
    'videosPerDay', 'videosPerWeek', 'videosPerMonth',
    'dailyTargetHours', 'targetUnits'
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
            const cleanPlans = [];
            let ok = true;
            for (const p of v) {
              if (!isPlainObject(p) || typeof p.id !== 'string') { ok = false; break; }
              const cp = {};
              for (const k of PLAN_CLOUD_KEYS) if (p[k] !== undefined) cp[k] = p[k];
              cleanPlans.push(cp);
            }
            if (ok && cleanPlans.length === v.length) out.plans = cleanPlans;
          }
          break;
        case 'dailyHistory':
        case 'dailyHistoryBySubject':
        case 'goals':
        case 'personal':
        case 'streakData':
          if (isPlainObject(v)) out[key] = v;
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

  // --- Cloud-doc size control (pure helpers) ---

  // Video IDs in state/localStorage carry a runtime source prefix
  // ("marrow_8::anatomy__v1") because the same video id exists across
  // editions. In the cloud doc that prefix is redundant — the doc already
  // stores activeSource — so it is stripped at write time and re-added at
  // read time. Saves ~10 bytes per completed video (up to ~16KB on the
  // largest syllabus) and keeps the doc well under Firestore's 1 MiB limit.
  const SOURCE_PREFIX_RE = /^[A-Za-z0-9_]+::/;

  function compressCompletedVideos(map) {
    const out = {};
    for (const k of Object.keys(map || {})) out[k.replace(SOURCE_PREFIX_RE, '')] = map[k];
    return out;
  }

  // Keys that already carry a prefix (legacy docs written before compression)
  // pass through untouched; unprefixed keys get the current source prefix so
  // they match the runtime video ids ("<activeSource>::" + data id).
  function rehydrateCompletedVideos(map, sourceId) {
    const prefix = (sourceId || 'marrow_8') + '::';
    const out = {};
    for (const k of Object.keys(map || {})) out[k.indexOf('::') === -1 ? prefix + k : k] = map[k];
    return out;
  }

  // Daily-history maps ("YYYY-MM-DD" → count) are only consumed for the
  // last 7/30 days (charts + aggregates) and today (per-subject queue), so
  // entries older than the retention window are pure dead weight in the
  // cloud doc. Keeps keys lexicographically >= cutoffKey (inclusive).
  function pruneHistoryMaps(dailyHistory, dailyHistoryBySubject, cutoffKey) {
    const pruneOne = (map) => {
      const out = {};
      for (const k of Object.keys(map || {})) if (k >= cutoffKey) out[k] = map[k];
      return out;
    };
    const dh = pruneOne(dailyHistory);
    const dhbs = {};
    for (const subj of Object.keys(dailyHistoryBySubject || {})) {
      dhbs[subj] = pruneOne(dailyHistoryBySubject[subj]);
    }
    return [dh, dhbs];
  }

  window.FlowMD.sync = {
    sanitizeCloudState,
    shouldApplyCloud,
    mergeLocalWins,
    mergePlansLocalWins,
    computeDirtyFields,
    compressCompletedVideos,
    rehydrateCompletedVideos,
    pruneHistoryMaps,
    KNOWN_FIELDS,
    PLAN_CLOUD_KEYS
  };
})();
