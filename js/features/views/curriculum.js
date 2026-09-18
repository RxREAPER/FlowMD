/* ============================================================
   FlowMD Features — Curriculum View
   Renders the subject list with per-subject progress. Signature
   adapted to receive the shell DOM cache (renderCurriculumView(dom, stats)).
   Extracted verbatim from app.js (2026-08-10).
   ============================================================ */
(function () {
  'use strict';

  const LEGEND_COLLAPSED_KEY = 'flowmd.curriculumLegendCollapsed';

  function isLegendCollapsed() {
    // Collapsed by default (issue #15); '0' records an explicit expand.
    try { return localStorage.getItem(LEGEND_COLLAPSED_KEY) !== '0'; } catch (e) { return true; }
  }

  const { getState } = window.FlowMD.store;
  const { getSubjectCompletedDate } = window.FlowMD.sourceData;
  const { escapeHtml } = window.FlowMD.constants;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  function renderCurriculumView(dom, stats) {
    DOM = dom;
    const legendCollapsed = isLegendCollapsed();
    // Issue #32: curriculum-page search box (client-side filter, like the
    // dashboard heatmap filters — no new origins, offline by construction).
    let filteredSubjects = stats.subjectsStats;
    const q = (state.curriculumSearchQuery || '').trim().toLowerCase();
    if (q) {
      filteredSubjects = filteredSubjects.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.faculty || '').toLowerCase().includes(q)
      );
    }

    DOM.appMain.innerHTML = `
      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Curriculum &amp; Subjects</h2>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="v2-hud-badge">${filteredSubjects.length} SUBJECTS</span>
        </div>
      </div>

      <!-- Issue #32: curriculum search box -->
      <div class="curr-search-wrap">
        <div class="curr-search-box">
          <svg class="material-symbols-outlined curr-search-icon"><use href="#fmd-i-search"/></svg>
          <input type="text" id="curr-search-input" placeholder="Search subjects or faculty…" value="${escapeHtml(state.curriculumSearchQuery || '')}" autocomplete="off">
          ${q ? `<button type="button" class="curr-search-clear" id="curr-search-clear" aria-label="Clear search">
            <svg class="material-symbols-outlined"><use href="#fmd-i-close"/></svg>
          </button>` : ''}
        </div>
      </div>

      <div class="curriculum-legend ${legendCollapsed ? 'is-collapsed' : ''}" id="curriculum-legend">
        <button type="button" class="curriculum-legend-head" id="curriculum-legend-toggle" aria-expanded="${legendCollapsed ? 'false' : 'true'}" aria-controls="curriculum-legend-body" title="Show / hide how completion is counted">
          <svg class="material-symbols-outlined"><use href="#fmd-i-info"/></svg>
          <span>How completion is counted</span>
          <svg class="material-symbols-outlined curriculum-legend-chevron"><use href="#fmd-i-expand_more"/></svg>
        </button>
        <div class="curriculum-legend-body" id="curriculum-legend-body">
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
      </div>

      <!-- Issue #32: compact 2-col subject cards — hours + module count in
           the meta line, completion date once every video is ticked. -->
      <div class="curr-grid">
        ${filteredSubjects.map(sub => {
          const pct = sub.percentage || 0;
          const chapCount = sub.raw && sub.raw.chapters ? sub.raw.chapters.length : 0;
          const doneWhen = pct === 100 ? getSubjectCompletedDate(sub.id) : '';
          return `
          <div class="curr-card ${pct === 100 ? 'is-complete' : ''}" data-subject-id="${sub.id}" role="button" tabindex="0" aria-label="Open ${sub.name} — ${pct}% complete">
            <div class="curr-card-head" style="--sub-accent: ${sub.accentColor};">
              <span class="curr-card-icon" aria-hidden="true">${sub.svgIcon}</span>
              <span class="curr-card-name">${sub.name}</span>
              <span class="curr-card-pct">${pct}%</span>
            </div>
            <div class="curr-card-meta">${sub.completedVideos}/${sub.totalVideos} · ${chapCount} mod · <b>${sub.totalHours}h</b>${doneWhen ? ` · <b>✓ ${doneWhen}</b>` : ''}</div>
            <div class="curr-card-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
              <div class="curr-card-bar-fill" style="width:${pct}%;"></div>
            </div>
          </div>
        `;}).join('')}
      </div>
      ${filteredSubjects.length === 0 ? `
        <div class="onboarding-empty-cta curr-search-empty">
          <div class="onboarding-title">No subjects match “${escapeHtml(state.curriculumSearchQuery || '')}”</div>
          <div class="onboarding-sub">Try a shorter name, or clear the search.</div>
        </div>
      ` : ''}
    `;

    document.querySelectorAll('.curr-card').forEach(card => {
      const open = () => {
        state.activeSubjectId = card.getAttribute('data-subject-id');
        if (window.FlowMD.shell) window.FlowMD.shell.switchView('subject_detail');
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    // Issue #32: curriculum search — live filter, persisted per session.
    const searchInput = document.getElementById('curr-search-input');
    if (searchInput) {
      let debounce = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          state.curriculumSearchQuery = searchInput.value;
          renderCurriculumView(DOM, stats);
          const again = document.getElementById('curr-search-input');
          if (again) { again.focus(); const L = again.value.length; again.setSelectionRange(L, L); }
        }, 180);
      });
    }
    document.getElementById('curr-search-clear')?.addEventListener('click', () => {
      state.curriculumSearchQuery = '';
      renderCurriculumView(DOM, stats);
      document.getElementById('curr-search-input')?.focus();
    });

    // Collapsible "How completion is counted" legend (collapsed by default,
    // state persisted — issue #15).
    const legendToggle = document.getElementById('curriculum-legend-toggle');
    if (legendToggle) {
      legendToggle.addEventListener('click', () => {
        const box = document.getElementById('curriculum-legend');
        const nowCollapsed = box.classList.toggle('is-collapsed');
        legendToggle.setAttribute('aria-expanded', String(!nowCollapsed));
        try { localStorage.setItem(LEGEND_COLLAPSED_KEY, nowCollapsed ? '1' : '0'); } catch (e) { /* non-fatal */ }
      });
    }
  }

// --- View 3: Subject Detail View — Chapter Accordions ---

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderCurriculumView
  });
})();
