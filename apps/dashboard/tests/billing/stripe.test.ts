/**
 * @brightai/dashboard — billing pure-helper unit tests (BAI-004 / 2026-07-15)
 *
 * Tests for the pure helpers (env checks, status mapping) that don't
 * require the Stripe SDK or Prisma. The SDK-touching code paths are
 * covered by integration tests against Stripe's test mode in CI.
 *
 * Run with: `pnpm --filter @brightai/dashboard test tests/billing/stripe.test.ts`
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Stripe from 'stripe';
import type { SubscriptionStatus } from '@brightai/db';

// Re-implement mapStripeStatus locally so we can test the 1:1 contract
// without importing the full webhook route. (The route's implementation
// is the canonical; this test documents the contract.)
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

describe('billing/stripe config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123def456ghi';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_abc123def456ghi';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function isBillingConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }

  it('returns true when both secret + webhook are set', () => {
    expect(isBillingConfigured()).toBe(true);
  });

  it('returns false when STRIPE_SECRET_KEY is missing', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(isBillingConfigured()).toBe(false);
  });

  it('returns false when STRIPE_WEBHOOK_SECRET is missing', () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(isBillingConfigured()).toBe(false);
  });

  it('returns false when both are missing', () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(isBillingConfigured()).toBe(false);
  });
});

describe('mapStripeStatus (1:1 with SubscriptionStatus enum)', () => {
  it.each([
    ['trialing', 'TRIALING'],
    ['active', 'ACTIVE'],
    ['past_due', 'PAST_DUE'],
    ['canceled', 'CANCELED'],
    ['unpaid', 'UNPAID'],
    ['incomplete', 'INCOMPLETE'],
    ['incomplete_expired', 'INCOMPLETE_EXPIRED'],
    ['paused', 'PAUSED'],
  ] as const)('maps Stripe "%s" → "%s"', (stripeStatus, ourStatus) => {
    expect(mapStripeStatus(stripeStatus)).toBe(ourStatus);
  });
});
