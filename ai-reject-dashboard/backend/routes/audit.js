const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const { success } = require('../utils/response');

const router = express.Router();

router.get('/audit-log', requireAuth, (req, res) => {
  const logPath = path.join(config.projectRoot, 'logs', 'app.log');
  if (!fs.existsSync(logPath)) return res.json(success({ entries: [] }, 'audit'));

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).slice(-100).reverse();
  const entries = lines.map((line) => {
    try {
      const parsed = JSON.parse(line);
      return {
        timestamp: parsed.timestamp || '',
        ip: parsed.ip || '',
        action: parsed.action || parsed.message || '',
        details: parsed.details || ''
      };
    } catch (err) {
      return { timestamp: '', ip: '', action: line, details: '' };
    }
  });

  res.json(success({ entries }, 'audit'));
});

module.exports = router;
