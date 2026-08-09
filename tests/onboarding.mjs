/* ============================================================
   FlowMD Onboarding Wizard E2E — verifies the 3-step first-run
   wizard end-to-end (fresh flow, prepladder gate, back nav,
   persistence, legacy tutorial_seen migration, error hygiene).

   Usage: node tests/onboarding.mjs [port]
   Run from the marrow-planner project root.
   ============================================================ */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8124;
const BASE = `http://127.0.0.1:${port}`;
const SHOT_DIR = join(root, 'tests', 'screenshots');

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

const FLOW_KEYS = [
  'flowmd_is_configured', 'flowmd_tutorial_seen', 'flowmd_active_source',
  'flowmd_personal', 'flowmd_plans_v2',
  'marrow_planner_theme', 'marrow_planner_theme_style', 'marrow_planner_personal',
  'marrow_planner_goals', 'marrow_planner_completed_videos', 'marrow_planner_daily_history',
  'marrow_planner_queue_completed_in_batch', 'marrow_planner_queue_batch_videos'
];

async function wipeStorage(page) {
  await page.evaluate((keys) => keys.forEach((k) => localStorage.removeItem(k)), FLOW_KEYS);
}

function wireErrors(page, errors) {
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
}

async function attr(page, sel, name) {
  return page.locator(sel).evaluate((el, n) => el.getAttribute(n), name);
}

async function hasClass(page, sel, cls) {
  return page.locator(sel).evaluate((el, c) => el.classList.contains(c), cls);
}

async function run() {
  await mkdir(SHOT_DIR, { recursive: true }).catch(() => {});
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const errors = [];

  // ---- Scenario A: fresh first-run, full wizard flow ----
  {
    const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
    const page = await context.newPage();
    wireErrors(page, errors);

    await page.goto(`${BASE}/`);
    await wipeStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Trigger check
    check('Wizard shows on first run (no config)',
      (await page.locator('.obw-card').count()) > 0);
    check('Wizard step 1 label correct',
      (await page.locator('.obw-card').innerText()).includes('FIRST SETUP · STEP 1 OF 3'));
    check('Dashboard is gated while unconfigured',
      (await page.locator('#study-plan-config').count()) === 0);

    // Step 1 — study source
    const optCount = await page.locator('.obw-option').count();
    check('Step 1 renders 3 study-source options', optCount === 3, `found ${optCount}`);
    check('Marrow 8 pre-selected by default',
      await hasClass(page, '.obw-option[data-source="marrow_8"]', 'checked'));
    check('Next enabled with valid default source',
      !(await page.locator('#obw-next').isDisabled()));

    await page.locator('.obw-option[data-source="prepladder_x"]').click();
    await page.waitForTimeout(200);
    check('Prepladder X option marked upcoming',
      await hasClass(page, '.obw-option[data-source="prepladder_x"]', 'upcoming'));
    check('Next DISABLED while prepladder_x selected',
      await page.locator('#obw-next').isDisabled());
    const toastText = await page.locator('#toast-container').innerText().catch(() => '');
    check('Prepladder X shows "coming soon" toast',
      /coming soon|future update/i.test(toastText), toastText.slice(0, 60));

    await page.locator('.obw-option[data-source="marrow_6_5"]').click();
    await page.waitForTimeout(200);
    check('Marrow 6.5 selection sticks after re-render',
      await hasClass(page, '.obw-option[data-source="marrow_6_5"]', 'checked'));
    check('Next re-enabled after valid source',
      !(await page.locator('#obw-next').isDisabled()));
    check('Back button hidden on step 1',
      !(await page.locator('#obw-back').isVisible()));

    await page.screenshot({ path: join(SHOT_DIR, 'onboarding-step1-dark.png') });

    // Step 2 — name + theme
    await page.locator('#obw-next').click();
    await page.waitForTimeout(250);
    check('Step 2 label correct',
      (await page.locator('.obw-card').innerText()).includes('FIRST SETUP · STEP 2 OF 3'));
    check('Name input rendered', (await page.locator('#obw-name').count()) === 1);
    check('Theme grid renders 2 options',
      (await page.locator('.obw-theme-opt').count()) === 2);
    check('Dark theme pre-checked',
      await hasClass(page, '.obw-theme-opt[data-theme-val="dark"]', 'checked'));

    await page.locator('#obw-name').fill('Dr. Safi Test');
    await page.locator('.obw-theme-opt[data-theme-val="light"]').click();
    await page.waitForTimeout(200);
    check('Light theme applies live',
      (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light');
    check('Light theme option marked checked',
      await hasClass(page, '.obw-theme-opt[data-theme-val="light"]', 'checked'));

    await page.screenshot({ path: join(SHOT_DIR, 'onboarding-step2-light.png') });

    // Back navigation retains choices
    await page.locator('#obw-back').click();
    await page.waitForTimeout(250);
    check('Back returns to step 1',
      (await page.locator('.obw-card').innerText()).includes('FIRST SETUP · STEP 1 OF 3'));
    check('Source choice retained after back',
      await hasClass(page, '.obw-option[data-source="marrow_6_5"]', 'checked'));

    await page.locator('#obw-next').click();
    await page.waitForTimeout(250);
    check('Forward returns to step 2',
      (await page.locator('.obw-card').innerText()).includes('FIRST SETUP · STEP 2 OF 3'));

    // Step 3 — summary + finish
    await page.locator('#obw-next').click();
    await page.waitForTimeout(250);
    const step3Text = await page.locator('.obw-card').innerText();
    check('Step 3 label correct',
      step3Text.includes('FIRST SETUP · STEP 3 OF 3'));
    check('Step 3 shows "all set" summary',
      /You're all set/.test(step3Text));
    check('Step 3 summary echoes chosen source',
      step3Text.includes('Marrow Edition 6.5'), step3Text.slice(0, 80));
    check('Step 3 summary echoes chosen theme',
      step3Text.includes('Light Mode'));
    check('Step 3 renders 3 guide items',
      (await page.locator('.obw-guide-item').count()) === 3);
    check('Finish CTA text on step 3',
      /Got it/.test(await page.locator('#obw-next').innerText()));

    await page.screenshot({ path: join(SHOT_DIR, 'onboarding-step3-light.png') });

    await page.locator('#obw-next').click();
    await page.waitForTimeout(600);

    // Finish → dashboard
    check('Wizard removed after finishing',
      (await page.locator('.obw-card').count()) === 0);
    check('Dashboard renders after finishing',
      (await page.locator('#study-plan-config').count()) === 1);

    // Persisted state
    const stored = await page.evaluate(() => ({
      configured: localStorage.getItem('flowmd_is_configured'),
      source: localStorage.getItem('flowmd_active_source'),
      personal: localStorage.getItem('marrow_planner_personal') || localStorage.getItem('flowmd_personal'),
      theme: localStorage.getItem('marrow_planner_theme')
    }));
    check('flowmd_is_configured=true persisted', stored.configured === 'true', String(stored.configured));
    check('activeSource=marrow_6_5 persisted', stored.source === 'marrow_6_5', String(stored.source));
    check('doctorName persisted', /Dr\. Safi Test/.test(stored.personal || ''), String(stored.personal));
    check('theme=light persisted', stored.theme === 'light', String(stored.theme));

    await page.screenshot({ path: join(SHOT_DIR, 'onboarding-after-dashboard-light.png') });

    // Reload — no wizard, straight to dashboard
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    check('Wizard does NOT reappear after reload',
      (await page.locator('.obw-card').count()) === 0);
    check('Dashboard persists after reload',
      (await page.locator('#study-plan-config').count()) === 1);

    await context.close();
  }

  // ---- Scenario B: legacy flowmd_tutorial_seen migration ----
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    wireErrors(page, errors);

    await page.goto(`${BASE}/`);
    await wipeStorage(page);
    await page.evaluate(() => localStorage.setItem('flowmd_tutorial_seen', 'true'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    check('Legacy tutorial_seen=true skips wizard (migrated to configured)',
      (await page.locator('.obw-card').count()) === 0);
    check('Legacy user lands on dashboard',
      (await page.locator('#study-plan-config').count()) === 1);

    await context.close();
  }

  await browser.close();

  // Error hygiene
  check('No console errors across onboarding flow', errors.length === 0,
    errors.slice(0, 3).join(' | ').slice(0, 200));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Onboarding test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
