/**
 * @brightai/dashboard — billing server actions (BAI-004 / 2026-07-15)
 *
 * Server Actions for the billing page. They wrap the API routes
 * (`/api/billing/*`) so the form buttons can use `formAction`
 * directly without writing fetch glue.
 *
 * Why server actions and not just direct calls from the page:
 *   - The buttons are inside a form. formAction integrates with
 *     progressive enhancement (works without JS).
 *   - The page is a Server Component — we can't dispatch client
 *     handlers from there.
 *   - Centralizing the calls makes them testable + the call sites
 *     stay small.
 *
 * Auth: the page already requires OWNER via `requireSessionRoleAtLeast`.
 * The actions re-verify (defense in depth) so a stolen form token
 * can't bypass it.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionRoleAtLeast } from '@/lib/session';
import { createCheckoutSession, isBillingConfigured } from '@/lib/billing/stripe';
import { getPlan } from '@/lib/billing/plans';
import { dbServiceRole } from '@brightai/db';
import type { BillingPlan } from '@brightai/db';

type ActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Start a checkout session for the given self-serve plan.
 * Returns the Stripe Checkout URL the browser should navigate to.
 */
export async function startCheckoutAction(planKey: BillingPlan): Promise<ActionResult> {
  const ctx = await requireSessionRoleAtLeast('OWNER');

  if (!isBillingConfigured()) {
    return { ok: false, error: 'Billing is not configured on this server.' };
  }

  const plan = getPlan(planKey);
  if (!plan.stripePriceId) {
    return { ok: false, error: `Plan ${plan.key} has no Stripe price configured.` };
  }
  if (plan.salesLed) {
    return { ok: false, error: 'Enterprise plan is sales-led. Please contact us.' };
  }

  // Load the full org (need stripeCustomerId).
  const org = await dbServiceRole.organization.findUnique({
    where: { id: ctx.tenant.id },
    select: { id: true, slug: true, name: true, nameAr: true, stripeCustomerId: true },
  });
  if (!org) {
    return { ok: false, error: 'Organization not found' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const result = await createCheckoutSession({
      organization: org,
      priceId: plan.stripePriceId,
      successUrl: `${baseUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/settings/billing?checkout=canceled`,
      customerEmail: ctx.user.email,
    });
    return { ok: true, url: result.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/**
 * Open the Stripe Customer Portal. The portal is where the customer
 * updates payment methods, sees invoice history, and (if enabled)
 * cancels.
 */
export async function openPortalAction(): Promise<ActionResult> {
  const ctx = await requireSessionRoleAtLeast('OWNER');

  if (!isBillingConfigured()) {
    return { ok: false, error: 'Billing is not configured.' };
  }

  const org = await dbServiceRole.organization.findUnique({
    where: { id: ctx.tenant.id },
    select: { id: true, stripeCustomerId: true },
  });
  if (!org?.stripeCustomerId) {
    return { ok: false, error: 'No Stripe customer for this organization. Complete checkout first.' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { createCustomerPortalSession } = await import('@/lib/billing/stripe');
  try {
    const result = await createCustomerPortalSession({
      organization: org,
      returnUrl: `${baseUrl}/settings/billing`,
    });
    return { ok: true, url: result.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/**
 * Cancel the active subscription at the end of the current billing
 * period. The subscription remains ACTIVE until `currentPeriodEnd`.
 */
export async function cancelSubscriptionAction(): Promise<ActionResult> {
  const ctx = await requireSessionRoleAtLeast('OWNER');

  if (!isBillingConfigured()) {
    return { ok: false, error: 'Billing is not configured.' };
  }

  const sub = await dbServiceRole.subscription.findFirst({
    where: {
      organizationId: ctx.tenant.id,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { stripeSubscriptionId: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });
  if (!sub) {
    return { ok: false, error: 'لا يوجد اشتراك نشط للإلغاء.' };
  }
  if (sub.cancelAtPeriodEnd) {
    revalidatePath('/settings/billing');
    return { ok: true, url: '' }; // idempotent — no portal redirect needed
  }

  const { cancelSubscriptionAtPeriodEnd } = await import('@/lib/billing/stripe');
  try {
    await cancelSubscriptionAtPeriodEnd(sub.stripeSubscriptionId);
    revalidatePath('/settings/billing');
    return { ok: true, url: '' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

/**
 * Resume a subscription that was scheduled for cancellation.
 */
export async function resumeSubscriptionAction(): Promise<ActionResult> {
  const ctx = await requireSessionRoleAtLeast('OWNER');

  if (!isBillingConfigured()) {
    return { ok: false, error: 'Billing is not configured.' };
  }

  const sub = await dbServiceRole.subscription.findFirst({
    where: {
      organizationId: ctx.tenant.id,
      cancelAtPeriodEnd: true,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { stripeSubscriptionId: true },
  });
  if (!sub) {
    return { ok: false, error: 'لا يوجد اشتراك مجدول للإلغاء.' };
  }

  const { resumeSubscription } = await import('@/lib/billing/stripe');
  try {
    await resumeSubscription(sub.stripeSubscriptionId);
    revalidatePath('/settings/billing');
    return { ok: true, url: '' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
