# Phase 2-3: Offline PWA + Real-Time Sync Plan

## Current State
- Phase 2 completed (basic SW, 58/58 tests green)
- Phase 3 completed (schema versioning, day boundary fix)
- Offline: SW caches same-origin assets, but Firebase SDKs are cross-origin → fails on first offline visit
- Sync: 800ms debounced push, no real-time listeners, payload incomplete (7/15+ state keys)

## Goals
1. **Offline PWA**: SW caches Firebase SDKs + offline fallback page + indicator
2. **Real-time Sync**: onSnapshot listener + full payload + manual sync button + conflict resolution

## Architecture

### Offline Improvements (Free Tier)
| Component | File | Change |
|-----------|------|--------|
| SW Assets | `sw.js` | Add Firebase SDK URLs (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`) |
| Offline Fallback | `offline.html` | New file: cached fallback page with "You're offline" message |
| Offline UI | `app.js` | Add `isOffline` state flag + indicator toast/icon in topbar |

### Real-Time Sync Improvements (Free Tier)
| Component | File | Change |
|-----------|------|--------|
| Payload Expansion | `firebase.js` | Add `plans`, `dailyHistoryBySubject`, `queueBatchVideoIds`, `queueCompletedInBatch`, `activeSource`, `isConfigured`, `themeStyle` to `syncToCloud`/`loadFromCloud` |
| Real-Time Listener | `firebase.js` | Add `onSnapshot` listener on `users/{uid}` doc |
| Conflict Resolution | `app.js` + `firebase.js` | Timestamp-based last-write-wins (existing `lastSyncedAt` + new `updatedAt` field) |
| Manual Sync | `app.js` + `index.html` | Add "Sync Now" button in topbar + status toast |

## Tasks

### Task 1: SW Cache Firebase SDKs
- Update `sw.js` ASSETS array with Firebase CDN URLs
- Add `fetch` handler for cross-origin Firebase requests

### Task 2: Offline Fallback Page
- Create `offline.html` with "You're offline" UI
- SW returns cached `offline.html` when fetch fails

### Task 3: Offline Indicator UI
- Add `isOffline` to state (default false)
- In `initFirebaseSync()`: set `isOffline = false` on auth change
- In `fetch` handler: catch errors, set `isOffline = true`
- Show offline toast in topbar

### Task 4: Expand Sync Payload
- Add missing keys to `syncToCloud` payload (firebase.js)
- Update `loadFromCloud` to merge all new keys

### Task 5: Real-Time onSnapshot Listener
- Add listener in `initFirebaseSync()`
- On snapshot, merge cloud → local with local winning
- Debounce save to localStorage

### Task 6: Manual Sync Button
- Add sync icon button in topbar (index.html)
- Add `manualSync()` function (app.js)
- Show status toast on success/fail

### Task 7: Timestamp-Based Conflict Resolution
- Add `updatedAt` field to sync payload
- On load: compare timestamps, keep newer
- Preserve offline edits if timestamps equal

## Files to Modify

| File | Lines to Add/Change |
|------|---------------------|
| `sw.js` | ASSETS, fetch handler |
| `offline.html` | **NEW** |
| `index.html` | Sync button |
| `app.js` | isOffline state, manualSync(), offline indicator |
| `firebase.js` | Full payload, onSnapshot listener, updatedAt |

## Test Cases

| Test | Expected |
|------|----------|
| First visit offline | `offline.html` displayed |
| First visit online, then offline | App loads from SW cache |
| Sign in → make changes on Device A | Device B sees changes within ~1s (onSnapshot) |
| Sign in on Device B, then offline changes on A | Local wins on conflict |
| Manual sync button clicked | Toast shows "Synced successfully" |

## Free Tier Verification

| Product | Free Limit | Your Usage | Status |
|---------|------------|------------|--------|
| Auth | Unlimited | Google Sign-In | ✅ |
| Firestore reads | 50K/day | ~100/day | ✅ |
| Firestore writes | 20K/day | ~50/day | ✅ |
| Hosting | 10GB/360MB/day | ~2MB/10KB | ✅ |
| PWA offline | Client-side | SW only | ✅ |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Firebase SDK size increase (~150KB) | SW caches once; users accept PWA install |
| Concurrent edit conflict | Timestamp-based resolution |
| onSnapshot quota | ~100/day users × ~1 listener = ~100 reads | ✅ |

## Rollback Plan

- Tag current state before commit
- Revert `sw.js`, `firebase.js`, `app.js`, `index.html`
- 3 backup refs already exist

## Timeline Estimate
- SW + offline.html: 30 min
- Payload expansion: 15 min
- onSnapshot listener: 20 min
- Manual sync + UI: 20 min
- Conflict resolution: 15 min
- QA: 30 min

**Total: ~2.5 hours**
