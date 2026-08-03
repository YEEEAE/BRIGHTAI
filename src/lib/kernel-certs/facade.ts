/**
 * kernel-certs/facade.ts — واجهة إنتاجية تجمع مخزن Prisma + التوقيع + audit
 * في دالة واحدة قابلة للحقن. تُستخدم من API routes.
 *
 * في بداية الـ boot تُسجَّل المفاتيح العامة المتاحة (من env key ring)
 * حتى يتمكن التحقق من أي شهادة قديمة حتى بعد rotation.
 */

import { resolveSigningKey, type SigningKeyPair } from './signing';
import { PrismaCertStore, PrismaEvalStore } from './prisma-store';
import { type CertServiceDeps } from './cert-service';
import { type EvalStore } from './eval-service';

export interface KernelCertsContext {
  store: EvalStore;
  certStore: PrismaCertStore;
  signingKey: SigningKeyPair | null;
}

let cached: KernelCertsContext | null = null;

/** يبني السياق مرة واحدة ويعيده (سنجلتون داخل العملية). */
export function getCertsContext(): KernelCertsContext {
  if (cached) return cached;
  const store = new PrismaEvalStore();
  const certStore = new PrismaCertStore();
  const signingKey = resolveSigningKey();

  // سجّل المفتاح النشط في registry التحقق (حتى يَستخدمه الـ verify).
  if (signingKey) {
    certStore.registerPublicKey(signingKey.publicKeyId, signingKey.publicKeyPem);
  }

  cached = { store, certStore, signingKey };
  return cached;
}

/** يعيد حقن المخازن (للاختبارات). */
export function resetCertsContext(): void {
  cached = null;
}

/** Facade مشترك يُستدعى من الـ API دون الاعتماد على الملفات الفردية. */
export function buildCertDeps(ctx = getCertsContext()): CertServiceDeps {
  return { store: ctx.certStore, signingKey: ctx.signingKey };
}

// الاسم المستعار أدناه يجمع كليهما للراحة (لا كود إضافي).
export type KernelEvalStore = EvalStore;
export type { StoredEvaluationRun } from './eval-service';