import { Readable, Writable } from 'node:stream';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import demoAppModule from '../demoGeminiApp.js';
import rateLimitModule from '../middleware/demoRateLimiter.js';

const { createDemoGeminiApp } = demoAppModule;
const { canHandleDemoGeminiRoute } = demoAppModule;
const { resetDemoRateLimiter } = rateLimitModule;

async function postJson(path, body) {
  const app = createDemoGeminiApp();
  const rawBody = JSON.stringify(body);
  const req = Readable.from([Buffer.from(rawBody)]);
  req.method = 'POST';
  req.url = path;
  req.headers = {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(rawBody),
    origin: 'http://localhost:5173'
  };
  req.socket = { remoteAddress: `127.0.0.${Math.floor(Math.random() * 200) + 1}` };

  const chunks = [];
  const headers = {};
  const res = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  res.statusCode = 200;
  res.headersSent = false;
  res.setHeader = (name, value) => { headers[name.toLowerCase()] = String(value); };
  res.getHeader = name => headers[name.toLowerCase()];
  res.removeHeader = name => { delete headers[name.toLowerCase()]; };
  res.writeHead = (status, nextHeaders = {}) => {
    res.statusCode = status;
    Object.entries(nextHeaders).forEach(([name, value]) => res.setHeader(name, value));
    res.headersSent = true;
  };
  res.write = chunk => {
    if (chunk) chunks.push(Buffer.from(chunk));
    return true;
  };
  const originalEnd = res.end.bind(res);
  res.end = (chunk, encoding, callback) => {
    if (chunk) chunks.push(Buffer.from(chunk));
    res.headersSent = true;
    return originalEnd(null, encoding, callback);
  };

  await new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    app(req, res);
  });

  return {
    status: res.statusCode,
    headers,
    text: Buffer.concat(chunks).toString('utf8')
  };
}

async function postMultipart(path, { demoType, input, filename, mimeType, fileBuffer }) {
  const app = createDemoGeminiApp();
  const boundary = `----brightai-test-${Date.now()}`;
  const parts = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="demoType"\r\n\r\n${demoType}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="input"\r\n\r\n${JSON.stringify(input)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    Buffer.from(fileBuffer),
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ];
  const rawBody = Buffer.concat(parts);
  const req = Readable.from([rawBody]);
  req.method = 'POST';
  req.url = path;
  req.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': rawBody.length,
    origin: 'http://localhost:5173'
  };
  req.socket = { remoteAddress: `127.0.1.${Math.floor(Math.random() * 200) + 1}` };

  const chunks = [];
  const headers = {};
  const res = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  res.statusCode = 200;
  res.headersSent = false;
  res.setHeader = (name, value) => { headers[name.toLowerCase()] = String(value); };
  res.getHeader = name => headers[name.toLowerCase()];
  res.removeHeader = name => { delete headers[name.toLowerCase()]; };
  res.writeHead = (status, nextHeaders = {}) => {
    res.statusCode = status;
    Object.entries(nextHeaders).forEach(([name, value]) => res.setHeader(name, value));
    res.headersSent = true;
  };
  res.write = chunk => {
    if (chunk) chunks.push(Buffer.from(chunk));
    return true;
  };
  const originalEnd = res.end.bind(res);
  res.end = (chunk, encoding, callback) => {
    if (chunk) chunks.push(Buffer.from(chunk));
    res.headersSent = true;
    return originalEnd(null, encoding, callback);
  };

  await new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    app(req, res);
  });

  return {
    status: res.statusCode,
    headers,
    text: Buffer.concat(chunks).toString('utf8')
  };
}

beforeEach(async () => {
  process.env.AI_GATEWAY_MOCK_MODE = '1';
  resetDemoRateLimiter();
});

afterEach(() => {
  delete process.env.AI_GATEWAY_MOCK_MODE;
});

describe('unified demo Gemini endpoints', () => {
  it('routes demo options preflight through the demo app policy', () => {
    expect(canHandleDemoGeminiRoute('OPTIONS', '/api/demo/gemini')).toBe(true);
    expect(canHandleDemoGeminiRoute('OPTIONS', '/api/demo/gemini/stream')).toBe(true);
    expect(canHandleDemoGeminiRoute('OPTIONS', '/api/demo/gemini/file')).toBe(true);
  });

  it('runs a supported demo without exposing raw provider responses', async () => {
    const response = await postJson('/api/demo/gemini', {
      demoType: 'data-analysis',
      input: {
        scenarioId: 'sales-dashboard',
        message: 'حلل انخفاض المبيعات حسب الفروع',
        locale: 'ar-SA'
      }
    });
    const payload = JSON.parse(response.text);

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(payload.ok).toBe(true);
    expect(payload.demoType).toBe('data-analysis');
    expect(payload.model).toBe('gemini-2.5-flash');
    expect(payload.result).toBeTruthy();
    expect(payload.raw).toBeUndefined();
    expect(payload.candidates).toBeUndefined();
  });

  it('uses Gemini Pro for tenders and hospital demos', async () => {
    const response = await postJson('/api/demo/gemini', {
      demoType: 'tenders-analysis',
      input: {
        scenarioId: 'public-rfp',
        message: 'قيّم جاهزية العرض بناءً على المتطلبات العامة',
        locale: 'ar-SA'
      }
    });
    const payload = JSON.parse(response.text);

    expect(response.status).toBe(200);
    expect(payload.model).toBe('gemini-2.5-pro');
    expect(payload.result.safetyNotices.join(' ')).toContain('مراجعة قانونية');
  });

  it('streams server-sent events for supported demos', async () => {
    const response = await postJson('/api/demo/gemini/stream', {
      demoType: 'ai-agent',
      input: {
        scenarioId: 'support-agent',
        message: 'وكيل لخدمة العملاء',
        locale: 'en-SA'
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('"type":"start"');
    expect(response.text).toContain('"type":"done"');
  });

  it('accepts a smart hiring PDF upload through the unified demo backend', async () => {
    const response = await postMultipart('/api/demo/gemini/file', {
      demoType: 'smart-hiring-system',
      input: {
        scenarioId: 'project-manager',
        message: 'قيّم السيرة المرفقة لوظيفة مدير مشروع',
        locale: 'ar-SA'
      },
      filename: 'candidate.pdf',
      mimeType: 'application/pdf',
      fileBuffer: Buffer.from('%PDF-1.4 fake test pdf')
    });
    const payload = JSON.parse(response.text);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.demoType).toBe('smart-hiring-system');
    expect(payload.model).toBe('gemini-2.5-flash');
    expect(payload.file.mimeType).toBe('application/pdf');
    expect(payload.result.match_score).toBeGreaterThan(0);
    expect(payload.raw).toBeUndefined();
  });

  it('rejects unsupported file types on the smart hiring upload route', async () => {
    const response = await postMultipart('/api/demo/gemini/file', {
      demoType: 'smart-hiring-system',
      input: {
        scenarioId: 'project-manager',
        message: 'اختبار',
        locale: 'ar-SA'
      },
      filename: 'candidate.txt',
      mimeType: 'text/plain',
      fileBuffer: Buffer.from('plain text')
    });

    expect(response.status).toBe(400);
    expect(JSON.parse(response.text).ok).toBe(false);
  });
});
