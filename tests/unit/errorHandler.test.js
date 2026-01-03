/**
 * Unit tests for Error Handler
 * Tests error handling, retry logic, and Arabic error messages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  isTransientError,
  getArabicErrorMessage,
  calculateBackoff,
  retryWithBackoff,
  withRetry,
  createErrorResponse,
  sleep
} = require('../../server/utils/errorHandler.js');

describe('Error Handler', () => {
  describe('isTransientError', () => {
    it('should identify transient HTTP status codes', () => {
      expect(isTransientError(new Error('test'), 408)).toBe(true); // Timeout
      expect(isTransientError(new Error('test'), 429)).toBe(true); // Rate limit
      expect(isTransientError(new Error('test'), 500)).toBe(true); // Server error
      expect(isTransientError(new Error('test'), 502)).toBe(true); // Bad gateway
      expect(isTransientError(new Error('test'), 503)).toBe(true); // Service unavailable
      expect(isTransientError(new Error('test'), 504)).toBe(true); // Gateway timeout
    });

    it('should identify non-transient HTTP status codes', () => {
      expect(isTransientError(new Error('test'), 400)).toBe(false); // Bad request
      expect(isTransientError(new Error('test'), 401)).toBe(false); // Unauthorized
      expect(isTransientError(new Error('test'), 403)).toBe(false); // Forbidden
      expect(isTransientError(new Error('test'), 404)).toBe(false); // Not found
    });

    it('should identify transient network error codes', () => {
      const error1 = new Error('test');
      error1.code = 'ECONNRESET';
      expect(isTransientError(error1)).toBe(true);

      const error2 = new Error('test');
      error2.code = 'ETIMEDOUT';
      expect(isTransientError(error2)).toBe(true);

      const error3 = new Error('test');
      error3.code = 'ECONNREFUSED';
      expect(isTransientError(error3)).toBe(true);
    });

    it('should identify transient errors by message', () => {
      expect(isTransientError(new Error('timeout occurred'))).toBe(true);
      expect(isTransientError(new Error('network error'))).toBe(true);
      expect(isTransientError(new Error('fetch failed'))).toBe(true);
    });

    it('should identify non-transient errors', () => {
      expect(isTransientError(new Error('invalid input'))).toBe(false);
      expect(isTransientError(new Error('validation failed'))).toBe(false);
    });
  });

  describe('getArabicErrorMessage', () => {
    it('should return Arabic message for timeout errors', () => {
      const message = getArabicErrorMessage(new Error('timeout'), 408);
      expect(message).toContain('انتهت مهلة الطلب');
    });

    it('should return Arabic message for rate limit errors', () => {
      const message = getArabicErrorMessage(new Error('rate limit'), 429);
      expect(message).toContain('تجاوز الحد المسموح');
    });

    it('should return Arabic message for server errors', () => {
      const message = getArabicErrorMessage(new Error('server error'), 500);
      expect(message).toContain('غير متاحة');
    });

    it('should return Arabic message for network errors', () => {
      const error = new Error('network error');
      error.code = 'ECONNRESET';
      const message = getArabicErrorMessage(error);
      expect(message).toContain('الاتصال بالشبكة');
    });

    it('should return default Arabic message for unknown errors', () => {
      const message = getArabicErrorMessage(new Error('unknown'));
      expect(message).toContain('خطأ');
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      expect(calculateBackoff(0, 1000)).toBeGreaterThanOrEqual(1000);
      expect(calculateBackoff(0, 1000)).toBeLessThan(1200); // 1000 + 20% jitter
      
      expect(calculateBackoff(1, 1000)).toBeGreaterThanOrEqual(2000);
      expect(calculateBackoff(1, 1000)).toBeLessThan(2400); // 2000 + 20% jitter
      
      expect(calculateBackoff(2, 1000)).toBeGreaterThanOrEqual(4000);
      expect(calculateBackoff(2, 1000)).toBeLessThan(4800); // 4000 + 20% jitter
    });

    it('should cap delay at maxDelay', () => {
      const delay = calculateBackoff(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should add jitter to prevent thundering herd', () => {
      const delays = [];
      for (let i = 0; i < 10; i++) {
        delays.push(calculateBackoff(1, 1000));
      }
      
      // Check that not all delays are identical (jitter is working)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some tolerance
      expect(elapsed).toBeLessThan(150);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const promise = retryWithBackoff(fn, { maxRetries: 3 });
      await vi.runAllTimersAsync();
      const result = await promise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(Object.assign(new Error('timeout'), { statusCode: 503 }))
        .mockRejectedValueOnce(Object.assign(new Error('timeout'), { statusCode: 503 }))
        .mockResolvedValue('success');
      
      const promise = retryWithBackoff(fn, { maxRetries: 3, baseDelay: 100 });
      await vi.runAllTimersAsync();
      const result = await promise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-transient errors', async () => {
      const error = new Error('bad request');
      error.statusCode = 400;
      const fn = vi.fn().mockRejectedValue(error);
      
      const promise = retryWithBackoff(fn, { maxRetries: 3 });
      
      await expect(promise).rejects.toThrow('bad request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const error = new Error('persistent error');
      error.statusCode = 503;
      const fn = vi.fn().mockRejectedValue(error);
      
      const promise = retryWithBackoff(fn, { maxRetries: 2, baseDelay: 100 });
      
      // Wait for all timers to complete
      await vi.runAllTimersAsync();
      
      // Now check that it rejects
      await expect(promise).rejects.toThrow('persistent error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should call onRetry callback', async () => {
      const error = new Error('transient');
      error.statusCode = 503;
      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const onRetry = vi.fn();
      
      const promise = retryWithBackoff(fn, { 
        maxRetries: 3, 
        baseDelay: 100,
        onRetry 
      });
      await vi.runAllTimersAsync();
      await promise;
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1, // attempt number
        expect.any(Number), // delay
        error
      );
    });
  });

  describe('withRetry', () => {
    it('should wrap function with retry logic', async () => {
      const originalFn = vi.fn()
        .mockRejectedValueOnce(Object.assign(new Error('fail'), { statusCode: 503 }))
        .mockResolvedValue('success');
      
      const wrappedFn = withRetry(originalFn, { maxRetries: 2 });
      
      const result = await wrappedFn('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with Arabic message', () => {
      const error = new Error('test error');
      const response = createErrorResponse(error, 500, 'TEST_ERROR');
      
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('errorCode', 'TEST_ERROR');
      expect(typeof response.error).toBe('string');
    });

    it('should include details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('test error');
      const response = createErrorResponse(error, 500, 'TEST_ERROR');
      
      expect(response).toHaveProperty('details', 'test error');
      expect(response).toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('test error');
      const response = createErrorResponse(error, 500, 'TEST_ERROR');
      
      expect(response).not.toHaveProperty('details');
      expect(response).not.toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
