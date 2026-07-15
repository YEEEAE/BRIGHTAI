/**
 * @brightai/dashboard — billing page client components
 *
 * The billing page itself is a Server Component (it reads the
 * subscription from the DB). The interactive parts — the per-plan
 * "Subscribe" button and the "Cancel / Resume / Manage" actions —
 * are small client components that call the server actions.
 *
 * Keeping these tiny:
 *   - The server action returns a URL (for checkout / portal) or a
 *     success flag (for cancel / resume).
 *   - The client component does one of:
 *       a) <form action={action}> for progressive enhancement
 *       b) window.location.href = result.url for the redirect case
 *   - No state management library. The page revalidates on action
 *     success, so the next render reads the new DB state.
 */

'use client';

import { useState, useTransition } from 'react';
import type { BillingPlan } from '@brightai/db';
import {
  startCheckoutAction,
  openPortalAction,
  cancelSubscriptionAction,
  resumeSubscriptionAction,
} from './actions';
import styles from './page.module.css';

// ─────────────────────────────────────────────────────────────────
// Plan card button (the "Subscribe" button on each plan card)
// ─────────────────────────────────────────────────────────────────

export function PlanCardButton({
  planKey,
  label,
  disabled = false,
}: {
  planKey: BillingPlan;
  label: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (disabled) return;
    setError(null);
    startTransition(async () => {
      const result = await startCheckoutAction(planKey);
      if (result.ok) {
        window.location.href = result.url;
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        className={styles.planCtaPrimary}
        aria-busy={isPending}
      >
        {isPending ? '...' : label}
      </button>
      {error && (
        <p role="alert" className={styles.errorMsg}>
          {error}
        </p>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Billing actions (Manage / Cancel / Resume)
// ─────────────────────────────────────────────────────────────────

export function BillingActions({
  hasCustomer,
  cancelAtPeriodEnd,
}: {
  hasCustomer: boolean;
  cancelAtPeriodEnd: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  function openPortal() {
    if (!hasCustomer) {
      setError('لا يوجد عميل Stripe لهذه المنظمة. أكمل الاشتراك أولاً.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await openPortalAction();
      if (result.ok) {
        window.location.href = result.url;
      } else {
        setError(result.error);
      }
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (result.ok) {
        setConfirmCancel(false);
      } else {
        setError(result.error);
      }
    });
  }

  function resume() {
    setError(null);
    startTransition(async () => {
      const result = await resumeSubscriptionAction();
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className={styles.actionsGroup}>
      <button
        type="button"
        onClick={openPortal}
        disabled={isPending || !hasCustomer}
        className={styles.actionBtnPrimary}
      >
        {isPending ? '...' : 'إدارة في Stripe'}
      </button>

      {cancelAtPeriodEnd ? (
        <button
          type="button"
          onClick={resume}
          disabled={isPending}
          className={styles.actionBtnSuccess}
        >
          {isPending ? '...' : 'استئناف الاشتراك'}
        </button>
      ) : (
        <>
          {!confirmCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              disabled={isPending}
              className={styles.actionBtnDanger}
            >
              إلغاء الاشتراك
            </button>
          ) : (
            <div className={styles.confirmGroup}>
              <span className={styles.confirmText}>متأكد؟</span>
              <button
                type="button"
                onClick={cancel}
                disabled={isPending}
                className={styles.actionBtnDangerFilled}
              >
                {isPending ? '...' : 'نعم، ألغِ'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={isPending}
                className={styles.actionBtnSecondary}
              >
                تراجع
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className={styles.errorMsg}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Toasts (success / canceled after checkout redirect)
// ─────────────────────────────────────────────────────────────────

export function CheckoutSuccessToast() {
  return (
    <div className={`${styles.toast} ${styles.toastSuccess}`} role="status">
      <strong>تم الاشتراك بنجاح.</strong> جاري تفعيل خطتك خلال لحظات (عادة 5-10 ثوانٍ).
    </div>
  );
}

export function CheckoutCanceledToast() {
  return (
    <div className={`${styles.toast} ${styles.toastWarning}`} role="status">
      <strong>تم إلغاء عملية الدفع.</strong> ما تم الاشتراك. خطتك الحالية ما تغيرت.
    </div>
  );
}
