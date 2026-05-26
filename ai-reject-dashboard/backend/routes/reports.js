/**
 * Documentation:
 * - docs/04-api/reports-api.md
 * - docs/01-pages/reports-page.md
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { audit } = require('../utils/logger');
const { generateReport, getHistory, getTemplates, saveSchedule } = require('../services/reportService');

const router = express.Router();

const generateSchema = Joi.object({
  template: Joi.string().trim().required(),
  format: Joi.string().trim().valid('pdf', 'excel', 'pptx').required(),
  sections: Joi.array().items(Joi.string()).required(),
  filters: Joi.object({
    dateRange: Joi.string().trim().required(),
    fromDate: Joi.string().trim().allow('').optional(),
    toDate: Joi.string().trim().allow('').optional(),
    department: Joi.string().trim().required()
  }).required(),
  security: Joi.object({
    watermark: Joi.string().trim().valid('NONE', 'CONFIDENTIAL', 'DRAFT', 'INTERNAL').required(),
    expiryDate: Joi.string().trim().allow('').optional()
  }).required(),
  user: Joi.string().trim().required()
});

const scheduleSchema = Joi.object({
  frequency: Joi.string().trim().valid('daily', 'weekly', 'monthly').required(),
  email: Joi.string().trim().email().required(),
  template: Joi.string().trim().required()
});

// GET /api/reports/templates
router.get('/reports/templates', requireAuth, (req, res) => {
  const templates = getTemplates();
  return res.json(success(templates, 'reports-templates'));
});

// GET /api/reports/history
router.get('/reports/history', requireAuth, (req, res) => {
  const history = getHistory();
  return res.json(success(history, 'reports-history'));
});

// POST /api/reports/generate
router.post('/reports/generate', requireAuth, validate(generateSchema), async (req, res, next) => {
  try {
    const reportData = await generateReport(req.body);
    audit('REPORT_GENERATE', req, `Format: ${req.body.format}, Template: ${req.body.template}`);
    return res.json(success(reportData, 'reports'));
  } catch (err) {
    return next(err);
  }
});

// POST /api/reports/schedule
router.post('/reports/schedule', requireAuth, validate(scheduleSchema), (req, res) => {
  const scheduled = saveSchedule(req.body);
  audit('REPORT_SCHEDULE', req, `Frequency: ${req.body.frequency}, Template: ${req.body.template}`);
  return res.json(success(scheduled, 'reports-scheduler'));
});

// GET /api/reports/download/:id
router.get('/reports/download/:id', async (req, res, next) => {
  try {
    const history = getHistory();
    const item = history.find(h => h.id === req.params.id);
    if (!item || !fs.existsSync(item.filePath)) {
      return res.status(404).json(fail('Document not found or expired', 404));
    }
    
    // Check for document expiry
    if (item.expiryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (today > item.expiryDate) {
        return res.status(410).json(fail('Access expired: Highly sensitive medical record locked.', 410));
      }
    }

    res.setHeader('Content-Disposition', `attachment; filename="${item.fileName}"`);
    res.setHeader('Content-Type', item.mimeType);
    
    const fileStream = fs.createReadStream(item.filePath);
    fileStream.pipe(res);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
