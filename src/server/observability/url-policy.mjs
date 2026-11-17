// One URL/referrer allowlist for every analytics channel that leaves this app.
//
// Contract: an analytics URL field is either an allowlisted origin + pathname
// with allowlisted query keys, or the field is omitted. There is no
// "strip a few known-bad parameters and forward the rest" branch, because a
// free query string is where tokens, invitation codes, emails and search terms
// travel. Fragments are always dropped: they never identify a server resource
// and are a common place for client-only secrets.
//
// The approved list belongs to the P21 URL privacy decision. Until that
// document exists this module is the local default. The owner approved the
// exact Google/Bing origin-only addition on 2026-11-17; other additions still
// require a named privacy decision. This is not blanket P21/legal approval.
//
// Sentry and PostHog payloads built in this directory carry no URL field at all;
// they use fixed route labels from redact.mjs. This module exists for the
// channels that do send a page URL (the public GA4 tag in BaseLayout), so both
// sides of the app answer to one policy instead of two ad-hoc filters.

export const PAGE_QUERY_ALLOWLIST = Object.freeze([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
]);

// Exact hostnames only. No wildcard, no suffix match: `evil-brightai.live`
// must not inherit the allowance of `brightai.live`.
// Owner approval in this chat (2026-11-17): origin-only Google/Bing.
// Editorial domains remain denied until separately named and approved.
export const ATTRIBUTION_HOST_ALLOWLIST = Object.freeze(['google.com', 'www.google.com', 'bing.com', 'www.bing.com']);

export const REFERRER_HOST_ALLOWLIST = Object.freeze(['brightai.live', 'www.brightai.live']);

// Campaign values stay short, printable and free of separators that could carry
// a compound payload. Anything else is dropped rather than truncated.
const QUERY_VALUE = /^[A-Za-z0-9._~-]{1,64}$/;

function parse(value, base) {
  if (typeof value !== 'string' || !value || value.length > 2048) return null;
  let url;
  try { url = new URL(value, base); } catch { return null; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  return url;
}

function bareOrigin(url) {
  return `${url.protocol}//${url.host}`;
}

// Private surfaces never forward a pathname: an auth callback code, an
// invitation token, a tenant slug or a record id can live in a path segment,
// not only in the query. They collapse to the same fixed section root that
// Sentry/PostHog already use as a route label.
const PRIVATE_PATH_ROOTS = Object.freeze([
  ['/auth', '/auth/'],
  ['/app', '/app/'],
  ['/api', '/api/'],
]);

// A public path is forwarded whole, but only while it is short, plain and free
// of percent-encoded bytes that could carry an identifier. Anything else falls
// back to the site root instead of being passed through.
export function safeAnalyticsPath(pathname) {
  if (typeof pathname !== 'string' || pathname.charAt(0) !== '/') return '/';
  for (const [root, label] of PRIVATE_PATH_ROOTS) {
    if (pathname === root || pathname.startsWith(`${root}/`)) return label;
  }
  return pathname.length <= 200 && /^\/[A-Za-z0-9\-._~/]*$/.test(pathname) ? pathname : '/';
}

// Allowed for a page location: origin + pathname + allowlisted campaign keys.
// `null` means "omit the field", never "send the raw value as a fallback".
export function safeAnalyticsUrl(value, base) {
  const url = parse(value, base);
  if (!url) return null;
  const out = new URL(`${bareOrigin(url)}${safeAnalyticsPath(url.pathname)}`);
  for (const key of PAGE_QUERY_ALLOWLIST) {
    const candidate = url.searchParams.get(key);
    if (candidate !== null && QUERY_VALUE.test(candidate)) out.searchParams.set(key, candidate);
  }
  return out.href;
}

// Referrers require absolute HTTP(S), no credentials, whitespace, backslashes
// or non-default ports. Google/Bing use origin only; internal origins retain
// the existing collapsed pathname contract. Unknown/editorial hosts are denied.
export function safeAnalyticsReferrer(value, selfOrigin) {
  if (typeof value !== 'string' || /[\\\s]/.test(value)) return null;
  const url = parse(value);
  if (!url || url.port) return null;
  if (ATTRIBUTION_HOST_ALLOWLIST.includes(url.hostname.toLowerCase())) return `${url.origin}/`;
  let self = null;
  try { self = selfOrigin ? new URL(selfOrigin) : null; } catch { self = null; }
  const sameOrigin = Boolean(self) && bareOrigin(url) === bareOrigin(self);
  if (!sameOrigin && !REFERRER_HOST_ALLOWLIST.includes(url.hostname.toLowerCase())) return null;
  return `${bareOrigin(url)}${safeAnalyticsPath(url.pathname)}`;
}

// Read-only description for tests, docs and the payload preview. It exposes the
// lists, never a value that came from a request.
export function describeUrlPolicy() {
  return {
    pageQueryAllowlist: [...PAGE_QUERY_ALLOWLIST],
    referrerHostAllowlist: [...REFERRER_HOST_ALLOWLIST],
    attributionHostAllowlist: [...ATTRIBUTION_HOST_ALLOWLIST],
    externalAttribution: 'approved exact hosts, origin only',
    privatePath: 'collapsed to /auth/, /app/ or /api/',
    fragment: 'dropped',
    unknownQuery: 'dropped',
    unknownReferrer: 'omitted (explicit empty page_referrer)',
  };
}
