/**
 * BrightAI Kernel — Action-oriented Empty States
 *
 * Provides a central `KernelEmptyStates` module that renders
 * LangSmith / Datadog-inspired empty states: icon + title + description
 * + primary CTA + optional secondary link.
 *
 * Each Kernel page registers its own empty-state config via
 * `KernelEmptyStates.register(pageKey, config)` or the module
 * auto-detects the current page from the URL path.
 *
 * Usage (inside any kernel page):
 *   KernelEmptyStates.showIfEmpty('container-id', {
 *     title: 'لا توجد بيانات',
 *     description: 'ابدأ هنا لإنشاء أول سجل.',
 *     action: { label: 'ابدأ', href: '/kernel/chat/' },
 *     secondary: { label: 'عرض المستندات', href: '/docs/' }
 *   });
 */

(function (global) {
  'use strict';

  var ROOT_CLASS = 'kernel-empty-state';

  /* ── Page-specific defaults ──────────────────────────────────── */

  var PAGE_CONFIGS = {
    index: {
      icon: 'dashboard',
      title: 'لا توجد سجلات حوكمة بعد',
      description: 'ابدأ أول محادثة خاضعة للحوكمة لإنشاء سجل تدقيق وعرض الإحصائيات هنا تلقائياً.',
      action: { label: 'تشغيل محادثة آمنة', href: '/kernel/chat/' },
      secondary: { label: 'الاطلاع على السيناريوهات', href: '/kernel/scenarios/' }
    },
    chat: {
      icon: 'chat',
      title: 'ابدأ محادثة آمنة',
      description: 'طلبك سيُحلَّل بحثاً عن البيانات الحساسة، ويُقيَّم للمخاطر، ويُعالَج عبر خط حوكمة البيانات.',
      action: null
    },
    approvals: {
      icon: 'approvals',
      title: 'لا توجد طلبات موافقة معلّقة',
      description: 'جميع الطلبات تمّت معالجتها، أو لم تُنشأ أي طلبات بعد. ابدأ محادثة لتوليد طلبات موافقة تلقائياً عند رصد مخاطر عالية.',
      action: { label: 'بدء المحادثة', href: '/kernel/chat/' },
      secondary: { label: 'عرض سجل التدقيق', href: '/kernel/audit/' }
    },
    audit: {
      icon: 'audit',
      title: 'سجل التدقيق فارغ',
      description: 'لا توجد سجلات تدقيق بعد. كل طلب محادثة يُنشئ تلقائياً سجل تدقيق مشفّر بسلسلة تجزئة متصلة.',
      action: { label: 'بدء المحادثة', href: '/kernel/chat/' },
      secondary: { label: 'الاطلاع على السياسات', href: '/kernel/policies/' }
    },
    compliance: {
      icon: 'compliance',
      title: 'لا توجد أطر امتثال مفعّلة',
      description: 'فعّل حزمة امتثال من محرر السياسات لبدء قياس مستوى الالتزام والتوافق.',
      action: { label: 'إعداد السياسات', href: '/kernel/policies/' },
      secondary: { label: 'عرض الأدلة', href: '/kernel/evidence/' }
    },
    connectors: {
      icon: 'connectors',
      title: 'لا توجد اتصالات مُعدّة',
      description: 'أوصل مزوّد الذكاء الاصطناعي الأول لبدء مراقبة الاستخدام والمخاطر وتسجيل سجلات التدقيق.',
      action: { label: 'إضافة اتصال', href: null, onclick: 'kernelToggleConnectorModal' },
      secondary: { label: 'عرض السيناريوهات', href: '/kernel/scenarios/' }
    },
    evidence: {
      icon: 'evidence',
      title: 'لا توجد ملفات أدلة',
      description: 'ملفات الأدلة تُنشأ تلقائياً من كل محادثة خاضعة للحوكمة. ابدأ محادثة لإنشاء أول ملف دليل.',
      action: { label: 'بدء المحادثة', href: '/kernel/chat/' },
      secondary: { label: 'عرض سجل التدقيق', href: '/kernel/audit/' }
    },
    policies: {
      icon: 'policies',
      title: 'لا توجد سياسات مسجّلة',
      description: 'أضف أول سياسة لحماية البيانات وتحديد الضوابط. السياسات تُطبَّق تلقائياً على كل طلب.',
      action: { label: 'إنشاء سياسة', href: null, onclick: 'kernelShowPolicyForm' },
      secondary: { label: 'عرض حزم الامتثال', href: '/kernel/compliance/' }
    },
    reports: {
      icon: 'reports',
      title: 'لا توجد تقارير',
      description: 'أنشئ تقريرك الأول لمراجعة حالة الحوكمة والامتثال والمخاطر خلال فترة محددة.',
      action: { label: 'إنشاء تقرير', href: null, onclick: 'kernelShowReportModal' },
      secondary: { label: 'عرض الإحصائيات', href: '/kernel/stats/' }
    },
    stats: {
      icon: 'stats',
      title: 'لا توجد إحصائيات بعد',
      description: 'الإحصائيات تظهر بعد أول عملية حوكمة. ابدأ محادثة لتوليد بيانات وتفعيل لوحة القياس.',
      action: { label: 'بدء المحادثة', href: '/kernel/chat/' },
      secondary: { label: 'عرض سجل التدقيق', href: '/kernel/audit/' }
    },
    scenarios: {
      icon: 'scenarios',
      title: 'لا توجد سيناريوهات اختبار',
      description: 'جرّب سيناريو اختبار لمعاينة كيف يكشف النظام البيانات الحساسة ويصنّف المخاطر ويطبّق السياسات.',
      action: { label: 'تشغيل سيناريو', href: null, onclick: 'kernelRunFirstScenario' },
      secondary: { label: 'عرض السياسات', href: '/kernel/policies/' }
    }
  };

  /* ── SVG Icons ───────────────────────────────────────────────── */

  var ICONS = {
    dashboard: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="36" height="36" rx="6"/><path d="M16 24h-4v12h4V24zM26 16h-4v20h4V16zM36 20h-4v16h4V20z"/></svg>',
    chat: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14h32a4 4 0 014 4v16a4 4 0 01-4 4H18l-10 8v-8H8a4 4 0 01-4-4V18a4 4 0 014-4z"/><path d="M14 24h20M14 30h12"/></svg>',
    approvals: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="18"/><path d="M16 24l5 5 11-12"/></svg>',
    audit: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6h24v36H12z"/><path d="M18 16h12M18 22h12M18 28h8"/><circle cx="34" cy="36" r="8"/><path d="M31 36l2 2 4-5"/></svg>',
    compliance: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10h24v28H12z"/><path d="M18 18h12M18 24h12M18 30h8"/><path d="M28 6v4M20 6h8"/><circle cx="36" cy="38" r="6"/><path d="M33 38l2 2 4-4"/></svg>',
    connectors: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8v12M24 28v12"/><circle cx="24" cy="20" r="4"/><circle cx="24" cy="28" r="4"/><path d="M12 16h6M30 16h6M12 32h6M30 32h6"/><circle cx="10" cy="16" r="3"/><circle cx="38" cy="16" r="3"/><circle cx="10" cy="32" r="3"/><circle cx="38" cy="32" r="3"/></svg>',
    evidence: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6h28a2 2 0 012 2v32a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z"/><path d="M16 14h16M16 20h16M16 26h10"/><path d="M30 32l4 4 8-10"/></svg>',
    policies: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h24l8 8v28a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"/><path d="M32 6v8h8"/><path d="M16 22l3 3 6-6"/><path d="M16 32l3 3 6-6"/></svg>',
    reports: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h24l8 8v28a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"/><path d="M32 6v8h8"/><path d="M14 24h20M14 30h14M14 36h8"/></svg>',
    stats: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="18"/><path d="M24 14v10l7 7"/></svg>',
    scenarios: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 8h28a2 2 0 012 2v28a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z"/><path d="M20 18l8 6-8 6z"/></svg>'
  };

  /* ── Helpers ─────────────────────────────────────────────────── */

  function detectPageKey() {
    var path = global.location.pathname.toLowerCase();
    if (path.indexOf('/kernel/chat') !== -1) return 'chat';
    if (path.indexOf('/kernel/approvals') !== -1) return 'approvals';
    if (path.indexOf('/kernel/audit') !== -1) return 'audit';
    if (path.indexOf('/kernel/compliance') !== -1) return 'compliance';
    if (path.indexOf('/kernel/connectors') !== -1) return 'connectors';
    if (path.indexOf('/kernel/evidence') !== -1) return 'evidence';
    if (path.indexOf('/kernel/policies') !== -1) return 'policies';
    if (path.indexOf('/kernel/reports') !== -1) return 'reports';
    if (path.indexOf('/kernel/stats') !== -1) return 'stats';
    if (path.indexOf('/kernel/scenarios') !== -1) return 'scenarios';
    return 'index';
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Core Module ─────────────────────────────────────────────── */

  var KernelEmptyStates = {
    _configs: {},

    /**
     * Override or register a page-specific config.
     * @param {string} pageKey
     * @param {object} config - { icon?, title, description, action?, secondary? }
     */
    register: function (pageKey, config) {
      this._configs[pageKey] = config;
    },

    /**
     * Return the merged config for a page key.
     */
    getConfig: function (pageKey) {
      return this._configs[pageKey] || PAGE_CONFIGS[pageKey] || PAGE_CONFIGS.index;
    },

    /**
     * Render an action-oriented empty state into a container.
     *
     * @param {string|HTMLElement} target - container element or ID
     * @param {object} [configOverride] - optional override; if omitted auto-detects page
     */
    render: function (target, configOverride) {
      var container = (typeof target === 'string')
        ? document.getElementById(target)
        : target;
      if (!container) return;

      var config = configOverride || this.getConfig(detectPageKey());
      var iconName = config.icon || detectPageKey();
      var iconSvg = ICONS[iconName] || ICONS.dashboard;

      var actionHtml = '';
      if (config.action) {
        if (config.action.href) {
          actionHtml = '<a href="' + escapeAttr(config.action.href) + '" class="kernel-empty-state__action">' + escapeAttr(config.action.label) + '</a>';
        } else if (config.action.onclick) {
          actionHtml = '<button type="button" class="kernel-empty-state__action" onclick="' + escapeAttr(config.action.onclick) + '()">' + escapeAttr(config.action.label) + '</button>';
        } else if (config.action.label) {
          actionHtml = '<button type="button" class="kernel-empty-state__action">' + escapeAttr(config.action.label) + '</button>';
        }
      }

      var secondaryHtml = '';
      if (config.secondary) {
        secondaryHtml = '<a href="' + escapeAttr(config.secondary.href) + '" class="kernel-empty-state__secondary">' + escapeAttr(config.secondary.label) + '</a>';
      }

      var html = '<div class="' + ROOT_CLASS + '">' +
        '<div class="' + ROOT_CLASS + '__icon">' + iconSvg + '</div>' +
        '<h3 class="' + ROOT_CLASS + '__title">' + escapeAttr(config.title) + '</h3>' +
        '<p class="' + ROOT_CLASS + '__description">' + escapeAttr(config.description) + '</p>' +
        (actionHtml ? '<div class="' + ROOT_CLASS + '__actions">' + actionHtml + '</div>' : '') +
        (secondaryHtml ? '<div class="' + ROOT_CLASS + '__footer">' + secondaryHtml + '</div>' : '') +
        '</div>';

      container.innerHTML = (global.KernelUtils && typeof KernelUtils.sanitizeHtml === 'function')
        ? KernelUtils.sanitizeHtml(html)
        : html;

      container.setAttribute('data-empty-state', 'true');
      return container;
    },

    /**
     * Convenience: show empty state only if a data array is empty.
     *
     * @param {string|HTMLElement} target
     * @param {Array} data
     * @param {object} [configOverride]
     * @returns {boolean} true if empty state was shown
     */
    showIfEmpty: function (target, data, configOverride) {
      if (!data || (Array.isArray(data) && data.length === 0)) {
        this.render(target, configOverride);
        return true;
      }
      return false;
    },

    /**
     * Remove the empty state from a container (e.g. data arrived).
     *
     * @param {string|HTMLElement} target
     */
    clear: function (target) {
      var container = (typeof target === 'string')
        ? document.getElementById(target)
        : target;
      if (!container) return;
      if (container.getAttribute('data-empty-state') === 'true') {
        container.innerHTML = '';
        container.removeAttribute('data-empty-state');
      }
    },

    /**
     * Detect current page and return its default config.
     */
    autoConfig: function () {
      return this.getConfig(detectPageKey());
    }
  };

  global.KernelEmptyStates = KernelEmptyStates;

})(typeof window !== 'undefined' ? window : this);
