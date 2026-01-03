/**
 * Server Configuration
 * Loads environment variables and provides configuration for the AI Gateway
 */

require('dotenv').config();

const config = {
  // Server settings
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Gemini AI settings - read from environment only
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  
  // Rate limiting settings
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 10) || 30,
    windowMs: 60 * 1000 // 1 minute
  },
  
  // Input validation settings
  validation: {
    maxInputLength: 1000,
    maxSearchQueryLength: 200
  }
};

// Validate required configuration
function validateConfig() {
  if (!config.gemini.apiKey || config.gemini.apiKey === 'YOUR_KEY_HERE') {
    console.warn('⚠️  GEMINI_API_KEY not configured. AI features will not work.');
    return false;
  }
  return true;
}

module.exports = { config, validateConfig };
