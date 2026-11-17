import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fixtures, page, inlineSnippet, executeSnippet } from './helpers/ga4-attribution.mjs';
import { safeAnalyticsReferrer, safeAnalyticsUrl } from '../src/server/observability/url-policy.mjs';
import { portalUnavailablePage } from '../src/server/kernel/unavailable.mjs';
const inline = inlineSnippet();
for (const [name, referrer, expected] of fixtures) {
  test(`GA4 payload: ${name}`, () => {
    const calls = executeSnippet(inline, page, referrer, 2);
    const configs = calls.filter(call => call[0] === 'config');
    assert.equal(configs.length, 1, 'repeated init cannot add another automatic page_view');
    assert.equal(calls.filter(call => call[0] === 'event' && call[1] === 'page_view').length, 0);
    assert.deepEqual(configs[0][2], {
      page_location: 'https://brightai.live/docs/?utm_source=newsletter&utm_medium=email',
      page_referrer: expected, page_title: 'Documentation',
    });
    assert.equal(safeAnalyticsReferrer(referrer, 'https://brightai.live') || '', expected);
    assert.equal(JSON.stringify(configs).includes('SYNTHETIC_SECRET'), false);
  });
}
test('UTM survives independently of missing referrer; unsafe campaign values are dropped', () => {
  assert.equal(safeAnalyticsUrl('https://brightai.live/?utm_source=google&utm_medium=cpc&utm_campaign=launch&utm_term=ai&utm_content=hero&gclid=SECRET#SECRET'),
    'https://brightai.live/?utm_source=google&utm_medium=cpc&utm_campaign=launch&utm_term=ai&utm_content=hero');
  assert.equal(safeAnalyticsUrl('https://brightai.live/?utm_source=person%40example.test&utm_campaign=' + 'a'.repeat(65)), 'https://brightai.live/');
  const call = executeSnippet(inline, 'https://brightai.live/?utm_source=google&utm_medium=cpc', '')[1];
  assert.equal(call[2].page_referrer, '');
  assert.equal(call[2].page_location, 'https://brightai.live/?utm_source=google&utm_medium=cpc');
});
test('portal gate ships the identical init; each active template has one loader', async () => {
  const html = await portalUnavailablePage().text();
  assert.equal(inlineSnippet(html), inline);
  assert.equal((html.match(/googletagmanager.com\/gtag\/js/g) || []).length, 1);
  for (const file of ['layouts/BaseLayout.astro', 'layouts/AppLayout.astro', 'pages/demo/[product].astro']) {
    const src = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8');
    assert.equal((src.match(/<GoogleAnalytics \/>/g) || []).length, 1);
    assert.doesNotMatch(src, /GoogleAnalytics 2/);
  }
});
test('direct visit without campaign invents neither campaign nor referrer', () => {
  const calls = executeSnippet(inline, 'https://brightai.live/docs/#SYNTHETIC_SECRET', '', 2);
  assert.deepEqual(calls.filter(call => call[0] === 'config').map(call => call[2]), [{
    page_location: 'https://brightai.live/docs/', page_referrer: '', page_title: 'Documentation',
  }]);
});
