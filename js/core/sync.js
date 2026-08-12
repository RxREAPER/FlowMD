/* ============================================================
   FlowMD Core — Sync Logic (pure, unit-tested)
   Cloud-state sanitization, clock-skew-safe merge arbitration,
   and field-level dirty tracking. No DOM/localStorage/state access.
   ============================================================ */
(function () {
  'use strict';

  // Per-edition state: each available study edition owns its own plans,
  // goals, daily history (charts/goal pulse), per-subject history, active
  // plan and bulk-completed chapters. The cloud doc stores these as
  // SUFFIXED fields (plans_marrow_8, plans_marrow_6_5, ...) so each edition
  // gets its own per-field clock and merges/arbitrates independently — two
  // devices working on different editions can never clobber each other.
  const EDITION_IDS = ['marrow_8', 'marrow_6_5'];
  const EDITION_BASE_FIELDS = [
    'plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject',
    'activePlanId', 'bulkCompletedChapters'
  ];

  // 'plans_marrow_8' -> { base: 'plans', src: 'marrow_8' }, else null.
  function editionFieldParts(fieldName) {
    if (typeof fieldName !== 'string') return null;
    for (const src of EDITION_IDS) {
      const suffix = '_' + src;
      if (fieldName.length > suffix.length && fieldName.slice(-suffix.length) === suffix) {
        const base = fieldName.slice(0, -suffix.length);
        if (EDITION_BASE_FIELDS.indexOf(base) !== -1) return { base, src };
      }
    }
    return null;
  }

  // All cloud field names: global fields + every edition's suffixed fields.
  function cloudFieldNames() {
    const names = GLOBAL_CLOUD_FIELDS.slice();
    EDITION_IDS.forEach((src) => {
      EDITION_BASE_FIELDS.forEach((base) => { names.push(base + '_' + src); });
    });
    return names;
  }

  // Project LOCAL state into the cloud-doc shape: global fields from the top
  // level, per-edition fields SUFFIXED from their durable slices. The merge
  // and arbitration compare this view against the cloud doc, so each edition's
  // fields carry their own suffixed clock and can never clobber the other.
  function localCloudView(st) {
    const view = {};
    GLOBAL_CLOUD_FIELDS.forEach((f) => {
      if (st[f] !== undefined) view[f] = st[f];
    });
    EDITION_IDS.forEach((src) => {
      const e = (st.editions && st.editions[src]) || {};
      EDITION_BASE_FIELDS.forEach((base) => {
        if (e[base] !== undefined) view[base + '_' + src] = e[base];
      });
    });
    return view;
  }

  // Fields shared across editions (identity, streak, completions, active
  // source pointer). completedVideos stays one map — video keys are already
  // per-edition (marrow_8:: / marrow_6_5:: prefix), so it needs no suffix.
  const GLOBAL_CLOUD_FIELDS = [
    'completedVideos', 'streakData', 'personal', 'activeSource',
    'isConfigured', 'themeStyle'
  ];

  // Fields the app knows how to consume. Anything else in a cloud doc is
  // dropped so legacy/junk fields can never corrupt in-memory state.
  // Deliberately excluded (space): speed/subjectUrgency/dailyBatch (dead,
  // never read), queueCompletedInBatch/extraBatchesCompletedToday/lastBatchDate
  // (per-day transient, recomputed by the queue engine — the queue batch
  // itself, queueBatchVideoIds, lives INSIDE plans and IS synced), lastSyncedAt
  // (never read — updatedAt is the merge clock). Legacy FLAT per-edition
  // field names (plans, goals, dailyHistory, ...) are kept so pre-v215 cloud
  // docs still parse; they are mapped into the suffixed fields by
  // rehydrateLegacyEditionFields.
  const KNOWN_FIELDS = (function () {
    const names = [
      'completedVideos', 'streakData', 'personal', 'activeSource',
      'isConfigured', 'themeStyle', 'googleDisplayName', 'googlePhotoURL',
      'updatedAt', 'lastLocalUpdate', 'fieldSyncTimes',
      // legacy flat per-edition fields (pre-v215 docs)
      'plans', 'goals', 'dailyHistory', 'dailyHistoryBySubject',
      'activePlanId', 'bulkCompletedChapters'
    ];
    EDITION_IDS.forEach((src) => {
      EDITION_BASE_FIELDS.forEach((base) => { names.push(base + '_' + src); });
    });
    return names;
  })();

  // Fields a plan keeps in the cloud doc. queueBatchVideoIds (the current
  // daily-quest batch) IS synced so every device of a user shows the exact
  // same videos — a fresh device pulls the batch instead of computing the
  // next N uncompleted videos. Only the per-day transient counters stay
  // device-local (queueCompletedInBatch, extraBatchesCompletedToday,
  // lastBatchDate): they are recomputed by the queue engine per day and
  // telling another device about them changes nothing.
  const PLAN_CLOUD_KEYS = [
    'id', 'label', 'accentColor', 'targetSubject', 'targetDate',
    'videosPerDay', 'videosPerWeek', 'videosPerMonth',
    'dailyTargetHours', 'targetUnits', 'queueBatchVideoIds'
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
      // Suffixed per-edition fields (plans_marrow_8, dailyHistory_marrow_6_5,
      // ...) are validated by their BASE field type, written under the suffixed
      // key so each edition keeps its own entry.
      const edPart = editionFieldParts(key);
      if (edPart) {
        const cleaned = sanitizeFieldValue(edPart.base, v);
        if (cleaned !== undefined) out[key] = cleaned;
        continue;
      }
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
        case 'goals':
        case 'dailyHistory':
        case 'dailyHistoryBySubject':
        case 'activePlanId':
        case 'bulkCompletedChapters':
          // Legacy FLAT per-edition fields (pre-v215 docs). Kept so old docs
          // parse; rehydrateLegacyEditionFields maps them into the suffixed
          // fields on read. Never written by this build.
          {
            const cleaned = sanitizeFieldValue(key, v);
            if (cleaned !== undefined) out[key] = cleaned;
          }
          break;
        case 'activeSource':
          if (KNOWN_SOURCES.indexOf(v) !== -1) out.activeSource = v;
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

  // Validate + clean one field VALUE by its base type (used for both suffixed
  // per-edition fields and the legacy flat names). Returns undefined when the
  // value is malformed (dropped), else the cleaned value.
  function sanitizeFieldValue(base, v) {
    switch (base) {
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
          if (ok && cleanPlans.length === v.length) return cleanPlans;
        }
        return undefined;
      case 'activePlanId':
        if (typeof v === 'string' && v.length <= 64) return v;
        return undefined;
      case 'goals':
      case 'dailyHistory':
      case 'dailyHistoryBySubject':
      case 'bulkCompletedChapters':
        return isPlainObject(v) ? v : undefined;
      default:
        return v;
    }
  }

  // Legacy cloud docs (pre-v215) stored the per-edition fields FLAT (plans,
  // goals, dailyHistory, ...). On read, map them into the suffixed field for
  // the device's ACTIVE edition so old data lands in the right partition, and
  // drop the flat keys (this build never writes them).
  function rehydrateLegacyEditionFields(clean, activeSource) {
    if (!isPlainObject(clean)) return clean;
    const src = EDITION_IDS.indexOf(activeSource) !== -1 ? activeSource : 'marrow_8';
    EDITION_BASE_FIELDS.forEach((base) => {
      const suffixed = base + '_' + src;
      // Only map when the suffixed key is absent — a suffixed value already
      // present (this build) always wins over the legacy flat copy.
      if (clean[base] !== undefined && clean[suffixed] === undefined) {
        clean[suffixed] = clean[base];
      }
      delete clean[base];
    });
    return clean;
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
    // Suffixed per-edition fields (plans_marrow_8, goals_marrow_6_5) are
    // judged by their base type — an unset plan in Edition 6.5 must count
    // as empty exactly like an unset plan anywhere else.
    const base = (editionFieldParts(field) || {}).base || field;
    switch (base) {
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
      if (field === 'activeSource') {
        // The viewing edition is a DEVICE preference: a device that already
        // has real data (any edition slice configured) keeps its own view — a
        // pull must never yank it to another edition's dataset. Only a truly
        // fresh device (no real data in ANY edition) adopts the cloud's
        // choice, and a default source still never clobbers a deliberate one.
        let localHasRealData = false;
        // activePlanId is excluded: a fresh device's scaffold always carries
        // 'plan_a', so it can't signal real per-edition configuration. The
        // other bases judge via isEmptyForField (the default plan has no real
        // target, DEFAULT_GOALS is all-empty, history maps start {}).
        const REAL_DATA_BASES = ['plans', 'goals', 'dailyHistory',
          'dailyHistoryBySubject', 'bulkCompletedChapters'];
        EDITION_IDS.forEach((src) => {
          REAL_DATA_BASES.forEach((base) => {
            const v = local[base + '_' + src];
            if (v !== undefined && !isEmptyForField(base, v)) localHasRealData = true;
          });
        });
        if (localHasRealData) {
          result[field] = localVal;
          return;
        }
        // A truly fresh device adopts the cloud's choice — but only when the
        // edition it points at actually carries data. activeSource is a
        // last-writer value: a data-less device that switched editions (or a
        // legacy doc) can leave it pointing at an EMPTY partition, and a fresh
        // device would then open into an empty edition while the user's data
        // lives in the other one. Redirect to the edition that has the data —
        // even when both sides carry the same default value (cloud = local =
        // 'marrow_8' with the data sitting in 6.5).
        const cloudChoiceHasData = (function () {
          for (const src of EDITION_IDS) {
            if (src !== cloudVal) continue;
            for (const base of REAL_DATA_BASES) {
              const v = cloud[base + '_' + src];
              if (v !== undefined && !isEmptyForField(base, v)) return true;
            }
          }
          return false;
        })();
        if (!cloudChoiceHasData) {
          let dataEdition = null;
          EDITION_IDS.forEach((src) => {
            REAL_DATA_BASES.forEach((base) => {
              if (dataEdition === null && cloud[base + '_' + src] !== undefined &&
                  !isEmptyForField(base, cloud[base + '_' + src])) {
                dataEdition = src;
              }
            });
          });
          if (dataEdition !== null) {
            result[field] = dataEdition;
            return;
          }
        }
        // Different values: a default source never clobbers a deliberate
        // choice (and vice versa). Equal values fall through to the clock
        // resolution below — a fresh device has no local clock, so the cloud
        // value (identical anyway) wins.
        if (cloudVal !== localVal) {
          const localDefault = localVal === 'marrow_8';
          const cloudDefault = cloudVal === 'marrow_8';
          if (localDefault !== cloudDefault) {
            result[field] = localDefault ? cloudVal : localVal;
            return;
          }
        }
      }
      if (field === 'plans' || (editionFieldParts(field) || {}).base === 'plans') {
        // Per-plan-id merge (flat legacy field or any suffixed per-edition
        // plans_X): no plan is ever lost; the side with the newer field clock
        // wins the values of shared plan ids.
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
  // Per-edition fields appear once per edition (suffixed) so the panel shows
  // both partitions, each with its own clock/verdict.
  const DIAG_FIELDS = (function () {
    const names = ['completedVideos'];
    EDITION_IDS.forEach((src) => {
      EDITION_BASE_FIELDS.forEach((base) => { names.push(base + '_' + src); });
    });
    names.push('personal', 'streakData', 'activeSource', 'themeStyle',
      'isConfigured', 'googleDisplayName');
    return names;
  })();

  // Compact human-readable summary of a field's value for the diagnostics row.
  function fieldSummary(field, value) {
    if (value === undefined || value === null) return '—';
    // Suffixed per-edition fields summarize by their base type; the edition
    // shows in the field label (plans_marrow_8 → "Plans · Edition 8").
    const edPart = editionFieldParts(field);
    const base = edPart ? edPart.base : field;
    switch (base) {
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
      case 'bulkCompletedChapters':
        return typeof value === 'object' ? Object.keys(value).length + ' chapter(s)' : '—';
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
    sanitizeFieldValue,
    mergeLocalWins,
    mergePlansLocalWins,
    mergePlansByClock,
    mergeCloudPerField,
    computeDirtyFields,
    isEmptyForField,
    rehydrateCompletedVideos,
    rehydrateLegacyEditionFields,
    pruneHistoryMaps,
    computeFieldArbitration,
    buildSyncDiagnostics,
    editionFieldParts,
    cloudFieldNames,
    localCloudView,
    DIAG_FIELDS,
    KNOWN_FIELDS,
    PLAN_CLOUD_KEYS,
    UNION_FIELDS,
    EDITION_IDS,
    EDITION_BASE_FIELDS,
    GLOBAL_CLOUD_FIELDS,
    MAX_CLOCK_SKEW_MS
  };
})();
