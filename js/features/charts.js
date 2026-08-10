/* ============================================================
   FlowMD Features — Charts
   SVG/HTML string builders: the 7-Day Execution Chart and the
   per-subject completion heatmap. Pure renderers — no state writes.

   Extracted verbatim from app.js (2026-08-10). Behavior unchanged.
   ============================================================ */
(function () {
  'use strict';

  const { FLOWMD_ICONS, SUBJECT_ICONS, SUBJECT_SVG_ICONS, SUBJECT_COLORS, escapeHtml } = window.FlowMD.constants;
  const { getDailyCountsExcludingBulk } = window.FlowMD.sourceData;
  const { getSubjectColor } = window.FlowMD.subjects;

  function renderPixelSubjectHeatmap(stats) {
    const subjects = (stats && stats.subjectsStats) || [];
    let countCritical = 0;
    let countPace = 0;
    let countAdvanced = 0;
    let countMastered = 0;

    subjects.forEach(sub => {
      if (sub.percentage >= 75) countMastered++;
      else if (sub.percentage >= 50) countAdvanced++;
      else if (sub.percentage >= 25) countPace++;
      else countCritical++;
    });

    const overallPct = stats ? stats.percentage : 0;

    return `
      <div class="fm-feature-card fm-subject-heatmap-card" style="margin-top: 24px; margin-bottom: 24px; padding: 20px;">
        
        <!-- Header Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg class="fm-icon" viewBox="0 0 16 16" width="20" height="20" fill="none">
              <rect x="2" y="2" width="5" height="5" fill="#00f0ff" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="2" width="5" height="5" fill="#00ff88" stroke="#000000" stroke-width="1"/>
              <rect x="2" y="9" width="5" height="5" fill="#ffaa00" stroke="#000000" stroke-width="1"/>
              <rect x="9" y="9" width="5" height="5" fill="#ff5555" stroke="#000000" stroke-width="1"/>
            </svg>
            <h3 class="heatmap-card-title">SUBJECT COMPLETION HEATMAP</h3>
            <span class="help-icon-btn" data-help-type="subject-heatmap" title="Subject Mastery Tier Rules">
              <svg class="fm-icon" viewBox="0 0 16 16" width="16" height="16" fill="none">
                <circle cx="8" cy="8" r="7" fill="rgba(0, 240, 255, 0.2)" stroke="currentColor" stroke-width="2" />
                <path d="M8 4.5V5.5M8 7.5V11.5" stroke="#ffffff" stroke-width="2" stroke-linecap="square" />
              </svg>
            </span>
          </div>
          
          <!-- Live Mastery Counter Badge -->
          <span class="v2-hud-badge">OVERALL MASTERY: ${overallPct}%</span>
        </div>

        <!-- Telemetry Overview Bar -->
        <div class="fm-heatmap-telemetry-bar">
          <div class="fm-heatmap-stat">
            <span class="fm-stat-dot" style="background: #ff5555;"></span>
            <span class="fm-stat-lbl">CRITICAL (&lt;25%):</span>
            <span class="fm-stat-val" style="color: #ff5555;">${countCritical}</span>
          </div>
          <div class="fm-heatmap-stat">
            <span class="fm-stat-dot" style="background: #ffaa00;"></span>
            <span class="fm-stat-lbl">IN PROGRESS (25-50%):</span>
            <span class="fm-stat-val" style="color: #ffaa00;">${countPace}</span>
          </div>
          <div class="fm-heatmap-stat">
            <span class="fm-stat-dot" style="background: #00f0ff;"></span>
            <span class="fm-stat-lbl">ADVANCED (50-75%):</span>
            <span class="fm-stat-val" style="color: #00f0ff;">${countAdvanced}</span>
          </div>
          <div class="fm-heatmap-stat">
            <span class="fm-stat-dot" style="background: #00ff88;"></span>
            <span class="fm-stat-lbl">MASTERED (75%+):</span>
            <span class="fm-stat-val" style="color: #00ff88;">${countMastered}</span>
          </div>
        </div>

        <!-- Interactive Tier Filter Bar -->
        <div class="fm-heatmap-filter-bar">
          <span class="heatmap-filter-label">FILTER TIERS:</span>
          <div class="heatmap-filter-group">
            <button type="button" class="fm-heatmap-filter-btn active" data-filter="all">ALL (${subjects.length})</button>
            <button type="button" class="fm-heatmap-filter-btn tier-critical" data-filter="critical">&lt;25% (${countCritical})</button>
            <button type="button" class="fm-heatmap-filter-btn tier-pace" data-filter="pace">25%–50% (${countPace})</button>
            <button type="button" class="fm-heatmap-filter-btn tier-advanced" data-filter="advanced">50%–75% (${countAdvanced})</button>
            <button type="button" class="fm-heatmap-filter-btn tier-mastered" data-filter="mastered">75%+ (${countMastered})</button>
          </div>
        </div>

        <!-- Heatmap Grid -->
        <div class="fm-heatmap-grid">
          ${subjects.map(sub => {
            let tierClass = 'critical';
            let tierColor = '#ff5555';
            let tierBg = 'rgba(255, 85, 85, 0.12)';
            
            if (sub.percentage >= 75) {
              tierClass = 'mastered';
              tierColor = '#00ff88';
              tierBg = 'rgba(0, 255, 136, 0.14)';
            } else if (sub.percentage >= 50) {
              tierClass = 'advanced';
              tierColor = '#00f0ff';
              tierBg = 'rgba(0, 240, 255, 0.14)';
            } else if (sub.percentage >= 25) {
              tierClass = 'pace';
              tierColor = '#ffaa00';
              tierBg = 'rgba(255, 170, 0, 0.12)';
            }

            return `
              <div class="fm-heatmap-tile subject-card" data-subject-id="${sub.id}" data-tier="${tierClass}" title="Click to open ${sub.name}: ${sub.percentage.toFixed(1)}% (${sub.completedVideos}/${sub.totalVideos} videos)" style="--subject-accent: ${sub.accentColor};">
                
                <!-- Subject Icon -->
                <div class="fm-tile-icon-area" style="color: ${sub.accentColor};">
                  ${sub.svgIcon}
                </div>

                <!-- Subject Name -->
                <div class="fm-tile-name" title="${sub.name}">${sub.name}</div>

                <!-- Hours -->
                <div class="fm-tile-hours" style="font-family: var(--font-hud); font-size: 0.68rem; color: var(--text-muted); margin: 2px 0;">${sub.completedHours} / ${sub.totalHours}h</div>

                <!-- Tier Badge -->
                <div class="fm-tile-bottom">
                  <span class="fm-tile-tier-tag" style="color: ${tierColor};">${sub.percentage.toFixed(0)}%</span>
                  <span class="fm-tile-telemetry">${sub.completedVideos}/${sub.totalVideos}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }



  function renderExecutionChart(last7Days, vidsDay, maxChartVal) {
    const dailyCounts = getDailyCountsExcludingBulk();
    const width = 600;
    const height = 200;
    const padL = 14;
    const padR = 14;
    const padT = 32;
    const padB = 26;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const baseY = padT + chartH;
    const scale = Math.max(1, maxChartVal);

    const points = last7Days.map((d, i) => {
      const count = dailyCounts[d.dateKey] || 0;
      const x = padL + (chartW * i) / (last7Days.length - 1);
      const y = padT + chartH - Math.min(chartH, (count / scale) * chartH);
      return { x, y, count, label: d.label, isMet: count >= vidsDay };
    });

    const targetY = padT + chartH - Math.min(chartH, (vidsDay / scale) * chartH);
    const total7DayVids = points.reduce((sum, p) => sum + p.count, 0);
    const metDays = points.filter(p => p.isMet).length;

    const smoothPath = (pts) => {
      if (pts.length < 2) return pts.length ? 'M ' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2) : '';
      let d = 'M ' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ' C ' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) + ', ' + c2x.toFixed(2) + ' ' + c2y.toFixed(2) + ', ' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
      }
      return d;
    };

    const linePath = smoothPath(points);
    const areaPath = linePath
      ? linePath + ' L ' + points[points.length - 1].x.toFixed(2) + ' ' + baseY.toFixed(2) + ' L ' + points[0].x.toFixed(2) + ' ' + baseY.toFixed(2) + ' Z'
      : '';
    const gridY = [0.25, 0.5, 0.75].map(f => padT + chartH - chartH * f);

    return `
      <section class="chart-card">
        <div class="chart-head">
          <div class="chart-titlewrap">
            <span class="chart-icon"><span class="material-symbols-outlined">bar_chart</span></span>
            <div>
              <div class="chart-kicker">Execution &mdash; Last 7 Days</div>
              <h3 class="chart-title">7-Day Execution Chart</h3>
            </div>
          </div>
          <span class="v2-hud-badge chart-target-badge">TARGET ${vidsDay} VIDS/DAY</span>
        </div>

        <div class="chart-legend">
          <span class="chart-legend-item"><span class="ex-dot ex-dot-met"></span> Target Met</span>
          <span class="chart-legend-item"><span class="ex-dot ex-dot-part"></span> Partial</span>
          <span class="chart-legend-item"><span class="ex-dot ex-dot-zero"></span> No Study</span>
          <span class="chart-legend-item chart-legend-target"><span class="ex-dot ex-dot-target"></span> Daily Target</span>
        </div>

        <div class="chart-plot">
          <svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="7-day video execution chart">
            <defs>
              <linearGradient id="exChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style="stop-color:var(--accent-primary); stop-opacity:0.30" />
                <stop offset="100%" style="stop-color:var(--accent-primary); stop-opacity:0.02" />
              </linearGradient>
            </defs>

            ${gridY.map(y => '<line class="chart-gridline" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (width - padR) + '" y2="' + y.toFixed(1) + '"></line>').join('')}
            <line class="chart-baseline" x1="${padL}" y1="${baseY}" x2="${width - padR}" y2="${baseY}" />
            <line class="chart-targetline" x1="${padL}" y1="${targetY.toFixed(1)}" x2="${width - padR}" y2="${targetY.toFixed(1)}" />
            <text class="chart-targetlabel" x="${width - padR}" y="${Math.max(12, targetY - 7)}">TARGET ${vidsDay}/DAY</text>

            ${areaPath ? '<path d="' + areaPath + '" class="chart-area" />' : ''}
            ${linePath ? '<path d="' + linePath + '" class="chart-line" />' : ''}

            ${points.map(p => {
              const nodeCls = p.count === 0 ? 'zero' : (p.isMet ? 'met' : 'part');
              const ptCls = p.count === 0 ? 'is-zero' : (p.isMet ? 'is-met' : 'is-part');
              const titleText = p.label + ': ' + p.count + ' video' + (p.count !== 1 ? 's' : '') + (p.isMet ? ' Target Met' : (p.count > 0 ? ' Partial' : ' No study'));
              const star = p.isMet && p.count > 0 ? ' \u2605' : '';
              return `
              <g class="chart-point ${ptCls}">
                <title>${p.label}: ${titleText}</title>
                <text class="chart-val" x="${p.x.toFixed(2)}" y="${Math.max(12, p.y - 11)}">${p.count}${star}</text>
                <circle class="chart-node ex-node-${nodeCls}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5" />
              </g>
            `}).join('')}

            ${points.map(p => '<text class="chart-xlabel" x="' + p.x.toFixed(2) + '" y="' + (height - 5) + '">' + p.label + '</text>').join('')}
          </svg>
        </div>

        <div class="chart-days">
          ${points.map(p => {
            const tileCls = p.count === 0 ? 'is-zero' : (p.isMet ? 'is-met' : 'is-part');
            const titleText = p.label + ': ' + p.count + ' video' + (p.count !== 1 ? 's' : '') + ' ' + (p.isMet ? 'Target Met' : (p.count > 0 ? 'Partial' : 'No study'));
            const fillPct = Math.min(100, Math.round((p.count / Math.max(vidsDay, 1)) * 100));
            const status = p.isMet ? 'MET' : (p.count > 0 ? 'PARTIAL' : '0 VIDS');
            return `
              <div class="ex-day-tile ${tileCls}" title="${titleText}">
                <div class="ex-day-name">${p.label}</div>
                <div class="ex-day-count">${p.count}</div>
                <div class="ex-day-status">${status}</div>
                <div class="ex-day-track"><div class="ex-day-fill" style="width:${fillPct}%"></div></div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="chart-foot">
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--accent-primary)"></span> Total <b>${total7DayVids} vids</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--success)"></span> Target Met <b>${metDays}/7 days</b></span>
          <span class="anl-chip"><span class="anl-chip-dot" style="--chip:var(--warning)"></span> Pace <b>${Math.round((total7DayVids / Math.max(vidsDay * 7, 1)) * 100)}%</b></span>
        </div>
      </section>
    `;
  }

  // --- View 4: Target & Goal-Driven Analytics Suite (Dual-Plan) ---

  // Expose
  window.FlowMD.charts = {
    renderExecutionChart,
    renderPixelSubjectHeatmap
  };
})();
