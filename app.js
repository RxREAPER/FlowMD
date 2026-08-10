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
    updateOfflineIndicator
  } = window.FlowMD.theme;

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

  function initFirebaseSync() {
    if (!window.FirebaseSync) return;
    let cloudUnsub = null;

    window.FirebaseSync.onAuthChange(async (user) => {
      // Clean up previous listener
      if (cloudUnsub) {
        cloudUnsub();
        cloudUnsub = null;
      }

      if (user) {
        showToast(`Signed in as ${user.email}`, 'account_circle');
        state.isOffline = false;
        
        const cloudState = await window.FirebaseSync.loadFromCloud(user.uid);
        if (cloudState) {
          // Merge cloud → local with LOCAL winning on conflicts: the device's
          // offline completions must never be clobbered by a stale cloud snapshot.
          // Cloud still fills gaps (keys absent locally). See .planning/codebase/CONCERNS.md #3.
          state.completedVideos = { ...(cloudState.completedVideos || {}), ...state.completedVideos };
          state.goals = { ...(cloudState.goals || {}), ...state.goals };
          state.personal = { ...(cloudState.personal || {}), ...state.personal };
          state.dailyHistory = { ...(cloudState.dailyHistory || {}), ...state.dailyHistory };
          state.dailyHistoryBySubject = { ...(cloudState.dailyHistoryBySubject || {}), ...state.dailyHistoryBySubject };
          state.plans = mergePlansLocalWins(cloudState.plans, state.plans);
          state.activePlanId = cloudState.activePlanId || state.activePlanId;
          state.activeSource = cloudState.activeSource || state.activeSource;
          state.isConfigured = cloudState.isConfigured || state.isConfigured;
          state.themeStyle = cloudState.themeStyle || state.themeStyle;
          state.queueCompletedInBatch = cloudState.queueCompletedInBatch || state.queueCompletedInBatch;
          state.queueBatchVideoIds = cloudState.queueBatchVideoIds ? [...cloudState.queueBatchVideoIds] : state.queueBatchVideoIds;
          if (cloudState.streakData) state.streakData = { ...cloudState.streakData, ...(state.streakData || {}) };
          saveState();
        } else {
          window.FirebaseSync.syncToCloud(user.uid, state, user);
        }
        state.personal.isSynced = true;
        state.personal.syncEmail = user.email;

        // Subscribe to real-time updates
        cloudUnsub = window.FirebaseSync.subscribeToCloud(user.uid, (cloudData) => {
          mergeCloudState(cloudData);
        });
      } else {
        state.personal.isSynced = false;
        state.personal.syncEmail = '';
        state.isOffline = false;
      }
      render();
    });

    // Periodic connectivity check
    window.addEventListener('online', () => {
      state.isOffline = false;
      if (window.FirebaseSync.currentUser) {
        window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state, window.FirebaseSync.currentUser);
      }
      updateOfflineIndicator();
    });
    window.addEventListener('offline', () => {
      state.isOffline = true;
      updateOfflineIndicator();
    });
  }

  // Merge cloud state with local (timestamp-based conflict resolution)
  function mergeCloudState(cloudData) {
    try {
      // If cloud has newer updatedAt, use cloud for non-completion fields
      // For completedVideos, always merge with local winning
      const cloudUpdated = cloudData.updatedAt?.toMillis?.() || 0;
      const localUpdated = state.lastLocalUpdate || 0;

      // Local completions always win (they're the source of truth for offline work)
      state.completedVideos = { ...(cloudData.completedVideos || {}), ...state.completedVideos };

      // For other fields, use timestamp to decide
      if (cloudUpdated > localUpdated) {
        state.goals = { ...(cloudData.goals || {}), ...state.goals };
        state.personal = { ...(cloudData.personal || {}), ...state.personal };
        state.dailyHistory = { ...(cloudData.dailyHistory || {}), ...state.dailyHistory };
        state.dailyHistoryBySubject = { ...(cloudData.dailyHistoryBySubject || {}), ...state.dailyHistoryBySubject };
        state.plans = mergePlansLocalWins(cloudData.plans, state.plans);
        state.activePlanId = cloudData.activePlanId || state.activePlanId;
        state.activeSource = cloudData.activeSource || state.activeSource;
        state.isConfigured = cloudData.isConfigured || state.isConfigured;
        state.themeStyle = cloudData.themeStyle || state.themeStyle;
        state.queueCompletedInBatch = cloudData.queueCompletedInBatch || state.queueCompletedInBatch;
        state.queueBatchVideoIds = cloudData.queueBatchVideoIds ? [...cloudData.queueBatchVideoIds] : state.queueBatchVideoIds;
        if (cloudData.streakData) state.streakData = { ...cloudData.streakData, ...(state.streakData || {}) };
      } else {
        // Local is newer - push to cloud
        if (window.FirebaseSync.currentUser) {
          window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state);
        }
      }
      saveState();
      render();
    } catch (e) {
      console.warn('mergeCloudState error:', e);
    }
  }

  // Manual sync function
  function manualSync() {
    if (!window.FirebaseSync || !window.FirebaseSync.currentUser) {
      showToast('Sign in to sync', 'error');
      return Promise.resolve(false);
    }
    state.lastLocalUpdate = Date.now();
    try {
      showToast('Syncing...', 'sync');
      window.FirebaseSync.syncToCloud(window.FirebaseSync.currentUser.uid, state, window.FirebaseSync.currentUser);
      showToast('Synced successfully', 'check_circle');
      return Promise.resolve(true);
    } catch (e) {
      showToast('Sync failed: ' + e.message, 'error');
      return Promise.resolve(false);
    }
  }

  // --- Deep Global Search Engine ---
  function performDeepSearch(query) {
    const dataset = getDataset();
    if (!query || !dataset || dataset.length === 0) {
      return { subjects: [], chapters: [], videos: [], totalMatches: 0 };
    }

    const q = query.toLowerCase().trim();
    const matchedSubjects = [];
    const matchedChapters = [];
    const matchedVideos = [];

    dataset.forEach(subject => {
      const subName = subject.subject || '';
      const subId = subject.id || subName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const subIcon = getSubjectIconSrc(subId);
      const subSvgIcon = getSubjectSvgIcon(subId);

      if (subName.toLowerCase().includes(q)) {
        matchedSubjects.push({
          id: subId,
          name: subName,
          icon: subIcon,
          svgIcon: subSvgIcon,
          chaptersCount: subject.chapters ? subject.chapters.length : 0,
          videosCount: subject.chapters ? subject.chapters.reduce((acc, c) => acc + (c.videos ? c.videos.length : 0), 0) : 0
        });
      }

      if (subject.chapters) {
        subject.chapters.forEach(chapter => {
          const chapName = chapter.name || '';
          if (chapName.toLowerCase().includes(q)) {
            matchedChapters.push({
              chapterName: chapName,
              subjectName: subName,
              subjectId: subId,
              videoCount: chapter.videos ? chapter.videos.length : 0,
              icon: subIcon
            });
          }

          if (chapter.videos) {
            chapter.videos.forEach(v => {
              const vTitle = v.title || '';
              const vNum = v.videoNumber || '';
              if (vTitle.toLowerCase().includes(q) || vNum.toLowerCase().includes(q)) {
                matchedVideos.push({
                  id: v.id,
                  title: vTitle,
                  videoNumber: vNum,
                  durationMins: v.durationMins || 0,
                  durationSecs: v.durationSecs || 0,
                  subjectName: subName,
                  subjectId: subId,
                  chapterName: chapName,
                  isCompleted: !!state.completedVideos[v.id]
                });
              }
            });
          }
        });
      }
    });

    const totalMatches = matchedSubjects.length + matchedChapters.length + matchedVideos.length;

    return {
      subjects: matchedSubjects.slice(0, 8),
      chapters: matchedChapters.slice(0, 12),
      videos: matchedVideos.slice(0, 30),
      totalMatches
    };
  }

  // --- Spotlight Search Modal Engine ---
  function openSpotlightModal(initialQuery = '') {
    const modal = document.getElementById('spotlight-search-modal');
    const input = document.getElementById('spotlight-search-input');
    if (!modal || !input) return;

    modal.style.display = 'flex';
    input.value = initialQuery || state.searchQuery || '';
    setTimeout(() => input.focus(), 50);
    renderSpotlightResults(input.value);
  }

  function closeSpotlightModal() {
    const modal = document.getElementById('spotlight-search-modal');
    if (modal) modal.style.display = 'none';
  }

  function renderSpotlightResults(query) {
    const container = document.getElementById('spotlight-results-container');
    if (!container) return;

    const q = (query || '').trim().toLowerCase();

    if (!q) {
      // Search Guide — helps users understand the search functionality
      container.innerHTML = `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">search</span> What Can You Search?</div>
        <div style="font-family: 'Poppins', sans-serif; font-size: 0.88rem; color: var(--text-muted); padding: 8px 0 4px 4px; line-height: 1.8;">
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Subjects</strong> — e.g. "anatomy", "pharmacology", "medicine"</div>
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Chapters</strong> — e.g. "cardiovascular", "neurology", "head and neck"</div>
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Video Topics</strong> — e.g. "glaucoma", "MI", "fracture", "biochemistry"</div>
        </div>
      `;

      return;
    }

    // Deep search results only (no command palette shortcuts)
    const searchData = performDeepSearch(q);

    if (searchData.totalMatches === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 0; font-family: 'Poppins', sans-serif; font-size: 1.1rem;">
          No matching subjects, chapters, or video topics found for "${escapeHtml(q)}". Try: <br><span style="color: var(--text-primary);">anatomy, pharmacology, cardiology, biochemistry...</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `

      ${searchData.subjects.length > 0 ? `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">menu_book</span> Subjects (${searchData.subjects.length})</div>
        ${searchData.subjects.map(s => `
          <div class="v2-pixel-card spotlight-item" data-type="subject" data-id="${s.id}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="subject-icon-wrapper">${s.svgIcon}</div>
                <span style="font-weight: 700; font-size: 0.95rem; font-family: var(--font-display);">${s.name}</span>
            </div>
            <span class="v2-hud-badge">${s.videosCount} vids</span>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.chapters.length > 0 ? `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">auto_stories</span> Chapters (${searchData.chapters.length})</div>
        ${searchData.chapters.map(c => `
          <div class="v2-pixel-card spotlight-item" data-type="chapter" data-id="${c.subjectId}" data-chap="${c.chapterName}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 0.92rem; font-family: var(--font-display);">${c.chapterName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${c.subjectName} • ${c.videoCount} videos</div>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.videos.length > 0 ? `
        <div class="pxl-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">play_circle</span> Video Topics (${searchData.videos.length})</div>
        <div class="v2-quest-card" style="padding-top: 14px; margin-top: 6px;">
          ${searchData.videos.map(v => {
            const isDone = v.isCompleted;
            let vNum = v.videoNumber || '#1';
            vNum = '#' + vNum.replace(/^#+/, '');
            return `
              <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                <label class="v2-pixel-checkbox-label">
                  <input type="checkbox" class="spotlight-vid-chk" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                  <span class="v2-pixel-checkbox-box"></span>
                  <div>
                    <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-hud); margin-top: 2px;">
                      <span>${v.subjectName}</span> • <span>${v.chapterName}</span>
                    </div>
                  </div>
                </label>
                <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">${v.durationMins || 0}m ${v.durationSecs || 0}s</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
     `;

    document.querySelectorAll('.spotlight-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        const id = item.getAttribute('data-id');
        state.activeSubjectId = id;
        if (type === 'chapter') {
          const chap = item.getAttribute('data-chap');
          state.expandedChapters[chap] = true;
        }
        closeSpotlightModal();
        switchView('subject_detail');
      });
    });

    document.querySelectorAll('.spotlight-vid-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          showToast('Completed Video!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        renderSpotlightResults(query);
      });
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

    if (state.currentView === 'dashboard') safeRender(renderDashboardView, 'dashboard', stats);
    else if (state.currentView === 'curriculum') safeRender(renderCurriculumView, 'curriculum', stats);
    else if (state.currentView === 'subject_detail') safeRender(renderSubjectDetailView, 'subject_detail', stats);
    else if (state.currentView === 'analytics') safeRender(renderAnalyticsView, 'analytics', stats);
    else safeRender(renderProfileView, 'profile', stats);
  }

  function renderPixelSubjectHeatmap(stats) {
    const subjects = (stats && stats.subjectsStats) || [];
    let countCritical = 0;
    let countPace = 0;
    let countAdvanced = 0;
    let countMastered = 0;

    subjects.forEach(sub => {
      if (sub.percentage >= 75) countMastered++;
      else if (sub.percentage >= 50) countAdvanced++;
      else if (sub.percentage >= 25) countPace++;
      else countCritical++;
    });

    const overallPct = stats ? stats.percentage : 0;

    return `
      <div class="pxl-feature-card pxl-subject-heatmap-card" style="margin-top: 24px; margin-bottom: 24px; padding: 20px;">
        
        <!-- Header Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg class="pxl-icon" viewBox="0 0 16 16" width="20" height="20" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#00f0ff" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="2" width="5" height="5" fill="#00ff88" stroke="#000000" stroke-width="1"/>
              <rect x="2" y="9" width="5" height="5" fill="#ffaa00" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="9" width="5" height="5" fill="#ff5555" stroke="#000000" stroke-width="1"/>
            </svg>
            <h3 class="heatmap-card-title">SUBJECT COMPLETION HEATMAP</h3>
            <span class="help-icon-btn" data-help-type="subject-heatmap" title="Subject Mastery Tier Rules">
              <svg class="pxl-icon" viewBox="0 0 16 16" width="16" height="16" fill="none">
                <circle cx="8" cy="8" r="7" fill="rgba(0, 240, 255, 0.2)" stroke="currentColor" stroke-width="2" />
                <path d="M8 4.5V5.5M8 7.5V11.5" stroke="#ffffff" stroke-width="2" stroke-linecap="square" />
              </svg>
            </span>
          </div>
          
          <!-- Live Mastery Counter Badge -->
          <span class="v2-hud-badge">OVERALL MASTERY: ${overallPct}%</span>
        </div>

        <!-- Telemetry Overview Bar -->
        <div class="pxl-heatmap-telemetry-bar">
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #ff5555;"></span>
            <span class="pxl-stat-lbl">CRITICAL (&lt;25%):</span>
            <span class="pxl-stat-val" style="color: #ff5555;">${countCritical}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #ffaa00;"></span>
            <span class="pxl-stat-lbl">IN PROGRESS (25-50%):</span>
            <span class="pxl-stat-val" style="color: #ffaa00;">${countPace}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #00f0ff;"></span>
            <span class="pxl-stat-lbl">ADVANCED (50-75%):</span>
            <span class="pxl-stat-val" style="color: #00f0ff;">${countAdvanced}</span>
          </div>
          <div class="pxl-heatmap-stat">
            <span class="pxl-stat-dot" style="background: #00ff88;"></span>
            <span class="pxl-stat-lbl">MASTERED (75%+):</span>
            <span class="pxl-stat-val" style="color: #00ff88;">${countMastered}</span>
          </div>
        </div>

        <!-- Interactive Tier Filter Bar -->
        <div class="pxl-heatmap-filter-bar">
          <span class="heatmap-filter-label">FILTER TIERS:</span>
          <div class="heatmap-filter-group">
            <button type="button" class="pxl-heatmap-filter-btn active" data-filter="all">ALL (${subjects.length})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-critical" data-filter="critical">&lt;25% (${countCritical})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-pace" data-filter="pace">25%–50% (${countPace})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-advanced" data-filter="advanced">50%–75% (${countAdvanced})</button>
            <button type="button" class="pxl-heatmap-filter-btn tier-mastered" data-filter="mastered">75%+ (${countMastered})</button>
          </div>
        </div>

        <!-- Heatmap Grid -->
        <div class="pxl-heatmap-grid">
          ${subjects.map(sub => {
            let tierClass = 'critical';
            let tierColor = '#ff5555';
            let tierBg = 'rgba(255, 85, 85, 0.12)';
            
            if (sub.percentage >= 75) {
              tierClass = 'mastered';
              tierColor = '#00ff88';
              tierBg = 'rgba(0, 255, 136, 0.14)';
            } else if (sub.percentage >= 50) {
              tierClass = 'advanced';
              tierColor = '#00f0ff';
              tierBg = 'rgba(0, 240, 255, 0.14)';
            } else if (sub.percentage >= 25) {
              tierClass = 'pace';
              tierColor = '#ffaa00';
              tierBg = 'rgba(255, 170, 0, 0.12)';
            }

            return `
              <div class="pxl-heatmap-tile subject-card" data-subject-id="${sub.id}" data-tier="${tierClass}" title="Click to open ${sub.name}: ${sub.percentage.toFixed(1)}% (${sub.completedVideos}/${sub.totalVideos} videos)" style="--subject-accent: ${sub.accentColor};">
                
                <!-- Subject Icon -->
                <div class="pxl-tile-icon-area" style="color: ${sub.accentColor};">
                  ${sub.svgIcon}
                </div>

                <!-- Subject Name -->
                <div class="pxl-tile-name" title="${sub.name}">${sub.name}</div>

                <!-- Hours -->
                <div class="pxl-tile-hours" style="font-family: var(--font-hud); font-size: 0.68rem; color: var(--text-muted); margin: 2px 0;">${sub.completedHours} / ${sub.totalHours}h</div>

                <!-- Tier Badge -->
                <div class="pxl-tile-bottom">
                  <span class="pxl-tile-tier-tag" style="color: ${tierColor};">${sub.percentage.toFixed(0)}%</span>
                  <span class="pxl-tile-telemetry">${sub.completedVideos}/${sub.totalVideos}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- Multi-Source Onboarding Wizard ---
  let obwStep = 0;
  let obwSource = 'marrow_8';
  let obwTheme = 'dark';
  let obwName = '';
  let obwSeeded = false;

  // --- Cool faculty + lecture-time presentation helpers ---
  function renderFacultyPill(faculty, subjectId) {
    const clean = (faculty || 'Marrow Faculty').replace(/^Dr\.?\s*/i, '').trim();
    const initials = clean.split(/\s+/).filter(Boolean).map(w => w.charAt(0)).slice(0, 2).join('').toUpperCase() || 'MC';
    const subjectColor = getSubjectColor(subjectId);
    const subjectColorLight = subjectColor + '22';
    const subjectColorBorder = subjectColor + '66';
    
    return `
      <span class="faculty-pill" style="--faculty-color: ${subjectColor};" data-faculty="${encodeURIComponent(faculty || 'Marrow Faculty')}" title="Taught by ${faculty || 'Marrow Faculty'}">
        <span class="faculty-pill-avatar" style="background: ${subjectColor};">${initials}</span>
        <span class="faculty-pill-name">${faculty || 'Marrow Faculty'}</span>
        <span class="material-symbols-outlined faculty-pill-verified" aria-label="Verified faculty">verified</span>
        <span class="faculty-pill-glow"></span>
      </span>`;
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

  function renderHoursMeter(completedHours, totalHours) {
    const done = parseFloat(completedHours) || 0;
    const total = parseFloat(totalHours) || 0;
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    const doneStr = (Math.round(done * 10) / 10).toString();
    const totalStr = (Math.round(total * 10) / 10).toString();
    return `
      <div class="hours-meter">
        <div class="hours-meter-head">
          <span class="hours-meter-label"><span class="material-symbols-outlined" style="font-size:13px;">schedule</span> LECTURE TIME</span>
          <span class="hours-meter-nums"><b>${doneStr}h</b><span class="hm-sep">/</span>${totalStr}h</span>
        </div>
        <div class="hm-track">
          <div class="hm-fill" style="width:${pct}%;"></div>
          <span class="hm-glow" style="left:${pct}%;"></span>
        </div>
      </div>`;
  }

  function renderOnboardingWizard(step) {
    obwStep = Math.max(0, Math.min(2, step || 0));
    if (!obwSeeded) {
      obwSeeded = true;
      if (state.personal && state.personal.doctorName) obwName = state.personal.doctorName;
    }
    const total = 3;
    const dots = [0, 1, 2].map(i =>
      `<span class="obw-dot ${i === obwStep ? 'active' : ''} ${i < obwStep ? 'done' : ''}"></span>`
    ).join('');
    const stepLabel = `FIRST SETUP · STEP ${obwStep + 1} OF ${total}`;

    let body = '';
    if (obwStep === 0) {
      body = `
        <div class="obw-title">📚 Choose your study source</div>
        <div class="obw-sub">Pick where your syllabus data comes from.</div>
        <div class="obw-options">
          ${STUDY_SOURCES.map(s => {
            const upcoming = !s.available;
            return `
              <button type="button" class="obw-option ${obwSource === s.id ? 'checked' : ''} ${upcoming ? 'upcoming' : ''}" data-source="${s.id}">
                <span class="obw-radio"></span>
                <span>
                  <span class="obw-option-title">${s.label}</span>
                  <span class="obw-option-sub">${upcoming ? 'Data lands in a future update.' : (s.id === 'marrow_8' ? 'Primary NEET-PG dataset — 20 subjects, full curriculum.' : 'Older edition — 20 subjects.')}</span>
                </span>
                ${upcoming ? '<span class="v2-hud-badge" style="margin-left:auto;">UPCOMING</span>' : ''}
              </button>`;
          }).join('')}
        </div>
        ${!STUDY_SOURCES.find(s => s.id === obwSource)?.available ? `
          <div class="obw-alert">
            <span class="material-symbols-outlined" style="font-size:16px;">info</span>
            ${getSourceLabel(obwSource)} is an upcoming feature. Its syllabus data will be available in a future update.
          </div>` : ''}
        <div class="obw-hint-path">
          <span class="material-symbols-outlined" style="font-size:16px;">settings</span>
          <span>You can change your study source anytime later from <b>Profile → Settings → Study Source</b>.</span>
        </div>
      `;
    } else if (obwStep === 1) {
      body = `
        <div class="obw-title">👤 About you</div>
        <div class="obw-sub">Help us personalize your dashboard.</div>
        <div style="text-align:left; margin-top:16px;">
          <label class="gcm-label" for="obw-name">What should we call you?</label>
          <input type="text" id="obw-name" class="obw-name-input" value="${escapeAttr(obwName)}" placeholder="Dr. Aspirant">
        </div>
        <div style="text-align:left; margin-top:16px;">
          <label class="gcm-label">Theme</label>
          <div class="obw-theme-grid">
            <button type="button" class="obw-theme-opt ${obwTheme === 'dark' ? 'checked' : ''}" data-theme-val="dark">🌙 Dark Mode</button>
            <button type="button" class="obw-theme-opt ${obwTheme === 'light' ? 'checked' : ''}" data-theme-val="light">☀️ Light Mode</button>
          </div>
        </div>
        <div class="obw-sub" style="margin-top:12px;">Change anytime from the Profile tab.</div>
        <hr style="margin:20px 0; border:none; border-top:1px solid var(--border);">
        <div class="obw-title" style="font-size:1rem; margin-bottom:8px;">☁️ Cloud Sync (Optional)</div>
        <div class="obw-sub">Sign in with Google to backup progress & sync across devices.</div>
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
          <button type="button" class="v2-arcade-btn obw-cta" id="obw-signin" style="width:100%;">
            <span class="material-symbols-outlined" style="margin-right:8px;">cloud_sync</span>
            Sign in with Google
          </button>
          <button type="button" class="v2-arcade-btn obw-skip" id="obw-skip-signin" style="width:100%; background:transparent; color:var(--text-secondary); border:1px solid var(--border);">Skip for now</button>
        </div>
        <div class="obw-sub" style="margin-top:8px;">You can sign in later from Profile → Settings.</div>
      `;
    } else {
      body = `
        <div class="obw-title">✅ You're all set, ${escapeHtml(obwName || 'Doctor')}!</div>
        <div class="obw-sub">${getSourceLabel(obwSource)} • ${obwTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
        <div class="obw-guide-list">
          <div class="obw-guide-item"><span class="obw-guide-num">1</span><span>📋 Set your study target — pick a subject and daily video pace.</span></div>
          <div class="obw-guide-item"><span class="obw-guide-num">2</span><span>✅ Check off videos daily. Your streak & progress update automatically.</span></div>
          <div class="obw-guide-item"><span class="obw-guide-num">3</span><span>📊 Analytics tracks pace & exam readiness; Curriculum browses all subjects.</span></div>
        </div>
        <hr style="margin:20px 0; border:none; border-top:1px solid var(--border);">
        <div class="obw-title" style="font-size:1rem; margin-bottom:8px;">☁️ Cloud Sync</div>
        <div class="obw-sub">Sign in with Google to keep completions, streaks, plans & preferences synced across all your devices — works offline.</div>
        <div class="obw-sub" style="margin-top:12px;">Sign in anytime from <b>Profile → Settings → Google Cloud Sync</b>.</div>
      `;
    }

    DOM.appMain.innerHTML = `
      <div style="margin-bottom:16px;">
        <div class="v2-pixel-card obw-card" style="padding:26px 20px;">
          <div class="obw-step-line">
            <span>${stepLabel}</span>
            <span class="obw-dots">${dots}</span>
          </div>
          <div class="obw-head">${body}</div>
          <div class="obw-footer">
            <button type="button" class="v2-arcade-btn obw-btn-back" id="obw-back" style="height:46px; min-width:110px; padding:0 14px;">← Back</button>
            <button type="button" class="v2-arcade-btn obw-cta" id="obw-next">${obwStep === 2 ? 'Got it — Show the Dashboard →' : 'Next →'}</button>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.obw-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-source');
        obwSource = sid;
        const srcObj = STUDY_SOURCES.find(s => s.id === sid);
        if (srcObj && !srcObj.available) {
          showToast(srcObj.label + ' is coming soon — data in a future update.', 'info');
        }
        renderOnboardingWizard(obwStep);
      });
    });

    document.querySelectorAll('.obw-theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        obwTheme = btn.getAttribute('data-theme-val');
        state.theme = obwTheme;
        applyTheme(state.theme);
        document.querySelectorAll('.obw-theme-opt').forEach(b => b.classList.toggle('checked', b === btn));
      });
    });

    const backBtn = document.getElementById('obw-back');
    if (backBtn) {
      if (obwStep === 0) backBtn.style.visibility = 'hidden';
      backBtn.addEventListener('click', () => {
        triggerHaptic('prev');
        renderOnboardingWizard(obwStep - 1);
      });
    }

    const nameInputEl = document.getElementById('obw-name');
    if (nameInputEl) {
      nameInputEl.addEventListener('input', () => { obwName = nameInputEl.value.trim(); });
    }

    const nextBtn = document.getElementById('obw-next');
    if (nextBtn) {
      nextBtn.disabled = (obwStep === 0 && !STUDY_SOURCES.find(s => s.id === obwSource)?.available);
      nextBtn.addEventListener('click', () => {
        if (obwStep === 1) {
          const nameInput = document.getElementById('obw-name');
          obwName = nameInput ? nameInput.value.trim() : obwName;
          state.theme = obwTheme;
          applyTheme(state.theme);
        }
        if (obwStep === 2) {
          finishOnboarding();
        } else {
          triggerHaptic('step');
          renderOnboardingWizard(obwStep + 1);
        }
      });
    }

    // Sign-in button
    const signinBtn = document.getElementById('obw-signin');
    if (signinBtn) {
      signinBtn.addEventListener('click', async () => {
        if (!window.FirebaseSync) return;
        signinBtn.disabled = true;
        signinBtn.innerHTML = '<span class="material-symbols-outlined" style="margin-right:8px;">sync</span> Signing in...';
        try {
          await window.FirebaseSync.signInWithGoogle();
          showToast('Signed in successfully!', 'check_circle');
          triggerHaptic('step');
          renderOnboardingWizard(obwStep + 1);
        } catch (e) {
          showToast('Sign-in failed: ' + e.message, 'error');
          signinBtn.disabled = false;
          signinBtn.innerHTML = '<span class="material-symbols-outlined" style="margin-right:8px;">cloud_sync</span> Sign in with Google';
        }
      });
    }

    // Skip sign-in button
    const skipSigninBtn = document.getElementById('obw-skip-signin');
    if (skipSigninBtn) {
      skipSigninBtn.addEventListener('click', () => {
        triggerHaptic('step');
        renderOnboardingWizard(obwStep + 1);
      });
    }
  }

  function finishOnboarding() {
    state.isConfigured = true;
    state.activeSource = obwSource;
    state.personal.doctorName = obwName || state.personal.doctorName || 'Dr. Aspirant';
    state.theme = obwTheme;
    applyTheme(state.theme);
    saveState();
    triggerHaptic('finish');
    render();
  }

  // --- Study Plan Config: always-visible inline form card ---
  function renderStudyPlanConfigCard() {
    return `
      <section id="study-plan-config" class="study-plan-config-section" aria-label="Study plan configuration">
        <div class="spc-header">
          <h2 class="spc-title">Study Plan Configuration</h2>
          <p class="spc-sub">Set your daily pace, target deadline &amp; dual-track goals. Everything auto-synchronizes.</p>
        </div>

        <div class="spc-body">
          <!-- Plan Selector Dropdown + Dual-Track Toggle -->
          <div class="spc-toolbar">
            <div class="spc-plan-select-wrap">
              <span class="material-symbols-outlined spc-flag-icon">flag</span>
              <select id="goal-plan-select" class="gcm-input spc-plan-select" aria-label="Select plan to configure">
                <option value="plan_a">Plan A — Primary Target</option>
              </select>
              <span class="material-symbols-outlined spc-select-arrow">expand_more</span>
            </div>
            <label class="gcm-dual spc-dual-toggle">
              <input type="checkbox" id="toggle-plan-b">
              <span class="gcm-switch"><i></i></span>
              <span class="gcm-dual-label">Dual-Track</span>
            </label>
          </div>

          <!-- PLAN A FORM -->
          <div id="goal-plan-a-form">
            <div class="gcm-plan-head">
              <span class="gcm-plan-badge"><span class="material-symbols-outlined" style="font-size:16px;">flag</span> Plan A — Primary Target</span>
              <span class="gcm-plan-role">Main <b>Subject Goal</b></span>
            </div>

            <form id="goal-form-a" onsubmit="return false;" class="gcm-form">
              <div class="gcm-hint">
                <span class="material-symbols-outlined">calculate</span>
                <span id="smart-math-text">Deadline &amp; targets automatically synchronized!</span>
              </div>

              <div class="gcm-field">
                <label class="gcm-label" for="select-target-subject">Priority Target Subject</label>
                <div class="gcm-select-wrap">
                  <select id="select-target-subject" class="gcm-input"></select>
                  <span class="material-symbols-outlined">expand_more</span>
                </div>
              </div>

              <div class="gcm-field">
                <div class="gcm-field-head">
                  <label class="gcm-label" style="margin:0;">Focus Chapter <span id="chapters-count-a" class="gcm-chips-count"></span></label>
                </div>
                <div class="gcm-hint" style="margin:4px 0 8px 0;">
                  <span class="material-symbols-outlined" style="font-size:15px;">filter_alt</span>
                  <span>Pick a single chapter to focus on, or keep All Chapters for the full subject.</span>
                </div>
                <div class="gcm-chips" id="chapter-chips-a"></div>
              </div>

              <div class="gcm-field">
                <div class="gcm-hint" style="margin:0;">
                  <span class="material-symbols-outlined" style="font-size:18px;">auto_stories</span>
                  <span>Syllabus source: <b id="goal-source-label">Marrow Edition 8</b>. Change it from <b>Profile → Settings → Study Source</b>.</span>
                </div>
              </div>

              <div class="gcm-field">
                <div class="gcm-field-head">
                  <label class="gcm-label" for="input-target-date" style="margin:0;">Target Deadline</label>
                  <span id="days-remaining-badge" class="gcm-badge">26 Days Left</span>
                </div>
                <input type="date" id="input-target-date" value="2026-08-15" class="gcm-input">
              </div>

              <div id="fields-video-mode" class="gcm-pace-grid" style="display:grid;">
                <div class="gcm-pace">
                  <div class="gcm-pace-top"><span class="gcm-pace-label">Daily</span><span class="gcm-pace-unit">vids</span></div>
                  <div class="gcm-pace-input-wrap">
                    <button type="button" class="gcm-step" data-step-index="0" data-step-fields="fields-video-mode">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-day" value="8" class="gcm-pace-input">
                    <button type="button" class="gcm-step" data-step-index="2" data-step-fields="fields-video-mode">+</button>
                  </div>
                  <label class="gcm-pace-tick"><input type="checkbox" id="toggle-card-daily" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="gcm-pace">
                  <div class="gcm-pace-top"><span class="gcm-pace-label">Weekly</span><span class="gcm-pace-unit">vids</span></div>
                  <div class="gcm-pace-input-wrap">
                    <button type="button" class="gcm-step" data-step-index="0" data-step-fields="fields-video-mode">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-week" value="56" class="gcm-pace-input">
                    <button type="button" class="gcm-step" data-step-index="2" data-step-fields="fields-video-mode">+</button>
                  </div>
                  <label class="gcm-pace-tick"><input type="checkbox" id="toggle-card-weekly" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="gcm-pace">
                  <div class="gcm-pace-top"><span class="gcm-pace-label">Monthly</span><span class="gcm-pace-unit">vids</span></div>
                  <div class="gcm-pace-input-wrap">
                    <button type="button" class="gcm-step" data-step-index="0" data-step-fields="fields-video-mode">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-month" value="240" class="gcm-pace-input">
                    <button type="button" class="gcm-step" data-step-index="2" data-step-fields="fields-video-mode">+</button>
                  </div>
                  <label class="gcm-pace-tick"><input type="checkbox" id="toggle-card-monthly" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
              </div>

              
              <div class="gcm-guide math-guide-card">
                <div class="gcm-guide-header math-guide-header">
                  <span class="material-symbols-outlined">info</span>
                  <span>How Plan A Date &amp; Pace Auto-Synchronize</span>
                  <span class="material-symbols-outlined gcm-guide-arrow math-guide-toggle-icon">expand_more</span>
                </div>
                <div class="gcm-guide-body math-guide-body">
                  <strong>Auto-Synchronization:</strong><br>
                  &bull; Selecting a <strong>Target Date</strong> auto-calculates Plan A <strong>Daily Pace</strong>.<br>
                  &bull; Changing <strong>Daily Pace</strong> auto-updates Plan A <strong>Target Date</strong>.
                </div>
              </div>

              <div class="gcm-actions">
                <button type="button" class="gcm-btn gcm-btn-prim" id="btn-apply-goals">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Save &amp; Apply Plan A Target</span>
                </button>
              </div>
            </form>
          </div>

          <!-- PLAN B FORM -->
          <div id="goal-plan-b-form" style="display:none;">
            <div class="gcm-plan-head">
              <span class="gcm-plan-badge"><span class="material-symbols-outlined" style="font-size:16px;">flag</span> Plan B — Secondary Target</span>
              <span class="gcm-plan-role">Parallel <b>Subject Goal</b></span>
            </div>

            <form id="goal-form-b" onsubmit="return false;" class="gcm-form">
              <div class="gcm-hint">
                <span class="material-symbols-outlined">calculate</span>
                <span id="smart-math-text-b">Deadline &amp; targets automatically synchronized!</span>
              </div>

              <div class="gcm-field">
                <label class="gcm-label" for="select-target-subject-b">Priority Target Subject</label>
                <div class="gcm-select-wrap">
                  <select id="select-target-subject-b" class="gcm-input"></select>
                  <span class="material-symbols-outlined">expand_more</span>
                </div>
              </div>

              <div class="gcm-field">
                <div class="gcm-field-head">
                  <label class="gcm-label" style="margin:0;">Focus Chapter <span id="chapters-count-b" class="gcm-chips-count"></span></label>
                </div>
                <div class="gcm-hint" style="margin:4px 0 8px 0;">
                  <span class="material-symbols-outlined" style="font-size:15px;">filter_alt</span>
                  <span>Pick a single chapter to focus on, or keep All Chapters for the full subject.</span>
                </div>
                <div class="gcm-chips" id="chapter-chips-b"></div>
              </div>

              <div class="gcm-field">
                <div class="gcm-field-head">
                  <label class="gcm-label" for="input-target-date-b" style="margin:0;">Target Deadline</label>
                  <span id="days-remaining-badge-b" class="gcm-badge">26 Days Left</span>
                </div>
                <input type="date" id="input-target-date-b" value="2026-08-15" class="gcm-input">
              </div>

              <div id="fields-video-mode-b" class="gcm-pace-grid" style="display:grid;">
                <div class="gcm-pace">
                  <div class="gcm-pace-top"><span class="gcm-pace-label">Daily</span><span class="gcm-pace-unit">vids</span></div>
                  <div class="gcm-pace-input-wrap">
                    <button type="button" class="gcm-step" data-step-index="0" data-step-fields="fields-video-mode-b">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-day-b" value="8" class="gcm-pace-input">
                    <button type="button" class="gcm-step" data-step-index="2" data-step-fields="fields-video-mode-b">+</button>
                  </div>
                  <label class="gcm-pace-tick"><input type="checkbox" id="toggle-card-daily-b" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="gcm-pace">
                  <div class="gcm-pace-top"><span class="gcm-pace-label">Weekly</span><span class="gcm-pace-unit">vids</span></div>
                  <div class="gcm-pace-input-wrap">
                    <button type="button" class="gcm-step" data-step-index="0" data-step-fields="fields-video-mode-b">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-week-b" value="56" class="gcm-pace-input">
                    <button type="button" class="gcm-step" data-step-index="2" data-step-fields="fields-video-mode-b">+</button>
                  </div>
                  <label class="gcm-pace-tick"><input type="checkbox" id="toggle-card-weekly-b" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="gcm-pace">
                  <div class="gcm-pace-top"><span class="gcm-pace-label">Monthly</span><span class="gcm-pace-unit">vids</span></div>
                  <div class="gcm-pace-input-wrap">
                    <button type="button" class="gcm-step" data-step-index="0" data-step-fields="fields-video-mode-b">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-month-b" value="240" class="gcm-pace-input">
                    <button type="button" class="gcm-step" data-step-index="2" data-step-fields="fields-video-mode-b">+</button>
                  </div>
                  <label class="gcm-pace-tick"><input type="checkbox" id="toggle-card-monthly-b" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
              </div>

              
              <div class="gcm-guide math-guide-card">
                <div class="gcm-guide-header math-guide-header">
                  <span class="material-symbols-outlined">info</span>
                  <span>How Plan B Date &amp; Pace Auto-Synchronize</span>
                  <span class="material-symbols-outlined gcm-guide-arrow math-guide-toggle-icon">expand_more</span>
                </div>
                <div class="gcm-guide-body math-guide-body">
                  <strong>Auto-Synchronization:</strong><br>
                  &bull; Selecting a <strong>Target Date</strong> auto-calculates Plan B <strong>Daily Pace</strong>.<br>
                  &bull; Changing <strong>Daily Pace</strong> auto-updates Plan B <strong>Target Date</strong>.
                </div>
              </div>

              <div class="gcm-actions">
                <button type="button" class="gcm-btn gcm-btn-prim" id="btn-apply-goals-b">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Save &amp; Apply Plan B Target</span>
                </button>
                <button type="button" class="gcm-btn gcm-btn-danger" id="btn-remove-plan-b">
                  <span class="material-symbols-outlined">disabled_by_default</span>
                  <span>Disable / Remove Plan B</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>`;
  }

  // --- View 1: Dashboard View ---
  function renderDashboardView(stats) {
    if (!state.isConfigured) {
      renderOnboardingWizard(0);
      return;
    }
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const plans = state.plans && state.plans.length > 0 ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    const hasTargetSet = plans.some(p => p.targetSubject && p.targetSubject !== '');
    const allQueues = getAllPlanQueues();
    const streakCount = getStudyStreak();

    const todayStr = todayKey();
    const todayCompletedCount = (state.dailyHistory && state.dailyHistory[todayStr]) || 0;

    let totalVidsDay = 0;
    plans.forEach(p => {
      totalVidsDay += Math.max(1, parseInt(p.videosPerDay) || 8);
    });

    // Helper: render one plan's daily quest block
    function renderPlanQuestBlock(plan, queue) {
      const planColor = plan.accentColor || PLAN_A_ACCENT;
      const todayDoneForPlan = queue.totalCompletedToday || 0;
      const dailyPctPlan = Math.min(100, Math.round((todayDoneForPlan / queue.baseTargetPace) * 100));
      const scopedNames = getScopedChapterNames(plan);

      return `
        <div class="plan-quest-block" style="--plan-accent: ${planColor};">
          <div class="plan-quest-header">
            <div class="plan-quest-header-left">
              <span class="plan-quest-badge" style="background:${planColor};">${plan.label}</span>
              <span class="plan-quest-subject-name">${queue.subjectName}</span>
            </div>
            <span class="plan-quest-progress">${todayDoneForPlan}/${queue.baseTargetPace} • ${dailyPctPlan}%</span>
          </div>

          ${scopedNames.length > 0 ? `
            <div class="plan-quest-scope">
              <span class="material-symbols-outlined" style="font-size:13px;">filter_alt</span>
              FOCUS: ${scopedNames.slice(0, 3).map(n => n.charAt(0) + n.slice(1).toLowerCase()).join(', ')}${scopedNames.length > 3 ? '…' : ''}
            </div>
          ` : ''}

          <div class="plan-quest-stats-row">
            <div class="plan-quest-target-text">
              TARGET: <strong>${(plan.extraBatchesCompletedToday || 0) > 0 ? '1 VIDEO AT A TIME' : queue.baseTargetPace + ' VIDS/DAY'}</strong>
            </div>
            <button class="v2-arcade-btn btn-open-queue-subject" data-subject-id="${queue.subjectId}" style="height: 30px; padding: 0 10px; font-size: 0.82rem;">
              <span>Open ${queue.subjectName}</span>
              <span class="material-symbols-outlined" style="font-size: 14px;">arrow_forward</span>
            </button>
          </div>

          ${queue.isDailyTargetAchieved ? `
            ${(plan.extraBatchesCompletedToday || 0) > 0 ? `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px; border-color: var(--accent-secondary, #a855f7);">
                <div class="v2-alert-icon-box" style="background: #a855f7; color: #ffffff; font-size: 20px; font-weight: bold;"><span class="material-symbols-outlined" style="font-size:18px;">bolt</span></div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: #a855f7;">${plan.label} EXTRA VIDEO #${plan.extraBatchesCompletedToday + 1} ▶ OVERACHIEVED!</div>
                  <div class="v2-alert-title">🔥 Overachievement Bonus Unlocked!</div>
                  <div class="v2-alert-body">You've completed an extra video! Total extra videos today: ${plan.extraBatchesCompletedToday} for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:#a855f7;"></div>
              </div>
            ` : `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px;">
                <div class="v2-alert-icon-box" style="background: var(--accent-success, #10b981);">${PXL_ICONS.trophy}</div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: var(--accent-success, #10b981);">${plan.label} DAILY TARGET ▶ COMPLETED</div>
                  <div class="v2-alert-title">Daily Target Achieved!</div>
                  <div class="v2-alert-body">All ${queue.baseTargetPace} videos done for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:var(--accent-success,#10b981);"></div>
              </div>
            `}
            <button class="v2-arcade-btn btn-advance-queue" data-plan-id="${plan.id}" style="width:100%; height:40px; font-weight:700; font-size:0.9rem; justify-content:center; gap:8px;">
              ${PXL_ICONS.rocket}
              <span>🚀 Load Next Video</span>
            </button>
          ` : (queue.allSubjectDone ? `
            <div class="congrats-card-pop" style="text-align:center; padding:14px; color:var(--success); font-family:var(--font-display); font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
              ${PXL_ICONS.trophy}
              <span>All ${queue.subjectName} videos completed! <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">celebration</span></span>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap: 2px;">
              ${queue.videos.map(v => {
                const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
                let vNum = '#' + (v.videoNumber || '#1').replace(/^#+/, '');
                const isDone = !!state.completedVideos[v.id];
                return `
                  <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                    <label class="v2-pixel-checkbox-label">
                      <input type="checkbox" class="queue-chk" data-video-id="${v.id}" data-plan-id="${plan.id}" ${isDone ? 'checked' : ''}>
                      <span class="v2-pixel-checkbox-box"></span>
                      <div>
                        <div class="v2-quest-title"><span class="quest-video-num">${vNum}</span> ${v.title}</div>
                        <div class="quest-video-chapter">${v.chapterName}</div>
                      </div>
                    </label>
                    <div class="quest-video-dur">${durStr}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `)}
        </div>
      `;
    }

    const allQuestsDone = allQueues.every(q => q.isDailyTargetMet);
    const hasDualPlans = plans.length >= 2;

    DOM.appMain.innerHTML = `
      <!-- Hero Card -->
      <div class="pxl-feature-card-wrapper">
        <div class="pxl-feature-card hero-banner-card">
          <div class="pxl-feature-card-header-badges">
            ${renderEditionChip()}
            ${hasDualPlans ? `
              <span class="v2-hud-badge" style="color: #ffffff; background: linear-gradient(135deg, #e11d48 0%, #f97316 100%); border-color: #e11d48;"><span class="material-symbols-outlined" style="font-size:16px;">bolt</span> DUAL-TRACK MODE</span>
             ` : ''}
            <span class="v2-hud-badge" style="margin-left:auto;"><span class="material-symbols-outlined" style="font-size:16px;">local_fire_department</span> ${streakCount} day streak</span>
          </div>
          <h1 class="pxl-feature-card-title">Welcome back, ${escapeHtml(docName)}!</h1>
          <p class="pxl-feature-card-desc">
            ${hasDualPlans ? `Tracking ${plans.map(p => p.targetSubject || 'No subject set').join(' + ')}` : `${plans[0]?.targetSubject || 'No subject set'}`} — ${stats.percentage}% Mastered
          </p>
          <div class="hero-mastery-block">
            <div class="hero-mastery-top">
              <span class="hero-mastery-label"><span class="hero-mastery-dot"></span> Syllabus Mastery</span>
              <span style="font-size:0.7rem; font-weight:600; color:var(--text-muted); font-family: var(--font-hud);">${stats.totalVideos > 0 ? stats.completedVideos + ' / ' + stats.totalVideos + ' videos' : 'No data yet'}</span>
            </div>
            <div class="hero-mastery-value">${stats.percentage}<span style="font-size:0.9rem; font-weight:600; opacity:0.7;">%</span></div>
            <div class="v2-hp-bar-bg hero-hp-bar">
              <div class="v2-hp-bar-fill" style="width:${stats.percentage}%;"></div>
            </div>
            <div class="hero-mastery-sub">
              <span>${stats.percentage < 25 ? 'Just getting started' : stats.percentage < 50 ? 'Building momentum' : stats.percentage < 75 ? 'Strong progress' : stats.percentage < 90 ? 'Almost there' : 'Mastery achieved!'}</span>
              <span>${stats.percentage < 100 ? (100 - stats.percentage) + '% to mastery' : 'Complete!'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Android PWA Install Banner -->
      ${state.canInstallPWA ? `
        <div id="pwa-install-banner-card" class="v2-pixel-card pwa-install-banner">
          <div class="pwa-install-banner-content">
            <div class="pwa-install-text">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span class="v2-hud-badge"><span class="material-symbols-outlined" style="font-size:16px;">smartphone</span> MOBILE PWA</span>
              </div>
              <h3 class="pwa-install-title">Install FlowMD Android App</h3>
              <p class="pwa-install-desc">Get offline access & hardware back-button integration!</p>
            </div>
            <div class="pwa-install-buttons">
              <button type="button" class="v2-arcade-btn" id="btn-pwa-install-now" style="height: 38px; font-size: 0.88rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">get_app</span>
                <span>Install</span>
              </button>
              <button type="button" class="v2-arcade-btn" id="btn-pwa-dismiss-banner" style="height: 38px; background: var(--bg-surface-raised); color: var(--text-secondary); font-size: 0.88rem;">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- All-Quests-Done Banner -->
      ${allQuestsDone ? `
        <div class="v2-achievement-alert congrats-card-pop all-quests-banner">
          <div class="v2-alert-icon-box" style="background: #ffd700;">${PXL_ICONS.trophy}</div>
          <div class="v2-alert-content">
            <div class="v2-alert-category all-quests-category"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">emoji_events</span> ALL DAILY QUESTS COMPLETE!</div>
            <div class="v2-alert-title">Outstanding Performance!</div>
            <div class="v2-alert-body">Every plan's daily target has been achieved today!</div>
          </div>
          <div class="v2-alert-bottom-bar" style="width:100%; background:#ffd700;"></div>
        </div>
      ` : ''}

      <!-- Daily Quest Section (per plan) -->
      <div class="v2-quest-card action-queue-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><span class="material-symbols-outlined mat">emoji_events</span> Daily Quests</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">${hasDualPlans ? 'DUAL TRACK' : `${allQueues[0]?.subjectName || 'All Topics'}`}</span>
        </div>
        <div style="padding-top:4px;">
          ${hasTargetSet
            ? plans.map((plan, idx) => renderPlanQuestBlock(plan, allQueues[idx])).join('')
            : `
              <div class="obw-empty-cta">
                <div class="obw-title" style="margin-bottom:6px;">No study target set yet</div>
                <div class="obw-sub">Pick a subject and a daily pace to start your daily quests.</div>
                <button type="button" class="v2-arcade-btn" id="btn-set-first-target" style="height:46px; min-width:150px; padding:0 16px; margin-top:14px;">Set Your First Target 🎯</button>
              </div>`}
        </div>
      </div>

      <!-- Study Plan Configuration (always-visible inline form) -->
      ${renderStudyPlanConfigCard()}
    `;

    document.getElementById('btn-pwa-install-now')?.addEventListener('click', () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('Installing FlowMD PWA...', 'rocket_launch');
            triggerHaptic('install');
          }
          deferredInstallPrompt = null;
          state.canInstallPWA = false;
          render();
        });
      } else {
        showToast('To install: tap Browser Menu (⋮) → "Add to Home screen"', 'info');
      }
    });

    document.getElementById('btn-pwa-dismiss-banner')?.addEventListener('click', () => {
      state.canInstallPWA = false;
      showToast('Install banner dismissed.', 'info');
      renderDashboardView(stats);
    });

    document.querySelectorAll('.btn-open-queue-subject').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeSubjectId = btn.getAttribute('data-subject-id');
        switchView('subject_detail');
      });
    });

    document.getElementById('btn-set-first-target')?.addEventListener('click', () => {
      focusStudyPlanConfig();
    });

    // Per-plan advance batch (for extra videos beyond daily target)
    document.querySelectorAll('.btn-advance-queue').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : (state.plans && state.plans[0]);
        if (plan) {
          // For extra videos: load only 1 at a time
          plan.extraBatchesCompletedToday = (plan.extraBatchesCompletedToday || 0) + 1;
          plan.queueBatchVideoIds = [];
          plan.queueCompletedInBatch = 0;
          saveState();
          showToast(`${plan.label} — Next Extra Video Loaded!`, 'arrow_forward', `${plan.label} Advanced`);
        } else {
          state.queueBatchVideoIds = [];
          state.queueCompletedInBatch = 0;
          saveState();
          showToast('Next Video Loaded!', 'arrow_forward');
        }
        render();
      });
    });

    document.querySelectorAll('.queue-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        const planId = e.target.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : null;

        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          // Get subjectId from the video (scoped to the plan's dataset)
          const planVideos = plan ? getPlanScopeVideos(plan) : [];
          const video = planVideos.find(v => v.id === vidId);
          const subjectId = video ? video.subjectId : null;
          markStudyActivity(true, subjectId);
          const planLabel = plan ? plan.label : '';
          showToast(`${planLabel ? planLabel + ' — ' : ''}Completed Action Queue Video!`, 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          const planVideos = plan ? getPlanScopeVideos(plan) : [];
          const video = planVideos.find(v => v.id === vidId);
          const subjectId = video ? video.subjectId : null;
          markStudyActivity(false, subjectId);
        }
        saveState();
        render();
      });
    });

    document.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const subId = card.getAttribute('data-subject-id');
        if (subId) { state.activeSubjectId = subId; switchView('subject_detail'); }
      });
    });

    document.querySelectorAll('.pxl-heatmap-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.pxl-heatmap-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.pxl-heatmap-tile').forEach(tile => {
          tile.style.display = (filter === 'all' || tile.getAttribute('data-tier') === filter) ? 'flex' : 'none';
        });
      });
    });

    // Always-visible inline Study Plan config card
    initStudyPlanConfig();
  }



// --- View 2: Curriculum View — Nested Mobile Tabs ---
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
  function renderExecutionChart(last7Days, vidsDay, maxChartVal) {
    const dailyCounts = getDailyCountsExcludingBulk();
    const width = 600;
    const height = 200;
    const padL = 14;
    const padR = 14;
    const padT = 32;
    const padB = 26;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const baseY = padT + chartH;
    const scale = Math.max(1, maxChartVal);

    const points = last7Days.map((d, i) => {
      const count = dailyCounts[d.dateKey] || 0;
      const x = padL + (chartW * i) / (last7Days.length - 1);
      const y = padT + chartH - Math.min(chartH, (count / scale) * chartH);
      return { x, y, count, label: d.label, isMet: count >= vidsDay };
    });

    const targetY = padT + chartH - Math.min(chartH, (vidsDay / scale) * chartH);
    const total7DayVids = points.reduce((sum, p) => sum + p.count, 0);
    const metDays = points.filter(p => p.isMet).length;

    const smoothPath = (pts) => {
      if (pts.length < 2) return pts.length ? 'M ' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2) : '';
      let d = 'M ' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ' C ' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) + ', ' + c2x.toFixed(2) + ' ' + c2y.toFixed(2) + ', ' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
      }
      return d;
    };

    const linePath = smoothPath(points);
    const areaPath = linePath
      ? linePath + ' L ' + points[points.length - 1].x.toFixed(2) + ' ' + baseY.toFixed(2) + ' L ' + points[0].x.toFixed(2) + ' ' + baseY.toFixed(2) + ' Z'
      : '';
    const gridY = [0.25, 0.5, 0.75].map(f => padT + chartH - chartH * f);

    return `
      <section class="ex-chart-card">
        <div class="ex-chart-head">
          <div class="ex-chart-titlewrap">
            <span class="ex-chart-icon"><span class="material-symbols-outlined">bar_chart</span></span>
            <div>
              <div class="ex-chart-kicker">Execution &mdash; Last 7 Days</div>
              <h3 class="ex-chart-title">7-Day Execution Chart</h3>
            </div>
          </div>
          <span class="v2-hud-badge ex-chart-target-badge">TARGET ${vidsDay} VIDS/DAY</span>
        </div>

        <div class="ex-chart-legend">
          <span class="ex-chart-legend-item"><span class="ex-dot ex-dot-met"></span> Target Met</span>
          <span class="ex-chart-legend-item"><span class="ex-dot ex-dot-part"></span> Partial</span>
          <span class="ex-chart-legend-item"><span class="ex-dot ex-dot-zero"></span> No Study</span>
          <span class="ex-chart-legend-item ex-chart-legend-target"><span class="ex-dot ex-dot-target"></span> Daily Target</span>
        </div>

        <div class="ex-chart-plot">
          <svg viewBox="0 0 ${width} ${height}" class="ex-chart-svg" role="img" aria-label="7-day video execution chart">
            <defs>
              <linearGradient id="exChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style="stop-color:var(--accent-primary); stop-opacity:0.30" />
                <stop offset="100%" style="stop-color:var(--accent-primary); stop-opacity:0.02" />
              </linearGradient>
            </defs>

            ${gridY.map(y => '<line class="ex-chart-gridline" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (width - padR) + '" y2="' + y.toFixed(1) + '"></line>').join('')}
            <line class="ex-chart-baseline" x1="${padL}" y1="${baseY}" x2="${width - padR}" y2="${baseY}" />
            <line class="ex-chart-targetline" x1="${padL}" y1="${targetY.toFixed(1)}" x2="${width - padR}" y2="${targetY.toFixed(1)}" />
            <text class="ex-chart-targetlabel" x="${width - padR}" y="${Math.max(12, targetY - 7)}">TARGET ${vidsDay}/DAY</text>

            ${areaPath ? '<path d="' + areaPath + '" class="ex-chart-area" />' : ''}
            ${linePath ? '<path d="' + linePath + '" class="ex-chart-line" />' : ''}

            ${points.map(p => {
              const nodeCls = p.count === 0 ? 'zero' : (p.isMet ? 'met' : 'part');
              const ptCls = p.count === 0 ? 'is-zero' : (p.isMet ? 'is-met' : 'is-part');
              const titleText = p.label + ': ' + p.count + ' video' + (p.count !== 1 ? 's' : '') + (p.isMet ? ' Target Met' : (p.count > 0 ? ' Partial' : ' No study'));
              const star = p.isMet && p.count > 0 ? ' \u2605' : '';
              return `
              <g class="ex-chart-point ${ptCls}">
                <title>${p.label}: ${titleText}</title>
                <text class="ex-chart-val" x="${p.x.toFixed(2)}" y="${Math.max(12, p.y - 11)}">${p.count}${star}</text>
                <circle class="ex-chart-node ex-node-${nodeCls}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5" />
              </g>
            `}).join('')}

            ${points.map(p => '<text class="ex-chart-xlabel" x="' + p.x.toFixed(2) + '" y="' + (height - 5) + '">' + p.label + '</text>').join('')}
          </svg>
        </div>

        <div class="ex-chart-days">
          ${points.map(p => {
            const tileCls = p.count === 0 ? 'is-zero' : (p.isMet ? 'is-met' : 'is-part');
            const titleText = p.label + ': ' + p.count + ' video' + (p.count !== 1 ? 's' : '') + ' ' + (p.isMet ? 'Target Met' : (p.count > 0 ? 'Partial' : 'No study'));
            const fillPct = Math.min(100, Math.round((p.count / Math.max(vidsDay, 1)) * 100));
            const status = p.isMet ? 'MET' : (p.count > 0 ? 'PARTIAL' : '0 VIDS');
            return `
              <div class="ex-day-tile ${tileCls}" title="${titleText}">
                <div class="ex-day-name">${p.label}</div>
                <div class="ex-day-count">${p.count}</div>
                <div class="ex-day-status">${status}</div>
                <div class="ex-day-track"><div class="ex-day-fill" style="width:${fillPct}%"></div></div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="ex-chart-foot">
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--accent-primary)"></span> Total <b>${total7DayVids} vids</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--success)"></span> Target Met <b>${metDays}/7 days</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--warning)"></span> Pace <b>${Math.round((total7DayVids / Math.max(vidsDay * 7, 1)) * 100)}%</b></span>
        </div>
      </section>
    `;
  }

  // --- View 4: Target & Goal-Driven Analytics Suite (Dual-Plan) ---
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
  function getSelectedUnitsForPlanKey(isPlanB) {
    const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
    if (!container) return [];
    const allChip = container.querySelector('.gcm-chip[data-chap="__all__"]');
    if (allChip && allChip.classList.contains('selected')) return [];
    const selChip = container.querySelector('.gcm-chip.selected[data-chap]');
    const name = selChip ? selChip.getAttribute('data-chap') : null;
    return (name && name !== '__all__') ? [name] : [];
  }

  // --- Goal Modal Helpers (Dual-Plan Fully Functional) ---
  function focusStudyPlanConfig() {
    if (state.currentView !== 'dashboard') {
      switchView('dashboard');
    }
    const card = document.getElementById('study-plan-config');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initStudyPlanConfig() {
    const subSelectA = document.getElementById('select-target-subject');
    const subSelectB = document.getElementById('select-target-subject-b');
    const srcLabelEl = document.getElementById('goal-source-label');
    const sid = state.activeSource || 'marrow_8';

    function renderSubjectOptionsFor(sourceId, selectEl, preferredValue) {
      if (!selectEl) return null;
      const stats = getSyllabusStatsForSource(sourceId);
      let html = stats.subjectsStats.map(s => `
        <option value="${s.name}">${s.name} (${s.totalVideos} Videos • ${s.totalHours}h)</option>
      `).join('');
      if (!html) html = '<option value="">No subjects available</option>';
      selectEl.innerHTML = html;
      if (preferredValue && selectEl.querySelector(`option[value="${preferredValue}"]`)) {
        selectEl.value = preferredValue;
      } else {
        selectEl.selectedIndex = 0;
      }
      return stats;
    }

    function populateSubjectUI() {
      if (srcLabelEl) {
        const src = STUDY_SOURCES.find(s => s.id === sid);
        srcLabelEl.textContent = src ? src.label : 'Marrow Edition 8';
      }
      renderSubjectOptionsFor(sid, subSelectA, state.plans && state.plans[0] ? state.plans[0].targetSubject : '');
      renderSubjectOptionsFor(sid, subSelectB, state.plans && state.plans[1] ? state.plans[1].targetSubject : '');
    }

    populateSubjectUI();

    const planA = state.plans[0] || DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT);
    const hasPlanB = state.plans.length >= 2;
    const planB = hasPlanB ? state.plans[1] : DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology');

    // Populate Plan A Form
    if (subSelectA) {
      if (planA.targetSubject && subSelectA.querySelector(`option[value="${planA.targetSubject}"]`)) {
        subSelectA.value = planA.targetSubject;
      } else if (subSelectA.options.length > 0) {
        subSelectA.selectedIndex = 0;
      }
    }
    const dateInputA = document.getElementById('input-target-date');
    if (dateInputA) dateInputA.value = planA.targetDate || '2026-08-15';
    const vidsInputA = document.getElementById('input-videos-per-day');
    if (vidsInputA) vidsInputA.value = planA.videosPerDay || 8;

    // Populate Plan B Form
    if (subSelectB) {
      const prefB = planB.targetSubject || 'Pathology';
      if (subSelectB.querySelector(`option[value="${prefB}"]`)) {
        subSelectB.value = prefB;
      } else if (subSelectB.options.length > 0) {
        subSelectB.selectedIndex = 0;
      }
    }
    const dateInputB = document.getElementById('input-target-date-b');
    if (dateInputB) dateInputB.value = planB.targetDate || '2026-08-15';
    const vidsInputB = document.getElementById('input-videos-per-day-b');
    if (vidsInputB) vidsInputB.value = planB.videosPerDay || 8;

    // --- Focus Chapter: render + wire single-select chips ---
    function updateChapterCount(isPlanB, total) {
      const countEl = document.getElementById(isPlanB ? 'chapters-count-b' : 'chapters-count-a');
      if (!countEl) return;
      const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
      const allChip = container ? container.querySelector('.gcm-chip[data-chap="__all__"]') : null;
      if (allChip && allChip.classList.contains('selected')) {
        countEl.textContent = 'All chapters';
      } else {
        const selChip = container ? container.querySelector('.gcm-chip.selected[data-chap]:not([data-chap="__all__"])') : null;
        countEl.textContent = selChip ? `1 of ${total || 0}` : 'All chapters';
      }
    }

    function renderUnitChips(planKey, subjectVal) {
      const isPlanB = (planKey === 'plan_b');
      const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
      if (!container) return;
      const idx = isPlanB ? 1 : 0;

      const sid = state.activeSource || 'marrow_8';
      let chapters = [];
      try {
        const dataset = getDataset();
        const sub = dataset.find(s => s && (s.subject === subjectVal || s.id === subjectVal));
        chapters = (sub && sub.chapters) ? sub.chapters : [];
      } catch (e) {
        chapters = [];
      }

      if (chapters.length === 0) {
        container.innerHTML = '<div class="gcm-chips-empty">No chapters found for this subject.</div>';
        updateChapterCount(isPlanB, 0);
        return;
      }

      const savedUnits = (state.plans && state.plans[idx] && Array.isArray(state.plans[idx].targetUnits) && state.plans[idx].targetUnits.length > 0)
        ? state.plans[idx].targetUnits.map(u => String(u)) : null;

      // Single focus per plan: exactly one saved chapter -> select it; anything else (none or legacy multi) -> All Chapters.
      let focusedName = null;
      if (savedUnits && savedUnits.length === 1) {
        const match = chapters.find(c => c && String(c.name) === savedUnits[0]);
        if (match) focusedName = String(match.name);
      }

      const searchId = `gcm-chapter-search-${isPlanB ? 'b' : 'a'}`;
      const allChip = `<button type="button" class="gcm-chip ${focusedName ? '' : 'selected'}" data-chap="__all__"><span class="material-symbols-outlined" style="font-size:15px;">select_all</span><span>All Chapters</span></button>`;

      container.innerHTML = `
        <div class="gcm-chips-search">
          <span class="material-symbols-outlined" style="font-size:16px; color:var(--text-muted);">search</span>
          <input type="text" id="${searchId}" placeholder="Search chapters..." style="flex:1; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:8px 12px; font-family:'Poppins', sans-serif; font-size:0.85rem; color:var(--text-primary);" autocomplete="off">
        </div>
        <div class="gcm-chips-list" style="max-height:280px; overflow-y:auto;">${allChip + chapters.map(c => {
        const name = String(c.name);
        const on = (focusedName === name);
        const vcount = (c.videos && c.videos.length) || 0;
        return `<button type="button" class="gcm-chip ${on ? 'selected' : ''}" data-chap="${name}"><span>${name}</span><span class="gcm-chip-vids">${vcount}</span></button>`;
      }).join('')}</div>
      `;

      // Search filter
      const searchInput = document.getElementById(searchId);
      const chipList = container.querySelector('.gcm-chips-list');
      if (searchInput && chipList) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase().trim();
          chipList.querySelectorAll('.gcm-chip').forEach(chip => {
            const name = chip.querySelector('span')?.textContent?.toLowerCase() || '';
            const match = q === '' || name.includes(q);
            chip.style.display = match ? 'inline-flex' : 'none';
          });
        });
      }

      chipList.querySelectorAll('.gcm-chip').forEach(chip => {
        chip.onclick = () => {
          if (chip.classList.contains('selected')) {
            if (chip.getAttribute('data-chap') !== '__all__') {
              // Deselect a focused chapter -> back to full subject
              container.querySelectorAll('.gcm-chip').forEach(c => c.classList.remove('selected'));
              container.querySelector('.gcm-chip[data-chap="__all__"]')?.classList.add('selected');
            }
          } else {
            container.querySelectorAll('.gcm-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
          }
          updateChapterCount(isPlanB, chapters.length);
          synchronizeModalPace('subjectChange', planKey);
        };
      });

      updateChapterCount(isPlanB, chapters.length);
    }

    renderUnitChips('plan_a', subSelectA ? subSelectA.value : '');
    renderUnitChips('plan_b', subSelectB ? subSelectB.value : '');

    const togglePlanB = document.getElementById('toggle-plan-b');
    if (togglePlanB) togglePlanB.checked = hasPlanB;

    const planSelect = document.getElementById('goal-plan-select');
    const formA = document.getElementById('goal-plan-a-form');
    const formB = document.getElementById('goal-plan-b-form');
    const dualStatusEl = document.getElementById('spc-dual-status');

    function syncPlanSelectOptions() {
      if (!planSelect) return;
      const hasB = state.plans.length >= 2 || (togglePlanB && togglePlanB.checked);
      const optB = planSelect.querySelector('option[value="plan_b"]');
      if (hasB && !optB) {
        const opt = document.createElement('option');
        opt.value = 'plan_b';
        opt.textContent = 'Plan B — Secondary Target';
        planSelect.appendChild(opt);
      } else if (!hasB && optB) {
        optB.remove();
      }
    }

    function switchGoalTab(activePlan) {
      const isB = (activePlan === 'plan_b');
      if (planSelect) planSelect.value = isB ? 'plan_b' : 'plan_a';
      if (formA) formA.style.display = isB ? 'none' : 'block';
      if (formB) formB.style.display = isB ? 'block' : 'none';
      if (dualStatusEl) dualStatusEl.textContent = isB ? 'On' : 'Off';
      if (isB && togglePlanB && !togglePlanB.checked) {
        togglePlanB.checked = true;
        if (state.plans.length < 2) {
          state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
        }
      }
      synchronizeModalPace('init', isB ? 'plan_b' : 'plan_a');
    }

    syncPlanSelectOptions();
    if (planSelect) planSelect.onchange = () => switchGoalTab(planSelect.value);

    if (togglePlanB) {
      togglePlanB.onchange = () => {
        if (togglePlanB.checked) {
          if (state.plans.length < 2) {
            state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
          }
          syncPlanSelectOptions();
          switchGoalTab('plan_b');
        } else {
          if (state.plans.length >= 2) {
            state.plans.splice(1, 1);
          }
          syncPlanSelectOptions();
          switchGoalTab('plan_a');
        }
        saveState();
      };
    }

    // --- Save Plan A Action ---
    const btnApplyA = document.getElementById('btn-apply-goals');
    if (btnApplyA) {
      btnApplyA.onclick = () => {
        state.isConfigured = true;
        if (!state.plans[0]) state.plans[0] = DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT);
        const prevSubject = state.plans[0].targetSubject;
        const newSubject = subSelectA ? subSelectA.value : '';
        state.plans[0].targetSubject = newSubject;
        state.plans[0].targetDate = dateInputA ? dateInputA.value : '2026-08-15';
        state.plans[0].videosPerDay = Math.max(1, parseInt(vidsInputA ? vidsInputA.value : 8) || 8);
        state.plans[0].videosPerWeek = state.plans[0].videosPerDay * 7;
        state.plans[0].videosPerMonth = state.plans[0].videosPerDay * 30;
        const prevUnits = state.plans[0].targetUnits;
        state.plans[0].targetUnits = getSelectedUnitsForPlanKey(false);
        if (prevSubject !== newSubject) {
          // Subject changed: reset queue state so the daily quest reloads a
          // fresh batch at the normal pace (not stuck in 1-at-a-time extra mode)
          state.plans[0].queueBatchVideoIds = [];
          state.plans[0].queueCompletedInBatch = 0;
          state.plans[0].extraBatchesCompletedToday = 0;
          state.plans[0].lastBatchDate = '';
        } else if ((prevUnits || []).join('|') !== (state.plans[0].targetUnits || []).join('|')) {
          state.plans[0].queueBatchVideoIds = [];
          state.plans[0].queueCompletedInBatch = 0;
          state.plans[0].extraBatchesCompletedToday = 0;
        }

        // Keep legacy state.goals updated
        state.goals.targetSubject = state.plans[0].targetSubject;
        state.goals.targetDate = state.plans[0].targetDate;
        state.goals.videosPerDay = state.plans[0].videosPerDay;

        saveState();
        showToast('Plan A Target Configured & Saved!', 'check_circle', 'Plan A Updated');
        render();
      };
    }

    // --- Save Plan B Action ---
    const btnApplyB = document.getElementById('btn-apply-goals-b');
    if (btnApplyB) {
      btnApplyB.onclick = () => {
        if (state.plans.length < 2) {
          state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
        }
        const prevSubject = state.plans[1].targetSubject;
        const newSubject = subSelectB ? subSelectB.value : 'Pathology';
        state.plans[1].targetSubject = newSubject;
        state.plans[1].targetDate = dateInputB ? dateInputB.value : '2026-08-15';
        state.plans[1].videosPerDay = Math.max(1, parseInt(vidsInputB ? vidsInputB.value : 8) || 8);
        state.plans[1].videosPerWeek = state.plans[1].videosPerDay * 7;
        state.plans[1].videosPerMonth = state.plans[1].videosPerDay * 30;
        const prevUnits = state.plans[1].targetUnits;
        state.plans[1].targetUnits = getSelectedUnitsForPlanKey(true);
        if (prevSubject !== newSubject) {
          // Subject changed: reset queue state so the daily quest reloads a
          // fresh batch at the normal pace (not stuck in 1-at-a-time extra mode)
          state.plans[1].queueBatchVideoIds = [];
          state.plans[1].queueCompletedInBatch = 0;
          state.plans[1].extraBatchesCompletedToday = 0;
          state.plans[1].lastBatchDate = '';
        } else if ((prevUnits || []).join('|') !== (state.plans[1].targetUnits || []).join('|')) {
          state.plans[1].queueBatchVideoIds = [];
          state.plans[1].queueCompletedInBatch = 0;
          state.plans[1].extraBatchesCompletedToday = 0;
        }

        saveState();
        showToast('Plan B Target Configured & Saved!', 'check_circle', 'Plan B Updated');
        render();
      };
    }

    // --- Remove Plan B Action ---
    const btnRemoveB = document.getElementById('btn-remove-plan-b');
    if (btnRemoveB) {
      btnRemoveB.onclick = () => {
        if (state.plans.length >= 2) state.plans.splice(1, 1);
        if (togglePlanB) togglePlanB.checked = false;
        saveState();
        showToast('Plan B Target Disabled.', 'info', 'Single Plan Mode');
        switchGoalTab('plan_a');
        render();
      };
    }

    // --- Subject & Pace Listeners for Plan A ---
    if (subSelectA) subSelectA.onchange = () => {
      renderUnitChips('plan_a', subSelectA.value);
      synchronizeModalPace('subjectChange', 'plan_a');
    };
    if (dateInputA) dateInputA.oninput = () => synchronizeModalPace('date', 'plan_a');
    if (vidsInputA) vidsInputA.oninput = () => synchronizeModalPace('dailyVids', 'plan_a');

    // --- Subject & Pace Listeners for Plan B ---
    if (subSelectB) subSelectB.onchange = () => {
      renderUnitChips('plan_b', subSelectB.value);
      synchronizeModalPace('subjectChange', 'plan_b');
    };
    if (dateInputB) dateInputB.oninput = () => synchronizeModalPace('date', 'plan_b');
    if (vidsInputB) vidsInputB.oninput = () => synchronizeModalPace('dailyVids', 'plan_b');

    // Math Guide Accordion Toggles
    document.querySelectorAll('.math-guide-card').forEach(card => {
      const header = card.querySelector('.math-guide-header');
      const body = card.querySelector('.math-guide-body');
      const icon = card.querySelector('.math-guide-toggle-icon');
      if (header && body) {
        header.onclick = () => {
          const isHidden = (body.style.display === 'none' || !body.style.display);
          body.style.display = isHidden ? 'block' : 'none';
          if (icon) icon.textContent = isHidden ? 'expand_less' : 'expand_more';
        };
      }
    });

    // Stepper buttons (±) for the pace inputs
    document.querySelectorAll('#study-plan-config .gcm-step').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const wrap = btn.closest('.gcm-pace-input-wrap');
        const input = wrap ? wrap.querySelector('.gcm-pace-input') : null;
        if (!input) return;
        const isPlus = btn.textContent.trim() === '+';
        const step = parseFloat(input.step) || 1;
        const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
        const max = input.max !== '' ? parseFloat(input.max) : Infinity;
        let val = (parseFloat(input.value) || 0) + (isPlus ? step : -step);
        val = Math.min(max, Math.max(min, val));
        input.value = val;
        const isPlanB = !!btn.closest('#goal-plan-b-form');
        const planKey = isPlanB ? 'plan_b' : 'plan_a';
        const isDaily = /per-day|daily-target/.test(input.id);
        if (isDaily) {
          synchronizeModalPace('dailyVids', planKey);
        } else {
          const vidsWeek = document.getElementById(isPlanB ? 'input-videos-per-week-b' : 'input-videos-per-week');
          const vidsMonth = document.getElementById(isPlanB ? 'input-videos-per-month-b' : 'input-videos-per-month');
          const day = document.getElementById(isPlanB ? 'input-videos-per-day-b' : 'input-videos-per-day');
          if (day) { const d = parseFloat(day.value) || 8; if (vidsWeek) vidsWeek.value = Math.max(1, Math.round(d * 7)); if (vidsMonth) vidsMonth.value = Math.max(1, Math.round(d * 30)); }
        }
      };
    });

    switchGoalTab('plan_a');
  }

  function synchronizeModalPace(source, planKey = 'plan_a') {
    const isPlanB = (planKey === 'plan_b');
    const subSelect = document.getElementById(isPlanB ? 'select-target-subject-b' : 'select-target-subject');
    const selectedSubVal = subSelect ? subSelect.value : (isPlanB ? 'Pathology' : '');
    const modalSource = state.activeSource || 'marrow_8';
    const selectedUnits = getSelectedUnitsForPlanKey(isPlanB);
    const metrics = getMetricsForModalScope(selectedSubVal, selectedUnits, modalSource);

    const dateInput = document.getElementById(isPlanB ? 'input-target-date-b' : 'input-target-date');
    const badge = document.getElementById(isPlanB ? 'days-remaining-badge-b' : 'days-remaining-badge');
    const bannerText = document.getElementById(isPlanB ? 'smart-math-text-b' : 'smart-math-text');
    const vidsInput = document.getElementById(isPlanB ? 'input-videos-per-day-b' : 'input-videos-per-day');

    let now = new Date();
    const planObj = isPlanB ? (state.plans[1] || {}) : (state.plans[0] || {});

    if (source === 'init' || source === 'subjectChange') {
      const defaultPace = planObj.videosPerDay || 8;
      const daysNeeded = Math.ceil(metrics.remainingVideos / defaultPace);
      const targetDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = toLocalDateKey(targetDate);
    }

    let targetDate = new Date(dateInput ? dateInput.value : '2026-12-31');
    const isPast = (targetDate <= now);
    if (isNaN(targetDate.getTime()) || targetDate <= now) {
      targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    let days = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));

    if (source === 'dailyVids') {
      const userVids = Math.max(1, parseInt(vidsInput ? vidsInput.value : 1) || 1);
      days = Math.ceil(metrics.remainingVideos / userVids);
      targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = toLocalDateKey(targetDate);
    }

    if (badge) badge.textContent = `${days} Days Left`;

    const dailyVids = Math.max(1, Math.ceil(metrics.remainingVideos / days));
    const weeklyVids = dailyVids * 7;
    const monthlyVids = dailyVids * 30;

    if (source !== 'dailyVids' && vidsInput) vidsInput.value = dailyVids;
    const vidsWeekEl = document.getElementById(isPlanB ? 'input-videos-per-week-b' : 'input-videos-per-week');
    if (vidsWeekEl) vidsWeekEl.value = weeklyVids;
    const vidsMonthEl = document.getElementById(isPlanB ? 'input-videos-per-month-b' : 'input-videos-per-month');
    if (vidsMonthEl) vidsMonthEl.value = monthlyVids;

    const dateFormatted = targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (bannerText) {
      if (isPast) {
        bannerText.textContent = `⚠️ Target deadline has passed. Update daily target to auto-generate completion date.`;
      } else {
        const daysToFinish = Math.ceil(metrics.remainingVideos / dailyVids);
        const scopedNote = (metrics.scopedChapters > 0 && metrics.totalChapters > 0 && metrics.scopedChapters < metrics.totalChapters)
          ? ` (${metrics.scopedChapters} chapters)` : '';
        if (daysToFinish < days) {
          bannerText.textContent = `🎉 Comfortably Ahead! Finish ${selectedSubVal}${scopedNote} in ${daysToFinish} days.`;
        } else {
          bannerText.textContent = `🎯 Right on Track! ${dailyVids} vids/day finishes ${selectedSubVal}${scopedNote} on ${dateFormatted}.`;
        }
      }
    }
  }

  // --- Study Source Settings Modal (separate dialog from Profile → Settings) ---
  function openSourceSettingsModal() {
    const modal = document.createElement('div');
    modal.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'background:rgba(0,0,0,0.82)', 'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'box-sizing:border-box'
    ].join(';');

    const current = state.activeSource || 'marrow_8';
    const options = STUDY_SOURCES.map(s => {
      const checked = s.id === current ? 'checked' : '';
      const upcoming = !s.available ? 'upcoming' : '';
      const sub = !s.available ? 'Coming soon — syllabus data arrives in a future update.' : `Switch to the ${s.short} syllabus for all subjects, chapters & targets.`;
      return `
        <button type="button" class="obw-option ${checked} ${upcoming}" data-src="${s.id}" role="radio" aria-checked="${checked ? 'true' : 'false'}">
          <span class="obw-radio"></span>
          <span>
            <span class="obw-option-title">${s.label}</span>
            <span class="obw-option-sub" style="display:block;">${sub}</span>
          </span>
        </button>`;
    }).join('');

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 480px; width: 92%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 2px solid var(--retro-cyan, var(--accent-primary)); padding-bottom: 12px;">
          <div>
            <div style="font-family: var(--font-hud), monospace; font-size: 0.75rem; font-weight: 700; color: var(--retro-gold, var(--accent-primary)); letter-spacing: 0.08em; text-transform: uppercase;">
              <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">settings</span> SETTINGS
            </div>
            <h3 style="font-family: var(--font-display), monospace; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 2px 0 0 0; display: flex; align-items: center; gap: 8px;">
              <span class="material-symbols-outlined" style="color: var(--accent-primary);">auto_stories</span>
              <span>Study Source</span>
            </h3>
          </div>
          <button id="scs-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0 4px; line-height: 1;"><span class="material-symbols-outlined" style="font-size:20px;">close</span></button>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 6px 0; line-height: 1.5;">
          Choose which syllabus edition to plan against. The selected source drives every subject, chapter &amp; topic shown in the app.
        </p>

        <div class="obw-options" style="margin: 14px 0 8px 0;">
          ${options}
        </div>

        <div id="scs-upcoming-alert" class="obw-alert" style="display:${!STUDY_SOURCES.find(s => s.id === current)?.available ? 'flex' : 'none'};">
          <span class="material-symbols-outlined" style="font-size:16px;">info</span>
          ${getSourceLabel(current)} is an upcoming feature. Its syllabus data will be available in a future update.
        </div>

        <div class="obw-alert" style="border-color: var(--warning); background: var(--warning-bg); color: var(--warning);">
          <span class="material-symbols-outlined" style="font-size:16px;">warning</span>
          Switching source resets your study plans &amp; targets for a fresh start on the new syllabus.
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
          <button id="scs-cancel" class="v2-arcade-btn" style="height: 40px; background: var(--bg-surface-raised); color: var(--text-primary);">Cancel</button>
          <button id="scs-save" class="v2-arcade-btn" style="height: 40px; background: var(--accent-primary); color: #ffffff;">Save Source</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    modal.querySelector('#scs-close').addEventListener('click', close);
    modal.querySelector('#scs-cancel').addEventListener('click', close);

    let selected = current;
    const upcomingAlert = modal.querySelector('#scs-upcoming-alert');
    modal.querySelectorAll('.obw-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selected = opt.getAttribute('data-src');
        modal.querySelectorAll('.obw-option').forEach(o => {
          o.classList.toggle('checked', o === opt);
          o.setAttribute('aria-checked', o === opt ? 'true' : 'false');
        });
        if (upcomingAlert) upcomingAlert.style.display = !STUDY_SOURCES.find(s => s.id === selected)?.available ? 'flex' : 'none';
      });
    });

    modal.querySelector('#scs-save').addEventListener('click', () => {
      if (selected === current) { close(); return; }
      const prevSource = current;
      state.activeSource = selected;
      if (!STUDY_SOURCES.find(s => s.id === state.activeSource)?.available) {
        // Only allow if dataset exists; otherwise reject with toast.
        const hasData = SOURCE_DATA && SOURCE_DATA[selected] && SOURCE_DATA[selected].length > 0;
        if (!hasData) {
          state.activeSource = prevSource;
          showToast(getSourceLabel(selected) + ' syllabus is not available yet.', 'error', 'Source Unavailable');
          return;
        }
      }
      // Fresh setup for the new dataset
      state.plans = [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
      state.goals = { ...DEFAULT_GOALS };
      saveState();
      close();
      showToast(`Switched to ${getSourceLabel(selected)}.`, 'check_circle', 'Study Source Updated');
      updateTopbarSource();
      render();
    });
  }

  // --- Run Initialization ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
