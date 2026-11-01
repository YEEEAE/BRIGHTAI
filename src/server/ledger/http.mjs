import { authenticate } from '../kernel/auth.mjs';
import { KernelError } from '../kernel/core.mjs';
import { operate } from './service.mjs';
const headers = { 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', Vary:'Authorization' };
async function readBody(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new KernelError(403,'ORIGIN_REJECTED','مصدر الطلب غير مسموح.');
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new KernelError(415,'INVALID_BODY','أرسل JSON فقط.');
  const reader = request.body?.getReader();
  if (!reader) throw new KernelError(400,'INVALID_BODY','الطلب فارغ.');
  const chunks = []; let size=0;
  try { while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>8192) { await reader.cancel(); throw new KernelError(413,'BODY_TOO_LARGE','الحد الأقصى للطلب 8KB.'); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new KernelError(400,'INVALID_BODY','تعذر قراءة JSON.'); }
}
export function createHandler(auth=authenticate, service=operate) {
  return async (request,operation,id) => {
    try {
      const identity=await auth(request);
      const params=new URL(request.url).searchParams;
      const body=['create','verify'].includes(operation)?await readBody(request):{};
      const data=await service(identity,params.get('workspace'),operation,body,params,id);
      const extra=operation==='export'?{'Content-Disposition':`attachment; filename="ledger-${id}.json"`}:{};
      return Response.json(data,{status:operation==='create'?201:200,headers:{...headers,...extra}});
    } catch(error) {
      const known=error instanceof KernelError;
      const setupCode=error?.code==='42P01'?'LEDGER_SCHEMA_MISSING':error?.code==='42501'?'LEDGER_DB_PRIVILEGE':null;
      const message=known?error.message:setupCode==='LEDGER_SCHEMA_MISSING'?'مخطط Ledger غير مهيأ؛ يحتاج المشغّل مراجعة الترحيل المعتمد. لم يُؤكد الحفظ أو التحقق.':setupCode==='LEDGER_DB_PRIVILEGE'?'صلاحيات قاعدة البيانات لا تسمح بعملية Ledger؛ يلزم مراجعة إعداد دور الخادم. لم يُؤكد الحفظ أو التحقق.':'تعذر إكمال العملية؛ تحقق من اتصال القاعدة وترحيل Ledger. لم يُؤكد الحفظ أو التحقق.';
      return Response.json({code:known?error.code:setupCode||'LEDGER_UNAVAILABLE',message},{status:known?error.status:503,headers});
    }
  };
}
export const handle=createHandler();
