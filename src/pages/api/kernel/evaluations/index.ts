/**
 * src/pages/api/kernel/evaluations/index.ts — EVAL-CERT-001 (2026-08-03).
 *
 * إنشاء سجل تقييم (run) على الخادم + قائمة الـ runs.
 *
 * القواعد (من kernel-certs/eval-service.ts):
 *   - POST: ينشئ run جديد بحالة running/partial؛ الـ setup (dataset/model/
 *     policy/prompt/scorers/env/provider) إلزامي كـ إصدارات (نسخ).
 *   - GET: قائمة آخر 50 run (عرض إداري).
 *
 * Admin-auth (x-brightai-admin-key) لكل العمليات. لا توجد مكالمات Provider
 * هنا — تسجيل وتعقب فقط.
 *
 * Astro: prerender = false (SSR). Excluded من sitemap تلقائيًا
 * (filter: !page.includes('/api/')).
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../lib/kernel-certs/admin-auth';
import { getCertsContext } from '../../../../lib/kernel-certs/facade';
import { appendAuditEvent } from '../../../../lib/kernel-certs/prisma-store';
import { hashOf } from '../../../../lib/kernel-certs/eval-service';

export const prerender = false;

function sanitize(run: Record<string, unknown>) {
  // لا نسرب تفاصيل داخلية (hash كل ما يلزم للشاشة + المراجع العامة).
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
  };
}

export const POST: APIRoute = async ({ request }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) {
    return json({ error: auth.reason }, auth.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const b = (body ?? {}) as Record<string, unknown>;

  // Setup validation (نسخ إصدارات مركّبة).
  const setup = b.setup as Record<string, unknown> | undefined;
  const dataset = (setup?.dataset ?? {}) as Record<string, unknown>;
  const model = (setup?.model ?? {}) as Record<string, unknown>;
  const policy = (setup?.policy ?? {}) as Record<string, unknown>;
  const prompt = (setup?.prompt ?? {}) as Record<string, unknown>;
  const scorers = Array.isArray(setup?.scorers) ? (setup.scorers as Array<Record<string, unknown>>) : [];

  const required = [
    ['dataset.id', dataset.id],
    ['dataset.version', dataset.version],
    ['dataset.hash', dataset.hash],
    ['model.id', model.id],
    ['model.name', model.name],
    ['model.version', model.version],
    ['model.provider', model.provider],
    ['policy.id', policy.id],
    ['policy.version', policy.version],
    ['prompt.id', prompt.id],
    ['prompt.version', prompt.version],
  ] as const;
  const missing = required.find(([, v]) => v === undefined || v === null || v === '');
  if (missing) {
    return json({ error: 'missing_setup_field', field: missing[0] }, 400);
  }

  const environment = ['demo', 'test', 'live'].includes(String(setup?.environment))
    ? String(setup?.environment)
    : 'demo';
  const provider = String(setup?.provider ?? 'simulated');
  const seed = Number.isFinite(Number(b.seed)) ? Number(b.seed) : undefined;
  const temperature = Number.isFinite(Number(b.temperature)) ? Number(b.temperature) : undefined;
  const totalCases = Number.isInteger(Number(b.totalCases)) ? Number(b.totalCases) : 0;
  const evaluationId = String(b.evaluationId ?? `EVAL-${Date.now().toString(36).toUpperCase()}`);

  const now = new Date().toISOString();
  const policyHash = hashOf({ id: policy.id, version: policy.version });

  const ctx = getCertsContext();
  const run = await ctx.store.createRun({
    evaluationId,
    name: String(b.name ?? `تقييم ${evaluationId}`),
    status: 'running',
    gate: 'incomplete',
    environment: environment as never,
    provider,
    model: {
      modelId: String(model.id),
      modelName: String(model.name),
      modelVersion: Number(model.version),
      provider: String(model.provider),
    },
    tester: {
      datasetId: String(dataset.id),
      datasetName: String(dataset.name ?? dataset.id),
      datasetVersion: Number(dataset.version),
      datasetHash: String(dataset.hash),
    },
    policy: {
      policyId: String(policy.id),
      policyName: String(policy.name ?? policy.id),
      policyVersion: Number(policy.version),
    },
    policyHash,
    prompt: {
      promptId: String(prompt.id),
      promptVersion: Number(prompt.version),
    },
    scorers: scorers.map((s) => ({ id: String(s.id ?? s.scorerId), version: Number(s.version ?? 1) })),
    seed,
    temperature,
    startedAt: now,
    totalCases,
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
  });

  await appendAuditEvent({ evaluationId, action: 'create', metadata: { env: environment, provider } });

  return json({ ok: true, run: sanitize(run as unknown as Record<string, unknown>) }, 201);
};

export const GET: APIRoute = async ({ request }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) {
    return json({ error: auth.reason }, auth.status);
  }
  const ctx = getCertsContext();
  const runs = await ctx.store.listRuns(50);
  return json({
    ok: true,
    runs: runs.map((r) => sanitize(r as unknown as Record<string, unknown>)),
  });
};
