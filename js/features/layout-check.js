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
    // Same intentional exceptions as tests/render.mjs: modal/bottom-sheet
    // children overlay content by design, and the analytics hero has a
    // decorative gradient that intentionally bleeds off its edge.
    const inOverlay = (el) => !!el.closest('.modal-overlay, #bottom-sheet-overlay, [style*="z-index: 99999"]');
    document.querySelectorAll('body *').forEach((el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return;
      if (inOverlay(el)) return;
      if (el.matches('.anl-report-hero')) return;
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
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return history.length ? history[history.length - 1] : null;
    } catch { return null; }
  }

  window.FlowMD.layoutCheck = Object.assign(window.FlowMD.layoutCheck, { runLayoutCheck, getLastReport });
})();
