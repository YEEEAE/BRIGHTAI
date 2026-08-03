/**
 * kernel-certs/sha256.ts — بصمات SHA-256 للحمولات النصية.
 *
 * المركز الوحيد لتوليد بصمات الشهادة. كل التوقيعات تحوي بصمة SHA-256
 * واحدة أو أكثر (dataset/policy/prompt/output/run). لا نستخدم FNV-1a هنا
 * — FNV-1a تبقى مخصصة لتحديد أثر الـ Trace في المتصفح (kernel-hash.js)
 * ولا علاقة لها بصحة الشهادة (القاعدة: لا نستخدم FNV-1a في التوقيع).
 */

import { createHash, createHmac } from 'node:crypto';

/** SHA-256 hex من نص UTF-8. */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** SHA-256 من عدة مقاطع نصية (تمييز بالحدود — نفصل ببايت NUL). */
export function sha256Parts(...parts: string[]): string {
  const h = createHash('sha256');
  parts.forEach((p, i) => {
    if (i > 0) h.update(Buffer.from([0x00]));
    h.update(p, 'utf8');
  });
  return h.digest('hex');
}

/** HMAC-SHA256 hex (للـ webhooks/مصادقة الردود حيث نحتاج مفتاح سري). */
export function hmacSha256Hex(secret: string, input: string): string {
  return createHmac('sha256', secret).update(input, 'utf8').digest('hex');
}

/**
 * حاصل مباشر من نصين بواصلة محسوبة — لتسمية الملفات/الأزرار، لا للأمان.
 */
export function shortDigest(input: string, len = 12): string {
  return sha256Hex(input).slice(0, len);
}
