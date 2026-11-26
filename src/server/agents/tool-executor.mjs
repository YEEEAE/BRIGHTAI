// P03 — tool messages, allowlist and pre/post policy enforcement. A tool is a
// server-injected local handler; this module never invokes a network provider
// and never accepts a handler, credential or context from a request body.

import { z } from 'zod';
import { KernelError } from '../kernel/core.mjs';
import { LIMITS, manifestFor, toolFor, reference, isUuid, policyVersion } from './contracts.mjs';

const namePattern = /^[a-z][a-z0-9-]{1,63}$/;
const valuePattern = /^[a-z][a-z0-9:.-]{0,79}$/;
export const toolMessageSchema = z.strictObject({
  tool: z.string().regex(namePattern),
  action: z.string().regex(valuePattern),
  resource: z.string().regex(valuePattern),
  capability: z.string().regex(valuePattern),
  version: z.number().int().positive().max(1000),
  arguments: z.record(z.string().max(64), z.json()).optional(),
});
export const toolResultSchema = z.strictObject({
  tool: z.string().regex(namePattern),
  status: z.enum(['ALLOWED','DENIED','EXECUTED','FAILED','CANCELLED']),
  outcome: z.enum(['ALLOW','DENY','NEEDS_APPROVAL','UNAVAILABLE']),
  summary: z.string().min(1).max(LIMITS.maxSummaryChars),
  result_ref: z.string().nullable(),
  policy_version: z.string().regex(/^[a-zA-Z0-9_.:-]{1,64}$/),
  reason: z.string().regex(/^[A-Z][A-Z0-9_]{0,79}$/),
});

function boundedJson(value, maxBytes) {
  const serialized = JSON.stringify(value ?? {});
  if (Buffer.byteLength(serialized, 'utf8') > maxBytes) throw new KernelError(413, 'TOOL_PAYLOAD_TOO_LARGE', 'حجم بيانات الأداة يتجاوز الحد المسموح.');
  return serialized;
}

function withDeadline(work, ms, signal) {
  if (signal?.aborted) return Promise.reject(new KernelError(409, 'RUN_CANCELLED', 'أُلغي التشغيل؛ لم تُنفذ الأداة.'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new KernelError(504, 'TOOL_TIMEOUT', 'انتهت مهلة الأداة؛ لم يُؤكد التنفيذ.')), ms);
    const onAbort = () => reject(new KernelError(409, 'RUN_CANCELLED', 'أُلغي التشغيل؛ لم تُنفذ الأداة.'));
    signal?.addEventListener('abort', onAbort, { once: true });
    Promise.resolve().then(work).then(value => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); resolve(value); },
      error => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); reject(error); });
  });
}

export function createToolExecutor({ tools = Object.create(null), evaluatePolicy, now = () => new Date(), timeoutMs = 5000 } = {}) {
  const handlers = Object.freeze({ ...tools });
  const check = async (tx, identity, tenantId, manifest, message, resourceType) => {
    if (!evaluatePolicy) throw new KernelError(503, 'POLICY_UNAVAILABLE', 'لم يتوفر مُقيّم سياسة Kernel؛ لم تُنفذ الأداة.', 'not configured');
    const decision = await evaluatePolicy(tx, identity, tenantId, {
      productSlug: manifest.product, operation: 'agent.tool.' + message.action, resource_type: resourceType,
    });
    if (!decision || decision.decision !== 'ALLOW') {
      return { allowed: false, reason: decision?.reason ?? 'POLICY_UNAVAILABLE', obligations: decision?.obligations ?? [] };
    }
    return { allowed: true, reason: 'POLICY_ALLOW', obligations: decision.obligations ?? [] };
  };
  return {
    async execute({ tx, identity, tenantId, agentKey, toolId, message, signal, deadlineMs = timeoutMs }) {
      const parsed = toolMessageSchema.safeParse(message);
      if (!parsed.success) throw new KernelError(400, 'INVALID_TOOL_MESSAGE', 'رسالة الأداة غير صالحة.');
      const call = parsed.data;
      const manifest = manifestFor(agentKey);
      if (!manifest) throw new KernelError(404, 'AGENT_UNKNOWN', 'الوكيل غير معروف.');
      const allowed = manifest.tools.includes(call.tool);
      const definition = toolFor(call.tool);
      if (!allowed || !definition || definition.version !== String(call.version)
        || definition.capability !== call.capability || !definition.actions.includes(call.action)
        || !definition.resources.some(resource => call.resource === resource || call.resource.startsWith(resource + ':'))) {
        return toolResultSchema.parse({ tool: call.tool, status: 'DENIED', outcome: 'DENY', summary: 'الأداة غير مدرجة في تصريح الوكيل.', result_ref: null,
          policy_version: policyVersion(agentKey), reason: 'TOOL_NOT_ALLOWED' });
      }
      boundedJson(call.arguments ?? {}, LIMITS.maxArgumentsBytes);
      const pre = await check(tx, identity, tenantId, manifest, call, call.resource);
      if (!pre.allowed) {
        return toolResultSchema.parse({ tool: call.tool, status: 'DENIED', outcome: pre.obligations.includes('REQUEST_APPROVAL') ? 'NEEDS_APPROVAL' : 'DENY',
          summary: 'منعت سياسة Kernel استدعاء الأداة.', result_ref: null, policy_version: policyVersion(agentKey),
          reason: pre.obligations.includes('REQUEST_APPROVAL') ? 'APPROVAL_REQUIRED' : 'POLICY_BLOCKED' });
      }
      const handler = handlers[call.tool];
      if (typeof handler !== 'function') {
        return toolResultSchema.parse({ tool: call.tool, status: 'FAILED', outcome: 'UNAVAILABLE', summary: 'معالج الأداة غير مهيأ على هذه البيئة.',
          result_ref: null, policy_version: policyVersion(agentKey), reason: 'TOOL_UNAVAILABLE' });
      }
      let raw;
      try {
        raw = await withDeadline(() => handler({ identity, tenantId, agentKey, message: call, signal }), Math.min(deadlineMs, timeoutMs), signal);
      } catch (error) {
        const cancelled = error?.code === 'RUN_CANCELLED';
        return toolResultSchema.parse({ tool: call.tool, status: cancelled ? 'CANCELLED' : 'FAILED', outcome: 'UNAVAILABLE',
          summary: cancelled ? 'أُلغي الاستدعاء قبل التنفيذ.' : 'تعذر تنفيذ الأداة؛ لم يُؤكد نتيجة خارجية.',
          result_ref: null, policy_version: policyVersion(agentKey), reason: cancelled ? 'RUN_CANCELLED' : 'TOOL_EXECUTION_FAILED' });
      }
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !['ALLOW','DENY'].includes(raw.outcome)) {
        return toolResultSchema.parse({ tool: call.tool, status: 'FAILED', outcome: 'UNAVAILABLE', summary: 'نتيجة الأداة غير مطابقة للعقد.',
          result_ref: null, policy_version: policyVersion(agentKey), reason: 'INVALID_TOOL_RESULT' });
      }
      boundedJson(raw.data ?? null, LIMITS.maxResultBytes);
      const post = await check(tx, identity, tenantId, manifest, call, call.resource + ':result');
      const status = !post.allowed ? 'DENIED' : raw.outcome === 'DENY' ? 'FAILED' : 'EXECUTED';
      const resultRef = status === 'EXECUTED' && isUuid(toolId) ? reference(tenantId, 'tool', toolId) : null;
      return toolResultSchema.parse({
        tool: call.tool, status, outcome: !post.allowed ? 'DENY' : raw.outcome,
        summary: String(raw.summary ?? '').slice(0, LIMITS.maxSummaryChars) || 'نتيجة أداة محدودة',
        result_ref: resultRef, policy_version: policyVersion(agentKey),
        reason: !post.allowed ? 'POLICY_BLOCKED_AFTER' : raw.outcome === 'ALLOW' ? 'TOOL_EXECUTED' : 'TOOL_DENIED',
      });
    },
    schemas: Object.freeze({ message: toolMessageSchema, result: toolResultSchema }),
  };
}
