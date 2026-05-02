import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

const TRACKED_ENV_KEYS = [
  'NODE_ENV',
  'AI_GATEWAY_MOCK_MODE',
  'GEMINI_API_KEY',
  'RATE_LIMIT_REQUESTS_PER_MINUTE',
  'RATE_LIMIT_STORAGE'
];

async function loadRuntime() {
  const previous = {};
  for (const key of TRACKED_ENV_KEYS) previous[key] = process.env[key];
  process.env.NODE_ENV = 'test';
  process.env.AI_GATEWAY_MOCK_MODE = '1';
  process.env.GEMINI_API_KEY = '';
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = '100';
  process.env.RATE_LIMIT_STORAGE = 'memory';
  vi.resetModules();
  const server = await import('./server.js');

  return {
    handleRequest: server.handleRequest,
    restoreEnv() {
      for (const key of TRACKED_ENV_KEYS) {
        if (typeof previous[key] === 'undefined') delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  };
}

function invokeRoute(handleRequest, { url, body, method = 'POST', origin = 'http://localhost:5173' }) {
  return new Promise((resolve, reject) => {
    const emitter = new EventEmitter();
    const req = {
      method,
      url,
      headers: { 'content-type': 'application/json', origin },
      socket: { remoteAddress: `127.0.0.9-${Math.random()}` },
      connection: { remoteAddress: `127.0.0.9-${Math.random()}` },
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
        if (typeof chunk !== 'undefined') chunks.push(Buffer.from(String(chunk)));
      },
      end(chunk) {
        if (typeof chunk !== 'undefined') this.write(chunk);
        this.headersSent = true;
        resolve({ status, headers, body: Buffer.concat(chunks).toString('utf8') });
      }
    };

    Promise.resolve(handleRequest(req, res)).catch(reject);
    process.nextTick(() => {
      if (method === 'POST') emitter.emit('data', Buffer.from(JSON.stringify(body || {})));
      emitter.emit('end');
    });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Demo backend foundation', () => {
  it('lists the supported demo registry entries with security headers', async () => {
    const runtime = await loadRuntime();
    try {
      const result = await invokeRoute(runtime.handleRequest, {
        method: 'GET',
        url: '/api/demo/registry'
      });
      const payload = JSON.parse(result.body);

      expect(result.status).toBe(200);
      expect(result.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
      expect(payload.demos).toHaveLength(9);
      expect(payload.demos.map(item => item.key)).toContain('smart-hospital-management');
      expect(payload.demos.map(item => item.key)).toContain('smart-medical-archive');
    } finally {
      runtime.restoreEnv();
    }
  });

  it('runs a supported demo through the unified controller contract', async () => {
    const runtime = await loadRuntime();
    try {
      const result = await invokeRoute(runtime.handleRequest, {
        url: '/api/demo/run',
        body: {
          demoKey: 'data-analysis',
          businessGoal: 'نريد معرفة أسباب انخفاض المبيعات وتحويلها إلى قرارات تنفيذية قابلة للقياس',
          industry: 'التجزئة',
          currentProcess: 'تقارير شهرية يدوية من ملفات متفرقة',
          successMetric: 'رفع معدل التحويل وتقليل وقت إعداد التقرير'
        }
      });
      const payload = JSON.parse(result.body);

      expect(result.status).toBe(200);
      expect(payload.ok).toBe(true);
      expect(payload.demoKey).toBe('data-analysis');
      expect(payload.report.executiveSummary).toBeTruthy();
      expect(payload.score).toBeGreaterThan(0);
    } finally {
      runtime.restoreEnv();
    }
  });

  it('rejects unsupported demo keys before calling the AI service', async () => {
    const runtime = await loadRuntime();
    try {
      const result = await invokeRoute(runtime.handleRequest, {
        url: '/api/demo/run',
        body: {
          demoKey: 'old-demo',
          businessGoal: 'نحتاج تجربة غير موجودة في السجل'
        }
      });
      const payload = JSON.parse(result.body);

      expect(result.status).toBe(400);
      expect(payload.ok).toBe(false);
      expect(payload.errorCode).toBe('UNSUPPORTED_DEMO');
    } finally {
      runtime.restoreEnv();
    }
  });
});
