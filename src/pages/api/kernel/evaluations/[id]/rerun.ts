/**
 * src/pages/api/kernel/evaluations/[id]/rerun.ts — EVAL-CERT-005.
 *
 * POST: تصحيح/إعادة تشغيل run. القاعدة الحاكمة: لا تعديل لـ run مكتمل —
 * أي تصحيح ينشئ نسخة مرتبطة بـ parentEvaluationId (لا يعدّل الأصل أبدًا).
 *
 * النسخة الجديدة تبدأ بحالة running وتنفصل عن الأصل؛ عند اكتمالها تُصدر
 * شهادة جديدة (لا نلغي القديمة تلقائيًا — تُترك للسحب اليدوي).
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../../lib/kernel-certs/admin-auth';
import { getCertsContext } from '../../../../../lib/kernel-certs/facade';
import { appendAuditEvent } from '../../../../../lib/kernel-certs/prisma-store';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const id = params.id;
  if (!id) return json({ error: 'missing_id' }, 400);

  const ctx = getCertsContext();
  const original = await ctx.store.getRun(id);
  if (!original) return json({ error: 'run_not_found' }, 404);

  const now = new Date().toISOString();
  const newEvalId = `${original.evaluationId}-R${Date.now().toString(36).toUpperCase()}`;

  const copy: typeof original = {
    ...structuredClone(original),
    evaluationId: newEvalId,
    parentEvaluationId: original.evaluationId,
    status: 'running',
    gate: 'incomplete',
    startedAt: now,
    finishedAt: undefined,
    completedCases: 0,
    failedCases: 0,
    criticalCount: 0,
    humanReviewCount: 0,
    costSar: 0,
    p50Ms: 0,
    p95Ms: 0,
    p99Ms: 0,
    inputHash: '',
    outputHash: '',
    runHash: '',
    version: 1,
    immutable: false,
    cases: [],
    createdAt: now,
    updatedAt: now,
  };

  const created = await ctx.store.createRun(copy);
  await appendAuditEvent({
    evaluationId: newEvalId,
    action: 'rerun',
    metadata: { parentEvaluationId: original.evaluationId },
  });

  return json({ ok: true, run: created }, 201);
};