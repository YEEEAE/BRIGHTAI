const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { success } = require('../utils/response');
const { audit } = require('../utils/logger');
const { getRejects } = require('../services/dataService');
const {
  runEnterpriseAnalysis,
  answerNaturalLanguageQuery,
  generateCapa,
  detectAnomalies,
  auditTrail
} = require('../services/aiService');

const router = express.Router();

const querySchema = Joi.object({
  question: Joi.string().trim().min(3).max(1000).required()
});

const capaSchema = Joi.object({
  reject_case: Joi.object().unknown(true).required()
});

router.get('/ai/enterprise-analysis', requireAuth, async (req, res, next) => {
  try {
    const records = await getRejects();
    const analysis = await runEnterpriseAnalysis(records);
    audit('AI_ENTERPRISE_ANALYSIS', req, `${records.length} records`);
    return res.json(success(analysis, 'ai'));
  } catch (err) {
    return next(err);
  }
});

router.post('/ai/query', requireAuth, validate(querySchema), async (req, res, next) => {
  try {
    const records = await getRejects();
    const answer = await answerNaturalLanguageQuery(records, req.body.question);
    audit('AI_QUERY', req, req.body.question);
    return res.json(success(answer, 'ai'));
  } catch (err) {
    return next(err);
  }
});

router.post('/ai/generate-capa', requireAuth, validate(capaSchema), async (req, res, next) => {
  try {
    const records = await getRejects();
    const capa = await generateCapa(records, req.body.reject_case);
    audit('AI_GENERATE_CAPA', req, req.body.reject_case.doc_no || req.body.reject_case.item_code || 'unknown');
    return res.json(success(capa, 'ai'));
  } catch (err) {
    return next(err);
  }
});

router.get('/ai/anomalies', requireAuth, async (req, res, next) => {
  try {
    const records = await getRejects();
    return res.json(success({ anomalies: detectAnomalies(records) }, 'local-ml'));
  } catch (err) {
    return next(err);
  }
});

router.get('/ai/audit-trail', requireAuth, (req, res) => {
  res.json(success({ count: auditTrail.length, entries: auditTrail }, 'ai-audit'));
});

module.exports = router;
