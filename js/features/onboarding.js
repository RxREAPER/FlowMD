/* ============================================================
   FlowMD Features — First-Run Onboarding Wizard
   2-step wizard (study source → name/theme + summary)
   plus its module-local step state and finish routine.

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
  const { STUDY_SOURCES, escapeHtml, escapeAttr } = window.FlowMD.constants;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // --- Onboarding Wizard ---
  let onboardingStep = 0;
  let onboardingSource = 'marrow_8';
  let onboardingTheme = 'dark';
  let onboardingName = '';
  let onboardingSeeded = false;

  function renderOnboardingWizard(step) {
    onboardingStep = Math.max(0, Math.min(1, step || 0));
    if (!onboardingSeeded) {
      onboardingSeeded = true;
      if (state.personal && state.personal.doctorName) onboardingName = state.personal.doctorName;
    }
    const total = 2;
    const dots = [0, 1].map(i =>
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
    } else {
      body = `
        <div class="onboarding-title">👤 About you</div>
        <div class="onboarding-sub">Help us personalize your dashboard.</div>
        <div style="text-align:left; margin-top:16px;">
          <label class="plan-config-label" for="onboarding-name">What should we call you?</label>
          <input type="text" id="onboarding-name" class="onboarding-name-input" value="${escapeAttr(onboardingName)}" placeholder="Dr. Aspirant">
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
        <div class="onboarding-title" style="font-size:1rem; margin-bottom:8px;">✅ You're all set, ${escapeHtml(onboardingName || 'Doctor')}!</div>
        <div class="onboarding-sub">${getSourceLabel(onboardingSource)} • ${onboardingTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
        <div class="onboarding-guide-list">
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">1</span><span>📋 Set your study target — pick a subject and daily video pace.</span></div>
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">2</span><span>✅ Check off videos daily. Your streak & progress update automatically.</span></div>
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">3</span><span>📊 Analytics tracks pace & exam readiness; Curriculum browses all subjects.</span></div>
        </div>
        <div class="onboarding-sub" style="margin-top:12px;">💾 Everything is saved on this device — no account needed.</div>
      `;
    }

    document.getElementById('app-main').innerHTML = `
      <div style="margin-bottom:16px;">
        <div class="v2-pixel-card onboarding-card" style="padding:26px 20px;">
          <div class="onboarding-step-line">
            <span>${stepLabel}</span>
            <span class="onboarding-dots">${dots}</span>
          </div>
          <div class="onboarding-head">${body}</div>
          <div class="onboarding-footer">
            <button type="button" class="v2-arcade-btn onboarding-btn-back" id="onboarding-back" style="height:46px; min-width:110px; padding:0 14px;">← Back</button>
            <button type="button" class="v2-arcade-btn onboarding-cta" id="onboarding-next">${onboardingStep === 1 ? 'Got it — Show the Dashboard →' : 'Next →'}</button>
          </div>
        </div>
      </div>
    `;

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

    document.querySelectorAll('.onboarding-theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        onboardingTheme = btn.getAttribute('data-theme-val');
        state.theme = onboardingTheme;
        applyTheme(state.theme);
        document.querySelectorAll('.onboarding-theme-opt').forEach(b => b.classList.toggle('checked', b === btn));
      });
    });

    const backBtn = document.getElementById('onboarding-back');
    if (backBtn) {
      if (onboardingStep === 0) backBtn.style.visibility = 'hidden';
      backBtn.addEventListener('click', () => {
        if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('prev');
        renderOnboardingWizard(onboardingStep - 1);
      });
    }

    const nameInputEl = document.getElementById('onboarding-name');
    if (nameInputEl) {
      nameInputEl.addEventListener('input', () => { onboardingName = nameInputEl.value.trim(); });
    }

    const nextBtn = document.getElementById('onboarding-next');
    if (nextBtn) {
      nextBtn.disabled = (onboardingStep === 0 && !STUDY_SOURCES.find(s => s.id === onboardingSource)?.available);
      nextBtn.addEventListener('click', () => {
        if (onboardingStep === 1) {
          const nameInput = document.getElementById('onboarding-name');
          onboardingName = nameInput ? nameInput.value.trim() : onboardingName;
          state.theme = onboardingTheme;
          applyTheme(state.theme);
          finishOnboarding();
        } else {
          if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
          renderOnboardingWizard(onboardingStep + 1);
        }
      });
    }
  }

  function finishOnboarding() {
    state.isConfigured = true;
    state.activeSource = onboardingSource;
    state.personal.doctorName = onboardingName || state.personal.doctorName || 'Dr. Aspirant';
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
