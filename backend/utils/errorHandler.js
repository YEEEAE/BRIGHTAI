/**
 * Error Handler Utility
 * Provides error handling with Arabic messages and retry logic
 * Requirements: 23.8
 */

// Arabic error messages for different error types
const ERROR_MESSAGES = {
  // Network/API errors (transient)
  NETWORK_ERROR: 'خطأ في الاتصال بالشبكة. يرجى المحاولة مرة أخرى',
  TIMEOUT_ERROR: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
  API_UNAVAILABLE: 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً',
  RATE_LIMIT_EXCEEDED: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً',
  
  // Client errors (non-transient)
  INVALID_REQUEST: 'طلب غير صالح',
  INVALID_INPUT: 'البيانات المدخلة غير صحيحة',
  UNAUTHORIZED: 'غير مصرح بالوصول',
  FORBIDDEN: 'الوصول محظور',
  NOT_FOUND: 'الصفحة غير موجودة',
  
  // Server errors
  INTERNAL_ERROR: 'حدث خطأ داخلي في الخادم',
  SERVICE_ERROR: 'خطأ في الخدمة',
  
  // Generic fallback
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى'
};

// Error codes that indicate transient failures (should retry)
const TRANSIENT_ERROR_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504  // Gateway Timeout
];

// Error types that should trigger retry
const TRANSIENT_ERROR_TYPES = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH'
];

/**
 * Check if an error is transient (temporary) and should be retried
 * @param {Error} error - The error object
 * @param {number} statusCode - HTTP status code (if applicable)
 * @returns {boolean} - True if error is transient
 */
function isTransientError(error, statusCode = null) {
  // Check HTTP status codes
  if (statusCode && TRANSIENT_ERROR_CODES.includes(statusCode)) {
    return true;
  }
  
  // Check error code (network errors)
  if (error.code && TRANSIENT_ERROR_TYPES.includes(error.code)) {
    return true;
  }
  
  // Check error message patterns
  const errorMessage = error.message?.toLowerCase() || '';
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('fetch failed')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Get Arabic error message based on error type and status code
 * @param {Error} error - The error object
 * @param {number} statusCode - HTTP status code
 * @returns {string} - Arabic error message
 */
function getArabicErrorMessage(error, statusCode = null) {
  // Map status codes to messages
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return ERROR_MESSAGES.INVALID_REQUEST;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 408:
        return ERROR_MESSAGES.TIMEOUT_ERROR;
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.API_UNAVAILABLE;
      default:
        break;
    }
  }
  
  // Check error type/code
  if (error.code && TRANSIENT_ERROR_TYPES.includes(error.code)) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Check error message patterns
  const errorMessage = error.message?.toLowerCase() || '';
  if (errorMessage.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (errorMessage.includes('rate limit')) {
    return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }
  
  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 10000)
 * @returns {number} - Delay in milliseconds
 */
function calculateBackoff(attempt, baseDelay = 1000, maxDelay = 10000) {
  // Exponential backoff: baseDelay * 2^attempt
  const delay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter (random 0-20% variation) to prevent thundering herd
  const jitter = delay * 0.2 * Math.random();
  
  // Cap at maxDelay
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Custom function to determine if should retry
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise<any>} - Result of the function
 * @throws {Error} - Last error if all retries fail
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = isTransientError,
    onRetry = null
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Try to execute the function
      return await fn();
      
    } catch (error) {
      lastError = error;
      
      // Extract status code if available
      const statusCode = error.statusCode || error.status || null;
      
      // Check if we should retry
      const isLastAttempt = attempt === maxRetries;
      const shouldRetryError = shouldRetry(error, statusCode);
      
      if (isLastAttempt || !shouldRetryError) {
        // Don't retry - throw the error
        throw error;
      }
      
      // Calculate backoff delay
      const delay = calculateBackoff(attempt, baseDelay, maxDelay);
      
      // Log retry attempt
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
        { error: error.message, statusCode }
      );
      
      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(attempt + 1, delay, error);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // Should never reach here, but throw last error just in case
  throw lastError;
}

/**
 * Wrap an async function with retry logic
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Retry options (same as retryWithBackoff)
 * @returns {Function} - Wrapped function with retry logic
 */
function withRetry(fn, options = {}) {
  return async function(...args) {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Create a standardized error response object
 * @param {Error} error - The error object
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Application error code
 * @returns {Object} - Error response object
 */
function createErrorResponse(error, statusCode = 500, errorCode = 'UNKNOWN_ERROR') {
  const arabicMessage = getArabicErrorMessage(error, statusCode);
  
  return {
    error: arabicMessage,
    errorCode,
    ...(process.env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack
    })
  };
}

module.exports = {
  ERROR_MESSAGES,
  isTransientError,
  getArabicErrorMessage,
  calculateBackoff,
  retryWithBackoff,
  withRetry,
  createErrorResponse,
  sleep
};
