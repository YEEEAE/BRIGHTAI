(() => {
  const INIT_FLAG = "__brightAccessibilityReady";
  if (window[INIT_FLAG]) return;
  window[INIT_FLAG] = true;

  const STORAGE_KEYS = {
    fontScale: "brightai_font_scale",
    theme: "brightai_theme"
  };

  const CONTROL_LABELS = {
    increaseFontBtn: "تكبير الخط",
    decreaseFontBtn: "تصغير الخط",
    resetFontBtn: "إعادة حجم الخط الافتراضي",
    themeToggleBtn: "تبديل المظهر",
    chatMin: "تصغير المحادثة",
    chatClose: "إغلاق المحادثة",
    chatClear: "مسح المحادثة",
    chatSend: "إرسال الرسالة",
    cookieOk: "قبول ملفات تعريف الارتباط"
  };

  const SOCIAL_LABELS = [
    { pattern: /linkedin\.com/i, label: "زيارة صفحة Bright AI على لينكدإن" },
    { pattern: /(^https?:\/\/)?x\.com\//i, label: "زيارة حساب Bright AI على منصة إكس" },
    { pattern: /youtube\.com/i, label: "زيارة قناة Bright AI على يوتيوب" },
    { pattern: /api\.whatsapp\.com|wa\.me/i, label: "بدء التواصل مع Bright AI عبر واتساب" },
    { pattern: /mailto:/i, label: "إرسال بريد إلى Bright AI" }
  ];

  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const escapeSelector = (value) => {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }

    return String(value).replace(/["\\]/g, "\\$&");
  };

  const getStoredFontScale = () => {
    const value = Number.parseFloat(localStorage.getItem(STORAGE_KEYS.fontScale) || "1");
    return Number.isFinite(value) ? Math.max(0.85, Math.min(1.25, value)) : 1;
  };

  const inferIconLabel = (element) => {
    const href = element.tagName === "A" ? element.getAttribute("href") || "" : "";
    const iconName = element.querySelector("iconify-icon")?.getAttribute("icon") || "";
    const descriptor = `${element.id || ""} ${element.className || ""} ${href} ${iconName}`.toLowerCase();

    if (/api\.whatsapp|wa\.me|whatsapp|message-circle/.test(descriptor)) return "بدء التواصل مع Bright AI عبر واتساب";
    if (/mailto:|mail/.test(descriptor)) return "إرسال بريد إلى Bright AI";
    if (/linkedin/.test(descriptor)) return "زيارة صفحة Bright AI على لينكدإن";
    if (/(^|\s|\/)x\.com|twitter/.test(descriptor)) return "زيارة حساب Bright AI على منصة إكس";
    if (/youtube/.test(descriptor)) return "زيارة قناة Bright AI على يوتيوب";
    if (/search/.test(descriptor)) return "البحث في الموقع";
    if (/menu|align-justify|hamburger/.test(descriptor)) return "فتح القائمة";
    if (/send|paper-plane/.test(descriptor)) return "إرسال الرسالة";
    if (/minus|minimize/.test(descriptor)) return "تصغير النافذة";
    if (/(^|\s|:)x($|\s)|close|times/.test(descriptor)) return "إغلاق النافذة";
    if (/external-link|arrow-up-left|arrow-up-right/.test(descriptor) && href) return "فتح الرابط";
    return "";
  };

  const applyAccessibleLabel = (element) => {
    if (!element || element.getAttribute("aria-label")) return;

    const byId = element.id ? CONTROL_LABELS[element.id] : null;
    if (byId) {
      element.setAttribute("aria-label", byId);
      return;
    }

    const title = normalizeText(element.getAttribute("title"));
    if (title) {
      element.setAttribute("aria-label", title);
      return;
    }

    if (element.tagName === "A") {
      const href = element.getAttribute("href") || "";
      const socialMatch = SOCIAL_LABELS.find(({ pattern }) => pattern.test(href));
      if (socialMatch) {
        element.setAttribute("aria-label", socialMatch.label);
        return;
      }
    }

    const text = normalizeText(element.textContent);
    if (text) {
      element.setAttribute("aria-label", text);
      return;
    }

    const iconLabel = inferIconLabel(element);
    if (iconLabel) element.setAttribute("aria-label", iconLabel);
  };

  const hasExplicitLabel = (field) => {
    if (field.labels?.length) return true;
    const labelledBy = field.getAttribute("aria-labelledby");
    return Boolean(labelledBy && document.getElementById(labelledBy));
  };

  const getFieldLabel = (field) => {
    const directLabel = normalizeText(field.getAttribute("aria-label"));
    if (directLabel) return directLabel;

    const placeholder = normalizeText(field.getAttribute("placeholder"));
    if (placeholder) return placeholder;

    const name = normalizeText(field.getAttribute("name"));
    if (name) return name;

    if (field.type === "file") return "رفع ملف";
    if (field.type === "search") return "البحث";
    return "";
  };

  const ensureFormLabel = (field, index) => {
    if (!field || field.type === "hidden" || hasExplicitLabel(field)) return;

    const labelText = getFieldLabel(field);
    if (!labelText) return;

    if (!field.id) field.id = `brightai-field-${index + 1}`;
    if (document.querySelector(`label[for="${escapeSelector(field.id)}"]`)) return;

    const label = document.createElement("label");
    label.className = "sr-only";
    label.setAttribute("for", field.id);
    label.textContent = labelText;
    field.insertAdjacentElement("beforebegin", label);
  };

  const hideDecorativeIcons = (scope = document) => {
    scope.querySelectorAll("button iconify-icon, a iconify-icon, button i, a i, button svg, a svg").forEach((icon) => {
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
    });
  };

  const syncDecorativeImages = (scope = document) => {
    scope.querySelectorAll("img[aria-hidden='true'], img[role='presentation'], img[role='none'], img.decorative").forEach((image) => {
      image.setAttribute("alt", "");
    });
  };

  const syncInteractiveImages = (scope = document) => {
    scope.querySelectorAll("img[role='button'], img[tabindex='0'][data-full]").forEach((image) => {
      const altText = normalizeText(image.getAttribute("alt"));
      if (altText && !image.getAttribute("aria-label")) {
        image.setAttribute("aria-label", `فتح معاينة: ${altText}`);
      }
    });
  };

  const syncTabs = (scope = document) => {
    scope.querySelectorAll(".tabs[role='tablist']").forEach((tabList) => {
      tabList.querySelectorAll(".tab[role='tab']").forEach((tab) => {
        const isActive = tab.classList.contains("active");
        tab.setAttribute("aria-selected", String(isActive));
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
      });
    });
  };

  const syncFilters = (scope = document) => {
    scope.querySelectorAll(".filters .filter").forEach((filter) => {
      filter.setAttribute("aria-pressed", String(filter.classList.contains("active")));
    });
  };

  const scanAccessibility = (scope = document) => {
    scope.querySelectorAll("button, a").forEach(applyAccessibleLabel);
    scope.querySelectorAll("input, select, textarea").forEach(ensureFormLabel);
    syncDecorativeImages(scope);
    syncInteractiveImages(scope);
    hideDecorativeIcons(scope);
    syncTabs(scope);
    syncFilters(scope);
  };

  const initFontControls = () => {
    const root = document.documentElement;
    const increaseFontBtn = document.getElementById("increaseFontBtn");
    const decreaseFontBtn = document.getElementById("decreaseFontBtn");
    const resetFontBtn = document.getElementById("resetFontBtn");
    let fontScale = getStoredFontScale();

    const syncFontButtonsState = () => {
      const activeClasses = ["bg-indigo-600", "text-white"];
      [increaseFontBtn, decreaseFontBtn, resetFontBtn].forEach((button) => button?.classList.remove(...activeClasses));

      if (fontScale > 1.01) increaseFontBtn?.classList.add(...activeClasses);
      else if (fontScale < 0.99) decreaseFontBtn?.classList.add(...activeClasses);
      else resetFontBtn?.classList.add(...activeClasses);
    };

    const applyFontScale = (nextScale) => {
      fontScale = Math.max(0.85, Math.min(1.25, Number(nextScale) || 1));
      root.style.fontSize = `${100 * fontScale}%`;
      localStorage.setItem(STORAGE_KEYS.fontScale, String(fontScale));
      syncFontButtonsState();
    };

    increaseFontBtn?.addEventListener("click", () => applyFontScale(fontScale + 0.05));
    decreaseFontBtn?.addEventListener("click", () => applyFontScale(fontScale - 0.05));
    resetFontBtn?.addEventListener("click", () => applyFontScale(1));
    applyFontScale(fontScale);
  };

  const initThemeToggle = () => {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const syncThemeIcon = (theme) => {
      if (!themeToggleBtn) return;

      const icon = themeToggleBtn.querySelector("iconify-icon");
      if (icon) {
        icon.setAttribute("icon", theme === "light" ? "lucide:sun" : "lucide:moon");
        icon.setAttribute("aria-hidden", "true");
        icon.setAttribute("focusable", "false");
      }

      themeToggleBtn.setAttribute("aria-label", theme === "light" ? "تفعيل المظهر الداكن" : "تفعيل المظهر الفاتح");
    };

    const initialTheme = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
    if (initialTheme === "light") document.body.classList.add("light-theme");
    syncThemeIcon(initialTheme);

    themeToggleBtn?.addEventListener("click", () => {
      const theme = document.body.classList.toggle("light-theme") ? "light" : "dark";
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      syncThemeIcon(theme);
    });
  };

  const initReducedMotion = () => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      document.documentElement.dataset.reducedMotion = String(query.matches);
    };
    sync();
    query.addEventListener?.("change", sync);
  };

  const bindDelegatedInteractions = () => {
    document.addEventListener("click", (event) => {
      const tab = event.target.closest(".tabs[role='tablist'] .tab[role='tab']");
      if (tab) {
        window.requestAnimationFrame(() => syncTabs(tab.closest(".tabs[role='tablist']")));
        return;
      }

      const filter = event.target.closest(".filters .filter");
      if (filter) {
        window.requestAnimationFrame(() => syncFilters(filter.closest(".filters")));
      }
    });

    document.addEventListener("keydown", (event) => {
      const image = event.target.closest("img[role='button'], img[tabindex='0'][data-full]");
      if (image && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        image.click();
        return;
      }

      const tab = event.target.closest(".tabs[role='tablist'] .tab[role='tab']");
      if (!tab || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;

      const tabs = Array.from(tab.closest(".tabs[role='tablist']").querySelectorAll(".tab[role='tab']"));
      const index = tabs.indexOf(tab);
      let nextIndex = index;

      if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else if (event.key === "ArrowRight") nextIndex = index + 1 >= tabs.length ? 0 : index + 1;
      else if (event.key === "ArrowLeft") nextIndex = index - 1 < 0 ? tabs.length - 1 : index - 1;

      event.preventDefault();
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    });
  };

  const init = () => {
    initFontControls();
    initReducedMotion();
    initThemeToggle();
    bindDelegatedInteractions();
    scanAccessibility();

    // فحص مؤجل خفيف يلتقط العناصر التي تضيفها السكربتات المؤجلة بدون MutationObserver دائم.
    window.requestAnimationFrame(() => scanAccessibility());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
