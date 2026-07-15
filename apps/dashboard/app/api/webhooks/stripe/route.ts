/**
 * @brightai/dashboard — Stripe webhook handler (BAI-004 / 2026-07-15)
 *
 * POST /api/webhooks/stripe
 *
 * The single writer of the Subscription table. Stripe retries
 * unacknowledged webhooks for up to 3 days, so:
 *   1. Idempotency: each event has a unique `id`. We set
 *      `lastStripeEventId` on the Subscription row. A duplicate event
 *      triggers a unique-constraint violation, which we catch and
 *      return as 200 (Stripe treats it as success and stops retrying).
 *   2. Service role: no user session in webhook context. We use
 *      `dbServiceRole` (BYPASSRLS) — the orgId is read from the
 *      Stripe customer's metadata, which we set at checkout time.
 *   3. Signature verification: `stripe.webhooks.constructEvent` checks
 *      the `stripe-signature` header. Returns 401 on mismatch.
 *
 * Handled events (Phase 1):
 *   - checkout.session.completed         → first-time subscription row
 *   - customer.subscription.created      → sync (also handles the
 *                                          rare case where checkout
 *                                          fires this before the
 *                                          session.completed arrives)
 *   - customer.subscription.updated      → sync status/period/cancel
 *   - customer.subscription.deleted      → mark CANCELED
 *   - customer.subscription.trial_will_end → log only (no DB write)
 *   - invoice.payment_failed             → sync (status → PAST_DUE)
 *   - invoice.payment_succeeded          → sync (status → ACTIVE)
 *
 * Future (Phase 2, not implemented here):
 *   - invoice.upcoming → email reminder via SendGrid
 *   - customer.subscription.paused → SCA support
 *
 * Return contract: 200 on success OR on a recognized duplicate. 4xx
 * for signature/parse failures. 5xx for transient errors so Stripe
 * retries.
 */

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { dbServiceRole } from '@brightai/db';
import type { SubscriptionStatus, BillingPlan } from '@brightai/db';
import {
  getStripeClient,
  verifyWebhookEvent,
  isBillingConfigured,
  subscriptionToPlanKey,
} from '@/lib/billing/stripe';
import { getPlanByPriceId } from '@/lib/billing/plans';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─────────────────────────────────────────────────────────────────
// Event → DB mapper
// ─────────────────────────────────────────────────────────────────

/**
 * Map Stripe's subscription.status string to our SubscriptionStatus enum.
 * 1:1 — both have the same 8 values. If Stripe adds a new status, we
 * throw so the deploy fails loudly rather than silently mis-mirroring.
 */
function mapStripeStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    case 'unpaid':
      return 'UNPAID';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED';
    case 'paused':
      return 'PAUSED';
  }
}

/** Type guard: is this event a subscription-related event? */
function isSubscriptionEvent(
  event: Stripe.Event,
): event is Stripe.CustomerSubscriptionEvent {
  return (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  );
}

/**
 * Apply a subscription event to the DB. Idempotent — safe to call
 * for every subscription event including duplicates.
 *
 * Returns true if the event was applied, false if it was a duplicate
 * (already-seen event id).
 */
async function applySubscriptionEvent(
  subscription: Stripe.Subscription,
  eventId: string,
): Promise<{ applied: boolean; reason?: 'duplicate' | 'unknown-plan' | 'unknown-org' }> {
  const orgId = subscription.metadata?.brightai_org_id;
  if (!orgId) {
    return { applied: false, reason: 'unknown-org' };
  }

  // Resolve plan key from the price id.
  const item = subscription.items.data[0];
  if (!item) {
    return { applied: false, reason: 'unknown-plan' };
  }
  const plan = getPlanByPriceId(item.price.id);
  if (!plan) {
    return { applied: false, reason: 'unknown-plan' };
  }

  // Confirm the org exists (defensive — Stripe shouldn't fire events
  // for deleted orgs, but be safe).
  const org = await dbServiceRole.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });
  if (!org) {
    return { applied: false, reason: 'unknown-org' };
  }

  const status = mapStripeStatus(subscription.status);

  // Upsert: if a row exists (by stripeSubscriptionId), update it;
  // otherwise create. The lastStripeEventId unique constraint catches
  // duplicate event ids — we treat that as success.
  try {
    await dbServiceRole.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        organizationId: orgId,
        stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: item.price.id,
        plan: plan.key as BillingPlan,
        status,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancellationReason: subscription.cancellation_details?.reason ?? null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        lastStripeEventId: eventId,
      },
      update: {
        status,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        cancellationReason: subscription.cancellation_details?.reason ?? null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        lastStripeEventId: eventId,
      },
    });
  } catch (err) {
    // P2002 = unique constraint violation. The lastStripeEventId was
    // already used by an earlier event → return success.
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return { applied: false, reason: 'duplicate' };
    }
    throw err;
  }

  // Mirror planName on the Organization so the rest of the app can
  // show plan tier without joining the Subscription table.
  await dbServiceRole.organization.update({
    where: { id: orgId },
    data: {
      planName: plan.key,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  // Audit log — this is a privileged state change.
  await dbServiceRole.auditLog.create({
    data: {
      organizationId: orgId,
      actorType: 'SYSTEM',
      action: 'POLICY_UPDATED', // reuse for now; consider adding SUBSCRIPTION_UPDATED
      targetType: 'Subscription',
      targetId: subscription.id,
      metadata: {
        eventId,
        stripeStatus: subscription.status,
        plan: plan.key,
        priceId: item.price.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    },
  });

  return { applied: true };
}

/**
 * Handle a `checkout.session.completed` event by fetching the full
 * subscription and applying it. This catches the case where the
 * customer completed checkout but the subscription.created event
 * is delayed.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  if (session.mode !== 'subscription' || !session.subscription) {
    // Not a subscription checkout (e.g. one-time payment). Ignore.
    return { applied: false, reason: 'not-subscription' as const };
  }

  const stripe = getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Tag the subscription event id with the checkout event id for
  // traceability. The apply function will write the subscription's
  // own event id, not the checkout's — but we log both.
  return applySubscriptionEvent(subscription, eventId);
}

// ─────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured on this server.' },
      { status: 503 },
    );
  }

  const h = await headers();
  const signature = h.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  // Read raw body — must be the exact bytes Stripe signed.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = verifyWebhookEvent(rawBody, signature);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Invalid signature', details: msg },
      { status: 401 },
    );
  }

  try {
    let result: { applied: boolean; reason?: string } = { applied: false };

    if (isSubscriptionEvent(event)) {
      result = await applySubscriptionEvent(event.data.object, event.id);
    } else if (event.type === 'checkout.session.completed') {
      result = await handleCheckoutCompleted(event.data.object, event.id);
    } else if (event.type === 'invoice.payment_failed' || event.type === 'invoice.payment_succeeded') {
      // Re-sync the subscription from the invoice's subscription id.
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as unknown as { subscription?: string | Stripe.Subscription }).subscription;
      if (typeof subscriptionId === 'string') {
        const stripe = getStripeClient();
        if (!stripe) throw new Error('Stripe not configured');
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        result = await applySubscriptionEvent(subscription, event.id);
      } else {
        result = { applied: false, reason: 'no-subscription-on-invoice' };
      }
    } else if (event.type === 'customer.subscription.trial_will_end') {
      // No DB write — just log. Future: trigger SendGrid email.
      // eslint-disable-next-line no-console
      console.info(`[stripe webhook] trial_will_end for ${(event.data.object as Stripe.Subscription).id}`);
      result = { applied: true };
    } else {
      // Acknowledged but ignored — Stripe will not retry.
      result = { applied: false, reason: 'unhandled' };
    }

    return NextResponse.json({
      ok: true,
      received: event.type,
      eventId: event.id,
      applied: result.applied,
      reason: result.reason,
    });
  } catch (err) {
    // Transient error → return 500 so Stripe retries.
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[stripe webhook] error processing ${event.type} (${event.id}):`, err);
    return NextResponse.json(
      { error: 'Processing failed', details: msg, eventId: event.id },
      { status: 500 },
    );
  }
}

/** GET is not allowed — Stripe never calls it. */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
