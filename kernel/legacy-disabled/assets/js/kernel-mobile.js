/**
 * BrightAI Kernel - Mobile Module
 * Handles mobile-specific functionality: bottom nav, drawer, touch gestures, responsive behavior
 */

(function (global) {
  'use strict';

  const KernelMobile = {
    // Configuration
    config: {
      breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024,
      },
      swipeThreshold: 50,
      drawerWidth: 280,
      bottomNavHeight: 64,
    },

    // State
    state: {
      isMobile: false,
      isTablet: false,
      isDrawerOpen: false,
      touchStartX: 0,
      touchStartY: 0,
      currentSwipeX: 0,
      lastDrawerTrigger: null,
    },

    /**
     * Initialize mobile module
     */
    init() {
      this.detectDevice();
      this.setupViewport();
      this.bindEvents();
      this.handleResize();
      this.setupBottomNav();
      this.setupDrawer();
      this.setupPullToRefresh();
    },

    /**
     * Detect device type
     */
    detectDevice() {
      const width = window.innerWidth;
      this.state.isMobile = width < this.config.breakpoints.tablet;
      this.state.isTablet = width >= this.config.breakpoints.tablet && width < this.config.breakpoints.desktop;
      
      document.body.classList.toggle('is-mobile', this.state.isMobile);
      document.body.classList.toggle('is-tablet', this.state.isTablet);
      document.body.classList.toggle('is-desktop', !this.state.isMobile && !this.state.isTablet);
    },

    /**
     * Setup viewport for mobile
     */
    setupViewport() {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }

      // Set CSS custom property for viewport height (handles mobile browser bars)
      this.updateViewportHeight();
    },

    /**
     * Update viewport height CSS variable
     */
    updateViewportHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Resize handler
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.detectDevice();
          this.handleResize();
          this.updateViewportHeight();
        }, 150);
      });

      // Orientation change
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.updateViewportHeight();
          this.handleResize();
        }, 100);
      });

      // Touch events for swipe gestures
      document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

      // Prevent scroll when drawer is open
      document.addEventListener('touchmove', (e) => {
        if (this.state.isDrawerOpen && !e.target.closest('.mobile-drawer')) {
          e.preventDefault();
        }
      }, { passive: false });
    },

    /**
     * Handle resize event
     */
    handleResize() {
      // Close drawer on desktop
      if (!this.state.isMobile && this.state.isDrawerOpen) {
        this.closeDrawer();
      }

      // Update bottom nav visibility
      const bottomNav = document.getElementById('bottom-nav');
      if (bottomNav) {
        bottomNav.style.display = this.state.isMobile ? 'block' : 'none';
      }
    },

    /**
     * Setup bottom navigation
     */
    setupBottomNav() {
      const bottomNav = document.getElementById('bottom-nav');
      if (!bottomNav) return;

      // Add safe area padding for iOS
      const safeArea = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0', 10);
      if (safeArea > 0) {
        bottomNav.style.paddingBottom = `${safeArea}px`;
      }

      // Handle active state
      const items = bottomNav.querySelectorAll('.bottom-nav-item');
      items.forEach(item => {
        item.addEventListener('click', function() {
          items.forEach(i => i.classList.remove('active'));
          this.classList.add('active');
        });
      });

      // Hide on scroll down, show on scroll up
      let lastScrollY = window.scrollY;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            if (window.scrollY > lastScrollY && window.scrollY > 100) {
              bottomNav.classList.add('hidden');
            } else {
              bottomNav.classList.remove('hidden');
            }
            lastScrollY = window.scrollY;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    },

    /**
     * Setup drawer functionality
     */
    setupDrawer() {
      const hamburgerBtn = document.getElementById('hamburger-btn');
      const drawerClose = document.getElementById('drawer-close');
      const backdrop = document.getElementById('drawer-backdrop');

      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => this.toggleDrawer());
      }

      if (drawerClose) {
        drawerClose.addEventListener('click', () => this.closeDrawer());
      }

      if (backdrop) {
        backdrop.addEventListener('click', () => this.closeDrawer());
      }

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (!this.state.isDrawerOpen) return;
        if (e.key === 'Escape') {
          this.closeDrawer(true);
          return;
        }
        this.trapFocus(e, document.getElementById('mobile-drawer'));
      });
    },

    /**
     * Toggle drawer
     */
    toggleDrawer() {
      if (this.state.isDrawerOpen) {
        this.closeDrawer();
      } else {
        this.openDrawer();
      }
    },

    /**
     * Open drawer
     */
    openDrawer() {
      this.state.isDrawerOpen = true;
      this.state.lastDrawerTrigger = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : document.getElementById('hamburger-btn');
      
      const drawer = document.getElementById('mobile-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      const hamburgerBtn = document.getElementById('hamburger-btn');

      if (drawer) {
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        drawer.setAttribute('role', drawer.getAttribute('role') || 'dialog');
      }
      
      if (backdrop) {
        backdrop.classList.add('open');
      }
      
      if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', 'true');
      }

      document.body.style.overflow = 'hidden';
      this.focusFirstIn(drawer);
    },

    /**
     * Close drawer
     */
    closeDrawer(restoreFocus = true) {
      this.state.isDrawerOpen = false;
      
      const drawer = document.getElementById('mobile-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      const hamburgerBtn = document.getElementById('hamburger-btn');

      if (drawer) {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
      }
      
      if (backdrop) {
        backdrop.classList.remove('open');
      }
      
      if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }

      document.body.style.overflow = '';
      if (restoreFocus) this.restoreFocus(this.state.lastDrawerTrigger);
    },

    getFocusableElements(container) {
      if (!container) return [];
      return Array.from(container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.offsetParent !== null || element === document.activeElement);
    },

    focusFirstIn(container) {
      const first = this.getFocusableElements(container)[0];
      if (first) first.focus({ preventScroll: true });
    },

    restoreFocus(element) {
      if (element && document.contains(element) && typeof element.focus === 'function') {
        element.focus({ preventScroll: true });
      }
    },

    trapFocus(event, container) {
      if (event.key !== 'Tab' || !container) return;
      const focusable = this.getFocusableElements(container);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },

    /**
     * Handle touch start
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
      this.state.touchStartX = e.touches[0].clientX;
      this.state.touchStartY = e.touches[0].clientY;
    },

    /**
     * Handle touch move
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
      if (!this.state.isMobile) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const diffX = touchX - this.state.touchStartX;
      const diffY = touchY - this.state.touchStartY;

      // Only handle horizontal swipes
      if (Math.abs(diffX) < Math.abs(diffY)) return;

      this.state.currentSwipeX = diffX;

      // Swipe from left edge to open drawer (RTL: from right edge)
      const isRTL = document.dir === 'rtl';
      const edgeThreshold = 30;

      if (isRTL) {
        // RTL: swipe from right edge
        if (this.state.touchStartX > window.innerWidth - edgeThreshold && diffX < 0 && !this.state.isDrawerOpen) {
          e.preventDefault();
        }
      } else {
        // LTR: swipe from left edge
        if (this.state.touchStartX < edgeThreshold && diffX > 0 && !this.state.isDrawerOpen) {
          e.preventDefault();
        }
      }
    },

    /**
     * Handle touch end
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
      if (!this.state.isMobile) return;

      const diffX = this.state.currentSwipeX;
      const isRTL = document.dir === 'rtl';

      // Open drawer with swipe
      if (Math.abs(diffX) > this.config.swipeThreshold) {
        if (isRTL) {
          if (diffX < -this.config.swipeThreshold && !this.state.isDrawerOpen) {
            this.openDrawer();
          } else if (diffX > this.config.swipeThreshold && this.state.isDrawerOpen) {
            this.closeDrawer();
          }
        } else {
          if (diffX > this.config.swipeThreshold && !this.state.isDrawerOpen) {
            this.openDrawer();
          } else if (diffX < -this.config.swipeThreshold && this.state.isDrawerOpen) {
            this.closeDrawer();
          }
        }
      }

      this.state.currentSwipeX = 0;
    },

    /**
     * Setup pull to refresh
     */
    setupPullToRefresh() {
      if (!this.state.isMobile) return;

      let startY = 0;
      let pulling = false;
      const threshold = 80;
      let indicator = null;

      document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
          startY = e.touches[0].clientY;
          pulling = true;
        }
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (!pulling || window.scrollY > 0) return;

        const y = e.touches[0].clientY;
        const diff = y - startY;

        if (diff > 0 && diff < threshold * 2) {
          if (!indicator) {
            indicator = this.createPullIndicator();
          }
          indicator.style.transform = `translateY(${Math.min(diff, threshold)}px)`;
          indicator.style.opacity = Math.min(diff / threshold, 1);
        }
      }, { passive: true });

      document.addEventListener('touchend', () => {
        if (indicator) {
          const transform = indicator.style.transform;
          const match = transform.match(/translateY\((\d+)px\)/);
          const pulled = match ? parseInt(match[1], 10) : 0;

          if (pulled >= threshold) {
            this.triggerRefresh();
          }

          indicator.style.transform = 'translateY(0)';
          indicator.style.opacity = '0';
          setTimeout(() => {
            if (indicator) {
              indicator.remove();
              indicator = null;
            }
          }, 300);
        }
        pulling = false;
      }, { passive: true });
    },

    /**
     * Create pull to refresh indicator
     * @returns {HTMLElement} Indicator element
     */
    createPullIndicator() {
      const indicator = document.createElement('div');
      indicator.className = 'pull-indicator';
      indicator.innerHTML = global.KernelUtils?.sanitizeHtml?.(`
        <svg class="spinner" viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="60" stroke-dashoffset="0"/>
        </svg>
      `) || '';
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        z-index: 9999;
        padding: 12px;
        background: var(--glass-bg, rgba(255,255,255,0.1));
        border-radius: 50%;
        transition: transform 0.2s, opacity 0.2s;
        opacity: 0;
        color: var(--brand, #00D4FF);
      `;
      document.body.appendChild(indicator);
      return indicator;
    },

    /**
     * Trigger refresh action
     */
    triggerRefresh() {
      // Dispatch custom event for pages to handle
      const event = new CustomEvent('kernelRefresh');
      document.dispatchEvent(event);

      const loaders = ['loadStats', 'loadApprovals', 'loadAuditLog'];
      for (const loaderName of loaders) {
        if (typeof window[loaderName] === 'function') {
          window[loaderName]();
          return;
        }
      }

      if (typeof window.kernelAPI !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kernel-refresh'));
      }
    },

    /**
     * Show mobile toast
     * @param {string} message - Toast message
     * @param {string} type - Toast type
     */
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container') || this.createToastContainer();
      
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      container.appendChild(toast);
      
      // Animate in
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });

      // Auto remove
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    },

    /**
     * Create toast container
     * @returns {HTMLElement} Toast container
     */
    createToastContainer() {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
      return container;
    },

    /**
     * Check if device supports touch
     * @returns {boolean} Has touch support
     */
    hasTouch() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * Get safe area insets
     * @returns {Object} Safe area insets
     */
    getSafeAreaInsets() {
      const style = getComputedStyle(document.documentElement);
      return {
        top: parseInt(style.getPropertyValue('--sat') || '0', 10),
        right: parseInt(style.getPropertyValue('--sar') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
        left: parseInt(style.getPropertyValue('--sal') || '0', 10),
      };
    },

    /**
     * Vibrate device (if supported)
     * @param {number|Array} pattern - Vibration pattern
     */
    vibrate(pattern = 10) {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KernelMobile.init());
  } else {
    KernelMobile.init();
  }

  // Export to global scope
  global.KernelMobile = KernelMobile;

})(typeof window !== 'undefined' ? window : this);
