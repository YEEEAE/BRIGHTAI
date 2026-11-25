import { applySecurityPolicy } from './server/observability/security-policy.mjs';
import { defineMiddleware } from 'astro:middleware';
import { publicRedirectForRequest } from './server/seo/redirects.mjs';
import { env, isPortalEnabled } from './server/kernel/env.mjs';
import { portalUnavailableJson, portalUnavailablePage } from './server/kernel/unavailable.mjs';
import { captureServerFailure } from './server/observability/index.mjs';

function addVary(headers: Headers, value: string) {
  if (headers.get('Vary') === '*') return;
  const tokens = new Set((headers.get('Vary') ?? '').split(',').map(token => token.trim()).filter(Boolean));
  for (const token of value.split(',')) tokens.add(token.trim());
  headers.set('Vary', [...tokens].join(', '));
}

// Astro matches routes on a decoded pathname, while middleware receives the path as
// the adapter saw it. Without normalising here, an encoded alias such as `/%61pp/…`
// would reach an /app route while skipping the portal gate and the private no-store
// headers. Normalisation only adds matching; it never widens what the gate allows.
function normalizePath(pathname: string) {
  let decoded = pathname;
  try { decoded = decodeURI(pathname); } catch { /* Keep the raw value for malformed escapes. */ }
  const segments: string[] = [];
  for (const segment of decoded.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') { segments.pop(); continue; }
    segments.push(segment);
  }
  const trailing = decoded.length > 1 && decoded.endsWith('/') && segments.length > 0;
  return `/${segments.join('/')}${trailing ? '/' : ''}`;
}

// `/app` and everything below it is the private workspace surface.
const isPortalPath = (pathname: string) => pathname === '/app' || pathname.startsWith('/app/');
const isApiPath = (pathname: string) => pathname === '/app/api' || pathname.startsWith('/app/api/');

function harden(response: Response, options: { portal: boolean; secureTransport: boolean; confidential?: boolean }) {
  const headers = response.headers;
  applySecurityPolicy(headers, options.portal, options);

  if (options.portal) {
    // Private workspace responses must not be stored by a browser, proxy or CDN.
    headers.set('Cache-Control', 'private, no-store, max-age=0');
    headers.set('CDN-Cache-Control', 'no-store');
    headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    addVary(headers, 'Authorization, Cookie');
  }
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const normalizedPath = normalizePath(path);
  const forwardedProto = context.request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const secureTransport = forwardedProto === 'https' || context.url.protocol === 'https:';

  if (isPortalPath(path) || isPortalPath(normalizedPath)) {
    // The gate runs before any route, redirect or static asset resolution:
    // a disabled portal answers 503 here and never renders app pages or APIs.
    const isApi = isApiPath(isPortalPath(normalizedPath) ? normalizedPath : path);
    let response: Response;
    if (!isPortalEnabled()) {
      response = isApi ? portalUnavailableJson() : portalUnavailablePage(context.request);
    } else {
      try {
        response = await next();
        // API handlers report their own failures; health and page responses
        // need a fallback. Expected closed-portal 503s are never incidents.
        if (response.status >= 500 && (!isApi || /^\/app\/api\/kernel\/health\/?$/.test(normalizedPath))) {
          void captureServerFailure(null, { status: response.status, surface: 'server', pathname: normalizedPath, operation: context.request.method });
        }
      } catch (error) {
        void captureServerFailure(null, { status: 500, surface: 'server', pathname: normalizedPath, operation: context.request.method });
        // Preserve Astro's error handling without reading exception contents.
        throw error;
      }
    }
    return harden(response, { portal: true, secureTransport, confidential: isPortalEnabled() && /^\/app\/secure-chat(?:\/|$)/.test(normalizedPath) });
  }

  // Use the original request URL so dev and the Node service preserve the same query.
  const requestSearch = new URL(context.request.url).search;
  const redirect = publicRedirectForRequest(context.request.method, path, requestSearch, normalizedPath);
  const response = redirect
    ? new Response(null, { status: redirect.status, headers: { Location: redirect.location } })
    : await next();
  const authPage = normalizedPath === '/auth' || normalizedPath.startsWith('/auth/');
  if (['/404', '/404/', '/404.html'].includes(normalizedPath)) {
    return harden(new Response(response.body, { status: 404, headers: response.headers }), { portal: authPage, secureTransport });
  }
  return harden(response, { portal: authPage, secureTransport });
});
