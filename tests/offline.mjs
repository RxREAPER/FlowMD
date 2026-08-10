/* ============================================================
   FlowMD Offline Regression Test — service worker + fonts
   Guards two bugs reported after the v186 deploy:
     (a) offline reload returned a BLANK page (navigation branch
         only checked the empty CURRICULUM_CACHE, never the precache)
     (b) Material Symbols rendered as raw ligature text offline
         ("local_fire_department") because Google Fonts weren't
         cached and the catch-all branch served offline.html for
         font requests.

   Flow: online load (SW installs) → wait for SW to control the
   page → online reload (SW caches fonts + assets) → offline →
   reload → assert the full app renders with icon glyphs and zero
   errors.

   Usage: node tests/offline.mjs [port]
   Run from the flowmd project root.
   ============================================================ */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const port = Number(process.argv[2]) || 8131;
const BASE = `http://127.0.0.1:${port}`;

const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.ico': 'image/x-icon', '.md': 'text/plain', '.wasm': 'application/wasm',
  '.woff2': 'font/woff2'
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

async function iconState(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.material-symbols-outlined');
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return {
      found: true,
      width: Math.round(r.width),
      height: Math.round(r.height),
      text: el.textContent.trim().slice(0, 20),
      fontLoaded: document.fonts.check('16px "Material Symbols Outlined"')
    };
  });
}

async function run() {
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

  // 1. Online first load (SW installs; icons must already be glyphs).
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  const onlineIcon = await iconState(page);
  check('Online: app loads', (await page.locator('#app-main').count()) === 1);
  check('Online: Material Symbols render as glyphs (not ligature text)',
    onlineIcon.found && onlineIcon.width <= 32 && onlineIcon.height <= 32,
    `w=${onlineIcon.width} h=${onlineIcon.height} text="${onlineIcon.text}"`);
  check('Online: no page errors', errors.length === 0, errors.slice(0, 3).join(' | ').slice(0, 200));

  // 2. Wait for the SW to finish installing (this precaches the shell, data,
  //    Firebase SDKs, AND Google Fonts), then go offline and reload. This is
  //    the "first-ever visit is already offline-capable" guarantee: no second
  //    online load is needed to warm the font/SDK caches.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(2500);
  errors.length = 0;

  // 3. Offline reload: full app from the install-time precache.
  //    Playwright's setOffline blocks the network layer but does NOT flip
  //    navigator.onLine (browsers only flip it via real network events), so
  //    also emulate the offline event — that's what the app's analytics
  //    guard (firebase.js: skip analytics init when offline) depends on.
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'onLine', { get: () => false, configurable: true });
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(3500);

  const offline = await page.evaluate(() => ({
    title: document.title,
    mainChars: (document.getElementById('app-main') || {}).innerText
      ? document.getElementById('app-main').innerText.length : -1,
    hasNav: !!document.querySelector('.android-bottom-nav')
  }));
  check('Offline: app renders (not a blank page)',
    offline.title.startsWith('FlowMD') && offline.mainChars > 50 && offline.hasNav,
    `title="${offline.title}" main=${offline.mainChars} nav=${offline.hasNav}`);

  const offlineIcon = await iconState(page);
  check('Offline: Material Symbols still render as glyphs (precached at install)',
    offlineIcon.found && offlineIcon.width <= 32 && offlineIcon.height <= 32 &&
    offlineIcon.fontLoaded === true,
    `w=${offlineIcon.width} h=${offlineIcon.height} fontLoaded=${offlineIcon.fontLoaded}`);
  check('Offline: no page errors', errors.length === 0, errors.slice(0, 3).join(' | ').slice(0, 200));

  // 4. Confirm the Firebase SDKs made it into the install-time precache
  //    (first-visit offline auth/firestore).
  check('Offline: Firebase SDK precache present', await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find((k) => k.startsWith('marrow-planner-pwa')) || keys[0]);
    return !!(await cache.match('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js'));
  }), 'firebase-app-compat.js in precache');

  await browser.close();

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Offline test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
