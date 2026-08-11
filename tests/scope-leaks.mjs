/* Scope-leak audit — flags bare function calls in the app's modules that are
   not covered by a window.FlowMD.* import, a local declaration, a parameter,
   or a known global. These are the ReferenceError time bombs that only fire
   when a user interacts (the module split broke handler wiring this way
   before: getPlanById, bare render(), notifyChanged).

   Usage: node tests/scope-leaks.mjs
   Run from the marrow-planner project root. Exits 1 on any flagged call. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['js/features/views', 'js/features', 'js/core', '.'];

const KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof',
  'new', 'in', 'of', 'case', 'default', 'do', 'else', 'try', 'finally',
  'throw', 'var', 'let', 'const', 'class', 'extends', 'super', 'this',
  'yield', 'async', 'await', 'delete', 'void', 'instanceof', 'null',
  'true', 'false', 'undefined'
]);

const GLOBALS = new Set([
  'window', 'document', 'localStorage', 'console', 'confirm', 'navigator',
  'alert', 'prompt', 'Date', 'Math', 'JSON', 'parseInt', 'parseFloat',
  'String', 'Number', 'Object', 'Array', 'Promise', 'setTimeout',
  'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame',
  'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'Event',
  'MutationObserver', 'location', 'history', 'fetch', 'atob', 'btoa',
  'performance', 'screen', 'matchMedia', 'crypto', 'structuredClone',
  'URL', 'FormData', 'CustomEvent', 'Blob', 'FileReader', 'Audio', 'Image',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'RegExp', 'Error', 'TypeError',
  'ReferenceError', 'Infinity', 'NaN', 'globalThis', 'requestIdleCallback',
  'AbortController', 'TextEncoder', 'TextDecoder', 'Intl', 'Proxy', 'Reflect',
  'Response', 'Request', 'Headers', 'caches', 'CacheStorage', 'OffscreenCanvas',
  'requestAnimationFrame', 'cancelAnimationFrame', 'Notification', 'XPathResult'
]);

// Replace comments, strings, template literals (incl. nested templates and
// `${...}` interpolations), and regex literals with spaces via a char
// scanner, so text can never look like a call and real code is never
// swallowed by an unterminated quote pair. Template nesting is handled with
// an explicit frame stack (a backtick inside `${...}` opens a nested
// template; its closing backtick returns to the parent's expression).
function stripNoise(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  const isIdChar = (c) => c && /[A-Za-z0-9_$]/.test(c);
  const frames = []; // template frames: { inExpr, braceDepth }
  while (i < n) {
    const ch = src[i];
    const nxt = src[i + 1];
    if (frames.length > 0) {
      const top = frames[frames.length - 1];
      if (ch === '\\') { out += '  '; i += 2; continue; }
      if (top.inExpr) {
        if (ch === '`') { frames.push({ inExpr: false, braceDepth: 0 }); out += ' '; i++; continue; }
        if (ch === '{') { top.braceDepth++; out += ' '; i++; continue; }
        if (ch === '}') {
          top.braceDepth--;
          if (top.braceDepth === 0) top.inExpr = false;
          out += ' '; i++; continue;
        }
        out += ' '; i++; continue;
      }
      if (ch === '`') { frames.pop(); out += ' '; i++; continue; }
      if (ch === '$' && nxt === '{') { top.inExpr = true; top.braceDepth = 1; out += '  '; i += 2; continue; }
      out += ' '; i++; continue;
    }
    if (ch === '/' && nxt === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    if (ch === '/' && nxt === '/') {
      const end = src.indexOf('\n', i + 2);
      const stop = end === -1 ? n : end;
      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === ch) { j++; break; }
        j++;
      }
      out += ' '.repeat(j - i);
      i = j;
      continue;
    }
    if (ch === '`') { frames.push({ inExpr: false, braceDepth: 0 }); out += ' '; i++; continue; }
    if (ch === '/' && nxt !== '/' && nxt !== '*' && !isIdChar(src[i - 1]) && src[i - 1] !== ')' && src[i - 1] !== ']' && src[i - 1] !== '}') {
      // Possible regex literal (not preceded by an expression continuation,
      // which would make / a division operator) — only consume if it terminates.
      let j = i + 1;
      let inClass = false;
      let terminated = false;
      while (j < n) {
        const c = src[j];
        if (c === '\n') break;
        if (c === '\\') { j += 2; continue; }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) { j++; terminated = true; break; }
        j++;
      }
      if (terminated) {
        out += ' '.repeat(j - i);
        i = j;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

function auditFile(file, src) {
  const clean = stripNoise(src);
  const declared = new Set();
  const imported = new Set();

  for (const m of clean.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
  for (const m of clean.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) declared.add(m[1]);
  for (const m of clean.matchAll(/\b(?:const|let|var)\s+\{\s*([^}]+)\}\s*=/g)) {
    for (const name of m[1].split(',')) {
      const d = name.trim().split(':')[0].trim().split('=')[0].trim();
      if (d) declared.add(d);
    }
  }
  // Params: named functions, anonymous functions, arrows (1+ names)
  for (const m of clean.matchAll(/\bfunction\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g)) {
    for (const p of m[1].split(',')) { const d = p.trim().split('=')[0].trim().split(':')[0].trim(); if (d) declared.add(d); }
  }
  for (const m of clean.matchAll(/\bfunction\s*\(([^)]*)\)/g)) {
    for (const p of m[1].split(',')) { const d = p.trim().split('=')[0].trim(); if (d) declared.add(d); }
  }
  // Object-literal methods (name(params) { / async name(params) {): the name
  // is a declaration and the params are in scope for its body.
  for (const m of clean.matchAll(/\b(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(\s*([^)]*)\)\s*\{/g)) {
    declared.add(m[1]);
    for (const p of m[2].split(',')) { const d = p.trim().split('=')[0].trim().split(':')[0].trim(); if (d) declared.add(d); }
  }
  for (const m of clean.matchAll(/\(\s*([^()]*?)\s*\)\s*=>/g)) {
    for (const p of m[1].split(',')) { const d = p.trim().split('=')[0].trim(); if (d) declared.add(d); }
  }
  for (const m of clean.matchAll(/\b(?:const|let|var)?\s*([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1]);

  for (const m of clean.matchAll(/window\.FlowMD\.(\w+)/g)) imported.add(m[1]);
  for (const m of clean.matchAll(/\{\s*([^}]+?)\s*\}\s*=\s*window\.FlowMD\./g)) {
    for (const name of m[1].split(',')) {
      const d = name.trim().split(':')[0].trim().split('=')[0].trim();
      if (d) imported.add(d);
    }
  }

  const calls = new Map();
  for (const m of clean.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = m[1];
    if (KEYWORDS.has(name)) continue;
    if (declared.has(name) || imported.has(name) || GLOBALS.has(name)) continue;
    calls.set(name, (calls.get(name) || 0) + 1);
  }
  return calls;
}

let total = 0;
const findings = [];
for (const root of ROOTS) {
  const abs = join(process.cwd(), root);
  let entries;
  try { entries = readdirSync(abs); } catch { continue; }
  for (const f of entries) {
    const full = join(abs, f);
    if (!statSync(full).isFile() || !f.endsWith('.js')) continue;
    const path = join(root, f);
    const calls = auditFile(path, readFileSync(full, 'utf8'));
    for (const [name, count] of calls) {
      findings.push(`${path}: ${name} (${count}x)`);
      total += count;
    }
  }
}

if (findings.length) {
  console.log(`SCOPE LEAKS (${total} calls):\n` + findings.join('\n'));
  process.exit(1);
} else {
  console.log('scope-leaks: CLEAN (all bare calls covered by imports/declarations/globals)');
  process.exit(0);
}
