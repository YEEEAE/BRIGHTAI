-- ═══════════════════════════════════════════════════════════════════
-- BAI-004 / 2026-07-15 — Add Subscription model (Stripe mirror)
-- ═══════════════════════════════════════════════════════════════════
--
-- Adds:
--   - SubscriptionStatus enum (8 states, 1:1 with Stripe subscription.status)
--   - BillingPlan enum (STARTER | PRO | ENTERPRISE)
--   - subscriptions table with RLS policy (tenant-isolated, service-role
--     for the webhook handler)
--
-- Idempotency: Webhook replays are caught by the unique constraint on
-- `last_stripe_event_id`. The webhook handler turns a duplicate into a
-- 200 no-op.
--
-- RLS: subscriptions is added to the FORCE ROW LEVEL SECURITY list in
-- rls.sql (separate file, applied via db:rls:apply). This migration only
-- creates the table + indexes + FK; the policy is created in rls.sql.
-- ═══════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM (
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'PAUSED'
);

-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM (
  'STARTER',
  'PRO',
  'ENTERPRISE'
);

-- CreateTable
CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "stripe_customer_id" TEXT NOT NULL,
  "stripe_subscription_id" TEXT NOT NULL,
  "stripe_price_id" TEXT NOT NULL,
  "plan" "BillingPlan" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL,
  "current_period_start" TIMESTAMP(3) NOT NULL,
  "current_period_end" TIMESTAMP(3) NOT NULL,
  "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
  "canceled_at" TIMESTAMP(3),
  "cancellation_reason" TEXT,
  "trial_start" TIMESTAMP(3),
  "trial_end" TIMESTAMP(3),
  "last_stripe_event_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_last_stripe_event_id_key" ON "subscriptions"("last_stripe_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organization_id_stripe_subscription_id_key" ON "subscriptions"("organization_id", "stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_status_idx" ON "subscriptions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_current_period_end_idx" ON "subscriptions"("status", "current_period_end");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
