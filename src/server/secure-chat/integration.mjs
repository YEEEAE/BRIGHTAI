import { randomUUID, createHash } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';
import { evaluateKernelPolicy } from '../kernel/policies.mjs';
import { evaluate, MAX_TEXT_LENGTH } from '../firewall/core.mjs';
import { policyReference } from '../firewall/binding.mjs';
import { audit } from '../kernel/service.mjs';
import { approvedEgress } from './policy.mjs';

// All history (including assistant turns) is untrusted. Preserve roles and apply
// the same enforced Firewall rules to every turn, before and after redaction.
export function protectContext(messages, rules) {
  if (!Array.isArray(messages) || !messages.length) throw new KernelError(400, 'INVALID_HISTORY', 'يلزم سياق محادثة صالح.');
  const baseline = approvedEgress(messages);
  return Object.freeze(baseline.map(item => {
    if (item.content.length > MAX_TEXT_LENGTH) throw new KernelError(413, 'CONTEXT_LIMIT', 'أحد عناصر السياق يتجاوز حد فحص Firewall؛ ابدأ محادثة جديدة.');
    const result = evaluate(item.content, rules, { enforce: true });
    if (!['ALLOW', 'REDACT'].includes(result.action)) throw new KernelError(403, 'CHAT_POLICY_DENIED', 'حجبت سياسة المؤسسة السياق؛ لم يُرسل إلى المزود.');
    const content = result.action === 'REDACT' ? result.output : item.content;
    // Redaction must not reveal a previously hidden deny/warning/escalation.
    const checked = evaluate(content, rules, { enforce: true });
    if (checked.action !== 'ALLOW') throw new KernelError(403, 'CHAT_POLICY_DENIED', 'تعذر تأكيد السماح بالسياق المنقح؛ لم يُرسل إلى المزود.');
    return Object.freeze({ role: item.role, content });
  }));
}

// Caller owns a transaction, verified Chat access and the tenant lock. This is
// local policy evaluation: it neither invokes nor requires a Firewall AI provider.
export async function chatPolicyContext(db, identity, tenantId, model) {
  const kernel = await evaluateKernelPolicy(db, identity, tenantId, {
    productSlug: 'secure-chat', operation: 'secure-chat.send', resource_type: 'text',
    data_classification: 'SYNTHETIC', provider: new URL(model.endpoint).hostname === 'api.groq.com' ? 'groq' : new URL(model.endpoint).hostname, model: model.providerModel, region: model.region,
  });
  const rules = (await db.query('SELECT id,name,template,match_type,pattern,action,priority,enabled,version FROM public.aigas_fw_rules WHERE tenant_id=$1 ORDER BY priority,id', [tenantId])).rows;
  const probe = evaluate('readiness', rules, { enforce: false });
  const ready = kernel?.decision === 'ALLOW' && rules.some(rule => rule.enabled && rule.action === 'ALLOW') && !['NO_ACTIVE_POLICY', 'INVALID_POLICY'].includes(probe.reason);
  return { kernel, rules, ready };
}

export async function authorizeChatContext(db, identity, tenantId, requestId, model, messages) {
  const { kernel, rules, ready } = await chatPolicyContext(db, identity, tenantId, model);
  let outbound, error;
  try {
    if (!ready) throw new KernelError(403, 'CHAT_POLICY_DENIED', 'سياسة Kernel أو Firewall غير متاحة أو لا تسمح بالإرسال.');
    outbound = protectContext(messages, rules);
  } catch (caught) { error = caught; }
  // Only references, rule versions and decisions enter durable evidence. No
  // message, response, literal rule pattern or content hash is stored here.
  const policyVersion = `sc:${createHash('sha256').update(JSON.stringify([policyReference(kernel), rules.map(rule => [rule.id, rule.version, rule.enabled])])).digest('hex')}`;
  await db.query('INSERT INTO public.aigas_kernel_policy_decisions(id,tenant_id,actor_user_id,product_slug,operation,decision,reason,policy_chain,request_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)',
    [randomUUID(), tenantId, identity.userId, 'secure-chat', 'secure-chat.send', kernel.decision, kernel.reason, JSON.stringify(kernel.policies ?? []), requestId]);
  await audit(db, identity, tenantId, error ? 'secure_chat.policy.denied' : 'secure_chat.policy.allowed', { correlationId: requestId, policyVersion, idempotencyKey: `secure-chat:${requestId}:policy` });
  // Return denial so its evidence can commit before the caller throws.
  return { outbound, error, policyVersion };
}
