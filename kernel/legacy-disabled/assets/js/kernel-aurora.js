/**
 * BrightAI Kernel - Aurora Effects & Mouse Tracking
 * Adds interactive mouse-following glow to cards and aurora background movement
 */
(function () {
  'use strict';

  var initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    initCardMouseTracking();
    initAuroraMouseTracking();
    initStaggerAnimations();
    initRippleEffects();
  }

  /* ── Mouse-following glow on premium/glass cards ── */
  function initCardMouseTracking() {
    var cards = document.querySelectorAll(
      '.glass-card, .card-premium, .card-glow, .card-inner-glow, .action-card'
    );

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
      });

      card.addEventListener('mouseleave', function () {
        card.style.removeProperty('--mouse-x');
        card.style.removeProperty('--mouse-y');
      });
    });
  }

  /* ── Aurora background follows mouse subtly ── */
  function initAuroraMouseTracking() {
    var rafId = null;
    var targetX = 60;
    var targetY = 40;
    var currentX = 60;
    var currentY = 40;

    document.addEventListener('mousemove', function (e) {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;

      if (!rafId) {
        rafId = requestAnimationFrame(updateAurora);
      }
    });

    function updateAurora() {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      document.documentElement.style.setProperty('--aurora-x', currentX + '%');
      document.documentElement.style.setProperty('--aurora-y', currentY + '%');

      var dx = Math.abs(targetX - currentX);
      var dy = Math.abs(targetY - currentY);

      if (dx > 0.1 || dy > 0.1) {
        rafId = requestAnimationFrame(updateAurora);
      } else {
        rafId = null;
      }
    }
  }

  /* ── Staggered card entrance animations ── */
  function initStaggerAnimations() {
    var staggerContainers = document.querySelectorAll('.stagger-children');
    if (!staggerContainers.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('stagger-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );

      staggerContainers.forEach(function (container) {
        observer.observe(container);
      });
    } else {
      staggerContainers.forEach(function (container) {
        container.classList.add('stagger-visible');
      });
    }
  }

  /* ── Ripple effect on buttons ── */
  function initRippleEffects() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest(
        '.btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-gold'
      );
      if (!btn || btn.disabled) return;

      var existing = btn.querySelector('.ripple');
      if (existing) existing.remove();

      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      var x = e.clientX - rect.left - size / 2;
      var y = e.clientY - rect.top - size / 2;

      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      if (getComputedStyle(btn).position === 'static') {
        btn.style.position = 'relative';
      }
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);

      ripple.addEventListener('animationend', function () {
        ripple.remove();
      });
    });
  }

  /* ── Initialize on DOM ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
