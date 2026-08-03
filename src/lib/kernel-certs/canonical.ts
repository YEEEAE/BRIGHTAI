/**
 * kernel-certs/canonical.ts — Canonical JSON (RFC 8785-ish) الدقيق.
 *
 * كل توقيع يُحسب على canonical form، لا على النص المنسّق: نفس الـ payload
 * يُدمج دائمًا لنفس السلسلة مهما تغيّر ترتيب المفاتيح أو المسافات عند
 * المتصل. هذا يضمن أن hash ثابت able للتحقق من كلا الطرفين.
 *
 * الملاحظة: عدد الحواشي للـ number يُقرّب لـ 9 خانات عشرية لضمان الثبات؛
 * كل أرقام الشهادة هنا ≤ 6 خانات فهي لا تتأثر. التوقيع يُحسب على السلسلة
 * المخرجة حرفيًا، فالـ round-trip مو محتاج لـ RFC 8785 bit-exact — فقط
 * يُسوى الحسيم بحيث المتصل والـ verifier يشتركان في نفس الـ result.
 */

export type CanonicalValue =
  | null
  | string
  | number
  | boolean
  | CanonicalValue[]
  | { [k: string]: CanonicalValue };

/**
 * يُسلّم أي unknown JSON-compatible value إلى سلسلة canonical.
 *  - مفاتيح الكائنات تُفرز أبجديًا (byte order).
 *  - -0 → 0؛ إعادة الروح غير المتناهية → null (آمنة؛ ما تعتبر hash مساوي).
 */
export function canonicalJson(input: unknown, seen?: WeakSet<object>): string {
  const seenSet = seen ?? new WeakSet<object>();

  if (input === null || input === undefined) return 'null';

  const t = typeof input;
  if (t === 'number') {
    const n = input as number;
    if (!Number.isFinite(n)) return 'null';
    if (Object.is(n, -0)) return '0';
    if (Number.isInteger(n)) return String(n);
    // ثبّت بـ 9 أرقام عشرية لمنع الـ float noise (كلنا ≤ 6 خانات).
    return String(Math.round(n * 1e9) / 1e9);
  }
  if (t === 'string') return JSON.stringify(input);
  if (t === 'boolean') return input ? 'true' : 'false';

  if (Array.isArray(input)) {
    if (seenSet.has(input)) return 'null';
    seenSet.add(input);
    const parts = input.map((v) => canonicalJson(v, seenSet));
    return `[${parts.join(',')}]`;
  }

  if (t === 'object') {
    const obj = input as Record<string, unknown>;
    if (seenSet.has(obj)) return 'null';
    seenSet.add(obj);
    const keys = Object.keys(obj).sort();
    const parts = keys.map(
      (k) => `${JSON.stringify(k)}:${canonicalJson(obj[k], seenSet)}`,
    );
    return `{${parts.join(',')}}`;
  }

  return 'null';
}