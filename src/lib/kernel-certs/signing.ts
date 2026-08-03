/**
 * kernel-certs/signing.ts — التوقيع الرقمي لشهادات التقييم.
 *
 * Algorithm: Ed25519 عبر node:crypto (createSign/createVerify). لا تُستخدم
 * libs خارجية. المفتاح الخاص لا يُحفظ في المتصفح ولا في الـ client bundle
 * ولا في Git — يأتي من env فقط.
 *
 * مالك المفتاح: «يزيد البديوي» (signedBy). الاسم ثابت داخل الـ payload
 * الموقَّع (وليس خارجيًا)، فأي تغيير عليه يكسر التحقق.
 *
 * Rotation:
 *   - المفتاح النشط يُقرأ من EVAL_CERT_SIGNING_KEY_RING (JSON array) أو
 *     EVAL_CERT_PRIVATE_KEY + EVAL_CERT_PUBLIC_KEY + EVAL_CERT_KEY_ID.
 *   - كل شهادة تحفظ publicKeyId (المفتاح الذي وقّع). عند التحقق نبحث عن
 *     المفتاح العام بهذا الـ id — حتى بعد الـ rotation تبقى الشهادة صالحة.
 *
 * التوقيع: نوقّع على sha256Hex(canonicalJson(payload)) ثم نحتفظ بالـ digest
 * مع التوقيع. أي تعديل في الـ payload بعد التوقيع يغيّر الـ digest فيفشل
 * التحقق (تلاعب مكتشف تلقائيًا).
 */

import {
  generateKeyPairSync,
  sign,
  verify,
} from 'node:crypto';
import { canonicalJson } from './canonical';
import { sha256Hex } from './sha256';

export interface SigningKeyPair {
  keyId: string;
  algorithm: 'Ed25519';
  publicKeyPem: string;
  /** privateKey PEM (PKCS#8) — يستخدم للـ sign فقط، لا يُسرب. */
  privateKeyPem: string;
  publicKeyId: string;
}

export interface SignBundle {
  algorithm: 'SHA-256';
  signedBy: string;
  signature: string;
  signedAt: string;
  publicKeyId: string;
  payloadDigest: string;
}

/**
 * يستخرج مفتاح التوقيع النشط من env. يعيد null إن لم يكن مكوّنًا
 * (عندها كل عمليات الـ issue تُفشل بخطأ misconfigured).
 */
export function resolveSigningKey(
  env: NodeJS.ProcessEnv = process.env,
): SigningKeyPair | null {
  const ringRaw = env.EVAL_CERT_SIGNING_KEY_RING;
  if (ringRaw) {
    try {
      const ring = JSON.parse(ringRaw) as Array<{
        keyId: string;
        privateKey: string;
        publicKey: string;
      }>;
      if (Array.isArray(ring) && ring.length > 0) {
        const active = ring[ring.length - 1];
        if (active?.privateKey && active?.publicKey) {
          return {
            keyId: active.keyId,
            algorithm: 'Ed25519',
            publicKeyPem: active.publicKey,
            privateKeyPem: active.privateKey,
            publicKeyId: active.keyId,
          };
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  const privateKey = env.EVAL_CERT_PRIVATE_KEY;
  const publicKey = env.EVAL_CERT_PUBLIC_KEY;
  const keyId = env.EVAL_CERT_KEY_ID || 'v1';
  if (privateKey && publicKey) {
    return {
      keyId,
      algorithm: 'Ed25519',
      publicKeyPem: publicKey,
      privateKeyPem: privateKey,
      publicKeyId: keyId,
    };
  }
  return null;
}

/** إنتاج مفتاح Ed25519 جديد (لوحدة إعداد/توليد مفتاح للنشر). */
export function generateSigningKeyPair(keyId = 'v1'): SigningKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    keyId,
    algorithm: 'Ed25519',
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKeyId: keyId,
  };
}

/**
 * توقيع حمولة. يوقّع على sha256Hex(canonicalJson(payload)) باستخدام
 * createSign('sha256') على البايتات الكاملة للـ canonical (Ed25519 يقبل
 * الهاش كـ message). يعيد bundle كامل مع digest محفوظ.
 */
export function signPayload(
  payload: unknown,
  signingKey: SigningKeyPair,
  opts: { signedBy: string; now?: string },
): SignBundle {
  const canonical = canonicalJson(payload);
  const digest = sha256Hex(canonical);
  // Ed25519 self-hashes — one-shot `sign(null, data, key)`.
  const signature = sign(null, Buffer.from(canonical, 'utf8'), signingKey.privateKeyPem).toString(
    'base64',
  );
  return {
    algorithm: 'SHA-256',
    signedBy: opts.signedBy,
    signature,
    signedAt: opts.now ?? new Date().toISOString(),
    publicKeyId: signingKey.publicKeyId,
    payloadDigest: digest,
  };
}

/**
 * تحقق من التوقيع ضد الحمولة + المفتاح العام + الـ digest المحفوظ.
 *
 * يعيد 'valid' فقط إذا:
 *   1. digest المأخوذ من canonical الحالي = payloadDigest المحفوظ
 *      (يثبت أن الحمولة لم تُعدّل بعد التوقيع).
 *   2. توقيع Ed25519 صحيح ضد المفتاح العام.
 *
 * أي انحراف → يعيد 'tampered' (أو 'mismatch' لو البصمات اختلفت فقط).
 */
export function verifyPayload(
  payload: unknown,
  bundle: Pick<SignBundle, 'signature' | 'payloadDigest'>,
  publicKeyPem: string,
): { status: 'valid' } | { status: 'tampered' | 'digest-mismatch'; reason: string } {
  const canonical = canonicalJson(payload);
  const digest = sha256Hex(canonical);
  if (digest !== bundle.payloadDigest) {
    return {
      status: 'digest-mismatch',
      reason: 'payload digest changed since signing',
    };
  }
  try {
    const ok = verify(null, Buffer.from(canonical, 'utf8'), publicKeyPem, Buffer.from(bundle.signature, 'base64'));
    return ok
      ? { status: 'valid' }
      : { status: 'tampered', reason: 'signature verification failed' };
  } catch (err) {
    return {
      status: 'tampered',
      reason: `signature parse/verify error: ${(err as Error).message}`,
    };
  }
}
