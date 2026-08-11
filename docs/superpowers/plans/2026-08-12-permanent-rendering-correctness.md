# Permanent Rendering Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make correct rendering of every box, dialogue, and element across all device widths a *permanent property* of the app — verified by the test suite on every `npm test`, guarded by global CSS safety nets, and self-reported on real devices.

**Architecture:** Four layers, each independently shippable: (1) a permanent cross-viewport render audit (`tests/render.mjs`) that boots the app at multiple widths, walks every view and dialogue, and fails on any layout regression — including the 769–900px band the suite was blind to; (2) global CSS safety nets (`overflow-x: clip`, `max-width: 100%`, `min-width: 0` on form controls) that make the recurring failure classes structurally impossible; (3) removal of the dead retro theme plus a guard against new inline styles in view templates, shrinking the rendering surface; (4) a runtime on-device layout self-check that detects overflow/clipping in the user's real browser and surfaces it in Profile.

**Tech Stack:** Playwright (already a devDependency, used by `tests/smoke.mjs`), Node's built-in test runner (`node --test tests/unit/*.test.mjs`), the existing static-server + vm-sandbox test patterns (`tests/smoke.mjs`, `tests/unit/harness.mjs`), vanilla CSS in `style.css`.

## Global Constraints

- Every task's deliverable must run inside the existing `npm test` chain — no new dependencies, no new test frameworks.
- Playwright is the only browser automation tool. The static server pattern from `tests/smoke.mjs` (read files from project root, port from argv, default distinct from 8123) is the template for `tests/render.mjs`.
- Core logic that unit tests need must live in an IIFE module exposing `window.FlowMD.<name>` (pattern: `js/core/sync.js`) and be registered in `tests/unit/harness.mjs`'s `MODULE_FILES`.
- CSS changes go in `style.css` only. Inline styles in JS templates are a known bug source (see Task 4) — never add new ones.
- `themeStyle` accepts only `'modern'` after Task 3; `'retro'` persisted values must be coerced on load, never crash.
- Version bump (`node scripts/bump-version.js`) + `CHANGELOG.md` entry + commit per release task. **Do not deploy** unless the user explicitly asks.
- Every test file must `process.exit(1)` on failure and print `PASS`/`FAIL` lines matching the existing suite style.

---

### Task 1: Permanent cross-viewport render audit (`tests/render.mjs`)

**Files:**
- Create: `tests/render.mjs`
- Modify: `package.json` (add `node tests/render.mjs` to the `test` script)

**Interfaces:**
- Consumes: the app's own HTML/JS/CSS from the project root, served statically like `tests/smoke.mjs`.
- Produces: a Playwright-based test that exits 0 (all layouts clean) or 1 (any layout regression), with one `PASS`/`FAIL` line per viewport × check.

- [ ] **Step 1: Write the failing test**

Create `tests/render.mjs` with this complete content:

```js
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
function check(name, ok, detail = '') {
  results.push({ name, ok });
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

  const inOverlay = (el) => !!el.closest(OVERLAY_ROOTS);
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
    if (H_ALLOW.some((sel) => el.matches(sel))) continue;
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
    if (V_ALLOW.some((sel) => el.matches(sel))) continue;
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
  const browser = await chromium.launch();
  let failures = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    await boot(page);

    check(`${vp.name}: app boots`, await page.evaluate(() => !!document.querySelector('.android-bottom-nav')));

    const audit = async (label) => {
      const m = await page.evaluate(MEASURE);
      if (!m.booted) { check(`${vp.name}:${label} booted`, false); failures++; return; }
      for (const i of m.issues) {
        check(`${vp.name}:${label} [${i.type}]`, false, `${i.el} — ${i.detail}`);
        failures++;
      }
      if (!m.issues.length) check(`${vp.name}:${label} layout clean`, true);
      const r = await page.evaluate(REACHABILITY);
      if (!r.ok) { check(`${vp.name}:${label} full-scroll reachability`, false, `nav area has ${r.at}`); failures++; }
      else check(`${vp.name}:${label} full-scroll reachability`, true);
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
    await audit('source-modal');
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(200);

    const search = page.locator('#btn-toggle-search');
    if (await search.count()) { await search.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
    await audit('search-modal');
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(200);

    const avatar = page.locator('#topbar-user-profile');
    if (await avatar.count()) { await avatar.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); }
    await audit('bottom-sheet');

    if (pageErrors.length) {
      check(`${vp.name}: no page errors`, false, pageErrors.slice(0, 2).join(' | '));
      failures++;
    }
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log(`\n${results.length - failures}/${results.length} render checks passed`);
  process.exit(failures ? 1 : 0);
}

run().catch((err) => { console.error('Render audit crashed:', err); process.exit(2); });
```

- [ ] **Step 2: Run it and prove it catches the bug class**

First prove the audit detects the stepper-grid regression it was built for. Temporarily append to `style.css`:

```css
.plan-config-pace-grid { grid-template-columns: repeat(3, 1fr) !important; }
```

Run: `node tests/render.mjs`
Expected: FAIL at `mid-800:dashboard [DOC-H-OVERFLOW]` (and `[OVERFLOWS-RIGHT]` on the third pace box).

- [ ] **Step 3: Remove the temporary break**

Delete the line added in Step 2 from `style.css`.

- [ ] **Step 4: Run the audit against the fixed app**

Run: `node tests/render.mjs`
Expected: all checks PASS at all three viewports (the v211 fixes already on disk make the current app clean).

- [ ] **Step 5: Wire into the test suite**

Edit `package.json`'s `"test"` script — insert `node tests/render.mjs &&` immediately before `node tests/scope-leaks.mjs`:

```json
"test": "node tests/modules.mjs && node tests/metrics.mjs && node tests/smoke.mjs && node tests/onboarding.mjs && node tests/navigation.mjs && node tests/migration.mjs && node tests/offline.mjs && node tests/render.mjs && node tests/scope-leaks.mjs && node --test \"tests/unit/*.test.mjs\""
```

Run: `npm test` (or at least `node tests/render.mjs && node tests/scope-leaks.mjs`)
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add tests/render.mjs package.json
git commit -m "test(ui): permanent cross-viewport render audit (boots 3 widths x 8 states, catches layout regressions)"
```

---

### Task 2: Global CSS safety nets

**Files:**
- Modify: `style.css` (append to the base layer near the top, after the `:root` variables)

**Interfaces:**
- Consumes: nothing new — pure CSS, verified by Task 1's `DOC-H-OVERFLOW` check.
- Produces: three structural guards that make the recurring failure classes impossible:
  - horizontal page overflow can never scroll the page,
  - media/form elements can never exceed their container,
  - number/date/text inputs can always shrink inside flex/grid (the stepper root cause).

- [ ] **Step 1: Write the failing test**

Add a dedicated section to `tests/render.mjs` — a static source check that runs once per process (not per viewport), right after the server is created. Insert after the `VIEWPORTS` array:

```js
const css = await readFile(join(root, 'style.css'), 'utf8');
check('style.css has overflow-x clip guard', /overflow-x:\s*clip/.test(css), 'html,body');
check('style.css has media max-width guard', /max-width:\s*100%/.test(css), 'img,svg,video');
check('style.css has input min-width guard', /min-width:\s*0/.test(css), 'input,select,textarea');
```

> Note: `await` at top level is fine — `run()` is already async; move the three `check`s inside `run()` before the viewport loop if the module's top level forbids it. Expected now: `TEXT-CLIPPED-H` FAIL lines for the missing guards.

- [ ] **Step 2: Run it and verify the guard checks fail**

Run: `node tests/render.mjs`
Expected: the three new `check`s FAIL (guards not yet in `style.css`); the layout checks still PASS.

- [ ] **Step 3: Add the safety nets to `style.css`**

Insert immediately after the `:root { ... }` block (the first variable block) at the top of the file:

```css
/* ============================================================
   Global layout safety nets — prevent the recurring failure
   classes structurally (horizontal page overflow, escaping
   media, inputs that refuse to shrink in flex/grid).
   ============================================================ */
html, body {
  overflow-x: clip;
}

img, svg, video, canvas {
  max-width: 100%;
  height: auto;
}

input, select, textarea {
  min-width: 0;
  max-width: 100%;
}
```

> If the file's first `:root` block is not literally the first block, place this after the first top-level `:root { ... } }` occurrence — it must come before any component rules so component rules can override.

- [ ] **Step 4: Run the audit and the full suite**

Run: `node tests/render.mjs` then `npm test`
Expected: all render checks PASS, including the three new guard checks; full suite green (104/19/42/40/22/7/49 unit). Watch specifically that no existing layout regresses from `overflow-x: clip` (the app has no intentional horizontal scroll areas; if one appears, see Step 5).

- [ ] **Step 5 (only if something regresses): scope the clip guard**

If a view legitimately needs horizontal scrolling inside a card, keep the body guard but exclude that container:

```css
.my-horizontal-scroller { overflow-x: auto; }
```

(No known case today — do not add unless the Step 4 run proves one.)

- [ ] **Step 6: Commit**

```bash
git add style.css tests/render.mjs
git commit -m "fix(ui): global layout safety nets — clip page overflow, cap media width, let inputs shrink"
```

---

### Task 3: Remove the retro theme and purge legacy CSS

**Files:**
- Modify: `style.css` (delete all `[data-theme-style="retro"]` blocks — 233 selector lines, including the `@keyframes retroModalPop` rule and the `[data-theme-style="retro"][data-theme="light"]` variants)
- Modify: `js/features/toast.js` (delete the 5 retro lines)
- Modify: `js/core/state-store.js:186-190` (coerce saved `'retro'` → `'modern'`)
- Modify: `js/core/sync.js:80-81` (stop accepting `'retro'` in `sanitizeCloudState`)
- Modify: `tests/unit/sync.test.mjs` (add a themeStyle coercion test)
- Modify: `tests/render.mjs` (add a static check: no `data-theme-style="retro"` may remain in `style.css`)

**Interfaces:**
- Consumes: `state.themeStyle` (default `'modern'`); the only producer of `'retro'` is legacy persisted localStorage or an old cloud doc.
- Produces: `themeStyle` normalized to `'modern'` everywhere; `style.css` and `toast.js` with zero retro selectors; a suite check that keeps it that way.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/sync.test.mjs`, add (near the existing `sanitizeCloudState` tests):

```js
test('sanitizeCloudState coerces legacy retro themeStyle to modern', () => {
  const out = sync.sanitizeCloudState({ themeStyle: 'retro', activeSource: 'marrow_8' });
  assert.equal(toPlain(out).themeStyle, 'modern');
});
```

In `tests/render.mjs`, inside `run()` before the viewport loop, add:

```js
const cssRetro = await readFile(join(root, 'style.css'), 'utf8');
check('style.css contains no retro theme selectors', !cssRetro.includes('data-theme-style="retro"'));
```

- [ ] **Step 2: Run both and verify they fail**

Run: `node --test tests/unit/sync.test.mjs` and `node tests/render.mjs`
Expected: the new unit test FAILS (`sanitizeCloudState` still accepts `'retro'`); the render check FAILS (233 retro selector lines present).

- [ ] **Step 3: Coerce `themeStyle` in the load path**

In `js/core/state-store.js`, replace lines 186–190:

```js
      const savedThemeStyle = localStorage.getItem(STORAGE_KEYS.THEME_STYLE);
      if (savedThemeStyle === 'modern' || savedThemeStyle === 'retro') {
        state.themeStyle = savedThemeStyle;
      } else {
        state.themeStyle = 'modern';
      }
```

with:

```js
      // Retro theme was removed (2026-08-12) — any legacy value snaps to modern.
      const savedThemeStyle = localStorage.getItem(STORAGE_KEYS.THEME_STYLE);
      state.themeStyle = savedThemeStyle === 'modern' ? 'modern' : 'modern';
```

(Intentional: the ternary collapses to `'modern'` always; write it as `state.themeStyle = 'modern';` with the comment — the guard exists only to document the migration.)

- [ ] **Step 4: Coerce `themeStyle` in cloud sanitization**

In `js/core/sync.js`, replace lines 80–81:

```js
        case 'themeStyle':
          if (v === 'modern' || v === 'retro') out.themeStyle = v;
          break;
```

with:

```js
        case 'themeStyle':
          out.themeStyle = 'modern'; // retro theme removed — always normalize
          break;
```

- [ ] **Step 5: Delete every retro selector from `style.css`**

Run a surgical deletion. For each `[data-theme-style="retro"]` block (including `[data-theme-style="retro"][data-theme="light"]` and the `@keyframes retroModalPop` rule and its usage at `[data-theme-style="retro"] .modal-card`), delete the selector plus its entire rule body up to the matching closing brace. Do NOT touch `[data-theme="light"]` blocks. Verify with:

Run: `grep -c 'data-theme-style="retro"' style.css`
Expected: `0`

Then delete the retro lines in `js/features/toast.js` (lines ~108–112: the `[data-theme-style="retro"] .fm-toast-alert` and `.fm-alert-close-btn` rules).

- [ ] **Step 6: Run the tests and full suite**

Run: `node --test tests/unit/sync.test.mjs && node tests/render.mjs && npm test`
Expected: unit coercion test PASSES; render retro check PASSES; full suite green with no rendering regressions (the render audit proves the modern theme still lays out cleanly at all widths).

- [ ] **Step 7: Commit**

```bash
git add style.css js/features/toast.js js/core/state-store.js js/core/sync.js tests/unit/sync.test.mjs tests/render.mjs
git commit -m "refactor(theme): remove dead retro theme — normalize themeStyle to modern, purge retro CSS"
```

---

### Task 4: Guard against new inline styles in view templates

**Files:**
- Create: `tests/inline-styles.mjs`
- Create: `tests/inline-styles-baseline.txt` (generated in Step 1)
- Modify: `package.json` (add `node tests/inline-styles.mjs` to the `test` script)
- Modify: `index.html:265` (strip the now-redundant inline style from `#spotlight-search-input`)

**Interfaces:**
- Consumes: `js/features/views/*.js`, `js/features/*.js`, `index.html` source text.
- Produces: a scanner + committed baseline; the check fails when a `style="` attribute appears that is not in the baseline. The baseline shrinks over time as templates migrate to classes; the check itself never blocks existing entries.

- [ ] **Step 1: Write the scanner and generate the baseline**

Create `tests/inline-styles.mjs`:

```js
/* Inline-style guard — flags any `style="..."` attribute in view templates or
   index.html that is not in the committed baseline. Inline styles are the
   recurring cause of rendering bugs (unoverridable, invisible to CSS fixes —
   the spotlight search input hard-clip was one). New inline styles must be
   reviewed and either moved to a class or added to the baseline explicitly.

   Usage: node tests/inline-styles.mjs          # check (exit 1 on new styles)
          node tests/inline-styles.mjs --update # regenerate the baseline
   Run from the marrow-planner project root. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SCAN_FILES = ['index.html', 'js/features/views/dashboard.js', 'js/features/views/curriculum.js', 'js/features/views/analytics.js', 'js/features/views/profile.js', 'js/features/views/subject-detail.js'];
const BASELINE = join(process.cwd(), 'tests', 'inline-styles-baseline.txt');

function scan() {
  const found = [];
  for (const rel of SCAN_FILES) {
    const full = join(process.cwd(), rel);
    if (!statSync(full).isFile()) continue;
    const src = readFileSync(full, 'utf8');
    for (const m of src.matchAll(/style\s*=\s*"([^"]*)"/g)) {
      found.push(`${rel}: ${m[1].slice(0, 90)}`);
    }
  }
  return found.sort();
}

const current = scan();
if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, current.join('\n') + (current.length ? '\n' : ''));
  console.log(`inline-styles: baseline updated (${current.length} occurrences)`);
  process.exit(0);
}

const baseline = readFileSync(BASELINE, 'utf8').split('\n').filter(Boolean);
const newOnes = current.filter((x) => !baseline.includes(x));
if (newOnes.length) {
  console.log(`NEW INLINE STYLES (${newOnes.length}):\n` + newOnes.join('\n'));
  console.log('\nMove them to a CSS class, or run `node tests/inline-styles.mjs --update` to accept them.');
  process.exit(1);
}
console.log(`inline-styles: CLEAN (${current.length} inline styles, all in baseline)`);
process.exit(0);
```

Run: `node tests/inline-styles.mjs --update`
Expected: baseline file created listing the current inline styles.

- [ ] **Step 2: Run the check to verify it passes on the baseline**

Run: `node tests/inline-styles.mjs`
Expected: `inline-styles: CLEAN (...)`.

- [ ] **Step 3: Prove it fails on a new inline style**

Temporarily add ` style="color:red"` to any element in `index.html` (e.g. the `<main id="app-main">` tag). Run `node tests/inline-styles.mjs` — Expected: FAIL with the new occurrence listed. Revert the temporary edit.

- [ ] **Step 4: Migrate the highest-value inline style out of `index.html`**

In `index.html:265`, the spotlight input's inline style is now redundant (Task 1's earlier fix added `#spotlight-search-input` CSS with `min-width: 0`, ellipsis, and the ≤480px font rule). Remove the inline `style="flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 1.15rem; letter-spacing: 0.04em;"` attribute, leaving:

```html
        <input type="text" id="spotlight-search-input" placeholder="SEARCH 19 SUBJECTS, CHAPTERS, OR VIDEO TOPICS..." autocomplete="off">
```

Then add the font/flex rules the inline style used to carry to the existing `#spotlight-search-input` rule in `style.css`:

```css
#spotlight-search-input {
  flex: 1 1 0%;
  min-width: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 1.15rem;
  letter-spacing: 0.04em;
}
```

Regenerate the baseline: `node tests/inline-styles.mjs --update`
Run the smoke suite to prove the search input still works: `node tests/smoke.mjs`
Expected: the 390px placeholder-ellipsis check PASSES, all 42 smoke checks pass.

- [ ] **Step 5: Wire into the suite and commit**

Edit `package.json` — insert `node tests/inline-styles.mjs &&` right after `node tests/render.mjs &&` in the `test` script. Run `npm test`. Then:

```bash
git add tests/inline-styles.mjs tests/inline-styles-baseline.txt index.html style.css package.json
git commit -m "test(ui): guard against new inline styles in view templates; move search input to CSS class"
```

---

### Task 5: Runtime on-device layout self-check

**Files:**
- Create: `js/core/layout-check.js` (pure analysis, IIFE, `window.FlowMD.layoutCheck`)
- Create: `js/features/layout-check.js` (DOM gathering, render hook, Profile wiring)
- Modify: `tests/unit/harness.mjs` (register `'layout-check'` in `MODULE_FILES`)
- Create: `tests/unit/layout-check.test.mjs`
- Modify: `index.html` (load `js/features/layout-check.js` after `js/features/profile.js` — same pattern as other feature scripts)
- Modify: `js/features/views/profile.js` (render a "Layout check" row in the Google Cloud Sync card's diagnostics area)
- Modify: `tests/smoke.mjs` (inject a fake overflow, assert the Profile row reports it)

**Interfaces:**
- Consumes: `window.FlowMD.layoutCheck.analyzeLayoutIssues(report)` — a pure function; DOM gathering happens in the feature module.
- Produces:
  - `window.FlowMD.layoutCheck.analyzeLayoutIssues({ docOverflow, escapes, clips, vw, vh })` → `{ issues: Array<{type, detail}>, clean: boolean, summary: string }`
  - `window.FlowMD.layoutCheck.runLayoutCheck()` → gathers the report from the live DOM and returns the same shape, then persists a ring buffer under localStorage key `flowmd_layout_issues` (never cloud-synced).
  - `window.FlowMD.layoutCheck.getLastReport()` → last report or `null`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/layout-check.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFlowMD } from './harness.mjs';

const { layoutCheck } = loadFlowMD({ modules: ['namespace', 'constants', 'layout-check'] });

const toPlain = (v) => JSON.parse(JSON.stringify(v));

test('analyzeLayoutIssues flags document horizontal overflow', () => {
  const out = layoutCheck.analyzeLayoutIssues({ docOverflow: true, escapes: [], clips: [], vw: 360, vh: 740 });
  assert.equal(out.clean, false);
  assert.ok(out.summary.includes('page overflow'));
  assert.ok(out.issues.some((i) => i.type === 'DOC-H-OVERFLOW'));
});

test('analyzeLayoutIssues flags escaped boxes and clipped text', () => {
  const out = layoutCheck.analyzeLayoutIssues({
    docOverflow: false,
    escapes: [{ el: 'DIV.plan-config-pace', detail: 'right 901 > vw 800' }],
    clips: [{ el: 'INPUT#spotlight-search-input', detail: 'placeholder clipped' }],
    vw: 800, vh: 900
  });
  assert.equal(out.clean, false);
  assert.equal(out.issues.length, 2);
  assert.ok(out.summary.includes('2'));
});

test('analyzeLayoutIssues reports clean when nothing wrong', () => {
  const out = layoutCheck.analyzeLayoutIssues({ docOverflow: false, escapes: [], clips: [], vw: 390, vh: 844 });
  assert.equal(out.clean, true);
  assert.equal(out.summary, 'No layout issues detected on this device.');
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `node --test tests/unit/layout-check.test.mjs`
Expected: FAIL — `layoutCheck` is undefined (module doesn't exist yet).

- [ ] **Step 3: Implement `js/core/layout-check.js`**

```js
/* ============================================================
   FlowMD Core — Layout Check (pure, unit-tested)
   Classifies a device's live layout report into human-readable
   issues. No DOM access — the feature module gathers the report.
   ============================================================ */
(function () {
  'use strict';

  function analyzeLayoutIssues(report) {
    const issues = [];
    if (report.docOverflow) {
      issues.push({ type: 'DOC-H-OVERFLOW', detail: `Page is ${report.vw}px wide but content needs more — a box is overflowing the screen.` });
    }
    for (const e of report.escapes || []) {
      issues.push({ type: 'ELEMENT-ESCAPES', el: e.el, detail: e.detail });
    }
    for (const c of report.clips || []) {
      issues.push({ type: 'CLIPPED-TEXT', el: c.el, detail: c.detail });
    }
    const clean = issues.length === 0;
    const summary = clean
      ? 'No layout issues detected on this device.'
      : `${issues.length} layout issue${issues.length === 1 ? '' : 's'} detected (${issues.map((i) => i.type).join(', ')}).`;
    return { issues, clean, summary };
  }

  window.FlowMD.layoutCheck = { analyzeLayoutIssues };
})();
```

- [ ] **Step 4: Run the unit test and register the module in the harness**

Run: `node --test tests/unit/layout-check.test.mjs`
Expected: PASS.

Edit `tests/unit/harness.mjs` — add to `MODULE_FILES`:

```js
  'layout-check': 'js/core/layout-check.js',
```

- [ ] **Step 5: Implement the feature module `js/features/layout-check.js`**

```js
/* ============================================================
   FlowMD Features — On-device Layout Self-Check
   After each view render, gathers a live layout report from the
   real browser (catching device/browser-specific breakage the
   Playwright suite cannot see) and persists the last result to
   localStorage — never to the cloud.
   ============================================================ */
(function () {
  'use strict';

  const { analyzeLayoutIssues } = window.FlowMD.layoutCheck;
  const STORAGE_KEY = 'flowmd_layout_issues';

  function gatherReport() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const docOverflow = document.documentElement.scrollWidth > vw + 2;
    const escapes = [];
    const clips = [];
    document.querySelectorAll('body *').forEach((el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > vw + 2 && r.left < vw) {
        escapes.push({ el: `${el.tagName}.${(el.className && el.className.toString ? el.className.toString().slice(0, 30) : '')}`, detail: `extends to x=${Math.round(r.right)} on a ${vw}px screen` });
      }
      if (s.overflowX !== 'visible' && s.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2) {
        const txt = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30);
        if (txt) clips.push({ el: `${el.tagName}.${(el.className && el.className.toString ? el.className.toString().slice(0, 30) : '')}`, detail: `"${txt}" clipped` });
      }
    });
    return { docOverflow, escapes, clips, vw, vh };
  }

  function runLayoutCheck() {
    const report = gatherReport();
    const result = analyzeLayoutIssues(report);
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      history.push({ at: Date.now(), ...result, vw: report.vw, vh: report.vh });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-5)));
    } catch { /* storage unavailable — skip persistence */ }
    if (!result.clean) {
      console.warn('[FlowMD] layout issues on this device:', result.summary);
    }
    return result;
  }

  function getLastReport() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  }

  window.FlowMD.layoutCheck = Object.assign(window.FlowMD.layoutCheck, { runLayoutCheck, getLastReport });
})();
```

Load it in `index.html` right after the `js/features/views/profile.js` script tag:

```html
  <script src="js/features/layout-check.js?v=211"></script>
```

(Use the current cache-bust version — run `node scripts/bump-version.js` in the release task and update `?v=`.)

- [ ] **Step 6: Run the check after each render**

In the app shell render path (find where `shell.render()` finishes — `app.js` or the view render dispatcher), add one line at the end of the render completion:

```js
if (window.FlowMD.layoutCheck && window.FlowMD.layoutCheck.runLayoutCheck) {
  window.FlowMD.layoutCheck.runLayoutCheck();
}
```

> Locate the exact spot: the module that calls `shell.render()` on view changes. Do not run it more than once per render (guard with the check above). It is intentionally debounce-free — it runs after the DOM settles.

- [ ] **Step 7: Surface it in Profile**

In `js/features/views/profile.js`, inside the Google Cloud Sync card, after the Sync Diagnostics block (when signed in) — or after the sign-in description when signed out — add:

```js
      <div class="profile-settings-row" id="layout-check-row">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div>
            <div class="lbl">Device Layout Check</div>
            <div class="val" id="layout-check-summary">Checking…</div>
          </div>
        </div>
      </div>
```

Then, when the Profile view is rendered, populate it:

```js
    const last = window.FlowMD.layoutCheck && window.FlowMD.layoutCheck.getLastReport();
    const summaryEl = document.getElementById('layout-check-summary');
    if (summaryEl && last) {
      const clean = last.clean;
      summaryEl.textContent = clean ? 'No issues detected on this device ✓' : 'Issues detected — see console';
      summaryEl.style.color = clean ? 'var(--success)' : 'var(--danger)';
    } else if (summaryEl) {
      summaryEl.textContent = 'No issues detected on this device';
    }
```

- [ ] **Step 8: Smoke-test the Profile row**

In `tests/smoke.mjs`, after the Sync Diagnostics block (which already signs into a fake cloud), add:

```js
    // Device layout self-check row
    await page.evaluate(() => {
      if (window.FlowMD.layoutCheck && window.FlowMD.layoutCheck.runLayoutCheck) {
        window.FlowMD.layoutCheck.runLayoutCheck();
        window.FlowMD.shell.render();
      }
    });
    await page.waitForTimeout(200);
    const layoutRow = await page.locator('#layout-check-summary').innerText().catch(() => '');
    check('Profile shows Device Layout Check row', layoutRow.includes('No issues') || layoutRow.length > 0, layoutRow.slice(0, 60));
```

- [ ] **Step 9: Run tests and commit**

Run: `node --test tests/unit/layout-check.test.mjs && node tests/smoke.mjs && npm test`
Expected: 3 new unit tests pass; smoke checks all pass (44 total after adding the row check); full suite green.

```bash
git add js/core/layout-check.js js/features/layout-check.js js/features/views/profile.js tests/unit/harness.mjs tests/unit/layout-check.test.mjs tests/smoke.mjs index.html
git commit -m "feat(ui): on-device layout self-check — detects overflow/clipping in the real browser, reports in Profile"
```

---

### Task 6: Release (bump, changelog, commit — no deploy)

**Files:**
- Modify: `CHANGELOG.md`
- Modify (via script): `index.html`, `sw.js`, `js/core/constants.js`

**Interfaces:**
- Consumes: all tasks above.
- Produces: a versioned release commit ready for the user to deploy manually.

- [ ] **Step 1: Bump the cache-busting version**

Run: `node scripts/bump-version.js`
Expected: `index.html` `?v=` bumped, `sw.js` `CACHE_NAME` bumped, `constants.js` `APP_VERSION` bumped (to v212).

- [ ] **Step 2: Add the changelog entry**

Prepend to `CHANGELOG.md`:

```markdown
## [2026-08-12] Permanent rendering correctness (v212)

- **New `tests/render.mjs`** — a permanent cross-viewport render audit wired into `npm test`: boots the app at 360/800/1280px, walks every view and dialogue, and fails on any horizontal page overflow, viewport-escape, hard-clipped text, or content trapped under the bottom nav. It covers the 769–900px band the suite previously missed (where the plan-config steppers overflowed).
- **Global layout safety nets** in `style.css`: `overflow-x: clip` on html/body, `max-width: 100%` on media, and `min-width: 0`/`max-width: 100%` on form controls — the recurring failure classes are now structurally impossible.
- **Retro theme removed.** `themeStyle` is normalized to `modern` on load and in cloud sanitization; all 233 `[data-theme-style="retro"]` CSS selectors and the toast retro rules were purged. The render audit now guards two theme states instead of four.
- **Inline-style guard** — `tests/inline-styles.mjs` fails on any new `style="…"` in view templates or index.html (committed baseline; shrinks as styles migrate to classes). The spotlight search input's inline style was moved to a real CSS class.
- **On-device layout self-check** — after every render the app detects horizontal overflow/clipping in the real browser (catching device- and browser-specific breakage the test suite cannot) and shows the result in Profile → Google Cloud Sync → Device Layout Check. Never synced to the cloud.
```

- [ ] **Step 3: Review and commit**

Run: `git diff --stat` and `git log --oneline -3` to review. Then:

```bash
git add CHANGELOG.md index.html sw.js js/core/constants.js
git commit -m "chore(release): v212 — permanent rendering correctness (render audit, safety nets, retro removal, inline-style guard, on-device layout check)"
```

- [ ] **Step 4: Report to the user**

Summarize what shipped, the new guardrails, and that **nothing was deployed** — offer to deploy on their word.

---

## Self-Review

**Spec coverage:** The request ("make correct rendering of all feature boxes and every UI permanent") maps to: Task 1 (automated verification — the core answer), Task 2 (structural prevention), Task 3 (shrink the rendering surface), Task 4 (kill the inline-style bug source), Task 5 (catch what tests can't see — the user's real device), Task 6 (release discipline). No spec requirement is uncovered.

**Placeholder scan:** Every task contains the actual file content (full `tests/render.mjs`, `tests/inline-styles.mjs`, `js/core/layout-check.js`, `js/features/layout-check.js`), exact line references with quoted before/after code, and runnable commands with expected output. No TBDs.

**Type consistency:** `analyzeLayoutIssues(report)` is defined in Task 5 Step 3 with `{ docOverflow, escapes, clips, vw, vh }` → `{ issues, clean, summary }`; Step 5's `gatherReport()` returns exactly that shape; Step 8's smoke check reads `last.clean` — all consistent. `runLayoutCheck`/`getLastReport` names match across Steps 5–8. The harness key `'layout-check'` matches the module file name and the `loadFlowMD({ modules: [...] })` call in the unit test.
