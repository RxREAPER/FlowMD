/* ============================================================
   FlowMD Features — Profile View
   Renders the Account & Profile view (doctor name, study source,
   Google Cloud Sync, support, data reset) plus the profile bottom
   sheet controller opened from the topbar avatar.

   Extracted verbatim from app.js (2026-08-10); signature adapted
   to receive the shell DOM cache (renderProfileView(dom, stats),
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

  // --- View 6: Profile View (simplified) ---
  function renderProfileView(dom, stats) {
    DOM = dom;
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';

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

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Google Cloud Sync</h3>
        ${isSynced ? `
          <div style="display: flex; align-items: center; gap: 8px; color: var(--success); font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 1.05rem; margin-bottom: 12px;">
            <svg class="material-symbols-outlined"><use href="#fmd-i-cloud_done"/></svg>
            Synced as ${syncEmail}
          </div>
          <div class="profile-settings-hint" style="margin-bottom: 12px; font-size: 0.8rem;">
            Changes on this device save automatically; press Sync Now to pull changes made on your other devices and push yours. Works offline.
          </div>
          <button class="v2-arcade-btn" id="btn-sync-now" style="width: 100%; margin-bottom: 8px;">
            <svg class="material-symbols-outlined"><use href="#fmd-i-sync"/></svg> Sync Now
          </button>
          <div id="sync-diagnostics-panel"></div>
          <button class="v2-arcade-btn" id="btn-signout-google" style="width: 100%; background: var(--danger);">Sign Out of Cloud Sync</button>
        ` : `
          <p style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Sign in with Google to backup your progress.</p>
          <div class="profile-settings-hint" style="margin-bottom: 12px; font-size: 0.8rem;">
            Backs up completions, streaks, plans &amp; preferences; press Sync Now to share changes across devices.
          </div>
          <div class="profile-settings-hint" style="font-size: 0.72rem;">
            Sync Diagnostics (per-field clocks &amp; last-sync result) appear here after you sign in.
          </div>
          <button class="v2-arcade-btn" id="btn-signin-google" style="width: 100%;">
            <svg class="material-symbols-outlined"><use href="#fmd-i-cloud_sync"/></svg> Sign In with Google
          </button>
        `}
      </div>

      <div class="v2-pixel-card" style="padding: 18px; margin-bottom: 16px;">
        <h3 style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg class="material-symbols-outlined" style="font-size: 18px; color: var(--accent-primary);"><use href="#fmd-i-verified"/></svg>
          Device Layout Check
        </h3>
        <div class="profile-settings-hint" id="layout-check-summary" style="font-size: 0.8rem;">Checking…</div>
        <div class="profile-settings-hint" style="font-size: 0.72rem; margin-top: 4px;">
          FlowMD checks this device's screen for boxes that overflow or text that gets clipped. If an issue appears here, it is reported in the browser console with details.
        </div>
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

    document.getElementById('btn-signin-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        try {
          await window.FirebaseSync.signInWithGoogle();
        } catch (e) {
          showToast('Sign in failed.', 'error');
        }
      }
    });

    document.getElementById('btn-sync-now')?.addEventListener('click', async () => {
      if (window.FlowMD.sync && window.FlowMD.sync.manualSync) {
        await window.FlowMD.sync.manualSync();
      }
    });

    document.getElementById('btn-signout-google')?.addEventListener('click', async () => {
      if (window.FirebaseSync) {
        await window.FirebaseSync.signOutUser();
        showToast('Signed out.', 'info');
        renderProfileView(DOM, stats);
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

    // Fill the diagnostics panel with live local-vs-cloud arbitration data.
    if (isSynced) renderSyncDiagnostics();

    // Device layout self-check summary (last run in this browser).
    const layoutSummary = document.getElementById('layout-check-summary');
    if (layoutSummary && window.FlowMD.layoutCheck && window.FlowMD.layoutCheck.getLastReport) {
      const last = window.FlowMD.layoutCheck.getLastReport();
      if (last) {
        layoutSummary.textContent = last.clean ? 'No issues detected on this device ✓' : 'Issues detected — see browser console for details';
        layoutSummary.style.color = last.clean ? 'var(--success)' : 'var(--danger)';
      } else {
        layoutSummary.textContent = 'No issues detected on this device';
      }
    }
  }

  // --- Sync Diagnostics Panel ---
  // Shows each cloud field's local vs cloud clock, which side wins the next
  // sync, and the last sync / auto-save result — arbitration made visible.
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

  async function renderSyncDiagnostics() {
    const panel = document.getElementById('sync-diagnostics-panel');
    if (!panel) return;
    const uid = window.FirebaseSync && window.FirebaseSync.currentUser
      ? window.FirebaseSync.currentUser.uid
      : null;
    let cloudState = null;
    let cloudFresh = false;
    if (uid && window.FlowMD.sync && window.FlowMD.sync.fetchCloudState) {
      try {
        cloudState = await window.FlowMD.sync.fetchCloudState(uid);
        cloudFresh = true;
      } catch (e) {
        cloudState = null; // offline / read error — fall through to last-known
      }
    }
    // Live read failed (offline): fall back to the last-known cloud clocks
    // from the most recent successful pull so the table still has meaning.
    if (!cloudState && state._cloudSyncTimes) {
      cloudState = { fieldSyncTimes: state._cloudSyncTimes };
    }
    if (!window.FlowMD.sync || !window.FlowMD.sync.buildSyncDiagnostics) {
      panel.innerHTML = '';
      return;
    }
    const report = window.FlowMD.sync.buildSyncDiagnostics(state, cloudState, state.syncDiagnostics);
    const d = state.syncDiagnostics || {};

    const verdictBadge = (v) => {
      switch (v) {
        case 'LOCAL': return '<span class="sync-diag-badge sync-diag-local">LOCAL</span>';
        case 'CLOUD': return '<span class="sync-diag-badge sync-diag-cloud">CLOUD</span>';
        case 'TIE': return '<span class="sync-diag-badge sync-diag-tie">TIE</span>';
        case 'UNION': return '<span class="sync-diag-badge sync-diag-union">UNION</span>';
        default: return '<span class="sync-diag-badge sync-diag-none">—</span>';
      }
    };

    let statusHtml = '';
    if (d.lastSync) {
      if (d.lastSync.status === 'failed') {
        statusHtml = `<div class="sync-diag-status sync-diag-fail">Last sync failed ${fmtClock(d.lastSync.at)} — ${escapeHtml(d.lastSync.error || 'unknown error')}</div>`;
      } else {
        const pushed = d.lastSync.pushed && d.lastSync.pushed.length ? ' · pushed: ' + d.lastSync.pushed.join(', ') : '';
        const pulled = d.lastSync.pulled && d.lastSync.pulled.length ? ' · pulled: ' + d.lastSync.pulled.join(', ') : '';
        statusHtml = `<div class="sync-diag-status sync-diag-ok">Last sync ${fmtClock(d.lastSync.at)} — ${escapeHtml(d.lastSync.message || 'ok')}${escapeHtml(pushed)}${escapeHtml(pulled)}</div>`;
      }
    }
    if (d.autoPush) {
      if (d.autoPush.ok) {
        statusHtml += `<div class="sync-diag-status sync-diag-ok">Auto-save ${fmtClock(d.autoPush.at)} — ${d.autoPush.pushed.length ? 'pushed ' + d.autoPush.pushed.join(', ') : 'no changes'}</div>`;
      } else {
        statusHtml += `<div class="sync-diag-status sync-diag-fail">Auto-save failed ${fmtClock(d.autoPush.at)} — ${escapeHtml(d.autoPush.error || 'unknown error')}</div>`;
      }
    }
    if (!statusHtml) statusHtml = '<div class="sync-diag-status">No sync yet — press Sync Now to see arbitration</div>';

    const rowsHtml = report.rows.length
      ? report.rows.map(r => `
        <tr>
          <td class="sync-diag-field">${escapeHtml(r.field)}<div class="sync-diag-val">${escapeHtml(r.localValue)}${r.cloudValue !== r.localValue ? '<br>cloud: ' + escapeHtml(r.cloudValue) : ''}</div></td>
          <td>${fmtClock(r.localClock)}</td>
          <td>${fmtClock(r.cloudClock)}</td>
          <td>${verdictBadge(r.verdict)}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="sync-diag-empty">No arbitrated fields yet — edit something, then press Sync Now.</td></tr>';

    panel.innerHTML = `
      <div class="sync-diag">
        <div class="sync-diag-head">
          <div class="sync-diag-title">Sync Diagnostics</div>
          <button type="button" class="v2-arcade-btn" id="btn-refresh-sync-diag" style="height: 30px; padding: 0 10px; font-size: 0.75rem;">Refresh</button>
        </div>
        ${cloudFresh ? '' : '<div class="sync-diag-status sync-diag-warn">Offline or cloud read failed — showing last-known cloud clocks.</div>'}
        ${statusHtml}
        <table class="sync-diag-table">
          <thead><tr><th>Field</th><th>Local clock</th><th>Cloud clock</th><th>Wins</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="sync-diag-legend">
          <b>Wins</b> = which side the next sync trusts: <span class="sync-diag-badge sync-diag-local">LOCAL</span> this device is newer · <span class="sync-diag-badge sync-diag-cloud">CLOUD</span> another device is newer · <span class="sync-diag-badge sync-diag-union">UNION</span> both sides merge (completions)
        </div>
      </div>
    `;

    document.getElementById('btn-refresh-sync-diag')?.addEventListener('click', renderSyncDiagnostics);
  }

  // --- Profile Bottom Sheet Controller ---
  function openProfileBottomSheet(dom) {
    DOM = dom;
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const isSynced = state.personal.isSynced;
    const syncEmail = state.personal.syncEmail || '';
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
        ${isSynced ? `
          <button class="v2-arcade-btn" id="bs-btn-logout" style="width: 100%; justify-content: flex-start; background: var(--danger);">
            <svg class="material-symbols-outlined"><use href="#fmd-i-logout"/></svg> Sign Out (${escapeHtml(syncEmail)})
          </button>
        ` : `
          <button class="v2-arcade-btn" id="bs-btn-login" style="width: 100%; justify-content: flex-start;">
            <svg class="material-symbols-outlined"><use href="#fmd-i-cloud_sync"/></svg> Sign In with Google
          </button>
        `}
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
        if (window.FlowMD.shell) window.FlowMD.shell.render();
      }
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
