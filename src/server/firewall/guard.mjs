import { approvedProvider } from './provider.mjs';

// Called only after the mandatory policy decision AND Kernel audit COMMIT.
// The HTTP layer never receives the server-only forwarding text. There is no
// client decision token, arbitrary URL, alternate prompt or provider override.
export async function enforceDecision({ decision, tenantId, forwardText, kernelPolicy }) {
  const base = {
    decision,
    policy: kernelPolicy ? { decision: kernelPolicy.decision, reason: kernelPolicy.reason, policies: kernelPolicy.policies ?? [], warnings: kernelPolicy.warnings ?? [] } : null,
    persisted: true, external_action_executed: false, execution_status: 'NOT_EXECUTED',
  };
  // DENY is the final state; nothing downstream may soften it.
  if (decision.action === 'DENY') return { ...base, httpStatus: 403, code: 'POLICY_BLOCKED', message: 'حُجب الطلب قبل أي استدعاء لمزود AI.' };
  // ESCALATE needs a human decision. No approval path is enabled in this release,
  // so the safe outcome is to stop instead of treating silence as consent.
  if (decision.action === 'ESCALATE') {
    return { ...base, httpStatus: 409, code: 'ESCALATION_REQUIRED', review_required: true,
      message: 'القرار يتطلب موافقة بشرية مخولة، ولا يوجد مسار موافقة مفعّل في هذه النسخة؛ لم يُرسل الطلب.' };
  }
  // WARN is a conditional state, never an unconditional allow. Without an
  // approved warning policy the guard refuses to forward it.
  if (decision.action === 'WARN') {
    return { ...base, httpStatus: 409, code: 'WARNING_NOT_FORWARDED',
      message: 'سجّل الفحص تحذيرًا سياسيًا؛ التحذير لا يسمح بالتمرير التلقائي، لذلك لم يُرسل الطلب.' };
  }
  if (!['ALLOW', 'REDACT'].includes(decision.action) || typeof forwardText !== 'string' || !forwardText.length) {
    return { ...base, httpStatus: 503, code: 'INVALID_GUARD_DECISION', message: 'تعذر تطبيق القرار؛ لم يُرسل الطلب.' };
  }
  const provider = approvedProvider(tenantId);
  if (!provider) return { ...base, httpStatus: 503, code: 'PROVIDER_NOT_CONFIGURED', message: 'حُفظ قرار السياسة، لكن لا توجد جهة AI معتمدة ومهيأة لهذه المؤسسة؛ لم يُرسل الطلب.' };
  const controller = new AbortController();
  let timer;
  try {
    // Only evaluated output is available to the adapter, never the raw request.
    // No automatic retries or fallback to another provider.
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('PROVIDER_TIMEOUT')); }, 15000);
    });
    const output = await Promise.race([provider.generate({ text: forwardText, signal: controller.signal }), deadline]);
    if (typeof output !== 'string' || output.length > 16000) throw new Error('INVALID_PROVIDER_RESPONSE');
    return { ...base, external_action_executed: true,
      execution_status: decision.action === 'REDACT' ? 'REDACTED_AND_EXECUTED' : 'EXECUTED',
      response_text: output, httpStatus: 200 };
  } catch {
    // A timeout cannot prove that the provider did not receive the request.
    return { ...base, external_action_executed: null, execution_status: 'UNKNOWN', httpStatus: 503,
      code: 'PROVIDER_UNAVAILABLE', message: 'تعذر تأكيد نتيجة المزود؛ قد يكون الطلب وصل. لا تعِد الإرسال تلقائيًا.' };
  } finally { clearTimeout(timer); }
}
