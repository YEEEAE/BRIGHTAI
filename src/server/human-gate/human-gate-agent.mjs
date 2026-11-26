import { KernelError } from '../kernel/core.mjs';
import { uuid } from './core.mjs';
import { operate } from './service.mjs';

// The existing service performs authentication-scoped product and review checks.
// This adapter can only read a task; it has no decision or execution tool.
export async function summarizeHumanGateRequest(identity, tenantId, requestId, service = operate) {
  if (!uuid(identity?.userId) || !uuid(tenantId) || !uuid(requestId)) throw new KernelError(400, 'INVALID_REFERENCE', 'مرجع الطلب غير صالح.');
  const params = new URLSearchParams({ view: 'review', request: requestId });
  const result = await service(identity, tenantId, 'list', {}, params);
  const request = result.requests.find(item => item.id === requestId);
  if (!request || !request.canDecide) throw new KernelError(404, 'NOT_FOUND', 'الطلب غير متاح للمراجعة.');
  return {
    advisory_only: true, decision_authority: false, execution_authority: false,
    summary: { operation: request.operation_type, status: request.status, expires_at: request.expires_at },
    risks: ['تغيير العملية أو السياسة أو الصلاحية يبطل الربط.', 'القرار البشري المستقل مطلوب؛ لا يُنفذ الطلب تلقائيًا.'],
    recommendation: 'راجع الهدف والبصمة والسياسة والأدلة قبل اتخاذ قرار مستقل.',
    sources: [{ type: 'human-gate-request', id: request.id, policy_version: request.policy_version, payload_digest: request.payload_digest }],
  };
}
