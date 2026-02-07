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

module.exports = {
  groqStreamHandler,
  groqOcrHandler,
  groqFaqHandler
};
