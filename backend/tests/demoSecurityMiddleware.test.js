import { describe, expect, it } from 'vitest';
import corsModule from '../middleware/demoCors.js';
import securityModule from '../middleware/demoSecurityHeaders.js';

const { demoCors, DEFAULT_ALLOWED_ORIGINS } = corsModule;
const { demoSecurityHeaders } = securityModule;

function createResponse() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    end() {
      this.ended = true;
    }
  };
}

describe('demo cors middleware', () => {
  it('allows only production BrightAI origins', () => {
    expect([...DEFAULT_ALLOWED_ORIGINS]).toEqual([
      'https://brightai.site',
      'https://www.brightai.site'
    ]);
  });

  it('sets the required cors policy for allowed origins', () => {
    const res = createResponse();
    demoCors({
      method: 'OPTIONS',
      headers: { origin: 'https://brightai.site' }
    }, res, () => {});

    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://brightai.site');
    expect(res.headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    expect(res.headers['Access-Control-Allow-Headers']).toBe('Content-Type, X-Demo-Client, X-Request-Id');
    expect(res.headers['Access-Control-Max-Age']).toBe('86400');
    expect(res.headers['Access-Control-Allow-Credentials']).toBeUndefined();
  });

  it('does not emit wildcard or local origins', () => {
    const res = createResponse();
    demoCors({
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:3000' }
    }, res, () => {});

    expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

describe('demo security headers middleware', () => {
  it('sets required security headers', () => {
    const res = createResponse();
    let nextCalled = false;
    demoSecurityHeaders({}, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res.headers['Content-Security-Policy']).toContain("default-src 'none'");
    expect(res.headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(res.headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(res.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
  });
});
