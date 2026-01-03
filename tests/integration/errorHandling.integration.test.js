/**
 * Integration tests for Error Handling
 * Tests retry logic and Arabic error messages with actual error scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  isTransientError,
  getArabicErrorMessage,
  retryWithBackoff
} = require('../../server/utils/errorHandler.js');

describe('Error Handling Integration', () => {
  beforeEach(() => {
    // Mock console methods to reduce noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Retry Logic with Real Scenarios', () => {
    it('should retry on network timeout and eventually succeed', async () => {
      let attemptCount = 0;
      const mockApiCall = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          const error = new Error('Request timeout');
          error.statusCode = 408;
          throw error;
        }
        return { success: true, data: 'response data' };
      });

      const result = await retryWithBackoff(mockApiCall, {
        maxRetries: 3,
        baseDelay: 10 // Short delay for testing
      });

      expect(result).toEqual({ success: true, data: 'response data' });
      expect(mockApiCall).toHaveBeenCalledTimes(3);
    });

    it('should retry on 503 Service Unavailable', async () => {
      let attemptCount = 0;
      const mockApiCall = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          const error = new Error('Service unavailable');
          error.statusCode = 503;
          throw error;
        }
        return { success: true };
      });

      const result = await retryWithBackoff(mockApiCall, {
        maxRetries: 3,
        baseDelay: 10
      });

      expect(result).toEqual({ success: true });
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 Bad Request', async () => {
      const mockApiCall = vi.fn(async () => {
        const error = new Error('Bad request');
        error.statusCode = 400;
        throw error;
      });

      await expect(
        retryWithBackoff(mockApiCall, {
          maxRetries: 3,
          baseDelay: 10
        })
      ).rejects.toThrow('Bad request');

      expect(mockApiCall).toHaveBeenCalledTimes(1); // No retries
    });

    it('should not retry on 404 Not Found', async () => {
      const mockApiCall = vi.fn(async () => {
        const error = new Error('Not found');
        error.statusCode = 404;
        throw error;
      });

      await expect(
        retryWithBackoff(mockApiCall, {
          maxRetries: 3,
          baseDelay: 10
        })
      ).rejects.toThrow('Not found');

      expect(mockApiCall).toHaveBeenCalledTimes(1); // No retries
    });

    it('should throw after exhausting all retries', async () => {
      const mockApiCall = vi.fn(async () => {
        const error = new Error('Persistent failure');
        error.statusCode = 503;
        throw error;
      });

      await expect(
        retryWithBackoff(mockApiCall, {
          maxRetries: 2,
          baseDelay: 10
        })
      ).rejects.toThrow('Persistent failure');

      expect(mockApiCall).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Arabic Error Messages for Different Scenarios', () => {
    it('should return Arabic message for timeout errors', () => {
      const error = new Error('timeout');
      const message = getArabicErrorMessage(error, 408);
      
      expect(message).toContain('انتهت مهلة الطلب');
      expect(/[\u0600-\u06FF]/.test(message)).toBe(true); // Contains Arabic
    });

    it('should return Arabic message for rate limit errors', () => {
      const error = new Error('rate limit');
      const message = getArabicErrorMessage(error, 429);
      
      expect(message).toContain('تجاوز الحد المسموح');
      expect(/[\u0600-\u06FF]/.test(message)).toBe(true);
    });

    it('should return Arabic message for server errors', () => {
      const error = new Error('server error');
      const message = getArabicErrorMessage(error, 500);
      
      expect(message).toContain('غير متاحة');
      expect(/[\u0600-\u06FF]/.test(message)).toBe(true);
    });

    it('should return Arabic message for network errors', () => {
      const error = new Error('network error');
      error.code = 'ECONNRESET';
      const message = getArabicErrorMessage(error);
      
      expect(message).toContain('الاتصال بالشبكة');
      expect(/[\u0600-\u06FF]/.test(message)).toBe(true);
    });

    it('should return Arabic message for bad request', () => {
      const error = new Error('bad request');
      const message = getArabicErrorMessage(error, 400);
      
      expect(message).toContain('طلب غير صالح');
      expect(/[\u0600-\u06FF]/.test(message)).toBe(true);
    });
  });

  describe('Transient Error Detection', () => {
    it('should correctly identify transient HTTP errors', () => {
      expect(isTransientError(new Error('test'), 408)).toBe(true);
      expect(isTransientError(new Error('test'), 429)).toBe(true);
      expect(isTransientError(new Error('test'), 500)).toBe(true);
      expect(isTransientError(new Error('test'), 502)).toBe(true);
      expect(isTransientError(new Error('test'), 503)).toBe(true);
      expect(isTransientError(new Error('test'), 504)).toBe(true);
    });

    it('should correctly identify non-transient HTTP errors', () => {
      expect(isTransientError(new Error('test'), 400)).toBe(false);
      expect(isTransientError(new Error('test'), 401)).toBe(false);
      expect(isTransientError(new Error('test'), 403)).toBe(false);
      expect(isTransientError(new Error('test'), 404)).toBe(false);
    });

    it('should correctly identify transient network errors', () => {
      const error1 = new Error('test');
      error1.code = 'ECONNRESET';
      expect(isTransientError(error1)).toBe(true);

      const error2 = new Error('test');
      error2.code = 'ETIMEDOUT';
      expect(isTransientError(error2)).toBe(true);

      const error3 = new Error('fetch failed');
      expect(isTransientError(error3)).toBe(true);
    });
  });
});
