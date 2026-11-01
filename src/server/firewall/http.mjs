import { authenticate } from '../kernel/auth.mjs';
import { KernelError } from '../kernel/core.mjs';
import { operate } from './service.mjs';
const headers = { 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', Vary:'Authorization', 'X-Content-Type-Options':'nosniff' };
async function readBody(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new KernelError(403,'ORIGIN_REJECTED','مصدر الطلب غير مسموح.');
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new KernelError(415,'INVALID_BODY','أرسل JSON فقط.');
  const reader = request.body?.getReader();
  if (!reader) throw new KernelError(400,'INVALID_BODY','الطلب فارغ.');
  const chunks = []; let size = 0;
  try { while (true) { const {done,value} = await reader.read(); if(done) break; size += value.length; if(size>18000) { await reader.cancel(); throw new KernelError(413,'BODY_TOO_LARGE','الطلب أكبر من الحد المسموح.'); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString('utf8')); if(!body || Array.isArray(body) || typeof body !== 'object') throw 0; return body; }
  catch { throw new KernelError(400,'INVALID_BODY','تعذر قراءة الطلب.'); }
}
export function createHandler(auth = authenticate, service = operate) {
  return async function handle(request, operation) {
    try {
      const identity = await auth(request);
      const url = new URL(request.url);
      const body = operation === 'dashboard' ? {} : await readBody(request);
      const allowed = {dashboard:[],create:['template'],toggle:['id','enabled','version'],evaluate:['text']}[operation];
      if (!allowed || Object.keys(body).some(k=>!allowed.includes(k))) throw new KernelError(400,'INVALID_BODY','حقول الطلب غير مسموحة.');
      return Response.json(await service(identity,url.searchParams.get('workspace'),operation,body,url.searchParams.get('action') ?? ''),{headers,status:operation==='create'?201:200});
    } catch(error) {
      const known = error instanceof KernelError;
      return Response.json({code:known?error.code:'FIREWALL_UNAVAILABLE',message:known?error.message:'تعذر إكمال العملية؛ تحقق من اتصال القاعدة وترحيل Firewall. لم يُصدر سماح.'},{headers,status:known?error.status:503});
    }
  };
}
export const handle = createHandler();
