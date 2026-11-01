import type { APIRoute } from 'astro';
import { authenticate } from '../../../server/kernel/auth.mjs';
import { dashboard, createWorkspace } from '../../../server/kernel/service.mjs';
import { KernelError } from '../../../server/kernel/core.mjs';
export const prerender = false;
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff' };
async function handle(request: Request, write = false) {
  try {
    const identity = await authenticate(request);
    if (write) {
      if (request.headers.get('origin') !== new URL(request.url).origin) throw new KernelError(403, 'ORIGIN_REJECTED', 'مصدر الطلب غير مسموح.');
      if (!request.headers.get('content-type')?.startsWith('application/json')) throw new KernelError(415, 'INVALID_BODY', 'صيغة الطلب غير مدعومة.');
      const raw = await request.text();
      if (raw.length > 2048) throw new KernelError(413, 'INVALID_BODY', 'الطلب أكبر من الحد المسموح.');
      let body;
      try { body = JSON.parse(raw); } catch { throw new KernelError(400, 'INVALID_BODY', 'تعذر قراءة الطلب.'); }
      if (!body || Object.keys(body).some(k => k !== 'name')) throw new KernelError(400, 'INVALID_BODY', 'أرسل اسم مساحة العمل فقط.');
      const tenant = await createWorkspace(identity, body.name);
      return Response.json(await dashboard(identity, tenant), { status: 201, headers });
    }
    return Response.json(await dashboard(identity, new URL(request.url).searchParams.get('workspace')), { headers });
  } catch (error: any) {
    const known = error instanceof KernelError;
    return Response.json({ code: known ? error.code : 'DB_UNAVAILABLE', message: known ? error.message : 'تعذر تحميل بيانات المساحة. تحقق من اتصال القاعدة وترحيل Kernel.' }, { status: known ? error.status : 503, headers });
  }
}
export const GET: APIRoute = ({ request }) => handle(request);
export const POST: APIRoute = ({ request }) => handle(request, true);
