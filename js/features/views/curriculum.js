/* ============================================================
   FlowMD Features — Curriculum View
   Renders the subject list with per-subject progress. Signature
   adapted to receive the shell DOM cache (renderCurriculumView(dom, stats)).
   Extracted verbatim from app.js (2026-08-10).
   ============================================================ */
(function () {
  'use strict';

  const { getState } = window.FlowMD.store;
  const { renderEditionChip } = window.FlowMD.theme;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  function renderCurriculumView(dom, stats) {
    DOM = dom;
    let filteredSubjects = stats.subjectsStats;

    DOM.appMain.innerHTML = `
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Curriculum</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Curriculum & Subjects</h2>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${renderEditionChip()}
          <span class="v2-hud-badge">${filteredSubjects.length} SUBJECTS</span>
        </div>
      </div>

      <div class="curriculum-notice" style="margin: 8px 0 16px 0; padding: 10px 12px; background: var(--bg-surface-raised); border: 1px solid var(--border-color); border-radius: 8px; font-family: var(--font-hud); font-size: 0.75rem; color: var(--text-secondary); display: flex; align-items: flex-start; gap: 8px;">
        <span class="material-symbols-outlined" style="font-size: 18px; color: var(--accent-primary); flex-shrink: 0; margin-top: 1px;">info</span>
        <span>Note: Individual video checkboxes → reflected in Analytics (7-day chart, weekly pace, daily counts). Chapter "Select All" checkbox → marks videos complete but excluded from Analytics, so you can mark previously completed chapters as a whole without distorting your analytics.</span>
      </div>

      ${filteredSubjects.map(sub => `
        <div class="v2-pixel-card" style="margin-bottom: 10px; padding: 12px 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" class="curriculum-sub-row" data-subject-id="${sub.id}">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
              <span class="subject-icon-medium" style="display:inline-flex;align-items:center;justify-content:center;color:${sub.accentColor};">${sub.svgIcon}</span>
              <div style="min-width: 0;">
                <div style="font-family: var(--font-display); font-weight: 700; font-size: 1rem;">${sub.name}</div>
                <div style="font-family: var(--font-hud); font-size: 0.92rem; color: var(--text-muted); margin-top: 2px;">${sub.raw.chapters ? sub.raw.chapters.length : 0} CHAPTERS • ${sub.totalVideos} VIDEOS</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="v2-hud-badge" style="${sub.percentage === 100 ? 'color: var(--success); border-color: var(--success);' : ''}">${sub.percentage}%</span>
              <span class="material-symbols-outlined" style="color: var(--text-muted);">chevron_right</span>
            </div>
          </div>
        </div>
      `).join('')}
    `;

    document.querySelectorAll('.curriculum-sub-row').forEach(row => {
      row.addEventListener('click', () => {
        state.activeSubjectId = row.getAttribute('data-subject-id');
        if (window.FlowMD.shell) window.FlowMD.shell.switchView('subject_detail');
      });
    });
  }

// --- View 3: Subject Detail View — Chapter Accordions ---

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderCurriculumView
  });
})();
