import { defineMiddleware } from 'astro:middleware';
import { redirects } from '../redirects.json';

// Node web services do not consume redirects.json automatically.
const destinations = new Map(redirects.map(({ source, destination }) => [source, destination]));

export const onRequest = defineMiddleware((context, next) => {
  const destination = destinations.get(context.url.pathname);
  if (destination && ['GET', 'HEAD'].includes(context.request.method)) {
    return context.redirect(`${destination}${context.url.search}`, 301);
  }
  return next();
});
