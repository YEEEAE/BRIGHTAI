// POST /api/notifications/[id]/read — mark ONE persisted notification of the
// signed-in user as read (ownership is enforced: a user can only read their
// own rows). Returns JSON so the MarkReadButton island can confirm and reload.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { markNotificationRead } from '../../../../lib/notifications';
import { parsePositiveId } from '../../../../lib/validation';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const id = parsePositiveId(context.params.id);
  if (id == null) {
    return apiJsonError('Invalid notification id.', 400);
  }

  const marked = markNotificationRead(user.id, id);
  return apiJson({ marked });
};
