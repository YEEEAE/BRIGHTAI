const express = require('express');
const { demoStreamController } = require('../controllers/demoStreamController');
const { validateDemoRequest } = require('../middleware/demoValidation');
const { createDemoRateLimiter } = require('../middleware/demoRateLimiter');

const router = express.Router();

router.post('/gemini/stream', validateDemoRequest, createDemoRateLimiter(), demoStreamController);

module.exports = router;
