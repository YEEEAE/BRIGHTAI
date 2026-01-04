/**
 * AI Page Summary Endpoint
 * Generates a summary of the provided text using Gemini API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { config } = require('../config');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);

/**
 * Handle summary requests
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
async function summaryHandler(req, res) {
    try {
        const { text, url } = req.body;

        if (!text && !url) {
            return res.status(400).json({ error: 'Text or URL is required' });
        }

        // Initialize model
        const model = genAI.getGenerativeModel({ model: config.ai.model || 'gemini-pro' });

        // Construct prompt
        const prompt = `
      Lese the following text and provide a concise, engaging summary in Arabic. 
      The summary should be suitable for a Saudi audience and highlight key value propositions.
      Use bullet points if appropriate.
      
      Text to summarize:
      ${text ? text.substring(0, 5000) : 'No text provided'}
    `;

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        return res.status(200).json({
            summary,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('[AI Summary] Error:', error);
        return res.status(500).json({
            error: 'Failed to generate summary',
            details: error.message
        });
    }
}

module.exports = { summaryHandler };
