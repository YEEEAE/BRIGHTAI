import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
import { parsePositiveId } from '../../../../../lib/validation';
import { withdrawChangeRequest } from '../../../../../lib/lab/changeRequests';
import { setFlash } from '../../../../../lib/flash';

/** POST /api/lab/change-requests/:id/withdraw — requester-only withdrawal. */
export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const id = parsePositiveId(context.params.id);
  if (id == null) return new Response(JSON.stringify({ ok: false, error: 'Invalid change request id.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  try {
    const request = withdrawChangeRequest(id, { id: auth.id, role: auth.role });
    if ((context.request.headers.get('accept') ?? '').includes('text/html')) {
      setFlash(context, 'success', 'Change request withdrawn.');
      return context.redirect(`/lab/change-requests/${request.id}`);
    }
    return new Response(JSON.stringify({ ok: true, request }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not withdraw the change request.';
    const status = message.includes('not found') ? 404 : message.includes('only withdraw') ? 403 : 409;
    return new Response(JSON.stringify({ ok: false, error: message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
};
