// POST /api/findings/[id]/capa — create/update a CAPA, or transition its
// status (EFFECTIVE / CLOSED need manager approval). HTML form posts redirect
// back to the finding (303); errors follow the shared JSON contract
// (apiJsonError) so a raw exception message never reaches the browser.
import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../../lib/api-security';
import { getFinding, upsertCapa, transitionCapa, DomainRuleError } from '../../../../lib/qc-operations';
import { capaSchema, capaActionSchema, parsePositiveId } from '../../../../lib/validation';
import { canManageFinding, canEditFindingContent, canApproveCapa } from '../../../../lib/permissions';
import { withIdempotency } from '../../../../lib/idempotency';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;

  const id = parsePositiveId(context.params.id);
  if (!id) return apiJsonError('Invalid Finding id.', 400);

  const finding = getFinding(id);
  if (!finding) return apiJsonError('Finding not found.', 404);
  if (!canManageFinding(auth, finding)) return apiJsonError('Finding not found.', 404);

  const formData = await context.request.formData();
  const body = Object.fromEntries(formData);

  return await withIdempotency(
    context,
    auth,
    async () => {
      try {
        if (body.status) {
          const parsed = capaActionSchema.safeParse(body);
          if (!parsed.success) return apiJsonError(parsed.error.issues[0]?.message ?? 'Invalid CAPA action.', 400);
          if ((parsed.data.status === 'EFFECTIVE' || parsed.data.status === 'CLOSED') && !canApproveCapa(auth.role)) {
            return apiJsonError('Manager approval is required.', 403);
          }
          if (!finding.capa) return apiJsonError('CAPA not found.', 404);
          transitionCapa(Number(finding.capa.id), parsed.data.status, auth.id, parsed.data.decision);
        } else {
          if (!canEditFindingContent(auth, finding)) {
            return apiJsonError('Supervisors review CAPA; content edits require an assigned employee, manager, or admin.', 403);
          }
          const parsed = capaSchema.safeParse(body);
          if (!parsed.success) return apiJsonError(parsed.error.issues[0]?.message ?? 'Invalid CAPA.', 400);
          upsertCapa(id, parsed.data, auth.id);
        }
        return Response.redirect(new URL(`/findings/${id}`, context.url), 303);
      } catch (error) {
        if (error instanceof DomainRuleError) return apiJsonError(error.message, 400);
        const isBusy = (error && typeof error === 'object' && ('code' in error && error.code === 'SQLITE_BUSY')) ||
          (error instanceof Error && /sqlite_busy|database is locked/i.test(error.message));
        if (isBusy) {
          const busyRes = apiJsonError('Database is currently busy. Try again shortly.', 503, 'DB');
          busyRes.headers.set('Retry-After', '2');
          return busyRes;
        }
        return apiJsonError('CAPA update failed. Try again — if the problem persists, contact an administrator.', 500);
      }
    },
    { payload: body },
  );
};
