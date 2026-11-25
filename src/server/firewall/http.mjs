import { bodySchemaFor } from '../api/request-schemas.mjs';
import { readJsonObject, validateBody } from '../api/json.mjs';
import { hasTrustedApiOrigin } from '../api/origin.mjs';
import { authenticate } from '../kernel/auth.mjs';
import { KernelError, dependencyStatusForError, workspaceSelector } from '../kernel/core.mjs';
import { contractHeaders, errorBody } from '../kernel/contracts.mjs';
import { captureServerFailure } from '../observability/index.mjs';
import { operate } from './service.mjs';

const headers = contractHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Authorization', 'X-Content-Type-Options': 'nosniff' });
const allowedFields = {
  dashboard: [],
  create: ['template', 'duplicate_of', 'name', 'pattern', 'action', 'priority'],
  update: ['id', 'version', 'enabled', 'name', 'pattern', 'action', 'priority'],
  delete: ['id', 'version'],
  evaluate: ['text', 'synthetic', 'tool_call'],
  enforce: ['text', 'synthetic', 'request_id', 'department_id', 'tool_call'],
};
async function readBody(request, operation) {
  const origin = request.headers.get('origin');
  // Integration clients use the same authenticated user JWT and may omit Origin.
  // Browser mutations must remain same-origin. No CORS or cookie authentication.
  if (!hasTrustedApiOrigin(request) && !(operation === 'enforce' && origin === null && /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? ''))) throw new KernelError(403, 'ORIGIN_REJECTED', 'مصدر الطلب غير مسموح.');
  return readJsonObject(request, 18000);
}
// Database setup states are reported by code, never by raw driver text.
// `setup: true` lets the UI say «التهيئة غير مكتملة» instead of showing a decision.
function setupError(error) {
  if (error?.code === '42P01') return new KernelError(503, 'FIREWALL_SCHEMA_MISSING', 'التهيئة غير مكتملة: جداول Firewall غير موجودة على قاعدة البيانات الحالية. طبّق الترحيل في بيئة معتمدة قبل استخدام المختبر.');
  if (error?.code === '42703') return new KernelError(503, 'FIREWALL_SCHEMA_OUTDATED', 'التهيئة غير مكتملة: مخطط Firewall لا يطابق نسخة التطبيق؛ راجع الترحيل المعتمد قبل الاستخدام.');
  if (error?.code === '42501') return new KernelError(503, 'FIREWALL_DB_PRIVILEGE', 'التهيئة غير مكتملة: دور قاعدة بيانات التطبيق لا يملك صلاحية على جداول Firewall. راجع صلاحيات runtime.');
  return null;
}
export function createHandler(auth = authenticate, service = operate) {
  return async function handle(request, operation) {
    try {
      const identity = await auth(request);
      const url = new URL(request.url);
      const fields = allowedFields[operation];
      if (!fields) throw new KernelError(404, 'NOT_FOUND', 'المسار غير موجود.');
      let body = operation === 'dashboard' ? {} : await readBody(request, operation);
      const schema = bodySchemaFor(request);
      if (schema) body = validateBody(schema, body);
      if (Object.keys(body).some(key => !fields.includes(key))) throw new KernelError(400, 'INVALID_BODY', 'حقول الطلب غير مسموحة.');
      const query = Object.fromEntries(['action', 'reason', 'mode', 'from', 'to', 'page'].map(key => [key, url.searchParams.get(key) ?? (key === 'page' ? '1' : '')]));
      const data = await service(identity, workspaceSelector(url.searchParams), operation, body, query);
      const { httpStatus, ...payload } = data;
      // A provider timeout is returned as data, not thrown: the provider state is
      // UNKNOWN, so it must still surface as an operational signal.
      if (data?.code === 'PROVIDER_UNAVAILABLE' && (data?.httpStatus ?? 200) >= 500) {
        void captureServerFailure(null, { surface:'firewall', code:'PROVIDER_TIMEOUT', status:data.httpStatus, pathname:url.pathname, dependency:'temporarily unavailable', operation:'POST' });
      }
      const status = httpStatus ?? (operation === 'create' ? 201 : 200);
      if (status >= 400) {
        return Response.json(errorBody({ status, code: payload.code, message: payload.message, dependencyStatus: payload.dependencyStatus,
          extra: payload.decision ? { decision: payload.decision, execution_status: payload.execution_status,
            external_action_executed: payload.external_action_executed, request_id: payload.request_id,
            policy_version: payload.policy_version, policy: payload.policy,
            review_required: payload.review_required, integration: payload.integration, blocked_reason: payload.blocked_reason } : {},
        }), { headers, status });
      }
      return Response.json(payload, { headers, status });
    } catch (error) {
      const known = error instanceof KernelError ? error : setupError(error);
      if (known) {
        const setup = ['FIREWALL_SCHEMA_MISSING', 'FIREWALL_SCHEMA_OUTDATED', 'FIREWALL_DB_PRIVILEGE'].includes(known.code);
        const dependencyStatus = known.dependencyStatus ?? (known.code.includes('SCHEMA') ? 'not configured' : known.code.includes('PRIVILEGE') ? 'access denied' : dependencyStatusForError(known));
        void captureServerFailure(error,{surface:'firewall',code:known.code,status:known.status,pathname:new URL(request.url).pathname,dependency:dependencyStatus,operation:'POST'});
        return Response.json(errorBody({ status: known.status, code: known.code, message: known.message, dependencyStatus, extra: setup ? { setup: true } : {} }), { headers, status: known.status });
      }
      void captureServerFailure(error,{surface:'firewall',code:'FIREWALL_UNAVAILABLE',status:503,pathname:new URL(request.url).pathname,dependency:'temporarily unavailable',operation:'POST'});
      return Response.json(errorBody({ code: 'FIREWALL_UNAVAILABLE', dependencyStatus:'temporarily unavailable', message: 'تعذر تأكيد نتيجة العملية؛ تحقق من إعداد قاعدة البيانات والسجل. لا تتابع خارج مسار الإنفاذ ولا تعِد التنفيذ تلقائيًا.' }), { headers, status: 503 });
    }
  };
}
export const handle = createHandler();
