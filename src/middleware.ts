import { defineMiddleware } from 'astro:middleware';
import { redirects } from '../redirects.json';
import { isPortalEnabled } from './server/kernel/env.mjs';

// Node web services do not consume redirects.json automatically.
const destinations = new Map(redirects.map(({ source, destination }) => [source, destination]));

function addVary(headers: Headers, value: string) {
  if (headers.get('Vary') === '*') return;
  const tokens = new Set((headers.get('Vary') ?? '').split(',').map(token => token.trim()).filter(Boolean));
  for (const token of value.split(',')) tokens.add(token.trim());
  headers.set('Vary', [...tokens].join(', '));
}

// Baseline response hardening. CSP here only states framing so existing inline
// analytics, JSON-LD and styles keep working; it is not a full script policy.
function harden(response: Response, options: { portal: boolean; secureTransport: boolean }) {
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', options.portal ? 'DENY' : 'SAMEORIGIN');
  headers.set('Content-Security-Policy', `frame-ancestors ${options.portal ? "'none'" : "'self'"}`);
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Referrer-Policy', options.portal ? 'no-referrer' : 'strict-origin-when-cross-origin');
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
  const forwardedProto = context.request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const secureTransport = forwardedProto === 'https' || context.url.protocol === 'https:';

  if (path === '/app' || path.startsWith('/app/')) {
    let response;
    if (!isPortalEnabled()) {
      if (path.startsWith('/app/api/')) {
        response = Response.json({
          code: 'APP_UNAVAILABLE',
          message: 'بوابة مساحة العمل غير متاحة حاليًا.',
        }, {
          status: 503,
          headers: { 'Retry-After': '3600' },
        });
      } else {
        const contact = new URL('/contact/', context.url);
        contact.searchParams.set('topic', 'بوابة مساحة العمل');
        response = context.redirect(`${contact.pathname}${contact.search}`, 302);
      }
    } else {
      response = await next();
    }
    return harden(response, { portal: true, secureTransport });
  }

  const destination = destinations.get(path);
  const response = destination && ['GET', 'HEAD'].includes(context.request.method)
    ? context.redirect(`${destination}${context.url.search}`, 301)
    : await next();
  return harden(response, { portal: false, secureTransport });
});
