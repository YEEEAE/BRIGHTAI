/**
 * src/pages/api/kernel/certificates/verify.ts — EVAL-CERT-007.
 *
 * GET: تحقق عام من شهادة عبر الرابط (لا مصادقة إدارية — للعملاء).
 * يعيد حالة صريحة: valid | revoked | tampered | digest-mismatch |
 * not-found | key-missing | incomplete.
 *
 * يُرِد أيضًا نسخة مخففة من الـ payload (بلد sign) للعرض.
 */

import type { APIRoute } from 'astro';
import { json } from '../../../../lib/kernel-certs/admin-auth';
import { buildCertDeps, getCertsContext } from '../../../../lib/kernel-certs/facade';
import { verifyCertificate } from '../../../../lib/kernel-certs/cert-service';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const certificateId = url.searchParams.get('id');
  if (!certificateId) return json({ error: 'missing_id' }, 400);

  const ctx = getCertsContext();
  const deps = buildCertDeps(ctx);
  const result = await verifyCertificate(certificateId, deps);

  const safeCert = result.cert
    ? {
        certificateId: result.cert.certificateId,
        gate: result.cert.gate,
        environment: result.cert.environment,
        signedBy: result.cert.signedBy,
        issuedAt: result.cert.issuedAt,
        revokedAt: result.cert.revokedAt ?? null,
        revokeReason: result.cert.revocationReason ?? null,
        verifyUrl: result.cert.payload.verifyUrl,
      }
    : null;

  return json(
    {
      ok: result.status === 'valid',
      status: result.status,
      reason: result.reason,
      cert: safeCert,
    },
    result.status === 'not-found' ? 404 : 200,
  );
};