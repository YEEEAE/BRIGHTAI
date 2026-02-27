import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalFetch = global.fetch;

async function loadHandleRequest(envOverrides = {}) {
  const trackedKeys = [
    'NODE_ENV',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'GROQ_API_KEY',
    'GROQ_STREAM_TIMEOUT_MS',
    'RATE_LIMIT_REQUESTS_PER_MINUTE',
    'RATE_LIMIT_STORAGE'
  ];

  const previous = {};
  for (const key of trackedKeys) {
    previous[key] = process.env[key];
  }

  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = envOverrides.GEMINI_API_KEY ?? 'gemini_test_key';
  process.env.GEMINI_MODEL = envOverrides.GEMINI_MODEL ?? 'gemini-2.5-flash';
  process.env.GROQ_API_KEY = envOverrides.GROQ_API_KEY ?? 'gsk_test_key';
  process.env.GROQ_STREAM_TIMEOUT_MS = String(envOverrides.GROQ_STREAM_TIMEOUT_MS ?? 150);
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = String(
    envOverrides.RATE_LIMIT_REQUESTS_PER_MINUTE ?? 30
  );
  process.env.RATE_LIMIT_STORAGE = 'memory';

  vi.resetModules();
  const { handleRequest } = await import('./server.js');

  return {
    handleRequest,
    restoreEnv() {
      for (const key of trackedKeys) {
        const value = previous[key];
        if (typeof value === 'undefined') {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  };
}

function invokeHandleRequest(handleRequest, { method = 'POST', url, body, ip = '127.0.0.1' }) {
  return new Promise((resolve, reject) => {
    const emitter = new EventEmitter();
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json' },
      socket: { remoteAddress: ip },
      connection: { remoteAddress: ip },
      ip,
      on: emitter.on.bind(emitter)
    };

    let status = 200;
    const headers = {};
    const chunks = [];

    const timeout = setTimeout(() => {
      reject(new Error('TEST_RESPONSE_TIMEOUT'));
    }, 4000);

    if (timeout.unref) timeout.unref();

    const res = {
      writeHead(code, nextHeaders = {}) {
        status = code;
        Object.assign(headers, nextHeaders);
      },
      setHeader(name, value) {
        headers[name] = value;
      },
      write(chunk) {
        if (typeof chunk !== 'undefined') {
          chunks.push(Buffer.from(String(chunk)));
        }
      },
      end(chunk) {
        if (typeof chunk !== 'undefined') {
          this.write(chunk);
        }
        clearTimeout(timeout);
        resolve({
          status,
          headers,
          body: Buffer.concat(chunks).toString('utf8')
        });
      }
    };

    Promise.resolve(handleRequest(req, res)).catch(error => {
      clearTimeout(timeout);
      reject(error);
    });

    process.nextTick(() => {
      if (method === 'POST') {
        const payload = JSON.stringify(body || {});
        emitter.emit('data', Buffer.from(payload));
      }
      emitter.emit('end');
    });
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Groq Stream Endpoint - Functional Scenarios', () => {
  it('success: streams tokens and closes with DONE marker', async () => {
    global.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: 'أهلاً وسهلاً' }]
            }
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    });

    const runtime = await loadHandleRequest({
      GROQ_STREAM_TIMEOUT_MS: 400,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/ai/stream',
        body: { message: 'اختبار سيناريو النجاح', outputType: 'دعم العملاء' }
      });

      expect(result.status).toBe(200);
      expect(result.body).toContain('"sessionId"');
      expect(result.body).toContain('"token":"أهلاً وسهلاً"');
      expect(result.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('success: streams using configured Gemini model', async () => {
    let capturedUrl = '';
    let capturedPayload = null;

    global.fetch = vi.fn(async (url, options = {}) => {
      capturedUrl = String(url);
      capturedPayload = JSON.parse(options.body || '{}');

      return new Response(JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: 'تم التشغيل' }]
            }
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    });

    const runtime = await loadHandleRequest({
      GEMINI_API_KEY: 'gemini_test_key',
      GROQ_STREAM_TIMEOUT_MS: 400,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/ai/stream',
        body: {
          message: 'اختبار مسار Gemini الافتراضي',
          outputType: 'دعم العملاء',
          geminiModel: 'gemini-1.5-pro'
        }
      });

      expect(result.status).toBe(200);
      expect(capturedUrl).toContain('/gemini-2.5-flash:generateContent');
      expect(capturedUrl).toContain('key=gemini_test_key');
      expect(Array.isArray(capturedPayload?.contents)).toBe(true);
      expect(capturedPayload.contents.length).toBeGreaterThan(0);
      expect(result.body).toContain('"token":"تم التشغيل"');
      expect(result.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('runtime key: accepts request-level key without breaking stream flow', async () => {
    let capturedPayload = null;

    global.fetch = vi.fn(async (_url, options = {}) => {
      capturedPayload = JSON.parse(options.body || '{}');

      return new Response(JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: 'تمت الاستجابة بمفتاح وقت التشغيل' }]
            }
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    });

    const runtime = await loadHandleRequest({
      GEMINI_API_KEY: 'gemini_test_key',
      GROQ_API_KEY: '',
      GROQ_STREAM_TIMEOUT_MS: 400,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/ai/stream',
        body: {
          message: 'اختبار مفتاح وقت التشغيل',
          outputType: 'دعم العملاء',
          apiKey: 'gsk_runtime_key_1234567890'
        }
      });

      expect(result.status).toBe(200);
      expect(result.body).toContain('"token":"تمت الاستجابة بمفتاح وقت التشغيل"');
      expect(result.body).toContain('data: [DONE]');
      expect(Array.isArray(capturedPayload?.contents)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('error: returns stream error payload when upstream fails', async () => {
    global.fetch = vi.fn(async () => {
      return new Response('upstream failed', {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    });

    const runtime = await loadHandleRequest({
      GROQ_STREAM_TIMEOUT_MS: 400,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/ai/stream',
        body: { message: 'اختبار سيناريو الخطأ' }
      });

      expect(result.status).toBe(200);
      expect(result.body).toContain('"errorCode":"AI_STREAM_ERROR"');
      expect(result.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('timeout: emits timeout error when upstream exceeds configured timeout', async () => {
    global.fetch = vi.fn(async () => {
      const timeoutError = new Error('upstream timeout');
      timeoutError.statusCode = 408;
      throw timeoutError;
    });

    const runtime = await loadHandleRequest({
      GROQ_STREAM_TIMEOUT_MS: 25,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/ai/stream',
        body: { message: 'اختبار سيناريو المهلة' }
      });

      expect(result.status).toBe(200);
      expect(result.body).toContain('"errorCode":"STREAM_TIMEOUT"');
      expect(result.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('rate limit: emits RATE_LIMIT_EXCEEDED when upstream returns 429', async () => {
    global.fetch = vi.fn(async () => {
      return new Response('rate limit exceeded', {
        status: 429,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    });

    const runtime = await loadHandleRequest({
      GROQ_STREAM_TIMEOUT_MS: 400,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/ai/stream',
        body: { message: 'اختبار سيناريو حد المعدل' }
      });

      expect(result.status).toBe(200);
      expect(result.body).toContain('\"errorCode\":\"RATE_LIMIT_EXCEEDED\"');
      expect(result.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('regression: keeps /api/groq/stream alias compatible with /api/ai/stream', async () => {
    global.fetch = vi.fn(async () => {
      return new Response(JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: 'توافق ثابت' }]
            }
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    });

    const runtime = await loadHandleRequest({
      GROQ_STREAM_TIMEOUT_MS: 400,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const officialRouteResult = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/ai/stream',
        body: { message: 'اختبار المسار الرسمي', outputType: 'دعم العملاء' }
      });

      const legacyRouteResult = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/groq/stream',
        body: { message: 'اختبار المسار القديم', outputType: 'دعم العملاء' }
      });

      expect(officialRouteResult.status).toBe(200);
      expect(legacyRouteResult.status).toBe(200);

      expect(officialRouteResult.body).toContain('"sessionId"');
      expect(legacyRouteResult.body).toContain('"sessionId"');

      expect(officialRouteResult.body).toContain('"token":"توافق ثابت"');
      expect(legacyRouteResult.body).toContain('"token":"توافق ثابت"');

      expect(officialRouteResult.body).toContain('data: [DONE]');
      expect(legacyRouteResult.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    } finally {
      runtime.restoreEnv();
    }
  });
});
