const express = require('express');
const config = require('../config/env');
const { success } = require('../utils/response');
const { getDataState } = require('../services/dataService');

const router = express.Router();

router.get('/health', (req, res) => {
  const state = getDataState();
  res.json(success({
    status: 'ok',
    source: state.cachedSource,
    gemini_configured: Boolean(config.geminiApiKey),
    gemini_model: config.geminiModel,
    auth_required: Boolean(config.dashboardToken || config.dashboardPasswordHash),
    excel_path: config.excelFilePath,
    excel_exists: state.excelExists,
    focus_api_configured: Boolean(config.focusApiUrl && config.focusApiToken),
    timestamp: new Date().toISOString()
  }, state.cachedSource, state.cachedWarnings));
});

module.exports = router;
