/* Visual verification — run from umu/:  node brand/preview-shots.mjs
   Boots against the dev server and captures dark/light topbar + dashboard. */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:8140';
const OUT = '/tmp/flowmd-shots';
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// default (dark) theme
await page.screenshot({ path: `${OUT}/01-dark-topbar.png`, clip: { x: 0, y: 0, width: 390, height: 90 } });
await page.screenshot({ path: `${OUT}/02-dark-dashboard.png` });

// force light theme (pure attribute swap — same mechanism theme.js uses)
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/03-light-topbar.png`, clip: { x: 0, y: 0, width: 390, height: 90 } });
await page.screenshot({ path: `${OUT}/04-light-dashboard.png` });

// font sanity: computed font-family of body + a heading
const fonts = await page.evaluate(() => ({
  body: getComputedStyle(document.body).fontFamily,
  topbarLogo: getComputedStyle(document.querySelector('.flowmd-topbar-logo')).height,
  logoVisibleDark: getComputedStyle(document.querySelector('.flowmd-topbar-logo-dark')).display,
}));
console.log(JSON.stringify(fonts, null, 2));

await browser.close();
console.log('screenshots → ' + OUT);
