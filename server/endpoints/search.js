/**
 * AI Search Endpoint
 * POST /api/ai/search - Handles smart search via Gemini API
 * Requirements: 23.1, 23.3, 23.4
 */

const { config, isApiKeyConfigured } = require('../config');
const { sanitizeUserInput, filterAIResponse } = require('../utils/sanitizer');

// Arabic error messages
const ERROR_MESSAGES = {
  NO_QUERY: 'يرجى إدخال كلمة البحث',
  QUERY_TOO_SHORT: 'يجب أن تكون كلمة البحث 3 أحرف على الأقل',
  QUERY_TOO_LONG: 'كلمة البحث طويلة جداً',
  API_NOT_CONFIGURED: 'خدمة البحث غير متاحة حالياً',
  API_ERROR: 'عذراً، حدث خطأ في البحث. يرجى المحاولة مرة أخرى',
  INVALID_REQUEST: 'طلب غير صالح'
};

// BrightAI services and pages for search context
const SITE_CONTENT = `
خدمات BrightAI:
1. وكلاء الذكاء الاصطناعي (AI Agents) - /ai-agent.html
2. تحليل البيانات الذكي - /data-analysis.html
3. الأتمتة الذكية - /smart-automation.html
4. روبوتات الدردشة الذكية - /ai-bots.html
5. أدوات الذكاء الاصطناعي - /tools.html
6. منتجاتنا - /our-products.html

صفحات أخرى:
- من نحن - /about-us.html
- المدونة - /blog.html
- تواصل معنا - /contact.html
- استشارة مجانية - /consultation.html
`;

// System prompt for search
const SEARCH_PROMPT = `أنت محرك بحث ذكي لموقع BrightAI.
بناءً على استعلام المستخدم، قدم نتائج بحث ذات صلة من محتوى الموقع.

محتوى الموقع:
${SITE_CONTENT}

قواعد الإجابة:
1. أرجع النتائج بتنسيق JSON فقط
2. كل نتيجة تحتوي على: title (عنوان بالعربية), url (رابط الصفحة), description (وصف قصير بالعربية)
3. أرجع 3-5 نتائج ذات صلة
4. إذا لم تجد نتائج مناسبة، أرجع مصفوفة فارغة
5. لا تضف أي نص خارج JSON

مثال للتنسيق:
[{"title": "وكلاء الذكاء الاصطناعي", "url": "/ai-agent.html", "description": "حلول وكلاء ذكية لأتمتة المهام"}]`;

/**
 * Build Gemini API URL
 * @returns {string}
 */
function buildGeminiUrl() {
  const { endpoint, model, apiKey } = config.gemini;
  return `${endpoint}/${model}:generateContent?key=${apiKey}`;
}

/**
 * Call Gemini API for search
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
async function callGeminiSearch(query) {
  const url = buildGeminiUrl();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: SEARCH_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'فهمت. سأقدم نتائج البحث بتنسيق JSON فقط.' }]
        },
        {
          role: 'user',
          parts: [{ text: `ابحث عن: ${query}` }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini Search API error:', response.status, errorData);
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid API response format');
  }
  
  return data.candidates[0].content.parts[0].text;
}

/**
 * Parse search results from AI response
 * @param {string} responseText - AI response text
 * @returns {Array} - Parsed search results
 */
function parseSearchResults(responseText) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }
    
    const results = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize results
    if (!Array.isArray(results)) {
      return [];
    }
    
    return results
      .filter(r => r && typeof r === 'object')
      .map(r => ({
        title: filterAIResponse(String(r.title || '')),
        url: String(r.url || '').replace(/[<>"']/g, ''),
        description: filterAIResponse(String(r.description || ''))
      }))
      .filter(r => r.title && r.url);
      
  } catch (error) {
    console.error('Error parsing search results:', error);
    return [];
  }
}

/**
 * Search endpoint handler
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
async function searchHandler(req, res) {
  try {
    // Validate API key is configured
    if (!isApiKeyConfigured()) {
      return res.status(503).json({
        error: ERROR_MESSAGES.API_NOT_CONFIGURED,
        errorCode: 'API_NOT_CONFIGURED',
        results: []
      });
    }
    
    // Validate request body
    if (!req.body || typeof req.body.query !== 'string') {
      return res.status(400).json({
        error: ERROR_MESSAGES.INVALID_REQUEST,
        errorCode: 'INVALID_REQUEST',
        results: []
      });
    }
    
    const { query } = req.body;
    
    // Validate query
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: ERROR_MESSAGES.NO_QUERY,
        errorCode: 'NO_QUERY',
        results: []
      });
    }
    
    // Check minimum query length
    if (query.trim().length < 3) {
      return res.status(400).json({
        error: ERROR_MESSAGES.QUERY_TOO_SHORT,
        errorCode: 'QUERY_TOO_SHORT',
        results: []
      });
    }
    
    // Check maximum query length
    if (query.length > config.validation.maxInputLength) {
      return res.status(400).json({
        error: ERROR_MESSAGES.QUERY_TOO_LONG,
        errorCode: 'QUERY_TOO_LONG',
        results: []
      });
    }
    
    // Sanitize input
    const sanitizedQuery = sanitizeUserInput(query);
    
    // Call Gemini API
    const aiResponse = await callGeminiSearch(sanitizedQuery);
    
    // Parse results
    const results = parseSearchResults(aiResponse);
    
    return res.status(200).json({
      results,
      query: sanitizedQuery
    });
    
  } catch (error) {
    console.error('Search endpoint error:', error);
    
    return res.status(500).json({
      error: ERROR_MESSAGES.API_ERROR,
      errorCode: 'API_ERROR',
      results: []
    });
  }
}

module.exports = {
  searchHandler,
  ERROR_MESSAGES,
  parseSearchResults,
  callGeminiSearch
};
