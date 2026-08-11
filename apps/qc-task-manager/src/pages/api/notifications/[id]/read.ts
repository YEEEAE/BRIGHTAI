// POST /api/notifications/[id]/read — mark ONE persisted notification of the
// signed-in user as read (ownership is enforced: a user can only read their
// own rows). Returns JSON so the MarkReadButton island can confirm and reload.

import type { APIRoute } from 'astro';
import { getCurrentUser } from '../../../../lib/session';
import { markNotificationRead } from '../../../../lib/notifications';

export const POST: APIRoute = async (context) => {
  const user = getCurrentUser(context);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid notification id.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const marked = markNotificationRead(user.id, id);
  return new Response(JSON.stringify({ ok: true, marked }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
