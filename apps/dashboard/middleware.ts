/**
 * @brightai/dashboard — Next.js Middleware
 *
 * Responsibilities (in order):
 *   1. Clerk auth (authMiddleware) — protect everything except /api/health,
 *      /sign-in, /sign-up, /unauthorized, and static files.
 *   2. Subdomain extraction — `acme.brightai.site` → tenant slug `acme`.
 *      The slug is set as a request header so server components can read
 *      it via `headers()` without re-parsing the host.
 *   3. Reserved-subdomain guard — if the user hits www/api/admin/etc.,
 *      skip the tenant resolution and let the marketing site handle it
 *      (it lives at the root domain).
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

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'brightai.site';
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
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/unauthorized',
  '/invitation/(.*)', // accepts invitation token in URL
]);

/**
 * Extract the tenant slug from the request host.
 *
 *   brightai.site              → null (root, marketing site territory)
 *   www.brightai.site          → null (reserved)
 *   acme.brightai.site         → 'acme'
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

  // Always forward tenant context downstream.
  const requestHeaders = new Headers(req.headers);
  if (slug) requestHeaders.set('x-tenant-slug', slug);
  if (isCustomDomain) requestHeaders.set('x-tenant-custom-domain', '1');

  // Auth gate (after we've augmented headers, so server components
  // see the tenant slug even on a 401 redirect).
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
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
