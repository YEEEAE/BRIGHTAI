'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-1.5-flash';

let _client = null;
let _model = null;
let _mock = false;

function _init() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[GeminiService] GEMINI_API_KEY is not set — responses will use mock fallback.');
    _mock = true;
  } else {
    _client = new GoogleGenerativeAI(apiKey);
    _model = _client.getGenerativeModel({ model: MODEL_NAME });
    _mock = false;
  }
}

_init();

function _mockResponse() {
  return [
    'شكراً لاستفساركم. بناءً على المعطيات المقدمة، يمكنني تقديم التحليل التالي:',
    '',
    '**الملخص التنفيذي:**',
    'تُظهر البيانات المدخلة إمكانيات واضحة للتحسين في عدة محاور استراتيجية.',
    '',
    '**التوصيات:**',
    '1. تعزيز كفاءة العمليات الداخلية من خلال أتمتة المهام المتكررة.',
    '2. الاستثمار في تطوير الكوادر البشرية وبناء قدراتها التقنية.',
    '3. اعتماد مؤشرات أداء رئيسية (KPIs) قابلة للقياس والمراجعة الدورية.',
    '',
    '**الخطوات التالية:**',
    'نوصي بعقد ورشة عمل مع الفريق المعني لتحديد أولويات التنفيذ وجدوله الزمني.',
  ].join('\n');
}

async function callGemini(prompt) {
  if (_mock) {
    return _mockResponse();
  }
  const result = await _model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { callGemini };
