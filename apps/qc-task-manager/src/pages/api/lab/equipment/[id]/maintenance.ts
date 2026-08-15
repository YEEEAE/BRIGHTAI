import type { APIRoute } from 'astro';
import { isResponse, requireApiUser, requireCsrf } from '../../../../../lib/api-security';
import { setFlash } from '../../../../../lib/flash';
import { parsePositiveId, parseFormData, labMaintenanceSchema } from '../../../../../lib/validation';
import { canRecordLabEquipmentMaintenance } from '../../../../../lib/permissions';
import { createLabEquipmentMaintenance } from '../../../../../lib/lab/equipment';

/**
 * POST /api/lab/equipment/[id]/maintenance — log an append-only maintenance
 * event (contract §5.2, page reference §36).
 *
 * Self-submitting form from /lab/equipment/[id]/maintenance posts here (Astro
 * 6 pages have no named request handlers — same pattern as the Review Center
 * API). Defense in depth: requireCsrf + requireApiUser + the supervisor+
 * LAB_EQUIPMENT_MAINTENANCE role check, the equipment id from the matched
 * path only (never the body), and the shared Zod schema. The service inserts
 * the event and writes the CREATE audit in one transaction. Maintenance
 * events are append-only — there is no edit/delete surface.
 */
export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;
  const auth = requireApiUser(context);
  if (isResponse(auth)) return auth;

  const id = parsePositiveId(context.params.id);
  if (!id) {
    setFlash(context, 'error', 'Invalid equipment id.');
    return context.redirect('/lab/equipment');
  }
  const backUrl = `/lab/equipment/${id}/maintenance`;

  if (!canRecordLabEquipmentMaintenance(auth.role)) {
    setFlash(context, 'error', 'You do not have permission to record equipment maintenance.');
    return context.redirect(backUrl);
  }

  const form = await context.request.formData();
  const parsed = parseFormData(labMaintenanceSchema, form);
  if (!parsed.ok) {
    setFlash(context, 'error', parsed.error);
    return context.redirect(backUrl);
  }

  try {
    createLabEquipmentMaintenance(id, parsed.data, auth.id);
    setFlash(context, 'success', 'Maintenance event recorded.');
  } catch (err) {
    console.error('[lab] maintenance create failure', err);
    setFlash(context, 'error', err instanceof Error ? err.message : 'Could not record the maintenance event.');
  }
  return context.redirect(backUrl);
};