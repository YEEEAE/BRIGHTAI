/**
 * Tests for the Unified AI Gateway
 * Covers: config, route aliases, chat, stream, openai-compat, error handling, provider status
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment before requiring config
process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
process.env.GEMINI_MODEL = 'gemini-2.5-flash';
process.env.NODE_ENV = 'test';

const aiGateway = require('../backend/services/aiGateway');
const { getProviderStatus, resolveApiKey, resolveModel, normalizeStatusCode, splitReplyAndSuggestions, buildGeminiContents, parseGeminiText, DEFAULT_SUGGESTIONS } = aiGateway;

describe('AI Gateway — Config & Provider Status', () => {
  it('resolveApiKey returns GEMINI_API_KEY from env', () => {
    const key = resolveApiKey();
    expect(key).toBe('test-gemini-key-12345');
  });

  it('resolveModel returns model from env', () => {
    const model = resolveModel();
    expect(model).toBe('gemini-2.5-flash');
  });

  it('getProviderStatus shows gemini as configured and primary', () => {
    const status = getProviderStatus();
    expect(status.gemini.configured).toBe(true);
    expect(status.gemini.primary).toBe(true);
    expect(status.gemini.model).toBe('gemini-2.5-flash');
  });
});

describe('AI Gateway — buildGeminiContents', () => {
  it('builds contents with system prompt, history, and user message', () => {
    const history = [
      { role: 'user', content: 'مرحبا' },
      { role: 'assistant', content: 'أهلاً بك' }
    ];
    const contents = buildGeminiContents(history, 'ما هي خدماتكم؟');
    expect(contents.length).toBe(5); // system prompt user + model ack + 2 history + user message
    expect(contents[0].role).toBe('user');
    expect(contents[1].role).toBe('model');
    expect(contents[2].role).toBe('user');
    expect(contents[3].role).toBe('model');
    expect(contents[4].role).toBe('user');
    expect(contents[4].parts[0].text).toBe('ما هي خدماتكم؟');
  });

  it('handles empty history', () => {
    const contents = buildGeminiContents([], 'سؤال جديد');
    expect(contents.length).toBe(3); // system prompt + ack + user message
  });
});

describe('AI Gateway — parseGeminiText', () => {
  it('extracts text from Gemini response format', () => {
    const payload = {
      candidates: [{
        content: {
          parts: [{ text: 'مرحباً بك في Bright AI' }, { text: 'كيف أقدر أساعدك؟' }]
        }
      }]
    };
    const text = parseGeminiText(payload);
    expect(text).toContain('مرحباً بك في Bright AI');
    expect(text).toContain('كيف أقدر أساعدك؟');
  });

  it('returns empty string for missing parts', () => {
    expect(parseGeminiText({})).toBe('');
    expect(parseGeminiText({ candidates: [] })).toBe('');
    expect(parseGeminiText({ candidates: [{ content: { parts: [] } }] })).toBe('');
  });
});

describe('AI Gateway — splitReplyAndSuggestions', () => {
  it('splits reply and suggestions with delimiter', () => {
    const rawText = 'نقدم حلول ذكاء اصطناعي.\n---SUGGESTIONS---\nما هي خدماتكم؟\nأريد استشارة\nكيف أبدأ؟';
    const result = splitReplyAndSuggestions(rawText);
    expect(result.reply).toContain('نقدم حلول ذكاء اصطناعي');
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions[0]).toBe('ما هي خدماتكم؟');
  });

  it('returns default suggestions when no delimiter', () => {
    const result = splitReplyAndSuggestions('إجابة بدون اقتراحات');
    expect(result.reply).toContain('إجابة بدون اقتراحات');
    expect(result.suggestions).toEqual(DEFAULT_SUGGESTIONS);
  });

  it('handles empty text', () => {
    const result = splitReplyAndSuggestions('');
    expect(result.reply).toBeTruthy();
    expect(result.suggestions).toEqual(DEFAULT_SUGGESTIONS);
  });
});

describe('AI Gateway — normalizeStatusCode', () => {
  it('maps timeout errors to 408', () => {
    expect(normalizeStatusCode({ statusCode: 408 })).toBe(408);
    expect(normalizeStatusCode({ code: 'ETIMEDOUT' })).toBe(408);
    expect(normalizeStatusCode({ message: 'Request timeout occurred' })).toBe(408);
  });

  it('maps connection errors to 503', () => {
    expect(normalizeStatusCode({ code: 'ECONNRESET' })).toBe(503);
    expect(normalizeStatusCode({ code: 'ECONNREFUSED' })).toBe(503);
    expect(normalizeStatusCode({ code: 'ENOTFOUND' })).toBe(503);
  });

  it('defaults to 500 for unknown errors', () => {
    expect(normalizeStatusCode({ message: 'something went wrong' })).toBe(500);
  });

  it('preserves explicit status codes', () => {
    expect(normalizeStatusCode({ statusCode: 429 })).toBe(429);
    expect(normalizeStatusCode({ statusCode: 502 })).toBe(502);
  });
});

describe('AI Gateway — validateChatRequest', () => {
  it('rejects missing message', () => {
    expect(() => aiGateway.validateChatRequest({ body: {} })).toThrow('طلب غير صالح');
  });

  it('rejects empty message', () => {
    expect(() => aiGateway.validateChatRequest({ body: { message: '   ' } })).toThrow('يرجى إدخال رسالة');
  });

  it('accepts valid message and returns context', () => {
    const result = aiGateway.validateChatRequest({ body: { message: 'ما هي خدماتكم؟' } });
    expect(result.sanitizedMessage).toBe('ما هي خدماتكم؟');
    expect(result.activeSessionId).toBeTruthy();
    expect(Array.isArray(result.history)).toBe(true);
  });
});

describe('AI Gateway — Route Aliases', () => {
  const { config } = require('../backend/config');

  it('server.js CHAT_ROUTE_ALIASES includes /api/gemini/chat', () => {
    // Verify the alias sets are defined in server.js
    const fs = require('fs');
    const serverSrc = fs.readFileSync(require('path').resolve(__dirname, '../backend/server.js'), 'utf8');
    expect(serverSrc).toContain("CHAT_ROUTE_ALIASES = new Set(['/api/gemini/chat'])");
    expect(serverSrc).toContain("CHAT_STREAM_ROUTE_ALIASES = new Set(['/api/gemini/chat/stream'])");
    expect(serverSrc).toContain("OPENAI_COMPAT_ROUTE_ALIASES = new Set(['/api/ai/openai-chat', '/api/ai/chat/completions'])");
  });

  it('api-gateway.js ENDPOINTS.GEMINI_CHAT points to /api/ai/chat', () => {
    const fs = require('fs');
    const gatewaySrc = fs.readFileSync(require('path').resolve(__dirname, '../frontend/js/api-gateway.js'), 'utf8');
    expect(gatewaySrc).toContain('GEMINI_CHAT: "/api/ai/chat"');
    expect(gatewaySrc).toContain('UNIFIED_CHAT: "/api/ai/chat"');
    expect(gatewaySrc).toContain('UNIFIED_CHAT_STREAM: "/api/ai/chat/stream"');
  });
});

describe('AI Gateway — Frontend Security', () => {
  it('ai-scolecs-app.js has no GROQ_API_KEY or Authorization header', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require('path').resolve(__dirname, '../frontend/js/ai-scolecs-app.js'), 'utf8');
    expect(src).not.toContain('GROQ_API_KEY');
    expect(src).not.toContain('Authorization');
  });

  it('chat-widget.js uses /api/ai/chat not /api/gemini/chat', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require('path').resolve(__dirname, '../frontend/js/chat-widget.js'), 'utf8');
    expect(src).toContain('/api/ai/chat');
    expect(src).not.toContain('/api/gemini/chat');
  });
});

describe('AI Gateway — Config Security', () => {
  it('config has no hardcoded Gemini API key', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require('path').resolve(__dirname, '../backend/config/index.js'), 'utf8');
    expect(src).not.toContain('AIzaSyBFMmyO7sgXaSbF47zd3rbO6I9MfhbYLK8');
  });

  it('dotenv is optional (try/catch)', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require('path').resolve(__dirname, '../backend/config/index.js'), 'utf8');
    expect(src).toContain('try {');
    expect(src).toContain('dotenvMissing');
  });
});

describe('AI Gateway — All Frontend Files Use Unified Endpoints', () => {
  const fs = require('fs');
  const path = require('path');

  const frontendJsFiles = [
    'frontend/js/index-theme.js',
    'frontend/js/index-theme.min.js',
    'frontend/js/chat-widget.js',
    'frontend/js/main.bundle.js',
    'frontend/js/article-ux-enhancements.js',
    'frontend/js/groq-client.js',
    'frontend/js/chatbot-production.bundle.js'
    // Note: api-gateway.js keeps AI_STREAM as a legacy alias name in ENDPOINTS
  ];

  it('no frontend JS file references /api/gemini/chat', () => {
    for (const file of frontendJsFiles) {
      const src = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
      expect(src).not.toContain('/api/gemini/chat');
    }
  });

  it('no frontend JS file references /api/ai/stream (replaced by /api/ai/chat/stream)', () => {
    for (const file of frontendJsFiles) {
      const src = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
      expect(src).not.toContain('/api/ai/stream');
    }
  });

  const aiBotHtmlFiles = [
    'ai-bots/BrightMath/index.html',
    'ai-bots/BrightSupport/index.html',
    'ai-bots/BrightProject/index.html',
    'ai-bots/BrightRecruiter/index.html',
    'ai-bots/BrightSales/index.html'
  ];

  it('all ai-bots HTML use /api/ai/chat/stream as data-chat-endpoint', () => {
    for (const file of aiBotHtmlFiles) {
      const src = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
      expect(src).toContain('data-chat-endpoint="/api/ai/chat/stream"');
    }
  });

  const interviewHtmlFiles = [
    'interview/pages/dashboard/index.html',
    'interview/pages/support-ai/index.html'
  ];

  it('interview pages use /api/ai/chat not /api/gemini/chat', () => {
    for (const file of interviewHtmlFiles) {
      const src = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
      expect(src).not.toContain('/api/gemini/chat');
      expect(src).toContain('/api/ai/chat');
    }
  });

  it('demo/index.html uses /api/ai/chat/stream', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'demo/index.html'), 'utf8');
    expect(src).not.toContain('/api/ai/stream');
    expect(src).toContain('/api/ai/chat/stream');
  });
});

describe('AI Gateway — Server enhancedRes supports SSE streaming', () => {
  const fs = require('fs');
  const path = require('path');

  it('server.js enhancedRes has write, end, and writeHead methods', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'backend/server.js'), 'utf8');
    // Check that enhancedRes has write, end, writeHead for SSE streaming
    expect(src).toContain('write(chunk)');
    expect(src).toContain('end(chunk)');
    expect(src).toContain('writeHead(statusCode, headers)');
  });

  it('server.js passes rawRes to unifiedChatStreamHandler', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '..', 'backend/server.js'), 'utf8');
    expect(src).toContain('unifiedChatStreamHandler(ctx.req, ctx.res, res)');
  });
});
