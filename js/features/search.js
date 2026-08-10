/* ============================================================
   FlowMD Features — Spotlight Search
   Deep global search engine (subjects/chapters/videos) + the
   spotlight search modal UI and its result interactions.

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { getState, saveState, markStudyActivity } = window.FlowMD.store;
  const { getDataset } = window.FlowMD.sourceData;
  const { getSubjectIconSrc, getSubjectSvgIcon } = window.FlowMD.subjects;
  const { escapeHtml } = window.FlowMD.constants;
  const { showToast } = window.FlowMD.toast;

  // Same live object reference app.js uses — mutations are in-place.
  const state = getState();

  // --- Deep Global Search Engine ---
  function performDeepSearch(query) {
    const dataset = getDataset();
    if (!query || !dataset || dataset.length === 0) {
      return { subjects: [], chapters: [], videos: [], totalMatches: 0 };
    }

    const q = query.toLowerCase().trim();
    const matchedSubjects = [];
    const matchedChapters = [];
    const matchedVideos = [];

    dataset.forEach(subject => {
      const subName = subject.subject || '';
      const subId = subject.id || subName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const subIcon = getSubjectIconSrc(subId);
      const subSvgIcon = getSubjectSvgIcon(subId);

      if (subName.toLowerCase().includes(q)) {
        matchedSubjects.push({
          id: subId,
          name: subName,
          icon: subIcon,
          svgIcon: subSvgIcon,
          chaptersCount: subject.chapters ? subject.chapters.length : 0,
          videosCount: subject.chapters ? subject.chapters.reduce((acc, c) => acc + (c.videos ? c.videos.length : 0), 0) : 0
        });
      }

      if (subject.chapters) {
        subject.chapters.forEach(chapter => {
          const chapName = chapter.name || '';
          if (chapName.toLowerCase().includes(q)) {
            matchedChapters.push({
              chapterName: chapName,
              subjectName: subName,
              subjectId: subId,
              videoCount: chapter.videos ? chapter.videos.length : 0,
              icon: subIcon
            });
          }

          if (chapter.videos) {
            chapter.videos.forEach(v => {
              const vTitle = v.title || '';
              const vNum = v.videoNumber || '';
              if (vTitle.toLowerCase().includes(q) || vNum.toLowerCase().includes(q)) {
                matchedVideos.push({
                  id: v.id,
                  title: vTitle,
                  videoNumber: vNum,
                  durationMins: v.durationMins || 0,
                  durationSecs: v.durationSecs || 0,
                  subjectName: subName,
                  subjectId: subId,
                  chapterName: chapName,
                  isCompleted: !!state.completedVideos[v.id]
                });
              }
            });
          }
        });
      }
    });

    const totalMatches = matchedSubjects.length + matchedChapters.length + matchedVideos.length;

    return {
      subjects: matchedSubjects.slice(0, 8),
      chapters: matchedChapters.slice(0, 12),
      videos: matchedVideos.slice(0, 30),
      totalMatches
    };
  }

  // --- Spotlight Search Modal Engine ---
  function openSpotlightModal(initialQuery = '') {
    const modal = document.getElementById('spotlight-search-modal');
    const input = document.getElementById('spotlight-search-input');
    if (!modal || !input) return;

    modal.style.display = 'flex';
    input.value = initialQuery || state.searchQuery || '';
    setTimeout(() => input.focus(), 50);
    renderSpotlightResults(input.value);
  }

  function closeSpotlightModal() {
    const modal = document.getElementById('spotlight-search-modal');
    if (modal) modal.style.display = 'none';
  }

  function renderSpotlightResults(query) {
    const container = document.getElementById('spotlight-results-container');
    if (!container) return;

    const q = (query || '').trim().toLowerCase();

    if (!q) {
      // Search Guide — helps users understand the search functionality
      container.innerHTML = `
        <div class="fm-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">search</span> What Can You Search?</div>
        <div style="font-family: 'Poppins', sans-serif; font-size: 0.88rem; color: var(--text-muted); padding: 8px 0 4px 4px; line-height: 1.8;">
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Subjects</strong> — e.g. "anatomy", "pharmacology", "medicine"</div>
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Chapters</strong> — e.g. "cardiovascular", "neurology", "head and neck"</div>
          <div style="display: flex; gap: 6px; margin-bottom: 2px;"><span style="color: var(--accent-primary);">★</span> <strong>Video Topics</strong> — e.g. "glaucoma", "MI", "fracture", "biochemistry"</div>
        </div>
      `;

      return;
    }

    // Deep search results only (no command palette shortcuts)
    const searchData = performDeepSearch(q);

    if (searchData.totalMatches === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 0; font-family: 'Poppins', sans-serif; font-size: 1.1rem;">
          No matching subjects, chapters, or video topics found for "${escapeHtml(q)}". Try: <br><span style="color: var(--text-primary);">anatomy, pharmacology, cardiology, biochemistry...</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `

      ${searchData.subjects.length > 0 ? `
        <div class="fm-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">menu_book</span> Subjects (${searchData.subjects.length})</div>
        ${searchData.subjects.map(s => `
          <div class="v2-pixel-card spotlight-item" data-type="subject" data-id="${s.id}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="subject-icon-wrapper">${s.svgIcon}</div>
                <span style="font-weight: 700; font-size: 0.95rem; font-family: var(--font-display);">${s.name}</span>
            </div>
            <span class="v2-hud-badge">${s.videosCount} vids</span>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.chapters.length > 0 ? `
        <div class="fm-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">auto_stories</span> Chapters (${searchData.chapters.length})</div>
        ${searchData.chapters.map(c => `
          <div class="v2-pixel-card spotlight-item" data-type="chapter" data-id="${c.subjectId}" data-chap="${c.chapterName}" style="cursor: pointer; padding: 10px 14px; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 0.92rem; font-family: var(--font-display);">${c.chapterName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${c.subjectName} • ${c.videoCount} videos</div>
          </div>
        `).join('')}
      ` : ''}

      ${searchData.videos.length > 0 ? `
        <div class="fm-command-group-header"><span class="material-symbols-outlined" style="font-size:18px;">play_circle</span> Video Topics (${searchData.videos.length})</div>
        <div class="v2-quest-card" style="padding-top: 14px; margin-top: 6px;">
          ${searchData.videos.map(v => {
            const isDone = v.isCompleted;
            let vNum = v.videoNumber || '#1';
            vNum = '#' + vNum.replace(/^#+/, '');
            return `
              <div class="v2-quest-row ${isDone ? 'completed' : ''}">
                <label class="v2-pixel-checkbox-label">
                  <input type="checkbox" class="spotlight-vid-chk" data-video-id="${v.id}" ${isDone ? 'checked' : ''}>
                  <span class="v2-pixel-checkbox-box"></span>
                  <div>
                    <div class="v2-quest-title"><span style="color: var(--accent-primary); font-family: var(--font-hud); margin-right: 4px;">${vNum}</span> ${v.title}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-hud); margin-top: 2px;">
                      <span>${v.subjectName}</span> • <span>${v.chapterName}</span>
                    </div>
                  </div>
                </label>
                <div style="font-family: var(--font-hud); font-size: 0.95rem; color: var(--text-muted); font-weight: 700;">${v.durationMins || 0}m ${v.durationSecs || 0}s</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
     `;

    document.querySelectorAll('.spotlight-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        const id = item.getAttribute('data-id');
        state.activeSubjectId = id;
        if (type === 'chapter') {
          const chap = item.getAttribute('data-chap');
          state.expandedChapters[chap] = true;
        }
        closeSpotlightModal();
        if (window.FlowMD.shell) window.FlowMD.shell.switchView('subject_detail');
      });
    });

    document.querySelectorAll('.spotlight-vid-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const vidId = e.target.getAttribute('data-video-id');
        if (e.target.checked) {
          state.completedVideos[vidId] = true;
          markStudyActivity(true);
          showToast('Completed Video!', 'check_circle');
        } else {
          delete state.completedVideos[vidId];
          markStudyActivity(false);
        }
        saveState();
        renderSpotlightResults(query);
      });
    });
  }

  // Expose
  window.FlowMD.search = {
    performDeepSearch,
    openSpotlightModal,
    closeSpotlightModal,
    renderSpotlightResults
  };
})();
