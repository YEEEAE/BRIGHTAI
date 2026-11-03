import { authenticate } from './auth.mjs';
import { KernelError, dependencyStatusForError } from './core.mjs';
export const headers = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  Vary: 'Authorization',
  'X-Content-Type-Options': 'nosniff',
};

// Small abuse guard for administrative writes. It is per process and is not an
// authorization or durable quota; product endpoints keep their own stored limits.
const WRITE_WINDOW_MS = 60_000;
const WRITE_WINDOW_MAX = 60;
const writeWindows = new Map();

function consumeWriteBudget(key) {
  const now = Date.now();
  const current = writeWindows.get(key);
  if (!current || current.reset <= now) {
    if (writeWindows.size > 2000) {
      for (const [entry, window] of writeWindows) if (window.reset <= now) writeWindows.delete(entry);
      // Hard bound: resetting an abuse guard is safer than unbounded process memory.
      if (writeWindows.size > 5000) writeWindows.clear();
    }
    writeWindows.set(key, { count: 1, reset: now + WRITE_WINDOW_MS });
    return;
  }
  current.count += 1;
  if (current.count > WRITE_WINDOW_MAX) {
    throw new KernelError(429, 'RATE_LIMITED', 'تجاوزت عدد طلبات الكتابة المسموح في الدقيقة؛ لم يُنفذ الطلب. انتظر ثم أعد المحاولة يدويًا.');
  }
}

export function kernelHandler(work, write = false) {
  return async ({ request }) => {
    try {
      const identity = await authenticate(request);
      let body = {};
      if (write) {
        consumeWriteBudget(`${identity.userId}:${new URL(request.url).pathname}`);
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
      const code = known ? error.code : error?.code === '42P01' || error?.code === '42703' ? 'KERNEL_SCHEMA_MISSING' : error?.code === '42501' ? 'KERNEL_DB_PRIVILEGE' : 'DB_UNAVAILABLE';
      const message = known ? error.message : code === 'KERNEL_SCHEMA_MISSING' ? 'يلزم تطبيق ترحيل إدارة Kernel المعتمد قبل استخدام هذه الوظيفة.' : code === 'KERNEL_DB_PRIVILEGE' ? 'صلاحية اتصال النظام غير مهيأة لهذه الوظيفة.' : 'تعذر الاتصال بالخدمة؛ لم يُؤكد الحفظ. حدّث البيانات قبل إعادة الإرسال.';
      const dependencyStatus=known?dependencyStatusForError(error):code==='KERNEL_SCHEMA_MISSING'?'not configured':code==='KERNEL_DB_PRIVILEGE'?'access denied':'temporarily unavailable';
      const responseHeaders = code === 'RATE_LIMITED' ? { ...headers, 'Retry-After': '60' } : headers;
      return Response.json({ code, message, ...(dependencyStatus ? { dependencyStatus } : {}) }, { headers: responseHeaders, status: known ? error.status : 503 });
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
