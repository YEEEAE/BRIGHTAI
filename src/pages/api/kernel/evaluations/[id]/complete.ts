/**
 * src/pages/api/kernel/evaluations/[id]/complete.ts — EVAL-CERT-003.
 *
 * POST: إنهاء run (complete) + حساب الديجست/البوابة نهائيًا + تجميد.
 *
 * القواعد:
 *   - فقط run بكل حالاته مسجلة (completedCases >= totalCases لو totalCases > 0).
 *   - بمجرد complete → immutable = true، لا مزيد من addCase/update.
 *   - يضبط finishedAt + النتيجة النهائية.
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../../lib/kernel-certs/admin-auth';
import { getCertsContext } from '../../../../../lib/kernel-certs/facade';
import { appendAuditEvent } from '../../../../../lib/kernel-certs/prisma-store';
import {
  computeRunDigests,
  costOf,
  deriveGate,
  latencies,
} from '../../../../../lib/kernel-certs/eval-service';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const id = params.id;
  if (!id) return json({ error: 'missing_id' }, 400);

  const ctx = getCertsContext();
  const run = await ctx.store.getRun(id);
  if (!run) return json({ error: 'run_not_found' }, 404);
  if (run.immutable) return json({ error: 'already_complete' }, 409);

  const cases = await ctx.store.getCases(id);
  if (run.totalCases > 0 && cases.length < run.totalCases) {
    return json({ error: 'run_incomplete', has: cases.length, expected: run.totalCases }, 400);
  }

  const now = new Date().toISOString();
  const gate = deriveGate(cases);
  const lat = latencies(cases);
  const cost = costOf(cases);
  const failedCases = cases.filter((x) => x.state === 'fail' || x.state === 'blocked').length;
  const criticalCount = cases.filter(
    (x) => x.riskLevel === 'critical' && x.piiTypes.length > 0,
  ).length;
  const humanReviewCount = cases.filter((x) => x.state === 'human-review').length;
  const digests = computeRunDigests({
    evaluationId: run.evaluationId,
    version: run.version + 1,
    cases,
    inputHash: run.inputHash,
  });

  const completed = await ctx.store.updateRun({
    ...run,
    status: 'complete',
    gate,
    cases,
    completedCases: cases.length,
    failedCases,
    criticalCount,
    humanReviewCount,
    costSar: cost,
    p50Ms: lat.p50,
    p95Ms: lat.p95,
    p99Ms: lat.p99,
    ...digests,
    finishedAt: now,
    version: run.version,
    immutable: true,
    updatedAt: now,
  });

  await appendAuditEvent({ evaluationId: id, action: 'complete', metadata: { gate } });

  return json({
    ok: true,
    run: completed,
    canIssueCertificate: gate === 'passed' || gate === 'passed-with-findings',
  });
};