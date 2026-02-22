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

/* ── Build Navigation HTML (mirrors index.html exactly) ── */
function buildUnifiedNavigationMarkup() {
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
function mountUnifiedNavigation() {
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
  root.innerHTML = buildUnifiedNavigationMarkup();

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

/* ── Init Navigation ── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  // DOM is already ready
  initNavigation();
}

function initNavigation() {
  if (isTargetServicePage()) {
    mountUnifiedNavigation();
    ensureSearchScript();
  }

  const nav = document.querySelector(".unified-nav, #main-header");
  if (!nav) return;

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
}
