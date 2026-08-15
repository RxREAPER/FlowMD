/* ============================================================
   FlowMD Render Audit — permanent cross-viewport layout guard.
   Boots the app at multiple device widths, walks every view and
   dialogue, and fails on any layout regression:
     - horizontal page overflow (the plan-config stepper bug class)
     - meaningful elements escaping the viewport
     - hard-clipped text (ellipsis + known-intentional exceptions)
     - content trapped under the fixed bottom nav at full scroll

   Usage: node tests/render.mjs [port]
   Run from the marrow-planner project root. Exits 1 on failures.
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8130;
const BASE = `http://127.0.0.1:${port}`;

const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.ico': 'image/x-icon', '.md': 'text/plain'
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (p === '/') p = '/index.html';
    const f = normalize(join(root, p));
    const data = await readFile(f);
    res.writeHead(200, { 'Content-Type': mime[extname(f)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});

// 769–900px is the band the suite used to miss (plan-config stepper grid).
const VIEWPORTS = [
  { name: 'phone-360', width: 360, height: 740 },
  { name: 'mid-800', width: 800, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 }
];

// Intentional horizontal overflow (gradient bleed / ellipsized tile names).
const H_ALLOW = ['.anl-report-hero', '.fm-tile-name'];
// Intentional fixed-height internal scroll areas.
const V_ALLOW = ['.plan-config-chips-list', '.modal-card', '#spotlight-results-container'];
// Overlay roots whose children legitimately overlap page content.
const OVERLAY_ROOTS = '.modal-overlay, #bottom-sheet-overlay, [style*="z-index: 99999"]';

const results = [];
let failCount = 0;
function check(name, ok, detail = '') {
  results.push({ name, ok });
  if (!ok) failCount++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const MEASURE = () => {
  const vw = window.innerWidth;
  const issues = [];
  const seen = new Set();
  const add = (type, el, detail) => {
    const k = type + '|' + el;
    if (!seen.has(k)) { seen.add(k); issues.push({ type, el, detail }); }
  };

  if (document.documentElement.scrollWidth > vw + 2) {
    add('DOC-H-OVERFLOW', 'html', `scrollWidth ${document.documentElement.scrollWidth} > vw ${vw}`);
  }

  const inOverlay = (el) => !!el.closest('.modal-overlay, #bottom-sheet-overlay, [style*="z-index: 99999"]');
  const visible = Array.from(document.querySelectorAll('body *')).filter((el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

  // 1. Elements escaping the viewport (skip modal/bottom-sheet children).
  for (const el of visible) {
    if (inOverlay(el)) continue;
    const r = el.getBoundingClientRect();
    const cls = (el.className && el.className.toString ? el.className.toString() : '').slice(0, 35);
    const key = el.tagName + '.' + cls;
    const txt = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    const tag = () => `${key} ${txt ? '(' + txt + ')' : ''} w=${Math.round(r.width)}`;
    if (r.right > vw + 2 && r.left < vw) add('OVERFLOWS-RIGHT', tag(), `right ${Math.round(r.right)} > vw ${vw}`);
    if (r.left < -2 && r.right > 0) add('OVERFLOWS-LEFT', tag(), `left ${Math.round(r.left)}`);
  }

  // 2. Hard-clipped text (allowed when ellipsized or in the allowlist).
  for (const el of visible) {
    const s = getComputedStyle(el);
    if (s.overflowX === 'visible') continue;
    if (el.scrollWidth <= el.clientWidth + 2) continue;
    if (s.textOverflow === 'ellipsis') continue;
    if (['.anl-report-hero', '.fm-tile-name'].some((sel) => el.matches(sel))) continue;
    const txt = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!txt) continue;
    const cls = (el.className && el.className.toString ? el.className.toString() : '').slice(0, 35);
    add('TEXT-CLIPPED-H', `${el.tagName}.${cls} (${txt})`, `scrollW ${el.scrollWidth} > clientW ${el.clientWidth}`);
  }

  // 3. Vertical text clipping (allowed for internal scroll areas).
  for (const el of visible) {
    const s = getComputedStyle(el);
    if (s.overflowY === 'visible' || s.overflowY === 'clip') continue;
    if (el.scrollHeight <= el.clientHeight + 4) continue;
    if (s.overflowY === 'auto' || s.overflowY === 'scroll') continue;
    if (['.plan-config-chips-list', '.modal-card', '#spotlight-results-container'].some((sel) => el.matches(sel))) continue;
    const txt = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!txt || el.clientHeight < 12) continue;
    const cls = (el.className && el.className.toString ? el.className.toString() : '').slice(0, 35);
    add('TEXT-CLIPPED-V', `${el.tagName}.${cls} (${txt})`, `scrollH ${el.scrollHeight} > clientH ${el.clientHeight}`);
  }

  return { vw, issues, booted: !!document.querySelector('.android-bottom-nav') };
};

// At full scroll, nothing interactive may sit under the fixed bottom nav.
const REACHABILITY = () => {
  const nav = document.querySelector('.android-bottom-nav');
  if (!nav) return { ok: true, note: 'no bottom nav' };
  const nr = nav.getBoundingClientRect();
  window.scrollTo(0, document.body.scrollHeight);
  const probe = document.elementFromPoint(Math.floor(window.innerWidth / 2), Math.floor(nr.top) + 8);
  const inNav = probe && probe.closest('.android-bottom-nav');
  return { ok: !!inNav, at: probe ? (probe.className || probe.tagName) : 'none' };
};

async function dismissOverlays(page) {
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('div')).forEach((el) => {
      if (el.style.position === 'fixed' && el.style.zIndex === '99999') el.remove();
    });
    ['#source-settings-modal', '#spotlight-search-modal', '#bottom-sheet-overlay'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.style.display = 'none';
    });
  });
  await page.waitForTimeout(150);
}

async function boot(page) {
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    localStorage.setItem('flowmd_is_configured', 'true');
    localStorage.setItem('flowmd_tutorial_seen', 'true');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const st = window.FlowMD.store.getState();
    st.plans[0].targetSubject = 'Anatomy';
    st.plans[0].videosPerDay = 3;
    st.plans[0].videosPerWeek = 21;
    st.plans[0].videosPerMonth = 90;
    st.plans[0].targetDate = '2027-06-30';
    window.FlowMD.store.saveState();
    if (window.FlowMD.shell) window.FlowMD.shell.render();
  });
  await page.waitForTimeout(350);
}

async function nav(page, view) {
  const btn = page.locator(`.android-nav-item[data-view="${view}"]`);
  if (await btn.count()) await btn.first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
}

async function run() {
  await new Promise((r) => server.listen(port, '127.0.0.1', r));

  // Static source guards — the global CSS safety nets must never be removed.
  const css = await readFile(join(root, 'style.css'), 'utf8');
  check('style.css has the global layout safety-nets block', css.includes('Global layout safety nets'));
  check('style.css contains no retro theme selectors', !css.includes('data-theme-style="retro"'));

  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    await boot(page);
    // The first-visit install modal auto-shows on boot. Dismiss it through the
    // app API (sets the dismiss flag) so it can't re-show on the dashboard
    // audit and skew reachability probes or block interactions.
    await page.evaluate(() => {
      if (window.FlowMD.pwaInstall) {
        window.FlowMD.pwaInstall.dismissFirstVisitBanner();
        window.FlowMD.pwaInstall.hideInstallModal();
      }
    });

    check(`${vp.name}: app boots`, await page.evaluate(() => !!document.querySelector('.android-bottom-nav')));

    const audit = async (label, { reachability = true } = {}) => {
      const m = await page.evaluate(MEASURE);
      if (!m.booted) { check(`${vp.name}:${label} booted`, false); return; }
      for (const i of m.issues) {
        check(`${vp.name}:${label} [${i.type}]`, false, `${i.el} — ${i.detail}`);
      }
      if (!m.issues.length) check(`${vp.name}:${label} layout clean`, true);
      if (reachability) {
        const r = await page.evaluate(REACHABILITY);
        if (!r.ok) { check(`${vp.name}:${label} full-scroll reachability`, false, `nav area has ${r.at}`); }
        else check(`${vp.name}:${label} full-scroll reachability`, true);
      }
    };

    await nav(page, 'dashboard');   await audit('dashboard');
    await nav(page, 'curriculum');  await audit('curriculum');
    await nav(page, 'analytics');   await audit('analytics');
    await nav(page, 'profile');     await audit('profile');

    await nav(page, 'curriculum');
    const row = page.locator('.curriculum-sub-row').first();
    if (await row.count()) { await row.click({ force: true }).catch(() => {}); await page.waitForTimeout(400); }
    await audit('subject-detail');

    await nav(page, 'profile');
    const src = page.locator('#btn-change-source');
    if (await src.count()) { await src.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
    await audit('source-modal', { reachability: false });
    await dismissOverlays(page);

    const search = page.locator('#btn-toggle-search');
    if (await search.count()) { await search.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
    await audit('search-modal', { reachability: false });
    await dismissOverlays(page);

    const avatar = page.locator('#topbar-user-profile');
    if (await avatar.count()) { await avatar.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
    await audit('bottom-sheet', { reachability: false });

    if (pageErrors.length) {
      check(`${vp.name}: no page errors`, false, pageErrors.slice(0, 2).join(' | '));
    }
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(`\n${results.length - failCount}/${results.length} render checks passed`);
  process.exit(failCount ? 1 : 0);
}

run().catch((err) => { console.error('Render audit crashed:', err); process.exit(2); });
