import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for demo API endpoints.
 * Allows 30 requests per minute per IP.
 */
export const demoRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'لقد تجاوزت الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى بعد دقيقة.',
    errorEn: 'Too many requests. Please try again after a minute.',
  },
});
