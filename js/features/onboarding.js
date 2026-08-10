/* ============================================================
   FlowMD Features — First-Run Onboarding Wizard
   3-step wizard (study source → name/theme/sign-in → summary)
   plus its module-local step state and finish routine.

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
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

  // --- Multi-Source Onboarding Wizard ---
  let onboardingStep = 0;
  let onboardingSource = 'marrow_8';
  let onboardingTheme = 'dark';
  let onboardingName = '';
  let onboardingSeeded = false;

  function renderOnboardingWizard(step) {
    onboardingStep = Math.max(0, Math.min(2, step || 0));
    if (!onboardingSeeded) {
      onboardingSeeded = true;
      if (state.personal && state.personal.doctorName) onboardingName = state.personal.doctorName;
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
            <span class="material-symbols-outlined" style="font-size:16px;">info</span>
            ${getSourceLabel(onboardingSource)} is an upcoming feature. Its syllabus data will be available in a future update.
          </div>` : ''}
        <div class="onboarding-hint-path">
          <span class="material-symbols-outlined" style="font-size:16px;">settings</span>
          <span>You can change your study source anytime later from <b>Profile → Settings → Study Source</b>.</span>
        </div>
      `;
    } else if (onboardingStep === 1) {
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
        <div class="onboarding-title" style="font-size:1rem; margin-bottom:8px;">☁️ Cloud Sync (Optional)</div>
        <div class="onboarding-sub">Sign in with Google to backup progress & sync across devices.</div>
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
          <button type="button" class="v2-arcade-btn onboarding-cta" id="onboarding-signin" style="width:100%;">
            <span class="material-symbols-outlined" style="margin-right:8px;">cloud_sync</span>
            Sign in with Google
          </button>
          <button type="button" class="v2-arcade-btn onboarding-skip" id="onboarding-skip-signin" style="width:100%; background:transparent; color:var(--text-secondary); border:1px solid var(--border);">Skip for now</button>
        </div>
        <div class="onboarding-sub" style="margin-top:8px;">You can sign in later from Profile → Settings.</div>
      `;
    } else {
      body = `
        <div class="onboarding-title">✅ You're all set, ${escapeHtml(onboardingName || 'Doctor')}!</div>
        <div class="onboarding-sub">${getSourceLabel(onboardingSource)} • ${onboardingTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
        <div class="onboarding-guide-list">
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">1</span><span>📋 Set your study target — pick a subject and daily video pace.</span></div>
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">2</span><span>✅ Check off videos daily. Your streak & progress update automatically.</span></div>
          <div class="onboarding-guide-item"><span class="onboarding-guide-num">3</span><span>📊 Analytics tracks pace & exam readiness; Curriculum browses all subjects.</span></div>
        </div>
        <hr style="margin:20px 0; border:none; border-top:1px solid var(--border);">
        <div class="onboarding-title" style="font-size:1rem; margin-bottom:8px;">☁️ Cloud Sync</div>
        <div class="onboarding-sub">Sign in with Google to keep completions, streaks, plans & preferences synced across all your devices — works offline.</div>
        <div class="onboarding-sub" style="margin-top:12px;">Sign in anytime from <b>Profile → Settings → Google Cloud Sync</b>.</div>
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
            <button type="button" class="v2-arcade-btn onboarding-cta" id="onboarding-next">${onboardingStep === 2 ? 'Got it — Show the Dashboard →' : 'Next →'}</button>
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
        }
        if (onboardingStep === 2) {
          finishOnboarding();
        } else {
          if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
          renderOnboardingWizard(onboardingStep + 1);
        }
      });
    }

    // Sign-in button
    const signinBtn = document.getElementById('onboarding-signin');
    if (signinBtn) {
      signinBtn.addEventListener('click', async () => {
        if (!window.FirebaseSync) return;
        signinBtn.disabled = true;
        signinBtn.innerHTML = '<span class="material-symbols-outlined" style="margin-right:8px;">sync</span> Signing in...';
        try {
          await window.FirebaseSync.signInWithGoogle();
          showToast('Signed in successfully!', 'check_circle');
          if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
          renderOnboardingWizard(onboardingStep + 1);
        } catch (e) {
          showToast('Sign-in failed: ' + e.message, 'error');
          signinBtn.disabled = false;
          signinBtn.innerHTML = '<span class="material-symbols-outlined" style="margin-right:8px;">cloud_sync</span> Sign in with Google';
        }
      });
    }

    // Skip sign-in button
    const skipSigninBtn = document.getElementById('onboarding-skip-signin');
    if (skipSigninBtn) {
      skipSigninBtn.addEventListener('click', () => {
        if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
        renderOnboardingWizard(onboardingStep + 1);
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
