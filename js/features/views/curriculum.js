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
      <div class="fm-breadcrumb">
        <span class="fm-breadcrumb-item nav-bc-home">Home</span>
        <span class="fm-breadcrumb-separator">&gt;</span>
        <span class="fm-breadcrumb-item active">Curriculum</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Curriculum & Subjects</h2>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${renderEditionChip()}
          <span class="v2-hud-badge">${filteredSubjects.length} SUBJECTS</span>
        </div>
      </div>

      <div class="curriculum-legend">
        <div class="curriculum-legend-head">
          <svg class="material-symbols-outlined"><use href="#fmd-i-info"/></svg>
          <span>How completion is counted</span>
        </div>
        <div class="curriculum-legend-row">
          <span class="curriculum-legend-icon curriculum-legend-icon-count"><svg class="material-symbols-outlined"><use href="#fmd-i-check_box"/></svg></span>
          <div class="curriculum-legend-text">
            <div class="curriculum-legend-title">Individual video tick</div>
            <div class="curriculum-legend-sub">Reflected in Analytics — 7-day chart, weekly pace &amp; daily counts.</div>
          </div>
          <span class="v2-hud-badge curriculum-legend-badge curriculum-legend-badge-count">Counts</span>
        </div>
        <div class="curriculum-legend-row">
          <span class="curriculum-legend-icon curriculum-legend-icon-skip"><svg class="material-symbols-outlined"><use href="#fmd-i-select_all"/></svg></span>
          <div class="curriculum-legend-text">
            <div class="curriculum-legend-title">Chapter &ldquo;Select All&rdquo;</div>
            <div class="curriculum-legend-sub">Marks the whole chapter complete but stays out of Analytics — tick previously finished chapters without skewing your stats.</div>
          </div>
          <span class="v2-hud-badge curriculum-legend-badge curriculum-legend-badge-skip">Excluded</span>
        </div>
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
              <svg class="material-symbols-outlined" style="color: var(--text-muted);"><use href="#fmd-i-chevron_right"/></svg>
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
