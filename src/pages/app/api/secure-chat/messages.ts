import type { APIRoute } from 'astro';
import { errorResponse, privateHeaders, sendMessage, cancelMessage } from '../../../../server/secure-chat/service.mjs';
import { KernelError } from '../../../../server/kernel/core.mjs';
export const prerender = false;

async function bodyFor(request: Request, keys: string[]) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new KernelError(403,'ORIGIN_REJECTED','مصدر الطلب غير مسموح.');
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new KernelError(415,'INVALID_BODY','صيغة الطلب غير مدعومة.');
  const reader=request.body?.getReader();
  if (!reader) throw new KernelError(400,'INVALID_BODY','الطلب فارغ.');
  const decoder=new TextDecoder();
  let raw='',bytes=0;
  try {
    while (true) {
      const {done,value}=await reader.read();
      if (done) break;
      bytes+=value.byteLength;
      if (bytes>131072) { await reader.cancel(); throw new KernelError(413,'BODY_TOO_LARGE','الطلب أكبر من الحد التقني المسموح.'); }
      raw+=decoder.decode(value,{stream:true});
    }
    raw+=decoder.decode();
  } finally { reader.releaseLock(); }
  let body;
  try { body=JSON.parse(raw); } catch { throw new KernelError(400,'INVALID_BODY','تعذر قراءة الطلب.'); }
  if (!body || typeof body!=='object' || Array.isArray(body) || Object.keys(body).some(key=>!keys.includes(key))) throw new KernelError(400,'INVALID_BODY','حقول الطلب غير مدعومة.');
  return body;
}
export const POST: APIRoute = async ({request}) => {
  try {
    const body=await bodyFor(request,['requestId','modelId','message','history','syntheticAcknowledged']);
    return Response.json(await sendMessage(request,body),{headers:privateHeaders});
  } catch(error) { return errorResponse(error); }
};
export const DELETE: APIRoute = async ({request}) => {
  try {
    const body=await bodyFor(request,['requestId']);
    return Response.json(await cancelMessage(request,body.requestId),{headers:privateHeaders});
  } catch(error) { return errorResponse(error); }
};
