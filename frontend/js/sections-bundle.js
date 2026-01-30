/**
 * Bright AI - Consolidated Sections Bundle
 * يحتوي على جميع الأكواد المستخرجة والمنطق الخاص بالصفحة الرئيسية
 */

/* ==========================================================================
   1. NAVIGATION SYSTEM
   ========================================================================== */
(function () {
  'use strict';

  function initNavigation() {
    const nav = document.querySelector('.unified-nav');
    if (!nav) return; // حماية ضد الأخطاء

    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileDrawer = document.querySelector('.mobile-menu-drawer');
    const backdrop = document.querySelector('.backdrop-overlay');
    const dropdownToggles = document.querySelectorAll('.nav-link[aria-haspopup="true"]');

    // 1. Scroll Effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        nav.style.background = 'rgba(2, 6, 23, 0.95)';
        nav.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
      } else {
        nav.style.background = 'rgba(2, 6, 23, 0.85)';
        nav.style.boxShadow = 'none';
      }
    });

    // 2. Mobile Menu Toggle
    function toggleMobileMenu() {
      if (!mobileToggle || !mobileDrawer) return;

      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);

      if (!isExpanded) {
        mobileDrawer.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        mobileDrawer.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    if (mobileToggle) mobileToggle.addEventListener('click', toggleMobileMenu);
    if (backdrop) backdrop.addEventListener('click', toggleMobileMenu);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('active')) {
        toggleMobileMenu();
      }
    });

    // 3. Dropdown Interactions (Desktop)
    dropdownToggles.forEach(toggle => {
      const navItem = toggle.closest('.nav-item');
      const dropdown = toggle.nextElementSibling;

      if (!navItem || !dropdown) return;

      let closeTimer = null;

      const cancelClose = () => {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      };

      const scheduleClose = () => {
        closeTimer = setTimeout(() => {
          if (toggle.getAttribute('aria-expanded') === 'true') {
            toggle.setAttribute('aria-expanded', 'false');
          }
        }, 500);
      };

      // Events
      navItem.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          cancelClose();
          toggle.setAttribute('aria-expanded', 'true');
        }
      });

      navItem.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) scheduleClose();
      });

      dropdown.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) cancelClose();
      });

      dropdown.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) scheduleClose();
      });

      // Keyboard support
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
        }
      });
    });

    // 4. Mobile Dropdown Handling
    const mobileDropdownToggles = document.querySelectorAll('.mobile-nav-link[aria-haspopup="true"]');
    mobileDropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const submenu = toggle.nextElementSibling;
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

        if (!isExpanded) {
          // Close others
          mobileDropdownToggles.forEach(other => {
            if (other !== toggle) {
              other.setAttribute('aria-expanded', 'false');
              const otherSub = other.nextElementSibling;
              if (otherSub && otherSub.classList.contains('mobile-dropdown')) {
                otherSub.classList.remove('open');
              }
            }
          });
        }

        toggle.setAttribute('aria-expanded', !isExpanded);
        if (submenu) submenu.classList.toggle('open');
      });
    });

    // 5. Ensure links work (Logging mainly)
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', () => {
        // Link default behavior is preserved
        console.log('Navigating to:', item.getAttribute('href'));
      });
    });
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();

/* ==========================================================================
   2. COMPONENT LAZY LOADER (Previously ComponentLoader.js)
   ========================================================================== */
(function () {
  'use strict';

  // ... (اختصار: الكود الأصلي لـ ComponentLoader هنا، لا نحتاج لتكراره بالكامل إذا لم يتغير، 
  // لكن سأكتبه كاملاً لضمان عمل الملف)

  const ComponentLoader = {
    loadedComponents: new Set(),
    loadQueue: [],
    isLoading: false,

    async load(componentPath, targetSelector, options = {}) {
      const { insertPosition = 'replace', onLoad = null, onError = null, cache = true } = options;

      if (cache && this.loadedComponents.has(componentPath)) {
        return;
      }

      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        if (onError) onError(new Error(`Target not found: ${targetSelector}`));
        return;
      }

      try {
        this.showLoadingState(targetElement);
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        this.insertContent(targetElement, html, insertPosition);
        this.executeScripts(targetElement);

        if (cache) this.loadedComponents.add(componentPath);
        if (onLoad) onLoad(targetElement);

      } catch (error) {
        console.error(`[ComponentLoader] Error:`, error);
        this.showErrorState(targetElement);
        if (onError) onError(error);
      }
    },

    insertContent(element, html, position) {
      switch (position) {
        case 'replace': element.innerHTML = html; break;
        case 'before': element.insertAdjacentHTML('beforebegin', html); break;
        case 'after': element.insertAdjacentHTML('afterend', html); break;
        case 'prepend': element.insertAdjacentHTML('afterbegin', html); break;
        case 'append': element.insertAdjacentHTML('beforeend', html); break;
      }
    },

    executeScripts(container) {
      const scripts = container.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    },

    showLoadingState(element) {
      element.innerHTML = '<div style="padding:20px;text-align:center;opacity:0.5">Loading...</div>';
    },

    showErrorState(element) {
      element.innerHTML = '<div style="padding:20px;text-align:center;color:red">Error loading content</div>';
    },

    lazyLoad(selector, componentPath, options = {}) {
      const elements = document.querySelectorAll(selector);
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.load(componentPath, selector, options);
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '100px', threshold: 0.1 });
      elements.forEach(el => observer.observe(el));
    }
  };

  window.ComponentLoader = ComponentLoader;

  document.addEventListener('DOMContentLoaded', function () {
    const lazyComponents = document.querySelectorAll('[data-lazy-component]');
    lazyComponents.forEach(el => {
      const componentPath = el.dataset.lazyComponent;
      const targetSelector = el.dataset.lazyTarget || `#${el.id}`;
      ComponentLoader.lazyLoad(targetSelector, componentPath, {
        onLoad: () => { if (typeof AOS !== 'undefined') AOS.refresh(); }
      });
    });
  });
})();

/* ==========================================================================
   3. HOMEPAGE SPECIFICS (Canvas, Tabs, 3D)
   ========================================================================== */
(function () {
  'use strict';

  function initHomepageLogic() {
    try {
      initMedicalArchiveCanvas();
    } catch (e) { console.warn('Canvas init failed', e); }

    try {
      initCounters();
    } catch (e) { console.warn('Counters init failed', e); }

    try {
      initScrollAnimations();
    } catch (e) { }

    try {
      initFaqTabs();
    } catch (e) { }

    try {
      initFeatureTabs();
    } catch (e) { }
  }

  function initMedicalArchiveCanvas() {
    const canvas = document.getElementById('medical-archive-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Simplified Particles
    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 2,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#06b6d4' : '#10b981'
      });
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        if (p.z < 0 || p.z > 1000) p.vz *= -1;
        const scale = (1000 - p.z) / 1000;
        const size = p.radius * scale;
        const alpha = scale * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fill();
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  function initCounters() {
    const counters = document.querySelectorAll('.counter');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseFloat(counter.getAttribute('data-target'));
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();
          function update(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (target - start) * (1 - Math.pow(1 - progress, 4));
            counter.textContent = current.toFixed(1);
            if (progress < 1) requestAnimationFrame(update);
          }
          requestAnimationFrame(update);
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  }

  function initScrollAnimations() {
    const elements = document.querySelectorAll('.feature-card-3d, .benefit-card-3d');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          entry.target.style.transitionDelay = `${index * 0.1}s`;
        }
      });
    }, { threshold: 0.1 });
    elements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.6s ease-out';
      observer.observe(el);
    });
  }

  function initFaqTabs() {
    window.switchFaqTab = function (category, btn) {
      document.querySelectorAll('.faq-category').forEach(el => el.classList.add('hidden', 'block')); // Reset
      document.querySelectorAll('.faq-category').forEach(el => el.classList.remove('block')); // Fix classList logic error
      document.querySelectorAll('.faq-category').forEach(el => el.classList.add('hidden'));

      const selected = document.getElementById('faq-' + category);
      if (selected) {
        selected.classList.remove('hidden');
        selected.classList.add('block');
      }

      document.querySelectorAll('.faq-tab').forEach(el => {
        el.classList.remove('active', 'border-gold-500/20', 'bg-gold-500/10', 'text-gold-400');
        el.classList.add('border-white/5', 'bg-white/5', 'text-slate-400');
      });
      btn.classList.remove('border-white/5', 'bg-white/5', 'text-slate-400');
      btn.classList.add('active', 'border-gold-500/20', 'bg-gold-500/10', 'text-gold-400');
    }
  }

  function initFeatureTabs() {
    const featureContent = {
      vision: { icon: 'lucide:scan-face', color: 'indigo', title: 'دقة التشخيص', value: '98.5%' },
      predict: { icon: 'lucide:bar-chart-3', color: 'purple', title: 'دقة التنبؤ', value: '94.2%' },
      hospital: { icon: 'lucide:activity-square', color: 'green', title: 'كفاءة العمليات', value: '87.8%' },
      gemini: { icon: 'lucide:bot', color: 'gold', title: 'رضا المستخدم', value: '96.1%' }
    };

    window.updateFeature = function (featureKey, btn) {
      const feature = featureContent[featureKey];
      const container = document.getElementById('feature-content');
      if (!container || !feature) return;

      container.innerHTML = `
                <iconify-icon icon="${feature.icon}" width="64" class="text-${feature.color}-400"></iconify-icon>
                <div class="w-3/4 space-y-3">
                    <div class="h-2 bg-${feature.color}-500/20 rounded-full w-full overflow-hidden">
                        <div class="h-full bg-${feature.color}-500" style="width: ${feature.value}"></div>
                    </div>
                    <div class="flex justify-between text-xs text-${feature.color}-300">
                        <span>${feature.title}</span><span>${feature.value}</span>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4 w-full mt-4">
                     <div class="h-24 bg-white/5 rounded-lg border border-white/5 animate-pulse"></div>
                     <div class="h-24 bg-white/5 rounded-lg border border-white/5"></div>
                     <div class="h-24 bg-white/5 rounded-lg border border-white/5"></div>
                </div>
            `;
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomepageLogic);
  } else {
    initHomepageLogic();
  }
})();

/* ==========================================================================
   4. LAZY SECTIONS LOADER
   ========================================================================== */
(function () {
  'use strict';

  // ... (اختصار: الكود الأصلي لـ LazySections هنا)
  // سأكتبه لضمان وجوده
  const lazySections = new Map();
  let sectionObserver = null;

  function initLazySections() {
    const placeholders = document.querySelectorAll('[data-lazy-section]');
    if (placeholders.length === 0) return;

    sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadSection(entry.target);
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });

    placeholders.forEach(el => sectionObserver.observe(el));
  }

  async function loadSection(placeholder) {
    const sectionUrl = placeholder.dataset.lazySection;
    const sectionId = placeholder.id || 'unknown';
    if (!sectionUrl) return;

    placeholder.classList.add('lazy-section-loading'); // Simplified loading state

    try {
      const response = await fetch(sectionUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();

      placeholder.innerHTML = html;
      placeholder.classList.remove('lazy-section-loading');
      placeholder.classList.add('lazy-section-loaded');

      const scripts = placeholder.querySelectorAll('script');
      scripts.forEach(old => {
        const newScript = document.createElement('script');
        Array.from(old.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = old.textContent;
        old.parentNode.replaceChild(newScript, old);
      });

      if (typeof AOS !== 'undefined') AOS.refresh();
      if (typeof Iconify !== 'undefined') Iconify.scan(placeholder);

      placeholder.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId, sectionUrl } }));
    } catch (error) {
      console.error(`[Lazy] Error loading ${sectionId}`, error);
      placeholder.innerHTML = '<div class="text-red-500 p-4 text-center">Error loading section</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazySections);
  } else {
    initLazySections();
  }
})();
