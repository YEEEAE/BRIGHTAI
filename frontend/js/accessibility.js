document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  let fontScale = localStorage.getItem("brightai_font_scale")
    ? parseFloat(localStorage.getItem("brightai_font_scale"))
    : 1;

  const controlLabels = {
    increaseFontBtn: "تكبير الخط",
    decreaseFontBtn: "تصغير الخط",
    resetFontBtn: "إعادة حجم الخط الافتراضي",
    themeToggleBtn: "تبديل المظهر",
    chatMin: "تصغير المحادثة",
    chatClose: "إغلاق المحادثة",
    chatClear: "مسح المحادثة",
    chatSend: "إرسال الرسالة",
    cookieOk: "قبول ملفات تعريف الارتباط",
  };

  const socialLabels = [
    {
      pattern: /linkedin\.com/i,
      label: "زيارة صفحة Bright AI على لينكدإن",
    },
    {
      pattern: /(^https?:\/\/)?x\.com\//i,
      label: "زيارة حساب Bright AI على منصة إكس",
    },
    {
      pattern: /youtube\.com/i,
      label: "زيارة قناة Bright AI على يوتيوب",
    },
    {
      pattern: /api\.whatsapp\.com/i,
      label: "بدء التواصل مع Bright AI عبر واتساب",
    },
    {
      pattern: /mailto:/i,
      label: "إرسال بريد إلى Bright AI",
    },
  ];

  const increaseFontBtn = document.getElementById("increaseFontBtn");
  const decreaseFontBtn = document.getElementById("decreaseFontBtn");
  const resetFontBtn = document.getElementById("resetFontBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  const syncFontButtonsState = () => {
    const activeClasses = ["bg-indigo-600", "text-white"];
    [increaseFontBtn, decreaseFontBtn, resetFontBtn].forEach((button) => {
      if (button) {
        button.classList.remove(...activeClasses);
      }
    });

    if (fontScale > 1.01 && increaseFontBtn) {
      increaseFontBtn.classList.add(...activeClasses);
    } else if (fontScale < 0.99 && decreaseFontBtn) {
      decreaseFontBtn.classList.add(...activeClasses);
    } else if (resetFontBtn) {
      resetFontBtn.classList.add(...activeClasses);
    }
  };

  const applyFontScale = (nextScale) => {
    root.style.fontSize = `${100 * nextScale}%`;
    localStorage.setItem("brightai_font_scale", String(nextScale));
    syncFontButtonsState();
  };

  const syncThemeIcon = (theme) => {
    if (!themeToggleBtn) {
      return;
    }

    const icon = themeToggleBtn.querySelector("iconify-icon");
    if (icon) {
      icon.setAttribute("icon", theme === "light" ? "lucide:sun" : "lucide:moon");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
    }

    themeToggleBtn.setAttribute(
      "aria-label",
      theme === "light" ? "تفعيل المظهر الداكن" : "تفعيل المظهر الفاتح",
    );
  };

  if (increaseFontBtn) {
    increaseFontBtn.addEventListener("click", () => {
      if (fontScale < 1.25) {
        fontScale += 0.05;
        applyFontScale(fontScale);
      }
    });
  }

  if (decreaseFontBtn) {
    decreaseFontBtn.addEventListener("click", () => {
      if (fontScale > 0.85) {
        fontScale -= 0.05;
        applyFontScale(fontScale);
      }
    });
  }

  if (resetFontBtn) {
    resetFontBtn.addEventListener("click", () => {
      fontScale = 1;
      applyFontScale(fontScale);
    });
  }

  applyFontScale(fontScale);

  const initialTheme = localStorage.getItem("brightai_theme") || "dark";
  if (initialTheme === "light") {
    document.body.classList.add("light-theme");
  }
  syncThemeIcon(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const theme = document.body.classList.toggle("light-theme") ? "light" : "dark";
      localStorage.setItem("brightai_theme", theme);
      syncThemeIcon(theme);
    });
  }

  const applyAccessibleLabel = (element) => {
    if (!element || element.getAttribute("aria-label")) {
      return;
    }

    const byId = element.id ? controlLabels[element.id] : null;
    if (byId) {
      element.setAttribute("aria-label", byId);
      return;
    }

    const title = element.getAttribute("title");
    if (title) {
      element.setAttribute("aria-label", title);
      return;
    }

    if (element.tagName === "A") {
      const href = element.getAttribute("href") || "";
      const socialMatch = socialLabels.find(({ pattern }) => pattern.test(href));
      if (socialMatch) {
        element.setAttribute("aria-label", socialMatch.label);
        return;
      }
    }

    const text = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (text) {
      element.setAttribute("aria-label", text);
      return;
    }

    const iconName = element.querySelector("iconify-icon")?.getAttribute("icon") || "";
    if (/search/i.test(iconName)) {
      element.setAttribute("aria-label", "البحث في الموقع");
    } else if (/menu|align-justify/i.test(iconName)) {
      element.setAttribute("aria-label", "فتح القائمة");
    } else if (/send/i.test(iconName)) {
      element.setAttribute("aria-label", "إرسال");
    } else if (/minus/i.test(iconName)) {
      element.setAttribute("aria-label", "تصغير العنصر");
    } else if (/x|close/i.test(iconName)) {
      element.setAttribute("aria-label", "إغلاق العنصر");
    }
  };

  const hideDecorativeIcons = (scope = document) => {
    scope.querySelectorAll("button iconify-icon, a iconify-icon, button i, a i, button svg, a svg").forEach((icon) => {
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
    });
  };

  const syncTabs = () => {
    document.querySelectorAll(".tabs[role='tablist']").forEach((tabList) => {
      const tabs = Array.from(tabList.querySelectorAll(".tab[role='tab']"));
      tabs.forEach((tab, index) => {
        tab.setAttribute("aria-selected", String(tab.classList.contains("active")));
        tab.setAttribute("tabindex", tab.classList.contains("active") ? "0" : "-1");

        if (!tab.dataset.a11yBound) {
          tab.dataset.a11yBound = "true";
          tab.addEventListener("click", () => {
            requestAnimationFrame(() => {
              tabs.forEach((item) => {
                item.setAttribute("aria-selected", String(item.classList.contains("active")));
                item.setAttribute("tabindex", item.classList.contains("active") ? "0" : "-1");
              });
            });
          });

          tab.addEventListener("keydown", (event) => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
              return;
            }

            let nextIndex = index;
            if (event.key === "Home") {
              nextIndex = 0;
            } else if (event.key === "End") {
              nextIndex = tabs.length - 1;
            } else if (event.key === "ArrowRight") {
              nextIndex = index + 1 >= tabs.length ? 0 : index + 1;
            } else if (event.key === "ArrowLeft") {
              nextIndex = index - 1 < 0 ? tabs.length - 1 : index - 1;
            }

            event.preventDefault();
            tabs[nextIndex]?.focus();
            tabs[nextIndex]?.click();
          });
        }
      });
    });
  };

  const syncFilters = () => {
    document.querySelectorAll(".filters").forEach((filtersContainer) => {
      const filters = Array.from(filtersContainer.querySelectorAll(".filter"));
      filters.forEach((filter) => {
        filter.setAttribute("aria-pressed", String(filter.classList.contains("active")));
        if (!filter.dataset.a11yBound) {
          filter.dataset.a11yBound = "true";
          filter.addEventListener("click", () => {
            requestAnimationFrame(() => {
              filters.forEach((item) => {
                item.setAttribute("aria-pressed", String(item.classList.contains("active")));
              });
            });
          });
        }
      });
    });
  };

  document.querySelectorAll("button, a").forEach((element) => {
    applyAccessibleLabel(element);
  });

  hideDecorativeIcons();
  syncTabs();
  syncFilters();
});
