import { bodySchemaFor } from '../api/request-schemas.mjs';
import { readJsonObject, validateBody } from '../api/json.mjs';
import { hasTrustedApiOrigin } from '../api/origin.mjs';
import { authenticate } from '../kernel/auth.mjs';
import { KernelError, dependencyStatusForError, workspaceSelector } from '../kernel/core.mjs';
import { contractHeaders, errorBody } from '../kernel/contracts.mjs';
import { captureServerFailure } from '../observability/index.mjs';
import { operate } from './service.mjs';
const headers = contractHeaders({ 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', Vary:'Authorization' });
export async function readBody(request) {
  if (!hasTrustedApiOrigin(request)) throw new KernelError(403,'ORIGIN_REJECTED','مصدر الطلب غير مسموح.');
  return readJsonObject(request, 8192);
}
export function createHandler(auth=authenticate, service=operate) {
  return async (request,operation,id) => {
    try {
      const identity=await auth(request);
      const params=new URL(request.url).searchParams;
      let body=['create','update','assess','save-treatment','archive'].includes(operation)?await readBody(request):{};
      const schema = bodySchemaFor(request);
      if (schema) body = validateBody(schema, body);
      const data=await service(identity,workspaceSelector(params),operation,body,params,id,request.headers.get('Idempotency-Key'));
      return Response.json(data,{status:['create','assess','save-treatment'].includes(operation)?201:200,headers:{...headers,...(operation==='export'?{'Content-Disposition':'attachment; filename="aigas-risk-register.json"'}:{})}});
    } catch(error) {
      if(error?.code==='42P01'||error?.code==='42703')error=new KernelError(503,'RISK_ENGINE_SCHEMA_MISSING','مخطط Risk Engine أو أحدث حقوله غير متاح؛ يلزم تطبيق 0005 ثم 0008 ثم 0015 ثم 0026 على بيئة معتمدة.');
      if(error?.code==='42501')error=new KernelError(503,'RISK_ENGINE_DB_PRIVILEGE','صلاحيات قاعدة البيانات لا تسمح بهذه العملية؛ راجع مسؤول التشغيل.');
      if(error?.code==='23505')error=new KernelError(409,'RISK_ENGINE_CONFLICT','تغيّر السجل أو الإصدار أثناء الحفظ؛ حدّث الصفحة وأعد المحاولة دون تكرار.');
      if(error?.code==='23514'&&error.table?.startsWith('aigas_re_'))error=new KernelError(400,'RISK_ENGINE_CONSTRAINT','المدخلات لا تحقق قيد سجل المخاطر المحفوظ؛ راجع الحقول المطلوبة.');
      if(error?.code==='23503')error=new KernelError(409,'RISK_ENGINE_REFERENCE','مرجع الأصل أو التقييم غير متاح في النسخة الحالية؛ حدّث السجل وأعد المحاولة.');
      const known=error instanceof KernelError;
      const dependencyStatus=known?(error.dependencyStatus??(error.code.includes('SCHEMA')?'not configured':error.code.includes('PRIVILEGE')?'access denied':dependencyStatusForError(error))):'temporarily unavailable';
      const code=known?error.code:'RISK_ENGINE_UNAVAILABLE';
      const status=known?error.status:503;
      void captureServerFailure(error,{surface:'risk-engine',code,status,pathname:new URL(request.url).pathname,dependency:dependencyStatus,operation:'POST'});
      return Response.json(errorBody({status,code,message:known?error.message:'تعذر إكمال العملية؛ تحقق من اتصال القاعدة وترحيل Risk Engine. لم يُؤكد الحفظ أو التحقق.',dependencyStatus}),{status,headers});
    }
  };
}
export const handle=createHandler();
