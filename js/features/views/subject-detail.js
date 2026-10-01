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
  const { getChapterVideoIds, isChapterBulkCompleted, getBulkChapterKey, getDailyCountsExcludingBulk, getScopedChapterNames, getVideoCompletedDate, getChapterCompletedDate, getSubjectCompletedDate } = window.FlowMD.sourceData;
  const { getSyllabusStats, getSubjectOrSyllabusMetricsForPlan } = window.FlowMD.metrics;
  const { getSubjectColor, getSubjectName, getSubjectFaculty } = window.FlowMD.subjects;
  const { showToast } = window.FlowMD.toast;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  // --- Lightweight per-subject stats (avoids full getSyllabusStats recompute) ---
  // Recounts only the active subject's completed/total videos + hours.
  function getSubjectQuickStats(subjectId) {
    const dataset = getDataset();
    const sub = dataset && dataset.find(s => s.id === subjectId);
    if (!sub) return null;
    let total = 0, completed = 0, totalMins = 0, completedMins = 0;
    (sub.chapters || []).forEach(chap => {
      (chap.videos || []).forEach(v => {
        total++;
        const mins = (v.durationMins || 0) + (v.durationSecs || 0) / 60;
        totalMins += mins;
        if (state.completedVideos[v.id]) {
          completed++;
          completedMins += mins;
        }
      });
    });
    return {
      completedVideos: completed,
      totalVideos: total,
      completedHours: (completedMins / 60).toFixed(1),
      totalHours: (totalMins / 60).toFixed(1),
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
  // Lazy bridge to getDataset (set by metrics.js on window.FlowMD)
  function getDataset() {
    return window.FlowMD.sourceData && window.FlowMD.sourceData.getDataset
      ? window.FlowMD.sourceData.getDataset()
      : [];
  }

  // --- Targeted DOM updates (no innerHTML rebuild, scroll is never lost) ---

  // Update the 3-stat bar (Completed / Hours / Mastery) in the subject header.
  function updateHeaderStats() {
    const qs = getSubjectQuickStats(state.activeSubjectId);
    if (!qs) return;
    const bar = DOM.appMain.querySelector('.pwa-subject-detail-header');
    if (!bar) return;
    const grid = bar.nextElementSibling; // the stat grid div
    if (!grid || !grid.style.gridTemplateColumns) return; // safety: skip if not the stat grid
    const cells = grid.children;
    if (cells.length < 3) return;
    // Completed cell
    const compNum = cells[0].querySelector('[style*="font-display"]');
    if (compNum) compNum.textContent = qs.completedVideos + '/' + qs.totalVideos;
    // Hours cell
    const hrsNum = cells[1].querySelector('[style*="font-display"]');
    if (hrsNum) hrsNum.textContent = qs.completedHours + '/' + qs.totalHours;
    // Mastery cell
    const pct = qs.percentage;
    const pctColor = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--info)' : pct >= 25 ? 'var(--warning)' : 'var(--danger)';
    const masNum = cells[2].querySelector('[style*="font-display"]');
    if (masNum) { masNum.textContent = pct + '%'; masNum.style.color = pctColor; }
    const masLabel = cells[2].querySelectorAll('div');
    if (masLabel.length >= 3) masLabel[2].textContent = pct >= 75 ? 'Mastered' : pct >= 50 ? 'Advanced' : pct >= 25 ? 'In Progress' : 'Critical';
    // Subject meta line ("X Chapters • Y Videos • Z% done")
    const meta = DOM.appMain.querySelector('.pwa-subject-detail-meta');
    if (meta) {
      const chapCount = (meta.textContent.match(/\d+(?=\s*Chapters)/) || [0])[0];
      meta.textContent = chapCount + ' Chapters \u2022 ' + qs.totalVideos + ' Videos \u2022 ' + qs.percentage + '% done';
    }
  }

  // Toggle the expand/collapse button label after a chapter state change.
  function updateToggleAllBtn() {
    const btn = DOM.appMain.querySelector('#btn-toggle-all-chapters span');
    if (!btn) return;
    const anyExpanded = Object.values(state.expandedChapters).some(v => v === true);
    btn.textContent = anyExpanded ? 'Collapse All' : 'Expand All';
  }

  // Update a unit header's done-count + completion-date line in place
  // (issue #28: units show "n done · Completed <date>" once fully ticked).
  function updateChapterDoneMeta(chapterName) {
    const header = DOM.appMain.querySelector(
      '.accordion-header[data-chap-name="' + chapterName + '"]'
    );
    if (!header) return;
    const subjectId = header.getAttribute('data-subject-id');
    const videos = getChapterVideoIds(subjectId, chapterName);
    const doneCount = videos.filter(id => !!state.completedVideos[id]).length;
    const allDone = videos.length > 0 && doneCount === videos.length;
    const numEl = header.querySelector('.unit-num');
    if (numEl) numEl.classList.toggle('is-done', allDone);
    const doneEl = header.querySelector('.unit-done-meta');
    if (doneEl) {
      const when = allDone ? getChapterCompletedDate(subjectId, chapterName) : '';
      doneEl.textContent = when
        ? doneCount + '/' + videos.length + ' done · Completed ' + when
        : doneCount + '/' + videos.length + ' done';
    }
  }

  // Update a single chapter's rows + unit meta WITHOUT rebuilding the DOM.
  function updateChapterDOM(chapterName, subjectId) {
    const header = DOM.appMain.querySelector(
      '.accordion-header[data-chap-name="' + chapterName + '"]'
    );
    if (!header) return;
    const bulkKey = getBulkChapterKey(subjectId, chapterName);
    const isBulk = isChapterBulkCompleted(subjectId, chapterName);
    // Keep the (visually hidden) bulk checkbox in sync for form semantics.
    const bulkCb = header.querySelector('.bulk-chapter-checkbox');
    if (bulkCb) bulkCb.checked = isBulk;
    // Update the node's done state (rail dot + card ring)
    const node = header.closest('.chapt-node');
    if (node) node.classList.toggle('is-done', isBulk);
    // Update individual video rows in this chapter's accordion body
    const body = header.nextElementSibling;
    if (!body) return;
    (body.querySelectorAll('.react-task-checkbox') || []).forEach(cb => {
      const vidId = cb.getAttribute('data-video-id');
      if (!vidId) return;
      const isChecked = !!state.completedVideos[vidId];
      cb.checked = isChecked;
      const row = cb.closest('.v2-quest-row');
      if (row) row.classList.toggle('completed', isChecked);
    });
  }

  // Update a single video checkbox row + cascade bulk checkbox.
  function updateVideoRow(vidId, isChecked, subjectId, chapterName) {
    const cb = DOM.appMain.querySelector('.react-task-checkbox[data-video-id="' + vidId + '"]');
    if (cb) {
      cb.checked = isChecked;
      const row = cb.closest('.v2-quest-row');
      if (row) {
        row.classList.toggle('completed', isChecked);
        // Keep the completion-date metadata in sync without a rebuild (issues #16/#28).
        let when = row.querySelector('.mv-done');
        if (isChecked) {
          const dateStr = getVideoCompletedDate(vidId);
          if (dateStr) {
            if (!when) {
              when = document.createElement('span');
              when.className = 'mv-done';
              const meta = row.querySelector('.mv-meta');
              if (meta) meta.appendChild(when);
            }
            when.innerHTML = '<svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg> Completed ' + dateStr;
          }
        } else if (when) {
          when.remove();
        }
      }
    }
    if (!chapterName) return; // can't cascade bulk checkbox without knowing the chapter
    // Recalculate whether bulk checkbox should be checked
    const videoIds = getChapterVideoIds(subjectId, chapterName);
    const allDone = videoIds.length > 0 && videoIds.every(id => !!state.completedVideos[id]);
    const bulkKey = getBulkChapterKey(subjectId, chapterName);
    if (allDone && !isChapterBulkCompleted(subjectId, chapterName)) {
      // All individual videos completed — auto-check bulk
      state.bulkCompletedChapters[bulkKey] = true;
    } else if (!allDone && isChapterBulkCompleted(subjectId, chapterName)) {
      // Not all done — un-check bulk
      delete state.bulkCompletedChapters[bulkKey];
    }
    updateChapterDOM(chapterName, subjectId);
    updateChapterDoneMeta(chapterName);
  }

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
        <svg class="material-symbols-outlined faculty-card-verified" aria-label="Verified faculty"><use href="#fmd-i-verified"/></svg>
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
    // Issue #28: subject-level completion date, shown beside the subject
    // once every video is ticked.
    const subjectDoneWhen = getSubjectCompletedDate(subObj.id);

    const activeMode = state.subjectDetailMode || state.curriculumMode || 'videos';
    const qbData = (window.FlowMD.qbankData && window.FlowMD.qbankData.getSubjectQBank)
      ? window.FlowMD.qbankData.getSubjectQBank(subObj.id)
      : null;
    const qbStats = (window.FlowMD.qbankStore && window.FlowMD.qbankStore.getSubjectQBankStats)
      ? window.FlowMD.qbankStore.getSubjectQBankStats(subObj.id)
      : { totalTopics: 0, completedTopics: 0, totalQuestions: 0, attemptedQuestions: 0, percentage: 0 };

    const qbChapters = (qbData && qbData.chapters) ? qbData.chapters : [];
    const sectionHeadingText = `${activeMode === 'videos' ? (subObj.raw.chapters ? subObj.raw.chapters.length : 0) : qbChapters.length} UNITS / CHAPTERS`;

    let chaptersContentHtml = '';

    if (activeMode === 'videos') {
      chaptersContentHtml = (subObj.raw.chapters ? subObj.raw.chapters.map((chap, chapIdx) => {
        const isFocused = !hasFocusScope || focusedChapterSet.has(chap.name);
        const dimStyle = hasFocusScope && !isFocused ? ' opacity: 0.5; filter: grayscale(0.5);' : '';
        const subjectId = subObj.id;
        const chapterName = chap.name;
        const isBulkCompleted = isChapterBulkCompleted(subjectId, chapterName) || (chap.videos && chap.videos.length > 0 && chap.videos.every(v => !state.completedVideos[v.id] ? false : true));
        const bulkKey = getBulkChapterKey(subjectId, chapterName);
        const chapMins = (chap.videos || []).reduce((sum, v) => sum + (v.durationMins || 0) + (v.durationSecs || 0) / 60, 0);
        const chapHours = (chapMins / 60).toFixed(1);
        const chapExpanded = state.expandedChapters[chap.name] === true;
        const chapDone = (chap.videos || []).filter(v => !!state.completedVideos[v.id]).length;
        const chapTotal = (chap.videos || []).length;
        const chapAllDone = chapTotal > 0 && chapDone === chapTotal;
        const chapDoneWhen = chapAllDone ? getChapterCompletedDate(subjectId, chapterName) : '';
        const serialNum = chapIdx + 1;

        return `
          <div class="chapt-node ${chapExpanded ? 'is-open' : ''} ${chapAllDone ? 'is-done' : ''}" style="${dimStyle}">
            <div class="chapt-rail">
              <div class="chapt-node-dot unit-num ${chapAllDone ? 'is-done' : ''}" aria-hidden="true">${serialNum}</div>
              <div class="chapt-rail-line" aria-hidden="true"></div>
            </div>
            <div class="chapt-node-body">
              <div class="accordion-header ${chapExpanded ? 'active' : ''}" data-chap-name="${chap.name}" data-subject-id="${subjectId}" style="border: 2px solid var(--v2-ink, #161310); margin-bottom: 6px; cursor: pointer; user-select: none;">
                <div class="accordion-title-wrap" style="display: flex; align-items: center; gap: 8px;">
                  <label class="bulk-chapter-checkbox-label" aria-hidden="true" tabindex="-1">
                    <input type="checkbox" class="bulk-chapter-checkbox" data-bulk-key="${bulkKey}" ${isBulkCompleted ? 'checked' : ''} tabindex="-1" aria-hidden="true">
                  </label>
                  <div class="unit-title-wrap">
                    <div class="accordion-title" style="font-family: var(--font-display); font-size: 0.95rem;">${chap.name}</div>
                    <div class="unit-done-meta">${chapAllDone && chapDoneWhen ? chapDone + '/' + chapTotal + ' done · Completed ' + chapDoneWhen : chapDone + '/' + chapTotal + ' done'} · ${chapHours}h</div>
                  </div>
                </div>
                <div class="unit-head-actions">
                  <button type="button" class="unit-done-btn ${chapAllDone ? 'is-done' : ''}" data-bulk-key="${bulkKey}" aria-pressed="${chapAllDone}" title="${chapAllDone ? 'Mark unit as not done' : 'Mark every topic in this unit done'}">
                    <svg class="material-symbols-outlined"><use href="#fmd-i-${chapAllDone ? 'check_circle' : 'check_box_outline_blank'}"/></svg>
                    <span>${chapAllDone ? 'Done' : 'Mark done'}</span>
                  </button>
                  <svg class="material-symbols-outlined accordion-icon"><use href="#fmd-i-expand_more"/></svg>
                </div>
              </div>

              <div class="accordion-body ${chapExpanded ? 'active' : ''}">
                <div class="v2-quest-card" style="padding-top: 14px; margin-top: 4px; margin-bottom: 10px;">
                  ${chap.videos ? chap.videos.map(v => {
                    const isDone = !!state.completedVideos[v.id];
                    const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
                    let vNum = v.videoNumber || '#1';
                    vNum = '#' + vNum.replace(/^#+/, '');
                    const doneWhen = isDone ? getVideoCompletedDate(v.id) : '';

                    return `
                      <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                        <label class="v2-pixel-checkbox-label">
                          <input type="checkbox" class="react-task-checkbox" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                          <span class="v2-pixel-checkbox-box"></span>
                          <div>
                            <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                            <div class="mv-meta"><span class="mv-time"><svg class="material-symbols-outlined"><use href="#fmd-i-schedule"/></svg> ${durStr}</span>${doneWhen ? `<span class="mv-done"><svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg> Completed ${doneWhen}</span>` : ''}</div>
                          </div>
                        </label>
                        <span class="mv-tile" aria-hidden="true" style="background:${window.FlowMD.constants.mvTileColor(v.id)};">${(v.videoNumber || '1').replace(/^#+/, '')}</span>
                      </div>
                    `;
                  }).join('') : ''}
                </div>
              </div>
            </div><!-- /chapt-node-body -->
          </div><!-- /chapt-node -->
        `;
      }).join('') : '');
    } else {
      let globalTopicCounter = 0;
      chaptersContentHtml = qbChapters.map((chap, chapIdx) => {
        const serialNum = chapIdx + 1;
        const chapExpanded = state.expandedChapters[chap.name] === true;
        const topics = chap.topics || [];
        const chapStats = window.FlowMD.qbankStore 
          ? window.FlowMD.qbankStore.getChapterQBankStats(subObj.id, chap.name)
          : { completedTopics: 0, totalTopics: topics.length, attemptedQuestions: 0, totalQuestions: 0, percentage: 0, allDone: false };
        const chapAllDone = chapStats.allDone;
        const chapDoneWhen = chapAllDone ? getChapterCompletedDate(subObj.id, chap.name) || 'Today' : '';

        return `
          <div class="chapt-node ${chapExpanded ? 'is-open' : ''} ${chapAllDone ? 'is-done' : ''}">
            <div class="chapt-rail">
              <div class="chapt-node-dot unit-num ${chapAllDone ? 'is-done' : ''}" aria-hidden="true">${serialNum}</div>
              <div class="chapt-rail-line" aria-hidden="true"></div>
            </div>
            <div class="chapt-node-body">
              <div class="accordion-header ${chapExpanded ? 'active' : ''}" data-chap-name="${chap.name}" data-subject-id="${subObj.id}" style="border: 2px solid var(--v2-ink, #161310); margin-bottom: 6px; cursor: pointer; user-select: none;">
                <div class="accordion-title-wrap" style="display: flex; align-items: center; gap: 8px;">
                  <div class="unit-title-wrap">
                    <div class="accordion-title" style="font-family: var(--font-display); font-size: 0.95rem;">${chap.name}</div>
                    <div class="unit-done-meta">${chapAllDone && chapDoneWhen ? chapStats.completedTopics + '/' + chapStats.totalTopics + ' done · Completed ' + chapDoneWhen : chapStats.completedTopics + '/' + chapStats.totalTopics + ' done'} · ${chapStats.totalQuestions} MCQs</div>
                  </div>
                </div>
                <div class="unit-head-actions">
                  <button type="button" class="unit-done-btn qbank-chapter-bulk-btn ${chapAllDone ? 'is-done' : ''}" data-chap-name="${chap.name}" aria-pressed="${chapAllDone}" title="${chapAllDone ? 'Mark chapter uncompleted' : 'Mark all topics in chapter completed'}">
                    <svg class="material-symbols-outlined"><use href="#fmd-i-${chapAllDone ? 'check_circle' : 'check_box_outline_blank'}"/></svg>
                    <span>${chapAllDone ? 'Done' : 'Mark done'}</span>
                  </button>
                  <svg class="material-symbols-outlined accordion-icon"><use href="#fmd-i-expand_more"/></svg>
                </div>
              </div>

              <div class="accordion-body ${chapExpanded ? 'active' : ''}">
                <div class="v2-quest-card" style="padding-top: 14px; margin-top: 4px; margin-bottom: 10px;">
                  ${topics.map(t => {
                    globalTopicCounter++;
                    const prog = window.FlowMD.qbankStore ? window.FlowMD.qbankStore.getTopicProgress(t.id) : { status: 'unattempted' };
                    const isDone = prog.status === 'completed';
                    const qCount = t.mcqCount || (t.questions ? t.questions.length : 15);
                    const doneWhen = isDone ? (prog.completedAt ? new Date(prog.completedAt).toLocaleDateString() : 'Today') : '';
                    let vNum = t.videoNumber || ('#' + String(globalTopicCounter).padStart(2, '0'));
                    vNum = '#' + vNum.replace(/^#+/, '');
                    const tileLabel = (t.videoNumber ? t.videoNumber.replace(/^#+/, '') : String(globalTopicCounter)).padStart(2, '0');

                    return `
                      <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                        <label class="v2-pixel-checkbox-label">
                          <input type="checkbox" class="qbank-topic-checkbox" data-topic-id="${t.id}" data-topic-name="${window.FlowMD.constants.escapeHtml(t.name)}" data-mcq-count="${qCount}" data-chap-name="${chap.name}" ${isDone ? 'checked' : ''}>
                          <span class="v2-pixel-checkbox-box"></span>
                          <div>
                            <div class="v2-quest-title">
                              <span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span>
                              ${t.name}
                            </div>
                            <div class="mv-meta">
                              <span class="mv-time"><svg class="material-symbols-outlined"><use href="#fmd-i-quiz"/></svg> ${qCount} MCQs</span>
                              ${doneWhen ? `<span class="mv-done"><svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg> Completed ${doneWhen}</span>` : ''}
                            </div>
                          </div>
                        </label>
                        <span class="mv-tile qbank-start-mcq-btn" data-topic-id="${t.id}" data-subject-id="${subObj.id}" role="button" tabindex="0" title="Practice ${window.FlowMD.constants.escapeHtml(t.name)} MCQs" aria-label="Practice ${window.FlowMD.constants.escapeHtml(t.name)} MCQs" style="background:${window.FlowMD.constants.mvTileColor(t.id)}; cursor: pointer;">${tileLabel}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div><!-- /chapt-node-body -->
          </div><!-- /chapt-node -->
        `;
      }).join('');
    }

    DOM.appMain.innerHTML = `
      <div class="pwa-curriculum-scroll">
        <!-- Back Button - separate at top -->
        <button class="pwa-back-btn" id="btn-back-to-curriculum" aria-label="Back to curriculum">
          <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_back"/></svg>
        </button>

        <div class="pwa-subject-detail-header">
          <div class="pwa-subject-detail-icon" style="color: ${subObj.accentColor};">${subObj.svgIcon}</div>
          <div class="pwa-subject-detail-info">
            <div class="pwa-subject-detail-name">${subObj.name}</div>
            <div class="pwa-subject-detail-faculty">${renderFacultyCard(subObj.faculty || getSubjectFaculty(subObj.id), subObj.id)}</div>
            <div class="pwa-subject-detail-meta">${activeMode === 'videos' ? `${subObj.raw.chapters ? subObj.raw.chapters.length : 0} Chapters • ${subObj.totalVideos} Videos • ${subObj.percentage}% done` : `${qbChapters.length} Chapters • ${qbStats.completedTopics}/${qbStats.totalTopics} Topics • ${qbStats.percentage}% done`}</div>
            ${subjectDoneWhen ? `<div class="subject-done-banner"><svg class="material-symbols-outlined"><use href="#fmd-i-verified"/></svg> Subject completed ${subjectDoneWhen}</div>` : ''}
          </div>
        </div>

        <!-- Dual Mode Selector Tabs: Videos vs MCQ's / Q-Bank -->
        <div class="curr-view-tabs curr-view-tabs-detail" role="tablist" aria-label="Subject View Mode">
          <button type="button" class="curr-view-tab ${activeMode === 'videos' ? 'is-active' : ''}" id="tab-detail-videos" role="tab" aria-selected="${activeMode === 'videos'}">
            <svg class="material-symbols-outlined curr-tab-icon"><use href="#fmd-i-play_circle"/></svg>
            <span>Videos</span>
          </button>
          <button type="button" class="curr-view-tab ${activeMode === 'mcqs' ? 'is-active' : ''}" id="tab-detail-mcqs" role="tab" aria-selected="${activeMode === 'mcqs'}">
            <svg class="material-symbols-outlined curr-tab-icon"><use href="#fmd-i-quiz"/></svg>
            <span>MCQ's / Q-Bank.</span>
          </button>
        </div>

        <!-- Sub-Subject Analytics -->
        ${activeMode === 'videos' ? `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 16px; padding: 12px; background: var(--bg-surface-raised); border-radius: 12px; border: 1px solid var(--border-color);">
          <div style="text-align:center;">
            <div style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Completed</div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--success);">${subObj.completedVideos}/${subObj.totalVideos}</div>
            <div style="font-family:var(--font-hud);font-size:0.7rem;color:var(--text-muted);">videos</div>
          </div>
          <div style="text-align:center;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color);">
            <div style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Hours</div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--accent-primary);">${subObj.completedHours}/${subObj.totalHours}</div>
            <div style="font-family:var(--font-hud);font-size:0.7rem;color:var(--text-muted);">hours</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Mastery</div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:${subObj.percentage >= 75 ? "var(--success)" : subObj.percentage >= 50 ? "var(--info)" : subObj.percentage >= 25 ? "var(--warning)" : "var(--danger)"};">${subObj.percentage}%</div>
            <div style="font-family:var(--font-hud);font-size:0.7rem;color:var(--text-muted);">${subObj.percentage >= 75 ? "Mastered" : subObj.percentage >= 50 ? "Advanced" : subObj.percentage >= 25 ? "In Progress" : "Critical"}</div>
          </div>
        </div>
        ` : `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 16px; padding: 12px; background: var(--bg-surface-raised); border-radius: 12px; border: 1px solid var(--border-color);">
          <div style="text-align:center;">
            <div style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Completed</div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--success);">${qbStats.completedTopics}/${qbStats.totalTopics}</div>
            <div style="font-family:var(--font-hud);font-size:0.7rem;color:var(--text-muted);">topics</div>
          </div>
          <div style="text-align:center;border-left:1px solid var(--border-color);border-right:1px solid var(--border-color);">
            <div style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">MCQs</div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--accent-primary);">${qbStats.attemptedQuestions}/${qbStats.totalQuestions}</div>
            <div style="font-family:var(--font-hud);font-size:0.7rem;color:var(--text-muted);">mcqs</div>
          </div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Mastery</div>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:${qbStats.percentage >= 75 ? "var(--success)" : qbStats.percentage >= 50 ? "var(--info)" : qbStats.percentage >= 25 ? "var(--warning)" : "var(--danger)"};">${qbStats.percentage}%</div>
            <div style="font-family:var(--font-hud);font-size:0.7rem;color:var(--text-muted);">${qbStats.percentage >= 75 ? "Mastered" : qbStats.percentage >= 50 ? "Advanced" : qbStats.percentage >= 25 ? "In Progress" : "Critical"}</div>
          </div>
        </div>
        <div style="margin: -6px 0 14px; display: flex; justify-content: flex-end;">
          <button type="button" id="btn-open-full-qbank" class="v2-arcade-btn" style="display: flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 0.8rem;">
            <svg class="material-symbols-outlined" style="font-size: 18px;"><use href="#fmd-i-quiz"/></svg>
            <span>Open Q-Bank Timeline Mode</span>
          </button>
        </div>
        `}

        ${hasFocusScope ? `
          <div class="pwa-focus-banner">
            <svg class="material-symbols-outlined"><use href="#fmd-i-filter_alt"/></svg>
            <span>${focusedChapterSet.size} focused chapter${focusedChapterSet.size > 1 ? 's' : ''} — chapters outside focus are dimmed</span>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 2px;">
          <span style="font-family: var(--font-hud); font-size: 1rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
            ${sectionHeadingText}
          </span>
          <button class="v2-arcade-btn" id="btn-toggle-all-chapters" style="height: 30px; padding: 0 10px; font-size: 0.8rem; background: var(--bg-surface-raised); color: var(--text-primary);">
            <svg class="material-symbols-outlined" style="font-size: 16px;"><use href="#fmd-i-unfold_more"/></svg>
            <span>${Object.values(state.expandedChapters).some(v => v === true) ? 'Collapse All' : 'Expand All'}</span>
          </button>
        </div>

        ${chaptersContentHtml}
      </div>
    `;

    document.getElementById('btn-back-to-curriculum')?.addEventListener('click', () => shellSwitchView('curriculum'));

    document.getElementById('btn-toggle-all-chapters')?.addEventListener('click', () => {
      const isAnyExpanded = Object.values(state.expandedChapters).some(v => v === true);
      const newExpandedState = !isAnyExpanded;
      const targetChaps = activeMode === 'videos' ? (subObj.raw.chapters || []) : qbChapters;
      targetChaps.forEach(chap => {
        state.expandedChapters[chap.name] = newExpandedState;
      });
      // Targeted: toggle .active on every accordion header + body in-place.
      DOM.appMain.querySelectorAll('.accordion-header').forEach(h => h.classList.toggle('active', newExpandedState));
      DOM.appMain.querySelectorAll('.accordion-body').forEach(b => b.classList.toggle('active', newExpandedState));
      DOM.appMain.querySelectorAll('.chapt-node').forEach(n => n.classList.toggle('is-open', newExpandedState));
      updateToggleAllBtn();
    });

    document.querySelectorAll('.accordion-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        // Don't toggle accordion if clicking on the bulk chapter checkbox
        if (e.target.closest('.bulk-chapter-checkbox-label')) return;
        const chapName = hdr.getAttribute('data-chap-name');
        state.expandedChapters[chapName] = !state.expandedChapters[chapName];
        // Targeted: toggle .active on just this header + its body.
        const isActive = state.expandedChapters[chapName];
        hdr.classList.toggle('active', isActive);
        const body = hdr.nextElementSibling;
        if (body && body.classList.contains('accordion-body')) body.classList.toggle('active', isActive);
        const node = hdr.closest('.chapt-node');
        if (node) node.classList.toggle('is-open', isActive);
        updateToggleAllBtn();
      });
    });

    // Mode switcher: Videos vs MCQ's / Q-Bank in Subject Detail
    document.getElementById('tab-detail-videos')?.addEventListener('click', () => {
      state.subjectDetailMode = 'videos';
      saveState();
      renderSubjectDetailView(DOM, stats);
    });
    document.getElementById('tab-detail-mcqs')?.addEventListener('click', () => {
      state.subjectDetailMode = 'mcqs';
      saveState();
      renderSubjectDetailView(DOM, stats);
    });
    document.getElementById('btn-open-full-qbank')?.addEventListener('click', () => {
      state.activeQBankSubjectId = subObj.id;
      if (window.FlowMD.shell) {
        window.FlowMD.shell.switchView('qbank');
      }
    });

    // Start Interactive MCQ Practice for Topic
    document.querySelectorAll('.qbank-start-mcq-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const topicId = btn.getAttribute('data-topic-id');
        const subjectId = btn.getAttribute('data-subject-id');
        state.activeQBankSubjectId = subjectId;
        state.activeQBankTopicId = topicId;
        if (window.FlowMD.shell) {
          window.FlowMD.shell.switchView('mcq_practice');
        }
      });
    });

    // Q-Bank individual topic checkboxes
    document.querySelectorAll('.qbank-topic-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const topicId = e.target.getAttribute('data-topic-id');
        const topicName = e.target.getAttribute('data-topic-name') || 'Topic';
        const mcqCount = parseInt(e.target.getAttribute('data-mcq-count') || '15', 10);
        const isChecked = e.target.checked;

        if (window.FlowMD.qbankStore) {
          if (isChecked) {
            window.FlowMD.qbankStore.completeTopicTest(topicId, mcqCount);
            if (typeof markStudyActivity === 'function') markStudyActivity(true);
            showToast(`Completed: ${topicName} (${mcqCount} MCQs)`, 'check_circle');
          } else {
            window.FlowMD.qbankStore.resetTopicTest(topicId);
            if (typeof markStudyActivity === 'function') markStudyActivity(false);
            showToast(`Unmarked: ${topicName}`, 'check_box_outline_blank');
          }
        }
        saveState();
        renderSubjectDetailView(DOM, stats);
      });
    });

    // Q-Bank Chapter Bulk Mark Done
    document.querySelectorAll('.qbank-chapter-bulk-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chapName = btn.getAttribute('data-chap-name');
        const chap = qbChapters.find(c => c.name === chapName);
        if (!chap || !chap.topics || !window.FlowMD.qbankStore) return;

        const allDone = chap.topics.every(t => {
          const p = window.FlowMD.qbankStore.getTopicProgress(t.id);
          return p.status === 'completed';
        });

        if (!allDone) {
          chap.topics.forEach(t => {
            const qCount = t.mcqCount || (t.questions ? t.questions.length : 15);
            window.FlowMD.qbankStore.completeTopicTest(t.id, qCount);
          });
          if (typeof markStudyActivity === 'function') markStudyActivity(true);
          showToast(`Chapter "${chapName}" marked complete!`, 'check_circle');
        } else {
          chap.topics.forEach(t => {
            window.FlowMD.qbankStore.resetTopicTest(t.id);
          });
          if (typeof markStudyActivity === 'function') markStudyActivity(false);
          showToast(`Chapter "${chapName}" unmarked`, 'check_box_outline_blank');
        }

        saveState();
        renderSubjectDetailView(DOM, stats);
      });
    });

    // Bulk (unit) completion for Videos
    document.querySelectorAll('.unit-done-btn:not(.qbank-chapter-bulk-btn)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent accordion toggle
        const bulkKey = btn.getAttribute('data-bulk-key');
        if (!bulkKey) return;
        const [subjectId, chapterName] = bulkKey.split('::');
        const videoIds = getChapterVideoIds(subjectId, chapterName);
        const allDone = videoIds.length > 0 && videoIds.every(id => !!state.completedVideos[id]);
        if (!allDone) {
          videoIds.forEach(vidId => { state.completedVideos[vidId] = true; });
          state.bulkCompletedChapters[bulkKey] = true;
          showToast(`Unit "${chapterName}" marked complete (excluded from analytics)`, 'check_box');
        } else {
          videoIds.forEach(vidId => { delete state.completedVideos[vidId]; });
          delete state.bulkCompletedChapters[bulkKey];
          showToast(`Unit "${chapterName}" unmarked`, 'check_box_outline_blank');
        }
        saveState();
        // Targeted: update chapter rows + unit meta + header stats in-place.
        updateChapterDOM(chapterName, subjectId);
        updateChapterDoneMeta(chapterName);
        updateHeaderStats();
        updateToggleAllBtn();
      });
    });

    document.querySelectorAll('.react-task-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (!vidId) return;
        const isChecked = e.target.checked;
        if (isChecked) {
          state.completedVideos[vidId] = new Date().toISOString();
          markStudyActivity(true);
          showToast('Marked as Completed!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        // Targeted: update this row + cascade bulk checkbox + unit meta + stats.
        updateVideoRow(vidId, isChecked, subObj.id, subObj.raw.chapters ? (
          subObj.raw.chapters.find(ch => (ch.videos || []).some(v => v.id === vidId)) || {}
        ).name : null);
        updateHeaderStats();
      });
    });
  }

// --- 7-Day Execution Chart ---

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderSubjectDetailView
  });
})();
