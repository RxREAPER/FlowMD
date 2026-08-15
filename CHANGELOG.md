# FlowMD — Change Log

## [2026-08-15] TWA Android shell: assetlinks + offline-first closed-beta copy (v227)

- **Digital Asset Links for the Android TWA:** the site now serves the real file at `/.well-known/assetlinks.json`, tying `com.flowmd.app` + the release signing cert to flowmd-04.web.app. The hosting ignore glob changed from `**/.*` to `**/.[!w]*` so the dot-directory deploys while other hidden entries stay out (an earlier rewrite attempt served an empty `[]` from Firebase — replaced with the canonical file). This is the trust handshake that lets the TWA APK run full-screen without a URL bar.
- **Landing page Android section updated** for the TWA — positioned as an *optional early beta* (moved below About, out of the nav), not a main feature: the web app stays the primary experience. The APK is a full-Chrome shell, so offline-first works inside it and every web deploy reaches phones automatically — no reinstall, ever.

## [2026-08-15] Capacitor-native Android shell + landing closed-beta section (v226)

- **The install helper now recognizes the Capacitor Android shell.** Inside the APK, the WebView never fires `beforeinstallprompt` and never reports `display-mode: standalone`, so the app previously thought it wasn't installed and popped the "Add to Home Screen" modal on first open. The app now treats a Capacitor runtime (`window.Capacitor.isNativePlatform()`) as installed: the first-visit modal and install banner never show, and Profile displays the installed state.
- **Landing page: new "Android — closed beta" section** advertising the native Android APK. Request access via a direct email link to the developer (opt-in, manual invite — the APK isn't on any store), plus a new FAQ entry covering the Android app and how updates reach the APK automatically.
- Tests: smoke asserts a Capacitor-simulated shell reports installed, suppresses the install modal, and shows the installed state in Profile; landing-smoke updated for the new section.

## [2026-08-15] First-visit install modal — auto-shown install popup (v224)

- **The first-visit install helper is now a modal popup.** On the first dashboard render after onboarding, an overlay auto-shows (once per tab session) with a native **Install** button when the browser is installable (Android Chrome / desktop, via the captured `beforeinstallprompt`) or step-by-step **Add to Home Screen** help (iOS Safari / non-installable). It never pops over the onboarding wizard, shows at most once per tab session (sessionStorage), and stays dismissed permanently once the user dismisses it or installs (localStorage). Clicking the backdrop also dismisses.
- **In-place upgrade preserved:** when `beforeinstallprompt` fires mid-session (e.g., while the user has the subject dropdown open), the open modal patches to the installable variant instead of re-rendering the view — the open `<select>` survives (existing regression guard).
- The old inline dashboard banner card is removed; Profile keeps the brief install guide + button.
- Profile legal links moved to a `.profile-legal-links` CSS class (inline-styles test).
- Tests: smoke asserts the modal auto-shows and upgrades in place; render/navigation dismiss it through the app API before interaction. Cache-busted to v224.

## [2026-08-14] Google sign-in fixed for installed PWAs — popup → redirect flow (v219)

- **Root cause (confirmed by live reproduction):** sign-in used `signInWithPopup`, which browsers close/block inside installed standalone PWAs mid-handshake → `auth/popup-closed-by-user` → the generic "Sign in failed." toast. On the web the popup sometimes survived the race, which is why retries occasionally worked.
- **Fix:** `firebase.js` now uses `signInWithRedirect` + `getRedirectResult()` resolved on every boot (`js/features/sync.js`), so sign-in works reliably in standalone/installed contexts. Onboarding persists its wizard state across the redirect round-trip and resumes where it left off.
- **Fix:** `sw.js` serves the Firebase SDKs NETWORK-first (the precached opaque copy is now only the offline fallback) — previously the auth SDK was always served from a stale cache copy, even online.
- **Fix:** sign-in errors are no longer swallowed — `profile.js` shows the real Firebase message, and the button disables during the redirect.
- Cache-busted to v219.

## [2026-08-14] Fresh devices land where the data is — data-aware activeSource adoption + production-faithful profile defaults (v218)

- **A fresh device no longer opens into an empty edition.** The cloud `activeSource` is a last-writer value: a data-less device that merely switched editions could leave it pointing at an EMPTY partition, and a brand-new device would then pull the app onto that empty edition while the user's real plans/goals/history sit in the other one. The merge (`js/core/sync.js`) now redirects a fresh device to the edition that actually carries data when the cloud's choice is empty-of-data — including the case where cloud and local both carry the default `marrow_8` — while a deliberate, data-backed cloud choice (and any device's own configured view) is still respected. It stays write-quiescent: the redirected view is never re-asserted.
- **Doctor-name behavior is production-faithful and now proven by tests.** The app ships the default profile `Dr. Aspirant` and the merge treats exactly that as EMPTY, so a fresh device adopts the user's real synced name and a real local name is never clobbered by a default. The two-device sync harness previously gave each device a fake `'Dr. A'/'Dr. B'` default — which the merge treated as REAL data, so device defaults could race each other and hide the actual production behavior. The harness now defaults to `'Dr. Aspirant'` like production, and new tests lock in: fresh device adopts the real name, empty cloud profile never wipes a real local name, fresh device lands on the data edition (end-to-end zero-write settle).
- New tests: 4 pure-merge cases in `tests/unit/sync.test.mjs` (data-aware redirect ×3 + profile guard) and 1 end-to-end three-device case in `tests/unit/sync-twodevice.test.mjs` (A configures Edition 8, a data-less B switches to 6.5 and becomes the doc's last writer, fresh C lands on Edition 8 with the real profile — zero writes after settling).
- Unit suite 65/65; full suite green (104/19/43/40/23/7/44 + 65 unit). Cache-busted to v218.

## [2026-08-13] Daily quests identical on every device — quest batch synced, write echoes eliminated (v217)

- **The daily quest now shows the EXACT same videos on every device of a user.** `queueBatchVideoIds` (the current quest batch) was device-local by design — stripped from `PLAN_CLOUD_KEYS` before every cloud write — so a fresh device that never opened the quest computed the *next* N uncompleted videos (3-6) while the device that materialized the batch showed 1-4. It is now a synced plan key (`js/core/sync.js`): the batch travels with the plan through sanitize/strip/merge and the cloud doc, and the queue engine keeps whatever batch it finds in the plan. A fresh device pulls the plan → pulls the same batch → identical quests.
- **Two known write echoes are gone.** (1) The plans field used to re-push identical stripped values every couple of syncs while a batch existed: the manualSync push phase compared the FULL local plan (carrying per-day counters `lastBatchDate` / `extraBatchesCompletedToday` / `queueCompletedInBatch`) against the stripped cloud copy, so it never looked in sync. It now compares the cloud shape of the local plan (`js/features/sync.js`). (2) Devices sitting on different editions re-asserted their `activeSource` preference to the doc every couple of rounds because the merge bumped the local clock past the cloud's; the preference-keep now pins the local clock AT the cloud's, so only genuine source switches push.
- **The completedVideos union push is diff-based**: manual syncs previously rewrote the whole map; only keys this device actually changes go up (per-key FieldPath merge unchanged, cloud-only keys never touched). Settled devices are now fully write-quiescent.
- **The queue engine treats the shared batch as authoritative** (`metrics.js`): it regenerates only when the batch is empty or LARGER than the target pace, never when it is smaller. That closes the last cross-device divergence — the extra-video flow ("Load Next Video", 1-at-a-time). Without it, A advancing to a 1-video batch while B (extra counter still 0) targets 4 would make B regrow a 4-batch on every render, and A would shrink it back — a write ping-pong between the two devices.
- **Verified in `tests/unit/sync-quest.test.mjs`** (real queue engine in the two-device harness): A ticks 2 of 4 → B shows the same 4 with 2 ticked/2 unticked; a FRESH device that never opened the quest shows the same 1-4 with 2 ticked (not 3-6), and a tick on it reflects identically on A; a second round converges without losing ticks; and the extra-video advance keeps both devices on the same 1-at-a-time batch with a zero-write settle (a tick on the extra video reflects across too). The cloud plan carries `queueBatchVideoIds`; the settle rounds assert ZERO writes. `tests/unit/sync-twodevice.test.mjs` gains a different-editions activeSource test that also asserts zero writes after settling.
- Unit suite 60/60; full suite green (104/19/43/40/23/7/44 + 60 unit). Cache-busted to v217.

## [2026-08-13] UX simplification — dual-plan source summary, redesigned curriculum legend, basic sync status, device layout check removed (v217)

- **Source-switch modal now summarises BOTH plans** (`source-settings.js`). The per-edition config summary previously showed only Plan A (`e.plans[0]`); it now folds every configured plan into one line as **Subject A + Subject B · combined/day · by earliest-deadline** (e.g. "Otorhinolaryngology (ENT) + Anaesthesia · 6/day · by 2026-08-21"). Unconfigured plans are ignored, and an edition with nothing set still shows "Not set yet".
- **Curriculum note redesigned** (`views/curriculum.js` + new `.curriculum-legend-*` styles). The old wall-of-text notice is now a two-row legend card: a green row for **Individual video tick → Counts** (7-day chart, weekly pace, daily counts) and an amber row for **Chapter "Select All" → Excluded** (mark previously finished chapters without skewing analytics), each with an icon chip and a status badge. Inline styles replaced with real CSS classes.
- **Sync Diagnostics panel removed** (`views/profile.js` + `.sync-diag-*` CSS deleted). The per-field local-vs-cloud clock table with LOCAL/CLOUD/TIE/UNION badges was too technical for everyday users. It's replaced by a single human-readable status line (`sync-basic-status`): "Last synced 2m ago — everything is backed up." (green), a failed-sync message (red), or an auto-save warning (amber). The internal recording (`recordSyncResult` / `recordAutoPushResult`) and the pure arbitration helpers in `js/core/sync.js` (still unit-tested) are kept.
- **Device Layout Check removed** — it was an in-browser dev aid useless on an installed Android app. The Profile card, the post-render `runLayoutCheck` hook in `app.js`, the two `<script>` tags in `index.html`, and the module files `js/core/layout-check.js` / `js/features/layout-check.js` are deleted; `tests/unit/layout-check.test.mjs` and its harness registration are gone. The cross-viewport Playwright guards in `tests/render.mjs` / `tests/smoke.mjs` are untouched — they run in CI, not on-device.
- **Tests**: smoke suite updated — 6 diagnostics/layout checks replaced by 4 (simple last-sync status renders when signed in; no diagnostics table; no Device Layout Check card; source modal shows "Anatomy + Physiology" for a dual-plan profile). Full suite green: 104/19/43/40/23/7/44 + 54 unit.
- Cache-busted to v217.

## [2026-08-13] Firestore rules fixed — cloud sync was silently denied for every write since v207 (hotfix, no version bump)

- **Critical bug found during the emulator test build-out**: `firestore.rules` still REQUIRED the legacy FLAT fields (`d.plans is list`, `d.dailyHistory is map`, `d.dailyHistoryBySubject is map`, `d.queueBatchVideoIds is list`, ...) — but no payload since v207 (`efcc654`, "slim the Firestore doc") writes `queueBatchVideoIds`, and v215's per-edition fields are SUFFIXED (`plans_marrow_8`, `dailyHistory_marrow_6_5`, ...) with no flat equivalents at all. Every `syncToCloud` / `updateCloudFields` write therefore evaluated `validWrite()` to false and was rejected with PERMISSION_DENIED — **cloud backup/restore was silently broken for all users since the v207-era slim** (loads still worked, so the app appeared fine).
- **Root cause of the blind spot**: `tests/rules-test.mjs` validates the rules against the Firestore emulator, which needs Java — a JVM was never on this machine, so the suite never ran and the drift went unnoticed.
- **Fixed**: `validWrite()` now checks the v215 schema — per-edition SUFFIXED fields (`plans_*`, `goals_*`, `dailyHistory_*`, `dailyHistoryBySubject_*`, `activePlanId_*`, `bulkCompletedChapters_*`) with per-edition type/size caps, `activeSource`/`themeStyle`/`isConfigured`/`completedVideos` unchanged, and the legacy FLAT fields demoted to OPTIONAL guards so pre-v215 docs keep validating. No flat field is required anymore.
- **Verified against the emulator** (13/13 checks): v215 self-write allowed, legacy flat-field docs still create/update, oversized per-edition plans denied, unknown source denied, cross-user denied, self-delete allowed. Proof-of-bug: the OLD rules reject the exact v215 payload (PERMISSION_DENIED), the new rules accept it.
- **Live-verified against production**: a v215-shaped document was written to a real throwaway user's Firestore doc under the deployed rules — accepted (previously denied). The throwaway doc is harmless test data (plan_a / one completion); can be cleaned from the Firebase console.
- **Tooling**: `npm run test:rules` boots the Firestore emulator and runs the rules test; it auto-locates the workspace JRE (`.tools/jdk-*`) or falls back to JAVA_HOME. `@firebase/rules-unit-testing` was already a devDependency (now actually installed).
- Deployed to production via `firebase deploy --only firestore:rules` (no app code change, no version bump).

## [2026-08-13] Per-edition state partitions — each edition owns its plans, goals, quests & analytics (v215)

- **The real fix for "switching edition changes nothing":** previously the app had ONE global `state` object — only `completedVideos` was actually per-edition (video IDs are prefixed `marrow_8::` / `marrow_6_5::`). Plans, goals, daily history (graph + goal pulse), per-subject counts, active plan and bulk-completed chapters were shared, so switching editions changed only the dataset and the checkmarks; daily quests, targets, deadlines and every graph looked identical.
- **Now** `state.editions = { marrow_8: {...}, marrow_6_5: {...} }` — each edition owns its own plans, goals, daily history (Goal Pulse / analytics graphs), per-subject history, active plan and bulk-completed chapters. The existing top-level fields stay as the live working copy of the ACTIVE edition (views unchanged); every `saveState()` flushes live → active slice; `switchSource()` swaps slices with zero data loss. A never-configured edition starts unset (the app waits for input, matching its no-assumed-goals philosophy); streak stays global.
- **Cloud sync is now per-edition.** Firestore fields are suffixed (`plans_marrow_8`, `plans_marrow_6_5`, `dailyHistory_marrow_8`, …) with their own per-field clocks, reusing the existing arbitration machinery — two devices on different editions can never clobber each other, and devices converge per-edition. Legacy flat cloud docs (pre-v215) are rehydrated into the edition they name on first read; localStorage schema migrated v3→v4 (existing data folds into the active edition, other edition unset).
- **Bonus bug fixed:** `bulkCompletedChapters` was keyed `subjectId::chapterName` with no source prefix — bulk-completing a chapter in Edition 8 marked it done in Edition 6.5. It's now inside the per-edition partition (isolated) and syncs as `bulkCompletedChapters_*`.
- **Source-switch modal** now shows a one-line config summary per edition (e.g. "Marrow 8 — Anatomy · 3/day · by 2027-06-30", "Marrow 6.5 — Not set yet") so the user sees the two partitions before switching.
- **New tests:** F1–F4 in the sync matrix (cross-edition independence, switch preservation, plans never merge across editions, bulk-completion isolation), updated smoke/migration/metrics/navigation for the v4 schema and per-edition switch. Full suite green (104+19+45+40+23+7+44 checks, 57/57 unit tests).
- Cache-busted to v215.

## [2026-08-13] Source-switch modal copy matches reality — plans are kept, not reset (v214)

- The two warning strings in the source-switch modal (`index.html`) still claimed switching "resets your current plan and progress" — the pre-v213 behavior. The modal now says switching **keeps** plans, targets and progress, completions are tracked per edition, and only the daily queue refreshes for the new syllabus. Matches the copy already used in `source-settings.js` and the v213 fix behavior.
- Cache-busted to v214.

## [2026-08-12] Fix: switching study source no longer wipes plans, goals or quests (v213)

- **Root cause found and fixed**: the source-switch handler (`source-settings.js`) reset `state.plans` to a single default Plan A and wiped `state.goals` on EVERY switch. That destroyed configured Plan A + Plan B (subjects, paces, deadlines), emptied the daily-quest list, and made analytics Preparation Setup / Goal Pulse show "Not set" — which also read as "data not syncing" on real devices. Completions themselves always survived (they're keyed per source: `marrow_8::` / `marrow_6_5::`), but the empty plan hid them.
- **Now**: switching source preserves all plans, goals, paces, deadlines and doctor name; only the derived per-day queue bookkeeping resets so it regenerates from the new edition's dataset. The modal warning text was updated to match. Verified: switching 8 → 6.5 → 8 keeps Plan A (Anatomy, 3/day, 2027-06-30), Plan B (Physiology, 2/day, 2027-12-01), and both editions' completions.
- **New smoke regression** (44/44 checks pass) — the suite now switches source and asserts plans + per-source completions survive.
- Also ships: v211 rendering fixes and v212 permanent rendering correctness (cross-viewport render audit, CSS safety nets, retro theme removal, inline-style guard, on-device layout self-check) — all previously committed but not yet deployed.

## [2026-08-12] Permanent rendering correctness — render audit, safety nets, retro removal, layout self-check (v212)

- **New `tests/render.mjs`** — a permanent cross-viewport render audit wired into `npm test`: boots the app at 360/800/1280px, walks every view and dialogue (dashboard, curriculum, analytics, profile, subject detail, source modal, search modal, bottom sheet), and fails on any horizontal page overflow, element escaping the viewport, hard-clipped text, or content trapped under the bottom nav at full scroll. It covers the 769–900px band the suite previously missed (where the plan-config steppers overflowed) and is proven to catch that bug class (44/44 checks on the current app).
- **Global layout safety nets** in `style.css`: `overflow-x: clip` on html/body, `max-width: 100%` on media, and `min-width: 0`/`max-width: 100%` on form controls — the recurring failure classes (page overflow, escaping boxes, inputs that refuse to shrink in flex/grid) are now structurally impossible, with a suite guard that fails if the block is ever removed.
- **Retro theme removed.** `themeStyle` is normalized to `modern` on load, in cloud sanitization, and during migration; all 203 `[data-theme-style="retro"]` CSS rule blocks and the toast retro rules were purged (−1,277 lines). Unit + migration tests cover the coercion; the render audit now guards two theme states instead of four.
- **Inline-style guard** — `tests/inline-styles.mjs` fails on any *new* `style="…"` in view templates or index.html (committed baseline of 172; shrinks as styles migrate to classes). The spotlight search input's inline style was moved to a real CSS class; the bottom-nav label fix now covers the full phone range (≤480px).
- **On-device layout self-check** — after every render the app detects horizontal overflow/clipping in the real browser (catching device- and browser-specific breakage the automated suite cannot see) and shows the result in Profile → Device Layout Check. Last five reports persist in localStorage and are never synced to the cloud. Pure analysis logic is unit-tested (`tests/unit/layout-check.test.mjs`).

## [2026-08-12] Rendering fixes across device widths (v211)

- **Fix: Study Plan Config steppers overflowed the card at ~769–900px widths.** The Daily/Weekly/Monthly pace grid used fixed 3 columns, but each stepper's minimum width (~283px) couldn't fit three across in a narrower card — the Monthly box spilled past the viewport and its `+` button was invisible (plus a horizontal page scrollbar). The grid now uses `repeat(auto-fit, minmax(150px, 1fr))`, so the columns wrap gracefully at every width while staying identical to the old 3-column layout on wide screens.
- **Fix: spotlight search placeholder hard-clipped mid-word on phones** (e.g. "SEARCH 19 SUBJECTS, C"). The input had no CSS (inline `flex: 1` only) and its 49-char placeholder couldn't fit; it now has `min-width: 0` + `text-overflow: ellipsis` and a smaller font on ≤480px screens.
- **Fix: bottom-nav "CURRICULUM" label clipped on very narrow phones (≤320px).** Labels now use a smaller font/letter-spacing and no-wrap at ≤330px so they fit on one line.
- **New cross-viewport regression checks in the smoke test** (42/42 pass): at 800px the pace grid has no horizontal overflow and all three stepper `+` buttons are visible; at 320px nav labels are unclipped; at 390px the search placeholder ellipsizes instead of hard-clipping.

## [2026-08-11] Sync Diagnostics panel in Profile — field-level arbitration made visible (v210)

- **New panel** (Profile → Google Cloud Sync → Sync Diagnostics, shown when signed in): a per-field table of every arbitrated cloud field with the **local clock vs cloud clock** (relative time), a **Wins** badge (`LOCAL` = this device is newer, `CLOUD` = another device is newer, `TIE` = equal, `UNION` = completions merge both sides), and a readable value summary on each side (plans, goals, streak, doctor name, completions count, source…). When the two sides diverge, the cloud's value is shown under the local one.
- **Last-sync result line**: after Sync Now / sign-in pull / reconnect, the panel records status + message + which fields were pushed and which were pulled; a second line reports the debounced auto-save outcome (success/failure + fields). Results persist in localStorage (`flowmd_sync_diagnostics`) and are **never** written to the cloud doc (excluded from every push path).
- **Live refresh**: the panel re-reads the cloud doc on every Profile render and via a Refresh button; if the read fails (offline) it falls back to the last-known cloud clocks from the previous successful pull and says so.
- **New pure helpers** (`js/core/sync.js`, unit-tested): `computeFieldArbitration()` (per-field verdict) and `buildSyncDiagnostics()` (ordered rows + summaries). Recording lives in `js/features/sync.js` (`recordSyncResult` / `recordAutoPushResult`), with `state-store.js`'s auto-push reporting through the same recorder.
- **Tests**: +5 unit tests (verdicts, union/tie, row summaries, empty/no-clock, cloud-only first-sync) and +5 smoke checks (panel renders when signed in, LOCAL + CLOUD badges, divergence values, Refresh button). Full suite green: 104/19/38/40/22/7/49 unit.

## [2026-08-11] Comprehensive sync verification — full scenario matrix, two more real bugs found & fixed (v209)

- **New test architecture**: shared harness (`tests/unit/sync-harness.mjs`) runs the REAL production sync modules in sandboxed devices against an in-memory Firestore mock (auth, offline, events included).
- **New full scenario matrix** (`tests/unit/sync-matrix.test.mjs`, 10 scenarios): sign-in seeds a missing doc / pulls an existing one; legacy pre-v205 docs (no clocks, unprefixed keys) migrate on sign-in; concurrent plans converge with NO plan lost; same-plan edits propagate; uncheck behavior documented (device-local by design); 1000-key completion stress; offline edits converge on re-connect; three devices converge with zero echo writes.
- **Bug found & fixed — in-place plan edits were silently lost**: the push baseline (`_prevSyncedState`) held SHARED references to live state, so `state.plans[0].videosPerDay = x` (exactly what the Study Plan Config does) compared identical to the baseline and was never flagged dirty — the edit never reached the cloud after any prior push/pull. Baselines are now deep copies in `state-store.js`, `applyMergedState`, and the test harness. (The two-device tests had masked it by mirroring the same shared-reference behavior.)
- **Bug found & fixed — concurrent plan edits lost a plan**: the merge replaced the whole `plans` array by field clock, so a device that added Plan B lost it to a device that merely edited Plan A (and vice versa). Plans now merge PER PLAN ID (`mergePlansByClock`): both plans always survive, and the side whose field clock is newer wins the values of shared ids — same-plan edits still propagate.
- **Unit tests now 44 (was 32)**: 23 core merge tests + 7 two-device + 10 matrix + 4 harness-backed extras; full suite green twice (104/19/33/40/22/7/44).

## [2026-08-11] Sync data-loss fix — empty docs can no longer wipe your data, manual sync actually pushes edits, both editions keep their completions (v208)

- **Bug — Sync Now wiped plans / goals / doctor name / source / quests**: `updateCloudFields` REPLACED the whole `fieldSyncTimes` clock map with only the fields just written. Each push destroyed every other field's clock, so cross-device arbitration became asymmetric — whoever pushed last stamped fresh clocks, and the next pull on the other device decided "cloud newer" and wiped its data (then refused to push it back). Clocks are now written with dot-path merges into the existing map, so every field's clock survives every write.
- **Bug — empty cloud state clobbered real data**: a device with an unset plan / default profile / fresh install could seed the doc (or push its empties with a newer stamp) and wipe the richer device. The merge is now data-preserving: an empty/partial cloud copy never replaces a non-empty local value (and vice versa), a real cloud copy still fills a fresh device, the default `marrow_8` source never clobbers a chosen one, and a cloud clock stamped >10 min in the future is treated as clock skew and can't win.
- **Bug — manual sync never pushed local-won edits**: the push compared the post-merge value against the pre-pull local value, so a field this device actually owned was never written (doctor name, plans, goals silently never reached the other device). The push now compares against the cloud's stored value and sends every field this device owns whose value differs — while still skipping cloud-won fields, so no echo/ping-pong.
- **Bug — edition 8 & 6.5 completions collided in the cloud**: both editions share video IDs, and the doc stored prefix-stripped keys, so a marrow_8 completion and a marrow_6_5 completion collapsed into one key (and rehydrated under the single active source). The doc now stores FULL prefixed keys and `updateCloudFields` writes `completedVideos` per key (FieldPath merge), so each edition keeps its own completions and a partial push can't erase the other edition's keys.
- **New two-device regression tests** (`tests/unit/sync-twodevice.test.mjs`, now 7 scenarios): an empty cloud doc can't wipe a device with real data, manual sync alone propagates an edit (no auto-push timing), cross-edition completions survive, and zero writes after both devices settle. Unit tests: 32 pass (incl. empty-guard, default-source, skew, first-sync).

## [2026-08-11] Preparation Setup now responds to Study Plan Config goals (v207)

- **Bug — Preparation Setup ignored the config**: the analytics "Preparation Setup" card read the legacy `state.goals` object, but the Study Plan Config only mirrored Plan A's subject/date/daily pace into it — weekly/monthly were never mirrored, and Plan B not at all. The card showed stale or empty values ("—") after saving goals.
- **Fix**: the card now derives its values from `state.plans` (the real source of truth, same as Goal Pulse) — Priority Focus joins configured subjects, Daily Pace / Daily / Weekly / Monthly sum across all plans, and Target Date uses the earliest plan deadline (formatted en-GB). Goal Pulse, hero chips, and Days Left use the same plan-based clocks.
- **Legacy hygiene**: the `state.goals` mirror now also carries weekly/monthly so the cloud field is never half-stale.
- **New smoke regression**: configures Plan A (subject, 3 vids/day, 2027-06-30 deadline) and asserts the Preparation Setup card shows 3/21/90 vids and the target date (33/33 checks pass).

## [2026-08-11] Two-device sync proof — pull-then-push verified end-to-end, echo writes eliminated (v206)

- **New two-device test suite** (`tests/unit/sync-twodevice.test.mjs`): two simulated devices run the REAL production sync modules against a shared in-memory cloud store (same contract as firebase.js — per-field clocks, compressed video keys). Four scenarios prove the sync design end-to-end:
  1. Different fields edited on each device → both edits survive after a round of syncs;
  2. Same field edited on both → the newer edit wins, the older is never resurrected;
  3. completedVideos is a union → completions from both devices all survive (cloud key stored compressed);
  4. **No write ping-pong** → after both devices settle, repeated syncs produce ZERO writes (a write counter asserts it).
- **Two real bugs found by the proof and fixed**:
  - `manualSync`'s push could re-push fields it had just pulled (echo): the pull stamped their clocks via `applyMergedState`, so they looked locally edited. The push phase now snapshots the per-field clocks BEFORE the pull and writes only fields whose pre-pull local clock is genuinely newer than the cloud's (unions always safe).
  - After a pull, the push baseline (`_prevSyncedState`) was stale, so a later debounced auto-push could rewrite just-pulled fields. `applyMergedState` now advances the baseline to the merged state — pulled fields are "already synced" and never echo back.
- Bookkeeping fields (`_cloudSyncTimes`, `_dirtyFields`, `_prevSyncedState`, ...) are explicitly excluded from the manual push — they were previously at risk of being written into the cloud doc.
- **Test infrastructure fixes**: the offline test was flaky (1 in 3 runs) because Google Analytics beacons (`googletagmanager.com` / `google-analytics.com`) intermittently fail in the sandbox — the error collector now ignores network resource failures (they're not app errors; offline capability is asserted separately). Full suite: 101/19/32/40/22/7/scope-clean/26 unit.

## [2026-08-11] Cross-device sync is now pull-then-push — no more write clashes (v205)

- **The real-time `onSnapshot` listener is gone.** Previously every write from any device (including your own) instantly re-merged and could re-push, so two signed-in devices ping-ponged writes at each other and edits "reverted" (the reported clashes). Sync now only happens when a device pulls or pushes deliberately — nothing can write back into your device without you asking.
- **Sync Now = pull-then-push** (Profile → Google Cloud Sync, plus auto-run when the device comes back online): first the cloud doc is read and merged into local state, then only the fields this device actually changed since the pull are written back. A sync can never fight itself.
- **Per-field newest-wins arbitration** (`mergeCloudPerField`): each field carries its own last-write clock (`fieldSyncTimes`, written with every push, compared on every pull). The side that last changed a field wins it — no more whole-doc clock-skew guessing. `completedVideos` stays a union (cloud fills gaps, local wins conflicts) so completions from either device always survive.
- **Local changes still auto-push** (unchanged): every local save writes changed fields to the cloud 800ms later, but the push guard skips fields the cloud already has newer — your data always leaves the device, nothing ever clobbers it back.
- **Simpler code**: removed the old `shouldApplyCloud` clock-skew arbitration, the unused `subscribeToCloud`/`onSnapshot` listener, and the sign-in merge special-case. UI copy updated (no more "syncs in real-time (~1s)"), Sync Now button added with the `sync` icon.
- **Tests**: +4 unit tests for `mergeCloudPerField` (cloud-newer wins, local-newer wins, completedVideos union, no-timestamp first sync), registry +1 (101 total, `pullFromCloud`/`mergeCloudPerField` contract-checked), 22/22 unit green; full suite green (101/19/32/40/22/7/scope-clean).

## [2026-08-11] Google Fonts removed — system font stacks + zero external font requests (v204)

- **No more Google Fonts, at all.** The Inter/Outfit/Poppins/Pixelify Sans/VT323 CSS link, preconnects, and every woff2 precache are gone from `index.html` and `sw.js`. All text now renders from system stacks (`system-ui`/`-apple-system`/`Segoe UI` for modern, `Courier New`/`ui-monospace` for the retro pixel/HUD look), declared once in the `--font-*` variables in `style.css`.
- **~180 direct `font-family` references updated** in `style.css` plus inline refs in `index.html` and 5 JS modules (logo, search, study-plan-config, toast, profile) — all now use the variables or the system stack. Redundant fallbacks after `var(--font-*)` were removed.
- **CSP tightened**: `style-src` no longer needs `fonts.googleapis.com`, `font-src` drops `fonts.gstatic.com`, `connect-src` drops `fonts.gstatic.com`.
- **Service worker simplified**: the Google Fonts precache job and the `isFont` network-first fetch branch are deleted — one fewer failure mode (a font fetch can never hang, CSP-block, or corrupt rendering again; the text fonts were the last external font dependency).
- **Tests**: offline test CSP mirror updated; full suite green (100/19/32/40/nav/22/7/scope/20). Verified visually on the live preview — dashboard renders identically with system fonts and inline-SVG icons.

## [2026-08-11] Material Symbols font replaced with inline SVG sprite — icons can never degrade to ligature text again (v204)

- **The icon-failure bug class is structurally dead.** All 55 Material Symbols the app uses (52 static + `error`/`check_box`/`check_box_outline_blank` dynamic) are now official SVG paths in a hidden `<symbol>` sprite (`js/core/icons.js`, 22 KB), referenced as `<svg class="material-symbols-outlined"><use href="#fmd-i-{name}"/></svg>`. No icon font, no font fetch, no cache, no CSP/CORS — offline, first-ever visit, slow network: the ligature-text symptom (`local_fire_department`) is impossible because there is no font to fail.
- **Zero design change**: same official artwork, `1em` sizing (all existing `font-size` rules keep working), `currentColor` fill (all existing `color` rules keep working). Verified visually on dashboard + analytics; sprite symbols 55/55 resolve; dynamic `expand_more`↔`expand_less` accordion toggle re-wired via `icons.setIcon()`.
- **Payload removed**: the Material Symbols Google Fonts CSS link + its woff2 precache are gone from `index.html` and `sw.js` (~1 MB of cached font assets); the SW still precaches the text fonts (Inter/Outfit/Poppins) and now precaches `icons.js`.
- **Migration mechanics**: 111 static spans converted by script (class/style/aria kept); 3 dynamic templates (toast, analytics goal tiles, subject-detail bulk checkbox) now call `icons.renderIcon(name, class, style)`.
- **Tests updated**: offline test now asserts inline-SVG + sprite resolution + zero ligature text (online AND offline), modules registry +5 checks (100 total). Full suite green: 100/19/32/40/nav/22/7/scope/20.

## [2026-08-11] Firestore doc slimmed — dead, transient, and redundant data no longer synced (v202)

- **Dead fields removed from the cloud doc**: `speed` (always `1.5`), `subjectUrgency` (always `{}`), `dailyBatch` (always `null`), and `lastSyncedAt` (never read — `updatedAt` is the merge clock). None existed in app state or were ever consumed; they were written as constants on every sync.
- **Transient queue state no longer synced**: `queueBatchVideoIds` / `queueCompletedInBatch` (top-level and per-plan) plus per-plan `extraBatchesCompletedToday` / `lastBatchDate` — per-day, recomputed by the queue engine, and wrong to share across devices. Plans are now stored with only their durable fields (`id`, `label`, `accentColor`, target, paces, `targetUnits`).
- **`completedVideos` keys compressed**: the runtime `marrow_8::` source prefix is redundant in the doc (it sits next to `activeSource`), so keys are stripped on write (`compressCompletedVideos`) and re-prefixed on read (`rehydrateCompletedVideos`) — saves ~10 bytes per video (≈16KB on the full syllabus) and keeps the doc far from Firestore's 1 MiB limit. `updateVideo` writes compressed keys too. Legacy prefixed keys pass through untouched.
- **History pruned to 90 days**: `dailyHistory` is only read for the 7/30-day charts and `dailyHistoryBySubject` only for today's count, so entries older than 90 days were unbounded dead weight in the doc; `saveState` now prunes both maps (local + cloud stay identical).
- **Tests**: +5 unit tests (compress/rehydrate round-trip, prune cutoff, sanitize drops dead fields + strips plan transients), +4 registry contract checks (95 total). Existing docs stay valid: old fields are dropped on read, prefixed video keys rehydrate correctly, and the whole suite is green (95/19/32/40/nav/22/7/scope/20).

## [2026-08-11] Scope-leak audit — one more leftover from the module split caught (v201)

- **Audited every module** (`js/features/views/*`, `js/features/*`, `js/core/*`, `app.js`, `firebase.js`, `sw.js`) for bare function calls not covered by an import, a declaration, a parameter, or a known global — the ReferenceError class that already broke the quest checkboxes.
- **Found + fixed 1 more**: `pwa-install.js` still called `notifyChanged()` (renamed to `refreshInstallUI` in v199) after the user answers the native install prompt — every install threw a `ReferenceError`, so the banner/card never refreshed and no toast appeared after install.
- **New permanent test** `tests/scope-leaks.mjs` wired into `npm test` (9 suites now): a char-scanner strips comments/strings/templates/regex and flags any bare call not accounted for — so this whole bug class is caught on every run, forever.

## [2026-08-11] Daily Quest checkboxes dead — scope leaks from the module split (v201)

- **Bug**: clicking a Daily Quest checkbox visually toggled it but nothing registered — no completion, no toast, no progress. The change handler called `getPlanById()` and bare `render()`, which were in scope inside the old monolithic `app.js` but not in the extracted `dashboard.js` module → `ReferenceError` on every click (same class as the earlier `getScopedChapterNames` extraction miss; render-only audits never click, so it slipped through). The same leaks silently broke **Load Next Video**, **Save & Apply Plan A/B Target**, **Disable Plan B**, and **saving the profile name**.
- **Fix**: `dashboard.js` now imports `getPlanById` from `window.FlowMD.metrics`; all bare `render()` calls in `dashboard.js`, `profile.js`, and `study-plan-config.js` route through `window.FlowMD.shell.render()`.
- **Test**: the navigation audit now real-clicks a quest checkbox and asserts the completion registers in state, the progress counter advances, and a toast appears (catches scope leaks on every run).

## [2026-08-11] Study Plan Config: subject dropdown closes itself; picking a subject invented pace/deadline (v199)

- **Bug 1 — dropdown closes before picking**: Chrome fires `beforeinstallprompt` on first user engagement, which is often exactly when the user opens the subject dropdown. The install helper's `notifyChanged()` responded by re-rendering the entire view, destroying the open `<select>` (native picker shuts instantly). `pwa-install.js` now patches only the install banner / Profile card **in place** (never a full re-render), and the Install / Dismiss buttons moved to document-level delegation so in-place swaps can't lose their handlers.
- **Bug 2 — assumed pace/deadline returned**: after v195, picking a subject still auto-filled `8 vids/day`, `56/week`, `240/month` and a deadline via the `|| 8` fallback in `synchronizeModalPace`. The card now waits for real user input — a subject pick fills nothing; the deadline auto-syncs only once a user-entered pace (or a picked date) exists.
- **Tests**: smoke +3 checks — the subject select survives a simulated `beforeinstallprompt` (no full re-render), the banner still upgrades in place, and picking a subject leaves pace/deadline empty with the badge at "Not set" (32 checks).

## [2026-08-11] Fix icons degrading to ligature text on every reload after the first load (v197)

- **Bug**: Material Symbols icons rendered fine on the first load, then showed as raw ligature text (`local_fire_department`, `auto_stories`, …) on every subsequent reload. The service worker script is served with the site's CSP header, so its own cross-origin `fetch()` calls are subject to `connect-src` — which allowed `*.googleapis.com` but **not** `fonts.gstatic.com` / `www.gstatic.com`. Once the SW controlled the page, its font/SDK fetches were blocked (`net::ERR_FAILED`), the cache misses returned nothing, and the fonts never loaded.
- **Fix**: added `https://fonts.gstatic.com` and `https://www.gstatic.com` to `connect-src` in both the `index.html` meta CSP and the deployed `firebase.json` header CSP.
- **Test hardening**: `tests/offline.mjs`'s static server now sends the same production CSP headers, so the SW's CSP-restricted fetches are exercised in tests (this is why the bug slipped through — the test env had no CSP).

## [2026-08-11] No assumed goals for new users; source switch resets to unset (v195)

- **Bug**: fresh profiles (and users after switching study source) were silently given assumed targets — subject auto-selected, `8 vids/day`, `56/week`, `240/month`, and a hardcoded `2026-08-15` deadline — so the Goal Pulse / 7-day chart never visibly changed after a source switch.
- **Fix**: `DEFAULT_PLAN` / `DEFAULT_GOALS` and the legacy `migrateStateToPlans()` carry no numeric or date defaults anymore (empty subject, empty deadline, `null` paces). The Study Plan Config form now starts with a “— Select a subject —” placeholder, empty pace/deadline fields, and refuses to save until subject + daily pace + deadline are filled in. Analytics shows an honest “No study target set yet” state (Goal Pulse + Preparation Setup show `—`/`Not set`, never fake numbers) instead of assumed values.
- **Source switch** (`source-settings.js`) now resets to a truly unset plan, so the Goal Pulse and 7-day chart visibly change and wait for fresh input.
- Smoke test +2 checks: fresh profile starts with an empty plan config; Analytics Goal Pulse shows the empty state. (29 checks)

## [2026-08-11] Fix Google sign-in — CSP blocked the Firebase authDomain iframe (v193)

- **Bug**: `signInWithPopup` failed with either "Sign in failed" or the Google tab closing right after account selection. Firebase Auth relays the popup result through an invisible iframe on the authDomain (`https://flowmd-04.firebaseapp.com/__/auth/iframe`), but the app's CSP `frame-src` only allowed `accounts.google.com`/`apis.google.com` — the console logged `Framing 'https://flowmd-04.firebaseapp.com/' violates CSP frame-src`, so the OAuth completed, the tab closed, and the result never reached the app.
- **Fix**: added `https://flowmd-04.firebaseapp.com` to `frame-src` in both the `index.html` meta CSP and the deployed `firebase.json` header CSP.

## [2026-08-11] PWA install helper — first-visit install UI + Profile guide (v191)

- **New module** `js/features/pwa-install.js` (`window.FlowMD.pwaInstall`): single source of truth for the install lifecycle — captures `beforeinstallprompt`, tracks installed/installable state (`display-mode: standalone` + `appinstalled` + persisted `flowmd_pwa_installed`), and exposes `requestInstall()`.
- **First-visit install banner** on the dashboard: adaptive — browsers with a native prompt (Android Chrome / desktop) get an **Install** CTA; browsers without one (iOS Safari) get brief **Add to Home Screen** steps (Android ⋮ menu / iPhone Share). Dismissal persists (`flowmd_install_helper_dismissed`) so it never nags again.
- **Install App card in Profile**: short intro + the same brief steps, or an Install button when the native prompt is available, or an “installed ✓” state once installed.
- **Fixed latent bug**: the old dashboard banner referenced `deferredInstallPrompt` (scoped inside `app.js`'s IIFE → `ReferenceError` on click) and was hidden by a stale duplicate `.pwa-install-banner` CSS block (`position: fixed; display: none`) — both removed, wiring moved into the new module.
- `tests/modules.mjs` registry contract +10 checks (91 total); smoke test now asserts the first-visit banner and the Profile install card (27 checks).

## [2026-08-10] Phase C — legacy retro-era naming cleanup + storage-key migration (v184)

- **Design tokens renamed** (v179): `pxl-*` classes → `fm-*`, `PXL_ICONS` → `FLOWMD_ICONS` across all views, toast, theme, search, charts, constants, the app shell, `index.html`, and `style.css` (347 occurrences); stale `PXLKIT`/`PxlKit`/`16-BIT RETRO RPG` comments → FlowMD.
- **Onboarding wizard renamed** (v180): `obw-*` classes/IDs → `onboarding-*`; wizard state vars `obwStep/obwSource/obwTheme/obwName/obwSeeded` → `onboarding*`. Test selectors updated in sync.
- **Plan-config modal renamed** (v181): `gcm-*` classes/IDs → `plan-config-*` in `study-plan-config.js`, `index.html`, and `style.css`.
- **Execution chart renamed** (v182): `ex-chart-*` classes → `chart-*` (legend `ex-dot-*` markers untouched).
- **Storage-key migration, schema v2 → v3** (v184): all `marrow_planner_*` keys → `flowmd_*` (incl. the raw `marrow_planner_theme_style` strings). `migrateStateSchema()` carries old values over once, removes legacy keys, and runs **before** the v1→v2 migration so v1-era profiles still get the video-ID prefixing.
- **New test**: `tests/migration.mjs` (12 checks) — seeds a full v2 profile, asserts every `marrow_planner_*` key removed, values carried over, `flowmd_schema_version = 3`, and the dashboard renders identically to a fresh v3 profile.
- **Latent bugs fixed** (v183): `dashboard.js` and `subject-detail.js` called `getScopedChapterNames(plan)` without importing it (missing since the extraction — only fired when a plan exists). The navigation audit now seeds a Plan A profile so those paths render on every run.
- `npm test` now runs 6 suites: modules → metrics → smoke → onboarding → navigation → migration (230+ assertions).

## [2026-08-10] Monolith decomposition — `app.js` split into 20 modules (v178)

- **`app.js` slimmed from 3,816 → 356 lines.** All logic moved into plain-IIFE modules registered on `window.FlowMD.*`, loaded as ordered `<script>` tags (no bundler — CSP forbids `unsafe-eval`).
- **Module map**: `js/core/` — namespace, constants, state-store, source-data, subjects, metrics, logo; `js/features/` — toast, theme, search, sync, onboarding, study-plan-config, source-settings, charts, views/{dashboard, curriculum, subject-detail, analytics, profile}.
- **Fixed dormant duplication**: `js/core/state-store.js` and `js/core/source-data.js` (extracted in v160 but never wired) are now loaded; their duplicate copies inside `app.js` were deleted. Two copies of the same state/data logic could previously drift silently.
- **Dead code removed** (found during the sweep): `renderGoalsView` (unreachable since the initial commit), `renderFacultyPill`, `renderHoursMeter`.
- **New tests**: `tests/modules.mjs` (81 registry-contract checks), `tests/metrics.mjs` (19 unit tests), `tests/navigation.mjs` (full view tour incl. bottom-sheet open/navigate/dismiss, zero console errors). `npm test` runs modules → metrics → smoke → onboarding → navigation (160+ assertions).
- **Revert safety**: each extraction tagged `stage-0`…`stage-17`; backup branch `backup/pre-decompose-v161`.
- Behavior unchanged — same DOM output, same localStorage schema. Verified: 20/20 smoke, 40/40 onboarding, 81/81 registry, 19/19 metrics, navigation tour clean.

## [2026-08-10] 7-Day Execution Chart — reverted to line style (matching deployed site)

- Reverted the pixel-terminal bar chart back to the **line-style chart** matching flowmd-04.web.app exactly:
  - **Area fill**: gradient `linearGradient` (0.30→0.02 opacity) under the curve (`ex-chart-area` with `fill: url(#exChartGrad)`).
  - **Trend line**: smooth **Catmull-Rom→cubic-bezier** curved path (`ex-chart-line`, stroke-width 2, round caps/joins).
  - **Nodes**: solid circle markers at each data point (`ex-chart-node`, r=5) with `ex-node-met`/`ex-node-part`/`ex-node-zero` color states; value label + star badge above each node.
  - Removed all bar/pixel-terminal classes: `ex-bar-track`, `ex-bar-cell`, `ex-chart-bar`, `ex-trend-line`, `ex-trend-marker`, `ex-dot-trend`, `ex-day-tile--pixel`.
  - Removed the re-render-at-measured-width logic (not needed for smooth vector chart).
  - Legend simplified back to: Target Met, Partial, No Study, Daily Target (removed "Track" item).
  - Grid lines: `stroke-dasharray: 1 4` (dotted); Target line: `stroke-dasharray: 2 3` (dashed violet) — matching deployed.
- Cache-busted to v161 (`?v=161` in index.html; sw.js cache `marrow-planner-pwa-v8`).
- Verified: `node --check app.js` passes; Playwright smoke 20/20 + onboarding 40/40 (60/60 total), 0 console errors. DOM verified: 1 gradient area + 1 smooth line + 7 point groups + 7 nodes + 3 dotted grid lines + 1 dotted target line. Zero leftover bar/pixel elements.

## [2026-08-09] Anatomy icon upgraded → skeleton

- Replaced the anatomy subject icon in `js/core/constants.js` (`SUBJECT_SVG_ICONS.anatomy`) from the generic `body/body.svg` outline to the detailed Health Icons `body/skeleton.svg` (full skeleton, 6150 chars vs 2064).
- Verified: `node --check` passes; smoke test 20/20; anatomy heatmap tile renders the skeleton SVG with no console errors.

## [2026-08-09] Subject icons → Health Icons (SVG)

Replaced the subject icons across the app with official Health Icons (healthicons.org, outline style, CC0/public domain).

### Source
- Downloaded `healthicons.zip` and extracted to `C:\MOHAMMED SAFI\LM\healthicons_extracted\icons\svg\outline\`
- SVGs embedded inline (single-line, `viewBox="0 0 48 48"`, `fill="currentColor"`) — no separate asset files added.

### Icon mapping
| Subject | Health Icon file |
| --- | --- |
| anatomy | `body/skeleton.svg` (upgraded from `body/body.svg`) |
| physiology | `body/heart-organ.svg` |
| biochemistry | `specialties/biochemistry-laboratory.svg` |
| pathology | `devices/microscope.svg` |
| pharmacology | `specialties/pharmacy.svg` |
| microbiology | `body/bacteria.svg` |
| community_medicine | `people/community-healthworker.svg` |
| forensic_medicine | `symbols/magnifying-glass.svg` |
| ophthalmology | `specialties/opthalmology.svg` |
| otorhinolaryngology__ent_ | `specialties/ears-nose_and_throat.svg` |
| anaesthesia | `devices/syringe.svg` |
| dermatology | `body/tissue.svg` |
| psychiatry | `symbols/mental-health.svg` |
| radiology | `specialties/radiology.svg` |
| medicine | `devices/stethoscope.svg` |
| surgery | `specialties/general-surgery.svg` |
| orthopaedics | `specialties/orthopaedics.svg` |
| paediatrics | `specialties/pediatrics.svg` |
| obstetrics___gynaecology | `specialties/gynecology.svg` |
| revision_videos | `symbols/video.svg` |

### Files changed
- `js/core/constants.js` — replaced all 20 entries of `SUBJECT_SVG_ICONS` with Health Icons
- `app.js`:
  - Heatmap tiles now render inline SVG (`sub.svgIcon`) colored by `sub.accentColor` instead of `<img src=...png>`
  - Subject spotlight search results use `s.svgIcon`
  - Curriculum subject rows use `sub.svgIcon` with `accentColor`
  - PWA subject detail header uses `subObj.svgIcon` with `accentColor`
- `style.css`:
  - `.pxl-tile-icon-area svg` rules replace `.pxl-tile-icon-img` (kept 52px, hover scale, drop-shadow; removed dark `#1a2332` chip background)
  - Added `.subject-icon-medium svg`, `.subject-icon-wrapper` (new base rule + svg), `.pwa-subject-detail-icon svg` sizing rules

### Notes
- PNG icons (`icons/*.png` + `SUBJECT_ICONS` + `getSubjectIconSrc`) still exist as fallback; heatmap PNG no longer used.
- Goals analysis icons (material symbols, `o.icon`) untouched.
- Verified: `node --check` passes on `constants.js` and `app.js`; 20/20 subjects present.
