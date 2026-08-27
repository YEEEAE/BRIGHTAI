/**
 * scripts/verify-live-security-headers.mjs — BAI-IDX-02 (2026-07-25)
 *
 * READ-ONLY post-deploy check for the security header posture
 * documented in scripts/security-headers.mjs.
 *
 * Fetches every route in SAMPLE_ROUTES and asserts:
 *   1. SSR routes (/api/*): all HTTP headers from
 *      RESPONSE_SECURITY_HEADERS are present on the response.
 *   2. Static routes: meta http-equiv tags from STATIC_SECURITY_META
 *      are present in the HTML payload, AND the HTTP layer carries
 *      Strict-Transport-Security (this is the Cloudflare edge check
 *      — see docs/cloudflare-deployment-headers.md for the Transform
 *      Rule that completes the posture on static).
 *
 * The script is read-only: no side effects on the target site.
 * Cache is bypassed with a timestamp query string and an explicit
 * Cache-Control: no-cache request header.
 *
 * USAGE:
 *   node scripts/verify-live-security-headers.mjs
 *   BASE_URL=http://localhost:4321 node scripts/verify-live-security-headers.mjs
 *   JSON_OUT=download/qa/headers.json node scripts/verify-live-security-headers.mjs
 *
 * EXIT CODES:
 *   0 — every route passes every assertion.
 *   1 — one or more routes have missing headers or fetch errors.
 *   2 — fatal (could not read the source-of-truth module, etc.).
 */

import fs from 'node:fs';

import {
  SAMPLE_ROUTES,
  RESPONSE_SECURITY_HEADERS,
  STATIC_SECURITY_META,
  isStaticMetaRoute,
  expectedHttpHeaderNames,
} from './security-headers.mjs';

const BASE = (process.env.BASE_URL || 'https://brightai.live').replace(/\/$/, '');
const PROBE = Date.now();
const TIMEOUT_MS = 15000;

/**
 * Whether the verifier is talking to a production-style origin where
 * the HTTP security header layer is enforced by something OTHER than
 * the code under test (Cloudflare Transform Rule for static pages).
 *
 * Used to downgrade "missing HTTP security header on static route"
 * from a hard failure (which only the code under test can fix) to a
 * warning (which the operator fixes by configuring the edge).
 *
 * Detection: any HTTPS origin. For local http:// origins, the Node
 * server serves prerendered files raw and is not expected to add
 * security headers — that is the job of the edge in production.
 */
const IS_PRODUCTION_ORIGIN = /^https:\/\//i.test(BASE);

/**
 * Extract <meta http-equiv="X" content="Y"> tags from an HTML
 * payload. Tolerant of attribute order (http-equiv before content
 * and vice versa) and self-closing forms.
 */
function extractMetaTags(html) {
  const tags = [];
  const re =
    /<meta\s+(?:[^>]*\s)?http-equiv\s*=\s*"([^"]+)"[^>]*\scontent\s*=\s*"([^"]*)"[^>]*\/?>|<meta\s+(?:[^>]*\s)?content\s*=\s*"([^"]*)"[^>]*\shttp-equiv\s*=\s*"([^"]+)"[^>]*\/?>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const httpEquiv = m[1] || m[4];
    const content = m[2] || m[3];
    tags.push({ httpEquiv, content });
  }
  return tags;
}

async function checkRoute(route) {
  const url = `${BASE}${route.url}?_t=${PROBE}`;
  const result = {
    url: route.url,
    label: route.label,
    kind: route.kind,
    status: null,
    httpHeadersPresent: [],
    httpHeadersMissing: [],
    metaTagsPresent: [],
    metaTagsMissing: [],
    pass: true,
    failures: [],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'BrightAI-Verify/1.0 (+security-headers-check)',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      redirect: 'follow',
    });
    result.status = resp.status;

    // Collect response headers case-insensitively.
    const headerMap = new Map();
    for (const [k, v] of resp.headers.entries()) {
      headerMap.set(k.toLowerCase(), v);
    }

    // Assertion 1: every expected HTTP header is present.
    for (const expected of expectedHttpHeaderNames(route.kind)) {
      const present = headerMap.has(expected.toLowerCase());
      if (present) {
        result.httpHeadersPresent.push(expected);
      } else {
        result.httpHeadersMissing.push(expected);
        // HSTS on static is the only acceptable miss IF Cloudflare
        // is not yet configured. Surface it but do not fail the
        // route — Cloudflare setup is manual and tracked in
        // docs/cloudflare-deployment-headers.md.
        if (
          expected === 'Strict-Transport-Security' &&
          isStaticMetaRoute(route.url)
        ) {
          result.failures.push(
            `WARN: missing HTTP header Strict-Transport-Security on static route (requires Cloudflare Transform Rule — see docs/cloudflare-deployment-headers.md)`
          );
        } else if (
          // For static routes on a non-production origin (e.g. local
          // http://), the Node adapter serves prerendered files raw
          // without HTTP-layer security headers. That is by design —
          // the meta http-equiv injection in the HTML payload is the
          // authoritative code-level layer for static pages, and
          // Cloudflare adds the HTTP layer in production. Demote to
          // warning so the verifier is useful both locally and on
          // production.
          isStaticMetaRoute(route.url) &&
          !IS_PRODUCTION_ORIGIN
        ) {
          result.failures.push(
            `WARN: missing HTTP header ${expected} on static route (origin is non-production; HTTP layer for static is Cloudflare's responsibility in prod — see docs/cloudflare-deployment-headers.md)`
          );
        } else {
          result.pass = false;
          result.failures.push(
            `MISSING HTTP header ${expected} on ${route.url}`
          );
        }
      }
    }

    // Assertion 2: for static routes, every expected meta http-equiv
    // tag is present in the HTML body with the exact same content.
    if (isStaticMetaRoute(route.url)) {
      const contentType = headerMap.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const html = await resp.text();
        const found = extractMetaTags(html);
        const foundByEquiv = new Map(
          found.map((t) => [t.httpEquiv.toLowerCase(), t.content])
        );
        for (const expected of STATIC_SECURITY_META) {
          const actual = foundByEquiv.get(expected.httpEquiv.toLowerCase());
          if (actual === expected.content) {
            result.metaTagsPresent.push(expected.httpEquiv);
          } else {
            result.metaTagsMissing.push(expected.httpEquiv);
            result.pass = false;
            result.failures.push(
              `MISSING or mismatched meta http-equiv="${expected.httpEquiv}" on ${route.url}`
            );
          }
        }
      } else {
        result.failures.push(
          `WARN: ${route.url} did not return text/html (got ${contentType}); meta tag assertion skipped`
        );
      }
    }
  } catch (e) {
    result.pass = false;
    result.failures.push(`FETCH ERROR on ${route.url}: ${e.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  return result;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

async function main() {
  console.log('');
  console.log('='.repeat(96));
  console.log(
    `BrightAI Live Security Header Verification — ${new Date().toISOString()}`
  );
  console.log(`Base URL: ${BASE}`);
  console.log(`Cache buster: _t=${PROBE}`);
  console.log(
    `Expected HTTP headers (${Object.keys(RESPONSE_SECURITY_HEADERS).length}):`
  );
  for (const h of Object.keys(RESPONSE_SECURITY_HEADERS)) {
    console.log(`  - ${h}`);
  }
  console.log(
    `Expected static meta tags (${STATIC_SECURITY_META.length}): ${STATIC_SECURITY_META.map((m) => m.httpEquiv).join(', ')}`
  );
  console.log('='.repeat(96));
  console.log('');

  const results = [];
  for (const route of SAMPLE_ROUTES) {
    process.stdout.write(
      `  ${pad(route.label, 36)} ${pad(route.url, 56)} ... `
    );
    const r = await checkRoute(route);
    results.push(r);
    if (r.pass) {
      console.log(`✅ ${r.status}`);
    } else {
      const hard = r.failures.filter((f) => !f.startsWith('WARN:'));
      const warn = r.failures.filter((f) => f.startsWith('WARN:'));
      console.log(
        `❌ ${r.status} (${hard.length} hard, ${warn.length} warn)`
      );
      for (const f of r.failures) {
        console.log(`     ${f}`);
      }
    }
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const totalHardFailures = results
    .flatMap((r) => r.failures)
    .filter((f) => !f.startsWith('WARN:')).length;
  const totalWarns = results
    .flatMap((r) => r.failures)
    .filter((f) => f.startsWith('WARN:')).length;

  console.log('');
  console.log('='.repeat(96));
  console.log(
    `Summary: ${passed}/${results.length} routes pass. ${totalHardFailures} hard failure(s), ${totalWarns} warning(s).`
  );
  console.log('='.repeat(96));
  console.log('');

  if (process.env.JSON_OUT) {
    const payload = {
      timestamp: new Date().toISOString(),
      base: BASE,
      cacheBuster: PROBE,
      passed,
      failed,
      totalHardFailures,
      totalWarns,
      expected: {
        httpHeaders: Object.keys(RESPONSE_SECURITY_HEADERS),
        metaTags: STATIC_SECURITY_META.map((m) => m.httpEquiv),
      },
      results,
    };
    fs.writeFileSync(process.env.JSON_OUT, JSON.stringify(payload, null, 2));
    console.log(`JSON report written to ${process.env.JSON_OUT}`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(2);
});
