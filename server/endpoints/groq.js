/**
 * Groq Integration Endpoints
 * - Streaming for /demo
 * - OCR JSON extraction for /demo/ocr-demo
 * - FAQ generation for report page
 */

const { config, isGroqConfigured, isApiKeyConfigured } = require('../config');
const { sanitizeUserInput } = require('../utils/sanitizer');
const { createSessionId, getOrCreateSession, addToSession } = require('../utils/sessionStore');

const MAX_OCR_TEXT_CHARS = 6000;
const MAX_MEDICAL_REPORT_CHARS = 12000;
const MAX_MEDICAL_RECORDS = 40;
const MAX_MEDICAL_QUERY_CHARS = 500;
const MAX_MEDICAL_AGENT_QUESTION_CHARS = 1200;
const MAX_EXTRACT_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TRANSCRIBE_FILE_BYTES = 25 * 1024 * 1024;

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
${MEDICAL_AGENT_SYSTEM_PROMPT}

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

async function callGroq({ messages, temperature = 0.4, maxTokens = 900, stream = false, signal }) {
  const response = await fetch(config.groq.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groq.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.groq.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    }),
    signal
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    const error = new Error(errText || 'Groq API Error');
    error.statusCode = response.status;
    throw error;
  }

  return response;
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

  if (!isGroqConfigured()) {
    return jsonRes.status(503).json({
      error: 'خدمة Groq غير متاحة حالياً',
      errorCode: 'GROQ_NOT_CONFIGURED'
    });
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

  const sanitizedMessage = sanitizeUserInput(message);
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
    controller.abort();
  });

  let assistantText = '';

  try {
    const groqResponse = await callGroq({
      messages,
      temperature: 0.6,
      maxTokens: 900,
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

    if (assistantText.trim().length > 0) {
      addToSession(activeSessionId, 'assistant', assistantText.trim());
    }
  } catch (error) {
    const message = error.statusCode === 503
      ? 'الخدمة غير متاحة حالياً'
      : 'حدث خطأ أثناء البث';
    streamRes.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  } finally {
    streamRes.end();
  }
}

async function groqOcrHandler(req, res) {
  if (!isGroqConfigured()) {
    return res.status(503).json({
      error: 'خدمة Groq غير متاحة حالياً',
      errorCode: 'GROQ_NOT_CONFIGURED'
    });
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
      extractedText = sanitizeUserInput(ocrText);
    } else {
      const cleanedBase64 = stripDataPrefix(fileBase64 || '');
      const base64Size = Buffer.byteLength(cleanedBase64, 'base64');
      if (base64Size > config.validation.ocrMaxBodyBytes) {
        return res.status(413).json({
          error: 'حجم الملف كبير جداً',
          errorCode: 'OCR_FILE_TOO_LARGE'
        });
      }
      extractedText = await extractTextWithGemini({
        base64Data: cleanedBase64,
        mimeType: mimeType || 'image/png'
      });
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
  if (!isGroqConfigured()) {
    return res.status(503).json({
      error: 'خدمة Groq غير متاحة حالياً',
      errorCode: 'GROQ_NOT_CONFIGURED'
    });
  }

  const { context } = req.body || {};

  if (!context || typeof context !== 'string') {
    return res.status(400).json({
      error: 'يرجى توفير سياق التقرير',
      errorCode: 'MISSING_CONTEXT'
    });
  }

  const sanitizedContext = sanitizeUserInput(context).slice(0, 4000);
  const userPrompt = `السياق:\n${sanitizedContext}\n\nأعد الأسئلة والأجوبة بصيغة JSON فقط.`;

  try {
    const messages = buildGroqMessages({
      systemPrompt: FAQ_SYSTEM_PROMPT,
      history: [],
      userMessage: userPrompt
    });

    const response = await callGroq({
      messages,
      temperature: 0.3,
      maxTokens: 700,
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

  try {
    const text = await extractTextWithGemini({
      base64Data: cleanedBase64,
      mimeType: asSafeString(mimeType || 'application/octet-stream', 80)
    });

    const normalized = sanitizeUserInput(text || '').slice(0, MAX_MEDICAL_REPORT_CHARS * 2);
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
  if (!isGroqConfigured()) {
    return res.status(503).json({
      error: 'خدمة Groq غير متاحة حالياً',
      errorCode: 'GROQ_NOT_CONFIGURED'
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

    const form = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: mimeType || 'audio/wav' });
    form.append('file', audioBlob, safeFileName(fileName || 'medical-audio.wav'));
    form.append('model', process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo');
    form.append('language', 'ar');
    form.append('response_format', 'verbose_json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`
      },
      body: form
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      const error = new Error(errText || 'GROQ_TRANSCRIBE_ERROR');
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    const text = asSafeString(data?.text || '', MAX_MEDICAL_REPORT_CHARS * 2);
    if (!text) {
      return res.status(422).json({
        error: 'لم يتم استخراج نص من الملف الصوتي',
        errorCode: 'EMPTY_TRANSCRIPTION'
      });
    }

    return res.status(200).json({
      text,
      duration: data?.duration ?? null,
      language: data?.language || 'ar',
      model: process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo',
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
  const safeQuestion = asSafeString(question || '', MAX_MEDICAL_AGENT_QUESTION_CHARS);

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
    let rawText = '';
    let modelName = '';

    if (isApiKeyConfigured()) {
      rawText = await callGeminiText({
        prompt,
        temperature: 0.2,
        maxOutputTokens: 1900
      });
      modelName = config.gemini.model;
    } else if (isGroqConfigured()) {
      const messages = buildGroqMessages({
        systemPrompt: MEDICAL_AGENT_SYSTEM_PROMPT,
        history: [],
        userMessage: prompt
      });
      const response = await callGroq({
        messages,
        temperature: 0.2,
        maxTokens: 1200,
        stream: false
      });
      const data = await response.json();
      rawText = data?.choices?.[0]?.message?.content?.trim() || '';
      modelName = config.groq.model;
    } else {
      return res.status(503).json({
        error: 'خدمة الوكيل غير متاحة حالياً',
        errorCode: 'AGENT_PROVIDER_NOT_CONFIGURED'
      });
    }

    const parsed = parseJsonFromText(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return res.status(500).json({
        error: 'تعذر تفسير مخرجات الوكيل الذكي',
        errorCode: 'INVALID_AGENT_OUTPUT'
      });
    }

    return res.status(200).json({
      result: parsed,
      model: modelName,
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
  if (!isGroqConfigured()) {
    return res.status(503).json({
      error: 'خدمة Groq غير متاحة حالياً',
      errorCode: 'GROQ_NOT_CONFIGURED'
    });
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

    const response = await callGroq({
      messages,
      temperature,
      maxTokens,
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
      model: config.groq.model,
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

module.exports = {
  groqStreamHandler,
  groqOcrHandler,
  groqExtractTextHandler,
  groqTranscribeHandler,
  groqMedicalAgentHandler,
  groqFaqHandler,
  groqMedicalArchiveHandler
};
