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
    ['#source-settings-modal', '#bottom-sheet-overlay', '#pwa-install-modal-overlay'].forEach(sel => {
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
      configCard: g('#plan-config-sheet'),
      navItem: g('.android-nav-item:not(.active)'),
      navActive: g('.android-nav-item.active')
    };
  });
  const isPainted = (s) => s && s.bg && s.bg !== 'rgba(0, 0, 0, 0)' && s.bg !== 'transparent';
  check('Topbar has a painted background (fm- CSS applied)', isPainted(styles.topbar), JSON.stringify(styles.topbar && styles.topbar.bg));
  check('Plan config sheet is styled (bg + radius)', isPainted(styles.configCard) && parseFloat(styles.configCard.radius) > 0,
    JSON.stringify(styles.configCard && { bg: styles.configCard.bg, radius: styles.configCard.radius }));
  check('Active nav item is visually distinct (cyan vs grey)',
    !!styles.navItem && !!styles.navActive && styles.navActive.color !== styles.navItem.color,
    `active=${styles.navActive && styles.navActive.color} inactive=${styles.navItem && styles.navItem.color}`);

  // First-visit PWA install modal (fresh profile → not installed, not dismissed)
  const installModal = await page.locator('#pwa-install-modal-overlay.active').count();
  check('First-visit install modal auto-shows on dashboard', installModal === 1,
    installModal ? 'modal present' : 'MISSING');

  // Drop the auto-shown first-visit install modal so it can't intercept
  // the nav clicks below.
  await dismissOverlays(page);

  // Configure Study Plan: bottom sheet opened from the center nav button
  const navHasPlanBtn = await page.locator('#nav-btn-plan-config').count();
  check('Center nav Plan button present', navHasPlanBtn === 1);
  check('Search bar visible on dashboard', await page.locator('#btn-toggle-search').isVisible());
  await page.locator('#nav-btn-plan-config').click();
  await page.waitForTimeout(400);
  const sheetActive = await page.evaluate(() => document.getElementById('plan-config-sheet-overlay')?.classList.contains('active'));
  check('Plan config sheet opens from center nav button', sheetActive === true);
  const sheetText = await page.locator('#plan-config-sheet-content').innerText();
  check('Sheet is titled Configure Study Plan', sheetText.includes('Configure Study Plan'));
  check('Sheet has Plan A and Plan B tabs', await page.locator('.spc-tab').count() === 2);
  check('No Dual-Track toggle remains', await page.locator('#toggle-plan-b').count() === 0);
  check('Sheet shows Plan A form', await page.locator('#goal-plan-a-form').isVisible());
  check('Sheet Focus Chapter chips container renders for Plan A (id chapter-chips-a)',
    await page.locator('#chapter-chips-a').count() === 1);
  check('Sheet chapters count badge renders for Plan A (id chapters-count-a)',
    await page.locator('#chapters-count-a').count() === 1);

  // A fresh profile must NOT have assumed subject/pace/deadline values — the
  // site waits for the user to fill the Configure Study Plan sheet.
  const configValues = await page.evaluate(() => ({
    subject: document.getElementById('select-target-subject')?.value ?? null,
    vids: document.getElementById('input-videos-per-day')?.value ?? null,
    date: document.getElementById('input-target-date')?.value ?? null
  }));
  check('Plan config starts empty for a new user (no assumed subject/pace/deadline)',
    configValues.subject === '' && configValues.vids === '' && configValues.date === '',
    JSON.stringify(configValues));

  // Issue #11: the Daily Tasks (Topics) section was removed from the Plan
  // sheet — topic mode lives on the dashboard's Daily Tasks card only.
  const sheetTextLower = sheetText.toLowerCase();
  check('Plan sheet no longer contains the Daily Tasks topics section (issue #11)',
    !sheetTextLower.includes('topics') && await page.locator('#spc-daily-tasks-mode-switch').count() === 0);

  // Close the sheet (Escape) so later sections can reach the bottom nav.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Capacitor native shell (Android APK): the WebView never fires
  // beforeinstallprompt and never reports display-mode standalone, so the
  // app must treat the shell as installed and suppress the modal entirely.
  {
    const ctxCap = await browser.newContext();
    const pageCap = await ctxCap.newPage();
    await pageCap.addInitScript(() => {
      window.Capacitor = { isNativePlatform: () => true };
    });
    await pageCap.goto(`${BASE}/`);
    await pageCap.evaluate(() => {
      localStorage.setItem('flowmd_is_configured', 'true');
      localStorage.setItem('flowmd_tutorial_seen', 'true');
    });
    await pageCap.reload();
    await pageCap.waitForLoadState('networkidle');
    await pageCap.waitForTimeout(400);
    const capState = await pageCap.evaluate(() => ({
      installed: window.FlowMD.pwaInstall.isInstalled(),
      modal: !!document.getElementById('pwa-install-modal-overlay')
    }));
    check('Capacitor shell is treated as installed', capState.installed === true, JSON.stringify(capState));
    check('Install modal suppressed inside Capacitor shell', capState.modal === false, JSON.stringify(capState));
    await clickNav(pageCap, 'profile');
    await pageCap.waitForTimeout(400);
    const capProfile = await pageCap.locator('#app-main').innerText();
    check('Profile shows installed state inside Capacitor shell',
      capProfile.includes('FlowMD is installed'), capProfile.slice(0, 160));
    await ctxCap.close();
  }

  // Regression: Chrome fires beforeinstallprompt on first user engagement —
  // often exactly while the user has the subject dropdown open. A full view
  // re-render would destroy the open <select> (it closes before picking).
  // The select element must survive the prompt and still be pickable.
  {
    // The subject select lives in the plan-config sheet now — open it first.
    await page.locator('#nav-btn-plan-config').click();
    await page.waitForTimeout(400);

    const surv = await page.evaluate(() => {
      const sel = document.getElementById('select-target-subject');
      if (!sel) return { replaced: true, detail: 'no select' };
      // Reproduce the original scenario: the install modal is visible when
      // Chrome fires beforeinstallprompt.
      if (window.FlowMD.pwaInstall && window.FlowMD.pwaInstall.showInstallModal) {
        window.FlowMD.pwaInstall.showInstallModal();
      }
      window.__selRef = sel;
      window.dispatchEvent(new Event('beforeinstallprompt'));
      return new Promise((resolve) => setTimeout(() => {
        const nowSel = document.getElementById('select-target-subject');
        resolve({
          replaced: nowSel !== window.__selRef,
          modalPresent: !!document.getElementById('pwa-install-modal-overlay'),
          installBtnPresent: !!document.getElementById('btn-pwa-install-now')
        });
      }, 400));
    });
    check('Install prompt does not destroy the open subject select (no full re-render)',
      surv.replaced === false, JSON.stringify(surv));
    check('Install modal upgrades in place (Install button appears, overlay survives)',
      surv.modalPresent === true && surv.installBtnPresent === true, JSON.stringify(surv));

    // Hide the install modal (the plan-config sheet overlay is intentionally
    // left open) so the select click below lands.
    await dismissOverlays(page);

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

    // Close the sheet before navigating on.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // Curriculum view
  await clickNav(page, 'curriculum');
  const curriculumSubjects = await page.locator('.curr-card').count();
  check('Curriculum view shows subject cards', curriculumSubjects > 5, `found ${curriculumSubjects}`);
  // Two-column card grid (issue #16)
  check('Curriculum cards use 2-col grid (issue #16)',
    await page.evaluate(() => getComputedStyle(document.querySelector('.curr-grid')).gridTemplateColumns.split(' ').length) === 2);
  check('Curriculum card has icon header + stats + bar (issue #16)',
    await page.locator('.curr-card').first().evaluate(el =>
      !!el.querySelector('.curr-card-head') && !!el.querySelector('.curr-card-stat-num') && !!el.querySelector('.curr-card-bar-fill')));
  check('Curriculum card bottom bar width matches %',
    await page.evaluate(() => {
      const card = document.querySelector('.curr-card');
      const fill = card && card.querySelector('.curr-card-bar-fill');
      const pctEl = card && card.querySelector('.curr-card-pct');
      if (!fill || !pctEl) return false;
      const pct = parseInt(pctEl.textContent, 10);
      const w = parseFloat(getComputedStyle(fill).width);
      const max = parseFloat(getComputedStyle(fill.parentElement).width);
      return Math.abs(w / max * 100 - pct) <= 2 || (pct === 0 && w === 0);
    }));
  check('Search bar hidden on curriculum', !(await page.locator('#btn-toggle-search').isVisible()));

  // Collapsible "How completion is counted" legend (issue #15)
  {
    check('Curriculum legend starts collapsed (issue #15)',
      await page.locator('#curriculum-legend.is-collapsed').count() === 1);
    check('Legend body hidden while collapsed',
      !(await page.locator('#curriculum-legend-body').isVisible()));
    await page.locator('#curriculum-legend-toggle').click();
    await page.waitForTimeout(200);
    check('Legend expands on toggle click',
      await page.locator('#curriculum-legend.is-collapsed').count() === 0 &&
      await page.locator('#curriculum-legend-body').isVisible());
    const persisted = await page.evaluate(() => localStorage.getItem('flowmd.curriculumLegendCollapsed'));
    check('Legend collapse state persisted (expanded)', persisted === '0', String(persisted));
    await page.locator('#curriculum-legend-toggle').click();
    await page.waitForTimeout(200);
    check('Legend collapses again',
      await page.locator('#curriculum-legend.is-collapsed').count() === 1);
  }

  // Subject detail
  if (curriculumSubjects > 0) {
    await page.locator('.curr-card').first().click();
    await page.waitForTimeout(500);
    const subjText = await page.locator('#app-main').innerText();
    check('Subject detail view renders chapters', subjText.includes('Chapter') || subjText.includes('chapter') || subjText.length > 100);
    // Collapsed chapters + timeline rail (issue #16)
    check('Chapters collapsed by default (issue #16)',
      await page.locator('.accordion-body.active').count() === 0);
    check('Chapters sit on a numbered timeline rail (issue #16)',
      await page.locator('.chapt-node .chapt-node-dot').count() >= 3 &&
      await page.locator('.chapt-rail-line').count() >= 2);
    // Expand a chapter via its header and confirm the row shows duration
    await page.locator('.accordion-header').first().click();
    await page.waitForTimeout(300);
    check('Chapter expands on header click',
      await page.locator('.accordion-body.active').count() === 1);
    check('Lecture rows carry duration',
      await page.locator('.accordion-body.active .v2-quest-row .quest-video-dur').count() >= 1);
    // Completion-date metadata (issue #16): ticking a video records an ISO
    // timestamp that renders as "Completed Today"; unticking clears it.
    const row = page.locator('.accordion-body.active .v2-quest-row').first();
    await row.locator('.v2-pixel-checkbox-label').click();
    await page.waitForTimeout(300);
    const doneLine = await row.locator('.quest-done-when').innerText().catch(() => '');
    check('Ticked lecture shows completion date (issue #16)', /completed today/i.test(doneLine), JSON.stringify(doneLine));
    const storedVal = await page.evaluate(() => {
      const cb = document.querySelector('.accordion-body.active .react-task-checkbox');
      return window.FlowMD.store.getState().completedVideos[cb.getAttribute('data-video-id')];
    });
    check('Completion stores ISO timestamp (issue #16)', typeof storedVal === 'string' && !isNaN(Date.parse(storedVal)), String(storedVal));
    await row.locator('.v2-pixel-checkbox-label').click();
    await page.waitForTimeout(300);
    check('Untick clears completion date (issue #16)',
      await row.locator('.quest-done-when').count() === 0);
  } else {
    check('Subject detail view renders chapters', false, 'no subject row to click');
  }

  // Analytics view
  await clickNav(page, 'analytics');
  const anlText = await page.locator('#app-main').innerText();
  check('Analytics view renders content', anlText.length > 50);
  check('Search bar hidden on analytics', !(await page.locator('#btn-toggle-search').isVisible()));
  check('No breadcrumb bars on analytics', await page.locator('.fm-breadcrumb').count() === 0);
  check('Analytics Goal Pulse shows empty state when no target set',
    anlText.includes('Goal Pulse') && anlText.includes('No study target set yet'),
    'empty-state CTA present');
  // Issue #18: 30-day progress card always renders with 30 day bars.
  check('Analytics shows 30-Day Progress card',
    anlText.includes('30-Day Progress') && await page.locator('.anl-month30-bar').count() === 30,
    `bars: ${await page.locator('.anl-month30-bar').count()}`);
  // Issue #18: 7-day chart uses the taller 250-unit viewBox.
  {
    const vb = await page.locator('.chart-svg').first().getAttribute('viewBox').catch(() => null);
    check('7-Day chart stretched to taller viewBox (250)', vb === '0 0 600 250', String(vb));
  }

  // Regression: the Preparation Setup card must RESPOND to the Configure
  // Study Plan sheet. Configure Plan A (subject, pace, deadline), save, and
  // verify the analytics card shows the saved daily/weekly/monthly targets.
  await clickNav(page, 'dashboard');
  await page.locator('#nav-btn-plan-config').click();
  await page.waitForTimeout(400);
  await page.locator('#select-target-subject').selectOption({ index: 1 });
  await page.locator('#input-videos-per-day').fill('3');
  await page.evaluate(() => {
    // Set the deadline directly so the pace auto-sync listener can't overwrite it.
    const d = document.getElementById('input-target-date');
    if (d) d.value = '2027-06-30';
  });
  await page.locator('#btn-apply-goals').click();
  await page.waitForTimeout(400);
  {
    const sheetClosedAfterSave = await page.evaluate(() => !document.getElementById('plan-config-sheet-overlay')?.classList.contains('active'));
    check('Plan config sheet closes after Save & Apply', sheetClosedAfterSave === true);
  }
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

  // Issue #18: welcome-card progress bar reflects configured subjects.
  {
    await clickNav(page, 'dashboard');
    await page.waitForTimeout(300);
    const hero = await page.evaluate(() => ({
      segs: document.querySelectorAll('.hero-subj-seg').length,
      legend: Array.from(document.querySelectorAll('.hero-subj-legend-item')).map(el => el.textContent.trim().replace(/\s+/g, ' ')),
      heroText: (document.querySelector('.fm-feature-card-desc') || {}).textContent || ''
    }));
    check('Welcome card shows per-subject progress segments after plan config',
      hero.segs >= 1 && hero.legend.some(t => /\d+%$/.test(t)),
      JSON.stringify(hero));
  }

  // Issue #17: manual-mode daily tasks must drive Goal Pulse. Switch to
  // manual topics, add 3 videos, complete 1, and verify the daily/weekly/
  // monthly goals use the manual list as the target (3 / 21 / 30×) and the
  // completion counts include manual ticks.
  {
    const manualSetup = await page.evaluate(() => {
      const { setDailyTasksMode, addManualTaskVideo, markStudyActivity } = window.FlowMD.store;
      const dataset = window.FlowMD.sourceData.getDataset();
      const ids = [];
      for (const sub of dataset) {
        for (const chap of (sub.chapters || [])) {
          for (const v of (chap.videos || [])) {
            if (ids.length < 3) ids.push(v.id);
          }
        }
      }
      setDailyTasksMode('manual');
      ids.forEach((id) => addManualTaskVideo(id));
      markStudyActivity(true, null); // simulate ticking one manual task
      window.FlowMD.shell.render();
      return { ids };
    });
    check('Manual mode set up with 3 topics', manualSetup.ids.length === 3, JSON.stringify(manualSetup.ids.length));
    await clickNav(page, 'analytics');
    await page.waitForTimeout(300);
    const pulseText = await page.locator('#app-main').innerText();
    const pulseOk = pulseText.includes('Goal Pulse') &&
      /1\/\s*3/.test(pulseText) &&
      pulseText.includes('manual topic') &&
      !pulseText.includes('No study target set yet');
    check('Goal Pulse daily goal uses manual topic count (1/3 done)', pulseOk,
      pulseText.slice(pulseText.indexOf('Goal Pulse'), pulseText.indexOf('Goal Pulse') + 260).replace(/\s+/g, ' '));
    const pulseUnits = await page.evaluate(() => Array.from(document.querySelectorAll('.anl-goal-value')).map(el => el.textContent.trim().replace(/\s+/g, ' ')));
    const weeklyMonthlyOk = pulseUnits.some(u => /1\/\s*21/.test(u)) && pulseUnits.some(u => /1\/\s*90/.test(u));
    check('Goal Pulse weekly (×7) & monthly (×30) targets derive from manual topics', weeklyMonthlyOk, JSON.stringify(pulseUnits));
    // Restore auto mode so later scenarios are unaffected.
    await page.evaluate(() => {
      window.FlowMD.store.setDailyTasksMode('auto');
      window.FlowMD.store.getState().dailyTasksManual = [];
      window.FlowMD.store.saveState();
      window.FlowMD.shell.render();
    });
  }

  // Profile view
  await clickNav(page, 'profile');
  const profileText = await page.locator('#app-main').innerText();
  check('Profile view renders content', profileText.length > 50);
  const profileHasInstallGuide = profileText.includes('Install App') &&
    (profileText.includes('Install FlowMD App') || profileText.includes('Add to Home Screen'));
  check('Profile shows brief Install App guide', profileHasInstallGuide,
    profileHasInstallGuide ? 'install card present' : 'install card MISSING');

  // Offline-first Profile: cloud-sync UI replaced by data-safety + Backup cards.
  {
    await page.evaluate(() => {
      const st = window.FlowMD.store.getState();
      st.lastBackupAt = Date.now() - 120000;
      window.FlowMD.shell.render();
      return new Promise((resolve) => setTimeout(resolve, 300));
    });
    const profileText = await page.locator('#app-main').innerText();
    check('Profile shows device-local data-safety card',
      profileText.includes('data lives on this device') || profileText.includes('lives on this device'),
      profileText.slice(0, 160));
    check('Profile shows Cloud Sync coming soon', profileText.includes('coming soon'), 'cloud sync masked');
    check('Backup Export button present', await page.locator('#btn-export-backup').count() === 1);
    check('Backup Import button present', await page.locator('#btn-import-backup').count() === 1);
    check('No Google sign-in button on Profile', await page.locator('#btn-signin-google').count() === 0);
    check('No manual sync button', await page.locator('#btn-sync-now, #manual-sync-btn').count() === 0);
    check('Device Layout Check card removed from Profile',
      (await page.locator('#app-main').innerText()).includes('Device Layout Check') === false);
  }

  // Search modal (dashboard-only search bar)
  await clickNav(page, 'dashboard');
  await page.waitForTimeout(300);
  const searchBtn = await page.locator('#btn-toggle-search').count();
  check('Search button present on dashboard', searchBtn > 0);
  if (searchBtn) {
    await page.locator('#btn-toggle-search').click();
    await page.waitForTimeout(300);
    check('Search modal opens', await page.locator('#spotlight-search-modal').evaluate(el => el.style.display !== 'none'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Daily Tasks: Auto/Manual topic modes
  {
    const tasksText = await page.locator('#app-main').innerText();
    check('Dashboard shows Daily Tasks section', tasksText.includes('Daily Tasks'));
    check('No Daily Quests label remains', !tasksText.includes('Daily Quests'));
    // Today's total-hours goal (issue #15) — rendered once a plan with a
    // daily pace is configured.
    check('Daily Tasks header shows total hours goal (or hides when no plan)',
      tasksText.includes('h today') || !(await page.locator('.dash-today-hours').count()),
      tasksText.split('\n').find(l => l.includes('Daily Tasks')) || '');
    check('Auto mode is default', await page.locator('.spc-mode-opt[data-mode="auto"].active').count() === 1);
    await page.locator('.spc-mode-opt[data-mode="manual"]').click();
    await page.waitForTimeout(400);
    check('Manual mode shows manual tasks card', await page.locator('#manual-tasks-card').count() === 1);
    check('Manual mode offers Add Topics from Search', await page.locator('#btn-add-task-topic').count() === 1);
    // Add topics via the spotlight search "+ Task" button
    // btn-add-task-topic opens the spotlight programmatically — no search
    // bar click needed (the search bar is dashboard-only anyway).
    await page.locator('#btn-add-task-topic').click();
    await page.waitForTimeout(400);
    await page.locator('#spotlight-search-input').fill('anatomy');
    await page.waitForTimeout(400);
    const addBtnCount = await page.locator('[data-add-task]').count();
    check('Search shows + Task buttons in manual mode', addBtnCount > 0, `found ${addBtnCount}`);
    if (addBtnCount > 0) {
      await page.locator('[data-add-task]').first().click();
      await page.waitForTimeout(300);
      const manualIds = await page.evaluate(() => window.FlowMD.store.getState().dailyTasksManual);
      check('+ Task adds the topic to manual tasks', Array.isArray(manualIds) && manualIds.length === 1, JSON.stringify(manualIds));
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    // Back to auto
    await page.locator('.spc-mode-opt[data-mode="auto"]').click();
    await page.waitForTimeout(400);
    check('Switching back to Auto restores plan quests', await page.locator('#manual-tasks-card').count() === 0);
  }

  // Plan B alone: add Plan B, disable Plan A
  {
    await page.locator('#nav-btn-plan-config').click();
    await page.waitForTimeout(400);
    // Plan B tab shows the add-plan intro for a fresh profile
    await page.locator('.spc-tab[data-spc-tab="plan_b"]').click();
    await page.waitForTimeout(300);
    const addPlanBtn = page.locator('#spc-add-plan');
    check('Plan B tab shows Add Plan intro', await addPlanBtn.count() === 1);
    await addPlanBtn.click();
    await page.waitForTimeout(300);
    check('Add Plan B creates the Plan B form', await page.locator('#goal-plan-b-form').isVisible());
    await page.locator('#btn-apply-goals-b').click();
    await page.waitForTimeout(300);
    const planBErr = await page.locator('#toast-container').innerText();
    check('Saving Plan B without a subject is blocked', /select a priority target subject/i.test(planBErr), planBErr.slice(0, 80));
    // Disable Plan A — Plan B should remain (single-plan mode)
    await page.locator('.spc-tab[data-spc-tab="plan_a"]').click();
    await page.waitForTimeout(300);
    await page.locator('#btn-disable-plan-a').click();
    await page.waitForTimeout(400);
    const plansAfterDisable = await page.evaluate(() => window.FlowMD.store.getState().plans.map(p => p.id));
    check('Disable Plan A leaves Plan B alone', plansAfterDisable.length === 1 && plansAfterDisable[0] === 'plan_b', JSON.stringify(plansAfterDisable));
    // Clean up: disable Plan B too, restore single Plan A
    await page.locator('.spc-tab[data-spc-tab="plan_b"]').click();
    await page.waitForTimeout(300);
    await page.locator('#btn-disable-plan-b').click();
    await page.waitForTimeout(400);
    const plansReset = await page.evaluate(() => window.FlowMD.store.getState().plans.map(p => p.id));
    // The queue engine re-seeds an UNSET plan_a lazily; the state may be
    // plan-less (length 0) or hold only that unset Plan A — both are the
    // "no plan configured" state.
    check('Disabling Plan B returns to no-plan state',
      plansReset.length === 0 || (plansReset.length === 1 && plansReset[0] === 'plan_a'),
      JSON.stringify(plansReset));
    // Re-add Plan A for later sections
    await page.locator('.spc-tab[data-spc-tab="plan_a"]').click();
    await page.waitForTimeout(300);
    await page.locator('#spc-add-plan').click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // UI/UX 2 (issue #15): topbar decluttered — no theme toggle, no source badge.
  check('Topbar has no theme toggle (moved to Profile → Settings)',
    await page.locator('.topbar #theme-toggle-btn').count() === 0);
  check('Topbar has no edition/source badge', await page.locator('#topbar-source-badge').count() === 0);
  check('Topbar avatar present', await page.locator('#topbar-user-profile').count() === 1);

  // Theme toggle now lives in Profile → Settings
  await clickNav(page, 'profile');
  await page.waitForTimeout(400);
  const profToggle = await page.locator('#app-main #theme-toggle-btn').count();
  check('Theme toggle present in Profile → Settings', profToggle > 0);
  const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('#app-main #theme-toggle-btn').click();
  await page.waitForTimeout(300);
  const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('Theme switching works from Profile', themeBefore === 'dark' && themeAfter === 'light');
  // Flip back so later sections start from the default dark theme.
  await page.locator('#app-main #theme-toggle-btn').click();
  await page.waitForTimeout(300);
  check('Theme restored to dark',
    (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark');

  // Source settings modal still reachable from Profile → Settings
  {
    const changeBtn = await page.locator('#btn-change-source').count();
    check('Profile has Study Source change button', changeBtn > 0);
    if (changeBtn) {
      await page.locator('#btn-change-source').click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
      const dynModal = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div')).some(el => el.style.zIndex === '99999' && el.style.position === 'fixed');
      });
      check('Source settings modal opens from Profile (dynamic)', dynModal === true);
      await dismissOverlays(page);
    }
  }

  // Source switch swaps per-edition partitions (v4): Edition 8 keeps its
  // plans + completions, Edition 6.5 is a fresh unset partition, and each
  // edition's plans come back intact when you switch back.
  {
    await page.evaluate(() => {
      const st = window.FlowMD.store.getState();
      st.plans[0].targetSubject = 'Anatomy';
      st.plans[0].videosPerDay = 3;
      st.plans[0].videosPerWeek = 21;
      st.plans[0].videosPerMonth = 90;
      st.plans[0].targetDate = '2027-06-30';
      if (!st.plans[1]) st.plans.push({ id: 'plan_b', label: 'Plan B', accentColor: '#f43f5e', targetSubject: 'Physiology', videosPerDay: 2, videosPerWeek: 14, videosPerMonth: 60, targetDate: '2027-12-01', targetUnits: [] });
      st.completedVideos['marrow_8::anatomy__v1'] = true;
      st.completedVideos['marrow_6_5::anatomy__v1'] = true;
      window.FlowMD.store.saveState();
    });
    // The per-edition config summary must show BOTH plans (Plan A + Plan B)
    // combined as "Subject A + Subject B", not just Plan A.
    await page.evaluate(() => { window.FlowMD.sourceSettings.openSourceSettingsModal(); });
    await page.waitForTimeout(300);
    const modalText = await page.evaluate(() => {
      const m = Array.from(document.querySelectorAll('div')).find(el => el.style.position === 'fixed' && el.style.zIndex === '99999');
      return m ? m.innerText : '';
    });
    check('Source modal summary shows Plan A + Plan B combined (Anatomy + Physiology)',
      modalText.includes('Anatomy + Physiology'),
      modalText.slice(0, 200));
    await dismissOverlays(page);
    await page.evaluate(() => { window.FlowMD.sourceSettings.openSourceSettingsModal(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const opt = document.querySelector('.onboarding-option[data-src="marrow_6_5"]');
      if (opt) opt.click();
      const save = document.querySelector('#scs-save');
      if (save) save.click();
    });
    await page.waitForTimeout(400);
    const switched = await page.evaluate(() => {
      const st = window.FlowMD.store.getState();
      return {
        source: st.activeSource,
        planCount: st.plans.length,
        planB: st.plans.some(p => p.id === 'plan_b'),
        planADay: st.plans[0] && st.plans[0].videosPerDay,
        completed: Object.keys(st.completedVideos).length
      };
    });
    check('Source switch loads a fresh unset Edition 6.5 partition',
      switched.source === 'marrow_6_5' && switched.planCount === 1 && !switched.planB && !switched.planADay && switched.completed === 2,
      JSON.stringify(switched));
    // Switch back — Edition 8's plans must come back intact.
    await page.evaluate(() => { window.FlowMD.sourceSettings.openSourceSettingsModal(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const opt = document.querySelector('.onboarding-option[data-src="marrow_8"]');
      if (opt) opt.click();
      const save = document.querySelector('#scs-save');
      if (save) save.click();
    });
    await page.waitForTimeout(400);
    const restored = await page.evaluate(() => {
      const st = window.FlowMD.store.getState();
      return {
        source: st.activeSource,
        planCount: st.plans.length,
        planB: st.plans.some(p => p.id === 'plan_b' && p.targetSubject === 'Physiology'),
        planADay: st.plans[0] && st.plans[0].videosPerDay,
        planADate: st.plans[0] && st.plans[0].targetDate,
        completed: Object.keys(st.completedVideos).length
      };
    });
    check('Source switch back restores Edition 8 plans + completions',
      restored.source === 'marrow_8' && restored.planCount === 2 && restored.planB && restored.planADay === 3 && restored.planADate === '2027-06-30' && restored.completed === 2,
      JSON.stringify(restored));
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
    // Drop the first-visit install modal (fresh context) so the nav click lands.
    await dismissOverlays(page65);
    await clickNav(page65, 'curriculum');
    // Wait for the async data load + re-render (not a fixed timeout).
    await page65.waitForFunction(
      () => document.querySelectorAll('.curr-card').length > 5,
      { timeout: 10000 }
    ).catch(() => {});
    const subjects65 = await page65.locator('.curr-card').count();
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
    // The stepper lives inside the plan-config sheet — open it before measuring.
    await page.evaluate(() => window.FlowMD.planConfig.openPlanConfigSheet());
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
    // Drop the first-visit install modal (fresh context) before the real click.
    await dismissOverlays(page);
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
