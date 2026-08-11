/* ============================================================
   FlowMD Features — Analytics View
   Renders the 7-Day Execution Chart, subject completion heatmap,
   per-plan pace/ETA stats, and the share-report action.

   Extracted verbatim from app.js (2026-08-10); signature adapted
   to receive the shell DOM cache (renderAnalyticsView(dom, stats)).
   ============================================================ */
(function () {
  'use strict';

  const { getState } = window.FlowMD.store;
  const { getDailyCountsExcludingBulk, getScopedChapterNames } = window.FlowMD.sourceData;
  const { getAllPlanQueues, getSubjectOrSyllabusMetricsForPlan } = window.FlowMD.metrics;
  const { renderExecutionChart, renderPixelSubjectHeatmap } = window.FlowMD.charts;
  const { focusStudyPlanConfig } = window.FlowMD.planConfig;
  const { showToast } = window.FlowMD.toast;
  const { escapeHtml, todayKey, DEFAULT_PLAN, PLAN_A_ACCENT, toLocalDateKey } = window.FlowMD.constants;
  const { renderEditionChip } = window.FlowMD.theme;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Shell DOM cache — set on every render via the dispatcher.
  let DOM = {};

  function renderAnalyticsView(dom, stats) {
    DOM = dom;
    const plans = (state.plans && state.plans.length > 0) ? state.plans : [DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT)];
    const allQueues = getAllPlanQueues();
    const hasDualPlans = plans.length >= 2;
    // A target exists only when the user has actually configured one.
    const hasTarget = plans.some(p => p.targetSubject && parseInt(p.videosPerDay, 10) > 0);

    const now = new Date();
    const todayStr = todayKey();
    // Source of truth for targets is state.plans (the per-plan config). The
    // legacy state.goals object only mirrors Plan A's subject/date/day and is
    // never updated for Plan B or weekly/monthly — reading it here is exactly
    // the bug where Preparation Setup ignored the Study Plan Config.
    const configuredPlans = plans.filter(p => p.targetSubject && parseInt(p.videosPerDay, 10) > 0);
    const priorityFocus = configuredPlans.map(p => p.targetSubject).join(' + ');
    const earliestTargetMs = configuredPlans
      .filter(p => p.targetDate)
      .reduce((min, p) => {
        const t = new Date(p.targetDate).getTime();
        return isNaN(t) ? min : Math.min(min, t);
      }, Infinity);
    const targetDateMs = isFinite(earliestTargetMs) ? earliestTargetMs : NaN;
    const daysLeft = isNaN(targetDateMs) ? 0 : Math.max(1, Math.ceil((targetDateMs - now) / 86400000));
    const targetDateLabel = isNaN(targetDateMs)
      ? 'Not set'
      : new Date(targetDateMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = toLocalDateKey(d);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      last7Days.push({ dateKey, label });
    }

    // Get daily counts excluding bulk completed chapters
    const dailyCounts = getDailyCountsExcludingBulk();

    const todayDone = dailyCounts[todayStr] || 0;
    let actual7DaysCount = last7Days.reduce((sum, d) => sum + (dailyCounts[d.dateKey] || 0), 0);
    let actual30DaysCount = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      actual30DaysCount += dailyCounts[toLocalDateKey(d)] || 0;
    }

    // Aggregate total daily/weekly/monthly targets across all plans (0 when
    // nothing configured) — these power both the Goal Pulse and the
    // Preparation Setup card.
    let totalVidsDay = 0;
    let totalVidsWeek = 0;
    let totalVidsMonth = 0;
    plans.forEach(p => {
      totalVidsDay += parseInt(p.videosPerDay, 10) || 0;
      totalVidsWeek += parseInt(p.videosPerWeek, 10) || 0;
      totalVidsMonth += parseInt(p.videosPerMonth, 10) || 0;
    });

    const ideal7DaysTarget = totalVidsDay * 7;
    const ideal30DaysTarget = totalVidsDay * 30;
    const paceDelta = actual7DaysCount - ideal7DaysTarget;
    const lectureDeficit = Math.abs(paceDelta);

    const weeklyPct = hasTarget ? Math.min(100, Math.round((actual7DaysCount / Math.max(1, ideal7DaysTarget)) * 100)) : 0;
    const monthlyPct = hasTarget ? Math.min(100, Math.round((actual30DaysCount / Math.max(1, ideal30DaysTarget)) * 100)) : 0;
    const maxChartVal = Math.max(totalVidsDay, ...last7Days.map(d => dailyCounts[d.dateKey] || 0), 1);

    // Per-plan stats
    const planStats = plans.map((plan, idx) => {
      const q = allQueues[idx];
      const m = getSubjectOrSyllabusMetricsForPlan(plan);
      const scopedUnits = getScopedChapterNames(plan);
      const vids = parseInt(plan.videosPerDay, 10) || 0;
      const remVids = Math.max(0, m.remainingVideos);
      const daysNeeded = vids > 0 ? Math.ceil(remVids / vids) : 0;
      const finishDate = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
      const finishDateStr = plan.targetDate
        ? finishDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
      const targetDate = plan.targetDate ? new Date(plan.targetDate) : new Date(NaN);
      const daysLeft = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));
      const ideal7 = vids * 7;
      const ideal30 = vids * 30;
      const planPaceDelta = actual7DaysCount - ideal7; // global actual vs this plan's ideal
      return { plan, q, m, vids, remVids, daysNeeded, finishDate, finishDateStr, targetDate, daysLeft, ideal7, ideal30, planPaceDelta, scopedUnits };
    });

    const goalTile = (o) => `
      <div class="anl-goal-tile" style="--tile:${o.color}">
        <span class="anl-goal-badge-top" style="${o.badgeStyle || ''}">${o.badge}</span>
        <div class="anl-goal-head">
          <div class="anl-goal-tag">
            <span class="anl-goal-ico">${window.FlowMD.icons.renderIcon(o.icon)}</span>
            <span class="anl-goal-title">${o.title}</span>
          </div>
        </div>
        <div class="anl-goal-value">${o.value}<span class="unit">${o.unit || ''}</span></div>
        <div class="anl-goal-desc">${o.desc}</div>
        <div class="anl-goal-track"><div class="anl-goal-fill" style="width:${o.pct}%; --fill:${o.color};"></div></div>
        <div class="anl-goal-meta">
          <span class="anl-goal-pct">${o.pct}%</span>
          ${o.delta ? `<span class="anl-goal-delta" style="color:${o.deltaColor || 'var(--text-muted)'};">${o.delta}</span>` : ''}
        </div>
      </div>
    `;

    const todayPct = Math.min(100, Math.round((todayDone / totalVidsDay) * 100));
    const todayMet = todayDone >= totalVidsDay;
    const todayTile = goalTile({
      color: '#0ea5e9',
      icon: 'today',
      title: "Today's Daily Goal",
      badge: todayMet ? 'Done' : 'In progress',
      badgeStyle: `color:${todayMet ? 'var(--success)' : 'var(--warning)'}; border-color:${todayMet ? 'var(--success)' : 'var(--warning)'};`,
      value: `${todayDone}`,
      unit: `/ ${totalVidsDay}`,
      desc: `combined videos today${hasDualPlans ? '<br>' + plans.map((p, i) => `${p.label}: ${allQueues[i].queueCompletedInBatch}/${p.videosPerDay}`).join('<br>') : ''}`,
      pct: todayPct,
      delta: todayPct >= 100 ? 'Goal met' : `${totalVidsDay - todayDone} to go`,
      deltaColor: todayMet ? 'var(--success)' : 'var(--warning)'
    });

    const weekTile = goalTile({
      color: '#f59e0b',
      icon: 'date_range',
      title: 'Weekly Goal',
      badge: `${weeklyPct}% complete`,
      value: `${actual7DaysCount}`,
      unit: `/ ${ideal7DaysTarget}`,
      desc: 'videos completed this week',
      pct: weeklyPct,
      delta: `${paceDelta >= 0 ? '+' : '- '}${Math.abs(paceDelta)} vs ${ideal7DaysTarget}`,
      deltaColor: paceDelta >= 0 ? 'var(--success)' : 'var(--danger)'
    });

    const monthTile = goalTile({
      color: '#a855f7',
      icon: 'calendar_month',
      title: 'Monthly Goal',
      badge: `${monthlyPct}% complete`,
      value: `${actual30DaysCount}`,
      unit: `/ ${ideal30DaysTarget}`,
      desc: 'videos completed in 30 days',
      pct: monthlyPct,
      delta: 'rolling 30-day pace'
    });

    const planTiles = planStats.filter(ps => ps.plan.targetSubject && ps.plan.videosPerDay).map(ps => {
      const behind = ps.finishDate > ps.targetDate;
      const daysDiff = Math.abs(Math.ceil((ps.finishDate - ps.targetDate) / 86400000));
      const planPct = Math.min(100, Math.round((actual7DaysCount / Math.max(1, ps.ideal7)) * 100));
      const pColor = ps.plan.accentColor || PLAN_A_ACCENT;
      return goalTile({
        color: pColor,
        icon: 'flag',
        title: `${ps.plan.label} ETA`,
        badge: behind ? 'Late' : 'On track',
        badgeStyle: `color:${behind ? 'var(--danger)' : 'var(--success)'}; border-color:${behind ? 'var(--danger)' : 'var(--success)'};`,
        value: `${ps.finishDateStr}`,
        unit: '',
        desc: `${ps.plan.targetSubject}${ps.scopedUnits && ps.scopedUnits.length > 0 ? ' → ' + ps.scopedUnits.length + ' chapters' : ''} @ ${ps.vids}/day`,
        pct: planPct,
        delta: `${daysDiff}d ${behind ? 'behind' : 'ahead'} (${ps.plan.targetDate})`,
        deltaColor: behind ? 'var(--danger)' : 'var(--success)'
      });
    }).join('');

    DOM.appMain.innerHTML = `
      <!-- Breadcrumb -->
      <div class="fm-breadcrumb">
        <span class="fm-breadcrumb-item nav-bc-home">Home</span>
        <span class="fm-breadcrumb-separator">&gt;</span>
        <span class="fm-breadcrumb-item active">Analytics</span>
      </div>

      <!-- Study Intelligence Report Hero -->
      <section class="anl-report-hero">
        <div class="anl-hero-main">
          <div class="anl-hero-icon"><svg class="material-symbols-outlined"><use href="#fmd-i-monitoring"/></svg></div>
          <div>
            <div class="anl-hero-kicker">Study Intelligence Report</div>
            <h2 class="anl-hero-title">Your Study Intelligence</h2>
            <p class="anl-hero-sub">${hasDualPlans ? `Dual-Track: ${plans.map(p => p.targetSubject).join(' + ')}` : 'Live pace, goals & syllabus readiness'}</p>
          </div>
        </div>
        <div class="anl-hero-actions">
          ${renderEditionChip()}
          <span class="v2-hud-badge" style="color:${weeklyPct >= 100 ? 'var(--success)' : 'var(--warning)'}; border-color:${weeklyPct >= 100 ? 'var(--success)' : 'var(--warning)'};"><svg class="material-symbols-outlined" style="font-size:14px;"><use href="#fmd-i-speed"/></svg> ${weeklyPct}% Weekly Pace</span>
          <button class="v2-arcade-btn" id="btn-share-report" style="height:34px; padding:0 14px; font-size:0.82rem; background:var(--accent-gradient);">
            <svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-share"/></svg>
            <span>Share Report</span>
          </button>
        </div>
        <div class="anl-hero-chips">
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--accent-primary)"></span> Syllabus <b>${stats.percentage}%</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#10b981"></span> Daily Target <b>${totalVidsDay}</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#f59e0b"></span> 7-Day <b>${actual7DaysCount}/${ideal7DaysTarget}</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:#a855f7"></span> Days Left <b>${daysLeft || '—'}</b></span>
        </div>
      </section>

      <!-- Preparation Setup & Target Goals -->
      <div class="anl-report-card">
        <div class="anl-report-card-head">
          <div class="anl-report-card-title"><svg class="material-symbols-outlined mat"><use href="#fmd-i-tune"/></svg> Preparation Setup</div>
          <span class="v2-hud-badge" style="color:var(--accent-primary); border-color:var(--accent-primary);">${daysLeft ? daysLeft + ' Days Left' : 'Not set'}</span>
        </div>
        <div class="anl-report-focus">
          <div>
            <div class="lbl">Priority Focus</div>
            <div class="val">${priorityFocus || 'No subject set'}</div>
          </div>
          <div style="text-align:right;">
            <div class="lbl">Daily Pace</div>
            <div class="val"><small>${totalVidsDay || '—'}</small> vids/day</div>
          </div>
        </div>
        <div class="anl-report-facts">
          <div class="anl-report-fact"><div class="lbl">Daily</div><div class="val">${totalVidsDay || '—'} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Weekly</div><div class="val">${totalVidsWeek || '—'} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Monthly</div><div class="val">${totalVidsMonth || '—'} vids</div></div>
          <div class="anl-report-fact"><div class="lbl">Target Date</div><div class="val">${targetDateLabel}</div></div>
        </div>
        <button class="v2-arcade-btn" id="btn-analytics-open-goals" style="width:100%;"><svg class="material-symbols-outlined"><use href="#fmd-i-track_changes"/></svg> Synchronize Pace &amp; Goals</button>
      </div>

      <!-- Goal Pulse -->
      <div class="anl-goal-section-label"><svg class="material-symbols-outlined" style="font-size:18px; color:var(--accent-primary);"><use href="#fmd-i-target"/></svg> Goal Pulse — Today / Week / Month</div>
      ${hasTarget ? `
        <div class="anl-goal-grid">
          ${todayTile}
          ${weekTile}
          ${monthTile}
          ${planTiles}
        </div>` : `
        <div class="anl-goal-empty">
          <svg class="material-symbols-outlined"><use href="#fmd-i-track_changes"/></svg>
          <div>
            <strong>No study target set yet</strong>
            <small>Set a subject, daily pace &amp; deadline to power your Goal Pulse.</small>
          </div>
          <button type="button" class="v2-arcade-btn" id="btn-analytics-set-target" style="height:38px; padding:0 16px;">Set Your Target</button>
        </div>`}

      <!-- 7-Day Execution Chart -->
      ${renderExecutionChart(last7Days, totalVidsDay, maxChartVal)}

      <!-- Subject Heatmap (moved from dashboard) -->
      <div style="margin-top:20px;">
        ${renderPixelSubjectHeatmap(stats)}
      </div>

    `;

    document.getElementById('btn-share-report')?.addEventListener('click', () => {
      const shareText = `<svg class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;"><use href="#fmd-i-target"/></svg> FlowMD Study Intelligence Report\nDoctor: ${state.personal.doctorName || 'Dr. Aspirant'}\n${hasDualPlans ? `Dual-Track: ${plans.map(p => p.targetSubject).join(' + ')}\n` : ''}Syllabus HP Mastery: ${stats.percentage}%\nCombined Daily Target: ${totalVidsDay} vids/day\n7-Day Actual: ${actual7DaysCount}/${ideal7DaysTarget}\n${planStats.filter(ps => ps.plan.targetSubject && ps.plan.videosPerDay).map(ps => `${ps.plan.label} ETA: ${ps.finishDateStr}`).join('\n')}\nBuilt with FlowMD!`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => showToast('Report Copied to Clipboard!', 'auto_awesome'));
      } else {
        showToast('Study Intelligence Report Ready!', 'auto_awesome');
      }
    });

    document.getElementById('btn-analytics-open-goals')?.addEventListener('click', focusStudyPlanConfig);
    document.getElementById('btn-analytics-set-target')?.addEventListener('click', focusStudyPlanConfig);
  }

  // --- View 5: Synchronized Targets & Goals View ---

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderAnalyticsView
  });
})();
