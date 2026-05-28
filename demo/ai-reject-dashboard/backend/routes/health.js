const express = require('express');
const config = require('../config/env');
const { success } = require('../utils/response');
const { getRejects, getDataState } = require('../services/dataService');

const router = express.Router();

router.get('/health', async (req, res) => {
  const state = getDataState();
  const rejects = await getRejects();
  res.json(success({
    status: 'ok',
    source: state.cachedSource,
    gemini_model: config.geminiModel,
    gemini_configured: Boolean(config.geminiApiKey),
    excel_exists: state.excelExists,
    excel_path: config.excelFilePath,
    record_count: rejects.length,
    auth_required: Boolean(config.dashboardToken || config.dashboardPasswordHash),
    timestamp: new Date().toISOString()
  }, state.cachedSource, state.cachedWarnings));
});

module.exports = router;
