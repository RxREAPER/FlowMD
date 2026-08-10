/* ============================================================
   FlowMD Smoke Test — verifies the app boots and core features render.
   Usage: node tests/smoke.mjs [port]
   Run from the marrow-planner project root.
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8123;
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

async function clickNav(page, view) {
  const btn = page.locator(`.android-nav-item[data-view="${view}"]`);
  if (await btn.count()) {
    await btn.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

// Force-close any dynamic overlays so they don't intercept later clicks
async function dismissOverlays(page) {
  await page.evaluate(() => {
    // Remove dynamically-injected fullscreen overlays (e.g. source settings modal)
    Array.from(document.querySelectorAll('div')).forEach(el => {
      if (el.style.position === 'fixed' && el.style.zIndex === '99999') el.remove();
    });
    // Hide static modals (keep in DOM — they are re-used later)
    ['#source-settings-modal', '#bottom-sheet-overlay'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    });
    const overlay = document.querySelector('.modal-overlay[style*="display: flex"]');
    if (overlay) overlay.style.display = 'none';
  });
  await page.waitForTimeout(150);
}

async function run() {
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  // Pre-seed localStorage to skip onboarding wizard
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    localStorage.setItem('flowmd_is_configured', 'true');
    localStorage.setItem('flowmd_tutorial_seen', 'true');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  check('Page loads without page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));
  check('No console errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 200));

  // App shell present
  check('Topbar renders', await page.locator('.topbar').count() > 0);
  check('Bottom nav renders', await page.locator('.android-bottom-nav').count() > 0);
  check('Main content area renders', await page.locator('#app-main').count() > 0);

  // Dashboard view (default)
  const dashText = await page.locator('#app-main').innerText();
  check('Dashboard view renders content', dashText.length > 50);

  // Computed-style spot checks: guard against a silently broken CSS class
  // rename (text-based checks can't see unstyled elements).
  const styles = await page.evaluate(() => {
    const g = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, radius: s.borderRadius, color: s.color };
    };
    return {
      topbar: g('.topbar'),
      configCard: g('#study-plan-config'),
      navItem: g('.android-nav-item:not(.active)'),
      navActive: g('.android-nav-item.active')
    };
  });
  const isPainted = (s) => s && s.bg && s.bg !== 'rgba(0, 0, 0, 0)' && s.bg !== 'transparent';
  check('Topbar has a painted background (fm- CSS applied)', isPainted(styles.topbar), JSON.stringify(styles.topbar && styles.topbar.bg));
  check('Plan config card is styled (bg + radius)', isPainted(styles.configCard) && parseFloat(styles.configCard.radius) > 0,
    JSON.stringify(styles.configCard && { bg: styles.configCard.bg, radius: styles.configCard.radius }));
  check('Active nav item is visually distinct (cyan vs grey)',
    !!styles.navItem && !!styles.navActive && styles.navActive.color !== styles.navItem.color,
    `active=${styles.navActive && styles.navActive.color} inactive=${styles.navItem && styles.navItem.color}`);

  // Study plan config is always-visible inline on the dashboard
  const configVisible = await page.locator('#study-plan-config').isVisible();
  check('Study plan config card is visible inline on dashboard', configVisible === true);
  check('Study plan config shows Plan A form', await page.locator('#goal-plan-a-form').isVisible());
  check('Study plan config has plan selector', await page.locator('#goal-plan-select').count() === 1);

  // Curriculum view
  await clickNav(page, 'curriculum');
  const curriculumSubjects = await page.locator('.curriculum-sub-row').count();
  check('Curriculum view shows subject rows', curriculumSubjects > 5, `found ${curriculumSubjects}`);

  // Subject detail
  if (curriculumSubjects > 0) {
    await page.locator('.curriculum-sub-row').first().click();
    await page.waitForTimeout(500);
    const subjText = await page.locator('#app-main').innerText();
    check('Subject detail view renders chapters', subjText.includes('Chapter') || subjText.includes('chapter') || subjText.length > 100);
  } else {
    check('Subject detail view renders chapters', false, 'no subject row to click');
  }

  // Analytics view
  await clickNav(page, 'analytics');
  check('Analytics view renders content', (await page.locator('#app-main').innerText()).length > 50);

  // Profile view
  await clickNav(page, 'profile');
  check('Profile view renders content', (await page.locator('#app-main').innerText()).length > 50);

  // Search modal
  const searchBtn = await page.locator('#btn-toggle-search').count();
  check('Search button present', searchBtn > 0);
  if (searchBtn) {
    await page.locator('#btn-toggle-search').click();
    await page.waitForTimeout(300);
    check('Search modal opens', await page.locator('#spotlight-search-modal').evaluate(el => el.style.display !== 'none'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Theme toggle
  const themeBtn = await page.locator('#theme-toggle-btn').count();
  check('Theme toggle present', themeBtn > 0);
  const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('#theme-toggle-btn').click();
  await page.waitForTimeout(200);
  const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('Theme switching works', themeBefore === 'dark' && themeAfter === 'light');

  // Source settings modal (via topbar source badge)
  const srcBadge = await page.locator('#topbar-source-badge').count();
  check('Source badge present', srcBadge > 0);
  if (srcBadge) {
    await page.locator('#topbar-source-badge').click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    const dynModal = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some(el => el.style.zIndex === '99999' && el.style.position === 'fixed');
    });
    check('Source settings modal opens (dynamic)', dynModal === true);
    await dismissOverlays(page);
  }

  // Toast system
  await page.evaluate(() => window.showToast ? window.showToast('smoke test', 'success', 'Test') : null);
  await page.waitForTimeout(300);
  check('Toast renders', await page.locator('#toast-container > div').count() > 0);

  // --- Returning marrow_6_5 user: the lazy data file is no longer eager (Task C5),
  // so the boot path must auto-load it — otherwise the user lands on an empty
  // dashboard/curriculum. Fresh context with a pre-seeded 6.5 source.
  {
    const ctx65 = await browser.newContext();
    const page65 = await ctx65.newPage();
    const errs65 = [];
    page65.on('console', (msg) => { if (msg.type() === 'error') errs65.push(msg.text()); });
    page65.on('pageerror', (err) => errs65.push(String(err)));
    await page65.goto(`${BASE}/`);
    await page65.evaluate(() => {
      localStorage.setItem('flowmd_is_configured', 'true');
      localStorage.setItem('flowmd_active_source', 'marrow_6_5');
      localStorage.setItem('marrow_planner_theme', 'dark');
      localStorage.setItem('marrow_planner_schema_version', '2');
      localStorage.setItem('marrow_planner_personal', JSON.stringify({ doctorName: 'Dr. Returnee' }));
    });
    await page65.reload();
    await page65.waitForLoadState('networkidle');
    await clickNav(page65, 'curriculum');
    // Wait for the async data load + re-render (not a fixed timeout).
    await page65.waitForFunction(
      () => document.querySelectorAll('.curriculum-sub-row').length > 5,
      { timeout: 10000 }
    ).catch(() => {});
    const subjects65 = await page65.locator('.curriculum-sub-row').count();
    check('Returning marrow_6_5 user gets curriculum after lazy boot load', subjects65 > 5, `found ${subjects65}`);
    check('Returning 6.5 user has no console errors on lazy boot', errs65.length === 0, errs65.join(' | ').slice(0, 200));
    await ctx65.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
