/**
 * @brightai/dashboard — Tenant resolution
 *
 * Server-side helper for server components and route handlers.
 * Reads the `x-tenant-slug` header set by middleware, resolves it
 * to an Organization via the database, and returns a typed object.
 *
 * Two paths:
 *   1. Subdomain (acme.brightai.site) — slug is the organization slug
 *   2. Custom domain (client.com) — Domain table lookup
 *
 * Uses the service-role client because tenant resolution happens
 * before the user is authenticated.
 */

import 'server-only';
import { headers } from 'next/headers';
import { dbServiceRole } from '@brightai/db';
import type { Organization } from '@brightai/db';

export type TenantContext =
  | { kind: 'subdomain'; slug: string; organization: Pick<Organization, 'id' | 'slug' | 'name' | 'nameAr'> }
  | { kind: 'custom-domain'; domain: string; organization: Pick<Organization, 'id' | 'slug' | 'name' | 'nameAr'> }
  | { kind: 'root'; organization: null };

/**
 * Read the tenant from request headers (set by middleware).
 * Returns `null` for the root domain (marketing site territory).
 */
export async function getTenantFromHeaders(): Promise<TenantContext> {
  const h = await headers();
  const slug = h.get('x-tenant-slug');
  const isCustomDomain = h.get('x-tenant-custom-domain') === '1';

  if (!slug) {
    return { kind: 'root', organization: null };
  }

  if (isCustomDomain) {
    const domain = await dbServiceRole.domain.findFirst({
      where: { domain: slug, isVerified: true, deletedAt: null },
      include: {
        organization: {
          select: { id: true, slug: true, name: true, nameAr: true, deletedAt: true },
        },
      },
    });
    if (!domain || domain.organization.deletedAt) {
      return { kind: 'root', organization: null };
    }
    return {
      kind: 'custom-domain',
      domain: domain.domain,
      organization: {
        id: domain.organization.id,
        slug: domain.organization.slug,
        name: domain.organization.name,
        nameAr: domain.organization.nameAr,
      },
    };
  }

  const org = await dbServiceRole.organization.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, slug: true, name: true, nameAr: true },
  });
  if (!org) {
    return { kind: 'root', organization: null };
  }
  return { kind: 'subdomain', slug: org.slug, organization: org };
}

/**
 * Shorthand used by pages that MUST be on a tenant subdomain.
 * Throws a 404-friendly error if the request came in at the root.
 */
export async function requireTenant(): Promise<
  Extract<TenantContext, { kind: 'subdomain' | 'custom-domain' }>
> {
  const ctx = await getTenantFromHeaders();
  if (ctx.kind === 'root') {
    const err = new Error('Tenant required (this page only works on a tenant subdomain).');
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }
  return ctx;
}
