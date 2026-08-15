/* ============================================================
   FlowMD Features — PWA Install Helper
   Owns the PWA install lifecycle: captures the beforeinstallprompt,
   tracks install state (installed / installable / not available),
   and renders the first-visit install-help banner (dashboard) plus
   the brief install guide card (Profile). One source of truth so
   no other module keeps its own deferred prompt.

   First-visit rule: a modal overlay auto-shows on the first dashboard
   render of a tab session (once per session, remembered in sessionStorage)
   until the user dismisses it or installs; dismissal persists in
   localStorage so it never nags again. Profile keeps the short guide
   + install button.
   ============================================================ */
(function () {
  'use strict';

  const DISMISS_KEY = 'flowmd_install_helper_dismissed';
  const INSTALLED_KEY = 'flowmd_pwa_installed';
  const SESSION_SHOWN_KEY = 'flowmd_install_modal_shown_session';

  let deferredPrompt = null;
  let installed = false;
  let modalShownThisSession = false;

  try {
    installed = !!(
      // Native Capacitor shell (Android APK): the WebView never fires
      // beforeinstallprompt and never reports display-mode standalone,
      // but the app IS installed — suppress the install helper entirely.
      (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
      localStorage.getItem(INSTALLED_KEY) === '1' ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    );
  } catch (_) { /* storage blocked — treated as not installed */ }

  function refreshInstallUI() {
    // NEVER re-render the whole view here. Chrome fires beforeinstallprompt
    // on first user engagement — often exactly while the user has a native
    // <select> dropdown open. A full shell.render() would destroy that
    // element mid-interaction and close the picker. Only patch the install
    // UI in place; the next view render picks up anything we didn't touch.
    const overlay = document.getElementById('pwa-install-modal-overlay');
    if (overlay) {
      if (installed) {
        overlay.remove();
      } else {
        const card = overlay.querySelector('.modal-card');
        if (card) card.innerHTML = renderInstallModalContent();
      }
      return;
    }
    const card = document.getElementById('pwa-install-profile-card');
    if (card) {
      card.outerHTML = `<div id="pwa-install-profile-card">${renderProfileInstallCard()}</div>`;
    }
  }

  function init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      refreshInstallUI();
    });
    window.addEventListener('appinstalled', () => {
      installed = true;
      deferredPrompt = null;
      try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (_) {}
      refreshInstallUI();
    });

    // Delegated wiring for the install buttons (dashboard banner + profile
    // card share the same ids) so in-place HTML swaps never lose handlers.
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-pwa-install-now')) {
        requestInstall().then((outcome) => {
          if (outcome === 'accepted') {
            if (window.FlowMD && window.FlowMD.toast) window.FlowMD.toast.showToast('Installing FlowMD PWA...', 'rocket_launch');
            if (window.FlowMD && window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('install');
          } else if (outcome === 'unavailable') {
            if (window.FlowMD && window.FlowMD.toast) window.FlowMD.toast.showToast('Tap Browser Menu (⋮) → "Install app"', 'info');
          }
        });
      } else if (e.target.closest('#btn-pwa-dismiss-banner') || e.target.closest('#btn-pwa-install-close')) {
        dismissFirstVisitBanner();
        if (window.FlowMD && window.FlowMD.toast) window.FlowMD.toast.showToast('Install helper dismissed.', 'info');
        hideInstallModal();
      } else if (e.target.closest('#pwa-install-modal-overlay') && !e.target.closest('.modal-card')) {
        // Backdrop click on the install modal counts as dismissing.
        dismissFirstVisitBanner();
        hideInstallModal();
      }
    });
  }

  function isInstalled() { return installed; }
  function isInstallable() { return !!deferredPrompt && !installed; }
  function getPrompt() { return deferredPrompt; }

  // Trigger the native install prompt. Resolves to 'accepted' |
  // 'dismissed' | 'unavailable' (no prompt captured).
  async function requestInstall() {
    if (!deferredPrompt) return 'unavailable';
    const prompt = deferredPrompt;
    deferredPrompt = null;
    try {
      prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        installed = true;
        try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (_) {}
      }
      refreshInstallUI();
      return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
    } catch (_) {
      return 'unavailable';
    }
  }

  // First-visit helper banner: show until installed or dismissed.
  function shouldShowFirstVisitBanner() {
    if (installed) return false;
    try { if (localStorage.getItem(DISMISS_KEY) === '1') return false; } catch (_) {}
    return true;
  }

  function dismissFirstVisitBanner() {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
  }

  // Auto-show the install modal once per tab session (first dashboard visit).
  function maybeShowFirstVisitModal() {
    if (installed || !shouldShowFirstVisitBanner()) return;
    if (modalShownThisSession) return;
    try { if (sessionStorage.getItem(SESSION_SHOWN_KEY) === '1') return; } catch (_) {}
    modalShownThisSession = true;
    try { sessionStorage.setItem(SESSION_SHOWN_KEY, '1'); } catch (_) {}
    showInstallModal();
  }

  function showInstallModal() {
    if (document.getElementById('pwa-install-modal-overlay')) {
      refreshInstallUI();
      return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'pwa-install-modal-overlay';
    overlay.className = 'modal-overlay active';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Install FlowMD');
    overlay.style.cssText = 'position: fixed; z-index: 99999;';
    overlay.innerHTML = `<div class="modal-card pwa-install-modal-card">${renderInstallModalContent()}</div>`;
    document.body.appendChild(overlay);
  }

  function hideInstallModal() {
    const overlay = document.getElementById('pwa-install-modal-overlay');
    if (overlay) overlay.remove();
  }

  // Modal content adapts like the old banner: native Install CTA when the
  // browser is installable, otherwise step-by-step add-to-home-screen help.
  function renderInstallModalContent() {
    if (isInstallable()) {
      return `
        <button type="button" class="pwa-install-modal-close" id="btn-pwa-install-close" aria-label="Close install dialog">×</button>
        <div class="pwa-install-modal-body">
          <div class="pwa-install-modal-icon"><svg class="material-symbols-outlined"><use href="#fmd-i-smartphone"/></svg></div>
          <h3 class="pwa-install-title">Install FlowMD</h3>
          <p class="pwa-install-desc">Full-screen app, offline access &amp; faster startup — just like a native app.</p>
          <div class="pwa-install-buttons pwa-install-modal-actions">
            <button type="button" class="v2-arcade-btn" id="btn-pwa-install-now" style="height: 40px; font-size: 0.9rem;">
              <svg class="material-symbols-outlined" style="font-size: 18px;"><use href="#fmd-i-get_app"/></svg>
              <span>Install</span>
            </button>
            <button type="button" class="v2-arcade-btn" id="btn-pwa-dismiss-banner" style="height: 40px; background: var(--bg-surface-raised); color: var(--text-secondary); font-size: 0.9rem;">Not now</button>
          </div>
        </div>`;
    }
    return `
      <button type="button" class="pwa-install-modal-close" id="btn-pwa-install-close" aria-label="Close install dialog">×</button>
      <div class="pwa-install-modal-body">
        <div class="pwa-install-modal-icon"><svg class="material-symbols-outlined"><use href="#fmd-i-add_to_home_screen"/></svg></div>
        <h3 class="pwa-install-title">Add FlowMD to your Home Screen</h3>
        <p class="pwa-install-desc">Runs full-screen, works offline, and loads faster — just like a native app.</p>
        <div class="pwa-install-steps">
          <div class="pwa-install-step">
            <svg class="material-symbols-outlined"><use href="#fmd-i-smartphone"/></svg>
            <div><strong>Android (Chrome):</strong> tap <span class="pwa-install-kbd">⋮</span> Browser Menu → <span class="pwa-install-kbd">Install app</span></div>
          </div>
          <div class="pwa-install-step">
            <svg class="material-symbols-outlined"><use href="#fmd-i-ios_share"/></svg>
            <div><strong>iPhone / iPad (Safari):</strong> tap <span class="pwa-install-kbd">Share</span> → <span class="pwa-install-kbd">Add to Home Screen</span></div>
          </div>
        </div>
        <div class="pwa-install-buttons pwa-install-modal-actions">
          <button type="button" class="v2-arcade-btn" id="btn-pwa-dismiss-banner" style="height: 40px; background: var(--bg-surface-raised); color: var(--text-secondary); font-size: 0.9rem;">Got it</button>
        </div>
      </div>`;
  }

  // Adaptive dashboard banner: native Install button when the browser
  // supports it (Android Chrome / desktop), otherwise step-by-step help
  // (iOS Safari, where beforeinstallprompt never fires).
  function renderFirstVisitBanner() {
    if (isInstallable()) {
      return `
        <div id="pwa-install-banner-card" class="v2-pixel-card pwa-install-banner">
          <div class="pwa-install-banner-content">
            <div class="pwa-install-text">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span class="v2-hud-badge"><svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-smartphone"/></svg> INSTALL APP</span>
              </div>
              <h3 class="pwa-install-title">Install FlowMD</h3>
              <p class="pwa-install-desc">Full-screen app, offline access &amp; faster startup.</p>
            </div>
            <div class="pwa-install-buttons">
              <button type="button" class="v2-arcade-btn" id="btn-pwa-install-now" style="height: 38px; font-size: 0.88rem;">
                <svg class="material-symbols-outlined" style="font-size: 18px;"><use href="#fmd-i-get_app"/></svg>
                <span>Install</span>
              </button>
              <button type="button" class="v2-arcade-btn" id="btn-pwa-dismiss-banner" style="height: 38px; background: var(--bg-surface-raised); color: var(--text-secondary); font-size: 0.88rem;">Dismiss</button>
            </div>
          </div>
        </div>`;
    }
    return `
      <div id="pwa-install-banner-card" class="v2-pixel-card pwa-install-banner">
        <div class="pwa-install-banner-content" style="align-items: flex-start;">
          <div class="pwa-install-text">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span class="v2-hud-badge"><svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-add_to_home_screen"/></svg> INSTALL HELP</span>
            </div>
            <h3 class="pwa-install-title">Add FlowMD to your Home Screen</h3>
            <p class="pwa-install-desc">Runs full-screen, works offline, and loads faster — just like a native app.</p>
            <div class="pwa-install-steps">
              <div class="pwa-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-smartphone"/></svg>
                <div><strong>Android (Chrome):</strong> tap <span class="pwa-install-kbd">⋮</span> Browser Menu → <span class="pwa-install-kbd">Install app</span> (or "Add to Home screen")</div>
              </div>
              <div class="pwa-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-ios_share"/></svg>
                <div><strong>iPhone / iPad (Safari):</strong> tap <span class="pwa-install-kbd">Share</span> → <span class="pwa-install-kbd">Add to Home Screen</span></div>
              </div>
            </div>
          </div>
          <div class="pwa-install-buttons">
            <button type="button" class="v2-arcade-btn" id="btn-pwa-dismiss-banner" style="height: 38px; background: var(--bg-surface-raised); color: var(--text-secondary); font-size: 0.88rem;">Got it</button>
          </div>
        </div>
      </div>`;
  }

  // Brief guide for the Profile view (always reachable, never nagging).
  // Wrapped in a stable id so install-state changes can patch it in place
  // without re-rendering the whole Profile view.
  function renderProfileInstallCard() {
    if (installed) {
      return `<div id="pwa-install-profile-card"><div class="profile-install-status installed">
        <svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg>
        FlowMD is installed — enjoy full-screen offline access!
      </div></div>`;
    }
    if (isInstallable()) {
      return `<div id="pwa-install-profile-card">
        <button class="v2-arcade-btn" id="btn-pwa-install-now" style="width: 100%;">
          <svg class="material-symbols-outlined"><use href="#fmd-i-get_app"/></svg> Install FlowMD App
        </button>
      </div>`;
    }
    return `<div id="pwa-install-profile-card">
      <div class="pwa-install-steps">
        <div class="pwa-install-step">
          <svg class="material-symbols-outlined"><use href="#fmd-i-smartphone"/></svg>
          <div><strong>Android (Chrome):</strong> Browser Menu <span class="pwa-install-kbd">⋮</span> → <span class="pwa-install-kbd">Install app</span></div>
        </div>
        <div class="pwa-install-step">
          <svg class="material-symbols-outlined"><use href="#fmd-i-ios_share"/></svg>
          <div><strong>iPhone (Safari):</strong> tap <span class="pwa-install-kbd">Share</span> → <span class="pwa-install-kbd">Add to Home Screen</span></div>
        </div>
      </div>
    </div>`;
  }

  window.FlowMD.pwaInstall = {
    init,
    isInstalled,
    isInstallable,
    getPrompt,
    requestInstall,
    shouldShowFirstVisitBanner,
    dismissFirstVisitBanner,
    renderFirstVisitBanner,
    renderProfileInstallCard,
    maybeShowFirstVisitModal,
    showInstallModal,
    hideInstallModal
  };
})();
