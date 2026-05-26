const config = require('../config/env');
const { logger } = require('../utils/logger');

let cachedAnalysis = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function callGemini(rejects) {
  if (!config.geminiApiKey) return null;

  const minimized = rejects.map((record) => ({
    doc: record.doc_no,
    dept: record.department,
    item: record.item_name,
    reason: record.reason,
    days: record.days_pending,
    cost: record.cost,
    status: record.approval_status,
    destruction: record.destruction_status,
    root_cause: record.root_cause,
    risk: record.risk_score
  }));

  const prompt = [
    'اسمك هو «صقر AI» — مساعد ذكي متخصص في تحليلات الجودة والعمليات. Always refer to yourself as "صقر AI" in all responses.',
    'You are an AI quality analytics assistant for a medical products factory in Saudi Arabia.',
    'Focus ERP is the official source of truth. AI output is advisory only.',
    'Return JSON with executive_summary, risk, finance, CAPA, backlog, anomaly, and management action insights.',
    JSON.stringify(minimized)
  ].join('\n');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch (err) {
    logger.warn('gemini_failed', { message: err.message });
    return null;
  }
}

async function getGeminiAnalysis(rejects) {
  const now = Date.now();
  if (cachedAnalysis && now - cachedAt < CACHE_TTL_MS) {
    return { analysis: cachedAnalysis, cached: true };
  }

  const analysis = await callGemini(rejects);
  if (!analysis) return { analysis: null, cached: false };

  cachedAnalysis = analysis;
  cachedAt = now;
  return { analysis, cached: false };
}

module.exports = { getGeminiAnalysis };
