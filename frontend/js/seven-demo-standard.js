(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function initHeader() {
    const header = $("[data-smart-header]");
    const toggle = $("[data-menu-toggle]", header || document);
    const panel = $("[data-menu-panel]", header || document);
    if (!header || !toggle || !panel) return;

    const setScrolled = () => {
      const doc = document.documentElement;
      const progress = doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight);
      header.classList.toggle("is-scrolled", progress >= 0.3);
    };

    const close = () => {
      header.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const open = !header.classList.contains("menu-open");
      header.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector("a,button")?.focus();
    });

    document.addEventListener("keydown", (event) => {
      if (!header.classList.contains("menu-open")) return;
      if (event.key === "Escape") {
        close();
        toggle.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = $$("a,button", panel).filter((node) => !node.disabled);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    panel.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    window.addEventListener("scroll", setScrolled, { passive: true });
    setScrolled();
  }

  function initFormHelpers() {
    const input = $("#demo-input");
    const counter = $("[data-input-counter]");
    const form = $("[data-demo-form]");
    if (!input || !counter || !form) return;
    const update = () => {
      const length = input.value.trim().length;
      counter.textContent = `${length} / ${input.maxLength || 1200} حرف`;
      counter.dataset.state = length < 20 ? "error" : "success";
    };
    input.addEventListener("input", update);
    update();
    form.addEventListener("submit", (event) => {
      if (input.value.trim().length < 20) {
        event.preventDefault();
        input.setAttribute("aria-invalid", "true");
        counter.textContent = "اكتب ٢٠ حرفاً على الأقل حتى يكون التحليل مفيداً.";
        input.focus();
      } else {
        input.removeAttribute("aria-invalid");
      }
    }, true);
    document.addEventListener("click", (event) => {
      const jump = event.target.closest("[data-jump-demo]");
      if (!jump) return;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function reportText() {
    const report = window.__brightAiLastReport;
    if (report?.result) {
      return [
        report.config.title,
        "",
        "Executive Summary",
        ...(report.result.executiveSummary || []),
        "",
        "Key Findings",
        ...(report.result.keyInsights || []),
        "",
        "Risks & Considerations",
        ...(report.result.risks || []),
        "",
        "Recommendations",
        ...(report.result.recommendedActions || []),
        "",
        "Next Best Actions",
        ...(report.result.nextSteps || [])
      ].join("\n");
    }
    return $(".result-panel")?.innerText?.trim() || document.title;
  }

  function initReportActions() {
    document.addEventListener("click", async (event) => {
      if (!event.target.closest("[data-copy-report]")) return;
      try {
        await navigator.clipboard.writeText(reportText());
        event.target.closest("[data-copy-report]").textContent = "تم نسخ التقرير";
      } catch {
        event.target.closest("[data-copy-report]").textContent = "تعذر النسخ";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initHeader();
      initFormHelpers();
      initReportActions();
    }, { once: true });
  } else {
    initHeader();
    initFormHelpers();
    initReportActions();
  }
})();
