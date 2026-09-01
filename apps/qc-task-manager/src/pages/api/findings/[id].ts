import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { getFinding, updateFinding, transitionFinding, recordQcAudit, DomainRuleError } from '../../../lib/qc-operations';
import { findingActionSchema, findingUpdateSchema } from '../../../lib/validation';
import { canManageFinding, canEditFindingContent, canApproveFinding, canReviewFinding } from '../../../lib/permissions';
import { parsePositiveId } from '../../../lib/validation';
export const PATCH: APIRoute = async (context) => {
  const csrf = requireCsrf(context); if (csrf) return csrf; const auth = requireApiUser(context); if (isResponse(auth)) return auth;
  const id = parsePositiveId(context.params.id); if (!id) return apiJsonError('Invalid Finding id.', 400); const finding = getFinding(id); if (!finding) return apiJsonError('Finding not found.', 404);
  if (!canManageFinding(auth, finding)) return apiJsonError('You cannot update this Finding.', 403);
  const body = Object.fromEntries(await context.request.formData()); const action = findingActionSchema.safeParse(body);
  try {
    if (!body.action && !canEditFindingContent(auth, finding)) return apiJsonError('Supervisors review Findings; content edits require an assigned employee, manager, or admin.', 403);
    if (body.action) { if (!action.success) return apiJsonError(action.error.issues[0]?.message ?? 'Invalid action.', 400); if (action.data.action === 'approve' && !canApproveFinding(auth.role)) return apiJsonError('Manager approval is required.', 403); if (action.data.action === 'reject' && !canReviewFinding(auth.role)) return apiJsonError('Supervisor review is required.', 403); if (action.data.action === 'close' || action.data.action === 'reopen' || action.data.action === 'status') { if (action.data.closure_evidence) updateFinding(id, { closure_evidence: action.data.closure_evidence }, auth.id); const status = action.data.action === 'close' ? 'CLOSED' : action.data.action === 'reopen' ? 'REOPENED' : action.data.status; if (status) transitionFinding(id, status, auth.id, action.data.note); } else { const nextStatus = action.data.action === 'approve' ? 'VERIFICATION' : 'ACTION_REQUIRED'; transitionFinding(id, nextStatus, auth.id, action.data.note); recordQcAudit('FINDING', id, Number(finding.task_id), auth.id, action.data.action === 'approve' ? 'APPROVAL' : 'REJECTION', finding.status, nextStatus, action.data.note ?? null); } }
    else { const parsed = findingUpdateSchema.safeParse(body); if (!parsed.success) return apiJsonError(parsed.error.issues[0]?.message ?? 'Invalid Finding.', 400); updateFinding(id, parsed.data, auth.id); }
    return apiJson({ id });
  } catch (error) {
    if (error instanceof DomainRuleError) return apiJsonError(error.message, 400);
    return apiJsonError('Finding update failed. Try again — if the problem persists, contact an administrator.', 500);
  }
};
