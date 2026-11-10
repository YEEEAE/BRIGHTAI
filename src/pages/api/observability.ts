import type { APIRoute } from 'astro';
import { env } from '../../server/kernel/env.mjs';
import { sentrySettings, posthogSettings } from '../../server/observability/config.mjs';
import { captureServerFailure, captureProductEvent } from '../../server/observability/index.mjs';
import { safeSection } from '../../server/observability/redact.mjs';

export const prerender = false;
const headers = { 'Cache-Control': 'private, no-store', 'CDN-Cache-Control': 'no-store', 'Cloudflare-CDN-Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
const reply = (status = 204) => new Response(null, { status, headers });
// Anonymous signals are untrusted and never evidence of an authorization
// failure. Process-wide budget stores no user/IP/cookie; not a durable WAF.
let windowEnd = 0, count = 0;
export const POST: APIRoute = async ({ request }) => {
  const errors = sentrySettings().enabled && env('AIGAS_SENTRY_BROWSER_ENABLED') === 'true';
  const analytics = posthogSettings().enabled;
  if (!errors && !analytics) return reply();
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') !== 'same-origin') return reply(403);
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply(415);
  const now = Date.now();
  if (now >= windowEnd) { windowEnd = now + 60_000; count = 0; }
  if (++count > 30) return reply(429);
  const reader = request.body?.getReader();
  if (!reader) return reply(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new Error('READ_TIMEOUT')); }, 1000); });
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > 256) { void reader.cancel().catch(() => {}); return reply(413); }
      chunks.push(value);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !['kind', 'section', 'status_code'].includes(key))) return reply(400);
    const section = safeSection(data.section);
    if (!section || section === 'public') return reply(400);
    const pathname = section === 'auth' ? '/auth/' : section === 'portal' ? '/app/' : `/app/${section}/`;
    if (data.kind === 'login_flow_result') {
      if (![200, 409].includes(data.status_code) && !(Number.isInteger(data.status_code) && data.status_code >= 400 && data.status_code <= 599)) return reply(400);
      if (analytics) void captureProductEvent('login_flow_result', { status_code: data.status_code });
      if (errors && data.status_code >= 400) void captureServerFailure(null, { surface: 'browser', code: 'CLIENT_AUTH_FAILURE', status: data.status_code, pathname });
    } else if (['client_error', 'client_rejection'].includes(data.kind) && data.status_code === undefined) {
      if (errors) void captureServerFailure(null, { surface: 'browser', code: data.kind === 'client_error' ? 'CLIENT_ERROR' : 'CLIENT_REJECTION', status: 500, pathname });
    } else return reply(400);
    return reply();
  } catch {
    return reply(400);
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
};
