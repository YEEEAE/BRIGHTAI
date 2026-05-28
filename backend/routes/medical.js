/**
 * Medical AI endpoint.
 * Provider access is centralized in services/aiGateway.js.
 */

const { runGeminiCompletion } = require('../services/aiGateway');

async function callGeminiMedical({ textParts = [], inlineDataParts = [], config: reqConfig = {} }) {
  const content = [
    ...textParts.map(text => ({ type: 'text', text })),
    ...inlineDataParts.map(item => ({ inlineData: item }))
  ];

  const result = await runGeminiCompletion({
    messages: [{ role: 'user', content }],
    temperature: reqConfig.temperature || 0.2,
    maxOutputTokens: reqConfig.max_output_tokens || 2048,
    demoType: 'medical',
    agentType: 'medical',
    safetyProfile: 'healthcare',
    sourcePage: '/api/ai/medical'
  });

  if (!result.ok) {
    const error = new Error(result.error?.message_ar || 'AI service unavailable');
    error.statusCode = result.statusCode || 503;
    error.code = result.error?.code || 'AI_PROVIDER_UNAVAILABLE';
    throw error;
  }

  return String(result.text || result.data?.text || '').trim();
}

async function medicalHandler(req, res) {
  const { textParts, inlineDataParts, config: reqConfig } = req.body || {};

  if (!textParts || !Array.isArray(textParts) || textParts.length === 0) {
    return res.status(400).json({
      error: 'الرجاء تقديم نص للتحليل',
      errorCode: 'MISSING_TEXT'
    });
  }

  if (inlineDataParts && Array.isArray(inlineDataParts)) {
    for (const part of inlineDataParts) {
      if (!part.mimeType || !part.data) {
        return res.status(400).json({
          error: 'بيانات الصورة غير صالحة',
          errorCode: 'INVALID_IMAGE_DATA'
        });
      }
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/dicom'];
      if (!allowedMimes.some(mime => part.mimeType.startsWith(mime.split('/')[0]))) {
        return res.status(400).json({
          error: 'نوع الملف غير مدعوم',
          errorCode: 'UNSUPPORTED_FILE_TYPE'
        });
      }
    }
  }

  try {
    const text = await callGeminiMedical({
      textParts,
      inlineDataParts: inlineDataParts || [],
      config: reqConfig || {}
    });

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Medical AI error:', error.code || error.message);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode === 503
        ? 'تعذر تشغيل التحليل الطبي الآن. يمكنك إعادة المحاولة لاحقاً.'
        : 'حدث خطأ أثناء التحليل',
      errorCode: error.code || 'ANALYSIS_ERROR'
    });
  }
}

module.exports = { medicalHandler, callGeminiMedical };
