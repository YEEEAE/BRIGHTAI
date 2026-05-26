/**
 * BrightAI Unified AI Gateway Routes
 * مسارات موحدة لكل استدعاءات الذكاء الاصطناعي
 * - POST /api/ai/chat (non-streaming, primary)
 * - POST /api/ai/chat/stream (streaming SSE)
 * - POST /api/ai/openai-chat (OpenAI-compatible format)
 * - POST /api/ai/chat/completions (OpenAI-compatible alias)
 * - Aliases for legacy routes
 */

const aiGateway = require('../services/aiGateway');
const { normalizeStatusCode } = require('../services/aiGateway');
const { clearSession } = require('../services/sessionStore');
const { getArabicErrorMessage } = require('../utils/errorHandler');
const { searchSiteWithRag } = require('../services/ragSearch');

async function buildLocalSupportReply(message) {
  try {
    const rag = await searchSiteWithRag(message, {
      maxSources: 4,
      retrievalLimit: 8,
      disableGeneration: true
    });

    if (rag && typeof rag.answer === 'string' && rag.answer.trim()) {
      const topSources = Array.isArray(rag.sources) ? rag.sources.slice(0, 2) : [];
      if (topSources.length > 0) {
        const links = topSources
          .map(source => `${source.title || 'مرجع'}: ${source.url || ''}`)
          .join('\n');
        return `${rag.answer}\n\nمراجع مقترحة:\n${links}`;
      }
      return rag.answer;
    }
  } catch (_error) {
    // Fall back to static support message below.
  }

  const q = String(message || '').toLowerCase();

  if (q.includes('خدمات') || q.includes('service')) {
    return 'نقدم في Bright AI حلول مؤسسية تشمل: AIaaS، أتمتة العمليات، التحليلات المتقدمة، وحلول القطاع الصحي. نقدر نحدد لكم المسار الأنسب حسب قطاعكم خلال جلسة استشارية تنفيذية.';
  }

  if (q.includes('استشارة') || q.includes('حجز') || q.includes('تواصل')) {
    return 'لحجز استشارة تنفيذية مباشرة مع فريقنا: https://api.whatsapp.com/send?phone=966538229013';
  }

  if (q.includes('سعر') || q.includes('تكلفة') || q.includes('باقة')) {
    return 'التكلفة تعتمد على نطاق المشروع وتكامل الأنظمة ومتطلبات الامتثال. الأفضل عمل جلسة تقييم قصيرة ثم نرفع لكم تصور تنفيذي وتسعير مناسب.';
  }

  return 'أهلًا بك. نقدر نخدمكم في التحول الرقمي المؤسسي عبر حلول ذكاء اصطناعي عملية ومتوافقة مع متطلبات السوق السعودي. شاركني هدفكم التشغيلي الحالي وسأقترح لكم أفضل خطوة تالية.';
}

async function unifiedChatHandler(req, res) {
  try {
    const result = await aiGateway.chat(req);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = normalizeStatusCode(error);

    if ([401, 403, 429, 500, 502, 503].includes(statusCode) || (statusCode === 400 && /^GEMINI_API_/.test(String(error?.code || '')))) {
      const fallbackReply = await buildLocalSupportReply(req?.body?.message || '');
      return res.status(200).json({
        reply: fallbackReply,
        sessionId: req?.body?.sessionId || `session_${Date.now()}`,
        fallback: true
      });
    }

    return res.status(statusCode).json({
      error: error?.userMessage || getArabicErrorMessage(error, statusCode),
      errorCode: error?.code || 'CHAT_ERROR'
    });
  }
}

async function unifiedChatStreamHandler(req, res, rawRes) {
  const result = await aiGateway.chatStream(req, rawRes || res);

  if (result.error && !result.clientAborted) {
    const statusCode = result.statusCode || 500;
    if (!res.headersSent) {
      return res.status(statusCode).json(result.errorData);
    }
  }
}

async function unifiedOpenAiCompatHandler(req, res) {
  try {
    const result = await aiGateway.openAiCompatChat(req);
    if (result && result.ok === false) {
      return res.status(result.statusCode || 503).json({
        ok: false,
        provider: result.provider || 'gemini',
        model: result.model,
        requestId: result.requestId,
        error: result.error || {
          code: 'AI_PROVIDER_UNAVAILABLE',
          message_ar: 'تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة.'
        }
      });
    }
    return res.status(200).json(result);
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
        choices: [{ message: { role: 'assistant', content: fallbackText }, finish_reason: 'stop' }]
      });
    }

    return res.status(statusCode).json({
      error: 'حدث خطأ أثناء تنفيذ الطلب الذكي',
      errorCode: error.code || 'AI_COMPAT_ERROR'
    });
  }
}

async function unifiedChatCloseHandler(req, res) {
  const conversationId = req?.body?.conversation_id || req?.body?.conversationId || req?.body?.sessionId;
  clearSession(conversationId);
  return res.status(200).json({ ok: true });
}

module.exports = {
  unifiedChatHandler,
  unifiedChatStreamHandler,
  unifiedOpenAiCompatHandler,
  unifiedChatCloseHandler,
  buildLocalSupportReply
};
