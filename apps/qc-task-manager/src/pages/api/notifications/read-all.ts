// POST /api/notifications/read-all — mark every persisted notification of the
// signed-in user as read. Returns JSON so the MarkAllReadButton island can
// confirm and reload (the middleware adds the security headers).

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { markAllNotificationsRead } from '../../../lib/notifications';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;
  const marked = markAllNotificationsRead(user.id);
  return new Response(JSON.stringify({ ok: true, marked }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
