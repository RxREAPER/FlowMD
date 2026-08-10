/* ============================================================
   FlowMD Metrics Unit Tests — window.FlowMD.metrics
   In-browser assertions for the pure metrics/queue-engine module,
   run against a seeded profile so results are deterministic.

   Usage: node tests/metrics.mjs [port]
   Run from the flowmd project root.
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8126;
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

// Seed a deterministic profile: Plan A on Anatomy, 8/day, one video completed.
const SEED = {
  'flowmd_is_configured': 'true',
  'flowmd_tutorial_seen': 'true',
  'flowmd_active_source': 'marrow_8',
  'flowmd_plans_v2': JSON.stringify([{
    id: 'plan_a', label: 'Plan A', accentColor: '#7c3aed',
    targetSubject: 'Anatomy', targetDate: '2999-01-01',
    videosPerDay: 8, dailyTargetHours: 3.5, targetUnits: [],
    queueBatchVideoIds: [], extraBatchesCompletedToday: 0
  }]),
  'marrow_planner_completed_videos': JSON.stringify({ 'marrow_8::anatomy__v1': true }),
  'marrow_planner_daily_history': '{}',
  'marrow_planner_daily_batch': '0',
  'marrow_planner_queue_completed_in_batch': '0',
  'marrow_planner_queue_batch_videos': '[]'
};

async function run() {
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(`${BASE}/`);
  await page.evaluate((seed) => {
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
  }, SEED);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  const r = await page.evaluate(() => {
    const m = window.FlowMD.metrics;
    const plan = m.getPlanById('plan_a');
    const queue = m.getTodayQueueForPlan(plan);
    const stats = m.getSyllabusStats();
    const metricsFor = (videos) => m.computeMetricsFromVideos(videos);
    const scopeMetrics = m.getMetricsForModalScope('Anatomy', [], 'marrow_8');
    const firstSubject = m.getSubjectOrSyllabusMetrics('');
    const eta = m.calculateFinishETA({ remainingVideos: 80 }, 8);
    const cd = m.getDeadlineCountdown('2999-01-01');
    const sourceStats = m.getSyllabusStatsForSource('marrow_6_5');
    return {
      planLabel: plan && plan.label,
      queueVideos: queue.videos.length,
      queueTargetPace: queue.baseTargetPace,
      queueSubject: queue.subjectName,
      allSubjectDone: queue.allSubjectDone,
      statsSubjects: stats.subjectsStats.length,
      statsTotalVideos: stats.totalVideos,
      statsCompleted: stats.completedVideos,
      completed: metricsFor([{ id: 'x', durationMins: 60 }, { id: 'y', durationMins: 30, durationSecs: 30 }]),
      scopeTotalVideos: scopeMetrics.totalVideos,
      scopeTotalChapters: scopeMetrics.totalChapters,
      firstSubjectName: firstSubject.name,
      firstSubjectVideos: firstSubject.totalVideos,
      etaDays: eta.daysNeeded,
      deadlineDays: cd.days,
      deadlineText: cd.text,
      sourceStatsSubjects: sourceStats.subjectsStats.length,
      activeSourceAfter: window.FlowMD.store.getState().activeSource,
      allQueues: m.getAllPlanQueues().length,
      actionQueueSubject: m.getTodaysActionQueue().subjectName
    };
  });

  check('getPlanById finds seeded Plan A', r.planLabel === 'Plan A', String(r.planLabel));
  check('getTodayQueueForPlan builds a queue of videosPerDay', r.queueVideos === 8, String(r.queueVideos));
  check('queue subject is Anatomy', r.queueSubject === 'Anatomy', String(r.queueSubject));
  check('queue not all-done with 1/8 completed', r.allSubjectDone === false, String(r.allSubjectDone));
  check('getSyllabusStats covers 20 subjects', r.statsSubjects === 20, String(r.statsSubjects));
  check('getSyllabusStats totals >1000 videos', r.statsTotalVideos > 1000, String(r.statsTotalVideos));
  check('getSyllabusStats counts the seeded completion', r.statsCompleted === 1, String(r.statsCompleted));
  check('computeMetricsFromVideos counts totals', r.completed.totalVideos === 2 && r.completed.completedVideos === 0,
    JSON.stringify(r.completed));
  check('computeMetricsFromVideos sums hours (60 + 30.5 = 90.5m = 1.5h)', r.completed.totalHours === '1.5', r.completed.totalHours);
  check('getMetricsForModalScope totals Anatomy videos', r.scopeTotalVideos > 0, String(r.scopeTotalVideos));
  check('getMetricsForModalScope reports chapter count', r.scopeTotalChapters > 5, String(r.scopeTotalChapters));
  check('getSubjectOrSyllabusMetrics("") falls back to first subject', r.firstSubjectName.length > 0 && r.firstSubjectVideos > 0,
    r.firstSubjectName);
  check('calculateFinishETA: 80 videos at 8/day = 10 days', r.etaDays === 10, String(r.etaDays));
  check('getDeadlineCountdown returns positive days for 2999', r.deadlineDays > 0 && typeof r.deadlineText === 'string',
    r.deadlineText);
  check('getSyllabusStatsForSource switches dataset (6.5 has subjects)', r.sourceStatsSubjects > 0, String(r.sourceStatsSubjects));
  check('getSyllabusStatsForSource restores activeSource', r.activeSourceAfter === 'marrow_8', String(r.activeSourceAfter));
  check('getAllPlanQueues returns one queue', r.allQueues === 1, String(r.allQueues));
  check('getTodaysActionQueue legacy wrapper works', r.actionQueueSubject === 'Anatomy', String(r.actionQueueSubject));
  check('No page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ').slice(0, 200));

  await browser.close();

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Metrics test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
