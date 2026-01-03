/**
 * Rate Limiter Unit Tests
 * Tests for IP-based rate limiting middleware
 * Requirements: 23.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  rateLimiterMiddleware,
  checkLimit,
  recordRequest,
  getRemainingRequests,
  RATE_LIMIT_ERROR_AR
} from '../../server/middleware/rateLimiter.js';

describe('Rate Limiter', () => {
  const mockIP = '192.168.1.1';
  
  beforeEach(() => {
    // Clear any existing rate limit data
    vi.clearAllMocks();
  });
  
  describe('checkLimit', () => {
    it('should return false for new IP', () => {
      const result = checkLimit('new-ip-address');
      expect(result).toBe(false);
    });
    
    it('should return false when under limit', () => {
      // Record 5 requests
      for (let i = 0; i < 5; i++) {
        recordRequest(mockIP);
      }
      
      const result = checkLimit(mockIP);
      expect(result).toBe(false);
    });
    
    it('should return true when limit exceeded', () => {
      // Record 31 requests (over the 30 limit)
      for (let i = 0; i < 31; i++) {
        recordRequest(mockIP);
      }
      
      const result = checkLimit(mockIP);
      expect(result).toBe(true);
    });
  });
  
  describe('recordRequest', () => {
    it('should record first request for IP', () => {
      recordRequest(mockIP);
      const remaining = getRemainingRequests(mockIP);
      expect(remaining).toBe(29); // 30 - 1
    });
    
    it('should increment count for subsequent requests', () => {
      recordRequest(mockIP);
      recordRequest(mockIP);
      recordRequest(mockIP);
      
      const remaining = getRemainingRequests(mockIP);
      expect(remaining).toBe(27); // 30 - 3
    });
  });
  
  describe('getRemainingRequests', () => {
    it('should return full limit for new IP', () => {
      const remaining = getRemainingRequests('new-ip');
      expect(remaining).toBe(30);
    });
    
    it('should return correct remaining count', () => {
      for (let i = 0; i < 10; i++) {
        recordRequest(mockIP);
      }
      
      const remaining = getRemainingRequests(mockIP);
      expect(remaining).toBe(20); // 30 - 10
    });
    
    it('should not return negative values', () => {
      // Record more than limit
      for (let i = 0; i < 35; i++) {
        recordRequest(mockIP);
      }
      
      const remaining = getRemainingRequests(mockIP);
      expect(remaining).toBe(0);
    });
  });
  
  describe('rateLimiterMiddleware', () => {
    it('should call next() when under limit', () => {
      const req = {
        headers: {},
        connection: { remoteAddress: mockIP },
        ip: mockIP
      };
      
      const res = {
        statusCode: 200,
        headers: {},
        status(code) {
          this.statusCode = code;
          return this;
        },
        setHeader(name, value) {
          this.headers[name] = value;
        },
        json(data) {
          this.body = data;
        }
      };
      
      const next = vi.fn();
      
      rateLimiterMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.headers['X-RateLimit-Limit']).toBe(30);
    });
    
    it('should return 429 with Arabic message when limit exceeded', () => {
      const req = {
        headers: {},
        connection: { remoteAddress: mockIP },
        ip: mockIP
      };
      
      const res = {
        statusCode: 200,
        headers: {},
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        setHeader(name, value) {
          this.headers[name] = value;
        },
        json(data) {
          this.body = data;
          return this;
        }
      };
      
      const next = vi.fn();
      
      // Exceed the limit
      for (let i = 0; i < 31; i++) {
        recordRequest(mockIP);
      }
      
      rateLimiterMiddleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(429);
      expect(res.body.error).toBe(RATE_LIMIT_ERROR_AR);
      expect(res.body.errorCode).toBe('RATE_LIMIT_EXCEEDED');
      expect(res.body.retryAfter).toBe(60);
    });
    
    it('should handle x-forwarded-for header', () => {
      const forwardedIP = '10.0.0.1';
      const req = {
        headers: {
          'x-forwarded-for': `${forwardedIP}, 192.168.1.1`
        },
        connection: { remoteAddress: '192.168.1.1' },
        ip: '192.168.1.1'
      };
      
      const res = {
        statusCode: 200,
        headers: {},
        status(code) {
          this.statusCode = code;
          return this;
        },
        setHeader(name, value) {
          this.headers[name] = value;
        },
        json(data) {
          this.body = data;
        }
      };
      
      const next = vi.fn();
      
      rateLimiterMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      // Verify it used the forwarded IP
      const remaining = getRemainingRequests(forwardedIP);
      expect(remaining).toBeLessThan(30);
    });
  });
});
