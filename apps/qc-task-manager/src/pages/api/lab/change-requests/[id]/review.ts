import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
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
    return new Response(JSON.stringify({ ok: false, error: 'Manager or administrator review is required.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const id = parsePositiveId(context.params.id);
  if (id == null) return new Response(JSON.stringify({ ok: false, error: 'Invalid change request id.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const parsed = parseFormData(labChangeRequestReviewSchema, await context.request.formData());
  if (!parsed.ok) return new Response(JSON.stringify({ ok: false, error: parsed.error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  try {
    const request = parsed.data.action === 'approve'
      ? approveChangeRequest(id, { id: auth.id, role: auth.role }, parsed.data.review_note)
      : rejectChangeRequest(id, { id: auth.id, role: auth.role }, parsed.data.review_note);
    if ((context.request.headers.get('accept') ?? '').includes('text/html')) {
      setFlash(context, 'success', `Change request ${parsed.data.action}d.`);
      return context.redirect(`/lab/change-requests/${request.id}`);
    }
    return new Response(JSON.stringify({ ok: true, request }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not review the change request.';
    return new Response(JSON.stringify({ ok: false, error: message }), { status: message.includes('not found') ? 404 : 409, headers: { 'Content-Type': 'application/json' } });
  }
};
