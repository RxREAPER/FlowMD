/* ============================================================
   FlowMD Features — Export / Import Backup

   STABLE FORMAT CONTRACT (do not break):
   A backup file is a JSON envelope:
     {
       "app": "FlowMD",
       "formatVersion": 1,
       "exportedAt": "<ISO timestamp>",
       "appVersion": "<APP_VERSION at export time>",
       "data": { "<flowmd_* localStorage key>": "<value>", ... }
     }

   Guarantees:
   - `app` must equal "FlowMD" (rejects foreign files).
   - `formatVersion` must be a positive integer <= MAX_SUPPORTED_FORMAT_VERSION.
     Future app versions bump formatVersion only if the ENVELOPE changes;
     the payload keys themselves are migrated on import via loadState() →
     migrateStateSchema(), so an export made today stays importable forever.
   - Only keys matching the known `flowmd_*` prefix are restored; unknown or
     foreign keys are rejected, never written.
   - A size cap protects against pathological payloads.
   - Before overwriting current state, the current state is exported as an
     automatic safety backup file (flowmd-backup-auto-*.json).

   Import flow: validate envelope → auto-backup current → write keys →
   call loadState() so schema migrations upgrade old exports into the
   current schema (same path as v2→v3→v4 storage migrations).
   ============================================================ */
(function () {
  'use strict';

  const { loadState } = window.FlowMD.store;
  const { APP_VERSION } = window.FlowMD.constants;

  const APP_NAME = 'FlowMD';
  const FORMAT_VERSION = 1;
  const MAX_SUPPORTED_FORMAT_VERSION = 1;
  const MAX_BACKUP_BYTES = 5 * 1024 * 1024; // 5 MB safety cap
  const KEY_PATTERN = /^flowmd_/;

  // Known-but-excluded: transient/internal keys that should never be part of
  // a backup (the schema-migration bookkeeping keys are derived, not data).
  const EXCLUDED_KEYS = new Set([
    'flowmd_onboarding_pending',
    'flowmd_sync_diagnostics'
  ]);

  // Collect every data key currently in localStorage.
  function collectDataKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && KEY_PATTERN.test(key) && !EXCLUDED_KEYS.has(key)) keys.push(key);
    }
    return keys.sort();
  }

  // Serialize the envelope to JSON.
  function serialize(data) {
    return JSON.stringify({
      app: APP_NAME,
      formatVersion: FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION || 'unknown',
      data
    }, null, 2);
  }

  // Trigger a browser download of the given filename/content.
  function download(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function dateStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // Validate a parsed envelope; returns { ok: true } or { ok: false, error }.
  function validateEnvelope(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, error: 'Not a valid backup file.' };
    }
    if (obj.app !== APP_NAME) {
      return { ok: false, error: 'This file is not a FlowMD backup.' };
    }
    const fv = obj.formatVersion;
    if (typeof fv !== 'number' || !Number.isInteger(fv) || fv < 1) {
      return { ok: false, error: 'Backup has an invalid format version.' };
    }
    if (fv > MAX_SUPPORTED_FORMAT_VERSION) {
      return { ok: false, error: 'This backup was made by a newer app version. Update FlowMD and try again.' };
    }
    if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
      return { ok: false, error: 'Backup contains no data.' };
    }
    const rawSize = new Blob([JSON.stringify(obj.data)]).size;
    if (rawSize > MAX_BACKUP_BYTES) {
      return { ok: false, error: 'Backup file is too large to restore.' };
    }
    // Reject foreign keys up front (defense in depth — nothing unknown is
    // ever written to localStorage).
    const foreign = Object.keys(obj.data).filter((k) => !KEY_PATTERN.test(k));
    if (foreign.length) {
      return { ok: false, error: 'Backup contains unrecognized data and was rejected.' };
    }
    return { ok: true };
  }

  // Export current state to a downloadable file. Returns true on success.
  async function exportBackup() {
    try {
      const data = {};
      collectDataKeys().forEach((k) => {
        try { data[k] = localStorage.getItem(k); } catch (e) { /* skip unreadable */ }
      });
      download('flowmd-backup-' + dateStamp() + '.json', serialize(data));
      return true;
    } catch (e) {
      console.error('[FlowMD] Backup export failed:', e);
      return false;
    }
  }

  // Auto-backup current state before an import overwrites it.
  async function autoBackupBeforeImport() {
    try {
      const data = {};
      collectDataKeys().forEach((k) => {
        try { data[k] = localStorage.getItem(k); } catch (e) { /* skip */ }
      });
      if (Object.keys(data).length === 0) return;
      download('flowmd-backup-auto-before-import-' + dateStamp() + '.json', serialize(data));
    } catch (e) { /* best effort */ }
  }

  // Import a backup file (a File object from an <input type="file">).
  // Returns { ok: true, message } or { ok: false, error }.
  async function importBackup(file) {
    try {
      const text = await file.text();
      let obj;
      try {
        obj = JSON.parse(text);
      } catch (e) {
        return { ok: false, error: 'This file is not valid JSON.' };
      }
      const v = validateEnvelope(obj);
      if (!v.ok) return v;

      // Safety net: keep the current state before overwriting.
      await autoBackupBeforeImport();

      // Write only the validated flowmd_* keys, exactly as stored.
      Object.keys(obj.data).forEach((k) => {
        try { localStorage.setItem(k, String(obj.data[k])); } catch (e) { /* quota */ }
      });

      // Re-read through the schema-migration path so old-format exports
      // upgrade into the current schema automatically.
      loadState();

      const restoredCount = Object.keys(obj.data).length;
      return {
        ok: true,
        message: 'Backup restored — ' + restoredCount + ' items imported.'
      };
    } catch (e) {
      console.error('[FlowMD] Backup import failed:', e);
      return { ok: false, error: 'Import failed. The file may be corrupt.' };
    }
  }

  // Expose
  window.FlowMD.backup = {
    exportBackup,
    importBackup,
    FORMAT_VERSION,
    MAX_SUPPORTED_FORMAT_VERSION,
    KEY_PATTERN
  };
})();
