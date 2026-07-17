/**
 * Auth middleware regression test — @brightai/dashboard
 *
 * Purpose:
 *   Locks down the route-protection contract after the 2026-07-17 security
 *   dependency upgrade. The advisories that motivated this upgrade were:
 *
 *     - GHSA-f82v-jwr5-mffw  Next.js Authorization Bypass in Middleware
 *       (< 15.2.3 — fixed in >=15.2.3, project now on 15.5.18).
 *     - GHSA-g5qg-72qw-gw5v  Next.js DoS via connection exhaustion,
 *       App-Router middleware bypass, and 13.0.0..<15.5.16 cluster (project
 *       now on 15.5.18).
 *     - GHSA-vqx2-fgx2-5wq9  @clerk/nextjs Middleware-based route
 *       protection bypass (< 6.39.2 — fixed in >=6.39.3, project now on 6.39.3).
 *     - GHSA-9mp4-77wg-rwx9  @clerk/nextjs organization / billing /
 *       revocation auth bypass (< 6.39.3 — fixed in >=6.39.3, project now
 *       on 6.39.3).
 *
 *   This test pins the three guarantees the upstream patches provide:
 *
 *     1. PUBLIC route enumeration is stable — protected paths must invoke
 *        `auth.protect()`. A bypass regression typically removes or weakens
 *        that call.
 *     2. ORGANIZATION / BILLING routes stay protected regardless of the
 *        surrounding public matcher logic (Clerk org bypass).
 *     3. TENANT context propagates — tenant slug must reach downstream
 *        handlers (it is the input for org-scoped data access).
 *
 * Scope:
 *   This is a regression net. It does NOT replace the upstream security
 *   audit — it ensures our wiring of @clerk/nextjs and the
 *   `isPublicRoute` matcher stays in sync with the contract those
 *   advisories protect. Keep it tight: if the middleware contract changes,
 *   update this test in the same commit.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

// ----- Stub @clerk/nextjs/server BEFORE importing the middleware -----
//
// clerkMiddleware: capture the inner handler and invoke it with a fake
//   auth context whose `.protect()` records calls. This is the regression
//   signal — a bypass typically removes the protect() invocation, so any
//   unexpected absence is a fail.
//
// createRouteMatcher: mirror Clerk's match-to-regex semantics for the
//   paths the middleware enumerates. Enough fidelity to classify static
//   paths and catch-all wildcards like "/api/webhooks/(.*)".
// Clerk pattern -> regex source.
//   Stash "(...)" groups, regex-escape the remaining path literally, then
//   splice the stashed groups back. This survives `.` in path segments while
//   honouring Clerk's `(.*)` / `(.+)` / `(\d+)` wildcards.
const RX_SPECIALS = /[.+*?^${}|\[\]\\]/g;
const STASH = '';
const pathMatchesPattern = (pathname: string, pattern: string): boolean => {
  const groups: string[] = [];
  const stashed = pattern.replace(/\(([^)]*)\)/g, (_m, inner: string) => {
    groups.push(inner);
    return `${STASH}${groups.length - 1}${STASH}`;
  });
  const escaped = stashed.replace(RX_SPECIALS, '\\$&');
  const restored = escaped.replace(
    new RegExp(`${STASH}(\\d+)${STASH}`, 'g'),
    (_m, idx: string) => groups[Number(idx)],
  );
  return new RegExp('^' + restored + '$').test(pathname);
};

let protectCalls: Array<{ pathname: string }> = [];

vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: (
    handler: (auth: { protect: () => Promise<void> }, req: NextRequest) => Promise<Response>
  ) => {
    // Next.js 15 invokes middleware with `(req, event)` — accept both,
    // ignore the second (we only assert request-derived behaviour).
    return async (req: NextRequest, _event?: unknown) =>
      handler(
        { protect: async () => { protectCalls.push({ pathname: req.nextUrl.pathname }); } },
        req
      );
  },
  createRouteMatcher: (patterns: string[]) => {
    return (req: { nextUrl: { pathname: string } }) =>
      patterns.some((p) => pathMatchesPattern(req.nextUrl.pathname, p));
  },
}));

// next/server stub — NextResponse.next() returns 200 with request headers
// reflected back, so we can inspect tenant propagation.
vi.mock('next/server', () => ({
  NextResponse: {
    next: ({ request }: { request: { headers: Headers } }) => {
      const out = new Headers();
      for (const [k, v] of request.headers.entries()) {
        // Only forward our tenant signals back. Pass-through everything else
        // is noise for this test.
        if (k.toLowerCase().startsWith('x-tenant')) out.set(k, v);
      }
      return new Response(null, { status: 200, headers: out });
    },
    json: (body: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(body), { status: init?.status ?? 200 }),
  },
}));

import { default as middlewareRaw, extractTenantFromHost } from '../../middleware';

// Next.js 15 types `middleware` as `(req, event) => Response`. Our
// stubbed Clerk `clerkMiddleware` only needs `req`, and the `event`
// arg is opaque plumbing (unused by the routes under test). Cast
// once here so the per-call sites stay readable.
type Middleware = (req: NextRequest) => Promise<Response>;
const middleware = middlewareRaw as unknown as Middleware;

beforeEach(() => {
  protectCalls = [];
  // Keep Clerk env vars present — real app needs them; doesn't affect stubs.
  process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? 'test_clerk_secret_key';
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'pk_test_dummy';
});

function buildRequest(pathname: string, host: string): NextRequest {
  // Build a URL string then construct a Request; then attach `nextUrl`
  // (the property NextRequest exposes but standard Request does not).
  const url = `https://${host}${pathname}`;
  const req = new Request(url, { headers: { host } });
  // Cast through unknown — NextRequest is essentially Request + nextUrl.
  return Object.assign(req, { nextUrl: new URL(url) }) as unknown as NextRequest;
}

const PUBLIC_PATHS = [
  '/api/health',
  '/api/webhooks/clerk',
  '/api/firewall/prompt-sanitize',
  '/sign-in',
  '/sign-up',
  '/unauthorized',
  '/invitation/abc123',
];

// =========================================================================
// 1. PUBLIC ROUTE ENUMERATION (regression for Clerk / Next.js middleware
//    authorization bypass advisories)
// =========================================================================
describe('Public route enumeration (isPublicRoute matcher)', () => {
  it.each(PUBLIC_PATHS)('does not invoke auth.protect() on public path %s', async (pathname) => {
    const res = await middleware(buildRequest(pathname, 'brightai.site'));
    expect(res.status).toBe(200);
    expect(protectCalls).toHaveLength(0);
  });

  it('invokes auth.protect() on a protected dashboard route', async () => {
    const res = await middleware(buildRequest('/dashboard/overview', 'brightai.site'));
    expect(res.status).toBe(200);
    expect(protectCalls.length).toBeGreaterThanOrEqual(1);
    expect(protectCalls[0]?.pathname).toBe('/dashboard/overview');
  });

  it('still protects an organization-scoped path even with a tenant subdomain', async () => {
    // Regression for Clerk organization / billing auth bypass (GHSA-9mp4-77wg-rwx9).
    // Organization routes must NOT be silently public.
    await middleware(buildRequest('/api/organizations/org_abc/members', 'acme.brightai.site'));
    expect(protectCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('still protects the billing surface on a tenant subdomain', async () => {
    // Regression for the same Clerk auth-bypass family — covers the
    // billing / revocation attack surface documented in the upstream advisory.
    await middleware(buildRequest('/api/billing/subscription', 'acme.brightai.site'));
    expect(protectCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT silently whitelist a /api/firewall/ path that does not match the public prefix', async () => {
    // Sanity check: /api/firewall-events/something should still be protected,
    // because the public matcher is /api/firewall/(.*), not /api/firewall*.
    await middleware(buildRequest('/api/firewall-events/dump', 'brightai.site'));
    expect(protectCalls.length).toBeGreaterThanOrEqual(1);
  });
});

// =========================================================================
// 2. TENANT EXTRACTION (pure helper, no Clerk involvement)
// =========================================================================
describe('extractTenantFromHost', () => {
  it('returns null for the root domain', () => {
    expect(extractTenantFromHost('brightai.site')).toEqual({
      slug: null,
      isCustomDomain: false,
    });
  });

  it('returns null for www.brightai.site (reserved)', () => {
    expect(extractTenantFromHost('www.brightai.site')).toEqual({
      slug: null,
      isCustomDomain: false,
    });
  });

  it('extracts tenant slug from <tenant>.brightai.site', () => {
    expect(extractTenantFromHost('acme.brightai.site')).toEqual({
      slug: 'acme',
      isCustomDomain: false,
    });
  });

  it.each(['api', 'admin', 'dashboard', 'docs', 'status'])(
    'returns null for reserved subdomain %s.brightai.site',
    (r) => {
      expect(extractTenantFromHost(`${r}.brightai.site`)).toEqual({
        slug: null,
        isCustomDomain: false,
      });
    }
  );

  it('handles localhost dev subdomains', () => {
    expect(extractTenantFromHost('acme.localhost:3000')).toEqual({
      slug: 'acme',
      isCustomDomain: false,
    });
  });

  it('treats fully external hosts as custom domain candidates', () => {
    expect(extractTenantFromHost('client-corp.com')).toEqual({
      slug: 'client-corp.com',
      isCustomDomain: true,
    });
  });

  it('returns null fallback on empty host header', () => {
    expect(extractTenantFromHost(null)).toEqual({ slug: null, isCustomDomain: false });
  });
});

// =========================================================================
// 3. TENANT HEADER PROPAGATION
// =========================================================================
describe('Tenant context propagation', () => {
  it('forwards x-tenant-slug when host is a tenant subdomain', async () => {
    const res = await middleware(buildRequest('/api/health', 'acme.brightai.site'));
    expect(res.headers.get('x-tenant-slug')).toBe('acme');
    expect(res.headers.get('x-tenant-custom-domain')).toBeNull();
  });

  it('forwards x-tenant-custom-domain when host is external', async () => {
    const res = await middleware(buildRequest('/api/health', 'client-corp.com'));
    expect(res.headers.get('x-tenant-custom-domain')).toBe('1');
    expect(res.headers.get('x-tenant-slug')).toBe('client-corp.com');
  });

  it('does not forward tenant headers on the root domain', async () => {
    const res = await middleware(buildRequest('/api/health', 'brightai.site'));
    expect(res.headers.get('x-tenant-slug')).toBeNull();
    expect(res.headers.get('x-tenant-custom-domain')).toBeNull();
  });
});
