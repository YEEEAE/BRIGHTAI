/**
 * src/pages/api/kernel/certificates/index.ts — EVAL-CERT-015.
 *
 * قائمة الشهادات + إصدار شهادة. Admin-auth للعمليتين.
 *
 *   - GET  → قائمة آخر 50 شهادة (عرض إداري). لا تُسرَّب الحمولة الكاملة
 *            ولا التوقيع — نسخة عامة (gate/environment/issued/revoked).
 *   - POST → إصدار شهادة لـ run مكتمل (نفس قواعد issue.ts:
 *            run_not_complete → 400، blocked → 400، no_signing_key → 503،
 *            duplicate → 409، run_not_found → 404).
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../lib/kernel-certs/admin-auth';
import { buildCertDeps, getCertsContext } from '../../../../lib/kernel-certs/facade';
import { issueCertificate, type StoredCertificate } from '../../../../lib/kernel-certs/cert-service';
import { appendAuditEvent } from '../../../../lib/kernel-certs/prisma-store';

export const prerender = false;

function sanitizeCert(cert: StoredCertificate) {
  return {
    certificateId: cert.certificateId,
    evaluationId: cert.evaluationId,
    gate: cert.gate,
    environment: cert.environment,
    signedBy: cert.signedBy,
    issuedAt: cert.issuedAt,
    verifyUrl: cert.payload.verifyUrl,
    revokedAt: cert.revokedAt ?? null,
    revocationReason: cert.revocationReason ?? null,
  };
}

export const GET: APIRoute = async ({ request }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const ctx = getCertsContext();
  const certs = await ctx.certStore.listCerts(50);
  return json({ ok: true, certs: certs.map(sanitizeCert) });
};

export const POST: APIRoute = async ({ request }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const evaluationId = String((body as Record<string, unknown>)?.evaluationId ?? '');
  if (!evaluationId) return json({ error: 'missing_evaluation_id' }, 400);

  const ctx = getCertsContext();
  const run = await ctx.store.getRun(evaluationId);
  if (!run) return json({ error: 'run_not_found' }, 404);

  const deps = buildCertDeps(ctx);
  const res = await issueCertificate(run, deps);
  if (res.ok === false) {
    const status = res.code === 'no_signing_key' ? 503 : res.code === 'exists' ? 409 : 400;
    return json({ ok: false, code: res.code, message: res.message }, status);
  }

  await appendAuditEvent({
    evaluationId,
    certificateId: res.cert.certificateId,
    action: 'issue',
  });

  return json({ ok: true, cert: sanitizeCert(res.cert) }, 201);
};
