const express = require('express');
const authRoutes = require('./auth');
const healthRoutes = require('./health');
const rejectsRoutes = require('./rejects');
const analysisRoutes = require('./analysis');
const auditRoutes = require('./audit');
const dataRoutes = require('./data');
const aiRoutes = require('./ai');
const reportsRoutes = require('./reports');
const notificationsRoutes = require('./notifications');

const router = express.Router();

router.use(authRoutes);
router.use(healthRoutes);
router.use(rejectsRoutes);
router.use(analysisRoutes);
router.use(auditRoutes);
router.use(dataRoutes);
router.use(aiRoutes);
router.use(reportsRoutes);
router.use(notificationsRoutes);

module.exports = router;
