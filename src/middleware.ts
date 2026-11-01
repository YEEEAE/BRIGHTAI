import { defineMiddleware } from 'astro:middleware';
import { redirects } from '../redirects.json';

// Node web services do not consume redirects.json automatically.
const destinations = new Map(redirects.map(({ source, destination }) => [source, destination]));

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === '/app' || context.url.pathname.startsWith('/app/')) {
    const response = await next();
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
