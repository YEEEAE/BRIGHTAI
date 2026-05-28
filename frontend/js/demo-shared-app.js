(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  ready(() => {
    const config = window.BrightAIDemoConfig.getDemoConfig();
    const root = document;
    const form = root.querySelector("[data-demo-form]");
    const panel = root.querySelector("[data-result-panel]");
    if (!form || !panel) return;

    window.BrightAIDemoA11y.hardenPageDirection();
    window.BrightAIDemoUI.bindSamples(root, config);
    const ticker = window.BrightAIDemoStreaming.createStageTicker(root);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canVibrate = "vibrate" in navigator;
    let completed = false;

    function haptic(pattern) {
      if (canVibrate) navigator.vibrate(pattern);
    }

    function focusResult() {
      panel.setAttribute("tabindex", "-1");
      panel.focus({ preventScroll: true });
      panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    function showConfetti() {
      if (reduceMotion || root.querySelector(".bai-confetti")) return;
      const confetti = document.createElement("div");
      confetti.className = "bai-confetti";
      confetti.setAttribute("aria-hidden", "true");
      for (let index = 0; index < 14; index += 1) {
        const piece = document.createElement("i");
        piece.style.insetInlineStart = `${8 + (index * 6)}%`;
        piece.style.animationDelay = `${index * 28}ms`;
        piece.style.background = index % 3 === 0 ? "var(--bai-accent)" : index % 3 === 1 ? "var(--bai-brand)" : "var(--bai-blue)";
        confetti.appendChild(piece);
      }
      document.body.appendChild(confetti);
      window.setTimeout(() => confetti.remove(), 1100);
    }

    function ensureStickyCta() {
      if (root.querySelector(".bai-mobile-sticky-cta")) return;
      const bar = document.createElement("div");
      bar.className = "bai-mobile-sticky-cta";
      bar.hidden = true;
      bar.innerHTML = '<a class="btn btn-primary" href="#demo-form">شغّل الديمو</a>';
      document.body.appendChild(bar);
      window.addEventListener("scroll", () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
        bar.hidden = !(window.innerWidth <= 640 && progress >= 0.6 && !completed);
      }, { passive: true });
    }

    function ensureConsultationFloat() {
      if (root.querySelector(".bai-consultation-float")) return;
      const link = document.createElement("a");
      link.className = "btn btn-primary bai-consultation-float";
      link.href = "/contact/";
      link.hidden = true;
      link.textContent = "استشارة";
      link.setAttribute("aria-label", "احجز استشارة بعد إكمال الديمو");
      document.body.appendChild(link);
    }

    function showConsultationFloat() {
      const link = root.querySelector(".bai-consultation-float");
      if (link) link.hidden = false;
    }

    function ensureExitIntentModal() {
      if (root.querySelector(".bai-modal")) return;
      const modal = document.createElement("div");
      modal.className = "bai-modal";
      modal.hidden = true;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "bai-exit-title");
      modal.innerHTML = `
        <div class="bai-modal__panel">
          <h2 id="bai-exit-title">قبل ما تطلع</h2>
          <p>احفظ نتيجة الديمو أو احجز مكالمة قصيرة عشان نحولها لنسخة مخصصة لشركتك.</p>
          <div class="bai-modal__actions">
            <a class="btn btn-primary" href="/contact/">احجز مكالمة</a>
            <button class="btn btn-outline" type="button" data-close-modal>إغلاق</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector("[data-close-modal]")?.addEventListener("click", () => {
        modal.hidden = true;
      });
      let shown = false;
      document.addEventListener("mouseleave", (event) => {
        if (shown || window.innerWidth < 900 || event.clientY > 12) return;
        shown = true;
        modal.hidden = false;
        modal.querySelector("[data-close-modal]")?.focus();
      });
    }

    function copyResult() {
      const content = panel.innerText.trim();
      if (!content) return;
      navigator.clipboard?.writeText(content);
      window.BrightAIDemoA11y.announce("تم نسخ النتيجة");
      haptic(12);
    }

    function bindKeyboardShortcuts() {
      document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        const target = event.target;
        const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
        const modal = root.querySelector(".bai-modal:not([hidden])");
        if (event.key === "Escape" && modal) {
          modal.hidden = true;
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          form.requestSubmit();
          return;
        }
        if (isTyping) return;
        if (key === "r" && completed) {
          event.preventDefault();
          form.requestSubmit();
        }
        if (key === "c" && completed) {
          event.preventDefault();
          copyResult();
        }
        if (key === "d" && completed) {
          event.preventDefault();
          root.querySelector("[data-download-report]")?.click();
        }
      });
    }

    ensureStickyCta();
    ensureConsultationFloat();
    ensureExitIntentModal();
    bindKeyboardShortcuts();

    root.querySelector("[data-reset-demo]")?.addEventListener("click", () => {
      form.reset();
      panel.innerHTML = '<div class="empty-state"><strong>تمام، جاهز نبدأ؟</strong><p>شغّل التجربة، وثوانٍ بس وتجيك النتيجة كلوحة تنفيذية قابلة للمشاركة.</p></div>';
      completed = false;
      window.BrightAIDemoAnalytics.track(config, "reset");
    });

    root.querySelector("[data-download-report]")?.addEventListener("click", () => {
      window.print();
      window.BrightAIDemoAnalytics.track(config, "print_report");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      window.BrightAIDemoUI.setLoading(root, true);
      panel.setAttribute("aria-busy", "true");
      haptic(10);
      ticker.start();
      window.BrightAIDemoA11y.announce("بدأ تحليل الديمو");
      window.BrightAIDemoAnalytics.track(config, "submit");

      try {
        const result = await window.BrightAIDemoApi.runDemo(form, config);
        window.BrightAIDemoUI.renderResult(panel, result, config);
        completed = true;
        focusResult();
        showConsultationFloat();
        showConfetti();
        haptic([12, 40, 18]);
        window.BrightAIDemoA11y.announce("اكتمل تحليل الديمو");
        window.BrightAIDemoAnalytics.track(config, "success", { score: result.score || 0 });
      } catch (error) {
        window.BrightAIDemoUI.renderError(panel, error, config);
        completed = true;
        focusResult();
        showConsultationFloat();
        haptic([24, 30, 24]);
        window.BrightAIDemoA11y.announce("تعذر تشغيل التحليل الحي");
        window.BrightAIDemoAnalytics.track(config, "error", { status: error.status || 0 });
      } finally {
        ticker.stop();
        window.BrightAIDemoUI.setLoading(root, false);
        panel.removeAttribute("aria-busy");
      }
    });
  });
})();
