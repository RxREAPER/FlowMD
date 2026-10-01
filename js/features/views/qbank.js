/* ============================================================
   FlowMD Features — Question Bank (Q-Bank) View
   Renders the structured Subject → Chapters → Topics timeline view
   with filter tabs, sorting, index drawer navigation, and topic cards.
   ============================================================ */
(function () {
  'use strict';

  function getDeps() {
    return {
      store: window.FlowMD.store || { getState: () => ({}) },
      constants: window.FlowMD.constants || { escapeHtml: s => s },
      qbankData: window.FlowMD.qbankData || { getSubjectQBank: () => ({ chapters: [] }) },
      qbankStore: window.FlowMD.qbankStore || { getTopicProgress: () => ({}), getSubjectQBankStats: () => ({}) },
      subjects: window.FlowMD.subjects || { getSubjectColor: () => '#3b82f6', getSubjectName: s => s, getSubjectFaculty: () => '', getSubjectSvgIcon: () => '' }
    };
  }

  let activeFilter = 'ALL'; // 'ALL' | 'PAUSED' | 'COMPLETED' | 'UNATTEMPTED' | 'FREE'
  let activeSort = 'topics'; // 'topics' | 'mcqs' | 'progress' | 'alpha'
  let isIndexOpen = false;

  function renderQBankView(dom, stats) {
    const deps = getDeps();
    const state = deps.store.getState();
    const escapeHtml = deps.constants.escapeHtml || (s => s);
    const getSubjectQBank = deps.qbankData.getSubjectQBank || (() => ({ chapters: [] }));
    const getTopicProgress = deps.qbankStore.getTopicProgress || (() => ({}));
    const getSubjectQBankStats = deps.qbankStore.getSubjectQBankStats || (() => ({ attemptedQuestions: 0, totalQuestions: 0, completedTopics: 0, totalTopics: 0, percentage: 0 }));
    const getSubjectColor = deps.subjects.getSubjectColor || (() => '#3b82f6');
    const getSubjectName = deps.subjects.getSubjectName || (s => s);
    const getSubjectFaculty = deps.subjects.getSubjectFaculty || (() => 'Marrow Faculty');
    const getSubjectSvgIcon = deps.subjects.getSubjectSvgIcon || (() => '');

    const subjectId = state.activeQBankSubjectId || state.activeSubjectId || 'radiology';
    const qbData = getSubjectQBank(subjectId) || { chapters: [] };
    const qbStats = getSubjectQBankStats(subjectId) || { attemptedQuestions: 0, totalQuestions: 0, completedTopics: 0, totalTopics: 0, percentage: 0 };
    const subColor = getSubjectColor(subjectId) || qbData.accentColor || '#3b82f6';
    const subName = qbData.name || getSubjectName(subjectId);
    const faculty = qbData.faculty || getSubjectFaculty(subjectId);
    const subIcon = getSubjectSvgIcon(subjectId);

    // Filter topics within chapters
    const filteredChapters = (qbData.chapters || []).map(chap => {
      let topics = (chap.topics || []).slice();

      // Apply Filter Tab
      if (activeFilter === 'PAUSED') {
        topics = topics.filter(t => getTopicProgress(t.id).status === 'paused');
      } else if (activeFilter === 'COMPLETED') {
        topics = topics.filter(t => getTopicProgress(t.id).status === 'completed');
      } else if (activeFilter === 'UNATTEMPTED') {
        topics = topics.filter(t => getTopicProgress(t.id).status === 'unattempted');
      } else if (activeFilter === 'FREE') {
        topics = topics.filter(t => !t.isPro);
      }

      // Apply Sort
      if (activeSort === 'mcqs') {
        topics.sort((a, b) => (b.questions.length || b.mcqCount || 0) - (a.questions.length || a.mcqCount || 0));
      } else if (activeSort === 'progress') {
        topics.sort((a, b) => {
          const pA = getTopicProgress(a.id);
          const pB = getTopicProgress(b.id);
          const scoreA = Object.keys(pA.answers || {}).length / (a.questions.length || 1);
          const scoreB = Object.keys(pB.answers || {}).length / (b.questions.length || 1);
          return scoreB - scoreA;
        });
      } else if (activeSort === 'alpha') {
        topics.sort((a, b) => a.name.localeCompare(b.name));
      }

      return {
        ...chap,
        topics
      };
    }).filter(chap => chap.topics.length > 0);

    // Calculate global topic sequential index mapping for timeline
    let globalIndex = 1;
    const topicNumberMap = {};
    (qbData.chapters || []).forEach(chap => {
      (chap.topics || []).forEach(top => {
        topicNumberMap[top.id] = globalIndex++;
      });
    });

    const totalDisplayTopics = filteredChapters.reduce((acc, c) => acc + c.topics.length, 0);

    dom.appMain.innerHTML = `
      <div class="qbank-container">
        <!-- Top Navigation Bar -->
        <header class="qbank-header" style="--sub-accent: ${subColor};">
          <div class="qbank-header-top">
            <button type="button" class="qbank-back-btn" id="btn-qbank-back" aria-label="Back to Curriculum">
              <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_back"/></svg>
            </button>
            <div class="qbank-header-title-wrap">
              <div class="qbank-header-sub-tag"><span class="qbank-sub-pill">${escapeHtml(faculty)}</span></div>
              <h1 class="qbank-header-title">${escapeHtml(subName)}</h1>
            </div>
            <button type="button" class="qbank-index-btn" id="btn-qbank-index" aria-label="Open Chapter Index">
              <svg class="material-symbols-outlined"><use href="#fmd-i-menu_book"/></svg>
              <span>Index</span>
            </button>
          </div>

          <!-- Overall Stats Banner -->
          <div class="qbank-stats-banner">
            <div class="qbank-stat-item">
              <span class="qbank-stat-val">${qbStats.attemptedQuestions}/${qbStats.totalQuestions}</span>
              <span class="qbank-stat-lbl">MCQs Solved</span>
            </div>
            <div class="qbank-stat-divider"></div>
            <div class="qbank-stat-item">
              <span class="qbank-stat-val">${qbStats.completedTopics}/${qbStats.totalTopics}</span>
              <span class="qbank-stat-lbl">Topics Done</span>
            </div>
            <div class="qbank-stat-divider"></div>
            <div class="qbank-stat-item">
              <span class="qbank-stat-val" style="color: ${qbStats.accuracy >= 75 ? 'var(--success)' : qbStats.accuracy >= 50 ? 'var(--info)' : 'var(--accent-primary)'};">${qbStats.accuracy}%</span>
              <span class="qbank-stat-lbl">Accuracy</span>
            </div>
          </div>

          <!-- Filter Tabs Bar (ALL, PAUSED, COMPLETED, UNATTEMPTED, FREE) -->
          <div class="qbank-filter-bar">
            <div class="qbank-filter-tabs" role="tablist" aria-label="Q-Bank Topic Filters">
              <button type="button" class="qbank-tab ${activeFilter === 'ALL' ? 'is-active' : ''}" data-filter="ALL" role="tab" aria-selected="${activeFilter === 'ALL'}">
                All <span class="qbank-tab-badge">${qbStats.totalTopics}</span>
              </button>
              <button type="button" class="qbank-tab ${activeFilter === 'PAUSED' ? 'is-active' : ''}" data-filter="PAUSED" role="tab" aria-selected="${activeFilter === 'PAUSED'}">
                Paused ${qbStats.pausedTopics > 0 ? `<span class="qbank-tab-badge qbank-badge-paused">${qbStats.pausedTopics}</span>` : ''}
              </button>
              <button type="button" class="qbank-tab ${activeFilter === 'COMPLETED' ? 'is-active' : ''}" data-filter="COMPLETED" role="tab" aria-selected="${activeFilter === 'COMPLETED'}">
                Completed ${qbStats.completedTopics > 0 ? `<span class="qbank-tab-badge qbank-badge-done">${qbStats.completedTopics}</span>` : ''}
              </button>
              <button type="button" class="qbank-tab ${activeFilter === 'UNATTEMPTED' ? 'is-active' : ''}" data-filter="UNATTEMPTED" role="tab" aria-selected="${activeFilter === 'UNATTEMPTED'}">
                Unattempted
              </button>
              <button type="button" class="qbank-tab ${activeFilter === 'FREE' ? 'is-active' : ''}" data-filter="FREE" role="tab" aria-selected="${activeFilter === 'FREE'}">
                Free
              </button>
            </div>
          </div>

          <!-- Sort Bar -->
          <div class="qbank-sub-controls">
            <span class="qbank-count-indicator">${totalDisplayTopics} topic${totalDisplayTopics === 1 ? '' : 's'}</span>
            <div class="qbank-sort-wrap">
              <span class="qbank-sort-label">Sort by</span>
              <select class="qbank-sort-select" id="qbank-sort-select" aria-label="Sort Topics">
                <option value="topics" ${activeSort === 'topics' ? 'selected' : ''}>Topics</option>
                <option value="mcqs" ${activeSort === 'mcqs' ? 'selected' : ''}>MCQ Count</option>
                <option value="progress" ${activeSort === 'progress' ? 'selected' : ''}>Progress</option>
                <option value="alpha" ${activeSort === 'alpha' ? 'selected' : ''}>Alphabetical</option>
              </select>
            </div>
          </div>
        </header>

        <!-- Chapter Sections & Topic Timeline -->
        <main class="qbank-content">
          ${filteredChapters.length === 0 ? `
            <div class="qbank-empty-state">
              <svg class="material-symbols-outlined qbank-empty-icon"><use href="#fmd-i-quiz"/></svg>
              <h3 class="qbank-empty-title">No topics match this filter</h3>
              <p class="qbank-empty-sub">Try switching to the "All" tab to view all Question Bank modules for ${escapeHtml(subName)}.</p>
              <button type="button" class="v2-arcade-btn qbank-empty-btn" id="btn-reset-qbank-filter">Show All Topics</button>
            </div>
          ` : filteredChapters.map((chap, chapIdx) => `
            <section class="qbank-chapter-section" id="chap-section-${chap.id}">
              <div class="qbank-chapter-header">
                <span class="qbank-chapter-marker"></span>
                <h2 class="qbank-chapter-title">${escapeHtml(chap.name)}</h2>
                <span class="qbank-chapter-count">${chap.topics.length} topic${chap.topics.length === 1 ? '' : 's'}</span>
              </div>

              <div class="qbank-timeline-list">
                ${chap.topics.map((top, tIdx) => {
                  const seqNum = topicNumberMap[top.id] || (tIdx + 1);
                  const qCount = (top.questions && top.questions.length) || top.mcqCount || 15;
                  const prog = getTopicProgress(top.id);
                  const answeredCount = Object.keys(prog.answers || {}).length;
                  const isDone = prog.status === 'completed' || (answeredCount >= qCount && qCount > 0);
                  const isPaused = prog.status === 'paused';
                  const pct = qCount > 0 ? Math.round((answeredCount / qCount) * 100) : 0;
                  const isLastInChap = tIdx === chap.topics.length - 1;

                  return `
                    <div class="qbank-timeline-item ${isDone ? 'is-completed' : ''} ${isPaused ? 'is-paused' : ''}" id="topic-item-${top.id}">
                      <!-- Timeline Node & Line -->
                      <div class="qbank-timeline-rail">
                        <div class="qbank-timeline-node ${isDone ? 'node-done' : ''} ${isPaused ? 'node-paused' : ''}">
                          ${isDone ? `<svg class="material-symbols-outlined node-check"><use href="#fmd-i-check_circle"/></svg>` : seqNum}
                        </div>
                        ${!isLastInChap ? `<div class="qbank-timeline-line"></div>` : ''}
                      </div>

                      <!-- Topic Card -->
                      <div class="qbank-topic-card ${isDone ? 'card-done' : ''}" data-topic-id="${top.id}" data-subject-id="${subjectId}" role="button" tabindex="0" aria-label="Open ${escapeHtml(top.name)} — ${qCount} MCQs">
                        <div class="qbank-card-thumb" style="--thumb-accent: ${subColor};">
                          <span class="qbank-thumb-icon">${subIcon || '<svg class="material-symbols-outlined"><use href="#fmd-i-quiz"/></svg>'}</span>
                          ${top.isPro ? `<span class="qbank-pro-badge">PRO</span>` : ''}
                        </div>

                        <div class="qbank-card-content">
                          <h3 class="qbank-card-title">${escapeHtml(top.name)}</h3>
                          
                          <div class="qbank-card-meta">
                            <span class="qbank-mcq-count">
                              <strong>${qCount}</strong> MCQs
                            </span>
                            ${isDone ? `
                              <span class="qbank-meta-sep">•</span>
                              <span class="qbank-status-done"><svg class="material-symbols-outlined"><use href="#fmd-i-check_circle"/></svg> Completed (${prog.score || qCount}/${qCount})</span>
                            ` : isPaused ? `
                              <span class="qbank-meta-sep">•</span>
                              <span class="qbank-status-paused"><svg class="material-symbols-outlined"><use href="#fmd-i-schedule"/></svg> ${answeredCount}/${qCount} answered</span>
                            ` : ''}
                          </div>

                          ${answeredCount > 0 ? `
                            <div class="qbank-card-progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                              <div class="qbank-card-progress-fill ${isDone ? 'fill-done' : 'fill-paused'}" style="width: ${pct}%;"></div>
                            </div>
                          ` : ''}
                        </div>

                        <div class="qbank-card-action">
                          <button type="button" class="mv-tile qbank-start-mcq-btn" data-topic-id="${top.id}" data-subject-id="${subjectId}" style="background: color-mix(in srgb, var(--accent-primary) 18%, var(--bg-surface)); color: var(--accent-primary); border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent); font-weight: 700; border-radius: 6px; cursor: pointer; padding: 4px 10px; font-family: var(--font-hud); font-size: 0.8rem;" aria-label="Practice ${escapeHtml(top.name)}">MCQ</button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </section>
          `).join('')}
        </main>

        <!-- Index Navigation Drawer Modal -->
        <div class="qbank-index-drawer-overlay ${isIndexOpen ? 'is-open' : ''}" id="qbank-index-overlay" style="display: ${isIndexOpen ? 'flex' : 'none'};">
          <div class="qbank-index-drawer" role="dialog" aria-label="Subject Chapter Index">
            <div class="qbank-drawer-head">
              <div class="qbank-drawer-title">
                <svg class="material-symbols-outlined"><use href="#fmd-i-menu_book"/></svg>
                <span>${escapeHtml(subName)} — Index</span>
              </div>
              <button type="button" class="qbank-drawer-close" id="btn-close-qbank-index" aria-label="Close Index">
                <svg class="material-symbols-outlined"><use href="#fmd-i-close"/></svg>
              </button>
            </div>

            <div class="qbank-drawer-body">
              ${(qbData.chapters || []).map((chap, cIdx) => `
                <div class="qbank-index-chap-group">
                  <div class="qbank-index-chap-title">${escapeHtml(chap.name)}</div>
                  <ul class="qbank-index-topic-list">
                    ${(chap.topics || []).map(top => {
                      const num = topicNumberMap[top.id] || 1;
                      const qCount = (top.questions && top.questions.length) || top.mcqCount || 15;
                      const prog = getTopicProgress(top.id);
                      const isDone = prog.status === 'completed';
                      return `
                        <li class="qbank-index-item" data-jump-target="topic-item-${top.id}">
                          <span class="qbank-index-num ${isDone ? 'is-done' : ''}">${num}</span>
                          <span class="qbank-index-name">${escapeHtml(top.name)}</span>
                          <span class="qbank-index-meta">${qCount} MCQs ${isDone ? '✓' : ''}</span>
                        </li>
                      `;
                    }).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // --- Wire Event Handlers ---
    // Back to Curriculum
    document.getElementById('btn-qbank-back')?.addEventListener('click', () => {
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('curriculum');
    });

    // Filter tab buttons
    document.querySelectorAll('.qbank-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeFilter = tab.getAttribute('data-filter') || 'ALL';
        renderQBankView(dom, stats);
      });
    });

    // Reset filter button
    document.getElementById('btn-reset-qbank-filter')?.addEventListener('click', () => {
      activeFilter = 'ALL';
      renderQBankView(dom, stats);
    });

    // Sort selector
    const sortSelect = document.getElementById('qbank-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value || 'topics';
        renderQBankView(dom, stats);
      });
    }

    // Index drawer open/close
    document.getElementById('btn-qbank-index')?.addEventListener('click', () => {
      isIndexOpen = true;
      const overlay = document.getElementById('qbank-index-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('is-open'), 10);
      }
    });

    const closeIndex = () => {
      isIndexOpen = false;
      const overlay = document.getElementById('qbank-index-overlay');
      if (overlay) {
        overlay.classList.remove('is-open');
        setTimeout(() => { overlay.style.display = 'none'; }, 200);
      }
    };

    document.getElementById('btn-close-qbank-index')?.addEventListener('click', closeIndex);
    document.getElementById('qbank-index-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'qbank-index-overlay') closeIndex();
    });

    // Index jump navigation
    document.querySelectorAll('.qbank-index-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-jump-target');
        closeIndex();
        if (targetId) {
          setTimeout(() => {
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              targetEl.classList.add('qbank-highlight-flash');
              setTimeout(() => targetEl.classList.remove('qbank-highlight-flash'), 1800);
            }
          }, 150);
        }
      });
    });

    // Topic Card Click -> Open MCQ Practice View
    document.querySelectorAll('.qbank-topic-card').forEach(card => {
      const openPractice = () => {
        const topicId = card.getAttribute('data-topic-id');
        const subId = card.getAttribute('data-subject-id');
        state.activeQBankSubjectId = subId;
        state.activeQBankTopicId = topicId;
        if (window.FlowMD.shell) {
          window.FlowMD.shell.switchView('mcq_practice');
        }
      };
      card.addEventListener('click', openPractice);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPractice();
        }
      });
    });
  }

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderQBankView
  });
})();
