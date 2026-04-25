(function (root) {
  "use strict";

  const GEMINI_MODEL = "gemini-2.5-flash";
  const GEMINI_API_KEY = "AIzaSyBFMmyO7sgXaSbF47zd3rbO6I9MfhbYLK8";
  const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  const DEFAULT_TIMEOUT_MS = 45000;

  class GeminiDirectError extends Error {
    constructor(code, message, details) {
      super(message);
      this.name = "GeminiDirectError";
      this.code = code;
      this.details = details || null;
    }
  }

  function buildTextPart(prompt) {
    const text = String(prompt || "").trim();
    if (!text) {
      throw new GeminiDirectError("EMPTY_PROMPT", "أدخل نصاً قبل بدء التحليل.");
    }
    return { text };
  }

  function buildInlineDataPart(filePart) {
    if (!filePart) return null;
    if (filePart.inline_data) return { inline_data: filePart.inline_data };
    if (filePart.inlineData) return { inline_data: filePart.inlineData };

    const mimeType = filePart.mimeType || filePart.mime_type || filePart.type;
    const data = filePart.data || filePart.base64;
    if (!mimeType || !data) {
      throw new GeminiDirectError("INVALID_FILE", "بيانات الملف غير مكتملة.");
    }
    return { inline_data: { mime_type: mimeType, data } };
  }

  async function fileToInlineData(file) {
    if (!file) {
      throw new GeminiDirectError("INVALID_FILE", "لم يتم اختيار ملف صالح.");
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new GeminiDirectError("INVALID_FILE", "تعذر قراءة الملف."));
      reader.readAsDataURL(file);
    });

    const commaIndex = dataUrl.indexOf(",");
    const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
    return {
      mime_type: file.type || "application/octet-stream",
      data: base64
    };
  }

  function getResponseText(data) {
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

    if (!text) {
      throw new GeminiDirectError("EMPTY_RESPONSE", "وصلت استجابة فارغة من Gemini. حاول مرة أخرى.");
    }
    return text;
  }

  function normalizeHttpError(status, data) {
    const apiMessage = data?.error?.message || data?.message || "";
    if (status === 429 || /quota|rate limit|resource exhausted/i.test(apiMessage)) {
      return new GeminiDirectError("QUOTA", "تم تجاوز الحصة أو حد الطلبات. انتظر قليلاً ثم أعد المحاولة.", data);
    }
    if (status === 401 || status === 403) {
      return new GeminiDirectError("AUTH", "تعذر استخدام مفتاح Gemini الحالي. تحقق من صلاحيات المفتاح.", data);
    }
    return new GeminiDirectError("HTTP", apiMessage || `فشل طلب Gemini بحالة HTTP ${status}.`, data);
  }

  async function generateContent(options) {
    const config = options || {};
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.timeoutMs || DEFAULT_TIMEOUT_MS);

    const parts = [buildTextPart(config.prompt)];
    const files = Array.isArray(config.files) ? config.files : [];
    files.forEach((filePart) => {
      const inlinePart = buildInlineDataPart(filePart);
      if (inlinePart) parts.push(inlinePart);
    });

    const body = {
      contents: [{ role: "user", parts }],
      generationConfig: config.generationConfig || {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxOutputTokens || 700
      }
    };

    let response;
    try {
      response = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "انتهت مهلة الاتصال بـ Gemini. حاول مرة أخرى."
        : "تعذر الاتصال بـ Gemini. تحقق من الشبكة ثم أعد المحاولة.";
      throw new GeminiDirectError("NETWORK", message, error);
    } finally {
      window.clearTimeout(timeout);
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new GeminiDirectError("INVALID_JSON", "تعذر قراءة استجابة Gemini. حاول مرة أخرى.", error);
    }

    if (!response.ok) {
      throw normalizeHttpError(response.status, data);
    }

    return {
      text: getResponseText(data),
      raw: data,
      model: GEMINI_MODEL
    };
  }

  function getErrorMessage(error) {
    if (error instanceof GeminiDirectError) return error.message;
    return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  root.BrightAIGemini = {
    GEMINI_MODEL,
    GEMINI_ENDPOINT,
    generateContent,
    generateText: (prompt, options) => generateContent({ ...(options || {}), prompt }),
    fileToInlineData,
    getErrorMessage,
    GeminiDirectError
  };
})(typeof window !== "undefined" ? window : globalThis);
