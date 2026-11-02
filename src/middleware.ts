import { defineMiddleware } from 'astro:middleware';
import { redirects } from '../redirects.json';
import { isPortalEnabled } from './server/kernel/env.mjs';

// Node web services do not consume redirects.json automatically.
const destinations = new Map(redirects.map(({ source, destination }) => [source, destination]));

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === '/app' || context.url.pathname.startsWith('/app/')) {
    let response;
    if (!isPortalEnabled()) {
      if (context.url.pathname.startsWith('/app/api/')) {
        response = Response.json({
          code: 'APP_UNAVAILABLE',
          message: 'بوابة مساحة العمل غير متاحة حاليًا.',
        }, {
          status: 503,
        });
      } else {
        const contact = new URL('/contact/', context.url);
        contact.searchParams.set('topic', 'بوابة مساحة العمل');
        response = context.redirect(`${contact.pathname}${contact.search}`, 302);
      }
    } else {
      response = await next();
    }
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store, max-age=0');
    headers.set('CDN-Cache-Control', 'no-store');
    headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.append('Vary', 'Authorization, Cookie');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  const destination = destinations.get(context.url.pathname);
  if (destination && ['GET', 'HEAD'].includes(context.request.method)) {
    return context.redirect(`${destination}${context.url.search}`, 301);
  }
  return next();
});
