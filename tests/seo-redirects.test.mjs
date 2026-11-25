import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicRedirectForRequest } from '../src/server/seo/redirects.mjs';

const { redirects } = JSON.parse(readFileSync(new URL('../redirects.json', import.meta.url), 'utf8'));
const query = '?audit=1&topic=%D8%B9%D8%B1%D8%B6';

test('every public alias returns the same 301 destination and preserves the query for GET and HEAD', () => {
  assert.equal(redirects.length, 158);
  for (const { source, destination } of redirects) {
    for (const method of ['GET', 'HEAD']) {
      assert.deepEqual(publicRedirectForRequest(method, source, query), {
        status: 301,
        location: destination + query,
      }, `${method} ${source}`);
    }
  }
});

test('the reported aliases match in raw and encoded URL path forms', () => {
  assert.deepEqual(publicRedirectForRequest('GET', '/knowledge', '?audit=1'), {
    status: 301,
    location: '/docs/?audit=1',
  });
  const arabic = '/docs/حوكمة الذكاء الاصطناعي في السعودية';
  const encodedArabic = new URL(`https://example.test${arabic}`).pathname;
  const expected = {
    status: 301,
    location: '/knowledge/ai-governance-saudi/?audit=1',
  };
  assert.deepEqual(publicRedirectForRequest('GET', arabic, '?audit=1'), expected);
  assert.deepEqual(publicRedirectForRequest('GET', encodedArabic, '?audit=1'), expected);
});

test('unsupported methods and unknown paths do not receive public redirects', () => {
  assert.equal(publicRedirectForRequest('POST', '/knowledge', '?audit=1'), undefined);
  assert.equal(publicRedirectForRequest('GET', '/not-an-alias', '?audit=1'), undefined);
});
