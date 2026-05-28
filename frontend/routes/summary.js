/**
 * AI Page Summary Endpoint
 * Generates a summary of the provided text using Gemini API
 */

const { CacheManager } = require('../utils/cache');
const { runGeminiCompletion } = require('../services/aiGateway');

// Initialize cache manager
// Cache enabled by default with 10 minutes TTL for summaries
const cache = new CacheManager({ 
  ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 600,
  storage: process.env.CACHE_STORAGE || 'memory'
});

/**
 * Handle summary requests
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function summaryHandler(req, res) {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ 
                error: 'يجب تقديم نص للتلخيص',
                errorCode: 'MISSING_TEXT'
            });
        }

        // Check if caching is enabled
        const cacheEnabled = process.env.CACHE_ENABLED !== 'false';
        
        if (cacheEnabled) {
            // Generate cache key
            const cacheKey = cache.generateKey('summary', req.body);
            
            // Check cache
            const cached = await cache.get(cacheKey);
            if (cached) {
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(cached);
            }
        }

        const prompt = `
اقرأ النص التالي وقدم ملخصاً موجزاً وجذاباً باللغة العربية.
يجب أن يكون الملخص مناسباً للجمهور السعودي ويبرز القيم الأساسية بما يتماشى مع رؤية المملكة 2030.
استخدم النقاط إذا كان ذلك مناسباً.

النص المراد تلخيصه:
${text ? text.substring(0, 5000) : 'لم يتم تقديم نص'}
    `;

        const aiResult = await runGeminiCompletion({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            maxOutputTokens: 1024,
            demoType: 'summary',
            agentType: 'summary',
            sourcePage: '/api/ai/summary'
        });

        if (!aiResult.ok) {
            return res.status(aiResult.statusCode || 503).json({
                error: aiResult.error?.message_ar || 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
                errorCode: aiResult.error?.code || 'AI_PROVIDER_UNAVAILABLE',
                requestId: aiResult.requestId
            });
        }

        const summary = aiResult.text || aiResult.data?.text || '';

        const result = {
            summary,
            timestamp: Date.now()
        };

        // Store in cache if enabled
        if (cacheEnabled) {
            const cacheKey = cache.generateKey('summary', req.body);
            await cache.set(cacheKey, result);
            res.setHeader('X-Cache', 'MISS');
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error('[AI Summary] Error:', error);
        return res.status(500).json({
            error: 'حدث خطأ أثناء إنشاء الملخص',
            errorCode: 'SUMMARY_ERROR',
            timestamp: Date.now()
        });
    }
}

module.exports = { summaryHandler };
