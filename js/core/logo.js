/* ============================================================
   FlowMD Core — Modern "MD" Logo Component
   Pure SVG generator. No runtime state.
   ============================================================ */
(function () {
  'use strict';

  function getFlowMDLogoSVG(theme = 'dark', mode = 'full', heightPx = 40) {
    const isDark = theme === 'dark';
    const mainColor = isDark ? '#ffffff' : '#1e293b';
    const accentColor = '#7851A9';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';

    if (mode === 'icon') {
      return `
        <svg viewBox="0 0 120 60" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 8px rgba(120,81,169,0.4));" class="flowmd-icon-svg">
          <g fill="none" stroke="${accentColor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M 10 48 V 12 L 28 32 L 46 12 V 48"/>
            <path d="M 56 48 V 12 H 78 Q 100 12 100 30 Q 100 48 78 48 Z"/>
          </g>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 260 60" style="height: ${heightPx}px; width: auto; overflow: visible; display: inline-block; vertical-align: middle; filter: drop-shadow(0 0 10px rgba(120,81,169,0.35));" class="flowmd-logo-svg">
        <g fill="none" stroke="${accentColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M 6 48 V 12 L 21 30 L 36 12 V 48"/>
          <path d="M 44 48 V 12 H 62 Q 80 12 80 30 Q 80 48 62 48 Z"/>
        </g>

        <g transform="translate(96, 38)">
          <text x="0" y="0" fill="${mainColor}" font-family="'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="26" font-weight="600" letter-spacing="-0.5">Flow</text>
          <text x="52" y="0" fill="${accentColor}" font-family="'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="-0.5">MD</text>
        </g>

        <g transform="translate(96, 54)">
          <text x="0" y="0" fill="${subTextColor}" font-family="'SF Mono','Fira Code','Consolas',monospace" font-size="7.5" font-weight="500" letter-spacing="1.5">PLAN. STUDY. TRACK. SUCCEED.</text>
        </g>
      </svg>
    `;
  }

  window.FlowMD.logo = { getFlowMDLogoSVG };
})();
