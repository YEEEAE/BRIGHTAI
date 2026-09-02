import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
import { setFlash } from '../../../../../lib/flash';
import { parsePositiveId, parseFormData, labReviewActionSchema } from '../../../../../lib/validation';
import { canReviewLabTest } from '../../../../../lib/permissions';
import { transitionLabTest } from '../../../../../lib/lab/review';
import { LAB_REVIEW_ACTION_LABELS } from '../../../../../lib/lab/review';
import {
  ESIGN_FAILURE_MESSAGE_AR,
  ESIGN_FIELD_NAME,
  ESIGN_RATE_LIMITED_MESSAGE_AR,
  requireEsignature,
} from '../../../../../lib/lab/esignature';
import { recordUxEvent } from '../../../../../lib/uxTelemetry';

import { withIdempotency } from '../../../../../lib/idempotency';

/**
 * POST /api/lab/tests/[id]/review — Review Center actions (PROMPT 07, §26).
 *
 * Self-submitting forms from the Review Center POST here (Astro 6 pages have
 * no named request handlers, so this is a dedicated API route like the
 * findings/manager review handlers). It re-checks the /lab wall's reviewer
 * authority, runs the shared Zod schema (reject/request_changes require a
 * reason), delegates the transition to the single review module, then flashes
 * and redirects back to the queue. Every rule (self-review, self-approval,
 * reason-required, approval permission) is enforced inside transitionLabTest.
 */
export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;

  if (!canReviewLabTest(auth.role)) {
    setFlash(context, 'error', 'You do not have permission to review laboratory tests.');
    return context.redirect('/lab');
  }

  const id = parsePositiveId(context.params.id);
  if (!id) {
    setFlash(context, 'error', 'Invalid test id.');
    return context.redirect('/lab/tests/review');
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labReviewActionSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect('/lab/tests/review');
  }

  return await withIdempotency(
    context,
    auth,
    async () => {
      try {
        const { action, reason } = parsed.data;
        // E-signature step: test APPROVE is a highest-authority action and requires
        // re-verifying the current user's password server-side. The session is not
        // reissued; failures are rate-limited per user and audited without storing
        // the password anywhere.
        let esigned = false;
        if (action === 'approve') {
          const outcome = requireEsignature(auth.id, form.get(ESIGN_FIELD_NAME)?.toString() ?? null);
          if (outcome === 'rate_limited') {
            setFlash(context, 'error', ESIGN_RATE_LIMITED_MESSAGE_AR);
            return context.redirect('/lab/tests/review');
          }
          if (outcome === 'invalid') {
            setFlash(context, 'error', ESIGN_FAILURE_MESSAGE_AR);
            return context.redirect('/lab/tests/review');
          }
          esigned = true;
        }
        const result = transitionLabTest({ id: auth.id, role: auth.role }, action, id, reason, { esigned });
        try {
          recordUxEvent({
            event_name: 'review_decision_success',
            route: '/lab/tests/review',
            outcome: 'success',
            metadata: { surface: 'review-center', action },
          }, auth.role);
        } catch (telemetryError) {
          console.error('[ux-telemetry] review success event failed', telemetryError);
        }
        setFlash(context, 'success', `${result.test_number} · ${LAB_REVIEW_ACTION_LABELS[action]}`);
      } catch (err) {
        const isBusy = (err && typeof err === 'object' && ('code' in err && err.code === 'SQLITE_BUSY')) ||
          (err instanceof Error && /sqlite_busy|database is locked/i.test(err.message));
        if (isBusy) {
          const busyRes = apiJsonError('Database is currently busy. Try again shortly.', 503, 'DB');
          busyRes.headers.set('Retry-After', '2');
          return busyRes;
        }
        try {
          recordUxEvent({
            event_name: 'review_decision_error',
            route: '/lab/tests/review',
            outcome: 'error',
            metadata: { surface: 'review-center', action: parsed.data.action },
          }, auth.role);
        } catch (telemetryError) {
          console.error('[ux-telemetry] review error event failed', telemetryError);
        }
        setFlash(context, 'error', err instanceof Error ? err.message : 'Could not apply the review action.');
      }
      return context.redirect('/lab/tests/review');
    },
    { payload: form },
  );
};
