/**
 * BrightAI Kernel - Utility Functions
 * Common helper functions for the kernel UI
 */

(function (global) {
  'use strict';

  const KernelUtils = {
    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
      if (!str) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return String(str).replace(/[&<>"']/g, (m) => map[m]);
    },

    /**
     * Sanitize controlled HTML templates before inserting them into the DOM.
     * Uses DOMPurify when available, then falls back to the local DOMParser allowlist.
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHtml(html) {
      const source = String(html || '');
      const allowedTags = [
        'a', 'article', 'b', 'br', 'button', 'circle', 'div', 'em', 'footer',
        'form', 'g', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'i',
        'iconify-icon', 'input', 'label', 'li', 'line', 'main', 'nav', 'ol', 'option', 'p',
        'path', 'polygon', 'polyline', 'pre', 'code', 'rect', 'section',
        'select', 'small', 'span', 'strong', 'svg', 'table', 'tbody', 'td',
        'textarea', 'th', 'thead', 'time', 'tr', 'ul'
      ];
      const allowedAttrs = [
        'autocomplete', 'aria-controls', 'aria-current', 'aria-expanded', 'aria-haspopup',
        'aria-hidden', 'aria-label', 'aria-live', 'aria-pressed', 'aria-selected',
        'checked', 'class', 'clip-rule', 'colspan', 'cx', 'cy', 'd', 'datetime',
        'dir', 'disabled', 'fill', 'fill-rule', 'flip', 'for', 'height', 'hidden', 'href',
        'icon', 'id', 'lang', 'max', 'min', 'name', 'opacity', 'placeholder', 'points',
        'r', 'rel', 'role', 'rx', 'ry', 'selected', 'step', 'stroke',
        'preserveAspectRatio', 'preserveaspectratio', 'rotate', 'spellcheck',
        'stroke-linecap', 'stroke-linejoin', 'stroke-width', 'style',
        'tabindex', 'target', 'title', 'type', 'value', 'viewBox', 'width', 'x',
        'x1', 'x2', 'y', 'y1', 'y2'
      ];

      if (typeof global.DOMPurify !== 'undefined' && global.DOMPurify?.sanitize) {
        return global.DOMPurify.sanitize(source, {
          ALLOWED_TAGS: allowedTags,
          ALLOWED_ATTR: allowedAttrs,
          ALLOW_ARIA_ATTR: true,
          ALLOW_DATA_ATTR: true,
        });
      }

      if (typeof global.DOMParser === 'function') {
        const doc = new global.DOMParser().parseFromString(`<div>${source}</div>`, 'text/html');
        const root = doc.body.firstElementChild;
        const tagSet = new Set(allowedTags);
        const attrSet = new Set(allowedAttrs.map((attr) => attr.toLowerCase()));

        root.querySelectorAll('*').forEach((node) => {
          if (!tagSet.has(node.tagName.toLowerCase())) {
            node.replaceWith(...Array.from(node.childNodes));
            return;
          }

          Array.from(node.attributes).forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value || '';
            const unsafeUrl = ['href', 'src'].includes(name) && /^\s*javascript:/i.test(value);
            const unsafeStyle = name === 'style' && /(javascript:|expression\s*\(|url\s*\()/i.test(value);
            const allowedPattern = name.startsWith('data-') || name.startsWith('aria-');
            if ((!attrSet.has(name) && !allowedPattern) || name.startsWith('on') || unsafeUrl || unsafeStyle) {
              node.removeAttribute(attr.name);
            }
          });
        });

        return root.innerHTML;
      }

      return KernelUtils.escapeHtml(source);
    },

    resolveGlobalFunction(path) {
      return String(path || '').split('.').reduce((ctx, key) => (ctx && ctx[key] ? ctx[key] : null), global);
    },

    getDelegatedArg(target, token, event) {
      if (token === '__element__') return target;
      if (token === '__event__') return event;
      if (token === '__checked__') return Boolean(target.checked);
      if (token === '__value__') return target.value;
      if (token === '__files__') return target.files;
      if (token && token.startsWith('__dataset:') && token.endsWith('__')) {
        const key = token.slice(10, -2);
        return target.dataset ? target.dataset[key] : '';
      }
      if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
      return token;
    },

    invokeDelegatedAction(target, event, actionKey = 'kernelClick') {
      const action = target?.dataset?.[actionKey];
      if (!action) return;
      const fn = KernelUtils.resolveGlobalFunction(action);
      if (typeof fn !== 'function') return;

      const args = [];
      for (let index = 0; index < 8; index += 1) {
        const attr = target.getAttribute(`data-kernel-arg-${index}`);
        if (attr === null) break;
        args.push(KernelUtils.getDelegatedArg(target, attr, event));
      }
      fn(...args);
    },

    initDelegatedActions() {
      if (!global.document?.addEventListener) return;
      if (KernelUtils._delegatedActionsReady) return;
      KernelUtils._delegatedActionsReady = true;

      document.addEventListener('click', (event) => {
        const stopTarget = event.target.closest('[data-kernel-stop="true"]');
        if (stopTarget) event.stopPropagation();

        const target = event.target.closest('[data-kernel-click]');
        if (!target) return;
        if (target.disabled || target.getAttribute('aria-disabled') === 'true') return;
        if (target.dataset.kernelPrevent === 'true') event.preventDefault();
        KernelUtils.invokeDelegatedAction(target, event);
      });

      document.addEventListener('change', (event) => {
        const target = event.target.closest('[data-kernel-change]');
        if (!target) return;
        KernelUtils.invokeDelegatedAction(target, event, 'kernelChange');
      });

      document.addEventListener('input', (event) => {
        const target = event.target.closest('[data-kernel-input]');
        if (!target) return;
        KernelUtils.invokeDelegatedAction(target, event, 'kernelInput');
      });
    },

    removeClosest(element, selector) {
      element?.closest?.(selector)?.remove();
    },

    reloadPage() {
      global.location.reload();
    },

    /**
     * Format relative time in Arabic
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     */
    formatRelativeTime(date) {
      const now = Date.now();
      const time = new Date(date).getTime();
      const diff = now - time;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return 'الآن';
      if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
      if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
      if (days < 7) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
      
      return new Date(date).toLocaleDateString('ar-SA');
    },

    /**
     * Format date in Arabic
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
      return new Date(date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },

    /**
     * Format time in Arabic
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted time
     */
    formatTime(date) {
      return new Date(date).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    /**
     * Format number with Arabic locale
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
      return new Intl.NumberFormat('ar-SA').format(num);
    },

    /**
     * Check whether the user requested reduced motion.
     * @returns {boolean} Reduced motion preference
     */
    prefersReducedMotion() {
      return Boolean(global.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    },

    /**
     * Format percentage
     * @param {number} num - Number to format as percentage
     * @returns {string} Formatted percentage
     */
    formatPercent(num) {
      return `${Math.round(num)}%`;
    },

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    truncate(str, maxLength = 50) {
      if (!str || str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    },

    /**
     * Truncate hash for display
     * @param {string} hash - Hash to truncate
     * @param {number} chars - Number of characters to show
     * @returns {string} Truncated hash
     */
    truncateHash(hash, chars = 16) {
      if (!hash || hash.length <= chars) return hash;
      return hash.substring(0, chars) + '...';
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          return true;
        } catch (e) {
          return false;
        } finally {
          document.body.removeChild(textArea);
        }
      }
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },

    /**
     * Generate unique ID
     * @param {string} prefix - Optional prefix
     * @returns {string} Unique ID
     */
    generateId(prefix = 'kernel') {
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Get risk level label in Arabic
     * @param {string} level - Risk level
     * @returns {string} Arabic label
     */
    getRiskLabel(level) {
      const labels = {
        critical: 'حرج',
        high: 'مرتفع',
        medium: 'متوسط',
        low: 'منخفض',
        minimal: 'ضئيل',
      };
      return labels[level?.toLowerCase()] || level;
    },

    /**
     * Get risk level class
     * @param {string} level - Risk level
     * @returns {string} CSS class
     */
    getRiskClass(level) {
      const classes = {
        critical: 'badge-danger',
        high: 'badge-warning',
        medium: 'badge-warning',
        low: 'badge-success',
        minimal: 'badge-success',
      };
      return classes[level?.toLowerCase()] || 'badge-info';
    },

    /**
     * Get decision label in Arabic
     * @param {string} decision - Decision type
     * @returns {string} Arabic label
     */
    getDecisionLabel(decision) {
      const labels = {
        allowed: 'مسموح',
        masked: 'مُخفى',
        blocked: 'محظور',
        pending_approval: 'بانتظار الموافقة',
        approved: 'موافق عليه',
        rejected: 'مرفوض',
        executed_after_approval: 'تم التنفيذ بعد الموافقة',
        completed: 'مكتمل',
        expired: 'منتهي',
        escalated: 'تم التصعيد',
      };
      return labels[decision?.toLowerCase()] || decision;
    },

    /**
     * Get decision class
     * @param {string} decision - Decision type
     * @returns {string} CSS class
     */
    getDecisionClass(decision) {
      const classes = {
        allowed: 'badge-success',
        masked: 'badge-warning',
        blocked: 'badge-danger',
        pending_approval: 'badge-warning',
        approved: 'badge-success',
        rejected: 'badge-danger',
        executed_after_approval: 'badge-success',
        completed: 'badge-success',
        expired: 'badge-danger',
        escalated: 'badge-warning',
      };
      return classes[decision?.toLowerCase()] || 'badge-info';
    },

    /**
     * Get status label in Arabic
     * @param {string} status - Status
     * @returns {string} Arabic label
     */
    getStatusLabel(status) {
      const labels = {
        pending: 'قيد الانتظار',
        approved: 'موافق عليه',
        rejected: 'مرفوض',
        executed: 'تم التنفيذ',
        completed: 'مكتمل',
        expired: 'منتهي',
        escalated: 'مُصعَّد',
        connected: 'متصل',
        demo: 'تجريبي',
        coming_soon: 'قريباً',
      };
      return labels[status?.toLowerCase()] || status;
    },

    /**
     * Animate number counting up
     * @param {HTMLElement} element - Element to animate
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Duration in ms
     * @param {string} suffix - Optional suffix (e.g., '%')
     */
    animateCount(element, start, end, duration = 1000, suffix = '') {
      if (!element) return;

      if (this.prefersReducedMotion()) {
        element.textContent = KernelUtils.formatNumber(end) + suffix;
        return;
      }
      
      const startTime = performance.now();
      const diff = end - start;

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + diff * easeOut);
        
        element.textContent = KernelUtils.formatNumber(current) + suffix;
        
        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    },

    /**
     * Show skeleton loading state
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of skeletons
     * @param {string} type - Skeleton type ('card', 'row', 'text')
     */
    showSkeleton(container, count = 3, type = 'card') {
      if (!container) return;

      const skeletons = {
        card: `
          <div class="glass-card-flat animate-pulse">
            <div class="skeleton skeleton-heading mb-4" style="width: 60%; height: 20px;"></div>
            <div class="skeleton skeleton-text mb-2" style="width: 100%; height: 16px;"></div>
            <div class="skeleton skeleton-text mb-2" style="width: 80%; height: 16px;"></div>
            <div class="skeleton skeleton-text" style="width: 40%; height: 16px;"></div>
          </div>
        `,
        row: `
          <div class="flex items-center gap-4 p-4">
            <div class="skeleton skeleton-circle" style="width: 40px; height: 40px;"></div>
            <div class="flex-1">
              <div class="skeleton skeleton-text mb-2" style="width: 60%; height: 14px;"></div>
              <div class="skeleton skeleton-text" style="width: 40%; height: 12px;"></div>
            </div>
          </div>
        `,
        text: `
          <div class="skeleton skeleton-text mb-2" style="width: 100%; height: 14px;"></div>
        `,
      };

      const skeleton = skeletons[type] || skeletons.card;
      container.innerHTML = Array(count).fill(skeleton).join('');
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Is in viewport
     */
    isInViewport(element) {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    },

    /**
     * Create intersection observer for lazy loading
     * @param {Function} callback - Callback when element enters viewport
     * @param {Object} options - Observer options
     * @returns {IntersectionObserver} Observer instance
     */
    createObserver(callback, options = {}) {
      const defaultOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      };

      return new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback(entry.target);
          }
        });
      }, { ...defaultOptions, ...options });
    },

    /**
     * Parse JSON safely
     * @param {string} str - JSON string
     * @param {*} fallback - Fallback value
     * @returns {*} Parsed value or fallback
     */
    parseJSON(str, fallback = null) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return fallback;
      }
    },

    /**
     * Storage helper with prefix
     */
    storage: {
      prefix: 'kernel_',

      get(key) {
        try {
          const item = sessionStorage.getItem(this.prefix + key);
          return item ? JSON.parse(item) : null;
        } catch (e) {
          return null;
        }
      },

      set(key, value) {
        try {
          sessionStorage.setItem(this.prefix + key, JSON.stringify(value));
          return true;
        } catch (e) {
          return false;
        }
      },

      remove(key) {
        try {
          sessionStorage.removeItem(this.prefix + key);
          return true;
        } catch (e) {
          return false;
        }
      },

      clear() {
        try {
          Object.keys(sessionStorage)
            .filter((key) => key.startsWith(this.prefix))
            .forEach((key) => sessionStorage.removeItem(key));
          return true;
        } catch (e) {
          return false;
        }
      },
    },

    /**
     * Generate user ID if not exists
     * @returns {string} User ID
     */
    getUserId() {
      let userId = this.storage.get('userId');
      if (!userId) {
        userId = this.generateId('user');
        this.storage.set('userId', userId);
      }
      return userId;
    },

    /**
     * Get or set user name
     * @param {string} name - Optional name to set
     * @returns {string} User name
     */
    getUserName(name) {
      if (name) {
        this.storage.set('userName', name);
        return name;
      }
      return this.storage.get('userName') || 'مستخدم';
    },
  };

  // Export to global scope
  global.KernelUtils = KernelUtils;
  KernelUtils.initDelegatedActions();

})(typeof window !== 'undefined' ? window : this);
