import { cspReportBodySchema } from '../api/request-schemas.mjs';
const MAX_BYTES = 8192;
const MAX_PER_MINUTE = 120;
const DIRECTIVES = new Set([
  'default-src', 'base-uri', 'form-action', 'object-src',
  'script-src', 'script-src-elem', 'script-src-attr',
  'style-src', 'style-src-elem', 'style-src-attr',
  'img-src', 'font-src', 'connect-src', 'frame-src', 'frame-ancestors',
]);
let minute = -1;
let requests = 0;
const counts = new Map();

function reply(status) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Only bounded aggregate counts leave this function. Reports are untrusted and
// can include full document URLs, referrers, blocked URLs and script samples.
export function cspReportCounts() {
  return Object.fromEntries(counts);
}

export async function receiveCspReport(request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return reply(403);
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/csp-report') return reply(415);
  if (!request.body) return reply(400);
  if (Number(request.headers.get('content-length')) > MAX_BYTES) return reply(413);

  const now = Math.floor(Date.now() / 60_000);
  if (now !== minute) {
    minute = now;
    requests = 0;
    counts.clear();
  }
  if (requests >= MAX_PER_MINUTE) return reply(429);
  requests++;

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, 2000);
  let size = 0;
  let body = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        void reader.cancel().catch(() => {});
        return reply(413);
      }
      body += decoder.decode(value, { stream: true });
    }
    if (timedOut) return reply(408);
    const parsed = cspReportBodySchema.safeParse(JSON.parse(body + decoder.decode()));
    if (!parsed.success) return reply(400);
    const directive = parsed.data['csp-report']['effective-directive'];
    if (!DIRECTIVES.has(directive)) return reply(400);
    if (minute === now) counts.set(directive, (counts.get(directive) ?? 0) + 1);
    return reply(204);
  } catch {
    void reader.cancel().catch(() => {});
    return reply(400);
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
}
