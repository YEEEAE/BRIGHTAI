import type { APIRoute } from 'astro';
import { errorResponse, privateHeaders, rejectMessage } from '../../../../server/secure-chat/service.mjs';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) {
      return Response.json({ code: 'ORIGIN_REJECTED', message: 'مصدر الطلب غير مسموح.' }, { status: 403, headers: privateHeaders });
    }
    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return Response.json({ code: 'INVALID_BODY', message: 'صيغة الطلب غير مدعومة.' }, { status: 415, headers: privateHeaders });
    }
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > 8192) {
      return Response.json({ code: 'BODY_TOO_LARGE', message: 'الطلب أكبر من الحد المسموح.' }, { status: 413, headers: privateHeaders });
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8192) {
      return Response.json({ code: 'BODY_TOO_LARGE', message: 'الطلب أكبر من الحد المسموح.' }, { status: 413, headers: privateHeaders });
    }
    let body: unknown;
    try { body = JSON.parse(raw); } catch {
      return Response.json({ code: 'INVALID_BODY', message: 'تعذر قراءة الطلب.' }, { status: 400, headers: privateHeaders });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['message', 'modelId'].includes(key))) {
      return Response.json({ code: 'INVALID_BODY', message: 'حقول الطلب غير مدعومة.' }, { status: 400, headers: privateHeaders });
    }
    await rejectMessage(request, (body as { modelId?: unknown }).modelId as string, (body as { message?: unknown }).message as string);
    return Response.json({ code: 'UNEXPECTED_PROVIDER_STATE' }, { status: 503, headers: privateHeaders });
  } catch (error) {
    return errorResponse(error);
  }
};
