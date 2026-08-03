/**
 * src/pages/api/kernel/evaluations/[id]/cases.ts — EVAL-CERT-002.
 *
 * POST: تسجيل حالة (case) واحدة داخل run. Admin-auth.
 *
 * القواعد (eval-service.ts):
 *   - لا يُقبل على run مكتمل (immutable) → 409 'run_immutable'.
 *   - منع تكرار (caseId, runId) → 409 'duplicate'.
 *   - يحفظ المدخل/المخرجات + hashes + قرار السكوررز.
 *   - بعد الحفظ يعيد احتساب العدادات/الديجست/البوابة عبر updateRun.
 */

import type { APIRoute } from 'astro';
import { isAdminAuthorized, json } from '../../../../../lib/kernel-certs/admin-auth';
import { getCertsContext } from '../../../../../lib/kernel-certs/facade';
import { appendAuditEvent } from '../../../../../lib/kernel-certs/prisma-store';
import {
  type CaseState,
  type StoredCase,
  type StoredScorerResult,
  computeRunDigests,
  costOf,
  deriveGate,
  hashOf,
  latencies,
} from '../../../../../lib/kernel-certs/eval-service';

export const prerender = false;

const STATES: ReadonlyArray<CaseState> = [
  'pass',
  'fail',
  'partial',
  'na',
  'human-review',
  'blocked',
];
const RISKS = ['low', 'medium', 'high', 'critical'];

export const POST: APIRoute = async ({ request, params }) => {
  const auth = isAdminAuthorized(request);
  if (!auth.authorized) return json({ error: auth.reason }, auth.status);

  const id = params.id;
  if (!id) return json({ error: 'missing_id' }, 400);
  if (id.length > 120) return json({ error: 'invalid_id' }, 400);

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
  const caseId = String(b.caseId ?? `CASE-${Date.now().toString(36).toUpperCase()}`);
  if (caseId.length < 2 || caseId.length > 120) return json({ error: 'invalid_case_id' }, 400);

  const traceId = String(b.traceId ?? '');
  const state: CaseState = (STATES as readonly string[]).includes(String(b.state))
    ? (String(b.state) as CaseState)
    : 'pass';
  const expected = String(b.expected ?? '');
  const actual = String(b.actual ?? '');
  const riskLevel = RISKS.includes(String(b.riskLevel)) ? String(b.riskLevel) : 'low';
  const piiTypes = Array.isArray(b.piiTypes) ? (b.piiTypes as string[]) : [];
  const injectionDetected = Boolean(b.injectionDetected);
  const scorerResults = Array.isArray(b.scorerResults)
    ? (b.scorerResults as StoredScorerResult[])
    : [];
  const costSar = Number.isFinite(Number(b.costSar)) ? Number(b.costSar) : 0;
  const latencyMs = Number.isFinite(Number(b.latencyMs)) ? Number(b.latencyMs) : 0;
  const now = new Date().toISOString();

  const c: StoredCase = {
    caseId,
    traceId,
    state,
    expected,
    actual,
    riskLevel: riskLevel as StoredCase['riskLevel'],
    piiTypes,
    injectionDetected,
    scorerResults,
    costSar,
    latencyMs,
    inputHash: hashOf({ caseId, expected }),
    outputHash: hashOf({ caseId, actual }),
    createdAt: now,
  };

  const res = await ctx.store.addCase(id, c);
  if (res.ok === false) {
    return json({ ok: false, code: res.code }, res.code === 'immutable' ? 409 : 409);
  }

  // أعِد احتساب العدادات/الديجست/البوابة ثم حدّث الـ run (غير مجمّد بعد).
  const cases = await ctx.store.getCases(id);
  const totalCompleted = cases.length;
  const failedCases = cases.filter((x) => x.state === 'fail' || x.state === 'blocked').length;
  const criticalCount = cases.filter(
    (x) => x.riskLevel === 'critical' && x.piiTypes.length > 0,
  ).length;
  const humanReviewCount = cases.filter((x) => x.state === 'human-review').length;
  const lat = latencies(cases);
  const gate = deriveGate(cases);
  const cost = costOf(cases);

  const nextVersion = run.version; // store auto-increments; runHash uses +1
  const digests = computeRunDigests({
    evaluationId: run.evaluationId,
    version: run.version + 1,
    cases,
    inputHash: run.inputHash,
  });

  await ctx.store.updateRun({
    ...run,
    cases,
    completedCases: totalCompleted,
    failedCases,
    criticalCount,
    humanReviewCount,
    costSar: cost,
    p50Ms: lat.p50,
    p95Ms: lat.p95,
    p99Ms: lat.p99,
    ...digests,
    version: nextVersion,
    updatedAt: now,
  });

  await appendAuditEvent({ evaluationId: id, action: 'case', metadata: { caseId, state } });

  return json(
    {
      ok: true,
      case: c,
      completedCases: totalCompleted,
      gate,
      version: nextVersion,
    },
    201,
  );
};