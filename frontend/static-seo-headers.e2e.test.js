import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

const TRACKED_ENV_KEYS = [
  'NODE_ENV',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'RATE_LIMIT_REQUESTS_PER_MINUTE',
  'RATE_LIMIT_STORAGE'
];

async function loadHandleRequest() {
  const previous = {};
  for (const key of TRACKED_ENV_KEYS) {
    previous[key] = process.env[key];
  }

  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'gemini_test_key';
  process.env.GROQ_API_KEY = '';
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = '50';
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

function invokeHandleRequest(handleRequest, { method = 'GET', url }) {
  return new Promise((resolve, reject) => {
    let status = 200;
    const headers = {};
    const chunks = [];

    const req = {
      method,
      url,
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const res = new EventEmitter();
    Object.assign(res, {
      headersSent: false,
      writableEnded: false,
      writeHead(code, nextHeaders = {}) {
        status = code;
        Object.assign(headers, nextHeaders);
        this.headersSent = true;
      },
      write(chunk) {
        if (typeof chunk !== 'undefined') {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        return true;
      },
      end(chunk) {
        if (typeof chunk !== 'undefined') {
          this.write(chunk);
        }
        this.headersSent = true;
        this.writableEnded = true;
        resolve({
          status,
          headers,
          body: Buffer.concat(chunks).toString('utf8')
        });
      }
    });

    Promise.resolve(handleRequest(req, res)).catch(reject);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Static SEO headers', () => {
  it('adds the required headers for HTML pages', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/about/'
      });

      expect(result.status).toBe(200);
      expect(result.headers['Content-Type']).toBe('text/html; charset=utf-8');
      expect(result.headers['Content-Language']).toBe('ar-SA');
      expect(result.headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains; preload');
      expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result.headers['X-Frame-Options']).toBe('SAMEORIGIN');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('serves sitemap.xml with XML content type and cache header', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/sitemap.xml'
      });

      expect(result.status).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/xml; charset=utf-8');
      expect(result.headers['Cache-Control']).toBe('public, max-age=3600');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('serves robots.txt with text content type and cache header', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/robots.txt'
      });

      expect(result.status).toBe(200);
      expect(result.headers['Content-Type']).toBe('text/plain; charset=utf-8');
      expect(result.headers['Cache-Control']).toBe('public, max-age=86400');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('blocks sensitive file extensions with 403 and noindex', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/.env'
      });

      expect(result.status).toBe(403);
      expect(result.headers['X-Robots-Tag']).toBe('noindex, nofollow');
      expect(result.body).toContain('403 Forbidden');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('returns a real 404 page with noindex header', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/'
      });

      expect(result.status).toBe(404);
      expect(result.headers['X-Robots-Tag']).toBe('noindex');
      expect(result.headers['Content-Type']).toBe('text/html; charset=utf-8');
      expect(result.headers['Content-Language']).toBe('ar-SA');
    } finally {
      runtime.restoreEnv();
    }
  });
});
