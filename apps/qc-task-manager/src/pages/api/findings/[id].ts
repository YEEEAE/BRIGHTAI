import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { getFinding, updateFinding, transitionFinding, recordQcAudit } from '../../../lib/qc-operations';
import { findingActionSchema, findingUpdateSchema } from '../../../lib/validation';
import { canManageFinding, canEditFindingContent, canApproveFinding } from '../../../lib/permissions';
import { canReviewFinding } from '../../../lib/findings';
import { parsePositiveId } from '../../../lib/validation';
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
export const PATCH: APIRoute = async (context) => {
  const csrf = requireCsrf(context); if (csrf) return csrf; const auth = requireApiUser(context); if (isResponse(auth)) return auth;
  const id = parsePositiveId(context.params.id); if (!id) return json({ ok: false, error: 'Invalid Finding id.' }, 400); const finding = getFinding(id); if (!finding) return json({ ok: false, error: 'Finding not found.' }, 404);
  if (!canManageFinding(auth, finding)) return json({ ok: false, error: 'You cannot update this Finding.' }, 403);
  const body = Object.fromEntries(await context.request.formData()); const action = findingActionSchema.safeParse(body);
  try {
    if (!body.action && !canEditFindingContent(auth, finding)) return json({ ok: false, error: 'Supervisors review Findings; content edits require an assigned employee, manager, or admin.' }, 403);
    if (body.action) { if (!action.success) return json({ ok: false, error: action.error.issues[0]?.message ?? 'Invalid action.' }, 400); if (action.data.action === 'approve' && !canApproveFinding(auth.role)) return json({ ok: false, error: 'Manager approval is required.' }, 403); if (action.data.action === 'reject' && !canReviewFinding(auth.role)) return json({ ok: false, error: 'Supervisor review is required.' }, 403); if (action.data.action === 'close' || action.data.action === 'reopen' || action.data.action === 'status') { if (action.data.closure_evidence) updateFinding(id, { closure_evidence: action.data.closure_evidence }, auth.id); const status = action.data.action === 'close' ? 'CLOSED' : action.data.action === 'reopen' ? 'REOPENED' : action.data.status; if (status) transitionFinding(id, status, auth.id, action.data.note); } else { const nextStatus = action.data.action === 'approve' ? 'VERIFICATION' : 'ACTION_REQUIRED'; transitionFinding(id, nextStatus, auth.id, action.data.note); recordQcAudit('FINDING', id, Number(finding.task_id), auth.id, action.data.action === 'approve' ? 'APPROVAL' : 'REJECTION', finding.status, nextStatus, action.data.note ?? null); } }
    else { const parsed = findingUpdateSchema.safeParse(body); if (!parsed.success) return json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid Finding.' }, 400); updateFinding(id, parsed.data, auth.id); }
    return json({ ok: true, id });
  } catch (error) { return json({ ok: false, error: error instanceof Error ? error.message : 'Finding update failed.' }, 400); }
};
