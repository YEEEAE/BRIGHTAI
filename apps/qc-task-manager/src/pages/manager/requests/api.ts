// POST /manager/requests/api — approve / reject a pending delete request.
//
// Dispatch on the `action` form field:
//   approve  → delete the task (cascade) + mark the request 'approved'
//   reject   → mark the request 'rejected' (task untouched, badge clears)
//
// The middleware has already run the /manager guard (manager + admin); this
// handler re-checks canReviewDeleteRequests for defense in depth. All business
// rules live in src/lib/deleteRequests.ts (reviewDeleteRequest). Every request
// ends in a redirect back to /manager/requests with a one-shot flash message.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/session';
import { requireCsrf } from '../../../lib/api-security';
import { setFlash } from '../../../lib/flash';
import { parseFormData, deleteReviewSchema } from '../../../lib/validation';
import { canReviewDeleteRequests } from '../../../lib/permissions';
import { reviewDeleteRequest } from '../../../lib/deleteRequests';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const actor = getCurrentUser(context);
  if (!actor) {
    return context.redirect(`/login?redirect=${encodeURIComponent('/manager/requests')}`);
  }
  if (!canReviewDeleteRequests(actor.role)) {
    setFlash(context, 'error', 'You do not have permission to review deletion requests.');
    return context.redirect('/');
  }

  const fail = (error: string): Response => {
    setFlash(context, 'error', error);
    return context.redirect('/manager/requests');
  };

  const form = await context.request.formData();
  const parsed = parseFormData(deleteReviewSchema, form);
  if (!parsed.ok) return fail(parsed.error);
  const { action, request_id, review_note } = parsed.data;

  const result = reviewDeleteRequest({
    requestId: request_id,
    reviewer: { id: actor.id, role: actor.role, username: actor.username },
    decision: action === 'approve' ? 'approved' : 'rejected',
    reviewNote: review_note,
  });
  if (!result.ok) return fail(result.error);

  setFlash(context, 'success', result.message);
  return context.redirect('/manager/requests');
};
