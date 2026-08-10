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

  const { renderDashboardView, renderCurriculumView, renderSubjectDetailView, renderAnalyticsView } = window.FlowMD.views;

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
    else if (state.currentView === 'curriculum') safeRender(() => renderCurriculumView(DOM, stats), 'curriculum', stats);
    else if (state.currentView === 'subject_detail') safeRender(() => renderSubjectDetailView(DOM, stats), 'subject_detail', stats);
    else if (state.currentView === 'analytics') safeRender(() => renderAnalyticsView(DOM, stats), 'analytics', stats);
    else safeRender(renderProfileView, 'profile', stats);
  }

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
