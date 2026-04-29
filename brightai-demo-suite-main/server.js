require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '2mb' }));

// Simple request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Rate limiter for API ---
let apiLimiter;
try {
  const { rateLimit } = require('express-rate-limit');
  apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'طلبات كثيرة جداً. حاول مجدداً بعد دقيقة.' },
  });
} catch {
  apiLimiter = (_req, _res, next) => next();
}

// --- API routes ---
const DEMOS = [
  'ai-agent',
  'ai-tenders-analysis',
  'data-analysis',
  'smart-automation',
  'ai-workflows',
  'smart-education-platform',
  'smart-hospital-management',
];

const VALID_DEMOS = new Set(DEMOS);

// Schema endpoint
app.get('/api/demo/:demoId/schema', (req, res) => {
  const { demoId } = req.params;
  if (!VALID_DEMOS.has(demoId)) {
    return res.status(404).json({ error: `Demo not found: ${demoId}` });
  }
  try {
    const schema = require(`./server/schemas/${demoId}.js`);
    res.json(schema.default || schema);
  } catch {
    res.status(404).json({ error: `No schema for demo: ${demoId}` });
  }
});

// Main AI endpoint
app.post('/api/demo/:demoId', apiLimiter, async (req, res) => {
  const { demoId } = req.params;
  if (!VALID_DEMOS.has(demoId)) {
    return res.status(404).json({ error: `Demo not found: ${demoId}` });
  }

  const { userInput, language = 'ar', context = {} } = req.body || {};
  if (!userInput || typeof userInput !== 'string' || userInput.trim().length < 2) {
    return res.status(400).json({ error: 'userInput مطلوب ويجب أن يكون نصاً.' });
  }
  if (userInput.length > 2000) {
    return res.status(400).json({ error: 'userInput طويل جداً (الحد 2000 حرف).' });
  }

  try {
    const { callGemini } = require('./server/services/geminiService.js');
    const { getPrompt } = require('./server/prompts/promptRegistry.js');
    const prompt = getPrompt(demoId, userInput, language, context);
    const result = await callGemini(prompt);
    res.json({ success: true, demoId, response: result, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error(`[API Error] ${demoId}:`, err.message);
    res.status(500).json({ error: 'حدث خطأ في معالجة طلبك. حاول مجدداً.', detail: err.message });
  }
});

// --- Demo HTML routes ---
DEMOS.forEach((demo) => {
  app.get(`/demos/${demo}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'demos', demo, 'index.html'));
  });
});

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error handler ---
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'خطأ في الخادم. حاول مجدداً.' });
});

app.listen(PORT, () => {
  console.log(`BrightAI Demo Server running on http://localhost:${PORT}`);
});

module.exports = app;
