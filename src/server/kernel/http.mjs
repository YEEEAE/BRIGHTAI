import { authenticate } from './auth.mjs';
import { KernelError } from './core.mjs';
export const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Authorization', 'X-Content-Type-Options': 'nosniff' };
export function kernelHandler(work, write = false) {
  return async ({ request }) => {
    try {
      const identity = await authenticate(request);
      let body = {};
      if (write) {
        if (request.headers.get('origin') !== new URL(request.url).origin) throw new KernelError(403, 'ORIGIN_REJECTED', 'مصدر الطلب غير مسموح.');
        if (!request.headers.get('content-type')?.startsWith('application/json')) throw new KernelError(415, 'INVALID_BODY', 'أرسل طلب JSON.');
        const reader = request.body?.getReader();
        let raw = '', bytes = 0;
        const decoder = new TextDecoder();
        if (reader) {
          try { while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 4096) { await reader.cancel(); throw new KernelError(413, 'INVALID_BODY', 'الطلب أكبر من الحد المسموح.'); } raw += decoder.decode(value, { stream: true }); } raw += decoder.decode(); }
          finally { reader.releaseLock(); }
        }
        try { body = JSON.parse(raw); } catch (error) { if (error instanceof KernelError) throw error; throw new KernelError(400, 'INVALID_BODY', 'تعذر قراءة الطلب.'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new KernelError(400, 'INVALID_BODY', 'صيغة الطلب غير صالحة.');
      }
      return Response.json(await work(identity, new URL(request.url).searchParams.get('workspace'), body), { headers });
    } catch (error) {
      const known = error instanceof KernelError;
      const code = known ? error.code : error.code === '42P01' || error.code === '42703' ? 'KERNEL_SCHEMA_MISSING' : error.code === '42501' ? 'KERNEL_DB_PRIVILEGE' : 'DB_UNAVAILABLE';
      const message = known ? error.message : code === 'KERNEL_SCHEMA_MISSING' ? 'يلزم تطبيق ترحيل إدارة Kernel المعتمد قبل استخدام هذه الوظيفة.' : code === 'KERNEL_DB_PRIVILEGE' ? 'صلاحية اتصال النظام غير مهيأة لهذه الوظيفة.' : 'تعذر الاتصال بالخدمة؛ لم يُؤكد الحفظ. حدّث البيانات قبل إعادة الإرسال.';
      return Response.json({ code, message }, { headers, status: known ? error.status : 503 });
    }
  };
}
export function exact(body, keys) {
  if (Object.keys(body).some(key => !keys.includes(key))) throw new KernelError(400, 'INVALID_BODY', 'يحتوي الطلب حقولًا غير مسموحة.');
}
export function uuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new KernelError(400, 'INVALID_ID', 'المعرّف غير صالح.');
  return value;
}
