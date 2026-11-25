// Trust deployment configuration, never forwarding headers as an allowlist.
export function trustedApiOrigin(request) {
  const origin = new URL(request.url).origin;
  const configured = (process.env.AIGAS_API_ORIGINS ?? '').split(',').map(value => value.trim());
  const allowed = ['https://brightai.live', 'https://www.brightai.live', ...configured];
  if (allowed.includes(origin)) return origin;
  const url = new URL(origin);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const bind = process.env.HOST;
  const local = process.env.NODE_ENV !== 'production'
    || (['127.0.0.1', '::1'].includes(bind) && (url.port || (url.protocol === 'https:' ? '443' : '80')) === process.env.PORT);
  return loopback && local ? origin : null;
}

export function hasTrustedApiOrigin(request) {
  const expected = trustedApiOrigin(request);
  return expected !== null && request.headers.get('Origin') === expected;
}
