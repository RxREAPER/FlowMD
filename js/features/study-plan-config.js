/* ============================================================
   FlowMD Features — Study Plan Config
   The always-visible inline config card + the dual-plan goal
   wizard (subject select, chapter chips, pace sync, A/B apply).

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState } = window.FlowMD.store;
  const { getDataset, getSourceLabel } = window.FlowMD.sourceData;
  const { getSyllabusStatsForSource, getSubjectOrSyllabusMetrics, getMetricsForModalScope } = window.FlowMD.metrics;
  const { STUDY_SOURCES, DEFAULT_PLAN, PLAN_A_ACCENT, PLAN_B_ACCENT, toLocalDateKey, escapeHtml, escapeAttr, FLOWMD_ICONS } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // --- Study Plan Config: always-visible inline form card ---
  function renderStudyPlanConfigCard() {
    return `
      <section id="study-plan-config" class="study-plan-config-section" aria-label="Study plan configuration">
        <div class="spc-header">
          <h2 class="spc-title">Study Plan Configuration</h2>
          <p class="spc-sub">Set your daily pace, target deadline &amp; dual-track goals. Everything auto-synchronizes.</p>
        </div>

        <div class="spc-body">
          <!-- Plan Selector Dropdown + Dual-Track Toggle -->
          <div class="spc-toolbar">
            <div class="spc-plan-select-wrap">
              <span class="material-symbols-outlined spc-flag-icon">flag</span>
              <select id="goal-plan-select" class="plan-config-input spc-plan-select" aria-label="Select plan to configure">
                <option value="plan_a">Plan A — Primary Target</option>
              </select>
              <span class="material-symbols-outlined spc-select-arrow">expand_more</span>
            </div>
            <label class="plan-config-dual spc-dual-toggle">
              <input type="checkbox" id="toggle-plan-b">
              <span class="plan-config-switch"><i></i></span>
              <span class="plan-config-dual-label">Dual-Track</span>
            </label>
          </div>

          <!-- PLAN A FORM -->
          <div id="goal-plan-a-form">
            <div class="plan-config-plan-head">
              <span class="plan-config-plan-badge"><span class="material-symbols-outlined" style="font-size:16px;">flag</span> Plan A — Primary Target</span>
              <span class="plan-config-plan-role">Main <b>Subject Goal</b></span>
            </div>

            <form id="goal-form-a" onsubmit="return false;" class="plan-config-form">
              <div class="plan-config-hint">
                <span class="material-symbols-outlined">calculate</span>
                <span id="smart-math-text">Pick a subject — pace &amp; deadline auto-synchronize from there.</span>
              </div>

              <div class="plan-config-field">
                <label class="plan-config-label" for="select-target-subject">Priority Target Subject</label>
                <div class="plan-config-select-wrap">
                  <select id="select-target-subject" class="plan-config-input"></select>
                  <span class="material-symbols-outlined">expand_more</span>
                </div>
              </div>

              <div class="plan-config-field">
                <div class="plan-config-field-head">
                  <label class="plan-config-label" style="margin:0;">Focus Chapter <span id="chapters-count-a" class="plan-config-chips-count"></span></label>
                </div>
                <div class="plan-config-hint" style="margin:4px 0 8px 0;">
                  <span class="material-symbols-outlined" style="font-size:15px;">filter_alt</span>
                  <span>Pick a single chapter to focus on, or keep All Chapters for the full subject.</span>
                </div>
                <div class="plan-config-chips" id="chapter-chips-a"></div>
              </div>

              <div class="plan-config-field">
                <div class="plan-config-hint" style="margin:0;">
                  <span class="material-symbols-outlined" style="font-size:18px;">auto_stories</span>
                  <span>Syllabus source: <b id="goal-source-label">Marrow Edition 8</b>. Change it from <b>Profile → Settings → Study Source</b>.</span>
                </div>
              </div>

              <div class="plan-config-field">
                <div class="plan-config-field-head">
                  <label class="plan-config-label" for="input-target-date" style="margin:0;">Target Deadline</label>
                  <span id="days-remaining-badge" class="plan-config-badge">Not set</span>
                </div>
                <input type="date" id="input-target-date" value="" class="plan-config-input">
              </div>

              <div id="fields-video-mode" class="plan-config-pace-grid" style="display:grid;">
                <div class="plan-config-pace">
                  <div class="plan-config-pace-top"><span class="plan-config-pace-label">Daily</span><span class="plan-config-pace-unit">vids</span></div>
                  <div class="plan-config-pace-input-wrap">
                    <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-day" value="" class="plan-config-pace-input">
                    <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode">+</button>
                  </div>
                  <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-daily" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="plan-config-pace">
                  <div class="plan-config-pace-top"><span class="plan-config-pace-label">Weekly</span><span class="plan-config-pace-unit">vids</span></div>
                  <div class="plan-config-pace-input-wrap">
                    <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-week" value="" class="plan-config-pace-input">
                    <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode">+</button>
                  </div>
                  <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-weekly" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="plan-config-pace">
                  <div class="plan-config-pace-top"><span class="plan-config-pace-label">Monthly</span><span class="plan-config-pace-unit">vids</span></div>
                  <div class="plan-config-pace-input-wrap">
                    <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-month" value="" class="plan-config-pace-input">
                    <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode">+</button>
                  </div>
                  <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-monthly" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
              </div>

              
              <div class="plan-config-guide math-guide-card">
                <div class="plan-config-guide-header math-guide-header">
                  <span class="material-symbols-outlined">info</span>
                  <span>How Plan A Date &amp; Pace Auto-Synchronize</span>
                  <span class="material-symbols-outlined plan-config-guide-arrow math-guide-toggle-icon">expand_more</span>
                </div>
                <div class="plan-config-guide-body math-guide-body">
                  <strong>Auto-Synchronization:</strong><br>
                  &bull; Selecting a <strong>Target Date</strong> auto-calculates Plan A <strong>Daily Pace</strong>.<br>
                  &bull; Changing <strong>Daily Pace</strong> auto-updates Plan A <strong>Target Date</strong>.
                </div>
              </div>

              <div class="plan-config-actions">
                <button type="button" class="plan-config-btn plan-config-btn-prim" id="btn-apply-goals">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Save &amp; Apply Plan A Target</span>
                </button>
              </div>
            </form>
          </div>

          <!-- PLAN B FORM -->
          <div id="goal-plan-b-form" style="display:none;">
            <div class="plan-config-plan-head">
              <span class="plan-config-plan-badge"><span class="material-symbols-outlined" style="font-size:16px;">flag</span> Plan B — Secondary Target</span>
              <span class="plan-config-plan-role">Parallel <b>Subject Goal</b></span>
            </div>

            <form id="goal-form-b" onsubmit="return false;" class="plan-config-form">
              <div class="plan-config-hint">
                <span class="material-symbols-outlined">calculate</span>
                <span id="smart-math-text-b">Pick a subject — pace &amp; deadline auto-synchronize from there.</span>
              </div>

              <div class="plan-config-field">
                <label class="plan-config-label" for="select-target-subject-b">Priority Target Subject</label>
                <div class="plan-config-select-wrap">
                  <select id="select-target-subject-b" class="plan-config-input"></select>
                  <span class="material-symbols-outlined">expand_more</span>
                </div>
              </div>

              <div class="plan-config-field">
                <div class="plan-config-field-head">
                  <label class="plan-config-label" style="margin:0;">Focus Chapter <span id="chapters-count-b" class="plan-config-chips-count"></span></label>
                </div>
                <div class="plan-config-hint" style="margin:4px 0 8px 0;">
                  <span class="material-symbols-outlined" style="font-size:15px;">filter_alt</span>
                  <span>Pick a single chapter to focus on, or keep All Chapters for the full subject.</span>
                </div>
                <div class="plan-config-chips" id="chapter-chips-b"></div>
              </div>

              <div class="plan-config-field">
                <div class="plan-config-field-head">
                  <label class="plan-config-label" for="input-target-date-b" style="margin:0;">Target Deadline</label>
                  <span id="days-remaining-badge-b" class="plan-config-badge">Not set</span>
                </div>
                <input type="date" id="input-target-date-b" value="" class="plan-config-input">
              </div>

              <div id="fields-video-mode-b" class="plan-config-pace-grid" style="display:grid;">
                <div class="plan-config-pace">
                  <div class="plan-config-pace-top"><span class="plan-config-pace-label">Daily</span><span class="plan-config-pace-unit">vids</span></div>
                  <div class="plan-config-pace-input-wrap">
                    <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode-b">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-day-b" value="" class="plan-config-pace-input">
                    <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode-b">+</button>
                  </div>
                  <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-daily-b" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="plan-config-pace">
                  <div class="plan-config-pace-top"><span class="plan-config-pace-label">Weekly</span><span class="plan-config-pace-unit">vids</span></div>
                  <div class="plan-config-pace-input-wrap">
                    <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode-b">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-week-b" value="" class="plan-config-pace-input">
                    <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode-b">+</button>
                  </div>
                  <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-weekly-b" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
                <div class="plan-config-pace">
                  <div class="plan-config-pace-top"><span class="plan-config-pace-label">Monthly</span><span class="plan-config-pace-unit">vids</span></div>
                  <div class="plan-config-pace-input-wrap">
                    <button type="button" class="plan-config-step" data-step-index="0" data-step-fields="fields-video-mode-b">&#8722;</button>
                    <input type="number" min="1" id="input-videos-per-month-b" value="" class="plan-config-pace-input">
                    <button type="button" class="plan-config-step" data-step-index="2" data-step-fields="fields-video-mode-b">+</button>
                  </div>
                  <label class="plan-config-pace-tick"><input type="checkbox" id="toggle-card-monthly-b" checked><span class="ms material-symbols-outlined">check_circle</span><span>On</span></label>
                </div>
              </div>

              
              <div class="plan-config-guide math-guide-card">
                <div class="plan-config-guide-header math-guide-header">
                  <span class="material-symbols-outlined">info</span>
                  <span>How Plan B Date &amp; Pace Auto-Synchronize</span>
                  <span class="material-symbols-outlined plan-config-guide-arrow math-guide-toggle-icon">expand_more</span>
                </div>
                <div class="plan-config-guide-body math-guide-body">
                  <strong>Auto-Synchronization:</strong><br>
                  &bull; Selecting a <strong>Target Date</strong> auto-calculates Plan B <strong>Daily Pace</strong>.<br>
                  &bull; Changing <strong>Daily Pace</strong> auto-updates Plan B <strong>Target Date</strong>.
                </div>
              </div>

              <div class="plan-config-actions">
                <button type="button" class="plan-config-btn plan-config-btn-prim" id="btn-apply-goals-b">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Save &amp; Apply Plan B Target</span>
                </button>
                <button type="button" class="plan-config-btn plan-config-btn-danger" id="btn-remove-plan-b">
                  <span class="material-symbols-outlined">disabled_by_default</span>
                  <span>Disable / Remove Plan B</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>`;
  }

  // --- View 1: Dashboard View ---

  function getSelectedUnitsForPlanKey(isPlanB) {
    const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
    if (!container) return [];
    const allChip = container.querySelector('.plan-config-chip[data-chap="__all__"]');
    if (allChip && allChip.classList.contains('selected')) return [];
    const selChip = container.querySelector('.plan-config-chip.selected[data-chap]');
    const name = selChip ? selChip.getAttribute('data-chap') : null;
    return (name && name !== '__all__') ? [name] : [];
  }

  // --- Goal Modal Helpers (Dual-Plan Fully Functional) ---
  function focusStudyPlanConfig() {
    if (state.currentView !== 'dashboard') {
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('dashboard');
    }
    const card = document.getElementById('study-plan-config');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initStudyPlanConfig() {
    const subSelectA = document.getElementById('select-target-subject');
    const subSelectB = document.getElementById('select-target-subject-b');
    const srcLabelEl = document.getElementById('goal-source-label');
    const sid = state.activeSource || 'marrow_8';

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

    function populateSubjectUI() {
      if (srcLabelEl) {
        const src = STUDY_SOURCES.find(s => s.id === sid);
        srcLabelEl.textContent = src ? src.label : 'Marrow Edition 8';
      }
      renderSubjectOptionsFor(sid, subSelectA, state.plans && state.plans[0] ? state.plans[0].targetSubject : '');
      renderSubjectOptionsFor(sid, subSelectB, state.plans && state.plans[1] ? state.plans[1].targetSubject : '');
    }

    populateSubjectUI();

    const planA = state.plans[0] || DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT);
    const hasPlanB = state.plans.length >= 2;
    const planB = hasPlanB ? state.plans[1] : DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology');

    // Populate Plan A Form
    if (subSelectA) {
      if (planA.targetSubject && subSelectA.querySelector(`option[value="${planA.targetSubject}"]`)) {
        subSelectA.value = planA.targetSubject;
      } else if (subSelectA.options.length > 0) {
        subSelectA.selectedIndex = 0;
      }
    }
    const dateInputA = document.getElementById('input-target-date');
    if (dateInputA) dateInputA.value = planA.targetDate || '';
    const vidsInputA = document.getElementById('input-videos-per-day');
    if (vidsInputA) vidsInputA.value = planA.videosPerDay || '';

    // Populate Plan B Form (no assumed subject — placeholder until chosen)
    if (subSelectB) {
      const prefB = planB.targetSubject || '';
      if (prefB && subSelectB.querySelector(`option[value="${prefB}"]`)) {
        subSelectB.value = prefB;
      } else if (subSelectB.options.length > 0) {
        subSelectB.selectedIndex = 0;
      }
    }
    const dateInputB = document.getElementById('input-target-date-b');
    if (dateInputB) dateInputB.value = planB.targetDate || '';
    const vidsInputB = document.getElementById('input-videos-per-day-b');
    if (vidsInputB) vidsInputB.value = planB.videosPerDay || '';

    // --- Focus Chapter: render + wire single-select chips ---
    function updateChapterCount(isPlanB, total) {
      const countEl = document.getElementById(isPlanB ? 'chapters-count-b' : 'chapters-count-a');
      if (!countEl) return;
      const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
      const allChip = container ? container.querySelector('.plan-config-chip[data-chap="__all__"]') : null;
      if (allChip && allChip.classList.contains('selected')) {
        countEl.textContent = 'All chapters';
      } else {
        const selChip = container ? container.querySelector('.plan-config-chip.selected[data-chap]:not([data-chap="__all__"])') : null;
        countEl.textContent = selChip ? `1 of ${total || 0}` : 'All chapters';
      }
    }

    function renderUnitChips(planKey, subjectVal) {
      const isPlanB = (planKey === 'plan_b');
      const container = document.getElementById(isPlanB ? 'chapter-chips-b' : 'chapter-chips-a');
      if (!container) return;
      const idx = isPlanB ? 1 : 0;

      const sid = state.activeSource || 'marrow_8';
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
        updateChapterCount(isPlanB, 0);
        return;
      }

      const savedUnits = (state.plans && state.plans[idx] && Array.isArray(state.plans[idx].targetUnits) && state.plans[idx].targetUnits.length > 0)
        ? state.plans[idx].targetUnits.map(u => String(u)) : null;

      // Single focus per plan: exactly one saved chapter -> select it; anything else (none or legacy multi) -> All Chapters.
      let focusedName = null;
      if (savedUnits && savedUnits.length === 1) {
        const match = chapters.find(c => c && String(c.name) === savedUnits[0]);
        if (match) focusedName = String(match.name);
      }

      const searchId = `plan-config-chapter-search-${isPlanB ? 'b' : 'a'}`;
      const allChip = `<button type="button" class="plan-config-chip ${focusedName ? '' : 'selected'}" data-chap="__all__"><span class="material-symbols-outlined" style="font-size:15px;">select_all</span><span>All Chapters</span></button>`;

      container.innerHTML = `
        <div class="plan-config-chips-search">
          <span class="material-symbols-outlined" style="font-size:16px; color:var(--text-muted);">search</span>
          <input type="text" id="${searchId}" placeholder="Search chapters..." style="flex:1; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:8px 12px; font-family:'Poppins', sans-serif; font-size:0.85rem; color:var(--text-primary);" autocomplete="off">
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
          updateChapterCount(isPlanB, chapters.length);
          synchronizeModalPace('subjectChange', planKey);
        };
      });

      updateChapterCount(isPlanB, chapters.length);
    }

    renderUnitChips('plan_a', subSelectA ? subSelectA.value : '');
    renderUnitChips('plan_b', subSelectB ? subSelectB.value : '');

    const togglePlanB = document.getElementById('toggle-plan-b');
    if (togglePlanB) togglePlanB.checked = hasPlanB;

    const planSelect = document.getElementById('goal-plan-select');
    const formA = document.getElementById('goal-plan-a-form');
    const formB = document.getElementById('goal-plan-b-form');
    const dualStatusEl = document.getElementById('spc-dual-status');

    function syncPlanSelectOptions() {
      if (!planSelect) return;
      const hasB = state.plans.length >= 2 || (togglePlanB && togglePlanB.checked);
      const optB = planSelect.querySelector('option[value="plan_b"]');
      if (hasB && !optB) {
        const opt = document.createElement('option');
        opt.value = 'plan_b';
        opt.textContent = 'Plan B — Secondary Target';
        planSelect.appendChild(opt);
      } else if (!hasB && optB) {
        optB.remove();
      }
    }

    function switchGoalTab(activePlan) {
      const isB = (activePlan === 'plan_b');
      if (planSelect) planSelect.value = isB ? 'plan_b' : 'plan_a';
      if (formA) formA.style.display = isB ? 'none' : 'block';
      if (formB) formB.style.display = isB ? 'block' : 'none';
      if (dualStatusEl) dualStatusEl.textContent = isB ? 'On' : 'Off';
      if (isB && togglePlanB && !togglePlanB.checked) {
        togglePlanB.checked = true;
        if (state.plans.length < 2) {
          state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
        }
      }
      synchronizeModalPace('init', isB ? 'plan_b' : 'plan_a');
    }

    syncPlanSelectOptions();
    if (planSelect) planSelect.onchange = () => switchGoalTab(planSelect.value);

    if (togglePlanB) {
      togglePlanB.onchange = () => {
        if (togglePlanB.checked) {
          if (state.plans.length < 2) {
            state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT, 'Pathology'));
          }
          syncPlanSelectOptions();
          switchGoalTab('plan_b');
        } else {
          if (state.plans.length >= 2) {
            state.plans.splice(1, 1);
          }
          syncPlanSelectOptions();
          switchGoalTab('plan_a');
        }
        saveState();
      };
    }

    // --- Save Plan A Action ---
    // The site waits for the user: subject, deadline and daily pace must all
    // be filled in before a plan is saved — nothing is assumed.
    const btnApplyA = document.getElementById('btn-apply-goals');
    if (btnApplyA) {
      btnApplyA.onclick = () => {
        const newSubject = subSelectA ? subSelectA.value : '';
        const newDate = dateInputA ? dateInputA.value : '';
        const newVids = parseInt(vidsInputA ? vidsInputA.value : '', 10);
        if (!newSubject) { showToast('Select a priority target subject first.', 'error', 'Incomplete Target'); return; }
        if (!newDate) { showToast('Pick a target deadline date.', 'error', 'Incomplete Target'); return; }
        if (!newVids || newVids < 1) { showToast('Enter your daily video pace (min 1).', 'error', 'Incomplete Target'); return; }
        state.isConfigured = true;
        if (!state.plans[0]) state.plans[0] = DEFAULT_PLAN('plan_a', 'Plan A', PLAN_A_ACCENT);
        const prevSubject = state.plans[0].targetSubject;
        state.plans[0].targetSubject = newSubject;
        state.plans[0].targetDate = newDate;
        state.plans[0].videosPerDay = newVids;
        state.plans[0].videosPerWeek = newVids * 7;
        state.plans[0].videosPerMonth = newVids * 30;
        const prevUnits = state.plans[0].targetUnits;
        state.plans[0].targetUnits = getSelectedUnitsForPlanKey(false);
        if (prevSubject !== newSubject) {
          // Subject changed: reset queue state so the daily quest reloads a
          // fresh batch at the normal pace (not stuck in 1-at-a-time extra mode)
          state.plans[0].queueBatchVideoIds = [];
          state.plans[0].queueCompletedInBatch = 0;
          state.plans[0].extraBatchesCompletedToday = 0;
          state.plans[0].lastBatchDate = '';
        } else if ((prevUnits || []).join('|') !== (state.plans[0].targetUnits || []).join('|')) {
          state.plans[0].queueBatchVideoIds = [];
          state.plans[0].queueCompletedInBatch = 0;
          state.plans[0].extraBatchesCompletedToday = 0;
        }

        // Keep legacy state.goals updated
        state.goals.targetSubject = state.plans[0].targetSubject;
        state.goals.targetDate = state.plans[0].targetDate;
        state.goals.videosPerDay = state.plans[0].videosPerDay;

        saveState();
        showToast('Plan A Target Configured & Saved!', 'check_circle', 'Plan A Updated');
        render();
      };
    }

    // --- Save Plan B Action (waits for user input — no assumed values) ---
    const btnApplyB = document.getElementById('btn-apply-goals-b');
    if (btnApplyB) {
      btnApplyB.onclick = () => {
        const newSubject = subSelectB ? subSelectB.value : '';
        const newDate = dateInputB ? dateInputB.value : '';
        const newVids = parseInt(vidsInputB ? vidsInputB.value : '', 10);
        if (!newSubject) { showToast('Select a priority target subject for Plan B.', 'error', 'Incomplete Target'); return; }
        if (!newDate) { showToast('Pick a target deadline date for Plan B.', 'error', 'Incomplete Target'); return; }
        if (!newVids || newVids < 1) { showToast('Enter the daily video pace for Plan B (min 1).', 'error', 'Incomplete Target'); return; }
        if (state.plans.length < 2) {
          state.plans.push(DEFAULT_PLAN('plan_b', 'Plan B', PLAN_B_ACCENT));
        }
        const prevSubject = state.plans[1].targetSubject;
        state.plans[1].targetSubject = newSubject;
        state.plans[1].targetDate = newDate;
        state.plans[1].videosPerDay = newVids;
        state.plans[1].videosPerWeek = newVids * 7;
        state.plans[1].videosPerMonth = newVids * 30;
        const prevUnits = state.plans[1].targetUnits;
        state.plans[1].targetUnits = getSelectedUnitsForPlanKey(true);
        if (prevSubject !== newSubject) {
          // Subject changed: reset queue state so the daily quest reloads a
          // fresh batch at the normal pace (not stuck in 1-at-a-time extra mode)
          state.plans[1].queueBatchVideoIds = [];
          state.plans[1].queueCompletedInBatch = 0;
          state.plans[1].extraBatchesCompletedToday = 0;
          state.plans[1].lastBatchDate = '';
        } else if ((prevUnits || []).join('|') !== (state.plans[1].targetUnits || []).join('|')) {
          state.plans[1].queueBatchVideoIds = [];
          state.plans[1].queueCompletedInBatch = 0;
          state.plans[1].extraBatchesCompletedToday = 0;
        }

        saveState();
        showToast('Plan B Target Configured & Saved!', 'check_circle', 'Plan B Updated');
        render();
      };
    }

    // --- Remove Plan B Action ---
    const btnRemoveB = document.getElementById('btn-remove-plan-b');
    if (btnRemoveB) {
      btnRemoveB.onclick = () => {
        if (state.plans.length >= 2) state.plans.splice(1, 1);
        if (togglePlanB) togglePlanB.checked = false;
        saveState();
        showToast('Plan B Target Disabled.', 'info', 'Single Plan Mode');
        switchGoalTab('plan_a');
        render();
      };
    }

    // --- Subject & Pace Listeners for Plan A ---
    if (subSelectA) subSelectA.onchange = () => {
      renderUnitChips('plan_a', subSelectA.value);
      synchronizeModalPace('subjectChange', 'plan_a');
    };
    if (dateInputA) dateInputA.oninput = () => synchronizeModalPace('date', 'plan_a');
    if (vidsInputA) vidsInputA.oninput = () => synchronizeModalPace('dailyVids', 'plan_a');

    // --- Subject & Pace Listeners for Plan B ---
    if (subSelectB) subSelectB.onchange = () => {
      renderUnitChips('plan_b', subSelectB.value);
      synchronizeModalPace('subjectChange', 'plan_b');
    };
    if (dateInputB) dateInputB.oninput = () => synchronizeModalPace('date', 'plan_b');
    if (vidsInputB) vidsInputB.oninput = () => synchronizeModalPace('dailyVids', 'plan_b');

    // Math Guide Accordion Toggles
    document.querySelectorAll('.math-guide-card').forEach(card => {
      const header = card.querySelector('.math-guide-header');
      const body = card.querySelector('.math-guide-body');
      const icon = card.querySelector('.math-guide-toggle-icon');
      if (header && body) {
        header.onclick = () => {
          const isHidden = (body.style.display === 'none' || !body.style.display);
          body.style.display = isHidden ? 'block' : 'none';
          if (icon) icon.textContent = isHidden ? 'expand_less' : 'expand_more';
        };
      }
    });

    // Stepper buttons (±) for the pace inputs
    document.querySelectorAll('#study-plan-config .plan-config-step').forEach(btn => {
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
        const isPlanB = !!btn.closest('#goal-plan-b-form');
        const planKey = isPlanB ? 'plan_b' : 'plan_a';
        const isDaily = /per-day|daily-target/.test(input.id);
        if (isDaily) {
          synchronizeModalPace('dailyVids', planKey);
        } else {
          const vidsWeek = document.getElementById(isPlanB ? 'input-videos-per-week-b' : 'input-videos-per-week');
          const vidsMonth = document.getElementById(isPlanB ? 'input-videos-per-month-b' : 'input-videos-per-month');
          const day = document.getElementById(isPlanB ? 'input-videos-per-day-b' : 'input-videos-per-day');
          if (day && day.value) { const d = parseFloat(day.value); if (d > 0) { if (vidsWeek) vidsWeek.value = Math.max(1, Math.round(d * 7)); if (vidsMonth) vidsMonth.value = Math.max(1, Math.round(d * 30)); } }
        }
      };
    });

    switchGoalTab('plan_a');
  }

  function synchronizeModalPace(source, planKey = 'plan_a') {
    const isPlanB = (planKey === 'plan_b');
    const subSelect = document.getElementById(isPlanB ? 'select-target-subject-b' : 'select-target-subject');
    const selectedSubVal = subSelect ? subSelect.value : '';
    const modalSource = state.activeSource || 'marrow_8';
    const selectedUnits = getSelectedUnitsForPlanKey(isPlanB);
    const metrics = getMetricsForModalScope(selectedSubVal, selectedUnits, modalSource);

    const dateInput = document.getElementById(isPlanB ? 'input-target-date-b' : 'input-target-date');
    const badge = document.getElementById(isPlanB ? 'days-remaining-badge-b' : 'days-remaining-badge');
    const bannerText = document.getElementById(isPlanB ? 'smart-math-text-b' : 'smart-math-text');
    const vidsInput = document.getElementById(isPlanB ? 'input-videos-per-day-b' : 'input-videos-per-day');

    let now = new Date();
    const planObj = isPlanB ? (state.plans[1] || {}) : (state.plans[0] || {});

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
      const userVids = Math.max(1, parseInt(vidsInput ? vidsInput.value : 1) || 1);
      days = Math.ceil(metrics.remainingVideos / userVids);
      targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      if (dateInput) dateInput.value = toLocalDateKey(targetDate);
    }

    if (badge) badge.textContent = `${days} Days Left`;

    const dailyVids = Math.max(1, Math.ceil(metrics.remainingVideos / days));
    const weeklyVids = dailyVids * 7;
    const monthlyVids = dailyVids * 30;

    if (source !== 'dailyVids' && vidsInput) vidsInput.value = dailyVids;
    const vidsWeekEl = document.getElementById(isPlanB ? 'input-videos-per-week-b' : 'input-videos-per-week');
    if (vidsWeekEl) vidsWeekEl.value = weeklyVids;
    const vidsMonthEl = document.getElementById(isPlanB ? 'input-videos-per-month-b' : 'input-videos-per-month');
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

  // --- Study Source Settings Modal (separate dialog from Profile → Settings) ---

  // Expose
  window.FlowMD.planConfig = {
    renderStudyPlanConfigCard,
    initStudyPlanConfig,
    synchronizeModalPace,
    focusStudyPlanConfig,
    getSelectedUnitsForPlanKey
  };
})();
