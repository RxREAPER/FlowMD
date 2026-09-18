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
  const { getPlanScopeVideos, getScopedChapterNames, getDataset, getVideoCompletedDate } = window.FlowMD.sourceData;
  const { getAllPlanQueues, getPlanById, getSubjectOrSyllabusMetricsForPlan, getSubjectOrSyllabusMetrics } = window.FlowMD.metrics;
  const { FLOWMD_ICONS, escapeHtml, DEFAULT_PLAN, PLAN_A_ACCENT, todayKey, DAILY_TASKS_MODE_AUTO, DAILY_TASKS_MODE_MANUAL } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;
  const { focusStudyPlanConfig } = window.FlowMD.planConfig;
  const { renderOnboardingWizard } = window.FlowMD.onboarding;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  // Plans snapshot for in-place chip refreshes (set in renderDashboardView).
  let plansRefForChips = [];

  // --- Issue #32: topbar streak pill (left of the profile avatar) ---
  function updateTopbarStreakPill() {
    const pill = document.getElementById('topbar-streak-pill');
    if (!pill) return;
    const n = getStudyStreak();
    const numEl = pill.querySelector('.topbar-streak-num');
    if (numEl) numEl.textContent = String(n);
    pill.classList.toggle('is-zero', n <= 0);
    pill.title = n > 0 ? n + '-day study streak — keep it burning!' : 'Complete a topic today to start your streak';
  }

  function initTopbarStreakPill() {
    const pill = document.getElementById('topbar-streak-pill');
    if (!pill) return;
    updateTopbarStreakPill();
    pill.addEventListener('click', () => {
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('profile');
    });
  }

  // --- Targeted quest checkbox update (no innerHTML rebuild, scroll preserved) ---
  function updateQuestAfterCheck() {
    // Issue #28: keep the welcome-card "Current Subject Progress" realtime.
    updateHeroSubjectProgress();
    const freshQueues = getAllPlanQueues();
    // Update each plan block's progress text
    document.querySelectorAll('.plan-quest-block').forEach((block, idx) => {
      const q = freshQueues[idx];
      if (!q) return;
      const pct = Math.min(100, Math.round((q.totalCompletedToday / q.baseTargetPace) * 100));
      const progressEl = block.querySelector('.plan-quest-progress');
      if (progressEl) progressEl.textContent = q.totalCompletedToday + '/' + q.baseTargetPace + ' • ' + pct + '%';
      // Issue #32: refresh the compact per-plan stat chips in place.
      const chip = block.querySelector('.plan-quest-chips');
      if (chip) {
        const planRef = plansRefForChips[idx] || {};
        const scopedNames = getScopedChapterNames(planRef);
        chip.innerHTML = renderPlanStatChips(q, scopedNames, planRef);
      }
    });
    // Topbar streak pill (issue #32) + dashboard hero badge
    updateTopbarStreakPill();
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
          <div class="anl-report-card-title"><svg class="material-symbols-outlined mat"><use href="#fmd-i-emoji_events"/></svg> Daily Tasks${pendingHours > 0 ? ` <span class="dash-today-hours dash-today-hours-lg">≈ ${fmtHours(pendingHours)}h left</span>` : ''}</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">MANUAL MODE</span>
        </div>

        <div class="dt-toolbar">
          <div class="spc-mode-switch" role="group" aria-label="Daily Tasks topic mode" id="daily-tasks-mode-switch">
            <button type="button" class="spc-mode-opt" data-mode="${DAILY_TASKS_MODE_AUTO}">Auto</button>
            <button type="button" class="spc-mode-opt active" data-mode="${DAILY_TASKS_MODE_MANUAL}">Manual</button>
          </div>
          <button type="button" class="spc-mode-caption-link" id="btn-what-are-modes">How modes work</button>
        </div>
        <div class="spc-mode-caption dt-caption">Manual mode &mdash; your picked topics, in your order.</div>

        <div class="spc-manual-add">
          <button type="button" class="v2-arcade-btn" id="btn-add-task-topic">
            <svg class="material-symbols-outlined"><use href="#fmd-i-add_task"/></svg>
            <span>Add Topics from Search</span>
          </button>
          <span class="spc-manual-hint">${done} done · ${pending.length} to go</span>
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
              // Completion-date metadata (issue #16)
              const doneWhen = isDone ? getVideoCompletedDate(v.id) : '';
              return `
                <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                  <label class="v2-pixel-checkbox-label">
                    <input type="checkbox" class="queue-chk" data-video-id="${v.id}" data-manual="1" ${isDone ? 'checked' : ''}>
                    <span class="v2-pixel-checkbox-box"></span>
                    <div>
                      <div class="v2-quest-title"><span class="quest-video-num">${vNum}</span> ${v.title}</div>
                      <div class="quest-video-chapter">${v.subjectName} • ${v.chapterName}</div>
                      ${doneWhen ? `<div class="quest-done-when"><svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg> Completed ${doneWhen}</div>` : ''}
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

  // Issue #32: compact per-plan stat chips (focus + target + hours), replacing
  // the tall FOCUS strip + TARGET row. No information lost.
  function renderPlanStatChips(queue, scopedNames, plan) {
    const focusTxt = scopedNames.length > 0
      ? scopedNames.slice(0, 2).map(n => n.charAt(0) + n.slice(1).toLowerCase()).join(', ') + (scopedNames.length > 2 ? '…' : '')
      : 'All units';
    return `
      <div class="pq-chip" title="Focus scope: ${escapeHtml(focusTxt)}">
        <svg class="material-symbols-outlined"><use href="#fmd-i-filter_alt"/></svg>
        <span>${escapeHtml(focusTxt)}</span>
      </div>
      <div class="pq-chip" title="Daily target pace">
        <svg class="material-symbols-outlined"><use href="#fmd-i-flag"/></svg>
        <span>${(queue && queue.baseTargetPace) || 0}/day</span>
      </div>
      <div class="pq-chip" title="Estimated study hours at today's pace">
        <svg class="material-symbols-outlined"><use href="#fmd-i-schedule"/></svg>
        <span>~${fmtHours(planDailyHours(plan || {}))}h today</span>
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

  // --- Issue #32: "Current Subject Progress" — WHOLE-SUBJECT completion ---
  // One segment per subject targeted under Configure Study Plan (Plan A + B),
  // but the bar measures the ENTIRE subject's videos (every chapter, not just
  // the plan's focused units) — matching the curriculum card figures. Falls
  // back to the overall syllabus figure when no plan target is configured.
  // Realtime: updateHeroSubjectProgress() re-renders the block in place after
  // every completion tick, without rebuilding the dashboard.
  function buildHeroSubjectProgressInner(plans) {
    const overall = getSubjectOrSyllabusMetricsForPlan({});
    const overallPct = overall.totalVideos > 0 ? Math.round((overall.completedVideos / overall.totalVideos) * 100) : 0;
    // Match the plan's target to a subject on the active dataset, then use the
    // whole-subject metrics (getSubjectOrSyllabusMetrics(name)) — NOT the
    // plan-scoped video list. plan.targetSubject may hold the id OR the name.
    const scoped = (plans || [])
      .filter(p => p.targetSubject && parseInt(p.videosPerDay, 10) > 0)
      .map((plan, idx) => {
        const sub = (getDataset().find(s => s && (s.id === plan.targetSubject || s.subject === plan.targetSubject)) || {});
        const m = getSubjectOrSyllabusMetricsForPlan({ targetSubject: sub.subject || plan.targetSubject });
        const pct = m.totalVideos > 0 ? Math.round((m.completedVideos / m.totalVideos) * 100) : 0;
        const color = plan.accentColor || (idx === 0 ? '#00e5ff' : '#a855f7');
        return { plan, m, pct, color };
      })
      .filter(s => s.m.totalVideos > 0);
    if (!scoped.length) {
      return `
        <div class="hero-mastery-value">${overallPct}<span style="font-size:0.9rem; font-weight:600; opacity:0.7;">%</span></div>
        <div class="v2-hp-bar-bg hero-hp-bar">
          <div class="v2-hp-bar-fill" style="width:${overallPct}%;"></div>
        </div>
      `;
    }
    const segData = scoped;
    const totalVids = segData.reduce((sum, s) => sum + Math.max(1, s.m.totalVideos), 0);
    const blended = Math.round(segData.reduce((sum, s) => sum + s.pct * Math.max(1, s.m.totalVideos), 0) / Math.max(1, totalVids));
    const segs = segData.map(s => `
      <div class="hero-subj-seg" style="flex:${Math.max(1, s.m.totalVideos)}; --seg:${s.color};" title="${s.plan.label}: ${escapeHtml(s.m.name || s.plan.targetSubject)} — ${s.pct}% (${s.m.completedVideos}/${s.m.totalVideos} videos, whole subject)">
        <div class="hero-subj-seg-fill" style="width:${s.pct}%;"></div>
      </div>
    `).join('');
    const legend = segData.map(s => `
      <span class="hero-subj-legend-item">
        <span class="hero-subj-dot" style="background:${s.color}; box-shadow:0 0 6px ${s.color};"></span>
        <span class="hero-subj-legend-name">${escapeHtml(s.m.name || s.plan.targetSubject)}</span>
        <b>${s.m.completedVideos}/${s.m.totalVideos}</b>
      </span>
    `).join('');
    return `
      <div class="hero-mastery-value" id="hero-subj-pct">${blended}<span style="font-size:0.9rem; font-weight:600; opacity:0.7;">%</span></div>
      <div class="hero-subj-bar" id="hero-subj-segs">${segs}</div>
      <div class="hero-subj-legend" id="hero-subj-legend">${legend}</div>
    `;
  }

  function renderHeroSubjectProgress(plans) {
    return `<div id="hero-subj-progress-block">${buildHeroSubjectProgressInner(plans)}</div>`;
  }

  // Realtime update (issue #28): called after any completion change so the
  // welcome-card bar reflects the user's input immediately.
  function updateHeroSubjectProgress() {
    const block = document.getElementById('hero-subj-progress-block');
    if (block) block.innerHTML = buildHeroSubjectProgressInner(state.plans || []);
  }

  // --- Issue #28: "How your daily topics work" explainer popup ---
  // Lives outside the plan-config sheet; opened from the Daily Tasks
  // "How modes work" link. Closable via ×, backdrop click, or Esc.
  function openModesExplainerModal() {
    const existing = document.getElementById('modes-explainer-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop active';
    overlay.id = 'modes-explainer-overlay';
    overlay.innerHTML = `
      <div class="modal-card modes-explainer-card" role="dialog" aria-modal="true" aria-label="How your daily topics work">
        <button type="button" class="modes-explainer-close" id="modes-explainer-close" aria-label="Close">×</button>
        <div class="spc-mode-explainer">
          <div class="spc-mode-explainer-title">
            <svg class="material-symbols-outlined"><use href="#fmd-i-info"/></svg>
            How your daily topics work
          </div>
          <div class="spc-mode-explainer-row">
            <span class="spc-mode-explainer-num" style="--ex-accent: var(--accent-primary);">1</span>
            <div>
              <b>Automatic mode</b> — topics follow your lecture module order. FlowMD queues the next videos from your target subject's curriculum each day, so you always know what's next.
            </div>
          </div>
          <div class="spc-mode-explainer-row">
            <span class="spc-mode-explainer-num" style="--ex-accent: var(--accent-secondary, #a855f7);">2</span>
            <div>
              <b>Manual mode</b> — pick topics as per your requirement: search any topic and tap <b>“+ Task”</b> to add it from the search box. Manual completions reflect on your analytics too — built for students who prefer a dynamic method of study.
            </div>
          </div>
          <div class="spc-mode-explainer-foot">You can switch between Auto and Manual anytime from the Daily Tasks card on your dashboard.</div>
        </div>
      </div>`;

    const close = () => {
      overlay.classList.remove('active');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => overlay.remove(), 180);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#modes-explainer-close').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
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

          <!-- Issue #32: compact chip row (focus + pace + hours) replaces the
               taller FOCUS strip + TARGET row — everything still visible. -->
          <div class="plan-quest-chips">${renderPlanStatChips(queue, scopedNames, plan)}</div>

          <div class="plan-quest-track" aria-hidden="true">
            <div class="plan-quest-track-fill" style="width:${dailyPctPlan}%;"></div>
          </div>

          <div class="plan-quest-stats-row">
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
                // Completion-date metadata (issue #16)
                const doneWhen = isDone ? getVideoCompletedDate(v.id) : '';
                return `
                  <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                    <label class="v2-pixel-checkbox-label">
                      <input type="checkbox" class="queue-chk" data-video-id="${v.id}" data-plan-id="${plan.id}" ${isDone ? 'checked' : ''}>
                      <span class="v2-pixel-checkbox-box"></span>
                      <div>
                        <div class="v2-quest-title"><span class="quest-video-num">${vNum}</span> ${v.title}</div>
                        <div class="quest-video-chapter">${v.chapterName}</div>
                        ${doneWhen ? `<div class="quest-done-when"><svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg> Completed ${doneWhen}</div>` : ''}
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
    plansRefForChips = plans;
    const doneToday = Object.keys(state.completedVideos || {}).filter(id => {
      const iso = state.completedVideos[id];
      return typeof iso === 'string' && iso.slice(0, 10) === todayStr;
    }).length;

    DOM.appMain.innerHTML = `
      <!-- Hero Card -->
      <div class="fm-feature-card-wrapper">
        <div class="fm-feature-card hero-banner-card">
          <div class="fm-feature-card-header-badges">
            ${hasDualPlans ? `
              <span class="v2-hud-badge" style="color: #ffffff; background: linear-gradient(135deg, #e11d48 0%, #f97316 100%); border-color: #e11d48;"><svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-bolt"/></svg> DUAL-TRACK MODE</span>
             ` : ''}
          </div>
          <h1 class="fm-feature-card-title">${Object.keys(state.completedVideos).length === 0 ? "Welcome" : "Welcome back"}, ${escapeHtml(docName)}!</h1>
          <p class="fm-feature-card-desc">
            ${hasDualPlans ? `Tracking ${plans.map(p => p.targetSubject || 'No subject set').join(' + ')}` : `${plans[0]?.targetSubject || 'No subject set'}`} — ${stats.percentage}% Mastered
          </p>
          <div class="hero-mastery-block">
            <div class="hero-mastery-top">
              <span class="hero-mastery-label"><span class="hero-mastery-dot"></span> Current Subject Progress</span>
              <span style="font-size:0.7rem; font-weight:600; color:var(--text-muted); font-family: var(--font-hud);">${stats.totalVideos > 0 ? stats.completedVideos + ' / ' + stats.totalVideos + ' videos' : 'No data yet'}</span>
            </div>
            ${renderHeroSubjectProgress(plans, stats)}
            <!-- Issue #28: "Building momentum" tagline removed — no real function -->
          </div>
          <!-- Issue #32: streak moved to the topbar pill (left of the avatar) -->
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

      <!-- Daily Tasks — issue #32 revamp: dense single header strip (mode
           toggle + hours + progress live on one line), tighter quest blocks.
           No features removed: same queues, ticking, extra-video flow. -->
      ${isManualMode ? renderManualTasksSection() : `
      <div class="v2-quest-card action-queue-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><svg class="material-symbols-outlined mat"><use href="#fmd-i-emoji_events"/></svg> Daily Tasks</div>
          <span class="dash-today-hours dash-today-hours-lg">${totalHoursToday > 0 ? `≈ ${fmtHours(totalHoursToday)}h today` : ''}${doneToday > 0 ? ` · ${doneToday} done` : ''}</span>
        </div>

        <div class="dt-toolbar">
          <div class="spc-mode-switch" role="group" aria-label="Daily Tasks topic mode" id="daily-tasks-mode-switch">
            <button type="button" class="spc-mode-opt active" data-mode="${DAILY_TASKS_MODE_AUTO}">Auto</button>
            <button type="button" class="spc-mode-opt" data-mode="${DAILY_TASKS_MODE_MANUAL}">Manual</button>
          </div>
          <button type="button" class="spc-mode-caption-link" id="btn-what-are-modes">How modes work</button>
        </div>
        <div class="spc-mode-caption dt-caption">Auto mode &mdash; topics follow lecture module order.</div>

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
    initTopbarStreakPill();

    // Issue #25/#28: "How modes work" opens a dedicated popup with the full
    // Auto-vs-Manual explainer (no longer inside the plan-config sheet).
    document.querySelectorAll('#btn-what-are-modes').forEach(btn => {
      btn.addEventListener('click', () => {
        openModesExplainerModal();
      });
    });

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
            state.completedVideos[vidId] = new Date().toISOString();
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
          state.completedVideos[vidId] = new Date().toISOString();
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
  // Issue #32: topbar streak pill lives outside #app-main — app.js refreshes
  // it on every shell render, the dashboard binds its click handler.
  window.FlowMD.dashboard = { updateTopbarStreakPill };
})();
