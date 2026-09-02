// POST /api/findings/[id]/evidence — attach an evidence item to the finding
// (or to one of its CAPAs via capa_id). HTML form posts redirect back to the
// finding (303); errors follow the shared JSON contract (apiJsonError).
import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { getFinding, addEvidence, DomainRuleError } from '../../../../lib/qc-operations';
import { evidenceSchema, parsePositiveId } from '../../../../lib/validation';
import { canEditFindingContent } from '../../../../lib/permissions';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;

  const id = parsePositiveId(context.params.id);
  if (!id) return apiJsonError('Invalid Finding id.', 400);

  const finding = getFinding(id);
  if (!finding) return apiJsonError('Finding not found.', 404);
  if (!canEditFindingContent(auth, finding)) {
    return apiJsonError('Finding not found.', 404);
  }

  const parsed = evidenceSchema.safeParse(Object.fromEntries(await context.request.formData()));
  if (!parsed.success) return apiJsonError(parsed.error.issues[0]?.message ?? 'Invalid evidence.', 400);

  try {
    addEvidence(
      { findingId: id, capaId: parsed.data.capa_id, description: parsed.data.description, reference: parsed.data.reference },
      auth.id,
    );
    return Response.redirect(new URL(`/findings/${id}`, context.url), 303);
  } catch (error) {
    if (error instanceof DomainRuleError) return apiJsonError(error.message, 400);
    return apiJsonError('Evidence update failed. Try again — if the problem persists, contact an administrator.', 500);
  }
};
