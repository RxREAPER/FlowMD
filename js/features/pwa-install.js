/* ============================================================
   FlowMD Features — PWA Install Helper
   Owns the PWA install lifecycle: captures the beforeinstallprompt,
   tracks install state (installed / installable / not available),
   and renders the first-visit install-help banner (dashboard) plus
   the brief install guide card (Profile). One source of truth so
   no other module keeps its own deferred prompt.

   First-visit rule: the helper banner shows until the user dismisses
   it or installs; dismissal persists in localStorage so it never
   nags again (Profile keeps the short guide + install button).
   ============================================================ */
(function () {
  'use strict';

  const DISMISS_KEY = 'flowmd_install_helper_dismissed';
  const INSTALLED_KEY = 'flowmd_pwa_installed';

  let deferredPrompt = null;
  let installed = false;

  try {
    installed = localStorage.getItem(INSTALLED_KEY) === '1' ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  } catch (_) { /* storage blocked — treated as not installed */ }

  function notifyChanged() {
    // Re-render so banners appear/disappear when install state changes.
    if (window.FlowMD && window.FlowMD.shell && typeof window.FlowMD.shell.render === 'function') {
      window.FlowMD.shell.render();
    }
  }

  function init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      notifyChanged();
    });
    window.addEventListener('appinstalled', () => {
      installed = true;
      deferredPrompt = null;
      try { localStorage.setItem(INSTALLED_KEY, '1'); } catch (_) {}
      notifyChanged();
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
      notifyChanged();
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
                <span class="v2-hud-badge"><span class="material-symbols-outlined" style="font-size:16px;">smartphone</span> INSTALL APP</span>
              </div>
              <h3 class="pwa-install-title">Install FlowMD</h3>
              <p class="pwa-install-desc">Full-screen app, offline access &amp; faster startup.</p>
            </div>
            <div class="pwa-install-buttons">
              <button type="button" class="v2-arcade-btn" id="btn-pwa-install-now" style="height: 38px; font-size: 0.88rem;">
                <span class="material-symbols-outlined" style="font-size: 18px;">get_app</span>
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
              <span class="v2-hud-badge"><span class="material-symbols-outlined" style="font-size:16px;">add_to_home_screen</span> INSTALL HELP</span>
            </div>
            <h3 class="pwa-install-title">Add FlowMD to your Home Screen</h3>
            <p class="pwa-install-desc">Runs full-screen, works offline, and loads faster — just like a native app.</p>
            <div class="pwa-install-steps">
              <div class="pwa-install-step">
                <span class="material-symbols-outlined">smartphone</span>
                <div><strong>Android (Chrome):</strong> tap <span class="pwa-install-kbd">⋮</span> Browser Menu → <span class="pwa-install-kbd">Install app</span> (or "Add to Home screen")</div>
              </div>
              <div class="pwa-install-step">
                <span class="material-symbols-outlined">ios_share</span>
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
  function renderProfileInstallCard() {
    if (installed) {
      return `<div class="profile-install-status installed">
        <span class="material-symbols-outlined">check_circle</span>
        FlowMD is installed — enjoy full-screen offline access!
      </div>`;
    }
    if (isInstallable()) {
      return `
        <button class="v2-arcade-btn" id="btn-pwa-install-now" style="width: 100%;">
          <span class="material-symbols-outlined">get_app</span> Install FlowMD App
        </button>`;
    }
    return `
      <div class="pwa-install-steps">
        <div class="pwa-install-step">
          <span class="material-symbols-outlined">smartphone</span>
          <div><strong>Android (Chrome):</strong> Browser Menu <span class="pwa-install-kbd">⋮</span> → <span class="pwa-install-kbd">Install app</span></div>
        </div>
        <div class="pwa-install-step">
          <span class="material-symbols-outlined">ios_share</span>
          <div><strong>iPhone (Safari):</strong> tap <span class="pwa-install-kbd">Share</span> → <span class="pwa-install-kbd">Add to Home Screen</span></div>
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
    renderProfileInstallCard
  };
})();
