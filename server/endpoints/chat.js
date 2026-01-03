/**
 * AI Chat Endpoint
 * POST /api/ai/chat - Handles chatbot conversations via Gemini API
 * Requirements: 23.1, 23.2, 23.4
 */

const { config, isApiKeyConfigured } = require('../config');
const { sanitizeUserInput, filterAIResponse } = require('../utils/sanitizer');
const { retryWithBackoff, createErrorResponse, getArabicErrorMessage } = require('../utils/errorHandler');

// Arabic error messages
const ERROR_MESSAGES = {
  NO_MESSAGE: 'يرجى إدخال رسالة',
  MESSAGE_TOO_LONG: 'الرسالة طويلة جداً. الحد الأقصى هو 1000 حرف',
  API_NOT_CONFIGURED: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
  API_ERROR: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى',
  INVALID_REQUEST: 'طلب غير صالح'
};

// System prompt for BrightAI chatbot
const SYSTEM_PROMPT = `أنت مساعد ذكي لشركة BrightAI، شركة سعودية متخصصة في حلول الذكاء الاصطناعي.
- أجب دائماً باللغة العربية
- كن مهذباً ومحترفاً
- قدم معلومات دقيقة عن خدمات الشركة
- ساعد العملاء في الاستفسارات حول الذكاء الاصطناعي والأتمتة
- إذا لم تكن متأكداً من إجابة، اقترح التواصل مع فريق الدعم`;

/**
 * Build Gemini API URL
 * @returns {string} - Full API URL
 */
function buildGeminiUrl() {
  const { endpoint, model, apiKey } = config.gemini;
  return `${endpoint}/${model}:generateContent?key=${apiKey}`;
}

/**
 * Call Gemini API with retry logic
 * @param {string} message - User message
 * @param {Array} history - Conversation history
 * @returns {Promise<string>} - AI response
 */
async function callGeminiAPI(message, history = []) {
  // Wrap the API call with retry logic
  return retryWithBackoff(
    async () => {
      const url = buildGeminiUrl();
      
      // Build conversation contents
      const contents = [];
      
      // Add system context as first user message
      contents.push({
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'مرحباً! أنا مساعد BrightAI. كيف يمكنني مساعدتك اليوم؟' }]
      });
      
      // Add conversation history
      for (const msg of history) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
      
      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API error:', response.status, errorData);
        
        // Create error with status code for retry logic
        const error = new Error(`API error: ${response.status}`);
        error.statusCode = response.status;
        throw error;
      }
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid API response format');
      }
      
      return data.candidates[0].content.parts[0].text;
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      onRetry: (attempt, delay, error) => {
        console.log(`Retrying Gemini API call (attempt ${attempt}) after ${delay}ms due to: ${error.message}`);
      }
    }
  );
}

/**
 * Chat endpoint handler
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
async function chatHandler(req, res) {
  try {
    // Validate API key is configured
    if (!isApiKeyConfigured()) {
      return res.status(503).json({
        error: ERROR_MESSAGES.API_NOT_CONFIGURED,
        errorCode: 'API_NOT_CONFIGURED'
      });
    }
    
    // Validate request body
    if (!req.body || typeof req.body.message !== 'string') {
      return res.status(400).json({
        error: ERROR_MESSAGES.INVALID_REQUEST,
        errorCode: 'INVALID_REQUEST'
      });
    }
    
    const { message, history = [], sessionId } = req.body;
    
    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: ERROR_MESSAGES.NO_MESSAGE,
        errorCode: 'NO_MESSAGE'
      });
    }
    
    // Check message length
    if (message.length > config.validation.maxInputLength) {
      return res.status(400).json({
        error: ERROR_MESSAGES.MESSAGE_TOO_LONG,
        errorCode: 'MESSAGE_TOO_LONG'
      });
    }
    
    // Sanitize input
    const sanitizedMessage = sanitizeUserInput(message);
    
    // Call Gemini API
    const aiResponse = await callGeminiAPI(sanitizedMessage, history);
    
    // Filter response for safety
    const filteredResponse = filterAIResponse(aiResponse);
    
    // Generate session ID if not provided
    const responseSessionId = sessionId || generateSessionId();
    
    return res.status(200).json({
      reply: filteredResponse,
      sessionId: responseSessionId
    });
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    // Determine appropriate status code
    const statusCode = error.statusCode || 500;
    
    // Get Arabic error message
    const arabicMessage = getArabicErrorMessage(error, statusCode);
    
    return res.status(statusCode).json({
      error: arabicMessage,
      errorCode: error.code || 'API_ERROR'
    });
  }
}

/**
 * Generate a unique session ID
 * @returns {string}
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  chatHandler,
  ERROR_MESSAGES,
  callGeminiAPI,
  buildGeminiUrl
};
