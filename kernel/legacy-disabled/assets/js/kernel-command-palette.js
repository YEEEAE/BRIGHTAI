/**
 * BrightAI Kernel - Command Palette
 * Global Ctrl/Cmd+K launcher for Kernel pages, actions, and settings.
 */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'brightai_kernel_command_palette_recent';
  const THEME_KEY = 'brightai_kernel_theme';
  const MAX_RECENTS = 8;

  const PAGE_ORDER = [
    'home',
    'chat',
    'approvals',
    'audit',
    'stats',
    'compliance',
    'policies',
    'connectors',
    'reports',
    'scenarios',
    'evidence',
  ];

  const PAGE_META = {
    home: {
      title: 'لوحة التحكم',
      english: 'Dashboard',
      description: 'نظرة عامة على حالة Kernel والحوكمة.',
      keywords: ['dashboard', 'home', 'kernel', 'الرئيسية', 'لوحة', 'لوحة التحكم'],
    },
    chat: {
      title: 'المحادثة',
      english: 'Chat',
      description: 'محادثة محكومة مع تحليل مخاطر وتتبع.',
      keywords: ['chat', 'conversation', 'محادثة', 'شات', 'رسائل'],
    },
    approvals: {
      title: 'الموافقات',
      english: 'Approvals',
      description: 'طلبات الموافقة المعلقة وقرارات المراجعة.',
      keywords: ['approvals', 'approval', 'pending', 'موافقات', 'اعتماد', 'مراجعة'],
    },
    audit: {
      title: 'التدقيق',
      english: 'Audit',
      description: 'سجل تدقيق قابل للتتبع لكل قرار.',
      keywords: ['audit', 'trail', 'logs', 'تدقيق', 'سجل', 'أثر'],
    },
    stats: {
      title: 'الإحصائيات',
      english: 'Stats',
      description: 'مؤشرات الأداء والمخاطر والامتثال.',
      keywords: ['stats', 'statistics', 'metrics', 'analytics', 'إحصائيات', 'مؤشرات'],
    },
    compliance: {
      title: 'الامتثال',
      english: 'Compliance',
      description: 'حزم الامتثال ونسب التغطية.',
      keywords: ['compliance', 'pdpl', 'nca', 'sfda', 'امتثال', 'حوكمة'],
    },
    policies: {
      title: 'السياسات',
      english: 'Policies',
      description: 'سياسات الحوكمة والتصعيد والحظر.',
      keywords: ['policies', 'policy', 'rules', 'سياسات', 'قواعد'],
    },
    connectors: {
      title: 'الموصلات',
      english: 'Connectors',
      description: 'مصادر البيانات والموصلات التجريبية.',
      keywords: ['connectors', 'provider', 'integration', 'موصلات', 'مزود', 'تكامل'],
    },
    reports: {
      title: 'التقارير',
      english: 'Reports',
      description: 'إنشاء وتحميل تقارير الحوكمة.',
      keywords: ['reports', 'report', 'export', 'تقارير', 'تقرير', 'تصدير'],
    },
    scenarios: {
      title: 'السيناريوهات',
      english: 'Scenarios',
      description: 'سيناريوهات اختبار الحوكمة والموصلات.',
      keywords: ['scenarios', 'scenario', 'demo', 'سيناريوهات', 'اختبار'],
    },
    evidence: {
      title: 'الأدلة',
      english: 'Evidence',
      description: 'ملفات الأدلة وسلاسل الهاش.',
      keywords: ['evidence', 'proof', 'trace', 'أدلة', 'دليل', 'هاش'],
    },
  };

  const DEFAULT_PAGES = PAGE_ORDER.map((id) => ({
    id,
    href: id === 'home' ? '/kernel/' : `/kernel/${id}/`,
    icon: id === 'home' ? 'home' : id,
    label: PAGE_META[id].title,
  }));

  const ACTIONS = [
    {
      id: 'switch-provider',
      title: 'تبديل المزود',
      english: 'Switch Provider',
      section: 'الإعدادات',
      icon: 'switchHorizontal',
      description: 'فتح صفحة الموصلات لإدارة مزودات Kernel المتاحة.',
      keywords: ['switch provider', 'provider', 'model', 'nvidia', 'gemini', 'openai', 'مزود', 'موديل', 'تبديل'],
    },
    {
      id: 'toggle-theme',
      title: 'تبديل المظهر',
      english: 'Toggle Theme',
      section: 'الإعدادات',
      icon: 'moon',
      description: 'التبديل بين المظهر الداكن والفاتح.',
      keywords: ['toggle theme', 'theme', 'dark', 'light', 'ثيم', 'مظهر', 'داكن', 'فاتح'],
    },
    {
      id: 'clear-session',
      title: 'مسح الجلسة',
      english: 'Clear Session',
      section: 'الأوامر',
      icon: 'trash',
      description: 'مسح بيانات جلسة Kernel والمحادثة الحالية من التخزين المحلي.',
      keywords: ['clear session', 'clear chat', 'reset', 'مسح المحادثة', 'مسح الجلسة', 'حذف'],
    },
    {
      id: 'export-report',
      title: 'تصدير تقرير',
      english: 'Export Report',
      section: 'الأوامر',
      icon: 'reports',
      description: 'تحميل تقرير جاهز أو فتح صفحة التقارير.',
      keywords: ['export report', 'download report', 'report', 'تصدير تقرير', 'تحميل تقرير'],
    },
    {
      id: 'export-data',
      title: 'تصدير البيانات',
      english: 'Export Data',
      section: 'الأوامر',
      icon: 'download',
      description: 'تنزيل Snapshot آمن من بيانات Kernel المخزنة محلياً.',
      keywords: ['export data', 'download data', 'backup', 'تصدير البيانات', 'تحميل البيانات'],
    },
  ];

  const KernelCommandPalette = {
    config: {
      pages: DEFAULT_PAGES,
      createIcon: null,
    },

    state: {
      initialized: false,
      isOpen: false,
      activeIndex: 0,
      query: '',
      items: [],
      visibleItems: [],
      lastTrigger: null,
    },

    init(options = {}) {
      this.configure(options);

      if (this.state.initialized) {
        this.refreshItems();
        this.renderResults();
        return;
      }

      this.createShell();
      this.bindEvents();
      this.refreshItems();
      this.renderResults();
      this.state.initialized = true;
    },

    configure(options = {}) {
      if (Array.isArray(options.pages) && options.pages.length) {
        this.config.pages = options.pages;
      } else if (global.KernelNav?.config?.pages?.length) {
        this.config.pages = global.KernelNav.config.pages;
      }

      if (typeof options.createIcon === 'function') {
        this.config.createIcon = options.createIcon;
      } else if (!this.config.createIcon && typeof global.KernelNav?.createIcon === 'function') {
        this.config.createIcon = (name, className = '') => global.KernelNav.createIcon(name, className);
      }
    },

    createShell() {
      if (document.getElementById('kernel-command-palette')) {
        this.cacheElements();
        return;
      }

      const root = document.createElement('div');
      root.id = 'kernel-command-palette';
      root.className = 'kernel-command-palette';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-labelledby', 'kernel-command-title');
      root.setAttribute('aria-hidden', 'true');
      root.setAttribute('dir', 'rtl');
      root.hidden = true;

      root.innerHTML = this.sanitizeHtml(`
        <div class="kernel-command-palette-panel" role="document">
          <div class="kernel-command-header">
            <div>
              <h2 id="kernel-command-title">لوحة الأوامر</h2>
              <p>ابحث في صفحات Kernel والأوامر والإعدادات.</p>
            </div>
            <button class="kernel-command-close" type="button" data-command-close aria-label="إغلاق لوحة الأوامر">
              ${this.renderIcon('close')}
            </button>
          </div>
          <form class="kernel-command-search" role="search" data-command-form>
            <span class="kernel-command-search-icon" aria-hidden="true">${this.renderIcon('search')}</span>
            <input
              class="kernel-command-search-input"
              id="kernel-command-search"
              type="search"
              autocomplete="off"
              spellcheck="false"
              dir="auto"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="kernel-command-results"
              aria-expanded="true"
              placeholder="اكتب اسم صفحة أو أمر..."
            >
          </form>
          <div class="kernel-command-results" id="kernel-command-results" role="listbox" aria-label="نتائج لوحة الأوامر"></div>
        </div>
      `);

      document.body.appendChild(root);
      this.cacheElements();
    },

    cacheElements() {
      this.root = document.getElementById('kernel-command-palette');
      this.panel = this.root?.querySelector('.kernel-command-palette-panel');
      this.searchInput = document.getElementById('kernel-command-search');
      this.results = document.getElementById('kernel-command-results');
    },

    bindEvents() {
      this.boundKeydown = (event) => this.handleKeydown(event);
      this.boundInput = (event) => this.handleSearch(event);
      this.boundClick = (event) => this.handleClick(event);
      this.boundSubmit = (event) => this.handleSubmit(event);

      document.addEventListener('keydown', this.boundKeydown);
      document.addEventListener('click', this.boundClick);
      this.searchInput?.addEventListener('input', this.boundInput);
      this.root?.querySelector('[data-command-form]')?.addEventListener('submit', this.boundSubmit);
    },

    refreshItems() {
      this.state.items = [
        ...this.buildPageItems(),
        ...this.buildActionItems(),
      ];
    },

    buildPageItems() {
      const configuredPages = Array.isArray(this.config.pages) && this.config.pages.length
        ? this.config.pages
        : DEFAULT_PAGES;
      const byId = configuredPages.reduce((map, page) => {
        map[page.id] = page;
        return map;
      }, {});

      return PAGE_ORDER.map((id) => {
        const page = byId[id] || DEFAULT_PAGES.find((item) => item.id === id);
        const meta = PAGE_META[id];
        if (!page || !meta) return null;
        return {
          id: `page:${id}`,
          kind: 'page',
          section: 'الصفحات',
          title: meta.title,
          english: meta.english,
          description: meta.description,
          href: page.href || (id === 'home' ? '/kernel/' : `/kernel/${id}/`),
          icon: page.icon || (id === 'home' ? 'home' : id),
          keywords: [page.label, meta.english, ...meta.keywords],
        };
      }).filter(Boolean);
    },

    buildActionItems() {
      return ACTIONS.map((action) => ({
        ...action,
        kind: 'action',
        id: `action:${action.id}`,
        actionId: action.id,
      }));
    },

    open(trigger = null) {
      if (!this.state.initialized) this.init();
      this.state.lastTrigger = trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      this.state.isOpen = true;
      this.state.query = '';
      this.state.activeIndex = 0;

      if (this.searchInput) this.searchInput.value = '';
      this.refreshItems();
      this.renderResults();

      this.root.hidden = false;
      this.root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('command-palette-open');
      requestAnimationFrame(() => {
        this.root.classList.add('is-open');
        this.searchInput?.focus({ preventScroll: true });
      });
    },

    close({ restoreFocus = true } = {}) {
      if (!this.state.isOpen || !this.root) return;
      this.state.isOpen = false;
      this.root.classList.remove('is-open');
      this.root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('command-palette-open');

      const hide = () => {
        if (!this.state.isOpen && this.root) this.root.hidden = true;
      };

      if (global.KernelUtils?.prefersReducedMotion?.()) {
        hide();
      } else {
        setTimeout(hide, 180);
      }

      if (restoreFocus) this.restoreFocus();
    },

    toggle(trigger = null) {
      if (this.state.isOpen) {
        this.close();
      } else {
        this.open(trigger);
      }
    },

    handleKeydown(event) {
      const key = String(event.key || '').toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        this.toggle(document.activeElement instanceof HTMLElement ? document.activeElement : null);
        return;
      }

      if (!this.state.isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.moveActive(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.moveActive(-1);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        this.selectActive();
        return;
      }

      if (event.key === 'Tab') {
        this.trapFocus(event);
      }
    },

    handleSearch(event) {
      this.state.query = event.target.value || '';
      this.state.activeIndex = 0;
      this.renderResults();
    },

    handleClick(event) {
      const trigger = event.target.closest?.('[data-command-palette-trigger]');
      if (trigger) {
        event.preventDefault();
        this.open(trigger);
        return;
      }

      if (!this.state.isOpen) return;

      if (event.target.closest?.('[data-command-close]')) {
        event.preventDefault();
        this.close();
        return;
      }

      if (event.target === this.root) {
        this.close();
        return;
      }

      const itemButton = event.target.closest?.('[data-command-index]');
      if (itemButton) {
        event.preventDefault();
        const index = Number(itemButton.getAttribute('data-command-index'));
        this.selectItem(this.state.visibleItems[index]);
      }
    },

    handleSubmit(event) {
      event.preventDefault();
      this.selectActive();
    },

    moveActive(delta) {
      const count = this.state.visibleItems.length;
      if (!count) return;
      this.state.activeIndex = (this.state.activeIndex + delta + count) % count;
      this.updateActiveDescendant();
      this.scrollActiveIntoView();
    },

    selectActive() {
      this.selectItem(this.state.visibleItems[this.state.activeIndex]);
    },

    async selectItem(item) {
      if (!item) return;
      this.addRecent(item);

      if (item.kind === 'page' && item.href) {
        this.close({ restoreFocus: false });
        global.location.assign(item.href);
        return;
      }

      if (item.kind === 'action') {
        const shouldClose = await this.runAction(item.actionId);
        if (shouldClose !== false) this.close({ restoreFocus: false });
      }
    },

    async runAction(actionId) {
      switch (actionId) {
        case 'switch-provider':
          global.location.assign('/kernel/connectors/');
          return true;
        case 'toggle-theme':
          this.toggleTheme();
          this.notify('تم تبديل المظهر', 'success');
          return true;
        case 'clear-session':
          return this.clearSession();
        case 'export-report':
          return this.exportReport();
        case 'export-data':
          this.exportData();
          this.notify('تم تجهيز ملف البيانات', 'success');
          return true;
        default:
          return true;
      }
    },

    toggleTheme() {
      if (global.KernelUtils && typeof global.KernelUtils.toggleTheme === 'function') {
        return global.KernelUtils.toggleTheme();
      }

      const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (error) {
        // Theme still applies for the current page.
      }
      return nextTheme;
    },

    clearSession() {
      if (!global.confirm('هل تريد مسح جلسة Kernel الحالية؟')) return false;

      this.removeStorageKeys(sessionStorage, [/^kernel_/]);
      this.removeStorageKeys(localStorage, [
        /^brightai-chat-/,
        /^chatMessages($|_)/,
        /^kernel_chat_sessions$/,
        /^kernel_active_session$/,
      ]);

      const messages = document.getElementById('messages');
      if (messages) {
        messages.innerHTML = '';
        if (typeof global.createEmptyState === 'function') {
          messages.appendChild(global.createEmptyState());
        }
      }

      if (typeof global.resetPanel === 'function') global.resetPanel();
      if (global.kernelChatEnhanced?.clearPendingFiles) global.kernelChatEnhanced.clearPendingFiles();
      global.dispatchEvent(new CustomEvent('kernel-session-cleared'));
      this.notify('تم مسح الجلسة', 'success');
      return true;
    },

    async exportReport() {
      const reportId = document.querySelector('.report-card[data-id]')?.getAttribute('data-id')
        || global.KernelReports?.state?.reports?.[0]?.id;

      if (reportId && typeof global.KernelReports?.downloadReport === 'function') {
        await global.KernelReports.downloadReport(reportId);
        return true;
      }

      global.location.assign('/kernel/reports/');
      return true;
    },

    exportData() {
      const payload = {
        exportedAt: new Date().toISOString(),
        path: global.location.pathname,
        theme: document.documentElement.getAttribute('data-theme') || 'dark',
        localStorage: this.snapshotStorage(localStorage, [
          /^brightai_kernel_/,
          /^brightai-chat-/,
          /^chatMessages($|_)/,
          /^kernel_chat_sessions$/,
          /^kernel_active_session$/,
        ]),
        sessionStorage: this.snapshotStorage(sessionStorage, [/^kernel_/]),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      anchor.href = url;
      anchor.download = `brightai-kernel-export-${stamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    },

    removeStorageKeys(storage, patterns) {
      try {
        Object.keys(storage)
          .filter((key) => patterns.some((pattern) => pattern.test(key)))
          .forEach((key) => storage.removeItem(key));
      } catch (error) {
        // Storage access can fail in strict browser modes.
      }
    },

    snapshotStorage(storage, patterns) {
      const snapshot = {};
      try {
        Object.keys(storage)
          .filter((key) => patterns.some((pattern) => pattern.test(key)))
          .forEach((key) => {
            snapshot[key] = storage.getItem(key);
          });
      } catch (error) {
        snapshot.error = 'storage_unavailable';
      }
      return snapshot;
    },

    renderResults() {
      if (!this.results) return;

      const query = this.normalizeText(this.state.query);
      const sections = [];
      const visibleItems = [];

      if (!query) {
        const recents = this.getRecentItems();
        if (recents.length) sections.push({ title: 'الأحدث', items: recents });
      }

      const candidates = query ? this.rankItems(query) : this.state.items;
      this.groupBySection(candidates).forEach((section) => sections.push(section));

      if (!sections.length) {
        this.state.visibleItems = [];
        this.results.innerHTML = this.sanitizeHtml(`
          <div class="kernel-command-empty" role="status">
            <strong>ما فيه نتائج مطابقة</strong>
            <span>جرّب اسم صفحة، أمر، أو إعداد ثاني.</span>
          </div>
        `);
        this.searchInput?.removeAttribute('aria-activedescendant');
        return;
      }

      let index = 0;
      this.results.innerHTML = this.sanitizeHtml(sections.map((section) => {
        const itemsHtml = section.items.map((item) => {
          visibleItems.push(item);
          const itemIndex = index;
          const active = itemIndex === this.state.activeIndex;
          index += 1;
          return this.renderItem(item, itemIndex, active);
        }).join('');

        return `
          <section class="kernel-command-section" aria-label="${this.escapeHtml(section.title)}">
            <div class="kernel-command-section-title">${this.escapeHtml(section.title)}</div>
            <div class="kernel-command-section-items">${itemsHtml}</div>
          </section>
        `;
      }).join(''));

      this.state.visibleItems = visibleItems;
      if (this.state.activeIndex >= visibleItems.length) this.state.activeIndex = 0;
      this.updateActiveDescendant();
    },

    renderItem(item, index, active) {
      const typeLabel = item.kind === 'page' ? 'صفحة' : item.section;
      return `
        <button
          class="kernel-command-item ${active ? 'is-active' : ''}"
          id="kernel-command-option-${index}"
          type="button"
          role="option"
          data-command-index="${index}"
          aria-selected="${active ? 'true' : 'false'}"
        >
          <span class="kernel-command-item-icon" aria-hidden="true">${this.renderIcon(item.icon)}</span>
          <span class="kernel-command-item-copy">
            <span class="kernel-command-item-title">${this.escapeHtml(item.title)}</span>
            <span class="kernel-command-item-desc">
              ${this.escapeHtml(item.description)}
              <span class="kernel-command-item-english" lang="en" dir="ltr">${this.escapeHtml(item.english || '')}</span>
            </span>
          </span>
          <span class="kernel-command-item-type">${this.escapeHtml(typeLabel)}</span>
        </button>
      `;
    },

    rankItems(query) {
      return this.state.items
        .map((item) => ({ item, score: this.scoreItem(item, query) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'ar'))
        .map((entry) => entry.item);
    },

    scoreItem(item, query) {
      const title = this.normalizeText(item.title);
      const english = this.normalizeText(item.english);
      const haystack = this.normalizeText([
        item.title,
        item.english,
        item.description,
        item.section,
        ...(item.keywords || []),
      ].join(' '));

      if (title === query || english === query) return 100;
      if (title.startsWith(query) || english.startsWith(query)) return 80;
      if (title.includes(query) || english.includes(query)) return 65;
      if (haystack.includes(query)) return 45;

      const tokens = query.split(/\s+/).filter(Boolean);
      return tokens.length && tokens.every((token) => haystack.includes(token)) ? 25 : 0;
    },

    groupBySection(items) {
      return items.reduce((sections, item) => {
        const title = item.section || 'الأوامر';
        let section = sections.find((entry) => entry.title === title);
        if (!section) {
          section = { title, items: [] };
          sections.push(section);
        }
        section.items.push(item);
        return sections;
      }, []);
    },

    addRecent(item) {
      const stored = this.readRecents().filter((entry) => entry.id !== item.id);
      stored.unshift({
        id: item.id,
        savedAt: Date.now(),
      });
      this.writeRecents(stored.slice(0, MAX_RECENTS));
    },

    getRecentItems() {
      const byId = this.state.items.reduce((map, item) => {
        map[item.id] = item;
        return map;
      }, {});
      return this.readRecents()
        .map((entry) => byId[entry.id])
        .filter(Boolean);
    },

    readRecents() {
      try {
        const value = localStorage.getItem(STORAGE_KEY);
        const parsed = value ? JSON.parse(value) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    },

    writeRecents(items) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        // Recents are a progressive enhancement.
      }
    },

    updateActiveDescendant() {
      if (!this.searchInput) return;
      this.results?.querySelectorAll('.kernel-command-item').forEach((button, index) => {
        const active = index === this.state.activeIndex;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      if (this.state.visibleItems.length) {
        this.searchInput.setAttribute('aria-activedescendant', `kernel-command-option-${this.state.activeIndex}`);
      } else {
        this.searchInput.removeAttribute('aria-activedescendant');
      }
    },

    scrollActiveIntoView() {
      const active = document.getElementById(`kernel-command-option-${this.state.activeIndex}`);
      active?.scrollIntoView({ block: 'nearest' });
    },

    trapFocus(event) {
      if (!this.root) return;
      const focusable = Array.from(this.root.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.offsetParent !== null || element === document.activeElement);

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

    restoreFocus() {
      const trigger = this.state.lastTrigger;
      if (trigger && document.contains(trigger) && typeof trigger.focus === 'function') {
        trigger.focus({ preventScroll: true });
      }
    },

    notify(message, type = 'info') {
      if (global.KernelUtils && typeof global.KernelUtils.showToast === 'function') {
        global.KernelUtils.showToast(message, type);
        return;
      }

      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
      }, 3200);
    },

    renderIcon(name) {
      if (typeof this.config.createIcon === 'function') {
        return this.config.createIcon(name, '');
      }

      const icons = {
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>',
      };
      return icons[name] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/></svg>';
    },

    normalizeText(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .trim();
    },

    escapeHtml(value) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return String(value || '').replace(/[&<>"']/g, (char) => map[char]);
    },

    sanitizeHtml(value) {
      if (global.KernelUtils?.sanitizeHtml) return global.KernelUtils.sanitizeHtml(value);
      return String(value || '');
    },
  };

  global.KernelCommandPalette = KernelCommandPalette;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KernelCommandPalette.init(), { once: true });
  } else {
    KernelCommandPalette.init();
  }
})(typeof window !== 'undefined' ? window : this);
