const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { audit } = require('../utils/logger');
const { success } = require('../utils/response');
const { getRejects, getDataState, getMetrics } = require('../services/dataService');
const { loadExcelData, getDataStatus, getRecentChanges } = require('../services/excelService');
const { invalidateAiCache } = require('../services/aiService');

const router = express.Router();

router.get('/data/refresh', requireAuth, async (req, res, next) => {
  try {
    const excel = await loadExcelData({ force: true });
    invalidateAiCache('manual data refresh');
    const rejects = await getRejects('excel');
    audit('DATA_REFRESH', req, `${rejects.length} records`);
    return res.json(success({
      refreshed: true,
      records_count: rejects.length,
      sheet_names: excel.sheet_names,
      metrics: excel.metrics,
      validation: excel.validation,
      loaded_at: excel.loaded_at
    }, 'excel', excel.validation.warnings));
  } catch (err) {
    return next(err);
  }
});

router.get('/data/status', requireAuth, (req, res) => {
  const state = getDataState();
  res.json(success({
    ...getDataStatus(),
    cached_source: state.cachedSource,
    warnings: state.cachedWarnings,
    metrics: getMetrics()
  }, state.cachedSource, state.cachedWarnings));
});

router.get('/data/changes', requireAuth, (req, res) => {
  const changes = getRecentChanges();
  res.json(success({
    count: changes.length,
    changes
  }, 'excel'));
});

module.exports = router;
