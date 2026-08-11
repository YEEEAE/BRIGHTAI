// POST /api/filters — save or delete a per-user saved search filter.
//
// Form fields (the /search page renders these): action=save|delete,
// name (save), filter_json (save — the current query-string JSON), filter_id
// (delete), next (same-origin redirect target so the POST returns to the exact
// search state).
//
// Every mutation is scoped to the signed-in user: rows are stored with
// user_id and deletes are owner-only (saved_filters is a child of the user).
// `next` is restricted to same-origin relative paths to prevent open redirects.

import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../lib/api-security';
import { setFlash } from '../../lib/flash';
import { parseFormData, savedFilterSchema } from '../../lib/validation';
import { deleteSavedFilter, saveFilter } from '../../lib/taskSearch';

/** Only same-origin relative paths are accepted as redirect targets. */
function safeNext(value: string | null | undefined): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/search';
}

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  const form = await context.request.formData();
  const parsed = parseFormData(savedFilterSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(safeNext(form.get('next')?.toString()));
  }
  const { action, name, filter_json, filter_id, next } = parsed.data;
  const dest = safeNext(next);

  if (action === 'save') {
    if (!name || !filter_json) {
      setFlash(context, 'error', 'A filter name is required to save.');
      return context.redirect(dest);
    }
    await saveFilter(user.id, name, filter_json);
    setFlash(context, 'success', `Saved filter "${name}".`);
  } else {
    if (!filter_id) {
      setFlash(context, 'error', 'Invalid saved filter.');
      return context.redirect(dest);
    }
    const deleted = await deleteSavedFilter(user.id, filter_id);
    setFlash(
      context,
      deleted ? 'success' : 'error',
      deleted ? 'Saved filter deleted.' : 'Saved filter not found.',
    );
  }

  return context.redirect(dest);
};
