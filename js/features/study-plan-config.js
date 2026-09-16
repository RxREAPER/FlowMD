/* ============================================================
   FlowMD Features — Configure Study Plan (bottom sheet)
   Opened from the center bottom-nav button ("Plan") on any view.
   Plan A / Plan B tabs — each tab is either a full goal form
   (subject, focus chapter, deadline, auto-synced pace) or an
   "add plan" intro when that plan is not enabled yet. Every
   enabled plan can be disabled, so a user can run Plan B alone.

   Replaces the old always-visible inline dashboard card and the
   Dual-Track toggle (issue #10).
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState, setDailyTasksMode, removeManualTaskVideo, markStudyActivity } = window.FlowMD.store;
  const { getDataset } = window.FlowMD.sourceData;
  const { getSyllabusStatsForSource, getSubjectOrSyllabusMetrics, getMetricsForModalScope } = window.FlowMD.metrics;
  const { STUDY_SOURCES, DEFAULT_PLAN, PLAN_A_ACCENT, PLAN_B_ACCENT, toLocalDateKey, escapeHtml, escapeAttr, FLOWMD_ICONS, DAILY_TASKS_MODE_AUTO, DAILY_TASKS_MODE_MANUAL } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // Module-local sheet DOM cache + active tab (survives close/open).
  let sheetDom = {};
  let sheetTab = 'plan_a';

  // --- Plan helpers ---
  function getPlan(planKey) {
    if (!state.plans || state.plans.length === 0) return null;
    return state.plans.find(p => p.id === planKey) || null;
  }

  function hasPlan(planKey) {
    return !!getPlan(planKey);
  }

  // --- Selected focus chapter for the tab currently rendered ---
  function getSelectedUnitsForPlanKey(isPlanB) {
    const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
    if (!container) return [];
    const allChip = container.querySelector('.plan-config-chip[data-chap="__all__"]');
    if (allChip && allChip.classList.contains('selected')) return [];
    const selChip = container.querySelector('.plan-config-chip.selected[data-chap]');
    const name = selChip ? selChip.getAttribute('data-chap') : null;
    return (name && name !== '__all__') ? [name] : [];
  }

  // --- Daily Tasks Topics section (lives in the sheet, mirrors the dashboard
  // card): Auto = curriculum-order queue from the plan targets; Manual = the
  // user's hand-picked topics (added from the spotlight search "+ Task").
  // Shared classes with the dashboard keep the two sections consistent.
  function renderTopicsSection(activeTabKey) {
    const isManual = state.dailyTasksMode === DAILY_TASKS_MODE_MANUAL;
    let manualListHtml = '';
    if (isManual) {
      const manualIds = Array.isArray(state.dailyTasksManual) ? state.dailyTasksManual : [];
      const dataset = getDataset();
      const byId = {};
      dataset.forEach(sub => {
        (sub.chapters || []).forEach(chap => {
          (chap.videos || []).forEach(v => {
            if (manualIds.indexOf(v.id) !== -1) byId[v.id] = { ...v, subjectName: sub.subject, chapterName: chap.name };
          });
        });
      });
      const items = manualIds.map(id => byId[id]).filter(Boolean);
      const pending = items.filter(v => !state.completedVideos[v.id]);
      const done = items.length - pending.length;

      manualListHtml = `
        <div class="spc-topics-manual-block">
          <div class="spc-manual-add">
            <button type="button" class="v2-arcade-btn" id="spc-btn-add-task-topic">
              <svg class="material-symbols-outlined"><use href="#fmd-i-add_task"/></svg>
              <span>Add Topics from Search</span>
            </button>
            <span class="spc-manual-hint">${items.length} topic${items.length === 1 ? '' : 's'} • ${done} done • ${pending.length} to go</span>
          </div>
          ${items.length === 0 ? `
            <div class="onboarding-empty-cta spc-topics-empty">
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
                      <input type="checkbox" class="queue-chk spc-manual-task-chk" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                      <span class="v2-pixel-checkbox-box"></span>
                      <div>
                        <div class="v2-quest-title"><span class="quest-video-num">${vNum}</span> ${v.title}</div>
                        <div class="quest-video-chapter">${v.subjectName} • ${v.chapterName}</div>
                      </div>
                    </label>
                    <div class="quest-video-dur">${durStr}</div>
                    <button type="button" class="spc-manual-remove" data-spc-remove-task="${v.id}" title="Remove from Daily Tasks" aria-label="Remove from Daily Tasks">
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

    return `
      <div class="spc-topics-section">
        <div class="spc-topics-divider"><span>Daily Tasks</span></div>
        <div class="spc-mode-toggle">
          <span class="spc-mode-label">Topics</span>
          <div class="spc-mode-switch" role="group" aria-label="Daily Tasks topic mode" id="spc-daily-tasks-mode-switch">
            <button type="button" class="spc-mode-opt ${!isManual ? 'active' : ''}" data-spc-mode="${DAILY_TASKS_MODE_AUTO}">Auto</button>
            <button type="button" class="spc-mode-opt ${isManual ? 'active' : ''}" data-spc-mode="${DAILY_TASKS_MODE_MANUAL}">Manual</button>
          </div>
        </div>
        <div class="spc-topics-mode-help">${isManual
          ? 'Manual: study only the topics you pick — added one tap from the search.'
          : 'Auto: topics follow your plan target in curriculum order.'}</div>
        ${manualListHtml}
      </div>
    `;
  }

  // --- Sheet open / close ---
  function openPlanConfigSheet(dom) {
    if (dom) sheetDom = dom;
    const overlay = document.getElementById('plan-config-sheet-overlay');
    const content = document.getElementById('plan-config-sheet-content');
    if (!overlay || !content) return;
    // Default to the primary tab on a fresh open; keep the last tab when
    // the sheet is merely re-opened during the same session.
    if (!hasPlan(sheetTab)) sheetTab = 'plan_a';
    renderPlanConfigSheet();
    overlay.classList.add('active');
    const subSelect = document.getElementById(sheetTab === 'plan_b' ? 'select-target-subject-b' : 'select-target-subject');
    if (subSelect) setTimeout(() => subSelect.focus({ preventScroll: true }), 250);
  }

  function closePlanConfigSheet() {
    const overlay = document.getElementById('plan-config-sheet-overlay');
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      // The dashboard/analytics behind the sheet may reflect new plans.
      if (window.FlowMD.shell) window.FlowMD.shell.render();
    }
  }

  // --- Sheet template ---
  function renderPlanConfigSheet() {
    const content = document.getElementById('plan-config-sheet-content');
    if (!content) return;
    const sid = state.activeSource || 'marrow_8';
    const src = STUDY_SOURCES.find(s => s.id === sid);
    const activePlan = getPlan(sheetTab);

    const tabBtn = (key, label) => {
      const p = getPlan(key);
      // Badge only when the plan is enabled AND actually configured.
      const badge = (p && p.targetSubject) ? 'On' : '';
      return `
      <button type="button" class="spc-tab ${sheetTab === key ? 'active' : ''}" data-spc-tab="${key}">
        <span class="spc-tab-dot" style="background:${key === 'plan_a' ? PLAN_A_ACCENT : PLAN_B_ACCENT};"></span>
        <span>${label}</span>
        ${badge ? `<span class="spc-tab-badge">${badge}</span>` : ''}
      </button>`;
    };

    content.innerHTML = `
      <div class="spc-sheet-head">
        <div class="spc-sheet-head-text">
          <div class="plan-config-hero-kicker">Study Plan</div>
          <h2 class="plan-config-hero-title">Configure Study Plan</h2>
          <p class="spc-sheet-sub">${escapeHtml(src ? src.label : 'Marrow Edition 8')} &bull; pace &amp; deadline auto-synchronize</p>
        </div>
        <button type="button" class="plan-config-icon-btn" id="spc-sheet-close" title="Close" aria-label="Close Configure Study Plan">
          <svg class="material-symbols-outlined" style="font-size:18px;"><use href="#fmd-i-close"/></svg>
        </button>
      </div>

      <div class="spc-tabs" role="tablist" aria-label="Plans">
      ${tabBtn('plan_a', 'Plan A')}
      ${tabBtn('plan_b', 'Plan B')}
      </div>

      ${activePlan ? renderPlanForm(sheetTab, activePlan) : renderAddPlanIntro(sheetTab)}
      ${renderTopicsSection(sheetTab)}
    `;

    initPlanConfig();
  }

  function renderAddPlanIntro(planKey) {
    const isB = planKey === 'plan_b';
    const accent = isB ? PLAN_B_ACCENT : PLAN_A_ACCENT;
    const label = isB ? 'Plan B' : 'Plan A';
    const otherEnabled = hasPlan(isB ? 'plan_a' : 'plan_b');
    return `
      <div class="spc-add-intro">
        <div class="spc-add-icon" style="color:${accent};">
          <svg class="material-symbols-outlined" style="font-size:34px;"><use href="#fmd-i-flag"/></svg>
        </div>
        <div class="onboarding-title" style="margin-bottom:6px;">${label} is not enabled</div>
        <div class="onboarding-sub">${otherEnabled
          ? `Add a parallel ${label} goal — a second subject with its own pace and deadline, tracked alongside your other plan.`
          : 'Set a priority target subject, a daily pace and a deadline. FlowMD builds your daily tasks from it.'}</div>
        <button type="button" class="v2-arcade-btn spc-add-btn" id="spc-add-plan" data-add-plan="${planKey}" style="--plan-accent:${accent};">
          <svg class="material-symbols-outlined"><use href="#fmd-i-add_task"/></svg>
          <span>Add ${label}</span>
        </button>
      </div>
    `;
  }

  function renderPlanForm(planKey, plan) {
    const isB = planKey === 'plan_b';
    const suffix = isB ? '-b' : '';
    const accent = plan.accentColor || (isB ? PLAN_B_ACCENT : PLAN_A_ACCENT);
    // Disabling is always offered — even on the last plan. A user must be
    // able to step back to "no plan"; the queue engine treats a plan-less
    // state the same as a fresh (unconfigured) one.
    const canDisableAlways = true;
    const otherPlan = state.plans.find(p => p.id !== planKey);
    const videosPerWeek = plan.videosPerWeek || '';
    const videosPerMonth = plan.videosPerMonth || '';

    return `
      <div id="goal-plan-${isB ? 'b' : 'a'}-form">
        <div class="plan-config-plan-head">
          <span class="plan-config-plan-badge" style="background:${accent};"><svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-flag"/></svg> ${escapeHtml(plan.label)}</span>
          <span class="plan-config-plan-role">${isB ? 'Parallel' : 'Main'} <b>Subject Goal</b></span>
        </div>

        <form id="goal-form${suffix}" onsubmit="return false;" class="plan-config-form">
          <div class="plan-config-hint">
            <svg class="material-symbols-outlined"><use href="#fmd-i-calculate"/></svg>
            <span id="smart-math-text${suffix}">Pick a subject — pace &amp; deadline auto-synchronize from there.</span>
          </div>

          <div class="plan-config-field">
            <label class="plan-config-label" for="select-target-subject${suffix}">Priority Target Subject</label>
            <div class="plan-config-select-wrap">
              <select id="select-target-subject${suffix}" class="plan-config-input"></select>
              <svg class="material-symbols-outlined"><use href="#fmd-i-expand_more"/></svg>
            </div>
          </div>

          <div class="plan-config-field">
            <div class="plan-config-field-head">
              <label class="plan-config-label" style="margin:0;">Focus Chapter <span id="chapters-count${suffix}" class="plan-config-chips-count"></span></label>
            </div>
            <div class="plan-config-hint" style="margin:4px 0 8px 0;">
              <svg class="material-symbols-outlined" style="font-size:15px;"><use href="#fmd-i-filter_alt"/></svg>
              <span>Pick a single chapter to focus on, or keep All Chapters for the full subject.</span>
            </div>
            <div class="plan-config-chips" id="chapter-chips${suffix}"></div>
          </div>

          <div class="plan-config-field">
            <div class="plan-config-hint" style="margin:0;">
              <svg class="material-symbols-outlined" style="font-size:18px;"><use href="#fmd-i-auto_stories"/></svg>
              <span>Syllabus source: <b id="goal-source-label${suffix}"></b>. Change it from <b>Profile → Settings → Study Source</b>.</span>
            </div>
          </div>

          <div class="plan-config-field">
            <div class="plan-config-field-head">
              <label class="plan-config-label" for="input-target-date${suffix}" style="margin:0;">Target Deadline</label>
              <span id="days-remaining-badge${suffix}" class="plan-config-badge">Not set</span>
            </div>
            <input type="date" id="input-target-date${suffix}" value="${escapeAttr(plan.targetDate || '')}" class="plan-config-input">
          </div>

          <div id="fields-video-mode${suffix}" class="plan-config-pace-grid" style="display:grid;">
            <div class="plan-config-pace">
              <div class="plan-config-pace-top"><span class="plan-config-pace-label">Daily</span><span class="plan-config-pace-unit">vids</span></div>
              <div class="plan-config-pace-input-wrap">
                <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode${suffix}">&#8722;</button>
                <input type="number" min="1" id="input-videos-per-day${suffix}" value="${escapeAttr(plan.videosPerDay || '')}" class="plan-config-pace-input">
                <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode${suffix}">+</button>
              </div>
              <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-daily${suffix}" checked><svg class="ms material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg><span>On</span></label>
            </div>
            <div class="plan-config-pace">
              <div class="plan-config-pace-top"><span class="plan-config-pace-label">Weekly</span><span class="plan-config-pace-unit">vids</span></div>
              <div class="plan-config-pace-input-wrap">
                <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode${suffix}">&#8722;</button>
                <input type="number" min="1" id="input-videos-per-week${suffix}" value="${escapeAttr(videosPerWeek)}" class="plan-config-pace-input">
                <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode${suffix}">+</button>
              </div>
              <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-weekly${suffix}" checked><svg class="ms material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg><span>On</span></label>
            </div>
            <div class="plan-config-pace">
              <div class="plan-config-pace-top"><span class="plan-config-pace-label">Monthly</span><span class="plan-config-pace-unit">vids</span></div>
              <div class="plan-config-pace-input-wrap">
                <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode${suffix}">&#8722;</button>
                <input type="number" min="1" id="input-videos-per-month${suffix}" value="${escapeAttr(videosPerMonth)}" class="plan-config-pace-input">
                <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode${suffix}">+</button>
              </div>
              <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-monthly${suffix}" checked><svg class="ms material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg><span>On</span></label>
            </div>
          </div>

          <div class="plan-config-guide math-guide-card">
            <div class="plan-config-guide-header math-guide-header">
              <svg class="material-symbols-outlined"><use href="#fmd-i-info"/></svg>
              <span>How ${escapeHtml(plan.label)} Date &amp; Pace Auto-Synchronize</span>
              <svg class="material-symbols-outlined plan-config-guide-arrow math-guide-toggle-icon"><use href="#fmd-i-expand_more"/></svg>
            </div>
            <div class="plan-config-guide-body math-guide-body">
              <strong>Auto-Synchronization:</strong><br>
              &bull; Selecting a <strong>Target Date</strong> auto-calculates ${escapeHtml(plan.label)} <strong>Daily Pace</strong>.<br>
              &bull; Changing <strong>Daily Pace</strong> auto-updates ${escapeHtml(plan.label)} <strong>Target Date</strong>.
            </div>
          </div>

          <div class="plan-config-actions">
            <button type="button" class="plan-config-btn plan-config-btn-prim" id="btn-apply-goals${suffix}">
              <svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg>
              <span>Save &amp; Apply ${escapeHtml(plan.label)} Target</span>
            </button>
            ${canDisableAlways ? `
              <button type="button" class="plan-config-btn plan-config-btn-danger" id="btn-disable-plan${isB ? '-b' : '-a'}">
                <svg class="material-symbols-outlined"><use href="#fmd-i-disabled_by_default"/></svg>
                <span>Disable ${escapeHtml(plan.label)}${otherPlan ? ` — run ${escapeHtml(otherPlan.label)} only` : ''}</span>
              </button>
            ` : ''}
          </div>
        </form>
      </div>
    `;
  }

  // --- Sheet init (wire the currently rendered tab) ---
  function initPlanConfig() {
    const isB = (sheetTab === 'plan_b');
    const suffix = isB ? '-b' : '';
    const subSelect = document.getElementById('select-target-subject' + suffix);
    const srcLabelEl = document.getElementById('goal-source-label' + suffix);
    const sid = state.activeSource || 'marrow_8';
    const plan = getPlan(sheetTab);

    // Close button
    const closeBtn = document.getElementById('spc-sheet-close');
    if (closeBtn) closeBtn.onclick = () => closePlanConfigSheet();

    // Tabs
    document.querySelectorAll('.spc-tab').forEach(btn => {
      btn.onclick = () => {
        sheetTab = btn.getAttribute('data-spc-tab');
        renderPlanConfigSheet();
      };
    });

    // Add-plan intro buttons
    const addBtn = document.getElementById('spc-add-plan');
    if (addBtn) {
      addBtn.onclick = () => {
        const key = addBtn.getAttribute('data-add-plan');
        if (hasPlan(key)) return;
        const isNewPlan = key === 'plan_b'
          ? DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT)
          : DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT);
        if (key === 'plan_b') state.plans.push(isNewPlan);
        else state.plans.unshift(isNewPlan);
        saveState();
        showToast(`${key === 'plan_b' ? 'Plan B' : 'Plan A'} added — set its target.`, 'flag', 'Plan Added');
        renderPlanConfigSheet();
      };
    }

    if (!plan) return; // add-intro tab — nothing further to wire

    function renderSubjectOptionsFor(sourceId, selectEl, preferredValue) {
      if (!selectEl) return null;
      const stats = getSyllabusStatsForSource(sourceId);
      const subs = stats.subjectsStats || [];
      // A leading placeholder so a fresh plan never silently selects a subject.
      let html = '<option value="">— Select a subject —</option>';
      if (subs.length > 0) {
        html += subs.map(s => `
          <option value="${s.name}">${s.name} (${s.totalVideos} Videos • ${s.totalHours}h)</option>
        `).join('');
      } else {
        html = '<option value="">No subjects available</option>';
      }
      selectEl.innerHTML = html;
      if (preferredValue && selectEl.querySelector(`option[value="${preferredValue}"]`)) {
        selectEl.value = preferredValue;
      } else {
        selectEl.selectedIndex = 0;
      }
      return stats;
    }

    if (srcLabelEl) {
      const src = STUDY_SOURCES.find(s => s.id === sid);
      srcLabelEl.textContent = src ? src.label : 'Marrow Edition 8';
    }
    renderSubjectOptionsFor(sid, subSelect, plan.targetSubject || '');
    if (subSelect && plan.targetSubject && subSelect.querySelector(`option[value="${plan.targetSubject}"]`)) {
      subSelect.value = plan.targetSubject;
    }

    const dateInput = document.getElementById('input-target-date' + suffix);
    const vidsInput = document.getElementById('input-videos-per-day' + suffix);

    // --- Focus Chapter: render + wire single-select chips ---
    function updateChapterCount(isPlanBTab, total) {
      const countEl = document.getElementById(isPlanBTab ? 'chapters-count-b' : 'chapters-count-a');
      if (!countEl) return;
      const container = document.getElementById(isPlanBTab ? 'chapter-chips-b' : 'chapter-chips-a');
      const allChip = container ? container.querySelector('.plan-config-chip[data-chap="__all__"]') : null;
      if (allChip && allChip.classList.contains('selected')) {
        countEl.textContent = 'All chapters';
      } else {
        const selChip = container ? container.querySelector('.plan-config-chip.selected[data-chap]:not([data-chap="__all__"])') : null;
        countEl.textContent = selChip ? `1 of ${total || 0}` : 'All chapters';
      }
    }

    function renderUnitChips(planKeyTab, subjectVal) {
      const isPlanBChip = (planKeyTab === 'plan_b');
      const container = document.getElementById(isPlanBChip ? 'chapter-chips-b' : 'chapter-chips-a');
      if (!container) return;
      const idx = isPlanBChip ? 1 : 0;
      const planObj = getPlan(planKeyTab);

      const sidChip = state.activeSource || 'marrow_8';
      let chapters = [];
      try {
        const dataset = getDataset();
        const sub = dataset.find(s => s && (s.subject === subjectVal || s.id === subjectVal));
        chapters = (sub && sub.chapters) ? sub.chapters : [];
      } catch (e) {
        chapters = [];
      }

      if (chapters.length === 0) {
        container.innerHTML = subjectVal
          ? '<div class="plan-config-chips-empty">No chapters found for this subject.</div>'
          : '<div class="plan-config-chips-empty">Select a subject to see its chapters.</div>';
        updateChapterCount(isPlanBChip, 0);
        return;
      }

      const savedUnits = (planObj && Array.isArray(planObj.targetUnits) && planObj.targetUnits.length > 0)
        ? planObj.targetUnits.map(u => String(u)) : null;

      // Single focus per plan: exactly one saved chapter -> select it; anything else (none or legacy multi) -> All Chapters.
      let focusedName = null;
      if (savedUnits && savedUnits.length === 1) {
        const match = chapters.find(c => c && String(c.name) === savedUnits[0]);
        if (match) focusedName = String(match.name);
      }

      const searchId = `plan-config-chapter-search-${isPlanBChip ? 'b' : 'a'}`;
      const allChip = `<button type="button" class="plan-config-chip ${focusedName ? '' : 'selected'}" data-chap="__all__"><svg class="material-symbols-outlined" style="font-size:15px;"><use href="#fmd-i-select_all"/></svg><span>All Chapters</span></button>`;

      container.innerHTML = `
        <div class="plan-config-chips-search">
          <svg class="material-symbols-outlined" style="font-size:16px; color:var(--text-muted);"><use href="#fmd-i-search"/></svg>
          <input type="text" id="${searchId}" placeholder="Search chapters..." style="flex:1; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:8px 12px; font-family:'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size:0.85rem; color:var(--text-primary);" autocomplete="off">
        </div>
        <div class="plan-config-chips-list" style="max-height:280px; overflow-y:auto;">${allChip + chapters.map(c => {
        const name = String(c.name);
        const on = (focusedName === name);
        const vcount = (c.videos && c.videos.length) || 0;
        return `<button type="button" class="plan-config-chip ${on ? 'selected' : ''}" data-chap="${name}"><span>${name}</span><span class="plan-config-chip-vids">${vcount}</span></button>`;
      }).join('')}</div>
      `;

      // Search filter
      const searchInput = document.getElementById(searchId);
      const chipList = container.querySelector('.plan-config-chips-list');
      if (searchInput && chipList) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase().trim();
          chipList.querySelectorAll('.plan-config-chip').forEach(chip => {
            const name = chip.querySelector('span')?.textContent?.toLowerCase() || '';
            const match = q === '' || name.includes(q);
            chip.style.display = match ? 'inline-flex' : 'none';
          });
        });
      }

      chipList.querySelectorAll('.plan-config-chip').forEach(chip => {
        chip.onclick = () => {
          if (chip.classList.contains('selected')) {
            if (chip.getAttribute('data-chap') !== '__all__') {
              // Deselect a focused chapter -> back to full subject
              container.querySelectorAll('.plan-config-chip').forEach(c => c.classList.remove('selected'));
              container.querySelector('.plan-config-chip[data-chap="__all__"]')?.classList.add('selected');
            }
          } else {
            container.querySelectorAll('.plan-config-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
          }
          updateChapterCount(isPlanBChip, chapters.length);
          synchronizeModalPace('subjectChange', planKeyTab);
        };
      });

      updateChapterCount(isPlanBChip, chapters.length);
    }

    renderUnitChips(sheetTab, subSelect ? subSelect.value : '');

    // --- Save plan action ---
    // The site waits for the user: subject, deadline and daily pace must all
    // be filled in before a plan is saved — nothing is assumed.
    const btnApply = document.getElementById('btn-apply-goals' + suffix);
    if (btnApply) {
      btnApply.onclick = () => {
        const planObj = getPlan(sheetTab);
        if (!planObj) return;
        const newSubject = subSelect ? subSelect.value : '';
        const newDate = dateInput ? dateInput.value : '';
        const newVids = parseInt(vidsInput ? vidsInput.value : '', 10);
        if (!newSubject) { showToast(`Select a priority target subject for ${planObj.label}.`, 'error', 'Incomplete Target'); return; }
        if (!newDate) { showToast(`Pick a target deadline date for ${planObj.label}.`, 'error', 'Incomplete Target'); return; }
        if (!newVids || newVids < 1) { showToast(`Enter the daily video pace for ${planObj.label} (min 1).`, 'error', 'Incomplete Target'); return; }
        state.isConfigured = true;
        const idx = state.plans.indexOf(planObj);
        const prevSubject = planObj.targetSubject;
        planObj.targetSubject = newSubject;
        planObj.targetDate = newDate;
        planObj.videosPerDay = newVids;
        planObj.videosPerWeek = newVids * 7;
        planObj.videosPerMonth = newVids * 30;
        const prevUnits = planObj.targetUnits;
        planObj.targetUnits = getSelectedUnitsForPlanKey(isB);
        if (prevSubject !== newSubject) {
          // Subject changed: reset queue state so the daily quest reloads a
          // fresh batch at the normal pace (not stuck in 1-at-a-time extra mode)
          planObj.queueBatchVideoIds = [];
          planObj.queueCompletedInBatch = 0;
          planObj.extraBatchesCompletedToday = 0;
          planObj.lastBatchDate = '';
        } else if ((prevUnits || []).join('|') !== (planObj.targetUnits || []).join('|')) {
          planObj.queueBatchVideoIds = [];
          planObj.queueCompletedInBatch = 0;
          planObj.extraBatchesCompletedToday = 0;
        }

        // Keep the primary plan mirrored into legacy state.goals (analytics
        // and the cloud field still read it).
        if (state.plans[idx] && state.plans[idx].id === 'plan_a') {
          state.goals.targetSubject = planObj.targetSubject;
          state.goals.targetDate = planObj.targetDate;
          state.goals.videosPerDay = planObj.videosPerDay;
          state.goals.videosPerWeek = planObj.videosPerWeek;
          state.goals.videosPerMonth = planObj.videosPerMonth;
        }

        saveState();
        showToast(`${planObj.label} Target Configured & Saved!`, 'check_circle', `${planObj.label} Updated`);
        closePlanConfigSheet();
      };
    }

    // --- Disable plan action (run the other plan alone) ---
    const btnDisable = document.getElementById('btn-disable-plan' + (isB ? '-b' : '-a'));
    if (btnDisable) {
      btnDisable.onclick = () => {
        const planObj = getPlan(sheetTab);
        if (!planObj) return;
        // Disabling the last plan is allowed: the state becomes plan-less and
        // the queue engine lazily re-seeds an UNSET plan_a (same as fresh).
        state.plans = state.plans.filter(p => p.id !== planObj.id);
        if (state.activePlanId === planObj.id) {
          state.activePlanId = state.plans[0] ? state.plans[0].id : 'plan_a';
        }
        saveState();
        showToast(`${planObj.label} disabled.`, 'info', 'Single Plan Mode');
        sheetTab = state.plans[0] ? state.plans[0].id : 'plan_a';
        renderPlanConfigSheet();
      };
    }

    // --- Subject & Pace Listeners ---
    if (subSelect) subSelect.onchange = () => {
      renderUnitChips(sheetTab, subSelect.value);
      synchronizeModalPace('subjectChange', sheetTab);
    };
    if (dateInput) dateInput.oninput = () => synchronizeModalPace('date', sheetTab);
    if (vidsInput) vidsInput.oninput = () => synchronizeModalPace('dailyVids', sheetTab);

    // --- Topics section wiring (mode switch + manual list) ---
    wireTopicsSection();

    // Math Guide Accordion Toggles
    document.querySelectorAll('#plan-config-sheet-content .math-guide-card').forEach(card => {
      const header = card.querySelector('.math-guide-header');
      const body = card.querySelector('.math-guide-body');
      const icon = card.querySelector('.math-guide-toggle-icon');
      if (header && body) {
        header.onclick = () => {
          const isHidden = (body.style.display === 'none' || !body.style.display);
          body.style.display = isHidden ? 'block' : 'none';
          if (icon && window.FlowMD.icons) window.FlowMD.icons.setIcon(icon, isHidden ? 'expand_less' : 'expand_more');
        };
      }
    });

    // Stepper buttons (±) for the pace inputs
    document.querySelectorAll('#plan-config-sheet-content .plan-config-step').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const wrap = btn.closest('.plan-config-pace-input-wrap');
        const input = wrap ? wrap.querySelector('.plan-config-pace-input') : null;
        if (!input) return;
        const isPlus = btn.textContent.trim() === '+';
        const step = parseFloat(input.step) || 1;
        const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
        const max = input.max !== '' ? parseFloat(input.max) : Infinity;
        let val = (parseFloat(input.value) || 0) + (isPlus ? step : -step);
        val = Math.min(max, Math.max(min, val));
        input.value = val;
        const isDaily = /per-day/.test(input.id);
        if (isDaily) {
          synchronizeModalPace('dailyVids', sheetTab);
        } else {
          const vidsWeek = document.getElementById('input-videos-per-week' + suffix);
          const vidsMonth = document.getElementById('input-videos-per-month' + suffix);
          const day = document.getElementById('input-videos-per-day' + suffix);
          if (day && day.value) { const d = parseFloat(day.value); if (d > 0) { if (vidsWeek) vidsWeek.value = Math.max(1, Math.round(d * 7)); if (vidsMonth) vidsMonth.value = Math.max(1, Math.round(d * 30)); } }
        }
      };
    });

    synchronizeModalPace('init', sheetTab);
  }

  // --- Topics helpers ---
  // Look a manual task video's subject up on the whole active dataset (it may
  // belong to no plan's target subject at all).
  function findVideoSubjectId(videoId) {
    const dataset = getDataset();
    for (const sub of dataset) {
      for (const chap of (sub.chapters || [])) {
        for (const v of (chap.videos || [])) {
          if (v.id === videoId) return sub.id;
        }
      }
    }
    return null;
  }

  // Re-render just the Topics section in place (mode flip, tick, remove) —
  // the open form, focus and scroll position survive.
  function refreshTopicsSection() {
    const activeTab = sheetTab;
    const sections = document.querySelectorAll('#plan-config-sheet-content .spc-topics-section');
    if (!sections.length) return;
    // Render into a detached container, then swap in the fresh section so
    // everything after it (nothing yet) and before it stays untouched.
    const tmp = document.createElement('div');
    tmp.innerHTML = renderTopicsSection(activeTab);
    const fresh = tmp.firstElementChild;
    sections[0].replaceWith(fresh);
    // Re-wire the topics interactions with the same init path.
    wireTopicsSection();
  }

  function wireTopicsSection() {
    const modeSwitch = document.getElementById('spc-daily-tasks-mode-switch');
    if (modeSwitch) {
      modeSwitch.querySelectorAll('.spc-mode-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-spc-mode');
          if (mode === state.dailyTasksMode) return;
          setDailyTasksMode(mode);
          refreshTopicsSection();
        });
      });
    }
    document.getElementById('spc-btn-add-task-topic')?.addEventListener('click', () => {
      if (window.FlowMD.search && window.FlowMD.search.openSpotlightModal) {
        window.FlowMD.search.openSpotlightModal();
      }
    });
    document.querySelectorAll('[data-spc-remove-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeManualTaskVideo(btn.getAttribute('data-spc-remove-task'));
        showToast('Removed from Daily Tasks', 'info');
        refreshTopicsSection();
      });
    });
    document.querySelectorAll('.spc-manual-task-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        const subjectId = findVideoSubjectId(vidId);
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true, subjectId);
          showToast('Task completed!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false, subjectId);
        }
        saveState();
        refreshTopicsSection();
      });
    });
  }

  function synchronizeModalPace(source, planKey = 'plan_a') {
    const isPlanB = (planKey === 'plan_b');
    const suffix = isPlanB ? '-b' : '';
    const subSelect = document.getElementById('select-target-subject' + suffix);
    const selectedSubVal = subSelect ? subSelect.value : '';
    const modalSource = state.activeSource || 'marrow_8';
    const selectedUnits = getSelectedUnitsForPlanKey(isPlanB);
    const metrics = getMetricsForModalScope(selectedSubVal, selectedUnits, modalSource);

    const dateInput = document.getElementById('input-target-date' + suffix);
    const badge = document.getElementById('days-remaining-badge' + suffix);
    const bannerText = document.getElementById('smart-math-text' + suffix);
    const vidsInput = document.getElementById('input-videos-per-day' + suffix);

    let now = new Date();
    const planObj = getPlan(planKey) || {};

    if (source === 'init' || source === 'subjectChange') {
      if (!selectedSubVal) {
        // No subject picked yet — wait for the user; never assume a pace or
        // deadline for an unconfigured plan.
        if (badge) badge.textContent = 'Not set';
        return;
      }
      const existingPace = planObj.videosPerDay;
      if (existingPace && existingPace > 0) {
        // A real (user-entered) pace exists — keep it and auto-sync the
        // deadline from it.
        const daysNeeded = Math.ceil(metrics.remainingVideos / existingPace);
        const targetDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
        if (dateInput) dateInput.value = toLocalDateKey(targetDate);
      } else if (!dateInput || !dateInput.value) {
        // Neither pace nor deadline is set yet — wait for the user. The site
        // must not invent a daily/weekly/monthly pace or a deadline.
        if (badge) badge.textContent = 'Not set';
        if (bannerText) bannerText.textContent = 'Enter your daily pace or pick a deadline — FlowMD auto-syncs the other.';
        return;
      }
      // else: the user already entered a deadline — fall through so the pace
      // auto-syncs from that real date.
    }

    let targetDate = new Date(dateInput ? dateInput.value : '2026-12-31');
    const isPast = (targetDate <= now);
    if (isNaN(targetDate.getTime()) || targetDate <= now) {
      targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    let days = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));

    if (source === 'dailyVids') {
      const userVids = Math.max(1, parseInt(vidsInput ? vidsInput.value : 1, 10) || 1);
      days = Math.ceil(metrics.remainingVideos / userVids);
      targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = toLocalDateKey(targetDate);
    }

    if (badge) badge.textContent = `${days} Days Left`;

    const dailyVids = Math.max(1, Math.ceil(metrics.remainingVideos / days));
    const weeklyVids = dailyVids * 7;
    const monthlyVids = dailyVids * 30;

    if (source !== 'dailyVids' && vidsInput) vidsInput.value = dailyVids;
    const vidsWeekEl = document.getElementById('input-videos-per-week' + suffix);
    if (vidsWeekEl) vidsWeekEl.value = weeklyVids;
    const vidsMonthEl = document.getElementById('input-videos-per-month' + suffix);
    if (vidsMonthEl) vidsMonthEl.value = monthlyVids;

    const dateFormatted = targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (bannerText) {
      if (isPast) {
        bannerText.textContent = `⚠️ Target deadline has passed. Update daily target to auto-generate completion date.`;
      } else {
        const daysToFinish = Math.ceil(metrics.remainingVideos / dailyVids);
        const scopedNote = (metrics.scopedChapters > 0 && metrics.totalChapters > 0 && metrics.scopedChapters < metrics.totalChapters)
          ? ` (${metrics.scopedChapters} chapters)` : '';
        if (daysToFinish < days) {
          bannerText.textContent = `🎉 Comfortably Ahead! Finish ${selectedSubVal}${scopedNote} in ${daysToFinish} days.`;
        } else {
          bannerText.textContent = `🎯 Right on Track! ${dailyVids} vids/day finishes ${selectedSubVal}${scopedNote} on ${dateFormatted}.`;
        }
      }
    }
  }

  // --- Focus helper (analytics / profile / dashboard CTAs) ---
  function focusStudyPlanConfig() {
    if (window.FlowMD.shell) window.FlowMD.shell.switchView('dashboard');
    openPlanConfigSheet();
  }

  // Expose
  window.FlowMD.planConfig = {
    renderPlanConfigSheet,
    openPlanConfigSheet,
    closePlanConfigSheet,
    initPlanConfig,
    synchronizeModalPace,
    focusStudyPlanConfig,
    getSelectedUnitsForPlanKey,
    refreshTopicsSection
  };
})();
