import { bodySchemaFor } from '../api/request-schemas.mjs';
import { readJsonObject, validateBody } from '../api/json.mjs';
import { hasTrustedApiOrigin } from '../api/origin.mjs';
import { authenticate } from '../kernel/auth.mjs';
import { KernelError, dependencyStatusForError, workspaceSelector } from '../kernel/core.mjs';
import { contractHeaders, errorBody } from '../kernel/contracts.mjs';
import { captureIntegritySignal, captureServerFailure } from '../observability/index.mjs';
import { operate } from './service.mjs';
const headers = contractHeaders({ 'Cache-Control':'private, no-store', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', Vary:'Authorization' });
async function readBody(request) {
  if (!hasTrustedApiOrigin(request)) throw new KernelError(403,'ORIGIN_REJECTED','مصدر الطلب غير مسموح.');
  return readJsonObject(request, 8192);
}
export function createHandler(auth=authenticate, service=operate) {
  return async (request,operation,id) => {
    try {
      const identity=await auth(request);
      const params=new URL(request.url).searchParams;
      let body=['create','verify'].includes(operation)?await readBody(request):{};
      const schema = bodySchemaFor(request);
      if (schema) body = validateBody(schema, body);
      const data=await service(identity,workspaceSelector(params),operation,body,params,id);
      // An integrity mismatch is a security incident even when the response is
      // a normal 200 carrying the evidence. No IDs or metadata are sent.
      if(operation==='verify' && (data?.mismatch===true || data?.state==='BLOCKED')) {
        void captureIntegritySignal({surface:'ledger',pathname:new URL(request.url).pathname,operation:'verify'});
      } else if(operation==='list' && data?.verification?.mismatch===true) {
        void captureIntegritySignal({surface:'ledger',pathname:new URL(request.url).pathname,operation:'list'});
      }
      const extra=operation==='export'?{'Content-Disposition':`attachment; filename="ledger-${id}.json"`}:{};
      return Response.json(data,{status:operation==='create'?201:200,headers:{...headers,...extra}});
    } catch(error) {
      const known=error instanceof KernelError;
      const setupCode=['42P01','42703'].includes(error?.code)?'LEDGER_SCHEMA_MISSING':error?.code==='42501'?'LEDGER_DB_PRIVILEGE':null;
      const code=known?error.code:setupCode||'LEDGER_UNAVAILABLE';
      const status=known?error.status:503;
      void captureServerFailure(error,{surface:'ledger',code,status,pathname:new URL(request.url).pathname,dependency:known?dependencyStatusForError(error):setupCode==='LEDGER_SCHEMA_MISSING'?'not configured':setupCode==='LEDGER_DB_PRIVILEGE'?'access denied':'temporarily unavailable',operation:'POST'});
      const message=known?error.message:setupCode==='LEDGER_SCHEMA_MISSING'?'مخطط Ledger غير مهيأ؛ يحتاج المشغّل مراجعة الترحيل المعتمد. لم يُؤكد الحفظ أو التحقق.':setupCode==='LEDGER_DB_PRIVILEGE'?'صلاحيات قاعدة البيانات لا تسمح بعملية Ledger؛ يلزم مراجعة إعداد دور الخادم. لم يُؤكد الحفظ أو التحقق.':'تعذر إكمال العملية؛ تحقق من اتصال القاعدة وترحيل Ledger. لم يُؤكد الحفظ أو التحقق.';
      return Response.json(errorBody({status,code,message,dependencyStatus:known?dependencyStatusForError(error):setupCode==='LEDGER_SCHEMA_MISSING'?'not configured':setupCode==='LEDGER_DB_PRIVILEGE'?'access denied':'temporarily unavailable'}),{status,headers});
    }
  };
}
export const handle=createHandler();
