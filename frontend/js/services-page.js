(function () {
    function setActiveQuickFilter(category) {
        document.querySelectorAll("[data-quick-filter]").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.quickFilter === category);
        });
    }

    function bindQuickFilters() {
        const buttons = document.querySelectorAll("[data-quick-filter]");
        if (!buttons.length) return;

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                const category = button.dataset.quickFilter || "all";
                setActiveQuickFilter(category);

                if (typeof window.filterProducts === "function") {
                    window.filterProducts(category);
                }

                const products = document.getElementById("products");
                if (products) {
                    products.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });
    }

    function syncCatalog(state) {
        const label = document.getElementById("catalogActiveLabel");
        const summary = document.getElementById("catalogActiveSummary");
        const count = document.getElementById("catalogCount");
        const primaryLink = document.getElementById("catalogPrimaryLink");
        const primaryText = document.getElementById("catalogPrimaryText");

        if (!label || !summary || !count || !primaryLink || !primaryText || !state) return;

        const isAll = state.currentCategory === "all";
        const meta = isAll
            ? {
                  summary: "استعرض الكتالوج كامل ثم صفّ المسار الأنسب حسب أولويتك التشغيلية.",
                  ctaHref: "/consultation",
                  ctaLabel: "اطلب جلسة تشخيص"
              }
            : state.getCategoryMeta(state.currentCategory);

        label.textContent = isAll
            ? "كل الخدمات"
            : (state.categoryTranslations[state.currentCategory] || state.currentCategory);
        summary.textContent = meta.summary;
        count.textContent = String(state.count);
        primaryLink.href = meta.ctaHref || "/consultation";
        primaryText.textContent = meta.ctaLabel || "اطلب جلسة تشخيص";

        setActiveQuickFilter(state.currentCategory);
    }

    window.BrightServicesPage = {
        syncCatalog
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindQuickFilters, { once: true });
    } else {
        bindQuickFilters();
    }
})();
