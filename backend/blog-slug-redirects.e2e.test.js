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

    const req = {
      method,
      url,
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const res = {
      headersSent: false,
      writeHead(code, nextHeaders = {}) {
        status = code;
        Object.assign(headers, nextHeaders);
        this.headersSent = true;
      },
      end() {
        this.headersSent = true;
        resolve({ status, headers });
      }
    };

    Promise.resolve(handleRequest(req, res)).catch(reject);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Legacy Arabic blog redirects', () => {
  it('redirects legacy slug with trailing slash to the hyphenated canonical path', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/blog/%D8%A3%D8%AA%D9%85%D8%AA%D8%A9%20%D8%A7%D9%84%D8%B0%D9%83%D8%A7%D8%A1%20%D8%A7%D9%84%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A_%20%D8%AD%D9%84%D9%88%D9%84%20%D9%85%D8%AE%D8%B5%D8%B5%D8%A9%20%D9%84%D8%AA%D8%AD%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%D8%B9%20%D9%88%D8%AA%D8%AD%D8%B3%D9%8A%D9%86%20%D9%85%D8%AD%D8%B1%D9%83%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A8%D8%AD%D8%AB%20(1)/'
      });

      expect(result.status).toBe(301);
      expect(result.headers.Location).toBe(
        '/blog/ai-automation-project-analysis/'
      );
    } finally {
      runtime.restoreEnv();
    }
  });

  it('redirects legacy html slug and preserves query parameters', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/blog/%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B0%D9%83%D8%A7%D8%A1%20%D8%A7%D9%84%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A_%20%D9%83%D9%8A%D9%81%20%D8%AA%D8%B3%D9%87%D9%85%20%D9%81%D9%8A%20%D8%AA%D8%AD%D9%82%D9%8A%D9%82%20%D8%A7%D9%84%D8%AA%D8%AD%D9%88%D9%84%20%D8%A7%D9%84%D8%B1%D9%82%D9%85%D9%8A%20%D9%84%D9%84%D8%B4%D8%B1%D9%83%D8%A7%D8%AA.html?ref=test'
      });

      expect(result.status).toBe(301);
      expect(result.headers.Location).toBe(
        '/blog/choose-ai-company-saudi/?ref=test'
      );
    } finally {
      runtime.restoreEnv();
    }
  });

  it('redirects unsafe Arabic filename slugs directly to the English canonical path', async () => {
    const runtime = await loadHandleRequest();

    try {
      const result = await invokeHandleRequest(runtime.handleRequest, {
        url: '/blog/%D8%AA%D8%AD%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA.html?ref=test'
      });

      expect(result.status).toBe(301);
      expect(result.headers.Location).toBe('/blog/data-analysis-decision-making/?ref=test');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('serves folder-based blog routes and redirects aliases to the slash path', async () => {
    const runtime = await loadHandleRequest();

    try {
      const cleanPath = await invokeHandleRequest(runtime.handleRequest, {
        method: 'HEAD',
        url: '/blog/ai-marketing-guide'
      });
      const slashPath = await invokeHandleRequest(runtime.handleRequest, {
        method: 'HEAD',
        url: '/blog/ai-marketing-guide/'
      });
      const htmlAlias = await invokeHandleRequest(runtime.handleRequest, {
        url: '/blog/ai-marketing-guide.html'
      });

      expect(cleanPath.status).toBe(301);
      expect(cleanPath.headers.Location).toBe('/blog/ai-marketing-guide/');
      expect(slashPath.status).toBe(200);
      expect(htmlAlias.status).toBe(301);
      expect(htmlAlias.headers.Location).toBe('/blog/ai-marketing-guide/');
    } finally {
      runtime.restoreEnv();
    }
  });
});
