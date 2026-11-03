import { authenticate } from '../kernel/auth.mjs';
import { KernelError, dependencyStatusForError } from '../kernel/core.mjs';
import { contractHeaders, errorBody } from '../kernel/contracts.mjs';
import { operate } from './service.mjs';
const headers = contractHeaders({ 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', Vary:'Authorization' });
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
      const body=['create','update','assess','save-treatment','archive'].includes(operation)?await readBody(request):{};
      const data=await service(identity,params.get('workspace'),operation,body,params,id);
      return Response.json(data,{status:['create','assess','save-treatment'].includes(operation)?201:200,headers:{...headers,...(operation==='export'?{'Content-Disposition':'attachment; filename="aigas-risk-register.json"'}:{})}});
    } catch(error) {
      if(error?.code==='42P01'||error?.code==='42703')error=new KernelError(503,'RISK_ENGINE_SCHEMA_MISSING','مخطط Risk Engine أو أحدث حقوله غير متاح؛ يلزم تطبيق 0005 ثم 0008 ثم 0015 على بيئة معتمدة.');
      if(error?.code==='42501')error=new KernelError(503,'RISK_ENGINE_DB_PRIVILEGE','صلاحيات قاعدة البيانات لا تسمح بهذه العملية؛ راجع مسؤول التشغيل.');
      if(error?.code==='23505')error=new KernelError(409,'RISK_ENGINE_CONFLICT','تغيّر السجل أو الإصدار أثناء الحفظ؛ حدّث الصفحة وأعد المحاولة دون تكرار.');
      if(error?.code==='23514')error=new KernelError(400,'RISK_ENGINE_CONSTRAINT','المدخلات لا تحقق قيد سجل المخاطر المحفوظ؛ راجع الحقول المطلوبة.');
      if(error?.code==='23503')error=new KernelError(409,'RISK_ENGINE_REFERENCE','مرجع الأصل أو التقييم غير متاح في النسخة الحالية؛ حدّث السجل وأعد المحاولة.');
      const known=error instanceof KernelError;
      const dependencyStatus=known?(error.dependencyStatus??(error.code.includes('SCHEMA')?'not configured':error.code.includes('PRIVILEGE')?'access denied':dependencyStatusForError(error))):'temporarily unavailable';
      return Response.json(errorBody({code:known?error.code:'RISK_ENGINE_UNAVAILABLE',message:known?error.message:'تعذر إكمال العملية؛ تحقق من اتصال القاعدة وترحيل Risk Engine. لم يُؤكد الحفظ أو التحقق.',dependencyStatus}),{status:known?error.status:503,headers});
    }
  };
}
export const handle=createHandler();
