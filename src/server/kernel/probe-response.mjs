const PROBE_HEADERS = Object.freeze({
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
});

export function probeResponse(method, status, body, extraHeaders = {}) {
  return new Response(method === 'HEAD' ? null : JSON.stringify(body), {
    status,
    headers: { ...PROBE_HEADERS, 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export function methodNotAllowed() {
  return probeResponse('GET', 405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET, HEAD' });
}
