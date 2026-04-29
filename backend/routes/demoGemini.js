const express = require('express');
const { demoGeminiController } = require('../controllers/demoGeminiController');
const { validateDemoRequest } = require('../middleware/demoValidation');
const { createDemoRateLimiter } = require('../middleware/demoRateLimiter');

const router = express.Router();

router.post('/gemini', validateDemoRequest, createDemoRateLimiter(), demoGeminiController);

module.exports = router;
