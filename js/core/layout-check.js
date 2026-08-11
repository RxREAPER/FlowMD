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
