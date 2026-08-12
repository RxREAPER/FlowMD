/* ============================================================
   FLOWMD V2 — MODULAR PRESENTATION LAYER
   Cohesive Pixel-Art Design System, Arcade Controls, & HUD Meters
   Complete Redesign of Presentation Layer while preserving 100% logic parity
   ============================================================ */

(function () {
  'use strict';

  // --- Imported leaf modules (js/core/*, js/features/*) ---
  // Only what the shell itself consumes — feature modules pull their own
  // dependencies from window.FlowMD.* directly (decomposition, 2026-08).
  const {
    FLOWMD_ICONS,
    escapeHtml
  } = window.FlowMD.constants;

  const {
    getState,
    loadState,
    saveState,
    snapshotCloudState
  } = window.FlowMD.store;

  const { showToast } = window.FlowMD.toast;

  const { initSourceData } = window.FlowMD.sourceData;

  const { getSyllabusStats } = window.FlowMD.metrics;

  const {
    applyTheme,
    updateTopbarInitials,
    updateTopbarSource
  } = window.FlowMD.theme;

  const {
    openSpotlightModal,
    closeSpotlightModal,
    renderSpotlightResults
  } = window.FlowMD.search;

  const { initFirebaseSync, manualSync } = window.FlowMD.sync;

  const { openSourceSettingsModal } = window.FlowMD.sourceSettings;

  const { renderDashboardView, renderCurriculumView, renderSubjectDetailView, renderAnalyticsView, renderProfileView, openProfileBottomSheet, closeBottomSheet } = window.FlowMD.views;

  // --- App State ---
  // Shared state object — owned by js/core/state-store.js
  const state = getState();

  const DOM = {};

  // --- Initialization ---
  function init() {
    initSourceData();
    loadState();
    // Baseline for field-level cloud writes: only changes made after load are
    // ever pushed, so a fresh sign-in doesn't re-upload the whole state.
    state._prevSyncedState = snapshotCloudState(state);
    state._dirtyFields = [];
    if (window.FirebaseSync) {
      window.FirebaseSync.stateProvider = () => state;
    }
    // Lazy-load the active syllabus if it isn't part of the initial page load
    // (e.g., a returning marrow_6_5 user whose data file is no longer eager).
    if (window.FlowMD.sourceData && window.FlowMD.sourceData.loadSourceScript) {
      window.FlowMD.sourceData.loadSourceScript(state.activeSource)
        .then(() => { if (typeof render === 'function') render(); })
        .catch(() => {
          // Never leave the user on a silent empty dashboard.
          showToast('Could not load syllabus data. Check your connection and reload.', 'error', 'Data Sync');
        });
    }
    cacheDOM();
    applyTheme(state.theme);
    if (window.FlowMD.icons) window.FlowMD.icons.ensureSprite();
    bindEvents();
    initFirebaseSync();
    initServiceWorker();
    if (window.FlowMD.pwaInstall) window.FlowMD.pwaInstall.init();
    render();
    resetPageScrollTop();
  }

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

    titleEl.innerHTML = `<svg class="material-symbols-outlined"><use href="#fmd-i-help"/></svg> <span style="font-family: var(--font-display);">${title}</span>`;
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
      DOM.topbarUserProfile.addEventListener('click', () => openProfileBottomSheet(DOM));
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
             <div class="fm-alert fm-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
               <svg class="material-symbols-outlined fm-alert-icon"><use href="#fmd-i-check_circle"/></svg>
               <div class="fm-alert-content">
                 <div class="fm-alert-title">Dynamic Real-Time Shifting</div>
                 <div class="fm-alert-message">This ETA dynamically adjusts as you complete videos or change daily pace target in Profile settings.</div>
               </div>
             </div>`
          );
        } else if (type === 'ideal-actual') {
          openInfoModal(
            'Ideal vs Actual Schedule Delta',
            `<p style="margin-bottom: 8px;"><strong>Schedule Delta:</strong> Compares actual 7-day completed lectures against your target quota (Daily Target × 7).</p>
             <div class="fm-alert fm-alert-warning" style="margin: 10px 0 0 0; padding: 12px;">
               <svg class="material-symbols-outlined fm-alert-icon"><use href="#fmd-i-warning"/></svg>
               <div class="fm-alert-content">
                 <div class="fm-alert-title">Automatic Schedule Recovery</div>
                 <div class="fm-alert-message">When behind pace, FlowMD calculates exact extra daily videos needed to recover without burn-out.</div>
               </div>
             </div>`
          );
        } else if (type === 'action-queue') {
          openInfoModal("Today's Action Queue",
            `<p style="margin-bottom: 8px;"><strong>Daily Video:</strong> Shows your next video to watch.</p>
              <div class="fm-alert fm-alert-success" style="margin: 10px 0 0 0; padding: 12px;">
                <svg class="material-symbols-outlined fm-alert-icon"><use href="#fmd-i-rocket_launch"/></svg>
                <div class="fm-alert-content">
                  <div class="fm-alert-title">Load Next Video</div>
                  <div class="fm-alert-message">Completing a video unlocks <svg class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;"><use href="#fmd-i-rocket_launch"/></svg> Load Next Video to continue your progress.</div>
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
    if (window.FirebaseSync && window.FirebaseSync.trackEvent) {
      window.FirebaseSync.trackEvent('screen_view', { screen_name: viewName });
    }
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
        DOM.appMain.innerHTML = '<div class="fm-card" style="padding:24px;text-align:center;">' +
          '<div class="fm-icon" style="color:#ef4444;margin:0 auto 12px;">' + escapeHtml(FLOWMD_ICONS.exclamation || '') + '</div>' +
          '<h3>Something went wrong</h3>' +
          '<p class="fm-text-muted" style="margin-top:8px;">' + escapeHtml(e.message || 'Unknown error') + '</p>' +
          '<button class="fm-btn fm-btn-primary" style="margin-top:16px;" onclick="location.reload()">Reload App</button>' +
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
    else safeRender(() => renderProfileView(DOM, stats), 'profile', stats);
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
