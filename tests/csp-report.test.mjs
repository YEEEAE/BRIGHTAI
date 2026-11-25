import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { applySecurityPolicy } from '../src/server/observability/security-policy.mjs';
import { receiveCspReport, cspReportCounts } from '../src/server/observability/csp-report.mjs';
import { GA4_INLINE_SOURCE } from '../cloudflare/workers/ga4-injector/index.mjs';

test('enforced policy allows the exact edge bootstrap bytes', () => {
  const headers = new Headers();
  applySecurityPolicy(headers, false);
  const hash = createHash('sha256').update(GA4_INLINE_SOURCE).digest('base64');
  assert.ok(headers.get('Content-Security-Policy').includes(`'sha256-${hash}'`));
});

test('retains only allowlisted aggregate counts and throttles intake', async t => {
  t.mock.method(Date, 'now', () => 120_000);
  const report = () => new Request('https://fixture.test/api/security/csp-report/?token=synthetic', {
    method: 'POST',
    headers: { 'content-type': 'application/csp-report' },
    body: JSON.stringify({ 'csp-report': {
      'effective-directive': 'script-src-elem',
      'document-uri': 'https://fixture.test/auth/?code=synthetic',
      'script-sample': 'synthetic',
    } }),
  });
  for (let i = 0; i < 120; i++) assert.equal((await receiveCspReport(report())).status, 204);
  assert.deepEqual(cspReportCounts(), { 'script-src-elem': 120 });
  assert.equal((await receiveCspReport(report())).status, 429);
  Date.now.mock.mockImplementation(() => 180_000);
  assert.equal((await receiveCspReport(report())).status, 204);
  assert.deepEqual(cspReportCounts(), { 'script-src-elem': 1 });
});
