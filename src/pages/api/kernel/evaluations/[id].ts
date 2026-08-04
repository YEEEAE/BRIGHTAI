/**
 * src/pages/api/kernel/evaluations/[id].ts — EVAL-CERT-014.
 *
 * تفاصيل/تعديل/رفض run مفرد. Admin-auth لكل العمليات.
 *
 *   - GET    → يعيد الـ run مع حالاته (cases) كاملة.
 *   - PATCH  → تحديث بيانات وصفية آمنة (name/provider/environment)
 *              لـ run غير مجمّد فقط. لا يُعدَّل status/gate/immutable
 *              من هنا — دورة الحياة عبر cases/complete/rerun.
 *   - DELETE → "reject": وضع علامة رفض على الـ run (status='failed') +
 *              سبب + audit event. لا حذف فعلي — الـ run مصدر إثبات.
 *              لا يُرفض run مكتمل (immutable).
 *
 * القواعد (eval-service.ts): optimistic lock عبر version، والـ immutable
 * يمنع أي تعديل على run مكتمل.
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../lib/kernel-certs/admin-auth';
import { getCertsContext } from '../../../../lib/kernel-certs/facade';
import { appendAuditEvent } from '../../../../lib/kernel-certs/prisma-store';
import type { StoredEvaluationRun } from '../../../../lib/kernel-certs/eval-service';

export const prerender = false;

const ENVIRONMENTS = ['demo', 'test', 'live'];

function sanitizeCase(c: Record<string, unknown>) {
  return {
    caseId: c.caseId,
    traceId: c.traceId,
    state: c.state,
    riskLevel: c.riskLevel,
    piiTypes: c.piiTypes ?? [],
    injectionDetected: c.injectionDetected ?? false,
    scorerResults: c.scorerResults ?? [],
    costSar: c.costSar,
    latencyMs: c.latencyMs,
    createdAt: c.createdAt,
  };
}

function sanitizeRun(run: Record<string, unknown>, cases: unknown[]) {
  return {
    evaluationId: run.evaluationId,
    parentEvaluationId: run.parentEvaluationId ?? null,
    name: run.name,
    status: run.status,
    gate: run.gate,
    environment: run.environment,
    provider: run.provider,
    model: run.model,
    tester: run.tester,
    policy: run.policy,
    prompt: run.prompt,
    scorers: run.scorers,
    totalCases: run.totalCases,
    completedCases: run.completedCases,
    failedCases: run.failedCases,
    criticalCount: run.criticalCount,
    humanReviewCount: run.humanReviewCount,
    costSar: run.costSar,
    p50Ms: run.p50Ms,
    p95Ms: run.p95Ms,
    p99Ms: run.p99Ms,
    version: run.version,
    immutable: run.immutable,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt ?? null,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    cases: cases.map((c) => sanitizeCase(c as Record<string, unknown>)),
  };
}

export const GET: APIRoute = async ({ request, params }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const id = params.id;
  if (!id || id.length > 120) return json({ error: 'invalid_id' }, 400);

  const ctx = getCertsContext();
  const run = await ctx.store.getRun(id);
  if (!run) return json({ error: 'run_not_found' }, 404);

  const cases = await ctx.store.getCases(id);
  return json({
    ok: true,
    run: sanitizeRun(run as unknown as Record<string, unknown>, cases),
  });
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const id = params.id;
  if (!id || id.length > 120) return json({ error: 'invalid_id' }, 400);

  const ctx = getCertsContext();
  const run = await ctx.store.getRun(id);
  if (!run) return json({ error: 'run_not_found' }, 404);
  if (run.immutable) return json({ error: 'run_immutable' }, 409);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const next: StoredEvaluationRun = { ...run };
  const changed: string[] = [];

  if (b.name !== undefined) {
    const name = String(b.name);
    if (name.length < 2 || name.length > 200) return json({ error: 'invalid_name' }, 400);
    next.name = name;
    changed.push('name');
  }
  if (b.provider !== undefined) {
    const provider = String(b.provider);
    if (provider.length < 1 || provider.length > 60) return json({ error: 'invalid_provider' }, 400);
    next.provider = provider;
    changed.push('provider');
  }
  if (b.environment !== undefined) {
    const env = String(b.environment);
    if (!ENVIRONMENTS.includes(env)) return json({ error: 'invalid_environment' }, 400);
    next.environment = env as StoredEvaluationRun['environment'];
    changed.push('environment');
  }

  if (changed.length === 0) {
    return json({ error: 'nothing_to_update' }, 400);
  }

  const updated = await ctx.store.updateRun({ ...next, updatedAt: new Date().toISOString() });
  await appendAuditEvent({
    evaluationId: id,
    action: 'update',
    metadata: { changed, version: updated.version },
  });

  return json({ ok: true, run: sanitizeRun(updated as unknown as Record<string, unknown>, await ctx.store.getCases(id)) });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const id = params.id;
  if (!id || id.length > 120) return json({ error: 'invalid_id' }, 400);

  const ctx = getCertsContext();
  const run = await ctx.store.getRun(id);
  if (!run) return json({ error: 'run_not_found' }, 404);
  if (run.immutable) return json({ error: 'run_immutable' }, 409);

  let reason = 'rejected';
  let body: unknown;
  try {
    body = await request.json();
    const r = String((body as Record<string, unknown>)?.reason ?? '');
    if (r.trim()) reason = r.trim().slice(0, 500);
  } catch {
    // no body / invalid json → reject without reason
  }

  const now = new Date().toISOString();
  const rejected = await ctx.store.updateRun({
    ...run,
    status: 'failed',
    finishedAt: now,
    version: run.version,
    updatedAt: now,
  });

  await appendAuditEvent({
    evaluationId: id,
    action: 'reject',
    metadata: { reason, version: rejected.version },
  });

  return json({ ok: true, run: sanitizeRun(rejected as unknown as Record<string, unknown>, await ctx.store.getCases(id)) });
};
