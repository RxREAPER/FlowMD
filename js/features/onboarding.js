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
  let obwStep = 0;
  let obwSource = 'marrow_8';
  let obwTheme = 'dark';
  let obwName = '';
  let obwSeeded = false;

  function renderOnboardingWizard(step) {
    obwStep = Math.max(0, Math.min(2, step || 0));
    if (!obwSeeded) {
      obwSeeded = true;
      if (state.personal && state.personal.doctorName) obwName = state.personal.doctorName;
    }
    const total = 3;
    const dots = [0, 1, 2].map(i =>
      `<span class="obw-dot ${i === obwStep ? 'active' : ''} ${i < obwStep ? 'done' : ''}"></span>`
    ).join('');
    const stepLabel = `FIRST SETUP · STEP ${obwStep + 1} OF ${total}`;

    let body = '';
    if (obwStep === 0) {
      body = `
        <div class="obw-title">📚 Choose your study source</div>
        <div class="obw-sub">Pick where your syllabus data comes from.</div>
        <div class="obw-options">
          ${STUDY_SOURCES.map(s => {
            const upcoming = !s.available;
            return `
              <button type="button" class="obw-option ${obwSource === s.id ? 'checked' : ''} ${upcoming ? 'upcoming' : ''}" data-source="${s.id}">
                <span class="obw-radio"></span>
                <span>
                  <span class="obw-option-title">${s.label}</span>
                  <span class="obw-option-sub">${upcoming ? 'Data lands in a future update.' : (s.id === 'marrow_8' ? 'Primary NEET-PG dataset — 20 subjects, full curriculum.' : 'Older edition — 20 subjects.')}</span>
                </span>
                ${upcoming ? '<span class="v2-hud-badge" style="margin-left:auto;">UPCOMING</span>' : ''}
              </button>`;
          }).join('')}
        </div>
        ${!STUDY_SOURCES.find(s => s.id === obwSource)?.available ? `
          <div class="obw-alert">
            <span class="material-symbols-outlined" style="font-size:16px;">info</span>
            ${getSourceLabel(obwSource)} is an upcoming feature. Its syllabus data will be available in a future update.
          </div>` : ''}
        <div class="obw-hint-path">
          <span class="material-symbols-outlined" style="font-size:16px;">settings</span>
          <span>You can change your study source anytime later from <b>Profile → Settings → Study Source</b>.</span>
        </div>
      `;
    } else if (obwStep === 1) {
      body = `
        <div class="obw-title">👤 About you</div>
        <div class="obw-sub">Help us personalize your dashboard.</div>
        <div style="text-align:left; margin-top:16px;">
          <label class="gcm-label" for="obw-name">What should we call you?</label>
          <input type="text" id="obw-name" class="obw-name-input" value="${escapeAttr(obwName)}" placeholder="Dr. Aspirant">
        </div>
        <div style="text-align:left; margin-top:16px;">
          <label class="gcm-label">Theme</label>
          <div class="obw-theme-grid">
            <button type="button" class="obw-theme-opt ${obwTheme === 'dark' ? 'checked' : ''}" data-theme-val="dark">🌙 Dark Mode</button>
            <button type="button" class="obw-theme-opt ${obwTheme === 'light' ? 'checked' : ''}" data-theme-val="light">☀️ Light Mode</button>
          </div>
        </div>
        <div class="obw-sub" style="margin-top:12px;">Change anytime from the Profile tab.</div>
        <hr style="margin:20px 0; border:none; border-top:1px solid var(--border);">
        <div class="obw-title" style="font-size:1rem; margin-bottom:8px;">☁️ Cloud Sync (Optional)</div>
        <div class="obw-sub">Sign in with Google to backup progress & sync across devices.</div>
        <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
          <button type="button" class="v2-arcade-btn obw-cta" id="obw-signin" style="width:100%;">
            <span class="material-symbols-outlined" style="margin-right:8px;">cloud_sync</span>
            Sign in with Google
          </button>
          <button type="button" class="v2-arcade-btn obw-skip" id="obw-skip-signin" style="width:100%; background:transparent; color:var(--text-secondary); border:1px solid var(--border);">Skip for now</button>
        </div>
        <div class="obw-sub" style="margin-top:8px;">You can sign in later from Profile → Settings.</div>
      `;
    } else {
      body = `
        <div class="obw-title">✅ You're all set, ${escapeHtml(obwName || 'Doctor')}!</div>
        <div class="obw-sub">${getSourceLabel(obwSource)} • ${obwTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
        <div class="obw-guide-list">
          <div class="obw-guide-item"><span class="obw-guide-num">1</span><span>📋 Set your study target — pick a subject and daily video pace.</span></div>
          <div class="obw-guide-item"><span class="obw-guide-num">2</span><span>✅ Check off videos daily. Your streak & progress update automatically.</span></div>
          <div class="obw-guide-item"><span class="obw-guide-num">3</span><span>📊 Analytics tracks pace & exam readiness; Curriculum browses all subjects.</span></div>
        </div>
        <hr style="margin:20px 0; border:none; border-top:1px solid var(--border);">
        <div class="obw-title" style="font-size:1rem; margin-bottom:8px;">☁️ Cloud Sync</div>
        <div class="obw-sub">Sign in with Google to keep completions, streaks, plans & preferences synced across all your devices — works offline.</div>
        <div class="obw-sub" style="margin-top:12px;">Sign in anytime from <b>Profile → Settings → Google Cloud Sync</b>.</div>
      `;
    }

    document.getElementById('app-main').innerHTML = `
      <div style="margin-bottom:16px;">
        <div class="v2-pixel-card obw-card" style="padding:26px 20px;">
          <div class="obw-step-line">
            <span>${stepLabel}</span>
            <span class="obw-dots">${dots}</span>
          </div>
          <div class="obw-head">${body}</div>
          <div class="obw-footer">
            <button type="button" class="v2-arcade-btn obw-btn-back" id="obw-back" style="height:46px; min-width:110px; padding:0 14px;">← Back</button>
            <button type="button" class="v2-arcade-btn obw-cta" id="obw-next">${obwStep === 2 ? 'Got it — Show the Dashboard →' : 'Next →'}</button>
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.obw-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-source');
        obwSource = sid;
        const srcObj = STUDY_SOURCES.find(s => s.id === sid);
        if (srcObj && !srcObj.available) {
          showToast(srcObj.label + ' is coming soon — data in a future update.', 'info');
        }
        renderOnboardingWizard(obwStep);
      });
    });

    document.querySelectorAll('.obw-theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        obwTheme = btn.getAttribute('data-theme-val');
        state.theme = obwTheme;
        applyTheme(state.theme);
        document.querySelectorAll('.obw-theme-opt').forEach(b => b.classList.toggle('checked', b === btn));
      });
    });

    const backBtn = document.getElementById('obw-back');
    if (backBtn) {
      if (obwStep === 0) backBtn.style.visibility = 'hidden';
      backBtn.addEventListener('click', () => {
        if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('prev');
        renderOnboardingWizard(obwStep - 1);
      });
    }

    const nameInputEl = document.getElementById('obw-name');
    if (nameInputEl) {
      nameInputEl.addEventListener('input', () => { obwName = nameInputEl.value.trim(); });
    }

    const nextBtn = document.getElementById('obw-next');
    if (nextBtn) {
      nextBtn.disabled = (obwStep === 0 && !STUDY_SOURCES.find(s => s.id === obwSource)?.available);
      nextBtn.addEventListener('click', () => {
        if (obwStep === 1) {
          const nameInput = document.getElementById('obw-name');
          obwName = nameInput ? nameInput.value.trim() : obwName;
          state.theme = obwTheme;
          applyTheme(state.theme);
        }
        if (obwStep === 2) {
          finishOnboarding();
        } else {
          if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
          renderOnboardingWizard(obwStep + 1);
        }
      });
    }

    // Sign-in button
    const signinBtn = document.getElementById('obw-signin');
    if (signinBtn) {
      signinBtn.addEventListener('click', async () => {
        if (!window.FirebaseSync) return;
        signinBtn.disabled = true;
        signinBtn.innerHTML = '<span class="material-symbols-outlined" style="margin-right:8px;">sync</span> Signing in...';
        try {
          await window.FirebaseSync.signInWithGoogle();
          showToast('Signed in successfully!', 'check_circle');
          if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
          renderOnboardingWizard(obwStep + 1);
        } catch (e) {
          showToast('Sign-in failed: ' + e.message, 'error');
          signinBtn.disabled = false;
          signinBtn.innerHTML = '<span class="material-symbols-outlined" style="margin-right:8px;">cloud_sync</span> Sign in with Google';
        }
      });
    }

    // Skip sign-in button
    const skipSigninBtn = document.getElementById('obw-skip-signin');
    if (skipSigninBtn) {
      skipSigninBtn.addEventListener('click', () => {
        if (window.FlowMD.shell) window.FlowMD.shell.triggerHaptic('step');
        renderOnboardingWizard(obwStep + 1);
      });
    }
  }

  function finishOnboarding() {
    state.isConfigured = true;
    state.activeSource = obwSource;
    state.personal.doctorName = obwName || state.personal.doctorName || 'Dr. Aspirant';
    state.theme = obwTheme;
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
