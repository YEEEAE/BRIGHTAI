/**
 * kernel-certs/eval-service.ts — منطق التقييم الخادم (server-side).
 *
 * يدوّر دورة حياة Evaluation Run ويفرض القواعد الحاكمة، بغض النظر عن
 * المخزن (DB أو in-memory في الاختبارات):
 *
 *   1. لا Passed بعد شغلٍ ناقص — run غير مكتمل = gate incomplete، لا شهادة.
 *   2. لا تعديل لـ Run مكتمل — أي تصحيح/إعادة تشغيل ينشئ نسخة مرتبطة
 *      بـ parentEvaluationId، ولا يعدّل الأصل أبدًا.
 *   3. لا حذف لـ Case محفوظ؛ منع تكرار caseId داخل نفس evaluation.
 *   4. Optimistic locking عبر `version` — تحديث متزاحم يُرفض.
 *   5. البوابة تمنع 'passed' عند PII حرج أو حقن حرج.
 *   6. partial saving: حفظ نتيجة Case فورًا واستئناف من آخر حالة مكتملة.
 */

import { sha256Hex } from './sha256';
import { canonicalJson } from './canonical';

// ── مصفوفات الحالات (مصدرها kernel-evaluation.ts لكن هنا server-side) ────

/** حالات التشغيل على الخادم. */
export type ServerRunStatus =
  | 'running'
  | 'partial'
  | 'complete'
  | 'failed'
  | 'review';

/** بوابات النتيجة (قابلة للشهادة). */
export type Gate =
  | 'passed'
  | 'passed-with-findings'
  | 'review-required'
  | 'blocked'
  | 'incomplete';

/** بيئة التشغيل. */
export type RunEnvironment = 'demo' | 'test' | 'live';

/** حالة Case مفردة. */
export type CaseState =
  | 'pass'
  | 'fail'
  | 'partial'
  | 'na'
  | 'human-review'
  | 'blocked';

/** نتيجة Scorer مفردة. */
export interface StoredScorerResult {
  scorerId: string;
  score: number;
  note?: string;
}

/** مرجع Dataset في الـ run. */
export interface RunTesterRef {
  datasetId: string;
  datasetName: string;
  datasetVersion: number;
  datasetHash: string;
}

/** مرجع سياسة الـ run. */
export interface RunPolicyRef {
  policyId: string;
  policyName: string;
  policyVersion: number;
}

/** مرجع وصف النموذج. */
export interface RunModelRef {
  modelId: string;
  modelName: string;
  modelVersion: number;
  provider: string;
}

/** مرجع الـ run. */
export interface RunPromptRef {
  promptId: string;
  promptVersion: number;
  promptHash?: string;
}

/** مرجع سكور واحد. */
export interface RunScorerRef {
  id: string;
  version: number;
}

/** سجل Case في الـ run. */
export interface StoredCase {
  caseId: string;
  traceId: string;
  state: CaseState;
  expected: string;
  actual: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  piiTypes: string[];
  injectionDetected: boolean;
  scorerResults: StoredScorerResult[];
  costSar: number;
  latencyMs: number;
  inputHash: string;
  outputHash: string;
  createdAt: string;
}

/** شكل run مخزّن في الـ store (DB أو in-memory). */
export interface StoredEvaluationRun {
  evaluationId: string;
  parentEvaluationId?: string;
  name: string;
  status: ServerRunStatus;
  gate: Gate;
  environment: RunEnvironment;
  provider: string;
  model: RunModelRef;
  tester: RunTesterRef;
  policy: RunPolicyRef;
  prompt: RunPromptRef;
  /** بصمة محتوى السياسة عند التشغيل (provenance). */
  policyHash: string;
  scorers: RunScorerRef[];
  seed?: number;
  temperature?: number;
  startedAt: string;
  finishedAt?: string;
  totalCases: number;
  completedCases: number;
  failedCases: number;
  criticalCount: number;
  humanReviewCount: number;
  costSar: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  inputHash: string;
  outputHash: string;
  runHash: string;
  version: number; // optimistic lock
  immutable: boolean; // بمجرد 'complete' تُجمد
  cases: StoredCase[];
  createdAt: string;
  updatedAt: string;
}

// ── بورت الـ store ───────────────────────────────────────────────────────

/**
 * عقد المخزن. تنفيذان: PrismaStore (DB) و InMemoryStore (اختبارات).
 * كلاهما يفرض: تفرد caseId + عدم تعديل result محفوظ + optimistic lock.
 */
export interface EvalStore {
  createRun(run: StoredEvaluationRun): Promise<StoredEvaluationRun>;
  getRun(evaluationId: string): Promise<StoredEvaluationRun | null>;
  listRuns(limit?: number): Promise<StoredEvaluationRun[]>;
  updateRun(run: StoredEvaluationRun): Promise<StoredEvaluationRun>;
  /** Case جديد داخل run. يرفض التكرار ويفشل إن كان الـ run immutable. */
  addCase(
    evaluationId: string,
    c: StoredCase,
  ): Promise<{ ok: true } | { ok: false; code: 'duplicate' | 'immutable' }>;
  getCases(evaluationId: string): Promise<StoredCase[]>;
}

// ── أدوات حساب متاحة للجميع (نقية، لا تعتمد على المخزن) ─────────────────

/** hash محدد لقيمة canonical → بصمة. */
export function hashOf(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

/** إعادة احتساب الـ runHash/inputHash/outputHash عند الإضافة/التحديث. */
export function computeRunDigests(
  run: Pick<
    StoredEvaluationRun,
    'evaluationId' | 'version' | 'cases' | 'inputHash'
  > & { inputHash?: string },
): Pick<StoredEvaluationRun, 'inputHash' | 'outputHash' | 'runHash'> {
  const inputHash = run.inputHash ?? hashOf({ evaluationId: run.evaluationId, mk: run.cases });
  const outputHash = hashOf(
    run.cases.map((c) => ({ caseId: c.caseId, outputHash: c.outputHash })),
  );
  const runHash = hashOf({
    evaluationId: run.evaluationId,
    version: run.version,
    completed: run.cases.length,
    outputHash,
  });
  return { inputHash, outputHash, runHash };
}

/** البوابة النهائية من الحالات + عدّاد التكلفة. */
export function deriveGate(cases: StoredCase[]): Gate {
  if (cases.length === 0) return 'incomplete';

  // قاعدة حاكمة: PII أو injection حرج يمنع أي إنتاج حتى لو الكل نجح.
  const criticalViolation = cases.some(
    (c) =>
      c.injectionDetected ||
      (c.piiTypes.length > 0 && c.riskLevel === 'critical'),
  );
  if (criticalViolation) return 'blocked';

  const needsReview = cases.some((c) => c.state === 'human-review' || c.state === 'fail');
  if (needsReview) return 'review-required';

  const allPass = cases.every((c) => c.state === 'pass');
  const anyPartial = cases.some((c) => c.state === 'partial');

  if (allPass) return 'passed';
  if (anyPartial) return 'passed-with-findings';
  return 'incomplete';
}

/** مؤشرات مئوية (P50/P95/P99) من زمن الحالات. */
export function latencies(cases: StoredCase[]): { p50: number; p95: number; p99: number } {
  const ms = cases.map((c) => c.latencyMs).sort((a, b) => a - b);
  if (ms.length === 0) return { p50: 0, p95: 0, p99: 0 };
  const pick = (p: number) => {
    const i = Math.floor((p / 100) * ms.length);
    return ms[Math.min(ms.length - 1, Math.max(0, i))];
  };
  return { p50: pick(50), p95: pick(95), p99: pick(99) };
}

/** إجمالي التكلفة بالريال. */
export function costOf(cases: StoredCase[]): number {
  return cases.reduce((s, c) => s + (Number(c.costSar) || 0), 0);
}