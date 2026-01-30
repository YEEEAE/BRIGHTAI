/**
 * AI Page Summary Endpoint
 * Generates a summary of the provided text using Gemini API
 */

const { config, isApiKeyConfigured } = require('../config');

/**
 * Handle summary requests
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function summaryHandler(req, res) {
    try {
        // Check if API key is configured
        if (!isApiKeyConfigured()) {
            return res.status(503).json({ 
                error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
                errorCode: 'API_NOT_CONFIGURED'
            });
        }

        const { text, url } = req.body;

        if (!text && !url) {
            return res.status(400).json({ error: 'Text or URL is required' });
        }

        // Use fetch-based API call like chat.js
        const apiUrl = `${config.gemini.endpoint}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

        // Construct prompt
        const prompt = `
      Lese the following text and provide a concise, engaging summary in Arabic. 
      The summary should be suitable for a Saudi audience and highlight key value propositions.
      Use bullet points if appropriate.
      
      Text to summarize:
      ${text ? text.substring(0, 5000) : 'No text provided'}
    `;

        // Generate content using fetch
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid API response format');
        }

        const summary = data.candidates[0].content.parts[0].text;

        return res.status(200).json({
            summary,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('[AI Summary] Error:', error);
        return res.status(500).json({
            error: 'فشل في إنشاء الملخص',
            details: error.message
        });
    }
}

module.exports = { summaryHandler };
