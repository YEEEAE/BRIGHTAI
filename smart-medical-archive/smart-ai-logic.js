"use strict";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = "/api/ai/gemini-chat";

function getGeminiConfig() {
  const env = window.BRIGHTAI_ENV || {};
  const localKey = readStorage("brightai.medicalArchive.geminiApiKey");
  const localModel = readStorage("brightai.medicalArchive.geminiModel");
  const keyInput = document.getElementById("geminiApiKeyInput");
  const modelInput = document.getElementById("geminiModelInput");

  return {
    API_URL: GEMINI_ENDPOINT,
    API_KEY: env.GEMINI_API_KEY || keyInput?.value?.trim() || localKey || "",
    MODEL: env.GEMINI_MODEL || modelInput?.value?.trim() || localModel || DEFAULT_GEMINI_MODEL,
    DEFAULT_HEADERS: { "Content-Type": "application/json" }
  };
}

function readStorage(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

async function callGeminiAPI(messages, options = {}) {
  const config = getGeminiConfig();
  if (!config.API_KEY) {
    throw new Error("مفتاح Gemini API غير متوفر. أدخل المفتاح في إعداد الاتصال أو استخدم الخادم الموحد.");
  }

  const controller = new AbortController();
  const timeoutMs = options.timeout || 6e4;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(config.API_URL, {
      method: "POST",
      headers: {
        ...config.DEFAULT_HEADERS,
        Authorization: `Bearer ${config.API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || config.MODEL,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.max_tokens || 4096,
        response_format: options.json_mode ? { type: "json_object" } : undefined
      }),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error?.message || `تعذر استدعاء Gemini API (${response.status}).`);
    }

    const content = payload?.choices?.[0]?.message?.content || payload?.text || "";
    if (!content) throw new Error("استجابة Gemini فارغة أو غير مكتملة.");
    return {
      content,
      model: payload.model || config.MODEL,
      usage: payload.usage || null,
      finish_reason: payload?.choices?.[0]?.finish_reason || "stop"
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`انتهت مهلة الاتصال بـ Gemini (${Math.round(timeoutMs / 1e3)} ثانية).`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function extractMedicalRecord(reportText) {
  const response = await callGeminiAPI([
    {
      role: "system",
      content: "استخرج بيانات التقرير الطبي كـ JSON فقط: patient, diagnoses, symptoms, medications, labs, recommendations, severity, alerts, hospital_department."
    },
    { role: "user", content: `التقرير الطبي المطلوب تحليله:\n\n${reportText}` }
  ], { temperature: 0.1, json_mode: true, timeout: 6e4 });

  return parseJsonObject(response.content);
}

async function processNaturalLanguageQuery(query, records) {
  const response = await callGeminiAPI([
    { role: "system", content: "حوّل سؤال البحث الطبي إلى شروط JSON مختصرة." },
    { role: "user", content: query }
  ], { temperature: 0, json_mode: true, timeout: 3e4 });
  const filters = parseJsonObject(response.content);
  return Array.isArray(records) ? records.filter((record) => JSON.stringify(record).includes(query) || filters.conditions?.length) : [];
}

async function askClinicalAgent(question, record) {
  const response = await callGeminiAPI([
    { role: "system", content: "أجب بالعربية بناءً على السجل الطبي المرفق فقط." },
    { role: "user", content: `السجل:\n${JSON.stringify(record, null, 2)}\n\nالسؤال:\n${question}` }
  ], { temperature: 0.3, timeout: 45e3 });
  return response.content;
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("فشل في تحليل استجابة Gemini كـ JSON.");
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}

window.SmartClinicalAI = {
  extractMedicalRecord,
  processNaturalLanguageQuery,
  askClinicalAgent,
  callGeminiAPI,
  getGeminiConfig
};

export {
  extractMedicalRecord,
  processNaturalLanguageQuery,
  askClinicalAgent,
  callGeminiAPI,
  getGeminiConfig
};
