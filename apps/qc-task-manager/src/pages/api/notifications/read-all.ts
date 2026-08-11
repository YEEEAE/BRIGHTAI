// POST /api/notifications/read-all — mark every persisted notification of the
// signed-in user as read. Returns JSON so the MarkAllReadButton island can
// confirm and reload (the middleware adds the security headers).

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../lib/session';
import { markAllNotificationsRead } from '../../../lib/notifications';

export const POST: APIRoute = async (context) => {
  const user = getCurrentUser(context);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const marked = markAllNotificationsRead(user.id);
  return new Response(JSON.stringify({ ok: true, marked }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
