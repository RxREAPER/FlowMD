# Concerns & Risks

1. **Monolith fragility**: Entire app logic in one 4,028-line IIFE — impossible to unit test, hard to debug, merge conflict magnet.

2. **No testing**: Zero test coverage for state management, queue engine, cloud sync, or rendering logic.

3. **State sync race conditions**: `saveState()` fires both localStorage writes and debounced Firestore sync. No locking — concurrent mutations could lose data.

4. **Expired data handling**: No migration strategy for localStorage schema changes. Old keys silently break or produce undefined behavior.

5. **Firebase compat SDK**: Using the older compat SDK (`firebase` global) which is deprecated in favor of modular v9+.

6. **Cache invalidation**: Manual `?v=N` bumping — easy to forget, stale caches cause user-facing bugs.

7. **No error boundaries**: Any runtime exception in a render function can leave the UI in a broken state with no recovery.
