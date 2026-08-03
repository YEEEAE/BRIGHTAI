/**
 * kernel-certs/cert-service.ts — إصدار/تحقق/سحب الشهادات (server-side).
 *
 * هذا الكيان يعتمد على eval-service + signing. يُصدر شهادة لـ Run مكتمل
 * فقط (لا شهادة لـ incomplete/blocked؟ — القاعدة: blocked تمنع إصدار
 * 'passed'؛ نُصدر شهادة بحالتها الفعلية)، ويوقّع على payload ثابت
 * canonical يضم كل الحقول + signedBy («يزيد البديوي»).
 *
 * الحمولة الموقعة: نسخة مصغرة قابلة للعرض (لا تُضمن المراجع الكاملة
 * للـ cases — الحقول الحساسة لا تُسرب في الرابط العام).
 */

import { canonicalJson } from './canonical';
import { sha256Hex } from './sha256';
import {
  type SignBundle,
  type SigningKeyPair,
  signPayload,
  verifyPayload,
} from './signing';
import {
  type Gate,
  type RunEnvironment,
  type StoredCase,
  type StoredEvaluationRun,
  latencies,
} from './eval-service';

/** اسم الموقّع الثابت (مالك المفتاح). */
export const CERT_SIGNED_BY = 'يزيد البديوي';

export interface CertificatePayload {
  schema: 'brightai.evaluation-certificate';
  version: 1;
  certificateId: string;
  evaluationId: string;
  entityName: string;
  signedBy: string;
  issuedAt: string;
  environment: RunEnvironment;
  gate: Gate;
  dataset: {
    id: string;
    version: number;
    hash: string;
  };
  model: { id: string; name: string; version: number; provider: string };
  policy: { id: string; version: number };
  prompt: { id: string; version: number };
  scorers: Array<{ id: string; version: number }>;
  caseCount: number;
  completedCases: number;
  failedCases: number;
  criticalFailures: number;
  successRate: number;
  costSar: number;
  latency: { p50Ms: number; p95Ms: number; p99Ms: number };
  hashes: {
    dataset: string;
    policy: string;
    output: string;
    run: string;
  };
  resultUrl: string;
  verifyUrl: string;
}
/** شهادة مخزنة (بما فيها التوقيع). */
export interface StoredCertificate {
  certificateId: string;
  evaluationId: string;
  signedBy: string;
  issuedAt: string;
  environment: RunEnvironment;
  gate: Gate;
  payload: CertificatePayload;
  signature: SignBundle;
  publicKeyId: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  createdAt: string;
}

export interface CertStore {
  saveCert(cert: StoredCertificate): Promise<StoredCertificate>;
  getCert(certificateId: string): Promise<StoredCertificate | null>;
  getCertsByEvaluation(evaluationId: string): Promise<StoredCertificate[]>;
  revokeCert(
    certificateId: string,
    opts: { revokedBy: string; reason: string },
  ): Promise<StoredCertificate | null>;
  getPublicKey(keyId: string): Promise<string | null>;
}

export interface CertServiceDeps {
  store: CertStore;
  signingKey: SigningKeyPair | null; // null → issue غير متاح (misconfigured)
}

/** إنشاء الحمولة الموقعة من run. تُستدعى فقط بعد اكتمال الـ run. */
export function buildPayload(run: StoredEvaluationRun): CertificatePayload {
  const lat = latencies(run.cases ?? []);
  const caseCount = run.totalCases;
  const completed = run.completedCases;
  const successRate =
    completed === 0
      ? 0
      : Math.round(
          ((completed - run.failedCases) / completed) * 100 * 100,
        ) / 100;
  return {
    schema: 'brightai.evaluation-certificate',
    version: 1,
    certificateId: `CERT-${run.evaluationId}`,
    evaluationId: run.evaluationId,
    entityName: 'BrightAI Kernel Evaluation',
    signedBy: CERT_SIGNED_BY,
    issuedAt: new Date().toISOString(),
    environment: run.environment,
    gate: run.gate,
    dataset: {
      id: run.tester.datasetId,
      version: run.tester.datasetVersion,
      hash: run.tester.datasetHash,
    },
    model: {
      id: run.model.modelId,
      name: run.model.modelName,
      version: run.model.modelVersion,
      provider: run.model.provider,
    },
    policy: { id: run.policy.policyId, version: run.policy.policyVersion },
    prompt: { id: run.prompt.promptId, version: run.prompt.promptVersion },
    scorers: run.scorers.map((s) => ({ id: s.id, version: s.version })),
    caseCount,
    completedCases: completed,
    failedCases: run.failedCases,
    criticalFailures: run.criticalCount,
    successRate,
    costSar: Math.round(run.costSar * 10000) / 10000,
    latency: { p50Ms: lat.p50, p95Ms: lat.p95, p99Ms: lat.p99 },
    hashes: {
      dataset: run.tester.datasetHash,
      policy: run.policyHash,
      output: run.outputHash,
      run: run.runHash,
    },
    resultUrl: `/kernel/eval/?run=${run.evaluationId}`,
    verifyUrl: `/api/kernel/certificates/verify?id=CERT-${run.evaluationId}`,
  };
}

/** إصدار شهادة لـ run. القواعد: run يجب أن يكون مكتملًا. */
export async function issueCertificate(
  run: StoredEvaluationRun,
  deps: CertServiceDeps,
): Promise<
  | { ok: true; cert: StoredCertificate }
  | {
      ok: false;
      code: 'not_complete' | 'blocked' | 'no_signing_key' | 'exists' | 'error';
      message: string;
    }
> {
  if (run.status !== 'complete') {
    return { ok: false, code: 'not_complete', message: 'run_not_complete' };
  }
  // القاعدة الحاكمة: blocked أو incomplete لا تُصدر شهادة 'passed'.
  if (run.gate === 'blocked' || run.gate === 'incomplete') {
    return { ok: false, code: 'blocked', message: `gate_${run.gate}_not_issuable` };
  }
  if (!deps.signingKey) {
    return { ok: false, code: 'no_signing_key', message: 'signing_key_not_configured' };
  }
  const payload = buildPayload(run);
  const signature = signPayload(payload, deps.signingKey, {
    signedBy: CERT_SIGNED_BY,
  });
  const cert: StoredCertificate = {
    certificateId: payload.certificateId,
    evaluationId: run.evaluationId,
    signedBy: CERT_SIGNED_BY,
    issuedAt: payload.issuedAt,
    environment: run.environment,
    gate: run.gate,
    payload,
    signature,
    publicKeyId: signature.publicKeyId,
    createdAt: new Date().toISOString(),
  };
  try {
    await deps.store.saveCert(cert);
  } catch (err) {
    return { ok: false, code: 'error', message: (err as Error).message };
  }
  return { ok: true, cert };
}

export type VerifyStatus =
  | 'valid'
  | 'revoked'
  | 'tampered'
  | 'digest-mismatch'
  | 'not-found'
  | 'key-missing'
  | 'incomplete';

/**
 * تحقق من الشهادة عبر الرابط العام. يعيد حالة صريحة:
 *   valid          → كل شيء سليم (digest + Ed25519 + المفتاح النشط مطابق)
 *   revoked        → الشهادة سُحبت
 *   tampered       → التوقيع فشل (حُمِّل ببيانات غير مطابقة)
 *   digest-mismatch→ محتوى الـ payload تغيّر بعد التوقيع
 *   not-found      → لا شهادة بهذا الـ id
 *   key-missing    → publicKeyId غير موجود (rotation احذف؟ لا — لا نحذف)
 *   incomplete     → الحمولة ناقصة (gate incomplete لا يُصدر أصلًا لكن نتحقق)
 */
export async function verifyCertificate(
  certificateId: string,
  deps: CertServiceDeps,
): Promise<{ status: VerifyStatus; cert?: StoredCertificate; reason?: string }> {
  const cert = await deps.store.getCert(certificateId);
  if (!cert) return { status: 'not-found' };
  if (cert.revokedAt) return { status: 'revoked', cert };
  const pubKey = await deps.store.getPublicKey(cert.publicKeyId);
  if (!pubKey) return { status: 'key-missing', cert };
  const res = verifyPayload(cert.payload, cert.signature, pubKey);
  if (res.status === 'digest-mismatch') return { status: 'digest-mismatch', cert };
  if (res.status === 'tampered') return { status: 'tampered', cert };
  return { status: 'valid', cert };
}

/**
 * سحب شهادة (إبطال). لا حذف — نضع revokedAt + السبب، فتبقى الحالة
 * قابلة للتحقق (المُسحوبة تظهر revoked).
 */
export async function revokeCertificate(
  certificateId: string,
  opts: { revokedBy: string; reason: string },
  deps: CertServiceDeps,
): Promise<
  | { ok: true; cert: StoredCertificate }
  | { ok: false; code: 'not_found' | 'error'; message: string }
> {
  try {
    const updated = await deps.store.revokeCert(certificateId, opts);
    if (!updated) return { ok: false, code: 'not_found', message: 'certificate_not_found' };
    return { ok: true, cert: updated };
  } catch (err) {
    return { ok: false, code: 'error', message: (err as Error).message };
  }
}
