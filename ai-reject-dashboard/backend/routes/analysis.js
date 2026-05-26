const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../utils/logger');
const { success } = require('../utils/response');
const { getRejects, filterRejects, getDataState } = require('../services/dataService');
const { computeAnalysis } = require('../services/analysisService');
const { getGeminiAnalysis } = require('../services/geminiService');

const router = express.Router();

router.get('/summary', requireAuth, (req, res) => {
  const records = filterRejects(getRejects(), req.query);
  const state = getDataState();
  const analysis = computeAnalysis(records);
  audit('FETCH_SUMMARY', req, `${records.length} records analyzed`);
  res.json(success({ analysis }, state.cachedSource, state.cachedWarnings));
});

router.get('/root-causes', requireAuth, (req, res) => {
  const state = getDataState();
  res.json(success({ root_causes: computeAnalysis(getRejects()).repeated_root_causes }, state.cachedSource, state.cachedWarnings));
});

router.get('/capa-suggestions', requireAuth, (req, res) => {
  const state = getDataState();
  res.json(success({ capa_suggestions: computeAnalysis(getRejects()).capa_suggestions }, state.cachedSource, state.cachedWarnings));
});

router.get('/finance-alerts', requireAuth, (req, res) => {
  const state = getDataState();
  res.json(success({ finance_alerts: computeAnalysis(getRejects()).finance_alerts }, state.cachedSource, state.cachedWarnings));
});

router.get('/anomalies', requireAuth, (req, res) => {
  const state = getDataState();
  const anomalies = computeAnalysis(getRejects()).anomalies || [];
  audit('FETCH_ANOMALIES', req, `${anomalies.length} anomalies`);
  res.json(success({ anomalies }, state.cachedSource, state.cachedWarnings));
});

router.get('/ai-analysis', requireAuth, async (req, res) => {
  const records = getRejects();
  const state = getDataState();
  const gemini = await getGeminiAnalysis(records);
  const analysis = gemini.analysis || computeAnalysis(records);

  audit('FETCH_AI_ANALYSIS', req, gemini.analysis ? 'Gemini' : 'Local');
  res.json(success({
    records,
    analysis,
    gemini_used: Boolean(gemini.analysis),
    cached: gemini.cached,
    ai_note: 'AI recommendations are advisory only and do not replace formal approvals.'
  }, gemini.analysis ? 'gemini' : state.cachedSource, state.cachedWarnings));
});

router.post('/run-analysis', requireAuth, async (req, res) => {
  const records = getRejects();
  const state = getDataState();
  const gemini = await getGeminiAnalysis(records);
  const analysis = gemini.analysis || computeAnalysis(records);

  audit('RUN_ANALYSIS', req, gemini.analysis ? 'Gemini' : 'Local');
  res.json(success({
    gemini_used: Boolean(gemini.analysis),
    analysis
  }, gemini.analysis ? 'gemini' : state.cachedSource, state.cachedWarnings));
});

module.exports = router;
