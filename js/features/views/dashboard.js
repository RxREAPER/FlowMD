/* ============================================================
   FlowMD Features — Dashboard View
   Renders the dashboard: plan quest blocks, daily queue,
   PWA install banner, subject cards, heatmap filters.

   Extracted verbatim from app.js (2026-08-10); signature adapted
   to receive the shell DOM cache (renderDashboardView(dom, stats)).
   ============================================================ */
(function () {
  'use strict';

  const { getState, getStudyStreak, markStudyActivity, saveState, setDailyTasksMode, addManualTaskVideo, removeManualTaskVideo } = window.FlowMD.store;
  const { getPlanScopeVideos, getScopedChapterNames, getDataset } = window.FlowMD.sourceData;
  const { getAllPlanQueues, getPlanById, getSubjectOrSyllabusMetricsForPlan } = window.FlowMD.metrics;
  const { FLOWMD_ICONS, escapeHtml, DEFAULT_PLAN, PLAN_A_ACCENT, todayKey, DAILY_TASKS_MODE_AUTO, DAILY_TASKS_MODE_MANUAL } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;
  const { focusStudyPlanConfig } = window.FlowMD.planConfig;
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

  // --- Daily Tasks: manual mode section ---
  // In manual mode the user's hand-picked topics (added from search) ARE the
  // task list — one global list, not per-plan quest blocks.
  function renderManualTasksSection() {
    const manualIds = Array.isArray(state.dailyTasksManual) ? state.dailyTasksManual : [];
    const dataset = getDataset();
    const byId = {};
    dataset.forEach(sub => {
      (sub.chapters || []).forEach(chap => {
        (chap.videos || []).forEach(v => {
          if (manualIds.indexOf(v.id) !== -1) {
            byId[v.id] = { ...v, subjectName: sub.subject, chapterName: chap.name };
          }
        });
      });
    });
    const items = manualIds.map(id => byId[id]).filter(Boolean);
    const pending = items.filter(v => !state.completedVideos[v.id]);
    const done = items.length - pending.length;
    // Hours still left in the manual task list (issue #15)
    const pendingHours = pending.reduce((sum, v) => sum + (v.durationMins || 0) + (v.durationSecs || 0) / 60, 0) / 60;

    return `
      <div class="v2-quest-card action-queue-card" id="manual-tasks-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><svg class="material-symbols-outlined mat"><use href="#fmd-i-emoji_events"/></svg> Daily Tasks${pendingHours > 0 ? ` <span class="dash-today-hours">· ~${fmtHours(pendingHours)}h left</span>` : ''}</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">MANUAL MODE</span>
        </div>

        <div class="spc-mode-toggle">
          <span class="spc-mode-label">Topics</span>
          <div class="spc-mode-switch" role="group" aria-label="Daily Tasks topic mode" id="daily-tasks-mode-switch">
            <button type="button" class="spc-mode-opt" data-mode="${DAILY_TASKS_MODE_AUTO}">Auto</button>
            <button type="button" class="spc-mode-opt active" data-mode="${DAILY_TASKS_MODE_MANUAL}">Manual</button>
          </div>
        </div>

        <div class="spc-manual-add">
          <button type="button" class="v2-arcade-btn" id="btn-add-task-topic">
            <svg class="material-symbols-outlined"><use href="#fmd-i-add_task"/></svg>
            <span>Add Topics from Search</span>
          </button>
          <span class="spc-manual-hint">${items.length} topic${items.length === 1 ? '' : 's'} • ${done} done • ${pending.length} to go</span>
        </div>

        ${items.length === 0 ? `
          <div class="onboarding-empty-cta manual-empty-cta">
            <div class="onboarding-title" style="margin-bottom:6px;">No manual topics yet</div>
            <div class="onboarding-sub">Search any subject, chapter or video topic and tap “+ Task” to add it here.</div>
          </div>
        ` : `
          <div class="v2-quest-list">
            ${items.map(v => {
              const durStr = `${v.durationMins || 0}m ${v.durationSecs || 0}s`;
              let vNum = '#' + (v.videoNumber || '1').replace(/^#+/, '');
              const isDone = !!state.completedVideos[v.id];
              return `
                <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                  <label class="v2-pixel-checkbox-label">
                    <input type="checkbox" class="queue-chk" data-video-id="${v.id}" data-manual="1" ${isDone ? 'checked' : ''}>
                    <span class="v2-pixel-checkbox-box"></span>
                    <div>
                      <div class="v2-quest-title"><span class="quest-video-num">${vNum}</span> ${v.title}</div>
                      <div class="quest-video-chapter">${v.subjectName} • ${v.chapterName}</div>
                    </div>
                  </label>
                  <div class="quest-video-dur">${durStr}</div>
                  <button type="button" class="spc-manual-remove" data-remove-task="${v.id}" title="Remove from Daily Tasks" aria-label="Remove from Daily Tasks">
                    <svg class="material-symbols-outlined"><use href="#fmd-i-close"/></svg>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}
        ${items.length > 0 && pending.length === 0 ? `
          <div class="congrats-card-pop manual-congrats">
            ${FLOWMD_ICONS.trophy}
            <span>All manual topics completed! Add more from search.</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Look a video up on the whole active dataset (manual tasks may belong to
  // any subject, not just a plan target).
  function findDatasetVideo(videoId) {
    const dataset = getDataset();
    for (const sub of dataset) {
      for (const chap of (sub.chapters || [])) {
        for (const v of (chap.videos || [])) {
          if (v.id === videoId) return { ...v, subjectId: sub.id };
        }
      }
    }
    return null;
  }

  function initDailyTasksModeSwitch() {
    const modeSwitch = document.getElementById('daily-tasks-mode-switch');
    if (!modeSwitch) return;
    modeSwitch.querySelectorAll('.spc-mode-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode === state.dailyTasksMode) return;
        setDailyTasksMode(mode);
        if (window.FlowMD.shell) window.FlowMD.shell.render();
      });
    });
  }

  // Today's total hours goal (issue #15): each plan's daily pace × that
  // plan's average scoped video length, summed across plans.
  function planDailyHours(plan) {
    const pace = parseInt(plan.videosPerDay, 10) || 0;
    if (!plan.targetSubject || pace <= 0) return 0;
    const videos = getPlanScopeVideos(plan);
    if (!videos.length) return 0;
    const avgMins = videos.reduce((sum, v) => sum + (v.durationMins || 0) + (v.durationSecs || 0) / 60, 0) / videos.length;
    return (avgMins * pace) / 60;
  }

  function fmtHours(h) {
    return h >= 10 ? String(Math.round(h)) : String(Math.round(h * 10) / 10);
  }

  function initManualTasksSection() {
    initDailyTasksModeSwitch();
    document.getElementById('btn-add-task-topic')?.addEventListener('click', () => {
      if (window.FlowMD.search && window.FlowMD.search.openSpotlightModal) {
        window.FlowMD.search.openSpotlightModal();
      }
    });
    document.querySelectorAll('[data-remove-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeManualTaskVideo(btn.getAttribute('data-remove-task'));
        showToast('Removed from Daily Tasks', 'info');
        if (window.FlowMD.shell) window.FlowMD.shell.render();
      });
    });
  }

  // Welcome card progress (issue #18): one track per subject scoped under
  // Configure Study Plan, stacked as a segmented progress bar. Falls back to
  // the overall syllabus figure when no plan target is configured.
  function renderHeroSubjectProgress(plans, stats) {
    const scoped = plans.filter(p => p.targetSubject && parseInt(p.videosPerDay, 10) > 0);
    if (!scoped.length) {
      return `
        <div class="hero-mastery-value">${stats.percentage}<span style="font-size:0.9rem; font-weight:600; opacity:0.7;">%</span></div>
        <div class="v2-hp-bar-bg hero-hp-bar">
          <div class="v2-hp-bar-fill" style="width:${stats.percentage}%;"></div>
        </div>
      `;
    }
    const segData = scoped.map((plan, idx) => {
      const m = getSubjectOrSyllabusMetricsForPlan(plan);
      const pct = m.totalVideos > 0 ? Math.round((m.completedVideos / m.totalVideos) * 100) : 0;
      const color = plan.accentColor || (idx === 0 ? '#00e5ff' : '#a855f7');
      return { plan, m, pct, color };
    });
    const totalVids = segData.reduce((sum, s) => sum + Math.max(1, s.m.totalVideos), 0);
    const blended = Math.round(segData.reduce((sum, s) => sum + s.pct * Math.max(1, s.m.totalVideos), 0) / Math.max(1, totalVids));
    const segs = segData.map(s => `
      <div class="hero-subj-seg" style="flex:${Math.max(1, s.m.totalVideos)}; --seg:${s.color};" title="${s.plan.label}: ${escapeHtml(s.plan.targetSubject)} — ${s.pct}% (${s.m.completedVideos}/${s.m.totalVideos} videos)">
        <div class="hero-subj-seg-fill" style="width:${s.pct}%;"></div>
      </div>
    `).join('');
    const legend = segData.map(s => `
      <span class="hero-subj-legend-item">
        <span class="hero-subj-dot" style="background:${s.color}; box-shadow:0 0 6px ${s.color};"></span>
        ${escapeHtml(s.plan.targetSubject)} <b>${s.pct}%</b>
      </span>
    `).join('');
    return `
      <div class="hero-mastery-value">${blended}<span style="font-size:0.9rem; font-weight:600; opacity:0.7;">%</span></div>
      <div class="hero-subj-bar">${segs}</div>
      <div class="hero-subj-legend">${legend}</div>
    `;
  }

  function renderDashboardView(dom, stats) {
    DOM = dom;
    if (!state.isConfigured) {
      renderOnboardingWizard(0);
      return;
    }
    const docName = state.personal.doctorName || 'Dr';
    const plans = state.plans && state.plans.length > 0 ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    const hasTargetSet = plans.some(p => p.targetSubject && p.targetSubject !== '');
    const allQueues = getAllPlanQueues();
    const streakCount = getStudyStreak();

    const todayStr = todayKey();
    const todayCompletedCount = (state.dailyHistory && state.dailyHistory[todayStr]) || 0;

    // --- Daily Tasks topic source: 'auto' (curriculum order) or 'manual' ---
    const isManualMode = state.dailyTasksMode === 'manual';

    let totalVidsDay = 0;
    plans.forEach(p => {
      totalVidsDay += parseInt(p.videosPerDay, 10) || 0;
    });
    const totalHoursToday = plans.reduce((sum, p) => sum + planDailyHours(p), 0);

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

    const allQuestsDone = !isManualMode && allQueues.every(q => q.isDailyTargetMet);
    const hasDualPlans = plans.length >= 2;

    DOM.appMain.innerHTML = `
      <!-- Hero Card -->
      <div class="fm-feature-card-wrapper">
        <div class="fm-feature-card hero-banner-card">
          <div class="fm-feature-card-header-badges">
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
              <span class="hero-mastery-label"><span class="hero-mastery-dot"></span> Subject Progress</span>
              <span style="font-size:0.7rem; font-weight:600; color:var(--text-muted); font-family: var(--font-hud);">${stats.totalVideos > 0 ? stats.completedVideos + ' / ' + stats.totalVideos + ' videos' : 'No data yet'}</span>
            </div>
            ${renderHeroSubjectProgress(plans, stats)}
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
            <div class="v2-alert-category all-quests-category"><svg class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;"><use href="#fmd-i-emoji_events"/></svg> ALL DAILY TASKS COMPLETE!</div>
            <div class="v2-alert-title">Outstanding Performance!</div>
            <div class="v2-alert-body">Every plan's daily target has been achieved today!</div>
          </div>
          <div class="v2-alert-bottom-bar" style="width:100%; background:#ffd700;"></div>
        </div>
      ` : ''}

      <!-- Daily Tasks -->
      ${isManualMode ? renderManualTasksSection() : `
      <div class="v2-quest-card action-queue-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><svg class="material-symbols-outlined mat"><use href="#fmd-i-emoji_events"/></svg> Daily Tasks${totalHoursToday > 0 ? ` <span class="dash-today-hours">· ~${fmtHours(totalHoursToday)}h today</span>` : ''}</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">${hasDualPlans ? 'DUAL TRACK' : `${allQueues[0]?.subjectName || 'All Topics'}`}</span>
        </div>

        <div class="spc-mode-toggle">
          <span class="spc-mode-label">Topics</span>
          <div class="spc-mode-switch" role="group" aria-label="Daily Tasks topic mode" id="daily-tasks-mode-switch">
            <button type="button" class="spc-mode-opt active" data-mode="${DAILY_TASKS_MODE_AUTO}">Auto</button>
            <button type="button" class="spc-mode-opt" data-mode="${DAILY_TASKS_MODE_MANUAL}">Manual</button>
          </div>
        </div>

        <div style="padding-top:4px;">
          ${hasTargetSet
            ? plans.map((plan, idx) => renderPlanQuestBlock(plan, allQueues[idx])).join('')
            : `
              <div class="onboarding-empty-cta">
                <div class="onboarding-title" style="margin-bottom:6px;">No study target set yet</div>
                <div class="onboarding-sub">Pick a subject and a daily pace to start your daily tasks, or switch to manual topics below.</div>
                <button type="button" class="v2-arcade-btn" id="btn-set-first-target" style="height:46px; min-width:150px; padding:0 16px; margin-top:14px;">Set Your First Target 🎯</button>
              </div>`}
        </div>
      </div>
      `}

      <!-- Configure Study Plan lives in the bottom sheet opened from the
           center nav button (window.FlowMD.planConfig.openPlanConfigSheet) -->
    `;

    if (isManualMode) initManualTasksSection();
    initDailyTasksModeSwitch();

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
        const isManual = e.target.getAttribute('data-manual') === '1';
        const plan = planId ? getPlanById(planId) : null;

        if (isManual) {
          // Manual tasks: look the video up on the whole active dataset (it
          // may belong to no plan's target subject at all).
          const found = findDatasetVideo(vidId);
          if (e.target.checked) {
            state.completedVideos[vidId] = true;
            markStudyActivity(true, found ? found.subjectId : null);
            showToast('Task completed!', 'check_circle');
          } else {
            delete state.completedVideos[vidId];
            markStudyActivity(false, found ? found.subjectId : null);
          }
          saveState();
          updateQuestAfterCheck();
          return;
        }

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

    // Heatmap tier filter buttons
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
  }



// --- View 2: Curriculum View — Nested Mobile Tabs ---

  // Expose
  window.FlowMD.views = {
    renderDashboardView
  };
})();
