import { approvedProvider } from './provider.mjs';

// Called only after the mandatory policy decision AND Kernel audit COMMIT.
// The HTTP layer never receives the server-only forwarding text. There is no
// client decision token, arbitrary URL, alternate prompt or provider override.
export async function enforceDecision({ decision, tenantId, forwardText }) {
  const base = { decision, persisted: true, external_action_executed: false, execution_status: 'NOT_EXECUTED' };
  if (decision.action === 'BLOCK') return { ...base, httpStatus: 403, code: 'POLICY_BLOCKED', message: 'حُجب الطلب قبل أي استدعاء لمزود AI.' };
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
    return { decision, persisted: true, external_action_executed: true,
      execution_status: decision.action === 'REDACT' ? 'REDACTED_AND_EXECUTED' : 'EXECUTED',
      response_text: output, httpStatus: 200 };
  } catch {
    // A timeout cannot prove that the provider did not receive the request.
    return { decision, persisted: true, external_action_executed: null, execution_status: 'UNKNOWN', httpStatus: 503,
      code: 'PROVIDER_UNAVAILABLE', message: 'تعذر تأكيد نتيجة المزود؛ قد يكون الطلب وصل. لا تعِد الإرسال تلقائيًا.' };
  } finally { clearTimeout(timer); }
}
