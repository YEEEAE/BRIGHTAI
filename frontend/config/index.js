/**
 * Server Configuration
 * Loads environment variables and provides configuration object
 * Requirements: 23.4, 23.9
 */

const fs = require('fs');
const path = require('path');

const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env')
];

const selectedEnvPath = envCandidates.find(candidate => fs.existsSync(candidate));
try {
  const dotenv = require('dotenv');
  if (selectedEnvPath) {
    dotenv.config({ path: selectedEnvPath });
  } else {
    dotenv.config();
  }
} catch (_dotenvMissing) {
  // dotenv not installed — rely on process.env set by the hosting platform (Render, Netlify, etc.)
}

function readSecret(name, fallback = '') {
  const rawValue = process.env[name] || fallback;
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!value || value === 'YOUR_SECRET_HERE') return '';
  return value;
}

const config = {
  // Gemini AI Configuration
  gemini: {
    apiKey: readSecret('GEMINI_API_KEY') || readSecret('GOOGLE_API_KEY'),
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },

  // Groq AI Configuration
  groq: {
    apiKey:
      readSecret('GROQ_API_KEY') ||
      readSecret('GROQ_KEY') ||
      readSecret('GROQ_TOKEN') ||
      '',
    model: process.env.GROQ_MODEL || process.env.GROQ_DEFAULT_MODEL || 'llama-3.3-70b-versatile',
    visionModel: process.env.GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview',
    endpoint: process.env.GROQ_ENDPOINT || '/api/ai/openai-chat',
    transcribeModel: process.env.GROQ_TRANSCRIBE_MODEL || 'whisper-large-v3-turbo',
    streamTimeoutMs: parseInt(process.env.GROQ_STREAM_TIMEOUT_MS, 10) || 30000
  },

  // NVIDIA NIM Configuration
  nvidia: {
    apiKey: readSecret('NVIDIA_API_KEY'),
    model: process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct',
    endpoint: process.env.NVIDIA_ENDPOINT || 'https://integrate.api.nvidia.com/v1/chat/completions'
  },

  // DeepSeek Configuration
  deepseek: {
    apiKey: readSecret('DEEPSEEK_API_KEY'),
    model: process.env.DEEPSEEKAI_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    endpoint: process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions'
  },

  // GA4 Measurement Protocol (optional)
  analytics: {
    ga4MeasurementId: process.env.GA4_MEASUREMENT_ID || '',
    ga4ApiSecret: readSecret('GA4_API_SECRET'),
    webhookKey: readSecret('ANALYTICS_WEBHOOK_KEY'),
    mpDebug: process.env.GA4_MP_DEBUG === '1'
  },
  
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 10) || 30,
    windowMs: 60 * 1000, // 1 minute
    storage: process.env.RATE_LIMIT_STORAGE || 'memory' // 'memory' or 'redis'
  },
  
  // Input Validation
  validation: {
    maxInputLength: 1000,
    maxBodyBytes: parseInt(process.env.MAX_BODY_BYTES, 10) || 10240,
    ocrMaxBodyBytes: parseInt(process.env.OCR_MAX_BODY_BYTES, 10) || 8 * 1024 * 1024,
    uploadMaxBodyBytes: parseInt(process.env.MAX_UPLOAD_BODY_BYTES, 10) || 40 * 1024 * 1024
  }
};

/**
 * Validate that required configuration is present
 * @returns {boolean} - True if configuration is valid
 */
function validateConfig() {
  const errors = [];
  const mockMode = process.env.AI_GATEWAY_MOCK_MODE === '1';

  if (mockMode && config.server.nodeEnv === 'production') {
    errors.push('AI_GATEWAY_MOCK_MODE must not be enabled in production');
  }

  if (!mockMode && !config.gemini.apiKey && !config.groq.apiKey && !config.nvidia.apiKey && !config.deepseek.apiKey) {
    errors.push('At least one provider key is required (GEMINI_API_KEY, GROQ_API_KEY, NVIDIA_API_KEY, or DEEPSEEK_API_KEY)');
  }

  if (config.server.nodeEnv === 'production' && !config.gemini.apiKey) {
    console.warn('Warning: GEMINI_API_KEY not set in production. Primary AI provider will be unavailable.');
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
  return !!config.gemini.apiKey;
}

/**
 * Check if Groq API key is configured
 * @returns {boolean}
 */
function isGroqConfigured() {
  return !!config.groq.apiKey;
}

function isNvidiaConfigured() {
  return !!config.nvidia.apiKey;
}

function isDeepSeekConfigured() {
  return !!config.deepseek.apiKey;
}

/**
 * Check if GA4 Measurement Protocol is configured
 * @returns {boolean}
 */
function isGa4MpConfigured() {
  return !!config.analytics.ga4MeasurementId && !!config.analytics.ga4ApiSecret;
}

module.exports = {
  config,
  validateConfig,
  isApiKeyConfigured,
  isGeminiConfigured: isApiKeyConfigured,
  isGroqConfigured,
  isNvidiaConfigured,
  isDeepSeekConfigured,
  isGa4MpConfigured
};
