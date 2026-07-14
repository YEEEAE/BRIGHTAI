/**
 * BrightAI Kernel - Navigation Module
 * Handles top nav, bottom nav, mobile drawer, and routing
 */

(function (global) {
  'use strict';

  const KernelNav = {
    // Configuration
    config: {
      pages: [
        { id: 'home', href: '/kernel/', label: 'الرئيسية', icon: 'home', showInBottomNav: true },
        { id: 'chat', href: '/kernel/chat/', label: 'المحادثة', icon: 'chat', showInBottomNav: true },
        { id: 'stats', href: '/kernel/stats/', label: 'الإحصائيات', icon: 'stats', showInBottomNav: true },
        { id: 'approvals', href: '/kernel/approvals/', label: 'الموافقات', icon: 'approvals', showInBottomNav: true, showPending: true },
        { id: 'audit', href: '/kernel/audit/', label: 'التدقيق', icon: 'audit', showInBottomNav: true },
        { id: 'evidence', href: '/kernel/evidence/', label: 'الأدلة', icon: 'evidence', isNew: true },
        { id: 'reports', href: '/kernel/reports/', label: 'التقارير', icon: 'reports', isNew: true },
        { id: 'scenarios', href: '/kernel/scenarios/', label: 'السيناريوهات', icon: 'scenarios' },
        { id: 'compliance', href: '/kernel/compliance/', label: 'الامتثال', icon: 'compliance' },
        { id: 'policies', href: '/kernel/policies/', label: 'السياسات', icon: 'policies' },
        { id: 'connectors', href: '/kernel/connectors/', label: 'الموصلات', icon: 'connectors' },
      ],
      moreMenuThreshold: 5, // Show 'More' menu after this many items
      pendingCheckInterval: 30000, // Check pending approvals every 30s
      statusCheckInterval: 45000, // Refresh provider and DB status every 45s
      commandPaletteSrc: '/kernel/assets/js/kernel-command-palette.js',
      onboardingSrc: '/kernel/assets/js/kernel-onboarding.js',
      notificationsSrc: '/kernel/assets/js/kernel-notifications.js',
    },

    // State
    state: {
      pendingCount: 0,
      isDrawerOpen: false,
      isMoreMenuOpen: false,
      currentPage: null,
      initialized: false,
      pendingIntervalId: null,
      statusIntervalId: null,
      connectivityOffline: false,
      connectivityToastDismissed: false,
      lastDrawerTrigger: null,
      lastMoreTrigger: null,
    },

    // Icons SVG paths
    icons: {
      home: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
      chat: '<path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>',
      stats: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
      approvals: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      audit: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
      evidence: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
      reports: '<path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>',
      scenarios: '<path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>',
      compliance: '<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
      policies: '<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>',
      connectors: '<path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>',
      menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
      close: '<path d="M6 18L18 6M6 6l12 12"/>',
      chevronDown: '<path d="M19 9l-7 7-7-7"/>',
      shield: '<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
      search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
      command: '<path d="M18 9a3 3 0 10-3-3v12a3 3 0 103-3H6a3 3 0 103 3V6a3 3 0 10-3 3h12z"/>',
      settings: '<path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 .6 1.65 1.65 0 00-.4 1.05V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-.6-1 1.65 1.65 0 00-1.05-.4H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-.6 1.65 1.65 0 00.4-1.05V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.34.51.6.88.72.16.05.33.08.5.08H21a2 2 0 010 4h-.09A1.65 1.65 0 0019.4 15z"/>',
      bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
      trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
      download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
      switchHorizontal: '<path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
      moon: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>',
    },

    /**
     * Initialize navigation
     */
    init(activePageId) {
      this.installThemeHelpers();

      if (this.isKnownPage(activePageId)) {
        this.state.currentPage = activePageId;
      } else {
        this.detectCurrentPage();
      }

      if (this.state.initialized) {
        this.updateActiveNavigation();
        this.loadCommandPalette();
        this.loadNotifications();
        this.checkOnboarding();
        return;
      }

      this.render();
      this.bindEvents();
      this.checkConnectivity();
      this.startPendingCheck();
      this.loadCommandPalette();
      this.loadNotifications();
      this.checkOnboarding();
      this.state.initialized = true;
    },

    /**
     * Detect current page from URL
     */
    detectCurrentPage() {
      const path = window.location.pathname;
      const page = this.config.pages.find((p) => {
        if (p.href === '/kernel/' || p.href === '/kernel/index.html') {
          return path === '/kernel/' || path === '/kernel/index.html' || path === '/kernel';
        }
        return path === p.href || path === p.href.replace(/\/$/, '') || path === `${p.href.replace(/\/$/, '')}.html`;
      });
      this.state.currentPage = page ? page.id : 'home';
    },

    isKnownPage(pageId) {
      return Boolean(pageId && this.config.pages.some((page) => page.id === pageId));
    },

    setActive(pageId) {
      if (!this.isKnownPage(pageId)) return;
      this.state.currentPage = pageId;
      this.updateActiveNavigation();
    },

    updateActiveNavigation() {
      const activePage = this.config.pages.find((page) => page.id === this.state.currentPage);
      if (!activePage) return;

      document.querySelectorAll('[data-kernel-nav-id]').forEach((element) => {
        const isActive = element.getAttribute('data-kernel-nav-id') === activePage.id;
        element.classList.toggle('active', isActive);
        if (isActive) {
          element.setAttribute('aria-current', 'page');
        } else {
          element.removeAttribute('aria-current');
        }
      });
    },

    /**
     * Create SVG icon
     * @param {string} name - Icon name
     * @param {string} className - Optional class name
     * @returns {string} SVG HTML
     */
    createIcon(name, className = '') {
      const path = this.icons[name] || this.icons.home;
      return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    },

    /**
     * Render all navigation components
     */
    render() {
      this.renderTopNav();
      this.renderStatusBar();
      this.renderBottomNav();
      this.renderMobileDrawer();
    },

    /**
     * Render top navigation
     */
    renderTopNav() {
      const topNav = document.createElement('header');
      topNav.className = 'top-nav';
      topNav.id = 'top-nav';

      const mainPages = this.config.pages.slice(0, this.config.moreMenuThreshold);
      const morePages = this.config.pages.slice(this.config.moreMenuThreshold);

      topNav.innerHTML = KernelUtils.sanitizeHtml(`
        <div class="container">
          <a href="/kernel/" class="logo" aria-label="الرئيسية">
            ${this.createIcon('shield', 'logo-icon')}
            <span>نواة BrightAI</span>
          </a>
          
          <nav class="nav-links" aria-label="التنقل الرئيسي">
            ${mainPages.map((page) => this.renderNavLink(page)).join('')}
            ${morePages.length > 0 ? this.renderMoreMenu(morePages) : ''}
          </nav>

          <div class="nav-actions">
            <div class="kernel-notification-center" id="kernel-notification-center">
              <button class="kernel-notification-button" id="kernel-notification-button" type="button" aria-label="فتح مركز الإشعارات" aria-expanded="false" aria-controls="kernel-notification-dropdown" title="الإشعارات">
                ${this.createIcon('bell')}
                <span class="kernel-notification-badge" id="kernel-notification-badge" hidden>0</span>
              </button>
              <div class="kernel-notification-dropdown" id="kernel-notification-dropdown" role="dialog" aria-label="مركز الإشعارات" aria-hidden="true">
                <div class="kernel-notification-header">
                  <div>
                    <strong>الإشعارات</strong>
                    <span id="kernel-notification-summary">لا توجد إشعارات جديدة</span>
                  </div>
                  <div class="kernel-notification-header-actions">
                    <button type="button" class="kernel-notification-icon-button" id="kernel-notification-sound" aria-label="تفعيل صوت الإشعارات" title="صوت الإشعارات">
                      ${this.createIcon('bell')}
                    </button>
                    <button type="button" class="kernel-notification-link-button" id="kernel-notification-mark-all">قراءة الكل</button>
                  </div>
                </div>
                <div class="kernel-notification-list" id="kernel-notification-list">
                  <div class="kernel-notification-empty">لا توجد إشعارات حالياً</div>
                </div>
              </div>
            </div>
            <button class="command-palette-trigger" id="command-palette-trigger" type="button" data-command-palette-trigger aria-label="فتح لوحة الأوامر" title="لوحة الأوامر">
              ${this.createIcon('search')}
            </button>
            <button class="hamburger-btn" id="hamburger-btn" aria-label="فتح قائمة Kernel" aria-expanded="false" aria-controls="mobile-drawer">
              ${this.createIcon('menu')}
            </button>
          </div>
        </div>
      `);

      const unifiedHeader = document.getElementById('brightai-unified-header');
      if (unifiedHeader && unifiedHeader.parentNode === document.body) {
        unifiedHeader.insertAdjacentElement('afterend', topNav);
        return;
      }

      document.body.insertBefore(topNav, document.body.firstChild);
    },

    /**
     * Render shared kernel provider/database status bar.
     */
    renderStatusBar() {
      if (document.getElementById('kernel-status-bar')) return;

      const statusBar = document.createElement('section');
      statusBar.className = 'kernel-status-bar loading';
      statusBar.id = 'kernel-status-bar';
      statusBar.setAttribute('role', 'status');
      statusBar.setAttribute('aria-live', 'polite');

      statusBar.innerHTML = KernelUtils.sanitizeHtml(`
        <div class="container kernel-status-bar-inner">
          <div class="kernel-status-provider">
            <span class="kernel-status-dot" id="kernel-status-dot" aria-hidden="true"></span>
            <span class="kernel-status-label">Kernel Provider</span>
            <strong id="kernel-status-provider-text">Checking...</strong>
          </div>
          <div class="kernel-status-meta">
            <span class="kernel-status-pill">
              <span>DB</span>
              <strong id="kernel-status-db-text">Checking...</strong>
            </span>
            <span class="kernel-status-pill">
              <span>Mode</span>
              <strong id="kernel-status-mode-text">Checking...</strong>
            </span>
          </div>
        </div>
      `);

      const topNav = document.getElementById('top-nav');
      if (topNav && topNav.parentNode) {
        topNav.insertAdjacentElement('afterend', statusBar);
        return;
      }

      document.body.insertBefore(statusBar, document.body.firstChild);
    },

    /**
     * Render single nav link
     * @param {Object} page - Page config
     * @returns {string} HTML
     */
    renderNavLink(page) {
      const isActive = this.state.currentPage === page.id;
      return `
        <a href="${page.href}" 
           class="nav-link ${isActive ? 'active' : ''}"
           data-kernel-nav-id="${page.id}"
           ${isActive ? 'aria-current="page"' : ''}>
          ${page.label}
            ${page.isNew ? '<span class="badge badge-new" aria-label="صفحة جديدة">جديد</span>' : ''}
            ${page.showPending ? `<span class="pending-badge" id="pending-badge-top" style="display: none;" aria-label="طلبات موافقة معلقة">0</span>` : ''}
        </a>
      `;
    },

    /**
     * Render more menu dropdown
     * @param {Array} pages - Pages for dropdown
     * @returns {string} HTML
     */
    renderMoreMenu(pages) {
      return `
        <div class="nav-more" id="nav-more">
          <button class="nav-more-btn" id="nav-more-btn" aria-expanded="false" aria-haspopup="true" aria-controls="nav-dropdown" aria-label="عرض المزيد من صفحات Kernel">
            المزيد
            ${this.createIcon('chevronDown')}
          </button>
          <div class="nav-dropdown" id="nav-dropdown" role="menu">
            ${pages
              .map(
                (page) => `
              <a href="${page.href}" class="nav-dropdown-item" role="menuitem" data-kernel-nav-id="${page.id}">
                ${this.createIcon(page.icon)}
                ${page.label}
                ${page.isNew ? '<span class="badge badge-new" aria-label="صفحة جديدة">جديد</span>' : ''}
              </a>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    },

    /**
     * Render bottom navigation for mobile
     */
    renderBottomNav() {
      const bottomNavPages = this.config.pages.filter((p) => p.showInBottomNav);

      const bottomNav = document.createElement('nav');
      bottomNav.className = 'bottom-nav';
      bottomNav.id = 'bottom-nav';
      bottomNav.setAttribute('aria-label', 'التنقل السفلي');

      bottomNav.innerHTML = KernelUtils.sanitizeHtml(`
        <div class="bottom-nav-inner">
          ${bottomNavPages
            .map((page) => {
              const isActive = this.state.currentPage === page.id;
              return `
              <a href="${page.href}" 
                 class="bottom-nav-item ${isActive ? 'active' : ''}"
                 data-kernel-nav-id="${page.id}"
                 ${isActive ? 'aria-current="page"' : ''}>
                ${this.createIcon(page.icon)}
                <span>${page.label}</span>
                ${page.showPending ? '<span class="pending-dot" id="pending-dot-bottom" style="display: none;" aria-label="طلبات موافقة معلقة"></span>' : ''}
              </a>
            `;
            })
            .join('')}
        </div>
      `);

      document.body.appendChild(bottomNav);
    },

    /**
     * Render mobile drawer
     */
    renderMobileDrawer() {
      // Backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'drawer-backdrop';
      backdrop.id = 'drawer-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);

      // Drawer
      const drawer = document.createElement('aside');
      drawer.className = 'mobile-drawer';
      drawer.id = 'mobile-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-label', 'قائمة التنقل');
      drawer.setAttribute('aria-hidden', 'true');

      drawer.innerHTML = KernelUtils.sanitizeHtml(`
        <div class="drawer-header">
          <a href="/kernel/" class="logo">
            ${this.createIcon('shield', 'logo-icon')}
            <span>نواة BrightAI</span>
          </a>
          <button class="drawer-close" id="drawer-close" aria-label="إغلاق القائمة">
            ${this.createIcon('close')}
          </button>
        </div>
        <nav class="drawer-nav">
          ${this.config.pages
            .map((page) => {
              const isActive = this.state.currentPage === page.id;
              return `
              <a href="${page.href}" 
                 class="drawer-link ${isActive ? 'active' : ''}"
                 data-kernel-nav-id="${page.id}">
                ${this.createIcon(page.icon)}
                ${page.label}
                ${page.isNew ? '<span class="badge badge-new" aria-label="صفحة جديدة">جديد</span>' : ''}
              </a>
            `;
            })
            .join('')}
        </nav>
      `);

      document.body.appendChild(drawer);
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
      // Hamburger button
      const hamburgerBtn = document.getElementById('hamburger-btn');
      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => this.toggleDrawer());
      }

      // Drawer close button
      const drawerClose = document.getElementById('drawer-close');
      if (drawerClose) {
        drawerClose.addEventListener('click', () => this.closeDrawer());
      }

      // Backdrop click
      const backdrop = document.getElementById('drawer-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => this.closeDrawer());
      }

      // More menu
      const moreBtn = document.getElementById('nav-more-btn');
      if (moreBtn) {
        moreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleMoreMenu();
        });
      }

      document.querySelectorAll('[data-command-palette-trigger]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          this.openCommandPalette(button);
        });
      });

      // Close drawer after choosing a link, which keeps mobile navigation tight.
      document.querySelectorAll('.drawer-link').forEach((link) => {
        link.addEventListener('click', () => this.closeDrawer());
      });

      // Close more menu on outside click
      document.addEventListener('click', (e) => {
        const moreMenu = document.getElementById('nav-more');
        if (moreMenu && !moreMenu.contains(e.target)) {
          this.closeMoreMenu();
        }
      });

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeDrawer();
          this.closeMoreMenu();
          return;
        }

        if (this.state.isDrawerOpen) {
          this.trapFocus(e, document.getElementById('mobile-drawer'));
        }

        if (this.state.isMoreMenuOpen) {
          this.trapFocus(e, document.getElementById('nav-more'));
        }
      });

      // Handle resize
      const mediaQuery = window.matchMedia('(min-width: 768px)');
      mediaQuery.addEventListener('change', (e) => {
        if (e.matches) {
          this.closeDrawer();
        }
      });

      window.addEventListener('offline', () => this.checkConnectivity());
      window.addEventListener('online', () => this.handleConnectivityRestored());
    },

    /**
     * Toggle mobile drawer
     */
    toggleDrawer() {
      this.state.isDrawerOpen = !this.state.isDrawerOpen;
      const drawer = document.getElementById('mobile-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      const hamburgerBtn = document.getElementById('hamburger-btn');

      if (this.state.isDrawerOpen) {
        this.state.lastDrawerTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : hamburgerBtn;
      }
      if (drawer) drawer.classList.toggle('open', this.state.isDrawerOpen);
      if (backdrop) backdrop.classList.toggle('open', this.state.isDrawerOpen);
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', String(this.state.isDrawerOpen));
      if (drawer) drawer.setAttribute('aria-hidden', String(!this.state.isDrawerOpen));
      if (backdrop) backdrop.setAttribute('aria-hidden', String(!this.state.isDrawerOpen));

      // Prevent body scroll when drawer is open
      document.body.style.overflow = this.state.isDrawerOpen ? 'hidden' : '';
      document.body.classList.toggle('drawer-open', this.state.isDrawerOpen);

      if (this.state.isDrawerOpen) {
        this.focusFirstIn(drawer);
      } else {
        this.restoreFocus(this.state.lastDrawerTrigger);
      }
    },

    /**
     * Close mobile drawer
     */
    closeDrawer() {
      if (!this.state.isDrawerOpen) return;
      this.state.isDrawerOpen = false;
      
      const drawer = document.getElementById('mobile-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      const hamburgerBtn = document.getElementById('hamburger-btn');

      if (drawer) drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
      if (drawer) drawer.setAttribute('aria-hidden', 'true');
      if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.body.classList.remove('drawer-open');
      this.restoreFocus(this.state.lastDrawerTrigger);
    },

    /**
     * Toggle more menu
     */
    toggleMoreMenu() {
      this.state.isMoreMenuOpen = !this.state.isMoreMenuOpen;
      const moreContainer = document.getElementById('nav-more');
      const moreBtn = document.getElementById('nav-more-btn');

      if (this.state.isMoreMenuOpen) {
        this.state.lastMoreTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : moreBtn;
      }
      if (moreContainer) moreContainer.classList.toggle('open', this.state.isMoreMenuOpen);
      if (moreBtn) moreBtn.setAttribute('aria-expanded', String(this.state.isMoreMenuOpen));
      if (this.state.isMoreMenuOpen) {
        this.focusFirstIn(document.getElementById('nav-dropdown'));
      } else {
        this.restoreFocus(this.state.lastMoreTrigger);
      }
    },

    /**
     * Close more menu
     */
    closeMoreMenu() {
      if (!this.state.isMoreMenuOpen) return;
      this.state.isMoreMenuOpen = false;
      
      const moreContainer = document.getElementById('nav-more');
      const moreBtn = document.getElementById('nav-more-btn');

      if (moreContainer) moreContainer.classList.remove('open');
      if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
      this.restoreFocus(this.state.lastMoreTrigger);
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

    openCommandPalette(trigger) {
      this.closeDrawer();
      this.closeMoreMenu();

      if (global.KernelCommandPalette && typeof global.KernelCommandPalette.open === 'function') {
        global.KernelCommandPalette.open(trigger);
        return;
      }

      this.loadCommandPalette(() => {
        if (global.KernelCommandPalette && typeof global.KernelCommandPalette.open === 'function') {
          global.KernelCommandPalette.open(trigger);
        }
      });
    },

    loadCommandPalette(callback) {
      const initPalette = () => {
        if (global.KernelCommandPalette && typeof global.KernelCommandPalette.init === 'function') {
          global.KernelCommandPalette.init({
            pages: this.config.pages,
            createIcon: (name, className = '') => this.createIcon(name, className),
          });
        }
        if (typeof callback === 'function') callback();
      };

      if (global.KernelCommandPalette) {
        initPalette();
        return;
      }

      const existingScript = document.querySelector(`script[src="${this.config.commandPaletteSrc}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', initPalette, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = this.config.commandPaletteSrc;
      script.defer = true;
      script.dataset.kernelCommandPalette = 'true';
      script.addEventListener('load', initPalette, { once: true });
      document.head.appendChild(script);
    },

    loadNotifications(callback) {
      const initNotifications = () => {
        if (global.KernelNotifications && typeof global.KernelNotifications.init === 'function') {
          global.KernelNotifications.init({
            createIcon: (name, className = '') => this.createIcon(name, className),
          });
        }
        if (typeof callback === 'function') callback();
      };

      if (global.KernelNotifications) {
        initNotifications();
        return;
      }

      const existingScript = document.querySelector(`script[src="${this.config.notificationsSrc}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', initNotifications, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = this.config.notificationsSrc;
      script.defer = true;
      script.dataset.kernelNotifications = 'true';
      script.addEventListener('load', initNotifications, { once: true });
      document.head.appendChild(script);
    },

    /**
     * Load and run first-time onboarding on every Kernel page load.
     * The onboarding module owns localStorage gating and forced re-open events.
     */
    checkOnboarding() {
      const path = global.location?.pathname || '';
      const isHomePage = this.state.currentPage === 'home' && (
        path === '/kernel/' || path === '/kernel' || path === '/kernel/index.html'
      );
      if (!isHomePage) return;

      const initOnboarding = () => {
        if (global.KernelOnboarding && typeof global.KernelOnboarding.init === 'function') {
          global.KernelOnboarding.init();
        }
      };

      if (global.KernelOnboarding) {
        initOnboarding();
        return;
      }

      const existingScript = document.querySelector(`script[src="${this.config.onboardingSrc}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', initOnboarding, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = this.config.onboardingSrc;
      script.defer = true;
      script.dataset.kernelOnboarding = 'true';
      script.addEventListener('load', initOnboarding, { once: true });
      document.head.appendChild(script);
    },

    installThemeHelpers() {
      const utils = global.KernelUtils;
      if (!utils) return;

      const themeKey = 'brightai_kernel_theme';
      const applyTheme = (theme) => {
        const nextTheme = theme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        try {
          localStorage.setItem(themeKey, nextTheme);
        } catch (error) {
          // Storage is optional; the visual state is still applied.
        }
        return nextTheme;
      };

      if (typeof utils.initTheme !== 'function') {
        utils.initTheme = () => {
          let storedTheme = 'dark';
          try {
            storedTheme = localStorage.getItem(themeKey) || 'dark';
          } catch (error) {
            storedTheme = 'dark';
          }
          return applyTheme(storedTheme);
        };
      }

      if (typeof utils.toggleTheme !== 'function') {
        utils.toggleTheme = () => {
          const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
          return applyTheme(currentTheme === 'light' ? 'dark' : 'light');
        };
      }

      if (typeof utils.showToast !== 'function') {
        utils.showToast = (message, type = 'info') => this.showToast(message, type);
      }

      utils.initTheme();
    },

    showToast(message, type = 'info', options = {}) {
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
      if (options.connectivity) {
        toast.dataset.kernelConnectivityToast = 'true';
      }

      const content = document.createElement('div');
      content.className = 'toast-content';
      content.textContent = String(message || '');

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'toast-close';
      closeButton.setAttribute('aria-label', 'إغلاق التنبيه');
      closeButton.textContent = '×';
      closeButton.addEventListener('click', () => {
        if (options.connectivity) this.state.connectivityToastDismissed = true;
        toast.remove();
      });

      toast.append(content, closeButton);
      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      if (!options.persistent) {
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 250);
        }, 3200);
      }
      return toast;
    },

    async checkConnectivity() {
      if (navigator.onLine !== false) {
        this.handleConnectivityRestored();
        return true;
      }

      try {
        await fetch(`/kernel/connectivity-check?ts=${Date.now()}`, {
          cache: 'no-store',
          headers: { Accept: 'text/plain' },
        });
        this.handleConnectivityRestored();
        return true;
      } catch (_error) {
        this.state.connectivityOffline = true;
        if (!this.state.connectivityToastDismissed && !document.querySelector('[data-kernel-connectivity-toast]')) {
          this.showToast('الاتصال بالإنترنت غير متاح. سنخفي هذا التنبيه تلقائياً عند عودة الشبكة.', 'warning', {
            connectivity: true,
            persistent: true,
          });
        }
        return false;
      }
    },

    handleConnectivityRestored() {
      this.state.connectivityOffline = false;
      this.state.connectivityToastDismissed = false;
      document.querySelectorAll('[data-kernel-connectivity-toast]').forEach((toast) => toast.remove());
    },

    /**
     * Start checking for pending approvals
     */
    startPendingCheck() {
      this.checkPendingCount();
      if (!this.state.pendingIntervalId) {
        this.state.pendingIntervalId = setInterval(() => this.checkPendingCount(), this.config.pendingCheckInterval);
      }
      this.startStatusCheck();
    },

    /**
     * Start shared kernel status checks.
     */
    startStatusCheck() {
      this.checkKernelStatus();
      if (this.state.statusIntervalId) return;
      this.state.statusIntervalId = setInterval(() => this.checkKernelStatus(), this.config.statusCheckInterval);
    },

    /**
     * Fetch JSON with a short timeout so the status bar never blocks the page.
     * @param {string} path - API path
     * @returns {Promise<Object>}
     */
    async fetchJson(path) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(path, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },

    /**
     * Check provider and DB status from the production kernel APIs.
     */
    async checkKernelStatus() {
      const bar = document.getElementById('kernel-status-bar');
      if (!bar) return;

      try {
        const [providersData, healthData] = await Promise.all([
          this.fetchJson('/api/kernel/providers'),
          this.fetchJson('/api/kernel/health'),
        ]);
        this.updateKernelStatusBar(providersData, healthData);
      } catch (error) {
        this.updateKernelStatusError();
      }
    },

    /**
     * Return the active provider without exposing secrets or raw provider payloads.
     * @param {Object} providersData - /api/kernel/providers response
     * @returns {Object}
     */
    getActiveProvider(providersData = {}) {
      const active = providersData.activeProvider || providersData.provider || {};
      if (active && active.name) return active;

      const providers = providersData.providers || {};
      const order = providersData.order || ['nvidia', 'gemini', 'openai', 'anthropic', 'allam', 'local'];
      const productionProvider = order
        .map((name) => providers[name])
        .find((provider) => provider && provider.configured === true && provider.mode === 'production');

      return productionProvider || providers.local || {};
    },

    /**
     * Map provider names into display labels.
     * @param {string} name - Provider name
     * @returns {string}
     */
    getProviderLabel(name) {
      const normalized = String(name || '').trim().toLowerCase();
      const labels = {
        nvidia: 'NVIDIA',
        gemini: 'Gemini',
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        allam: 'ALLaM',
        local: 'Local Demo',
      };
      return labels[normalized] || (name ? String(name) : 'Provider');
    },

    /**
     * Update the shared status bar UI.
     * @param {Object} providersData - /api/kernel/providers response
     * @param {Object} healthData - /api/kernel/health response
     */
    updateKernelStatusBar(providersData = {}, healthData = {}) {
      const bar = document.getElementById('kernel-status-bar');
      const dot = document.getElementById('kernel-status-dot');
      const providerText = document.getElementById('kernel-status-provider-text');
      const dbText = document.getElementById('kernel-status-db-text');
      const modeText = document.getElementById('kernel-status-mode-text');
      if (!bar || !dot || !providerText || !dbText || !modeText) return;

      const activeProvider = this.getActiveProvider(providersData);
      const providerName = String(activeProvider.name || '').toLowerCase();
      const providerLabel = this.getProviderLabel(providerName || activeProvider.name);
      const isProductionProvider = activeProvider.configured === true && activeProvider.mode === 'production';
      const isNvidiaConnected = providerName === 'nvidia' && isProductionProvider;
      const isFallback = providersData.demoMode === true
        || activeProvider.mode === 'demo'
        || activeProvider.adapter === 'demo'
        || providerName === 'local'
        || providerName === 'allam';
      const dbConnected = Boolean(
        healthData.kernel?.database === true
        || healthData.database === true
        || healthData.database?.connected === true
        || healthData.db?.connected === true
      );
      const healthDegraded = healthData.status && healthData.status !== 'ok';
      const degraded = isFallback || !isProductionProvider || !dbConnected || healthDegraded;

      bar.className = `kernel-status-bar ${degraded ? 'degraded' : 'connected'}`;
      dot.className = `kernel-status-dot ${degraded ? 'degraded' : 'connected'}`;

      providerText.textContent = isNvidiaConnected || isProductionProvider
        ? `${providerLabel} · Connected`
        : `${providerLabel} · Degraded`;
      dbText.textContent = dbConnected ? 'Connected' : 'Degraded';
      modeText.textContent = isFallback ? 'Fallback / Local demo' : 'Production';
    },

    /**
     * Show an explicit degraded state when status APIs cannot be reached.
     */
    updateKernelStatusError() {
      const bar = document.getElementById('kernel-status-bar');
      const dot = document.getElementById('kernel-status-dot');
      const providerText = document.getElementById('kernel-status-provider-text');
      const dbText = document.getElementById('kernel-status-db-text');
      const modeText = document.getElementById('kernel-status-mode-text');
      if (!bar || !dot || !providerText || !dbText || !modeText) return;

      bar.className = 'kernel-status-bar degraded';
      dot.className = 'kernel-status-dot degraded';
      providerText.textContent = 'Production API · Degraded';
      dbText.textContent = 'Unknown';
      modeText.textContent = 'Fallback unavailable';
    },

    /**
     * Check pending approvals count
     */
    async checkPendingCount() {
      try {
        const response = await fetch('/api/kernel/approvals');
        if (!response.ok) return;
        
        const data = await response.json();
        const count = data.summary?.totalPending || 0;
        this.updatePendingBadge(count);
      } catch (error) {
        // Silently fail - not critical
      }
    },

    /**
     * Update pending badges
     * @param {number} count - Pending count
     */
    updatePendingBadge(count) {
      this.state.pendingCount = count;

      // Top nav badge
      const topBadge = document.getElementById('pending-badge-top');
      if (topBadge) {
        topBadge.textContent = count;
        topBadge.style.display = count > 0 ? 'flex' : 'none';
        topBadge.classList.toggle('pulse', count > 0);
      }

      // Bottom nav dot
      const bottomDot = document.getElementById('pending-dot-bottom');
      if (bottomDot) {
        bottomDot.style.display = count > 0 ? 'block' : 'none';
        bottomDot.classList.toggle('pulse', count > 0);
      }
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KernelNav.init());
  } else {
    KernelNav.init();
  }

  // Export to global scope
  global.KernelNav = KernelNav;

})(typeof window !== 'undefined' ? window : this);
