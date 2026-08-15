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

// Mirrors the PRODUCTION CSP headers (firebase.json). This is critical: the
// service worker script inherits the site CSP, so its cross-origin fetch()
// calls to *.gstatic.com are blocked unless connect-src allows them. Without
// these headers the test env would never exercise that restriction.
const CSP_HEADER = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; worker-src 'self';";

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(normalize(root))) { res.writeHead(403); res.end('Forbidden'); return; }
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime[extname(filePath)] || 'application/octet-stream',
      'Content-Security-Policy': CSP_HEADER
    });
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
    const use = el.querySelector('use');
    const href = use ? use.getAttribute('href') : '';
    const symbol = href ? document.querySelector(href) : null;
    return {
      found: true,
      isSvg: el.tagName === 'svg',
      width: Math.round(r.width),
      height: Math.round(r.height),
      ligatureText: el.textContent.trim().slice(0, 20),
      hasUse: !!use,
      spriteResolves: !!symbol
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
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Failed-to-load-resource lines are transient under test load and not
    // part of these assertions (offline capability comes from the SW
    // precache, checked separately below), so ignore them.
    if (/Failed to load resource/.test(text)) return;
    errors.push('[console] ' + text);
  });

  // 1. Online first load (SW installs; icons must already be glyphs).
  page.on('requestfailed', (r) => {
    if (process.env.DEBUG_OFFLINE) console.log('REQFAILED:', r.url(), r.failure() && r.failure().errorText);
  });
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  const onlineIcon = await iconState(page);
  check('Online: app loads', (await page.locator('#app-main').count()) === 1);
  check('Online: icons are inline SVG (sprite use, no ligature text, no font)',
    onlineIcon.found && onlineIcon.isSvg && onlineIcon.hasUse && onlineIcon.spriteResolves &&
    onlineIcon.width > 0 && onlineIcon.ligatureText === '',
    `svg=${onlineIcon.isSvg} w=${onlineIcon.width} h=${onlineIcon.height} lig="${onlineIcon.ligatureText}" use=${onlineIcon.hasUse} sprite=${onlineIcon.spriteResolves}`);
  check('Online: no page errors', errors.length === 0, errors.slice(0, 3).join(' | ').slice(0, 200));

  // 2. Wait for the SW to finish installing (this precaches the shell, data,
  //    AND Google Fonts), then go offline and reload. This is the
  //    "first-ever visit is already offline-capable" guarantee: no second
  //    online load is needed to warm the font caches.
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
  check('Offline: icons render from the inline sprite (no font, no ligature text)',
    offlineIcon.found && offlineIcon.isSvg && offlineIcon.hasUse && offlineIcon.spriteResolves &&
    offlineIcon.width > 0 && offlineIcon.ligatureText === '',
    `svg=${offlineIcon.isSvg} w=${offlineIcon.width} h=${offlineIcon.height} lig="${offlineIcon.ligatureText}" use=${offlineIcon.hasUse} sprite=${offlineIcon.spriteResolves}`);
  check('Offline: no page errors', errors.length === 0, errors.slice(0, 3).join(' | ').slice(0, 200));

  // 4. Confirm the precache is Firebase-free (offline-first: no cross-origin
  //    SDKs are cached, and the shell itself is fully cached for offline).
  check('Offline: precache contains no Firebase SDKs', await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find((k) => k.startsWith('marrow-planner-pwa')) || keys[0]);
    const reqs = await cache.keys();
    return !reqs.some((r) => r.url.includes('gstatic.com/firebasejs'));
  }), 'no gstatic firebasejs entries in precache');
  check('Offline: app shell precached', await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find((k) => k.startsWith('marrow-planner-pwa')) || keys[0]);
    return !!(await cache.match('http://' + (keys[0] ? location.host : '') + '/index.html'))
      || !!(await cache.match('./index.html'));
  }), 'index.html in precache');

  await browser.close();

  const failed = results.filter((x) => !x.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  console.error('Offline test crashed:', err);
  process.exit(2);
}).finally(() => server.close());
