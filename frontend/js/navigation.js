/**
 * Bright AI - Unified Navigation Controller
 * Injects the exact same header + search bar from index.html into all service pages.
 * Handles scroll behavior, mobile drawer, dropdowns, and search integration.
 */

/* ── Target Pages ── */
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
  "/frontend/pages/tools/index.html",
  "/frontend/pages/job.MAISco/index.html",
  "/frontend/pages/ai-scolecs/index.html",
  "/frontend/pages/health-bright/index.html",
  "/frontend/pages/blog/index.html",
  "/frontend/pages/try/index.html",
  "/frontend/pages/machine/index.html",
  "/frontend/pages/privacy-cookies/index.html",
  "/frontend/pages/demo/index.html"
]);

/* ── Path Utilities ── */
function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function buildTargetVariants(targetPath) {
  const normalized = normalizePathname(targetPath);
  const variants = new Set([normalized]);
  if (normalized.endsWith("/index.html")) {
    variants.add(normalized.replace(/\/index\.html$/, ""));
    variants.add(normalized.replace(/\/index\.html$/, "/"));
  } else {
    variants.add(`${normalized}/index.html`);
    variants.add(`${normalized}/`);
  }
  return variants;
}

function isTargetServicePage(pathname = window.location.pathname) {
  const currentPath = normalizePathname(pathname);
  // Match any page under /frontend/pages/ or local file paths
  if (currentPath.includes("/frontend/pages/")) return true;
  for (const target of TARGET_SERVICE_PAGES) {
    const variants = buildTargetVariants(target);
    if (variants.has(currentPath)) return true;
  }
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
                <a aria-label="Bright AI — الصفحة الرئيسية" class="nav-logo group" href="/"
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
                        <a class="nav-link" href="/">الرئيسية</a>
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
                        href="/">
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

/* ── CSS Styles (mirrors index.html critical-css exactly) ── */
function ensureUnifiedNavStyles() {
  if (document.getElementById("bright-unified-nav-style")) return;

  const style = document.createElement("style");
  style.id = "bright-unified-nav-style";
  style.textContent = `
    /* === NAVIGATION TOKENS (from index.html) === */
    :root {
      --nav-height: 72px;
      --nav-bg: rgba(2, 6, 23, 0.65);
      --nav-bg-scrolled: rgba(2, 6, 23, 0.92);
      --nav-backdrop-blur: 24px;
      --nav-border: 1px solid rgba(255, 255, 255, 0.06);
      --nav-border-scrolled: 1px solid rgba(255, 255, 255, 0.1);
      --nav-text-color: #cbd5e1;
      --nav-hover-color: #ffffff;
      --dropdown-bg: rgba(10, 15, 30, 0.96);
      --dropdown-border: 1px solid rgba(255, 255, 255, 0.08);
      --dropdown-shadow: 0 24px 64px -16px rgba(0, 0, 0, 0.8);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-full: 9999px;
      --transition-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (max-width: 1023px) {
      :root { --nav-height: 64px; }
    }

    /* === UNIFIED NAV (Premium Glassmorphism) === */
    .unified-nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--nav-height);
      z-index: 1000;
      background: var(--nav-bg);
      backdrop-filter: blur(var(--nav-backdrop-blur));
      -webkit-backdrop-filter: blur(var(--nav-backdrop-blur));
      border-bottom: var(--nav-border);
      transition: transform 0.35s ease, background 0.4s ease, border-bottom 0.4s ease, box-shadow 0.4s ease;
      will-change: transform;
    }

    .unified-nav.nav-scrolled {
      background: var(--nav-bg-scrolled);
      border-bottom: var(--nav-border-scrolled);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.35);
    }

    .unified-nav.nav-hidden {
      transform: translateY(-100%);
    }

    /* Enterprise override */
    .unified-nav {
      background: rgba(15, 23, 42, 0.70) !important;
      backdrop-filter: blur(20px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
    }

    .unified-nav.nav-scrolled {
      background: rgba(2, 6, 23, 0.94) !important;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.35) !important;
    }

    /* === NAV CONTAINER === */
    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      gap: 0.75rem;
    }

    @media (min-width: 1024px) {
      .nav-container { padding: 0 2rem; gap: 1.5rem; }
    }

    /* === LOGO === */
    .nav-logo {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      text-decoration: none;
      z-index: 1002;
      flex-shrink: 0;
    }

    /* === NAV LINKS === */
    .nav-links {
      display: none;
      list-style: none;
      margin: 0; padding: 0;
      gap: 0.25rem;
    }

    @media (min-width: 1024px) {
      .nav-links { display: flex; align-items: center; }
    }

    .nav-item { position: relative; }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      color: var(--nav-text-color);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      border-radius: var(--radius-sm);
      transition: color 0.2s ease, background 0.2s ease;
      white-space: nowrap;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
    }

    .nav-link:hover,
    .nav-link[aria-expanded="true"] {
      color: var(--nav-hover-color);
      background: rgba(255, 255, 255, 0.06);
    }

    /* === DROPDOWN MENU === */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0; left: auto;
      width: max-content;
      min-width: 260px;
      background: var(--dropdown-bg);
      border: var(--dropdown-border);
      border-radius: var(--radius-md);
      padding: 0.5rem;
      box-shadow: var(--dropdown-shadow);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(8px);
      transition: all 0.25s var(--transition-smooth);
      z-index: 9999;
    }

    .nav-item:hover .dropdown-menu {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0);
    }

    /* === NAV CTA BUTTON === */
    .nav-cta {
      display: none;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #fff;
      font-weight: 600;
      font-size: 0.8125rem;
      border-radius: var(--radius-full);
      text-decoration: none;
      white-space: nowrap;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 2px 12px rgba(99, 102, 241, 0.3);
    }

    .nav-cta:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.45);
    }

    @media (min-width: 1024px) {
      .nav-cta-desktop { display: inline-flex; }
    }

    /* === DESKTOP/MOBILE VISIBILITY === */
    .nav-desktop { display: none; }

    @media (min-width: 1024px) {
      .nav-desktop { display: flex; align-items: center; gap: 0.25rem; }
    }

    /* === SEARCH DESKTOP === */
    .search-desktop {
      display: none;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.875rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-md);
      color: var(--nav-text-color);
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
      font-family: inherit;
    }

    .search-desktop:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(99, 102, 241, 0.3);
      color: #fff;
    }

    @media (min-width: 1024px) {
      .search-desktop { display: flex; }
    }

    .search-desktop span {
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .search-kbd {
      display: none;
      font-size: 10px;
      font-family: ui-monospace, monospace;
      opacity: 0.6;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 6px;
      color: #64748b;
    }

    @media (min-width: 1280px) {
      .search-kbd { display: inline; }
    }

    /* === SEARCH MOBILE === */
    .search-mobile {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px; height: 40px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-md);
      color: var(--nav-text-color);
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .search-mobile:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(99, 102, 241, 0.3);
      color: #fff;
    }

    @media (min-width: 1024px) {
      .search-mobile { display: none; }
    }

    /* === NAV ACTIONS CONTAINER === */
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (min-width: 1024px) {
      .nav-actions { gap: 0.75rem; }
    }

    /* === MOBILE TOGGLE === */
    .mobile-toggle {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 5px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      cursor: pointer;
      z-index: 1002;
      padding: 10px;
      width: 42px; height: 42px;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .mobile-toggle:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(99, 102, 241, 0.3);
    }

    @media (min-width: 1024px) {
      .mobile-toggle { display: none; }
    }

    .bar {
      width: 20px; height: 2px;
      background: #e2e8f0;
      border-radius: 2px;
      transition: transform 0.3s var(--transition-smooth), opacity 0.2s ease;
    }

    .mobile-toggle[aria-expanded="true"] .bar:nth-child(1) {
      transform: translateY(7px) rotate(45deg);
    }
    .mobile-toggle[aria-expanded="true"] .bar:nth-child(2) { opacity: 0; }
    .mobile-toggle[aria-expanded="true"] .bar:nth-child(3) {
      transform: translateY(-7px) rotate(-45deg);
    }

    /* === MOBILE DRAWER (Premium) === */
    .mobile-menu-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: min(85vw, 360px);
      z-index: 1050;
      background: rgba(2, 6, 23, 0.98);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      transform: translateX(100%);
      transition: transform 0.45s var(--transition-smooth);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    [dir="rtl"] .mobile-menu-drawer {
      right: auto; left: 0;
      border-left: none;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      transform: translateX(-100%);
    }

    .mobile-menu-drawer.active { transform: translateX(0); }
    [dir="rtl"] .mobile-menu-drawer.active { transform: translateX(0); }

    /* === MOBILE DROPDOWN === */
    .mobile-dropdown {
      display: none;
      margin: 0.3rem 0 0.5rem;
      padding: 0.4rem;
      border-radius: 0.8rem;
      background: rgba(255, 255, 255, 0.04);
    }

    .mobile-dropdown.open { display: block; }

    /* === BACKDROP === */
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

    /* === ACTIVE LINK === */
    .nav-link.active {
      color: #fff;
      background: rgba(99, 102, 241, 0.12);
    }
  `;

  document.head.appendChild(style);
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

/* ── Mount Unified Navigation ── */
function mountUnifiedNavigation() {
  ensureUnifiedNavStyles();
  ensureDependencies();

  // Remove any existing nav elements
  document.getElementById("bright-unified-nav-root")?.remove();
  document.querySelectorAll(
    ".unified-nav, header.sticky, header.fixed, header.absolute:not(.hero-section), .mobile-menu-drawer, .backdrop-overlay, .nav-overlay, #main-header, nav.unified-nav, header[role='banner']:not(#main-header)"
  ).forEach((node) => {
    // Don't remove if it's part of our injected root
    if (node.closest("#bright-unified-nav-root")) return;
    if (node.classList.contains("hero-section")) return;
    node.remove();
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
