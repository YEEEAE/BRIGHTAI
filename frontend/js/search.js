class BrightSearch {
  constructor() {
    this.modal = null;
    this.input = null;
    this.resultsContainer = null;
    this.isOpen = false;
    this.selectedIndex = -1;
    this.apiEndpoint = "/api/ai/search";
    this.requestController = null;
    this.lastSearchToken = 0;
    this.debounceTimer = null;
    this.lastRenderedKey = "";
    this.localResultCache = new Map();
    this.searchData = this.getSearchIndex().map((item) => this.prepareSearchItem(item));
    this.boundGlobalKeydown = this.handleGlobalKeydown.bind(this);
    this.boundModalClick = this.handleModalClick.bind(this);
    this.boundInput = (event) => this.debounceSearch(event.target.value || "");
    this.boundInputKeydown = (event) => this.handleResultsKeyboard(event);
    this.init();
  }

  getSearchIndex() {
    return [
      { id: "smart-automation", type: "service", title: "الأتمتة الذكية", description: "أتمتة العمليات التشغيلية ورفع الكفاءة باستخدام الذكاء الاصطناعي", keywords: ["أتمتة", "RPA", "تشغيل", "كفاءة", "عمليات"], url: "/smart-automation/", category: "الخدمات" },
      { id: "data-analysis", type: "service", title: "تحليل البيانات", description: "تحليلات متقدمة ولوحات مؤشرات تدعم القرار التجاري", keywords: ["بيانات", "تحليل", "تقارير", "مؤشرات", "ذكاء أعمال"], url: "/data-analysis/", category: "الخدمات" },
      { id: "ai-agent", type: "service", title: "AI للمنشآت", description: "وكلاء ذكاء اصطناعي مخصصون للعمليات اليومية", keywords: ["وكيل", "Agent", "منشآت", "تشغيل", "AIaaS"], url: "/ai-agent/", category: "الخدمات" },
      { id: "smart-medical-archive", type: "service", title: "الأرشيف الطبي الذكي", description: "نظام إدارة سجلات طبية ذكي للمستشفيات والمراكز الصحية", keywords: ["طبي", "صحي", "مستشفيات", "سجلات", "أرشفة"], url: "/demo/smart-medical-archive/", category: "الخدمات" },
      { id: "ai-workflows", type: "service", title: "سير العمل بالذكاء الاصطناعي", description: "بناء تدفقات ذكية تربط الفرق والأنظمة وتقلل زمن التنفيذ", keywords: ["workflow", "سير العمل", "تدفق", "إنتاجية"], url: "/ai-workflows/", category: "الخدمات" },
      { id: "consultation", type: "service", title: "الاستشارات التقنية", description: "خطة تحول عملية للذكاء الاصطناعي في السوق السعودي", keywords: ["استشارات", "تحول", "خطة", "تنفيذ"], url: "/consultation/", category: "الخدمات" },
      { id: "ai-bots", type: "solution", title: "روبوتات الذكاء الاصطناعي", description: "نماذج بوتات جاهزة لخدمة العملاء والمبيعات والتوظيف", keywords: ["بوت", "روبوت", "محادثة", "خدمة العملاء"], url: "/docs/ai-bots/", category: "الحلول" },
      { id: "our-products", type: "solution", title: "منتجات وخدمات Bright AI", description: "كتالوج حلول الذكاء الاصطناعي للشركات والمنشآت", keywords: ["منتجات", "خدمات", "اشتراكات", "حلول"], url: "/services/", category: "الحلول" },
      { id: "tools", type: "solution", title: "الأدوات الذكية", description: "أدوات مجانية وتجريبية للتحليل والتشغيل", keywords: ["أدوات", "مجانية", "تحليل", "تجربة"], url: "/tools/", category: "الحلول" },
      { id: "what-is-ai", type: "page", title: "ما هو الذكاء الاصطناعي؟", description: "دليل مبسط لفهم المفاهيم والتطبيقات في الأعمال", keywords: ["تعريف", "ذكاء اصطناعي", "تعلم الآلة", "AI"], url: "/what-is-ai/", category: "المعرفة" },
      { id: "about-us", type: "page", title: "من نحن", description: "تعرف على Bright AI وفريق العمل والرؤية", keywords: ["شركة", "فريق", "رؤية", "Bright AI"], url: "/about/", category: "الشركة" },
      { id: "contact", type: "page", title: "تواصل معنا", description: "احجز استشارة وتواصل مع فريق Bright AI", keywords: ["اتصال", "تواصل", "واتساب", "استشارة"], url: "/contact/", category: "الشركة" },
      { id: "blog", type: "page", title: "المكتبة الذكية", description: "مقالات ودراسات تطبيقية حول الذكاء الاصطناعي", keywords: ["مدونة", "مقالات", "دراسات", "محتوى"], url: "/blog/", category: "المعرفة" },
      { id: "docs", type: "page", title: "المستندات", description: "التوثيق الرسمي والواجهات الفنية", keywords: ["docs", "توثيق", "دليل", "API"], url: "/docs/", category: "المعرفة" },
      { id: "home", type: "page", title: "الصفحة الرئيسية", description: "بوابة Bright AI الرئيسية", keywords: ["رئيسية", "Bright AI", "حلول", "ذكاء اصطناعي"], url: "/", category: "الشركة" }
    ];
  }

  init() {
    this.ensureSearchModal();
    this.ensureSearchTriggers();
    this.bindEvents();
    this.showQuickActions();
  }

  normalizeUrl(value) {
    if (!value) return "/";
    return /^https?:\/\//i.test(value) || value.startsWith("/")
      ? value
      : `/${value.replace(/^\.?\/?/, "")}`;
  }

  normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  prepareSearchItem(item) {
    const url = this.normalizeUrl(item.url);
    const searchableText = this.normalizeText([
      item.title,
      item.description,
      item.category,
      ...(Array.isArray(item.keywords) ? item.keywords : [])
    ].join(" "));

    return {
      ...item,
      url,
      _title: this.normalizeText(item.title),
      _description: this.normalizeText(item.description),
      _category: this.normalizeText(item.category),
      _keywords: this.normalizeText((item.keywords || []).join(" ")),
      _searchableText: searchableText
    };
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
          <input type="text" class="search-input" id="searchInput" placeholder="اسأل مثلاً: ما حلول الأتمتة للمستشفيات؟" autocomplete="off" />
          <button class="search-close-btn" data-search-close="true" type="button" aria-label="إغلاق البحث">ESC</button>
        </div>
        <div class="search-results" id="searchResults"></div>
        <div class="search-footer">
          <div class="search-footer-nav">
            <span><kbd>↑</kbd><kbd>↓</kbd> للتنقل</span>
            <span><kbd>↵</kbd> للفتح</span>
            <span><kbd>ESC</kbd> للإغلاق</span>
          </div>
          <div class="search-footer-powered">Bright AI RAG Search</div>
        </div>
      </div>
    `;
  }

  ensureSearchTriggers() {
    document.querySelectorAll(".nav-container").forEach((container) => {
      let desktopTrigger = container.querySelector(".search-trigger");
      let mobileTrigger = container.querySelector(".mobile-search-btn");

      if (!desktopTrigger) {
        desktopTrigger = document.createElement("button");
        desktopTrigger.className = "search-trigger";
        desktopTrigger.type = "button";
        desktopTrigger.setAttribute("aria-label", "فتح البحث");
        desktopTrigger.innerHTML = `
          <span aria-hidden="true">⌕</span>
          <span>ابحث في الموقع...</span>
          <span class="search-shortcut">⌘K</span>
        `;
      }

      if (!mobileTrigger) {
        mobileTrigger = document.createElement("button");
        mobileTrigger.className = "mobile-search-btn";
        mobileTrigger.type = "button";
        mobileTrigger.setAttribute("aria-label", "فتح البحث");
        mobileTrigger.textContent = "⌕";
      }

      const actions = container.querySelector(".nav-actions");
      const cta = container.querySelector(".nav-btn");
      if (actions) {
        if (!desktopTrigger.isConnected) actions.insertAdjacentElement("afterbegin", desktopTrigger);
        if (!mobileTrigger.isConnected) {
          cta ? cta.insertAdjacentElement("beforebegin", mobileTrigger) : actions.appendChild(mobileTrigger);
        }
      } else if (cta?.parentElement) {
        if (!desktopTrigger.isConnected) cta.insertAdjacentElement("beforebegin", desktopTrigger);
        if (!mobileTrigger.isConnected) cta.insertAdjacentElement("beforebegin", mobileTrigger);
      }
    });

    document.querySelectorAll(".search-trigger, .mobile-search-btn").forEach((trigger) => {
      if (trigger.dataset.searchBound === "true") return;
      trigger.dataset.searchBound = "true";
      trigger.addEventListener("click", () => this.open(), { passive: true });
    });
  }

  bindEvents() {
    document.removeEventListener("keydown", this.boundGlobalKeydown);
    document.addEventListener("keydown", this.boundGlobalKeydown);

    this.modal.removeEventListener("click", this.boundModalClick);
    this.modal.addEventListener("click", this.boundModalClick);

    this.input.removeEventListener("input", this.boundInput);
    this.input.addEventListener("input", this.boundInput);

    this.input.removeEventListener("keydown", this.boundInputKeydown);
    this.input.addEventListener("keydown", this.boundInputKeydown);
  }

  handleModalClick(event) {
    if (event.target.closest("[data-search-close='true']")) {
      this.close();
      return;
    }

    if (event.target.closest("a")) {
      this.close();
    }
  }

  handleGlobalKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.toggle();
      return;
    }

    if (event.key === "Escape" && this.isOpen) {
      this.close();
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (!this.modal) return;

    this.isOpen = true;
    this.modal.classList.add("active");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      this.input?.focus();
      this.input?.select();
    });

    if (typeof window.gtag === "function") {
      window.gtag("event", "search_open", {
        event_category: "engagement",
        event_label: "Unified Search"
      });
    }
  }

  close() {
    if (!this.modal) return;

    this.abortActiveRequest();
    window.clearTimeout(this.debounceTimer);
    this.isOpen = false;
    this.modal.classList.remove("active");
    this.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    this.selectedIndex = -1;
    this.lastRenderedKey = "";
    if (this.input) this.input.value = "";
    this.showQuickActions();
  }

  debounceSearch(value) {
    window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.search(value);
    }, 180);
  }

  async search(value) {
    const normalizedQuery = this.normalizeText(value);
    if (!normalizedQuery) {
      this.abortActiveRequest();
      this.showQuickActions();
      return;
    }

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    const localResults = this.getLocalResults(terms, normalizedQuery);
    this.renderResults(localResults, terms, "local");

    if (normalizedQuery.length < 3) return;

    const searchToken = Date.now();
    this.lastSearchToken = searchToken;
    this.renderLoadingState(localResults.length);

    const aiResult = await this.fetchAiSearch(normalizedQuery).catch(() => null);
    if (this.lastSearchToken !== searchToken || !this.isOpen) return;

    if (aiResult && (aiResult.answer || aiResult.sources?.length || aiResult.results?.length)) {
      this.renderAiResults(aiResult, terms, localResults);
    } else {
      this.renderResults(localResults, terms, "final");
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "search", {
        search_term: normalizedQuery,
        results_count: Array.isArray(aiResult?.results) ? aiResult.results.length : localResults.length
      });
    }
  }

  getLocalResults(terms, normalizedQuery) {
    const cacheKey = normalizedQuery;
    if (this.localResultCache.has(cacheKey)) {
      return this.localResultCache.get(cacheKey);
    }

    const results = this.searchData
      .map((item) => ({ item, score: this.calculateScore(item, terms, normalizedQuery) }))
      .filter((result) => result.score > 0)
      .sort((first, second) => second.score - first.score)
      .map((result) => result.item);

    this.localResultCache.set(cacheKey, results);
    if (this.localResultCache.size > 40) {
      this.localResultCache.delete(this.localResultCache.keys().next().value);
    }

    return results;
  }

  calculateScore(item, terms, normalizedQuery) {
    let score = 0;

    for (const term of terms) {
      if (item._title.includes(term)) score += 7;
      if (item._description.includes(term)) score += 4;
      if (item._keywords.includes(term)) score += 3;
      if (item._category.includes(term)) score += 2;
    }

    if (item._title.includes(normalizedQuery)) score += 10;
    if (item._searchableText.includes(normalizedQuery)) score += 4;
    if (!terms.every((term) => item._searchableText.includes(term))) score -= 12;

    return score;
  }

  abortActiveRequest() {
    if (this.requestController) {
      this.requestController.abort();
      this.requestController = null;
    }
  }

  async fetchAiSearch(query) {
    if (!this.apiEndpoint || typeof fetch !== "function") return null;

    this.abortActiveRequest();
    const controller = new AbortController();
    this.requestController = controller;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
        keepalive: false
      });

      if (!response.ok) return null;
      const payload = await response.json();
      return payload && typeof payload === "object" ? payload : null;
    } catch (error) {
      return null;
    } finally {
      if (this.requestController === controller) {
        this.requestController = null;
      }
    }
  }

  renderLoadingState(localCount) {
    if (!this.resultsContainer) return;

    const existing = localCount ? this.resultsContainer.innerHTML : "";
    this.resultsContainer.innerHTML = `
      <div class="search-loading">
        <span class="search-loading-dot" aria-hidden="true"></span>
        <span>جاري تحليل السؤال واسترجاع أفضل مصادر الموقع...</span>
      </div>
      ${existing}
    `;
    this.selectedIndex = -1;
  }

  renderAiResults(payload, terms, fallbackResults) {
    if (!this.resultsContainer) return;

    const answer = String(payload.answer || "").trim();
    const sources = Array.isArray(payload.sources) ? payload.sources.slice(0, 5) : [];
    const aiResults = (Array.isArray(payload.results) ? payload.results.slice(0, 6) : []).map((item, index) => ({
      id: `ai-related-${index + 1}`,
      type: "page",
      title: item.title || "صفحة ذات صلة",
      description: item.description || "تفاصيل أكثر داخل الصفحة.",
      url: this.normalizeUrl(item.url || "/"),
      category: "نتائج مقترحة"
    }));
    const relatedResults = aiResults.length ? aiResults : fallbackResults.slice(0, 6);
    const html = `
      <div class="search-ai-card">
        <div class="search-ai-badge">إجابة ذكية مدعومة بالمحتوى الداخلي</div>
        <div class="search-ai-answer">${this.highlight(answer || "تم العثور على نتائج مرتبطة بالسؤال.", terms)}</div>
      </div>
      ${sources.length ? `
        <div class="search-api-note">المصادر المسترجعة من صفحات Bright AI:</div>
        <div class="search-ai-sources">
          ${sources.map((source) => this.renderSourceItem(source, terms)).join("")}
        </div>
      ` : ""}
      ${relatedResults.length ? `
        <div class="search-category">
          <div class="search-category-title">روابط مرتبطة</div>
          ${relatedResults.map((item) => this.renderResultItem(item, terms)).join("")}
        </div>
      ` : ""}
    `;

    this.renderHtml(html, `ai:${answer}:${sources.length}:${relatedResults.length}`);
  }

  renderSourceItem(source, terms) {
    return `
      <a class="search-source-item" href="${this.escapeAttribute(this.normalizeUrl(source.url || "/"))}">
        <div class="search-source-title">${this.highlight(String(source.title || "مصدر"), terms)}</div>
        <div class="search-source-quote">${this.highlight(String(source.quote || "عرض الصفحة للتفاصيل الكاملة."), terms)}</div>
      </a>
    `;
  }

  renderResults(results, terms, phase = "local") {
    if (!this.resultsContainer) return;

    if (!results.length) {
      this.renderHtml(`
        <div class="search-no-results">
          <h4>لا توجد نتائج مطابقة</h4>
          <p>جرّب كلمات بحث مختلفة أو اختر من الروابط الشائعة.</p>
        </div>
      `, `${phase}:empty`);
      return;
    }

    const grouped = new Map();
    for (const item of results) {
      const category = item.category || "أخرى";
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(item);
    }

    let html = "";
    grouped.forEach((items, category) => {
      html += `
        <div class="search-category">
          <div class="search-category-title">${this.escapeHtml(category)}</div>
          ${items.map((item) => this.renderResultItem(item, terms)).join("")}
        </div>
      `;
    });

    this.renderHtml(html, `${phase}:${terms.join("|")}:${results.map((item) => item.id).join(",")}`);
  }

  renderResultItem(item, terms) {
    const icon = { service: "⚡", solution: "◈", page: "•", article: "✦" }[item.type] || "•";
    return `
      <a href="${this.escapeAttribute(item.url)}" class="search-result-item" data-id="${this.escapeAttribute(item.id)}">
        <div class="search-result-icon">${icon}</div>
        <div class="search-result-content">
          <div class="search-result-title">${this.highlight(item.title, terms)}</div>
          <div class="search-result-desc">${this.highlight(item.description, terms)}</div>
          <div class="search-result-meta">${this.escapeHtml(item.category)}</div>
        </div>
        <span class="search-result-arrow" aria-hidden="true">↵</span>
      </a>
    `;
  }

  showQuickActions() {
    if (!this.resultsContainer) return;

    const quickLinks = [
      { title: "الأتمتة الذكية", url: "/smart-automation/" },
      { title: "تحليل البيانات", url: "/data-analysis/" },
      { title: "AI للمنشآت", url: "/ai-agent/" },
      { title: "سير العمل بالذكاء الاصطناعي", url: "/ai-workflows/" },
      { title: "الأدوات الذكية", url: "/tools/" },
      { title: "تواصل معنا", url: "/contact/" }
    ];

    this.renderHtml(`
      <div class="search-quick-actions" id="quickActions">
        <div class="search-quick-title">اكتب سؤالك وسنرجع لك إجابة مع مصادر</div>
        <div class="search-quick-links">
          ${quickLinks.map((item) => `<a href="${this.escapeAttribute(item.url)}" class="search-quick-link">${this.escapeHtml(item.title)}</a>`).join("")}
        </div>
      </div>
    `, "quick");
  }

  renderHtml(html, key) {
    if (this.lastRenderedKey === key) return;
    this.resultsContainer.innerHTML = html;
    this.lastRenderedKey = key;
    this.selectedIndex = -1;
  }

  handleResultsKeyboard(event) {
    const results = this.resultsContainer.querySelectorAll(".search-result-item");
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
      this.updateSelection(results);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.updateSelection(results);
      return;
    }

    if (event.key === "Enter" && this.selectedIndex >= 0) {
      event.preventDefault();
      results[this.selectedIndex]?.click();
    }
  }

  updateSelection(results) {
    results.forEach((item, index) => {
      const isActive = index === this.selectedIndex;
      item.classList.toggle("active", isActive);
      if (isActive) item.scrollIntoView({ block: "nearest" });
    });
  }

  highlight(value, terms) {
    const escaped = this.escapeHtml(value);
    if (!terms.length) return escaped;

    let output = escaped;
    for (const term of terms) {
      if (!term) continue;
      const pattern = new RegExp(`(${this.escapeRegex(this.escapeHtml(term))})`, "gi");
      output = output.replace(pattern, "<mark>$1</mark>");
    }
    return output;
  }

  escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
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
