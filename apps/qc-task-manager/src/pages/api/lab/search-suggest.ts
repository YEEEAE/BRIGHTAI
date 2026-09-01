// GET /api/lab/search-suggest?q=… — debounced combobox suggestions for
// /lab/search (progressive enhancement only; the page itself stays a
// server-rendered GET form).
//
// Security contract:
//   - Auth wall: 401 JSON for anonymous callers.
//   - canViewLab gate: 403 JSON for roles outside the laboratory.
//   - Read-only GET — no CSRF gate required (no mutation surface).
//   - Same employee record-scope as the full search: suggestions reuse the
//     exact searchLab subqueries, so records the user cannot see are simply
//     never suggested (404-style non-discovery — nothing is leaked, not even
//     a count).
//   - Every SQL path is parameterized; q is truncated before use.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser } from '../../../lib/api-security';
import { canViewLab } from '../../../lib/permissions';
import type { Role } from '../../../lib/types';
import {
  suggestLabSearch,
  LAB_SUGGEST_MAX_QUERY,
} from '../../../lib/lab/search';

export const GET: APIRoute = async (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const user = auth;

  if (!canViewLab(user.role as Role)) {
    return apiJsonError('Forbidden.', 403);
  }

  const q = (context.url.searchParams.get('q') ?? '').trim().slice(0, LAB_SUGGEST_MAX_QUERY);

  // Below the minimum length the combobox shows nothing — no query is run,
  // so short keystrokes can never probe for record existence.
  if (q.length < 2) {
    return apiJson({ groups: [] });
  }

  try {
    const groups = suggestLabSearch(q, { role: user.role as Role, userId: user.id });
    return apiJson({ groups });
  } catch (err) {
    console.error('[lab] search suggest failure', err);
    return apiJsonError('Suggestion lookup failed.', 500);
  }
};
