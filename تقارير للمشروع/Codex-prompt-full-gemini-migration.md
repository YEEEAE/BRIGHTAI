# 🚀 برومبت Codex — ترحيل كامل مشروع BrightAI إلى Gemini AI

## 📋 نظرة عامة على المهمة

الهدف: **ترحيل كل استدعاءات الذكاء الاصطناعي في المشروع** — Groq وكل شيء مكشوف — إلى **Gemini API عبر الـ backend فقط**، بحيث لا يوجد مفتاح واحد في كود الـ frontend.

النموذج المستخدم: `gemini-2.5-flash`
مفتاح الـ API: يُقرأ من `process.env.GEMINI_API_KEY` في `/backend/.env` حصراً.

---

## 🗺️ خريطة كل استدعاءات AI في المشروع (افحصها أولاً)

### 🔴 مشاكل حرجة — مفاتيح مكشوفة في الـ Frontend

| الملف | المشكلة | الأولوية |
|-------|---------|---------|
| `frontend/js/chat-widget.js` سطر 1 | مفتاح Gemini مكشوف `AIzaSy...` + يتصل مباشرة بـ Google | CRITICAL |
| `frontend/pages/try/data-analyzer/index.html` سطر 748 | مفتاح Groq مكشوف `gsk_cBj...` + يتصل بـ Groq مباشرة | CRITICAL |
| `frontend/pages/try/text-analysis/index.html` سطر 783 | مفتاح Groq مكشوف `gsk_cBj...` + يتصل بـ Groq مباشرة | CRITICAL |
| `frontend/pages/smart-medical-archive/smart-ai-logic.js` سطر 12 | مفتاح Groq مكشوف `gsk_kLM...` + fallback hardcoded | CRITICAL |

### 🟡 Backend — يستخدم Groq (يجب تحويله لـ Gemini)

| الملف | المسارات الحالية | التحويل المطلوب |
|-------|---------|---------|
| `backend/routes/groq.js` | `/api/groq/stream` + OCR + FAQ + Transcribe + Medical Archive | كلها → Gemini |
| `backend/routes/search.js` | `/api/ai/search` — RAG مع Groq | → Gemini |

### 🟢 Backend — يستخدم Gemini بالفعل (تحقق فقط)

| الملف | الحالة |
|-------|---------|
| `backend/routes/chat.js` | ✅ يستخدم Gemini من `config.gemini` — تحقق فقط |
| `backend/routes/summary.js` | ✅ يستخدم Gemini من `config.gemini` — تحقق فقط |
| `backend/routes/medical.js` | ✅ يستخدم Gemini — تحقق فقط |

### 🔵 Platform React — يستخدم Groq Service

| الملف | المشكلة |
|-------|---------|
| `brightai-platform/src/services/groq.service.ts` | كل Agent Executor يعتمد عليه |
| `brightai-platform/src/services/agent-executor/llm.ts` | يستورد GroqService مباشرة |
| `brightai-platform/src/services/agent-executor/workflow-runner.ts` | يستخدم Groq |

---

## ✅ المهمة 1 — إنشاء Gemini Helper موحد في الـ Backend

أنشئ ملف `/backend/utils/geminiClient.js`:

```javascript
/**
 * Gemini AI Client — Unified Helper
 * جميع مسارات الـ backend تستخدم هذا الملف للتواصل مع Gemini
 */

const { config } = require('../config');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * بناء URL لـ Gemini API
 * @param {string} action - 'generateContent' | 'streamGenerateContent'
 * @param {string} [model] - اسم النموذج (اختياري)
 */
function buildGeminiUrl(action = 'generateContent', model = null) {
  const m = model || config.gemini.model || DEFAULT_MODEL;
  const key = config.gemini.apiKey;
  return `${GEMINI_BASE}/${m}:${action}?key=${key}`;
}

/**
 * إرسال طلب إلى Gemini وإرجاع النص
 * @param {object} options
 * @param {string} options.systemPrompt - رسالة النظام
 * @param {string} options.userMessage - رسالة المستخدم
 * @param {Array}  [options.history] - تاريخ المحادثة [{ role, parts }]
 * @param {number} [options.maxTokens] - حد الرموز (افتراضي: 2048)
 * @param {number} [options.temperature] - درجة الإبداع (افتراضي: 0.7)
 * @param {string} [options.model] - تجاوز النموذج
 * @returns {Promise<string>} - نص الرد
 */
async function callGemini({ systemPrompt, userMessage, history = [], maxTokens = 2048, temperature = 0.7, model = null }) {
  const url = buildGeminiUrl('generateContent', model);

  // بناء سلسلة المحادثة
  const contents = [];

  // إضافة السياق السابق
  if (history && history.length > 0) {
    contents.push(...history);
  }

  // إضافة رسالة المستخدم الحالية
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature
    }
  };

  // إزالة system_instruction إذا كانت فارغة
  if (!systemPrompt) delete body.system_instruction;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini API Error: ${msg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

/**
 * إرسال طلب Streaming إلى Gemini
 * @param {object} options - نفس خيارات callGemini
 * @param {function} onChunk - callback يُستدعى مع كل جزء من النص
 * @param {function} [onDone] - callback عند الانتهاء
 */
async function streamGemini({ systemPrompt, userMessage, history = [], maxTokens = 2048, temperature = 0.7 }, onChunk, onDone) {
  const url = buildGeminiUrl('streamGenerateContent');

  const contents = [...(history || [])];
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature }
  };
  if (!systemPrompt) delete body.system_instruction;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`Gemini Stream Error: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // معالجة JSON المتدفق من Gemini
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean === '[' || clean === ']' || clean === ',') continue;
      const jsonStr = clean.startsWith(',') ? clean.slice(1) : clean;
      try {
        const parsed = JSON.parse(jsonStr);
        const chunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (chunk) onChunk(chunk);
      } catch (_) { /* تجاهل */ }
    }
  }
  if (onDone) onDone();
}

/**
 * تحليل صورة/ملف عبر Gemini Vision
 * @param {string} base64Data - بيانات الملف بصيغة Base64
 * @param {string} mimeType - نوع الملف (image/jpeg, image/png, application/pdf)
 * @param {string} prompt - التعليمات
 * @returns {Promise<string>}
 */
async function analyzeWithVision({ base64Data, mimeType, prompt }) {
  const url = buildGeminiUrl('generateContent');
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Data } },
        { text: prompt }
      ]
    }]
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Gemini Vision Error: ${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini Vision returned empty response');
  return text;
}

module.exports = { callGemini, streamGemini, analyzeWithVision, buildGeminiUrl };
```

---

## ✅ المهمة 2 — تحويل `/backend/routes/groq.js` بالكامل إلى Gemini

افتح الملف `/backend/routes/groq.js` ونفّذ التحويلات التالية **واحدة واحدة**:

### 2.1 — مسار Stream الرئيسي `/api/groq/stream`

**الحالي:** يستخدم Groq API مع `llama-3.3-70b`
**المطلوب:** استبدل استدعاء Groq بـ `streamGemini` من `geminiClient.js`

```javascript
// استبدل هذا الكود:
const response = await fetch(config.groq.endpoint, {
  headers: { 'Authorization': `Bearer ${config.groq.apiKey}` },
  body: JSON.stringify({ model: config.groq.model, messages, stream: true })
});

// بهذا الكود:
const { streamGemini } = require('../utils/geminiClient');
const { sanitizeUserInput } = require('../utils/sanitizer');

await streamGemini(
  {
    systemPrompt: DEMO_SYSTEM_PROMPT, // System Prompt الموجود في الملف
    userMessage: sanitizeUserInput(message),
    history: sessionHistory, // من sessionStore
    maxTokens: 1024,
    temperature: 0.7
  },
  (chunk) => {
    // أرسل الـ chunk كـ SSE
    res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
  },
  () => {
    res.write('data: [DONE]\n\n');
    res.end();
  }
);
```

### 2.2 — مسار OCR `/api/groq/ocr`

**الحالي:** يرسل صورة بصيغة base64 إلى Groq Vision
**المطلوب:** استخدم `analyzeWithVision` من `geminiClient.js`

```javascript
const { analyzeWithVision } = require('../utils/geminiClient');

const ocrPrompt = `${OCR_SYSTEM_PROMPT}

النص المستخرج من المستند:
${extractedText}

أعِد JSON منسق فقط بدون أي شرح.`;

const result = await analyzeWithVision({
  base64Data: imageBase64,
  mimeType: imageMimeType, // 'image/jpeg' أو 'application/pdf'
  prompt: ocrPrompt
});

// parse JSON من النتيجة
const jsonMatch = result.match(/\{[\s\S]*\}/);
const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
```

### 2.3 — مسار استخراج النص `/api/groq/extract-text`

```javascript
const { callGemini } = require('../utils/geminiClient');

const extracted = await callGemini({
  systemPrompt: OCR_SYSTEM_PROMPT,
  userMessage: `استخرج النص من هذا المحتوى:\n${textContent}`,
  maxTokens: 2000,
  temperature: 0.1
});
```

### 2.4 — مسار FAQ `/api/groq/faq`

```javascript
const { callGemini } = require('../utils/geminiClient');

const faqResult = await callGemini({
  systemPrompt: FAQ_SYSTEM_PROMPT, // الموجود في groq.js
  userMessage: `السياق:\n${context}\n\nاستخرج أسئلة وأجوبة بصيغة JSON.`,
  maxTokens: 800,
  temperature: 0.5
});
```

### 2.5 — مسار الأرشيف الطبي `/api/groq/medical-archive`

```javascript
const { callGemini } = require('../utils/geminiClient');

const analysis = await callGemini({
  systemPrompt: MEDICAL_ARCHIVE_SYSTEM_PROMPT, // موجود في groq.js
  userMessage: sanitizeForAI(medicalText),
  maxTokens: 2048,
  temperature: 0.3 // دقة أعلى للمحتوى الطبي
});
```

### 2.6 — مسار Transcribe `/api/groq/transcribe`

⚠️ ملاحظة: Gemini لا يدعم رفع ملفات صوتية مباشرة بنفس طريقة Whisper.
**المطلوب:** أبقِ هذا المسار يستخدم Groq Whisper لأنه لا يوجد بديل مماثل في Gemini للـ transcription، أو أضف رسالة تعذر واضحة إذا لم يكن Groq متاحاً.

---

## ✅ المهمة 3 — تحويل `/backend/routes/search.js` (RAG) إلى Gemini

افتح `/backend/routes/search.js` وابحث عن الجزء الذي يستدعي Groq لتوليد الإجابة من نتائج RAG:

```javascript
// استبدل استدعاء Groq للـ RAG بـ:
const { callGemini } = require('../utils/geminiClient');

const ragSystemPrompt = `أنت محرك بحث ذكي لموقع Bright AI. أجب بناءً على السياق المقدم فقط.
- أجب بالعربية الفصحى
- اذكر المصدر إذا توفر
- إذا لم تجد الإجابة في السياق: قل "لم أجد معلومات كافية"`;

const ragAnswer = await callGemini({
  systemPrompt: ragSystemPrompt,
  userMessage: `السؤال: ${sanitizedQuery}\n\nالسياق من الموقع:\n${ragContext}`,
  maxTokens: 1000,
  temperature: 0.4
});
```

---

## ✅ المهمة 4 — تحويل Frontend: صفحة محلل البيانات

**الملف:** `frontend/pages/try/data-analyzer/index.html`

### الخطوة أ — احذف المفتاح المكشوف

ابحث عن:
```javascript
const GROQ_API_KEY = 'GROQ_KEY_REDACTED';
```
**احذف هذا السطر بالكامل.**

### الخطوة ب — أنشئ مسار Backend جديد

أنشئ `POST /api/gemini/analyze` في `/backend/routes/gemini.js` (أو أضفه لملف موجود):

```javascript
async function analyzeDataHandler(req, res) {
  const { csvData, question, analysisType } = req.body;
  
  const systemPrompt = `أنت محلل بيانات خبير للشركات السعودية.
- حلل البيانات المقدمة وقدم رؤى قابلة للتنفيذ
- استخدم الأرقام والنسب المئوية
- اقترح تحسينات عملية
- الأجب بالعربية الفصحى`;

  const result = await callGemini({
    systemPrompt,
    userMessage: `نوع التحليل: ${analysisType}\nالسؤال: ${question}\n\nالبيانات:\n${csvData}`,
    maxTokens: 1500,
    temperature: 0.4
  });
  
  res.json({ analysis: result });
}
```

### الخطوة ج — استبدل الاستدعاءات في الـ HTML

ابحث عن كل `fetch('https://api.groq.com/openai/v1/chat/completions'` في الملف واستبدلها بـ:
```javascript
const response = await fetch('/api/gemini/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    csvData: dataContext,
    question: userQuestion,
    analysisType: currentAnalysisType
  })
});
const data = await response.json();
const aiInsight = data.analysis;
```

---

## ✅ المهمة 5 — تحويل Frontend: صفحة تحليل النصوص

**الملف:** `frontend/pages/try/text-analysis/index.html`

### الخطوة أ — احذف:
```javascript
const GROQ_API_KEY = 'GROQ_KEY_REDACTED';
```

### الخطوة ب — أنشئ مسار Backend

أضف `POST /api/gemini/text-analysis` في `/backend/routes/gemini.js`:

```javascript
async function textAnalysisHandler(req, res) {
  const { text, analysisType } = req.body;
  
  const prompts = {
    'sentiment': 'حلل مشاعر النص (إيجابي/سلبي/محايد) مع النسبة المئوية والأسباب.',
    'keywords': 'استخرج الكلمات المفتاحية الأكثر أهمية مع وزن كل منها.',
    'summary': 'لخّص النص في 3 جمل مختصرة.',
    'entities': 'استخرج الأشخاص والأماكن والمنظمات والتواريخ من النص.',
    'default': 'حلل النص وقدم رؤى مفيدة.'
  };

  const result = await callGemini({
    systemPrompt: 'أنت محلل نصوص خبير. أجب بالعربية بصيغة منظمة.',
    userMessage: `${prompts[analysisType] || prompts.default}\n\nالنص:\n${text}`,
    maxTokens: 800,
    temperature: 0.3
  });
  
  res.json({ result });
}
```

### الخطوة ج — استبدل استدعاءات Groq في HTML بـ:
```javascript
const response = await fetch('/api/gemini/text-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: inputText, analysisType: selectedType })
});
const data = await response.json();
```

---

## ✅ المهمة 6 — تحويل الأرشيف الطبي الذكي

**الملف:** `frontend/pages/smart-medical-archive/smart-ai-logic.js`

### الخطوة أ — احذف الدالة `getGroqConfig()` بالكامل (سطر 1 إلى ~50)

### الخطوة ب — استبدلها بـ:
```javascript
/**
 * إرسال طلب تحليل للأرشيف الطبي عبر الـ backend الآمن
 */
async function callMedicalAI(prompt, reportData) {
  const response = await fetch('/api/groq/medical-archive', {  // سيتم تحويله لـ Gemini في المهمة 2.5
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report: reportData,
      question: prompt
    })
  });
  
  if (!response.ok) {
    throw new Error(`Medical AI Error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.result || data.answer || '';
}
```

### الخطوة ج — ابحث عن كل استدعاء مباشر لـ Groq في الملف:
```javascript
await fetch('https://api.groq.com/openai/v1/chat/completions', { ... })
```
واستبدله باستدعاء `callMedicalAI()`.

---

## ✅ المهمة 7 — تحويل الـ Chat Widget في الـ index-theme.js

**الملف:** `frontend/js/index-theme.js`

ابحث عن السطر:
```javascript
const chatApiEndpoint = '/api/groq/stream';
```

غيّره إلى:
```javascript
const chatApiEndpoint = '/api/ai/chat';
```

ثم تحقق من `streamGroqReply()` — تأكد أن المنطق يعمل مع `/api/ai/chat` (يرسل `{ message, sessionId }` ويستقبل `{ reply, sessionId, suggestions }`).

إذا كان `/api/ai/chat` يستخدم response عادي (مش streaming)، عدّل الدالة:
```javascript
async function sendChatMessage(question) {
  if (isSending) return;
  isSending = true;
  if (chatSend) chatSend.disabled = true;
  
  addMsg(question, 'user');
  if (typing) typing.style.display = 'flex';

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, sessionId: chatSessionId })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    chatSessionId = data.sessionId || chatSessionId;
    
    if (typing) typing.style.display = 'none';
    addMsg(data.reply || data.message || 'عذراً، لم أتمكن من الرد.', 'bot');
    
    // عرض اقتراحات المتابعة إن وجدت
    if (data.suggestions?.length > 0) {
      showSuggestions(data.suggestions);
    }
  } catch (err) {
    if (typing) typing.style.display = 'none';
    addMsg('عذراً، حدث خطأ في الاتصال. تواصل معنا: +966538229013', 'bot');
  } finally {
    isSending = false;
    if (chatSend) chatSend.disabled = false;
  }
}
```

---

## ✅ المهمة 8 — تحويل منصة React (brightai-platform)

### 8.1 — أنشئ `/brightai-platform/src/services/gemini.service.ts`

```typescript
/**
 * Gemini AI Service للمنصة
 * يستبدل GroqService في Agent Executor
 */

export type GeminiMessage = {
  role: 'user' | 'model';
  parts: [{ text: string }];
};

export type GeminiRequest = {
  systemPrompt?: string;
  messages: GeminiMessage[];
  maxTokens?: number;
  temperature?: number;
};

export type GeminiResponse = {
  text: string;
  tokensUsed?: number;
};

export class GeminiService {
  private readonly endpoint: string;

  constructor() {
    // يتصل بالـ backend الآمن — لا مفاتيح في Frontend
    this.endpoint = process.env.REACT_APP_API_URL || '';
  }

  async chat(request: GeminiRequest): Promise<GeminiResponse> {
    const lastUserMsg = [...request.messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) throw new Error('No user message found');

    const history = request.messages
      .slice(0, -1)
      .map(m => ({ role: m.role, parts: m.parts }));

    const response = await fetch(`${this.endpoint}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: lastUserMsg.parts[0].text,
        history,
        systemPrompt: request.systemPrompt,
        maxTokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.reply || data.message || '',
      tokensUsed: data.usage?.total_tokens
    };
  }

  async stream(
    request: GeminiRequest,
    onChunk: (text: string) => void,
    onDone?: () => void
  ): Promise<void> {
    const lastUserMsg = [...request.messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) throw new Error('No user message');

    const response = await fetch(`${this.endpoint}/api/groq/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: lastUserMsg.parts[0].text,
        outputType: 'agent',
        systemPromptOverride: request.systemPrompt
      })
    });

    if (!response.ok || !response.body) throw new Error('Stream failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const msg = line.replace(/^data:\s*/, '').trim();
        if (!msg || msg === '[DONE]') continue;
        try {
          const parsed = JSON.parse(msg);
          const chunk = parsed?.token || parsed?.choices?.[0]?.delta?.content;
          if (chunk) onChunk(chunk);
        } catch (_) {}
      }
    }
    if (onDone) onDone();
  }
}

export const geminiService = new GeminiService();
```

### 8.2 — تحديث `agent-executor/llm.ts`

ابحث عن:
```typescript
import { GroqError, type GroqMessage, type GroqRequest, GroqService } from "../groq.service";
```

أضف بعده:
```typescript
import { GeminiService } from "../gemini.service";
```

ثم في دالة `callLLM` أو ما يشابهها، أضف fallback:
```typescript
// استخدم GeminiService كـ primary مع Groq كـ fallback
const client = new GeminiService();
try {
  const result = await client.chat({
    systemPrompt: systemMessage,
    messages: conversationHistory,
    maxTokens: request.max_tokens,
    temperature: request.temperature
  });
  return result.text;
} catch (geminiError) {
  // Fallback إلى Groq إذا فشل Gemini
  console.warn('Gemini failed, falling back to Groq:', geminiError);
  const groqClient = new GroqService();
  return await groqClient.chat(request);
}
```

---

## ✅ المهمة 9 — تحديث `/backend/server.js`

أضف المسارات الجديدة في server.js:

```javascript
// إضافة في أعلى الملف
const { geminiAnalyzeHandler, geminiTextAnalysisHandler, geminiChatHandler } = require('./routes/gemini');

// إضافة في router بعد المسارات الموجودة:
// POST /api/gemini/chat     → محادثة عامة
// POST /api/gemini/analyze  → تحليل بيانات CSV/Excel
// POST /api/gemini/text-analysis → تحليل نصوص
```

---

## ✅ المهمة 10 — تحديث `.env`

تأكد أن `/backend/.env` يحتوي على:
```env
# Gemini AI — PRIMARY
GEMINI_API_KEY=AIzaSy...   ← ضع المفتاح الصحيح هنا
GEMINI_MODEL=gemini-2.5-flash

# Groq — Fallback للـ Transcription فقط
GROQ_API_KEY=gsk_...       ← يُبقى للـ Whisper transcription فقط
```

وتأكد أن `frontend/env.js` **لا يحتوي** على أي مفتاح:
```javascript
// frontend/env.js - آمن تماماً
window.BRIGHTAI_ENV = window.BRIGHTAI_ENV || {};
// لا مفاتيح هنا أبداً
```

---

## 🧪 جدول اختبار بعد التنفيذ

| الميزة | الملف المعدّل | اختبار التحقق |
|--------|--------------|---------------|
| الشات بوت (index.html) | `index-theme.js` | أرسل "ما خدماتكم؟" وتحقق من رد AI |
| محلل البيانات | `try/data-analyzer/index.html` | ارفع CSV واطلب تحليلاً |
| تحليل النصوص | `try/text-analysis/index.html` | الصق نصاً واختر "تحليل المشاعر" |
| الأرشيف الطبي | `smart-medical-archive/smart-ai-logic.js` | اختبر تحليل تقرير طبي |
| Demo الرئيسي | `demo/index.html` + `/api/groq/stream` | اكتب طلباً وتحقق من البث |
| OCR Demo | `demo/ocr-demo/index.html` + `/api/groq/ocr` | ارفع صورة فاتورة |
| Agent Builder (Platform) | `brightai-platform/llm.ts` | نفّذ workflow بسيط |
| **الأهم:** DevTools Network | جميع الصفحات | تأكد عدم وجود أي استدعاء مباشر لـ `googleapis.com` أو `groq.com` من المتصفح |

---

## ⚠️ قواعد صارمة يجب اتباعها

1. **لا تكتب أي مفتاح API في أي ملف frontend** (HTML, JS, JSX, TS) — أبداً
2. **لا تحذف** `/backend/routes/groq.js` — فقط عدّله (الـ transcribe يحتاجه)
3. **لا تكسر** أي مسار موجود ويعمل — أضف الجديد ثم استبدل
4. **استخدم دائماً** `sanitizeUserInput()` من `/backend/utils/sanitizer.js` على كل مدخلات المستخدم
5. **طبّق** `rateLimiterMiddleware` على كل مسار جديد
6. **أضف** `try/catch` على كل استدعاء لـ `callGemini()` مع رسالة خطأ عربية
7. **النموذج الثابت:** `gemini-2.5-flash` في كل مكان ما لم يُطلب غيره صراحةً

---

## 📁 ملخص الملفات المتأثرة

```
تعديل:
├── backend/
│   ├── routes/groq.js          ← استبدال Groq بـ Gemini في كل handler
│   ├── routes/search.js        ← استبدال RAG Groq بـ Gemini
│   ├── server.js               ← إضافة routes جديدة
│   └── .env                    ← تأكيد GEMINI_API_KEY

إنشاء جديد:
├── backend/
│   ├── utils/geminiClient.js   ← Helper موحد ← الأولوية الأولى
│   └── routes/gemini.js        ← مسارات: analyze, text-analysis, chat

تعديل:
├── frontend/js/
│   └── index-theme.js          ← تغيير endpoint من Groq إلى /api/ai/chat
├── frontend/pages/try/
│   ├── data-analyzer/index.html ← حذف مفتاح + تغيير fetch
│   └── text-analysis/index.html ← حذف مفتاح + تغيير fetch
└── frontend/pages/smart-medical-archive/
    └── smart-ai-logic.js       ← حذف getGroqConfig + توجيه للـ backend

تعديل (منصة React):
└── brightai-platform/src/services/
    ├── gemini.service.ts        ← ملف جديد
    └── agent-executor/llm.ts   ← إضافة Gemini كـ primary
```