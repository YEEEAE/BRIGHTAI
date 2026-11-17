// Synthetic command payloads only. Never loads gtag.js or contacts GA4.
import { fixtures, page, inlineSnippet, executeSnippet } from '../tests/helpers/ga4-attribution.mjs';
console.log(JSON.stringify({
  scope: 'Offline expected gtag commands; not SDK transport or GA4 ingestion',
  rows: fixtures.map(([name, referrer, expectedReferrer]) => ({ name, expectedReferrer,
    calls: executeSnippet(inlineSnippet(), page, referrer, 2).filter(call => call[0] === 'config'),
  })),
}, null, 2));
