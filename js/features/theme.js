/* ============================================================
   FlowMD Features — Theme & Topbar Chrome
   Theme application (data-theme / data-theme-style attributes),
   topbar initials/source-badge/offline updates, and the edition
   chip. Self-contained DOM queries — no shell DOM cache.

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { getState } = window.FlowMD.store;
  const { getSourceLabel, getEditionShort } = window.FlowMD.sourceData;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // --- Theme Helper ---
  function applyTheme(theme, themeStyle) {
    const curTheme = theme || state.theme || 'dark';
    const curStyle = themeStyle || state.themeStyle || 'modern';

    document.documentElement.setAttribute('data-theme', curTheme);
    document.documentElement.setAttribute('data-theme-accent', 'cobalt');
    document.documentElement.setAttribute('data-theme-style', curStyle);
  }

  function updateTopbarInitials() {
    const docName = (state.personal && state.personal.doctorName) ? state.personal.doctorName : 'Dr. Aspirant';
    const cleanName = docName.replace(/^Dr\.?\s*/i, '').trim();
    const initials = cleanName.length >= 2 ? (cleanName.charAt(0) + cleanName.charAt(1)).toUpperCase() : (cleanName.charAt(0) || 'A').toUpperCase();

    const initialsElem = document.getElementById('topbar-avatar-initials');
    if (initialsElem) {
      initialsElem.textContent = initials;
    }

    const avatarBox = document.getElementById('topbar-user-profile');
    if (avatarBox) {
      avatarBox.className = `fm-avatar fm-avatar-sm fm-avatar-cyan`;
    }
  }

  // --- Active Edition visibility helpers ---
  function renderEditionChip() {
    return `
      <button type="button" class="edition-chip btn-open-source-settings" title="Current study edition — tap to change">
        <span class="material-symbols-outlined" style="font-size:15px;">auto_stories</span>
        <span>${getEditionShort()}</span>
      </button>`;
  }

  function updateTopbarSource() {
    const badge = document.getElementById('topbar-source-badge');
    if (!badge) return;
    const textEl = badge.querySelector('.edition-badge-text');
    if (textEl) textEl.textContent = getEditionShort();
    badge.title = 'Study Source: ' + getSourceLabel(state.activeSource || 'marrow_8') + ' \u2014 tap to change';
    updateOfflineIndicator();
  }

  function updateOfflineIndicator() {
    const indicator = document.getElementById('topbar-offline-indicator');
    if (!indicator) return;
    if (state.isOffline) {
      indicator.style.display = 'flex';
    } else {
      indicator.style.display = 'none';
    }
  }

  // Expose
  window.FlowMD.theme = {
    applyTheme,
    updateTopbarInitials,
    updateTopbarSource,
    updateOfflineIndicator,
    renderEditionChip
  };
})();
