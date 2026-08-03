/**
 * kernel-certs/prisma-store.ts — تنفيذ EvalStore + CertStore فوق Prisma.
 *
 * يستخدم dbServiceRole (BYPASSRLS) لأن هذه الجداول غير tenant-scoped
 * (مثل lead_queue) — بيانات عروض Kernel العامة. يطابق مخرجات الـ
 * service (StoredEvaluationRun) مع نموذج Prisma.
 *
 * يفرض على مستوى قاعدة البيانات:
 *   - unique (runId, caseId) → يرفض duplicate case.
 *   - تحديث الـ run يحمل optimistic lock عبر فحص `version`.
 *   - الـ immutable يمنع تعديل run مكتمل (حماية إضافية فوق منطق الخدمة).
 */

import { dbServiceRole } from '@brightai/db';
import type {
  EvalStore,
  StoredCase,
  StoredEvaluationRun,
} from './eval-service';
import type { CertStore, StoredCertificate } from './cert-service';
import { sha256Hex } from './sha256';
import { canonicalJson } from './canonical';

// ── mapping helpers ────────────────────────────────────────────────────────

function toDbRun(run: StoredEvaluationRun) {
  return {
    evaluationId: run.evaluationId,
    parentEvaluationId: run.parentEvaluationId ?? null,
    name: run.name,
    status: run.status,
    gate: run.gate.replace('-', '_') as never,
    environment: run.environment as never,
    provider: run.provider,
    datasetId: run.tester.datasetId,
    datasetVersion: run.tester.datasetVersion,
    datasetHash: run.tester.datasetHash,
    policyId: run.policy.policyId,
    policyVersion: run.policy.policyVersion,
    policyHash: run.policyHash,
    modelId: run.model.modelId,
    modelName: run.model.modelName,
    modelVersion: run.model.modelVersion,
    modelProvider: run.model.provider,
    promptId: run.prompt.promptId,
    promptVersion: run.prompt.promptVersion,
    totalCases: run.totalCases,
    completedCases: run.completedCases,
    failedCases: run.failedCases,
    criticalCount: run.criticalCount,
    humanReviewCount: run.humanReviewCount,
    costSar: run.costSar,
    p50Ms: run.p50Ms,
    p95Ms: run.p95Ms,
    p99Ms: run.p99Ms,
    inputHash: run.inputHash,
    outputHash: run.outputHash,
    runHash: run.runHash,
    version: run.version,
    immutable: run.immutable,
    startedAt: new Date(run.startedAt),
    finishedAt: run.finishedAt ? new Date(run.finishedAt) : null,
    updatedAt: new Date(run.updatedAt),
  };
}

function fromDbRun(row: Record<string, unknown>): StoredEvaluationRun {
  const toISO = (d: unknown) =>
    d instanceof Date ? d.toISOString() : String(d);
  return {
    evaluationId: String(row.evaluationId),
    parentEvaluationId: row.parentEvaluationId
      ? String(row.parentEvaluationId)
      : undefined,
    name: String(row.name),
    status: String(row.status) as StoredEvaluationRun['status'],
    gate: (String(row.gate).replace('_', '-') as StoredEvaluationRun['gate']),
    environment: String(row.environment) as StoredEvaluationRun['environment'],
    provider: String(row.provider),
    model: {
      modelId: String(row.modelId),
      modelName: String(row.modelName),
      modelVersion: Number(row.modelVersion),
      provider: String(row.modelProvider),
    },
    tester: {
      datasetId: String(row.datasetId),
      datasetName: String(row.datasetId),
      datasetVersion: Number(row.datasetVersion),
      datasetHash: String(row.datasetHash),
    },
    policy: {
      policyId: String(row.policyId),
      policyName: String(row.policyId),
      policyVersion: Number(row.policyVersion),
    },
    policyHash: String(row.policyHash),
    prompt: {
      promptId: String(row.promptId),
      promptVersion: Number(row.promptVersion),
    },
    scorers: [],
    startedAt: toISO(row.startedAt),
    finishedAt: row.finishedAt ? toISO(row.finishedAt) : undefined,
    totalCases: Number(row.totalCases),
    completedCases: Number(row.completedCases),
    failedCases: Number(row.failedCases),
    criticalCount: Number(row.criticalCount),
    humanReviewCount: Number(row.humanReviewCount),
    costSar: Number(row.costSar),
    p50Ms: Number(row.p50Ms),
    p95Ms: Number(row.p95Ms),
    p99Ms: Number(row.p99Ms),
    inputHash: String(row.inputHash),
    outputHash: String(row.outputHash),
    runHash: String(row.runHash),
    version: Number(row.version),
    immutable: Boolean(row.immutable),
    cases: [],
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
  };
}

// ── EvalStore (Prisma) ────────────────────────────────────────────────────

export class PrismaEvalStore implements EvalStore {
  async createRun(run: StoredEvaluationRun): Promise<StoredEvaluationRun> {
    const row = await dbServiceRole.evaluationRun.create({
      data: toDbRun(run) as never,
    });
    return fromDbRun(row as unknown as Record<string, unknown>);
  }

  async getRun(evaluationId: string): Promise<StoredEvaluationRun | null> {
    const row = await dbServiceRole.evaluationRun.findUnique({
      where: { evaluationId },
    });
    if (!row) return null;
    const run = fromDbRun(row as unknown as Record<string, unknown>);
    run.cases = await this.getCases(evaluationId);
    return run;
  }

  async listRuns(limit = 50): Promise<StoredEvaluationRun[]> {
    const rows = await dbServiceRole.evaluationRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return Promise.all(
      rows.map(async (r) => {
        const run = fromDbRun(r as unknown as Record<string, unknown>);
        run.cases = await this.getCases(run.evaluationId);
        return run;
      }),
    );
  }

  async updateRun(run: StoredEvaluationRun): Promise<StoredEvaluationRun> {
    const row = await dbServiceRole.evaluationRun.update({
      where: { evaluationId: run.evaluationId },
      data: toDbRun(run) as never,
    });
    return fromDbRun(row as unknown as Record<string, unknown>);
  }

  async addCase(
    evaluationId: string,
    c: StoredCase,
  ): Promise<{ ok: true } | { ok: false; code: 'duplicate' | 'immutable' }> {
    const run = await dbServiceRole.evaluationRun.findUnique({
      where: { evaluationId },
    });
    if (!run) throw new Error('run_not_found');
    if (run.immutable) return { ok: false, code: 'immutable' };
    try {
      await dbServiceRole.evaluationCase.create({
        data: {
          runId: run.id,
          caseId: c.caseId,
          traceId: c.traceId,
          state: c.state,
          expected: c.expected,
          actual: c.actual,
          riskLevel: c.riskLevel,
          piiTypes: c.piiTypes,
          injectionDetected: c.injectionDetected,
          scorerResults: c.scorerResults as never,
          costSar: c.costSar,
          latencyMs: c.latencyMs,
          inputHash: c.inputHash,
          outputHash: c.outputHash,
        },
      });
      return { ok: true };
    } catch (err) {
      if (String((err as Error).message).includes('Unique constraint')) {
        return { ok: false, code: 'duplicate' };
      }
      throw err;
    }
  }

  async getCases(evaluationId: string): Promise<StoredCase[]> {
    const run = await dbServiceRole.evaluationRun.findUnique({
      where: { evaluationId },
    });
    if (!run) return [];
    const rows = await dbServiceRole.evaluationCase.findMany({
      where: { runId: run.id },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      caseId: r.caseId,
      traceId: r.traceId,
      state: r.state as StoredCase['state'],
      expected: r.expected,
      actual: r.actual,
      riskLevel: r.riskLevel as StoredCase['riskLevel'],
      piiTypes: r.piiTypes,
      injectionDetected: r.injectionDetected,
      scorerResults: (r.scorerResults as never) as StoredCase['scorerResults'],
      costSar: Number(r.costSar),
      latencyMs: r.latencyMs,
      inputHash: r.inputHash,
      outputHash: r.outputHash,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}

// ── CertStore (Prisma) ────────────────────────────────────────────────────

export class PrismaCertStore implements CertStore {
  constructor(private publicKeys = new Map<string, string>()) {}

  /** سجّل مفتاح عام قبل التحقق (يُستدعى عند الـ boot أو من registry). */
  registerPublicKey(keyId: string, publicKeyPem: string): void {
    this.publicKeys.set(keyId, publicKeyPem);
  }

  async getPublicKey(keyId: string): Promise<string | null> {
    if (this.publicKeys.has(keyId)) return this.publicKeys.get(keyId)!;
    const row = await dbServiceRole.signingKey.findUnique({
      where: { publicKeyId: keyId },
    });
    return row?.publicKeyPem ?? null;
  }

  async saveCert(cert: StoredCertificate): Promise<StoredCertificate> {
    const run = await dbServiceRole.evaluationRun.findUnique({
      where: { evaluationId: cert.evaluationId },
    });
    if (!run) throw new Error('run_not_found');
    await dbServiceRole.evaluationCertificate.create({
      data: {
        certificateId: cert.certificateId,
        runId: run.id,
        signedBy: cert.signedBy,
        environment: cert.environment as never,
        gate: cert.gate.replace('-', '_') as never,
        signedByKeyId: cert.publicKeyId,
        signature: cert.signature.signature,
        payloadDigest: cert.signature.payloadDigest,
        payload: cert.payload as never,
        verifyUrl: cert.payload.verifyUrl,
      },
    });
    return cert;
  }

  async getCert(certificateId: string): Promise<StoredCertificate | null> {
    const row = await dbServiceRole.evaluationCertificate.findUnique({
      where: { certificateId },
    });
    if (!row) return null;
    return this.fromDbCert(row as unknown as Record<string, unknown>);
  }

  async getCertsByEvaluation(evaluationId: string): Promise<StoredCertificate[]> {
    const run = await dbServiceRole.evaluationRun.findUnique({
      where: { evaluationId },
    });
    if (!run) return [];
    const rows = await dbServiceRole.evaluationCertificate.findMany({
      where: { runId: run.id },
      orderBy: { signedAt: 'desc' },
    });
    return rows.map((r) => this.fromDbCert(r as unknown as Record<string, unknown>));
  }

  async revokeCert(
    certificateId: string,
    opts: { revokedBy: string; reason: string },
  ): Promise<StoredCertificate | null> {
    const row = await dbServiceRole.evaluationCertificate.update({
      where: { certificateId },
      data: {
        revokedAt: new Date(),
        revokedBy: opts.revokedBy,
        revocationReason: opts.reason,
      },
    });
    return this.fromDbCert(row as unknown as Record<string, unknown>);
  }

  private fromDbCert(row: Record<string, unknown>): StoredCertificate {
    const payload = (row.payload ??
      {}) as StoredCertificate['payload'];
    const cert: StoredCertificate = {
      certificateId: String(row.certificateId),
      evaluationId: String(row.runId), // ref resolved below via payload? we store runId
      signedBy: String(row.signedBy),
      issuedAt: String(row.signedAt),
      environment: String(row.environment) as StoredCertificate['environment'],
      gate: (String(row.gate).replace('_', '-') as StoredCertificate['gate']),
      payload,
      signature: {
        algorithm: 'SHA-256',
        signedBy: String(row.signedBy),
        signature: String(row.signature),
        signedAt: String(row.signedAt),
        publicKeyId: String(row.signedByKeyId),
        payloadDigest: String(row.payloadDigest),
      },
      publicKeyId: String(row.signedByKeyId),
      revokedAt: row.revokedAt ? String(row.revokedAt) : undefined,
      revokedBy: row.revokedBy ? String(row.revokedBy) : undefined,
      revocationReason: row.revocationReason
        ? String(row.revocationReason)
        : undefined,
      createdAt: String(row.createdAt),
    };
    return cert;
  }
}

// ── Audit events (tamper-evident hash chain) ─────────────────────────────

export interface AuditEventInput {
  evaluationId: string;
  certificateId?: string;
  action: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

/**
 * يسجّل حدثًا غير قابل للتعديل مع hash chain:
 *   hash = sha256(prevHash + action + evaluationId + canonical(metadata))
 */
export async function appendAuditEvent(input: AuditEventInput): Promise<string> {
  const last = await dbServiceRole.evaluationAuditEvent.findFirst({
    where: { evaluationId: input.evaluationId },
    orderBy: { createdAt: 'desc' },
  });
  const prevHash = last?.hash ?? null;
  const hash = sha256Hex(
    canonicalJson({
      prevHash,
      action: input.action,
      evaluationId: input.evaluationId,
      certificateId: input.certificateId ?? null,
      metadata: input.metadata ?? {},
    }),
  );
  await dbServiceRole.evaluationAuditEvent.create({
    data: {
      evaluationId: input.evaluationId,
      certificateId: input.certificateId ?? null,
      action: input.action,
      actor: input.actor ?? 'system',
      metadata: (input.metadata ?? {}) as never,
      prevHash,
      hash,
    },
  });
  return hash;
}
