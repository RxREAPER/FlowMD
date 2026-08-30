/* ============================================================
   FlowMD Features — Dashboard View
   Renders the dashboard: plan quest blocks, daily queue,
   PWA install banner, subject cards, heatmap filters.

   Extracted verbatim from app.js (2026-08-10); signature adapted
   to receive the shell DOM cache (renderDashboardView(dom, stats)).
   ============================================================ */
(function () {
  'use strict';

  const { getState, getStudyStreak, markStudyActivity, saveState } = window.FlowMD.store;
  const { getPlanScopeVideos, getScopedChapterNames } = window.FlowMD.sourceData;
  const { getAllPlanQueues, getPlanById } = window.FlowMD.metrics;
  const { FLOWMD_ICONS, escapeHtml, DEFAULT_PLAN, PLAN_A_ACCENT, todayKey } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;
  const { renderEditionChip } = window.FlowMD.theme;
  const { renderStudyPlanConfigCard, initStudyPlanConfig, focusStudyPlanConfig } = window.FlowMD.planConfig;
  const { renderOnboardingWizard } = window.FlowMD.onboarding;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  // --- Targeted quest checkbox update (no innerHTML rebuild, scroll preserved) ---
  function updateQuestAfterCheck() {
    const freshQueues = getAllPlanQueues();
    // Update each plan block's progress text
    document.querySelectorAll('.plan-quest-block').forEach((block, idx) => {
      const q = freshQueues[idx];
      if (!q) return;
      const pct = Math.min(100, Math.round((q.totalCompletedToday / q.baseTargetPace) * 100));
      const progressEl = block.querySelector('.plan-quest-progress');
      if (progressEl) progressEl.textContent = q.totalCompletedToday + '/' + q.baseTargetPace + ' • ' + pct + '%';
    });
    // Update hero streak
    const streakBadge = document.querySelector('.v2-hud-badge:last-child');
    if (streakBadge && streakBadge.textContent.includes('streak')) {
      streakBadge.innerHTML = '<svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-local_fire_department"/></svg> ' + getStudyStreak() + ' day streak';
    }
    // Show/hide all-quests-done banner
    const allDone = freshQueues.every(q => q.isDailyTargetMet);
    const banner = document.querySelector('.all-quests-banner');
    if (allDone && !banner) { window.FlowMD.shell.render(); return; }
    else if (!allDone && banner) banner.remove();
    // Update each row's completed class
    freshQueues.forEach(q => {
      q.videos.forEach(v => {
        const cb = document.querySelector('.queue-chk[data-video-id="' + v.id + '"]');
        if (cb) {
          const isChecked = !!state.completedVideos[v.id];
          cb.checked = isChecked;
          const row = cb.closest('.v2-quest-row');
          if (row) row.classList.toggle('completed', isChecked);
        }
      });
    });
  }

  function renderDashboardView(dom, stats) {
    DOM = dom;
    if (!state.isConfigured) {
      renderOnboardingWizard(0);
      return;
    }
    const docName = state.personal.doctorName || 'Dr. Aspirant';
    const plans = state.plans && state.plans.length > 0 ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    const hasTargetSet = plans.some(p => p.targetSubject && p.targetSubject !== '');
    const allQueues = getAllPlanQueues();
    const streakCount = getStudyStreak();

    const todayStr = todayKey();
    const todayCompletedCount = (state.dailyHistory && state.dailyHistory[todayStr]) || 0;

    let totalVidsDay = 0;
    plans.forEach(p => {
      totalVidsDay += parseInt(p.videosPerDay, 10) || 0;
    });

    // Helper: render one plan's daily quest block
    function renderPlanQuestBlock(plan, queue) {
      const planColor = plan.accentColor || PLAN_A_ACCENT;
      const todayDoneForPlan = queue.totalCompletedToday || 0;
      const dailyPctPlan = queue.baseTargetPace > 0 ? Math.min(100, Math.round((todayDoneForPlan / queue.baseTargetPace) * 100)) : 0;
      const scopedNames = getScopedChapterNames(plan);

      return `
        <div class="plan-quest-block" style="--plan-accent: ${planColor};">
          <div class="plan-quest-header">
            <div class="plan-quest-header-left">
              <span class="plan-quest-badge" style="background:${planColor};">${plan.label}</span>
              <span class="plan-quest-subject-name">${queue.subjectName}</span>
            </div>
            <span class="plan-quest-progress">${todayDoneForPlan}/${queue.baseTargetPace} • ${dailyPctPlan}%</span>
          </div>

          ${scopedNames.length > 0 ? `
            <div class="plan-quest-scope">
              <svg class="material-symbols-outlined" style="font-size:13px;"><use href="#fmd-i-filter_alt"/></svg>
              FOCUS: ${scopedNames.slice(0, 3).map(n => n.charAt(0) + n.slice(1).toLowerCase()).join(', ')}${scopedNames.length > 3 ? '…' : ''}
            </div>
          ` : ''}

          <div class="plan-quest-stats-row">
            <div class="plan-quest-target-text">
              TARGET: <strong>${(plan.extraBatchesCompletedToday || 0) > 0 ? '1 VIDEO AT A TIME' : queue.baseTargetPace + ' VIDS/DAY'}</strong>
            </div>
            <button class="v2-arcade-btn btn-open-queue-subject" data-subject-id="${queue.subjectId}" style="height: 30px; padding: 0 10px; font-size: 0.82rem;">
              <span>Open ${queue.subjectName}</span>
              <svg class="material-symbols-outlined" style="font-size: 14px;"><use href="#fmd-i-arrow_forward"/></svg>
            </button>
          </div>

          ${queue.isDailyTargetAchieved ? `
            ${(plan.extraBatchesCompletedToday || 0) > 0 ? `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px; border-color: var(--accent-secondary, #a855f7);">
                <div class="v2-alert-icon-box" style="background: #a855f7; color: #ffffff; font-size: 20px; font-weight: bold;"><svg class="material-symbols-outlined" style="font-size:18px;"><use href="#fmd-i-bolt"/></svg></div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: #a855f7;">${plan.label} EXTRA VIDEO #${plan.extraBatchesCompletedToday + 1} ▶ OVERACHIEVED!</div>
                  <div class="v2-alert-title">🔥 Overachievement Bonus Unlocked!</div>
                  <div class="v2-alert-body">You've completed an extra video! Total extra videos today: ${plan.extraBatchesCompletedToday} for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:#a855f7;"></div>
              </div>
            ` : `
              <div class="v2-achievement-alert congrats-card-pop" style="margin-bottom: 8px;">
                <div class="v2-alert-icon-box" style="background: var(--accent-success, #10b981);">${FLOWMD_ICONS.trophy}</div>
                <div class="v2-alert-content">
                  <div class="v2-alert-category" style="color: var(--accent-success, #10b981);">${plan.label} DAILY TARGET ▶ COMPLETED</div>
                  <div class="v2-alert-title">Daily Target Achieved!</div>
                  <div class="v2-alert-body">All ${queue.baseTargetPace} videos done for ${queue.subjectName}.</div>
                </div>
                <div class="v2-alert-bottom-bar" style="width:100%; background:var(--accent-success,#10b981);"></div>
              </div>
            `}
            <button class="v2-arcade-btn btn-advance-queue" data-plan-id="${plan.id}" style="width:100%; height:40px; font-weight:700; font-size:0.9rem; justify-content:center; gap:8px;">
              ${FLOWMD_ICONS.rocket}
              <span>🚀 Load Next Video</span>
            </button>
          ` : (queue.allSubjectDone ? `
            <div class="congrats-card-pop" style="text-align:center; padding:14px; color:var(--success); font-family:var(--font-display); font-size:0.95rem; display:flex; align-items:center; justify-content:center; gap:8px;">
              ${FLOWMD_ICONS.trophy}
              <span>${queue.subjectName} — all topics completed! <svg class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;"><use href="#fmd-i-celebration"/></svg></span>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap: 2px;">
              ${queue.videos.map(v => {
                const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
                let vNum = '#' + (v.videoNumber || '#1').replace(/^#+/, '');
                const isDone = !!state.completedVideos[v.id];
                return `
                  <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                    <label class="v2-pixel-checkbox-label">
                      <input type="checkbox" class="queue-chk" data-video-id="${v.id}" data-plan-id="${plan.id}" ${isDone ? 'checked' : ''}>
                      <span class="v2-pixel-checkbox-box"></span>
                      <div>
                        <div class="v2-quest-title"><span class="quest-video-num">${vNum}</span> ${v.title}</div>
                        <div class="quest-video-chapter">${v.chapterName}</div>
                      </div>
                    </label>
                    <div class="quest-video-dur">${durStr}</div>
                  </div>
                `;
              }).join('')}
            </div>
          `)}
        </div>
      `;
    }

    const allQuestsDone = allQueues.every(q => q.isDailyTargetMet);
    const hasDualPlans = plans.length >= 2;

    DOM.appMain.innerHTML = `
      <!-- Hero Card -->
      <div class="fm-feature-card-wrapper">
        <div class="fm-feature-card hero-banner-card">
          <div class="fm-feature-card-header-badges">
            ${renderEditionChip()}
            ${hasDualPlans ? `
              <span class="v2-hud-badge" style="color: #ffffff; background: linear-gradient(135deg, #e11d48 0%, #f97316 100%); border-color: #e11d48;"><svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-bolt"/></svg> DUAL-TRACK MODE</span>
             ` : ''}
            <span class="v2-hud-badge" style="margin-left:auto;"><svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-local_fire_department"/></svg> ${streakCount} day streak</span>
          </div>
          <h1 class="fm-feature-card-title">${Object.keys(state.completedVideos).length === 0 ? "Welcome" : "Welcome back"}, ${escapeHtml(docName)}!</h1>
          <p class="fm-feature-card-desc">
            ${hasDualPlans ? `Tracking ${plans.map(p => p.targetSubject || 'No subject set').join(' + ')}` : `${plans[0]?.targetSubject || 'No subject set'}`} — ${stats.percentage}% Mastered
          </p>
          <div class="hero-mastery-block">
            <div class="hero-mastery-top">
              <span class="hero-mastery-label"><span class="hero-mastery-dot"></span> Syllabus Mastery</span>
              <span style="font-size:0.7rem; font-weight:600; color:var(--text-muted); font-family: var(--font-hud);">${stats.totalVideos > 0 ? stats.completedVideos + ' / ' + stats.totalVideos + ' videos' : 'No data yet'}</span>
            </div>
            <div class="hero-mastery-value">${stats.percentage}<span style="font-size:0.9rem; font-weight:600; opacity:0.7;">%</span></div>
            <div class="v2-hp-bar-bg hero-hp-bar">
              <div class="v2-hp-bar-fill" style="width:${stats.percentage}%;"></div>
            </div>
            <div class="hero-mastery-sub">
              <span>${stats.percentage < 25 ? 'Just getting started' : stats.percentage < 50 ? 'Building momentum' : stats.percentage < 75 ? 'Strong progress' : stats.percentage < 90 ? 'Almost there' : 'Mastery achieved!'}</span>
              <span>${stats.percentage < 100 ? (100 - stats.percentage) + '% to mastery' : 'Complete!'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PWA install modal auto-shows here via pwaInstall.maybeShowFirstVisitModal() (app.js) -->

      <!-- All-Quests-Done Banner -->
      ${allQuestsDone ? `
        <div class="v2-achievement-alert congrats-card-pop all-quests-banner">
          <div class="v2-alert-icon-box" style="background: #ffd700;">${FLOWMD_ICONS.trophy}</div>
          <div class="v2-alert-content">
            <div class="v2-alert-category all-quests-category"><svg class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;"><use href="#fmd-i-emoji_events"/></svg> ALL DAILY QUESTS COMPLETE!</div>
            <div class="v2-alert-title">Outstanding Performance!</div>
            <div class="v2-alert-body">Every plan's daily target has been achieved today!</div>
          </div>
          <div class="v2-alert-bottom-bar" style="width:100%; background:#ffd700;"></div>
        </div>
      ` : ''}

      <!-- Daily Quest Section (per plan) -->
      <div class="v2-quest-card action-queue-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><svg class="material-symbols-outlined mat"><use href="#fmd-i-emoji_events"/></svg> Daily Quests</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">${hasDualPlans ? 'DUAL TRACK' : `${allQueues[0]?.subjectName || 'All Topics'}`}</span>
        </div>
        <div style="padding-top:4px;">
          ${hasTargetSet
            ? plans.map((plan, idx) => renderPlanQuestBlock(plan, allQueues[idx])).join('')
            : `
              <div class="onboarding-empty-cta">
                <div class="onboarding-title" style="margin-bottom:6px;">No study target set yet</div>
                <div class="onboarding-sub">Pick a subject and a daily pace to start your daily quests.</div>
                <button type="button" class="v2-arcade-btn" id="btn-set-first-target" style="height:46px; min-width:150px; padding:0 16px; margin-top:14px;">Set Your First Target 🎯</button>
              </div>`}
        </div>
      </div>

      <!-- Study Plan Configuration (always-visible inline form) -->
      ${renderStudyPlanConfigCard()}
    `;

    document.querySelectorAll('.btn-open-queue-subject').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeSubjectId = btn.getAttribute('data-subject-id');
        if (window.FlowMD.shell) window.FlowMD.shell.switchView('subject_detail');
      });
    });

    document.getElementById('btn-set-first-target')?.addEventListener('click', () => {
      focusStudyPlanConfig();
    });

    // Per-plan advance batch (for extra videos beyond daily target)
    document.querySelectorAll('.btn-advance-queue').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : (state.plans && state.plans[0]);
        if (plan) {
          // For extra videos: load only 1 at a time
          plan.extraBatchesCompletedToday = (plan.extraBatchesCompletedToday || 0) + 1;
          plan.queueBatchVideoIds = [];
          plan.queueCompletedInBatch = 0;
          saveState();
          showToast(`${plan.label} — Next Extra Video Loaded!`, 'arrow_forward', `${plan.label} Advanced`);
        } else {
          state.queueBatchVideoIds = [];
          state.queueCompletedInBatch = 0;
          saveState();
          showToast('Next Video Loaded!', 'arrow_forward');
        }
        if (window.FlowMD.shell) window.FlowMD.shell.render();
      });
    });

    document.querySelectorAll('.queue-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        const planId = e.target.getAttribute('data-plan-id');
        const plan = planId ? getPlanById(planId) : null;

        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          // Get subjectId from the video (scoped to the plan's dataset)
          const planVideos = plan ? getPlanScopeVideos(plan) : [];
          const video = planVideos.find(v => v.id === vidId);
          const subjectId = video ? video.subjectId : null;
          markStudyActivity(true, subjectId);
          const planLabel = plan ? plan.label : '';
          showToast(`${planLabel ? planLabel + ' — ' : ''}Completed Action Queue Video!`, 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          const planVideos = plan ? getPlanScopeVideos(plan) : [];
          const video = planVideos.find(v => v.id === vidId);
          const subjectId = video ? video.subjectId : null;
          markStudyActivity(false, subjectId);
        }
        saveState();
        updateQuestAfterCheck();
      });
    });

    document.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const subId = card.getAttribute('data-subject-id');
        if (subId) { state.activeSubjectId = subId; if (window.FlowMD.shell) window.FlowMD.shell.switchView('subject_detail'); }
      });
    });

    document.querySelectorAll('.fm-heatmap-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.fm-heatmap-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.fm-heatmap-tile').forEach(tile => {
          tile.style.display = (filter === 'all' || tile.getAttribute('data-tier') === filter) ? 'flex' : 'none';
        });
      });
    });

    // Always-visible inline Study Plan config card
    initStudyPlanConfig();
  }



// --- View 2: Curriculum View — Nested Mobile Tabs ---

  // Expose
  window.FlowMD.views = {
    renderDashboardView
  };
})();
