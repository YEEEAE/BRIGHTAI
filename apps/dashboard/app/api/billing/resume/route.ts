/**
 * @brightai/dashboard — POST /api/billing/resume
 *
 * Undoes a scheduled cancellation. The subscription was set to
 * `cancel_at_period_end: true` — this flips it back to `false` so
 * the customer is charged again at the next period end.
 *
 * Auth: OWNER role required.
 *
 * Response: 200 { stripeSubscriptionId, cancelAtPeriodEnd } | 4xx { error }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runInTenantContext, requireSessionRoleAtLeast } from '@/lib/session';
import { resumeSubscription, isBillingConfigured } from '@/lib/billing/stripe';

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

  // 2. Find the scheduled-to-cancel subscription. RLS via runInTenantContext.
  const sub = await runInTenantContext(ctx, (tx) =>
    tx.subscription.findFirst({
      where: {
        organizationId: ctx.tenant.id,
        cancelAtPeriodEnd: true,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { stripeSubscriptionId: true, cancelAtPeriodEnd: true },
    }),
  );
  if (!sub) {
    return NextResponse.json(
      { error: 'No subscription scheduled for cancellation. Nothing to resume.' },
      { status: 404 },
    );
  }

  // 3. Resume
  try {
    const result = await resumeSubscription(sub.stripeSubscriptionId);
    return NextResponse.json({
      stripeSubscriptionId: result.id,
      cancelAtPeriodEnd: result.cancel_at_period_end,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Resume failed', details: msg }, { status: 502 });
  }
}
