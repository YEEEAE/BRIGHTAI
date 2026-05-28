/**
 * Legacy Gemini routes.
 * Kept for compatibility; all provider calls are delegated to the unified gateway.
 */

const {
  unifiedChatHandler,
  unifiedChatStreamHandler
} = require('./aiGateway');
const {
  splitReplyAndSuggestions,
  resolveModel
} = require('../services/aiGateway');

const GEMINI_SYSTEM_PROMPT = 'BrightAI Assistant عبر بوابة الذكاء الاصطناعي الموحدة.';
const GEMINI_STREAM_SYSTEM_PROMPT = GEMINI_SYSTEM_PROMPT;

function buildGeminiUrl() {
  return `/api/ai/chat/completions?model=${encodeURIComponent(resolveModel())}`;
}

function buildGeminiStreamUrl() {
  return '/api/ai/chat/stream';
}

module.exports = {
  geminiChatHandler: unifiedChatHandler,
  geminiChatStreamHandler: unifiedChatStreamHandler,
  GEMINI_SYSTEM_PROMPT,
  GEMINI_STREAM_SYSTEM_PROMPT,
  buildGeminiUrl,
  buildGeminiStreamUrl,
  splitReplyAndSuggestions
};
