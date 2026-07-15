/**
 * @brightai/dashboard — billing barrel (BAI-004 / 2026-07-15)
 *
 * Re-exports for the public billing API. Server-only — these are
 * imported by route handlers, server components, and server actions.
 * Never import this from a client component.
 */

export * from './plans';
export {
  BillingNotConfiguredError,
  getStripeClient,
  isBillingConfigured,
  getOrCreateCustomer,
  createCheckoutSession,
  createCustomerPortalSession,
  cancelSubscriptionAtPeriodEnd,
  resumeSubscription,
  verifyWebhookEvent,
  subscriptionToPlanKey,
} from './stripe';
