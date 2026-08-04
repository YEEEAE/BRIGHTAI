/**
 * src/pages/api/kernel/audit/index.ts — EVAL-CERT-017.
 *
 * قائمة أحداث التدقيق (audit trail) — الأحدث أولًا. Admin-auth.
 *
 * الفلاتر (query params):
 *   - evaluationId → أحداث run واحد.
 *   - action       → create/update/case/resume/rerun/complete/reject/
 *                    issue/verify/revoke.
 *   - limit        → الحد الأقصى (الافتراضي 50، أقصى 200).
 *
 * الشيفرة (hash) تُرَد للعرض — يمكن للعميل بناء السلسلة من prevHash
 * للتأكد من عدم التلاعب (tamper-evidence). لا يُكشَف شيء إضافي.
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../lib/kernel-certs/admin-auth';
import { listAuditEvents } from '../../../../lib/kernel-certs/prisma-store';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const evaluationId = url.searchParams.get('evaluationId')?.trim() || undefined;
  const action = url.searchParams.get('action')?.trim() || undefined;
  const limitRaw = Number(url.searchParams.get('limit') ?? 50);
  const limit = Number.isInteger(limitRaw)
    ? Math.min(200, Math.max(1, limitRaw))
    : 50;

  const events = await listAuditEvents({ evaluationId, action, limit });
  return json({ ok: true, events });
};
