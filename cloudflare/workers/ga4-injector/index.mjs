export const GA4_ID = 'G-9LMB4PGTWJ';
export const GA4_TAG_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;

// Keep this bootstrap byte-for-byte equivalent in behavior to
// src/components/GoogleAnalytics.astro. A regression test enforces parity.
export const GA4_INLINE_SOURCE = String.raw`
(function () {
      if (window.__brightaiGa4Initialized) return;
      window.__brightaiGa4Initialized = true;
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      // Mirrors src/server/observability/url-policy.mjs: allowlist, not a filter
      // that forwards whatever is left. Unknown query keys and the whole
      // fragment are dropped; an unknown referrer host becomes an explicit
      // empty page_referrer instead of falling back to document.referrer.
      const analyticsQueryAllowlist = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
      const analyticsReferrerHosts = ['brightai.live', 'www.brightai.live'];
      // Owner-approved locally 2026-11-17. Exact hosts; no wildcard/subdomains.
      const analyticsAttributionHosts = ['google.com', 'www.google.com', 'bing.com', 'www.bing.com'];
      // Private surfaces collapse to a section root: an auth callback code,
      // invitation token or record id can sit in a path segment, not only in
      // the query string. Public paths are forwarded only while short and plain.
      function analyticsPath(pathname) {
        if (typeof pathname !== 'string' || pathname.charAt(0) !== '/') return '/';
        if (pathname === '/auth' || pathname.indexOf('/auth/') === 0) return '/auth/';
        if (pathname === '/app' || pathname.indexOf('/app/') === 0) return '/app/';
        if (pathname === '/api' || pathname.indexOf('/api/') === 0) return '/api/';
        return pathname.length <= 200 && /^\/[A-Za-z0-9\-._~\/]*$/.test(pathname) ? pathname : '/';
      }
      function analyticsUrl(value, base) {
        try {
          if (typeof value !== 'string' || !value || value.length > 2048) return null;
          const url = new URL(value, base);
          if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
          const out = new URL(url.protocol + '//' + url.host + analyticsPath(url.pathname));
          for (const key of analyticsQueryAllowlist) {
            const candidate = url.searchParams.get(key);
            if (candidate !== null && /^[A-Za-z0-9._~-]{1,64}$/.test(candidate)) out.searchParams.set(key, candidate);
          }
          return out.href;
        } catch {
          return null;
        }
      }
      function analyticsReferrer(value) {
        try {
          if (typeof value !== 'string' || !value || value.length > 2048 || /[\\\s]/.test(value)) return null;
          const url = new URL(value);
          if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
          if (url.port) return null;
          if (analyticsAttributionHosts.includes(url.hostname.toLowerCase())) return url.origin + '/';
          if (url.origin !== window.location.origin && !analyticsReferrerHosts.includes(url.hostname.toLowerCase())) return null;
          return url.protocol + '//' + url.host + analyticsPath(url.pathname);
        } catch {
          return null;
        }
      }
      const analyticsPage = { page_location: analyticsUrl(window.location.href, window.location.href) || (window.location.origin + analyticsPath(window.location.pathname)) };
      // Always set the field. Omitting it lets gtag fall back to
      // document.referrer, which is exactly the unscrubbed value this policy
      // exists to drop. An empty string records "no referrer".
      analyticsPage.page_referrer = (document.referrer ? analyticsReferrer(document.referrer) : null) || '';
      analyticsPage.page_title = /^\/(app|auth)(\/|$)/.test(window.location.pathname) ? 'BRIGHTAI' : document.title;
      // One automatic page_view via config; never add a manual page_view here.
      gtag('config', 'G-9LMB4PGTWJ', analyticsPage);
      })();
`.trim();

const GA4_CONFIG_RE = /gtag\s*\(\s*['"]config['"]\s*,\s*['"]G-9LMB4PGTWJ['"]/;
const HTML_CONTENT_TYPE_RE = /^text\/html(?:\s*;|$)/i;

export function injectGa4(html) {
  const hasConfig = GA4_CONFIG_RE.test(html);
  const hasLoader = html.includes(GA4_TAG_SRC);
  const scripts = [];
  if (!hasConfig) scripts.push(`<script>${GA4_INLINE_SOURCE}</script>`);
  if (!hasLoader) scripts.push(`<script async src="${GA4_TAG_SRC}"></script>`);
  if (scripts.length === 0) return { html, changed: false, reason: 'already-covered' };

  const injection = scripts.join('\n');
  const headEnd = /<\/head\s*>/i;
  if (headEnd.test(html)) {
    return { html: html.replace(headEnd, `${injection}\n</head>`), changed: true, reason: 'head' };
  }

  const htmlOpen = /<html\b[^>]*>/i;
  if (htmlOpen.test(html)) {
    return { html: html.replace(htmlOpen, match => `${match}\n<head>\n${injection}\n</head>`), changed: true, reason: 'created-head' };
  }
  return { html, changed: false, reason: 'no-html-document' };
}

function isHtmlDocument(request, response) {
  return request.method === 'GET'
    && response.status === 200 && !request.headers.has('range')
    && Boolean(response.body)
    && HTML_CONTENT_TYPE_RE.test(response.headers.get('content-type') ?? '');
}

function withoutConditionalValidators(request) {
  const headers = new Headers(request.headers);
  headers.delete('if-none-match');
  headers.delete('if-modified-since');
  return new Request(request, { headers });
}

export async function handleRequest(request, originFetch = fetch) {
  let response = await originFetch(request);
  // Secure Chat has no analytics scripts, including on encoded path aliases.
  const pathname = new URL(request.url).pathname;
  try {
    if (/^\/+app\/+secure-chat(?:\/|$)/.test(decodeURI(pathname))) return response;
  } catch {
    return response;
  }
  const acceptsHtml = (request.headers.get('accept') ?? '').toLowerCase().includes('text/html');
  if (response.status === 304 && request.method === 'GET' && acceptsHtml) {
    response = await originFetch(withoutConditionalValidators(request));
  }
  if (!isHtmlDocument(request, response)) return response;

  const result = injectGa4(await response.clone().text());
  if (!result.changed) return response;

  const headers = new Headers(response.headers);
  for (const name of ['content-length', 'content-encoding', 'etag', 'content-md5', 'content-digest', 'accept-ranges']) {
    headers.delete(name);
  }
  return new Response(result.html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  fetch(request) {
    return handleRequest(request);
  },
};
