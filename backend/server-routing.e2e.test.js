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
  for (const key of TRACKED_ENV_KEYS) previous[key] = process.env[key];

  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'gemini_test_key';
  process.env.GROQ_API_KEY = '';
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = '100';
  process.env.RATE_LIMIT_STORAGE = 'memory';

  vi.resetModules();
  const { handleRequest } = await import('./server.js');

  return {
    handleRequest,
    restoreEnv() {
      for (const key of TRACKED_ENV_KEYS) {
        if (typeof previous[key] === 'undefined') delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  };
}

function invokeHandleRequest(handleRequest, { method = 'GET', url }) {
  return new Promise((resolve, reject) => {
    let status = 200;
    const headers = {};
    const chunks = [];
    const req = new EventEmitter();
    Object.assign(req, {
      method,
      url,
      headers: { host: 'brightai.site' },
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    });

    const res = new EventEmitter();
    Object.assign(res, {
      headersSent: false,
      writableEnded: false,
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
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        return true;
      },
      end(chunk) {
        if (typeof chunk !== 'undefined') this.write(chunk);
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

describe('Server routing coordinator', () => {
  it('serves the site root as the static homepage', async () => {
    const runtime = await loadHandleRequest();
    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/'
      });

      expect(result.status).toBe(200);
      expect(result.headers['Content-Type']).toBe('text/html; charset=utf-8');
      expect(result.body).toContain('<html dir="rtl" lang="ar-SA">');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('serves robots.txt before API routing', async () => {
    const runtime = await loadHandleRequest();
    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/robots.txt'
      });

      expect(result.status).toBe(200);
      expect(result.headers['Content-Type']).toBe('text/plain; charset=utf-8');
      expect(result.body).toContain('User-agent: Googlebot');
      expect(result.body).toContain('Sitemap: https://brightai.site/sitemap.xml');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('serves API health with provider status unchanged', async () => {
    const runtime = await loadHandleRequest();
    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/api/health'
      });
      const payload = JSON.parse(result.body);

      expect(result.status).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(payload.status).toBe('ok');
      expect(payload.providers.gemini.configured).toBe(true);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('preserves legacy static redirects before static serving', async () => {
    const runtime = await loadHandleRequest();
    try {
      const interview = await invokeHandleRequest(runtime.handleRequest, {
        url: '/interview/index.html?source=old'
      });
      const support = await invokeHandleRequest(runtime.handleRequest, {
        url: '/interview/pages/supportAI/index.html'
      });
      const job = await invokeHandleRequest(runtime.handleRequest, {
        url: '/job.MAISco/'
      });

      expect(interview.status).toBe(301);
      expect(interview.headers.Location).toBe('/demo/smart-hiring-system/?source=old');
      expect(support.status).toBe(301);
      expect(support.headers.Location).toBe('/demo/smart-hiring-system/pages/support-ai/');
      expect(job.status).toBe(301);
      expect(job.headers.Location).toBe('/demo/smart-hiring-system/');
    } finally {
      runtime.restoreEnv();
    }
  });
});
