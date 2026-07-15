/**
 * @brightai/dashboard — POST /api/billing/portal
 *
 * Returns a Stripe Customer Portal URL. The UI redirects the browser
 * there for payment method updates, invoice history, and (if enabled
 * in the Stripe Dashboard) cancellation.
 *
 * Auth: OWNER role required.
 *
 * Response: 200 { url } | 4xx { error }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { dbServiceRole } from '@brightai/db';
import { requireSessionRoleAtLeast } from '@/lib/session';
import { createCustomerPortalSession, isBillingConfigured } from '@/lib/billing/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // 1. Auth + tenant
  let ctx;
  try {
    ctx = await requireSessionRoleAtLeast('OWNER');
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'Not authenticated' : 'Forbidden' },
      { status: status === 401 ? 401 : 403 },
    );
  }

  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 });
  }

  // 2. Resolve org with stripeCustomerId
  const org = await dbServiceRole.organization.findUnique({
    where: { id: ctx.tenant.id },
    select: { id: true, stripeCustomerId: true },
  });
  if (!org?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe customer for this organization. Complete checkout first.' },
      { status: 400 },
    );
  }

  // 3. Create portal session
  const returnUrl = `${req.nextUrl.origin}/settings/billing`;
  try {
    const result = await createCustomerPortalSession({
      organization: org,
      returnUrl,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Portal session creation failed', details: msg }, { status: 502 });
  }
}
