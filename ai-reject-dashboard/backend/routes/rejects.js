const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../utils/logger');
const { success } = require('../utils/response');
const { getRejects, filterRejects, getDataState } = require('../services/dataService');

const router = express.Router();

const filterSchema = Joi.object({
  source: Joi.string().valid('excel', 'demo').optional(),
  department: Joi.string().max(100).optional(),
  risk_level: Joi.string().max(100).optional(),
  status: Joi.string().max(100).optional(),
  from_date: Joi.date().iso().optional(),
  to_date: Joi.date().iso().optional(),
  search: Joi.string().max(100).optional()
});

router.get('/rejects', requireAuth, validate(filterSchema, 'query'), async (req, res, next) => {
  try {
    const records = await getRejects(req.query.source);
    const filtered = filterRejects(records, req.query);
    const state = getDataState();

    audit('FETCH_REJECTS', req, `${filtered.length} records`);
    return res.json(success({
      count: filtered.length,
      total_count: records.length,
      data_note: state.cachedSource === 'excel' ? 'Reject records generated from Excel item master data' : 'Prepared demo reject records',
      rejects: filtered,
      filters_applied: Boolean(req.query.department || req.query.risk_level || req.query.status || req.query.from_date || req.query.to_date || req.query.search),
      warnings: state.cachedWarnings
    }, state.cachedSource, state.cachedWarnings));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
