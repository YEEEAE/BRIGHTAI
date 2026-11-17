import { applySecurityPolicy } from './server/observability/security-policy.mjs';
import { defineMiddleware } from 'astro:middleware';
import { redirects } from '../redirects.json';
import { env, isPortalEnabled } from './server/kernel/env.mjs';
import { portalUnavailableJson, portalUnavailablePage } from './server/kernel/unavailable.mjs';
import { captureServerFailure } from './server/observability/index.mjs';

// Node web services do not consume redirects.json automatically.
const destinations = new Map(redirects.map(({ source, destination }) => [source, destination]));

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

// Baseline response hardening. The framing/navigation baseline and the private
// cache/indexing headers are enforced; the full script/connect policy is defined
// here and promoted from report-only only after an authorized browser check.
function harden(response: Response, options: { portal: boolean; secureTransport: boolean }) {
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', options.portal ? 'DENY' : 'SAMEORIGIN');
  applySecurityPolicy(headers, options.portal);
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  headers.set('Referrer-Policy', options.portal ? 'no-referrer' : 'strict-origin-when-cross-origin');
  // Private and public responses alike must not be read as a cross-origin document.
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  // TLS terminates in front of the Node service; send HSTS only for confirmed HTTPS.
  if (options.secureTransport) headers.set('Strict-Transport-Security', 'max-age=15552000');

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
    return harden(response, { portal: true, secureTransport });
  }

  // Page aliases and the conventional /sitemap.xml entry share redirects.json.
  let decodedPath = path;
  try { decodedPath = decodeURIComponent(path); } catch { /* Keep malformed paths unmatched. */ }
  const destination = destinations.get(path)
    ?? destinations.get(decodedPath)
    ?? destinations.get(decodedPath.replace(/\/$/, ''))
    ?? destinations.get(normalizedPath)
    ?? destinations.get(normalizedPath.replace(/\/$/, ''));
  const response = destination && ['GET', 'HEAD'].includes(context.request.method)
    ? context.redirect(`${destination}${context.url.search}`, 301)
    : await next();
  const authPage = normalizedPath === '/auth' || normalizedPath.startsWith('/auth/');
  if (['/404', '/404/', '/404.html'].includes(normalizedPath)) {
    return harden(new Response(response.body, { status: 404, headers: response.headers }), { portal: authPage, secureTransport });
  }
  return harden(response, { portal: authPage, secureTransport });
});
