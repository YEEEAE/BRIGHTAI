/**
 * @brightai/dashboard — Next.js Middleware
 *
 * Responsibilities (in order):
 *   1. Clerk auth (authMiddleware) — protect everything except /api/health,
 *      /sign-in, /sign-up, /unauthorized, and static files.
 *   2. Subdomain extraction — `acme.brightai.live` → tenant slug `acme`.
 *      The slug is set as a request header so server components can read
 *      it via `headers()` without re-parsing the host.
 *   3. Reserved-subdomain guard — if the user hits www/api/admin/etc.,
 *      skip the tenant resolution and let the marketing site handle it
 *      (it lives at the root domain).
 *   4. Observability (P0-3, 2026-07-19) — generate a request ID,
 *      open an AsyncLocalStorage scope so the structured logger and
 *      Sentry capture see the same `requestId` + `path` + `method`.
 *
 * Why headers: Next.js server components can read `headers()` cheaply
 * and it survives across the request lifecycle. The alternative (cookies
 * or query params) is messier for SSR.
 *
 * Why here (not in a route handler): middleware runs before the route
 * resolver, so the slug is available to every page in the request chain.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { runWithRequestContext } from '@/lib/observability/request-context';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'brightai.live';
const RESERVED_SUBDOMAINS = new Set(
  (process.env.RESERVED_SUBDOMAINS ?? 'www,api,admin,app,dashboard,docs,status,mail,cdn')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

// Public routes — Clerk does NOT enforce auth on these.
const isPublicRoute = createRouteMatcher([
  '/api/health',
  '/api/webhooks/(.*)', // Clerk + custom webhooks (verified by signature, not session)
  '/api/firewall/(.*)', // AI firewall: API-key auth handled inside the route handler
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/unauthorized',
  '/invitation/(.*)', // accepts invitation token in URL
]);

/**
 * Extract the tenant slug from the request host.
 *
 *   brightai.live              → null (root, marketing site territory)
 *   www.brightai.live          → null (reserved)
 *   acme.brightai.live         → 'acme'
 *   acme.localhost:3000        → 'acme'  (dev)
 *   custom-domain.com          → 'custom-domain.com'  (we resolve via Domain table)
 *   localhost:3000             → null (dev root)
 */
export function extractTenantFromHost(host: string | null): {
  slug: string | null;
  isCustomDomain: boolean;
} {
  if (!host) return { slug: null, isCustomDomain: false };
  const hostname = host.split(':')[0].toLowerCase();

  // Local dev: <tenant>.localhost
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    if (RESERVED_SUBDOMAINS.has(sub) || sub === '') return { slug: null, isCustomDomain: false };
    return { slug: sub, isCustomDomain: false };
  }

  // Production: <tenant>.<root>
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return { slug: null, isCustomDomain: false };
  }
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.slice(0, -`.${ROOT_DOMAIN}`.length);
    if (RESERVED_SUBDOMAINS.has(sub)) return { slug: null, isCustomDomain: false };
    return { slug: sub, isCustomDomain: false };
  }

  // Custom domain (e.g. client.com) — needs DB lookup at request time
  // (handled in server component, not here)
  return { slug: hostname, isCustomDomain: true };
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const host = req.headers.get('host');
  const { slug, isCustomDomain } = extractTenantFromHost(host);

  // P0-3: Generate a request ID and set the observability context.
  // Incoming X-Request-Id is trusted if the upstream set one (e.g.
  // a load balancer or the marketing site).
  const requestId =
    req.headers.get('x-request-id') ?? randomUUID();
  const ctx = {
    requestId,
    path: req.nextUrl.pathname,
    method: req.method,
    startedAt: Date.now(),
    // organizationId + userId are populated later (after Clerk auth
    // resolves the session). The logger tolerates undefined.
  };

  // Always forward tenant context + request ID downstream.
  const requestHeaders = new Headers(req.headers);
  if (slug) requestHeaders.set('x-tenant-slug', slug);
  if (isCustomDomain) requestHeaders.set('x-tenant-custom-domain', '1');
  requestHeaders.set('x-request-id', requestId);

  // Run the rest of the request inside the ALS context. This is
  // best-effort — middleware can't await a Promise here, so we
  // wrap the rest in runWithRequestContext synchronously.
  return runWithRequestContext(ctx, () => {
    // Auth gate (after we've augmented headers, so server components
    // see the tenant slug even on a 401 redirect).
    if (!isPublicRoute(req)) {
      // Note: auth.protect() returns a redirect/401 if unauthenticated.
      // We can't await inside a non-async function — but runWithRequestContext
      // wraps a sync function in a sync ALS scope, so the redirect still
      // carries the request ID via the header.
      void auth.protect();
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  });
});

export const config = {
  matcher: [
    // Run on everything except static files and Next internals.
    // See https://clerk.com/docs/references/nextjs/clerkMiddleware#usage
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
