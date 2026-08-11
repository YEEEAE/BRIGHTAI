import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { getFinding, upsertRca } from '../../../../lib/qc-operations';
import { rcaSchema, parsePositiveId } from '../../../../lib/validation';
import { canEditFindingContent } from '../../../../lib/permissions';
export const POST: APIRoute = async (context) => { const csrf = requireCsrf(context); if (csrf) return csrf; const auth = requireApiUser(context); if (isResponse(auth)) return auth; const id = parsePositiveId(context.params.id); if (!id) return new Response('Invalid id', { status: 400 }); const finding = getFinding(id); if (!finding || !canEditFindingContent(auth, finding)) return new Response('Forbidden', { status: finding ? 403 : 404 }); const parsed = rcaSchema.safeParse(Object.fromEntries(await context.request.formData())); if (!parsed.success) return new Response(parsed.error.issues[0]?.message ?? 'Invalid RCA', { status: 400 }); upsertRca(id, parsed.data, auth.id); return Response.redirect(new URL(`/findings/${id}`, context.url), 303); };
