import { authenticate } from '../kernel/auth.mjs';
import { KernelError } from '../kernel/core.mjs';
import { operate } from './service.mjs';

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Authorization', 'X-Content-Type-Options': 'nosniff' };
const allowedFields = {
  dashboard: [],
  create: ['template', 'name', 'pattern', 'action', 'priority'],
  update: ['id', 'version', 'enabled', 'name', 'pattern', 'action', 'priority'],
  evaluate: ['text', 'synthetic'],
  enforce: ['text', 'synthetic', 'request_id'],
};
async function readBody(request, operation) {
  const origin = request.headers.get('origin');
  // Integration clients use the same authenticated user JWT and may omit Origin.
  // Browser mutations must remain same-origin. No CORS or cookie authentication.
  if (origin !== new URL(request.url).origin && !(operation === 'enforce' && origin === null && /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? ''))) throw new KernelError(403, 'ORIGIN_REJECTED', 'مصدر الطلب غير مسموح.');
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new KernelError(415, 'INVALID_BODY', 'أرسل JSON فقط.');
  const reader = request.body?.getReader();
  if (!reader) throw new KernelError(400, 'INVALID_BODY', 'الطلب فارغ.');
  const chunks = []; let size = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 18000) { await reader.cancel(); throw new KernelError(413, 'BODY_TOO_LARGE', 'الطلب أكبر من الحد المسموح.'); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!body || Array.isArray(body) || typeof body !== 'object') throw 0; return body; }
  catch { throw new KernelError(400, 'INVALID_BODY', 'تعذر قراءة الطلب.'); }
}
// Database setup states are reported by code, never by raw driver text.
function setupError(error) {
  if (error?.code === '42P01') return new KernelError(503, 'FIREWALL_SCHEMA_MISSING', 'جداول Firewall غير موجودة على قاعدة البيانات الحالية. طبّق الترحيل في بيئة معتمدة قبل استخدام المختبر.');
  if (error?.code === '42703') return new KernelError(503, 'FIREWALL_SCHEMA_OUTDATED', 'مخطط Firewall لا يطابق نسخة التطبيق؛ راجع الترحيل المعتمد قبل الاستخدام.');
  if (error?.code === '42501') return new KernelError(503, 'FIREWALL_DB_PRIVILEGE', 'دور قاعدة بيانات التطبيق لا يملك صلاحية على جداول Firewall. راجع صلاحيات runtime.');
  return null;
}
export function createHandler(auth = authenticate, service = operate) {
  return async function handle(request, operation) {
    try {
      const identity = await auth(request);
      const url = new URL(request.url);
      const fields = allowedFields[operation];
      if (!fields) throw new KernelError(404, 'NOT_FOUND', 'المسار غير موجود.');
      const body = operation === 'dashboard' ? {} : await readBody(request, operation);
      if (Object.keys(body).some(key => !fields.includes(key))) throw new KernelError(400, 'INVALID_BODY', 'حقول الطلب غير مسموحة.');
      const query = Object.fromEntries(['action','reason','mode','from','to','page'].map(key => [key, url.searchParams.get(key) ?? (key === 'page' ? '1' : '')]));
      const data = await service(identity, url.searchParams.get('workspace'), operation, body, query);
      const { httpStatus, ...payload } = data;
      return Response.json(payload, { headers, status: httpStatus ?? (operation === 'create' ? 201 : 200) });
    } catch (error) {
      const known = error instanceof KernelError ? error : setupError(error);
      if (known) return Response.json({ code: known.code, message: known.message }, { headers, status: known.status });
      return Response.json({ code: 'FIREWALL_UNAVAILABLE', message: 'تعذر تأكيد نتيجة العملية؛ تحقق من إعداد قاعدة البيانات والسجل. لا تتابع خارج مسار الإنفاذ ولا تعِد التنفيذ تلقائيًا.' }, { headers, status: 503 });
    }
  };
}
export const handle = createHandler();
