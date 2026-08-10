// FlowMD Navigation Audit — tours every view and asserts zero console/page errors and surface any console/page errors.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8129;
const BASE = `http://127.0.0.1:${port}`;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (p === '/') p = '/index.html';
    const fp = normalize(join(root, p));
    if (!fp.startsWith(normalize(root))) { res.writeHead(403); res.end(); return; }
    const d = await readFile(fp);
    res.writeHead(200, { 'Content-Type': mime[extname(fp)] || 'application/octet-stream' });
    res.end(d);
  } catch { res.writeHead(404); res.end(); }
});

async function run() {
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
  page.on('pageerror', e => errors.push('[pageerror] ' + String(e)));

  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    localStorage.setItem('flowmd_is_configured', 'true');
    localStorage.setItem('flowmd_tutorial_seen', 'true');
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  for (const view of ['dashboard', 'curriculum', 'analytics', 'goals', 'profile']) {
    const btn = page.locator(`.android-nav-item[data-view="${view}"]`);
    if (await btn.count()) { await btn.first().click({ force: true }).catch(() => {}); await page.waitForTimeout(500); }
    console.log(`view ${view}: rendered ${(await page.locator('#app-main').innerText().catch(() => '')).length} chars`);
  }
  // Subject detail via curriculum row
  await page.locator('.android-nav-item[data-view="curriculum"]').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('.curriculum-sub-row').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  console.log('view subject_detail: rendered', (await page.locator('#app-main').innerText().catch(() => '')).length, 'chars');

  // Search modal open + query
  await page.locator('#btn-toggle-search').click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('#spotlight-search-input').fill('anatomy');
  await page.waitForTimeout(400);
  console.log('search results:', await page.locator('.spotlight-item').count());
  await page.keyboard.press('Escape');

  // Source settings modal
  await page.locator('#topbar-source-badge').click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);

  await browser.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO ERRORS');
  process.exit(errors.length ? 1 : 0);
}
run().catch(e => { console.error('audit crashed:', e); process.exit(2); }).finally(() => server.close());
