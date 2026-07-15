/**
 * @brightai/dashboard — Stripe integration (BAI-004 / 2026-07-15)
 *
 * Server-only. The Stripe client is a module-level singleton; in
 * dev, it's recreated per HMR cycle (see the globalThis cache pattern
 * shared with `dbServiceRole`).
 *
 * Three concerns live here:
 *   1. **Client init + lazy config check** — `getStripe()` throws a
 *      clear error if STRIPE_SECRET_KEY is missing, so the rest of
 *      the app can stay free of env-var nullability noise.
 *   2. **High-level operations** — `createCheckoutSession`,
 *      `createCustomerPortalSession`, `cancelAtPeriodEnd`,
 *      `resumeSubscription`, `getOrCreateCustomer`. These wrap the
 *      raw Stripe SDK with BrightAI conventions (org metadata, plan
 *      mapping, return URLs).
 *   3. **Webhook signature verification** — `verifyWebhookEvent` is
 *      the single source of truth for `stripe.webhooks.constructEvent`.
 *      Used by the /api/webhooks/stripe route handler.
 *
 * We do NOT mirror Stripe data into the DB synchronously from here.
 * The webhook handler is the only writer of Subscription rows. This
 * keeps the DB consistent even if a checkout fails mid-flow.
 */

import 'server-only';
import Stripe from 'stripe';
import { dbServiceRole } from '@brightai/db';
import type { Organization, BillingPlan } from '@brightai/db';
import { getPlan } from './plans';

// ─────────────────────────────────────────────────────────────────
// Lazy client + config
// ─────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __brightai_stripe__: Stripe | undefined;
}

/**
 * Thrown by billing helpers when Stripe is not configured. Catches
 * the developer-error case where a route forgets to gate on
 * `isBillingConfigured()`.
 */
export class BillingNotConfiguredError extends Error {
  override readonly name = 'BillingNotConfiguredError';
  constructor() {
    super(
      'Stripe billing is not configured. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ' +
        'and STRIPE_PRICE_STARTER / STRIPE_PRICE_PRO in your environment. ' +
        'See apps/dashboard/.env.example for the full list.',
    );
  }
}

/**
 * Get the Stripe client. Returns null if STRIPE_SECRET_KEY is missing
 * (use `isBillingConfigured()` to check before calling).
 */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (!global.__brightai_stripe__) {
    global.__brightai_stripe__ = new Stripe(key, {
      // Pin the API version. Bump deliberately + tested.
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
      typescript: true,
      appInfo: {
        name: 'brightai-dashboard',
        version: '0.1.0',
        url: 'https://brightai.site',
      },
      maxNetworkRetries: 2, // Stripe retries transient failures automatically
      timeout: 15_000, // 15s — well under Render's 30s request budget
    });
  }
  return global.__brightai_stripe__;
}

/** True if the dashboard has at least the secret key + webhook secret set. */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

// ─────────────────────────────────────────────────────────────────
// Customer management
// ─────────────────────────────────────────────────────────────────

/**
 * Get or create the Stripe Customer for an organization. We store
 * `stripeCustomerId` on the Organization row, so a single API call
 * covers the create case (when the org has never subscribed) and the
 * fetch case (re-entry, plan changes).
 *
 * Email: we use the first OWNER's email as the customer email. If
 * that user later leaves, the customer stays attached to the org.
 */
export async function getOrCreateCustomer(
  organization: Pick<Organization, 'id' | 'slug' | 'name' | 'nameAr' | 'stripeCustomerId'>,
): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) throw new BillingNotConfiguredError();

  if (organization.stripeCustomerId) {
    // Verify the customer still exists in Stripe (defensive — manual
    // deletion in the dashboard shouldn't brick the UI).
    try {
      const existing = await stripe.customers.retrieve(organization.stripeCustomerId);
      if (!existing.deleted) return organization.stripeCustomerId;
    } catch {
      // Customer was deleted in Stripe — fall through to create.
    }
  }

  // Find the OWNER's email to seed the customer record.
  const ownerMembership = await dbServiceRole.membership.findFirst({
    where: { organizationId: organization.id, role: 'OWNER', status: 'ACTIVE' },
    include: { user: { select: { email: true } } },
  });
  const email = ownerMembership?.user?.email || undefined;

  const customer = await stripe.customers.create({
    email,
    name: organization.nameAr || organization.name,
    metadata: {
      // Used by the webhook to find the Organization row.
      brightai_org_id: organization.id,
      brightai_org_slug: organization.slug,
    },
  });

  await dbServiceRole.organization.update({
    where: { id: organization.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─────────────────────────────────────────────────────────────────
// Checkout + Customer Portal
// ─────────────────────────────────────────────────────────────────

/**
 * Create a Stripe Checkout session for a new subscription.
 *
 * - The org's customer is created if it doesn't exist yet.
 * - `metadata.brightai_org_id` is the join key the webhook uses.
 * - `trial_period_days: 14` applies the free trial to all self-serve plans.
 * - Returns the redirect URL the UI should send the browser to.
 */
export async function createCheckoutSession(opts: {
  organization: Pick<Organization, 'id' | 'slug' | 'name' | 'nameAr' | 'stripeCustomerId'>;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  /** Pre-fill the customer email in the checkout form. */
  customerEmail?: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripeClient();
  if (!stripe) throw new BillingNotConfiguredError();

  const customerId = await getOrCreateCustomer(opts.organization);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    // Saudi tax — collected by Stripe Tax if enabled on the account.
    automatic_tax: { enabled: false }, // OFF in MVP; turn on in V2 once tax ID is in settings
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        brightai_org_id: opts.organization.id,
        brightai_org_slug: opts.organization.slug,
      },
    },
    metadata: {
      brightai_org_id: opts.organization.id,
      brightai_org_slug: opts.organization.slug,
    },
    // Pre-fill email if we have it.
    customer_email: opts.customerEmail,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return { url: session.url, sessionId: session.id };
}

/**
 * Create a Stripe Customer Portal session. The portal lets the
 * customer update their payment method, view invoices, and (if
 * configured in the Stripe Dashboard) cancel their subscription.
 *
 * We use the portal for resume because it gives the customer a
 * self-serve UI without us having to build one.
 */
export async function createCustomerPortalSession(opts: {
  organization: Pick<Organization, 'id' | 'stripeCustomerId'>;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = getStripeClient();
  if (!stripe) throw new BillingNotConfiguredError();

  const customerId = opts.organization.stripeCustomerId;
  if (!customerId) {
    throw new Error('Organization has no Stripe customer; complete checkout first.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: opts.returnUrl,
  });

  return { url: session.url };
}

// ─────────────────────────────────────────────────────────────────
// Subscription mutations (cancel / resume)
// ─────────────────────────────────────────────────────────────────

/**
 * Schedule a subscription to cancel at the end of the current billing
 * period. The subscription remains ACTIVE until `current_period_end`,
 * then transitions to CANCELED. The user can resume from the portal
 * before the period ends.
 */
export async function cancelSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string,
): Promise<{ id: string; cancel_at_period_end: boolean; cancel_at: number | null }> {
  const stripe = getStripeClient();
  if (!stripe) throw new BillingNotConfiguredError();

  const sub = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
    // The portal sets cancellation_details.reason, but we also accept
    // it here in case it's set server-side.
    cancellation_details: undefined,
  });

  return {
    id: sub.id,
    cancel_at_period_end: sub.cancel_at_period_end,
    cancel_at: sub.cancel_at ?? null,
  };
}

/**
 * Undo a scheduled cancellation. The subscription stays ACTIVE and
 * auto-renews at the next period end.
 */
export async function resumeSubscription(
  stripeSubscriptionId: string,
): Promise<{ id: string; cancel_at_period_end: boolean }> {
  const stripe = getStripeClient();
  if (!stripe) throw new BillingNotConfiguredError();

  const sub = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  return { id: sub.id, cancel_at_period_end: sub.cancel_at_period_end };
}

// ─────────────────────────────────────────────────────────────────
// Webhook verification
// ─────────────────────────────────────────────────────────────────

/**
 * Verify a Stripe webhook signature. Throws if verification fails.
 * The route handler must return 401 in that case so Stripe retries
 * with a corrected signature.
 *
 * IMPORTANT: pass the raw body string. The Next.js route handler
 * must read `req.text()` — never `req.json()` because the body must
 * be the exact bytes Stripe signed.
 */
export function verifyWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const stripe = getStripeClient();
  if (!stripe) throw new BillingNotConfiguredError();

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set; cannot verify webhook signatures.');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

// ─────────────────────────────────────────────────────────────────
// Subscription → BillingPlan mapping
// ─────────────────────────────────────────────────────────────────

/**
 * Map a Stripe subscription's `plan` (Price ID) to a BillingPlan key.
 * Returns null if the Price ID doesn't match any known plan (e.g.
 * a custom enterprise quote that was deleted in Stripe).
 */
export function subscriptionToPlanKey(
  subscription: Pick<Stripe.Subscription, 'items'>,
): BillingPlan | null {
  // The subscription has multiple items in theory, but our flow always
  // creates subscriptions with exactly one line item. Take the first.
  const item = subscription.items.data[0];
  if (!item) return null;
  const plan = getPlanByPriceIdInModule(item.price.id);
  return plan?.key ?? null;
}

// Re-import to avoid a circular dep at module top-level.
import { getPlanByPriceId as getPlanByPriceIdInModule } from './plans';
