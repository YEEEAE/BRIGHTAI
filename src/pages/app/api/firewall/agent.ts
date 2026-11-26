import type { APIRoute } from 'astro';
import { kernelHandler } from '../../../../server/kernel/http.mjs';
import { agentTenant } from '../../../../server/agents/http.mjs';
import { firewallAgent } from '../../../../server/agents/instance.mjs';
import { KernelError } from '../../../../server/kernel/core.mjs';

export const prerender = false;
export const POST: APIRoute = kernelHandler(async (identity, workspace, body) => {
  const tenantId = await agentTenant(identity, workspace);
  try {
    return await firewallAgent.run(identity, tenantId, body);
  } catch (error) {
    if (error instanceof KernelError) throw error;
    const code = error instanceof Error ? error.message : '';
    const known: Record<string, [number, string]> = {
      PROVIDER_NOT_CONFIGURED: [503, 'لا يوجد مزوّد ونموذج معتمدان لهذه المؤسسة؛ لم يُرسل الطلب.'],
      AGENT_REPLAY_BLOCKED: [409, 'سبق استخدام معرّف التشغيل؛ لم تُعد العملية.'],
      FIREWALL_TOOL_BLOCKED: [403, 'منعت السياسة استدعاء الأداة؛ لم يُرسل الطلب.'],
      FIREWALL_INPUT_BLOCKED: [403, 'منعت سياسة Firewall إرسال الطلب.'],
      FIREWALL_DECISION_CHANGED: [409, 'تغيّر القرار أو إصدار السياسة؛ لم تُعتمد النتيجة.'],
      FIREWALL_OUTPUT_BLOCKED: [422, 'حُجب رد المزوّد وفق سياسة المخرجات.'],
    };
    const entry = known[code];
    if (entry) throw new KernelError(entry[0], code, entry[1]);
    throw error;
  }
}, true);
