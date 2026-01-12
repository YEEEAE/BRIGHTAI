/**
 * Integration tests for Chatbot API
 * Tests Gemini API connection and error handling
 * Requirements: 1.2, 1.4, 4.1, 4.3, 4.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Mock fetch globally before importing modules
const originalFetch = global.fetch;

describe('Chatbot Integration Tests', () => {
  let chatHandler, ERROR_MESSAGES, isApiKeyConfigured;
  let mockReq, mockRes;
  let responseData;

  beforeEach(async () => {
    // Reset modules to ensure clean state
    vi.resetModules();
    
    // Mock console methods to reduce noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Setup response capture
    responseData = null;
    
    // Create mock request/response objects
    mockReq = {
      body: {},
      headers: {},
      ip: '127.0.0.1'
    };

    mockRes = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    // Import modules after mocking
    const chatModule = require('../../server/endpoints/chat.js');
    const configModule = require('../../server/config/index.js');
    
    chatHandler = chatModule.chatHandler;
    ERROR_MESSAGES = chatModule.ERROR_MESSAGES;
    isApiKeyConfigured = configModule.isApiKeyConfigured;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe('Task 7.1: اختبار الاتصال بـ Gemini API', () => {
    it('should successfully send a message and receive a response from Gemini API', async () => {
      // Mock successful Gemini API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'مرحباً! كيف يمكنني مساعدتك اليوم؟' }]
            }
          }]
        })
      });

      mockReq.body = {
        message: 'مرحبا',
        history: []
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(responseData).toHaveProperty('reply');
      expect(responseData.reply).toBe('مرحباً! كيف يمكنني مساعدتك اليوم؟');
      expect(responseData).toHaveProperty('sessionId');
    });

    it('should include session ID in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'رد تجريبي' }]
            }
          }]
        })
      });

      mockReq.body = {
        message: 'اختبار',
        sessionId: 'test_session_123'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(responseData.sessionId).toBe('test_session_123');
    });

    it('should generate session ID if not provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'رد تجريبي' }]
            }
          }]
        })
      });

      mockReq.body = {
        message: 'اختبار'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(responseData.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should handle conversation history correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'نعم، أتذكر سؤالك السابق' }]
            }
          }]
        })
      });

      mockReq.body = {
        message: 'هل تتذكر سؤالي السابق؟',
        history: [
          { text: 'ما هي خدمات BrightAI؟', sender: 'user' },
          { text: 'نقدم حلول الذكاء الاصطناعي', sender: 'bot' }
        ]
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      expect(responseData.reply).toBeTruthy();
      
      // Verify fetch was called with history
      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      // Should have system prompt + history + current message
      expect(requestBody.contents.length).toBeGreaterThan(2);
    });

    it('should return Arabic response from Gemini API (Requirement 1.4)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'أهلاً وسهلاً! أنا مساعد BrightAI الذكي.' }]
            }
          }]
        })
      });

      mockReq.body = {
        message: 'من أنت؟'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(200);
      // Verify response contains Arabic characters
      expect(/[\u0600-\u06FF]/.test(responseData.reply)).toBe(true);
    });
  });

  describe('Task 7.2: اختبار معالجة الأخطاء', () => {
    it('should return Arabic error message when network connection fails (Requirement 4.1)', async () => {
      // Mock network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));

      mockReq.body = {
        message: 'اختبار'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(responseData).toHaveProperty('error');
      // Verify error message is in Arabic
      expect(/[\u0600-\u06FF]/.test(responseData.error)).toBe(true);
    });

    it('should provide retry option on error (Requirement 4.3)', async () => {
      // Mock API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' })
      });

      mockReq.body = {
        message: 'اختبار'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('errorCode');
    });

    it('should return Arabic error when server gateway is unavailable (Requirement 4.4)', async () => {
      // Mock 503 Service Unavailable
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service Unavailable' })
      });

      mockReq.body = {
        message: 'اختبار'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(503);
      expect(responseData).toHaveProperty('error');
      // Verify error message is in Arabic
      expect(/[\u0600-\u06FF]/.test(responseData.error)).toBe(true);
    });

    it('should handle timeout errors with Arabic message', async () => {
      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.statusCode = 408;
      global.fetch = vi.fn().mockRejectedValue(timeoutError);

      mockReq.body = {
        message: 'اختبار'
      };

      await chatHandler(mockReq, mockRes);

      expect(responseData).toHaveProperty('error');
      // Verify error message is in Arabic
      expect(/[\u0600-\u06FF]/.test(responseData.error)).toBe(true);
    });

    it('should handle rate limit errors with Arabic message', async () => {
      // Mock rate limit error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      });

      mockReq.body = {
        message: 'اختبار'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(429);
      expect(responseData).toHaveProperty('error');
      // Verify error message is in Arabic
      expect(/[\u0600-\u06FF]/.test(responseData.error)).toBe(true);
    });

    it('should return 503 when API key is not configured', async () => {
      // Reset modules and mock config
      vi.resetModules();
      
      // Mock the config module to return unconfigured API key
      vi.doMock('../../server/config/index.js', () => ({
        config: {
          gemini: {
            apiKey: null,
            model: 'gemini-2.5-flash',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
          },
          validation: {
            maxInputLength: 1000
          }
        },
        isApiKeyConfigured: () => false
      }));

      const { chatHandler: handler } = require('../../server/endpoints/chat.js');

      mockReq.body = {
        message: 'اختبار'
      };

      await handler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(503);
      expect(responseData.error).toBe(ERROR_MESSAGES.API_NOT_CONFIGURED);
      expect(responseData.errorCode).toBe('API_NOT_CONFIGURED');
    });

    it('should handle invalid API response format', async () => {
      // Mock invalid response format
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          // Missing candidates array
          data: 'invalid format'
        })
      });

      mockReq.body = {
        message: 'اختبار'
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(500);
      expect(responseData).toHaveProperty('error');
    });

    it('should reject empty messages with Arabic error', async () => {
      mockReq.body = {
        message: ''
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(400);
      expect(responseData.error).toBe(ERROR_MESSAGES.NO_MESSAGE);
    });

    it('should reject whitespace-only messages with Arabic error', async () => {
      mockReq.body = {
        message: '   \t\n   '
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(400);
      expect(responseData.error).toBe(ERROR_MESSAGES.NO_MESSAGE);
    });

    it('should reject messages that are too long', async () => {
      mockReq.body = {
        message: 'أ'.repeat(1001) // Exceeds 1000 character limit
      };

      await chatHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(400);
      expect(responseData.error).toBe(ERROR_MESSAGES.MESSAGE_TOO_LONG);
    });
  });
});
