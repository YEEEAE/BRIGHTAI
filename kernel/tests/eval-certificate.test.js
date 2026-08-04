/**
 * kernel/tests/eval-certificate.test.js — EVAL-CERT-009.
 *
 * يغطي القواعد الحاكمة لنظام الشهادات (لا يتطلب DB — InMemoryStore):
 *   1. لا شهادة لـ run غير مكتمل أو مقيّد (incomplete/blocked).
 *   2. تلاعب في الـ payload → digest-mismatch (التحقق يرفض).
 *   3. سحب الشهادة → revoked تبقى موجودة وقابلة للتحقق.
 *   4. منع تكرار caseId داخل نفس evaluation.
 *   5. تجميد run مكتمل — أي addCase لاحق يُرفض (immutable).
 *   6. Optimistic lock — تحديث متزاحم على version قديمة يُرفض.
 *   7. Rotation: مفتاح جديد يُستخدم للشهادات الجديدة، والقديمة تبقى صالحة
 *      عبر publicKeyId المسجل في registry التحقق.
 *
 * الديمو (Demo/Live) يعمل في run بيئته demo/test/live — هذا الاختبار يغطي
 * القواعد المشتركة بلا تفريق بين البيئات.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryEvalStore } from '@/src/lib/kernel-certs/in-memory-store';
import {
  hashOf,
  deriveGate,
  computeRunDigests,
  latencies,
  costOf,
} from '@/src/lib/kernel-certs/eval-service';
import {
  buildPayload,
  issueCertificate,
  verifyCertificate,
  revokeCertificate,
} from '@/src/lib/kernel-certs/cert-service';
import {
  generateSigningKeyPair,
  signPayload,
  verifyPayload,
} from '@/src/lib/kernel-certs/signing';

function makeRun(overrides = {}) {
  const now = new Date().toISOString();
  return {
    evaluationId: 'EVAL-TEST-001',
    name: 'تقييم اختبار',
    status: 'running',
    gate: 'incomplete',
    environment: 'demo',
    provider: 'simulated',
    model: { modelId: 'm1', modelName: 'Model X', modelVersion: 1, provider: 'simulated' },
    tester: { datasetId: 'ds1', datasetName: 'Dataset 1', datasetVersion: 2, datasetHash: hashOf({ ds: 'ds1' }) },
    policy: { policyId: 'pol1', policyName: 'Policy 1', policyVersion: 1 },
    policyHash: hashOf({ id: 'pol1', version: 1 }),
    prompt: { promptId: 'pr1', promptVersion: 3 },
    scorers: [{ id: 's1', version: 1 }],
    seed: 7,
    temperature: 0.2,
    startedAt: now,
    totalCases: 2,
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
    ...overrides,
  };
}

function makeCase(overrides = {}) {
  const now = new Date().toISOString();
  return {
    caseId: 'CASE-1',
    traceId: 'trace-1',
    state: 'pass',
    expected: 'safe',
    actual: 'safe',
    riskLevel: 'low',
    piiTypes: [],
    injectionDetected: false,
    scorerResults: [{ scorerId: 's1', score: 100, note: 'ok' }],
    costSar: 0.0001,
    latencyMs: 120,
    inputHash: hashOf({ input: 'x' }),
    outputHash: hashOf({ output: 'y' }),
    createdAt: now,
    ...overrides,
  };
}

async function completeRun(store, run, cases) {
  for (const c of cases) {
    const res = await store.addCase(run.evaluationId, c);
    if (res.ok === false) throw new Error(`addCase failed: ${res.code}`);
  }
  const all = await store.getCases(run.evaluationId);
  const digests = computeRunDigests({
    evaluationId: run.evaluationId,
    version: run.version + 1,
    cases: all,
    inputHash: run.inputHash,
  });
  return store.updateRun({
    ...run,
    ...digests,
    status: 'complete',
    gate: deriveGate(all),
    completedCases: all.length,
    cases: all,
    costSar: costOf(all),
    p50Ms: latencies(all).p50,
    p95Ms: latencies(all).p95,
    p99Ms: latencies(all).p99,
    version: run.version,
    immutable: true,
  });
}

describe('kernel evaluation certificates', () => {
  let store;
  let key;

  beforeEach(() => {
    store = new InMemoryEvalStore();
    key = generateSigningKeyPair('v1');
    store.registerPublicKey(key.publicKeyId, key.publicKeyPem);
  });

  it('لا شهادة لـ run غير مكتمل (incomplete/blocked)', async () => {
    // run غير مكتمل (running) → issue مرفوض بـ not_complete
    const deps = { store: makeCertStore(), signingKey: key };
    const incomplete = await store.createRun(makeRun({ status: 'running' }));
    const res2 = await issueCertificate(incomplete, deps);
    expect(res2.ok).toBe(false);
    expect(res2.ok === false && res2.code).toBe('not_complete');

    // run مكتمل لكن blocked (حقن حرج) — الإصدار مرفوض عند الـ store على أنه
    // غير قابل للشهادة عبر gate في طبقة الإصدار (لا نسمح 'blocked').
    const blocked = await completeRun(store, incomplete, [
      makeCase({ state: 'blocked', injectionDetected: true, riskLevel: 'critical' }),
    ]);
    expect(blocked.gate).toBe('blocked');
    const res3 = await issueCertificate(blocked, deps);
    expect(res3.ok).toBe(false);
  });

  it('run مكتمل + gate passed → شهادة صالحة، والتلاعب يكتشف', async () => {
    const run = await store.createRun(makeRun({ status: 'running', totalCases: 1 }));
    const completed = await completeRun(store, run, [makeCase()]);
    expect(completed.gate).toBe('passed');

    const certStore = makeCertStore();
    certStore.registerPublicKey(key.publicKeyId, key.publicKeyPem);
    const deps = { store: certStore, signingKey: key };
    const issued = await issueCertificate(completed, deps);
    expect(issued.ok).toBe(true);
    if (issued.ok === false) return;

    // سليم أولًا
    const v0 = await verifyCertificate(issued.cert.certificateId, deps);
    expect(v0.status).toBe('valid');

    // تلاعب: غيّر الحمولة المخزنة في الـ store ثم تحقق → digest-mismatch.
    // (stored في الـ store هو reference؛ نعدّله عبر getCert — الـ store يعيد clone،
    //  فنكسر الـ digest يدويًا بأن نكتب نسخة معدلة في الـ store).
    await certStore._mutate(issued.cert.certificateId, (c) => {
      c.payload.successRate = 99;
    });
    const v2 = await verifyCertificate(issued.cert.certificateId, deps);
    expect(v2.status).toBe('digest-mismatch');
  });

  it('سحب الشهادة → revoked ولا تُحذف', async () => {
    const run = await store.createRun(makeRun({ status: 'running', totalCases: 1 }));
    const completed = await completeRun(store, run, [makeCase()]);
    const certStore = makeCertStore();
    const deps = { store: certStore, signingKey: key };
    const issued = await issueCertificate(completed, deps);
    if (issued.ok === false) throw new Error('issue failed');

    const rev = await revokeCertificate(issued.cert.certificateId, { revokedBy: 'admin', reason: 'stale' }, deps);
    expect(rev.ok).toBe(true);

    const v = await verifyCertificate(issued.cert.certificateId, deps);
    expect(v.status).toBe('revoked');
  });

  it('منع تكرار caseId داخل نفس evaluation', async () => {
    const run = await store.createRun(makeRun({ status: 'running' }));
    const c = makeCase();
    expect((await store.addCase(run.evaluationId, c)).ok).toBe(true);
    const dup = await store.addCase(run.evaluationId, { ...c, caseId: c.caseId });
    expect(dup.ok).toBe(false);
    expect(dup.ok === false && dup.code).toBe('duplicate');
  });

  it('تجميد run مكتمل — addCase لاحق يُرفض (immutable)', async () => {
    const run = await store.createRun(makeRun({ status: 'running', totalCases: 1 }));
    const completed = await completeRun(store, run, [makeCase({ caseId: 'CASE-1' })]);
    expect(completed.immutable).toBe(true);
    const res = await store.addCase(run.evaluationId, makeCase({ caseId: 'CASE-2' }));
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.code).toBe('immutable');
  });

  it('optimistic lock — تحديث على version قديمة يُرفض', async () => {
    const run = await store.createRun(makeRun({ status: 'running' }));
    // نجاح: مرّر نفس النسخة المكتوبة → auto-increment
    const r1 = await store.getRun(run.evaluationId);
    const r1updated = await store.updateRun({ ...r1, name: 'ok', version: r1.version });
    expect(r1updated.version).toBe(r1.version + 1);
    // خناقة: مرّر نسخة قديمة بعد تحديث → يُرفض
    const r2 = await store.getRun(run.evaluationId);
    await expect(store.updateRun({ ...r2, name: 'stale write', version: r2.version - 1 })).rejects.toThrow(
      'optimistic_lock_conflict',
    );
  });

  it('rotation — المفتاح الجديد يوقّع، القديم يبقى صالحًا للتحقق', async () => {
    const oldKey = key;
    const run = await store.createRun(makeRun({ status: 'running', totalCases: 1 }));
    const completed = await completeRun(store, run, [makeCase()]);
    const certStore = makeCertStore();
    const issued = await issueCertificate(completed, { store: certStore, signingKey: oldKey });
    if (issued.ok === false) throw new Error('issue failed');

    // التناوب: مفتاح جديد لشهادات جديدة
    const newKey = generateSigningKeyPair('v2');
    certStore.registerPublicKey(newKey.publicKeyId, newKey.publicKeyPem);

    // القديمة تبقى صالحة — المفتاح القديم مسجل في registry
    certStore.registerPublicKey(oldKey.publicKeyId, oldKey.publicKeyPem);
    const v = await verifyCertificate(issued.cert.certificateId, { store: certStore, signingKey: newKey });
    expect(v.status).toBe('valid');
  });

  it('deriveGate — passed / review-required / blocked / incomplete', () => {
    const now = new Date().toISOString();
    const base = { ...makeCase() };
    expect(deriveGate([])).toBe('incomplete');
    expect(deriveGate([{ ...base, state: 'pass' }])).toBe('passed');
    expect(deriveGate([{ ...base, state: 'pass' }, { ...base, caseId: 'CASE-2', state: 'partial' }])).toBe('passed-with-findings');
    expect(deriveGate([{ ...base, state: 'fail' }])).toBe('review-required');
    expect(
      deriveGate([{ ...base, injectionDetected: true, riskLevel: 'critical' }]),
    ).toBe('blocked');
  });

  it('computeRunDigests مستقرة عبر version', () => {
    const now = new Date().toISOString();
    const cases = [makeCase()];
    const d1 = computeRunDigests({ evaluationId: 'E', version: 1, cases });
    const d2 = computeRunDigests({ evaluationId: 'E', version: 2, cases });
    expect(d1.outputHash).toBe(d2.outputHash); // output يعتمد على cases فقط
    expect(d1.runHash).not.toBe(d2.runHash); // run يعتمد على version
  });

  it('signPayload يوقّع ويُتحقق', async () => {
    const payload = { a: 1, b: { c: [1, 2, 3] } };
    const bundle = signPayload(payload, key, { signedBy: 'يزيد البديوي' });
    const ok = verifyPayload(payload, bundle, key.publicKeyPem);
    expect(ok.status).toBe('valid');
  });

  it('reject — تحديث status إلى failed + finishedAt + لا حذف فعلي', async () => {
    const run = await store.createRun(makeRun({ status: 'running', totalCases: 2 }));
    const c1 = await store.addCase(run.evaluationId, makeCase({ caseId: 'CASE-1' }));
    expect(c1.ok).toBe(true);

    const loaded = await store.getRun(run.evaluationId);
    const now = new Date().toISOString();
    const rejected = await store.updateRun({
      ...loaded,
      status: 'failed',
      finishedAt: now,
      version: loaded.version,
      updatedAt: now,
    });

    expect(rejected.status).toBe('failed');
    expect(rejected.finishedAt).toBe(now);
    // الـ run ما يُحذف — يبقى موجودًا وقابلًا للقراءة
    const stillThere = await store.getRun(run.evaluationId);
    expect(stillThere).not.toBeNull();
    // الـ cases محفوظة — سلسلة الإثبات باقية
    const cases = await store.getCases(run.evaluationId);
    expect(cases.length).toBe(1);
    // run مكتمل (immutable) — الـ store يرفض أي تحديث يسقط الـ immutable
    // (حماية التجميد على مستوى المخزن؛ الحارس في الـ route يرفض مسبقًا).
    const run2 = await store.createRun(makeRun({ evaluationId: 'EVAL-TEST-002', status: 'running', totalCases: 1 }));
    const done = await completeRun(store, run2, [makeCase({ caseId: 'CASE-A' })]);
    expect(done.immutable).toBe(true);
    await expect(
      store.updateRun({ ...done, status: 'failed', immutable: false, version: done.version }),
    ).rejects.toThrow('run_immutable');
  });

  it('listCerts يعيد الشهادات مرتبة (الأحدث أولًا)', async () => {
    const certStore = makeCertStore();
    const deps = { store: certStore, signingKey: key };
    const run = await store.createRun(makeRun({ status: 'running', totalCases: 1 }));
    const completed = await completeRun(store, run, [makeCase()]);
    const issued = await issueCertificate(completed, deps);
    if (issued.ok === false) throw new Error('issue failed');

    const list = await certStore.listCerts(50);
    expect(list.length).toBe(1);
    expect(list[0].certificateId).toBe(issued.cert.certificateId);
    expect(Array.isArray(list)).toBe(true);
  });
});

// CertStore في الذاكرة للاختبارات — يحاكي PrismaCertStore بلا DB.
function makeCertStore() {
  const certs = new Map();
  const pubKeys = new Map();
  return {
    async saveCert(cert) {
      certs.set(cert.certificateId, structuredClone(cert));
      return cert;
    },
    async getCert(certificateId) {
      const c = certs.get(certificateId);
      return c ? structuredClone(c) : null;
    },
    async getCertsByEvaluation(evaluationId) {
      return [...certs.values()].filter((c) => c.evaluationId === evaluationId);
    },
    async listCerts(limit = 50) {
      return [...certs.values()]
        .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
        .slice(0, limit);
    },
    async revokeCert(certificateId, opts) {
      const c = certs.get(certificateId);
      if (!c) return null;
      c.revokedAt = new Date().toISOString();
      c.revokedBy = opts.revokedBy;
      c.revocationReason = opts.reason;
      certs.set(certificateId, c);
      return structuredClone(c);
    },
    async getPublicKey(keyId) {
      return pubKeys.get(keyId) ?? null;
    },
    async _mutate(certificateId, fn) {
      const c = certs.get(certificateId);
      if (c) {
        fn(c);
        certs.set(certificateId, c);
      }
      return c ?? null;
    },
    registerPublicKey(keyId, pem) {
      pubKeys.set(keyId, pem);
    },
  };
}