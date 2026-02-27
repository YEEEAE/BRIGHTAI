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
    <!-- Header / Navbar (Unified - mirrors index.html) -->
    <header class="unified-nav" id="main-header" role="banner">
        <div class="nav-container">
            <!-- Branding -->
            <div class="flex-shrink-0">
                <a aria-label="Bright AI — الصفحة الرئيسية" class="nav-logo group" href="/index.html"
                    title="الرئيسية — Bright AI حلول ذكاء اصطناعي">
                    <div
                        class="logo-box relative w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500">
                        <span class="text-white font-black text-lg tracking-tighter">AI</span>
                    </div>
                    <div class="flex flex-col leading-none">
                        <span
                            class="text-lg font-black tracking-tight text-white group-hover:text-indigo-400 transition-colors">Bright<span
                                class="text-indigo-400 group-hover:text-white transition-colors">AI</span></span>
                        <span class="text-[9px] font-bold text-slate-500 tracking-[0.18em] uppercase">Saudi</span>
                    </div>
                </a>
            </div>
            <!-- Main Navigation -->
            <nav class="nav-desktop" style="contain: layout;">
                <ul class="nav-links">
                    <li class="nav-item">
                        <a class="nav-link" href="/index.html">الرئيسية</a>
                    </li>
                    <!-- Smart Solutions Dropdown -->
                    <li class="nav-item group/dropdown relative">
                        <button aria-expanded="false" aria-haspopup="true" class="nav-link flex items-center gap-1.5">
                            الحلول الذكية
                            <iconify-icon class="chevron-down text-xs opacity-60"
                                icon="lucide:chevron-down"></iconify-icon>
                        </button>
                        <div
                            class="dropdown-menu absolute top-full right-0 mt-2 w-72 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 transform origin-top-right z-50">
                            <div class="p-2 space-y-1">
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/our-products/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover/item:text-rose-300 transition-colors">
                                            <iconify-icon icon="lucide:cpu" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-rose-400 transition-colors">
                                                منصة Bright AI Agents</div>
                                            <div class="text-xs text-slate-400">بناء وإدارة الوكلاء الأذكياء</div>
                                        </div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/smart-automation/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/item:text-indigo-300 transition-colors">
                                            <iconify-icon icon="lucide:workflow" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-indigo-400 transition-colors">
                                                الأتمتة الذكية</div>
                                            <div class="text-xs text-slate-400">وسير العمل المتقدم</div>
                                        </div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/ai-agent/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover/item:text-purple-300 transition-colors">
                                            <iconify-icon icon="lucide:bot" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-purple-400 transition-colors">
                                                AIaaS</div>
                                            <div class="text-xs text-slate-400">الذكاء الاصطناعي كخدمة</div>
                                        </div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/contact/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover/item:text-amber-300 transition-colors">
                                            <iconify-icon icon="lucide:users" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-amber-400 transition-colors">
                                                استشارات</div>
                                            <div class="text-xs text-slate-400">حلول مخصصة لشركتك</div>
                                        </div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/data-analysis/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/item:text-emerald-300 transition-colors">
                                            <iconify-icon icon="lucide:bar-chart-3" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-emerald-400 transition-colors">
                                                تحليل البيانات</div>
                                            <div class="text-xs text-slate-400">رؤى دقيقة وقرارات ذكية</div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </li>
                    <!-- Smart Models Dropdown -->
                    <li class="nav-item group/dropdown relative">
                        <button aria-expanded="false" aria-haspopup="true" class="nav-link flex items-center gap-1.5">
                            النماذج الذكية
                            <iconify-icon class="chevron-down text-xs opacity-60"
                                icon="lucide:chevron-down"></iconify-icon>
                        </button>
                        <div
                            class="dropdown-menu absolute top-full right-0 mt-2 w-72 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 transform origin-top-right z-50">
                            <div class="p-2 space-y-1">
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/smart-medical-archive/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover/item:text-teal-300 transition-colors">
                                            <iconify-icon icon="lucide:hospital" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-teal-400 transition-colors">
                                                الأرشيف الطبي الذكي</div>
                                        </div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/job.MAISco/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover/item:text-green-300 transition-colors">
                                            <iconify-icon icon="lucide:briefcase" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-green-400 transition-colors">
                                                منصة التوظيف الذكي</div>
                                        </div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/ai-scolecs/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover/item:text-violet-300 transition-colors">
                                            <iconify-icon icon="lucide:graduation-cap" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-violet-400 transition-colors">
                                                المنصة التعليمية الذكية</div>
                                        </div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/health-bright/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover/item:text-cyan-300 transition-colors">
                                            <iconify-icon icon="lucide:heart-pulse" width="18"></iconify-icon>
                                        </div>
                                        <div>
                                            <div
                                                class="text-sm font-semibold text-white group-hover/item:text-cyan-400 transition-colors">
                                                حلول AI الطبية المتقدمة</div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </li>
                    <!-- About Bright Dropdown -->
                    <li class="nav-item group/dropdown relative">
                        <button aria-expanded="false" aria-haspopup="true" class="nav-link flex items-center gap-1.5">
                            عن برايت
                            <iconify-icon class="chevron-down text-xs opacity-60"
                                icon="lucide:chevron-down"></iconify-icon>
                        </button>
                        <div
                            class="dropdown-menu absolute top-full right-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 transform origin-top-right z-50">
                            <div class="p-2 space-y-1">
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/about-us/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/item:text-blue-300 transition-colors">
                                            <iconify-icon icon="lucide:info" width="18"></iconify-icon>
                                        </div>
                                        <div
                                            class="text-sm font-semibold text-white group-hover/item:text-blue-400 transition-colors">
                                            عن برايت</div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/docs/docs.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 group-hover/item:text-slate-300 transition-colors">
                                            <iconify-icon icon="lucide:file-text" width="18"></iconify-icon>
                                        </div>
                                        <div
                                            class="text-sm font-semibold text-white group-hover/item:text-slate-400 transition-colors">
                                            المستندات</div>
                                    </div>
                                </a>
                                <a class="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group/item"
                                    href="/frontend/pages/blog/index.html">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover/item:text-pink-300 transition-colors">
                                            <iconify-icon icon="lucide:library" width="18"></iconify-icon>
                                        </div>
                                        <div
                                            class="text-sm font-semibold text-white group-hover/item:text-pink-400 transition-colors">
                                            المكتبة الذكية</div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
            <!-- Secondary Actions -->
            <div class="nav-actions">
                <!-- Desktop Search -->
                <button aria-label="البحث في الموقع" class="search-trigger search-desktop">
                    <iconify-icon class="text-base text-slate-500 group-hover:text-indigo-400 transition-colors"
                        icon="lucide:search"></iconify-icon>
                    <span class="text-[13px] font-medium">بحث...</span>
                    <kbd class="search-kbd">⌘K</kbd>
                </button>
                <!-- Mobile Search -->
                <button aria-label="البحث في الموقع" class="mobile-search-btn search-mobile">
                    <iconify-icon icon="lucide:search" width="18"></iconify-icon>
                </button>
                <!-- Desktop CTA -->
                <a aria-label="ابدأ رحلة التحول عبر الواتساب" class="nav-cta nav-cta-desktop"
                    href="https://wa.me/966538229013" rel="noopener noreferrer" target="_blank"
                    title="تواصل معنا عبر الواتساب">
                    <iconify-icon icon="lucide:message-circle" width="16"></iconify-icon>
                    ابدأ رحلة التحول
                </a>
                <!-- Mobile Toggle -->
                <button aria-expanded="false" aria-label="فتح القائمة" class="mobile-toggle">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </button>
            </div>
        </div>
    </header>
    <!-- Mobile Drawer -->
    <div class="mobile-menu-drawer" id="mobileDrawer">
        <div class="flex flex-col h-full" style="padding: calc(var(--nav-height) + 1.5rem) 1.75rem 2rem;">
            <!-- Drawer Header -->
            <div class="flex items-center justify-between mb-8 pb-6"
                style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <div class="flex items-center gap-2.5">
                    <div
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                        <span class="text-white font-black text-sm">AI</span>
                    </div>
                    <span class="text-base font-bold text-white">القائمة</span>
                </div>
                <button aria-label="إغلاق القائمة"
                    class="mobile-toggle w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
                    <iconify-icon class="text-slate-300 text-lg" icon="lucide:x"></iconify-icon>
                </button>
            </div>
            <!-- Nav Links -->
            <ul class="mobile-nav-list space-y-1 flex-1" style="list-style:none; padding:0; margin:0;">
                <li>
                    <a class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-200 hover:bg-white/[0.05] hover:text-white transition-all"
                        href="/index.html">
                        <iconify-icon class="text-slate-500" icon="lucide:home" width="18"></iconify-icon>
                        الرئيسية
                    </a>
                </li>
                <li>
                    <a aria-expanded="false" aria-haspopup="true"
                        class="mobile-nav-link flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-200 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
                        href="#">
                        <span class="flex items-center gap-3">
                            <iconify-icon class="text-slate-500" icon="lucide:layers" width="18"></iconify-icon>
                            الحلول والخدمات
                        </span>
                        <iconify-icon class="text-slate-600 text-sm" icon="lucide:chevron-down"></iconify-icon>
                    </a>
                    <div class="mobile-dropdown mt-1 mr-6"
                        style="padding-right: 1rem; border-right: 2px solid rgba(99,102,241,0.2);">
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/[0.06] transition-all"
                            href="/frontend/pages/our-products/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:cpu" width="15"></iconify-icon>
                            منصة Bright AI Agents
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/[0.06] transition-all"
                            href="/frontend/pages/smart-automation/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:workflow" width="15"></iconify-icon>
                            الأتمتة الذكية
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/[0.06] transition-all"
                            href="/frontend/pages/ai-agent/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:bot" width="15"></iconify-icon>
                            AIaaS — الذكاء كخدمة
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/[0.06] transition-all"
                            href="/frontend/pages/data-analysis/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:bar-chart-3" width="15"></iconify-icon>
                            تحليل البيانات
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/[0.06] transition-all"
                            href="/frontend/pages/contact/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:users" width="15"></iconify-icon>
                            استشارات
                        </a>
                    </div>
                </li>
                <li>
                    <a aria-expanded="false" aria-haspopup="true"
                        class="mobile-nav-link flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-200 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
                        href="#">
                        <span class="flex items-center gap-3">
                            <iconify-icon class="text-slate-500" icon="lucide:sparkles" width="18"></iconify-icon>
                            النماذج الذكية
                        </span>
                        <iconify-icon class="text-slate-600 text-sm" icon="lucide:chevron-down"></iconify-icon>
                    </a>
                    <div class="mobile-dropdown mt-1 mr-6"
                        style="padding-right: 1rem; border-right: 2px solid rgba(16,185,129,0.2);">
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/[0.06] transition-all"
                            href="/frontend/pages/smart-medical-archive/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:hospital" width="15"></iconify-icon>
                            الأرشيف الطبي الذكي
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/[0.06] transition-all"
                            href="/frontend/pages/job.MAISco/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:briefcase" width="15"></iconify-icon>
                            منصة التوظيف الذكي
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/[0.06] transition-all"
                            href="/frontend/pages/ai-scolecs/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:graduation-cap" width="15"></iconify-icon>
                            المنصة التعليمية الذكية
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/[0.06] transition-all"
                            href="/frontend/pages/health-bright/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:heart-pulse" width="15"></iconify-icon>
                            حلول AI الطبية المتقدمة
                        </a>
                    </div>
                </li>
                <li>
                    <a class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-200 hover:bg-white/[0.05] hover:text-white transition-all"
                        href="/frontend/pages/blog/index.html">
                        <iconify-icon class="text-slate-500" icon="lucide:book-open" width="18"></iconify-icon>
                        المدونة التقنية
                    </a>
                </li>
                <li>
                    <a aria-expanded="false" aria-haspopup="true"
                        class="mobile-nav-link flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-slate-200 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
                        href="#">
                        <span class="flex items-center gap-3">
                            <iconify-icon class="text-slate-500" icon="lucide:info" width="18"></iconify-icon>
                            عن برايت
                        </span>
                        <iconify-icon class="text-slate-600 text-sm" icon="lucide:chevron-down"></iconify-icon>
                    </a>
                    <div class="mobile-dropdown mt-1 mr-6"
                        style="padding-right: 1rem; border-right: 2px solid rgba(59,130,246,0.2);">
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-blue-400 hover:bg-blue-500/[0.06] transition-all"
                            href="/frontend/pages/about-us/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:info" width="15"></iconify-icon>
                            من نحن
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-blue-400 hover:bg-blue-500/[0.06] transition-all"
                            href="/frontend/pages/docs/docs.html">
                            <iconify-icon class="text-slate-600" icon="lucide:file-text" width="15"></iconify-icon>
                            المستندات
                        </a>
                        <a class="flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-sm text-slate-400 hover:text-blue-400 hover:bg-blue-500/[0.06] transition-all"
                            href="/frontend/pages/blog/index.html">
                            <iconify-icon class="text-slate-600" icon="lucide:library" width="15"></iconify-icon>
                            المكتبة الذكية
                        </a>
                    </div>
                </li>
                <li>
                    <a class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-indigo-400 hover:bg-indigo-500/[0.08] transition-all"
                        href="/frontend/pages/contact/index.html">
                        <iconify-icon class="text-indigo-500" icon="lucide:phone" width="18"></iconify-icon>
                        تواصل معنا
                    </a>
                </li>
            </ul>
            <!-- Mobile CTA -->
            <div class="mt-6 pt-6" style="border-top: 1px solid rgba(255,255,255,0.06);">
                <a class="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl text-white font-bold text-[15px] transition-all"
                    href="https://wa.me/966538229013" rel="noopener noreferrer"
                    style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);" target="_blank">
                    <iconify-icon icon="lucide:message-circle" width="18"></iconify-icon>
                    ابدأ رحلة التحول
                </a>
                <a class="flex items-center justify-center gap-2 w-full py-4 mt-4 rounded-xl text-slate-400 font-medium text-[15px] hover:text-white hover:bg-white/[0.04] transition-all"
                    href="/frontend/pages/try/index.html">
                    <iconify-icon icon="lucide:play-circle" width="16"></iconify-icon>
                    جرّب النظام مجاناً
                </a>
            </div>
        </div>
    </div>
    <!-- Backdrop -->
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

function ensureUxEnhancementStyles() {
  if (document.getElementById("bright-ux-enhancement-style")) return;
  const style = document.createElement("style");
  style.id = "bright-ux-enhancement-style";
  style.textContent = `
    html {
      font-size: calc(16px * var(--bright-font-scale, 1));
    }
    .bright-access-controls {
      position: fixed;
      left: 1rem;
      bottom: 4.3rem;
      z-index: 62;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem;
      border-radius: 0.85rem;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(2, 6, 23, 0.9);
      backdrop-filter: blur(6px);
    }
    .bright-access-btn {
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 0.55rem;
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      font-size: 0.74rem;
      line-height: 1;
      min-width: 34px;
      height: 32px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .bright-access-btn:hover {
      background: rgba(99, 102, 241, 0.25);
      border-color: rgba(99, 102, 241, 0.55);
      color: #fff;
    }
    html.bright-light-mode body {
      background: #f8fafc !important;
      color: #0f172a !important;
    }
    html.bright-light-mode .unified-nav {
      background: rgba(255, 255, 255, 0.9) !important;
      border-bottom-color: rgba(15, 23, 42, 0.15) !important;
    }
    html.bright-light-mode .unified-nav .nav-link,
    html.bright-light-mode .unified-nav .mobile-search-btn,
    html.bright-light-mode .unified-nav .search-trigger {
      color: #0f172a !important;
    }
    html.bright-light-mode .glass-card,
    html.bright-light-mode .doc-content section,
    html.bright-light-mode article {
      background: rgba(255, 255, 255, 0.9) !important;
      color: #0f172a !important;
      border-color: rgba(15, 23, 42, 0.15) !important;
    }
    html.bright-light-mode .bright-article-toc,
    html.bright-light-mode .bright-article-sidebar,
    html.bright-light-mode .bright-related {
      background: rgba(255, 255, 255, 0.95) !important;
      border-color: rgba(15, 23, 42, 0.2) !important;
    }
    html.bright-light-mode .bright-share-btn,
    html.bright-light-mode .bright-back-top,
    html.bright-light-mode .bright-access-controls {
      background: rgba(255, 255, 255, 0.95) !important;
      color: #0f172a !important;
      border-color: rgba(15, 23, 42, 0.2) !important;
    }
    html.bright-light-mode .bright-chat-panel {
      background: #f8fafc !important;
      border-color: rgba(15, 23, 42, 0.18) !important;
    }
    html.bright-light-mode .bright-chat-msg.user {
      background: #cbd5e1 !important;
      color: #0f172a !important;
    }
    html.bright-light-mode .bright-chat-msg.bot {
      background: #e2e8f0 !important;
      color: #0f172a !important;
      border-color: rgba(15, 23, 42, 0.18) !important;
    }
    html.bright-light-mode .bright-chat-input {
      background: #fff !important;
      border-top-color: rgba(15, 23, 42, 0.15) !important;
    }
    html.bright-light-mode .bright-chat-input input {
      background: #fff !important;
      color: #0f172a !important;
      border-color: rgba(15, 23, 42, 0.2) !important;
    }
    .bright-skip-link {
      position: fixed;
      top: -120px;
      right: 1rem;
      z-index: 1200;
      background: #0f172a;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 0.75rem;
      padding: 0.6rem 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: top 0.2s ease;
    }
    .bright-skip-link:focus,
    .bright-skip-link:focus-visible {
      top: 0.75rem;
      outline: 2px solid #38bdf8;
      outline-offset: 2px;
    }
    *:focus-visible {
      outline: 2px solid rgba(56, 189, 248, 0.95);
      outline-offset: 2px;
      border-radius: 0.35rem;
    }
    .bright-reading-progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      z-index: 1100;
      background: linear-gradient(90deg, #22d3ee, #6366f1, #8b5cf6);
      transition: width 120ms linear;
    }
    .bright-share-controls {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.9rem;
    }
    .bright-share-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(15, 23, 42, 0.7);
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.82rem;
      cursor: pointer;
      transition: 0.2s ease;
    }
    .bright-share-btn:hover {
      color: #ffffff;
      border-color: rgba(99, 102, 241, 0.7);
      background: rgba(99, 102, 241, 0.12);
    }
    .bright-article-toc {
      margin: 1rem 0 1.5rem;
      padding: 1rem;
      border-radius: 0.9rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(15, 23, 42, 0.55);
    }
    .bright-article-toc h2 {
      margin: 0 0 0.8rem;
      font-size: 1rem;
      color: #ffffff;
    }
    .bright-article-toc ul {
      margin: 0;
      padding-inline-start: 1rem;
      list-style: none;
      display: grid;
      gap: 0.45rem;
    }
    .bright-article-toc a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .bright-article-toc a:hover {
      color: #22d3ee;
    }
    .bright-article-sidebar {
      position: fixed;
      top: 108px;
      left: 1.2rem;
      width: 260px;
      max-height: calc(100vh - 140px);
      overflow: auto;
      padding: 0.95rem;
      border-radius: 0.9rem;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(2, 6, 23, 0.9);
      backdrop-filter: blur(8px);
      z-index: 45;
    }
    .bright-article-sidebar .bright-article-toc {
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
    }
    .bright-article-sidebar .bright-article-toc h2 {
      font-size: 0.95rem;
      margin-bottom: 0.7rem;
    }
    .bright-related {
      margin-top: 2rem;
      padding: 1.2rem;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(15, 23, 42, 0.5);
    }
    .bright-related h2 {
      margin: 0 0 0.9rem;
      color: #fff;
      font-size: 1.12rem;
    }
    .bright-related-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.7rem;
    }
    .bright-related-card {
      display: block;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      text-decoration: none;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.03);
      transition: 0.2s ease;
    }
    .bright-related-card:hover {
      color: #fff;
      border-color: rgba(34, 211, 238, 0.55);
      transform: translateY(-1px);
    }
    .bright-related-card span {
      display: block;
      margin-top: 0.35rem;
      color: #94a3b8;
      font-size: 0.8rem;
    }
    .bright-back-top {
      position: fixed;
      left: 1rem;
      bottom: 1rem;
      width: 42px;
      height: 42px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.9);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: 0.2s ease;
      z-index: 50;
    }
    .bright-back-top.show {
      opacity: 1;
      pointer-events: auto;
    }
    .bright-chat-fab {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      width: 56px;
      height: 56px;
      border: 0;
      border-radius: 1rem;
      color: #fff;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      box-shadow: 0 10px 28px rgba(99, 102, 241, 0.35);
      cursor: pointer;
      z-index: 60;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .bright-chat-panel {
      position: fixed;
      right: 1rem;
      bottom: 4.9rem;
      width: min(92vw, 360px);
      height: 470px;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: #0b1120;
      overflow: hidden;
      z-index: 61;
      display: none;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
    }
    .bright-chat-panel.open {
      display: flex;
    }
    .bright-chat-head {
      padding: 0.8rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #e2e8f0;
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.24), rgba(99, 102, 241, 0.2));
    }
    .bright-chat-messages {
      flex: 1;
      overflow: auto;
      padding: 0.8rem;
      display: grid;
      gap: 0.55rem;
    }
    .bright-chat-msg {
      max-width: 88%;
      padding: 0.5rem 0.65rem;
      border-radius: 0.65rem;
      font-size: 0.85rem;
      line-height: 1.5;
      color: #e2e8f0;
    }
    .bright-chat-msg.user {
      justify-self: end;
      background: #334155;
    }
    .bright-chat-msg.bot {
      justify-self: start;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .bright-chat-input {
      display: flex;
      gap: 0.5rem;
      padding: 0.65rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 23, 42, 0.95);
    }
    .bright-chat-input input {
      flex: 1;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 0.65rem;
      background: rgba(255, 255, 255, 0.03);
      color: #fff;
      padding: 0.5rem 0.65rem;
    }
    .bright-chat-input button {
      border: 0;
      border-radius: 0.65rem;
      background: #0ea5e9;
      color: #fff;
      padding: 0.5rem 0.8rem;
      cursor: pointer;
      font-weight: 600;
    }
    @media (max-width: 1200px) {
      .bright-article-sidebar {
        display: none;
      }
    }
    @media (max-width: 768px) {
      .bright-access-controls {
        bottom: 4.9rem;
      }
    }
  `;
  document.head.appendChild(style);
}

function getPrimaryArticleContainer() {
  const article = document.querySelector("article");
  if (article) return article;
  const docContent = document.querySelector("main .doc-content");
  if (docContent) return docContent;
  return null;
}

function getArticleHeadings(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll("h2, h3")).filter((heading) => {
    const text = (heading.textContent || "").trim();
    return text.length >= 3;
  });
}

function slugHeading(text, fallback) {
  const raw = String(text || "").trim().toLowerCase();
  const normalized = raw
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return normalized || `section-${fallback}`;
}

function ensureSkipToMain() {
  if (document.getElementById("bright-skip-main")) return;
  const main = document.querySelector("main") || document.querySelector('[role="main"]');
  if (!main) return;
  if (!main.id) {
    main.id = "main-content";
  }
  const skip = document.createElement("a");
  skip.id = "bright-skip-main";
  skip.className = "bright-skip-link";
  skip.href = `#${main.id}`;
  skip.textContent = "تجاوز إلى المحتوى الرئيسي";
  document.body.insertBefore(skip, document.body.firstChild);
}

function injectReadingProgressBar() {
  if (document.getElementById("bright-reading-progress")) return;
  const article = getPrimaryArticleContainer();
  if (!article) return;

  const bar = document.createElement("div");
  bar.id = "bright-reading-progress";
  bar.className = "bright-reading-progress";
  document.body.appendChild(bar);

  const update = () => {
    const articleTop = article.getBoundingClientRect().top + window.scrollY;
    const articleHeight = Math.max(article.scrollHeight, article.offsetHeight);
    const maxScrollable = Math.max(1, articleHeight - window.innerHeight * 0.7);
    const progress = ((window.scrollY - articleTop) / maxScrollable) * 100;
    const width = Math.max(0, Math.min(100, progress));
    bar.style.width = `${width}%`;
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function injectShareControls() {
  if (document.getElementById("bright-share-controls")) return;
  const article = getPrimaryArticleContainer();
  if (!article) return;
  const title = article.querySelector("h1") || document.querySelector("main h1");
  if (!title) return;

  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent((title.textContent || "").trim());

  const row = document.createElement("div");
  row.id = "bright-share-controls";
  row.className = "bright-share-controls";
  row.innerHTML = `
    <button type="button" class="bright-share-btn" data-share-action="copy">
      <iconify-icon icon="lucide:link-2" width="14"></iconify-icon>
      نسخ الرابط
    </button>
    <a class="bright-share-btn" href="https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer">
      <iconify-icon icon="lucide:twitter" width="14"></iconify-icon>
      مشاركة X
    </a>
    <a class="bright-share-btn" href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">
      <iconify-icon icon="logos:whatsapp-icon" width="14"></iconify-icon>
      واتساب
    </a>
    <button type="button" class="bright-share-btn" data-share-action="print">
      <iconify-icon icon="lucide:printer" width="14"></iconify-icon>
      طباعة / PDF
    </button>
  `;
  title.insertAdjacentElement("afterend", row);

  row.querySelector('[data-share-action="copy"]')?.addEventListener("click", async () => {
    const button = row.querySelector('[data-share-action="copy"]');
    if (!button) return;
    try {
      await navigator.clipboard.writeText(url);
      button.textContent = "تم النسخ";
    } catch (_) {
      const fallbackInput = document.createElement("input");
      fallbackInput.value = url;
      document.body.appendChild(fallbackInput);
      fallbackInput.select();
      document.execCommand("copy");
      fallbackInput.remove();
      button.textContent = "تم النسخ";
    }
    window.setTimeout(() => {
      button.innerHTML = `<iconify-icon icon="lucide:link-2" width="14"></iconify-icon>نسخ الرابط`;
    }, 1400);
  });

  row.querySelector('[data-share-action="print"]')?.addEventListener("click", () => {
    window.print();
  });
}

function injectAccessibilityControls() {
  if (document.getElementById("bright-access-controls")) return;
  const storageKeyTheme = "bright_theme_pref";
  const storageKeyScale = "bright_font_scale";

  const root = document.documentElement;
  const defaultScale = 1;

  const applyTheme = (mode) => {
    root.classList.toggle("bright-light-mode", mode === "light");
  };
  const applyScale = (scale) => {
    const safeScale = Math.max(0.9, Math.min(1.2, Number(scale) || defaultScale));
    root.style.setProperty("--bright-font-scale", String(safeScale));
    return safeScale;
  };

  const savedTheme = localStorage.getItem(storageKeyTheme) || "dark";
  const savedScale = applyScale(localStorage.getItem(storageKeyScale) || defaultScale);
  applyTheme(savedTheme);

  const controls = document.createElement("div");
  controls.id = "bright-access-controls";
  controls.className = "bright-access-controls";
  controls.innerHTML = `
    <button type="button" class="bright-access-btn" data-a11y-theme title="تبديل المظهر">🌓</button>
    <button type="button" class="bright-access-btn" data-a11y-dec title="تصغير الخط">A-</button>
    <button type="button" class="bright-access-btn" data-a11y-reset title="إعادة الخط">A</button>
    <button type="button" class="bright-access-btn" data-a11y-inc title="تكبير الخط">A+</button>
  `;
  document.body.appendChild(controls);

  controls.querySelector("[data-a11y-theme]")?.addEventListener("click", () => {
    const mode = root.classList.contains("bright-light-mode") ? "dark" : "light";
    applyTheme(mode);
    localStorage.setItem(storageKeyTheme, mode);
  });

  controls.querySelector("[data-a11y-dec]")?.addEventListener("click", () => {
    const updated = applyScale((Number(root.style.getPropertyValue("--bright-font-scale")) || savedScale) - 0.04);
    localStorage.setItem(storageKeyScale, String(updated));
  });

  controls.querySelector("[data-a11y-inc]")?.addEventListener("click", () => {
    const updated = applyScale((Number(root.style.getPropertyValue("--bright-font-scale")) || savedScale) + 0.04);
    localStorage.setItem(storageKeyScale, String(updated));
  });

  controls.querySelector("[data-a11y-reset]")?.addEventListener("click", () => {
    const updated = applyScale(defaultScale);
    localStorage.setItem(storageKeyScale, String(updated));
  });
}

function buildTocMarkup(headings) {
  const toc = document.createElement("nav");
  toc.className = "bright-article-toc";
  toc.setAttribute("aria-label", "فهرس المقال");
  const listHtml = headings
    .map((heading, index) => {
      if (!heading.id) heading.id = slugHeading(heading.textContent || "", index + 1);
      return `<li><a href="#${heading.id}">${heading.textContent || ""}</a></li>`;
    })
    .join("");
  toc.innerHTML = `<h2>الفهرس</h2><ul>${listHtml}</ul>`;
  return toc;
}

function injectAutoTableOfContents() {
  if (document.getElementById("bright-inline-toc")) return;
  const article = getPrimaryArticleContainer();
  if (!article) return;
  const headings = getArticleHeadings(article);
  if (headings.length < 4) return;

  const toc = buildTocMarkup(headings);
  toc.id = "bright-inline-toc";

  const insertionAnchor = article.querySelector("h2, h3, p");
  if (insertionAnchor) {
    insertionAnchor.insertAdjacentElement("beforebegin", toc);
  } else {
    article.prepend(toc);
  }

  if (!document.getElementById("bright-article-sidebar") && headings.length >= 6) {
    const sidebar = document.createElement("aside");
    sidebar.id = "bright-article-sidebar";
    sidebar.className = "bright-article-sidebar";
    sidebar.appendChild(buildTocMarkup(headings));
    document.body.appendChild(sidebar);
  }
}

function injectRelatedArticles() {
  if (document.getElementById("bright-related-articles")) return;
  const article = getPrimaryArticleContainer();
  if (!article) return;

  const path = normalizePathname(window.location.pathname);
  const isBlogPath = path.startsWith("/frontend/pages/blogger/") || path.startsWith("/frontend/pages/blog/");
  const isDocsPath = path.startsWith("/frontend/pages/docs/");
  if (!isBlogPath && !isDocsPath) return;

  const hasRelatedHeader = Array.from(article.querySelectorAll("h2, h3")).some((heading) => {
    return /مقالات ذات صلة|Related/i.test(heading.textContent || "");
  });
  if (hasRelatedHeader) return;

  const relatedSet = isBlogPath
    ? [
        { href: "/frontend/pages/blogger/nca-compliance.html", title: "حوكمة NCA للشركات السعودية", hint: "امتثال وتشغيل" },
        { href: "/frontend/pages/blogger/vision-2030-ai-opportunities.html", title: "فرص الذكاء الاصطناعي ضمن رؤية 2030", hint: "اتجاهات السوق" },
        { href: "/frontend/pages/blogger/ai-implementation-cost-guide.html", title: "دليل تكلفة تطبيق الذكاء الاصطناعي", hint: "قرار الاستثمار" }
      ]
    : [
        { href: "/frontend/pages/docs/solutions-hr.html", title: "حلول الموارد البشرية الذكية", hint: "حالة استخدام عملية" },
        { href: "/frontend/pages/docs/solutions-crm.html", title: "حلول CRM والواتساب", hint: "رفع التحويلات" },
        { href: "/frontend/pages/docs/consultation.html", title: "استشارة تنفيذ مخصصة", hint: "جلسة تشخيص" }
      ];

  const section = document.createElement("section");
  section.id = "bright-related-articles";
  section.className = "bright-related";
  const cards = relatedSet
    .map((item) => {
      return `<a class="bright-related-card" href="${item.href}">
        ${item.title}
        <span>${item.hint}</span>
      </a>`;
    })
    .join("");
  section.innerHTML = `<h2>مقالات ذات صلة</h2><div class="bright-related-list">${cards}</div>`;
  article.appendChild(section);
}

function injectBackToTopButton() {
  const path = normalizePathname(window.location.pathname);
  const isRootPath = path === "/" || path === "/index" || path === "/index.html";
  if (isRootPath) return;
  if (document.getElementById("bright-back-top")) return;
  if (document.querySelector("[data-back-to-top], #backToTop")) return;

  const button = document.createElement("button");
  button.id = "bright-back-top";
  button.className = "bright-back-top";
  button.type = "button";
  button.setAttribute("aria-label", "العودة لأعلى الصفحة");
  button.innerHTML = `<iconify-icon icon="lucide:arrow-up" width="18"></iconify-icon>`;
  document.body.appendChild(button);

  const onScroll = () => {
    button.classList.toggle("show", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function injectFloatingChatbot() {
  const path = normalizePathname(window.location.pathname);
  const isRootPath = path === "/" || path === "/index" || path === "/index.html";
  if (isRootPath) return;
  if (document.getElementById("chatFab") || document.getElementById("chatToggle")) return;
  if (document.getElementById("bright-chat-fab")) return;

  const fab = document.createElement("button");
  fab.id = "bright-chat-fab";
  fab.className = "bright-chat-fab";
  fab.type = "button";
  fab.setAttribute("aria-controls", "bright-chat-panel");
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-label", "فتح المساعد الذكي");
  fab.innerHTML = `<iconify-icon icon="lucide:message-square" width="24"></iconify-icon>`;

  const panel = document.createElement("section");
  panel.id = "bright-chat-panel";
  panel.className = "bright-chat-panel";
  panel.innerHTML = `
    <div class="bright-chat-head">
      <strong>Bright AI Assistant</strong>
      <button type="button" data-chat-close aria-label="إغلاق" style="border:0;background:transparent;color:#cbd5e1;cursor:pointer;">
        <iconify-icon icon="lucide:x" width="18"></iconify-icon>
      </button>
    </div>
    <div class="bright-chat-messages" id="bright-chat-messages">
      <div class="bright-chat-msg bot">أهلاً، اكتب سؤالك التقني أو التجاري وبنرد عليك فوراً.</div>
    </div>
    <form class="bright-chat-input" id="bright-chat-form">
      <input id="bright-chat-input" type="text" placeholder="اكتب سؤالك..." autocomplete="off" />
      <button type="submit">إرسال</button>
    </form>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const messageContainer = panel.querySelector("#bright-chat-messages");
  const form = panel.querySelector("#bright-chat-form");
  const input = panel.querySelector("#bright-chat-input");
  const closeButton = panel.querySelector("[data-chat-close]");
  let sending = false;

  const addMessage = (text, role) => {
    if (!messageContainer) return;
    const node = document.createElement("div");
    node.className = `bright-chat-msg ${role}`;
    node.textContent = text;
    messageContainer.appendChild(node);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  };

  fab.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) input?.focus();
  });

  closeButton?.addEventListener("click", () => {
    panel.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!input || sending) return;
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";
    sending = true;

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }
      const answer = String(payload?.reply || "").trim() || "تم استلام سؤالك، فريقنا بيرد عليك خلال لحظات.";
      addMessage(answer, "bot");
    } catch (_) {
      addMessage("حالياً الخدمة مزدحمة. تواصل معنا مباشرة عبر واتساب: +966538229013", "bot");
    } finally {
      sending = false;
      input.focus();
    }
  });
}

function applyArticleUxEnhancements() {
  ensureUxEnhancementStyles();
  ensureSkipToMain();
  injectAccessibilityControls();
  injectBlogReadingTime();
  injectReadingProgressBar();
  injectShareControls();
  injectAutoTableOfContents();
  injectRelatedArticles();
  injectBackToTopButton();
  injectFloatingChatbot();
  optimizeImagesForCWV();
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
    applyArticleUxEnhancements();
    return;
  }

  const mobileToggles = document.querySelectorAll(".mobile-toggle");
  const mobileDrawer = document.querySelector(".mobile-menu-drawer, #mobileDrawer");
  const backdrop = document.querySelector(".backdrop-overlay");
  const dropdownToggles = document.querySelectorAll('.nav-link[aria-haspopup="true"], button.nav-link[aria-haspopup="true"]');

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

  applyArticleUxEnhancements();
}
