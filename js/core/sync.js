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
    'googlePhotoURL', 'updatedAt', 'lastLocalUpdate', 'fieldSyncTimes'
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
          out.themeStyle = 'modern'; // retro theme removed — always normalize
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

  // Plans merge PER PLAN ID, arbitrated by the field-level clock: the side
  // whose plans field was written later wins the per-plan VALUES of shared
  // ids, but plan ids from EITHER side always survive. Wholesale replacement
  // was the "plans got wiped" bug: a device that added Plan B lost it to a
  // device that merely edited Plan A (and vice versa). With this merge, a
  // concurrent Plan A edit on one device and a Plan B addition on the other
  // converge to BOTH plans, with the newer side's values on the shared id.
  function mergePlansByClock(cloudPlans, localPlans, cloudWinsClock) {
    const cloudArr = Array.isArray(cloudPlans) ? cloudPlans : [];
    const localArr = Array.isArray(localPlans) ? localPlans : [];
    if (cloudArr.length === 0) return localArr.slice();
    if (localArr.length === 0) return cloudArr.slice();
    const merged = localArr.map((lp) => {
      if (!lp || !lp.id) return lp;
      const cp = cloudArr.find(p => p && p.id === lp.id);
      if (!cp) return lp;
      return cloudWinsClock ? Object.assign({}, lp, cp) : Object.assign({}, cp, lp);
    });
    cloudArr.forEach((cp) => {
      if (cp && cp.id && !merged.find(p => p && p.id === cp.id)) merged.push(cp);
    });
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

  // Fields whose value is a plain map merged with local-wins (completedVideos
  // is a union: offline completions on EITHER device must survive). Everything
  // else resolves by per-field clock — the side that last wrote wins.
  const UNION_FIELDS = ['completedVideos'];

  // How far ahead a cloud field clock may be of this device's real time before
  // it is treated as clock skew (the other device's clock is set wrong). A
  // future-stamped write must never be allowed to destroy local data.
  const MAX_CLOCK_SKEW_MS = 10 * 60 * 1000;

  // "Empty" means the value carries no real user data — a fresh device's
  // defaults, an unset plan, an unconfigured goal set. An empty copy must
  // NEVER win over a richer copy, regardless of clocks: a device that seeded
  // or re-migrated an empty state must not wipe the other device's data.
  function hasRealTarget(p) {
    // ANY configured target field makes a plan real — a subject, a deadline,
    // or any pace. (Requiring subject+pace here made legit plans look "empty"
    // and let an empty device push [] over them.)
    return !!p && !!(p.targetSubject || p.targetDate || p.videosPerDay || p.videosPerWeek || p.videosPerMonth);
  }
  function isEmptyPlans(v) {
    if (!Array.isArray(v) || v.length === 0) return true;
    return !v.some(hasRealTarget);
  }
  function isEmptyGoals(v) {
    if (!isPlainObject(v)) return true;
    return !(v.targetSubject || v.videosPerDay || v.videosPerWeek || v.videosPerMonth || v.targetDate);
  }
  function isEmptyPersonal(v) {
    if (!isPlainObject(v) || Object.keys(v).length === 0) return true;
    // The untouched default profile (only the placeholder doctor name) carries
    // no real identity — treat it as empty so it can't wipe a real name.
    const keys = Object.keys(v);
    return keys.length === 1 && v.doctorName === 'Dr. Aspirant';
  }
  function isEmptyStreak(v) {
    if (!isPlainObject(v)) return true;
    return !v.lastStudyDate && !v.currentStreak;
  }
  function isEmptyValue(v) {
    if (v == null) return true;
    if (typeof v === 'string') return v === '';
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    return false; // numbers/booleans are meaningful even when 0/false
  }
  function isEmptyForField(field, v) {
    switch (field) {
      case 'plans': return isEmptyPlans(v);
      case 'goals': return isEmptyGoals(v);
      case 'personal': return isEmptyPersonal(v);
      case 'streakData': return isEmptyStreak(v);
      default: return isEmptyValue(v);
    }
  }

  // Merge a cloud doc into local state using per-field timestamps (not the
  // whole-doc updatedAt). fieldSyncTimes maps field -> ms epoch of the last
  // time that field was written. The field with the newer timestamp wins;
  // a field with NO local timestamp loses to any cloud copy (first sync).
  // completedVideos is exempted: cloud keys that local lacks are added
  // (union, local wins conflicts) so completions from either device survive.
  //
  // Data-preserving guards (these run BEFORE the clock comparison):
  //   1. An empty/partial cloud copy never replaces a non-empty local value
  //      (and vice versa — a fresh device pulls real data in), no matter how
  //      new its stamp looks.
  //   2. When BOTH sides are empty, local wins (keeps the local scaffold,
  //      e.g. the default plan, instead of an empty array).
  //   3. The default activeSource ('marrow_8') never clobbers a deliberate
  //      choice (and a deliberate choice never regresses to the default).
  //   4. A cloud clock stamped more than MAX_CLOCK_SKEW_MS in the future is
  //      clock skew — local wins instead of losing data to a wrong clock.
  function mergeCloudPerField(cloud, local, cloudSyncTimes, localSyncTimes) {
    const cloudTimes = cloudSyncTimes || {};
    const localTimes = localSyncTimes || {};
    const result = Object.assign({}, cloud);
    Object.keys(local || {}).forEach((field) => {
      const isUnion = UNION_FIELDS.indexOf(field) !== -1;
      const cloudHas = Object.prototype.hasOwnProperty.call(cloud, field);
      if (!cloudHas) { result[field] = local[field]; return; }
      if (isUnion) {
        const base = Object.assign({}, cloud[field] || {});
        Object.keys(local[field] || {}).forEach((k) => { base[k] = local[field][k]; });
        result[field] = base;
        return;
      }
      const cloudVal = cloud[field];
      const localVal = local[field];
      const cloudEmpty = isEmptyForField(field, cloudVal);
      const localEmpty = isEmptyForField(field, localVal);
      if (cloudEmpty && !localEmpty) { result[field] = localVal; return; }
      if (!cloudEmpty && localEmpty) { result[field] = cloudVal; return; }
      if (cloudEmpty && localEmpty) { result[field] = localVal; return; }
      // Neither side is empty — resolve by clock.
      const cloudT = Number(cloudTimes[field]) || 0;
      const localT = Number(localTimes[field]) || 0;
      const skewed = cloudT > Date.now() + MAX_CLOCK_SKEW_MS;
      if (field === 'activeSource' && cloudVal !== localVal) {
        // A default source must never clobber a deliberate one.
        const localDefault = localVal === 'marrow_8';
        const cloudDefault = cloudVal === 'marrow_8';
        if (localDefault !== cloudDefault) {
          result[field] = localDefault ? cloudVal : localVal;
          return;
        }
      }
      if (field === 'plans') {
        // Per-plan-id merge: no plan is ever lost; the side with the newer
        // field clock wins the values of shared plan ids.
        result[field] = mergePlansByClock(cloudVal, localVal, !skewed && cloudT > localT);
        return;
      }
      if (skewed) { result[field] = localVal; return; }
      const cloudWins = cloudT > localT;
      if (!cloudWins) result[field] = localVal;
    });
    return result;
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

  // --- Sync diagnostics (Profile panel; pure + unit-tested) ---

  // Fields shown in the sync-diagnostics table, in display order. Transient
  // and bookkeeping fields are excluded — only fields a device arbitrates.
  const DIAG_FIELDS = [
    'completedVideos', 'plans', 'activePlanId', 'goals', 'personal',
    'streakData', 'activeSource', 'themeStyle', 'isConfigured',
    'dailyHistory', 'dailyHistoryBySubject', 'googleDisplayName'
  ];

  // Compact human-readable summary of a field's value for the diagnostics row.
  function fieldSummary(field, value) {
    if (value === undefined || value === null) return '—';
    switch (field) {
      case 'completedVideos':
        return Object.keys(value).length > 0 ? Object.keys(value).length + ' completed' : 'none';
      case 'plans':
        if (!Array.isArray(value) || value.length === 0) return 'none';
        return value.map(p => (p && (p.label || p.id)) || '?').join(', ');
      case 'goals': {
        if (typeof value !== 'object') return '—';
        const parts = [];
        if (value.targetSubject) parts.push(value.targetSubject);
        if (value.videosPerDay) parts.push(value.videosPerDay + '/day');
        if (value.videosPerWeek) parts.push(value.videosPerWeek + '/week');
        if (value.videosPerMonth) parts.push(value.videosPerMonth + '/month');
        if (value.targetDate) parts.push('by ' + value.targetDate);
        return parts.length ? parts.join(' · ') : 'unset';
      }
      case 'personal':
        return (value && value.doctorName) || '—';
      case 'streakData':
        return value && value.currentStreak ? value.currentStreak + '-day streak' : 'none';
      case 'activeSource': return String(value);
      case 'activePlanId': return String(value);
      case 'themeStyle': return String(value);
      case 'isConfigured': return value ? 'configured' : 'not configured';
      case 'dailyHistory':
        return typeof value === 'object' ? Object.keys(value).length + ' day(s)' : '—';
      case 'dailyHistoryBySubject':
        return typeof value === 'object' ? Object.keys(value).length + ' subject(s)' : '—';
      case 'googleDisplayName': return String(value);
      default: return '—';
    }
  }

  // Per-field arbitration verdict: LOCAL (this device's clock is newer),
  // CLOUD (the cloud copy is newer), TIE (equal nonzero clocks), UNION
  // (completedVideos — both sides always merge), or none (no clock yet).
  function computeFieldArbitration(localTimes, cloudTimes) {
    const out = {};
    const keys = {};
    Object.keys(localTimes || {}).forEach(k => { keys[k] = 1; });
    Object.keys(cloudTimes || {}).forEach(k => { keys[k] = 1; });
    Object.keys(keys).forEach((f) => {
      const lt = Number((localTimes || {})[f]) || 0;
      const ct = Number((cloudTimes || {})[f]) || 0;
      let verdict = 'none';
      if (lt > 0 || ct > 0) {
        if (UNION_FIELDS.indexOf(f) !== -1) verdict = 'UNION';
        else if (lt > ct) verdict = 'LOCAL';
        else if (ct > lt) verdict = 'CLOUD';
        else verdict = 'TIE';
      }
      out[f] = { local: lt, cloud: ct, verdict };
    });
    return out;
  }

  // Build the diagnostics report the Profile panel renders: one row per
  // arbitrated field (clock comparison + readable value summary on both
  // sides) plus the recorded last-sync / auto-push outcomes. Pure — no DOM.
  function buildSyncDiagnostics(localState, cloudState, diagnostics) {
    const localTimes = (localState && localState.fieldSyncTimes) || {};
    const cloudTimes = (cloudState && cloudState.fieldSyncTimes) || {};
    const arbitration = computeFieldArbitration(localTimes, cloudTimes);
    const order = DIAG_FIELDS.slice();
    Object.keys(arbitration).forEach(f => { if (order.indexOf(f) === -1) order.push(f); });
    const rows = order
      .filter((f) => {
        if (arbitration[f]) return true; // has a clock on either side
        if (cloudState && Object.prototype.hasOwnProperty.call(cloudState, f)) return true;
        // Real local data with no clock yet (never synced): still show it so
        // the user sees the field exists and will sync on the next change.
        if (localState && Object.prototype.hasOwnProperty.call(localState, f)) {
          return !isEmptyForField(f, localState[f]);
        }
        return false;
      })
      .map((f) => {
        const a = arbitration[f] || { local: 0, cloud: 0, verdict: 'none' };
        // Union fields always merge both sides — even before any clock exists.
        const verdict = UNION_FIELDS.indexOf(f) !== -1 && a.verdict === 'none' ? 'UNION' : a.verdict;
        return {
          field: f,
          localClock: a.local,
          cloudClock: a.cloud,
          verdict,
          localValue: fieldSummary(f, localState && localState[f]),
          cloudValue: fieldSummary(f, cloudState && cloudState[f])
        };
      });
    return {
      rows,
      cloudPresent: !!cloudState,
      lastSync: (diagnostics && diagnostics.lastSync) || null,
      autoPush: (diagnostics && diagnostics.autoPush) || null
    };
  }

  // --- Cloud-doc completedVideos format ---

  // Video IDs in state/localStorage carry a runtime source prefix
  // ("marrow_8::anatomy__v1") because the SAME video id exists across
  // editions (both datasets share ids like anatomy__v1). The cloud doc
  // therefore stores the FULL prefixed key: stripping the prefix would
  // collide the two editions' completions into one key and re-prefixing
  // with the single activeSource would misattribute the other edition.
  // (Legacy docs written by older builds stored unprefixed keys —
  // rehydrateCompletedVideos below best-effort prefixes those on read.)
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
    mergeLocalWins,
    mergePlansLocalWins,
    mergePlansByClock,
    mergeCloudPerField,
    computeDirtyFields,
    isEmptyForField,
    rehydrateCompletedVideos,
    pruneHistoryMaps,
    computeFieldArbitration,
    buildSyncDiagnostics,
    DIAG_FIELDS,
    KNOWN_FIELDS,
    PLAN_CLOUD_KEYS,
    UNION_FIELDS,
    MAX_CLOCK_SKEW_MS
  };
})();
