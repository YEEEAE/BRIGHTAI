/**
 * Groq Integration Endpoints
 * - Streaming for /demo
 * - OCR JSON extraction for /demo/ocr-demo
 * - FAQ generation for report page
 */

const { config, isApiKeyConfigured, isGroqConfigured } = require('../config');
const { sanitizeForAI, sanitizeUserInput } = require('../utils/sanitizer');
const { retryWithBackoff } = require('../utils/errorHandler');
const { createSessionId, getOrCreateSession, addToSession } = require('../utils/sessionStore');

const MAX_OCR_TEXT_CHARS = 6000;
const MAX_MEDICAL_REPORT_CHARS = 12000;
const MAX_MEDICAL_RECORDS = 40;
const MAX_MEDICAL_QUERY_CHARS = 500;
const MAX_MEDICAL_AGENT_QUESTION_CHARS = 1200;
const MAX_EXTRACT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TRANSCRIBE_FILE_BYTES = 25 * 1024 * 1024;
const GROQ_STREAM_TIMEOUT_MS = Math.max(
  1000,
  Number(config.groq.streamTimeoutMs) || 30000
);

const DEMO_SYSTEM_PROMPT = `
أنت مستشار أعمال سعودي لشركة Bright AI. هدفك تقديم مخرجات عملية ومختصرة لصناع القرار.

قواعد صارمة:
- اكتب بالعربية الفصحى وبلهجة سعودية احترافية.
- لا تذكر معلومات حساسة أو أسعار.
- أجب في نقاط واضحة (5 إلى 7 نقاط كحد أقصى).
- اختم بجملة تحفّز على تجربة أعمق أو استشارة تنفيذية.
`;

const OCR_SYSTEM_PROMPT = `
أنت خبير استخراج بيانات من نص OCR. المطلوب: تحويل النص إلى JSON منسق فقط بدون أي شرح.

قواعد الإخراج:
- أعِد JSON فقط بصيغة كائن.
- المفاتيح الأساسية: document_type, invoice_number, total_amount, tax_amount, date, vendor_name, currency, items.
- items مصفوفة من كائنات تحتوي: name, quantity, price.
- اترك القيم الفارغة null إذا لم تتوفر.
`;

const FAQ_SYSTEM_PROMPT = `
أنت محرر محتوى سعودي. استخرج أسئلة وأجوبة قصيرة بناءً على السياق.
أعد المخرجات بصيغة JSON فقط على شكل مصفوفة من العناصر:
[
  {"question": "...", "answer": "..."}
]
القواعد:
- 3 إلى 5 أسئلة كحد أقصى.
- إجابة قصيرة من جملة إلى جملتين.
- بدون مبالغة أو وعود.
`;

const MEDICAL_ARCHIVE_SYSTEM_PROMPT = `
أنت محرك أرشيف طبي ذكي تجريبي لمنشآت صحية في السعودية.
المطلوب:
- إنتاج JSON فقط بدون Markdown أو شرح.
- الالتزام التام بالمفاتيح المطلوبة لكل مهمة.
- عدم اختراع حقائق غير موجودة في المدخلات.
- عندما تكون البيانات ناقصة، استخدم null أو مصفوفة فارغة.
- الصياغة باللغة العربية الواضحة والمهنية.
`;

const MEDICAL_AGENT_SYSTEM_PROMPT = `
أنت وكيل ذكي تشغيلي للقطاع الصحي السعودي.
المطلوب:
- تقييم السؤال التنفيذي بالاعتماد على السجلات الطبية التجريبية وملخص الدفعة.
- إعادة JSON فقط بدون شرح إضافي أو Markdown.
- صياغة حلول تنفيذية مباشرة وقابلة للقياس.
- الالتزام بهذا الشكل:
{
  "summary": "ملخص تنفيذي قصير",
  "actions": [
    {"priority": "critical|high|medium|low", "action": "إجراء واضح", "owner": "الجهة المسؤولة", "timeline": "مدة تنفيذ"}
  ],
  "risks": [
    {"level": "critical|high|medium|low", "message": "وصف الخطر"}
  ],
  "kpis": [
    {"name": "اسم المؤشر", "value": "قيمة مستهدفة"}
  ]
}
`;

function normalizeGroqApiKey(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === 'YOUR_KEY_HERE') return '';
  if (!trimmed.startsWith('gsk_')) return '';
  return trimmed;
}

function resolveHeaderValue(headers, key) {
  if (!headers || typeof headers !== 'object') return '';
  if (typeof headers[key] === 'string') return headers[key];
  if (typeof headers[key.toLowerCase()] === 'string') return headers[key.toLowerCase()];
  if (typeof headers[key.toUpperCase()] === 'string') return headers[key.toUpperCase()];
  return '';
}

function resolveGroqApiKey(req) {
  const body = req && req.body && typeof req.body === 'object' ? req.body : {};
  const headers = req && req.headers && typeof req.headers === 'object' ? req.headers : {};

  const fromBody = normalizeGroqApiKey(
    body.groqApiKey || body.groq_api_key || body.apiKey || body.api_key || ''
  );
  if (fromBody) return fromBody;

  const fromHeaderDirect = normalizeGroqApiKey(
    resolveHeaderValue(headers, 'x-groq-api-key') ||
    resolveHeaderValue(headers, 'x-groq-key') ||
    resolveHeaderValue(headers, 'x-api-key') ||
    ''
  );
  if (fromHeaderDirect) return fromHeaderDirect;

  const authHeader = resolveHeaderValue(headers, 'authorization') || '';
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const bearerKey = normalizeGroqApiKey(authHeader.slice(7));
    if (bearerKey) return bearerKey;
  }

  return normalizeGroqApiKey(config.groq.apiKey);
}

function resolveGroqModel(req) {
  const body = req && req.body && typeof req.body === 'object' ? req.body : {};
  const candidate = String(body.geminiModel || body.model || body.groqModel || '').trim();
  const fallbackModel = String(config.gemini.model || 'gemini-2.5-flash').trim();
  if (!candidate) return fallbackModel;
  return candidate.slice(0, 120);
}

function requireGroqApiKey(req, res) {
  if (isApiKeyConfigured()) {
    return '__gemini__';
  }

  const groqApiKey = resolveGroqApiKey(req);
  if (groqApiKey) {
    return groqApiKey;
  }

  // Keep config-level check centralized while preserving runtime key support from request.
  const configuredInEnv = isGroqConfigured();
  return res.status(503).json({
    error: configuredInEnv
      ? 'مفتاح خدمة الذكاء غير صالح أو غير مدعوم حالياً'
      : 'خدمة Gemini غير متاحة حالياً',
    errorCode: 'GEMINI_NOT_CONFIGURED'
  }), null;
}

function buildGroqMessages({ systemPrompt, history = [], userMessage }) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const item of history) {
    if (!item || !item.role || typeof item.content !== 'string') continue;
    messages.push({ role: item.role, content: item.content });
  }

  messages.push({ role: 'user', content: userMessage });
  return messages;
}

function normalizeOutputType(outputType) {
  if (!outputType) return 'ملخص تنفيذي';
  return String(outputType).trim();
}

function buildDemoUserMessage(message, outputType) {
  return `نوع المخرجات المطلوب: ${normalizeOutputType(outputType)}\nالطلب: ${message}`;
}

function parseJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const slice = text.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch (innerError) {
        return null;
      }
    }
    const arrStart = text.indexOf('[');
    const arrEnd = text.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      const slice = text.slice(arrStart, arrEnd + 1);
      try {
        return JSON.parse(slice);
      } catch (innerError) {
        return null;
      }
    }
  }
  return null;
}

function asSafeString(value, maxLen = 160) {
  if (typeof value !== 'string') return '';
  return sanitizeUserInput(value).slice(0, maxLen);
}

function normalizeAge(value) {
  const age = Number(value);
  if (!Number.isFinite(age)) return null;
  if (age < 0 || age > 120) return null;
  return age;
}

function asSafeList(value, maxItems = 8, maxLen = 120) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, maxItems)
    .map(item => {
      if (typeof item === 'string') {
        return asSafeString(item, maxLen);
      }
      if (!item || typeof item !== 'object') return '';
      if (typeof item.name === 'string') return asSafeString(item.name, maxLen);
      if (typeof item.title === 'string') return asSafeString(item.title, maxLen);
      if (typeof item.value === 'string') return asSafeString(item.value, maxLen);
      return '';
    })
    .filter(Boolean);
}

function asSafeMedicationList(value, maxItems = 8) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, maxItems)
    .map(item => {
      if (typeof item === 'string') {
        const name = asSafeString(item, 120);
        if (!name) return null;
        return { name, dose: null, frequency: null };
      }
      if (!item || typeof item !== 'object') return null;
      const name = asSafeString(item.name || item.medication || item.drug || '', 120);
      if (!name) return null;
      return {
        name,
        dose: asSafeString(item.dose || item.dosage || '', 60) || null,
        frequency: asSafeString(item.frequency || item.freq || '', 60) || null
      };
    })
    .filter(Boolean);
}

function normalizeHospitalProfile(profile) {
  const source = profile && typeof profile === 'object' ? profile : {};
  return {
    hospitalName: asSafeString(source.hospitalName || '', 100) || 'مستشفى تجريبي',
    department: asSafeString(source.department || '', 80) || null,
    city: asSafeString(source.city || '', 80) || 'السعودية'
  };
}

function normalizeMedicalRecord(record, index) {
  const source = record && typeof record === 'object' ? record : {};
  const patientSource = source.patient && typeof source.patient === 'object' ? source.patient : {};
  const summarySource = source.summary && typeof source.summary === 'object' ? source.summary : null;

  const recordId =
    asSafeString(source.recordId || source.id || '', 48) || `rec-${index + 1}`;

  return {
    recordId,
    patient: {
      name: asSafeString(patientSource.name || source.patientName || '', 80) || null,
      age: normalizeAge(patientSource.age ?? source.age),
      gender: asSafeString(patientSource.gender || source.gender || '', 32) || null,
      city: asSafeString(patientSource.city || source.city || '', 80) || null,
      hospital: asSafeString(
        patientSource.hospital || source.hospital || source.hospitalName || '',
        80
      ) || null
    },
    diagnoses: asSafeList(source.diagnoses || source.conditions || source.problems, 8, 120),
    medications: asSafeMedicationList(source.medications || source.drugs || source.prescriptions, 8),
    findings: asSafeList(source.findings || source.notes || source.alerts, 8, 140),
    summary: asSafeString(
      (summarySource && (summarySource.problem || summarySource.text)) || source.summary || '',
      240
    ) || null,
    capturedAt: asSafeString(source.capturedAt || source.createdAt || '', 40) || null
  };
}

function buildMedicalExtractPrompt(reportText, hospitalProfile) {
  return `
المهمة: استخراج بيانات صحية منظمة من تقرير طبي غير منظم.
الملف القادم من: ${hospitalProfile.hospitalName}
القسم: ${hospitalProfile.department || 'غير محدد'}
المدينة: ${hospitalProfile.city}

النص الطبي:
${reportText}

أعد JSON فقط بهذا الشكل:
{
  "recordId": "سلسلة قصيرة",
  "patient": {
    "name": "نص أو null",
    "age": 0,
    "gender": "نص أو null",
    "city": "نص أو null",
    "hospital": "نص أو null",
    "medicalRecordNumber": "نص أو null"
  },
  "encounter": {
    "date": "YYYY-MM-DD أو null",
    "department": "نص أو null",
    "physician": "نص أو null"
  },
  "diagnoses": [
    {"name": "نص", "status": "active|history|suspected", "certainty": "confirmed|suspected|unknown"}
  ],
  "medications": [
    {"name": "نص", "dose": "نص أو null", "frequency": "نص أو null", "route": "نص أو null", "duration": "نص أو null"}
  ],
  "labs": [
    {"name": "نص", "value": "نص أو null", "unit": "نص أو null", "status": "high|low|normal|unknown"}
  ],
  "procedures": [
    {"name": "نص", "date": "YYYY-MM-DD أو null"}
  ],
  "alerts": [
    {"type": "risk|allergy|drug_interaction|followup", "message": "نص"}
  ],
  "summary": {
    "problem": "نص مختصر",
    "plan": "نص مختصر",
    "nextStep": "نص مختصر"
  },
  "confidence": 0.0
}
`;
}

function buildMedicalSearchPrompt(query, records) {
  return `
المهمة: تنفيذ بحث لغة طبيعية على أرشيف طبي منظم.
استعلام المستخدم:
${query}

السجلات:
${JSON.stringify(records)}

أعد JSON فقط بهذا الشكل:
{
  "matchedRecordIds": ["rec-1"],
  "totalMatches": 0,
  "whyMatched": [
    {"recordId": "rec-1", "reasons": ["سبب 1", "سبب 2"]}
  ],
  "aggregates": {
    "topDiagnoses": [{"name": "نص", "count": 0}],
    "topMedications": [{"name": "نص", "count": 0}]
  },
  "answer": "إجابة مختصرة ومباشرة عن الاستعلام"
}
`;
}

function buildMedicalInsightsPrompt(records, hospitalProfile) {
  return `
المهمة: توليد مؤشرات تشغيلية من أرشيف طبي تجريبي.
المنشأة: ${hospitalProfile.hospitalName}
القسم: ${hospitalProfile.department || 'غير محدد'}
المدينة: ${hospitalProfile.city}

السجلات:
${JSON.stringify(records)}

أعد JSON فقط بهذا الشكل:
{
  "kpis": {
    "recordsAnalyzed": 0,
    "highRiskCases": 0,
    "activeDiagnosisCount": 0
  },
  "topDiagnoses": [{"name": "نص", "count": 0}],
  "topMedications": [{"name": "نص", "count": 0}],
  "alerts": [
    {"level": "critical|high|medium|low", "message": "نص"}
  ],
  "recommendations": [
    {"priority": "critical|high|medium|low", "action": "نص تنفيذي واضح"}
  ]
}
`;
}

function buildMedicalAgentPrompt({ question, records, hospitalProfile, batchReport }) {
  return `
سؤال الإدارة الصحية:
${question}

بيانات المنشأة:
${JSON.stringify(hospitalProfile)}

ملخص الدفعة:
${JSON.stringify(batchReport)}

السجلات الطبية:
${JSON.stringify(records)}
`;
}

function createUpstreamRequestSignal(externalSignal, timeoutMs) {
  const controller = new AbortController();
  let timeoutId = null;
  let externalAbortHandler = null;

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error('GROQ_TIMEOUT');
      timeoutError.code = 'GROQ_TIMEOUT';
      controller.abort(timeoutError);
    }, timeoutMs);

    if (timeoutId.unref) {
      timeoutId.unref();
    }
  }

  if (externalSignal) {
    externalAbortHandler = () => {
      const abortReason = externalSignal.reason || new Error('CLIENT_ABORTED');
      if (abortReason && typeof abortReason === 'object' && !abortReason.code) {
        abortReason.code = 'CLIENT_ABORTED';
      }
      controller.abort(abortReason);
    };

    if (externalSignal.aborted) {
      externalAbortHandler();
    } else {
      externalSignal.addEventListener('abort', externalAbortHandler, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup() {
      if (timeoutId) clearTimeout(timeoutId);
      if (externalSignal && externalAbortHandler) {
        externalSignal.removeEventListener('abort', externalAbortHandler);
      }
    }
  };
}

function buildStreamErrorPayload(error) {
  const statusCode = error?.statusCode || 500;
  const upstreamErrorCode = error?.code || '';

  if (statusCode === 429 || upstreamErrorCode === 'RATE_LIMIT_EXCEEDED') {
    return {
      error: 'تم تجاوز حد المعدل، حاول مرة ثانية بعد دقيقة.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryable: true
    };
  }

  if (statusCode === 408 || upstreamErrorCode === 'GROQ_TIMEOUT') {
    return {
      error: 'انتهت مهلة الرد من الخدمة، حاول مرة ثانية.',
      errorCode: 'STREAM_TIMEOUT',
      retryable: true
    };
  }

  if (statusCode === 503) {
    return {
      error: 'الخدمة غير متاحة حالياً.',
      errorCode: 'AI_UNAVAILABLE',
      retryable: true
    };
  }

  if (statusCode === 401 || statusCode === 403) {
    return {
      error: 'تعذر التحقق من صلاحية الاتصال بالخدمة.',
      errorCode: 'AI_AUTH_ERROR',
      retryable: false
    };
  }

  return {
    error: 'حدث خطأ أثناء البث.',
    errorCode: 'AI_STREAM_ERROR',
    retryable: true
  };
}

function isStreamingRequested(body) {
  if (!body || typeof body !== 'object') return false;
  if (body.stream === true) return true;
  if (typeof body.stream === 'string') {
    const normalized = body.stream.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }
  return false;
}

async function streamGroqCompletion({
  req,
  res,
  messages,
  apiKey,
  model,
  temperature,
  maxTokens,
  metaPayload = null,
  onCompleted = null
}) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  if (metaPayload && typeof metaPayload === 'object') {
    res.write(`data: ${JSON.stringify(metaPayload)}\n\n`);
  }

  const controller = new AbortController();
  req.on('close', () => {
    const closeError = new Error('CLIENT_ABORTED');
    closeError.code = 'CLIENT_ABORTED';
    controller.abort(closeError);
  });

  let assistantText = '';

  try {
    const groqResponse = await callGroq({
      messages,
      temperature,
      maxTokens,
      apiKey,
      model,
      stream: true,
      signal: controller.signal
    });

    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.replace(/^data:\s*/, '');
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            assistantText += delta;
            res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
          }
        } catch (_error) {
          continue;
        }
      }
    }

    if (onCompleted) {
      const finalPayload = await onCompleted(assistantText.trim());
      if (finalPayload && typeof finalPayload === 'object') {
        res.write(`data: ${JSON.stringify(finalPayload)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (error) {
    if (error?.code === 'CLIENT_ABORTED') {
      return;
    }
    const payload = buildStreamErrorPayload(error);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.write('data: [DONE]\n\n');
  } finally {
    try {
      res.end();
    } catch (_endError) {
      // Ignore closed-connection end errors
    }
  }
}

function mapGeminiRole(role) {
  return role === 'assistant' || role === 'model' ? 'model' : 'user';
}

function normalizeGeminiParts(content) {
  if (Array.isArray(content)) {
    const parts = [];
    for (const item of content) {
      if (!item || typeof item !== 'object') continue;
      if (item.type === 'text' && typeof item.text === 'string') {
        parts.push({ text: item.text });
        continue;
      }
      if (item.type === 'image_url' && item.image_url && typeof item.image_url.url === 'string') {
        const rawUrl = item.image_url.url.trim();
        const matched = rawUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matched) {
          parts.push({
            inlineData: {
              mimeType: matched[1],
              data: matched[2]
            }
          });
        }
      }
    }
    return parts;
  }

  const text = String(content || '');
  if (!text.trim()) return [];
  return [{ text }];
}

function toGeminiContents(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: 'user', parts: [{ text: '' }] }];
  }

  const contents = [];
  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const parts = normalizeGeminiParts(message.content);
    if (!parts.length) continue;
    contents.push({
      role: mapGeminiRole(message.role),
      parts
    });
  }

  return contents.length ? contents : [{ role: 'user', parts: [{ text: '' }] }];
}

function toOpenAiLikeJsonResponse(text) {
  const payload = {
    choices: [
      {
        message: { content: String(text || '') },
        finish_reason: 'stop'
      }
    ]
  };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function chunkForSse(text, chunkSize = 80) {
  const value = String(text || '');
  const chunks = [];
  for (let i = 0; i < value.length; i += chunkSize) {
    chunks.push(value.slice(i, i + chunkSize));
  }
  return chunks;
}

function toOpenAiLikeStreamResponse(text) {
  const encoder = new TextEncoder();
  const chunks = chunkForSse(text, 80);
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        const line = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`;
        controller.enqueue(encoder.encode(line));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
  });
}

async function callGroq({
  messages,
  temperature = 0.4,
  maxTokens = 900,
  stream = false,
  apiKey = '',
  model = '',
  tools = null,
  toolChoice = null,
  signal,
  timeoutMs = GROQ_STREAM_TIMEOUT_MS
}) {
  if (!isApiKeyConfigured()) {
    const error = new Error('GEMINI_NOT_CONFIGURED');
    error.statusCode = 503;
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }

  const activeModel = String(model || config.gemini.model || '').trim() || 'gemini-2.5-flash';
  const { signal: requestSignal, cleanup } = createUpstreamRequestSignal(signal, timeoutMs);
  const startedAt = Date.now();
  const promptChars = Array.isArray(messages)
    ? messages.reduce((sum, item) => sum + JSON.stringify(item?.content || '').length, 0)
    : 0;

  try {
    const response = await retryWithBackoff(
      async () => {
        const upstreamResponse = await fetch(
          `${config.gemini.endpoint}/${activeModel}:generateContent?key=${config.gemini.apiKey}`,
          {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: toGeminiContents(messages),
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens
            }
          }),
          signal: requestSignal
        });

        if (!upstreamResponse.ok) {
          const errText = await upstreamResponse.text().catch(() => upstreamResponse.statusText);
          const error = new Error(errText || 'Gemini API Error');
          error.statusCode = upstreamResponse.status;
          error.code = upstreamResponse.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'GEMINI_API_ERROR';
          throw error;
        }

        const data = await upstreamResponse.json();
        const text = data?.candidates?.[0]?.content?.parts
          ?.map(part => String(part?.text || ''))
          .join('\n')
          .trim() || '';

        return stream
          ? toOpenAiLikeStreamResponse(text)
          : toOpenAiLikeJsonResponse(text);
      },
      {
        maxRetries: 2,
        baseDelay: 800,
        shouldRetry: (_error, statusCode) => statusCode === 429 || statusCode === 503,
        onRetry: (attempt, delay, error) => {
          console.warn(`Retrying Groq API call (attempt ${attempt}) after ${delay}ms due to: ${error.message}`);
        }
      }
    );

    const durationMs = Date.now() - startedAt;
    console.log(
      `[GeminiAdapter] model=${activeModel} stream=${stream ? 1 : 0} duration_ms=${durationMs} prompt_chars=${promptChars}`
    );

    return response;
  } catch (error) {
    const isAbortError = error?.name === 'AbortError' || error?.code === 'ABORT_ERR';
    const reason = requestSignal.reason || null;
    const reasonCode = reason?.code || '';

    if (isAbortError && reasonCode === 'GROQ_TIMEOUT') {
      const timeoutError = new Error('GROQ_TIMEOUT');
      timeoutError.statusCode = 408;
      timeoutError.code = 'GROQ_TIMEOUT';
      throw timeoutError;
    }

    if (isAbortError && reasonCode === 'CLIENT_ABORTED') {
      const clientAbortError = new Error('CLIENT_ABORTED');
      clientAbortError.statusCode = 499;
      clientAbortError.code = 'CLIENT_ABORTED';
      throw clientAbortError;
    }

    const durationMs = Date.now() - startedAt;
    const statusCode = error?.statusCode || error?.status || 'n/a';
    console.error(
      `[GeminiAdapter] request_failed model=${activeModel} stream=${stream ? 1 : 0} duration_ms=${durationMs} prompt_chars=${promptChars} status=${statusCode} error=${error?.message || 'unknown'}`
    );

    throw error;
  } finally {
    cleanup();
  }
}

async function extractTextWithGemini({ base64Data, mimeType }) {
  if (!isApiKeyConfigured()) {
    const error = new Error('GEMINI_NOT_CONFIGURED');
    error.statusCode = 503;
    throw error;
  }

  const url = `${config.gemini.endpoint}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'استخرج النص الكامل من المستند التالي. أعد النص فقط بدون شرح.' },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    const error = new Error(errText || 'Gemini OCR Error');
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  return text.trim();
}

async function extractTextWithGroqVision({ base64Data, mimeType, apiKey = '' }) {
  // Kept for backward compatibility in callers; now routed to Gemini OCR.
  return extractTextWithGemini({ base64Data, mimeType });
}

async function callGeminiText({ prompt, maxOutputTokens = 1800, temperature = 0.2 }) {
  if (!isApiKeyConfigured()) {
    const error = new Error('GEMINI_NOT_CONFIGURED');
    error.statusCode = 503;
    throw error;
  }

  const url = `${config.gemini.endpoint}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    const error = new Error(errText || 'Gemini Agent Error');
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  return text.trim();
}

async function transcribeAudioWithGemini({ base64Data, mimeType }) {
  if (!isApiKeyConfigured()) {
    const error = new Error('GEMINI_NOT_CONFIGURED');
    error.statusCode = 503;
    throw error;
  }

  const url = `${config.gemini.endpoint}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'حوّل الملف الصوتي التالي إلى نص عربي واضح. أعد النص فقط بدون أي شرح أو تنسيق إضافي.' },
            { inlineData: { mimeType: mimeType || 'audio/wav', data: base64Data } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2200
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    const error = new Error(errText || 'GEMINI_TRANSCRIBE_ERROR');
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => String(part?.text || ''))
    .join('\n')
    .trim() || '';
  return text;
}

function safeFileName(fileName) {
  const cleaned = String(fileName || 'medical-file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  return cleaned || `medical-file-${Date.now()}`;
}

function stripDataPrefix(base64Data = '') {
  if (base64Data.includes(',')) {
    return base64Data.split(',').pop();
  }
  return base64Data;
}

async function groqStreamHandler(req, res, rawRes) {
  const jsonRes = res;
  const streamRes = rawRes || res;
  const groqApiKey = resolveGroqApiKey(req);
  const groqModel = resolveGroqModel(req);
  const useGeminiStream = isApiKeyConfigured();

  if (!useGeminiStream && !groqApiKey) {
    requireGroqApiKey(req, jsonRes);
    return;
  }

  const { message, sessionId, outputType } = req.body || {};

  if (!message || typeof message !== 'string') {
    return jsonRes.status(400).json({
      error: 'يرجى إدخال نص صحيح للديمو',
      errorCode: 'INVALID_MESSAGE'
    });
  }

  if (message.length > config.validation.maxInputLength) {
    return jsonRes.status(400).json({
      error: 'النص طويل جداً للديمو',
      errorCode: 'MESSAGE_TOO_LONG'
    });
  }

  const sanitizedMessage = sanitizeForAI(message);
  const session = getOrCreateSession(sessionId);
  const activeSessionId = session.id || sessionId || createSessionId();
  const userMessage = buildDemoUserMessage(sanitizedMessage, outputType);

  const messages = buildGroqMessages({
    systemPrompt: DEMO_SYSTEM_PROMPT,
    history: session.history,
    userMessage
  });

  addToSession(activeSessionId, 'user', userMessage);

  streamRes.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  streamRes.write(`data: ${JSON.stringify({ sessionId: activeSessionId })}\n\n`);

  const controller = new AbortController();
  req.on('close', () => {
    const closeError = new Error('CLIENT_ABORTED');
    closeError.code = 'CLIENT_ABORTED';
    controller.abort(closeError);
  });

  let assistantText = '';

  try {
    if (useGeminiStream) {
      const prompt = messages
        .map((item) => {
          const role = item?.role || 'user';
          const content = Array.isArray(item?.content)
            ? JSON.stringify(item.content)
            : String(item?.content || '');
          return `${role.toUpperCase()}:\n${content}`;
        })
        .join('\n\n');

      assistantText = await callGeminiText({
        prompt,
        maxOutputTokens: 900,
        temperature: 0.6
      });

      if (assistantText) {
        streamRes.write(`data: ${JSON.stringify({ token: assistantText })}\n\n`);
      }
      streamRes.write('data: [DONE]\n\n');
    } else {
      const groqResponse = await callGroq({
        messages,
        temperature: 0.6,
        maxTokens: 900,
        apiKey: groqApiKey,
        model: groqModel,
        stream: true,
        signal: controller.signal
      });

      const reader = groqResponse.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.replace(/^data:\s*/, '');
          if (payload === '[DONE]') {
            streamRes.write('data: [DONE]\n\n');
            break;
          }
          if (!payload) continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              streamRes.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
            }
          } catch (error) {
            continue;
          }
        }
      }
    }

    if (assistantText.trim().length > 0) {
      addToSession(activeSessionId, 'assistant', assistantText.trim());
    }
  } catch (error) {
    if (error?.code === 'CLIENT_ABORTED') {
      return;
    }

    const payload = buildStreamErrorPayload(error);
    streamRes.write(`data: ${JSON.stringify(payload)}\n\n`);
    streamRes.write('data: [DONE]\n\n');
  } finally {
    try {
      streamRes.end();
    } catch (endError) {
      // Ignore closed-connection end errors
    }
  }
}

async function groqOcrHandler(req, res) {
  const groqApiKey = requireGroqApiKey(req, res);
  const groqModel = resolveGroqModel(req);

  if (!groqApiKey) {
    return;
  }

  const { fileBase64, mimeType, ocrText } = req.body || {};

  if (!ocrText && !fileBase64) {
    return res.status(400).json({
      error: 'يرجى رفع ملف أو نص OCR',
      errorCode: 'MISSING_OCR_INPUT'
    });
  }

  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
  if (fileBase64 && mimeType && !allowedMimes.includes(mimeType)) {
    return res.status(400).json({
      error: 'نوع الملف غير مدعوم حالياً',
      errorCode: 'UNSUPPORTED_FILE'
    });
  }

  let extractedText = '';
  let truncated = false;

  try {
    if (ocrText && typeof ocrText === 'string') {
      extractedText = sanitizeForAI(ocrText);
    } else {
      const cleanedBase64 = stripDataPrefix(fileBase64 || '');
      const base64Size = Buffer.byteLength(cleanedBase64, 'base64');
      if (base64Size > config.validation.ocrMaxBodyBytes) {
        return res.status(413).json({
          error: 'حجم الملف كبير جداً',
          errorCode: 'OCR_FILE_TOO_LARGE'
        });
      }
      if (isApiKeyConfigured()) {
        extractedText = await extractTextWithGemini({
          base64Data: cleanedBase64,
          mimeType: mimeType || 'image/png'
        });
      } else {
        extractedText = await extractTextWithGroqVision({
          base64Data: cleanedBase64,
          mimeType: mimeType || 'image/png',
          apiKey: groqApiKey
        });
      }
    }

    if (extractedText.length > MAX_OCR_TEXT_CHARS) {
      extractedText = extractedText.slice(0, MAX_OCR_TEXT_CHARS);
      truncated = true;
    }

    const userPrompt = `النص المستخرج:\n${extractedText}\n\nأعد JSON فقط حسب القواعد.`;
    const messages = buildGroqMessages({
      systemPrompt: OCR_SYSTEM_PROMPT,
      history: [],
      userMessage: userPrompt
    });

    const response = await callGroq({
      messages,
      temperature: 0.2,
      maxTokens: 700,
      apiKey: groqApiKey,
      model: groqModel,
      stream: false
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';
    const parsed = parseJsonFromText(text);

    if (!parsed) {
      return res.status(500).json({
        error: 'تعذر تحليل النتائج بصيغة JSON',
        errorCode: 'INVALID_JSON_OUTPUT'
      });
    }

    return res.status(200).json({
      fields: parsed,
      rawText: extractedText,
      truncated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: statusCode === 503
        ? 'خدمة OCR غير متاحة حالياً'
        : 'حدث خطأ أثناء تحليل الملف',
      errorCode: 'OCR_PROCESSING_ERROR'
    });
  }
}

async function groqFaqHandler(req, res) {
  const groqApiKey = requireGroqApiKey(req, res);
  const groqModel = resolveGroqModel(req);

  if (!groqApiKey) {
    return;
  }

  const { context } = req.body || {};

  if (!context || typeof context !== 'string') {
    return res.status(400).json({
      error: 'يرجى توفير سياق التقرير',
      errorCode: 'MISSING_CONTEXT'
    });
  }

  const sanitizedContext = sanitizeForAI(context).slice(0, 4000);
  const userPrompt = `السياق:\n${sanitizedContext}\n\nأعد الأسئلة والأجوبة بصيغة JSON فقط.`;

  try {
    const messages = buildGroqMessages({
      systemPrompt: FAQ_SYSTEM_PROMPT,
      history: [],
      userMessage: userPrompt
    });

    if (isStreamingRequested(req.body)) {
      return streamGroqCompletion({
        req,
        res,
        messages,
        apiKey: groqApiKey,
        model: groqModel,
        temperature: 0.3,
        maxTokens: 700,
        metaPayload: { mode: 'faq', model: groqModel },
        onCompleted: (assistantText) => {
          const parsed = parseJsonFromText(assistantText);
          if (!Array.isArray(parsed)) {
            return {
              error: 'تعذر توليد FAQ بصيغة صحيحة',
              errorCode: 'INVALID_FAQ_OUTPUT'
            };
          }
          const faqs = parsed
            .filter(item => item && typeof item.question === 'string' && typeof item.answer === 'string')
            .slice(0, 5);
          return { faqs };
        }
      });
    }

    const response = await callGroq({
      messages,
      temperature: 0.3,
      maxTokens: 700,
      apiKey: groqApiKey,
      model: groqModel,
      stream: false
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';
    const parsed = parseJsonFromText(text);

    if (!Array.isArray(parsed)) {
      return res.status(500).json({
        error: 'تعذر توليد FAQ بصيغة صحيحة',
        errorCode: 'INVALID_FAQ_OUTPUT'
      });
    }

    const faqs = parsed
      .filter(item => item && typeof item.question === 'string' && typeof item.answer === 'string')
      .slice(0, 5);

    return res.status(200).json({ faqs });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: 'حدث خطأ أثناء توليد FAQ',
      errorCode: 'FAQ_GENERATION_ERROR'
    });
  }
}

async function groqExtractTextHandler(req, res) {
  const { fileBase64, mimeType, fileName } = req.body || {};
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    return res.status(400).json({
      error: 'يرجى تزويد ملف بصيغة Base64',
      errorCode: 'MISSING_FILE_BASE64'
    });
  }

  const cleanedBase64 = stripDataPrefix(fileBase64);
  const bytes = Buffer.byteLength(cleanedBase64, 'base64');
  if (!bytes || bytes > MAX_EXTRACT_FILE_BYTES) {
    return res.status(413).json({
      error: 'حجم الملف غير مدعوم لاستخراج النص',
      errorCode: 'EXTRACT_FILE_TOO_LARGE'
    });
  }

  if (!isApiKeyConfigured()) {
    return res.status(503).json({
      error: 'يتطلب هذا المسار إعداد GEMINI_API_KEY لاستخراج النص',
      errorCode: 'GEMINI_NOT_CONFIGURED'
    });
  }

  try {
    const safeMimeType = asSafeString(mimeType || 'application/octet-stream', 80);
    const text = await extractTextWithGemini({
      base64Data: cleanedBase64,
      mimeType: safeMimeType
    });

    const normalized = sanitizeForAI(text || '').slice(0, MAX_MEDICAL_REPORT_CHARS * 2);
    if (!normalized) {
      return res.status(422).json({
        error: 'تعذر استخراج نص واضح من الملف',
        errorCode: 'EMPTY_EXTRACTED_TEXT'
      });
    }

    return res.status(200).json({
      text: normalized,
      fileName: asSafeString(fileName || '', 120) || null,
      method: 'gemini-flash-ocr',
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: statusCode === 503
        ? 'خدمة استخراج النص غير متاحة حالياً'
        : 'حدث خطأ أثناء استخراج النص من الملف',
      errorCode: 'EXTRACT_TEXT_ERROR'
    });
  }
}

async function groqTranscribeHandler(req, res) {
  if (!isApiKeyConfigured()) {
    return res.status(503).json({
      error: 'خدمة تحويل الصوت إلى نص غير متاحة حالياً',
      errorCode: 'GEMINI_NOT_CONFIGURED'
    });
  }

  const { fileBase64, mimeType, fileName } = req.body || {};
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    return res.status(400).json({
      error: 'يرجى إرسال ملف صوتي بصيغة Base64',
      errorCode: 'MISSING_AUDIO_BASE64'
    });
  }

  try {
    const cleanedBase64 = stripDataPrefix(fileBase64);
    const audioBuffer = Buffer.from(cleanedBase64, 'base64');
    if (!audioBuffer.length || audioBuffer.length > MAX_TRANSCRIBE_FILE_BYTES) {
      return res.status(413).json({
        error: 'حجم الملف الصوتي كبير جداً',
        errorCode: 'AUDIO_FILE_TOO_LARGE'
      });
    }

    const text = asSafeString(
      await transcribeAudioWithGemini({
        base64Data: cleanedBase64,
        mimeType: mimeType || 'audio/wav'
      }),
      MAX_MEDICAL_REPORT_CHARS * 2
    );
    if (!text) {
      return res.status(422).json({
        error: 'لم يتم استخراج نص من الملف الصوتي',
        errorCode: 'EMPTY_TRANSCRIPTION'
      });
    }

    return res.status(200).json({
      text,
      duration: null,
      language: 'ar',
      model: config.gemini.model || 'gemini-2.5-flash',
      fileName: asSafeString(fileName || '', 120) || safeFileName('medical-audio.wav'),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: statusCode === 503
        ? 'خدمة تحويل الصوت إلى نص غير متاحة'
        : 'حدث خطأ أثناء تحويل الصوت إلى نص',
      errorCode: 'TRANSCRIBE_ERROR'
    });
  }
}

async function groqMedicalAgentHandler(req, res) {
  const { question, records, hospitalProfile, batchReport } = req.body || {};
  const groqApiKey = requireGroqApiKey(req, res);
  const groqModel = resolveGroqModel(req);
  const safeQuestion = asSafeString(question || '', MAX_MEDICAL_AGENT_QUESTION_CHARS);

  if (!groqApiKey) {
    return;
  }

  if (!safeQuestion || safeQuestion.length < 8) {
    return res.status(400).json({
      error: 'يرجى إدخال سؤال تشغيلي واضح',
      errorCode: 'INVALID_AGENT_QUESTION'
    });
  }

  const safeHospitalProfile = normalizeHospitalProfile(hospitalProfile);
  const normalizedRecords = Array.isArray(records)
    ? records
        .slice(0, MAX_MEDICAL_RECORDS)
        .map((record, index) => normalizeMedicalRecord(record, index))
        .filter(record => record && record.recordId)
    : [];

  const safeBatchReport = {
    total: Number(batchReport?.total) || 0,
    done: Number(batchReport?.done) || 0,
    errors: Number(batchReport?.errors) || 0,
    processing: Number(batchReport?.processing) || 0,
    cancelled: Number(batchReport?.cancelled) || 0,
    analyzed: Number(batchReport?.analyzed) || 0,
    uploaded: Number(batchReport?.uploaded) || 0
  };

  if (!normalizedRecords.length && !safeBatchReport.done) {
    return res.status(400).json({
      error: 'لا توجد سجلات أو نتائج دفعة كافية لتشغيل الوكيل',
      errorCode: 'AGENT_MISSING_CONTEXT'
    });
  }

  const prompt = buildMedicalAgentPrompt({
    question: safeQuestion,
    records: normalizedRecords,
    hospitalProfile: safeHospitalProfile,
    batchReport: safeBatchReport
  });

  try {
    const messages = buildGroqMessages({
      systemPrompt: MEDICAL_AGENT_SYSTEM_PROMPT,
      history: [],
      userMessage: prompt
    });

    if (isStreamingRequested(req.body)) {
      return streamGroqCompletion({
        req,
        res,
        messages,
        apiKey: groqApiKey,
        model: groqModel,
        temperature: 0.2,
        maxTokens: 1200,
        metaPayload: { mode: 'medical-agent', model: groqModel },
        onCompleted: (assistantText) => {
          const parsed = parseJsonFromText(assistantText);
          if (!parsed || typeof parsed !== 'object') {
            return {
              error: 'تعذر تفسير مخرجات الوكيل الذكي',
              errorCode: 'INVALID_AGENT_OUTPUT'
            };
          }
          return {
            result: parsed,
            model: groqModel,
            generatedAt: new Date().toISOString()
          };
        }
      });
    }

    const response = await callGroq({
      messages,
      temperature: 0.2,
      maxTokens: 1200,
      apiKey: groqApiKey,
      model: groqModel,
      stream: false
    });
    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content?.trim() || '';

    const parsed = parseJsonFromText(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return res.status(500).json({
        error: 'تعذر تفسير مخرجات الوكيل الذكي',
        errorCode: 'INVALID_AGENT_OUTPUT'
      });
    }

    return res.status(200).json({
      result: parsed,
      model: groqModel,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: statusCode === 503
        ? 'خدمة الوكيل الذكي غير متاحة'
        : 'حدث خطأ أثناء تشغيل الوكيل الذكي',
      errorCode: 'MEDICAL_AGENT_ERROR'
    });
  }
}

async function groqMedicalArchiveHandler(req, res) {
  const groqApiKey = requireGroqApiKey(req, res);
  const groqModel = resolveGroqModel(req);

  if (!groqApiKey) {
    return;
  }

  const { action, reportText, query, records, hospitalProfile } = req.body || {};
  const mode = typeof action === 'string' ? action.trim().toLowerCase() : 'extract';
  const allowedActions = ['extract', 'search', 'insights'];

  if (!allowedActions.includes(mode)) {
    return res.status(400).json({
      error: 'نوع العملية غير مدعوم',
      errorCode: 'UNSUPPORTED_ACTION'
    });
  }

  const safeHospitalProfile = normalizeHospitalProfile(hospitalProfile);
  let userMessage = '';
  let temperature = 0.15;
  let maxTokens = 1200;

  if (mode === 'extract') {
    const safeReportText = asSafeString(reportText || '', MAX_MEDICAL_REPORT_CHARS);
    if (!safeReportText || safeReportText.length < 30) {
      return res.status(400).json({
        error: 'التقرير الطبي قصير جداً أو غير صالح',
        errorCode: 'INVALID_REPORT_TEXT'
      });
    }
    userMessage = buildMedicalExtractPrompt(safeReportText, safeHospitalProfile);
  } else {
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        error: 'لا توجد سجلات كافية لتنفيذ العملية',
        errorCode: 'MISSING_RECORDS'
      });
    }

    const normalizedRecords = records
      .slice(0, MAX_MEDICAL_RECORDS)
      .map((record, index) => normalizeMedicalRecord(record, index))
      .filter(record => record && record.recordId);

    if (normalizedRecords.length === 0) {
      return res.status(400).json({
        error: 'تعذر قراءة السجلات المدخلة',
        errorCode: 'INVALID_RECORDS'
      });
    }

    if (mode === 'search') {
      const safeQuery = asSafeString(query || '', MAX_MEDICAL_QUERY_CHARS);
      if (!safeQuery || safeQuery.length < 3) {
        return res.status(400).json({
          error: 'يرجى إدخال سؤال بحث واضح',
          errorCode: 'INVALID_QUERY'
        });
      }
      userMessage = buildMedicalSearchPrompt(safeQuery, normalizedRecords);
      maxTokens = 1000;
    } else {
      userMessage = buildMedicalInsightsPrompt(normalizedRecords, safeHospitalProfile);
      maxTokens = 1100;
    }
  }

  try {
    const messages = buildGroqMessages({
      systemPrompt: MEDICAL_ARCHIVE_SYSTEM_PROMPT,
      history: [],
      userMessage
    });

    if (isStreamingRequested(req.body)) {
      return streamGroqCompletion({
        req,
        res,
        messages,
        apiKey: groqApiKey,
        model: groqModel,
        temperature,
        maxTokens,
        metaPayload: { mode, model: groqModel },
        onCompleted: (assistantText) => {
          const parsed = parseJsonFromText(assistantText);
          if (!parsed || typeof parsed !== 'object') {
            return {
              error: 'تعذر تفسير مخرجات النموذج',
              errorCode: 'INVALID_MEDICAL_OUTPUT'
            };
          }
          return {
            mode,
            result: parsed,
            model: groqModel,
            generatedAt: new Date().toISOString()
          };
        }
      });
    }

    const response = await callGroq({
      messages,
      temperature,
      maxTokens,
      apiKey: groqApiKey,
      model: groqModel,
      stream: false
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';
    const parsed = parseJsonFromText(text);

    if (!parsed || typeof parsed !== 'object') {
      return res.status(500).json({
        error: 'تعذر تفسير مخرجات النموذج',
        errorCode: 'INVALID_MEDICAL_OUTPUT'
      });
    }

    return res.status(200).json({
      mode,
      result: parsed,
      model: groqModel,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: 'حدث خطأ أثناء تشغيل الأرشيف الطبي الذكي',
      errorCode: 'MEDICAL_ARCHIVE_ERROR'
    });
  }
}

async function groqHealthHandler(_req, res) {
  if (!isApiKeyConfigured()) {
    return res.status(503).json({
      status: 'down',
      provider: 'gemini',
      errorCode: 'GEMINI_NOT_CONFIGURED',
      checkedAt: new Date().toISOString()
    });
  }

  try {
    await callGeminiText({
      prompt: 'ping',
      temperature: 0,
      maxOutputTokens: 8
    });

    return res.status(200).json({
      status: 'up',
      provider: 'gemini',
      model: config.gemini.model || 'gemini-2.5-flash',
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    const statusCode = error.statusCode || 503;
    return res.status(statusCode).json({
      status: 'down',
      provider: 'gemini',
      errorCode: error.code || 'GEMINI_HEALTH_FAILED',
      message: error.message || 'health check failed',
      checkedAt: new Date().toISOString()
    });
  }
}

async function groqOpenAiCompatHandler(req, res) {
  try {
    const body = req && req.body && typeof req.body === 'object' ? req.body : {};
    const model = resolveGroqModel(req);
    const temperature = Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.4;
    const maxTokens = Number.isFinite(Number(body.max_tokens || body.maxTokens))
      ? Number(body.max_tokens || body.maxTokens)
      : 900;

    const messages = Array.isArray(body.messages)
      ? body.messages
      : (typeof body.prompt === 'string' && body.prompt.trim()
          ? [{ role: 'user', content: body.prompt }]
          : []);

    if (!messages.length) {
      return res.status(400).json({
        error: 'يرجى إرسال messages أو prompt',
        errorCode: 'INVALID_MESSAGES'
      });
    }

    const response = await callGroq({
      messages,
      temperature,
      maxTokens,
      model,
      stream: false
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if ([401, 403, 429, 500, 502, 503].includes(statusCode)) {
      const message = Array.isArray(req?.body?.messages) && req.body.messages.length
        ? String(req.body.messages[req.body.messages.length - 1]?.content || '')
        : String(req?.body?.prompt || '');
      const fallbackText = message && message.trim()
        ? `تم استلام سؤالك: "${message.slice(0, 220)}". حالياً نعمل بوضع خدمة احتياطي، وسنقدّم ملخصاً تنفيذياً فور تحديث الاتصال.`
        : 'تم تفعيل وضع الخدمة الاحتياطي. شاركني السؤال وسأقدّم لك ملخصاً عملياً.';

      return res.status(200).json({
        choices: [
          {
            message: {
              role: 'assistant',
              content: fallbackText
            },
            finish_reason: 'stop'
          }
        ]
      });
    }

    return res.status(statusCode).json({
      error: 'حدث خطأ أثناء تنفيذ الطلب الذكي',
      errorCode: error.code || 'AI_COMPAT_ERROR'
    });
  }
}

module.exports = {
  groqStreamHandler,
  groqOcrHandler,
  groqExtractTextHandler,
  groqTranscribeHandler,
  groqMedicalAgentHandler,
  groqFaqHandler,
  groqMedicalArchiveHandler,
  groqHealthHandler,
  groqOpenAiCompatHandler
};
