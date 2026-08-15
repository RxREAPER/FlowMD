/* ============================================================
   FlowMD Landing Smoke Test — verifies the marketing landing
   page renders, references only real assets, and hands off to
   the app. Mirrors tests/smoke.mjs conventions (own static
   server, check() helper, exit non-zero on failure).

   Usage: node tests/landing-smoke.mjs [port]
   Run from the FlowMD app root.
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8129;
const BASE = `http://127.0.0.1:${port}`;

const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.ico': 'image/x-icon'
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
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><html><head><meta charset="utf-8"><title>Not found</title></head><body><h1>Not found</h1></body></html>');
  }
});

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

async function run() {
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];
  let swRegistered = false;

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('response', (res) => {
    if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.url()}`);
  });
  page.on('framenavigated', () => { /* reserved */ });

  await page.goto(`${BASE}/landing/index.html`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);

  // --- Head / meta ---
  check('Title matches', await page.title() === 'FlowMD — NEET-PG Study Planner', await page.title());
  const metaDesc = await page.locator('meta[name="description"]').count()
    ? await page.locator('meta[name="description"]').getAttribute('content')
    : '';
  check('Meta description present', (metaDesc || '').length > 20);
  check('CSP meta present', await page.locator('meta[http-equiv="Content-Security-Policy"]').count() === 1);

  // --- Assets: every scene image must resolve to HTTP 200 ---
  const sceneSrcs = await page.locator('img[src*="/assets/scenes/"]').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
  check('Scene images present', sceneSrcs.length >= 6, `${sceneSrcs.length} imgs`);
  const sceneFails = failedResponses.filter((f) => f.includes('/assets/scenes/'));
  check('Every scene image returns 200', sceneFails.length === 0, sceneFails.slice(0, 3).join(' | '));

  // --- Carousel (text feature spotlight) ---
  check('Hero carousel is text — no screenshots', await page.locator('#hero-carousel img').count() === 0);
  const slideCount = await page.locator('#hero-carousel .hero-slide').count();
  check('Carousel has 10 feature slides', slideCount === 10, `${slideCount} slides`);
  const activeBefore = await page.locator('#hero-carousel .hero-slide.active').getAttribute('data-index').catch(() => null);
  await page.locator('#hero-next').click();
  await page.waitForTimeout(300);
  const activeAfter = await page.locator('#hero-carousel .hero-slide.active').getAttribute('data-index').catch(() => null);
  check('Carousel next changes the active slide', activeBefore !== activeAfter, `${activeBefore} -> ${activeAfter}`);

  // --- Features / FAQ / CTA ---
  check('Exactly 6 feature blocks', await page.locator('#features .feature-block').count() === 6);
  check('Backup feature block present', (await page.locator('#features .feature-copy h3').allTextContents()).includes('Export & backup'));
  check('Exactly 7 FAQ items', await page.locator('#faq details').count() === 7);
  await page.locator('#faq details summary').first().click();
  await page.waitForTimeout(200);
  check('FAQ toggles open', await page.locator('#faq details').first().getAttribute('open') !== null);
  const heroCtas = await page.locator('.hero-ctas a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  check('Hero has install + browser CTAs', heroCtas.length === 2
    && heroCtas[0] === 'https://flowmd-04.web.app/?ref=install'
    && heroCtas[1] === 'https://flowmd-04.web.app', heroCtas.join(' | '));
  check('Nav CTA points at the app', await page.locator('.nav-cta').getAttribute('href') === 'https://flowmd-04.web.app');
  check('Device-local data notice present', (await page.locator('.beta-data-note').textContent()).includes('stored on this device'));
  check('PWA install note present', (await page.locator('.hero-install-note').textContent()).includes('Install'));
  check('Roadmap line in footer', (await page.locator('.footer-legal').textContent()).includes('on the roadmap'));

  // --- Versioned asset refs (immutable 1-year cache safety) ---
  const cssHref = await page.locator('link[rel="stylesheet"]').getAttribute('href');
  const jsSrc = await page.locator('script[src*="app.js"]').getAttribute('src');
  check('Landing CSS carries ?v=', /\.css\?v=[\d.]+/.test(cssHref), cssHref);
  check('Landing JS carries ?v=', /\.js\?v=[\d.]+/.test(jsSrc), jsSrc);

  // --- No service worker on the marketing page ---
  check('No service worker registered', swRegistered === false);
  check('No page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));
  check('No console errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 200));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Landing smoke test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
