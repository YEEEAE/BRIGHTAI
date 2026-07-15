/**
 * @brightai/dashboard — POST /api/billing/cancel
 *
 * Schedules the active subscription to cancel at the end of the
 * current billing period. The subscription remains ACTIVE until
 * `currentPeriodEnd`, then transitions to CANCELED via webhook.
 *
 * Auth: OWNER role required.
 *
 * Response: 200 { stripeSubscriptionId, cancelAtPeriodEnd, currentPeriodEnd }
 *   | 4xx { error }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { dbServiceRole } from '@brightai/db';
import { requireSessionRoleAtLeast } from '@/lib/session';
import { cancelSubscriptionAtPeriodEnd, isBillingConfigured } from '@/lib/billing/stripe';

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

  // 2. Find the active subscription row
  const sub = await dbServiceRole.subscription.findFirst({
    where: {
      organizationId: ctx.tenant.id,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { stripeSubscriptionId: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });
  if (!sub) {
    return NextResponse.json(
      { error: 'No active subscription to cancel.' },
      { status: 404 },
    );
  }
  if (sub.cancelAtPeriodEnd) {
    // Idempotent: already scheduled to cancel.
    return NextResponse.json({
      stripeSubscriptionId: sub.stripeSubscriptionId,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      alreadyScheduled: true,
    });
  }

  // 3. Cancel
  try {
    const result = await cancelSubscriptionAtPeriodEnd(sub.stripeSubscriptionId);
    return NextResponse.json({
      stripeSubscriptionId: result.id,
      cancelAtPeriodEnd: result.cancel_at_period_end,
      cancelAt: result.cancel_at ? new Date(result.cancel_at * 1000).toISOString() : null,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Cancel failed', details: msg }, { status: 502 });
  }
}
