import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
import { getSafeErrorCode } from '../../../../../lib/observability';
import { parseFormData, parsePositiveId, labChangeRequestReviewSchema } from '../../../../../lib/validation';
import { canReviewLabChangeRequests } from '../../../../../lib/permissions';
import { approveChangeRequest, rejectChangeRequest } from '../../../../../lib/lab/changeRequests';
import { setFlash } from '../../../../../lib/flash';

/** POST /api/lab/change-requests/:id/review — the sole review action route. */
export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  if (!canReviewLabChangeRequests(auth.role)) {
    return apiJsonError('Manager or administrator review is required.', 403);
  }
  const id = parsePositiveId(context.params.id);
  if (id == null) return apiJsonError('Invalid change request id.', 400);
  const parsed = parseFormData(labChangeRequestReviewSchema, await context.request.formData());
  if (!parsed.ok) return apiJsonError(parsed.error, 400);
  try {
    const request = parsed.data.action === 'approve'
      ? approveChangeRequest(id, { id: auth.id, role: auth.role }, parsed.data.review_note)
      : rejectChangeRequest(id, { id: auth.id, role: auth.role }, parsed.data.review_note);
    if ((context.request.headers.get('accept') ?? '').includes('text/html')) {
      setFlash(context, 'success', `Change request ${parsed.data.action}d.`);
      return context.redirect(`/lab/change-requests/${request.id}`);
    }
    return new Response(JSON.stringify({ ok: true, request }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not review the change request.';
    const status = message.includes('not found') ? 404 : 409;
    return apiJsonError(status === 404 ? 'Change request not found.' : 'The change request could not be reviewed in its current state.', status, getSafeErrorCode(error));
  }
};
