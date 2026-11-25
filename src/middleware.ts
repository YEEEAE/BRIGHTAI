import { apiBoundary } from './server/api/boundary.mjs';
import { hasTrustedApiOrigin } from './server/api/origin.mjs';
import { isApiSurface, normalizePath } from './server/api/routes.mjs';
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
  const forwardedProto = context.isPrerendered
    ? undefined
    : context.request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const secureTransport = forwardedProto === 'https' || context.url.protocol === 'https:';

  if (isApiSurface(normalizedPath)) {
    const portal = isPortalPath(normalizedPath) || normalizedPath.startsWith('/auth/');
    const response = await apiBoundary(context.request, normalizedPath, () =>
      isApiPath(normalizedPath) && !isPortalEnabled() ? portalUnavailableJson() : next());
    return harden(response, { portal, secureTransport });
  }

  const method = context.request.method;
  const mediaType = context.isPrerendered
    ? undefined
    : context.request.headers.get('content-type')?.toLowerCase();
  if (!context.isPrerendered && !['GET', 'HEAD', 'OPTIONS'].includes(method)
    && (!mediaType || ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'].some(type => mediaType.includes(type)))
    && !hasTrustedApiOrigin(context.request)) {
    return harden(new Response('Cross-site form submissions are forbidden.', { status: 403 }), {
      portal: isPortalPath(normalizedPath) || normalizedPath.startsWith('/auth/'), secureTransport,
    });
  }

  if (isPortalPath(path) || isPortalPath(normalizedPath)) {
    let response: Response;
    try {
      response = isPortalEnabled() ? await next() : portalUnavailablePage(context.request);
      if (response.status >= 500 && isPortalEnabled()) {
        void captureServerFailure(null, { status: response.status, surface: 'server', pathname: normalizedPath, operation: context.request.method });
      }
    } catch (error) {
      void captureServerFailure(null, { status: 500, surface: 'server', pathname: normalizedPath, operation: context.request.method });
      throw error;
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
