/**
 * src/pages/api/kernel/certificates/revoke.ts — EVAL-CERT-008.
 *
 * POST: سحب شهادة (إبطال). Admin-auth. لا حذف — سجّل revokedAt + السبب.
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../lib/kernel-certs/admin-auth';
import { buildCertDeps, getCertsContext } from '../../../../lib/kernel-certs/facade';
import { revokeCertificate } from '../../../../lib/kernel-certs/cert-service';
import { appendAuditEvent } from '../../../../lib/kernel-certs/prisma-store';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const certificateId = String((body as Record<string, unknown>)?.certificateId ?? '');
  const reason = String((body as Record<string, unknown>)?.reason ?? 'suspended');
  if (!certificateId) return json({ error: 'missing_certificate_id' }, 400);

  const ctx = getCertsContext();
  const deps = buildCertDeps(ctx);
  const res = await revokeCertificate(certificateId, { revokedBy: 'admin', reason }, deps);
  if (res.ok === false) {
    return json({ ok: false, code: res.code, message: res.message }, res.code === 'not_found' ? 404 : 400);
  }

  await appendAuditEvent({
    evaluationId: res.cert.evaluationId || certificateId,
    certificateId,
    action: 'revoke',
    metadata: { reason },
  });

  return json({ ok: true, cert: res.cert });
};