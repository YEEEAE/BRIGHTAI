// Response for a disabled AIGAS workspace portal.
// The gate must answer from the server itself: no redirect to a public page,
// no fallthrough to static generation, and no CDN-cacheable body.

export const PORTAL_UNAVAILABLE_CODE = 'APP_UNAVAILABLE';
export const PORTAL_UNAVAILABLE_MESSAGE = 'بوابة مساحة العمل غير متاحة حاليًا.';
const RETRY_AFTER_SECONDS = 3600;

// Fixed markup: no request data is interpolated, so no escaping is required here.
const PAGE = `<!doctype html>
<html lang="ar-SA" dir="rtl">
<head>
<script is:inline>
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());
      // Mirrors src/server/observability/url-policy.mjs: allowlist, not a filter
      // that forwards whatever is left. Unknown query keys and the whole
      // fragment are dropped; an unknown referrer host becomes an explicit
      // empty page_referrer instead of falling back to document.referrer.
      const analyticsQueryAllowlist = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      const analyticsReferrerHosts = ['brightai.live', 'www.brightai.live'];
      // Private surfaces collapse to a section root: an auth callback code,
      // invitation token or record id can sit in a path segment, not only in
      // the query string. Public paths are forwarded only while short and plain.
      function analyticsPath(pathname) {
        if (typeof pathname !== 'string' || pathname.charAt(0) !== '/') return '/';
        if (pathname === '/auth' || pathname.indexOf('/auth/') === 0) return '/auth/';
        if (pathname === '/app' || pathname.indexOf('/app/') === 0) return '/app/';
        if (pathname === '/api' || pathname.indexOf('/api/') === 0) return '/api/';
        return pathname.length <= 200 && /^\\/[A-Za-z0-9\\-._~\\/]*$/.test(pathname) ? pathname : '/';
      }
      function analyticsUrl(value, base) {
        try {
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
          const url = new URL(value);
          if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
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
      analyticsPage.page_title = /^\\/(app|auth)(\\/|$)/.test(window.location.pathname) ? 'BRIGHTAI' : document.title;
      gtag('config', 'G-9LMB4PGTWJ', analyticsPage);
    </script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9LMB4PGTWJ"></script>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>البوابة غير متاحة مؤقتًا | BRIGHTAI</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-block-size:100vh;display:grid;place-items:center;padding:24px;background:#05070c;color:#e8ecf5;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;line-height:1.8}
main{inline-size:min(560px,100%);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:32px;background:rgba(255,255,255,.03)}
p{color:#a9b2c4;margin:0 0 14px}
.overline{margin:0 0 8px;font-size:12px;letter-spacing:.14em;color:#8b93a6}
h1{margin:0 0 12px;font-size:clamp(22px,4vw,30px);line-height:1.35}
code{direction:ltr;unicode-bidi:isolate;font-family:ui-monospace,monospace;font-size:13px;border:1px solid rgba(255,255,255,.16);border-radius:6px;padding:1px 6px}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-block-start:22px}
a{display:inline-flex;align-items:center;min-block-size:44px;padding:0 18px;border-radius:999px;text-decoration:none;font-weight:600}
a.primary{background:#7c5cff;color:#fff}
a.ghost{border:1px solid rgba(255,255,255,.22);color:#e8ecf5}
a:focus-visible{outline:3px solid #f5b544;outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>
<main>
<p class="overline">AIGAS / WORKSPACE GATE</p>
<h1>بوابة مساحة العمل غير متاحة مؤقتًا</h1>
<p>لم تُفعّل بوابة مساحة العمل على هذا التشغيل بعد، أو أُغلقت إداريًا. لا نعرض أي بيانات مؤسسة أو محتوى خاص في هذه الحالة.</p>
<p>الرمز: <code>APP_UNAVAILABLE</code> · الحالة: <code>503</code></p>
<p>إذا وصلك هذا الرابط من فريق BRIGHT AI، تواصل معهم للتأكد من موعد الإتاحة. لا تنشئ حسابًا جديدًا لهذا الغرض.</p>
<div class="actions"><a class="primary" href="/">الموقع العام</a><a class="ghost" href="/contact/">تواصل معنا</a></div>
</main>
</body>
</html>
`;

function gateHeaders(contentType) {
  return {
    'Content-Type': contentType,
    // Private gate responses must never be stored by a browser, proxy or CDN.
    'Cache-Control': 'private, no-store, max-age=0',
    'CDN-Cache-Control': 'no-store',
    'Cloudflare-CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Retry-After': String(RETRY_AFTER_SECONDS),
  };
}

export function portalUnavailableJson() {
  return new Response(JSON.stringify({
    code: PORTAL_UNAVAILABLE_CODE,
    message: PORTAL_UNAVAILABLE_MESSAGE,
  }), {
    status: 503,
    headers: gateHeaders('application/json; charset=utf-8'),
  });
}

export function portalUnavailablePage(request) {
  const body = request?.method === 'HEAD' ? null : PAGE;
  return new Response(body, {
    status: 503,
    headers: gateHeaders('text/html; charset=utf-8'),
  });
}
