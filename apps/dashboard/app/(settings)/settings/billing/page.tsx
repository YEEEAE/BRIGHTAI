/**
 * @brightai/dashboard — /settings/billing
 *
 * OWNER+ only. Phase 1: real Stripe subscription flow.
 *
 * What the page shows:
 *   - Current plan + status (from the Subscription row, mirrored on
 *     the Organization's planName).
 *   - "Manage in Stripe" button (opens the Customer Portal).
 *   - "Cancel" / "Resume" buttons depending on state.
 *   - 3 plan cards (Starter, Pro, Enterprise) for upgrade / new signups.
 *   - Friendly "billing not configured" state if STRIPE_SECRET_KEY is
 *     missing.
 *
 * The action buttons use server actions (see ./actions.ts). The plan
 * cards link to a small client component (./PlanCardButton.tsx) that
 * calls the checkout action and navigates to the returned URL.
 */

import { dbServiceRole } from '@brightai/db';
import type { Subscription, SubscriptionStatus, BillingPlan } from '@brightai/db';
import { requireSessionRoleAtLeast } from '@/lib/session';
import { PLANS, isBillingConfigured } from '@/lib/billing';
import styles from './page.module.css';
import { BillingActions, PlanCardButton, CheckoutSuccessToast, CheckoutCanceledToast } from './client';

export const dynamic = 'force-dynamic';

type SearchParams = {
  checkout?: 'success' | 'canceled';
  session_id?: string;
};

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = await requireSessionRoleAtLeast('OWNER');

  // Resolve the current subscription (if any). Service role because
  // RLS check would require a tenant context setup; here we know the
  // orgId from the session and the row is unique per (org, subscription).
  const sub = await dbServiceRole.subscription.findFirst({
    where: { organizationId: ctx.tenant.id },
    orderBy: { createdAt: 'desc' },
  });

  const orgHasCustomer = Boolean(
    await dbServiceRole.organization
      .findUnique({ where: { id: ctx.tenant.id }, select: { stripeCustomerId: true } })
      .then((o) => o?.stripeCustomerId),
  );

  const billingReady = isBillingConfigured();

  // Toasts from the checkout redirect.
  const showSuccess = searchParams.checkout === 'success';
  const showCanceled = searchParams.checkout === 'canceled';

  return (
    <div className={styles.root}>
      {showSuccess && <CheckoutSuccessToast />}
      {showCanceled && <CheckoutCanceledToast />}

      <h1 className={styles.title}>الفوترة</h1>
      <p className={styles.lead}>
        إدارة اشتراكك في BrightAI. كل الفواتير والـ invoices والـ payment methods تتم عبر Stripe.
      </p>

      {!billingReady && (
        <div className={styles.notice} role="status">
          <strong>تنبيه:</strong> الفوترة غير مفعّلة على هذا السيرفر. أضف
          <code>STRIPE_SECRET_KEY</code> و <code>STRIPE_WEBHOOK_SECRET</code> و
          <code>STRIPE_PRICE_STARTER</code> و <code>STRIPE_PRICE_PRO</code>
          في <code>.env</code> لتفعيلها.
        </div>
      )}

      {sub && (
        <CurrentSubscriptionCard
          sub={sub}
          orgHasCustomer={orgHasCustomer}
        />
      )}

      <section aria-labelledby="plans-heading" className={styles.plansSection}>
        <h2 id="plans-heading" className={styles.sectionTitle}>
          {sub ? 'ترقية أو تغيير الخطة' : 'اختر خطتك'}
        </h2>
        <div className={styles.plans}>
          {PLANS.map((plan) => {
            const isCurrent = sub?.plan === plan.key;
            return (
              <article
                key={plan.key}
                className={`${styles.planCard} ${isCurrent ? styles.planCardCurrent : ''}`}
                aria-label={`${plan.name.ar} - ${plan.priceDisplay.ar}`}
              >
                {isCurrent && <span className={styles.currentBadge}>خطتك الحالية</span>}
                <h3 className={styles.planName}>{plan.name.ar}</h3>
                <p className={styles.planTagline}>{plan.tagline.ar}</p>
                <div className={styles.planPrice}>
                  <span className={styles.planPriceValue}>{plan.priceDisplay.ar}</span>
                  {plan.priceMonthlyHalala !== null && (
                    <span className={styles.planPriceSuffix}>/ شهريًا</span>
                  )}
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.ar.map((f) => (
                    <li key={f} className={styles.planFeature}>
                      <span className={styles.planFeatureIcon} aria-hidden="true">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={styles.planCta}>
                  {plan.salesLed ? (
                    <a className={styles.planCtaSales} href="/contact">
                      {plan.cta.ar}
                    </a>
                  ) : isCurrent ? (
                    <span className={styles.planCtaDisabled}>مفعّلة</span>
                  ) : (
                    <PlanCardButton planKey={plan.key} label={plan.cta.ar} disabled={!billingReady} />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Current subscription card
// ─────────────────────────────────────────────────────────────────

const STATUS_LABELS_AR: Record<SubscriptionStatus, { label: string; tone: 'active' | 'warning' | 'danger' | 'muted' }> = {
  TRIALING: { label: 'تجريبي', tone: 'active' },
  ACTIVE: { label: 'فعّال', tone: 'active' },
  PAST_DUE: { label: 'متأخر السداد', tone: 'warning' },
  CANCELED: { label: 'ملغي', tone: 'muted' },
  UNPAID: { label: 'غير مدفوع', tone: 'danger' },
  INCOMPLETE: { label: 'غير مكتمل', tone: 'warning' },
  INCOMPLETE_EXPIRED: { label: 'منتهي قبل التفعيل', tone: 'muted' },
  PAUSED: { label: 'موقوف', tone: 'muted' },
};

function CurrentSubscriptionCard({
  sub,
  orgHasCustomer,
}: {
  sub: Subscription;
  orgHasCustomer: boolean;
}) {
  const status = STATUS_LABELS_AR[sub.status];
  const renewsAt = sub.currentPeriodEnd;
  const isScheduledCancel = sub.cancelAtPeriodEnd && sub.status !== 'CANCELED';

  return (
    <section className={styles.currentCard} aria-labelledby="current-sub-heading">
      <div className={styles.currentCardHeader}>
        <div>
          <h2 id="current-sub-heading" className={styles.currentPlan}>
            {sub.plan}
          </h2>
          <span className={`${styles.statusPill} ${styles[`status-${status.tone}`]}`}>
            {status.label}
          </span>
        </div>
        <BillingActions
          hasCustomer={orgHasCustomer}
          cancelAtPeriodEnd={isScheduledCancel}
        />
      </div>

      <dl className={styles.currentDetails}>
        {sub.trialEnd && sub.status === 'TRIALING' && (
          <>
            <dt>ينتهي الـ trial في</dt>
            <dd>
              <time dateTime={sub.trialEnd.toISOString()}>
                {formatArDate(sub.trialEnd)}
              </time>
            </dd>
          </>
        )}
        <dt>{isScheduledCancel ? 'ينتهي الاشتراك في' : 'يتجدد في'}</dt>
        <dd>
          <time dateTime={renewsAt.toISOString()}>{formatArDate(renewsAt)}</time>
        </dd>
        {isScheduledCancel && (
          <>
            <dt>ملاحظة</dt>
            <dd className={styles.cancelNote}>
              الاشتراك مجدول للإلغاء في نهاية الفترة الحالية. تقدر تستعيده من زر "استئناف" بالأعلى.
            </dd>
          </>
        )}
      </dl>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Format a Date in Arabic, with the Saudi locale. */
function formatArDate(d: Date): string {
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Avoid unused-import warning when BillingActions is the only consumer
// of some types. (The types are imported for documentation purposes.)
export type { BillingPlan };
