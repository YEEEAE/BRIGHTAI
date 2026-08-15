// POST /api/lab/saved-views — save or delete a per-user lab saved view.
//
// Form fields (the lab list pages and /lab/saved-views render these):
// action=save|delete, name (save), filter_json (save — structured {path, params}
// JSON validated against a per-page allowlist), view_id (delete), next
// (same-origin redirect target so the POST returns to the exact page state).
//
// Every mutation is scoped to the signed-in user: rows are stored with
// user_id and deletes are owner-only. `next` is restricted to same-origin
// relative paths to prevent open redirects. The filter_json payload is
// validated at the service layer (validateLabViewFilter) — only structured,
// allowlisted params are ever stored or applied. Never arbitrary SQL.

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { setFlash } from '../../../lib/flash';
import { parseFormData, labSavedViewSchema } from '../../../lib/validation';
import { deleteLabView, saveLabView, validateLabViewFilter } from '../../../lib/lab/savedViews';

/** Only same-origin relative paths are accepted as redirect targets. */
function safeNext(value: string | null | undefined): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/lab/saved-views';
}

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const form = await context.request.formData();
  const parsed = parseFormData(labSavedViewSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(safeNext(form.get('next')?.toString()));
  }
  const { action, name, filter_json, view_id, next } = parsed.data;
  const dest = safeNext(next);

  if (action === 'save') {
    if (!name || !filter_json) {
      setFlash(context, 'error', 'A view name is required to save.');
      return context.redirect(dest);
    }
    // Validate the filter payload — reject unknown paths/params before storing.
    if (!validateLabViewFilter(filter_json)) {
      setFlash(context, 'error', 'The saved view contains invalid filter parameters.');
      return context.redirect(dest);
    }
    saveLabView(user.id, name, filter_json);
    setFlash(context, 'success', `Saved view "${name}".`);
  } else {
    if (!view_id) {
      setFlash(context, 'error', 'Invalid saved view.');
      return context.redirect(dest);
    }
    const deleted = deleteLabView(user.id, view_id);
    setFlash(
      context,
      deleted ? 'success' : 'error',
      deleted ? 'Saved view deleted.' : 'Saved view not found.',
    );
  }

  return context.redirect(dest);
};
