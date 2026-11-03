import { authenticate } from '../kernel/auth.mjs';
import { KernelError, dependencyStatusForError } from '../kernel/core.mjs';
import { contractHeaders, errorBody } from '../kernel/contracts.mjs';
import { operate } from './service.mjs';
const headers = contractHeaders({ 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', Vary:'Authorization' });
function setupError(error) {
  if (['42P01','42703'].includes(error?.code)) return { code:'HUMAN_GATE_SCHEMA_MISSING', message:'مخطط Human Gate غير مكتمل على قاعدة البيانات الحالية. يحتاج المشغّل مراجعة الترحيلات المعتمدة؛ لم يُؤكد الحفظ أو التنفيذ.' };
  if (error?.code === '42501') return { code:'HUMAN_GATE_DB_PRIVILEGE', message:'دور قاعدة بيانات التطبيق لا يملك الصلاحية المطلوبة على جداول Human Gate. يلزم مراجعة صلاحيات runtime؛ لم يُؤكد الحفظ أو التنفيذ.' };
  return null;
}
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
// Every POST route supplies a mandatory reason or payload; cancellation,
// delegation and revocation must not reach the service with an empty body.
const bodyOperations = new Set(['create','decide','execute','cancel','policy','delegate','revoke-delegation']);
export function createHandler(auth=authenticate, service=operate) {
  return async (request,operation,id) => {
    try {
      const identity=await auth(request);
      const params=new URL(request.url).searchParams;
      const body=bodyOperations.has(operation)?await readBody(request):{};
      const data=await service(identity,params.get('workspace'),operation,body,params,id);
      return Response.json(data,{status:operation==='create'?201:200,headers});
    } catch(error) {
      const known=error instanceof KernelError;
      const setup=known?null:setupError(error);
      const dependencyStatus=known?dependencyStatusForError(error):setup?.code==='HUMAN_GATE_SCHEMA_MISSING'?'not configured':setup?'access denied':'temporarily unavailable';
       return Response.json(errorBody({code:known?error.code:setup?.code||'HUMAN_GATE_UNAVAILABLE',message:known?error.message:setup?.message||'تعذر إكمال العملية؛ تحقق من اتصال القاعدة وترحيل Human Gate. لم يُؤكد الحفظ أو التنفيذ.',dependencyStatus}),{status:known?error.status:503,headers});
    }
  };
}
export const handle=createHandler();
