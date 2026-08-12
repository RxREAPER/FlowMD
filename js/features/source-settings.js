/* ============================================================
   FlowMD Features — Study Source Settings Modal
   Source-switch modal: pick a syllabus edition. Plans, targets and
   goals are preserved across the switch (completions are keyed per
   source), so quests and analytics keep working on the new edition.

   Extracted verbatim from app.js (2026-08-10); reset removed 2026-08-12.
   ============================================================ */
(function () {
  'use strict';

  const { getState, switchSource } = window.FlowMD.store;
  const { SOURCE_DATA, getSourceLabel } = window.FlowMD.sourceData;
  const { STUDY_SOURCES, escapeHtml } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;
  const { updateTopbarSource } = window.FlowMD.theme;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  function openSourceSettingsModal() {
    const modal = document.createElement('div');
    modal.style.cssText = [
      'position:fixed', 'inset:0', 'width:100vw', 'height:100vh',
      'background:rgba(0,0,0,0.82)', 'backdrop-filter:blur(8px)',
      '-webkit-backdrop-filter:blur(8px)', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'box-sizing:border-box'
    ].join(';');

    const current = state.activeSource || 'marrow_8';
    const options = STUDY_SOURCES.map(s => {
      const checked = s.id === current ? 'checked' : '';
      const upcoming = !s.available ? 'upcoming' : '';
      const sub = !s.available ? 'Coming soon — syllabus data arrives in a future update.' : `Switch to the ${s.short} syllabus for all subjects, chapters & targets.`;
      return `
        <button type="button" class="onboarding-option ${checked} ${upcoming}" data-src="${s.id}" role="radio" aria-checked="${checked ? 'true' : 'false'}">
          <span class="onboarding-radio"></span>
          <span>
            <span class="onboarding-option-title">${s.label}</span>
            <span class="onboarding-option-sub" style="display:block;">${sub}</span>
          </span>
        </button>`;
    }).join('');

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 480px; width: 92%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 2px solid var(--retro-cyan, var(--accent-primary)); padding-bottom: 12px;">
          <div>
            <div style="font-family: var(--font-hud), monospace; font-size: 0.75rem; font-weight: 700; color: var(--retro-gold, var(--accent-primary)); letter-spacing: 0.08em; text-transform: uppercase;">
              <svg class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;"><use href="#fmd-i-settings"/></svg> SETTINGS
            </div>
            <h3 style="font-family: var(--font-display), monospace; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 2px 0 0 0; display: flex; align-items: center; gap: 8px;">
              <svg class="material-symbols-outlined" style="color: var(--accent-primary);"><use href="#fmd-i-auto_stories"/></svg>
              <span>Study Source</span>
            </h3>
          </div>
          <button id="scs-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0 4px; line-height: 1;"><svg class="material-symbols-outlined" style="font-size:20px;"><use href="#fmd-i-close"/></svg></button>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 6px 0; line-height: 1.5;">
          Choose which syllabus edition to plan against. The selected source drives every subject, chapter &amp; topic shown in the app.
        </p>

        <div class="onboarding-options" style="margin: 14px 0 8px 0;">
          ${options}
        </div>

        <div id="scs-upcoming-alert" class="onboarding-alert" style="display:${!STUDY_SOURCES.find(s => s.id === current)?.available ? 'flex' : 'none'};">
          <svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-info"/></svg>
          ${getSourceLabel(current)} is an upcoming feature. Its syllabus data will be available in a future update.
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; margin:4px 0 12px 0; padding:10px 12px; background:var(--bg-surface-raised); border:1px solid var(--border, rgba(255,255,255,0.08)); border-radius:10px;">
          ${STUDY_SOURCES.filter(s => s.available).map(s => {
            const e = state.editions && state.editions[s.id];
            const plan = e && e.plans && e.plans[0];
            const cfg = plan && (plan.targetSubject || plan.targetDate || plan.videosPerDay)
              ? escapeHtml(String(plan.targetSubject || '—')) + ' · ' + (plan.videosPerDay ? plan.videosPerDay + '/day' : '—') + (plan.targetDate ? ' · by ' + escapeHtml(String(plan.targetDate)) : '')
              : 'Not set yet — configure this edition separately';
            return `<div style="display:flex; justify-content:space-between; gap:10px; font-size:0.8rem; color:var(--text-secondary);">
              <span style="font-weight:700; color:var(--text-primary); white-space:nowrap;">${s.label}</span>
              <span style="text-align:right; overflow:hidden; text-overflow:ellipsis;">${cfg}</span>
            </div>`;
          }).join('')}
        </div>

        <div class="onboarding-alert" style="border-color: var(--info, var(--accent-primary)); background: var(--info-bg, rgba(14,165,233,0.1)); color: var(--text-secondary);">
          <svg class="material-symbols-outlined" style="font-size:16px;"><use href="#fmd-i-info"/></svg>
          Each edition keeps its own plans, goals, daily quests &amp; analytics. Completions are tracked per edition.
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
          <button id="scs-cancel" class="v2-arcade-btn" style="height: 40px; background: var(--bg-surface-raised); color: var(--text-primary);">Cancel</button>
          <button id="scs-save" class="v2-arcade-btn" style="height: 40px; background: var(--accent-primary); color: #ffffff;">Save Source</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    modal.querySelector('#scs-close').addEventListener('click', close);
    modal.querySelector('#scs-cancel').addEventListener('click', close);

    let selected = current;
    const upcomingAlert = modal.querySelector('#scs-upcoming-alert');
    modal.querySelectorAll('.onboarding-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selected = opt.getAttribute('data-src');
        modal.querySelectorAll('.onboarding-option').forEach(o => {
          o.classList.toggle('checked', o === opt);
          o.setAttribute('aria-checked', o === opt ? 'true' : 'false');
        });
        if (upcomingAlert) upcomingAlert.style.display = !STUDY_SOURCES.find(s => s.id === selected)?.available ? 'flex' : 'none';
      });
    });

    modal.querySelector('#scs-save').addEventListener('click', () => {
      if (selected === current) { close(); return; }
      if (!STUDY_SOURCES.find(s => s.id === selected)?.available) {
        // Only allow if dataset exists; otherwise reject with toast.
        const hasData = SOURCE_DATA && SOURCE_DATA[selected] && SOURCE_DATA[selected].length > 0;
        if (!hasData) {
          showToast(getSourceLabel(selected) + ' syllabus is not available yet.', 'error', 'Source Unavailable');
          return;
        }
      }
      // Per-edition partitions: switching points the live working fields at
      // the other edition's OWN plans / goals / history. Each edition keeps
      // its own subject, deadline, paces, daily quests, goal pulse and graphs
      // (completions were already keyed per source). A never-configured
      // edition starts unset — the app waits for the user to fill it in.
      switchSource(selected);
      close();
      showToast(`Switched to ${getSourceLabel(selected)} — this edition has its own plan, goals & analytics.`, 'check_circle', 'Study Source Updated');
      updateTopbarSource();
      if (window.FlowMD.shell) window.FlowMD.shell.render();
    });
  }


  // Expose
  window.FlowMD.sourceSettings = {
    openSourceSettingsModal
  };
})();
