/**
 * src/pages/api/kernel/certificates/[id]/verify.ts — EVAL-CERT-016.
 *
 * POST: تحقق عام من شهادة عبر مسار REST (بديل للتحقق عبر ?id= في verify.ts).
 *
 * لا مصادقة إدارية — للعملاء الذين يحملون رابط التحقق. يعيد حالة صريحة:
 * valid | revoked | tampered | digest-mismatch | not-found |
 * key-missing | incomplete.
 *
 * يُرِد أيضًا نسخة عامة من الـ cert للعرض.
 */

import type { APIRoute } from 'astro';
import { json } from '../../../../../lib/kernel-certs/admin-auth';
import { buildCertDeps, getCertsContext } from '../../../../../lib/kernel-certs/facade';
import { verifyCertificate, type StoredCertificate } from '../../../../../lib/kernel-certs/cert-service';

export const prerender = false;

function safeCert(cert: StoredCertificate) {
  return {
    certificateId: cert.certificateId,
    gate: cert.gate,
    environment: cert.environment,
    signedBy: cert.signedBy,
    issuedAt: cert.issuedAt,
    revokedAt: cert.revokedAt ?? null,
    revokeReason: cert.revocationReason ?? null,
    verifyUrl: cert.payload.verifyUrl,
  };
}

export const POST: APIRoute = async ({ params, url }) => {
  const certificateId = params.id;
  if (!certificateId) return json({ error: 'missing_id' }, 400);
  if (certificateId.length > 200) return json({ error: 'invalid_id' }, 400);

  const ctx = getCertsContext();
  const deps = buildCertDeps(ctx);
  const result = await verifyCertificate(certificateId, deps);

  return json(
    {
      ok: result.status === 'valid',
      status: result.status,
      reason: result.reason,
      cert: result.cert ? safeCert(result.cert) : null,
    },
    result.status === 'not-found' ? 404 : 200,
  );
};