const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../utils/logger');
const { success } = require('../utils/response');
const { getRejects, filterRejects, getDataState } = require('../services/dataService');
const { computeAnalysis } = require('../services/analysisService');
const { getGeminiAnalysis } = require('../services/geminiService');

const router = express.Router();

router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const records = filterRejects(await getRejects(), req.query);
    const state = getDataState();
    const analysis = computeAnalysis(records);
    audit('FETCH_SUMMARY', req, `${records.length} records analyzed`);
    return res.json(success({ analysis }, state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

router.get('/root-causes', requireAuth, async (req, res, next) => {
  try {
    const state = getDataState();
    return res.json(success({ root_causes: computeAnalysis(await getRejects()).repeated_root_causes }, state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

router.get('/capa-suggestions', requireAuth, async (req, res, next) => {
  try {
    const state = getDataState();
    return res.json(success({ capa_suggestions: computeAnalysis(await getRejects()).capa_suggestions }, state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

router.get('/finance-alerts', requireAuth, async (req, res, next) => {
  try {
    const state = getDataState();
    return res.json(success({ finance_alerts: computeAnalysis(await getRejects()).finance_alerts }, state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

router.get('/anomalies', requireAuth, async (req, res, next) => {
  try {
    const state = getDataState();
    const anomalies = computeAnalysis(await getRejects()).anomalies || [];
    audit('FETCH_ANOMALIES', req, `${anomalies.length} anomalies`);
    return res.json(success({ anomalies }, state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

router.get('/ai-analysis', requireAuth, async (req, res, next) => {
  try {
    const records = await getRejects();
    const state = getDataState();
    const gemini = await getGeminiAnalysis(records);
    const analysis = gemini.analysis || computeAnalysis(records);

    audit('FETCH_AI_ANALYSIS', req, gemini.analysis ? 'Gemini' : 'Local');
    return res.json(success({
      records,
      analysis,
      gemini_used: Boolean(gemini.analysis),
      cached: gemini.cached,
      ai_note: 'AI recommendations are advisory only and do not replace formal approvals.'
    }, gemini.analysis ? 'gemini' : state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

router.post('/run-analysis', requireAuth, async (req, res, next) => {
  try {
    const records = await getRejects();
    const state = getDataState();
    const gemini = await getGeminiAnalysis(records);
    const analysis = gemini.analysis || computeAnalysis(records);

    audit('RUN_ANALYSIS', req, gemini.analysis ? 'Gemini' : 'Local');
    return res.json(success({
      gemini_used: Boolean(gemini.analysis),
      analysis
    }, gemini.analysis ? 'gemini' : state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
