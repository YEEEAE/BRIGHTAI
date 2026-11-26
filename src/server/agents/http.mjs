// P03 — HTTP helpers for agent endpoints. Tenant identity is resolved from the
// verified session and the workspace selector, never from a request body.

import { KernelError, isUuid } from '../kernel/core.mjs';
import { tenantGuard } from '../kernel/service.mjs';

export async function agentTenant(identity, workspace) {
  if (!isUuid(identity?.userId)) throw new KernelError(401, 'UNAUTHORIZED', 'سجّل الدخول لتشغيل الوكلاء.');
  const scope = await tenantGuard(identity, workspace);
  if (!scope.tenant) throw new KernelError(403, 'NO_WORKSPACE', 'أنشئ مساحة عمل من Kernel أولًا.');
  return scope.tenant.tenant_id;
}

export function requestedRunId(request) {
  const path = new URL(request.url).pathname;
  const match = /\/app\/api\/agents\/runs\/([^/]+)(?:\/|$)/.exec(path);
  if (!match || !isUuid(match[1])) throw new KernelError(400, 'INVALID_RUN_ID', 'معرّف التشغيل غير صالح.');
  return match[1];
}
