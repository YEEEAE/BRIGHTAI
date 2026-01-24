/**
 * Medical AI Endpoint
 * Handles medical image analysis and health data processing
 * Requirements: 23.1, 23.4 (API key security)
 */

const { config } = require('../config');

/**
 * Call Gemini API for medical analysis
 * @param {object} params - Request parameters
 * @returns {Promise<string>} - AI response text
 */
async function callGeminiMedical({ textParts = [], inlineDataParts = [], config: reqConfig = {} }) {
  if (!config.gemini.apiKey) {
    throw new Error('AI service not configured');
  }

  const contents = [{
    role: "user",
    parts: [
      ...textParts.map(t => ({ text: t })),
      ...inlineDataParts.map(d => ({ inlineData: d }))
    ]
  }];

  const body = {
    contents,
    generationConfig: {
      temperature: reqConfig.temperature || 0.2,
      topP: reqConfig.top_p || 0.9,
      topK: reqConfig.top_k || 40,
      maxOutputTokens: reqConfig.max_output_tokens || 2048
    }
  };

  const response = await fetch(
    `${config.gemini.baseUrl}/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini API Error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
  return text.trim();
}

/**
 * Medical AI endpoint handler
 * POST /api/ai/medical
 */
async function medicalHandler(req, res) {
  // Validate API key is configured
  if (!config.gemini.apiKey) {
    return res.status(503).json({
      error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
      errorCode: 'SERVICE_UNAVAILABLE'
    });
  }

  const { textParts, inlineDataParts, config: reqConfig } = req.body || {};

  // Validate required fields
  if (!textParts || !Array.isArray(textParts) || textParts.length === 0) {
    return res.status(400).json({
      error: 'الرجاء تقديم نص للتحليل',
      errorCode: 'MISSING_TEXT'
    });
  }

  // Validate inline data if provided
  if (inlineDataParts && Array.isArray(inlineDataParts)) {
    for (const part of inlineDataParts) {
      if (!part.mimeType || !part.data) {
        return res.status(400).json({
          error: 'بيانات الصورة غير صالحة',
          errorCode: 'INVALID_IMAGE_DATA'
        });
      }
      // Validate mime type for medical images
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/dicom'];
      if (!allowedMimes.some(m => part.mimeType.startsWith(m.split('/')[0]))) {
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
    console.error('Medical AI error:', error.message);
    return res.status(500).json({
      error: 'حدث خطأ أثناء التحليل',
      errorCode: 'ANALYSIS_ERROR'
    });
  }
}

module.exports = { medicalHandler };
