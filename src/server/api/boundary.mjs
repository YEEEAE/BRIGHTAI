import { randomUUID } from 'node:crypto';
import { errorSchema, firewallErrorEvidence, idempotencyKeySchema, queryMatches } from './schemas.mjs';
import { queryShape, resolveRoute } from './routes.mjs';

const keyedCreates = new Set(['/app/api/kernel', '/app/api/human-gate/requests', '/app/api/risk-engine/assets', '/app/api/risk-engine/assist']);

const statusErrors = {
  400: ['INVALID_REQUEST', 'بيانات الطلب غير صالحة.'],
  401: ['UNAUTHORIZED', 'يتطلب الطلب تسجيل الدخول.'],
  403: ['FORBIDDEN', 'الطلب غير مسموح.'],
  404: ['NOT_FOUND', 'المسار غير متاح.'],
  405: ['METHOD_NOT_ALLOWED', 'طريقة الطلب غير مدعومة.'],
  409: ['CONFLICT', 'تعارض الطلب مع الحالة الحالية.'],
  413: ['BODY_TOO_LARGE', 'تجاوز الطلب الحجم المسموح.'],
  415: ['UNSUPPORTED_MEDIA_TYPE', 'صيغة الطلب غير مدعومة.'],
  422: ['INVALID_REQUEST', 'قيم الطلب غير صالحة.'],
  429: ['RATE_LIMITED', 'تجاوز الطلب الحد المسموح.'],
  503: ['SERVICE_UNAVAILABLE', 'الخدمة غير متاحة مؤقتًا.'],
};

export function apiError(status, requestId, input = {}) {
  const [code, message] = statusErrors[status] ?? ['REQUEST_FAILED', 'تعذر إكمال الطلب.'];
  const fallback = { code, message, dependencyStatus: status >= 500 ? 'temporarily unavailable' : null, requestId };
  const result = errorSchema.safeParse({
    code: input.code ?? code,
    message: input.message ?? message,
    dependencyStatus: input.dependencyStatus ?? fallback.dependencyStatus,
    requestId,
    ...input.firewallEvidence,
  });
  return result.success ? result.data : fallback;
}

export async function apiBoundary(request, path, next) {
  const requestId = randomUUID();
  const resolved = resolveRoute(path);
  const params = new URL(request.url).searchParams;
  let response;
  let mapped;
  try {
    if (!resolved) response = new Response(null, { status: 404 });
    else if (!resolved.route.methods.includes(request.method)) {
      response = new Response(null, { status: 405, headers: { Allow: resolved.route.methods.join(', ') } });
    } else if (!resolved.validParams || !queryMatches(params, queryShape(resolved.route.path, request.method, params))) {
      response = new Response(null, { status: 400 });
      mapped = { code: 'INVALID_REQUEST' };
    } else if (request.headers?.has('Idempotency-Key')
      && (request.method !== 'POST' || !keyedCreates.has(resolved.route.path)
        || !idempotencyKeySchema.safeParse(request.headers.get('Idempotency-Key')).success)) {
      response = new Response(null, { status: 400 });
      mapped = { code: 'INVALID_IDEMPOTENCY_KEY' };
    } else {
      response = await next();
      if (response.status >= 400 && response.headers.get('Content-Type')?.includes('application/json')) {
        const body = await response.json().catch(() => null);
        // Only application-owned error bodies may supply the public message.
        const own = body?.contract?.error === 'aigas-error-v1';
        const evidence = own && resolved.route.path === '/app/api/firewall/guarded-executions'
          ? firewallErrorEvidence.safeParse(body) : null;
        mapped = { firewallEvidence: evidence?.success ? evidence.data : undefined, code: body?.code ?? body?.errorType ?? (typeof body?.error === 'string' ? body.error : undefined), message: own ? body.message : undefined, dependencyStatus: body?.dependencyStatus };
      }
    }
  } catch {
    response = new Response(null, { status: 500 });
  }

  const headers = new Headers(response.headers);
  headers.set('X-Request-ID', requestId);
  for (const name of [...headers.keys()]) {
    if (name.startsWith('access-control-allow-')) headers.delete(name);
  }
  if (response.status < 400) return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers });

  headers.set('X-AIGAS-Error-Contract', 'aigas-error-v2');
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.delete('Content-Length');
  return new Response(request.method === 'HEAD' ? null : JSON.stringify(apiError(response.status, requestId, mapped)), {
    status: response.status, headers,
  });
}
