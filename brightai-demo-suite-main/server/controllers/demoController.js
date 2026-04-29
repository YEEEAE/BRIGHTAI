import { GeminiService } from '../services/geminiService.js';
import { getPrompt } from '../prompts/promptRegistry.js';
import { sanitizeInput } from '../utils/sanitize.js';
import { buildContext } from '../utils/contextBuilder.js';

const gemini = new GeminiService();

/**
 * Handles POST /api/demo/:demoId
 * Orchestrates: input sanitization → prompt construction → Gemini call → response
 */
export async function handleDemoRequest(req, res, next) {
  try {
    const { demoId } = req.params;
    const { userInput, context = {}, language = 'ar' } = req.body;

    // 1. Sanitize
    const cleanInput = sanitizeInput(userInput);

    // 2. Load the prompt template for this demo
    const promptTemplate = getPrompt(demoId);
    if (!promptTemplate) {
      return res.status(404).json({
        success: false,
        error: `Demo "${demoId}" not found.`,
      });
    }

    // 3. Build the final prompt
    const finalPrompt = promptTemplate({
      userInput: cleanInput,
      context: buildContext(context),
      language,
    });

    // 4. Call Gemini
    const result = await gemini.generate(finalPrompt);

    // 5. Return structured response
    return res.json({
      success: true,
      demoId,
      response: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
