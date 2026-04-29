/**
 * Central Express error handler.
 * Must be registered last with app.use(errorHandler).
 */
export function errorHandler(err, req, res, _next) {
  console.error(`[ErrorHandler] ${err.message}`, err.stack);

  // Gemini API errors
  if (err.message?.includes('API_KEY') || err.message?.includes('PERMISSION_DENIED')) {
    return res.status(503).json({
      success: false,
      error: 'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. تحقق من إعداد مفتاح API.',
    });
  }

  // Rate limit errors (forwarded from rate-limiter)
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'تجاوزت الحد الأقصى للطلبات.',
    });
  }

  // Generic server error
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'حدث خطأ داخلي في الخادم.',
  });
}
