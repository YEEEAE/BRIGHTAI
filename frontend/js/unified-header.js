/**
 * ========================================================================
 * BrightAI Unified Premium Header System - JavaScript
 * Role: Senior UI/UX & Frontend Architect
 * Saudi Market AI Safety Platform - High-Performance Interactive Navigation
 * ========================================================================
 */

(function () {
  'use strict';

  // 1. الكشف الذكي عن لغة الصفحة الحالية وسياق التوجيه
  const pathname = window.location.pathname;
  const isEnglish = pathname.startsWith('/en/') || document.documentElement.lang === 'en';

  // 2. إعداد النصوص المترجمة والروابط لكلا اللغتين (عربي / إنجليزي)
  const translations = {
    ar: {
      home: 'الرئيسية',
      solutions: 'الحلول',
      resources: 'الموارد',
      kernel: 'لوحة النواة KERNEL',
      pricing: 'الأسعار',
      contact: 'تواصل معنا',
      demoBtn: 'ابدأ ديمو خاص بشركتك',
      waBtn: 'تواصل عبر واتساب',
      closeMenu: 'إغلاق القائمة',
      openMenu: 'فتح القائمة',
      logoSub: 'Saudi AI Safety',
      resourcesCol1: 'الموارد',
      resourcesCol2: 'الشركة',
      resourcesCol3: 'المجتمع / القنوات',
      whatsappUrl: 'https://wa.me/966538229013',
      solutionsCta: 'استعرض الخدمات والحلول',
    },
    en: {
      home: 'Home',
      solutions: 'Solutions',
      resources: 'Resources',
      kernel: 'Kernel Board KERNEL',
      pricing: 'Pricing',
      contact: 'Contact Us',
      demoBtn: 'Start Corporate Demo',
      waBtn: 'WhatsApp Us',
      closeMenu: 'Close Menu',
      openMenu: 'Open Menu',
      logoSub: 'Saudi AI Safety',
      resourcesCol1: 'Resources',
      resourcesCol2: 'Company',
      resourcesCol3: 'Community / Channels',
      whatsappUrl: 'https://wa.me/966538229013',
      solutionsCta: 'Explore services and solutions',
    }
  };

  const t = isEnglish ? translations.en : translations.ar;

  // تعريف روابط الحلول
  const solutionsList = [
    {
      title: isEnglish ? 'AI Governance Platform' : 'منصة حوكمة الذكاء الاصطناعي',
      url: isEnglish ? '/solutions/ai-governance-platform/' : '/solutions/ai-governance-platform/',
      icon: 'fa-scale-balanced',
      desc: isEnglish ? 'Operational layer to manage AI usage and risks within the enterprise.' : 'طبقة تشغيلية لإدارة استخدامات ومخاطر AI داخل المؤسسة.'
    },
    {
      title: 'AI Firewall',
      url: isEnglish ? '/solutions/ai-firewall/' : '/solutions/ai-firewall/',
      icon: 'fa-shield-halved',
      desc: isEnglish ? 'Inspect and protect sensitive data before it reaches models.' : 'فحص وحماية البيانات الحساسة قبل وصولها للنماذج.'
    },
    {
      title: 'AI Audit Trail',
      url: isEnglish ? '/solutions/ai-audit-trail/' : '/solutions/ai-audit-trail/',
      icon: 'fa-file-signature',
      desc: isEnglish ? 'Auditable log for every request, decision, and approval.' : 'سجل قابل للمراجعة لكل طلب وقرار وموافقة.'
    },
    {
      title: isEnglish ? 'Human Approval Layer' : 'Human Approval Layer',
      url: isEnglish ? '/solutions/human-approval-layer/' : '/solutions/human-approval-layer/',
      icon: 'fa-user-check',
      desc: isEnglish ? 'Human review for high-risk requests and decisions.' : 'مراجعة بشرية للطلبات والقرارات عالية المخاطر.'
    },
    {
      title: 'AI Evidence File',
      url: isEnglish ? '/solutions/ai-evidence-file/' : '/solutions/ai-evidence-file/',
      icon: 'fa-folder-open',
      desc: isEnglish ? 'Evidence file supporting audit and compliance readiness.' : 'ملف أدلة يدعم التدقيق وجاهزية الامتثال.'
    },
    {
      title: isEnglish ? 'Continuous AI Governance' : 'Continuous AI Governance',
      url: isEnglish ? '/solutions/continuous-ai-governance/' : '/solutions/continuous-ai-governance/',
      icon: 'fa-arrows-rotate',
      desc: isEnglish ? 'Ongoing monitoring for governance and compliance.' : 'متابعة مستمرة للحوكمة والامتثال.'
    }
  ];

  // تعريف روابط لوحة النواة KERNEL
  const kernelList = [
    {
      title: isEnglish ? 'Control Panel' : 'لوحة التحكم',
      url: isEnglish ? '/kernel/' : '/kernel/',
      icon: 'fa-gauge-high'
    },
    {
      title: isEnglish ? 'Conversations' : 'المحادثات',
      url: isEnglish ? '/kernel/chat.html' : '/kernel/chat.html',
      icon: 'fa-comments'
    },
    {
      title: isEnglish ? 'Audit Log' : 'سجل التدقيق',
      url: isEnglish ? '/kernel/audit.html' : '/kernel/audit.html',
      icon: 'fa-file-lines'
    },
    {
      title: isEnglish ? 'Human Approvals' : 'الموافقات البشرية',
      url: isEnglish ? '/kernel/approvals.html' : '/kernel/approvals.html',
      icon: 'fa-user-check'
    },
    {
      title: isEnglish ? 'Statistics' : 'الإحصائيات',
      url: isEnglish ? '/kernel/stats.html' : '/kernel/stats.html',
      icon: 'fa-chart-line'
    }
  ];

  // إعداد المسار الأساسي بناء على اللغة
  const prefix = isEnglish ? '/en' : '';

  // 3. بناء الهيكل البرمجي للهيدر (DOM Dynamic Generation)
  const headerHtml = `
    <header role="banner" class="brightai-header">
      <nav role="navigation" aria-label="${isEnglish ? 'Main Navigation' : 'القائمة الرئيسية'}" class="brightai-header-nav">
        <!-- الشعار -->
        <a href="${prefix}/" class="brightai-logo-link" aria-label="BrightAI ${t.home}">
          <div class="brightai-logo-box">
            <img src="/frontend/images/logo-new.PNG" alt="Bright AI Logo" width="40" height="40" class="brightai-logo-img" decoding="async" fetchpriority="high">
          </div>
          <span class="brightai-logo-text">Bright<span class="brightai-logo-text-gradient">AI</span></span>
          <span class="brightai-logo-badge">${t.logoSub}</span>
        </a>

        <!-- روابط الديسكتوب (Desktop Menu) -->
        <ul class="brightai-desktop-menu">
          <li>
            <a href="${prefix}/" class="brightai-menu-link ${pathname === '/' || pathname === '/index.html' || pathname === '/en/' || pathname === '/en/index.html' ? 'is-active' : ''}">${t.home}</a>
          </li>
          
          <!-- قائمة الحلول المنسدلة العملاقة -->
          <li class="brightai-menu-item">
            <button class="brightai-menu-link ${pathname.includes('/solutions/') ? 'is-active' : ''}" aria-haspopup="true" aria-expanded="false" id="b-solBtn" aria-controls="b-solMenu">
              <span>${t.solutions}</span>
              <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="brightai-dropdown brightai-dropdown-solutions" id="b-solMenu" role="menu" aria-labelledby="b-solBtn">
              ${solutionsList.map(item => `
                <a href="${item.url}" class="brightai-dropdown-item" role="menuitem">
                  <div class="brightai-dropdown-icon">
                    <i class="fa-solid ${item.icon}"></i>
                  </div>
                  <div class="brightai-dropdown-content">
                    <span class="brightai-dropdown-title">${item.title}</span>
                    <span class="brightai-dropdown-desc">${item.desc}</span>
                  </div>
                </a>
              `).join('')}
              <a href="/services/" class="brightai-dropdown-cta" role="menuitem">
                <span>${t.solutionsCta}</span>
                <i class="fa-solid fa-arrow-left-long" aria-hidden="true"></i>
              </a>
            </div>
          </li>

          <!-- قائمة الموارد المنسدلة العملاقة -->
          <li class="brightai-menu-item">
            <button class="brightai-menu-link ${pathname.includes('/blog/') || pathname.includes('/docs/') ? 'is-active' : ''}" aria-haspopup="true" aria-expanded="false" id="b-resBtn" aria-controls="b-resMenu">
              <span>${t.resources}</span>
              <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="brightai-dropdown brightai-dropdown-resources" id="b-resMenu" role="menu" aria-labelledby="b-resBtn">
              <!-- العمود الأول: الموارد -->
              <div class="brightai-resource-column">
                <span class="brightai-column-title">${t.resourcesCol1}</span>
                <a href="/blog/" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-rss"></i>
                  <span>${isEnglish ? 'Blog' : 'المدونة'}</span>
                </a>
                <a href="/docs/docs.html" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-book-open"></i>
                  <span>${isEnglish ? 'Documentation' : 'الوثائق'}</span>
                </a>
                <a href="${prefix}/privacy-policy/" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-user-shield"></i>
                  <span>${isEnglish ? 'Privacy Policy' : 'سياسة الخصوصية'}</span>
                </a>
                <a href="${prefix}/terms/" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-gavel"></i>
                  <span>${isEnglish ? 'Terms & Conditions' : 'الشروط والأحكام'}</span>
                </a>
              </div>

              <!-- العمود الثاني: الشركة -->
              <div class="brightai-resource-column">
                <span class="brightai-column-title">${t.resourcesCol2}</span>
                <a href="${prefix}/contact/" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-envelope"></i>
                  <span>${t.contact}</span>
                </a>
                <a href="/services/" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-handshake-angle"></i>
                  <span>${isEnglish ? 'Services' : 'الخدمات'}</span>
                </a>
                <a href="${prefix}/data-processing-agreement/" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-file-contract"></i>
                  <span>${isEnglish ? 'Data Processing Agreement' : 'اتفاقية معالجة البيانات'}</span>
                </a>
                <a href="${prefix}/cookie-policy/" class="brightai-resource-link" role="menuitem">
                  <i class="fa-solid fa-cookie-bite"></i>
                  <span>${isEnglish ? 'Cookie Policy' : 'سياسة الكوكيز'}</span>
                </a>
              </div>

              <!-- العمود الثالث: المجتمع والقنوات -->
              <div class="brightai-resource-column">
                <span class="brightai-column-title">${t.resourcesCol3}</span>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="brightai-resource-link" role="menuitem">
                  <i class="fa-brands fa-linkedin"></i>
                  <span>LinkedIn</span>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="brightai-resource-link" role="menuitem">
                  <i class="fa-brands fa-youtube"></i>
                  <span>YouTube</span>
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" class="brightai-resource-link" role="menuitem">
                  <i class="fa-brands fa-x-twitter"></i>
                  <span>Twitter / X</span>
                </a>
                <a href="${t.whatsappUrl}" target="_blank" rel="noopener noreferrer" class="brightai-resource-link" role="menuitem">
                  <i class="fa-brands fa-whatsapp text-emerald-400"></i>
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </li>

          <!-- قائمة لوحة النواة Dropdown -->
          <li class="brightai-menu-item">
            <button class="brightai-menu-link ${pathname.includes('/kernel/') ? 'is-active' : ''}" aria-haspopup="true" aria-expanded="false" id="b-kerBtn" aria-controls="b-kerMenu">
              <span>${t.kernel}</span>
              <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="brightai-dropdown brightai-dropdown-kernel" id="b-kerMenu" role="menu" aria-labelledby="b-kerBtn">
              ${kernelList.map(item => `
                <a href="${item.url}" class="brightai-dropdown-item" role="menuitem">
                  <div class="brightai-dropdown-icon">
                    <i class="fa-solid ${item.icon}"></i>
                  </div>
                  <div class="brightai-dropdown-content">
                    <span class="brightai-dropdown-title">${item.title}</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </li>

          <!-- رابط الأسعار -->
          <li>
            <a href="/pricing/" class="brightai-menu-link ${pathname.includes('/pricing/') ? 'is-active' : ''}">${t.pricing}</a>
          </li>

          <!-- رابط تواصل معنا -->
          <li>
            <a href="${prefix}/contact/" class="brightai-menu-link ${pathname.includes('/contact/') ? 'is-active' : ''}">${t.contact}</a>
          </li>
        </ul>

        <!-- أزرار الإجراءات والهمبرغر للجوال -->
        <div class="brightai-actions">
          <a href="${t.whatsappUrl}" target="_blank" rel="noopener noreferrer" class="brightai-btn brightai-btn-wa" aria-label="${t.waBtn}">
            <i class="fa-brands fa-whatsapp"></i>
            <span>${t.waBtn}</span>
          </a>
          <a href="${prefix}/#demo" class="brightai-btn brightai-btn-demo">
            <i class="fa-solid fa-rocket"></i>
            <span>${t.demoBtn}</span>
          </a>
          <button id="brightai-hamburger" class="brightai-hamburger-btn" aria-label="${t.openMenu}" aria-expanded="false" aria-controls="brightai-mobile-drawer">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </nav>
    </header>

    <!-- درج الجوال الجانبي (Mobile Drawer) -->
    <div id="brightai-drawer-overlay" class="brightai-drawer-overlay" aria-hidden="true"></div>
    <aside id="brightai-mobile-drawer" class="brightai-drawer" role="complementary" aria-label="${isEnglish ? 'Mobile Navigation Drawer' : 'قائمة الجوال الجانبية'}" aria-hidden="true">
      <div class="brightai-drawer-header">
        <a href="${prefix}/" class="brightai-logo-link" aria-label="BrightAI">
          <span class="brightai-logo-text">Bright<span class="brightai-logo-text-gradient">AI</span></span>
        </a>
        <button id="brightai-drawer-close" class="brightai-drawer-close" aria-label="${t.closeMenu}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="brightai-drawer-content">
        <nav aria-label="${isEnglish ? 'Mobile Navigation Links' : 'روابط تنقل الجوال'}">
          <ul class="brightai-drawer-menu">
            <li>
              <a href="${prefix}/" class="brightai-drawer-link ${pathname === '/' || pathname === '/index.html' || pathname === '/en/' || pathname === '/en/index.html' ? 'is-active' : ''}">
                <i class="fa-solid fa-house"></i>
                <span>${t.home}</span>
              </a>
            </li>

            <!-- أكورديون الحلول للجوال -->
            <li>
              <button class="brightai-drawer-accordion-btn ${pathname.includes('/solutions/') ? 'is-active' : ''}" aria-expanded="false" aria-controls="acc-solutions">
                <span>${t.solutions}</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
              </button>
              <div id="acc-solutions" class="brightai-drawer-accordion-content">
                ${solutionsList.map(item => `
                  <a href="${item.url}" class="brightai-drawer-sublink">
                    <i class="fa-solid ${item.icon}"></i>
                    <div>
                      <span class="brightai-drawer-subtitle">${item.title}</span>
                      <span class="brightai-drawer-subdesc">${item.desc}</span>
                    </div>
                  </a>
                `).join('')}
              </div>
            </li>

            <!-- أكورديون الموارد للجوال -->
            <li>
              <button class="brightai-drawer-accordion-btn ${pathname.includes('/blog/') || pathname.includes('/docs/') ? 'is-active' : ''}" aria-expanded="false" aria-controls="acc-resources">
                <span>${t.resources}</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
              </button>
              <div id="acc-resources" class="brightai-drawer-accordion-content">
                <a href="/blog/" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-rss"></i>
                  <div><span class="brightai-drawer-subtitle">${isEnglish ? 'Blog' : 'المدونة'}</span></div>
                </a>
                <a href="/docs/docs.html" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-book-open"></i>
                  <div><span class="brightai-drawer-subtitle">${isEnglish ? 'Documentation' : 'الوثائق'}</span></div>
                </a>
                <a href="${prefix}/privacy-policy/" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-user-shield"></i>
                  <div><span class="brightai-drawer-subtitle">${isEnglish ? 'Privacy Policy' : 'سياسة الخصوصية'}</span></div>
                </a>
                <a href="${prefix}/terms/" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-gavel"></i>
                  <div><span class="brightai-drawer-subtitle">${isEnglish ? 'Terms & Conditions' : 'الشروط والأحكام'}</span></div>
                </a>
                <a href="${prefix}/contact/" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-envelope"></i>
                  <div><span class="brightai-drawer-subtitle">${t.contact}</span></div>
                </a>
                <a href="/services/" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-handshake-angle"></i>
                  <div><span class="brightai-drawer-subtitle">${isEnglish ? 'Services' : 'الخدمات'}</span></div>
                </a>
                <a href="${prefix}/data-processing-agreement/" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-file-contract"></i>
                  <div><span class="brightai-drawer-subtitle">${isEnglish ? 'Data Processing Agreement' : 'اتفاقية معالجة البيانات'}</span></div>
                </a>
                <a href="${prefix}/cookie-policy/" class="brightai-drawer-sublink">
                  <i class="fa-solid fa-cookie-bite"></i>
                  <div><span class="brightai-drawer-subtitle">${isEnglish ? 'Cookie Policy' : 'سياسة الكوكيز'}</span></div>
                </a>
              </div>
            </li>

            <!-- أكورديون لوحة النواة للجوال -->
            <li>
              <button class="brightai-drawer-accordion-btn ${pathname.includes('/kernel/') ? 'is-active' : ''}" aria-expanded="false" aria-controls="acc-kernel">
                <span>${t.kernel}</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
              </button>
              <div id="acc-kernel" class="brightai-drawer-accordion-content">
                ${kernelList.map(item => `
                  <a href="${item.url}" class="brightai-drawer-sublink">
                    <i class="fa-solid ${item.icon}"></i>
                    <div><span class="brightai-drawer-subtitle">${item.title}</span></div>
                  </a>
                `).join('')}
              </div>
            </li>

            <!-- رابط الأسعار للجوال -->
            <li>
              <a href="/pricing/" class="brightai-drawer-link ${pathname.includes('/pricing/') ? 'is-active' : ''}">
                <i class="fa-solid fa-tags"></i>
                <span>${t.pricing}</span>
              </a>
            </li>

            <!-- رابط تواصل معنا للجوال -->
            <li>
              <a href="${prefix}/contact/" class="brightai-drawer-link ${pathname.includes('/contact/') ? 'is-active' : ''}">
                <i class="fa-solid fa-envelope"></i>
                <span>${t.contact}</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div class="brightai-drawer-footer">
        <a href="${t.whatsappUrl}" target="_blank" rel="noopener noreferrer" class="brightai-btn brightai-btn-wa" aria-label="${t.waBtn}">
          <i class="fa-brands fa-whatsapp"></i>
          <span>${t.waBtn}</span>
        </a>
        <a href="${prefix}/#demo" class="brightai-btn brightai-btn-demo">
          <i class="fa-solid fa-rocket"></i>
          <span>${t.demoBtn}</span>
        </a>
      </div>
    </aside>
  `;

  // 4. آلية الحقن الديناميكي الآمن
  function injectHeader() {
    let container = document.getElementById('brightai-unified-header');
    if (!container) {
      container = document.createElement('div');
      container.id = 'brightai-unified-header';
      document.body.insertBefore(container, document.body.firstChild);
    }
    container.innerHTML = headerHtml;

    // تهيئة وظائف وإجراءات التفاعل
    initInteractions();
  }

  // 5. تهيئة وتفعيل وظائف التفاعل الفاخر وإمكانية الوصول
  function initInteractions() {
    const hamburger = document.getElementById('brightai-hamburger');
    const closeBtn = document.getElementById('brightai-drawer-close');
    const overlay = document.getElementById('brightai-drawer-overlay');
    const drawer = document.getElementById('brightai-mobile-drawer');

    if (!hamburger || !drawer) return;

    // فتح القائمة الجانبية
    function openDrawer() {
      drawer.classList.add('is-active');
      overlay.classList.add('is-active');
      document.body.classList.add('brightai-no-scroll');
      hamburger.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
    }

    // إغلاق القائمة الجانبية
    function closeDrawer() {
      drawer.classList.remove('is-active');
      overlay.classList.remove('is-active');
      document.body.classList.remove('brightai-no-scroll');
      hamburger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      hamburger.focus();
    }

    hamburger.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // إغلاق عند الضغط على ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
        closeDrawer();
      }
    });

    // إدارة الأكورديون للجوال بسلاسة فائقة
    const accordions = document.querySelectorAll('.brightai-drawer-accordion-btn');
    accordions.forEach(btn => {
      btn.addEventListener('click', function () {
        const contentId = this.getAttribute('aria-controls');
        const content = document.getElementById(contentId);
        const isOpen = this.getAttribute('aria-expanded') === 'true';

        // إغلاق بقية الأكورديونات المفتوحة لمظهر أكثر ترتيباً
        accordions.forEach(otherBtn => {
          if (otherBtn !== btn) {
            otherBtn.setAttribute('aria-expanded', 'false');
            otherBtn.classList.remove('is-open');
            const otherContent = document.getElementById(otherBtn.getAttribute('aria-controls'));
            if (otherContent) otherContent.classList.remove('is-open');
          }
        });

        if (isOpen) {
          this.setAttribute('aria-expanded', 'false');
          this.classList.remove('is-open');
          content.classList.remove('is-open');
        } else {
          this.setAttribute('aria-expanded', 'true');
          this.classList.add('is-open');
          content.classList.add('is-open');
        }
      });
    });

    // إغلاق الدروير تلقائياً بعد النقر على رابط التنقل لضمان انسيابية التجربة
    const drawerLinks = drawer.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.addEventListener('click', function () {
        // نغلق فقط إذا لم يكن الضغط لفتح أكورديون أو رابط فارغ
        if (this.getAttribute('href') !== '#') {
          closeDrawer();
        }
      });
    });

    // إدارة التنقل عبر الكيبورد للقوائم المنسدلة للديسكتوب
    const desktopDropBtns = document.querySelectorAll('.brightai-desktop-menu button[aria-haspopup="true"]');

    function closeDesktopDropdowns(exceptBtn) {
      desktopDropBtns.forEach(otherBtn => {
        if (otherBtn === exceptBtn) return;
        const menuItem = otherBtn.closest('.brightai-menu-item');
        otherBtn.setAttribute('aria-expanded', 'false');
        if (menuItem) menuItem.classList.remove('is-open');
      });
    }

    desktopDropBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        const menuItem = this.closest('.brightai-menu-item');

        closeDesktopDropdowns(btn);

        if (isExpanded) {
          this.setAttribute('aria-expanded', 'false');
          if (menuItem) menuItem.classList.remove('is-open');
        } else {
          this.setAttribute('aria-expanded', 'true');
          if (menuItem) menuItem.classList.add('is-open');
        }
      });

      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeDesktopDropdowns();
          this.focus();
        }
      });
    });

    // إغلاق قوائم سطح المكتب عند النقر بالخارج
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.brightai-desktop-menu')) {
        closeDesktopDropdowns();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeDesktopDropdowns();
      }
    });
  }

  // تشغيل السكربت عند اكتمال تحميل الصفحة (DOM Ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

})();
