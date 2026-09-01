import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { createFinding } from '../../../lib/qc-operations';
import { findingCreateSchema } from '../../../lib/validation';
import { canManageFinding } from '../../../lib/permissions';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context); if (csrf) return csrf;
  const auth = requireApiUser(context); if (isResponse(auth)) return auth;
  const parsed = findingCreateSchema.safeParse(Object.fromEntries(await context.request.formData()));
  if (!parsed.success) return apiJsonError(parsed.error.issues[0]?.message ?? 'Invalid Finding.', 400);
  if (!canManageFinding(auth, { owner: parsed.data.owner })) return apiJsonError('Employees can create assigned Findings only.', 403);
  try { const id = createFinding(parsed.data, auth.id); if ((context.request.headers.get('accept') ?? '').includes('text/html')) return Response.redirect(new URL(`/findings/${id}`, context.url), 303); return apiJson({ id }, 201); } catch { return apiJsonError('Unable to create Finding. Try again — if the problem persists, contact an administrator.', 500); }
};
