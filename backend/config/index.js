/**
 * Server Configuration
 * Loads environment variables and provides configuration object
 * Requirements: 23.4, 23.9
 */

require('dotenv').config();

const config = {
  // Gemini AI Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },

  // Groq AI Configuration
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama3-70b-8192',
    endpoint: process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions'
  },
  
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 10) || 30,
    windowMs: 60 * 1000 // 1 minute
  },
  
  // Input Validation
  validation: {
    maxInputLength: 1000,
    maxBodyBytes: parseInt(process.env.MAX_BODY_BYTES, 10) || 10240,
    ocrMaxBodyBytes: parseInt(process.env.OCR_MAX_BODY_BYTES, 10) || 6 * 1024 * 1024
  }
};

/**
 * Validate that required configuration is present
 * @returns {boolean} - True if configuration is valid
 */
function validateConfig() {
  const errors = [];
  
  if (!config.gemini.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (!config.groq.apiKey) {
    errors.push('GROQ_API_KEY is required');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    return false;
  }
  
  return true;
}

/**
 * Check if API key is configured
 * @returns {boolean}
 */
function isApiKeyConfigured() {
  return !!config.gemini.apiKey && config.gemini.apiKey !== 'YOUR_KEY_HERE';
}

/**
 * Check if Groq API key is configured
 * @returns {boolean}
 */
function isGroqConfigured() {
  return !!config.groq.apiKey && config.groq.apiKey !== 'YOUR_KEY_HERE';
}

module.exports = {
  config,
  validateConfig,
  isApiKeyConfigured,
  isGroqConfigured
};
