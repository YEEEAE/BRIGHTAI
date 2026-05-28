const USER_MESSAGES = {
  VALIDATION_ERROR: 'فضلاً راجع بيانات الطلب وحاول مرة أخرى.',
  RATE_LIMITED: 'وصلنا طلبات كثيرة خلال وقت قصير. انتظر قليلاً ثم أعد المحاولة.',
  UNSUPPORTED_DEMO_TYPE: 'هذا الديمو غير متاح حالياً. اختر أحد ديموهات BrightAI المعتمدة.',
  AI_PROVIDER_ERROR: 'تعذر تشغيل الذكاء الاصطناعي الآن. حاول مرة أخرى بعد قليل.',
  TIMEOUT: 'استغرق الطلب وقتاً أطول من المتوقع. حاول مرة أخرى بعد قليل.',
  PAYLOAD_TOO_LARGE: 'حجم الطلب كبير جداً. اختصر المدخلات ثم أعد المحاولة.',
  UNSAFE_CONTENT_DETECTED: 'لا يمكن معالجة هذا المحتوى بأمان. عدّل المدخلات وحاول مرة أخرى.',
  MEDICAL_CONTENT_BLOCKED: 'لا يمكن استخدام الديمو لتشخيص أو علاج حالة طبية فردية. استخدم بيانات تشغيلية عامة فقط.',
  INTERNAL_ERROR: 'حدث خطأ غير متوقع. فريقنا يراجع الخدمة، وحاول مرة أخرى بعد قليل.'
};

const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  RATE_LIMITED: 429,
  UNSUPPORTED_DEMO_TYPE: 400,
  AI_PROVIDER_ERROR: 502,
  TIMEOUT: 504,
  PAYLOAD_TOO_LARGE: 413,
  UNSAFE_CONTENT_DETECTED: 422,
  MEDICAL_CONTENT_BLOCKED: 422,
  INTERNAL_ERROR: 500
};

function createHttpError(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.statusCode = details.statusCode || STATUS_BY_CODE[code] || 500;
  error.userMessage = details.userMessage || USER_MESSAGES[code] || USER_MESSAGES.INTERNAL_ERROR;
  if (details.meta) error.meta = details.meta;
  return error;
}

function sendError(res, error) {
  const code = error?.code && USER_MESSAGES[error.code] ? error.code : 'INTERNAL_ERROR';
  const statusCode = Number(error?.statusCode) || STATUS_BY_CODE[code] || 500;
  return res.status(statusCode).json({
    ok: false,
    errorCode: code,
    message: error?.userMessage || USER_MESSAGES[code]
  });
}

module.exports = {
  USER_MESSAGES,
  STATUS_BY_CODE,
  createHttpError,
  sendError
};
