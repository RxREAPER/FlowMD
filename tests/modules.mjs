/* ============================================================
   FlowMD Module Registry Contract Test
   Asserts the window.FlowMD modules the app depends on are
   loaded and expose the functions this plan's interfaces require.
   Each decomposition task appends its module to EXPECTED before
   extraction, so the test fails first (module not loaded) and
   turns green once wiring is complete.

   Usage: node tests/modules.mjs [port]
   Run from the flowmd project root (marrow-planner or worktree).
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8125;
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

// Module -> required exports. Tasks append their module before extraction.
const EXPECTED = {
  store: ['getState', 'safeParse', 'migrateStateSchema', 'loadState', 'saveState',
          'markStudyActivity', 'getStudyStreak', 'mergePlansLocalWins'],
  sourceData: ['SOURCE_DATA', 'qualifySourceData', 'initSourceData', 'getDataset',
               'getSubjectChapters', 'getScopedChapterNames', 'getPlanScopeVideos',
               'getBulkChapterKey', 'isChapterBulkCompleted', 'getChapterVideoIds',
               'getDailyCountsExcludingBulk', 'getSourceLabel', 'getEditionShort'],
  metrics: ['getSyllabusStatsForSource', 'getDeadlineCountdown', 'calculateFinishETA',
            'computeMetricsFromVideos', 'getSubjectOrSyllabusMetricsForPlan',
            'getMetricsForModalScope', 'getTodayQueueForPlan', 'getAllPlanQueues',
            'getTodaysActionQueue', 'getPlanById', 'getSyllabusStats',
            'getSubjectOrSyllabusMetrics'],
  theme: ['applyTheme', 'updateTopbarInitials', 'updateTopbarSource', 'updateOfflineIndicator', 'renderEditionChip'],
  search: ['performDeepSearch', 'openSpotlightModal', 'closeSpotlightModal', 'renderSpotlightResults']
};

async function run() {
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];

  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);

  const registry = await page.evaluate(() => {
    const out = {};
    for (const mod of Object.keys(window.FlowMD || {})) {
      out[mod] = typeof window.FlowMD[mod] === 'object' ? Object.keys(window.FlowMD[mod]) : [];
    }
    return out;
  });

  for (const [mod, fns] of Object.entries(EXPECTED)) {
    check(`window.FlowMD.${mod} is registered`, Array.isArray(registry[mod]),
      `found: ${Object.keys(registry).join(', ')}`);
    fns.forEach(fn => {
      check(`${mod}.${fn} is a function`,
        registry[mod] && registry[mod].includes(fn),
        `module exports: ${(registry[mod] || []).join(', ')}`);
    });
  }

  check('No page errors during module load', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | ').slice(0, 200));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Module registry test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
