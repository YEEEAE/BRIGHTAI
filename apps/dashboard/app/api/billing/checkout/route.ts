/**
 * @brightai/dashboard — POST /api/billing/checkout
 *
 * Starts a Stripe Checkout session for a self-serve plan. The UI
 * redirects the browser to the returned `url`.
 *
 * Request body: { plan: 'STARTER' | 'PRO' }
 *
 * Auth: OWNER role required (only the org owner can change billing).
 * Tenant resolution: uses getSessionContext → requireTenant.
 *
 * Response: 200 { url, sessionId } | 4xx { error } | 5xx { error }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbServiceRole } from '@brightai/db';
import { requireSessionRoleAtLeast } from '@/lib/session';
import { createCheckoutSession, isBillingConfigured, BillingNotConfiguredError } from '@/lib/billing/stripe';
import { getPlan } from '@/lib/billing/plans';
import type { BillingPlan } from '@brightai/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BodySchema = z.object({
  plan: z.enum(['STARTER', 'PRO']),
});

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

  // 2. Billing config
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured on this server.' },
      { status: 503 },
    );
  }

  // 3. Body validation
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid body', details: err instanceof z.ZodError ? err.issues : String(err) },
      { status: 400 },
    );
  }

  // 4. Plan + price id
  const plan = getPlan(body.plan as BillingPlan);
  if (!plan.stripePriceId) {
    return NextResponse.json(
      { error: `Plan ${plan.key} has no Stripe price configured. (Set STRIPE_PRICE_${plan.key} in env.)` },
      { status: 503 },
    );
  }
  if (plan.salesLed) {
    return NextResponse.json(
      { error: `Plan ${plan.key} is sales-led. Redirect to /contact instead.` },
      { status: 400 },
    );
  }

  // 5. Load the full organization (need stripeCustomerId)
  const org = await dbServiceRole.organization.findUnique({
    where: { id: ctx.tenant.id },
    select: { id: true, slug: true, name: true, nameAr: true, stripeCustomerId: true },
  });
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // 6. Create checkout
  const origin = req.nextUrl.origin;
  const successUrl = `${origin}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/settings/billing?checkout=canceled`;

  try {
    const result = await createCheckoutSession({
      organization: org,
      priceId: plan.stripePriceId,
      successUrl,
      cancelUrl,
      customerEmail: ctx.user.email,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BillingNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Checkout creation failed', details: msg }, { status: 502 });
  }
}
