(function () {
  "use strict";

  const AI_COMPLETIONS_PATH = "/api/ai/chat/completions";
  const WHATSAPP_NUMBER = "966538229013";
  const NETWORK_FALLBACK_MESSAGE = "تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة.";

  class GeminiDemoEngine {
    constructor(config) {
      this.model = config.model || "gemini-2.5-flash";
      this.endpoint = config.endpoint || AI_COMPLETIONS_PATH;
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

    async generate({
      prompt,
      file,
      schema,
      schemaName,
      domain,
      agentType,
      locale = "ar-SA",
      sourcePage,
      systemPrompt,
      userPrompt,
      messages,
      safetySettings,
      fallback,
      temperature = 0.2
    }) {
      if (!this.checkUsageLimit()) return null;

      this.trackUsage("agent_demo_started");
      const parts = [{ type: "text", text: prompt }];
      if (file && file.base64 && file.mimeType) {
        parts.push({
          type: "input_file",
          mime_type: file.mimeType,
          data: file.base64
        });
      }

      const requestMessages = Array.isArray(messages) && messages.length
        ? messages
        : systemPrompt || userPrompt
          ? [
              { role: "system", content: systemPrompt || "أنت مساعد Bright AI. أعد نتيجة عربية منظمة حسب المخطط المطلوب فقط." },
              { role: "user", content: userPrompt || prompt || "" }
            ]
          : [{ role: "user", content: file ? parts : prompt }];

      const body = {
        model: this.model,
        agentType: agentType || domain || this.demoId,
        locale,
        sourcePage: sourcePage || window.location.pathname,
        messages: requestMessages,
        temperature,
        response_format: schema
          ? { type: "json_schema", json_schema: { name: schemaName || `${this.demoId}_schema`, schema } }
          : undefined
      };
      if (!agentType) {
        body.max_tokens = 4096;
        body.demoDomain = domain || this.demoId;
        body.safetySettings = safetySettings || undefined;
      }

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const request = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal
        };
        const res = window.BrightAIGateway?.apiFetch
          ? await window.BrightAIGateway.apiFetch(this.endpoint, request, this.timeoutMs)
          : await fetch(window.BrightAIRuntimeConfig?.buildApiUrl ? window.BrightAIRuntimeConfig.buildApiUrl(this.endpoint) : this.endpoint, request);

        if (!res.ok) throw new Error(NETWORK_FALLBACK_MESSAGE);
        const data = await res.json().catch(() => ({}));
        const text = data?.choices?.[0]?.message?.content || data?.answer || "";
        this.trackUsage("agent_result_generated");
        return schema ? this.parseJson(text) : text;
      } catch (error) {
        this.trackUsage("demo_error", error?.message || NETWORK_FALLBACK_MESSAGE);
        this.showErrorFallback();
        return fallback && typeof fallback === "object" ? { ...fallback, __fallback: true } : fallback || null;
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
      document.querySelector(".bai-upgrade-modal")?.remove();
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
      modal.querySelector(".bai-btn-close")?.addEventListener("click", () => modal.remove(), { once: true });
      modal.querySelector("[data-demo-whatsapp]")?.addEventListener("click", () => this.trackUsage("demo_to_whatsapp"), { once: true });
      document.body.appendChild(modal);
    }

    showErrorFallback() {
      window.dispatchEvent(new CustomEvent("bai-demo-error", {
        detail: { demoId: this.demoId }
      }));
    }

    trackUsage(status, error) {
      const eventMap = {
        demo_started: "agent_demo_started",
        sample_loaded: "agent_sample_loaded",
        ai_result_generated: "agent_result_generated",
        report_downloaded: "agent_report_downloaded",
        whatsapp_clicked: "agent_whatsapp_clicked",
        lead_submitted: "agent_lead_submitted",
        demo_to_whatsapp: "agent_whatsapp_clicked"
      };
      const eventName = eventMap[status] || status;
      if (typeof window.gtag === "function") {
        const namedEvents = new Set([
          "agent_demo_started",
          "agent_sample_loaded",
          "agent_result_generated",
          "agent_report_downloaded",
          "agent_whatsapp_clicked",
          "agent_lead_submitted",
          "demo_started",
          "sample_loaded",
          "ai_result_generated",
          "report_downloaded",
          "whatsapp_clicked",
          "lead_submitted",
          "demo_input_submitted",
          "demo_result_generated",
          "demo_limit_reached",
          "demo_to_whatsapp",
          "demo_to_purchase"
        ]);
        window.gtag("event", namedEvents.has(eventName) ? eventName : "demo_interaction", {
          demo_id: this.demoId,
          status: eventName,
          error: error || undefined
        });
      }
      window.dispatchEvent(new CustomEvent("bai-demo-track", {
        detail: {
          event: eventName,
          demoId: this.demoId,
          error: error || undefined
        }
      }));
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

  async function generateDemoResult({
    demoType,
    agentType,
    schemaName,
    sourcePage,
    userInputs,
    systemPrompt,
    taskPrompt,
    fallbackResult,
    responseSchema,
    temperature = 0.2,
    model = "gemini-2.5-flash",
    timeoutMs = 45000
  }) {
    const payload = {
      model,
      demoType,
      agentType: agentType || demoType,
      schemaName,
      locale: "ar-SA",
      sourcePage: sourcePage || window.location.pathname,
      messages: [
        {
          role: "system",
          content: systemPrompt || "أنت محلل Bright AI. أعد نتيجة عربية منظمة قابلة للعرض في لوحة ديمو فقط."
        },
        {
          role: "user",
          content: [
            taskPrompt || "حلل مدخلات الديمو وأعد تقريراً تنفيذياً منظماً.",
            "المدخلات:",
            typeof userInputs === "string" ? userInputs : JSON.stringify(userInputs || {}, null, 2)
          ].join("\n")
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName || `${demoType || "generic"}_schema`,
          schema: responseSchema || undefined
        }
      },
      temperature
    };

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    };

    try {
      const url = AI_COMPLETIONS_PATH;
      const response = window.BrightAIGateway?.apiFetch
        ? await window.BrightAIGateway.apiFetch(url, request, timeoutMs)
        : await fetch(window.BrightAIRuntimeConfig?.buildApiUrl ? window.BrightAIRuntimeConfig.buildApiUrl(url) : url, request);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error?.message_ar || NETWORK_FALLBACK_MESSAGE);
      }
      return data?.data || data?.choices?.[0]?.message?.content || data;
    } catch (error) {
      window.dispatchEvent(new CustomEvent("bai-demo-error", {
        detail: { demoType, agentType, schemaName, message: error.message }
      }));
      return fallbackResult && typeof fallbackResult === "object" ? { ...fallbackResult, __fallback: true } : fallbackResult || null;
    } finally {
      window.clearTimeout(timer);
    }
  }

  window.GeminiDemoEngine = GeminiDemoEngine;
  window.BrightAI = window.BrightAI || {};
  window.BrightAI.generateDemoResult = generateDemoResult;
  window.BrightAIDemoUtils = {
    fileToInlineData,
    downloadText,
    printReport,
    whatsappNumber: WHATSAPP_NUMBER
  };
})();
