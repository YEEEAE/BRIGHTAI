import { VALID_DEMO_IDS } from '../prompts/promptRegistry.js';

/**
 * Validates incoming demo API requests.
 * Checks: demoId is valid, userInput exists and is within length limits.
 */
export function validateDemoRequest(req, res, next) {
  const { demoId } = req.params;
  const { userInput, language } = req.body;

  // Validate demoId
  if (!VALID_DEMO_IDS.includes(demoId)) {
    return res.status(400).json({
      success: false,
      error: `معرّف العرض التوضيحي غير صالح: "${demoId}". القيم المقبولة: ${VALID_DEMO_IDS.join(', ')}`,
    });
  }

  // Validate userInput
  if (!userInput || typeof userInput !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'حقل userInput مطلوب ويجب أن يكون نصاً.',
    });
  }

  const trimmed = userInput.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'لا يمكن أن يكون حقل userInput فارغاً.',
    });
  }

  if (trimmed.length > 4000) {
    return res.status(400).json({
      success: false,
      error: 'يجب أن يكون حقل userInput أقل من 4000 حرف.',
    });
  }

  // Validate language (optional, defaults handled in controller)
  if (language && !['ar', 'en'].includes(language)) {
    return res.status(400).json({
      success: false,
      error: 'قيمة language غير صالحة. القيم المقبولة: "ar" أو "en".',
    });
  }

  // Attach cleaned input to body
  req.body.userInput = trimmed;
  next();
}
