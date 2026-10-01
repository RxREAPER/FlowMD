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
    const curriculumMode = state.curriculumMode || 'videos';

    // Helper to calculate Q-Bank / MCQ stats for a subject
    function getSubjectMcqStats(sub) {
      if (window.FlowMD.qbankStore && window.FlowMD.qbankStore.getSubjectQBankStats) {
        const qb = window.FlowMD.qbankStore.getSubjectQBankStats(sub.id);
        return {
          totalMcqs: qb.totalQuestions,
          completedMcqs: qb.attemptedQuestions,
          completedTopics: qb.completedTopics,
          totalTopics: qb.totalTopics,
          percentage: qb.percentage
        };
      }
      return { totalMcqs: 0, completedMcqs: 0, completedTopics: 0, totalTopics: 0, percentage: 0 };
    }

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

      <!-- Dual Mode Selector Tabs: Videos vs MCQ's / Q-Bank (Annotated Reference Design) -->
      <div class="curr-view-tabs" role="tablist" aria-label="Curriculum View Mode">
        <button type="button" class="curr-view-tab ${curriculumMode === 'videos' ? 'is-active' : ''}" id="tab-curr-videos" role="tab" aria-selected="${curriculumMode === 'videos'}">
          <svg class="material-symbols-outlined curr-tab-icon"><use href="#fmd-i-play_circle"/></svg>
          <span>Videos</span>
        </button>
        <button type="button" class="curr-view-tab ${curriculumMode === 'mcqs' ? 'is-active' : ''}" id="tab-curr-mcqs" role="tab" aria-selected="${curriculumMode === 'mcqs'}">
          <svg class="material-symbols-outlined curr-tab-icon"><use href="#fmd-i-quiz"/></svg>
          <span>MCQ's / Q-Bank.</span>
        </button>
      </div>

      <div class="curriculum-legend ${legendCollapsed ? 'is-collapsed' : ''}" id="curriculum-legend">
        <button type="button" class="curriculum-legend-head" id="curriculum-legend-toggle" aria-expanded="${legendCollapsed ? 'false' : 'true'}" aria-controls="curriculum-legend-body" title="Show / hide how completion is counted">
          <svg class="material-symbols-outlined"><use href="#fmd-i-info"/></svg>
          <span>${curriculumMode === 'videos' ? 'How video completion is counted' : 'How Q-Bank completion is counted'}</span>
          <svg class="material-symbols-outlined curriculum-legend-chevron"><use href="#fmd-i-expand_more"/></svg>
        </button>
        <div class="curriculum-legend-body" id="curriculum-legend-body">
          ${curriculumMode === 'videos' ? `
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
          ` : `
          <div class="curriculum-legend-row">
            <span class="curriculum-legend-icon curriculum-legend-icon-count"><svg class="material-symbols-outlined"><use href="#fmd-i-quiz"/></svg></span>
            <div class="curriculum-legend-text">
              <div class="curriculum-legend-title">Q-Bank Topic Check</div>
              <div class="curriculum-legend-sub">Tick individual topics or entire chapters solved to update your solved MCQ count and streak activity.</div>
            </div>
            <span class="v2-hud-badge curriculum-legend-badge curriculum-legend-badge-count">Counts</span>
          </div>
          `}
        </div>
      </div>

      <!-- Compact 2-col subject cards -->
      <div class="curr-grid">
        ${filteredSubjects.map(sub => {
          const chapCount = sub.raw && sub.raw.chapters ? sub.raw.chapters.length : 0;
          if (curriculumMode === 'mcqs') {
            const mcqStats = getSubjectMcqStats(sub);
            const pct = mcqStats.percentage;
            const isDone = pct === 100;
            return `
              <div class="curr-card ${isDone ? 'is-complete' : ''}" data-subject-id="${sub.id}" role="button" tabindex="0" aria-label="Open ${sub.name} — ${pct}% Q-Bank complete">
                <div class="curr-card-head" style="--sub-accent: ${sub.accentColor};">
                  <span class="curr-card-icon" aria-hidden="true">${sub.svgIcon}</span>
                  <span class="curr-card-name">${sub.name}</span>
                  <span class="curr-card-pct">${pct}%</span>
                </div>
                <div class="curr-card-meta">${mcqStats.completedTopics}/${mcqStats.totalTopics} topics · <b>${mcqStats.completedMcqs}/${mcqStats.totalMcqs} MCQs</b>${isDone ? ' · <b>✓ Done</b>' : ''}</div>
                <div class="curr-card-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                  <div class="curr-card-bar-fill" style="width:${pct}%;"></div>
                </div>
              </div>
            `;
          }

          const pct = sub.percentage || 0;
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
          `;
        }).join('')}
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
        const subId = card.getAttribute('data-subject-id');
        state.activeSubjectId = subId;
        state.activeQBankSubjectId = subId;
        state.subjectDetailMode = state.curriculumMode || 'videos';
        if (window.FlowMD.shell) {
          window.FlowMD.shell.switchView('subject_detail');
        }
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    // Tab mode switcher events: Videos vs MCQ's / Q-Bank
    document.getElementById('tab-curr-videos')?.addEventListener('click', () => {
      state.curriculumMode = 'videos';
      renderCurriculumView(DOM, stats);
    });
    document.getElementById('tab-curr-mcqs')?.addEventListener('click', () => {
      state.curriculumMode = 'mcqs';
      renderCurriculumView(DOM, stats);
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

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderCurriculumView
  });
})();
