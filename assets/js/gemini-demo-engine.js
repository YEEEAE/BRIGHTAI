(function () {
  "use strict";

  const DEFAULT_API_KEY = "AIzaSyBfPwQRy8veLdTwQ_Oo-v-N0mLPWlma3Dg";
  const WHATSAPP_NUMBER = "966538229013";

  class GeminiDemoEngine {
    constructor(config) {
      this.apiKey = config.apiKey || DEFAULT_API_KEY;
      this.model = config.model || "gemini-2.5-flash";
      this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
      this.usageLimit = config.usageLimit || 3;
      this.demoId = config.demoId || "general";
      this.timeoutMs = config.timeoutMs || 8000;
    }

    getUsageCount() {
      const key = `bai_demo_${this.demoId}_count`;
      return Number.parseInt(localStorage.getItem(key) || "0", 10) || 0;
    }

    getRemainingUses() {
      return Math.max(this.usageLimit - this.getUsageCount(), 0);
    }

    checkUsageLimit() {
      const key = `bai_demo_${this.demoId}_count`;
      const count = this.getUsageCount();
      if (count >= this.usageLimit) {
        this.trackUsage("demo_limit_reached");
        this.showUpgradePrompt();
        return false;
      }
      localStorage.setItem(key, String(count + 1));
      return true;
    }

    async generate({ prompt, file, schema, temperature = 0.35 }) {
      if (!this.checkUsageLimit()) return null;

      this.trackUsage("demo_input_submitted");
      const parts = [{ text: prompt }];
      if (file && file.base64 && file.mimeType) {
        parts.push({
          inline_data: {
            mime_type: file.mimeType,
            data: file.base64
          }
        });
      }

      const body = {
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature,
          maxOutputTokens: 4096,
          responseMimeType: schema ? "application/json" : "text/plain"
        }
      };

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        this.trackUsage("demo_result_generated");
        return schema ? this.parseJson(text) : text;
      } catch (error) {
        this.trackUsage("demo_error", error.message);
        this.showErrorFallback();
        return null;
      } finally {
        window.clearTimeout(timer);
      }
    }

    parseJson(text) {
      try {
        return JSON.parse(text);
      } catch (error) {
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!match) throw error;
        return JSON.parse(match[0]);
      }
    }

    watermark(content) {
      return `${content}\n\n---\nتم الإنشاء بواسطة Bright AI Demo - ${new Date().toLocaleDateString("ar-SA")}\nbrightai.site | +966 53 822 9013`;
    }

    createWhatsAppUrl(context) {
      const message = `أعجبتني تجربة Bright AI Demo (${this.demoId}) وأريد تطبيقها في شركتي.\nالسياق: ${context || "أرغب بمناقشة التطبيق الكامل"}`;
      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    showUpgradePrompt() {
      const modal = document.createElement("div");
      modal.className = "bai-upgrade-modal";
      modal.innerHTML = `
        <div class="bai-modal-backdrop"></div>
        <div class="bai-modal-content" role="dialog" aria-modal="true" aria-label="ترقية تجربة Bright AI">
          <h3>اكتملت المحاولات المجانية</h3>
          <p>استخدمت 3 محاولات مجانية. للحصول على وصول كامل وتطبيق النموذج داخل شركتك، تواصل معنا عبر واتساب.</p>
          <a href="${this.createWhatsAppUrl("وصلت إلى حد التجربة المجانية")}" class="bai-btn-whatsapp" data-demo-whatsapp target="_blank" rel="noopener">تواصل عبر واتساب</a>
          <a href="/services/" class="bai-btn-services">عرض الخدمات والأسعار</a>
          <button type="button" class="bai-btn-close">إغلاق</button>
        </div>
      `;
      modal.querySelector(".bai-btn-close").addEventListener("click", () => modal.remove());
      modal.querySelector("[data-demo-whatsapp]").addEventListener("click", () => this.trackUsage("demo_to_whatsapp"));
      document.body.appendChild(modal);
    }

    showErrorFallback() {
      window.dispatchEvent(new CustomEvent("bai-demo-error", {
        detail: { demoId: this.demoId }
      }));
    }

    trackUsage(status, error) {
      if (typeof window.gtag === "function") {
        const namedEvents = new Set([
          "demo_started",
          "demo_input_submitted",
          "demo_result_generated",
          "demo_limit_reached",
          "demo_to_whatsapp",
          "demo_to_purchase"
        ]);
        window.gtag("event", namedEvents.has(status) ? status : "demo_interaction", {
          demo_id: this.demoId,
          status,
          error: error || undefined
        });
      }
    }
  }

  async function fileToInlineData(file) {
    if (!file) return null;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return {
      mimeType: file.type || "application/octet-stream",
      base64: dataUrl.split(",")[1] || ""
    };
  }

  function downloadText(filename, content, type) {
    const blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function printReport(title, html) {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(`<!doctype html><html dir="rtl" lang="ar-SA"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;line-height:1.8;padding:32px;color:#111827}.watermark{position:fixed;inset:40% auto auto 12%;font-size:64px;color:rgba(15,23,42,.08);transform:rotate(-14deg);font-weight:900}section{border:1px solid #d1d5db;padding:16px;margin:12px 0;border-radius:8px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #d1d5db;padding:8px;text-align:start}</style></head><body><div class="watermark">Bright AI Demo</div>${html}<script>window.print()</script></body></html>`);
    win.document.close();
  }

  window.GeminiDemoEngine = GeminiDemoEngine;
  window.BrightAIDemoUtils = {
    fileToInlineData,
    downloadText,
    printReport,
    whatsappNumber: WHATSAPP_NUMBER
  };
})();
