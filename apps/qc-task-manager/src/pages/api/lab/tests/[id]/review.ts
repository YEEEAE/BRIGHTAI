import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
import { setFlash } from '../../../../../lib/flash';
import { parsePositiveId, parseFormData, labReviewActionSchema } from '../../../../../lib/validation';
import { canReviewLabTest } from '../../../../../lib/permissions';
import { transitionLabTest } from '../../../../../lib/lab/review';
import { LAB_REVIEW_ACTION_LABELS } from '../../../../../lib/lab/review';

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

  try {
    const { action, reason } = parsed.data;
    const result = transitionLabTest({ id: auth.id, role: auth.role }, action, id, reason);
    setFlash(context, 'success', `${result.test_number} · ${LAB_REVIEW_ACTION_LABELS[action]}`);
  } catch (err) {
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not apply the review action.');
  }
  return context.redirect('/lab/tests/review');
};