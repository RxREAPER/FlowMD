/* ============================================================
   FlowMD Core — 16-Bit Pixel-Art Vector Logo Component
   Pure SVG generator. No runtime state.
   ============================================================ */
(function () {
  'use strict';

  // --- FlowMD 16-Bit Pixel-Art Vector Logo Component ---
  function getFlowMDLogoSVG(theme = 'dark', mode = 'full', heightPx = 40) {
    const isDark = theme === 'dark';
    const mainColor = isDark ? '#ffffff' : '#1e293b';
    const pinkColor = isDark ? '#ff3b5c' : '#ff1f46';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';
    const scatterColor = isDark ? '#cbd5e1' : '#475569';

    if (mode === 'icon') {
      return `
        <svg viewBox="0 0 160 90" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 6px ${isDark ? 'rgba(255,59,92,0.5)' : 'rgba(255,31,70,0.3)'});" class="flowmd-pixel-icon-svg">
          <!-- Pixel Scatter (Top Left) -->
          <rect x="10" y="8" width="5" height="5" fill="${scatterColor}" />
          <rect x="18" y="4" width="5" height="5" fill="${pinkColor}" />
          <rect x="6" y="16" width="5" height="5" fill="${mainColor}" />

          <!-- Pixel Letter F -->
          <path d="M 22 18 h 45 v 10 h -32 v 16 h 26 v 10 h -26 v 30 h -13 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

          <!-- 16-Bit Pixel Heart -->
          <path d="M 68 28 h 10 v -6 h 12 v 6 h 10 v 10 h -6 v 10 h -6 v 8 h -6 v 6 h -8 v -6 h -6 v -8 h -6 v -10 h -6 Z" fill="none" stroke="${pinkColor}" stroke-width="3.2" stroke-linecap="square" />
          
          <!-- ECG Pulse Line -->
          <path d="M 18 45 h 44 l 5 -14 l 6 26 l 6 -18 l 5 6 h 50" fill="none" stroke="${pinkColor}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" />

          <!-- Pixel Letter M -->
          <path d="M 98 18 h 12 l 14 24 l 14 -24 h 12 v 56 h -12 v -34 l -14 24 h -0 l -14 -24 v 34 h -12 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

          <!-- Pixel Scatter (Bottom Right) -->
          <rect x="144" y="60" width="5" height="5" fill="${pinkColor}" />
          <rect x="152" y="68" width="5" height="5" fill="${scatterColor}" />
          <rect x="140" y="74" width="5" height="5" fill="${pinkColor}" />
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 350 100" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 12px ${pinkColor}) drop-shadow(0 0 3px ${mainColor}) drop-shadow(0 0 1px ${pinkColor});" class="flowmd-logo-svg">
        <!-- Pixel Scatter (Top Left) -->
        <rect x="8" y="6" width="5" height="5" fill="${scatterColor}" />
        <rect x="16" y="2" width="5" height="5" fill="${pinkColor}" />
        <rect x="4" y="14" width="5" height="5" fill="${mainColor}" />

        <!-- Pixel Letter F -->
        <path d="M 20 16 h 45 v 10 h -32 v 16 h 26 v 10 h -26 v 30 h -13 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

        <!-- 16-Bit Pixel Heart -->
        <path d="M 66 26 h 10 v -6 h 12 v 6 h 10 v 10 h -6 v 10 h -6 v 8 h -6 v 6 h -8 v -6 h -6 v -8 h -6 v -10 h -6 Z" fill="none" stroke="${pinkColor}" stroke-width="3.2" stroke-linecap="square" />
        
        <!-- ECG Pulse Line -->
        <path d="M 16 43 h 44 l 5 -14 l 6 26 l 6 -18 l 5 6 h 50" fill="none" stroke="${pinkColor}" stroke-width="3.5" stroke-linecap="square" stroke-linejoin="miter" />

        <!-- Pixel Letter M -->
        <path d="M 96 16 h 12 l 14 24 l 14 -24 h 12 v 56 h -12 v -34 l -14 24 h -0 l -14 -24 v 34 h -12 Z" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linejoin="miter" />

        <!-- Pixel Scatter (Bottom Right) -->
        <rect x="142" y="58" width="5" height="5" fill="${pinkColor}" />
        <rect x="150" y="66" width="5" height="5" fill="${scatterColor}" />
        <rect x="138" y="72" width="5" height="5" fill="${pinkColor}" />

        <!-- FLowMD Typography -->
        <g transform="translate(175, 48)">
          <text x="0" y="0" fill="${mainColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">FL</text>
          
          <!-- Micro Heart for 'o' -->
          <g transform="translate(38, -18) scale(0.65)">
            <path d="M 8 6 h 5 v -3 h 6 v 3 h 5 v 5 h -3 v 5 h -3 v 4 h -3 v 3 h -4 v -3 h -3 v -4 h -3 v -5 h -3 Z" fill="${pinkColor}" />
            <path d="M 0 10 h 24" stroke="#ffffff" stroke-width="2" />
          </g>
          
          <text x="56" y="0" fill="${mainColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">w</text>
          <text x="82" y="0" fill="${pinkColor}" font-family="'Pixelify Sans', monospace" font-size="34" font-weight="700" letter-spacing="1">MD</text>
        </g>

        <!-- Tagline: [ PLAN. STUDY. TRACK. SUCCEED. ] -->
        <g transform="translate(175, 68)">
          <text x="0" y="0" fill="${pinkColor}" font-family="'VT323', monospace" font-size="14" font-weight="bold">[</text>
          <text x="8" y="0" fill="${subTextColor}" font-family="'VT323', monospace" font-size="12.5" font-weight="bold" letter-spacing="1.2">PLAN. STUDY. TRACK. SUCCEED.</text>
          <text x="144" y="0" fill="${pinkColor}" font-family="'VT323', monospace" font-size="14" font-weight="bold">]</text>
        </g>
      </svg>
    `;
  }

  window.FlowMD.logo = { getFlowMDLogoSVG };
})();
