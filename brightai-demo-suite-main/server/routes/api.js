import { Router } from 'express';
import { demoRateLimiter } from '../middleware/rateLimiter.js';
import { validateDemoRequest } from '../middleware/validateRequest.js';
import { handleDemoRequest } from '../controllers/demoController.js';

export const apiRouter = Router();

/**
 * POST /api/demo/:demoId
 * Accepts a structured request from any demo page and calls Gemini.
 * Body: { userInput: string, context?: object, language?: 'ar' | 'en' }
 */
apiRouter.post(
  '/demo/:demoId',
  demoRateLimiter,
  validateDemoRequest,
  handleDemoRequest,
);

/**
 * GET /api/demo/:demoId/schema
 * Returns the JSON schema / FAQ for a demo (used to pre-populate the UI).
 */
apiRouter.get('/demo/:demoId/schema', (req, res) => {
  const { demoId } = req.params;
  try {
    // Dynamic import to load the schema for the requested demo
    import(`../schemas/${demoId}.js`)
      .then((mod) => res.json(mod.default || mod.schema || {}))
      .catch(() => res.status(404).json({ error: `No schema found for demo: ${demoId}` }));
  } catch {
    res.status(404).json({ error: `No schema found for demo: ${demoId}` });
  }
});
