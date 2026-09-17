/* ============================================================
   FlowMD Features — First-Run Onboarding Wizard
   3-step wizard: study source → name/theme → install PWA.
   Step 3 is a full-screen install prompt (Android native prompt
   when available, iOS Add-to-Home-Screen guide otherwise) with a
   small skip option — installing early means users keep the app
   (issue #11).

   The sign-in / cloud-sync step was removed for the offline-first
   launch (see plan/feature-offline-first-launch-1.md); the sync
   stack is preserved dormant in the repo.
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState } = window.FlowMD.store;
  const { applyTheme } = window.FlowMD.theme;
  const { showToast } = window.FlowMD.toast;
  const { getSourceLabel } = window.FlowMD.sourceData;
  const { STUDY_SOURCES, escapeHtml, escapeAttr, LEGACY_DEFAULT_DOCTOR_NAME } = window.FlowMD.constants;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // --- Onboarding Wizard ---
  let onboardingStep = 0;
  let onboardingSource = 'marrow_8';
  let onboardingTheme = 'dark';
  let onboardingName = '';
  let onboardingSeeded = false;
  let installAttempted = false;

  // Best-effort iOS detection for the tailored Add-to-Home-Screen copy.
  function isIOS() {
    try {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    } catch (e) { return false; }
  }

  // Full-screen immersion for the install step: the topbar is hidden and
  // the card fills the viewport for the duration of step 3.
  function setFullscreen(on) {
    document.body.classList.toggle('onboarding-fullscreen', !!on);
  }

  function renderOnboardingWizard(step) {
    onboardingStep = Math.max(0, Math.min(2, step || 0));
    setFullscreen(onboardingStep === 2);
    if (!onboardingSeeded) {
      onboardingSeeded = true;
      // Seed with the saved name unless it is a placeholder default (current
      // or legacy) — the field must start EMPTY so the user types their own.
      if (state.personal && state.personal.doctorName &&
          state.personal.doctorName !== 'Dr' &&
          state.personal.doctorName !== LEGACY_DEFAULT_DOCTOR_NAME) {
        onboardingName = state.personal.doctorName;
      }
    }
    const total = 3;
    const dots = [0, 1, 2].map(i =>
      `<span class="onboarding-dot ${i === onboardingStep ? 'active' : ''} ${i < onboardingStep ? 'done' : ''}"></span>`
    ).join('');
    const stepLabel = `FIRST SETUP · STEP ${onboardingStep + 1} OF ${total}`;

    let body = '';
    if (onboardingStep === 0) {
      body = `
        <div class="onboarding-title">📚 Choose your study source</div>
        <div class="onboarding-sub">Pick where your syllabus data comes from.</div>
        <div class="onboarding-options">
          ${STUDY_SOURCES.map(s => {
            const upcoming = !s.available;
            return `
              <button type="button" class="onboarding-option ${onboardingSource === s.id ? 'checked' : ''} ${upcoming ? 'upcoming' : ''}" data-source="${s.id}">
                <span class="onboarding-radio"></span>
                <span>
                  <span class="onboarding-option-title">${s.label}</span>
                  <span class="onboarding-option-sub">${upcoming ? 'Data lands in a future update.' : (s.id === 'marrow_8' ? 'Primary NEET-PG dataset — 20 subjects, full curriculum.' : 'Older edition — 20 subjects.')}</span>
                </span>
                ${upcoming ? '<span class="v2-hud-badge" style="margin-left:auto;">UPCOMING</span>' : ''}
              </button>`;
          }).join('')}
        </div>
        ${!STUDY_SOURCES.find(s => s.id === onboardingSource)?.available ? `
          <div class="onboarding-alert">
            <svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-info"/></svg>
            ${getSourceLabel(onboardingSource)} is an upcoming feature. Its syllabus data will be available in a future update.
          </div>` : ''}
        <div class="onboarding-hint-path">
          <svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-settings"/></svg>
          <span>You can change your study source anytime later from <b>Profile → Settings → Study Source</b>.</span>
        </div>
      `;
    } else if (onboardingStep === 1) {
      body = `
        <div class="onboarding-title">👤 About you</div>
        <div class="onboarding-sub">Help us personalize your dashboard.</div>
        <div style="text-align:left; margin-top:16px;">
          <label class="plan-config-label" for="onboarding-name">What should we call you?</label>
          <input type="text" id="onboarding-name" class="onboarding-name-input" value="${escapeAttr(onboardingName)}" placeholder="Dr" autocomplete="name">
        </div>
        <div style="text-align:left; margin-top:16px;">
          <label class="plan-config-label">Theme</label>
          <div class="onboarding-theme-grid">
            <button type="button" class="onboarding-theme-opt ${onboardingTheme === 'dark' ? 'checked' : ''}" data-theme-val="dark">🌙 Dark Mode</button>
            <button type="button" class="onboarding-theme-opt ${onboardingTheme === 'light' ? 'checked' : ''}" data-theme-val="light">☀️ Light Mode</button>
          </div>
        </div>
        <div class="onboarding-sub" style="margin-top:12px;">Change anytime from the Profile tab.</div>
        <hr style="margin:20px 0; border:none; border-top:1px solid var(--border);">
        <div class="onboarding-guide-list">
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">1</span><span>📋 Set your study target — pick a subject and daily video pace.</span></div>
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">2</span><span>✅ Check off videos daily. Your streak & progress update automatically.</span></div>
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">3</span><span>📊 Analytics tracks pace & exam readiness; Curriculum browses all subjects.</span></div>
        </div>
        <div class="onboarding-sub" style="margin-top:12px;">💾 Everything is saved on this device — no account needed.</div>
      `;
    } else {
      // Step 3 — full-screen install step (issue #11).
      const install = window.FlowMD.pwaInstall;
      const installable = !!(install && install.isInstallable());
      const installed = !!(install && install.isInstalled());
      const ios = isIOS();

      if (installed) {
        body = `
          <div class="onboarding-install-icon"><svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg></div>
          <div class="onboarding-title">FlowMD is installed 🎉</div>
          <div class="onboarding-sub">You're all set, ${escapeHtml(onboardingName || 'Dr')} — ${getSourceLabel(onboardingSource)} • ${onboardingTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}.</div>
          <div class="onboarding-sub" style="margin-top:12px;">Launch FlowMD from your home screen for the full-screen, offline-ready experience.</div>
        `;
      } else if (installable) {
        body = `
          <div class="onboarding-install-icon"><svg class="material-symbols-outlined"><use href="#fmd-i-install_mobile"/></svg></div>
          <div class="onboarding-title">Install FlowMD on your device</div>
          <div class="onboarding-sub">One tap from your home screen — full-screen app, works offline and loads instantly, just like a native app.</div>
          <div class="onboarding-install-perks">
            <div class="onboarding-guide-item"><span class="onboarding-guide-num">✓</span><span>📱 Full-screen — no browser bars</span></div>
            <div class="onboarding-guide-item"><span class="onboarding-guide-num">✓</span><span>⚡ Works offline & loads faster</span></div>
            <div class="onboarding-guide-item"><span class="onboarding-guide-num">✓</span><span>🔔 Keeps your streak front and center</span></div>
          </div>
        `;
      } else {
        body = `
          <div class="onboarding-install-icon"><svg class="material-symbols-outlined"><use href="#fmd-i-add_to_home_screen"/></svg></div>
          <div class="onboarding-title">Add FlowMD to your Home Screen</div>
          <div class="onboarding-sub">Runs full-screen, works offline, and loads faster — just like a native app.</div>
          <div class="onboarding-install-steps">
            ${ios ? `
              <div class="onboarding-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-ios_share"/></svg>
                <div>Tap the <b>Share</b> button <span class="onboarding-install-kbd">⎋</span> in Safari's toolbar</div>
              </div>
              <div class="onboarding-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-add_circle"/></svg>
                <div>Scroll and choose <b>Add to Home Screen</b></div>
              </div>
              <div class="onboarding-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg>
                <div>Tap <b>Add</b> — FlowMD appears on your home screen</div>
              </div>
            ` : `
              <div class="onboarding-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-more_vert"/></svg>
                <div>Tap the browser menu <span class="onboarding-install-kbd">⋮</span></div>
              </div>
              <div class="onboarding-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-add_circle"/></svg>
                <div>Choose <b>Install app</b> (or <b>Add to Home screen</b>)</div>
              </div>
              <div class="onboarding-install-step">
                <svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg>
                <div>Confirm — FlowMD appears on your home screen</div>
              </div>
            `}
          </div>
          <div class="onboarding-sub" style="margin-top:12px;">You're all set, ${escapeHtml(onboardingName || 'Dr')} — ${getSourceLabel(onboardingSource)} • ${onboardingTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}.</div>
        `;
      }
    }

    document.getElementById('app-main').innerHTML = `
      <div class="${onboardingStep === 2 ? 'onboarding-fullscreen-wrap' : ''}" style="margin-bottom:16px;">
        <div class="v2-pixel-card onboarding-card ${onboardingStep === 2 ? 'onboarding-card-install' : ''}" style="padding:26px 20px;">
          <div class="onboarding-step-line">
            <span>${stepLabel}</span>
            <span class="onboarding-dots">${dots}</span>
          </div>
          <div class="onboarding-head">${body}</div>
          <div class="onboarding-footer">
            <button type="button" class="v2-arcade-btn onboarding-btn-back" id="onboarding-back" style="height:46px; min-width:110px; padding:0 14px;">← Back</button>
            ${onboardingStep === 2
              ? `<span class="onboarding-footer-install">
                   <button type="button" class="v2-arcade-btn onboarding-cta" id="onboarding-install-btn" style="height:46px; min-width:150px; padding:0 18px;">${installAttempted ? 'Done — Start Studying →' : (window.FlowMD.pwaInstall && window.FlowMD.pwaInstall.isInstallable() ? 'Install FlowMD' : 'Done — Complete Setup →')}</button>
                   <button type="button" class="onboarding-skip-link" id="onboarding-skip">Skip for now</button>
                 </span>`
              : `<button type="button" class="v2-arcade-btn onboarding-cta" id="onboarding-next">${onboardingStep === 1 ? 'Next →' : 'Next →'}</button>`}
          </div>
        </div>
      </div>
    `;

    if (onboardingStep === 0) {
      document.querySelectorAll('.onboarding-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const sid = btn.getAttribute('data-source');
          onboardingSource = sid;
          const srcObj = STUDY_SOURCES.find(s => s.id === sid);
          if (srcObj && !srcObj.available) {
            showToast(srcObj.label + ' is coming soon — data in a future update.', 'info');
          }
          renderOnboardingWizard(onboardingStep);
        });
      });
    }

    if (onboardingStep === 1) {
      document.querySelectorAll('.onboarding-theme-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          onboardingTheme = btn.getAttribute('data-theme-val');
          state.theme = onboardingTheme;
          applyTheme(state.theme);
          document.querySelectorAll('.onboarding-theme-opt').forEach(b => b.classList.toggle('checked', b === btn));
        });
      });

      const nameInputEl = document.getElementById('onboarding-name');
      if (nameInputEl) {
        nameInputEl.addEventListener('input', () => { onboardingName = nameInputEl.value.trim(); });
        // Step 2: pop the device keyboard — focus the name field synchronously
        // inside the Next-button click gesture (required for iOS Safari) and
        // re-focus shortly after in case layout stole it. Only re-focus when
        // nothing else has taken focus (e.g. the theme buttons).
        nameInputEl.focus({ preventScroll: true });
        setTimeout(() => {
          const el = document.getElementById('onboarding-name');
          if (el && (document.activeElement === document.body || !document.activeElement)) {
            el.focus({ preventScroll: true });
          }
        }, 350);
      }
    }

    const backBtn = document.getElementById('onboarding-back');
    if (backBtn) {
      if (onboardingStep === 0) backBtn.style.visibility = 'hidden';
      backBtn.addEventListener('click', () => {
        if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('prev');
        renderOnboardingWizard(onboardingStep - 1);
      });
    }

    const nextBtn = document.getElementById('onboarding-next');
    if (nextBtn) {
      nextBtn.disabled = (onboardingStep === 0 && !STUDY_SOURCES.find(s => s.id === onboardingSource)?.available);
      nextBtn.addEventListener('click', () => {
        if (onboardingStep === 0) {
          if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
          renderOnboardingWizard(1);
        } else {
          renderOnboardingWizard(2);
        }
      });
    }

    // Step 3: install / done / skip.
    const installBtn = document.getElementById('onboarding-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        const install = window.FlowMD.pwaInstall;
        if (!installAttempted && install && install.isInstallable()) {
          installAttempted = true;
          const outcome = await install.requestInstall();
          if (outcome === 'accepted') {
            if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('install');
            showToast('Installing FlowMD PWA…', 'rocket_launch');
            finishOnboarding();
          } else if (outcome === 'unavailable') {
            showToast('Tap Browser Menu (⋮) → "Install app"', 'info');
          }
          // 'dismissed' → stay on the step; the button now reads
          // "Done — Start Studying" so the user can finish or retry.
          renderOnboardingWizard(2);
          return;
        }
        finishOnboarding();
      });
    }

    const skipBtn = document.getElementById('onboarding-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        // An explicit skip must silence the first-visit install modal too —
        // the user just told us "not now".
        try {
          if (window.FlowMD.pwaInstall) window.FlowMD.pwaInstall.dismissFirstVisitBanner();
        } catch (e) { /* non-fatal */ }
        finishOnboarding();
      });
    }
  }

  function finishOnboarding() {
    setFullscreen(false);
    state.isConfigured = true;
    state.activeSource = onboardingSource;          state.personal.doctorName = onboardingName || 'Dr';
    state.theme = onboardingTheme;
    applyTheme(state.theme);
    saveState();
    if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('finish');
    if (window.FlowMD.shell) window.FlowMD.shell.render();
  }

  // Expose
  window.FlowMD.onboarding = {
    renderOnboardingWizard,
    finishOnboarding
  };
})();
