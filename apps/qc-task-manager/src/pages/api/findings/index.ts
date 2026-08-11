import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { createFinding } from '../../../lib/qc-operations';
import { findingCreateSchema } from '../../../lib/validation';
import { canManageFinding } from '../../../lib/permissions';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context); if (csrf) return csrf;
  const auth = requireApiUser(context); if (isResponse(auth)) return auth;
  const parsed = findingCreateSchema.safeParse(Object.fromEntries(await context.request.formData()));
  if (!parsed.success) return json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid Finding.' }, 400);
  if (!canManageFinding(auth, { owner: parsed.data.owner })) return json({ ok: false, error: 'Employees can create assigned Findings only.' }, 403);
  try { const id = createFinding(parsed.data, auth.id); if ((context.request.headers.get('accept') ?? '').includes('text/html')) return Response.redirect(new URL(`/findings/${id}`, context.url), 303); return json({ ok: true, id }, 201); } catch (error) { return json({ ok: false, error: error instanceof Error ? error.message : 'Unable to create Finding.' }, 400); }
};
