import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalFetch = global.fetch;

const TRACKED_ENV_KEYS = [
  'NODE_ENV',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GROQ_API_KEY',
  'GROQ_STREAM_TIMEOUT_MS',
  'RATE_LIMIT_REQUESTS_PER_MINUTE',
  'RATE_LIMIT_STORAGE'
];

async function loadHandleRequest(envOverrides = {}) {
  const previous = {};
  for (const key of TRACKED_ENV_KEYS) {
    previous[key] = process.env[key];
  }

  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = envOverrides.GEMINI_API_KEY ?? 'gemini_test_key';
  process.env.GEMINI_MODEL = envOverrides.GEMINI_MODEL ?? 'gemini-2.5-flash';
  process.env.GROQ_API_KEY = envOverrides.GROQ_API_KEY ?? '';
  process.env.GROQ_STREAM_TIMEOUT_MS = String(envOverrides.GROQ_STREAM_TIMEOUT_MS ?? 400);
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = String(
    envOverrides.RATE_LIMIT_REQUESTS_PER_MINUTE ?? 50
  );
  process.env.RATE_LIMIT_STORAGE = 'memory';

  vi.resetModules();
  const { handleRequest } = await import('./server.js');

  return {
    handleRequest,
    restoreEnv() {
      for (const key of TRACKED_ENV_KEYS) {
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

function invokeRoute(handleRequest, { url, body, method = 'POST' }) {
  return new Promise((resolve, reject) => {
    const emitter = new EventEmitter();
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json' },
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
      on: emitter.on.bind(emitter)
    };

    let status = 200;
    const chunks = [];
    const headers = {};

    const res = {
      headersSent: false,
      writeHead(code, nextHeaders = {}) {
        status = code;
        Object.assign(headers, nextHeaders);
        this.headersSent = true;
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
        this.headersSent = true;
        resolve({
          status,
          headers,
          body: Buffer.concat(chunks).toString('utf8')
        });
      }
    };

    Promise.resolve(handleRequest(req, res)).catch(reject);

    process.nextTick(() => {
      if (method === 'POST') {
        emitter.emit('data', Buffer.from(JSON.stringify(body || {})));
      }
      emitter.emit('end');
    });
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Stream routes E2E', () => {
  it('returns 200 for /api/ai/stream and /api/groq/stream in success scenario', async () => {
    global.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: 'stream-e2e-ok' }]
              }
            }
          ]
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    });

    const runtime = await loadHandleRequest();

    try {
      const payload = { message: 'E2E stream success', outputType: 'دعم العملاء' };

      const officialRouteResult = await invokeRoute(runtime.handleRequest, {
        url: '/api/ai/stream',
        body: payload
      });
      const legacyRouteResult = await invokeRoute(runtime.handleRequest, {
        url: '/api/groq/stream',
        body: payload
      });

      expect(officialRouteResult.status).toBe(200);
      expect(legacyRouteResult.status).toBe(200);
      expect(officialRouteResult.body).toContain('data: [DONE]');
      expect(legacyRouteResult.body).toContain('data: [DONE]');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    } finally {
      runtime.restoreEnv();
    }
  });
});
