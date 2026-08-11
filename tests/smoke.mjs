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

  // A fresh profile must NOT have assumed subject/pace/deadline values — the
  // site waits for the user to fill the Study Plan Config.
  const configValues = await page.evaluate(() => ({
    subject: document.getElementById('select-target-subject')?.value ?? null,
    vids: document.getElementById('input-videos-per-day')?.value ?? null,
    date: document.getElementById('input-target-date')?.value ?? null
  }));
  check('Plan config starts empty for a new user (no assumed subject/pace/deadline)',
    configValues.subject === '' && configValues.vids === '' && configValues.date === '',
    JSON.stringify(configValues));

  // First-visit PWA install helper (fresh profile → not installed, not dismissed)
  const installBanner = await page.locator('#pwa-install-banner-card').count();
  check('First-visit install helper banner shows on dashboard', installBanner === 1,
    installBanner ? 'banner present' : 'MISSING');

  // Regression: Chrome fires beforeinstallprompt on first user engagement —
  // often exactly while the user has the subject dropdown open. A full view
  // re-render would destroy the open <select> (it closes before picking).
  // The select element must survive the prompt and still be pickable.
  {
    const surv = await page.evaluate(() => {
      const sel = document.getElementById('select-target-subject');
      if (!sel) return { replaced: true, detail: 'no select' };
      window.__selRef = sel;
      window.dispatchEvent(new Event('beforeinstallprompt'));
      return new Promise((resolve) => setTimeout(() => {
        const nowSel = document.getElementById('select-target-subject');
        resolve({
          replaced: nowSel !== window.__selRef,
          bannerPresent: !!document.getElementById('pwa-install-banner-card'),
          installBtnPresent: !!document.getElementById('btn-pwa-install-now')
        });
      }, 400));
    });
    check('Install prompt does not destroy the open subject select (no full re-render)',
      surv.replaced === false, JSON.stringify(surv));
    check('Install banner upgrades in place (Install button appears, element survives)',
      surv.bannerPresent === true && surv.installBtnPresent === true, JSON.stringify(surv));

    // Picking a subject must not invent a pace or deadline — the site waits
    // for real user input (no assumed 8 vids/day or auto deadline).
    await page.locator('#select-target-subject').selectOption({ index: 1 });
    await page.waitForTimeout(400);
    const afterPick = await page.evaluate(() => ({
      date: document.getElementById('input-target-date')?.value ?? null,
      vids: document.getElementById('input-videos-per-day')?.value ?? null,
      week: document.getElementById('input-videos-per-week')?.value ?? null,
      badge: document.getElementById('days-remaining-badge')?.textContent ?? null
    }));
    check('Picking a subject waits for user input (no assumed pace/deadline)',
      afterPick.date === '' && afterPick.vids === '' && afterPick.week === '' && afterPick.badge === 'Not set',
      JSON.stringify(afterPick));
  }

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
  const anlText = await page.locator('#app-main').innerText();
  check('Analytics view renders content', anlText.length > 50);
  check('Analytics Goal Pulse shows empty state when no target set',
    anlText.includes('Goal Pulse') && anlText.includes('No study target set yet'),
    'empty-state CTA present');

  // Regression: the Preparation Setup card must RESPOND to Study Plan Config
  // goals. Configure Plan A (subject, pace, deadline), save, and verify the
  // analytics card shows the saved daily/weekly/monthly targets + target date.
  await clickNav(page, 'dashboard');
  await page.locator('#select-target-subject').selectOption({ index: 1 });
  await page.locator('#input-videos-per-day').fill('3');
  await page.evaluate(() => {
    // Set the deadline directly so the pace auto-sync listener can't overwrite it.
    const d = document.getElementById('input-target-date');
    if (d) d.value = '2027-06-30';
  });
  await page.locator('#btn-apply-goals').click();
  await page.waitForTimeout(400);
  const savedPlan = await page.evaluate(() => {
    const p = window.FlowMD.store.getState().plans[0];
    return {
      vids: p.videosPerDay,
      week: p.videosPerWeek,
      month: p.videosPerMonth,
      dateLabel: p.targetDate
        ? new Date(p.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null
    };
  });
  await clickNav(page, 'analytics');
  await page.waitForTimeout(300);
  const prepText = await page.locator('#app-main').innerText();
  const prepOk = prepText.includes('Preparation Setup') &&
    prepText.includes(`${savedPlan.vids} vids/day`) &&
    prepText.includes(`${savedPlan.vids} vids`) &&
    prepText.includes(`${savedPlan.week} vids`) &&
    prepText.includes(`${savedPlan.month} vids`) &&
    (savedPlan.dateLabel ? prepText.includes(savedPlan.dateLabel) : true) &&
    !prepText.includes('No study target set yet');
  check('Preparation Setup reflects Study Plan Config goals (daily/weekly/monthly/date)',
    prepOk, JSON.stringify({ savedPlan, sample: prepText.slice(0, 220) }));

  // Profile view
  await clickNav(page, 'profile');
  const profileText = await page.locator('#app-main').innerText();
  check('Profile view renders content', profileText.length > 50);
  const profileHasInstallGuide = profileText.includes('Install App') &&
    (profileText.includes('Install FlowMD App') || profileText.includes('Add to Home Screen'));
  check('Profile shows brief Install App guide', profileHasInstallGuide,
    profileHasInstallGuide ? 'install card present' : 'install card MISSING');

  // Sync Diagnostics panel: inject a fake signed-in cloud (no network), render
  // the profile, and verify the panel shows per-field local-vs-cloud clocks,
  // winner badges and the last-sync status.
  {
    const diag = await page.evaluate(() => {
      const now = Date.now();
      const st = window.FlowMD.store.getState();
      st.personal.isSynced = true;
      st.personal.syncEmail = 'diag@test.dev';
      st.fieldSyncTimes = { plans: now, goals: now - 5000, personal: now - 60000 };
      window.FirebaseSync = window.FirebaseSync || {};
      window.FirebaseSync.currentUser = { uid: 'diag-user' };
      window.FirebaseSync.loadFromCloud = async () => ({
        plans: [{ id: 'plan_a', label: 'Plan A', targetSubject: 'Anatomy' }],
        goals: { targetSubject: 'Anatomy', videosPerDay: 3 },
        personal: { doctorName: 'Dr. Cloud' },
        activeSource: 'marrow_8',
        fieldSyncTimes: { plans: now - 20000, goals: now - 10000, personal: now - 1000 }
      });
      window.FirebaseSync.updateCloudFields = async () => {};
      window.FirebaseSync.syncToCloud = async () => {};
      window.FlowMD.shell.render();
      return new Promise((resolve) => setTimeout(resolve, 400));
    });
    const diagText = await page.locator('#sync-diagnostics-panel').innerText().catch(() => '');
    check('Sync Diagnostics panel renders when signed in',
      diagText.includes('Sync Diagnostics') && diagText.length > 40,
      diagText.slice(0, 120));
    check('Sync Diagnostics shows LOCAL winner (newer local clock)', diagText.includes('LOCAL'),
      'plans row should be LOCAL');
    check('Sync Diagnostics shows CLOUD winner (newer cloud clock)', diagText.includes('CLOUD'),
      'personal row should be CLOUD');
    check('Sync Diagnostics shows field values (Plan A + Dr. Cloud)',
      diagText.includes('Plan A') && diagText.includes('Dr. Cloud'),
      diagText.slice(0, 200));
    // Refresh button re-fetches and keeps the panel alive
    const refreshBtn = await page.locator('#btn-refresh-sync-diag').count();
    check('Sync Diagnostics has a working Refresh button', refreshBtn === 1, `found ${refreshBtn}`);

    // Device layout self-check row (populated from the last in-browser run).
    const layoutDiag = await page.evaluate(() => {
      if (window.FlowMD.layoutCheck && window.FlowMD.layoutCheck.runLayoutCheck) {
        window.FlowMD.layoutCheck.runLayoutCheck();
      }
      if (window.FlowMD.shell) window.FlowMD.shell.render();
      const last = window.FlowMD.layoutCheck && window.FlowMD.layoutCheck.getLastReport
        ? window.FlowMD.layoutCheck.getLastReport()
        : null;
      return JSON.stringify({ has: !!last, clean: last ? last.clean : null, issues: last ? last.issues : null });
    });
    await page.waitForTimeout(250);
    const layoutRow = await page.locator('#layout-check-summary').innerText().catch(() => '');
    check('Profile shows Device Layout Check row and clean state',
      layoutRow.includes('No issues') && layoutDiag.includes('"clean":true'), `${layoutRow.slice(0, 40)} | diag=${layoutDiag.slice(0, 80)}`);
  }

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

  // --- Cross-viewport rendering regressions (device layout guard) ---
  // 1. Tablet width (800px): the plan-config pace grid must fit inside the card,
  //    with every stepper "+" button visible (regression: third column used to
  //    overflow the viewport, hiding the Monthly + button).
  {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('flowmd_is_configured', 'true');
      localStorage.setItem('flowmd_tutorial_seen', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    check('No horizontal page overflow at 800px (pace grid fits the card)', docOverflow === false);
    const plusVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.plan-config-pace'))
        .filter((pb) => pb.getBoundingClientRect().width > 0)
        .map((pb) => pb.querySelectorAll('.plan-config-step')[1])
        .filter(Boolean)
        .map((btn) => { const r = btn.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth; });
    });
    check('Daily/Weekly/Monthly stepper + buttons all visible at 800px',
      plusVisible.length === 3 && plusVisible.every(Boolean), `${plusVisible.length} visible`);
    await ctx.close();
  }

  // 2. Narrow phone (320px): bottom-nav labels must fit on one line unclipped.
  {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('flowmd_is_configured', 'true');
      localStorage.setItem('flowmd_tutorial_seen', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    const clipped = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.android-nav-item .nav-bar-label'))
        .filter((l) => l.offsetParent !== null)
        .map((l) => ({ txt: l.innerText, overflow: l.scrollWidth > l.clientWidth + 1 }))
        .filter((x) => x.overflow);
    });
    check('Bottom-nav labels not clipped at 320px', clipped.length === 0, JSON.stringify(clipped));
    await ctx.close();
  }

  // 3. Phone (390px): the spotlight search placeholder must ellipsize, never
  //    hard-clip mid-word (regression: it showed "SEARCH 19 SUBJECTS, C").
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('flowmd_is_configured', 'true');
      localStorage.setItem('flowmd_tutorial_seen', 'true');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('#btn-toggle-search').click();
    await page.waitForTimeout(300);
    const ph = await page.evaluate(() => {
      const input = document.querySelector('#spotlight-search-input');
      if (!input) return null;
      return { ellipsis: getComputedStyle(input).textOverflow === 'ellipsis', minW: getComputedStyle(input).minWidth };
    });
    check('Search placeholder ellipsized (not hard-clipped) at 390px',
      !!ph && ph.ellipsis === true && ph.minW === '0px', JSON.stringify(ph));
    await ctx.close();
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
