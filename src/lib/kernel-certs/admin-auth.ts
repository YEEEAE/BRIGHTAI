/**
 * kernel-certs/admin-auth.ts — مصادقة إدارية (خادم) لعمليات الشهادة.
 *
 * نفس نمط quota-stats.ts: header `x-brightai-admin-key` يقارن مع
 * BRIGHTAI_ADMIN_KEY عبر timingSafeEqual. يُستخدم فقط لعمليات الكتابة/
 * الإصدار/التحقق من جهة خادم موثوقة. التحقق العام عبر الرابط يبقى بلا
 * مصادقة (catends purpose)، لكن كل عمليات الـ issue/revoke محمية هنا.
 */

import { timingSafeEqual } from 'node:crypto';

/** نتيجة فحص المصادقة. unauthorized/not_configured → status غير 2xx. */
export interface AdminAuthResult {
  authorized: boolean;
  status?: number;
  reason?: string;
}

/** Constant-time admin check. 503 = خرط المفتاح، 403 = غير مصرح. */
export function isAdminAuthorized(request: Request): AdminAuthResult {
  const expected = process.env.BRIGHTAI_ADMIN_KEY;
  if (!expected || typeof expected !== 'string' || expected.length === 0) {
    return { authorized: false, status: 503, reason: 'admin_key_not_configured' };
  }
  const provided = request.headers.get('x-brightai-admin-key');
  if (!provided) {
    return { authorized: false, status: 403, reason: 'unauthorized' };
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return { authorized: false, status: 403, reason: 'unauthorized' };
  }
  const ok = timingSafeEqual(a, b);
  return ok
    ? { authorized: true }
    : { authorized: false, status: 403, reason: 'unauthorized' };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}