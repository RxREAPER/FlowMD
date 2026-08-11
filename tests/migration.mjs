/* ============================================================
   FlowMD Schema Migration Test — v2 → v3 storage-key rename
   Seeds a full legacy profile under the retro-era marrow_planner_*
   keys, reloads, and asserts:
     (a) the dashboard renders identically to a fresh v3 profile,
     (b) every marrow_planner_* key is gone,
     (c) each flowmd_* key holds the carried-over value,
     (d) flowmd_schema_version === 3.

   Usage: node tests/migration.mjs [port]
   Run from the flowmd project root.
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8127;
const BASE = `http://127.0.0.1:${port}`;

const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.ico': 'image/x-icon', '.md': 'text/plain', '.wasm': 'application/wasm'
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(normalize(root))) { res.writeHead(403); res.end('Forbidden'); return; }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(404); res.end('Not found');
  }
});

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

// A realistic v2-era profile. The "new" side of the parity check is built by
// swapping the marrow_planner_* keys for flowmd_* with identical values.
const PLAN_A = JSON.stringify([{
  id: 'plan_a', label: 'Plan A', accentColor: '#7c3aed',
  targetSubject: 'Anatomy', targetDate: '2999-01-01',
  videosPerDay: 8, dailyTargetHours: 3.5, targetUnits: [],
  queueBatchVideoIds: [], extraBatchesCompletedToday: 0
}]);

const LEGACY_VALUES = {
  'marrow_planner_completed_videos': JSON.stringify({ 'marrow_8::anatomy__v1': true }),
  'marrow_planner_goals': JSON.stringify({ dailyTargetHours: 3.5, weeklyVideos: 56 }),
  'marrow_planner_theme': 'dark',
  'marrow_planner_theme_style': 'retro',
  'marrow_planner_streak': JSON.stringify({ lastStudyDate: '2999-01-01', currentStreak: 3 }),
  'marrow_planner_daily_batch': '0',
  'marrow_planner_personal': JSON.stringify({ doctorName: 'Dr. Migration Test', isSynced: false, syncEmail: '' }),
  'marrow_planner_urgency': '0',
  'marrow_planner_daily_history': JSON.stringify({ '2999-01-01': 1 }),
  'marrow_planner_queue_completed_in_batch': '0',
  'marrow_planner_queue_batch_videos': '[]'
};

const KEY_RENAMES = {
  'marrow_planner_completed_videos': 'flowmd_completed_videos',
  'marrow_planner_goals': 'flowmd_goals',
  'marrow_planner_theme': 'flowmd_theme',
  'marrow_planner_theme_style': 'flowmd_theme_style',
  'marrow_planner_streak': 'flowmd_streak',
  'marrow_planner_daily_batch': 'flowmd_daily_batch',
  'marrow_planner_personal': 'flowmd_personal',
  'marrow_planner_urgency': 'flowmd_urgency',
  'marrow_planner_daily_history': 'flowmd_daily_history',
  'marrow_planner_queue_completed_in_batch': 'flowmd_queue_completed_in_batch',
  'marrow_planner_queue_batch_videos': 'flowmd_queue_batch_videos'
};

// Common always-flowmd_* keys shared by both profile shapes.
const COMMON_KEYS = {
  'flowmd_is_configured': 'true',
  'flowmd_tutorial_seen': 'true',
  'flowmd_active_source': 'marrow_8',
  'flowmd_plans_v2': PLAN_A
};

function seedLegacy(page) {
  return page.evaluate(([legacy, common]) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(common)) localStorage.setItem(k, v);
    for (const [k, v] of Object.entries(legacy)) localStorage.setItem(k, v);
    localStorage.setItem('flowmd_schema_version', '2');
  }, [LEGACY_VALUES, COMMON_KEYS]);
}

function seedModern(page) {
  return page.evaluate(([legacy, renames, common]) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(common)) localStorage.setItem(k, v);
    for (const [oldKey, v] of Object.entries(legacy)) localStorage.setItem(renames[oldKey], v);
    localStorage.setItem('flowmd_schema_version', '3');
  }, [LEGACY_VALUES, KEY_RENAMES, COMMON_KEYS]);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const values = {};
    for (const k of Object.keys(localStorage)) values[k] = localStorage.getItem(k);
    return {
      main: (document.getElementById('app-main') || {}).innerText || '',
      topbar: (document.querySelector('.topbar') || {}).innerText || '',
      initials: (document.getElementById('topbar-avatar-initials') || {}).textContent || '',
      keys: Object.keys(localStorage).sort(),
      values,
      version: localStorage.getItem('flowmd_schema_version')
    };
  });
}

async function run() {
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('[console] ' + m.text()); });

  // --- Run A: legacy v2 profile → should migrate to v3 on load ---
  await page.goto(`${BASE}/`);
  await seedLegacy(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const migrated = await snapshot(page);

  // (b) every marrow_planner_* key gone
  const legacyLeft = migrated.keys.filter((k) => k.startsWith('marrow_planner_'));
  check('All marrow_planner_* keys removed after migration', legacyLeft.length === 0,
    legacyLeft.join(', ') || 'none left');

  // Spot checks on values that must survive byte-identical.
  check('Completed videos carried over', /anatomy__v1/.test(migrated.values['flowmd_completed_videos'] || ''),
    String(migrated.values['flowmd_completed_videos']).slice(0, 60));
  check('Daily history carried over', /2999-01-01/.test(migrated.values['flowmd_daily_history'] || ''),
    String(migrated.values['flowmd_daily_history']).slice(0, 60));
  check('Doctor name carried over', /Dr\. Migration Test/.test(migrated.values['flowmd_personal'] || ''),
    String(migrated.values['flowmd_personal']).slice(0, 60));
  check('Theme style normalized to modern after migration', migrated.values['flowmd_theme_style'] === 'modern',
    String(migrated.values['flowmd_theme_style']));
  check('Theme carried over', migrated.values['flowmd_theme'] === 'dark',
    String(migrated.values['flowmd_theme']));

  // (d) schema version is 3
  check('flowmd_schema_version = 3', migrated.version === '3', String(migrated.version));

  // --- Run B: fresh v3 profile seeded directly → parity baseline ---
  await seedModern(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const fresh = await snapshot(page);

  // (c) each flowmd_* key holds the carried-over old value. The migrated run
  // and the fresh v3 run are seeded with identical data (old keys vs new
  // keys), so per-key value parity proves the carry-over — even for keys
  // like goals that loadState normalizes against defaults before persisting.
  const renamedKeys = Object.values(KEY_RENAMES);
  let valueMismatch = [];
  for (const k of renamedKeys) {
    if (migrated.values[k] !== fresh.values[k]) valueMismatch.push(`${k}: migrated=${String(migrated.values[k]).slice(0, 40)} fresh=${String(fresh.values[k]).slice(0, 40)}`);
  }
  check('All flowmd_* values match a fresh v3 profile', valueMismatch.length === 0,
    valueMismatch.join(' | ').slice(0, 240));

  // (a) dashboard renders identically
  check('Dashboard renders identically to a fresh v3 profile',
    fresh.main === migrated.main && fresh.topbar === migrated.topbar,
    `main ${migrated.main.length} vs ${fresh.main.length} chars`);
  check('Dashboard renders real content (not an error card)', migrated.main.length > 500,
    String(migrated.main.length));
  check('Migrated profile shows the doctor initials', migrated.initials === 'MI',
    JSON.stringify(migrated.initials).slice(0, 80));
  check('No page errors during migration', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | ').slice(0, 200));

  // --- Run C: v1-era profile → v3 in one pass (no schema version key,
  // unprefixed video IDs). Proves the v2→v3 block runs BEFORE v1→v2, so the
  // video-ID prefixing still finds the renamed key. ---
  await page.goto(`${BASE}/`);
  await page.evaluate(([common]) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(common)) localStorage.setItem(k, v);
    localStorage.setItem('marrow_planner_completed_videos', JSON.stringify({ 'anatomy__v1': true }));
    localStorage.setItem('marrow_planner_personal', JSON.stringify({ doctorName: 'Dr. V1 User', isSynced: false, syncEmail: '' }));
  }, [COMMON_KEYS]);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const v1 = await snapshot(page);
  const v1Videos = JSON.parse(v1.values['flowmd_completed_videos'] || '{}');
  const v1LegacyLeft = v1.keys.filter((k) => k.startsWith('marrow_planner_'));
  check('v1 profile: keys renamed to flowmd_*', v1LegacyLeft.length === 0, v1LegacyLeft.join(', ') || 'none left');
  check('v1 profile: video IDs got the marrow_8:: prefix',
    !!v1Videos['marrow_8::anatomy__v1'] && !('anatomy__v1' in v1Videos), JSON.stringify(v1Videos));
  check('v1 profile: schema version = 3', v1.version === '3', String(v1.version));

  // --- Run D: both old and new keys present → new wins, old removed; a
  // second load is a no-op (idempotent). ---
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('flowmd_schema_version', '2');
    localStorage.setItem('flowmd_is_configured', 'true');
    localStorage.setItem('flowmd_tutorial_seen', 'true');
    localStorage.setItem('marrow_planner_theme', 'dark');
    localStorage.setItem('flowmd_theme', 'light');
    localStorage.setItem('marrow_planner_personal', JSON.stringify({ doctorName: 'Old Name', isSynced: false, syncEmail: '' }));
    localStorage.setItem('flowmd_personal', JSON.stringify({ doctorName: 'New Name', isSynced: false, syncEmail: '' }));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const both = await snapshot(page);
  check('New-key-wins: existing flowmd_theme kept', both.values['flowmd_theme'] === 'light', String(both.values['flowmd_theme']));
  check('New-key-wins: legacy key removed', !both.keys.includes('marrow_planner_theme'), 'marrow_planner_theme still present');
  check('New-key-wins: newer personal kept', /New Name/.test(both.values['flowmd_personal'] || ''),
    String(both.values['flowmd_personal']).slice(0, 40));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const again = await snapshot(page);
  check('Migration is idempotent on second load',
    again.version === '3' && again.values['flowmd_theme'] === 'light' &&
    !again.keys.some((k) => k.startsWith('marrow_planner_')),
    `version=${again.version}`);

  // --- Run E: corrupt JSON under legacy keys → app survives, migration completes. ---
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('flowmd_schema_version', '2');
    localStorage.setItem('flowmd_is_configured', 'true');
    localStorage.setItem('flowmd_tutorial_seen', 'true');
    localStorage.setItem('marrow_planner_completed_videos', '{{{not json');
    localStorage.setItem('marrow_planner_goals', 'definitely not json');
    localStorage.setItem('marrow_planner_streak', '{broken');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  const corrupt = await snapshot(page);
  check('Corrupt JSON: no page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ').slice(0, 200));
  check('Corrupt JSON: schema version = 3', corrupt.version === '3', String(corrupt.version));
  check('Corrupt JSON: dashboard still renders', corrupt.main.length > 100, String(corrupt.main.length));

  await browser.close();

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Migration test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
