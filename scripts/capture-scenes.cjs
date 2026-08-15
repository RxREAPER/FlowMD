/* ============================================================
   FlowMD Landing — Scene Capture Pipeline
   Captures real, staged screenshots of the running app (with
   seeded demo state) into landing/assets/scenes/ plus the OG
   image at landing/assets/og-image.png.

   Usage: node scripts/capture-scenes.cjs
   Requires: playwright + chromium (PLAYWRIGHT_BROWSERS_PATH
   pointing at the repo's .pw-browsers, as the test suite does).

   Every shot verifies its anchor selector (or value assertions)
   and exits non-zero on failure instead of emitting a broken
   scene. All shots use the seeded demo profile.
   ============================================================ */
'use strict';

const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const { buildDemoState } = require('./scene-state.js');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 8140;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(__dirname, '..', 'landing', 'assets', 'scenes');
const OG_OUT = path.join(__dirname, '..', 'landing', 'assets', 'og-image.png');

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

// --- Static server: reuse a listener already on PORT, else spawn serve.cjs ---
async function isUp() {
  try {
    const r = await fetch(BASE + '/index.html', { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch (_) {
    return false;
  }
}

async function ensureServer() {
  if (await isUp()) { console.log(`Reusing existing server on ${PORT}`); return null; }
  const child = spawn(process.execPath, ['serve.cjs', String(PORT)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'ignore',
    detached: true
  });
  child.unref();
  for (let i = 0; i < 40; i++) {
    if (await isUp()) { console.log(`Spawned serve.cjs on ${PORT}`); return child; }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server on ${PORT} never came up`);
}

// Seed localStorage on every navigation so each shot starts from a
// deterministic fresh demo profile.
function seedInitScript(page) {
  const state = buildDemoState();
  page.addInitScript((seed) => {
    for (const [k, v] of Object.entries(seed)) {
      try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ }
    }
  }, state);
}

// --- Helpers ---
async function gotoApp(page) {
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);
}

async function clickNav(page, view) {
  const btn = page.locator(`.android-nav-item[data-view="${view}"]`);
  await btn.first().click({ force: true });
  await page.waitForTimeout(450);
}

// Wait for an element that exists in the DOM (some app controls are
// visually-hidden native inputs), optionally with a minimum count.
async function waitAnchor(page, selector, minCount) {
  const loc = page.locator(selector);
  await loc.first().waitFor({ state: 'attached', timeout: 10000 });
  if (minCount) {
    await page.waitForFunction(
      ({ sel, n }) => document.querySelectorAll(sel).length >= n,
      { sel: selector, n: minCount },
      { timeout: 10000 }
    );
  }
}

async function scrollIntoView(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, selector);
  await page.waitForTimeout(500);
}

// --- Shot definitions (shared by all mobile seeded contexts) ---
const SHOTS = {
  'dashboard-overview': async (page) => {
    await waitAnchor(page, '.fm-feature-card-title');
  },
  'daily-quests': async (page) => {
    await waitAnchor(page, '.v2-quest-row', 3);
    // The native checkbox is visually hidden; click its visible label.
    const labels = page.locator('.v2-pixel-checkbox-label');
    for (let i = 0; i < 3; i++) {
      await labels.nth(i).click();
      await page.waitForTimeout(350);
    }
    await page.waitForFunction(() => document.querySelectorAll('.queue-chk:checked').length >= 3, null, { timeout: 8000 });
    await waitAnchor(page, '.v2-quest-row', 3);
  },
  'plan-a-pacing': async (page) => {
    await waitAnchor(page, '.plan-config-pace-input');
    await scrollIntoView(page, '#study-plan-config');
    const v = await page.evaluate(() => ({
      d: document.getElementById('input-videos-per-day')?.value ?? null,
      w: document.getElementById('input-videos-per-week')?.value ?? null
    }));
    const d = parseInt(v.d, 10);
    const ok = Number.isFinite(d) && d >= 10 && d <= 14 && parseInt(v.w, 10) === d * 7;
    check('Plan A pace derived from seeded 12/day (day 10-14, week = day*7)', ok, JSON.stringify(v));
    if (!ok) throw new Error('Plan A pace assertion failed');
  },
  'plan-b-pacing': async (page) => {
    await waitAnchor(page, '#goal-plan-select');
    await scrollIntoView(page, '#study-plan-config');
    await page.locator('#goal-plan-select').selectOption('plan_b');
    await page.waitForTimeout(450);
    await waitAnchor(page, '#goal-plan-b-form');
    const v = await page.evaluate(() => ({
      d: document.getElementById('input-videos-per-day-b')?.value ?? null,
      w: document.getElementById('input-videos-per-week-b')?.value ?? null
    }));
    const d = parseInt(v.d, 10);
    const ok = Number.isFinite(d) && d >= 6 && d <= 10 && parseInt(v.w, 10) === d * 7;
    check('Plan B pace derived from seeded 8/day (day 6-10, week = day*7)', ok, JSON.stringify(v));
    if (!ok) throw new Error('Plan B pace assertion failed');
  },
  analytics: async (page) => {
    await clickNav(page, 'analytics');
    // Goal Pulse tiles (Today/Week/Month + per-plan ETA) + the 7-day chart.
    await waitAnchor(page, '.anl-goal-tile', 3);
    await waitAnchor(page, '.chart-card', 1);
  },
  'curriculum-marrow8': async (page) => {
    await clickNav(page, 'curriculum');
    await waitAnchor(page, '.curriculum-legend');
    await waitAnchor(page, '.curriculum-sub-row[data-subject-id]', 1);
  },
  'subject-detail': async (page) => {
    await clickNav(page, 'curriculum');
    await waitAnchor(page, '.curriculum-sub-row[data-subject-id="medicine"]');
    await page.locator('.curriculum-sub-row[data-subject-id="medicine"]').click();
    await page.waitForTimeout(450);
    await waitAnchor(page, '.bulk-chapter-checkbox', 1);
  },
  profile: async (page) => {
    await clickNav(page, 'profile');
    await waitAnchor(page, '#prof-doc-name');
  },
  'edition-marrow65': async (page) => {
    await clickNav(page, 'profile');
    await waitAnchor(page, '#btn-change-source');
    await page.locator('#btn-change-source').click();
    await page.waitForTimeout(400);
    await waitAnchor(page, '#scs-save');
    await page.locator('.onboarding-option[data-src="marrow_6_5"]').click();
    await page.waitForTimeout(200);
    await page.locator('#scs-save').click();
    await page.waitForTimeout(500);
    await page.waitForFunction(() => {
      const b = document.getElementById('topbar-source-badge');
      return b && /6\.5/.test(b.textContent || '');
    }, null, { timeout: 8000 });
    await clickNav(page, 'curriculum');
    await waitAnchor(page, '.curriculum-legend');
  },
  'backup': async (page) => {
    // Stage an export timestamp so the Backup card shows real history.
    await page.evaluate(() => {
      const st = window.FlowMD.store.getState();
      st.lastBackupAt = Date.now() - 120000;
      window.FlowMD.store.saveState();
      if (window.FlowMD.shell) window.FlowMD.shell.render();
    });
    await page.waitForTimeout(400);
    await clickNav(page, 'profile');
    await waitAnchor(page, '#btn-export-backup');
  },
  'bulk-completion': async (page) => {
    await clickNav(page, 'curriculum');
    await waitAnchor(page, '.curriculum-sub-row[data-subject-id="medicine"]');
    await page.locator('.curriculum-sub-row[data-subject-id="medicine"]').click();
    await page.waitForTimeout(450);
    await waitAnchor(page, '.bulk-chapter-checkbox', 1);
    // The native checkbox is visually hidden; click its visible label.
    const labels = page.locator('.bulk-chapter-checkbox-label');
    for (let i = 0; i < 2; i++) {
      await labels.nth(i).click();
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(() => document.querySelectorAll('.bulk-chapter-checkbox:checked').length >= 2, null, { timeout: 8000 });
  }
};

// OG share card (1200x630 PNG): brand copy left, the real app's mobile
// dashboard in a phone frame right. Uses the mobile dashboard scene captured
// earlier in captureAll (same BASE server), so the card always shows the
// current product.
async function captureOG(browser) {
  const phone = BASE + '/landing/assets/scenes/mobile-dashboard-overview.webp';
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const page = await ctx.newPage();
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    * { margin: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px;
      display: flex; align-items: center; gap: 56px;
      padding: 0 72px;
      background: linear-gradient(135deg, #0b0f19 0%, #131a2c 55%, #1b1030 100%);
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
    .logo-mark {
      width: 34px; height: 34px; border-radius: 9px;
      background: linear-gradient(135deg, #6c3baa, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 800; font-size: 18px;
    }
    .logo-text { font-size: 22px; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em; }
    h1 { font-size: 34px; line-height: 1.18; color: #f8fafc; letter-spacing: -0.02em; max-width: 15ch; margin-bottom: 14px; }
    p { color: #94a3b8; font-size: 16px; max-width: 34ch; line-height: 1.55; margin-bottom: 26px; }
    .badge {
      display: inline-block; padding: 7px 14px; border-radius: 999px;
      border: 1px solid rgba(139, 92, 246, 0.4); color: #a78bfa;
      font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600;
    }
    .phone {
      width: 262px; flex-shrink: 0;
      background: #0b0f19; border: 8px solid #1e2434; border-radius: 34px;
      overflow: hidden; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
    }
    .phone img { display: block; width: 100%; height: auto; }
  </style></head><body>
    <div>
      <div class="logo"><span class="logo-mark">F</span><span class="logo-text">FlowMD</span></div>
      <h1>A NEET-PG planner that keeps you on track.</h1>
      <p>Run two subjects at once, finish daily quests, and know exactly where you stand — online or off.</p>
      <span class="badge">Free · Offline-first · Open source</span>
    </div>
    <div class="phone"><img src="${phone}" alt=""></div>
  </body></html>`;
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: OG_OUT, type: 'png' });
  const bytes = fs.statSync(OG_OUT).size;
  check('og-image.png captured', bytes > 30000, `${(bytes / 1024).toFixed(0)} KB`);
  await ctx.close();
}

// Only the scenes the landing actually references (the features section):
// the hero is a text spotlight, so the extra screenshots are not captured.
const MOBILE_SHOTS = ['dashboard-overview', 'daily-quests', 'plan-b-pacing', 'analytics', 'edition-marrow65', 'backup'];

async function captureShot(page, name, prefix) {
  const run = SHOTS[name];
  if (!run) throw new Error('Unknown shot ' + name);
  await gotoApp(page);
  await run(page);
  const file = path.join(OUT, `${prefix}-${name}.webp`);
  await page.screenshot({ path: file, type: 'webp', quality: 82 });
  const bytes = fs.statSync(file).size;
  // Dark scenes compress well; 10 KB is a generous sanity floor. Actual
  // quality is verified in the preview pass.
  check(`${prefix}-${name}.webp captured`, bytes > 10000, `${(bytes / 1024).toFixed(0)} KB`);
}

async function captureAll() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const pageErrors = [];
  const consoleErrors = [];

  // --- Mobile scenes (390x844 @2x, seeded) ---
  // The landing shows the app in its Android/mobile layout — the product's
  // primary design — so every scene is captured on a phone viewport.
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => pageErrors.push('mobile: ' + String(e)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('mobile: ' + m.text()); });
    seedInitScript(page);
    for (const name of MOBILE_SHOTS) {
      await captureShot(page, name, 'mobile');
    }
    await ctx.close();
  }

  // --- OG image (1200x630 PNG): branded share card with the app's mobile
  // dashboard in a phone frame. Composed as a styled HTML page so the social
  // preview reads as a product card, not a squished screenshot. ---
  await captureOG(browser);

  await browser.close();

  if (pageErrors.length) console.log('\npage errors observed:', pageErrors.slice(0, 5));
  if (consoleErrors.length) console.log('\nconsole errors observed:', consoleErrors.slice(0, 5));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

async function main() {
  try {
    await ensureServer();
    await captureAll();
  } catch (e) {
    console.error('Capture crashed:', e);
    process.exit(2);
  }
}

main();
