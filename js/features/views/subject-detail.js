/* ============================================================
   FlowMD Features — Subject Detail View
   Renders a subject's chapters with accordions, bulk-chapter
   completion, and per-video react task checkboxes.

   Extracted verbatim from app.js (2026-08-10); signature adapted
   to receive the shell DOM cache (renderSubjectDetailView(dom, stats)).
   Includes the renderFacultyCard helper (restored from history —
   it was collateral in an earlier extraction; its siblings
   renderFacultyPill/renderHoursMeter had no callers and were dropped).
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState, markStudyActivity } = window.FlowMD.store;
  const { getChapterVideoIds, isChapterBulkCompleted, getBulkChapterKey, getDailyCountsExcludingBulk, getScopedChapterNames } = window.FlowMD.sourceData;
  const { getSyllabusStats, getSubjectOrSyllabusMetricsForPlan } = window.FlowMD.metrics;
  const { getSubjectColor, getSubjectName, getSubjectFaculty } = window.FlowMD.subjects;
  const { showToast } = window.FlowMD.toast;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  // Lazy shell bridge (app.js loads last; call sites stay valid in any context).
  function shellSwitchView(viewName) {
    if (window.FlowMD.shell) window.FlowMD.shell.switchView(viewName);
  }

function renderFacultyCard(faculty, subjectId) {
    const clean = (faculty || 'Marrow Faculty').replace(/^Dr\.?\s*/i, '').trim();
    const initials = clean.split(/\s+/).filter(Boolean).map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase() || 'MC';
    const subjectColor = getSubjectColor(subjectId);
    const subjectName = getSubjectName(subjectId);
    
    return `
      <div class="faculty-card" style="--faculty-color: ${subjectColor};" data-faculty="${encodeURIComponent(faculty || 'Marrow Faculty')}">
        <div class="faculty-card-avatar" style="background: ${subjectColor};">${initials}</div>
        <div class="faculty-card-info">
          <span class="faculty-card-name">${faculty || 'Marrow Faculty'}</span>
          <span class="faculty-card-subject">${subjectName}</span>
        </div>
        <span class="material-symbols-outlined faculty-card-verified" aria-label="Verified faculty">verified</span>
        <div class="faculty-card-border"></div>
      </div>`;
  }

  function renderSubjectDetailView(dom, stats) {
    DOM = dom;
    const subObj = stats.subjectsStats.find(s => s.id === state.activeSubjectId) || stats.subjectsStats[0];
    if (!subObj) {
      DOM.appMain.innerHTML = `<p>Subject not found.</p>`;
      return;
    }

    const focusedChapterSet = new Set();
    (state.plans || []).forEach(p => {
      if (p && p.targetSubject === subObj.name) {
        getScopedChapterNames(p).forEach(n => focusedChapterSet.add(n));
      }
    });
    const hasFocusScope = focusedChapterSet.size > 0;

    DOM.appMain.innerHTML = `
      <div class="pwa-curriculum-scroll">
        <div class="fm-breadcrumb">
          <span class="fm-breadcrumb-item nav-bc-home">Home</span>
          <span class="fm-breadcrumb-separator">&gt;</span>
          <span class="fm-breadcrumb-item nav-bc-curriculum" data-view="curriculum">Curriculum</span>
          <span class="fm-breadcrumb-separator">&gt;</span>
          <span class="fm-breadcrumb-item active">${subObj.name}</span>
        </div>

        <!-- Back Button - separate at top -->
        <button class="pwa-back-btn" id="btn-back-to-curriculum" aria-label="Back to curriculum">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>

        <div class="pwa-subject-detail-header">
          <div class="pwa-subject-detail-icon" style="color: ${subObj.accentColor};">${subObj.svgIcon}</div>
          <div class="pwa-subject-detail-info">
            <div class="pwa-subject-detail-name">${subObj.name}</div>
            <div class="pwa-subject-detail-faculty">${renderFacultyCard(subObj.faculty || getSubjectFaculty(subObj.id), subObj.id)}</div>
            <div class="pwa-subject-detail-meta">${subObj.raw.chapters ? subObj.raw.chapters.length : 0} Chapters • ${subObj.totalVideos} Videos • ${subObj.percentage}% done</div>
          </div>
        </div>

        ${hasFocusScope ? `
          <div class="pwa-focus-banner">
            <span class="material-symbols-outlined">filter_alt</span>
            <span>${focusedChapterSet.size} focused chapter${focusedChapterSet.size > 1 ? 's' : ''} — chapters outside focus are dimmed</span>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 2px;">
          <span style="font-family: var(--font-hud); font-size: 1rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
            ${subObj.raw.chapters ? subObj.raw.chapters.length : 0} UNITS / CHAPTERS
          </span>
          <button class="v2-arcade-btn" id="btn-toggle-all-chapters" style="height: 30px; padding: 0 10px; font-size: 0.8rem; background: var(--bg-surface-raised); color: var(--text-primary);">
            <span class="material-symbols-outlined" style="font-size: 16px;">unfold_more</span>
            <span>${Object.values(state.expandedChapters).some(v => v === true) ? 'Collapse All' : 'Expand All'}</span>
          </button>
        </div>

        ${subObj.raw.chapters ? subObj.raw.chapters.map(chap => {
          const isFocused = !hasFocusScope || focusedChapterSet.has(chap.name);
          const dimStyle = hasFocusScope && !isFocused ? ' opacity: 0.5; filter: grayscale(0.5);' : '';
          const subjectId = subObj.id;
          const chapterName = chap.name;
          const isBulkCompleted = isChapterBulkCompleted(subjectId, chapterName);
          const bulkKey = getBulkChapterKey(subjectId, chapterName);
          return `
            <div class="accordion-header ${state.expandedChapters[chap.name] === true ? 'active' : ''}" data-chap-name="${chap.name}" style="border: 2px solid var(--v2-ink, #161310); margin-bottom: 6px; cursor: pointer; user-select: none;${dimStyle}">
              <div class="accordion-title-wrap" style="display: flex; align-items: center; gap: 8px;">
                <label class="bulk-chapter-checkbox-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0;">
                  <input type="checkbox" class="bulk-chapter-checkbox" data-bulk-key="${bulkKey}" ${isBulkCompleted ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                  <span class="material-symbols-outlined" style="font-size: 18px; color: ${isBulkCompleted ? 'var(--success)' : 'var(--text-muted)'};">${isBulkCompleted ? 'check_box' : 'check_box_outline_blank'}</span>
                </label>
                <div class="accordion-title" style="font-family: var(--font-display); font-size: 0.95rem;">${chap.name} (${chap.videos ? chap.videos.length : 0} Videos)</div>
              </div>
              <span class="material-symbols-outlined accordion-icon">expand_more</span>
            </div>

            <div class="accordion-body ${state.expandedChapters[chap.name] === true ? 'active' : ''}">
              <div class="v2-quest-card" style="padding-top: 14px; margin-top: 4px; margin-bottom: 10px;">
                ${chap.videos ? chap.videos.map(v => {
                  const isDone = !!state.completedVideos[v.id];
                  const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
                  let vNum = v.videoNumber || '#1';
                  vNum = '#' + vNum.replace(/^#+/, '');

                  return `
                    <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                      <label class="v2-pixel-checkbox-label">
                        <input type="checkbox" class="react-task-checkbox" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                        <span class="v2-pixel-checkbox-box"></span>
                        <div>
                          <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                        </div>
                      </label>
                      <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">${durStr}</div>
                    </div>
                  `;
                }).join('') : ''}
              </div>
            </div>
          `;
        }).join('') : ''}
      </div>
    `;    document.getElementById('btn-back-to-curriculum')?.addEventListener('click', () => shellSwitchView('curriculum'));
    document.querySelector('.nav-bc-curriculum')?.addEventListener('click', () => shellSwitchView('curriculum'));

    document.getElementById('btn-toggle-all-chapters')?.addEventListener('click', () => {
      const isAnyExpanded = Object.values(state.expandedChapters).some(v => v === true);
      const newExpandedState = !isAnyExpanded;
      if (subObj.raw.chapters) {
        subObj.raw.chapters.forEach(chap => {
          state.expandedChapters[chap.name] = newExpandedState;
        });
      }
      renderSubjectDetailView(DOM, stats);
    });

    document.querySelectorAll('.accordion-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        // Don't toggle accordion if clicking on the bulk chapter checkbox
        if (e.target.closest('.bulk-chapter-checkbox-label')) return;
        const chapName = hdr.getAttribute('data-chap-name');
        state.expandedChapters[chapName] = !state.expandedChapters[chapName];
        renderSubjectDetailView(DOM, stats);
      });
    });

    // Bulk Chapter Completion Checkboxes
    document.querySelectorAll('.bulk-chapter-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation(); // Prevent accordion toggle
        const bulkKey = e.target.getAttribute('data-bulk-key');
        const [subjectId, chapterName] = bulkKey.split('::');
        const videoIds = getChapterVideoIds(subjectId, chapterName);

        if (e.target.checked) {
          // Bulk complete: mark all videos in chapter as completed
          videoIds.forEach(vidId => { state.completedVideos[vidId] = true; });
          state.bulkCompletedChapters[bulkKey] = true;
          showToast(`Chapter "${chapterName}" marked complete (excluded from analytics)`, 'check_box');
        } else {
          // Bulk uncomplete: unmark all videos in chapter
          videoIds.forEach(vidId => { delete state.completedVideos[vidId]; });
          delete state.bulkCompletedChapters[bulkKey];
          showToast(`Chapter "${chapterName}" unmarked`, 'check_box_outline_blank');
        }
        saveState();
        renderSubjectDetailView(DOM, getSyllabusStats());
      });
    });

    document.querySelectorAll('.react-task-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          showToast('Marked as Completed!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        renderSubjectDetailView(DOM, getSyllabusStats());
      });
    });
  }

﻿// --- 7-Day Execution Chart ---

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderSubjectDetailView
  });
})();
