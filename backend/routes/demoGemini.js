const express = require('express');
const { demoGeminiController } = require('../controllers/demoGeminiController');
const { demoGeminiFileController } = require('../controllers/demoGeminiFileController');
const { validateDemoRequest } = require('../middleware/demoValidation');
const { parseDemoMultipartUpload } = require('../middleware/demoMultipartUpload');
const { createDemoRateLimiter } = require('../middleware/demoRateLimiter');

const router = express.Router();

router.post('/gemini', validateDemoRequest, createDemoRateLimiter({ ipLimit: 10, demoLimit: 10 }), demoGeminiController);
router.post('/gemini/file', parseDemoMultipartUpload, createDemoRateLimiter({ ipLimit: 10, demoLimit: 10 }), demoGeminiFileController);

module.exports = router;
