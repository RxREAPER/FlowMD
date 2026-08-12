# Phase 8: Per-Edition State Partitions (Edition 8 / Edition 6.5)

## 1. Audit findings — why switching edition "does nothing"

The app has **one global `state` object**. Only ONE piece of it is truly per-edition today:

| State field | Scope today | Effect on edition switch |
|---|---|---|
| `completedVideos` | **Per-edition** (keys prefixed `marrow_8::` / `marrow_6_5::`) | Checkmarks correctly follow the edition |
| `plans` (Plan A/B: subject, deadline, daily/weekly/monthly paces) | **Shared** | Quest subject/pace/deadline stay identical |
| `goals` (legacy mirror) | **Shared** | Unchanged |
| `dailyHistory` (date → count, powers 7/30-day graph + goal pulse) | **Shared** | Graph and goal pulse stay identical |
| `dailyHistoryBySubject` | **Shared** | Unchanged |
| `streakData` | **Shared** | Unchanged |
| `activePlanId` | **Shared** | Unchanged |
| `bulkCompletedChapters` | **Shared, keyed `subjectId::chapterName` with NO source prefix** | **Collides across editions** — bulk-completing "Anatomy → Cell Biology" in Edition 8 marks it done in Edition 6.5 too |

Because the daily-quest engine (`getTodayQueueForPlan` in `metrics.js`) and analytics (`analytics.js` Goal Pulse + Execution Chart) read `state.plans` + `state.dailyHistory` — both shared — switching editions changes the dataset and the checkmarks, but the quests, targets, deadline, and every graph look identical. That's exactly the behavior the user is reporting.

## 2. Goal

Every user-facing input and analytics data point exists in **two independent variations** — Edition 8 and Edition 6.5 — each fully functional and each syncing to the cloud without clobbering the other:

- daily quests (subject, pace, per-day queue)
- selected plan (Plan A/B) + active plan
- selected subject, deadline
- daily / weekly / monthly goals
- goal pulse data, 7/30-day graph data, per-subject counts
- bulk chapter completion
- cloud sync: editing Edition 8 on one device must never affect Edition 6.5 on another

## 3. Design

### 3.1 In-memory model: durable per-edition slices + live working copy

```js
state.activeSource          // unchanged — picks the active edition
state.editions = {
  marrow_8:  { plans, goals, dailyHistory, dailyHistoryBySubject, activePlanId, bulkCompletedChapters },
  marrow_6_5:{ plans, goals, dailyHistory, dailyHistoryBySubject, activePlanId, bulkCompletedChapters }
}
```

- `state.plans`, `state.goals`, `state.dailyHistory`, `state.dailyHistoryBySubject`, `state.activePlanId`, `state.bulkCompletedChapters` **stay as the live working copy of `editions[activeSource]`** — so the ~10 view/metric modules that read/write these top-level fields keep working unchanged.
- **Flush rule:** every `saveState()` first flushes the live fields into `editions[activeSource]`, then persists the whole `editions` map. Mutations are always followed by `saveState()` today (dashboard checkboxes, plan-config, queue engine), so this is safe.
- **Switch rule (`source-settings.js`):** on switch — flush live → `editions[oldSource]`, load `editions[newSource]` into the live fields, set `activeSource`, reset per-plan queue bookkeeping (`queueBatchVideoIds`/`queueCompletedInBatch`). No plan/quest/history data is lost or copied across editions.

### 3.2 Cloud sync: per-edition suffixed fields (reuses ALL existing arbitration)

Firestore doc fields become edition-suffixed so each edition has its **own per-field clock** (`fieldSyncTimes`) and merges independently:

```
plans_marrow_8          plans_marrow_6_5
goals_marrow_8          goals_marrow_6_5
dailyHistory_marrow_8   dailyHistory_marrow_6_5
dailyHistoryBySubject_marrow_8   dailyHistoryBySubject_marrow_6_5
activePlanId_marrow_8   activePlanId_marrow_6_5
bulkCompletedChapters_marrow_8   bulkCompletedChapters_marrow_6_5
```

- `completedVideos` — unchanged (already namespaced, stays a UNION field).
- `streakData`, `personal`, `themeStyle`, `isConfigured`, `activeSource` — **global**, not edition-scoped.
- The existing per-field newest-wins merge, dirty-field tracking, push guard, and diagnostics all work unchanged — they're field-name generic. Only `KNOWN_FIELDS`, `sanitizeCloudState`, `isEmptyForField` (suffix-stripping), `CLOUD_STATE_FIELDS`, and the push/map step in `sync.js`/`state-store.js` need the suffixed names.
- Two devices on different editions can never fight: their writes go to disjoint fields.

### 3.3 Migration

- **localStorage (schema v3 → v4):** first load after upgrade seeds `editions[activeSource]` from the existing flat fields; the *other* edition starts with `DEFAULT_PLAN`-based unset state. No data loss.
- **Cloud docs (legacy flat fields):** `fetchCloudState` rehydrates legacy `plans`/`goals`/`dailyHistory`/`dailyHistoryBySubject`/`activePlanId`/`bulkCompletedChapters` into the `…_<activeSource>` suffixed fields on first read — same pattern as the existing `rehydrateCompletedVideos`.

### 3.4 UI

- Existing "No study target set yet" empty state already handles a fresh edition (unset plan) — no new screen needed.
- Edition chip already exists on dashboard/analytics. The switch modal gains a short per-edition summary line (e.g. "Edition 8: Anatomy, 3/day, by 30 Jun" / "Edition 6.5: not set") so it's obvious each edition is independent.

## 4. Files to change

| File | Change |
|---|---|
| `js/core/constants.js` | `SCHEMA_VERSION` 3→4; new `STORAGE_KEYS.EDITIONS`; (suffix helpers) |
| `js/core/state-store.js` | `state.editions` init + load/save + flush-on-save; v4 migration; `CLOUD_STATE_FIELDS` suffixed |
| `js/features/source-settings.js` | switch = swap slices (flush + load + reset queue); modal per-edition summary |
| `js/core/sync.js` | `KNOWN_FIELDS` + sanitize + `isEmptyForField` for suffixed fields; bulk keys source-prefixed |
| `js/features/sync.js` | `fetchCloudState` legacy rehydration; `CLOUD_FIELDS` list; diagnostics rows |
| `js/core/metrics.js` | verify queue engine reads live fields (no change expected) |
| `js/features/views/analytics.js`, `dashboard.js`, `study-plan-config.js`, `subject-detail.js` | verify reads; fix `bulkCompletedChapters` key usage (source-prefixed) |
| `tests/unit/store.test.mjs`, `migration.mjs`, `sync-matrix.test.mjs`, `sync-twodevice.test.mjs`, `smoke.mjs` | see §6 |

## 5. Decisions to confirm before implementation

1. **First switch to a fresh edition:** start **unset** (recommended — true independence, matches the app's "no assumed goals" philosophy) vs. copy the current edition's setup as a starting point.
2. **Streak:** keep **global** (recommended — a streak is about studying at all, not which edition) vs. per-edition streaks.
3. **Bulk chapter completion:** fold into per-edition state (recommended — it currently collides across editions) vs. leave shared/global.

## 6. Tests

- **Migration:** flat v3 profile → v4 editions (both editions present, active edition carries data, other is unset). Cloud legacy doc → suffixed fields.
- **Source-switch preservation (the core regression):** configure Edition 8 (Plan A: Anatomy, 3/day, deadline), switch → configure Edition 6.5 (Physiology, 2/day), switch back → Edition 8 shows its own plan/quests/history, then back to 6.5 → its own. Nothing crosses over.
- **Analytics per-edition:** complete a video in Edition 8 → graph/goal-pulse move in Edition 8 only; Edition 6.5 graph untouched.
- **Sync matrix:** two devices on the SAME edition converge (existing behavior); two devices on DIFFERENT editions edit simultaneously → both editions' data survive on both devices.
- **Bulk completion:** bulk-complete a chapter in Edition 8 → does NOT mark it done in Edition 6.5.
- Full suite must stay green (11 suites, 53 unit).

## 7. Rollout

- Implement on a branch (`feat/per-edition-state`), bump cache version, full `npm test`, deploy hosting + firestore rules (`npm run deploy:firebase`). No Firestore rules change needed.
