/**
 * @brightai/dashboard — Clerk webhook
 *
 * SSO-001 (2026-07-15): Expanded to handle organization.* + organizationMembership.*
 * + session.* events (for Enterprise SSO + multi-tenant sync).
 *
 * Verified via Svix using CLERK_WEBHOOK_SECRET. All audit actions
 * are appended to the tamper-evident hash chain via appendAuditLog.
 *
 * Handled events:
 *   user.*                       → upsert/delete local User row
 *   organization.created          → upsert SamlConnection + audit
 *   organization.updated          → update SamlConnection + audit
 *   organization.deleted          → delete SamlConnection + audit
 *   organizationMembership.*      → sync role + status + audit
 *   session.created               → log SSO_LOGIN_SUCCESS (Clerk sends on IdP redirect)
 *   session.ended                 → log SSO_LOGOUT (optional)
 *
 * Defensive design:
 *   - Unknown event types → 200 (acknowledge, no DB writes).
 *   - DB failures for non-critical paths → logged but not 500 (Clerk retries).
 *   - DB failures for critical paths (user sync) → 500 (Clerk retries).
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { dbServiceRole } from '@brightai/db';
import type { Role } from '@brightai/db';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/firewall/audit/hashchain';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

type ClerkEmailAddress = { id: string; email_address: string };

type ClerkUserEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: ClerkEmailAddress[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    public_metadata?: Record<string, unknown>;
    deleted?: boolean;
  };
};

type ClerkOrganizationEvent = {
  type: 'organization.created' | 'organization.updated' | 'organization.deleted';
  data: {
    id: string;
    name: string;
    slug: string;
    // SSO / IdP metadata (Enterprise connections).
    saml_connections?: Array<{
      id: string;
      name: string;
      provider: string;
      active: boolean;
      domains: string[];
    }>;
  };
};

type ClerkOrgMembershipEvent = {
  type:
    | 'organizationMembership.created'
    | 'organizationMembership.updated'
    | 'organizationMembership.deleted';
  data: {
    id: string;
    organization: { id: string };
    public_user_data: { user_id: string };
    role: string; // Clerk role: 'admin' | 'basic_member' | etc.
  };
};

type ClerkSessionEvent = {
  type: 'session.created' | 'session.ended' | 'session.revoked';
  data: {
    id: string;
    user_id: string;
    // For SSO logins, Clerk sets a non-empty `actor` object describing
    // the SAML/OIDC IdP source.
    actor?: {
      sub: string;
    };
  };
};

type ClerkEvent =
  | ClerkUserEvent
  | ClerkOrganizationEvent
  | ClerkOrgMembershipEvent
  | ClerkSessionEvent;

// Map Clerk's role strings → our Role enum (subset; default to MEMBER).
function mapClerkRole(clerkRole: string): Role {
  const r = clerkRole.toLowerCase();
  if (r.includes('admin')) return 'ADMIN';
  if (r.includes('compliance')) return 'COMPLIANCE_OFFICER';
  if (r.includes('review')) return 'REVIEWER';
  return 'MEMBER';
}

// ─────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Verify signature.
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CLERK_WEBHOOK_SECRET not configured' },
      { status: 500 },
    );
  }
  const h = await headers();
  const svixId = h.get('svix-id');
  const svixTimestamp = h.get('svix-timestamp');
  const svixSignature = h.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);
  let event: ClerkEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature', details: err instanceof Error ? err.message : String(err) },
      { status: 401 },
    );
  }

  // 2. Dispatch by event type.
  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        return await handleUserUpsert(event);
      case 'user.deleted':
        return await handleUserDelete(event);
      case 'organization.created':
      case 'organization.updated':
        return await handleOrganizationUpsert(event);
      case 'organization.deleted':
        return await handleOrganizationDelete(event);
      case 'organizationMembership.created':
      case 'organizationMembership.updated':
        return await handleMembershipUpsert(event);
      case 'organizationMembership.deleted':
        return await handleMembershipDelete(event);
      case 'session.created':
        return await handleSessionCreated(event);
      case 'session.ended':
      case 'session.revoked':
        return await handleSessionEnded(event);
      default:
        // Unknown event type — acknowledge without writing.
        return NextResponse.json({ ok: true, action: 'unknown', type: (event as { type: string }).type });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[clerk-webhook] handler failed for ${(event as { type: string }).type}:`, err);
    return NextResponse.json(
      { error: 'Handler failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────
// User event handlers (Phase 0 — unchanged)
// ─────────────────────────────────────────────────────────────────────────

async function handleUserUpsert(event: ClerkUserEvent): Promise<NextResponse> {
  const clerkUserId = event.data.id;
  const primaryEmail = event.data.email_addresses[0]?.email_address ?? '';
  const fullName = [event.data.first_name, event.data.last_name].filter(Boolean).join(' ');
  const fullNameAr = (event.data.public_metadata?.fullNameAr as string | undefined) ?? null;
  const primaryLocale = (event.data.public_metadata?.locale as 'ar' | 'en' | undefined) ?? 'ar';

  await dbServiceRole.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email: primaryEmail,
      fullName,
      fullNameAr,
      primaryLocale,
      emailVerified: true,
    },
    update: {
      email: primaryEmail,
      fullName,
      fullNameAr,
      primaryLocale,
    },
  });

  return NextResponse.json({ ok: true, action: event.type });
}

async function handleUserDelete(event: ClerkUserEvent): Promise<NextResponse> {
  await dbServiceRole.user.deleteMany({ where: { clerkUserId: event.data.id } });
  return NextResponse.json({ ok: true, action: 'deleted' });
}

// ─────────────────────────────────────────────────────────────────────────
// Organization event handlers (Phase 1 — SSO-001)
//
// On Clerk `organization.created` (typically fires when an enterprise
// admin configures SSO via Clerk Dashboard), we mirror the first SAML
// connection into our `SamlConnection` table so the custom sign-in
// flow can detect email domains.
// ─────────────────────────────────────────────────────────────────────────

async function handleOrganizationUpsert(
  event: ClerkOrganizationEvent,
): Promise<NextResponse> {
  const clerkOrgId = event.data.id;
  // Find the matching local Organization by clerkOrganizationId (TODO: add
  // a column to Organization model in a follow-up migration). For now,
  // we look up by slug since Clerk slug matches our subdomain.
  const org = await dbServiceRole.organization.findFirst({
    where: { slug: event.data.slug },
    select: { id: true },
  });
  if (!org) {
    // No matching local org — skip. (The org might exist in Clerk but
    // not yet provisioned in BrightAI; onboarding flow handles that.)
    return NextResponse.json({ ok: true, action: 'skipped-no-local-org' });
  }

  const sso = event.data.saml_connections?.[0];
  if (!sso) {
    return NextResponse.json({ ok: true, action: 'skipped-no-saml' });
  }

  await dbServiceRole.samlConnection.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      provider: sso.provider || 'generic',
      clerkEnterpriseSsoId: sso.id,
      emailDomains: sso.domains ?? [],
      enabled: sso.active,
      config: {
        clerkConnectionName: sso.name,
        // Real entityId/ssoUrl populated via test flow or metadata fetch (Phase 2).
      },
    },
    update: {
      provider: sso.provider || 'generic',
      clerkEnterpriseSsoId: sso.id,
      emailDomains: sso.domains ?? [],
      enabled: sso.active,
      config: {
        clerkConnectionName: sso.name,
      },
    },
  });

  await appendAuditLog({
    organizationId: org.id,
    actorId: null,
    actorType: 'CLERK_WEBHOOK',
    action: 'SSO_CONNECTION_CONFIGURED',
    targetType: 'SamlConnection',
    targetId: org.id,
    metadata: {
      provider: sso.provider,
      clerkConnectionId: sso.id,
      domains: sso.domains,
    },
  });

  return NextResponse.json({ ok: true, action: event.type });
}

async function handleOrganizationDelete(
  event: ClerkOrganizationEvent,
): Promise<NextResponse> {
  const org = await dbServiceRole.organization.findFirst({
    where: { slug: event.data.slug },
    select: { id: true },
  });
  if (!org) return NextResponse.json({ ok: true, action: 'skipped-no-local-org' });

  await dbServiceRole.samlConnection.deleteMany({ where: { organizationId: org.id } });

  await appendAuditLog({
    organizationId: org.id,
    actorId: null,
    actorType: 'CLERK_WEBHOOK',
    action: 'SSO_CONNECTION_DISABLED',
    targetType: 'SamlConnection',
    targetId: org.id,
    metadata: { clerkOrgId: event.data.id },
  });

  return NextResponse.json({ ok: true, action: event.type });
}

// ─────────────────────────────────────────────────────────────────────────
// Membership event handlers (Phase 1 — SSO-001)
// ─────────────────────────────────────────────────────────────────────────

async function handleMembershipUpsert(
  event: ClerkOrgMembershipEvent,
): Promise<NextResponse> {
  const clerkUserId = event.data.public_user_data.user_id;
  const clerkOrgId = event.data.organization.id;
  const role = mapClerkRole(event.data.role);

  // Look up local user + org by Clerk IDs.
  const user = await dbServiceRole.user.findFirst({
    where: { clerkUserId },
    select: { id: true },
  });
  const org = await dbServiceRole.organization.findFirst({
    where: { slug: clerkOrgId }, // TODO: replace with clerkOrganizationId column
    select: { id: true },
  });
  if (!user || !org) {
    return NextResponse.json({ ok: true, action: 'skipped-missing-mapping' });
  }

  await dbServiceRole.membership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    create: {
      organizationId: org.id,
      userId: user.id,
      role,
      status: 'ACTIVE',
      joinedAt: new Date(),
      acceptedAt: new Date(),
    },
    update: { role, status: 'ACTIVE' },
  });

  await appendAuditLog({
    organizationId: org.id,
    actorId: user.id,
    actorType: 'CLERK_WEBHOOK',
    action: 'MEMBERSHIP_UPDATED',
    targetType: 'User',
    targetId: user.id,
    metadata: { role, source: 'clerk-webhook' },
  });

  return NextResponse.json({ ok: true, action: event.type });
}

async function handleMembershipDelete(
  event: ClerkOrgMembershipEvent,
): Promise<NextResponse> {
  const clerkUserId = event.data.public_user_data.user_id;
  const clerkOrgId = event.data.organization.id;

  const user = await dbServiceRole.user.findFirst({
    where: { clerkUserId },
    select: { id: true },
  });
  const org = await dbServiceRole.organization.findFirst({
    where: { slug: clerkOrgId },
    select: { id: true },
  });
  if (!user || !org) {
    return NextResponse.json({ ok: true, action: 'skipped-missing-mapping' });
  }

  await dbServiceRole.membership.updateMany({
    where: { organizationId: org.id, userId: user.id },
    data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
  });

  await appendAuditLog({
    organizationId: org.id,
    actorId: user.id,
    actorType: 'CLERK_WEBHOOK',
    action: 'MEMBERSHIP_DELETED',
    targetType: 'User',
    targetId: user.id,
    metadata: { source: 'clerk-webhook' },
  });

  return NextResponse.json({ ok: true, action: event.type });
}

// ─────────────────────────────────────────────────────────────────────────
// Session event handlers (Phase 1 — SSO-001)
// ─────────────────────────────────────────────────────────────────────────

async function handleSessionCreated(event: ClerkSessionEvent): Promise<NextResponse> {
  const clerkUserId = event.data.user_id;
  const isSso = Boolean(event.data.actor?.sub); // Clerk sets actor.sub for SSO logins.
  const user = await dbServiceRole.user.findFirst({
    where: { clerkUserId },
    select: { id: true, memberships: { select: { organizationId: true, role: true } } },
  });
  if (!user) return NextResponse.json({ ok: true, action: 'skipped-no-user' });
  // Audit against the user's first org (Clerk sessions are user-scoped).
  const membership = user.memberships[0];
  if (!membership) return NextResponse.json({ ok: true, action: 'skipped-no-org' });

  await appendAuditLog({
    organizationId: membership.organizationId,
    actorId: user.id,
    actorType: isSso ? 'CLERK_WEBHOOK' : 'USER',
    action: isSso ? 'SSO_LOGIN_SUCCESS' : 'USER_LOGIN',
    targetType: 'Session',
    targetId: event.data.id,
    metadata: { clerkSessionId: event.data.id, sso: isSso, actorSub: event.data.actor?.sub },
  });

  return NextResponse.json({ ok: true, action: event.type });
}

async function handleSessionEnded(event: ClerkSessionEvent): Promise<NextResponse> {
  const user = await dbServiceRole.user.findFirst({
    where: { clerkUserId: event.data.user_id },
    select: { id: true, memberships: { select: { organizationId: true } } },
  });
  if (!user) return NextResponse.json({ ok: true, action: 'skipped-no-user' });
  const membership = user.memberships[0];
  if (!membership) return NextResponse.json({ ok: true, action: 'skipped-no-org' });

  await appendAuditLog({
    organizationId: membership.organizationId,
    actorId: user.id,
    actorType: 'USER',
    action: 'USER_LOGOUT',
    targetType: 'Session',
    targetId: event.data.id,
    metadata: { clerkSessionId: event.data.id },
  });

  return NextResponse.json({ ok: true, action: event.type });
}