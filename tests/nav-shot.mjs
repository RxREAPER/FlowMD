/* Dev-only visual check (not part of npm test): boots the app with a
   configured profile and screenshots the bottom nav + label area in dark,
   light, and phone viewport. Run: node tests/nav-shot.mjs */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = 8141;
const BASE = `http://127.0.0.1:${port}`;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (p === '/') p = '/index.html';
    const fp = normalize(join(root, p));
    if (!fp.startsWith(normalize(root))) { res.writeHead(403); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[extname(fp)] || 'application/octet-stream' });
    res.end(await readFile(fp));
  } catch { res.writeHead(404); res.end(); }
});

await new Promise(r => server.listen(port, '127.0.0.1', r));
const browser = await chromium.launch();
for (const vp of [{ name: 'desktop', width: 420, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    localStorage.setItem('flowmd_is_configured', 'true');
    localStorage.setItem('flowmd_tutorial_seen', 'true');
    localStorage.setItem('flowmd_plans_v2', JSON.stringify([{ id: 'plan_a', label: 'Plan A', accentColor: '#7c3aed', targetSubject: 'Anatomy', targetDate: '2999-01-01', videosPerDay: 8, dailyTargetHours: 3.5, targetUnits: [], queueBatchVideoIds: [], extraBatchesCompletedToday: 0 }]));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.evaluate(() => { if (window.FlowMD.pwaInstall) { window.FlowMD.pwaInstall.dismissFirstVisitBanner(); window.FlowMD.pwaInstall.hideInstallModal(); } });
  await page.screenshot({ path: `tests/screenshots/notch-${vp.name}-dark.png`, clip: { x: 0, y: vp.height - 140, width: vp.width, height: 140 } });
  // Light theme
  await page.evaluate(() => { const st = window.FlowMD.store.getState(); st.theme = 'light'; window.FlowMD.theme.applyTheme('light'); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `tests/screenshots/notch-${vp.name}-light.png`, clip: { x: 0, y: vp.height - 140, width: vp.width, height: 140 } });
  // Geometry probe: bar vs disc vs label
  const geo = await page.evaluate(() => {
    const bar = document.querySelector('.android-bottom-nav')?.getBoundingClientRect();
    const wrap = document.querySelector('.android-nav-item-center .nav-icon-wrap')?.getBoundingClientRect();
    const label = document.querySelector('.android-nav-item-center .nav-bar-label')?.getBoundingClientRect();
    const btn = document.querySelector('.android-nav-item-center')?.getBoundingClientRect();
    return { barTop: bar?.top, barBottom: bar?.bottom, discTop: wrap?.top, discBottom: wrap?.bottom, labelTop: label?.top, labelBottom: label?.bottom, itemTop: btn?.top, itemBottom: btn?.bottom };
  });
  const gap = geo.labelTop != null && geo.discBottom != null ? Math.round(geo.labelTop - geo.discBottom) : null;
  console.log(vp.name, JSON.stringify(geo), 'label-gap(px):', gap);
  await ctx.close();
}
await browser.close();
server.close();
console.log('done');
process.exit(0);
