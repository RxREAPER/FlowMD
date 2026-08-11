/* ============================================================
   FlowMD Features — Unified Toast System
   Self-contained toast queue, DOM injection, and animations.
   ============================================================ */
(function () {
  'use strict';

  const toastQueue = [];
  let toastActive = false;
  const MAX_TOASTS = 2;

  const escapeHtml = (window.FlowMD.constants && window.FlowMD.constants.escapeHtml)
    ? window.FlowMD.constants.escapeHtml
    : (v) => String(v == null ? '' : v);

  function dismissToast(toast) {
    if (toast.classList.contains('dismissing')) return;
    toast.classList.add('dismissing');
    toast.style.animation = 'toastSlideOut 0.2s ease-in forwards';
    setTimeout(() => {
      toast.remove();
      const idx = toastQueue.indexOf(toast);
      if (idx > -1) toastQueue.splice(idx, 1);
      toastActive = toastQueue.length > 0;
    }, 200);
  }

  function showToast(message, type = 'success', title = '') {
    // Remove old toasts if queue full
    if (toastQueue.length >= MAX_TOASTS) {
      toastQueue.shift().remove();
    }

    if (!toastActive) {
      if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
          position: fixed; bottom: 20px; right: 20px; z-index: 9999;
          display: flex; flex-direction: column; gap: 8px;
          pointer-events: none; max-width: 360px;
        `;
        document.body.appendChild(container);
      }
    }

    const toast = document.createElement('div');
    const alertTone = type === 'warning' ? 'warning' : type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success';
    const alertIcon = type === 'warning' ? 'warning' : type === 'error' ? 'error' : type === 'info' ? 'info' : 'check_circle';
    
    toast.className = `fm-alert fm-alert-${alertTone} fm-toast-alert`;
    toast.style.cssText = `
      pointer-events: auto; min-width: 280px; max-width: 360px;
      animation: toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 8px 24px -4px rgba(0,0,0,0.2);
    `;
    
    const titleHtml = title ? `<div class="fm-alert-title">${escapeHtml(title)}</div>` : '';
    toast.innerHTML = `
      ${window.FlowMD.icons.renderIcon(alertIcon, 'fm-alert-icon')}
      <div class="fm-alert-content">${titleHtml}<div class="fm-alert-message">${escapeHtml(message)}</div></div>
      <button class="fm-alert-close-btn" aria-label="Dismiss"><svg class="material-symbols-outlined"><use href="#fmd-i-close"/></svg></button>
    `;

    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    toastQueue.push(toast);
    toastActive = true;

    toast.querySelector('.fm-alert-close-btn').addEventListener('click', () => dismissToast(toast));

    // Auto-dismiss (short enough to notice, quick to get out of the way)
    const duration = type === 'error' ? 1500 : 1000;
    setTimeout(() => dismissToast(toast), duration);

    return toast;
  }

  // --- Toast Animations (injected once) ---
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes toastSlideIn {
        from { opacity: 0; transform: translateX(100%) translateY(20px); }
        to { opacity: 1; transform: translateX(0) translateY(0); }
      }
      @keyframes toastSlideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(120%) translateY(-10px); }
      }
      .fm-toast-alert {
        display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px;
        border-radius: 10px; border: 1px solid var(--border-color);
        background: var(--bg-surface-raised); color: var(--text-primary);
        font-family: var(--font-hud), 'Inter', sans-serif; font-size: 0.85rem;
      }
      .fm-toast-alert .fm-alert-content { flex: 1; }
      .fm-toast-alert .fm-alert-title { font-weight: 700; margin-bottom: 4px; }
      .fm-toast-alert .fm-alert-message { color: var(--text-secondary); line-height: 1.4; }
      .fm-toast-alert .fm-alert-close-btn {
        background: none; border: none; color: var(--text-muted); cursor: pointer;
        padding: 2px; display: flex; align-items: center; justify-content: center;
        font-size: 18px; line-height: 1; opacity: 0.6; transition: opacity 0.15s;
        flex-shrink: 0; margin-top: -2px;
      }
      .fm-toast-alert .fm-alert-close-btn:hover { opacity: 1; color: var(--text-primary); }
      [data-theme-style="retro"] .fm-toast-alert {
        border: 2px solid var(--v2-ink); border-radius: 0; box-shadow: 4px 4px 0 0 var(--v2-ink);
        background: var(--bg-surface-raised); font-family: var(--font-hud), "VT323", monospace;
      }
      [data-theme-style="retro"] .fm-toast-alert .fm-alert-close-btn { color: var(--v2-ink); }
    `;
    document.head.appendChild(style);
  }

  window.FlowMD.toast = { showToast, dismissToast };
  // Expose minimal toast API for external/testing use
  window.showToast = showToast;
})();
