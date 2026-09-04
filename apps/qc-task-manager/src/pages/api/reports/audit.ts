import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser } from '../../../lib/api-security';
import { authorizeReportAudit } from '../../../lib/reporting/authorization';
import { listReportAuditLog } from '../../../lib/reporting/reader';

export const GET: APIRoute = (context) => {
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;
  const authorization = authorizeReportAudit({ id: auth.id, role: auth.role, department: auth.department });
  if (!authorization.allowed) return apiJsonError(authorization.reason ?? 'You do not have permission to view report audit.', 403);
  const rows = listReportAuditLog(authorization.ownOnly, auth.id);
  if (!rows) return apiJsonError('Could not load report audit.', 500);
  return apiJson({ rows });
};
