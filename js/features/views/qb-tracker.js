/* ============================================================
   FlowMD Features — Q-Bank Tracker View
   Tracking add-on: browse the Q-Bank catalog (subject → unit →
   topic) and tick topics as solved. Feeds the Analytics tile via
   qb-tracker-store. No MCQ practice — tracking only.
   ============================================================ */
(function () {
  'use strict';

  const { getState } = window.FlowMD.store;
  const { showToast } = window.FlowMD.toast;
  const { escapeHtml } = window.FlowMD.constants;

  const state = getState();
  let DOM = {};

  function pctColor(p) {
    return p >= 75 ? 'var(--success)' : p >= 50 ? 'var(--info)' : p >= 25 ? 'var(--warning)' : 'var(--danger)';
  }

  function statTile(label, value, sub, color) {
    return `
      <div style="text-align:center;">
        <div style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${label}</div>
        <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:${color || 'var(--accent-primary)'};">${value}</div>
        <div style="font-family:var(--font-hud);font-size:0.7rem;color:var(--text-muted);">${sub}</div>
      </div>`;
  }

  // ---------- Hub: all subjects ----------
  function renderQbTrackerView(dom, stats) {
    DOM = dom;
    const tracker = window.FlowMD.qbTracker;
    const overall = tracker.getOverallStats();

    const cards = overall.perSubject.map(s => `
      <div class="curr-card" data-qb-subject="${s.id}" role="button" tabindex="0" aria-label="Open ${escapeHtml(s.name)} Q-Bank tracker — ${s.percentage}% complete">
        <div class="curr-card-head" style="--sub-accent: ${window.FlowMD.subjects.getSubjectAccentColor(s.id)};">
          <span class="curr-card-icon" aria-hidden="true">${window.FlowMD.subjects.getSubjectSvgIcon(s.id)}</span>
          <span class="curr-card-name">${escapeHtml(s.name)}</span>
          <span class="curr-card-pct">${s.percentage}%</span>
        </div>
        <div class="curr-card-meta">${s.doneTopics}/${s.totalTopics} topics · <b>${s.doneMcqs}/${s.totalMcqs} MCQs</b>${s.percentage === 100 ? ' · <b>✓ Done</b>' : ''}</div>
        <div class="curr-card-bar" role="progressbar" aria-valuenow="${s.percentage}" aria-valuemin="0" aria-valuemax="100">
          <div class="curr-card-bar-fill" style="width:${s.percentage}%;"></div>
        </div>
      </div>`).join('');

    DOM.appMain.innerHTML = `
      <div class="pwa-curriculum-scroll">
        <button class="pwa-back-btn" id="qb-back-btn" aria-label="Back to dashboard">
          <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_back"/></svg>
          <span>Back</span>
        </button>

        <div class="pwa-subject-detail-header">
          <div class="pwa-subject-detail-icon" style="color: var(--accent-primary);">
            <svg class="material-symbols-outlined" style="font-size:34px;"><use href="#fmd-i-quiz"/></svg>
          </div>
          <div class="pwa-subject-detail-info">
            <div class="pwa-subject-detail-name">Q-Bank Tracker</div>
            <div class="pwa-subject-detail-faculty">Track solved topics &amp; MCQs across all 19 subjects</div>
            <div class="pwa-subject-detail-meta">${overall.percentage}% solved overall · edition: ${escapeHtml(state.activeSource === 'marrow_6_5' ? 'Marrow 6.5' : 'Marrow 8')}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 16px; padding: 12px; background: var(--bg-surface-raised); border-radius: 12px; border: 1px solid var(--border-color);">
          ${statTile('Topics', `${overall.doneTopics}/${overall.totalTopics}`, 'solved', 'var(--success)')}
          ${statTile('MCQs', `${overall.doneMcqs}/${overall.totalMcqs}`, 'solved', 'var(--accent-primary)')}
          ${statTile('Mastery', `${overall.percentage}%`, overall.percentage >= 75 ? 'Mastered' : overall.percentage >= 50 ? 'Advanced' : overall.percentage >= 25 ? 'In Progress' : 'Just started', pctColor(overall.percentage))}
        </div>

        <div class="curr-grid">${cards}</div>
      </div>`;

    document.getElementById('qb-back-btn')?.addEventListener('click', () => {
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('dashboard');
    });
    document.querySelectorAll('[data-qb-subject]').forEach(card => {
      const open = () => {
        state.qbActiveSubject = card.getAttribute('data-qb-subject');
        renderQbSubjectDetail(DOM, stats);
        window.scrollTo({ top: 0 });
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  // ---------- Subject detail: units + topic ticks ----------
  function renderQbSubjectDetail(dom, stats) {
    DOM = dom;
    const tracker = window.FlowMD.qbTracker;
    const data = window.FlowMD.qbTrackerData;
    const subj = data.subjects.find(s => s.id === state.qbActiveSubject) || data.subjects[0];
    const st = tracker.getSubjectStats(subj.id);

    const unitsHtml = subj.units.map((u, ui) => {
      const us = tracker.getUnitStats(subj.id, u);
      const allDone = us.doneTopics === us.topics;
      const rows = u.topics.map(t => {
        const p = tracker.getTopicProgress(subj.id, t.s);
        return `
          <label class="qb-topic-row">
            <input type="checkbox" class="qb-topic-check" data-qb-serial="${t.s}" data-qb-mcqs="${t.m}" ${p.done ? 'checked' : ''}>
            <span class="qb-topic-serial">#${t.s}</span>
            <span class="qb-topic-name">${escapeHtml(t.n)}</span>
            <span class="qb-topic-mcqs">${t.m} <small>MCQs</small></span>
          </label>`;
      }).join('');
      return `
        <div class="chapt-node ${allDone ? 'is-complete' : ''}" style="margin-bottom:10px;">
          <div class="accordion-header" data-qb-unit="${ui}">
            <span class="curr-card-name" style="flex:1;">${escapeHtml(u.name)}</span>
            <span style="font-family:var(--font-hud);font-size:0.75rem;color:var(--text-muted);">${us.doneTopics}/${us.topics} · ${us.doneMcqs}/${us.totalMcqs} MCQs</span>
            <svg class="material-symbols-outlined curriculum-legend-chevron"><use href="#fmd-i-expand_more"/></svg>
          </div>
          <div class="accordion-body" style="padding:4px 10px 10px;">
            <button type="button" class="qb-unit-bulk" data-qb-unit="${ui}" style="margin:6px 0; padding:5px 12px; font-size:0.75rem; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-surface-raised); color:var(--text-secondary);">
              ${allDone ? 'Unmark whole unit' : 'Mark whole unit solved'}
            </button>
            ${rows}
          </div>
        </div>`;
    }).join('');

    DOM.appMain.innerHTML = `
      <div class="pwa-curriculum-scroll">
        <button class="pwa-back-btn" id="qb-back-btn" aria-label="Back to tracker hub">
          <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_back"/></svg>
          <span>Q-Bank Tracker</span>
        </button>

        <div class="pwa-subject-detail-header">
          <div class="pwa-subject-detail-icon" style="color: ${window.FlowMD.subjects.getSubjectAccentColor(subj.id)};">
            ${window.FlowMD.subjects.getSubjectSvgIcon(subj.id)}
          </div>
          <div class="pwa-subject-detail-info">
            <div class="pwa-subject-detail-name">${escapeHtml(subj.name)}</div>
            <div class="pwa-subject-detail-faculty">Q-Bank progress tracker</div>
            <div class="pwa-subject-detail-meta">${st.doneTopics}/${st.totalTopics} Topics • ${st.doneMcqs}/${st.totalMcqs} MCQs • ${st.percentage}% done</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 16px; padding: 12px; background: var(--bg-surface-raised); border-radius: 12px; border: 1px solid var(--border-color);">
          ${statTile('Topics', `${st.doneTopics}/${st.totalTopics}`, 'solved', 'var(--success)')}
          ${statTile('MCQs', `${st.doneMcqs}/${st.totalMcqs}`, 'solved', 'var(--accent-primary)')}
          ${statTile('Mastery', `${st.percentage}%`, st.percentage >= 75 ? 'Mastered' : st.percentage >= 50 ? 'Advanced' : st.percentage >= 25 ? 'In Progress' : 'Just started', pctColor(st.percentage))}
        </div>

        ${unitsHtml}
      </div>`;

    document.getElementById('qb-back-btn')?.addEventListener('click', () => {
      renderQbTrackerView(DOM, stats);
      window.scrollTo({ top: 0 });
    });

    // accordion toggling (matches subject-detail behavior)
    document.querySelectorAll('.accordion-header[data-qb-unit]').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const body = hdr.nextElementSibling;
        if (body) body.classList.toggle('active', hdr.classList.toggle('active'));
      });
    });

    // topic ticks
    document.querySelectorAll('.qb-topic-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const serial = parseInt(e.target.getAttribute('data-qb-serial'), 10);
        const mcqs = parseInt(e.target.getAttribute('data-qb-mcqs'), 10);
        window.FlowMD.qbTracker.setTopicProgress(subj.id, serial, mcqs, e.target.checked);
        showToast(e.target.checked ? `Solved: #${serial} (${mcqs} MCQs)` : `Unmarked: #${serial}`, e.target.checked ? 'check_circle' : 'check_box_outline_blank');
        renderQbSubjectDetail(DOM, stats);
      });
    });

    // unit bulk
    document.querySelectorAll('.qb-unit-bulk').forEach(btn => {
      btn.addEventListener('click', () => {
        const unit = subj.units[parseInt(btn.getAttribute('data-qb-unit'), 10)];
        const us = window.FlowMD.qbTracker.getUnitStats(subj.id, unit);
        const done = us.doneTopics !== us.topics;
        window.FlowMD.qbTracker.setUnitProgress(subj.id, unit, done);
        showToast(done ? `Unit marked solved (${unit.topics.length} topics)` : 'Unit unmarked', done ? 'task_alt' : 'undo');
        renderQbSubjectDetail(DOM, stats);
      });
    });
  }

  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderQbTrackerView
  });
})();
