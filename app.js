/* ============================================================
   FLOWMD V2 — 16-BIT RETRO RPG PRESENTATION LAYER
   Cohesive Pixel-Art Design System, Arcade Controls, & HUD Meters
   Complete Redesign of Presentation Layer while preserving 100% logic parity
   ============================================================ */

(function () {
  'use strict';

  // --- Imported leaf modules (js/core/*, js/features/*) ---
  const {
    PXL_ICONS,
    escapeHtml,
    escapeAttr,
    toLocalDateKey,
    todayKey,
    SCHEMA_VERSION,
    STORAGE_KEYS,
    STUDY_SOURCES,
    DEFAULT_PLAN,
    PLAN_A_ACCENT,
    PLAN_B_ACCENT,
    DEFAULT_PERSONAL,
    DEFAULT_GOALS,
    SUBJECT_ICONS,
    SUBJECT_SVG_ICONS,
    SUBJECT_COLORS,
    SUBJECT_FACULTY
  } = window.FlowMD.constants;

  const {
    getSubjectIconSrc,
    getSubjectSvgIcon,
    getSubjectAccentColor,
    getSubjectFaculty,
    getSubjectColor,
    getSubjectName
  } = window.FlowMD.subjects;

  const { getFlowMDLogoSVG } = window.FlowMD.logo;

  const { showToast, dismissToast } = window.FlowMD.toast;

  const {
    getState,
    loadState,
    saveState,
    markStudyActivity,
    getStudyStreak,
    mergePlansLocalWins
  } = window.FlowMD.store;

  const {
    SOURCE_DATA,
    initSourceData,
    getDataset,
    getSubjectChapters,
    getScopedChapterNames,
    getPlanScopeVideos,
    getBulkChapterKey,
    isChapterBulkCompleted,
    getChapterVideoIds,
    getDailyCountsExcludingBulk,
    getSourceLabel,
    getEditionShort
  } = window.FlowMD.sourceData;

  const {
    getSyllabusStats,
    getSyllabusStatsForSource,
    getDeadlineCountdown,
    calculateFinishETA,
    computeMetricsFromVideos,
    getSubjectOrSyllabusMetricsForPlan,
    getMetricsForModalScope,
    getTodayQueueForPlan,
    getAllPlanQueues,
    getTodaysActionQueue,
    getPlanById,
    getSubjectOrSyllabusMetrics
  } = window.FlowMD.metrics;

  const {
    applyTheme,
    updateTopbarInitials,
    updateTopbarSource,
    updateOfflineIndicator,
    renderEditionChip
  } = window.FlowMD.theme;

  const {
    openSpotlightModal,
    closeSpotlightModal,
    renderSpotlightResults
  } = window.FlowMD.search;

  const { initFirebaseSync, manualSync } = window.FlowMD.sync;

  const { renderOnboardingWizard } = window.FlowMD.onboarding;

  const {
    renderStudyPlanConfigCard,
    initStudyPlanConfig,
    focusStudyPlanConfig
  } = window.FlowMD.planConfig;

  const { openSourceSettingsModal } = window.FlowMD.sourceSettings;

  const { renderExecutionChart, renderPixelSubjectHeatmap } = window.FlowMD.charts;

  const { renderDashboardView } = window.FlowMD.views;

  // --- App State ---
  // Shared state object — owned by js/core/state-store.js
  const state = getState();

  const DOM = {};

  // --- Initialization ---
  function init() {
    initSourceData();
    loadState();
    cacheDOM();
    applyTheme(state.theme);
    bindEvents();
    initFirebaseSync();
    initServiceWorker();
    render();
    resetPageScrollTop();

    // Capture PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      state.canInstallPWA = true;
      if (typeof render === 'function' && DOM.appMain) render();
    });
  }

  let deferredInstallPrompt = null;
  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // --- Cache DOM Elements ---
  function cacheDOM() {
    DOM.appMain = document.getElementById('app-main');
    DOM.navItems = document.querySelectorAll('.android-nav-item');
    DOM.btnToggleSearch = document.getElementById('btn-toggle-search');
    DOM.themeToggleBtn = document.getElementById('theme-toggle-btn');
    DOM.topbarUserProfile = document.getElementById('topbar-user-profile');
    DOM.topbarAvatarInitials = document.getElementById('topbar-avatar-initials');
    DOM.bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
    DOM.bottomSheetContent = document.getElementById('bottom-sheet-content');
    DOM.studyPlanConfig = document.getElementById('study-plan-config');
    DOM.brandHomeLink = document.getElementById('brand-home-link');
    DOM.topbarSourceBadge = document.getElementById('topbar-source-badge');
    DOM.topbarSourceBadgeText = document.querySelector('.edition-badge-text');
    DOM.manualSyncBtn = document.getElementById('manual-sync-btn');
  }

  // --- Interactive Info Popover Helper ---
  function openInfoModal(title, bodyHTML) {
    const modal = document.getElementById('info-popover-modal');
    const titleEl = document.getElementById('info-modal-title');
    const bodyEl = document.getElementById('info-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    titleEl.innerHTML = `<span class="material-symbols-outlined">help</span> <span style="font-family: var(--font-display);">${title}</span>`;
    bodyEl.innerHTML = bodyHTML;
    modal.style.display = 'flex';
  }

  function closeInfoModal() {
    const modal = document.getElementById('info-popover-modal');
    if (modal) modal.style.display = 'none';
  }

  // --- Event Listeners ---
  function bindEvents() {
    DOM.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) {
          // Trigger ripple effect
          item.classList.remove('ripple-active');
          void item.offsetWidth; // force reflow
          item.classList.add('ripple-active');
          setTimeout(() => item.classList.remove('ripple-active'), 500);

          switchView(view);
        }
      });
    });

    if (DOM.brandHomeLink) {
      DOM.brandHomeLink.addEventListener('click', () => switchView('dashboard'));
    }

    if (DOM.btnToggleSearch) {
      DOM.btnToggleSearch.addEventListener('click', () => openSpotlightModal());
    }

    document.getElementById('spotlight-close-btn')?.addEventListener('click', closeSpotlightModal);
    document.getElementById('spotlight-search-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('spotlight-search-modal')) closeSpotlightModal();
    });

    document.getElementById('spotlight-search-input')?.addEventListener('input', (e) => {
      renderSpotlightResults(e.target.value);
    });



    // Global Keyboard Shortcut ('/' or Cmd/Ctrl+K to open Spotlight)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSpotlightModal();
        closeInfoModal();
        return;
      }

      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        openSpotlightModal();
      }
    });

    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(state.theme);
        saveState();
      });
    }

    if (DOM.topbarUserProfile) {
      DOM.topbarUserProfile.addEventListener('click', openProfileBottomSheet);
    }

    const topbarSrcBadge = document.getElementById('topbar-source-badge');
    if (topbarSrcBadge) {
      topbarSrcBadge.addEventListener('click', openSourceSettingsModal);
      topbarSrcBadge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSourceSettingsModal();
        }
      });
    }

    if (DOM.manualSyncBtn) {
      DOM.manualSyncBtn.addEventListener('click', manualSync);
    }

    // Delegated click for any in-view edition chip → source settings dialog
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.btn-open-source-settings');
      if (chip) {
        e.preventDefault();
        e.stopPropagation();
        openSourceSettingsModal();
      }
    });

    if (DOM.bottomSheetOverlay) {
      DOM.bottomSheetOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.bottomSheetOverlay) closeBottomSheet();
      });
    }

    // Info Modal Event Handlers
    document.getElementById('info-modal-close')?.addEventListener('click', closeInfoModal);
    document.getElementById('info-modal-ok-btn')?.addEventListener('click', closeInfoModal);
    document.getElementById('info-popover-modal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('info-popover-modal')) closeInfoModal();
    });

    // Global Help Icon (?) Popovers Delegate
    document.addEventListener('click', (e) => {
      const helpBtn = e.target.closest('.help-icon-btn');
      if (helpBtn) {
        e.preventDefault();
        e.stopPropagation();
        const type = helpBtn.getAttribute('data-help-type');

        if (type === 'projected-date') {
          openInfoModal(
            'Projected Completion Date',
            `<p style="margin-bottom: 8px;"><strong>Formula:</strong> <code>(Total Syllabus Videos − Completed Videos) ÷ Daily Video Pace</code></p>
             <div class="pxl-alert pxl-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">check_circle</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Dynamic Real-Time Shifting</div>
                 <div class="pxl-alert-message">This ETA dynamically adjusts as you complete videos or change daily pace target in Profile settings.</div>
               </div>
             </div>`
          );
        } else if (type === 'ideal-actual') {
          openInfoModal(
            'Ideal vs Actual Schedule Delta',
            `<p style="margin-bottom: 8px;"><strong>Schedule Delta:</strong> Compares actual 7-day completed lectures against your target quota (Daily Target × 7).</p>
             <div class="pxl-alert pxl-alert-warning" style="margin: 10px 0 0 0; padding: 12px;">
               <span class="material-symbols-outlined pxl-alert-icon">warning</span>
               <div class="pxl-alert-content">
                 <div class="pxl-alert-title">Automatic Schedule Recovery</div>
                 <div class="pxl-alert-message">When behind pace, FlowMD calculates exact extra daily videos needed to recover without burn-out.</div>
               </div>
             </div>`
          );
        } else if (type === 'action-queue') {
          openInfoModal(
"Today's Action Queue",
            `<p style="margin-bottom: 8px;"><strong>Daily Video:</strong> Shows your next video to watch.</p>
              <div class="pxl-alert pxl-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
                <span class="material-symbols-outlined pxl-alert-icon">rocket_launch</span>
                <div class="pxl-alert-content">
                  <div class="pxl-alert-title">Load Next Video</div>
                  <div class="pxl-alert-message">Completing a video unlocks <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">rocket_launch</span> Load Next Video to continue your progress.</div>
                </div>
              </div>`
          );
        }
      }

      // Global Breadcrumb Delegate Handlers
      if (e.target.closest('.nav-bc-home')) {
        e.preventDefault();
        switchView('dashboard');
      } else if (e.target.closest('.nav-bc-curriculum')) {
        e.preventDefault();
        switchView('curriculum');
      }
    });
  }

  function resetPageScrollTop() {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (DOM.appMain) DOM.appMain.scrollTop = 0;
      const mainEl = document.getElementById('app-main');
      if (mainEl) mainEl.scrollTop = 0;
    } catch(e){}
  }

  // --- View Switcher ---
  function switchView(viewName) {
    state.currentView = viewName;
    DOM.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });
    render();
    resetPageScrollTop();
  }

  // --- Main Render Dispatcher ---
  // --- Safe render wrapper: any view crash must not leave the app blank ---
  function safeRender(viewFn, viewName, stats) {
    try {
      viewFn(stats);
    } catch (e) {
      console.error('Render error in ' + viewName + ':', e);
      if (DOM.appMain) {
        DOM.appMain.innerHTML = '<div class="pxl-card" style="padding:24px;text-align:center;">' +
          '<div class="pxl-icon" style="color:#ef4444;margin:0 auto 12px;">' + escapeHtml(PXL_ICONS.exclamation || '') + '</div>' +
          '<h3>Something went wrong</h3>' +
          '<p class="pxl-text-muted" style="margin-top:8px;">' + escapeHtml(e.message || 'Unknown error') + '</p>' +
          '<button class="pxl-btn pxl-btn-primary" style="margin-top:16px;" onclick="location.reload()">Reload App</button>' +
        '</div>';
      }
    }
  }

  function render() {
    if (!DOM.appMain) DOM.appMain = document.getElementById('app-main');
    if (!DOM.appMain) return;

    updateTopbarInitials();
    updateTopbarSource();
    const stats = getSyllabusStats();

    if (state.currentView === 'dashboard') safeRender(() => renderDashboardView(DOM, stats), 'dashboard', stats);
    else if (state.currentView === 'curriculum') safeRender(renderCurriculumView, 'curriculum', stats);
    else if (state.currentView === 'subject_detail') safeRender(renderSubjectDetailView, 'subject_detail', stats);
    else if (state.currentView === 'analytics') safeRender(renderAnalyticsView, 'analytics', stats);
    else safeRender(renderProfileView, 'profile', stats);
  }

  function renderCurriculumView(stats) {
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
        switchView('subject_detail');
      });
    });
  }

// --- View 3: Subject Detail View — Chapter Accordions ---
  function renderSubjectDetailView(stats) {
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
        <div class="pxl-breadcrumb">
          <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
          <span class="pxl-breadcrumb-separator">&gt;</span>
          <span class="pxl-breadcrumb-item nav-bc-curriculum" data-view="curriculum">Curriculum</span>
          <span class="pxl-breadcrumb-separator">&gt;</span>
          <span class="pxl-breadcrumb-item active">${subObj.name}</span>
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
    `;

    document.getElementById('btn-back-to-curriculum')?.addEventListener('click', () => switchView('curriculum'));

    document.querySelector('.nav-bc-curriculum')?.addEventListener('click', () => switchView('curriculum'));

    document.getElementById('btn-toggle-all-chapters')?.addEventListener('click', () => {
      const isAnyExpanded = Object.values(state.expandedChapters).some(v => v === true);
      const newExpandedState = !isAnyExpanded;
      if (subObj.raw.chapters) {
        subObj.raw.chapters.forEach(chap => {
          state.expandedChapters[chap.name] = newExpandedState;
        });
      }
      renderSubjectDetailView(stats);
    });

    document.querySelectorAll('.accordion-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        // Don't toggle accordion if clicking on the bulk chapter checkbox
        if (e.target.closest('.bulk-chapter-checkbox-label')) return;
        const chapName = hdr.getAttribute('data-chap-name');
        state.expandedChapters[chapName] = !state.expandedChapters[chapName];
        renderSubjectDetailView(stats);
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
        renderSubjectDetailView(getSyllabusStats());
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
        renderSubjectDetailView(getSyllabusStats());
      });
    });
  }

﻿// --- 7-Day Execution Chart ---
  function renderAnalyticsView(stats) {
    const plans = (state.plans && state.plans.length > 0) ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    const allQueues = getAllPlanQueues();
    const hasDualPlans = plans.length >= 2;

    const now = new Date();
    const todayStr = todayKey();
    const daysLeft = Math.max(1, Math.ceil((new Date(state.goals.targetDate || '2026-08-15') - now) / 86400000));

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = toLocalDateKey(d);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      last7Days.push({ dateKey, label });
    }

    // Get daily counts excluding bulk completed chapters
    const dailyCounts = getDailyCountsExcludingBulk();

    const todayDone = dailyCounts[todayStr] || 0;
    let actual7DaysCount = last7Days.reduce((sum, d) => sum + (dailyCounts[d.dateKey] || 0), 0);
    let actual30DaysCount = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      actual30DaysCount += dailyCounts[toLocalDateKey(d)] || 0;
    }

    // Aggregate total daily target across all plans
    let totalVidsDay = 0;
    plans.forEach(p => { totalVidsDay += Math.max(1, parseInt(p.videosPerDay) || 8); });

    const ideal7DaysTarget = totalVidsDay * 7;
    const ideal30DaysTarget = totalVidsDay * 30;
    const paceDelta = actual7DaysCount - ideal7DaysTarget;
    const lectureDeficit = Math.abs(paceDelta);

    const weeklyPct = Math.min(100, Math.round((actual7DaysCount / Math.max(1, ideal7DaysTarget)) * 100));
    const monthlyPct = Math.min(100, Math.round((actual30DaysCount / Math.max(1, ideal30DaysTarget)) * 100));
    const maxChartVal = Math.max(totalVidsDay, ...last7Days.map(d => dailyCounts[d.dateKey] || 0), 1);

    // Per-plan stats
    const planStats = plans.map((plan, idx) => {
      const q = allQueues[idx];
      const m = getSubjectOrSyllabusMetricsForPlan(plan);
      const scopedUnits = getScopedChapterNames(plan);
      const vids = Math.max(1, parseInt(plan.videosPerDay) || 8);
      const remVids = Math.max(0, m.remainingVideos);
      const daysNeeded = Math.ceil(remVids / vids);
      const finishDate = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
      const finishDateStr = finishDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const targetDate = new Date(plan.targetDate || '2026-08-15');
      const daysLeft = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));
      const ideal7 = vids * 7;
      const ideal30 = vids * 30;
      const planPaceDelta = actual7DaysCount - ideal7; // global actual vs this plan's ideal
      return { plan, q, m, vids, remVids, daysNeeded, finishDate, finishDateStr, targetDate, daysLeft, ideal7, ideal30, planPaceDelta, scopedUnits };
    });

    const goalTile = (o) => `
      <div class="anl-goal-tile" style="--tile:${o.color}">
        <span class="anl-goal-badge-top" style="${o.badgeStyle || ''}">${o.badge}</span>
        <div class="anl-goal-head">
          <div class="anl-goal-tag">
            <span class="anl-goal-ico"><span class="material-symbols-outlined">${o.icon}</span></span>
            <span class="anl-goal-title">${o.title}</span>
          </div>
        </div>
        <div class="anl-goal-value">${o.value}<span class="unit">${o.unit || ''}</span></div>
        <div class="anl-goal-desc">${o.desc}</div>
        <div class="anl-goal-track"><div class="anl-goal-fill" style="width:${o.pct}%; --fill:${o.color};"></div></div>
        <div class="anl-goal-meta">
          <span class="anl-goal-pct">${o.pct}%</span>
          ${o.delta ? `<span class="anl-goal-delta" style="color:${o.deltaColor || 'var(--text-muted)'};">${o.delta}</span>` : ''}
        </div>
      </div>
    `;

    const todayPct = Math.min(100, Math.round((todayDone / totalVidsDay) * 100));
    const todayMet = todayDone >= totalVidsDay;
    const todayTile = goalTile({
      color: '#0ea5e9',
      icon: 'today',
      title: "Today's Daily Goal",
      badge: todayMet ? 'Done' : 'In progress',
      badgeStyle: `color:${todayMet ? 'var(--success)' : 'var(--warning)'}; border-color:${todayMet ? 'var(--success)' : 'var(--warning)'};`,
      value: `${todayDone}`,
      unit: `/ ${totalVidsDay}`,
      desc: `combined videos today${hasDualPlans ? '<br>' + plans.map((p, i) => `${p.label}: ${allQueues[i].queueCompletedInBatch}/${p.videosPerDay}`).join('<br>') : ''}`,
      pct: todayPct,
      delta: todayPct >= 100 ? 'Goal met' : `${totalVidsDay - todayDone} to go`,
      deltaColor: todayMet ? 'var(--success)' : 'var(--warning)'
    });

    const weekTile = goalTile({
      color: '#f59e0b',
      icon: 'date_range',
      title: 'Weekly Goal',
      badge: `${weeklyPct}% complete`,
      value: `${actual7DaysCount}`,
      unit: `/ ${ideal7DaysTarget}`,
      desc: 'videos completed this week',
      pct: weeklyPct,
      delta: `${paceDelta >= 0 ? '+' : '- '}${Math.abs(paceDelta)} vs ${ideal7DaysTarget}`,
      deltaColor: paceDelta >= 0 ? 'var(--success)' : 'var(--danger)'
    });

    const monthTile = goalTile({
      color: '#a855f7',
      icon: 'calendar_month',
      title: 'Monthly Goal',
      badge: `${monthlyPct}% complete`,
      value: `${actual30DaysCount}`,
      unit: `/ ${ideal30DaysTarget}`,
      desc: 'videos completed in 30 days',
      pct: monthlyPct,
      delta: 'rolling 30-day pace'
    });

    const planTiles = planStats.map(ps => {
      const behind = ps.finishDate > ps.targetDate;
      const daysDiff = Math.abs(Math.ceil((ps.finishDate - ps.targetDate) / 86400000));
      const planPct = Math.min(100, Math.round((actual7DaysCount / Math.max(1, ps.ideal7)) * 100));
      const pColor = ps.plan.accentColor || PLAN_A_ACCENT;
      return goalTile({
        color: pColor,
        icon: 'flag',
        title: `${ps.plan.label} ETA`,
        badge: behind ? 'Late' : 'On track',
        badgeStyle: `color:${behind ? 'var(--danger)' : 'var(--success)'}; border-color:${behind ? 'var(--danger)' : 'var(--success)'};`,
        value: `${ps.finishDateStr}`,
        unit: '',
        desc: `${ps.plan.targetSubject}${ps.scopedUnits && ps.scopedUnits.length > 0 ? ' → ' + ps.scopedUnits.length + ' chapters' : ''} @ ${ps.vids}/day`,
        pct: planPct,
        delta: `${daysDiff}d ${behind ? 'behind' : 'ahead'} (${ps.plan.targetDate})`,
        deltaColor: behind ? 'var(--danger)' : 'var(--success)'
      });
    }).join('');

    DOM.appMain.innerHTML = `
      <!-- Breadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Analytics</span>
      </div>

      <!-- Study Intelligence Report Hero -->
      <section class="anl-report-hero">
        <div class="anl-hero-main">
          <div class="anl-hero-icon"><span class="material-symbols-outlined">monitoring</span></div>
          <div>
            <div class="anl-hero-kicker">Study Intelligence Report</div>
            <h2 class="anl-hero-title">Your Study Intelligence</h2>
            <p class="anl-hero-sub">${hasDualPlans ? `Dual-Track: ${plans.map(p => p.targetSubject).join(' + ')}` : 'Live pace, goals & syllabus readiness'}</p>
          </div>
        </div>
        <div class="anl-hero-actions">
          ${renderEditionChip()}
          <span class="v2-hud-badge" style="color:${weeklyPct >= 100 ? 'var(--success)' : 'var(--warning)'}; border-color:${weeklyPct >= 100 ? 'var(--success)' : 'var(--warning)'};"><span class="material-symbols-outlined" style="font-size:14px;">speed</span> ${weeklyPct}% Weekly Pace</span>
          <button class="v2-arcade-btn" id="btn-share-report" style="height:34px; padding:0 14px; font-size:0.82rem; background:var(--accent-gradient);">
            <span class="material-symbols-outlined" style="font-size:16px;">share</span>
            <span>Share Report</span>
          </button>
        </div>
        <div class="anl-hero-chips">
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--accent-primary)"></span> Syllabus <b>${stats.percentage}%</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#10b981"></span> Daily Target <b>${totalVidsDay}</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#f59e0b"></span> 7-Day <b>${actual7DaysCount}/${ideal7DaysTarget}</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#a855f7"></span> Days Left <b>${daysLeft}</b></span>
        </div>
      </section>

      <!-- Preparation Setup & Target Goals -->
      <div class="anl-report-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><span class="material-symbols-outlined mat">tune</span> Preparation Setup</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">${daysLeft} Days Left</span>
        </div>
        <div class="anl-report-focus">
          <div>
            <div class="lbl">Priority Focus</div>
            <div class="val">${state.goals.targetSubject || 'No subject set'}</div>
          </div>
          <div style="text-align:right;">
            <div class="lbl">Daily Pace</div>
            <div class="val"><small>${state.goals.videosPerDay || 8}</small> vids/day</div>
          </div>
        </div>
        <div class="anl-report-facts">
          <div class="anl-report-fact"><div class="lbl">Daily</div><div class="val">${state.goals.videosPerDay || 8} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Weekly</div><div class="val">${state.goals.videosPerWeek || 56} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Monthly</div><div class="val">${state.goals.videosPerMonth || 240} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Target Date</div><div class="val">${state.goals.targetDate || '2026-08-15'}</div></div>
        </div>
        <button class="v2-arcade-btn" id="btn-analytics-open-goals" style="width:100%;"><span class="material-symbols-outlined">track_changes</span> Synchronize Pace &amp; Goals</button>
      </div>

      <!-- Goal Pulse -->
      <div class="anl-goal-section-label"><span class="material-symbols-outlined" style="font-size:18px; color:var(--accent-primary);">target</span> Goal Pulse — Today / Week / Month</div>
      <div class="anl-goal-grid">
        ${todayTile}
        ${weekTile}
        ${monthTile}
        ${planTiles}
      </div>

      <!-- 7-Day Execution Chart -->
      ${renderExecutionChart(last7Days, totalVidsDay, maxChartVal)}

      <!-- Subject Heatmap (moved from dashboard) -->
      <div style="margin-top:20px;">
        ${renderPixelSubjectHeatmap(stats)}
      </div>

    `;

    document.getElementById('btn-share-report')?.addEventListener('click', () => {
      const shareText = `<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">target</span> FlowMD Study Intelligence Report\nDoctor: ${state.personal.doctorName || 'Dr. Aspirant'}\n${hasDualPlans ? `Dual-Track: ${plans.map(p => p.targetSubject).join(' + ')}\n` : ''}Syllabus HP Mastery: ${stats.percentage}%\nCombined Daily Target: ${totalVidsDay} vids/day\n7-Day Actual: ${actual7DaysCount}/${ideal7DaysTarget}\n${planStats.map(ps => `${ps.plan.label} ETA: ${ps.finishDateStr}`).join('\n')}\nBuilt with FlowMD!`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => showToast('Report Copied to Clipboard!', 'auto_awesome'));
      } else {
        showToast('Study Intelligence Report Ready!', 'auto_awesome');
      }
    });

    document.getElementById('btn-analytics-open-goals')?.addEventListener('click', focusStudyPlanConfig);
  }

  // --- View 5: Synchronized Targets & Goals View ---
  function renderGoalsView(stats) {
    const targetSub = state.goals.targetSubject || '';
    const targetDateStr = state.goals.targetDate || '2026-08-15';
    const daysLeft = Math.max(1, Math.ceil((new Date(targetDateStr) - new Date()) / 86400000));

    DOM.appMain.innerHTML = `
      <!-- PxlKit PixelBreadcrumb -->
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Goals & Schedule</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Personal Preparation Goals</h2>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          <button class="v2-arcade-btn" id="btn-edit-goals-page" style="height: 34px; padding: 0 12px; font-size: 0.88rem;">
            <span class="material-symbols-outlined" style="font-size: 16px;">track_changes</span>
            <span>Synchronize Pace</span>
          </button>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 20px; margin-bottom: 16px; background: linear-gradient(135deg, rgba(46, 93, 214, 0.12) 0%, rgba(99, 102, 241, 0.04) 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="v2-hud-badge" style="color: var(--accent-primary); border-color: var(--accent-primary);">MODE: VIDEOS PACE</span>
          <span class="v2-hud-badge">${daysLeft} DAYS LEFT</span>
        </div>

        <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 700; margin-bottom: 4px;">
          Priority Focus: ${targetSub}
        </h2>
        <p style="font-family: var(--font-hud); font-size: 1.1rem; color: var(--accent-primary); font-weight: 700;">
          TARGET PACE: ${state.goals.videosPerDay || 8} VIDS/DAY (${state.goals.videosPerWeek || 56} VIDS/WK)
        </p>

        <div class="v2-hp-bar-bg" style="height: 14px; margin-top: 14px;">
          <div class="v2-hp-bar-fill" style="width: ${stats.percentage}%;"></div>
        </div>
      </div>

      <!-- Synchronized Pace Cards -->
      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 12px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Daily Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
               ${state.goals.videosPerDay || 8} Videos
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per day</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 12px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Weekly Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
               ${state.goals.videosPerWeek || 56} Videos
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per week</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 16px; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Monthly Pace Target</h3>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: var(--font-hud); font-size: 1.5rem; font-weight: 700; color: var(--accent-primary);">
               ${state.goals.videosPerMonth || 240} Videos
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Target per month</div>
          </div>
          <span class="v2-hud-badge" style="color: var(--success); border-color: var(--success);">ACTIVE</span>
        </div>
      </div>
    `;

    document.getElementById('btn-edit-goals-page')?.addEventListener('click', focusStudyPlanConfig);
  }

  // --- View 6: Profile View (simplified) ---
  function renderProfileView(stats) {
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';

    DOM.appMain.innerHTML = `
      <div class="pxl-breadcrumb">
        <span class="pxl-breadcrumb-item nav-bc-home">Home</span>
        <span class="pxl-breadcrumb-separator">&gt;</span>
        <span class="pxl-breadcrumb-item active">Account & Profile</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Account & Profile</h2>
      </div>

      <div class="v2-pixel-card" style="padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div class="pxl-avatar pxl-avatar-lg pxl-avatar-cyan">
            ${escapeHtml((docName.replace(/^Dr\.?\s*/i, '').trim().slice(0, 2) || 'DA').toUpperCase())}
          </div>
          <div>
            <h2 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700;">${escapeHtml(docName)}</h2>
          </div>
        </div>

        <form id="profile-edit-form">
          <div class="form-group">
            <label for="prof-doc-name">Doctor Name</label>
            <input type="text" id="prof-doc-name" value="${escapeAttr(docName)}" class="form-input">
          </div>
          <button type="submit" class="v2-arcade-btn" style="height: 44px; width: 100%;">Save Profile Changes</button>
        </form>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;">settings</span>
          Settings
        </h3>
        <div class="profile-settings-row">
          <div>
            <div class="profile-settings-row-label">Study Source / Syllabus Edition</div>
            <div class="profile-settings-row-value">
              <span class="src-status-dot"></span>
              ${getSourceLabel(state.activeSource || 'marrow_8')}
            </div>
          </div>
          <button class="v2-arcade-btn" id="btn-change-source" style="height: 38px; padding: 0 16px; min-width: 96px;">
            <span class="material-symbols-outlined" style="font-size: 18px;">swap_horiz</span> Change
          </button>
        </div>
        <div class="profile-settings-hint">Switching source changes the syllabus, targets &amp; focus chapters shown in the app.</div>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Google Cloud Sync</h3>
        ${isSynced ? `
          <div style="display: flex; align-items: center; gap: 8px; color: var(--success); font-family: 'Poppins', sans-serif; font-size: 1.05rem; margin-bottom: 12px;">
            <span class="material-symbols-outlined">cloud_done</span>
            Synced as ${syncEmail}
          </div>
          <div class="profile-settings-hint" style="margin-bottom: 12px; font-size: 0.8rem;">
            Your data syncs in real-time across all signed-in devices (~1s). Works offline — auto-syncs when online.
          </div>
          <button class="v2-arcade-btn" id="btn-signout-google" style="width: 100%; background: var(--danger);">Sign Out of Cloud Sync</button>
        ` : `
          <p style="font-family: 'Poppins', sans-serif; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Sign in with Google to backup your progress.</p>
          <div class="profile-settings-hint" style="margin-bottom: 12px; font-size: 0.8rem;">
            Syncs completions, streaks, plans & preferences across devices in real-time (~1s). Works offline.
          </div>
          <button class="v2-arcade-btn" id="btn-signin-google" style="width: 100%;">
            <span class="material-symbols-outlined">cloud_sync</span> Sign In with Google
          </button>
        `}
      </div>

      <div class="v2-pixel-card support-card" style="padding: 18px; margin-bottom: 24px; border-left: 4px solid var(--accent-primary);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="material-symbols-outlined" style="color: var(--accent-primary); font-size: 20px;">support_agent</span>
          <h3 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; margin: 0;">Developer Support & Contact</h3>
        </div>
        <p style="font-family: 'Poppins', sans-serif; font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 14px 0;">
          Need help or have a question? Click below to reveal the developer contact email.
        </p>
        <button class="v2-arcade-btn" id="btn-show-support-email" style="height: 38px; width: 100%;">
          <span class="material-symbols-outlined">mail</span> Show Contact Email
        </button>
        <div id="hidden-support-email" class="support-email-reveal" style="display: none; margin-top: 16px;">
          <div class="support-email-inner">
            <span class="support-email-text">ezioauditore9553@gmail.com</span>
            <button class="v2-arcade-btn" id="btn-copy-support-email" style="height: 32px; padding: 0 12px; font-size: 0.78rem;">
              <span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span> Copy
            </button>
          </div>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Data Management</h3>
        <button class="v2-arcade-btn" id="btn-reset-data" style="width: 100%; background: var(--danger);">
          <span class="material-symbols-outlined">delete_forever</span> Reset All App Data
        </button>
      </div>
    `;

    document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.personal.doctorName = document.getElementById('prof-doc-name').value || 'Dr. Aspirant';
      saveState();
      showToast('Profile updated!', 'check_circle');
      render();
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all app progress and targets? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
      }
    });

    document.getElementById('btn-change-source')?.addEventListener('click', openSourceSettingsModal);

    document.getElementById('btn-signin-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        try {
          await window.FirebaseSync.signInWithGoogle();
        } catch (e) {
          showToast('Sign in failed.', 'error');
        }
      }
    });

    document.getElementById('btn-signout-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        await window.FirebaseSync.signOutUser();
        showToast('Signed out.', 'info');
        renderProfileView(stats);
      }
    });

    document.getElementById('btn-show-support-email')?.addEventListener('click', () => {
      const reveal = document.getElementById('hidden-support-email');
      if (reveal) {
        reveal.style.display = 'block';
      }
    });

    document.getElementById('btn-copy-support-email')?.addEventListener('click', () => {
      navigator.clipboard.writeText('ezioauditore9553@gmail.com').then(() => {
        showToast('Email copied to clipboard!', 'content_copy');
      });
    });
  }

  // --- Profile Bottom Sheet Controller ---
  function openProfileBottomSheet() {
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';
    const initials = (docName.replace(/^Dr\.?\s*/i, '').trim().slice(0, 2) || 'DA').toUpperCase();

    DOM.bottomSheetContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div class="pxl-avatar pxl-avatar-lg pxl-avatar-cyan" style="margin: 0 auto 8px auto;">
          ${escapeHtml(initials)}
        </div>
        <div style="font-family: var(--font-display); font-weight: 700; font-size: 1.15rem;">${escapeHtml(docName)}</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="v2-arcade-btn" id="bs-btn-view-profile" style="width: 100%; justify-content: flex-start;">
          <span class="material-symbols-outlined">person</span> View Full Profile & Settings
        </button>
        <button class="v2-arcade-btn" id="bs-btn-view-goals" style="width: 100%; justify-content: flex-start;">
          <span class="material-symbols-outlined">tune</span> Synchronize Pace & Goals
        </button>
        ${isSynced ? `
          <button class="v2-arcade-btn" id="bs-btn-logout" style="width: 100%; justify-content: flex-start; background: var(--danger);">
            <span class="material-symbols-outlined">logout</span> Sign Out (${escapeHtml(syncEmail)})
          </button>
        ` : `
          <button class="v2-arcade-btn" id="bs-btn-login" style="width: 100%; justify-content: flex-start;">
            <span class="material-symbols-outlined">cloud_sync</span> Sign In with Google
          </button>
        `}
      </div>
    `;

    DOM.bottomSheetOverlay.classList.add('active');

    document.getElementById('bs-btn-view-profile')?.addEventListener('click', () => {
      closeBottomSheet();
      switchView('profile');
    });

    document.getElementById('bs-btn-view-goals')?.addEventListener('click', () => {
      closeBottomSheet();
      focusStudyPlanConfig();
    });

    document.getElementById('bs-btn-login')?.addEventListener('click', async () => {
      closeBottomSheet();
      if (window.FirebaseSync) {
        try {
          await window.FirebaseSync.signInWithGoogle();
        } catch (e) {
          showToast('Sign in failed.', 'error');
        }
      }
    });

    document.getElementById('bs-btn-logout')?.addEventListener('click', async () => {
      closeBottomSheet();
      if (window.FirebaseSync) {
        await window.FirebaseSync.signOutUser();
        showToast('Signed out.', 'info');
        render();
      }
    });
  }

  function closeBottomSheet() {
    if (DOM.bottomSheetOverlay) DOM.bottomSheetOverlay.classList.remove('active');
  }

  // --- Haptics Utility (Vibration Feedback API) ---
  function triggerHaptic(type = 'step') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'step') navigator.vibrate(12);
        else if (type === 'prev') navigator.vibrate(8);
        else if (type === 'finish' || type === 'install') navigator.vibrate([25, 40, 25]);
        else navigator.vibrate(10);
      } catch (e) {}
    }
  }




  // Read the currently selected chapter for a plan tab in the goal modal.
  // Returns [] when "All Chapters" (full subject) is active, or [singleName] when one chapter is focused.

  window.FlowMD.shell = {
    render,
    switchView,
    resetPageScrollTop,
    triggerHaptic,
    openInfoModal,
    closeInfoModal
  };

  // --- Run Initialization ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
