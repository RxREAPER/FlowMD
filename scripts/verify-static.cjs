// Static integrity check used as the "build" step for this no-bundler PWA.
// Verifies every locally-referenced asset in index.html and the sw.js
// precache list actually exists, so a broken deploy is caught before it ships.
// Also verifies the landing page: its assets resolve against landing/,
// the CSP meta is present, there is no inline script/style, and the landing
// is isolated from the app's service worker.
// Exits 0 on success, 1 listing any problems.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const problems = [];

function collectRefs(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const refs = new Set();
  // src="..." and href="..." (covers <script>, <link>, <use>, <img>, ...)
  const attrRe = /\b(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = attrRe.exec(text)) !== null) refs.add(m[1]);
  // String literals in sw.js ASSETS list (e.g. './index.html')
  const strRe = /'(\.\/[^']+)'/g;
  while ((m = strRe.exec(text)) !== null) refs.add(m[1]);
  return refs;
}

function verifyRefs(refs, baseDir, label) {
  const missing = [];
  for (const raw of refs) {
    const ref = raw.split('?')[0].split('#')[0]; // strip ?v= cache-busting + fragments
    if (!ref || ref === '/') continue;
    if (/^(?:https?:|data:|mailto:|tel:|javascript:|blob:|\/\/)/.test(ref)) continue;
    if (ref.startsWith('#')) continue; // in-page/SVG-use fragment
    const rel = ref.replace(/^\.\//, '');
    if (!fs.existsSync(path.join(baseDir, rel))) missing.push(rel);
  }
  if (missing.length) {
    problems.push('Static asset check FAILED (' + label + ') — missing files:\n  ' + missing.join('\n  '));
  } else {
    console.log('Static asset check OK (' + label + ', ' + refs.size + ' references verified).');
  }
}

// --- App (index.html + sw.js precache) ---
const appRefs = new Set();
collectRefs(path.join(root, 'index.html')).forEach((r) => appRefs.add(r));
collectRefs(path.join(root, 'sw.js')).forEach((r) => appRefs.add(r));
verifyRefs(appRefs, root, 'app');

// --- Offline-first: the app must make zero Firebase/Google network calls. ---
// Both CSPs (meta in index.html and the firebase.json header) must be clean of
// every Google/Firebase domain, and index.html must not reference any Firebase
// SDK or the dormant sync modules.
function checkAppOfflineIsolation() {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
  const fbJson = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf-8'));
  const headerCsp = (fbJson.hosting || [])
    .find((h) => h.target === 'app');
  const cspValues = [indexHtml.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)].filter(Boolean).map((m) => m[1]);
  if (headerCsp && headerCsp.headers) {
    headerCsp.headers.forEach((h) => { if (h.key === 'Content-Security-Policy') cspValues.push(h.value); });
  }
  const forbidden = /googleapis|gstatic|google-analytics|googletagmanager|firebaseio|firebaseapp|\.google\./;
  cspValues.forEach((csp, i) => {
    if (forbidden.test(csp)) {
      problems.push('Offline isolation FAILED — CSP #' + (i + 1) + ' still allows Google/Firebase domains');
    }
  });
  if (/gstatic\.com\/firebasejs|firebase\.js\?|js\/core\/sync\.js\?|js\/features\/sync\.js\?/.test(indexHtml)) {
    problems.push('Offline isolation FAILED — index.html still loads Firebase SDK or sync modules');
  }
  if (/(accounts\.google|apis\.google|firebaseapp\.com)/.test(indexHtml)) {
    problems.push('Offline isolation FAILED — index.html still references Google auth domains');
  }
  console.log('Offline isolation check OK (no Firebase/Google refs in app CSP or index.html).');
}

checkAppOfflineIsolation();

// --- Landing page ---
function checkLanding() {
  const landingDir = path.join(root, 'landing');
  const indexFile = path.join(landingDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    problems.push('Landing check FAILED — landing/index.html does not exist');
    return;
  }

  // (a) Every ./assets/... reference resolves against the landing directory
  // (NOT the repo root — the landing is served as its own hosting site).
  const landingRefs = collectRefs(indexFile);
  verifyRefs(landingRefs, landingDir, 'landing');

  // (b) CSP meta tag present
  const html = fs.readFileSync(indexFile, 'utf-8');
  if (!/<meta http-equiv="Content-Security-Policy"/i.test(html)) {
    problems.push('Landing check FAILED — CSP meta tag missing from landing/index.html');
  }

  // (c) No inline <script> or <style> (CSP script-src/style-src 'self')
  if (/<\s*script(?![^>]*\bsrc=)/i.test(html)) {
    problems.push('Landing check FAILED — inline <script> found in landing/index.html');
  }
  if (/<\s*style(?![^>]*\bsrc=)/i.test(html)) {
    problems.push('Landing check FAILED — inline <style> found in landing/index.html');
  }

  // (d) sw.js must not precache any landing path (app/landing isolation)
  const swText = fs.readFileSync(path.join(root, 'sw.js'), 'utf-8');
  if (/\.\/landing\//.test(swText) || /['"]landing\//.test(swText)) {
    problems.push('Landing check FAILED — sw.js precache references landing/ paths');
  }

  // (e) The landing must never register a service worker
  const landingJs = fs.readFileSync(path.join(landingDir, 'app.js'), 'utf-8');
  if (/serviceWorker\.register/.test(html) || /serviceWorker\.register/.test(landingJs)) {
    problems.push('Landing check FAILED — landing registers a service worker');
  }

  // (f) Landing css/js/favicon refs must carry a ?v= cache-buster (the landing
  // is served immutable for a year; without versioning a deploy leaves stale
  // assets on returning visitors).
  const versioned = [...html.matchAll(/(?:src|href)="\.\/(style\.css|app\.js|assets\/favicon\.svg)(\?v=[\d.]+)?"/g)];
  const unversioned = versioned.filter((m) => !m[2]);
  if (unversioned.length) {
    problems.push('Landing check FAILED — landing refs missing ?v= cache-buster: ' + unversioned.map((m) => m[1]).join(', '));
  }

  // (g) The app hosting site must ignore landing/ (canonical URL stays
  // flowmd-landing.web.app; double-serving from flowmd-04.web.app/landing/ is
  // untidy and duplicates the page for SEO).
  const fbJson = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf-8'));
  const appSite = (fbJson.hosting || []).find((h) => h.target === 'app');
  if (!appSite || !(appSite.ignore || []).includes('landing/**')) {
    problems.push('Landing check FAILED — app hosting site must ignore landing/**');
  }

  console.log('Landing check OK (assets, CSP meta, no inline script/style, SW isolation, versioned refs, app-site ignore).');
}

checkLanding();

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('All static checks passed.');
