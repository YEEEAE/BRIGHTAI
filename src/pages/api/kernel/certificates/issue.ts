/**
 * src/pages/api/kernel/certificates/issue.ts — EVAL-CERT-006.
 *
 * POST: إصدار شهادة لـ run مكتمل. Admin-auth.
 *
 * القواعد (cert-service.ts):
 *   - run.status !== 'complete' → 400 'run_not_complete'.
 *   - لا signing key → 503 no_signing_key.
 *   - مصدّر واحد لكل run (exists) → إن وجد، يعيد 409.
 *   - payload موقّع: canonical JSON → sha256 digest → Ed25519 (SHA-256).
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../lib/kernel-certs/admin-auth';
import { buildCertDeps, getCertsContext } from '../../../../lib/kernel-certs/facade';
import { issueCertificate } from '../../../../lib/kernel-certs/cert-service';
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

  return json({ ok: true, cert: res.cert }, 201);
};