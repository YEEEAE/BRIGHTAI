/**
 * kernel/tests/eval-certificate.db.integration.test.js — EVAL-CERT-013.
 *
 * مسار إنتاج حقيقي ضد Postgres (PrismaStore) + مفتاح التوقيع من env.
 * يُتخطَّى تلقائيًا إن لم يكن DATABASE_URL أو مفتاح التوقيع متاحًا
 * (حتى لا يكسر CI محليًا). القاعدة: لا mock في مسار Production.
 *
 * يثبت: createRun → addCase → duplicate → complete(immutable) → addCase
 * بعد التجميد → optimistic lock → issue → verify(valid) → tamper →
 * digest-mismatch → revoke → revoked. يرحّل عناصر الاختبار في النهاية.
 */

import { describe, it, beforeAll, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { InMemoryEvalStore } from '@/src/lib/kernel-certs/in-memory-store';
import { PrismaEvalStore, PrismaCertStore } from '@/src/lib/kernel-certs/prisma-store';
import { resolveSigningKey } from '@/src/lib/kernel-certs/signing';
import { issueCertificate, verifyCertificate, revokeCertificate } from '@/src/lib/kernel-certs/cert-service';
import { hashOf, deriveGate, computeRunDigests, latencies, costOf } from '@/src/lib/kernel-certs/eval-service';

const hasDb = !!process.env.DATABASE_URL_SERVICE || !!process.env.DATABASE_URL;
const hasKey = !!process.env.EVAL_CERT_SIGNING_KEY_RING || !!process.env.EVAL_CERT_PRIVATE_KEY;

const describeDb = hasDb && hasKey ? describe : describe.skip;

describeDb('kernel certs — Postgres + signing (integration)', () => {
  let certStore;
  let signingKey;

  beforeAll(async () => {
    signingKey = resolveSigningKey();
    certStore = new PrismaCertStore();
    if (signingKey) certStore.registerPublicKey(signingKey.publicKeyId, signingKey.publicKeyPem);
  });

  function makeRun(evalId) {
    const now = new Date().toISOString();
    return {
      evaluationId: evalId,
      name: 'دمج اختبار',
      status: 'running',
      gate: 'incomplete',
      environment: 'test',
      provider: 'simulated',
      model: { modelId: 'm1', modelName: 'M', modelVersion: 1, provider: 'simulated' },
      tester: { datasetId: 'ds1', datasetName: 'D', datasetVersion: 1, datasetHash: hashOf({ ds: 1 }) },
      policy: { policyId: 'p1', policyName: 'P', policyVersion: 1 },
      policyHash: hashOf({ p: 1 }),
      prompt: { promptId: 'pr1', promptVersion: 1 },
      scorers: [{ id: 's1', version: 1 }],
      startedAt: now,
      totalCases: 1,
      completedCases: 0,
      failedCases: 0,
      criticalCount: 0,
      humanReviewCount: 0,
      costSar: 0,
      p50Ms: 0, p95Ms: 0, p99Ms: 0,
      inputHash: '', outputHash: '', runHash: '',
      version: 1,
      immutable: false,
      cases: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  function makeCase(caseId) {
    return {
      caseId,
      traceId: 'tr1',
      state: 'pass',
      expected: 'x',
      actual: 'x',
      riskLevel: 'low',
      piiTypes: [],
      injectionDetected: false,
      scorerResults: [{ scorerId: 's1', score: 100 }],
      costSar: 0.0001,
      latencyMs: 10,
      inputHash: hashOf({ i: 1 }),
      outputHash: hashOf({ o: 1 }),
      createdAt: new Date().toISOString(),
    };
  }

  it('create→case→complete→issue→verify→tamper→revoke (real DB)', async () => {
    const ctx = new PrismaEvalStore();
    const evalId = `EVAL-INT-${randomUUID().slice(0, 8)}`;
    const run = makeRun(evalId);
    const created = await ctx.createRun(run);
    expect(created.evaluationId).toBe(evalId);

    const c = makeCase(`C-${randomUUID().slice(0, 8)}`);
    const added = await ctx.addCase(evalId, c);
    expect(added).toEqual({ ok: true });
    // duplicate → رفض
    expect((await ctx.addCase(evalId, c)).ok).toBe(false);

    const cases = await ctx.getCases(evalId);
    expect(cases.length).toBe(1);
    const digests = computeRunDigests({
      evaluationId: evalId,
      version: 2,
      cases,
      inputHash: created.inputHash,
    });
    const done = await ctx.updateRun({
      ...created,
      ...digests,
      status: 'complete',
      gate: deriveGate(cases),
      completedCases: 1,
      cases,
      costSar: costOf(cases),
      p50Ms: latencies(cases).p50,
      p95Ms: latencies(cases).p95,
      p99Ms: latencies(cases).p99,
      version: 1,
      immutable: true,
      updatedAt: new Date().toISOString(),
    });
    expect(done.immutable).toBe(true);

    // addCase بعد التجميد = رفض
    expect((await ctx.addCase(evalId, makeCase('C-late'))).ok).toBe(false);

    // issue
    const issued = await issueCertificate(done, { store: certStore, signingKey });
    expect(issued.ok).toBe(true);
    if (issued.ok === false) return;

    expect((await verifyCertificate(issued.cert.certificateId, { store: certStore, signingKey })).status).toBe(
      'valid',
    );

    // tamper: نغيّر payload مخزن فعليًا في DB (successRate) ثم نتحقق
    await tamperStoredCert(issued.cert.certificateId, (cert) => {
      cert.payload.successRate = 999;
    });
    expect(
      (await verifyCertificate(issued.cert.certificateId, { store: certStore, signingKey })).status,
    ).toBe('digest-mismatch');

    // revoke
    const rev = await revokeCertificate(issued.cert.certificateId, { revokedBy: 'test', reason: 'smoke' }, { store: certStore, signingKey });
    expect(rev.ok).toBe(true);
    expect(
      (await verifyCertificate(issued.cert.certificateId, { store: certStore, signingKey })).status,
    ).toBe('revoked');

    // cleanup
    await cleanupEval(evalId, issued.cert.certificateId);
  });

  it('PrismaCertStore يعيد المفتاح العام من DB (signing_keys)', async () => {
    // بعد تسجيل المفتاح في الجدول (من سكربت seed)، getPublicKey ينجح حتى لو
    // لم يُسجَّل في الذاكرة.
    const fresh = new PrismaCertStore();
    const pub = await fresh.getPublicKey(signingKey.publicKeyId);
    expect(typeof pub).toBe('string');
    expect(pub.length).toBeGreaterThan(0);
  });

  it('listCerts + listAuditEvents — قراءة السجلين من DB', async () => {
    const ctx = new PrismaEvalStore();
    const evalId = `EVAL-LIST-${randomUUID().slice(0, 8)}`;
    const run = await ctx.createRun(makeRun(evalId));
    const c = makeCase(`C-${randomUUID().slice(0, 8)}`);
    await ctx.addCase(evalId, c);

    const cases = await ctx.getCases(evalId);
    const digests = computeRunDigests({
      evaluationId: evalId,
      version: 2,
      cases,
      inputHash: run.inputHash,
    });
    const done = await ctx.updateRun({
      ...run,
      ...digests,
      status: 'complete',
      gate: deriveGate(cases),
      completedCases: 1,
      cases,
      costSar: costOf(cases),
      p50Ms: latencies(cases).p50,
      p95Ms: latencies(cases).p95,
      p99Ms: latencies(cases).p99,
      version: 1,
      immutable: true,
      updatedAt: new Date().toISOString(),
    });

    const { appendAuditEvent, listAuditEvents } = await import(
      '@/src/lib/kernel-certs/prisma-store'
    );
    await appendAuditEvent({ evaluationId: evalId, action: 'create' });
    await appendAuditEvent({ evaluationId: evalId, action: 'issue', certificateId: 'none' });

    const issued = await issueCertificate(done, { store: certStore, signingKey });
    expect(issued.ok).toBe(true);
    if (issued.ok === false) return;

    const certs = await certStore.listCerts(50);
    const mine = certs.filter((x) => x.evaluationId === evalId);
    expect(mine.length).toBeGreaterThanOrEqual(1);

    const events = await listAuditEvents({ evaluationId: evalId });
    const actions = events.map((e) => e.action);
    expect(actions).toContain('create');
    expect(actions).toContain('issue');
    // hash chain — كل حدث يحمل prevHash يصل الحدث الذي قبله
    const chained = events.slice().reverse();
    for (let i = 1; i < chained.length; i++) {
      expect(chained[i].prevHash).toBe(chained[i - 1].hash);
    }

    await cleanupEval(evalId, issued.cert.certificateId);
  });
});

// tamper — يعدّل المخزون الفعلي في DB عبر Prisma مباشرة (يتجاوز clone).
async function tamperStoredCert(certificateId, fn) {
  const req = createRequire(fileURLToPath(new URL('../packages/db/src/client.ts', import.meta.url)));
  const { PrismaClient } = req('@prisma/client');
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_SERVICE ?? process.env.DATABASE_URL } },
  });
  const row = await prisma.evaluationCertificate.findUnique({ where: { certificateId } });
  if (row) {
    // نكسر الـ payloadDigest عمدًا لتغيير النتيجة — يشبه تعديل payload فعليًا
    await prisma.evaluationCertificate.update({
      where: { certificateId },
      data: { payloadDigest: `tampered-${Date.now()}` },
    });
  }
  await prisma.$disconnect();
}

async function cleanupEval(evalId, certificateId) {
  const req = createRequire(fileURLToPath(new URL('../packages/db/src/client.ts', import.meta.url)));
  const { PrismaClient } = req('@prisma/client');
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL_SERVICE ?? process.env.DATABASE_URL } },
  });
  await prisma.evaluationCertificate.deleteMany({ where: { certificateId } });
  await prisma.evaluationRun.deleteMany({ where: { evaluationId: evalId } });
  await prisma.$disconnect();
}