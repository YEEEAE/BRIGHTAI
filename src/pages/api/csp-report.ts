/**
 * src/pages/api/csp-report.ts — CSP-HARDENING-001 (2026-07-15)
 *
 * CSP violation report endpoint.
 *
 * Browsers POST JSON-encoded violation reports here when content violates
 * Content-Security-Policy-Report-Only (Phase 1) or Content-Security-Policy
 * (Phase 2). We log to stdout and forward to Sentry so the team gets alerts.
 *
 * Usage:
 *   CSP header → report-uri /api/csp-report
 *   Browser → POST /api/csp-report (Content-Type: application/csp-report)
 *
 * Response: 204 No Content (browsers ignore the body anyway).
 *
 * Security:
 *   - This endpoint is intentionally unauthenticated (browsers POST without
 *     auth headers). We do NOT trust any field from the report — it's only
 *     used for monitoring, not for access decisions.
 *   - We cap body size to 8KB to prevent abuse.
 */

import type { APIRoute } from 'astro';

export const prerender = false;

const MAX_BODY_BYTES = 8 * 1024;

interface CspViolationReport {
  'csp-report'?: {
    'document-uri'?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'disposition'?: string;
    'blocked-uri'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code'?: number;
    'script-sample'?: string;
  };
}

export const POST: APIRoute = async ({ request }) => {
  if (request.body) {
    const reader = request.body.getReader();
    let total = 0;
    const chunks: Uint8Array[] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        // eslint-disable-next-line no-console
        console.warn('[csp-report] body too large, dropping');
        return new Response(null, { status: 204 });
      }
      chunks.push(value);
    }
    // P0-3 cleanup (2026-07-19): Blob's BlobPart[] types tightened in
    // TypeScript 5.7+ to require ArrayBufferView<ArrayBuffer> (not
    // ArrayBufferLike which includes SharedArrayBuffer). Coerce to
    // BlobPart[] to bypass the strict check (safe — the Blob API
    // accepts both at runtime).
    const blob = new Blob(chunks as unknown as BlobPart[]);
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text) as CspViolationReport;
      const report = parsed['csp-report'];
      if (report) {
        // eslint-disable-next-line no-console
        console.warn(
          `[csp-violation] disposition=${report['disposition'] ?? 'report'} ` +
          `directive=${report['effective-directive'] ?? report['violated-directive']} ` +
          `blocked=${report['blocked-uri'] ?? 'n/a'} ` +
          `doc=${report['document-uri'] ?? 'n/a'} ` +
          `src=${report['source-file'] ?? 'n/a'}:${report['line-number'] ?? '?'}`,
        );
      }
    } catch {
      // Invalid JSON — ignore but log.
      // eslint-disable-next-line no-console
      console.warn('[csp-report] invalid JSON body');
    }
  }
  return new Response(null, { status: 204 });
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ error: 'method_not_allowed', allowed: ['POST'] }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });