/* ============================================================
   FlowMD Features — Profile View
   Renders the Account & Profile view (doctor name, study source,
   data safety, backup export/import, install, support, data
   reset) plus the profile bottom sheet controller opened from
   the topbar avatar.

   Cloud-sync UI was removed for the offline-first launch; the
   sync stack is preserved dormant in the repo (see
   plan/feature-offline-first-launch-1.md). Backup lives in
   js/features/backup.js and is wired here.

   Extracted from app.js (2026-08-10); signature adapted to
   receive the shell DOM cache (renderProfileView(dom, stats),
   openProfileBottomSheet(dom)). The bottom-sheet elements
   (bottomSheetOverlay/bottomSheetContent) live in the static DOM
   cache built once by the shell at init.
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState } = window.FlowMD.store;
  const { getSourceLabel } = window.FlowMD.sourceData;
  const { escapeHtml, escapeAttr } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;
  const { focusStudyPlanConfig } = window.FlowMD.planConfig;
  const { openSourceSettingsModal } = window.FlowMD.sourceSettings;
  const pwaInstall = window.FlowMD.pwaInstall;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  // --- View 6: Profile View ---
  function renderProfileView(dom, stats) {
    DOM = dom;
    const docName = state.personal.doctorName || 'Dr. Aspirant';

    DOM.appMain.innerHTML = `
      <div class="fm-breadcrumb">
        <span class="fm-breadcrumb-item nav-bc-home">Home</span>
        <span class="fm-breadcrumb-separator">&gt;</span>
        <span class="fm-breadcrumb-item active">Account & Profile</span>
      </div>

      <div class="section-title-row">
        <h2 class="section-title" style="font-family: var(--font-display);">Account & Profile</h2>
      </div>

      <div class="v2-pixel-card" style="padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div class="fm-avatar fm-avatar-lg fm-avatar-cyan">
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
          <svg class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;"><use href="#fmd-i-settings"/></svg>
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
            <svg class="material-symbols-outlined" style="font-size: 18px;"><use href="#fmd-i-swap_horiz"/></svg> Change
          </button>
        </div>
        <div class="profile-settings-hint">Switching source changes the syllabus, targets &amp; focus chapters shown in the app.</div>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px; border-left: 4px solid #f59e0b;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="material-symbols-outlined" style="color: #f59e0b; font-size: 20px;"><use href="#fmd-i-phone_iphone"/></svg>
          Your data lives on this device
        </h3>
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
          Progress is stored only on this device — no account, nothing uploaded.
          Clearing browser data or uninstalling the app erases it, so export a backup below.
        </p>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;"><use href="#fmd-i-backup"/></svg>
          Backup
        </h3>
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 12px 0;">
          Save your progress to a file and restore it on a new device. Backups stay importable across future app versions.
        </p>
        ${state.lastBackupAt ? `
          <div class="profile-settings-hint" style="margin-bottom: 12px; font-size: 0.8rem;">Last backup: ${fmtClock(state.lastBackupAt)}</div>
        ` : ''}
        <button class="v2-arcade-btn" id="btn-export-backup" style="width: 100%; margin-bottom: 8px;">
          <svg class="material-symbols-outlined"><use href="#fmd-i-download"/></svg> Export Backup
        </button>
        <button class="v2-arcade-btn" id="btn-import-backup" style="width: 100%;">
          <svg class="material-symbols-outlined"><use href="#fmd-i-upload"/></svg> Import Backup
        </button>
        <input type="file" id="backup-file-input" accept="application/json,.json" style="display: none;">
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;"><use href="#fmd-i-cloud_sync"/></svg>
          Cloud Sync
        </h3>
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 0.85rem; color: var(--text-muted); margin: 0;">
          Cloud sync is coming soon. For now, move between devices with Export / Import above.
        </p>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="material-symbols-outlined" style="color: var(--text-secondary); font-size: 20px;"><use href="#fmd-i-install_mobile"/></svg>
          Install App
        </h3>
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 12px 0;">
          Use FlowMD like a native app — installs to your home screen, runs full-screen and works offline.
        </p>
        ${pwaInstall ? pwaInstall.renderProfileInstallCard() : ''}
      </div>

      <div class="v2-pixel-card support-card" style="padding: 18px; margin-bottom: 24px; border-left: 4px solid var(--accent-primary);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <svg class="material-symbols-outlined" style="color: var(--accent-primary); font-size: 20px;"><use href="#fmd-i-support_agent"/></svg>
          <h3 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; margin: 0;">Developer Support & Contact</h3>
        </div>
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 14px 0;">
          Need help or have a question? Click below to reveal the developer contact email.
        </p>
        <button class="v2-arcade-btn" id="btn-show-support-email" style="height: 38px; width: 100%;">
          <svg class="material-symbols-outlined"><use href="#fmd-i-mail"/></svg> Show Contact Email
        </button>
        <div id="hidden-support-email" class="support-email-reveal" style="display: none; margin-top: 16px;">
          <div class="support-email-inner">
            <span class="support-email-text">ezioauditore9553@gmail.com</span>
            <button class="v2-arcade-btn" id="btn-copy-support-email" style="height: 32px; padding: 0 12px; font-size: 0.78rem;">
              <svg class="material-symbols-outlined" style="font-size: 16px;"><use href="#fmd-i-content_copy"/></svg> Copy
            </button>
          </div>
        </div>
        <div class="profile-legal-links">
          <a href="privacy.html">Privacy Policy</a>
          <a href="terms.html">Terms of Use</a>
          <a href="https://github.com/mohammedsafi0414/FlowMD" rel="noopener noreferrer">Source Code</a>
        </div>
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Data Management</h3>
        <button class="v2-arcade-btn" id="btn-reset-data" style="width: 100%; background: var(--danger);">
          <svg class="material-symbols-outlined"><use href="#fmd-i-delete_forever"/></svg> Reset All App Data
        </button>
      </div>
    `;

    document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.personal.doctorName = document.getElementById('prof-doc-name').value || 'Dr. Aspirant';
      saveState();
      showToast('Profile updated!', 'check_circle');
      if (window.FlowMD.shell) window.FlowMD.shell.render();
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all app progress and targets? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
      }
    });

    document.getElementById('btn-change-source')?.addEventListener('click', openSourceSettingsModal);

    document.getElementById('btn-export-backup')?.addEventListener('click', async () => {
      if (window.FlowMD.backup && window.FlowMD.backup.exportBackup) {
        const ok = await window.FlowMD.backup.exportBackup();
        if (ok) {
          state.lastBackupAt = Date.now();
          saveState();
          showToast('Backup exported!', 'check_circle');
        }
      }
    });

    document.getElementById('btn-import-backup')?.addEventListener('click', () => {
      document.getElementById('backup-file-input')?.click();
    });

    document.getElementById('backup-file-input')?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (window.FlowMD.backup && window.FlowMD.backup.importBackup) {
        const result = await window.FlowMD.backup.importBackup(file);
        if (result && result.ok) {
          showToast(result.message || 'Backup restored!', 'check_circle');
          if (window.FlowMD.shell) window.FlowMD.shell.render();
        } else {
          showToast((result && result.error) || 'Import failed.', 'error');
        }
      }
      e.target.value = '';
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

  // --- Human-readable clock for the last-backup line ---
  function fmtClock(ms) {
    if (!ms) return 'never';
    const diff = Date.now() - ms;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    const d = new Date(ms);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
      ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // --- Profile Bottom Sheet Controller ---
  function openProfileBottomSheet(dom) {
    DOM = dom;
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const initials = (docName.replace(/^Dr\.?\s*/i, '').trim().slice(0, 2) || 'DA').toUpperCase();

    DOM.bottomSheetContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div class="fm-avatar fm-avatar-lg fm-avatar-cyan" style="margin: 0 auto 8px auto;">
          ${escapeHtml(initials)}
        </div>
        <div style="font-family: var(--font-display); font-weight: 700; font-size: 1.15rem;">${escapeHtml(docName)}</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="v2-arcade-btn" id="bs-btn-view-profile" style="width: 100%; justify-content: flex-start;">
          <svg class="material-symbols-outlined"><use href="#fmd-i-person"/></svg> View Full Profile & Settings
        </button>
        <button class="v2-arcade-btn" id="bs-btn-view-goals" style="width: 100%; justify-content: flex-start;">
          <svg class="material-symbols-outlined"><use href="#fmd-i-tune"/></svg> Synchronize Pace & Goals
        </button>
      </div>
    `;

    DOM.bottomSheetOverlay.classList.add('active');

    document.getElementById('bs-btn-view-profile')?.addEventListener('click', () => {
      closeBottomSheet();
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('profile');
    });

    document.getElementById('bs-btn-view-goals')?.addEventListener('click', () => {
      closeBottomSheet();
      focusStudyPlanConfig();
    });
  }

  function closeBottomSheet() {
    if (DOM.bottomSheetOverlay) DOM.bottomSheetOverlay.classList.remove('active');
  }


  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderProfileView,
    openProfileBottomSheet,
    closeBottomSheet
  });
})();
