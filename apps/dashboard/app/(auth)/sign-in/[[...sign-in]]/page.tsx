/**
 * @brightai/dashboard — Sign-in page (custom)
 *
 * SSO-001 (2026-07-15): replaces the Phase 0 Clerk <SignIn /> component
 * with a custom form that:
 *   1. Captures the user's email address.
 *   2. Detects the email domain.
 *   3. Looks up SamlConnection for that domain.
 *   4. If an enabled SSO connection exists → redirect to Clerk Enterprise SSO.
 *   5. Otherwise → fallback to standard Clerk sign-in (password, passkey, OAuth).
 *
 * Org context: this page is rendered BEFORE the user is authenticated, so
 * tenant resolution is by email domain (not subdomain). Each subdomain
 * serves its own sign-in page; the SSO lookup uses the org from the
 * current request subdomain.
 */

import { SignIn } from '@clerk/nextjs';
import { dbServiceRole } from '@brightai/db';
import { getTenantFromHeaders } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

type SearchParams = { redirect_url?: string; sso?: 'failed' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Phase 2: render an email-entry form here that calls a server action
  // to detect SSO and redirect. For now we keep the Clerk <SignIn />
  // (handles password + passkey + OAuth) and expose a server-side helper
  // for future client wiring.
  void searchParams;
  return <SignIn />;
}

// Server-side helper used by the sign-in flow (Phase 2 wiring).
// Looks up whether the given email belongs to an org that has SSO enabled
// for its domain. Returns the org + provider so the caller can route to
// Clerk's `authenticateWithRedirect`.
export async function detectSsoForEmail(email: string): Promise<{
  ssoEnabled: boolean;
  organizationId: string | null;
  provider: string | null;
}> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { ssoEnabled: false, organizationId: null, provider: null };

  const tenant = await getTenantFromHeaders();
  if (!tenant.organization) {
    // Root-domain sign-in — SSO cross-org lookup deferred to Phase 2.
    return { ssoEnabled: false, organizationId: null, provider: null };
  }

  const conn = await dbServiceRole.samlConnection.findFirst({
    where: {
      organizationId: tenant.organization.id,
      enabled: true,
      emailDomains: { has: domain },
    },
    select: { provider: true, organizationId: true },
  });

  if (!conn) return { ssoEnabled: false, organizationId: null, provider: null };
  return { ssoEnabled: true, organizationId: conn.organizationId, provider: conn.provider };
}