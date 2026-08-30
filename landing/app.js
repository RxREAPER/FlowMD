/* ============================================================
   FlowMD Landing — Interactions
   Hero scene carousel (auto-advance, prev/next, dots, keyboard,
   swipe) and the mobile nav toggle. No dependencies, no inline
   handlers, no console.error output paths.
   ============================================================ */
(function () {
  'use strict';


  function initThemeToggle() {
    var switchEl = document.getElementById('theme-switch');
    if (!switchEl) return;
    var btns = switchEl.querySelectorAll('.theme-btn');

    // Default to light; check localStorage
    var stored = localStorage.getItem('flowmd-landing-theme');
    var isDark = stored === 'dark';
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');

    // Set initial active state
    btns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-theme') === (isDark ? 'dark' : 'light'));
    });

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = btn.getAttribute('data-theme');
        if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('flowmd-landing-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('flowmd-landing-theme', 'light');
        }
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

  function initCarousel() {
    var carousel = document.getElementById('hero-carousel');
    if (!carousel) return;

    var slides = carousel.querySelectorAll('.hero-slide');
    var dotsWrap = carousel.querySelector('.hero-dots');
    var prevBtn = document.getElementById('hero-prev');
    var nextBtn = document.getElementById('hero-next');
    var current = 0;
    var timer = null;

    if (slides.length < 2) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    // Dots
    for (var i = 0; i < slides.length; i++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', (function (idx) {
        return function () { show(idx); restart(); };
      })(i));
      dotsWrap.appendChild(dot);
    }
    var dots = dotsWrap.querySelectorAll('button');

    function show(index) {
      current = (index + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        slides[i].classList.toggle('active', i === current);
      }
      for (var d = 0; d < dots.length; d++) {
        if (d === current) dots[d].setAttribute('aria-current', 'true');
        else dots[d].removeAttribute('aria-current');
      }
    }

    function next() { show(current + 1); }
    function prev() { show(current - 1); }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 8000);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

    // Pause on hover / focus, resume on leave
    carousel.addEventListener('mouseenter', function () { if (timer) clearInterval(timer); });
    carousel.addEventListener('mouseleave', restart);
    carousel.addEventListener('focusin', function () { if (timer) clearInterval(timer); });
    carousel.addEventListener('focusout', restart);

    // Keyboard arrows while the carousel has focus
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { next(); restart(); }
      else if (e.key === 'ArrowLeft') { prev(); restart(); }
    });

    // Touch swipe
    var startX = null;
    carousel.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].clientX;
    }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (dx > 40) { prev(); restart(); }
      else if (dx < -40) { next(); restart(); }
      startX = null;
    }, { passive: true });

    show(0);
    restart();
  }

  function initNavToggle() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close the mobile menu after choosing a destination.
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initThemeToggle();
      initCarousel();
      initNavToggle();
    });
  } else {
    initThemeToggle();
    initCarousel();
    initNavToggle();
  }
})();
