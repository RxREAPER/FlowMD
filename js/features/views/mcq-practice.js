/* ============================================================
   FlowMD Features — MCQ Practice & Testing View
   Interactive question interface supporting answer selection,
   instant feedback, explanations, bookmarking, question palette,
   and comprehensive score & review results summary.
   ============================================================ */
(function () {
  'use strict';

  function getDeps() {
    return {
      store: window.FlowMD.store || { getState: () => ({}) },
      constants: window.FlowMD.constants || { escapeHtml: s => s },
      qbankData: window.FlowMD.qbankData || { getSubjectQBank: () => ({ chapters: [] }) },
      qbankStore: window.FlowMD.qbankStore || { getTopicProgress: () => ({}), saveTopicAnswer: () => {}, toggleTopicBookmark: () => {}, completeTopicTest: () => {}, resetTopicTest: () => {} },
      toast: window.FlowMD.toast || { showToast: () => {} }
    };
  }

  let currentQuestionIdx = 0;
  let isPaletteOpen = false;
  let isResultsMode = false;

  function findTopic(subjectId, topicId) {
    const deps = getDeps();
    const getSubjectQBank = deps.qbankData.getSubjectQBank || (() => ({ chapters: [] }));
    const qbData = getSubjectQBank(subjectId) || { chapters: [] };
    for (const chap of (qbData.chapters || [])) {
      for (const top of (chap.topics || [])) {
        if (top.id === topicId) {
          return { topic: top, chapter: chap, subject: qbData };
        }
      }
    }
    // Fallback to first available topic
    const firstChap = (qbData.chapters && qbData.chapters[0]) || { topics: [] };
    const firstTop = (firstChap.topics && firstChap.topics[0]) || { id: topicId, name: 'General MCQs', questions: [] };
    return { topic: firstTop, chapter: firstChap, subject: qbData };
  }

  function renderMCQPracticeView(dom, stats) {
    const deps = getDeps();
    const state = deps.store.getState();
    const escapeHtml = deps.constants.escapeHtml || (s => s);
    const getTopicProgress = deps.qbankStore.getTopicProgress || (() => ({ answers: {}, bookmarks: {}, status: 'unattempted', score: 0 }));
    const saveTopicAnswer = deps.qbankStore.saveTopicAnswer || (() => {});
    const toggleTopicBookmark = deps.qbankStore.toggleTopicBookmark || (() => {});
    const completeTopicTest = deps.qbankStore.completeTopicTest || (() => {});
    const resetTopicTest = deps.qbankStore.resetTopicTest || (() => {});
    const showToast = deps.toast.showToast || (() => {});

    const subjectId = state.activeQBankSubjectId || state.activeSubjectId || 'radiology';
    const topicId = state.activeQBankTopicId || 'rad_t1_fundamentals_of_imaging';

    const { topic, chapter, subject } = findTopic(subjectId, topicId);
    const questions = topic.questions || [];
    const totalQ = questions.length || 1;

    // Load progress from store
    const progress = getTopicProgress(topic.id);
    if (progress.currentIndex !== undefined && progress.currentIndex >= 0 && progress.currentIndex < totalQ) {
      if (currentQuestionIdx === undefined || currentQuestionIdx >= totalQ) {
        currentQuestionIdx = progress.currentIndex;
      }
    }
    if (currentQuestionIdx < 0 || currentQuestionIdx >= totalQ) {
      currentQuestionIdx = 0;
    }

    // Check if showing results summary
    if (isResultsMode || (progress.status === 'completed' && Object.keys(progress.answers || {}).length >= totalQ && isResultsMode !== false)) {
      renderResultsView(dom, topic, chapter, subject, questions, progress);
      return;
    }

    const q = questions[currentQuestionIdx] || {
      id: `${topic.id}_q1`,
      questionNumber: currentQuestionIdx + 1,
      text: 'Question content loading...',
      options: [
        { id: 'A', text: 'Option A' },
        { id: 'B', text: 'Option B' },
        { id: 'C', text: 'Option C' },
        { id: 'D', text: 'Option D' }
      ],
      correctOption: 'A',
      explanation: 'Explanation loading...',
      keyConcept: 'High-Yield Concept'
    };

    const userAns = progress.answers && progress.answers[currentQuestionIdx];
    const isAnswered = !!userAns;
    const isBookmarked = !!(progress.markedForReview && progress.markedForReview[currentQuestionIdx]);
    const answeredCount = Object.keys(progress.answers || {}).length;
    const progressPct = Math.round(((currentQuestionIdx + 1) / totalQ) * 100);

    dom.appMain.innerHTML = `
      <div class="mcq-practice-container" style="--sub-accent: ${subject.accentColor || 'var(--accent-primary)'};">
        <!-- Top Practice Header -->
        <header class="mcq-top-header">
          <div class="mcq-header-left">
            <button type="button" class="mcq-exit-btn" id="btn-mcq-exit" aria-label="Exit to Question Bank">
              <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_back"/></svg>
            </button>
            <div class="mcq-header-info">
              <span class="mcq-topic-subtitle">${escapeHtml(subject.name)} • ${escapeHtml(chapter.name)}</span>
              <h2 class="mcq-topic-title">${escapeHtml(topic.name)}</h2>
            </div>
          </div>

          <div class="mcq-header-right">
            <!-- Bookmark Toggle -->
            <button type="button" class="mcq-action-icon-btn ${isBookmarked ? 'is-bookmarked' : ''}" id="btn-mcq-bookmark" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}" aria-pressed="${isBookmarked}">
              <svg class="material-symbols-outlined"><use href="#fmd-i-flag"/></svg>
            </button>

            <!-- Question Palette Trigger -->
            <button type="button" class="mcq-action-icon-btn" id="btn-mcq-palette" title="Question Palette">
              <svg class="material-symbols-outlined"><use href="#fmd-i-select_all"/></svg>
            </button>
          </div>
        </header>

        <!-- Progress Indicator Bar -->
        <div class="mcq-progress-bar-wrap">
          <div class="mcq-progress-meta">
            <span class="mcq-q-counter">Question <strong>${currentQuestionIdx + 1}</strong> of ${totalQ}</span>
            <span class="mcq-answered-count">${answeredCount} / ${totalQ} Answered</span>
          </div>
          <div class="mcq-progress-track">
            <div class="mcq-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>

        <!-- Question Card -->
        <main class="mcq-question-card">
          <div class="mcq-card-header">
            <span class="mcq-qnum-tag">Q${currentQuestionIdx + 1}</span>
            ${isBookmarked ? `<span class="mcq-badge-review"><svg class="material-symbols-outlined"><use href="#fmd-i-flag"/></svg> Marked for Review</span>` : ''}
          </div>

          <div class="mcq-question-prompt">
            ${escapeHtml(q.text)}
          </div>

          <!-- Options List -->
          <div class="mcq-options-list" role="radiogroup" aria-label="Multiple choice options">
            ${(q.options || []).map(opt => {
              const isSelected = userAns && userAns.selectedOption === opt.id;
              const isCorrectOpt = q.correctOption === opt.id;
              let stateClass = '';

              if (isAnswered) {
                if (isCorrectOpt) {
                  stateClass = 'option-correct';
                } else if (isSelected && !userAns.isCorrect) {
                  stateClass = 'option-incorrect';
                } else {
                  stateClass = 'option-dimmed';
                }
              }

              return `
                <div class="mcq-option-item ${stateClass} ${isSelected ? 'is-selected' : ''}" data-option-id="${opt.id}" role="radio" aria-checked="${isSelected}" tabindex="${isAnswered ? -1 : 0}">
                  <span class="mcq-option-letter">${opt.id}</span>
                  <span class="mcq-option-text">${escapeHtml(opt.text)}</span>
                  ${isAnswered ? (
                    isCorrectOpt ? `<svg class="material-symbols-outlined mcq-option-status-icon status-icon-correct"><use href="#fmd-i-check_circle"/></svg>` :
                    isSelected ? `<svg class="material-symbols-outlined mcq-option-status-icon status-icon-wrong"><use href="#fmd-i-close"/></svg>` : ''
                  ) : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- High-Yield Explanation (Shown after answering) -->
          ${isAnswered ? `
            <div class="mcq-explanation-box">
              <div class="mcq-expl-header">
                <svg class="material-symbols-outlined mcq-expl-icon"><use href="#fmd-i-verified"/></svg>
                <span>High-Yield NEET-PG Explanation</span>
              </div>
              <div class="mcq-expl-body">
                <p class="mcq-expl-text">${escapeHtml(q.explanation || 'No explanation available.')}</p>
                ${q.keyConcept ? `
                  <div class="mcq-key-concept-box">
                    <span class="mcq-key-concept-title"><svg class="material-symbols-outlined"><use href="#fmd-i-bolt"/></svg> Key Takeaway:</span>
                    <span>${escapeHtml(q.keyConcept)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </main>

        <!-- Bottom Action Bar -->
        <footer class="mcq-bottom-nav">
          <button type="button" class="mcq-nav-btn btn-prev" id="btn-mcq-prev" ${currentQuestionIdx === 0 ? 'disabled' : ''}>
            <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_back"/></svg>
            <span>Previous</span>
          </button>

          <button type="button" class="mcq-nav-btn btn-bookmark" id="btn-mcq-flag-bottom">
            <svg class="material-symbols-outlined"><use href="#fmd-i-flag"/></svg>
            <span>${isBookmarked ? 'Unflag' : 'Flag for Review'}</span>
          </button>

          ${currentQuestionIdx === totalQ - 1 ? `
            <button type="button" class="mcq-nav-btn btn-finish" id="btn-mcq-finish">
              <span>Finish Test</span>
              <svg class="material-symbols-outlined"><use href="#fmd-i-emoji_events"/></svg>
            </button>
          ` : `
            <button type="button" class="mcq-nav-btn btn-next" id="btn-mcq-next">
              <span>Next</span>
              <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_forward"/></svg>
            </button>
          `}
        </footer>

        <!-- Question Grid Palette Modal Drawer -->
        <div class="mcq-palette-overlay ${isPaletteOpen ? 'is-open' : ''}" id="mcq-palette-overlay" style="display: ${isPaletteOpen ? 'flex' : 'none'};">
          <div class="mcq-palette-drawer" role="dialog" aria-label="Question Jump Palette">
            <div class="mcq-palette-header">
              <h3 class="mcq-palette-title">Question Palette (${totalQ} MCQs)</h3>
              <button type="button" class="mcq-palette-close" id="btn-close-palette" aria-label="Close Palette">
                <svg class="material-symbols-outlined"><use href="#fmd-i-close"/></svg>
              </button>
            </div>

            <div class="mcq-palette-legend">
              <span class="mcq-legend-dot dot-correct"></span> Correct
              <span class="mcq-legend-dot dot-incorrect"></span> Incorrect
              <span class="mcq-legend-dot dot-unattempted"></span> Unattempted
              <span class="mcq-legend-dot dot-flagged"></span> Flagged
            </div>

            <div class="mcq-palette-grid">
              ${questions.map((_, idx) => {
                const ans = progress.answers && progress.answers[idx];
                const flagged = progress.markedForReview && progress.markedForReview[idx];
                let itemClass = 'item-unattempted';
                if (ans) {
                  itemClass = ans.isCorrect ? 'item-correct' : 'item-incorrect';
                }
                if (idx === currentQuestionIdx) itemClass += ' item-current';

                return `
                  <button type="button" class="mcq-palette-item ${itemClass}" data-jump-idx="${idx}">
                    <span>${idx + 1}</span>
                    ${flagged ? `<span class="palette-flag-badge">★</span>` : ''}
                  </button>
                `;
              }).join('')}
            </div>

            <div class="mcq-palette-actions">
              <button type="button" class="v2-arcade-btn mcq-palette-finish-btn" id="btn-palette-finish-test">
                Submit &amp; View Results
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // --- Wire Events ---
    // Exit button
    document.getElementById('btn-mcq-exit')?.addEventListener('click', () => {
      isResultsMode = false;
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('qbank');
    });

    // Option Selection
    document.querySelectorAll('.mcq-option-item').forEach(optEl => {
      optEl.addEventListener('click', () => {
        const optId = optEl.getAttribute('data-option-id');
        if (!optId) return;

        const isCorrect = (optId === q.correctOption);
        saveTopicAnswer(topic.id, currentQuestionIdx, optId, isCorrect, totalQ);

        if (isCorrect) {
          showToast('Correct Answer! +1', 'check_circle');
        } else {
          showToast(`Incorrect. Correct answer is (${q.correctOption})`, 'close');
        }

        renderMCQPracticeView(dom, stats);
      });
    });

    // Bookmark / Flag Buttons
    const handleBookmark = () => {
      const nowFlagged = toggleTopicBookmark(topic.id, currentQuestionIdx);
      showToast(nowFlagged ? 'Question flagged for review' : 'Bookmark removed', 'flag');
      renderMCQPracticeView(dom, stats);
    };
    document.getElementById('btn-mcq-bookmark')?.addEventListener('click', handleBookmark);
    document.getElementById('btn-mcq-flag-bottom')?.addEventListener('click', handleBookmark);

    // Prev / Next Navigation
    document.getElementById('btn-mcq-prev')?.addEventListener('click', () => {
      if (currentQuestionIdx > 0) {
        currentQuestionIdx--;
        renderMCQPracticeView(dom, stats);
      }
    });

    document.getElementById('btn-mcq-next')?.addEventListener('click', () => {
      if (currentQuestionIdx < totalQ - 1) {
        currentQuestionIdx++;
        renderMCQPracticeView(dom, stats);
      }
    });

    // Finish Test
    const handleFinish = () => {
      completeTopicTest(topic.id, totalQ);
      isResultsMode = true;
      renderMCQPracticeView(dom, stats);
    };
    document.getElementById('btn-mcq-finish')?.addEventListener('click', handleFinish);
    document.getElementById('btn-palette-finish-test')?.addEventListener('click', () => {
      closePalette();
      handleFinish();
    });

    // Palette Drawer
    const openPalette = () => {
      isPaletteOpen = true;
      const el = document.getElementById('mcq-palette-overlay');
      if (el) {
        el.style.display = 'flex';
        setTimeout(() => el.classList.add('is-open'), 10);
      }
    };
    const closePalette = () => {
      isPaletteOpen = false;
      const el = document.getElementById('mcq-palette-overlay');
      if (el) {
        el.classList.remove('is-open');
        setTimeout(() => { el.style.display = 'none'; }, 200);
      }
    };

    document.getElementById('btn-mcq-palette')?.addEventListener('click', openPalette);
    document.getElementById('btn-close-palette')?.addEventListener('click', closePalette);
    document.getElementById('mcq-palette-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'mcq-palette-overlay') closePalette();
    });

    document.querySelectorAll('.mcq-palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const jIdx = parseInt(item.getAttribute('data-jump-idx'), 10);
        if (!isNaN(jIdx) && jIdx >= 0 && jIdx < totalQ) {
          currentQuestionIdx = jIdx;
          closePalette();
          renderMCQPracticeView(dom, stats);
        }
      });
    });
  }

  // --- Results & Review Screen ---
  function renderResultsView(dom, topic, chapter, subject, questions, progress) {
    const totalQ = questions.length || 1;
    const answers = progress.answers || {};
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q, idx) => {
      const a = answers[idx];
      if (a) {
        if (a.isCorrect) correctCount++;
        else incorrectCount++;
      } else {
        unattemptedCount++;
      }
    });

    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const ratingLabel = accuracy >= 80 ? 'Mastery Achieved!' : accuracy >= 60 ? 'Solid Performance' : 'Needs Reinforcement';
    const ratingColor = accuracy >= 80 ? 'var(--success)' : accuracy >= 60 ? 'var(--info)' : 'var(--warning)';

    dom.appMain.innerHTML = `
      <div class="mcq-results-container" style="--sub-accent: ${subject.accentColor || 'var(--accent-primary)'};">
        <header class="mcq-results-header">
          <button type="button" class="mcq-exit-btn" id="btn-results-back" aria-label="Back to Question Bank">
            <svg class="material-symbols-outlined"><use href="#fmd-i-arrow_back"/></svg>
          </button>
          <div class="mcq-results-header-info">
            <span class="mcq-topic-subtitle">${escapeHtml(subject.name)} • ${escapeHtml(chapter.name)}</span>
            <h2 class="mcq-topic-title">${escapeHtml(topic.name)}</h2>
          </div>
        </header>

        <!-- Score Celebration HUD Card -->
        <section class="mcq-score-card">
          <div class="mcq-trophy-icon" style="color: ${ratingColor};">
            <svg class="material-symbols-outlined"><use href="#fmd-i-emoji_events"/></svg>
          </div>
          <div class="mcq-score-digits" style="color: ${ratingColor};">
            ${correctCount} <span class="mcq-score-slash">/ ${totalQ}</span>
          </div>
          <div class="mcq-score-badge" style="background: color-mix(in srgb, ${ratingColor} 15%, transparent); color: ${ratingColor};">
            ${accuracy}% Accuracy • ${ratingLabel}
          </div>

          <!-- Breakdown Grid -->
          <div class="mcq-breakdown-grid">
            <div class="mcq-bd-cell">
              <span class="mcq-bd-num" style="color: var(--success);">${correctCount}</span>
              <span class="mcq-bd-lbl">Correct</span>
            </div>
            <div class="mcq-bd-cell">
              <span class="mcq-bd-num" style="color: var(--danger);">${incorrectCount}</span>
              <span class="mcq-bd-lbl">Incorrect</span>
            </div>
            <div class="mcq-bd-cell">
              <span class="mcq-bd-num" style="color: var(--text-muted);">${unattemptedCount}</span>
              <span class="mcq-bd-lbl">Unattempted</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="mcq-results-actions">
            <button type="button" class="v2-arcade-btn mcq-btn-retake" id="btn-retake-topic">
              <svg class="material-symbols-outlined"><use href="#fmd-i-sync"/></svg>
              <span>Retake Test</span>
            </button>
            <button type="button" class="v2-arcade-btn mcq-btn-done" id="btn-results-to-qbank">
              <span>Back to Question Bank</span>
              <svg class="material-symbols-outlined"><use href="#fmd-i-chevron_right"/></svg>
            </button>
          </div>
        </section>

        <!-- Detailed Question-by-Question Review List -->
        <section class="mcq-review-section">
          <h3 class="mcq-review-heading">Detailed Question Review</h3>
          
          <div class="mcq-review-list">
            ${questions.map((q, idx) => {
              const userAns = answers[idx];
              const isCorrect = userAns && userAns.isCorrect;
              const isUnattempted = !userAns;
              const isFlagged = progress.markedForReview && progress.markedForReview[idx];

              return `
                <div class="mcq-review-card ${isCorrect ? 'review-correct' : isUnattempted ? 'review-unattempted' : 'review-incorrect'}">
                  <div class="mcq-review-card-head">
                    <span class="mcq-review-qnum">Q${idx + 1}</span>
                    <span class="mcq-review-status-pill ${isCorrect ? 'pill-correct' : isUnattempted ? 'pill-unattempted' : 'pill-incorrect'}">
                      ${isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect'}
                    </span>
                    ${isFlagged ? `<span class="mcq-badge-review"><svg class="material-symbols-outlined"><use href="#fmd-i-flag"/></svg> Flagged</span>` : ''}
                  </div>

                  <div class="mcq-review-text">${escapeHtml(q.text)}</div>

                  <div class="mcq-review-options">
                    ${(q.options || []).map(opt => {
                      const isSelected = userAns && userAns.selectedOption === opt.id;
                      const isCorrectOpt = q.correctOption === opt.id;
                      let optClass = '';
                      if (isCorrectOpt) optClass = 'opt-is-correct';
                      else if (isSelected && !isCorrect) optClass = 'opt-is-wrong';

                      return `
                        <div class="mcq-review-opt ${optClass}">
                          <strong>(${opt.id})</strong> ${escapeHtml(opt.text)}
                          ${isCorrectOpt ? `<span class="review-check">✓ Correct Answer</span>` : isSelected ? `<span class="review-cross">✗ Your Answer</span>` : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div class="mcq-review-explanation">
                    <strong>Explanation:</strong> ${escapeHtml(q.explanation || '')}
                    ${q.keyConcept ? `<div class="mcq-review-key-concept"><strong>Takeaway:</strong> ${escapeHtml(q.keyConcept)}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      </div>
    `;

    // Events in results mode
    document.getElementById('btn-results-back')?.addEventListener('click', () => {
      isResultsMode = false;
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('qbank');
    });

    document.getElementById('btn-results-to-qbank')?.addEventListener('click', () => {
      isResultsMode = false;
      if (window.FlowMD.shell) window.FlowMD.shell.switchView('qbank');
    });

    document.getElementById('btn-retake-topic')?.addEventListener('click', () => {
      resetTopicTest(topic.id);
      currentQuestionIdx = 0;
      isResultsMode = false;
      showToast('Test reset. Good luck!', 'sync');
      renderMCQPracticeView(dom, stats);
    });
  }

  // Expose
  window.FlowMD.views = Object.assign(window.FlowMD.views || {}, {
    renderMCQPracticeView
  });
})();
