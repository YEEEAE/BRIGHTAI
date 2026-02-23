import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalFetch = global.fetch;

async function loadHandleRequest(envOverrides = {}) {
  const trackedKeys = [
    'NODE_ENV',
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
  process.env.GROQ_API_KEY = envOverrides.GROQ_API_KEY || 'gsk_test_key';
  process.env.GROQ_STREAM_TIMEOUT_MS = String(envOverrides.GROQ_STREAM_TIMEOUT_MS || 150);
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = String(
    envOverrides.RATE_LIMIT_REQUESTS_PER_MINUTE || 30
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
      return new Response(
        [
          'data: {"choices":[{"delta":{"content":"أهلاً"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":" وسهلاً"}}]}\n\n',
          'data: [DONE]\n\n'
        ].join(''),
        {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
        }
      );
    });

    const runtime = await loadHandleRequest({
      GROQ_STREAM_TIMEOUT_MS: 400,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/groq/stream',
        body: { message: 'اختبار سيناريو النجاح', outputType: 'دعم العملاء' }
      });

      expect(result.status).toBe(200);
      expect(result.body).toContain('"sessionId"');
      expect(result.body).toContain('"token":"أهلاً"');
      expect(result.body).toContain('"token":" وسهلاً"');
      expect(result.body).toContain('data: [DONE]');
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
        url: '/api/groq/stream',
        body: { message: 'اختبار سيناريو الخطأ' }
      });

      expect(result.status).toBe(200);
      expect(result.body).toContain('"errorCode":"GROQ_STREAM_ERROR"');
      expect(result.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('timeout: emits timeout error when upstream exceeds configured timeout', async () => {
    global.fetch = vi.fn((_, options = {}) => {
      return new Promise((resolve, reject) => {
        const signal = options.signal;
        if (!signal) {
          resolve(
            new Response('missing abort signal', {
              status: 500,
              headers: { 'Content-Type': 'text/plain' }
            })
          );
          return;
        }

        signal.addEventListener(
          'abort',
          () => {
            const abortError = new Error('This operation was aborted');
            abortError.name = 'AbortError';
            reject(abortError);
          },
          { once: true }
        );
      });
    });

    const runtime = await loadHandleRequest({
      GROQ_STREAM_TIMEOUT_MS: 25,
      RATE_LIMIT_REQUESTS_PER_MINUTE: 20
    });

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        method: 'POST',
        url: '/api/groq/stream',
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
        url: '/api/groq/stream',
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
});
