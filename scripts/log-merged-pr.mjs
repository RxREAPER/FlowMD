/* ============================================================
   FlowMD worklog auto-logger — runs in CI after a PR is merged.

   Appends a terse entry to WORKLOG.md (under "## Session Log",
   newest first, grouped per day) and commits it straight to main.
   Classification is driven by the PR title:

     fix(offline): ...      → Bug fix
     feat(analytics): ...   → Feature (analytics)
     UI UX 5                → UI/UX (recognized prefix, no scope)
     chore: bump cache ...  → Maintenance
     docs-only titles       → Maintenance + "docs-only" tag

   Docs-only = every file in the PR matches *.md or *.txt. These get
   a visible tag; the deploy workflow itself skips them via
   paths-ignore, so the tag is informational, not load-bearing.

   Env:
     GITHUB_TOKEN   token with repo scope (Actions' GITHUB_TOKEN works)
     GITHUB_REPOSITORY  owner/name (set automatically in Actions)

   Usage (in CI):
     node scripts/log-merged-pr.mjs <pr_number> <merge_sha>

   Local dry-run (no push, no commit):
     GITHUB_TOKEN=... node scripts/log-merged-pr.mjs <pr_number> --dry-run
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';

const [prNumberArg, shaArg] = process.argv.slice(2);
const DRY_RUN = process.argv.includes('--dry-run');
const repo = process.env.GITHUB_REPOSITORY || 'RxREAPER/FlowMD';
const token = process.env.GITHUB_TOKEN;
const prNumber = Number(prNumberArg);
const mergeSha = (shaArg || '').replace('--dry-run', '').trim();

if (!prNumber || !token) {
  console.error('usage: GITHUB_TOKEN=... node scripts/log-merged-pr.mjs <pr_number> [merge_sha] [--dry-run]');
  process.exit(2);
}

const api = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'flowmd-worklog-bot'
    }
  });
  if (!res.ok) throw new Error(`GitHub API ${path} → ${res.status}`);
  return res.json();
};

const clean = (s) => String(s ?? '').replace(/\r/g, '').replace(/[^\S\n]+$/gm, '').trim();

/* ---------- classification ---------- */

const KNOWN_PREFIXES = {
  feat: 'Feature', fix: 'Bug fix', uiux: 'UI/UX', ui: 'UI/UX', ux: 'UI/UX',
  perf: 'Performance', refactor: 'Refactor', docs: 'Docs', test: 'Tests',
  chore: 'Maintenance', ci: 'CI', security: 'Security'
};

function classify(title) {
  const t = clean(title);
  // "type(scope): subject" or "type(scope) - subject" or "type(scope) subject"
  const m = t.match(/^([A-Za-z]+)(?:\(([^)]*)\))?\s*[:\-–]?\s+(.+)$/);
  let kind = 'Change';
  let scope = '';
  let subject = t;
  if (m && KNOWN_PREFIXES[m[1].toLowerCase()]) {
    kind = KNOWN_PREFIXES[m[1].toLowerCase()];
    scope = (m[2] || '').trim();
    subject = m[3].trim();
  }
  const isDocs = kind === 'Docs';
  return { kind, scope, subject, isDocs };
}

/* ---------- PR body → summary bullets ---------- */

function summaryBullets(body, max = 4) {
  const text = clean(body);
  if (!text) return [];
  // Grab the named section's bullet list. Two attempts: one when a later
  // heading terminates the section, one when the section runs to the end
  // of the body. (A single regex with a multiline `$` alternative would
  // stop at the heading's own line-end and swallow nothing.)
  const head = '^##\\s*(?:Summary|What|Why)\\b[^\\n]*\\n';
  const section = text.match(new RegExp(head + '([\\s\\S]*?)(?=\\n#\\x23\\s|\\n---\\s|\\n🤖)', 'mi'))
    || text.match(new RegExp(head + '([\\s\\S]*)$', 'mi'));
  if (!section) return [];
  const lines = section[0].split('\n').slice(1)
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/^`+|`+$/g, '').trim())
    .filter(Boolean)
    .filter((l) => !/^🤖|Generated with|Co-Authored/i.test(l))
    .slice(0, max)
    .map((l) => (l.length > 180 ? l.slice(0, 177) + '…' : l));
  return lines;
}

/* ---------- worklog entry ---------- */

function buildEntry(pr, files) {
  const { kind, scope, subject, isDocs } = classify(pr.title);
  const scopeTxt = scope ? ` — ${scope}` : '';
  const paths = files.map((f) => f.filename);
  const docsOnly = isDocs || (paths.length > 0 && paths.every((p) => /\.(md|txt)$/i.test(p)));

  const bullets = [];
  bullets.push(`- Merged **#${pr.number} — ${subject}** (${kind}${scopeTxt}, by ${pr.merged_by?.login || 'unknown'}) → ${mergeSha.slice(0, 7)}`);
  if (docsOnly) bullets.push(`  - *Docs-only — deploy skipped.*`);
  bullets.push(`  - Files: ${paths.length}${paths.length <= 3 ? ` (${paths.join(', ')})` : ''}`);

  const bullets2 = summaryBullets(pr.body);
  if (bullets2.length) for (const b of bullets2) bullets.push(`  - ${b}`);
  else bullets.push(`  - (no ## Summary section in PR body)`);

  return { text: bullets.join('\n'), docsOnly };
}

function today() {
  // CI runs in UTC; that's fine for a log.
  return new Date().toISOString().slice(0, 10);
}

function insertEntry(worklog, entryText) {
  const marker = '## Session Log';
  const idx = worklog.indexOf(marker);
  if (idx === -1) throw new Error('WORKLOG.md has no "## Session Log" section');
  const afterMarker = idx + marker.length;

  // Newest-first. Auto entries only ever append into an existing
  // "Auto-log (merged PRs)" group for today — never into hand-written
  // session groups, which have narrative headings of their own.
  const rest = worklog.slice(afterMarker);
  const heading = rest.match(/\n(### \d{4}-\d{2}-\d{2}[^\n]*)\n/);
  const isTodaysAutoGroup = heading && heading[1].startsWith(`### ${today()}`) &&
    heading[1].includes('Auto-log');
  let insertAt, entryBlock;
  if (isTodaysAutoGroup) {
    const groupStart = afterMarker + heading.index + heading[0].length;
    entryBlock = `\n${entryText}`;
    insertAt = groupStart;
  } else {
    // No trailing newline: the content that follows already starts with
    // its own "\n\n### " separation.
    entryBlock = `\n### ${today()} — Auto-log (merged PRs)\n\n${entryText}`;
    insertAt = afterMarker;
  }
  return worklog.slice(0, insertAt) + entryBlock + worklog.slice(insertAt);
}

/* ---------- main ---------- */

const pr = await api(`/repos/${repo}/pulls/${prNumber}`);
if (!pr.merged) {
  console.log(`PR #${prNumber} is not merged — nothing to log.`);
  process.exit(0);
}
const files = await api(`/repos/${repo}/pulls/${prNumber}/files?per_page=100`);

const { text: entryText, docsOnly } = buildEntry(pr, files);
const worklogPath = new URL('../WORKLOG.md', import.meta.url).pathname;
const updated = insertEntry(readFileSync(worklogPath, 'utf8'), entryText);

if (DRY_RUN) {
  console.log('--- DRY RUN: entry that would be inserted ---');
  console.log(entryText);
  console.log('--- resulting Session Log head ---');
  console.log(updated.slice(updated.indexOf('## Session Log'), updated.indexOf('## Session Log') + 1200));
  process.exit(0);
}

writeFileSync(worklogPath, updated);

/* Commit + push with retry: the deploy job's cache-bump commit can land
   between our checkout and push, so rebase and try again. */
const { execSync } = await import('node:child_process');
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

run(`git config user.name "FlowMD Auto-Logger"`);
run(`git config user.email "actions@github.com"`);
run(`git add WORKLOG.md`);
// The logger's commit only ever touches WORKLOG.md — the PR's own merge
// commit already triggered the real deploy — so ALWAYS append
// [skip-deploy]; deploy.yml's deploy-job condition honors the suffix.
const tag = docsOnly ? ' (docs-only) [skip-deploy]' : ' [skip-deploy]';
run(`git commit -m "worklog: auto-log PR #${prNumber}${tag}"`);

let pushed = false;
for (let attempt = 1; attempt <= 3 && !pushed; attempt++) {
  try {
    run(`git push origin HEAD:main`);
    pushed = true;
  } catch (e) {
    if (attempt === 3) throw e;
    run(`git pull --rebase origin main || true`);
  }
}
console.log(`Worklog updated for PR #${prNumber}${pushed ? ' and pushed' : ''}`);
