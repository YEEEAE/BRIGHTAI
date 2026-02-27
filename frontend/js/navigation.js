/**
 * Bright AI - Unified Navigation Controller
 * Injects the exact same header + search bar from index.html into all project HTML pages.
 * Handles scroll behavior, mobile drawer, dropdowns, and search integration.
 */

/* ── Scope & Path Utilities ── */
const EXCLUDED_PATH_PREFIXES = [
  "/dashboard",
  "/agents",
  "/templates",
  "/analytics",
  "/settings",
  "/marketplace"
];

/* ── Path Utilities ── */
function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function isTargetServicePage(pathname = window.location.pathname) {
  if (document.documentElement?.getAttribute("data-unified-nav") === "off") return false;
  if (document.body?.hasAttribute("data-unified-nav-off")) return false;

  const currentPath = normalizePathname(pathname);
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`))) {
    return false;
  }

  const hasSpaRootOnly = Boolean(document.getElementById("root")) && !document.querySelector("main, article, section, [role='main']");
  if (hasSpaRootOnly && !currentPath.includes("/frontend/pages/")) return false;

  if (currentPath.includes("/frontend/pages/")) return true;
  if (currentPath === "/" || currentPath.endsWith(".html")) return true;
  if (currentPath.includes("404") || currentPath.includes("500")) return true;

  return false;
}

/* ── Tailwind & Iconify Loader ── */
function ensureDependencies() {
  if (!document.querySelector('script[src*="iconify"]') && !window.Iconify) {
    const s = document.createElement("script");
    s.src = "https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js";
    s.defer = true;
    document.head.appendChild(s);
  }

  // Ensure tailwind is loaded for the injected classes if not present
  const hasTailwind = document.querySelector('link[href*="tailwind"], link[href*="main.bundle.css"], script[src*="tailwindcss"]');
  if (!hasTailwind) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/frontend/css/tailwind.local.min.css";
    document.head.appendChild(link);
  }
}

/* ── Build Navigation HTML (index.html is source of truth) ── */
const INDEX_NAV_FETCH_PATH = "/index.html";
const INDEX_NAV_SELECTORS = {
  header: "#main-header",
  drawer: "#mobileDrawer",
  backdrop: ".backdrop-overlay"
};
let cachedUnifiedNavigationMarkup = null;

const FOOTER_STANDARDIZATION_PATH_PREFIXES = [
  "/frontend/pages/about-us",
  "/frontend/pages/ai-agent",
  "/frontend/pages/ai-bots",
  "/frontend/pages/smart-automation",
  "/frontend/pages/ai-workflows",
  "/frontend/pages/data-analysis",
  "/frontend/pages/consultation",
  "/frontend/pages/contact",
  "/frontend/pages/blog",
  "/frontend/pages/docs",
  "/frontend/pages/privacy-cookies",
  "/frontend/pages/what-is-ai",
  "/frontend/pages/blogger"
];

const UNIFIED_FOOTER_MARKUP = `
<footer class="border-t border-white/10 bg-black/40 pt-16 pb-8 px-6" id="main-footer">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
      <div>
        <div class="flex items-center gap-3 mb-5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center">
            <span class="text-white text-sm font-black">AI</span>
          </div>
          <span class="text-white font-semibold">Bright AI</span>
        </div>
        <p class="text-slate-400 text-sm leading-relaxed mb-5">
          حلول ذكاء اصطناعي مخصصة للسوق السعودي، تركيزنا على القيمة التشغيلية والامتثال.
        </p>
        <div class="flex gap-4">
          <a aria-label="واتساب" class="text-slate-400 hover:text-white transition" href="https://wa.me/966538229013">
            <iconify-icon icon="lucide:message-circle" width="20"></iconify-icon>
          </a>
          <a aria-label="البريد" class="text-slate-400 hover:text-white transition" href="mailto:yazeed1job@gmail.com">
            <iconify-icon icon="lucide:mail" width="20"></iconify-icon>
          </a>
          <a aria-label="تويتر" class="text-slate-400 hover:text-white transition" href="https://x.com/BrightAIII">
            <iconify-icon icon="lucide:twitter" width="20"></iconify-icon>
          </a>
        </div>
      </div>
      <div>
        <h4 class="text-white font-medium mb-6">الشركة</h4>
        <ul class="space-y-3 text-sm text-slate-400">
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/about-us/index.html">عن Bright AI</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/case-studies/index.html">قصص النجاح</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/partners/index.html">الشركاء والموزعين</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/contact/index.html">اتصل بنا</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/blog/index.html">المدونة</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-medium mb-6">خدماتنا</h4>
        <ul class="space-y-3 text-sm text-slate-400">
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/ai-agent/index.html">AIaaS</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/data-analysis/index.html">تحليل البيانات</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/smart-automation/index.html">الأتمتة الذكية</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/consultation/index.html">الاستشارات</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-medium mb-6">الموارد</h4>
        <ul class="space-y-3 text-sm text-slate-400">
          <li><a class="hover:text-gold-400 transition" href="/docs.html">الوثائق</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/demo/pricing/index.html">الأسعار</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/sitemap/index.html">خريطة الموقع</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/tools/index.html">أدوات مجانية</a></li>
          <li><a class="hover:text-gold-400 transition" href="/frontend/pages/privacy-cookies/index.html">سياسة الخصوصية</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600 gap-4">
      <p>© 2026 Bright AI. جميع الحقوق محفوظة.</p>
      <div class="flex gap-6">
        <a class="hover:text-slate-400 transition" href="/frontend/pages/privacy-cookies/index.html">سياسة الخصوصية</a>
        <a class="hover:text-slate-400 transition" href="/frontend/pages/docs/terms-and-conditions.html">الشروط والأحكام</a>
      </div>
    </div>
  </div>
</footer>
`;

function buildUnifiedNavigationMarkupFallback() {
  return `
    <header class="unified-nav" id="main-header" role="banner">
      <div class="nav-container">
        <a class="nav-logo" href="/index.html" aria-label="Bright AI">Bright AI</a>
        <nav class="nav-desktop">
          <ul class="nav-links">
            <li><a class="nav-link" href="/index.html">الرئيسية</a></li>
            <li class="nav-item">
              <button aria-expanded="false" aria-haspopup="true" class="nav-link">الخدمات <span aria-hidden="true">▾</span></button>
              <div class="dropdown-menu">
                <a class="block px-3 py-2 rounded-lg hover:bg-white/5 transition" href="/frontend/pages/ai-agent/index.html">
                  <strong class="block text-white text-sm flex items-center gap-2"><iconify-icon icon="lucide:cpu" width="14"></iconify-icon> AI Agent</strong>
                  <span class="block text-slate-400 text-xs mt-1">وكلاء ذكية لتشغيل الأعمال</span>
                </a>
                <a class="block px-3 py-2 rounded-lg hover:bg-white/5 transition" href="/frontend/pages/smart-automation/index.html">
                  <strong class="block text-white text-sm flex items-center gap-2"><iconify-icon icon="lucide:workflow" width="14"></iconify-icon> الأتمتة الذكية</strong>
                  <span class="block text-slate-400 text-xs mt-1">خفض التكاليف وتسريع سير العمل</span>
                </a>
                <a class="block px-3 py-2 rounded-lg hover:bg-white/5 transition" href="/frontend/pages/data-analysis/index.html">
                  <strong class="block text-white text-sm flex items-center gap-2"><iconify-icon icon="lucide:line-chart" width="14"></iconify-icon> تحليل البيانات</strong>
                  <span class="block text-slate-400 text-xs mt-1">لوحات KPI ورؤى تشغيلية</span>
                </a>
                <a class="block px-3 py-2 rounded-lg hover:bg-white/5 transition" href="/frontend/pages/consultation/index.html">
                  <strong class="block text-white text-sm flex items-center gap-2"><iconify-icon icon="lucide:briefcase-business" width="14"></iconify-icon> الاستشارات</strong>
                  <span class="block text-slate-400 text-xs mt-1">خارطة تنفيذ مخصصة للمؤسسة</span>
                </a>
              </div>
            </li>
            <li><a class="nav-link" href="/frontend/pages/our-products/index.html">الحلول</a></li>
            <li><a class="nav-link" href="/frontend/pages/blog/index.html">المدونة</a></li>
            <li><a class="nav-link" href="/frontend/pages/demo/pricing/index.html">الأسعار</a></li>
            <li><a class="nav-link" href="/frontend/pages/contact/index.html">اتصل بنا</a></li>
          </ul>
        </nav>
        <div class="nav-actions">
          <button aria-expanded="false" aria-label="فتح القائمة" class="mobile-toggle">
            <span class="bar"></span><span class="bar"></span><span class="bar"></span>
          </button>
        </div>
      </div>
    </header>
    <div class="mobile-menu-drawer" id="mobileDrawer" aria-hidden="true">
      <ul class="mobile-nav-list" style="list-style:none; padding:1.25rem; margin:0;">
        <li><a class="mobile-nav-link" href="/index.html">الرئيسية</a></li>
        <li>
          <button class="mobile-nav-link" aria-haspopup="true" aria-expanded="false" type="button" style="width:100%;text-align:right;background:none;border:0;padding:.65rem 0;color:#cbd5e1;cursor:pointer;">الخدمات</button>
          <ul class="mobile-dropdown" style="list-style:none; margin:0; padding:0.35rem;">
            <li><a class="mobile-nav-link" href="/frontend/pages/ai-agent/index.html">AI Agent</a></li>
            <li><a class="mobile-nav-link" href="/frontend/pages/smart-automation/index.html">الأتمتة الذكية</a></li>
            <li><a class="mobile-nav-link" href="/frontend/pages/data-analysis/index.html">تحليل البيانات</a></li>
            <li><a class="mobile-nav-link" href="/frontend/pages/consultation/index.html">الاستشارات</a></li>
          </ul>
        </li>
        <li><a class="mobile-nav-link" href="/frontend/pages/our-products/index.html">الحلول</a></li>
        <li><a class="mobile-nav-link" href="/frontend/pages/blog/index.html">المدونة</a></li>
        <li><a class="mobile-nav-link" href="/frontend/pages/demo/pricing/index.html">الأسعار</a></li>
        <li><a class="mobile-nav-link" href="/frontend/pages/contact/index.html">اتصل بنا</a></li>
      </ul>
    </div>
    <div class="backdrop-overlay"></div>
  `;
}

function extractUnifiedNavigationMarkupFromDocument(sourceDocument) {
  if (!sourceDocument) return null;

  const header = sourceDocument.querySelector(INDEX_NAV_SELECTORS.header);
  const drawer = sourceDocument.querySelector(INDEX_NAV_SELECTORS.drawer);
  if (!header || !drawer) return null;

  const backdropCandidates = [
    drawer.nextElementSibling,
    sourceDocument.querySelector(".backdrop-overlay.fixed.inset-0.z-50.bg-black\\/60.backdrop-blur-sm.hidden"),
    sourceDocument.querySelector(INDEX_NAV_SELECTORS.backdrop)
  ];
  const backdrop = backdropCandidates.find((candidate) => candidate && candidate.classList?.contains("backdrop-overlay"));
  if (!backdrop) return null;

  return `${header.outerHTML}\n${drawer.outerHTML}\n${backdrop.outerHTML}`;
}

async function buildUnifiedNavigationMarkup() {
  if (cachedUnifiedNavigationMarkup) {
    return cachedUnifiedNavigationMarkup;
  }

  try {
    const response = await fetch(INDEX_NAV_FETCH_PATH, {
      credentials: "same-origin",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Navigation source fetch failed: ${response.status}`);
    }

    const sourceHtml = await response.text();
    const parser = new DOMParser();
    const sourceDocument = parser.parseFromString(sourceHtml, "text/html");
    const extractedMarkup = extractUnifiedNavigationMarkupFromDocument(sourceDocument);

    if (extractedMarkup) {
      cachedUnifiedNavigationMarkup = extractedMarkup;
      return extractedMarkup;
    }
  } catch (error) {
    console.warn("[BrightAI Nav] Using fallback navigation markup.", error);
  }

  cachedUnifiedNavigationMarkup = buildUnifiedNavigationMarkupFallback();
  return cachedUnifiedNavigationMarkup;
}

/* ── Shared Design System Loader ── */
function ensureStylesheet(href, id) {
  if (document.getElementById(id) || document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function ensureUnifiedDesignSystem() {
  ensureStylesheet("/frontend/css/index-theme.css", "bright-index-theme");
  ensureStylesheet("/frontend/css/unified-nav-search.css", "bright-unified-nav-style");
}

/* ── Mark Active Links ── */
function markActiveLinks() {
  const currentPath = normalizePathname(window.location.pathname);
  const navLinks = document.querySelectorAll(".unified-nav .nav-link[href], .mobile-menu-drawer a[href]");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#" || href.startsWith("http")) return;
    const normalizedHref = normalizePathname(href);
    if (normalizedHref === currentPath || (currentPath.endsWith(normalizedHref) && normalizedHref !== "/")) {
      link.classList.add("active");
      if (link.closest(".mobile-menu-drawer")) {
        link.style.color = "#818cf8";
        link.style.background = "rgba(99, 102, 241, 0.08)";
      }
    }
  });
}

function isLikelyLegacyTopNavigation(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.closest("#bright-unified-nav-root")) return false;
  if (node.classList.contains("hero-section")) return false;

  if (
    node.matches(
      ".unified-nav, #main-header, nav.unified-nav, .mobile-menu-drawer, #mobileDrawer, .backdrop-overlay, .nav-overlay"
    )
  ) {
    return true;
  }

  const tag = node.tagName.toLowerCase();
  if (tag !== "header" && tag !== "nav") return false;

  const role = (node.getAttribute("role") || "").toLowerCase();
  const identity = `${node.className || ""} ${node.id || ""}`.toLowerCase();
  const classHint = /(nav|navbar|menu|topbar|appbar|header|site-nav|site-header|mobile-menu|drawer)/.test(identity);
  const hasNavInternals = Boolean(
    node.querySelector(
      ".mobile-toggle, .nav-links, .nav-actions, .menu-toggle, .hamburger, .sidebar-nav, .nav-tabs, [aria-label*='القائمة'], [aria-label*='menu']"
    )
  );
  const isLandmark = role === "banner" || role === "navigation";

  const styles = window.getComputedStyle(node);
  const position = styles.position;
  const topValue = Number.parseFloat(styles.top || "0");
  const nearTopByStyle = Number.isFinite(topValue) ? topValue <= 120 : true;
  const nearTopByRect = node.getBoundingClientRect().top <= 120;

  if ((position === "fixed" || position === "sticky") && nearTopByStyle && (isLandmark || classHint || hasNavInternals)) {
    return true;
  }

  if ((isLandmark || classHint) && hasNavInternals && nearTopByRect) {
    return true;
  }

  if (classHint && nearTopByRect && node.querySelector("a[href]")) {
    return true;
  }

  return false;
}

/* ── Mount Unified Navigation ── */
async function mountUnifiedNavigation() {
  ensureUnifiedDesignSystem();
  ensureDependencies();

  // Remove any existing nav elements
  document.getElementById("bright-unified-nav-root")?.remove();
  document.querySelectorAll(
    "header, nav, .unified-nav, #main-header, .mobile-menu-drawer, #mobileDrawer, .backdrop-overlay, .nav-overlay"
  ).forEach((node) => {
    if (isLikelyLegacyTopNavigation(node)) {
      node.remove();
    }
  });

  const root = document.createElement("div");
  root.id = "bright-unified-nav-root";
  root.innerHTML = await buildUnifiedNavigationMarkup();

  // Insert at top of body
  const firstChild = document.body.firstElementChild;
  if (firstChild) {
    document.body.insertBefore(root, firstChild);
  } else {
    document.body.appendChild(root);
  }

  // Push down content that was behind the old nav
  const currentPath = normalizePathname(window.location.pathname);
  if (currentPath.includes("/frontend/pages/our-products")) {
    const productsHeader = document.querySelector("body > header.sticky");
    if (productsHeader) {
      productsHeader.style.top = "var(--nav-height)";
      productsHeader.style.zIndex = "40";
    }
  }

  markActiveLinks();
}

/* ── Ensure search.js is loaded ── */
function ensureSearchScript() {
  const hasSearchScript = document.querySelector(
    "script[data-bright-search='true'], script[src='/frontend/js/search.js'], script[src$='/js/search.js'], script[src*='js/search.js']"
  );
  if (hasSearchScript) return;

  const script = document.createElement("script");
  script.src = "/frontend/js/search.js";
  script.defer = true;
  script.dataset.brightSearch = "true";
  document.head.appendChild(script);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

const prefetchedLinks = new Set();

function prefetchLink(href) {
  if (!href || prefetchedLinks.has(href)) return;
  prefetchedLinks.add(href);

  const prefetch = document.createElement("link");
  prefetch.rel = "prefetch";
  prefetch.as = "document";
  prefetch.href = href;
  prefetch.crossOrigin = "anonymous";
  document.head.appendChild(prefetch);
}

function setupNavigationPrefetch() {
  const shouldSkipPrefetch = window.matchMedia && window.matchMedia("(prefers-reduced-data: reduce)").matches;
  if (shouldSkipPrefetch) return;

  const prefetchFromAnchor = (anchor) => {
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (anchor.hasAttribute("download") || anchor.target === "_blank") return;

    const resolved = new URL(href, window.location.origin);
    if (resolved.origin !== window.location.origin) return;
    prefetchLink(resolved.pathname + resolved.search);
  };

  const onPointer = (event) => {
    const anchor = event.target?.closest?.("a[href]");
    prefetchFromAnchor(anchor);
  };

  document.addEventListener("mouseover", onPointer, { passive: true });
  document.addEventListener("focusin", onPointer);
}

function isFooterStandardizationTarget(pathname = window.location.pathname) {
  const currentPath = normalizePathname(pathname);
  return FOOTER_STANDARDIZATION_PATH_PREFIXES.some((prefix) => {
    return currentPath === prefix || currentPath.startsWith(`${prefix}/`) || currentPath.startsWith(`${prefix}.html`);
  });
}

function mountUnifiedFooter() {
  if (!isFooterStandardizationTarget()) return;
  if (document.getElementById("bright-unified-footer-root")) return;

  const root = document.createElement("div");
  root.id = "bright-unified-footer-root";
  root.innerHTML = UNIFIED_FOOTER_MARKUP;

  const legacyFooters = Array.from(document.querySelectorAll("footer")).filter(
    (node) => !node.closest("#bright-unified-footer-root")
  );

  if (legacyFooters.length) {
    const anchorFooter = legacyFooters[0];
    const parent = anchorFooter.parentNode;
    const nextNode = anchorFooter.nextSibling;
    legacyFooters.forEach((footerNode) => footerNode.remove());
    if (parent) {
      parent.insertBefore(root, nextNode);
      return;
    }
  }

  const insertionAnchor = Array.from(document.body.children).find((node) => node.tagName === "SCRIPT");
  if (insertionAnchor) {
    document.body.insertBefore(root, insertionAnchor);
    return;
  }

  document.body.appendChild(root);
}

/* ── Blog Reading Time ── */
function injectBlogReadingTime() {
  const path = normalizePathname(window.location.pathname);
  const isRootBlogArticle = path.startsWith("/blog/") && path !== "/blog/index" && path !== "/blog/index.html";
  const isFrontendBloggerArticle = path.startsWith("/frontend/pages/blogger/");
  const isFrontendBlogArticle =
    path.startsWith("/frontend/pages/blog/") &&
    path !== "/frontend/pages/blog/index" &&
    path !== "/frontend/pages/blog/index.html";
  const isDocsArticlePath =
    path.startsWith("/frontend/pages/docs/") &&
    !path.endsWith("/docs.html") &&
    !path.endsWith("/contact.html") &&
    !path.endsWith("/contact-en.html");
  const isBlogArticlePath = isRootBlogArticle || isFrontendBloggerArticle || isFrontendBlogArticle || isDocsArticlePath;

  if (!isBlogArticlePath) return;

  const articleEl = document.querySelector("article") || document.querySelector("main .doc-content") || document.querySelector("main");
  if (!articleEl) return;

  const text = (articleEl.innerText || "").replace(/\s+/g, " ").trim();
  if (!text) return;

  const words = text.split(" ").length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  const label = `وقت القراءة: ${minutes} دقائق`;

  const existingSlot = document.querySelector("[data-reading-time-slot]");
  if (existingSlot) {
    existingSlot.textContent = label;
    return;
  }

  const title = document.querySelector("h1");
  if (!title) return;

  const badge = document.createElement("div");
  badge.className = "mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-slate-300 text-sm";
  badge.setAttribute("data-reading-time-slot", "true");
  badge.innerHTML = `<iconify-icon icon="lucide:clock-3" width="15"></iconify-icon><span>${label}</span>`;
  title.insertAdjacentElement("afterend", badge);
}

let uxEnhancerLoadPromise = null;
const UX_ENHANCER_SCRIPT_PATH = "/frontend/js/article-ux-enhancements.js";
let pageEnhancerLoadPromise = null;
const PAGE_ENHANCER_SCRIPT_PATH = "/frontend/js/page-enhancements.js";

function loadUxEnhancerScript() {
  if (window.BrightUXEnhancer) return Promise.resolve(window.BrightUXEnhancer);
  if (uxEnhancerLoadPromise) return uxEnhancerLoadPromise;

  uxEnhancerLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${UX_ENHANCER_SCRIPT_PATH}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.BrightUXEnhancer || null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = UX_ENHANCER_SCRIPT_PATH;
    script.defer = true;
    script.dataset.brightUxEnhancer = "true";
    script.addEventListener("load", () => resolve(window.BrightUXEnhancer || null), { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });
    document.head.appendChild(script);
  });

  return uxEnhancerLoadPromise;
}

function loadPageEnhancerScript() {
  if (window.BrightPageEnhancer) return Promise.resolve(window.BrightPageEnhancer);
  if (pageEnhancerLoadPromise) return pageEnhancerLoadPromise;

  pageEnhancerLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${PAGE_ENHANCER_SCRIPT_PATH}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.BrightPageEnhancer || null), { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PAGE_ENHANCER_SCRIPT_PATH;
    script.defer = true;
    script.dataset.brightPageEnhancer = "true";
    script.addEventListener("load", () => resolve(window.BrightPageEnhancer || null), { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });
    document.head.appendChild(script);
  });

  return pageEnhancerLoadPromise;
}

async function applyPageEnhancements() {
  const enhancer = window.BrightPageEnhancer || await loadPageEnhancerScript();
  if (!enhancer || typeof enhancer.apply !== "function") return;

  enhancer.apply({
    normalizePathname
  });
}

async function applyArticleUxEnhancements() {
  injectBlogReadingTime();
  optimizeImagesForCWV();

  const enhancer = window.BrightUXEnhancer || await loadUxEnhancerScript();
  if (!enhancer || typeof enhancer.apply !== "function") return;

  enhancer.apply({
    normalizePathname
  });
}

function ensureNavScrollProgress(navElement) {
  if (!navElement) return null;
  let indicator = navElement.querySelector(".nav-scroll-progress");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.className = "nav-scroll-progress";
    indicator.setAttribute("aria-hidden", "true");
    navElement.appendChild(indicator);
  }
  return indicator;
}

/* ── Core Web Vitals Helpers ── */
function optimizeImagesForCWV() {
  const images = Array.from(document.querySelectorAll("img"));
  if (!images.length) return;

  images.forEach((img, index) => {
    if (!img.hasAttribute("decoding")) img.decoding = "async";
    if (!img.hasAttribute("loading") && index > 0) img.loading = "lazy";
    if (!img.hasAttribute("fetchpriority")) {
      img.setAttribute("fetchpriority", index === 0 ? "high" : "auto");
    }

    const setIntrinsicSize = () => {
      if (!img.hasAttribute("width") && img.naturalWidth) {
        img.setAttribute("width", String(img.naturalWidth));
      }
      if (!img.hasAttribute("height") && img.naturalHeight) {
        img.setAttribute("height", String(img.naturalHeight));
      }
    };

    if (img.complete) {
      setIntrinsicSize();
    } else {
      img.addEventListener("load", setIntrinsicSize, { once: true });
    }
  });
}

/* ── Init Navigation ── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void initNavigation();
  });
} else {
  // DOM is already ready
  void initNavigation();
}

async function initNavigation() {
  registerServiceWorker();
  setupNavigationPrefetch();

  if (isTargetServicePage()) {
    ensureUnifiedDesignSystem();
    ensureDependencies();
    ensureSearchScript();
    if (!document.querySelector(".unified-nav, #main-header")) {
      await mountUnifiedNavigation();
    }
    mountUnifiedFooter();
  }

  const nav = document.querySelector(".unified-nav, #main-header");
  if (!nav) {
    void applyArticleUxEnhancements();
    void applyPageEnhancements();
    return;
  }

  const mobileToggles = document.querySelectorAll(".mobile-toggle");
  const mobileDrawer = document.querySelector(".mobile-menu-drawer, #mobileDrawer");
  const backdrop = document.querySelector(".backdrop-overlay");
  const dropdownToggles = document.querySelectorAll('.nav-link[aria-haspopup="true"], button.nav-link[aria-haspopup="true"]');
  const navProgressIndicator = ensureNavScrollProgress(nav);

  let lastScrollY = 0;
  let ticking = false;
  const SCROLL_THRESHOLD = 10;
  const HIDE_THRESHOLD = 400;

  /* Scroll behavior */
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

    if (navProgressIndicator) {
      const maxScrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(100, (currentY / maxScrollable) * 100));
      navProgressIndicator.style.width = `${progress}%`;
    }

    lastScrollY = currentY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  onScroll();

  /* Mobile menu */
  function openMobileMenu() {
    mobileToggles.forEach((t) => t.setAttribute("aria-expanded", "true"));
    if (mobileDrawer) {
      mobileDrawer.classList.add("active");
      mobileDrawer.setAttribute("aria-hidden", "false");
    }
    if (backdrop) backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMobileMenu() {
    mobileToggles.forEach((t) => t.setAttribute("aria-expanded", "false"));
    if (mobileDrawer) {
      mobileDrawer.classList.remove("active");
      mobileDrawer.setAttribute("aria-hidden", "true");
    }
    if (backdrop) backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  function toggleMobileMenu() {
    const isOpen = mobileDrawer && mobileDrawer.classList.contains("active");
    isOpen ? closeMobileMenu() : openMobileMenu();
  }

  mobileToggles.forEach((toggle) => {
    toggle.addEventListener("click", toggleMobileMenu);
  });

  if (backdrop) backdrop.addEventListener("click", closeMobileMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileDrawer && mobileDrawer.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  /* Desktop dropdowns */
  dropdownToggles.forEach((toggle) => {
    const navItem = toggle.closest(".nav-item");
    const dropdown = toggle.nextElementSibling;
    let closeTimer = null;

    const cancelClose = () => { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } };
    const scheduleClose = () => {
      closeTimer = setTimeout(() => {
        if (toggle.getAttribute("aria-expanded") === "true") {
          toggle.setAttribute("aria-expanded", "false");
        }
      }, 320);
    };

    if (navItem && dropdown) {
      navItem.addEventListener("mouseenter", () => {
        if (window.innerWidth >= 1024) { cancelClose(); toggle.setAttribute("aria-expanded", "true"); }
      });
      navItem.addEventListener("mouseleave", () => {
        if (window.innerWidth >= 1024) scheduleClose();
      });
      dropdown.addEventListener("mouseenter", () => {
        if (window.innerWidth >= 1024) cancelClose();
      });
      dropdown.addEventListener("mouseleave", () => {
        if (window.innerWidth >= 1024) scheduleClose();
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

  /* Mobile dropdowns */
  const mobileDropdownToggles = document.querySelectorAll('.mobile-nav-link[aria-haspopup="true"]');
  mobileDropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const submenu = toggle.nextElementSibling;
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";

      if (!isExpanded) {
        mobileDropdownToggles.forEach((other) => {
          if (other !== toggle) {
            other.setAttribute("aria-expanded", "false");
            const otherSub = other.nextElementSibling;
            if (otherSub && otherSub.classList.contains("mobile-dropdown")) {
              otherSub.classList.remove("open");
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

  /* Close mobile menu on link click */
  if (mobileDrawer) {
    mobileDrawer.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      link.addEventListener("click", () => { setTimeout(closeMobileMenu, 150); });
    });
  }

  void applyArticleUxEnhancements();
  void applyPageEnhancements();
}
