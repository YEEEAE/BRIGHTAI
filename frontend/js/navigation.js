/**
 * Bright AI - Unified Navigation Controller
 * Handles unified navigation rendering, mobile drawer, and dropdown behavior.
 */

const TARGET_SERVICE_PAGES = new Set([
  "/frontend/pages/smart-automation/index.html",
  "/frontend/pages/data-analysis/index.html",
  "/frontend/pages/ai-agent/index.html",
  "/frontend/pages/smart-medical-archive/index.html",
  "/frontend/pages/ai-workflows/index.html",
  "/frontend/pages/consultation/index.html",
  "/frontend/pages/ai-bots/index.html",
  "/frontend/pages/about-us/index.html",
  "/frontend/pages/contact/index.html",
  "/frontend/pages/our-products/index.html",
  "/frontend/pages/what-is-ai/index.html",
  "/frontend/pages/tools/index.html"
]);

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const cleaned = pathname.replace(/\/+/g, "/").replace(/\/$/, "");
  return cleaned || "/";
}

function buildTargetVariants(targetPath) {
  const normalized = normalizePathname(targetPath);
  const variants = new Set([normalized]);

  if (normalized.endsWith("/index.html")) {
    variants.add(normalized.replace(/\/index\.html$/, ""));
  } else {
    variants.add(`${normalized}/index.html`);
  }

  return variants;
}

function isTargetServicePage(pathname = window.location.pathname) {
  const currentPath = normalizePathname(pathname);

  for (const target of TARGET_SERVICE_PAGES) {
    const variants = buildTargetVariants(target);
    if (variants.has(currentPath)) {
      return true;
    }
  }

  return false;
}

function buildUnifiedNavigationMarkup() {
  return `
    <nav aria-label="التنقل الرئيسي" class="unified-nav" role="navigation">
      <div class="nav-container">
        <button aria-expanded="false" aria-label="فتح القائمة" class="mobile-toggle" type="button">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <a aria-label="Bright AI - الصفحة الرئيسية" class="nav-logo" href="/">
          <img alt="Bright AI Logo" height="40" loading="lazy" src="/frontend/assets/images/Gemini.png" width="40" />
          <span>Bright AI</span>
        </a>

        <ul class="nav-links" role="menubar">
          <li class="nav-item" role="none">
            <a class="nav-link" href="/" role="menuitem">الرئيسية</a>
          </li>

          <li class="nav-item" role="none">
            <a aria-expanded="false" aria-haspopup="true" class="nav-link" href="#" role="button">
              الخدمات الرئيسية
              <span aria-hidden="true" class="chevron-down">▾</span>
            </a>
            <div class="dropdown-menu" role="menu">
              <a class="dropdown-item" href="/frontend/pages/smart-automation/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">الأتمتة الذكية</span>
                  <span class="dropdown-desc">أتمتة العمليات التشغيلية</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/data-analysis/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">تحليل البيانات</span>
                  <span class="dropdown-desc">تقارير ورؤى فورية للأعمال</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/ai-agent/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">AI للمنشآت</span>
                  <span class="dropdown-desc">وكلاء ذكيون للعمليات اليومية</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/smart-medical-archive/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">الأرشيف الطبي الذكي</span>
                  <span class="dropdown-desc">أتمتة إدارة السجلات الطبية</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/ai-workflows/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">سير العمل بالذكاء الاصطناعي</span>
                  <span class="dropdown-desc">بناء تدفقات أعمال ذكية</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/consultation/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">الاستشارات التقنية</span>
                  <span class="dropdown-desc">خطة تنفيذ وتحول عملي</span>
                </div>
              </a>
            </div>
          </li>

          <li class="nav-item" role="none">
            <a aria-expanded="false" aria-haspopup="true" class="nav-link" href="#" role="button">
              المنصات والحلول
              <span aria-hidden="true" class="chevron-down">▾</span>
            </a>
            <div class="dropdown-menu" role="menu">
              <a class="dropdown-item" href="/frontend/pages/ai-bots/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">روبوتات الذكاء الاصطناعي</span>
                  <span class="dropdown-desc">نماذج جاهزة للتشغيل</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/our-products/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">منتجات وخدمات Bright AI</span>
                  <span class="dropdown-desc">حلول مخصصة للشركات</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/tools/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">الأدوات الذكية</span>
                  <span class="dropdown-desc">أدوات مجانية وتجريبية</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/what-is-ai/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">ما هو الذكاء الاصطناعي؟</span>
                  <span class="dropdown-desc">دليل تمهيدي للأعمال</span>
                </div>
              </a>
            </div>
          </li>

          <li class="nav-item" role="none">
            <a aria-expanded="false" aria-haspopup="true" class="nav-link" href="#" role="button">
              الشركة
              <span aria-hidden="true" class="chevron-down">▾</span>
            </a>
            <div class="dropdown-menu" role="menu">
              <a class="dropdown-item" href="/frontend/pages/about-us/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">من نحن</span>
                  <span class="dropdown-desc">فريق Bright AI ورؤيتنا</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/contact/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">تواصل معنا</span>
                  <span class="dropdown-desc">احجز استشارة سريعة</span>
                </div>
              </a>
              <a class="dropdown-item" href="/frontend/pages/blog/index.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">المكتبة الذكية</span>
                  <span class="dropdown-desc">مقالات حالة ودروس تنفيذ</span>
                </div>
              </a>
              <a class="dropdown-item" href="/docs.html" role="menuitem">
                <div class="dropdown-item-content">
                  <span class="dropdown-title">المستندات</span>
                  <span class="dropdown-desc">دليل المنصة والتكامل</span>
                </div>
              </a>
            </div>
          </li>
        </ul>

        <div class="nav-actions">
          <button aria-label="فتح البحث" class="search-trigger" type="button">
            <span aria-hidden="true">⌕</span>
            <span>ابحث في الموقع...</span>
            <span class="search-shortcut">⌘K</span>
          </button>
          <button aria-label="فتح البحث" class="mobile-search-btn" type="button">⌕</button>
          <a class="nav-btn" href="https://wa.me/966538229013" rel="noopener" target="_blank">تواصل معنا</a>
        </div>
      </div>
    </nav>

    <div class="mobile-menu-drawer" aria-hidden="true">
      <ul class="mobile-nav-list">
        <li><a class="mobile-nav-link" href="/">الرئيسية</a></li>

        <li>
          <a aria-expanded="false" aria-haspopup="true" class="mobile-nav-link" href="#">
            الخدمات الرئيسية
            <span aria-hidden="true">▾</span>
          </a>
          <div class="mobile-dropdown">
            <a class="dropdown-item" href="/frontend/pages/smart-automation/index.html">الأتمتة الذكية</a>
            <a class="dropdown-item" href="/frontend/pages/data-analysis/index.html">تحليل البيانات</a>
            <a class="dropdown-item" href="/frontend/pages/ai-agent/index.html">AI للمنشآت</a>
            <a class="dropdown-item" href="/frontend/pages/smart-medical-archive/index.html">الأرشيف الطبي الذكي</a>
            <a class="dropdown-item" href="/frontend/pages/ai-workflows/index.html">سير العمل بالذكاء الاصطناعي</a>
            <a class="dropdown-item" href="/frontend/pages/consultation/index.html">الاستشارات التقنية</a>
          </div>
        </li>

        <li>
          <a aria-expanded="false" aria-haspopup="true" class="mobile-nav-link" href="#">
            المنصات والحلول
            <span aria-hidden="true">▾</span>
          </a>
          <div class="mobile-dropdown">
            <a class="dropdown-item" href="/frontend/pages/ai-bots/index.html">روبوتات الذكاء الاصطناعي</a>
            <a class="dropdown-item" href="/frontend/pages/our-products/index.html">منتجات وخدمات Bright AI</a>
            <a class="dropdown-item" href="/frontend/pages/tools/index.html">الأدوات الذكية</a>
            <a class="dropdown-item" href="/frontend/pages/what-is-ai/index.html">ما هو الذكاء الاصطناعي؟</a>
          </div>
        </li>

        <li>
          <a aria-expanded="false" aria-haspopup="true" class="mobile-nav-link" href="#">
            الشركة
            <span aria-hidden="true">▾</span>
          </a>
          <div class="mobile-dropdown">
            <a class="dropdown-item" href="/frontend/pages/about-us/index.html">من نحن</a>
            <a class="dropdown-item" href="/frontend/pages/contact/index.html">تواصل معنا</a>
            <a class="dropdown-item" href="/frontend/pages/blog/index.html">المكتبة الذكية</a>
            <a class="dropdown-item" href="/docs.html">المستندات</a>
          </div>
        </li>

        <li>
          <a class="mobile-nav-link" href="https://wa.me/966538229013" rel="noopener" target="_blank" style="color: var(--accent-color);">
            تواصل واتساب
          </a>
        </li>
      </ul>
    </div>

    <div class="backdrop-overlay"></div>
  `;
}

function ensureUnifiedNavStyles() {
  if (document.getElementById("bright-unified-nav-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "bright-unified-nav-style";
  style.textContent = `
    :root {
      --nav-height: 80px;
    }

    .unified-nav {
      position: fixed;
      inset: 0 0 auto 0;
      height: var(--nav-height);
      z-index: 1000;
      background: rgba(2, 6, 23, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      transition: transform 0.28s ease, background 0.28s ease;
    }

    .unified-nav.nav-hidden {
      transform: translateY(-100%);
    }

    .unified-nav.nav-scrolled {
      background: rgba(2, 6, 23, 0.94);
    }

    .nav-container {
      max-width: 1360px;
      height: 100%;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.85rem;
    }

    .nav-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: #ffffff;
      font-weight: 700;
      font-size: 1.1rem;
      white-space: nowrap;
    }

    .nav-logo img {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .nav-links {
      display: none;
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
      gap: 0.45rem;
    }

    .nav-item {
      position: relative;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      text-decoration: none;
      color: #cbd5e1;
      font-size: 0.92rem;
      font-weight: 500;
      padding: 0.58rem 0.82rem;
      border-radius: 0.6rem;
      transition: color 0.2s ease, background-color 0.2s ease;
    }

    .nav-link:hover,
    .nav-link.active,
    .nav-link[aria-expanded="true"] {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    .chevron-down {
      display: inline-flex;
      transition: transform 0.2s ease;
    }

    .nav-link[aria-expanded="true"] .chevron-down {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.45rem);
      right: 0;
      min-width: 275px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(15, 23, 42, 0.96);
      border-radius: 0.9rem;
      padding: 0.55rem;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
      z-index: 1005;
    }

    .nav-item:hover .dropdown-menu,
    .nav-link[aria-expanded="true"] + .dropdown-menu {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
    }

    .dropdown-item {
      display: block;
      text-decoration: none;
      color: #cbd5e1;
      border-radius: 0.7rem;
      padding: 0.6rem 0.75rem;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
    }

    .dropdown-item-content {
      display: flex;
      flex-direction: column;
      gap: 0.12rem;
    }

    .dropdown-title {
      font-size: 0.87rem;
      font-weight: 600;
    }

    .dropdown-desc {
      font-size: 0.77rem;
      color: #94a3b8;
      line-height: 1.5;
    }

    .nav-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      white-space: nowrap;
      border-radius: 999px;
      padding: 0.55rem 1rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      font-size: 0.87rem;
      font-weight: 700;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .nav-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
    }

    .mobile-toggle {
      display: inline-flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 0.7rem;
      background: transparent;
      cursor: pointer;
      color: #ffffff;
    }

    .mobile-toggle .bar {
      display: block;
      width: 22px;
      height: 2px;
      border-radius: 99px;
      background: currentColor;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .mobile-toggle[aria-expanded="true"] .bar:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }

    .mobile-toggle[aria-expanded="true"] .bar:nth-child(2) {
      opacity: 0;
    }

    .mobile-toggle[aria-expanded="true"] .bar:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    .mobile-menu-drawer {
      position: fixed;
      inset: 0 0 0 auto;
      width: min(86vw, 330px);
      z-index: 1002;
      padding: calc(var(--nav-height) + 0.7rem) 1rem 1.2rem;
      border-inline-start: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(2, 6, 23, 0.98);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow-y: auto;
      transform: translateX(102%);
      transition: transform 0.25s ease;
    }

    .mobile-menu-drawer.active {
      transform: translateX(0);
    }

    .mobile-nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .mobile-nav-link {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-decoration: none;
      color: #e2e8f0;
      border-radius: 0.7rem;
      padding: 0.7rem 0.6rem;
      font-size: 0.96rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .mobile-nav-link:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    .mobile-dropdown {
      display: none;
      margin: 0.3rem 0 0.5rem;
      padding: 0.4rem;
      border-radius: 0.8rem;
      background: rgba(255, 255, 255, 0.04);
      border-right: 2px solid rgba(99, 102, 241, 0.8);
    }

    .mobile-dropdown.open {
      display: block;
    }

    .mobile-dropdown .dropdown-item {
      margin-bottom: 0.3rem;
      font-size: 0.86rem;
    }

    .backdrop-overlay {
      position: fixed;
      inset: 0;
      z-index: 1001;
      background: rgba(0, 0, 0, 0.58);
      backdrop-filter: blur(2px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .backdrop-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    @media (min-width: 1024px) {
      .mobile-toggle {
        display: none;
      }

      .nav-links {
        display: inline-flex;
      }

      .mobile-menu-drawer {
        display: none;
      }

      .backdrop-overlay {
        display: none;
      }
    }
  `;

  document.head.appendChild(style);
}

function markActiveLinks() {
  const currentPath = normalizePathname(window.location.pathname);
  const navLinks = document.querySelectorAll(".unified-nav .nav-link[href], .mobile-menu-drawer a[href]");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("http")) {
      return;
    }

    const normalizedHref = normalizePathname(href);
    if (normalizedHref === currentPath) {
      link.classList.add("active");
      if (link.classList.contains("mobile-nav-link")) {
        link.style.color = "var(--accent-color)";
      }
    }
  });
}

function mountUnifiedNavigation() {
  ensureUnifiedNavStyles();

  document.getElementById("bright-unified-nav-root")?.remove();

  document
    .querySelectorAll(".unified-nav, .mobile-menu-drawer, .backdrop-overlay, .nav-overlay")
    .forEach((node) => node.remove());

  const root = document.createElement("div");
  root.id = "bright-unified-nav-root";
  root.innerHTML = buildUnifiedNavigationMarkup();

  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.insertAdjacentElement("afterend", root);
  } else {
    document.body.insertAdjacentElement("afterbegin", root);
  }

  const currentPath = normalizePathname(window.location.pathname);
  if (currentPath.startsWith("/frontend/pages/our-products")) {
    const productsHeader = document.querySelector("body > header.sticky");
    if (productsHeader) {
      productsHeader.style.top = "var(--nav-height)";
      productsHeader.style.zIndex = "40";
    }
  }

  markActiveLinks();
}

function ensureSearchScript() {
  const hasSearchScript = document.querySelector(
    "script[data-bright-search='true'], script[src='/frontend/js/search.js'], script[src$='/js/search.js'], script[src*='js/search.js']"
  );

  if (hasSearchScript) {
    return;
  }

  const script = document.createElement("script");
  script.src = "/frontend/js/search.js";
  script.defer = true;
  script.dataset.brightSearch = "true";
  document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
});

function initNavigation() {
  if (isTargetServicePage()) {
    mountUnifiedNavigation();
    ensureSearchScript();
  }

  const nav = document.querySelector(".unified-nav");
  if (!nav) {
    return;
  }

  const mobileToggles = document.querySelectorAll(".mobile-toggle");
  const mobileDrawer = document.querySelector(".mobile-menu-drawer");
  const backdrop = document.querySelector(".backdrop-overlay");
  const dropdownToggles = document.querySelectorAll('.nav-link[aria-haspopup="true"]');

  let lastScrollY = 0;
  let ticking = false;
  const SCROLL_THRESHOLD = 10;
  const HIDE_THRESHOLD = 400;

  function onScroll() {
    const currentY = window.scrollY;

    if (currentY > SCROLL_THRESHOLD) {
      nav.classList.add("nav-scrolled");
    } else {
      nav.classList.remove("nav-scrolled");
    }

    if (currentY > HIDE_THRESHOLD && currentY > lastScrollY + 5) {
      nav.classList.add("nav-hidden");
    } else if (currentY < lastScrollY - 5 || currentY <= SCROLL_THRESHOLD) {
      nav.classList.remove("nav-hidden");
    }

    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  onScroll();

  function openMobileMenu() {
    mobileToggles.forEach((toggle) => toggle.setAttribute("aria-expanded", "true"));
    if (mobileDrawer) {
      mobileDrawer.classList.add("active");
      mobileDrawer.setAttribute("aria-hidden", "false");
    }
    if (backdrop) {
      backdrop.classList.add("active");
    }
    document.body.style.overflow = "hidden";
  }

  function closeMobileMenu() {
    mobileToggles.forEach((toggle) => toggle.setAttribute("aria-expanded", "false"));
    if (mobileDrawer) {
      mobileDrawer.classList.remove("active");
      mobileDrawer.setAttribute("aria-hidden", "true");
    }
    if (backdrop) {
      backdrop.classList.remove("active");
    }
    document.body.style.overflow = "";
  }

  function toggleMobileMenu() {
    const isOpen = mobileDrawer && mobileDrawer.classList.contains("active");
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  mobileToggles.forEach((toggle) => {
    toggle.addEventListener("click", toggleMobileMenu);
  });

  if (backdrop) {
    backdrop.addEventListener("click", closeMobileMenu);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileDrawer && mobileDrawer.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  dropdownToggles.forEach((toggle) => {
    const navItem = toggle.closest(".nav-item");
    const dropdown = toggle.nextElementSibling;
    let closeTimer = null;

    const cancelClose = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const scheduleClose = () => {
      closeTimer = setTimeout(() => {
        if (toggle.getAttribute("aria-expanded") === "true") {
          toggle.setAttribute("aria-expanded", "false");
        }
      }, 320);
    };

    if (navItem && dropdown) {
      navItem.addEventListener("mouseenter", () => {
        if (window.innerWidth >= 1024) {
          cancelClose();
          toggle.setAttribute("aria-expanded", "true");
        }
      });

      navItem.addEventListener("mouseleave", () => {
        if (window.innerWidth >= 1024) {
          scheduleClose();
        }
      });

      dropdown.addEventListener("mouseenter", () => {
        if (window.innerWidth >= 1024) {
          cancelClose();
        }
      });

      dropdown.addEventListener("mouseleave", () => {
        if (window.innerWidth >= 1024) {
          scheduleClose();
        }
      });
    }

    toggle.addEventListener("click", (event) => {
      if (window.innerWidth >= 1024) {
        event.preventDefault();
        const expanded = toggle.getAttribute("aria-expanded") === "true";

        dropdownToggles.forEach((item) => item.setAttribute("aria-expanded", "false"));
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      }
    });

    toggle.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      }
    });
  });

  const mobileDropdownToggles = document.querySelectorAll('.mobile-nav-link[aria-haspopup="true"]');
  mobileDropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const submenu = toggle.nextElementSibling;
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";

      if (!isExpanded) {
        mobileDropdownToggles.forEach((otherToggle) => {
          if (otherToggle !== toggle) {
            otherToggle.setAttribute("aria-expanded", "false");
            const otherSubmenu = otherToggle.nextElementSibling;
            if (otherSubmenu && otherSubmenu.classList.contains("mobile-dropdown")) {
              otherSubmenu.classList.remove("open");
            }
          }
        });
      }

      toggle.setAttribute("aria-expanded", isExpanded ? "false" : "true");
      if (submenu && submenu.classList.contains("mobile-dropdown")) {
        submenu.classList.toggle("open", !isExpanded);
      }
    });
  });

  if (mobileDrawer) {
    mobileDrawer.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      link.addEventListener("click", () => {
        setTimeout(closeMobileMenu, 150);
      });
    });
  }
}
