/**
 * Bright AI - Unified Site Search
 * Provides a shared modal, shared index, and keyboard shortcuts across service pages.
 */

class BrightSearch {
  constructor() {
    this.modal = null;
    this.input = null;
    this.resultsContainer = null;
    this.isOpen = false;
    this.selectedIndex = -1;
    this.searchData = this.getSearchIndex();
    this.debounceTimer = null;
    this.boundGlobalKeydown = this.handleGlobalKeydown.bind(this);

    this.init();
  }

  getSearchIndex() {
    const entries = [
      {
        id: "smart-automation",
        type: "service",
        title: "الأتمتة الذكية",
        description: "أتمتة العمليات التشغيلية ورفع الكفاءة باستخدام الذكاء الاصطناعي",
        keywords: ["أتمتة", "RPA", "تشغيل", "كفاءة", "عمليات"],
        url: "/frontend/pages/smart-automation/index.html",
        category: "الخدمات"
      },
      {
        id: "data-analysis",
        type: "service",
        title: "تحليل البيانات",
        description: "تحليلات متقدمة ولوحات مؤشرات تدعم القرار التجاري",
        keywords: ["بيانات", "تحليل", "تقارير", "مؤشرات", "ذكاء أعمال"],
        url: "/frontend/pages/data-analysis/index.html",
        category: "الخدمات"
      },
      {
        id: "ai-agent",
        type: "service",
        title: "AI للمنشآت",
        description: "وكلاء ذكاء اصطناعي مخصصون للعمليات اليومية",
        keywords: ["وكيل", "Agent", "منشآت", "تشغيل", "AIaaS"],
        url: "/frontend/pages/ai-agent/index.html",
        category: "الخدمات"
      },
      {
        id: "smart-medical-archive",
        type: "service",
        title: "الأرشيف الطبي الذكي",
        description: "نظام إدارة سجلات طبية ذكي للمستشفيات والمراكز الصحية",
        keywords: ["طبي", "صحي", "مستشفيات", "سجلات", "أرشفة"],
        url: "/frontend/pages/smart-medical-archive/index.html",
        category: "الخدمات"
      },
      {
        id: "ai-workflows",
        type: "service",
        title: "سير العمل بالذكاء الاصطناعي",
        description: "بناء تدفقات ذكية تربط الفرق والأنظمة وتقلل زمن التنفيذ",
        keywords: ["workflow", "سير العمل", "تدفق", "إنتاجية"],
        url: "/frontend/pages/ai-workflows/index.html",
        category: "الخدمات"
      },
      {
        id: "consultation",
        type: "service",
        title: "الاستشارات التقنية",
        description: "خطة تحول عملية للذكاء الاصطناعي في السوق السعودي",
        keywords: ["استشارات", "تحول", "خطة", "تنفيذ"],
        url: "/frontend/pages/consultation/index.html",
        category: "الخدمات"
      },
      {
        id: "ai-bots",
        type: "solution",
        title: "روبوتات الذكاء الاصطناعي",
        description: "نماذج بوتات جاهزة لخدمة العملاء والمبيعات والتوظيف",
        keywords: ["بوت", "روبوت", "محادثة", "خدمة العملاء"],
        url: "/frontend/pages/ai-bots/index.html",
        category: "الحلول"
      },
      {
        id: "our-products",
        type: "solution",
        title: "منتجات وخدمات Bright AI",
        description: "كتالوج حلول الذكاء الاصطناعي للشركات والمنشآت",
        keywords: ["منتجات", "خدمات", "اشتراكات", "حلول"],
        url: "/frontend/pages/our-products/index.html",
        category: "الحلول"
      },
      {
        id: "tools",
        type: "solution",
        title: "الأدوات الذكية",
        description: "أدوات مجانية وتجريبية للتحليل والتشغيل",
        keywords: ["أدوات", "مجانية", "تحليل", "تجربة"],
        url: "/frontend/pages/tools/index.html",
        category: "الحلول"
      },
      {
        id: "what-is-ai",
        type: "page",
        title: "ما هو الذكاء الاصطناعي؟",
        description: "دليل مبسط لفهم المفاهيم والتطبيقات في الأعمال",
        keywords: ["تعريف", "ذكاء اصطناعي", "تعلم الآلة", "AI"],
        url: "/frontend/pages/what-is-ai/index.html",
        category: "المعرفة"
      },
      {
        id: "about-us",
        type: "page",
        title: "من نحن",
        description: "تعرف على Bright AI وفريق العمل والرؤية",
        keywords: ["شركة", "فريق", "رؤية", "Bright AI"],
        url: "/frontend/pages/about-us/index.html",
        category: "الشركة"
      },
      {
        id: "contact",
        type: "page",
        title: "تواصل معنا",
        description: "احجز استشارة وتواصل مع فريق Bright AI",
        keywords: ["اتصال", "تواصل", "واتساب", "استشارة"],
        url: "/frontend/pages/contact/index.html",
        category: "الشركة"
      },
      {
        id: "blog",
        type: "page",
        title: "المكتبة الذكية",
        description: "مقالات ودراسات تطبيقية حول الذكاء الاصطناعي",
        keywords: ["مدونة", "مقالات", "دراسات", "محتوى"],
        url: "/frontend/pages/blog/index.html",
        category: "المعرفة"
      },
      {
        id: "docs",
        type: "page",
        title: "المستندات",
        description: "التوثيق الرسمي والواجهات الفنية",
        keywords: ["docs", "توثيق", "دليل", "API"],
        url: "/docs.html",
        category: "المعرفة"
      },
      {
        id: "home",
        type: "page",
        title: "الصفحة الرئيسية",
        description: "بوابة Bright AI الرئيسية",
        keywords: ["رئيسية", "Bright AI", "حلول", "ذكاء اصطناعي"],
        url: "/index.html",
        category: "الشركة"
      }
    ];

    return entries.map((entry) => ({ ...entry, url: this.normalizeUrl(entry.url) }));
  }

  normalizeUrl(url) {
    if (!url) {
      return "/";
    }

    if (url.startsWith("/")) {
      return url;
    }

    return `/${url.replace(/^\.?\/?/, "")}`;
  }

  init() {
    this.injectStyles();
    this.ensureSearchModal();
    this.ensureSearchTriggers();
    this.bindEvents();
    this.showQuickActions();
  }

  injectStyles() {
    if (document.getElementById("bright-search-inline-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "bright-search-inline-style";
    style.textContent = `
      .search-trigger:not(.search-desktop) {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 220px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(15, 23, 42, 0.7);
        color: #cbd5e1;
        border-radius: 999px;
        padding: 0.5rem 0.9rem;
        font-size: 0.9rem;
        cursor: pointer;
      }

      .search-trigger:not(.search-desktop):hover {
        background: rgba(30, 41, 59, 0.92);
        color: #f8fafc;
      }

      .search-shortcut {
        margin-inline-start: auto;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.35rem;
        font-size: 0.72rem;
        padding: 0.1rem 0.45rem;
        color: #94a3b8;
      }

      .mobile-search-btn:not(.search-mobile) {
        display: none;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(15, 23, 42, 0.7);
        color: #e2e8f0;
        cursor: pointer;
        font-size: 1.05rem;
      }

      .mobile-search-btn:not(.search-mobile):hover {
        background: rgba(30, 41, 59, 0.92);
      }

      .search-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: min(12vh, 88px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s ease, visibility 0.25s ease;
      }

      .search-modal[aria-hidden="false"],
      .search-modal.active {
        opacity: 1;
        visibility: visible;
      }

      .search-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(2, 6, 23, 0.86);
        backdrop-filter: blur(6px);
      }

      .search-modal-content {
        position: relative;
        width: min(92vw, 760px);
        background: #0f172a;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 30px 80px rgba(2, 6, 23, 0.55);
        transform: translateY(-16px) scale(0.98);
        transition: transform 0.25s ease;
      }

      .search-modal[aria-hidden="false"] .search-modal-content,
      .search-modal.active .search-modal-content {
        transform: translateY(0) scale(1);
      }

      .search-input-wrapper {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 1rem 1.1rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
      }

      .search-icon {
        color: #a5b4fc;
        font-size: 1.12rem;
      }

      .search-input {
        flex: 1;
        background: transparent;
        border: 0;
        outline: 0;
        color: #f8fafc;
        font-size: 1rem;
      }

      .search-input::placeholder {
        color: #94a3b8;
      }

      .search-close-btn {
        border: 1px solid rgba(148, 163, 184, 0.24);
        background: rgba(30, 41, 59, 0.7);
        color: #cbd5e1;
        border-radius: 0.6rem;
        padding: 0.35rem 0.6rem;
        font-family: inherit;
        font-size: 0.74rem;
        cursor: pointer;
      }

      .search-results {
        max-height: min(62vh, 500px);
        overflow-y: auto;
        padding: 1rem;
      }

      .search-quick-title,
      .search-category-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #94a3b8;
        font-size: 0.78rem;
        margin-bottom: 0.75rem;
      }

      .search-quick-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .search-quick-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border: 1px solid rgba(99, 102, 241, 0.3);
        background: rgba(99, 102, 241, 0.14);
        color: #c7d2fe;
        text-decoration: none;
        border-radius: 0.75rem;
        padding: 0.55rem 0.75rem;
        font-size: 0.82rem;
      }

      .search-quick-link:hover {
        color: #f8fafc;
        border-color: rgba(129, 140, 248, 0.6);
      }

      .search-category {
        margin-top: 1rem;
      }

      .search-result-item {
        display: grid;
        grid-template-columns: 34px 1fr auto;
        align-items: center;
        gap: 0.7rem;
        border: 1px solid rgba(148, 163, 184, 0.14);
        background: rgba(15, 23, 42, 0.55);
        color: #e2e8f0;
        border-radius: 0.9rem;
        text-decoration: none;
        padding: 0.72rem 0.82rem;
        margin-bottom: 0.55rem;
      }

      .search-result-item:hover,
      .search-result-item.active {
        border-color: rgba(129, 140, 248, 0.56);
        background: rgba(30, 41, 59, 0.85);
      }

      .search-result-icon {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.95rem;
        background: rgba(99, 102, 241, 0.2);
        color: #c7d2fe;
      }

      .search-result-title {
        color: #ffffff;
        font-size: 0.92rem;
        margin-bottom: 0.22rem;
      }

      .search-result-desc {
        color: #94a3b8;
        font-size: 0.8rem;
      }

      .search-result-meta {
        margin-top: 0.35rem;
        color: #64748b;
        font-size: 0.72rem;
      }

      .search-result-arrow {
        color: #64748b;
        font-size: 1rem;
      }

      .search-no-results {
        text-align: center;
        color: #94a3b8;
        padding: 2rem 0.7rem;
      }

      .search-no-results h4 {
        margin-bottom: 0.4rem;
        color: #f8fafc;
        font-size: 1rem;
      }

      .search-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
        border-top: 1px solid rgba(148, 163, 184, 0.16);
        background: rgba(2, 6, 23, 0.5);
        padding: 0.85rem 1rem;
        color: #94a3b8;
        font-size: 0.75rem;
      }

      .search-footer-nav {
        display: flex;
        gap: 0.8rem;
      }

      .search-footer-nav kbd {
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 0.35rem;
        padding: 0.05rem 0.3rem;
        margin-inline-start: 0.15rem;
      }

      .search-footer-powered {
        color: #a5b4fc;
      }

      mark {
        background: rgba(250, 204, 21, 0.2);
        color: #fde68a;
        border-radius: 0.2rem;
        padding: 0 0.1rem;
      }

      @media (max-width: 1023px) {
        .search-trigger:not(.search-desktop) {
          display: none;
        }

        .mobile-search-btn:not(.search-mobile) {
          display: inline-flex;
        }

        .nav-actions .nav-btn {
          display: none;
        }
      }

      @media (max-width: 640px) {
        .search-modal {
          padding-top: 6vh;
        }

        .search-modal-content {
          width: calc(100vw - 16px);
          border-radius: 14px;
        }

        .search-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.55rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  ensureSearchModal() {
    let modal = document.getElementById("searchModal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "searchModal";
      modal.className = "search-modal";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = this.getModalTemplate();
      document.body.appendChild(modal);
    }

    this.modal = modal;
    this.input = modal.querySelector("#searchInput");
    this.resultsContainer = modal.querySelector("#searchResults");

    if (!this.input || !this.resultsContainer) {
      modal.innerHTML = this.getModalTemplate();
      this.input = modal.querySelector("#searchInput");
      this.resultsContainer = modal.querySelector("#searchResults");
    }
  }

  getModalTemplate() {
    return `
      <div class="search-modal-backdrop" data-search-close="true"></div>
      <div class="search-modal-content" role="dialog" aria-modal="true" aria-label="بحث في الموقع">
        <div class="search-input-wrapper">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input type="text" class="search-input" id="searchInput" placeholder="ابحث عن خدمة، منتج، أو صفحة..." autocomplete="off" />
          <button class="search-close-btn" data-search-close="true" type="button" aria-label="إغلاق البحث">ESC</button>
        </div>

        <div class="search-results" id="searchResults"></div>

        <div class="search-footer">
          <div class="search-footer-nav">
            <span><kbd>↑</kbd><kbd>↓</kbd> للتنقل</span>
            <span><kbd>↵</kbd> للفتح</span>
            <span><kbd>ESC</kbd> للإغلاق</span>
          </div>
          <div class="search-footer-powered">بحث موحد من Bright AI</div>
        </div>
      </div>
    `;
  }

  ensureSearchTriggers() {
    const navContainers = document.querySelectorAll(".nav-container");

    navContainers.forEach((navContainer) => {
      let searchTrigger = navContainer.querySelector(".search-trigger");
      let mobileSearchBtn = navContainer.querySelector(".mobile-search-btn");

      if (!searchTrigger) {
        searchTrigger = document.createElement("button");
        searchTrigger.className = "search-trigger";
        searchTrigger.type = "button";
        searchTrigger.setAttribute("aria-label", "فتح البحث");
        searchTrigger.innerHTML = `
          <span aria-hidden="true">⌕</span>
          <span>ابحث في الموقع...</span>
          <span class="search-shortcut">⌘K</span>
        `;
      }

      if (!mobileSearchBtn) {
        mobileSearchBtn = document.createElement("button");
        mobileSearchBtn.className = "mobile-search-btn";
        mobileSearchBtn.type = "button";
        mobileSearchBtn.setAttribute("aria-label", "فتح البحث");
        mobileSearchBtn.textContent = "⌕";
      }

      const navActions = navContainer.querySelector(".nav-actions");
      const navBtn = navContainer.querySelector(".nav-btn");

      if (navActions) {
        if (!searchTrigger.isConnected) {
          navActions.insertAdjacentElement("afterbegin", searchTrigger);
        }

        if (!mobileSearchBtn.isConnected) {
          if (navBtn) {
            navBtn.insertAdjacentElement("beforebegin", mobileSearchBtn);
          } else {
            navActions.appendChild(mobileSearchBtn);
          }
        }
      } else if (navBtn && navBtn.parentElement) {
        if (!searchTrigger.isConnected) {
          navBtn.insertAdjacentElement("beforebegin", searchTrigger);
        }
        if (!mobileSearchBtn.isConnected) {
          navBtn.insertAdjacentElement("beforebegin", mobileSearchBtn);
        }
      }
    });

    document.querySelectorAll(".search-trigger, .mobile-search-btn").forEach((button) => {
      if (button.dataset.searchBound === "true") {
        return;
      }

      button.dataset.searchBound = "true";
      button.addEventListener("click", () => this.open());
    });
  }

  bindEvents() {
    document.removeEventListener("keydown", this.boundGlobalKeydown);
    document.addEventListener("keydown", this.boundGlobalKeydown);

    this.modal.querySelectorAll("[data-search-close='true']").forEach((node) => {
      node.addEventListener("click", () => this.close());
    });

    this.input.addEventListener("input", (event) => {
      this.debounceSearch(event.target.value || "");
    });

    this.input.addEventListener("keydown", (event) => {
      this.handleResultsKeyboard(event);
    });

    this.resultsContainer.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        this.close();
      }
    });
  }

  handleGlobalKeydown(event) {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

    if (isShortcut) {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (event.key === "Escape" && this.isOpen) {
      this.close();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this.modal) {
      return;
    }

    this.isOpen = true;
    this.modal.classList.add("active");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      this.input?.focus();
      this.input?.select();
    }, 20);

    if (typeof window.gtag === "function") {
      window.gtag("event", "search_open", {
        event_category: "engagement",
        event_label: "Unified Search"
      });
    }
  }

  close() {
    if (!this.modal) {
      return;
    }

    this.isOpen = false;
    this.modal.classList.remove("active");
    this.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    this.selectedIndex = -1;

    if (this.input) {
      this.input.value = "";
    }

    this.showQuickActions();
  }

  debounceSearch(query) {
    window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.search(query);
    }, 130);
  }

  search(query) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      this.showQuickActions();
      return;
    }

    const words = normalized.split(/\s+/).filter(Boolean);

    const scoredResults = this.searchData
      .map((item) => ({ item, score: this.calculateScore(item, words, normalized) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((result) => result.item);

    this.renderResults(scoredResults, words);

    if (typeof window.gtag === "function") {
      window.gtag("event", "search", {
        search_term: normalized,
        results_count: scoredResults.length
      });
    }
  }

  calculateScore(item, words, fullQuery) {
    const title = item.title.toLowerCase();
    const description = item.description.toLowerCase();
    const keywords = item.keywords.join(" ").toLowerCase();
    const category = item.category.toLowerCase();
    const haystack = `${title} ${description} ${keywords} ${category}`;

    let score = 0;

    words.forEach((word) => {
      if (title.includes(word)) score += 7;
      if (description.includes(word)) score += 4;
      if (keywords.includes(word)) score += 3;
      if (category.includes(word)) score += 2;
    });

    if (title.includes(fullQuery)) {
      score += 10;
    }

    if (haystack.includes(fullQuery)) {
      score += 4;
    }

    if (!words.every((word) => haystack.includes(word))) {
      score -= 12;
    }

    return score;
  }

  renderResults(results, words) {
    if (!this.resultsContainer) {
      return;
    }

    if (!results.length) {
      this.resultsContainer.innerHTML = `
        <div class="search-no-results">
          <h4>لا توجد نتائج مطابقة</h4>
          <p>جرّب كلمات بحث مختلفة أو اختر من الروابط الشائعة.</p>
        </div>
      `;
      this.selectedIndex = -1;
      return;
    }

    const grouped = new Map();
    results.forEach((item) => {
      const key = item.category || "أخرى";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(item);
    });

    let html = "";

    grouped.forEach((items, category) => {
      html += `
        <div class="search-category">
          <div class="search-category-title">${this.escapeHtml(category)}</div>
          ${items.map((item) => this.renderResultItem(item, words)).join("")}
        </div>
      `;
    });

    this.resultsContainer.innerHTML = html;
    this.selectedIndex = -1;
  }

  renderResultItem(item, words) {
    const iconByType = {
      service: "⚡",
      solution: "◈",
      page: "•",
      article: "✦"
    };

    const icon = iconByType[item.type] || "•";

    return `
      <a href="${this.escapeAttribute(item.url)}" class="search-result-item" data-id="${this.escapeAttribute(item.id)}">
        <div class="search-result-icon">${icon}</div>
        <div class="search-result-content">
          <div class="search-result-title">${this.highlight(item.title, words)}</div>
          <div class="search-result-desc">${this.highlight(item.description, words)}</div>
          <div class="search-result-meta">${this.escapeHtml(item.category)}</div>
        </div>
        <span class="search-result-arrow" aria-hidden="true">↵</span>
      </a>
    `;
  }

  showQuickActions() {
    if (!this.resultsContainer) {
      return;
    }

    const quickLinks = [
      { title: "الأتمتة الذكية", url: "/frontend/pages/smart-automation/index.html" },
      { title: "تحليل البيانات", url: "/frontend/pages/data-analysis/index.html" },
      { title: "AI للمنشآت", url: "/frontend/pages/ai-agent/index.html" },
      { title: "سير العمل بالذكاء الاصطناعي", url: "/frontend/pages/ai-workflows/index.html" },
      { title: "الأدوات الذكية", url: "/frontend/pages/tools/index.html" },
      { title: "تواصل معنا", url: "/frontend/pages/contact/index.html" }
    ];

    this.resultsContainer.innerHTML = `
      <div class="search-quick-actions" id="quickActions">
        <div class="search-quick-title">عمليات بحث شائعة</div>
        <div class="search-quick-links">
          ${quickLinks
            .map(
              (link) =>
                `<a href="${this.escapeAttribute(link.url)}" class="search-quick-link">${this.escapeHtml(link.title)}</a>`
            )
            .join("")}
        </div>
      </div>
    `;

    this.selectedIndex = -1;
  }

  handleResultsKeyboard(event) {
    const resultItems = this.resultsContainer.querySelectorAll(".search-result-item");
    if (!resultItems.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, resultItems.length - 1);
      this.updateSelection(resultItems);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.updateSelection(resultItems);
      return;
    }

    if (event.key === "Enter" && this.selectedIndex >= 0) {
      event.preventDefault();
      const activeItem = resultItems[this.selectedIndex];
      if (activeItem) {
        activeItem.click();
      }
    }
  }

  updateSelection(items) {
    items.forEach((item, index) => {
      const isActive = index === this.selectedIndex;
      item.classList.toggle("active", isActive);
      if (isActive) {
        item.scrollIntoView({ block: "nearest" });
      }
    });
  }

  highlight(text, words) {
    const escaped = this.escapeHtml(text);
    if (!words.length) {
      return escaped;
    }

    let output = escaped;
    words.forEach((word) => {
      if (!word) {
        return;
      }

      const expression = new RegExp(`(${this.escapeRegex(this.escapeHtml(word))})`, "gi");
      output = output.replace(expression, "<mark>$1</mark>");
    });

    return output;
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  escapeAttribute(value) {
    return this.escapeHtml(value).replace(/`/g, "&#96;");
  }
}

function initBrightSearch() {
  if (window.brightSearch instanceof BrightSearch) {
    window.brightSearch.ensureSearchTriggers();
    return;
  }

  window.brightSearch = new BrightSearch();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBrightSearch, { once: true });
} else {
  initBrightSearch();
}
