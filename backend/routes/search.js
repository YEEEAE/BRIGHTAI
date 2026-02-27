/**
 * AI Search Endpoint (RAG)
 * POST /api/ai/search - Retrieval-Augmented Generation using Gemini + local vector index
 */

const { config } = require('../config');
const { sanitizeUserInput } = require('../utils/sanitizer');
const { getArabicErrorMessage } = require('../utils/errorHandler');
const { searchSiteWithRag } = require('../services/ragSearch');

const ERROR_MESSAGES = {
  NO_QUERY: 'يرجى إدخال سؤال البحث',
  QUERY_TOO_SHORT: 'السؤال قصير جداً. اكتب 3 أحرف على الأقل',
  QUERY_TOO_LONG: 'السؤال طويل جداً',
  INVALID_REQUEST: 'طلب غير صالح',
  API_ERROR: 'عذراً، حدث خطأ في البحث. حاول مرة ثانية'
};

function resolveGeminiModel(req) {
  const body = req && req.body && typeof req.body === 'object' ? req.body : {};
  const candidate = String(body.geminiModel || body.model || '').trim();
  if (!candidate) return config.gemini.model;
  return candidate.slice(0, 120);
}

async function searchHandler(req, res) {
  try {
    if (!req.body || typeof req.body.query !== 'string') {
      return res.status(400).json({
        error: ERROR_MESSAGES.INVALID_REQUEST,
        errorCode: 'INVALID_REQUEST',
        results: [],
        sources: []
      });
    }

    const rawQuery = req.body.query;
    if (!rawQuery || rawQuery.trim().length === 0) {
      return res.status(400).json({
        error: ERROR_MESSAGES.NO_QUERY,
        errorCode: 'NO_QUERY',
        results: [],
        sources: []
      });
    }

    if (rawQuery.trim().length < 3) {
      return res.status(400).json({
        error: ERROR_MESSAGES.QUERY_TOO_SHORT,
        errorCode: 'QUERY_TOO_SHORT',
        results: [],
        sources: []
      });
    }

    if (rawQuery.length > config.validation.maxInputLength) {
      return res.status(400).json({
        error: ERROR_MESSAGES.QUERY_TOO_LONG,
        errorCode: 'QUERY_TOO_LONG',
        results: [],
        sources: []
      });
    }

    const query = sanitizeUserInput(rawQuery);
    const geminiModel = resolveGeminiModel(req);
    const ragResult = await searchSiteWithRag(query, {
      maxSources: 5,
      retrievalLimit: 10,
      model: geminiModel
    });

    return res.status(200).json({
      query,
      answer: ragResult.answer || '',
      sources: Array.isArray(ragResult.sources) ? ragResult.sources : [],
      results: Array.isArray(ragResult.results) ? ragResult.results : [],
      mode: ragResult.mode || 'unknown',
      retrievalCount: Number.isFinite(ragResult.retrievalCount) ? ragResult.retrievalCount : 0,
      warning: ragResult.warning || null
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const arabicMessage = getArabicErrorMessage(error, statusCode);

    return res.status(statusCode).json({
      error: arabicMessage || ERROR_MESSAGES.API_ERROR,
      errorCode: error.code || 'API_ERROR',
      results: [],
      sources: []
    });
  }
}

module.exports = {
  searchHandler,
  ERROR_MESSAGES
};
